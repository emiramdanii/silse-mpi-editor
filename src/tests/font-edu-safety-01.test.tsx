/**
 * FONT-EDU-SAFETY-01 — Educational Typography Guard.
 *
 * Scope (per senior reviewer spec):
 *   1. tidak ada import Google Fonts/CDN
 *   2. tidak ada font-family cursive/fantasy/script/decorative
 *   3. max 2–3 font family tokens di design contract
 *   4. body font tidak memakai display font
 *   5. title font masih readable
 *   6. export HTML tidak memuat external font URL
 *   7. template picker/card tidak memakai font berbeda sendiri
 *   8. scene blocks memakai contract typography, bukan font liar
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  checkContractEduSafety,
  checkStylePackEduSafety,
  checkCssSourceEduSafety,
  checkHtmlSourceEduSafety,
  checkTypographyEduSafety,
  findForbiddenFontKeyword,
  findExternalFontReference,
  hasForbiddenGenericFamily,
  countDistinctFontFamilyTokens,
  DEFAULT_FONT_EDU_SAFETY_LIMITS,
  FORBIDDEN_FONT_KEYWORDS,
} from '../core/style-packs/font-edu-safety';
import {
  DEFAULT_DESIGN_CONTRACT,
  DESIGN_CONTRACTS,
} from '../core/mpi-design-contract';
import type { DesignTypography } from '../core/mpi-design-contract';
import {
  CLEAN_CLASSROOM_PACK,
  CIVIC_WARM_PACK,
  BRIGHT_KIDS_PACK,
  PROJECTOR_HIGH_CONTRAST_PACK,
  MINIMAL_WORKSHEET_PACK,
} from '../core/style-presets';
import { exportProjectToHtml } from '../export/export-html';
import { createSamplePpknProject } from '../core/sample-project';

// ---------------------------------------------------------------------------
// SCOPE 1 — No external font imports (Google Fonts / CDN / @font-face)
// ---------------------------------------------------------------------------

describe('FONT-EDU-SAFETY-01 — Scope 1: no external font imports', () => {
  it('1a. styles.css does not import Google Fonts or external font URLs', () => {
    const css = readFileSync(resolve(__dirname, '../styles.css'), 'utf-8');
    const ext = findExternalFontReference(css);
    expect(ext, `styles.css must not contain external font reference (found: ${ext})`).toBeNull();
  });

  it('1b. export HTML does not contain external font URLs', () => {
    const html = exportProjectToHtml(createSamplePpknProject());
    const ext = findExternalFontReference(html);
    expect(ext, `export HTML must not contain external font reference (found: ${ext})`).toBeNull();
  });

  it('1c. export-html.ts source does not import Google Fonts or CDN fonts', () => {
    const src = readFileSync(resolve(__dirname, '../export/export-html.ts'), 'utf-8');
    expect(src).not.toMatch(/fonts\.googleapis\.com/i);
    expect(src).not.toMatch(/fonts\.gstatic\.com/i);
    expect(src).not.toMatch(/@import\s+url\([^)]*\.(woff2?|ttf|otf)/i);
  });

  it('1d. no <link rel="stylesheet"> to external font domains in export HTML', () => {
    const html = exportProjectToHtml(createSamplePpknProject());
    expect(html).not.toMatch(/<link[^>]+href=["']https?:\/\/[^"']*fonts\./i);
  });

  it('1e. font-edu-safety.ts is pure (no React/DOM, no external font imports)', () => {
    const src = readFileSync(
      resolve(__dirname, '../core/style-packs/font-edu-safety.ts'),
      'utf-8',
    );
    expect(src).not.toContain("from 'react'");
    expect(src).not.toContain('from "react"');
    expect(src).not.toContain('document.');
    expect(src).not.toContain('window.');
    expect(src).not.toMatch(/fonts\.googleapis\.com/i);
  });
});

// ---------------------------------------------------------------------------
// SCOPE 2 — No forbidden font-family (cursive / fantasy / script / decorative)
// ---------------------------------------------------------------------------

describe('FONT-EDU-SAFETY-01 — Scope 2: no forbidden font-family', () => {
  it('2a. findForbiddenFontKeyword detects Comic Sans', () => {
    expect(findForbiddenFontKeyword('"Comic Sans MS", sans-serif')).toBe('comic sans');
  });

  it('2b. findForbiddenFontKeyword detects Fredoka (display font)', () => {
    expect(findForbiddenFontKeyword("'Fredoka One', cursive")).toBe('fredoka');
  });

  it('2c. findForbiddenFontKeyword detects cursive generic family keyword', () => {
    expect(findForbiddenFontKeyword('cursive')).toBe('cursive');
  });

  it('2d. findForbiddenFontKeyword returns null for clean sans-serif', () => {
    expect(findForbiddenFontKeyword("'Trebuchet MS', 'Segoe UI', sans-serif")).toBeNull();
    expect(findForbiddenFontKeyword("'Segoe UI', Arial, sans-serif")).toBeNull();
  });

  it('2e. hasForbiddenGenericFamily detects cursive / fantasy', () => {
    expect(hasForbiddenGenericFamily("'Fredoka', cursive")).toBe('cursive');
    expect(hasForbiddenGenericFamily("'Bangers', fantasy")).toBe('fantasy');
  });

  it('2f. styles.css does not contain forbidden font-family declarations', () => {
    const css = readFileSync(resolve(__dirname, '../styles.css'), 'utf-8');
    const issues = checkCssSourceEduSafety(css, 'styles.css');
    const forbiddenIssues = issues.filter((i) => i.field === 'font-family');
    expect(
      forbiddenIssues,
      forbiddenIssues.map((i) => i.message).join('\n'),
    ).toHaveLength(0);
  });

  it('2g. default design contract heroFont + bodyFont have no forbidden keywords', () => {
    expect(findForbiddenFontKeyword(DEFAULT_DESIGN_CONTRACT.typography.heroFont)).toBeNull();
    expect(findForbiddenFontKeyword(DEFAULT_DESIGN_CONTRACT.typography.bodyFont)).toBeNull();
  });

  it('2h. FORBIDDEN_FONT_KEYWORDS list includes key offenders', () => {
    expect(FORBIDDEN_FONT_KEYWORDS).toContain('comic sans');
    expect(FORBIDDEN_FONT_KEYWORDS).toContain('fredoka');
    expect(FORBIDDEN_FONT_KEYWORDS).toContain('cursive');
    expect(FORBIDDEN_FONT_KEYWORDS).toContain('fantasy');
    expect(FORBIDDEN_FONT_KEYWORDS).toContain('script');
  });
});

// ---------------------------------------------------------------------------
// SCOPE 3 — Max 2-3 font family tokens in design contract
// ---------------------------------------------------------------------------

describe('FONT-EDU-SAFETY-01 — Scope 3: max 2-3 font family tokens', () => {
  it('3a. countDistinctFontFamilyTokens counts named families (excludes generics)', () => {
    const t: DesignTypography = {
      heroFont: "'Trebuchet MS', 'Segoe UI', Arial, sans-serif",
      bodyFont: "'Segoe UI', Arial, sans-serif",
      titleSize: 44, subtitleSize: 20, bodySize: 16, labelSize: 13,
      titleWeight: 700, bodyWeight: 400, lineHeight: 1.5, letterSpacing: -0.01, uppercase: false,
    };
    // Distinct named: Trebuchet MS, Segoe UI, Arial = 3 (sans-serif is generic, excluded)
    expect(countDistinctFontFamilyTokens(t)).toBe(3);
  });

  it('3b. default design contract has <= 3 distinct font family tokens', () => {
    const count = countDistinctFontFamilyTokens(DEFAULT_DESIGN_CONTRACT.typography);
    expect(count).toBeLessThanOrEqual(DEFAULT_FONT_EDU_SAFETY_LIMITS.maxFontFamilyTokens);
  });

  it('3c. every contract in DESIGN_CONTRACTS has <= 3 distinct font family tokens', () => {
    for (const contract of Object.values(DESIGN_CONTRACTS)) {
      const count = countDistinctFontFamilyTokens(contract.typography);
      expect(
        count,
        `${contract.id}: ${count} distinct font tokens (max ${DEFAULT_FONT_EDU_SAFETY_LIMITS.maxFontFamilyTokens})`,
      ).toBeLessThanOrEqual(DEFAULT_FONT_EDU_SAFETY_LIMITS.maxFontFamilyTokens);
    }
  });
});

// ---------------------------------------------------------------------------
// SCOPE 4 — Body font is not a display font
// ---------------------------------------------------------------------------

describe('FONT-EDU-SAFETY-01 — Scope 4: body font is sans-serif (not display)', () => {
  it('4a. default contract bodyFont does not use cursive/fantasy generic family', () => {
    const generic = hasForbiddenGenericFamily(DEFAULT_DESIGN_CONTRACT.typography.bodyFont);
    expect(generic === 'cursive' || generic === 'fantasy').toBe(false);
  });

  it('4b. every contract bodyFont passes edu-safety (no forbidden keyword/generic)', () => {
    for (const contract of Object.values(DESIGN_CONTRACTS)) {
      const issues = checkContractEduSafety(contract, `contract:${contract.id}`);
      const bodyFontIssues = issues.filter(
        (i) => i.field === 'typography.bodyFont' || i.field === 'typography.fontFamily',
      );
      expect(
        bodyFontIssues,
        `${contract.id}: ${bodyFontIssues.map((i) => i.message).join('; ')}`,
      ).toHaveLength(0);
    }
  });

  it('4c. no legacy style pack uses Comic Sans / Fredoka / cursive / monospace as body font', () => {
    const packs = [CLEAN_CLASSROOM_PACK, CIVIC_WARM_PACK, BRIGHT_KIDS_PACK, PROJECTOR_HIGH_CONTRAST_PACK, MINIMAL_WORKSHEET_PACK];
    for (const pack of packs) {
      const issues = checkStylePackEduSafety(pack, `stylePack:${pack.id}`);
      expect(
        issues,
        `${pack.id}: ${issues.map((i) => i.message).join('; ')}`,
      ).toHaveLength(0);
    }
  });
});

// ---------------------------------------------------------------------------
// SCOPE 5 — Title font is still readable (formal-educative, not poster-style)
// ---------------------------------------------------------------------------

describe('FONT-EDU-SAFETY-01 — Scope 5: title font readable + size in safe range', () => {
  it('5a. every contract titleSize is within 28-44px safe range', () => {
    for (const contract of Object.values(DESIGN_CONTRACTS)) {
      const size = contract.typography.titleSize;
      expect(
        size,
        `${contract.id} titleSize ${size}px must be in [28, 44]`,
      ).toBeGreaterThanOrEqual(DEFAULT_FONT_EDU_SAFETY_LIMITS.titleSizeMin);
      expect(
        size,
        `${contract.id} titleSize ${size}px must be in [28, 44]`,
      ).toBeLessThanOrEqual(DEFAULT_FONT_EDU_SAFETY_LIMITS.titleSizeMax);
    }
  });

  it('5b. default contract heroFont is not a poster/display font (no bebas, oswald, anton)', () => {
    const hero = DEFAULT_DESIGN_CONTRACT.typography.heroFont.toLowerCase();
    expect(hero).not.toContain('bebas');
    expect(hero).not.toContain('oswald');
    expect(hero).not.toContain('anton');
    expect(hero).not.toContain('impact');
  });

  it('5c. every contract typography passes full edu-safety audit (0 issues)', () => {
    for (const contract of Object.values(DESIGN_CONTRACTS)) {
      const issues = checkTypographyEduSafety(contract.typography, `contract:${contract.id}`);
      expect(
        issues,
        `${contract.id}: ${issues.map((i) => i.message).join('; ')}`,
      ).toHaveLength(0);
    }
  });
});

// ---------------------------------------------------------------------------
// SCOPE 6 — Export HTML has no external font URL
// ---------------------------------------------------------------------------

describe('FONT-EDU-SAFETY-01 — Scope 6: export HTML no external font', () => {
  it('6a. export HTML has no external font reference (findExternalFontReference returns null)', () => {
    const html = exportProjectToHtml(createSamplePpknProject());
    expect(findExternalFontReference(html)).toBeNull();
  });

  it('6b. export HTML passes checkHtmlSourceEduSafety with 0 issues', () => {
    const html = exportProjectToHtml(createSamplePpknProject());
    const issues = checkHtmlSourceEduSafety(html, 'export-html');
    expect(issues).toHaveLength(0);
  });

  it('6c. export HTML does not contain @font-face declaration', () => {
    const html = exportProjectToHtml(createSamplePpknProject());
    expect(html).not.toMatch(/@font-face/i);
  });

  it('6d. export HTML uses CSS variables --silse-hero-font / --silse-body-font (not hardcoded)', () => {
    const html = exportProjectToHtml(createSamplePpknProject());
    expect(html).toContain('--silse-hero-font');
    expect(html).toContain('--silse-body-font');
  });
});

// ---------------------------------------------------------------------------
// SCOPE 7 — Template picker / cards don't use a different font
// ---------------------------------------------------------------------------

describe('FONT-EDU-SAFETY-01 — Scope 7: template picker uses inherited font', () => {
  it('7a. TemplatePickerDialog does not declare its own font-family', () => {
    const src = readFileSync(resolve(__dirname, '../editor/TemplatePickerDialog.tsx'), 'utf-8');
    // Allow fontFamily: 'inherit' (which is correct — inherits from parent)
    // but disallow hardcoded fontFamily declarations like fontFamily: 'Fredoka'
    const hardcodedFontMatches = src.match(/fontFamily\s*:\s*['"](?!inherit)['"][^'"]+['"]/g) || [];
    expect(
      hardcodedFontMatches,
      `TemplatePickerDialog must not hardcode font-family (found: ${hardcodedFontMatches.join(', ')})`,
    ).toHaveLength(0);
  });

  it('7b. Topbar does not declare its own font-family', () => {
    const src = readFileSync(resolve(__dirname, '../editor/Topbar.tsx'), 'utf-8');
    const hardcodedFontMatches = src.match(/fontFamily\s*:\s*['"](?!inherit)['"][^'"]+['"]/g) || [];
    expect(hardcodedFontMatches).toHaveLength(0);
  });

  it('7c. StylePackPicker does not declare its own font-family', () => {
    const src = readFileSync(resolve(__dirname, '../editor/StylePackPicker.tsx'), 'utf-8');
    const hardcodedFontMatches = src.match(/fontFamily\s*:\s*['"](?!inherit)['"][^'"]+['"]/g) || [];
    expect(hardcodedFontMatches).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// SCOPE 8 — Scene blocks use contract typography (no rogue fonts)
// ---------------------------------------------------------------------------

describe('FONT-EDU-SAFETY-01 — Scope 8: scene blocks use contract typography', () => {
  it('8a. scene-blocks/index.tsx does not hardcode font-family (uses contract.typography)', () => {
    const src = readFileSync(resolve(__dirname, '../components/scene-blocks/index.tsx'), 'utf-8');
    // Allow fontFamily: 'inherit' and contract.typography.* references
    // Disallow hardcoded font names like fontFamily: 'Fredoka'
    const hardcodedFontMatches = src.match(/fontFamily\s*:\s*['"](?!inherit)['"][^'"]+['"]/g) || [];
    expect(
      hardcodedFontMatches,
      `scene-blocks must not hardcode font-family (found: ${hardcodedFontMatches.join(', ')})`,
    ).toHaveLength(0);
  });

  it('8b. scene-composers/index.tsx does not hardcode font-family', () => {
    const src = readFileSync(resolve(__dirname, '../components/scene-composers/index.tsx'), 'utf-8');
    const hardcodedFontMatches = src.match(/fontFamily\s*:\s*['"](?!inherit)['"][^'"]+['"]/g) || [];
    expect(hardcodedFontMatches).toHaveLength(0);
  });

  it('8c. SceneRendererView uses contract.typography.heroFont (not a hardcoded font)', () => {
    const src = readFileSync(resolve(__dirname, '../components/SceneRendererView.tsx'), 'utf-8');
    expect(src).toContain('contract.typography.heroFont');
    // No hardcoded decorative font
    const hardcodedFontMatches = src.match(/fontFamily\s*:\s*['"](?!inherit)['"][^'"]+['"]/g) || [];
    expect(hardcodedFontMatches).toHaveLength(0);
  });

  it('8d. export-html.ts export builders use ty.heroFont / ty.bodyFont (not hardcoded)', () => {
    const src = readFileSync(resolve(__dirname, '../export/export-html.ts'), 'utf-8');
    // The export builders reference ty.heroFont and ty.bodyFont (contract typography)
    expect(src).toContain('ty.heroFont');
    expect(src).toContain('ty.bodyFont');
    // No hardcoded decorative font in export builder functions
    // (the CSS string at the top uses CSS variables --silse-hero-font, which is fine)
    const hardcodedDecorative = src.match(/fontFamily\s*:\s*['"](?:Comic|Fredoka|Bangers|Pacifico|Lobster|Bebas|Oswald|Anton)/i);
    expect(hardcodedDecorative).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// SCOPE 9 — Regression: the previously-failing fonts are GONE from source
// ---------------------------------------------------------------------------

describe('FONT-EDU-SAFETY-01 — Scope 9: regression (forbidden fonts removed)', () => {
  it('9a. style-presets.ts no longer contains "Comic Sans MS"', () => {
    const src = readFileSync(resolve(__dirname, '../core/style-presets.ts'), 'utf-8');
    expect(src).not.toContain('Comic Sans');
  });

  it('9b. style-presets.ts no longer contains "Courier New", monospace as body', () => {
    const src = readFileSync(resolve(__dirname, '../core/style-presets.ts'), 'utf-8');
    expect(src).not.toContain('"Courier New", monospace');
  });

  it('9c. defaultDesignContract.ts no longer contains "Fredoka One"', () => {
    const src = readFileSync(resolve(__dirname, '../core/mpi-design-contract/defaultDesignContract.ts'), 'utf-8');
    expect(src).not.toContain('Fredoka');
  });

  it('9d. defaultDesignContract.ts no longer contains cursive as a font fallback', () => {
    const src = readFileSync(resolve(__dirname, '../core/mpi-design-contract/defaultDesignContract.ts'), 'utf-8');
    // "cursive" should not appear as a font-family value (only in comments explaining what was removed)
    const fontDecls = src.match(/(?:heroFont|bodyFont)\s*:\s*['"][^'"]*cursive[^'"]*['"]/gi) || [];
    expect(fontDecls).toHaveLength(0);
  });

  it('9e. CIVIC_WARM_PACK no longer uses Georgia serif as body font', () => {
    const src = readFileSync(resolve(__dirname, '../core/style-presets.ts'), 'utf-8');
    expect(src).not.toContain("fontFamily: 'Georgia");
  });
});
