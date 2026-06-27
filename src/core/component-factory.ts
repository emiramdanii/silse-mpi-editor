/**
 * Component factory for silse-mpi-editor.
 *
 * Layer: core
 * Allowed imports: ./types, ./ids, ./capability
 *
 * M2: createTextComponent.
 * M4: createImageComponent + createCardComponent.
 * M5: createNavigationComponent. M11: createQuestionComponent.
 *
 * Kontrak (docs/CORE_PRODUCT_CONTRACT.md section 5 + Batch 2R Scope D):
 *   - Setiap component WAJIB punya field `variant`.
 *   - Default variant text mengikuti PageRole.
 *   - Component tanpa variant = scope leak. Validation akan menolak.
 */

import type {
  CardComponent,
  CardComponentVariant,
  ImageComponent,
  ImageComponentVariant,
  NavigationAction,
  NavigationComponent,
  NavigationComponentVariant,
  PageRole,
  TextComponent,
  TextComponentVariant,
} from './types';
import { createComponentId } from './ids';
import { getDefaultTextVariantForRole } from './capability';

// ---------------------------------------------------------------------------
// Text Component (M2)
// ---------------------------------------------------------------------------

export type TextComponentEditable = Omit<TextComponent, 'id' | 'type'>;

export const DEFAULT_TEXT_COMPONENT: Omit<TextComponentEditable, 'variant'> = {
  text: 'Teks baru',
  x: 100,
  y: 100,
  width: 600,
  height: 80,
};

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

// ---------------------------------------------------------------------------
// Image Component (M4)
// ---------------------------------------------------------------------------

export type ImageComponentEditable = Omit<ImageComponent, 'id' | 'type'>;

export const DEFAULT_IMAGE_VARIANT: ImageComponentVariant = 'illustration';

export const DEFAULT_IMAGE_COMPONENT: Omit<ImageComponentEditable, 'variant' | 'src'> = {
  alt: '',
  objectFit: 'cover',
  x: 200,
  y: 150,
  width: 400,
  height: 300,
};

/**
 * Create a new image component.
 * src wajib (data URL/base64 atau URL absolut).
 * Default variant = 'illustration'.
 */
export function createImageComponent(
  src: string,
  overrides: Partial<ImageComponentEditable> = {},
): ImageComponent {
  return {
    id: createComponentId(),
    type: 'image',
    variant: DEFAULT_IMAGE_VARIANT,
    src,
    ...DEFAULT_IMAGE_COMPONENT,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Card Component (M4)
//
// Catatan: Card = elemen sederhana (title + body + variant + geometry).
// BUKAN nested container.
// ---------------------------------------------------------------------------

export type CardComponentEditable = Omit<CardComponent, 'id' | 'type'>;

export const DEFAULT_CARD_VARIANT: CardComponentVariant = 'infoCard';

export const DEFAULT_CARD_COMPONENT: Omit<CardComponentEditable, 'variant' | 'body'> = {
  title: '',
  x: 150,
  y: 200,
  width: 500,
  height: 200,
};

/**
 * Create a new card component.
 * body wajib (konten utama card).
 * Default variant = 'infoCard'.
 */
export function createCardComponent(
  body: string,
  overrides: Partial<CardComponentEditable> = {},
): CardComponent {
  return {
    id: createComponentId(),
    type: 'card',
    variant: DEFAULT_CARD_VARIANT,
    body,
    ...DEFAULT_CARD_COMPONENT,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Navigation Component (M5)
// ---------------------------------------------------------------------------

export type NavigationComponentEditable = Omit<NavigationComponent, 'id' | 'type'>;

export const DEFAULT_NAVIGATION_VARIANT: NavigationComponentVariant = 'navigation';

export const DEFAULT_NAVIGATION_COMPONENT: Omit<
  NavigationComponentEditable,
  'variant' | 'label' | 'action'
> = {
  x: 900,
  y: 620,
  width: 280,
  height: 60,
};

/**
 * Create a new navigation component.
 * label wajib (teks tombol). action wajib (next/prev/goto).
 * Default variant = 'navigation'.
 * targetPageId wajib jika action='goto' (caller responsibility).
 */
export function createNavigationComponent(
  label: string,
  action: NavigationAction,
  overrides: Partial<NavigationComponentEditable> = {},
): NavigationComponent {
  return {
    id: createComponentId(),
    type: 'navigation',
    variant: DEFAULT_NAVIGATION_VARIANT,
    label,
    action,
    ...DEFAULT_NAVIGATION_COMPONENT,
    ...overrides,
  };
}
