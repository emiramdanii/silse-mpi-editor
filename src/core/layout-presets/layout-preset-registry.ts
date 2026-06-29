/**
 * Layout Preset Registry (LAYOUT-PRESET-SYSTEM-V1).
 *
 * Layer: core/layout-presets (pure data, no React/DOM)
 * Allowed imports: ../types
 *
 * Kontrak (LAYOUT-PRESET-SYSTEM-V1):
 *   8 layout preset siap pakai dengan ID ramah guru:
 *     - cover-centered       → Cover dengan judul di tengah.
 *     - cover-split          → Cover dengan judul kiri, visual kanan.
 *     - material-two-column  → Materi dua kolom (teks + visual).
 *     - material-card-stack  → Materi dengan kartu tersusun vertikal.
 *     - quiz-focus           → Kuis dengan pertanyaan besar di tengah.
 *     - reflection-calm      → Refleksi dengan box tenang di tengah.
 *     - mission-map          → Game/aktivitas besar di tengah.
 *     - closing-centered     → Penutup dengan rangkuman di tengah.
 *
 *   Prinsip:
 *     - Layout preset = susunan halaman (geometry only).
 *     - Tidak mengubah teks/objectives/jawaban kuis/urutan halaman.
 *     - Role-aware: setiap preset hanya cocok untuk role tertentu.
 *     - Unknown ID → fallback ke default preset berdasarkan page.role.
 *     - Semua posisi dalam area 16:9 (1280×720).
 */

import type { PageRole } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LayoutPresetId =
  | 'cover-centered'
  | 'cover-split'
  | 'material-two-column'
  | 'material-card-stack'
  | 'quiz-focus'
  | 'reflection-calm'
  | 'mission-map'
  | 'closing-centered';

export type LayoutPresetIntent =
  | 'cover'
  | 'material'
  | 'quiz'
  | 'reflection'
  | 'game'
  | 'closing';

export type LayoutPreset = {
  id: LayoutPresetId;
  name: string;
  description: string;
  supportedRoles: PageRole[];
  intent: LayoutPresetIntent;
};

// ---------------------------------------------------------------------------
// Registry — 8 layout presets
// ---------------------------------------------------------------------------

export const LAYOUT_PRESETS: readonly LayoutPreset[] = [
  {
    id: 'cover-centered',
    name: 'Cover Tengah',
    description: 'Judul dan subjudul di tengah halaman. Cocok untuk cover sederhana.',
    supportedRoles: ['cover'],
    intent: 'cover',
  },
  {
    id: 'cover-split',
    name: 'Cover Dua Kolom',
    description: 'Judul di kiri, visual (gambar/kartu) di kanan. Cocok untuk cover dengan ilustrasi.',
    supportedRoles: ['cover'],
    intent: 'cover',
  },
  {
    id: 'material-two-column',
    name: 'Materi Dua Kolom',
    description: 'Judul di atas, materi kiri, kartu/gambar kanan. Navigasi di kanan bawah.',
    supportedRoles: ['material', 'learningObjectives', 'menu', 'guide'],
    intent: 'material',
  },
  {
    id: 'material-card-stack',
    name: 'Materi Kartu Bertumpuk',
    description: 'Judul di atas, kartu tersusun vertikal di bawah. Navigasi di kanan bawah.',
    supportedRoles: ['material', 'learningObjectives', 'menu', 'guide'],
    intent: 'material',
  },
  {
    id: 'quiz-focus',
    name: 'Kuis Fokus',
    description: 'Pertanyaan besar di tengah. Navigasi di kanan bawah.',
    supportedRoles: ['quiz', 'starter'],
    intent: 'quiz',
  },
  {
    id: 'reflection-calm',
    name: 'Refleksi Tenang',
    description: 'Box refleksi di tengah dengan ruang lega. Navigasi di kanan bawah.',
    supportedRoles: ['reflection'],
    intent: 'reflection',
  },
  {
    id: 'mission-map',
    name: 'Peta Misi',
    description: 'Game/aktivitas besar di tengah. Navigasi di kanan bawah.',
    supportedRoles: ['activity'],
    intent: 'game',
  },
  {
    id: 'closing-centered',
    name: 'Penutup Tengah',
    description: 'Rangkuman/ucapan terima kasih di tengah.',
    supportedRoles: ['closing'],
    intent: 'closing',
  },
];

// ---------------------------------------------------------------------------
// Default preset mapping per role
// ---------------------------------------------------------------------------

const DEFAULT_PRESET_FOR_ROLE: Record<PageRole, LayoutPresetId> = {
  cover: 'cover-centered',
  guide: 'material-two-column',
  learningObjectives: 'material-two-column',
  menu: 'material-two-column',
  starter: 'quiz-focus',
  material: 'material-two-column',
  activity: 'mission-map',
  quiz: 'quiz-focus',
  reflection: 'reflection-calm',
  closing: 'closing-centered',
  free: 'material-two-column',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * List all layout presets.
 */
export function listLayoutPresets(): LayoutPreset[] {
  return [...LAYOUT_PRESETS];
}

/**
 * Get a layout preset by ID. Falls back to default preset for unknown IDs.
 */
export function getLayoutPreset(id?: string): LayoutPreset {
  if (!id) {
    return LAYOUT_PRESETS[0];
  }
  const found = LAYOUT_PRESETS.find((p) => p.id === id);
  if (found) return found;
  // Unknown ID → return first preset as fallback (caller should use
  // getDefaultLayoutPresetForRole for role-aware fallback).
  return LAYOUT_PRESETS[0];
}

/**
 * List layout presets that support a given page role.
 */
export function listLayoutPresetsForRole(role: PageRole): LayoutPreset[] {
  return LAYOUT_PRESETS.filter((p) => p.supportedRoles.includes(role));
}

/**
 * Get the default layout preset for a given page role.
 * Every PageRole has a default preset mapping.
 */
export function getDefaultLayoutPresetForRole(role: PageRole): LayoutPreset {
  const defaultId = DEFAULT_PRESET_FOR_ROLE[role] ?? 'material-two-column';
  const found = LAYOUT_PRESETS.find((p) => p.id === defaultId);
  return found ?? LAYOUT_PRESETS[0];
}

/**
 * Get the default layout preset ID for a given page role.
 */
export function getDefaultLayoutPresetIdForRole(role: PageRole): LayoutPresetId {
  return DEFAULT_PRESET_FOR_ROLE[role] ?? 'material-two-column';
}

/**
 * Check if a preset supports a given role.
 */
export function presetSupportsRole(presetId: string, role: PageRole): boolean {
  const preset = getLayoutPreset(presetId);
  return preset.supportedRoles.includes(role);
}
