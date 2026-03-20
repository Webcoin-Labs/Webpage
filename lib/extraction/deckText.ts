import "server-only";

export type DeckFileKind = "PDF" | "DOCX";

async function extractPdfText(buffer: Buffer): Promise<string> {
  const mod = await import("pdf-parse");
  const PDFParse = mod.PDFParse ?? (mod as any).default?.PDFParse;
  if (!PDFParse) {
    throw new Error("PDF parser is unavailable in the current runtime.");
  }
  const parser = new PDFParse({ data: Uint8Array.from(buffer) });
  try {
    const result = await parser.getText();
    return result.text?.trim() ?? "";
  } finally {
    await parser.destroy();
  }
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  type MammothExtractor = (input: { buffer: Buffer }) => Promise<{ value?: string }>;
  type MammothModule = {
    extractRawText?: MammothExtractor;
    default?: { extractRawText?: MammothExtractor };
  };

  const mammothModule = (await import("mammoth")) as MammothModule;
  const extractRawText = mammothModule.extractRawText ?? mammothModule.default?.extractRawText;
  if (!extractRawText) {
    throw new Error("DOCX extractor is unavailable in the current runtime.");
  }

  const parsed = await extractRawText({ buffer });
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
