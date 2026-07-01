/**
 * ID generators for silse-mpi-editor.
 *
 * Layer: core
 *
 * Uses crypto.randomUUID() when available, falls back to a
 * timestamp+random implementation for older environments (jsdom test runner).
 */

function fallbackId(prefix: string): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${ts}${rand}`;
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return fallbackId('id');
}

export function createProjectId(): string {
  return `proj_${uuid()}`;
}

export function createPageId(): string {
  return `page_${uuid()}`;
}

/**
 * Generate ID for a component (elemen pembelajaran).
 * Naming: createComponentId (Batch 2R). Was createBlockId in M2 v1/v2.
 * Prefix "comp_" chosen (not "block_") to align with component model.
 */
export function createComponentId(): string {
  return `comp_${uuid()}`;
}
