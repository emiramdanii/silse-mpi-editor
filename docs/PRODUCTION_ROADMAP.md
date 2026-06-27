# Production Roadmap — SILSE MPI Editor

> Roadmap lengkap dari repo skeleton sampai production-ready + hardening.
> Dokumen ini adalah sumber kebenaran urutan milestone. `docs/ROADMAP.md` hanya melacak status milestone aktif.
> Setiap milestone = satu batch. Tidak lompat, tidak sekalian, tidak tambah fitur di luar scope.

---

## Roadmap Overview

| Milestone | Nama | Status |
| --------- | ---- | ------ |
| M0 | Repo Skeleton | Done |
| M1 | Editor Kosong | Done |
| B1A | Scope-Lock Patch | Done |
| B1B | Core Contract, Schema, Style Adapter Lock | Done |
| M2 (v1) | Text Block + Text Role Dasar | Superseded |
| **M2** | **Page Role + Capability Matrix + Text Component** | **Active** |
| M3 | Page Flow Management | Planned |
| M4 | Image + Card Component | Planned |
| M5 | Navigation + Preview | Planned |
| M6 | Export HTML + Style Consistency | Planned |
| M7 | Save / Load + Schema Validation | Planned |
| M8 | Drag / Resize + Layout Guide | Planned |
| M9 | AI JSON Import + Style Import | Planned |
| M10 | Kuis Sederhana (feedback + skor) | Planned |
| M11 | Advanced Learning Components + Guided Style System | Planned |
| M12 | Template Pedagogis | Planned |
| M13 | Paket MPI Production-Ready | Planned |
| P1 | Reliability Hardening | Planned |
| P2 | UX Hardening | Planned |
| P3 | Export QA Hardening | Planned |
| P4 | Documentation & Release | Planned |
| F1+ | Future Development | Future |

---

## Batch 1B — Core Contract, Schema, Style Adapter Lock

**Status:** Next / Required Before M2

**Target:** Mengunci arah produk, kontrak data, schema authoring, dan style adapter sebelum fitur block dimulai.

Batch ini wajib dilakukan sebelum M2 agar repo tidak berubah menjadi:

- PowerPoint clone.
- Canva clone.
- Editor slide kosong.
- Template engine besar.
- Campuran renderer/schema/style seperti project sebelumnya.

### Prinsip Utama

SILSE MPI Editor adalah **guided MPI authoring tool untuk guru**.

UI boleh terasa familiar seperti PowerPoint, tetapi produk bukan PowerPoint clone. PowerPoint hanya referensi kemudahan interaksi canvas, bukan arah arsitektur.

**Style bukan dekorasi. Style adalah bagian dari struktur pembelajaran.**

### Scope

1. Buat `docs/CORE_PRODUCT_CONTRACT.md`.
2. Buat `docs/STYLE_SCHEMA_CONTRACT.md`.
3. Update `docs/PRODUCTION_ROADMAP.md` (dokumen ini) agar memasukkan:
   - Core Product Contract.
   - Authoring Schema.
   - Guided Learning Style System.
   - Style Adapter.
   - Template Pedagogis.
4. Update `docs/CLEAN_ARCHITECTURE.md` agar menjelaskan posisi:
   - `core` sebagai sumber data/schema.
   - style adapter sebagai resolver style.
   - `editor`, `preview`, dan `export` wajib memakai hasil resolve style yang sama.
5. Tidak mengubah kode app.
6. Tidak menambah fitur UI.
7. Tidak lanjut M2 sebelum Batch 1B accepted.

### Dilarang

- Menambah text block.
- Menambah image block.
- Menambah button block.
- Membuat template engine.
- Membuat contract engine besar.
- Membuat style engine besar.
- Membuat legacy adapter.
- Membawa schema/renderer lama.
- Mengubah store.
- Mengubah UI editor.

### Acceptance

Batch 1B dianggap selesai jika:

1. Dokumen menjelaskan bahwa SILSE adalah guided MPI authoring tool, bukan PowerPoint clone.
2. Dokumen membedakan dengan jelas:
   - Product Contract.
   - Authoring Schema.
   - Style Schema.
   - Style Adapter.
   - Template Pedagogis.
3. Style diposisikan sebagai sistem visual-pedagogis, bukan kosmetik.
4. Style Adapter didefinisikan sebagai resolver dari semantic style ke concrete render style.
5. Editor, Preview, dan Export wajib konsisten memakai style resolve yang sama.
6. Roadmap produksi memasukkan milestone style dan template pedagogis.
7. Tidak ada perubahan kode.
8. Tidak ada scope leak.

---

## M2 — Text Block + Text Role Dasar

**Target:** Text block pertama, tetapi dengan role/variant — bukan "free text".

**Prasyarat:** Batch 1B ACCEPTED.

**Fitur:**

- Add text block.
- Select block.
- Render text di canvas.
- Edit text dari inspector.
- Edit x/y/width/height.
- **Field `variant` wajib ada** di setiap text block (default `'body'`).
- Variant bisa dipilih dari inspector (title/subtitle/body/instruction/importantNote/questionPrompt/reflectionBox).

**Belum ada style adapter.** Style masih inline hard-coded minimal, tetapi data block sudah punya field `variant`. Ini anchor untuk M6.

**Acceptance:**

- Tambah text block → block punya `variant: 'body'` secara default.
- Ganti variant → field `variant` berubah di data.
- Edit text → canvas berubah.
- Variant tersimpan di JSON project.

**Dilarang di M2:**

- Image block, button block, preview, export, drag/resize, template, page flow lengkap.
- Style adapter (baru di M6).
- Style tokens / visual preset (baru di M11).

---

## M3 — Page Flow Lengkap

**Target:** Operasi halaman lengkap.

**Fitur:**

- Add page.
- Delete page.
- Rename page.
- Select page.
- Duplicate page.

**Acceptance:**

- Tambah 3 halaman → pindah halaman → isi tiap halaman tidak bercampur.
- Delete halaman → halaman hilang, halaman lain tetap utuh.
- Duplicate halaman → halaman baru dengan isi sama tapi ID beda.

**Catatan:** Page Role (`free`/`cover`/`material`/dll) belum masuk M3. Page Role baru ditambahkan saat M11 (Guided Learning Style System). M3 cukup operasi teknis halaman.

---

## M4 — Image Block + Image Variant

**Target:** Bisa tambah gambar dengan variant.

**Fitur:**

- Upload image.
- Render image di canvas.
- Edit posisi/ukuran.
- Object-fit: cover / contain.
- **Field `variant` wajib ada** (illustration/background/imageCard).

**Acceptance:**

- Upload gambar → tampil di canvas.
- Resize → gambar menyesuaikan.
- Variant tersimpan di JSON.

---

## M5 — Button + Preview + Interaction Role

**Target:** MPI bisa dipreview dengan tombol navigasi.

**Fitur:**

- Button block dengan action: next, prev, goto.
- **Field `variant` wajib ada** (navigation/primaryAction/secondaryAction/choice).
- Preview fullscreen.
- Navigasi antar halaman di preview.

**Acceptance:**

- Tambah button next → klik di preview → halaman berpindah.
- Preview menampilkan block persis seperti editor.

---

## M6 — Export HTML + Style Consistency

**Target:** Export HTML standalone, dengan style resolve pertama.

**Fitur:**

- Export HTML standalone (1 file, CSS inline, JS inline, data embedded).
- **Style adapter pertama** ditulis: `resolveBlockStyle`.
- Editor, Preview, Export semua memakai `resolveBlockStyle`.

**Acceptance:**

- Export → file HTML terdownload.
- Buka di browser → halaman tampil, tombol jalan.
- Network tab: 0 request eksternal.
- Snapshot: editor, preview, export menghasilkan style yang sama.

