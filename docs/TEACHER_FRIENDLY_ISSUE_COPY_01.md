# Teacher Friendly Issue Copy 01

Commit: `TEACHER-FRIENDLY-ISSUE-COPY-01` commit
Tanggal: 2026-06-29
Verifier: AI Dev (audit via code reading + automated test guard)

## Tujuan

Mengubah pesan teknis menjadi arahan yang membantu guru. Ketika guru melihat warning/error, guru tidak merasa membaca log developer — guru merasa SILSE sedang membantu memperbaiki media.

## Surfaces yang Diaudit

| Surface | Sebelum | Setelah | Status |
|---|---|---|---|
| Export confirm message | Raw `issue.message` dengan ✗/⚠ prefix | Friendly title + message + "Saran: ..." per issue | UPDATED |
| Alignment detail panel | `issue.message` sebagai teks utama, `issue.code` sebagai chip | Friendly title sebagai teks utama, message + suggestion di bawah, code sebagai chip kecil | UPDATED |
| Page status (mpi-page-status) | Wording sudah ramah guru (Indonesian) | Tidak diubah (sudah baik) | AUDITED, NO CHANGE |
| GuidedFlowDialog quality result | Wording sudah ramah guru | Tidak diubah | AUDITED, NO CHANGE |
| MPI standard warnings | Wording sudah ramah guru (Indonesian) | Tidak diubah (checker logic tidak diubah) | AUDITED, NO CHANGE |
| Layout warnings | Wording teknis (x/y coordinates, percentages) | Tidak diubah di checker; friendly copy di-mapping di export/alignment UI | AUDITED, MAPPED |
| Alignment warnings | Wording teknis ("tidak di-address", "duplikat (id: ...)") | Tidak diubah di checker; friendly copy di-mapping di export/alignment UI | AUDITED, MAPPED |
| Visual readability warnings | Wording teknis ("kontras rendah (2.1:1, minimum 4.5:1)") | Tidak diubah di checker; friendly copy di-mapped | AUDITED, MAPPED |

## Mapping Copy

### Alignment Codes

| Code | Friendly Title | Friendly Message | Suggestion |
|---|---|---|---|
| NO_OBJECTIVES | Tujuan pembelajaran belum diisi | Media belum memiliki tujuan pembelajaran. | Isi tujuan pembelajaran agar materi, aktivitas, dan refleksi bisa dicek kesesuaiannya. |
| OBJECTIVE_NOT_COVERED | Ada tujuan yang belum tercover | Ada tujuan pembelajaran yang belum muncul di materi, aktivitas, kuis, atau refleksi. | Tambahkan contoh, penjelasan, pertanyaan, atau refleksi yang sesuai dengan tujuan tersebut. |
| OBJECTIVE_DUPLICATE_ID | Ada tujuan pembelajaran ganda | Ada ID tujuan pembelajaran yang duplikat. | Periksa daftar tujuan pembelajaran agar setiap tujuan memiliki penanda unik. |
| OBJECTIVE_TOO_SHORT | Tujuan pembelajaran terlalu umum | Ada tujuan pembelajaran yang terlalu pendek atau terlalu umum. | Tulis tujuan lebih spesifik, misalnya menggunakan kata kerja dan konteks materi. |
| ASSESSMENT_NOT_LINKED | Kuis belum terhubung ke tujuan | Ada kuis atau cek pemahaman yang belum jelas hubungannya dengan tujuan pembelajaran. | Sesuaikan pertanyaan agar memuat kata kunci atau kemampuan yang ada di tujuan. |
| MATERIAL_NOT_LINKED | Materi belum terhubung ke tujuan | Ada halaman materi yang belum jelas hubungannya dengan tujuan pembelajaran. | Tambahkan penjelasan, contoh, atau kata kunci sesuai tujuan. |
| REFLECTION_NOT_LINKED | Refleksi belum terhubung ke tujuan | Ada refleksi yang belum mengajak siswa kembali ke tujuan pembelajaran. | Ubah pertanyaan refleksi agar siswa menghubungkan materi dengan tindakan atau pemahaman. |

### Layout Codes

