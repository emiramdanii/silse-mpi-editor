/**
 * UX-02 — Learning Flow Status tests.
 *
 * Layer: tests
 *
 * Kontrak (UX-02):
 *   1. Panel Alur Pembelajaran menampilkan status per halaman.
 *   2. Warning dari checkMpiStandard muncul dekat halaman terkait.
 *   3. Halaman yang belum lengkap diberi badge.
 *   4. Guru bisa tahu masalah tanpa harus klik Export.
 *   5. Jangan tambah fitur MPI baru.
 *
 *   Test ini menguji:
 *     - computePageStatus: per-page status computation (per role + content rules)
 *     - computeAllPageStatuses + computeLearningFlowSummary: aggregate summary
 *     - PagePanel rendering: badge per page, summary header, inline issues
 *     - Regression: existing PagePanel contracts (rename/duplikat/hapus + no block)
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import { PagePanel } from '../editor/PagePanel';
import { useEditorStore } from '../store/editor-store';
import { createSamplePpknProject } from '../core/sample-project';
import {
  computePageStatus,
  computeAllPageStatuses,
  computeLearningFlowSummary,
  statusIcon,
  statusLabel,
} from '../editor/mpi-page-status';
import type { SimplePage } from '../core/types';
import { createPageId, createComponentId } from '../core/ids';

// Helper: build a minimal page with given role + components
function buildPage(
  role: SimplePage['role'],
  components: SimplePage['components'] = [],
  title = 'Test Page',
): SimplePage {
  return {
    id: createPageId(),
    title,
    role,
    layoutId: 'blank',
    background: { type: 'color', color: '#ffffff' },
    components,
  };
}

// Helper: build a text component
function textComponent(text: string): SimplePage['components'][number] {
  return {
    id: createComponentId(),
    type: 'text',
    variant: 'body',
    text,
    x: 80, y: 80, width: 400, height: 80,
  } as SimplePage['components'][number];
}

// Helper: build a navigation component
function navComponent(): SimplePage['components'][number] {
  return {
    id: createComponentId(),
    type: 'navigation',
    variant: 'primaryAction',
    label: 'Berikutnya',
    action: 'next',
    x: 900, y: 620, width: 300, height: 60,
  } as SimplePage['components'][number];
}

// Helper: build a question component (configurable feedback)
function questionComponent(opts: {
  feedbackCorrect?: string;
  feedbackWrong?: string;
  prompt?: string;
  title?: string;
}): SimplePage['components'][number] {
  return {
    id: createComponentId(),
    type: 'question',
    variant: 'multipleChoice',
    title: opts.title ?? 'Kuis',
    prompt: opts.prompt ?? 'Pertanyaan?',
    choices: [
      { id: createComponentId(), text: 'A' },
      { id: createComponentId(), text: 'B' },
    ],
    correctChoiceIndex: 0,
    feedbackCorrect: opts.feedbackCorrect ?? '',
    feedbackWrong: opts.feedbackWrong ?? '',
    points: 10,
    scoringStyle: 'points',
    x: 80, y: 80, width: 600, height: 400,
  } as SimplePage['components'][number];
}

// Helper: build a game component (configurable mission feedback)
function gameComponent(opts: {
  missionFeedbackCorrect?: string;
  missionFeedbackWrong?: string;
  missionPrompt?: string;
}): SimplePage['components'][number] {
  return {
    id: createComponentId(),
    type: 'game',
    gameType: 'missionQuiz',
    title: 'Game',
    instruction: 'Instruksi',
    scoringStyle: 'stars',
    x: 80, y: 80, width: 700, height: 500,
    missions: [
      {
        id: createComponentId(),
        title: 'Misi 1',
        prompt: opts.missionPrompt ?? 'Pertanyaan misi?',
        choices: [
          { id: createComponentId(), text: 'A' },
          { id: createComponentId(), text: 'B' },
        ],
        correctChoiceIndex: 0,
        feedbackCorrect: opts.missionFeedbackCorrect ?? '',
        feedbackWrong: opts.missionFeedbackWrong ?? '',
        points: 10,
      },
    ],
  } as SimplePage['components'][number];
}

// =========================================================================
// computePageStatus — per-role rules
// =========================================================================

describe('UX-02 — computePageStatus per-role rules', () => {
  it('cover with text component → ok', () => {
    const page = buildPage('cover', [textComponent('Judul')]);
    const status = computePageStatus(page);
    expect(status.level).toBe('ok');
    expect(status.issues).toEqual([]);
  });

  it('cover with NO text component → error', () => {
    const page = buildPage('cover', []);
    const status = computePageStatus(page);
    expect(status.level).toBe('error');
    expect(status.issues.some((i) => i.message.match(/teks judul/i))).toBe(true);
  });

  it('learningObjectives with text → ok', () => {
    const page = buildPage('learningObjectives', [textComponent('Tujuan 1')]);
    const status = computePageStatus(page);
    expect(status.level).toBe('ok');
  });

  it('learningObjectives without text → error', () => {
    const page = buildPage('learningObjectives', []);
    const status = computePageStatus(page);
    expect(status.level).toBe('error');
    expect(status.issues.some((i) => i.message.match(/belum punya teks/i))).toBe(true);
  });

  it('material with content + navigation → ok', () => {
    const page = buildPage('material', [textComponent('Materi'), navComponent()]);
    const status = computePageStatus(page);
    expect(status.level).toBe('ok');
  });

  it('material without content → error', () => {
    const page = buildPage('material', [navComponent()]);
    const status = computePageStatus(page);
    expect(status.level).toBe('error');
    expect(status.issues.some((i) => i.message.match(/belum punya konten/i))).toBe(true);
  });

  it('material without navigation → warning (dead-end)', () => {
    const page = buildPage('material', [textComponent('Materi')]);
    const status = computePageStatus(page);
    expect(status.level).toBe('warning');
    expect(status.issues.some((i) => i.message.match(/navigasi/i))).toBe(true);
  });

  it('activity with game + navigation → ok', () => {
    const page = buildPage('activity', [
      gameComponent({ missionFeedbackCorrect: 'Benar!', missionFeedbackWrong: 'Salah.' }),
      navComponent(),
    ]);
    const status = computePageStatus(page);
    expect(status.level).toBe('ok');
  });

  it('activity without game → error', () => {
    const page = buildPage('activity', [navComponent()]);
    const status = computePageStatus(page);
    expect(status.level).toBe('error');
    expect(status.issues.some((i) => i.message.match(/game/i))).toBe(true);
  });

  it('activity without navigation → warning (dead-end)', () => {
    const page = buildPage('activity', [
      gameComponent({ missionFeedbackCorrect: 'Benar!', missionFeedbackWrong: 'Salah.' }),
    ]);
    const status = computePageStatus(page);
    expect(status.level).toBe('warning');
    expect(status.issues.some((i) => i.message.match(/navigasi/i))).toBe(true);
  });

  it('quiz with question + navigation → ok (when feedback filled)', () => {
    const page = buildPage('quiz', [
      questionComponent({ feedbackCorrect: 'Benar!', feedbackWrong: 'Salah.' }),
      navComponent(),
    ]);
    const status = computePageStatus(page);
    expect(status.level).toBe('ok');
  });

  it('quiz without question → error', () => {
    const page = buildPage('quiz', [navComponent()]);
    const status = computePageStatus(page);
    expect(status.level).toBe('error');
    expect(status.issues.some((i) => i.message.match(/pertanyaan/i))).toBe(true);
  });

  it('quiz without navigation → warning (dead-end)', () => {
    const page = buildPage('quiz', [
      questionComponent({ feedbackCorrect: 'Benar!', feedbackWrong: 'Salah.' }),
    ]);
    const status = computePageStatus(page);
    expect(status.level).toBe('warning');
    expect(status.issues.some((i) => i.message.match(/navigasi/i))).toBe(true);
  });

  it('free page → always ok regardless of content', () => {
    const page = buildPage('free', []);
    const status = computePageStatus(page);
    expect(status.level).toBe('ok');
  });

  it('guide without text/card → warning', () => {
    const page = buildPage('guide', []);
    const status = computePageStatus(page);
    expect(status.level).toBe('warning');
  });

  it('menu without text/card → warning', () => {
    const page = buildPage('menu', []);
    const status = computePageStatus(page);
    expect(status.level).toBe('warning');
  });

  it('starter without content → warning', () => {
    const page = buildPage('starter', []);
    const status = computePageStatus(page);
    expect(status.level).toBe('warning');
  });

  it('reflection without text/card → warning', () => {
    const page = buildPage('reflection', []);
    const status = computePageStatus(page);
    expect(status.level).toBe('warning');
  });

  it('closing without text → warning', () => {
    const page = buildPage('closing', []);
    const status = computePageStatus(page);
    expect(status.level).toBe('warning');
  });
});

// =========================================================================
// computePageStatus — feedback rules for question/game
// =========================================================================

describe('UX-02 — computePageStatus feedback rules', () => {
  it('question with empty feedbackCorrect → warning', () => {
    const page = buildPage('quiz', [
      questionComponent({ feedbackCorrect: '', feedbackWrong: 'Salah.' }),
      navComponent(),
    ]);
    const status = computePageStatus(page);
    expect(status.issues.some((i) => i.message.match(/umpan balik benar/i))).toBe(true);
    expect(status.level).toBe('warning');
  });

  it('question with empty feedbackWrong → warning', () => {
    const page = buildPage('quiz', [
      questionComponent({ feedbackCorrect: 'Benar!', feedbackWrong: '' }),
      navComponent(),
    ]);
    const status = computePageStatus(page);
    expect(status.issues.some((i) => i.message.match(/umpan balik salah/i))).toBe(true);
    expect(status.level).toBe('warning');
  });

  it('game mission with feedback < 3 chars → warning', () => {
    const page = buildPage('activity', [
      gameComponent({ missionFeedbackCorrect: 'OK', missionFeedbackWrong: 'No' }),
      navComponent(),
    ]);
    const status = computePageStatus(page);
    expect(status.issues.some((i) => i.message.match(/umpan balik benar terlalu pendek/i))).toBe(true);
    expect(status.issues.some((i) => i.message.match(/umpan balik salah terlalu pendek/i))).toBe(true);
    expect(status.level).toBe('warning');
  });

  it('error takes precedence over warning in level aggregation', () => {
    // Cover with no text (error) AND a question with empty feedback (warning)
    const page = buildPage('cover', [
      questionComponent({ feedbackCorrect: '', feedbackWrong: '' }),
    ]);
    const status = computePageStatus(page);
    expect(status.level).toBe('error');
    expect(status.issues.some((i) => i.level === 'error')).toBe(true);
    expect(status.issues.some((i) => i.level === 'warning')).toBe(true);
  });
});

// =========================================================================
// computeAllPageStatuses + computeLearningFlowSummary
// =========================================================================

describe('UX-02 — aggregate summary', () => {
  it('computeAllPageStatuses returns map keyed by pageId', () => {
    const p1 = buildPage('cover', [textComponent('Judul')]);
    const p2 = buildPage('material', [textComponent('Materi')]); // no nav → warning
    const p3 = buildPage('quiz', []); // no question → error
    const statuses = computeAllPageStatuses([p1, p2, p3]);
    expect(Object.keys(statuses)).toHaveLength(3);
    expect(statuses[p1.id].level).toBe('ok');
    expect(statuses[p2.id].level).toBe('warning');
    expect(statuses[p3.id].level).toBe('error');
  });

  it('computeLearningFlowSummary counts ok/warning/error correctly', () => {
    const p1 = buildPage('cover', [textComponent('Judul')]);
    const p2 = buildPage('material', [textComponent('Materi')]); // warning
    const p3 = buildPage('quiz', []); // error
    const p4 = buildPage('free', []);
    const statuses = computeAllPageStatuses([p1, p2, p3, p4]);
    const summary = computeLearningFlowSummary(statuses);
    expect(summary.total).toBe(4);
    expect(summary.ok).toBe(2);
    expect(summary.warning).toBe(1);
    expect(summary.error).toBe(1);
    expect(summary.allOk).toBe(false);
  });

  it('computeLearningFlowSummary allOk=true when no issues', () => {
    const p1 = buildPage('cover', [textComponent('Judul')]);
    const p2 = buildPage('free', []);
    const statuses = computeAllPageStatuses([p1, p2]);
    const summary = computeLearningFlowSummary(statuses);
    expect(summary.allOk).toBe(true);
    expect(summary.warning).toBe(0);
    expect(summary.error).toBe(0);
  });

  it('sample PPKn: all pages should be ok', () => {
    const sample = createSamplePpknProject();
    const statuses = computeAllPageStatuses(sample.pages);
    const summary = computeLearningFlowSummary(statuses);
    // Sample PPKn was crafted to pass checkMpiStandard — should also pass per-page status.
    expect(summary.error).toBe(0);
    expect(summary.warning).toBe(0);
    expect(summary.allOk).toBe(true);
  });
});

// =========================================================================
// statusIcon + statusLabel helpers
// =========================================================================

describe('UX-02 — statusIcon + statusLabel helpers', () => {
  it('statusIcon returns ✓ for ok, ⚠ for warning, ✗ for error', () => {
    expect(statusIcon('ok')).toBe('✓');
    expect(statusIcon('warning')).toBe('⚠');
    expect(statusIcon('error')).toBe('✗');
  });

  it('statusLabel returns friendly Indonesian label', () => {
    expect(statusLabel('ok')).toMatch(/Lengkap/);
    expect(statusLabel('warning')).toMatch(/perhatian/i);
    expect(statusLabel('error')).toMatch(/Belum lengkap/);
  });
});

// =========================================================================
// PagePanel rendering — per-page badge + summary header + inline issues
// =========================================================================

describe('UX-02 — PagePanel rendering', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('renders Cek Standar summary header (always visible)', () => {
    const { container } = render(React.createElement(PagePanel)); const _toggle = container.querySelector("[data-testid=\"page-panel-view-toggle\"]"); if (_toggle) fireEvent.click(_toggle);
    const summary = container.querySelector('[data-testid="page-panel-summary"]');
    expect(summary).not.toBeNull();
    // Should have ok count, warning count (if any), error count (if any)
    expect(summary?.getAttribute('data-ok')).not.toBeNull();
  });

  it('summary shows correct counts: 1 ok (cover has text) for new project', () => {
    const { container } = render(React.createElement(PagePanel)); const _toggle = container.querySelector("[data-testid=\"page-panel-view-toggle\"]"); if (_toggle) fireEvent.click(_toggle);
    const summary = container.querySelector('[data-testid="page-panel-summary"]');
    // newProject creates a cover page with text title → 1 ok
    expect(summary?.getAttribute('data-ok')).toBe('1');
    expect(summary?.getAttribute('data-warning')).toBe('0');
    expect(summary?.getAttribute('data-error')).toBe('0');
  });

  it('summary shows "Semua lengkap" when allOk', () => {
    const { container } = render(React.createElement(PagePanel)); const _toggle = container.querySelector("[data-testid=\"page-panel-view-toggle\"]"); if (_toggle) fireEvent.click(_toggle);
    const allOk = container.querySelector('.page-panel__summary-all-ok');
    expect(allOk).not.toBeNull();
    expect(allOk?.textContent).toMatch(/Semua lengkap/);
  });

  it('each page item has a status badge', () => {
    const { container } = render(React.createElement(PagePanel)); const _toggle = container.querySelector("[data-testid=\"page-panel-view-toggle\"]"); if (_toggle) fireEvent.click(_toggle);
    const badges = container.querySelectorAll('.page-status-badge');
    expect(badges.length).toBeGreaterThan(0);
    // Cover (with text) should have ok badge
    const coverItem = container.querySelector('[data-role="cover"]');
    const coverBadge = coverItem?.querySelector('.page-status-badge');
    expect(coverBadge?.getAttribute('data-level')).toBe('ok');
  });

  it('page with warning shows ⚠ badge with data-level=warning', () => {
    useEditorStore.getState().addPage({ role: 'material' }); // empty material → warning + error
    const { container } = render(React.createElement(PagePanel)); const _toggle = container.querySelector("[data-testid=\"page-panel-view-toggle\"]"); if (_toggle) fireEvent.click(_toggle);
    const materialItem = container.querySelector('[data-role="material"]');
    const badge = materialItem?.querySelector('.page-status-badge');
    expect(badge).not.toBeNull();
    // Empty material → both error (no content) and warning (no nav) → level=error (precedence)
    expect(['warning', 'error']).toContain(badge?.getAttribute('data-level'));
  });

  it('page with error shows ✗ badge with data-level=error', () => {
    useEditorStore.getState().addPage({ role: 'quiz' }); // empty quiz → error (no question)
    const { container } = render(React.createElement(PagePanel)); const _toggle = container.querySelector("[data-testid=\"page-panel-view-toggle\"]"); if (_toggle) fireEvent.click(_toggle);
    const quizItem = container.querySelector('[data-role="quiz"]');
    const badge = quizItem?.querySelector('.page-status-badge');
    expect(badge?.getAttribute('data-level')).toBe('error');
  });

  it('page item data-status attribute reflects status level', () => {
    useEditorStore.getState().addPage({ role: 'quiz' }); // empty quiz → error
    const { container } = render(React.createElement(PagePanel)); const _toggle = container.querySelector("[data-testid=\"page-panel-view-toggle\"]"); if (_toggle) fireEvent.click(_toggle);
    const quizItem = container.querySelector('[data-role="quiz"]');
    expect(quizItem?.getAttribute('data-status')).toBe('error');
  });

  it('active page with issues shows inline issue list by default', () => {
    useEditorStore.getState().addPage({ role: 'quiz' }); // empty quiz → error
    // Now active page is the quiz page
    const { container } = render(React.createElement(PagePanel)); const _toggle = container.querySelector("[data-testid=\"page-panel-view-toggle\"]"); if (_toggle) fireEvent.click(_toggle);
    const quizItem = container.querySelector('[data-role="quiz"]')!;
    const issueList = quizItem.querySelector('[class*="page-item__issues"]');
    // Should render inline issues (not collapsed by default on active page)
    expect(issueList).not.toBeNull();
  });

  it('issue toggle button allows collapse/expand', () => {
    useEditorStore.getState().addPage({ role: 'quiz' }); // has issues
    const { container } = render(React.createElement(PagePanel)); const _toggle = container.querySelector("[data-testid=\"page-panel-view-toggle\"]"); if (_toggle) fireEvent.click(_toggle);
    const quizItem = container.querySelector('[data-role="quiz"]')!;
    const toggle = quizItem.querySelector('[data-testid^="page-issue-toggle-"]') as HTMLButtonElement;
    expect(toggle).not.toBeNull();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(toggle);
    // After click, issues should be collapsed (toggle re-render)
    const toggleAfter = container.querySelector('[data-testid^="page-issue-toggle-"]') as HTMLButtonElement;
    expect(toggleAfter.getAttribute('aria-expanded')).toBe('false');
  });

  it('badge tooltip contains issue messages (title attr)', () => {
    useEditorStore.getState().addPage({ role: 'quiz' }); // empty quiz → error
    const { container } = render(React.createElement(PagePanel)); const _toggle = container.querySelector("[data-testid=\"page-panel-view-toggle\"]"); if (_toggle) fireEvent.click(_toggle);
    const quizItem = container.querySelector('[data-role="quiz"]')!;
    const badge = quizItem.querySelector('.page-status-badge') as HTMLElement;
    const tooltip = badge.getAttribute('title') ?? '';
    expect(tooltip).toMatch(/pertanyaan/i);
  });

  it('badge shows count when more than 1 issue', () => {
    // Material page with no content AND no nav → 1 error + 1 warning = 2 issues
    useEditorStore.getState().addPage({ role: 'material' });
    const { container } = render(React.createElement(PagePanel)); const _toggle = container.querySelector("[data-testid=\"page-panel-view-toggle\"]"); if (_toggle) fireEvent.click(_toggle);
    const materialItem = container.querySelector('[data-role="material"]')!;
    const badge = materialItem.querySelector('.page-status-badge') as HTMLElement;
    expect(badge.getAttribute('data-issue-count')).toBe('2');
    const count = badge.querySelector('.page-status-badge__count');
    expect(count).not.toBeNull();
  });

  it('sample PPKn: all 10 pages have ok badge (data-level=ok)', () => {
    useEditorStore.getState().setProject(createSamplePpknProject());
    const { container } = render(React.createElement(PagePanel)); const _toggle = container.querySelector("[data-testid=\"page-panel-view-toggle\"]"); if (_toggle) fireEvent.click(_toggle);
    const badges = container.querySelectorAll('.page-status-badge');
    expect(badges.length).toBe(10);
    for (const b of badges) {
      expect(b.getAttribute('data-level')).toBe('ok');
    }
    // Summary should show allOk
    const allOk = container.querySelector('.page-panel__summary-all-ok');
    expect(allOk).not.toBeNull();
  });

  it('summary updates when issues are fixed (status is reactive)', () => {
    useEditorStore.getState().addPage({ role: 'quiz' }); // creates empty quiz → error
    const { container: c1 } = render(React.createElement(PagePanel));
    expect(c1.querySelector('[data-testid="page-panel-summary"]')?.getAttribute('data-error')).toBe('1');

    // Add a question to fix the error
    const state = useEditorStore.getState();
    const quizPage = state.project.pages.find((p) => p.role === 'quiz')!;
    useEditorStore.getState().selectPage(quizPage.id);
    useEditorStore.getState().addQuestionComponent();
    // addQuestionComponent creates a question with empty feedback → still warning (not error)
    const { container: c2 } = render(React.createElement(PagePanel));
    const summaryAfter = c2.querySelector('[data-testid="page-panel-summary"]');
    expect(summaryAfter?.getAttribute('data-error')).toBe('0');
    // Should now have a warning (empty feedback) — but also navigation missing
    const warningCount = parseInt(summaryAfter?.getAttribute('data-warning') ?? '0', 10);
    expect(warningCount).toBeGreaterThan(0);
  });
});

// =========================================================================
// Regression — PagePanel still respects M3 contracts + no block
// =========================================================================

describe('UX-02 — PagePanel regression (no contract break)', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('still has rename/duplikat/hapus buttons with correct title attrs', () => {
    useEditorStore.getState().addPage();
    useEditorStore.getState().selectPage(useEditorStore.getState().project.pages[0].id);
    const { container } = render(React.createElement(PagePanel)); const _toggle = container.querySelector("[data-testid=\"page-panel-view-toggle\"]"); if (_toggle) fireEvent.click(_toggle);
    expect(container.querySelectorAll('[title="Ganti nama halaman"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[title="Duplikat halaman"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[title="Hapus halaman"]').length).toBeGreaterThan(0);
  });

  it('still has + Tambah Halaman button', () => {
    const { container } = render(React.createElement(PagePanel)); const _toggle = container.querySelector("[data-testid=\"page-panel-view-toggle\"]"); if (_toggle) fireEvent.click(_toggle);
    expect(container.querySelectorAll('[title="Tambah halaman"]').length).toBe(1);
  });

  it('does NOT contain "block" in user-facing text', () => {
    const { container } = render(React.createElement(PagePanel)); const _toggle = container.querySelector("[data-testid=\"page-panel-view-toggle\"]"); if (_toggle) fireEvent.click(_toggle);
    expect(container.textContent ?? '').not.toMatch(/\bblock\b/i);
  });

  it('still shows section labels Pembukaan/Inti/Penutup for sample PPKn', () => {
    useEditorStore.getState().setProject(createSamplePpknProject());
    const { container } = render(React.createElement(PagePanel)); const _toggle = container.querySelector("[data-testid=\"page-panel-view-toggle\"]"); if (_toggle) fireEvent.click(_toggle);
    expect(container.querySelector('[data-testid="page-panel-section-pembukaan"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="page-panel-section-inti"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="page-panel-section-penutup"]')).not.toBeNull();
  });
});
