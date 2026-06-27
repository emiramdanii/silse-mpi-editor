/**
 * Toolbar for block-level actions.
 *
 * For M0–M1, this is a placeholder. The "Add Text" button will be
 * enabled in M2 when block operations land in the store.
 */
export function Toolbar() {
  return (
    <div className="toolbar">
      <span className="toolbar__divider" />
      <button disabled title="Aktif di M2">
        + Teks
      </button>
      <button disabled title="Aktif di M4">
        + Gambar
      </button>
      <button disabled title="Aktif di M5">
        + Tombol
      </button>
      <span className="toolbar__divider" />
      <button disabled title="Aktif di M6">
        Export HTML
      </button>
      <button disabled title="Aktif di M5">
        Preview
      </button>
    </div>
  );
}
