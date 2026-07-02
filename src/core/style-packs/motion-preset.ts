/**
 * Motion Preset System (MOTION-PRESET-01).
 *
 * Layer: core/style-packs (pure function, no React/DOM)
 * Allowed imports: ../mpi-design-contract
 *
 * Kontrak:
 *   Controlled premium motion — light, scoped, never distracting.
 *   Resolves a DesignMotionPreset (from contract.motion) to a stable CSS
 *   class name that composers and the HTML exporter can attach.
 *
 *   Prinsip (dari senior reviewer spec):
 *     - hover lift, card transition, fade/slide entrance, feedback pop
 *     - prefers-reduced-motion MUST disable all motion
 *     - export parity (editor CSS === export CSS)
 *     - NO new library (no framer-motion, no GSAP)
 *     - NO new scene type
 *     - NO heavy schema (uses existing contract.motion preset names)
 *
 *   Naming convention:
 *     All motion CSS classes are prefixed `silse-motion-` so they can be
 *     enumerated, audited, and disabled wholesale under prefers-reduced-motion.
 */

import type { DesignMotionPreset } from '../mpi-design-contract';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Mapping from a DesignMotionPreset to the CSS class that implements it. */
export type MotionPresetClassMap = Record<DesignMotionPreset, string>;

export type MotionPresetProfile = {
  /** Class to apply for the preset (e.g. on a feedback block, card, panel). */
  classForPreset: MotionPresetClassMap;
  /** Class to apply for hover-lift on cards / buttons / chips. */
  hoverLiftClass: string;
  /** Class to apply for entrance fade (e.g. on a freshly-rendered scene panel). */
  entranceFadeClass: string;
  /** Class to apply for entrance slide-up (e.g. on a freshly-rendered scene header). */
  entranceSlideUpClass: string;
  /** Class to apply for feedback pop on correct/wrong reveal. */
  feedbackPopClass: string;
};

// ---------------------------------------------------------------------------
// Default profile — stable class names, no per-style-pack variation
// ---------------------------------------------------------------------------

export const DEFAULT_MOTION_PROFILE: MotionPresetProfile = {
  classForPreset: {
    'none': '',
    'soft-fade': 'silse-motion-soft-fade',
    'slide-up': 'silse-motion-slide-up',
    'pulse': 'silse-motion-pulse',
    'reward-pop': 'silse-motion-reward-pop',
    'correct-burst': 'silse-motion-correct-burst',
  },
  hoverLiftClass: 'silse-motion-hover-lift',
  entranceFadeClass: 'silse-motion-entrance-fade',
  entranceSlideUpClass: 'silse-motion-entrance-slide-up',
  feedbackPopClass: 'silse-motion-feedback-pop',
};

// ---------------------------------------------------------------------------
// Resolver
// ---------------------------------------------------------------------------

/**
 * Resolve a DesignMotionPreset to its CSS class name.
 * Returns '' for 'none' or unknown presets (defensive — never throws).
 */
export function resolveMotionPresetClass(
  preset: DesignMotionPreset | string | undefined,
  profile: MotionPresetProfile = DEFAULT_MOTION_PROFILE,
): string {
  if (!preset) return '';
  if (preset === 'none') return '';
  return profile.classForPreset[preset as DesignMotionPreset] ?? '';
}

/**
 * Resolve a complete motion profile for a contract.
 * Future-proof: if a contract opts out of motion (e.g. by overriding
 * preset names to 'none'), this still returns the right classes per-preset.
 *
 * NOTE: contract.motion is intentionally NOT used to generate CSS at runtime
 * (we use stable class names so export can inline them as a static string).
 * contract.motion provides the *intended* animation/duration/easing — but the
 * actual keyframes live in styles.css + the export HTML's <style> block.
 */
export function resolveMotionProfile(): MotionPresetProfile {
  return DEFAULT_MOTION_PROFILE;
}

// ---------------------------------------------------------------------------
// Audit helper — return all motion class names so export/CSS can verify parity
// ---------------------------------------------------------------------------

