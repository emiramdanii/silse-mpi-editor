/**
 * Block factory for silse-mpi-editor.
 *
 * Layer: core
 * Allowed imports: ./types, ./ids
 *
 * M2 scope: only createTextBlock. Image/button factories land in M4/M5.
 *
 * Kontrak (docs/CORE_PRODUCT_CONTRACT.md section 5):
 *   Setiap text block WAJIB punya field `variant`. Default variant = 'body'.
 *   Block tanpa variant = scope leak. Validation akan menolak.
 */

import type { TextBlock, TextBlockVariant } from './types';
import { createBlockId } from './ids';

/**
 * Editable subset of TextBlock — excludes `id` and `type`
 * (those are assigned by the factory and immutable).
 */
export type TextBlockEditable = Omit<TextBlock, 'id' | 'type'>;

export const DEFAULT_TEXT_VARIANT: TextBlockVariant = 'body';

/**
 * Default geometry untuk text block baru.
 * Canvas 1280×720 — block default ditempatkan di area aman kiri-atas.
 */
export const DEFAULT_TEXT_BLOCK: TextBlockEditable = {
  text: 'Teks baru',
  variant: DEFAULT_TEXT_VARIANT,
  x: 100,
  y: 100,
  width: 600,
  height: 80,
};

/**
 * Create a new text block with sensible defaults.
 * Variant default = 'body' (wajib, sesuai kontrak).
 * Caller can override any editable field via `overrides`.
 */
export function createTextBlock(overrides: Partial<TextBlockEditable> = {}): TextBlock {
  return {
    id: createBlockId(),
    type: 'text',
    ...DEFAULT_TEXT_BLOCK,
    ...overrides,
  };
}
