# Foundation Hardening 01

## Scope
FOUNDATION-HARDENING-01

## Commit
(latest commit after this report)

## Status
READY FOR SENIOR REVIEW

## Scope A — Schema Alignment
- Tambah `learning-material` ke `AiBlueprintSlotContent` di schema.ts.
- Validator menolak `content.kind` tidak dikenal (11 known kinds).
- Validator memvalidasi field wajib `learning-material`: `conceptTitle`, `explanation`.
- Validator menolak `learning-scene` tanpa slot `learning-material`.

## Scope B — Prompt Contract Alignment
- Tambah `learning-material` ke `slotKinds`.
- Ubah `requiredSlots` learning-scene: `explanationPanel` (composite slot resmi).
- Output rules menyebut `learning-material` dengan field wajib.

## Scope C — Design Contract Completion
- Tambah `DesignLearning` type ke design contract (keyPointPanel, studentActionPanel, visualHintPanel, explanationPanel, exampleCardStyle, exampleGridColumns).
- Tambah `learning` + `gameTokens` ke SceneRenderPlan (untuk export yang tidak akses contract langsung).
- Hilangkan hardcoded visual di material key point, student action, visual hint (SceneRendererView + export-html). Semua dari `contract.learning` / `plan.learning`.
- Hilangkan hardcoded visual di game target/action/reward (export-html pakai `plan.gameTokens`).

## Scope D — Product Source Decision

**Keputusan: SimpleProject tetap root. MpiContainer adalah adapter.**

Alasan:
1. SimpleProject adalah schema yang sudah teruji (2788 tests) dan dipakai oleh editor, store, storage, export.
2. MpiContainer adalah model data yang lebih kaya (scenes, slots, designSystem) untuk scene rendering.
3. Adapter `simpleProjectToMpiContainer` menjembatani keduanya (one-way, lossy untuk field belum ada).
4. AI JSON (AiMpiBlueprint) adalah format input eksternal. Converter `aiJsonToMpiContainer` mengubahnya ke container.
5. Jalur render: `SimpleProject → simpleProjectToMpiContainer → MpiContainer → renderScenePlan → SceneRendererView/export-html`.

Migrasi MpiContainer menjadi root internal app **bukan target saat ini**. Itu batch terpisah di luar Foundation Plan. Saat ini:
- Editor/store/storage tetap pakai SimpleProject.
- Scene renderer (CanvasStage/PreviewApp/export-html) pakai MpiContainer via adapter.
- Koeksistensi aman: page tanpa sceneMetadata tetap pakai legacy path (SimpleProject components[]).

## Scope E — Tests
- Test validator menolak unknown content.kind.
- Test validator menerima learning-material resmi.
- Test validator menolak learning-scene tanpa learning-material.
- Test prompt contract mencantumkan learning-material.
- Test material key point mengambil token contract (bukan hardcoded).
- Test material student action mengambil token contract.
- Test material visual hint mengambil token contract.
- Test export ikut memakai token yang sama (plan.learning).

## Verification
| Check | Result |
|-------|--------|
| typecheck | ✅ PASS |
| test | ✅ PASS — 2788/2788 |
| build | ✅ PASS |
