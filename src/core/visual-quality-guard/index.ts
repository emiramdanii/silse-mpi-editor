/**
 * Visual Quality Guard helpers (VISUAL-QUALITY-GUARD-01).
 *
 * Layer: core/visual-quality-guard (pure functions, no React/DOM)
 * Allowed imports: none (pure helpers)
 *
 * Kontrak:
 *   Pure functions untuk mengunci kualitas visual MPI:
 *     - Safe zone (48px) — elemen utama tidak keluar safe area canvas.
 *     - Grid alignment (8px) — placement slot utama kelipatan 8px.
 *     - Typography scale — heading/body/caption minimal size + weight + line-height.
 *     - Contrast ratio — WCAG 2.1 contrast ratio (4.5 body, 3.0 large text).
 *     - Touch target — minimal height untuk elemen interaktif.
 *
 *   Prinsip:
 *     - Pure function, no DOM, no React, no store.
 *     - Tidak mengubah design contract.
 *     - Tidak membuat style pack baru.
 *     - Bukan premium style — hanya guard.
 *     - Boleh dipakai oleh test, renderer, atau editor untuk validasi.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CanvasSize = {
  width: number;
  height: number;
};

export type SafeZone = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type SafeZoneViolation = {
  rect: Rect;
  violation: 'out-left' | 'out-right' | 'out-top' | 'out-bottom';
  extent: number; // how many px outside the safe zone
};

export type GridViolation = {
  field: 'x' | 'y' | 'width' | 'height';
  value: number;
  remainder: number; // value % gridSize
};

export type ContrastResult = {
  ratio: number;
  passes: { aaNormal: boolean; aaLarge: boolean; aaaNormal: boolean; aaaLarge: boolean };
};

// ---------------------------------------------------------------------------
// Safe zone guard (Scope B)
// ---------------------------------------------------------------------------

/**
 * Default safe zone: 48px on all sides.
 * Sesuai instruksi: "left/right/top/bottom safe zone = 48px".
 */
export const DEFAULT_SAFE_ZONE: SafeZone = {
  top: 48,
  right: 48,
  bottom: 48,
  left: 48,
};

/**
 * Check if a rect is fully within the safe zone of a canvas.
 * Returns true if all 4 edges are inside the safe zone.
 * Pure function.
 */
export function isWithinSafeZone(
  rect: Rect,
  canvasSize: CanvasSize,
  safeZone: SafeZone = DEFAULT_SAFE_ZONE,
): boolean {
  const minX = safeZone.left;
  const minY = safeZone.top;
  const maxX = canvasSize.width - safeZone.right;
  const maxY = canvasSize.height - safeZone.bottom;
  return (
    rect.x >= minX &&
    rect.y >= minY &&
    rect.x + rect.width <= maxX &&
    rect.y + rect.height <= maxY
  );
}

/**
 * Get safe zone violations for a rect.
 * Returns array of violations (empty if all within safe zone).
 * Pure function.
 */
export function getSafeZoneViolations(
  rect: Rect,
  canvasSize: CanvasSize,
  safeZone: SafeZone = DEFAULT_SAFE_ZONE,
): SafeZoneViolation[] {
  const violations: SafeZoneViolation[] = [];
  if (rect.x < safeZone.left) {
    violations.push({ rect, violation: 'out-left', extent: safeZone.left - rect.x });
  }
  if (rect.y < safeZone.top) {
    violations.push({ rect, violation: 'out-top', extent: safeZone.top - rect.y });
  }
  if (rect.x + rect.width > canvasSize.width - safeZone.right) {
    violations.push({
      rect,
      violation: 'out-right',
      extent: rect.x + rect.width - (canvasSize.width - safeZone.right),
    });
  }
  if (rect.y + rect.height > canvasSize.height - safeZone.bottom) {
    violations.push({
      rect,
      violation: 'out-bottom',
      extent: rect.y + rect.height - (canvasSize.height - safeZone.bottom),
    });
  }
  return violations;
}

// ---------------------------------------------------------------------------
// Grid alignment guard (Scope C)
// ---------------------------------------------------------------------------

