/**
 * AI Import normalizer for silse-mpi-editor.
 *
 * Layer: ai-import
 * Allowed imports: ../core (types, ids, factory, capability, validation, layout-defaults, style-presets)
 *                  ./ai-import-types, ./forbidden-field-guard
 *                  ../storage/style-pack-storage
 *
 * Kontrak (Batch 8 / M8 + patch):
 *   normalizeAiImportPayload(payload) → SimpleProject valid.
 *   1. checkForbiddenFields (reject html/css/script/className/cdn/iframe).
 *   2. schemaVersion wajib benar.
 *   3. source wajib 'ai'.
 *   4. page.components missing/non-array tidak crash, return error jelas.
 *   5. component missing/non-object tidak crash.
 *   6. invalid variant fallback ke default by role/type.
 *   7. invalid navigation action fallback ke 'next'.
 *   8. Generate fresh ids untuk project/page/component.
 *   9. Role heuristic by title.
 *   10. layoutId default by role.
 *   11. Capability check (reject non-text if not allowed for role).
 *   12. validateProject after normalize.
 *   13. Style import: validateStylePack → saveStylePack → set project.style.
 */

import type {
  CardComponent,
  ImageComponent,
  LayoutId,
  NavigationComponent,
  PageComponent,
  PageRole,
  SimplePage,
  SimpleProject,
  TextComponent,
} from '../core/types';
import {
  CARD_COMPONENT_VARIANTS,
  IMAGE_COMPONENT_VARIANTS,
  LAYOUT_IDS,
  NAVIGATION_ACTIONS,
  NAVIGATION_COMPONENT_VARIANTS,
  PAGE_ROLES,
  TEXT_COMPONENT_VARIANTS,
} from '../core/types';
import { createProjectId, createPageId } from '../core/ids';
import { getDefaultLayoutIdForRole } from '../core/layout-defaults';
import { getDefaultTextVariantForRole, canAddComponent } from '../core/capability';
import { validateProject, validateStylePack } from '../core/validation';
import { DEFAULT_STYLE_PACK, stylePackToProjectStyle } from '../core/style-presets';
import { saveStylePack } from '../storage/style-pack-storage';
import { createTextComponent, createImageComponent, createCardComponent, createNavigationComponent } from '../core/component-factory';
import { checkForbiddenFields } from './forbidden-field-guard';
import { AI_IMPORT_SCHEMA_VERSION } from './ai-import-types';

export type NormalizeResult =
  | { ok: true; project: SimpleProject }
  | { ok: false; errors: string[] };

// ---------------------------------------------------------------------------
// Helpers: safe variant/action fallback
// ---------------------------------------------------------------------------

function safeTextVariant(raw: unknown, role: PageRole): TextComponent['variant'] {
  if (typeof raw === 'string' && TEXT_COMPONENT_VARIANTS.includes(raw as TextComponent['variant'])) {
    return raw as TextComponent['variant'];
  }
  return getDefaultTextVariantForRole(role);
}

function safeImageVariant(raw: unknown): ImageComponent['variant'] {
  if (typeof raw === 'string' && IMAGE_COMPONENT_VARIANTS.includes(raw as ImageComponent['variant'])) {
    return raw as ImageComponent['variant'];
  }
  return 'illustration';
}

function safeCardVariant(raw: unknown): CardComponent['variant'] {
  if (typeof raw === 'string' && CARD_COMPONENT_VARIANTS.includes(raw as CardComponent['variant'])) {
    return raw as CardComponent['variant'];
  }
  return 'infoCard';
}

function safeNavigationVariant(raw: unknown): NavigationComponent['variant'] {
  if (typeof raw === 'string' && NAVIGATION_COMPONENT_VARIANTS.includes(raw as NavigationComponent['variant'])) {
    return raw as NavigationComponent['variant'];
  }
  return 'navigation';
}

function safeNavigationAction(raw: unknown): 'next' | 'prev' | 'goto' {
  if (typeof raw === 'string' && NAVIGATION_ACTIONS.includes(raw as 'next' | 'prev' | 'goto')) {
    return raw as 'next' | 'prev' | 'goto';
  }
  return 'next';
}

// ---------------------------------------------------------------------------
// Role heuristic by title
// ---------------------------------------------------------------------------

