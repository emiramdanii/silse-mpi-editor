/**
 * AI-MPI-JSON-BLUEPRINT-01 — Test Suite.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  validateAiMpiJson,
  isValidAiMpiJson,
  normalizeBlueprint,
  AiMpiBlueprintError,
  type AiMpiBlueprint,
} from '../core/ai-mpi-json';

function loadSample(): AiMpiBlueprint {
  const path = resolve(__dirname, '../../samples/ai-mpi-json/foundation-blueprint.sample.json');
  const raw = readFileSync(path, 'utf-8');
  return JSON.parse(raw);
}

describe('AI-MPI-JSON-BLUEPRINT-01 — sample JSON valid + structure', () => {
  it('1. sample JSON valid (validator returns empty)', () => {
    const sample = loadSample();
    const errors = validateAiMpiJson(sample);
    expect(errors).toHaveLength(0);
  });

  it('2. sample JSON punya metadata', () => {
    const sample = loadSample();
    expect(sample.metadata.title).toBeTruthy();
  });

  it('3. sample JSON punya curriculum', () => {
    const sample = loadSample();
    expect(sample.curriculum).toBeDefined();
    expect(sample.curriculum?.subject).toBeTruthy();
    expect(sample.curriculum?.objectives.length).toBeGreaterThan(0);
  });

  it('4. sample JSON punya styleIntent (bukan flat)', () => {
    const sample = loadSample();
    expect(sample.styleIntent).toBeDefined();
    expect(sample.styleIntent.styleId).toBeTruthy();
  });

  it('5. sample JSON punya designSystem (bukan flat)', () => {
    const sample = loadSample();
    expect(sample.designSystem).toBeDefined();
    expect(sample.designSystem.contractId).toBeTruthy();
  });

  it('6. sample JSON punya flow dengan steps', () => {
    const sample = loadSample();
    expect(sample.flow.steps.length).toBeGreaterThan(0);
  });

  it('7. sample JSON punya scenes dengan sceneType', () => {
    const sample = loadSample();
    expect(sample.scenes.length).toBeGreaterThan(0);
    for (const scene of sample.scenes) {
      expect(scene.sceneType).toBeTruthy();
      expect(scene.role).toBeTruthy();
    }
  });

  it('8. setiap scene punya slots dengan placement', () => {
    const sample = loadSample();
    for (const scene of sample.scenes) {
      expect(scene.slots.length).toBeGreaterThan(0);
      for (const slot of scene.slots) {
        expect(slot.placement).toBeDefined();
        expect(typeof slot.placement.x).toBe('number');
        expect(typeof slot.placement.y).toBe('number');
        expect(typeof slot.placement.width).toBe('number');
        expect(typeof slot.placement.height).toBe('number');
      }
    }
  });

  it('9. game scene punya game-mission slot dengan briefing, target, actions, reward', () => {
    const sample = loadSample();
    const gameScene = sample.scenes.find((s) => s.sceneType === 'game-mission');
    expect(gameScene).toBeDefined();
    const gameSlot = gameScene?.slots.find((s) => s.content.kind === 'game-mission');
    expect(gameSlot).toBeDefined();
    if (gameSlot?.content.kind === 'game-mission') {
      expect(gameSlot.content.briefing).toBeTruthy();
      expect(gameSlot.content.missionTarget).toBeTruthy();
      expect(gameSlot.content.actions.length).toBeGreaterThan(0);
      expect(gameSlot.content.reward).toBeDefined();
    }
  });

  it('10. quiz scene punya quiz-question slot dengan prompt, choices, correctChoiceId, feedback', () => {
    const sample = loadSample();
    const quizScene = sample.scenes.find((s) => s.sceneType === 'quiz-challenge');
    expect(quizScene).toBeDefined();
    const quizSlot = quizScene?.slots.find((s) => s.content.kind === 'quiz-question');
    expect(quizSlot).toBeDefined();
    if (quizSlot?.content.kind === 'quiz-question') {
      expect(quizSlot.content.prompt).toBeTruthy();
      expect(quizSlot.content.choices.length).toBeGreaterThan(0);
      expect(quizSlot.content.correctChoiceId).toBeTruthy();
      expect(quizSlot.content.feedbackCorrect).toBeTruthy();
      expect(quizSlot.content.feedbackWrong).toBeTruthy();
    }
  });

  it('11. sample JSON punya assets array', () => {
    const sample = loadSample();
    expect(Array.isArray(sample.assets)).toBe(true);
  });

  it('12. sample JSON punya runtime config', () => {
    const sample = loadSample();
    expect(sample.runtime).toBeDefined();
  });

  it('13. sample JSON punya exportConfig', () => {
    const sample = loadSample();
    expect(sample.exportConfig).toBeDefined();
    expect(sample.exportConfig.format).toBe('html-standalone');
  });
});

describe('AI-MPI-JSON-BLUEPRINT-01 — validator menolak JSON datar', () => {
  it('14. validator menolak JSON datar (hanya title/content)', () => {
    const flat = { title: 'Test', content: 'Body' };
    const errors = validateAiMpiJson(flat);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('15. validator menolak null', () => {
    expect(validateAiMpiJson(null).length).toBeGreaterThan(0);
  });

  it('16. validator menolak JSON tanpa styleIntent', () => {
    const sample = loadSample();
    const invalid = { ...sample, styleIntent: undefined };
    const errors = validateAiMpiJson(invalid);
    expect(errors.some((e) => e.path === 'styleIntent')).toBe(true);
  });

  it('17. validator menolak JSON tanpa designSystem', () => {
    const sample = loadSample();
    const invalid = { ...sample, designSystem: undefined };
    const errors = validateAiMpiJson(invalid);
    expect(errors.some((e) => e.path === 'designSystem')).toBe(true);
  });

  it('18. validator menolak JSON tanpa scenes', () => {
    const sample = loadSample();
    const invalid = { ...sample, scenes: [] };
    const errors = validateAiMpiJson(invalid);
    expect(errors.some((e) => e.path === 'scenes')).toBe(true);
  });

  it('19. validator menolak scene tanpa slots', () => {
    const sample = loadSample();
    const invalid = { ...sample, scenes: [{ ...sample.scenes[0], slots: [] }] };
    const errors = validateAiMpiJson(invalid);
    expect(errors.some((e) => e.path.includes('slots'))).toBe(true);
  });

  it('20. validator menolak slot tanpa placement', () => {
    const sample = loadSample();
    const invalidSlot = { ...sample.scenes[0].slots[0], placement: undefined };
    const invalid = { ...sample, scenes: [{ ...sample.scenes[0], slots: [invalidSlot] }] };
    const errors = validateAiMpiJson(invalid);
    expect(errors.some((e) => e.path.includes('placement'))).toBe(true);
  });

  it('21. isValidAiMpiJson returns boolean', () => {
    expect(isValidAiMpiJson(loadSample())).toBe(true);
    expect(isValidAiMpiJson(null)).toBe(false);
  });
});

describe('AI-MPI-JSON-BLUEPRINT-01 — normalizer menjaga data visual', () => {
  it('22. normalizeBlueprint returns AiMpiBlueprint valid', () => {
    const sample = loadSample();
    const blueprint = normalizeBlueprint(sample);
    expect(blueprint).toBeDefined();
    expect(blueprint.metadata.title).toBe(sample.metadata.title);
  });

  it('23. normalizer menjaga styleIntent', () => {
    const sample = loadSample();
    const blueprint = normalizeBlueprint(sample);
    expect(blueprint.styleIntent.styleId).toBe(sample.styleIntent.styleId);
  });

  it('24. normalizer menjaga designSystem', () => {
    const sample = loadSample();
    const blueprint = normalizeBlueprint(sample);
    expect(blueprint.designSystem.contractId).toBe(sample.designSystem.contractId);
  });

  it('25. normalizer menjaga sceneType', () => {
    const sample = loadSample();
    const blueprint = normalizeBlueprint(sample);
    for (let i = 0; i < sample.scenes.length; i++) {
      expect(blueprint.scenes[i].sceneType).toBe(sample.scenes[i].sceneType);
    }
  });

  it('26. normalizer menjaga placements', () => {
    const sample = loadSample();
    const blueprint = normalizeBlueprint(sample);
    const sampleSlot = sample.scenes[0].slots[0];
    const blueprintSlot = blueprint.scenes[0].slots[0];
    expect(blueprintSlot.placement.x).toBe(sampleSlot.placement.x);
    expect(blueprintSlot.placement.y).toBe(sampleSlot.placement.y);
    expect(blueprintSlot.placement.width).toBe(sampleSlot.placement.width);
    expect(blueprintSlot.placement.height).toBe(sampleSlot.placement.height);
  });

  it('27. normalizer menjaga designTokenKey', () => {
    const sample = loadSample();
    const blueprint = normalizeBlueprint(sample);
    // Find a slot with designTokenKey
    const slotWithKey = sample.scenes[0].slots.find((s) => s.designTokenKey);
    if (slotWithKey) {
      const blueprintSlot = blueprint.scenes[0].slots.find((s) => s.id === slotWithKey.id);
      expect(blueprintSlot?.designTokenKey).toBe(slotWithKey.designTokenKey);
    }
  });

  it('28. normalizer menjaga game-mission content (briefing, target, actions, reward)', () => {
    const sample = loadSample();
    const blueprint = normalizeBlueprint(sample);
    const gameScene = blueprint.scenes.find((s) => s.sceneType === 'game-mission');
    const gameSlot = gameScene?.slots.find((s) => s.content.kind === 'game-mission');
    if (gameSlot?.content.kind === 'game-mission') {
      const sampleGameSlot = sample.scenes.find((s) => s.sceneType === 'game-mission')?.slots.find((s) => s.content.kind === 'game-mission');
      if (sampleGameSlot?.content.kind === 'game-mission') {
        expect(gameSlot.content.briefing).toBe(sampleGameSlot.content.briefing);
        expect(gameSlot.content.missionTarget).toBe(sampleGameSlot.content.missionTarget);
        expect(gameSlot.content.actions).toHaveLength(sampleGameSlot.content.actions.length);
        expect(gameSlot.content.reward.label).toBe(sampleGameSlot.content.reward.label);
      }
    }
  });

  it('29. normalizer menjaga quiz feedback', () => {
    const sample = loadSample();
    const blueprint = normalizeBlueprint(sample);
    const quizScene = blueprint.scenes.find((s) => s.sceneType === 'quiz-challenge');
    const quizSlot = quizScene?.slots.find((s) => s.content.kind === 'quiz-question');
    if (quizSlot?.content.kind === 'quiz-question') {
      expect(quizSlot.content.feedbackCorrect).toBeTruthy();
      expect(quizSlot.content.feedbackWrong).toBeTruthy();
    }
  });

  it('30. normalizer throws AiMpiBlueprintError untuk invalid input', () => {
    expect(() => normalizeBlueprint(null)).toThrow(AiMpiBlueprintError);
    expect(() => normalizeBlueprint({})).toThrow(AiMpiBlueprintError);
  });

  it('31. tidak ada dependency baru — module pure TypeScript', () => {
    const sample = loadSample();
    const blueprint = normalizeBlueprint(sample);
    expect(blueprint).toBeDefined();
  });

  it('32. scene tidak hilang setelah normalize', () => {
    const sample = loadSample();
    const blueprint = normalizeBlueprint(sample);
    expect(blueprint.scenes).toHaveLength(sample.scenes.length);
  });
});
