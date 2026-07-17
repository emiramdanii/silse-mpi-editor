/**
 * simpleProjectToMpiContainer (MPI-FULL-CONTAINER-01).
 *
 * Layer: core/mpi-container (pure function, no React/DOM)
 * Allowed imports: ./types, ./createMpiContainer, ../types, ../ids
 *
 * Kontrak:
 *   Adapter one-way: SimpleProject → MpiContainer.
 *   Lossy untuk field yang belum ada di SimpleProject (styleIntent, designSystem
 *   dibuat default). Lossless untuk field yang ada (metadata, curriculum, pages→scenes,
 *   components→slots).
 *
 *   Prinsip:
 *     - Pure function, no DOM, no React, no store.
 *     - Tidak mengubah SimpleProject input.
 *     - Page role → Scene role (mapping 1:1 untuk role yang ada).
 *     - Component → Slot (mapping berdasarkan component.type).
 *     - Game dengan sceneMetadata → game-mission slot content.
 *     - SimpleProject TIDAK dihapus. Container berdampingan.
 */

import type { SimpleProject, SimplePage, PageComponent, GameComponent, QuestionComponent, TextComponent, CardComponent, NavigationComponent, HotspotOverlayComponent, InputFieldComponent, MaterialSceneMetadata } from '../types';
import type {
  MpiContainer,
  MpiScene,
  MpiSceneRole,
  MpiSceneType,
  MpiSceneSlot,
  MpiSceneSlotContent,
  MpiSceneSlotPlacement,
} from './types';
import { createMpiContainer, createMpiScene, createMpiSlot, createMpiFlow } from './createMpiContainer';

// ---------------------------------------------------------------------------
// Role mapping: SimplePage.role → MpiSceneRole
// ---------------------------------------------------------------------------

function mapPageRoleToSceneRole(pageRole: string): MpiSceneRole {
  const mapping: Record<string, MpiSceneRole> = {
    cover: 'cover',
    guide: 'guide',
    learningObjectives: 'objectives',
    starter: 'starter',
    material: 'material',
    activity: 'game', // 'activity' is internal role for game pages
    quiz: 'quiz',
    reflection: 'reflection',
    closing: 'closing',
    menu: 'guide', // fallback
    free: 'material', // fallback
  };
  return mapping[pageRole] ?? 'material';
}

// ---------------------------------------------------------------------------
// Scene type mapping: pageRole → default sceneType
// ---------------------------------------------------------------------------

function getDefaultSceneType(pageRole: string): MpiSceneType {
  const mapping: Record<string, MpiSceneType> = {
    cover: 'cover-hero',
    guide: 'guide-panel',
    learningObjectives: 'objectives-path',
    starter: 'starter-question',
    material: 'learning-scene',
    activity: 'game-mission',
    quiz: 'quiz-challenge',
    reflection: 'reflection-journal',
    closing: 'closing-award',
  };
  return mapping[pageRole] ?? 'learning-scene';
}

// ---------------------------------------------------------------------------
// Component → Slot content mapping
// ---------------------------------------------------------------------------

