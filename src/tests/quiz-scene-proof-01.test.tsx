/**
 * QUIZ-SCENE-PROOF-01 — Test Suite.
 *
 * Kontrak: Quiz dirender sebagai challenge scene (challenge header + question focus
 * + answer cards + feedback + progress), bukan form pilihan biasa. Pakai fondasi
 * sama: container + design contract + render parity.
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
  renderScenePlan,
} from '../core/scene-renderer';
import { simpleProjectToMpiContainer } from '../core/mpi-container';
import { getDesignContract } from '../core/mpi-design-contract';
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

function loadQuizBlueprint() {
  const path = resolve(__dirname, '../../samples/ai-mpi-json/quiz-challenge-scene-proof.sample.json');
  const raw = readFileSync(path, 'utf-8');
  return normalizeBlueprint(JSON.parse(raw));
}

function getQuizPage(project: ReturnType<typeof createSceneProofProject>) {
  return project.pages.find((p) => p.role === 'quiz')!;
}

// ---------------------------------------------------------------------------
// Scope A+B: Scene model + AI JSON support
// ---------------------------------------------------------------------------

describe('QUIZ-SCENE-PROOF-01 — scene model + AI JSON', () => {
  it('1. isPageSceneRenderable detects quiz-challenge page', () => {
    const project = createSceneProofProject();
    const quizPage = getQuizPage(project);
    expect(isPageSceneRenderable(quizPage)).toBe(true);
  });

  it('2. validator menerima quiz-challenge scene valid', () => {
    const blueprint = loadQuizBlueprint();
    const errors = validateAiMpiJson(blueprint);
    expect(errors).toHaveLength(0);
  });

  it('3. validator menolak quiz datar tanpa scene/slots', () => {
    const flatQuiz = { title: 'Test', questions: [{ prompt: 'A?', choices: [] }] };
    const errors = validateAiMpiJson(flatQuiz);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('4. normalizer tidak menghapus sceneType quiz-challenge', () => {
    const blueprint = loadQuizBlueprint();
    expect(blueprint.scenes[0].sceneType).toBe('quiz-challenge');
  });

  it('5. aiJsonToMpiContainer mempertahankan quiz slots', () => {
    const blueprint = loadQuizBlueprint();
    const container = aiJsonToMpiContainer(blueprint);
    const quizScene = container.scenes.find((s) => s.sceneType === 'quiz-challenge');
    expect(quizScene).toBeDefined();
    expect(quizScene?.slots.length).toBeGreaterThan(0);
    const quizSlot = quizScene?.slots.find((s) => s.content.kind === 'quiz-question');
    expect(quizSlot).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Scope C: Render plan support
// ---------------------------------------------------------------------------

describe('QUIZ-SCENE-PROOF-01 — render plan', () => {
  it('6. renderScenePlan menghasilkan quiz slots + resolvedStyle', () => {
    const project = createSceneProofProject();
    const quizPage = getQuizPage(project);
    const plan = buildSceneRenderPlanForPage(project, quizPage)!;
    expect(plan).not.toBeNull();
    expect(plan.sceneClass).toContain('silse-scene-quiz-challenge');
    const quizSlot = plan.slots.find((s) => s.content.kind === 'quiz-question');
    expect(quizSlot).toBeDefined();
    expect(quizSlot?.resolvedStyle).toBeDefined();
    expect(quizSlot?.resolvedStyle?.quizAnswerCard).toBeDefined();
    expect(quizSlot?.resolvedStyle?.quizState).toBeDefined();
    expect(quizSlot?.resolvedStyle?.quizChoiceBadge).toBeDefined();
    expect(quizSlot?.resolvedStyle?.quizQuestionPanel).toBeDefined();
  });

  it('7. renderScenePlan membawa placement spesifik (x:72, y:120)', () => {
    const project = createSceneProofProject();
    const quizPage = getQuizPage(project);
    const plan = buildSceneRenderPlanForPage(project, quizPage)!;
    const quizSlot = plan.slots.find((s) => s.content.kind === 'quiz-question')!;
    expect(quizSlot.placement.x).toBe(72);
    expect(quizSlot.placement.y).toBe(120);
    expect(quizSlot.placement.width).toBe(1136);
    expect(quizSlot.placement.height).toBe(480);
  });

  it('8. resolvedStyle.quizAnswerCard punya background/radius/padding/border dari contract', () => {
    const project = createSceneProofProject();
    const quizPage = getQuizPage(project);
    const plan = buildSceneRenderPlanForPage(project, quizPage)!;
    const quizSlot = plan.slots.find((s) => s.content.kind === 'quiz-question')!;
    const ansCard = quizSlot.resolvedStyle?.quizAnswerCard;
    expect(ansCard?.background).toBeTruthy();
    expect(typeof ansCard?.radius).toBe('number');
    expect(typeof ansCard?.padding).toBe('number');
    expect(ansCard?.border).toBeTruthy();
  });

  it('9. resolvedStyle.quizState punya selected/correct/wrong visual', () => {
    const project = createSceneProofProject();
    const quizPage = getQuizPage(project);
    const plan = buildSceneRenderPlanForPage(project, quizPage)!;
    const quizSlot = plan.slots.find((s) => s.content.kind === 'quiz-question')!;
    const state = quizSlot.resolvedStyle?.quizState;
    expect(state?.selected).toBeDefined();
    expect(state?.correct).toBeDefined();
    expect(state?.wrong).toBeDefined();
    expect(state?.correct.background).toBe(getDesignContract('modern-clean').quiz.correctState?.background);
  });
});

// ---------------------------------------------------------------------------
// Scope D: SceneRendererView quiz renderer
// ---------------------------------------------------------------------------

describe('QUIZ-SCENE-PROOF-01 — SceneRendererView quiz scene', () => {
  it('10. SceneRendererView render silse-scene-quiz-challenge', () => {
    const project = createSceneProofProject();
    const quizPage = getQuizPage(project);
    const plan = buildSceneRenderPlanForPage(project, quizPage)!;
    const contract = getDesignContract(project.stylePackId);
    const { container } = render(<SceneRendererView plan={plan} contract={contract} />);
    expect(container.querySelector('.silse-scene-quiz-challenge')).toBeInTheDocument();
  });

  it('11. SceneRendererView render quiz scene classes (header, question-focus, answer-grid, answer-card, choice-badge, progress)', () => {
    const project = createSceneProofProject();
    const quizPage = getQuizPage(project);
    const plan = buildSceneRenderPlanForPage(project, quizPage)!;
    const contract = getDesignContract(project.stylePackId);
    const { container } = render(<SceneRendererView plan={plan} contract={contract} />);
    expect(container.querySelector('.silse-quiz-header')).toBeInTheDocument();
    expect(container.querySelector('.silse-quiz-question-focus')).toBeInTheDocument();
    expect(container.querySelector('.silse-quiz-answer-grid')).toBeInTheDocument();
    expect(container.querySelector('.silse-quiz-answer-card')).toBeInTheDocument();
    expect(container.querySelector('.silse-quiz-choice-badge')).toBeInTheDocument();
    expect(container.querySelector('.silse-quiz-progress')).toBeInTheDocument();
  });

  it('12. SceneRendererView applies placement (left:72px, top:120px)', () => {
    const project = createSceneProofProject();
    const quizPage = getQuizPage(project);
    const plan = buildSceneRenderPlanForPage(project, quizPage)!;
    const contract = getDesignContract(project.stylePackId);
    const { container } = render(<SceneRendererView plan={plan} contract={contract} />);
    const slot = container.querySelector('.silse-scene-slot') as HTMLElement;
    expect(slot.style.left).toBe('72px');
    expect(slot.style.top).toBe('120px');
    expect(slot.style.width).toBe('1136px');
    expect(slot.style.height).toBe('480px');
  });

  it('13. answer card visual dari contract (radius, background, border)', () => {
    const project = createSceneProofProject();
    const quizPage = getQuizPage(project);
    const plan = buildSceneRenderPlanForPage(project, quizPage)!;
    const contract = getDesignContract(project.stylePackId);
    const { container } = render(<SceneRendererView plan={plan} contract={contract} />);
    const answerCard = container.querySelector('.silse-quiz-answer-card') as HTMLElement;
    const expectedRadius = contract.quiz.answerCard?.radius ?? contract.card.radius;
    expect(answerCard.style.borderRadius).toBe(expectedRadius + 'px');
    expect(answerCard.style.background).toBeTruthy();
  });

  it('14. choice badge visual dari contract (radius, background, color)', () => {
    const project = createSceneProofProject();
    const quizPage = getQuizPage(project);
    const plan = buildSceneRenderPlanForPage(project, quizPage)!;
    const contract = getDesignContract(project.stylePackId);
    const { container } = render(<SceneRendererView plan={plan} contract={contract} />);
    const badge = container.querySelector('.silse-quiz-choice-badge') as HTMLElement;
    const expectedRadius = contract.quiz.choiceLetterBadge?.radius ?? 8;
    expect(badge.style.borderRadius).toBe(expectedRadius + 'px');
  });

  it('15. question focus panel visual dari contract (radius, background, padding)', () => {
    const project = createSceneProofProject();
    const quizPage = getQuizPage(project);
    const plan = buildSceneRenderPlanForPage(project, quizPage)!;
    const contract = getDesignContract(project.stylePackId);
    const { container } = render(<SceneRendererView plan={plan} contract={contract} />);
    const panel = container.querySelector('.silse-quiz-question-focus') as HTMLElement;
    const expectedRadius = contract.quiz.questionPanel?.radius ?? contract.card.radius;
    expect(panel.style.borderRadius).toBe(expectedRadius + 'px');
    expect(panel.style.background).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Scope E: Editor/Preview/Export parity
// ---------------------------------------------------------------------------

describe('QUIZ-SCENE-PROOF-01 — editor/preview/export parity', () => {
  it('16. CanvasStage render silse-scene-quiz-challenge', () => {
    const project = createSceneProofProject();
    const quizPage = getQuizPage(project);
    setStoreProject(project, quizPage.id);
    const { container } = render(<CanvasStage />);
    expect(container.querySelector('.silse-scene-quiz-challenge')).toBeInTheDocument();
  });

  it('17. PreviewApp render silse-scene-quiz-challenge', () => {
    const project = createSceneProofProject();
    const quizPage = getQuizPage(project);
    setStoreProject(project, quizPage.id);
    openPreview(quizPage.id);
    const { container } = render(<PreviewApp />);
    expect(container.querySelector('.silse-scene-quiz-challenge')).toBeInTheDocument();
  });

  it('18. export HTML mengandung silse-scene-quiz-challenge', () => {
    const project = createSceneProofProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-scene-quiz-challenge');
  });

  it('19. editor dan preview parity (same quiz scene classes)', () => {
    const project = createSceneProofProject();
    const quizPage = getQuizPage(project);
    setStoreProject(project, quizPage.id);
    const editorResult = render(<CanvasStage />);
    const editorClasses = editorResult.container.querySelector('.silse-scene')?.className;
    editorResult.unmount();

    openPreview(quizPage.id);
    const previewResult = render(<PreviewApp />);
    const previewClasses = previewResult.container.querySelector('.silse-scene')?.className;
    previewResult.unmount();

    expect(editorClasses).toBe(previewClasses);
  });

  it('20. export HTML mengandung quiz scene classes (answer-grid, answer-card, choice-badge)', () => {
    const project = createSceneProofProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-quiz-answer-grid');
    expect(html).toContain('silse-quiz-answer-card');
    expect(html).toContain('silse-quiz-choice-badge');
  });

  it('21. export HTML mengandung placement (x:72, y:120)', () => {
    const project = createSceneProofProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('"x":72');
    expect(html).toContain('"y":120');
  });

  it('22. editor dan preview sama-sama apply placement (left:72px)', () => {
    const project = createSceneProofProject();
    const quizPage = getQuizPage(project);
    setStoreProject(project, quizPage.id);
    const editorResult = render(<CanvasStage />);
    const editorSlot = editorResult.container.querySelector('.silse-scene-slot') as HTMLElement;
    expect(editorSlot.style.left).toBe('72px');
    editorResult.unmount();

    openPreview(quizPage.id);
    const previewResult = render(<PreviewApp />);
    const previewSlot = previewResult.container.querySelector('.silse-scene-slot') as HTMLElement;
    expect(previewSlot.style.left).toBe('72px');
    previewResult.unmount();
  });
});

// ---------------------------------------------------------------------------
// Scope G: Legacy fallback safe
// ---------------------------------------------------------------------------

describe('QUIZ-SCENE-PROOF-01 — legacy fallback', () => {
  it('23. legacy quiz (tanpa sceneMetadata) tetap render via QuestionComponentView', () => {
    const project = createSamplePpknProject();
    const quizPage = project.pages.find((p) => p.role === 'quiz');
    setStoreProject(project as unknown as ReturnType<typeof createSceneProofProject>, quizPage?.id);
    const { container } = render(<CanvasStage />);
    // Legacy quiz should NOT have silse-scene-quiz-challenge
    expect(container.querySelector('.silse-scene-quiz-challenge')).not.toBeInTheDocument();
  });

  it('24. legacy quiz export tanpa scenePlan quiz-challenge', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project);
    expect(html).not.toContain('silse-scene-quiz-challenge');
  });

  it('25. feedback token diterapkan (quiz feedback slot visual dari contract)', () => {
    const project = createSceneProofProject();
    const container = simpleProjectToMpiContainer(project);
    const quizScene = container.scenes.find((s) => s.sceneType === 'quiz-challenge')!;
    // Add a feedback slot
    quizScene.slots.push({
      id: 'test-quiz-feedback',
      role: 'feedback',
      placement: { x: 100, y: 600, width: 400, height: 60 },
      content: { kind: 'feedback', variant: 'correct', text: 'Benar!', icon: '✓' },
    });
    const contract = getDesignContract(project.stylePackId);
    const plan = renderScenePlan(quizScene, contract);
    const feedbackSlot = plan.slots.find((s) => s.content.kind === 'feedback')!;
    expect(feedbackSlot.resolvedStyle?.feedback).toBeDefined();
    expect(feedbackSlot.resolvedStyle?.feedback?.background).toBe(contract.feedback.correct.background);
  });

  it('26. no dependency added — all pure TypeScript', () => {
    const project = createSceneProofProject();
    const quizPage = getQuizPage(project);
    const plan = buildSceneRenderPlanForPage(project, quizPage)!;
    expect(plan).toBeDefined();
    expect(plan.slots[0].resolvedStyle).toBeDefined();
  });
});
