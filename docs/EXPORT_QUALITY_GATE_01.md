# Export Quality Gate 01

Commit: `EXPORT-QUALITY-GATE-01` commit
Tanggal: 2026-06-29
Verifier: AI Dev (audit via code reading + automated test guard)

## Tujuan

Menjamin saat guru menekan export, project yang unreadable / fatal layout / alignment parah tidak lolos diam-diam. Pre-export quality check kecil: warning/confirm dulu, bukan blokir brutal semua kasus.

## Audit Export Flow Sebelum Patch

Topbar.handleExport() sebelum patch:
```ts
const qc = checkMpiStandard(current);
if (!qc.pass || qc.warnings.length > 0) {
  // confirm dengan errors + warnings
}
exportProjectToHtml(current);
```

**Gap yang ditemukan:**
1. Hanya cek `checkMpiStandard` (peran halaman, feedback, nav, dll).
2. Tidak cek layout quality (OUT_OF_CANVAS, LARGE_OVERLAP).
3. Tidak cek alignment (OBJECTIVE_NOT_COVERED, OBJECTIVE_DUPLICATE_ID, NO_OBJECTIVES).
4. Tidak cek visual readability (kontras cover/closing).

**Risiko nyata:** guru bisa menghasilkan HTML yang overlap/keluar kanvas/tidak terkait tujuan pembelajaran tanpa sadar.

## Patch yang Dilakukan

### Patch 1 — NEW pure core helper `src/core/export-quality-gate.ts`

Mengagregasi 4 quality check menjadi satu `ExportQualityReport`:

1. **MPI standard** (`checkMpiStandard`) — errors → fatal, warnings → warning.
2. **Layout quality** (`validateLayoutQuality` per page) — `OUT_OF_CANVAS` + `LARGE_OVERLAP` → fatal, lainnya → warning.
3. **Alignment** (`checkLearningGoalAlignment`) — `OBJECTIVE_NOT_COVERED` + `OBJECTIVE_DUPLICATE_ID` + `NO_OBJECTIVES` → fatal, `OBJECTIVE_TOO_SHORT` + `ASSESSMENT_NOT_LINKED` + `MATERIAL_NOT_LINKED` + `REFLECTION_NOT_LINKED` → warning.
4. **Visual readability** (re-implementasi `checkPageVisualReadability` di core, pakai `getResolvedComponentStyle` + `getContrastRatio`) — low contrast cover/closing → warning.

**Output:** `ExportQualityReport` dengan:
- `level`: `'ok'` | `'warning'` | `'fatal'`
- `canExport`: selalu `true` (kita tidak pernah hard-block; guru bisa confirm through)
- `isClean`: `true` kalau tidak ada issue sama sekali (export tanpa confirm)
- `fatalIssues` + `warningIssues` + `issues` (semua)
- `mpiStandard`, `layoutScore`, `alignment`, `pageCount`

**Pure function:** tidak mutate input, tidak panggil UI, tidak import dari editor (respect layer boundaries — visual readability di-re-implement di core, bukan import dari `editor/mpi-page-status.ts`).

### Patch 2 — `formatExportQualityMessage(report)` helper

Format report menjadi pesan confirm dialog yang ramah guru:
- "Masalah Serius (sebaiknya perbaiki dulu):" + list fatal issues (✗).
- "Catatan (bisa dilewati):" + list warning issues (⚠).
- "Skor Layout: X/100"
- "Alignment: X/Y tujuan tercover (skor Z/100)" atau "Alignment: Belum ada tujuan pembelajaran"
- Pertanyaan akhir: "Project memiliki masalah serius. Export mungkin menghasilkan HTML yang rusak atau menyesatkan. Tetap export?" atau "Project memiliki beberapa catatan kualitas. Tetap export?"
- Returns empty string kalau `isClean`.

### Patch 3 — Topbar.handleExport() integrasi

Ganti logic lama (hanya `checkMpiStandard`) dengan:
```ts
const report = checkExportQuality(current);
if (!report.isClean) {
  const message = formatExportQualityMessage(report);
  const proceed = window.confirm(message);
  if (!proceed) return;
}
const html = exportProjectToHtml(current);
downloadHtmlFile(current.title, html);
```

