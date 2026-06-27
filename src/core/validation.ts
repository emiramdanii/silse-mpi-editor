/**
 * Validation for silse-mpi-editor project data.
 *
 * Layer: core
 * Allowed imports: ./types
 *
 * Pure functions — no I/O, no side effects.
 */

import {
  BLOCK_TYPES,
  PROJECT_VERSION,
  type BlockType,
  type SimpleBlock,
  type SimplePage,
  type SimpleProject,
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

export function validateBlock(block: unknown): ValidationResult {
  if (!isObject(block)) return fail('block must be an object');
  if (!isString(block.id) || block.id.length === 0) return fail('block.id must be a non-empty string');
  if (!isNumber(block.x)) return fail('block.x must be a number');
  if (!isNumber(block.y)) return fail('block.y must be a number');
  if (!isNumber(block.width) || block.width <= 0) return fail('block.width must be a positive number');
  if (!isNumber(block.height) || block.height <= 0) return fail('block.height must be a positive number');
  if (!isString(block.type) || !BLOCK_TYPES.includes(block.type as BlockType)) {
    return fail(`block.type must be one of: ${BLOCK_TYPES.join(', ')}`);
  }
  return { ok: true };
}

export function validatePage(page: unknown): ValidationResult {
  if (!isObject(page)) return fail('page must be an object');
  if (!isString(page.id) || page.id.length === 0) return fail('page.id must be a non-empty string');
  if (!isString(page.title)) return fail('page.title must be a string');
  if (!isObject(page.background)) return fail('page.background must be an object');
  if (!Array.isArray(page.blocks)) return fail('page.blocks must be an array');

  for (let i = 0; i < page.blocks.length; i++) {
    const r = validateBlock(page.blocks[i]);
    if (!r.ok) return fail(`page.blocks[${i}]: ${r.errors.join('; ')}`);
  }
  return { ok: true };
}

export function validateProject(project: unknown): ValidationResult {
  if (!isObject(project)) return fail('project must be an object');
  if (!isString(project.id) || project.id.length === 0) return fail('project.id must be a non-empty string');
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
 * Type guard for SimpleBlock.
 */
export function isValidBlock(block: unknown): block is SimpleBlock {
  return validateBlock(block).ok;
}
