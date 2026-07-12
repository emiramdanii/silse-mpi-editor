# SILSE MPI Editor — Project Status

**Last updated:** 2026-07-12
**Main branch:** `main` (commit `139ce16`)
**Test suite:** 3884+ passed, 4 skipped, 0 failed
**Drift:** 0 drifted (editor ↔ export CSS parity)

---

## Roadmap Summary

| Phase | Status | Commits | Description |
|---|---|---|---|
| Phase 0 | ✅ Complete | 8 | Emergency stop-the-bleeding (XSS, answer leak, customStyle drop) |
| Phase 5.9 | ✅ Complete | 5 | Pipeline consolidation (UNIFY adapter, dead code removal) |
| Fase 1 | ✅ Complete | 15 | Color system foundation (62 tokens, 0 hex outside :root) |
| Fase 2a | ✅ Complete | 3 | SceneRendererView editor interaction (drag/resize/select) |
| Fase 2b | ✅ Complete | 4 | Single render path (editor + preview + export unified) |
| Fase 3a | ✅ Complete | 6 | Premium CSS library SSOT (79 CSS rules extracted) |
| Fase 3b | ✅ Complete | 6 | Drift parity fix (25 drifted selectors → 0) |
| Level 2 | ✅ Complete | 4 | Layout (SceneGrid adoption, 10 grids, contract wiring) |
| Level 3 | ✅ Complete | 5 | Components (Tabs + Accordion bug fix, adoption, contract) |
| Level 4 | ✅ Complete | 3 | Behavior & Animation (sanitizer hardening, behavior model) |
| Level 5 | 🔜 Next | — | Ecosystem & Workflow (AI pipeline, templates) |

---

## Architecture Overview

### Single Source of Truth (SSOT) Layers

```
┌─────────────────────────────────────────────────────────┐
│                    AI JSON Input                         │
│  (customStyle: shell, header, panel, grid, tabs,        │
│   accordion, button, behavior, transition, animation)   │
└──────────────────────────┬──────────────────────────────┘
                           │
                    sanitizeCustomStyle()
                           │
           ┌───────────────┼───────────────┐
           │               │               │
     React Editor     Preview App    Export HTML
     (SceneRenderer    (SceneRenderer (generateCSS +
      View + Context)   View)         wireInteractions)
           │               │               │
     premiumCss.ts   premiumCss.ts   premiumCss.ts
     (shared CSS     (shared CSS     (shared CSS
      library)        library)        library)
           │               │               │
     styles.css      styles.css      export-html.ts
     + premium-      + premium-      :generateCSS()
      generated.css   generated.css
```

### Key Files

| File | Role | Lines |
|---|---|---|
| `src/core/style/premiumCss.ts` | SSOT for shared CSS (8 functions + 1 helper) | ~830 |
| `src/styles/premium-generated.css` | Auto-generated CSS (committed) | ~240 |
| `src/core/style/sanitize.ts` | CSS sanitizer (XSS guard, validators) | ~640 |
| `src/core/design/contrast.ts` | Contrast helpers (getContrastAwareTextColor) | ~110 |
| `src/components/SceneRendererView.tsx` | Unified React renderer (all 27 scene types) | ~1075 |
| `src/components/scene-blocks/index.tsx` | Reusable blocks (SceneGrid, SceneTabs, etc.) | ~710 |
| `src/components/scene-composers/index.tsx` | 22 scene composers | ~1520 |
| `src/export/export-html.ts` | Standalone HTML export | ~4070 |
| `src/export/scene-content-renderers.ts` | 5 inline scene renderers (export) | ~515 |
| `src/core/mpi-design-contract/` | Design contract (18 categories) | ~460 |
| `src/core/style-packs/motion-preset.ts` | 9 animation presets + reduced-motion | ~230 |

### Security Model

| Layer | Mechanism |
|---|---|
| XSS prevention | Global `url()` / `expression()` / `javascript:` guard in sanitizer |
| Layout safety | Forbidden properties (position, width, height, left, top, zIndex) |
| Animation safety | Preset-only animation names, block `infinite`, max 1s duration |
| Transition safety | Block `all`, max 1s, easing whitelist, max 3 declarations |
| Transform safety | translate ±100px, scale 0.8-1.2, rotate ±360deg, block matrix() |
| Filter safety | blur max 20px, block url() |
| Accessibility | `prefers-reduced-motion` disables all animations + behavior handlers |

### Design Contract Categories (18)

1. Frame 2. Palette 3. Background 4. Typography 5. Card 6. Button (5 variants)
7. Badge 8. Navigation 9. Quiz 10. Game 11. Learning 12. Feedback (4 variants)
13. Reward 14. Map/Hotspot 15. Motion (6 presets) 16. Tabs (L3) 17. Accordion (L3)
18. ~~Layout/Placement~~ (removed L2-3, YAGNI)

---

## Documentation Index

| Document | Scope |
|---|---|
| `docs/LAYOUT_STYLE_01.md` | Grid layout system (SceneGrid, customStyle.grid) |
| `docs/COMPONENT_STYLE_01.md` | Tabs + Accordion (customStyle.tabs/accordion) |
| `docs/BEHAVIOR_STYLE_01.md` | Animation + behavior (customStyle.behavior, transition) |
| `docs/STYLE_LAYOUT_UX_UNIFICATION_01.md` | Style + Layout UX unification |
| `docs/MICRO_ANIMATION_SYSTEM_V1.md` | Micro animation system (19 .silse-anim-* classes) |
| `docs/MOTION_PRESET_01.md` | Controlled premium motion (9 .silse-motion-* presets) |
| `docs/adr/0001-scene-custom-styles-as-ssot.md` | ADR: customStyle as SSOT |

---

## Test Suite

| Category | Files | Tests |
|---|---|---|
| Sanitizer | 4 | ~120 |
| Render parity | 6 | ~90 |
| Scene proof | 4 | ~100 |
| Component style | 3 | ~60 |
| Behavior style | 1 | 38 |
| Consolidation | 2 | 40 |
| Golden reference | 4 | ~50 |
| Other | 104 | ~3386 |
| **Total** | **128** | **~3884** |

---

## Dev Tools

| Tool | Command | Purpose |
|---|---|---|
| CSS generator | `npm run generate:css` | Regenerate premium-generated.css from premiumCss.ts |
| Drift checker | `node scripts/drift-check.mjs` | Verify 0 CSS drift between editor and export |
| Pointer audit | `npm run audit:pointer-events` | Scan for pointer-events issues |
| Typecheck | `npm run typecheck` | TypeScript strict mode check |
| Build | `npm run build` | Production build (tsc + vite) |
| Test | `npm test` | Full test suite (vitest) |

---

## Style Pack IDs

| ID | Name | Description |
|---|---|---|
| `default` | Default | SILSE default (warm cream + blue) |
| `modern-clean` | Modern Clean | Navy + crimson + gold (professional) |
| `soft-classroom` | Soft Classroom | Cream + peach + honey (warm friendly) |
| `mission-dark` | Mission Dark | Deep navy + steel + signal red (serious) |
| `golden-reference` | Golden Reference | Reference implementation for testing |
