/**
 * Background Pattern System (BACKGROUND-PATTERN-SYSTEM-V1).
 *
 * Layer: core/style-packs (pure function, no React/DOM)
 * Allowed imports: ./style-pack-registry
 *
 * Kontrak:
 *   Pure helper yang mengembalikan CSS class names untuk background pattern
 *   berdasarkan style pack. Pattern = dekorasi CSS ringan (gradient, grid, dots,
 *   glow) yang membuat halaman lebih hidup tanpa Canva/upload/asset eksternal.
 *
 *   Prinsip:
 *     - Pattern = CSS class only (no image, no base64, no external url).
 *     - Tidak mengubah content/layout/geometry.
 *     - Editor, preview, export pakai class yang sama.
 *     - Unknown style pack → fallback modern-clean.
 *     - Readability: pattern sangat halus, tidak menutupi teks.
 */

import { getStylePackV1, type StylePackIdV1 } from './style-pack-registry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BackgroundPatternTone = {
  /** CSS class for page background (gradient base). */
  pageClass: string;
  /** CSS class for pattern overlay (grid, dots, glow). */
  patternClass: string;
};

// ---------------------------------------------------------------------------
// Pattern mapping per style pack
// ---------------------------------------------------------------------------

const PATTERN_MAP: Record<StylePackIdV1, BackgroundPatternTone> = {
  'modern-clean': {
    pageClass: 'silse-bg-page-clean',
    patternClass: 'silse-bg-pattern-subtle-grid',
  },
  'soft-classroom': {
    pageClass: 'silse-bg-page-soft',
    patternClass: 'silse-bg-pattern-soft-dots',
  },
  'mission-dark': {
    pageClass: 'silse-bg-page-mission',
    patternClass: 'silse-bg-pattern-mission-glow',
  },
};

// ---------------------------------------------------------------------------
// Main: getBackgroundPatternForStylePack
// ---------------------------------------------------------------------------

export function getBackgroundPatternForStylePack(stylePackId?: string): BackgroundPatternTone {
  const pack = getStylePackV1(stylePackId);
  return PATTERN_MAP[pack.id] ?? PATTERN_MAP['modern-clean'];
}

// ---------------------------------------------------------------------------
// Helper: get page background class only
// ---------------------------------------------------------------------------

export function getBackgroundClassForStylePack(stylePackId?: string): string {
  return getBackgroundPatternForStylePack(stylePackId).pageClass;
}

// ---------------------------------------------------------------------------
// Helper: get all background pattern class names (for CSS generation)
// ---------------------------------------------------------------------------

export function getAllBackgroundPatternClassNames(): string[] {
  const all: string[] = [];
  for (const tone of Object.values(PATTERN_MAP)) {
    all.push(tone.pageClass, tone.patternClass);
  }
  return [...new Set(all)];
}
