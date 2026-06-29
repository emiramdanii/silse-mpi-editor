/**
 * STYLE-LAYOUT-UX-UNIFICATION-01 tests.
 *
 * 14 mandatory tests per senior reviewer spec.
 * Verifies section grouping, copy, safety hints, and regression:
 * style doesn't change layout, layout doesn't change style, content unchanged.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { VisualSection } from '../editor/VisualSection';
import { useEditorStore } from '../store/editor-store';
import { createSamplePpknProject } from '../core/sample-project';
import { generateMpiFromTopic } from '../core/guided-flow/generate-mpi-from-topic';
import { getTopicById } from '../core/guided-flow/mpi-topic-catalog';
import { exportProjectToHtml } from '../export/export-html';
import { checkExportQuality } from '../core/export-quality-gate';

// =========================================================================
// UI Tests (1-6, 11)
// =========================================================================

describe('STYLE-LAYOUT-UX-UNIFICATION-01 — UI section', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('1. Inspector empty state displays "Atur Tampilan Media" section', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const { container } = render(React.createElement(VisualSection));
    const section = container.querySelector('[data-testid="visual-section"]');
    expect(section).not.toBeNull();
    const title = container.querySelector('.inspector-visual-section__title');
    expect(title?.textContent).toBe('Atur Tampilan Media');
  });

  it('2. Section displays hint about "tanpa mengubah isi materi"', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const { container } = render(React.createElement(VisualSection));
    const hint = container.querySelector('.inspector-visual-section__hint');
    expect(hint?.textContent).toContain('tanpa mengubah isi materi');
  });

  it('3. Section contains StylePackPicker', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const { container } = render(React.createElement(VisualSection));
    const stylePicker = container.querySelector('[data-testid="style-pack-picker"]');
    expect(stylePicker).not.toBeNull();
  });

  it('4. Section contains LayoutPresetPicker', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const { container } = render(React.createElement(VisualSection));
    const layoutPicker = container.querySelector('[data-testid="layout-preset-picker"]');
    expect(layoutPicker).not.toBeNull();
  });

  it('5. StylePackPicker group displays hint about warna/nuansa', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const { container } = render(React.createElement(VisualSection));
    const hints = container.querySelectorAll('.inspector-visual-section__picker-hint');
    // First hint is for style pack.
    expect(hints[0]?.textContent).toContain('warna');
    expect(hints[0]?.textContent).toContain('nuansa');
  });

  it('6. LayoutPresetPicker group displays hint about susunan elemen', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const { container } = render(React.createElement(VisualSection));
    const hints = container.querySelectorAll('.inspector-visual-section__picker-hint');
    // Second hint is for layout preset.
    expect(hints[1]?.textContent).toContain('susunan');
    expect(hints[1]?.textContent).toContain('elemen');
  });

  it('11. UI does not display raw ID as primary text', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const { container } = render(React.createElement(VisualSection));
    const allText = container.textContent ?? '';
    // Should not contain raw IDs as primary text.
    expect(allText).not.toMatch(/\bmodern-clean\b/);
    expect(allText).not.toMatch(/\bsoft-classroom\b/);
    expect(allText).not.toMatch(/\bmission-dark\b/);
    expect(allText).not.toMatch(/\bmaterial-two-column\b/);
    // Should contain friendly names.
    expect(allText).toMatch(/Modern Clean|Soft Classroom|Mission Dark/);
  });

  it('11b. Section displays safety hint about isi materi/kuis/tujuan tidak berubah', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const { container } = render(React.createElement(VisualSection));
    const safety = container.querySelector('[data-testid="visual-section-safety"]');
    expect(safety).not.toBeNull();
    expect(safety?.textContent).toContain('Aman dicoba');
    expect(safety?.textContent).toContain('tidak berubah');
  });
});

// =========================================================================
// Safety Tests (7-10): style vs layout isolation
// =========================================================================

describe('STYLE-LAYOUT-UX-UNIFICATION-01 — safety isolation', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('7. Selecting style pack does not change layoutId', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const firstPage = useEditorStore.getState().project.pages[0];
    const beforeLayoutId = firstPage.layoutId;

    // Change style pack.
    useEditorStore.getState().setStylePack('mission-dark');

    const afterPage = useEditorStore.getState().project.pages[0];
    expect(afterPage.layoutId).toBe(beforeLayoutId);
  });

  it('8. Selecting layout preset does not change stylePackId', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const beforeStylePackId = useEditorStore.getState().project.stylePackId;

    // Apply layout preset.
    const firstPage = useEditorStore.getState().project.pages[0];
    useEditorStore.getState().applyLayoutPreset(firstPage.id, 'cover-centered');

    const afterStylePackId = useEditorStore.getState().project.stylePackId;
    expect(afterStylePackId).toBe(beforeStylePackId);
  });

  it('9. Selecting style pack does not change text content', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const beforeTexts = useEditorStore.getState().project.pages
      .flatMap((p) => p.components)
      .filter((c) => c.type === 'text')
      .map((c) => (c as { text: string }).text);

    useEditorStore.getState().setStylePack('soft-classroom');

    const afterTexts = useEditorStore.getState().project.pages
      .flatMap((p) => p.components)
      .filter((c) => c.type === 'text')
      .map((c) => (c as { text: string }).text);

    expect(afterTexts).toEqual(beforeTexts);
  });

  it('10. Selecting layout preset does not change text content', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const beforeTexts = useEditorStore.getState().project.pages
      .flatMap((p) => p.components)
      .filter((c) => c.type === 'text')
      .map((c) => (c as { text: string }).text);

    const firstPage = useEditorStore.getState().project.pages[0];
    useEditorStore.getState().applyLayoutPreset(firstPage.id, 'cover-centered');

    const afterTexts = useEditorStore.getState().project.pages
      .flatMap((p) => p.components)
      .filter((c) => c.type === 'text')
      .map((c) => (c as { text: string }).text);

    expect(afterTexts).toEqual(beforeTexts);
  });
});

// =========================================================================
// Export/Regression Tests (12-14)
// =========================================================================

describe('STYLE-LAYOUT-UX-UNIFICATION-01 — export + regression', () => {
  it('12. Export still works after style + layout changed', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    useEditorStore.getState().setProject(project);

    // Change style + layout.
    useEditorStore.getState().setStylePack('mission-dark');
    const materialPage = useEditorStore.getState().project.pages.find((p) => p.role === 'material')!;
    useEditorStore.getState().applyLayoutPreset(materialPage.id, 'material-card-stack');

    const currentProject = useEditorStore.getState().project;
    expect(() => exportProjectToHtml(currentProject)).not.toThrow();
    const html = exportProjectToHtml(currentProject);
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);
  });

  it('13. checkExportQuality not fatal after style + layout changed on generated PPKn', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    useEditorStore.getState().setProject(project);

    // Change style + layout.
    useEditorStore.getState().setStylePack('mission-dark');
    const materialPage = useEditorStore.getState().project.pages.find((p) => p.role === 'material')!;
    useEditorStore.getState().applyLayoutPreset(materialPage.id, 'material-card-stack');

    const currentProject = useEditorStore.getState().project;
    const report = checkExportQuality(currentProject);
    expect(report.fatalIssues.length).toBe(0);
  });

  it('14. PageThumbnail still exists (not changed)', async () => {
    const mod = await import('../editor/PageThumbnail');
    expect(mod.PageThumbnail).toBeDefined();
  });
});
