/**
 * CUSTOM-STYLE-01 PATCH: customStyle per-element (header, panel, chip, button).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { templateToBlueprint, TEMPLATE_PPKN_NORMA } from '../core/guided-flow/pedagogical-templates';
import { aiBlueprintToSimpleProject } from '../core/ai-mpi-json/aiBlueprintToSimpleProject';
import { exportProjectToHtml } from '../export/export-html';
import { buildMpiPromptText } from '../core/ai-prompt-contract/buildMpiPromptContract';

describe('CUSTOM-STYLE-01 PATCH: per-element customStyle', () => {
  it('1. SceneHeader accepts customStyle.header', () => {
    const src = readFileSync(resolve(__dirname, '../components/scene-blocks/index.tsx'), 'utf-8');
    expect(src).toContain('customStyle?.header');
    expect(src).toContain('...headerStyle');
  });

  it('2. ScenePanel accepts customStyle.panel', () => {
    const src = readFileSync(resolve(__dirname, '../components/scene-blocks/index.tsx'), 'utf-8');
    expect(src).toContain('customStyle?.panel');
    expect(src).toContain('...panelStyle');
  });

  it('3. SceneChip accepts customStyle.chip (inside SceneHeader)', () => {
    const src = readFileSync(resolve(__dirname, '../components/scene-blocks/index.tsx'), 'utf-8');
    expect(src).toContain('customStyle?.chip');
    expect(src).toContain('...chipStyle');
  });

  it('4. ActionButtonBlock accepts customStyle.button', () => {
    const src = readFileSync(resolve(__dirname, '../components/scene-blocks/index.tsx'), 'utf-8');
    expect(src).toContain('customStyle?.button');
    expect(src).toContain('...buttonStyle');
  });

  it('5. prompt AI documents all 5 element keys', () => {
    const prompt = buildMpiPromptText();
    expect(prompt).toContain('"shell"');
    expect(prompt).toContain('"header"');
    expect(prompt).toContain('"panel"');
    expect(prompt).toContain('"chip"');
    expect(prompt).toContain('"button"');
  });

  it('6. prompt AI shows example with all 5 elements', () => {
    const prompt = buildMpiPromptText();
    expect(prompt).toContain('"header": { "fontSize": "52px"');
    expect(prompt).toContain('"chip": { "background": "rgba(255,255,255,0.1)"');
    expect(prompt).toContain('"button": { "background": "linear-gradient');
  });

  it('7. export HTML contains customStyle.header when set', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    bp.scenes[0].slots[0].customStyle = {
      header: { fontSize: '52px', color: '#ffffff' },
    };
    const project = aiBlueprintToSimpleProject(bp);
    const html = exportProjectToHtml(project);
    expect(html).toContain('52px');
  });

  it('8. export HTML contains customStyle.panel when set', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    bp.scenes[0].slots[0].customStyle = {
      panel: { borderRadius: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
    };
    const project = aiBlueprintToSimpleProject(bp);
    const html = exportProjectToHtml(project);
    expect(html).toContain('24px');
  });

  it('9. BlockProps type has customStyle field', () => {
    const src = readFileSync(resolve(__dirname, '../components/scene-blocks/index.tsx'), 'utf-8');
    expect(src).toContain('customStyle?: Record<string, Record<string, string>>');
  });
});
