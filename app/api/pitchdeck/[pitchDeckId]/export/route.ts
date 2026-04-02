import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { db } from "@/server/db/client";

function wrapText(text: string, maxLen = 95) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLen) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function stringifyUnknown(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map((item) => stringifyUnknown(item)).filter(Boolean).join("\n\n");
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of ["generated", "rewritten", "content", "text", "summary", "body"]) {
      const candidate = obj[key];
      if (!candidate) continue;
      const rendered = stringifyUnknown(candidate);
      if (rendered) return rendered;
    }
    return JSON.stringify(value, null, 2);
  }
  return "";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pitchDeckId: string }> },
) {
  const { pitchDeckId } = await params;
  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const versionId = request.nextUrl.searchParams.get("versionId");
  const format = (request.nextUrl.searchParams.get("format") ?? "pdf").toLowerCase();

  const deck = await db.pitchDeck.findUnique({
    where: { id: pitchDeckId },
    include: {
      reports: { orderBy: { createdAt: "desc" }, take: 1 },
      versions: versionId
        ? { where: { id: versionId }, orderBy: { createdAt: "desc" }, take: 1 }
        : { orderBy: { createdAt: "desc" }, take: 1 },
      sections: { orderBy: { sectionOrder: "asc" }, take: 50 },
    },
  });
  if (!deck) return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  if (session.user.role !== "ADMIN" && deck.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const latestReport = deck.reports[0];
  const selectedVersion = deck.versions[0] ?? null;
  const payload = {
    deckId: deck.id,
    fileName: deck.originalFileName,
    generatedAt: new Date().toISOString(),
    factuality: {
      note: "All exported scores and summaries are derived from stored deck/report data. No synthetic KPIs are added.",
    },
    report: latestReport
      ? {
          deckType: latestReport.deckType,
          clarityScore: latestReport.clarityScore,
          completenessScore: latestReport.completenessScore,
          investorReadinessScore: latestReport.investorReadinessScore,
          strengths: latestReport.strengths,
          risks: latestReport.risks,
          nextSteps: latestReport.nextSteps,
          missingInformation: latestReport.missingInformation,
        }
      : null,
    sections: deck.sections.map((section) => ({
      title: section.sectionTitle,
      quality: section.qualityLabel,
      fixSummary: section.fixSummary,
      preview: section.extractedText.slice(0, 450),
    })),
    selectedVersion: selectedVersion
      ? {
          id: selectedVersion.id,
          name: selectedVersion.name,
          type: selectedVersion.versionType,
          content: selectedVersion.contentJson,
        }
      : null,
  };

  if (format === "json") {
    return NextResponse.json(payload);
  }

  if (format === "summary") {
    const lines = [
      "Webcoin Labs Pitch Deck Summary",
      `Deck: ${deck.originalFileName}`,
      `Generated: ${new Date().toISOString()}`,
      "",
      "Readiness:",
      `- Deck type: ${latestReport?.deckType ?? "unclear"}`,
      `- Clarity: ${latestReport?.clarityScore ?? "N/A"}`,
      `- Completeness: ${latestReport?.completenessScore ?? "N/A"}`,
      `- Investor readiness: ${latestReport?.investorReadinessScore ?? "N/A"}`,
      "",
      "Note:",
      "- This summary only reflects stored analysis and extracted sections.",
    ];
    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename=\"pitch-deck-${deck.id}-summary.txt\"`,
      },
    });
  }

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  let page = pdf.addPage([595, 842]);
  let y = 800;
  const left = 42;
  const writeLine = (line: string, size = 10) => {
    if (y < 42) {
      page = pdf.addPage([595, 842]);
      y = 800;
    }
    page.drawText(line, {
      x: left,
      y,
      size,
      font,
      color: rgb(0.12, 0.12, 0.12),
    });
    y -= size + 4;
  };

  writeLine("Webcoin Labs Pitch Deck Export", 14);
  writeLine(`Deck: ${deck.originalFileName}`, 10);
  writeLine(`Generated: ${new Date().toLocaleString()}`, 10);
  writeLine("");
  if (latestReport) {
    writeLine("Readiness Summary", 12);
    writeLine(`Deck Type: ${latestReport.deckType ?? "unclear"}`);
    writeLine(`Clarity: ${latestReport.clarityScore ?? "N/A"}`);
    writeLine(`Completeness: ${latestReport.completenessScore ?? "N/A"}`);
    writeLine(`Investor Readiness: ${latestReport.investorReadinessScore ?? "N/A"}`);
    writeLine("");
  }
  if (selectedVersion) {
    writeLine(`Version: ${selectedVersion.name} (${selectedVersion.versionType})`, 12);
    for (const line of wrapText(stringifyUnknown(selectedVersion.contentJson).slice(0, 3000) || "No version body available.")) {
      writeLine(line, 9);
    }
    writeLine("");
  }
  writeLine("Section Analysis", 12);
  for (const section of deck.sections) {
    writeLine(`${section.sectionOrder + 1}. ${section.sectionTitle} [${section.qualityLabel}]`, 10);
    for (const line of wrapText(section.fixSummary ?? "No fix summary available.")) {
      writeLine(`- ${line}`, 9);
    }
    writeLine("");
  }

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="pitch-deck-${deck.id}.pdf"`,
    },
  });
}

