/**
 * Toolbar for component-level actions.
 *
 * M5 scope:
 *   - "+ Teks" ENABLED jika canAddComponent(role, 'text')
 *   - "+ Gambar" ENABLED jika canAddComponent(role, 'image')
 *   - "+ Kartu" ENABLED jika canAddComponent(role, 'card')
 *   - "+ Navigasi" ENABLED jika canAddComponent(role, 'navigation')
 *   - "Preview" ENABLED (opens preview mode)
 *   - "Export HTML" still DISABLED (M6).
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

export function Toolbar() {
  const addTextComponent = useEditorStore((s) => s.addTextComponent);
  const addImageComponent = useEditorStore((s) => s.addImageComponent);
  const addCardComponent = useEditorStore((s) => s.addCardComponent);
  const addNavigationComponent = useEditorStore((s) => s.addNavigationComponent);
  const saveCurrent = useEditorStore((s) => s.saveCurrent);
  const loadCurrent = useEditorStore((s) => s.loadCurrent);
  const resetProject = useEditorStore((s) => s.resetProject);
  const setProject = useEditorStore((s) => s.setProject);
  const currentPage = useEditorStore(
    (s) => s.project.pages.find((p) => p.id === s.project.currentPageId) ?? null,
  );
  const openPreview = usePreviewStore((s) => s.openPreview);

  const role = currentPage?.role;
  const canText = role ? canAddComponent(role, 'text') : false;
  const canImage = role ? canAddComponent(role, 'image') : false;
  const canCard = role ? canAddComponent(role, 'card') : false;
  const canNavigation = role ? canAddComponent(role, 'navigation') : false;

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

  const handleExport = () => {
    const project = useEditorStore.getState().project;
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
    </div>
  );
}
