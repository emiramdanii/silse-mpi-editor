# Roadmap — silse-mpi-editor

Setiap milestone = satu batch. Tidak lompat, tidak sekalian, tidak tambah fitur di luar scope milestone aktif.

## Milestone Overview

| Milestone | Nama                                  | Status      |
| --------- | ------------------------------------- | ----------- |
| M0        | Repo Skeleton                         | Done        |
| M1        | Editor Kosong                         | Done        |
| B1A       | Scope-Lock Patch                      | Done        |
| **B1B**   | **Core Contract, Schema, Style Lock** | **Next**    |
| M2        | Text Block + Text Role Dasar          | Planned     |
| M3        | Page Flow Lengkap                     | Planned     |
| M4        | Image Block + Image Variant           | Planned     |
| M5        | Button + Preview + Interaction        | Planned     |
| M6        | Export HTML + Style Consistency       | Planned     |
| M7        | Save / Load + Schema Validation       | Planned     |
| M8        | Drag / Resize + Layout Guide          | Planned     |
| M9        | Import AI / Canva ke Schema           | Planned     |
| M10       | Kuis Sederhana                        | Planned     |
| M11       | Guided Learning Style System          | Planned     |
| M12       | Template Pedagogis                    | Planned     |
| M13       | Paket MPI Production-Ready            | Planned     |
| P1–P4     | Hardening & Release                   | Planned     |
| F1+       | Future Development                    | Future      |

> **Catatan:** M2 sebelumnya sudah pernah diimplementasi sebagai "free text block" tanpa variant (commit `a1f352f`) lalu **di-revert** (commit `1cfadb0`) karena tidak mengikuti kontrak Batch 1B. M2 yang baru wajib memakai field `variant` di text block. Lihat section M2 di bawah.

Urutan lengkap milestone sampai production ada di [`docs/PRODUCTION_ROADMAP.md`](PRODUCTION_ROADMAP.md).

---

## M0 — Repo Skeleton

**Target:** Repo bisa install, run, test, build.

**Isi:**
- Vite React TS setup.
- Folder structure sesuai `docs/CLEAN_ARCHITECTURE.md`.
- README, PRODUCT_CONTRACT, CLEAN_ARCHITECTURE, EXPORT_HTML_CONTRACT, ROADMAP.
- Test awal (boundary test anti-V5).

**Acceptance:**
- `npm install` sukses.
- `npm run dev` jalan.
- `npm run test` lulus.
- `npm run build` lulus.

---

## M1 — Editor Kosong

**Target:** Editor bisa buka project kosong.

**Fitur:**
- Create project.
- 1 halaman default.
- Canvas 1280×720.
- Page panel.
- Inspector placeholder (kosong).
- Tambah halaman.
- Pilih halaman.

**Acceptance:**
- Buka app → canvas muncul.
- Halaman pertama tampil di page panel.
- Tambah halaman → jumlah halaman bertambah.
- Pilih halaman lain → `currentPageId` berubah.

**Scope lock (diperketat setelah Batch 1A):**
Operasi `renamePage`, `deletePage`, dan `duplicatePage` **TIDAK boleh ada** di store atau UI M1. Fitur tersebut milik M3 dan harus ditunda sampai M3 dimulai. Boundary test scope-lock memastikan hal ini.

---

## Batch 1B — Core Contract, Schema, Style Adapter Lock

**Status:** Next / Required Before M2

**Target:** Mengunci arah produk, kontrak data, schema authoring, dan style adapter sebelum fitur block dimulai.

Batch ini wajib dilakukan sebelum M2 agar repo tidak berubah menjadi PowerPoint clone, Canva clone, editor slide kosong, template engine besar, atau campuran renderer/schema/style seperti project sebelumnya.

**Prinsip Utama:** SILSE MPI Editor adalah guided MPI authoring tool untuk guru. UI boleh terasa familiar seperti PowerPoint, tetapi produk bukan PowerPoint clone. **Style bukan dekorasi. Style adalah bagian dari struktur pembelajaran.**

**Scope:**

1. Buat `docs/CORE_PRODUCT_CONTRACT.md` (identitas produk, arah, Page Role, Block Variant, Interaction Pattern, production rule).
2. Buat `docs/STYLE_SCHEMA_CONTRACT.md` (style tokens, visual preset, style adapter, page-role defaults, anti-campur rules).
3. Buat `docs/PRODUCTION_ROADMAP.md` (roadmap lengkap M0–M13 + P1–P4 + F1+).
4. Update `docs/CLEAN_ARCHITECTURE.md` (Style Adapter Rule + Schema Rule, editor=preview=export consistency).
5. Update `docs/ROADMAP.md` (dokumen ini) agar memasukkan B1B sebagai prerequisite M2.
6. Tidak mengubah kode app.
7. Tidak menambah fitur UI.
8. Tidak lanjut M2 sebelum Batch 1B accepted.

