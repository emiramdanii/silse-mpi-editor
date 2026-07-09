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

import React, { useState, useMemo, Suspense } from 'react';
import { useEditorStore } from '../store/editor-store';
import { MpiProgressStrip } from './MpiProgressStrip';
import { usePreviewStore } from '../preview/preview-store';
import { downloadHtmlFile } from '../export/export-download';
import { checkExportQuality, formatExportQualityMessage } from '../core/export-quality-gate';
import {
  buildExportReadySummary,
  getExportReadyChipLabel,
  formatExportReadySummaryText,
} from '../core/export-ready-summary';
import { scoreProject, getScoreLabel, getScoreColor } from '../core/scoring/scoring-engine';
import { undo, redo, canUndo, canRedo } from '../store/undo-redo';
import { GuidedFlowDialog } from './GuidedFlowDialog';

// OPTIMASI-01: lazy-load heavy modules that are only needed on user action.
// TemplatePickerDialog is a modal — only loaded when user clicks "Template Pedagogis".
// AiImportDialog is a modal — only loaded when user clicks "Import dari AI".
// export-html is only needed when user clicks "Export HTML".
// This removes ~150KB+ from the initial bundle.
const TemplatePickerDialog = React.lazy(() =>
  import('./TemplatePickerDialog').then((m) => ({ default: m.TemplatePickerDialog })),
);
const AiImportDialog = React.lazy(() =>
  import('./AiImportDialog').then((m) => ({ default: m.AiImportDialog })),
);