| Code | Friendly Title | Friendly Message | Suggestion |
|---|---|---|---|
| OUT_OF_CANVAS | Ada elemen keluar layar | Ada elemen yang berada di luar area 16:9. | Geser atau kecilkan elemen agar tetap terlihat saat diproyeksikan. |
| LARGE_OVERLAP | Ada elemen saling menumpuk | Ada elemen yang saling menutupi dan bisa mengganggu keterbacaan. | Rapikan posisi elemen atau beri jarak antar komponen. |
| TOO_DENSE | Halaman terlalu padat | Ada halaman yang berisi terlalu banyak elemen. | Kurangi elemen, ringkas teks, atau bagi materi ke halaman lain. |
| TOO_CLOSE_EDGE | Elemen terlalu dekat tepi | Ada elemen yang terlalu mepet tepi layar. | Geser elemen ke tengah agar aman saat ditampilkan di proyektor. |
| TOO_SMALL | Elemen terlalu kecil | Ada elemen yang ukurannya terlalu kecil. | Perbesar elemen agar terlihat jelas dari jarak jauh. |
| NAV_AT_EDGE | Tombol navigasi terlalu mepet tepi | Tombol navigasi terlalu dekat dengan tepi bawah layar. | Naikkan tombol navigasi sedikit agar mudah dijangkau. |

### Visual (pattern-matched)

| Pattern | Friendly Title | Friendly Message | Suggestion |
|---|---|---|---|
| "kontras rendah" | Teks sulit dibaca | Ada teks yang kontrasnya terlalu rendah dengan latar. | Gunakan warna teks yang lebih terang/gelap atau tambahkan overlay latar. |

### MPI Standard (pattern-matched)

| Pattern | Friendly Title | Friendly Message | Suggestion |
|---|---|---|---|
| "umpan balik" / "feedback" | Umpan balik kuis belum lengkap | Ada pertanyaan yang belum memiliki umpan balik benar/salah yang cukup. | Tambahkan umpan balik singkat agar siswa tahu alasan jawabannya. |
| "navigasi" | Navigasi halaman belum lengkap | Ada halaman yang belum memiliki arahan lanjut. | Tambahkan tombol atau petunjuk agar guru/siswa tahu langkah berikutnya. |
| "cover" | Halaman pembuka belum lengkap | Media belum memiliki halaman pembuka yang jelas. | Tambahkan judul, mapel, kelas, atau pengantar singkat. |
| "tujuan pembelajaran" | Halaman tujuan belum lengkap | Media belum menampilkan tujuan pembelajaran dengan jelas. | Tambahkan halaman atau komponen tujuan pembelajaran. |
| "materi" | Materi belum lengkap | Media belum memiliki halaman materi yang cukup. | Tambahkan ringkasan materi, contoh, atau penjelasan inti. |
| "kuis" / "cek pemahaman" | Cek pemahaman belum ada | Media belum memiliki pertanyaan untuk membantu siswa menguji pemahaman. | Tambahkan satu pertanyaan ringan agar siswa bisa mengecek diri. |
| "aktivitas" / "game" | Aktivitas interaktif belum ada | Media belum memiliki aktivitas atau game untuk memperkuat pemahaman. | Tambahkan satu game atau latihan interaktif sederhana. |
| "panduan" | Halaman panduan belum ada | Media belum memiliki halaman panduan penggunaan. | Tambahkan halaman panduan singkat agar siswa tahu cara belajar. |
| "menu" | Halaman menu belum ada | Media belum memiliki halaman menu materi. | Tambahkan halaman menu agar siswa bisa melihat peta pembelajaran. |
| "penutup" | Halaman penutup belum ada | Media belum memiliki halaman penutup. | Tambahkan halaman penutup dengan rangkuman atau ucapan terima kasih. |
| "refleksi" | Halaman refleksi belum lengkap | Ada halaman refleksi yang belum memiliki konten. | Tambahkan pertanyaan refleksi yang mengajak siswa merenungkan pembelajaran. |
| "pemantik" | Halaman pemantik belum lengkap | Ada halaman pemantik yang belum memiliki konten. | Tambahkan pertanyaan pemantik agar siswa mulai berpikir tentang materi. |
| "kurikulum" / "mapel" / "kelas" / "fase" / "topik" | Identitas kurikulum belum lengkap | Media belum memiliki identitas kurikulum yang lengkap. | Isi mapel, kelas, fase, dan topik agar media mudah diidentifikasi. |

### Fallback (unknown issues)

| Code | Friendly Title | Friendly Message | Suggestion |
|---|---|---|---|
| (unknown) | Ada yang perlu diperhatikan | Ada hal yang perlu diperiksa pada media pembelajaran ini. | Periksa halaman terkait dan lengkapi konten sesuai kebutuhan. |

## Patch yang Dilakukan

### Patch 1 — NEW pure core helper `src/core/teacher-friendly-issue-copy.ts`