function heuristicRole(title: string, index: number): PageRole {
  const lower = title.toLowerCase();
  if (index === 0 || lower.includes('cover') || lower.includes('pembuka')) return 'cover';
  if (lower.includes('tujuan')) return 'learningObjectives';
  if (lower.includes('pemantik') || lower.includes('apersepsi')) return 'starter';
  if (lower.includes('materi')) return 'material';
  if (lower.includes('aktivitas') || lower.includes('tugas')) return 'activity';
  if (lower.includes('kuis') || lower.includes('evaluasi')) return 'quiz';
  if (lower.includes('refleksi')) return 'reflection';
  if (lower.includes('penutup') || lower.includes('closing')) return 'closing';
  return 'free';
}

// ---------------------------------------------------------------------------
// Normalize a single component (with non-object guard)
// ---------------------------------------------------------------------------

function normalizeComponent(
  raw: unknown,
  role: PageRole,
  errors: string[],
  pageIndex: number,
  compIndex: number,
): PageComponent | null {
  const prefix = `project.pages[${pageIndex}].components[${compIndex}]`;

  // Guard: component must be a non-null object
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    errors.push(`${prefix}: component must be an object, got ${typeof raw}`);
    return null;
  }

  const comp = raw as Record<string, unknown>;
  const type = comp.type;

  // Guard: type must be a valid string
  if (typeof type !== 'string') {
    errors.push(`${prefix}: component.type must be a string, got ${typeof type}`);
    return null;
  }

  // Capability check — allow text on all roles (guided content from AI)
  if (type !== 'text' && !canAddComponent(role, type as 'image' | 'card' | 'navigation')) {
    errors.push(`${prefix}: component type "${type}" not allowed for role "${role}"`);
    return null;
  }

  // Geometry defaults
  const x = typeof comp.x === 'number' ? comp.x : 100;
  const y = typeof comp.y === 'number' ? comp.y : 100;
  const width = typeof comp.width === 'number' && comp.width > 0 ? comp.width : 400;
  const height = typeof comp.height === 'number' && comp.height > 0 ? comp.height : 80;

  if (type === 'text') {
    return createTextComponent(role, {
      text: typeof comp.text === 'string' ? comp.text : 'Teks',
      variant: safeTextVariant(comp.variant, role),
      x, y, width, height,
    });
  }

  if (type === 'image') {
    const src = typeof comp.src === 'string' ? comp.src : '';
    if (src.length === 0) {
      errors.push(`${prefix}: image component requires "src"`);
      return null;
    }
    return createImageComponent(src, {
      variant: safeImageVariant(comp.variant),
      alt: typeof comp.alt === 'string' ? comp.alt : '',
      objectFit: comp.objectFit === 'contain' ? 'contain' : 'cover',
      x, y, width, height,
    });
  }

  if (type === 'card') {
    return createCardComponent(
      typeof comp.body === 'string' ? comp.body : 'Isi card',
      {
        variant: safeCardVariant(comp.variant),
        title: typeof comp.title === 'string' ? comp.title : '',
        x, y, width, height,
      },
    );
  }

  if (type === 'navigation') {
    return createNavigationComponent(
      typeof comp.label === 'string' ? comp.label : 'Berikutnya',
      safeNavigationAction(comp.action),
      {
        variant: safeNavigationVariant(comp.variant),
        targetPageId: typeof comp.targetPageId === 'string' ? comp.targetPageId : undefined,
        x, y, width, height,
      },
    );
  }

  errors.push(`${prefix}: unknown component type "${type}"`);
  return null;
}

// ---------------------------------------------------------------------------
// Normalize a page (with missing components guard)
// ---------------------------------------------------------------------------

function normalizePage(raw: unknown, index: number, errors: string[]): SimplePage | null {
  const prefix = `project.pages[${index}]`;

  // Guard: page must be a non-null object
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    errors.push(`${prefix}: page must be an object, got ${typeof raw}`);
    return null;
  }

  const page = raw as Record<string, unknown>;
  const title = typeof page.title === 'string' ? page.title : `Halaman ${index + 1}`;

  // Role: use payload if valid, otherwise heuristic
  const role: PageRole =
    typeof page.role === 'string' && PAGE_ROLES.includes(page.role as PageRole)
      ? (page.role as PageRole)
      : heuristicRole(title, index);

  // LayoutId: use payload if valid, otherwise default by role
  const layoutId: LayoutId =
    typeof page.layoutId === 'string' && LAYOUT_IDS.includes(page.layoutId as LayoutId)
      ? (page.layoutId as LayoutId)
      : getDefaultLayoutIdForRole(role);

  // Background: use payload if present, otherwise default
  const background =
    typeof page.background === 'object' && page.background !== null
      ? (page.background as SimplePage['background'])
      : { type: 'color' as const, color: '#ffffff' };

  // Components: guard for missing/non-array
  const rawComponents = page.components;
  if (rawComponents === undefined || rawComponents === null) {
    // Missing components — treat as empty array, no error
    return {
      id: createPageId(),
      title,
      role,
      layoutId,
      background,
      components: [],
    };
  }

  if (!Array.isArray(rawComponents)) {
    errors.push(`${prefix}.components: must be an array, got ${typeof rawComponents}`);
    return null;
  }

  const components: PageComponent[] = [];
  for (let i = 0; i < rawComponents.length; i++) {
    const comp = normalizeComponent(rawComponents[i], role, errors, index, i);
    if (comp) components.push(comp);
  }

  return {
    id: createPageId(),
    title,
    role,
    layoutId,
    background,
    components,
  };
}

