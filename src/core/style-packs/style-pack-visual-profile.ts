/**
 * Style Pack Visual Profile (PREMIUM-STYLE-PACK-V2).
 *
 * Layer: core/style-packs (pure function, no React/DOM)
 * Allowed imports: ./style-pack-registry, ./component-skin, ./background-pattern
 *
 * Kontrak:
 *   Pure helper yang menggabungkan 3 lapisan visual (color tokens + component skin
 *   + background pattern) menjadi satu "visual personality" per style pack.
 *
 *   Prinsip:
 *     - Pure function, no DOM, no store, no React.
 *     - Unknown style pack → fallback modern-clean.
 *     - Hanya metadata/string, tidak mengubah content/layout/geometry.
 */

import { getStylePackV1, type StylePackIdV1 } from './style-pack-registry';
import { getComponentSkinForStylePack } from './component-skin';
import { getBackgroundPatternForStylePack } from './background-pattern';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StylePackVisualProfile = {
  stylePackId: string;
  name: string;
  description: string;
  /** Component skin mood (e.g. "clean", "soft", "mission"). */
  skinMood: string;
  /** Background pattern mood (e.g. "subtle-grid", "soft-dots", "mission-glow"). */
  backgroundMood: string;
  /** Visual intent description for guru. */
  visualIntent: string;
  /** Card skin class. */
  cardClass: string;
  /** Button skin class. */
  buttonClass: string;
  /** Quiz skin class. */
  quizClass: string;
  /** Bridge skin class. */
  bridgeClass: string;
  /** Game skin class. */
  gameClass: string;
  /** Layered info skin class. */
  layeredClass: string;
  /** Text skin class. */
  textClass: string;
  /** Page background class. */
  pageClass: string;
  /** Pattern overlay class. */
  patternClass: string;
};

// ---------------------------------------------------------------------------
// Visual profile mapping
// ---------------------------------------------------------------------------

const VISUAL_PROFILES: Record<StylePackIdV1, Omit<StylePackVisualProfile, 'stylePackId' | 'name' | 'description' | 'cardClass' | 'buttonClass' | 'quizClass' | 'bridgeClass' | 'gameClass' | 'layeredClass' | 'textClass' | 'pageClass' | 'patternClass'>> = {
  'modern-clean': {
    skinMood: 'clean',
    backgroundMood: 'subtle-grid',
    visualIntent: 'Profesional, rapi, putih-biru. Cocok untuk materi formal dan presentasi.',
  },
  'soft-classroom': {
    skinMood: 'soft',
    backgroundMood: 'soft-dots',
    visualIntent: 'Hangat, ramah, pastel. Cocok untuk SMP kelas rendah dan suasana nyaman.',
  },
  'mission-dark': {
    skinMood: 'mission',
    backgroundMood: 'mission-glow',
    visualIntent: 'Misi edukatif, game-like, gelap tapi readable. Cocok untuk aktivitas interaktif.',
  },
};

// ---------------------------------------------------------------------------
// Main: getStylePackVisualProfile
// ---------------------------------------------------------------------------

export function getStylePackVisualProfile(stylePackId?: string): StylePackVisualProfile {
  const pack = getStylePackV1(stylePackId);
  const skin = getComponentSkinForStylePack(pack.id);
  const bg = getBackgroundPatternForStylePack(pack.id);
  const profile = VISUAL_PROFILES[pack.id] ?? VISUAL_PROFILES['modern-clean'];

  return {
    stylePackId: pack.id,
    name: pack.name,
    description: pack.description,
    skinMood: profile.skinMood,
    backgroundMood: profile.backgroundMood,
    visualIntent: profile.visualIntent,
    cardClass: skin.cardClass,
    buttonClass: skin.buttonClass,
    quizClass: skin.quizClass,
    bridgeClass: skin.bridgeClass,
    gameClass: skin.gameClass,
    layeredClass: skin.layeredClass,
    textClass: skin.textClass,
    pageClass: bg.pageClass,
    patternClass: bg.patternClass,
  };
}
