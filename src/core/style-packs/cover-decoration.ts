/**
 * Cover Decoration (COVER-PREMIUM-POLISH-01).
 *
 * Layer: core/style-packs (pure function, no React/DOM)
 * Allowed imports: ./style-pack-registry
 *
 * Kontrak:
 *   Pure helper yang mengembalikan CSS class untuk dekorasi cover halaman
 *   berdasarkan style pack. Cover = halaman pertama yang harus terasa "wow".
 *
 *   Prinsip:
 *     - Cover decoration = CSS class only (hero gradient, accent blob, title emphasis).
 *     - Tidak mengubah content/layout/geometry.
 *     - Editor, preview, export pakai class yang sama.
 *     - Unknown style pack → fallback modern-clean.
 */

import { getStylePackV1, type StylePackIdV1 } from './style-pack-registry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CoverDecoration = {
  /** CSS class for cover page decoration (hero gradient + accent). */
  coverClass: string;
};

// ---------------------------------------------------------------------------
// Cover decoration mapping per style pack
// ---------------------------------------------------------------------------

const COVER_MAP: Record<StylePackIdV1, CoverDecoration> = {
  'modern-clean': {
    coverClass: 'silse-cover-clean',
  },
  'soft-classroom': {
    coverClass: 'silse-cover-soft',
  },
  'mission-dark': {
    coverClass: 'silse-cover-mission',
  },
};

// ---------------------------------------------------------------------------
// Main: getCoverDecorationForStylePack
// ---------------------------------------------------------------------------

export function getCoverDecorationForStylePack(stylePackId?: string): CoverDecoration {
  const pack = getStylePackV1(stylePackId);
  return COVER_MAP[pack.id] ?? COVER_MAP['modern-clean'];
}

// ---------------------------------------------------------------------------
// Helper: get cover class only
// ---------------------------------------------------------------------------

export function getCoverClassForStylePack(stylePackId?: string): string {
  return getCoverDecorationForStylePack(stylePackId).coverClass;
}

// ---------------------------------------------------------------------------
// Helper: get all cover class names
// ---------------------------------------------------------------------------

export function getAllCoverClassNames(): string[] {
  return [...new Set(Object.values(COVER_MAP).map(c => c.coverClass))];
}
