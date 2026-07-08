/**
 * EXPORT-CONTRAST-02 — Card background consistency + dark gradient override.
 *
 * Bug: getDesignContractWithProjectStyle mengoverride palette.text/colors tapi TIDAK
 * mengoverride card.background. Akibatnya, jika AI override palette ke light theme
 * (background putih, text gelap), card.background tetap dark (dari base contract
 * seperti golden-reference #182d45). Hasilnya: text gelap di card gelap = unreadable.
 *
 * Fix: card.background mengikuti palette.surface, card.border mengikuti palette.border.
 * Selain itu, export profile gradients di-override ke dark variant jika contract
 * palette.background gelap.
 */

import { describe, it, expect } from 'vitest';

import { getDesignContractWithProjectStyle, getDesignContract } from '../core/mpi-design-contract';
import { templateToBlueprint, TEMPLATE_PPKN_NORMA } from '../core/guided-flow/pedagogical-templates';
import { aiBlueprintToSimpleProject } from '../core/ai-mpi-json/aiBlueprintToSimpleProject';
import { exportProjectToHtml } from '../export/export-html';

// Helper: check if color is dark
function isColorDark(hex: string): boolean {
  const m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return false;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return 0.299 * r + 0.587 * g + 0.114 * b < 128;
}

describe('EXPORT-CONTRAST-02 — Card background consistency with palette override', () => {
  it('1. golden-reference + cleanClassroom override: card.background follows palette.surface (light)', () => {
    // This is the bug case: golden-reference (dark contract) + cleanClassroom tokens (light override)
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const contract = getDesignContractWithProjectStyle(project.stylePackId, project.style);
    // palette.text should be dark (from cleanClassroom override)
    expect(contract.palette.text).toBe('#1f2937');
    // card.background should follow palette.surface (light), NOT stay dark from golden-reference
    expect(contract.card.background).toBe(contract.palette.surface);
    // Contrast check: card.background should be light (readable with dark text)
    expect(isColorDark(contract.card.background)).toBe(false);
  });

  it('2. card.border follows palette.border', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const contract = getDesignContractWithProjectStyle(project.stylePackId, project.style);
    expect(contract.card.border).toContain(contract.palette.border);
  });

  it('3. without project.style, card.background stays from base contract (no regression)', () => {
    // modern-clean without override should keep its own card.background
    const baseContract = getDesignContract('modern-clean');
    const mergedContract = getDesignContractWithProjectStyle('modern-clean', undefined);
    expect(mergedContract.card.background).toBe(baseContract.card.background);
  });

  it('4. contract with dark palette override: card.background follows dark surface', () => {
    // Simulate AI sending dark theme override
    const darkStyle = {
      stylePackId: 'modern-clean',
      tokens: {
        colors: {
          background: '#0e1c2f',
          surface: '#182d45',
          text: '#e8f2ff',
          primary: '#f9c12e',
          border: 'rgba(255,255,255,0.09)',
        },
        typography: { fontFamily: 'Segoe UI, Arial, sans-serif' },
      },
    } as any;
    const contract = getDesignContractWithProjectStyle('modern-clean', darkStyle);
    // card.background should follow dark surface
    expect(contract.card.background).toBe('#182d45');
    expect(isColorDark(contract.card.background)).toBe(true);
    // text should be light (readable on dark card)
    expect(isColorDark(contract.palette.text)).toBe(false);
  });
});

describe('EXPORT-CONTRAST-02 — Export HTML dark gradient override', () => {
  it('5. export HTML with dark contract: material background uses dark gradient', () => {
    // Create project with dark theme override
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    bp.designSystem = {
      ...bp.designSystem,
      overrides: {
        'colors.background': '#0e1c2f',
        'colors.surface': '#182d45',
        'colors.text': '#e8f2ff',
      },
    };
    const project = aiBlueprintToSimpleProject(bp);
    const html = exportProjectToHtml(project);
    // Material background should contain dark color (not white)
    const materialMatch = html.match(/data-page-role="material"\][^}]*background:([^;}]+)/);
    if (materialMatch) {
      expect(materialMatch[1]).not.toContain('#ffffff');
      expect(materialMatch[1]).not.toContain('#f6f9fc');
    }
  });

  it('6. export HTML with light contract: material background stays light (no regression)', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const html = exportProjectToHtml(project);
    // Default (cleanClassroom) should have light material background
    const materialMatch = html.match(/data-page-role="material"\][^}]*background:([^;}]+)/);
    if (materialMatch) {
      // Should be light gradient
      expect(materialMatch[1]).toMatch(/#ffffff|#f6f9fc|#f9fafb/i);
    }
  });
});
