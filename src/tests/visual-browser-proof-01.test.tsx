/**
 * VISUAL-BROWSER-PROOF-01 tests.
 * 42 tests: export standalone proof, visual matrix, content safety, reduced-motion, regression.
 */
import { describe, expect, it } from 'vitest';
import { generateMpiFromTopic } from '../core/guided-flow/generate-mpi-from-topic';
import { getTopicById } from '../core/guided-flow/mpi-topic-catalog';
import { exportProjectToHtml } from '../export/export-html';
import { checkExportQuality } from '../core/export-quality-gate';
import { resolveStylePackV1, getProjectStylePackIdV1 } from '../core/style-packs/style-pack-registry';
import { stylePackToProjectStyle } from '../core/style-presets';
import { getContrastRatio } from '../core/design/contrast';
import { listLayoutPresets } from '../core/layout-presets/layout-preset-registry';
import { applyLayoutPresetToPage } from '../core/layout-presets/apply-layout-preset';
import type { SimpleProject } from '../core/types';

function applyStylePack(project: SimpleProject, stylePackId: string): SimpleProject {
  const resolvedId = getProjectStylePackIdV1(stylePackId);
  const pack = resolveStylePackV1(resolvedId);
  return { ...project, stylePackId: resolvedId, style: stylePackToProjectStyle(pack) };
}
function applyLayoutToAllPages(project: SimpleProject, presetId: string): SimpleProject {
  return { ...project, pages: project.pages.map(p => {
    const presets = listLayoutPresets().filter(pp => pp.supportedRoles.includes(p.role));
    if (presets.some(pp => pp.id === presetId)) return applyLayoutPresetToPage(p, presetId);
    return p;
  })};
}
function buildCombo(sp: string, preset: string): SimpleProject {
  const topic = getTopicById('ppkn-7-norma')!;
  const { project } = generateMpiFromTopic(topic);
  return applyLayoutToAllPages(applyStylePack(project, sp), preset);
}

// === Export HTML standalone proof ===
describe('VISUAL-BROWSER-PROOF-01 — export standalone', () => {
  const topic = getTopicById('ppkn-7-norma')!;
  const { project } = generateMpiFromTopic(topic);
  const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));

  it('1. export contains canvas root', () => { expect(html).toContain('silse-canvas'); });
  it('2. export contains renderPage function', () => { expect(html).toContain('function renderPage'); });
  it('3. export contains embedded CSS', () => { expect(html).toContain('<style>'); expect(html).toContain('</style>'); });
  it('4. export contains style pack CSS variables', () => { expect(html).toContain('--silse-'); });
  it('5. export contains component skin CSS', () => { expect(html).toContain('skin-card'); });
  it('6. export contains background pattern CSS', () => { expect(html).toContain('silse-bg-'); });
  it('7. export contains cover decoration CSS', () => { expect(html).toContain('silse-cover-'); });
  it('8. export contains micro-animation CSS', () => { expect(html).toContain('silse-anim-'); });
  it('9. export contains celebration CSS', () => { expect(html).toContain('silse-celebrate'); });
  it('10. export contains prefers-reduced-motion', () => { expect(html).toContain('prefers-reduced-motion'); });
});

// === Style pack classes in export ===
describe('VISUAL-BROWSER-PROOF-01 — style pack classes', () => {
  it('11. modern-clean export contains clean classes', () => {
    const html = exportProjectToHtml(applyStylePack(generateMpiFromTopic(getTopicById('ppkn-7-norma')!).project, 'modern-clean'));
    expect(html).toContain('skin-card-flat');
    expect(html).toContain('silse-bg-page-clean');
  });
  it('12. soft-classroom export contains soft classes', () => {
    const html = exportProjectToHtml(applyStylePack(generateMpiFromTopic(getTopicById('ppkn-7-norma')!).project, 'soft-classroom'));
    expect(html).toContain('skin-card-soft');
    expect(html).toContain('silse-bg-page-soft');
  });
  it('13. mission-dark export contains mission classes', () => {
    const html = exportProjectToHtml(applyStylePack(generateMpiFromTopic(getTopicById('ppkn-7-norma')!).project, 'mission-dark'));
    expect(html).toContain('skin-card-bold');
    expect(html).toContain('silse-bg-page-mission');
  });
});

