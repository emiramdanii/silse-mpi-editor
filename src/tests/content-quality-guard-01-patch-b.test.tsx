/**
 * CONTENT-QUALITY-GUARD-01 PATCH B — Diagnostic required correctChoiceId tests.
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

describe('PATCH B — Diagnostic correctChoiceId Required', () => {
  it('1. diagnostic question without correctChoiceId => error', () => {
    const project = makeProject([
      makePage({ id: 'p1', role: 'cover', sceneType: 'cover-hero', sceneContent: { kind: 'cover-hero', heroTitle: 'Cover' } }),
      makePage({ id: 'p2', role: 'material', sceneType: 'diagnostic-check', sceneContent: { kind: 'diagnostic-check', diagnosticPrompt: 'Diag', questionSet: [{ id: 'q1', prompt: 'Q1', choices: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }] }] } }),
      makePage({ id: 'p3', role: 'closing', sceneType: 'closing-award', sceneContent: { kind: 'closing-award', achievement: 'Done' } }),
    ]);
    const result = checkContentQuality(project);
    expect(result.errors.some((e) => e.field === 'questionSet[0].correctChoiceId' && e.message.includes('kosong atau hilang'))).toBe(true);
  });

  it('2. diagnostic question with empty correctChoiceId => error', () => {
    const project = makeProject([
      makePage({ id: 'p1', role: 'cover', sceneType: 'cover-hero', sceneContent: { kind: 'cover-hero', heroTitle: 'Cover' } }),
      makePage({ id: 'p2', role: 'material', sceneType: 'diagnostic-check', sceneContent: { kind: 'diagnostic-check', diagnosticPrompt: 'Diag', questionSet: [{ id: 'q1', prompt: 'Q1', choices: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correctChoiceId: '' }] } }),
      makePage({ id: 'p3', role: 'closing', sceneType: 'closing-award', sceneContent: { kind: 'closing-award', achievement: 'Done' } }),
    ]);
    const result = checkContentQuality(project);
    expect(result.errors.some((e) => e.field === 'questionSet[0].correctChoiceId' && e.message.includes('kosong atau hilang'))).toBe(true);
  });

  it('3. diagnostic question with valid correctChoiceId => no diagnostic errors', () => {
    const project = makeProject([
      makePage({ id: 'p1', role: 'cover', sceneType: 'cover-hero', sceneContent: { kind: 'cover-hero', heroTitle: 'Cover' } }),
      makePage({ id: 'p2', role: 'material', sceneType: 'diagnostic-check', sceneContent: { kind: 'diagnostic-check', diagnosticPrompt: 'Diag', questionSet: [{ id: 'q1', prompt: 'Q1', choices: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correctChoiceId: 'a' }] } }),
      makePage({ id: 'p3', role: 'closing', sceneType: 'closing-award', sceneContent: { kind: 'closing-award', achievement: 'Done' } }),
    ]);
    const result = checkContentQuality(project);
    const diagErrors = result.errors.filter((e) => e.sceneType === 'diagnostic-check');
    expect(diagErrors).toHaveLength(0);
  });

  it('4. golden reference still no errors', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const project = aiBlueprintToSimpleProject(bp);
    const result = checkContentQuality(project);
    expect(result.errors, result.errors.map((e) => e.message).join('; ')).toHaveLength(0);
  });
});
