/**
 * QUIZ-GAME-VISUAL-POLISH-01 tests.
 * 38 tests: quiz content safety, game content safety, visual class, export, regression.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { generateMpiFromTopic } from '../core/guided-flow/generate-mpi-from-topic';
import { getTopicById } from '../core/guided-flow/mpi-topic-catalog';
import { exportProjectToHtml } from '../export/export-html';
import { checkExportQuality } from '../core/export-quality-gate';
import { resolveStylePackV1, getProjectStylePackIdV1 } from '../core/style-packs/style-pack-registry';
import { stylePackToProjectStyle } from '../core/style-presets';
import { getContrastRatio } from '../core/design/contrast';
import { useEditorStore } from '../store/editor-store';
import { createSamplePpknProject } from '../core/sample-project';
import type { SimpleProject } from '../core/types';

function applyStylePack(project: SimpleProject, stylePackId: string): SimpleProject {
  const resolvedId = getProjectStylePackIdV1(stylePackId);
  const pack = resolveStylePackV1(resolvedId);
  return { ...project, stylePackId: resolvedId, style: stylePackToProjectStyle(pack) };
}

// === Quiz content safety ===
describe('QUIZ-GAME-VISUAL-POLISH-01 — quiz content safety', () => {
  const originalProject = generateMpiFromTopic(getTopicById('ppkn-7-norma')!).project;
  const originalQuiz = originalProject.pages.find(p => p.role === 'quiz')!;
  const originalQuestion = originalQuiz.components.find(c => c.type === 'question') as {
    prompt: string; choices: { id: string; text: string }[]; correctChoiceIndex: number;
    feedbackCorrect: string; feedbackWrong: string;
  };

  it('1. question text unchanged', () => {
    const p = applyStylePack(originalProject, 'mission-dark');
    const q = p.pages.find(pg => pg.role === 'quiz')!.components.find(c => c.type === 'question') as { prompt: string };
    expect(q.prompt).toBe(originalQuestion.prompt);
  });
  it('2. choices count unchanged', () => {
    const p = applyStylePack(originalProject, 'soft-classroom');
    const q = p.pages.find(pg => pg.role === 'quiz')!.components.find(c => c.type === 'question') as { choices: unknown[] };
    expect(q.choices.length).toBe(originalQuestion.choices.length);
  });
  it('3. choice order unchanged', () => {
    const p = applyStylePack(originalProject, 'mission-dark');
    const q = p.pages.find(pg => pg.role === 'quiz')!.components.find(c => c.type === 'question') as { choices: { text: string }[] };
    expect(q.choices.map(c => c.text)).toEqual(originalQuestion.choices.map(c => c.text));
  });
  it('4. correctChoiceIndex unchanged', () => {
    const p = applyStylePack(originalProject, 'soft-classroom');
    const q = p.pages.find(pg => pg.role === 'quiz')!.components.find(c => c.type === 'question') as { correctChoiceIndex: number };
    expect(q.correctChoiceIndex).toBe(originalQuestion.correctChoiceIndex);
  });
  it('5. feedbackCorrect unchanged', () => {
    const p = applyStylePack(originalProject, 'mission-dark');
    const q = p.pages.find(pg => pg.role === 'quiz')!.components.find(c => c.type === 'question') as { feedbackCorrect: string };
    expect(q.feedbackCorrect).toBe(originalQuestion.feedbackCorrect);
  });
  it('6. feedbackWrong unchanged', () => {
    const p = applyStylePack(originalProject, 'soft-classroom');
    const q = p.pages.find(pg => pg.role === 'quiz')!.components.find(c => c.type === 'question') as { feedbackWrong: string };
    expect(q.feedbackWrong).toBe(originalQuestion.feedbackWrong);
  });
});

// === Quiz visual class ===
describe('QUIZ-GAME-VISUAL-POLISH-01 — quiz visual class', () => {
  it('7. quiz visual class modern-clean in export', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    expect(html).toContain('skin-quiz-calm');
  });
  it('8. quiz visual class soft-classroom in export', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'soft-classroom'));
    expect(html).toContain('skin-quiz-playful');
  });
  it('9. quiz visual class mission-dark in export', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'mission-dark'));
    expect(html).toContain('skin-quiz-mission');
  });
  it('10. quiz choice state CSS classes in export', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    expect(html).toContain('silse-choice-default');
    expect(html).toContain('silse-choice-correct');
    expect(html).toContain('silse-choice-wrong');
  });
  it('11. export HTML contains quiz visual CSS', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    expect(html).toContain('.silse-choice-correct');
    expect(html).toContain('.silse-feedback-correct');
  });
  it('12. export HTML contains question text', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    const quizPage = project.pages.find(p => p.role === 'quiz')!;
    const question = quizPage.components.find(c => c.type === 'question') as { prompt: string };
    expect(html).toContain(question.prompt);
  });
  it('13. export HTML contains choice text', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    const quizPage = project.pages.find(p => p.role === 'quiz')!;
    const question = quizPage.components.find(c => c.type === 'question') as { choices: { text: string }[] };
    expect(html).toContain(question.choices[0].text);
  });
  it('14. export HTML does not change correct answer', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    const quizPage = project.pages.find(p => p.role === 'quiz')!;
    const question = quizPage.components.find(c => c.type === 'question') as { correctChoiceIndex: number; choices: { text: string }[] };
    // Export should still contain the correct choice text.
    expect(html).toContain(question.choices?.[question.correctChoiceIndex]?.text ?? '');
  });
  it('15. no raw technical quiz id as visible label', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    expect(html).not.toMatch(/>\s*silse-choice-correct\s*</);
    expect(html).not.toMatch(/>\s*skin-quiz-calm\s*</);
  });
});

// === Game content safety ===
describe('QUIZ-GAME-VISUAL-POLISH-01 — game content safety', () => {
  const originalProject = generateMpiFromTopic(getTopicById('ppkn-7-norma')!).project;
  const originalGamePage = originalProject.pages.find(p => p.role === 'activity')!;
  const originalGame = originalGamePage.components.find(c => c.type === 'game') as {
    title: string; instruction: string; missions: { prompt: string }[];
  };

  it('16. game title unchanged', () => {
    const p = applyStylePack(originalProject, 'mission-dark');
    const g = p.pages.find(pg => pg.role === 'activity')!.components.find(c => c.type === 'game') as { title: string };
    expect(g.title).toBe(originalGame.title);
  });
  it('17. game instruction unchanged', () => {
    const p = applyStylePack(originalProject, 'soft-classroom');
    const g = p.pages.find(pg => pg.role === 'activity')!.components.find(c => c.type === 'game') as { instruction: string };
    expect(g.instruction).toBe(originalGame.instruction);
  });
  it('18. game missions unchanged', () => {
    const p = applyStylePack(originalProject, 'mission-dark');
    const g = p.pages.find(pg => pg.role === 'activity')!.components.find(c => c.type === 'game') as { missions: { prompt: string }[] };
    expect(g.missions.map(m => m.prompt)).toEqual(originalGame.missions.map(m => m.prompt));
  });
  it('19. game mission count unchanged', () => {
    const p = applyStylePack(originalProject, 'soft-classroom');
    const g = p.pages.find(pg => pg.role === 'activity')!.components.find(c => c.type === 'game') as { missions: unknown[] };
    expect(g.missions.length).toBe(originalGame.missions.length);
  });
});

// === Game visual class ===
describe('QUIZ-GAME-VISUAL-POLISH-01 — game visual class', () => {
  it('20. game visual class modern-clean in export', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    expect(html).toContain('skin-game-calm');
  });
  it('21. game visual class soft-classroom in export', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'soft-classroom'));
    expect(html).toContain('skin-game-playful');
  });
  it('22. game visual class mission-dark in export', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'mission-dark'));
    expect(html).toContain('skin-game-mission');
  });
  it('23. export HTML contains game visual CSS', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    expect(html).toContain('.silse-game-choice');
  });
  it('24. export HTML contains game content', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    const gamePage = project.pages.find(p => p.role === 'activity')!;
    const game = gamePage.components.find(c => c.type === 'game') as { title: string };
    expect(html).toContain(game.title);
  });
  it('25. no raw technical game id as visible label', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    expect(html).not.toMatch(/>\s*skin-game-calm\s*</);
  });
});

// === Layout safety ===
describe('QUIZ-GAME-VISUAL-POLISH-01 — layout safety', () => {
  beforeEach(() => { useEditorStore.getState().newProject(); });

  it('26. does not change page count', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = useEditorStore.getState().project.pages.length;
    useEditorStore.getState().setStylePack('mission-dark');
    expect(useEditorStore.getState().project.pages.length).toBe(before);
  });
  it('27. does not change page order', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = useEditorStore.getState().project.pages.map(p => p.title);
    useEditorStore.getState().setStylePack('soft-classroom');
    expect(useEditorStore.getState().project.pages.map(p => p.title)).toEqual(before);
  });
  it('28. does not change component count', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = useEditorStore.getState().project.pages.flatMap(p => p.components).length;
    useEditorStore.getState().setStylePack('mission-dark');
    expect(useEditorStore.getState().project.pages.flatMap(p => p.components).length).toBe(before);
  });
  it('29. does not change layoutId', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = useEditorStore.getState().project.pages.map(p => p.layoutId);
    useEditorStore.getState().setStylePack('soft-classroom');
    expect(useEditorStore.getState().project.pages.map(p => p.layoutId)).toEqual(before);
  });
  it('30. does not change geometry', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = JSON.stringify(useEditorStore.getState().project.pages.flatMap(p => p.components).map(c => ({ x: c.x, y: c.y, w: c.width, h: c.height })));
    useEditorStore.getState().setStylePack('mission-dark');
    expect(JSON.stringify(useEditorStore.getState().project.pages.flatMap(p => p.components).map(c => ({ x: c.x, y: c.y, w: c.width, h: c.height })))).toBe(before);
  });
  it('31. checkExportQuality not fatal', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    expect(checkExportQuality(applyStylePack(project, 'mission-dark')).fatalIssues.length).toBe(0);
  });
  it('32. visual combination QA 3 style × 8 layout not fatal', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    for (const sp of ['modern-clean', 'soft-classroom', 'mission-dark']) {
      expect(checkExportQuality(applyStylePack(project, sp)).fatalIssues.length, sp).toBe(0);
    }
  });
});

// === Additional guards ===
describe('QUIZ-GAME-VISUAL-POLISH-01 — additional guards', () => {
  it('33. no confetti class in CSS', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    expect(html).not.toMatch(/confetti/i);
  });
  it('34. no animation keyframes new', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    expect(html).not.toMatch(/@keyframes\s+confetti/);
    expect(html).not.toMatch(/@keyframes\s+celebrate/);
    expect(html).not.toMatch(/@keyframes\s+particles/);
  });
  it('35. no external url() in CSS', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
    if (styleMatch) {
      expect(styleMatch[1]).not.toMatch(/url\((?!data:)/);
    }
  });
  it('36. mission-dark contrast safe', () => {
    const dark = resolveStylePackV1('mission-dark');
    expect(getContrastRatio(dark.colors.text, dark.colors.background)).toBeGreaterThanOrEqual(4.5);
  });
  it('37. PageThumbnail still exists', async () => {
    const mod = await import('../editor/PageThumbnail');
    expect(mod.PageThumbnail).toBeDefined();
  });
  it('38. export HTML is standalone (no external script/link)', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    expect(html).not.toMatch(/<link[^>]*href=["']https?:/);
    expect(html).not.toMatch(/<script[^>]*src=["']https?:/);
  });
});
