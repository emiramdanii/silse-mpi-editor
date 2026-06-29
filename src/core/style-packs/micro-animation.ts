/**
 * Micro Animation System (MICRO-ANIMATION-SYSTEM-V1).
 *
 * Layer: core/style-packs (pure function, no React/DOM)
 * Allowed imports: ./style-pack-registry
 *
 * Kontrak:
 *   Pure helper yang mengembalikan CSS class names untuk micro-animation
 *   berdasarkan style pack. Animasi ringan: fade-in, hover lift, feedback pop,
 *   mission pulse. Semua bisa dimatikan via prefers-reduced-motion.
 *
 *   Prinsip:
 *     - Pure function, no DOM, no store, no React.
 *     - Unknown style pack → fallback modern-clean.
 *     - No confetti, no particle, no full-screen celebration.
 *     - Animasi < 300ms, no infinite (except mission pulse, very subtle).
 */

import { getStylePackV1, type StylePackIdV1 } from './style-pack-registry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MicroAnimationProfile = {
  pageEnterClass: string;
  buttonClass: string;
  choiceClass: string;
  feedbackClass: string;
  gameClass: string;
};

// ---------------------------------------------------------------------------
// Animation mapping per style pack
// ---------------------------------------------------------------------------

const ANIMATION_MAP: Record<StylePackIdV1, MicroAnimationProfile> = {
  'modern-clean': {
    pageEnterClass: 'silse-anim-page-soft-in',
    buttonClass: 'silse-anim-button-clean',
    choiceClass: 'silse-anim-choice-clean',
    feedbackClass: 'silse-anim-feedback-soft',
    gameClass: 'silse-anim-game-clean',
  },
  'soft-classroom': {
    pageEnterClass: 'silse-anim-page-warm-in',
    buttonClass: 'silse-anim-button-soft',
    choiceClass: 'silse-anim-choice-soft',
    feedbackClass: 'silse-anim-feedback-warm',
    gameClass: 'silse-anim-game-soft',
  },
  'mission-dark': {
    pageEnterClass: 'silse-anim-page-mission-in',
    buttonClass: 'silse-anim-button-mission',
    choiceClass: 'silse-anim-choice-mission',
    feedbackClass: 'silse-anim-feedback-mission',
    gameClass: 'silse-anim-game-mission',
  },
};

// ---------------------------------------------------------------------------
// Main: getMicroAnimationForStylePack
// ---------------------------------------------------------------------------

export function getMicroAnimationForStylePack(stylePackId?: string): MicroAnimationProfile {
  const pack = getStylePackV1(stylePackId);
  return ANIMATION_MAP[pack.id] ?? ANIMATION_MAP['modern-clean'];
}

// ---------------------------------------------------------------------------
// Helper: get all micro animation class names
// ---------------------------------------------------------------------------

export function getAllMicroAnimationClassNames(): string[] {
  const all: string[] = [];
  for (const profile of Object.values(ANIMATION_MAP)) {
    all.push(
      profile.pageEnterClass,
      profile.buttonClass,
      profile.choiceClass,
      profile.feedbackClass,
      profile.gameClass,
    );
  }
  return [...new Set(all)];
}
