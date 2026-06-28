/**
 * PagePanel — daftar halaman sebagai alur pembelajaran (UX-01 redesign).
 *
 * Layer: editor
 * Allowed imports: react, ../store/editor-store, ../core/types, ./mpi-standard-roles
 *
 * Kontrak (UX-01 Scope C):
 *   - Bukan "list halaman teknis" — tapi "alur pembelajaran" yang guru baca.
 *   - Setiap halaman: nomor langkah + ikon role + judul + label role ramah guru.
 *   - Section grouping: Pembukaan / Inti / Penutup (kalau ada halaman
 *     dengan role standar pada section itu).
 *   - Halaman 'free' ditandai jelas sebagai "Halaman Bebas".
 *   - "+ Tambah Halaman" tetap di footer (kontrak M3).
 *   - Tombol rename/duplikat/hapus tetap ada (kontrak M3, title attribute
 *     harus tetap 'Ganti nama halaman' / 'Duplikat halaman' / 'Hapus halaman'
 *     supaya scope-lock test pass).
 */

import { useState } from 'react';
import { useEditorStore } from '../store/editor-store';
import type { SimplePage } from '../core/types';
import { MPI_PHASE_LABELS, getRoleInfo } from './mpi-standard-roles';

const LAYOUT_LABELS: Record<string, string> = {
  blank: 'Bebas',
  coverCentered: 'Cover terpusat',
  singleColumn: 'Satu kolom',
};

type Section = {
  phase: keyof typeof MPI_PHASE_LABELS;
  pages: SimplePage[];
};

function buildSections(pages: SimplePage[]): Section[] {
  const out: Record<Section['phase'], Section> = {
    pembukaan: { phase: 'pembukaan', pages: [] },
    inti: { phase: 'inti', pages: [] },
    penutup: { phase: 'penutup', pages: [] },
  };
  pages.forEach((page) => {
    const info = getRoleInfo(page.role);
    out[info.phase].pages.push(page);
  });
  // Hide empty sections
  return (['pembukaan', 'inti', 'penutup'] as const)
    .map((phase) => out[phase])
    .filter((s) => s.pages.length > 0);
}

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

  const sections = buildSections(project.pages);
  const canDeleteAny = project.pages.length > 1;

  const renderPageItem = (
    page: SimplePage,
    stepNumber: number,
  ) => {
    const isActive = page.id === project.currentPageId;
    const isEditing = editingId === page.id;
    const canDelete = canDeleteAny;
    const info = getRoleInfo(page.role);
    const isStandard = page.role !== 'free';

    return (
      <div
        key={page.id}
        className={`page-item${isActive ? ' is-active' : ''}${isStandard ? '' : ' is-free'}`}
        onClick={() => selectPage(page.id)}
        data-testid={`page-item-${page.id}`}
        data-role={page.role}
      >
        <span className="page-item__step" aria-hidden>{stepNumber}</span>
        <span className="page-item__icon" aria-hidden title={info.label}>{info.icon}</span>
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
              className="page-item__rename-input"
              data-testid={`page-rename-input-${page.id}`}
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
            {info.label} · {LAYOUT_LABELS[page.layoutId] ?? page.layoutId}
          </span>
        </div>
        <div className="page-item__actions">
          <button
            onClick={(e) => {
              e.stopPropagation();
              startRename(page.id, page.title);
            }}
            className="page-item__action"
            title="Ganti nama halaman"
            data-testid={`page-rename-${page.id}`}
          >
            ✎
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              duplicatePage(page.id);
            }}
            className="page-item__action"
            title="Duplikat halaman"
            data-testid={`page-duplicate-${page.id}`}
          >
            ⧉
          </button>
          {canDelete && (
            <button
              className="page-item__action page-item__action--danger"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Hapus halaman "${page.title}"?`)) {
                  deletePage(page.id);
                }
              }}
              title="Hapus halaman"
              data-testid={`page-delete-${page.id}`}
            >
              ×
            </button>
          )}
        </div>
      </div>
    );
  };

  let runningStep = 0;

  return (
    <aside className="page-panel" data-testid="page-panel">
      <div className="page-panel__head">
        <span className="page-panel__head-title">Alur Pembelajaran</span>
        <span className="page-panel__head-count" data-testid="page-panel-count">
          {project.pages.length} halaman
        </span>
      </div>
      <div className="page-panel__list">
        {sections.map((section) => {
          const sectionLabel = MPI_PHASE_LABELS[section.phase];
          return (
            <div
              key={section.phase}
              className={`page-panel__section page-panel__section--${section.phase}`}
              data-testid={`page-panel-section-${section.phase}`}
            >
              <div className="page-panel__section-label">{sectionLabel}</div>
              {section.pages.map((page) => {
                runningStep += 1;
                return renderPageItem(page, runningStep);
              })}
            </div>
          );
        })}
      </div>
      <div className="page-panel__footer">
        <button
          onClick={() => addPage()}
          className="page-panel__add-btn"
          title="Tambah halaman"
          data-action="add-page"
          data-testid="page-panel-add"
        >
          + Tambah Halaman
        </button>
        <p className="page-panel__hint">
          Klik dua kali judul untuk ganti nama.
        </p>
      </div>
    </aside>
  );
}
