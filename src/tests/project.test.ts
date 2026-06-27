import { describe, expect, it } from 'vitest';
import { createEmptyPage, createProject, createProjectWithPages } from '../core/project-factory';
import { isValidProject, validateProject } from '../core/validation';
import { PROJECT_VERSION } from '../core/types';

describe('createProject', () => {
  it('creates a project with exactly 1 page', () => {
    const p = createProject();
    expect(p.pages).toHaveLength(1);
    expect(p.pages[0].title).toBe('Halaman 1');
  });

  it('sets currentPageId to the first page', () => {
    const p = createProject();
    expect(p.currentPageId).toBe(p.pages[0].id);
  });

  it('sets version to PROJECT_VERSION', () => {
    const p = createProject();
    expect(p.version).toBe(PROJECT_VERSION);
  });

  it('assigns unique ids to project and page', () => {
    const a = createProject();
    const b = createProject();
    expect(a.id).not.toBe(b.id);
    expect(a.pages[0].id).not.toBe(b.pages[0].id);
  });
});

describe('createEmptyPage', () => {
  it('creates a page with no blocks', () => {
    const page = createEmptyPage();
    expect(page.blocks).toEqual([]);
  });

  it('defaults to white color background', () => {
    const page = createEmptyPage();
    expect(page.background).toEqual({ type: 'color', color: '#ffffff' });
  });
});

describe('createProjectWithPages', () => {
  it('creates a project with the requested page count', () => {
    const p = createProjectWithPages(3);
    expect(p.pages).toHaveLength(3);
    expect(p.pages.map((pg) => pg.title)).toEqual(['Halaman 1', 'Halaman 2', 'Halaman 3']);
  });

  it('throws if pageCount < 1', () => {
    expect(() => createProjectWithPages(0)).toThrow();
  });
});

describe('validateProject', () => {
  it('accepts a freshly created project', () => {
    const p = createProject();
    const r = validateProject(p);
    expect(r.ok).toBe(true);
  });

  it('rejects empty pages array', () => {
    const p = createProject();
    const broken = { ...p, pages: [] };
    const r = validateProject(broken);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toMatch(/pages/);
  });

  it('rejects unknown currentPageId', () => {
    const p = createProject();
    const broken = { ...p, currentPageId: 'does-not-exist' };
    const r = validateProject(broken);
    expect(r.ok).toBe(false);
  });

  it('rejects wrong version', () => {
    const p = createProject();
    const broken = { ...p, version: 999 };
    const r = validateProject(broken);
    expect(r.ok).toBe(false);
  });

  it('rejects duplicate page ids', () => {
    const p = createProject();
    const dup = { ...p, pages: [p.pages[0], { ...p.pages[0] }] };
    const r = validateProject(dup);
    expect(r.ok).toBe(false);
  });
});

describe('isValidProject type guard', () => {
  it('narrows type for valid project', () => {
    const p = createProject();
    expect(isValidProject(p)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isValidProject(null)).toBe(false);
  });

  it('returns false for plain object missing fields', () => {
    expect(isValidProject({})).toBe(false);
  });
});
