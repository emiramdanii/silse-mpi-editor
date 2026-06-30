/**
 * Premium Export Profile (PREMIUM-EXPORT-OVERHAUL-01).
 *
 * Layer: core/style-packs (pure data, no React/DOM)
 * Allowed imports: ./style-pack-registry
 *
 * Kontrak (PREMIUM-EXPORT-OVERHAUL-01):
 *   Pure helper yang mengembalikan "signature visual story" per style pack
 *   untuk dipakai di export HTML. Story = 4 warna signature + gradient
 *   background per page-role + typography recipe + glow accent.
 *
 *   Prinsip:
 *     - Pure data, no DOM, no React.
 *     - Unknown style pack → fallback modern-clean.
 *     - Hanya warna/gradient/string — TIDAK mengubah content/layout/geometry.
 *     - Konsisten dengan reference premium (MEDIA_PENJELAJAH_PANCASILA_FINAL).
 *
 *   Story per style pack:
 *     - modern-clean   → navy + steel + crimson + amber (clean professional)
 *     - soft-classroom → cream + warm peach + soft red + honey gold (warm friendly)
 *     - mission-dark   → deep navy + steel blue + signal red + gold (mission serious)
 */

import { getStylePackV1, type StylePackIdV1 } from './style-pack-registry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * 4-color signature story + supporting tokens for premium export.
 * Mirrors reference HTML palette structure (--navy, --blue, --red, --gold).
 */
export type PremiumColorStory = {
  /** Darkest anchor — outer bg, topbar bg, hero text on light. */
  navy: string;
  /** Primary brand — h1 text on light, links, button bg. */
  blue: string;
  /** Accent — h1 span, primary CTA bg, ribbon. */
  red: string;
  /** Highlight — kicker pill bg, medal ring, score chip. */
  gold: string;
  /** Secondary gold (deeper, for gradient stops). */
  goldDeep: string;
  /** Page surface (cards, glass panels). */
  paper: string;
  /** Body text on light. */
  text: string;
  /** Muted text on light. */
  muted: string;
};

export type PremiumGradient = {
  /** Stage outer background (around the deck). */
  outerBg: string;
  /** Cover page background (multi-stop). */
  coverBg: string;
  /** Closing page background (multi-stop). */
  closingBg: string;
  /** Material page background (lighter, calm). */
  materialBg: string;
  /** Quiz page background. */
  quizBg: string;
  /** Default page background. */
  defaultBg: string;
};

export type PremiumTypography = {
  /** Hero font stack (Trebuchet MS-style display). */
  heroFont: string;
  /** Body font stack. */
  bodyFont: string;
  /** Hero weight (950 = extra bold). */
  heroWeight: number;
  /** Body weight. */
  bodyWeight: number;
  /** Letter-spacing for hero (tight). */
  heroLetterSpacing: string;
  /** Whether hero uses uppercase. */
  heroUppercase: boolean;
};

export type PremiumExportProfile = {
  stylePackId: StylePackIdV1;
  colors: PremiumColorStory;
  gradients: PremiumGradient;
  typography: PremiumTypography;
  /** Whether this style pack uses dark stage outer bg. */
  darkStage: boolean;
  /** Glassmorphism strength (0 = none, 1 = strong). */
  glassStrength: number;
  /** Card radius (px). */
  cardRadius: number;
  /** Button radius (px). */
  buttonRadius: number;
};

// ---------------------------------------------------------------------------
// Profile mapping per style pack
// ---------------------------------------------------------------------------

