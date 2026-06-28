/**
 * Topbar — workspace header for SILSE MPI Editor (UX-01 redesign).
 *
 * Layer: editor
 * Allowed imports: react, ../store/editor-store, ./Toolbar, ./MpiProgressStrip
 *
 * Kontrak (UX-01 Scope B):
 *   - Workspace header, bukan dev-tools topbar.
 *   - Kiri: brand SILSE + judul MPI (editable inline) + chip kurikulum.
 *   - Tengah: MpiProgressStrip (10 peran standar + quality flag).
 *   - Kanan: aksi primer (Pratinjau, Export HTML, + MPI Baru).
 *
 *   Toolbar (tombol tambah elemen + berkas) TIDAK lagi di Topbar —
 *   dipindah ke EditorToolbar yang menempel di canvas stage, supaya
 *   konteks aksi dekat dengan kanvas.
 */

import { useState } from 'react';
import { useEditorStore } from '../store/editor-store';
import { MpiProgressStrip } from './MpiProgressStrip';
import { usePreviewStore } from '../preview/preview-store';
import { exportProjectToHtml } from '../export/export-html';
import { downloadHtmlFile } from '../export/export-download';
import { checkMpiStandard } from '../core/mpi-quality-check';
import { GuidedFlowDialog } from './GuidedFlowDialog';

export function Topbar() {
  const project = useEditorStore((s) => s.project);
  const newProject = useEditorStore((s) => s.newProject);
  const setProjectTitle = useEditorStore((s) => s.setProjectTitle);
  const openPreview = usePreviewStore((s) => s.openPreview);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(project.title);
  const [showGuidedFlow, setShowGuidedFlow] = useState(false);

  const startEditTitle = () => {
    setTitleDraft(project.title);
    setEditingTitle(true);
  };
  const commitTitle = () => {
    const trimmed = titleDraft.trim();
    if (trimmed) setProjectTitle(trimmed);
    setEditingTitle(false);
  };
  const cancelTitle = () => {
    setEditingTitle(false);
    setTitleDraft(project.title);
  };

  const handleExport = () => {
    const current = useEditorStore.getState().project;
    const qc = checkMpiStandard(current);
    if (!qc.pass || qc.warnings.length > 0) {
      const msgs = [
        ...qc.errors.map((e) => '❌ ' + e),
        ...qc.warnings.map((w) => '⚠️ ' + w),
      ];
      const proceed = window.confirm(
        'Cek Standar MPI:\n\n' + msgs.join('\n') +
        '\n\nApakah Anda tetap ingin export?',
      );
      if (!proceed) return;
    }
    const html = exportProjectToHtml(current);
    downloadHtmlFile(current.title, html);
  };

  const curriculum = project.curriculum;
  const curriculumChip = curriculum
    ? `${curriculum.subject || '—'} · Kelas ${curriculum.grade || '—'} · Fase ${curriculum.phase || '—'}`
    : 'Kurikulum belum diisi';

  return (
    <header className="editor-topbar" data-testid="editor-topbar">
      <div className="editor-topbar__brand">
        <span className="editor-topbar__logo" aria-hidden>🎓</span>
        <span className="editor-topbar__brand-text">SILSE</span>
        <span className="editor-topbar__brand-sub">MPI Editor</span>
      </div>

      <div className="editor-topbar__divider" />

      <div className="editor-topbar__project">
        {editingTitle ? (
          <input
            type="text"
            className="editor-topbar__title-input"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitle();
              if (e.key === 'Escape') cancelTitle();
            }}
            autoFocus
            data-testid="topbar-title-input"
          />
        ) : (
          <button
            type="button"
            className="editor-topbar__title-btn"
            onClick={startEditTitle}
            title="Klik untuk ganti judul MPI"
            data-testid="topbar-title-btn"
          >
            {project.title}
            <span className="editor-topbar__title-pencil" aria-hidden>✎</span>
          </button>
        )}
        <span
          className={`editor-topbar__curriculum${curriculum ? '' : ' is-empty'}`}
          title={curriculum ? 'Identitas kurikulum' : 'Isi kurikulum via Inspector saat tidak ada elemen terpilih'}
        >
          {curriculumChip}
        </span>
      </div>

      <div className="editor-topbar__divider" />

      <div className="editor-topbar__progress">
        <MpiProgressStrip />
      </div>

      <div className="editor-topbar__spacer" />

      <div className="editor-topbar__actions">
        <button
          onClick={openPreview}
          className="editor-topbar__action editor-topbar__action--ghost"
          title="Buka pratinjau MPI"
          data-action="preview"
          data-milestone="M5"
          data-testid="topbar-preview"
        >
          ▶ Pratinjau
        </button>
        <button
          onClick={handleExport}
          className="editor-topbar__action editor-topbar__action--primary"
          title="Export HTML standalone"
          data-action="export-html"
          data-milestone="M6"
          data-testid="topbar-export"
        >
          ⬇ Export HTML
        </button>
        <button
          onClick={() => setShowGuidedFlow(true)}
          className="editor-topbar__action editor-topbar__action--guided"
          title="Buat paket MPI lengkap dari topik"
          data-action="guided-flow"
          data-testid="topbar-guided-flow"
        >
          🎯 Paket MPI dari Topik
        </button>
        <button
          onClick={() => {
            if (window.confirm('Buat MPI baru? Perubahan saat ini akan hilang jika belum disimpan.')) {
              newProject();
            }
          }}
          className="editor-topbar__action editor-topbar__action--ghost"
          title="Mulai MPI baru dari kosong"
          data-action="new-project"
          data-testid="topbar-new-project"
        >
          + MPI Baru
        </button>
      </div>
      {showGuidedFlow && (
        <GuidedFlowDialog onClose={() => setShowGuidedFlow(false)} />
      )}
    </header>
  );
}
