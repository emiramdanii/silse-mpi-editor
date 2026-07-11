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
 * NOTE: `.silse-cover-clean [data-variant="title"]` etc. are NOT duplicated
 * identically — styles.css uses `[data-component-type="text"][data-variant="title"]`
 * while export-html.ts uses just `[data-variant="title"]`. Different selectors,
 * both stay in their original files.
 */
export function buildCoverDecorationCss(): string {
  return `/* Group 2 — Cover decoration (extracted from COVER-PREMIUM-POLISH-01)
   Source of truth: src/core/style/premiumCss.ts (Commit 3, Fase 3a).
   DO NOT duplicate in styles.css or export-html.ts:generateCSS(). */

/* Modern Clean cover: bold hero gradient + geometric accent shape */
.silse-cover-clean::before { background:linear-gradient(160deg,rgba(37,99,235,0.12) 0%,rgba(37,99,235,0.03) 35%,transparent 55%,rgba(37,99,235,0.08) 100%) !important; }
.silse-cover-clean::after { content:''; position:absolute; top:-60px; right:-60px; width:240px; height:240px; background:radial-gradient(circle,rgba(37,99,235,0.1) 0%,transparent 70%); border-radius:50%; pointer-events:none; z-index:0; }

/* Soft Classroom cover: warm pastel hero + soft rounded shape */
.silse-cover-soft::before { background:linear-gradient(135deg,rgba(254,243,199,0.35) 0%,rgba(254,226,226,0.2) 40%,rgba(254,215,170,0.15) 70%,rgba(253,230,138,0.1) 100%) !important; }
.silse-cover-soft::after { content:''; position:absolute; bottom:-80px; left:-80px; width:280px; height:280px; background:radial-gradient(circle,rgba(245,158,11,0.12) 0%,transparent 70%); border-radius:50%; pointer-events:none; z-index:0; }

/* Mission Dark cover: bold radial glow + diagonal mission accent line */
.silse-cover-mission::before { background:radial-gradient(ellipse at 50% 35%,rgba(59,130,246,0.2) 0%,transparent 45%,rgba(59,130,246,0.1) 100%) !important; }
.silse-cover-mission::after { content:''; position:absolute; top:0; right:0; width:100%; height:6px; background:linear-gradient(90deg,transparent 30%,rgba(59,130,246,0.5) 50%,transparent 70%); pointer-events:none; z-index:0; }`;
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
 * custom props. Deferred to 3b. The `.silse-bg-page-* > *` z-index helper
 * rules are only in styles.css (not duplicated in export-html.ts which has
 * `#silse-canvas > *` instead) — they stay in styles.css.
 */
export function buildBackgroundPatternCss(): string {
  return `/* Group 3 — Background patterns (extracted from BACKGROUND-PATTERN-SYSTEM-V1)
   Source of truth: src/core/style/premiumCss.ts (Commit 3, Fase 3a).
   DO NOT duplicate in styles.css or export-html.ts:generateCSS(). */

/* Page background classes — gradient base applied as overlay on canvas-frame */
.silse-bg-page-clean::before { content:''; position:absolute; inset:0; background:linear-gradient(180deg,rgba(248,250,252,0.5) 0%,transparent 30%,transparent 70%,rgba(241,245,249,0.3) 100%); pointer-events:none; z-index:0; }
.silse-bg-page-soft::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(254,243,199,0.15) 0%,rgba(254,226,226,0.1) 50%,rgba(254,215,170,0.08) 100%); pointer-events:none; z-index:0; }
.silse-bg-page-mission::before { content:''; position:absolute; inset:0; background:radial-gradient(ellipse at 50% 30%,rgba(59,130,246,0.08) 0%,transparent 60%); pointer-events:none; z-index:0; }

/* Pattern overlay classes — subtle decorative pattern */
.silse-bg-pattern-subtle-grid::after { content:''; position:absolute; inset:0; background-image:linear-gradient(rgba(37,99,235,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.02) 1px,transparent 1px); background-size:40px 40px; pointer-events:none; z-index:0; }
.silse-bg-pattern-soft-dots::after { content:''; position:absolute; inset:0; background-image:radial-gradient(circle,rgba(245,158,11,0.04) 1.5px,transparent 1.5px); background-size:28px 28px; pointer-events:none; z-index:0; }
.silse-bg-pattern-mission-glow::after { content:''; position:absolute; inset:0; background-image:linear-gradient(rgba(59,130,246,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.03) 1px,transparent 1px); background-size:60px 60px; pointer-events:none; z-index:0; }`;
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
  return `/* Group 4 — Premium block panel (extracted from VISUAL-PREMIUM-01)
   Source of truth: src/core/style/premiumCss.ts (Commit 4, Fase 3a).
   DO NOT duplicate in styles.css or export-html.ts:generateCSS(). */

/* Multi-layer shadow for panels (ambient + key + rim) */
.silse-block-panel { position:relative; box-shadow:0 1px 2px rgba(0,0,0,0.04),0 4px 12px rgba(0,0,0,0.06),0 12px 32px rgba(0,0,0,0.04) !important; border:1px solid rgba(255,255,255,0.06) !important; }

/* Inner highlight (top edge, glass-like) */
.silse-block-panel::before { content:''; position:absolute; top:0; left:12px; right:12px; height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent); pointer-events:none; }

/* Badge/chip: gradient background (not flat) */
.silse-block-chip { background:linear-gradient(135deg,rgba(249,193,46,0.18) 0%,rgba(249,193,46,0.08) 100%) !important; box-shadow:0 1px 3px rgba(249,193,46,0.15),inset 0 1px 0 rgba(255,255,255,0.1); }`;
}

// ===========================================================================
// Group 5 — Celebration effects (.silse-celebrate-*)
// ===========================================================================

/**
 * CSS-only celebration effects on correct answers.
 * Source: CELEBRATION-EFFECT-V1 section in both consumers.
 *
 * Extracted in Commit 4 — 13 selectors (12 class rules + 1 @media block):
 *   .silse-celebrate-success-clean/soft/mission
 *   .silse-celebrate-burst-clean/soft/mission::before
 *   .silse-celebrate-particle-clean/soft/mission::before
 *   .silse-celebrate-particle-clean/soft/mission::after
 *   @media (prefers-reduced-motion: reduce) { celebration selectors only }
 *
 * The two @keyframes (silse-celebrate-burst-ring, silse-celebrate-sparkle)
 * are extracted in Group 1 (Animations) since they are animation primitives.
 *
 * NOTE: The MICRO-ANIMATION @media (prefers-reduced-motion: reduce) block
 * is DRIFTED and stays inline in both consumers. Only the CELEBRATION-SPECIFIC
 * @media block is extracted here (it is semantically identical between consumers).
 */
export function buildCelebrationCss(): string {
  return `/* Group 5 — Celebration effects (extracted from CELEBRATION-EFFECT-V1)
   Source of truth: src/core/style/premiumCss.ts (Commit 4, Fase 3a).
   DO NOT duplicate in styles.css or export-html.ts:generateCSS().
   The @keyframes silse-celebrate-burst-ring and silse-celebrate-sparkle
   are in Group 1 (buildAnimationsCss) — animation primitives. */

/* Modern Clean celebration */
.silse-celebrate-success-clean { position:relative; overflow:visible; }
.silse-celebrate-burst-clean::before { content:''; position:absolute; inset:-2px; border:2px solid rgba(22,163,74,0.4); border-radius:8px; animation:silse-celebrate-burst-ring 800ms ease-out; pointer-events:none; }
.silse-celebrate-particle-clean::before, .silse-celebrate-particle-clean::after { content:'✦'; position:absolute; font-size:10px; color:rgba(22,163,74,0.6); animation:silse-celebrate-sparkle 800ms ease-out; pointer-events:none; }
.silse-celebrate-particle-clean::before { top:-4px; right:8px; }
.silse-celebrate-particle-clean::after { top:-2px; right:24px; animation-delay:150ms; }

/* Soft Classroom celebration */
.silse-celebrate-success-soft { position:relative; overflow:visible; }
.silse-celebrate-burst-soft::before { content:''; position:absolute; inset:-2px; border:2px solid rgba(245,158,11,0.4); border-radius:12px; animation:silse-celebrate-burst-ring 900ms ease-out; pointer-events:none; }
.silse-celebrate-particle-soft::before, .silse-celebrate-particle-soft::after { content:'★'; position:absolute; font-size:11px; color:rgba(245,158,11,0.6); animation:silse-celebrate-sparkle 900ms ease-out; pointer-events:none; }
.silse-celebrate-particle-soft::before { top:-4px; right:8px; }
.silse-celebrate-particle-soft::after { top:-2px; right:24px; animation-delay:150ms; }

/* Mission Dark celebration */
.silse-celebrate-success-mission { position:relative; overflow:visible; }
.silse-celebrate-burst-mission::before { content:''; position:absolute; inset:-2px; border:2px solid rgba(59,130,246,0.5); border-radius:6px; animation:silse-celebrate-burst-ring 700ms ease-out; pointer-events:none; box-shadow:0 0 12px rgba(59,130,246,0.3); }
.silse-celebrate-particle-mission::before, .silse-celebrate-particle-mission::after { content:'◆'; position:absolute; font-size:10px; color:rgba(59,130,246,0.7); animation:silse-celebrate-sparkle 700ms ease-out; pointer-events:none; }
.silse-celebrate-particle-mission::before { top:-4px; right:8px; }
.silse-celebrate-particle-mission::after { top:-2px; right:24px; animation-delay:120ms; }

/* prefers-reduced-motion: disable celebration */
@media (prefers-reduced-motion: reduce) {
  .silse-celebrate-burst-clean::before, .silse-celebrate-burst-soft::before, .silse-celebrate-burst-mission::before,
  .silse-celebrate-particle-clean::before, .silse-celebrate-particle-clean::after,
  .silse-celebrate-particle-soft::before, .silse-celebrate-particle-soft::after,
  .silse-celebrate-particle-mission::before, .silse-celebrate-particle-mission::after { animation:none !important; display:none !important; }
}`;
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
  return `/* Group 6 — Choice defaults + score + identical skins
   Source of truth: src/core/style/premiumCss.ts (Commit 5, Fase 3a).
   DO NOT duplicate in styles.css or export-html.ts:generateCSS().
   These are the ONLY skin classes that happen to be byte-identical between
   consumers. The rest (.skin-card-*, .skin-button-*, etc.) are DRIFTED
   (styles.css has var() fallbacks, export-html.ts doesn't) — deferred to 3b. */

/* Quiz playful skin */
.skin-quiz-playful { border:2px solid rgba(245,158,11,0.3); border-radius:16px; background:linear-gradient(135deg,rgba(254,243,199,0.5) 0%,rgba(255,255,255,0.8) 100%); }

/* Game playful skin */
.skin-game-playful { border:2px solid rgba(34,197,94,0.3); border-radius:16px; background:linear-gradient(135deg,rgba(220,252,231,0.5) 0%,rgba(255,255,255,0.8) 100%); }

/* Text skins (clean/soft/bold) */
.skin-text-clean { text-shadow:none; }
.skin-text-soft { text-shadow:0 1px 2px rgba(0,0,0,0.03); }
.skin-text-bold { text-shadow:0 0 8px rgba(59,130,246,0.2); font-weight:500; }

/* Choice default (base state — no selection, no correctness) */
.silse-choice-default { border-left:3px solid transparent; transition:border-color 0.15s,background-color 0.15s; }
.silse-choice-default:hover { border-left-color:var(--silse-color-primary,var(--color-accent)); }
/* Premium override for choice-default:hover (from the premium polish section) */
.silse-choice-default:hover { border-left-color:var(--silse-color-primary,var(--color-accent)); box-shadow:0 2px 8px rgba(30,91,143,0.12); transform:translateY(-1px); }

/* Score display */
.silse-score { font-weight:600; padding:4px 12px; border-radius:12px; background:rgba(255,255,255,0.15); }`;
}

// ===========================================================================
// Group 6b — Skin base classes (drift fix, Fase 3b Commit 2)
// ===========================================================================

/**
 * Component skin base classes — the 15 drifted selectors from Fase 3a drift-check.
 *
 * Source: COMPONENT-SKIN-V2 section in both consumers.
 *
 * Extracted in Commit 3b-2 — 15 selectors (drift fix):
 *   .skin-card-flat/soft/bold
 *   .skin-button-clean/rounded/mission
 *   .skin-quiz-calm/mission
 *   .skin-game-calm/mission
 *   .skin-layered-clean/soft/bold
 *   .skin-bridge-subtle/strong
 *
 * Drift that was fixed:
 *   - styles.css used var(--token, fallback) — required for editor correctness
 *     (--silse-color-* unset at editor runtime).
 *   - export used var(--token) without fallback — broke when no style pack.
 *   - Some skins had different fallback values (e.g., skin-button-clean color:
 *     styles.css 'white' vs export var(--color-panel)).
 *
 * Winner: styles.css pattern (with fallback). All 15 now unified with fallbacks.
 * The premium override rules (in buildPremiumSkinCss) apply on top of these
 * base rules via #silse-canvas .skin-* selectors with !important.
 */
export function buildSkinBaseCss(): string {
  return `/* Group 6b — Skin base classes (drift fix, Fase 3b Commit 2)
   Source of truth: src/core/style/premiumCss.ts.
   Unified with var() fallbacks (styles.css pattern) — required for editor
   correctness and for export when no style pack is chosen. */

/* Card skins */
.skin-card-flat { border:1px solid var(--silse-color-border, var(--color-border)); border-radius:10px; background:var(--silse-color-surface, var(--color-panel-soft)); box-shadow:0 2px 8px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04); }
.skin-card-soft { border:1px solid rgba(255,200,200,0.4); border-radius:18px; background:linear-gradient(135deg,var(--silse-color-surface, var(--color-warning-soft)) 0%,rgba(255,255,255,0.7) 100%); box-shadow:0 4px 16px rgba(0,0,0,0.08),0 1px 4px rgba(0,0,0,0.04); }
.skin-card-bold { border:2px solid var(--silse-color-primary, var(--color-marker-text)); border-radius:10px; background:var(--silse-color-surface, var(--color-text)); box-shadow:0 0 0 1px rgba(59,130,246,0.3),0 6px 20px rgba(0,0,0,0.5),0 2px 8px rgba(59,130,246,0.15); }

/* Button skins */
.skin-button-clean { border:1px solid var(--silse-color-primary, var(--color-accent)); border-radius:6px; background:var(--silse-color-primary, var(--color-accent)); color:white; font-weight:600; box-shadow:0 1px 2px rgba(37,99,235,0.2); }
.skin-button-rounded { border:none; border-radius:24px; background:linear-gradient(135deg,var(--silse-color-primary, var(--color-warning-strong)) 0%,var(--silse-color-secondary, var(--silse-gold)) 100%); color:white; font-weight:600; box-shadow:0 2px 6px rgba(245,158,11,0.3); }
.skin-button-mission { border:2px solid var(--silse-color-primary, var(--color-marker-text)); border-radius:4px; background:var(--silse-color-surface, var(--color-text)); color:var(--silse-color-primary, var(--color-marker-text)); font-weight:700; text-transform:uppercase; letter-spacing:0.5px; box-shadow:0 0 12px rgba(59,130,246,0.4); }

/* Quiz skins */
.skin-quiz-calm { border:1px solid var(--silse-color-border, var(--color-border)); border-radius:10px; background:var(--silse-color-surface, var(--color-panel-soft)); }
.skin-quiz-mission { border:2px solid var(--silse-color-primary, var(--color-marker-text)); border-radius:8px; background:var(--silse-color-surface, var(--color-text)); box-shadow:0 0 16px rgba(59,130,246,0.2); }

/* Bridge skins */
.skin-bridge-subtle { border-left:4px solid var(--silse-color-primary, var(--color-accent)); background:rgba(37,99,235,0.04); }
.skin-bridge-strong { border-left:6px solid var(--silse-color-primary, var(--color-marker-text)); background:linear-gradient(90deg,rgba(59,130,246,0.15) 0%,transparent 100%); box-shadow:0 0 12px rgba(59,130,246,0.2); }

/* Game skins */
.skin-game-calm { border:1px solid var(--silse-color-border, var(--color-border)); border-radius:10px; background:var(--silse-color-surface, var(--color-panel-soft)); }
.skin-game-mission { border:2px solid var(--silse-color-primary, var(--color-marker-text)); border-radius:8px; background:var(--silse-color-surface, var(--color-text)); box-shadow:0 0 20px rgba(59,130,246,0.3); }

/* Layered info skins */
.skin-layered-clean { border:1px solid var(--silse-color-border, var(--color-border)); border-radius:10px; background:var(--silse-color-surface, var(--color-panel-soft)); }
.skin-layered-soft { border:2px solid rgba(255,200,200,0.3); border-radius:16px; background:linear-gradient(135deg,var(--silse-color-surface, var(--color-warning-soft)) 0%,rgba(255,255,255,0.7) 100%); }
.skin-layered-bold { border:2px solid var(--silse-color-primary, var(--color-marker-text)); border-radius:8px; background:var(--silse-color-surface, var(--color-text)); box-shadow:0 0 16px rgba(59,130,246,0.15); }`;
}

// ===========================================================================
// Group 6c — Quiz/feedback choice states (drift fix, Fase 3b Commit 3)
// ===========================================================================

/**
 * Quiz choice and feedback state styles — the 5 drifted selectors from Fase 3a.
 *
 * Source: QUIZ-GAME-VISUAL-POLISH-01 (base) + VISUAL-PREMIUM-01 (override) sections.
 *
 * Extracted in Commit 3b-3 — 5 selectors (each appears twice: base + premium override):
 *   .silse-choice-selected, .silse-choice-correct, .silse-choice-wrong
 *   .silse-feedback-correct, .silse-feedback-wrong
 *
 * Drift that was fixed:
 *   - styles.css used --color-success (#2f7d4f, RGB 47,125,79) with rgba(47,125,79,…).
 *   - export used --color-success-strong (#16a34a, RGB 22,163,74) with rgba(22,163,74,…).
 *   - Same pattern for danger: --color-danger (#c0392b, RGB 192,57,43) vs
 *     --color-danger-strong (#dc2626, RGB 220,38,38).
 *
 * Winner (per Bapak's directive): export color (--color-success-strong /
 * --color-danger-strong — the Fase 1 Tailwind tokens) with styles.css indirection
 * (var(--silse-color-success, …) for style-pack override hook).
 *
 * Unified form:
 *   border-left: ... var(--silse-color-success, var(--color-success-strong));
 *   box-shadow: ... rgba(22,163,74,…);  // matches --color-success-strong
 */
export function buildQuizFeedbackCss(): string {
  return `/* Group 6c — Quiz/feedback choice states (drift fix, Fase 3b Commit 3)
   Source of truth: src/core/style/premiumCss.ts.
   Unified on --color-success-strong / --color-danger-strong (Fase 1 Tailwind tokens)
   with --silse-color-* indirection for style-pack override. */

/* Base choice states — QUIZ-GAME-VISUAL-POLISH-01 */
.silse-choice-selected { border-left:3px solid var(--silse-color-primary, var(--color-accent)); box-shadow:inset 0 0 0 1px rgba(30,91,143,0.2); }
.silse-choice-correct { border-left:4px solid var(--silse-color-success, var(--color-success-strong)); box-shadow:inset 0 0 0 1px rgba(22,163,74,0.2); }
.silse-choice-wrong { border-left:4px solid var(--silse-color-danger, var(--color-danger-strong)); box-shadow:inset 0 0 0 1px rgba(220,38,38,0.15); }
.silse-feedback-correct { border-left:4px solid var(--silse-color-success, var(--color-success-strong)); font-weight:500; }
.silse-feedback-wrong { border-left:4px solid var(--silse-color-danger, var(--color-danger-strong)); font-weight:500; }

/* Premium override — VISUAL-PREMIUM-01 (gradient background + multi-layer shadow) */
.silse-choice-selected { border-left:3px solid var(--silse-color-primary, var(--color-accent)); box-shadow:inset 0 0 0 1px rgba(30,91,143,0.2),0 2px 12px rgba(30,91,143,0.15); background:linear-gradient(135deg,rgba(30,91,143,0.06) 0%,rgba(30,91,143,0.02) 100%); }
.silse-choice-correct { border-left:4px solid var(--silse-color-success, var(--color-success-strong)); box-shadow:inset 0 0 0 1px rgba(22,163,74,0.25),0 2px 16px rgba(22,163,74,0.18); background:linear-gradient(135deg,rgba(22,163,74,0.08) 0%,rgba(22,163,74,0.02) 100%); }
.silse-choice-wrong { border-left:4px solid var(--silse-color-danger, var(--color-danger-strong)); box-shadow:inset 0 0 0 1px rgba(220,38,38,0.2),0 2px 12px rgba(220,38,38,0.12); }
.silse-feedback-correct { border-left:4px solid var(--silse-color-success, var(--color-success-strong)); background:linear-gradient(135deg,rgba(22,163,74,0.08) 0%,rgba(22,163,74,0.02) 100%); font-weight:500; }
.silse-feedback-wrong { border-left:4px solid var(--silse-color-danger, var(--color-danger-strong)); background:linear-gradient(135deg,rgba(220,38,38,0.08) 0%,rgba(220,38,38,0.02) 100%); font-weight:500; }`;
}

// ===========================================================================
// Group 7 — Parameterised premium styles (per PremiumExportProfile)
// ===========================================================================

/**
 * Derived variables computed from a PremiumExportProfile.
 *
 * This is a SHARED helper used by buildPremiumHeroCss, buildPremiumSkinCss,
 * AND by export-html.ts:generateCSS() (for the :root block and other inline
 * CSS that stays in generateCSS). Having a single source of truth for these
 * computations ensures byte-identical output after extraction.
 *
 * Exported so that generateCSS() can use the same derived values.
 */
export function derivePremiumVars(profile: PremiumExportProfile) {
  const c = profile.colors;
  const g = profile.gradients;
  const t = profile.typography;
  const cardR = profile.cardRadius;
  const btnR = profile.buttonRadius;
  const isDark = profile.darkStage;
  const stageOuter = isDark ? c.navy : 'var(--color-panel-soft)';
  const stageTextOnDark = isDark ? 'var(--color-panel)' : c.navy;
  const heroColor = isDark ? 'var(--color-panel)' : c.blue;
  const heroAccent = c.red;
  const bodyColor = isDark ? 'rgba(255,255,255,0.92)' : c.text;
  const mutedColor = isDark ? 'rgba(255,255,255,0.7)' : c.muted;
  const cardBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.96)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(29,53,87,0.12)';
  const cardShadow = isDark
    ? '0 22px 54px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.04)'
    : '0 22px 54px rgba(29,53,87,0.18), 0 4px 12px rgba(29,53,87,0.06)';
  return {
    c, g, t, cardR, btnR, isDark,
    stageOuter, stageTextOnDark,
    heroColor, heroAccent, bodyColor, mutedColor,
    cardBg, cardBorder, cardShadow,
  };
}

