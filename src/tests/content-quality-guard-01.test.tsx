/**
 * CONTENT-QUALITY-GUARD-01 — Tests.
 *
 * Tests content quality: completeness, pedagogical flow, scene-specific validation.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { normalizeBlueprint, aiBlueprintToSimpleProject } from '../core/ai-mpi-json';
import { checkContentQuality, checkBlueprintContentQuality } from '../core/content-quality-guard';
import { createSamplePpknProject } from '../core/sample-project';
import type { SimpleProject, SimplePage } from '../core/types';

function loadGoldenRef() {
  return JSON.parse(readFileSync(resolve(__dirname, '../../samples/ai-mpi-json/macam-norma-reference.sample.json'), 'utf-8'));
}

function makePage(overrides: Partial<SimplePage> & { id: string }): SimplePage {
  return {
    title: 'Test', role: 'material', layoutId: 'blank',
    background: { type: 'color', color: '#fff' }, components: [],
    ...overrides,
  } as SimplePage;
}

// ---------------------------------------------------------------------------
// SCOPE A — Content Completeness
// ---------------------------------------------------------------------------

describe('CONTENT-QUALITY-GUARD-01 — Scope A: Content Completeness', () => {
  it('1. golden reference 12 scenes pass content quality check', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const project = aiBlueprintToSimpleProject(bp);
    const result = checkContentQuality(project);
    expect(result.errors, result.errors.map((e) => e.message).join('; ')).toHaveLength(0);
  });

  it('2. empty project fails', () => {
    const project: SimpleProject = {
      id: 'p1', title: 'Empty', version: 1 as any, pages: [], currentPageId: '',
    } as any;
    const result = checkContentQuality(project);
    expect(result.pass).toBe(false);
    expect(result.errors.some((e) => e.message.includes('tidak memiliki halaman'))).toBe(true);
  });

  it('3. cover-hero without heroTitle fails', () => {
    const project: SimpleProject = {
      ...createSamplePpknProject(),
      pages: [makePage({ id: 'p1', role: 'cover', sceneType: 'cover-hero', sceneContent: { kind: 'cover-hero' } })],
    } as any;
    const result = checkContentQuality(project);
    expect(result.errors.some((e) => e.field === 'heroTitle')).toBe(true);
  });

  it('4. quiz-challenge without choices fails', () => {
    const project: SimpleProject = {
      ...createSamplePpknProject(),
      pages: [makePage({ id: 'p1', role: 'quiz', sceneType: 'quiz-challenge', sceneContent: { kind: 'quiz-question', prompt: 'Test' } })],
    } as any;
    const result = checkContentQuality(project);
    expect(result.errors.some((e) => e.field === 'choices')).toBe(true);
  });

  it('5. classification-game without items fails', () => {
    const project: SimpleProject = {
      ...createSamplePpknProject(),
      pages: [makePage({ id: 'p1', role: 'activity', sceneType: 'classification-game', sceneContent: { kind: 'classification-game', instruction: 'Test' } })],
    } as any;
    const result = checkContentQuality(project);
    expect(result.errors.some((e) => e.field === 'items')).toBe(true);
    expect(result.errors.some((e) => e.field === 'categories')).toBe(true);
  });

  it('6. matching-game with all required fields passes', () => {
    const project: SimpleProject = {
      ...createSamplePpknProject(),
      pages: [
        makePage({ id: 'p1', role: 'cover', sceneType: 'cover-hero', sceneContent: { kind: 'cover-hero', heroTitle: 'Cover' } }),
        makePage({ id: 'p2', role: 'activity', sceneType: 'matching-game', sceneContent: { kind: 'matching-game', instruction: 'Match', leftItems: [{ id: 'l1', label: 'A' }], rightItems: [{ id: 'r1', label: 'B' }], correctPairs: [{ leftId: 'l1', rightId: 'r1' }] } }),
        makePage({ id: 'p3', role: 'closing', sceneType: 'closing-award', sceneContent: { kind: 'closing-award', achievement: 'Done' } }),
      ],
    } as any;
    const result = checkContentQuality(project);
    expect(result.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// SCOPE B — Pedagogical Flow
// ---------------------------------------------------------------------------

describe('CONTENT-QUALITY-GUARD-01 — Scope B: Pedagogical Flow', () => {
  it('7. first scene must be cover', () => {
    const project: SimpleProject = {
      ...createSamplePpknProject(),
      pages: [
        makePage({ id: 'p1', role: 'material', sceneType: 'learning-scene', sceneContent: { kind: 'learning-material', conceptTitle: 'T', explanation: 'E' } }),
        makePage({ id: 'p2', role: 'closing', sceneType: 'closing-award', sceneContent: { kind: 'closing-award', achievement: 'Done' } }),
      ],
    } as any;
    const result = checkContentQuality(project);
    expect(result.errors.some((e) => e.message.includes('pertama harus cover'))).toBe(true);
  });

  it('8. last scene must be closing', () => {
    const project: SimpleProject = {
      ...createSamplePpknProject(),
      pages: [
        makePage({ id: 'p1', role: 'cover', sceneType: 'cover-hero', sceneContent: { kind: 'cover-hero', heroTitle: 'Cover' } }),
        makePage({ id: 'p2', role: 'material', sceneType: 'learning-scene', sceneContent: { kind: 'learning-material', conceptTitle: 'T', explanation: 'E' } }),
      ],
    } as any;
    const result = checkContentQuality(project);
    expect(result.errors.some((e) => e.message.includes('terakhir harus closing'))).toBe(true);
  });

  it('9. no material page gives warning', () => {
    const project: SimpleProject = {
      ...createSamplePpknProject(),
      pages: [
        makePage({ id: 'p1', role: 'cover', sceneType: 'cover-hero', sceneContent: { kind: 'cover-hero', heroTitle: 'Cover' } }),
        makePage({ id: 'p2', role: 'closing', sceneType: 'closing-award', sceneContent: { kind: 'closing-award', achievement: 'Done' } }),
      ],
    } as any;
    const result = checkContentQuality(project);
    expect(result.warnings.some((w) => w.message.includes('materi'))).toBe(true);
  });

  it('10. no activity/quiz gives warning', () => {
    const project: SimpleProject = {
      ...createSamplePpknProject(),
      pages: [
        makePage({ id: 'p1', role: 'cover', sceneType: 'cover-hero', sceneContent: { kind: 'cover-hero', heroTitle: 'Cover' } }),
        makePage({ id: 'p2', role: 'material', sceneType: 'learning-scene', sceneContent: { kind: 'learning-material', conceptTitle: 'T', explanation: 'E' } }),
        makePage({ id: 'p3', role: 'closing', sceneType: 'closing-award', sceneContent: { kind: 'closing-award', achievement: 'Done' } }),
      ],
    } as any;
    const result = checkContentQuality(project);
    expect(result.warnings.some((w) => w.message.includes('aktivitas atau kuis'))).toBe(true);
  });

  it('11. no reflection gives warning', () => {
    const project: SimpleProject = {
      ...createSamplePpknProject(),
      pages: [
        makePage({ id: 'p1', role: 'cover', sceneType: 'cover-hero', sceneContent: { kind: 'cover-hero', heroTitle: 'Cover' } }),
        makePage({ id: 'p2', role: 'material', sceneType: 'learning-scene', sceneContent: { kind: 'learning-material', conceptTitle: 'T', explanation: 'E' } }),
        makePage({ id: 'p3', role: 'quiz', sceneType: 'quiz-challenge', sceneContent: { kind: 'quiz-question', prompt: 'Q', choices: [{ id: 'c1', text: 'A' }, { id: 'c2', text: 'B' }], correctChoiceId: 'c1' } }),
        makePage({ id: 'p4', role: 'closing', sceneType: 'closing-award', sceneContent: { kind: 'closing-award', achievement: 'Done' } }),
      ],
    } as any;
    const result = checkContentQuality(project);
    expect(result.warnings.some((w) => w.message.includes('refleksi'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// SCOPE C — Scene-Specific Validation
// ---------------------------------------------------------------------------

describe('CONTENT-QUALITY-GUARD-01 — Scope C: Scene-Specific', () => {
  it('12. quiz with invalid correctChoiceId fails', () => {
    const project: SimpleProject = {
      ...createSamplePpknProject(),
      pages: [
        makePage({ id: 'p1', role: 'cover', sceneType: 'cover-hero', sceneContent: { kind: 'cover-hero', heroTitle: 'Cover' } }),
        makePage({ id: 'p2', role: 'quiz', sceneType: 'quiz-challenge', sceneContent: { kind: 'quiz-question', prompt: 'Q', choices: [{ id: 'c1', text: 'A' }, { id: 'c2', text: 'B' }], correctChoiceId: 'WRONG' } }),
        makePage({ id: 'p3', role: 'closing', sceneType: 'closing-award', sceneContent: { kind: 'closing-award', achievement: 'Done' } }),
      ],
    } as any;
    const result = checkContentQuality(project);
    expect(result.errors.some((e) => e.message.includes('tidak ada di choices'))).toBe(true);
  });

  it('13. matching with invalid pair leftId fails', () => {
    const project: SimpleProject = {
      ...createSamplePpknProject(),
      pages: [
        makePage({ id: 'p1', role: 'cover', sceneType: 'cover-hero', sceneContent: { kind: 'cover-hero', heroTitle: 'Cover' } }),
        makePage({ id: 'p2', role: 'activity', sceneType: 'matching-game', sceneContent: { kind: 'matching-game', instruction: 'M', leftItems: [{ id: 'l1', label: 'A' }], rightItems: [{ id: 'r1', label: 'B' }], correctPairs: [{ leftId: 'WRONG', rightId: 'r1' }] } }),
        makePage({ id: 'p3', role: 'closing', sceneType: 'closing-award', sceneContent: { kind: 'closing-award', achievement: 'Done' } }),
      ],
    } as any;
    const result = checkContentQuality(project);
    expect(result.errors.some((e) => e.message.includes('tidak ada di leftItems'))).toBe(true);
  });

  it('14. sequencing with invalid order ID fails', () => {
    const project: SimpleProject = {
      ...createSamplePpknProject(),
      pages: [
        makePage({ id: 'p1', role: 'cover', sceneType: 'cover-hero', sceneContent: { kind: 'cover-hero', heroTitle: 'Cover' } }),
        makePage({ id: 'p2', role: 'activity', sceneType: 'sequencing-game', sceneContent: { kind: 'sequencing-game', instruction: 'S', items: [{ id: 's1', label: 'A' }], correctOrder: ['WRONG'] } }),
        makePage({ id: 'p3', role: 'closing', sceneType: 'closing-award', sceneContent: { kind: 'closing-award', achievement: 'Done' } }),
      ],
    } as any;
    const result = checkContentQuality(project);
    expect(result.errors.some((e) => e.message.includes('tidak ada di items'))).toBe(true);
  });

  it('15. legacy pages (no sceneType) pass without scene-specific errors', () => {
    const project = createSamplePpknProject();
    const result = checkContentQuality(project);
    // Legacy pages don't have sceneType, so scene-specific checks skip them.
    expect(result.errors.filter((e) => e.field !== 'flow')).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// SCOPE D — Blueprint Quality Check
// ---------------------------------------------------------------------------

describe('CONTENT-QUALITY-GUARD-01 — Scope D: Blueprint Quality', () => {
  it('16. golden reference blueprint passes quality check', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const result = checkBlueprintContentQuality(bp);
    expect(result.errors, result.errors.map((e) => e.message).join('; ')).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// SCOPE E — Regression
// ---------------------------------------------------------------------------

describe('CONTENT-QUALITY-GUARD-01 — Scope E: Regression', () => {
  it('17. 12 golden reference scenes still valid', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    expect(bp.scenes).toHaveLength(12);
  });

  it('18. legacy project safe', () => {
    const project = createSamplePpknProject();
    // Should not crash
    expect(() => checkContentQuality(project)).not.toThrow();
  });
});
