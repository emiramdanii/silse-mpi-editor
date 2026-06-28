/**
 * Design Tokens V1 (DESIGN-INTELLIGENCE-ENGINE-V1).
 *
 * Layer: core/design (pure function, no React/DOM/window)
 * Allowed imports: ../style-types, ../style-presets
 *
 * Kontrak (DIE-V1 Scope 1):
 *   deriveDesignTokens(tokens) menghasilkan design tokens turunan yang
 *   dibutuhkan oleh layout recipes, quality checker, dan component views.
 *   V1 derive dari style pack lama agar tidak breaking schema.
 */

import type { StyleTokens } from '../style-types';
import { DEFAULT_STYLE_PACK, stylePackToProjectStyle } from '../style-presets';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DesignTokens = {
  // Derived colors
  primarySoft: string;
  onPrimary: string;
  onPrimarySoft: string;
  surfaceAlt: string;
  onSurface: string;

  // Spacing
  safeArea: number;
  sectionGap: number;
  cardPadding: number;
  controlGap: number;

  // Typography
  heroTitle: number;
  pageTitle: number;
  subtitle: number;
  body: number;
  small: number;
  button: number;

  // Radius + shadow (passthrough for convenience)
  radiusSmall: number;
  radiusMedium: number;
  radiusLarge: number;
  shadowSoft: string;
  shadowMedium: string;

  // Canvas
  canvasWidth: number;
  canvasHeight: number;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Mix two hex colors by ratio (0 = color A, 1 = color B).
 */
function mixHex(a: string, b: string, ratio: number): string {
  const pa = parseInt(a.replace('#', ''), 16);
  const pb = parseInt(b.replace('#', ''), 16);
  const ar = (pa >> 16) & 0xff, ag = (pa >> 8) & 0xff, ab = pa & 0xff;
  const br = (pb >> 16) & 0xff, bg = (pb >> 8) & 0xff, bb = pb & 0xff;
  const r = Math.round(ar + (br - ar) * ratio);
  const g = Math.round(ag + (bg - ag) * ratio);
  const bl = Math.round(ab + (bb - ab) * ratio);
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}

/**
 * Determine if a color is "light" (for choosing onPrimary text color).
 */
function isLightColor(hex: string): boolean {
  const p = parseInt(hex.replace('#', ''), 16);
  const r = (p >> 16) & 0xff, g = (p >> 8) & 0xff, b = p & 0xff;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55;
}

// ---------------------------------------------------------------------------
// Main: deriveDesignTokens
// ---------------------------------------------------------------------------

export function deriveDesignTokens(tokens: StyleTokens): DesignTokens {
  const { colors, typography, spacing, radius, shadow } = tokens;

  return {
    primarySoft: mixHex(colors.surface, colors.primary, 0.15),
    onPrimary: isLightColor(colors.primary) ? '#1f2533' : '#ffffff',
    onPrimarySoft: colors.text,
    surfaceAlt: mixHex(colors.background, colors.surface, 0.5),
    onSurface: colors.text,

    safeArea: Math.max(spacing.pagePadding, 40),
    sectionGap: spacing.componentGap * 2,
    cardPadding: spacing.cardPadding,
    controlGap: Math.max(spacing.componentGap, 8),

    heroTitle: Math.round(typography.titleSize * 1.8),
    pageTitle: typography.titleSize,
    subtitle: typography.subtitleSize,
    body: typography.bodySize,
    small: typography.smallSize,
    button: typography.bodySize,

    radiusSmall: radius.small,
    radiusMedium: radius.medium,
    radiusLarge: radius.large,
    shadowSoft: shadow.soft,
    shadowMedium: shadow.medium,

    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
  };
}

export function getDefaultDesignTokens(): DesignTokens {
  return deriveDesignTokens(stylePackToProjectStyle(DEFAULT_STYLE_PACK).tokens);
}
