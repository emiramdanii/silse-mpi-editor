/**
 * Core types for silse-mpi-editor.
 *
 * Layer: core
 * Allowed imports: none (only TypeScript built-ins)
 *
 * These types are the single source of truth for project data.
 * Do not import from store/editor/blocks/preview/export.
 */

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------

export const PROJECT_VERSION = 1 as const;

export type SimpleProject = {
  id: string;
  title: string;
  version: typeof PROJECT_VERSION;
  pages: SimplePage[];
  currentPageId: string;
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export type PageBackground =
  | { type: 'color'; color: string }
  | { type: 'gradient'; gradient: string }
  | { type: 'image'; imageSrc: string };

export type SimplePage = {
  id: string;
  title: string;
  background: PageBackground;
  blocks: SimpleBlock[];
};

// ---------------------------------------------------------------------------
// Block Variant — peran visual-pedagogis block
// (lihat docs/CORE_PRODUCT_CONTRACT.md section 5 "Kontrak Block Variant")
// ---------------------------------------------------------------------------

/**
 * Variant untuk text block.
 * Variant adalah anchor untuk style adapter (M6) — sebelum M6, render
 * memakai lookup hard-coded minimal berdasarkan variant.
 *
 * Variant BUKAN field style manual. Field style manual (fontSize/color/dll)
 * sebagai override lokal baru datang di M6/M11 via style adapter.
 */
export const TEXT_BLOCK_VARIANTS = [
  'title',
  'subtitle',
  'body',
  'instruction',
  'importantNote',
  'questionPrompt',
  'reflectionBox',
] as const;

export type TextBlockVariant = (typeof TEXT_BLOCK_VARIANTS)[number];

// ---------------------------------------------------------------------------
// Block — discriminated union on `type`
// ---------------------------------------------------------------------------

export type BaseBlock = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Text block (M2 scope).
 *
 * Data block sengaja minimal: text content + geometry + variant.
 * Field style manual (fontSize/color/fontWeight/align) TIDAK ada di M2 —
 * style datang dari variant via style adapter (M6) atau lookup minimal
 * hard-coded (sebelum M6). Ini konsisten dengan kontrak Batch 1B.
 */
export type TextBlock = BaseBlock & {
  type: 'text';
  text: string;
  variant: TextBlockVariant;
};

export type ImageBlock = BaseBlock & {
  type: 'image';
  src: string;
  alt?: string;
  objectFit: 'cover' | 'contain';
  // variant: ImageBlockVariant — ditambahkan di M4
};

export type ButtonBlock = BaseBlock & {
  type: 'button';
  label: string;
  action: 'next' | 'prev' | 'goto';
  targetPageId?: string;
  // variant: ButtonBlockVariant — ditambahkan di M5
};

export type SimpleBlock = TextBlock | ImageBlock | ButtonBlock;

// ---------------------------------------------------------------------------
// Block type literals — exported as constants for runtime guards
// ---------------------------------------------------------------------------

export const BLOCK_TYPES = ['text', 'image', 'button'] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];
