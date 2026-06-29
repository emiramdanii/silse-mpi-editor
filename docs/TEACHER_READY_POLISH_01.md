# Teacher Ready Polish 01

Commit: `TEACHER-READY-POLISH-01`
Tanggal: 2026-06-29
Verifier: AI Dev

## Tujuan

Polish bahasa, alur, empty state, dan export readiness untuk guru. Bukan fitur baru — hanya copy/label polish agar SILSE terasa siap dipakai guru biasa.

## UI Copy Audit

| Area | Sebelum | Masalah | Polish |
|---|---|---|---|
| Layout preset names | "Cover Tengah", "Cover Dua Kolom", "Kuis Fokus" | "Cover" istilah Inggris | "Sampul Tengah", "Sampul Dua Sisi", "Fokus Kuis" |
| VisualSection hint | "Ubah tampilan dan susunan tanpa mengubah isi materi" | Terlalu panjang | "Ganti gaya visual kapan saja. Materi, kuis, dan jawaban tetap aman." |
| VisualSection safety | "Aman dicoba: isi materi, kuis, dan tujuan tidak berubah." | Kurang natural | "Aman dicoba — perubahan tampilan tidak mengubah isi materi." |
| Export button title | "Export HTML standalone" | Istilah teknis | "Unduh HTML — bisa dibuka tanpa internet" |
| Empty state (PagePanel) | "untuk membuat draft media pembelajaran" | "draft" terasa belum final | "untuk membuat media pembelajaran lengkap dalam sekali klik" |
| Inspector empty state | "Tidak ada halaman terpilih." | Tanpa arahan | "Tidak ada halaman terpilih. Pilih halaman di panel kiri untuk mengatur tampilannya." |

## Teacher-Friendly Labels

| Internal ID | Label Guru | Catatan |
|---|---|---|
| modern-clean | Rapi & Profesional | Sudah dari PREMIUM-STYLE-PACK-V2 |
| soft-classroom | Hangat & Ramah | Sudah dari PREMIUM-STYLE-PACK-V2 |
| mission-dark | Misi Interaktif | Sudah dari PREMIUM-STYLE-PACK-V2 |
| cover-centered | Sampul Tengah | Diperbarui dari "Cover Tengah" |
| cover-split | Sampul Dua Sisi | Diperbarui dari "Cover Dua Kolom" |
| material-two-column | Materi Dua Kolom | Tidak berubah |
| material-card-stack | Materi Kartu Bertumpuk | Tidak berubah |
| quiz-focus | Fokus Kuis | Diperbarui dari "Kuis Fokus" |
| reflection-calm | Refleksi Tenang | Tidak berubah |
| mission-map | Peta Misi | Tidak berubah |
| closing-centered | Penutup Tengah | Tidak berubah |

## Patch

| File | Perubahan | Alasan |
|---|---|---|
| src/core/layout-presets/layout-preset-registry.ts | 3 layout name updates | Guru-friendly (Sampul, Fokus Kuis) |
| src/editor/VisualSection.tsx | Hint + safety copy polish | Lebih natural, guru-friendly |
| src/editor/Topbar.tsx | Export button title polish | "Unduh HTML — bisa dibuka tanpa internet" |
| src/editor/PagePanel.tsx | Empty state copy polish | "media pembelajaran lengkap dalam sekali klik" |
| src/editor/Inspector.tsx | Empty state copy polish | Tambah arahan "Pilih halaman di panel kiri" |
| src/tests/style-layout-ux-unification-01.test.tsx | Update test assertions untuk copy baru | Match new copy |
| src/tests/teacher-ready-polish-01.test.tsx (NEW) | 38 test guard | Label + safety + content + export |
| docs/TEACHER_READY_POLISH_01.md (NEW) | Report | Documentation |

## Safety Proof

- content unchanged: ✓
- objectives unchanged: ✓
- quiz answer unchanged: ✓
- feedback unchanged: ✓
- game logic unchanged: ✓
- layout geometry unchanged: ✓
- schema unchanged: ✓ (no id changed, no new pack/preset)
- export consistency: ✓

## Export Readiness Proof

- standalone HTML: ✓ (no external script/link)
- no external asset: ✓
- style/skin/background/animation included: ✓
- content remains: ✓

## Tests

- teacher-ready-polish-01: 38/38 PASS
- full suite: PASS

## Verification

- typecheck: PASS
- test: PASS
- build: PASS

## Known Limitations

1. Belum user testing guru langsung.
2. Belum screenshot diff.
3. Belum Playwright/browser visual proof.
4. CI GitHub belum tersedia.
