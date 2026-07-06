/**
 * S-01 + S-02 + S-03 — Scoring Engine + Real-time Score Display + Progress Bar.
 */

import { describe, it, expect } from 'vitest';

import {
  scoreProject,
  scoreScene,
  getScoreLabel,
  getScoreColor,
} from '../core/scoring/scoring-engine';
import { createSamplePpknProject } from '../core/sample-project';
import { templateToBlueprint, TEMPLATE_PPKN_NORMA } from '../core/guided-flow/pedagogical-templates';
import { aiBlueprintToSimpleProject } from '../core/ai-mpi-json/aiBlueprintToSimpleProject';
import type { SimplePage } from '../core/types';

// Helper: create a page with sceneType + content
function makePage(sceneType: string, content: Record<string, unknown>): SimplePage {
  return {
    id: 'test-page',
    title: 'Test',
    role: 'material',
    layoutId: 'blank',
    background: { type: 'color', color: '#fff' },
    components: [],
    sceneType,
    sceneContent: content,
  } as SimplePage;
}

// ---------------------------------------------------------------------------
// S-01: Scoring Engine
// ---------------------------------------------------------------------------

describe('S-01: Scoring Engine — Kelengkapan Elemen', () => {
  it('1. scoreProject returns 0-100 score', () => {
    const project = createSamplePpknProject();
    const result = scoreProject(project);
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.totalScore).toBeLessThanOrEqual(100);
  });

  it('2. scoreProject returns sceneResults for every page', () => {
    const project = createSamplePpknProject();
    const result = scoreProject(project);
    expect(result.sceneResults.length).toBe(project.pages.length);
  });

  it('3. fully filled scene gets score 100', () => {
    const page = makePage('quiz-challenge', {
      kind: 'quiz-question',
      prompt: 'Apa ibukota Indonesia?',
      choices: [{ id: 'a', text: 'Jakarta' }],
      correctChoiceId: 'a',
      feedbackCorrect: 'Benar',
      feedbackWrong: 'Salah',
    });
    const result = scoreScene(page);
    expect(result.score).toBe(100);
  });

  it('4. scene missing required field gets score < 100', () => {
    const page = makePage('quiz-challenge', {
      kind: 'quiz-question',
      prompt: 'Apa ibukota Indonesia?',
      choices: [{ id: 'a', text: 'Jakarta' }],
      // correctChoiceId missing!
    });
    const result = scoreScene(page);
    expect(result.score).toBeLessThan(100);
    expect(result.missingRequired).toContain('Jawaban benar');
  });

  it('5. empty scene content gets score 0 (if has required fields)', () => {
    const page = makePage('cover-hero', {});
    const result = scoreScene(page);
    expect(result.score).toBe(0);
    expect(result.missingRequired).toContain('Judul utama');
  });

  it('6. scene with no checklist gets score 100 (no required items)', () => {
    const page = makePage('unknown-scene-type', { kind: 'unknown' });
    const result = scoreScene(page);
    expect(result.score).toBe(100);
  });

  it('7. scoreProject returns suggestions for missing fields', () => {
    const page = makePage('cover-hero', {});
    const project = { ...createSamplePpknProject(), pages: [page] };
    const result = scoreProject(project);
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions[0]).toContain('Judul utama');
  });

  it('8. scoreProject counts totalItems + filledItems', () => {
    // Use PPKn template (has sceneType + sceneContent)
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    const project = aiBlueprintToSimpleProject(bp);
    const result = scoreProject(project);
    expect(result.totalItems).toBeGreaterThanOrEqual(0);
    expect(result.filledItems).toBeLessThanOrEqual(result.totalItems);
  });

  it('9. PPKn template scores high (all fields filled)', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    const project = aiBlueprintToSimpleProject(bp);
    const result = scoreProject(project);
    expect(result.totalScore).toBeGreaterThanOrEqual(70);
  });

  it('10. getScoreLabel returns correct label', () => {
    expect(getScoreLabel(95)).toBe('Sangat Baik');
    expect(getScoreLabel(75)).toBe('Baik');
    expect(getScoreLabel(55)).toBe('Cukup');
    expect(getScoreLabel(35)).toBe('Perlu Perbaikan');
    expect(getScoreLabel(15)).toBe('Belum Lengkap');
  });

  it('11. getScoreColor returns correct color', () => {
    expect(getScoreColor(80)).toBe('#16a34a'); // green
    expect(getScoreColor(60)).toBe('#f59e0b'); // amber
    expect(getScoreColor(30)).toBe('#dc2626'); // red
  });

  it('12. isFilled handles various types correctly', () => {
    // Tested indirectly via scoreScene
    const page1 = makePage('cover-hero', { heroTitle: 'Title' });
    expect(scoreScene(page1).score).toBe(100); // required filled

    const page2 = makePage('cover-hero', { heroTitle: '' });
    expect(scoreScene(page2).score).toBe(0); // required empty string

    const page3 = makePage('cover-hero', { heroTitle: null });
    expect(scoreScene(page3).score).toBe(0); // required null

    const page4 = makePage('cover-hero', { heroTitle: undefined });
    expect(scoreScene(page4).score).toBe(0); // required undefined
  });
});

