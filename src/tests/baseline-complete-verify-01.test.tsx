/**
 * BASELINE-COMPLETE-VERIFY-01 — No Lost Work Guard.
 *
 * Static guard memastikan fitur dari batch sebelumnya tidak hilang setelah baseline sync.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { exportProjectToHtml } from '../export/export-html';
import { createSamplePpknProject } from '../core/sample-project';
import { createSceneProofProject } from '../core/scene-proof-project';
import { aiBlueprintToSimpleProject, normalizeBlueprint } from '../core/ai-mpi-json';
import { ClassificationGameComposer } from '../components/scene-composers';
import { getDesignContract } from '../core/mpi-design-contract';

function loadGoldenRef() {
  return JSON.parse(readFileSync(resolve(__dirname, '../../samples/ai-mpi-json/macam-norma-reference.sample.json'), 'utf-8'));
}

describe('BASELINE-COMPLETE-VERIFY-01 — No Lost Work Guard', () => {
  it('1. ClassificationGameComposer exists and is importable', () => {
    expect(ClassificationGameComposer).toBeDefined();
    expect(typeof ClassificationGameComposer).toBe('function');
  });

  it('2. aiBlueprintToSimpleProject exists and is callable', () => {
    expect(aiBlueprintToSimpleProject).toBeDefined();
    expect(typeof aiBlueprintToSimpleProject).toBe('function');
    const bp = normalizeBlueprint(loadGoldenRef());
    const project = aiBlueprintToSimpleProject(bp);
    expect(project.pages).toHaveLength(12);
  });

  it('3. wireInteractions present in export HTML', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('wireInteractions');
    expect(html).toContain('wireInteractions()');
  });

  it('4. data-tab-id present in export HTML', () => {
    const { project } = (() => {
      const bp = normalizeBlueprint(loadGoldenRef());
      return { project: aiBlueprintToSimpleProject(bp) };
    })();
    const html = exportProjectToHtml(project);
    expect(html).toContain("setAttribute('data-tab-id'");
    expect(html).toContain('[data-tab-id]');
  });

  it('5. data-action="timer-toggle" present in export HTML', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const project = aiBlueprintToSimpleProject(bp);
    const html = exportProjectToHtml(project);
    expect(html).toContain("'data-action', 'timer-toggle'");
    expect(html).toContain('[data-action="timer-toggle"]');
  });

  it('6. data-action="save-response" present in export HTML', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const project = aiBlueprintToSimpleProject(bp);
    const html = exportProjectToHtml(project);
    expect(html).toContain("'data-action', 'save-response'");
    expect(html).toContain('[data-action="save-response"]');
  });

  it('7. data-item-id present in export HTML', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const project = aiBlueprintToSimpleProject(bp);
    const html = exportProjectToHtml(project);
    expect(html).toContain("setAttribute('data-item-id'");
    expect(html).toContain('[data-item-id]');
  });

  it('8. data-category present in export HTML', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const project = aiBlueprintToSimpleProject(bp);
    const html = exportProjectToHtml(project);
    expect(html).toContain("setAttribute('data-category'");
    expect(html).toContain('[data-category]');
  });

  it('9. sceneType renderer routing present in SceneRendererView source', () => {
    const src = readFileSync(resolve(__dirname, '../components/SceneRendererView.tsx'), 'utf-8');
    expect(src).toContain('getSceneComposer');
    expect(src).toContain("'curriculum-guide'");
    expect(src).toContain("'classification-game'");
    expect(src).toContain('ClassificationGameComposer');
  });

  // PATCH A: No Lost Work Guard — source must contain actual behavior, not display-only.
  it('9b. TimerBlock source contains start/pause/reset behavior (not display-only)', () => {
    const src = readFileSync(resolve(__dirname, '../components/scene-blocks/index.tsx'), 'utf-8');
    expect(src).toContain('useState');
    expect(src).toContain('running');
    expect(src).toContain('timer-toggle');
  });

  it('9c. ResponseInputBlock source contains textarea + save state (not display-only)', () => {
    const src = readFileSync(resolve(__dirname, '../components/scene-blocks/index.tsx'), 'utf-8');
    expect(src).toContain('<textarea');
    expect(src).toContain('save-response');
    expect(src).toContain('saved');
  });

  it('9d. RevealBlock source contains toggle state (not display-only)', () => {
    const src = readFileSync(resolve(__dirname, '../components/scene-blocks/index.tsx'), 'utf-8');
    expect(src).toContain('internalRevealed');
    expect(src).toContain('setInternalRevealed');
  });

  it('9e. SceneTabs source contains activeTab state (not display-only)', () => {
    const src = readFileSync(resolve(__dirname, '../components/scene-blocks/index.tsx'), 'utf-8');
    expect(src).toContain('internalTab');
    expect(src).toContain('setInternalTab');
    expect(src).toContain('data-tab-id');
  });

  it('10. sceneType routing present in export-html source', () => {
    const src = readFileSync(resolve(__dirname, '../export/export-html.ts'), 'utf-8');
    expect(src).toContain('sceneTypeRenderers');
    expect(src).toContain('renderCurriculumGuideExport');
    expect(src).toContain('renderClassificationGameExport');
  });

  it('11. golden-reference contract present', () => {
    const c = getDesignContract('golden-reference');
    expect(c).toBeDefined();
    expect(c.palette.background).toBe('#0e1c2f');
    expect(c.palette.surface).toBe('#182d45');
  });

  it('12. 5 rendered scenes still export (createSceneProofProject)', () => {
    const project = createSceneProofProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-scene-cover-hero');
    expect(html).toContain('silse-scene-learning-scene');
    expect(html).toContain('silse-scene-game-mission');
    expect(html).toContain('silse-scene-quiz-challenge');
    expect(html).toContain('silse-scene-closing-award');
  });
});
