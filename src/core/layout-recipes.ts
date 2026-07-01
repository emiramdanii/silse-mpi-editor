/**
 * Layout recipes for silse-mpi-editor.
 *
 * Layer: core
 * Allowed imports: ./types
 *
 * Kontrak (Batch 4 / M4 Scope E):
 *   Recipe = metadata ringan untuk layout halaman.
 *   BUKAN auto-layout engine. BUKAN drag/resize guard.
 *
 *   Setiap recipe memuat:
 *   - id (match LayoutId dari types.ts)
 *   - name (display label)
 *   - description
 *   - safeArea (area aman untuk komponen, dalam piksel canvas 1280×720)
 *   - slots (suggested zones — opsional, info-only)
 *
 *   M9 (Direct Manipulation + Layout Guard) akan meng-enforce slots.
 *   M4 hanya mendefinisikan metadata.
 */

import type { LayoutId } from './types';

export type LayoutSlot = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type LayoutRecipe = {
  id: LayoutId;
  name: string;
  description: string;
  /** Area aman untuk komponen (padding dari edge canvas). */
  safeArea: { x: number; y: number; width: number; height: number };
  /** Suggested zones/slots. Info-only di M4. M9 akan enforce. */
  slots?: ReadonlyArray<LayoutSlot>;
};

// Canvas dimensions (konsisten dengan CanvasStage)
const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

/**
 * Blank layout — canvas bebas, komponen di-posisi manual.
 * Safe area = full canvas dengan padding kecil.
 */
const BLANK_RECIPE: LayoutRecipe = {
  id: 'blank',
  name: 'Bebas',
  description: 'Canvas bebas, komponen di-posisi manual.',
  safeArea: { x: 32, y: 32, width: CANVAS_WIDTH - 64, height: CANVAS_HEIGHT - 64 },
};

/**
 * Cover centered — judul center, area aman di tengah canvas.
 * Satu slot utama untuk title.
 */
const COVER_CENTERED_RECIPE: LayoutRecipe = {
  id: 'coverCentered',
  name: 'Cover terpusat',
  description: 'Judul dan konten utama di tengah halaman.',
  safeArea: { x: 140, y: 200, width: CANVAS_WIDTH - 280, height: CANVAS_HEIGHT - 400 },
  slots: [
    {
      id: 'title',
      name: 'Judul utama',
      x: 140,
      y: 280,
      width: 1000,
      height: 120,
    },
  ],
};

/**
 * Single column — satu kolom materi, padding konsisten.
 * Slot body untuk konten utama.
 */
const SINGLE_COLUMN_RECIPE: LayoutRecipe = {
  id: 'singleColumn',
  name: 'Satu kolom',
  description: 'Materi dalam satu kolom dengan padding konsisten.',
  safeArea: { x: 80, y: 60, width: CANVAS_WIDTH - 160, height: CANVAS_HEIGHT - 120 },
  slots: [
    {
      id: 'body',
      name: 'Konten utama',
      x: 80,
      y: 60,
      width: CANVAS_WIDTH - 160,
      height: CANVAS_HEIGHT - 120,
    },
  ],
};

/**
 * Registry of built-in layout recipes.
 * LAYOUT-PRESET-SYSTEM-V1: Changed to Partial<Record> so new layout preset IDs
 * in LAYOUT_IDS don't require entries here. New presets are handled by
 * src/core/layout-presets/ instead.
 */
export const LAYOUT_RECIPES: Partial<Record<LayoutId, LayoutRecipe>> = {
  blank: BLANK_RECIPE,
  coverCentered: COVER_CENTERED_RECIPE,
  singleColumn: SINGLE_COLUMN_RECIPE,
};

/**
 * Get a layout recipe by id. Returns undefined if not found.
 */
export function getLayoutRecipe(id: LayoutId): LayoutRecipe | undefined {
  return LAYOUT_RECIPES[id];
}

/**
 * Get all layout recipe ids (for UI dropdown).
 */
export function getAllLayoutRecipeIds(): LayoutId[] {
  return Object.keys(LAYOUT_RECIPES) as LayoutId[];
}
