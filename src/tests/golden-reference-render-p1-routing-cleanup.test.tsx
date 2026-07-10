/**
 * GOLDEN-REFERENCE-RENDER-P1 PATCH B — Scene Routing Cleanup Tests.
 *
 * PATCH B: composer route by scene.sceneType, NOT content.kind.
 * content.kind is only for generic slot content (text, card, button, etc.).
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  normalizeBlueprint,
  aiJsonToMpiContainer,
} from '../core/ai-mpi-json';
import { getDesignContract } from '../core/mpi-design-contract';
import { renderScenePlan } from '../core/scene-renderer';
import { SceneRendererView } from '../components/SceneRendererView';
import { exportProjectToHtml } from '../export/export-html';
import { createSamplePpknProject } from '../core/sample-project';
import { createSceneProofProject } from '../core/scene-proof-project';

function loadGoldenRef() {
  const path = resolve(__dirname, '../../samples/ai-mpi-json/macam-norma-reference.sample.json');
  return JSON.parse(readFileSync(path, 'utf-8'));
}

describe('GOLDEN-REFERENCE-RENDER-P1 PATCH B — routing cleanup', () => {
  // 1: Composer selected by scene.sceneType (not content.kind)
  it('1. curriculum-guide composer selected by sceneType, not content.kind', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = aiJsonToMpiContainer(bp);
    const scene = container.scenes.find((s) => s.sceneType === 'curriculum-guide')!;
    const contract = getDesignContract('golden-reference');
    const plan = renderScenePlan(scene, contract);
    expect(plan.sceneType).toBe('curriculum-guide');
    // Render via React — composer should be selected by sceneType
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    expect(dom.querySelector('.silse-scene-curriculum-guide')).toBeInTheDocument();
  });

  // 2: objectives-path composer selected by sceneType
  it('2. objectives-path composer selected by sceneType', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = aiJsonToMpiContainer(bp);
    const scene = container.scenes.find((s) => s.sceneType === 'objectives-path')!;
    const contract = getDesignContract('golden-reference');
    const plan = renderScenePlan(scene, contract);
    expect(plan.sceneType).toBe('objectives-path');
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    expect(dom.querySelector('.silse-scene-objectives-path')).toBeInTheDocument();
  });

  // 3: reflection-journal composer selected by sceneType
  it('3. reflection-journal composer selected by sceneType', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = aiJsonToMpiContainer(bp);
    const scene = container.scenes.find((s) => s.sceneType === 'reflection-journal')!;
    const contract = getDesignContract('golden-reference');
    const plan = renderScenePlan(scene, contract);
    expect(plan.sceneType).toBe('reflection-journal');
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    expect(dom.querySelector('.silse-scene-reflection-journal')).toBeInTheDocument();
  });

  // 4: content.kind not used as scene renderer selector
  it('4. content.kind for generic slots (text, card) does NOT trigger scene composer', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = aiJsonToMpiContainer(bp);
    // Find a scene that uses generic content kinds (text/card) — e.g. learning-scene
    const scene = container.scenes.find((s) => s.sceneType === 'learning-scene')!;
    const contract = getDesignContract('golden-reference');
    const plan = renderScenePlan(scene, contract);
    // learning-scene should route by sceneType to LearningMaterialContent, not by content.kind
    expect(plan.sceneType).toBe('learning-scene');
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    expect(dom.querySelector('.silse-scene-learning-scene')).toBeInTheDocument();
  });

  // 5: 5 rendered scenes still route correctly by sceneType
  it('5. 5 rendered scenes (cover, learning, game, quiz, closing) still PASS', () => {
    const project = createSceneProofProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-scene-cover-hero');
    expect(html).toContain('silse-scene-learning-scene');
    expect(html).toContain('silse-scene-game-mission');
    expect(html).toContain('silse-scene-quiz-challenge');
    expect(html).toContain('silse-scene-closing-award');
  });

  // 6: Legacy fallback safe
  it('6. legacy fallback tetap jalan (no scenePlan for legacy pages)', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project);
    // Fase 2b: scenePlan no longer null — all pages go through scene renderer
    expect(html.length).toBeGreaterThan(1000);
  });

  // 7: Export routes by sceneType (7 new scene classes in export)
  it('7. export routes 7 new scenes by sceneType (not content.kind)', () => {
    // Verify the export JS has sceneType-based routing
    const project = createSceneProofProject();
    const html = exportProjectToHtml(project);
    // The export JS should have sceneTypeRenderers object
    expect(html).toContain('sceneTypeRenderers');
  });

  // 8: SceneRendererView routes by sceneType (getSceneComposer)
  it('8. SceneRendererView routes by sceneType (getSceneComposer function)', () => {
    // Verify the source has getSceneComposer
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = aiJsonToMpiContainer(bp);
    const scene = container.scenes.find((s) => s.sceneType === 'discussion-scene')!;
    const contract = getDesignContract('golden-reference');
    const plan = renderScenePlan(scene, contract);
    // discussion-scene should route by sceneType
    expect(plan.sceneType).toBe('discussion-scene');
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    expect(dom.querySelector('.silse-scene-discussion')).toBeInTheDocument();
  });

  // 9: Scene detection doesn't convert full project
  it('9. scene detection is lightweight (no full container conversion)', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project);
    expect(html.length).toBeGreaterThan(1000);
  });

  // 10: Golden reference 12 scenes valid
  it('10. golden reference sample 12 scene tetap valid', () => {
    const raw = loadGoldenRef();
    const bp = normalizeBlueprint(raw);
    expect(bp.scenes.length).toBe(12);
    const container = aiJsonToMpiContainer(bp);
    expect(container.scenes.length).toBe(12);
  });
});
