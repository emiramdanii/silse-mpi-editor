# Component Skin V2

Commit: `748b544`
Tanggal: 2026-06-29
Verifier: AI Dev (self-audit + automated test guard)

## Tujuan

Naikkan kualitas visual komponen agar SILSE tidak terasa generic. Component skin = tampilan visual komponen (class names), berbasis style pack + componentTone. Tidak mengubah content/layout/geometry.

## Visual Audit

| Komponen | Sebelum | Masalah | Skin V2 |
|---|---|---|---|
| Card | Inline styles, flat, generic | Terasa kotak biasa | 3 skin: flat (clean border+shadow), soft (rounded+gradient), bold (dark panel+glow) |
| Navigation | Inline styles, generic button | Tombol biasa | 3 skin: clean (solid), rounded (friendly gradient), mission (uppercase+glow) |
| Question | Inline styles, generic panel | Panel kuis biasa | 3 skin: calm (clean), playful (warm gradient), mission (dark challenge) |
| Game | Inline styles, generic panel | Panel game biasa | 3 skin: calm, playful, mission (same as quiz) |
| Learning Bridge | Inline styles, CSS variables | Bridge biasa | 2 skin: subtle (left border accent), strong (gradient+glow) |
| Layered Info | Inline styles | (priority 6 — not skinned in V2) | V3 nanti |
| Reflection/Text | Inline styles | (priority 7 — not skinned in V2) | V3 nanti |

## Skin Mapping

| Style Pack | Card | Button | Quiz | Bridge | Game |
|---|---|---|---|---|---|
| Modern Clean | skin-card-flat | skin-button-clean | skin-quiz-calm | skin-bridge-subtle | skin-game-calm |
| Soft Classroom | skin-card-soft | skin-button-rounded | skin-quiz-playful | skin-bridge-subtle | skin-game-playful |
| Mission Dark | skin-card-bold | skin-button-mission | skin-quiz-mission | skin-bridge-strong | skin-game-mission |

14 unique CSS classes (bridge-subtle shared by modern-clean + soft-classroom).

## Patch

| File | Perubahan | Alasan |
|---|---|---|
| src/core/style-packs/component-skin.ts (NEW) | Pure helper: getComponentSkinForStylePack, getSkinClassForComponent, getAllSkinClassNames | Resolve skin class dari style pack ID |
| src/components/CardComponentView.tsx |Tambah skinClass prop + className | Apply skin to card |
| src/components/NavigationComponentView.tsx | Tambah skinClass prop + className | Apply skin to button |
| src/components/QuestionComponentView.tsx | Tambah skinClass prop + className | Apply skin to quiz |
| src/components/GameComponentView.tsx | Tambah skinClass prop + className | Apply skin to game |
| src/components/LearningBridgeComponentView.tsx | Tambah skinClass prop + className | Apply skin to bridge |
| src/editor/CanvasStage.tsx | Pass skinClass to 5 components | Editor consistency |
| src/preview/PreviewApp.tsx | Pass skinClass to 5 components | Preview consistency |
| src/export/export-html.ts | skinClass field + populate + render + CSS | Export consistency |
| src/styles.css | 14 skin CSS classes | Visual styling |
| src/tests/component-skin-v2.test.tsx (NEW) | 29 test | Test guard |

## Safety Proof

- **content unchanged**: skin helper tidak punya akses ke content fields (text, body, prompt, choices, feedback) — verified by test + code audit ✓
- **objectives unchanged**: test 12 verify ✓
- **quiz answer unchanged**: test 13 verify correctChoiceIndex ✓
- **quiz feedback unchanged**: test 14 verify feedbackCorrect + feedbackWrong ✓
- **layout/geometry unchanged**: test 15 (layoutId) + test 16 (x/y/width/height) verify ✓
- **export consistency**: test 19-22 verify export HTML has skin class, differs between style packs, content unchanged ✓

## Tests

- **Helper (9 test)**: fallback, 3 style packs, 4 component skin changes, getAllSkinClassNames.
- **Content safety (8 test)**: page count, page order, text, objectives, quiz answer, quiz feedback, layoutId, geometry unchanged.
- **Editor/export (12 test)**: editor skin class, export skin class, export differs, content unchanged, quality not fatal, QA not fatal, PageThumbnail, no raw ID, contrast safe (mission-dark + soft-classroom).

Total: 29 test, all PASS.

## Verification

- **typecheck**: PASS
- **test**: 1964/1964 PASS (29 component-skin-v2 baru + 1935 existing)
- **build**: PASS (CSS 48.17→50.55kB, JS 420.80→424.98kB)

## Known Limitations

- Belum Canva background (di luar scope V2).
- Belum ilustrasi/icon pack.
- Belum screenshot diff (verify via automated test).
- Belum animation polish.
- Layered Info belum di-skin (priority 6 — V3 nanti).
- Reflection/text box belum di-skin (priority 7 — V3 nanti).
- Skin CSS classes pakai CSS variables tanpa hardcoded hex fallbacks (untuk avoid test conflicts dengan DIE-V1 bridge color guard). Aman karena `:root` selalu set variables di export HTML.
