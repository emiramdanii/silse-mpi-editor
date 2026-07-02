/**
 * CONTENT-QUALITY-GUARD-01 PATCH A — Deep item validation tests.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { normalizeBlueprint, aiBlueprintToSimpleProject } from '../core/ai-mpi-json';
import { checkContentQuality } from '../core/content-quality-guard';
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

function makeProject(pages: SimplePage[]): SimpleProject {
  return { ...createSamplePpknProject(), pages } as SimpleProject;
}

describe('PATCH A — Deep Item Validation', () => {
  it('1. objectiveList with empty string fails', () => {
    const project = makeProject([
      makePage({ id: 'p1', role: 'cover', sceneType: 'cover-hero', sceneContent: { kind: 'cover-hero', heroTitle: 'Cover' } }),
      makePage({ id: 'p2', role: 'learningObjectives', sceneType: 'objectives-path', sceneContent: { kind: 'objectives-path', objectiveList: ['', 'Valid objective'] } }),
      makePage({ id: 'p3', role: 'closing', sceneType: 'closing-award', sceneContent: { kind: 'closing-award', achievement: 'Done' } }),
    ]);
    const result = checkContentQuality(project);
    expect(result.errors.some((e) => e.field === 'objectiveList[0]')).toBe(true);
  });

  it('2. quiz choice with empty text fails', () => {
    const project = makeProject([
      makePage({ id: 'p1', role: 'cover', sceneType: 'cover-hero', sceneContent: { kind: 'cover-hero', heroTitle: 'Cover' } }),
      makePage({ id: 'p2', role: 'quiz', sceneType: 'quiz-challenge', sceneContent: { kind: 'quiz-question', prompt: 'Q', choices: [{ id: 'c1', text: '' }, { id: 'c2', text: 'B' }], correctChoiceId: 'c1' } }),
      makePage({ id: 'p3', role: 'closing', sceneType: 'closing-award', sceneContent: { kind: 'closing-award', achievement: 'Done' } }),
    ]);
    const result = checkContentQuality(project);
    expect(result.errors.some((e) => e.field === 'choices[0].text')).toBe(true);
  });

  it('3. diagnostic correctChoiceId invalid fails', () => {
    const project = makeProject([
      makePage({ id: 'p1', role: 'cover', sceneType: 'cover-hero', sceneContent: { kind: 'cover-hero', heroTitle: 'Cover' } }),
      makePage({ id: 'p2', role: 'material', sceneType: 'diagnostic-check', sceneContent: { kind: 'diagnostic-check', diagnosticPrompt: 'Diag', questionSet: [{ id: 'q1', prompt: 'Q1', choices: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correctChoiceId: 'WRONG' }] } }),
      makePage({ id: 'p3', role: 'closing', sceneType: 'closing-award', sceneContent: { kind: 'closing-award', achievement: 'Done' } }),
    ]);
    const result = checkContentQuality(project);
    expect(result.errors.some((e) => e.message.includes('correctChoiceId') && e.message.includes('WRONG'))).toBe(true);
  });

  it('4. classification correctCategory not in categories fails', () => {
    const project = makeProject([
      makePage({ id: 'p1', role: 'cover', sceneType: 'cover-hero', sceneContent: { kind: 'cover-hero', heroTitle: 'Cover' } }),
      makePage({ id: 'p2', role: 'activity', sceneType: 'classification-game', sceneContent: { kind: 'classification-game', instruction: 'Sort', items: [{ id: 'i1', label: 'A', correctCategory: 'Missing' }], categories: ['Agama', 'Hukum'] } }),
      makePage({ id: 'p3', role: 'closing', sceneType: 'closing-award', sceneContent: { kind: 'closing-award', achievement: 'Done' } }),
    ]);
    const result = checkContentQuality(project);
    expect(result.errors.some((e) => e.message.includes('tidak ada di categories'))).toBe(true);
  });

  it('5. hotspot x outside 0-100 fails', () => {
    const project = makeProject([
      makePage({ id: 'p1', role: 'cover', sceneType: 'cover-hero', sceneContent: { kind: 'cover-hero', heroTitle: 'Cover' } }),
      makePage({ id: 'p2', role: 'material', sceneType: 'hotspot-map', sceneContent: { kind: 'hotspot-map', guidingQuestion: 'Q', hotspots: [{ id: 'h1', x: 150, y: 50, label: 'L', info: 'I' }] } }),
      makePage({ id: 'p3', role: 'closing', sceneType: 'closing-award', sceneContent: { kind: 'closing-award', achievement: 'Done' } }),
    ]);
    const result = checkContentQuality(project);
    expect(result.errors.some((e) => e.field === 'hotspots[0].x')).toBe(true);
  });

  it('6. branching without isCorrect=true gives warning', () => {
    const project = makeProject([
      makePage({ id: 'p1', role: 'cover', sceneType: 'cover-hero', sceneContent: { kind: 'cover-hero', heroTitle: 'Cover' } }),
      makePage({ id: 'p2', role: 'material', sceneType: 'branching-scenario', sceneContent: { kind: 'branching-scenario', scenarioPrompt: 'P', choices: [{ id: 'c1', label: 'A', consequence: 'C', isCorrect: false }] } }),
      makePage({ id: 'p3', role: 'closing', sceneType: 'closing-award', sceneContent: { kind: 'closing-award', achievement: 'Done' } }),
    ]);
    const result = checkContentQuality(project);
    expect(result.warnings.some((w) => w.message.includes('isCorrect=true'))).toBe(true);
  });

  it('7. glossary term empty fails', () => {
    const project = makeProject([
      makePage({ id: 'p1', role: 'cover', sceneType: 'cover-hero', sceneContent: { kind: 'cover-hero', heroTitle: 'Cover' } }),
      makePage({ id: 'p2', role: 'material', sceneType: 'glossary-cards', sceneContent: { kind: 'glossary-cards', title: 'G', terms: [{ id: 't1', term: '', definition: 'Def' }] } }),
      makePage({ id: 'p3', role: 'closing', sceneType: 'closing-award', sceneContent: { kind: 'closing-award', achievement: 'Done' } }),
    ]);
    const result = checkContentQuality(project);
    expect(result.errors.some((e) => e.field === 'terms[0].term')).toBe(true);
  });

  it('8. sequencing correctOrder length mismatch gives warning', () => {
    const project = makeProject([
      makePage({ id: 'p1', role: 'cover', sceneType: 'cover-hero', sceneContent: { kind: 'cover-hero', heroTitle: 'Cover' } }),
      makePage({ id: 'p2', role: 'activity', sceneType: 'sequencing-game', sceneContent: { kind: 'sequencing-game', instruction: 'S', items: [{ id: 's1', label: 'A' }, { id: 's2', label: 'B' }], correctOrder: ['s1'] } }),
      makePage({ id: 'p3', role: 'closing', sceneType: 'closing-award', sceneContent: { kind: 'closing-award', achievement: 'Done' } }),
    ]);
    const result = checkContentQuality(project);
    expect(result.warnings.some((w) => w.message.includes('panjang'))).toBe(true);
  });

  it('9. matching duplicate pair fails', () => {
    const project = makeProject([
      makePage({ id: 'p1', role: 'cover', sceneType: 'cover-hero', sceneContent: { kind: 'cover-hero', heroTitle: 'Cover' } }),
      makePage({ id: 'p2', role: 'activity', sceneType: 'matching-game', sceneContent: { kind: 'matching-game', instruction: 'M', leftItems: [{ id: 'l1', label: 'A' }], rightItems: [{ id: 'r1', label: 'B' }], correctPairs: [{ leftId: 'l1', rightId: 'r1' }, { leftId: 'l1', rightId: 'r1' }] } }),
      makePage({ id: 'p3', role: 'closing', sceneType: 'closing-award', sceneContent: { kind: 'closing-award', achievement: 'Done' } }),
    ]);
    const result = checkContentQuality(project);
    expect(result.errors.some((e) => e.message.includes('duplikat'))).toBe(true);
  });

  it('10. golden reference still no errors after deep validation', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const project = aiBlueprintToSimpleProject(bp);
    const result = checkContentQuality(project);
    expect(result.errors, result.errors.map((e) => e.message).join('; ')).toHaveLength(0);
  });
});
