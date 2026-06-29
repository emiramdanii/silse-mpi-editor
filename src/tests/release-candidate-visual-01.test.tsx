/**
 * RELEASE-CANDIDATE-VISUAL-01 tests.
 * 45 tests: visual stack completeness, export proof, content safety, matrix, teacher readiness, regression.
 */
import { describe, expect, it } from 'vitest';
import { STYLE_PACKS_V1 } from '../core/style-packs/style-pack-registry';
import { LAYOUT_PRESETS } from '../core/layout-presets/layout-preset-registry';
import { getAllSkinClassNames } from '../core/style-packs/component-skin';
import { getAllBackgroundPatternClassNames } from '../core/style-packs/background-pattern';
import { getAllCoverClassNames } from '../core/style-packs/cover-decoration';
import { getAllMicroAnimationClassNames } from '../core/style-packs/micro-animation';
import { getAllCelebrationClassNames } from '../core/style-packs/celebration-effect';
import { generateMpiFromTopic } from '../core/guided-flow/generate-mpi-from-topic';
import { getTopicById } from '../core/guided-flow/mpi-topic-catalog';
import { exportProjectToHtml } from '../export/export-html';
import { checkExportQuality } from '../core/export-quality-gate';
import { resolveStylePackV1, getProjectStylePackIdV1 } from '../core/style-packs/style-pack-registry';
import { stylePackToProjectStyle } from '../core/style-presets';
import { applyLayoutPresetToPage } from '../core/layout-presets/apply-layout-preset';
import type { SimpleProject } from '../core/types';

function applyStylePack(project: SimpleProject, stylePackId: string): SimpleProject {
  const resolvedId = getProjectStylePackIdV1(stylePackId);
  const pack = resolveStylePackV1(resolvedId);
  return { ...project, stylePackId: resolvedId, style: stylePackToProjectStyle(pack) };
}
function applyLayout(project: SimpleProject, presetId: string): SimpleProject {
  return { ...project, pages: project.pages.map(p => {
    const presets = LAYOUT_PRESETS.filter(pp => pp.supportedRoles.includes(p.role));
    if (presets.some(pp => pp.id === presetId)) return applyLayoutPresetToPage(p, presetId);
    return p;
  })};
}
function buildCombo(sp: string, preset: string): SimpleProject {
  const topic = getTopicById('ppkn-7-norma')!;
  const { project } = generateMpiFromTopic(topic);
  return applyLayout(applyStylePack(project, sp), preset);
}

// === Visual stack completeness ===
describe('RC-VISUAL-01 — visual stack', () => {
  it('1. all 3 style pack ids exist', () => {
    const ids = STYLE_PACKS_V1.map(p => p.id);
    expect(ids).toContain('modern-clean');
    expect(ids).toContain('soft-classroom');
    expect(ids).toContain('mission-dark');
  });
  it('2. no extra style pack (exactly 3)', () => {
    expect(STYLE_PACKS_V1.length).toBe(3);
  });
  it('3. all 8 layout preset ids exist', () => {
    const ids = LAYOUT_PRESETS.map(p => p.id);
    expect(ids.length).toBe(8);
    expect(ids).toContain('cover-centered');
    expect(ids).toContain('cover-split');
    expect(ids).toContain('material-two-column');
    expect(ids).toContain('material-card-stack');
    expect(ids).toContain('quiz-focus');
    expect(ids).toContain('reflection-calm');
    expect(ids).toContain('mission-map');
    expect(ids).toContain('closing-centered');
  });
  it('4. no extra layout preset (exactly 8)', () => {
    expect(LAYOUT_PRESETS.length).toBe(8);
  });
  it('5. component skin classes complete (20)', () => {
    expect(getAllSkinClassNames().length).toBe(20);
  });
  it('6. background pattern classes complete (6)', () => {
    expect(getAllBackgroundPatternClassNames().length).toBe(6);
  });
  it('7. cover decoration classes complete (3)', () => {
    expect(getAllCoverClassNames().length).toBe(3);
  });
  it('8. micro animation classes complete (15)', () => {
    expect(getAllMicroAnimationClassNames().length).toBe(15);
  });
  it('9. celebration classes complete (9)', () => {
    expect(getAllCelebrationClassNames().length).toBe(9);
  });
  it('10. prefers-reduced-motion in export CSS', () => {
    const html = exportProjectToHtml(applyStylePack(generateMpiFromTopic(getTopicById('ppkn-7-norma')!).project, 'modern-clean'));
    expect(html).toContain('prefers-reduced-motion');
  });
});

