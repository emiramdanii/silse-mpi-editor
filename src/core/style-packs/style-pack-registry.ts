/**
 * Style Pack Registry (STYLE-PACK-SYSTEM-V1).
 *
 * Layer: core/style-packs (pure data, no React/DOM)
 * Allowed imports: ../style-types, ../style-presets
 *
 * Kontrak (STYLE-PACK-SYSTEM-V1):
 *   Registry 3 style pack siap pakai dengan ID ramah guru:
 *     - modern-clean    → Clean, professional, high contrast.
 *     - soft-classroom  → Warm, friendly, soft pastel.
 *     - mission-dark    → Dark mode, bold, mission-oriented.
 *
 *   Prinsip:
 *     - Style pack = visual identity ONLY. Tidak membawa konten/materi/objectives.
 *     - Style pack tidak mengubah halaman/komponen/jawaban kuis.
 *     - Style pack konsisten editor-preview-export via resolver.
 *     - Unknown ID → fallback aman ke modern-clean.
 *
 *   Implementasi V1: thin layer di atas style-presets.ts (existing).
 *   Setiap StylePackIdV1 dipetakan ke StylePack existing yang paling cocok,
 *   dengan override tokens untuk mission-dark (dark background).
 */

import type { StylePack, StyleColors } from '../style-types';
import { getStylePack, CLEAN_CLASSROOM_PACK } from '../style-presets';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StylePackIdV1 = 'modern-clean' | 'soft-classroom' | 'mission-dark';

export type StylePackMood = 'clean' | 'soft' | 'mission';

export type StylePackComponentTone = {
  card: 'flat' | 'soft' | 'bold';
  button: 'clean' | 'rounded' | 'mission';
  quiz: 'calm' | 'playful' | 'mission';
  bridge: 'subtle' | 'strong';
};

export type StylePackV1 = {
  id: StylePackIdV1;
  name: string;
  description: string;
  mood: StylePackMood;
  /** ID StylePack existing yang jadi base. */
  baseStylePackId: string;
  /** Override tokens (applied on top of base). */
  tokenOverrides?: Partial<StyleColors>;
  componentTone: StylePackComponentTone;
};

// ---------------------------------------------------------------------------
// Registry — 3 style packs
// ---------------------------------------------------------------------------

export const STYLE_PACKS_V1: readonly StylePackV1[] = [
  {
    id: 'modern-clean',
    name: 'Modern Clean',
    description: 'Putih bersih, biru profesional, kontras tinggi. Cocok untuk semua mapel.',
    mood: 'clean',
    baseStylePackId: 'cleanClassroom',
    componentTone: {
      card: 'flat',
      button: 'clean',
      quiz: 'calm',
      bridge: 'subtle',
    },
  },
  {
    id: 'soft-classroom',
    name: 'Soft Classroom',
    description: 'Hangat, ramah, pastel lembut. Cocok untuk SD/SMP kelas rendah.',
    mood: 'soft',
    baseStylePackId: 'brightKids',
    componentTone: {
      card: 'soft',
      button: 'rounded',
      quiz: 'playful',
      bridge: 'subtle',
    },
  },
  {
    id: 'mission-dark',
    name: 'Mission Dark',
    description: 'Gelap, tegas, berani. Cocok untuk game/petualangan tema.',
    mood: 'mission',
    baseStylePackId: 'cleanClassroom',
    tokenOverrides: {
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      mutedText: '#94a3b8',
      primary: '#3b82f6',
      secondary: '#60a5fa',
      border: '#334155',
      success: '#22c55e',
      warning: '#f59e0b',
      danger: '#ef4444',
    },
    componentTone: {
      card: 'bold',
      button: 'mission',
      quiz: 'mission',
      bridge: 'strong',
    },
  },
];

export const DEFAULT_STYLE_PACK_ID_V1: StylePackIdV1 = 'modern-clean';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Get StylePackV1 metadata by ID. Falls back to modern-clean for unknown IDs.
 */
export function getStylePackV1(id?: string): StylePackV1 {
  if (!id) return STYLE_PACKS_V1[0];
  const found = STYLE_PACKS_V1.find((p) => p.id === id);
  return found ?? STYLE_PACKS_V1[0];
}

/**
 * List all V1 style packs.
 */
export function listStylePacksV1(): StylePackV1[] {
  return [...STYLE_PACKS_V1];
}

/**
 * Resolve a V1 style pack to a concrete StylePack (with tokens).
 * Applies tokenOverrides on top of the base StylePack.
 * Pure function — does not mutate base.
 */
export function resolveStylePackV1(id?: string): StylePack {
  const v1 = getStylePackV1(id);
  const base = getStylePack(v1.baseStylePackId) ?? CLEAN_CLASSROOM_PACK;

  // If no overrides, return base as-is (still same reference, but that's fine —
  // style-presets packs are immutable data).
  if (!v1.tokenOverrides) {
    return base;
  }

  // Apply overrides — create new StylePack object with merged colors.
  return {
    ...base,
    colors: {
      ...base.colors,
      ...v1.tokenOverrides,
    },
  };
}

/**
 * Get the StylePackIdV1 from a project's stylePackId field.
 * Handles both V1 IDs (modern-clean, etc.) and legacy IDs (cleanClassroom, etc.).
 * Falls back to modern-clean for unknown/null.
 */
export function getProjectStylePackIdV1(stylePackId?: string): StylePackIdV1 {
  if (!stylePackId) return DEFAULT_STYLE_PACK_ID_V1;
  // Direct V1 match.
  const v1Match = STYLE_PACKS_V1.find((p) => p.id === stylePackId);
  if (v1Match) return v1Match.id;
  // Legacy mapping: cleanClassroom → modern-clean, brightKids → soft-classroom.
  if (stylePackId === 'cleanClassroom') return 'modern-clean';
  if (stylePackId === 'brightKids') return 'soft-classroom';
  // Default fallback.
  return DEFAULT_STYLE_PACK_ID_V1;
}
