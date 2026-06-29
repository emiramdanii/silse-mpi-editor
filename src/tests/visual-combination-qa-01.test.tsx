/**
 * VISUAL-COMBINATION-QA-01 tests.
 *
 * 27 mandatory tests per senior reviewer spec.
 * Matrix QA: 3 style packs × 8 layout presets (role-aware).
 * Verifies no crash, export OK, no fatal, content safety, layout quality.
 */

import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { generateMpiFromTopic } from '../core/guided-flow/generate-mpi-from-topic';
import { getTopicById } from '../core/guided-flow/mpi-topic-catalog';
import {
  resolveStylePackV1,
  getProjectStylePackIdV1,
  listStylePacksV1,
} from '../core/style-packs/style-pack-registry';
import {
  listLayoutPresets,
  listLayoutPresetsForRole,
} from '../core/layout-presets/layout-preset-registry';
import { applyLayoutPresetToPage } from '../core/layout-presets/apply-layout-preset';
import { stylePackToProjectStyle } from '../core/style-presets';
import { validateLayoutQuality } from '../core/design/layout-quality';
import { checkExportQuality } from '../core/export-quality-gate';
import { exportProjectToHtml } from '../export/export-html';
import { VisualSection } from '../editor/VisualSection';
import { useEditorStore } from '../store/editor-store';
import type { SimpleProject } from '../core/types';

// =========================================================================
// Helpers
// =========================================================================

function applyStylePack(project: SimpleProject, stylePackId: string): SimpleProject {
  const resolvedId = getProjectStylePackIdV1(stylePackId);
  const pack = resolveStylePackV1(resolvedId);
  const projectStyle = stylePackToProjectStyle(pack);
  return { ...project, stylePackId: resolvedId, style: projectStyle };
}

function applyLayoutToAllPages(project: SimpleProject, presetId: string): SimpleProject {
  return {
    ...project,
    pages: project.pages.map((page) => {
      const presets = listLayoutPresetsForRole(page.role);
      if (presets.some((p) => p.id === presetId)) {
        return applyLayoutPresetToPage(page, presetId);
      }
      return page;
    }),
  };
}

function buildCombination(stylePackId: string, presetId: string): SimpleProject {
  const topic = getTopicById('ppkn-7-norma')!;
  const { project } = generateMpiFromTopic(topic);
  const styled = applyStylePack(project, stylePackId);
  return applyLayoutToAllPages(styled, presetId);
}

const STYLE_PACK_IDS = listStylePacksV1().map((p) => p.id);
const LAYOUT_PRESET_IDS = listLayoutPresets().map((p) => p.id);

// =========================================================================
// Matrix Tests (1-3): No crash per style pack
// =========================================================================

describe('VISUAL-COMBINATION-QA-01 — matrix no crash', () => {
  it('1. modern-clean + all presets does not crash', () => {
    for (const presetId of LAYOUT_PRESET_IDS) {
      expect(() => buildCombination('modern-clean', presetId)).not.toThrow();
    }
  });

  it('2. soft-classroom + all presets does not crash', () => {
    for (const presetId of LAYOUT_PRESET_IDS) {
      expect(() => buildCombination('soft-classroom', presetId)).not.toThrow();
    }
  });

  it('3. mission-dark + all presets does not crash', () => {
    for (const presetId of LAYOUT_PRESET_IDS) {
      expect(() => buildCombination('mission-dark', presetId)).not.toThrow();
    }
  });
});

// =========================================================================
// Export Tests (4): All combinations produce HTML
// =========================================================================

describe('VISUAL-COMBINATION-QA-01 — export produces HTML', () => {
  it('4. all combinations produce export HTML', () => {
    for (const styleId of STYLE_PACK_IDS) {
      for (const presetId of LAYOUT_PRESET_IDS) {
        const project = buildCombination(styleId, presetId);
        const html = exportProjectToHtml(project);
        expect(typeof html, `${styleId}+${presetId}`).toBe('string');
        expect(html.length, `${styleId}+${presetId}`).toBeGreaterThan(0);
      }
    }
  });
});

// =========================================================================
// Content Safety Tests (5-13)
// =========================================================================

