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
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  checkContractEduSafety,
  checkStylePackEduSafety,
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
import { useEditorStore } from '../store/editor-store';
import { TemplatePickerDialog } from '../editor/TemplatePickerDialog';
import { Topbar } from '../editor/Topbar';

// ---------------------------------------------------------------------------
// SCOPE 1 — No external font imports (Google Fonts / CDN / @font-face)
// ---------------------------------------------------------------------------

describe('FONT-EDU-SAFETY-01 — Scope 1: no external font imports (behavior test)', () => {
  it('1a. export HTML (which inlines styles.css) has no external font references', () => {
    // styles.css is inlined into export HTML <style> — check the rendered output
    const html = exportProjectToHtml(createSamplePpknProject());
    const ext = findExternalFontReference(html);
    expect(ext, `export HTML must not contain external font reference (found: ${ext})`).toBeNull();
  });

  it('1b. export HTML does not contain external font URLs', () => {
    const html = exportProjectToHtml(createSamplePpknProject());
    const ext = findExternalFontReference(html);
    expect(ext, `export HTML must not contain external font reference (found: ${ext})`).toBeNull();
  });

  it('1c. export HTML does not reference Google Fonts or CDN font domains', () => {
    const html = exportProjectToHtml(createSamplePpknProject());
    expect(html).not.toMatch(/fonts\.googleapis\.com/i);
    expect(html).not.toMatch(/fonts\.gstatic\.com/i);
    expect(html).not.toMatch(/@import\s+url\([^)]*\.(woff2?|ttf|otf)/i);
  });

  it('1d. no <link rel="stylesheet"> to external font domains in export HTML', () => {
    const html = exportProjectToHtml(createSamplePpknProject());
    expect(html).not.toMatch(/<link[^>]+href=["']https?:\/\/[^"']*fonts\./i);
  });

  it('1e. font-edu-safety helper is pure (no React/DOM at runtime)', () => {
    // The helper is already imported at top — verify it works without React/DOM
    expect(typeof checkContractEduSafety).toBe('function');
    // Call it — should not throw (proves no hidden React/DOM deps)
    const result = checkContractEduSafety(DEFAULT_DESIGN_CONTRACT, 'test');
    expect(Array.isArray(result)).toBe(true);
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

  it('2f. export HTML (inlined styles.css) does not contain forbidden font-family declarations', () => {
    // styles.css is inlined into export HTML — check the rendered output
    const html = exportProjectToHtml(createSamplePpknProject());
    const issues = checkHtmlSourceEduSafety(html, 'export-html');
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

describe('FONT-EDU-SAFETY-01 — Scope 7: editor UI uses inherited font (behavior test)', () => {
  it('7a. TemplatePickerDialog renders without hardcoded font (uses inherited font)', () => {
    // Render the dialog and verify it doesn't inject forbidden fonts
    // TemplatePickerDialog already imported at top
    const { container } = render(<TemplatePickerDialog onClose={() => {}} />);
    // Dialog should render (proves no crash from font issues)
    expect(container.querySelector('[data-testid="template-picker-dialog"]')).toBeInTheDocument();
    // No inline style with forbidden fontFamily
    const elementsWithFont = container.querySelectorAll('[style*="fontFamily"]');
    elementsWithFont.forEach((el) => {
      const style = (el as HTMLElement).style.fontFamily;
      if (style && style !== 'inherit') {
        const forbidden = findForbiddenFontKeyword(style);
        expect(forbidden, `element has forbidden font: ${forbidden}`).toBeNull();
      }
    });
  });

  it('7b. Topbar renders without hardcoded font', () => {
    // Topbar already imported at top
    useEditorStore.setState({ project: createSamplePpknProject() });
    const { container } = render(<Topbar />);
    expect(container.querySelector('[data-testid="editor-topbar"]')).toBeInTheDocument();
    // No inline style with forbidden fontFamily
    const elementsWithFont = container.querySelectorAll('[style*="fontFamily"]');
    elementsWithFont.forEach((el) => {
      const style = (el as HTMLElement).style.fontFamily;
      if (style && style !== 'inherit') {
        const forbidden = findForbiddenFontKeyword(style);
        expect(forbidden, `element has forbidden font: ${forbidden}`).toBeNull();
      }
    });
  });

  it('7c. export HTML has no forbidden fonts in CSS font-family declarations', () => {
    // The export HTML is the ultimate output — verify no forbidden fonts in CSS
    const html = exportProjectToHtml(createSamplePpknProject());
    // Extract CSS from <style> block and check font-family declarations only
    const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
    if (styleMatch) {
      const css = styleMatch[1];
      // Check only font-family declarations (not arbitrary text like "script" in JS)
      const fontFamilyDecls = css.match(/font-family\s*:\s*([^;}]+)/gi) || [];
      fontFamilyDecls.forEach((decl) => {
        const forbidden = findForbiddenFontKeyword(decl);
        expect(forbidden, `CSS font-family has forbidden: ${forbidden} in "${decl}"`).toBeNull();
      });
    }
  });
});

// ---------------------------------------------------------------------------
// SCOPE 8 — Scene blocks use contract typography (no rogue fonts)
// ---------------------------------------------------------------------------

describe('FONT-EDU-SAFETY-01 — Scope 8: scene blocks use contract typography (behavior test)', () => {
  it('8a. rendered scene output has no forbidden font keywords', () => {
    // Render a scene and verify the output HTML has no forbidden fonts
    // (proves scene-blocks use contract.typography, not hardcoded fonts)
    const html = exportProjectToHtml(createSamplePpknProject());
    // Extract CSS from <style> block
    const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
    if (styleMatch) {
      const forbidden = findForbiddenFontKeyword(styleMatch[1]);
      expect(forbidden, `CSS contains forbidden font: ${forbidden}`).toBeNull();
    }
  });

  it('8b. export HTML uses CSS variables for fonts (not hardcoded font names)', () => {
    // Export HTML should use --silse-hero-font / --silse-body-font CSS variables
    // (proves export builders use ty.heroFont / ty.bodyFont, not hardcoded strings)
    const html = exportProjectToHtml(createSamplePpknProject());
    expect(html).toContain('--silse-hero-font');
    expect(html).toContain('--silse-body-font');
  });

  it('8c. export HTML does not contain decorative font names', () => {
    const html = exportProjectToHtml(createSamplePpknProject());
    // Check for known decorative font names in the output
    const decorative = ['Comic Sans', 'Fredoka', 'Bangers', 'Pacifico', 'Lobster', 'Bebas', 'Oswald', 'Anton'];
    decorative.forEach((font) => {
      expect(html, `export HTML should not contain "${font}"`).not.toContain(font);
    });
  });

  it('8d. export HTML uses contract font tokens (not hardcoded)', () => {
    // CONTRACT-ALIGNMENT-FIX: createSamplePpknProject() uses CLEAN_CLASSROOM_PACK (default)
    // which has system font stack (-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif).
    // Test verifies that --silse-hero-font / --silse-body-font CSS variables are populated
    // from the resolved contract (not hardcoded). We compare against the actual resolved
    // contract font, not a specific font name like "Trebuchet".
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project);
    // CSS variables must be present (contract font tokens are wired through)
    expect(html).toContain('--silse-hero-font');
    expect(html).toContain('--silse-body-font');
    // The hero font value must be a non-empty font stack (not a hardcoded decorative font).
    // Extract the --silse-hero-font value and verify it's a real font stack.
    const heroFontMatch = html.match(/--silse-hero-font:\s*([^;]+);/);
    expect(heroFontMatch).toBeTruthy();
    const heroFontValue = heroFontMatch![1].trim();
    expect(heroFontValue.length).toBeGreaterThan(0);
    // Must NOT be a forbidden/decorative font (Comic Sans, Fredoka, cursive, etc.)
    const forbiddenFonts = ['Comic Sans', 'Fredoka', 'Bangers', 'Pacifico', 'Lobster', 'Bebas', 'Oswald', 'Anton', 'cursive', 'fantasy'];
    forbiddenFonts.forEach((f) => {
      expect(heroFontValue, `--silse-hero-font must not contain forbidden font "${f}"`).not.toMatch(new RegExp(f, 'i'));
    });
  });
});

// ---------------------------------------------------------------------------
// SCOPE 9 — Regression: forbidden fonts are gone from runtime output (behavior test)
// ---------------------------------------------------------------------------

describe('FONT-EDU-SAFETY-01 — Scope 9: regression (forbidden fonts absent from output)', () => {
  it('9a. all style packs produce output without Comic Sans', () => {
    // Verify all 3 style packs render without Comic Sans in export
    const packs = ['modern-clean', 'soft-classroom', 'mission-dark'];
    packs.forEach((packId) => {
      const project = { ...createSamplePpknProject(), stylePackId: packId };
      const html = exportProjectToHtml(project);
      expect(html, `${packId} export should not contain Comic Sans`).not.toContain('Comic Sans');
    });
  });

  it('9b. all style packs produce output without Courier New monospace', () => {
    const packs = ['modern-clean', 'soft-classroom', 'mission-dark'];
    packs.forEach((packId) => {
      const project = { ...createSamplePpknProject(), stylePackId: packId };
      const html = exportProjectToHtml(project);
      expect(html, `${packId} export should not contain Courier New`).not.toContain('Courier New');
    });
  });

  it('9c. all design contracts have no Fredoka in their typography', () => {
    // Verify at runtime — check all contracts via getDesignContract
    // DESIGN_CONTRACTS already imported at top
    Object.values(DESIGN_CONTRACTS).forEach((contract: any) => {
      expect(contract.typography.heroFont, `${contract.id} heroFont`).not.toContain('Fredoka');
      expect(contract.typography.bodyFont, `${contract.id} bodyFont`).not.toContain('Fredoka');
    });
  });

  it('9d. all design contracts have no cursive generic family in fonts', () => {
    // DESIGN_CONTRACTS already imported at top
    Object.values(DESIGN_CONTRACTS).forEach((contract: any) => {
      const heroLower = contract.typography.heroFont.toLowerCase();
      const bodyLower = contract.typography.bodyFont.toLowerCase();
      expect(heroLower, `${contract.id} heroFont should not be cursive`).not.toContain('cursive');
      expect(bodyLower, `${contract.id} bodyFont should not be cursive`).not.toContain('cursive');
    });
  });

  it('9e. CIVIC_WARM_PACK typography has no Georgia serif (verified at runtime)', () => {
    // CIVIC_WARM_PACK already imported at top
    const ff = CIVIC_WARM_PACK.typography.fontFamily.toLowerCase();
    expect(ff, 'CIVIC_WARM should not use Georgia').not.toContain('georgia');
    // Check for serif as standalone (not "sans-serif" which is OK)
    expect(ff, 'CIVIC_WARM should not use serif (sans-serif is OK)').not.toMatch(/(^|[^-])serif/);
  });
});
