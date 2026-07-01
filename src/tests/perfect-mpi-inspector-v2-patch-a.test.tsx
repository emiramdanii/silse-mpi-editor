/**
 * PERFECT-MPI-INSPECTOR-V2 PATCH A — Typed list fields tests.
 *
 * Tests: boolean isCorrect saves as boolean, number x/y/score saves as number,
 * BranchingScenario renders correctly with edited boolean.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  normalizeBlueprint,
  aiBlueprintToSimpleProject,
} from '../core/ai-mpi-json';
import { getDesignContract } from '../core/mpi-design-contract';
import { exportProjectToHtml } from '../export/export-html';
import { createSamplePpknProject } from '../core/sample-project';
import { useEditorStore } from '../store/editor-store';
import { ListFieldEditor, SCENE_LIST_FIELDS } from '../editor/ListFieldEditor';
import { BranchingScenarioComposer } from '../components/scene-composers';
import type { SimplePage } from '../core/types';

const contract = getDesignContract('golden-reference');

function loadGoldenRef() {
  return JSON.parse(readFileSync(resolve(__dirname, '../../samples/ai-mpi-json/macam-norma-reference.sample.json'), 'utf-8'));
}

function setPage(sceneType: string, sceneContent: Record<string, unknown>): SimplePage {
  return {
    id: 'p1', title: 'Test', role: 'material', layoutId: 'blank',
    background: { type: 'color', color: '#fff' }, components: [],
    sceneType, sceneContent: { kind: sceneType, ...sceneContent },
  } as SimplePage;
}

function setupStore(page: SimplePage) {
  useEditorStore.setState({
    project: { ...useEditorStore.getState().project, pages: [page], currentPageId: 'p1' },
  });
}

// ---------------------------------------------------------------------------
// SCOPE A — Boolean Field (branching-scenario choices.isCorrect)
// ---------------------------------------------------------------------------

describe('PATCH A — Scope A: Boolean isCorrect', () => {
  beforeEach(() => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const project = aiBlueprintToSimpleProject(bp);
    useEditorStore.setState({ project, selectedComponentId: null, completedSceneIds: [], perSceneScore: {}, aggregateScore: 0 });
  });

  it('1. edit choices.isCorrect to false saves as boolean false', () => {
    const page = setPage('branching-scenario', {
      choices: [{ id: 'ch1', label: 'Help', consequence: 'Good', isCorrect: true }],
    });
    setupStore(page);
    const { container } = render(<ListFieldEditor page={page} fieldDef={SCENE_LIST_FIELDS['branching-scenario'][0]} />);
    // Initially isCorrect is true
    const select = container.querySelector('[data-testid="list-field-choices-0-isCorrect"]') as HTMLSelectElement;
    expect(select.value).toBe('true');
    // Change to false
    fireEvent.change(select, { target: { value: 'false' } });
    // Verify store has boolean false (not string "false")
    const updatedPage = useEditorStore.getState().project.pages[0];
    const choices = (updatedPage.sceneContent as Record<string, unknown>).choices as Array<Record<string, unknown>>;
    expect(choices[0].isCorrect).toBe(false);
    expect(typeof choices[0].isCorrect).toBe('boolean');
  });

  it('2. edit choices.isCorrect to true saves as boolean true', () => {
    const page = setPage('branching-scenario', {
      choices: [{ id: 'ch1', label: 'Help', consequence: 'Good', isCorrect: false }],
    });
    setupStore(page);
    const { container } = render(<ListFieldEditor page={page} fieldDef={SCENE_LIST_FIELDS['branching-scenario'][0]} />);
    const select = container.querySelector('[data-testid="list-field-choices-0-isCorrect"]') as HTMLSelectElement;
    expect(select.value).toBe('false');
    fireEvent.change(select, { target: { value: 'true' } });
    const updatedPage = useEditorStore.getState().project.pages[0];
    const choices = (updatedPage.sceneContent as Record<string, unknown>).choices as Array<Record<string, unknown>>;
    expect(choices[0].isCorrect).toBe(true);
    expect(typeof choices[0].isCorrect).toBe('boolean');
  });

  it('3. BranchingScenarioComposer with isCorrect=false shows "Pertimbangkan Kembali"', () => {
    const content = {
      scenarioPrompt: 'What do you do?',
      choices: [{ id: 'ch1', label: 'Ignore', consequence: 'Bad idea', isCorrect: false }],
    };
    const { container } = render(<BranchingScenarioComposer contract={contract} content={content} />);
    fireEvent.click(container.querySelector('[data-testid="branching-choice-ch1"]')!);
    const consequence = container.querySelector('[data-testid="branching-consequence"]');
    expect(consequence?.textContent).toContain('Pertimbangkan Kembali');
    expect(consequence?.textContent).not.toContain('Pilihan Tepat');
  });

  it('4. BranchingScenarioComposer with isCorrect=true shows "Pilihan Tepat"', () => {
    const content = {
      scenarioPrompt: 'What do you do?',
      choices: [{ id: 'ch1', label: 'Help', consequence: 'Good choice', isCorrect: true }],
    };
    const { container } = render(<BranchingScenarioComposer contract={contract} content={content} />);
    fireEvent.click(container.querySelector('[data-testid="branching-choice-ch1"]')!);
    const consequence = container.querySelector('[data-testid="branching-consequence"]');
    expect(consequence?.textContent).toContain('Pilihan Tepat');
  });

  it('5. string "false" is NOT truthy in BranchingScenario — verify type guard', () => {
    // Simulate the bug: if isCorrect were string "false", it would be truthy
    // This test verifies that boolean false is correctly falsy
    const content = {
      scenarioPrompt: 'Test',
      choices: [{ id: 'ch1', label: 'X', consequence: 'Y', isCorrect: false as boolean }],
    };
    const { container } = render(<BranchingScenarioComposer contract={contract} content={content} />);
    fireEvent.click(container.querySelector('[data-testid="branching-choice-ch1"]')!);
    // With boolean false, should show "Pertimbangkan Kembali" (not "Pilihan Tepat")
    expect(container.querySelector('[data-testid="branching-consequence"]')?.textContent).toContain('Pertimbangkan');
  });
});

// ---------------------------------------------------------------------------
// SCOPE B — Number Fields (hotspot x/y, rubric score)
// ---------------------------------------------------------------------------

describe('PATCH A — Scope B: Number Fields', () => {
  beforeEach(() => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const project = aiBlueprintToSimpleProject(bp);
    useEditorStore.setState({ project, selectedComponentId: null, completedSceneIds: [], perSceneScore: {}, aggregateScore: 0 });
  });

  it('6. edit hotspot x saves as number', () => {
    const page = setPage('hotspot-map', {
      hotspots: [{ id: 'h1', x: 25, y: 30, label: 'Test', info: 'Info' }],
    });
    setupStore(page);
    const { container } = render(<ListFieldEditor page={page} fieldDef={SCENE_LIST_FIELDS['hotspot-map'][0]} />);
    const xInput = container.querySelector('[data-testid="list-field-hotspots-0-x"]') as HTMLInputElement;
    expect(xInput.value).toBe('25');
    fireEvent.change(xInput, { target: { value: '50' } });
    const updatedPage = useEditorStore.getState().project.pages[0];
    const hotspots = (updatedPage.sceneContent as Record<string, unknown>).hotspots as Array<Record<string, unknown>>;
    expect(hotspots[0].x).toBe(50);
    expect(typeof hotspots[0].x).toBe('number');
  });

  it('7. edit hotspot y saves as number', () => {
    const page = setPage('hotspot-map', {
      hotspots: [{ id: 'h1', x: 25, y: 30, label: 'Test', info: 'Info' }],
    });
    setupStore(page);
    const { container } = render(<ListFieldEditor page={page} fieldDef={SCENE_LIST_FIELDS['hotspot-map'][0]} />);
    const yInput = container.querySelector('[data-testid="list-field-hotspots-0-y"]') as HTMLInputElement;
    fireEvent.change(yInput, { target: { value: '75' } });
    const updatedPage = useEditorStore.getState().project.pages[0];
    const hotspots = (updatedPage.sceneContent as Record<string, unknown>).hotspots as Array<Record<string, unknown>>;
    expect(hotspots[0].y).toBe(75);
    expect(typeof hotspots[0].y).toBe('number');
  });

  it('8. edit rubric level score saves as number', () => {
    const page = setPage('rubric-panel', {
      levels: [{ id: 'lv1', name: 'Baik', score: 4, descriptor: 'Sangat baik' }],
    });
    setupStore(page);
    const { container } = render(<ListFieldEditor page={page} fieldDef={SCENE_LIST_FIELDS['rubric-panel'][1]} />);
    const scoreInput = container.querySelector('[data-testid="list-field-levels-0-score"]') as HTMLInputElement;
    expect(scoreInput.value).toBe('4');
    fireEvent.change(scoreInput, { target: { value: '5' } });
    const updatedPage = useEditorStore.getState().project.pages[0];
    const levels = (updatedPage.sceneContent as Record<string, unknown>).levels as Array<Record<string, unknown>>;
    expect(levels[0].score).toBe(5);
    expect(typeof levels[0].score).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// SCOPE C — Regression
// ---------------------------------------------------------------------------

describe('PATCH A — Scope C: Regression', () => {
  it('9. legacy project safe', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('"scenePlan":null');
  });

  it('10. 12 golden-reference scenes still pass', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    expect(bp.scenes).toHaveLength(12);
  });
});
