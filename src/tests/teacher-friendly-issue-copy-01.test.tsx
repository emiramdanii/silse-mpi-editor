/**
 * TEACHER-FRIENDLY-ISSUE-COPY-01 tests.
 *
 * 25 mandatory tests per senior reviewer spec.
 * Verifies helper produces friendly copy, export message uses friendly copy,
 * alignment panel shows friendly copy, and regression: checker logic unchanged.
 */

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  getTeacherFriendlyIssueCopy,
  formatTeacherFriendlyIssueLine,
  formatTeacherFriendlyIssueBlock,
  type TeacherFriendlyIssueInput,
} from '../core/teacher-friendly-issue-copy';
import { checkLearningGoalAlignment } from '../core/learning-goal-alignment';
import { checkExportQuality, formatExportQualityMessage } from '../core/export-quality-gate';
import { createSamplePpknProject } from '../core/sample-project';
import { createProject } from '../core/project-factory';
import { createComponentId, createPageId } from '../core/ids';
import { generateMpiFromTopic } from '../core/guided-flow/generate-mpi-from-topic';
import { getTopicById } from '../core/guided-flow/mpi-topic-catalog';
import { AlignmentSummary } from '../editor/AlignmentPanel';
import { useEditorStore } from '../store/editor-store';
import type { SimpleProject, SimplePage } from '../core/types';

// Mock download for Topbar tests.
vi.mock('../export/export-download', () => ({
  downloadHtmlFile: vi.fn(),
}));

// =========================================================================
// Helper Tests (1-11)
// =========================================================================

