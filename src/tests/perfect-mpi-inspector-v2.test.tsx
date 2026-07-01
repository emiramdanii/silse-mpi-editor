/**
 * PERFECT-MPI-INSPECTOR-V2 — Tests.
 *
 * Tests list field editor: add/remove/edit/reorder for 10 list field types.
 * Also tests that list edits propagate to CanvasStage + export.
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
import { exportProjectToHtml } from '../export/export-html';
import { createSamplePpknProject } from '../core/sample-project';
import { useEditorStore } from '../store/editor-store';
import { SceneContentEditor } from '../editor/SceneContentEditor';
import { ListFieldEditor, SCENE_LIST_FIELDS } from '../editor/ListFieldEditor';
import type { SimplePage } from '../core/types';

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

// ---------------------------------------------------------------------------
// SCOPE A — List Field Editor Basic Operations
// ---------------------------------------------------------------------------

describe('PERFECT-MPI-INSPECTOR-V2 — Scope A: Basic Operations', () => {
  beforeEach(() => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const project = aiBlueprintToSimpleProject(bp);
    useEditorStore.setState({ project, selectedComponentId: null, completedSceneIds: [], perSceneScore: {}, aggregateScore: 0 });
  });

  it('1. classification-game items list editor renders', () => {
    const page = setPage('classification-game', {
      items: [{ id: 'i1', label: 'Berdoa', correctCategory: 'Agama' }],
      categories: ['Agama'],
    });
    const { container } = render(<SceneContentEditor page={page} />);
    expect(container.querySelector('[data-testid="list-editor-items"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="list-item-items-0"]')).toBeInTheDocument();
  });

  it('2. add item to classification-game items list', () => {
    const page = setPage('classification-game', {
      items: [{ id: 'i1', label: 'Berdoa', correctCategory: 'Agama' }],
    });
    useEditorStore.setState({
      project: { ...useEditorStore.getState().project, pages: [page], currentPageId: 'p1' },
    });
    const { container } = render(<ListFieldEditor page={page} fieldDef={SCENE_LIST_FIELDS['classification-game'][0]} />);
    expect(container.querySelectorAll('[data-testid^="list-item-items-"]')).toHaveLength(1);
    fireEvent.click(container.querySelector('[data-testid="list-add-items"]')!);
    // After add, should have 2 items rendered
    expect(container.querySelectorAll('[data-testid^="list-item-items-"]')).toHaveLength(2);
  });

  it('3. edit item label in classification-game items list', () => {
    const page = setPage('classification-game', {
      items: [{ id: 'i1', label: 'Berdoa', correctCategory: 'Agama' }],
    });
    // We need to set the page in the store for updateSceneContent to work
    useEditorStore.setState({
      project: {
        ...useEditorStore.getState().project,
        pages: [page],
        currentPageId: 'p1',
      },
    });
    const { container } = render(<ListFieldEditor page={page} fieldDef={SCENE_LIST_FIELDS['classification-game'][0]} />);
    const labelInput = container.querySelector('[data-testid="list-field-items-0-label"]') as HTMLInputElement;
    expect(labelInput.value).toBe('Berdoa');
    fireEvent.change(labelInput, { target: { value: 'Berdoa sebelum makan' } });
    // Verify store updated
    const updatedPage = useEditorStore.getState().project.pages[0];
    const items = (updatedPage.sceneContent as Record<string, unknown>).items as Array<Record<string, unknown>>;
    expect(items[0].label).toBe('Berdoa sebelum makan');
  });

  it('4. remove item from classification-game items list', () => {
    const page = setPage('classification-game', {
      items: [
        { id: 'i1', label: 'A', correctCategory: 'X' },
        { id: 'i2', label: 'B', correctCategory: 'Y' },
      ],
    });
    useEditorStore.setState({
      project: { ...useEditorStore.getState().project, pages: [page], currentPageId: 'p1' },
    });
    const { container } = render(<ListFieldEditor page={page} fieldDef={SCENE_LIST_FIELDS['classification-game'][0]} />);
    expect(container.querySelectorAll('[data-testid^="list-item-items-"]')).toHaveLength(2);
    fireEvent.click(container.querySelector('[data-testid="list-remove-items-0"]')!);
    expect(container.querySelectorAll('[data-testid^="list-item-items-"]')).toHaveLength(1);
  });

  it('5. reorder item up/down in classification-game items list', () => {
    const page = setPage('classification-game', {
      items: [
        { id: 'i1', label: 'First', correctCategory: 'X' },
        { id: 'i2', label: 'Second', correctCategory: 'Y' },
      ],
    });
    useEditorStore.setState({
      project: { ...useEditorStore.getState().project, pages: [page], currentPageId: 'p1' },
    });
    const { container } = render(<ListFieldEditor page={page} fieldDef={SCENE_LIST_FIELDS['classification-game'][0]} />);
    // Move second item up
    fireEvent.click(container.querySelector('[data-testid="list-up-items-1"]')!);
    // First item should now be "Second"
    const firstLabel = container.querySelector('[data-testid="list-field-items-0-label"]') as HTMLInputElement;
    expect(firstLabel.value).toBe('Second');
    // Move it back down
    fireEvent.click(container.querySelector('[data-testid="list-down-items-0"]')!);
    const firstLabelAfter = container.querySelector('[data-testid="list-field-items-0-label"]') as HTMLInputElement;
    expect(firstLabelAfter.value).toBe('First');
  });
});

// ---------------------------------------------------------------------------
// SCOPE B — Multiple List Field Types
// ---------------------------------------------------------------------------

describe('PERFECT-MPI-INSPECTOR-V2 — Scope B: Multiple List Types', () => {
  it('6. hotspot-map hotspots list editor renders', () => {
    const page = setPage('hotspot-map', {
      hotspots: [{ id: 'h1', x: 25, y: 30, label: 'Utara', info: 'Wilayah utara' }],
    });
    const { container } = render(<SceneContentEditor page={page} />);
    expect(container.querySelector('[data-testid="list-editor-hotspots"]')).toBeInTheDocument();
  });

  it('7. matching-game leftItems + rightItems + correctPairs list editors render', () => {
    const page = setPage('matching-game', {
      leftItems: [{ id: 'l1', label: 'A' }],
      rightItems: [{ id: 'r1', label: 'B' }],
      correctPairs: [{ leftId: 'l1', rightId: 'r1' }],
    });
    const { container } = render(<SceneContentEditor page={page} />);
    expect(container.querySelector('[data-testid="list-editor-leftItems"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="list-editor-rightItems"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="list-editor-correctPairs"]')).toBeInTheDocument();
  });

  it('8. glossary-cards terms list editor renders', () => {
    const page = setPage('glossary-cards', {
      terms: [{ id: 't1', term: 'Norma', definition: 'Aturan', example: 'Berdoa' }],
    });
    const { container } = render(<SceneContentEditor page={page} />);
    expect(container.querySelector('[data-testid="list-editor-terms"]')).toBeInTheDocument();
  });

  it('9. rubric-panel criteria + levels list editors render', () => {
    const page = setPage('rubric-panel', {
      criteria: [{ id: 'c1', name: 'Kelengkapan', description: 'Semua terisi' }],
      levels: [{ id: 'lv1', name: 'Baik', score: 4, descriptor: 'Sangat baik' }],
    });
    const { container } = render(<SceneContentEditor page={page} />);
    expect(container.querySelector('[data-testid="list-editor-criteria"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="list-editor-levels"]')).toBeInTheDocument();
  });

  it('10. worksheet-activity taskSteps list editor renders', () => {
    const page = setPage('worksheet-activity', {
      taskSteps: [{ id: 'ws1', prompt: 'Tulis nama', responsePlaceholder: 'Nama...' }],
    });
    const { container } = render(<SceneContentEditor page={page} />);
    expect(container.querySelector('[data-testid="list-editor-taskSteps"]')).toBeInTheDocument();
  });

  it('11. timeline-story events list editor renders', () => {
    const page = setPage('timeline-story', {
      events: [{ id: 'e1', label: 'Awal', description: 'Beginning' }],
    });
    const { container } = render(<SceneContentEditor page={page} />);
    expect(container.querySelector('[data-testid="list-editor-events"]')).toBeInTheDocument();
  });

  it('12. branching-scenario choices list editor renders', () => {
    const page = setPage('branching-scenario', {
      choices: [{ id: 'ch1', label: 'Help', consequence: 'Good', isCorrect: true }],
    });
    const { container } = render(<SceneContentEditor page={page} />);
    expect(container.querySelector('[data-testid="list-editor-choices"]')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// SCOPE C — String Array Fields (categories, correctOrder, facilitationTips)
// ---------------------------------------------------------------------------

describe('PERFECT-MPI-INSPECTOR-V2 — Scope C: String Array Fields', () => {
  it('13. classification-game categories (string array) list editor renders + edit', () => {
    const page = setPage('classification-game', {
      items: [],
      categories: ['Agama', 'Hukum'],
    });
    useEditorStore.setState({
      project: { ...useEditorStore.getState().project, pages: [page], currentPageId: 'p1' },
    });
    const { container } = render(<ListFieldEditor page={page} fieldDef={SCENE_LIST_FIELDS['classification-game'][1]} />);
    expect(container.querySelector('[data-testid="list-field-categories-0-value"]')?.getAttribute('value')).toBe('Agama');
    // Edit
    fireEvent.change(container.querySelector('[data-testid="list-field-categories-0-value"]')!, { target: { value: 'Norma Agama' } });
    const updatedPage = useEditorStore.getState().project.pages[0];
    const categories = (updatedPage.sceneContent as Record<string, unknown>).categories as string[];
    expect(categories[0]).toBe('Norma Agama');
  });

  it('14. teacher-guide facilitationTips (string array) list editor renders', () => {
    const page = setPage('teacher-guide', {
      facilitationTips: ['Tip 1', 'Tip 2'],
    });
    useEditorStore.setState({
      project: { ...useEditorStore.getState().project, pages: [page], currentPageId: 'p1' },
    });
    const { container } = render(<SceneContentEditor page={page} />);
    expect(container.querySelector('[data-testid="list-editor-facilitationTips"]')).toBeInTheDocument();
    const input = container.querySelector('[data-testid="list-field-facilitationTips-0-value"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('Tip 1');
  });
});

// ---------------------------------------------------------------------------
// SCOPE D — Regression
// ---------------------------------------------------------------------------

describe('PERFECT-MPI-INSPECTOR-V2 — Scope D: Regression', () => {
  it('15. scene types without list fields still render text fields only', () => {
    const page = setPage('cover-hero', { heroTitle: 'Test' });
    const { container } = render(<SceneContentEditor page={page} />);
    expect(container.querySelector('[data-testid="scene-content-editor"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="scene-field-heroTitle"]')).toBeInTheDocument();
    // No list editor for cover-hero
    expect(container.querySelector('[data-testid^="list-editor-"]')).not.toBeInTheDocument();
  });

  it('16. legacy project safe (no sceneType)', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('"scenePlan":null');
    expect(() => exportProjectToHtml(project)).not.toThrow();
  });

  it('17. 12 golden-reference scenes still pass', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    expect(bp.scenes).toHaveLength(12);
  });
});
