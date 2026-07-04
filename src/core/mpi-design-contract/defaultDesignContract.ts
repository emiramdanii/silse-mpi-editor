/**
 * Default Design Contract (MPI-DESIGN-CONTRACT-01).
 *
 * Layer: core/mpi-design-contract (pure data, no React/DOM)
 * Allowed imports: ./types
 *
 * Kontrak:
 *   Default design contract dengan token reasonable untuk semua 16 categories.
 *   Tidak ada CSS premium baru. Hanya data token yang renderer bisa baca.
 */

import type { MpiDesignContract, DesignContractId } from './types';

// ---------------------------------------------------------------------------
// Default contract
// ---------------------------------------------------------------------------

export const DEFAULT_DESIGN_CONTRACT_ID: DesignContractId = 'default';

export const DEFAULT_DESIGN_CONTRACT: MpiDesignContract = {
  id: 'default',
  name: 'Default Design Contract',
  description: 'Reasonable defaults for all 16 design token categories. No premium polish.',

  frame: {
    width: 1280,
    height: 720,
    aspectRatio: '16/9',
    safeArea: { top: 60, right: 32, bottom: 32, left: 32 },
    stageRadius: 16,
    overflow: 'hidden',
    exportScale: 1,
  },

  palette: {
    primary: '#1d3557',
    secondary: '#457b9d',
    accent: '#e63946',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1f2937',
    mutedText: '#6b7280',
    border: '#e5e7eb',
    success: '#16a34a',
    warning: '#f59e0b',
    danger: '#dc2626',
    gold: '#fbbf24',
  },

  background: {
    pattern: 'solid',
    color: '#ffffff',
  },

  typography: {
    // FONT-EDU-SAFETY-01: max 2-3 distinct font family tokens.
    // heroFont: Trebuchet MS (title) + Segoe UI fallback.
    // bodyFont: Segoe UI (body) + Arial fallback.
    // Distinct named families: Trebuchet MS, Segoe UI, Arial = 3 tokens (within max 3).
    heroFont: "'Trebuchet MS', 'Segoe UI', Arial, sans-serif",
    bodyFont: "'Segoe UI', Arial, sans-serif",
    // FONT-EDU-SAFETY-01: title 28-44px safe range for projector 16:9
    titleSize: 44,
    subtitleSize: 20,
    bodySize: 16,
    labelSize: 13,
    titleWeight: 700,
    bodyWeight: 400,
    lineHeight: 1.5,
    letterSpacing: -0.01,
    uppercase: false,
  },

  card: {
    background: '#ffffff',
    radius: 12,
    padding: 16,
    border: '1px solid #e5e7eb',
    shadow: '0 2px 8px rgba(0,0,0,0.06)',
    glassEffect: false,
  },

  button: {
    primary: {
      variant: 'primary',
      background: '#1d3557',
      color: '#ffffff',
      radius: 8,
      padding: { top: 10, right: 20, bottom: 10, left: 20 },
      fontWeight: 600,
      shadow: '0 1px 2px rgba(0,0,0,0.1)',
      hover: { transform: 'translateY(-1px)' },
      active: { transform: 'translateY(0)' },
      disabled: { opacity: 0.5 },
      iconPosition: 'right',
    },
    secondary: {
      variant: 'secondary',
      background: '#f1f5f9',
      color: '#1d3557',
      radius: 8,
      padding: { top: 10, right: 20, bottom: 10, left: 20 },
      fontWeight: 600,
      shadow: 'none',
      iconPosition: 'left',
    },
    ghost: {
      variant: 'ghost',
      background: 'transparent',
      color: '#1d3557',
      radius: 8,
      padding: { top: 8, right: 16, bottom: 8, left: 16 },
      fontWeight: 500,
      shadow: 'none',
      iconPosition: 'none',
    },
    mission: {
      variant: 'mission',
      background: '#1d3557',
      color: '#ffffff',
      radius: 6,
      padding: { top: 10, right: 20, bottom: 10, left: 20 },
      fontWeight: 700,
      shadow: '0 0 12px rgba(29,53,87,0.3)',
      iconPosition: 'right',
    },
    gold: {
      variant: 'gold',
      background: '#fbbf24',
      color: '#1d3557',
      radius: 999,
      padding: { top: 8, right: 18, bottom: 8, left: 18 },
      fontWeight: 700,
      shadow: '0 2px 6px rgba(251,191,36,0.3)',
      iconPosition: 'left',
    },
  },

  badge: {
    background: '#fbbf24',
    color: '#1d3557',
    radius: 999,
    border: 'none',
    size: 'md',
    placement: 'inline',
  },

  navigation: {
    toolbarStyle: 'floating-glass',
    pageIndicator: { style: 'pills', color: '#6b7280', activeColor: '#1d3557' },
    progressPill: { background: '#e5e7eb', activeBackground: '#1d3557' },
  },

  quiz: {
    choiceLetterBadge: { background: '#1d3557', color: '#ffffff', radius: 8, size: 32 },
    selectedState: { background: '#dbeafe', borderColor: '#2563eb' },
    correctState: { background: '#d1fae5', borderColor: '#16a34a' },
    wrongState: { background: '#fee2e2', borderColor: '#dc2626' },
    scoreDisplay: { background: '#fbbf24', color: '#1d3557', radius: 999 },
  },

  game: {
    briefingPanel: { background: '#fffbeb', radius: 10, padding: 12, border: '1px solid #fde68a', shadow: 'none', glassEffect: false },
    targetPanel: { background: '#eff6ff', radius: 10, padding: 12, border: '1px solid #bfdbfe', shadow: 'none', glassEffect: false },
    actionCardGrid: { columns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 },
    actionCardStyle: { background: '#ffffff', radius: 12, padding: 14, border: '2px solid #d1d5db', shadow: 'none', glassEffect: false },
    selectedAction: { background: '#dbeafe', borderColor: '#2563eb' },
    correctState: { background: '#d1fae5', borderColor: '#16a34a' },
    wrongState: { background: '#fee2e2', borderColor: '#dc2626' },
    feedbackPanel: { background: '#f8fafc', radius: 10, padding: 12, border: '1px solid #e5e7eb', shadow: 'none', glassEffect: false },
    rewardBadge: { background: '#fffbeb', color: '#92400e', radius: 12, icon: '🏅' },
    missionProgress: { style: 'pills', color: '#6b7280' },
  },

  learning: {
    explanationPanel: { background: '#ffffff', radius: 12, padding: 16, border: '1px solid #e5e7eb', shadow: 'none', glassEffect: false },
    exampleCardStyle: { background: '#f8fafc', radius: 12, padding: 16, border: '1px solid #e5e7eb', shadow: 'none', glassEffect: false },
    exampleGridColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    keyPointPanel: { background: '#fffbeb', radius: 10, padding: 12, border: '1px solid #fde68a', accentColor: '#f59e0b', iconColor: '#92400e', icon: '🔑', glassEffect: false, shadow: 'none' },
    studentActionPanel: { background: '#f8fafc', radius: 10, padding: 12, border: '2px solid #1d3557', icon: '✏️', iconColor: '#1d3557', labelColor: '#6b7280', glassEffect: false, shadow: 'none' },
    visualHintPanel: { color: '#6b7280', fontStyle: 'italic', icon: '💡' },
  },

  feedback: {
    correct: { variant: 'correct', icon: '✓', color: '#065f46', background: '#d1fae5', borderColor: '#16a34a', motionPreset: 'correct-burst' },
    wrong: { variant: 'wrong', icon: '✗', color: '#991b1b', background: '#fee2e2', borderColor: '#dc2626', motionPreset: 'none' },
    neutral: { variant: 'neutral', icon: '•', color: '#1f2937', background: '#f3f4f6', borderColor: '#d1d5db', motionPreset: 'none' },
    warning: { variant: 'warning', icon: '!', color: '#92400e', background: '#fef3c7', borderColor: '#f59e0b', motionPreset: 'none' },
  },

  reward: {
    medal: { background: 'linear-gradient(145deg, #fff8e7, #fff)', borderColor: '#fbbf24', radius: 999, size: 200, icon: '🏆' },
    ribbon: { background: '#e63946', color: '#ffffff', radius: 999 },
    certificatePanel: { background: '#ffffff', radius: 16, padding: 24, border: '2px solid #fbbf24', shadow: '0 4px 12px rgba(0,0,0,0.1)', glassEffect: false },
    completionMessage: { fontSize: 24, fontWeight: 700, color: '#1d3557' },
  },

  mapHotspot: {
    mapBackground: '#f0f9ff',
    hotspotColor: '#1d3557',
    activeState: { borderColor: '#e63946', boxShadow: '0 0 0 4px rgba(230,57,70,0.2)' },
    completedState: { background: '#d1fae5', icon: '✓' },
  },

  motion: {
    none: { animation: 'none', duration: 0, easing: 'ease' },
    'soft-fade': { animation: 'silse-fade-in', duration: 220, easing: 'ease-out' },
    'slide-up': { animation: 'silse-slide-up', duration: 260, easing: 'ease-out' },
    'pulse': { animation: 'silse-pulse', duration: 2000, easing: 'ease-in-out' },
    'reward-pop': { animation: 'silse-reward-pop', duration: 400, easing: 'ease-out' },
    'correct-burst': { animation: 'silse-correct-burst', duration: 600, easing: 'ease-out' },
  },
};

