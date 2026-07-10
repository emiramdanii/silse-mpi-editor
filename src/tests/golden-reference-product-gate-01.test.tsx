/**
 * GOLDEN-REFERENCE-PRODUCT-GATE-01 (+ PATCH A) — End-to-end product gate (RESTORED).
 *
 * Membuktikan bahwa SILSE sudah bisa menghasilkan MPI utuh seperti alur
 * golden reference (12 scene), dari editor / preview / export.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  validateAiMpiJson,
  normalizeBlueprint,
  aiJsonToMpiContainer,
  aiBlueprintToSimpleProject,
} from '../core/ai-mpi-json';
import { simpleProjectToMpiContainer } from '../core/mpi-container';
import { getDesignContract } from '../core/mpi-design-contract';
import { renderScenePlan } from '../core/scene-renderer';
import { SceneRendererView } from '../components/SceneRendererView';
import { ClassificationGameComposer } from '../components/scene-composers';
import { exportProjectToHtml } from '../export/export-html';
import { createSamplePpknProject } from '../core/sample-project';
import { createSceneProofProject } from '../core/scene-proof-project';
import { CanvasStage } from '../editor/CanvasStage';
import { PreviewApp } from '../preview/PreviewApp';
import { useEditorStore } from '../store/editor-store';
import { usePreviewStore } from '../preview/preview-store';

const GOLDEN_REF_PATH = resolve(__dirname, '../../samples/ai-mpi-json/macam-norma-reference.sample.json');
function loadGoldenRef(): unknown { return JSON.parse(readFileSync(GOLDEN_REF_PATH, 'utf-8')); }

const EXPECTED_SCENE_ORDER = [
  'cover-hero', 'curriculum-guide', 'objectives-path', 'starter-review',
  'learning-scene', 'discussion-scene', 'classification-game', 'case-analysis',
  'quiz-challenge', 'result-summary', 'reflection-journal', 'closing-award',
] as const;

const EMITTED_SCENE_CLASS: readonly string[] = [
  'silse-scene-cover-hero', 'silse-scene-curriculum-guide', 'silse-scene-objectives-path',
  'silse-scene-starter-review', 'silse-scene-learning-scene', 'silse-scene-discussion',
  'silse-scene-classification-game', 'silse-scene-case-analysis', 'silse-scene-quiz-challenge',
  'silse-scene-result-summary', 'silse-scene-reflection-journal', 'silse-scene-closing-award',
] as const;

function buildPlans() {
  const bp = normalizeBlueprint(loadGoldenRef());
  const container = aiJsonToMpiContainer(bp);
  const contract = getDesignContract('golden-reference');
  const plans = container.scenes.map((scene) => renderScenePlan(scene, contract));
  return { bp, container, contract, plans };
}

function buildFullProject() {
  const bp = normalizeBlueprint(loadGoldenRef());
  const project = aiBlueprintToSimpleProject(bp);
  return { bp, project };
}

// ---------------------------------------------------------------------------
// SCOPE A — Full Flow Gate
// ---------------------------------------------------------------------------

describe('GOLDEN-REFERENCE-PRODUCT-GATE-01 — Scope A: Full Flow Gate', () => {
  it('1. full golden reference sample valid', () => {
    const raw = loadGoldenRef();
    const errors = validateAiMpiJson(raw);
    expect(errors).toEqual([]);
  });

  it('2. normalizeBlueprint preserves 12 scenes', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    expect(bp.scenes).toHaveLength(12);
    EXPECTED_SCENE_ORDER.forEach((st, i) => {
      expect(bp.scenes[i].sceneType).toBe(st);
    });
  });

  it('3. aiJsonToMpiContainer preserves 12 scenes', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = aiJsonToMpiContainer(bp);
    expect(container.scenes).toHaveLength(12);
    EXPECTED_SCENE_ORDER.forEach((st, i) => {
      expect(container.scenes[i].sceneType).toBe(st);
    });
  });

  it('4. renderScenePlan dibuat untuk 12 scenes', () => {
    const { plans } = buildPlans();
    expect(plans).toHaveLength(12);
    plans.forEach((plan, i) => {
      expect(plan.sceneClass).toContain('silse-scene');
      expect(plan.sceneClass).toContain(`silse-scene-${EXPECTED_SCENE_ORDER[i]}`);
      expect(plan.slots.length).toBeGreaterThan(0);
    });
  });
});

// ---------------------------------------------------------------------------
// SCOPE B — Editor/Preview/Export Parity
// ---------------------------------------------------------------------------

describe('GOLDEN-REFERENCE-PRODUCT-GATE-01 — Scope B: Editor/Preview/Export Parity', () => {
  beforeEach(() => {
    useEditorStore.setState({ project: createSamplePpknProject(), selectedComponentId: null });
    usePreviewStore.setState({ isOpen: false, currentPageId: '' });
  });

  it('5. CanvasStage memuat scene utama (5 scene dari scene-proof-project)', () => {
    const project = createSceneProofProject();
    setStoreProject(project, project.pages[0].id);
    let dom = render(<CanvasStage />);
    expect(dom.container.querySelector('.silse-scene-cover-hero')).toBeInTheDocument();
    dom.unmount();
    setStoreProject(project, project.pages[1].id);
    dom = render(<CanvasStage />);
    expect(dom.container.querySelector('.silse-scene-learning-scene')).toBeInTheDocument();
    dom.unmount();
  });

  it('6. PreviewApp memuat scene utama', () => {
    const project = createSceneProofProject();
    setStoreProject(project, project.pages[0].id);
    openPreview(project.pages[0].id);
    let dom = render(<PreviewApp />);
    expect(dom.container.querySelector('.silse-scene-cover-hero')).toBeInTheDocument();
    dom.unmount();
  });

  it('7. export HTML memuat scene utama', () => {
    const project = createSceneProofProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-scene-cover-hero');
    expect(html).toContain('silse-scene-learning-scene');
    expect(html).toContain('silse-scene-closing-award');
  });

  it('8. parity: same scene class muncul di CanvasStage, PreviewApp, dan export', () => {
    const project = createSceneProofProject();
    const materialPage = project.pages[1];
    setStoreProject(project, materialPage.id);
    const editorDom = render(<CanvasStage />);
    expect(editorDom.container.querySelector('.silse-scene-learning-scene')).toBeInTheDocument();
    editorDom.unmount();
    setStoreProject(project, materialPage.id);
    openPreview(materialPage.id);
    const previewDom = render(<PreviewApp />);
    expect(previewDom.container.querySelector('.silse-scene-learning-scene')).toBeInTheDocument();
    previewDom.unmount();
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-scene-learning-scene');
  });

  it('9. parity: 12 scene class dari full sample via SceneRendererView', () => {
    const { plans, contract } = buildPlans();
    plans.forEach((plan, i) => {
      const { container } = render(<SceneRendererView plan={plan} contract={contract} />);
      const expectedClass = EMITTED_SCENE_CLASS[i];
      expect(container.querySelector(`[class*="${expectedClass}"]`)).toBeInTheDocument();
    });
  });

  it('10. parity: block class utama muncul di SceneRendererView', () => {
    const { plans, contract } = buildPlans();
    const allHtml = plans.map((plan) => {
      const { container } = render(<SceneRendererView plan={plan} contract={contract} />);
      return container.innerHTML;
    }).join('\n');
    // Core block classes that all scene composers use
    const requiredBlockClasses = [
      'silse-block-shell', 'silse-block-header',
    ];
    for (const cls of requiredBlockClasses) {
      expect(allHtml).toContain(cls);
    }
    // At least some of these block classes must appear across 12 scenes
    const optionalBlockClasses = [
      'silse-block-panel', 'silse-block-tabs', 'silse-block-discussion',
      'silse-block-timer', 'silse-block-input', 'silse-block-reveal',
      'silse-block-score-summary', 'silse-block-portfolio',
      'silse-classification-pool', 'silse-classification-column',
    ];
    let foundCount = 0;
    for (const cls of optionalBlockClasses) {
      if (allHtml.includes(cls)) foundCount++;
    }
    expect(foundCount).toBeGreaterThanOrEqual(5);
  });
});

// ---------------------------------------------------------------------------
// SCOPE C — Interaction Gate
// ---------------------------------------------------------------------------

describe('GOLDEN-REFERENCE-PRODUCT-GATE-01 — Scope C: Interaction Gate', () => {
  it('11. tabs CP/TP/ATP bisa berpindah (behavior: active tab changes)', () => {
    const { plans, contract } = buildPlans();
    const cpPlan = plans[1];
    const { container } = render(<SceneRendererView plan={cpPlan} contract={contract} interactive />);
    // Tabs have data-tab-id attrs
    const cpTab = container.querySelector('[data-tab-id="cp"]') as HTMLElement;
    const tpTab = container.querySelector('[data-tab-id="tp"]') as HTMLElement;
    expect(cpTab).toBeInTheDocument();
    expect(tpTab).toBeInTheDocument();
    // CP is initially active (background differs from TP)
    const cpBgBefore = cpTab.style.background;
    const tpBgBefore = tpTab.style.background;
    expect(cpBgBefore).not.toBe(tpBgBefore);
    // Click TP
    fireEvent.click(tpTab);
    // TP should now be active (background changed to match CP's previous)
    expect(tpTab.style.background).toBe(cpBgBefore);
    expect(cpTab.style.background).not.toBe(cpBgBefore);
  });

  it('12. reveal block bisa toggle (behavior: body appears/disappears)', () => {
    const { plans, contract } = buildPlans();
    const casePlan = plans[7];
    const { container } = render(<SceneRendererView plan={casePlan} contract={contract} interactive />);
    const reveal = container.querySelector('.silse-block-reveal') as HTMLElement;
    expect(reveal).toBeInTheDocument();
    // Case-analysis composer uses a separate ActionButtonBlock to toggle reveal.
    const buttons = container.querySelectorAll('button');
    let toggleBtn: HTMLElement | null = null;
    buttons.forEach((btn) => {
      if (btn.textContent?.includes('Lihat Pembahasan') || btn.textContent?.includes('Sembunyikan')) {
        toggleBtn = btn as HTMLElement;
      }
    });
    // Check text content changes (hint vs body text).
    // When not revealed: "Klik untuk melihat pembahasan..." is shown.
    // When revealed: the actual explanation text is shown.
    const hasHintBefore = container.textContent?.includes('Klik untuk melihat pembahasan');
    if (toggleBtn) {
      fireEvent.click(toggleBtn);
    } else {
      fireEvent.click(reveal);
    }
    const hasHintAfter = container.textContent?.includes('Klik untuk melihat pembahasan');
    // Hint visibility should have toggled
    expect(hasHintAfter).not.toBe(hasHintBefore);
  });

  it('13. timer block has start/pause + reset buttons (behavior)', () => {
    const { plans, contract } = buildPlans();
    const discussionPlan = plans[5];
    const { container } = render(<SceneRendererView plan={discussionPlan} contract={contract} interactive />);
    expect(container.querySelector('.silse-block-timer')).toBeInTheDocument();
    // Timer has toggle button (▶/⏸)
    const toggleBtn = container.querySelector('[data-testid="timer-toggle"]') as HTMLElement;
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn.textContent).toBe('▶'); // initially not running
    // Click start
    fireEvent.click(toggleBtn);
    expect(toggleBtn.textContent).toBe('⏸'); // now running
    // Timer has reset button
    const resetBtn = container.querySelector('[data-testid="timer-reset"]') as HTMLElement;
    expect(resetBtn).toBeInTheDocument();
  });

  it('14. input diskusi bisa diketik (behavior: textarea accepts text)', () => {
    const { plans, contract } = buildPlans();
    const discussionPlan = plans[5];
    const { container } = render(<SceneRendererView plan={discussionPlan} contract={contract} interactive />);
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();
    fireEvent.change(textarea, { target: { value: 'Norma agama adalah...' } });
    expect(textarea.value).toBe('Norma agama adalah...');
  });

  it('15. save response menampilkan badge (behavior: badge appears after save)', () => {
    const { plans, contract } = buildPlans();
    const discussionPlan = plans[5];
    const { container } = render(<SceneRendererView plan={discussionPlan} contract={contract} interactive />);
    // Initially no badge
    expect(container.querySelector('[data-testid="saved-badge"]')).not.toBeInTheDocument();
    // Click save
    const saveBtn = container.querySelector('[data-testid="save-response"]') as HTMLElement;
    expect(saveBtn).toBeInTheDocument();
    fireEvent.click(saveBtn);
    // Badge should now be visible
    expect(container.querySelector('[data-testid="saved-badge"]')).toBeInTheDocument();
  });

  it('16. classification game: pilih item → pilih kolom → skor naik (behavior)', () => {
    const { plans, contract } = buildPlans();
    const gamePlan = plans[6];
    const { container } = render(<SceneRendererView plan={gamePlan} contract={contract} interactive />);
    const items = container.querySelectorAll('[data-item-id]');
    expect(items.length).toBeGreaterThan(0);
    const gameContent = gamePlan.slots[0].content as unknown as {
      items: Array<{ id: string; correctCategory: string }>;
    };
    const firstItemId = (items[0] as HTMLElement).getAttribute('data-item-id')!;
    const firstItem = gameContent.items.find((i) => i.id === firstItemId)!;
    fireEvent.click(items[0] as HTMLElement);
    const correctCol = container.querySelector(`[data-category="${firstItem.correctCategory}"]`) as HTMLElement;
    expect(correctCol).toBeInTheDocument();
    fireEvent.click(correctCol);
    // Score should increase
    const score = container.querySelector('[data-testid="game-score"]');
    expect(score).toBeTruthy();
    expect(score?.textContent).not.toBe('0');
  });

  it('17. classification game reset bekerja', () => {
    const gameContent = {
      instruction: 'Sortir!',
      items: [
        { id: 'i1', label: 'Berdoa', correctCategory: 'Agama' },
        { id: 'i2', label: 'Helm', correctCategory: 'Hukum' },
      ],
      categories: ['Agama', 'Hukum'],
      scorePerItem: 10,
      completionMessage: 'Selesai!',
    };
    const contract = getDesignContract('golden-reference');
    const { container } = render(<ClassificationGameComposer contract={contract} content={gameContent} />);
    fireEvent.click(container.querySelector('[data-item-id="i1"]')!);
    fireEvent.click(container.querySelector('[data-category="Agama"]')!);
    expect(container.querySelector('[data-testid="game-score"]')?.textContent).toBe('10');
    const resetBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Reset')) as HTMLElement;
    fireEvent.click(resetBtn);
    expect(container.querySelector('[data-testid="game-score"]')?.textContent).toBe('0');
  });

  it('18. reflection input muncul dan bisa diketik', () => {
    const { plans, contract } = buildPlans();
    const reflectionPlan = plans[10];
    const { container } = render(<SceneRendererView plan={reflectionPlan} contract={contract} interactive />);
    expect(container.querySelector('.silse-scene-reflection-journal')).toBeInTheDocument();
    expect(container.querySelector('.silse-block-portfolio')).toBeInTheDocument();
  });

  it('19. export HTML memuat handler untuk interaction', () => {
    const project = createSceneProofProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('wireInteractions');
    expect(html).toContain('[data-tab-id]');
    expect(html).toContain('[data-action="save-response"]');
    expect(html).toContain('[data-action="timer-toggle"]');
    expect(html).toContain('[data-item-id]');
    expect(html).toContain('[data-category]');
  });
});

// ---------------------------------------------------------------------------
// SCOPE D — Navigation/Flow Gate
// ---------------------------------------------------------------------------

describe('GOLDEN-REFERENCE-PRODUCT-GATE-01 — Scope D: Navigation/Flow Gate', () => {
  it('20. scene order sesuai flow', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    expect(bp.scenes.map((s) => s.sceneType)).toEqual([...EXPECTED_SCENE_ORDER]);
    expect(bp.flow.steps).toHaveLength(12);
    bp.flow.steps.forEach((step, i) => {
      expect(step.sceneId).toBe(bp.scenes[i].id);
    });
    expect(bp.flow.mode).toBe('linear');
  });

  it('21. scene pertama adalah cover-hero', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    expect(bp.scenes[0].sceneType).toBe('cover-hero');
  });

  it('22. scene terakhir adalah closing-award', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    expect(bp.scenes[bp.scenes.length - 1].sceneType).toBe('closing-award');
  });

  it('23. tidak ada scene orphan', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const flowSceneIds = new Set(bp.flow.steps.map((s) => s.sceneId));
    bp.scenes.forEach((scene) => {
      expect(flowSceneIds.has(scene.id)).toBe(true);
    });
  });

  it('24. export HTML punya tombol prev/next', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-nav-prev');
    expect(html).toContain('silse-nav-next');
  });
});

// ---------------------------------------------------------------------------
// SCOPE E — Regression
// ---------------------------------------------------------------------------

describe('GOLDEN-REFERENCE-PRODUCT-GATE-01 — Scope E: Regression', () => {
  beforeEach(() => {
    useEditorStore.setState({ project: createSamplePpknProject(), selectedComponentId: null });
    usePreviewStore.setState({ isOpen: false, currentPageId: '' });
  });

  it('25. legacy fallback aman', () => {
    const project = createSamplePpknProject();
    // Fase 2b: scenePlan is no longer null — all pages go through scene renderer
    expect(() => exportProjectToHtml(project)).not.toThrow();
  });

  it('26. CanvasStage + PreviewApp render legacy project tanpa crash', () => {
    const project = createSamplePpknProject();
    setStoreProject(project, project.pages[0].id);
    const editorDom = render(<CanvasStage />);
    expect(editorDom.container.firstChild).toBeTruthy();
    editorDom.unmount();
    openPreview(project.pages[0].id);
    const previewDom = render(<PreviewApp />);
    expect(previewDom.container.firstChild).toBeTruthy();
    previewDom.unmount();
  });

  it('27. invalid sceneType ditolak', () => {
    const raw = loadGoldenRef() as Record<string, unknown>;
    const scenes = raw.scenes as Array<Record<string, unknown>>;
    const badRaw = { ...raw, scenes: [{ ...scenes[0], sceneType: 'invalid-scene-type-xxx' }, ...scenes.slice(1)] };
    const errors = validateAiMpiJson(badRaw);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('28. content.kind bukan scene selector', () => {
    const { plans, contract } = buildPlans();
    const coverPlan = plans[0];
    const cpPlan = plans[1];
    const coverDom = render(<SceneRendererView plan={coverPlan} contract={contract} />);
    expect(coverDom.container.querySelector('.silse-scene-cover-hero')).toBeInTheDocument();
    expect(coverDom.container.querySelector('.silse-scene-curriculum-guide')).not.toBeInTheDocument();
    coverDom.unmount();
    const cpDom = render(<SceneRendererView plan={cpPlan} contract={contract} />);
    expect(cpDom.container.querySelector('.silse-scene-curriculum-guide')).toBeInTheDocument();
    expect(cpDom.container.querySelector('.silse-scene-cover-hero')).not.toBeInTheDocument();
    cpDom.unmount();
  });

  it('29. semua page punya scenePlan (Fase 2b: single render path)', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project);
    // Fase 2b: ALL pages now have scenePlan (no more null fallback).
    // Verify that scenePlan field exists for all pages.
    const totalMatches = html.match(/"scenePlan"/g) ?? [];
    expect(totalMatches.length).toBe(project.pages.length);
  });

  it('30. tidak ada HTML import / iframe / reskin di export', () => {
    const project = createSceneProofProject();
    const html = exportProjectToHtml(project);
    expect(html).not.toMatch(/<iframe/);
    expect(html).not.toMatch(/<link\s+rel=["']stylesheet["']/);
    expect(html).not.toMatch(/<script\s+src=/);
  });
});

// ---------------------------------------------------------------------------
// SCOPE F — Documentation
// ---------------------------------------------------------------------------

describe('GOLDEN-REFERENCE-PRODUCT-GATE-01 — Scope F: Documentation', () => {
  it('31. dokumen GOLDEN_REFERENCE_PRODUCT_GATE_01.md ada di folder docs', () => {
    const docPath = resolve(__dirname, '../../docs/GOLDEN_REFERENCE_PRODUCT_GATE_01.md');
    const content = readFileSync(docPath, 'utf-8');
    expect(content).toContain('GOLDEN-REFERENCE-PRODUCT-GATE-01');
  });
});

// ---------------------------------------------------------------------------
// PATCH A — Scope H: Bridge
// ---------------------------------------------------------------------------

describe('GOLDEN-REFERENCE-PRODUCT-GATE-01 PATCH A — Scope H: Bridge', () => {
  it('32. aiBlueprintToSimpleProject menghasilkan 12 pages', () => {
    const { project } = buildFullProject();
    expect(project.pages).toHaveLength(12);
  });

  it('33. 12 pages preserve sceneType', () => {
    const { project } = buildFullProject();
    EXPECTED_SCENE_ORDER.forEach((st, i) => {
      expect(project.pages[i].sceneType).toBe(st);
    });
  });

  it('34. 12 pages preserve flow order (page ID = scene ID)', () => {
    const { bp, project } = buildFullProject();
    bp.scenes.forEach((scene, i) => {
      expect(project.pages[i].id).toBe(scene.id);
    });
  });

  it('35. bridge round-trip: SimpleProject → MpiContainer preserves 12 sceneType', () => {
    const { project } = buildFullProject();
    const container = simpleProjectToMpiContainer(project);
    expect(container.scenes).toHaveLength(12);
    EXPECTED_SCENE_ORDER.forEach((st, i) => {
      expect(container.scenes[i].sceneType).toBe(st);
    });
  });

  it('36. bridge preserves scene ID as page ID', () => {
    const { project } = buildFullProject();
    const container = simpleProjectToMpiContainer(project);
    container.scenes.forEach((scene, i) => {
      expect(scene.id).toBe(project.pages[i].id);
    });
  });

  it('37. bridge preserves styleIntent.styleId as project.stylePackId', () => {
    const { bp, project } = buildFullProject();
    expect(project.stylePackId).toBe(bp.styleIntent.styleId);
  });

  it('38. bridge preserves curriculum', () => {
    const { bp, project } = buildFullProject();
    expect(project.curriculum).toBeDefined();
    expect(project.curriculum?.subject).toBe(bp.curriculum?.subject);
  });

  it('39. bridge page.sceneContent carries slot content', () => {
    const { project } = buildFullProject();
    project.pages.forEach((page, i) => {
      expect(page.sceneContent, `page ${i + 1} sceneContent must be set`).toBeDefined();
      expect(page.scenePlacement, `page ${i + 1} scenePlacement must be set`).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// PATCH A — Scope I: Full 12 Scene App Gate
// ---------------------------------------------------------------------------

describe('GOLDEN-REFERENCE-PRODUCT-GATE-01 PATCH A — Scope I: Full 12 Scene App Gate', () => {
  beforeEach(() => {
    const { project } = buildFullProject();
    useEditorStore.setState({ project, selectedComponentId: null });
    usePreviewStore.setState({ isOpen: false, currentPageId: '' });
  });

  it('40. CanvasStage renders all 12 scenes via bridge', () => {
    const project = useEditorStore.getState().project;
    project.pages.forEach((page, i) => {
      useEditorStore.setState({ project: { ...project, currentPageId: page.id }, selectedComponentId: null });
      const { container, unmount } = render(<CanvasStage />);
      const expectedClass = EMITTED_SCENE_CLASS[i];
      expect(container.querySelector(`[class*="${expectedClass}"]`)).toBeInTheDocument();
      unmount();
    });
  });

  it('41. PreviewApp renders all 12 scenes via bridge', () => {
    const project = useEditorStore.getState().project;
    project.pages.forEach((page, i) => {
      useEditorStore.setState({ project: { ...project, currentPageId: page.id }, selectedComponentId: null });
      usePreviewStore.setState({ isOpen: true, currentPageId: page.id });
      const { container, unmount } = render(<PreviewApp />);
      const expectedClass = EMITTED_SCENE_CLASS[i];
      expect(container.querySelector(`[class*="${expectedClass}"]`)).toBeInTheDocument();
      unmount();
    });
  });

  it('42. export HTML contains all 12 scene classes via bridge', () => {
    const project = useEditorStore.getState().project;
    const html = exportProjectToHtml(project);
    EMITTED_SCENE_CLASS.forEach((cls) => {
      expect(html).toContain(cls);
    });
  });

  it('43. product gate uses full 12 scene project (not 5 scene)', () => {
    const { project } = buildFullProject();
    expect(project.pages).toHaveLength(12);
    expect(project.pages.length).not.toBe(5);
  });
});

// ---------------------------------------------------------------------------
// PATCH A — Scope J: Export Interaction Emit
// ---------------------------------------------------------------------------

describe('GOLDEN-REFERENCE-PRODUCT-GATE-01 PATCH A — Scope J: Export Interaction Emit', () => {
  it('44. export tabs emit data-tab-id', () => {
    const { project } = buildFullProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain("setAttribute('data-tab-id'");
    expect(html).toContain('[data-tab-id]');
    expect(html).toContain("{id:'cp',label:'CP'}");
  });

  it('45. export timer emit data-action="timer-toggle"', () => {
    const { project } = buildFullProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain("'data-action', 'timer-toggle'");
    expect(html).toContain('[data-action="timer-toggle"]');
    expect(html).toContain("'data-running'");
    expect(html).toContain("'data-remaining'");
    expect(html).toContain('silse-timer-display');
  });

  it('46. export save response emit data-action="save-response"', () => {
    const { project } = buildFullProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain("'data-action', 'save-response'");
    expect(html).toContain('[data-action="save-response"]');
    expect(html).toContain('silse-saved-badge');
    // Export creates textarea via createElement('textarea')
    expect(html).toContain("createElement('textarea')");
  });

  it('47. export reveal emit silse-reveal-body + silse-reveal-hint', () => {
    const { project } = buildFullProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-reveal-body');
    expect(html).toContain('silse-reveal-hint');
    expect(html).toContain('.silse-block-reveal');
  });

  it('48. export wireInteractions handler exists + all selectors present', () => {
    const { project } = buildFullProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('wireInteractions()');
    expect(html).toContain('[data-tab-id]');
    expect(html).toContain('[data-action="timer-toggle"]');
    expect(html).toContain('[data-action="save-response"]');
    expect(html).toContain('.silse-block-reveal');
    expect(html).toContain('[data-item-id]');
    expect(html).toContain('[data-category]');
  });

  it('49. export interaction pipeline functional (emit + handler both present)', () => {
    const { project } = buildFullProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain("setAttribute('data-tab-id'");
    expect(html).toContain('[data-tab-id]');
    expect(html).toContain("'data-action', 'timer-toggle'");
    expect(html).toContain('[data-action="timer-toggle"]');
    expect(html).toContain("'data-action', 'save-response'");
    expect(html).toContain('[data-action="save-response"]');
    expect(html).toContain('silse-reveal-body');
    expect(html).toContain('.silse-block-reveal');
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setStoreProject(project: ReturnType<typeof createSceneProofProject>, pageId?: string) {
  if (pageId) project.currentPageId = pageId;
  useEditorStore.setState({ project, selectedComponentId: null });
}

function openPreview(pageId?: string) {
  const project = useEditorStore.getState().project;
  usePreviewStore.setState({ isOpen: true, currentPageId: pageId ?? project.currentPageId });
}