describe('TEACHER-FRIENDLY-ISSUE-COPY-01 — helper', () => {
  it('1. OBJECTIVE_NOT_COVERED produces friendly title/message/suggestion', () => {
    const issue: TeacherFriendlyIssueInput = {
      source: 'alignment',
      code: 'OBJECTIVE_NOT_COVERED',
      message: 'Tujuan pembelajaran "X" tidak di-address oleh halaman manapun.',
      level: 'error',
    };
    const copy = getTeacherFriendlyIssueCopy(issue);
    expect(copy.title).toBe('Ada tujuan yang belum tercover');
    expect(copy.message).toContain('tujuan pembelajaran');
    expect(copy.message).toContain('materi');
    expect(copy.suggestion).toContain('Tambahkan');
    // Raw code should NOT be the title.
    expect(copy.title).not.toBe('OBJECTIVE_NOT_COVERED');
  });

  it('2. OBJECTIVE_DUPLICATE_ID does not produce technical message as primary', () => {
    const issue: TeacherFriendlyIssueInput = {
      source: 'alignment',
      code: 'OBJECTIVE_DUPLICATE_ID',
      message: 'Ada ID tujuan pembelajaran yang duplikat (id: "obj-1").',
      level: 'error',
    };
    const copy = getTeacherFriendlyIssueCopy(issue);
    expect(copy.title).toBe('Ada tujuan pembelajaran ganda');
    expect(copy.title).not.toMatch(/OBJECTIVE_DUPLICATE_ID|id:/);
    expect(copy.suggestion).toContain('unik');
  });

  it('3. NO_OBJECTIVES produces arahan isi tujuan pembelajaran', () => {
    const issue: TeacherFriendlyIssueInput = {
      source: 'alignment',
      code: 'NO_OBJECTIVES',
      message: 'Project tidak punya tujuan pembelajaran.',
      level: 'error',
    };
    const copy = getTeacherFriendlyIssueCopy(issue);
    expect(copy.title).toBe('Tujuan pembelajaran belum diisi');
    expect(copy.suggestion).toContain('Isi tujuan pembelajaran');
  });

  it('4. ASSESSMENT_NOT_LINKED produces arahan kuis/cek pemahaman', () => {
    const issue: TeacherFriendlyIssueInput = {
      source: 'alignment',
      code: 'ASSESSMENT_NOT_LINKED',
      message: 'Komponen question di halaman "Kuis" tidak terhubung.',
      level: 'warning',
    };
    const copy = getTeacherFriendlyIssueCopy(issue);
    expect(copy.title).toBe('Kuis belum terhubung ke tujuan');
    expect(copy.suggestion).toContain('pertanyaan');
    expect(copy.suggestion).toContain('tujuan');
  });

  it('5. MATERIAL_NOT_LINKED produces arahan materi', () => {
    const issue: TeacherFriendlyIssueInput = {
      source: 'alignment',
      code: 'MATERIAL_NOT_LINKED',
      message: 'Halaman materi tidak terhubung.',
      level: 'warning',
    };
    const copy = getTeacherFriendlyIssueCopy(issue);
    expect(copy.title).toBe('Materi belum terhubung ke tujuan');
    expect(copy.suggestion).toContain('penjelasan');
  });

  it('6. REFLECTION_NOT_LINKED produces arahan refleksi', () => {
    const issue: TeacherFriendlyIssueInput = {
      source: 'alignment',
      code: 'REFLECTION_NOT_LINKED',
      message: 'Halaman refleksi tidak merujuk.',
      level: 'warning',
    };
    const copy = getTeacherFriendlyIssueCopy(issue);
    expect(copy.title).toBe('Refleksi belum terhubung ke tujuan');
    expect(copy.suggestion).toContain('refleksi');
  });

  it('7. OUT_OF_CANVAS produces arahan geser/kecilkan elemen', () => {
    const issue: TeacherFriendlyIssueInput = {
      source: 'layout',
      code: 'OUT_OF_CANVAS',
      message: 'Komponen posisi (x:5000, y:5000) keluar kanvas.',
      level: 'fatal',
    };
    const copy = getTeacherFriendlyIssueCopy(issue);
    expect(copy.title).toBe('Ada elemen keluar layar');
    expect(copy.suggestion).toContain('Geser');
  });

  it('8. LARGE_OVERLAP produces arahan rapikan posisi', () => {
    const issue: TeacherFriendlyIssueInput = {
      source: 'layout',
      code: 'LARGE_OVERLAP',
      message: 'Komponen A dan B overlap 80%.',
      level: 'fatal',
    };
    const copy = getTeacherFriendlyIssueCopy(issue);
    expect(copy.title).toBe('Ada elemen saling menumpuk');
    expect(copy.suggestion).toContain('Rapikan');
  });

  it('9. Low contrast message produces arahan warna/overlay', () => {
    const issue: TeacherFriendlyIssueInput = {
      source: 'visual',
      message: 'Teks title di cover kontras rendah (2.1:1, minimum 4.5:1).',
      level: 'warning',
    };
    const copy = getTeacherFriendlyIssueCopy(issue);
    expect(copy.title).toBe('Teks sulit dibaca');
    expect(copy.suggestion).toContain('warna');
  });

  it('10. Unknown issue fallback is still friendly', () => {
    const issue: TeacherFriendlyIssueInput = {
      source: 'unknown',
      code: 'SOME_UNKNOWN_CODE_12345',
      message: 'Something totally unknown happened.',
      level: 'warning',
    };
    const copy = getTeacherFriendlyIssueCopy(issue);
    expect(copy.title).toBe('Ada yang perlu diperhatikan');
    expect(copy.message).toContain('periksa');
    expect(copy.suggestion).toContain('Periksa');
    // Should NOT contain the raw code as title.
    expect(copy.title).not.toBe('SOME_UNKNOWN_CODE_12345');
  });

  it('11. Helper is pure — does not mutate input', () => {
    const issue: TeacherFriendlyIssueInput = {
      source: 'alignment',
      code: 'OBJECTIVE_NOT_COVERED',
      message: 'Test message.',
      level: 'error',
    };
    const snapshot = JSON.stringify(issue);
    getTeacherFriendlyIssueCopy(issue);
    formatTeacherFriendlyIssueLine(issue);
    formatTeacherFriendlyIssueBlock(issue);
    expect(JSON.stringify(issue)).toBe(snapshot);
  });
});

// =========================================================================
// Export Message Tests (12-17)
// =========================================================================