// ---------------------------------------------------------------------------
// Main normalizer
// ---------------------------------------------------------------------------

export function normalizeAiImportPayload(payload: unknown): NormalizeResult {
  const errors: string[] = [];

  // Guard: payload must be a non-null object
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return { ok: false, errors: ['Payload must be an object'] };
  }

  const p = payload as Record<string, unknown>;

  // 1. Forbidden field guard
  const guardResult = checkForbiddenFields(p);
  if (!guardResult.ok) {
    return { ok: false, errors: guardResult.errors };
  }

  // 2. schemaVersion must be correct
  if (p.schemaVersion !== AI_IMPORT_SCHEMA_VERSION) {
    return { ok: false, errors: [`schemaVersion must be ${AI_IMPORT_SCHEMA_VERSION}, got ${String(p.schemaVersion)}`] };
  }

  // 3. source must be 'ai'
  if (p.source !== 'ai') {
    return { ok: false, errors: [`source must be "ai", got "${String(p.source)}"`] };
  }

  // 4. Validate project structure
  if (typeof p.project !== 'object' || p.project === null || Array.isArray(p.project)) {
    return { ok: false, errors: ['Payload must have a project object'] };
  }

  const proj = p.project as Record<string, unknown>;
  if (!Array.isArray(proj.pages) || proj.pages.length === 0) {
    return { ok: false, errors: ['Payload must have project.pages with at least 1 page'] };
  }

  // 5. Normalize pages
  const pages: SimplePage[] = [];
  for (let i = 0; i < proj.pages.length; i++) {
    const page = normalizePage(proj.pages[i], i, errors);
    if (page) pages.push(page);
  }

  if (pages.length === 0) {
    return { ok: false, errors: ['No valid pages after normalization'] };
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  // 6. Style import
  let stylePackId: string;
  let style: SimpleProject['style'];

  if (p.stylePack && typeof p.stylePack === 'object') {
    const styleValidation = validateStylePack(p.stylePack);
    if (!styleValidation.ok) {
      return { ok: false, errors: [`Invalid stylePack: ${styleValidation.errors.join('; ')}`] };
    }
    const saveResult = saveStylePack(p.stylePack as Parameters<typeof saveStylePack>[0]);
    stylePackId = (p.stylePack as { id: string }).id;
    style = stylePackToProjectStyle(p.stylePack as Parameters<typeof stylePackToProjectStyle>[0]);
    void saveResult; // save result doesn't block import
  } else {
    stylePackId = DEFAULT_STYLE_PACK.id;
    style = stylePackToProjectStyle(DEFAULT_STYLE_PACK);
  }

  // 7. Build project
  const project: SimpleProject = {
    id: createProjectId(),
    title: typeof proj.title === 'string' ? proj.title : 'MPI dari AI',
    version: 1,
    pages,
    currentPageId: pages[0].id,
    stylePackId,
    style,
  };

  // 8. Validate final project
  const projectValidation = validateProject(project);
  if (!projectValidation.ok) {
    return { ok: false, errors: [`Normalized project is invalid: ${projectValidation.errors.join('; ')}`] };
  }

  return { ok: true, project };
}

/**
 * Parse and normalize AI JSON string.
 * Convenience function that combines JSON.parse + normalizeAiImportPayload.
 */
export function parseAndNormalizeAiJson(jsonString: string): NormalizeResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    return { ok: false, errors: [`Invalid JSON: ${e instanceof Error ? e.message : 'parse error'}`] };
  }

  return normalizeAiImportPayload(parsed);
}
