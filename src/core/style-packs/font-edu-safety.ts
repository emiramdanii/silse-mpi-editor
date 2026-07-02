/**
 * Font Education Safety Guard (FONT-EDU-SAFETY-01).
 *
 * Layer: core/style-packs (pure function, no React/DOM)
 * Allowed imports: ../mpi-design-contract, ../style-types, ../style-presets
 *
 * Kontrak:
 *   Pure helper that audits typography across the app to keep it
 *   education-friendly:
 *     - max 2-3 font family tokens per design contract
 *     - no decorative / comic / script / cursive / fantasy / display fonts
 *     - body font must be sans-serif (readable on projector 16:9)
 *     - title font may be bold but still formal-educative
 *     - no external font URLs / Google Fonts / CDN
 *     - title size 28-44px, subtitle 16-22px, body 15-18px, label >= 11px
 *
 *   Prinsip:
 *     - Pure function, no DOM, no React, no store.
 *     - Defensive: unknown values return issues, never throw.
 *     - Used by tests AND can be wired into picker for live badge.
 */

import type { MpiDesignContract, DesignTypography } from '../mpi-design-contract';
import type { StylePack } from '../style-types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FontEduSafetyIssue = {
  scope: string; // 'contract:default' | 'contract:mission-dark' | 'stylePack:brightKids' | 'export-html' | 'styles.css'
  field: string;
  message: string;
};

export type FontEduSafetyLimits = {
  maxFontFamilyTokens: number;
  // Size ranges (px). 0 means "no upper bound".
  titleSizeMin: number;
  titleSizeMax: number;
  subtitleSizeMin: number;
  subtitleSizeMax: number;
  bodySizeMin: number;
  bodySizeMax: number;
  labelSizeMin: number;
  labelSizeMax: number;
};

export const DEFAULT_FONT_EDU_SAFETY_LIMITS: FontEduSafetyLimits = {
  maxFontFamilyTokens: 3,
  titleSizeMin: 28,
  titleSizeMax: 44,
  subtitleSizeMin: 16,
  subtitleSizeMax: 22,
  bodySizeMin: 15,
  bodySizeMax: 18,
  labelSizeMin: 11,
  labelSizeMax: 13,
};

// ---------------------------------------------------------------------------
// Forbidden font detection
// ---------------------------------------------------------------------------

/**
 * Font family names that are decorative / comic / script / cursive / fantasy
 * and MUST NOT appear in any education-friendly typography stack.
 *
 * Matched case-insensitive against the raw font-family string.
 */
export const FORBIDDEN_FONT_KEYWORDS: readonly string[] = [
  // Comic / playful
  'comic sans',
  'comic Neue',
  'fredoka',
  'baloo',
  'poppins', // often used as decorative display — keep education formal
  'bangers',
  'patrick hand',
  'permanent marker',
  'shadows into light',
  // Script / cursive
  'cursive',
  'script',
  'brush script',
  'lucida handwriting',
  'pacifico',
  'dancing script',
  'caveat',
  'kalam',
  // Fantasy / display
  'fantasy',
  'impact',
  'broadway',
  'showcard gothic',
  'chiller',
  'jokerman',
  // Display / poster-style
  'bebas',
  'oswald', // ok for headlines but too poster-like for edu body
  'anton',
  'raleway', // ok but heavy — discourage
  'lobster',
  'press start',
];

/**
 * Check if a font-family string contains any forbidden keyword.
 * Returns the first forbidden keyword found, or null if clean.
 *
 * Defensive: handles undefined / non-string input by returning null
 * (no font = no violation; the caller's presence-check is separate).
 */
export function findForbiddenFontKeyword(fontFamily: unknown): string | null {
  if (typeof fontFamily !== 'string') return null;
  const lower = fontFamily.toLowerCase();
  for (const kw of FORBIDDEN_FONT_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      return kw;
    }
  }
  return null;
}

/**
 * Check if a font-family string declares a generic family that is
 * forbidden for body text (cursive, fantasy, script). Monospace is
 * allowed ONLY for code-style blocks (not body) — caller decides.
 */
export function hasForbiddenGenericFamily(fontFamily: unknown): 'cursive' | 'fantasy' | 'monospace' | null {
  if (typeof fontFamily !== 'string') return null;
  const lower = fontFamily.toLowerCase();
  // Check the last token (generic family) — but also flag if it appears anywhere
  // as the primary intent.
  if (/\bcursive\b/.test(lower)) return 'cursive';
  if (/\bfantasy\b/.test(lower)) return 'fantasy';
  if (/\bmonospace\b/.test(lower)) return 'monospace';
  return null;
}

// ---------------------------------------------------------------------------
// External font URL detection
// ---------------------------------------------------------------------------

/**
 * Patterns that indicate an external font reference (Google Fonts, CDN, etc.).
 * Education-friendly app must use system font stacks only — no remote fonts.
 */
