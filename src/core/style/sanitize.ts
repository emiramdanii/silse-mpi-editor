/**
 * Style Sanitizer (FASE 3 — Security Guard untuk customStyle dari AI).
 *
 * Layer: core/style (pure function, no React/DOM)
 * Allowed imports: none
 *
 * Kontrak:
 *   AI bisa kirim customStyle dengan CSS properties apa saja.
 *   Sanitizer ini MEMOTONG properti berbahaya (position, display, width, dll)
 *   dan hanya mengizinkan properti estetika (background, color, radius, shadow).
 *
 *   Pemisahan tugas:
 *     - Layout engine (position, left, top, width, height, display, z-index)
 *       → dikelola editor, AI TIDAK boleh override
 *     - Estetika (background, color, borderRadius, boxShadow, padding, dll)
 *       → AI boleh override via customStyle
 *
 *   Prinsip:
 *     - Pure function, no DOM, no React, no store.
 *     - Allow-list approach (whitelist) — bukan blacklist.
 *     - Unit normalisasi: angka → px (kecuali opacity, zIndex, lineHeight).
 *     - Font guard: filter forbidden fonts.
 *     - Negative margin: ditolak (bisa geser elemen ke luar kanvas).
 *     - Max fontSize: 96px (mencegah teks raksasa).
 */

// ---------------------------------------------------------------------------
// Allow-list: properti CSS yang BOLEH di-override oleh AI
// ---------------------------------------------------------------------------

const ALLOWED_CSS_PROPERTIES = new Set([
  // Background & color
  'background',
  'backgroundColor',
  'backgroundImage',
  'backgroundSize',
  'backgroundPosition',
  'backgroundRepeat',
  'backgroundClip',
  'color',
  'opacity',
  // Border & radius
  'border',
  'borderColor',
  'borderWidth',
  'borderStyle',
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  // Shadow
  'boxShadow',
  'textShadow',
  // Spacing (estetika, bukan layout)
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  // Typography
  'fontSize',
  'fontWeight',
  'fontFamily',
  'fontStyle',
  'letterSpacing',
  'lineHeight',
  'textAlign',
  'textDecoration',
  'textTransform',
  'textOverflow',
  'wordBreak',
  'overflowWrap',
  'whiteSpace',
  // Effects
  'transform',
  'transition',
  'animation',
  'backdropFilter',
  'filter',
  'cursor',
  'listStyle',
  'listStyleType',
  // Flex (untuk alignment teks di dalam elemen, bukan layout scene)
  'alignItems',
  'justifyContent',
  'gap',
  'flexDirection',
  'flexWrap',
]);

// ---------------------------------------------------------------------------
// Forbidden: properti yang AKAN DIHAPUS (AI tidak boleh override layout)
// ---------------------------------------------------------------------------

const FORBIDDEN_PROPERTIES = new Set([
  'position', 'left', 'top', 'right', 'bottom',
  'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
  'display', 'visibility', 'overflow', 'overflowX', 'overflowY',
  'zIndex', 'float', 'clear',
  'gridTemplateColumns', 'gridTemplateRows', 'gridColumn', 'gridRow',
]);

// ---------------------------------------------------------------------------
// Forbidden fonts (dari FONT-EDU-SAFETY-01)
// ---------------------------------------------------------------------------

const FORBIDDEN_FONTS = [
  'comic sans', 'comic neue', 'fredoka', 'baloo', 'bangers',
  'patrick hand', 'permanent marker', 'shadows into light',
  'cursive', 'script', 'brush script', 'lucida handwriting',
  'pacifico', 'dancing script', 'caveat', 'kalam',
  'fantasy', 'impact', 'broadway', 'showcard gothic',
  'chiller', 'jokerman', 'bebas', 'oswald', 'anton',
  'lobster', 'press start',
  // External fonts (tidak boleh karena no Google Fonts)
  'poppins', 'inter', 'geist', 'plus jakarta sans',
];

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------

const MAX_FONT_SIZE = 96; // px
const MAX_PADDING = 100; // px
const MAX_MARGIN = 80; // px
const MAX_BORDER_RADIUS = 100; // px
const MAX_LETTER_SPACING = 10; // px

// ---------------------------------------------------------------------------
// Sanitizer
// ---------------------------------------------------------------------------

