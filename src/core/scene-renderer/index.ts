/**
 * Scene Renderer module — public API (SCENE-RENDERER-PROOF-01).
 */

export type {
  SceneRenderPlan,
  SceneRenderSlot,
} from './renderScenePlan';

export {
  renderScenePlan,
  isSceneRenderPlan,
  resolveDesignToken,
} from './renderScenePlan';
