import { useEditorStore } from '../store/editor-store';

export function PagePanel() {
  const project = useEditorStore((s) => s.project);
  const addPage = useEditorStore((s) => s.addPage);
  const selectPage = useEditorStore((s) => s.selectPage);
  const deletePage = useEditorStore((s) => s.deletePage);
  const duplicatePage = useEditorStore((s) => s.duplicatePage);

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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  duplicatePage(page.id);
                }}
                style={{ padding: '2px 6px', fontSize: 11 }}
                title="Duplikat halaman"
              >
                ⧉
              </button>
              {project.pages.length > 1 && (
                <button
                  className="danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePage(page.id);
                  }}
                  style={{ padding: '2px 6px', fontSize: 11 }}
                  title="Hapus halaman"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