**Prinsip:** WARNING/CONFIRM dulu, bukan blokir brutal. Healthy project → no confirm, langsung export. Broken project → confirm dengan pesan ramah guru. Guru tetap bisa export kalau mau (confirm OK).

## Test Guard (23 test baru di `src/tests/export-quality-gate-01.test.tsx`)

1. Sample PPKn: 0 fatal issues (warnings OK).
2. All 4 generated topics: 0 fatal issues.
3. Generated PPKn: fully clean (0 fatal, 0 warning).
4. NO_OBJECTIVES → fatal.
5. OBJECTIVE_NOT_COVERED → fatal.
6. OBJECTIVE_DUPLICATE_ID → fatal.
7. OUT_OF_CANVAS → fatal layout.
8. Missing feedback → warning, not fatal.
9. formatExportQualityMessage empty for clean.
10. formatExportQualityMessage "Masalah Serius" for fatal.
11. formatExportQualityMessage "Catatan" for warnings only.
12. formatExportQualityMessage includes layout score + alignment info.
13. formatExportQualityMessage uses Indonesian, not technical jargon.
14. Topbar: clean project → no confirm → export.
15. Topbar: broken project → confirm called.
16. Topbar: confirm cancel → no export.
17. Topbar: confirm OK → export proceeds (no throw).
18. Export engine unchanged (exportProjectToHtml still exists).
19. Export still produces HTML for healthy project.
20. checkExportQuality pure (does not mutate input).
21. All 4 generated topics: 0 fatal issues.
22. Generated PPKn fully clean.
23. Report structure completeness (all fields present).

**Plus 2 updated existing tests** (`mpi-standard-m11b.test.ts`):
- Topbar export guard test: `checkMpiStandard` → `checkExportQuality`.
- Toolbar export guard test: `checkMpiStandard` → `checkExportQuality` + `!report.isClean`.

## Verification

- **typecheck**: PASS
- **test**: 1728/1728 PASS (23 export-quality-gate baru + 2 updated + 1703 existing)
- **build**: PASS (CSS 44.01kB sama, JS 396.82→399.70kB +3kB untuk export-quality-gate module)

## Known Limitations

1. **Alignment masih heuristik text-match** — V1. Tidak pakai AI/NLP.
2. **objectiveRefs schema belum ada** — V3 nanti.
3. **Thumbnail semantic preview belum ada** — backlog kosmetik.
4. **Export tidak hard-block** — guru tetap bisa export project yang fatal dengan confirm. Ini intentional (sesuai instruksi senior reviewer: "warning/confirm dulu, bukan blokir brutal semua kasus"). Kalau nanti mau hard-block untuk specific fatal codes, bisa tambah konfigurasi.
5. **Visual readability di-re-implement di core** — bukan import dari `editor/mpi-page-status.ts` (respect layer boundaries). Implementasi identik, tapi duplikasi kode. Catat untuk future refactor: bisa pindahkan `checkPageVisualReadability` ke core kalau diperlukan.
6. **Sample PPKn memiliki 1 layout warning** — learningObjectives punya 3 komponen (maksimal disarankan 2). Tidak fatal, hanya warning. Tidak di-patch di batch ini (di luar scope — tidak ubah sample project).
7. **Tidak ada UI baru** — hanya confirm dialog pakai `window.confirm()`. Tidak ada panel/modal baru.
8. **Tidak ada browser smoke test** — verify via code reading + automated test.

## Definition of Done Checklist

- [x] Audit export flow dilakukan.
- [x] Pre-export quality check kecil ditambahkan (pure core helper).
- [x] Warning/confirm dulu, bukan blokir brutal.
- [x] Test guard: healthy project tetap export tanpa confirm.
- [x] Test guard: broken project dikonfirmasi.
- [x] Tidak ubah export engine besar (exportProjectToHtml + downloadHtmlFile tetap utuh).
- [x] Tidak tambah objectiveRefs schema.
- [x] Tidak ubah thumbnail.
- [x] Tidak ubah core checker (checkMpiStandard, validateLayoutQuality, checkLearningGoalAlignment tetap utuh — hanya diagregasi).
- [x] Tidak tambah style/template.
- [x] typecheck PASS.
- [x] test PASS.
- [x] build PASS.
