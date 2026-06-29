/**
 * Celebration Effect (CELEBRATION-EFFECT-V1).
 *
 * Layer: core/style-packs (pure function, no React/DOM)
 * Allowed imports: ./style-pack-registry
 *
 * Kontrak:
 *   Pure helper yang mengembalikan CSS class names untuk celebration effect
 *   berdasarkan style pack. Effect = CSS-only success burst di feedback benar.
 *   No canvas, no library, no sound, no external asset.
 *
 *   Prinsip:
 *     - Pure function, no DOM, no store, no React.
 *     - Unknown style pack → fallback modern-clean.
 *     - Celebration ONLY on correct answer / success state.
 *     - No full-screen confetti engine.
 *     - Respects prefers-reduced-motion.
 */

import { getStylePackV1, type StylePackIdV1 } from './style-pack-registry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CelebrationEffectProfile = {
  /** CSS class for success overlay (burst + sparkle on correct feedback). */
  successClass: string;
  /** CSS class for burst ring animation. */
  burstClass: string;
  /** CSS class for particle sparkle pseudo-elements. */
  particleClass: string;
};

// ---------------------------------------------------------------------------
// Celebration mapping per style pack
// ---------------------------------------------------------------------------

const CELEBRATION_MAP: Record<StylePackIdV1, CelebrationEffectProfile> = {
  'modern-clean': {
    successClass: 'silse-celebrate-success-clean',
    burstClass: 'silse-celebrate-burst-clean',
    particleClass: 'silse-celebrate-particle-clean',
  },
  'soft-classroom': {
    successClass: 'silse-celebrate-success-soft',
    burstClass: 'silse-celebrate-burst-soft',
    particleClass: 'silse-celebrate-particle-soft',
  },
  'mission-dark': {
    successClass: 'silse-celebrate-success-mission',
    burstClass: 'silse-celebrate-burst-mission',
    particleClass: 'silse-celebrate-particle-mission',
  },
};

// ---------------------------------------------------------------------------
// Main: getCelebrationEffectForStylePack
// ---------------------------------------------------------------------------

export function getCelebrationEffectForStylePack(stylePackId?: string): CelebrationEffectProfile {
  const pack = getStylePackV1(stylePackId);
  return CELEBRATION_MAP[pack.id] ?? CELEBRATION_MAP['modern-clean'];
}

// ---------------------------------------------------------------------------
// Helper: get all celebration class names
// ---------------------------------------------------------------------------

export function getAllCelebrationClassNames(): string[] {
  const all: string[] = [];
  for (const profile of Object.values(CELEBRATION_MAP)) {
    all.push(profile.successClass, profile.burstClass, profile.particleClass);
  }
  return [...new Set(all)];
}
