# Guided Generator Alignment Quality 01

Commit yang diverifikasi: `606c2b0` (LGA-UI-V2-MANUAL-VERIFY-01 base) → `GUIDED-GENERATOR-ALIGNMENT-QUALITY-01` commit
Tanggal: 2026-06-29
Verifier: AI Dev (audit via measurement script + automated test guard)

## Tujuan

Menjamin semua output guided generator memenuhi kontrak visual, layout, dan alignment. Batch ini bukan fitur baru — hanya audit + measurement + test guard. Patch content/generator hanya jika ada topic yang gagal threshold.

## Topic yang Dicek

| Topic | Alignment Score | Layout Score | MPI Standard | Errors | Warnings | Verdict |
|---|---|---|---|---|---|---|
| ppkn-7-norma (PPKn — Hidup Tertib dengan Norma) | 100 | 100 | PASS | 0 | 0 | **PASS** |
| ipa-7-zat (IPA — Zat dan Perubahannya) | 100 | 100 | PASS | 0 | 0 | **PASS** |
| matematika-7-aljabar (Matematika — Bentuk Aljabar) | 100 | 100 | PASS | 0 | 0 | **PASS** |
| bahasa-7-narasi (Bahasa Indonesia — Teks Narasi) | 100 | 100 | PASS | 0 | 0 | **PASS** |

**Semua 4 topic PASS quality gate tanpa patch content/generator.**

### Quality Gate Thresholds

- Alignment score minimal: 80 (umum), 90 (PPKn flagship) — **semua topic: 100**
- Layout score minimal: 80 — **semua topic: 100**
- No OBJECTIVE_NOT_COVERED — **0 kasus**
- No OBJECTIVE_DUPLICATE_ID — **0 kasus**
- No NO_OBJECTIVES — **0 kasus**
- No LARGE_OVERLAP — **0 kasus**
- No OUT_OF_CANVAS — **0 kasus**
- No OBJECTIVE_TOO_SHORT — **0 kasus**
- Quiz/Game/Reflection linked ke objective — **semua linked**

## Temuan

### PPKn (ppkn-7-norma)

- **Alignment**: 100/100. 3 objectives, 3 covered, 0 uncovered.
- **Layout**: 100/100. 0 errors, 0 warnings.
- **MPI Standard**: PASS. 0 errors, 0 warnings.
- **Page alignment breakdown**:
  - Cover: 0 addressed (neutral role, OK)
  - Panduan: 0 addressed (neutral role, OK)
  - Tujuan Pembelajaran: 3 addressed (all objectives listed)
  - Menu Materi: 0 addressed (neutral role, OK)
  - Pemantik: 0 addressed (neutral role, OK — starter page)
  - Materi: 1 addressed (objective 1: pengertian norma)
  - Kuis: 1 addressed (quiz prompt mentions norma agama)
  - Game Misi: 1 addressed (mission mentions norma kesopanan/hukum)
  - Refleksi: 1 addressed (reflection prompt mentions norma)
  - Penutup: 0 addressed (neutral role, OK)
- **Verdict**: PASS. Semua objective tercover, semua assessment linked.

### IPA (ipa-7-zat)

- **Alignment**: 100/100. 3 objectives, 3 covered, 0 uncovered.
- **Layout**: 100/100. 0 errors, 0 warnings.
- **MPI Standard**: PASS. 0 errors, 0 warnings.
- **Page alignment breakdown**:
  - Materi: 3 addressed (mentions wujud zat, perubahan wujud, eksperimen)
  - Kuis: 2 addressed (menyublim = perubahan wujud)
  - Game Misi: 1 addressed (es batu mencair, kapur barus menyublim)
  - Refleksi: 2 addressed (wujud zat, perubahan wujud)
- **Verdict**: PASS.

### Matematika (matematika-7-aljabar)

- **Alignment**: 100/100. 3 objectives, 3 covered, 0 uncovered.
- **Layout**: 100/100. 0 errors, 0 warnings.
- **MPI Standard**: PASS. 0 errors, 0 warnings.
- **Page alignment breakdown**:
  - Cover: 1 addressed (topic mentions aljabar)
  - Materi: 2 addressed (variabel, koefisien, konstanta, operasi)
  - Kuis: 1 addressed (konstanta)
  - Game Misi: 2 addressed (operasi penjumlahan, koefisien)
  - Refleksi: 1 addressed (aljabar)
  - Penutup: 1 addressed (topic mentions aljabar)
- **Verdict**: PASS.

### Bahasa Indonesia (bahasa-7-narasi)

- **Alignment**: 100/100. 3 objectives, 3 covered, 0 uncovered.
- **Layout**: 100/100. 0 errors, 0 warnings.
- **MPI Standard**: PASS. 0 errors, 0 warnings.
- **Page alignment breakdown**:
  - Cover: 2 addressed (teks narasi)
  - Materi: 3 addressed (struktur, ciri kebahasaan, menyusun)
  - Kuis: 2 addressed (orientasi, struktur)
  - Game Misi: 2 addressed (kata penghubung, komplikasi)
  - Refleksi: 3 addressed (struktur, ciri kebahasaan, menyusun)
  - Penutup: 2 addressed (teks narasi)
- **Verdict**: PASS.

## Patch yang Dilakukan

**Tidak ada patch content/generator.** Semua topic sudah memenuhi threshold sejak audit pertama.

Yang ditambahkan HANYA:

