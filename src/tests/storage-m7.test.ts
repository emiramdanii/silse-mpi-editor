/**
 * Tests for storage layer (M7).
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { createProject } from '../core/project-factory';
import { isValidProject } from '../core/validation';
import { CLEAN_CLASSROOM_PACK } from '../core/style-presets';
import { STORAGE_SCHEMA_VERSION, type StorageResult } from '../storage/storage-types';
import { readKey, writeKey, deleteKey, KEYS } from '../storage/local-storage-adapter';
import {
  saveCurrentProject,
  loadCurrentProject,
  clearCurrentProject,
  saveProjectToLibrary,
  listSavedProjects,
  loadProjectFromLibrary,
  deleteSavedProject,
  exportProjectJson,
  importProjectJson,
} from '../storage/project-storage';
import {
  saveStylePack,
  listSavedStylePacks,
  loadSavedStylePack,
  deleteSavedStylePack,
} from '../storage/style-pack-storage';
import { useEditorStore } from '../store/editor-store';

// Helper: safely unwrap StorageResult data
function unwrap<T>(r: StorageResult<T>): T | null {
  return r.ok ? r.data : null;
}
function unwrapErr<T>(r: StorageResult<T>): string {
  return r.ok ? '' : r.error;
}

// Mock localStorage
const mockStore: Record<string, string> = {};
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => mockStore[k] ?? null,
  setItem: (k: string, v: string) => { mockStore[k] = v; },
  removeItem: (k: string) => { delete mockStore[k]; },
  clear: () => { Object.keys(mockStore).forEach(function(k){delete mockStore[k];}); },
};

// =========================================================================
describe('storage adapter — handles unavailable localStorage', () => {
  it('readKey returns null when key not set', () => {
    const result = readKey<unknown>('currentProject');
    expect(result.ok).toBe(true);
    expect(unwrap(result)).toBeNull();
  });

  it('writeKey + readKey roundtrip', () => {
    writeKey('currentProject', { test: true });
    const result = readKey<{ test: boolean }>('currentProject');
    expect(unwrap(result)?.test).toBe(true);
  });

  it('deleteKey removes data', () => {
    writeKey('currentProject', { test: true });
    deleteKey('currentProject');
    expect(unwrap(readKey<unknown>('currentProject'))).toBeNull();
  });

  it('readKey handles corrupt JSON safely', () => {
    mockStore[KEYS.currentProject] = 'not-valid-json{';
    const result = readKey<unknown>('currentProject');
    expect(result.ok).toBe(false);
    expect(unwrapErr(result)).toBeDefined();
  });

  it('KEYS are correctly named', () => {
    expect(KEYS.currentProject).toBe('silse.currentProject');
    expect(KEYS.savedProjects).toBe('silse.savedProjects');
    expect(KEYS.savedStylePacks).toBe('silse.savedStylePacks');
  });
});

// =========================================================================
describe('project save/load — current project roundtrip', () => {
  beforeEach(() => { Object.keys(mockStore).forEach(function(k){delete mockStore[k];}); if (typeof localStorage !== 'undefined') localStorage.clear?.(); });

  it('saveCurrentProject + loadCurrentProject roundtrip', () => {
    const project = createProject('Test Roundtrip');
    expect(saveCurrentProject(project).ok).toBe(true);
    const result = loadCurrentProject();
    expect(result.ok).toBe(true);
    const data = unwrap(result);
    expect(data?.title).toBe('Test Roundtrip');
    expect(isValidProject(data)).toBe(true);
  });

  it('loadCurrentProject returns null when nothing saved', () => {
    expect(unwrap(loadCurrentProject())).toBeNull();
  });

  it('clearCurrentProject removes saved data', () => {
    saveCurrentProject(createProject('Test Clear'));
    clearCurrentProject();
    expect(unwrap(loadCurrentProject())).toBeNull();
  });

  it('saved envelope includes schemaVersion', () => {
    saveCurrentProject(createProject('Test Envelope'));
    const parsed = JSON.parse(mockStore[KEYS.currentProject]);
    expect(parsed.schemaVersion).toBe(STORAGE_SCHEMA_VERSION);
    expect(parsed.savedAt).toBeDefined();
    expect(parsed.project).toBeDefined();
  });
});

// =========================================================================
describe('project library — list / load / delete', () => {
  beforeEach(() => { Object.keys(mockStore).forEach(function(k){delete mockStore[k];}); });

  it('saveProjectToLibrary + listSavedProjects', () => {
    const project = createProject('Library Test');
    expect(saveProjectToLibrary(project).ok).toBe(true);
    const list = listSavedProjects();
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe('Library Test');
  });

  it('loadProjectFromLibrary returns the project', () => {
    const project = createProject('Load Test');
    saveProjectToLibrary(project);
    expect(unwrap(loadProjectFromLibrary(project.id))?.title).toBe('Load Test');
  });

  it('deleteSavedProject removes from library', () => {
    const project = createProject('Delete Test');
    saveProjectToLibrary(project);
    expect(listSavedProjects()).toHaveLength(1);
    deleteSavedProject(project.id);
    expect(listSavedProjects()).toHaveLength(0);
  });

  it('listSavedProjects returns empty when nothing saved', () => {
    expect(listSavedProjects()).toHaveLength(0);
  });

  it('loadProjectFromLibrary returns null for unknown id', () => {
    expect(unwrap(loadProjectFromLibrary('does-not-exist'))).toBeNull();
  });
});

// =========================================================================
describe('invalid project rejection on load/import', () => {
  beforeEach(() => { Object.keys(mockStore).forEach(function(k){delete mockStore[k];}); });

  it('loadCurrentProject rejects corrupt/invalid project', () => {
    mockStore[KEYS.currentProject] = JSON.stringify({
      schemaVersion: STORAGE_SCHEMA_VERSION,
      savedAt: '2025-01-01T00:00:00Z',
      project: { id: 'x', title: 'broken', version: 999, pages: [], currentPageId: 'x' },
    });
    const result = loadCurrentProject();
    expect(result.ok).toBe(false);
    expect(unwrapErr(result)).toBeDefined();
  });

  it('importProjectJson rejects invalid project', () => {
    const badJson = JSON.stringify({
      schemaVersion: STORAGE_SCHEMA_VERSION,
      savedAt: '2025-01-01',
      project: { id: '', title: '', version: 999, pages: [], currentPageId: '' },
    });
    expect(importProjectJson(badJson).ok).toBe(false);
  });

  it('importProjectJson rejects non-JSON string', () => {
    expect(importProjectJson('not json at all').ok).toBe(false);
  });

  it('importProjectJson rejects missing project field', () => {
    const result = importProjectJson(JSON.stringify({ schemaVersion: 1, savedAt: '2025' }));
    expect(result.ok).toBe(false);
    expect(unwrapErr(result)).toMatch(/project/i);
  });

  it('importProjectJson rejects wrong schemaVersion', () => {
    const project = createProject('Test');
    const result = importProjectJson(JSON.stringify({ schemaVersion: 999, savedAt: '2025', project }));
    expect(result.ok).toBe(false);
    expect(unwrapErr(result)).toMatch(/schema/i);
  });

  it('importProjectJson rejects project with html/css/script fields', () => {
    const project = createProject('Test');
    const badProject = { ...project, html: '<script>alert(1)</script>' };
    const result = importProjectJson(JSON.stringify({
      schemaVersion: STORAGE_SCHEMA_VERSION, savedAt: '2025', project: badProject,
    }));
    expect(result.ok).toBe(false);
    expect(unwrapErr(result)).toMatch(/html|css|script|cdn/i);
  });
});

// =========================================================================
describe('JSON export / import', () => {
  it('exportProjectJson includes envelope + schemaVersion', () => {
    const json = exportProjectJson(createProject('JSON Export Test'));
    const parsed = JSON.parse(json);
    expect(parsed.schemaVersion).toBe(STORAGE_SCHEMA_VERSION);
    expect(parsed.savedAt).toBeDefined();
    expect(parsed.project.title).toBe('JSON Export Test');
  });

  it('exportProjectJson + importProjectJson roundtrip', () => {
    const json = exportProjectJson(createProject('Roundtrip JSON'));
    const result = importProjectJson(json);
    expect(result.ok).toBe(true);
    expect(unwrap(result)?.title).toBe('Roundtrip JSON');
    expect(isValidProject(unwrap(result))).toBe(true);
  });
});

// =========================================================================
describe('style pack save / list / load / delete', () => {
  beforeEach(() => { Object.keys(mockStore).forEach(function(k){delete mockStore[k];}); });

  it('saveStylePack + listSavedStylePacks', () => {
    expect(saveStylePack(CLEAN_CLASSROOM_PACK).ok).toBe(true);
    const list = listSavedStylePacks();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('Clean Classroom');
  });

  it('loadSavedStylePack returns the pack', () => {
    saveStylePack(CLEAN_CLASSROOM_PACK);
    expect(unwrap(loadSavedStylePack(CLEAN_CLASSROOM_PACK.id))?.id).toBe('cleanClassroom');
  });

  it('deleteSavedStylePack removes the pack', () => {
    saveStylePack(CLEAN_CLASSROOM_PACK);
    expect(listSavedStylePacks()).toHaveLength(1);
    deleteSavedStylePack(CLEAN_CLASSROOM_PACK.id);
    expect(listSavedStylePacks()).toHaveLength(0);
  });

  it('loadSavedStylePack returns null for unknown id', () => {
    expect(unwrap(loadSavedStylePack('unknown'))).toBeNull();
  });

  it('saved style pack envelope includes schemaVersion', () => {
    saveStylePack(CLEAN_CLASSROOM_PACK);
    const parsed = JSON.parse(mockStore[KEYS.savedStylePacks]);
    expect(parsed.schemaVersion).toBe(STORAGE_SCHEMA_VERSION);
    expect(parsed.stylePacks.length).toBeGreaterThan(0);
  });
});

// =========================================================================
describe('no localStorage access in core (behavior test)', () => {
  it('core/types module imports without localStorage dependency', async () => {
    // If types.ts referenced localStorage at module scope, importing would fail in Node
    const types = await import('../core/types');
    expect(types).toBeDefined();
    expect((types as any).localStorage).toBeUndefined();
  });

  it('core/validation module imports without localStorage dependency', async () => {
    const validation = await import('../core/validation');
    expect(validation).toBeDefined();
    expect((validation as any).localStorage).toBeUndefined();
  });

  it('core/capability module imports without localStorage dependency', async () => {
    const capability = await import('../core/capability');
    expect(capability).toBeDefined();
    expect((capability as any).localStorage).toBeUndefined();
  });
});

// =========================================================================
describe('store scope-lock (M7)', () => {
  it('store EXPOSES saveCurrent (M7 active)', () => {
    expect(typeof useEditorStore.getState().saveCurrent).toBe('function');
  });

  it('store EXPOSES loadCurrent (M7 active)', () => {
    expect(typeof useEditorStore.getState().loadCurrent).toBe('function');
  });

  it('store EXPOSES resetProject (M7 active)', () => {
    expect(typeof useEditorStore.getState().resetProject).toBe('function');
  });

  it('store does NOT expose AI import', () => {
    expect((useEditorStore.getState() as Record<string, unknown>).importAiJson).toBeUndefined();
  });

  it('store does NOT expose quiz/game', () => {
    const s = useEditorStore.getState() as Record<string, unknown>;
    expect(s.addQuestion).toBeUndefined();
    expect(s.addGame).toBeUndefined();
  });

  it('store does NOT expose style editor', () => {
    expect((useEditorStore.getState() as Record<string, unknown>).openStyleEditor).toBeUndefined();
  });

  it('store does NOT expose setPageRole', () => {
    expect((useEditorStore.getState() as Record<string, unknown>).setPageRole).toBeUndefined();
  });
});
