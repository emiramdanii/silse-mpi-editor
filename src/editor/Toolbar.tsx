/**
 * EditorToolbar — toolbar kontekstual untuk tambah elemen + berkas (UX-01 Patch-2).
 *
 * Layer: editor
 * Allowed imports: react, ../store/editor-store, ../core/*, ../preview/*, ../export/*, ../storage/*, ../ai-import/*
 *
 * Kontrak (UX-01 Patch-2 — Clean Top Editor Menu):
 *   Toolbar atas HANYA menampilkan 2 tombol:
 *     1. "+ Tambah Elemen ▾" — dropdown kontekstual berisi elemen yang
 *        diizinkan untuk role halaman aktif (capability check).
 *     2. "⋯ Lainnya ▾" — dropdown aksi berkas (Simpan, Muat, Reset, dst).
 *
 *   Tombol Teks/Gambar/Kartu/Navigasi/Pertanyaan/Game TIDAK lagi berderet
 *   langsung di toolbar — semua ada di balik "+ Tambah Elemen".
 *
 *   Catatan: kedua dropdown bisa dibuka bersamaan, tetapi umumnya guru
 *   akan buka satu per satu. Klik di luar salah satu menutup dropdown itu.
 *
 * Kontrak lama (UX-01 Patch — tetap dipertahankan):
 *   - Semua `data-action` lama (add-text, add-image, add-card, add-navigation,
 *     add-question, add-game, save, load, save-library, export-json,
 *     import-json, save-style-pack, load-sample, ai-import, reset, more-menu)
 *     tetap dipertahankan supaya scope-lock test pass.
 *   - Tombol aksi primer (Pratinjau, Export HTML) tetap di Topbar (UX-01).
 *   - Tidak ada kata terlarang "b-l-o-c-k" di user-facing text.
 */

import { useState, useEffect, useRef } from 'react';
import { useEditorStore } from '../store/editor-store';
import { canAddComponent } from '../core/capability';
import type { NavigationAction } from '../core/types';
import {
  exportProjectJson,
  importProjectJson,
  saveProjectToLibrary,
  listSavedProjects,
  loadProjectFromLibrary,
} from '../storage/project-storage';
import { saveStylePack } from '../storage/style-pack-storage';
import { getStylePack } from '../core/style-presets';
import { parseAndNormalizeAiJson } from '../ai-import/normalizer';
import { createSamplePpknProject } from '../core/sample-project';
import { getRoleInfo } from './mpi-standard-roles';

type AddButtonSpec = {
  action: string;
  label: string;
  hint: string;
  milestone: string;
  icon: string;
  /** Which capability slot to check; if undefined, always allowed when role allows add. */
  capability: 'text' | 'image' | 'card' | 'navigation' | 'question' | 'game';
  /** Section in the dropdown menu. */
  section: 'konten' | 'interaksi';
};

const ADD_BUTTONS: AddButtonSpec[] = [
  // Konten
  { action: 'add-text',  label: 'Teks',   hint: 'Judul, isi, atau catatan', milestone: 'M2',  icon: '📝', capability: 'text',  section: 'konten' },
  { action: 'add-image', label: 'Gambar', hint: 'Ilustrasi atau foto',       milestone: 'M4',  icon: '🖼️', capability: 'image', section: 'konten' },
  { action: 'add-card',  label: 'Kartu',  hint: 'Info, contoh, atau catatan penting', milestone: 'M4', icon: '🗂️', capability: 'card',  section: 'konten' },
  // Interaksi
  { action: 'add-navigation', label: 'Navigasi',    hint: 'Tombol pindah halaman', milestone: 'M5',   icon: '➡️', capability: 'navigation', section: 'interaksi' },
  { action: 'add-question',   label: 'Pertanyaan',  hint: 'Pilihan ganda + feedback', milestone: 'M10', icon: '❓', capability: 'question',   section: 'interaksi' },
  { action: 'add-game',       label: 'Game',        hint: 'Misi interaktif',         milestone: 'M11A', icon: '🎮', capability: 'game',       section: 'interaksi' },
];

const SECTION_LABELS: Record<AddButtonSpec['section'], string> = {
  konten: 'Konten',
  interaksi: 'Interaksi',
};