**Dilarang:**

- Menambah text block, image block, button block.
- Membuat template engine, contract engine besar, style engine besar, legacy adapter.
- Membawa schema/renderer lama.
- Mengubah store atau UI editor.

**Acceptance:**

1. Dokumen menjelaskan SILSE sebagai guided MPI authoring tool, bukan PowerPoint clone.
2. Dokumen membedakan jelas: Product Contract, Authoring Schema, Style Schema, Style Adapter, Template Pedagogis.
3. Style diposisikan sebagai sistem visual-pedagogis, bukan kosmetik.
4. Style Adapter didefinisikan sebagai resolver dari semantic style ke concrete render style.
5. Editor, Preview, dan Export wajib konsisten memakai style resolve yang sama.
6. Roadmap produksi memasukkan milestone style (M11) dan template pedagogis (M12).
7. Tidak ada perubahan kode app.
8. Tidak ada scope leak.

Lihat [`docs/CORE_PRODUCT_CONTRACT.md`](CORE_PRODUCT_CONTRACT.md) dan [`docs/STYLE_SCHEMA_CONTRACT.md`](STYLE_SCHEMA_CONTRACT.md) untuk detail kontrak.

---

## M2 — Text Block + Text Role Dasar

**Prasyarat:** Batch 1B ACCEPTED.

**Target:** Text block pertama, tetapi dengan role/variant — bukan "free text".

**Fitur:**

- Add text block.
- Select block.
- Render text di canvas.
- Edit text dari inspector.
- Edit x/y/width/height.
- **Field `variant` wajib ada** di setiap text block (default `'body'`).
- Variant bisa dipilih dari inspector (`title`/`subtitle`/`body`/`instruction`/`importantNote`/`questionPrompt`/`reflectionBox`).

**Acceptance:**

- Tambah text block → block punya `variant: 'body'` secara default.
- Ganti variant → field `variant` berubah di data.
- Edit text → canvas berubah real-time.
- Variant tersimpan di JSON project.

**Scope lock:**

- **Belum ada style adapter.** Style masih inline hard-coded minimal, tetapi data block sudah punya field `variant`. Ini anchor untuk M6 (Export HTML + Style Consistency) dan M11 (Guided Learning Style System).
- `removeBlock` sengaja **ditunda** — bukan scope M2.
- Operasi `addImageBlock`/`addButtonBlock` **tidak boleh ada** di store/UI sampai M4/M5.
- Operasi `renamePage`/`deletePage`/`duplicatePage` **tidak boleh ada** sampai M3.
- Scope-lock test di-bump ke **M2-lock**: tombol `+ Teks` ENABLED, tombol lain DISABLED, inspector menampilkan field text-block + variant selector (tidak ada field image/button).
- **Text block tanpa field `variant` = scope leak.** Validation test akan menolak.

**Dilarang di M2:**

- Image block (M4), button block (M5), preview (M5), export HTML (M6), drag/resize (M8), template (M12), page flow lengkap (M3).
- Style adapter (baru di M6).
- Style tokens / visual preset (baru di M11).

> **Pelajaran dari revert M2 sebelumnya:** M2 versi lama (`a1f352f`) membangun text block sebagai "free text" tanpa `variant`. Itu melanggar kontrak Batch 1B dan akan menyulitkan style adapter di M6. M2 yang baru wajib memakai `variant` sejak block pertama dibuat.

---

## M3 — Page Flow Lengkap

**Target:** Bisa membuat banyak halaman dengan operasi lengkap.

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

---

## M4 — Image Block

**Target:** Bisa tambah gambar.

**Fitur:**
- Upload image (file → base64 atau object URL).
- Render image di canvas.
- Edit posisi/ukuran.
- Object-fit: cover / contain.

**Acceptance:**
- Upload gambar → tampil di canvas.
- Resize lewat inspector → gambar menyesuaikan.
- Ganti object-fit → perilaku render berubah.

---

## M5 — Button + Preview

**Target:** MPI bisa dipreview seperti media pembelajaran.

**Fitur:**
- Button block dengan action: next, prev, goto.
- Preview fullscreen (mode terpisah dari editor).
- Navigasi antar halaman di preview.

**Acceptance:**
- Tambah button next → klik di preview → halaman berpindah.
- Tambah button prev → klik di preview → halaman mundur.
- Tambah button goto → klik di preview → halaman target tampil.

---

## M6 — Export HTML

**Target:** Export HTML standalone.

