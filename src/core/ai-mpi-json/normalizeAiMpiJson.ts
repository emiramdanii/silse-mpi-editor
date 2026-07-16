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

import type { AiMpiBlueprint, AiBlueprintScene, AiBlueprintSlot, AiBlueprintSlotContent, CustomStyleMap } from './schema';
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

/**
 * CUSTOM-STYLE-NORMALIZER-PRESERVE:
 * Normalize customStyle dari AI ke struktur yang aman diproses downstream.
 * Format: { elementKey: { cssProperty: string | number } }
 * - Drop entry elementKey jika value bukan object
 * - Drop cssProperty jika value bukan string/number (number → stringify)
 * - Jika hasil kosong, return undefined
 * Sanitization (XSS, dangerous props) TIDAK dilakukan di sini — itu tugas
 * `src/core/style/sanitize.ts` yang dipanggil di layer render/export.
 */
function normalizeCustomStyle(raw: unknown): CustomStyleMap | undefined {
  if (!isObject(raw)) return undefined;
  const result: CustomStyleMap = {};
  for (const [elementKey, elementStyle] of Object.entries(raw)) {
    if (!isObject(elementStyle)) continue;
    const cleanElement: Record<string, string> = {};
    for (const [cssProp, cssValue] of Object.entries(elementStyle)) {
      if (typeof cssValue === 'string') {
        cleanElement[cssProp] = cssValue;
      } else if (typeof cssValue === 'number') {
        cleanElement[cssProp] = String(cssValue);
      }
    }
    if (Object.keys(cleanElement).length > 0) {
      result[elementKey] = cleanElement;
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * CONTENT-SHAPE-NORMALIZE:
 * Defensive normalizer untuk slot.content field yang sering salah bentuk dari AI.
 * Renderer membaca field-field ini dengan asumsi struktur tertentu:
 *   - cover-hero.primaryAction      → {label, action}        (bukan string)
 *   - closing-award.finalAction     → {label, action}        (bukan string)
 *   - learning-material.examples[]  → {title, body}          (bukan string)
 *   - branching-scenario.choices[]  → {id, label, consequence, isCorrect?}
 * Sebelumnya, jika AI kirim bentuk string/array-of-string, renderer membaca
 * `.label` / `.body` dari `undefined` → tombol/kartu kosong tanpa error.
 * Normalizer ini auto-convert ke shape yang renderer expect.
 */
function normalizeContentShape(content: unknown): unknown {
  if (!isObject(content) || !isString(content.kind)) return content;
  const c = content as Record<string, unknown>;
  const kind = c.kind;

  if (kind === 'cover-hero' && 'primaryAction' in c) {
    c.primaryAction = normalizeActionField(c.primaryAction);
  }
  if (kind === 'closing-award' && 'finalAction' in c) {
    c.finalAction = normalizeActionField(c.finalAction);
  }
  if (kind === 'learning-material' && Array.isArray(c.examples)) {
    c.examples = c.examples
      .map(normalizeExampleItem)
      .filter((e): e is { title: string; body: string } => e !== null);
  }
  if (kind === 'branching-scenario' && Array.isArray(c.choices)) {
    c.choices = c.choices
      .map(normalizeBranchingChoice)
      .filter((ch): ch is { id: string; label: string; consequence: string; isCorrect?: boolean } => ch !== null);
  }
  return c;
}

function normalizeActionField(raw: unknown): { label: string; action: string } | undefined {
  if (typeof raw === 'string') {
    return { label: raw, action: 'next' };
  }
  if (isObject(raw)) {
    const label = typeof raw.label === 'string' ? raw.label : '';
    const action = typeof raw.action === 'string' ? raw.action : 'next';
    if (label.length === 0) return undefined;
    return { label, action };
  }
  return undefined;
}

function normalizeExampleItem(raw: unknown): { title: string; body: string } | null {
  if (typeof raw === 'string') {
    if (raw.trim().length === 0) return null;
    return { title: '', body: raw };
  }
  if (isObject(raw)) {
    const title = typeof raw.title === 'string' ? raw.title : '';
    const body = typeof raw.body === 'string' ? raw.body : '';
    if (body.length === 0 && title.length === 0) return null;
    return { title, body };
  }
  return null;
}

function normalizeBranchingChoice(raw: unknown): { id: string; label: string; consequence: string; isCorrect?: boolean } | null {
  if (!isObject(raw)) return null;
  const id = typeof raw.id === 'string' ? raw.id : '';
  const label = typeof raw.label === 'string' ? raw.label : '';
  const consequence = typeof raw.consequence === 'string' ? raw.consequence : '';
  if (label.length === 0) return null;
  const result: { id: string; label: string; consequence: string; isCorrect?: boolean } = {
    id: id.length > 0 ? id : `choice-${Math.random().toString(36).slice(2, 9)}`,
    label,
    consequence,
  };
  if (typeof raw.isCorrect === 'boolean') result.isCorrect = raw.isCorrect;
  return result;
}

function normalizeSlot(slot: unknown): AiBlueprintSlot {
  if (!isObject(slot)) throw new Error('slot must be object');
  const normalized: AiBlueprintSlot = {
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
    content: normalizeContentShape(slot.content) as AiBlueprintSlotContent,
  };
  // CUSTOM-STYLE-NORMALIZER-PRESERVE: pertahankan customStyle dari AI.
  const customStyle = normalizeCustomStyle(slot.customStyle);
  if (customStyle) {
    normalized.customStyle = customStyle;
  }
  return normalized;
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
