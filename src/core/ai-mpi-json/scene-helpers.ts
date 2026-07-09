/**
 * Scene helpers — production utilities for scene metadata checks.
 *
 * Layer: core/ai-mpi-json (pure function, no React/DOM)
 * Allowed imports: ../types, ./schema
 *
 * These helpers were previously exported from the legacy
 * ai-mpi-json-to-project.ts (now in ./legacy/). They are production-
 * needed (used by GameComponentView) but don't depend on the legacy
 * schema, so they live here in a non-legacy file.
 *
 * The AI_MPI_SCENE_* constants mirror the scene identifiers used in
 * GameComponent.sceneMetadata.scene. They are kept here (not in legacy/)
 * because GameComponentView imports isGameMissionScene at runtime.
 */

import type { GameComponent } from '../types';

/**
 * Scene identifier constants.
 *
 * Note: these match the literal string values used in
 * GameComponent.sceneMetadata.scene and QuestionComponent.sceneMetadata.scene.
 * The foundation schema (AiBlueprintSceneType) uses different identifiers
 * (e.g. 'game-mission' → AiBlueprintSceneType includes 'game-mission').
 *
 * For backward compat with existing sceneMetadata in saved projects,
 * we keep these constants pointing to the same literal strings.
 */
export const AI_MPI_SCENE_GAME_MISSION = 'game-mission';

/**
 * Check if a GameComponent has scene metadata for game-mission scene.
 * Pure function — used by renderer to decide scene rendering.
 */
export function isGameMissionScene(component: GameComponent): boolean {
  return component.sceneMetadata?.scene === AI_MPI_SCENE_GAME_MISSION;
}
