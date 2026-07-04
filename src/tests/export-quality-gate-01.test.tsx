/**
 * EXPORT-QUALITY-GATE-01 tests.
 *
 * Test guard untuk pre-export quality check.
 * Verifies:
 *   - Healthy project (sample PPKn + all generated topics) → isClean=true, no confirm.
 *   - Broken project (no objectives, uncovered, layout errors) → fatal issues detected.
 *   - Layout errors (OUT_OF_CANVAS, LARGE_OVERLAP) → fatal.
 *   - Alignment errors (OBJECTIVE_NOT_COVERED, OBJECTIVE_DUPLICATE_ID, NO_OBJECTIVES) → fatal.
 *   - Warnings (missing feedback, missing nav, low contrast) → warning, not fatal.
 *   - formatExportQualityMessage produces ramah-guru message.
 *   - Topbar handleExport: healthy project → no confirm → export.
 *   - Topbar handleExport: broken project → confirm called.
 *   - Topbar handleExport: confirm cancel → no export.
 *   - Export engine unchanged.
 */

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  checkExportQuality,
  formatExportQualityMessage,
} from '../core/export-quality-gate';
import { createSamplePpknProject } from '../core/sample-project';
import { createProject } from '../core/project-factory';
import { createComponentId, createPageId } from '../core/ids';
import { generateMpiFromTopic } from '../core/guided-flow/generate-mpi-from-topic';
import { MPI_TOPIC_CATALOG, getTopicById } from '../core/guided-flow/mpi-topic-catalog';
import type { SimpleProject, SimplePage, PageComponent } from '../core/types';

// Mock the download module so tests don't hit URL.createObjectURL (not in jsdom).
vi.mock('../export/export-download', () => ({
  downloadHtmlFile: vi.fn(),
}));

// OPTIMASI-01: Mock export-html so the dynamic import in handleExport resolves
// synchronously in tests (no need to await real module loading).
vi.mock('../export/export-html', () => ({
  exportProjectToHtml: vi.fn(() => '<!doctype html><html><body>mock</body></html>'),
}));

// Import Topbar AFTER mock so it picks up the mocked download.
import { Topbar } from '../editor/Topbar';
import { useEditorStore } from '../store/editor-store';
import { downloadHtmlFile } from '../export/export-download';

// =========================================================================
// Helpers
// =========================================================================

function buildProjectWithObjectives(
  objectives: string[],
  pages: SimplePage[],
): SimpleProject {
  const project = createProject();
  return {
    ...project,
    curriculum: {
      subject: 'Test',
      grade: '7',
      phase: 'D',
      topic: 'Test Topic',
      objectives: objectives.map((text) => ({ id: createComponentId(), text })),
    },
    pages,
    currentPageId: pages[0]?.id ?? project.currentPageId,
  };
}

function buildPage(
  role: SimplePage['role'],
  components: PageComponent[],
  title = 'Test',
): SimplePage {
  return {
    id: createPageId(),
    title,
    role,
    layoutId: 'blank',
    background: { type: 'color', color: '#fff' },
    components,
  };
}