/**
 * Per-skin hero treatment: hero typography, hero card frame, hero kicker,
 * hero CTA, and award ribbon.
 *
 * Source: PREMIUM-EXPORT-OVERHAUL-01 section in export-html.ts (lines ~790-1010).
 *
 * Extracted in Commit 6 — 9 rules:
 *   #silse-canvas .silse-text-title, .silse-hero-title
 *   #silse-canvas .silse-text-title .silse-accent, .silse-hero-title .silse-accent
 *   #silse-canvas .silse-text-subtitle
 *   #silse-canvas .silse-kicker
 *   #silse-canvas .silse-hero-card
 *   #silse-canvas .silse-hero-kicker
 *   #silse-canvas .silse-hero-cta
 *   #silse-canvas .silse-hero-cta:hover
 *   #silse-canvas .silse-award-ribbon
 *
 * NOTE: The editor (styles.css) uses CSS VARIABLES (var(--silse-hero-color) etc.)
 * while the export uses DIRECT SUBSTITUTION (${heroColor} etc.). These are
 * architecturally different approaches that produce the same visual result.
 * This function is EXPORT-ONLY (called by export-html.ts). The editor does NOT
 * call it — it uses var() references in styles.css instead. This is NOT a drift
 * bug; it's a deliberate architectural difference (editor sets CSS vars at
 * runtime via getPremiumCssVariables(), export bakes values at generation time).
 *
 * Signature MUST accept the existing `PremiumExportProfile` (no new type).
 * Verified: PremiumExportProfile lives in core/style-packs/premium-export-profile.ts
 * and imports only from ./style-pack-registry — no React/DOM dependency.
 */
