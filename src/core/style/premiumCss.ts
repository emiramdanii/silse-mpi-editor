/**
 * Premium CSS Library — Single Source of Truth for shared CSS class definitions.
 *
 * Background:
 *   Sub-fase 3a (SILSE Fase 3) — extract shared CSS class definitions from
 *   src/styles.css and src/export/export-html.ts:generateCSS() into one pure
 *   library. Both consumers import from this file so future drift is
 *   structurally impossible.
 *
 * Architecture rules:
 *   - Pure functions, no React/DOM dependencies.
 *   - Each function returns a CSS string (callers may concatenate with `\n\n`).
 *   - Functions are grouped by visual concern (Groups 1–6).
 *   - Static groups (no params):
 *       Group 1 — Animations (@keyframes + .silse-anim-* classes)
 *       Group 2 — Cover decoration (.silse-cover-clean/soft/mission::before/::after)
 *       Group 3 — Background patterns (.silse-bg-page-*::before, .silse-bg-pattern-*::after)
 *       Group 4 — Premium block panel (.silse-block-panel, .silse-block-panel::before, .silse-block-chip)
 *       Group 5 — Celebration effects (.silse-celebrate-* + @keyframes silse-celebrate-*)
 *       Group 6 — Choice defaults + score + identical skins (.silse-choice-default, .silse-score, .skin-text-*, .skin-quiz-playful, .skin-game-playful)
 *   - Parameterised group (Group 7):
 *       buildPremiumHeroCss(profile) — per-skin hero treatment
 *       buildPremiumSkinCss(profile) — per-skin colour tokens & gradients
 *     Both accept `PremiumExportProfile` re-used from
 *     `core/style-packs/premium-export-profile` (NO new type — Bapak directive).
 *
 *   Group composition was determined by scripts/drift-check.mjs which
 *   tokenises both styles.css and export-html.ts:generateCSS() into individual
 *   CSS rules, normalises them semantically (whitespace + trailing `;`), and
 *   classifies each duplicated selector as IDENTICAL (safe to extract here)
 *   or DRIFTED (deferred to sub-fase 3b).
 *
 *   Initial audit (Commit 2 baseline):
 *     - 62 selectors IDENTICAL between styles.css + export-html.ts → extracted here
 *     - 25 selectors DRIFTED → deferred to 3b (see SILSE_FASE3A_AUDIT.md)
 *     - 499 selectors only in styles.css (not duplicated) → stay
 *     - 73 selectors only in export-html.ts (not duplicated) → stay
 *
 *   Commit 1: scaffolding (all functions return '').
 *   Commit 2: Group 1 (Animations) extracted — 27 selectors.
 *   Commits 3–5: Groups 2–6 extraction.
 *   Commit 6: Group 7 (parameterised, per PremiumExportProfile).
 *   Commit 7: cleanup + audit report.
 *
 * Consumers:
 *   - `src/styles.css` imports the generated bundle via:
 *       @import "./styles/premium-generated.css";
 *     The file is produced by `scripts/generate-css.mjs` at dev time and
 *     committed to the repo (Bapak-approved Option B: pre-generate + commit).
 *     The @import sits at the TOP of styles.css per CSS spec (Vite warns
 *     otherwise); specificity ties don't matter because each migrated rule
 *     is REMOVED from styles.css in the same commit it's added here.
 *   - `src/export/export-html.ts` imports functions directly:
 *       import { buildAnimationsCss } from '../core/style/premiumCss';
 *     …then interpolates their output into the baseCss template literal.
 *
 * Generator:
 *   `scripts/generate-css.mjs` bundles this file via esbuild (no new dep —
 *   already in node_modules via Vite), calls every static builder function,
 *   concatenates the output, and writes `src/styles/premium-generated.css`.
 *   Run via `npm run generate:css`. Re-run whenever this file changes.
 */

import type { PremiumExportProfile } from '../style-packs/premium-export-profile';

// ===========================================================================
// Group 1 — Animations (@keyframes + .silse-anim-* classes)
// ===========================================================================

/**
 * All shared animation primitives: keyframes + animation/transition utility
 * classes. Source: MICRO-ANIMATION-SYSTEM-V1 section in both consumers.
 *
 * Extracted in Commit 2 — 27 selectors:
 *   - 7 @keyframes (silse-fade-in-soft/warm/mission, silse-feedback-pop,
 *     silse-mission-pulse, silse-celebrate-burst-ring, silse-celebrate-sparkle)
 *   - 1 @keyframes (silse-award-shine) — lives at the end of styles.css but
 *     is identical between consumers, so extracted here.
 *   - 19 .silse-anim-* utility classes
 *
 * NOTE: The `@media (prefers-reduced-motion: reduce)` block is DRIFTED
 * (styles.css has 3 occurrences with slightly different content vs 2 in
 * export-html.ts). Per Bapak directive, drift fixes go to 3b, NOT 3a.
 * So the reduced-motion block is NOT extracted here — it stays in both
 * consumers as-is until 3b unifies it.
 *
 * CSS text below is the EXACT bytes from styles.css (formatted form).
 * The export-html.ts compact form is semantically identical (verified by
 * scripts/drift-check.mjs).
 */
