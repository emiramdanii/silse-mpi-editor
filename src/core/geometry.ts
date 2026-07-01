/**
 * Geometry utilities for silse-mpi-editor.
 *
 * Layer: core
 * Allowed imports: none (pure functions)
 *
 * Kontrak (Batch 9 / M9):
 *   Pure functions only. No DOM, no React, no store.
 */

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;
export const SNAP_GRID = 8;
export const MIN_WIDTH = 80;
export const MIN_HEIGHT = 40;

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ResizeHandle = 'se'; // southeast (bottom-right) for M9

/**
 * Snap a value to the nearest grid multiple.
 */
export function snapToGrid(value: number, grid: number = SNAP_GRID): number {
  return Math.round(value / grid) * grid;
}

/**
 * Clamp a rect so it stays within the canvas (0,0 to CANVAS_WIDTH,CANVAS_HEIGHT).
 * Also enforces minimum size.
 */
export function clampRectToCanvas(rect: Rect): Rect {
  const width = Math.max(MIN_WIDTH, Math.min(rect.width, CANVAS_WIDTH));
  const height = Math.max(MIN_HEIGHT, Math.min(rect.height, CANVAS_HEIGHT));
  const x = Math.max(0, Math.min(rect.x, CANVAS_WIDTH - width));
  const y = Math.max(0, Math.min(rect.y, CANVAS_HEIGHT - height));
  return { x, y, width, height };
}

/**
 * Normalize a rect: snap to grid + clamp to canvas + enforce min size.
 */
export function normalizeRect(rect: Rect): Rect {
  const snapped: Rect = {
    x: snapToGrid(rect.x),
    y: snapToGrid(rect.y),
    width: snapToGrid(rect.width),
    height: snapToGrid(rect.height),
  };
  return clampRectToCanvas(snapped);
}

/**
 * Resize a rect by dragging a handle.
 * M9 only supports 'se' (southeast = bottom-right).
 *
 * @param rect - current rect
 * @param handle - which handle is being dragged
 * @param delta - { dx, dy } movement since drag start
 */
export function resizeRectWithHandle(
  rect: Rect,
  handle: ResizeHandle,
  delta: { dx: number; dy: number },
): Rect {
  if (handle === 'se') {
    return normalizeRect({
      x: rect.x,
      y: rect.y,
      width: rect.width + delta.dx,
      height: rect.height + delta.dy,
    });
  }
  return rect;
}
