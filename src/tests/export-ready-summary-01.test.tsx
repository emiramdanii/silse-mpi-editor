/**
 * EXPORT-READY-SUMMARY-01 tests.
 *
 * 24 mandatory tests per senior reviewer spec.
 * Verifies helper produces correct summary, UI chip renders correctly,
 * and regression: export behavior unchanged.
 */

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  buildExportReadySummary,
  formatExportReadySummaryText,
  getExportReadyChipLabel,
  type ExportReadySummary,
} from '../core/export-ready-summary';
import { checkExportQuality } from '../core/export-quality-gate';
import { createProject } from '../core/project-factory';
import { createComponentId } from '../core/ids';
import { generateMpiFromTopic } from '../core/guided-flow/generate-mpi-from-topic';
import { getTopicById } from '../core/guided-flow/mpi-topic-catalog';
import { Topbar } from '../editor/Topbar';
import { useEditorStore } from '../store/editor-store';
import { downloadHtmlFile } from '../export/export-download';
import type { SimpleProject } from '../core/types';

vi.mock('../export/export-download', () => ({
  downloadHtmlFile: vi.fn(),
}));

// =========================================================================
// Helper Tests (1-16)
// =========================================================================

describe('EXPORT-READY-SUMMARY-01 — helper', () => {
  it('1. Clean generated PPKn → status ready', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const report = checkExportQuality(project);
    const summary = buildExportReadySummary(report);
    expect(summary.status).toBe('ready');
    expect(summary.fatalCount).toBe(0);
    expect(summary.warningCount).toBe(0);
    expect(summary.totalIssues).toBe(0);
  });

  it('2. Warning-only project → status needs-review', () => {
    // Build project with warning (missing feedback) but no fatal.
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const brokenProject: SimpleProject = {
      ...project,
      pages: project.pages.map((p) => ({
        ...p,
        components: p.components.map((c) => {
          if (c.type === 'question') {
            return { ...c, feedbackCorrect: '', feedbackWrong: '' } as typeof c;
          }
          return c;
        }) as typeof p.components,
      })),
    };
    const report = checkExportQuality(brokenProject);
    const summary = buildExportReadySummary(report);
    expect(summary.status).toBe('needs-review');
    expect(summary.fatalCount).toBe(0);
    expect(summary.warningCount).toBeGreaterThan(0);
  });

  it('3. Fatal project → status serious', () => {
    const project = createProject(); // NO_OBJECTIVES → fatal
    const report = checkExportQuality(project);
    const summary = buildExportReadySummary(report);
    expect(summary.status).toBe('serious');
    expect(summary.fatalCount).toBeGreaterThan(0);
  });

  it('4. ready title = "Media siap export"', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const report = checkExportQuality(project);
    const summary = buildExportReadySummary(report);
    expect(summary.title).toBe('Media siap export');
  });

  it('5. needs-review title = "Media bisa export, tetapi ada catatan"', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const brokenProject: SimpleProject = {
      ...project,
      pages: project.pages.map((p) => ({
        ...p,
        components: p.components.map((c) => {
          if (c.type === 'question') {
            return { ...c, feedbackCorrect: '', feedbackWrong: '' } as typeof c;
          }
          return c;
        }) as typeof p.components,
      })),
    };
    const report = checkExportQuality(brokenProject);
    const summary = buildExportReadySummary(report);
    expect(summary.title).toBe('Media bisa export, tetapi ada catatan');
  });

  it('6. serious title = "Media perlu dicek sebelum export"', () => {
    const project = createProject();
    const report = checkExportQuality(project);
    const summary = buildExportReadySummary(report);
    expect(summary.title).toBe('Media perlu dicek sebelum export');
  });

  it('7. Categories always contain 5 categories', () => {
    const project = createProject();
    const report = checkExportQuality(project);
    const summary = buildExportReadySummary(report);
    expect(summary.categories).toHaveLength(5);
    const keys = summary.categories.map((c) => c.key);
    expect(keys).toContain('structure');
    expect(keys).toContain('objectives');
    expect(keys).toContain('layout');
    expect(keys).toContain('readability');
    expect(keys).toContain('interaction');
  });

  it('8. Objectives category serious if OBJECTIVE_NOT_COVERED', () => {
    // Build project with uncovered objective.
    const project = createProject();
    project.curriculum = {
      subject: 'Test', grade: '7', phase: 'D', topic: 'Test',
      objectives: [
        { id: createComponentId(), text: 'Menjelaskan pengertian norma' },
        { id: createComponentId(), text: 'Mengidentifikasi jenis norma' },
        { id: createComponentId(), text: 'Menunjukkan sikap tertib' },
      ],
    };
    project.pages = [
      {
        id: 'p1', title: 'Materi', role: 'material', layoutId: 'blank',
        background: { type: 'color', color: '#fff' },
        components: [
          { id: createComponentId(), type: 'text', variant: 'body', text: 'Norma adalah aturan.', x: 80, y: 80, width: 600, height: 120 } as never,
          { id: createComponentId(), type: 'navigation', variant: 'navigation', label: 'Lanjut', action: 'next', x: 900, y: 620, width: 300, height: 60 } as never,
        ],
      },
    ];
    project.currentPageId = 'p1';

    const report = checkExportQuality(project);
    const summary = buildExportReadySummary(report);
    const objectivesCat = summary.categories.find((c) => c.key === 'objectives');
    expect(objectivesCat?.status).toBe('serious');
  });

  it('9. Layout category serious if OUT_OF_CANVAS', () => {
    // Build project with component outside canvas.
    const objTexts = ['Menjelaskan pengertian norma'];
    const project = createProject();
    project.curriculum = {
      subject: 'Test', grade: '7', phase: 'D', topic: 'Test',
      objectives: objTexts.map((text) => ({ id: createComponentId(), text })),
    };
    project.pages = [
      {
        id: 'p1', title: 'Materi', role: 'material', layoutId: 'blank',
        background: { type: 'color', color: '#fff' },
        components: [
          { id: createComponentId(), type: 'text', variant: 'body', text: 'Pengertian norma jelas.', x: 5000, y: 5000, width: 600, height: 120 } as never,
          { id: createComponentId(), type: 'navigation', variant: 'navigation', label: 'Lanjut', action: 'next', x: 900, y: 620, width: 300, height: 60 } as never,
        ],
      },
    ];
    project.currentPageId = 'p1';

    const report = checkExportQuality(project);
    const summary = buildExportReadySummary(report);
    const layoutCat = summary.categories.find((c) => c.key === 'layout');
    expect(layoutCat?.status).toBe('serious');
  });

  it('10. Readability category warning if visual issue', () => {
    // Build project with low contrast cover (dark bg + no style tokens → text falls back to black).
    const objTexts = ['Menjelaskan pengertian norma'];
    const project = createProject();
    project.curriculum = {
      subject: 'Test', grade: '7', phase: 'D', topic: 'Test',
      objectives: objTexts.map((text) => ({ id: createComponentId(), text })),
    };
    project.style = undefined; // Force resolver to return empty → text falls back to #000000
    project.pages = [
      {
        id: 'p1', title: 'Cover', role: 'cover', layoutId: 'coverCentered',
        background: { type: 'color', color: '#1e3a5f' },
        components: [
          { id: createComponentId(), type: 'text', variant: 'title', text: 'Judul', x: 140, y: 280, width: 1000, height: 120 } as never,
        ],
      },
      {
        id: 'p2', title: 'Materi', role: 'material', layoutId: 'blank',
        background: { type: 'color', color: '#fff' },
        components: [
          { id: createComponentId(), type: 'text', variant: 'body', text: 'Pengertian norma jelas.', x: 80, y: 80, width: 600, height: 120 } as never,
          { id: createComponentId(), type: 'navigation', variant: 'navigation', label: 'Lanjut', action: 'next', x: 900, y: 620, width: 300, height: 60 } as never,
        ],
      },
    ];
    project.currentPageId = 'p1';

    const report = checkExportQuality(project);
    const summary = buildExportReadySummary(report);
    const readabilityCat = summary.categories.find((c) => c.key === 'readability');
    expect(readabilityCat?.status).toBe('warning');
    expect(readabilityCat?.issueCount).toBeGreaterThan(0);
  });

  it('11. Interaction category warning if missing feedback', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const brokenProject: SimpleProject = {
      ...project,
      pages: project.pages.map((p) => ({
        ...p,
        components: p.components.map((c) => {
          if (c.type === 'question') {
            return { ...c, feedbackCorrect: '', feedbackWrong: '' } as typeof c;
          }
          return c;
        }) as typeof p.components,
      })),
    };
    const report = checkExportQuality(brokenProject);
    const summary = buildExportReadySummary(report);
    const interactionCat = summary.categories.find((c) => c.key === 'interaction');
    expect(interactionCat?.status).toBe('warning');
    expect(interactionCat?.issueCount).toBeGreaterThan(0);
  });

  it('12. topSuggestions max 3', () => {
    const project = createProject(); // Has multiple fatal issues
    const report = checkExportQuality(project);
    const summary = buildExportReadySummary(report);
    expect(summary.topSuggestions.length).toBeLessThanOrEqual(3);
  });

  it('13. topSuggestions no duplicates', () => {
    const project = createProject();
    const report = checkExportQuality(project);
    const summary = buildExportReadySummary(report);
    const unique = new Set(summary.topSuggestions);
    expect(unique.size).toBe(summary.topSuggestions.length);
  });

  it('14. Helper pure — does not mutate report', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const report = checkExportQuality(project);
    const snapshot = JSON.stringify(report);
    buildExportReadySummary(report);
    expect(JSON.stringify(report)).toBe(snapshot);
  });

  it('15. formatExportReadySummaryText does not contain undefined/null/schema', () => {
    const project = createProject();
    const report = checkExportQuality(project);
    const summary = buildExportReadySummary(report);
    const text = formatExportReadySummaryText(summary);
    expect(text).not.toMatch(/\bundefined\b/);
    expect(text).not.toMatch(/\bnull\b/);
    expect(text).not.toMatch(/\bschema\b/);
  });

  it('16. formatExportReadySummaryText contains title and category labels', () => {
    const project = createProject();
    const report = checkExportQuality(project);
    const summary = buildExportReadySummary(report);
    const text = formatExportReadySummaryText(summary);
    expect(text).toContain(summary.title);
    // Should contain at least one category label.
    expect(text).toMatch(/Struktur MPI|Tujuan Pembelajaran|Layout|Keterbacaan|Interaksi/);
  });
});

