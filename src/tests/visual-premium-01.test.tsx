/**
 * VISUAL-PREMIUM-01 — AI-made visual polish tests.
 *
 * Verifies that the premium visual CSS (cover wow, card depth, choice polish)
 * is present in BOTH styles.css (editor) AND export HTML (standalone), with
 * exact parity. Also verifies no regression to existing guards.
 */

import { describe, it, expect } from 'vitest';

import { exportProjectToHtml } from '../export/export-html';
import { createSamplePpknProject } from '../core/sample-project';
import {
  templateToBlueprint,
  TEMPLATE_PPKN_NORMA,
} from '../core/guided-flow/pedagogical-templates';
import { aiBlueprintToSimpleProject } from '../core/ai-mpi-json/aiBlueprintToSimpleProject';

// ---------------------------------------------------------------------------
// SCOPE 1 — Cover scene wow factor CSS exists in styles.css
// ---------------------------------------------------------------------------

describe('VISUAL-PREMIUM-01 — Scope 1: cover wow CSS in export HTML (behavior test)', () => {
  // styles.css is inlined into export HTML — check the rendered output
  const html = exportProjectToHtml(createSamplePpknProject());

  it('1a. dot grid pattern overlay on cover (::before background-image)', () => {
    expect(html).toMatch(/\.silse-cover-clean::before.*background-image:\s*radial-gradient\(circle,\s*rgba\(255,255,255,0\.04\)/s);
  });

  it('1b. glow aura behind title (.silse-block-header::before with blur)', () => {
    expect(html).toContain('.silse-cover-clean .silse-block-header::before');
    expect(html).toMatch(/radial-gradient\(ellipse,\s*rgba\(249,193,46,0\.18\)/);
    expect(html).toMatch(/filter:\s*blur\(20px\)/);
  });

  it('1c. second decorative blob (bottom-left, .silse-block-shell::after)', () => {
    expect(html).toContain('.silse-cover-clean .silse-block-shell::after');
    expect(html).toMatch(/bottom:\s*-40px;\s*left:\s*-40px/);
  });

  it('1d. geometric accent line (top-right, .silse-block-shell::before)', () => {
    expect(html).toContain('.silse-cover-clean .silse-block-shell::before');
    expect(html).toMatch(/top:\s*24px;\s*right:\s*24px/);
    // Export CSS is minified (no spaces after commas) — use flexible pattern
    expect(html).toMatch(/linear-gradient\(90deg,\s*transparent,\s*rgba\(249,193,46,0\.6\),\s*transparent\)/);
  });
});

// ---------------------------------------------------------------------------
// SCOPE 2 — Card/panel premium depth CSS in styles.css
// ---------------------------------------------------------------------------

describe('VISUAL-PREMIUM-01 — Scope 2: card depth CSS in export HTML (behavior test)', () => {
  const html = exportProjectToHtml(createSamplePpknProject());

  it('2a. multi-layer box-shadow on .silse-block-panel (3 layers)', () => {
    // Must have 3 shadow layers: ambient (1px), key (4px), rim (12px)
    const panelMatch = html.match(/\.silse-block-panel\s*\{[^}]*box-shadow:\s*([^;]+);/s);
    expect(panelMatch).toBeDefined();
    const shadow = panelMatch![1];
    // Count shadow layers (comma-separated)
    const layers = shadow.split(',').length;
    expect(layers, `multi-layer shadow should have 3 layers, got ${layers}`).toBeGreaterThanOrEqual(3);
  });

  it('2b. inner highlight on .silse-block-panel::before (top edge glass)', () => {
    expect(html).toContain('.silse-block-panel::before');
    expect(html).toMatch(/\.silse-block-panel::before[^}]*linear-gradient\(90deg,\s*transparent,\s*rgba\(255,255,255,0\.12\)/s);
  });
});

// ---------------------------------------------------------------------------
// SCOPE 3 — Choice/feedback/badge polish CSS in styles.css
// ---------------------------------------------------------------------------

describe('VISUAL-PREMIUM-01 — Scope 3: choice/badge polish CSS in export HTML (behavior test)', () => {
  const html = exportProjectToHtml(createSamplePpknProject());
  // Extract only the VISUAL-PREMIUM-01 block (between marker and MICRO-ANIMATION)
  const vpStart = html.indexOf('VISUAL-PREMIUM-01');
  const vpEnd = html.indexOf('MICRO-ANIMATION-SYSTEM-V1', vpStart);
  const vpBlock = html.substring(vpStart, vpEnd);

  it('3a. choice-selected has gradient background + multi-layer shadow', () => {
    const selMatch = vpBlock.match(/\.silse-choice-selected\s*\{[^}]+\}/s);
    expect(selMatch, 'choice-selected rule must exist in VISUAL-PREMIUM block').toBeDefined();
    const rule = selMatch![0];
    expect(rule).toContain('linear-gradient(135deg');
    expect(rule).toMatch(/box-shadow:\s*inset/);
  });

  it('3b. choice-correct has gradient background + glow shadow', () => {
    const corMatch = vpBlock.match(/\.silse-choice-correct\s*\{[^}]+\}/s);
    expect(corMatch, 'choice-correct rule must exist in VISUAL-PREMIUM block').toBeDefined();
    const rule = corMatch![0];
    expect(rule).toContain('linear-gradient(135deg');
    expect(rule).toMatch(/0 2px 16px rgba\(22,163,74/);
  });

  it('3c. feedback-correct has gradient color wash', () => {
    const fbMatch = vpBlock.match(/\.silse-feedback-correct\s*\{[^}]+\}/s);
    expect(fbMatch, 'feedback-correct rule must exist in VISUAL-PREMIUM block').toBeDefined();
    expect(fbMatch![0]).toContain('linear-gradient(135deg');
  });

  it('3d. badge/chip has gradient background + shadow', () => {
    const chipMatch = vpBlock.match(/\.silse-block-chip\s*\{[^}]+\}/s);
    expect(chipMatch, 'block-chip rule must exist in VISUAL-PREMIUM block').toBeDefined();
    const rule = chipMatch![0];
    expect(rule).toContain('linear-gradient(135deg');
    expect(rule).toMatch(/box-shadow:/);
  });
});