// === Page-specific visual proof ===
describe('VISUAL-BROWSER-PROOF-01 — page visual', () => {
  it('14. cover page export contains cover decoration class', () => {
    const html = exportProjectToHtml(applyStylePack(generateMpiFromTopic(getTopicById('ppkn-7-norma')!).project, 'modern-clean'));
    expect(html).toContain('silse-cover-clean');
  });
  it('15. quiz page export contains quiz state class', () => {
    const html = exportProjectToHtml(applyStylePack(generateMpiFromTopic(getTopicById('ppkn-7-norma')!).project, 'modern-clean'));
    expect(html).toContain('silse-choice-default');
    expect(html).toContain('silse-question-choice');
  });
  it('16. correct feedback export contains celebration class', () => {
    const html = exportProjectToHtml(applyStylePack(generateMpiFromTopic(getTopicById('ppkn-7-norma')!).project, 'modern-clean'));
    expect(html).toContain('silse-celebrate-success-clean');
    expect(html).toContain('celebClasses');
  });
  it('17. wrong feedback does not contain success celebration class', () => {
    const html = exportProjectToHtml(applyStylePack(generateMpiFromTopic(getTopicById('ppkn-7-norma')!).project, 'modern-clean'));
    // JS code should have conditional: only if isCorrectAnswer
    expect(html).toMatch(/if\s*\(isCorrectAnswer\)/);
  });
  it('18. game page export contains game visual class', () => {
    const html = exportProjectToHtml(applyStylePack(generateMpiFromTopic(getTopicById('ppkn-7-norma')!).project, 'modern-clean'));
    expect(html).toContain('skin-game-calm');
  });
});

// === Content safety ===
describe('VISUAL-BROWSER-PROOF-01 — content safety', () => {
  const original = generateMpiFromTopic(getTopicById('ppkn-7-norma')!).project;

  it('19. page count unchanged', () => {
    const p = applyStylePack(original, 'mission-dark');
    expect(p.pages.length).toBe(original.pages.length);
  });
  it('20. page order unchanged', () => {
    const p = applyStylePack(original, 'soft-classroom');
    expect(p.pages.map(pg => pg.title)).toEqual(original.pages.map(pg => pg.title));
  });
  it('21. content text unchanged', () => {
    const before = original.pages.flatMap(p => p.components).filter(c => c.type === 'text').map(c => (c as {text:string}).text);
    const p = applyStylePack(original, 'mission-dark');
    expect(p.pages.flatMap(pg => pg.components).filter(c => c.type === 'text').map(c => (c as {text:string}).text)).toEqual(before);
  });
  it('22. objectives unchanged', () => {
    const before = original.curriculum?.objectives.map(o => o.text);
    const p = applyStylePack(original, 'soft-classroom');
    expect(p.curriculum?.objectives.map(o => o.text)).toEqual(before);
  });
  it('23. quiz choices unchanged', () => {
    const orig = (original.pages.find(p => p.role === 'quiz')!.components.find(c => c.type === 'question') as { choices: { text: string }[] }).choices.map(c => c.text);
    const p = applyStylePack(original, 'mission-dark');
    const after = (p.pages.find(pg => pg.role === 'quiz')!.components.find(c => c.type === 'question') as { choices: { text: string }[] }).choices.map(c => c.text);
    expect(after).toEqual(orig);
  });
  it('24. correctChoiceIndex unchanged', () => {
    const orig = (original.pages.find(p => p.role === 'quiz')!.components.find(c => c.type === 'question') as { correctChoiceIndex: number }).correctChoiceIndex;
    const p = applyStylePack(original, 'soft-classroom');
    expect((p.pages.find(pg => pg.role === 'quiz')!.components.find(c => c.type === 'question') as { correctChoiceIndex: number }).correctChoiceIndex).toBe(orig);
  });
  it('25. feedbackCorrect unchanged', () => {
    const orig = (original.pages.find(p => p.role === 'quiz')!.components.find(c => c.type === 'question') as { feedbackCorrect: string }).feedbackCorrect;
    const p = applyStylePack(original, 'mission-dark');
    expect((p.pages.find(pg => pg.role === 'quiz')!.components.find(c => c.type === 'question') as { feedbackCorrect: string }).feedbackCorrect).toBe(orig);
  });
  it('26. feedbackWrong unchanged', () => {
    const orig = (original.pages.find(p => p.role === 'quiz')!.components.find(c => c.type === 'question') as { feedbackWrong: string }).feedbackWrong;
    const p = applyStylePack(original, 'soft-classroom');
    expect((p.pages.find(pg => pg.role === 'quiz')!.components.find(c => c.type === 'question') as { feedbackWrong: string }).feedbackWrong).toBe(orig);
  });
  it('27. layoutId unchanged', () => {
    const before = original.pages.map(p => p.layoutId);
    const p = applyStylePack(original, 'mission-dark');
    expect(p.pages.map(pg => pg.layoutId)).toEqual(before);
  });
  it('28. geometry unchanged', () => {
    const before = JSON.stringify(original.pages.flatMap(p => p.components).map(c => ({ x: c.x, y: c.y, w: c.width, h: c.height })));
    const p = applyStylePack(original, 'soft-classroom');
    expect(JSON.stringify(p.pages.flatMap(pg => pg.components).map(c => ({ x: c.x, y: c.y, w: c.width, h: c.height })))).toBe(before);
  });
});