**Ini milestone kritis.** Sebelum M6, style boleh inline hard-coded. Setelah M6, semua render wajib via `resolveBlockStyle`.

---

## M7 — Save / Load + Schema Validation

**Target:** Project tidak hilang + data selalu valid sesuai kontrak.

**Fitur:**

- Autosave localStorage.
- Manual save.
- Load project.
- Reset project.
- Export/import JSON.
- **Schema validation penuh**: cek Page Role, Block Variant, Interaction Pattern sesuai kontrak.

**Acceptance:**

- Edit project → reload browser → project masih ada.
- Import JSON tidak valid → error jelas, tidak crash.
- Setiap block punya `variant` valid.

---

## M8 — Drag / Resize + Layout Guide

**Target:** Editor enak dipakai.

**Fitur:**

- Drag block di canvas.
- Resize block di canvas (handle pojok).
- Snap sederhana (grid 8px).
- Keyboard delete (tombol Delete/Backspace).
- Layout guide ringan (alignment antar block).

**Acceptance:**

- Block bisa digeser langsung di canvas.
- Block bisa di-resize via handle.
- Snap aktif saat drag dekat grid.

---

## M9 — Import AI / Canva Ringan ke Schema

**Target:** Import ringan yang menghormati schema.

**Fitur awal:**

- Paste JSON sederhana dari AI → otomatis dikonversi ke schema SILSE (tambah `variant` default).
- Import HTML ringan → parse body jadi blocks sederhana.
- Import gambar hasil Canva sebagai background halaman.
- Tambah text overlay di atas gambar background.

**Acceptance:**

- Paste JSON → project terisi, semua block punya `variant`.
- Import HTML → block punya `variant: 'body'` default.
- Tidak ada import yang menghasilkan block tanpa `variant`.

**Dilarang:** Import yang membawa schema V5 atau format bebas tanpa konversi.

---

## M10 — Kuis Sederhana

**Target:** MPI mendukung pertanyaan pilihan ganda sederhana.

**Fitur:**

- Question block (pertanyaan + pilihan + jawaban benar).
- Interaction pattern: `choiceFeedback`.
- Feedback benar/salah.
- Skor akhir.

**Acceptance:**

- Tambah kuis → di-preview bisa dijawab.
- Jawaban benar → feedback positif.
- Skor terakumulasi.
- Export HTML → kuis jalan tanpa React.

---

## M11 — Guided Learning Style System

**Target:** Style system lengkap sesuai `docs/STYLE_SCHEMA_CONTRACT.md`.

**Fitur:**

- `ProjectStyle` (presetId + tokens).
- 5 visual preset (cleanClassroom, civicWarm, brightKids, projectorHighContrast, minimalWorksheet).
- `resolveBlockStyle` full implementation.
- Page Role mulai dipakai untuk default style ringan.
- Editor/preview/export konsisten via adapter.

**Acceptance:**

- Pilih preset → tokens berubah → editor/preview/export ikut.
- Variant menghasilkan style default benar.
- Local override mengalahkan default.
- Snapshot editor/preview/export konsisten.

---

## M12 — Template Pedagogis

**Target:** Template sederhana yang membantu guru start cepat.

**Fitur:**

- 3–5 template pedagogis (cover+materi+latihan, full MPI, LKPD ringan).
- Template = preset project JSON dengan page role + block variant sudah terisi.
- Pilih template → project baru terisi template.
- Template tidak mengikat; setelah dipilih, project jadi project biasa.

**Acceptance:**

- Pilih template → project baru muncul dengan halaman + block + variant.
- Edit template → tetap jadi project biasa.
- Tidak ada binding permanen ke template.

**Bukan template engine.** Template hanya JSON preset, bukan registry rumit.

---

## M13 — Paket MPI Production-Ready

**Target:** Bisa dikirim ke guru lain sebagai paket siap pakai.

**Fitur:**

