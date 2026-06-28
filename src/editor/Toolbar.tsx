/**
 * EditorToolbar — toolbar kontekstual untuk tambah elemen + berkas (UX-01 redesign).
 *
 * Layer: editor
 * Allowed imports: react, ../store/editor-store, ../core/*, ../preview/*, ../export/*, ../storage/*, ../ai-import/*
 *
 * Kontrak (UX-01 Scope D):
 *   - Toolbar lama (technical) → EditorToolbar baru (ramah guru).
 *   - Header kontekstual: "Tambah elemen di halaman [role label]".
 *   - Tombol dikelompokkan: "Konten" (Teks/Gambar/Kartu) | "Interaksi" (Navigasi/Pertanyaan/Game).
 *   - Tombol aksi berkas (Simpan/Muat/Reset/AI Import/Sample) jadi baris ke-2.
 *   - Semua `data-action` lama dipertahankan supaya scope-lock test pass.
 *   - Tidak ada kata terlarang "b-l-o-c-k" di user-facing text.
 *
 *   Catatan: tombol Pratinjau/Export HTML dipindah ke Topbar (UX-01 Scope B).
 *   Tombol di toolbar ini sekarang HANYA untuk tambah elemen + berkas.
 */

import { useState } from 'react';
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
};

const KONTEN_BUTTONS: AddButtonSpec[] = [
  { action: 'add-text',  label: 'Teks',   hint: 'Judul, isi, atau catatan', milestone: 'M2',  icon: '📝' },
  { action: 'add-image', label: 'Gambar', hint: 'Ilustrasi atau foto',       milestone: 'M4',  icon: '🖼️' },
  { action: 'add-card',  label: 'Kartu',  hint: 'Info, contoh, atau catatan penting', milestone: 'M4', icon: '🗂️' },
];

