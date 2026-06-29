/**
 * PREMIUM-LAYOUT-POLISH-01 tests.
 * 27 tests: layout quality per preset, content safety, export, regression.
 */
import { describe, expect, it } from 'vitest';
import { applyLayoutPresetToPage } from '../core/layout-presets/apply-layout-preset';
import { validateLayoutQuality } from '../core/design/layout-quality';
import { checkExportQuality } from '../core/export-quality-gate';
import { exportProjectToHtml } from '../export/export-html';
import { generateMpiFromTopic } from '../core/guided-flow/generate-mpi-from-topic';
import { getTopicById } from '../core/guided-flow/mpi-topic-catalog';
import { listLayoutPresetsForRole } from '../core/layout-presets/layout-preset-registry';
import { resolveStylePackV1, getProjectStylePackIdV1 } from '../core/style-packs/style-pack-registry';
import { stylePackToProjectStyle } from '../core/style-presets';
import { createComponentId, createPageId } from '../core/ids';
import type { SimpleProject, SimplePage, PageComponent, PageRole } from '../core/types';

function buildPage(role: PageRole, components: PageComponent[], title = 'Test'): SimplePage {
  return { id: createPageId(), title, role, layoutId: 'blank', background: { type: 'color', color: '#fff' }, components };
}
function textComp(text: string, variant = 'body'): PageComponent {
  return { id: createComponentId(), type: 'text', variant: variant as never, text, x: 80, y: 80, width: 600, height: 120 } as never;
}
function navComp(): PageComponent {
  return { id: createComponentId(), type: 'navigation', variant: 'navigation', label: 'Lanjut', action: 'next', x: 900, y: 620, width: 300, height: 60 } as never;
}
function cardComp(body: string, title?: string): PageComponent {
  return { id: createComponentId(), type: 'card', variant: 'infoCard', title, body, x: 80, y: 80, width: 520, height: 140 } as never;
}
function questionComp(prompt: string): PageComponent {
  return { id: createComponentId(), type: 'question', variant: 'multipleChoice', title: 'Kuis', prompt, choices: [{ id: 'a', text: 'A' }], correctChoiceIndex: 0, feedbackCorrect: 'Benar', feedbackWrong: 'Salah', points: 10, scoringStyle: 'points', x: 80, y: 80, width: 600, height: 400 } as never;
}
function gameComp(title: string): PageComponent {
  return { id: createComponentId(), type: 'game', variant: 'adventure', title, instruction: 'Jawab', scoringStyle: 'stars', missions: [], x: 80, y: 80, width: 700, height: 540 } as never;
}

function buildCombination(stylePackId: string, presetId: string): SimpleProject {
  const topic = getTopicById('ppkn-7-norma')!;
  const { project } = generateMpiFromTopic(topic);
  const resolvedId = getProjectStylePackIdV1(stylePackId);
  const pack = resolveStylePackV1(resolvedId);
  const styled: SimpleProject = { ...project, stylePackId: resolvedId, style: stylePackToProjectStyle(pack) };
  return {
    ...styled,
    pages: styled.pages.map((page) => {
      const presets = listLayoutPresetsForRole(page.role);
      if (presets.some((p) => p.id === presetId)) return applyLayoutPresetToPage(page, presetId);
      return page;
    }),
  };
}

