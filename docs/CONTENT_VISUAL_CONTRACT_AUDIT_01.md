# Content Visual Contract Audit (CONTENT-VISUAL-CONTRACT-AUDIT-01)

## Audit Date
Batch: CONTENT-VISUAL-CONTRACT-AUDIT-01
Commit: (latest at time of audit)

## Kontrak yang Sudah Ada

### 1. Struktur MPI (CORE_PRODUCT_CONTRACT.md)
- 10 page roles (cover→closing)
- Capability matrix per role
- LayoutId (blank, coverCentered, singleColumn)
- Component types: text, image, card, navigation, question, game, layered-info, learning-bridge

### 2. Style Schema (STYLE_SCHEMA_CONTRACT.md)
- StylePack dengan tokens: colors, typography, spacing, radius, shadow
- Style resolver: resolveComponentStyle() — pure function, shared editor=preview=export
- 5 preset style packs: cleanClassroom, civicWarm, brightKids, projectorHighContrast, minimalWorksheet

### 3. MPI Quality Check (mpi-quality-check.ts)
- Cek: curriculum, objectives, cover, learningObjectives, material, guide, menu, quiz, game, closing, feedback, navigasi
- Output: { pass, errors, warnings }

### 4. Design Engine V1 (design-tokens.ts, layout-recipes.ts, apply-design-recipe.ts, layout-quality.ts)
- 11 layout recipes per page role
- applyPageDesignRecipe: global content index, titleZone placement
- validateLayoutQuality: out-of-canvas, edge-too-close, overlap, too-small, too-dense

### 5. Page Status (mpi-page-status.ts)
- Per-page status: ok/warning/error
- Cek: cover has text, material has content, activity has game, quiz has question, etc.

## Kontrak yang Belum Ada

### 1. Kontrak Keterbacaan Visual (CRITICAL)
- Resolver TIDAK background-aware: title selalu pakai `colors.text`, subtitle selalu pakai `colors.mutedText`
- Tidak ada cek kontras antara teks dan background halaman
- Cover gelap (#1e3a5f) + teks gelap = tidak terbaca, tapi lolos quality check
- **Risiko**: siswa tidak bisa baca cover/closing, MPI terasa rusak

### 2. Kontrak Alignment Tujuan Pembelajaran
- LGA-01 sudah dibuat sebagai contract + checker, tapi belum terintegrasi ke UI/quality check
- **Risiko**: MPI bisa "PASS" struktur tapi tidak mencapai tujuan pembelajaran

### 3. Kontrak "MPI Bukan Ujian"
- checkMpiStandard() memberi warning "Belum ada Kuis atau Question component" dan "Belum ada Game component"
- Wording ini membuat guru merasa WAJIB punya kuis+game, padahal MPI adalah media, bukan ujian
- **Risiko**: app mendorong guru membuat MPI yang ujian-sentris

### 4. Kontrak Visual Issue di Page Status
- computePageStatus() hanya cek "ada komponen", tidak cek "komponen terbaca"
- Badge ✓ tidak berarti "media sudah baik", hanya berarti "komponen minimal ada"
- **Risiko**: guru mengira halaman sudah ok padahal visual bermasalah

## Risiko yang Bisa Lolos

| Risiko | Severity | Saat Ini |
|---|---|---|
| Cover gelap + teks gelap | Critical | Bisa lolos |
| Closing gelap + teks gelap | Critical | Bisa lolos |
| MPI tanpa tujuan tercapai | High | Bisa lolos |
| MPI ujian-sentris | Medium | Wording mendorong |
| Thumbnail tidak default | Low | List view default |

## Prioritas Patch

1. **Contrast helper** — pure function untuk deteksi kontras
2. **Resolver background-aware** — cover/closing text pakai readable color
3. **Quality check wording** — tidak ujian-sentris
4. **Page status visual issue** — cover/closing kontras warning
5. **PagePanel default thumbnail** — guru lihat semua halaman cepat
6. **Tests** — guard semua standar di atas
