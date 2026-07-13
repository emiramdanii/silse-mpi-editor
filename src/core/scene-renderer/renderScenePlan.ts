/**
 * Scene Renderer (SCENE-RENDERER-PROOF-01).
 *
 * Layer: core/scene-renderer (pure function, no React/DOM)
 * Allowed imports: ../mpi-container/types, ../mpi-design-contract/types
 *
 * Kontrak:
 *   Pure function yang menghasilkan "render plan" untuk satu scene berdasarkan
 *   MpiContainer + DesignContract. Render plan = struktur data yang renderer
 *   view (React/DOM) bisa gunakan untuk emit HTML classes + content.
 *
 *   Bukan list biasa. Render plan punya:
 *     - sceneClass (silse-scene + silse-scene-<sceneType>)
 *     - slots: array of { slotClass, placement, contentClass, content }
 *
 *   Prinsip:
 *     - Pure function, no DOM, no React.
 *     - Baca scene dari container.
 *     - Baca placement dari slot.
 *     - Baca design token dari contract (via designTokenKey).
 *     - Output bukan list biasa.
 *     - Editor/preview/export bisa pakai render plan yang sama (parity).
 */

import type { MpiScene, MpiSceneSlot, MpiSceneSlotContent } from '../mpi-container/types';
import type { MpiDesignContract } from '../mpi-design-contract/types';

// ---------------------------------------------------------------------------
// Render plan types
// ---------------------------------------------------------------------------

/**
 * Resolved visual instruction for a slot — concrete CSS values derived from
 * Design Contract. Renderer (editor/preview/export) reads these directly.
 * Tidak ada hardcoded CSS di renderer; nilai utama datang dari sini.
 */
export type SlotResolvedStyle = {
  /** Card/surface visual (background, radius, padding, border, shadow). */
  surface?: {
    background: string;
    radius: number;
    padding: number;
    border: string;
    shadow: string;
  };
  /** Button visual (untuk button/action card). */
  button?: {
    background: string;
    color: string;
    radius: number;
    fontWeight: number;
    padding: { top: number; right: number; bottom: number; left: number };
  };
  /** Typography (untuk text/title). */
  typography?: {
    fontFamily: string;
    fontSize: number;
    fontWeight: number;
    color: string;
    lineHeight: number;
    letterSpacing: number;
    uppercase: boolean;
  };
  /** Feedback visual (untuk feedback slot). */
  feedback?: {
    background: string;
    color: string;
    borderColor: string;
    icon?: string;
  };
  /** Reward visual (untuk reward slot). */
  reward?: {
    background: string;
    borderColor: string;
    radius: number;
    icon?: string;
  };
  /** QUIZ-SCENE-PROOF-01: Answer card visual (untuk quiz answer cards). */
  quizAnswerCard?: {
    background: string;
    radius: number;
    padding: number;
    border: string;
  };
  /** QUIZ-SCENE-PROOF-01: Answer state visual (selected/correct/wrong). */
  quizState?: {
    selected: { background: string; borderColor: string };
    correct: { background: string; borderColor: string };
    wrong: { background: string; borderColor: string };
  };
  /** QUIZ-SCENE-PROOF-01: Choice letter badge visual. */
  quizChoiceBadge?: {
    background: string;
    color: string;
    radius: number;
  };
  /** QUIZ-SCENE-PROOF-01: Question focus panel visual. */
  quizQuestionPanel?: {
    background: string;
    radius: number;
    padding: number;
  };
};

export type SceneRenderSlot = {
  id: string;
  role: string;
  slotClass: string; // e.g. "silse-scene-slot silse-scene-briefing"
  placement: { x: number; y: number; width: number; height: number; zIndex?: number };
  contentClass: string; // e.g. "silse-scene-card" | "silse-scene-button"
  content: MpiSceneSlotContent;
  designTokenKey?: string;
  /** DESIGN-CONTRACT-RENDER-PARITY-01: resolved visual instruction from contract. */
  resolvedStyle?: SlotResolvedStyle;
};

