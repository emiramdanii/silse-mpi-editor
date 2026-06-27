import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from '../store/editor-store';
import { isValidProject } from '../core/validation';

describe('editor store', () => {
  beforeEach(() => {
    // Reset store between tests
    useEditorStore.getState().newProject();
  });

  it('starts with a project containing 1 page', () => {
    const { project } = useEditorStore.getState();
    expect(project.pages).toHaveLength(1);
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

  it('selectPage changes currentPageId', () => {
    const store = useEditorStore.getState();
    const firstId = store.project.pages[0].id;
    const newId = store.addPage();
    store.selectPage(firstId);

    const { project } = useEditorStore.getState();
    expect(project.currentPageId).toBe(firstId);
    expect(project.currentPageId).not.toBe(newId);
  });

  it('selectPage ignores unknown page id', () => {
    const store = useEditorStore.getState();
    const before = store.project.currentPageId;
    store.selectPage('non-existent');
    const after = useEditorStore.getState().project.currentPageId;
    expect(after).toBe(before);
  });

  it('renamePage updates the title', () => {
    const store = useEditorStore.getState();
    const pageId = store.project.pages[0].id;
    store.renamePage(pageId, 'Materi Baru');

    const { project } = useEditorStore.getState();
    expect(project.pages[0].title).toBe('Materi Baru');
  });

  it('deletePage removes a page when more than 1 exist', () => {
    const store = useEditorStore.getState();
    const id1 = store.project.pages[0].id;
    store.addPage();
    expect(useEditorStore.getState().project.pages).toHaveLength(2);

    store.deletePage(id1);
    const { project } = useEditorStore.getState();
    expect(project.pages).toHaveLength(1);
    expect(project.pages.find((p) => p.id === id1)).toBeUndefined();
  });

  it('deletePage refuses to delete the last page', () => {
    const store = useEditorStore.getState();
    const id = store.project.pages[0].id;
    store.deletePage(id);
    expect(useEditorStore.getState().project.pages).toHaveLength(1);
  });

  it('duplicatePage creates a copy with a new id', () => {
    const store = useEditorStore.getState();
    const sourceId = store.project.pages[0].id;
    store.renamePage(sourceId, 'Asli');
    const copyId = store.duplicatePage(sourceId);

    expect(copyId).not.toBeNull();
    const { project } = useEditorStore.getState();
    expect(project.pages).toHaveLength(2);
    const copy = project.pages.find((p) => p.id === copyId);
    expect(copy).toBeDefined();
    expect(copy?.title).toBe('Asli (salinan)');
    expect(copy?.id).not.toBe(sourceId);
  });

  it('duplicatePage returns null for unknown id', () => {
    const store = useEditorStore.getState();
    expect(store.duplicatePage('nope')).toBeNull();
  });

  it('getCurrentPage returns the active page', () => {
    const store = useEditorStore.getState();
    const current = store.getCurrentPage();
    expect(current).not.toBeNull();
    expect(current?.id).toBe(useEditorStore.getState().project.currentPageId);
  });

  it('project remains valid after a sequence of operations', () => {
    const store = useEditorStore.getState();
    store.addPage();
    store.addPage();
    // Re-fetch fresh state because getState() returns a snapshot
    const s1 = useEditorStore.getState();
    store.renamePage(s1.project.pages[1].id, 'P2');
    store.duplicatePage(s1.project.pages[0].id);
    const s2 = useEditorStore.getState();
    store.selectPage(s2.project.pages[0].id);

    const { project } = useEditorStore.getState();
    expect(isValidProject(project)).toBe(true);
  });

  it('newProject resets to a single-page project', () => {
    const store = useEditorStore.getState();
    store.addPage();
    store.addPage();
    expect(useEditorStore.getState().project.pages).toHaveLength(3);

    store.newProject();
    expect(useEditorStore.getState().project.pages).toHaveLength(1);
  });
});
