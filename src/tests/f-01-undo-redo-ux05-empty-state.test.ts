/**
 * F-01: Undo/Redo System + UX-05: Smart Empty State.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

import {
  recordSnapshot,
  undo,
  redo,
  canUndo,
  canRedo,
  clearHistory,
  initHistory,
} from '../store/undo-redo';
import { useEditorStore } from '../store/editor-store';
import { createSamplePpknProject } from '../core/sample-project';

// ---------------------------------------------------------------------------
// F-01: Undo/Redo System
// ---------------------------------------------------------------------------

describe('F-01: Undo/Redo System', () => {
  beforeEach(() => {
    useEditorStore.setState({ project: createSamplePpknProject(), selectedComponentId: null });
    clearHistory();
    initHistory();
  });

  it('1. canUndo returns false initially (no history)', () => {
    expect(canUndo()).toBe(false);
  });

  it('2. canRedo returns false initially', () => {
    expect(canRedo()).toBe(false);
  });

  it('3. recordSnapshot + mutation → canUndo returns true', () => {
    recordSnapshot();
    useEditorStore.getState().setProjectTitle('Changed Title');
    expect(canUndo()).toBe(true);
  });

  it('4. undo restores previous state', () => {
    const originalTitle = useEditorStore.getState().project.title;
    recordSnapshot();
    useEditorStore.getState().setProjectTitle('Changed');
    expect(useEditorStore.getState().project.title).toBe('Changed');

    undo();
    expect(useEditorStore.getState().project.title).toBe(originalTitle);
  });

  it('5. redo restores undone state', () => {
    recordSnapshot();
    useEditorStore.getState().setProjectTitle('Changed');
    undo();
    expect(canRedo()).toBe(true);

    redo();
    expect(useEditorStore.getState().project.title).toBe('Changed');
  });

  it('6. new action after undo clears redo stack', () => {
    recordSnapshot();
    useEditorStore.getState().setProjectTitle('First Change');
    undo();
    expect(canRedo()).toBe(true);

    recordSnapshot();
    useEditorStore.getState().setProjectTitle('Second Change');
    expect(canRedo()).toBe(false); // redo stack cleared
  });

  it('7. clearHistory resets all stacks', () => {
    recordSnapshot();
    useEditorStore.getState().setProjectTitle('Changed');
    clearHistory();
    expect(canUndo()).toBe(false);
    expect(canRedo()).toBe(false);
  });

  it('8. initHistory sets present without clearing (fresh start)', () => {
    const title = useEditorStore.getState().project.title;
    initHistory();
    // After init, undo should not be available (no past)
    expect(canUndo()).toBe(false);
    expect(useEditorStore.getState().project.title).toBe(title);
  });

  it('9. undo with empty past does nothing', () => {
    const title = useEditorStore.getState().project.title;
    undo(); // No past — should not crash or change anything
    expect(useEditorStore.getState().project.title).toBe(title);
  });

  it('10. redo with empty future does nothing', () => {
    const title = useEditorStore.getState().project.title;
    redo(); // No future
    expect(useEditorStore.getState().project.title).toBe(title);
  });

  it('11. multiple undos work in sequence', () => {
    const original = useEditorStore.getState().project.title;

    recordSnapshot();
    useEditorStore.getState().setProjectTitle('Change 1');

    recordSnapshot();
    useEditorStore.getState().setProjectTitle('Change 2');

    undo(); // → Change 1
    expect(useEditorStore.getState().project.title).toBe('Change 1');

    undo(); // → original
    expect(useEditorStore.getState().project.title).toBe(original);
  });
});

// ---------------------------------------------------------------------------
// F-01: Topbar Undo/Redo buttons (behavior test)
// ---------------------------------------------------------------------------

describe('F-01: Topbar Undo/Redo buttons', () => {
  beforeEach(() => {
    useEditorStore.setState({ project: createSamplePpknProject(), selectedComponentId: null });
    clearHistory();
    initHistory();
  });

  it('12. Topbar renders Undo button', async () => {
    const { Topbar } = await import('../editor/Topbar');
    const { container } = render(React.createElement(Topbar));
    expect(container.querySelector('[data-testid="topbar-undo"]')).not.toBeNull();
  });

  it('13. Topbar renders Redo button', async () => {
    const { Topbar } = await import('../editor/Topbar');
    const { container } = render(React.createElement(Topbar));
    expect(container.querySelector('[data-testid="topbar-redo"]')).not.toBeNull();
  });

  it('14. Undo button text contains "Batal"', async () => {
    const { Topbar } = await import('../editor/Topbar');
    const { container } = render(React.createElement(Topbar));
    const btn = container.querySelector('[data-testid="topbar-undo"]');
    expect(btn?.textContent).toContain('Batal');
  });

  it('15. Redo button text contains "Ulangi"', async () => {
    const { Topbar } = await import('../editor/Topbar');
    const { container } = render(React.createElement(Topbar));
    const btn = container.querySelector('[data-testid="topbar-redo"]');
    expect(btn?.textContent).toContain('Ulangi');
  });
});

// ---------------------------------------------------------------------------
// UX-05: Smart Empty State
// ---------------------------------------------------------------------------

describe('UX-05: Smart Empty State (Inspector)', () => {
  it('16. Inspector shows empty state with tips when no page selected', async () => {
    const { Inspector } = await import('../editor/Inspector');
    // Set project with no current page
    useEditorStore.setState({
      project: {
        ...createSamplePpknProject(),
        currentPageId: 'non-existent',
      },
      selectedComponentId: null,
    });
    const { container } = render(React.createElement(Inspector));
    const emptyState = container.querySelector('[data-testid="inspector-empty-state"]');
    expect(emptyState).not.toBeNull();
    expect(emptyState?.textContent).toContain('Belum ada halaman dipilih');
  });

  it('17. Empty state contains actionable tips', async () => {
    const { Inspector } = await import('../editor/Inspector');
    useEditorStore.setState({
      project: {
        ...createSamplePpknProject(),
        currentPageId: 'non-existent',
      },
      selectedComponentId: null,
    });
    const { container } = render(React.createElement(Inspector));
    const emptyState = container.querySelector('[data-testid="inspector-empty-state"]');
    expect(emptyState?.textContent).toContain('Template Pedagogis');
    expect(emptyState?.textContent).toContain('Import dari AI');
  });
});
