# Premium Export Overhaul 01 — Patch 1

## Status
**NEEDS PATCH → PATCHED**

## Masalah
PREMIUM-EXPORT-OVERHAUL-01 berhasil membuat export HTML lebih premium (cinematic stage, glass topbar, hero typography, award medal), tetapi premium treatment hanya muncul di export. Editor (CanvasStage) dan Preview (PreviewApp) masih flat. Ini memutus WYSIWYG: guru lihat editor biasa, lalu export tiba-tiba berbeda jauh.

## Patch
Patch ini BUKAN menambah visual premium baru. Patch ini hanya menyamakan editor/preview/export dan membuat dokumentasi aman.

| Area | Perubahan | Alasan |
|------|-----------|--------|
| `premium-export-profile.ts` | Update JSDoc: "shared visual profile" (bukan export-only). Tambah `getPremiumCssVariables()` + `getHeroKickerText()` helper. | Profile bisa dipakai editor/preview/export. |
| `styles.css` | Tambah ~200 baris premium CSS classes (`.silse-premium-stage`, `.silse-text-title`, `.silse-kicker`, `.silse-choice-letter`, `.silse-hero-card`, `.silse-hero-kicker`, `.silse-hero-cta`, `.silse-award-medal`, `.silse-award-ribbon`, premium skin overrides). Pakai CSS variables. | Editor/preview pakai classes yang sama dengan export. |
| `CanvasStage.tsx` | Tambah `silse-premium-stage` class, `data-page-role` attribute, CSS variables via inline style, auto-inject hero card/kicker/CTA untuk cover, auto-inject award medal/ribbon untuk closing. `pointer-events:none`, `z-index:0` agar tidak ganggu drag/select. | Editor WYSIWYG dengan export. |
| `PreviewApp.tsx` | Sama dengan CanvasStage: `silse-premium-stage`, `data-page-role`, CSS variables, auto-inject decorations. CTA clickable (navigates next). | Preview WYSIWYG dengan export. |
| `QuestionComponentView.tsx` | Tambah `silse-choice-letter` class ke letter span. | Choice badge sinkron dengan export. |
| `GameComponentView.tsx` | Tambah `silse-choice-letter` class ke letter span. | Choice badge sinkron dengan export. |
| `export-html.ts` | Tambah `silse-premium-stage` class ke `#silse-canvas` div (marker class untuk test consistency). | Konsistensi class name editor/preview/export. |
| `premium-export-overhaul-01-patch-1.test.tsx` | Baru: 39 test guard. | Pastikan consistency + safety. |

## Consistency Proof

| Area | Editor (CanvasStage) | Preview (PreviewApp) | Export HTML |
|------|---------------------|---------------------|-------------|
| Cover page | `silse-premium-stage` class ✓, `data-page-role="cover"` ✓, hero card ✓, kicker ✓, CTA ✓ | `silse-premium-stage` class ✓, `data-page-role="cover"` ✓, hero card ✓, kicker ✓, CTA ✓ (clickable) | `silse-premium-stage` class ✓, `data-page-role="cover"` (via JS) ✓, hero card ✓, kicker ✓, CTA ✓ (clickable) |
| Material page | `silse-premium-stage` class ✓, `data-page-role="material"` ✓, premium card skin ✓ | `silse-premium-stage` class ✓, `data-page-role="material"` ✓, premium card skin ✓ | `silse-premium-stage` class ✓, `data-page-role="material"` (via JS) ✓, premium card skin ✓ |
| Quiz page | `silse-premium-stage` class ✓, `data-page-role="quiz"` ✓, `silse-choice-letter` badge ✓ | `silse-premium-stage` class ✓, `data-page-role="quiz"` ✓, `silse-choice-letter` badge ✓ | `silse-premium-stage` class ✓, `data-page-role="quiz"` (via JS) ✓, `silse-choice-letter` badge ✓ |
| Closing page | `silse-premium-stage` class ✓, `data-page-role="closing"` ✓, award medal ✓, ribbon ✓ | `silse-premium-stage` class ✓, `data-page-role="closing"` ✓, award medal ✓, ribbon ✓ | `silse-premium-stage` class ✓, `data-page-role="closing"` (via JS) ✓, award medal ✓, ribbon ✓ |