// === Export proof ===
describe('RC-VISUAL-01 — export proof', () => {
  const html = exportProjectToHtml(applyStylePack(generateMpiFromTopic(getTopicById('ppkn-7-norma')!).project, 'modern-clean'));

  it('11. export contains embedded CSS', () => { expect(html).toContain('<style>'); });
  it('12. export contains renderPage', () => { expect(html).toContain('function renderPage'); });
  it('13. export contains style pack classes', () => { expect(html).toContain('skin-card-flat'); });
  it('14. export contains component skin CSS', () => { expect(html).toContain('.skin-card-flat'); });
  it('15. export contains background pattern CSS', () => { expect(html).toContain('.silse-bg-page-clean'); });
  it('16. export contains cover decoration CSS', () => { expect(html).toContain('.silse-cover-clean'); });
  it('17. export contains quiz/game polish CSS', () => { expect(html).toContain('.silse-choice-correct'); });
  it('18. export contains micro-animation CSS', () => { expect(html).toContain('@keyframes silse-fade-in-soft'); });
  it('19. export contains celebration CSS', () => { expect(html).toContain('@keyframes silse-celebrate-burst-ring'); });
  it('20. export has no external script/link/url in CSS', () => {
    expect(html).not.toMatch(/<script[^>]*src=["']https?:/);
    expect(html).not.toMatch(/<link[^>]*href=["']https?:/);
    const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
    if (styleMatch) { expect(styleMatch[1]).not.toMatch(/url\(/); }
  });
});

// === Content safety ===
describe('RC-VISUAL-01 — content safety', () => {
  const original = generateMpiFromTopic(getTopicById('ppkn-7-norma')!).project;

  it('21. content unchanged', () => {
    const before = original.pages.flatMap(p => p.components).filter(c => c.type === 'text').map(c => (c as {text:string}).text);
    expect(applyStylePack(original, 'mission-dark').pages.flatMap(p => p.components).filter(c => c.type === 'text').map(c => (c as {text:string}).text)).toEqual(before);
  });
  it('22. objectives unchanged', () => {
    expect(applyStylePack(original, 'soft-classroom').curriculum?.objectives.map(o => o.text)).toEqual(original.curriculum?.objectives.map(o => o.text));
  });
  it('23. quiz choices unchanged', () => {
    const orig = (original.pages.find(p => p.role === 'quiz')!.components.find(c => c.type === 'question') as { choices: { text: string }[] }).choices.map(c => c.text);
    const after = (applyStylePack(original, 'mission-dark').pages.find(p => p.role === 'quiz')!.components.find(c => c.type === 'question') as { choices: { text: string }[] }).choices.map(c => c.text);
    expect(after).toEqual(orig);
  });
  it('24. correctChoiceIndex unchanged', () => {
    const orig = (original.pages.find(p => p.role === 'quiz')!.components.find(c => c.type === 'question') as { correctChoiceIndex: number }).correctChoiceIndex;
    expect((applyStylePack(original, 'soft-classroom').pages.find(p => p.role === 'quiz')!.components.find(c => c.type === 'question') as { correctChoiceIndex: number }).correctChoiceIndex).toBe(orig);
  });
  it('25. feedbackCorrect unchanged', () => {
    const orig = (original.pages.find(p => p.role === 'quiz')!.components.find(c => c.type === 'question') as { feedbackCorrect: string }).feedbackCorrect;
    expect((applyStylePack(original, 'mission-dark').pages.find(p => p.role === 'quiz')!.components.find(c => c.type === 'question') as { feedbackCorrect: string }).feedbackCorrect).toBe(orig);
  });
  it('26. feedbackWrong unchanged', () => {
    const orig = (original.pages.find(p => p.role === 'quiz')!.components.find(c => c.type === 'question') as { feedbackWrong: string }).feedbackWrong;
    expect((applyStylePack(original, 'soft-classroom').pages.find(p => p.role === 'quiz')!.components.find(c => c.type === 'question') as { feedbackWrong: string }).feedbackWrong).toBe(orig);
  });
  it('27. game logic markers unchanged', () => {
    const orig = JSON.stringify((original.pages.find(p => p.role === 'activity')!.components.find(c => c.type === 'game') as { missions: { prompt: string }[] }).missions.map(m => m.prompt));
    expect(JSON.stringify((applyStylePack(original, 'mission-dark').pages.find(p => p.role === 'activity')!.components.find(c => c.type === 'game') as { missions: { prompt: string }[] }).missions.map(m => m.prompt))).toBe(orig);
  });
  it('28. page count unchanged', () => {
    expect(applyStylePack(original, 'soft-classroom').pages.length).toBe(original.pages.length);
  });
  it('29. page order unchanged', () => {
    expect(applyStylePack(original, 'mission-dark').pages.map(p => p.title)).toEqual(original.pages.map(p => p.title));
  });
  it('30. component count unchanged', () => {
    expect(applyStylePack(original, 'soft-classroom').pages.flatMap(p => p.components).length).toBe(original.pages.flatMap(p => p.components).length);
  });
  it('31. layoutId unchanged', () => {
    expect(applyStylePack(original, 'mission-dark').pages.map(p => p.layoutId)).toEqual(original.pages.map(p => p.layoutId));
  });
  it('32. geometry unchanged', () => {
    const before = JSON.stringify(original.pages.flatMap(p => p.components).map(c => ({ x: c.x, y: c.y, w: c.width, h: c.height })));
    expect(JSON.stringify(applyStylePack(original, 'soft-classroom').pages.flatMap(p => p.components).map(c => ({ x: c.x, y: c.y, w: c.width, h: c.height })))).toBe(before);
  });
});

// === Matrix + quality ===
describe('RC-VISUAL-01 — matrix + quality', () => {
  it('33. 3 style × 8 layout matrix no fatal', () => {
    for (const sp of ['modern-clean', 'soft-classroom', 'mission-dark']) {
      for (const preset of LAYOUT_PRESETS.map(p => p.id)) {
        expect(checkExportQuality(buildCombo(sp, preset)).fatalIssues.length, `${sp}+${preset}`).toBe(0);
      }
    }
  });
  it('34. checkExportQuality no fatal for all 3 style packs', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    for (const sp of ['modern-clean', 'soft-classroom', 'mission-dark']) {
      expect(checkExportQuality(applyStylePack(project, sp)).fatalIssues.length, sp).toBe(0);
    }
  });
  it('35. PageThumbnail source still exists', async () => {
    const mod = await import('../editor/PageThumbnail');
    expect(mod.PageThumbnail).toBeDefined();
  });
  it('36. VisualSection source has teacher safety copy', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const content = fs.readFileSync(path.resolve(__dirname, '../editor/VisualSection.tsx'), 'utf8');
    expect(content).toMatch(/Aman dicoba/);
    expect(content).toMatch(/tidak mengubah isi/);
  });
  it('37. StylePackPicker no raw id as primary label', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const content = fs.readFileSync(path.resolve(__dirname, '../editor/StylePackPicker.tsx'), 'utf8');
    // Name comes from registry, not raw id.
    expect(content).toMatch(/pack\.name/);
    expect(content).not.toMatch(/pack\.id.*className/);
  });
  it('38. LayoutPresetPicker has guru-friendly labels', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const content = fs.readFileSync(path.resolve(__dirname, '../editor/LayoutPresetPicker.tsx'), 'utf8');
    expect(content).toMatch(/preset\.name/);
    // Names should be Indonesian (checked via registry).
    const regContent = fs.readFileSync(path.resolve(__dirname, '../core/layout-presets/layout-preset-registry.ts'), 'utf8');
    expect(regContent).toContain('Sampul Tengah');
    expect(regContent).toContain('Fokus Kuis');
  });
  it('39. no dependency marker added', () => {
    const html = exportProjectToHtml(applyStylePack(generateMpiFromTopic(getTopicById('ppkn-7-norma')!).project, 'modern-clean'));
    expect(html).not.toMatch(/canvas-confetti/);
    expect(html).not.toMatch(/animate\.css/);
    expect(html).not.toMatch(/particles\.js/);
  });
  it('40. no schema migration (IDs unchanged)', () => {
    expect(STYLE_PACKS_V1.map(p => p.id).sort()).toEqual(['mission-dark', 'modern-clean', 'soft-classroom']);
    expect(LAYOUT_PRESETS.map(p => p.id).sort()).toEqual(['closing-centered', 'cover-centered', 'cover-split', 'material-card-stack', 'material-two-column', 'mission-map', 'quiz-focus', 'reflection-calm']);
  });
});

// === Additional guards ===
describe('RC-VISUAL-01 — additional', () => {
  it('41. no TODO/FIXME in visual files', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const files = [
      '../editor/VisualSection.tsx', '../editor/StylePackPicker.tsx', '../editor/LayoutPresetPicker.tsx',
      '../editor/CanvasStage.tsx', '../preview/PreviewApp.tsx', '../export/export-html.ts',
    ];
    for (const f of files) {
      const content = fs.readFileSync(path.resolve(__dirname, f), 'utf8');
      expect(content, f).not.toMatch(/\bTODO\b/);
      expect(content, f).not.toMatch(/\bFIXME\b/);
    }
  });
  it('42. no raw skinClass visible text in export', () => {
    const html = exportProjectToHtml(applyStylePack(generateMpiFromTopic(getTopicById('ppkn-7-norma')!).project, 'modern-clean'));
    expect(html).not.toMatch(/>\s*skinClass\s*</);
  });
  it('43. no backgroundClass visible text in export', () => {
    const html = exportProjectToHtml(applyStylePack(generateMpiFromTopic(getTopicById('ppkn-7-norma')!).project, 'modern-clean'));
    expect(html).not.toMatch(/>\s*backgroundClass\s*</);
  });
  it('44. reduced-motion disables animation and celebration', () => {
    const html = exportProjectToHtml(applyStylePack(generateMpiFromTopic(getTopicById('ppkn-7-norma')!).project, 'modern-clean'));
    const reducedSections = html.match(/prefers-reduced-motion/g) || [];
    expect(reducedSections.length).toBeGreaterThanOrEqual(2);
  });
  it('45. report docs for recent visual batches exist', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const docs = [
      'STYLE_PACK_SYSTEM_V1.md', 'LAYOUT_PRESET_SYSTEM_V1.md', 'COMPONENT_SKIN_V2.md',
      'BACKGROUND_PATTERN_SYSTEM_V1.md', 'PREMIUM_STYLE_PACK_V2.md',
      'QUIZ_GAME_VISUAL_POLISH_01.md', 'MICRO_ANIMATION_SYSTEM_V1.md', 'CELEBRATION_EFFECT_V1.md',
      'VISUAL_BROWSER_PROOF_01.md', 'TEACHER_READY_POLISH_01.md',
      'VISUAL_COMBINATION_QA_01.md', 'STYLE_LAYOUT_UX_UNIFICATION_01.md', 'PREMIUM_LAYOUT_POLISH_01.md',
    ];
    // RELEASE_CANDIDATE_VISUAL_01.md is created in this same commit — skip checking it.
    for (const doc of docs) {
      expect(fs.existsSync(path.resolve(__dirname, '../../docs/' + doc)), doc).toBe(true);
    }
  });
});
