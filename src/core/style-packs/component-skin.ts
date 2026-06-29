/**
 * Component Skin (COMPONENT-SKIN-V2).
 *
 * Layer: core/style-packs (pure function, no React/DOM)
 * Allowed imports: ./style-pack-registry
 *
 * Kontrak (COMPONENT-SKIN-V2):
 *   Pure helper yang mengembalikan CSS class names untuk skin komponen
 *   berdasarkan style pack. Memanfaatkan componentTone dari StylePackV1.
 *
 *   Prinsip:
 *     - Skin = tampilan visual komponen (class names).
 *     - Tidak mengubah content/layout/geometry.
 *     - Editor dan export pakai class yang sama.
 *     - Unknown style pack → fallback modern-clean.
 *
 *   Skin classes (defined in styles.css + export HTML <style>):
 *     - skin-card-{flat|soft|bold}
 *     - skin-button-{clean|rounded|mission}
 *     - skin-quiz-{calm|playful|mission}
 *     - skin-bridge-{subtle|strong}
 *     - skin-game-{calm|playful|mission}
 */

import { getStylePackV1, type StylePackIdV1 } from './style-pack-registry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ComponentSkinTone = {
  /** CSS class for card components. */
  cardClass: string;
  /** CSS class for navigation/button components. */
  buttonClass: string;
  /** CSS class for question/quiz components. */
  quizClass: string;
  /** CSS class for learning-bridge components. */
  bridgeClass: string;
  /** CSS class for game components. */
  gameClass: string;
};

// ---------------------------------------------------------------------------
// Skin mapping per style pack
// ---------------------------------------------------------------------------

const SKIN_MAP: Record<StylePackIdV1, ComponentSkinTone> = {
  'modern-clean': {
    cardClass: 'skin-card-flat',
    buttonClass: 'skin-button-clean',
    quizClass: 'skin-quiz-calm',
    bridgeClass: 'skin-bridge-subtle',
    gameClass: 'skin-game-calm',
  },
  'soft-classroom': {
    cardClass: 'skin-card-soft',
    buttonClass: 'skin-button-rounded',
    quizClass: 'skin-quiz-playful',
    bridgeClass: 'skin-bridge-subtle',
    gameClass: 'skin-game-playful',
  },
  'mission-dark': {
    cardClass: 'skin-card-bold',
    buttonClass: 'skin-button-mission',
    quizClass: 'skin-quiz-mission',
    bridgeClass: 'skin-bridge-strong',
    gameClass: 'skin-game-mission',
  },
};

// ---------------------------------------------------------------------------
// Main: getComponentSkinForStylePack
// ---------------------------------------------------------------------------

/**
 * Get component skin CSS classes for a style pack.
 * Falls back to modern-clean for unknown IDs.
 * Pure function — does not access DOM or store.
 */
export function getComponentSkinForStylePack(stylePackId?: string): ComponentSkinTone {
  const pack = getStylePackV1(stylePackId);
  return SKIN_MAP[pack.id] ?? SKIN_MAP['modern-clean'];
}

// ---------------------------------------------------------------------------
// Helper: get skin class for a specific component type
// ---------------------------------------------------------------------------

/**
 * Get the skin CSS class for a specific component type.
 * Returns empty string if component type doesn't have a skin class.
 */
export function getSkinClassForComponent(
  componentType: 'card' | 'navigation' | 'question' | 'game' | 'learning-bridge' | string,
  stylePackId?: string,
): string {
  const skin = getComponentSkinForStylePack(stylePackId);
  switch (componentType) {
    case 'card':
      return skin.cardClass;
    case 'navigation':
      return skin.buttonClass;
    case 'question':
      return skin.quizClass;
    case 'game':
      return skin.gameClass;
    case 'learning-bridge':
      return skin.bridgeClass;
    default:
      return '';
  }
}

// ---------------------------------------------------------------------------
// Helper: get all skin class names (for CSS generation in export)
// ---------------------------------------------------------------------------

/**
 * Get all possible skin class names (for generating CSS in export HTML).
 */
export function getAllSkinClassNames(): string[] {
  const allClasses: string[] = [];
  for (const skin of Object.values(SKIN_MAP)) {
    allClasses.push(skin.cardClass, skin.buttonClass, skin.quizClass, skin.bridgeClass, skin.gameClass);
  }
  return [...new Set(allClasses)];
}