export type SceneRenderPlan = {
  sceneId: string;
  sceneClass: string; // e.g. "silse-scene silse-scene-game-mission"
  sceneType: string;
  title: string;
  slots: SceneRenderSlot[];
  designContractId: string;
  /** DESIGN-CONTRACT-RENDER-PARITY-01: frame visual instruction. */
  frame: {
    width: number;
    height: number;
    stageRadius: number;
    overflow: string;
  };
  /** DESIGN-CONTRACT-RENDER-PARITY-01: palette tokens. */
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    mutedText: string;
    border: string;
    gold: string;
    success: string;
    danger: string;
  };
  /** DESIGN-CONTRACT-RENDER-PARITY-01: typography tokens. */
  typography: {
    heroFont: string;
    bodyFont: string;
    titleSize: number;
    bodySize: number;
    titleWeight: number;
    lineHeight: number;
    letterSpacing: number;
  };
  /** DESIGN-CONTRACT-RENDER-PARITY-01: background visual instruction. */
  background: {
    pattern: string;
    color: string;
    gradient?: string;
  };
  /** FOUNDATION-HARDENING-01: learning visual tokens (untuk export yang tidak akses contract langsung). */
  learning?: {
    keyPointPanel: { background: string; radius: number; padding: number; border: string; accentColor: string; iconColor: string; icon: string };
    studentActionPanel: { background: string; radius: number; padding: number; border: string; icon: string; iconColor: string; labelColor: string };
    visualHintPanel: { color: string; fontStyle: string; icon: string };
    explanationPanel: { background: string; radius: number; padding: number; border: string };
    exampleCardStyle: { background: string; radius: number; padding: number; border: string };
    exampleGridColumns: string;
  };
  /** FOUNDATION-HARDENING-01: game visual tokens (untuk export). */
  gameTokens?: {
    targetPanel: { background: string; radius: number; padding: number; border: string };
    actionCardStyle: { background: string; radius: number; padding: number; border: string };
    rewardBadge: { background: string; color: string; radius: number; icon: string };
  };
};

// ---------------------------------------------------------------------------
// Slot class resolver
// ---------------------------------------------------------------------------

function slotRoleToClass(role: string): string {
  const base = 'silse-scene-slot';
  const roleClass = `silse-scene-${role.replace(/[^a-zA-Z0-9-]/g, '-')}`;
  return `${base} ${roleClass}`;
}

// ---------------------------------------------------------------------------
// Content class resolver
// ---------------------------------------------------------------------------

function contentKindToClass(kind: MpiSceneSlotContent['kind']): string {
  const mapping: Record<string, string> = {
    'text': 'silse-scene-text',
    'card': 'silse-scene-card',
    'image': 'silse-scene-image',
    'button': 'silse-scene-button',
    'badge': 'silse-scene-badge',
    'game-mission': 'silse-scene-game-mission',
    'quiz-question': 'silse-scene-quiz',
    'learning-material': 'silse-scene-learning',
    'cover-hero': 'silse-scene-cover',
    'closing-award': 'silse-scene-closing',
    'feedback': 'silse-scene-feedback',
    'reward': 'silse-scene-reward',
    'navigation': 'silse-scene-navigation',
    // GOLDEN-REFERENCE-RENDER-P1: 7 new content kinds
    'curriculum-guide': 'silse-scene-curriculum',
    'objectives-path': 'silse-scene-objectives',
    'starter-review': 'silse-scene-starter',
    'discussion-scene': 'silse-scene-discussion-block',
    'case-analysis': 'silse-scene-case',
    'result-summary': 'silse-scene-result',
    'reflection-journal': 'silse-scene-reflection-block',
    // V2-PILAR-2: overlay content kinds
    'hotspot-overlay': 'silse-scene-hotspot-overlay',
    'input-field': 'silse-scene-input-field',
  };
  return mapping[kind] ?? 'silse-scene-unknown';
}

// ---------------------------------------------------------------------------
// Slot → render slot
// ---------------------------------------------------------------------------

function mapSlotToRenderSlot(slot: MpiSceneSlot, contract: MpiDesignContract): SceneRenderSlot {
  return {
    id: slot.id,
    role: slot.role,
    slotClass: slotRoleToClass(slot.role),
    placement: {
      x: slot.placement.x,
      y: slot.placement.y,
      width: slot.placement.width,
      height: slot.placement.height,
      zIndex: slot.placement.zIndex,
    },
    contentClass: contentKindToClass(slot.content.kind),
    content: slot.content,
    designTokenKey: slot.designTokenKey,
    resolvedStyle: resolveSlotStyle(slot, contract),
  };
}

