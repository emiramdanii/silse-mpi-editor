/**
 * V2-PILAR-2.5 Commit 2: Tests for Bulk Action Linker (multi-select).
 *
 * Coverage:
 *   1. Store: selectedComponentIds state + toggleComponentInSelection
 *   2. Store: selectComponentRange (Shift+Click)
 *   3. Store: clearSelection
 *   4. Store: bulkDeleteComponents
 *   5. Backward compat: selectedComponentId stays in sync with selectedComponentIds
 *   6. Inspector: bulk-edit panel renders when multi-select
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { useEditorStore } from '../store/editor-store';
import { Inspector } from '../editor/Inspector';

// Helper: buat project dengan multiple components di free page
function setupMultiComponentPage() {
  useEditorStore.getState().resetProject();
  const store = useEditorStore.getState();
  store.addPage({ role: 'free', title: 'Test Slide' });
  // Add 3 text components
  const id1 = store.addTextComponent({ text: 'Comp 1' });
  const id2 = store.addTextComponent({ text: 'Comp 2' });
  const id3 = store.addTextComponent({ text: 'Comp 3' });
  // Clear selection so tests start fresh
  store.clearSelection();
  return { id1, id2, id3 };
}

// ---------------------------------------------------------------------------
// 1. Store: selectedComponentIds + toggleComponentInSelection
// ---------------------------------------------------------------------------

describe('V2-PILAR-2.5 — toggleComponentInSelection', () => {
  beforeEach(() => {
    useEditorStore.getState().resetProject();
  });

  it('1. store exposes selectedComponentIds as array', () => {
    expect(Array.isArray(useEditorStore.getState().selectedComponentIds)).toBe(true);
  });

  it('2. store exposes toggleComponentInSelection as function', () => {
    expect(typeof useEditorStore.getState().toggleComponentInSelection).toBe('function');
  });

  it('3. toggleComponentInSelection adds component to selection', () => {
    const { id1 } = setupMultiComponentPage();
    useEditorStore.getState().toggleComponentInSelection(id1!);
    expect(useEditorStore.getState().selectedComponentIds).toContain(id1);
    expect(useEditorStore.getState().selectedComponentIds).toHaveLength(1);
  });

  it('4. toggleComponentInSelection removes component from selection', () => {
    const { id1, id2 } = setupMultiComponentPage();
    useEditorStore.getState().toggleComponentInSelection(id1!);
    useEditorStore.getState().toggleComponentInSelection(id2!);
    expect(useEditorStore.getState().selectedComponentIds).toHaveLength(2);
    // Toggle off id1
    useEditorStore.getState().toggleComponentInSelection(id1!);
    expect(useEditorStore.getState().selectedComponentIds).not.toContain(id1);
    expect(useEditorStore.getState().selectedComponentIds).toHaveLength(1);
  });

  it('5. multiple toggles accumulate in selectedComponentIds', () => {
    const { id1, id2, id3 } = setupMultiComponentPage();
    useEditorStore.getState().toggleComponentInSelection(id1!);
    useEditorStore.getState().toggleComponentInSelection(id2!);
    useEditorStore.getState().toggleComponentInSelection(id3!);
    expect(useEditorStore.getState().selectedComponentIds).toHaveLength(3);
    expect(useEditorStore.getState().selectedComponentIds).toEqual([id1, id2, id3]);
  });
});

// ---------------------------------------------------------------------------
// 2. Store: selectComponentRange (Shift+Click)
// ---------------------------------------------------------------------------

describe('V2-PILAR-2.5 — selectComponentRange', () => {
  beforeEach(() => {
    useEditorStore.getState().resetProject();
  });

  it('6. store exposes selectComponentRange as function', () => {
    expect(typeof useEditorStore.getState().selectComponentRange).toBe('function');
  });

  it('7. selectComponentRange selects all components between two IDs', () => {
    const { id1, id2, id3 } = setupMultiComponentPage();
    useEditorStore.getState().selectComponentRange(id1!, id3!);
    expect(useEditorStore.getState().selectedComponentIds).toHaveLength(3);
    expect(useEditorStore.getState().selectedComponentIds).toContain(id1);
    expect(useEditorStore.getState().selectedComponentIds).toContain(id2);
    expect(useEditorStore.getState().selectedComponentIds).toContain(id3);
  });

  it('8. selectComponentRange works in reverse order (id3 to id1)', () => {
    const { id1, id3 } = setupMultiComponentPage();
    useEditorStore.getState().selectComponentRange(id3!, id1!);
    expect(useEditorStore.getState().selectedComponentIds).toHaveLength(3);
  });

  it('9. selectComponentRange with adjacent IDs selects 2 components', () => {
    const { id1, id2 } = setupMultiComponentPage();
    useEditorStore.getState().selectComponentRange(id1!, id2!);
    expect(useEditorStore.getState().selectedComponentIds).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// 3. Store: clearSelection
// ---------------------------------------------------------------------------

describe('V2-PILAR-2.5 — clearSelection', () => {
  beforeEach(() => {
    useEditorStore.getState().resetProject();
  });

  it('10. store exposes clearSelection as function', () => {
    expect(typeof useEditorStore.getState().clearSelection).toBe('function');
  });

  it('11. clearSelection empties selectedComponentIds', () => {
    const { id1, id2 } = setupMultiComponentPage();
    useEditorStore.getState().toggleComponentInSelection(id1!);
    useEditorStore.getState().toggleComponentInSelection(id2!);
    expect(useEditorStore.getState().selectedComponentIds).toHaveLength(2);
    useEditorStore.getState().clearSelection();
    expect(useEditorStore.getState().selectedComponentIds).toHaveLength(0);
  });

  it('12. clearSelection sets selectedComponentId to null', () => {
    const { id1 } = setupMultiComponentPage();
    useEditorStore.getState().selectComponent(id1);
    expect(useEditorStore.getState().selectedComponentId).toBe(id1);
    useEditorStore.getState().clearSelection();
    expect(useEditorStore.getState().selectedComponentId).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 4. Store: bulkDeleteComponents
// ---------------------------------------------------------------------------

describe('V2-PILAR-2.5 — bulkDeleteComponents', () => {
  beforeEach(() => {
    useEditorStore.getState().resetProject();
  });

  it('13. store exposes bulkDeleteComponents as function', () => {
    expect(typeof useEditorStore.getState().bulkDeleteComponents).toBe('function');
  });

  it('14. bulkDeleteComponents removes multiple components', () => {
    const { id1, id2, id3 } = setupMultiComponentPage();
    useEditorStore.getState().bulkDeleteComponents([id1!, id3!]);
    const project = useEditorStore.getState().project;
    const page = project.pages.find((p) => p.id === project.currentPageId)!;
    expect(page.components).toHaveLength(1);
    expect(page.components[0].id).toBe(id2);
  });

  it('15. bulkDeleteComponents clears selection after delete', () => {
    const { id1, id2 } = setupMultiComponentPage();
    useEditorStore.getState().toggleComponentInSelection(id1!);
    useEditorStore.getState().toggleComponentInSelection(id2!);
    useEditorStore.getState().bulkDeleteComponents([id1!, id2!]);
    expect(useEditorStore.getState().selectedComponentIds).toHaveLength(0);
    expect(useEditorStore.getState().selectedComponentId).toBeNull();
  });

  it('16. bulkDeleteComponents with empty array is no-op', () => {
    setupMultiComponentPage();
    const before = useEditorStore.getState().project;
    useEditorStore.getState().bulkDeleteComponents([]);
    const after = useEditorStore.getState().project;
    // Same number of components
    const beforePage = before.pages.find((p) => p.id === before.currentPageId)!;
    const afterPage = after.pages.find((p) => p.id === after.currentPageId)!;
    expect(afterPage.components.length).toBe(beforePage.components.length);
  });
});

// ---------------------------------------------------------------------------
// 5. Backward compat: selectedComponentId stays in sync
// ---------------------------------------------------------------------------

describe('V2-PILAR-2.5 — Backward compat: selectedComponentId sync', () => {
  beforeEach(() => {
    useEditorStore.getState().resetProject();
  });

  it('17. selectComponent sets both selectedComponentId and selectedComponentIds', () => {
    const { id1 } = setupMultiComponentPage();
    useEditorStore.getState().selectComponent(id1);
    expect(useEditorStore.getState().selectedComponentId).toBe(id1);
    expect(useEditorStore.getState().selectedComponentIds).toEqual([id1]);
  });

  it('18. toggleComponentInSelection with 1 component sets selectedComponentId', () => {
    const { id1 } = setupMultiComponentPage();
    useEditorStore.getState().toggleComponentInSelection(id1!);
    expect(useEditorStore.getState().selectedComponentId).toBe(id1);
  });

  it('19. toggleComponentInSelection with 2+ components sets selectedComponentId to null', () => {
    const { id1, id2 } = setupMultiComponentPage();
    useEditorStore.getState().toggleComponentInSelection(id1!);
    useEditorStore.getState().toggleComponentInSelection(id2!);
    expect(useEditorStore.getState().selectedComponentId).toBeNull();
  });

  it('20. toggleComponentInSelection back to 1 sets selectedComponentId', () => {
    const { id1, id2 } = setupMultiComponentPage();
    useEditorStore.getState().toggleComponentInSelection(id1!);
    useEditorStore.getState().toggleComponentInSelection(id2!);
    expect(useEditorStore.getState().selectedComponentId).toBeNull();
    // Remove id2, back to 1
    useEditorStore.getState().toggleComponentInSelection(id2!);
    expect(useEditorStore.getState().selectedComponentId).toBe(id1);
  });

  it('21. selectComponent(null) clears both fields', () => {
    const { id1 } = setupMultiComponentPage();
    useEditorStore.getState().selectComponent(id1);
    useEditorStore.getState().selectComponent(null);
    expect(useEditorStore.getState().selectedComponentId).toBeNull();
    expect(useEditorStore.getState().selectedComponentIds).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 6. Inspector: bulk-edit panel
// ---------------------------------------------------------------------------

describe('V2-PILAR-2.5 — Inspector bulk-edit panel', () => {
  beforeEach(() => {
    useEditorStore.getState().resetProject();
  });

  it('22. Inspector shows bulk-edit panel when 2+ components selected', () => {
    const { id1, id2 } = setupMultiComponentPage();
    useEditorStore.getState().toggleComponentInSelection(id1!);
    useEditorStore.getState().toggleComponentInSelection(id2!);
    
    const { container } = render(React.createElement(Inspector));
    expect(container.querySelector('[data-testid="inspector-bulk-edit"]')).not.toBeNull();
  });

  it('23. Inspector does NOT show bulk-edit when 0 or 1 component selected', () => {
    setupMultiComponentPage();
    
    const { container } = render(React.createElement(Inspector));
    expect(container.querySelector('[data-testid="inspector-bulk-edit"]')).toBeNull();
  });

  it('24. bulk-edit panel shows count of selected components', () => {
    const { id1, id2, id3 } = setupMultiComponentPage();
    useEditorStore.getState().toggleComponentInSelection(id1!);
    useEditorStore.getState().toggleComponentInSelection(id2!);
    useEditorStore.getState().toggleComponentInSelection(id3!);
    
    const { container } = render(React.createElement(Inspector));
    expect(container.textContent).toContain('3 Komponen Terpilih');
  });

  it('25. bulk-edit panel has delete button', () => {
    const { id1, id2 } = setupMultiComponentPage();
    useEditorStore.getState().toggleComponentInSelection(id1!);
    useEditorStore.getState().toggleComponentInSelection(id2!);
    
    const { container } = render(React.createElement(Inspector));
    expect(container.querySelector('[data-testid="inspector-bulk-delete"]')).not.toBeNull();
  });

  it('26. bulk-edit panel has clear selection button', () => {
    const { id1, id2 } = setupMultiComponentPage();
    useEditorStore.getState().toggleComponentInSelection(id1!);
    useEditorStore.getState().toggleComponentInSelection(id2!);
    
    const { container } = render(React.createElement(Inspector));
    expect(container.querySelector('[data-testid="inspector-bulk-clear"]')).not.toBeNull();
  });
});
