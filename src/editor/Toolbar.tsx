/**
 * Toolbar for component-level actions.
 *
 * M4 scope:
 *   - "+ Teks" ENABLED jika canAddComponent(role, 'text')
 *   - "+ Gambar" ENABLED jika canAddComponent(role, 'image')
 *   - "+ Kartu" ENABLED jika canAddComponent(role, 'card')
 *   - "+ Navigasi", "Export HTML", "Preview" remain DISABLED (M5/M6).
 *
 * Naming: UI uses "elemen"/"gambar"/"kartu", NOT "block".
 */

import { useEditorStore } from '../store/editor-store';
import { canAddComponent } from '../core/capability';

export function Toolbar() {
  const addTextComponent = useEditorStore((s) => s.addTextComponent);
  const addImageComponent = useEditorStore((s) => s.addImageComponent);
  const addCardComponent = useEditorStore((s) => s.addCardComponent);
  const currentPage = useEditorStore(
    (s) => s.project.pages.find((p) => p.id === s.project.currentPageId) ?? null,
  );

  const role = currentPage?.role;
  const canText = role ? canAddComponent(role, 'text') : false;
  const canImage = role ? canAddComponent(role, 'image') : false;
  const canCard = role ? canAddComponent(role, 'card') : false;

  const handleAddText = () => {
    const id = addTextComponent();
    if (id === null) return; // capability denied, silent
  };

  const handleAddImage = () => {
    // M4: simple prompt for image src (data URL or URL).
    // M9 will add proper upload UI.
    const src = window.prompt('URL atau data URL gambar:');
    if (!src) return;
    const id = addImageComponent(src);
    if (id === null) return;
  };

  const handleAddCard = () => {
    const id = addCardComponent('Konten card baru');
    if (id === null) return;
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
      <button disabled title="Tambah navigasi — aktif di M5" data-action="add-navigation">
        + Navigasi
      </button>
      <span className="toolbar__divider" />
      <button disabled title="Export HTML — aktif di M6" data-action="export-html">
        Export HTML
      </button>
      <button disabled title="Preview MPI — aktif di M5" data-action="preview">
        Preview
      </button>
    </div>
  );
}