// ---------------------------------------------------------------------------
// DESIGN-CONTRACT-RENDER-PARITY-01: resolve visual tokens for a slot
// ---------------------------------------------------------------------------

/**
 * Resolve visual instruction for a slot dari Design Contract.
 * Returns concrete CSS values (background, radius, padding, border, shadow,
 * button style, typography, feedback, reward) yang renderer baca langsung.
 *
 * Pure function — no DOM, no React.
 */
function resolveSlotStyle(slot: MpiSceneSlot, contract: MpiDesignContract): SlotResolvedStyle {
  const style: SlotResolvedStyle = {};
  const kind = slot.content.kind;

  // Card / surface visual (untuk card, game-mission, quiz, learning-material, closing-award)
  if (kind === 'card' || kind === 'game-mission' || kind === 'quiz-question' || kind === 'learning-material' || kind === 'closing-award') {
    // Untuk game-mission, briefing & target pakai card style dari contract.game
    if (kind === 'game-mission') {
      const briefingCard = contract.game.briefingPanel;
      if (briefingCard) {
        style.surface = {
          background: briefingCard.background ?? contract.palette.surface,
          radius: briefingCard.radius ?? contract.card.radius,
          padding: briefingCard.padding ?? contract.card.padding,
          border: briefingCard.border ?? contract.card.border,
          shadow: briefingCard.shadow ?? contract.card.shadow,
        };
      }
    } else {
      style.surface = {
        background: contract.card.background,
        radius: contract.card.radius,
        padding: contract.card.padding,
        border: contract.card.border,
        shadow: contract.card.shadow,
      };
    }
  }

  // Button visual (untuk button, game action card, quiz choice)
  if (kind === 'button') {
    const btnVariant = (slot.content as { variant?: string }).variant ?? 'primary';
    const btn = contract.button[btnVariant as keyof typeof contract.button] ?? contract.button.primary;
    style.button = {
      background: btn.background,
      color: btn.color,
      radius: btn.radius,
      fontWeight: btn.fontWeight,
      padding: btn.padding,
    };
  }

  // Typography (untuk text)
  if (kind === 'text') {
    const variant = (slot.content as { variant?: string }).variant ?? 'body';
    style.typography = {
      fontFamily: variant === 'title' ? contract.typography.heroFont : contract.typography.bodyFont,
      fontSize: variant === 'title' ? contract.typography.titleSize : contract.typography.bodySize,
      fontWeight: variant === 'title' ? contract.typography.titleWeight : contract.typography.bodyWeight,
      color: contract.palette.text,
      lineHeight: contract.typography.lineHeight,
      letterSpacing: contract.typography.letterSpacing,
      uppercase: contract.typography.uppercase,
    };
  }

  // Feedback visual
  if (kind === 'feedback') {
    const fbVariant = (slot.content as { variant?: string }).variant ?? 'neutral';
    const fb = contract.feedback[fbVariant as keyof typeof contract.feedback] ?? contract.feedback.neutral;
    style.feedback = {
      background: fb.background,
      color: fb.color,
      borderColor: fb.borderColor,
      icon: fb.icon,
    };
  }

  // QUIZ-SCENE-PROOF-01: quiz-question slot dapat answer card + state + badge + panel visual
  if (kind === 'quiz-question') {
    // Answer card visual (dari contract.quiz.answerCard atau fallback ke contract.card)
    const ansCard = contract.quiz.answerCard;
    style.quizAnswerCard = {
      background: ansCard?.background ?? contract.card.background,
      radius: ansCard?.radius ?? contract.card.radius,
      padding: ansCard?.padding ?? contract.card.padding,
      border: ansCard?.border ?? contract.card.border,
    };
    // Answer state visual (selected/correct/wrong)
    style.quizState = {
      selected: {
        background: contract.quiz.selectedState?.background ?? '#dbeafe',
        borderColor: contract.quiz.selectedState?.borderColor ?? '#2563eb',
      },
      correct: {
        background: contract.quiz.correctState?.background ?? '#d1fae5',
        borderColor: contract.quiz.correctState?.borderColor ?? '#16a34a',
      },
      wrong: {
        background: contract.quiz.wrongState?.background ?? '#fee2e2',
        borderColor: contract.quiz.wrongState?.borderColor ?? '#dc2626',
      },
    };
    // Choice letter badge visual
    const badge = contract.quiz.choiceLetterBadge;
    if (badge) {
      style.quizChoiceBadge = {
        background: badge.background,
        color: badge.color,
        radius: badge.radius,
      };
    }
    // Question focus panel visual (dari contract.quiz.questionPanel atau fallback)
    const qPanel = contract.quiz.questionPanel;
    style.quizQuestionPanel = {
      background: qPanel?.background ?? contract.palette.surface,
      radius: qPanel?.radius ?? contract.card.radius,
      padding: qPanel?.padding ?? contract.card.padding,
    };
  }

  // Reward visual
  if (kind === 'reward') {
    const medal = contract.reward.medal;
    if (medal) {
      style.reward = {
        background: medal.background,
        borderColor: medal.borderColor,
        radius: medal.radius,
        icon: medal.icon,
      };
    }
  }

  // FOUNDATION-FINAL-LOCK-01: cover-hero visual
  if (kind === 'cover-hero') {
    style.typography = {
      fontFamily: contract.typography.heroFont,
      fontSize: contract.typography.titleSize,
      fontWeight: contract.typography.titleWeight,
      color: contract.palette.text,
      lineHeight: contract.typography.lineHeight,
      letterSpacing: contract.typography.letterSpacing,
      uppercase: contract.typography.uppercase,
    };
    const btn = contract.button.primary;
    style.button = {
      background: btn.background,
      color: btn.color,
      radius: btn.radius,
      fontWeight: btn.fontWeight,
      padding: btn.padding,
    };
  }

  // FOUNDATION-FINAL-LOCK-01: closing-award visual (reward + button)
  if (kind === 'closing-award') {
    const medal = contract.reward.medal;
    if (medal) {
      style.reward = {
        background: medal.background,
        borderColor: medal.borderColor,
        radius: medal.radius,
        icon: medal.icon,
      };
    }
    const btn = contract.button.primary;
    style.button = {
      background: btn.background,
      color: btn.color,
      radius: btn.radius,
      fontWeight: btn.fontWeight,
      padding: btn.padding,
    };
  }

  return style;
}

