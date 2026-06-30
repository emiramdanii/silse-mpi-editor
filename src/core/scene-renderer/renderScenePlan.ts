/**
 * Scene Renderer (SCENE-RENDERER-PROOF-01).
 *
 * Layer: core/scene-renderer (pure function, no React/DOM)
 * Allowed imports: ../mpi-container/types, ../mpi-design-contract/types
 *
 * Kontrak:
 *   Pure function yang menghasilkan "render plan" untuk satu scene berdasarkan
 *   MpiContainer + DesignContract. Render plan = struktur data yang renderer
 *   view (React/DOM) bisa gunakan untuk emit HTML classes + content.
 *
 *   Bukan list biasa. Render plan punya:
 *     - sceneClass (silse-scene + silse-scene-<sceneType>)
 *     - slots: array of { slotClass, placement, contentClass, content }
 *
 *   Prinsip:
 *     - Pure function, no DOM, no React.
 *     - Baca scene dari container.
 *     - Baca placement dari slot.
 *     - Baca design token dari contract (via designTokenKey).
 *     - Output bukan list biasa.
 *     - Editor/preview/export bisa pakai render plan yang sama (parity).
 */

import type { MpiScene, MpiSceneSlot, MpiSceneSlotContent } from '../mpi-container/types';
import type { MpiDesignContract } from '../mpi-design-contract/types';

// ---------------------------------------------------------------------------
// Render plan types
// ---------------------------------------------------------------------------

export type SceneRenderSlot = {
  id: string;
  role: string;
  slotClass: string; // e.g. "silse-scene-slot silse-scene-briefing"
  placement: { x: number; y: number; width: number; height: number; zIndex?: number };
  contentClass: string; // e.g. "silse-scene-card" | "silse-scene-button"
  content: MpiSceneSlotContent;
  designTokenKey?: string;
};

export type SceneRenderPlan = {
  sceneId: string;
  sceneClass: string; // e.g. "silse-scene silse-scene-game-mission"
  sceneType: string;
  title: string;
  slots: SceneRenderSlot[];
  designContractId: string;
};

// ---------------------------------------------------------------------------
// Slot class resolver
// ---------------------------------------------------------------------------

function slotRoleToClass(role: string): string {
  const base = 'silse-scene-slot';
  const roleClass = `silse-scene-${role.replace(/[^a-zA-Z0-9-]/g, '-')}`;
  return `${base} ${roleClass}`;
}

// ---------------------------------------------------------------------------
// Content class resolver
// ---------------------------------------------------------------------------

function contentKindToClass(kind: MpiSceneSlotContent['kind']): string {
  const mapping: Record<string, string> = {
    'text': 'silse-scene-text',
    'card': 'silse-scene-card',
    'image': 'silse-scene-image',
    'button': 'silse-scene-button',
    'badge': 'silse-scene-badge',
    'game-mission': 'silse-scene-game-mission',
    'quiz-question': 'silse-scene-quiz',
    'feedback': 'silse-scene-feedback',
    'reward': 'silse-scene-reward',
    'navigation': 'silse-scene-navigation',
  };
  return mapping[kind] ?? 'silse-scene-unknown';
}

// ---------------------------------------------------------------------------
// Slot → render slot
// ---------------------------------------------------------------------------

function mapSlotToRenderSlot(slot: MpiSceneSlot): SceneRenderSlot {
  return {
    id: slot.id,
    role: slot.role,
    slotClass: slotRoleToClass(slot.role),
    placement: {
      x: slot.placement.x,
      y: slot.placement.y,
      width: slot.placement.width,
      height: slot.placement.height,
      zIndex: slot.placement.zIndex,
    },
    contentClass: contentKindToClass(slot.content.kind),
    content: slot.content,
    designTokenKey: slot.designTokenKey,
  };
}

// ---------------------------------------------------------------------------
// Main: renderScenePlan
// ---------------------------------------------------------------------------

/**
 * Build render plan for a scene from MpiContainer + DesignContract.
 * Pure function — no DOM, no React, no store.
 * Output is a data structure that React/DOM renderers can consume.
 */
export function renderScenePlan(
  scene: MpiScene,
  contract: MpiDesignContract,
): SceneRenderPlan {
  const sceneClass = `silse-scene silse-scene-${scene.sceneType}`;

  return {
    sceneId: scene.id,
    sceneClass,
    sceneType: scene.sceneType,
    title: scene.title,
    slots: scene.slots.map(mapSlotToRenderSlot),
    designContractId: contract.id,
  };
}

// ---------------------------------------------------------------------------
// Helper: check if render plan is scene (not plain list)
// ---------------------------------------------------------------------------

/**
 * Check if a render plan produces scene structure (not plain list).
 * A scene must have silse-scene class and at least one slot with slotClass.
 */
export function isSceneRenderPlan(plan: unknown): boolean {
  if (!plan || typeof plan !== 'object') return false;
  const p = plan as Partial<SceneRenderPlan>;
  return (
    typeof p.sceneClass === 'string' &&
    p.sceneClass.includes('silse-scene') &&
    Array.isArray(p.slots) &&
    p.slots.length > 0 &&
    p.slots.every((s) => typeof s.slotClass === 'string' && s.slotClass.includes('silse-scene-slot'))
  );
}

// ---------------------------------------------------------------------------
// Helper: get design token value from contract by key path
// ---------------------------------------------------------------------------

/**
 * Resolve a design token value from contract by dot-path key.
 * e.g. "card.radius" → contract.card.radius
 * e.g. "button.primary.background" → contract.button.primary.background
 * Returns undefined if path not found.
 */
export function resolveDesignToken(
  contract: MpiDesignContract,
  keyPath: string,
): unknown {
  const parts = keyPath.split('.');
  let current: unknown = contract;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}
