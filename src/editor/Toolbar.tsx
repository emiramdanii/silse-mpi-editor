/**
 * Toolbar for block-level actions.
 *
 * For M0–M1, this is a placeholder. The "Add Text" button will be
 * enabled in M2 when block operations land in the store.
 *
 * Scope-lock note: each button has a UNIQUE title attribute so the
 * scope-lock test can identify them individually. Do not reuse titles.
 */
export function Toolbar() {
  return (
    <div className="toolbar">
      <span className="toolbar__divider" />
      <button disabled title="Tambah teks — aktif di M2" data-action="add-text">
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
