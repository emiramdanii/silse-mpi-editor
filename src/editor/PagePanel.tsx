/**
 * PagePanel — daftar halaman sebagai alur pembelajaran (UX-01 + UX-02).
 *
 * Layer: editor
 * Allowed imports: react, ../store/editor-store, ../core/types, ./mpi-standard-roles, ./mpi-page-status
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
 *
 * Kontrak (UX-02 Scope B + C — Learning Flow Status):
 *   - Header PagePanel menampilkan ringkasan Cek Standar (X lengkap, Y warning, Z error).
 *   - Setiap page item punya badge status (✓/⚠/✗) di sebelah judul.
 *   - Tooltip badge menampilkan daftar masalah.
 *   - Saat halaman aktif (selected) dan punya masalah, tampilkan inline warning
 *     list di bawah meta — guru bisa langsung baca tanpa harus klik Export.
 *   - Tetap hanya tampilan UI — tidak menambah/mengubah contract checkMpiStandard.
 */

import { useState } from 'react';
import { useEditorStore } from '../store/editor-store';
import type { SimplePage } from '../core/types';
import { MPI_PHASE_LABELS, getRoleInfo } from './mpi-standard-roles';
import {
  computeAllPageStatuses,
  computeLearningFlowSummary,
  statusIcon,
  statusLabel,
  type PageStatus,
  type PageStatusLevel,
} from './mpi-page-status';
import { PageThumbnail } from './PageThumbnail';
import { AlignmentSummary, alignmentLevelToClass } from './AlignmentPanel';
import { useLearningGoalAlignment } from './use-alignment';
import {
  getPageAlignmentLevel,
  getPageAlignmentLevelIcon,
  getPageAlignmentLevelLabel,
} from '../core/learning-goal-alignment';

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
  return (['pembukaan', 'inti', 'penutup'] as const)
    .map((phase) => out[phase])
    .filter((s) => s.pages.length > 0);
}

function StatusBadge({ status }: { status: PageStatus }) {
  if (status.level === 'ok') {
    return (
      <span
        className="page-status-badge page-status-badge--ok"
        title="Halaman lengkap sesuai standar perannya."
        data-testid={`page-status-badge-${status.pageId}`}
        data-level="ok"
      >
        ✓
      </span>
    );
  }
  const tooltipLines = status.issues.map((i) => `${i.level === 'error' ? '✗' : '⚠'} ${i.message}`);
  const tooltip = tooltipLines.join('\n');
  return (
    <span
      className={`page-status-badge page-status-badge--${status.level}`}
      title={tooltip}
      data-testid={`page-status-badge-${status.pageId}`}
      data-level={status.level}
      data-issue-count={status.issues.length}
    >
      {statusIcon(status.level)}
      {status.issues.length > 1 && (
        <span className="page-status-badge__count">{status.issues.length}</span>
      )}
    </span>
  );
}

/**
 * LGA-UI-V2: Alignment badge per halaman (list view only).
 * Shows page-level alignment level (aligned/partial/unaligned/empty/neutral).
 * Neutral pages (cover/guide/menu/free) do not show the badge to keep UI clean.
 */
function AlignmentBadge({
  pageId,
  level,
}: {
  pageId: string;
  level: ReturnType<typeof getPageAlignmentLevel>;
}) {
  // Neutral pages: don't render badge.
  if (level === 'neutral') return null;
  const label = getPageAlignmentLevelLabel(level);
  const icon = getPageAlignmentLevelIcon(level);
  return (
    <span
      className={`page-alignment-badge ${alignmentLevelToClass(level)}`}
      title={`Alignment: ${label}`}
      data-testid={`page-alignment-badge-${pageId}`}
      data-level={level}
    >
      {icon}
    </span>
  );
}

function StatusSummary({
  summary,
}: {
  summary: ReturnType<typeof computeLearningFlowSummary>;
}) {
  if (summary.total === 0) return null;
  return (
    <div
      className={`page-panel__summary${summary.allOk ? ' is-all-ok' : ''}`}
      data-testid="page-panel-summary"
      data-ok={summary.ok}
      data-warning={summary.warning}
      data-error={summary.error}
    >
      <span className="page-panel__summary-title">Cek Standar:</span>
      <span className="page-panel__summary-count page-panel__summary-count--ok">
        ✓ {summary.ok}
      </span>
      {summary.warning > 0 && (
        <span className="page-panel__summary-count page-panel__summary-count--warning">
          ⚠ {summary.warning}
        </span>
      )}
      {summary.error > 0 && (
        <span className="page-panel__summary-count page-panel__summary-count--error">
          ✗ {summary.error}
        </span>
      )}
      {summary.allOk && (
        <span className="page-panel__summary-all-ok">Semua lengkap</span>
      )}
    </div>
  );
}

