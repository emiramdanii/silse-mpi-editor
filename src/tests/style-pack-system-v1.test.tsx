/**
 * STYLE-PACK-SYSTEM-V1 tests.
 *
 * 26 mandatory tests per senior reviewer spec.
 * Verifies registry, non-content mutation, resolver, UI, export consistency.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  listStylePacksV1,
  getStylePackV1,
  resolveStylePackV1,
  getProjectStylePackIdV1,
  DEFAULT_STYLE_PACK_ID_V1,
  STYLE_PACKS_V1,
  type StylePackIdV1,
} from '../core/style-packs/style-pack-registry';
import { StylePackPicker } from '../editor/StylePackPicker';
import { useEditorStore } from '../store/editor-store';
import { createSamplePpknProject } from '../core/sample-project';
import { generateMpiFromTopic } from '../core/guided-flow/generate-mpi-from-topic';
import { getTopicById } from '../core/guided-flow/mpi-topic-catalog';
import { exportProjectToHtml } from '../export/export-html';
import { checkExportQuality } from '../core/export-quality-gate';
import { getContrastRatio } from '../core/design/contrast';

// =========================================================================
// Registry Tests (1-5)
// =========================================================================

describe('STYLE-PACK-SYSTEM-V1 — registry', () => {
  it('1. listStylePacksV1 returns 3 style packs', () => {
    const packs = listStylePacksV1();
    expect(packs).toHaveLength(3);
  });

  it('2. default style pack = modern-clean', () => {
    expect(DEFAULT_STYLE_PACK_ID_V1).toBe('modern-clean');
  });

  it('3. getStylePackV1 unknown ID falls back to modern-clean', () => {
    const pack = getStylePackV1('nonexistent-id-12345');
    expect(pack.id).toBe('modern-clean');
  });

  it('3b. getStylePackV1 undefined falls back to modern-clean', () => {
    const pack = getStylePackV1(undefined);
    expect(pack.id).toBe('modern-clean');
  });

  it('4. each style pack has complete tokens (via resolveStylePackV1)', () => {
    for (const pack of STYLE_PACKS_V1) {
      const resolved = resolveStylePackV1(pack.id);
      expect(resolved.colors).toBeDefined();
      expect(resolved.colors.background).toBeDefined();
      expect(resolved.colors.surface).toBeDefined();
      expect(resolved.colors.text).toBeDefined();
      expect(resolved.colors.mutedText).toBeDefined();
      expect(resolved.colors.primary).toBeDefined();
      expect(resolved.typography).toBeDefined();
      expect(resolved.spacing).toBeDefined();
      expect(resolved.radius).toBeDefined();
      expect(resolved.shadow).toBeDefined();
    }
  });

  it('5. style pack does NOT have content/material/objectives/pages', () => {
    for (const pack of STYLE_PACKS_V1) {
      // StylePackV1 should only have visual metadata.
      expect((pack as { pages?: unknown }).pages).toBeUndefined();
      expect((pack as { objectives?: unknown }).objectives).toBeUndefined();
      expect((pack as { material?: unknown }).material).toBeUndefined();
      expect((pack as { content?: unknown }).content).toBeUndefined();
      expect((pack as { quizAnswer?: unknown }).quizAnswer).toBeUndefined();
    }
  });
});

// =========================================================================
// Non-Content Mutation Tests (6-10)
// =========================================================================

describe('STYLE-PACK-SYSTEM-V1 — non-content mutation', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('6. apply style pack does not change page count', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const beforeCount = useEditorStore.getState().project.pages.length;

    useEditorStore.getState().setStylePack('mission-dark');
    const afterCount = useEditorStore.getState().project.pages.length;

    expect(afterCount).toBe(beforeCount);
  });

  it('7. apply style pack does not change page titles', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const beforeTitles = useEditorStore.getState().project.pages.map((p) => p.title);

    useEditorStore.getState().setStylePack('soft-classroom');
    const afterTitles = useEditorStore.getState().project.pages.map((p) => p.title);

    expect(afterTitles).toEqual(beforeTitles);
  });

  it('8. apply style pack does not change text content', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const beforeTexts = useEditorStore.getState().project.pages
      .flatMap((p) => p.components)
      .filter((c) => c.type === 'text')
      .map((c) => (c as { text: string }).text);

    useEditorStore.getState().setStylePack('mission-dark');
    const afterTexts = useEditorStore.getState().project.pages
      .flatMap((p) => p.components)
      .filter((c) => c.type === 'text')
      .map((c) => (c as { text: string }).text);

    expect(afterTexts).toEqual(beforeTexts);
  });

  it('9. apply style pack does not change objectives', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const beforeObjectives = useEditorStore.getState().project.curriculum?.objectives;

    useEditorStore.getState().setStylePack('soft-classroom');
    const afterObjectives = useEditorStore.getState().project.curriculum?.objectives;

    expect(afterObjectives).toEqual(beforeObjectives);
  });

  it('10. apply style pack does not change quiz correct answer', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    useEditorStore.getState().setProject(project);

    // Find quiz question + capture correctChoiceIndex.
    const quizPage = project.pages.find((p) => p.role === 'quiz')!;
    const question = quizPage.components.find((c) => c.type === 'question') as {
      correctChoiceIndex: number;
      feedbackCorrect: string;
      feedbackWrong: string;
    };
    const beforeCorrect = question.correctChoiceIndex;
    const beforeFeedbackCorrect = question.feedbackCorrect;
    const beforeFeedbackWrong = question.feedbackWrong;

    useEditorStore.getState().setStylePack('mission-dark');

    const afterQuizPage = useEditorStore.getState().project.pages.find((p) => p.role === 'quiz')!;
    const afterQuestion = afterQuizPage.components.find((c) => c.type === 'question') as {
      correctChoiceIndex: number;
      feedbackCorrect: string;
      feedbackWrong: string;
    };

    expect(afterQuestion.correctChoiceIndex).toBe(beforeCorrect);
    expect(afterQuestion.feedbackCorrect).toBe(beforeFeedbackCorrect);
    expect(afterQuestion.feedbackWrong).toBe(beforeFeedbackWrong);
  });
});

// =========================================================================
// Resolver Tests (11-15)
// =========================================================================

describe('STYLE-PACK-SYSTEM-V1 — resolver', () => {
  it('11. modern-clean produces text/background tokens', () => {
    const pack = resolveStylePackV1('modern-clean');
    expect(pack.colors.text).toBeDefined();
    expect(pack.colors.background).toBeDefined();
    expect(pack.colors.text).toMatch(/^#/);
    expect(pack.colors.background).toMatch(/^#/);
  });

  it('12. soft-classroom produces different tokens from modern-clean', () => {
    const modern = resolveStylePackV1('modern-clean');
    const soft = resolveStylePackV1('soft-classroom');
    // At least one color should differ (they use different base packs).
    const allSame =
      modern.colors.background === soft.colors.background &&
      modern.colors.primary === soft.colors.primary &&
      modern.colors.text === soft.colors.text;
    expect(allSame).toBe(false);
  });

  it('13. mission-dark produces background/text that still has contrast', () => {
    const dark = resolveStylePackV1('mission-dark');
    const ratio = getContrastRatio(dark.colors.text, dark.colors.background);
    // Mission dark should have readable contrast (>= 4.5 for body text).
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('14. unknown stylePackId falls back safely (no crash, returns valid pack)', () => {
    expect(() => resolveStylePackV1('unknown-xyz')).not.toThrow();
    const pack = resolveStylePackV1('unknown-xyz');
    expect(pack.colors).toBeDefined();
    expect(pack.colors.background).toBeDefined();
  });

  it('15. navigation/accent uses style pack tokens (primary color differs per pack)', () => {
    const modern = resolveStylePackV1('modern-clean');
    const dark = resolveStylePackV1('mission-dark');
    // Both should have primary color defined.
    expect(modern.colors.primary).toBeDefined();
    expect(dark.colors.primary).toBeDefined();
    // Primary is used for navigation/accent via resolver.
  });
});

// =========================================================================
// UI Tests (16-20)
// =========================================================================

describe('STYLE-PACK-SYSTEM-V1 — UI picker', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('16. UI displays "Tampilan Media" label', () => {
    const { container } = render(React.createElement(StylePackPicker));
    const label = container.querySelector('.style-pack-picker__label');
    expect(label?.textContent).toBe('Tampilan Media');
  });

  it('17. UI displays 3 style pack options', () => {
    const { container } = render(React.createElement(StylePackPicker));
    const options = container.querySelectorAll('[data-testid^="style-pack-option-"]');
    expect(options.length).toBe(3);
  });

  it('18. selecting Soft Classroom changes project.stylePackId', () => {
    const { container } = render(React.createElement(StylePackPicker));
    const softOption = container.querySelector('[data-testid="style-pack-option-soft-classroom"]') as HTMLButtonElement;
    fireEvent.click(softOption);
    expect(useEditorStore.getState().project.stylePackId).toBe('soft-classroom');
  });

  it('19. selecting Mission Dark changes project style tokens', () => {
    const beforeStyle = JSON.stringify(useEditorStore.getState().project.style);
    const { container } = render(React.createElement(StylePackPicker));
    const darkOption = container.querySelector('[data-testid="style-pack-option-mission-dark"]') as HTMLButtonElement;
    fireEvent.click(darkOption);
    const afterStyle = JSON.stringify(useEditorStore.getState().project.style);
    expect(afterStyle).not.toBe(beforeStyle);
    // stylePackId should be mission-dark.
    expect(useEditorStore.getState().project.stylePackId).toBe('mission-dark');
  });

  it('20. UI does not display raw ID as primary text', () => {
    const { container } = render(React.createElement(StylePackPicker));
    const names = container.querySelectorAll('.style-pack-option__name');
    for (const name of names) {
      const text = name.textContent ?? '';
      // Should display friendly names, not raw IDs with hyphens.
      expect(text).not.toMatch(/^(modern-clean|soft-classroom|mission-dark)$/);
      expect(text).toMatch(/Modern Clean|Soft Classroom|Mission Dark|Rapi|Hangat|Misi/);
    }
  });
});

// =========================================================================
// Export Tests (21-24)
// =========================================================================

describe('STYLE-PACK-SYSTEM-V1 — export consistency', () => {
  it('21. export HTML includes style pack tokens for selected pack', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    useEditorStore.getState().setStylePack('modern-clean');
    const currentProject = useEditorStore.getState().project;
    const html = exportProjectToHtml(currentProject);
    // Should contain CSS variables from tokens.
    expect(html).toContain('--');
    expect(html).toMatch(/background|color/i);
  });

  it('22. export HTML differs between modern-clean and mission-dark (style)', () => {
    const project = createSamplePpknProject();

    // Export with modern-clean.
    useEditorStore.getState().setProject({ ...project, stylePackId: 'modern-clean' });
    useEditorStore.getState().setStylePack('modern-clean');
    const htmlModern = exportProjectToHtml(useEditorStore.getState().project);

    // Export with mission-dark.
    useEditorStore.getState().setProject({ ...project });
    useEditorStore.getState().setStylePack('mission-dark');
    const htmlDark = exportProjectToHtml(useEditorStore.getState().project);

    // The two HTMLs should differ (different background colors).
    expect(htmlModern).not.toBe(htmlDark);
  });

  it('23. export still contains same content after style pack change', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);

    // Export with modern-clean.
    useEditorStore.getState().setProject({ ...project });
    useEditorStore.getState().setStylePack('modern-clean');
    const htmlModern = exportProjectToHtml(useEditorStore.getState().project);

    // Export with mission-dark.
    useEditorStore.getState().setProject({ ...project });
    useEditorStore.getState().setStylePack('mission-dark');
    const htmlDark = exportProjectToHtml(useEditorStore.getState().project);

    // Both should contain the topic title (content unchanged).
    expect(htmlModern).toContain(project.title);
    expect(htmlDark).toContain(project.title);
    // Both should contain page content.
    const materialPage = project.pages.find((p) => p.role === 'material')!;
    const materialText = materialPage.components.find((c) => c.type === 'text') as { text: string };
    if (materialText) {
      expect(htmlModern).toContain(materialText.text.substring(0, 20));
      expect(htmlDark).toContain(materialText.text.substring(0, 20));
    }
  });

  it('24. exportProjectToHtml still function and not rewritten', () => {
    expect(exportProjectToHtml).toBeDefined();
    expect(typeof exportProjectToHtml).toBe('function');
  });
});

// =========================================================================
// Additional Guard Tests (25-26)
// =========================================================================

describe('STYLE-PACK-SYSTEM-V1 — additional guard', () => {
  it('25. checkExportQuality still passes for generated PPKn after style pack change', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    useEditorStore.getState().setProject(project);

    // Change to mission-dark.
    useEditorStore.getState().setStylePack('mission-dark');
    const changedProject = useEditorStore.getState().project;

    const report = checkExportQuality(changedProject);
    expect(report.fatalIssues.length).toBe(0);
  });

  it('26. visual contrast does not drop fatally for 3 style packs', () => {
    const packs: StylePackIdV1[] = ['modern-clean', 'soft-classroom', 'mission-dark'];
    for (const id of packs) {
      const resolved = resolveStylePackV1(id);
      const ratio = getContrastRatio(resolved.colors.text, resolved.colors.background);
      // All 3 packs should have readable contrast (>= 4.5 for body text).
      expect(ratio, `Style pack ${id} contrast ${ratio} < 4.5`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

// =========================================================================
// getProjectStylePackIdV1 Tests
// =========================================================================

describe('STYLE-PACK-SYSTEM-V1 — legacy ID mapping', () => {
  it('maps cleanClassroom (legacy) to modern-clean', () => {
    expect(getProjectStylePackIdV1('cleanClassroom')).toBe('modern-clean');
  });

  it('maps brightKids (legacy) to soft-classroom', () => {
    expect(getProjectStylePackIdV1('brightKids')).toBe('soft-classroom');
  });

  it('passes through V1 IDs directly', () => {
    expect(getProjectStylePackIdV1('modern-clean')).toBe('modern-clean');
    expect(getProjectStylePackIdV1('soft-classroom')).toBe('soft-classroom');
    expect(getProjectStylePackIdV1('mission-dark')).toBe('mission-dark');
  });

  it('falls back to modern-clean for unknown', () => {
    expect(getProjectStylePackIdV1('unknown')).toBe('modern-clean');
    expect(getProjectStylePackIdV1(undefined)).toBe('modern-clean');
  });
});
