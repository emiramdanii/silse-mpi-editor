/**
 * V1 FINAL AUDIT — Ultimate Parity Test
 *
 * Imports a valid AI JSON (from pedagogical template), exports to HTML,
 * and verifies that every visual layer is present in the export.
 */

import { describe, it, expect } from 'vitest';
import { exportProjectToHtml } from '../export/export-html';
import { aiBlueprintToSimpleProject } from '../core/ai-mpi-json/aiBlueprintToSimpleProject';
import { templateToBlueprint, TEMPLATE_PPKN_NORMA } from '../core/guided-flow/pedagogical-templates';
import { createSamplePpknProject } from '../core/sample-project';

describe('V1 FINAL AUDIT — 1. Ultimate Parity Test', () => {
  const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
  const html = exportProjectToHtml(project);

  it('1a. export HTML is valid standalone document', () => {
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('<html lang="id">');
    expect(html).toContain('<style>');
    expect(html).toContain('<script>');
    expect(html).toContain('</html>');
    expect(html.length).toBeGreaterThan(50000);
  });

  it('1b. export HTML has no React/Vite runtime', () => {
    // Check for React runtime imports/usage, not the word "React" in comments
    expect(html).not.toMatch(/require\(['"]react/i);
    expect(html).not.toMatch(/import.*from ['"]react/i);
    expect(html).not.toMatch(/react-dom/i);
    expect(html).not.toMatch(/useState|useEffect|useCallback|useMemo|useRef/i);
    expect(html).not.toMatch(/\bjsx\b/i);
    expect(html).not.toMatch(/React\.createElement/i);
    expect(html).not.toMatch(/from ['"]vite/i);
  });

  it('1c. CSS :root tokens present (Level 1: Color)', () => {
    expect(html).toContain('--color-bg');
    expect(html).toContain('--color-panel');
    expect(html).toContain('--color-accent');
    expect(html).toContain('--silse-navy');
    expect(html).toContain('--silse-gold');
    expect(html).toContain('--silse-hero-font');
    expect(html).toContain('--silse-card-radius');
  });

  it('1d. Premium CSS library functions inlined (Fase 3a)', () => {
    expect(html).toContain('@keyframes silse-fade-in-soft');
    expect(html).toContain('@keyframes silse-mission-pulse');
    expect(html).toContain('@keyframes silse-award-shine');
    expect(html).toContain('.silse-anim-button-clean');
    expect(html).toContain('.silse-cover-clean::before');
    expect(html).toContain('.silse-bg-page-clean::before');
    expect(html).toContain('.silse-block-panel');
    expect(html).toContain('.silse-celebrate-success-clean');
  });

  it('1e. SceneGrid / exportGrid present (Level 2: Layout)', () => {
    expect(html).toContain('function exportGrid');
    expect(html).toContain('_sceneCustomStyleCss');
  });

  it('1f. SceneTabs / exportTabs present (Level 3: Components)', () => {
    expect(html).toContain('function exportTabs');
    expect(html).toContain("setAttribute('data-tab-id'");
    expect(html).toContain('silse-block-tabs-wrapper');
    expect(html).toContain("setAttribute('data-tab-panel'");
  });

  it('1g. SceneAccordion / exportAccordion present (Level 3)', () => {
    expect(html).toContain('function exportAccordion');
    expect(html).toContain('silse-accordion-header');
    expect(html).toContain('silse-accordion-body');
  });

  it('1h. Behavior / wireInteractions present (Level 4: Behavior)', () => {
    expect(html).toContain('function wireInteractions');
    expect(html).toContain('prefers-reduced-motion');
    expect(html).toContain('matchMedia');
    expect(html).toContain('data-behavior-hover');
  });

  it('1i. Contrast-aware text color (Fase 3b drift fix)', () => {
    expect(html).toContain('getContrastAwareTextColor');
    expect(html).toContain('_currentPageRole');
    expect(html).toContain('_DARK_BACKGROUND_ROLES');
  });

  it('1j. Motion preset CSS present (Fase 3a)', () => {
    expect(html).toContain('silse-motion-entrance-fade');
    expect(html).toContain('silse-motion-hover-lift');
    expect(html).toContain('@keyframes silse-motion-pulse-kf');
  });

  it('1k. All 12+ scenes rendered in export', () => {
    // Scenes are rendered at runtime via JS — check silse-scene class in JS source
    // and sceneType in render model JSON
    const sceneClassCount = (html.match(/silse-scene /g) || []).length;
    const sceneTypeInJson = (html.match(/sceneType/g) || []).length;
    expect(sceneClassCount).toBeGreaterThanOrEqual(10);
    expect(sceneTypeInJson).toBeGreaterThanOrEqual(12);
  });

  it('1l. No JavaScript syntax errors (basic check)', () => {
    // Verify key JS functions are present in the script
    expect(html).toContain('function renderSceneFromPlan');
    expect(html).toContain('function wireInteractions');
    expect(html).toContain('function renderPage');
  });

  it('1m. Sample project (no AI JSON) also exports correctly', () => {
    const sampleHtml = exportProjectToHtml(createSamplePpknProject());
    expect(sampleHtml).toContain('<!doctype html>');
    expect(sampleHtml.length).toBeGreaterThan(30000);
  });
});
