/**
 * Built-in style presets for silse-mpi-editor.
 *
 * Layer: core
 * Allowed imports: ./style-types
 *
 * Kontrak (Batch 2S):
 *   - 5 preset sesuai docs/STYLE_SCHEMA_CONTRACT.md section 7.
 *   - Setiap preset = StylePack dengan tokens lengkap + recipe placeholders kosong.
 *   - DEFAULT_STYLE_PACK dipakai oleh createProject (project factory).
 *
 * Recipe placeholders (componentRecipes, interactionRecipes, scoringRecipes)
 * saat ini objek kosong. Diisi konkret di M5/M6/M10.
 *
 * M12 (Style Studio) akan mengizinkan user bikin preset custom dan
 * save sebagai reusable asset. Untuk Batch 2S, preset hanya built-in.
 */

import type { InteractionRecipe, StylePack, VisualPresetId } from './style-types';

// Re-export VisualPresetIds for convenience (so tests/consumers can import
// from a single module).
export { VISUAL_PRESET_IDS, type VisualPresetId } from './style-types';

// ---------------------------------------------------------------------------
// Default interaction recipes (M5 — konkret)
//
// Bounds aman (kontrak Batch 5 Scope D):
//   - scale: maksimal 1.08
//   - durationMs: 80–500
// ---------------------------------------------------------------------------

const DEFAULT_INTERACTION_RECIPES: InteractionRecipe = {
  buttonHoverGrow: {
    scale: 1.05,
    durationMs: 150,
    easing: 'ease-out',
    shadowRole: 'soft',
  },
  buttonPress: {
    scale: 0.96,
    durationMs: 80,
    easing: 'ease-in',
    shadowRole: 'none',
  },
  focusRing: {
    durationMs: 120,
    easing: 'ease-out',
    shadowRole: 'medium',
    backgroundRole: 'primary',
  },
};

const EMPTY_RECIPES = {
  componentRecipes: {},
  interactionRecipes: DEFAULT_INTERACTION_RECIPES,
  scoringRecipes: {},
} as const;

export const CLEAN_CLASSROOM_PACK: StylePack = {
  id: 'cleanClassroom',
  name: 'Clean Classroom',
  description: 'Putih bersih, biru lembut, kontras baik. Cocok materi umum.',
  colors: {
    background: '#ffffff',
    surface: '#f9fafb',
    primary: '#2563eb',
    secondary: '#60a5fa',
    text: '#1f2937',
    mutedText: '#6b7280',
    border: '#d1d5db',
    success: '#16a34a',
    warning: '#d97706',
    danger: '#dc2626',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    titleSize: 48,
    subtitleSize: 28,
    bodySize: 18,
    smallSize: 14,
    lineHeight: 1.5,
  },
  spacing: {
    pagePadding: 64,
    componentGap: 16,
    cardPadding: 16,
  },
  radius: {
    small: 4,
    medium: 8,
    large: 16,
  },
  shadow: {
    none: 'none',
    soft: '0 1px 2px rgba(0,0,0,0.05)',
    medium: '0 4px 12px rgba(0,0,0,0.10)',
  },
  ...EMPTY_RECIPES,
};

export const CIVIC_WARM_PACK: StylePack = {
  id: 'civicWarm',
  name: 'Civic Warm',
  description: 'Warna hangat, formal tetapi ramah. Cocok PPKn/Pancasila.',
  colors: {
    background: '#fffbeb',
    surface: '#fef3c7',
    primary: '#b45309',
    secondary: '#f59e0b',
    text: '#451a03',
    mutedText: '#92400e',
    border: '#fcd34d',
    success: '#16a34a',
    warning: '#d97706',
    danger: '#dc2626',
  },
  typography: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    titleSize: 48,
    subtitleSize: 28,
    bodySize: 18,
    smallSize: 14,
    lineHeight: 1.5,
  },
  spacing: {
    pagePadding: 64,
    componentGap: 16,
    cardPadding: 20,
  },
  radius: {
    small: 4,
    medium: 8,
    large: 16,
  },
  shadow: {
    none: 'none',
    soft: '0 1px 2px rgba(180,83,9,0.10)',
    medium: '0 4px 12px rgba(180,83,9,0.18)',
  },
  ...EMPTY_RECIPES,
};

