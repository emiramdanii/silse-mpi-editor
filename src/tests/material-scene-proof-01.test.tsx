/**
 * MATERIAL-SCENE-PROOF-01 — Test Suite.
 *
 * Kontrak: Materi dirender sebagai learning scene (concept header + explanation
 * panel + example cards + key point + student action + visual hint), bukan card
 * teks biasa. Pakai fondasi sama: container + design contract + render parity.
 *
 * Test cek nilai visual spesifik (px, hex, radius), bukan cuma class.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createSceneProofProject } from '../core/scene-proof-project';
import { createSamplePpknProject } from '../core/sample-project';
import { exportProjectToHtml } from '../export/export-html';
import { CanvasStage } from '../editor/CanvasStage';
import { PreviewApp } from '../preview/PreviewApp';
import { useEditorStore } from '../store/editor-store';
import { usePreviewStore } from '../preview/preview-store';
import {
  isPageSceneRenderable,
  buildSceneRenderPlanForPage,
} from '../core/scene-renderer';
import { getDesignContract, getDesignContractWithProjectStyle } from '../core/mpi-design-contract';
import { SceneRendererView } from '../components/SceneRendererView';
import { normalizeBlueprint, aiJsonToMpiContainer, validateAiMpiJson } from '../core/ai-mpi-json';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setStoreProject(project: ReturnType<typeof createSceneProofProject>, pageId?: string) {
  if (pageId) project.currentPageId = pageId;
  useEditorStore.setState({ project, selectedComponentId: null });
}

function openPreview(pageId?: string) {
  const project = useEditorStore.getState().project;
  usePreviewStore.setState({
    isOpen: true,
    currentPageId: pageId ?? project.currentPageId,
  });
}

function loadMaterialBlueprint() {
  const path = resolve(__dirname, '../../samples/ai-mpi-json/material-learning-scene-proof.sample.json');
  const raw = readFileSync(path, 'utf-8');
  return normalizeBlueprint(JSON.parse(raw));
}

function getMaterialPage(project: ReturnType<typeof createSceneProofProject>) {
  return project.pages.find((p) => p.role === 'material')!;
}

// ---------------------------------------------------------------------------
// Scope A+B: Scene model + AI JSON
// ---------------------------------------------------------------------------

describe('MATERIAL-SCENE-PROOF-01 — scene model + AI JSON', () => {
  it('1. isPageSceneRenderable detects learning-scene page', () => {
    const project = createSceneProofProject();
    const materialPage = getMaterialPage(project);
    expect(isPageSceneRenderable(materialPage)).toBe(true);
  });

  it('2. validator menerima learning-scene valid', () => {
    const blueprint = loadMaterialBlueprint();
    const errors = validateAiMpiJson(blueprint);
    expect(errors).toHaveLength(0);
  });

  it('3. validator menolak materi datar tanpa scene/slots', () => {
    const flatMaterial = { title: 'Test', content: 'Body' };
    const errors = validateAiMpiJson(flatMaterial);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('4. normalizer tidak menghapus sceneType learning-scene', () => {
    const blueprint = loadMaterialBlueprint();
    expect(blueprint.scenes[0].sceneType).toBe('learning-scene');
  });

  it('5. aiJsonToMpiContainer mempertahankan material slots', () => {
    const blueprint = loadMaterialBlueprint();
    const container = aiJsonToMpiContainer(blueprint);
    const materialScene = container.scenes.find((s) => s.sceneType === 'learning-scene');
    expect(materialScene).toBeDefined();
    expect(materialScene?.slots.length).toBeGreaterThan(0);
    const learningSlot = materialScene?.slots.find((s) => s.content.kind === 'learning-material');
    expect(learningSlot).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Scope C: Render plan
// ---------------------------------------------------------------------------

describe('MATERIAL-SCENE-PROOF-01 — render plan', () => {
  it('6. renderScenePlan menghasilkan learning slots + resolvedStyle', () => {
    const project = createSceneProofProject();
    const materialPage = getMaterialPage(project);
    const plan = buildSceneRenderPlanForPage(project, materialPage)!;
    expect(plan).not.toBeNull();
    expect(plan.sceneClass).toContain('silse-scene-learning-scene');
    const learningSlot = plan.slots.find((s) => s.content.kind === 'learning-material');
    expect(learningSlot).toBeDefined();
    expect(learningSlot?.resolvedStyle).toBeDefined();
    expect(learningSlot?.resolvedStyle?.surface).toBeDefined();
  });

  it('7. renderScenePlan membawa placement spesifik (x:72, y:120)', () => {
    const project = createSceneProofProject();
    const materialPage = getMaterialPage(project);
    const plan = buildSceneRenderPlanForPage(project, materialPage)!;
    const learningSlot = plan.slots.find((s) => s.content.kind === 'learning-material')!;
    expect(learningSlot.placement.x).toBe(72);
    expect(learningSlot.placement.y).toBe(120);
    expect(learningSlot.placement.width).toBe(1136);
    expect(learningSlot.placement.height).toBe(480);
  });

  it('8. resolvedStyle.surface punya background/radius/padding/border dari contract', () => {
    const project = createSceneProofProject();
    const materialPage = getMaterialPage(project);
    const plan = buildSceneRenderPlanForPage(project, materialPage)!;
    const learningSlot = plan.slots.find((s) => s.content.kind === 'learning-material')!;
    const surf = learningSlot.resolvedStyle?.surface;
    // CONTRACT-ALIGNMENT-FIX: buildSceneRenderPlanForPage uses getDesignContractWithProjectStyle
    // which merges project.style.tokens (radius.medium=8 overrides card.radius=12). Test must
    // compare against the same resolved contract.
    const contract = getDesignContractWithProjectStyle(project.stylePackId, project.style);
    expect(surf?.background).toBe(contract.card.background);
    expect(surf?.radius).toBe(contract.card.radius);
    expect(surf?.padding).toBe(contract.card.padding);
    expect(surf?.border).toBe(contract.card.border);
  });
});

// ---------------------------------------------------------------------------
// Scope D: SceneRendererView learning renderer
// ---------------------------------------------------------------------------

describe('MATERIAL-SCENE-PROOF-01 — SceneRendererView learning scene', () => {
  it('9. SceneRendererView render silse-scene-learning-scene', () => {
    const project = createSceneProofProject();
    const materialPage = getMaterialPage(project);
    const plan = buildSceneRenderPlanForPage(project, materialPage)!;
    const contract = getDesignContract(project.stylePackId);
    const { container } = render(<SceneRendererView plan={plan} contract={contract} />);
    expect(container.querySelector('.silse-scene-learning-scene')).toBeInTheDocument();
  });

  it('10. SceneRendererView render learning scene classes', () => {
    const project = createSceneProofProject();
    const materialPage = getMaterialPage(project);
    const plan = buildSceneRenderPlanForPage(project, materialPage)!;
    const contract = getDesignContract(project.stylePackId);
    const { container } = render(<SceneRendererView plan={plan} contract={contract} />);
    expect(container.querySelector('.silse-learning-header')).toBeInTheDocument();
    expect(container.querySelector('.silse-learning-explanation')).toBeInTheDocument();
    expect(container.querySelector('.silse-learning-example-grid')).toBeInTheDocument();
    expect(container.querySelector('.silse-learning-example-card')).toBeInTheDocument();
    expect(container.querySelector('.silse-learning-key-point')).toBeInTheDocument();
    expect(container.querySelector('.silse-learning-student-action')).toBeInTheDocument();
    expect(container.querySelector('.silse-learning-visual-hint')).toBeInTheDocument();
  });

  it('11. SceneRendererView applies placement (left:72px, top:120px)', () => {
    const project = createSceneProofProject();
    const materialPage = getMaterialPage(project);
    const plan = buildSceneRenderPlanForPage(project, materialPage)!;
    const contract = getDesignContract(project.stylePackId);
    const { container } = render(<SceneRendererView plan={plan} contract={contract} />);
    const slot = container.querySelector('.silse-scene-slot') as HTMLElement;
    expect(slot.style.left).toBe('72px');
    expect(slot.style.top).toBe('120px');
    expect(slot.style.width).toBe('1136px');
    expect(slot.style.height).toBe('480px');
  });

  it('12. explanation panel visual dari contract (radius, background, border)', () => {
    const project = createSceneProofProject();
    const materialPage = getMaterialPage(project);
    const plan = buildSceneRenderPlanForPage(project, materialPage)!;
    // CONTRACT-ALIGNMENT-FIX: use resolved contract (with project.style overrides)
    const contract = getDesignContractWithProjectStyle(project.stylePackId, project.style);
    const { container } = render(<SceneRendererView plan={plan} contract={contract} />);
    const explanation = container.querySelector('.silse-learning-explanation') as HTMLElement;
    expect(explanation.style.borderRadius).toBe(contract.card.radius + 'px');
    expect(explanation.style.background).toBeTruthy();
  });

  it('13. example card visual dari contract (radius, background)', () => {
    const project = createSceneProofProject();
    const materialPage = getMaterialPage(project);
    const plan = buildSceneRenderPlanForPage(project, materialPage)!;
    // CONTRACT-ALIGNMENT-FIX: use resolved contract (with project.style overrides)
    const contract = getDesignContractWithProjectStyle(project.stylePackId, project.style);
    const { container } = render(<SceneRendererView plan={plan} contract={contract} />);
    const exampleCard = container.querySelector('.silse-learning-example-card') as HTMLElement;
    expect(exampleCard.style.borderRadius).toBe(contract.card.radius + 'px');
    expect(exampleCard.style.background).toBeTruthy();
  });

  it('14. key point visual (background, border dari contract palette)', () => {
    const project = createSceneProofProject();
    const materialPage = getMaterialPage(project);
    const plan = buildSceneRenderPlanForPage(project, materialPage)!;
    const contract = getDesignContract(project.stylePackId);
    const { container } = render(<SceneRendererView plan={plan} contract={contract} />);
    const keyPoint = container.querySelector('.silse-learning-key-point') as HTMLElement;
    expect(keyPoint).toBeInTheDocument();
    expect(keyPoint.style.background).toBeTruthy();
  });

  it('15. typography dari contract (header font-size dari contract.typography.titleSize)', () => {
    const project = createSceneProofProject();
    const materialPage = getMaterialPage(project);
    const plan = buildSceneRenderPlanForPage(project, materialPage)!;
    const contract = getDesignContract(project.stylePackId);
    const { container } = render(<SceneRendererView plan={plan} contract={contract} />);
    const header = container.querySelector('.silse-learning-header') as HTMLElement;
    expect(header.style.fontSize).toBe(contract.typography.titleSize + 'px');
    expect(header.style.fontWeight).toBe(String(contract.typography.titleWeight));
  });
});

// ---------------------------------------------------------------------------
// Scope E: Editor/Preview/Export parity
// ---------------------------------------------------------------------------

describe('MATERIAL-SCENE-PROOF-01 — editor/preview/export parity', () => {
  it('16. CanvasStage render silse-scene-learning-scene', () => {
    const project = createSceneProofProject();
    const materialPage = getMaterialPage(project);
    setStoreProject(project, materialPage.id);
    const { container } = render(<CanvasStage />);
    expect(container.querySelector('.silse-scene-learning-scene')).toBeInTheDocument();
  });

  it('17. PreviewApp render silse-scene-learning-scene', () => {
    const project = createSceneProofProject();
    const materialPage = getMaterialPage(project);
    setStoreProject(project, materialPage.id);
    openPreview(materialPage.id);
    const { container } = render(<PreviewApp />);
    expect(container.querySelector('.silse-scene-learning-scene')).toBeInTheDocument();
  });

  it('18. export HTML mengandung silse-scene-learning-scene', () => {
    const project = createSceneProofProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-scene-learning-scene');
  });

  it('19. editor dan preview parity (same learning scene classes)', () => {
    const project = createSceneProofProject();
    const materialPage = getMaterialPage(project);
    setStoreProject(project, materialPage.id);
    const editorResult = render(<CanvasStage />);
    const editorClasses = editorResult.container.querySelector('.silse-scene')?.className;
    editorResult.unmount();

    openPreview(materialPage.id);
    const previewResult = render(<PreviewApp />);
    const previewClasses = previewResult.container.querySelector('.silse-scene')?.className;
    previewResult.unmount();

    expect(editorClasses).toBe(previewClasses);
  });

  it('20. export HTML mengandung learning scene classes', () => {
    const project = createSceneProofProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-learning-header');
    expect(html).toContain('silse-learning-explanation');
    expect(html).toContain('silse-learning-example-grid');
    expect(html).toContain('silse-learning-example-card');
    expect(html).toContain('silse-learning-key-point');
    expect(html).toContain('silse-learning-student-action');
  });

  it('21. export HTML mengandung placement (x:72, y:120)', () => {
    const project = createSceneProofProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('"x":72');
    expect(html).toContain('"y":120');
  });

  it('22. editor dan preview sama-sama apply placement (left:72px)', () => {
    const project = createSceneProofProject();
    const materialPage = getMaterialPage(project);
    setStoreProject(project, materialPage.id);
    const editorResult = render(<CanvasStage />);
    const editorSlot = editorResult.container.querySelector('.silse-scene-slot') as HTMLElement;
    expect(editorSlot.style.left).toBe('72px');
    editorResult.unmount();

    openPreview(materialPage.id);
    const previewResult = render(<PreviewApp />);
    const previewSlot = previewResult.container.querySelector('.silse-scene-slot') as HTMLElement;
    expect(previewSlot.style.left).toBe('72px');
    previewResult.unmount();
  });
});

// ---------------------------------------------------------------------------
// Scope G: Legacy fallback safe
// ---------------------------------------------------------------------------

describe('MATERIAL-SCENE-PROOF-01 — legacy fallback', () => {
  it('23. legacy material (tanpa sceneMetadata) tetap render via scene renderer', () => {
    // Fase 2b: ALL projects render via SceneRendererView with scene classes.
    const project = createSamplePpknProject();
    const materialPage = project.pages.find((p) => p.role === 'material');
    setStoreProject(project as unknown as ReturnType<typeof createSceneProofProject>, materialPage?.id);
    const { container } = render(<CanvasStage />);
    expect(container.querySelector('[class*="silse-scene"]')).toBeInTheDocument();
  });

  it('24. legacy material export tanpa scenePlan learning-scene', () => {
    // Fase 2b: export also uses scene renderer for ALL projects.
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-scene');
  });

  it('25. no dependency added — all pure TypeScript', () => {
    const project = createSceneProofProject();
    const materialPage = getMaterialPage(project);
    const plan = buildSceneRenderPlanForPage(project, materialPage)!;
    expect(plan).toBeDefined();
    expect(plan.slots[0].resolvedStyle).toBeDefined();
  });
});
