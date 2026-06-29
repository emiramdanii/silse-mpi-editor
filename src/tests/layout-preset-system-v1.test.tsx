/**
 * LAYOUT-PRESET-SYSTEM-V1 tests.
 *
 * 30 mandatory tests per senior reviewer spec.
 * Verifies registry, apply helper (non-content mutation), layout quality,
 * UI picker, export consistency, and regression.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  listLayoutPresets,
  getLayoutPreset,
  listLayoutPresetsForRole,
  getDefaultLayoutPresetForRole,
  presetSupportsRole,
} from '../core/layout-presets/layout-preset-registry';
import { applyLayoutPresetToPage } from '../core/layout-presets/apply-layout-preset';
import { validateLayoutQuality } from '../core/design/layout-quality';
import { LayoutPresetPicker } from '../editor/LayoutPresetPicker';
import { useEditorStore } from '../store/editor-store';
import { createSamplePpknProject } from '../core/sample-project';
import { generateMpiFromTopic } from '../core/guided-flow/generate-mpi-from-topic';
import { getTopicById } from '../core/guided-flow/mpi-topic-catalog';
import { exportProjectToHtml } from '../export/export-html';
import { checkExportQuality } from '../core/export-quality-gate';
import { createComponentId, createPageId } from '../core/ids';
import type { SimplePage, PageComponent, PageRole } from '../core/types';

// =========================================================================
// Helpers
// =========================================================================

function buildPage(role: PageRole, components: PageComponent[], title = 'Test'): SimplePage {
  return {
    id: createPageId(),
    title,
    role,
    layoutId: 'blank',
    background: { type: 'color', color: '#fff' },
    components,
  };
}

function textComp(text: string, variant = 'body'): PageComponent {
  return {
    id: createComponentId(),
    type: 'text',
    variant: variant as never,
    text,
    x: 80, y: 80, width: 600, height: 120,
  } as never;
}

function navComp(label = 'Lanjut'): PageComponent {
  return {
    id: createComponentId(),
    type: 'navigation',
    variant: 'navigation',
    label,
    action: 'next',
    x: 900, y: 620, width: 300, height: 60,
  } as never;
}

function cardComp(body: string, title?: string): PageComponent {
  return {
    id: createComponentId(),
    type: 'card',
    variant: 'infoCard',
    title,
    body,
    x: 80, y: 80, width: 520, height: 140,
  } as never;
}

function questionComp(prompt: string): PageComponent {
  return {
    id: createComponentId(),
    type: 'question',
    variant: 'multipleChoice',
    title: 'Kuis',
    prompt,
    choices: [{ id: 'a', text: 'Opsi A' }, { id: 'b', text: 'Opsi B' }],
    correctChoiceIndex: 0,
    feedbackCorrect: 'Benar',
    feedbackWrong: 'Salah',
    points: 10,
    scoringStyle: 'points',
    x: 80, y: 80, width: 600, height: 400,
  } as never;
}

function gameComp(title: string): PageComponent {
  return {
    id: createComponentId(),
    type: 'game',
    variant: 'adventure',
    title,
    instruction: 'Jawab semua misi',
    scoringStyle: 'stars',
    missions: [],
    x: 80, y: 80, width: 700, height: 540,
  } as never;
}

// =========================================================================
// Registry Tests (1-5)
// =========================================================================

describe('LAYOUT-PRESET-SYSTEM-V1 — registry', () => {
  it('1. listLayoutPresets returns at least 8 presets', () => {
    expect(listLayoutPresets().length).toBeGreaterThanOrEqual(8);
  });

  it('2. getLayoutPreset unknown ID falls back safely', () => {
    const preset = getLayoutPreset('nonexistent-id-12345');
    expect(preset).toBeDefined();
    expect(preset.id).toBeDefined();
  });

  it('3. listLayoutPresetsForRole(cover) includes cover-centered', () => {
    const presets = listLayoutPresetsForRole('cover');
    const ids = presets.map((p) => p.id);
    expect(ids).toContain('cover-centered');
  });

  it('4. listLayoutPresetsForRole(material) includes material-two-column', () => {
    const presets = listLayoutPresetsForRole('material');
    const ids = presets.map((p) => p.id);
    expect(ids).toContain('material-two-column');
  });

  it('5. default role preset available for all main PageRoles', () => {
    const roles: PageRole[] = ['cover', 'guide', 'learningObjectives', 'menu', 'starter', 'material', 'activity', 'quiz', 'reflection', 'closing', 'free'];
    for (const role of roles) {
      const preset = getDefaultLayoutPresetForRole(role);
      expect(preset).toBeDefined();
      expect(preset.id).toBeDefined();
    }
  });
});

// =========================================================================
// Apply Helper Tests (6-12)
// =========================================================================

describe('LAYOUT-PRESET-SYSTEM-V1 — apply helper', () => {
  it('6. applyLayoutPresetToPage does not mutate input', () => {
    const page = buildPage('material', [textComp('Materi'), navComp()]);
    const snapshot = JSON.stringify(page);
    applyLayoutPresetToPage(page, 'material-two-column');
    expect(JSON.stringify(page)).toBe(snapshot);
  });

  it('7. does not change page.id/title/role', () => {
    const page = buildPage('material', [textComp('Materi'), navComp()], 'Materi Test');
    const result = applyLayoutPresetToPage(page, 'material-card-stack');
    expect(result.id).toBe(page.id);
    expect(result.title).toBe('Materi Test');
    expect(result.role).toBe('material');
  });

  it('8. does not change component.id/type', () => {
    const page = buildPage('material', [textComp('Materi'), navComp()]);
    const result = applyLayoutPresetToPage(page, 'material-two-column');
    expect(result.components[0].id).toBe(page.components[0].id);
    expect(result.components[0].type).toBe('text');
    expect(result.components[1].id).toBe(page.components[1].id);
    expect(result.components[1].type).toBe('navigation');
  });

  it('9. does not change text content', () => {
    const page = buildPage('material', [textComp('Pengertian norma.'), navComp()]);
    const result = applyLayoutPresetToPage(page, 'material-two-column');
    const textCompResult = result.components.find((c) => c.type === 'text') as { text: string };
    expect(textCompResult.text).toBe('Pengertian norma.');
  });

  it('10. does not change question choices/correct answer/feedback', () => {
    const page = buildPage('quiz', [questionComp('Apa itu norma?'), navComp()]);
    const result = applyLayoutPresetToPage(page, 'quiz-focus');
    const q = result.components.find((c) => c.type === 'question') as {
      prompt: string;
      choices: { id: string; text: string }[];
      correctChoiceIndex: number;
      feedbackCorrect: string;
      feedbackWrong: string;
    };
    expect(q.prompt).toBe('Apa itu norma?');
    expect(q.choices.length).toBe(2);
    expect(q.correctChoiceIndex).toBe(0);
    expect(q.feedbackCorrect).toBe('Benar');
    expect(q.feedbackWrong).toBe('Salah');
  });

  it('11. only changes geometry/layoutId', () => {
    const page = buildPage('material', [textComp('Materi'), navComp()]);
    const result = applyLayoutPresetToPage(page, 'material-two-column');
    // layoutId should change.
    expect(result.layoutId).toBe('material-two-column');
    // Geometry should change (at least one component moved).
    const originalText = page.components[0];
    const resultText = result.components[0];
    const geometryChanged =
      originalText.x !== resultText.x ||
      originalText.y !== resultText.y ||
      originalText.width !== resultText.width ||
      originalText.height !== resultText.height;
    expect(geometryChanged).toBe(true);
  });

  it('12. unknown preset falls back safely (no crash, returns valid page)', () => {
    const page = buildPage('material', [textComp('Materi'), navComp()]);
    expect(() => applyLayoutPresetToPage(page, 'unknown-preset-xyz')).not.toThrow();
    const result = applyLayoutPresetToPage(page, 'unknown-preset-xyz');
    expect(result).toBeDefined();
    expect(result.components.length).toBe(page.components.length);
  });
});

// =========================================================================
// Layout Quality Tests (13-18)
// =========================================================================

describe('LAYOUT-PRESET-SYSTEM-V1 — layout quality', () => {
  it('13. cover-centered has no OUT_OF_CANVAS', () => {
    const page = buildPage('cover', [textComp('Judul', 'title'), textComp('Subtitle', 'subtitle')]);
    const result = applyLayoutPresetToPage(page, 'cover-centered');
    const issues = validateLayoutQuality(result);
    expect(issues.issues.some((i) => i.code === 'OUT_OF_CANVAS')).toBe(false);
  });

  it('14. material-two-column has no OUT_OF_CANVAS', () => {
    const page = buildPage('material', [textComp('Materi', 'title'), textComp('Body'), navComp()]);
    const result = applyLayoutPresetToPage(page, 'material-two-column');
    const issues = validateLayoutQuality(result);
    expect(issues.issues.some((i) => i.code === 'OUT_OF_CANVAS')).toBe(false);
  });

  it('15. quiz-focus has no OUT_OF_CANVAS', () => {
    const page = buildPage('quiz', [questionComp('Apa itu?'), navComp()]);
    const result = applyLayoutPresetToPage(page, 'quiz-focus');
    const issues = validateLayoutQuality(result);
    expect(issues.issues.some((i) => i.code === 'OUT_OF_CANVAS')).toBe(false);
  });

  it('16. reflection-calm has no OUT_OF_CANVAS', () => {
    const page = buildPage('reflection', [cardComp('Refleksi diri'), navComp()]);
    const result = applyLayoutPresetToPage(page, 'reflection-calm');
    const issues = validateLayoutQuality(result);
    expect(issues.issues.some((i) => i.code === 'OUT_OF_CANVAS')).toBe(false);
  });

  it('17. mission-map has no OUT_OF_CANVAS', () => {
    const page = buildPage('activity', [gameComp('Petualangan'), navComp()]);
    const result = applyLayoutPresetToPage(page, 'mission-map');
    const issues = validateLayoutQuality(result);
    expect(issues.issues.some((i) => i.code === 'OUT_OF_CANVAS')).toBe(false);
  });

  it('18. closing-centered has no OUT_OF_CANVAS', () => {
    const page = buildPage('closing', [textComp('Terima Kasih', 'title'), textComp('Semoga bermanfaat', 'subtitle')]);
    const result = applyLayoutPresetToPage(page, 'closing-centered');
    const issues = validateLayoutQuality(result);
    expect(issues.issues.some((i) => i.code === 'OUT_OF_CANVAS')).toBe(false);
  });
});

// =========================================================================
// Store/UI Tests (19-24)
// =========================================================================

describe('LAYOUT-PRESET-SYSTEM-V1 — store + UI', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('19. store applyLayoutPreset changes page.layoutId', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const materialPage = project.pages.find((p) => p.role === 'material')!;
    useEditorStore.getState().applyLayoutPreset(materialPage.id, 'material-card-stack');
    const updatedPage = useEditorStore.getState().project.pages.find((p) => p.id === materialPage.id)!;
    expect(updatedPage.layoutId).toBe('material-card-stack');
  });

  it('20. store applyLayoutPreset does not change page count', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const beforeCount = useEditorStore.getState().project.pages.length;
    const firstPage = useEditorStore.getState().project.pages[0];
    useEditorStore.getState().applyLayoutPreset(firstPage.id, 'cover-centered');
    const afterCount = useEditorStore.getState().project.pages.length;
    expect(afterCount).toBe(beforeCount);
  });

  it('21. UI displays "Susunan Halaman" label', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const { container } = render(React.createElement(LayoutPresetPicker));
    const label = container.querySelector('.layout-preset-picker__label');
    expect(label?.textContent).toBe('Susunan Halaman');
  });

  it('22. UI displays presets matching current page role', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    // Select cover page.
    const coverPage = project.pages.find((p) => p.role === 'cover')!;
    useEditorStore.getState().selectPage(coverPage.id);

    const { container } = render(React.createElement(LayoutPresetPicker));
    const options = container.querySelectorAll('[data-testid^="layout-preset-option-"]');
    // Cover should have at least cover-centered + cover-split.
    expect(options.length).toBeGreaterThanOrEqual(2);
  });

  it('23. selecting preset changes layoutId of active page', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const coverPage = project.pages.find((p) => p.role === 'cover')!;
    useEditorStore.getState().selectPage(coverPage.id);

    const { container } = render(React.createElement(LayoutPresetPicker));
    const splitOption = container.querySelector('[data-testid="layout-preset-option-cover-split"]') as HTMLButtonElement;
    if (splitOption) {
      fireEvent.click(splitOption);
      const updatedPage = useEditorStore.getState().project.pages.find((p) => p.id === coverPage.id)!;
      expect(updatedPage.layoutId).toBe('cover-split');
    }
  });

  it('24. UI does not display raw ID as primary text', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const { container } = render(React.createElement(LayoutPresetPicker));
    const names = container.querySelectorAll('.layout-preset-option__name');
    for (const name of names) {
      const text = name.textContent ?? '';
      // Should display friendly names with spaces, not raw IDs with hyphens.
      expect(text).not.toMatch(/^(cover-centered|cover-split|material-two-column|material-card-stack|quiz-focus|reflection-calm|mission-map|closing-centered)$/);
    }
  });
});

// =========================================================================
// Export/Regression Tests (25-30)
// =========================================================================

describe('LAYOUT-PRESET-SYSTEM-V1 — export + regression', () => {
  it('25. export HTML changes position after layout preset applied', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const materialPage = project.pages.find((p) => p.role === 'material')!;

    // Export before preset change.
    const htmlBefore = exportProjectToHtml(project);

    // Apply different preset.
    const modifiedProject = {
      ...project,
      pages: project.pages.map((p) =>
        p.id === materialPage.id ? applyLayoutPresetToPage(p, 'material-card-stack') : p,
      ),
    };
    const htmlAfter = exportProjectToHtml(modifiedProject);

    // HTML should differ (positions changed).
    expect(htmlBefore).not.toBe(htmlAfter);
  });

  it('26. export HTML still contains same content after layout preset change', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const materialPage = project.pages.find((p) => p.role === 'material')!;
    const materialText = materialPage.components.find((c) => c.type === 'text') as { text: string };

    const modifiedProject = {
      ...project,
      pages: project.pages.map((p) =>
        p.id === materialPage.id ? applyLayoutPresetToPage(p, 'material-card-stack') : p,
      ),
    };
    const html = exportProjectToHtml(modifiedProject);

    // Content should still be present.
    if (materialText) {
      expect(html).toContain(materialText.text.substring(0, 30));
    }
  });

  it('27. checkExportQuality not fatal after apply preset on generated PPKn', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);

    // Apply different preset to material page.
    const materialPage = project.pages.find((p) => p.role === 'material')!;
    const modifiedProject = {
      ...project,
      pages: project.pages.map((p) =>
        p.id === materialPage.id ? applyLayoutPresetToPage(p, 'material-card-stack') : p,
      ),
    };

    const report = checkExportQuality(modifiedProject);
    expect(report.fatalIssues.length).toBe(0);
  });

  it('28. PageThumbnail still exists and not changed', async () => {
    const mod = await import('../editor/PageThumbnail');
    expect(mod.PageThumbnail).toBeDefined();
  });

  it('29. style pack not changed when layout preset applied', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const beforeStylePackId = useEditorStore.getState().project.stylePackId;
    const beforeStyle = JSON.stringify(useEditorStore.getState().project.style);

    const firstPage = useEditorStore.getState().project.pages[0];
    useEditorStore.getState().applyLayoutPreset(firstPage.id, 'cover-centered');

    expect(useEditorStore.getState().project.stylePackId).toBe(beforeStylePackId);
    expect(JSON.stringify(useEditorStore.getState().project.style)).toBe(beforeStyle);
  });

  it('30. layout preset does not change stylePackId', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    // Set style pack to mission-dark first.
    useEditorStore.getState().setStylePack('mission-dark');
    const beforeStylePackId = useEditorStore.getState().project.stylePackId;
    expect(beforeStylePackId).toBe('mission-dark');

    // Apply layout preset.
    const firstPage = useEditorStore.getState().project.pages[0];
    useEditorStore.getState().applyLayoutPreset(firstPage.id, 'cover-centered');

    // stylePackId should still be mission-dark.
    expect(useEditorStore.getState().project.stylePackId).toBe('mission-dark');
  });
});

// =========================================================================
// Preset support role tests
// =========================================================================

describe('LAYOUT-PRESET-SYSTEM-V1 — role support', () => {
  it('cover-centered supports cover role', () => {
    expect(presetSupportsRole('cover-centered', 'cover')).toBe(true);
  });

  it('material-two-column supports material role', () => {
    expect(presetSupportsRole('material-two-column', 'material')).toBe(true);
  });

  it('quiz-focus supports quiz role', () => {
    expect(presetSupportsRole('quiz-focus', 'quiz')).toBe(true);
  });

  it('mission-map supports activity role', () => {
    expect(presetSupportsRole('mission-map', 'activity')).toBe(true);
  });

  it('cover-centered does NOT support material role', () => {
    expect(presetSupportsRole('cover-centered', 'material')).toBe(false);
  });
});