export function buildPremiumHeroCss(profile: PremiumExportProfile): string {
  const { c, t, isDark, heroColor, heroAccent } = derivePremiumVars(profile);

  return `/* Hero typography for text components with variant=title */
#silse-canvas .silse-text-title,
#silse-canvas .silse-hero-title {
  font-family: var(--silse-hero-font);
  font-weight: var(--silse-hero-weight);
  letter-spacing: var(--silse-hero-letter-spacing);
  ${t.heroUppercase ? 'text-transform: uppercase;' : ''}
  color: ${heroColor};
  line-height: 1.04;
  text-shadow: ${isDark ? '0 4px 14px rgba(0,0,0,0.32)' : 'none'};
}
#silse-canvas .silse-text-title .silse-accent,
#silse-canvas .silse-hero-title .silse-accent {
  color: ${heroAccent};
}

#silse-canvas .silse-text-subtitle {
  font-family: var(--silse-body-font);
  font-weight: 700;
  letter-spacing: 0.01em;
  color: ${isDark ? 'rgba(255,255,255,0.86)' : c.muted};
}

#silse-canvas .silse-kicker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: 999px;
  background: linear-gradient(145deg, ${c.gold}, ${c.goldDeep});
  color: ${c.navy};
  font-family: var(--silse-body-font);
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  box-shadow: 0 6px 14px rgba(0,0,0,0.16);
  white-space: nowrap;
}

/* Hero card frame — only rendered on cover pages */
#silse-canvas .silse-hero-card {
  position: absolute;
  left: 50%;
  top: 130px;
  transform: translateX(-50%);
  width: 980px;
  height: 460px;
  background: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.92)'};
  border: 1px solid ${isDark ? 'rgba(255,255,255,0.18)' : 'rgba(29,53,87,0.14)'};
  border-radius: 30px;
  box-shadow: ${isDark
    ? '0 26px 60px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.04)'
    : '12px 12px 0 rgba(29,53,87,0.10), 0 24px 60px rgba(29,53,87,0.20)'};
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  pointer-events: none;
  z-index: 1;
}

#silse-canvas .silse-hero-kicker {
  position: absolute;
  left: 50%;
  top: 168px;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border-radius: 999px;
  background: linear-gradient(145deg, ${c.gold}, ${c.goldDeep});
  color: ${c.navy};
  font-family: var(--silse-body-font);
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  box-shadow: 0 6px 16px rgba(0,0,0,0.20);
  pointer-events: none;
  z-index: 2;
  white-space: nowrap;
}

#silse-canvas .silse-hero-cta {
  position: absolute;
  left: 50%;
  top: 510px;
  transform: translateX(-50%);
  padding: 14px 32px;
  border-radius: 999px;
  background: linear-gradient(145deg, ${c.red}, ${c.blue});
  color: var(--color-panel);
  font-family: var(--silse-body-font);
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  border: 0;
  cursor: pointer;
  box-shadow: 0 14px 28px rgba(0,0,0,0.28);
  pointer-events: auto;
  z-index: 2;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
#silse-canvas .silse-hero-cta:hover {
  transform: translateX(-50%) translateY(-2px) scale(1.02);
  box-shadow: 0 20px 36px rgba(0,0,0,0.36);
}

#silse-canvas .silse-award-ribbon {
  position: absolute;
  left: 50%;
  bottom: 64px;
  transform: translateX(-50%);
  padding: 10px 22px;
  border-radius: 999px;
  background: linear-gradient(135deg, ${c.red}, ${c.blue});
  color: var(--color-panel);
  font-family: var(--silse-body-font);
  font-size: 14px;
  font-weight: 900;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  box-shadow: 0 12px 24px rgba(0,0,0,0.28);
  pointer-events: none;
  z-index: 1;
  white-space: nowrap;
}`;
}

