import { useEditorStore } from '../store/editor-store';

/**
 * PagePanel — daftar halaman di sisi kiri editor.
 *
 * SCOPE: M1 — Editor Kosong.
 * Hanya: tampilkan list halaman, tombol tambah, klik untuk pilih.
 * Operasi rename/delete/duplicate ditunda ke M3.
 */
export function PagePanel() {
  const project = useEditorStore((s) => s.project);
  const addPage = useEditorStore((s) => s.addPage);
  const selectPage = useEditorStore((s) => s.selectPage);

  return (
    <aside className="page-panel">
      <div className="page-panel__head">
        <span>Halaman</span>
        <button
          onClick={() => addPage()}
          style={{ padding: '2px 8px', fontSize: 12 }}
          title="Tambah halaman"
        >
          + Tambah
        </button>
      </div>
      <div className="page-panel__list">
        {project.pages.map((page, idx) => {
          const isActive = page.id === project.currentPageId;
          return (
            <div
              key={page.id}
              className={`page-item${isActive ? ' is-active' : ''}`}
              onClick={() => selectPage(page.id)}
            >
              <span className="page-item__num">{idx + 1}</span>
              <span className="page-item__title">{page.title}</span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
