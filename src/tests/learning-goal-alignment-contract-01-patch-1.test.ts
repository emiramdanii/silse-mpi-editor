/**
 * LEARNING-GOAL-ALIGNMENT-CONTRACT-01 Patch-1 tests.
 *
 * Hardening contract + checker + test guard.
 * Per senior reviewer principle: contract → checker → test guard → UI/polish.
 *
 * Scope:
 *   - image.alt counts as learning content
 *   - navigation.label does NOT count as learning content
 *   - layered-info multi-layer addresses objectives
 *   - learning-bridge title + message addresses objectives
 *   - multiple assessments on same page all checked
 *   - OBJECTIVE_TOO_SHORT warning fires for objective with no significant words
 *   - score reaches 100 when all objectives covered + no issues
 *   - ok=false when there are warnings (only errors block ok=true... see semantics)
 *   - checkLearningGoalAlignment is deterministic (same input → same output)
 *   - checkLearningGoalAlignment is pure (does not mutate input)
 *   - helper edge cases
 *   - contract docs mention Patch-1 (OBJECTIVE_TOO_SHORT + image.alt + navigation exclusion)
 *   - OBJECTIVE_TOO_SHORT is warning severity (not error, not blocking)
 */

import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import {
  checkLearningGoalAlignment,
  getAlignmentSummaryLabel,
  getAlignmentScoreLabel,
} from '../core/learning-goal-alignment';
import { createProject } from '../core/project-factory';
import { createComponentId, createPageId } from '../core/ids';
import type { SimpleProject, SimplePage, PageComponent } from '../core/types';

const REPO_ROOT = resolve(__dirname, '../..');
const DOCS_DIR = join(REPO_ROOT, 'docs');

// =========================================================================
// Helpers
// =========================================================================

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

/**
 * Patch-2 helper: build a project with explicit objective IDs (so tests can
 * construct duplicate-ID scenarios that buildProjectWithObjectives cannot).
 */