/**
 * Per-skin colour tokens, gradients, and skin override rules.
 *
 * Source: PREMIUM-EXPORT-OVERHAUL-01 section in export-html.ts.
 *
 * Extracted in Commit 6 — 12 rules:
 *   #silse-canvas[data-page-role="cover/closing/material/learningObjectives/quiz/activity"]
 *   #silse-canvas .skin-card-flat/soft/bold (+ > strong)
 *   #silse-canvas .skin-button-clean/rounded/mission (+ :hover)
 *   #silse-canvas .skin-quiz-calm/playful/mission, .skin-game-calm/playful/mission (+ > strong)
 *   #silse-canvas .skin-bridge-subtle/strong
 *   #silse-canvas .skin-layered-clean/soft/bold
 *
 * NOTE: The :root premium variable definitions (--silse-navy etc.) STAY INLINE
 * in export-html.ts because they're part of the :root block that also contains
 * editor theme tokens and project-style overrides (varsStr). Extracting just
 * the premium vars would split the :root block and change the byte output.
 *
 * NOTE: Same as buildPremiumHeroCss — the editor uses CSS VARIABLES while the
 * export uses DIRECT SUBSTITUTION. This function is EXPORT-ONLY.
 *
 * Signature MUST accept the existing `PremiumExportProfile` (no new type).
 */
