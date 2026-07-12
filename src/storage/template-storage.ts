/**
 * Template Storage — Level 5 (Ecosystem & Workflow)
 *
 * Layer: storage
 * Allowed imports: ../core (types only), ./storage-types, ./local-storage-adapter
 *
 * Kontrak:
 *   Save/load/delete custom templates to localStorage.
 *   Templates are SimpleProject snapshots that can be cloned to start
 *   a new project with pre-configured content, style, and layout.
 *
 *   Custom templates live alongside pedagogical templates in the
 *   TemplatePickerDialog. The difference:
 *   - Pedagogical templates: hardcoded, validated, 3 available
 *   - Custom templates: user-created, stored in localStorage, unlimited
 */

import type { SimpleProject } from '../core/types';
import { readKey, writeKey } from './local-storage-adapter';
import type { StoredProjectEnvelope } from './storage-types';
import { isValidProject } from '../core/validation';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CustomTemplateEntry = {
  id: string;
  name: string;
  savedAt: string;
  pageCount: number;
  mapel: string;
  role: string;
};

type StoredTemplateMap = Record<string, StoredProjectEnvelope & { templateName: string }>;


// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Save a project as a custom template.
 * The project is stored as-is (with all pages, components, style, customStyle).
 * A new UUID is generated for the template to avoid conflicts with the original project.
 */
export function saveProjectAsTemplate(project: SimpleProject, templateName: string): { ok: true; data: string } | { ok: false; error: string } {
  if (!isValidProject(project)) {
    return { ok: false, error: 'Invalid project' };
  }

  if (!templateName.trim()) {
    return { ok: false, error: 'Nama template tidak boleh kosong.' };
  }

  const templateId = `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const envelope: StoredProjectEnvelope & { templateName: string } = {
    schemaVersion: 1,
    savedAt: new Date().toISOString(),
    project,
    templateName: templateName.trim(),
  };

  const map = readTemplateMap();
  map[templateId] = envelope;
  const writeResult = writeKey('customTemplates', map);
  if (!writeResult.ok) return { ok: false, error: writeResult.error };
  return { ok: true, data: templateId };
}

/**
 * List all custom templates (metadata only — no project data).
 */
export function listCustomTemplates(): CustomTemplateEntry[] {
  const map = readTemplateMap();
  return Object.entries(map)
    .filter(([, e]) => isValidProject(e.project))
    .map(([id, e]) => ({
      id,
      name: e.templateName,
      savedAt: e.savedAt,
      pageCount: e.project.pages.length,
      mapel: e.project.curriculum?.subject ?? 'Umum',
      role: e.project.pages[0]?.role ?? 'free',
    }))
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

/**
 * Load a custom template's project data.
 * Returns a deep clone so the caller can modify without affecting the stored template.
 */
export function loadCustomTemplate(templateId: string): { ok: true; data: SimpleProject | null } | { ok: false; error: string } {
  const map = readTemplateMap();
  const entry = map[templateId];
  if (!entry) return { ok: true, data: null };

  if (!isValidProject(entry.project)) {
    return { ok: false, error: 'Invalid template data' };
  }

  // Deep clone via JSON to avoid reference sharing
  const cloned = JSON.parse(JSON.stringify(entry.project)) as SimpleProject;
  // Generate new project ID so it doesn't conflict with the template
  cloned.id = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return { ok: true, data: cloned };
}

/**
 * Delete a custom template.
 */
export function deleteCustomTemplate(templateId: string): { ok: true } | { ok: false; error: string } {
  const map = readTemplateMap();
  if (!map[templateId]) return { ok: true }; // idempotent
  delete map[templateId];
  const result = writeKey('customTemplates', map);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function readTemplateMap(): StoredTemplateMap {
  const result = readKey<StoredTemplateMap>('customTemplates');
  if (!result.ok || !result.data) return {};
  return result.data;
}
