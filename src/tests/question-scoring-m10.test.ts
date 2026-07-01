/**
 * Tests for M10 — Question + Scoring Style.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import { Toolbar } from '../editor/Toolbar';
import { createQuestionComponent } from '../core/component-factory';
import { canAddComponent } from '../core/capability';
import { validateComponent, isValidComponent } from '../core/validation';
import { useEditorStore } from '../store/editor-store';
import { usePreviewStore } from '../preview/preview-store';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC_DIR = resolve(__dirname, '..');

// Mock localStorage
const mockStore: Record<string, string> = {};
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => mockStore[k] ?? null,
  setItem: (k: string, v: string) => { mockStore[k] = v; },
  removeItem: (k: string) => { delete mockStore[k]; },
};

// =========================================================================
// Question validation
// =========================================================================

describe('M10 — question validation', () => {
  it('valid question component passes validation', () => {
    const q = createQuestionComponent();
    expect(validateComponent(q).ok).toBe(true);
    expect(isValidComponent(q)).toBe(true);
  });

  it('rejects invalid correctChoiceIndex', () => {
    const q = createQuestionComponent({ correctChoiceIndex: 99 });
    expect(validateComponent(q).ok).toBe(false);
  });

  it('rejects empty prompt', () => {
    const q = createQuestionComponent({ prompt: '' });
    expect(validateComponent(q).ok).toBe(false);
  });

  it('rejects invalid variant', () => {
    const q = createQuestionComponent();
    const broken = { ...q, variant: 'invalid' };
    expect(validateComponent(broken).ok).toBe(false);
  });

  it('rejects invalid scoringStyle', () => {
    const q = createQuestionComponent();
    const broken = { ...q, scoringStyle: 'invalid' };
    expect(validateComponent(broken).ok).toBe(false);
  });

  it('rejects negative points', () => {
    const q = createQuestionComponent({ points: -5 });
    expect(validateComponent(q).ok).toBe(false);
  });

  it('trueFalse requires exactly 2 choices', () => {
    const q = createQuestionComponent({
      variant: 'trueFalse',
      choices: [
        { id: 'a', text: 'Benar' },
        { id: 'b', text: 'Salah' },
      ],
    });
    expect(validateComponent(q).ok).toBe(true);

    const q3 = createQuestionComponent({
      variant: 'trueFalse',
      choices: [
        { id: 'a', text: 'A' },
        { id: 'b', text: 'B' },
        { id: 'c', text: 'C' },
      ],
    });
    expect(validateComponent(q3).ok).toBe(false);
  });
});

// =========================================================================
// Capability matrix
// =========================================================================

describe('M10 — capability matrix', () => {
  it('quiz allows question', () => {
    expect(canAddComponent('quiz', 'question')).toBe(true);
  });

  it('free allows question', () => {
    expect(canAddComponent('free', 'question')).toBe(true);
  });

  it('cover denies question', () => {
    expect(canAddComponent('cover', 'question')).toBe(false);
  });

  it('material denies question', () => {
    expect(canAddComponent('material', 'question')).toBe(false);
  });

  it('activity denies question', () => {
    expect(canAddComponent('activity', 'question')).toBe(false);
  });

  it('starter denies question', () => {
    expect(canAddComponent('starter', 'question')).toBe(false);
  });
});

// =========================================================================
// Store operations
// =========================================================================

describe('M10 — store operations', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('addQuestionComponent on quiz succeeds', () => {
    const store = useEditorStore.getState();
    store.addPage({ role: 'quiz' });
    const id = store.addQuestionComponent();
    expect(id).not.toBeNull();
    const { project } = useEditorStore.getState();
    const comp = project.pages[1].components[0];
    expect(comp.type).toBe('question');
  });

  it('addQuestionComponent on cover returns null', () => {
    const store = useEditorStore.getState();
    const id = store.addQuestionComponent();
    expect(id).toBeNull();
  });

  it('addQuestionComponent on material returns null', () => {
    const store = useEditorStore.getState();
    store.addPage({ role: 'material' });
    const id = store.addQuestionComponent();
    expect(id).toBeNull();
  });

  it('updateQuestionComponent works', () => {
    const store = useEditorStore.getState();
    store.addPage({ role: 'quiz' });
    const id = store.addQuestionComponent()!;
    store.updateQuestionComponent(id, { prompt: 'New prompt', points: 20 });
    const { project } = useEditorStore.getState();
    const comp = project.pages[1].components[0] as { prompt: string; points: number };
    expect(comp.prompt).toBe('New prompt');
    expect(comp.points).toBe(20);
  });

  it('duplicatePage regenerates question id', () => {
    const store = useEditorStore.getState();
    store.addPage({ role: 'quiz' });
    const qId = store.addQuestionComponent()!;
    const pageId = useEditorStore.getState().project.currentPageId;

    const copyId = store.duplicatePage(pageId)!;
    const { project } = useEditorStore.getState();
    const copy = project.pages.find((p) => p.id === copyId)!;
    const copyQ = copy.components[0] as { id: string; type: string };
    expect(copyQ.id).not.toBe(qId);
    expect(copyQ.type).toBe('question');
  });

  it('store EXPOSES addQuestionComponent + updateQuestionComponent', () => {
    expect(typeof useEditorStore.getState().addQuestionComponent).toBe('function');
    expect(typeof useEditorStore.getState().updateQuestionComponent).toBe('function');
  });

  it('store does NOT expose game/setPageRole/style editor', () => {
    const s = useEditorStore.getState() as Record<string, unknown>;
    expect(s.addGame).toBeUndefined();
    expect(s.setPageRole).toBeUndefined();
    expect(s.openStyleEditor).toBeUndefined();
  });
});

// =========================================================================
// Preview runtime
// =========================================================================

describe('M10 — preview question runtime', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
    usePreviewStore.getState().closePreview();
  });

  it('answerQuestion sets selectedChoiceIndex + isAnswered', () => {
    usePreviewStore.getState().openPreview();
    usePreviewStore.getState().answerQuestion('q1', 0, 0, 10);
    const state = usePreviewStore.getState();
    expect(state.questionAnswers['q1']).toBeDefined();
    expect(state.questionAnswers['q1'].selectedChoiceIndex).toBe(0);
    expect(state.questionAnswers['q1'].isAnswered).toBe(true);
  });

  it('correct answer adds score once', () => {
    usePreviewStore.getState().openPreview();
    usePreviewStore.getState().answerQuestion('q1', 0, 0, 10);
    expect(usePreviewStore.getState().totalScore).toBe(10);
    // Answer again — should NOT add score again
    usePreviewStore.getState().answerQuestion('q1', 1, 0, 10);
    expect(usePreviewStore.getState().totalScore).toBe(10);
  });

  it('wrong answer does not add score', () => {
    usePreviewStore.getState().openPreview();
    usePreviewStore.getState().answerQuestion('q1', 1, 0, 10);
    expect(usePreviewStore.getState().totalScore).toBe(0);
  });

  it('resetQuestion clears answer state', () => {
    usePreviewStore.getState().openPreview();
    usePreviewStore.getState().answerQuestion('q1', 0, 0, 10);
    usePreviewStore.getState().resetQuestion('q1');
    expect(usePreviewStore.getState().questionAnswers['q1']).toBeUndefined();
  });
});

// =========================================================================
// Answer option UX lock
// =========================================================================

describe('M10 — answer option UX lock (no clipping)', () => {
  it('QuestionComponentView does NOT use white-space: nowrap', () => {
    const content = readFileSync(resolve(SRC_DIR, 'components/QuestionComponentView.tsx'), 'utf8');
    expect(content).not.toMatch(/whiteSpace:\s*['"]nowrap['"]/);
  });

  it('QuestionComponentView does NOT use text-overflow: ellipsis', () => {
    const content = readFileSync(resolve(SRC_DIR, 'components/QuestionComponentView.tsx'), 'utf8');
    expect(content).not.toMatch(/ellipsis/);
  });

  it('QuestionComponentView uses overflowWrap: anywhere or break-word', () => {
    const content = readFileSync(resolve(SRC_DIR, 'components/QuestionComponentView.tsx'), 'utf8');
    expect(content).toMatch(/overflowWrap.*anywhere|wordBreak.*break-word/);
  });

  it('QuestionComponentView uses minHeight (not fixed height only)', () => {
    const content = readFileSync(resolve(SRC_DIR, 'components/QuestionComponentView.tsx'), 'utf8');
    expect(content).toMatch(/minHeight/);
  });
});

// =========================================================================
// UI checks
// =========================================================================

describe('M10 — UI checks', () => {
  it('Toolbar has + Pertanyaan button (UX-01 Patch-2: inside Tambah Elemen dropdown)', () => {
    const content = readFileSync(resolve(SRC_DIR, 'editor/Toolbar.tsx'), 'utf8');
    // UX-01: button spec is centralized — verify the action 'add-question' is declared.
    expect(content).toMatch(/action:\s*['"]add-question['"]/);
    // UX-01 Patch-2: button is inside a dropdown — open it first, then check.
    useEditorStore.getState().newProject();
    useEditorStore.getState().addPage(); // free page so dropdown is enabled
    const { container } = render(React.createElement(Toolbar));
    const addToggle = container.querySelector('[data-testid="toolbar-add"]') as HTMLButtonElement;
    expect(addToggle).not.toBeNull();
    fireEvent.click(addToggle);
    const btn = container.querySelector('[data-action="add-question"]');
    expect(btn).not.toBeNull();
    expect(btn?.textContent ?? '').toMatch(/Pertanyaan/);
  });

  it('Toolbar + Pertanyaan hidden on cover (UX-01 Patch-2: capability denied → button filtered out)', () => {
    const content = readFileSync(resolve(SRC_DIR, 'editor/Toolbar.tsx'), 'utf8');
    // UX-01 Patch-2: capability check is done via canAddComponent(role, spec.capability)
    // in the filter. Disallowed buttons are not rendered at all.
    expect(content).toMatch(/canAddComponent/);
    // Verify on cover: + Tambah Elemen toggle is disabled (cover is guided).
    useEditorStore.getState().newProject();
    const { container } = render(React.createElement(Toolbar));
    const addToggle = container.querySelector('[data-testid="toolbar-add"]') as HTMLButtonElement;
    expect(addToggle.disabled).toBe(true);
  });

  it('UI does NOT contain "block"', () => {
    const content = readFileSync(resolve(SRC_DIR, 'editor/Toolbar.tsx'), 'utf8');
    expect(content).not.toMatch(/\bblock\b/i);
  });
});

// =========================================================================
// ESM guard
// =========================================================================

describe('M10 — ESM guard', () => {
  it('QuestionComponentView does not use CommonJS dynamic require', () => {
    const content = readFileSync(resolve(SRC_DIR, 'components/QuestionComponentView.tsx'), 'utf8');
    expect(content).not.toMatch(/\brequire\s*\(/);
  });
});
