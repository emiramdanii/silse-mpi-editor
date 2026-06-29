/**
 * Export Ready Summary (EXPORT-READY-SUMMARY-01).
 *
 * Layer: core (pure function, no React/DOM)
 * Allowed imports: ./export-quality-gate, ./teacher-friendly-issue-copy
 *
 * Kontrak (EXPORT-READY-SUMMARY-01):
 *   Pure helper yang merangkum ExportQualityReport menjadi ringkasan
 *   siap export yang mudah dipahami guru.
 *
 *   Output: ExportReadySummary dengan:
 *     - status: ready / needs-review / serious
 *     - title + message (ramah guru)
 *     - 5 kategori: struktur, tujuan, layout, keterbacaan, interaksi
 *     - topSuggestions (maksimal 3, dari friendly copy)
 *
 *   Prinsip:
 *     - Guru tidak membaca log teknis.
 *     - Guru membaca status kelayakan media.
 *     - Raw code tidak jadi teks utama.
 *
 *   Tidak mengubah checker logic. Tidak mengubah export engine.
 */

import type { ExportQualityReport, ExportQualityIssue } from './export-quality-gate';
import { getTeacherFriendlyIssueCopy } from './teacher-friendly-issue-copy';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ExportReadyCategoryStatus = 'ready' | 'warning' | 'serious';

export type ExportReadyCategoryKey =
  | 'structure'
  | 'objectives'
  | 'layout'
  | 'readability'
  | 'interaction';

export type ExportReadyCategory = {
  key: ExportReadyCategoryKey;
  label: string;
  status: ExportReadyCategoryStatus;
  message: string;
  issueCount: number;
};

export type ExportReadySummaryStatus = 'ready' | 'needs-review' | 'serious';

export type ExportReadySummary = {
  status: ExportReadySummaryStatus;
  title: string;
  message: string;
  totalIssues: number;
  fatalCount: number;
  warningCount: number;
  categories: ExportReadyCategory[];
  topSuggestions: string[];
};

// ---------------------------------------------------------------------------
// Category copy (by status)
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<ExportReadyCategoryKey, string> = {
  structure: 'Struktur MPI',
  objectives: 'Tujuan Pembelajaran',
  layout: 'Layout',
  readability: 'Keterbacaan',
  interaction: 'Interaksi',
};

const CATEGORY_COPY: Record<
  ExportReadyCategoryKey,
  Record<ExportReadyCategoryStatus, string>
> = {
  structure: {
    ready: 'Struktur halaman utama sudah lengkap.',
    warning: 'Ada bagian struktur MPI yang perlu dilengkapi.',
    serious: 'Ada struktur penting yang belum lengkap.',
  },
  objectives: {
    ready: 'Tujuan pembelajaran sudah terhubung dengan isi media.',
    warning: 'Ada bagian yang belum jelas hubungannya dengan tujuan.',
    serious: 'Ada tujuan pembelajaran yang belum tercover atau data tujuan bermasalah.',
  },
  layout: {
    ready: 'Layout aman untuk layar 16:9.',
    warning: 'Ada elemen yang perlu dirapikan.',
    serious: 'Ada elemen keluar layar atau saling menumpuk serius.',
  },
  readability: {
    ready: 'Teks utama terbaca dengan baik.',
    warning: 'Ada teks yang kontrasnya perlu diperiksa.',
    serious: 'Keterbacaan bermasalah serius.',
  },
  interaction: {
    ready: 'Interaksi dan umpan balik sudah cukup.',
    warning: 'Ada interaksi, navigasi, atau umpan balik yang perlu dilengkapi.',
    serious: 'Ada interaksi penting yang belum siap.',
  },
};

// ---------------------------------------------------------------------------
// Main title/message (by status)
// ---------------------------------------------------------------------------

const SUMMARY_TITLE: Record<ExportReadySummaryStatus, string> = {
  ready: 'Media siap export',
  'needs-review': 'Media bisa export, tetapi ada catatan',
  serious: 'Media perlu dicek sebelum export',
};

const SUMMARY_MESSAGE: Record<ExportReadySummaryStatus, string> = {
  ready: 'Tujuan, layout, keterbacaan, dan interaksi sudah aman.',
  'needs-review': 'Ada beberapa catatan kualitas. Guru tetap bisa export setelah meninjau.',
  serious: 'Ada masalah serius yang sebaiknya diperbaiki agar HTML tidak rusak atau menyesatkan.',
};

// ---------------------------------------------------------------------------
// Helper: classify issue into category
// ---------------------------------------------------------------------------

/**
 * Determine which category an issue belongs to.
 * - source 'mpi-standard' → split between 'structure' and 'interaction' based on message pattern
 * - source 'alignment' → 'objectives'
 * - source 'layout' → 'layout'
 * - source 'visual' → 'readability'
 */
