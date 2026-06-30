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

import type { SimpleProject, SimplePage, GameComponent } from '../types';
import type { MpiContainer } from '../mpi-container/types';
import { simpleProjectToMpiContainer } from '../mpi-container/simpleProjectToMpiContainer';
import { getDesignContract } from '../mpi-design-contract';
import { renderScenePlan, type SceneRenderPlan } from './renderScenePlan';

// ---------------------------------------------------------------------------
// Detect: is this page scene-renderable?
// ---------------------------------------------------------------------------

/**
 * Check if a SimplePage has a game component with sceneMetadata (game-mission).
 * If yes, this page can be rendered as a scene via SceneRendererView.
 * Pure function.
 */
export function isPageSceneRenderable(page: SimplePage | undefined | null): boolean {
  if (!page) return false;
  const gameComponent = page.components.find(
    (c): c is GameComponent => c.type === 'game' && 'sceneMetadata' in c && c.sceneMetadata?.scene === 'game-mission',
  );
  return !!gameComponent;
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
