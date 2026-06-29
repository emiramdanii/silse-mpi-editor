# Export Ready Summary 01

Commit: `EXPORT-READY-SUMMARY-01` commit
Tanggal: 2026-06-29
Verifier: AI Dev (audit via code reading + automated test guard)

## Tujuan

Membuat ringkasan siap export yang mudah dipahami guru. Sebelum klik export, guru tahu media sudah aman atau masih ada catatan. Ini UX polish penting agar export gate terasa seperti asisten final check, bukan hanya confirm dialog.

## UX Before

| Area | Sebelum | Gap |
|---|---|---|
| Tombol Export HTML | Hanya tombol "⬇ Export HTML" tanpa indikasi status | Guru tidak tahu media siap atau belum sebelum klik |
| Confirm dialog export | Muncul HANYA saat klik export, dengan pesan teknis | Guru harus klik dulu untuk tahu ada masalah |
| AlignmentSummary | Chip di PagePanel, bukan di Topbar | Terpisah dari tombol export |
| MpiProgressStrip | Chip 10 peran standar di Topbar tengah | Tidak spesifik ke export readiness |
| PagePanel status | Badge per halaman | Tidak ringkas untuk export decision |

**Gap utama:** Guru tidak tahu media siap export sebelum klik tombol export.

## UX After

| Status | Copy | Arti |
|---|---|---|
| ready | ✅ Siap export | Media siap, tidak ada masalah, export langsung tanpa confirm |
| needs-review | ⚠ N catatan | Media bisa export, ada N catatan ringan, confirm dialog muncul |
| serious | ✗ Perlu dicek | Ada masalah serius, confirm dialog muncul dengan peringatan |

**Chip muncul di Topbar, tepat sebelum tombol Export HTML.** Tooltip berisi: title + message + breakdown kategori + saran.

## Category Mapping

| Category | Source/Code | Ready Copy | Warning Copy | Serious Copy |
|---|---|---|---|---|
| Struktur MPI | mpi-standard (missing pages) | Struktur halaman utama sudah lengkap. | Ada bagian struktur MPI yang perlu dilengkapi. | Ada struktur penting yang belum lengkap. |
| Tujuan Pembelajaran | alignment | Tujuan pembelajaran sudah terhubung dengan isi media. | Ada bagian yang belum jelas hubungannya dengan tujuan. | Ada tujuan pembelajaran yang belum tercover atau data tujuan bermasalah. |
| Layout | layout | Layout aman untuk layar 16:9. | Ada elemen yang perlu dirapikan. | Ada elemen keluar layar atau saling menumpuk serius. |
| Keterbacaan | visual | Teks utama terbaca dengan baik. | Ada teks yang kontrasnya perlu diperiksa. | Keterbacaan bermasalah serius. |
| Interaksi | mpi-standard (feedback/nav/quiz/game) | Interaksi dan umpan balik sudah cukup. | Ada interaksi, navigasi, atau umpan balik yang perlu dilengkapi. | Ada interaksi penting yang belum siap. |

**Catatan:** Untuk V1 visual biasanya warning, belum serious.

## Patch yang Dilakukan

### Patch 1 — NEW pure core helper `src/core/export-ready-summary.ts`

- Pure function, no React, no editor imports.
- Types: `ExportReadyCategoryStatus`, `ExportReadyCategory`, `ExportReadySummaryStatus`, `ExportReadySummary`.
- Functions: `buildExportReadySummary(report)`, `formatExportReadySummaryText(summary)`, `getExportReadyChipLabel(summary)`.
- Status logic: ready (0 fatal + 0 warning), needs-review (0 fatal + >0 warning), serious (>0 fatal).
- 5 categories: structure, objectives, layout, readability, interaction.
- topSuggestions: max 3, fatal priority, no duplicate, from `getTeacherFriendlyIssueCopy`.

### Patch 2 — Topbar chip integration (`src/editor/Topbar.tsx`)

- Import `buildExportReadySummary`, `getExportReadyChipLabel`, `formatExportReadySummaryText`.
- `useMemo` untuk compute summary dari `checkExportQuality(project)`.
- Chip `<span>` sebelum tombol Export HTML:
  - `data-testid="export-ready-summary"`
  - `data-status={summary.status}`
  - `data-total-issues={summary.totalIssues}`
  - `title={formatExportReadySummaryText(summary)}` (tooltip)
  - Class `is-ready` / `is-needs-review` / `is-serious`
- `handleExport` tidak diubah — confirm dialog tetap berjalan.

### Patch 3 — CSS (`src/styles.css`)

- `.editor-topbar__export-ready` — compact chip (4px 10px padding, 12px font, 4px radius).
- `.is-ready` — green background + text.
- `.is-needs-review` — orange background + text.
- `.is-serious` — red background + text.

## Tests

- **Helper (16 test)**: ready/needs-review/serious status, 3 titles, 5 categories, objectives serious, layout serious, readability warning, interaction warning, topSuggestions max 3 + no duplicate, pure function, format text no jargon, format text has title + labels.
- **UI (6 test)**: clean → "Siap export", warning → "catatan", fatal → "Perlu dicek", chip exists, data-status matches, export behavior unchanged.
- **Regression (2 test)**: exportProjectToHtml unchanged, checkExportQuality level unchanged.
- **Chip label (3 test)**: ready/needs-review/serious labels.

Total: 27 test, all PASS.

## Verification

- **typecheck**: PASS
- **test**: 1786/1786 PASS (27 export-ready-summary baru + 1756 existing + 3 esm-runtime-guard baru)
- **build**: PASS (CSS 44.20→44.62kB, JS 406.63→409.92kB +3kB)

## Known Limitations

1. **Summary masih berdasarkan checker heuristik** — alignment text-match V1, bukan AI/NLP.
2. **Belum ada modal detail khusus** — tooltip saja untuk V1. Detail ada di AlignmentDetailPanel.
3. **Export confirm tetap `window.confirm`** — tidak diganti modal besar.
4. **ObjectiveRefs schema belum ada** — V3 nanti.
5. **Chip recomputed saat project berubah** — `useMemo([project])`, aman untuk ukuran project sekarang.
6. **Visual category biasanya warning, belum serious** — V1. Kalau diperlukan, bisa tambah threshold serious di future.
7. **Interaction category pakai pattern matching** — message yang mengandung "umpan balik", "navigasi", "kuis", "game", "aktivitas", "refleksi", "pemantik" masuk ke interaction. Lainnya masuk ke structure.