// =========================================================================
// UI Tests (17-22)
// =========================================================================

describe('EXPORT-READY-SUMMARY-01 — Topbar UI', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('17. Topbar clean project shows "Siap export"', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    useEditorStore.getState().setProject(project);

    const { container } = render(React.createElement(Topbar));
    const chip = container.querySelector('[data-testid="export-ready-summary"]');
    expect(chip).not.toBeNull();
    expect(chip?.textContent).toContain('Siap export');
    expect(chip?.getAttribute('data-status')).toBe('ready');
  });

  it('18. Topbar warning project shows "catatan"', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const brokenProject: SimpleProject = {
      ...project,
      pages: project.pages.map((p) => ({
        ...p,
        components: p.components.map((c) => {
          if (c.type === 'question') {
            return { ...c, feedbackCorrect: '', feedbackWrong: '' } as typeof c;
          }
          return c;
        }) as typeof p.components,
      })),
    };
    useEditorStore.getState().setProject(brokenProject);

    const { container } = render(React.createElement(Topbar));
    const chip = container.querySelector('[data-testid="export-ready-summary"]');
    expect(chip).not.toBeNull();
    expect(chip?.textContent).toContain('catatan');
    expect(chip?.getAttribute('data-status')).toBe('needs-review');
  });

  it('19. Topbar fatal project shows "Perlu dicek"', () => {
    // Default project (newProject) → NO_OBJECTIVES → fatal.
    const { container } = render(React.createElement(Topbar));
    const chip = container.querySelector('[data-testid="export-ready-summary"]');
    expect(chip).not.toBeNull();
    expect(chip?.textContent).toContain('Perlu dicek');
    expect(chip?.getAttribute('data-status')).toBe('serious');
  });

  it('20. Chip has data-testid="export-ready-summary"', () => {
    const { container } = render(React.createElement(Topbar));
    const chip = container.querySelector('[data-testid="export-ready-summary"]');
    expect(chip).not.toBeNull();
  });

  it('21. Chip has data-status matching summary', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    useEditorStore.getState().setProject(project);

    const { container } = render(React.createElement(Topbar));
    const chip = container.querySelector('[data-testid="export-ready-summary"]');
    expect(chip?.getAttribute('data-status')).toBe('ready');
  });

  it('22. Export button behavior unchanged: healthy no confirm, broken confirm', () => {
    // Test healthy → no confirm.
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    useEditorStore.getState().setProject(project);

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const downloadSpy = vi.mocked(downloadHtmlFile);
    downloadSpy.mockClear();

    const { container: healthyContainer } = render(React.createElement(Topbar));
    fireEvent.click(healthyContainer.querySelector('[data-testid="topbar-export"]') as HTMLButtonElement);
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(downloadSpy).toHaveBeenCalled();

    confirmSpy.mockRestore();

    // Test broken → confirm.
    useEditorStore.getState().newProject();
    const confirmSpy2 = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { container: brokenContainer } = render(React.createElement(Topbar));
    fireEvent.click(brokenContainer.querySelector('[data-testid="topbar-export"]') as HTMLButtonElement);
    expect(confirmSpy2).toHaveBeenCalled();
    confirmSpy2.mockRestore();
  });
});

