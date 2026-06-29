# Layout Preset System V1 Report

Commit: `LAYOUT-PRESET-SYSTEM-V1` commit
Tanggal: 2026-06-29
Verifier: AI Dev (audit via code reading + automated test guard)

## Tujuan

Sistem layout preset agar susunan halaman lebih matang. Guru tidak perlu menyusun halaman dari nol — pilih layout, isi tetap sama, susunan jadi lebih rapi. 8 preset siap pakai untuk cover, material, quiz, reflection, game, closing.

## Layout System Audit

| Area | File | Saat Ini | Gap | Keputusan |
|---|---|---|---|---|
| layoutId field | types.ts | `LayoutId` union: blank, coverCentered, singleColumn | Hanya 3, tidak ramah guru | TAMBAH 8 preset IDs (non-breaking) |
| Layout recipes (legacy) | core/layout-recipes.ts | 3 recipes (blank, coverCentered, singleColumn) dengan Record<LayoutId, LayoutRecipe> | Record type error setelah LAYOUT_IDS expand | UBAH ke Partial<Record> (non-breaking) |
| Layout recipes (DIE-V1) | core/design/layout-recipes.ts | 11 recipes per role dengan zones | OK, role-based | NO CHANGE |
| apply-design-recipe | core/design/apply-design-recipe.ts | applyPageDesignRecipe(page) — role-based positioning | OK | NO CHANGE |
| Generator | generate-mpi-from-topic.ts | Pakai layoutId='blank' + applyPageDesignRecipe | OK | NO CHANGE |
| Layout checker | core/design/layout-quality.ts | validateLayoutQuality(page) — OUT_OF_CANVAS, LARGE_OVERLAP, dll | OK | NO CHANGE |
| UI layout picker | (tidak ada) | Guru tidak bisa ganti layout dari UI | GAP | TAMBAH LayoutPresetPicker |
| Store action | editor-store.ts | Tidak ada applyLayoutPreset | GAP | TAMBAH applyLayoutPreset action |
| Export | export-html.ts | Baca x/y/width/height dari components | OK — layout changes propagate otomatis | NO CHANGE |

## Layout Contract

(see `docs/LAYOUT_PRESET_SYSTEM_V1.md`)

- Geometry only — hanya x/y/width/height + layoutId.
- No content mutation — tidak ubah text/objectives/quiz answer/page order/stylePackId.
- Role-aware fallback — unknown preset → default per role.
- Export consistency — export baca geometry, changes propagate otomatis.
- 16:9 safe — semua posisi dalam 1280×720.

## Registry

| Preset | Role | Intent | Notes |
|---|---|---|---|
| cover-centered | cover | cover | Judul + subtitle di tengah. |
| cover-split | cover | cover | Judul kiri, visual kanan. |
| material-two-column | material, learningObjectives, menu, guide | material | Judul atas, teks kiri, visual kanan, nav bawah-kanan. |
| material-card-stack | material, learningObjectives, menu, guide | material | Judul atas, body, kartu bertumpuk, nav bawah-kanan. |
| quiz-focus | quiz, starter | quiz | Pertanyaan besar di tengah, nav bawah-kanan. |
| reflection-calm | reflection | reflection | Box refleksi di tengah, nav bawah-kanan. |
| mission-map | activity | game | Game/aktivitas besar di tengah, nav bawah-kanan. |
| closing-centered | closing | closing | Rangkuman di tengah. |

## Patch yang Dilakukan

### Patch 1 — NEW registry `src/core/layout-presets/layout-preset-registry.ts`

- Pure data + functions, no React/DOM.
- Types: `LayoutPresetId`, `LayoutPresetIntent`, `LayoutPreset`.
- `LAYOUT_PRESETS`: 8 presets dengan supportedRoles + intent.
- `DEFAULT_PRESET_FOR_ROLE`: mapping setiap PageRole ke default preset.
- `listLayoutPresets()`, `getLayoutPreset(id?)`, `listLayoutPresetsForRole(role)`, `getDefaultLayoutPresetForRole(role)`, `getDefaultLayoutPresetIdForRole(role)`, `presetSupportsRole(presetId, role)`.
- Fallback: unknown ID → default per role.

### Patch 2 — NEW apply helper `src/core/layout-presets/apply-layout-preset.ts`

- Pure function, no mutation.
- `applyLayoutPresetToPage(page, presetId)` → new SimplePage with updated geometry.
- Slot-based positioning: setiap preset punya slot map (title, subtitle, body, question, game, card, nav, dll).
- Component classification by type + variant → placed in appropriate slot.
- Cards in card-stack: vertically stacked with 140px height + 20px gap.
- Unknown/unmatched components: keep original geometry (safe fallback).
- Role-aware: if preset doesn't support page role → fallback to default role preset.

### Patch 3 — Store action `applyLayoutPreset` (`src/store/editor-store.ts`)