function mapComponentToSlotContent(
  component: PageComponent,
): { content: MpiSceneSlotContent; slotRole: string } {
  if (component.type === 'text') {
    const tc = component as TextComponent;
    // FOUNDATION-FINAL-LOCK-01: text dengan sceneMetadata cover-hero → cover-hero slot
    if (tc.sceneMetadata?.scene === 'cover-hero') {
      return {
        content: {
          kind: 'cover-hero',
          kicker: tc.sceneMetadata.kicker,
          heroTitle: tc.sceneMetadata.heroTitle ?? tc.text,
          heroSubtitle: tc.sceneMetadata.heroSubtitle,
          badges: tc.sceneMetadata.badges,
          primaryAction: tc.sceneMetadata.primaryAction,
          visualAnchor: tc.sceneMetadata.visualAnchor,
        },
        slotRole: 'heroTitle',
      };
    }
    return {
      content: { kind: 'text', variant: tc.variant, text: tc.text },
      slotRole: tc.variant === 'title' ? 'title' : tc.variant === 'subtitle' ? 'subtitle' : 'body',
    };
  }
  if (component.type === 'card') {
    const cc = component as CardComponent;
    // FOUNDATION-FINAL-LOCK-01: card dengan sceneMetadata closing-award → closing-award slot
    if (cc.sceneMetadata?.scene === 'closing-award') {
      return {
        content: {
          kind: 'closing-award',
          achievement: (cc.sceneMetadata as { achievement?: string }).achievement,
          summary: (cc.sceneMetadata as { summary?: string }).summary,
          reflectionPrompt: (cc.sceneMetadata as { reflectionPrompt?: string }).reflectionPrompt,
          rewardLabel: (cc.sceneMetadata as { rewardLabel?: string }).rewardLabel,
          rewardIcon: (cc.sceneMetadata as { rewardIcon?: string }).rewardIcon,
          nextLearning: (cc.sceneMetadata as { nextLearning?: string }).nextLearning,
          finalAction: (cc.sceneMetadata as { finalAction?: { label: string; action: string } }).finalAction,
        },
        slotRole: 'achievement',
      };
    }
    // MATERIAL-SCENE-PROOF-01: card dengan sceneMetadata learning-scene → learning-material slot
    if (cc.sceneMetadata?.scene === 'learning-scene') {
      const sm = cc.sceneMetadata as MaterialSceneMetadata;
      return {
        content: {
          kind: 'learning-material',
          conceptTitle: sm.conceptTitle ?? cc.title ?? '',
          conceptSubtitle: sm.conceptSubtitle,
          explanation: sm.explanation ?? cc.body,
          examples: sm.examples,
          keyPoints: sm.keyPoints,
          studentAction: sm.studentAction,
          visualHint: sm.visualHint,
        },
        slotRole: 'explanationPanel',
      };
    }
    return {
      content: { kind: 'card', variant: cc.variant, title: cc.title, body: cc.body },
      slotRole: 'card',
    };
  }
  if (component.type === 'navigation') {
    const nc = component as NavigationComponent;
    return {
      content: {
        kind: 'button',
        variant: nc.variant,
        label: nc.label,
        action: nc.action,
        targetSceneId: nc.targetPageId,
      },
      slotRole: 'cta',
    };
  }
  if (component.type === 'question') {
    const qc = component as QuestionComponent;
    const choices = qc.choices.map((c) => ({ id: c.id, text: c.text }));
    const correctChoice = qc.choices[qc.correctChoiceIndex];
    return {
      content: {
        kind: 'quiz-question',
        prompt: qc.prompt,
        choices,
        correctChoiceId: correctChoice?.id ?? '',
        feedbackCorrect: qc.feedbackCorrect,
        feedbackWrong: qc.feedbackWrong,
      },
      slotRole: qc.sceneMetadata?.scene === 'quiz-challenge' ? 'questionFocus' : 'quiz',
    };
  }
  if (component.type === 'game') {
    const gc = component as GameComponent;
    const mission = gc.missions[0];
    if (!mission) {
      return {
        content: { kind: 'text', variant: 'body', text: gc.title },
        slotRole: 'game',
      };
    }
    // Map mission choices → actions
    const actions = mission.choices.map((choice, idx) => ({
      id: choice.id,
      label: choice.text,
      result: (idx === mission.correctChoiceIndex ? 'correct' : 'wrong') as 'correct' | 'wrong',
      feedback: idx === mission.correctChoiceIndex ? mission.feedbackCorrect : mission.feedbackWrong,
    }));
    return {
      content: {
        kind: 'game-mission',
        briefing: gc.sceneMetadata?.briefing ?? gc.instruction,
        missionTarget: gc.sceneMetadata?.missionTarget ?? mission.prompt,
        actions,
        reward: gc.sceneMetadata?.reward ?? { type: 'badge', label: 'Misi Selesai' },
      },
      slotRole: 'game',
    };
  }
  // V2-PILAR-2: HotspotOverlayComponent → hotspot-overlay slot
  if (component.type === 'hotspot-overlay') {
    const hc = component as HotspotOverlayComponent;
    return {
      content: {
        kind: 'hotspot-overlay',
        variant: hc.variant,
        hotspots: hc.hotspots.map((h) => ({
          id: h.id,
          x: h.x,
          y: h.y,
          label: h.label,
          info: h.info,
        })),
        defaultOpenIndex: hc.defaultOpenIndex,
      },
      slotRole: 'overlay',
    };
  }

  // V2-PILAR-2: InputFieldComponent → input-field slot
  if (component.type === 'input-field') {
    const ic = component as InputFieldComponent;
    return {
      content: {
        kind: 'input-field',
        variant: ic.variant,
        label: ic.label,
        placeholder: ic.placeholder,
        correctAnswer: ic.correctAnswer,
        feedbackCorrect: ic.feedbackCorrect,
        feedbackWrong: ic.feedbackWrong,
        points: ic.points,
      },
      slotRole: 'response',
    };
  }

  // Fallback: image, layered-info, learning-bridge → text slot
  return {
    content: { kind: 'text', variant: 'body', text: `[${component.type}]` },
    slotRole: 'fallback',
  };
}

