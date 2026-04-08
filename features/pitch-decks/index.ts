export type { PitchDeckActionResult, PitchDeckSummary, PitchDeckWorkspaceData, DeckProcessingStatus, DeckUploadStatus, DeckFileKind } from "./types";
export type { PitchActor } from "./pitchdeck.guards";
export { hasPremiumPitchDeckAccess } from "./pitchdeck.guards";
export {
  ensureDeckOwnership,
  buildDeckStartupContext,
  loadPitchDeckWorkspaceData,
  findLatestDeckForUser,
  listDecksForFounder,
} from "./pitchdeck.queries";
export {
  getDeckKind,
  detectKindFromBuffer,
  validateUploadedFile,
  MAX_PITCH_DECK_BYTES,
} from "./pitchdeck.validation";
