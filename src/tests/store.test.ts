import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from '../store/editor-store';
import { isValidProject } from '../core/validation';

/**
 * Tests for editor store — M1 scope only.
 *
 * Hanya menguji operasi yang diizinkan di M1:
 *   - newProject
 *   - setProject
 *   - addPage
 *   - selectPage
 *   - getCurrentPage
 *
 * Operasi renamePage/deletePage/duplicatePage TIDAK ada di store M1.
 * Test untuk operasi tersebut akan ditambahkan saat M3 dimulai.
 */
describe('editor store — M1 scope', () => {
  beforeEach(() => {
    // Reset store between tests
    useEditorStore.getState().newProject();
  });

  it('starts with a project containing 1 page', () => {
    const { project } = useEditorStore.getState();
    expect(project.pages).toHaveLength(1);
  });

  it('currentPageId points to the first page on init', () => {
    const { project } = useEditorStore.getState();
    expect(project.currentPageId).toBe(project.pages[0].id);
  });

  it('addPage increases page count and switches currentPageId', () => {
    const store = useEditorStore.getState();
    const initialPageId = store.project.currentPageId;
    const newPageId = store.addPage();

    const { project } = useEditorStore.getState();
    expect(project.pages).toHaveLength(2);
    expect(project.currentPageId).toBe(newPageId);
    expect(newPageId).not.toBe(initialPageId);
  });

  it('addPage without title uses default "Halaman N"', () => {
    const store = useEditorStore.getState();
    store.addPage();
    store.addPage();
    const { project } = useEditorStore.getState();
    expect(project.pages[1].title).toBe('Halaman 2');
    expect(project.pages[2].title).toBe('Halaman 3');
  });

  it('addPage with explicit title uses it', () => {
    const store = useEditorStore.getState();
    store.addPage('Materi Pengenalan');
    const { project } = useEditorStore.getState();
    expect(project.pages[1].title).toBe('Materi Pengenalan');
  });

  it('selectPage changes currentPageId', () => {
    const store = useEditorStore.getState();
    const firstId = store.project.pages[0].id;
    store.addPage();
    store.selectPage(firstId);

    const { project } = useEditorStore.getState();
    expect(project.currentPageId).toBe(firstId);
  });

  it('selectPage ignores unknown page id', () => {
    const store = useEditorStore.getState();
    const before = store.project.currentPageId;
    store.selectPage('non-existent');
    const after = useEditorStore.getState().project.currentPageId;
    expect(after).toBe(before);
  });

  it('getCurrentPage returns the active page', () => {
    const store = useEditorStore.getState();
    const current = store.getCurrentPage();
    expect(current).not.toBeNull();
    expect(current?.id).toBe(useEditorStore.getState().project.currentPageId);
  });

  it('project remains valid after a sequence of addPage + selectPage', () => {
    const store = useEditorStore.getState();
    store.addPage();
    store.addPage();
    const s1 = useEditorStore.getState();
    store.selectPage(s1.project.pages[0].id);
    store.addPage();
    const s2 = useEditorStore.getState();
    store.selectPage(s2.project.pages[2].id);

    const { project } = useEditorStore.getState();
    expect(isValidProject(project)).toBe(true);
    expect(project.pages).toHaveLength(4);
  });

  it('newProject resets to a single-page project', () => {
    const store = useEditorStore.getState();
    store.addPage();
    store.addPage();
    expect(useEditorStore.getState().project.pages).toHaveLength(3);

    store.newProject();
    expect(useEditorStore.getState().project.pages).toHaveLength(1);
  });

  it('setProject replaces the entire project', () => {
    const store = useEditorStore.getState();
    const original = store.project;
    store.addPage();
    expect(useEditorStore.getState().project.pages).toHaveLength(2);

    store.setProject(original);
    expect(useEditorStore.getState().project.pages).toHaveLength(1);
  });
});

/**
 * Scope-lock assertion: operasi M3 TIDAK boleh ada di store interface.
 * Jika seseorang menambahkan renamePage/deletePage/duplicatePage ke store,
 * test ini akan gagal dan memaksa mereka kembali ke scope M1.
 */
describe('editor store — M1 scope-lock', () => {
  it('store does NOT expose renamePage', () => {
    const store = useEditorStore.getState();
    expect((store as unknown as Record<string, unknown>).renamePage).toBeUndefined();
  });

  it('store does NOT expose deletePage', () => {
    const store = useEditorStore.getState();
    expect((store as unknown as Record<string, unknown>).deletePage).toBeUndefined();
  });

  it('store does NOT expose duplicatePage', () => {
    const store = useEditorStore.getState();
    expect((store as unknown as Record<string, unknown>).duplicatePage).toBeUndefined();
  });
});