// === Layout quality: no OUT_OF_CANVAS per preset ===
describe('PREMIUM-LAYOUT-POLISH-01 — no OUT_OF_CANVAS', () => {
  it('1. cover-centered no OUT_OF_CANVAS', () => {
    const p = buildPage('cover', [textComp('Judul', 'title'), textComp('Sub', 'subtitle')]);
    const r = applyLayoutPresetToPage(p, 'cover-centered');
    expect(validateLayoutQuality(r).issues.some(i => i.code === 'OUT_OF_CANVAS')).toBe(false);
  });
  it('2. cover-split no OUT_OF_CANVAS', () => {
    const p = buildPage('cover', [textComp('Judul', 'title'), textComp('Sub', 'subtitle'), cardComp('Visual')]);
    const r = applyLayoutPresetToPage(p, 'cover-split');
    expect(validateLayoutQuality(r).issues.some(i => i.code === 'OUT_OF_CANVAS')).toBe(false);
  });
  it('3. material-two-column no OUT_OF_CANVAS', () => {
    const p = buildPage('material', [textComp('Materi', 'title'), textComp('Body'), cardComp('Card'), navComp()]);
    const r = applyLayoutPresetToPage(p, 'material-two-column');
    expect(validateLayoutQuality(r).issues.some(i => i.code === 'OUT_OF_CANVAS')).toBe(false);
  });
  it('4. material-card-stack no OUT_OF_CANVAS', () => {
    const p = buildPage('material', [textComp('Materi', 'title'), textComp('Body'), cardComp('C1'), cardComp('C2'), cardComp('C3'), cardComp('C4'), navComp()]);
    const r = applyLayoutPresetToPage(p, 'material-card-stack');
    expect(validateLayoutQuality(r).issues.some(i => i.code === 'OUT_OF_CANVAS')).toBe(false);
  });
  it('5. quiz-focus no OUT_OF_CANVAS', () => {
    const p = buildPage('quiz', [questionComp('Apa?'), navComp()]);
    const r = applyLayoutPresetToPage(p, 'quiz-focus');
    expect(validateLayoutQuality(r).issues.some(i => i.code === 'OUT_OF_CANVAS')).toBe(false);
  });
  it('6. reflection-calm no OUT_OF_CANVAS', () => {
    const p = buildPage('reflection', [cardComp('Refleksi'), navComp()]);
    const r = applyLayoutPresetToPage(p, 'reflection-calm');
    expect(validateLayoutQuality(r).issues.some(i => i.code === 'OUT_OF_CANVAS')).toBe(false);
  });
  it('7. mission-map no OUT_OF_CANVAS', () => {
    const p = buildPage('activity', [gameComp('Game'), navComp()]);
    const r = applyLayoutPresetToPage(p, 'mission-map');
    expect(validateLayoutQuality(r).issues.some(i => i.code === 'OUT_OF_CANVAS')).toBe(false);
  });
  it('8. closing-centered no OUT_OF_CANVAS', () => {
    const p = buildPage('closing', [textComp('Terima Kasih', 'title'), textComp('Semoga bermanfaat', 'subtitle')]);
    const r = applyLayoutPresetToPage(p, 'closing-centered');
    expect(validateLayoutQuality(r).issues.some(i => i.code === 'OUT_OF_CANVAS')).toBe(false);
  });
});

// === No fatal LARGE_OVERLAP ===
describe('PREMIUM-LAYOUT-POLISH-01 — no fatal LARGE_OVERLAP', () => {
  it('9. material-two-column no fatal LARGE_OVERLAP', () => {
    const p = buildPage('material', [textComp('Materi', 'title'), textComp('Body'), cardComp('Card'), navComp()]);
    const r = applyLayoutPresetToPage(p, 'material-two-column');
    const report = checkExportQuality({ ...createMinimalProject([r]), stylePackId: 'modern-clean', style: { tokens: {} } as never });
    expect(report.fatalIssues.filter(i => i.code === 'LARGE_OVERLAP').length).toBe(0);
  });
  it('10. material-card-stack no fatal LARGE_OVERLAP', () => {
    const p = buildPage('material', [textComp('Materi', 'title'), textComp('Body'), cardComp('C1'), cardComp('C2'), cardComp('C3'), cardComp('C4'), navComp()]);
    const r = applyLayoutPresetToPage(p, 'material-card-stack');
    expect(validateLayoutQuality(r).issues.filter(i => i.code === 'LARGE_OVERLAP' && i.severity === 'error').length).toBe(0);
  });
  it('11. quiz-focus no fatal LARGE_OVERLAP', () => {
    const p = buildPage('quiz', [questionComp('Apa?'), navComp()]);
    const r = applyLayoutPresetToPage(p, 'quiz-focus');
    expect(validateLayoutQuality(r).issues.filter(i => i.code === 'LARGE_OVERLAP' && i.severity === 'error').length).toBe(0);
  });
  it('12. mission-map no fatal LARGE_OVERLAP', () => {
    const p = buildPage('activity', [gameComp('Game'), navComp()]);
    const r = applyLayoutPresetToPage(p, 'mission-map');
    expect(validateLayoutQuality(r).issues.filter(i => i.code === 'LARGE_OVERLAP' && i.severity === 'error').length).toBe(0);
  });
});

