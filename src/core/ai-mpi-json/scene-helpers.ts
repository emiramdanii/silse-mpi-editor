/**
 * Scene helpers — production utilities for scene metadata checks.
 *
 * Layer: core/ai-mpi-json (pure function, no React/DOM)
 * Allowed imports: ../types
 *
 * AUDIT 5.9.5 — Catatan 3 (scope clarification):
 * This file is a PRODUCTION helper module, NOT a legacy adapter internal.
 * It is imported by production code:
 *   - src/components/GameComponentView.tsx (runtime check)
 *   - src/core/ai-mpi-json/index.ts (barrel re-export)
 *
 * It was previously exported from the legacy ai-mpi-json-to-project.ts
 * (now in ./legacy/). When the legacy converter was moved to ./legacy/,
 * these helpers stayed in a non-legacy location because:
 *   1. They don't depend on the legacy AiMpiJson schema — only on the
 *      GameComponent type from ../types.
 *   2. They are needed at runtime by GameComponentView (production code).
 *   3. Legacy files are @deprecated and should not be imported by production.
 *
 * FASE 2 TODO (Refaktor Renderer): Once GameComponentView is refactored
 * to read page.sceneContent (foundation model) instead of
 * GameComponent.sceneMetadata (legacy model), this file + isGameMissionScene
 * can be deleted. Until then, it remains a thin production helper.
 *
 * The AI_MPI_SCENE_* constant mirrors the scene identifier string used in
 * GameComponent.sceneMetadata.scene. It is kept here (not in legacy/)
 * because GameComponentView imports it at runtime.
 */

import type { GameComponent } from '../types';

/**
 * Scene identifier constant for game-mission scenes.
 *
 * This is the literal string stored in GameComponent.sceneMetadata.scene
 * when a game component represents a mission-based game (briefing + target +
 * actions + reward). It matches the AiBlueprintSceneType 'game-mission'
 * in the foundation schema.
 *
 * Kept as a constant (not inlined) so that callers reference a single
 * source of truth for the string value.
 */
export const AI_MPI_SCENE_GAME_MISSION = 'game-mission';

/**
 * Check if a GameComponent has scene metadata for game-mission scene.
 *
 * Pure function — used by GameComponentView renderer to decide whether to
 * render the mission-scene layout (briefing + target + action grid) or the
 * default game layout.
 *
 * @param component - The GameComponent to check.
 * @returns true if component.sceneMetadata?.scene === 'game-mission'.
 *
 * @deprecated Fase 2 will refactor GameComponentView to read page.sceneContent
 *             instead. Once that lands, this helper becomes unnecessary.
 */
export function isGameMissionScene(component: GameComponent): boolean {
  return component.sceneMetadata?.scene === AI_MPI_SCENE_GAME_MISSION;
}
