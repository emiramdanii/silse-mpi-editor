# GOLDEN-REFERENCE-PRODUCT-GATE-01 (+ PATCH A)

> Status: **READY FOR SENIOR REVIEW**
> Tanggal: 2026-07-01

## Tujuan

Membuktikan bahwa SILSE sudah bisa menghasilkan MPI utuh seperti alur golden reference
(12 scene), dari editor / preview / export.

Sample acuan: `samples/ai-mpi-json/macam-norma-reference.sample.json`.

## Scene Coverage

12 scene dari golden reference sample: Cover, CP/TP/ATP, Tujuan, Review, Materi,
Diskusi, Game Sortir, Hubungan, Quiz, Hasil, Refleksi, Penutup.

Pipeline: AI JSON → AiMpiBlueprint → SimpleProject (12 pages via bridge) →
MpiContainer (12 scenes) → renderScenePlan → CanvasStage / PreviewApp / export-html.

## Interaction Coverage

- Tabs CP/TP/ATP: PASS (data-tab-id + data-tab-panel + wireInteractions handler)
- Reveal: PASS (silse-reveal-body + silse-reveal-hint + .silse-block-reveal handler)
- Timer: PASS (data-action="timer-toggle" + data-running + data-remaining)
- Save response: PASS (data-action="save-response" + silse-saved-badge + textarea)
- Classification game: PASS (data-item-id + data-category + full interaction)

## Editor / Preview / Export Parity

- CanvasStage: PASS (12 scene via bridge)
- PreviewApp: PASS (12 scene via bridge)
- export-html: PASS (12 scene via bridge)

## Navigation

- Linear flow: PASS
- First scene = cover-hero: PASS
- Last scene = closing-award: PASS
- No orphan scene: PASS
- Export prev/next buttons: PASS

## Legacy Fallback

- Legacy project (createSamplePpknProject) export tanpa crash: PASS
- scenePlan:null hadir: PASS
- Invalid sceneType ditolak: PASS
- content.kind bukan scene selector: PASS
- No iframe/stylesheet-link/script-src: PASS

## Syarat Lanjut ke VISUAL-QUALITY-GUARD-01

Product gate lulus jika: typecheck + test + build PASS, 12 scene flow through
CanvasStage/PreviewApp/export-html, interaction gate lulus, regression gate lulus.

## Lampiran

Test: `src/tests/golden-reference-product-gate-01.test.tsx` — 49 tests (9 scopes).
