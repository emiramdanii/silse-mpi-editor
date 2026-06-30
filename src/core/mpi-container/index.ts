/**
 * MPI Full Container module — public API (MPI-FULL-CONTAINER-01).
 */

export type {
  MpiContainer,
  MpiMetadata,
  MpiCurriculum,
  MpiCurriculumObjective,
  MpiStyleIntent,
  MpiDesignSystem,
  MpiFlow,
  MpiFlowStep,
  MpiScene,
  MpiSceneRole,
  MpiSceneType,
  MpiSceneSlot,
  MpiSceneSlotPlacement,
  MpiSceneSlotContent,
  MpiSceneNavigation,
  MpiAsset,
  MpiRuntimeConfig,
  MpiExportConfig,
} from './types';

export { MPI_CONTAINER_SCHEMA_VERSION } from './types';

export {
  createMpiContainer,
  createMpiScene,
  createMpiSlot,
  createMpiFlow,
} from './createMpiContainer';

export { simpleProjectToMpiContainer } from './simpleProjectToMpiContainer';

// FOUNDATION-FINAL-LOCK-01 PATCH A: Universal scene taxonomy + capability contracts
export {
  RENDERED_SCENE_TYPES,
  CONTRACT_ONLY_SCENE_TYPES,
  ALL_SCENE_TYPES,
  SCENE_REQUIRED_SLOTS,
  getRequiredSlotsForSceneType,
  isRenderedSceneType,
  isKnownSceneType,
  type UniversalSceneType,
  type SceneRequiredSlots,
} from './universal-scene-taxonomy';

export type {
  MpiRuntimeCapability,
  MpiAssessmentType,
  MpiScoringMode,
  MpiFeedbackMode,
  MpiAssessmentContract,
  MpiAssetType,
  MpiAssetContract,
  MpiAccessibilityContract,
  MpiExportMode,
  MpiExportContract,
  MpiNavigationType,
  MpiNavigationLink,
  MpiNavigationContract,
} from './capability-contracts';
