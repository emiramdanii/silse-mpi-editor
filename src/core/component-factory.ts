/**
 * Component factory for silse-mpi-editor.
 *
 * Layer: core
 * Allowed imports: ./types, ./ids, ./capability
 *
 * M2 scope: only createTextComponent. Image/card/navigation/question
 * factories land in M4/M5/M11.
 *
 * Kontrak (docs/CORE_PRODUCT_CONTRACT.md section 5 + Batch 2R Scope D):
 *   - Setiap text component WAJIB punya field `variant`.
 *   - Default variant ditentukan oleh PageRole halaman tempat component ditambah.
 *   - Component tanpa variant = scope leak. Validation akan menolak.
 */

import type { PageRole, TextComponent, TextComponentVariant } from './types';
import { createComponentId } from './ids';
import { getDefaultTextVariantForRole } from './capability';

/**
 * Editable subset of TextComponent — excludes `id` and `type`
 * (those are assigned by the factory and immutable).
 */
export type TextComponentEditable = Omit<TextComponent, 'id' | 'type'>;

/**
 * Default geometry untuk text component baru.
 * Canvas 1280×720 — component default ditempatkan di area aman kiri-atas.
 */
export const DEFAULT_TEXT_COMPONENT: Omit<TextComponentEditable, 'variant'> = {
  text: 'Teks baru',
  x: 100,
  y: 100,
  width: 600,
  height: 80,
};

/**
 * Create a new text component with sensible defaults.
 *
 * Default variant ditentukan oleh PageRole halaman:
 *   - cover → 'title'
 *   - starter → 'questionPrompt'
 *   - activity → 'instruction'
 *   - quiz → 'questionPrompt'
 *   - reflection → 'reflectionBox'
 *   - lainnya → 'body'
 *
 * Caller dapat override variant via `overrides.variant`.
 */
export function createTextComponent(
  role: PageRole,
  overrides: Partial<TextComponentEditable> = {},
): TextComponent {
  const defaultVariant: TextComponentVariant = getDefaultTextVariantForRole(role);
  return {
    id: createComponentId(),
    type: 'text',
    variant: defaultVariant,
    ...DEFAULT_TEXT_COMPONENT,
    ...overrides,
  };
}
