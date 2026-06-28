/**
 * LEARNING-GOAL-ALIGNMENT-UI-V2 — Alignment summary + detail panel.
 *
 * Layer: editor
 * Allowed imports: react, ../store/editor-store, ../core/learning-goal-alignment,
 *                  ../core/types, ./mpi-standard-roles, ./use-alignment
 *
 * Kontrak (LGA-UI-V2):
 *   AlignmentSummary: chip kecil yang tampil di PagePanel header (bawah StatusSummary).
 *     - Menampilkan: "Alignment: X/Y tujuan tercover · [ScoreLabel] · [icon]"
 *     - Klik → buka AlignmentDetailPanel.
 *     - Kalau belum ada objectives → tampilkan "Belum ada tujuan" (non-interactive).
 *
 *   AlignmentDetailPanel: overlay yang menampilkan breakdown alignment:
 *     - Header: score + score label + summary label.
 *     - Section "Tujuan Tidak Tercover" — list objective text (merah).
 *     - Section "Tujuan Tercover" — list objective text (hijau).
 *     - Section "Masalah Alignment" — list issue dengan severity color + page link.
 *       Klik issue dengan pageId → selectPage(pageId) + tutup panel.
 *     - Section "Status per Halaman" — list semua halaman non-neutral dengan
 *       level alignment + issue count.
 *     - Tombol Tutup.
 *
 *   Tidak menambah/mengubah contract checkLearningGoalAlignment.
 *   Tidak menambah field ke schema project.
 *   Tidak mengubah PageThumbnail.
 */

import { useState, useEffect } from 'react';
import { useEditorStore } from '../store/editor-store';
import { useLearningGoalAlignment } from './use-alignment';
import {
  getAlignmentSummaryLabel,
  getAlignmentScoreLabel,
  getPageAlignmentLevel,
  getPageAlignmentLevelLabel,
  getPageAlignmentLevelIcon,
  type PageAlignmentLevel,
} from '../core/learning-goal-alignment';
import type { PageRole } from '../core/types';
import { getRoleInfo } from './mpi-standard-roles';

// ---------------------------------------------------------------------------
// AlignmentSummary — chip di PagePanel header
// ---------------------------------------------------------------------------

