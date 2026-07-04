/**
 * AI MPI JSON module — public API.
 *
 * Layer: core/ai-mpi-json
 *
 * Dua set API:
 *   1. Proof-of-concept (MPI-JSON-SCENE-PROOF-01): AiMpiJson, normalizeAiMpiJson,
 *      aiMpiJsonToProject — simple flat schema untuk game-mission proof.
 *   2. Foundation (AI-MPI-JSON-BLUEPRINT-01): AiMpiBlueprint, validateAiMpiJson,
 *      normalizeBlueprint — rich schema dengan scenes/slots/placements/styleIntent/designSystem.
 */

// === Foundation API (AI-MPI-JSON-BLUEPRINT-01) ===
export type {
  AiMpiBlueprint,
  AiBlueprintMetadata,
  AiBlueprintCurriculum,
  AiBlueprintCurriculumObjective,
  AiBlueprintStyleIntent,
  AiBlueprintDesignSystem,
  AiBlueprintDesignSystemOverrides,
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
} from './schema';

export {
  validateAiMpiJson,
  isValidAiMpiJson,
  type BlueprintValidationError,
} from './validateAiMpiJson';

export {
  normalizeAiMpiJson as normalizeBlueprint,
  AiMpiBlueprintError,
} from './normalizeAiMpiJson';

export { aiJsonToMpiContainer } from './aiJsonToMpiContainer';

// BASELINE-SYNC: AiMpiBlueprint → SimpleProject bridge.
export { aiBlueprintToSimpleProject } from './aiBlueprintToSimpleProject';
