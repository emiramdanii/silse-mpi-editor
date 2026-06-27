import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from '../store/editor-store';
import { isValidProject } from '../core/validation';
import { DEFAULT_TEXT_BLOCK } from '../core/block-factory';
import { isTextBlock } from '../blocks/block-utils';

/**
 * Tests for editor store.
 *
 * M1 scope: project lifecycle + page add/select.
 * M2 scope: text block add/select/update.
 *
 * Operasi renamePage/deletePage/duplicatePage (M3) TIDAK ada di store.
 * Operasi image/button block (M4/M5) TIDAK ada di store.
 */
describe('editor store — M1 scope (project & pages)', () => {
  beforeEach(() => {
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

// =========================================================================
// M2 — Text Block operations
// =========================================================================
describe('editor store — M2 scope (text block)', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('addTextBlock adds a block to the current page and selects it', () => {
    const store = useEditorStore.getState();
    const blockId = store.addTextBlock();

    const { project, selectedBlockId } = useEditorStore.getState();
    const page = project.pages.find((p) => p.id === project.currentPageId)!;
    expect(page.blocks).toHaveLength(1);
    expect(page.blocks[0].id).toBe(blockId);
    expect(page.blocks[0].type).toBe('text');
    expect(selectedBlockId).toBe(blockId);
  });

  it('addTextBlock uses default values when no overrides given', () => {
    const store = useEditorStore.getState();
    store.addTextBlock();
    const { project } = useEditorStore.getState();
    const block = project.pages[0].blocks[0];
    expect(isTextBlock(block)).toBe(true);
    if (!isTextBlock(block)) return;
    expect(block).toMatchObject({
      type: 'text',
      text: DEFAULT_TEXT_BLOCK.text,
      fontSize: DEFAULT_TEXT_BLOCK.fontSize,
      color: DEFAULT_TEXT_BLOCK.color,
      fontWeight: DEFAULT_TEXT_BLOCK.fontWeight,
      align: DEFAULT_TEXT_BLOCK.align,
    });
  });

  it('addTextBlock applies overrides', () => {
    const store = useEditorStore.getState();
    store.addTextBlock({ text: 'Custom', fontSize: 40, color: '#abcdef' });
    const { project } = useEditorStore.getState();
    const block = project.pages[0].blocks[0];
    expect(isTextBlock(block)).toBe(true);
    if (!isTextBlock(block)) return;
    expect(block.text).toBe('Custom');
    expect(block.fontSize).toBe(40);
    expect(block.color).toBe('#abcdef');
  });

  it('addTextBlock does NOT touch other pages', () => {
    const store = useEditorStore.getState();
    store.addPage();
    const page1Id = useEditorStore.getState().project.pages[0].id;
    store.selectPage(page1Id);
    store.addTextBlock({ text: 'on page 1' });
    store.addPage();
    // now on page 3 (a new current page)
    store.addTextBlock({ text: 'on page 3' });

    const { project } = useEditorStore.getState();
    expect(project.pages[0].blocks).toHaveLength(1);
    const b1 = project.pages[0].blocks[0];
    expect(isTextBlock(b1) && b1.text).toBe('on page 1');
    expect(project.pages[1].blocks).toHaveLength(0);
    expect(project.pages[2].blocks).toHaveLength(1);
    const b3 = project.pages[2].blocks[0];
    expect(isTextBlock(b3) && b3.text).toBe('on page 3');
  });

  it('selectBlock sets selectedBlockId', () => {
    const store = useEditorStore.getState();
    const id = store.addTextBlock();
    // simulate deselect first
    store.selectBlock(null);
    expect(useEditorStore.getState().selectedBlockId).toBeNull();
    store.selectBlock(id);
    expect(useEditorStore.getState().selectedBlockId).toBe(id);
  });

  it('selectBlock(null) clears selection', () => {
    const store = useEditorStore.getState();
    store.addTextBlock();
    expect(useEditorStore.getState().selectedBlockId).not.toBeNull();
    store.selectBlock(null);
    expect(useEditorStore.getState().selectedBlockId).toBeNull();
  });

  it('selectBlock ignores unknown block id (no-op)', () => {
    const store = useEditorStore.getState();
    // Start from clean state (selectedBlockId = null)
    expect(useEditorStore.getState().selectedBlockId).toBeNull();
    store.selectBlock('does-not-exist');
    expect(useEditorStore.getState().selectedBlockId).toBeNull();

    // Now select a real block, then try selecting unknown — should keep current selection
    const id = store.addTextBlock();
    expect(useEditorStore.getState().selectedBlockId).toBe(id);
    store.selectBlock('does-not-exist');
    expect(useEditorStore.getState().selectedBlockId).toBe(id);
  });

  it('selectBlock ignores block from another page', () => {
    const store = useEditorStore.getState();
    const page1Id = store.project.pages[0].id;
    store.addTextBlock();
    const blockId = useEditorStore.getState().selectedBlockId!;
    store.addPage(); // current page changes, selection cleared
    expect(useEditorStore.getState().selectedBlockId).toBeNull();
    store.selectBlock(blockId); // block lives on page 1, not current page
    expect(useEditorStore.getState().selectedBlockId).toBeNull();
    void page1Id;
  });

  it('updateTextBlock modifies the block in place', () => {
    const store = useEditorStore.getState();
    const id = store.addTextBlock();
    store.updateTextBlock(id, { text: 'Updated', fontSize: 50 });
    const { project } = useEditorStore.getState();
    const block = project.pages[0].blocks[0];
    expect(isTextBlock(block)).toBe(true);
    if (!isTextBlock(block)) return;
    expect(block.text).toBe('Updated');
    expect(block.fontSize).toBe(50);
  });

  it('updateTextBlock does NOT change block id or type', () => {
    const store = useEditorStore.getState();
    const id = store.addTextBlock();
    store.updateTextBlock(id, { text: 'Still text' });
    const { project } = useEditorStore.getState();
    const block = project.pages[0].blocks[0];
    expect(block.id).toBe(id);
    expect(block.type).toBe('text');
  });

  it('updateTextBlock on unknown id is a no-op', () => {
    const store = useEditorStore.getState();
    store.addTextBlock();
    const before = useEditorStore.getState().project;
    store.updateTextBlock('nope', { text: 'X' });
    const after = useEditorStore.getState().project;
    expect(after).toBe(before);
  });

  it('selectPage clears block selection', () => {
    const store = useEditorStore.getState();
    const page1Id = store.project.pages[0].id;
    store.addTextBlock();
    expect(useEditorStore.getState().selectedBlockId).not.toBeNull();
    store.addPage();
    expect(useEditorStore.getState().selectedBlockId).toBeNull();
    store.selectPage(page1Id);
    expect(useEditorStore.getState().selectedBlockId).toBeNull();
  });

  it('newProject clears block selection', () => {
    const store = useEditorStore.getState();
    store.addTextBlock();
    expect(useEditorStore.getState().selectedBlockId).not.toBeNull();
    store.newProject();
    expect(useEditorStore.getState().selectedBlockId).toBeNull();
  });

  it('getSelectedBlock returns the currently selected text block', () => {
    const store = useEditorStore.getState();
    const id = store.addTextBlock({ text: 'Pick me' });
    const sel = store.getSelectedBlock();
    expect(sel).not.toBeNull();
    expect(sel?.id).toBe(id);
    expect(sel?.text).toBe('Pick me');
  });

  it('getSelectedBlock returns null when nothing is selected', () => {
    const store = useEditorStore.getState();
    expect(store.getSelectedBlock()).toBeNull();
  });

  it('project remains valid after a sequence of add + update operations', () => {
    const store = useEditorStore.getState();
    const id1 = store.addTextBlock({ text: 'A' });
    store.addTextBlock({ text: 'B', x: 200, y: 200 });
    store.updateTextBlock(id1, { fontSize: 18, color: '#000000' });
    store.addPage();
    store.addTextBlock({ text: 'C' });

    const { project } = useEditorStore.getState();
    expect(isValidProject(project)).toBe(true);
    expect(project.pages[0].blocks).toHaveLength(2);
    expect(project.pages[1].blocks).toHaveLength(1);
  });
});

// =========================================================================
// Scope-lock assertions
// =========================================================================
describe('editor store — scope-lock', () => {
  it('store does NOT expose renamePage (M3 feature)', () => {
    const store = useEditorStore.getState();
    expect((store as unknown as Record<string, unknown>).renamePage).toBeUndefined();
  });

  it('store does NOT expose deletePage (M3 feature)', () => {
    const store = useEditorStore.getState();
    expect((store as unknown as Record<string, unknown>).deletePage).toBeUndefined();
  });

  it('store does NOT expose duplicatePage (M3 feature)', () => {
    const store = useEditorStore.getState();
    expect((store as unknown as Record<string, unknown>).duplicatePage).toBeUndefined();
  });

  it('store does NOT expose addImageBlock (M4 feature)', () => {
    const store = useEditorStore.getState();
    expect((store as unknown as Record<string, unknown>).addImageBlock).toBeUndefined();
  });

  it('store does NOT expose addButtonBlock (M5 feature)', () => {
    const store = useEditorStore.getState();
    expect((store as unknown as Record<string, unknown>).addButtonBlock).toBeUndefined();
  });

  it('store does NOT expose removeBlock (deferred — not in M2 scope)', () => {
    const store = useEditorStore.getState();
    expect((store as unknown as Record<string, unknown>).removeBlock).toBeUndefined();
  });
});