function InlineIssueList({ status }: { status: PageStatus }) {
  if (status.issues.length === 0) return null;
  return (
    <ul
      className="page-item__issues"
      data-testid={`page-issues-${status.pageId}`}
    >
      {status.issues.map((issue, idx) => (
        <li
          key={idx}
          className={`page-item__issue page-item__issue--${issue.level}`}
          data-level={issue.level}
        >
          <span className="page-item__issue-icon" aria-hidden>
            {issue.level === 'error' ? '✗' : '⚠'}
          </span>
          <span className="page-item__issue-text">{issue.message}</span>
        </li>
      ))}
    </ul>
  );
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
  // PAGE-THUMBNAIL-SIDEBAR-V1: default thumbnail view
  // CONTENT-VISUAL-CONTRACT-AUDIT-01 Scope 7: default thumbnail for quick overview
  const [viewMode, setViewMode] = useState<'list' | 'thumbnail'>('thumbnail');
  // UX-02 Patch (UX-01 Patch-2 polish): track explicit issue expansion per page.
  // - undefined → default (active page expanded, inactive collapsed)
  // - true      → force expanded (user clicked toggle on inactive page)
  // - false     → force collapsed (user clicked toggle on active page)
  const [issueOverrides, setIssueOverrides] = useState<Record<string, boolean>>({});

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
  // UX-02: compute per-page status + aggregate summary
  const pageStatuses = computeAllPageStatuses(project.pages, project);
  const summary = computeLearningFlowSummary(pageStatuses);
  // LGA-UI-V2: compute alignment once for the whole panel.
  const alignment = useLearningGoalAlignment();
  // Build map: pageId → PageAlignment (for badge lookup).
  const pageAlignmentMap = new Map(alignment.pages.map((pa) => [pa.pageId, pa]));
  // TEACHER-MAIN-FLOW-POLISH-01: detect default/empty project for hint.
  const isDefaultProject =
    project.title === 'MPI Baru' &&
    project.pages.length === 1 &&
    project.pages[0].role === 'cover' &&
    project.pages[0].components.length <= 1;

  /**
   * Determine if a page's inline issue list should be expanded.
   * Default: active page expanded, inactive pages collapsed.
   * User can override per-page via toggleIssues().
   */
  const isIssueExpanded = (pageId: string, isActive: boolean): boolean => {
    const override = issueOverrides[pageId];
    if (override !== undefined) return override;
    return isActive; // default
  };

  const toggleIssues = (pageId: string, isActive: boolean) => {
    const current = isIssueExpanded(pageId, isActive);
    setIssueOverrides((prev) => ({
      ...prev,
      [pageId]: !current,
    }));
  };

  const renderPageItem = (page: SimplePage, stepNumber: number) => {
    const isActive = page.id === project.currentPageId;
    const isEditing = editingId === page.id;
    const canDelete = canDeleteAny;
    const info = getRoleInfo(page.role);
    const isStandard = page.role !== 'free';
    const status = pageStatuses[page.id];
    const hasIssues = status && status.issues.length > 0;
    const issuesExpanded = isIssueExpanded(page.id, isActive);
    // LGA-UI-V2: per-page alignment level for badge.
    const pageAlignment = pageAlignmentMap.get(page.id);
    const alignmentLevel = pageAlignment ? getPageAlignmentLevel(pageAlignment) : 'neutral' as const;

    return (
      <div
        key={page.id}
        className={`page-item${isActive ? ' is-active' : ''}${isStandard ? '' : ' is-free'}${hasIssues ? ` has-issues has-issues--${status.level}` : ''}`}
        onClick={() => selectPage(page.id)}
        data-testid={`page-item-${page.id}`}
        data-role={page.role}
        data-status={status?.level}
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
            <div className="page-item__title-row">
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
              {status && <StatusBadge status={status} />}
              {pageAlignment && (
                <AlignmentBadge pageId={page.id} level={alignmentLevel} />
              )}
              {hasIssues && (
                <button
                  type="button"
                  className="page-item__issue-toggle"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleIssues(page.id, isActive);
                  }}
                  title={issuesExpanded ? 'Sembunyikan detail masalah' : 'Tampilkan detail masalah'}
                  data-testid={`page-issue-toggle-${page.id}`}
                  aria-expanded={issuesExpanded}
                >
                  {issuesExpanded ? '▾' : '▸'}
                </button>
              )}
            </div>
          )}
          <span className="page-item__meta">
            {info.label} · {LAYOUT_LABELS[page.layoutId] ?? page.layoutId}
            {hasIssues && (
              <span className="page-item__meta-status">
                {' · '}
                <span className={`page-item__meta-status-text page-item__meta-status-text--${status.level}`}>
                  {statusLabel(status.level as PageStatusLevel)}
                </span>
              </span>
            )}
          </span>
          {/* UX-02 Patch (UX-01 Patch-2 polish): inline issue list default expanded
              ONLY for the active page. Other pages show badge + tooltip only —
              keeps the panel visually clean. User can still toggle to expand
              any page's issues manually (override stored in issueOverrides). */}
          {hasIssues && issuesExpanded && !isEditing && (
            <InlineIssueList status={status} />
          )}
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
        <span className="page-panel__head-title">Halaman</span>
        <div className="page-panel__head-right">
          <span className="page-panel__head-count" data-testid="page-panel-count">
            {project.pages.length} halaman
          </span>
          {/* PAGE-THUMBNAIL-SIDEBAR-V1: view mode toggle */}
          <button
            type="button"
            className="page-panel__view-toggle"
            onClick={() => setViewMode((v) => (v === 'list' ? 'thumbnail' : 'list'))}
            title={viewMode === 'list' ? 'Tampilan thumbnail' : 'Tampilan daftar'}
            data-testid="page-panel-view-toggle"
            data-view-mode={viewMode}
          >
            {viewMode === 'list' ? '▦' : '☰'}
          </button>
        </div>
      </div>
      <StatusSummary summary={summary} />
      <AlignmentSummary />
      {/* TEACHER-MAIN-FLOW-POLISH-01: empty state hint for default project */}
      {isDefaultProject && (
        <div
          className="page-panel__empty-hint"
          data-testid="page-panel-empty-hint"
        >
          Mulai cepat: klik <strong>“Buat MPI dari Topik”</strong> untuk membuat draft media pembelajaran.
        </div>
      )}
      {viewMode === 'thumbnail' ? (
        <div className="page-panel__thumbnails" data-testid="page-panel-thumbnails">
          {project.pages.map((page) => (
            <PageThumbnail
              key={page.id}
              page={page}
              isActive={page.id === project.currentPageId}
              onClick={() => selectPage(page.id)}
              project={project}
            />
          ))}
        </div>
      ) : (
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
      )}
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
