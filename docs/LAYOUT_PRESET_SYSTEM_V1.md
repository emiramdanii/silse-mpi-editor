# Layout Preset System V1

> Layout preset = susunan halaman (geometry only). Bukan template konten. Bukan Canva/freeform design editor.

## Aturan Layout Preset

1. Layout preset hanya mengubah posisi dan ukuran komponen (x/y/width/height + layoutId).
2. Layout preset tidak boleh mengubah teks.
3. Layout preset tidak boleh mengubah objectives.
4. Layout preset tidak boleh mengubah jawaban kuis (correctChoiceIndex, feedbackCorrect/Wrong).
5. Layout preset tidak boleh mengubah jumlah halaman.
6. Layout preset tidak boleh mengubah urutan halaman.
7. Layout preset harus menjaga semua elemen tetap dalam area 16:9 (1280×720).
8. Layout preset harus editor-preview-export consistent (export baca x/y/width/height).
9. Unknown layout preset harus fallback aman ke default preset berdasarkan page.role.
10. Layout preset bukan Canva/freeform design editor.

## Registry V1

8 layout preset siap pakai:

| ID | Name | Intent | Supported Roles |
|---|---|---|---|
| `cover-centered` | Cover Tengah | cover | cover |
| `cover-split` | Cover Dua Kolom | cover | cover |
| `material-two-column` | Materi Dua Kolom | material | material, learningObjectives, menu, guide |
| `material-card-stack` | Materi Kartu Bertumpuk | material | material, learningObjectives, menu, guide |
| `quiz-focus` | Kuis Fokus | quiz | quiz, starter |
| `reflection-calm` | Refleksi Tenang | reflection | reflection |
| `mission-map` | Peta Misi | game | activity |
| `closing-centered` | Penutup Tengah | closing | closing |

Default: role-aware fallback. Unknown ID → `getDefaultLayoutPresetForRole(role)`.

## Perbedaan dengan Style Pack

- **Style Pack** = tampilan visual (warna, tone, tipografi). Tidak ubah posisi.
- **Layout Preset** = susunan halaman (posisi, ukuran). Boleh ubah posisi, tidak ubah isi.
- **Ganti Style Pack** → posisi tidak berubah.
- **Ganti Layout Preset** → posisi berubah, isi tidak berubah.

## Implementasi

- Registry: `src/core/layout-presets/layout-preset-registry.ts`
- Apply helper: `src/core/layout-presets/apply-layout-preset.ts` — pure function, slot-based positioning
- Store action: `applyLayoutPreset(pageId, presetId)` — updates page.layoutId + component geometry, does NOT touch content
- UI picker: `src/editor/LayoutPresetPicker.tsx` — tampil di Inspector saat tidak ada komponen terpilih
- Export: `export-html.ts` sudah baca x/y/width/height → layout changes propagate otomatis
- Schema: `LAYOUT_IDS` di types.ts ditambah 8 preset IDs (non-breaking, existing IDs tetap ada)

## Non-Content Mutation Proof

`applyLayoutPresetToPage` hanya mengubah:
- `page.layoutId` (string)
- `component.x`, `component.y`, `component.width`, `component.height` (numbers)

Tidak menyentuh:
- `page.id`, `page.title`, `page.role`
- `component.id`, `component.type`
- `component.text`, `component.body`, `component.title` (content fields)
- `component.prompt`, `component.choices`, `component.correctChoiceIndex`, `component.feedbackCorrect/Wrong`
- `project.pages` array (count, order)
- `project.curriculum.objectives`
- `project.stylePackId`, `project.style`

Test guard memverifikasi semua ini.
