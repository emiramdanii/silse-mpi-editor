/**
 * AI MPI JSON module — public API.
 *
 * Layer: core/ai-mpi-json
 *
 * Single canonical pipeline (FOUNDATION, AI-MPI-JSON-BLUEPRINT-01):
 *   raw JSON → validateAiMpiJson → normalizeAiMpiJson → aiBlueprintToSimpleProject
 *              (or → aiJsonToMpiContainer for the container path)
 *
 * Scene helpers (isGameMissionScene, AI_MPI_SCENE_GAME_MISSION) are
 * production utilities used by GameComponentView.
 *
 * LEGACY pipeline (MPI-JSON-SCENE-PROOF-01) is in ./legacy/ and is NOT
 * re-exported here. Only the test file mpi-json-scene-proof-01.test.tsx
 * imports from ./legacy/ directly. Once that test is ported to the new
 * schema, ./legacy/ will be deleted.
 */

// === Foundation schema types ===
export type {
  AiMpiBlueprint,
  AiBlueprintMetadata,
  AiBlueprintCurriculum,
  AiBlueprintCurriculumObjective,
  AiBlueprintStyleIntent,
  AiBlueprintDesignSystem,
  AiBlueprintFlow,
  AiBlueprintFlowStep,
  AiBlueprintPlacement,
  AiBlueprintSlot,
  AiBlueprintSlotContent,
  AiBlueprintGameAction,
  AiBlueprintReward,
  AiBlueprintScene,
  AiBlueprintSceneType,
  AiBlueprintSceneRole,
  AiBlueprintSceneNavigation,
  AiBlueprintAsset,
  AiBlueprintRuntime,
  AiBlueprintExportConfig,
  CustomStyleMap,
} from './schema';

// === Foundation validator ===
export {
  validateAiMpiJson,
  isValidAiMpiJson,
  type BlueprintValidationError,
} from './validateAiMpiJson';

// === Foundation normalizer ===
// AUDIT 5.9.4: normalizeAiMpiJson now resolves unambiguously to the
// foundation normalizer. Previously the barrel exported both
// normalizeAiMpiJson (kebab-case PoC) AND normalizeBlueprint (alias for
// the camelCase foundation one), which was a footgun — developers
// importing { normalizeAiMpiJson } from the barrel got the LEGACY
// normalizer by default.
//
// normalizeBlueprint is kept as a @deprecated alias for backward compat
// with 7 test files that still use it. New code should use normalizeAiMpiJson.
// The alias will be removed once all tests are updated.
export {
  normalizeAiMpiJson,
  AiMpiBlueprintError,
} from './normalizeAiMpiJson';

/** @deprecated Use normalizeAiMpiJson instead. Alias kept for backward compat. */
export { normalizeAiMpiJson as normalizeBlueprint } from './normalizeAiMpiJson';

// === Foundation container bridge ===
export { aiJsonToMpiContainer } from './aiJsonToMpiContainer';

// === BASELINE-SYNC: AiMpiBlueprint → SimpleProject bridge ===
export { aiBlueprintToSimpleProject } from './aiBlueprintToSimpleProject';

// === Scene helpers (production utilities, NOT legacy) ===
export {
  isGameMissionScene,
  AI_MPI_SCENE_GAME_MISSION,
} from './scene-helpers';

// === Round-trip verification (audit 1.4) ===
export { verifyRoundTrip, type RoundTripIssue } from './round-trip-verify';

// === Silent failure handler (import warnings) ===
export {
  collectImportWarnings,
  formatImportWarnings,
  isKnownSceneType,
  isKnownContentKind,
  type ImportWarning,
} from './silent-failure-handler';

// === Human-readable errors ===
export {
  translateErrors,
  formatHumanReadableErrors,
} from './human-readable-errors';

// ============================================================================
// @deprecated LEGACY re-exports (MPI-JSON-SCENE-PROOF-01)
// ============================================================================
// These are kept ONLY for the legacy test file mpi-json-scene-proof-01.test.tsx.
// Production code must NOT import from here — use the foundation pipeline above.
// Once the legacy test is ported to the new schema, this entire block + the
// ./legacy/ subfolder will be deleted.
//
// The legacy test imports directly from ./legacy/* files (not from this barrel),
// so these re-exports are technically unused here. They exist only to keep the
// barrel's public surface documented for audit purposes.
// ============================================================================
export type {
  AiMpiJson,
  AiMpiMetadata,
  AiMpiPage,
  AiMpiBlock,
  AiMpiTextBlock,
  AiMpiCardBlock,
  AiMpiGameBlock,
  AiMpiGameAction as AiMpiGameActionPoc,
  AiMpiGameReward as AiMpiGameRewardPoc,
  AiMpiQuizBlock,
  AiMpiScene,
} from './legacy/ai-mpi-json-schema';

/** @deprecated Legacy PoC normalizer — use normalizeAiMpiJson (foundation). */
export {
  normalizeAiMpiJson as normalizeAiMpiJsonLegacy,
  AiMpiJsonError,
} from './legacy/normalize-ai-mpi-json';
