/**
 * Toolbar for block-level actions.
 *
 * M2 scope:
 *   - "+ Teks" ENABLED (calls addTextBlock, variant default = 'body')
 *   - "+ Gambar", "+ Tombol", "Export HTML", "Preview" remain DISABLED.
 *
 * Each button has a UNIQUE data-action attribute so the scope-lock
 * test can identify them individually.
 */

import { useEditorStore } from '../store/editor-store';

export function Toolbar() {
  const addTextBlock = useEditorStore((s) => s.addTextBlock);

  return (
    <div className="toolbar">
      <span className="toolbar__divider" />
      <button
        onClick={() => addTextBlock()}
        title="Tambah teks (variant: body)"
        data-action="add-text"
        data-milestone="M2"
      >
        + Teks
      </button>
      <button disabled title="Tambah gambar — aktif di M4" data-action="add-image">
        + Gambar
      </button>
      <button disabled title="Tambah tombol — aktif di M5" data-action="add-button">
        + Tombol
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