- Import `applyLayoutPresetToPage`.
- `applyLayoutPreset(pageId, presetId)`: find page → applyLayoutPresetToPage → update page in project.
- Only updates one page. Does NOT touch content. Does NOT change selectedComponentId.

### Patch 4 — NEW UI picker `src/editor/LayoutPresetPicker.tsx`

- Tampil di Inspector saat tidak ada komponen terpilih.
- Label guru: "Susunan Halaman".
- Shows presets that support current page's role.
- Klik → `applyLayoutPreset(pageId, presetId)` → geometry berubah.
- `data-testid="layout-preset-picker"`, `data-testid="layout-preset-option-{id}"`, `data-selected`, `aria-pressed`.
- Tidak menampilkan raw ID sebagai teks utama.

### Patch 5 — Inspector integration (`src/editor/Inspector.tsx`)

- Import + render `<LayoutPresetPicker />` di empty state (after StylePackPicker).

### Patch 6 — Schema non-breaking addition (`src/core/types.ts`)

- `LAYOUT_IDS` ditambah 8 preset IDs: cover-centered, cover-split, material-two-column, material-card-stack, quiz-focus, reflection-calm, mission-map, closing-centered.
- Existing IDs (blank, coverCentered, singleColumn) tetap ada. Non-breaking.

### Patch 7 — Legacy layout-recipes fix (`src/core/layout-recipes.ts`)

- `LAYOUT_RECIPES` type changed from `Record<LayoutId, LayoutRecipe>` to `Partial<Record<LayoutId, LayoutRecipe>>`.
- Non-breaking: existing entries still work. New preset IDs return undefined (handled by new layout-presets system).

### Patch 8 — CSS (`src/styles.css`)

- `.layout-preset-picker` + `.layout-preset-picker__label` + `.layout-preset-picker__options`.
- `.layout-preset-option` + `.is-selected` (blue border + tinted bg).

### Patch 9 — Existing tests updated (`src/tests/layout-recipes.test.ts`)

- Tests updated untuk handle `Partial<Record>` (skip undefined entries, non-null assertions for known entries).

## Content Mutation Proof

- **text**: unchanged (test verify all text content)
- **objectives**: unchanged (test verify curriculum.objectives)
- **quiz answer**: unchanged (test verify correctChoiceIndex + feedbackCorrect + feedbackWrong)
- **page order**: unchanged (test verify page count + page order)
- **stylePackId**: unchanged (test verify stylePackId + style tokens not changed by layout preset)

## Tests

- **Registry (5 test)**: 8+ presets, unknown fallback, cover includes cover-centered, material includes material-two-column, default preset for all roles.
- **Apply helper (7 test)**: no mutation, id/title/role unchanged, component id/type unchanged, text unchanged, quiz answer unchanged, only geometry/layoutId changed, unknown fallback safe.
- **Layout quality (6 test)**: cover-centered, material-two-column, quiz-focus, reflection-calm, mission-map, closing-centered — all no OUT_OF_CANVAS.
- **Store/UI (6 test)**: store changes layoutId, store doesn't change page count, UI label "Susunan Halaman", UI shows role-matching presets, selecting preset changes layoutId, no raw ID as primary text.
- **Export/regression (6 test)**: export HTML changes after preset, export content unchanged, checkExportQuality not fatal after preset, PageThumbnail unchanged, style pack unchanged, layout preset doesn't change stylePackId.
- **Role support (5 test)**: cover-centered supports cover, material-two-column supports material, quiz-focus supports quiz, mission-map supports activity, cover-centered does NOT support material.

Total: 35 test, all PASS.

## Verification

- **typecheck**: PASS
- **test**: 1887/1887 PASS (35 layout-preset-system-v1 baru + 1843 existing + 9 esm-runtime-guard baru)
- **build**: PASS (CSS 46.20→47.04kB, JS 413.05→419.26kB)

## Known Limitations

1. **V1 slot sederhana** — slot-based positioning, bukan adaptive layout kompleks. Komponen ditempatkan berdasarkan type + variant ke slot yang sudah ditentukan.
2. **Belum adaptive layout kompleks** — tidak ada auto-flow, auto-resize, atau responsive breakpoints. V2 bisa tambah.
3. **Belum drag-free composition editor** — guru tidak bisa drag komponen bebas. Layout preset adalah pilihan siap pakai, bukan editor freeform.
4. **Belum Canva background** — di luar scope V1.
5. **Layout picker hanya di Inspector empty state** — tidak di Topbar. Cukup untuk V1.
6. **material-card-stack body slot** — body text ditempatkan di antara title dan card stack. Kalau ada terlalu banyak text + cards, bisa overflow. V1 aman untuk 1-2 text + 1-3 cards.
7. **cover-split visual slot** — image/card ditempatkan di kanan. Kalau tidak ada image/card, slot kosong (tidak error).
8. **Legacy LAYOUT_RECIPES tetap utuh** — hanya type yang berubah ke Partial. Existing code yang pakai getLayoutRecipe('blank') dll tetap berfungsi.