function buildProjectWithObjectiveIds(
  objectives: Array<{ id: string; text: string }>,
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
      objectives,
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

function textComp(text: string): PageComponent {
  return {
    id: createComponentId(),
    type: 'text',
    variant: 'body',
    text,
    x: 80, y: 80, width: 600, height: 120,
  } as never;
}

function imageComp(alt: string): PageComponent {
  return {
    id: createComponentId(),
    type: 'image',
    variant: 'imageCard',
    src: 'data:image/svg+xml;utf8,<svg></svg>',
    alt,
    objectFit: 'cover',
    x: 80, y: 80, width: 400, height: 300,
  } as never;
}

function navComp(label: string): PageComponent {
  return {
    id: createComponentId(),
    type: 'navigation',
    variant: 'navigation',
    label,
    action: 'next',
    x: 80, y: 80, width: 200, height: 50,
  } as never;
}

function questionComp(title: string, prompt: string): PageComponent {
  return {
    id: createComponentId(),
    type: 'question',
    variant: 'multipleChoice',
    title,
    prompt,
    choices: [{ id: 'a', text: 'Opsi' }],
    correctChoiceIndex: 0,
    feedbackCorrect: 'Benar',
    feedbackWrong: 'Salah',
    points: 10,
    scoringStyle: 'points',
    x: 80, y: 80, width: 600, height: 400,
  } as never;
}

function layeredInfoComp(title: string, layers: Array<{ title: string; body: string }>): PageComponent {
  return {
    id: createComponentId(),
    type: 'layered-info',
    variant: 'accordion',
    title,
    layers: layers.map((l) => ({ id: createComponentId(), title: l.title, body: l.body })),
    defaultOpenIndex: 0,
    x: 80, y: 80, width: 600, height: 300,
  } as never;
}

function bridgeComp(title: string, message: string): PageComponent {
  return {
    id: createComponentId(),
    type: 'learning-bridge',
    variant: 'transition',
    title,
    message,
    nextButtonLabel: 'Lanjut',
    x: 80, y: 80, width: 600, height: 200,
  } as never;
}

// =========================================================================
// 1. Image.alt counts as learning content
// =========================================================================

describe('LGA-01 Patch-1 — image.alt extraction', () => {
  it('image.alt text is extracted and can address objectives', () => {
    const objTexts = ['Menjelaskan pengertian norma masyarakat'];
    const materialPage = buildPage('material', [
      imageComp('Gambar ilustrasi pengertian norma masyarakat Indonesia'),
      navComp('Lanjut'),
    ]);
    const project = buildProjectWithObjectives(objTexts, [materialPage]);
    const result = checkLearningGoalAlignment(project);
    expect(result.coveredObjectives).toBe(1);
    expect(result.uncoveredObjectiveIds).toHaveLength(0);
  });

  it('image without alt does NOT address any objective (empty alt = empty text)', () => {
    const objTexts = ['Menjelaskan pengertian norma masyarakat'];
    const materialPage = buildPage('material', [
      imageComp(''),
      navComp('Lanjut'),
    ]);
    const project = buildProjectWithObjectives(objTexts, [materialPage]);
    const result = checkLearningGoalAlignment(project);
    expect(result.coveredObjectives).toBe(0);
    expect(result.issues.some((i) => i.code === 'MATERIAL_NOT_LINKED')).toBe(true);
  });
});

// =========================================================================
// 2. Navigation.label does NOT count as learning content
// =========================================================================

describe('LGA-01 Patch-1 — navigation.label exclusion', () => {
  it('navigation label is NOT extracted even if it contains objective keywords', () => {
    const objTexts = ['Menjelaskan pengertian norma masyarakat'];
    // Navigation label contains objective keywords but should NOT match.
    const materialPage = buildPage('material', [
      navComp('Lanjut menjelaskan pengertian norma masyarakat'),
    ]);
    const project = buildProjectWithObjectives(objTexts, [materialPage]);
    const result = checkLearningGoalAlignment(project);
    expect(result.coveredObjectives).toBe(0);
    expect(result.issues.some((i) => i.code === 'MATERIAL_NOT_LINKED')).toBe(true);
  });
});

// =========================================================================
// 3. Layered-info multi-layer addresses objectives
// =========================================================================

describe('LGA-01 Patch-1 — layered-info multi-layer', () => {
  it('layered-info with objective keywords in any layer addresses objective', () => {
    const objTexts = ['Menjelaskan pengertian norma', 'Mengidentifikasi jenis norma'];
    const objectivesPage = buildPage('learningObjectives', [
      layeredInfoComp('Tujuan Pembelajaran', [
        { title: 'Sebelumnya', body: 'Belum ada.' },
        { title: 'Hari Ini', body: 'Menjelaskan pengertian norma secara lengkap.' },
        { title: 'Berikutnya', body: 'Mengidentifikasi jenis norma di masyarakat.' },
      ]),
    ]);
    const project = buildProjectWithObjectives(objTexts, [objectivesPage]);
    const result = checkLearningGoalAlignment(project);
    expect(result.coveredObjectives).toBe(2);
  });

  it('layered-info with empty body in all layers does NOT address objective', () => {
    const objTexts = ['Menjelaskan pengertian norma'];
    const page = buildPage('material', [
      layeredInfoComp('Info', [
        { title: 'A', body: '' },
        { title: 'B', body: '' },
      ]),
    ]);
    const project = buildProjectWithObjectives(objTexts, [page]);
    const result = checkLearningGoalAlignment(project);
    expect(result.coveredObjectives).toBe(0);
  });
});

// =========================================================================
// 4. Learning-bridge title + message addresses objectives
// =========================================================================

describe('LGA-01 Patch-1 — learning-bridge extraction', () => {
  it('learning-bridge title + message addresses objective', () => {
    const objTexts = ['Menjelaskan pengertian norma masyarakat'];
    const page = buildPage('material', [
      bridgeComp('Jembatan Belajar', 'Sekarang kita akan menjelaskan pengertian norma masyarakat.'),
      navComp('Lanjut'),
    ]);
    const project = buildProjectWithObjectives(objTexts, [page]);
    const result = checkLearningGoalAlignment(project);
    expect(result.coveredObjectives).toBe(1);
  });

  it('learning-bridge with empty message does NOT address objective', () => {
    const objTexts = ['Menjelaskan pengertian norma masyarakat'];
    const page = buildPage('material', [
      bridgeComp('Jembatan', ''),
      navComp('Lanjut'),
    ]);
    const project = buildProjectWithObjectives(objTexts, [page]);
    const result = checkLearningGoalAlignment(project);
    expect(result.coveredObjectives).toBe(0);
  });
});

// =========================================================================
// 5. Multiple assessments on same page all checked
// =========================================================================

describe('LGA-01 Patch-1 — multiple assessments', () => {
  it('multiple questions on same page all checked for ASSESSMENT_NOT_LINKED', () => {
    const objTexts = ['Menjelaskan pengertian norma'];
    const quizPage = buildPage('quiz', [
      questionComp('Soal 1', 'Berapakah 1+1?'),
      questionComp('Soal 2', 'Berapakah 2+2?'),
      questionComp('Soal 3', 'Berapakah 3+3?'),
    ]);
    const project = buildProjectWithObjectives(objTexts, [quizPage]);
    const result = checkLearningGoalAlignment(project);
    // All three questions are unrelated to objective → 3 ASSESSMENT_NOT_LINKED warnings
    const assessmentWarnings = result.issues.filter((i) => i.code === 'ASSESSMENT_NOT_LINKED');
    expect(assessmentWarnings.length).toBe(3);
  });
});

// =========================================================================
// 6. OBJECTIVE_TOO_SHORT warning fires for objective with no significant words
// =========================================================================

describe('LGA-01 Patch-1 — OBJECTIVE_TOO_SHORT', () => {
  it('fires warning when objective has no significant words (all length <= 3)', () => {
    const objTexts = ['IPA KBM']; // all words length <= 3 ("ipa", "kbm")
    const page = buildPage('material', [
      textComp('Materi pembelajaran IPA KBM hari ini.'),
      navComp('Lanjut'),
    ]);
    const project = buildProjectWithObjectives(objTexts, [page]);
    const result = checkLearningGoalAlignment(project);
    expect(result.issues.some((i) => i.code === 'OBJECTIVE_TOO_SHORT')).toBe(true);
  });

  it('does NOT fire warning when objective has at least 1 significant word', () => {
    const objTexts = ['Menjelaskan pengertian norma'];
    const page = buildPage('material', [
      textComp('Norma adalah aturan. Pengertian norma jelas.'),
      navComp('Lanjut'),
    ]);
    const project = buildProjectWithObjectives(objTexts, [page]);
    const result = checkLearningGoalAlignment(project);
    expect(result.issues.some((i) => i.code === 'OBJECTIVE_TOO_SHORT')).toBe(false);
  });

  it('OBJECTIVE_TOO_SHORT is warning severity (not error)', () => {
    const objTexts = ['IPA']; // length 3, not significant
    const page = buildPage('material', [textComp('Materi'), navComp('Lanjut')]);
    const project = buildProjectWithObjectives(objTexts, [page]);
    const result = checkLearningGoalAlignment(project);
    const tooShort = result.issues.find((i) => i.code === 'OBJECTIVE_TOO_SHORT');
    expect(tooShort).toBeDefined();
    expect(tooShort?.severity).toBe('warning');
  });

  it('OBJECTIVE_TOO_SHORT message references the objective text', () => {
    const objTexts = ['IPA KBM'];
    const page = buildPage('material', [textComp('Materi'), navComp('Lanjut')]);
    const project = buildProjectWithObjectives(objTexts, [page]);
    const result = checkLearningGoalAlignment(project);
    const tooShort = result.issues.find((i) => i.code === 'OBJECTIVE_TOO_SHORT');
    expect(tooShort).toBeDefined();
    expect(tooShort?.message).toContain('IPA KBM');
  });
});

// =========================================================================
// 7. Score reaches 100 when all objectives covered + no issues
// =========================================================================

describe('LGA-01 Patch-1 — score ceiling', () => {
  it('score is 100 when all objectives covered + no warnings + no errors', () => {
    const objTexts = ['Menjelaskan pengertian norma', 'Mengidentifikasi jenis norma'];
    const page = buildPage('material', [
      textComp('Norma adalah aturan. Pengertian norma jelas. Jenis norma beragam.'),
      navComp('Lanjut'),
    ]);
    const project = buildProjectWithObjectives(objTexts, [page]);
    const result = checkLearningGoalAlignment(project);
    expect(result.coveredObjectives).toBe(2);
    expect(result.issues).toHaveLength(0);
    expect(result.score).toBe(100);
    expect(result.ok).toBe(true);
  });
});

// =========================================================================
// 8. ok=false when there are uncovered objectives even if no errors
// =========================================================================

describe('LGA-01 Patch-1 — ok semantics', () => {
  it('ok=false when uncoveredObjectiveIds is non-empty (errors block ok)', () => {
    const objTexts = ['Menjelaskan pengertian norma', 'Mengidentifikasi jenis norma', 'Menunjukkan sikap tertib'];
    const page = buildPage('material', [
      textComp('Norma adalah aturan. Pengertian norma. Jenis norma ada banyak.'),
      navComp('Lanjut'),
    ]);
    const project = buildProjectWithObjectives(objTexts, [page]);
    const result = checkLearningGoalAlignment(project);
    expect(result.uncoveredObjectiveIds.length).toBeGreaterThan(0);
    expect(result.ok).toBe(false);
  });

  it('ok=true only when no errors AND no uncovered objectives (warnings do not block ok)', () => {
    const objTexts = ['Menjelaskan pengertian norma'];
    // Material page covers objective; quiz page has unrelated question (warning only)
    const materialPage = buildPage('material', [
      textComp('Pengertian norma jelas.'),
      navComp('Lanjut'),
    ]);
    const quizPage = buildPage('quiz', [
      questionComp('Kuis', 'Berapa 1+1?'),
      navComp('Lanjut'),
    ]);
    const project = buildProjectWithObjectives(objTexts, [materialPage, quizPage]);
    const result = checkLearningGoalAlignment(project);
    // Has ASSESSMENT_NOT_LINKED warning but no errors
    expect(result.issues.some((i) => i.severity === 'warning')).toBe(true);
    expect(result.issues.some((i) => i.severity === 'error')).toBe(false);
    expect(result.uncoveredObjectiveIds).toHaveLength(0);
    expect(result.ok).toBe(true);
  });
});

// =========================================================================
// 9. Determinism — same input produces same output
// =========================================================================

describe('LGA-01 Patch-1 — determinism', () => {
  it('calling checkLearningGoalAlignment twice produces identical results', () => {
    const objTexts = ['Menjelaskan pengertian norma', 'Mengidentifikasi jenis norma'];
    const page = buildPage('material', [
      textComp('Norma adalah aturan. Pengertian norma jelas. Jenis norma beragam.'),
      navComp('Lanjut'),
    ]);
    const project = buildProjectWithObjectives(objTexts, [page]);
    const result1 = checkLearningGoalAlignment(project);
    const result2 = checkLearningGoalAlignment(project);
    expect(result1).toEqual(result2);
  });
});

// =========================================================================
// 10. Pure function — does not mutate input
// =========================================================================

describe('LGA-01 Patch-1 — purity', () => {
  it('checkLearningGoalAlignment does not mutate project input', () => {
    const objTexts = ['Menjelaskan pengertian norma'];
    const page = buildPage('material', [
      textComp('Pengertian norma jelas.'),
      navComp('Lanjut'),
    ]);
    const project = buildProjectWithObjectives(objTexts, [page]);
    const snapshot = JSON.stringify(project);
    checkLearningGoalAlignment(project);
    expect(JSON.stringify(project)).toBe(snapshot);
  });
});

// =========================================================================
// 11. Helper edge cases
// =========================================================================

describe('LGA-01 Patch-1 — helper edge cases', () => {
  it('getAlignmentSummaryLabel handles uncoveredObjectiveIds > totalObjectives gracefully', () => {
    // Edge case: just verify it does not crash
    const label = getAlignmentSummaryLabel({
      totalObjectives: 2,
      uncoveredObjectiveIds: ['a', 'b', 'c'], // more uncovered than total (defensive)
    } as never);
    expect(typeof label).toBe('string');
  });

  it('getAlignmentScoreLabel boundary values (40, 60, 80) pick correct label', () => {
    expect(getAlignmentScoreLabel(40)).toBe('Kurang Selaras');
    expect(getAlignmentScoreLabel(60)).toBe('Cukup Selaras');
    expect(getAlignmentScoreLabel(80)).toBe('Sangat Selaras');
    // Below 40
    expect(getAlignmentScoreLabel(39)).toBe('Belum Selaras');
    // Above 80
    expect(getAlignmentScoreLabel(100)).toBe('Sangat Selaras');
  });
});

// =========================================================================
// 12. Contract docs mention Patch-1 additions
// =========================================================================

describe('LGA-01 Patch-1 — docs hardening', () => {
  it('docs mention OBJECTIVE_TOO_SHORT', () => {
    const content = readFileSync(join(DOCS_DIR, 'LEARNING_GOAL_ALIGNMENT_CONTRACT.md'), 'utf8');
    expect(content).toMatch(/OBJECTIVE_TOO_SHORT/);
  });

  it('docs mention image.alt extraction', () => {
    const content = readFileSync(join(DOCS_DIR, 'LEARNING_GOAL_ALIGNMENT_CONTRACT.md'), 'utf8');
    expect(content).toMatch(/image.*alt/i);
  });

  it('docs mention navigation.label exclusion', () => {
    const content = readFileSync(join(DOCS_DIR, 'LEARNING_GOAL_ALIGNMENT_CONTRACT.md'), 'utf8');
    expect(content).toMatch(/navigation/i);
    expect(content).toMatch(/tidak diekstrak|NOT.*extract/i);
  });

  it('docs mention Patch-1 explicitly', () => {
    const content = readFileSync(join(DOCS_DIR, 'LEARNING_GOAL_ALIGNMENT_CONTRACT.md'), 'utf8');
    expect(content).toMatch(/Patch-1/);
  });
});

// =========================================================================
// 13. Regression — contract file imports only types (no runtime leak)
// =========================================================================

describe('LGA-01 Patch-1 — no runtime leak', () => {
  it('learning-goal-alignment.ts imports only type from ./types', () => {
    const content = readFileSync(
      resolve(__dirname, '../core/learning-goal-alignment.ts'),
      'utf8',
    );
    // Only `import type` from ./types allowed
    expect(content).toMatch(/import type \{[^}]+\} from '\.\/types'/);
    // No React, no DOM, no store imports
    expect(content).not.toMatch(/from 'react'/);
    expect(content).not.toMatch(/from 'react-dom'/);
    expect(content).not.toMatch(/from '\.\.\/store/);
    expect(content).not.toMatch(/from '\.\.\/editor/);
  });

  it('existsSync check: contract source file exists', () => {
    expect(existsSync(resolve(__dirname, '../core/learning-goal-alignment.ts'))).toBe(true);
  });
});

// =========================================================================
// 14. Patch-2 — OBJECTIVE_DUPLICATE_ID guard (6 mandatory tests)
// =========================================================================

describe('LGA-01 Patch-2 — OBJECTIVE_DUPLICATE_ID guard', () => {
  // Test 1: duplicate objective id menghasilkan OBJECTIVE_DUPLICATE_ID
  it('1. Duplicate objective id produces OBJECTIVE_DUPLICATE_ID issue', () => {
    const pages = [buildPage('material', [textComp('Pengertian norma.'), navComp('Lanjut')])];
    const project = buildProjectWithObjectiveIds(
      [
        { id: 'obj-1', text: 'Menjelaskan pengertian norma' },
        { id: 'obj-1', text: 'Mengidentifikasi jenis norma' }, // duplicate id
      ],
      pages,
    );
    const result = checkLearningGoalAlignment(project);
    expect(result.issues.some((i) => i.code === 'OBJECTIVE_DUPLICATE_ID')).toBe(true);
  });

  // Test 2: severity = error
  it('2. OBJECTIVE_DUPLICATE_ID severity is error', () => {
    const pages = [buildPage('material', [textComp('Pengertian norma.'), navComp('Lanjut')])];
    const project = buildProjectWithObjectiveIds(
      [
        { id: 'obj-1', text: 'Menjelaskan pengertian norma' },
        { id: 'obj-1', text: 'Mengidentifikasi jenis norma' },
      ],
      pages,
    );
    const result = checkLearningGoalAlignment(project);
    const dup = result.issues.find((i) => i.code === 'OBJECTIVE_DUPLICATE_ID');
    expect(dup).toBeDefined();
    expect(dup?.severity).toBe('error');
  });

  // Test 3: ok=false when duplicate id present
  it('3. ok=false when duplicate objective id present', () => {
    const pages = [buildPage('material', [textComp('Pengertian norma.'), navComp('Lanjut')])];
    const project = buildProjectWithObjectiveIds(
      [
        { id: 'obj-1', text: 'Menjelaskan pengertian norma' },
        { id: 'obj-1', text: 'Mengidentifikasi jenis norma' },
      ],
      pages,
    );
    const result = checkLearningGoalAlignment(project);
    expect(result.ok).toBe(false);
  });

  // Test 4: score turun dibanding project sehat dengan objective unik
  it('4. Score with duplicate id is lower than equivalent project with unique ids', () => {
    // Unique version: 2 objectives, both covered by material → score should be 100.
    // Dup version: same 2 objective texts but SAME id → Set coverage collapses both
    // into one covered id, AND OBJECTIVE_DUPLICATE_ID error fires → score < 100.
    const pages = [
      buildPage('material', [
        textComp('Pengertian norma jelas. Jenis norma beragam.'),
        navComp('Lanjut'),
      ]),
    ];
    const projectDup = buildProjectWithObjectiveIds(
      [
        { id: 'obj-1', text: 'Menjelaskan pengertian norma' },
        { id: 'obj-1', text: 'Mengidentifikasi jenis norma' },
      ],
      pages,
    );
    const projectUnique = buildProjectWithObjectiveIds(
      [
        { id: 'obj-1', text: 'Menjelaskan pengertian norma' },
        { id: 'obj-2', text: 'Mengidentifikasi jenis norma' },
      ],
      pages,
    );
    const resultDup = checkLearningGoalAlignment(projectDup);
    const resultUnique = checkLearningGoalAlignment(projectUnique);
    // Sanity: unique version reaches max score (no errors, no warnings, all covered)
    expect(resultUnique.score).toBe(100);
    expect(resultUnique.ok).toBe(true);
    // Duplicate version: Set collapses 2 objectives into 1 covered id →
    // coveredObjectives = 1, totalObjectives = 2 (array length), coverage = 35,
    // plus OBJECTIVE_DUPLICATE_ID error → issue = 20, score = 55 < 100.
    expect(resultDup.score).toBeLessThan(resultUnique.score);
    expect(resultDup.ok).toBe(false);
  });

  // Test 5: duplicate id tidak disembunyikan oleh Set coverage
  // Critical: Set would normally dedupe silently. With the guard, the duplicate
  // is still detected AND reported, even when one copy is "covered".
  it('5. Duplicate id is reported even when one copy is covered (Set does not hide it)', () => {
    const pages = [buildPage('material', [textComp('Pengertian norma.'), navComp('Lanjut')])];
    const project = buildProjectWithObjectiveIds(
      [
        { id: 'obj-1', text: 'Menjelaskan pengertian norma' },
        { id: 'obj-1', text: 'Menjelaskan pengertian norma' }, // exact duplicate
      ],
      pages,
    );
    const result = checkLearningGoalAlignment(project);
    // Duplicate IS reported
    const dupIssues = result.issues.filter((i) => i.code === 'OBJECTIVE_DUPLICATE_ID');
    expect(dupIssues.length).toBe(1); // reported once per id, not twice
    // ok still false (error present)
    expect(result.ok).toBe(false);
  });

  // Test 6: objective id unik tidak menghasilkan OBJECTIVE_DUPLICATE_ID issue
  it('6. Unique objective ids do NOT produce OBJECTIVE_DUPLICATE_ID issue', () => {
    const pages = [buildPage('material', [textComp('Pengertian norma. Jenis norma.'), navComp('Lanjut')])];
    const project = buildProjectWithObjectiveIds(
      [
        { id: 'obj-1', text: 'Menjelaskan pengertian norma' },
        { id: 'obj-2', text: 'Mengidentifikasi jenis norma' },
      ],
      pages,
    );
    const result = checkLearningGoalAlignment(project);
    expect(result.issues.some((i) => i.code === 'OBJECTIVE_DUPLICATE_ID')).toBe(false);
  });

  // Bonus: triple duplicate still reported only once (not 2x, not 3x)
  it('7. Triple duplicate (same id 3x) reported exactly once', () => {
    const pages = [buildPage('material', [textComp('Pengertian norma.'), navComp('Lanjut')])];
    const project = buildProjectWithObjectiveIds(
      [
        { id: 'obj-1', text: 'Menjelaskan pengertian norma' },
        { id: 'obj-1', text: 'Mengidentifikasi jenis norma' },
        { id: 'obj-1', text: 'Menunjukkan sikap tertib' },
      ],
      pages,
    );
    const result = checkLearningGoalAlignment(project);
    const dupIssues = result.issues.filter((i) => i.code === 'OBJECTIVE_DUPLICATE_ID');
    expect(dupIssues.length).toBe(1);
  });

  // Bonus: two different duplicate ids → two issues
  it('8. Two different duplicate ids → two OBJECTIVE_DUPLICATE_ID issues', () => {
    const pages = [buildPage('material', [textComp('Pengertian norma.'), navComp('Lanjut')])];
    const project = buildProjectWithObjectiveIds(
      [
        { id: 'obj-1', text: 'Menjelaskan pengertian norma' },
        { id: 'obj-1', text: 'Dup satu' },
        { id: 'obj-2', text: 'Mengidentifikasi jenis norma' },
        { id: 'obj-2', text: 'Dup dua' },
      ],
      pages,
    );
    const result = checkLearningGoalAlignment(project);
    const dupIssues = result.issues.filter((i) => i.code === 'OBJECTIVE_DUPLICATE_ID');
    expect(dupIssues.length).toBe(2);
    expect(dupIssues.some((i) => i.objectiveId === 'obj-1')).toBe(true);
    expect(dupIssues.some((i) => i.objectiveId === 'obj-2')).toBe(true);
  });

  // Bonus: docs mention OBJECTIVE_DUPLICATE_ID
  it('9. docs/LEARNING_GOAL_ALIGNMENT_CONTRACT.md mentions OBJECTIVE_DUPLICATE_ID', () => {
    const content = readFileSync(join(DOCS_DIR, 'LEARNING_GOAL_ALIGNMENT_CONTRACT.md'), 'utf8');
    expect(content).toMatch(/OBJECTIVE_DUPLICATE_ID/);
  });
});