describe('TEACHER-FRIENDLY-ISSUE-COPY-01 — export message', () => {
  it('12. formatExportQualityMessage uses friendly title, not raw code', () => {
    // Broken project with NO_OBJECTIVES.
    const project = createProject();
    const report = checkExportQuality(project);
    const message = formatExportQualityMessage(report);
    // Should NOT show raw code as primary text.
    expect(message).not.toMatch(/^  ✗ OBJECTIVE_NOT_COVERED$/m);
    expect(message).not.toMatch(/^  ✗ NO_OBJECTIVES$/m);
    // Should show friendly title.
    expect(message).toMatch(/Tujuan pembelajaran belum diisi|Ada tujuan yang belum tercover/);
  });

  it('13. Fatal export message contains "Masalah Serius"', () => {
    const project = createProject();
    const report = checkExportQuality(project);
    const message = formatExportQualityMessage(report);
    expect(message).toContain('Masalah Serius');
  });

  it('14. Warning export message contains "Catatan"', () => {
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
    expect(report.fatalIssues.length).toBe(0);
    expect(report.warningIssues.length).toBeGreaterThan(0);
    const message = formatExportQualityMessage(report);
    expect(message).toContain('Catatan');
    expect(message).not.toContain('Masalah Serius');
  });

  it('15. Export message contains "Saran:"', () => {
    const project = createProject();
    const report = checkExportQuality(project);
    const message = formatExportQualityMessage(report);
    expect(message).toContain('Saran:');
  });

  it('16. Export message does not contain undefined/null/schema', () => {
    const project = createProject();
    const report = checkExportQuality(project);
    const message = formatExportQualityMessage(report);
    expect(message).not.toMatch(/\bundefined\b/);
    expect(message).not.toMatch(/\bnull\b/);
    expect(message).not.toMatch(/\bschema\b/);
  });

  it('17. Export message still contains layout/alignment summary', () => {
    const project = createProject();
    const report = checkExportQuality(project);
    const message = formatExportQualityMessage(report);
    expect(message).toContain('Skor Layout');
    expect(message).toContain('Alignment');
  });
});

// =========================================================================
// Alignment Panel Tests (18-21)
// =========================================================================