// ---------------------------------------------------------------------------
// Main: renderScenePlan
// ---------------------------------------------------------------------------

/**
 * Build render plan for a scene from MpiContainer + DesignContract.
 * Pure function — no DOM, no React, no store.
 * Output is a data structure that React/DOM renderers can consume.
 *
 * DESIGN-CONTRACT-RENDER-PARITY-01: plan now carries visual instruction
 * (frame, palette, typography, background) + each slot has resolvedStyle.
 */
export function renderScenePlan(
  scene: MpiScene,
  contract: MpiDesignContract,
): SceneRenderPlan {
  const sceneClass = `silse-scene silse-scene-${scene.sceneType}`;

  return {
    sceneId: scene.id,
    sceneClass,
    sceneType: scene.sceneType,
    title: scene.title,
    slots: scene.slots.map((s) => mapSlotToRenderSlot(s, contract)),
    designContractId: contract.id,
    frame: {
      width: contract.frame.width,
      height: contract.frame.height,
      stageRadius: contract.frame.stageRadius,
      overflow: contract.frame.overflow,
    },
    palette: {
      primary: contract.palette.primary,
      secondary: contract.palette.secondary,
      accent: contract.palette.accent,
      background: contract.palette.background,
      surface: contract.palette.surface,
      text: contract.palette.text,
      mutedText: contract.palette.mutedText,
      border: contract.palette.border,
      gold: contract.palette.gold,
      success: contract.palette.success,
      danger: contract.palette.danger,
    },
    typography: {
      heroFont: contract.typography.heroFont,
      bodyFont: contract.typography.bodyFont,
      titleSize: contract.typography.titleSize,
      bodySize: contract.typography.bodySize,
      titleWeight: contract.typography.titleWeight,
      lineHeight: contract.typography.lineHeight,
      letterSpacing: contract.typography.letterSpacing,
    },
    background: {
      pattern: contract.background.pattern,
      color: contract.background.color ?? contract.palette.background,
      gradient: contract.background.gradient,
    },
    // FOUNDATION-HARDENING-01: learning tokens untuk export
    learning: {
      keyPointPanel: {
        background: contract.learning.keyPointPanel?.background ?? '#fffbeb',
        radius: contract.learning.keyPointPanel?.radius ?? 10,
        padding: contract.learning.keyPointPanel?.padding ?? 12,
        border: contract.learning.keyPointPanel?.border ?? '1px solid #fde68a',
        accentColor: contract.learning.keyPointPanel?.accentColor ?? '#f59e0b',
        iconColor: contract.learning.keyPointPanel?.iconColor ?? '#92400e',
        icon: contract.learning.keyPointPanel?.icon ?? '🔑',
      },
      studentActionPanel: {
        background: contract.learning.studentActionPanel?.background ?? contract.palette.surface,
        radius: contract.learning.studentActionPanel?.radius ?? 10,
        padding: contract.learning.studentActionPanel?.padding ?? 12,
        border: contract.learning.studentActionPanel?.border ?? `2px solid ${contract.palette.primary}`,
        icon: contract.learning.studentActionPanel?.icon ?? '✏️',
        iconColor: contract.learning.studentActionPanel?.iconColor ?? contract.palette.primary,
        labelColor: contract.learning.studentActionPanel?.labelColor ?? contract.palette.mutedText,
      },
      visualHintPanel: {
        color: contract.learning.visualHintPanel?.color ?? contract.palette.mutedText,
        fontStyle: contract.learning.visualHintPanel?.fontStyle ?? 'italic',
        icon: contract.learning.visualHintPanel?.icon ?? '💡',
      },
      explanationPanel: {
        background: contract.learning.explanationPanel?.background ?? contract.card.background,
        radius: contract.learning.explanationPanel?.radius ?? contract.card.radius,
        padding: contract.learning.explanationPanel?.padding ?? contract.card.padding,
        border: contract.learning.explanationPanel?.border ?? contract.card.border,
      },
      exampleCardStyle: {
        background: contract.learning.exampleCardStyle?.background ?? contract.palette.surface,
        radius: contract.learning.exampleCardStyle?.radius ?? contract.card.radius,
        padding: contract.learning.exampleCardStyle?.padding ?? contract.card.padding,
        border: contract.learning.exampleCardStyle?.border ?? contract.card.border,
      },
      exampleGridColumns: contract.learning.exampleGridColumns ?? 'repeat(auto-fill, minmax(280px, 1fr))',
    },
    // FOUNDATION-HARDENING-01: game tokens untuk export
    gameTokens: {
      targetPanel: {
        background: contract.game.targetPanel?.background ?? '#eff6ff',
        radius: contract.game.targetPanel?.radius ?? 10,
        padding: contract.game.targetPanel?.padding ?? 12,
        border: contract.game.targetPanel?.border ?? '1px solid #bfdbfe',
      },
      actionCardStyle: {
        background: contract.game.actionCardStyle?.background ?? '#ffffff',
        radius: contract.game.actionCardStyle?.radius ?? 12,
        padding: contract.game.actionCardStyle?.padding ?? 14,
        border: contract.game.actionCardStyle?.border ?? '2px solid #d1d5db',
      },
      rewardBadge: {
        background: contract.game.rewardBadge?.background ?? '#fffbeb',
        color: contract.game.rewardBadge?.color ?? '#92400e',
        radius: contract.game.rewardBadge?.radius ?? 12,
        icon: contract.game.rewardBadge?.icon ?? '🏅',
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Helper: check if render plan is scene (not plain list)
// ---------------------------------------------------------------------------

/**
 * Check if a render plan produces scene structure (not plain list).
 * A scene must have silse-scene class and at least one slot with slotClass.
 */
export function isSceneRenderPlan(plan: unknown): boolean {
  if (!plan || typeof plan !== 'object') return false;
  const p = plan as Partial<SceneRenderPlan>;
  return (
    typeof p.sceneClass === 'string' &&
    p.sceneClass.includes('silse-scene') &&
    Array.isArray(p.slots) &&
    p.slots.length > 0 &&
    p.slots.every((s) => typeof s.slotClass === 'string' && s.slotClass.includes('silse-scene-slot'))
  );
}

// ---------------------------------------------------------------------------
// Helper: get design token value from contract by key path
// ---------------------------------------------------------------------------

/**
 * Resolve a design token value from contract by dot-path key.
 * e.g. "card.radius" → contract.card.radius
 * e.g. "button.primary.background" → contract.button.primary.background
 * Returns undefined if path not found.
 */
export function resolveDesignToken(
  contract: MpiDesignContract,
  keyPath: string,
): unknown {
  const parts = keyPath.split('.');
  let current: unknown = contract;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}
