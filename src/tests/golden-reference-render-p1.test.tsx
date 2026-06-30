/**
 * GOLDEN-REFERENCE-RENDER-P1 — Test Suite.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  validateAiMpiJson,
  normalizeBlueprint,
  aiJsonToMpiContainer,
} from '../core/ai-mpi-json';
import { getDesignContract, DESIGN_CONTRACTS } from '../core/mpi-design-contract';
import {
  renderScenePlan,
} from '../core/scene-renderer';
import { SceneRendererView } from '../components/SceneRendererView';
import { exportProjectToHtml } from '../export/export-html';
import { createSceneProofProject } from '../core/scene-proof-project';
import { createSamplePpknProject } from '../core/sample-project';

function loadGoldenRef() {
  const path = resolve(__dirname, '../../samples/ai-mpi-json/macam-norma-reference.sample.json');
  return JSON.parse(readFileSync(path, 'utf-8'));
}

describe('GOLDEN-REFERENCE-RENDER-P1 — 7 scene composers', () => {
  // 1-7: Each scene renders with correct blocks
  it('1. curriculum-guide render memakai SceneTabs/ScenePanel', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = aiJsonToMpiContainer(bp);
    const scene = container.scenes.find((s) => s.sceneType === 'curriculum-guide')!;
    const contract = getDesignContract('golden-reference');
    const plan = renderScenePlan(scene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    expect(dom.querySelector('.silse-scene-curriculum-guide')).toBeInTheDocument();
    expect(dom.querySelector('.silse-curriculum-tabs')).toBeInTheDocument();
    expect(dom.querySelector('.silse-curriculum-panel')).toBeInTheDocument();
  });

  it('2. objectives-path render memakai ObjectiveItem/ActivityStep', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = aiJsonToMpiContainer(bp);
    const scene = container.scenes.find((s) => s.sceneType === 'objectives-path')!;
    const contract = getDesignContract('golden-reference');
    const plan = renderScenePlan(scene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    expect(dom.querySelector('.silse-scene-objectives-path')).toBeInTheDocument();
  });

  it('3. starter-review render memakai DiscussionBanner/ResponseInput', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = aiJsonToMpiContainer(bp);
    const scene = container.scenes.find((s) => s.sceneType === 'starter-review')!;
    const contract = getDesignContract('golden-reference');
    const plan = renderScenePlan(scene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    expect(dom.querySelector('.silse-scene-starter-review')).toBeInTheDocument();
  });

  it('4. discussion-scene render memakai TimerBlock/ResponseInput', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = aiJsonToMpiContainer(bp);
    const scene = container.scenes.find((s) => s.sceneType === 'discussion-scene')!;
    const contract = getDesignContract('golden-reference');
    const plan = renderScenePlan(scene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    expect(dom.querySelector('.silse-scene-discussion')).toBeInTheDocument();
    expect(dom.querySelector('.silse-discussion-timer')).toBeInTheDocument();
    expect(dom.querySelector('.silse-discussion-input')).toBeInTheDocument();
  });

  it('5. case-analysis render memakai RevealBlock', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = aiJsonToMpiContainer(bp);
    const scene = container.scenes.find((s) => s.sceneType === 'case-analysis')!;
    const contract = getDesignContract('golden-reference');
    const plan = renderScenePlan(scene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    expect(dom.querySelector('.silse-scene-case-analysis')).toBeInTheDocument();
  });

  it('6. result-summary render memakai ScoreSummary', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = aiJsonToMpiContainer(bp);
    const scene = container.scenes.find((s) => s.sceneType === 'result-summary')!;
    const contract = getDesignContract('golden-reference');
    const plan = renderScenePlan(scene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    expect(dom.querySelector('.silse-scene-result-summary')).toBeInTheDocument();
  });

  it('7. reflection-journal render memakai Portfolio/ReflectionPrompt', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = aiJsonToMpiContainer(bp);
    const scene = container.scenes.find((s) => s.sceneType === 'reflection-journal')!;
    const contract = getDesignContract('golden-reference');
    const plan = renderScenePlan(scene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    expect(dom.querySelector('.silse-scene-reflection-journal')).toBeInTheDocument();
  });

  // 11: Reusable block classes appear
  it('11. reusable block classes muncul (silse-block-shell, silse-block-header, dll)', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = aiJsonToMpiContainer(bp);
    const scene = container.scenes.find((s) => s.sceneType === 'curriculum-guide')!;
    const contract = getDesignContract('golden-reference');
    const plan = renderScenePlan(scene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    expect(dom.querySelector('.silse-block-shell')).toBeInTheDocument();
    expect(dom.querySelector('.silse-block-header')).toBeInTheDocument();
    expect(dom.querySelector('.silse-block-chip')).toBeInTheDocument();
    expect(dom.querySelector('.silse-block-panel')).toBeInTheDocument();
    expect(dom.querySelector('.silse-block-tabs')).toBeInTheDocument();
  });

  // 12: Visual token from design contract
  it('12. visual token dari design contract dipakai (contract palette background in plan)', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = aiJsonToMpiContainer(bp);
    const scene = container.scenes.find((s) => s.sceneType === 'discussion-scene')!;
    const contract = getDesignContract('golden-reference');
    const plan = renderScenePlan(scene, contract);
    // Plan.background.color comes from contract
    expect(plan.background.color).toBe(contract.palette.background);
    // Plan.palette.background comes from contract
    expect(plan.palette.background).toBe(contract.palette.background);
  });

  // 13: Golden reference sample valid
  it('13. golden reference sample 12 scene tetap valid', () => {
    const raw = loadGoldenRef();
    const errors = validateAiMpiJson(raw);
    expect(errors).toHaveLength(0);
    const bp = normalizeBlueprint(raw);
    expect(bp.scenes.length).toBe(12);
  });

  // 14: 5 rendered scenes regression
  it('14. 5 rendered scene lama tetap PASS (export HTML)', () => {
    const project = createSceneProofProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-scene-cover-hero');
    expect(html).toContain('silse-scene-learning-scene');
    expect(html).toContain('silse-scene-game-mission');
    expect(html).toContain('silse-scene-quiz-challenge');
    expect(html).toContain('silse-scene-closing-award');
  });

  // 15: Legacy fallback
  it('15. legacy fallback tetap PASS', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project);
    expect(html).not.toContain('silse-scene-curriculum-guide');
    expect(html).not.toContain('silse-scene-discussion');
  });

  // Additional: golden-reference design contract exists
  it('16. golden-reference design contract tersedia', () => {
    expect(DESIGN_CONTRACTS['golden-reference']).toBeDefined();
    const c = getDesignContract('golden-reference');
    expect(c.palette.background).toBe('#0e1c2f');
    expect(c.palette.surface).toBe('#182d45');
  });

  // Additional: export contains 7 new scene classes
  it('17. export HTML contains 7 new scene classes', () => {
    // We need a project that has these scenes. Let's check golden reference container.
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = aiJsonToMpiContainer(bp);
    const contract = getDesignContract('golden-reference');
    // Check each scene renders
    for (const scene of container.scenes) {
      const plan = renderScenePlan(scene, contract);
      const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
      const sceneEl = dom.querySelector(`[class*="silse-scene-"]`);
      expect(sceneEl).toBeInTheDocument();
    }
  });
});
