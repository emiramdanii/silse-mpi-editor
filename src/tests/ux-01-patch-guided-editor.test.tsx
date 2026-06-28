/**
 * UX-01 Patch — Guided Editor Polish tests.
 *
 * Layer: tests
 *
 * Kontrak (UX-01 Patch — 10 acceptance criteria dari senior reviewer):
 *   1. Toolbar hanya menampilkan Konten, Interaksi, dan tombol Lainnya.
 *   2. Aksi JSON/Reset/AI Import tidak tampil langsung sebelum Lainnya dibuka.
 *   3. Panel Isi tidak menampilkan raw "text/card/navigation" pada page info.
 *   4. Panel Isi tidak menampilkan kata "capability".
 *   5. Question component menampilkan editor pertanyaan.
 *   6. Game component menampilkan editor misi.
 *   7. Preview/export tetap di Topbar.
 *   8. typecheck PASS.
 *   9. test PASS.
 *  10. build PASS.
 *
 *   (8/9/10 diverifikasi via npm scripts — test ini fokus 1-7.)
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import { Topbar } from '../editor/Topbar';
import { Toolbar } from '../editor/Toolbar';
import { Inspector } from '../editor/Inspector';
import { useEditorStore } from '../store/editor-store';

// =========================================================================
// Scope A — Toolbar hanya Konten, Interaksi, dan Lainnya
// =========================================================================

describe('UX-01 Patch — Scope A: Toolbar Lainnya menu', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('Toolbar renders only Konten + Interaksi + Lainnya groups (no Berkas group label)', () => {
    const { container } = render(React.createElement(Toolbar));
    // Konten and Interaksi group labels still present
    expect(container.querySelector('[data-testid="editor-toolbar-group-konten"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="editor-toolbar-group-interaksi"]')).not.toBeNull();
    // Berkas group wrapper is now just a "Lainnya" button (no group-label "Berkas")
    expect(container.querySelector('[data-testid="editor-toolbar-group-berkas"]')).not.toBeNull();
    // There must NOT be a group-label saying "Berkas" anymore
    const groupLabels = Array.from(container.querySelectorAll('.editor-toolbar__group-label'))
      .map((el) => el.textContent ?? '');
    expect(groupLabels).not.toContain('Berkas');
  });

  it('Lainnya button is rendered with text "⋯ Lainnya"', () => {
    const { container } = render(React.createElement(Toolbar));
    const moreBtn = container.querySelector('[data-testid="toolbar-more"]');
    expect(moreBtn).not.toBeNull();
    expect(moreBtn?.textContent ?? '').toMatch(/Lainnya/);
  });

  it('Lainnya menu is hidden by default', () => {
    const { container } = render(React.createElement(Toolbar));
    expect(container.querySelector('[data-testid="toolbar-more-menu"]')).toBeNull();
  });

  it('clicking Lainnya opens the dropdown menu', () => {
    const { container } = render(React.createElement(Toolbar));
    const moreBtn = container.querySelector('[data-testid="toolbar-more"]') as HTMLButtonElement;
    fireEvent.click(moreBtn);
    const menu = container.querySelector('[data-testid="toolbar-more-menu"]');
    expect(menu).not.toBeNull();
  });

  it('before Lainnya opens: Save/Load/Reset/AI Import buttons are NOT rendered', () => {
    const { container } = render(React.createElement(Toolbar));
    // These buttons should not exist in the DOM until Lainnya is clicked
    expect(container.querySelector('[data-action="save"]')).toBeNull();
    expect(container.querySelector('[data-action="load"]')).toBeNull();
    expect(container.querySelector('[data-action="reset"]')).toBeNull();
    expect(container.querySelector('[data-action="ai-import"]')).toBeNull();
    expect(container.querySelector('[data-action="export-json"]')).toBeNull();
    expect(container.querySelector('[data-action="import-json"]')).toBeNull();
    expect(container.querySelector('[data-action="load-sample"]')).toBeNull();
  });

  it('after Lainnya opens: all 9 file actions are rendered (with correct data-action)', () => {
    const { container } = render(React.createElement(Toolbar));
    const moreBtn = container.querySelector('[data-testid="toolbar-more"]') as HTMLButtonElement;
    fireEvent.click(moreBtn);
    const expected = [
      'save', 'load', 'save-library',
      'export-json', 'import-json',
      'save-style-pack', 'load-sample', 'ai-import',
      'reset',
    ];
    for (const action of expected) {
      const btn = container.querySelector(`[data-action="${action}"]`);
      expect(btn, `expected data-action="${action}" to be in menu`).not.toBeNull();
    }
  });

  it('clicking Lainnya toggles aria-expanded true/false', () => {
    const { container } = render(React.createElement(Toolbar));
    const moreBtn = container.querySelector('[data-testid="toolbar-more"]') as HTMLButtonElement;
    expect(moreBtn.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(moreBtn);
    expect(moreBtn.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(moreBtn);
    expect(moreBtn.getAttribute('aria-expanded')).toBe('false');
  });

  it('click-away overlay closes the menu', () => {
    const { container } = render(React.createElement(Toolbar));
    const moreBtn = container.querySelector('[data-testid="toolbar-more"]') as HTMLButtonElement;
    fireEvent.click(moreBtn);
    const clickaway = container.querySelector('[data-testid="toolbar-more-clickaway"]');
    expect(clickaway).not.toBeNull();
    fireEvent.click(clickaway!);
    expect(container.querySelector('[data-testid="toolbar-more-menu"]')).toBeNull();
  });
});

// =========================================================================
// Scope B — Panel Isi tidak menampilkan istilah teknis
// =========================================================================

describe('UX-01 Patch — Scope B: Panel Isi friendly labels', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('PageInfo shows "Pola tampilan" (not "Layout")', () => {
    const { container } = render(React.createElement(Inspector));
    const text = container.textContent ?? '';
    expect(text).toMatch(/Pola tampilan/);
    expect(text).not.toMatch(/\bLayout\b/);
  });

  it('PageInfo does NOT show raw "text", "card", "navigation" component types', () => {
    // Use a free page (capability unlocked) so status text actually shows the
    // "Yang bisa ditambahkan" list with friendly names.
    useEditorStore.getState().addPage(); // free
    // Deselect any component so PageInfo renders.
    useEditorStore.getState().selectComponent(null);
    const { container } = render(React.createElement(Inspector));
    const status = container.querySelector('[data-testid="inspector-page-status"]');
    expect(status).not.toBeNull();
    const statusText = status?.textContent ?? '';
    // Should show friendly names (Teks, Kartu, Tombol navigasi, ...)
    expect(statusText).toMatch(/Teks/);
    // Should NOT show raw types as comma-separated raw list
    expect(statusText).not.toMatch(/\btext\b/);
    expect(statusText).not.toMatch(/\bcard\b/);
    expect(statusText).not.toMatch(/\bnavigation\b/);
    expect(statusText).not.toMatch(/\bimage\b/);
    expect(statusText).not.toMatch(/\bquestion\b/);
    expect(statusText).not.toMatch(/\bgame\b/);
  });

  it('PageInfo does NOT contain the word "capability"', () => {
    const { container } = render(React.createElement(Inspector));
    const text = (container.textContent ?? '').toLowerCase();
    expect(text).not.toMatch(/capability/);
  });

  it('cover page: status shows "Halaman terpandu" (cover is locked)', () => {
    const { container } = render(React.createElement(Inspector));
    const status = container.querySelector('[data-testid="inspector-page-status"]');
    expect(status?.textContent ?? '').toMatch(/Halaman terpandu/);
  });

  it('free page: status shows "Yang bisa ditambahkan" with friendly labels', () => {
    useEditorStore.getState().addPage(); // free page
    const { container } = render(React.createElement(Inspector));
    const status = container.querySelector('[data-testid="inspector-page-status"]');
    expect(status?.textContent ?? '').toMatch(/Yang bisa ditambahkan/);
    // Friendly component names present (at least Teks, Gambar, Kartu, Tombol navigasi, Pertanyaan, Game misi)
    expect(status?.textContent ?? '').toMatch(/Teks/);
    expect(status?.textContent ?? '').toMatch(/Tombol navigasi/);
    expect(status?.textContent ?? '').toMatch(/Game misi/);
  });

  it('PageInfo Ringkasan shows friendly summary "1 Teks" (not "1 text")', () => {
    // Add a free page, add a text component to it, then DESELECT so PageInfo renders.
    useEditorStore.getState().addPage(); // free
    useEditorStore.getState().addTextComponent();
    useEditorStore.getState().selectComponent(null);
    const { container } = render(React.createElement(Inspector));
    const info = container.querySelector('[data-testid="inspector-page-info"]');
    expect(info).not.toBeNull();
    expect(info?.textContent ?? '').toMatch(/Teks/);
    // Should not show raw "text" with digit prefix like "1 text"
    expect(info?.textContent ?? '').not.toMatch(/\d+\s+text/);
  });
});

// =========================================================================
// Scope C — Question & Game editors
// =========================================================================

describe('UX-01 Patch — Scope C: Question editor', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('question component selected: editor is rendered (not "belum tersedia")', () => {
    useEditorStore.getState().addPage({ role: 'quiz' });
    useEditorStore.getState().addQuestionComponent();
    const { container } = render(React.createElement(Inspector));
    const editor = container.querySelector('[data-testid="component-editor-question"]');
    expect(editor).not.toBeNull();
    expect(container.textContent ?? '').not.toMatch(/belum tersedia/);
  });

  it('question editor has fields: Judul kuis, Pertanyaan, Feedback benar, Feedback salah, Skor', () => {
    useEditorStore.getState().addPage({ role: 'quiz' });
    useEditorStore.getState().addQuestionComponent();
    const { container } = render(React.createElement(Inspector));
    const text = container.textContent ?? '';
    expect(text).toMatch(/Judul kuis/);
    expect(text).toMatch(/Pertanyaan/);
    expect(text).toMatch(/Feedback jika benar/);
    expect(text).toMatch(/Feedback jika salah/);
    expect(text).toMatch(/Skor/);
  });

  it('question editor: choices list is rendered with radio buttons for "jawaban benar"', () => {
    useEditorStore.getState().addPage({ role: 'quiz' });
    useEditorStore.getState().addQuestionComponent();
    const { container } = render(React.createElement(Inspector));
    const choices = container.querySelector('[data-testid="question-choices"]');
    expect(choices).not.toBeNull();
    const radios = choices?.querySelectorAll('input[type="radio"]');
    // Default createQuestionComponent makes 2 choices
    expect(radios?.length).toBeGreaterThanOrEqual(2);
  });

  it('question editor: "Tambah pilihan" button adds a new choice', () => {
    useEditorStore.getState().addPage({ role: 'quiz' });
    useEditorStore.getState().addQuestionComponent();
    const beforeCount = (() => {
      const state = useEditorStore.getState();
      const page = state.project.pages.find((p) => p.id === state.project.currentPageId)!;
      const q = page.components.find((c) => c.type === 'question') as { choices: unknown[] };
      return q.choices.length;
    })();
    const { container } = render(React.createElement(Inspector));
    const addBtn = container.querySelector('[data-action="add-choice"]') as HTMLButtonElement;
    expect(addBtn).not.toBeNull();
    fireEvent.click(addBtn);
    const afterCount = (() => {
      const state = useEditorStore.getState();
      const page = state.project.pages.find((p) => p.id === state.project.currentPageId)!;
      const q = page.components.find((c) => c.type === 'question') as { choices: unknown[] };
      return q.choices.length;
    })();
    expect(afterCount).toBe(beforeCount + 1);
  });

  it('question editor: changing prompt text updates store', () => {
    useEditorStore.getState().addPage({ role: 'quiz' });
    useEditorStore.getState().addQuestionComponent();
    const { container } = render(React.createElement(Inspector));
    const promptField = container.querySelector('[data-field="prompt"]') as HTMLTextAreaElement;
    expect(promptField).not.toBeNull();
    fireEvent.change(promptField, { target: { value: 'Apa itu norma?' } });
    const state = useEditorStore.getState();
    const page = state.project.pages.find((p) => p.id === state.project.currentPageId)!;
    const q = page.components.find((c) => c.type === 'question') as { prompt: string };
    expect(q.prompt).toBe('Apa itu norma?');
  });

  it('question editor: geometry fields (x/y/width/height) are present', () => {
    useEditorStore.getState().addPage({ role: 'quiz' });
    useEditorStore.getState().addQuestionComponent();
    const { container } = render(React.createElement(Inspector));
    expect(container.querySelector('[data-field="x"]')).not.toBeNull();
    expect(container.querySelector('[data-field="y"]')).not.toBeNull();
    expect(container.querySelector('[data-field="width"]')).not.toBeNull();
    expect(container.querySelector('[data-field="height"]')).not.toBeNull();
  });
});

describe('UX-01 Patch — Scope C: Game editor', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('game component selected: editor is rendered (not "belum tersedia")', () => {
    useEditorStore.getState().addPage({ role: 'activity' });
    useEditorStore.getState().addGameComponent();
    const { container } = render(React.createElement(Inspector));
    const editor = container.querySelector('[data-testid="component-editor-game"]');
    expect(editor).not.toBeNull();
    expect(container.textContent ?? '').not.toMatch(/belum tersedia/);
  });

  it('game editor has fields: Judul game, Instruksi, Misi section', () => {
    useEditorStore.getState().addPage({ role: 'activity' });
    useEditorStore.getState().addGameComponent();
    const { container } = render(React.createElement(Inspector));
    const text = container.textContent ?? '';
    expect(text).toMatch(/Judul game/);
    expect(text).toMatch(/Instruksi/);
    expect(text).toMatch(/Misi/);
  });

  it('game editor: missions list is rendered with at least 1 mission', () => {
    useEditorStore.getState().addPage({ role: 'activity' });
    useEditorStore.getState().addGameComponent();
    const { container } = render(React.createElement(Inspector));
    const missions = container.querySelector('[data-testid="game-missions"]');
    expect(missions).not.toBeNull();
    const missionItems = missions?.querySelectorAll('[data-testid^="game-mission-"]');
    // Default createGameComponent makes 2 missions
    expect(missionItems?.length).toBeGreaterThanOrEqual(1);
  });

  it('game editor: "Tambah misi" button adds a new mission', () => {
    useEditorStore.getState().addPage({ role: 'activity' });
    useEditorStore.getState().addGameComponent();
    const beforeCount = (() => {
      const state = useEditorStore.getState();
      const page = state.project.pages.find((p) => p.id === state.project.currentPageId)!;
      const g = page.components.find((c) => c.type === 'game') as { missions: unknown[] };
      return g.missions.length;
    })();
    const { container } = render(React.createElement(Inspector));
    const addBtn = container.querySelector('[data-action="add-mission"]') as HTMLButtonElement;
    expect(addBtn).not.toBeNull();
    fireEvent.click(addBtn);
    const afterCount = (() => {
      const state = useEditorStore.getState();
      const page = state.project.pages.find((p) => p.id === state.project.currentPageId)!;
      const g = page.components.find((c) => c.type === 'game') as { missions: unknown[] };
      return g.missions.length;
    })();
    expect(afterCount).toBe(beforeCount + 1);
  });

  it('game editor: each mission has prompt, choices, feedback benar/salah, skor', () => {
    useEditorStore.getState().addPage({ role: 'activity' });
    useEditorStore.getState().addGameComponent();
    const { container } = render(React.createElement(Inspector));
    const text = container.textContent ?? '';
    expect(text).toMatch(/Pertanyaan misi/);
    expect(text).toMatch(/Pilihan jawaban/);
    expect(text).toMatch(/Feedback jika benar/);
    expect(text).toMatch(/Feedback jika salah/);
    expect(text).toMatch(/Skor misi/);
  });

  it('game editor: changing game title updates store', () => {
    useEditorStore.getState().addPage({ role: 'activity' });
    useEditorStore.getState().addGameComponent();
    const { container } = render(React.createElement(Inspector));
    const titleField = container.querySelector('[data-field="title"]') as HTMLInputElement;
    expect(titleField).not.toBeNull();
    fireEvent.change(titleField, { target: { value: 'Petualangan Baru' } });
    const state = useEditorStore.getState();
    const page = state.project.pages.find((p) => p.id === state.project.currentPageId)!;
    const g = page.components.find((c) => c.type === 'game') as { title: string };
    expect(g.title).toBe('Petualangan Baru');
  });

  it('game editor: geometry fields (x/y/width/height) are present', () => {
    useEditorStore.getState().addPage({ role: 'activity' });
    useEditorStore.getState().addGameComponent();
    const { container } = render(React.createElement(Inspector));
    expect(container.querySelector('[data-field="x"]')).not.toBeNull();
    expect(container.querySelector('[data-field="y"]')).not.toBeNull();
    expect(container.querySelector('[data-field="width"]')).not.toBeNull();
    expect(container.querySelector('[data-field="height"]')).not.toBeNull();
  });
});

// =========================================================================
// Scope D — Preview/export tetap di Topbar (regression check)
// =========================================================================

describe('UX-01 Patch — Scope D: Preview/Export still in Topbar', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('Topbar still has Preview button', () => {
    const { container } = render(React.createElement(Topbar));
    expect(container.querySelector('[data-action="preview"]')).not.toBeNull();
  });

  it('Topbar still has Export HTML button', () => {
    const { container } = render(React.createElement(Topbar));
    expect(container.querySelector('[data-action="export-html"]')).not.toBeNull();
  });

  it('Toolbar does NOT have Preview or Export HTML (moved to Topbar)', () => {
    const { container } = render(React.createElement(Toolbar));
    expect(container.querySelector('[data-action="preview"]')).toBeNull();
    expect(container.querySelector('[data-action="export-html"]')).toBeNull();
  });
});
