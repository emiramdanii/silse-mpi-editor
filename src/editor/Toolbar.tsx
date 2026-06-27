/**
 * Toolbar for component-level actions.
 *
 * M2R scope:
 *   - "+ Teks" ENABLED (calls addTextComponent, default variant by PageRole)
 *   - "+ Gambar", "+ Navigasi", "Export HTML", "Preview" remain DISABLED.
 *
 * Naming: UI uses "elemen"/"komponen", NOT "block".
 *
 * Each button has a UNIQUE data-action attribute so the scope-lock
 * test can identify them individually.
 */

import { useEditorStore } from '../store/editor-store';

export function Toolbar() {
  const addTextComponent = useEditorStore((s) => s.addTextComponent);

  const handleAddText = () => {
    const id = addTextComponent();
    if (id === null) {
      // Capability denied (e.g. cover page). Silent reject for M2.
      // M3 will surface a friendly message.
      return;
    }
  };

  return (
    <div className="toolbar">
      <span className="toolbar__divider" />
      <button
        onClick={handleAddText}
        title="Tambah elemen teks"
        data-action="add-text"
        data-milestone="M2"
      >
        + Teks
      </button>
      <button disabled title="Tambah gambar — aktif di M4" data-action="add-image">
        + Gambar
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
