/**
 * LEARNING-GOAL-ALIGNMENT-CONTRACT-01 tests.
 */

import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import {
  checkLearningGoalAlignment,
  getAlignmentSummaryLabel,
  getAlignmentScoreLabel,
} from '../core/learning-goal-alignment';
import { createSamplePpknProject } from '../core/sample-project';
import { createProject } from '../core/project-factory';
import { createComponentId } from '../core/ids';
import type { SimpleProject, SimplePage, PageComponent } from '../core/types';
import { createPageId } from '../core/ids';

const REPO_ROOT = resolve(__dirname, '../..');
const DOCS_DIR = join(REPO_ROOT, 'docs');

function buildProjectWithObjectives(
  objectives: string[],
  pages: SimplePage[],
): SimpleProject {
  const project = createProject();
  return {
    ...project,
    curriculum: {
      subject: 'Test',
      grade: '7',
      phase: 'D',
      topic: 'Test Topic',
      objectives: objectives.map((text) => ({ id: createComponentId(), text })),
    },
    pages,
    currentPageId: pages[0]?.id ?? project.currentPageId,
  };
}

function buildPage(
  role: SimplePage['role'],
  components: PageComponent[],
  title = 'Test',
): SimplePage {
  return {
    id: createPageId(),
    title,
    role,
    layoutId: 'blank',
    background: { type: 'color', color: '#fff' },
    components,
  };
}

// =========================================================================
// 1. No objectives → error
// =========================================================================

describe('LGA-01 — No objectives', () => {
  it('returns error when project has no curriculum', () => {
    const project = createProject();
    const result = checkLearningGoalAlignment(project);
    expect(result.ok).toBe(false);
    expect(result.score).toBe(0);
    expect(result.issues.some((i) => i.code === 'NO_OBJECTIVES')).toBe(true);
  });

  it('returns error when curriculum has no objectives', () => {
    const project = createProject();
    project.curriculum = {
      subject: 'Test',
      grade: '7',
      phase: 'D',
      topic: 'Test',
      objectives: [],
    };
    const result = checkLearningGoalAlignment(project);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === 'NO_OBJECTIVES')).toBe(true);
  });
});

// =========================================================================
// 2. Objectives covered by material → ok
// =========================================================================

describe('LGA-01 — Covered objectives', () => {
  it('returns ok when all objectives are covered by material', () => {
    const objTexts = ['Menjelaskan pengertian norma', 'Mengidentifikasi jenis-jenis norma'];
    const materialPage = buildPage('material', [
      { id: createComponentId(), type: 'text', variant: 'body', text: 'Norma adalah aturan. Pengertian norma adalah ketentuan. Jenis-jenis norma ada empat macam.', x: 80, y: 80, width: 600, height: 120 } as never,
    ]);
    const project = buildProjectWithObjectives(objTexts, [materialPage]);
    const result = checkLearningGoalAlignment(project);
    expect(result.coveredObjectives).toBe(2);
    expect(result.uncoveredObjectiveIds).toHaveLength(0);
  });
});

// =========================================================================
// 3. Uncovered objectives → error
// =========================================================================

describe('LGA-01 — Uncovered objectives', () => {
  it('detects objectives not covered by any page', () => {
    const objTexts = ['Menjelaskan pengertian norma', 'Mengidentifikasi jenis norma', 'Menunjukkan sikap tertib'];
    const materialPage = buildPage('material', [
      { id: createComponentId(), type: 'text', variant: 'body', text: 'Norma adalah aturan. Jenis norma ada banyak.', x: 80, y: 80, width: 600, height: 120 } as never,
    ]);
    const project = buildProjectWithObjectives(objTexts, [materialPage]);
    const result = checkLearningGoalAlignment(project);
    expect(result.uncoveredObjectiveIds.length).toBeGreaterThan(0);
    expect(result.issues.some((i) => i.code === 'OBJECTIVE_NOT_COVERED')).toBe(true);
    expect(result.ok).toBe(false);
  });
});

// =========================================================================
// 4. Assessment not linked → warning
// =========================================================================

describe('LGA-01 — Assessment not linked', () => {
  it('warns when question does not address any objective', () => {
    const objTexts = ['Menjelaskan pengertian norma'];
    const quizPage = buildPage('quiz', [
      { id: createComponentId(), type: 'question', variant: 'multipleChoice', title: 'Kuis', prompt: 'Berapakah 1+1?', choices: [{ id: 'a', text: '2' }, { id: 'b', text: '3' }], correctChoiceIndex: 0, feedbackCorrect: 'Benar', feedbackWrong: 'Salah', points: 10, scoringStyle: 'points', x: 80, y: 80, width: 600, height: 400 } as never,
    ]);
    const project = buildProjectWithObjectives(objTexts, [quizPage]);
    const result = checkLearningGoalAlignment(project);
    expect(result.issues.some((i) => i.code === 'ASSESSMENT_NOT_LINKED')).toBe(true);
  });
});

