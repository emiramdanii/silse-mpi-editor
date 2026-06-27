import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from '../store/editor-store';
import { isValidProject } from '../core/validation';
import { canAddComponent } from '../core/capability';
import { isTextComponent } from '../components/component-utils';

/**
 * Tests for editor store — M2R scope.
 *
 * M1: project lifecycle + page add/select.
 * M2R: text component add/select/update dengan PageRole + Capability Matrix.
 *
 * Kontrak kunci:
 *   - addTextComponent di cover return null (capability denied).
 *   - addTextComponent di page free/material berhasil, default variant sesuai role.
 *   - selectPage/newProject auto-clear selection.
 *
 * Operasi rename/delete/duplicate page (M3) TIDAK ada di store.
 * Operasi setPageRole (M11) TIDAK ada di store.
 * Operasi image/navigation component (M4/M5) TIDAK ada di store.
 */
describe('editor store — M1 scope (project & pages)', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('starts with a project containing 1 page (Cover, role=cover)', () => {
    const { project } = useEditorStore.getState();
    expect(project.pages).toHaveLength(1);
    expect(project.pages[0].role).toBe('cover');
    expect(project.pages[0].title).toBe('Cover');
  });

  it('cover page pre-filled with 1 text component variant=title', () => {
    const { project } = useEditorStore.getState();
    const cover = project.pages[0];
    expect(cover.components).toHaveLength(1);
    expect(cover.components[0].type).toBe('text');
    const tc = cover.components[0];
    expect(isTextComponent(tc) && tc.variant).toBe('title');
  });

  it('currentPageId points to the first page on init', () => {
    const { project } = useEditorStore.getState();
    expect(project.currentPageId).toBe(project.pages[0].id);
  });

  it('addPage creates a new page with role=free', () => {
    const store = useEditorStore.getState();
    const newPageId = store.addPage();
    const { project } = useEditorStore.getState();
    const newPage = project.pages.find((p) => p.id === newPageId);
    expect(newPage?.role).toBe('free');
    expect(project.pages).toHaveLength(2);
    expect(project.currentPageId).toBe(newPageId);
  });

  it('addPage with explicit title', () => {
    const store = useEditorStore.getState();
    const id = store.addPage('Materi 1');
    const { project } = useEditorStore.getState();
    const page = project.pages.find((p) => p.id === id);
    expect(page?.title).toBe('Materi 1');
    expect(page?.role).toBe('free');
  });

  it('selectPage changes currentPageId', () => {
    const store = useEditorStore.getState();
    const firstId = store.project.pages[0].id;
    store.addPage();
    store.selectPage(firstId);
    expect(useEditorStore.getState().project.currentPageId).toBe(firstId);
  });

  it('selectPage ignores unknown page id', () => {
    const store = useEditorStore.getState();
    const before = store.project.currentPageId;
    store.selectPage('non-existent');
    expect(useEditorStore.getState().project.currentPageId).toBe(before);
  });

  it('getCurrentPage returns the active page', () => {
    const store = useEditorStore.getState();
    const current = store.getCurrentPage();
    expect(current?.id).toBe(useEditorStore.getState().project.currentPageId);
  });

  it('newProject resets to a single cover page with pre-filled title', () => {
    const store = useEditorStore.getState();
    store.addPage();
    store.addPage();
    expect(useEditorStore.getState().project.pages).toHaveLength(3);

    store.newProject();
    const { project } = useEditorStore.getState();
    expect(project.pages).toHaveLength(1);
    expect(project.pages[0].role).toBe('cover');
    expect(project.pages[0].components).toHaveLength(1);
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
// M2R — Text Component operations with Capability Matrix
// =========================================================================
describe('editor store — M2R scope (text component + capability)', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('addTextComponent on cover returns null (capability denied)', () => {
    const store = useEditorStore.getState();
    // Project default = cover page
    const result = store.addTextComponent();
    expect(result).toBeNull();
    // Cover page components unchanged (still 1 pre-filled title)
    const { project } = useEditorStore.getState();
    expect(project.pages[0].components).toHaveLength(1);
  });

  it('addTextComponent on free page succeeds and selects it', () => {
    const store = useEditorStore.getState();
    store.addPage(); // creates free page, switches to it
    const result = store.addTextComponent();

    expect(result).not.toBeNull();
    const { project, selectedComponentId } = useEditorStore.getState();
    const page = project.pages.find((p) => p.id === project.currentPageId)!;
    expect(page.components).toHaveLength(1);
    expect(page.components[0].id).toBe(result);
    expect(page.components[0].type).toBe('text');
    expect(selectedComponentId).toBe(result);
  });

  it('addTextComponent on free page creates variant=body by default', () => {
    const store = useEditorStore.getState();
    store.addPage();
    store.addTextComponent();
    const { project } = useEditorStore.getState();
    const tc = project.pages[1].components[0];
    expect(isTextComponent(tc) && tc.variant).toBe('body');
  });

  it('addTextComponent applies overrides', () => {
    const store = useEditorStore.getState();
    store.addPage();
    store.addTextComponent({ text: 'Custom', x: 200, y: 200, width: 800 });
    const { project } = useEditorStore.getState();
    const tc = project.pages[1].components[0];
    expect(isTextComponent(tc)).toBe(true);
    if (!isTextComponent(tc)) return;
    expect(tc.text).toBe('Custom');
    expect(tc.x).toBe(200);
    expect(tc.width).toBe(800);
  });

  it('addTextComponent does NOT touch other pages', () => {
    const store = useEditorStore.getState();
    store.addPage(); // page 2 (free)
    store.addTextComponent({ text: 'on page 2' });
    store.addPage(); // page 3 (free)
    store.addTextComponent({ text: 'on page 3' });

    const { project } = useEditorStore.getState();
    // page 0 = cover (1 pre-filled title)
    expect(project.pages[0].components).toHaveLength(1);
    expect(project.pages[1].components).toHaveLength(1);
    expect(project.pages[2].components).toHaveLength(1);
    const tc2 = project.pages[1].components[0];
    const tc3 = project.pages[2].components[0];
    expect(isTextComponent(tc2) && tc2.text).toBe('on page 2');
    expect(isTextComponent(tc3) && tc3.text).toBe('on page 3');
  });

  it('selectComponent sets selectedComponentId', () => {
    const store = useEditorStore.getState();
    store.addPage();
    const id = store.addTextComponent()!;
    store.selectComponent(null);
    expect(useEditorStore.getState().selectedComponentId).toBeNull();
    store.selectComponent(id);
    expect(useEditorStore.getState().selectedComponentId).toBe(id);
  });

  it('selectComponent(null) clears selection', () => {
    const store = useEditorStore.getState();
    store.addPage();
    store.addTextComponent();
    expect(useEditorStore.getState().selectedComponentId).not.toBeNull();
    store.selectComponent(null);
    expect(useEditorStore.getState().selectedComponentId).toBeNull();
  });

  it('selectComponent ignores unknown id (no-op)', () => {
    const store = useEditorStore.getState();
    store.addPage();
    expect(useEditorStore.getState().selectedComponentId).toBeNull();
    store.selectComponent('does-not-exist');
    expect(useEditorStore.getState().selectedComponentId).toBeNull();

    const id = store.addTextComponent()!;
    store.selectComponent('does-not-exist');
    expect(useEditorStore.getState().selectedComponentId).toBe(id);
  });

  it('selectComponent ignores component from another page', () => {
    const store = useEditorStore.getState();
    store.addPage();
    store.addTextComponent();
    const componentId = useEditorStore.getState().selectedComponentId!;
    store.addPage(); // switches page, clears selection
    expect(useEditorStore.getState().selectedComponentId).toBeNull();
    store.selectComponent(componentId);
    expect(useEditorStore.getState().selectedComponentId).toBeNull();
  });

  it('updateTextComponent modifies text content in place', () => {
    const store = useEditorStore.getState();
    store.addPage();
    const id = store.addTextComponent()!;
    store.updateTextComponent(id, { text: 'Updated' });
    const { project } = useEditorStore.getState();
    const tc = project.pages[1].components[0];
    expect(isTextComponent(tc) && tc.text).toBe('Updated');
  });

  it('updateTextComponent modifies geometry', () => {
    const store = useEditorStore.getState();
    store.addPage();
    const id = store.addTextComponent()!;
    store.updateTextComponent(id, { x: 500, y: 600, width: 700, height: 100 });
    const { project } = useEditorStore.getState();
    const tc = project.pages[1].components[0];
    expect(isTextComponent(tc)).toBe(true);
    if (!isTextComponent(tc)) return;
    expect(tc.x).toBe(500);
    expect(tc.y).toBe(600);
    expect(tc.width).toBe(700);
    expect(tc.height).toBe(100);
  });

  it('updateTextComponent changes variant to any valid value', () => {
    const store = useEditorStore.getState();
    store.addPage();
    const id = store.addTextComponent()!;
    // Use TextComponentVariant values directly
    const variants = [
      'title',
      'subtitle',
      'body',
      'instruction',
      'importantNote',
      'questionPrompt',
      'reflectionBox',
    ] as const;
    for (const v of variants) {
      store.updateTextComponent(id, { variant: v });
      const { project } = useEditorStore.getState();
      const tc = project.pages[1].components[0];
      expect(isTextComponent(tc) && tc.variant).toBe(v);
    }
  });

  it('updateTextComponent REJECTS invalid variant (keeps old)', () => {
    const store = useEditorStore.getState();
    store.addPage();
    const id = store.addTextComponent({ variant: 'title' })!;
    store.updateTextComponent(id, { variant: 'invalidVariant' as never });
    const { project } = useEditorStore.getState();
    const tc = project.pages[1].components[0];
    expect(isTextComponent(tc) && tc.variant).toBe('title');
  });

  it('updateTextComponent does NOT change id or type', () => {
    const store = useEditorStore.getState();
    store.addPage();
    const id = store.addTextComponent()!;
    store.updateTextComponent(id, { text: 'Still text' });
    const { project } = useEditorStore.getState();
    const tc = project.pages[1].components[0];
    expect(tc.id).toBe(id);
    expect(tc.type).toBe('text');
  });

  it('updateTextComponent on unknown id is a no-op', () => {
    const store = useEditorStore.getState();
    store.addPage();
    store.addTextComponent();
    const before = useEditorStore.getState().project;
    store.updateTextComponent('nope', { text: 'X' });
    const after = useEditorStore.getState().project;
    expect(after).toBe(before);
  });

  it('selectPage clears component selection', () => {
    const store = useEditorStore.getState();
    const coverId = store.project.pages[0].id;
    store.addPage();
    store.addTextComponent();
    expect(useEditorStore.getState().selectedComponentId).not.toBeNull();
    store.selectPage(coverId);
    expect(useEditorStore.getState().selectedComponentId).toBeNull();
  });

  it('newProject clears component selection', () => {
    const store = useEditorStore.getState();
    store.addPage();
    store.addTextComponent();
    expect(useEditorStore.getState().selectedComponentId).not.toBeNull();
    store.newProject();
    expect(useEditorStore.getState().selectedComponentId).toBeNull();
  });

  it('getSelectedComponent returns the currently selected text component', () => {
    const store = useEditorStore.getState();
    store.addPage();
    const id = store.addTextComponent({ text: 'Pick me' })!;
    const sel = store.getSelectedComponent();
    expect(sel?.id).toBe(id);
    expect(sel?.text).toBe('Pick me');
  });

  it('getSelectedComponent returns null when nothing selected', () => {
    const store = useEditorStore.getState();
    expect(store.getSelectedComponent()).toBeNull();
  });

  it('can still select pre-filled title component on cover', () => {
    const store = useEditorStore.getState();
    // Cover page has 1 pre-filled title component
    const cover = store.project.pages[0];
    const titleComponentId = cover.components[0].id;
    store.selectComponent(titleComponentId);
    expect(useEditorStore.getState().selectedComponentId).toBe(titleComponentId);
    const sel = store.getSelectedComponent();
    expect(sel?.variant).toBe('title');
  });

  it('can update pre-filled title component text on cover', () => {
    const store = useEditorStore.getState();
    const cover = store.project.pages[0];
    const titleComponentId = cover.components[0].id;
    store.updateTextComponent(titleComponentId, { text: 'MPI Pertamaku' });
    const sel = store.getSelectedComponent();
    // Note: we didn't select first; getSelectedComponent uses selectedComponentId
    store.selectComponent(titleComponentId);
    const sel2 = store.getSelectedComponent();
    expect(sel2?.text).toBe('MPI Pertamaku');
    void sel;
  });

  it('project remains valid after a sequence of operations', () => {
    const store = useEditorStore.getState();
    // Cover has 1 title component
    store.addPage(); // free
    const id1 = store.addTextComponent({ text: 'A', variant: 'body' })!;
    store.addTextComponent({ text: 'B', variant: 'instruction' });
    store.updateTextComponent(id1, { variant: 'importantNote' });
    store.addPage(); // free
    store.addTextComponent({ text: 'C' });

    const { project } = useEditorStore.getState();
    expect(isValidProject(project)).toBe(true);
    expect(project.pages[0].components).toHaveLength(1); // cover pre-filled
    expect(project.pages[1].components).toHaveLength(2);
    expect(project.pages[2].components).toHaveLength(1);
  });
});

// =========================================================================
// Scope-lock assertions
// =========================================================================
describe('editor store — scope-lock (M2R)', () => {
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

  it('store does NOT expose setPageRole (M11 feature)', () => {
    const store = useEditorStore.getState();
    expect((store as unknown as Record<string, unknown>).setPageRole).toBeUndefined();
  });

  it('store does NOT expose addImageComponent (M4 feature)', () => {
    const store = useEditorStore.getState();
    expect((store as unknown as Record<string, unknown>).addImageComponent).toBeUndefined();
  });

  it('store does NOT expose addNavigationComponent (M5 feature)', () => {
    const store = useEditorStore.getState();
    expect((store as unknown as Record<string, unknown>).addNavigationComponent).toBeUndefined();
  });

  it('store does NOT expose addCardComponent (M4 feature)', () => {
    const store = useEditorStore.getState();
    expect((store as unknown as Record<string, unknown>).addCardComponent).toBeUndefined();
  });

  it('store does NOT expose addQuestionComponent (M11 feature)', () => {
    const store = useEditorStore.getState();
    expect((store as unknown as Record<string, unknown>).addQuestionComponent).toBeUndefined();
  });

  it('store does NOT expose removeComponent (deferred — not in M2 scope)', () => {
    const store = useEditorStore.getState();
    expect((store as unknown as Record<string, unknown>).removeComponent).toBeUndefined();
  });

  it('store does NOT expose legacy addTextBlock (renamed to addTextComponent in 2R)', () => {
    const store = useEditorStore.getState();
    expect((store as unknown as Record<string, unknown>).addTextBlock).toBeUndefined();
    expect((store as unknown as Record<string, unknown>).selectBlock).toBeUndefined();
    expect((store as unknown as Record<string, unknown>).updateTextBlock).toBeUndefined();
    expect((store as unknown as Record<string, unknown>).getSelectedBlock).toBeUndefined();
    expect((store as unknown as Record<string, unknown>).selectedBlockId).toBeUndefined();
  });

  it('canAddComponent is re-exported from capability (for UI)', () => {
    expect(typeof canAddComponent).toBe('function');
  });
});
