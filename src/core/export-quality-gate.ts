/**
 * Export Quality Gate (EXPORT-QUALITY-GATE-01).
 *
 * Layer: core (pure function, no React/DOM)
 * Allowed imports: ./types, ./mpi-quality-check, ./design/layout-quality,
 *                  ./design/contrast, ./style/resolveComponentStyle,
 *                  ./learning-goal-alignment
 *
 * Kontrak (EXPORT-QUALITY-GATE-01):
 *   Pure helper yang mengagregasi semua quality check sebelum export.
 *   Dipanggil Topbar.handleExport() sebelum exportProjectToHtml().
 *
 *   Prinsip: WARNING/CONFIRM dulu, bukan blokir brutal semua kasus.
 *   - Fatal issues (layout error, OBJECTIVE_NOT_COVERED, OBJECTIVE_DUPLICATE_ID,
 *     NO_OBJECTIVES, large overlap, out of canvas) → STRONG warning, confirm dulu.
 *   - Warnings (missing feedback, missing nav, low contrast) → soft warning,
 *     tapi guru tetap bisa export.
 *   - Healthy project → no warning, langsung export.
 *
 *   Tidak mengubah export engine. Tidak menambah schema.
 *
 *   Catatan: checkPageVisualReadability ada di editor/mpi-page-status.ts,
 *   tapi core tidak boleh import dari editor. Jadi kita re-implement di sini
 *   pakai getResolvedComponentStyle + getContrastRatio (keduanya di core).
 *   Implementasi ini identik dengan yang di editor.
 */

import type { SimpleProject } from './types';
import { checkMpiStandard, type QualityCheckResult } from './mpi-quality-check';
import { validateLayoutQuality, type LayoutQualityResult } from './design/layout-quality';
import { getContrastRatio } from './design/contrast';
import { getResolvedComponentStyle } from './style/resolveComponentStyle';
import {
  checkLearningGoalAlignment,
  type ProjectAlignment,
} from './learning-goal-alignment';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ExportQualityLevel = 'ok' | 'warning' | 'fatal';

export type ExportQualityIssue = {
  /** Severity level. */
  level: ExportQualityLevel;
  /** Source checker that produced this issue. */
  source: 'mpi-standard' | 'layout' | 'alignment' | 'visual';
  /** Human-readable message (Indonesian, ramah guru). */
  message: string;
  /** Optional page title for context. */
  pageTitle?: string;
  /** Original issue code (for debugging, not shown as primary text). */
  code?: string;
};

export type ExportQualityReport = {
  /** Aggregate level: 'ok' = no issues, 'warning' = soft issues, 'fatal' = critical issues. */
  level: ExportQualityLevel;
  /** True if no fatal issues (safe to export, maybe with warning). */
  canExport: boolean;
  /** True if no issues at all (export tanpa confirm). */
  isClean: boolean;
  /** All issues aggregated. */
  issues: ExportQualityIssue[];
  /** Fatal issues only. */
  fatalIssues: ExportQualityIssue[];
  /** Warning issues only. */
  warningIssues: ExportQualityIssue[];
  /** Original MPI standard check result. */
  mpiStandard: QualityCheckResult;
  /** Aggregated layout quality (across all pages). */
  layoutScore: number;
  /** Alignment check result. */
  alignment: ProjectAlignment;
  /** Number of pages checked. */
  pageCount: number;
};

// ---------------------------------------------------------------------------
// Constants — what counts as FATAL
// ---------------------------------------------------------------------------

/**
 * Issue codes that are considered FATAL (must confirm before export).
 * These mean the exported HTML will be broken or misleading.
 */
const FATAL_LAYOUT_CODES = new Set<string>([
  'OUT_OF_CANVAS',
  'LARGE_OVERLAP',
]);

const FATAL_ALIGNMENT_CODES = new Set<string>([
  'OBJECTIVE_NOT_COVERED',
  'OBJECTIVE_DUPLICATE_ID',
  'NO_OBJECTIVES',
]);

// ---------------------------------------------------------------------------
// Helper: check visual readability per page (cover/closing contrast)
// ---------------------------------------------------------------------------

/**
 * Check visual readability for cover/closing pages using contrast check.
 * Mirrors checkPageVisualReadability in editor/mpi-page-status.ts,
 * but lives in core to respect layer boundaries.
 */
