/**
 * CUSTOM-STYLE-01: customStyle from AI — schema + bridge + render + export.
 */

import { describe, it, expect } from 'vitest';

import { templateToBlueprint, TEMPLATE_PPKN_NORMA } from '../core/guided-flow/pedagogical-templates';
import { aiBlueprintToSimpleProject } from '../core/ai-mpi-json/aiBlueprintToSimpleProject';
import { exportProjectToHtml } from '../export/export-html';
import { buildMpiPromptText } from '../core/ai-prompt-contract/buildMpiPromptContract';

describe('CUSTOM-STYLE-01: Schema + Bridge', () => {
  it('1. customStyle from AI blueprint reaches project page', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    // Add customStyle to first scene's slot
    bp.scenes[0].slots[0].customStyle = {
      shell: { background: 'linear-gradient(135deg, #667eea, #764ba2)' },
      panel: { borderRadius: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
    };
    const project = aiBlueprintToSimpleProject(bp);
    expect(project.pages[0].sceneCustomStyle).toBeDefined();
    expect(project.pages[0].sceneCustomStyle?.shell?.background).toContain('linear-gradient');
    expect(project.pages[0].sceneCustomStyle?.panel?.borderRadius).toBe('24px');
  });

  it('2. project without customStyle has undefined sceneCustomStyle', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    const project = aiBlueprintToSimpleProject(bp);
    expect(project.pages[0].sceneCustomStyle).toBeUndefined();
  });
});

describe('CUSTOM-STYLE-01: Font guard in SceneRendererView', () => {
  it('3. prompt AI documents customStyle feature', () => {
    const prompt = buildMpiPromptText();
    expect(prompt).toContain('customStyle');
    expect(prompt).toContain('shell');
    expect(prompt).toContain('borderRadius');
    expect(prompt).toContain('boxShadow');
  });

  it('4. prompt AI warns about font restriction in customStyle', () => {
    const prompt = buildMpiPromptText();
    expect(prompt).toMatch(/fontFamily.*TIDAK boleh/i);
  });
});

describe('CUSTOM-STYLE-01: Export parity', () => {
  it('5. export HTML contains customStyle gradient when set', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    bp.scenes[0].slots[0].customStyle = {
      shell: { background: 'linear-gradient(135deg, #667eea, #764ba2)' },
    };
    const project = aiBlueprintToSimpleProject(bp);
    const html = exportProjectToHtml(project);
    expect(html).toContain('linear-gradient(135deg, #667eea, #764ba2)');
  });

  it('6. export HTML contains customStyle borderRadius when set', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    bp.scenes[0].slots[0].customStyle = {
      panel: { borderRadius: '24px' },
    };
    const project = aiBlueprintToSimpleProject(bp);
    const html = exportProjectToHtml(project);
    expect(html).toContain('24px');
  });

  it('7. export without customStyle does not contain AI gradient', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    const project = aiBlueprintToSimpleProject(bp);
    const html = exportProjectToHtml(project);
    expect(html).not.toContain('#667eea');
  });
});