- Kompres project + asset menjadi satu file `.mpi.zip`.
- Buka paket → langsung jalan di editor.
- Atau: export HTML + paket source JSON.
- Validasi paket sebelum distribusi.

**Acceptance:**

- Save project sebagai paket → file terdownload.
- Buka paket di mesin lain → project termuat utuh.
- Paket berisi manifest + project.json + assets + (opsional) export HTML.

---

## P1 — Reliability Hardening

**Target:** App tidak crash pada kondisi edge.

**Fitur:**

- Error boundary React.
- Recovery dari localStorage corrupt.
- Validasi input ketat.
- Test coverage untuk failure path.

**Acceptance:**

- localStorage corrupt → app tetap buka, tampilkan error.
- Project dengan block tidak valid → tidak crash, tampilkan pesan.
- Coverage > 80% untuk core/.

---

## P2 — UX Hardening

**Target:** Editor enak dipakai guru non-teknis.

**Fitur:**

- Undo/redo.
- Keyboard shortcut dasar (Ctrl+Z, Delete, arrow keys).
- Tooltip jelas.
- Empty state yang membimbing.
- Onboarding mini (3 langkah).

**Acceptance:**

- Undo/redo jalan.
- Shortcut dasar jalan.
- Guru baru bisa mulai edit tanpa baca README.

---

## P3 — Export QA Hardening

**Target:** Export HTML selalu jalan di browser manapun.

**Fitur:**

- Test export di Chrome, Firefox, Edge, Safari.
- Test export offline (network disabled).
- Test export di layar proyektor (resolusi rendah).
- Test export dengan gambar besar.

**Acceptance:**

- Export jalan di 4 browser utama.
- Export jalan tanpa internet.
- Export tetap rapi di proyektor.

---

## P4 — Documentation & Release

**Target:** Dokumen lengkap + rilis publik.

**Fitur:**

- User guide (untuk guru).
- Dev guide (untuk kontributor).
- Demo project JSON.
- Release notes v1.0.
- Tag git `v1.0.0`.

**Acceptance:**

- Guru bisa pakai app dengan baca user guide saja.
- Kontributor bisa setup dev dengan baca dev guide saja.
- Tag v1.0.0 dibuat.

---

## F1+ — Future Development

Setelah v1.0.0, fitur lanjutan:

- Multi-user collaboration (cloud).
- Asset marketplace.
- Plugin system.
- Analytics/telemetry (opt-in).
- Tema kustom (di luar 5 preset).
- Interaksi kompleks (drag-drop, hotspot, tabs, accordion lengkap).
- Animasi/transisi (jika diperlukan).

Future development tetap harus menghormati `CORE_PRODUCT_CONTRACT.md`. Tidak boleh menambah engine yang melanggar kontrak.

---

## Aturan Scope-Lock

Sama seperti di `docs/ROADMAP.md`:

1. **Satu batch = satu milestone.** Tidak menggabung.
2. **Tidak lompat.** M2 baru mulai setelah B1B acceptance terpenuhi.
3. **Tidak tambah fitur di luar scope.** Jika tergoda tambah sesuatu, tulis di backlog, jangan masukkan commit.
4. **Boundary test wajib lulus** di setiap milestone.
5. **Test, typecheck, build wajib lulus** sebelum milestone ditutup.
6. **Style lock:** sejak M2, setiap block wajib punya field `variant`. Sejak M6, semua render wajib via `resolveBlockStyle`. Pelanggaran = milestone dikembalikan ke "In Progress".

---

## Hubungan dengan ROADMAP.md

- `docs/ROADMAP.md` = melacak **status** milestone aktif (Done/Next/Planned) + scope-lock per milestone.
- `docs/PRODUCTION_ROADMAP.md` (dokumen ini) = **urutan lengkap** milestone sampai production + hardening, dengan deskripsi tiap milestone.

Jika ada pertentangan urutan, dokumen ini yang menang. Jika ada pertentangan status milestone aktif, `ROADMAP.md` yang menang.
