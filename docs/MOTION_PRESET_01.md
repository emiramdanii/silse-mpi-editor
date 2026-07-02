# MOTION-PRESET-01 — Controlled Premium Motion

Status: Implemented
Layer: `core/style-packs/motion-preset.ts` (pure function, no React/DOM)

## Goal

Provide a small, controlled, premium-feeling motion system for the SILSE MPI editor and its standalone HTML export. Motion is **light**, **scoped**, **never distracting**, and **always respects `prefers-reduced-motion`**.

This milestone implements the `contract.motion` preset names that were declared in the design contract but never had backing CSS keyframes.

## Scope (per senior reviewer)

- ✓ Hover lift on cards / buttons / chips
- ✓ Card transition (entrance fade + slide-up)
- ✓ Fade / slide entrance
- ✓ Feedback pop (on reveal blocks)
- ✓ Reward pop (on score summary)
- ✓ `prefers-reduced-motion` disables ALL motion
- ✓ Export parity (editor CSS === export CSS)
- ✓ NO new library (no framer-motion, no GSAP, no animejs)
- ✓ NO new scene type
- ✓ NO heavy schema (uses existing `DesignMotionPreset` names)

## Architecture

### Core API: `src/core/style-packs/motion-preset.ts`

Pure functions, no React/DOM, no store, no schema. Only imports `DesignMotionPreset` type from `mpi-design-contract`.

```ts
// Resolve a single preset to its CSS class (defensive — '' for unknown/none)
resolveMotionPresetClass(preset?: string): string

// Get the default motion profile (4 hook classes + 6 preset classes)
resolveMotionProfile(): MotionPresetProfile

// Enumerate every silse-motion-* class name (for parity audit)
getAllMotionClassNames(): string[]

// Build the full CSS block (used by export-html for parity)
buildMotionPresetCss(): string

// Stable default profile
DEFAULT_MOTION_PROFILE: MotionPresetProfile
```

### Class names (stable — locked by test 22)

| Hook / preset | Class name |
|---------------|------------|
| hover lift | `silse-motion-hover-lift` |
| entrance fade | `silse-motion-entrance-fade` |
| entrance slide-up | `silse-motion-entrance-slide-up` |
| feedback pop | `silse-motion-feedback-pop` |
| soft-fade preset | `silse-motion-soft-fade` |
| slide-up preset | `silse-motion-slide-up` |
| pulse preset | `silse-motion-pulse` |
| reward-pop preset | `silse-motion-reward-pop` |
| correct-burst preset | `silse-motion-correct-burst` |

### Keyframes (durations chosen for "premium but not slow")

| Animation | Duration | Easing |
|-----------|----------|--------|
| entrance fade | 220ms | ease-out |
| entrance slide-up | 260ms, 6px | ease-out |
| hover lift | 160ms transition | ease-out |
| soft fade | 220ms | ease-out |
| slide up | 260ms, 8px | ease-out |
| pulse (subtle, infinite) | 2000ms | ease-in-out |
| reward pop (scale) | 400ms | ease-out |
| correct burst (ring) | 600ms | ease-out |
| feedback pop | 200ms | ease-out |

### Reduced-motion

Every motion class is nullified under `@media (prefers-reduced-motion: reduce)`:
- All animations → `animation: none !important`
- `silse-motion-hover-lift` and its `:hover` → `transition: none !important; transform: none !important`

The visual end-state still applies, just without movement.

## Wiring

### React scene-blocks (`src/components/scene-blocks/index.tsx`)

The shared `MOTION` profile is resolved once at module load.

| Block | Motion classes applied |
|-------|------------------------|
| `SceneHeader` | `silse-motion-entrance-slide-up` |
| `ScenePanel` | `silse-motion-entrance-fade` + `silse-motion-hover-lift` |
| `SceneChip` | `silse-motion-hover-lift` |
| `ActionButtonBlock` | `silse-motion-hover-lift` (replaced inline `onMouseEnter`/`Leave`) |
| `RevealBlock` | `silse-motion-feedback-pop` (when `revealed`) |
| `ScoreSummaryBlock` | `silse-motion-reward-pop` |

### Export HTML (`src/export/export-html.ts`)

The full motion CSS block is inlined in the export HTML's `<style>` tag — same keyframes, same class definitions, same `prefers-reduced-motion` block. Editor and export are 1:1.

| Export builder | Motion classes attached |
|----------------|-------------------------|
| `exportHeader` | `silse-motion-entrance-slide-up` |
| `exportPanel` | `silse-motion-entrance-fade` + `silse-motion-hover-lift` |
| `exportActionButton` | `silse-motion-hover-lift` |
| `exportRevealBlock` | `silse-motion-feedback-pop` (when `revealed`) |
| `exportScoreSummary` | `silse-motion-reward-pop` |

## Tests (`src/tests/motion-preset-01.test.tsx` — 22 tests)

| Scope | Tests | What's covered |
|-------|-------|----------------|
| A: core API | 5 | helper exists, resolves each preset, handles undefined/unknown, profile shape, all class names |
| B: CSS | 3 | `buildMotionPresetCss()` returns keyframes + classes + reduced-motion block; `styles.css` has the same block |
| C: React wiring | 6 | each block attaches the right class; `ActionButtonBlock` no longer uses inline `onMouseEnter`/`Leave` |
| D: export parity | 3 | export HTML contains every motion class; has reduced-motion block; export builders attach classes |
| E: discipline | 5 | no forbidden lib imports, no React/DOM in motion-preset.ts, no schema bloat, no new sceneType, stable class names |

## Verification

- typecheck: PASS
- test: 3358/3358 PASS (was 3333, +25 net: 22 motion-preset + 3 from updated micro-animation test boundary)
- build: PASS (CSS 71.17 kB, JS 794.72 kB)

## Out of scope (deliberately not done)

- No per-style-pack motion variation (modern-clean / soft-classroom / mission-dark all use the same motion profile). Reason: keep CSS small, motion is mood-agnostic.
- No motion on individual scene composers — they compose blocks, so they inherit motion from `SceneShell`/`ScenePanel`/`SceneHeader`.
- No `contract.motion` runtime CSS generation — the contract field stays as a *declaration* of intent; actual keyframes live in `styles.css` + export `<style>` for parity and auditability.
- No motion timing inspector UI in the editor.
- No new dependencies.