export function buildPremiumSkinCss(profile: PremiumExportProfile): string {
  const { c, t, isDark, bodyColor, cardBg, cardBorder, cardShadow } = derivePremiumVars(profile);

  return `/* Premium skin overrides — multi-shadow + larger radius + glass bg */
#silse-canvas .skin-card-flat,
#silse-canvas .skin-card-soft,
#silse-canvas .skin-card-bold {
  border-radius: var(--silse-card-radius) !important;
  background: ${cardBg} !important;
  border: 1px solid ${cardBorder} !important;
  box-shadow: ${cardShadow} !important;
  color: ${bodyColor} !important;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
#silse-canvas .skin-card-flat > strong,
#silse-canvas .skin-card-soft > strong,
#silse-canvas .skin-card-bold > strong {
  display: block;
  font-family: var(--silse-hero-font);
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.01em;
  color: ${isDark ? 'var(--color-panel)' : c.blue};
  margin-bottom: 6px;
}

#silse-canvas .skin-button-clean,
#silse-canvas .skin-button-rounded,
#silse-canvas .skin-button-mission {
  border-radius: var(--silse-button-radius) !important;
  font-family: var(--silse-body-font) !important;
  font-weight: 900 !important;
  letter-spacing: 0.4px;
  ${t.heroUppercase ? 'text-transform: uppercase;' : ''}
  box-shadow: 0 12px 24px rgba(0,0,0,0.18) !important;
  background: linear-gradient(145deg, ${c.red}, ${c.blue}) !important;
  color: var(--color-panel) !important;
  border: 0 !important;
  transition: transform 0.18s ease, box-shadow 0.18s ease !important;
}
#silse-canvas .skin-button-clean:hover,
#silse-canvas .skin-button-rounded:hover,
#silse-canvas .skin-button-mission:hover {
  transform: translateY(-2px) scale(1.02) !important;
  box-shadow: 0 18px 32px rgba(0,0,0,0.26) !important;
}

#silse-canvas .skin-quiz-calm,
#silse-canvas .skin-quiz-playful,
#silse-canvas .skin-quiz-mission,
#silse-canvas .skin-game-calm,
#silse-canvas .skin-game-playful,
#silse-canvas .skin-game-mission {
  border-radius: var(--silse-card-radius) !important;
  background: ${cardBg} !important;
  border: 1px solid ${cardBorder} !important;
  box-shadow: ${cardShadow} !important;
  color: ${bodyColor} !important;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
#silse-canvas .skin-quiz-calm > strong,
#silse-canvas .skin-quiz-playful > strong,
#silse-canvas .skin-quiz-mission > strong,
#silse-canvas .skin-game-calm > strong,
#silse-canvas .skin-game-playful > strong,
#silse-canvas .skin-game-mission > strong {
  font-family: var(--silse-hero-font);
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.01em;
  color: ${isDark ? 'var(--color-panel)' : c.blue};
}

#silse-canvas .skin-bridge-subtle,
#silse-canvas .skin-bridge-strong {
  border-radius: var(--silse-card-radius) !important;
  background: ${isDark ? 'rgba(255,209,102,0.08)' : 'rgba(255,248,219,0.6)'} !important;
  border: 1px solid ${isDark ? 'rgba(255,209,102,0.20)' : 'rgba(255,183,3,0.20)'} !important;
  box-shadow: ${cardShadow} !important;
  color: ${bodyColor} !important;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

#silse-canvas .skin-layered-clean,
#silse-canvas .skin-layered-soft,
#silse-canvas .skin-layered-bold {
  border-radius: var(--silse-card-radius) !important;
  background: ${cardBg} !important;
  border: 1px solid ${cardBorder} !important;
  box-shadow: ${cardShadow} !important;
  color: ${bodyColor} !important;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}`;
}