// =========================================================================
// Regression Tests (23-24)
// =========================================================================

describe('EXPORT-READY-SUMMARY-01 — regression', () => {
  it('23. exportProjectToHtml not changed (still exists and is function)', async () => {
    const mod = await import('../export/export-html');
    expect(mod.exportProjectToHtml).toBeDefined();
    expect(typeof mod.exportProjectToHtml).toBe('function');
  });

  it('24. checkExportQuality level unchanged (ready/warning/fatal logic)', () => {
    // Healthy → no fatal.
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const report = checkExportQuality(project);
    expect(report.fatalIssues.length).toBe(0);

    // Broken → fatal.
    const broken = createProject();
    const brokenReport = checkExportQuality(broken);
    expect(brokenReport.fatalIssues.length).toBeGreaterThan(0);
    expect(brokenReport.level).toBe('fatal');
  });
});

// =========================================================================
// Chip label tests
// =========================================================================

describe('EXPORT-READY-SUMMARY-01 — chip label', () => {
  it('getExportReadyChipLabel returns "✅ Siap export" for ready', () => {
    const summary: ExportReadySummary = {
      status: 'ready',
      title: 'Media siap export',
      message: 'test',
      totalIssues: 0,
      fatalCount: 0,
      warningCount: 0,
      categories: [],
      topSuggestions: [],
    };
    expect(getExportReadyChipLabel(summary)).toBe('✅ Siap export');
  });

  it('getExportReadyChipLabel returns "⚠ N catatan" for needs-review', () => {
    const summary: ExportReadySummary = {
      status: 'needs-review',
      title: 'test',
      message: 'test',
      totalIssues: 3,
      fatalCount: 0,
      warningCount: 3,
      categories: [],
      topSuggestions: [],
    };
    expect(getExportReadyChipLabel(summary)).toBe('⚠ 3 catatan');
  });

  it('getExportReadyChipLabel returns "✗ Perlu dicek" for serious', () => {
    const summary: ExportReadySummary = {
      status: 'serious',
      title: 'test',
      message: 'test',
      totalIssues: 5,
      fatalCount: 2,
      warningCount: 3,
      categories: [],
      topSuggestions: [],
    };
    expect(getExportReadyChipLabel(summary)).toBe('✗ Perlu dicek');
  });
});
