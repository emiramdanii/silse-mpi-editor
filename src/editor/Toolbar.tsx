/**
 * Toolbar for component-level + project actions.
 *
 * M2-M6: + Teks/+ Gambar/+ Kartu/+ Navigasi by capability, Preview, Export HTML.
 * M7: Simpan, Muat, Perpustakaan, Cadangan JSON, Impor JSON, Simpan Paket Gaya, Reset.
 * M8: 🤖 Impor AI JSON.
 */

import { useEditorStore } from '../store/editor-store';
import { usePreviewStore } from '../preview/preview-store';
import { canAddComponent } from '../core/capability';
import type { NavigationAction } from '../core/types';
import { exportProjectToHtml } from '../export/export-html';
import { downloadHtmlFile } from '../export/export-download';
import { exportProjectJson, importProjectJson, saveProjectToLibrary, listSavedProjects, loadProjectFromLibrary } from '../storage/project-storage';
import { saveStylePack } from '../storage/style-pack-storage';
import { getStylePack } from '../core/style-presets';
import { parseAndNormalizeAiJson } from '../ai-import/normalizer';
import { createSamplePpknProject } from '../core/sample-project';
import { checkMpiStandard } from '../core/mpi-quality-check';
import { useState } from 'react';

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
  const openPreview = usePreviewStore((s) => s.openPreview);

  const [showAiDialog, setShowAiDialog] = useState(false);
  const [aiJsonText, setAiJsonText] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);

  const role = currentPage?.role;
  const canText = role ? canAddComponent(role, 'text') : false;
  const canImage = role ? canAddComponent(role, 'image') : false;
  const canCard = role ? canAddComponent(role, 'card') : false;
  const canNavigation = role ? canAddComponent(role, 'navigation') : false;
  const canQuestion = role ? canAddComponent(role, 'question') : false;
  const canGame = role ? canAddComponent(role, 'game') : false;

  const handleAddText = () => { addTextComponent(); };
  const handleAddImage = () => {
    const src = window.prompt('URL atau data URL gambar:');
    if (!src) return;
    addImageComponent(src);
  };
  const handleAddCard = () => { addCardComponent('Konten card baru'); };
  const handleAddNavigation = () => {
    const action: NavigationAction = 'next';
    addNavigationComponent('Berikutnya', action);
  };

  const handleAddQuestion = () => {
    addQuestionComponent();
  };

  const handleAddGame = () => {
    addGameComponent();
  };

  const handleLoadSample = () => {
    const sample = createSamplePpknProject();
    setProject(sample);
    window.alert('Contoh MPI "Hidup Tertib dengan Norma" dimuat!');
  };

  const handleExport = () => {
    const project = useEditorStore.getState().project;
    const qc = checkMpiStandard(project);
    if (!qc.pass || qc.warnings.length > 0) {
      const msgs = [
        ...qc.errors.map((e) => '❌ ' + e),
        ...qc.warnings.map((w) => '⚠️ ' + w),
      ];
      const proceed = window.confirm(
        'Cek Standar MPI:\n\n' + msgs.join('\n') +
        '\n\nApakah Anda tetap ingin export?'
      );
      if (!proceed) return;
    }
    const html = exportProjectToHtml(project);
    downloadHtmlFile(project.title, html);
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
    // Simple library picker
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
        window.alert('Gagal memuat proyek: ' + (result.ok ? '' : (result as { error: string }).error));
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

  return (
    <div className="toolbar">
      <span className="toolbar__divider" />
      <button
        onClick={handleAddText}
        disabled={!canText}
        title={canText ? 'Tambah elemen teks' : 'Tidak diizinkan di halaman ini'}
        data-action="add-text"
        data-milestone="M2"
      >
        + Teks
      </button>
      <button
        onClick={handleAddImage}
        disabled={!canImage}
        title={canImage ? 'Tambah gambar' : 'Tidak diizinkan di halaman ini'}
        data-action="add-image"
        data-milestone="M4"
      >
        + Gambar
      </button>
      <button
        onClick={handleAddCard}
        disabled={!canCard}
        title={canCard ? 'Tambah kartu' : 'Tidak diizinkan di halaman ini'}
        data-action="add-card"
        data-milestone="M4"
      >
        + Kartu
      </button>
      <button
        onClick={handleAddNavigation}
        disabled={!canNavigation}
        title={canNavigation ? 'Tambah tombol navigasi' : 'Tidak diizinkan di halaman ini'}
        data-action="add-navigation"
        data-milestone="M5"
      >
        + Navigasi
      </button>
      <button
        onClick={handleAddQuestion}
        disabled={!canQuestion}
        title={canQuestion ? 'Tambah pertanyaan' : 'Tidak diizinkan di halaman ini'}
        data-action="add-question"
        data-milestone="M10"
      >
        + Pertanyaan
      </button>
      <button
        onClick={handleAddGame}
        disabled={!canGame}
        title={canGame ? 'Tambah game' : 'Tidak diizinkan di halaman ini'}
        data-action="add-game"
        data-milestone="M11A"
      >
        + Game
      </button>
      <span className="toolbar__divider" />
      <button
        onClick={openPreview}
        title="Buka pratinjau MPI"
        data-action="preview"
        data-milestone="M5"
      >
        ▶ Pratinjau
      </button>
      <button
        onClick={handleExport}
        title="Export HTML standalone"
        data-action="export-html"
        data-milestone="M6"
      >
        ⬇ Export HTML
      </button>
      <span className="toolbar__divider" />
      <button onClick={handleSave} title="Simpan proyek ke penyimpanan lokal" data-action="save">
        💾 Simpan
      </button>
      <button onClick={handleLoad} title="Muat proyek dari penyimpanan lokal" data-action="load">
        📂 Muat
      </button>
      <button onClick={handleSaveToLibrary} title="Simpan ke perpustakaan proyek" data-action="save-library">
        ⭐ Simpan ke Perpustakaan
      </button>
      <button onClick={handleExportJson} title="Cadangkan proyek sebagai JSON" data-action="export-json">
        📦 Cadangan JSON
      </button>
      <button onClick={handleImportJson} title="Impor proyek dari cadangan JSON" data-action="import-json">
        📥 Impor JSON
      </button>
      <button onClick={handleSaveStylePack} title="Simpan paket gaya saat ini" data-action="save-style-pack">
        🎨 Simpan Paket Gaya
      </button>
      <button onClick={handleReset} title="Reset proyek ke kosong" data-action="reset" className="danger">
        ↺ Reset
      </button>
      <span className="toolbar__divider" />
      <button onClick={handleLoadSample} title="Muat contoh MPI PPKn" data-action="load-sample">
        📋 Muat Contoh MPI
      </button>
      <span className="toolbar__divider" />
      <button onClick={handleAiImport} title="Impor JSON dari AI" data-action="ai-import" data-milestone="M8">
        🤖 Impor AI JSON
      </button>
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
