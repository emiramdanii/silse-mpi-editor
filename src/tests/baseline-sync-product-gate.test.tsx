/**
 * BASELINE-SYNC — Product Gate + Game P1 + Interaction P1 tests.
 *
 * Verifies that the baseline sync is correct:
 *   - aiBlueprintToSimpleProject bridge produces 12 pages.
 *   - 12 scene flow through CanvasStage / PreviewApp / export-html.
 *   - Classification game renders + interacts.
 *   - Export interaction emit (data-tab-id, data-action, data-item-id, data-category).
 *   - wireInteractions handler present.
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
import { simpleProjectToMpiContainer } from '../core/mpi-container';
import { getDesignContract } from '../core/mpi-design-contract';
import { ClassificationGameComposer } from '../components/scene-composers';
import { exportProjectToHtml } from '../export/export-html';
import { createSamplePpknProject } from '../core/sample-project';
import { createSceneProofProject } from '../core/scene-proof-project';
import { CanvasStage } from '../editor/CanvasStage';
import { PreviewApp } from '../preview/PreviewApp';
import { useEditorStore } from '../store/editor-store';
import { usePreviewStore } from '../preview/preview-store';

const GOLDEN_REF_PATH = resolve(__dirname, '../../samples/ai-mpi-json/macam-norma-reference.sample.json');
function loadGoldenRef(): unknown { return JSON.parse(readFileSync(GOLDEN_REF_PATH, 'utf-8')); }

const EXPECTED_SCENE_ORDER = [
  'cover-hero', 'curriculum-guide', 'objectives-path', 'starter-review',
  'learning-scene', 'discussion-scene', 'classification-game', 'case-analysis',
  'quiz-challenge', 'result-summary', 'reflection-journal', 'closing-award',
] as const;

const EMITTED_SCENE_CLASS: readonly string[] = [
  'silse-scene-cover-hero', 'silse-scene-curriculum-guide', 'silse-scene-objectives-path',
  'silse-scene-starter-review', 'silse-scene-learning-scene', 'silse-scene-discussion',
  'silse-scene-classification-game', 'silse-scene-case-analysis', 'silse-scene-quiz-challenge',
  'silse-scene-result-summary', 'silse-scene-reflection-journal', 'silse-scene-closing-award',
] as const;

function buildFullProject() {
  const bp = normalizeBlueprint(loadGoldenRef());
  const project = aiBlueprintToSimpleProject(bp);
  return { bp, project };
}

// ---------------------------------------------------------------------------
// Bridge tests
// ---------------------------------------------------------------------------

describe('BASELINE-SYNC — Bridge: aiBlueprintToSimpleProject', () => {
  it('1. bridge produces 12 pages', () => {
    const { project } = buildFullProject();
    expect(project.pages).toHaveLength(12);
  });

  it('2. 12 pages preserve sceneType', () => {
    const { project } = buildFullProject();
    EXPECTED_SCENE_ORDER.forEach((st, i) => {
      expect(project.pages[i].sceneType).toBe(st);
    });
  });

  it('3. bridge round-trip: SimpleProject → MpiContainer preserves 12 sceneType', () => {
    const { project } = buildFullProject();
    const container = simpleProjectToMpiContainer(project);
    expect(container.scenes).toHaveLength(12);
    EXPECTED_SCENE_ORDER.forEach((st, i) => {
      expect(container.scenes[i].sceneType).toBe(st);
    });
  });
});

// ---------------------------------------------------------------------------
// Full 12 Scene App Gate
// ---------------------------------------------------------------------------

describe('BASELINE-SYNC — Full 12 Scene App Gate', () => {
  beforeEach(() => {
    const { project } = buildFullProject();
    useEditorStore.setState({ project, selectedComponentId: null });
    usePreviewStore.setState({ isOpen: false, currentPageId: '' });
  });

  it('4. CanvasStage renders all 12 scenes via bridge', () => {
    const project = useEditorStore.getState().project;
    project.pages.forEach((page, i) => {
      useEditorStore.setState({ project: { ...project, currentPageId: page.id }, selectedComponentId: null });
      const { container, unmount } = render(<CanvasStage />);
      const expectedClass = EMITTED_SCENE_CLASS[i];
      expect(container.querySelector(`[class*="${expectedClass}"]`)).toBeInTheDocument();
      unmount();
    });
  });

  it('5. PreviewApp renders all 12 scenes via bridge', () => {
    const project = useEditorStore.getState().project;
    project.pages.forEach((page, i) => {
      useEditorStore.setState({ project: { ...project, currentPageId: page.id }, selectedComponentId: null });
      usePreviewStore.setState({ isOpen: true, currentPageId: page.id });
      const { container, unmount } = render(<PreviewApp />);
      const expectedClass = EMITTED_SCENE_CLASS[i];
      expect(container.querySelector(`[class*="${expectedClass}"]`)).toBeInTheDocument();
      unmount();
    });
  });

  it('6. export HTML contains all 12 scene classes via bridge', () => {
    const project = useEditorStore.getState().project;
    const html = exportProjectToHtml(project); void html;
    EMITTED_SCENE_CLASS.forEach((cls) => {
      expect(html).toContain(cls);
    });
  });
});

// ---------------------------------------------------------------------------
// Classification Game
// ---------------------------------------------------------------------------

describe('BASELINE-SYNC — Classification Game', () => {
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

  it('7. classification game renders with pool + columns', () => {
    const contract = getDesignContract('golden-reference');
    const { container } = render(<ClassificationGameComposer contract={contract} content={gameContent} />);
    expect(container.querySelector('.silse-scene-classification-game')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="classification-pool"]')).toBeInTheDocument();
    expect(container.querySelector('.silse-classification-column-grid')).toBeInTheDocument();
  });

  it('8. classification game: select item → place in column → score increases', () => {
    const contract = getDesignContract('golden-reference');
    const { container } = render(<ClassificationGameComposer contract={contract} content={gameContent} />);
    fireEvent.click(container.querySelector('[data-item-id="i1"]')!);
    fireEvent.click(container.querySelector('[data-category="Agama"]')!);
    expect(container.querySelector('[data-testid="game-score"]')?.textContent).toBe('10');
  });

  it('9. classification game: reset works', () => {
    const contract = getDesignContract('golden-reference');
    const { container } = render(<ClassificationGameComposer contract={contract} content={gameContent} />);
    fireEvent.click(container.querySelector('[data-item-id="i1"]')!);
    fireEvent.click(container.querySelector('[data-category="Agama"]')!);
    expect(container.querySelector('[data-testid="game-score"]')?.textContent).toBe('10');
    const resetBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Reset')) as HTMLElement;
    fireEvent.click(resetBtn);
    expect(container.querySelector('[data-testid="game-score"]')?.textContent).toBe('0');
  });
});

// ---------------------------------------------------------------------------
// Export Interaction Emit
// ---------------------------------------------------------------------------

describe('BASELINE-SYNC — Export Interaction Emit', () => {
  it('10. export tabs emit data-tab-id', () => {
    const { project } = buildFullProject();
    const html = exportProjectToHtml(project); void html;
    expect(html).toContain("setAttribute('data-tab-id'");
    expect(html).toContain('[data-tab-id]');
  });

  it('11. export timer emit data-action="timer-toggle"', () => {
    const { project } = buildFullProject();
    const html = exportProjectToHtml(project); void html;
    expect(html).toContain("'data-action', 'timer-toggle'");
    expect(html).toContain('[data-action="timer-toggle"]');
  });

  it('12. export save response emit data-action="save-response"', () => {
    const { project } = buildFullProject();
    const html = exportProjectToHtml(project); void html;
    expect(html).toContain("'data-action', 'save-response'");
    expect(html).toContain('[data-action="save-response"]');
  });

  it('13. export reveal emit silse-reveal-body + silse-reveal-hint', () => {
    const { project } = buildFullProject();
    const html = exportProjectToHtml(project); void html;
    expect(html).toContain('silse-reveal-body');
    expect(html).toContain('silse-reveal-hint');
    expect(html).toContain('.silse-block-reveal');
  });

  it('14. export classification emit data-item-id + data-category', () => {
    const { project } = buildFullProject();
    const html = exportProjectToHtml(project); void html;
    expect(html).toContain("setAttribute('data-item-id'");
    expect(html).toContain("setAttribute('data-category'");
    expect(html).toContain('[data-item-id]');
    expect(html).toContain('[data-category]');
  });

  it('15. export wireInteractions handler present', () => {
    const { project } = buildFullProject();
    const html = exportProjectToHtml(project); void html;
    expect(html).toContain('wireInteractions()');
  });
});

// ---------------------------------------------------------------------------
// Regression
// ---------------------------------------------------------------------------

describe('BASELINE-SYNC — Regression', () => {
  it('16. legacy fallback tetap aman', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project); void html;
    // Fase 2b: scenePlan no longer null — all pages go through scene renderer
    expect(() => exportProjectToHtml(project)).not.toThrow();
  });

  it('17. 5 rendered scene tetap PASS (createSceneProofProject)', () => {
    const project = createSceneProofProject();
    const html = exportProjectToHtml(project); void html;
    expect(html).toContain('silse-scene-cover-hero');
    expect(html).toContain('silse-scene-learning-scene');
    expect(html).toContain('silse-scene-game-mission');
    expect(html).toContain('silse-scene-quiz-challenge');
    expect(html).toContain('silse-scene-closing-award');
  });

  it('18. tidak ada iframe / html import / stylesheet link', () => {
    const project = createSceneProofProject();
    const html = exportProjectToHtml(project); void html;
    expect(html).not.toMatch(/<iframe/);
    expect(html).not.toMatch(/<link\s+rel=["']stylesheet["']/);
    expect(html).not.toMatch(/<script\s+src=/);
  });
});
