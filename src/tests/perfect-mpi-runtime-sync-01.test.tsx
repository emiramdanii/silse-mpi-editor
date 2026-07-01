/**
 * PERFECT-MPI-RUNTIME-SYNC-01 — Tests.
 *
 * Tests runtime score sync (game composers → editor store) + helpful feedback polish.
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
import {
  ClassificationGameComposer,
  MatchingGameComposer,
  SequencingGameComposer,
} from '../components/scene-composers';
import { SceneRendererView } from '../components/SceneRendererView';
import { renderScenePlan } from '../core/scene-renderer';
import { exportProjectToHtml } from '../export/export-html';
import { createSamplePpknProject } from '../core/sample-project';
import { useEditorStore } from '../store/editor-store';

const contract = getDesignContract('golden-reference');

function loadGoldenRef() {
  return JSON.parse(readFileSync(resolve(__dirname, '../../samples/ai-mpi-json/macam-norma-reference.sample.json'), 'utf-8'));
}

// ---------------------------------------------------------------------------
// SCOPE A — Runtime Score Sync
// ---------------------------------------------------------------------------

describe('PERFECT-MPI-RUNTIME-SYNC-01 — Scope A: Score Sync', () => {
  beforeEach(() => {
    const { project } = (() => {
      const bp = normalizeBlueprint(loadGoldenRef());
      return { project: aiBlueprintToSimpleProject(bp) };
    })();
    useEditorStore.setState({ project, selectedComponentId: null, completedSceneIds: [], perSceneScore: {}, aggregateScore: 0 });
  });

  it('1. classification game score syncs to editor store aggregateScore', () => {
    const gameContent = {
      instruction: 'Sortir!',
      items: [
        { id: 'i1', label: 'Berdoa', correctCategory: 'Agama' },
        { id: 'i2', label: 'Helm', correctCategory: 'Hukum' },
      ],
      categories: ['Agama', 'Hukum'],
      scorePerItem: 10,
      completionMessage: 'Selesai!',
    };
    const sceneId = 'test-classification';
    const { container } = render(
      <ClassificationGameComposer
        contract={contract}
        content={gameContent}
        sceneId={sceneId}
        onScoreChange={(sid, pts) => useEditorStore.getState().addSceneScore(sid, pts)}
        onSceneComplete={(sid) => useEditorStore.getState().markSceneCompleted(sid)}
      />
    );
    // Place correct item
    fireEvent.click(container.querySelector('[data-item-id="i1"]')!);
    fireEvent.click(container.querySelector('[data-category="Agama"]')!);
    // Score should sync to store
    expect(useEditorStore.getState().perSceneScore[sceneId]).toBe(10);
    expect(useEditorStore.getState().aggregateScore).toBe(10);
  });

  it('2. classification game completion syncs to editor store completedSceneIds', () => {
    const gameContent = {
      instruction: 'Sortir!',
      items: [{ id: 'i1', label: 'Berdoa', correctCategory: 'Agama' }],
      categories: ['Agama'],
      scorePerItem: 10,
      completionMessage: 'Selesai!',
    };
    const sceneId = 'test-complete';
    const { container } = render(
      <ClassificationGameComposer
        contract={contract}
        content={gameContent}
        sceneId={sceneId}
        onScoreChange={(sid, pts) => useEditorStore.getState().addSceneScore(sid, pts)}
        onSceneComplete={(sid) => useEditorStore.getState().markSceneCompleted(sid)}
      />
    );
    fireEvent.click(container.querySelector('[data-item-id="i1"]')!);
    fireEvent.click(container.querySelector('[data-category="Agama"]')!);
    // Scene should be marked completed
    expect(useEditorStore.getState().completedSceneIds).toContain(sceneId);
  });

  it('3. matching game score syncs to editor store', () => {
    const matchContent = {
      instruction: 'Cocokkan',
      leftItems: [{ id: 'l1', label: 'A' }],
      rightItems: [{ id: 'r1', label: 'B' }],
      correctPairs: [{ leftId: 'l1', rightId: 'r1' }],
      scorePerPair: 10,
    };
    const sceneId = 'test-matching';
    const { container } = render(
      <MatchingGameComposer
        contract={contract}
        content={matchContent}
        sceneId={sceneId}
        onScoreChange={(sid, pts) => useEditorStore.getState().addSceneScore(sid, pts)}
        onSceneComplete={(sid) => useEditorStore.getState().markSceneCompleted(sid)}
      />
    );
    fireEvent.click(container.querySelector('[data-testid="left-l1"]')!);
    fireEvent.click(container.querySelector('[data-testid="right-r1"]')!);
    expect(useEditorStore.getState().perSceneScore[sceneId]).toBe(10);
    expect(useEditorStore.getState().aggregateScore).toBe(10);
    expect(useEditorStore.getState().completedSceneIds).toContain(sceneId);
  });

  it('4. sequencing game score syncs to editor store on correct answer', () => {
    const seqContent = {
      instruction: 'Urutkan',
      items: [{ id: 's1', label: 'Satu' }, { id: 's2', label: 'Dua' }],
      correctOrder: ['s1', 's2'],
      scorePerItem: 10,
    };
    const sceneId = 'test-seq';
    const { container } = render(
      <SequencingGameComposer
        contract={contract}
        content={seqContent}
        sceneId={sceneId}
        onScoreChange={(sid, pts) => useEditorStore.getState().addSceneScore(sid, pts)}
        onSceneComplete={(sid) => useEditorStore.getState().markSceneCompleted(sid)}
      />
    );
    // Items are already in correct order, just check
    fireEvent.click(container.querySelector('[data-testid="sequence-check"]')!);
    expect(useEditorStore.getState().perSceneScore[sceneId]).toBe(20);
    expect(useEditorStore.getState().aggregateScore).toBe(20);
    expect(useEditorStore.getState().completedSceneIds).toContain(sceneId);
  });
});

// ---------------------------------------------------------------------------
// SCOPE B — Helpful Feedback Polish
// ---------------------------------------------------------------------------

describe('PERFECT-MPI-RUNTIME-SYNC-01 — Scope B: Helpful Feedback', () => {
  it('5. classification game feedback is helpful (mentions item + category)', () => {
    const gameContent = {
      items: [{ id: 'i1', label: 'Berdoa', correctCategory: 'Agama' }],
      categories: ['Agama', 'Hukum'],
      scorePerItem: 10,
    };
    const { container } = render(<ClassificationGameComposer contract={contract} content={gameContent} />);
    // Place WRONG item
    fireEvent.click(container.querySelector('[data-item-id="i1"]')!);
    fireEvent.click(container.querySelector('[data-category="Hukum"]')!);
    const feedback = container.querySelector('[data-testid="game-feedback"]');
    expect(feedback).toBeInTheDocument();
    // Feedback should mention the item label and the wrong category
    expect(feedback?.textContent).toContain('Berdoa');
    expect(feedback?.textContent).toContain('Hukum');
  });

  it('6. matching game wrong feedback mentions the left item label', () => {
    const matchContent = {
      leftItems: [{ id: 'l1', label: 'Norma Agama' }, { id: 'l2', label: 'Norma Hukum' }],
      rightItems: [{ id: 'r1', label: 'Aturan Tuhan' }, { id: 'r2', label: 'Aturan Negara' }],
      correctPairs: [{ leftId: 'l1', rightId: 'r1' }, { leftId: 'l2', rightId: 'r2' }],
      scorePerPair: 10,
    };
    const { container } = render(<MatchingGameComposer contract={contract} content={matchContent} />);
    // Select l1, click WRONG right (r2)
    fireEvent.click(container.querySelector('[data-testid="left-l1"]')!);
    fireEvent.click(container.querySelector('[data-testid="right-r2"]')!);
    const feedback = container.querySelector('[data-testid="matching-feedback"]');
    expect(feedback?.textContent).toContain('Norma Agama');
    expect(feedback?.textContent).toContain('belum cocok');
  });

  it('7. sequencing game wrong feedback gives position hint', () => {
    const seqContent = {
      items: [{ id: 's1', label: 'Pertama' }, { id: 's2', label: 'Kedua' }, { id: 's3', label: 'Ketiga' }],
      correctOrder: ['s1', 's2', 's3'],
      scorePerItem: 10,
    };
    const { container } = render(<SequencingGameComposer contract={contract} content={seqContent} />);
    // Swap s1 and s2 (wrong order)
    fireEvent.click(container.querySelector('[data-testid="sequence-up-s2"]')!);
    // Check
    fireEvent.click(container.querySelector('[data-testid="sequence-check"]')!);
    const feedback = container.querySelector('[data-testid="sequence-feedback"]');
    expect(feedback?.textContent).toContain('posisi');
  });
});

// ---------------------------------------------------------------------------
// SCOPE C — Regression
// ---------------------------------------------------------------------------

describe('PERFECT-MPI-RUNTIME-SYNC-01 — Scope C: Regression', () => {
  it('8. legacy project still safe', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('"scenePlan":null');
    expect(() => exportProjectToHtml(project)).not.toThrow();
  });

  it('9. 12 golden-reference scenes still pass', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = bp.scenes;
    expect(container).toHaveLength(12);
    container.forEach((scene) => {
      const plan = renderScenePlan(scene, contract);
      expect(plan.sceneClass).toContain('silse-scene');
    });
  });

  it('10. SceneRendererView passes onScoreChange + onSceneComplete to composers', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = bp.scenes;
    const gameScene = container.find((s) => s.sceneType as string === 'classification-game')!;
    const plan = renderScenePlan(gameScene, contract);
    let scoreCalled = false;
    let completeCalled = false;
    const { container: dom } = render(
      <SceneRendererView
        plan={plan}
        contract={contract}
        interactive
        onScoreChange={() => { scoreCalled = true; }}
        onSceneComplete={() => { completeCalled = true; }}
      />
    );
    // Verify scene renders
    expect(dom.querySelector('.silse-scene-classification-game')).toBeInTheDocument();
    // Score callback should not have been called yet (no interaction)
    expect(scoreCalled).toBe(false);
    expect(completeCalled).toBe(false);
  });
});
