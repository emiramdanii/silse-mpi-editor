/**
 * Core types for silse-mpi-editor.
 *
 * Layer: core
 * Allowed imports: none (only TypeScript built-ins)
 *
 * These types are the single source of truth for project data.
 * Do not import from store/editor/components/preview/export.
 *
 * NAMING CONVENTION (Batch 2R):
 *   - Internal type names use "Component" (TextComponent, PageComponent).
 *   - UI product-facing text MUST use "elemen" / "komponen", NOT "block".
 *   - "Block" is a legacy term from M2 v1/v2 and is forbidden in user-facing
 *     strings. Internal code may still reference it in comments for historical
 *     context, but type names and field names use "component".
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
  /**
   * Style pack reference + inline tokens (Batch 2S).
   * Optional untuk backward-compat dengan project lama — kalau undefined,
   * editor memakai DEFAULT_STYLE_PACK. M7 akan memperkenalkan save/load
   * style pack sebagai reusable asset.
   */
  stylePackId?: string;
  style?: import('./style-types').ProjectStyle;
};

// ---------------------------------------------------------------------------
// Page Role — peran pedagogis halaman
// (lihat docs/CORE_PRODUCT_CONTRACT.md section 4 "Kontrak Struktur Pembelajaran")
// ---------------------------------------------------------------------------

export const PAGE_ROLES = [
  'cover',
  'learningObjectives',
  'starter',
  'material',
  'activity',
  'quiz',
  'reflection',
  'closing',
  'free',
] as const;

export type PageRole = (typeof PAGE_ROLES)[number];

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
  /** Peran pedagogis halaman. Wajib. Menentukan capability (komponen apa yang boleh ditambah). */
  role: PageRole;
  background: PageBackground;
  /** Elemen pembelajaran di halaman. Naming internal "components"; UI memakai "elemen". */
  components: PageComponent[];
};

// ---------------------------------------------------------------------------
// Component Variant — peran visual-pedagogis komponen
// (lihat docs/CORE_PRODUCT_CONTRACT.md section 5 "Kontrak Block Variant")
// ---------------------------------------------------------------------------

/**
 * Variant untuk text component.
 * Variant adalah anchor untuk style adapter (M6) — sebelum M6, render
 * memakai lookup hard-coded minimal berdasarkan variant.
 *
 * Variant BUKAN field style manual. Field style manual (fontSize/color/dll)
 * sebagai override lokal baru datang di M6/M11 via style adapter.
 */
export const TEXT_COMPONENT_VARIANTS = [
  'title',
  'subtitle',
  'body',
  'instruction',
  'importantNote',
  'questionPrompt',
  'reflectionBox',
] as const;

export type TextComponentVariant = (typeof TEXT_COMPONENT_VARIANTS)[number];

// ---------------------------------------------------------------------------
// Component — discriminated union on `type`
// ---------------------------------------------------------------------------

export type BaseComponent = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Text component (M2 scope).
 *
 * Data component sengaja minimal: text content + geometry + variant.
 * Field style manual (fontSize/color/fontWeight/align) TIDAK ada di M2 —
 * style datang dari variant via style adapter (M6) atau lookup minimal
 * hard-coded (sebelum M6). Ini konsisten dengan kontrak Batch 1B + 2R.
 */
export type TextComponent = BaseComponent & {
  type: 'text';
  text: string;
  variant: TextComponentVariant;
};

export type ImageComponent = BaseComponent & {
  type: 'image';
  src: string;
  alt?: string;
  objectFit: 'cover' | 'contain';
  // variant: ImageComponentVariant — ditambahkan di M4
};

export type NavigationComponent = BaseComponent & {
  type: 'navigation';
  label: string;
  action: 'next' | 'prev' | 'goto';
  targetPageId?: string;
  // variant: NavigationComponentVariant — ditambahkan di M5
};

/**
 * Union of all component types. M2 only has TextComponent.
 * ImageComponent lands in M4, NavigationComponent in M5, Question in M11.
 */
export type PageComponent = TextComponent | ImageComponent | NavigationComponent;

// ---------------------------------------------------------------------------
// Component type literals — exported as constants for runtime guards
// ---------------------------------------------------------------------------

export const COMPONENT_TYPES = ['text', 'image', 'navigation'] as const;
export type ComponentType = (typeof COMPONENT_TYPES)[number];
