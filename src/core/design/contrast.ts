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

function parseHex(color: string): { r: number; g: number; b: number } {
  let hex = color.replace('#', '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const num = parseInt(hex, 16);
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
