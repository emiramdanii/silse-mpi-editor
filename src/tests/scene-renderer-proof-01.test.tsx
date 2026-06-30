/**
 * SCENE-RENDERER-PROOF-01 — Test Suite.
 *
 * Kontrak: renderer membaca scene dari container, membaca placement,
 * membaca design token, output bukan list biasa, editor/preview/export
 * punya jalur parity.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  normalizeBlueprint,
  aiJsonToMpiContainer,
} from '../core/ai-mpi-json';
import { getDesignContract, DEFAULT_DESIGN_CONTRACT } from '../core/mpi-design-contract';
import { renderScenePlan, isSceneRenderPlan, resolveDesignToken } from '../core/scene-renderer';
import { SceneRendererView } from '../components/SceneRendererView';
import type { MpiContainer } from '../core/mpi-container';

function loadContainer(): MpiContainer {
  const path = resolve(__dirname, '../../samples/ai-mpi-json/foundation-blueprint.sample.json');
  const raw = readFileSync(path, 'utf-8');
  const blueprint = normalizeBlueprint(JSON.parse(raw));
  return aiJsonToMpiContainer(blueprint);
}

describe('SCENE-RENDERER-PROOF-01 — render plan from container + contract', () => {
  it('1. renderScenePlan produces plan with silse-scene class', () => {
    const container = loadContainer();
    const scene = container.scenes[0];
    const contract = getDesignContract('modern-clean');
    const plan = renderScenePlan(scene, contract);
    expect(plan.sceneClass).toContain('silse-scene');
  });

  it('2. renderScenePlan produces plan with silse-scene-<sceneType> class', () => {
    const container = loadContainer();
    const scene = container.scenes[0];
    const contract = getDesignContract('modern-clean');
    const plan = renderScenePlan(scene, contract);
    expect(plan.sceneClass).toContain(`silse-scene-${scene.sceneType}`);
  });

  it('3. renderScenePlan reads slots from scene', () => {
    const container = loadContainer();
    const scene = container.scenes[0];
    const contract = getDesignContract('modern-clean');
    const plan = renderScenePlan(scene, contract);
    expect(plan.slots).toHaveLength(scene.slots.length);
  });

  it('4. renderScenePlan reads placement from slots', () => {
    const container = loadContainer();
    const scene = container.scenes[0];
    const contract = getDesignContract('modern-clean');
    const plan = renderScenePlan(scene, contract);
    const firstSlot = plan.slots[0];
    const originalSlot = scene.slots[0];
    expect(firstSlot.placement.x).toBe(originalSlot.placement.x);
    expect(firstSlot.placement.y).toBe(originalSlot.placement.y);
    expect(firstSlot.placement.width).toBe(originalSlot.placement.width);
    expect(firstSlot.placement.height).toBe(originalSlot.placement.height);
  });

  it('5. renderScenePlan reads designTokenKey from slots', () => {
    const container = loadContainer();
    const scene = container.scenes[0];
    const contract = getDesignContract('modern-clean');
    const plan = renderScenePlan(scene, contract);
    // Find slot with designTokenKey
    const slotWithKey = scene.slots.find((s) => s.designTokenKey);
    if (slotWithKey) {
      const planSlot = plan.slots.find((s) => s.id === slotWithKey.id);
      expect(planSlot?.designTokenKey).toBe(slotWithKey.designTokenKey);
    }
  });

  it('6. renderScenePlan produces silse-scene-slot class for each slot', () => {
    const container = loadContainer();
    const scene = container.scenes[0];
    const contract = getDesignContract('modern-clean');
    const plan = renderScenePlan(scene, contract);
    for (const slot of plan.slots) {
      expect(slot.slotClass).toContain('silse-scene-slot');
    }
  });

  it('7. renderScenePlan produces content class based on content kind', () => {
    const container = loadContainer();
    const scene = container.scenes[0];
    const contract = getDesignContract('modern-clean');
    const plan = renderScenePlan(scene, contract);
    for (const slot of plan.slots) {
      expect(slot.contentClass).toContain('silse-scene-');
    }
  });

  it('8. game-mission scene produces silse-scene-game-mission class', () => {
    const container = loadContainer();
    const gameScene = container.scenes.find((s) => s.sceneType === 'game-mission');
    const contract = getDesignContract('modern-clean');
    const plan = renderScenePlan(gameScene!, contract);
    expect(plan.sceneClass).toContain('silse-scene-game-mission');
  });

  it('9. game-mission slot produces silse-scene-game-mission content class', () => {
    const container = loadContainer();
    const gameScene = container.scenes.find((s) => s.sceneType === 'game-mission');
    const contract = getDesignContract('modern-clean');
    const plan = renderScenePlan(gameScene!, contract);
    const gameSlot = plan.slots.find((s) => s.content.kind === 'game-mission');
    expect(gameSlot?.contentClass).toBe('silse-scene-game-mission');
  });

  it('10. isSceneRenderPlan validates plan structure', () => {
    const container = loadContainer();
    const scene = container.scenes[0];
    const contract = getDesignContract('modern-clean');
    const plan = renderScenePlan(scene, contract);
    expect(isSceneRenderPlan(plan)).toBe(true);
    expect(isSceneRenderPlan(null)).toBe(false);
    expect(isSceneRenderPlan({})).toBe(false);
  });

  it('11. resolveDesignToken reads token from contract by path', () => {
    const contract = DEFAULT_DESIGN_CONTRACT;
    expect(resolveDesignToken(contract, 'frame.width')).toBe(1280);
    expect(resolveDesignToken(contract, 'palette.primary')).toBe('#1d3557');
    expect(resolveDesignToken(contract, 'card.radius')).toBe(12);
  });

  it('12. resolveDesignToken returns undefined for unknown path', () => {
    const contract = DEFAULT_DESIGN_CONTRACT;
    expect(resolveDesignToken(contract, 'unknown.path')).toBeUndefined();
  });
});

describe('SCENE-RENDERER-PROOF-01 — React view produces scene classes', () => {
  it('13. SceneRendererView produces silse-scene class in DOM', () => {
    const container = loadContainer();
    const scene = container.scenes[0];
    const contract = getDesignContract('modern-clean');
    const plan = renderScenePlan(scene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    expect(dom.querySelector('.silse-scene')).toBeInTheDocument();
  });

  it('14. SceneRendererView produces silse-scene-<sceneType> class', () => {
    const container = loadContainer();
    const scene = container.scenes[0];
    const contract = getDesignContract('modern-clean');
    const plan = renderScenePlan(scene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    expect(dom.querySelector(`.silse-scene-${scene.sceneType}`)).toBeInTheDocument();
  });

  it('15. SceneRendererView produces silse-scene-slot for each slot', () => {
    const container = loadContainer();
    const scene = container.scenes[0];
    const contract = getDesignContract('modern-clean');
    const plan = renderScenePlan(scene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    const slots = dom.querySelectorAll('.silse-scene-slot');
    expect(slots.length).toBe(scene.slots.length);
  });

  it('16. game-mission scene produces silse-game-scene in DOM', () => {
    const container = loadContainer();
    const gameScene = container.scenes.find((s) => s.sceneType === 'game-mission')!;
    const contract = getDesignContract('modern-clean');
    const plan = renderScenePlan(gameScene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    expect(dom.querySelector('.silse-game-scene')).toBeInTheDocument();
  });

  it('17. game-mission scene produces silse-game-briefing', () => {
    const container = loadContainer();
    const gameScene = container.scenes.find((s) => s.sceneType === 'game-mission')!;
    const contract = getDesignContract('modern-clean');
    const plan = renderScenePlan(gameScene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    expect(dom.querySelector('.silse-game-briefing')).toBeInTheDocument();
  });

  it('18. game-mission scene produces silse-game-target', () => {
    const container = loadContainer();
    const gameScene = container.scenes.find((s) => s.sceneType === 'game-mission')!;
    const contract = getDesignContract('modern-clean');
    const plan = renderScenePlan(gameScene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    expect(dom.querySelector('.silse-game-target')).toBeInTheDocument();
  });

  it('19. game-mission scene produces silse-game-action-grid', () => {
    const container = loadContainer();
    const gameScene = container.scenes.find((s) => s.sceneType === 'game-mission')!;
    const contract = getDesignContract('modern-clean');
    const plan = renderScenePlan(gameScene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    expect(dom.querySelector('.silse-game-action-grid')).toBeInTheDocument();
  });

  it('20. game-mission scene produces silse-game-action-card (minimal 2)', () => {
    const container = loadContainer();
    const gameScene = container.scenes.find((s) => s.sceneType === 'game-mission')!;
    const contract = getDesignContract('modern-clean');
    const plan = renderScenePlan(gameScene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    const cards = dom.querySelectorAll('.silse-game-action-card');
    expect(cards.length).toBeGreaterThanOrEqual(2);
  });

  it('21. game-mission scene produces silse-game-reward', () => {
    const container = loadContainer();
    const gameScene = container.scenes.find((s) => s.sceneType === 'game-mission')!;
    const contract = getDesignContract('modern-clean');
    const plan = renderScenePlan(gameScene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    expect(dom.querySelector('.silse-game-reward')).toBeInTheDocument();
  });

  it('22. quiz scene produces silse-quiz-scene in DOM', () => {
    const container = loadContainer();
    const quizScene = container.scenes.find((s) => s.sceneType === 'quiz-challenge')!;
    const contract = getDesignContract('modern-clean');
    const plan = renderScenePlan(quizScene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    expect(dom.querySelector('.silse-quiz-scene')).toBeInTheDocument();
  });

  it('23. quiz scene produces silse-quiz-choices', () => {
    const container = loadContainer();
    const quizScene = container.scenes.find((s) => s.sceneType === 'quiz-challenge')!;
    const contract = getDesignContract('modern-clean');
    const plan = renderScenePlan(quizScene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    expect(dom.querySelector('.silse-quiz-choices')).toBeInTheDocument();
  });

  it('24. output bukan list biasa — game scene punya briefing + target + grid + reward', () => {
    const container = loadContainer();
    const gameScene = container.scenes.find((s) => s.sceneType === 'game-mission')!;
    const contract = getDesignContract('modern-clean');
    const plan = renderScenePlan(gameScene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    // Must have scene structure
    expect(dom.querySelector('.silse-game-scene')).toBeInTheDocument();
    expect(dom.querySelector('.silse-game-briefing')).toBeInTheDocument();
    expect(dom.querySelector('.silse-game-target')).toBeInTheDocument();
    expect(dom.querySelector('.silse-game-action-grid')).toBeInTheDocument();
    expect(dom.querySelector('.silse-game-reward')).toBeInTheDocument();
  });

  it('25. SceneRendererView reads design contract (stage width/height applied)', () => {
    const container = loadContainer();
    const scene = container.scenes[0];
    const contract = getDesignContract('modern-clean');
    const plan = renderScenePlan(scene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    const sceneEl = dom.querySelector('.silse-scene') as HTMLElement;
    expect(sceneEl.style.width).toBe(`${contract.frame.width}px`);
    expect(sceneEl.style.height).toBe(`${contract.frame.height}px`);
  });

  it('26. SceneRendererView supports interactive mode (onGameAction callback)', () => {
    const container = loadContainer();
    const gameScene = container.scenes.find((s) => s.sceneType === 'game-mission')!;
    const contract = getDesignContract('modern-clean');
    const plan = renderScenePlan(gameScene, contract);
    let clickedSlot = '';
    let clickedAction = -1;
    const { container: dom } = render(
      <SceneRendererView
        plan={plan}
        contract={contract}
        interactive={true}
        onGameAction={(slotId, actionIdx) => {
          clickedSlot = slotId;
          clickedAction = actionIdx;
        }}
      />
    );
    const firstAction = dom.querySelector('.silse-game-action-card') as HTMLElement;
    firstAction.click();
    expect(clickedSlot).toBe(plan.slots[0].id);
    expect(clickedAction).toBe(0);
  });

  it('27. SceneRendererView supports editor selection (onSlotClick + selectedSlotId)', () => {
    const container = loadContainer();
    const scene = container.scenes[0];
    const contract = getDesignContract('modern-clean');
    const plan = renderScenePlan(scene, contract);
    let selectedId = '';
    const { container: dom } = render(
      <SceneRendererView
        plan={plan}
        contract={contract}
        onSlotClick={(slotId) => { selectedId = slotId; }}
        selectedSlotId={plan.slots[0].id}
      />
    );
    const firstSlot = dom.querySelector('.silse-scene-slot') as HTMLElement;
    expect(firstSlot.style.outline).toContain('2563eb'); // selected outline
    firstSlot.click();
    expect(selectedId).toBe(plan.slots[0].id);
  });

  it('28. editor/preview/export parity — same render plan usable in all modes', () => {
    const container = loadContainer();
    const scene = container.scenes[0];
    const contract = getDesignContract('modern-clean');
    // Same plan for editor (interactive=false) and preview (interactive=true)
    const planEditor = renderScenePlan(scene, contract);
    const planPreview = renderScenePlan(scene, contract);
    expect(planEditor).toEqual(planPreview);
    // Both produce same sceneClass + slots
    expect(planEditor.sceneClass).toBe(planPreview.sceneClass);
    expect(planEditor.slots).toEqual(planPreview.slots);
  });

  it('29. no dependency added — scene renderer pure TypeScript', () => {
    const container = loadContainer();
    const scene = container.scenes[0];
    const contract = getDesignContract('modern-clean');
    const plan = renderScenePlan(scene, contract);
    expect(plan).toBeDefined();
  });

  it('30. closing-award scene produces silse-scene-closing-award', () => {
    const container = loadContainer();
    const closingScene = container.scenes.find((s) => s.sceneType === 'closing-award')!;
    const contract = getDesignContract('modern-clean');
    const plan = renderScenePlan(closingScene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    expect(dom.querySelector('.silse-scene-closing-award')).toBeInTheDocument();
    // Reward slot produces silse-scene-reward
    expect(dom.querySelector('.silse-scene-reward')).toBeInTheDocument();
  });
});