export function Topbar() {
  const project = useEditorStore((s) => s.project);
  const newProject = useEditorStore((s) => s.newProject);
  const setProjectTitle = useEditorStore((s) => s.setProjectTitle);
  const openPreview = usePreviewStore((s) => s.openPreview);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(project.title);
  const [showGuidedFlow, setShowGuidedFlow] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showAiImport, setShowAiImport] = useState(false);

  // EXPORT-READY-SUMMARY-01: compute export ready summary (memoized).
  const exportReadySummary = useMemo(
    () => buildExportReadySummary(checkExportQuality(project)),
    [project],
  );

  // S-01/S-02: Real-time scoring (kelengkapan elemen wajib)
  const scoreResult = useMemo(() => scoreProject(project), [project]);

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

  const handleExport = async () => {
    const current = useEditorStore.getState().project;
    // EXPORT-QUALITY-GATE-01: Aggregate all quality checks (MPI standard + layout + alignment + visual).
    // Warning/confirm dulu, bukan blokir brutal. Healthy project → no confirm, langsung export.
    const report = checkExportQuality(current);
    if (!report.isClean) {
      const message = formatExportQualityMessage(report);
      const proceed = window.confirm(message);
      if (!proceed) return;
    }
    // OPTIMASI-01: dynamic import export-html — only loaded when user exports
    const { exportProjectToHtml } = await import('../export/export-html');
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
        {/* F-01: Undo/Redo buttons */}
        <button
          onClick={undo}
          disabled={!canUndo()}
          className="editor-topbar__action editor-topbar__action--ghost"
          title="Batal (Ctrl+Z)"
          data-action="undo"
          data-testid="topbar-undo"
          style={{ opacity: canUndo() ? 1 : 0.4, cursor: canUndo() ? 'pointer' : 'not-allowed' }}
        >
          ↶ Batal
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className="editor-topbar__action editor-topbar__action--ghost"
          title="Ulangi (Ctrl+Y)"
          data-action="redo"
          data-testid="topbar-redo"
          style={{ opacity: canRedo() ? 1 : 0.4, cursor: canRedo() ? 'pointer' : 'not-allowed' }}
        >
          ↷ Ulangi
        </button>
        {/* EXPORT-READY-SUMMARY-01: compact export ready chip */}
        <span
          className={`editor-topbar__export-ready is-${exportReadySummary.status}`}
          title={formatExportReadySummaryText(exportReadySummary)}
          data-testid="export-ready-summary"
          data-status={exportReadySummary.status}
          data-total-issues={exportReadySummary.totalIssues}
        >
          {getExportReadyChipLabel(exportReadySummary)}
        </span>
        {/* S-02/S-03: Real-time score + progress bar */}
        <span
          data-testid="score-display"
          title={scoreResult.suggestions.length > 0 ? scoreResult.suggestions.join('\n') : 'Semua elemen wajib terisi'}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 999,
            background: `${getScoreColor(scoreResult.totalScore)}15`,
            border: `1px solid ${getScoreColor(scoreResult.totalScore)}40`,
            fontSize: 12, fontWeight: 700,
            color: getScoreColor(scoreResult.totalScore),
          }}
        >
          <span>{scoreResult.totalScore}</span>
          {/* S-03: Progress bar */}
          <span
            data-testid="score-progress-bar"
            style={{
              display: 'inline-block', width: 60, height: 6,
              borderRadius: 3, background: 'rgba(0,0,0,0.08)', overflow: 'hidden',
            }}
          >
            <span style={{
              display: 'block', height: '100%',
              width: `${scoreResult.totalScore}%`,
              background: getScoreColor(scoreResult.totalScore),
              borderRadius: 3, transition: 'width 0.3s ease',
            }} />
          </span>
          <span style={{ fontSize: 11, fontWeight: 600 }}>{getScoreLabel(scoreResult.totalScore)}</span>
        </span>
        {/* UX-03: AI Style Badge — show ✨ when project has AI style overrides */}
        {project.hasAiStyleOverrides && (
          <span
            data-testid="ai-style-badge"
            title="Style desain ini dikustomisasi oleh AI. Klik Style Pack untuk mengubah."
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', borderRadius: 999,
              background: 'var(--color-ai-style-bg-gradient)',
              border: '1px solid var(--color-ai-style-border)',
              fontSize: 11, fontWeight: 700, color: 'var(--color-ai-style)',
            }}
          >
            ✨ AI Style
          </span>
        )}
        <button
          onClick={handleExport}
          className="editor-topbar__action editor-topbar__action--primary"
          title="Unduh HTML — bisa dibuka tanpa internet"
          data-action="export-html"
          data-milestone="M6"
          data-testid="topbar-export"
        >
          ⬇ Export HTML
        </button>
        {/* E-03: Export Edited JSON — save project as JSON for backup/template */}
        <button
          onClick={() => {
            const json = JSON.stringify(useEditorStore.getState().project, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${project.title.replace(/[^a-zA-Z0-9]/g, '-')}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="editor-topbar__action editor-topbar__action--ghost"
          title="Simpan sebagai JSON — untuk backup atau template"
          data-action="export-json"
          data-testid="topbar-export-json"
        >
          📋 Export JSON
        </button>
        {/* E-04: Copy HTML to Clipboard */}
        <button
          onClick={async () => {
            const current = useEditorStore.getState().project;
            const { exportProjectToHtml } = await import('../export/export-html');
            const html = exportProjectToHtml(current);
            try {
              await navigator.clipboard.writeText(html);
              alert('Kode HTML berhasil disalin ke clipboard!');
            } catch {
              // Fallback: download as HTML file
              downloadHtmlFile(current.title, html);
              alert('Clipboard tidak tersedia. File HTML diunduh sebagai gantinya.');
            }
          }}
          className="editor-topbar__action editor-topbar__action--ghost"
          title="Salin kode HTML ke clipboard"
          data-action="copy-html"
          data-testid="topbar-copy-html"
        >
          📎 Salin HTML
        </button>
        {/* E-01: Export PNG — screenshot current canvas */}
        <button
          onClick={async () => {
            const current = useEditorStore.getState().project;
            const { exportProjectToHtml } = await import('../export/export-html');
            const html = exportProjectToHtml(current);
            // Open export HTML in new window, then trigger browser print-to-PNG
            const w = window.open('', '_blank');
            if (!w) {
              alert('Popup diblokir. Izinkan popup untuk export PNG.');
              return;
            }
            w.document.write(html);
            w.document.close();
            // Wait for render, then trigger print dialog
            setTimeout(() => {
              w.focus();
              w.print();
            }, 1000);
          }}
          className="editor-topbar__action editor-topbar__action--ghost"
          title="Cetak / Simpan sebagai PNG (via dialog print browser)"
          data-action="export-png"
          data-testid="topbar-export-png"
        >
          🖼️ Export PNG
        </button>
        <button
          onClick={() => setShowGuidedFlow(true)}
          className="editor-topbar__action editor-topbar__action--guided"
          title="Buat MPI lengkap dari topik pembelajaran"
          data-action="guided-flow"
          data-testid="topbar-guided-flow"
        >
          🎯 Buat MPI dari Topik
        </button>
        <button
          onClick={() => setShowTemplatePicker(true)}
          className="editor-topbar__action editor-topbar__action--template"
          title="Pilih template pedagogis siap pakai (12 scene lengkap)"
          data-action="template-picker"
          data-testid="topbar-template-picker"
        >
          📋 Template Pedagogis
        </button>
        <button
          onClick={() => setShowAiImport(true)}
          className="editor-topbar__action editor-topbar__action--ai-import"
          title="Import desain dari AI (blueprint JSON)"
          data-action="ai-import"
          data-testid="topbar-ai-import"
        >
          🤖 Import dari AI
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
      {showTemplatePicker && (
        <Suspense fallback={<div style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>Memuat template…</div>}>
          <TemplatePickerDialog onClose={() => setShowTemplatePicker(false)} />
        </Suspense>
      )}
      {showAiImport && (
        <Suspense fallback={<div style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>Memuat import AI…</div>}>
          <AiImportDialog onClose={() => setShowAiImport(false)} />
        </Suspense>
      )}
    </header>
  );
}
