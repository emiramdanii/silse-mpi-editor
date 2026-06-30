/**
 * Scene Renderer module — public API.
 */

export type {
  SceneRenderPlan,
  SceneRenderSlot,
  SlotResolvedStyle,
} from './renderScenePlan';

export {
  renderScenePlan,
  isSceneRenderPlan,
  resolveDesignToken,
} from './renderScenePlan';

// FOUNDATION-INTEGRATION-01: scene detection + plan builder for product integration
export {
  isPageSceneRenderable,
  hasAnySceneRenderablePage,
  buildSceneRenderPlanForPage,
  buildSceneRenderPlanForCurrentPage,
  buildContainerAndPlanForPage,
} from './sceneDetection';
