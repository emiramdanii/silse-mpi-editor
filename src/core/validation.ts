/**
 * Validation for silse-mpi-editor project data.
 *
 * Layer: core
 * Allowed imports: ./types
 *
 * Pure functions — no I/O, no side effects.
 *
 * Kontrak Batch 2R:
 *   - Page wajib punya field `role` yang valid (salah satu PAGE_ROLES).
 *   - Text component wajib punya field `variant` yang valid.
 *   - Page tanpa role → validation menolak.
 *   - Component tanpa variant → validation menolak.
 */

import {
  COMPONENT_TYPES,
  PAGE_ROLES,
  PROJECT_VERSION,
  TEXT_COMPONENT_VARIANTS,
  type ComponentType,
  type PageComponent,
  type PageRole,
  type SimplePage,
  type SimpleProject,
  type TextComponentVariant,
} from './types';

export type ValidationResult = { ok: true } | { ok: false; errors: string[] };

function fail(...errors: string[]): ValidationResult {
  return { ok: false, errors };
}

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function validateComponent(component: unknown): ValidationResult {
  if (!isObject(component)) return fail('component must be an object');
  if (!isString(component.id) || component.id.length === 0)
    return fail('component.id must be a non-empty string');
  if (!isNumber(component.x)) return fail('component.x must be a number');
  if (!isNumber(component.y)) return fail('component.y must be a number');
  if (!isNumber(component.width) || component.width <= 0)
    return fail('component.width must be a positive number');
  if (!isNumber(component.height) || component.height <= 0)
    return fail('component.height must be a positive number');
  if (!isString(component.type) || !COMPONENT_TYPES.includes(component.type as ComponentType)) {
    return fail(`component.type must be one of: ${COMPONENT_TYPES.join(', ')}`);
  }

  // Type-specific validation
  if (component.type === 'text') {
    return validateTextComponent(component);
  }
  // image/navigation validation lands in M4/M5
  return { ok: true };
}

/**
 * Validate a text component (M2 scope).
 *
 * Kontrak (docs/CORE_PRODUCT_CONTRACT.md section 5 + Batch 2R Scope D):
 *   - field `text` wajib, string (boleh kosong tapi harus ada)
 *   - field `variant` wajib, harus salah satu dari TEXT_COMPONENT_VARIANTS
 *
 * Text component tanpa variant = scope leak, validation menolak.
 */
function validateTextComponent(component: Record<string, unknown>): ValidationResult {
  if (!isString(component.text)) {
    return fail('text component.text must be a string');
  }
  if (!isString(component.variant)) {
    return fail('text component.variant is required (must be a string)');
  }
  if (!TEXT_COMPONENT_VARIANTS.includes(component.variant as TextComponentVariant)) {
    return fail(
      `text component.variant must be one of: ${TEXT_COMPONENT_VARIANTS.join(', ')} (got "${component.variant}")`,
    );
  }
  return { ok: true };
}

export function validatePageRole(role: unknown): role is PageRole {
  return isString(role) && PAGE_ROLES.includes(role as PageRole);
}

export function validatePage(page: unknown): ValidationResult {
  if (!isObject(page)) return fail('page must be an object');
  if (!isString(page.id) || page.id.length === 0)
    return fail('page.id must be a non-empty string');
  if (!isString(page.title)) return fail('page.title must be a string');

  // Kontrak Batch 2R Scope B: page wajib punya role valid
  if (!validatePageRole(page.role)) {
    return fail(
      `page.role is required and must be one of: ${PAGE_ROLES.join(', ')}${isString(page.role) ? ` (got "${page.role}")` : ''}`,
    );
  }

  if (!isObject(page.background)) return fail('page.background must be an object');
  if (!Array.isArray(page.components)) return fail('page.components must be an array');

  for (let i = 0; i < page.components.length; i++) {
    const r = validateComponent(page.components[i]);
    if (!r.ok) return fail(`page.components[${i}]: ${r.errors.join('; ')}`);
  }
  return { ok: true };
}

export function validateProject(project: unknown): ValidationResult {
  if (!isObject(project)) return fail('project must be an object');
  if (!isString(project.id) || project.id.length === 0)
    return fail('project.id must be a non-empty string');
  if (!isString(project.title)) return fail('project.title must be a string');
  if (project.version !== PROJECT_VERSION) {
    return fail(`project.version must be ${PROJECT_VERSION}`);
  }
  if (!Array.isArray(project.pages) || project.pages.length === 0) {
    return fail('project.pages must be a non-empty array');
  }
  if (!isString(project.currentPageId)) {
    return fail('project.currentPageId must be a string');
  }

  const pageIds = new Set<string>();
  for (let i = 0; i < project.pages.length; i++) {
    const r = validatePage(project.pages[i]);
    if (!r.ok) return fail(`project.pages[${i}]: ${r.errors.join('; ')}`);
    const p = project.pages[i] as SimplePage;
    if (pageIds.has(p.id)) return fail(`duplicate page id: ${p.id}`);
    pageIds.add(p.id);
  }

  if (!pageIds.has(project.currentPageId)) {
    return fail(`project.currentPageId (${project.currentPageId}) not found in pages`);
  }
  return { ok: true };
}

/**
 * Type guard: narrows unknown to SimpleProject when valid.
 */
export function isValidProject(project: unknown): project is SimpleProject {
  return validateProject(project).ok;
}

/**
 * Type guard for PageComponent.
 */
export function isValidComponent(component: unknown): component is PageComponent {
  return validateComponent(component).ok;
}