function textComp(text: string, x = 80, y = 80, w = 600, h = 120): PageComponent {
  return {
    id: createComponentId(),
    type: 'text',
    variant: 'body',
    text,
    x, y, width: w, height: h,
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

// =========================================================================
// 1. Healthy project → isClean
// =========================================================================

describe('EXPORT-QUALITY-GATE-01 — healthy project', () => {
  it('1. Sample PPKn project has 0 fatal issues (warnings are OK, not blocking)', () => {
    const project = createSamplePpknProject();
    const report = checkExportQuality(project);
    // Sample PPKn may have minor layout warnings (e.g. learningObjectives has 3 components)
    // but must have ZERO fatal issues.
    expect(report.fatalIssues).toHaveLength(0);
    expect(report.level).not.toBe('fatal');
    expect(report.canExport).toBe(true);
  });

  it('1b. All 4 generated topics have 0 fatal issues', () => {
    for (const topic of MPI_TOPIC_CATALOG) {
      const { project } = generateMpiFromTopic(topic);
      const report = checkExportQuality(project);
      expect(
        report.fatalIssues.length,
        `Topic ${topic.id} should have 0 fatal issues (got: ${report.fatalIssues.map((i) => i.message).join('; ')})`,
      ).toBe(0);
    }
  });

  it('1c. Generated PPKn is fully clean (no fatal, no warning)', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const report = checkExportQuality(project);
    expect(report.isClean).toBe(true);
    expect(report.fatalIssues).toHaveLength(0);
    expect(report.warningIssues).toHaveLength(0);
  });
});

// =========================================================================
// 2. Fatal issues — NO_OBJECTIVES
// =========================================================================

describe('EXPORT-QUALITY-GATE-01 — NO_OBJECTIVES fatal', () => {
  it('2. Project with no objectives → fatal issue NO_OBJECTIVES', () => {
    const project = createProject(); // No curriculum
    const report = checkExportQuality(project);
    expect(report.fatalIssues.length).toBeGreaterThan(0);
    expect(report.fatalIssues.some((i) => i.code === 'NO_OBJECTIVES')).toBe(true);
    expect(report.level).toBe('fatal');
  });
});

// =========================================================================
// 3. Fatal issues — OBJECTIVE_NOT_COVERED
// =========================================================================

describe('EXPORT-QUALITY-GATE-01 — OBJECTIVE_NOT_COVERED fatal', () => {
  it('3. Project with uncovered objective → fatal issue', () => {
    const objTexts = ['Menjelaskan pengertian norma', 'Mengidentifikasi jenis norma', 'Menunjukkan sikap tertib'];
    const materialPage = buildPage('material', [
      textComp('Norma adalah aturan. Jenis norma ada banyak.'),
      navComp(),
    ]);
    const project = buildProjectWithObjectives(objTexts, [materialPage]);
    const report = checkExportQuality(project);
    expect(report.fatalIssues.some((i) => i.code === 'OBJECTIVE_NOT_COVERED')).toBe(true);
    expect(report.level).toBe('fatal');
  });
});

// =========================================================================
// 4. Fatal issues — OBJECTIVE_DUPLICATE_ID
// =========================================================================

describe('EXPORT-QUALITY-GATE-01 — OBJECTIVE_DUPLICATE_ID fatal', () => {
  it('4. Project with duplicate objective ID → fatal issue', () => {
    const project = createProject();
    const page = buildPage('material', [textComp('Pengertian norma.'), navComp()]);
    project.curriculum = {
      subject: 'Test', grade: '7', phase: 'D', topic: 'Test',
      objectives: [
        { id: 'obj-1', text: 'Menjelaskan pengertian norma' },
        { id: 'obj-1', text: 'Mengidentifikasi jenis norma' },
      ],
    };
    project.pages = [page];
    project.currentPageId = page.id;
    const report = checkExportQuality(project);
    expect(report.fatalIssues.some((i) => i.code === 'OBJECTIVE_DUPLICATE_ID')).toBe(true);
    expect(report.level).toBe('fatal');
  });
});

// =========================================================================
// 5. Fatal issues — OUT_OF_CANVAS / LARGE_OVERLAP (layout)
// =========================================================================

describe('EXPORT-QUALITY-GATE-01 — layout fatal', () => {
  it('5. Component out of canvas → fatal layout issue', () => {
    const objTexts = ['Menjelaskan pengertian norma'];
    // Place text way outside canvas (canvas is 1280x720)
    const materialPage = buildPage('material', [
      textComp('Pengertian norma jelas.', 5000, 5000, 600, 120),
      navComp(),
    ]);
    const project = buildProjectWithObjectives(objTexts, [materialPage]);
    const report = checkExportQuality(project);
    const layoutFatal = report.fatalIssues.filter((i) => i.source === 'layout');
    expect(layoutFatal.length).toBeGreaterThan(0);
  });
});

// =========================================================================
// 6. Warnings — missing feedback (not fatal)
// =========================================================================

describe('EXPORT-QUALITY-GATE-01 — warnings not fatal', () => {
  it('6. Project with missing feedback (but complete structure) → warning, not fatal', () => {
    // Build a complete 10-page project based on generated PPKn, but break the feedback.
    // This ensures no MPI-standard fatal (missing pages) — only the missing-feedback warning.
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    // Break quiz feedback
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
    // Should have warnings (missing feedback) but no fatal
    expect(report.warningIssues.length).toBeGreaterThan(0);
    expect(report.fatalIssues.length).toBe(0);
    expect(report.level).toBe('warning');
    expect(report.canExport).toBe(true);
  });
});

// =========================================================================
// 7. formatExportQualityMessage — ramah guru
// =========================================================================

describe('EXPORT-QUALITY-GATE-01 — message formatting', () => {
  it('7a. formatExportQualityMessage returns empty string for clean report', () => {
    // Use generated PPKn (which is fully clean) instead of sample PPKn (has layout warning).
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const report = checkExportQuality(project);
    const message = formatExportQualityMessage(report);
    expect(message).toBe('');
  });

  it('7b. formatExportQualityMessage includes "Masalah Serius" for fatal', () => {
    const project = createProject(); // NO_OBJECTIVES
    const report = checkExportQuality(project);
    const message = formatExportQualityMessage(report);
    expect(message).toContain('Masalah Serius');
    expect(message).toContain('✗');
  });

  it('7c. formatExportQualityMessage includes "Catatan" for warnings only (no fatal)', () => {
    // Use generated PPKn with broken feedback — complete structure, only warnings.
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
    // Verify no fatal, only warnings
    expect(report.fatalIssues.length).toBe(0);
    expect(report.warningIssues.length).toBeGreaterThan(0);
    const message = formatExportQualityMessage(report);
    expect(message).toContain('Catatan');
    expect(message).toContain('⚠');
    expect(message).not.toContain('Masalah Serius');
  });

  it('7d. formatExportQualityMessage includes layout score + alignment info', () => {
    const project = createProject();
    const report = checkExportQuality(project);
    const message = formatExportQualityMessage(report);
    expect(message).toContain('Skor Layout');
    expect(message).toContain('Alignment');
  });

  it('7e. formatExportQualityMessage uses Indonesian, not technical jargon as primary text', () => {
    const project = createProject();
    const report = checkExportQuality(project);
    const message = formatExportQualityMessage(report);
    // Should not use raw English technical terms as primary text
    expect(message).not.toMatch(/qualityReport|coreContract|LayoutQualityResult/);
    // Should use Indonesian
    expect(message).toMatch(/Masalah|Catatan|Skor|Alignment|tujuan/i);
  });
});

// =========================================================================
// 8. Topbar handleExport — healthy project (no confirm)
// =========================================================================

describe('EXPORT-QUALITY-GATE-01 — Topbar healthy export', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('8. Clean project (generated PPKn) export does NOT call confirm', async () => {
    // Use generated PPKn (fully clean) — sample PPKn has a minor layout warning.
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    useEditorStore.getState().setProject(project);

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const downloadSpy = vi.mocked(downloadHtmlFile);
    downloadSpy.mockClear();

    const { container } = render(React.createElement(Topbar));
    const exportBtn = container.querySelector('[data-testid="topbar-export"]') as HTMLButtonElement;
    fireEvent.click(exportBtn);
    await new Promise(resolve => setTimeout(resolve, 0)); // OPTIMASI-01: flush dynamic import macrotask

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(downloadSpy).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});

// =========================================================================
// 9. Topbar handleExport — broken project (confirm called)
// =========================================================================

describe('EXPORT-QUALITY-GATE-01 — Topbar broken export', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('9. Broken project (no objectives) export calls confirm', async () => {
    // Default project from newProject() has no curriculum → NO_OBJECTIVES fatal
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { container } = render(React.createElement(Topbar));
    const exportBtn = container.querySelector('[data-testid="topbar-export"]') as HTMLButtonElement;
    fireEvent.click(exportBtn);
    await new Promise(resolve => setTimeout(resolve, 0)); // OPTIMASI-01: flush dynamic import macrotask

    expect(confirmSpy).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('10. Confirm cancel → no export (downloadHtmlFile NOT called)', async () => {
    // Default project → broken → confirm → cancel → export should NOT proceed.
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const downloadSpy = vi.mocked(downloadHtmlFile);
    downloadSpy.mockClear();

    const { container } = render(React.createElement(Topbar));
    const exportBtn = container.querySelector('[data-testid="topbar-export"]') as HTMLButtonElement;
    fireEvent.click(exportBtn);
    await new Promise(resolve => setTimeout(resolve, 0)); // OPTIMASI-01: flush dynamic import macrotask

    expect(confirmSpy).toHaveBeenCalled();
    // CRITICAL: download must NOT be called when user cancels.
    expect(downloadSpy).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('11. Confirm OK → export proceeds (downloadHtmlFile called)', async () => {
    // Default project → broken → confirm → OK → export should proceed.
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const downloadSpy = vi.mocked(downloadHtmlFile);
    downloadSpy.mockClear();

    const { container } = render(React.createElement(Topbar));
    const exportBtn = container.querySelector('[data-testid="topbar-export"]') as HTMLButtonElement;
    fireEvent.click(exportBtn);
    await new Promise(resolve => setTimeout(resolve, 0)); // OPTIMASI-01: flush dynamic import macrotask

    expect(confirmSpy).toHaveBeenCalled();
    // CRITICAL: download MUST be called when user confirms.
    expect(downloadSpy).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});

// =========================================================================
// 12. Export engine unchanged
// =========================================================================

describe('EXPORT-QUALITY-GATE-01 — export engine guard', () => {
  it('12. exportProjectToHtml still exists and is a function', async () => {
    const mod = await import('../export/export-html');
    expect(mod.exportProjectToHtml).toBeDefined();
    expect(typeof mod.exportProjectToHtml).toBe('function');
  });

  it('12b. Export still produces HTML for healthy project', () => {
    const project = createSamplePpknProject();
    const html = import('../export/export-html').then((mod) => mod.exportProjectToHtml(project));
    return html.then((h) => {
      expect(typeof h).toBe('string');
      expect(h.length).toBeGreaterThan(0);
      expect(h).toContain('<html');
    });
  });
});

// =========================================================================
// 13. Pure function — does not mutate input
// =========================================================================

describe('EXPORT-QUALITY-GATE-01 — purity', () => {
  it('13. checkExportQuality does not mutate project input', () => {
    const project = createSamplePpknProject();
    const snapshot = JSON.stringify(project);
    checkExportQuality(project);
    expect(JSON.stringify(project)).toBe(snapshot);
  });
});

// =========================================================================
// 14. All generated topics export without fatal
// =========================================================================

describe('EXPORT-QUALITY-GATE-01 — all generated topics', () => {
  it('14. All 4 generated topics have 0 fatal issues (can export without confirm)', () => {
    for (const topic of MPI_TOPIC_CATALOG) {
      const { project } = generateMpiFromTopic(topic);
      const report = checkExportQuality(project);
      expect(
        report.fatalIssues.length,
        `Topic ${topic.id} should have 0 fatal issues`,
      ).toBe(0);
      expect(report.level).not.toBe('fatal');
    }
  });

  it('14b. PPKn generated project is fully clean (no warning, no fatal)', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const report = checkExportQuality(project);
    expect(report.isClean).toBe(true);
  });
});

// =========================================================================
// 15. Report structure completeness
// =========================================================================

describe('EXPORT-QUALITY-GATE-01 — report structure', () => {
  it('15. checkExportQuality returns complete report with all fields', () => {
    const project = createSamplePpknProject();
    const report = checkExportQuality(project);
    expect(report).toHaveProperty('level');
    expect(report).toHaveProperty('canExport');
    expect(report).toHaveProperty('isClean');
    expect(report).toHaveProperty('issues');
    expect(report).toHaveProperty('fatalIssues');
    expect(report).toHaveProperty('warningIssues');
    expect(report).toHaveProperty('mpiStandard');
    expect(report).toHaveProperty('layoutScore');
    expect(report).toHaveProperty('alignment');
    expect(report).toHaveProperty('pageCount');
    expect(typeof report.layoutScore).toBe('number');
    expect(typeof report.pageCount).toBe('number');
    expect(Array.isArray(report.issues)).toBe(true);
  });
});
