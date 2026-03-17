import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export type DeckFileKind = "PDF" | "DOCX";

async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const parsed = await parser.getText();
    return parsed.text?.trim() ?? "";
  } finally {
    await parser.destroy();
  }
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const parsed = await mammoth.extractRawText({ buffer });
  return parsed.value?.trim() ?? "";
}

export async function extractDeckText(buffer: Buffer, kind: DeckFileKind): Promise<string> {
  const text = kind === "PDF" ? await extractPdfText(buffer) : await extractDocxText(buffer);
  const normalized = text.replace(/\u0000/g, "").trim();
  if (!normalized) {
    throw new Error("Could not extract readable text from the uploaded document.");
  }
  return normalized.slice(0, 140_000);
}
