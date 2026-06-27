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
// LayoutId — placeholder for layout recipe (M3 scope)
// (lihat docs/ROADMAP.md M3 "Page Flow + LayoutId Dasar")
//
// LayoutId adalah string ringan yang menandai layout recipe halaman.
// BUKAN full layout engine — engine konkret datang di M4 (recipes) dan
// M9 (layout guard). Untuk M3, layoutId hanya metadata yang divalidasi
// string non-empty dan salah satu dari LAYOUT_IDS.
// ---------------------------------------------------------------------------

export const LAYOUT_IDS = [
  'blank',
  'coverCentered',
  'singleColumn',
] as const;

export type LayoutId = (typeof LAYOUT_IDS)[number];

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
  /**
   * Layout recipe placeholder (M3). String ringan, bukan full layout engine.
   * Default by PageRole (lihat core/layout-defaults.ts).
   * Engine konkret datang di M4 (recipes) dan M9 (layout guard).
   */
  layoutId: LayoutId;
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
// Image Component Variant (M4)
// ---------------------------------------------------------------------------

export const IMAGE_COMPONENT_VARIANTS = [
  'illustration',
  'background',
  'imageCard',
] as const;

export type ImageComponentVariant = (typeof IMAGE_COMPONENT_VARIANTS)[number];

// ---------------------------------------------------------------------------
// Card Component Variant (M4)
//
// Catatan konsep (Batch 4 dari senior):
//   Card di M4 = elemen pembelajaran sederhana (title + body + variant + geometry).
//   BUKAN nested container yang berisi elemen lain.
//   Nested container / component pattern baru di M11/M12.
// ---------------------------------------------------------------------------

export const CARD_COMPONENT_VARIANTS = [
  'infoCard',
  'importantNote',
  'exampleCard',
] as const;

export type CardComponentVariant = (typeof CARD_COMPONENT_VARIANTS)[number];

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

/**
 * Image component (M4 scope).
 *
 * Data: variant + src + alt + objectFit + geometry.
 * Variant wajib (anchor untuk style adapter M6).
 * src wajib (data URL/base64 untuk local-first, atau URL absolut).
 */
export type ImageComponent = BaseComponent & {
  type: 'image';
  variant: ImageComponentVariant;
  src: string;
  alt?: string;
  objectFit: 'cover' | 'contain';
};

/**
 * Card component (M4 scope).
 *
 * Elemen pembelajaran sederhana: title (opsional) + body + variant + geometry.
 * BUKAN nested container — tidak berisi komponen lain.
 * Style datang dari variant via style adapter (M6).
 */
export type CardComponent = BaseComponent & {
  type: 'card';
  variant: CardComponentVariant;
  title?: string;
  body: string;
};

export type NavigationComponent = BaseComponent & {
  type: 'navigation';
  label: string;
  action: 'next' | 'prev' | 'goto';
  targetPageId?: string;
  // variant: NavigationComponentVariant — ditambahkan di M5
};

/**
 * Union of all component types.
 * M2: TextComponent. M4: ImageComponent + CardComponent. M5: NavigationComponent. M11: Question.
 */
export type PageComponent =
  | TextComponent
  | ImageComponent
  | CardComponent
  | NavigationComponent;

// ---------------------------------------------------------------------------
// Component type literals — exported as constants for runtime guards
// ---------------------------------------------------------------------------

export const COMPONENT_TYPES = ['text', 'image', 'card', 'navigation'] as const;
export type ComponentType = (typeof COMPONENT_TYPES)[number];