describe('TEACHER-FRIENDLY-ISSUE-COPY-01 — alignment panel', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('18. AlignmentDetailPanel shows friendly title for OBJECTIVE_NOT_COVERED', () => {
    // Build project with uncovered objective.
    const objTexts = ['Menjelaskan pengertian norma', 'Mengidentifikasi jenis norma', 'Menunjukkan sikap tertib'];
    const project = createProject();
    project.curriculum = {
      subject: 'Test', grade: '7', phase: 'D', topic: 'Test',
      objectives: objTexts.map((text) => ({ id: createComponentId(), text })),
    };
    const page: SimplePage = {
      id: createPageId(),
      title: 'Materi',
      role: 'material',
      layoutId: 'blank',
      background: { type: 'color', color: '#fff' },
      components: [
        { id: createComponentId(), type: 'text', variant: 'body', text: 'Norma adalah aturan.', x: 80, y: 80, width: 600, height: 120 } as never,
        { id: createComponentId(), type: 'navigation', variant: 'navigation', label: 'Lanjut', action: 'next', x: 900, y: 620, width: 300, height: 60 } as never,
      ],
    };
    project.pages = [page];
    project.currentPageId = page.id;
    useEditorStore.getState().setProject(project);

    const { container } = render(React.createElement(AlignmentSummary));
    fireEvent.click(container.querySelector('[data-testid="alignment-summary"]') as HTMLButtonElement);

    // Find issue with OBJECTIVE_NOT_COVERED.
    const issues = container.querySelectorAll('[data-testid^="alignment-detail-issue-"]');
    const notCoveredIssue = Array.from(issues).find(
      (el) => (el as HTMLElement).getAttribute('data-code') === 'OBJECTIVE_NOT_COVERED',
    ) as HTMLElement;
    expect(notCoveredIssue).toBeDefined();
    // Should show friendly title, not raw code as primary.
    const itemText = notCoveredIssue.querySelector('.alignment-detail__item-text');
    expect(itemText?.textContent).toBe('Ada tujuan yang belum tercover');
    expect(itemText?.textContent).not.toBe('OBJECTIVE_NOT_COVERED');
  });

  it('19. AlignmentDetailPanel shows suggestion for issue', () => {
    const objTexts = ['Menjelaskan pengertian norma', 'Mengidentifikasi jenis norma', 'Menunjukkan sikap tertib'];
    const project = createProject();
    project.curriculum = {
      subject: 'Test', grade: '7', phase: 'D', topic: 'Test',
      objectives: objTexts.map((text) => ({ id: createComponentId(), text })),
    };
    const page: SimplePage = {
      id: createPageId(),
      title: 'Materi',
      role: 'material',
      layoutId: 'blank',
      background: { type: 'color', color: '#fff' },
      components: [
        { id: createComponentId(), type: 'text', variant: 'body', text: 'Norma adalah aturan.', x: 80, y: 80, width: 600, height: 120 } as never,
        { id: createComponentId(), type: 'navigation', variant: 'navigation', label: 'Lanjut', action: 'next', x: 900, y: 620, width: 300, height: 60 } as never,
      ],
    };
    project.pages = [page];
    project.currentPageId = page.id;
    useEditorStore.getState().setProject(project);

    const { container } = render(React.createElement(AlignmentSummary));
    fireEvent.click(container.querySelector('[data-testid="alignment-summary"]') as HTMLButtonElement);

    const notCoveredIssue = Array.from(container.querySelectorAll('[data-testid^="alignment-detail-issue-"]')).find(
      (el) => (el as HTMLElement).getAttribute('data-code') === 'OBJECTIVE_NOT_COVERED',
    ) as HTMLElement;
    const suggestion = notCoveredIssue.querySelector('.alignment-detail__item-suggestion');
    expect(suggestion).not.toBeNull();
    expect(suggestion?.textContent).toContain('Saran:');
    expect(suggestion?.textContent).toContain('Tambahkan');
  });

  it('20. issue.code still appears as small meta chip', () => {
    const objTexts = ['Menjelaskan pengertian norma', 'Mengidentifikasi jenis norma', 'Menunjukkan sikap tertib'];
    const project = createProject();
    project.curriculum = {
      subject: 'Test', grade: '7', phase: 'D', topic: 'Test',
      objectives: objTexts.map((text) => ({ id: createComponentId(), text })),
    };
    const page: SimplePage = {
      id: createPageId(),
      title: 'Materi',
      role: 'material',
      layoutId: 'blank',
      background: { type: 'color', color: '#fff' },
      components: [
        { id: createComponentId(), type: 'text', variant: 'body', text: 'Norma adalah aturan.', x: 80, y: 80, width: 600, height: 120 } as never,
        { id: createComponentId(), type: 'navigation', variant: 'navigation', label: 'Lanjut', action: 'next', x: 900, y: 620, width: 300, height: 60 } as never,
      ],
    };
    project.pages = [page];
    project.currentPageId = page.id;
    useEditorStore.getState().setProject(project);

    const { container } = render(React.createElement(AlignmentSummary));
    fireEvent.click(container.querySelector('[data-testid="alignment-summary"]') as HTMLButtonElement);

    const codeChips = container.querySelectorAll('.alignment-detail__item-code');
    expect(codeChips.length).toBeGreaterThan(0);
    // Each code chip should contain a raw issue code (as meta, not primary text).
    for (const chip of codeChips) {
      expect(chip.textContent).toMatch(/^[A-Z_]+$/); // Raw code format
    }
  });

  it('21. Click issue still selects page (behavior unchanged)', () => {
    const project = createProject();
    project.curriculum = {
      subject: 'Test', grade: '7', phase: 'D', topic: 'Test',
      objectives: [{ id: createComponentId(), text: 'Menjelaskan pengertian norma' }],
    };
    const quizPage: SimplePage = {
      id: createPageId(),
      title: 'Kuis',
      role: 'quiz',
      layoutId: 'blank',
      background: { type: 'color', color: '#fff' },
      components: [
        {
          id: createComponentId(),
          type: 'question',
          variant: 'multipleChoice',
          title: 'Kuis',
          prompt: 'Berapa 1+1?',
          choices: [{ id: 'a', text: '2' }],
          correctChoiceIndex: 0,
          feedbackCorrect: 'Benar',
          feedbackWrong: 'Salah',
          points: 10,
          scoringStyle: 'points',
          x: 80, y: 80, width: 600, height: 400,
        } as never,
        { id: createComponentId(), type: 'navigation', variant: 'navigation', label: 'Lanjut', action: 'next', x: 900, y: 620, width: 300, height: 60 } as never,
      ],
    };
    project.pages = [quizPage];
    project.currentPageId = quizPage.id;
    useEditorStore.getState().setProject(project);

    const { container } = render(React.createElement(AlignmentSummary));
    fireEvent.click(container.querySelector('[data-testid="alignment-summary"]') as HTMLButtonElement);

    // Find clickable issue (ASSESSMENT_NOT_LINKED on quizPage).
    const issues = container.querySelectorAll('[data-testid^="alignment-detail-issue-"]');
    const clickableIssue = Array.from(issues).find(
      (el) => (el as HTMLElement).getAttribute('data-page-id') !== '',
    ) as HTMLElement;
    expect(clickableIssue).toBeDefined();
    fireEvent.click(clickableIssue);
    // Should have selected the quiz page.
    expect(useEditorStore.getState().project.currentPageId).toBe(quizPage.id);
  });
});

