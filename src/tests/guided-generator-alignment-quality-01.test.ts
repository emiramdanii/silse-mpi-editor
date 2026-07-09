/**
 * GUIDED-GENERATOR-ALIGNMENT-QUALITY-01 tests.
 *
 * 15 mandatory test guard per senior reviewer spec.
 * Verifies that all guided generator output meets quality gate:
 *   - alignment score >= 80 (PPKn >= 90)
 *   - layout score >= 80
 *   - no critical issues (OBJECTIVE_NOT_COVERED, OBJECTIVE_DUPLICATE_ID, etc.)
 *   - quiz/game/reflection linked to objectives
 *   - not exam-centric
 *   - 10 pages per guided flow
 */

import { describe, expect, it } from 'vitest';
import { MPI_TOPIC_CATALOG, getTopicById } from '../core/guided-flow/mpi-topic-catalog';
import { generateMpiFromTopic } from '../core/guided-flow/generate-mpi-from-topic';
import {
  checkGeneratedTopicQuality,
  checkAllGeneratedTopicQuality,
  checkGeneratedTopicQualityById,
  MIN_ALIGNMENT_SCORE,
  MIN_PPKN_ALIGNMENT_SCORE,
  MIN_LAYOUT_SCORE,
} from './fixtures/generator-quality-report';
import { checkLearningGoalAlignment } from '../core/learning-goal-alignment';
import { validateLayoutQuality } from '../core/design/layout-quality';
import { checkMpiStandard } from '../core/mpi-quality-check';

// =========================================================================
// 1. All topics have curriculum.objectives
// =========================================================================

describe('GUIDED-GENERATOR-ALIGNMENT-QUALITY-01 — objective presence', () => {
  it('1. All topics generated have curriculum.objectives (non-empty)', () => {
    for (const topic of MPI_TOPIC_CATALOG) {
      const { project } = generateMpiFromTopic(topic);
      expect(
        project.curriculum?.objectives,
        `Topic ${topic.id} should have objectives`,
      ).toBeDefined();
      expect(
        project.curriculum!.objectives.length,
        `Topic ${topic.id} should have at least 1 objective`,
      ).toBeGreaterThan(0);
    }
  });
});

// =========================================================================
// 2. All objective IDs unique
// =========================================================================

describe('GUIDED-GENERATOR-ALIGNMENT-QUALITY-01 — unique IDs', () => {
  it('2. All objective IDs unique in every generated topic', () => {
    for (const topic of MPI_TOPIC_CATALOG) {
      const { project } = generateMpiFromTopic(topic);
      const ids = project.curriculum!.objectives.map((o) => o.id);
      const uniqueIds = new Set(ids);
      expect(
        uniqueIds.size,
        `Topic ${topic.id} should have unique objective IDs`,
      ).toBe(ids.length);
    }
  });
});

// =========================================================================
// 3. No OBJECTIVE_TOO_SHORT
// =========================================================================

describe('GUIDED-GENERATOR-ALIGNMENT-QUALITY-01 — objective specificity', () => {
  it('3. No OBJECTIVE_TOO_SHORT in any generated topic', () => {
    for (const topic of MPI_TOPIC_CATALOG) {
      const { project } = generateMpiFromTopic(topic);
      const alignment = checkLearningGoalAlignment(project);
      const tooShort = alignment.issues.filter((i) => i.code === 'OBJECTIVE_TOO_SHORT');
      expect(
        tooShort.length,
        `Topic ${topic.id} should have no OBJECTIVE_TOO_SHORT (got: ${tooShort.map((i) => i.message).join('; ')})`,
      ).toBe(0);
    }
  });
});

// =========================================================================
// 4. No OBJECTIVE_DUPLICATE_ID
// =========================================================================

describe('GUIDED-GENERATOR-ALIGNMENT-QUALITY-01 — duplicate ID guard', () => {
  it('4. No OBJECTIVE_DUPLICATE_ID in any generated topic', () => {
    for (const topic of MPI_TOPIC_CATALOG) {
      const { project } = generateMpiFromTopic(topic);
      const alignment = checkLearningGoalAlignment(project);
      const dup = alignment.issues.filter((i) => i.code === 'OBJECTIVE_DUPLICATE_ID');
      expect(
        dup.length,
        `Topic ${topic.id} should have no OBJECTIVE_DUPLICATE_ID`,
      ).toBe(0);
    }
  });
});

// =========================================================================
// 5. All objectives covered
// =========================================================================