// === Content safety ===
describe('PREMIUM-LAYOUT-POLISH-01 — content safety', () => {
  const originalProject = generateMpiFromTopic(getTopicById('ppkn-7-norma')!).project;
  it('13. preserves project title', () => {
    const p = buildCombination('modern-clean', 'cover-centered');
    expect(p.title).toBe(originalProject.title);
  });
  it('14. preserves page count', () => {
    const p = buildCombination('modern-clean', 'material-two-column');
    expect(p.pages.length).toBe(originalProject.pages.length);
  });
  it('15. preserves page order', () => {
    const p = buildCombination('modern-clean', 'material-card-stack');
    expect(p.pages.map(pg => pg.title)).toEqual(originalProject.pages.map(pg => pg.title));
  });
  it('16. preserves text content', () => {
    const before = originalProject.pages.flatMap(p => p.components).filter(c => c.type === 'text').map(c => (c as {text:string}).text);
    const p = buildCombination('modern-clean', 'quiz-focus');
    const after = p.pages.flatMap(pg => pg.components).filter(c => c.type === 'text').map(c => (c as {text:string}).text);
    expect(after).toEqual(before);
  });
  it('17. preserves objectives', () => {
    const before = originalProject.curriculum?.objectives.map(o => o.text) ?? [];
    const p = buildCombination('modern-clean', 'reflection-calm');
    expect(p.curriculum?.objectives.map(o => o.text) ?? []).toEqual(before);
  });
  it('18. preserves quiz correct answer', () => {
    const orig = originalProject.pages.find(p => p.role === 'quiz')!.components.find(c => c.type === 'question') as { correctChoiceIndex: number };
    const p = buildCombination('modern-clean', 'mission-map');
    const quiz = p.pages.find(pg => pg.role === 'quiz')!.components.find(c => c.type === 'question') as { correctChoiceIndex: number };
    expect(quiz.correctChoiceIndex).toBe(orig.correctChoiceIndex);
  });
  it('19. preserves quiz feedback', () => {
    const orig = originalProject.pages.find(p => p.role === 'quiz')!.components.find(c => c.type === 'question') as { feedbackCorrect: string; feedbackWrong: string };
    const p = buildCombination('modern-clean', 'closing-centered');
    const quiz = p.pages.find(pg => pg.role === 'quiz')!.components.find(c => c.type === 'question') as { feedbackCorrect: string; feedbackWrong: string };
    expect(quiz.feedbackCorrect).toBe(orig.feedbackCorrect);
    expect(quiz.feedbackWrong).toBe(orig.feedbackWrong);
  });
  it('20. preserves stylePackId', () => {
    const p = buildCombination('mission-dark', 'cover-centered');
    expect(p.stylePackId).toBe('mission-dark');
  });
});

// === Export + regression ===
describe('PREMIUM-LAYOUT-POLISH-01 — export + regression', () => {
  it('21. export HTML still works after polished layouts', () => {
    const p = buildCombination('modern-clean', 'material-two-column');
    const html = exportProjectToHtml(p);
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);
  });
  it('22. export HTML contains same content', () => {
    const p = buildCombination('modern-clean', 'cover-centered');
    const html = exportProjectToHtml(p);
    expect(html).toContain(p.title);
  });
  it('23. visual combination QA still not fatal', () => {
    for (const sp of ['modern-clean', 'soft-classroom', 'mission-dark']) {
      for (const preset of ['cover-centered','cover-split','material-two-column','material-card-stack','quiz-focus','reflection-calm','mission-map','closing-centered']) {
        const p = buildCombination(sp, preset);
        const report = checkExportQuality(p);
        expect(report.fatalIssues.length, `${sp}+${preset}`).toBe(0);
      }
    }
  });
  it('24. PageThumbnail still exists', async () => {
    const mod = await import('../editor/PageThumbnail');
    expect(mod.PageThumbnail).toBeDefined();
  });
  it('25. geometry changes only for layout fields (x/y/width/height)', () => {
    const p = buildPage('material', [textComp('Materi', 'title'), textComp('Body'), navComp()]);
    const r = applyLayoutPresetToPage(p, 'material-two-column');
    // Component IDs should be same.
    expect(r.components.map(c => c.id)).toEqual(p.components.map(c => c.id));
    // Types should be same.
    expect(r.components.map(c => c.type)).toEqual(p.components.map(c => c.type));
    // Text should be same.
    expect((r.components[0] as { text: string }).text).toBe((p.components[0] as { text: string }).text);
  });
  it('26. skin classes remain present after layout polish', () => {
    const p = buildCombination('mission-dark', 'material-two-column');
    const html = exportProjectToHtml(p);
    expect(html).toContain('skin-card-bold');
    expect(html).toContain('skin-button-mission');
  });
  it('27. mission-dark + polished layout not fatal', () => {
    const p = buildCombination('mission-dark', 'material-card-stack');
    const report = checkExportQuality(p);
    expect(report.fatalIssues.length).toBe(0);
  });
});

// Helper for test 9
function createMinimalProject(pages: SimplePage[]): SimpleProject {
  const topic = getTopicById('ppkn-7-norma')!;
  const { project } = generateMpiFromTopic(topic);
  return { ...project, pages };
}
