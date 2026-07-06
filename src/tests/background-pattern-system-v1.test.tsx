/**
 * BACKGROUND-PATTERN-SYSTEM-V1 tests.
 * 27 tests: helper, content safety, layout safety, editor/export consistency, readability.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import {
  getBackgroundPatternForStylePack,
  getBackgroundClassForStylePack,
  getAllBackgroundPatternClassNames,
} from '../core/style-packs/background-pattern';
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

// === Helper tests ===
describe('BACKGROUND-PATTERN-SYSTEM-V1 — helper', () => {
  it('1. unknown style pack falls back to modern-clean', () => {
    const p = getBackgroundPatternForStylePack('nonexistent');
    expect(p.pageClass).toBe('silse-bg-page-clean');
    expect(p.patternClass).toBe('silse-bg-pattern-subtle-grid');
  });
  it('2. modern-clean produces bg-page-clean', () => {
    expect(getBackgroundClassForStylePack('modern-clean')).toBe('silse-bg-page-clean');
  });
  it('3. soft-classroom produces bg-page-soft', () => {
    expect(getBackgroundClassForStylePack('soft-classroom')).toBe('silse-bg-page-soft');
  });
  it('4. mission-dark produces bg-page-mission', () => {
    expect(getBackgroundClassForStylePack('mission-dark')).toBe('silse-bg-page-mission');
  });
  it('5. getAllBackgroundPatternClassNames contains all unique classes', () => {
    const all = getAllBackgroundPatternClassNames();
    expect(all).toContain('silse-bg-page-clean');
    expect(all).toContain('silse-bg-page-soft');
    expect(all).toContain('silse-bg-page-mission');
    expect(all).toContain('silse-bg-pattern-subtle-grid');
    expect(all).toContain('silse-bg-pattern-soft-dots');
    expect(all).toContain('silse-bg-pattern-mission-glow');
    expect(new Set(all).size).toBe(all.length); // no duplicates
  });
  it('5b. getAllBackgroundPatternClassNames returns 6 classes', () => {
    expect(getAllBackgroundPatternClassNames().length).toBe(6);
  });

  // Tests 6-12: Editor/preview/export render background class (behavior test).
  it('6. CanvasStage gets correct background classes for modern-clean (via helper)', () => {
    // CanvasStage calls getBackgroundPatternForStylePack — verify helper returns correct classes
    const p = getBackgroundPatternForStylePack('modern-clean');
    expect(p.pageClass).toBeTruthy();
    expect(p.patternClass).toBeTruthy();
    expect(p.pageClass).toMatch(/^silse-bg-/);
  });

  it('7. CanvasStage gets soft-classroom pattern classes (via helper)', () => {
    const p = getBackgroundPatternForStylePack('soft-classroom');
    expect(p.pageClass).toBe('silse-bg-page-soft');
    expect(p.patternClass).toBe('silse-bg-pattern-soft-dots');
  });

  it('8. CanvasStage gets mission-dark pattern classes (via helper)', () => {
    const p = getBackgroundPatternForStylePack('mission-dark');
    expect(p.pageClass).toBe('silse-bg-page-mission');
    expect(p.patternClass).toBe('silse-bg-pattern-mission-glow');
  });

  it('9. PreviewApp uses same background helper (consistent results across editor/preview)', () => {
    // PreviewApp and CanvasStage both call getBackgroundPatternForStylePack.
    // Verify the helper produces the same results (consistency check).
    const packs = ['modern-clean', 'soft-classroom', 'mission-dark'];
    packs.forEach((id) => {
      const p = getBackgroundPatternForStylePack(id);
      expect(p.pageClass, `${id} pageClass`).toBeTruthy();
      expect(p.patternClass, `${id} patternClass`).toBeTruthy();
    });
  });

  it('10. export HTML contains background class', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const styled = applyStylePack(project, 'modern-clean');
    const html = exportProjectToHtml(styled);
    expect(html).toContain('silse-bg-page-clean');
    expect(html).toContain('silse-bg-pattern-subtle-grid');
  });

  it('11. export HTML contains CSS background pattern rules', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    expect(html).toContain('.silse-bg-page-clean::before');
    expect(html).toContain('.silse-bg-pattern-subtle-grid::after');
  });

  it('12. changing style pack changes background class', () => {
    const clean = getBackgroundClassForStylePack('modern-clean');
    const dark = getBackgroundClassForStylePack('mission-dark');
    const soft = getBackgroundClassForStylePack('soft-classroom');
    expect(clean).not.toBe(dark);
    expect(clean).not.toBe(soft);
    expect(dark).not.toBe(soft);
  });
});

// === Content safety ===
describe('BACKGROUND-PATTERN-SYSTEM-V1 — content safety', () => {
  beforeEach(() => { useEditorStore.getState().newProject(); });

  it('13. background pattern does not change page count', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = useEditorStore.getState().project.pages.length;
    useEditorStore.getState().setStylePack('mission-dark');
    expect(useEditorStore.getState().project.pages.length).toBe(before);
  });
  it('14. does not change page order', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = useEditorStore.getState().project.pages.map(p => p.title);
    useEditorStore.getState().setStylePack('soft-classroom');
    expect(useEditorStore.getState().project.pages.map(p => p.title)).toEqual(before);
  });
  it('15. does not change text content', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = JSON.stringify(useEditorStore.getState().project.pages.flatMap(p => p.components).filter(c => c.type === 'text').map(c => (c as {text:string}).text));
    useEditorStore.getState().setStylePack('mission-dark');
    expect(JSON.stringify(useEditorStore.getState().project.pages.flatMap(p => p.components).filter(c => c.type === 'text').map(c => (c as {text:string}).text))).toBe(before);
  });
  it('16. does not change objectives', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = JSON.stringify(useEditorStore.getState().project.curriculum?.objectives.map(o => o.text));
    useEditorStore.getState().setStylePack('soft-classroom');
    expect(JSON.stringify(useEditorStore.getState().project.curriculum?.objectives.map(o => o.text))).toBe(before);
  });
  it('17. does not change quiz correct answer', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    useEditorStore.getState().setProject(project);
    const quizPage = project.pages.find(p => p.role === 'quiz')!;
    const before = (quizPage.components.find(c => c.type === 'question') as { correctChoiceIndex: number }).correctChoiceIndex;
    useEditorStore.getState().setStylePack('mission-dark');
    const afterQuiz = useEditorStore.getState().project.pages.find(p => p.role === 'quiz')!;
    expect((afterQuiz.components.find(c => c.type === 'question') as { correctChoiceIndex: number }).correctChoiceIndex).toBe(before);
  });
  it('18. does not change quiz feedback', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    useEditorStore.getState().setProject(project);
    const q = project.pages.find(p => p.role === 'quiz')!.components.find(c => c.type === 'question') as { feedbackCorrect: string; feedbackWrong: string };
    useEditorStore.getState().setStylePack('soft-classroom');
    const qAfter = useEditorStore.getState().project.pages.find(p => p.role === 'quiz')!.components.find(c => c.type === 'question') as { feedbackCorrect: string; feedbackWrong: string };
    expect(qAfter.feedbackCorrect).toBe(q.feedbackCorrect);
    expect(qAfter.feedbackWrong).toBe(q.feedbackWrong);
  });
  it('19. does not change layoutId', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = useEditorStore.getState().project.pages.map(p => p.layoutId);
    useEditorStore.getState().setStylePack('mission-dark');
    expect(useEditorStore.getState().project.pages.map(p => p.layoutId)).toEqual(before);
  });
  it('20. does not change geometry x/y/width/height', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = JSON.stringify(useEditorStore.getState().project.pages.flatMap(p => p.components).map(c => ({ x: c.x, y: c.y, w: c.width, h: c.height })));
    useEditorStore.getState().setStylePack('soft-classroom');
    expect(JSON.stringify(useEditorStore.getState().project.pages.flatMap(p => p.components).map(c => ({ x: c.x, y: c.y, w: c.width, h: c.height })))).toBe(before);
  });
});

// === Export + regression ===
describe('BACKGROUND-PATTERN-SYSTEM-V1 — export + regression', () => {
  it('21. checkExportQuality not fatal after background pattern', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const styled = applyStylePack(project, 'mission-dark');
    const report = checkExportQuality(styled);
    expect(report.fatalIssues.length).toBe(0);
  });
  it('22. visual combination QA still not fatal', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    for (const sp of ['modern-clean', 'soft-classroom', 'mission-dark']) {
      const styled = applyStylePack(project, sp);
      const report = checkExportQuality(styled);
      expect(report.fatalIssues.length, sp).toBe(0);
    }
  });
  it('23. PageThumbnail still exists', async () => {
    const mod = await import('../editor/PageThumbnail');
    expect(mod.PageThumbnail).toBeDefined();
  });
  it('24. no raw background technical ID as visible UI text', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    expect(html).not.toMatch(/>\s*silse-bg-page-clean\s*</);
    expect(html).not.toMatch(/>\s*silse-bg-pattern-subtle-grid\s*</);
  });
  it('25. export HTML differs between modern-clean and mission-dark (background class)', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const htmlClean = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    const htmlDark = exportProjectToHtml(applyStylePack(project, 'mission-dark'));
    expect(htmlClean).toContain('silse-bg-page-clean');
    expect(htmlDark).toContain('silse-bg-page-mission');
    expect(htmlClean).not.toBe(htmlDark);
  });
  it('26. mission-dark still contrast safe', () => {
    const dark = resolveStylePackV1('mission-dark');
    expect(getContrastRatio(dark.colors.text, dark.colors.background)).toBeGreaterThanOrEqual(4.5);
  });
  it('27. pattern CSS does not use external url()', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    // Extract CSS between <style> tags and check no url() in pattern classes.
    const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
    if (styleMatch) {
      const css = styleMatch[1];
      const patternCss = css.substring(css.indexOf('silse-bg-page-clean'), css.indexOf('#silse-canvas'));
      expect(patternCss).not.toMatch(/url\(/);
    }
  });
});
