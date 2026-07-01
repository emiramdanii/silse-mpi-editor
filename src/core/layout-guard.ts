/**
 * Layout guard for silse-mpi-editor.
 *
 * Layer: core
 * Allowed imports: ./types, ./geometry, ./layout-recipes
 *
 * Kontrak (Batch 9 / M9):
 *   Guard geometry by page role + layoutId.
 *   - Komponen tidak boleh keluar canvas.
 *   - Ukuran minimal dijaga.
 *   - Snap grid 8px.
 *   - coverCentered: komponen text utama tetap dalam safe area.
 *   - singleColumn: komponen dianjurkan dalam safe area.
 *   Bukan full auto-layout engine. Bukan constraint solver.
 */

import type { LayoutId, PageRole } from './types';
import { normalizeRect, type Rect } from './geometry';
import { getLayoutRecipe } from './layout-recipes';

export type LayoutGuardResult = {
  rect: Rect;
  warnings: string[];
};

/**
 * Guard a component's proposed geometry based on page layout.
 *
 * @param role - page role
 * @param layoutId - page layoutId
 * @param componentType - 'text' | 'image' | 'card' | 'navigation'
 * @param proposed - proposed geometry { x, y, width, height }
 * @returns guarded rect + warnings
 */
export function guardGeometry(
  _role: PageRole,
  layoutId: LayoutId,
  componentType: string,
  proposed: Rect,
): LayoutGuardResult {
  const warnings: string[] = [];

  // Step 1: normalize (snap + clamp + min size)
  let rect = normalizeRect(proposed);

  // Step 2: layout-specific guards
  const recipe = getLayoutRecipe(layoutId);

  if (recipe) {
    const safeArea = recipe.safeArea;

    if (layoutId === 'coverCentered') {
      // For coverCentered, text components should stay within safe area
      if (componentType === 'text') {
        if (rect.x < safeArea.x || rect.y < safeArea.y ||
            rect.x + rect.width > safeArea.x + safeArea.width ||
            rect.y + rect.height > safeArea.y + safeArea.height) {
          warnings.push('Komponen teks di luar area aman cover. Pertimbangkan memindah ke tengah halaman.');
        }
      }
    }

    if (layoutId === 'singleColumn') {
      // For singleColumn, components should stay within safe area (advisory)
      if (rect.x < safeArea.x || rect.y < safeArea.y ||
          rect.x + rect.width > safeArea.x + safeArea.width ||
          rect.y + rect.height > safeArea.y + safeArea.height) {
        warnings.push('Komponen di luar area aman kolom tunggal. Pertimbangkan menyesuaikan posisi.');
      }
    }
  }

  return { rect, warnings };
}
