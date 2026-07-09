/**
 * Generator Quality Report Helper (GUIDED-GENERATOR-ALIGNMENT-QUALITY-01).
 *
 * Layer: core/guided-flow (pure function, no React/DOM)
 * Allowed imports: ./mpi-topic-catalog, ./generate-mpi-from-topic,
 *                  ../learning-goal-alignment, ../design/layout-quality,
 *                  ../mpi-quality-check, ../types
 *
 * Kontrak (GUIDED-GENERATOR-ALIGNMENT-QUALITY-01 Scope F):
 *   Pure helper yang mengukur kualitas output guided generator untuk satu
 *   topic atau semua topic. Dipakai test guard + report.
 *
 *   Tidak menyimpan state, tidak menulis ke store, tidak memanggil UI.
 */

import { getTopicById, MPI_TOPIC_CATALOG, type MpiTopic } from '../../core/guided-flow/mpi-topic-catalog';
import { generateMpiFromTopic } from '../../core/guided-flow/generate-mpi-from-topic';
import { checkLearningGoalAlignment } from '../../core/learning-goal-alignment';
import { validateLayoutQuality } from '../../core/design/layout-quality';
import { checkMpiStandard } from '../../core/mpi-quality-check';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GeneratedTopicQualityReport = {
  topicId: string;
  title: string;
  /** Alignment score 0-100. Higher is better. */
  alignmentScore: number;
  /** Layout score 0-100 (aggregated across all pages). Higher is better. */
  layoutScore: number;
  /** MPI standard pass/fail. */
  mpiOk: boolean;
  /** Total objectives in curriculum. */
  totalObjectives: number;
  /** Objectives covered by at least one page. */
  coveredObjectives: number;
  /** Number of uncovered objectives. */
  uncoveredObjectives: number;
  /** True if all objectives have unique IDs. */
  hasUniqueObjectiveIds: boolean;
  /** True if no objective is too short (OBJECTIVE_TOO_SHORT). */
  hasNoShortObjectives: boolean;
  /** Alignment issue codes (e.g. OBJECTIVE_NOT_COVERED, OBJECTIVE_DUPLICATE_ID). */
  alignmentIssueCodes: string[];
  /** Layout issue codes aggregated across all pages. */
  layoutIssueCodes: string[];
  /** MPI standard errors. */
  errors: string[];
  /** MPI standard warnings. */
  warnings: string[];
  /** Number of pages in generated project. */
  pageCount: number;
  /** Verdict: PASS if all quality gates met, FAIL otherwise. */
  verdict: 'PASS' | 'FAIL';
};

// ---------------------------------------------------------------------------
// Constants — Quality Gate Thresholds
// ---------------------------------------------------------------------------

/** Minimum alignment score for a topic to PASS. */
export const MIN_ALIGNMENT_SCORE = 80;
/** Minimum alignment score for PPKn topic (stricter, flagship sample). */
export const MIN_PPKN_ALIGNMENT_SCORE = 90;
/** Minimum layout score for a topic to PASS. */
export const MIN_LAYOUT_SCORE = 80;
/** Critical issue codes that cause FAIL regardless of score. */
export const CRITICAL_ISSUE_CODES = new Set<string>([
  'OBJECTIVE_NOT_COVERED',
  'OBJECTIVE_DUPLICATE_ID',
  'NO_OBJECTIVES',
  'LARGE_OVERLAP',
  'OUT_OF_CANVAS',
]);

// ---------------------------------------------------------------------------
// Helper: check unique objective IDs
// ---------------------------------------------------------------------------

function hasUniqueObjectiveIds(objectives: Array<{ id: string }>): boolean {
  const seen = new Set<string>();
  for (const obj of objectives) {
    if (seen.has(obj.id)) return false;
    seen.add(obj.id);
  }
  return true;
}

// ---------------------------------------------------------------------------
// Main: checkGeneratedTopicQuality
// ---------------------------------------------------------------------------

/**
 * Generate project from topic and measure quality.
 * Pure function — does not modify anything.
 */
export function checkGeneratedTopicQuality(topic: MpiTopic): GeneratedTopicQualityReport {
  const { project } = generateMpiFromTopic(topic);
  const alignment = checkLearningGoalAlignment(project);
  const mpi = checkMpiStandard(project);

  // Aggregate layout issues across all pages
  const layoutIssues = project.pages.flatMap((p) =>
    validateLayoutQuality(p).issues,
  );
  const layoutErrorCount = layoutIssues.filter((i) => i.severity === 'error').length;
  const layoutWarningCount = layoutIssues.filter((i) => i.severity === 'warning').length;
  const layoutScore = Math.max(0, 100 - layoutErrorCount * 20 - layoutWarningCount * 5);

  const alignmentIssueCodes = alignment.issues.map((i) => i.code);
  const layoutIssueCodes = layoutIssues.map((i) => i.code);

  // Check unique objective IDs
  const uniqueIds = hasUniqueObjectiveIds(project.curriculum?.objectives ?? []);

  // Check no OBJECTIVE_TOO_SHORT
  const hasNoShortObjectives = !alignmentIssueCodes.includes('OBJECTIVE_TOO_SHORT');

  // Determine verdict
  const isPpkn = topic.id === 'ppkn-7-norma';
  const minAlignment = isPpkn ? MIN_PPKN_ALIGNMENT_SCORE : MIN_ALIGNMENT_SCORE;
  const hasCriticalIssue =
    alignmentIssueCodes.some((c) => CRITICAL_ISSUE_CODES.has(c)) ||
    layoutIssueCodes.some((c) => CRITICAL_ISSUE_CODES.has(c));
  const verdict: 'PASS' | 'FAIL' =
    alignment.score >= minAlignment &&
    layoutScore >= MIN_LAYOUT_SCORE &&
    !hasCriticalIssue &&
    uniqueIds &&
    hasNoShortObjectives &&
    mpi.pass
      ? 'PASS'
      : 'FAIL';

  return {
    topicId: topic.id,
    title: `${topic.mapel} — ${topic.topic}`,
    alignmentScore: alignment.score,
    layoutScore,
    mpiOk: mpi.pass,
    totalObjectives: alignment.totalObjectives,
    coveredObjectives: alignment.coveredObjectives,
    uncoveredObjectives: alignment.uncoveredObjectiveIds.length,
    hasUniqueObjectiveIds: uniqueIds,
    hasNoShortObjectives,
    alignmentIssueCodes,
    layoutIssueCodes,
    errors: mpi.errors,
    warnings: mpi.warnings,
    pageCount: project.pages.length,
    verdict,
  };
}

// ---------------------------------------------------------------------------
// Helper: check all topics
// ---------------------------------------------------------------------------

/**
 * Check quality for all topics in the catalog.
 */
export function checkAllGeneratedTopicQuality(): GeneratedTopicQualityReport[] {
  return MPI_TOPIC_CATALOG.map((topic) => checkGeneratedTopicQuality(topic));
}

// ---------------------------------------------------------------------------
// Helper: check by topic ID
// ---------------------------------------------------------------------------

/**
 * Check quality for a topic by ID.
 * Returns undefined if topic ID not found.
 */
export function checkGeneratedTopicQualityById(topicId: string): GeneratedTopicQualityReport | undefined {
  const topic = getTopicById(topicId);
  if (!topic) return undefined;
  return checkGeneratedTopicQuality(topic);
}
