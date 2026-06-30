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

// === Proof-of-concept API (MPI-JSON-SCENE-PROOF-01, backward compat) ===
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
} from './ai-mpi-json-schema';

export {
  AI_MPI_SCENE_GAME_MISSION,
  AI_MPI_SCENE_COVER_HERO,
  AI_MPI_SCENE_MATERIAL_BRIEF,
  AI_MPI_SCENE_QUIZ_CHECK,
  AI_MPI_SCENE_CLOSING_THANKS,
} from './ai-mpi-json-schema';

export {
  normalizeAiMpiJson,
  AiMpiJsonError,
} from './normalize-ai-mpi-json';

export {
  aiMpiJsonToProject,
  getPageScene,
  isGameMissionScene,
} from './ai-mpi-json-to-project';