describe('VISUAL-COMBINATION-QA-01 — content safety', () => {
  const originalProject = generateMpiFromTopic(getTopicById('ppkn-7-norma')!).project;

  it('5. all combinations preserve project title', () => {
    for (const styleId of STYLE_PACK_IDS) {
      for (const presetId of LAYOUT_PRESET_IDS) {
        const project = buildCombination(styleId, presetId);
        expect(project.title, `${styleId}+${presetId}`).toBe(originalProject.title);
      }
    }
  });

  it('6. all combinations preserve page count', () => {
    for (const styleId of STYLE_PACK_IDS) {
      for (const presetId of LAYOUT_PRESET_IDS) {
        const project = buildCombination(styleId, presetId);
        expect(project.pages.length, `${styleId}+${presetId}`).toBe(originalProject.pages.length);
      }
    }
  });

  it('7. all combinations preserve page order (titles)', () => {
    for (const styleId of STYLE_PACK_IDS) {
      for (const presetId of LAYOUT_PRESET_IDS) {
        const project = buildCombination(styleId, presetId);
        const titles = project.pages.map((p) => p.title);
        const originalTitles = originalProject.pages.map((p) => p.title);
        expect(titles, `${styleId}+${presetId}`).toEqual(originalTitles);
      }
    }
  });

  it('8. all combinations preserve text content', () => {
    const originalTexts = originalProject.pages
      .flatMap((p) => p.components)
      .filter((c) => c.type === 'text')
      .map((c) => (c as { text: string }).text);
    for (const styleId of STYLE_PACK_IDS) {
      for (const presetId of LAYOUT_PRESET_IDS) {
        const project = buildCombination(styleId, presetId);
        const texts = project.pages
          .flatMap((p) => p.components)
          .filter((c) => c.type === 'text')
          .map((c) => (c as { text: string }).text);
        expect(texts, `${styleId}+${presetId}`).toEqual(originalTexts);
      }
    }
  });

  it('9. all combinations preserve objectives (text, not id)', () => {
    const originalObjectiveTexts = originalProject.curriculum?.objectives.map((o) => o.text) ?? [];
    for (const styleId of STYLE_PACK_IDS) {
      for (const presetId of LAYOUT_PRESET_IDS) {
        const project = buildCombination(styleId, presetId);
        const objectiveTexts = project.curriculum?.objectives.map((o) => o.text) ?? [];
        expect(objectiveTexts, `${styleId}+${presetId}`).toEqual(originalObjectiveTexts);
      }
    }
  });

  it('10. all combinations preserve quiz correct answer', () => {
    const originalQuiz = originalProject.pages.find((p) => p.role === 'quiz')!;
    const originalQuestion = originalQuiz.components.find((c) => c.type === 'question') as {
      correctChoiceIndex: number;
    };
    for (const styleId of STYLE_PACK_IDS) {
      for (const presetId of LAYOUT_PRESET_IDS) {
        const project = buildCombination(styleId, presetId);
        const quiz = project.pages.find((p) => p.role === 'quiz')!;
        const question = quiz.components.find((c) => c.type === 'question') as {
          correctChoiceIndex: number;
        };
        expect(question.correctChoiceIndex, `${styleId}+${presetId}`).toBe(
          originalQuestion.correctChoiceIndex,
        );
      }
    }
  });

  it('11. all combinations preserve quiz feedback', () => {
    const originalQuiz = originalProject.pages.find((p) => p.role === 'quiz')!;
    const originalQuestion = originalQuiz.components.find((c) => c.type === 'question') as {
      feedbackCorrect: string;
      feedbackWrong: string;
    };
    for (const styleId of STYLE_PACK_IDS) {
      for (const presetId of LAYOUT_PRESET_IDS) {
        const project = buildCombination(styleId, presetId);
        const quiz = project.pages.find((p) => p.role === 'quiz')!;
        const question = quiz.components.find((c) => c.type === 'question') as {
          feedbackCorrect: string;
          feedbackWrong: string;
        };
        expect(question.feedbackCorrect, `${styleId}+${presetId}`).toBe(
          originalQuestion.feedbackCorrect,
        );
        expect(question.feedbackWrong, `${styleId}+${presetId}`).toBe(
          originalQuestion.feedbackWrong,
        );
      }
    }
  });

  it('12. style change does not change layoutId', () => {
    // Apply layout first, then change style — layoutId should stay.
    const project = buildCombination('modern-clean', 'material-two-column');
    const beforeLayoutIds = project.pages.map((p) => p.layoutId);
    const restyled = applyStylePack(project, 'mission-dark');
    const afterLayoutIds = restyled.pages.map((p) => p.layoutId);
    expect(afterLayoutIds).toEqual(beforeLayoutIds);
  });

  it('13. layout change does not change stylePackId', () => {
    const project = buildCombination('mission-dark', 'cover-centered');
    const beforeStylePackId = project.stylePackId;
    const relayouted = applyLayoutToAllPages(project, 'material-card-stack');
    expect(relayouted.stylePackId).toBe(beforeStylePackId);
  });
});

// =========================================================================
// Fatal Quality Tests (14-16)
// =========================================================================

describe('VISUAL-COMBINATION-QA-01 — fatal quality per style', () => {
  it('14. generated PPKn + modern-clean not fatal', () => {
    for (const presetId of LAYOUT_PRESET_IDS) {
      const project = buildCombination('modern-clean', presetId);
      const report = checkExportQuality(project);
      expect(report.fatalIssues.length, `modern-clean+${presetId}`).toBe(0);
    }
  });

  it('15. generated PPKn + soft-classroom not fatal', () => {
    for (const presetId of LAYOUT_PRESET_IDS) {
      const project = buildCombination('soft-classroom', presetId);
      const report = checkExportQuality(project);
      expect(report.fatalIssues.length, `soft-classroom+${presetId}`).toBe(0);
    }
  });

  it('16. generated PPKn + mission-dark not fatal', () => {
    for (const presetId of LAYOUT_PRESET_IDS) {
      const project = buildCombination('mission-dark', presetId);
      const report = checkExportQuality(project);
      expect(report.fatalIssues.length, `mission-dark+${presetId}`).toBe(0);
    }
  });
});

