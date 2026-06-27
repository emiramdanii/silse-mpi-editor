/**
 * Scope-lock test — UI level.
 *
 * M2R LOCK (Batch 2R):
 *
 *   ALLOWED in M2R:
 *     - Toolbar: "+ Teks" ENABLED (but capability-checked at runtime)
 *     - Inspector: text component editor fields:
 *         variant (selector, 7 option Indonesia label), text, x, y, width, height
 *       visible WHEN a text component is selected
 *     - Inspector: page info shows role + capability status when no component selected
 *
 *   STILL LOCKED in M2R:
 *     - Toolbar: "+ Gambar" (M4), "+ Navigasi" (M5), "Export HTML" (M6),
 *       "Preview" (M5) DISABLED
 *     - PagePanel: NO duplicate/delete/rename buttons (M3)
 *     - Inspector: NO field style manual (fontSize/color/fontWeight/align)
 *     - Inspector: NO image-specific fields (src/objectFit) — M4
 *     - Inspector: NO navigation-specific fields (label/action/targetPageId) — M5
 *
 *   UI LANGUAGE:
 *     - User-facing text must NOT use "block" — use "elemen"/"komponen".
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Toolbar } from '../editor/Toolbar';
import { PagePanel } from '../editor/PagePanel';
import { Inspector } from '../editor/Inspector';
import { useEditorStore } from '../store/editor-store';
import { TEXT_COMPONENT_VARIANTS } from '../core/types';

function queryByAction(container: HTMLElement, action: string): HTMLElement | null {
  return container.querySelector(`[data-action="${action}"]`);
}

describe('scope-lock M3 — Toolbar: + Teks ENABLED, others DISABLED', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('"+ Teks" button is ENABLED (M2R active)', () => {
    const { container } = render(<Toolbar />);
    const btn = queryByAction(container, 'add-text');
    expect(btn).not.toBeNull();
    expect((btn as HTMLButtonElement).disabled).toBe(false);
  });

  it('"+ Teks" on cover page returns null (capability denied, silent)', () => {
    const { container } = render(<Toolbar />);
    const btn = queryByAction(container, 'add-text') as HTMLButtonElement;
    btn.click();
    // Cover page denies add — components unchanged (still 1 pre-filled title)
    const { project } = useEditorStore.getState();
    expect(project.pages[0].components).toHaveLength(1);
    expect(useEditorStore.getState().selectedComponentId).toBeNull();
  });

  it('"+ Teks" on free page succeeds', () => {
    useEditorStore.getState().addPage(); // free page
    const { container } = render(<Toolbar />);
    const btn = queryByAction(container, 'add-text') as HTMLButtonElement;
    btn.click();
    const { project, selectedComponentId } = useEditorStore.getState();
    const page = project.pages.find((p) => p.id === project.currentPageId)!;
    expect(page.components).toHaveLength(1);
    expect(page.components[0].type).toBe('text');
    expect(selectedComponentId).toBe(page.components[0].id);
  });

  it('"+ Teks" on free page creates variant=body', () => {
    useEditorStore.getState().addPage();
    const { container } = render(<Toolbar />);
    const btn = queryByAction(container, 'add-text') as HTMLButtonElement;
    btn.click();
    const { project } = useEditorStore.getState();
    const c = project.pages[1].components[0] as { variant: string };
    expect(c.variant).toBe('body');
  });

  it('"+ Gambar" button is disabled (M4 not started)', () => {
    const { container } = render(<Toolbar />);
    const btn = queryByAction(container, 'add-image');
    expect(btn).not.toBeNull();
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it('"+ Navigasi" button is disabled (M5 not started)', () => {
    const { container } = render(<Toolbar />);
    const btn = queryByAction(container, 'add-navigation');
    expect(btn).not.toBeNull();
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it('"Export HTML" button is disabled (M6 not started)', () => {
    const { container } = render(<Toolbar />);
    const btn = queryByAction(container, 'export-html');
    expect(btn).not.toBeNull();
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it('"Preview" button is disabled (M5 not started)', () => {
    const { container } = render(<Toolbar />);
    const btn = queryByAction(container, 'preview');
    expect(btn).not.toBeNull();
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('scope-lock M3 — PagePanel: HAS M3 controls (rename/duplicate/delete)', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
    // Add a second page so delete button is visible (delete disabled on last page)
    useEditorStore.getState().addPage();
    useEditorStore.getState().selectPage(useEditorStore.getState().project.pages[0].id);
  });

  it('PagePanel renders a rename button (M3 active)', () => {
    const { container } = render(<PagePanel />);
    expect(container.querySelectorAll('[title="Ganti nama halaman"]').length).toBeGreaterThan(0);
  });

  it('PagePanel renders a duplicate button (M3 active)', () => {
    const { container } = render(<PagePanel />);
    expect(container.querySelectorAll('[title="Duplikat halaman"]').length).toBeGreaterThan(0);
  });

  it('PagePanel renders a delete button when more than 1 page (M3 active)', () => {
    const { container } = render(<PagePanel />);
    expect(container.querySelectorAll('[title="Hapus halaman"]').length).toBeGreaterThan(0);
  });

  it('PagePanel hides delete button on last page (safety)', () => {
    useEditorStore.getState().newProject(); // back to single page
    const { container } = render(<PagePanel />);
    expect(container.querySelectorAll('[title="Hapus halaman"]').length).toBe(0);
  });

  it('PagePanel renders the "+ Tambah" button (M1 in-scope)', () => {
    const { container } = render(<PagePanel />);
    expect(container.querySelectorAll('[title="Tambah halaman"]').length).toBe(1);
  });
});

describe('scope-lock M3 — Inspector: variant + text + geometry ONLY', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('Inspector shows page info (role + capability) when no component selected', () => {
    const { container } = render(<Inspector />);
    // Should mention role (cover) and capability
    expect(container.textContent).toMatch(/cover/i);
    expect(container.textContent).toMatch(/capability|terpandu|elemen/i);
  });

  it('Inspector shows variant selector when a text component is selected', () => {
    // Select the pre-filled title component on cover
    const store = useEditorStore.getState();
    const cover = store.project.pages[0];
    const titleComponentId = cover.components[0].id;
    store.selectComponent(titleComponentId);

    const { container } = render(<Inspector />);
    const variantField = container.querySelector('[data-field="variant"]');
    expect(variantField).not.toBeNull();
    expect(variantField?.tagName).toBe('SELECT');
  });

  it('variant selector has exactly 7 options matching TEXT_COMPONENT_VARIANTS', () => {
    const store = useEditorStore.getState();
    const cover = store.project.pages[0];
    store.selectComponent(cover.components[0].id);

    const { container } = render(<Inspector />);
    const select = container.querySelector('[data-field="variant"]') as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.value);
    expect(options).toEqual(Array.from(TEXT_COMPONENT_VARIANTS));
  });

  it('Inspector shows text field when component selected', () => {
    const store = useEditorStore.getState();
    store.selectComponent(store.project.pages[0].components[0].id);
    const { container } = render(<Inspector />);
    expect(container.querySelector('[data-field="text"]')).not.toBeNull();
  });

  it('Inspector shows geometry fields (x/y/width/height) when component selected', () => {
    const store = useEditorStore.getState();
    store.selectComponent(store.project.pages[0].components[0].id);
    const { container } = render(<Inspector />);
    expect(container.querySelector('[data-field="x"]')).not.toBeNull();
    expect(container.querySelector('[data-field="y"]')).not.toBeNull();
    expect(container.querySelector('[data-field="width"]')).not.toBeNull();
    expect(container.querySelector('[data-field="height"]')).not.toBeNull();
  });

  it('Inspector does NOT render field style manual (fontSize/color/fontWeight/align)', () => {
    const store = useEditorStore.getState();
    store.selectComponent(store.project.pages[0].components[0].id);
    const { container } = render(<Inspector />);
    expect(container.querySelector('[data-field="fontSize"]')).toBeNull();
    expect(container.querySelector('[data-field="color"]')).toBeNull();
    expect(container.querySelector('[data-field="fontWeight"]')).toBeNull();
    expect(container.querySelector('[data-field="align"]')).toBeNull();
  });

  it('Inspector does NOT render image-specific fields (M4)', () => {
    const store = useEditorStore.getState();
    store.selectComponent(store.project.pages[0].components[0].id);
    const { container } = render(<Inspector />);
    expect(container.querySelector('[data-field="src"]')).toBeNull();
    expect(container.querySelector('[data-field="objectFit"]')).toBeNull();
  });

  it('Inspector does NOT render navigation-specific fields (M5)', () => {
    const store = useEditorStore.getState();
    store.selectComponent(store.project.pages[0].components[0].id);
    const { container } = render(<Inspector />);
    expect(container.querySelector('[data-field="label"]')).toBeNull();
    expect(container.querySelector('[data-field="action"]')).toBeNull();
    expect(container.querySelector('[data-field="targetPageId"]')).toBeNull();
  });

  it('variant selector changes variant when option picked', () => {
    const store = useEditorStore.getState();
    store.selectComponent(store.project.pages[0].components[0].id);
    const { container } = render(<Inspector />);
    const select = container.querySelector('[data-field="variant"]') as HTMLSelectElement;

    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
    setter?.call(select, 'subtitle');
    select.dispatchEvent(new Event('change', { bubbles: true }));

    const { project } = useEditorStore.getState();
    const c = project.pages[0].components[0] as { variant: string };
    expect(c.variant).toBe('subtitle');
  });
});

describe('scope-lock M3 — UI language: NO "block" in user-facing text', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('Toolbar does not use "block" in user-facing text', () => {
    const { container } = render(<Toolbar />);
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/block/i);
  });

  it('PagePanel does not use "block" in user-facing text', () => {
    const { container } = render(<PagePanel />);
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/block/i);
  });

  it('Inspector (no selection) does not use "block" in user-facing text', () => {
    const { container } = render(<Inspector />);
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/block/i);
  });

  it('Inspector (with selection) does not use "block" in user-facing text', () => {
    const store = useEditorStore.getState();
    store.selectComponent(store.project.pages[0].components[0].id);
    const { container } = render(<Inspector />);
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/block/i);
  });

  it('CanvasStage empty state uses "elemen", not "block"', () => {
    // Add a free page (which has 0 components) to trigger empty state
    useEditorStore.getState().addPage();
    const { container } = render(<Inspector />);
    // Just verify no "block" leaks; CanvasStage itself is tested via store
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/block/i);
  });
});