/**
 * Default grid size: 8px.
 * Sesuai instruksi: "x, y, width, height slot utama harus kelipatan 8px".
 */
export const DEFAULT_GRID_SIZE = 8;

/**
 * Check if a value is aligned to the grid.
 * Pure function.
 */
export function isGridAligned(value: number, gridSize: number = DEFAULT_GRID_SIZE): boolean {
  return value % gridSize === 0;
}

/**
 * Get grid violations for a rect.
 * Returns array of fields that are not aligned to the grid.
 * Pure function.
 */
export function getGridViolations(
  rect: Rect,
  gridSize: number = DEFAULT_GRID_SIZE,
): GridViolation[] {
  const violations: GridViolation[] = [];
  const fields: Array<keyof Rect> = ['x', 'y', 'width', 'height'];
  for (const field of fields) {
    const value = rect[field];
    const remainder = value % gridSize;
    if (remainder !== 0) {
      violations.push({ field, value, remainder });
    }
  }
  return violations;
}

/**
 * Check if all 4 fields of a rect are aligned to the grid.
 * Pure function.
 */
export function isRectGridAligned(
  rect: Rect,
  gridSize: number = DEFAULT_GRID_SIZE,
): boolean {
  return getGridViolations(rect, gridSize).length === 0;
}

// ---------------------------------------------------------------------------
// Typography guard (Scope D)
// ---------------------------------------------------------------------------

/**
 * Typography scale rules.
 * Sesuai instruksi:
 *   - heading >= 28px
 *   - body >= 16px
 *   - caption >= 12px
 *   - line-height body minimal 1.4
 *   - font weight heading >= 600
 */
export const TYPOGRAPHY_RULES = {
  heading: { minSize: 28, minWeight: 600 },
  body: { minSize: 16, minLineHeight: 1.4 },
  caption: { minSize: 12 },
} as const;

export type TypographyKind = 'heading' | 'body' | 'caption';

export type TypographyViolation = {
  kind: TypographyKind;
  rule: string;
  expected: string;
  actual: string;
};

/**
 * Check typography against rules.
 * Returns array of violations (empty if all rules pass).
 * Pure function.
 */
