import "server-only";

import path from "path";
import type { DeckFileKind } from "@/lib/extraction/deckText";

/**
 * pitchdeck.validation.ts
 * -----------------------
 * File-validation helpers extracted from `app/actions/pitchdeck.ts`.
 *
 * Pure functions — zero I/O, fully unit-testable.
 */

export const MAX_PITCH_DECK_BYTES = 14 * 1024 * 1024; // 14 MB

const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx"]);
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

// PDF magic bytes: %PDF
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46];
// DOCX / ZIP magic bytes: PK
const DOCX_MAGIC = [0x50, 0x4b];

/**
 * getDeckKind
 * -----------
 * Infers DeckFileKind from file extension + MIME type.
 * Returns null if the combination is unrecognised.
 */
export function getDeckKind(
  fileName: string,
  mimeType: string
): DeckFileKind | null {
  const ext = path.extname(fileName || "").toLowerCase();
  const mime = mimeType.toLowerCase();

  if (ext === ".pdf" || mime === "application/pdf") return "PDF";
  if (
    ext === ".docx" ||
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "DOCX";
  }
  return null;
}

/**
 * detectKindFromBuffer
 * --------------------
 * Inspects the raw byte signature to confirm the actual file format,
 * independent of what the client claims.
 */
export function detectKindFromBuffer(buffer: Buffer): DeckFileKind | null {
  if (buffer.length < 4) return null;

  if (PDF_MAGIC.every((b, i) => buffer[i] === b)) return "PDF";
  if (DOCX_MAGIC.every((b, i) => buffer[i] === b)) return "DOCX";

  return null;
}

/**
 * validateUploadedFile
 * --------------------
 * Validates size, extension, MIME type, and infers DeckFileKind.
 * Returns `{ kind }` on success or `{ error }` on failure.
 */
export function validateUploadedFile(
  file: File | null
): { kind: DeckFileKind } | { error: string } {
  if (!file) return { error: "Please upload a PDF or DOCX file." };
  if (file.size <= 0) return { error: "Uploaded file is empty." };
  if (file.size > MAX_PITCH_DECK_BYTES) {
    return { error: "File too large. Maximum is 14MB." };
  }

  const ext = path.extname(file.name || "").toLowerCase();
  const mime = (file.type || "").toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME.has(mime)) {
    return { error: "Only PDF and DOCX files are allowed." };
  }

  const kind = getDeckKind(file.name, file.type);
  if (!kind) {
    return { error: "Unsupported document format. Upload PDF or DOCX." };
  }
  return { kind };
}