export const BRIGHT_KIDS_PACK: StylePack = {
  id: 'brightKids',
  name: 'Bright Kids',
  description: 'Cerah, cocok kelas bawah/SMP awal, tetap menjaga keterbacaan.',
  colors: {
    background: '#fefce8',
    surface: '#fef9c3',
    primary: '#7c3aed',
    secondary: '#ec4899',
    text: '#1e1b4b',
    mutedText: '#6366f1',
    border: '#fde68a',
    success: '#16a34a',
    warning: '#d97706',
    danger: '#dc2626',
  },
  typography: {
    fontFamily: '"Comic Sans MS", "Trebuchet MS", sans-serif',
    titleSize: 56,
    subtitleSize: 32,
    bodySize: 20,
    smallSize: 16,
    lineHeight: 1.6,
  },
  spacing: {
    pagePadding: 56,
    componentGap: 20,
    cardPadding: 20,
  },
  radius: {
    small: 8,
    medium: 16,
    large: 24,
  },
  shadow: {
    none: 'none',
    soft: '0 2px 4px rgba(124,58,237,0.15)',
    medium: '0 6px 16px rgba(124,58,237,0.22)',
  },
  ...EMPTY_RECIPES,
};

export const PROJECTOR_HIGH_CONTRAST_PACK: StylePack = {
  id: 'projectorHighContrast',
  name: 'Projector High Contrast',
  description: 'Kontras tinggi, font besar, cocok proyektor kelas.',
  colors: {
    background: '#000000',
    surface: '#1f1f1f',
    primary: '#fbbf24',
    secondary: '#fcd34d',
    text: '#ffffff',
    mutedText: '#d1d5db',
    border: '#fbbf24',
    success: '#22c55e',
    warning: '#fbbf24',
    danger: '#ef4444',
  },
  typography: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    titleSize: 64,
    subtitleSize: 36,
    bodySize: 24,
    smallSize: 18,
    lineHeight: 1.6,
  },
  spacing: {
    pagePadding: 80,
    componentGap: 24,
    cardPadding: 24,
  },
  radius: {
    small: 0,
    medium: 4,
    large: 8,
  },
  shadow: {
    none: 'none',
    soft: '0 0 0 2px #fbbf24',
    medium: '0 0 0 4px #fbbf24',
  },
  ...EMPTY_RECIPES,
};

export const MINIMAL_WORKSHEET_PACK: StylePack = {
  id: 'minimalWorksheet',
  name: 'Minimal Worksheet',
  description: 'Sederhana, cocok LKPD/interaksi ringan, tidak ramai.',
  colors: {
    background: '#ffffff',
    surface: '#ffffff',
    primary: '#374151',
    secondary: '#6b7280',
    text: '#111827',
    mutedText: '#6b7280',
    border: '#e5e7eb',
    success: '#16a34a',
    warning: '#d97706',
    danger: '#dc2626',
  },
  typography: {
    fontFamily: '"Courier New", monospace',
    titleSize: 32,
    subtitleSize: 24,
    bodySize: 16,
    smallSize: 13,
    lineHeight: 1.5,
  },
  spacing: {
    pagePadding: 48,
    componentGap: 12,
    cardPadding: 12,
  },
  radius: {
    small: 0,
    medium: 2,
    large: 4,
  },
  shadow: {
    none: 'none',
    soft: '0 1px 0 #e5e7eb',
    medium: '0 2px 4px rgba(0,0,0,0.08)',
  },
  ...EMPTY_RECIPES,
};

/**
 * Registry of built-in presets. M12 (Style Studio) akan memperkenalkan
 * preset custom — untuk Batch 2S, hanya built-in.
 */
export const BUILTIN_STYLE_PACKS: Record<VisualPresetId, StylePack> = {
  cleanClassroom: CLEAN_CLASSROOM_PACK,
  civicWarm: CIVIC_WARM_PACK,
  brightKids: BRIGHT_KIDS_PACK,
  projectorHighContrast: PROJECTOR_HIGH_CONTRAST_PACK,
  minimalWorksheet: MINIMAL_WORKSHEET_PACK,
};

/**
 * Default style pack for new projects.
 * Used by createProject in project-factory.ts.
 */
export const DEFAULT_STYLE_PACK: StylePack = CLEAN_CLASSROOM_PACK;

/**
 * Get a built-in style pack by id. Returns undefined if not found.
 */
export function getStylePack(id: string): StylePack | undefined {
  return BUILTIN_STYLE_PACKS[id as VisualPresetId];
}

/**
 * Convert a StylePack to ProjectStyle (snapshot of tokens).
 * Used by createProject to embed inline tokens into project.
 */
export function stylePackToProjectStyle(pack: StylePack): import('./style-types').ProjectStyle {
  return {
    stylePackId: pack.id,
    tokens: {
      colors: { ...pack.colors },
      typography: { ...pack.typography },
      spacing: { ...pack.spacing },
      radius: { ...pack.radius },
      shadow: { ...pack.shadow },
    },
  };
}
