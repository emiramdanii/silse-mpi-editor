/**
 * Scope-lock test — UI level.
 *
 * Memastikan bahwa fitur milestone mendatang TIDAK aktif di UI M1:
 *   - Toolbar: tombol "+ Teks" (M2), "+ Gambar" (M4), "+ Tombol" (M5),
 *             "Export HTML" (M6), "Preview" (M5) semua harus disabled.
 *   - PagePanel: tidak ada tombol duplicate/delete/rename (M3).
 *   - Inspector: tidak ada editor block (M2+), hanya placeholder info.
 *
 * Test ini mencegah scope leak di arah UI. Jika seseorang
 * meng-enable salah satu tombol di atas sebelum milestone-nya tiba,
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

describe('scope-lock — Toolbar M2+ buttons must be disabled in M1', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('"+ Teks" button is disabled (M2 not started)', () => {
    const { container } = render(<Toolbar />);
    const btn = queryByAction(container, 'add-text');
    expect(btn).not.toBeNull();
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it('"+ Gambar" button is disabled (M4 not started)', () => {
    const { container } = render(<Toolbar />);
    const btn = queryByAction(container, 'add-image');
    expect(btn).not.toBeNull();
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it('"+ Tombol" button is disabled (M5 not started)', () => {
    const { container } = render(<Toolbar />);
    const btn = queryByAction(container, 'add-button');
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

describe('scope-lock — PagePanel M3 controls must not exist in M1', () => {
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

describe('scope-lock — Inspector must be placeholder-only in M1', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('Inspector renders placeholder text mentioning M2', () => {
    const { container } = render(<Inspector />);
    expect(container.textContent).toMatch(/M2/);
  });

  it('Inspector does NOT render block editor inputs (no fontSize/color/align)', () => {
    const { container } = render(<Inspector />);
    // M2 will add these. For M1, they must not exist.
    const fontSizeInputs = container.querySelectorAll('[data-field="fontSize"]');
    const colorInputs = container.querySelectorAll('[data-field="color"]');
    const alignInputs = container.querySelectorAll('[data-field="align"]');
    expect(fontSizeInputs.length).toBe(0);
    expect(colorInputs.length).toBe(0);
    expect(alignInputs.length).toBe(0);
  });
});
