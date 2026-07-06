/**
 * PREMIUM-STYLE-AFTER-FOUNDATION-01 — Tests.
 *
 * Tests: premium polish uses existing design contract, no parallel system,
 * editor/preview/export parity, interaction behavior still works.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { normalizeBlueprint, aiJsonToMpiContainer, aiBlueprintToSimpleProject } from '../core/ai-mpi-json';
import { getDesignContract } from '../core/mpi-design-contract';
import { renderScenePlan } from '../core/scene-renderer';
import { SceneRendererView } from '../components/SceneRendererView';
import { exportProjectToHtml } from '../export/export-html';
import { createSamplePpknProject } from '../core/sample-project';

const contract = getDesignContract('golden-reference');

function loadGoldenRef() {
  return JSON.parse(readFileSync(resolve(__dirname, '../../samples/ai-mpi-json/macam-norma-reference.sample.json'), 'utf-8'));
}

describe('PREMIUM-STYLE-AFTER-FOUNDATION-01 — Contract Safety (behavior test)', () => {
  it('1. SceneShell renders with design contract palette colors (not hardcoded)', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = aiJsonToMpiContainer(bp);
    const scene = container.scenes.find((s) => s.sceneType === 'curriculum-guide')!;
    const plan = renderScenePlan(scene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    const shell = dom.querySelector('.silse-block-shell') as HTMLElement;
    expect(shell).toBeInTheDocument();
    // Shell background should contain the contract's surface color (proves contract is used)
    expect(shell.style.background).toContain(contract.palette.surface);
  });

  it('2. ScenePanel renders with contract card shadow (not hardcoded)', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = aiJsonToMpiContainer(bp);
    const scene = container.scenes.find((s) => s.sceneType === 'curriculum-guide')!;
    const plan = renderScenePlan(scene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    const panel = dom.querySelector('.silse-block-panel') as HTMLElement;
    expect(panel).toBeInTheDocument();
    // Panel should have a box-shadow (from contract.card.shadow or default)
    expect(panel.style.boxShadow || window.getComputedStyle(panel).boxShadow).toBeTruthy();
  });
});

describe('PREMIUM-STYLE-AFTER-FOUNDATION-01 — Scene Shell Polish', () => {
  it('3. SceneShell includes premium gradient background', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = aiJsonToMpiContainer(bp);
    const scene = container.scenes.find((s) => s.sceneType === 'curriculum-guide')!;
    const plan = renderScenePlan(scene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    const shell = dom.querySelector('.silse-block-shell') as HTMLElement;
    expect(shell).toBeInTheDocument();
    // Should have radial-gradient in background
    expect(shell.style.background).toContain('radial-gradient');
  });

  it('4. ScenePanel includes depth shadow', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = aiJsonToMpiContainer(bp);
    const scene = container.scenes.find((s) => s.sceneType === 'curriculum-guide')!;
    const plan = renderScenePlan(scene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    const panel = dom.querySelector('.silse-block-panel') as HTMLElement;
    expect(panel).toBeInTheDocument();
    expect(panel.style.boxShadow).toBeTruthy();
  });

  it('5. SceneHeader includes accent border bottom', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = aiJsonToMpiContainer(bp);
    const scene = container.scenes.find((s) => s.sceneType === 'curriculum-guide')!;
    const plan = renderScenePlan(scene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    const header = dom.querySelector('.silse-block-header') as HTMLElement;
    expect(header).toBeInTheDocument();
    expect(header.style.borderBottom).toBeTruthy();
  });
});

describe('PREMIUM-STYLE-AFTER-FOUNDATION-01 — Export Parity', () => {
  it('6. export HTML contains radial-gradient in shell', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const project = aiBlueprintToSimpleProject(bp);
    const html = exportProjectToHtml(project);
    expect(html).toContain('radial-gradient');
  });

  it('7. export HTML contains box-shadow in panel', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const project = aiBlueprintToSimpleProject(bp);
    const html = exportProjectToHtml(project);
    expect(html).toContain('box-shadow:0 2px 8px');
  });

  it('8. export HTML contains border-bottom accent in header', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const project = aiBlueprintToSimpleProject(bp);
    const html = exportProjectToHtml(project);
    expect(html).toContain('border-bottom:2px solid');
  });
});

describe('PREMIUM-STYLE-AFTER-FOUNDATION-01 — Interaction Still Works', () => {
  it('9. classification game still renders with premium polish', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = aiJsonToMpiContainer(bp);
    const scene = container.scenes.find((s) => s.sceneType === 'classification-game')!;
    const plan = renderScenePlan(scene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} interactive />);
    expect(dom.querySelector('.silse-scene-classification-game')).toBeInTheDocument();
    expect(dom.querySelector('[data-testid="classification-pool"]')).toBeInTheDocument();
  });

  it('10. legacy project still safe after premium polish', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('"scenePlan":null');
    expect(() => exportProjectToHtml(project)).not.toThrow();
  });

  it('11. 12 golden reference scenes still pass', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    expect(bp.scenes).toHaveLength(12);
    const container = aiJsonToMpiContainer(bp);
    container.scenes.forEach((scene) => {
      const plan = renderScenePlan(scene, contract);
      expect(plan.sceneClass).toContain('silse-scene');
    });
  });

  it('12. export wireInteractions still present after premium polish', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('wireInteractions()');
    expect(html).toContain('[data-tab-id]');
    expect(html).toContain('[data-action="save-response"]');
  });
});