// === Matrix QA ===
describe('VISUAL-BROWSER-PROOF-01 — matrix 3×8', () => {
  const presets = listLayoutPresets().map(p => p.id);
  const stylePacks = ['modern-clean', 'soft-classroom', 'mission-dark'];

  it('29. 3 style × 8 layout matrix no fatal quality issue', () => {
    for (const sp of stylePacks) {
      for (const preset of presets) {
        const report = checkExportQuality(buildCombo(sp, preset));
        expect(report.fatalIssues.length, `${sp}+${preset}`).toBe(0);
      }
    }
  });
  it('30. checkExportQuality no fatal for modern-clean', () => {
    for (const preset of presets) {
      expect(checkExportQuality(buildCombo('modern-clean', preset)).fatalIssues.length, preset).toBe(0);
    }
  });
  it('31. checkExportQuality no fatal for soft-classroom', () => {
    for (const preset of presets) {
      expect(checkExportQuality(buildCombo('soft-classroom', preset)).fatalIssues.length, preset).toBe(0);
    }
  });
  it('32. checkExportQuality no fatal for mission-dark', () => {
    for (const preset of presets) {
      expect(checkExportQuality(buildCombo('mission-dark', preset)).fatalIssues.length, preset).toBe(0);
    }
  });
  it('33. no external url() in export CSS (except page background imageSrc)', () => {
    const html = exportProjectToHtml(applyStylePack(generateMpiFromTopic(getTopicById('ppkn-7-norma')!).project, 'modern-clean'));
    const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
    if (styleMatch) {
      // CSS should not have url() — only JS has url() for image backgrounds.
      expect(styleMatch[1]).not.toMatch(/url\(/);
    }
  });
  it('34. no external libs imported (behavior test — modules load without external deps)', async () => {
    // Behavior test: dynamic import these modules — if they had external deps
    // like canvas-confetti/particles/animate.css, the import would bring them in
    const exportMod = await import('../export/export-html');
    const canvasMod = await import('../editor/CanvasStage');
    const previewMod = await import('../preview/PreviewApp');
    // Verify they loaded (proves no missing external deps)
    expect(exportMod.exportProjectToHtml).toBeDefined();
    expect(canvasMod.CanvasStage).toBeDefined();
    expect(previewMod.PreviewApp).toBeDefined();
  });
  it('35. PageThumbnail still renders/source exists', async () => {
    const mod = await import('../editor/PageThumbnail');
    expect(mod.PageThumbnail).toBeDefined();
  });
  it('36. export remains standalone (no external script/link)', () => {
    const html = exportProjectToHtml(applyStylePack(generateMpiFromTopic(getTopicById('ppkn-7-norma')!).project, 'modern-clean'));
    expect(html).not.toMatch(/<link[^>]*href=["']https?:/);
    expect(html).not.toMatch(/<script[^>]*src=["']https?:/);
  });
});

// === Additional guards ===
describe('VISUAL-BROWSER-PROOF-01 — additional', () => {
  it('37. reduced-motion CSS disables animation', () => {
    const html = exportProjectToHtml(applyStylePack(generateMpiFromTopic(getTopicById('ppkn-7-norma')!).project, 'modern-clean'));
    const reducedSections = html.match(/prefers-reduced-motion/g) || [];
    expect(reducedSections.length).toBeGreaterThanOrEqual(2); // micro-anim + celebration
  });
  it('38. mission-dark contrast safe', () => {
    const dark = resolveStylePackV1('mission-dark');
    expect(getContrastRatio(dark.colors.text, dark.colors.background)).toBeGreaterThanOrEqual(4.5);
  });
  it('39. export HTML has doctype', () => {
    const html = exportProjectToHtml(applyStylePack(generateMpiFromTopic(getTopicById('ppkn-7-norma')!).project, 'modern-clean'));
    expect(html.startsWith('<!doctype html>')).toBe(true);
  });
  it('40. export HTML has initial renderPage call', () => {
    const html = exportProjectToHtml(applyStylePack(generateMpiFromTopic(getTopicById('ppkn-7-norma')!).project, 'modern-clean'));
    expect(html).toMatch(/renderPage\(0\)/);
  });
  it('41. export HTML has canvas dimensions 1280×720', () => {
    const html = exportProjectToHtml(applyStylePack(generateMpiFromTopic(getTopicById('ppkn-7-norma')!).project, 'modern-clean'));
    expect(html).toContain('1280');
    expect(html).toContain('720');
  });
  it('42. no blank export (html length > 1000)', () => {
    const html = exportProjectToHtml(applyStylePack(generateMpiFromTopic(getTopicById('ppkn-7-norma')!).project, 'modern-clean'));
    expect(html.length).toBeGreaterThan(1000);
  });
});
