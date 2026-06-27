import { describe, expect, it } from 'vitest';
import { createEmptyPage, createProject, createProjectWithPages } from '../core/project-factory';
import { isValidProject, validateProject, validatePage } from '../core/validation';
import { PROJECT_VERSION } from '../core/types';

describe('createProject', () => {
  it('creates a project with exactly 1 page (Cover)', () => {
    const p = createProject();
    expect(p.pages).toHaveLength(1);
    expect(p.pages[0].title).toBe('Cover');
    expect(p.pages[0].role).toBe('cover');
  });

  it('cover page pre-filled with 1 text component variant=title', () => {
    const p = createProject();
    const cover = p.pages[0];
    expect(cover.components).toHaveLength(1);
    expect(cover.components[0].type).toBe('text');
    expect((cover.components[0] as { variant: string }).variant).toBe('title');
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
  it('creates a page with no components (default role=free)', () => {
    const page = createEmptyPage();
    expect(page.components).toEqual([]);
    expect(page.role).toBe('free');
  });

  it('creates a page with specified role', () => {
    const page = createEmptyPage({ role: 'material' });
    expect(page.role).toBe('material');
  });

  it('creates a cover page with default title "Cover"', () => {
    const page = createEmptyPage({ role: 'cover' });
    expect(page.title).toBe('Cover');
  });

  it('creates a material page with default title "Materi"', () => {
    const page = createEmptyPage({ role: 'material' });
    expect(page.title).toBe('Materi');
  });

  it('creates a free page with default title "Halaman Baru"', () => {
    const page = createEmptyPage({ role: 'free' });
    expect(page.title).toBe('Halaman Baru');
  });

  it('accepts explicit title override', () => {
    const page = createEmptyPage({ role: 'free', title: 'Materi 1' });
    expect(page.title).toBe('Materi 1');
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
    // First page is cover (from createProject), subsequent pages are free
    expect(p.pages[0].role).toBe('cover');
    expect(p.pages[1].role).toBe('free');
    expect(p.pages[2].role).toBe('free');
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

describe('validatePage — role required (Batch 2R)', () => {
  it('rejects page without role field', () => {
    const page = createEmptyPage({ role: 'free' });
    const broken = { ...page } as Record<string, unknown>;
    delete broken.role;
    const r = validatePage(broken);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join('; ')).toMatch(/role/i);
  });

  it('rejects page with invalid role value', () => {
    const page = createEmptyPage({ role: 'free' });
    const broken = { ...page, role: 'invalidRole' };
    const r = validatePage(broken);
    expect(r.ok).toBe(false);
  });

  it('rejects page with role of wrong type (number)', () => {
    const page = createEmptyPage({ role: 'free' });
    const broken = { ...page, role: 123 };
    const r = validatePage(broken);
    expect(r.ok).toBe(false);
  });

  it('accepts page with each valid PageRole', () => {
    const roles = [
      'cover',
      'learningObjectives',
      'starter',
      'material',
      'activity',
      'quiz',
      'reflection',
      'closing',
      'free',
    ] as const;
    for (const role of roles) {
      const page = createEmptyPage({ role });
      const r = validatePage(page);
      expect(r.ok).toBe(true);
    }
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
