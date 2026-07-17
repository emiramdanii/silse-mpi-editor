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
  // DYNAMIC-LAYOUT: pertahankan layout metadata dari AI.
  // Renderer baca field ini untuk tentukan grid columns, arrangement, dst.
  const layout = normalizeLayout(slot.layout);
  if (layout) {
    normalized.layout = layout;
  }
  return normalized;
}

/**
 * DYNAMIC-LAYOUT: Normalize layout metadata dari AI.
 * Validate struktur + clamp values ke range aman.
 */
function normalizeLayout(raw: unknown): import('./schema').SceneLayout | undefined {
  if (!isObject(raw)) return undefined;
  const result: import('./schema').SceneLayout = {};
  // columns: clamp 1-6
  if (typeof raw.columns === 'number' && raw.columns >= 1 && raw.columns <= 6) {
    result.columns = Math.floor(raw.columns);
  }
  // arrangement: validate enum
  if (typeof raw.arrangement === 'string') {
    const valid = ['split-left-right', 'stack-vertical', 'grid-3', 'grid-4', 'sidebar-left', 'sidebar-right'];
    if (valid.includes(raw.arrangement)) {
      result.arrangement = raw.arrangement as import('./schema').SceneLayout['arrangement'];
    }
  }
  // orientation
  if (raw.orientation === 'horizontal' || raw.orientation === 'vertical') {
    result.orientation = raw.orientation;
  }
  // regions: validate keys + values
  if (isObject(raw.regions)) {
    const regions: Record<string, 'left' | 'right' | 'top' | 'bottom' | 'full'> = {};
    const validRegions = ['left', 'right', 'top', 'bottom', 'full'];
    for (const [key, val] of Object.entries(raw.regions)) {
      if (typeof val === 'string' && validRegions.includes(val)) {
        regions[key] = val as 'left' | 'right' | 'top' | 'bottom' | 'full';
      }
    }
    if (Object.keys(regions).length > 0) {
      result.regions = regions;
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
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
