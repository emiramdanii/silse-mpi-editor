import { useState } from 'react';
import { useEditorStore } from '../store/editor-store';
import type { PageRole } from '../core/types';

/**
 * PagePanel — daftar halaman di sisi kiri editor.
 *
 * SCOPE: M3 — Page Flow + LayoutId Dasar.
 * Tampilkan list halaman + role + layoutId label.
 * Operasi: tambah, klik pilih, rename (inline), duplicate, delete.
 *
 * Bahasa UI: "halaman", "elemen", "komponen" — bukan "block".
 */
const ROLE_LABELS_SHORT: Record<PageRole, string> = {
  cover: 'Cover',
  learningObjectives: 'Tujuan',
  starter: 'Pemantik',
  material: 'Materi',
  activity: 'Aktivitas',
  quiz: 'Kuis',
  reflection: 'Refleksi',
  closing: 'Penutup',
  free: 'Bebas',
};

const LAYOUT_LABELS: Record<string, string> = {
  blank: 'Bebas',
  coverCentered: 'Cover center',
  singleColumn: 'Satu kolom',
};

export function PagePanel() {
  const project = useEditorStore((s) => s.project);
  const addPage = useEditorStore((s) => s.addPage);
  const selectPage = useEditorStore((s) => s.selectPage);
  const renamePage = useEditorStore((s) => s.renamePage);
  const deletePage = useEditorStore((s) => s.deletePage);
  const duplicatePage = useEditorStore((s) => s.duplicatePage);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const startRename = (pageId: string, currentTitle: string) => {
    setEditingId(pageId);
    setEditingValue(currentTitle);
  };

  const commitRename = () => {
    if (editingId && editingValue.trim()) {
      renamePage(editingId, editingValue.trim());
    }
    setEditingId(null);
    setEditingValue('');
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditingValue('');
  };

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
          const isEditing = editingId === page.id;
          const canDelete = project.pages.length > 1;

          return (
            <div
              key={page.id}
              className={`page-item${isActive ? ' is-active' : ''}`}
              onClick={() => selectPage(page.id)}
            >
              <span className="page-item__num">{idx + 1}</span>
              <div className="page-item__main">
                {isEditing ? (
                  <input
                    type="text"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') cancelRename();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '2px 4px',
                      fontSize: 13,
                      border: '1px solid var(--color-accent)',
                      borderRadius: 3,
                    }}
                  />
                ) : (
                  <span
                    className="page-item__title"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      startRename(page.id, page.title);
                    }}
                    title="Klik dua kali untuk ganti nama"
                  >
                    {page.title}
                  </span>
                )}
                <span className="page-item__meta">
                  {ROLE_LABELS_SHORT[page.role]} · {LAYOUT_LABELS[page.layoutId] ?? page.layoutId}
                </span>
              </div>
              <div className="page-item__actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startRename(page.id, page.title);
                  }}
                  style={{ padding: '2px 6px', fontSize: 11 }}
                  title="Ganti nama halaman"
                >
                  ✎
                </button>
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
                {canDelete && (
                  <button
                    className="danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Hapus halaman "${page.title}"?`)) {
                        deletePage(page.id);
                      }
                    }}
                    style={{ padding: '2px 6px', fontSize: 11 }}
                    title="Hapus halaman"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="page-panel__footer">
        <p>Klik dua kali judul untuk ganti nama.</p>
      </div>
    </aside>
  );
}
