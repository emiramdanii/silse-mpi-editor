/**
 * AI Import normalizer for silse-mpi-editor.
 *
 * Layer: ai-import
 * Allowed imports: ../core (types, ids, factory, capability, validation, layout-defaults, style-presets)
 *                  ./ai-import-types, ./forbidden-field-guard
 *                  ../storage/style-pack-storage
 *
 * Kontrak (Batch 8 / M8):
 *   normalizeAiImportPayload(payload) → SimpleProject valid.
 *   1. checkForbiddenFields (reject html/css/script/className/cdn/iframe).
 *   2. Generate fresh ids untuk project/page/component.
 *   3. Role heuristic by title.
 *   4. layoutId default by role.
 *   5. Variant fallback by role.
 *   6. Capability check (reject if component not allowed for role).
 *   7. validateProject after normalize.
 *   8. Style import: validateStylePack → saveStylePack → set project.style.
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
import { LAYOUT_IDS, PAGE_ROLES } from '../core/types';
import { createProjectId, createPageId } from '../core/ids';
import { getDefaultLayoutIdForRole } from '../core/layout-defaults';
import { getDefaultTextVariantForRole, canAddComponent } from '../core/capability';
import { validateProject, validateStylePack } from '../core/validation';
import { DEFAULT_STYLE_PACK, stylePackToProjectStyle } from '../core/style-presets';
import { saveStylePack } from '../storage/style-pack-storage';
import { createTextComponent, createImageComponent, createCardComponent, createNavigationComponent } from '../core/component-factory';
import type { SilseAiImportPayload, AiImportComponent, AiImportPage } from './ai-import-types';
import { checkForbiddenFields } from './forbidden-field-guard';

export type NormalizeResult =
  | { ok: true; project: SimpleProject }
  | { ok: false; errors: string[] };

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
// Normalize a single component
// ---------------------------------------------------------------------------

function normalizeComponent(
  raw: AiImportComponent,
  role: PageRole,
  errors: string[],
  pageIndex: number,
  compIndex: number,
): PageComponent | null {
  const type = raw.type;
  const prefix = `project.pages[${pageIndex}].components[${compIndex}]`;

  // Check capability — but allow cover to have text (guided content from AI)
  // AI import provides the full structure, including cover title/subtitle.
  // The capability matrix is for manual editor add operations, not AI import.
  if (type !== 'text' && !canAddComponent(role, type)) {
    errors.push(`${prefix}: component type "${type}" not allowed for role "${role}"`);
    return null;
  }

  // Geometry defaults
  const x = typeof raw.x === 'number' ? raw.x : 100;
  const y = typeof raw.y === 'number' ? raw.y : 100;
  const width = typeof raw.width === 'number' && raw.width > 0 ? raw.width : 400;
  const height = typeof raw.height === 'number' && raw.height > 0 ? raw.height : 80;

  if (type === 'text') {
    return createTextComponent(role, {
      text: raw.text ?? 'Teks',
      variant: raw.variant as TextComponent['variant'] ?? getDefaultTextVariantForRole(role),
      x, y, width, height,
    });
  }

  if (type === 'image') {
    if (!raw.src || raw.src.length === 0) {
      errors.push(`${prefix}: image component requires "src"`);
      return null;
    }
    return createImageComponent(raw.src, {
      variant: raw.variant as ImageComponent['variant'] ?? 'illustration',
      alt: raw.alt ?? '',
      objectFit: raw.objectFit ?? 'cover',
      x, y, width, height,
    });
  }

  if (type === 'card') {
    return createCardComponent(raw.body ?? 'Isi card', {
      variant: raw.variant as CardComponent['variant'] ?? 'infoCard',
      title: raw.title ?? '',
      x, y, width, height,
    });
  }

  if (type === 'navigation') {
    return createNavigationComponent(
      raw.label ?? 'Berikutnya',
      raw.action ?? 'next',
      {
        variant: raw.variant as NavigationComponent['variant'] ?? 'navigation',
        targetPageId: raw.targetPageId,
        x, y, width, height,
      },
    );
  }

  errors.push(`${prefix}: unknown component type "${type}"`);
  return null;
}

// ---------------------------------------------------------------------------
// Normalize a page
// ---------------------------------------------------------------------------

function normalizePage(raw: AiImportPage, index: number, errors: string[]): SimplePage | null {
  const title = raw.title ?? `Halaman ${index + 1}`;
  const role: PageRole = raw.role && PAGE_ROLES.includes(raw.role)
    ? raw.role
    : heuristicRole(title, index);
  const layoutId: LayoutId = raw.layoutId && LAYOUT_IDS.includes(raw.layoutId)
    ? raw.layoutId
    : getDefaultLayoutIdForRole(role);
  const background = raw.background ?? { type: 'color' as const, color: '#ffffff' };

  const components: PageComponent[] = [];
  for (let i = 0; i < raw.components.length; i++) {
    const comp = normalizeComponent(raw.components[i], role, errors, index, i);
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

export function normalizeAiImportPayload(payload: SilseAiImportPayload): NormalizeResult {
  const errors: string[] = [];

  // 1. Forbidden field guard
  const guardResult = checkForbiddenFields(payload);
  if (!guardResult.ok) {
    return { ok: false, errors: guardResult.errors };
  }

  // 2. Validate payload structure
  if (!payload.project || !Array.isArray(payload.project.pages) || payload.project.pages.length === 0) {
    return { ok: false, errors: ['Payload must have project.pages with at least 1 page'] };
  }

  // 3. Normalize pages
  const pages: SimplePage[] = [];
  for (let i = 0; i < payload.project.pages.length; i++) {
    const page = normalizePage(payload.project.pages[i], i, errors);
    if (page) pages.push(page);
  }

  if (pages.length === 0) {
    return { ok: false, errors: ['No valid pages after normalization'] };
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  // 4. Style import
  let stylePackId: string | undefined;
  let style: SimpleProject['style'];

  if (payload.stylePack) {
    const styleValidation = validateStylePack(payload.stylePack);
    if (!styleValidation.ok) {
      return { ok: false, errors: [`Invalid stylePack: ${styleValidation.errors.join('; ')}`] };
    }
    // Save style pack to library
    const saveResult = saveStylePack(payload.stylePack);
    if (saveResult.ok) {
      stylePackId = payload.stylePack.id;
      style = stylePackToProjectStyle(payload.stylePack);
    } else {
      // If save fails, still use the style pack inline
      stylePackId = payload.stylePack.id;
      style = stylePackToProjectStyle(payload.stylePack);
    }
  } else {
    stylePackId = DEFAULT_STYLE_PACK.id;
    style = stylePackToProjectStyle(DEFAULT_STYLE_PACK);
  }

  // 5. Build project
  const project: SimpleProject = {
    id: createProjectId(),
    title: payload.project.title ?? 'MPI dari AI',
    version: 1,
    pages,
    currentPageId: pages[0].id,
    stylePackId,
    style,
  };

  // 6. Validate final project
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

  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, errors: ['Expected an object'] };
  }

  const payload = parsed as SilseAiImportPayload;
  return normalizeAiImportPayload(payload);
}
