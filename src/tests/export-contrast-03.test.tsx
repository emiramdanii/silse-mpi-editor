/**
 * EXPORT-CONTRAST-03 — Panel backgrounds (learning + quiz) consistency with palette.
 *
 * Bug: learning.explanationPanel, learning.studentActionPanel, quiz.questionPanel,
 * quiz.answerCard punya hardcoded dark background dari base contract (golden-reference
 * #182d45). Saat palette di-override ke light theme, panel backgrounds tetap dark
 * → text gelap di panel gelap = unreadable.
 *
 * Fix: getDesignContractWithProjectStyle override panel backgrounds mengikuti
 * palette.surface, borders mengikuti palette.border.
 */

import { describe, it, expect } from 'vitest';

import { getDesignContractWithProjectStyle, getDesignContract } from '../core/mpi-design-contract';
import { templateToBlueprint, TEMPLATE_PPKN_NORMA } from '../core/guided-flow/pedagogical-templates';
import { aiBlueprintToSimpleProject } from '../core/ai-mpi-json/aiBlueprintToSimpleProject';

describe('EXPORT-CONTRAST-03 — Learning panel backgrounds follow palette override', () => {
  it('1. learning.explanationPanel.background follows palette.surface (light)', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const contract = getDesignContractWithProjectStyle(project.stylePackId, project.style);
    expect(contract.learning?.explanationPanel?.background).toBe(contract.palette.surface);
  });

  it('2. learning.explanationPanel.border follows palette.border', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const contract = getDesignContractWithProjectStyle(project.stylePackId, project.style);
    expect(contract.learning?.explanationPanel?.border).toContain(contract.palette.border);
  });

  it('3. learning.studentActionPanel.background follows palette.surface (light)', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const contract = getDesignContractWithProjectStyle(project.stylePackId, project.style);
    expect(contract.learning?.studentActionPanel?.background).toBe(contract.palette.surface);
  });

  it('4. learning.studentActionPanel.labelColor follows palette.mutedText', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const contract = getDesignContractWithProjectStyle(project.stylePackId, project.style);
    expect(contract.learning?.studentActionPanel?.labelColor).toBe(contract.palette.mutedText);
  });

  it('5. without project.style, learning panels stay from base contract (no regression)', () => {
    const baseContract = getDesignContract('modern-clean');
    const merged = getDesignContractWithProjectStyle('modern-clean', undefined);
    expect(merged.learning?.explanationPanel?.background).toBe(baseContract.learning?.explanationPanel?.background);
  });
});

describe('EXPORT-CONTRAST-03 — Quiz panel backgrounds follow palette override', () => {
  it('6. quiz.questionPanel.background follows palette.surface (if exists)', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const contract = getDesignContractWithProjectStyle(project.stylePackId, project.style);
    if (contract.quiz?.questionPanel) {
      expect(contract.quiz.questionPanel.background).toBe(contract.palette.surface);
    }
  });

  it('7. quiz.answerCard.background follows palette.surface (if exists)', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const contract = getDesignContractWithProjectStyle(project.stylePackId, project.style);
    if (contract.quiz?.answerCard) {
      expect(contract.quiz.answerCard.background).toBe(contract.palette.surface);
    }
  });

  it('8. dark palette override: panels follow dark surface', () => {
    const darkStyle = {
      stylePackId: 'modern-clean',
      tokens: {
        colors: {
          background: '#0e1c2f',
          surface: '#182d45',
          text: '#e8f2ff',
          border: 'rgba(255,255,255,0.09)',
          mutedText: '#6e90b5',
        },
        typography: { fontFamily: 'Segoe UI, Arial, sans-serif' },
      },
    } as any;
    const contract = getDesignContractWithProjectStyle('modern-clean', darkStyle);
    expect(contract.learning?.explanationPanel?.background).toBe('#182d45');
    expect(contract.learning?.studentActionPanel?.background).toBe('#182d45');
  });
});
