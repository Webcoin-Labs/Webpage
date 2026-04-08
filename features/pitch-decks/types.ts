/**
 * PitchDeck domain types — shared read-models for the feature layer.
 *
 * These are INDEPENDENT of Prisma generated types so that the feature layer
 * is never coupled to the DB schema directly. Components import from here.
 */

export type PitchDeckActionResult =
  | { success: true; pitchDeckId: string; reportId: string }
  | { success: false; error: string };

export type DeckProcessingStatus =
  | "QUEUED"
  | "EXTRACTING"
  | "ANALYZING"
  | "COMPLETED"
  | "FAILED";

export type DeckUploadStatus = "RECEIVED" | "STORED" | "FAILED";

export type DeckFileKind = "PDF" | "DOCX";

export interface PitchDeckSummary {
  id: string;
  userId: string;
  originalFileName: string;
  fileType: string;
  fileSize: number;
  uploadStatus: DeckUploadStatus;
  processingStatus: DeckProcessingStatus;
  analysisProvider: string | null;
  projectId: string | null;
  project: { id: string; name: string } | null;
  latestReportId: string | null;
  latestReportStatus: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PitchDeckWorkspaceData {
  isPremium: boolean;
  decks: unknown[];
  projects: Array<{ id: string; name: string }>;
  ventures: Array<{ id: string; name: string }>;
  now: string;
}
