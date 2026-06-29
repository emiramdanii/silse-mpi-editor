# Teacher Main Flow Polish 01

Commit: `TEACHER-MAIN-FLOW-POLISH-01` commit
Tanggal: 2026-06-29
Verifier: AI Dev (audit via code reading + automated test guard)

## Tujuan

Rapikan jalur utama guru: Pilih Topik → Generate → Cek → Export. Pastikan guru tidak bingung memakai jalur utama SILSE. Batch ini UX polish — bukan fitur besar.

## Flow Audit

| Step | UI Sekarang | Gap | Patch/Decision |
|---|---|---|---|
| 1. Guru baru buka app kosong | Topbar + PagePanel kosong (1 halaman cover default) | Guru tidak tahu harus mulai dari mana | TAMBAH empty state hint di PagePanel: "Mulai cepat: klik Buat MPI dari Topik" |
| 2. Guru melihat Topbar | Tombol "Paket MPI dari Topik" | "Paket" agak teknis | RENAME → "Buat MPI dari Topik" |
| 3. Guru menemukan tombol generate | Tombol ada di kanan Topbar, jelas | OK | NO CHANGE |
| 4. Guru membuka GuidedFlowDialog | Hint: "Pilih topik pembelajaran. SILSE akan membuat draft MPI lengkap (10 halaman) dengan layout cerdas..." | Copy agak teknis ("layout cerdas") | POLISH hint: "Pilih topik, lalu SILSE akan membuat draft MPI lengkap berisi tujuan, materi, aktivitas, kuis, refleksi, dan penutup." |
| 5. Guru memilih topik | Topic cards clickable, is-selected highlight | OK | NO CHANGE |
| 6. Guru generate | Generate button, loading state, result | OK | NO CHANGE |
| 7. Guru apply project | Apply button "✓ Terapkan Draft MPI" | Label bisa lebih jelas | RENAME → "✓ Terapkan ke Editor" + TAMBAH guidance: "Draft sudah dibuat. Periksa ringkasan kualitas, lalu klik Terapkan ke Editor." |
| 8. Guru melihat halaman hasil | PagePanel dengan 10 halaman thumbnail | OK | NO CHANGE |
| 9. Guru melihat chip siap export | Chip "✅ Siap export" / "⚠ N catatan" / "✗ Perlu dicek" | OK (sudah dari batch sebelumnya) | NO CHANGE |
| 10. Guru export | Export button + confirm dialog | OK | NO CHANGE |

## Copy Changes

| Area | Sebelum | Sesudah | Alasan |
|---|---|---|---|
| Topbar button label | 🎯 Paket MPI dari Topik | 🎯 Buat MPI dari Topik | "Buat" lebih action-oriented, "Paket" agak teknis |
| Topbar button title | "Buat paket MPI lengkap dari topik" | "Buat MPI lengkap dari topik pembelajaran" | Konsisten dengan label baru |
| GuidedFlowDialog hint | "Pilih topik pembelajaran. SILSE akan membuat draft MPI lengkap (10 halaman) dengan layout cerdas dan kualitas yang sudah dicek." | "Pilih topik, lalu SILSE akan membuat draft MPI lengkap berisi tujuan, materi, aktivitas, kuis, refleksi, dan penutup." | Lebih ramah guru, menyebutkan komponen yang akan dibuat |
| GuidedFlowDialog apply button | "✓ Terapkan Draft MPI" | "✓ Terapkan ke Editor" | Lebih jelas arah tujuan |
| GuidedFlowDialog post-generate | (tidak ada guidance) | "Draft sudah dibuat. Periksa ringkasan kualitas, lalu klik Terapkan ke Editor." | Guru tahu langkah berikutnya |
| PagePanel empty state | (tidak ada hint) | "Mulai cepat: klik Buat MPI dari Topik untuk membuat draft media pembelajaran." | Guru baru tahu mulai dari mana |

## Patch yang Dilakukan

### Patch 1 — Topbar copy (`src/editor/Topbar.tsx`)

- Button label: "🎯 Paket MPI dari Topik" → "🎯 Buat MPI dari Topik"
- Button title: "Buat paket MPI lengkap dari topik" → "Buat MPI lengkap dari topik pembelajaran"

### Patch 2 — GuidedFlowDialog copy + guidance (`src/editor/GuidedFlowDialog.tsx`)

- Hint: "Pilih topik pembelajaran. SILSE akan membuat draft MPI lengkap (10 halaman) dengan layout cerdas dan kualitas yang sudah dicek." → "Pilih topik, lalu SILSE akan membuat draft MPI lengkap berisi tujuan, materi, aktivitas, kuis, refleksi, dan penutup."
- Apply button: "✓ Terapkan Draft MPI" → "✓ Terapkan ke Editor"
- TAMBAH guidance `<p>` sebelum actions: "Draft sudah dibuat. Periksa ringkasan kualitas, lalu klik Terapkan ke Editor." (data-testid="guided-flow-guidance")

### Patch 3 — PagePanel empty state hint (`src/editor/PagePanel.tsx`)

- TAMBAH `isDefaultProject` detection (title="MPI Baru" + 1 page + cover role + ≤1 component).
- TAMBAH hint `<div>` after AlignmentSummary: "Mulai cepat: klik Buat MPI dari Topik untuk membuat draft media pembelajaran." (data-testid="page-panel-empty-hint")
- Hint hanya muncul untuk default project, tidak mengganggu guru yang sudah punya project.

### Patch 4 — CSS (`src/styles.css`)

- `.page-panel__empty-hint` — blue-tinted hint box with left border.
- `.guided-flow-modal__guidance` — green-tinted guidance box with left border.

### Patch 5 — Existing tests updated

- `src/tests/guided-flow-manual-verify-01.test.tsx`: comment update untuk aria-label (unchanged, internal identifier).
- `src/tests/guided-mpi-flow-01.test.tsx`: test name update dari "Paket MPI dari Topik" → "Buat MPI dari Topik".

## Tests

- **Flow (15 test)**: tombol utama ada, label ramah guru, klik buka dialog, dialog jelaskan fungsi, generate disabled→enabled, generate tampilkan draft, guidance "Terapkan ke Editor", apply tutup dialog, project 10 halaman, chip siap export terlihat, export button ada, healthy no confirm, broken confirm, confirm replace project.
- **Copy/Empty state (3 test)**: no raw jargon (qualityReport/schema/undefined/null/componentId), empty hint muncul untuk default project, empty hint tidak muncul untuk non-default.
- **Regression (2 test)**: PageThumbnail unchanged, export engine unchanged.

Total: 20 test, all PASS.

## Verification

- **typecheck**: PASS
- **test**: 1806/1806 PASS (20 teacher-main-flow-polish baru + 1786 existing)
- **build**: PASS (CSS 44.62→45.14kB, JS 409.92→410.46kB)

## Known Limitations

1. **Belum ada onboarding penuh** — hanya hint kecil di PagePanel. Onboarding wizard besar di luar scope.
2. **Belum ada style pack** — di luar scope batch ini.
3. **Belum ada Canva background** — di luar scope.
4. **Belum ada objectiveRefs schema** — V3 nanti.
5. **Empty state hint pakai heuristic sederhana** — title="MPI Baru" + 1 page + cover + ≤1 component. Bisa false positive kalau guru membuat project kosong manual dengan nama "MPI Baru", tapi risikonya rendah.
6. **Guidance post-generate hanya teks statis** — tidak interactive (tidak ada tombol "Lihat preview" dll). Cukup untuk V1.
7. **Confirm replace project tetap pakai `window.confirm`** — tidak diganti modal.