**Output:**
- 1 file HTML.
- CSS inline.
- JS inline.
- Data project embedded.
- Tidak butuh internet.
- Tidak butuh React.

**Acceptance:**
- Export → file `.html` terdownload.
- Buka di browser → halaman tampil.
- Tombol next/prev/goto jalan.
- Network tab: 0 request eksternal.

---

## M7 — Save / Load

**Target:** Project tidak hilang saat browser ditutup.

**Fitur:**
- Autosave ke localStorage.
- Manual save.
- Load project.
- Reset project.
- Export/import JSON.

**Acceptance:**
- Edit project → reload browser → project masih ada.
- Reset project → kembali ke project kosong.
- Export JSON → file terdownload.
- Import JSON → project termuat.

---

## M8 — Drag / Resize

**Target:** Editor enak dipakai tanpa inspector untuk operasi umum.

**Fitur:**
- Drag block di canvas.
- Resize block di canvas (handle pojok).
- Snap sederhana (grid 8px).
- Keyboard delete (tombol Delete/Backspace).

**Acceptance:**
- Block bisa digeser langsung di canvas.
- Block bisa di-resize via handle.
- Snap aktif saat drag dekat grid.
- Pilih block → tekan Delete → block hilang.

---

## M9 — Import AI / Canva

**Target:** Mulai mendekati kebutuhan workflow nyata.

**Fitur awal:**
- Paste JSON sederhana dari AI (format SimpleProject mini).
- Import HTML ringan (parse body menjadi blocks sederhana).
- Import gambar hasil Canva sebagai background halaman.
- Tambah text overlay di atas gambar background.

**Acceptance:**
- Gambar Canva masuk sebagai background halaman.
- Teks bisa diedit di atas gambar.
- Export HTML → background dan teks tampil.

---

## M10 — Kuis Sederhana

**Target:** MPI mendukung pertanyaan pilihan ganda sederhana.

**Fitur:**
- Question block (pertanyaan + pilihan + jawaban benar).
- Feedback benar/salah.
- Skor akhir.

**Acceptance:**
- Tambah kuis → di-preview bisa dijawab.
- Jawaban benar → feedback positif.
- Jawaban salah → feedback negatif.
- Skor terakumulasi.

---

## M11 — Template Ringan

**Target:** Beberapa template sederhana untuk start cepat.

**Fitur:**
- 3–5 template sederhana (cover, materi, latihan).
- Template = preset project JSON, bukan engine.
- Pilih template → project baru terisi template.

**Acceptance:**
- Pilih template cover → project baru muncul dengan halaman cover.
- Edit template → tetap jadi project biasa (tidak terikat template).

---

## M12 — Paket MPI Siap Pakai

**Target:** Bisa dikirim ke guru lain sebagai paket.

**Fitur:**
- Kompres project + asset menjadi satu file `.mpi.zip`.
- Buka paket → langsung jalan di editor.
- Atau: export HTML + paket source JSON.

**Acceptance:**
- Save project sebagai paket → file terdownload.
- Buka paket di mesin lain → project termuat utuh.

---

## Aturan Per Milestone

1. **Satu batch = satu milestone.** Tidak menggabung.
2. **Tidak lompat.** M2 baru mulai setelah M1 acceptance terpenuhi.
3. **Tidak tambah fitur di luar scope.** Jika tergoda tambah sesuatu, tulis di backlog, jangan masukkan commit.
4. **Boundary test wajib lulus** di setiap milestone.
5. **Test, typecheck, build wajib lulus** sebelum milestone ditutup.

## Aturan Scope-Lock (ditambahkan Batch 1A)

Setiap milestone punya daftar fitur eksplisit di section "Fitur:". Yang **TIDAK** ada di daftar itu **TIDAK boleh diimplementasikan**, bahkan jika:

- Kelihatannya sepele (1 baris kode).
- Akan dipakai di milestone berikutnya.
- Implementasinya sudah setengah jadi.
- Mempermudah testing atau demo.

**Pencegahan scope leak:**

1. Sebelum mulai milestone, baca section "Fitur:" dan "Scope lock:" (jika ada) untuk milestone itu.
2. Jika ragu apakah sesuatu masuk scope, asumsikan **tidak** masuk. Tunda ke milestone berikutnya.
3. Setiap commit harus bisa dipetakan ke satu poin di section "Fitur:" milestone aktif.
4. Boundary test scope-lock (di `src/tests/scope-lock.test.ts`) memastikan fitur milestone lain belum aktif di UI/store sampai milestone itu resmi dimulai.

**Pelanggaran scope-lock = milestone dikembalikan ke status "In Progress" dan harus di-patch ulang sebelum lanjut.**
