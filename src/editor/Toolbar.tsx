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

export function Toolbar() {
  const addTextComponent = useEditorStore((s) => s.addTextComponent);
  const addImageComponent = useEditorStore((s) => s.addImageComponent);
  const addCardComponent = useEditorStore((s) => s.addCardComponent);
  const addNavigationComponent = useEditorStore((s) => s.addNavigationComponent);
  const currentPage = useEditorStore(
    (s) => s.project.pages.find((p) => p.id === s.project.currentPageId) ?? null,
  );
  const openPreview = usePreviewStore((s) => s.openPreview);

  const role = currentPage?.role;
  const canText = role ? canAddComponent(role, 'text') : false;
  const canImage = role ? canAddComponent(role, 'image') : false;
  const canCard = role ? canAddComponent(role, 'card') : false;
  const canNavigation = role ? canAddComponent(role, 'navigation') : false;

  const handleAddText = () => {
    addTextComponent();
  };

  const handleAddImage = () => {
    const src = window.prompt('URL atau data URL gambar:');
    if (!src) return;
    addImageComponent(src);
  };

  const handleAddCard = () => {
    addCardComponent('Konten card baru');
  };

  const handleAddNavigation = () => {
    const action: NavigationAction = 'next';
    addNavigationComponent('Berikutnya', action);
  };

  const handleExport = () => {
    const project = useEditorStore.getState().project;
    const html = exportProjectToHtml(project);
    downloadHtmlFile(project.title, html);
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
    </div>
  );
}
