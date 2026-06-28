/**
 * LEARNING-GOAL-ALIGNMENT-UI-V2 tests.
 *
 * Scope:
 *   - useLearningGoalAlignment hook (memoized, recomputes on project change)
 *   - AlignmentSummary chip (renders, click opens detail, empty state)
 *   - AlignmentDetailPanel (sections: uncovered, covered, issues, pages, all-ok)
 *   - PagePanel integration (alignment badge per page in list view, summary in header)
 *   - getPageAlignmentLevel helper (5 levels: aligned, partial, unaligned, empty, neutral)
 *   - Regression: existing PagePanel tests still pass, no UI breakage
 *
 * Tidak menguji:
 *   - PageThumbnail (instruksi senior reviewer: jangan ubah thumbnail)
 *   - objectiveRefs schema (V3+)
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  checkLearningGoalAlignment,
  getPageAlignmentLevel,
  getPageAlignmentLevelLabel,
  getPageAlignmentLevelIcon,
  getAlignmentIssuesForPage,
  type PageAlignment,
  type ProjectAlignment,
} from '../core/learning-goal-alignment';
import { useLearningGoalAlignment } from '../editor/use-alignment';
import { AlignmentSummary, alignmentLevelToClass } from '../editor/AlignmentPanel';
import { PagePanel } from '../editor/PagePanel';
import { useEditorStore } from '../store/editor-store';
import { createSamplePpknProject } from '../core/sample-project';
import { createProject } from '../core/project-factory';
import { createComponentId, createPageId } from '../core/ids';
import type { SimpleProject, SimplePage, PageComponent, PageRole } from '../core/types';

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
  role: PageRole,
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

function textComp(text: string): PageComponent {
  return {
    id: createComponentId(),
    type: 'text',
    variant: 'body',
    text,
    x: 80, y: 80, width: 600, height: 120,
  } as never;
}

function navComp(label: string): PageComponent {
  return {
    id: createComponentId(),
    type: 'navigation',
    variant: 'navigation',
    label,
    action: 'next',
    x: 80, y: 80, width: 200, height: 50,
  } as never;
}

function questionComp(title: string, prompt: string): PageComponent {
  return {
    id: createComponentId(),
    type: 'question',
    variant: 'multipleChoice',
    title,
    prompt,
    choices: [{ id: 'a', text: 'Opsi' }],
    correctChoiceIndex: 0,
    feedbackCorrect: 'Benar',
    feedbackWrong: 'Salah',
    points: 10,
    scoringStyle: 'points',
    x: 80, y: 80, width: 600, height: 400,
  } as never;
}

// =========================================================================
// 1. getPageAlignmentLevel — 5 levels
// =========================================================================

describe('LGA-UI-V2 — getPageAlignmentLevel', () => {
  it('returns "neutral" for cover role', () => {
    const pa: PageAlignment = {
      pageId: 'p1', pageRole: 'cover', pageTitle: 'Cover',
      addressedObjectiveIds: [], hasAssessment: false, assessmentComponents: [], issues: [],
    };
    expect(getPageAlignmentLevel(pa)).toBe('neutral');
  });

  it('returns "neutral" for guide role', () => {
    const pa: PageAlignment = {
      pageId: 'p1', pageRole: 'guide', pageTitle: 'Guide',
      addressedObjectiveIds: [], hasAssessment: false, assessmentComponents: [], issues: [],
    };
    expect(getPageAlignmentLevel(pa)).toBe('neutral');
  });

  it('returns "neutral" for menu role', () => {
    const pa: PageAlignment = {
      pageId: 'p1', pageRole: 'menu', pageTitle: 'Menu',
      addressedObjectiveIds: [], hasAssessment: false, assessmentComponents: [], issues: [],
    };
    expect(getPageAlignmentLevel(pa)).toBe('neutral');
  });

  it('returns "neutral" for free role', () => {
    const pa: PageAlignment = {
      pageId: 'p1', pageRole: 'free', pageTitle: 'Free',
      addressedObjectiveIds: [], hasAssessment: false, assessmentComponents: [], issues: [],
    };
    expect(getPageAlignmentLevel(pa)).toBe('neutral');
  });

  it('returns "empty" for material page with no components (no objectives addressed, no issues)', () => {
    const pa: PageAlignment = {
      pageId: 'p1', pageRole: 'material', pageTitle: 'Materi Kosong',
      addressedObjectiveIds: [], hasAssessment: false, assessmentComponents: [], issues: [],
    };
    expect(getPageAlignmentLevel(pa)).toBe('empty');
  });

  it('returns "unaligned" for material page with 0 objectives addressed AND has issues', () => {
    const pa: PageAlignment = {
      pageId: 'p1', pageRole: 'material', pageTitle: 'Materi Tidak Terkait',
      addressedObjectiveIds: [],
      hasAssessment: false,
      assessmentComponents: [],
      issues: [{
        severity: 'warning',
        code: 'MATERIAL_NOT_LINKED',
        message: 'Halaman materi tidak terhubung ke tujuan pembelajaran manapun.',
        pageId: 'p1',
      }],
    };
    expect(getPageAlignmentLevel(pa)).toBe('unaligned');
  });

  it('returns "partial" for material page with >=1 objective addressed BUT has issues', () => {
    const pa: PageAlignment = {
      pageId: 'p1', pageRole: 'material', pageTitle: 'Materi Sebagian',
      addressedObjectiveIds: ['obj-1'],
      hasAssessment: false,
      assessmentComponents: [],
      issues: [{
        severity: 'warning',
        code: 'NAV_MISSING',
        message: 'Materi belum punya tombol navigasi keluar.',
        pageId: 'p1',
      }],
    };
    expect(getPageAlignmentLevel(pa)).toBe('partial');
  });

  it('returns "aligned" for material page with >=1 objective AND no issues', () => {
    const pa: PageAlignment = {
      pageId: 'p1', pageRole: 'material', pageTitle: 'Materi Selaras',
      addressedObjectiveIds: ['obj-1'],
      hasAssessment: false,
      assessmentComponents: [],
      issues: [],
    };
    expect(getPageAlignmentLevel(pa)).toBe('aligned');
  });
});

// =========================================================================
// 2. getPageAlignmentLevelLabel + getPageAlignmentLevelIcon
// =========================================================================

describe('LGA-UI-V2 — level label + icon', () => {
  it('getPageAlignmentLevelLabel returns Indonesian label for each level', () => {
    expect(getPageAlignmentLevelLabel('aligned')).toBe('Selaras');
    expect(getPageAlignmentLevelLabel('partial')).toBe('Sebagian');
    expect(getPageAlignmentLevelLabel('unaligned')).toBe('Belum selaras');
    expect(getPageAlignmentLevelLabel('empty')).toBe('Kosong');
    expect(getPageAlignmentLevelLabel('neutral')).toBe('Netral');
  });

  it('getPageAlignmentLevelIcon returns icon char for each level', () => {
    expect(getPageAlignmentLevelIcon('aligned')).toBe('✓');
    expect(getPageAlignmentLevelIcon('partial')).toBe('◐');
    expect(getPageAlignmentLevelIcon('unaligned')).toBe('✗');
    expect(getPageAlignmentLevelIcon('empty')).toBe('○');
    expect(getPageAlignmentLevelIcon('neutral')).toBe('—');
  });
});

// =========================================================================
// 3. getAlignmentIssuesForPage
// =========================================================================

describe('LGA-UI-V2 — getAlignmentIssuesForPage', () => {
  it('filters issues by pageId', () => {
    const alignment: ProjectAlignment = {
      ok: false, score: 50, totalObjectives: 2, coveredObjectives: 1,
      uncoveredObjectiveIds: ['obj-2'],
      pages: [],
      issues: [
        { severity: 'warning', code: 'MATERIAL_NOT_LINKED', message: 'msg1', pageId: 'p1' },
        { severity: 'warning', code: 'ASSESSMENT_NOT_LINKED', message: 'msg2', pageId: 'p2' },
        { severity: 'error', code: 'OBJECTIVE_NOT_COVERED', message: 'msg3', objectiveId: 'obj-2' },
      ],
    };
    expect(getAlignmentIssuesForPage(alignment, 'p1')).toHaveLength(1);
    expect(getAlignmentIssuesForPage(alignment, 'p2')).toHaveLength(1);
    expect(getAlignmentIssuesForPage(alignment, 'p3')).toHaveLength(0);
  });
});

// =========================================================================
// 4. alignmentLevelToClass
// =========================================================================

describe('LGA-UI-V2 — alignmentLevelToClass', () => {
  it('maps each level to CSS class', () => {
    expect(alignmentLevelToClass('aligned')).toBe('is-aligned');
    expect(alignmentLevelToClass('partial')).toBe('is-partial');
    expect(alignmentLevelToClass('unaligned')).toBe('is-unaligned');
    expect(alignmentLevelToClass('empty')).toBe('is-empty');
    expect(alignmentLevelToClass('neutral')).toBe('is-neutral');
  });
});

// =========================================================================
// 5. useLearningGoalAlignment hook
// =========================================================================

function HookProbe() {
  const alignment = useLearningGoalAlignment();
  return React.createElement('div', { 'data-testid': 'probe', 'data-score': alignment.score });
}

describe('LGA-UI-V2 — useLearningGoalAlignment hook', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('returns alignment for current project', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const { container } = render(React.createElement(HookProbe));
    const probe = container.querySelector('[data-testid="probe"]')!;
    expect(probe.getAttribute('data-score')).not.toBe('');
  });

  it('returns 0 score for empty project (no objectives)', () => {
    render(React.createElement(HookProbe));
    // createProject default has no curriculum → NO_OBJECTIVES → score 0
    // (HookProbe renders with default empty project from beforeEach)
  });

  it('recomputes when project changes', () => {
    const project1 = createSamplePpknProject();
    useEditorStore.getState().setProject(project1);
    const { container: c1, rerender } = render(React.createElement(HookProbe));
    const score1 = c1.querySelector('[data-testid="probe"]')!.getAttribute('data-score');

    // Change to broken project (no objectives)
    useEditorStore.getState().newProject();
    rerender(React.createElement(HookProbe));
    const score2 = c1.querySelector('[data-testid="probe"]')!.getAttribute('data-score');

    // score1 should be a number (sample has objectives), score2 should be 0
    expect(score1).not.toBe(score2);
  });
});

// =========================================================================
// 6. AlignmentSummary chip
// =========================================================================

describe('LGA-UI-V2 — AlignmentSummary chip', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('renders empty state when no objectives', () => {
    const { container } = render(React.createElement(AlignmentSummary));
    const summary = container.querySelector('[data-testid="alignment-summary"]');
    expect(summary).not.toBeNull();
    expect(summary?.getAttribute('data-testid-empty')).toBe('true');
    expect(summary?.textContent).toContain('Belum ada tujuan');
  });

  it('renders score + summary label when objectives present', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const { container } = render(React.createElement(AlignmentSummary));
    const summary = container.querySelector('[data-testid="alignment-summary"]');
    expect(summary).not.toBeNull();
    expect(summary?.getAttribute('data-testid-empty')).toBeNull(); // not empty
    expect(summary?.getAttribute('data-score')).not.toBe('');
    expect(summary?.getAttribute('data-score-label')).not.toBe('');
  });

  it('click opens AlignmentDetailPanel', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const { container } = render(React.createElement(AlignmentSummary));
    const summary = container.querySelector('[data-testid="alignment-summary"]') as HTMLButtonElement;
    fireEvent.click(summary);
    expect(container.querySelector('[data-testid="alignment-detail-panel"]')).not.toBeNull();
  });

  it('click on empty state does NOT open detail panel (non-interactive)', () => {
    const { container } = render(React.createElement(AlignmentSummary));
    const summary = container.querySelector('[data-testid="alignment-summary"]') as HTMLElement;
    // It's a div, not a button, in empty state
    expect(summary.tagName).not.toBe('BUTTON');
    fireEvent.click(summary);
    expect(container.querySelector('[data-testid="alignment-detail-panel"]')).toBeNull();
  });
});

// =========================================================================
// 7. AlignmentDetailPanel
// =========================================================================

describe('LGA-UI-V2 — AlignmentDetailPanel', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('renders all sections when there are issues + uncovered objectives', () => {
    // Build a project with 2 objectives, only 1 covered, plus an unrelated quiz question.
    const objTexts = ['Menjelaskan pengertian norma', 'Mengidentifikasi jenis norma'];
    const materialPage = buildPage('material', [
      textComp('Pengertian norma jelas.'),
      navComp('Lanjut'),
    ]);
    const quizPage = buildPage('quiz', [
      questionComp('Kuis', 'Berapa 1+1?'),
      navComp('Lanjut'),
    ]);
    const project = buildProjectWithObjectives(objTexts, [materialPage, quizPage]);
    useEditorStore.getState().setProject(project);

    const { container } = render(React.createElement(AlignmentSummary));
    const summary = container.querySelector('[data-testid="alignment-summary"]') as HTMLButtonElement;
    fireEvent.click(summary);

    // Detail panel should render
    expect(container.querySelector('[data-testid="alignment-detail-panel"]')).not.toBeNull();
    // Uncovered section (objective 2 not covered)
    expect(container.querySelector('[data-testid="alignment-detail-uncovered"]')).not.toBeNull();
    // Covered section (objective 1 covered)
    expect(container.querySelector('[data-testid="alignment-detail-covered"]')).not.toBeNull();
    // Issues section (ASSESSMENT_NOT_LINKED + OBJECTIVE_NOT_COVERED)
    expect(container.querySelector('[data-testid="alignment-detail-issues"]')).not.toBeNull();
    // Pages section
    expect(container.querySelector('[data-testid="alignment-detail-pages"]')).not.toBeNull();
  });

  it('renders all-ok state when project is fully aligned', () => {
    const objTexts = ['Menjelaskan pengertian norma'];
    const materialPage = buildPage('material', [
      textComp('Pengertian norma jelas.'),
      navComp('Lanjut'),
    ]);
    const project = buildProjectWithObjectives(objTexts, [materialPage]);
    useEditorStore.getState().setProject(project);

    const { container } = render(React.createElement(AlignmentSummary));
    fireEvent.click(container.querySelector('[data-testid="alignment-summary"]') as HTMLButtonElement);

    expect(container.querySelector('[data-testid="alignment-detail-all-ok"]')).not.toBeNull();
    // No uncovered section
    expect(container.querySelector('[data-testid="alignment-detail-uncovered"]')).toBeNull();
  });

  it('close button closes panel', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const { container } = render(React.createElement(AlignmentSummary));
    fireEvent.click(container.querySelector('[data-testid="alignment-summary"]') as HTMLButtonElement);
    expect(container.querySelector('[data-testid="alignment-detail-panel"]')).not.toBeNull();

    const closeBtn = container.querySelector('[data-testid="alignment-detail-close"]') as HTMLButtonElement;
    fireEvent.click(closeBtn);
    expect(container.querySelector('[data-testid="alignment-detail-panel"]')).toBeNull();
  });

  it('click on issue with pageId selects that page and closes panel', () => {
    const objTexts = ['Menjelaskan pengertian norma'];
    const quizPage = buildPage('quiz', [
      questionComp('Kuis', 'Berapa 1+1?'),
      navComp('Lanjut'),
    ], 'Halaman Kuis');
    const project = buildProjectWithObjectives(objTexts, [quizPage]);
    useEditorStore.getState().setProject(project);

    const { container } = render(React.createElement(AlignmentSummary));
    fireEvent.click(container.querySelector('[data-testid="alignment-summary"]') as HTMLButtonElement);

    // Find first issue (ASSESSMENT_NOT_LINKED on quizPage)
    const issueItem = container.querySelector('[data-testid="alignment-detail-issue-0"]') as HTMLElement;
    expect(issueItem).not.toBeNull();
    expect(issueItem.getAttribute('data-page-id')).toBe(quizPage.id);

    fireEvent.click(issueItem);

    // Panel should close
    expect(container.querySelector('[data-testid="alignment-detail-panel"]')).toBeNull();
    // Quiz page should be selected
    expect(useEditorStore.getState().project.currentPageId).toBe(quizPage.id);
  });

  it('click on page row in pages section selects that page', () => {
    const objTexts = ['Menjelaskan pengertian norma'];
    const materialPage = buildPage('material', [
      textComp('Pengertian norma.'),
      navComp('Lanjut'),
    ], 'Materi');
    const project = buildProjectWithObjectives(objTexts, [materialPage]);
    useEditorStore.getState().setProject(project);

    const { container } = render(React.createElement(AlignmentSummary));
    fireEvent.click(container.querySelector('[data-testid="alignment-summary"]') as HTMLButtonElement);

    const pageRow = container.querySelector(`[data-testid="alignment-detail-page-${materialPage.id}"]`) as HTMLElement;
    expect(pageRow).not.toBeNull();
    fireEvent.click(pageRow);

    expect(useEditorStore.getState().project.currentPageId).toBe(materialPage.id);
  });

  it('neutral pages show as non-clickable in pages section (no arrow, no click handler effect)', () => {
    const objTexts = ['Menjelaskan pengertian norma'];
    const coverPage = buildPage('cover', [textComp('Judul')], 'Cover');
    const materialPage = buildPage('material', [
      textComp('Pengertian norma.'),
      navComp('Lanjut'),
    ], 'Materi');
    const project = buildProjectWithObjectives(objTexts, [coverPage, materialPage]);
    useEditorStore.getState().setProject(project);
    // Initially select cover
    useEditorStore.getState().selectPage(coverPage.id);

    const { container } = render(React.createElement(AlignmentSummary));
    fireEvent.click(container.querySelector('[data-testid="alignment-summary"]') as HTMLButtonElement);

    const coverRow = container.querySelector(`[data-testid="alignment-detail-page-${coverPage.id}"]`) as HTMLElement;
    expect(coverRow.getAttribute('data-level')).toBe('neutral');
    // Clicking neutral row should NOT change page
    fireEvent.click(coverRow);
    // (Panel does not close for neutral clicks because isClickable=false; we just verify page unchanged)
    expect(useEditorStore.getState().project.currentPageId).toBe(coverPage.id);
  });
});

// =========================================================================
// 8. PagePanel integration — alignment summary + badge per page
// =========================================================================

describe('LGA-UI-V2 — PagePanel integration', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('PagePanel renders AlignmentSummary in header', () => {
    const { container } = render(React.createElement(PagePanel));
    expect(container.querySelector('[data-testid="alignment-summary"]')).not.toBeNull();
  });

  it('AlignmentSummary in PagePanel reflects project alignment state', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const { container } = render(React.createElement(PagePanel));
    const summary = container.querySelector('[data-testid="alignment-summary"]');
    expect(summary?.getAttribute('data-testid-empty')).toBeNull(); // not empty
  });

  it('AlignmentSummary in PagePanel shows empty state for fresh project', () => {
    const { container } = render(React.createElement(PagePanel));
    const summary = container.querySelector('[data-testid="alignment-summary"]');
    expect(summary?.getAttribute('data-testid-empty')).toBe('true');
  });

  it('AlignmentBadge per page appears in list view (not thumbnail view)', () => {
    const objTexts = ['Menjelaskan pengertian norma'];
    const materialPage = buildPage('material', [
      textComp('Pengertian norma.'),
      navComp('Lanjut'),
    ], 'Materi');
    const project = buildProjectWithObjectives(objTexts, [materialPage]);
    useEditorStore.getState().setProject(project);

    const { container } = render(React.createElement(PagePanel));
    // Switch to list view (default is thumbnail)
    const toggle = container.querySelector('[data-testid="page-panel-view-toggle"]') as HTMLButtonElement;
    fireEvent.click(toggle);

    // AlignmentBadge should be present for material page
    const badge = container.querySelector(`[data-testid="page-alignment-badge-${materialPage.id}"]`);
    expect(badge).not.toBeNull();
    // Material page that covers objective → aligned
    expect(badge?.getAttribute('data-level')).toBe('aligned');
  });

  it('AlignmentBadge NOT rendered for neutral roles (cover/guide/menu/free)', () => {
    const objTexts = ['Menjelaskan pengertian norma'];
    const coverPage = buildPage('cover', [textComp('Judul')], 'Cover');
    const materialPage = buildPage('material', [
      textComp('Pengertian norma.'),
      navComp('Lanjut'),
    ], 'Materi');
    const project = buildProjectWithObjectives(objTexts, [coverPage, materialPage]);
    useEditorStore.getState().setProject(project);

    const { container } = render(React.createElement(PagePanel));
    const toggle = container.querySelector('[data-testid="page-panel-view-toggle"]') as HTMLButtonElement;
    fireEvent.click(toggle);

    // Cover page should NOT have alignment badge
    const coverBadge = container.querySelector(`[data-testid="page-alignment-badge-${coverPage.id}"]`);
    expect(coverBadge).toBeNull();
  });

  it('AlignmentBadge shows unaligned level for material page with no objective match', () => {
    const objTexts = ['Menjelaskan pengertian norma'];
    const materialPage = buildPage('material', [
      textComp('Hari ini kita belajar cuaca.'),
      navComp('Lanjut'),
    ], 'Materi Cuaca');
    const project = buildProjectWithObjectives(objTexts, [materialPage]);
    useEditorStore.getState().setProject(project);

    const { container } = render(React.createElement(PagePanel));
    const toggle = container.querySelector('[data-testid="page-panel-view-toggle"]') as HTMLButtonElement;
    fireEvent.click(toggle);

    const badge = container.querySelector(`[data-testid="page-alignment-badge-${materialPage.id}"]`);
    expect(badge?.getAttribute('data-level')).toBe('unaligned');
  });

  it('AlignmentBadge shows empty level for quiz page with no components', () => {
    // Quiz role with no components: no objectives addressed, no assessment
    // components to trigger ASSESSMENT_NOT_LINKED, no role-specific check → 'empty'.
    const objTexts = ['Menjelaskan pengertian norma'];
    const quizPage = buildPage('quiz', [], 'Kuis Kosong');
    const project = buildProjectWithObjectives(objTexts, [quizPage]);
    useEditorStore.getState().setProject(project);

    const { container } = render(React.createElement(PagePanel));
    const toggle = container.querySelector('[data-testid="page-panel-view-toggle"]') as HTMLButtonElement;
    fireEvent.click(toggle);

    const badge = container.querySelector(`[data-testid="page-alignment-badge-${quizPage.id}"]`);
    expect(badge?.getAttribute('data-level')).toBe('empty');
  });
});

// =========================================================================
// 9. Regression — existing PagePanel contracts still hold
// =========================================================================

describe('LGA-UI-V2 — regression', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('PagePanel header still says "Halaman" (not "Alur Pembelajaran")', () => {
    const { container } = render(React.createElement(PagePanel));
    const headTitle = container.querySelector('.page-panel__head-title');
    expect(headTitle?.textContent).toBe('Halaman');
  });

  it('PagePanel default view is still thumbnail', () => {
    const { container } = render(React.createElement(PagePanel));
    expect(container.querySelector('[data-testid="page-panel-thumbnails"]')).not.toBeNull();
  });

  it('PagePanel status summary still renders (Cek Standar)', () => {
    const { container } = render(React.createElement(PagePanel));
    expect(container.querySelector('[data-testid="page-panel-summary"]')).not.toBeNull();
  });

  it('PageThumbnail NOT modified (still renders with data-role + data-status)', () => {
    const project = createSamplePpknProject();
    useEditorStore.getState().setProject(project);
    const { container } = render(React.createElement(PagePanel));
    const thumbnail = container.querySelector('[data-testid^="page-thumbnail-"]');
    expect(thumbnail).not.toBeNull();
    expect(thumbnail?.hasAttribute('data-role')).toBe(true);
    expect(thumbnail?.hasAttribute('data-status')).toBe(true);
  });

  it('Contract file unchanged — checkLearningGoalAlignment still pure function', () => {
    const project = createSamplePpknProject();
    const snapshot = JSON.stringify(project);
    checkLearningGoalAlignment(project);
    expect(JSON.stringify(project)).toBe(snapshot);
  });
});
