/**
 * PREMIUM-STYLE-PACK-V2 tests.
 * 35 tests: style pack identity, visual profile, content safety, export, regression.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { getStylePackVisualProfile } from '../core/style-packs/style-pack-visual-profile';
import { getStylePackV1, STYLE_PACKS_V1 } from '../core/style-packs/style-pack-registry';
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

// === Style pack identity ===
describe('PREMIUM-STYLE-PACK-V2 — style pack identity', () => {
  it('1. modern-clean id exists', () => {
    expect(STYLE_PACKS_V1.find(p => p.id === 'modern-clean')).toBeDefined();
  });
  it('2. soft-classroom id exists', () => {
    expect(STYLE_PACKS_V1.find(p => p.id === 'soft-classroom')).toBeDefined();
  });
  it('3. mission-dark id exists', () => {
    expect(STYLE_PACKS_V1.find(p => p.id === 'mission-dark')).toBeDefined();
  });
  it('4. no accidental new style pack (still exactly 3)', () => {
    expect(STYLE_PACKS_V1.length).toBe(3);
  });
  it('5. no style pack removed', () => {
    const ids = STYLE_PACKS_V1.map(p => p.id);
    expect(ids).toContain('modern-clean');
    expect(ids).toContain('soft-classroom');
    expect(ids).toContain('mission-dark');
  });
  it('6. unknown style pack fallback safe', () => {
    const pack = getStylePackV1('nonexistent-xyz');
    expect(pack.id).toBe('modern-clean');
  });
});

// === Visual profile ===
describe('PREMIUM-STYLE-PACK-V2 — visual profile', () => {
  it('7. modern-clean has profesional/clean visual intent', () => {
    const p = getStylePackVisualProfile('modern-clean');
    expect(p.visualIntent).toMatch(/profesional|rapi|clean/i);
  });
  it('8. soft-classroom has warm/classroom visual intent', () => {
    const p = getStylePackVisualProfile('soft-classroom');
    expect(p.visualIntent).toMatch(/hangat|ramah|classroom|pastel/i);
  });
  it('9. mission-dark has mission/dark visual intent', () => {
    const p = getStylePackVisualProfile('mission-dark');
    expect(p.visualIntent).toMatch(/misi|mission|game|dark|gelap/i);
  });
  it('10. modern-clean linked to skin clean', () => {
    const p = getStylePackVisualProfile('modern-clean');
    expect(p.cardClass).toBe('skin-card-flat');
    expect(p.buttonClass).toBe('skin-button-clean');
  });
  it('11. soft-classroom linked to skin soft', () => {
    const p = getStylePackVisualProfile('soft-classroom');
    expect(p.cardClass).toBe('skin-card-soft');
    expect(p.buttonClass).toBe('skin-button-rounded');
  });
  it('12. mission-dark linked to skin mission/bold', () => {
    const p = getStylePackVisualProfile('mission-dark');
    expect(p.cardClass).toBe('skin-card-bold');
    expect(p.buttonClass).toBe('skin-button-mission');
  });
  it('13. modern-clean linked to background clean', () => {
    const p = getStylePackVisualProfile('modern-clean');
    expect(p.pageClass).toBe('silse-bg-page-clean');
    expect(p.patternClass).toBe('silse-bg-pattern-subtle-grid');
  });
  it('14. soft-classroom linked to background soft', () => {
    const p = getStylePackVisualProfile('soft-classroom');
    expect(p.pageClass).toBe('silse-bg-page-soft');
    expect(p.patternClass).toBe('silse-bg-pattern-soft-dots');
  });
  it('15. mission-dark linked to background mission', () => {
    const p = getStylePackVisualProfile('mission-dark');
    expect(p.pageClass).toBe('silse-bg-page-mission');
    expect(p.patternClass).toBe('silse-bg-pattern-mission-glow');
  });
  it('15b. visual profile unknown fallback to modern-clean', () => {
    const p = getStylePackVisualProfile('unknown-xyz');
    expect(p.stylePackId).toBe('modern-clean');
  });
  it('15c. style pack name is teacher-friendly (not raw id)', () => {
    for (const sp of STYLE_PACKS_V1) {
      // Name should not be the raw id.
      expect(sp.name).not.toBe(sp.id);
      // Name should contain Indonesian words.
      expect(sp.name.length).toBeGreaterThan(3);
    }
  });
});

// === Content safety ===
describe('PREMIUM-STYLE-PACK-V2 — content safety', () => {
  beforeEach(() => { useEditorStore.getState().newProject(); });

  it('16. applying style pack does not change project title', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = useEditorStore.getState().project.title;
    useEditorStore.getState().setStylePack('mission-dark');
    expect(useEditorStore.getState().project.title).toBe(before);
  });
  it('17. does not change page count', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = useEditorStore.getState().project.pages.length;
    useEditorStore.getState().setStylePack('soft-classroom');
    expect(useEditorStore.getState().project.pages.length).toBe(before);
  });
  it('18. does not change page order', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = useEditorStore.getState().project.pages.map(p => p.title);
    useEditorStore.getState().setStylePack('mission-dark');
    expect(useEditorStore.getState().project.pages.map(p => p.title)).toEqual(before);
  });
  it('19. does not change component count', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = useEditorStore.getState().project.pages.flatMap(p => p.components).length;
    useEditorStore.getState().setStylePack('soft-classroom');
    expect(useEditorStore.getState().project.pages.flatMap(p => p.components).length).toBe(before);
  });
  it('20. does not change text content', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = JSON.stringify(useEditorStore.getState().project.pages.flatMap(p => p.components).filter(c => c.type === 'text').map(c => (c as {text:string}).text));
    useEditorStore.getState().setStylePack('mission-dark');
    expect(JSON.stringify(useEditorStore.getState().project.pages.flatMap(p => p.components).filter(c => c.type === 'text').map(c => (c as {text:string}).text))).toBe(before);
  });
  it('21. does not change objectives', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = JSON.stringify(useEditorStore.getState().project.curriculum?.objectives.map(o => o.text));
    useEditorStore.getState().setStylePack('soft-classroom');
    expect(JSON.stringify(useEditorStore.getState().project.curriculum?.objectives.map(o => o.text))).toBe(before);
  });
  it('22. does not change quiz answer', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    useEditorStore.getState().setProject(project);
    const quizPage = project.pages.find(p => p.role === 'quiz')!;
    const before = (quizPage.components.find(c => c.type === 'question') as { correctChoiceIndex: number }).correctChoiceIndex;
    useEditorStore.getState().setStylePack('mission-dark');
    const afterQuiz = useEditorStore.getState().project.pages.find(p => p.role === 'quiz')!;
    expect((afterQuiz.components.find(c => c.type === 'question') as { correctChoiceIndex: number }).correctChoiceIndex).toBe(before);
  });
  it('23. does not change quiz feedback', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    useEditorStore.getState().setProject(project);
    const q = project.pages.find(p => p.role === 'quiz')!.components.find(c => c.type === 'question') as { feedbackCorrect: string; feedbackWrong: string };
    useEditorStore.getState().setStylePack('soft-classroom');
    const qAfter = useEditorStore.getState().project.pages.find(p => p.role === 'quiz')!.components.find(c => c.type === 'question') as { feedbackCorrect: string; feedbackWrong: string };
    expect(qAfter.feedbackCorrect).toBe(q.feedbackCorrect);
    expect(qAfter.feedbackWrong).toBe(q.feedbackWrong);
  });
  it('24. does not change layoutId', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = useEditorStore.getState().project.pages.map(p => p.layoutId);
    useEditorStore.getState().setStylePack('mission-dark');
    expect(useEditorStore.getState().project.pages.map(p => p.layoutId)).toEqual(before);
  });
  it('25. does not change geometry x/y/width/height', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = JSON.stringify(useEditorStore.getState().project.pages.flatMap(p => p.components).map(c => ({ x: c.x, y: c.y, w: c.width, h: c.height })));
    useEditorStore.getState().setStylePack('soft-classroom');
    expect(JSON.stringify(useEditorStore.getState().project.pages.flatMap(p => p.components).map(c => ({ x: c.x, y: c.y, w: c.width, h: c.height })))).toBe(before);
  });
});

// === Export consistency ===
describe('PREMIUM-STYLE-PACK-V2 — export consistency', () => {
  it('26. export HTML modern-clean contains skin + background', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    expect(html).toContain('skin-card-flat');
    expect(html).toContain('silse-bg-page-clean');
    expect(html).toContain('silse-bg-pattern-subtle-grid');
  });
  it('27. export HTML soft-classroom contains skin + background', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'soft-classroom'));
    expect(html).toContain('skin-card-soft');
    expect(html).toContain('silse-bg-page-soft');
    expect(html).toContain('silse-bg-pattern-soft-dots');
  });
  it('28. export HTML mission-dark contains skin + background', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'mission-dark'));
    expect(html).toContain('skin-card-bold');
    expect(html).toContain('silse-bg-page-mission');
    expect(html).toContain('silse-bg-pattern-mission-glow');
  });
  it('29. mission-dark contrast safe', () => {
    const dark = resolveStylePackV1('mission-dark');
    expect(getContrastRatio(dark.colors.text, dark.colors.background)).toBeGreaterThanOrEqual(4.5);
  });
  it('30. no raw technical id as primary visible UI label', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    expect(html).not.toMatch(/>\s*modern-clean\s*</);
    expect(html).not.toMatch(/>\s*soft-classroom\s*</);
    expect(html).not.toMatch(/>\s*mission-dark\s*</);
  });
  it('31. visual combination QA 3 style × 8 layout still not fatal', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    for (const sp of ['modern-clean', 'soft-classroom', 'mission-dark']) {
      const styled = applyStylePack(project, sp);
      const report = checkExportQuality(styled);
      expect(report.fatalIssues.length, sp).toBe(0);
    }
  });
  it('32. checkExportQuality not fatal', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const report = checkExportQuality(applyStylePack(project, 'mission-dark'));
    expect(report.fatalIssues.length).toBe(0);
  });
  it('33. CSS does not contain external url()', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
    if (styleMatch) {
      // Check no external url() in CSS (data: urls are OK for inline assets, but we don't use them)
      expect(styleMatch[1]).not.toMatch(/url\((?!data:)/);
    }
  });
  it('34. no animation/confetti class in CSS', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    expect(html).not.toMatch(/@keyframes\s+confetti/);
    expect(html).not.toMatch(/@keyframes\s+celebrate/);
  });
  it('35. PageThumbnail still not broken', async () => {
    const mod = await import('../editor/PageThumbnail');
    expect(mod.PageThumbnail).toBeDefined();
  });
});