export function buildAnimationsCss(): string {
  return `/* Group 1 — Animations (extracted from MICRO-ANIMATION-SYSTEM-V1)
   Source of truth: src/core/style/premiumCss.ts (Commit 2, Fase 3a).
   DO NOT duplicate in styles.css or export-html.ts:generateCSS(). */

/* Page enter animations — 200-260ms fade + slight translateY */
@keyframes silse-fade-in-soft {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes silse-fade-in-warm {
  from { opacity: 0; transform: translateY(6px) scale(0.998); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes silse-fade-in-mission {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.silse-anim-page-soft-in { animation: silse-fade-in-soft 220ms ease-out; }
.silse-anim-page-warm-in { animation: silse-fade-in-warm 260ms ease-out; }
.silse-anim-page-mission-in { animation: silse-fade-in-mission 200ms ease-out; }

/* Button hover lift — 1px */
.silse-anim-button-clean { transition: transform 150ms ease-out, box-shadow 150ms ease-out; }
.silse-anim-button-clean:hover { transform: translateY(-1px); }
.silse-anim-button-soft { transition: transform 150ms ease-out, box-shadow 150ms ease-out; }
.silse-anim-button-soft:hover { transform: translateY(-1px); }
.silse-anim-button-mission { transition: transform 120ms ease-out, box-shadow 120ms ease-out; }
.silse-anim-button-mission:hover { transform: translateY(-1px); }

/* Choice hover + select — very subtle */
.silse-anim-choice-clean { transition: border-color 150ms ease-out, background-color 150ms ease-out; }
.silse-anim-choice-soft { transition: border-color 180ms ease-out, background-color 180ms ease-out, border-radius 180ms; }
.silse-anim-choice-mission { transition: border-color 120ms ease-out, background-color 120ms ease-out, box-shadow 120ms; }

/* Feedback pop — very small */
@keyframes silse-feedback-pop {
  from { opacity: 0; transform: translateY(-2px); }
  to { opacity: 1; transform: translateY(0); }
}
.silse-anim-feedback-soft { animation: silse-feedback-pop 200ms ease-out; }
.silse-anim-feedback-warm { animation: silse-feedback-pop 240ms ease-out; }
.silse-anim-feedback-mission { animation: silse-feedback-pop 180ms ease-out; }

/* Game panel — subtle enter */
.silse-anim-game-clean { transition: border-color 150ms ease-out; }
.silse-anim-game-soft { transition: border-color 180ms ease-out, border-radius 180ms; }
.silse-anim-game-mission { transition: box-shadow 150ms ease-out; }

/* Mission pulse — very subtle, can be disabled */
@keyframes silse-mission-pulse {
  0%, 100% { box-shadow: 0 0 16px rgba(59,130,246,0.15); }
  50% { box-shadow: 0 0 20px rgba(59,130,246,0.25); }
}
.silse-anim-game-mission.silse-game-mission {
  animation: silse-mission-pulse 3s ease-in-out infinite;
}

/* Celebration keyframes (used by Group 5 celebration classes — kept here
   because they are animation primitives, not visual decorations) */
@keyframes silse-celebrate-burst-ring {
  0% { opacity: 0.8; transform: scale(0.5); }
  100% { opacity: 0; transform: scale(1.4); }
}
@keyframes silse-celebrate-sparkle {
  0%, 100% { opacity: 0; }
  30% { opacity: 1; }
  60% { opacity: 0.5; }
}

/* Award medal shine — used by closing-award scene */
@keyframes silse-award-shine {
  to { transform: rotate(360deg); }
}`;
}

// ===========================================================================
// Group 2 — Cover decoration (.silse-cover-clean/soft/mission)
// ===========================================================================

/**
 * Cover-scene ::before/::after decoration rules.
 * Source: COVER-PREMIUM-POLISH-01 section in both consumers.
 *
 * Extracted in Commit 3 — 6 selectors:
 *   .silse-cover-clean::before, .silse-cover-clean::after,
 *   .silse-cover-soft::before, .silse-cover-soft::after,
 *   .silse-cover-mission::before, .silse-cover-mission::after
 *
 * NOTE: `.silse-cover-clean [data-variant="title"]` etc. are also in
 * COVER-PREMIUM-POLISH-01 — these are byte-identical between consumers
 * (verified by drift-check) but use `[data-variant=...]` selectors. They
 * will be extracted here in Commit 3.
 */
export function buildCoverDecorationCss(): string {
  // Commit 3 will fill this.
  return '';
}

// ===========================================================================
// Group 3 — Background patterns (.silse-bg-page-*::before, .silse-bg-pattern-*::after)
// ===========================================================================