// =========================================================================
// 5. Material not linked → warning
// =========================================================================

describe('LGA-01 — Material not linked', () => {
  it('warns when material page does not address any objective', () => {
    const objTexts = ['Menjelaskan pengertian norma'];
    const materialPage = buildPage('material', [
      { id: createComponentId(), type: 'text', variant: 'body', text: 'Hari ini kita belajar tentang cuaca.', x: 80, y: 80, width: 600, height: 120 } as never,
    ]);
    const project = buildProjectWithObjectives(objTexts, [materialPage]);
    const result = checkLearningGoalAlignment(project);
    expect(result.issues.some((i) => i.code === 'MATERIAL_NOT_LINKED')).toBe(true);
  });
});

// =========================================================================
// 6. Reflection not linked → warning
// =========================================================================

describe('LGA-01 — Reflection not linked', () => {
  it('warns when reflection page does not reference any objective', () => {
    const objTexts = ['Menjelaskan pengertian norma'];
    const reflectionPage = buildPage('reflection', [
      { id: createComponentId(), type: 'card', variant: 'importantNote', title: 'Refleksi', body: 'Apa yang kamu lakukan hari ini?', x: 80, y: 80, width: 600, height: 200 } as never,
    ]);
    const project = buildProjectWithObjectives(objTexts, [reflectionPage]);
    const result = checkLearningGoalAlignment(project);
    expect(result.issues.some((i) => i.code === 'REFLECTION_NOT_LINKED')).toBe(true);
  });
});

// =========================================================================
// 7. Sample PPKn passes alignment check
// =========================================================================

describe('LGA-01 — Sample PPKn', () => {
  it('sample PPKn project passes alignment check', () => {
    const project = createSamplePpknProject();
    const result = checkLearningGoalAlignment(project);
    expect(result.totalObjectives).toBe(3);
    expect(result.coveredObjectives).toBeGreaterThan(0);
  });

  it('sample PPKn alignment score > 0', () => {
    const project = createSamplePpknProject();
    const result = checkLearningGoalAlignment(project);
    expect(result.score).toBeGreaterThan(0);
  });
});

// =========================================================================
// 8. Score calculation
// =========================================================================

describe('LGA-01 — Score', () => {
  it('score is 0 when no objectives', () => {
    const project = createProject();
    const result = checkLearningGoalAlignment(project);
    expect(result.score).toBe(0);
  });

  it('score increases when objectives are covered', () => {
    const objTexts = ['Menjelaskan pengertian norma', 'Mengidentifikasi jenis norma'];
    const materialPage = buildPage('material', [
      { id: createComponentId(), type: 'text', variant: 'body', text: 'Norma adalah aturan. Jenis norma beragam.', x: 80, y: 80, width: 600, height: 120 } as never,
    ]);
    const project = buildProjectWithObjectives(objTexts, [materialPage]);
    const result = checkLearningGoalAlignment(project);
    expect(result.score).toBeGreaterThan(50);
  });
});

// =========================================================================
// 9. Helper functions
// =========================================================================

describe('LGA-01 — Helpers', () => {
  it('getAlignmentSummaryLabel returns correct label', () => {
    expect(getAlignmentSummaryLabel({ totalObjectives: 0, uncoveredObjectiveIds: [] } as never)).toBe('Belum ada tujuan');
    expect(getAlignmentSummaryLabel({ totalObjectives: 3, uncoveredObjectiveIds: [] } as never)).toBe('Semua tujuan tercover');
    expect(getAlignmentSummaryLabel({ totalObjectives: 3, uncoveredObjectiveIds: ['a'] } as never)).toBe('2/3 tujuan tercover');
  });

  it('getAlignmentScoreLabel returns correct label', () => {
    expect(getAlignmentScoreLabel(90)).toBe('Sangat Selaras');
    expect(getAlignmentScoreLabel(70)).toBe('Cukup Selaras');
    expect(getAlignmentScoreLabel(50)).toBe('Kurang Selaras');
    expect(getAlignmentScoreLabel(20)).toBe('Belum Selaras');
  });
});

// =========================================================================
// 10. Docs
// =========================================================================

describe('LGA-01 — Docs', () => {
  it('docs/LEARNING_GOAL_ALIGNMENT_CONTRACT.md exists', () => {
    expect(existsSync(join(DOCS_DIR, 'LEARNING_GOAL_ALIGNMENT_CONTRACT.md'))).toBe(true);
  });

  it('docs mentions key concepts', () => {
    const content = readFileSync(join(DOCS_DIR, 'LEARNING_GOAL_ALIGNMENT_CONTRACT.md'), 'utf8');
    expect(content).toMatch(/tujuan pembelajaran/i);
    expect(content).toMatch(/alignment/i);
    expect(content).toMatch(/objective/i);
  });
});
