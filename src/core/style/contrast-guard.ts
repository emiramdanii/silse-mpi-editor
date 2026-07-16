/**
 * Contrast Guard — WCAG 2.1 contrast validator & auto-fixer.
 *
 * Layer: core/style (pure function, no React/DOM)
 * Allowed imports: none
 *
 * Kontrak:
 *   Pure functions untuk hitung luminance (WCAG 2.1), rasio kontras, dan
 *   auto-correct warna yang gagal threshold. Dipakai di:
 *     - aiBlueprintToSimpleProject (auto-fix saat AI import)
 *
 * Prinsip:
 *   - AI buta warna secara visual. Jangan biarkan AI menebak hex kontras.
 *   - Mesin yang hitung matematis (luminance + contrast ratio).
 *   - Auto-correct hanya jika gagal threshold, bukan rewrite total palette.
 *   - Threshold 4.5:1 (WCAG AA untuk normal text), 3:1 (AA untuk large text/border).
 */

// ---------------------------------------------------------------------------
// Color parsing & luminance (WCAG 2.1 formula)
// ---------------------------------------------------------------------------

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  if (typeof hex !== 'string') return null;
  let clean = hex.trim().replace(/^#/, '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length === 8) {
    clean = clean.substring(0, 6);
  }
  if (clean.length !== 6 || !/^[0-9a-f]{6}$/i.test(clean)) {
    return null;
  }
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

/**
 * Hitung Relative Luminance (WCAG 2.1).
 * Returns 0 (darkest) to 1 (brightest). Invalid hex → 0.
 */
export function getLuminance(hex: string): number {
  const parsed = parseHex(hex);
  if (!parsed) return 0;
  const { r, g, b } = parsed;
  const normalize = (v: number) => v / 255;
  const linearize = (v: number) => {
    const n = normalize(v);
    return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * Hitung Contrast Ratio (WCAG 2.1).
 * Range: 1.0 (same color) to 21.0 (black vs white).
 * - 4.5:1 = WCAG AA untuk normal text
 * - 3.0:1 = WCAG AA untuk large text
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

export const CONTRAST_THRESHOLDS = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3.0,
  AAA_NORMAL: 7.0,
  UI_MINIMUM: 3.0,
} as const;

// ---------------------------------------------------------------------------
// Auto-correct helpers
// ---------------------------------------------------------------------------

/**
 * Pilih warna teks dengan kontras terbaik terhadap background.
 * '#ffffff' (putih) jika bg gelap, '#0b1728' (dark navy) jika bg terang.
 */
export function getReadableTextColor(bgColor: string): string {
  return getLuminance(bgColor) < 0.5 ? '#ffffff' : '#0b1728';
}

/**
 * Verify & auto-fix text contrast.
 * Jika rasio < threshold, kembalikan warna teks yang kontrasnya memenuhi.
 */
export function verifyAndFixTextContrast(
  bgColor: string,
  textColor: string,
  threshold: number = CONTRAST_THRESHOLDS.AA_NORMAL,
): { text: string; fixed: boolean; ratio: number } {
  const ratio = getContrastRatio(bgColor, textColor);
  if (ratio >= threshold) {
    return { text: textColor, fixed: false, ratio };
  }
  return { text: getReadableTextColor(bgColor), fixed: true, ratio };
}

/**
 * Detect if color is dark theme (luminance < 0.5).
 */
export function isDarkColor(hex: string): boolean {
  return getLuminance(hex) < 0.5;
}

/**
 * Lighten a dark hex color by N units (add to RGB channels).
 * Used to derive a slightly lighter dark shade for gradient endpoints.
 */
export function lightenDarkColor(hex: string, amount: number): string {
  const m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return hex;
  const r = Math.min(255, parseInt(m[1], 16) + amount);
  const g = Math.min(255, parseInt(m[2], 16) + amount);
  const b = Math.min(255, parseInt(m[3], 16) + amount);
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

/**
 * Darken a light hex color by N units (subtract from RGB channels).
 * Used to derive a dark surface from a light surface when bg is dark.
 */
export function darkenLightColor(hex: string, amount: number): string {
  const m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return hex;
  const r = Math.max(0, parseInt(m[1], 16) - amount);
  const g = Math.max(0, parseInt(m[2], 16) - amount);
  const b = Math.max(0, parseInt(m[3], 16) - amount);
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}
