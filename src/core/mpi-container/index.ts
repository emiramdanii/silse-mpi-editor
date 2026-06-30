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
