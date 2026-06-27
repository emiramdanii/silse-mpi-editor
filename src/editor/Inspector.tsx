import { useEditorStore } from '../store/editor-store';

export function Inspector() {
  const currentPage = useEditorStore((s) => s.project.pages.find((p) => p.id === s.project.currentPageId) ?? null);

  return (
    <aside className="inspector">
      <div className="inspector__head">Inspector</div>
      <div className="inspector__body">
        {!currentPage ? (
          <div className="inspector-placeholder">
            <p>Tidak ada halaman terpilih.</p>
          </div>
        ) : (
          <div className="inspector-placeholder">
            <p>
              <strong>Halaman:</strong> {currentPage.title}
            </p>
            <p>
              <strong>ID:</strong> {currentPage.id}
            </p>
            <p>
              <strong>Jumlah block:</strong> {currentPage.blocks.length}
            </p>
            <p style={{ marginTop: 16, fontStyle: 'italic' }}>
              Inspector editor block (text, image, button) akan aktif mulai M2.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