const PROFILES: Record<StylePackIdV1, PremiumExportProfile> = {
  'modern-clean': {
    stylePackId: 'modern-clean',
    colors: {
      navy: '#0d243d',
      blue: '#1d3557',
      red: '#e63946',
      gold: '#ffd166',
      goldDeep: '#ffb703',
      paper: '#ffffff',
      text: '#2d4960',
      muted: '#60788d',
    },
    gradients: {
      outerBg: '#0d243d',
      coverBg: 'linear-gradient(135deg, #1d3557 0%, #457b9d 55%, #eef4fb 100%)',
      closingBg: 'linear-gradient(135deg, #0d243d 0%, #1d3557 60%, #457b9d 100%)',
      materialBg: 'linear-gradient(180deg, #ffffff 0%, #f6f9fc 100%)',
      quizBg: 'linear-gradient(135deg, #eef4fb 0%, #f6f9fc 100%)',
      defaultBg: '#ffffff',
    },
    typography: {
      heroFont: "'Trebuchet MS', 'Segoe UI', Arial, sans-serif",
      bodyFont: "'Segoe UI', Arial, Helvetica, sans-serif",
      heroWeight: 950,
      bodyWeight: 560,
      heroLetterSpacing: '-0.025em',
      heroUppercase: true,
    },
    darkStage: true,
    glassStrength: 0.5,
    cardRadius: 24,
    buttonRadius: 999,
  },
  'soft-classroom': {
    stylePackId: 'soft-classroom',
    colors: {
      navy: '#4a3a2f',
      blue: '#7a5a3f',
      red: '#e76f51',
      gold: '#ffd166',
      goldDeep: '#f4a261',
      paper: '#fff8f0',
      text: '#5a4632',
      muted: '#8a7560',
    },
    gradients: {
      outerBg: '#3d2e23',
      coverBg: 'linear-gradient(135deg, #fff8f0 0%, #ffe8d0 50%, #ffd6a5 100%)',
      closingBg: 'linear-gradient(135deg, #ffe8d0 0%, #ffd6a5 60%, #ffb703 100%)',
      materialBg: 'linear-gradient(180deg, #fffaf3 0%, #fff3e0 100%)',
      quizBg: 'linear-gradient(135deg, #fff3e0 0%, #ffe8d0 100%)',
      defaultBg: '#fffaf3',
    },
    typography: {
      heroFont: "'Trebuchet MS', 'Segoe UI', Arial, sans-serif",
      bodyFont: "'Segoe UI', Arial, Helvetica, sans-serif",
      heroWeight: 900,
      bodyWeight: 580,
      heroLetterSpacing: '-0.02em',
      heroUppercase: false,
    },
    darkStage: true,
    glassStrength: 0.6,
    cardRadius: 28,
    buttonRadius: 999,
  },
  'mission-dark': {
    stylePackId: 'mission-dark',
    colors: {
      navy: '#0d243d',
      blue: '#1d3557',
      red: '#e63946',
      gold: '#ffd166',
      goldDeep: '#ffb703',
      paper: '#1e293b',
      text: '#f1f5f9',
      muted: '#94a3b8',
    },
    gradients: {
      outerBg: '#0a1828',
      coverBg: 'linear-gradient(135deg, #0d243d 0%, #1d3557 55%, #2a4a7a 100%)',
      closingBg: 'linear-gradient(135deg, #0d243d 0%, #1d3557 50%, #457b9d 100%)',
      materialBg: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
      quizBg: 'linear-gradient(135deg, #1e293b 0%, #0d243d 100%)',
      defaultBg: '#0f172a',
    },
    typography: {
      heroFont: "'Trebuchet MS', 'Segoe UI', Arial, sans-serif",
      bodyFont: "'Segoe UI', Arial, Helvetica, sans-serif",
      heroWeight: 1000,
      bodyWeight: 600,
      heroLetterSpacing: '-0.03em',
      heroUppercase: true,
    },
    darkStage: true,
    glassStrength: 0.8,
    cardRadius: 22,
    buttonRadius: 12,
  },
};

// ---------------------------------------------------------------------------
// Main: getPremiumExportProfile
// ---------------------------------------------------------------------------

/**
 * Get the premium export profile for a style pack.
 * Falls back to modern-clean for unknown IDs.
 * Pure function — no DOM, no store.
 */
export function getPremiumExportProfile(stylePackId?: string): PremiumExportProfile {
  const pack = getStylePackV1(stylePackId);
  return PROFILES[pack.id] ?? PROFILES['modern-clean'];
}

// ---------------------------------------------------------------------------
// Helper: get gradient for a specific page role
// ---------------------------------------------------------------------------

export type PremiumPageRole =
  | 'cover'
  | 'guide'
  | 'menu'
  | 'learningObjectives'
  | 'starter'
  | 'material'
  | 'activity'
  | 'quiz'
  | 'reflection'
  | 'closing'
  | 'free';

/**
 * Resolve which gradient to use for a page role.
 * Cover/closing get hero treatment; material/quiz get calm treatment.
 */
export function getGradientForPageRole(
  profile: PremiumExportProfile,
  role: string,
): string {
  switch (role) {
    case 'cover':
      return profile.gradients.coverBg;
    case 'closing':
      return profile.gradients.closingBg;
    case 'material':
    case 'learningObjectives':
      return profile.gradients.materialBg;
    case 'quiz':
    case 'activity':
      return profile.gradients.quizBg;
    default:
      return profile.gradients.defaultBg;
  }
}

/**
 * Whether a page role should get the "hero" treatment
 * (big centered card, kicker pill, accent span, primary CTA).
 */
export function isHeroPageRole(role: string): boolean {
  return role === 'cover' || role === 'closing';
}

/**
 * Whether a page role should get the "award" treatment
 * (medal + shine + ribbon).
 */
export function isAwardPageRole(role: string): boolean {
  return role === 'closing';
}
