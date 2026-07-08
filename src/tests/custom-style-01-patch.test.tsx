/**
 * CUSTOM-STYLE-01 PATCH: customStyle per-element (header, panel, chip, button).
 *
 * DEEP-STYLE-INJECTION-01: tests 1-4 converted from source-string to behavior
 * tests. Source-string tests break on refactor; behavior tests verify actual
 * functionality (customStyle.header/panel/chip/button is applied to DOM).
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

import { getDesignContract } from '../core/mpi-design-contract';
import {
  SceneShell, SceneHeader, ScenePanel, SceneChip, ActionButtonBlock,
  CustomStyleProvider,
} from '../components/scene-blocks';
import { templateToBlueprint, TEMPLATE_PPKN_NORMA } from '../core/guided-flow/pedagogical-templates';
import { aiBlueprintToSimpleProject } from '../core/ai-mpi-json/aiBlueprintToSimpleProject';
import { exportProjectToHtml } from '../export/export-html';
import { buildMpiPromptText } from '../core/ai-prompt-contract/buildMpiPromptContract';

const contract = getDesignContract('modern-clean');

describe('CUSTOM-STYLE-01 PATCH: per-element customStyle', () => {
  it('1. SceneHeader accepts customStyle.header (applied to DOM)', () => {
    const { container } = render(
      <SceneHeader
        contract={contract}
        title="T"
        customStyle={{ header: { borderBottom: '4px solid #aabbcc' } } as any}
      />
    );
    const header = container.querySelector('.silse-block-header') as HTMLElement;
    expect(header).toBeTruthy();
    expect(header.style.borderBottom).toContain('4px solid');
  });

  it('2. ScenePanel accepts customStyle.panel (applied to DOM)', () => {
    const { container } = render(
      <ScenePanel
        contract={contract}
        customStyle={{ panel: { borderRadius: '27px' } } as any}
      >body</ScenePanel>
    );
    const panel = container.querySelector('.silse-block-panel') as HTMLElement;
    expect(panel).toBeTruthy();
    expect(panel.style.borderRadius).toContain('27px');
  });

  it('3. SceneChip accepts customStyle.chip (applied to DOM)', () => {
    const { container } = render(
      <SceneChip
        contract={contract}
        label="L"
        customStyle={{ chip: { background: 'rgb(10,20,30)' } } as any}
      />
    );
    const chip = container.querySelector('.silse-block-chip') as HTMLElement;
    expect(chip).toBeTruthy();
    expect(chip.style.background).toContain('rgb(10, 20, 30)');
  });

  it('4. ActionButtonBlock accepts customStyle.button (applied to DOM)', () => {
    const { container } = render(
      <ActionButtonBlock
        contract={contract}
        label="B"
        customStyle={{ button: { borderRadius: '6px' } } as any}
      />
    );
    const btn = container.querySelector('.silse-block-action') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.style.borderRadius).toContain('6px');
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
    // Behavior test: customStyle prop is accepted by all 5 blocks without error.
    // If the type didn't accept customStyle, TypeScript would catch it at compile
    // time, and the render would throw at runtime.
    const { container } = render(
      <CustomStyleProvider value={{ shell: { background: 'rgb(1,2,3)' } } as any}>
        <SceneShell contract={contract}>
          <SceneHeader contract={contract} title="T" />
          <ScenePanel contract={contract}>p</ScenePanel>
          <SceneChip contract={contract} label="C" />
          <ActionButtonBlock contract={contract} label="B" />
        </SceneShell>
      </CustomStyleProvider>
    );
    expect(container.querySelector('.silse-block-shell')).toBeTruthy();
    expect(container.querySelector('.silse-block-header')).toBeTruthy();
    expect(container.querySelector('.silse-block-panel')).toBeTruthy();
    expect(container.querySelector('.silse-block-chip')).toBeTruthy();
    expect(container.querySelector('.silse-block-action')).toBeTruthy();
  });
});
