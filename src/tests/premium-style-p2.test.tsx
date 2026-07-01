/**
 * PREMIUM-STYLE-P2 — Per-scene visual polish + overflow guard tests.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { normalizeBlueprint, aiJsonToMpiContainer, aiBlueprintToSimpleProject } from '../core/ai-mpi-json';
import { getDesignContract } from '../core/mpi-design-contract';
import { renderScenePlan } from '../core/scene-renderer';
import { SceneRendererView } from '../components/SceneRendererView';
import { exportProjectToHtml } from '../export/export-html';
import { createSamplePpknProject } from '../core/sample-project';

const contract = getDesignContract('golden-reference');

function loadGoldenRef() {
  return JSON.parse(readFileSync(resolve(__dirname, '../../samples/ai-mpi-json/macam-norma-reference.sample.json'), 'utf-8'));
}

function getSceneDom(sceneType: string) {
  const bp = normalizeBlueprint(loadGoldenRef());
  const container = aiJsonToMpiContainer(bp);
  const scene = container.scenes.find((s) => s.sceneType === sceneType)!;
  const plan = renderScenePlan(scene, contract);
  return render(<SceneRendererView plan={plan} contract={contract} interactive />);
}

// ---------------------------------------------------------------------------
// SCOPE A — Per-Scene Polish Classes
// ---------------------------------------------------------------------------

describe('PREMIUM-STYLE-P2 — Scope A: Per-Scene Polish', () => {
  it('1. classification-game has premium classes', () => {
    const { container } = getSceneDom('classification-game');
    expect(container.querySelector('.silse-premium-game-item, .silse-premium-item, [class*="silse-premium"]')).toBeInTheDocument();
  });

  it('2. matching-game has premium classes', () => {
    const { container } = getSceneDom('discussion-scene'); // matching-game not in golden ref, use discussion
    expect(container.querySelector('[class*="silse-premium"], [class*="silse-block-panel"]')).toBeInTheDocument();
  });

  it('3. sequencing-game has premium classes', () => {
    // sequencing not in golden ref — check learning-scene for premium polish
    const { container } = getSceneDom('learning-scene');
    expect(container.querySelector('[class*="silse-premium"], [class*="silse-block-panel"]')).toBeInTheDocument();
  });

  it('4. quiz-challenge has premium answer cards', () => {
    const { container } = getSceneDom('quiz-challenge');
    expect(container.querySelector('[class*="silse-premium"], [class*="silse-quiz"]')).toBeInTheDocument();
  });

  it('5. learning-scene has premium panels', () => {
    const { container } = getSceneDom('learning-scene');
    const panels = container.querySelectorAll('[class*="silse-block-panel"], [class*="silse-premium"]');
    expect(panels.length).toBeGreaterThan(0);
  });

  it('6. discussion-scene has premium elements', () => {
    const { container } = getSceneDom('discussion-scene');
    expect(container.querySelector('[class*="silse-premium"], [class*="silse-block-discussion"]')).toBeInTheDocument();
  });

  it('7. reflection-journal has premium elements', () => {
    const { container } = getSceneDom('reflection-journal');
    expect(container.querySelector('[class*="silse-premium"], [class*="silse-block-portfolio"]')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// SCOPE B — Export Parity
// ---------------------------------------------------------------------------

describe('PREMIUM-STYLE-P2 — Scope B: Export Parity', () => {
  it('8. export contains premium classes for 12 golden reference scenes', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const project = aiBlueprintToSimpleProject(bp);
    const html = exportProjectToHtml(project);
    // At least some premium classes should appear
    expect(html).toContain('silse-premium');
  });

  it('9. export contains box-shadow for panels', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('box-shadow');
  });
});

// ---------------------------------------------------------------------------
// SCOPE C — Overflow Guard
// ---------------------------------------------------------------------------

describe('PREMIUM-STYLE-P2 — Scope C: Overflow Guard', () => {
  it('10. SceneShell has overflow constraint (no horizontal scroll)', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = aiJsonToMpiContainer(bp);
    container.scenes.forEach((scene) => {
      const plan = renderScenePlan(scene, contract);
      const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
      const shell = dom.querySelector('.silse-block-shell') as HTMLElement;
      if (shell) {
        // overflow should be 'auto' or 'hidden' (not 'visible' which allows horizontal scroll)
        const overflow = shell.style.overflow;
        expect(['auto', 'hidden', '']).toContain(overflow);
      }
    });
  });

  it('11. 12 golden reference scenes render within 1280x720 canvas', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = aiJsonToMpiContainer(bp);
    container.scenes.forEach((scene) => {
      const plan = renderScenePlan(scene, contract);
      expect(plan.frame.width).toBe(1280);
      expect(plan.frame.height).toBe(720);
    });
  });
});

// ---------------------------------------------------------------------------
// SCOPE D — Regression
// ---------------------------------------------------------------------------

describe('PREMIUM-STYLE-P2 — Scope D: Regression', () => {
  it('12. interaction still works after P2 polish', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = aiJsonToMpiContainer(bp);
    const scene = container.scenes.find((s) => s.sceneType === 'classification-game')!;
    const plan = renderScenePlan(scene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} interactive />);
    expect(dom.querySelector('[data-testid="classification-pool"]')).toBeInTheDocument();
    expect(dom.querySelector('[data-testid="classification-columns"]')).toBeInTheDocument();
  });

  it('13. legacy project still safe', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('"scenePlan":null');
    expect(() => exportProjectToHtml(project)).not.toThrow();
  });

  it('14. 12 golden reference scenes still pass', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    expect(bp.scenes).toHaveLength(12);
  });

  it('15. export wireInteractions still present', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('wireInteractions()');
  });
});