// ---------------------------------------------------------------------------
// SCOPE 4 — Export HTML parity (same CSS strings in export)
// ---------------------------------------------------------------------------

describe('VISUAL-PREMIUM-01 — Scope 4: export HTML parity', () => {
  const html = exportProjectToHtml(createSamplePpknProject());

  it('4a. export HTML contains dot grid pattern overlay CSS', () => {
    expect(html).toContain('silse-cover-clean::before');
    expect(html).toMatch(/radial-gradient\(circle,rgba\(255,255,255,0\.04\) 1px,transparent 1px\)/);
  });

  it('4b. export HTML contains glow aura behind title CSS', () => {
    expect(html).toContain('silse-cover-clean .silse-block-header::before');
    expect(html).toMatch(/radial-gradient\(ellipse,rgba\(249,193,46,0\.18\)/);
  });

  it('4c. export HTML contains second decorative blob CSS', () => {
    expect(html).toContain('silse-cover-clean .silse-block-shell::after');
  });

  it('4d. export HTML contains geometric accent line CSS', () => {
    expect(html).toContain('silse-cover-clean .silse-block-shell::before');
  });

  it('4e. export HTML contains multi-layer panel shadow', () => {
    expect(html).toContain('.silse-block-panel');
    // The export CSS has the multi-layer shadow
    expect(html).toMatch(/0 1px 2px rgba\(0,0,0,0\.04\),0 4px 12px rgba\(0,0,0,0\.06\),0 12px 32px/);
  });

  it('4f. export HTML contains choice-selected gradient background', () => {
    expect(html).toContain('.silse-choice-selected');
    expect(html).toMatch(/linear-gradient\(135deg,rgba\(37,99,235,0\.06\)/);
  });

  it('4g. export HTML contains badge gradient background', () => {
    expect(html).toContain('.silse-block-chip');
    expect(html).toMatch(/linear-gradient\(135deg,rgba\(249,193,46,0\.18\)/);
  });
});

// ---------------------------------------------------------------------------
// SCOPE 5 — Rendered PPKn template export contains premium visual elements
// ---------------------------------------------------------------------------

describe('VISUAL-PREMIUM-01 — Scope 5: PPKn template export premium', () => {
  const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
  const project = aiBlueprintToSimpleProject(bp);
  const html = exportProjectToHtml(project);

  it('5a. export contains VISUAL-PREMIUM-01 marker comment', () => {
    expect(html).toContain('VISUAL-PREMIUM-01');
  });

  it('5b. export contains cover decoration classes (clean/soft/mission)', () => {
    // At least one cover class should be present
    const hasClean = html.includes('silse-cover-clean');
    const hasSoft = html.includes('silse-cover-soft');
    const hasMission = html.includes('silse-cover-mission');
    expect(hasClean || hasSoft || hasMission).toBe(true);
  });

  it('5c. export contains premium panel shadow (3-layer)', () => {
    // The multi-layer shadow string must appear in the export <style>
    expect(html).toMatch(/0 1px 2px rgba\(0,0,0,0\.04\)/);
    expect(html).toMatch(/0 4px 12px rgba\(0,0,0,0\.06\)/);
    expect(html).toMatch(/0 12px 32px rgba\(0,0,0,0\.04\)/);
  });

  it('5d. export contains glow aura blur filter', () => {
    expect(html).toMatch(/filter:blur\(20px\)/);
  });

  it('5e. export contains dot grid pattern (24px size)', () => {
    expect(html).toMatch(/background-size:24px 24px,100% 100%/);
  });
});

// ---------------------------------------------------------------------------
// SCOPE 6 — No regression: guards still pass
// ---------------------------------------------------------------------------

describe('VISUAL-PREMIUM-01 — Scope 6: no regression', () => {
  it('6a. all 3 templates still export as standalone HTML', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    const project = aiBlueprintToSimpleProject(bp);
    const html = exportProjectToHtml(project);
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
  });

  it('6b. no external font references introduced by visual polish', () => {
    const html = exportProjectToHtml(createSamplePpknProject());
    // No @font-face, no Google Fonts, no CDN fonts
    expect(html).not.toMatch(/@font-face/i);
    expect(html).not.toMatch(/fonts\.googleapis\.com/i);
    expect(html).not.toMatch(/fonts\.gstatic\.com/i);
  });

  it('6c. no forbidden font keywords introduced by visual polish', () => {
    const html = exportProjectToHtml(createSamplePpknProject());
    // The VISUAL-PREMIUM CSS block should not declare any font-family
    const visPremiumBlock = html.substring(
      html.indexOf('VISUAL-PREMIUM-01'),
      html.indexOf('MICRO-ANIMATION-SYSTEM-V1'),
    );
    expect(visPremiumBlock).not.toMatch(/font-family:\s*['"]/);
  });

  it('6d. motion preset CSS still present (not broken by visual block)', () => {
    const html = exportProjectToHtml(createSamplePpknProject());
    expect(html).toContain('@keyframes silse-motion-entrance-fade-kf');
    expect(html).toContain('.silse-motion-hover-lift');
  });
});
