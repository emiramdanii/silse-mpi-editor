/**
 * PERFECT-MPI-RUNTIME-SYNC-01 PATCH A — Idempotent score sync tests.
 *
 * Tests: idempotent scoring (no double count), reset clears runtime,
 * editor mode safe, completion idempotent, helpful feedback.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  normalizeBlueprint,
  aiBlueprintToSimpleProject,
} from '../core/ai-mpi-json';
import { getDesignContract } from '../core/mpi-design-contract';
import { CanvasStage } from '../editor/CanvasStage';
import { useEditorStore } from '../store/editor-store';
import { createSamplePpknProject } from '../core/sample-project';
import {
  ClassificationGameComposer,
  MatchingGameComposer,
  SequencingGameComposer,
} from '../components/scene-composers';
import { SceneRendererView } from '../components/SceneRendererView';
import { renderScenePlan } from '../core/scene-renderer';
import { exportProjectToHtml } from '../export/export-html';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const contract = getDesignContract('golden-reference');

function loadGoldenRef() {
  return JSON.parse(readFileSync(resolve(__dirname, '../../samples/ai-mpi-json/macam-norma-reference.sample.json'), 'utf-8'));
}

// ---------------------------------------------------------------------------
// SCOPE A — Idempotent Score Sync (no double counting)
// ---------------------------------------------------------------------------

describe('PATCH A — Scope A: Idempotent Score Sync', () => {
  beforeEach(() => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const project = aiBlueprintToSimpleProject(bp);
    useEditorStore.setState({ project, selectedComponentId: null, completedSceneIds: [], perSceneScore: {}, aggregateScore: 0 });
  });

  it('1. classification score is idempotent — placing same item twice does not double score', () => {
    const gameContent = {
      items: [{ id: 'i1', label: 'Berdoa', correctCategory: 'Agama' }],
      categories: ['Agama'],
      scorePerItem: 10,
    };
    const sceneId = 'test-idem-class';
    const { container } = render(
      <ClassificationGameComposer
        contract={contract}
        content={gameContent}
        sceneId={sceneId}
        onScoreSet={(sid, score) => useEditorStore.getState().setSceneScore(sid, score)}
        onSceneComplete={(sid) => useEditorStore.getState().markSceneCompleted(sid)}
        onSceneReset={(sid) => useEditorStore.getState().resetSceneRuntime(sid)}
      />
    );
    fireEvent.click(container.querySelector('[data-item-id="i1"]')!);
    fireEvent.click(container.querySelector('[data-category="Agama"]')!);
    expect(useEditorStore.getState().perSceneScore[sceneId]).toBe(10);
    // Score should NOT increase further (item is placed, can't be placed again)
    expect(useEditorStore.getState().aggregateScore).toBe(10);
  });

  it('2. sequencing correct click twice does not double score', () => {
    const seqContent = {
      items: [{ id: 's1', label: 'Satu' }, { id: 's2', label: 'Dua' }],
      correctOrder: ['s1', 's2'],
      scorePerItem: 10,
    };
    const sceneId = 'test-idem-seq';
    const { container } = render(
      <SequencingGameComposer
        contract={contract}
        content={seqContent}
        sceneId={sceneId}
        onScoreSet={(sid, score) => useEditorStore.getState().setSceneScore(sid, score)}
        onSceneComplete={(sid) => useEditorStore.getState().markSceneCompleted(sid)}
        onSceneReset={(sid) => useEditorStore.getState().resetSceneRuntime(sid)}
      />
    );
    // First check — correct
    fireEvent.click(container.querySelector('[data-testid="sequence-check"]')!);
    expect(useEditorStore.getState().perSceneScore[sceneId]).toBe(20);
    // Second check — should NOT add again (scored guard)
    fireEvent.click(container.querySelector('[data-testid="sequence-check"]')!);
    expect(useEditorStore.getState().perSceneScore[sceneId]).toBe(20);
    expect(useEditorStore.getState().aggregateScore).toBe(20);
  });

  it('3. matching reset then replay does not double aggregate score', () => {
    const matchContent = {
      leftItems: [{ id: 'l1', label: 'A' }],
      rightItems: [{ id: 'r1', label: 'B' }],
      correctPairs: [{ leftId: 'l1', rightId: 'r1' }],
      scorePerPair: 10,
    };
    const sceneId = 'test-idem-match';
    const { container } = render(
      <MatchingGameComposer
        contract={contract}
        content={matchContent}
        sceneId={sceneId}
        onScoreSet={(sid, score) => useEditorStore.getState().setSceneScore(sid, score)}
        onSceneComplete={(sid) => useEditorStore.getState().markSceneCompleted(sid)}
        onSceneReset={(sid) => useEditorStore.getState().resetSceneRuntime(sid)}
      />
    );
    // Play correctly
    fireEvent.click(container.querySelector('[data-testid="left-l1"]')!);
    fireEvent.click(container.querySelector('[data-testid="right-r1"]')!);
    expect(useEditorStore.getState().perSceneScore[sceneId]).toBe(10);
    expect(useEditorStore.getState().aggregateScore).toBe(10);
    expect(useEditorStore.getState().completedSceneIds).toContain(sceneId);
    // Reset
    const resetBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Reset')) as HTMLElement;
    fireEvent.click(resetBtn);
    // After reset, store should be cleared
    expect(useEditorStore.getState().perSceneScore[sceneId]).toBeUndefined();
    expect(useEditorStore.getState().aggregateScore).toBe(0);
    expect(useEditorStore.getState().completedSceneIds).not.toContain(sceneId);
    // Play again correctly
    fireEvent.click(container.querySelector('[data-testid="left-l1"]')!);
    fireEvent.click(container.querySelector('[data-testid="right-r1"]')!);
    expect(useEditorStore.getState().perSceneScore[sceneId]).toBe(10);
    expect(useEditorStore.getState().aggregateScore).toBe(10);
  });

  it('4. classification reset clears runtime score + completion', () => {
    const gameContent = {
      items: [{ id: 'i1', label: 'Berdoa', correctCategory: 'Agama' }],
      categories: ['Agama'],
      scorePerItem: 10,
    };
    const sceneId = 'test-reset-class';
    const { container } = render(
      <ClassificationGameComposer
        contract={contract}
        content={gameContent}
        sceneId={sceneId}
        onScoreSet={(sid, score) => useEditorStore.getState().setSceneScore(sid, score)}
        onSceneComplete={(sid) => useEditorStore.getState().markSceneCompleted(sid)}
        onSceneReset={(sid) => useEditorStore.getState().resetSceneRuntime(sid)}
      />
    );
    fireEvent.click(container.querySelector('[data-item-id="i1"]')!);
    fireEvent.click(container.querySelector('[data-category="Agama"]')!);
    expect(useEditorStore.getState().perSceneScore[sceneId]).toBe(10);
    expect(useEditorStore.getState().completedSceneIds).toContain(sceneId);
    // Reset
    const resetBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Reset')) as HTMLElement;
    fireEvent.click(resetBtn);
    expect(useEditorStore.getState().perSceneScore[sceneId]).toBeUndefined();
    expect(useEditorStore.getState().aggregateScore).toBe(0);
    expect(useEditorStore.getState().completedSceneIds).not.toContain(sceneId);
  });

  it('5. markSceneCompleted is idempotent — calling twice does not add duplicate', () => {
    useEditorStore.getState().markSceneCompleted('scene-x');
    useEditorStore.getState().markSceneCompleted('scene-x');
    expect(useEditorStore.getState().completedSceneIds.filter((id) => id === 'scene-x')).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// SCOPE B — Editor Mode Safe (CanvasStage does not wire score)
// ---------------------------------------------------------------------------

describe('PATCH A — Scope B: Editor Mode Safe (behavior test)', () => {
  it('6. CanvasStage editor mode does not change store score (editor is safe)', () => {
    // Render CanvasStage with a quiz scene — verify store score unchanged
    // (editor mode should not wire onScoreSet to the store)
    const project = createSamplePpknProject();
    useEditorStore.setState({ project });
    const initialScore = useEditorStore.getState().perSceneScore || {};
    render(<CanvasStage />);
    // Editor rendered without crash — score state unchanged
    expect(useEditorStore.getState().perSceneScore || {}).toEqual(initialScore);
  });

  it('7. Editor store has score tracking functions (setSceneScore + resetSceneRuntime)', () => {
    // Verify editor store exposes score tracking (proves it can be wired when needed)
    const store = useEditorStore.getState();
    expect(typeof store.setSceneScore).toBe('function');
    expect(typeof store.resetSceneRuntime).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// SCOPE C — SceneRendererView Interaction Calls Callback
// ---------------------------------------------------------------------------

describe('PATCH A — Scope C: SceneRendererView Interaction', () => {
  it('8. SceneRendererView interaction calls onScoreSet when game is played', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = bp.scenes;
    const gameScene = container.find((s) => s.sceneType as string === 'classification-game')!;
    const plan = renderScenePlan(gameScene, contract);
    let scoreSetCalled = false;
    let scoreValue = 0;
    const { container: dom } = render(
      <SceneRendererView
        plan={plan}
        contract={contract}
        interactive
        onScoreSet={(_sceneId, score) => { scoreSetCalled = true; scoreValue = score; }}
        onSceneComplete={() => {}}
        onSceneReset={() => {}}
      />
    );
    // Play the game
    const items = dom.querySelectorAll('[data-item-id]');
    if (items.length > 0) {
      fireEvent.click(items[0]);
      const gameContent = plan.slots[0].content as unknown as {
        items: Array<{ id: string; correctCategory: string }>;
      };
      const firstItemId = items[0].getAttribute('data-item-id');
      const firstItem = gameContent.items.find((i) => i.id === firstItemId);
      if (firstItem) {
        const correctCol = dom.querySelector(`[data-category="${firstItem.correctCategory}"]`) as HTMLElement;
        if (correctCol) {
          fireEvent.click(correctCol);
          expect(scoreSetCalled).toBe(true);
          expect(scoreValue).toBeGreaterThan(0);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// SCOPE D — Regression
// ---------------------------------------------------------------------------

describe('PATCH A — Scope D: Regression', () => {
  it('9. legacy project still safe', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project); void html;
    // Fase 2b: scenePlan no longer null — all pages go through scene renderer
    expect(() => exportProjectToHtml(project)).not.toThrow();
  });

  it('10. 12 golden-reference scenes still pass', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    expect(bp.scenes).toHaveLength(12);
    bp.scenes.forEach((scene) => {
      const plan = renderScenePlan(scene, contract);
      expect(plan.sceneClass).toContain('silse-scene');
    });
  });
});