// =========================================================================
// Regression Tests (22-25)
// =========================================================================

describe('TEACHER-FRIENDLY-ISSUE-COPY-01 — regression', () => {
  it('22. checkLearningGoalAlignment logic unchanged (pure, same output)', () => {
    const project = createSamplePpknProject();
    const result1 = checkLearningGoalAlignment(project);
    const result2 = checkLearningGoalAlignment(project);
    expect(result1).toEqual(result2);
    // Verify structure still has same fields.
    expect(result1).toHaveProperty('ok');
    expect(result1).toHaveProperty('score');
    expect(result1).toHaveProperty('totalObjectives');
    expect(result1).toHaveProperty('coveredObjectives');
    expect(result1).toHaveProperty('uncoveredObjectiveIds');
    expect(result1).toHaveProperty('pages');
    expect(result1).toHaveProperty('issues');
  });

  it('23. checkExportQuality behavior unchanged (level/fatal/warning)', () => {
    // Healthy project → no fatal.
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    const report = checkExportQuality(project);
    expect(report.fatalIssues.length).toBe(0);
    expect(report.level).not.toBe('fatal');

    // Broken project → fatal.
    const broken = createProject();
    const brokenReport = checkExportQuality(broken);
    expect(brokenReport.fatalIssues.length).toBeGreaterThan(0);
    expect(brokenReport.level).toBe('fatal');
  });

  it('24. Export healthy project → no confirm (Topbar integration)', async () => {
    const { Topbar } = await import('../editor/Topbar');
    const { downloadHtmlFile } = await import('../export/export-download');

    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    useEditorStore.getState().setProject(project);

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const downloadSpy = vi.mocked(downloadHtmlFile);
    downloadSpy.mockClear();

    const { container } = render(React.createElement(Topbar));
    const exportBtn = container.querySelector('[data-testid="topbar-export"]') as HTMLButtonElement;
    fireEvent.click(exportBtn);

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(downloadSpy).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('25. Export broken project → confirm (Topbar integration)', async () => {
    const { Topbar } = await import('../editor/Topbar');
    const { downloadHtmlFile } = await import('../export/export-download');

    useEditorStore.getState().newProject(); // Default = broken (no objectives)

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const downloadSpy = vi.mocked(downloadHtmlFile);
    downloadSpy.mockClear();

    const { container } = render(React.createElement(Topbar));
    const exportBtn = container.querySelector('[data-testid="topbar-export"]') as HTMLButtonElement;
    fireEvent.click(exportBtn);

    expect(confirmSpy).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