// ---------------------------------------------------------------------------
// Component → Slot mapping (with placement)
// ---------------------------------------------------------------------------

function mapComponentToSlot(component: PageComponent): MpiSceneSlot {
  const { content, slotRole } = mapComponentToSlotContent(component);
  const placement: MpiSceneSlotPlacement = {
    x: component.x,
    y: component.y,
    width: component.width,
    height: component.height,
  };
  // Fase 2 Step 1: pass component.id as slot.id so that slot.id === component.id.
  // This enables the editor's selection model to work through SceneRendererView:
  //   onSlotClick(slotId) → selectComponent(slotId) → Inspector finds component by id.
  return createMpiSlot(slotRole, placement, content, undefined, component.id);
}

// ---------------------------------------------------------------------------
// Page → Scene mapping
// ---------------------------------------------------------------------------

function mapPageToScene(page: SimplePage): MpiScene {
  const role = mapPageRoleToSceneRole(page.role);
  // BASELINE-SYNC: honor sceneType override (from AiMpiBlueprint bridge).
  const sceneType = (page.sceneType as MpiSceneType | undefined) ?? getDefaultSceneType(page.role);

  let slots: MpiSceneSlot[];
  if (page.sceneType && page.sceneContent) {
    // Bridge path — use sceneContent as the single primary slot.
    const placement: MpiSceneSlotPlacement = page.scenePlacement
      ? {
          x: page.scenePlacement.x,
          y: page.scenePlacement.y,
          width: page.scenePlacement.width,
          height: page.scenePlacement.height,
          zIndex: page.scenePlacement.zIndex,
        }
      : { x: 72, y: 120, width: 1136, height: 480 };
    slots = [createMpiSlot(page.sceneSlotRole ?? 'primary', placement, page.sceneContent as MpiSceneSlotContent)];
    // DYNAMIC-LAYOUT: pass page.sceneLayout ke slot[0] supaya renderer bisa baca
    if (page.sceneLayout) {
      slots[0].layout = page.sceneLayout;
    }
  } else {
    slots = page.components.map(mapComponentToSlot);
  }

  const scene = createMpiScene(role, sceneType, page.title, slots);
  scene.pageId = page.id;
  // BASELINE-SYNC: preserve page.id as scene.id when sceneType override is set.
  if (page.sceneType) {
    scene.id = page.id;
  }
  return scene;
}

// ---------------------------------------------------------------------------
// Main: simpleProjectToMpiContainer
// ---------------------------------------------------------------------------

/**
 * Convert SimpleProject to MpiContainer.
 * Pure function — no DOM, no store, no side effects.
 * Lossy for fields not in SimpleProject (styleIntent, designSystem = defaults).
 */
export function simpleProjectToMpiContainer(project: SimpleProject): MpiContainer {
  const scenes = project.pages.map(mapPageToScene);
  const sceneIds = scenes.map((s) => s.id);
  const flow = createMpiFlow(sceneIds);

  const container = createMpiContainer({
    sourceKind: 'manual',
    metadata: {
      title: project.title,
    },
    flow,
    scenes,
    runtime: {
      currentSceneId: sceneIds[0],
      score: 0,
      completedSceneIds: [],
      showProgress: true,
      showScore: true,
    },
  });

  // Curriculum
  if (project.curriculum) {
    container.curriculum = {
      subject: project.curriculum.subject,
      grade: project.curriculum.grade,
      phase: project.curriculum.phase,
      topic: project.curriculum.topic,
      cp: project.curriculum.cp,
      objectives: project.curriculum.objectives.map((o) => ({ id: o.id, text: o.text })),
    };
  }

  // Style intent (from stylePackId)
  if (project.stylePackId) {
    container.styleIntent = {
      styleId: project.stylePackId,
    };
  }

  // Design system (default — will be enriched in Scope 3)
  container.designSystem = {
    contractId: 'default',
  };

  return container;
}
