/**
 * Scope-lock test — UI level.
 *
 * M2 LOCK (bumped from M1 lock in Batch 2):
 *
 *   ALLOWED in M2:
 *     - Toolbar: "+ Teks" ENABLED
 *     - Inspector: text block editor fields (text/x/y/width/height/fontSize/color/fontWeight/align)
 *       visible WHEN a text block is selected
 *
 *   STILL LOCKED in M2:
 *     - Toolbar: "+ Gambar" (M4), "+ Tombol" (M5), "Export HTML" (M6), "Preview" (M5) DISABLED
 *     - PagePanel: NO duplicate/delete/rename buttons (M3)
 *     - Inspector: NO image-specific fields (src/objectFit) — M4
 *     - Inspector: NO button-specific fields (action/targetPageId) — M5
 *
 * Test ini mencegah scope leak. Jika seseorang meng-enable tombol M4+,
 * atau menambah field image/button di inspector sebelum milestone-nya,
 * test ini akan gagal.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Toolbar } from '../editor/Toolbar';
import { PagePanel } from '../editor/PagePanel';
import { Inspector } from '../editor/Inspector';
import { useEditorStore } from '../store/editor-store';

function queryByAction(container: HTMLElement, action: string): HTMLElement | null {
  return container.querySelector(`[data-action="${action}"]`);
}

describe('scope-lock M2 — Toolbar: + Teks ENABLED, others DISABLED', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('"+ Teks" button is ENABLED (M2 active)', () => {
    const { container } = render(<Toolbar />);
    const btn = queryByAction(container, 'add-text');
    expect(btn).not.toBeNull();
    expect((btn as HTMLButtonElement).disabled).toBe(false);
  });

  it('"+ Teks" button calls addTextBlock when clicked', () => {
    const { container } = render(<Toolbar />);
    const btn = queryByAction(container, 'add-text') as HTMLButtonElement;
    btn.click();
    const { project, selectedBlockId } = useEditorStore.getState();
    const page = project.pages.find((p) => p.id === project.currentPageId)!;
    expect(page.blocks).toHaveLength(1);
    expect(page.blocks[0].type).toBe('text');
    expect(selectedBlockId).toBe(page.blocks[0].id);
  });

  it('"+ Gambar" button is still disabled (M4 not started)', () => {
    const { container } = render(<Toolbar />);
    const btn = queryByAction(container, 'add-image');
    expect(btn).not.toBeNull();
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it('"+ Tombol" button is still disabled (M5 not started)', () => {
    const { container } = render(<Toolbar />);
    const btn = queryByAction(container, 'add-button');
    expect(btn).not.toBeNull();
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it('"Export HTML" button is still disabled (M6 not started)', () => {
    const { container } = render(<Toolbar />);
    const btn = queryByAction(container, 'export-html');
    expect(btn).not.toBeNull();
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it('"Preview" button is still disabled (M5 not started)', () => {
    const { container } = render(<Toolbar />);
    const btn = queryByAction(container, 'preview');
    expect(btn).not.toBeNull();
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('scope-lock M2 — PagePanel: still no M3 controls', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('PagePanel does NOT render a duplicate button', () => {
    const { container } = render(<PagePanel />);
    const dupBtns = container.querySelectorAll('[title="Duplikat halaman"]');
    expect(dupBtns.length).toBe(0);
  });

  it('PagePanel does NOT render a delete button', () => {
    const { container } = render(<PagePanel />);
    const delBtns = container.querySelectorAll('[title="Hapus halaman"]');
    expect(delBtns.length).toBe(0);
  });

  it('PagePanel renders the "+ Tambah" button (M1 in-scope)', () => {
    const { container } = render(<PagePanel />);
    const addBtns = container.querySelectorAll('[title="Tambah halaman"]');
    expect(addBtns.length).toBe(1);
  });
});

describe('scope-lock M2 — Inspector: text fields ONLY (no image/button fields)', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('Inspector shows placeholder when no block is selected', () => {
    const { container } = render(<Inspector />);
    // M2 placeholder mentions "Klik block" or "+ Teks"
    expect(container.textContent).toMatch(/Klik|Teks/);
  });

  it('Inspector shows text block fields when a text block is selected', () => {
    useEditorStore.getState().addTextBlock();
    const { container } = render(<Inspector />);

    // M2 in-scope fields
    expect(container.querySelector('[data-field="text"]')).not.toBeNull();
    expect(container.querySelector('[data-field="x"]')).not.toBeNull();
    expect(container.querySelector('[data-field="y"]')).not.toBeNull();
    expect(container.querySelector('[data-field="width"]')).not.toBeNull();
    expect(container.querySelector('[data-field="height"]')).not.toBeNull();
    expect(container.querySelector('[data-field="fontSize"]')).not.toBeNull();
    expect(container.querySelector('[data-field="color"]')).not.toBeNull();
    expect(container.querySelector('[data-field="fontWeight"]')).not.toBeNull();
    expect(container.querySelector('[data-field="align"]')).not.toBeNull();
  });

  it('Inspector does NOT render image-specific fields (M4)', () => {
    useEditorStore.getState().addTextBlock();
    const { container } = render(<Inspector />);
    expect(container.querySelector('[data-field="src"]')).toBeNull();
    expect(container.querySelector('[data-field="objectFit"]')).toBeNull();
  });

  it('Inspector does NOT render button-specific fields (M5)', () => {
    useEditorStore.getState().addTextBlock();
    const { container } = render(<Inspector />);
    expect(container.querySelector('[data-field="label"]')).toBeNull();
    expect(container.querySelector('[data-field="action"]')).toBeNull();
    expect(container.querySelector('[data-field="targetPageId"]')).toBeNull();
  });
});
