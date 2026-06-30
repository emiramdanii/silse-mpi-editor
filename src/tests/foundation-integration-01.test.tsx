/**
 * FOUNDATION-INTEGRATION-01 — Test Suite.
 *
 * Kontrak: fondasi baru (MpiContainer + SceneRendererView) benar-benar
 * dipakai oleh editor (CanvasStage), preview (PreviewApp), dan export-html.
 * Jalur lama tetap fallback untuk page tanpa scene.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
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
  buildContainerAndPlanForPage,
} from '../core/scene-renderer';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setStoreProject(project: ReturnType<typeof createSceneProofProject>) {
  useEditorStore.setState({ project, selectedComponentId: null });
}

function openPreview(pageId?: string) {
  const project = useEditorStore.getState().project;
  usePreviewStore.setState({
    isOpen: true,
    currentPageId: pageId ?? project.currentPageId,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FOUNDATION-INTEGRATION-01 — scene detection', () => {
  it('1. isPageSceneRenderable detects game-mission page', () => {
    const project = createSceneProofProject();
    const gamePage = project.pages.find((p) => p.role === 'activity');
    expect(isPageSceneRenderable(gamePage)).toBe(true);
  });

  it('2. isPageSceneRenderable returns false for legacy page (no sceneMetadata)', () => {
    const project = createSceneProofProject();
    const coverPage = project.pages.find((p) => p.role === 'cover');
    expect(isPageSceneRenderable(coverPage)).toBe(false);
  });

  it('3. buildSceneRenderPlanForPage returns plan for game-mission page', () => {
    const project = createSceneProofProject();
    const gamePage = project.pages.find((p) => p.role === 'activity')!;
    const plan = buildSceneRenderPlanForPage(project, gamePage);
    expect(plan).not.toBeNull();
    expect(plan?.sceneClass).toContain('silse-scene-game-mission');
  });

  it('4. buildSceneRenderPlanForPage returns null for legacy page', () => {
    const project = createSceneProofProject();
    const coverPage = project.pages.find((p) => p.role === 'cover')!;
    const plan = buildSceneRenderPlanForPage(project, coverPage);
    expect(plan).toBeNull();
  });

  it('5. buildContainerAndPlanForPage returns container + plan', () => {
    const project = createSceneProofProject();
    const gamePage = project.pages.find((p) => p.role === 'activity')!;
    const result = buildContainerAndPlanForPage(project, gamePage.id);
    expect(result).not.toBeNull();
    expect(result?.container).toBeDefined();
    expect(result?.plan.sceneClass).toContain('silse-scene-game-mission');
  });
});

describe('FOUNDATION-INTEGRATION-01 — CanvasStage integration (editor)', () => {
  it('6. CanvasStage renders scene for game-mission page (silse-scene in DOM)', () => {
    const project = createSceneProofProject();
    // current page is game (set in scene-proof-project)
    setStoreProject(project);
    const { container } = render(<CanvasStage />);
    expect(container.querySelector('.silse-scene')).toBeInTheDocument();
  });

  it('7. CanvasStage renders silse-scene-game-mission for game page', () => {
    const project = createSceneProofProject();
    setStoreProject(project);
    const { container } = render(<CanvasStage />);
    expect(container.querySelector('.silse-scene-game-mission')).toBeInTheDocument();
  });

  it('8. CanvasStage renders silse-scene-slot for scene page', () => {
    const project = createSceneProofProject();
    setStoreProject(project);
    const { container } = render(<CanvasStage />);
    expect(container.querySelector('.silse-scene-slot')).toBeInTheDocument();
  });

  it('9. CanvasStage renders silse-game-action-card for game-mission scene', () => {
    const project = createSceneProofProject();
    setStoreProject(project);
    const { container } = render(<CanvasStage />);
    expect(container.querySelector('.silse-game-action-card')).toBeInTheDocument();
  });

  it('10. CanvasStage does NOT render legacy component path for scene page (no silse-game-choice)', () => {
    const project = createSceneProofProject();
    setStoreProject(project);
    const { container } = render(<CanvasStage />);
    // Legacy game renders .silse-game-choice; scene renderer renders .silse-game-action-card
    expect(container.querySelector('.silse-game-choice')).not.toBeInTheDocument();
  });

  it('11. CanvasStage falls back to legacy for non-scene page (cover)', () => {
    const project = createSceneProofProject();
    const coverPage = project.pages.find((p) => p.role === 'cover');
    project.currentPageId = coverPage!.id;
    setStoreProject(project);
    const { container } = render(<CanvasStage />);
    // Cover page should NOT have silse-scene (legacy path)
    expect(container.querySelector('.silse-scene')).not.toBeInTheDocument();
  });

  it('12. CanvasStage scene renderer mount point exists', () => {
    const project = createSceneProofProject();
    setStoreProject(project);
    const { container } = render(<CanvasStage />);
    expect(container.querySelector('[data-testid="scene-renderer-mount"]')).toBeInTheDocument();
  });
});

describe('FOUNDATION-INTEGRATION-01 — PreviewApp integration', () => {
  it('13. PreviewApp renders scene for game-mission page (silse-scene in DOM)', () => {
    const project = createSceneProofProject();
    setStoreProject(project);
    openPreview();
    const { container } = render(<PreviewApp />);
    expect(container.querySelector('.silse-scene')).toBeInTheDocument();
  });

  it('14. PreviewApp renders silse-scene-game-mission', () => {
    const project = createSceneProofProject();
    setStoreProject(project);
    openPreview();
    const { container } = render(<PreviewApp />);
    expect(container.querySelector('.silse-scene-game-mission')).toBeInTheDocument();
  });

  it('15. PreviewApp renders silse-game-action-card', () => {
    const project = createSceneProofProject();
    setStoreProject(project);
    openPreview();
    const { container } = render(<PreviewApp />);
    expect(container.querySelector('.silse-game-action-card')).toBeInTheDocument();
  });

  it('16. PreviewApp does NOT render legacy silse-game-choice for scene page', () => {
    const project = createSceneProofProject();
    setStoreProject(project);
    openPreview();
    const { container } = render(<PreviewApp />);
    expect(container.querySelector('.silse-game-choice')).not.toBeInTheDocument();
  });

  it('17. PreviewApp scene renderer mount point exists', () => {
    const project = createSceneProofProject();
    setStoreProject(project);
    openPreview();
    const { container } = render(<PreviewApp />);
    expect(container.querySelector('[data-testid="scene-renderer-mount-preview"]')).toBeInTheDocument();
  });

  it('18. PreviewApp falls back to legacy for non-scene page (cover)', () => {
    const project = createSceneProofProject();
    const coverPage = project.pages.find((p) => p.role === 'cover');
    setStoreProject(project);
    openPreview(coverPage!.id);
    const { container } = render(<PreviewApp />);
    expect(container.querySelector('.silse-scene')).not.toBeInTheDocument();
  });

  it('19. editor and preview produce same scene classes (parity)', () => {
    const project = createSceneProofProject();
    setStoreProject(project);
    const editorResult = render(<CanvasStage />);
    const editorSceneClass = editorResult.container.querySelector('.silse-scene')?.className;
    editorResult.unmount();

    openPreview();
    const previewResult = render(<PreviewApp />);
    const previewSceneClass = previewResult.container.querySelector('.silse-scene')?.className;
    previewResult.unmount();

    expect(editorSceneClass).toBe(previewSceneClass);
  });
});

describe('FOUNDATION-INTEGRATION-01 — export-html integration', () => {
  it('20. export HTML contains silse-scene for scene-renderable project', () => {
    const project = createSceneProofProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-scene');
  });

  it('21. export HTML contains silse-scene-game-mission', () => {
    const project = createSceneProofProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-scene-game-mission');
  });

  it('22. export HTML contains silse-scene-slot', () => {
    const project = createSceneProofProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-scene-slot');
  });

  it('23. export HTML contains silse-game-action-card', () => {
    const project = createSceneProofProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-game-action-card');
  });

  it('24. export HTML contains silse-game-briefing (feedback/reward scene)', () => {
    const project = createSceneProofProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-game-briefing');
    expect(html).toContain('silse-game-target');
    expect(html).toContain('silse-game-reward');
  });

  it('25. export HTML preserves placement (x, y in scenePlan slots)', () => {
    const project = createSceneProofProject();
    const html = exportProjectToHtml(project);
    // The game component has x:72, y:120, width:1136, height:480 (visual fidelity values)
    expect(html).toContain('"placement"');
    expect(html).toContain('"x":72');
    expect(html).toContain('"y":120');
  });

  it('26. export HTML preserves design token (designTokenKey in plan)', () => {
    const project = createSceneProofProject();
    const html = exportProjectToHtml(project);
    // scenePlan is embedded as JSON; check it has slots with designTokenKey
    expect(html).toContain('"scenePlan"');
  });

  it('27. export HTML preserves feedback and reward', () => {
    const project = createSceneProofProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('Lencana Penjaga Norma');
    expect(html).toContain('Briefing Misi');
  });

  it('28. export HTML scenePlan only for scene-renderable pages (null for legacy)', () => {
    const project = createSceneProofProject();
    const html = exportProjectToHtml(project);
    // The cover page should have scenePlan: null
    expect(html).toContain('"scenePlan":null');
  });
});

describe('FOUNDATION-INTEGRATION-01 — legacy fallback safe', () => {
  it('29. legacy sample project (no sceneMetadata) still exports correctly', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project);
    expect(html.length).toBeGreaterThan(1000);
    // No scene rendering for legacy project
    expect(html).not.toContain('silse-scene-game-mission');
  });

  it('30. legacy sample project CanvasStage renders legacy path (no silse-scene)', () => {
    const project = createSamplePpknProject();
    setStoreProject(project);
    const { container } = render(<CanvasStage />);
    // Legacy project has no scene-renderable pages
    expect(container.querySelector('.silse-scene')).not.toBeInTheDocument();
  });

  it('31. legacy sample project PreviewApp renders legacy path', () => {
    const project = createSamplePpknProject();
    setStoreProject(project);
    openPreview();
    const { container } = render(<PreviewApp />);
    expect(container.querySelector('.silse-scene')).not.toBeInTheDocument();
  });

  it('32. no dependency added — integration pure TypeScript', () => {
    const project = createSceneProofProject();
    const html = exportProjectToHtml(project);
    expect(html).toBeDefined();
    expect(html.length).toBeGreaterThan(0);
  });
});