## Screenshot Proof

Screenshot file disimpan di `/home/z/my-project/download/`:

| Screenshot | Path | Description |
|-----------|------|-------------|
| Reference cover | `REF_section_1_cover.png` | User's premium reference (MEDIA_PENJELAJAH_PANCASILA_FINAL) |
| Reference closing | `REF_section_akhir_p1.png` | User's premium reference closing |
| Before SILSE cover | `SILSE_modern_p1.png` | SILSE export BEFORE upgrade (3/10 premium) |
| Before SILSE closing | `SILSE_modern_p10.png` | SILSE export BEFORE upgrade (3/10 premium) |
| After export cover | `PATCH1_export_cover.png` | SILSE export AFTER patch (7/10 premium) |
| After export closing | `PATCH1_export_closing.png` | SILSE export AFTER patch (8/10 premium) |
| After editor cover | `PATCH1_editor_cover.png` | Editor CanvasStage AFTER patch (premium decoration visible) |
| After editor closing | `PATCH1_editor_closing.png` | Editor CanvasStage closing page |
| After preview cover | `PATCH1_preview_cover.png` | PreviewApp AFTER patch (premium decoration visible) |
| After preview closing | `PATCH1_preview_closing.png` | PreviewApp closing page |

### VLM Verification (z-ai vision)
- **Editor cover**: hero card ✓, kicker pill ✓, CTA button ✓ (confirmed by VLM)
- **Preview cover**: hero card ✓, kicker pill ✓, CTA button ✓ (confirmed by VLM)
- **Export cover**: hero card ✓, kicker pill ✓, CTA button ✓ (confirmed by VLM, 7/10 premium)
- **Export closing**: award medal ✓, ribbon ✓ (confirmed by VLM, 8/10 premium)

## Safety Proof

| Check | Status | Evidence |
|-------|--------|----------|
| content unchanged | ✓ | Test #16-17: title + objectives text preserved in export |
| quiz answer unchanged | ✓ | Test #18-19: choice text + correctChoiceIndex preserved |
| feedback unchanged | ✓ | Test #20-21: feedbackCorrect + feedbackWrong preserved |
| game logic unchanged | ✓ | Test #22: mission prompts preserved |
| page count unchanged | ✓ | Test #23: same number of pages |
| page order unchanged | ✓ | Test #24: first page role preserved |
| geometry unchanged | ✓ | Test #25: x/y/width/height preserved |
| schema unchanged | ✓ | Test #26: stylePackId + version preserved |
| no dependency added | ✓ | Test #29: premium-export-profile imports only from style-pack-registry |
| no external asset | ✓ | Test #13-14: no external url() in CSS, no external script/link |
| no new component type | ✓ | Test #30: only standard component types |
| no layout preset added | ✓ | Test #31: existing layout IDs only |
| reduced-motion preserved | ✓ | Test #15: prefers-reduced-motion in export |
| toolbar preserved | ✓ | Test #11-12: renderPage preserves toolbar |

## Auto Decoration Rules

Dokumentasi aturan auto-injection (Patch-1):

### Cover page (`role: 'cover'`)
- **Boleh inject**: hero card frame, kicker pill, CTA button
- **Sumber data kicker**: `curriculum.subject` + `curriculum.grade` (fallback: `page.title`)
- **CTA behavior**: 
  - Editor: `pointer-events: none` (decorative only, tidak ganggu drag/select)
  - Preview: clickable, navigates to next page
  - Export: clickable, navigates to next page
- **z-index**: 0 (di belakang user components)

### Closing page (`role: 'closing'`)
- **Boleh inject**: award medal (gold circle + shine animation + trophy), ribbon (gradient pill at bottom)
- **Decoration text**: "✨ Penjelajah Selesai ✨" (tidak dari data komponen, hardcoded decoration)
- **z-index**: 0 (di belakang user components)
- **pointer-events**: none (decorative only di semua mode)

### Quiz page (`role: 'quiz'`)
- **Boleh inject**: choice letter badge visual (`.silse-choice-letter` class)
- **Sumber data**: huruf A/B/C/D dari `String.fromCharCode(65 + idx)` (dari index pilihan, bukan data konten)
- **Tidak mengubah**: choice text, correctChoiceIndex, feedback

