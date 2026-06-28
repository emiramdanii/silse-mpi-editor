/**
 * UX-01 — Guided MPI Editor UI Redesign tests.
 *
 * Layer: tests
 *
 * Kontrak (UX-01):
 *   - Editor terasa sebagai workspace guru, bukan panel teknis komponen.
 *   - MpiProgressStrip: tampilkan cakupan 10 peran standar + quality flag.
 *   - Topbar: header workspace dengan brand + judul editable + curriculum chip
 *     + progress strip + aksi primer (Pratinjau, Export HTML).
 *   - PagePanel: alur pembelajaran dengan section Pembukaan/Inti/Penutup
 *     + label role ramah guru + ikon.
 *   - EditorToolbar: header kontekstual "Tambah elemen di [role]" + grouped
 *     Konten/Interaksi + file actions.
 *   - Inspector: friendly element name (Teks Judul, Kartu Info, dst) +
 *     section Isi/Tampilan/Posisi & Ukuran.
 *
 *   Kontrak lama (data-action, data-field, no "block") tetap dipertahankan
 *   dan dites via scope-lock.test.tsx.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import { MpiProgressStrip } from '../editor/MpiProgressStrip';
import { Topbar } from '../editor/Topbar';
import { PagePanel } from '../editor/PagePanel';
import { Toolbar } from '../editor/Toolbar';
import { Inspector } from '../editor/Inspector';
import { useEditorStore } from '../store/editor-store';
import { createSamplePpknProject } from '../core/sample-project';
import {
  MPI_STANDARD_ROLES,
  MPI_PHASE_LABELS,
  isStandardRole,
  getRoleInfo,
  computeMpiCoverage,
} from '../editor/mpi-standard-roles';

// =========================================================================
// MPI Standard Roles metadata
// =========================================================================

describe('UX-01 — mpi-standard-roles metadata', () => {
  it('has exactly 10 standard roles', () => {
    expect(MPI_STANDARD_ROLES).toHaveLength(10);
  });

  it('covers all 3 phases (pembukaan, inti, penutup)', () => {
    const phases = new Set(MPI_STANDARD_ROLES.map((r) => r.phase));
    expect(phases.has('pembukaan')).toBe(true);
    expect(phases.has('inti')).toBe(true);
    expect(phases.has('penutup')).toBe(true);
  });

  it('each role has label, short, icon, hint — non-empty', () => {
    for (const r of MPI_STANDARD_ROLES) {
      expect(r.label.length).toBeGreaterThan(0);
      expect(r.short.length).toBeGreaterThan(0);
      expect(r.icon.length).toBeGreaterThan(0);
      expect(r.hint.length).toBeGreaterThan(0);
    }
  });

  it('isStandardRole returns true for the 10 standard roles', () => {
    expect(isStandardRole('cover')).toBe(true);
    expect(isStandardRole('guide')).toBe(true);
    expect(isStandardRole('menu')).toBe(true);
    expect(isStandardRole('learningObjectives')).toBe(true);
    expect(isStandardRole('starter')).toBe(true);
    expect(isStandardRole('material')).toBe(true);
    expect(isStandardRole('quiz')).toBe(true);
    expect(isStandardRole('activity')).toBe(true);
    expect(isStandardRole('reflection')).toBe(true);
    expect(isStandardRole('closing')).toBe(true);
    expect(isStandardRole('free')).toBe(false);
  });

  it('getRoleInfo returns friendly label for cover', () => {
    const info = getRoleInfo('cover');
    expect(info.label).toMatch(/Cover|Pembuka/i);
    expect(info.phase).toBe('pembukaan');
  });

  it('getRoleInfo fallback for free role', () => {
    const info = getRoleInfo('free');
    expect(info.label).toMatch(/Bebas/i);
  });

  it('MPI_PHASE_LABELS has all 3 phases', () => {
    expect(MPI_PHASE_LABELS.pembukaan).toMatch(/Pembukaan/);
    expect(MPI_PHASE_LABELS.inti).toMatch(/Inti/);
    expect(MPI_PHASE_LABELS.penutup).toMatch(/Penutup/);
  });

  it('computeMpiCoverage returns ratio present/missing for empty project', () => {
    const cov = computeMpiCoverage(['free']);
    expect(cov.present).toEqual([]);
    expect(cov.missing).toHaveLength(10);
    expect(cov.ratio).toBe('0/10');
  });

  it('computeMpiCoverage returns ratio for sample PPKn (10/10)', () => {
    const sample = createSamplePpknProject();
    const roles = sample.pages.map((p) => p.role);
    const cov = computeMpiCoverage(roles);
    expect(cov.present).toHaveLength(10);
    expect(cov.missing).toEqual([]);
    expect(cov.ratio).toBe('10/10');
  });
});

// =========================================================================
// MpiProgressStrip
// =========================================================================

describe('UX-01 — MpiProgressStrip', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('renders 10 chips for the 10 standard roles', () => {
    const { container } = render(React.createElement(MpiProgressStrip));
    const chips = container.querySelectorAll('.mpi-chip');
    expect(chips).toHaveLength(10);
  });

  it('new project (cover only) shows 1/10 ratio and ⚠ flag', () => {
    const { container } = render(React.createElement(MpiProgressStrip));
    const ratio = container.querySelector('[data-testid="mpi-progress-ratio"]');
    // newProject() creates a project with just a cover page → 1/10.
    expect(ratio?.textContent).toBe('1/10');
    const flag = container.querySelector('[data-testid="mpi-progress-flag"]');
    expect(flag?.textContent ?? '').toMatch(/⚠/);
  });

  it('sample PPKn shows 10/10 ratio and ✓ flag', () => {
    useEditorStore.getState().setProject(createSamplePpknProject());
    const { container } = render(React.createElement(MpiProgressStrip));
    const ratio = container.querySelector('[data-testid="mpi-progress-ratio"]');
    expect(ratio?.textContent).toBe('10/10');
    const flag = container.querySelector('[data-testid="mpi-progress-flag"]');
    expect(flag?.textContent ?? '').toMatch(/✓|Lengkap/);
  });

  it('clicking a present chip navigates to that page', () => {
    useEditorStore.getState().setProject(createSamplePpknProject());
    const { container } = render(React.createElement(MpiProgressStrip));
    const coverChip = container.querySelector(
      '[data-testid="mpi-chip-cover"][data-present="true"]',
    ) as HTMLButtonElement | null;
    expect(coverChip).not.toBeNull();
    fireEvent.click(coverChip!);
    const state = useEditorStore.getState();
    const current = state.project.pages.find((p) => p.id === state.project.currentPageId);
    expect(current?.role).toBe('cover');
  });

  it('missing role chip is disabled', () => {
    useEditorStore.getState().newProject(); // only cover
    const { container } = render(React.createElement(MpiProgressStrip));
    const guideChip = container.querySelector(
      '[data-testid="mpi-chip-guide"]',
    ) as HTMLButtonElement | null;
    expect(guideChip?.disabled).toBe(true);
  });
});

// =========================================================================
// Topbar (workspace header)
// =========================================================================

describe('UX-01 — Topbar workspace header', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('renders SILSE brand', () => {
    const { container } = render(React.createElement(Topbar));
    expect(container.textContent ?? '').toMatch(/SILSE/);
  });

  it('renders project title as editable button', () => {
    const { container } = render(React.createElement(Topbar));
    const titleBtn = container.querySelector('[data-testid="topbar-title-btn"]') as HTMLButtonElement | null;
    expect(titleBtn).not.toBeNull();
    // clicking turns it into an input
    fireEvent.click(titleBtn!);
    const input = container.querySelector('[data-testid="topbar-title-input"]');
    expect(input).not.toBeNull();
  });

  it('renders curriculum chip', () => {
    const { container } = render(React.createElement(Topbar));
    const chip = container.querySelector('.editor-topbar__curriculum');
    expect(chip).not.toBeNull();
  });

  it('renders Pratinjau and Export HTML primary actions', () => {
    const { container } = render(React.createElement(Topbar));
    expect(container.querySelector('[data-action="preview"]')).not.toBeNull();
    expect(container.querySelector('[data-action="export-html"]')).not.toBeNull();
  });

  it('renders MPI Baru button', () => {
    const { container } = render(React.createElement(Topbar));
    expect(container.querySelector('[data-action="new-project"]')).not.toBeNull();
  });

  it('sample project: curriculum chip shows subject · grade · phase', () => {
    useEditorStore.getState().setProject(createSamplePpknProject());
    const { container } = render(React.createElement(Topbar));
    const chip = container.querySelector('.editor-topbar__curriculum');
    expect(chip?.textContent ?? '').toMatch(/PPKn/);
    expect(chip?.textContent ?? '').toMatch(/Kelas 7/);
    expect(chip?.textContent ?? '').toMatch(/Fase D/);
  });

  it('renders MpiProgressStrip', () => {
    const { container } = render(React.createElement(Topbar));
    expect(container.querySelector('[data-testid="mpi-progress-strip"]')).not.toBeNull();
  });

  it('does not contain "block" in user-facing text', () => {
    const { container } = render(React.createElement(Topbar));
    expect(container.textContent ?? '').not.toMatch(/\bblock\b/i);
  });
});

// =========================================================================
// PagePanel (alur pembelajaran)
// =========================================================================

describe('UX-01 — PagePanel alur pembelajaran', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('header says "Alur Pembelajaran" (not just "Halaman")', () => {
    const { container } = render(React.createElement(PagePanel));
    expect(container.textContent ?? '').toMatch(/Alur Pembelajaran/);
  });

  it('sample project: renders 3 sections (Pembukaan, Inti, Penutup)', () => {
    useEditorStore.getState().setProject(createSamplePpknProject());
    const { container } = render(React.createElement(PagePanel));
    expect(container.querySelector('[data-testid="page-panel-section-pembukaan"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="page-panel-section-inti"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="page-panel-section-penutup"]')).not.toBeNull();
  });

  it('page item shows role icon (emoji)', () => {
    const { container } = render(React.createElement(PagePanel));
    const items = container.querySelectorAll('.page-item');
    expect(items.length).toBeGreaterThan(0);
    const firstItem = items[0];
    const icon = firstItem.querySelector('.page-item__icon');
    expect(icon?.textContent).toBeTruthy();
  });

  it('page item shows friendly role label (not raw role key)', () => {
    useEditorStore.getState().setProject(createSamplePpknProject());
    const { container } = render(React.createElement(PagePanel));
    // cover page should show "Halaman Cover" not "cover"
    const coverItem = container.querySelector('[data-role="cover"]');
    expect(coverItem?.textContent ?? '').toMatch(/Cover/i);
  });

  it('+ Tambah Halaman button is present with correct title attr', () => {
    const { container } = render(React.createElement(PagePanel));
    const addBtn = container.querySelector('[title="Tambah halaman"]');
    expect(addBtn).not.toBeNull();
  });

  it('does not contain "block" in user-facing text', () => {
    const { container } = render(React.createElement(PagePanel));
    expect(container.textContent ?? '').not.toMatch(/\bblock\b/i);
  });
});

// =========================================================================
// EditorToolbar (contextual)
// =========================================================================

describe('UX-01 — EditorToolbar contextual', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('renders contextual header "Tambah elemen di [role]"', () => {
    const { container } = render(React.createElement(Toolbar));
    const ctx = container.querySelector('[data-testid="editor-toolbar-context"]');
    expect(ctx?.textContent ?? '').toMatch(/Tambah elemen di/);
  });

  it('on cover: contextual header shows "Halaman Cover"', () => {
    const { container } = render(React.createElement(Toolbar));
    const role = container.querySelector('[data-testid="editor-toolbar-context-role"]');
    expect(role?.textContent ?? '').toMatch(/Cover/i);
  });

  it('on free: contextual header shows "Halaman Bebas"', () => {
    useEditorStore.getState().addPage(); // free
    const { container } = render(React.createElement(Toolbar));
    const role = container.querySelector('[data-testid="editor-toolbar-context-role"]');
    expect(role?.textContent ?? '').toMatch(/Bebas/i);
  });

  it('renders grouped sections: Konten, Interaksi, Berkas', () => {
    const { container } = render(React.createElement(Toolbar));
    expect(container.querySelector('[data-testid="editor-toolbar-group-konten"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="editor-toolbar-group-interaksi"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="editor-toolbar-group-berkas"]')).not.toBeNull();
  });

  it('add buttons have icon + label + hint', () => {
    useEditorStore.getState().addPage(); // free so buttons are enabled
    const { container } = render(React.createElement(Toolbar));
    const textBtn = container.querySelector('[data-action="add-text"]') as HTMLElement | null;
    expect(textBtn).not.toBeNull();
    // Should have icon, label "+ Teks", and hint text
    expect(textBtn!.querySelector('.editor-toolbar__add-icon')).not.toBeNull();
    expect(textBtn!.textContent ?? '').toMatch(/Teks/);
  });

  it('does not render Preview or Export HTML (moved to Topbar)', () => {
    const { container } = render(React.createElement(Toolbar));
    expect(container.querySelector('[data-action="preview"]')).toBeNull();
    expect(container.querySelector('[data-action="export-html"]')).toBeNull();
  });

  it('does not contain "block" in user-facing text', () => {
    const { container } = render(React.createElement(Toolbar));
    expect(container.textContent ?? '').not.toMatch(/\bblock\b/i);
  });
});

// =========================================================================
// Inspector (Panel Isi)
// =========================================================================

describe('UX-01 — Inspector Panel Isi', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('header says "Panel Isi" (not "Inspector")', () => {
    const { container } = render(React.createElement(Inspector));
    expect(container.textContent ?? '').toMatch(/Panel Isi/);
  });

  it('no selection: shows page info with role icon + friendly label + hint', () => {
    const { container } = render(React.createElement(Inspector));
    const info = container.querySelector('[data-testid="inspector-page-info"]');
    expect(info).not.toBeNull();
    expect(info?.textContent ?? '').toMatch(/Cover/i);
    expect(info?.querySelector('.inspector-page-info__icon')).not.toBeNull();
  });

  it('text component selected: header shows friendly element name (e.g., "Teks Judul")', () => {
    const store = useEditorStore.getState();
    // Cover has a pre-filled title component
    const cover = store.project.pages[0];
    store.selectComponent(cover.components[0].id);
    const { container } = render(React.createElement(Inspector));
    const editorHead = container.querySelector('.component-editor__head');
    expect(editorHead?.textContent ?? '').toMatch(/Teks/);
  });

  it('text component: Isi section appears before Tampilan', () => {
    const store = useEditorStore.getState();
    store.selectComponent(store.project.pages[0].components[0].id);
    const { container } = render(React.createElement(Inspector));
    const sections = Array.from(container.querySelectorAll('.inspector-section__title'))
      .map((el) => el.textContent ?? '');
    const isiIdx = sections.findIndex((s) => s.match(/Isi/));
    const tampilanIdx = sections.findIndex((s) => s.match(/Tampilan/));
    expect(isiIdx).toBeGreaterThanOrEqual(0);
    expect(tampilanIdx).toBeGreaterThanOrEqual(0);
    expect(isiIdx).toBeLessThan(tampilanIdx);
  });

  it('text component: Posisi & Ukuran section is present (not collapsed)', () => {
    const store = useEditorStore.getState();
    store.selectComponent(store.project.pages[0].components[0].id);
    const { container } = render(React.createElement(Inspector));
    const sectionTitles = Array.from(container.querySelectorAll('.inspector-section__title'))
      .map((el) => el.textContent ?? '');
    expect(sectionTitles.some((s) => s.match(/Posisi & Ukuran/))).toBe(true);
    // Geometry fields must still be rendered (scope-lock contract)
    expect(container.querySelector('[data-field="x"]')).not.toBeNull();
    expect(container.querySelector('[data-field="y"]')).not.toBeNull();
    expect(container.querySelector('[data-field="width"]')).not.toBeNull();
    expect(container.querySelector('[data-field="height"]')).not.toBeNull();
  });

  it('card component: shows friendly name "Kartu Info" (not raw ID)', () => {
    useEditorStore.getState().addPage(); // free
    useEditorStore.getState().addCardComponent('Isi card');
    const { container } = render(React.createElement(Inspector));
    const head = container.querySelector('.component-editor__head');
    expect(head?.textContent ?? '').toMatch(/Kartu/);
  });

  it('navigation component: shows friendly name "Tombol" (not raw "Navigation")', () => {
    useEditorStore.getState().addPage(); // free
    useEditorStore.getState().addNavigationComponent('Berikutnya', 'next');
    const { container } = render(React.createElement(Inspector));
    const head = container.querySelector('.component-editor__head');
    expect(head?.textContent ?? '').toMatch(/Tombol/);
  });

  it('does not contain "block" in user-facing text', () => {
    const { container } = render(React.createElement(Inspector));
    expect(container.textContent ?? '').not.toMatch(/\bblock\b/i);
  });

  it('with text selected: still no "block"', () => {
    const store = useEditorStore.getState();
    store.selectComponent(store.project.pages[0].components[0].id);
    const { container } = render(React.createElement(Inspector));
    expect(container.textContent ?? '').not.toMatch(/\bblock\b/i);
  });
});
