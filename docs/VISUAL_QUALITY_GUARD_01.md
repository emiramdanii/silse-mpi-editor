# BASELINE-SYNC-AND-VISUAL-GUARD-RETRY-01

> Status: **READY FOR SENIOR REVIEW**
> Tanggal: 2026-07-01

## Tujuan

Senior reviewer HOLD VISUAL-QUALITY-GUARD-01 karena dikerjakan di base repo yang
mundur (c0a65fa / GOLDEN-REFERENCE-RENDER-P1). Base repo belum memuat:
- GOLDEN-REFERENCE-INTERACTION-P1
- GOLDEN-REFERENCE-GAME-P1
- GOLDEN-REFERENCE-PRODUCT-GATE-01 PATCH A

Batch ini mensinkronkan base repo dengan re-apply semua batch yang hilang, lalu
mengerjakan ulang VISUAL-QUALITY-GUARD-01 di base yang benar.

---

## Base Verification

| Check | Status |
|-------|--------|
| latest game commit present (classification-game renderer) | **PASS** |
| product gate patch A present (aiBlueprintToSimpleProject bridge) | **PASS** |
| aiBlueprintToSimpleProject present | **PASS** |
| classification-game composer present | **PASS** |
| export wireInteractions present | **PASS** |
| export emit data-tab-id | **PASS** |
| export emit data-action="timer-toggle" | **PASS** |
| export emit data-action="save-response" | **PASS** |
| export emit data-item-id + data-category | **PASS** |

### Re-applied batches:

1. **GOLDEN-REFERENCE-RENDER-P1 PATCH A** (export parity): export block helpers
   (exportShell, exportHeader, exportPanel, exportTabs, exportTabPanel,
   exportDiscussionBanner, exportTimerBlock, exportResponseInput, exportRevealBlock,
   exportScoreSummary, exportActionButton, exportPortfolio) + 7 scene export renderers.
2. **GOLDEN-REFERENCE-RENDER-P1 PATCH B** (routing cleanup): SceneRendererView routes
   by sceneType to composers (getSceneComposer function).
3. **GOLDEN-REFERENCE-INTERACTION-P1**: wireInteractions() in export-html with 5 click
   handlers (tab, reveal, save-response, timer-toggle, classification-game).
4. **GOLDEN-REFERENCE-GAME-P1**: ClassificationGameComposer + classification-game export
   renderer + classification-game interaction in wireInteractions.
5. **GOLDEN-REFERENCE-PRODUCT-GATE-01**: aiBlueprintToSimpleProject bridge +
   SimplePage.sceneType/sceneContent/scenePlacement/sceneSlotRole fields +
   simpleProjectToMpiContainer honors sceneType override + isPageSceneRenderable
   honors page.sceneType.
6. **GOLDEN-REFERENCE-PRODUCT-GATE-01 PATCH A**: export emit fix — all interactive
   elements emit data-attrs (data-tab-id, data-action="timer-toggle",
   data-action="save-response", data-item-id, data-category, data-tab-panel).
   Export buttons emit min-height:44px (action/timer/save) and min-height:40px
   (tab/classification item).

---

## Product Gate Recheck

| Check | Status |
|-------|--------|
| 12 scene SimpleProject (via bridge) | **PASS** |
| CanvasStage 12 scene (via bridge) | **PASS** |
| PreviewApp 12 scene (via bridge) | **PASS** |
| export-html 12 scene (via bridge) | **PASS** |

Tests: `src/tests/baseline-sync-product-gate.test.tsx` — 18 tests, all PASS.

Pipeline lengkap: AI JSON → AiMpiBlueprint → SimpleProject (12 pages) →
MpiContainer (12 scenes) → renderScenePlan → CanvasStage / PreviewApp / export-html.

---

## Visual Quality Guard

| Guard | Status |
|-------|--------|
| design contract source | **PASS** (visual dari contract / resolvedStyle, no tokens.ts paralel) |
| safe zone | **PASS** (48px, 12 scene main slots within safe zone) |
| grid alignment | **PASS** (8px, 16 placement fix di sample JSON) |
| typography | **PASS** (heading >= 28px/600, body >= 16px/1.4, caption >= 12px; golden-reference titleWeight 400→700) |
| contrast | **PASS** (WCAG 2.1 AA — body text + button untuk 5 contracts) |
| touch target | **PASS** (export emit min-height:44px for buttons, min-height:40px for tab/classification items) |
| preview/export parity | **PASS** (12 scene class hadir di CanvasStage + PreviewApp + export-html via bridge) |

Tests: `src/tests/visual-quality-guard-01.test.tsx` — 26 tests, all PASS.

### Touch target status — HONEST

Sebelumnya touch target diberi status PASS padahal button padding hanya ~34px.
Sekarang export HTML emit `min-height:44px` untuk action/timer/save buttons dan
`min-height:40px` untuk tab/classification items. Status **PASS** karena export
emit sudah memenuhi rule.

---

## Verification

| Step | Status |
|------|--------|
| typecheck | **PASS** |
| test | **PASS** (2917/2917) |
| build | **PASS** (CSS 69.18 kB, JS 607.91 kB) |

---

## Files Changed

### New files:
- `src/core/ai-mpi-json/aiBlueprintToSimpleProject.ts` — bridge pure function.
- `src/core/visual-quality-guard/index.ts` — pure helpers (safe zone, grid, typography, contrast, touch target).
- `src/tests/baseline-sync-product-gate.test.tsx` — 18 tests (bridge + 12 scene app gate + classification game + export emit + regression).
- `src/tests/visual-quality-guard-01.test.tsx` — 26 tests (9 scopes).
- `docs/VISUAL_QUALITY_GUARD_01.md` — visual quality guard documentation.

### Modified files:
- `src/core/types.ts` — SimplePage + 4 optional fields (sceneType, sceneContent, scenePlacement, sceneSlotRole).
- `src/core/mpi-container/simpleProjectToMpiContainer.ts` — honor sceneType override.
- `src/core/scene-renderer/sceneDetection.ts` — isPageSceneRenderable honors page.sceneType.
- `src/core/ai-mpi-json/index.ts` — export aiBlueprintToSimpleProject.
- `src/core/mpi-design-contract/defaultDesignContract.ts` — golden-reference titleWeight 400→700.
- `src/components/SceneRendererView.tsx` — composer routing by sceneType (PATCH B) + ClassificationGameComposer.
- `src/components/scene-composers/index.tsx` — ClassificationGameComposer added.
- `src/export/export-html.ts` — export block helpers + 8 scene renderers + sceneType routing + wireInteractions + export emit fix (data-attrs + min-height).
- `src/tests/golden-reference-render-p1.test.tsx` — legacy fallback test updated (scenePlan:null check instead of class name absence).
- `samples/ai-mpi-json/macam-norma-reference.sample.json` — 16 placement fix to 8px grid.

---

## Not Done

Hal yang sengaja belum dikerjakan (ditunda ke `PREMIUM-STYLE-AFTER-FOUNDATION-01`):

1. **15 scene type contract-only masih belum punya renderer.** Hanya 5 rendered + 7 priority + classification-game yang ada.
2. **Editor Inspector belum bisa edit sceneContent secara visual.** Bridge menghasilkan pages dengan sceneContent sebagai blob data.
3. **Tombol prev/next eksplisit di editor/preview UI belum ada.** Navigasi masih via currentPageId di store.
4. **Premium style** ditunda sampai visual guard ini diterima.

---

## Final Status
**READY FOR SENIOR REVIEW**