- Pure function, no React, no editor imports.
- Types: `TeacherFriendlyIssueInput`, `TeacherFriendlyIssueCopy`.
- Functions: `getTeacherFriendlyIssueCopy(issue)`, `formatTeacherFriendlyIssueLine(issue)`, `formatTeacherFriendlyIssueBlock(issue)`.
- Mapping: by code (13 codes) + pattern matching (14 patterns) + fallback.
- Pure: does not mutate input.

### Patch 2 — `formatExportQualityMessage` integration (`src/core/export-quality-gate.ts`)

- Import `getTeacherFriendlyIssueCopy`.
- Format fatal/warning issues: friendly title + message + "Saran: ..." per issue.
- Format summary: "Ringkasan:" + "Skor Layout" + "Tujuan tercover" + "Skor Alignment".
- Raw code tidak muncul sebagai teks utama.

### Patch 3 — `AlignmentPanel.tsx` integration

- Import `getTeacherFriendlyIssueCopy`.
- Issue rendering: `copy.title` as primary text, `copy.message` as secondary, "Saran: `copy.suggestion`" as suggestion, `issue.code` as small meta chip.
- Click behavior unchanged (still calls `handleIssueClick(issue.pageId)`).

### Patch 4 — CSS for new classes (`src/styles.css`)

- `.alignment-detail__item-message` — 12px muted.
- `.alignment-detail__item-suggestion` — 12px normal.

## UX Copy Rules

1. **Raw code bukan teks utama** — `OBJECTIVE_NOT_COVERED`, `OUT_OF_CANVAS`, dll. hanya muncul sebagai chip/meta kecil.
2. **Setiap pesan utama punya saran** — "Saran: ..." di setiap issue.
3. **Bahasa Indonesia** — semua title/message/suggestion dalam bahasa Indonesia.
4. **Fallback aman** — unknown code/pattern menghasilkan "Ada yang perlu diperhatikan" + saran umum.
5. **Tidak ada jargon teknis** — `undefined`, `null`, `schema`, `componentId`, `pageId`, `heuristic`, `qualityReport`, `LayoutQualityResult` tidak muncul sebagai teks utama.

## Tests

- **Helper (11 test)**: OBJECTIVE_NOT_COVERED, OBJECTIVE_DUPLICATE_ID, NO_OBJECTIVES, ASSESSMENT_NOT_LINKED, MATERIAL_NOT_LINKED, REFLECTION_NOT_LINKED, OUT_OF_CANVAS, LARGE_OVERLAP, low contrast, unknown fallback, pure function.
- **Export message (6 test)**: friendly title not raw code, "Masalah Serius", "Catatan", "Saran:", no undefined/null/schema, layout/alignment summary.
- **Alignment panel (4 test)**: friendly title for OBJECTIVE_NOT_COVERED, suggestion shown, code chip as meta, click behavior unchanged.
- **Regression (4 test)**: checkLearningGoalAlignment unchanged, checkExportQuality behavior unchanged, healthy export no confirm, broken export confirm.

Total: 25 test, all PASS.

## Verification

- **typecheck**: PASS
- **test**: 1756/1756 PASS (25 teacher-friendly-copy baru + 1728 existing + 3 esm-runtime-guard baru)
- **build**: PASS (CSS 44.01→44.20kB, JS 399.70→406.63kB +7kB untuk helper module + integration)

## Known Limitations

1. **issue.code masih muncul sebagai meta kecil** — intentional, untuk debugging. Bukan teks utama.
2. **Alignment masih heuristik text-match** — V1. Tidak pakai AI/NLP.
3. **Belum ada objectiveRefs schema** — V3 nanti.
4. **Belum ada UI "perbaiki otomatis"** — guru masih perlu edit manual. Suggestion hanya arahan teks.
5. **mpi-page-status wording tidak diubah** — sudah ramah guru sebelumnya. Hanya export confirm + alignment detail panel yang di-integrate.
6. **Pattern matching bisa false positive** — mis. message yang mengandung "materi" akan match ke "Materi belum lengkap" copy. Tapi karena pattern matching hanya jalan kalau code tidak dikenal, dan checker sebagian besar sudah punya code, risikonya rendah.
7. **Checker core messages tidak diubah** — `checkMpiStandard`, `validateLayoutQuality`, `checkLearningGoalAlignment` tetap menghasilkan message teknis. Friendly copy di-mapping di UI layer (export + alignment panel), bukan di checker.