function classifyIssueCategory(issue: ExportQualityIssue): ExportReadyCategoryKey {
  if (issue.source === 'alignment') return 'objectives';
  if (issue.source === 'layout') return 'layout';
  if (issue.source === 'visual') return 'readability';

  // mpi-standard: split between structure and interaction.
  // Interaction = feedback, navigation, quiz, game, activity, reflection prompts.
  // Structure = missing pages (cover, guide, objectives, menu, material, closing, etc.)
  const msg = issue.message.toLowerCase();
  const interactionPatterns = [
    /umpan balik|feedback/,
    /navigasi|tombol.*lanjut/,
    /kuis|cek pemahaman|pertanyaan/,
    /game|aktivitas|misi/,
    /refleksi/,
    /pemantik/,
  ];
  if (interactionPatterns.some((p) => p.test(msg))) {
    return 'interaction';
  }
  return 'structure';
}

// ---------------------------------------------------------------------------
// Helper: determine category status from issues
// ---------------------------------------------------------------------------

function categoryStatusFromIssues(
  issues: ExportQualityIssue[],
): ExportReadyCategoryStatus {
  if (issues.length === 0) return 'ready';
  if (issues.some((i) => i.level === 'fatal')) return 'serious';
  return 'warning';
}

// ---------------------------------------------------------------------------
// Main: buildExportReadySummary
// ---------------------------------------------------------------------------

/**
 * Build a teacher-friendly export ready summary from an ExportQualityReport.
 * Pure function — does not mutate input, does not call UI.
 */
export function buildExportReadySummary(
  report: ExportQualityReport,
): ExportReadySummary {
  const fatalCount = report.fatalIssues.length;
  const warningCount = report.warningIssues.length;
  const totalIssues = report.issues.length;

  // Determine overall status.
  let status: ExportReadySummaryStatus;
  if (fatalCount > 0) {
    status = 'serious';
  } else if (warningCount > 0) {
    status = 'needs-review';
  } else {
    status = 'ready';
  }

  // Build categories.
  const categoryKeys: ExportReadyCategoryKey[] = [
    'structure',
    'objectives',
    'layout',
    'readability',
    'interaction',
  ];

  const categories: ExportReadyCategory[] = categoryKeys.map((key) => {
    const issuesForCategory = report.issues.filter(
      (i) => classifyIssueCategory(i) === key,
    );
    const catStatus = categoryStatusFromIssues(issuesForCategory);
    return {
      key,
      label: CATEGORY_LABELS[key],
      status: catStatus,
      message: CATEGORY_COPY[key][catStatus],
      issueCount: issuesForCategory.length,
    };
  });

  // Build top suggestions (max 3, fatal priority, no duplicate).
  const topSuggestions = buildTopSuggestions(report);

  return {
    status,
    title: SUMMARY_TITLE[status],
    message: SUMMARY_MESSAGE[status],
    totalIssues,
    fatalCount,
    warningCount,
    categories,
    topSuggestions,
  };
}

// ---------------------------------------------------------------------------
// Helper: build top suggestions
// ---------------------------------------------------------------------------

function buildTopSuggestions(report: ExportQualityReport): string[] {
  const suggestions: string[] = [];
  const seen = new Set<string>();

  // Prioritize fatal issues first.
  const prioritized = [...report.fatalIssues, ...report.warningIssues];

  for (const issue of prioritized) {
    if (suggestions.length >= 3) break;
    const copy = getTeacherFriendlyIssueCopy(issue);
    if (!seen.has(copy.suggestion)) {
      seen.add(copy.suggestion);
      suggestions.push(copy.suggestion);
    }
  }

  return suggestions;
}

// ---------------------------------------------------------------------------
// Helper: format summary as text (for tooltip/title)
// ---------------------------------------------------------------------------

/**
 * Format the export ready summary as a multi-line text for tooltip/title.
 * Returns a human-readable string with title, category breakdown, and suggestions.
 */
export function formatExportReadySummaryText(summary: ExportReadySummary): string {
  const lines: string[] = [];

  lines.push(summary.title);
  lines.push(summary.message);
  lines.push('');

  // Category breakdown (only non-ready categories, or all if not ready).
  const nonReadyCategories = summary.categories.filter((c) => c.status !== 'ready');
  if (nonReadyCategories.length > 0) {
    for (const cat of nonReadyCategories) {
      const icon = cat.status === 'serious' ? '✗' : '⚠';
      lines.push(`${icon} ${cat.label}: ${cat.message}`);
    }
  } else {
    lines.push('✓ Semua kategori aman.');
  }

  // Top suggestions.
  if (summary.topSuggestions.length > 0) {
    lines.push('');
    lines.push('Saran:');
    summary.topSuggestions.forEach((s, idx) => {
      lines.push(`${idx + 1}. ${s}`);
    });
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Helper: chip label for UI (short)
// ---------------------------------------------------------------------------

/**
 * Get a short chip label for the summary (for compact UI display).
 * ready → "✅ Siap export"
 * needs-review → "⚠ N catatan"
 * serious → "✗ Perlu dicek"
 */
export function getExportReadyChipLabel(summary: ExportReadySummary): string {
  switch (summary.status) {
    case 'ready':
      return '✅ Siap export';
    case 'needs-review':
      return `⚠ ${summary.totalIssues} catatan`;
    case 'serious':
      return '✗ Perlu dicek';
  }
}
