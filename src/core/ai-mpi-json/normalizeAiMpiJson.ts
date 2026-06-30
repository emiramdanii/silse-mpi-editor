/**
 * Normalize AI MPI Blueprint (AI-MPI-JSON-BLUEPRINT-01).
 *
 * Layer: core/ai-mpi-json (pure function, no React/DOM)
 * Allowed imports: ./schema, ./validateAiMpiJson
 *
 * Kontrak:
 *   Pure normalizer. Menerima unknown, returns AiMpiBlueprint valid,
 *   atau throws error. Menjaga data visual (styleIntent, designSystem,
 *   placements, sceneType, slots).
 */

import type { AiMpiBlueprint, AiBlueprintScene, AiBlueprintSlot, AiBlueprintSlotContent } from './schema';
import { validateAiMpiJson } from './validateAiMpiJson';

export class AiMpiBlueprintError extends Error {
  constructor(message: string, readonly errors: { path: string; message: string }[]) {
    super(`[AI MPI Blueprint] ${message}: ${errors.map((e) => `${e.path}(${e.message})`).join('; ')}`);
    this.name = 'AiMpiBlueprintError';
  }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function isString(v: unknown): v is string {
  return typeof v === 'string';
}

function normalizeSlot(slot: unknown): AiBlueprintSlot {
  if (!isObject(slot)) throw new Error('slot must be object');
  return {
    id: isString(slot.id) ? slot.id : '',
    role: isString(slot.role) ? slot.role : '',
    placement: isObject(slot.placement) ? {
      x: typeof slot.placement.x === 'number' ? slot.placement.x : 0,
      y: typeof slot.placement.y === 'number' ? slot.placement.y : 0,
      width: typeof slot.placement.width === 'number' ? slot.placement.width : 100,
      height: typeof slot.placement.height === 'number' ? slot.placement.height : 50,
      zIndex: typeof slot.placement.zIndex === 'number' ? slot.placement.zIndex : undefined,
      slot: isString(slot.placement.slot) ? slot.placement.slot : undefined,
      anchor: isString(slot.placement.anchor) ? slot.placement.anchor : undefined,
    } : { x: 0, y: 0, width: 100, height: 50 },
    designTokenKey: isString(slot.designTokenKey) ? slot.designTokenKey : undefined,
    content: slot.content as AiBlueprintSlotContent,
  };
}

function normalizeScene(scene: unknown): AiBlueprintScene {
  if (!isObject(scene)) throw new Error('scene must be object');
  return {
    id: isString(scene.id) ? scene.id : '',
    role: scene.role as AiBlueprintScene['role'],
    sceneType: scene.sceneType as AiBlueprintScene['sceneType'],
    title: isString(scene.title) ? scene.title : '',
    slots: Array.isArray(scene.slots) ? scene.slots.map(normalizeSlot) : [],
    navigation: isObject(scene.navigation) ? scene.navigation as AiBlueprintScene['navigation'] : undefined,
  };
}

export function normalizeAiMpiJson(input: unknown): AiMpiBlueprint {
  const errors = validateAiMpiJson(input);
  if (errors.length > 0) {
    throw new AiMpiBlueprintError('Invalid blueprint', errors);
  }

  const raw = input as Record<string, unknown>;
  return {
    version: raw.version as number,
    metadata: raw.metadata as AiMpiBlueprint['metadata'],
    curriculum: isObject(raw.curriculum) ? raw.curriculum as AiMpiBlueprint['curriculum'] : undefined,
    styleIntent: raw.styleIntent as AiMpiBlueprint['styleIntent'],
    designSystem: raw.designSystem as AiMpiBlueprint['designSystem'],
    flow: raw.flow as AiMpiBlueprint['flow'],
    scenes: (raw.scenes as unknown[]).map(normalizeScene),
    assets: Array.isArray(raw.assets) ? raw.assets as AiMpiBlueprint['assets'] : [],
    runtime: raw.runtime as AiMpiBlueprint['runtime'],
    exportConfig: raw.exportConfig as AiMpiBlueprint['exportConfig'],
  };
}