// ---------------------------------------------------------------------------
// Contract registry (3 style packs + default)
// ---------------------------------------------------------------------------

export const DESIGN_CONTRACTS: Record<DesignContractId, MpiDesignContract> = {
  default: DEFAULT_DESIGN_CONTRACT,
  'modern-clean': {
    ...DEFAULT_DESIGN_CONTRACT,
    id: 'modern-clean',
    name: 'Modern Clean',
    description: 'Navy + crimson + gold. Clean professional.',
    palette: {
      ...DEFAULT_DESIGN_CONTRACT.palette,
      primary: '#1d3557',
      secondary: '#457b9d',
      accent: '#e63946',
      gold: '#fbbf24',
    },
  },
  'soft-classroom': {
    ...DEFAULT_DESIGN_CONTRACT,
    id: 'soft-classroom',
    name: 'Soft Classroom',
    description: 'Cream + warm peach + honey gold. Warm friendly.',
    palette: {
      ...DEFAULT_DESIGN_CONTRACT.palette,
      primary: '#7a5a3f',
      secondary: '#f4a261',
      accent: '#e76f51',
      background: '#fff8f0',
      surface: '#fff3e0',
      gold: '#ffd166',
    },
  },
  'mission-dark': {
    ...DEFAULT_DESIGN_CONTRACT,
    id: 'mission-dark',
    name: 'Mission Dark',
    description: 'Deep navy + signal red + gold. Mission serious.',
    palette: {
      ...DEFAULT_DESIGN_CONTRACT.palette,
      primary: '#0d243d',
      secondary: '#1d3557',
      accent: '#e63946',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      mutedText: '#94a3b8',
      gold: '#fbbf24',
    },
  },
  // GOLDEN-REFERENCE-RENDER-P1: Contract yang mengekstrak rasa visual dari reference HTML
  'golden-reference': {
    ...DEFAULT_DESIGN_CONTRACT,
    id: 'golden-reference',
    name: 'Golden Reference',
    description: 'Dark navy + cyan/yellow/red/purple/green/orange accents. Extracted from pertemuan2 reference.',
    palette: {
      ...DEFAULT_DESIGN_CONTRACT.palette,
      primary: '#0e1c2f',
      secondary: '#13243a',
      accent: '#f9c12e',
      background: '#0e1c2f',
      surface: '#182d45',
      text: '#e8f2ff',
      mutedText: '#6e90b5',
      border: 'rgba(255,255,255,0.09)',
      success: '#34d399',
      warning: '#f9c12e',
      danger: '#ff6b6b',
      gold: '#f9c12e',
    },
    background: {
      ...DEFAULT_DESIGN_CONTRACT.background,
      pattern: 'solid',
      color: '#0e1c2f',
    },
    typography: {
      ...DEFAULT_DESIGN_CONTRACT.typography,
      // FONT-EDU-SAFETY-01: replaced the old decorative display font + cursive
      // fallback (forbidden by education-friendly typography guard) with the
      // same clean sans-serif heroFont as the default contract. Mission mood
      // is conveyed via dark palette + bold weight, not decorative font.
      heroFont: "'Trebuchet MS', 'Segoe UI', Arial, sans-serif",
      bodyFont: "'Segoe UI', Arial, sans-serif",
      titleSize: 42,
      // VISUAL-QUALITY-GUARD: heading weight >= 600
      titleWeight: 700,
      bodyWeight: 700,
    },
    card: {
      ...DEFAULT_DESIGN_CONTRACT.card,
      background: '#182d45',
      radius: 16,
      padding: 20,
      border: '1px solid rgba(255,255,255,0.09)',
      shadow: 'none',
      glassEffect: false,
    },
    button: {
      ...DEFAULT_DESIGN_CONTRACT.button,
      primary: { ...DEFAULT_DESIGN_CONTRACT.button.primary, background: '#f9c12e', color: '#0e1c2f', radius: 999, fontWeight: 800 },
      secondary: { ...DEFAULT_DESIGN_CONTRACT.button.secondary, background: '#3ecfcf', color: '#0e1c2f', radius: 999 },
      gold: { ...DEFAULT_DESIGN_CONTRACT.button.gold, background: '#f9c12e', color: '#0e1c2f', radius: 999 },
    },
    badge: {
      ...DEFAULT_DESIGN_CONTRACT.badge,
      background: 'rgba(167,139,250,0.15)',
      color: '#a78bfa',
      radius: 999,
    },
    learning: {
      ...DEFAULT_DESIGN_CONTRACT.learning,
      keyPointPanel: { background: 'rgba(249,193,46,0.06)', radius: 13, padding: 16, border: '1px solid rgba(249,193,46,0.2)', accentColor: '#f9c12e', iconColor: '#f9c12e', icon: '🔑', glassEffect: false, shadow: 'none' },
      studentActionPanel: { background: '#182d45', radius: 13, padding: 16, border: '1px solid rgba(255,255,255,0.09)', icon: '✏️', iconColor: '#3ecfcf', labelColor: '#6e90b5', glassEffect: false, shadow: 'none' },
      visualHintPanel: { color: '#6e90b5', fontStyle: 'italic', icon: '💡' },
      explanationPanel: { background: '#182d45', radius: 16, padding: 20, border: '1px solid rgba(255,255,255,0.09)', glassEffect: false, shadow: 'none' },
      exampleCardStyle: { background: '#182d45', radius: 16, padding: 20, border: '1px solid rgba(255,255,255,0.09)', glassEffect: false, shadow: 'none' },
    },
    game: {
      ...DEFAULT_DESIGN_CONTRACT.game,
      briefingPanel: { background: 'rgba(62,207,207,0.07)', radius: 13, padding: 16, border: '1px solid rgba(62,207,207,0.25)', glassEffect: false, shadow: 'none' },
      targetPanel: { background: 'rgba(167,139,250,0.07)', radius: 13, padding: 16, border: '1px solid rgba(167,139,250,0.25)', glassEffect: false, shadow: 'none' },
    },
    feedback: {
      correct: { variant: 'correct', icon: '✓', color: '#34d399', background: 'rgba(52,211,153,0.07)', borderColor: '#34d399', motionPreset: 'none' },
      wrong: { variant: 'wrong', icon: '✗', color: '#ff6b6b', background: 'rgba(255,107,107,0.07)', borderColor: '#ff6b6b', motionPreset: 'none' },
      neutral: { variant: 'neutral', icon: '•', color: '#6e90b5', background: 'rgba(255,255,255,0.04)', borderColor: '#6e90b5', motionPreset: 'none' },
      warning: { variant: 'warning', icon: '!', color: '#f9c12e', background: 'rgba(249,193,46,0.07)', borderColor: '#f9c12e', motionPreset: 'none' },
    },
    reward: {
      ...DEFAULT_DESIGN_CONTRACT.reward,
      medal: { background: 'linear-gradient(145deg, #fff8e7, #fff)', borderColor: '#f9c12e', radius: 999, size: 200, icon: '🏆' },
      ribbon: { background: '#ff6b6b', color: '#fff', radius: 999 },
    },
  },
};

