/**
 * STYLE-PARITY-01 — AI designSystem.overrides must apply to BOTH editor + export.
 *
 * Problem found: Qwen PR fixed aiBlueprintToSimpleProject to apply overrides
 * to project.style.tokens, BUT CanvasStage/PreviewApp used getDesignContract(stylePackId)
 * which IGNORES project.style.tokens. Result: editor shows OLD style, export shows
 * NEW style → parity broken.
 *
 * Fix: new getDesignContractWithProjectStyle() merges project.style.tokens into
 * the base design contract. CanvasStage + PreviewApp now use this helper.
 * export-html already reads project.style directly via generateCssVariablesMap.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  getDesignContract,
  getDesignContractWithProjectStyle,
} from '../core/mpi-design-contract';
import { templateToBlueprint, TEMPLATE_PPKN_NORMA } from '../core/guided-flow/pedagogical-templates';
import { aiBlueprintToSimpleProject } from '../core/ai-mpi-json/aiBlueprintToSimpleProject';
import { exportProjectToHtml } from '../export/export-html';
import { buildMpiPromptText } from '../core/ai-prompt-contract/buildMpiPromptContract';

// Helper: blueprint with AI overrides
function blueprintWithOverrides() {
  const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
  bp.designSystem = {
    ...bp.designSystem,
    overrides: {
      'colors.primary': '#8b5cf6',
      'colors.background': '#1a0a2e',
      'typography.fontFamily': 'Georgia, serif',
      'spacing.pagePadding': 48,
    },
  };
  return bp;
}

describe('STYLE-PARITY-01 — Scope A: AI overrides reach project.style.tokens', () => {
  it('1. aiBlueprintToSimpleProject applies overrides to project.style.tokens', () => {
    const bp = blueprintWithOverrides();
    const project = aiBlueprintToSimpleProject(bp);
    expect(project.style?.tokens?.colors?.primary).toBe('#8b5cf6');
    expect(project.style?.tokens?.colors?.background).toBe('#1a0a2e');
    expect(project.style?.tokens?.typography?.fontFamily).toBe('Georgia, serif');
    expect(project.style?.tokens?.spacing?.pagePadding).toBe(48);
  });
});

describe('STYLE-PARITY-01 — Scope B: getDesignContractWithProjectStyle merges overrides', () => {
  it('2. without project.style, returns base contract (backward compatible)', () => {
    const base = getDesignContract('modern-clean');
    const merged = getDesignContractWithProjectStyle('modern-clean', undefined);
    expect(merged.palette.primary).toBe(base.palette.primary);
    expect(merged.typography.heroFont).toBe(base.typography.heroFont);
  });

  it('3. with project.style.tokens, overrides base contract palette', () => {
    const project = aiBlueprintToSimpleProject(blueprintWithOverrides());
    const merged = getDesignContractWithProjectStyle(project.stylePackId, project.style);
    expect(merged.palette.primary).toBe('#8b5cf6');
    expect(merged.palette.background).toBe('#1a0a2e');
  });

  it('4. with project.style.tokens, overrides base contract typography', () => {
    const project = aiBlueprintToSimpleProject(blueprintWithOverrides());
    const merged = getDesignContractWithProjectStyle(project.stylePackId, project.style);
    // fontFamily override should reflect in bodyFont (typography.fontFamily maps to bodyFont)
    expect(merged.typography.bodyFont).toBe('Georgia, serif');
  });

  it('5. without overrides, base contract values preserved', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    const project = aiBlueprintToSimpleProject(bp);
    // PPKn template uses stylePackId 'golden-reference' which falls back to DEFAULT_DESIGN_CONTRACT
    const merged = getDesignContractWithProjectStyle(project.stylePackId, project.style);
    // ProjectStyle from style pack should have same primary color as base contract
    // (no overrides applied, so merged uses project.style.tokens which = base style pack tokens)
    expect(merged.palette.primary).toBeTruthy();
    expect(merged.typography.heroFont).toBeTruthy();
  });
});

describe('STYLE-PARITY-01 — Scope C: CanvasStage + PreviewApp use new helper', () => {
  it('6. CanvasStage imports getDesignContractWithProjectStyle (not old getDesignContract)', () => {
    const src = readFileSync(resolve(__dirname, '../editor/CanvasStage.tsx'), 'utf-8');
    expect(src).toContain('getDesignContractWithProjectStyle');
    expect(src).toContain('project.style');
    // Must NOT use old helper without project.style
    expect(src).not.toMatch(/getDesignContract\(project\.stylePackId\)/);
  });

  it('7. PreviewApp imports getDesignContractWithProjectStyle', () => {
    const src = readFileSync(resolve(__dirname, '../preview/PreviewApp.tsx'), 'utf-8');
    expect(src).toContain('getDesignContractWithProjectStyle');
    expect(src).toContain('project.style');
  });

  it('8. helper is exported from mpi-design-contract index', () => {
    const src = readFileSync(resolve(__dirname, '../core/mpi-design-contract/index.ts'), 'utf-8');
    expect(src).toContain('getDesignContractWithProjectStyle');
  });
});

describe('STYLE-PARITY-01 — Scope D: Export parity (editor === export)', () => {
  it('9. export HTML contains AI override colors (from project.style.tokens)', () => {
    const project = aiBlueprintToSimpleProject(blueprintWithOverrides());
    const html = exportProjectToHtml(project);
    // generateCssVariablesMap reads project.style.tokens → CSS variables
    expect(html).toContain('#8b5cf6'); // primary
    expect(html).toContain('#1a0a2e'); // background
    expect(html).toContain('Georgia, serif'); // fontFamily
  });

  it('10. export HTML without overrides uses base colors (no regression)', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    const project = aiBlueprintToSimpleProject(bp);
    const html = exportProjectToHtml(project);
    // Should contain the base style pack colors (from default contract)
    expect(html).toContain('--silse-color-primary');
    expect(html).toContain('--silse-color-background');
  });
});

describe('STYLE-PARITY-01 — Scope F: Structured override format (from Qwen PR)', () => {
  it('14. structured typography override (fontFamily) applies', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    bp.designSystem = {
      ...bp.designSystem,
      overrides: { typography: { fontFamily: 'Georgia, serif' } } as any,
    };
    const project = aiBlueprintToSimpleProject(bp);
    expect(project.style?.tokens?.typography?.fontFamily).toBe('Georgia, serif');
  });

  it('15. structured color override (accent → secondary) applies', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    bp.designSystem = {
      ...bp.designSystem,
      overrides: { colors: { accent: '#ec4899' } } as any,
    };
    const project = aiBlueprintToSimpleProject(bp);
    expect(project.style?.tokens?.colors?.secondary).toBe('#ec4899');
  });

  it('16. structured color override (error → danger) applies', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    bp.designSystem = {
      ...bp.designSystem,
      overrides: { colors: { error: '#ff0000' } } as any,
    };
    const project = aiBlueprintToSimpleProject(bp);
    expect(project.style?.tokens?.colors?.danger).toBe('#ff0000');
  });

  it('17. structured typography.fontSizeBase scales all font sizes', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    const baseProject = aiBlueprintToSimpleProject(bp);
    const baseTitleSize = baseProject.style!.tokens!.typography.titleSize;
    bp.designSystem = {
      ...bp.designSystem,
      overrides: { typography: { fontSizeBase: 20 } } as any, // scale 1.25
    };
    const project = aiBlueprintToSimpleProject(bp);
    expect(project.style?.tokens?.typography?.titleSize).toBe(Math.round(baseTitleSize * 1.25));
  });

  it('18. flat key format still works (backward compatible)', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    bp.designSystem = {
      ...bp.designSystem,
      overrides: { 'colors.primary': '#8b5cf6' } as any,
    };
    const project = aiBlueprintToSimpleProject(bp);
    expect(project.style?.tokens?.colors?.primary).toBe('#8b5cf6');
  });
});

describe('STYLE-PARITY-01 — Scope E: Prompt AI documents overrides', () => {
  it('11. buildMpiPromptText mentions designSystem.overrides', () => {
    const prompt = buildMpiPromptText();
    expect(prompt).toContain('overrides');
    expect(prompt).toContain('designSystem');
  });

  it('12. prompt documents override key format (category.tokenName)', () => {
    const prompt = buildMpiPromptText();
    expect(prompt).toContain('colors.primary');
    expect(prompt).toContain('typography.fontFamily');
    expect(prompt).toContain('spacing.pagePadding');
  });

  it('13. prompt warns about font restrictions (no decorative/external)', () => {
    const prompt = buildMpiPromptText();
    expect(prompt).toMatch(/dekoratif|Comic Sans|cursive|Google Fonts/i);
  });
});