// ---------------------------------------------------------------------------
// S-02 + S-03: Topbar integration (behavior test)
// ---------------------------------------------------------------------------

describe('S-02 + S-03: Topbar Score Display + Progress Bar', () => {
  it('13. Topbar renders score display with data-testid', async () => {
    const { Topbar } = await import('../editor/Topbar');
    const { useEditorStore } = await import('../store/editor-store');
    const { createSamplePpknProject } = await import('../core/sample-project');
    const { render } = await import('@testing-library/react');
    const React = await import('react');
    useEditorStore.setState({ project: createSamplePpknProject() });
    const { container } = render(React.createElement(Topbar));
    const scoreDisplay = container.querySelector('[data-testid="score-display"]');
    expect(scoreDisplay).not.toBeNull();
  });

  it('14. Topbar renders progress bar with data-testid', async () => {
    const { Topbar } = await import('../editor/Topbar');
    const { useEditorStore } = await import('../store/editor-store');
    const { createSamplePpknProject } = await import('../core/sample-project');
    const { render } = await import('@testing-library/react');
    const React = await import('react');
    useEditorStore.setState({ project: createSamplePpknProject() });
    const { container } = render(React.createElement(Topbar));
    const progressBar = container.querySelector('[data-testid="score-progress-bar"]');
    expect(progressBar).not.toBeNull();
  });

  it('15. Topbar score display shows numeric score 0-100', async () => {
    const { Topbar } = await import('../editor/Topbar');
    const { useEditorStore } = await import('../store/editor-store');
    const { createSamplePpknProject } = await import('../core/sample-project');
    const { render } = await import('@testing-library/react');
    const React = await import('react');
    useEditorStore.setState({ project: createSamplePpknProject() });
    const { container } = render(React.createElement(Topbar));
    const scoreDisplay = container.querySelector('[data-testid="score-display"]');
    const text = scoreDisplay?.textContent || '';
    // Should contain a number 0-100
    expect(text).toMatch(/\d+/);
  });

  it('16. Topbar score display shows score label (Sangat Baik/Baik/Cukup/dll)', async () => {
    const { Topbar } = await import('../editor/Topbar');
    const { useEditorStore } = await import('../store/editor-store');
    const { createSamplePpknProject } = await import('../core/sample-project');
    const { render } = await import('@testing-library/react');
    const React = await import('react');
    useEditorStore.setState({ project: createSamplePpknProject() });
    const { container } = render(React.createElement(Topbar));
    const scoreDisplay = container.querySelector('[data-testid="score-display"]');
    const text = scoreDisplay?.textContent || '';
    // Should contain one of the labels
    const labels = ['Sangat Baik', 'Baik', 'Cukup', 'Perlu Perbaikan', 'Belum Lengkap'];
    expect(labels.some((l) => text.includes(l))).toBe(true);
  });
});
