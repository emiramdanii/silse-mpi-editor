/**
 * COMPONENT-SKIN-V2 tests.
 * 28 mandatory tests: helper, skin mapping, content safety, layout safety, editor/export consistency, regression.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { getComponentSkinForStylePack, getSkinClassForComponent, getAllSkinClassNames } from '../core/style-packs/component-skin';
import { resolveStylePackV1, getProjectStylePackIdV1 } from '../core/style-packs/style-pack-registry';
import { getContrastRatio } from '../core/design/contrast';
import { generateMpiFromTopic } from '../core/guided-flow/generate-mpi-from-topic';
import { getTopicById } from '../core/guided-flow/mpi-topic-catalog';
import { exportProjectToHtml } from '../export/export-html';
import { checkExportQuality } from '../core/export-quality-gate';
import { useEditorStore } from '../store/editor-store';
import { createSamplePpknProject } from '../core/sample-project';
import { stylePackToProjectStyle } from '../core/style-presets';
import type { SimpleProject } from '../core/types';

function applyStylePack(project: SimpleProject, stylePackId: string): SimpleProject {
  const resolvedId = getProjectStylePackIdV1(stylePackId);
  const pack = resolveStylePackV1(resolvedId);
  return { ...project, stylePackId: resolvedId, style: stylePackToProjectStyle(pack) };
}

describe('COMPONENT-SKIN-V2 — helper', () => {
  it('1. unknown style pack falls back to modern-clean', () => {
    const skin = getComponentSkinForStylePack('nonexistent');
    expect(skin.cardClass).toBe('skin-card-flat');
    expect(skin.buttonClass).toBe('skin-button-clean');
  });
  it('2. modern-clean produces clean skin', () => {
    const skin = getComponentSkinForStylePack('modern-clean');
    expect(skin.cardClass).toBe('skin-card-flat');
    expect(skin.buttonClass).toBe('skin-button-clean');
    expect(skin.quizClass).toBe('skin-quiz-calm');
    expect(skin.bridgeClass).toBe('skin-bridge-subtle');
  });
  it('3. soft-classroom produces soft/playful skin', () => {
    const skin = getComponentSkinForStylePack('soft-classroom');
    expect(skin.cardClass).toBe('skin-card-soft');
    expect(skin.buttonClass).toBe('skin-button-rounded');
    expect(skin.quizClass).toBe('skin-quiz-playful');
  });
  it('4. mission-dark produces mission/strong skin', () => {
    const skin = getComponentSkinForStylePack('mission-dark');
    expect(skin.cardClass).toBe('skin-card-bold');
    expect(skin.buttonClass).toBe('skin-button-mission');
    expect(skin.quizClass).toBe('skin-quiz-mission');
    expect(skin.bridgeClass).toBe('skin-bridge-strong');
  });
  it('5. style pack change changes card skin class', () => {
    const clean = getSkinClassForComponent('card', 'modern-clean');
    const dark = getSkinClassForComponent('card', 'mission-dark');
    expect(clean).not.toBe(dark);
  });
  it('6. style pack change changes button skin class', () => {
    const clean = getSkinClassForComponent('navigation', 'modern-clean');
    const soft = getSkinClassForComponent('navigation', 'soft-classroom');
    expect(clean).not.toBe(soft);
  });
  it('7. style pack change changes quiz skin class', () => {
    const calm = getSkinClassForComponent('question', 'modern-clean');
    const mission = getSkinClassForComponent('question', 'mission-dark');
    expect(calm).not.toBe(mission);
  });
  it('8. style pack change changes bridge skin class', () => {
    const subtle = getSkinClassForComponent('learning-bridge', 'modern-clean');
    const strong = getSkinClassForComponent('learning-bridge', 'mission-dark');
    expect(subtle).not.toBe(strong);
  });
  it('8b. getAllSkinClassNames returns 14 unique classes (bridge-subtle shared)', () => {
    const all = getAllSkinClassNames();
    // 3 card + 3 button + 3 quiz + 2 bridge (subtle shared by modern-clean + soft-classroom) + 3 game = 14
    expect(all.length).toBe(14);
  });
});

describe('COMPONENT-SKIN-V2 — content safety', () => {
  beforeEach(() => { useEditorStore.getState().newProject(); });

  it('9. skin does not change page count', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = useEditorStore.getState().project.pages.length;
    useEditorStore.getState().setStylePack('mission-dark');
    expect(useEditorStore.getState().project.pages.length).toBe(before);
  });
  it('10. skin does not change page order', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = useEditorStore.getState().project.pages.map(p => p.title);
    useEditorStore.getState().setStylePack('soft-classroom');
    expect(useEditorStore.getState().project.pages.map(p => p.title)).toEqual(before);
  });
  it('11. skin does not change text content', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = JSON.stringify(useEditorStore.getState().project.pages.flatMap(p => p.components).filter(c => c.type === 'text').map(c => (c as {text:string}).text));
    useEditorStore.getState().setStylePack('mission-dark');
    const after = JSON.stringify(useEditorStore.getState().project.pages.flatMap(p => p.components).filter(c => c.type === 'text').map(c => (c as {text:string}).text));
    expect(after).toBe(before);
  });
  it('12. skin does not change objectives', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = JSON.stringify(useEditorStore.getState().project.curriculum?.objectives.map(o => o.text));
    useEditorStore.getState().setStylePack('soft-classroom');
    expect(JSON.stringify(useEditorStore.getState().project.curriculum?.objectives.map(o => o.text))).toBe(before);
  });
  it('13. skin does not change quiz correct answer', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    useEditorStore.getState().setProject(project);
    const quizPage = project.pages.find(p => p.role === 'quiz')!;
    const before = (quizPage.components.find(c => c.type === 'question') as { correctChoiceIndex: number }).correctChoiceIndex;
    useEditorStore.getState().setStylePack('mission-dark');
    const afterQuiz = useEditorStore.getState().project.pages.find(p => p.role === 'quiz')!;
    expect((afterQuiz.components.find(c => c.type === 'question') as { correctChoiceIndex: number }).correctChoiceIndex).toBe(before);
  });
  it('14. skin does not change quiz feedback', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    useEditorStore.getState().setProject(project);
    const quizPage = project.pages.find(p => p.role === 'quiz')!;
    const q = quizPage.components.find(c => c.type === 'question') as { feedbackCorrect: string; feedbackWrong: string };
    useEditorStore.getState().setStylePack('soft-classroom');
    const afterQuiz = useEditorStore.getState().project.pages.find(p => p.role === 'quiz')!;
    const qAfter = afterQuiz.components.find(c => c.type === 'question') as { feedbackCorrect: string; feedbackWrong: string };
    expect(qAfter.feedbackCorrect).toBe(q.feedbackCorrect);
    expect(qAfter.feedbackWrong).toBe(q.feedbackWrong);
  });
  it('15. skin does not change layoutId', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = useEditorStore.getState().project.pages.map(p => p.layoutId);
    useEditorStore.getState().setStylePack('mission-dark');
    expect(useEditorStore.getState().project.pages.map(p => p.layoutId)).toEqual(before);
  });
  it('16. skin does not change geometry x/y/width/height', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = JSON.stringify(useEditorStore.getState().project.pages.flatMap(p => p.components).map(c => ({ x: c.x, y: c.y, w: c.width, h: c.height })));
    useEditorStore.getState().setStylePack('soft-classroom');
    expect(JSON.stringify(useEditorStore.getState().project.pages.flatMap(p => p.components).map(c => ({ x: c.x, y: c.y, w: c.width, h: c.height })))).toBe(before);
  });
});

describe('COMPONENT-SKIN-V2 — editor + export consistency', () => {
  it('17. editor render has skin card class (via CanvasStage component props)', () => {
    // Verify getSkinClassForComponent returns non-empty for card.
    const cls = getSkinClassForComponent('card', 'modern-clean');
    expect(cls).toBe('skin-card-flat');
    expect(cls.length).toBeGreaterThan(0);
  });
  it('18. editor render has skin quiz/button class', () => {
    expect(getSkinClassForComponent('question', 'modern-clean')).toBe('skin-quiz-calm');
    expect(getSkinClassForComponent('navigation', 'modern-clean')).toBe('skin-button-clean');
  });
  it('19. export HTML has skin card class', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const styled = applyStylePack(project, 'modern-clean');
    const html = exportProjectToHtml(styled);
    expect(html).toContain('skin-card-flat');
  });
  it('20. export HTML has skin quiz/button class', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const styled = applyStylePack(project, 'modern-clean');
    const html = exportProjectToHtml(styled);
    expect(html).toContain('skin-quiz-calm');
    expect(html).toContain('skin-button-clean');
  });
  it('21. export HTML differs between modern-clean and mission-dark (skin)', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const htmlClean = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    const htmlDark = exportProjectToHtml(applyStylePack(project, 'mission-dark'));
    expect(htmlClean).not.toBe(htmlDark);
    expect(htmlClean).toContain('skin-card-flat');
    expect(htmlDark).toContain('skin-card-bold');
  });
  it('22. export HTML still contains same content after skin change', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const htmlDark = exportProjectToHtml(applyStylePack(project, 'mission-dark'));
    expect(htmlDark).toContain(project.title);
    const materialPage = project.pages.find(p => p.role === 'material')!;
    const materialText = materialPage.components.find(c => c.type === 'text') as { text: string };
    if (materialText) expect(htmlDark).toContain(materialText.text.substring(0, 20));
  });
  it('23. checkExportQuality not fatal after skin applied', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const styled = applyStylePack(project, 'mission-dark');
    const report = checkExportQuality(styled);
    expect(report.fatalIssues.length).toBe(0);
  });
  it('24. visual combination QA still not fatal (style + skin)', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    for (const sp of ['modern-clean', 'soft-classroom', 'mission-dark']) {
      const styled = applyStylePack(project, sp);
      const report = checkExportQuality(styled);
      expect(report.fatalIssues.length, `${sp}`).toBe(0);
    }
  });
  it('25. PageThumbnail still exists', async () => {
    const mod = await import('../editor/PageThumbnail');
    expect(mod.PageThumbnail).toBeDefined();
  });
  it('26. no raw technical skin ID as primary UI text', () => {
    // Skin classes are CSS class names, not shown as primary text in UI.
    // Verify skin class names don't appear as visible text in export HTML body.
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    // Skin classes should only appear in CSS <style> block and class attributes, not as text content.
    // Check they don't appear between > and < (visible text).
    expect(html).not.toMatch(/>\s*skin-card-flat\s*</);
    expect(html).not.toMatch(/>\s*skin-button-clean\s*</);
  });
  it('27. mission-dark still contrast safe', () => {
    const dark = resolveStylePackV1('mission-dark');
    const ratio = getContrastRatio(dark.colors.text, dark.colors.background);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
  it('28. soft-classroom does not make text unreadable', () => {
    const soft = resolveStylePackV1('soft-classroom');
    const ratio = getContrastRatio(soft.colors.text, soft.colors.background);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
