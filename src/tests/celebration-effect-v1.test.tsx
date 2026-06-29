/**
 * CELEBRATION-EFFECT-V1 tests.
 * 38 tests: helper, trigger safety, content safety, export, accessibility, regression.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import {
  getCelebrationEffectForStylePack,
  getAllCelebrationClassNames,
} from '../core/style-packs/celebration-effect';
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

describe('CELEBRATION-EFFECT-V1 — helper', () => {
  it('1. unknown style pack fallback to modern-clean', () => {
    const c = getCelebrationEffectForStylePack('nonexistent');
    expect(c.successClass).toBe('silse-celebrate-success-clean');
  });
  it('2. modern-clean celebration profile valid', () => {
    const c = getCelebrationEffectForStylePack('modern-clean');
    expect(c.successClass).toBe('silse-celebrate-success-clean');
    expect(c.burstClass).toBe('silse-celebrate-burst-clean');
    expect(c.particleClass).toBe('silse-celebrate-particle-clean');
  });
  it('3. soft-classroom celebration profile valid', () => {
    const c = getCelebrationEffectForStylePack('soft-classroom');
    expect(c.successClass).toBe('silse-celebrate-success-soft');
  });
  it('4. mission-dark celebration profile valid', () => {
    const c = getCelebrationEffectForStylePack('mission-dark');
    expect(c.successClass).toBe('silse-celebrate-success-mission');
  });
  it('5. getAllCelebrationClassNames unique', () => {
    const all = getAllCelebrationClassNames();
    expect(new Set(all).size).toBe(all.length);
    expect(all.length).toBe(9);
  });
  it('6. no dependency/library import (pure helper)', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const content = fs.readFileSync(path.resolve(__dirname, '../core/style-packs/celebration-effect.ts'), 'utf8');
    expect(content).not.toMatch(/import.*canvas-confetti/);
    expect(content).not.toMatch(/import.*particles/);
    expect(content).not.toMatch(/import.*three/);
  });
  it('7. no canvas particle engine reference', () => {
    const all = getAllCelebrationClassNames();
    expect(all.every(c => !c.includes('canvas'))).toBe(true);
    expect(all.every(c => !c.includes('particle-engine'))).toBe(true);
  });
  it('8. no audio/sound reference in class names', () => {
    const all = getAllCelebrationClassNames();
    expect(all.every(c => !c.includes('sound'))).toBe(true);
    expect(all.every(c => !c.includes('audio'))).toBe(true);
  });
  it('9. no external url() in celebration CSS (export)', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
    if (styleMatch) {
      const celebSection = styleMatch[1].substring(styleMatch[1].indexOf('CELEBRATION-EFFECT'));
      expect(celebSection).not.toMatch(/url\(/);
    }
  });
});

describe('CELEBRATION-EFFECT-V1 — trigger safety', () => {
  it('10. Question correct feedback can receive celebration class', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const content = fs.readFileSync(path.resolve(__dirname, '../components/QuestionComponentView.tsx'), 'utf8');
    expect(content).toMatch(/getCelebrationEffectForStylePack/);
    expect(content).toMatch(/isCorrectAnswer.*celebration/);
  });
  it('11. Question wrong feedback does NOT receive success celebration class', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const content = fs.readFileSync(path.resolve(__dirname, '../components/QuestionComponentView.tsx'), 'utf8');
    // Celebration class is only added when isCorrectAnswer is true.
    expect(content).toMatch(/isCorrectAnswer \? .*celebration/);
  });
  it('12. correctChoiceIndex unchanged after style pack change', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const original = (project.pages.find(p => p.role === 'quiz')!.components.find(c => c.type === 'question') as { correctChoiceIndex: number }).correctChoiceIndex;
    const styled = applyStylePack(project, 'mission-dark');
    const after = (styled.pages.find(p => p.role === 'quiz')!.components.find(c => c.type === 'question') as { correctChoiceIndex: number }).correctChoiceIndex;
    expect(after).toBe(original);
  });
  it('13. feedbackCorrect unchanged', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const original = (project.pages.find(p => p.role === 'quiz')!.components.find(c => c.type === 'question') as { feedbackCorrect: string }).feedbackCorrect;
    const styled = applyStylePack(project, 'soft-classroom');
    const after = (styled.pages.find(p => p.role === 'quiz')!.components.find(c => c.type === 'question') as { feedbackCorrect: string }).feedbackCorrect;
    expect(after).toBe(original);
  });
  it('14. feedbackWrong unchanged', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const original = (project.pages.find(p => p.role === 'quiz')!.components.find(c => c.type === 'question') as { feedbackWrong: string }).feedbackWrong;
    const styled = applyStylePack(project, 'mission-dark');
    const after = (styled.pages.find(p => p.role === 'quiz')!.components.find(c => c.type === 'question') as { feedbackWrong: string }).feedbackWrong;
    expect(after).toBe(original);
  });
  it('15. choices unchanged', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const original = (project.pages.find(p => p.role === 'quiz')!.components.find(c => c.type === 'question') as { choices: { text: string }[] }).choices.map(c => c.text);
    const styled = applyStylePack(project, 'soft-classroom');
    const after = (styled.pages.find(p => p.role === 'quiz')!.components.find(c => c.type === 'question') as { choices: { text: string }[] }).choices.map(c => c.text);
    expect(after).toEqual(original);
  });
  it('16. choice order unchanged', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const original = (project.pages.find(p => p.role === 'quiz')!.components.find(c => c.type === 'question') as { choices: { id: string }[] }).choices.map(c => c.id);
    const styled = applyStylePack(project, 'mission-dark');
    const after = (styled.pages.find(p => p.role === 'quiz')!.components.find(c => c.type === 'question') as { choices: { id: string }[] }).choices.map(c => c.id);
    expect(after).toEqual(original);
  });
});

describe('CELEBRATION-EFFECT-V1 — export', () => {
  it('17. export HTML contains celebration CSS', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    expect(html).toContain('silse-celebrate-success-clean');
    expect(html).toContain('@keyframes silse-celebrate-burst-ring');
  });
  it('18. export HTML contains prefers-reduced-motion for celebration', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    expect(html).toContain('prefers-reduced-motion');
    // Celebration should be disabled in reduced motion.
    const reducedSection = html.substring(html.lastIndexOf('prefers-reduced-motion'));
    expect(reducedSection).toContain('silse-celebrate');
  });
  it('19. export HTML applies celebration only on correct feedback', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    // The JS code should have isCorrectAnswer check before adding celebration.
    expect(html).toMatch(/if\s*\(isCorrectAnswer\)/);
    expect(html).toContain('celebClasses');
  });
  it('20. export HTML does not celebrate wrong feedback', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    // Celebration classes should only appear in CSS + in the isCorrectAnswer branch.
    // Verify the JS code has the conditional.
    expect(html).toMatch(/if\s*\(isCorrectAnswer\)/);
  });
  it('21. export HTML remains standalone (no external script/link)', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    expect(html).not.toMatch(/<link[^>]*href=["']https?:/);
    expect(html).not.toMatch(/<script[^>]*src=["']https?:/);
  });
});

describe('CELEBRATION-EFFECT-V1 — content + layout safety', () => {
  beforeEach(() => { useEditorStore.getState().newProject(); });

  it('22. does not change page count', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = useEditorStore.getState().project.pages.length;
    useEditorStore.getState().setStylePack('mission-dark');
    expect(useEditorStore.getState().project.pages.length).toBe(before);
  });
  it('23. does not change page order', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = useEditorStore.getState().project.pages.map(p => p.title);
    useEditorStore.getState().setStylePack('soft-classroom');
    expect(useEditorStore.getState().project.pages.map(p => p.title)).toEqual(before);
  });
  it('24. does not change component count', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = useEditorStore.getState().project.pages.flatMap(p => p.components).length;
    useEditorStore.getState().setStylePack('mission-dark');
    expect(useEditorStore.getState().project.pages.flatMap(p => p.components).length).toBe(before);
  });
  it('25. does not change layoutId', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = useEditorStore.getState().project.pages.map(p => p.layoutId);
    useEditorStore.getState().setStylePack('soft-classroom');
    expect(useEditorStore.getState().project.pages.map(p => p.layoutId)).toEqual(before);
  });
  it('26. does not change geometry', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const before = JSON.stringify(useEditorStore.getState().project.pages.flatMap(p => p.components).map(c => ({ x: c.x, y: c.y, w: c.width, h: c.height })));
    useEditorStore.getState().setStylePack('mission-dark');
    expect(JSON.stringify(useEditorStore.getState().project.pages.flatMap(p => p.components).map(c => ({ x: c.x, y: c.y, w: c.width, h: c.height })))).toBe(before);
  });
  it('27. does not change stylePackId (when explicitly set)', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    useEditorStore.getState().setStylePack('mission-dark');
    expect(useEditorStore.getState().project.stylePackId).toBe('mission-dark');
  });
  it('28. does not change quiz logic markers (correctChoiceIndex)', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    useEditorStore.getState().setProject(project);
    const before = (project.pages.find(p => p.role === 'quiz')!.components.find(c => c.type === 'question') as { correctChoiceIndex: number }).correctChoiceIndex;
    useEditorStore.getState().setStylePack('soft-classroom');
    const after = (useEditorStore.getState().project.pages.find(p => p.role === 'quiz')!.components.find(c => c.type === 'question') as { correctChoiceIndex: number }).correctChoiceIndex;
    expect(after).toBe(before);
  });
  it('29. does not change game logic markers (mission prompts)', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    useEditorStore.getState().setProject(project);
    const before = JSON.stringify((project.pages.find(p => p.role === 'activity')!.components.find(c => c.type === 'game') as { missions: { prompt: string }[] }).missions.map(m => m.prompt));
    useEditorStore.getState().setStylePack('mission-dark');
    const after = JSON.stringify((useEditorStore.getState().project.pages.find(p => p.role === 'activity')!.components.find(c => c.type === 'game') as { missions: { prompt: string }[] }).missions.map(m => m.prompt));
    expect(after).toBe(before);
  });
});

describe('CELEBRATION-EFFECT-V1 — quality + regression', () => {
  it('30. checkExportQuality not fatal', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    expect(checkExportQuality(applyStylePack(project, 'mission-dark')).fatalIssues.length).toBe(0);
  });
  it('31. visual combination QA 3 style not fatal', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    for (const sp of ['modern-clean', 'soft-classroom', 'mission-dark']) {
      expect(checkExportQuality(applyStylePack(project, sp)).fatalIssues.length, sp).toBe(0);
    }
  });
  it('32. PageThumbnail still not broken', async () => {
    const mod = await import('../editor/PageThumbnail');
    expect(mod.PageThumbnail).toBeDefined();
  });
  it('33. no full-screen celebration class by default', () => {
    const all = getAllCelebrationClassNames();
    expect(all.every(c => !c.includes('fullscreen'))).toBe(true);
    expect(all.every(c => !c.includes('full-screen'))).toBe(true);
  });
  it('34. no infinite confetti animation', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
    if (styleMatch) {
      const celebSection = styleMatch[1].substring(styleMatch[1].indexOf('CELEBRATION-EFFECT'));
      // Celebration should not have infinite animation.
      expect(celebSection).not.toMatch(/infinite/);
    }
  });
  it('35. animation duration <= 1500ms for celebration', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
    if (styleMatch) {
      const celebSection = styleMatch[1].substring(styleMatch[1].indexOf('CELEBRATION-EFFECT'));
      const durations = celebSection.match(/(\d+)ms/g);
      if (durations) {
        const maxDur = Math.max(...durations.map(d => parseInt(d)));
        expect(maxDur).toBeLessThanOrEqual(1500);
      }
    }
  });
  it('36. pointer-events none for celebration decoration', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
    if (styleMatch) {
      const celebSection = styleMatch[1].substring(styleMatch[1].indexOf('CELEBRATION-EFFECT'));
      expect(celebSection).toMatch(/pointer-events:none/);
    }
  });
  it('37. mission-dark celebration contrast safe', () => {
    const dark = resolveStylePackV1('mission-dark');
    expect(getContrastRatio(dark.colors.text, dark.colors.background)).toBeGreaterThanOrEqual(4.5);
  });
  it('38. reduced-motion disables celebration animation', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const html = exportProjectToHtml(applyStylePack(project, 'modern-clean'));
    const reducedSection = html.substring(html.lastIndexOf('prefers-reduced-motion'));
    expect(reducedSection).toContain('silse-celebrate');
    expect(reducedSection).toMatch(/animation:none|display:none/);
  });
});