// =========================================================================
// Layout Quality Tests (17-23): No OUT_OF_CANVAS per preset
// =========================================================================

describe('VISUAL-COMBINATION-QA-01 — layout quality per preset', () => {
  it('17. cover-centered has no OUT_OF_CANVAS', () => {
    const project = buildCombination('modern-clean', 'cover-centered');
    for (const page of project.pages) {
      const issues = validateLayoutQuality(page).issues;
      expect(issues.some((i) => i.code === 'OUT_OF_CANVAS')).toBe(false);
    }
  });

  it('18. material-two-column has no OUT_OF_CANVAS', () => {
    const project = buildCombination('modern-clean', 'material-two-column');
    for (const page of project.pages) {
      const issues = validateLayoutQuality(page).issues;
      expect(issues.some((i) => i.code === 'OUT_OF_CANVAS')).toBe(false);
    }
  });

  it('19. material-card-stack has no LARGE_OVERLAP fatal', () => {
    const project = buildCombination('modern-clean', 'material-card-stack');
    const report = checkExportQuality(project);
    const largeOverlapFatal = report.fatalIssues.filter((i) => i.code === 'LARGE_OVERLAP');
    expect(largeOverlapFatal.length).toBe(0);
  });

  it('20. quiz-focus has no OUT_OF_CANVAS', () => {
    const project = buildCombination('modern-clean', 'quiz-focus');
    for (const page of project.pages) {
      const issues = validateLayoutQuality(page).issues;
      expect(issues.some((i) => i.code === 'OUT_OF_CANVAS')).toBe(false);
    }
  });

  it('21. reflection-calm has no OUT_OF_CANVAS', () => {
    const project = buildCombination('modern-clean', 'reflection-calm');
    for (const page of project.pages) {
      const issues = validateLayoutQuality(page).issues;
      expect(issues.some((i) => i.code === 'OUT_OF_CANVAS')).toBe(false);
    }
  });

  it('22. mission-map has no OUT_OF_CANVAS', () => {
    const project = buildCombination('modern-clean', 'mission-map');
    for (const page of project.pages) {
      const issues = validateLayoutQuality(page).issues;
      expect(issues.some((i) => i.code === 'OUT_OF_CANVAS')).toBe(false);
    }
  });

  it('23. closing-centered has no OUT_OF_CANVAS', () => {
    const project = buildCombination('modern-clean', 'closing-centered');
    for (const page of project.pages) {
      const issues = validateLayoutQuality(page).issues;
      expect(issues.some((i) => i.code === 'OUT_OF_CANVAS')).toBe(false);
    }
  });
});

// =========================================================================
// Regression Tests (24-27)
// =========================================================================

describe('VISUAL-COMBINATION-QA-01 — regression', () => {
  it('24. PageThumbnail still exists (not changed)', async () => {
    const mod = await import('../editor/PageThumbnail');
    expect(mod.PageThumbnail).toBeDefined();
  });

  it('25. export HTML differs in style when style pack changed', () => {
    const modern = buildCombination('modern-clean', 'cover-centered');
    const dark = buildCombination('mission-dark', 'cover-centered');
    const htmlModern = exportProjectToHtml(modern);
    const htmlDark = exportProjectToHtml(dark);
    expect(htmlModern).not.toBe(htmlDark);
  });

  it('26. export HTML differs in geometry when layout preset changed', () => {
    const centered = buildCombination('modern-clean', 'cover-centered');
    const split = buildCombination('modern-clean', 'cover-split');
    const htmlCentered = exportProjectToHtml(centered);
    const htmlSplit = exportProjectToHtml(split);
    expect(htmlCentered).not.toBe(htmlSplit);
  });

  it('27. no raw technical ID as primary UI text in VisualSection', () => {
    useEditorStore.getState().newProject();
    const { project } = generateMpiFromTopic(getTopicById('ppkn-7-norma')!);
    useEditorStore.getState().setProject(project);

    const { container } = render(React.createElement(VisualSection));
    const allText = container.textContent ?? '';
    expect(allText).not.toMatch(/\bmodern-clean\b/);
    expect(allText).not.toMatch(/\bsoft-classroom\b/);
    expect(allText).not.toMatch(/\bmission-dark\b/);
    expect(allText).not.toMatch(/\bmaterial-two-column\b/);
    expect(allText).not.toMatch(/\bmaterial-card-stack\b/);
  });
});