describe('GUIDED-GENERATOR-ALIGNMENT-QUALITY-01 — coverage', () => {
  it('5. All objectives in every generated topic are covered (0 uncovered)', () => {
    for (const topic of MPI_TOPIC_CATALOG) {
      const { project } = generateMpiFromTopic(topic);
      const alignment = checkLearningGoalAlignment(project);
      expect(
        alignment.uncoveredObjectiveIds.length,
        `Topic ${topic.id} should have 0 uncovered objectives (got: ${alignment.uncoveredObjectiveIds.length})`,
      ).toBe(0);
      expect(
        alignment.coveredObjectives,
        `Topic ${topic.id}: all ${alignment.totalObjectives} objectives should be covered`,
      ).toBe(alignment.totalObjectives);
    }
  });
});

// =========================================================================
// 6. Alignment score >= 80 for every topic
// =========================================================================

describe('GUIDED-GENERATOR-ALIGNMENT-QUALITY-01 — alignment threshold', () => {
  it(`6. Alignment score >= ${MIN_ALIGNMENT_SCORE} for every topic`, () => {
    for (const topic of MPI_TOPIC_CATALOG) {
      const { project } = generateMpiFromTopic(topic);
      const alignment = checkLearningGoalAlignment(project);
      expect(
        alignment.score,
        `Topic ${topic.id} alignment score ${alignment.score} < ${MIN_ALIGNMENT_SCORE}`,
      ).toBeGreaterThanOrEqual(MIN_ALIGNMENT_SCORE);
    }
  });
});

// =========================================================================
// 7. PPKn alignment score >= 90
// =========================================================================

describe('GUIDED-GENERATOR-ALIGNMENT-QUALITY-01 — PPKn flagship', () => {
  it(`7. PPKn alignment score >= ${MIN_PPKN_ALIGNMENT_SCORE}`, () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const alignment = checkLearningGoalAlignment(project);
    expect(
      alignment.score,
      `PPKn alignment score ${alignment.score} < ${MIN_PPKN_ALIGNMENT_SCORE}`,
    ).toBeGreaterThanOrEqual(MIN_PPKN_ALIGNMENT_SCORE);
  });
});

// =========================================================================
// 8. Layout score >= 80 for every topic
// =========================================================================

describe('GUIDED-GENERATOR-ALIGNMENT-QUALITY-01 — layout threshold', () => {
  it(`8. Layout score >= ${MIN_LAYOUT_SCORE} for every topic`, () => {
    for (const topic of MPI_TOPIC_CATALOG) {
      const { project } = generateMpiFromTopic(topic);
      const layoutIssues = project.pages.flatMap((p) => validateLayoutQuality(p).issues);
      const errorCount = layoutIssues.filter((i) => i.severity === 'error').length;
      const warningCount = layoutIssues.filter((i) => i.severity === 'warning').length;
      const layoutScore = Math.max(0, 100 - errorCount * 20 - warningCount * 5);
      expect(
        layoutScore,
        `Topic ${topic.id} layout score ${layoutScore} < ${MIN_LAYOUT_SCORE} (errors=${errorCount}, warnings=${warningCount})`,
      ).toBeGreaterThanOrEqual(MIN_LAYOUT_SCORE);
    }
  });
});

// =========================================================================
// 9. No OUT_OF_CANVAS
// =========================================================================

describe('GUIDED-GENERATOR-ALIGNMENT-QUALITY-01 — canvas bounds', () => {
  it('9. No OUT_OF_CANVAS in any generated topic', () => {
    for (const topic of MPI_TOPIC_CATALOG) {
      const { project } = generateMpiFromTopic(topic);
      const layoutIssues = project.pages.flatMap((p) => validateLayoutQuality(p).issues);
      const outOfCanvas = layoutIssues.filter((i) => i.code === 'OUT_OF_CANVAS');
      expect(
        outOfCanvas.length,
        `Topic ${topic.id} should have no OUT_OF_CANVAS`,
      ).toBe(0);
    }
  });
});

// =========================================================================
// 10. No LARGE_OVERLAP
// =========================================================================

describe('GUIDED-GENERATOR-ALIGNMENT-QUALITY-01 — overlap', () => {
  it('10. No LARGE_OVERLAP in any generated topic', () => {
    for (const topic of MPI_TOPIC_CATALOG) {
      const { project } = generateMpiFromTopic(topic);
      const layoutIssues = project.pages.flatMap((p) => validateLayoutQuality(p).issues);
      const largeOverlap = layoutIssues.filter((i) => i.code === 'LARGE_OVERLAP');
      expect(
        largeOverlap.length,
        `Topic ${topic.id} should have no LARGE_OVERLAP`,
      ).toBe(0);
    }
  });
});

