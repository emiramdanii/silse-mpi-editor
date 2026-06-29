# Style Layout UX Unification 01

Commit: `STYLE-LAYOUT-UX-UNIFICATION-01` commit
Tanggal: 2026-06-29
Verifier: AI Dev (audit via code reading + automated test guard)

## Tujuan

Satukan kontrol Tampilan (style pack) dan Susunan (layout preset) agar guru tidak bingung. Guru harus memahami:
- Tampilan Media mengubah warna/gaya.
- Susunan Halaman mengubah posisi/susunan.
- Keduanya tidak mengubah isi materi.

Target rasa: guru tidak takut mencoba tampilan dan susunan karena tahu isi tidak akan berubah.

## UX Audit

| Area | UI Sebelum | Risiko | Patch |
|---|---|---|---|
| Inspector empty state | PageInfo + PatternLibraryPanel + StylePackPicker + LayoutPresetPicker (terpisah, tidak ada grouping) | Guru tidak tahu Style Pack beda dengan Layout Preset; tidak ada safety hint | Bungkus Style + Layout dalam section "Atur Tampilan Media" dengan hint + safety |
| StylePackPicker | Label "Tampilan Media" saja | Tidak ada penjelasan apa yang diubah | Tambah hint "Pilih warna dan nuansa media." di atas picker |
| LayoutPresetPicker | Label "Susunan Halaman" saja | Tidak ada penjelasan apa yang diubah | Tambah hint "Pilih susunan elemen di halaman ini." di atas picker |
| Safety reassurance | (tidak ada) | Guru takut mencoba karena tidak tahu apa yang akan berubah | Tambah "Aman dicoba: isi materi, kuis, dan tujuan tidak berubah." |

## Copy Final

- **Atur Tampilan Media** (section title)
- **Tampilan Media** (style pack picker label, existing)
- **Susunan Halaman** (layout preset picker label, existing)
- **Hint section**: "Ubah tampilan dan susunan tanpa mengubah isi materi."
- **Hint style**: "Pilih warna dan nuansa media."
- **Hint layout**: "Pilih susunan elemen di halaman ini."
- **Safety hint**: "Aman dicoba: isi materi, kuis, dan tujuan tidak berubah."

## Patch yang Dilakukan

### Patch 1 — NEW VisualSection wrapper (`src/editor/VisualSection.tsx`)

- Section wrapper yang menggabungkan StylePackPicker + LayoutPresetPicker.
- Header: title "Atur Tampilan Media" + hint + safety.
- Dua picker group, masing-masing dengan hint spesifik.
- `data-testid="visual-section"`, `data-testid="visual-section-safety"`.

### Patch 2 — Inspector integration (`src/editor/Inspector.tsx`)

- Ganti `<StylePackPicker />` + `<LayoutPresetPicker />` dengan `<VisualSection />`.
- Import VisualSection, hapus import StylePackPicker + LayoutPresetPicker langsung.

### Patch 3 — CSS (`src/styles.css`)

- `.inspector-visual-section` — bordered card, soft background.
- `.inspector-visual-section__title` — uppercase, bold.
- `.inspector-visual-section__hint` — muted text.
- `.inspector-visual-section__safety` — green-tinted badge.
- `.inspector-visual-section__pickers` — flex column gap.
- `.inspector-visual-section__picker-group` — flex column.
- `.inspector-visual-section__picker-hint` — italic muted.
- Override: pickers inside section don't repeat outer padding/bg.

## Safety Proof

- **style tidak ubah layout**: Test 7 — selecting style pack does not change `page.layoutId`.
- **layout tidak ubah style**: Test 8 — selecting layout preset does not change `project.stylePackId`.
- **style tidak ubah content**: Test 9 — selecting style pack does not change text content.
- **layout tidak ubah content**: Test 10 — selecting layout preset does not change text content.
- **export tetap berjalan**: Test 12 — export works after style + layout changed.
- **checkExportQuality not fatal**: Test 13 — no fatal issues after style + layout changed on generated PPKn.

## Tests

- **UI section (8 test)**: section exists, title "Atur Tampilan Media", hint about "tanpa mengubah isi materi", contains StylePackPicker, contains LayoutPresetPicker, style hint about warna/nuansa, layout hint about susunan/elemen, no raw ID as primary text, safety hint exists.
- **Safety isolation (4 test)**: style doesn't change layoutId, layout doesn't change stylePackId, style doesn't change text, layout doesn't change text.
- **Export/regression (3 test)**: export works after style+layout, checkExportQuality not fatal, PageThumbnail unchanged.

Total: 15 test, all PASS.

## Verification

- **typecheck**: PASS
- **test**: 1905/1905 PASS (15 style-layout-ux-unification baru + 1887 existing + 3 esm-runtime-guard baru)
- **build**: PASS (CSS 47.04→48.17kB, JS 419.26→420.28kB)

## Known Limitations

1. Section hanya tampil di Inspector empty state (saat tidak ada komponen terpilih). Tidak di Topbar.
2. Tidak ada preview live perubahan style/layout sebelum apply. Guru harus klik untuk lihat hasil.
3. Safety hint bersifat statis (teks), bukan dynamic verification. Test guard memverifikasi safety secara programatik.
4. Tidak ada undo untuk style/layout change. Guru bisa klik lagi untuk kembali ke preset lain.
5. Style pack picker dan layout preset picker tetap punya label masing-masing ("Tampilan Media" / "Susunan Halaman") sebagai sub-heading di dalam section — ini intentional untuk clarity.