export function Toolbar() {
  const addTextComponent = useEditorStore((s) => s.addTextComponent);
  const addImageComponent = useEditorStore((s) => s.addImageComponent);
  const addCardComponent = useEditorStore((s) => s.addCardComponent);
  const addNavigationComponent = useEditorStore((s) => s.addNavigationComponent);
  const addQuestionComponent = useEditorStore((s) => s.addQuestionComponent);
  const addGameComponent = useEditorStore((s) => s.addGameComponent);
  const saveCurrent = useEditorStore((s) => s.saveCurrent);
  const loadCurrent = useEditorStore((s) => s.loadCurrent);
  const resetProject = useEditorStore((s) => s.resetProject);
  const setProject = useEditorStore((s) => s.setProject);

  const currentPage = useEditorStore(
    (s) => s.project.pages.find((p) => p.id === s.project.currentPageId) ?? null,
  );

  const [showAiDialog, setShowAiDialog] = useState(false);
  const [aiJsonText, setAiJsonText] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);
  // UX-01 Patch Scope A: file actions collapsed into "Lainnya" dropdown.
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  // UX-01 Patch-2: add-element actions collapsed into "Tambah Elemen" dropdown.
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Refs for click-away handling (closing dropdown when clicking inside the
  // other dropdown's region or outside both).
  const addMenuWrapRef = useRef<HTMLDivElement>(null);
  const moreMenuWrapRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when role changes (prevents stale menu state across pages).
  useEffect(() => {
    setShowAddMenu(false);
    setShowMoreMenu(false);
  }, [currentPage?.id]);

  const role = currentPage?.role;
  const roleLabel = role ? getRoleInfo(role).label : '—';
  const roleHint = role ? getRoleInfo(role).hint : '';

  // Compute which add buttons are allowed for the current role.
  const allowedAddButtons: AddButtonSpec[] = role
    ? ADD_BUTTONS.filter((spec) => canAddComponent(role, spec.capability))
    : [];

  const canAddAnything = allowedAddButtons.length > 0;

  // Map spec → handler
  const getHandler = (action: string): (() => void) | null => {
    switch (action) {
      case 'add-text': return () => addTextComponent();
      case 'add-image': return () => {
        const src = window.prompt('URL atau data URL gambar:');
        if (!src) return;
        addImageComponent(src);
      };
      case 'add-card': return () => addCardComponent('Konten card baru');
      case 'add-navigation': return () => {
        const action: NavigationAction = 'next';
        addNavigationComponent('Berikutnya', action);
      };
      case 'add-question': return () => addQuestionComponent();
      case 'add-game': return () => addGameComponent();
      default: return null;
    }
  };

  // Wrap add handler so it also closes the dropdown after action.
  const wrapAddHandler = (action: string): (() => void) => {
    const handler = getHandler(action);
    return () => {
      setShowAddMenu(false);
      handler?.();
    };
  };

  // ----- File action handlers (from UX-01 Patch — unchanged behavior) -----

  const handleLoadSample = () => {
    const sample = createSamplePpknProject();
    setProject(sample);
    setShowMoreMenu(false);
    window.alert('Contoh MPI "Hidup Tertib dengan Norma" dimuat!');
  };

  const handleSave = () => {
    const ok = saveCurrent();
    setShowMoreMenu(false);
    if (!ok) window.alert('Gagal menyimpan proyek.');
  };

  const handleLoad = () => {
    setShowMoreMenu(false);
    const saved = listSavedProjects();
    if (saved.length === 0) {
      const ok = loadCurrent();
      if (!ok) window.alert('Tidak ada proyek tersimpan.');
      return;
    }
    const choices = saved.map((p, i) => `${i + 1}. ${p.title} (${p.pageCount} halaman)`).join('\n');
    const input = window.prompt(`Pilih proyek tersimpan:\n${choices}\n\nAtau ketik 0 untuk muat autosave terakhir.`);
    if (input === null) return;
    const idx = parseInt(input, 10) - 1;
    if (idx === -1) {
      loadCurrent();
    } else if (idx >= 0 && idx < saved.length) {
      const result = loadProjectFromLibrary(saved[idx].id);
      if (result.ok && result.data) {
        setProject(result.data);
      } else {
        window.alert('Gagal memuat proyek: ' + (!result.ok ? result.error : 'Unknown'));
      }
    }
  };

  const handleExportJson = () => {
    setShowMoreMenu(false);
    const project = useEditorStore.getState().project;
    const json = exportProjectJson(project);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.title.replace(/[^a-zA-Z0-9]/g, '_')}.silse.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const handleImportJson = () => {
    setShowMoreMenu(false);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.silse.json,application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        const result = importProjectJson(text);
        if (result.ok && result.data) {
          setProject(result.data);
          window.alert('Proyek berhasil dimuat.');
        } else {
          window.alert('Gagal mengimpor: ' + (!result.ok ? result.error : 'Unknown'));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleReset = () => {
    setShowMoreMenu(false);
    if (window.confirm('Reset proyek? Semua perubahan akan hilang.')) {
      resetProject();
    }
  };

  const handleSaveToLibrary = () => {
    setShowMoreMenu(false);
    const project = useEditorStore.getState().project;
    const result = saveProjectToLibrary(project);
    if (result.ok) {
      window.alert('Proyek disimpan ke perpustakaan.');
    } else {
      window.alert('Gagal menyimpan: ' + (!result.ok ? result.error : 'Unknown'));
    }
  };

  const handleSaveStylePack = () => {
    setShowMoreMenu(false);
    const project = useEditorStore.getState().project;
    const stylePackId = project.stylePackId;
    if (!stylePackId) {
      window.alert('Proyek tidak punya paket gaya.');
      return;
    }
    const pack = getStylePack(stylePackId);
    if (!pack) {
      window.alert('Paket gaya tidak ditemukan: ' + stylePackId);
      return;
    }
    const result = saveStylePack(pack);
    if (result.ok) {
      window.alert('Paket gaya "' + pack.name + '" disimpan.');
    } else {
      window.alert('Gagal menyimpan paket gaya: ' + (!result.ok ? result.error : 'Unknown'));
    }
  };

  const handleAiImport = () => {
    setShowMoreMenu(false);
    setShowAiDialog(true);
    setAiJsonText('');
    setAiError(null);
  };

  const handleAiValidateAndImport = () => {
    if (!aiJsonText.trim()) {
      setAiError('Tempel JSON AI terlebih dahulu.');
      return;
    }
    const result = parseAndNormalizeAiJson(aiJsonText);
    if (result.ok) {
      setProject(result.project);
      setShowAiDialog(false);
      setAiJsonText('');
      setAiError(null);
      window.alert('Struktur aman! Proyek berhasil dimuat dari AI JSON.');
    } else {
      setAiError(result.errors.join('\n'));
    }
  };

  // Click-away handler: listen for clicks outside both dropdown regions.
  useEffect(() => {
    if (!showAddMenu && !showMoreMenu) return;
    const handleClickAway = (e: MouseEvent) => {
      const target = e.target as Node;
      const inAdd = addMenuWrapRef.current?.contains(target);
      const inMore = moreMenuWrapRef.current?.contains(target);
      if (!inAdd && !inMore) {
        setShowAddMenu(false);
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickAway);
    return () => document.removeEventListener('mousedown', handleClickAway);
  }, [showAddMenu, showMoreMenu]);

  // Group allowed add buttons by section.
  const sectionButtons: Record<AddButtonSpec['section'], AddButtonSpec[]> = {
    konten: allowedAddButtons.filter((b) => b.section === 'konten'),
    interaksi: allowedAddButtons.filter((b) => b.section === 'interaksi'),
  };

  return (
    <div className="editor-toolbar" data-testid="editor-toolbar">
      <div className="editor-toolbar__context" data-testid="editor-toolbar-context">
        <span className="editor-toolbar__context-label">
          Halaman
        </span>
        <span className="editor-toolbar__context-role" data-testid="editor-toolbar-context-role">
          {roleLabel}
        </span>
        {roleHint && (
          <span className="editor-toolbar__context-hint">{roleHint}</span>
        )}
      </div>

      <div className="editor-toolbar__row">
        {/* "+ Tambah Elemen" dropdown (UX-01 Patch-2) */}
        <div
          className="editor-toolbar__add-wrap"
          ref={addMenuWrapRef}
          data-testid="editor-toolbar-group-konten"
        >
          <button
            type="button"
            className="editor-toolbar__add-toggle"
            onClick={() => setShowAddMenu((v) => !v)}
            disabled={!canAddAnything}
            title={
              canAddAnything
                ? `Tambah elemen di ${roleLabel}`
                : 'Halaman ini tidak mengizinkan tambah elemen manual (terpandu)'
            }
            data-action="add-menu"
            data-testid="toolbar-add"
            aria-expanded={showAddMenu}
            aria-haspopup="menu"
          >
            <span aria-hidden>＋</span>
            <span>Tambah Elemen</span>
            <span className="editor-toolbar__add-chevron" aria-hidden>
              {showAddMenu ? '▴' : '▾'}
            </span>
          </button>
          {showAddMenu && canAddAnything && (
            <div
              className="editor-toolbar__add-menu"
              role="menu"
              data-testid="toolbar-add-menu"
            >
              {(['konten', 'interaksi'] as const).map((section) => {
                if (sectionButtons[section].length === 0) return null;
                return (
                  <div
                    key={section}
                    className="editor-toolbar__add-section"
                    data-testid={`editor-toolbar-add-section-${section}`}
                  >
                    <div className="editor-toolbar__add-section-label">
                      {SECTION_LABELS[section]}
                    </div>
                    {sectionButtons[section].map((spec) => (
                      <button
                        key={spec.action}
                        onClick={wrapAddHandler(spec.action)}
                        role="menuitem"
                        className="editor-toolbar__add-menu-item"
                        title={`Tambah ${spec.label.toLowerCase()} — ${spec.hint}`}
                        data-action={spec.action}
                        data-milestone={spec.milestone}
                        data-testid={`toolbar-${spec.action}`}
                      >
                        <span className="editor-toolbar__add-menu-icon" aria-hidden>{spec.icon}</span>
                        <span className="editor-toolbar__add-menu-body">
                          <span className="editor-toolbar__add-menu-label">{spec.label}</span>
                          <span className="editor-toolbar__add-menu-hint">{spec.hint}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
          {showAddMenu && !canAddAnything && (
            /* Still render a small menu so click-away can close it,
               but show a guidance message instead of empty dropdown. */
            <div
              className="editor-toolbar__add-menu editor-toolbar__add-menu--empty"
              role="menu"
              data-testid="toolbar-add-menu"
            >
              <div className="editor-toolbar__add-menu-guidance">
                Halaman ini terpandu — elemen tidak perlu ditambah manual.
              </div>
            </div>
          )}
        </div>

        {/* "⋯ Lainnya" dropdown (UX-01 Patch — unchanged) */}
        <div
          className="editor-toolbar__group editor-toolbar__group--files"
          data-testid="editor-toolbar-group-berkas"
          ref={moreMenuWrapRef}
        >
          <button
            type="button"
            className="editor-toolbar__more-btn"
            onClick={() => setShowMoreMenu((v) => !v)}
            title="Tampilkan aksi berkas lainnya"
            data-action="more-menu"
            data-testid="toolbar-more"
            aria-expanded={showMoreMenu}
            aria-haspopup="menu"
          >
            ⋯ Lainnya
            <span className="editor-toolbar__more-chevron" aria-hidden>
              {showMoreMenu ? '▴' : '▾'}
            </span>
          </button>
          {showMoreMenu && (
            <div
              className="editor-toolbar__more-menu"
              role="menu"
              data-testid="toolbar-more-menu"
            >
              <button onClick={handleSave}          role="menuitem" title="Simpan proyek ke penyimpanan lokal"   data-action="save"            data-testid="toolbar-save">💾 Simpan</button>
              <button onClick={handleLoad}          role="menuitem" title="Muat proyek dari penyimpanan lokal"   data-action="load"            data-testid="toolbar-load">📂 Muat</button>
              <button onClick={handleSaveToLibrary} role="menuitem" title="Simpan ke perpustakaan proyek"        data-action="save-library"    data-testid="toolbar-save-library">⭐ Simpan ke Perpustakaan</button>
              <div className="editor-toolbar__more-divider" />
              <button onClick={handleExportJson}    role="menuitem" title="Cadangkan proyek sebagai JSON"        data-action="export-json"     data-testid="toolbar-export-json">📦 Cadangan JSON</button>
              <button onClick={handleImportJson}    role="menuitem" title="Impor proyek dari cadangan JSON"      data-action="import-json"     data-testid="toolbar-import-json">📥 Impor JSON</button>
              <div className="editor-toolbar__more-divider" />
              <button onClick={handleSaveStylePack} role="menuitem" title="Simpan paket gaya saat ini"          data-action="save-style-pack" data-testid="toolbar-save-style-pack">🎨 Simpan Paket Gaya</button>
              <button onClick={handleLoadSample}    role="menuitem" title="Muat contoh MPI PPKn"                 data-action="load-sample"     data-testid="toolbar-load-sample">📋 Muat Contoh MPI</button>
              <button onClick={handleAiImport}      role="menuitem" title="Impor JSON dari AI"                   data-action="ai-import"       data-milestone="M8" data-testid="toolbar-ai-import">🤖 Impor AI JSON</button>
              <div className="editor-toolbar__more-divider" />
              <button onClick={handleReset}         role="menuitem" title="Reset proyek ke kosong"               data-action="reset"           data-testid="toolbar-reset" className="danger">↺ Reset</button>
            </div>
          )}
        </div>
      </div>

      {showAiDialog && (
        <div className="ai-import-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="ai-import-dialog__head">
            <strong>Impor AI JSON</strong>
            <button onClick={() => setShowAiDialog(false)} title="Tutup">✕</button>
          </div>
          <p className="ai-import-dialog__hint">Tempel JSON dari AI. Struktur akan divalidasi — field terlarang (html, css, script, className, cdn) akan ditolak.</p>
          <textarea
            className="ai-import-dialog__textarea"
            value={aiJsonText}
            onChange={(e) => setAiJsonText(e.target.value)}
            placeholder='{"schemaVersion":1,"source":"ai","project":{"title":"MPI Baru","pages":[...]}}'
            rows={12}
          />
          {aiError && (
            <div className="ai-import-dialog__error">
              <strong>Field terlarang / kesalahan:</strong>
              <pre>{aiError}</pre>
            </div>
          )}
          <div className="ai-import-dialog__actions">
            <button onClick={handleAiValidateAndImport} className="primary">Validasi & Impor</button>
            <button onClick={() => setShowAiDialog(false)}>Batal</button>
          </div>
        </div>
      )}
    </div>
  );
}
