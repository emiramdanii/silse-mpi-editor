/**
 * Silent Failure Handler (C-03).
 *
 * Layer: core/ai-mpi-json (pure function, no React/DOM)
 *
 * Kontrak:
 *   Saat AI import menghasilkan elemen yang tidak dikenali (unknown sceneType,
 *   unknown content kind, missing required field), handler ini:
 *     1. Catat ke log (warnings array)
 *     2. Return ke caller supaya bisa ditampilkan ke user
 *     3. TIDAK diam-diam hilangkan — user harus tahu apa yang di-skip
 *
 *   Prinsip:
 *     - Pure function, no DOM, no React, no store.
 *     - Non-blocking: warnings tidak menghentikan import, hanya informasi.
 *     - Human-readable: pesan dalam Bahasa Indonesia, ramah guru.
 */

export type ImportWarning = {
  sceneId?: string;
  field: string;
  message: string;
  /** Severity: 'warn' = di-skip tapi tidak fatal, 'error' = fatal (import gagal) */
  severity: 'warn' | 'error';
};

export type ImportResult = {
  warnings: ImportWarning[];
  /** Count of elements that were silently skipped */
  skippedCount: number;
};

/**
 * Known scene types (dari schema.ts AiBlueprintSceneType).
 * Jika AI kirim sceneType yang tidak ada di list ini → warning.
 */
export const KNOWN_SCENE_TYPES = [
  'cover-hero', 'guide-panel', 'objectives-path', 'starter-question',
  'learning-scene', 'mission-map', 'game-mission', 'quiz-challenge',
  'reflection-journal', 'closing-award',
  'curriculum-guide', 'starter-review', 'discussion-scene',
  'case-analysis', 'result-summary', 'classification-game',
  'hotspot-map', 'matching-game', 'sequencing-game', 'media-focus',
  'diagnostic-check', 'remedial-practice', 'enrichment-challenge',
  'worksheet-activity', 'rubric-panel', 'timeline-story',
  'branching-scenario', 'glossary-cards', 'teacher-guide', 'accessibility-help',
] as const;

/**
 * Known content kinds (dari schema.ts AiBlueprintSlotContent).
 * Jika AI kirim content.kind yang tidak ada di list ini → warning.
 */
export const KNOWN_CONTENT_KINDS = [
  'text', 'card', 'image', 'button', 'badge',
  'game-mission', 'quiz-question', 'learning-material', 'feedback',
  'cover-hero', 'closing-award', 'reward', 'navigation',
  'classification-game', 'curriculum-guide', 'objectives-path',
  'starter-review', 'discussion-scene', 'case-analysis', 'result-summary',
  'reflection-journal', 'hotspot-map', 'matching-game', 'sequencing-game',
  'media-focus', 'diagnostic-check', 'remedial-practice',
  'enrichment-challenge', 'worksheet-activity', 'rubric-panel',
  'timeline-story', 'branching-scenario', 'glossary-cards',
  'teacher-guide', 'accessibility-help',
] as const;

/**
 * Check if a sceneType is known.
 */
export function isKnownSceneType(sceneType: string): boolean {
  return (KNOWN_SCENE_TYPES as readonly string[]).includes(sceneType);
}

/**
 * Check if a content kind is known.
 */
export function isKnownContentKind(kind: string): boolean {
  return (KNOWN_CONTENT_KINDS as readonly string[]).includes(kind);
}

/**
 * Collect warnings from a raw AI blueprint input.
 * Returns warnings array — empty if everything is recognized.
 *
 * This is called AFTER validation passes (structure is valid) but BEFORE
 * normalization (to catch semantic issues validator might miss).
 */
export function collectImportWarnings(raw: unknown): ImportWarning[] {
  const warnings: ImportWarning[] = [];

  if (!raw || typeof raw !== 'object') return warnings;
  const blueprint = raw as Record<string, unknown>;
  const scenes = blueprint.scenes;
  if (!Array.isArray(scenes)) return warnings;

  scenes.forEach((scene, i) => {
    if (!scene || typeof scene !== 'object') return;
    const s = scene as Record<string, unknown>;
    const sceneId = (s.id as string) || `scene-${i + 1}`;
    const sceneType = s.sceneType as string;

    // Check sceneType
    if (sceneType && !isKnownSceneType(sceneType)) {
      warnings.push({
        sceneId,
        field: 'sceneType',
        message: `Jenis halaman "${sceneType}" tidak dikenali. Halaman ini mungkin tidak tampil sempurna.`,
        severity: 'warn',
      });
    }

    // Check slots
    const slots = s.slots;
    if (Array.isArray(slots)) {
      slots.forEach((slot, j) => {
        if (!slot || typeof slot !== 'object') return;
        const sl = slot as Record<string, unknown>;
        const content = sl.content;
        if (content && typeof content === 'object') {
          const c = content as Record<string, unknown>;
          const kind = c.kind as string;
          if (kind && !isKnownContentKind(kind)) {
            warnings.push({
              sceneId,
              field: `slots[${j}].content.kind`,
              message: `Jenis konten "${kind}" pada halaman "${sceneId}" tidak dikenali. Konten ini akan ditampilkan sebagai teks biasa.`,
              severity: 'warn',
            });
          }
        }
      });
    }
  });

  return warnings;
}

/**
 * Format warnings for display in UI.
 * Returns array of human-readable strings (Bahasa Indonesia).
 */
export function formatImportWarnings(warnings: ImportWarning[]): string[] {
  return warnings.map((w) => {
    const prefix = w.sceneId ? `[${w.sceneId}] ` : '';
    return `${prefix}${w.message}`;
  });
}