/**
 * Page background pattern overlay rules.
 * Source: BACKGROUND-PATTERN-SYSTEM-V1 section in both consumers.
 *
 * Extracted in Commit 3 — 6 selectors:
 *   .silse-bg-page-clean::before, .silse-bg-page-soft::before, .silse-bg-page-mission::before,
 *   .silse-bg-pattern-subtle-grid::after, .silse-bg-pattern-soft-dots::after,
 *   .silse-bg-pattern-mission-glow::after
 *
 * NOTE: `.silse-bg-page-clean` (base rule, no ::before) is DRIFTED —
 * styles.css sets `position: relative`, export-html.ts sets `--silse-shadow-feel`
 * custom props. Deferred to 3b.
 */
export function buildBackgroundPatternCss(): string {
  // Commit 3 will fill this.
  return '';
}

// ===========================================================================
// Group 4 — Premium block panel (.silse-block-panel, .silse-block-chip)
// ===========================================================================

/**
 * Premium block decoration — panel depth shadow + chip gold gradient.
 * Source: VISUAL-PREMIUM-01 section in both consumers.
 *
 * Extracted in Commit 4 — 3 selectors:
 *   .silse-block-panel, .silse-block-panel::before, .silse-block-chip
 *
 * NOTE: Several other VISUAL-PREMIUM-01 selectors are DRIFTED
 * (`.silse-cover-*::before` combined selectors with `background-image`,
 * `.silse-cover-* .silse-block-*`, `.silse-choice-*` overrides, etc.).
 * Drifted selectors stay in their original files until 3b.
 */
export function buildPremiumBlockCss(): string {
  // Commit 4 will fill this.
  return '';
}

// ===========================================================================
// Group 5 — Celebration effects (.silse-celebrate-*)
// ===========================================================================

/**
 * CSS-only celebration effects on correct answers.
 * Source: CELEBRATION-EFFECT-V1 section in both consumers.
 *
 * Extracted in Commit 4 — 12 selectors:
 *   .silse-celebrate-success-clean/soft/mission
 *   .silse-celebrate-burst-clean/soft/mission::before
 *   .silse-celebrate-particle-clean/soft/mission::before
 *   .silse-celebrate-particle-clean/soft/mission::after
 *
 * The two @keyframes (silse-celebrate-burst-ring, silse-celebrate-sparkle)
 * are extracted in Group 1 (Animations) since they are animation primitives.
 */
export function buildCelebrationCss(): string {
  // Commit 4 will fill this.
  return '';
}

// ===========================================================================
// Group 6 — Choice defaults + score + identical skins
// ===========================================================================

/**
 * Quiz/feedback/score baseline + the few component-skin classes that happen
 * to be byte-identical between consumers.
 *
 * Extracted in Commit 5 — 8 selectors:
 *   .silse-choice-default, .silse-choice-default:hover,
 *   .silse-score,
 *   .skin-quiz-playful, .skin-game-playful,
 *   .skin-text-clean, .skin-text-soft, .skin-text-bold
 *
 * NOTE: Most `.skin-*` classes are DRIFTED (styles.css has var() fallbacks,
 * export-html.ts doesn't). The 5 extracted here are the only skin classes
 * that happen to be identical. The rest are deferred to 3b.
 *
 * NOTE: `.silse-choice-correct/wrong`, `.silse-choice-selected`,
 * `.silse-feedback-correct/wrong` are DRIFTED (different colour tokens) —
 * deferred to 3b.
 */
export function buildMiscIdenticalCss(): string {
  // Commit 5 will fill this.
  return '';
}

// ===========================================================================
// Group 7 — Parameterised premium styles (per PremiumExportProfile)
// ===========================================================================

/**
 * Per-skin hero treatment (.silse-hero-card, .silse-hero-kicker, .silse-hero-cta,
 * hero typography, hero gradient stops derived from `profile.colors` +
 * `profile.gradients`).
 *
 * Source: PREMIUM-EXPORT-OVERHAUL-01 section in export-html.ts (lines ~810+).
 * In styles.css, the corresponding rules are editor-side mirrors.
 *
 * Signature MUST accept the existing `PremiumExportProfile` (no new type).
 * Verified: PremiumExportProfile lives in core/style-packs/premium-export-profile.ts
 * and imports only from ./style-pack-registry — no React/DOM dependency.
 */
export function buildPremiumHeroCss(_profile: PremiumExportProfile): string {
  // Commit 6 will fill this.
  return '';
}

/**
 * Per-skin colour tokens, gradients, and global surface rules
 * (--silse-navy/red/gold custom props + body background per skin).
 *
 * Source: PREMIUM-EXPORT-OVERHAUL-01 section in export-html.ts.
 *
 * Signature MUST accept the existing `PremiumExportProfile` (no new type).
 */
export function buildPremiumSkinCss(_profile: PremiumExportProfile): string {
  // Commit 6 will fill this.
  return '';
}
