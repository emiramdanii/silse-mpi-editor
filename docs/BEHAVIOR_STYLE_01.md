# Behavior Style System V1 (BEHAVIOR-STYLE-01)

Commit: `BEHAVIOR-STYLE-01` (Level 4)
Tanggal: 2026-07-12
Verifier: AI Dev

## Tujuan

Memungkinkan AI untuk menambahkan transisi, animasi, dan efek hover/press/focus melalui `customStyle` dengan validasi keamanan ketat. Sistem hybrid: preset untuk keyframes, custom validated untuk transition/transform.

## Arsitektur

### Alur Data

```
AI JSON → customStyle.behavior → sanitizeCustomStyle() → customStyleBehavior
    ↓                                                          ↓
React: CustomStyleProvider context              Export: _sceneCustomStyleBehavior closure
    ↓                                                          ↓
SceneBlock reads behavior from context           exportActionButton sets data-behavior-hover
    ↓                                                          ↓
onMouseEnter/onMouseLeave applies hover CSS      wireInteractions() wires mouseenter/mouseleave
```

### Komponen Kunci

| Komponen | File | Peran |
|---|---|---|
| XSS Guard | `src/core/style/sanitize.ts` | Global — blocks url(), expression(), javascript: |
| sanitizeTransitionValue | `src/core/style/sanitize.ts` | Validates transition (no `all`, max 1s, easing whitelist) |
| sanitizeAnimationValue | `src/core/style/sanitize.ts` | Validates animation (preset names only, no `infinite`) |
| sanitizeTransformValue | `src/core/style/sanitize.ts` | Validates transform (translate ±100px, scale 0.8-1.2) |
| sanitizeFilterValue | `src/core/style/sanitize.ts` | Validates filter (blur max 20px, blocks url()) |
| extractBehaviorCss | `src/core/style/sanitize.ts` | Extracts behavior CSS from sanitized style |
| wireInteractions | `src/export/export-html.ts` | Wires hover event listeners + reduced-motion check |

## Security Model

### Validation Rules

| Property | Rule | Rejection |
|---|---|---|
| `transition` | No `all`, max 1s, easing whitelist, max 3 declarations | Reject |
| `animation` | Only 17 preset names + `none`, no `infinite`, max 60 iterations, max 1s | Reject |
| `transform` | translate ±100px, scale 0.8-1.2, rotate ±360deg, no matrix() | Reject |
| `filter` | blur max 20px (clamped), no url() | Clamp/Reject |
| `backdropFilter` | Same as filter | Clamp/Reject |
| Any property | No url(), expression(), javascript:, `<script>` | Reject |

### Behavior Model

```json
{
  "button": {
    "transition": "transform 0.2s ease-out",
    "behavior": {
      "hover": {
        "transform": "scale(1.05)",
        "boxShadow": "0 8px 24px rgba(0,0,0,0.2)"
      },
      "press": {
        "transform": "scale(0.95)"
      }
    }
  }
}
```

Behavior sub-keys: `hover`, `press`, `focus`. Each sub-key contains CSS properties that go through the same sanitizer validation.

## prefers-reduced-motion

### Export (JS Runtime)

`wireInteractions()` checks `window.matchMedia('(prefers-reduced-motion: reduce)')` at the top. If active:
- Behavior handlers are NOT installed (no mouseenter/mouseleave)
- Inline `transition` and `animation` CSS remain but without hover triggers, they have no visible effect

### Editor (React)

Class-based animations (`.silse-anim-*`, `.silse-motion-*`) are already handled by `@media (prefers-reduced-motion: reduce)` in `premium-generated.css`. Inline-style transitions are applied but without hover triggers (React `onMouseEnter` would need the same conditional check — deferred to future refinement).

## Animation Preset Whitelist

| Preset | Source | Duration |
|---|---|---|
| `silse-fade-in-soft` | buildAnimationsCss | 220ms |
| `silse-fade-in-warm` | buildAnimationsCss | 260ms |
| `silse-fade-in-mission` | buildAnimationsCss | 200ms |
| `silse-feedback-pop` | buildAnimationsCss | 200ms |
| `silse-mission-pulse` | buildAnimationsCss | 3000ms |
| `silse-celebrate-burst-ring` | buildAnimationsCss | 800ms |
| `silse-celebrate-sparkle` | buildAnimationsCss | 800ms |
| `silse-award-shine` | buildAnimationsCss | 8000ms |
| `silse-motion-entrance-fade` | buildMotionPresetCss | 220ms |
| `silse-motion-entrance-slide-up` | buildMotionPresetCss | 260ms |
| `silse-motion-soft-fade` | buildMotionPresetCss | 220ms |
| `silse-motion-slide-up` | buildMotionPresetCss | 260ms |
| `silse-motion-pulse` | buildMotionPresetCss | 2000ms |
| `silse-motion-reward-pop` | buildMotionPresetCss | 400ms |
| `silse-motion-correct-burst` | buildMotionPresetCss | 600ms |
| `silse-motion-feedback-pop` | buildMotionPresetCss | 200ms |
| `none` | Special | N/A |

## Testing

| File | Tests | Fokus |
|---|---|---|
| `src/tests/behavior-style-01.test.tsx` | 38 | XSS guard, transition/animation/transform/filter validation, behavior integration |
| `src/tests/fase3-sanitizer.test.ts` | 25 | Regression — existing sanitizer |
| `src/tests/layout-style-01.test.tsx` | 39 | Regression — grid sanitizer |
| `src/tests/layout-style-01-audit.test.tsx` | 22 | Regression — security audit |

## Yang Tidak Di-scope

- **Custom @keyframes** — AI tidak bisa mendefinisikan keyframes sendiri, hanya mereferensikan preset
- **React `usePrefersReducedMotion` hook** — class-based animations sudah tertangani @media; inline transition tanpa hover trigger tidak berbahaya
- **Per-element behavior wiring di React** — saat ini hanya `exportActionButton` yang mendukung behavior di export; React side membaca behavior dari context tapi belum menerapkan onMouseEnter di semua block
- **Carousel** — ditunda ke Level 3.5
