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
// Block — discriminated union on `type`
// ---------------------------------------------------------------------------

export type BaseBlock = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TextBlock = BaseBlock & {
  type: 'text';
  text: string;
  fontSize: number;
  color: string;
  fontWeight: 'normal' | 'bold';
  align: 'left' | 'center' | 'right';
};

export type ImageBlock = BaseBlock & {
  type: 'image';
  src: string;
  alt?: string;
  objectFit: 'cover' | 'contain';
};

export type ButtonBlock = BaseBlock & {
  type: 'button';
  label: string;
  action: 'next' | 'prev' | 'goto';
  targetPageId?: string;
};

export type SimpleBlock = TextBlock | ImageBlock | ButtonBlock;

// ---------------------------------------------------------------------------
// Block type literals — exported as constants for runtime guards
// ---------------------------------------------------------------------------

export const BLOCK_TYPES = ['text', 'image', 'button'] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];
