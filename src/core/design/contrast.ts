/**
 * Contrast Helper (CONTENT-VISUAL-CONTRACT-AUDIT-01).
 *
 * Layer: core/design (pure function, no React/DOM/window)
 * Allowed imports: none
 *
 * Kontrak:
 *   isDarkColor(color) — true jika luminance rendah
 *   getContrastRatio(foreground, background) — ratio 1-21 (WCAG)
 *   getReadableTextColor(backgroundColor) — '#ffffff' atau '#111827'
 *   getReadableMutedTextColor(backgroundColor) — terang-pucat atau gelap-pucat
 *
 *   Support: '#rgb' dan '#rrggbb'.
 *   No React, no DOM, no window. Pure function.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalize a hex color string. Returns '#rrggbb' or null if invalid.
 * Supports: '#rgb', '#rrggbb', 'rgb', 'rrggbb'.
 */
export function normalizeHexColor(color: string): string | null {
  if (!color || typeof color !== 'string') return null;
  let hex = color.trim().replace('#', '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  if (hex.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(hex)) {
    return null;
  }
  return '#' + hex.toLowerCase();
}

function parseHex(color: string): { r: number; g: number; b: number } {
  const normalized = normalizeHexColor(color);
  if (!normalized) {
    // Fallback to black for invalid input
    return { r: 0, g: 0, b: 0 };
  }
  const num = parseInt(normalized.replace('#', ''), 16);
  return {
    r: (num >> 16) & 0xff,
    g: (num >> 8) & 0xff,
    b: num & 0xff,
  };
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function isDarkColor(color: string): boolean {
  const { r, g, b } = parseHex(color);
  return getLuminance(r, g, b) < 0.5;
}

export function getContrastRatio(foreground: string, background: string): number {
  const fg = parseHex(foreground);
  const bg = parseHex(background);
  const l1 = getLuminance(fg.r, fg.g, fg.b);
  const l2 = getLuminance(bg.r, bg.g, bg.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getReadableTextColor(backgroundColor: string): string {
  return isDarkColor(backgroundColor) ? '#ffffff' : '#111827';
}

export function getReadableMutedTextColor(backgroundColor: string): string {
  return isDarkColor(backgroundColor) ? '#d1d5db' : '#6b7280';
}

// ---------------------------------------------------------------------------
// EXPORT-CONTRAST-01: Contrast-aware text color for scenes with dark backgrounds.
// Cover/closing scenes often use dark gradient backgrounds, but contract.palette.text
// is dark (#1f2937). This helper returns white text when the scene role is known
// to have a dark background (cover, closing), ensuring readability.
//
// FIX: Sebelumnya return 'var(--silse-color-surface)' — tapi surface adalah
// background panel, BUKAN text color. Konflik dengan contrast-guard yang
// darken surface untuk dark theme → teks jadi gelap di atas bg gelap.
// Sekarang return '#ffffff' langsung untuk dark background roles.
// Pure function — no React, no DOM, no window.
// ---------------------------------------------------------------------------

export const DARK_BACKGROUND_ROLES = new Set(['cover', 'closing']);

export function getContrastAwareTextColor(role: string | undefined, defaultColor: string): string {
  if (role && DARK_BACKGROUND_ROLES.has(role)) {
    // Cover/closing punya dark gradient background → teks harus putih.
    // Jangan pakai var(--silse-color-surface) — itu untuk panel bg, bukan text.
    return '#ffffff';
  }
  return defaultColor;
}