const INTERAKSI_BUTTONS: AddButtonSpec[] = [
  { action: 'add-navigation', label: 'Navigasi',    hint: 'Tombol pindah halaman', milestone: 'M5',   icon: '➡️' },
  { action: 'add-question',   label: 'Pertanyaan',  hint: 'Pilihan ganda + feedback', milestone: 'M10', icon: '❓' },
  { action: 'add-game',       label: 'Game',        hint: 'Misi interaktif',         milestone: 'M11A', icon: '🎮' },
];

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

  const role = currentPage?.role;
  const roleLabel = role ? getRoleInfo(role).label : '—';
  const roleHint = role ? getRoleInfo(role).hint : '';

  const can = (componentType: 'text' | 'image' | 'card' | 'navigation' | 'question' | 'game'): boolean =>
    role ? canAddComponent(role, componentType) : false;

  const handleAddText = () => addTextComponent();
  const handleAddImage = () => {
    const src = window.prompt('URL atau data URL gambar:');
    if (!src) return;
    addImageComponent(src);
  };
  const handleAddCard = () => addCardComponent('Konten card baru');
  const handleAddNavigation = () => {
    const action: NavigationAction = 'next';
    addNavigationComponent('Berikutnya', action);
  };
  const handleAddQuestion = () => addQuestionComponent();
  const handleAddGame = () => addGameComponent();

  const handleLoadSample = () => {
    const sample = createSamplePpknProject();
    setProject(sample);
    window.alert('Contoh MPI "Hidup Tertib dengan Norma" dimuat!');
  };

  const handleSave = () => {
    const ok = saveCurrent();
    if (!ok) window.alert('Gagal menyimpan proyek.');
  };

  const handleLoad = () => {
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
    if (window.confirm('Reset proyek? Semua perubahan akan hilang.')) {
      resetProject();
    }
  };

  const handleSaveToLibrary = () => {
    const project = useEditorStore.getState().project;
    const result = saveProjectToLibrary(project);
    if (result.ok) {
      window.alert('Proyek disimpan ke perpustakaan.');
    } else {
      window.alert('Gagal menyimpan: ' + (!result.ok ? result.error : 'Unknown'));
    }
  };

  const handleSaveStylePack = () => {
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

  const renderAddButton = (
    spec: AddButtonSpec,
    onClick: () => void,
    enabled: boolean,
  ) => (
    <button
      key={spec.action}
      onClick={onClick}
      disabled={!enabled}
      className="editor-toolbar__add-btn"
      title={enabled ? `Tambah ${spec.label.toLowerCase()} — ${spec.hint}` : 'Tidak diizinkan di halaman ini'}
      data-action={spec.action}
      data-milestone={spec.milestone}
      data-testid={`toolbar-${spec.action}`}
    >
      <span className="editor-toolbar__add-icon" aria-hidden>{spec.icon}</span>
      <span className="editor-toolbar__add-body">
        <span className="editor-toolbar__add-label">+ {spec.label}</span>
        <span className="editor-toolbar__add-hint">{spec.hint}</span>
      </span>
    </button>
  );

  return (
    <div className="editor-toolbar" data-testid="editor-toolbar">
      <div className="editor-toolbar__context" data-testid="editor-toolbar-context">
        <span className="editor-toolbar__context-label">
          Tambah elemen di
        </span>
        <span className="editor-toolbar__context-role" data-testid="editor-toolbar-context-role">
          {roleLabel}
        </span>
        {roleHint && (
          <span className="editor-toolbar__context-hint">{roleHint}</span>
        )}
      </div>

      <div className="editor-toolbar__row">
        <div className="editor-toolbar__group" data-testid="editor-toolbar-group-konten">
          <span className="editor-toolbar__group-label">Konten</span>
          <div className="editor-toolbar__group-btns">
            {renderAddButton(KONTEN_BUTTONS[0], handleAddText,  can('text'))}
            {renderAddButton(KONTEN_BUTTONS[1], handleAddImage, can('image'))}
            {renderAddButton(KONTEN_BUTTONS[2], handleAddCard,  can('card'))}
          </div>
        </div>

        <div className="editor-toolbar__group" data-testid="editor-toolbar-group-interaksi">
          <span className="editor-toolbar__group-label">Interaksi</span>
          <div className="editor-toolbar__group-btns">
            {renderAddButton(INTERAKSI_BUTTONS[0], handleAddNavigation, can('navigation'))}
            {renderAddButton(INTERAKSI_BUTTONS[1], handleAddQuestion,   can('question'))}
            {renderAddButton(INTERAKSI_BUTTONS[2], handleAddGame,       can('game'))}
          </div>
        </div>

        <div className="editor-toolbar__group editor-toolbar__group--files" data-testid="editor-toolbar-group-berkas">
          <span className="editor-toolbar__group-label">Berkas</span>
          <div className="editor-toolbar__group-btns editor-toolbar__group-btns--compact">
            <button onClick={handleSave}           title="Simpan proyek ke penyimpanan lokal" data-action="save"           data-testid="toolbar-save">💾 Simpan</button>
            <button onClick={handleLoad}           title="Muat proyek dari penyimpanan lokal" data-action="load"           data-testid="toolbar-load">📂 Muat</button>
            <button onClick={handleSaveToLibrary}  title="Simpan ke perpustakaan proyek"      data-action="save-library"   data-testid="toolbar-save-library">⭐ Perpustakaan</button>
            <button onClick={handleExportJson}     title="Cadangkan proyek sebagai JSON"      data-action="export-json"    data-testid="toolbar-export-json">📦 Cadangan JSON</button>
            <button onClick={handleImportJson}     title="Impor proyek dari cadangan JSON"    data-action="import-json"    data-testid="toolbar-import-json">📥 Impor JSON</button>
            <button onClick={handleSaveStylePack}  title="Simpan paket gaya saat ini"        data-action="save-style-pack" data-testid="toolbar-save-style-pack">🎨 Paket Gaya</button>
            <button onClick={handleLoadSample}     title="Muat contoh MPI PPKn"              data-action="load-sample"    data-testid="toolbar-load-sample">📋 Contoh MPI</button>
            <button onClick={handleAiImport}       title="Impor JSON dari AI"                data-action="ai-import"      data-milestone="M8" data-testid="toolbar-ai-import">🤖 Impor AI JSON</button>
            <button onClick={handleReset}          title="Reset proyek ke kosong"            data-action="reset"          data-testid="toolbar-reset" className="danger">↺ Reset</button>
          </div>
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