function checkVisualReadabilityForExport(
  project: SimpleProject,
): ExportQualityIssue[] {
  const issues: ExportQualityIssue[] = [];

  for (const page of project.pages) {
    if (page.background.type !== 'color') continue;
    if (page.role !== 'cover' && page.role !== 'closing') continue;

    const bg = page.background.color;
    const textComps = page.components.filter((c) => c.type === 'text');
    let warnedThisPage = false;

    for (const tc of textComps) {
      if (warnedThisPage) break;

      const resolved = getResolvedComponentStyle(project, page, tc);
      const textColor = (resolved.inlineStyle.color as string) || '#000000';
      const ratio = getContrastRatio(textColor, bg);
      const variant = (tc as { variant?: string }).variant ?? '';

      if (['title', 'body', 'questionPrompt', 'instruction'].includes(variant)) {
        if (ratio < 4.5) {
          issues.push({
            level: 'warning',
            source: 'visual',
            message: `[${page.title}] Teks ${variant} kontras rendah (${ratio.toFixed(1)}:1, minimum 4.5:1).`,
            pageTitle: page.title,
          });
          warnedThisPage = true;
        }
      }

      if (variant === 'subtitle' && ratio < 3.0) {
        issues.push({
          level: 'warning',
          source: 'visual',
          message: `[${page.title}] Teks subtitle kontras rendah (${ratio.toFixed(1)}:1, minimum 3.0:1).`,
          pageTitle: page.title,
        });
        warnedThisPage = true;
      }
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Main: checkExportQuality
// ---------------------------------------------------------------------------

/**
 * Aggregate all quality checks for a project before export.
 * Pure function — does not modify anything, does not call UI.
 */
export function checkExportQuality(project: SimpleProject): ExportQualityReport {
  // 1. MPI standard check
  const mpiStandard = checkMpiStandard(project);

  // 2. Layout quality (aggregate across all pages)
  const layoutIssues: ExportQualityIssue[] = [];
  let layoutErrorCount = 0;
  let layoutWarningCount = 0;
  for (const page of project.pages) {
    const pageLayout: LayoutQualityResult = validateLayoutQuality(page);
    for (const issue of pageLayout.issues) {
      const isFatal = FATAL_LAYOUT_CODES.has(issue.code);
      if (issue.severity === 'error' || isFatal) {
        layoutErrorCount++;
        layoutIssues.push({
          level: 'fatal',
          source: 'layout',
          message: `[${page.title}] ${issue.message}`,
          pageTitle: page.title,
          code: issue.code,
        });
      } else {
        layoutWarningCount++;
        layoutIssues.push({
          level: 'warning',
          source: 'layout',
          message: `[${page.title}] ${issue.message}`,
          pageTitle: page.title,
          code: issue.code,
        });
      }
    }
  }
  const layoutScore = Math.max(0, 100 - layoutErrorCount * 20 - layoutWarningCount * 5);

  // 3. Alignment check
  const alignment = checkLearningGoalAlignment(project);
  const alignmentIssues: ExportQualityIssue[] = alignment.issues.map((issue) => {
    const isFatal = FATAL_ALIGNMENT_CODES.has(issue.code);
    const pageTitle = issue.pageId
      ? project.pages.find((p) => p.id === issue.pageId)?.title
      : undefined;
    return {
      level: isFatal || issue.severity === 'error' ? 'fatal' : 'warning',
      source: 'alignment',
      message: issue.message,
      pageTitle,
      code: issue.code,
    };
  });

  // 4. MPI standard issues → map to export issues
  const mpiIssues: ExportQualityIssue[] = [];
  for (const error of mpiStandard.errors) {
    mpiIssues.push({
      level: 'fatal',
      source: 'mpi-standard',
      message: error,
    });
  }
  for (const warning of mpiStandard.warnings) {
    mpiIssues.push({
      level: 'warning',
      source: 'mpi-standard',
      message: warning,
    });
  }

  // 5. Visual readability (cover/closing contrast)
  const visualIssues = checkVisualReadabilityForExport(project);

  // Aggregate all issues
  const allIssues: ExportQualityIssue[] = [
    ...mpiIssues,
    ...layoutIssues,
    ...alignmentIssues,
    ...visualIssues,
  ];

  const fatalIssues = allIssues.filter((i) => i.level === 'fatal');
  const warningIssues = allIssues.filter((i) => i.level === 'warning');

  // Determine aggregate level
  let level: ExportQualityLevel;
  if (fatalIssues.length > 0) {
    level = 'fatal';
  } else if (warningIssues.length > 0) {
    level = 'warning';
  } else {
    level = 'ok';
  }

  return {
    level,
    canExport: true, // We never hard-block; guru can always confirm through
    isClean: allIssues.length === 0,
    issues: allIssues,
    fatalIssues,
    warningIssues,
    mpiStandard,
    layoutScore,
    alignment,
    pageCount: project.pages.length,
  };
}

// ---------------------------------------------------------------------------
// Helper: format report for confirm dialog
// ---------------------------------------------------------------------------

/**
 * Format the export quality report into a human-readable message for confirm dialog.
 * Returns empty string if report is clean.
 */
export function formatExportQualityMessage(report: ExportQualityReport): string {
  if (report.isClean) return '';

  const lines: string[] = [];

  if (report.fatalIssues.length > 0) {
    lines.push('Masalah Serius (sebaiknya perbaiki dulu):');
    for (const issue of report.fatalIssues.slice(0, 10)) {
      lines.push(`  ✗ ${issue.message}`);
    }
    if (report.fatalIssues.length > 10) {
      lines.push(`  ...dan ${report.fatalIssues.length - 10} masalah serius lainnya`);
    }
    lines.push('');
  }

  if (report.warningIssues.length > 0) {
    lines.push('Catatan (bisa dilewati):');
    for (const issue of report.warningIssues.slice(0, 8)) {
      lines.push(`  ⚠ ${issue.message}`);
    }
    if (report.warningIssues.length > 8) {
      lines.push(`  ...dan ${report.warningIssues.length - 8} catatan lainnya`);
    }
    lines.push('');
  }

  lines.push(`Skor Layout: ${report.layoutScore}/100`);
  if (report.alignment.totalObjectives > 0) {
    lines.push(
      `Alignment: ${report.alignment.coveredObjectives}/${report.alignment.totalObjectives} tujuan tercover (skor ${report.alignment.score}/100)`,
    );
  } else {
    lines.push('Alignment: Belum ada tujuan pembelajaran');
  }

  lines.push('');
  lines.push(
    report.fatalIssues.length > 0
      ? 'Project memiliki masalah serius. Export mungkin menghasilkan HTML yang rusak atau menyesatkan. Tetap export?'
      : 'Project memiliki beberapa catatan kualitas. Tetap export?',
  );

  return lines.join('\n');
}
