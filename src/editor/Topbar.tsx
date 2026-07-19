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
import { isProjectEmpty } from '../core/project-factory';
import {
  ACCEPTED_SLIDE_MIME,
  validateSlideFileCount,
  readImageFiles,
  batchExtractDominantColors,
} from '../core/slide-import';
import { SlideSettingsDialog } from './SlideSettingsDialog';
import { QuizSheetDialog } from './QuizSheetDialog';

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
const ProjectLibraryDialog = React.lazy(() =>
  import('./ProjectLibraryDialog').then((m) => ({ default: m.ProjectLibraryDialog })),
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
  const [showProjectLibrary, setShowProjectLibrary] = useState(false);
  // V2-PILAR-1: state for slide PNG import
  const [slideImportInProgress, setSlideImportInProgress] = useState(false);
  // V2-PILAR-1: state for slide settings dialog
  const [showSlideSettings, setShowSlideSettings] = useState(false);
  // V2-PILAR-2.5: state for quiz sheet dialog
  const [showQuizSheet, setShowQuizSheet] = useState(false);
  // MEGA FIX: state for Berkas dropdown
  const [showBerkasMenu, setShowBerkasMenu] = useState(false);
  // MEGA FIX #2: state for Export dropdown (4 export buttons → 1 dropdown)
  const [showExportMenu, setShowExportMenu] = useState(false);
  // MEGA FIX #2: state for Buat dropdown (4 create/import buttons → 1 dropdown)
  const [showBuatMenu, setShowBuatMenu] = useState(false);
  // MEGA FIX #2: state for Pengaturan dropdown (Slide Settings + Quiz Sheet → 1 dropdown)
  const [showPengaturanMenu, setShowPengaturanMenu] = useState(false);
  // FASE 3: state for Impor dropdown (AI Import + Slide Import → separate from Buat)
  const [showImporMenu, setShowImporMenu] = useState(false);

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

  // V2-PILAR-1: Import slide PNG/JPEG/WebP as new pages.
  // Alur:
  //   1. Buka file picker (multi-select, image/*)
  //   2. Validasi jumlah file (max 50)
  //   3. Tentukan mode: 'replace' jika proyek kosong, 'append' jika tidak
  //      (jika tidak kosong, tanya user: tambah / buat baru)
  //   4. Baca semua file sebagai data URL (paralel)
  //   5. Panggil store.importSlidesAsPages(files, mode)
  const handleImportSlides = () => {
    if (slideImportInProgress) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = ACCEPTED_SLIDE_MIME;
    input.onchange = async (e) => {
      const fileList = (e.target as HTMLInputElement).files;
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList);

      // Validasi jumlah file
      const countCheck = validateSlideFileCount(files.length);
      if (!countCheck.ok) {
        window.alert(countCheck.error);
        return;
      }

      // Tentukan mode berdasarkan kondisi proyek
      const current = useEditorStore.getState().project;
      const empty = isProjectEmpty(current);
      let mode: 'replace' | 'append';
      if (empty) {
        mode = 'replace';
      } else {
        // Proyek tidak kosong — tanya user
        const choice = window.confirm(
          `Anda akan mengimpor ${files.length} slide ke proyek yang sudah berisi ${current.pages.length} halaman.\n\n` +
          `Klik OK untuk MENAMBAH slide ke akhir proyek ini.\n` +
          `Klik Batal untuk MEMBUAT proyek baru dari slide (proyek saat ini tidak terhapus, simpan manual dulu jika perlu).`,
        );
        // confirm() returns true for OK, false for Cancel.
        // true  → append (tambah ke existing)
        // false → replace (buat baru — HANYA berlaku jika user sudah simpan existing)
        // Untuk safety: jika user pilih "Batal" (replace), pastikan dia sadar proyek lama hilang.
        if (choice) {
          mode = 'append';
        } else {
          const confirmReplace = window.confirm(
            `PERINGATAN: Membuat proyek baru akan MENGHAPUS ${current.pages.length} halaman yang ada sekarang.\n\n` +
            `Pastikan Anda sudah menyimpan proyek saat ini (Export JSON / Simpan ke Library) jika ingin mempertahankannya.\n\n` +
            `Klik OK untuk konfirmasi hapus dan buat proyek baru dari slide.`,
          );
          if (!confirmReplace) return;
          mode = 'replace';
        }
      }

      setSlideImportInProgress(true);
      try {
        const slideFiles = await readImageFiles(files);
        if (slideFiles.length === 0) {
          window.alert('Tidak ada file gambar valid yang bisa diimpor.');
          return;
        }
        const importSlidesAsPages = useEditorStore.getState().importSlidesAsPages;
        const count = importSlidesAsPages(slideFiles, mode);

        // V2-PILAR-2.5: Extract dominant colors from imported slides (async, non-blocking)
        // Colors are stored as page.dominantColor. Guru can apply via Inspector.
        batchExtractDominantColors(slideFiles.map((f) => f.dataUrl), 5).then((colors) => {
          const project = useEditorStore.getState().project;
          const setPageDominantColor = useEditorStore.getState().setPageDominantColor;
          // Match colors to newly imported pages (last N pages where N = count)
          const startIdx = mode === 'replace' ? 0 : project.pages.length - count;
          for (let i = 0; i < colors.length && (startIdx + i) < project.pages.length; i++) {
            if (colors[i]) {
              setPageDominantColor(project.pages[startIdx + i].id, colors[i]);
            }
          }
        }).catch(() => {
          // Color extraction is best-effort — silently ignore failures
        });

        window.alert(`Berhasil mengimpor ${count} slide sebagai halaman baru.`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        window.alert(`Gagal mengimpor slide: ${message}`);
      } finally {
        setSlideImportInProgress(false);
      }
    };
    input.click();
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
        {/* MEGA FIX #2: Export dropdown — 4 tombol export → 1 dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="editor-topbar__action editor-topbar__action--primary"
            title="Export: HTML, JSON, Salin HTML, PNG"
            data-action="export-menu"
            data-testid="topbar-export-menu"
          >
            ⬇ Export ▾
          </button>
          {showExportMenu && (
            <div
              data-testid="export-dropdown"
              style={{
                position: 'absolute', right: 0, top: '100%', marginTop: 4,
                minWidth: 200, background: 'var(--color-panel, #fff)',
                border: '1px solid var(--color-border, #e3ddcd)', borderRadius: 8,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 1000, padding: 4,
              }}
            >
              <button
                onClick={() => { setShowExportMenu(false); handleExport(); }}
                data-testid="topbar-export"
                data-action="export-html"
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, borderRadius: 4, color: 'var(--color-text, #1f2533)' }}
              >
                📄 Export HTML
              </button>
              <button
                onClick={() => {
                  setShowExportMenu(false);
                  const json = JSON.stringify(useEditorStore.getState().project, null, 2);
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${project.title.replace(/[^a-zA-Z0-9]/g, '-')}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                data-testid="topbar-export-json"
                data-action="export-json"
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, borderRadius: 4, color: 'var(--color-text, #1f2533)' }}
              >
                📋 Export JSON
              </button>
              <button
                onClick={async () => {
                  setShowExportMenu(false);
                  const current = useEditorStore.getState().project;
                  const { exportProjectToHtml } = await import('../export/export-html');
                  const html = exportProjectToHtml(current);
                  try {
                    await navigator.clipboard.writeText(html);
                    alert('Kode HTML berhasil disalin ke clipboard!');
                  } catch {
                    downloadHtmlFile(current.title, html);
                    alert('Clipboard tidak tersedia. File HTML diunduh sebagai gantinya.');
                  }
                }}
                data-testid="topbar-copy-html"
                data-action="copy-html"
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, borderRadius: 4, color: 'var(--color-text, #1f2533)' }}
              >
                📎 Salin HTML
              </button>
              <button
                onClick={async () => {
                  setShowExportMenu(false);
                  const current = useEditorStore.getState().project;
                  const { exportProjectToHtml } = await import('../export/export-html');
                  const html = exportProjectToHtml(current);
                  const w = window.open('', '_blank');
                  if (!w) {
                    alert('Popup diblokir. Izinkan popup untuk export PNG.');
                    return;
                  }
                  w.document.write(html);
                  w.document.close();
                  setTimeout(() => { w.focus(); w.print(); }, 1000);
                }}
                data-testid="topbar-export-png"
                data-action="export-png"
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, borderRadius: 4, color: 'var(--color-text, #1f2533)' }}
              >
                🖼️ Export PNG
              </button>
            </div>
          )}
        </div>
        {/* MEGA FIX #2: Buat dropdown — 4 tombol create/import → 1 dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowBuatMenu(!showBuatMenu)}
            className="editor-topbar__action editor-topbar__action--ghost"
            title="Buat: MPI dari Topik, Template, Import AI, Impor Slide"
            data-action="buat-menu"
            data-testid="topbar-buat-menu"
          >
            ✨ Buat ▾
          </button>
          {showBuatMenu && (
            <div
              data-testid="buat-dropdown"
              style={{
                position: 'absolute', right: 0, top: '100%', marginTop: 4,
                minWidth: 220, background: 'var(--color-panel, #fff)',
                border: '1px solid var(--color-border, #e3ddcd)', borderRadius: 8,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 1000, padding: 4,
              }}
            >
              <button
                onClick={() => { setShowBuatMenu(false); setShowGuidedFlow(true); }}
                data-testid="topbar-guided-flow"
                data-action="guided-flow"
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, borderRadius: 4, color: 'var(--color-text, #1f2533)' }}
              >
                🎯 Buat MPI dari Topik
              </button>
              <button
                onClick={() => { setShowBuatMenu(false); setShowTemplatePicker(true); }}
                data-testid="topbar-template-picker"
                data-action="template-picker"
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, borderRadius: 4, color: 'var(--color-text, #1f2533)' }}
              >
                📋 Template Pedagogis
              </button>
              <button
                onClick={() => {
                  setShowBuatMenu(false);
                  import('../storage/master-template-storage').then(({ listMasterTemplates }) => {
                    import('../core/master-template').then(({ cloneMasterToProject }) => {
                      const masters = listMasterTemplates();
                      if (masters.length === 0) {
                        alert('Belum ada Master Template. Simpan project sebagai Master dulu (Berkas → Save as Master Template).');
                        return;
                      }
                      const masterList = masters.map((m, i) => `${i + 1}. ${m.name} (${m.pageStructure.length} halaman, ${m.stylePackId})`).join('\n');
                      const choice = window.prompt(`Pilih Master Template (1-${masters.length}):\n\n${masterList}\n\nMasukkan nomor:`);
                      const idx = parseInt(choice || '0', 10) - 1;
                      if (idx < 0 || idx >= masters.length) {
                        alert('Pilihan tidak valid.');
                        return;
                      }
                      const topic = window.prompt('Topik MPI baru:', '');
                      if (!topic || !topic.trim()) return;
                      const result = cloneMasterToProject(masters[idx], topic.trim());
                      if (result.ok) {
                        useEditorStore.getState().setProject(result.project);
                        alert(`MPI "${topic}" berhasil dibuat dari Master "${masters[idx].name}". Style + layout diwarisi, konten kosong — isi sendiri.`);
                      } else {
                        alert(`Gagal: ${result.error}`);
                      }
                    });
                  });
                }}
                data-testid="topbar-clone-master"
                data-action="clone-master"
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, borderRadius: 4, color: 'var(--color-ai-style, #7c3aed)', fontWeight: 700 }}
              >
                🏛️ Clone dari Master Template
              </button>
            </div>
          )}
        </div>
        {/* FASE 3: Impor dropdown — AI Import + Slide Import (terpisah dari Buat) */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowImporMenu(!showImporMenu)}
            className="editor-topbar__action editor-topbar__action--ghost"
            title="Impor: dari AI, dari gambar slide"
            data-action="impor-menu"
            data-testid="topbar-impor-menu"
          >
            📥 Impor ▾
          </button>
          {showImporMenu && (
            <div
              data-testid="impor-dropdown"
              style={{
                position: 'absolute', right: 0, top: '100%', marginTop: 4,
                minWidth: 220, background: 'var(--color-panel, #fff)',
                border: '1px solid var(--color-border, #e3ddcd)', borderRadius: 8,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 1000, padding: 4,
              }}
            >
              <button
                onClick={() => { setShowImporMenu(false); setShowAiImport(true); }}
                data-testid="topbar-ai-import"
                data-action="ai-import"
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, borderRadius: 4, color: 'var(--color-ai-style, #7c3aed)', fontWeight: 700 }}
              >
                🤖 Import dari AI (JSON)
              </button>
              <button
                onClick={() => { setShowImporMenu(false); handleImportSlides(); }}
                disabled={slideImportInProgress}
                data-testid="topbar-import-slides"
                data-action="import-slides"
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', cursor: slideImportInProgress ? 'wait' : 'pointer', fontSize: 13, borderRadius: 4, color: 'var(--color-text, #1f2533)', opacity: slideImportInProgress ? 0.6 : 1 }}
              >
                {slideImportInProgress ? '⏳ Mengimpor…' : '🖼️ Impor Slide (PNG/JPG)'}
              </button>
            </div>
          )}
        </div>
        {/* MEGA FIX #2: Pengaturan dropdown — Slide Settings + Quiz Sheet → 1 dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowPengaturanMenu(!showPengaturanMenu)}
            className="editor-topbar__action editor-topbar__action--ghost"
            title="Pengaturan: Slide, Kuis"
            data-action="pengaturan-menu"
            data-testid="topbar-pengaturan-menu"
          >
            ⚙️ Pengaturan ▾
          </button>
          {showPengaturanMenu && (
            <div
              data-testid="pengaturan-dropdown"
              style={{
                position: 'absolute', right: 0, top: '100%', marginTop: 4,
                minWidth: 220, background: 'var(--color-panel, #fff)',
                border: '1px solid var(--color-border, #e3ddcd)', borderRadius: 8,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 1000, padding: 4,
              }}
            >
              <button
                onClick={() => { setShowPengaturanMenu(false); setShowSlideSettings(true); }}
                data-testid="topbar-slide-settings"
                data-action="slide-settings"
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, borderRadius: 4, color: 'var(--color-text, #1f2533)' }}
              >
                ⚙️ Pengaturan Slide
              </button>
              <button
                onClick={() => { setShowPengaturanMenu(false); setShowQuizSheet(true); }}
                data-testid="topbar-quiz-sheet"
                data-action="quiz-sheet"
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, borderRadius: 4, color: 'var(--color-text, #1f2533)' }}
              >
                📊 Kelola Kuis
              </button>
            </div>
          )}
        </div>
        {/* MEGA FIX: Berkas dropdown — konsolidasi 4 tombol yang overflow */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowBerkasMenu(!showBerkasMenu)}
            className="editor-topbar__action editor-topbar__action--ghost"
            title="Menu Berkas: MPI Baru, Simpan, Template, Proyek Saya"
            data-action="berkas-menu"
            data-testid="topbar-berkas-menu"
          >
            📁 Berkas ▾
          </button>
          {showBerkasMenu && (
            <div
              data-testid="berkas-dropdown"
              style={{
                position: 'absolute', right: 0, top: '100%', marginTop: 4,
                minWidth: 200, background: 'var(--color-panel, #fff)',
                border: '1px solid var(--color-border, #e3ddcd)', borderRadius: 8,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 1000, padding: 4,
              }}
            >
              <button
                onClick={() => { setShowBerkasMenu(false); if (window.confirm('Buat MPI baru? Perubahan saat ini akan hilang jika belum disimpan.')) { newProject(); } }}
                data-testid="topbar-new-project"
                data-action="new-project"
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, borderRadius: 4, color: 'var(--color-text, #1f2533)' }}
              >
                ✨ + MPI Baru
              </button>
              <button
                onClick={() => { setShowBerkasMenu(false); import('../storage/project-storage').then(({ saveProjectToLibrary }) => { const result = saveProjectToLibrary(project); alert(result.ok ? 'Proyek berhasil disimpan!' : `Gagal: ${result.error}`); }); }}
                data-testid="topbar-save-to-library"
                data-action="save-to-library"
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, borderRadius: 4, color: 'var(--color-text, #1f2533)' }}
              >
                💾 Simpan Proyek
              </button>
              <button
                onClick={() => { setShowBerkasMenu(false); const name = window.prompt('Nama template:', project.title); if (name && name.trim()) { import('../storage/template-storage').then(({ saveProjectAsTemplate }) => { const result = saveProjectAsTemplate(project, name); alert(result.ok ? 'Template tersimpan!' : `Gagal: ${result.error}`); }); } }}
                data-testid="topbar-save-as-template"
                data-action="save-as-template"
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, borderRadius: 4, color: 'var(--color-text, #1f2533)' }}
              >
                📝 Simpan Template
              </button>
              <button
                onClick={() => {
                  setShowBerkasMenu(false);
                  const name = window.prompt('Nama Master Template:', project.title);
                  if (name && name.trim()) {
                    import('../core/master-template').then(({ createMasterFromProject }) => {
                      import('../storage/master-template-storage').then(({ saveMasterTemplate }) => {
                        const master = createMasterFromProject(project, name.trim(), '');
                        const result = saveMasterTemplate(master);
                        alert(result.ok ? `Master Template "${name}" tersimpan! Clone dari Master ini untuk membuat MPI baru dengan style + layout yang sama.` : `Gagal: ${result.error}`);
                      });
                    });
                  }
                }}
                data-testid="topbar-save-as-master"
                data-action="save-as-master"
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, borderRadius: 4, color: 'var(--color-ai-style, #7c3aed)', fontWeight: 700 }}
              >
                🏛️ Save as Master Template
              </button>
              <button
                onClick={() => { setShowBerkasMenu(false); setShowProjectLibrary(true); }}
                data-testid="topbar-project-library"
                data-action="project-library"
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, borderRadius: 4, color: 'var(--color-text, #1f2533)' }}
              >
                📂 Proyek Saya
              </button>
            </div>
          )}
        </div>
      </div>
      {showGuidedFlow && (
        <GuidedFlowDialog onClose={() => setShowGuidedFlow(false)} />
      )}
      {showTemplatePicker && (
        <Suspense fallback={<div style={{ padding: 20, textAlign: 'center', color: 'var(--color-muted)' }}>Memuat template…</div>}>
          <TemplatePickerDialog onClose={() => setShowTemplatePicker(false)} />
        </Suspense>
      )}
      {showAiImport && (
        <Suspense fallback={<div style={{ padding: 20, textAlign: 'center', color: 'var(--color-muted)' }}>Memuat import AI…</div>}>
          <AiImportDialog onClose={() => setShowAiImport(false)} />
        </Suspense>
      )}
      {showProjectLibrary && (
        <Suspense fallback={<div style={{ padding: 20, textAlign: 'center', color: 'var(--color-muted)' }}>Memuat library…</div>}>
          <ProjectLibraryDialog onClose={() => setShowProjectLibrary(false)} />
        </Suspense>
      )}
      {/* V2-PILAR-1: Slide Settings Dialog */}
      {showSlideSettings && (
        <SlideSettingsDialog onClose={() => setShowSlideSettings(false)} />
      )}
      {/* V2-PILAR-2.5: Quiz Sheet Dialog */}
      {showQuizSheet && (
        <QuizSheetDialog onClose={() => setShowQuizSheet(false)} />
      )}
    </header>
  );
}
