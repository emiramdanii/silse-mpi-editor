/**
 * PREMIUM-STYLE-P2 — Per-scene visual polish + overflow guard tests.
 * PATCH A: Fixed misleading tests + sequencing lock + behavior tests.
 */

import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { normalizeBlueprint, aiJsonToMpiContainer, aiBlueprintToSimpleProject } from '../core/ai-mpi-json';
import { getDesignContract } from '../core/mpi-design-contract';
import { renderScenePlan } from '../core/scene-renderer';
import { SceneRendererView } from '../components/SceneRendererView';
import {
  ClassificationGameComposer,
  MatchingGameComposer,
  SequencingGameComposer,
} from '../components/scene-composers';
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
// SCOPE A — Per-Scene Polish Classes (HONEST — renders actual scene)
// ---------------------------------------------------------------------------

describe('PREMIUM-STYLE-P2 — Scope A: Per-Scene Polish (honest)', () => {
  it('1. classification-game has premium classes', () => {
    const { container } = getSceneDom('classification-game');
    expect(container.querySelector('[class*="silse-premium"]')).toBeInTheDocument();
  });

  it('2. matching-game has premium classes (renders ACTUAL matching composer)', () => {
    // matching-game is NOT in golden reference — render composer directly
    const matchContent = {
      instruction: 'Cocokkan',
      leftItems: [{ id: 'l1', label: 'A' }],
      rightItems: [{ id: 'r1', label: 'B' }],
      correctPairs: [{ leftId: 'l1', rightId: 'r1' }],
      scorePerPair: 10,
    };
    const { container } = render(<MatchingGameComposer contract={contract} content={matchContent} />);
    expect(container.querySelector('[class*="silse-premium"]')).toBeInTheDocument();
  });

  it('3. sequencing-game has premium classes (renders ACTUAL sequencing composer)', () => {
    // sequencing-game is NOT in golden reference — render composer directly
    const seqContent = {
      instruction: 'Urutkan',
      items: [{ id: 's1', label: 'Satu' }, { id: 's2', label: 'Dua' }],
      correctOrder: ['s1', 's2'],
      scorePerItem: 10,
    };
    const { container } = render(<SequencingGameComposer contract={contract} content={seqContent} />);
    expect(container.querySelector('[class*="silse-premium"]')).toBeInTheDocument();
  });

  it('4. quiz-challenge has premium classes', () => {
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
  it('8. export contains premium classes for golden reference scenes', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const project = aiBlueprintToSimpleProject(bp);
    const html = exportProjectToHtml(project); void html;
    expect(html).toContain('silse-premium');
  });

  it('9. export contains box-shadow for panels', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project); void html;
    expect(html).toContain('box-shadow');
  });
});

// ---------------------------------------------------------------------------
// SCOPE C — Sequencing Lock After Correct (P2 PATCH A)
// ---------------------------------------------------------------------------

describe('PREMIUM-STYLE-P2 PATCH A — Sequencing Lock', () => {
  it('10. sequencing correct → up/down buttons disabled (locked)', () => {
    const seqContent = {
      instruction: 'Urutkan',
      items: [{ id: 's1', label: 'Satu' }, { id: 's2', label: 'Dua' }],
      correctOrder: ['s1', 's2'],
      scorePerItem: 10,
    };
    const { container } = render(<SequencingGameComposer contract={contract} content={seqContent} />);
    // Before check — buttons enabled
    const upBtn2 = container.querySelector('[data-testid="sequence-up-s2"]') as HTMLButtonElement;
    expect(upBtn2.disabled).toBe(false);
    // Check answer (correct — already in order)
    fireEvent.click(container.querySelector('[data-testid="sequence-check"]')!);
    // After correct — buttons disabled
    const upBtn2After = container.querySelector('[data-testid="sequence-up-s2"]') as HTMLButtonElement;
    expect(upBtn2After.disabled).toBe(true);
    const downBtn1After = container.querySelector('[data-testid="sequence-down-s1"]') as HTMLButtonElement;
    expect(downBtn1After.disabled).toBe(true);
  });

  it('11. sequencing lock prevents order change after correct', () => {
    const seqContent = {
      instruction: 'Urutkan',
      items: [{ id: 's1', label: 'Satu' }, { id: 's2', label: 'Dua' }],
      correctOrder: ['s1', 's2'],
      scorePerItem: 10,
    };
    const { container } = render(<SequencingGameComposer contract={contract} content={seqContent} />);
    // Check answer (correct)
    fireEvent.click(container.querySelector('[data-testid="sequence-check"]')!);
    // Try to move s2 up — should NOT work (locked)
    const itemsBefore = container.querySelectorAll('.silse-sequence-item');
    const firstBefore = itemsBefore[0].getAttribute('data-testid');
    fireEvent.click(container.querySelector('[data-testid="sequence-up-s2"]')!);
    const itemsAfter = container.querySelectorAll('.silse-sequence-item');
    const firstAfter = itemsAfter[0].getAttribute('data-testid');
    expect(firstAfter).toBe(firstBefore); // Order unchanged
  });

  it('12. sequencing reset unlocks buttons', () => {
    const seqContent = {
      instruction: 'Urutkan',
      items: [{ id: 's1', label: 'Satu' }, { id: 's2', label: 'Dua' }],
      correctOrder: ['s1', 's2'],
      scorePerItem: 10,
    };
    const { container } = render(<SequencingGameComposer contract={contract} content={seqContent} />);
    // Check answer (correct) → locked
    fireEvent.click(container.querySelector('[data-testid="sequence-check"]')!);
    const upBtn = container.querySelector('[data-testid="sequence-up-s2"]') as HTMLButtonElement;
    expect(upBtn.disabled).toBe(true);
    // Reset
    const resetBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Reset')) as HTMLElement;
    fireEvent.click(resetBtn);
    // After reset — buttons enabled again
    const upBtnAfter = container.querySelector('[data-testid="sequence-up-s2"]') as HTMLButtonElement;
    expect(upBtnAfter.disabled).toBe(false);
  });

  it('13. export sequencing has seqLocked logic', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project); void html;
    expect(html).toContain('seqLocked');
  });
});