// =========================================================================
// 11. Quiz/question linked to objective
// =========================================================================

describe('GUIDED-GENERATOR-ALIGNMENT-QUALITY-01 — quiz linkage', () => {
  it('11. Quiz/question page in every topic addresses at least 1 objective (no ASSESSMENT_NOT_LINKED)', () => {
    for (const topic of MPI_TOPIC_CATALOG) {
      const { project } = generateMpiFromTopic(topic);
      const alignment = checkLearningGoalAlignment(project);
      const quizPage = project.pages.find((p) => p.role === 'quiz');
      expect(quizPage, `Topic ${topic.id} should have a quiz page`).toBeDefined();
      const quizAlignment = alignment.pages.find((pa) => pa.pageId === quizPage!.id);
      expect(quizAlignment, `Topic ${topic.id}: quiz page alignment not found`).toBeDefined();
      expect(
        quizAlignment!.addressedObjectiveIds.length,
        `Topic ${topic.id}: quiz should address >=1 objective`,
      ).toBeGreaterThan(0);
      const quizNotLinked = quizAlignment!.issues.filter((i) => i.code === 'ASSESSMENT_NOT_LINKED');
      expect(
        quizNotLinked.length,
        `Topic ${topic.id}: quiz should not have ASSESSMENT_NOT_LINKED`,
      ).toBe(0);
    }
  });
});

// =========================================================================
// 12. Game/activity linked to objective
// =========================================================================

describe('GUIDED-GENERATOR-ALIGNMENT-QUALITY-01 — game linkage', () => {
  it('12. Game/activity page in every topic addresses at least 1 objective (no ASSESSMENT_NOT_LINKED)', () => {
    for (const topic of MPI_TOPIC_CATALOG) {
      const { project } = generateMpiFromTopic(topic);
      const alignment = checkLearningGoalAlignment(project);
      const gamePage = project.pages.find((p) => p.role === 'activity');
      expect(gamePage, `Topic ${topic.id} should have an activity/game page`).toBeDefined();
      const gameAlignment = alignment.pages.find((pa) => pa.pageId === gamePage!.id);
      expect(gameAlignment, `Topic ${topic.id}: game page alignment not found`).toBeDefined();
      expect(
        gameAlignment!.addressedObjectiveIds.length,
        `Topic ${topic.id}: game should address >=1 objective`,
      ).toBeGreaterThan(0);
      const gameNotLinked = gameAlignment!.issues.filter((i) => i.code === 'ASSESSMENT_NOT_LINKED');
      expect(
        gameNotLinked.length,
        `Topic ${topic.id}: game should not have ASSESSMENT_NOT_LINKED`,
      ).toBe(0);
    }
  });
});

// =========================================================================
// 13. Reflection linked to objective
// =========================================================================

describe('GUIDED-GENERATOR-ALIGNMENT-QUALITY-01 — reflection linkage', () => {
  it('13. Reflection page in every topic addresses at least 1 objective (no REFLECTION_NOT_LINKED)', () => {
    for (const topic of MPI_TOPIC_CATALOG) {
      const { project } = generateMpiFromTopic(topic);
      const alignment = checkLearningGoalAlignment(project);
      const reflectionPage = project.pages.find((p) => p.role === 'reflection');
      expect(reflectionPage, `Topic ${topic.id} should have a reflection page`).toBeDefined();
      const reflectionAlignment = alignment.pages.find((pa) => pa.pageId === reflectionPage!.id);
      expect(reflectionAlignment, `Topic ${topic.id}: reflection page alignment not found`).toBeDefined();
      expect(
        reflectionAlignment!.addressedObjectiveIds.length,
        `Topic ${topic.id}: reflection should address >=1 objective`,
      ).toBeGreaterThan(0);
      const reflectionNotLinked = reflectionAlignment!.issues.filter((i) => i.code === 'REFLECTION_NOT_LINKED');
      expect(
        reflectionNotLinked.length,
        `Topic ${topic.id}: reflection should not have REFLECTION_NOT_LINKED`,
      ).toBe(0);
    }
  });
});

// =========================================================================
// 14. Generated PPKn not exam-centric
// =========================================================================

