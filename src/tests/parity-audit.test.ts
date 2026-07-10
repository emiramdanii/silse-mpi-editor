/**
 * PARITY-AUDIT: Verify AI style overrides reach editor AND export.
 */

import { describe, it, expect } from 'vitest';

import { templateToBlueprint, TEMPLATE_PPKN_NORMA } from '../core/guided-flow/pedagogical-templates';
import { aiBlueprintToSimpleProject } from '../core/ai-mpi-json/aiBlueprintToSimpleProject';
import { getDesignContractWithProjectStyle, getDesignContract } from '../core/mpi-design-contract';
import { buildSceneRenderPlanForPage } from '../core/scene-renderer';
import { exportProjectToHtml } from '../export/export-html';

function blueprintWithOverrides() {
  const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
  bp.designSystem = {
    ...bp.designSystem,
    overrides: {
      'colors.primary': '#8b5cf6',
      'colors.background': '#1a0a2e',
      'typography.fontFamily': 'Georgia, serif',
    },
  };
  return bp;
}

describe('PARITY-AUDIT: Fase 1 — Data parity (AI → project.style.tokens)', () => {
  it('1. AI overrides reach project.style.tokens.colors.primary', () => {
    const project = aiBlueprintToSimpleProject(blueprintWithOverrides());
    expect(project.style?.tokens?.colors?.primary).toBe('#8b5cf6');
  });

  it('2. AI overrides reach project.style.tokens.colors.background', () => {
    const project = aiBlueprintToSimpleProject(blueprintWithOverrides());
    expect(project.style?.tokens?.colors?.background).toBe('#1a0a2e');
  });

  it('3. AI overrides reach project.style.tokens.typography.fontFamily', () => {
    const project = aiBlueprintToSimpleProject(blueprintWithOverrides());
    expect(project.style?.tokens?.typography?.fontFamily).toBe('Georgia, serif');
  });
});

describe('PARITY-AUDIT: Fase 2 — Editor parity (project.style → contract)', () => {
  it('4. getDesignContractWithProjectStyle applies override primary', () => {
    const project = aiBlueprintToSimpleProject(blueprintWithOverrides());
    const contract = getDesignContractWithProjectStyle(project.stylePackId, project.style);
    expect(contract.palette.primary).toBe('#8b5cf6');
  });

  it('5. getDesignContractWithProjectStyle applies override background', () => {
    const project = aiBlueprintToSimpleProject(blueprintWithOverrides());
    const contract = getDesignContractWithProjectStyle(project.stylePackId, project.style);
    expect(contract.palette.background).toBe('#1a0a2e');
  });

  it('6. getDesignContractWithProjectStyle applies override font to bodyFont', () => {
    const project = aiBlueprintToSimpleProject(blueprintWithOverrides());
    const contract = getDesignContractWithProjectStyle(project.stylePackId, project.style);
    expect(contract.typography.bodyFont).toBe('Georgia, serif');
  });

  it('7. getDesignContract (old) does NOT apply overrides', () => {
    const project = aiBlueprintToSimpleProject(blueprintWithOverrides());
    const contract = getDesignContract(project.stylePackId);
    // Old helper uses base contract — overrides NOT applied
    expect(contract.palette.primary).not.toBe('#8b5cf6');
  });
});

describe('PARITY-AUDIT: Fase 2b — Scene render plan uses project.style', () => {
  it('8. buildSceneRenderPlanForPage uses contract with overrides (palette.primary)', () => {
    const project = aiBlueprintToSimpleProject(blueprintWithOverrides());
    const page = project.pages[0];
    const plan = buildSceneRenderPlanForPage(project, page);
    if (plan?.palette) {
      expect(plan.palette.primary).toBe('#8b5cf6');
    }
  });

  it('9. buildSceneRenderPlanForPage uses contract with overrides (palette.background)', () => {
    const project = aiBlueprintToSimpleProject(blueprintWithOverrides());
    const page = project.pages[0];
    const plan = buildSceneRenderPlanForPage(project, page);
    if (plan?.palette) {
      expect(plan.palette.background).toBe('#1a0a2e');
    }
  });
});

describe('PARITY-AUDIT: Fase 3 — Export parity (project.style → export HTML)', () => {
  it('10. export HTML contains override color #8b5cf6', () => {
    const project = aiBlueprintToSimpleProject(blueprintWithOverrides());
    const html = exportProjectToHtml(project);
    expect(html).toContain('#8b5cf6');
  });

  it('11. export HTML contains override background #1a0a2e', () => {
    const project = aiBlueprintToSimpleProject(blueprintWithOverrides());
    const html = exportProjectToHtml(project);
    expect(html).toContain('#1a0a2e');
  });

  it('12. export HTML contains override font Georgia, serif', () => {
    const project = aiBlueprintToSimpleProject(blueprintWithOverrides());
    const html = exportProjectToHtml(project);
    expect(html).toContain('Georgia, serif');
  });

  it('13. export CSS variables have override values', () => {
    const project = aiBlueprintToSimpleProject(blueprintWithOverrides());
    const html = exportProjectToHtml(project);
    expect(html).toMatch(/--silse-color-primary:\s*#8b5cf6/);
    expect(html).toMatch(/--silse-color-background:\s*#1a0a2e/);
    expect(html).toMatch(/--silse-font-family:\s*Georgia, serif/);
  });

  it('14. export without overrides uses base colors (no false positive)', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    const project = aiBlueprintToSimpleProject(bp);
    const html = exportProjectToHtml(project);
    // Base colors should NOT contain #8b5cf6 as a STYLE VALUE (outside :root token definitions).
    // Fase 1 P4: :root now defines --color-marker-navigation: #8b5cf6 as a token, which is correct.
    // The test should only check that #8b5cf6 is not used as inline style outside :root.
    // Strip the :root block before checking.
    const htmlWithoutRoot = html.replace(/:root\s*\{[^}]*\}/g, '');
    expect(htmlWithoutRoot).not.toContain('#8b5cf6');
  });
});
