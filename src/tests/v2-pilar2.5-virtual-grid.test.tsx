/**
 * V2-PILAR-2.5 Commit 4: Tests for Virtual Canvas Space & Grid Overlay.
 *
 * Coverage:
 *   1. snapToGridWithTolerance — math logic (within tolerance → snap, outside → free)
 *   2. snapRectToGridWithTolerance — rect-level snap
 *   3. Store: setGlobalSlideSettings with editorGrid
 *   4. DEFAULT_GLOBAL_SLIDE_SETTINGS has editorGrid with correct defaults
 *   5. Grid config does NOT auto-adjust existing components (passive)
 *   6. SlideSettingsDialog: editor grid controls render + function
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import {
  snapToGridWithTolerance,
  snapRectToGridWithTolerance,
} from '../core/geometry';
import { useEditorStore } from '../store/editor-store';
import {
  createProject,
  DEFAULT_GLOBAL_SLIDE_SETTINGS,
  getEffectiveGlobalSlideSettings,
} from '../core/project-factory';
import { SlideSettingsDialog } from '../editor/SlideSettingsDialog';

// ---------------------------------------------------------------------------
// 1. snapToGridWithTolerance — math logic
// ---------------------------------------------------------------------------

describe('V2-PILAR-2.5 — snapToGridWithTolerance', () => {
  it('1. value exactly on grid returns grid value', () => {
    expect(snapToGridWithTolerance(100, 50, 6)).toBe(100);
    expect(snapToGridWithTolerance(50, 50, 6)).toBe(50);
    expect(snapToGridWithTolerance(0, 50, 6)).toBe(0);
  });

  it('2. value within tolerance snaps to nearest grid', () => {
    // 48 is 2px from 50, within tolerance 6 → snap to 50
    expect(snapToGridWithTolerance(48, 50, 6)).toBe(50);
    // 53 is 3px from 50, within tolerance 6 → snap to 50
    expect(snapToGridWithTolerance(53, 50, 6)).toBe(50);
    // 47 is 3px from 50, within tolerance 6 → snap to 50
    expect(snapToGridWithTolerance(47, 50, 6)).toBe(50);
  });

  it('3. value outside tolerance returns original value (free placement)', () => {
    // 43 is 7px from 50, outside tolerance 6 → return 43
    expect(snapToGridWithTolerance(43, 50, 6)).toBe(43);
    // 57 is 7px from 50, outside tolerance 6 → return 57
    expect(snapToGridWithTolerance(57, 50, 6)).toBe(57);
  });

  it('4. tolerance boundary: exactly at tolerance distance snaps', () => {
    // 44 is 6px from 50, exactly at tolerance → snap to 50
    expect(snapToGridWithTolerance(44, 50, 6)).toBe(50);
    // 56 is 6px from 50, exactly at tolerance → snap to 50
    expect(snapToGridWithTolerance(56, 50, 6)).toBe(50);
  });

  it('5. negative values work correctly', () => {
    // -2 is 2px from 0, within tolerance → snap to 0 (or -0, which equals 0)
    const result1 = snapToGridWithTolerance(-2, 50, 6);
    expect(Object.is(result1, 0) || Object.is(result1, -0)).toBe(true);
    // -48 is 2px from -50, within tolerance → snap to -50
    expect(snapToGridWithTolerance(-48, 50, 6)).toBe(-50);
  });

  it('6. gridSize=0 returns original value', () => {
    expect(snapToGridWithTolerance(42, 0, 6)).toBe(42);
  });

  it('7. tolerance=0 returns original value', () => {
    expect(snapToGridWithTolerance(49, 50, 0)).toBe(49);
  });

  it('8. different gridSize values work', () => {
    expect(snapToGridWithTolerance(23, 20, 5)).toBe(20); // 3px from 20 → snap
    expect(snapToGridWithTolerance(27, 20, 5)).toBe(27); // 7px from 20, 7px from 40 → outside tol 5 → free
    expect(snapToGridWithTolerance(28, 20, 5)).toBe(28); // 8px from 20 → outside tol 5 → free
  });

  it('9. large values work', () => {
    expect(snapToGridWithTolerance(997, 50, 6)).toBe(1000);
    expect(snapToGridWithTolerance(1203, 50, 6)).toBe(1200);
  });

  it('10. snaps to nearest grid, not just up or down', () => {
    // 74 with grid 25: nearest = Math.round(74/25)*25 = Math.round(2.96)*25 = 3*25 = 75. distance = 1 → snap
    expect(snapToGridWithTolerance(74, 25, 6)).toBe(75);
    // 11 with grid 25: nearest = Math.round(11/25)*25 = Math.round(0.44)*25 = 0*25 = 0. distance = 11. > 6 → free
    expect(snapToGridWithTolerance(11, 25, 6)).toBe(11);
  });
});

// ---------------------------------------------------------------------------
// 2. snapRectToGridWithTolerance — rect-level
// ---------------------------------------------------------------------------

describe('V2-PILAR-2.5 — snapRectToGridWithTolerance', () => {
  it('11. snaps all 4 fields independently', () => {
    const result = snapRectToGridWithTolerance(
      { x: 48, y: 103, width: 52, height: 97 },
      50, 6,
    );
    // x: 48 → 2px from 50 → snap 50
    // y: 103 → 3px from 100 → snap 100
    // width: 52 → 2px from 50 → snap 50
    // height: 97 → 3px from 100 → snap 100
    expect(result.x).toBe(50);
    expect(result.y).toBe(100);
    expect(result.width).toBe(50);
    expect(result.height).toBe(100);
  });

  it('12. fields outside tolerance stay original', () => {
    const result = snapRectToGridWithTolerance(
      { x: 30, y: 100, width: 75, height: 200 },
      50, 6,
    );
    // x: 30 → 20px from 50 → outside tolerance → 30
    // y: 100 → exact → 100
    // width: 75 → 25px from 100, 25px from 50 → nearest 100, distance 25 → outside → 75
    // height: 200 → exact → 200
    expect(result.x).toBe(30);
    expect(result.y).toBe(100);
    expect(result.width).toBe(75);
    expect(result.height).toBe(200);
  });

  it('13. does not mutate input rect', () => {
    const input = { x: 48, y: 103, width: 52, height: 97 };
    const inputCopy = { ...input };
    snapRectToGridWithTolerance(input, 50, 6);
    expect(input).toEqual(inputCopy);
  });
});

// ---------------------------------------------------------------------------
// 3. Store: setGlobalSlideSettings with editorGrid
// ---------------------------------------------------------------------------

describe('V2-PILAR-2.5 — Store editorGrid config', () => {
  beforeEach(() => {
    useEditorStore.getState().resetProject();
  });

  it('14. setGlobalSlideSettings with editorGrid.enabled=true persists', () => {
    useEditorStore.getState().setGlobalSlideSettings({
      editorGrid: { enabled: true },
    });
    const settings = useEditorStore.getState().project.globalSlideSettings;
    expect(settings).toBeDefined();
    expect(settings?.editorGrid.enabled).toBe(true);
  });

  it('15. setGlobalSlideSettings with editorGrid.gridSize=100 persists', () => {
    useEditorStore.getState().setGlobalSlideSettings({
      editorGrid: { gridSize: 100 },
    });
    const settings = useEditorStore.getState().project.globalSlideSettings;
    expect(settings?.editorGrid.gridSize).toBe(100);
  });

  it('16. setGlobalSlideSettings with editorGrid.snapToGrid=true persists', () => {
    useEditorStore.getState().setGlobalSlideSettings({
      editorGrid: { snapToGrid: true },
    });
    const settings = useEditorStore.getState().project.globalSlideSettings;
    expect(settings?.editorGrid.snapToGrid).toBe(true);
  });

  it('17. partial editorGrid merge preserves other fields', () => {
    useEditorStore.getState().setGlobalSlideSettings({
      editorGrid: { enabled: true, gridSize: 100 },
    });
    useEditorStore.getState().setGlobalSlideSettings({
      editorGrid: { snapToGrid: true },
    });
    const settings = useEditorStore.getState().project.globalSlideSettings;
    expect(settings?.editorGrid.enabled).toBe(true);
    expect(settings?.editorGrid.gridSize).toBe(100);
    expect(settings?.editorGrid.snapToGrid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. DEFAULT_GLOBAL_SLIDE_SETTINGS has editorGrid
// ---------------------------------------------------------------------------

describe('V2-PILAR-2.5 — DEFAULT_GLOBAL_SLIDE_SETTINGS.editorGrid', () => {
  it('18. DEFAULT has editorGrid field', () => {
    expect(DEFAULT_GLOBAL_SLIDE_SETTINGS.editorGrid).toBeDefined();
  });

  it('19. default editorGrid.enabled is false', () => {
    expect(DEFAULT_GLOBAL_SLIDE_SETTINGS.editorGrid.enabled).toBe(false);
  });

  it('20. default editorGrid.gridSize is 50', () => {
    expect(DEFAULT_GLOBAL_SLIDE_SETTINGS.editorGrid.gridSize).toBe(50);
  });

  it('21. default editorGrid.snapToGrid is false', () => {
    expect(DEFAULT_GLOBAL_SLIDE_SETTINGS.editorGrid.snapToGrid).toBe(false);
  });

  it('22. default editorGrid.snapTolerance is 6', () => {
    expect(DEFAULT_GLOBAL_SLIDE_SETTINGS.editorGrid.snapTolerance).toBe(6);
  });

  it('23. getEffectiveGlobalSlideSettings returns editorGrid for default project', () => {
    const project = createProject();
    const settings = getEffectiveGlobalSlideSettings(project);
    expect(settings.editorGrid).toBeDefined();
    expect(settings.editorGrid.enabled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5. Grid is passive — does NOT auto-adjust existing components
// ---------------------------------------------------------------------------

describe('V2-PILAR-2.5 — Grid is passive (no auto-adjust)', () => {
  beforeEach(() => {
    useEditorStore.getState().resetProject();
  });

  it('24. enabling grid does NOT move existing components', () => {
    const store = useEditorStore.getState();
    store.addPage({ role: 'free', title: 'Test' });
    const id = store.addTextComponent({ text: 'Test', x: 137, y: 243, width: 300, height: 80 });
    // Record component position before grid enable
    const beforeProject = useEditorStore.getState().project;
    const beforeComp = beforeProject.pages.find((p) => p.id === beforeProject.currentPageId)!.components.find((c) => c.id === id)!;
    const beforeX = beforeComp.x;
    const beforeY = beforeComp.y;

    // Enable grid
    useEditorStore.getState().setGlobalSlideSettings({
      editorGrid: { enabled: true, snapToGrid: true },
    });

    // Component position should NOT change
    const afterProject = useEditorStore.getState().project;
    const afterComp = afterProject.pages.find((p) => p.id === afterProject.currentPageId)!.components.find((c) => c.id === id)!;
    expect(afterComp.x).toBe(beforeX);
    expect(afterComp.y).toBe(beforeY);
  });

  it('25. toggling grid on/off does NOT affect component sizes', () => {
    const store = useEditorStore.getState();
    store.addPage({ role: 'free', title: 'Test' });
    const id = store.addTextComponent({ text: 'Test', x: 100, y: 100, width: 343, height: 77 });

    const beforeW = useEditorStore.getState().project.pages.find((p) => p.id === useEditorStore.getState().project.currentPageId)!.components.find((c) => c.id === id)!.width;
    const beforeH = useEditorStore.getState().project.pages.find((p) => p.id === useEditorStore.getState().project.currentPageId)!.components.find((c) => c.id === id)!.height;

    // Toggle grid on
    useEditorStore.getState().setGlobalSlideSettings({ editorGrid: { enabled: true, snapToGrid: true } });
    // Toggle grid off
    useEditorStore.getState().setGlobalSlideSettings({ editorGrid: { enabled: false, snapToGrid: false } });

    const afterComp = useEditorStore.getState().project.pages.find((p) => p.id === useEditorStore.getState().project.currentPageId)!.components.find((c) => c.id === id)!;
    expect(afterComp.width).toBe(beforeW);
    expect(afterComp.height).toBe(beforeH);
  });
});

// ---------------------------------------------------------------------------
// 6. SlideSettingsDialog: editor grid controls
// ---------------------------------------------------------------------------

describe('V2-PILAR-2.5 — SlideSettingsDialog grid controls', () => {
  beforeEach(() => {
    useEditorStore.getState().resetProject();
  });

  it('26. dialog renders grid enabled checkbox', () => {
    const { container } = render(React.createElement(SlideSettingsDialog, { onClose: () => {} }));
    expect(container.querySelector('[data-testid="slide-settings-grid-enabled"]')).not.toBeNull();
  });

  it('27. dialog renders snap to grid checkbox', () => {
    const { container } = render(React.createElement(SlideSettingsDialog, { onClose: () => {} }));
    expect(container.querySelector('[data-testid="slide-settings-snap-to-grid"]')).not.toBeNull();
  });

  it('28. dialog renders grid size input', () => {
    const { container } = render(React.createElement(SlideSettingsDialog, { onClose: () => {} }));
    expect(container.querySelector('[data-testid="slide-settings-grid-size"]')).not.toBeNull();
  });

  it('29. default grid enabled checkbox is unchecked', () => {
    const { container } = render(React.createElement(SlideSettingsDialog, { onClose: () => {} }));
    const checkbox = container.querySelector('[data-testid="slide-settings-grid-enabled"]') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it('30. default grid size input is 50', () => {
    const { container } = render(React.createElement(SlideSettingsDialog, { onClose: () => {} }));
    const input = container.querySelector('[data-testid="slide-settings-grid-size"]') as HTMLInputElement;
    expect(input.value).toBe('50');
  });
});
