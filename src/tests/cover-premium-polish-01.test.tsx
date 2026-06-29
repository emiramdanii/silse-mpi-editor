/**
 * COVER-PREMIUM-POLISH-01 tests.
 * 20 tests: helper, content safety, export consistency, regression.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import {
  getCoverClassForStylePack,
  getAllCoverClassNames,
} from '../core/style-packs/cover-decoration';
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

describe('COVER-PREMIUM-POLISH-01 — helper', () => {
  it('1. unknown style pack fallback to modern-clean cover class', () => {
    expect(getCoverClassForStylePack('nonexistent')).toBe('silse-cover-clean');
  });
  it('2. modern-clean produces silse-cover-clean', () => {
    expect(getCoverClassForStylePack('modern-clean')).toBe('silse-cover-clean');
  });
  it('3. soft-classroom produces silse-cover-soft', () => {
    expect(getCoverClassForStylePack('soft-classroom')).toBe('silse-cover-soft');
  });
  it('4. mission-dark produces silse-cover-mission', () => {
    expect(getCoverClassForStylePack('mission-dark')).toBe('silse-cover-mission');
  });
  it('5. getAllCoverClassNames returns 3 unique classes', () => {
    const all = getAllCoverClassNames();
    expect(all.length).toBe(3);
    expect(all).toContain('silse-cover-clean');
    expect(all).toContain('silse-cover-soft');
    expect(all).toContain('silse-cover-mission');
  });
  it('6. changing style pack changes cover class', () => {
    const clean = getCoverClassForStylePack('modern-clean');
    const dark = getCoverClassForStylePack('mission-dark');
    expect(clean).not.toBe(dark);
  });
});

describe('COVER-PREMIUM-POLISH-01 — content safety', () => {
  beforeEach(() => { useEditorStore.getState().newProject(); });

  it('7. cover decoration does not change page count', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = useEditorStore.getState().project.pages.length;
    useEditorStore.getState().setStylePack('mission-dark');
    expect(useEditorStore.getState().project.pages.length).toBe(before);
  });
  it('8. does not change text content', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = JSON.stringify(useEditorStore.getState().project.pages.flatMap(p => p.components).filter(c => c.type === 'text').map(c => (c as {text:string}).text));
    useEditorStore.getState().setStylePack('soft-classroom');
    expect(JSON.stringify(useEditorStore.getState().project.pages.flatMap(p => p.components).filter(c => c.type === 'text').map(c => (c as {text:string}).text))).toBe(before);
  });
  it('9. does not change objectives', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = JSON.stringify(useEditorStore.getState().project.curriculum?.objectives.map(o => o.text));
    useEditorStore.getState().setStylePack('mission-dark');
    expect(JSON.stringify(useEditorStore.getState().project.curriculum?.objectives.map(o => o.text))).toBe(before);
  });
  it('10. does not change quiz answer', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    useEditorStore.getState().setProject(project);
    const quizPage = project.pages.find(p => p.role === 'quiz')!;
    const before = (quizPage.components.find(c => c.type === 'question') as { correctChoiceIndex: number }).correctChoiceIndex;
    useEditorStore.getState().setStylePack('mission-dark');
    const afterQuiz = useEditorStore.getState().project.pages.find(p => p.role === 'quiz')!;
    expect((afterQuiz.components.find(c => c.type === 'question') as { correctChoiceIndex: number }).correctChoiceIndex).toBe(before);
  });
  it('11. does not change layoutId', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = useEditorStore.getState().project.pages.map(p => p.layoutId);
    useEditorStore.getState().setStylePack('soft-classroom');
    expect(useEditorStore.getState().project.pages.map(p => p.layoutId)).toEqual(before);
  });
  it('12. does not change geometry', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = JSON.stringify(useEditorStore.getState().project.pages.flatMap(p => p.components).map(c => ({ x: c.x, y: c.y, w: c.width, h: c.height })));
    useEditorStore.getState().setStylePack('mission-dark');
    expect(JSON.stringify(useEditorStore.getState().project.pages.flatMap(p => p.components).map(c => ({ x: c.x, y: c.y, w: c.width, h: c.height })))).toBe(before);
  });
});

describe('COVER-PREMIUM-POLISH-01 — export + regression', () => {
  it('13. export HTML contains cover CSS class for cover pages', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    // CSS should contain cover class definitions.
    expect(html).toContain('silse-cover-clean');
  });
  it('14. export HTML contains cover CSS rules', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    expect(html).toContain('.silse-cover-clean::before');
  });
  it('15. export HTML differs between modern-clean and mission-dark (cover class)', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const htmlClean = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    const htmlDark = exportProjectToHtml(applyStylePack(project, 'mission-dark'));
    expect(htmlClean).toContain('silse-cover-clean');
    expect(htmlDark).toContain('silse-cover-mission');
  });
  it('16. checkExportQuality not fatal after cover decoration', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    for (const sp of ['modern-clean', 'soft-classroom', 'mission-dark']) {
      const report = checkExportQuality(applyStylePack(project, sp));
      expect(report.fatalIssues.length, sp).toBe(0);
    }
  });
  it('17. PageThumbnail still exists', async () => {
    const mod = await import('../editor/PageThumbnail');
    expect(mod.PageThumbnail).toBeDefined();
  });
  it('18. no raw cover technical ID as visible UI text', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    expect(html).not.toMatch(/>\s*silse-cover-clean\s*</);
  });
  it('19. mission-dark cover still contrast safe', () => {
    const dark = resolveStylePackV1('mission-dark');
    expect(getContrastRatio(dark.colors.text, dark.colors.background)).toBeGreaterThanOrEqual(4.5);
  });
  it('20. cover CSS does not use external url()', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
    if (styleMatch) {
      const coverCss = styleMatch[1].substring(styleMatch[1].indexOf('silse-cover-clean'), styleMatch[1].indexOf('</style>') + 1);
      expect(coverCss).not.toMatch(/url\((?!data:)/);
    }
  });
});