const EXTERNAL_FONT_PATTERNS: readonly RegExp[] = [
  /@import\s+url\([^)]*fonts\.googleapis\.com/i,
  /@import\s+url\([^)]*fonts\.gstatic\.com/i,
  /<link[^>]+href=["']https?:\/\/fonts\.googleapis\.com/i,
  /<link[^>]+href=["']https?:\/\/fonts\.gstatic\.com/i,
  /url\([^)]*\.woff2?\)/i, // local or remote @font-face — no web fonts at all
  /url\([^)]*\.ttf\)/i,
  /url\([^)]*\.otf\)/i,
  /https?:\/\/[^/]*fonts\.[^/]+\//i, // any *fonts.* domain
];

/**
 * Check a CSS/HTML string for external font references.
 * Returns the first matching pattern description, or null if clean.
 */
export function findExternalFontReference(text: unknown): string | null {
  if (typeof text !== 'string') return null;
  for (const p of EXTERNAL_FONT_PATTERNS) {
    const m = text.match(p);
    if (m) return m[0];
  }
  return null;
}

// ---------------------------------------------------------------------------
// Font family token counting
// ---------------------------------------------------------------------------

/**
 * Count distinct font-family tokens in a contract's typography.
 * A "token" is a named font family (e.g. "Trebuchet MS", "Segoe UI").
 * Generic families (sans-serif, serif, monospace) are NOT counted.
 *
 * Returns the count across heroFont + bodyFont combined.
 */