export type StyleMap = Record<string, string>;
export type CustomStyleMap = Record<string, StyleMap>;

/**
 * Check if a font family string contains forbidden fonts.
 */
function containsForbiddenFont(fontFamily: string): boolean {
  const lower = fontFamily.toLowerCase();
  return FORBIDDEN_FONTS.some((f) => lower.includes(f));
}

/**
 * Normalize a CSS value:
 * - Numbers → add 'px' (except for opacity, zIndex, lineHeight)
 * - Clamp excessive values
 */
function normalizeValue(prop: string, value: string | number): string | undefined {
  // Handle numeric values
  if (typeof value === 'number') {
    // These properties use unitless numbers
    if (prop === 'opacity' || prop === 'zIndex' || prop === 'lineHeight') {
      return String(value);
    }
    // Clamp numeric values
    if (prop === 'fontSize' && value > MAX_FONT_SIZE) return `${MAX_FONT_SIZE}px`;
    if (prop === 'padding' && value > MAX_PADDING) return `${MAX_PADDING}px`;
    if (prop === 'margin' && value > MAX_MARGIN) return `${MAX_MARGIN}px`;
    if (prop === 'borderRadius' && value > MAX_BORDER_RADIUS) return `${MAX_BORDER_RADIUS}px`;
    if (prop === 'letterSpacing' && value > MAX_LETTER_SPACING) return `${MAX_LETTER_SPACING}px`;
    return `${value}px`;
  }

  // String values
  const str = String(value).trim();
  if (!str) return undefined;

  // Font guard
  if (prop === 'fontFamily' && containsForbiddenFont(str)) {
    return undefined; // Remove forbidden font
  }

  // Negative margin guard (prevent elements from shifting outside canvas)
  if ((prop === 'margin' || prop.startsWith('margin')) && str.startsWith('-')) {
    return '0px';
  }

  // Clamp fontSize if it's a string like "999px"
  if (prop === 'fontSize') {
    const numMatch = str.match(/^(\d+(?:\.\d+)?)px$/);
    if (numMatch) {
      const num = parseFloat(numMatch[1]);
      if (num > MAX_FONT_SIZE) return `${MAX_FONT_SIZE}px`;
    }
  }

  // Clamp borderRadius
  if (prop === 'borderRadius') {
    const numMatch = str.match(/^(\d+(?:\.\d+)?)px$/);
    if (numMatch) {
      const num = parseFloat(numMatch[1]);
      if (num > MAX_BORDER_RADIUS) return `${MAX_BORDER_RADIUS}px`;
    }
  }

  return str;
}

/**
 * Sanitize a single element's CSS properties.
 * Returns a new object with only allowed properties, normalized values.
 */
export function sanitizeElementStyle(style: StyleMap): StyleMap {
  const sanitized: StyleMap = {};

  for (const [prop, value] of Object.entries(style)) {
    // Skip forbidden properties (layout-critical)
    if (FORBIDDEN_PROPERTIES.has(prop)) continue;

    // Only allow whitelisted properties
    if (!ALLOWED_CSS_PROPERTIES.has(prop)) continue;

    // Normalize and clamp value
    const normalized = normalizeValue(prop, value);
    if (normalized !== undefined) {
      sanitized[prop] = normalized;
    }
  }

  return sanitized;
}

/**
 * Sanitize an entire customStyle map (all elements).
 * Returns a new map with only safe, normalized properties.
 */
export function sanitizeCustomStyle(customStyle: CustomStyleMap | undefined | null): CustomStyleMap | undefined {
  if (!customStyle || typeof customStyle !== 'object') return undefined;

  const sanitized: CustomStyleMap = {};
  for (const [elementKey, style] of Object.entries(customStyle)) {
    if (!style || typeof style !== 'object') continue;
    const clean = sanitizeElementStyle(style);
    if (Object.keys(clean).length > 0) {
      sanitized[elementKey] = clean;
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

/**
 * Convert sanitized style map to CSS string (for export HTML inline style).
 */
export function styleMapToCssString(style: StyleMap): string {
  const parts: string[] = [];
  for (const [prop, value] of Object.entries(style)) {
    // Convert camelCase to kebab-case
    const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
    parts.push(`${cssProp}:${value}`);
  }
  return parts.join(';');
}
