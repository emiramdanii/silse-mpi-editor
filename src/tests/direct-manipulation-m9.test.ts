/**
 * Tests for geometry, layout guard, store M9 operations (M9).
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  snapToGrid,
  clampRectToCanvas,
  normalizeRect,
  resizeRectWithHandle,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  SNAP_GRID,
  MIN_WIDTH,
  MIN_HEIGHT,
} from '../core/geometry';
import { guardGeometry } from '../core/layout-guard';
import { useEditorStore } from '../store/editor-store';
import { isValidProject } from '../core/validation';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// =========================================================================
// Geometry utilities
// =========================================================================

describe('geometry — snapToGrid', () => {
  it('snaps to nearest 8px', () => {
    expect(snapToGrid(8)).toBe(8);
    expect(snapToGrid(16)).toBe(16);
    expect(snapToGrid(20)).toBe(24);
    expect(snapToGrid(0)).toBe(0);
  });

  it('handles 0', () => {
    expect(snapToGrid(0)).toBe(0);
  });

  it('handles negative values', () => {
    expect(snapToGrid(-8)).toBe(-8);
    expect(snapToGrid(-16)).toBe(-16);
  });
});

describe('geometry — clampRectToCanvas', () => {
  it('clamps x to canvas', () => {
    const r = clampRectToCanvas({ x: -100, y: 0, width: 200, height: 100 });
    expect(r.x).toBe(0);
  });

  it('clamps y to canvas', () => {
    const r = clampRectToCanvas({ x: 0, y: -100, width: 200, height: 100 });
    expect(r.y).toBe(0);
  });

  it('clamps right edge to canvas width', () => {
    const r = clampRectToCanvas({ x: 1200, y: 0, width: 200, height: 100 });
    expect(r.x + r.width).toBeLessThanOrEqual(CANVAS_WIDTH);
  });

  it('clamps bottom edge to canvas height', () => {
    const r = clampRectToCanvas({ x: 0, y: 700, width: 200, height: 100 });
    expect(r.y + r.height).toBeLessThanOrEqual(CANVAS_HEIGHT);
  });

  it('enforces min width', () => {
    const r = clampRectToCanvas({ x: 0, y: 0, width: 10, height: 100 });
    expect(r.width).toBe(MIN_WIDTH);
  });

  it('enforces min height', () => {
    const r = clampRectToCanvas({ x: 0, y: 0, width: 200, height: 5 });
    expect(r.height).toBe(MIN_HEIGHT);
  });
});

describe('geometry — normalizeRect', () => {
  it('snaps + clamps', () => {
    const r = normalizeRect({ x: 7, y: -10, width: 150, height: 30 });
    expect(r.x).toBe(8);
    expect(r.y).toBe(0);
    expect(r.width).toBe(152);
    expect(r.height).toBe(MIN_HEIGHT);
  });
});

describe('geometry — resizeRectWithHandle', () => {
  it('se handle increases width+height', () => {
    const r = resizeRectWithHandle(
      { x: 100, y: 100, width: 200, height: 100 },
      'se',
      { dx: 50, dy: 30 },
    );
    expect(r.width).toBeGreaterThan(200);
    expect(r.height).toBeGreaterThan(100);
  });

  it('se handle snaps to grid', () => {
    const r = resizeRectWithHandle(
      { x: 100, y: 100, width: 200, height: 100 },
      'se',
      { dx: 7, dy: 3 },
    );
    expect(r.width % SNAP_GRID).toBe(0);
    expect(r.height % SNAP_GRID).toBe(0);
  });
});

// =========================================================================
// Layout guard
// =========================================================================

describe('layout guard — coverCentered safe area', () => {
  it('text within safe area produces no warning', () => {
    const result = guardGeometry('cover', 'coverCentered', 'text', {
      x: 200, y: 300, width: 800, height: 120,
    });
    expect(result.warnings.length).toBe(0);
  });

  it('text outside safe area produces warning', () => {
    const result = guardGeometry('cover', 'coverCentered', 'text', {
      x: 0, y: 0, width: 200, height: 100,
    });
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toMatch(/safe area|area aman/i);
  });
});

describe('layout guard — singleColumn safe area', () => {
  it('component within safe area produces no warning', () => {
    const result = guardGeometry('material', 'singleColumn', 'text', {
      x: 100, y: 80, width: 1000, height: 500,
    });
    expect(result.warnings.length).toBe(0);
  });

  it('component outside safe area produces warning', () => {
    const result = guardGeometry('material', 'singleColumn', 'text', {
      x: 0, y: 0, width: 200, height: 100,
    });
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

// =========================================================================
// Store — updateComponentGeometry + removeComponent
// =========================================================================

describe('store — M9 scope', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('updateComponentGeometry snaps + clamps', () => {
    const store = useEditorStore.getState();
    store.addPage();
    const id = store.addTextComponent({ text: 'Test' })!;
    // Set geometry to non-snapped values
    store.updateComponentGeometry(id, { x: 7, y: -10, width: 150, height: 30 });
    const { project } = useEditorStore.getState();
    const comp = project.pages[1].components[0];
    expect(comp.x % SNAP_GRID).toBe(0);
    expect(comp.y).toBe(0);
    expect(comp.height).toBeGreaterThanOrEqual(MIN_HEIGHT);
  });

  it('updateComponentGeometry preserves component type/data', () => {
    const store = useEditorStore.getState();
    store.addPage();
    const id = store.addTextComponent({ text: 'Hello', variant: 'title' })!;
    store.updateComponentGeometry(id, { x: 200, y: 200, width: 600, height: 120 });
    const { project } = useEditorStore.getState();
    const comp = project.pages[1].components[0];
    expect(comp.type).toBe('text');
    expect((comp as { text: string }).text).toBe('Hello');
    expect((comp as { variant: string }).variant).toBe('title');
  });

  it('removeComponent removes selected component', () => {
    const store = useEditorStore.getState();
    store.addPage();
    const id = store.addTextComponent({ text: 'Remove me' })!;
    expect(useEditorStore.getState().project.pages[1].components).toHaveLength(1);

    store.removeComponent(id);
    expect(useEditorStore.getState().project.pages[1].components).toHaveLength(0);
  });

  it('removeComponent clears selectedComponentId', () => {
    const store = useEditorStore.getState();
    store.addPage();
    const id = store.addTextComponent({ text: 'Remove me' })!;
    expect(useEditorStore.getState().selectedComponentId).toBe(id);

    store.removeComponent(id);
    expect(useEditorStore.getState().selectedComponentId).toBeNull();
  });

  it('project remains valid after geometry update + remove', () => {
    const store = useEditorStore.getState();
    store.addPage();
    const id = store.addTextComponent({ text: 'A' })!;
    store.addImageComponent('data:image/png;base64,abc');
    store.updateComponentGeometry(id, { x: 300, y: 200, width: 800, height: 160 });
    store.removeComponent(id);

    const { project } = useEditorStore.getState();
    expect(isValidProject(project)).toBe(true);
  });

  it('store EXPOSES updateComponentGeometry (M9 active)', () => {
    expect(typeof useEditorStore.getState().updateComponentGeometry).toBe('function');
  });

  it('store EXPOSES removeComponent (M9 active)', () => {
    expect(typeof useEditorStore.getState().removeComponent).toBe('function');
  });

  it('store does NOT expose setPageRole/quiz/game/scoring', () => {
    const s = useEditorStore.getState() as Record<string, unknown>;
    expect(s.setPageRole).toBeUndefined();
    expect(s.addQuestion).toBeUndefined();
    expect(s.addGame).toBeUndefined();
    expect(s.addScoring).toBeUndefined();
  });
});

// =========================================================================
// Canvas source checks
// =========================================================================

describe('M9 — canvas source checks', () => {
  const SRC_DIR = resolve(__dirname, '..');

  it('CanvasStage does NOT use external drag library', () => {
    const content = readFileSync(resolve(SRC_DIR, 'editor/CanvasStage.tsx'), 'utf8');
    expect(content).not.toMatch(/react-dnd|react-draggable|react-resizable|interactjs/i);
  });

  it('CanvasStage has keyboard delete handler', () => {
    const content = readFileSync(resolve(SRC_DIR, 'editor/CanvasStage.tsx'), 'utf8');
    expect(content).toMatch(/Delete|Backspace/i);
    expect(content).toMatch(/INPUT|TEXTAREA|SELECT/i);
  });

  it('CanvasStage has resize handle', () => {
    const content = readFileSync(resolve(SRC_DIR, 'editor/CanvasStage.tsx'), 'utf8');
    expect(content).toMatch(/resize/i);
    expect(content).toMatch(/nwse-resize/i);
  });

  it('CanvasStage does NOT contain "block"', () => {
    const content = readFileSync(resolve(SRC_DIR, 'editor/CanvasStage.tsx'), 'utf8');
    expect(content).not.toMatch(/\bblock\b/i);
  });
});

// =========================================================================
// ESM guard
// =========================================================================

describe('M9 — ESM guard (behavior test)', () => {
  it('geometry module imports as ESM (no CommonJS require at runtime)', async () => {
    // If geometry.ts used require(), it would fail to import in ESM context
    const geometry = await import('../core/geometry');
    expect(geometry).toBeDefined();
    expect(typeof geometry.snapToGrid).toBe('function');
  });

  it('layout-guard module imports as ESM (no CommonJS require at runtime)', async () => {
    const layoutGuard = await import('../core/layout-guard');
    expect(layoutGuard).toBeDefined();
  });
});