export function getDesignContract(id?: DesignContractId): MpiDesignContract {
  if (!id) return DEFAULT_DESIGN_CONTRACT;
  return DESIGN_CONTRACTS[id] ?? DEFAULT_DESIGN_CONTRACT;
}

/**
 * STYLE-PARITY-01: Get design contract dengan project.style.tokens overrides applied.
 *
 * Problem sebelumnya: CanvasStage pakai getDesignContract(stylePackId) yang
 * TIDAK baca project.style.tokens. Akibatnya, AI overrides (yang sudah di-apply
 * ke project.style.tokens oleh aiBlueprintToSimpleProject) diabaikan di editor.
 * Editor tampil dengan style LAMA, export tampil dengan style BARU → parity broken.
 *
 * Solution: helper ini merge base contract dengan project.style.tokens overrides.
 * CanvasStage & PreviewApp pakai helper ini, export-html sudah baca project.style
 * langsung via generateCssVariablesMap.
 */
export function getDesignContractWithProjectStyle(
  stylePackId: string | undefined,
  projectStyle?: { tokens?: {
    colors?: Record<string, string>;
    typography?: Record<string, unknown>;
    spacing?: Record<string, number>;
    radius?: Record<string, number>;
    shadow?: Record<string, string>;
  } } | null,
): MpiDesignContract {
  const base = getDesignContract(stylePackId as DesignContractId);
  if (!projectStyle?.tokens) return base;

  const { colors, typography, spacing, radius } = projectStyle.tokens;

  return {
    ...base,
    palette: colors ? {
      ...base.palette,
      primary: colors.primary ?? base.palette.primary,
      secondary: colors.secondary ?? base.palette.secondary,
      background: colors.background ?? base.palette.background,
      surface: colors.surface ?? base.palette.surface,
      text: colors.text ?? base.palette.text,
      mutedText: colors.mutedText ?? base.palette.mutedText,
      border: colors.border ?? base.palette.border,
      success: colors.success ?? base.palette.success,
      warning: colors.warning ?? base.palette.warning,
      danger: colors.danger ?? base.palette.danger,
    } : base.palette,
    typography: typography ? {
      ...base.typography,
      // ProjectStyle.tokens.typography uses fontFamily (single), DesignTypography uses heroFont + bodyFont (separate).
      // AI override "typography.fontFamily" applies to BOTH heroFont + bodyFont.
      heroFont: (typography.heroFont as string) ?? (typography.fontFamily as string) ?? base.typography.heroFont,
      bodyFont: (typography.bodyFont as string) ?? (typography.fontFamily as string) ?? base.typography.bodyFont,
      titleSize: (typography.titleSize as number) ?? base.typography.titleSize,
      subtitleSize: (typography.subtitleSize as number) ?? base.typography.subtitleSize,
      bodySize: (typography.bodySize as number) ?? base.typography.bodySize,
      labelSize: (typography.labelSize as number) ?? base.typography.labelSize,
      titleWeight: (typography.titleWeight as number) ?? base.typography.titleWeight,
      bodyWeight: (typography.bodyWeight as number) ?? base.typography.bodyWeight,
      lineHeight: (typography.lineHeight as number) ?? base.typography.lineHeight,
      letterSpacing: (typography.letterSpacing as number) ?? base.typography.letterSpacing,
      uppercase: (typography.uppercase as boolean) ?? base.typography.uppercase,
    } : base.typography,
    card: {
      ...base.card,
      radius: radius?.medium ?? base.card.radius,
      padding: spacing?.cardPadding ?? base.card.padding,
    },
  };
}
