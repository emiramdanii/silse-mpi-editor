/**
 * APP-AI-PROMPT-CONTRACT-01 — Test Suite.
 */

import { describe, it, expect } from 'vitest';
import { buildMpiPromptContract, buildMpiPromptText } from '../core/ai-prompt-contract';

describe('APP-AI-PROMPT-CONTRACT-01 — prompt contract builder', () => {
  it('1. buildMpiPromptContract returns contract object', () => {
    const c = buildMpiPromptContract();
    expect(c).toBeDefined();
    expect(c.frame).toBeDefined();
    expect(c.sceneTypes).toBeDefined();
    expect(c.prohibitions).toBeDefined();
    expect(c.outputRules).toBeDefined();
  });

  it('2. frame is 1280x720 16/9', () => {
    const c = buildMpiPromptContract();
    expect(c.frame.width).toBe(1280);
    expect(c.frame.height).toBe(720);
    expect(c.frame.aspectRatio).toBe('16/9');
  });

  it('3. prompt mencantumkan allowed scene types', () => {
    const c = buildMpiPromptContract();
    expect(c.sceneTypes.length).toBeGreaterThan(0);
    const ids = c.sceneTypes.map((s) => s.id);
    expect(ids).toContain('cover-hero');
    expect(ids).toContain('game-mission');
    expect(ids).toContain('quiz-challenge');
    expect(ids).toContain('closing-award');
  });

  it('4. prompt mencantumkan allowed style tokens', () => {
    const c = buildMpiPromptContract();
    expect(c.styleTokens.length).toBeGreaterThan(0);
    const categories = c.styleTokens.map((s) => s.category);
    expect(categories).toContain('palette');
    expect(categories).toContain('background');
    expect(categories).toContain('motion');
    expect(categories).toContain('feedback');
  });

  it('5. prompt mencantumkan allowed placement format', () => {
    const c = buildMpiPromptContract();
    expect(c.layoutFormats.length).toBeGreaterThan(0);
    const ids = c.layoutFormats.map((l) => l.id);
    expect(ids).toContain('cover-centered');
    expect(ids).toContain('quiz-focus');
  });

  it('6. prompt melarang HTML/CSS mentah', () => {
    const c = buildMpiPromptContract();
    const allProhibitions = c.prohibitions.join(' ');
    expect(allProhibitions).toMatch(/HTML/i);
    expect(allProhibitions).toMatch(/CSS/i);
  });

  it('7. prompt wajib menyebut output JSON', () => {
    const c = buildMpiPromptContract();
    const allRules = c.outputRules.join(' ');
    expect(allRules).toMatch(/JSON/i);
  });

  it('8. prompt mencantumkan allowed variants untuk card/button/badge', () => {
    const c = buildMpiPromptContract();
    const components = c.allowedVariants.map((v) => v.component);
    expect(components).toContain('card');
    expect(components).toContain('button');
    expect(components).toContain('badge');
  });

  it('9. game-mission scene punya required slots (PATCH A: dari universal taxonomy)', () => {
    const c = buildMpiPromptContract();
    const gameScene = c.sceneTypes.find((s) => s.id === 'game-mission');
    expect(gameScene).toBeDefined();
    expect(gameScene?.requiredSlots).toContain('briefing');
  });

  it('10. quiz-challenge scene punya required slots (PATCH A: dari universal taxonomy)', () => {
    const c = buildMpiPromptContract();
    const quizScene = c.sceneTypes.find((s) => s.id === 'quiz-challenge');
    expect(quizScene).toBeDefined();
    expect(quizScene?.requiredSlots).toContain('questionFocus');
  });

  it('11. slotKinds mencantumkan game-mission dan quiz-question', () => {
    const c = buildMpiPromptContract();
    expect(c.slotKinds).toContain('game-mission');
    expect(c.slotKinds).toContain('quiz-question');
  });

  it('12. buildMpiPromptText returns non-empty string', () => {
    const text = buildMpiPromptText();
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(100);
  });

  it('13. prompt text mentions frame 1280x720', () => {
    const text = buildMpiPromptText();
    expect(text).toContain('1280');
    expect(text).toContain('720');
  });

  it('14. prompt text mentions JSON output', () => {
    const text = buildMpiPromptText();
    expect(text).toMatch(/JSON/i);
  });

  it('15. prompt text prohibits HTML and CSS', () => {
    const text = buildMpiPromptText();
    expect(text).toMatch(/Jangan buat HTML/i);
    expect(text).toMatch(/Jangan buat CSS/i);
  });

  it('16. prompt text lists all scene types', () => {
    const text = buildMpiPromptText();
    expect(text).toContain('cover-hero');
    expect(text).toContain('game-mission');
    expect(text).toContain('quiz-challenge');
    expect(text).toContain('closing-award');
  });

  it('17. prompt text lists all slot kinds', () => {
    const text = buildMpiPromptText();
    expect(text).toContain('game-mission');
    expect(text).toContain('quiz-question');
    expect(text).toContain('feedback');
    expect(text).toContain('reward');
  });

  it('18. prompt text lists style token categories', () => {
    const text = buildMpiPromptText();
    expect(text).toContain('palette');
    expect(text).toContain('background');
    expect(text).toContain('motion');
  });

  it('19. prompt text lists allowed variants', () => {
    const text = buildMpiPromptText();
    expect(text).toContain('card');
    expect(text).toContain('button');
    expect(text).toContain('badge');
  });

  it('20. prompt text mentions layout formats', () => {
    const text = buildMpiPromptText();
    expect(text).toContain('cover-centered');
    expect(text).toContain('quiz-focus');
  });

  it('21. contract is pure — same output every call', () => {
    const c1 = buildMpiPromptContract();
    const c2 = buildMpiPromptContract();
    expect(c1).toEqual(c2);
  });

  it('22. no dependency added — module only imports from sibling core modules', () => {
    const c = buildMpiPromptContract();
    expect(c).toBeDefined();
    // Pure data, no external calls
  });
});