1. **NEW helper** `src/tests/fixtures/generator-quality-report.ts` — pure helper untuk mengukur kualitas output generator. Fungsi: `checkGeneratedTopicQuality(topic)`, `checkAllGeneratedTopicQuality()`, `checkGeneratedTopicQualityById(id)`. Mengekspor konstanta threshold: `MIN_ALIGNMENT_SCORE=80`, `MIN_PPKN_ALIGNMENT_SCORE=90`, `MIN_LAYOUT_SCORE=80`, `CRITICAL_ISSUE_CODES`.
   > **Note (AUDIT 5.9.6):** File ini dipindahkan dari `src/core/guided-flow/` ke `src/tests/fixtures/` karena hanya digunakan oleh test files, bukan production code. Lihat commit `1f3e8a5`.
2. **NEW test guard** `src/tests/guided-generator-alignment-quality-01.test.ts` — 21 test (15 mandatory + 6 helper).
3. **NEW measurement script** `scripts/audit-guided-topics.ts` — script untuk re-audit semua topic kapan saja.

Tidak ada perubahan pada:
- `src/core/guided-flow/mpi-topic-catalog.ts` (topic content sudah baik)
- `src/core/guided-flow/generate-mpi-from-topic.ts` (generator sudah baik)
- `src/core/learning-goal-alignment.ts` (checker tidak diubah)
- `src/core/design/layout-quality.ts` (layout checker tidak diubah)
- `src/core/mpi-quality-check.ts` (MPI checker tidak diubah)
- Schema, UI, thumbnail, export, style, template

## Manual Spot Check PPKn

Spot check dilakukan via code reading + automated test (tidak ada browser smoke test di environment ini):

- **Cover**: Judul "Hidup Tertib dengan Norma" + subtitle "PPKn — Kelas 7 — Fase D". Background dark (#1e3a5f), text putih via resolver (background-aware). Readable. ✓
- **Tujuan Pembelajaran**: 3 objectives ter-list di layer "Tujuan" (iconTabs variant, defaultOpenIndex=3). Semua objective spesifik (panjang > 3 kata, mengandung kata signifikan). ✓
- **Materi**: materialSummary membahas pengertian norma + jenis-jenis norma (Agama, Kesusilaan, Kesopanan, Hukum) + sanksi. Sesuai topic. ✓
- **Aktivitas/Game**: 2 misi — "Berdiri saat guru masuk" (norma kesopanan) + "Mencuri dilarang oleh" (semua norma). Tidak asal, terkait objective. ✓
- **Quiz**: "Norma yang berasal dari Tuhan..." — cek pemahaman ringan tentang jenis norma. Bukan ujian, feedback benar/salah informatif. ✓
- **Refleksi**: 3 prompt — "Norma apa yang sudah aku jalankan?", "Norma apa yang masih sering aku langgar?", "Apa yang akan aku lakukan untuk hidup lebih tertib?". Mengajak siswa menghubungkan norma dengan tindakan nyata. ✓
- **AlignmentSummary**: Score 100, ok=true, 0 issues. Tidak menunjukkan error. ✓
- **Verdict**: PASS. Generated PPKn adalah MPI pembelajaran yang baik, bukan ujian.

## Verification

- **typecheck**: PASS
- **test**: 1678/1678 PASS (21 generator quality baru + 1654 existing + 3 esm-runtime-guard baru)
- **build**: PASS (CSS 44.01kB sama, JS 396.32kB sama — pure core helper + tests only, no UI change)

## Known Limitations

1. **Alignment masih heuristik text-match** — V1. Tidak pakai AI/NLP. Text-match sederhana: cek apakah 2+ kata signifikan dari objective muncul di teks komponen. Bisa false positive (kata kebetulan sama) atau false negative (sinonim). V3+ bisa tambah objectiveRefs schema untuk tagging manual.
2. **objectiveRefs schema belum ada** — V3 nanti. Saat ini alignment hanya baca `curriculum.objectives` + text-match ke konten komponen.
3. **Thumbnail semantic preview belum ada** — backlog kosmetik. Tidak dikerjakan di batch ini.
4. **Export blocking alignment belum ada** — export masih hanya cek `checkMpiStandard`, tidak cek alignment score. V3+ bisa tambah guard "block export if alignment < threshold".
5. **Tidak ada browser smoke test** — manual spot check dilakukan via code reading + automated test. Untuk smoke test visual sebenarnya, perlu browser environment.
6. **Measurement script `scripts/audit-guided-topics.ts` tidak dijalankan di CI** — script untuk re-audit manual. Test guard di vitest sudah cukup untuk regression protection.
7. **Quality gate thresholds hardcoded** — `MIN_ALIGNMENT_SCORE=80`, `MIN_PPKN_ALIGNMENT_SCORE=90`, `MIN_LAYOUT_SCORE=80`. Kalau perlu di-tune, edit konstanta di `generator-quality-report.ts`.

## Definition of Done Checklist

- [x] Semua guided topics dicek (4 topic).
- [x] Report markdown dibuat.
- [x] Semua topic alignment score >= 80 (semua 100).
- [x] PPKn alignment score >= 90 (100).
- [x] Tidak ada OBJECTIVE_NOT_COVERED (0 kasus).
- [x] Tidak ada OBJECTIVE_DUPLICATE_ID (0 kasus).
- [x] Tidak ada OBJECTIVE_TOO_SHORT (0 kasus).
- [x] Tidak ada LARGE_OVERLAP (0 kasus).
- [x] Tidak ada OUT_OF_CANVAS (0 kasus).
- [x] Quiz/game/reflection linked ke objective (semua linked).
- [x] Tidak ada schema baru.
- [x] Tidak ada thumbnail change.
- [x] Tidak ada UI baru.
- [x] Tidak ada style/template baru.
- [x] typecheck PASS.
- [x] test PASS.
- [x] build PASS.
