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
    'feedback': 'silse-scene-feedback',
    'reward': 'silse-scene-reward',
    'navigation': 'silse-scene-navigation',
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

  // Card / surface visual (untuk card, game-mission briefing/target, quiz panel)
  if (kind === 'card' || kind === 'game-mission' || kind === 'quiz-question') {
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
