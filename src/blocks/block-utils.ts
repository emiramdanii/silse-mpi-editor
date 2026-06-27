/**
 * Block utilities for silse-mpi-editor.
 *
 * Layer: blocks
 * Allowed imports: ../core
 *
 * Type guards and helpers for the SimpleBlock union.
 * Block view components (TextBlockView, ImageBlockView, ButtonBlockView)
 * will be added in M2, M4, M5 respectively. This file is intentionally
 * minimal for M0–M1.
 */

import type { ButtonBlock, ImageBlock, SimpleBlock, TextBlock } from '../core/types';

export function isTextBlock(b: SimpleBlock): b is TextBlock {
  return b.type === 'text';
}

export function isImageBlock(b: SimpleBlock): b is ImageBlock {
  return b.type === 'image';
}

export function isButtonBlock(b: SimpleBlock): b is ButtonBlock {
  return b.type === 'button';
}
