/**
 * AI MPI JSON module — public API (MPI-JSON-SCENE-PROOF-01).
 *
 * Layer: core/ai-mpi-json
 *
 * Export hub untuk semua AI MPI JSON functionality.
 */

export type {
  AiMpiJson,
  AiMpiMetadata,
  AiMpiPage,
  AiMpiBlock,
  AiMpiTextBlock,
  AiMpiCardBlock,
  AiMpiGameBlock,
  AiMpiGameAction,
  AiMpiGameReward,
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