export function getAllMotionClassNames(profile: MotionPresetProfile = DEFAULT_MOTION_PROFILE): string[] {
  const all: string[] = [
    profile.hoverLiftClass,
    profile.entranceFadeClass,
    profile.entranceSlideUpClass,
    profile.feedbackPopClass,
  ];
  for (const key of Object.keys(profile.classForPreset) as DesignMotionPreset[]) {
    const cls = profile.classForPreset[key];
    if (cls) all.push(cls);
  }
  return [...new Set(all)];
}

/**
 * Return the full CSS block that implements all motion presets.
 * Used by export-html.ts to inline motion CSS into the standalone HTML,
 * guaranteeing editor/export parity without a separate stylesheet.
 *
 * Pure string builder, no DOM access.
 */
export function buildMotionPresetCss(): string {
  return `
/* === MOTION-PRESET-01 — controlled premium motion === */

/* 1. Entrance fade — 220ms */
@keyframes silse-motion-entrance-fade-kf {
  from { opacity: 0; }
  to { opacity: 1; }
}
.silse-motion-entrance-fade {
  animation: silse-motion-entrance-fade-kf 220ms ease-out;
}

/* 2. Entrance slide-up — 260ms, 6px */
@keyframes silse-motion-entrance-slide-up-kf {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.silse-motion-entrance-slide-up {
  animation: silse-motion-entrance-slide-up-kf 260ms ease-out;
}

/* 3. Hover lift — transition, not keyframe. 1px translate + shadow. */
.silse-motion-hover-lift {
  transition: transform 160ms ease-out, box-shadow 160ms ease-out;
}
.silse-motion-hover-lift:hover {
  transform: translateY(-2px);
}

/* 4. Soft fade — 220ms */
@keyframes silse-motion-soft-fade-kf {
  from { opacity: 0; }
  to { opacity: 1; }
}
.silse-motion-soft-fade {
  animation: silse-motion-soft-fade-kf 220ms ease-out;
}

/* 5. Slide up — 260ms (re-uses entrance slide-up keyframe shape, separate name for clarity) */
@keyframes silse-motion-slide-up-kf {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.silse-motion-slide-up {
  animation: silse-motion-slide-up-kf 260ms ease-out;
}

/* 6. Pulse — 2000ms, subtle. Used for mission-game emphasis. */
@keyframes silse-motion-pulse-kf {
  0%, 100% { box-shadow: 0 0 0 0 rgba(249, 193, 46, 0.0); }
  50% { box-shadow: 0 0 0 6px rgba(249, 193, 46, 0.18); }
}
.silse-motion-pulse {
  animation: silse-motion-pulse-kf 2000ms ease-in-out infinite;
}

/* 7. Reward pop — 400ms, scale + fade */
@keyframes silse-motion-reward-pop-kf {
  0% { opacity: 0; transform: scale(0.85); }
  60% { opacity: 1; transform: scale(1.04); }
  100% { transform: scale(1); }
}
.silse-motion-reward-pop {
  animation: silse-motion-reward-pop-kf 400ms ease-out;
}

/* 8. Correct burst — 600ms, ring expansion */
@keyframes silse-motion-correct-burst-kf {
  0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.55); }
  100% { box-shadow: 0 0 0 14px rgba(34, 197, 94, 0); }
}
.silse-motion-correct-burst {
  animation: silse-motion-correct-burst-kf 600ms ease-out;
}

/* 9. Feedback pop — 200ms, gentle translate + fade */
@keyframes silse-motion-feedback-pop-kf {
  from { opacity: 0; transform: translateY(-2px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.silse-motion-feedback-pop {
  animation: silse-motion-feedback-pop-kf 200ms ease-out;
}

/* === PREFERS-REDUCED-MOTION: disable ALL motion ===
   Every preset class is nullified; every transition is collapsed to 0.01ms
   so the visual end-state still applies, just without movement. */
@media (prefers-reduced-motion: reduce) {
  .silse-motion-entrance-fade,
  .silse-motion-entrance-slide-up,
  .silse-motion-soft-fade,
  .silse-motion-slide-up,
  .silse-motion-pulse,
  .silse-motion-reward-pop,
  .silse-motion-correct-burst,
  .silse-motion-feedback-pop {
    animation: none !important;
  }
  .silse-motion-hover-lift,
  .silse-motion-hover-lift:hover {
    transition: none !important;
    transform: none !important;
  }
}
`.trim();
}
