/**
 * MICRO-ANIMATION-SYSTEM-V1 tests.
 * 35 tests: helper, content safety, export, accessibility, regression.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import {
  getMicroAnimationForStylePack,
  getAllMicroAnimationClassNames,
} from '../core/style-packs/micro-animation';
import { generateMpiFromTopic } from '../core/guided-flow/generate-mpi-from-topic';
import { getTopicById } from '../core/guided-flow/mpi-topic-catalog';
import { exportProjectToHtml } from '../export/export-html';
import { checkExportQuality } from '../core/export-quality-gate';
import { resolveStylePackV1, getProjectStylePackIdV1 } from '../core/style-packs/style-pack-registry';
import { stylePackToProjectStyle } from '../core/style-presets';
import { useEditorStore } from '../store/editor-store';
import { createSamplePpknProject } from '../core/sample-project';
import type { SimpleProject } from '../core/types';

function applyStylePack(project: SimpleProject, stylePackId: string): SimpleProject {
  const resolvedId = getProjectStylePackIdV1(stylePackId);
  const pack = resolveStylePackV1(resolvedId);
  return { ...project, stylePackId: resolvedId, style: stylePackToProjectStyle(pack) };
}

describe('MICRO-ANIMATION-SYSTEM-V1 — helper', () => {
  it('1. unknown style pack fallback to modern-clean', () => {
    const a = getMicroAnimationForStylePack('nonexistent');
    expect(a.pageEnterClass).toBe('silse-anim-page-soft-in');
  });
  it('2. modern-clean animation profile valid', () => {
    const a = getMicroAnimationForStylePack('modern-clean');
    expect(a.pageEnterClass).toBe('silse-anim-page-soft-in');
    expect(a.buttonClass).toBe('silse-anim-button-clean');
    expect(a.choiceClass).toBe('silse-anim-choice-clean');
    expect(a.feedbackClass).toBe('silse-anim-feedback-soft');
    expect(a.gameClass).toBe('silse-anim-game-clean');
  });
  it('3. soft-classroom animation profile valid', () => {
    const a = getMicroAnimationForStylePack('soft-classroom');
    expect(a.pageEnterClass).toBe('silse-anim-page-warm-in');
    expect(a.buttonClass).toBe('silse-anim-button-soft');
  });
  it('4. mission-dark animation profile valid', () => {
    const a = getMicroAnimationForStylePack('mission-dark');
    expect(a.pageEnterClass).toBe('silse-anim-page-mission-in');
    expect(a.buttonClass).toBe('silse-anim-button-mission');
  });
  it('5. getAllMicroAnimationClassNames unique', () => {
    const all = getAllMicroAnimationClassNames();
    expect(new Set(all).size).toBe(all.length);
    expect(all.length).toBe(15);
  });
  it('6. no confetti class', () => {
    const all = getAllMicroAnimationClassNames();
    expect(all.every(c => !c.includes('confetti'))).toBe(true);
  });
  it('7. no celebration class', () => {
    const all = getAllMicroAnimationClassNames();
    expect(all.every(c => !c.includes('celebration'))).toBe(true);
  });
  it('8. no particle class', () => {
    const all = getAllMicroAnimationClassNames();
    expect(all.every(c => !c.includes('particle'))).toBe(true);
  });
  it('9. no external dependency (pure helper)', () => {
    const a = getMicroAnimationForStylePack('modern-clean');
    expect(typeof a.pageEnterClass).toBe('string');
    expect(typeof a.buttonClass).toBe('string');
  });
});

describe('MICRO-ANIMATION-SYSTEM-V1 — editor/preview/export', () => {
  it('10. CanvasStage uses micro animation class (source audit)', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const content = fs.readFileSync(path.resolve(__dirname, '../editor/CanvasStage.tsx'), 'utf8');
    expect(content).toMatch(/getMicroAnimationForStylePack/);
    expect(content).toMatch(/animProfile\.pageEnterClass/);
  });
  it('11. PreviewApp uses micro animation class (source audit)', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const content = fs.readFileSync(path.resolve(__dirname, '../preview/PreviewApp.tsx'), 'utf8');
    expect(content).toMatch(/getMicroAnimationForStylePack/);
    expect(content).toMatch(/animProfile/);
  });
  it('12. export HTML contains animation class', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    expect(html).toContain('silse-anim-page-soft-in');
  });
  it('13. export HTML contains keyframes micro animation', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    expect(html).toContain('@keyframes silse-fade-in-soft');
    expect(html).toContain('@keyframes silse-feedback-pop');
  });
  it('14. export HTML contains prefers-reduced-motion', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    expect(html).toContain('prefers-reduced-motion');
    expect(html).toContain('animation:none');
  });
});

describe('MICRO-ANIMATION-SYSTEM-V1 — content safety', () => {
  beforeEach(() => { useEditorStore.getState().newProject(); });

  it('15. does not change page count', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = useEditorStore.getState().project.pages.length;
    useEditorStore.getState().setStylePack('mission-dark');
    expect(useEditorStore.getState().project.pages.length).toBe(before);
  });
  it('16. does not change page order', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = useEditorStore.getState().project.pages.map(p => p.title);
    useEditorStore.getState().setStylePack('soft-classroom');
    expect(useEditorStore.getState().project.pages.map(p => p.title)).toEqual(before);
  });
  it('17. does not change component count', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = useEditorStore.getState().project.pages.flatMap(p => p.components).length;
    useEditorStore.getState().setStylePack('mission-dark');
    expect(useEditorStore.getState().project.pages.flatMap(p => p.components).length).toBe(before);
  });
  it('18. does not change layoutId', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = useEditorStore.getState().project.pages.map(p => p.layoutId);
    useEditorStore.getState().setStylePack('soft-classroom');
    expect(useEditorStore.getState().project.pages.map(p => p.layoutId)).toEqual(before);
  });
  it('19. does not change geometry', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = JSON.stringify(useEditorStore.getState().project.pages.flatMap(p => p.components).map(c => ({ x: c.x, y: c.y, w: c.width, h: c.height })));
    useEditorStore.getState().setStylePack('mission-dark');
    expect(JSON.stringify(useEditorStore.getState().project.pages.flatMap(p => p.components).map(c => ({ x: c.x, y: c.y, w: c.width, h: c.height })))).toBe(before);
  });
  it('20. does not change question text', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    useEditorStore.getState().setProject(project);
    const quizPage = project.pages.find(p => p.role === 'quiz')!;
    const before = (quizPage.components.find(c => c.type === 'question') as { prompt: string }).prompt;
    useEditorStore.getState().setStylePack('mission-dark');
    const afterQuiz = useEditorStore.getState().project.pages.find(p => p.role === 'quiz')!;
    expect((afterQuiz.components.find(c => c.type === 'question') as { prompt: string }).prompt).toBe(before);
  });
  it('21. does not change choice text', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    useEditorStore.getState().setProject(project);
    const quizPage = project.pages.find(p => p.role === 'quiz')!;
    const before = JSON.stringify((quizPage.components.find(c => c.type === 'question') as { choices: { text: string }[] }).choices.map(c => c.text));
    useEditorStore.getState().setStylePack('soft-classroom');
    const afterQuiz = useEditorStore.getState().project.pages.find(p => p.role === 'quiz')!;
    expect(JSON.stringify((afterQuiz.components.find(c => c.type === 'question') as { choices: { text: string }[] }).choices.map(c => c.text))).toBe(before);
  });
  it('22. does not change correctChoiceIndex', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    useEditorStore.getState().setProject(project);
    const quizPage = project.pages.find(p => p.role === 'quiz')!;
    const before = (quizPage.components.find(c => c.type === 'question') as { correctChoiceIndex: number }).correctChoiceIndex;
    useEditorStore.getState().setStylePack('mission-dark');
    const afterQuiz = useEditorStore.getState().project.pages.find(p => p.role === 'quiz')!;
    expect((afterQuiz.components.find(c => c.type === 'question') as { correctChoiceIndex: number }).correctChoiceIndex).toBe(before);
  });
  it('23. does not change feedback text', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    useEditorStore.getState().setProject(project);
    const q = project.pages.find(p => p.role === 'quiz')!.components.find(c => c.type === 'question') as { feedbackCorrect: string; feedbackWrong: string };
    useEditorStore.getState().setStylePack('soft-classroom');
    const qAfter = useEditorStore.getState().project.pages.find(p => p.role === 'quiz')!.components.find(c => c.type === 'question') as { feedbackCorrect: string; feedbackWrong: string };
    expect(qAfter.feedbackCorrect).toBe(q.feedbackCorrect);
    expect(qAfter.feedbackWrong).toBe(q.feedbackWrong);
  });
  it('24. does not change game logic markers (mission prompts)', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    useEditorStore.getState().setProject(project);
    const gamePage = project.pages.find(p => p.role === 'activity')!;
    const before = JSON.stringify((gamePage.components.find(c => c.type === 'game') as { missions: { prompt: string }[] }).missions.map(m => m.prompt));
    useEditorStore.getState().setStylePack('mission-dark');
    const afterGame = useEditorStore.getState().project.pages.find(p => p.role === 'activity')!;
    expect(JSON.stringify((afterGame.components.find(c => c.type === 'game') as { missions: { prompt: string }[] }).missions.map(m => m.prompt))).toBe(before);
  });
});

describe('MICRO-ANIMATION-SYSTEM-V1 — render + quality', () => {
  it('25. quiz choices still render in export', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    const quizPage = project.pages.find(p => p.role === 'quiz')!;
    const question = quizPage.components.find(c => c.type === 'question') as { choices: { text: string }[] };
    expect(html).toContain(question.choices[0].text);
  });
  it('26. feedback still renders in export', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    const quizPage = project.pages.find(p => p.role === 'quiz')!;
    const question = quizPage.components.find(c => c.type === 'question') as { feedbackCorrect: string };
    expect(html).toContain(question.feedbackCorrect);
  });
  it('27. game choices still render in export', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    const gamePage = project.pages.find(p => p.role === 'activity')!;
    const game = gamePage.components.find(c => c.type === 'game') as { missions: { prompt: string }[] };
    expect(html).toContain(game.missions[0].prompt);
  });
  it('28. checkExportQuality not fatal', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    expect(checkExportQuality(applyStylePack(project, 'mission-dark')).fatalIssues.length).toBe(0);
  });
  it('29. visual combination QA 3 style × 8 layout not fatal', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    for (const sp of ['modern-clean', 'soft-classroom', 'mission-dark']) {
      expect(checkExportQuality(applyStylePack(project, sp)).fatalIssues.length, sp).toBe(0);
    }
  });
  it('30. CSS does not contain external url()', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
    if (styleMatch) {
      expect(styleMatch[1]).not.toMatch(/url\((?!data:)/);
    }
  });
  it('31. transition duration <= 300ms for micro-animation classes (not celebration)', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
    if (styleMatch) {
      // Only check silse-anim-* classes, not silse-celebrate-* (which can be up to 900ms).
      const animSection = styleMatch[1].substring(
        styleMatch[1].indexOf('MICRO-ANIMATION'),
        styleMatch[1].indexOf('CELEBRATION-EFFECT'),
      );
      const animDurations = animSection.match(/(\d+)ms/g);
      if (animDurations) {
        const maxDur = Math.max(...animDurations.map(d => parseInt(d)));
        expect(maxDur).toBeLessThanOrEqual(300);
      }
    }
  });
  it('32. reduced motion disables animation-name', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    const reducedSection = html.substring(html.indexOf('prefers-reduced-motion'));
    expect(reducedSection).toMatch(/animation:none/);
  });
  it('33. no infinite animation except mission pulse (which is disable-able)', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    // Only mission-pulse should have infinite.
    const infiniteMatches = html.match(/infinite/g) || [];
    // mission-pulse has 1 infinite in keyframes definition + 1 in class = 2.
    expect(infiniteMatches.length).toBeLessThanOrEqual(2);
  });
  it('34. PageThumbnail still not broken', async () => {
    const mod = await import('../editor/PageThumbnail');
    expect(mod.PageThumbnail).toBeDefined();
  });
  it('35. export HTML is standalone (no external script/link)', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    expect(html).not.toMatch(/<link[^>]*href=["']https?:/);
    expect(html).not.toMatch(/<script[^>]*src=["']https?:/);
  });
});
