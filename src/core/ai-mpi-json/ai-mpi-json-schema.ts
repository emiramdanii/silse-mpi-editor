/**
 * AI MPI JSON Schema (MPI-JSON-SCENE-PROOF-01) — DEPRECATED.
 * 
 * File ini sudah deprecated. Gunakan schema.ts untuk AiMpiBlueprint.
 * Type AiMpiJson dipertahankan untuk backward compatibility saja.
 */

// Re-export dari schema.ts yang lebih lengkap
export type {
  AiMpiBlueprint as AiMpiJson,
  AiBlueprintMetadata as AiMpiMetadata,
  AiBlueprintScene as AiMpiPage,
  AiBlueprintSlot as AiMpiBlock,
  AiBlueprintGameAction as AiMpiGameAction,
  AiBlueprintReward as AiMpiGameReward,
  AiBlueprintSlotContent as AiMpiQuizBlock,
  AiBlueprintSceneType as AiMpiScene,
} from './schema';

// Legacy types untuk backward compatibility (deprecated)
import type { AiBlueprintSlot } from './schema';
type AiMpiBlock = AiBlueprintSlot;
export type AiMpiTextBlock = AiMpiBlock & { blockType: 'text' };
export type AiMpiCardBlock = AiMpiBlock & { blockType: 'card' };
export type AiMpiGameBlock = AiMpiBlock & { blockType: 'game' };

// Legacy constants
export const AI_MPI_SCENE_GAME_MISSION = 'game-mission' as const;
export const AI_MPI_SCENE_COVER_HERO = 'cover-hero' as const;
export const AI_MPI_SCENE_MATERIAL_BRIEF = 'material-brief' as const;
export const AI_MPI_SCENE_QUIZ_CHECK = 'quiz-check' as const;
export const AI_MPI_SCENE_CLOSING_THANKS = 'closing-thanks' as const;
