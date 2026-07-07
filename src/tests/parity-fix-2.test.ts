/**
 * PARITY-FIX-2: Premium export profile + hardcoded fallback + color mapping.
 */

import { describe, it, expect } from 'vitest';

import { templateToBlueprint, TEMPLATE_PPKN_NORMA } from '../core/guided-flow/pedagogical-templates';
import { aiBlueprintToSimpleProject } from '../core/ai-mpi-json/aiBlueprintToSimpleProject';
import { getPremiumExportProfile, getPremiumExportProfileWithProjectStyle } from '../core/style-packs/premium-export-profile';
import { exportProjectToHtml } from '../export/export-html';

function blueprintWithOverrides() {
  const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
  bp.designSystem = {
    ...bp.designSystem,
    overrides: {
      'colors.primary': '#8b5cf6',
      'colors.secondary': '#ec4899',
      'colors.background': '#1a0a2e',
      'colors.surface': '#2d1b4e',
      'typography.fontFamily': 'Georgia, serif',
    },
  };
  return bp;
}

describe('PARITY-FIX-2: Premium export profile with project.style', () => {
  it('1. getPremiumExportProfileWithProjectStyle applies override primary to profile.colors.navy', () => {
    const project = aiBlueprintToSimpleProject(blueprintWithOverrides());
    const profile = getPremiumExportProfileWithProjectStyle(project.stylePackId, project.style);
    expect(profile.colors.navy).toBe('#8b5cf6');
  });

  it('2. getPremiumExportProfileWithProjectStyle applies override font to profile.typography', () => {
    const project = aiBlueprintToSimpleProject(blueprintWithOverrides());
    const profile = getPremiumExportProfileWithProjectStyle(project.stylePackId, project.style);
    expect(profile.typography.bodyFont).toBe('Georgia, serif');
    expect(profile.typography.heroFont).toBe('Georgia, serif');
  });

  it('3. getPremiumExportProfile (old) does NOT apply overrides', () => {
    const project = aiBlueprintToSimpleProject(blueprintWithOverrides());
    const profile = getPremiumExportProfile(project.stylePackId);
    expect(profile.colors.navy).not.toBe('#8b5cf6');
  });

  it('4. darkStage adjusts based on background color (dark bg → darkStage=true)', () => {
    const project = aiBlueprintToSimpleProject(blueprintWithOverrides());
    const profile = getPremiumExportProfileWithProjectStyle(project.stylePackId, project.style);
    expect(profile.darkStage).toBe(true); // #1a0a2e is dark
  });
});

describe('PARITY-FIX-2: Export HTML uses var() not hardcoded fallback', () => {
  it('5. export HTML fallback uses var(--silse-color-surface), not #182d45', () => {
    const project = aiBlueprintToSimpleProject(blueprintWithOverrides());
    const html = exportProjectToHtml(project);
    // Should NOT have bare #182d45 as fallback (replaced with var())
    expect(html).not.toMatch(/\|\| '#182d45'/);
  });

  it('6. export HTML fallback uses var(--silse-color-background), not #0e1c2f', () => {
    const project = aiBlueprintToSimpleProject(blueprintWithOverrides());
    const html = exportProjectToHtml(project);
    expect(html).not.toMatch(/\|\| '#0e1c2f'/);
  });

  it('7. export HTML has var() fallbacks for surface', () => {
    const project = aiBlueprintToSimpleProject(blueprintWithOverrides());
    const html = exportProjectToHtml(project);
    expect(html).toContain('var(--silse-color-surface)');
  });
});

describe('PARITY-FIX-2: Color mapping completeness', () => {
  it('8. override colors.surface reaches project.style.tokens', () => {
    const project = aiBlueprintToSimpleProject(blueprintWithOverrides());
    expect(project.style?.tokens?.colors?.surface).toBe('#2d1b4e');
  });

  it('9. override colors.mutedText reaches project.style.tokens (structured format)', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    bp.designSystem = {
      ...bp.designSystem,
      overrides: { colors: { mutedText: '#999999' } } as any,
    };
    const project = aiBlueprintToSimpleProject(bp);
    expect(project.style?.tokens?.colors?.mutedText).toBe('#999999');
  });

  it('10. override colors.border reaches project.style.tokens (structured format)', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    bp.designSystem = {
      ...bp.designSystem,
      overrides: { colors: { border: '#333333' } } as any,
    };
    const project = aiBlueprintToSimpleProject(bp);
    expect(project.style?.tokens?.colors?.border).toBe('#333333');
  });

  it('11. override colors.danger reaches project.style.tokens (structured format)', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    bp.designSystem = {
      ...bp.designSystem,
      overrides: { colors: { danger: '#ff0000' } } as any,
    };
    const project = aiBlueprintToSimpleProject(bp);
    expect(project.style?.tokens?.colors?.danger).toBe('#ff0000');
  });
});
