# Style Pack System V1

> Style pack = visual identity only. Bukan template konten. Bukan Canva clone.

## Aturan Style Pack

1. Style pack hanya visual — warna, tipografi, spacing, radius, shadow.
2. Style pack tidak boleh membawa materi/konten pembelajaran.
3. Style pack tidak boleh mengubah halaman (page count, page roles, page order).
4. Style pack tidak boleh mengubah komponen (type, variant, geometry, text).
5. Style pack tidak boleh mengubah jawaban kuis (correctChoiceIndex, feedbackCorrect/Wrong).
6. Style pack tidak boleh mengubah tujuan pembelajaran (curriculum.objectives).
7. Style pack harus konsisten editor-preview-export via resolver.
8. Unknown style pack ID harus fallback aman ke modern-clean.
9. Style pack harus menjaga keterbacaan (kontras teks >= 4.5:1 untuk teks utama).
10. Style pack tidak boleh membuat app jadi Canva clone (no freeform editing, no background image upload V1).

## Registry V1

3 style pack siap pakai:

| ID | Name | Mood | Use Case |
|---|---|---|---|
| `modern-clean` | Modern Clean | clean | Putih bersih, biru profesional. Cocok semua mapel. Default. |
| `soft-classroom` | Soft Classroom | soft | Hangat, ramah, pastel lembut. Cocok SD/SMP kelas rendah. |
| `mission-dark` | Mission Dark | mission | Gelap, tegas, berani. Cocok game/petualangan tema. |

Default: `modern-clean`. Unknown ID → fallback ke `modern-clean`.

## Implementasi

- Registry: `src/core/style-packs/style-pack-registry.ts`
- Store action: `setStylePack(stylePackId)` — updates `project.stylePackId` + `project.style.tokens`, does NOT touch pages/components/objectives.
- UI picker: `src/editor/StylePackPicker.tsx` — tampil di Inspector saat tidak ada komponen terpilih.
- Resolver: `resolveStylePackV1(id)` → concrete `StylePack` with tokens. Applied via existing `stylePackToProjectStyle` + `getResolvedComponentStyle`.
- Export: `export-html.ts` already reads `project.style.tokens` — style pack changes propagate automatically.

## Non-Content Mutation Proof

`setStylePack` hanya mengubah:
- `project.stylePackId` (string)
- `project.style.tokens` (colors, typography, spacing, radius, shadow)

Tidak menyentuh:
- `project.pages` (array, count, titles, roles, components)
- `project.curriculum` (objectives, subject, grade, phase, topic)
- `project.title`
- `project.id`
- `project.currentPageId`

Test guard memverifikasi semua ini.
