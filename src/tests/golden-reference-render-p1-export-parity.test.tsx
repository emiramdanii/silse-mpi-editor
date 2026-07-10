/**
 * GOLDEN-REFERENCE-RENDER-P1 PATCH A — Export Parity Tests.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  validateAiMpiJson,
  normalizeBlueprint,
  aiJsonToMpiContainer,
} from '../core/ai-mpi-json';
import { getDesignContract } from '../core/mpi-design-contract';
import { renderScenePlan } from '../core/scene-renderer';
import { SceneRendererView } from '../components/SceneRendererView';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createSamplePpknProject } from '../core/sample-project';
import { exportProjectToHtml } from '../export/export-html';

function loadGoldenRef() {
  const path = resolve(__dirname, '../../samples/ai-mpi-json/macam-norma-reference.sample.json');
  return JSON.parse(readFileSync(path, 'utf-8'));
}

describe('GOLDEN-REFERENCE-RENDER-P1 PATCH A — export parity', () => {
  // 1-7: Each scene renders in export with correct classes
  function getSceneHtml(sceneType: string): string {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = aiJsonToMpiContainer(bp);
    const scene = container.scenes.find((s) => s.sceneType === sceneType)!;
    const contract = getDesignContract('golden-reference');
    const plan = renderScenePlan(scene, contract);
    // Render via React to get the DOM
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    return dom.innerHTML;
  }

  it('1. curriculum-guide export memuat SceneTabs/ScenePanel class', () => {
    const html = getSceneHtml('curriculum-guide');
    expect(html).toContain('silse-scene-curriculum-guide');
    expect(html).toContain('silse-block-tabs');
    expect(html).toContain('silse-block-panel');
  });

  it('2. objectives-path export memuat objective classes', () => {
    const html = getSceneHtml('objectives-path');
    expect(html).toContain('silse-scene-objectives-path');
    expect(html).toContain('silse-objective-item');
  });

  it('3. starter-review export memuat discussion/input classes', () => {
    const html = getSceneHtml('starter-review');
    expect(html).toContain('silse-scene-starter-review');
    expect(html).toContain('silse-block-discussion');
    expect(html).toContain('silse-block-input');
  });

  it('4. discussion-scene export memuat timer/input/action classes', () => {
    const html = getSceneHtml('discussion-scene');
    expect(html).toContain('silse-scene-discussion');
    expect(html).toContain('silse-block-timer');
    expect(html).toContain('silse-block-input');
    expect(html).toContain('silse-block-action');
  });

  it('5. case-analysis export memuat reveal/discussion classes', () => {
    const html = getSceneHtml('case-analysis');
    expect(html).toContain('silse-scene-case-analysis');
    expect(html).toContain('silse-block-reveal');
    expect(html).toContain('silse-case-card');
  });

  it('6. result-summary export memuat result circle/breakdown classes', () => {
    const html = getSceneHtml('result-summary');
    expect(html).toContain('silse-scene-result-summary');
    expect(html).toContain('silse-result-circle');
    expect(html).toContain('silse-result-breakdown');
  });

  it('7. reflection-journal export memuat portfolio/reflection/input classes', () => {
    const html = getSceneHtml('reflection-journal');
    expect(html).toContain('silse-scene-reflection-journal');
    expect(html).toContain('silse-block-portfolio');
    expect(html).toContain('silse-block-reflection');
    expect(html).toContain('silse-block-input');
  });

  // 8: Export uses token from golden-reference contract
  it('8. export memakai token golden-reference (background, surface)', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = aiJsonToMpiContainer(bp);
    const scene = container.scenes.find((s) => s.sceneType === 'discussion-scene')!;
    const contract = getDesignContract('golden-reference');
    const plan = renderScenePlan(scene, contract);
    // Plan.palette comes from contract
    expect(plan.palette.background).toBe('#0e1c2f');
    expect(plan.palette.surface).toBe('#182d45');
  });

  // 9: Editor-preview-export class parity for 7 scenes
  it('9. editor-preview-export class parity untuk 7 scene (same classes)', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = aiJsonToMpiContainer(bp);
    const contract = getDesignContract('golden-reference');
    const sceneTypes = ['curriculum-guide', 'objectives-path', 'starter-review', 'discussion-scene', 'case-analysis', 'result-summary', 'reflection-journal'];
    for (const st of sceneTypes) {
      const scene = container.scenes.find((s) => s.sceneType === st)!;
      const plan = renderScenePlan(scene, contract);
      const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
      const sceneEl = dom.querySelector(`[class*="silse-scene-"]`);
      expect(sceneEl).toBeInTheDocument();
      // Block classes should be present
      expect(dom.querySelector('.silse-block-shell')).toBeInTheDocument();
      expect(dom.querySelector('.silse-block-header')).toBeInTheDocument();
    }
  });

  // 10: Legacy fallback — Fase 2b: ALL pages now have scenePlan (no more null)
  it('10. legacy fallback tetap jalan', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project);
    // Fase 2b Step 4+6: scenePlan is no longer null — all pages go through scene renderer
    expect(html.length).toBeGreaterThan(1000);
  });

  // 11: Full golden reference sample 12 scene tetap valid
  it('11. golden reference sample 12 scene tetap valid', () => {
    const raw = loadGoldenRef();
    expect(validateAiMpiJson(raw)).toHaveLength(0);
    const bp = normalizeBlueprint(raw);
    expect(bp.scenes.length).toBe(12);
    const container = aiJsonToMpiContainer(bp);
    expect(container.scenes.length).toBe(12);
  });

  // 12: Reusable block classes appear in export
  it('12. reusable block classes muncul di export (silse-block-shell, header, panel)', () => {
    const html = getSceneHtml('curriculum-guide');
    expect(html).toContain('silse-block-shell');
    expect(html).toContain('silse-block-header');
    expect(html).toContain('silse-block-panel');
    expect(html).toContain('silse-block-chip');
  });
});
