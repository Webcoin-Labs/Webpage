import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/server/db/client";

export const metadata = { title: "Pitch Decks — Admin | Webcoin Labs" };

export default async function AdminPitchDecksPage() {
  const session = await getServerSession();
  if (session?.user.role !== "ADMIN") redirect("/app");

  const decks = await db.pitchDeck.findMany({
    include: {
      user: { select: { name: true, email: true } },
      reports: { orderBy: { createdAt: "desc" }, take: 1 },
      project: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-8 py-8">
      <Link href="/app/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Back to Admin
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Pitch Deck Uploads & AI Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">Monitor deck ingestion, extraction and AI analysis status.</p>
      </div>

      {decks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No pitch decks uploaded yet.</p>
      ) : (
        <div className="space-y-3">
          {decks.map((deck) => {
            const report = deck.reports[0];
            return (
              <div key={deck.id} className="rounded-xl border border-border/50 bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm">{deck.originalFileName}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {deck.user.name ?? deck.user.email ?? "Unknown"} {deck.project ? `· Project: ${deck.project.name}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload: {deck.uploadStatus} · Processing: {deck.processingStatus} · Report: {report?.status ?? "QUEUED"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Provider: {deck.analysisProvider ?? "N/A"} · Model: {report?.modelName ?? "N/A"} · Type: {report?.deckType ?? "unclear"} · Clarity: {report?.clarityScore ?? "—"} · Readiness: {report?.investorReadinessScore ?? "—"}
                    </p>
                    {report?.errorMessage ? (
                      <p className="text-xs text-destructive mt-1">Error: {report.errorMessage}</p>
                    ) : null}
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(deck.createdAt).toLocaleString()}</span>
                </div>
                <div className="mt-3 text-xs text-muted-foreground space-y-2">
                  <p>{report?.marketPositioningSummary ?? "No market positioning summary yet."}</p>
                  <p>{report?.fundingReadinessNotes ?? "No funding readiness notes yet."}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

