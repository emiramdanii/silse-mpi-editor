/**
 * Layout defaults for silse-mpi-editor.
 *
 * Layer: core
 * Allowed imports: ./types
 *
 * Kontrak (Batch 3 / M3):
 *   Setiap SimplePage punya field `layoutId` wajib.
 *   Default layoutId ditentukan oleh PageRole.
 *
 * M3 scope: layoutId hanya metadata string. Tidak ada layout engine.
 * M4 akan memperkenalkan layout recipes konkret.
 * M9 akan memperkenalkan layout guard (drag dibatasi ke slot).
 */

import type { LayoutId, PageRole } from './types';

/**
 * Default layoutId by PageRole.
 *
 * - cover → 'coverCentered' (judul center, pre-filled title)
 * - material → 'singleColumn' (materi satu kolom)
 * - role lain → 'blank' (canvas bebas, komponen di-posisi manual)
 */
export const DEFAULT_LAYOUT_ID_BY_ROLE: Record<PageRole, LayoutId> = {
  cover: 'coverCentered',
  learningObjectives: 'blank',
  starter: 'blank',
  material: 'singleColumn',
  activity: 'blank',
  quiz: 'blank',
  reflection: 'blank',
  closing: 'blank',
  free: 'blank',
};

/**
 * Get default layoutId for a role.
 * Fallback to 'blank' if role unknown (should never happen if validation passes).
 */
export function getDefaultLayoutIdForRole(role: PageRole): LayoutId {
  return DEFAULT_LAYOUT_ID_BY_ROLE[role] ?? 'blank';
}
