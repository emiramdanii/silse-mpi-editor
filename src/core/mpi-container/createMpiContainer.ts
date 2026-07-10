/**
 * createMpiContainer (MPI-FULL-CONTAINER-01).
 *
 * Layer: core/mpi-container (pure function, no React/DOM)
 * Allowed imports: ./types
 *
 * Kontrak:
 *   Pure factory function untuk membuat MpiContainer kosong/minimal.
 *   Tidak ada DOM, no React, no store.
 */

import type { MpiContainer, MpiScene, MpiSceneRole, MpiSceneType, MpiSceneSlot, MpiFlow } from './types';
import { MPI_CONTAINER_SCHEMA_VERSION } from './types';
import { createComponentId } from '../ids';

// ---------------------------------------------------------------------------
// createMpiContainer — empty container with defaults
// ---------------------------------------------------------------------------

export function createMpiContainer(overrides?: Partial<MpiContainer>): MpiContainer {
  const base: MpiContainer = {
    schemaVersion: MPI_CONTAINER_SCHEMA_VERSION,
    sourceKind: 'manual',
    metadata: { title: 'MPI Tanpa Judul' },
    flow: { steps: [], mode: 'linear' },
    scenes: [],
    assets: [],
    runtime: { score: 0, showProgress: true, showScore: true },
    exportConfig: {
      format: 'html-standalone',
      embedAssets: true,
      includeToolbar: true,
      stageWidth: 1280,
      stageHeight: 720,
    },
  };
  return { ...base, ...overrides };
}

// ---------------------------------------------------------------------------
// createMpiScene — scene factory
// ---------------------------------------------------------------------------

export function createMpiScene(
  role: MpiSceneRole,
  sceneType: MpiSceneType,
  title: string,
  slots?: MpiSceneSlot[],
): MpiScene {
  return {
    id: `scene_${createComponentId().slice(5)}`,
    role,
    sceneType,
    title,
    slots: slots ?? [],
  };
}

// ---------------------------------------------------------------------------
// createMpiSlot — slot factory
// ---------------------------------------------------------------------------

export function createMpiSlot(
  role: string,
  placement: MpiSceneSlot['placement'],
  content: MpiSceneSlot['content'],
  designTokenKey?: string,
  /**
   * Fase 2 Step 1: Optional explicit slot ID.
   *
   * When converting SimpleProject → MpiContainer, pass component.id here
   * so that slot.id === component.id. This enables the editor's selection
   * model to work through SceneRendererView:
   *   onSlotClick(slotId) → selectComponent(slotId) → Inspector finds component
   *
   * If omitted, a random ID is generated (legacy behavior, for non-component
   * sources like AI blueprint bridge pages where slots come from sceneContent).
   */
  id?: string,
): MpiSceneSlot {
  return {
    id: id ?? `slot_${createComponentId().slice(5)}`,
    role,
    placement,
    content,
    designTokenKey,
  };
}

// ---------------------------------------------------------------------------
// createMpiFlow — flow factory
// ---------------------------------------------------------------------------

export function createMpiFlow(sceneIds: string[]): MpiFlow {
  return {
    steps: sceneIds.map((sceneId) => ({ sceneId })),
    mode: 'linear',
  };
}