describe('GUIDED-GENERATOR-ALIGNMENT-QUALITY-01 — not exam-centric', () => {
  it('14. Generated PPKn does not use exam-centric language in MPI warnings', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    // Run checkMpiStandard with a broken project to trigger warnings
    const broken = {
      ...project,
      pages: project.pages.map((p) => ({
        ...p,
        components: p.components.map((c) => {
          if (c.type === 'question') {
            return { ...c, feedbackCorrect: '', feedbackWrong: '' } as typeof c;
          }
          return c;
        }) as typeof p.components,
      })),
    };
    const qc = checkMpiStandard(broken);
    const allWarnings = qc.warnings.join(' ');
    // Should NOT use exam-centric English terms
    expect(allWarnings).not.toMatch(/\bQuestion\b/);
    expect(allWarnings).not.toMatch(/\bfeedback\b/i);
    expect(allWarnings).not.toMatch(/\bGame mission\b/);
    // Should use Indonesian pedagogical terms
    expect(allWarnings).toMatch(/umpan balik|pertanyaan cek pemahaman|misi game/i);
  });

  it('14b. Generated PPKn material page wording is pedagogical (not exam)', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const materialPage = project.pages.find((p) => p.role === 'material')!;
    const allText = materialPage.components
      .map((c) => {
        if (c.type === 'text') return (c as { text: string }).text;
        if (c.type === 'card') return (c as { title?: string; body: string }).title + ' ' + (c as { body: string }).body;
        return '';
      })
      .join(' ');
    // Should NOT use exam-centric phrasing
    expect(allText).not.toMatch(/ujian/i);
    expect(allText).not.toMatch(/\bexam\b/i);
    expect(allText).not.toMatch(/\btest\b/i);
  });
});

// =========================================================================
// 15. Generated project has 10 pages
// =========================================================================

describe('GUIDED-GENERATOR-ALIGNMENT-QUALITY-01 — page count', () => {
  it('15. Every generated project has exactly 10 pages (guided flow)', () => {
    for (const topic of MPI_TOPIC_CATALOG) {
      const { project } = generateMpiFromTopic(topic);
      expect(
        project.pages.length,
        `Topic ${topic.id} should have 10 pages (got ${project.pages.length})`,
      ).toBe(10);
      // Verify the 10 standard roles are present
      const roles = project.pages.map((p) => p.role);
      const expectedRoles = ['cover', 'guide', 'learningObjectives', 'menu', 'starter', 'material', 'quiz', 'activity', 'reflection', 'closing'];
      for (const expected of expectedRoles) {
        expect(
          roles.includes(expected as never),
          `Topic ${topic.id}: missing role ${expected}`,
        ).toBe(true);
      }
    }
  });
});

// =========================================================================
// 16. Helper functions work correctly
// =========================================================================

describe('GUIDED-GENERATOR-ALIGNMENT-QUALITY-01 — helper functions', () => {
  it('checkGeneratedTopicQuality returns complete report for each topic', () => {
    for (const topic of MPI_TOPIC_CATALOG) {
      const report = checkGeneratedTopicQuality(topic);
      expect(report.topicId).toBe(topic.id);
      expect(report.title).toContain(topic.mapel);
      expect(typeof report.alignmentScore).toBe('number');
      expect(typeof report.layoutScore).toBe('number');
      expect(typeof report.mpiOk).toBe('boolean');
      expect(typeof report.pageCount).toBe('number');
      expect(report.pageCount).toBe(10);
      expect(Array.isArray(report.alignmentIssueCodes)).toBe(true);
      expect(Array.isArray(report.layoutIssueCodes)).toBe(true);
      expect(Array.isArray(report.errors)).toBe(true);
      expect(Array.isArray(report.warnings)).toBe(true);
      expect(report.verdict).toBe('PASS');
    }
  });

  it('checkAllGeneratedTopicQuality returns report for all 4 topics', () => {
    const reports = checkAllGeneratedTopicQuality();
    expect(reports.length).toBe(4);
    expect(reports.every((r) => r.verdict === 'PASS')).toBe(true);
  });

  it('checkGeneratedTopicQualityById returns report for valid ID', () => {
    const report = checkGeneratedTopicQualityById('ppkn-7-norma');
    expect(report).toBeDefined();
    expect(report!.topicId).toBe('ppkn-7-norma');
    expect(report!.verdict).toBe('PASS');
  });

  it('checkGeneratedTopicQualityById returns undefined for invalid ID', () => {
    const report = checkGeneratedTopicQualityById('nonexistent-topic');
    expect(report).toBeUndefined();
  });

  it('All topics PASS quality gate (verdict = PASS)', () => {
    const reports = checkAllGeneratedTopicQuality();
    for (const r of reports) {
      expect(
        r.verdict,
        `Topic ${r.topicId} should PASS (alignment=${r.alignmentScore}, layout=${r.layoutScore})`,
      ).toBe('PASS');
    }
  });
});
