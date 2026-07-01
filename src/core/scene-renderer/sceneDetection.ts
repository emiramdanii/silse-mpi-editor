/**
 * Scene Detection (FOUNDATION-INTEGRATION-01).
 *
 * Layer: core/scene-renderer (pure function, no React/DOM)
 * Allowed imports: ../mpi-container, ../types
 *
 * Kontrak:
 *   Pure function yang mendeteksi apakah sebuah SimplePage (dari SimpleProject
 *   lama) bisa dirender sebagai scene via SceneRendererView.
 *
 *   Strategi deteksi (per-page, bukan per-project):
 *     - Jika page punya game component dengan sceneMetadata.scene === 'game-mission',
 *       page bisa dirender sebagai scene game-mission.
 *     - Halaman lain (tanpa sceneMetadata) tetap pakai jalur lama (fallback).
 *
 *   Prinsip:
 *     - Pure function, no DOM, no React, no store.
 *     - Tidak mengubah SimpleProject.
 *     - Jalur lama tetap aman (fallback untuk page tanpa scene).
 *     - Koeksistensi: editor/preview/export bisa render campuran (scene + legacy).
 */

import type { SimpleProject, SimplePage, GameComponent, QuestionComponent, CardComponent, TextComponent } from '../types';
import type { MpiContainer } from '../mpi-container/types';
import { simpleProjectToMpiContainer } from '../mpi-container/simpleProjectToMpiContainer';
import { getDesignContract } from '../mpi-design-contract';
import { renderScenePlan, type SceneRenderPlan } from './renderScenePlan';

// ---------------------------------------------------------------------------
// Detect: is this page scene-renderable?
// ---------------------------------------------------------------------------

/**
 * Check if a SimplePage has a component with sceneMetadata.
 * Supported scenes:
 *   - game-mission (GameComponent)
 *   - quiz-challenge (QuestionComponent)
 *   - learning-scene (CardComponent)
 * If yes, this page can be rendered as a scene via SceneRendererView.
 * Pure function.
 *
 * BASELINE-SYNC: Also returns true when page.sceneType is set (AiMpiBlueprint bridge path).
 */
export function isPageSceneRenderable(page: SimplePage | undefined | null): boolean {
  if (!page) return false;
  // BASELINE-SYNC: explicit sceneType override on the page (from AiMpiBlueprint bridge).
  if (page.sceneType) return true;
  const hasGameScene = page.components.find(
    (c): c is GameComponent => c.type === 'game' && 'sceneMetadata' in c && c.sceneMetadata?.scene === 'game-mission',
  );
  if (hasGameScene) return true;
  const hasQuizScene = page.components.find(
    (c): c is QuestionComponent => c.type === 'question' && 'sceneMetadata' in c && c.sceneMetadata?.scene === 'quiz-challenge',
  );
  if (hasQuizScene) return true;
  const hasMaterialScene = page.components.find(
    (c): c is CardComponent => c.type === 'card' && 'sceneMetadata' in c && c.sceneMetadata?.scene === 'learning-scene',
  );
  if (hasMaterialScene) return true;
  // FOUNDATION-FINAL-LOCK-01: cover-hero (TextComponent) + closing-award (CardComponent)
  const hasCoverScene = page.components.find(
    (c): c is TextComponent => c.type === 'text' && 'sceneMetadata' in c && c.sceneMetadata?.scene === 'cover-hero',
  );
  if (hasCoverScene) return true;
  const hasClosingScene = page.components.find(
    (c): c is CardComponent => c.type === 'card' && 'sceneMetadata' in c && c.sceneMetadata?.scene === 'closing-award',
  );
  if (hasClosingScene) return true;

  // GOLDEN-REFERENCE-RENDER-P1: check for 7 new scene types via container content kind
  // These scenes are detected by converting page to container and checking slot content kinds.
  const newSceneKinds = [
    'curriculum-guide', 'objectives-path', 'starter-review',
    'discussion-scene', 'case-analysis', 'result-summary', 'reflection-journal',
  ];
  // Quick check: if page role matches a known new scene type, convert and check
  const newSceneRoleMap: Record<string, string> = {
    'guide': 'curriculum-guide',
    'objectives': 'objectives-path',
    'starter': 'starter-review',
    'material': 'discussion-scene', // could be discussion or case-analysis or material
    'reflection': 'reflection-journal',
  };
  const possibleKind = newSceneRoleMap[page.role];
  if (possibleKind) {
    // Convert to container and check if any slot has the expected content kind
    const container = simpleProjectToMpiContainer({ ...{} as SimpleProject, pages: [page] } as SimpleProject);
    const scene = container.scenes[0];
    if (scene) {
      const hasNewKind = scene.slots.some((s) => {
        const kind = (s.content as { kind: string }).kind;
        return newSceneKinds.includes(kind);
      });
      if (hasNewKind) return true;
    }
  }

  return false;
}

/**
 * Check if a SimpleProject has any scene-renderable page.
 * Pure function.
 */
export function hasAnySceneRenderablePage(project: SimpleProject): boolean {
  return project.pages.some(isPageSceneRenderable);
}

// ---------------------------------------------------------------------------
// Build scene render plan for a page (if renderable)
// ---------------------------------------------------------------------------

/**
 * Build a SceneRenderPlan for a specific page, if it's scene-renderable.
 * Returns null if page is not scene-renderable (caller falls back to legacy).
 *
 * Pure function — no DOM, no React, no store.
 */
export function buildSceneRenderPlanForPage(
  project: SimpleProject,
  page: SimplePage,
): SceneRenderPlan | null {
  if (!isPageSceneRenderable(page)) return null;

  // Convert whole project to container, then find the scene matching this page.
  const container = simpleProjectToMpiContainer(project);
  const scene = container.scenes.find((s) => s.pageId === page.id);
  if (!scene) return null;

  const contract = getDesignContract(project.stylePackId);
  return renderScenePlan(scene, contract);
}

// ---------------------------------------------------------------------------
// Build scene render plan for current page
// ---------------------------------------------------------------------------

/**
 * Build a SceneRenderPlan for the project's current page, if scene-renderable.
 * Returns null if current page is not scene-renderable.
 * Pure function.
 */
export function buildSceneRenderPlanForCurrentPage(
  project: SimpleProject,
): SceneRenderPlan | null {
  const currentPage = project.pages.find((p) => p.id === project.currentPageId);
  if (!currentPage) return null;
  return buildSceneRenderPlanForPage(project, currentPage);
}

// ---------------------------------------------------------------------------
// Build container from project (for export/preview that need full container)
// ---------------------------------------------------------------------------

/**
 * Convert SimpleProject to MpiContainer and build render plan for a specific page.
 * Returns { container, plan } or null if page not scene-renderable.
 * Pure function.
 */
export function buildContainerAndPlanForPage(
  project: SimpleProject,
  pageId: string,
): { container: MpiContainer; plan: SceneRenderPlan } | null {
  const page = project.pages.find((p) => p.id === pageId);
  if (!page || !isPageSceneRenderable(page)) return null;

  const container = simpleProjectToMpiContainer(project);
  const scene = container.scenes.find((s) => s.pageId === pageId);
  if (!scene) return null;

  const contract = getDesignContract(project.stylePackId);
  const plan = renderScenePlan(scene, contract);
  return { container, plan };
}