export function countDistinctFontFamilyTokens(typography: DesignTypography | undefined | null): number {
  if (!typography) return 0;
  const tokens = new Set<string>();
  const collect = (fontStr: string | undefined) => {
    if (!fontStr) return;
    // Split by comma, strip quotes, normalize, skip generics
    const parts = fontStr.split(',').map((s) => s.trim().replace(/^["']|["']$/g, '').trim());
    for (const p of parts) {
      if (!p) continue;
      const lower = p.toLowerCase();
      // Skip generic families
      if (['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-sans-serif', 'ui-serif', 'ui-monospace'].includes(lower)) continue;
      // Skip OS prefixes like -apple-system, BlinkMacSystemFont
      if (lower.startsWith('-apple-') || lower.startsWith('blinkmacsystemfont')) continue;
      tokens.add(lower);
    }
  };
  collect(typography.heroFont);
  collect(typography.bodyFont);
  return tokens.size;
}

// ---------------------------------------------------------------------------
// Typography audit — DesignTypography (from contract)
// ---------------------------------------------------------------------------

export function checkTypographyEduSafety(
  typography: DesignTypography | undefined | null,
  scope: string,
  limits: FontEduSafetyLimits = DEFAULT_FONT_EDU_SAFETY_LIMITS,
): FontEduSafetyIssue[] {
  const issues: FontEduSafetyIssue[] = [];
  if (!typography) {
    issues.push({ scope, field: 'typography', message: 'typography is missing' });
    return issues;
  }

  // 1. Forbidden font keywords
  const heroForbidden = findForbiddenFontKeyword(typography.heroFont);
  if (heroForbidden) {
    issues.push({
      scope,
      field: 'typography.heroFont',
      message: `heroFont contains forbidden decorative font keyword "${heroForbidden}"`,
    });
  }
  const bodyForbidden = findForbiddenFontKeyword(typography.bodyFont);
  if (bodyForbidden) {
    issues.push({
      scope,
      field: 'typography.bodyFont',
      message: `bodyFont contains forbidden decorative font keyword "${bodyForbidden}"`,
    });
  }

  // 2. Forbidden generic family for body (cursive / fantasy / monospace)
  const bodyGeneric = hasForbiddenGenericFamily(typography.bodyFont);
  if (bodyGeneric && bodyGeneric !== 'monospace') {
    // monospace is allowed for body only in code blocks — for general body, flag it
    issues.push({
      scope,
      field: 'typography.bodyFont',
      message: `bodyFont uses forbidden generic family "${bodyGeneric}" — body must be sans-serif`,
    });
  }
  if (bodyGeneric === 'monospace') {
    // monospace as body font is discouraged for general education content
    issues.push({
      scope,
      field: 'typography.bodyFont',
      message: 'bodyFont uses monospace — discouraged for general education body text (use sans-serif)',
    });
  }

  // 3. Max font family tokens
  const tokenCount = countDistinctFontFamilyTokens(typography);
  if (tokenCount > limits.maxFontFamilyTokens) {
    issues.push({
      scope,
      field: 'typography',
      message: `distinct font family tokens ${tokenCount} exceeds max ${limits.maxFontFamilyTokens}`,
    });
  }

  // 4. Size range checks (only if values are present)
  const checkSize = (field: keyof DesignTypography, value: number | undefined, min: number, max: number) => {
    if (value === undefined || value === null) return;
    if (typeof value !== 'number') return;
    if (value < min) {
      issues.push({ scope, field: `typography.${field}`, message: `${value}px is below min ${min}px` });
    }
    if (value > max) {
      issues.push({ scope, field: `typography.${field}`, message: `${value}px exceeds max ${max}px` });
    }
  };
  checkSize('titleSize', typography.titleSize as number, limits.titleSizeMin, limits.titleSizeMax);
  checkSize('subtitleSize', typography.subtitleSize as number, limits.subtitleSizeMin, limits.subtitleSizeMax);
  checkSize('bodySize', typography.bodySize as number, limits.bodySizeMin, limits.bodySizeMax);
  checkSize('labelSize', typography.labelSize as number, limits.labelSizeMin, limits.labelSizeMax);

  return issues;
}

// ---------------------------------------------------------------------------
// Contract audit — MpiDesignContract (default + all style-packs in registry)
// ---------------------------------------------------------------------------

export function checkContractEduSafety(
  contract: MpiDesignContract,
  scope: string,
  limits: FontEduSafetyLimits = DEFAULT_FONT_EDU_SAFETY_LIMITS,
): FontEduSafetyIssue[] {
  return checkTypographyEduSafety(contract.typography, scope, limits);
}

// ---------------------------------------------------------------------------
// StylePack audit (legacy style-presets.ts packs)
// ---------------------------------------------------------------------------

export function checkStylePackEduSafety(
  pack: StylePack,
  scope: string,
  _limits?: FontEduSafetyLimits,
): FontEduSafetyIssue[] {
  // NOTE: Legacy StylePack typography (in style-presets.ts) uses a different
  // structure than the DesignTypography in mpi-design-contract. The legacy
  // packs are used as BASES for the V1 style pack system — their sizes are
  // not directly rendered. The active render path goes through the DesignContract,
  // which is audited strictly by checkContractEduSafety().
  //
  // For legacy packs, we ONLY check:
  //   - forbidden decorative font keywords (Comic Sans, Fredoka, cursive, etc.)
  //   - forbidden generic families for body (cursive, fantasy)
  //   - monospace as body (discouraged)
  // We do NOT check sizes here — the design contract is the authority on sizes.
  const issues: FontEduSafetyIssue[] = [];
  if (!pack.typography) {
    issues.push({ scope, field: 'typography', message: 'StylePack typography is missing' });
    return issues;
  }
  const fontFamily = pack.typography.fontFamily;
  const forbidden = findForbiddenFontKeyword(fontFamily);
  if (forbidden) {
    issues.push({
      scope,
      field: 'typography.fontFamily',
      message: `fontFamily contains forbidden decorative font keyword "${forbidden}"`,
    });
  }
  const generic = hasForbiddenGenericFamily(fontFamily);
  if (generic && generic !== 'monospace') {
    issues.push({
      scope,
      field: 'typography.fontFamily',
      message: `fontFamily uses forbidden generic family "${generic}" — must be sans-serif`,
    });
  }
  if (generic === 'monospace') {
    issues.push({
      scope,
      field: 'typography.fontFamily',
      message: 'fontFamily uses monospace — discouraged for general education body text',
    });
  }
  return issues;
}

// ---------------------------------------------------------------------------
// CSS / HTML source audit — scan for external fonts + forbidden fonts in CSS
// ---------------------------------------------------------------------------

export function checkCssSourceEduSafety(
  cssText: string,
  scope: string,
): FontEduSafetyIssue[] {
  const issues: FontEduSafetyIssue[] = [];
  const ext = findExternalFontReference(cssText);
  if (ext) {
    issues.push({
      scope,
      field: 'external-font',
      message: `CSS contains external font reference: "${ext}"`,
    });
  }
  // Scan for forbidden font keywords in font-family declarations
  const fontFamilyDecls = cssText.match(/font-family\s*:\s*([^;]+)/gi) || [];
  for (const decl of fontFamilyDecls) {
    const forbidden = findForbiddenFontKeyword(decl);
    if (forbidden) {
      issues.push({
        scope,
        field: 'font-family',
        message: `CSS font-family declaration contains forbidden keyword "${forbidden}": ${decl.trim()}`,
      });
    }
  }
  return issues;
}

export function checkHtmlSourceEduSafety(
  htmlText: string,
  scope: string,
): FontEduSafetyIssue[] {
  const issues: FontEduSafetyIssue[] = [];
  const ext = findExternalFontReference(htmlText);
  if (ext) {
    issues.push({
      scope,
      field: 'external-font',
      message: `HTML contains external font reference: "${ext}"`,
    });
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Combined audit — run all checks and return every issue
// ---------------------------------------------------------------------------

export function checkAllEduSafety(
  contracts: Array<{ contract: MpiDesignContract; scope: string }>,
  packs: Array<{ pack: StylePack; scope: string }>,
  cssSources: Array<{ text: string; scope: string }>,
  htmlSources: Array<{ text: string; scope: string }>,
  limits: FontEduSafetyLimits = DEFAULT_FONT_EDU_SAFETY_LIMITS,
): FontEduSafetyIssue[] {
  const all: FontEduSafetyIssue[] = [];
  for (const { contract, scope } of contracts) {
    all.push(...checkContractEduSafety(contract, scope, limits));
  }
  for (const { pack, scope } of packs) {
    all.push(...checkStylePackEduSafety(pack, scope, limits));
  }
  for (const { text, scope } of cssSources) {
    all.push(...checkCssSourceEduSafety(text, scope));
  }
  for (const { text, scope } of htmlSources) {
    all.push(...checkHtmlSourceEduSafety(text, scope));
  }
  return all;
}