export function AlignmentSummary() {
  const alignment = useLearningGoalAlignment();
  const [isOpen, setIsOpen] = useState(false);

  // Kalau belum ada objectives sama sekali → tampilkan label statis (non-interactive)
  if (alignment.totalObjectives === 0) {
    return (
      <div
        className="alignment-summary is-empty"
        data-testid="alignment-summary"
        data-testid-empty="true"
        title="Isi tujuan pembelajaran di kurikulum untuk mengaktifkan alignment check."
      >
        <span className="alignment-summary__icon" aria-hidden>🎯</span>
        <span className="alignment-summary__text">Alignment: Belum ada tujuan</span>
      </div>
    );
  }

  const summaryLabel = getAlignmentSummaryLabel(alignment);
  const scoreLabel = getAlignmentScoreLabel(alignment.score);
  const scoreClass = scoreToClass(alignment.score);
  const issueCount = alignment.issues.length;

  return (
    <>
      <button
        type="button"
        className={`alignment-summary ${scoreClass}`}
        onClick={() => setIsOpen(true)}
        data-testid="alignment-summary"
        data-score={alignment.score}
        data-score-label={scoreLabel}
        data-ok={alignment.ok}
        data-issue-count={issueCount}
        title={`Alignment: ${summaryLabel} · ${scoreLabel} (${alignment.score}/100). Klik untuk detail.`}
      >
        <span className="alignment-summary__icon" aria-hidden>🎯</span>
        <span className="alignment-summary__text">
          Alignment: {summaryLabel}
        </span>
        <span className={`alignment-summary__score ${scoreClass}`}>
          {alignment.score} · {scoreLabel}
        </span>
        {issueCount > 0 && (
          <span className="alignment-summary__flag" aria-label={`${issueCount} masalah`}>
            ⚠ {issueCount}
          </span>
        )}
        {alignment.ok && issueCount === 0 && (
          <span className="alignment-summary__flag alignment-summary__flag--ok">✓</span>
        )}
      </button>
      {isOpen && (
        <AlignmentDetailPanel onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// AlignmentDetailPanel — overlay breakdown
// ---------------------------------------------------------------------------

function AlignmentDetailPanel({ onClose }: { onClose: () => void }) {
  const alignment = useLearningGoalAlignment();
  const project = useEditorStore((s) => s.project);
  const selectPage = useEditorStore((s) => s.selectPage);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const summaryLabel = getAlignmentSummaryLabel(alignment);
  const scoreLabel = getAlignmentScoreLabel(alignment.score);
  const scoreClass = scoreToClass(alignment.score);

  // Build lookup: objectiveId → objective text
  const objectiveTexts = new Map<string, string>();
  if (project.curriculum?.objectives) {
    for (const obj of project.curriculum.objectives) {
      objectiveTexts.set(obj.id, obj.text);
    }
  }

  // Page lookup: pageId → page title + role
  const pageLookup = new Map<string, { title: string; role: string }>();
  for (const page of project.pages) {
    pageLookup.set(page.id, { title: page.title, role: page.role });
  }

  const handleIssueClick = (pageId: string | undefined) => {
    if (pageId) {
      selectPage(pageId);
      onClose();
    }
  };

  return (
    <div
      className="alignment-detail-overlay"
      data-testid="alignment-detail-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Detail Alignment Tujuan Pembelajaran"
    >
      <div
        className="alignment-detail-panel"
        data-testid="alignment-detail-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="alignment-detail__header">
          <div className="alignment-detail__title-row">
            <span className="alignment-detail__icon" aria-hidden>🎯</span>
            <h2 className="alignment-detail__title">Alignment Tujuan Pembelajaran</h2>
            <button
              type="button"
              className="alignment-detail__close"
              onClick={onClose}
              title="Tutup (Esc)"
              data-testid="alignment-detail-close"
              aria-label="Tutup"
            >
              ×
            </button>
          </div>
          <div className={`alignment-detail__score-row ${scoreClass}`}>
            <span className="alignment-detail__score-value">{alignment.score}/100</span>
            <span className="alignment-detail__score-label">{scoreLabel}</span>
            <span className="alignment-detail__summary-label">{summaryLabel}</span>
            {alignment.ok ? (
              <span className="alignment-detail__ok-flag">✓ Aligned</span>
            ) : (
              <span className="alignment-detail__not-ok-flag">✗ Belum aligned</span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="alignment-detail__body">
          {/* Section: Tujuan Tidak Tercover */}
          {alignment.uncoveredObjectiveIds.length > 0 && (
            <section className="alignment-detail__section alignment-detail__section--error">
              <h3 className="alignment-detail__section-title">
                Tujuan Tidak Tercover ({alignment.uncoveredObjectiveIds.length})
              </h3>
              <ul className="alignment-detail__list" data-testid="alignment-detail-uncovered">
                {alignment.uncoveredObjectiveIds.map((objId) => (
                  <li key={objId} className="alignment-detail__item alignment-detail__item--error">
                    <span className="alignment-detail__item-icon">✗</span>
                    <span className="alignment-detail__item-text">
                      {objectiveTexts.get(objId) ?? objId}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Section: Tujuan Tercover */}
          {alignment.coveredObjectives > 0 && (
            <section className="alignment-detail__section alignment-detail__section--ok">
              <h3 className="alignment-detail__section-title">
                Tujuan Tercover ({alignment.coveredObjectives})
              </h3>
              <ul className="alignment-detail__list" data-testid="alignment-detail-covered">
                {project.curriculum?.objectives
                  ?.filter((obj) => !alignment.uncoveredObjectiveIds.includes(obj.id))
                  .map((obj) => (
                    <li key={obj.id} className="alignment-detail__item alignment-detail__item--ok">
                      <span className="alignment-detail__item-icon">✓</span>
                      <span className="alignment-detail__item-text">{obj.text}</span>
                    </li>
                  ))}
              </ul>
            </section>
          )}

          {/* Section: Masalah Alignment */}
          {alignment.issues.length > 0 && (
            <section className="alignment-detail__section alignment-detail__section--issues">
              <h3 className="alignment-detail__section-title">
                Masalah Alignment ({alignment.issues.length})
              </h3>
              <ul className="alignment-detail__list" data-testid="alignment-detail-issues">
                {alignment.issues.map((issue, idx) => {
                  const page = issue.pageId ? pageLookup.get(issue.pageId) : undefined;
                  const isClickable = !!issue.pageId;
                  return (
                    <li
                      key={idx}
                      className={`alignment-detail__item alignment-detail__item--${issue.severity}${isClickable ? ' is-clickable' : ''}`}
                      onClick={() => handleIssueClick(issue.pageId)}
                      title={isClickable ? `Klik untuk pindah ke halaman "${page?.title}"` : undefined}
                      data-testid={`alignment-detail-issue-${idx}`}
                      data-severity={issue.severity}
                      data-code={issue.code}
                      data-page-id={issue.pageId ?? ''}
                    >
                      <span className="alignment-detail__item-icon">
                        {issue.severity === 'error' ? '✗' : '⚠'}
                      </span>
                      <div className="alignment-detail__item-content">
                        <span className="alignment-detail__item-text">{issue.message}</span>
                        {page && (
                          <span className="alignment-detail__item-meta">
                            Halaman: {page.title} · {getRoleInfo(page.role as PageRole).label}
                          </span>
                        )}
                        <span className="alignment-detail__item-code">{issue.code}</span>
                      </div>
                      {isClickable && (
                        <span className="alignment-detail__item-arrow" aria-hidden>→</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Section: Status per Halaman */}
          {alignment.pages.length > 0 && (
            <section className="alignment-detail__section alignment-detail__section--pages">
              <h3 className="alignment-detail__section-title">
                Status per Halaman ({alignment.pages.length})
              </h3>
              <ul className="alignment-detail__list" data-testid="alignment-detail-pages">
                {alignment.pages.map((pa) => {
                  const level = getPageAlignmentLevel(pa);
                  const page = pageLookup.get(pa.pageId);
                  const isClickable = level !== 'neutral';
                  return (
                    <li
                      key={pa.pageId}
                      className={`alignment-detail__item alignment-detail__item--level-${level}${isClickable ? ' is-clickable' : ''}`}
                      onClick={() => isClickable && handleIssueClick(pa.pageId)}
                      title={isClickable ? `Pindah ke halaman "${pa.pageTitle}"` : undefined}
                      data-testid={`alignment-detail-page-${pa.pageId}`}
                      data-level={level}
                    >
                      <span className="alignment-detail__item-icon">
                        {getPageAlignmentLevelIcon(level)}
                      </span>
                      <div className="alignment-detail__item-content">
                        <span className="alignment-detail__item-text">{pa.pageTitle}</span>
                        <span className="alignment-detail__item-meta">
                          {page ? getRoleInfo(page.role as PageRole).label : pa.pageRole}
                          {' · '}
                          {getPageAlignmentLevelLabel(level)}
                          {pa.addressedObjectiveIds.length > 0 && (
                            <> · {pa.addressedObjectiveIds.length} tujuan</>
                          )}
                          {pa.issues.length > 0 && (
                            <> · {pa.issues.length} masalah</>
                          )}
                        </span>
                      </div>
                      {isClickable && (
                        <span className="alignment-detail__item-arrow" aria-hidden>→</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Empty state */}
          {alignment.issues.length === 0 && alignment.ok && (
            <div className="alignment-detail__all-ok" data-testid="alignment-detail-all-ok">
              <span className="alignment-detail__all-ok-icon">✓</span>
              <span>Semua tujuan pembelajaran tercover dan tidak ada masalah alignment.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="alignment-detail__footer">
          <p className="alignment-detail__hint">
            Klik masalah atau halaman untuk pindah ke halaman terkait. Tutup dengan Esc atau klik di luar.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper: map score → CSS class
// ---------------------------------------------------------------------------

function scoreToClass(score: number): string {
  if (score >= 80) return 'is-excellent';
  if (score >= 60) return 'is-good';
  if (score >= 40) return 'is-fair';
  return 'is-poor';
}

// ---------------------------------------------------------------------------
// Helper: level → CSS class (exported for PagePanel badge use)
// ---------------------------------------------------------------------------

export function alignmentLevelToClass(level: PageAlignmentLevel): string {
  switch (level) {
    case 'aligned': return 'is-aligned';
    case 'partial': return 'is-partial';
    case 'unaligned': return 'is-unaligned';
    case 'empty': return 'is-empty';
    case 'neutral': return 'is-neutral';
  }
}