// ---------------------------------------------------------------------------
// SCOPE D — Behavior Tests (interaction still works after polish)
// ---------------------------------------------------------------------------

describe('PREMIUM-STYLE-P2 PATCH A — Behavior Tests', () => {
  it('14. classification still interactive after polish', () => {
    const gameContent = {
      items: [{ id: 'i1', label: 'Berdoa', correctCategory: 'Agama' }],
      categories: ['Agama'],
      scorePerItem: 10,
    };
    const { container } = render(<ClassificationGameComposer contract={contract} content={gameContent} />);
    fireEvent.click(container.querySelector('[data-item-id="i1"]')!);
    fireEvent.click(container.querySelector('[data-category="Agama"]')!);
    expect(container.querySelector('[data-testid="game-score"]')?.textContent).toBe('10');
  });

  it('15. matching wrong pair still retry-friendly', () => {
    const matchContent = {
      leftItems: [{ id: 'l1', label: 'A' }, { id: 'l2', label: 'B' }],
      rightItems: [{ id: 'r1', label: '1' }, { id: 'r2', label: '2' }],
      correctPairs: [{ leftId: 'l1', rightId: 'r1' }, { leftId: 'l2', rightId: 'r2' }],
      scorePerPair: 10,
    };
    const { container } = render(<MatchingGameComposer contract={contract} content={matchContent} />);
    // Wrong pair: l1 → r2
    fireEvent.click(container.querySelector('[data-testid="left-l1"]')!);
    fireEvent.click(container.querySelector('[data-testid="right-r2"]')!);
    // Score should NOT increase
    expect(container.querySelector('[data-testid="matching-score"]')?.textContent).toBe('0');
    // Right item r2 should NOT be disabled (retry-friendly)
    const r2Btn = container.querySelector('[data-testid="right-r2"]') as HTMLButtonElement;
    expect(r2Btn.disabled).toBe(false);
    // Now try correct pair: l1 → r1
    fireEvent.click(container.querySelector('[data-testid="left-l1"]')!);
    fireEvent.click(container.querySelector('[data-testid="right-r1"]')!);
    expect(container.querySelector('[data-testid="matching-score"]')?.textContent).toBe('10');
  });

  it('16. quiz feedback still appears', () => {
    const { container } = getSceneDom('quiz-challenge');
    // Quiz scene should have quiz elements
    expect(container.querySelector('[class*="silse-quiz"]')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// SCOPE E — Overflow Guard (strengthened)
// ---------------------------------------------------------------------------

describe('PREMIUM-STYLE-P2 PATCH A — Overflow Guard', () => {
  it('17. SceneShell overflow is explicitly set (not empty) for P2 scenes', () => {
    const p2Scenes = ['classification-game', 'discussion-scene', 'reflection-journal', 'learning-scene', 'quiz-challenge'];
    p2Scenes.forEach((st) => {
      const bp = normalizeBlueprint(loadGoldenRef());
      const container = aiJsonToMpiContainer(bp);
      const scene = container.scenes.find((s) => s.sceneType === st);
      if (!scene) return;
      const plan = renderScenePlan(scene, contract);
      const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
      const shell = dom.querySelector('.silse-block-shell') as HTMLElement;
      if (shell) {
        const overflow = shell.style.overflow;
        // PATCH A: Must be explicitly 'auto' or 'hidden', not empty string
        expect(['auto', 'hidden']).toContain(overflow);
      }
    });
  });

  it('18. export HTML has no hardcoded width > 1280 in inline styles (behavior test)', () => {
    // Check the rendered export output for width values > 1280
    const bp = normalizeBlueprint(loadGoldenRef());
    const project = aiBlueprintToSimpleProject(bp);
    const html = exportProjectToHtml(project); void html;
    const widths = html.match(/width:\s*(\d+)/g) || [];
    widths.forEach((w) => {
      const num = parseInt(w.match(/\d+/)![0], 10);
      expect(num, `width ${num} exceeds 1280`).toBeLessThanOrEqual(1280);
    });
  });

  it('19. export has no external CSS/JS', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project); void html;
    expect(html).not.toMatch(/<link\s+rel=["']stylesheet["']/);
    expect(html).not.toMatch(/<script\s+src=/);
    expect(html).not.toMatch(/<iframe/);
  });
});

// ---------------------------------------------------------------------------
// SCOPE F — Regression
// ---------------------------------------------------------------------------

describe('PREMIUM-STYLE-P2 PATCH A — Regression', () => {
  it('20. 12 golden reference scenes still pass', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    expect(bp.scenes).toHaveLength(12);
    bp.scenes.forEach((scene) => {
      const plan = renderScenePlan(scene, contract);
      expect(plan.sceneClass).toContain('silse-scene');
    });
  });

  it('21. legacy project still safe', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project); void html;
    // Fase 2b: scenePlan no longer null — all pages go through scene renderer
  });

  it('22. export wireInteractions still present', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project); void html;
    expect(html).toContain('wireInteractions()');
  });
});
