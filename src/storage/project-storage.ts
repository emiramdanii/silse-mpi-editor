/**
 * Project storage for silse-mpi-editor.
 *
 * Layer: storage
 * Allowed imports: ./storage-types, ./local-storage-adapter, ../core (validation, types)
 *
 * Kontrak (Batch 7 / M7):
 *   - saveCurrentProject / loadCurrentProject: autosave ke localStorage.
 *   - saveProjectToLibrary / listSavedProjects / loadProjectFromLibrary / deleteSavedProject: project library.
 *   - exportProjectJson / importProjectJson: JSON export/import with envelope + validateProject.
 *   - validateProject wajib dipakai saat load/import. Invalid project ditolak dengan error jelas.
 *   - Tidak boleh menerima raw HTML/CSS/script.
 */

import type { SimpleProject } from '../core/types';
import { isValidProject, validateProject } from '../core/validation';
import type { StoredProjectEnvelope, LibraryEntry, StorageResult } from './storage-types';
import { STORAGE_SCHEMA_VERSION } from './storage-types';
import { readKey, writeKey, deleteKey } from './local-storage-adapter';

// ---------------------------------------------------------------------------
// Current project (autosave)
// ---------------------------------------------------------------------------

export function saveCurrentProject(project: SimpleProject): StorageResult<void> {
  const envelope: StoredProjectEnvelope = {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    project,
  };
  return writeKey('currentProject', envelope);
}

export function loadCurrentProject(): StorageResult<SimpleProject | null> {
  const result = readKey<StoredProjectEnvelope>('currentProject');
  if (!result.ok) return result;
  if (!result.data) return { ok: true, data: null };

  const envelope = result.data;
  if (envelope.schemaVersion !== STORAGE_SCHEMA_VERSION) {
    return { ok: false, error: `Schema version mismatch: expected ${STORAGE_SCHEMA_VERSION}, got ${envelope.schemaVersion}` };
  }

  const validation = validateProject(envelope.project);
  if (!validation.ok) {
    return { ok: false, error: `Invalid project: ${validation.errors.join('; ')}` };
  }

  return { ok: true, data: envelope.project };
}

export function clearCurrentProject(): StorageResult<void> {
  return deleteKey('currentProject');
}

// ---------------------------------------------------------------------------
// Project library
// ---------------------------------------------------------------------------

type SavedProjectsMap = Record<string, StoredProjectEnvelope>;

function readSavedProjectsMap(): SavedProjectsMap {
  const result = readKey<SavedProjectsMap>('savedProjects');
  if (!result.ok || !result.data) return {};
  return result.data;
}

function writeSavedProjectsMap(map: SavedProjectsMap): StorageResult<void> {
  return writeKey('savedProjects', map);
}

export function saveProjectToLibrary(project: SimpleProject): StorageResult<string> {
  const validation = validateProject(project);
  if (!validation.ok) {
    return { ok: false, error: `Invalid project: ${validation.errors.join('; ')}` };
  }

  const envelope: StoredProjectEnvelope = {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    project,
  };

  const map = readSavedProjectsMap();
  map[project.id] = envelope;
  const writeResult = writeSavedProjectsMap(map);
  if (!writeResult.ok) return writeResult;
  return { ok: true, data: project.id };
}

export function listSavedProjects(): LibraryEntry[] {
  const map = readSavedProjectsMap();
  return Object.values(map)
    .filter((e) => isValidProject(e.project))
    .map((e) => ({
      id: e.project.id,
      title: e.project.title,
      savedAt: e.savedAt,
      role: e.project.pages[0]?.role ?? 'free',
      pageCount: e.project.pages.length,
    }))
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function loadProjectFromLibrary(projectId: string): StorageResult<SimpleProject | null> {
  const map = readSavedProjectsMap();
  const envelope = map[projectId];
  if (!envelope) return { ok: true, data: null };

  const validation = validateProject(envelope.project);
  if (!validation.ok) {
    return { ok: false, error: `Invalid project in library: ${validation.errors.join('; ')}` };
  }

  return { ok: true, data: envelope.project };
}

export function deleteSavedProject(projectId: string): StorageResult<void> {
  const map = readSavedProjectsMap();
  delete map[projectId];
  return writeSavedProjectsMap(map);
}

// ---------------------------------------------------------------------------
// JSON export / import
// ---------------------------------------------------------------------------

export function exportProjectJson(project: SimpleProject): string {
  const envelope: StoredProjectEnvelope = {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    project,
  };
  return JSON.stringify(envelope, null, 2);
}

export function importProjectJson(jsonString: string): StorageResult<SimpleProject> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    return { ok: false, error: `Invalid JSON: ${e instanceof Error ? e.message : 'parse error'}` };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: 'Expected an object' };
  }

  const envelope = parsed as Partial<StoredProjectEnvelope>;
  if (!envelope.project) {
    return { ok: false, error: 'Missing "project" field in envelope' };
  }

  if (envelope.schemaVersion !== STORAGE_SCHEMA_VERSION) {
    return { ok: false, error: `Schema version mismatch: expected ${STORAGE_SCHEMA_VERSION}, got ${envelope.schemaVersion}` };
  }

  const validation = validateProject(envelope.project);
  if (!validation.ok) {
    return { ok: false, error: `Invalid project: ${validation.errors.join('; ')}` };
  }

  // Security: reject if project contains HTML/CSS/script fields at top level
  const raw = envelope.project as Record<string, unknown>;
  if (raw.html !== undefined || raw.css !== undefined || raw.script !== undefined || raw.cdn !== undefined) {
    return { ok: false, error: 'Project must not contain html/css/script/cdn fields' };
  }

  return { ok: true, data: envelope.project };
}