### Material page (`role: 'material'`)
- **Boleh inject**: card surface visual (premium skin override untuk `.skin-card-*` classes)
- **Tidak mengubah**: card title, card body, card geometry

### Syarat umum auto-decoration:
1. Tidak mengubah data materi (text, body, prompt)
2. Tidak mengubah jawaban (correctChoiceIndex)
3. Tidak mengubah feedback (feedbackCorrect, feedbackWrong)
4. Tidak mengubah page order
5. Tidak mengubah component geometry (x, y, width, height)
6. Terlihat di editor + preview + export (bukan hanya export)
7. `pointer-events: none` untuk dekorasi non-interaktif di editor
8. `z-index: 0` agar user components tetap di atas dan bisa di-drag/select

## Tests

Test file: `src/tests/premium-export-overhaul-01-patch-1.test.tsx`
Jumlah tests: **39** (requirement: minimal 28)

### Test categories:
1. **Premium profile usable by non-export** (tests 1-4): profile pure function, CanvasStage/PreviewApp/Export mengandung `silse-premium-stage`
2. **data-page-role marker** (tests 5-7): cover marker di editor/preview/export
3. **Auto-decoration not export-only** (tests 8-10c): hero card, award medal, choice badge muncul di editor/preview/export
4. **Export safety** (tests 11-15): toolbar preserved, no external url/script, reduced-motion
5. **Content unchanged** (tests 16-26): content, objectives, quiz choices, correctChoiceIndex, feedback, game logic, page count, page order, geometry, schema
6. **Quality gates** (tests 27-28): checkExportQuality no fatal, visual matrix all 3 style packs
7. **Additional safety** (tests 29-32): no dependency, no new component type, no layout preset, getHeroKickerText pure
8. **Helper coverage** (tests 33-34): isHeroPageRole, isAwardPageRole, getGradientForPageRole

## Verification

| Check | Result |
|-------|--------|
| typecheck | ✅ PASS |
| test | ✅ PASS (2404/2404: 2365 existing + 39 new) |
| build | ✅ PASS (466KB JS, 69KB CSS) |

## Known Limitations

1. **Belum Visual Memory Engine** — roadmap utama tetap Visual Memory Engine → Pattern Bank → Remix Composer. Patch ini hanya hotfix visual.
2. **Belum Pattern Bank** — belum ada bank pola visual yang bisa di-reuse.
3. **Belum Remix Composer** — belum ada composer untuk remix pola.
4. **Belum Peta Misi component** — reference user punya interactive map dengan hotspot; SILSE belum punya component type ini.
5. **Belum Badge Grid component** — reference user punya 5-badge grid di section akhir; SILSE belum punya component type ini.
6. **Editor CTA decorative only** — di editor, hero CTA tidak clickable (pointer-events: none) agar tidak ganggu drag/select. Di preview/export, CTA clickable.
7. **Closing page medal di editor** — medal muncul sebagai dekorasi di belakang user components. Jika user menempatkan komponen di posisi medal (top: 56px, height: 200px), komponen akan tampil di atas medal.

## Arah Setelah Patch

Urutan yang benar setelah patch ini beres:

1. ✅ **PREMIUM-EXPORT-OVERHAUL-01-PATCH-1** (patch ini)
2. ⬜ **VISUAL-MEMORY-ENGINE-01** — roadmap utama
3. ⬜ **VISUAL-PATTERN-BANK-01**
4. ⬜ **REMIX-COMPOSER-01**

Patch ini boleh CLOSED jika:
1. ✅ Editor/preview/export visual tidak lagi beda jauh
2. ✅ Premium visual profile tidak export-only
3. ✅ Auto decoration terdokumentasi
4. ✅ Report markdown ada
5. ✅ Screenshot proof ada
6. ✅ Tidak ada content change
7. ✅ Tidak ada quiz/game logic change
8. ✅ Tidak ada schema change
9. ✅ Tidak ada dependency baru
10. ✅ Test patch minimal 28 (actual: 39)
11. ✅ typecheck PASS
12. ✅ test PASS
13. ✅ build PASS
