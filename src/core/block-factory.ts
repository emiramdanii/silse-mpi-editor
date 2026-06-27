/**
 * Block factory for silse-mpi-editor.
 *
 * Layer: core
 * Allowed imports: ./types, ./ids
 *
 * M2 scope: only createTextBlock. Image/button factories land in M4/M5.
 */

import type { TextBlock } from './types';
import { createBlockId } from './ids';

/**
 * Editable subset of TextBlock — excludes `id` and `type`
 * (those are assigned by the factory and immutable).
 */
export type TextBlockEditable = Omit<TextBlock, 'id' | 'type'>;

export const DEFAULT_TEXT_BLOCK: TextBlockEditable = {
  text: 'Teks baru',
  x: 100,
  y: 100,
  width: 400,
  height: 60,
  fontSize: 24,
  color: '#1f2937',
  fontWeight: 'normal',
  align: 'left',
};

/**
 * Create a new text block with sensible defaults.
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