export function getTypographyViolations(opts: {
  kind: TypographyKind;
  fontSize?: number;
  fontWeight?: number;
  lineHeight?: number;
}): TypographyViolation[] {
  const violations: TypographyViolation[] = [];
  const { kind, fontSize, fontWeight, lineHeight } = opts;

  if (kind === 'heading') {
    if (fontSize !== undefined && fontSize < TYPOGRAPHY_RULES.heading.minSize) {
      violations.push({
        kind,
        rule: 'minSize',
        expected: `>= ${TYPOGRAPHY_RULES.heading.minSize}px`,
        actual: `${fontSize}px`,
      });
    }
    if (fontWeight !== undefined && fontWeight < TYPOGRAPHY_RULES.heading.minWeight) {
      violations.push({
        kind,
        rule: 'minWeight',
        expected: `>= ${TYPOGRAPHY_RULES.heading.minWeight}`,
        actual: `${fontWeight}`,
      });
    }
  }

  if (kind === 'body') {
    if (fontSize !== undefined && fontSize < TYPOGRAPHY_RULES.body.minSize) {
      violations.push({
        kind,
        rule: 'minSize',
        expected: `>= ${TYPOGRAPHY_RULES.body.minSize}px`,
        actual: `${fontSize}px`,
      });
    }
    if (lineHeight !== undefined && lineHeight < TYPOGRAPHY_RULES.body.minLineHeight) {
      violations.push({
        kind,
        rule: 'minLineHeight',
        expected: `>= ${TYPOGRAPHY_RULES.body.minLineHeight}`,
        actual: `${lineHeight}`,
      });
    }
  }

  if (kind === 'caption') {
    if (fontSize !== undefined && fontSize < TYPOGRAPHY_RULES.caption.minSize) {
      violations.push({
        kind,
        rule: 'minSize',
        expected: `>= ${TYPOGRAPHY_RULES.caption.minSize}px`,
        actual: `${fontSize}px`,
      });
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Contrast guard (Scope E)
// ---------------------------------------------------------------------------

/**
 * Parse a hex color (#rgb, #rrggbb, #rrggbbaa) to { r, g, b }.
 * Returns null if the input is not a valid hex color.
 * Pure function.
 */
export function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  if (!hex || typeof hex !== 'string') return null;
  let h = hex.trim();
  if (h.startsWith('#')) h = h.slice(1);
  // Expand shorthand #rgb → #rrggbb
  if (h.length === 3) {
    h = h.split('').map((c) => c + c).join('');
  }
  if (h.length !== 6 && h.length !== 8) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return { r, g, b };
}

/**
 * Extract the first hex color from a CSS color string.
 * Handles:
 *   - "#1d3557"
 *   - "rgba(255,255,255,0.04)"
 *   - "linear-gradient(145deg, #fff8e7, #fff)"
 * Returns the first hex color found, or null.
 * Pure function.
 */
export function extractHexColor(cssColor: string): string | null {
  if (!cssColor || typeof cssColor !== 'string') return null;
  // Try direct hex match first.
  const hexMatch = cssColor.match(/#([0-9a-fA-F]{3,8})/);
  if (hexMatch) return `#${hexMatch[1]}`;
  // Try rgba(r,g,b,a) or rgb(r,g,b).
  const rgbaMatch = cssColor.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1], 10);
    const g = parseInt(rgbaMatch[2], 10);
    const b = parseInt(rgbaMatch[3], 10);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  return null;
}

/**
 * Calculate the relative luminance of a color (WCAG 2.1).
 * Pure function.
 */
export function relativeLuminance(hex: string): number | null {
  const rgb = parseHexColor(hex);
  if (!rgb) return null;
  const linearize = (c: number) => {
    const srgb = c / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  };
  const r = linearize(rgb.r);
  const g = linearize(rgb.g);
  const b = linearize(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate WCAG 2.1 contrast ratio between two hex colors.
 * Returns ratio (1.0 to 21.0) or null if either color is invalid.
 * Pure function.
 */
export function contrastRatio(foreground: string, background: string): number | null {
  const fgLum = relativeLuminance(foreground);
  const bgLum = relativeLuminance(background);
  if (fgLum === null || bgLum === null) return null;
  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check contrast against WCAG thresholds.
 *   - AA normal text: >= 4.5
 *   - AA large text (>= 18pt or >= 14pt bold): >= 3.0
 *   - AAA normal text: >= 7.0
 *   - AAA large text: >= 4.5
 * Pure function.
 */
export function checkContrast(foreground: string, background: string): ContrastResult | null {
  const ratio = contrastRatio(foreground, background);
  if (ratio === null) return null;
  return {
    ratio,
    passes: {
      aaNormal: ratio >= 4.5,
      aaLarge: ratio >= 3.0,
      aaaNormal: ratio >= 7.0,
      aaaLarge: ratio >= 4.5,
    },
  };
}

// ---------------------------------------------------------------------------
// Touch target guard (Scope F)
// ---------------------------------------------------------------------------

/**
 * Touch target rules.
 * Sesuai instruksi:
 *   - button/action/chip interactive >= 44px height
 *   - classification item >= 40px height
 *   - tab button >= 40px height
 */
export const TOUCH_TARGET_RULES = {
  button: 44,
  action: 44,
  chip: 44,
  tab: 40,
  classificationItem: 40,
} as const;

export type TouchTargetKind = keyof typeof TOUCH_TARGET_RULES;

export type TouchTargetViolation = {
  kind: TouchTargetKind;
  expected: number;
  actual: number;
};

/**
 * Check touch target height against rules.
 * Returns violation if height is below the minimum.
 * Pure function.
 */
export function getTouchTargetViolation(
  kind: TouchTargetKind,
  height: number,
): TouchTargetViolation | null {
  const min = TOUCH_TARGET_RULES[kind];
  if (height < min) {
    return { kind, expected: min, actual: height };
  }
  return null;
}

/**
 * Check if a height passes the touch target rule for a given kind.
 * Pure function.
 */
export function passesTouchTarget(
  kind: TouchTargetKind,
  height: number,
): boolean {
  return height >= TOUCH_TARGET_RULES[kind];
}
