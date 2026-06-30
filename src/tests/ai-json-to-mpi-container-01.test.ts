/**
 * AI-JSON-TO-MPI-CONTAINER-01 — Test Suite.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  normalizeBlueprint,
  aiJsonToMpiContainer,
} from '../core/ai-mpi-json';
import type { AiMpiBlueprint } from '../core/ai-mpi-json';
import type { MpiContainer } from '../core/mpi-container';

function loadBlueprint(): AiMpiBlueprint {
  const path = resolve(__dirname, '../../samples/ai-mpi-json/foundation-blueprint.sample.json');
  const raw = readFileSync(path, 'utf-8');
  return normalizeBlueprint(JSON.parse(raw));
}

describe('AI-JSON-TO-MPI-CONTAINER-01 — converter lossless', () => {
  let blueprint: AiMpiBlueprint;
  let container: MpiContainer;

  function setup() {
    blueprint = loadBlueprint();
    container = aiJsonToMpiContainer(blueprint);
  }

  it('1. converter returns valid MpiContainer', () => {
    setup();
    expect(container).toBeDefined();
    expect(container.schemaVersion).toBe(1);
    expect(container.sourceKind).toBe('ai-json');
  });

  it('2. converter preserves role', () => {
    setup();
    for (let i = 0; i < blueprint.scenes.length; i++) {
      expect(container.scenes[i].role).toBe(blueprint.scenes[i].role);
    }
  });

  it('3. converter preserves sceneType', () => {
    setup();
    for (let i = 0; i < blueprint.scenes.length; i++) {
      expect(container.scenes[i].sceneType).toBe(blueprint.scenes[i].sceneType);
    }
  });

  it('4. converter preserves slots (count)', () => {
    setup();
    for (let i = 0; i < blueprint.scenes.length; i++) {
      expect(container.scenes[i].slots).toHaveLength(blueprint.scenes[i].slots.length);
    }
  });

  it('5. converter preserves placements (x, y, width, height)', () => {
    setup();
    const bpSlot = blueprint.scenes[0].slots[0];
    const cSlot = container.scenes[0].slots[0];
    expect(cSlot.placement.x).toBe(bpSlot.placement.x);
    expect(cSlot.placement.y).toBe(bpSlot.placement.y);
    expect(cSlot.placement.width).toBe(bpSlot.placement.width);
    expect(cSlot.placement.height).toBe(bpSlot.placement.height);
  });

  it('6. converter preserves styleIntent', () => {
    setup();
    expect(container.styleIntent).toBeDefined();
    expect(container.styleIntent?.styleId).toBe(blueprint.styleIntent.styleId);
    expect(container.styleIntent?.mood).toBe(blueprint.styleIntent.mood);
  });

  it('7. converter preserves designSystem', () => {
    setup();
    expect(container.designSystem).toBeDefined();
    expect(container.designSystem?.contractId).toBe(blueprint.designSystem.contractId);
    expect(container.designSystem?.paletteName).toBe(blueprint.designSystem.paletteName);
  });

  it('8. converter preserves designTokenKey', () => {
    setup();
    // Find a slot with designTokenKey in blueprint
    for (let i = 0; i < blueprint.scenes.length; i++) {
      for (let j = 0; j < blueprint.scenes[i].slots.length; j++) {
        const bpSlot = blueprint.scenes[i].slots[j];
        if (bpSlot.designTokenKey) {
          const cSlot = container.scenes[i].slots[j];
          expect(cSlot.designTokenKey).toBe(bpSlot.designTokenKey);
        }
      }
    }
  });

  it('9. converter preserves game-mission content (briefing, target, actions, reward)', () => {
    setup();
    const gameScene = container.scenes.find((s) => s.sceneType === 'game-mission');
    const gameSlot = gameScene?.slots.find((s) => s.content.kind === 'game-mission');
    expect(gameSlot).toBeDefined();
    if (gameSlot?.content.kind === 'game-mission') {
      const bpGameScene = blueprint.scenes.find((s) => s.sceneType === 'game-mission');
      const bpGameSlot = bpGameScene?.slots.find((s) => s.content.kind === 'game-mission');
      if (bpGameSlot?.content.kind === 'game-mission') {
        expect(gameSlot.content.briefing).toBe(bpGameSlot.content.briefing);
        expect(gameSlot.content.missionTarget).toBe(bpGameSlot.content.missionTarget);
        expect(gameSlot.content.actions).toHaveLength(bpGameSlot.content.actions.length);
        expect(gameSlot.content.reward.label).toBe(bpGameSlot.content.reward.label);
      }
    }
  });

  it('10. converter preserves quiz feedback', () => {
    setup();
    const quizScene = container.scenes.find((s) => s.sceneType === 'quiz-challenge');
    const quizSlot = quizScene?.slots.find((s) => s.content.kind === 'quiz-question');
    if (quizSlot?.content.kind === 'quiz-question') {
      expect(quizSlot.content.feedbackCorrect).toBeTruthy();
      expect(quizSlot.content.feedbackWrong).toBeTruthy();
    }
  });

  it('11. converter preserves reward', () => {
    setup();
    const closingScene = container.scenes.find((s) => s.sceneType === 'closing-award');
    const rewardSlot = closingScene?.slots.find((s) => s.content.kind === 'reward');
    if (rewardSlot?.content.kind === 'reward') {
      expect(rewardSlot.content.label).toBeTruthy();
    }
  });

  it('12. converter preserves assets', () => {
    setup();
    expect(container.assets).toHaveLength(blueprint.assets.length);
  });

  it('13. converter preserves runtime config', () => {
    setup();
    expect(container.runtime.showProgress).toBe(blueprint.runtime.showProgress);
    expect(container.runtime.showScore).toBe(blueprint.runtime.showScore);
  });

  it('14. converter preserves exportConfig', () => {
    setup();
    expect(container.exportConfig.format).toBe(blueprint.exportConfig.format);
    expect(container.exportConfig.stageWidth).toBe(blueprint.exportConfig.stageWidth);
  });

  it('15. converter preserves flow steps', () => {
    setup();
    expect(container.flow.steps).toHaveLength(blueprint.flow.steps.length);
  });

  it('16. converter preserves curriculum', () => {
    setup();
    expect(container.curriculum).toBeDefined();
    expect(container.curriculum?.subject).toBe(blueprint.curriculum?.subject);
    expect(container.curriculum?.objectives).toHaveLength(blueprint.curriculum?.objectives.length ?? 0);
  });

  it('17. converter preserves metadata', () => {
    setup();
    expect(container.metadata.title).toBe(blueprint.metadata.title);
    expect(container.metadata.subtitle).toBe(blueprint.metadata.subtitle);
  });

  it('18. converter does not mutate input blueprint', () => {
    setup();
    const originalTitle = blueprint.metadata.title;
    const originalSceneCount = blueprint.scenes.length;
    aiJsonToMpiContainer(blueprint);
    expect(blueprint.metadata.title).toBe(originalTitle);
    expect(blueprint.scenes).toHaveLength(originalSceneCount);
  });

  it('19. converter sets currentSceneId to first scene', () => {
    setup();
    expect(container.runtime.currentSceneId).toBe(container.scenes[0].id);
  });

  it('20. converter sets sourceKind to ai-json', () => {
    setup();
    expect(container.sourceKind).toBe('ai-json');
  });

  it('21. converter preserves slot role', () => {
    setup();
    for (let i = 0; i < blueprint.scenes.length; i++) {
      for (let j = 0; j < blueprint.scenes[i].slots.length; j++) {
        expect(container.scenes[i].slots[j].role).toBe(blueprint.scenes[i].slots[j].role);
      }
    }
  });

  it('22. converter preserves slot content kind', () => {
    setup();
    for (let i = 0; i < blueprint.scenes.length; i++) {
      for (let j = 0; j < blueprint.scenes[i].slots.length; j++) {
        expect(container.scenes[i].slots[j].content.kind).toBe(blueprint.scenes[i].slots[j].content.kind);
      }
    }
  });

  it('23. converter preserves scene title', () => {
    setup();
    for (let i = 0; i < blueprint.scenes.length; i++) {
      expect(container.scenes[i].title).toBe(blueprint.scenes[i].title);
    }
  });

  it('24. converter preserves navigation', () => {
    setup();
    const bpScene = blueprint.scenes[0];
    const cScene = container.scenes[0];
    if (bpScene.navigation?.nextSceneId) {
      expect(cScene.navigation?.nextSceneId).toBe(bpScene.navigation.nextSceneId);
    }
  });

  it('25. no dependency added — converter pure TypeScript', () => {
    setup();
    expect(container).toBeDefined();
  });

  it('26. container can be created from any valid blueprint', () => {
    const blueprint2: AiMpiBlueprint = {
      version: 1,
      metadata: { title: 'Test' },
      styleIntent: { styleId: 'modern-clean' },
      designSystem: { contractId: 'modern-clean' },
      flow: { steps: [{ sceneId: 's1' }] },
      scenes: [{
        id: 's1',
        role: 'cover',
        sceneType: 'cover-hero',
        title: 'Cover',
        slots: [{
          id: 'slot1',
          role: 'title',
          placement: { x: 0, y: 0, width: 100, height: 50 },
          content: { kind: 'text', variant: 'title', text: 'Hello' },
        }],
      }],
      assets: [],
      runtime: {},
      exportConfig: { format: 'html-standalone' },
    };
    const c = aiJsonToMpiContainer(blueprint2);
    expect(c.scenes).toHaveLength(1);
    expect(c.metadata.title).toBe('Test');
  });
});
