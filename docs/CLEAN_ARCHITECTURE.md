# Clean Architecture — silse-mpi-editor

## Layer Repo

Repo dibagi menjadi layer berikut, dengan aturan dependency satu arah:

```
src/
├─ core/            # Pure logic. Sumber data/schema. Tidak boleh import dari layer lain.
│  └─ style/        # (akan datang di M6/M11) Style adapter — pure resolver, bagian dari core.
├─ store/           # State management. Boleh import core. Tidak boleh import editor/blocks.
├─ blocks/          # Komponen render block. Boleh import core. Tidak boleh import editor.
├─ editor/          # UI editor. Boleh import core, store, blocks.
├─ preview/         # UI preview. Boleh import core, blocks. Tidak boleh import editor.
├─ export/          # Export HTML. Boleh import core. Tidak boleh import editor/preview.
└─ tests/           # Test files. Boleh import apa saja yang ada di src/.
```

> **Catatan:** `core/style/` belum ada di kode sampai M6 (style adapter pertama). Posisinya sudah dipersiapkan di arsitektur sejak Batch 1B agar tidak ada kebingungan saat implementasi.

## Aturan Dependency

| Layer          | Boleh import                                       | Tidak boleh import                          |
| -------------- | -------------------------------------------------- | ------------------------------------------- |
| `core`         | hanya modul standar & sesama `core` (termasuk `core/style`) | store, editor, blocks, preview, export      |
| `core/style`   | hanya `core` (pure function, no DOM/React/window)  | store, editor, blocks, preview, export, DOM, React, window, localStorage |
| `store`        | `core`                                             | editor, blocks, preview, export             |
| `blocks`       | `core`                                             | store, editor, preview, export              |
| `editor`       | `core`, `store`, `blocks`                          | preview, export                             |
| `preview`      | `core`, `blocks`                                   | editor, store, export                       |
| `export`       | `core`                                             | editor, store, blocks, preview              |
| `tests`        | bebas dari `src/`                                  | tidak ada batasan                           |

## Yang BOLEH Ada

Konsep yang diizinkan di repo ini:

- `project` — root data structure.
- `page` — halaman dalam project. Boleh punya `pageRole` (metadata ringan, bukan engine).
- `block` — elemen di halaman (text/image/button). **Wajib punya `variant`** sejak M2.
- `canvas` — area render editor.
- `preview` — mode preview MPI.
- `export` — output HTML standalone.
- `storage` — persistence localStorage.
- `style adapter` — pure resolver dari semantic style ke concrete render style (di `core/style/`, datang di M6).
- `visual preset` — kumpulan token awal untuk style (datang di M11).

## Yang TIDAK BOLEH Ada

Berikut konsep dan identifier **dilarang** masuk ke `src/`. Boundary test akan memastikan tidak ada string ini di kode:

| Dilarang                    | Alasan                                       |
| --------------------------- | -------------------------------------------- |
| `CourseTemplateRegistry`    | V5 template engine, ditolak total            |
| `TemplateThemeContract`     | V5 contract engine, ditolak total            |
| `PagePresetRegistry`        | V5 preset, ditolak total                     |
| `CoverRenderer`             | V5 renderer lama, ditolak total              |
| `SchemaRenderer`            | V5 renderer lama, ditolak total              |
| `silse-fresh`               | Legacy project identifier                    |
| `silse-studio`              | Legacy project identifier                    |
| `norma-golden`              | Legacy template name                         |
| `modern-educator`           | Legacy template name                         |
| `golden-pertemuan`          | Legacy template name                         |
| `academic-clean`            | Legacy template name                         |

Boundary test ada di `src/tests/boundary.test.ts`.

## Aturan Tambahan

1. **Tidak ada template engine.** Tidak ada registry, tidak ada preset registry rumit, tidak ada theme contract engine.
2. **Tidak ada contract engine.** Tidak ada validator schema yang berasal dari V5. Validasi schema boleh, tetapi sebagai pure function di `core/`, bukan engine besar.
3. **Tidak ada style engine besar.** Styling boleh pakai style adapter (pure function di `core/style/`), tetapi **dilarang** membuat style registry, theme engine, atau style logic duplikat di editor/preview/export.
4. **Tidak ada legacy adapter.** Tidak ada kode yang menerima format lama dan menerjemahkannya.
5. **Tidak ada fallback V5.** Jika data tidak valid, tampilkan error. Jangan coba fallback ke format lama.
6. **Scope-lock per milestone (ditambahkan Batch 1A).** Setiap milestone punya daftar fitur eksplisit di `docs/ROADMAP.md`. Yang tidak ada di daftar tidak boleh diimplementasikan, bahkan jika kelihatannya sepele atau akan dipakai nanti. Boundary test scope-lock ada di `src/tests/scope-lock.test.tsx` dan assertion scope-lock di `src/tests/store.test.ts`. Pelanggaran scope-lock = milestone dikembalikan ke "In Progress" dan harus di-patch ulang.
7. **Variant wajib di block (ditambahkan Batch 1B).** Sejak M2, setiap text block wajib punya field `variant`. Sejak M4/M5, image/button block juga wajib punya `variant`. Block tanpa `variant` = scope leak. Validation test akan menolak.

## Style Adapter Rule (ditambahkan Batch 1B)

Style adapter adalah **pure resolver** dari semantic style menjadi concrete render style.

Aturan:

- Style adapter **tidak boleh** import editor, preview, export, store, DOM, atau React.
- Style adapter **tidak boleh** membaca `localStorage` atau `window`.
- Style adapter **harus** pure function (input yang sama → output yang sama, no side effect).
- Editor, Preview, dan Export **harus** memakai hasil resolve style yang sama.
- **Tidak boleh** ada style logic berbeda antara editor, preview, dan export.

Lokasi: `src/core/style/` (atau `src/style/` jika dipisah, tetapi dependency tetap pure).

Implementasi style adapter pertama di M6. Sebelum M6, komponen render boleh pakai inline style hard-coded minimal, **tetapi** block data wajib sudah punya field `variant` sejak M2 sebagai anchor.

Lihat [`docs/STYLE_SCHEMA_CONTRACT.md`](STYLE_SCHEMA_CONTRACT.md) untuk detail kontrak style.

## Schema Rule (ditambahkan Batch 1B)

Authoring schema adalah **sumber data utama**.

Aturan:

- Page Role, Block Variant, Interaction Pattern, dan Style Tokens **harus** tersimpan sebagai data serializable (JSON).
- **Tidak boleh** membuat renderer khusus yang menyembunyikan schema.
- **Tidak boleh** membuat schema engine besar yang mengatur render secara tersembunyi.
- Schema boleh divalidasi (pure function di `core/validation.ts`), tetapi validasi bukan engine.
- Schema boleh berkembang, tetapi hanya lewat milestone resmi dan test.

Lihat [`docs/CORE_PRODUCT_CONTRACT.md`](CORE_PRODUCT_CONTRACT.md) untuk definisi Page Role, Block Variant, dan Interaction Pattern.

## Editor = Preview = Export Consistency (ditambahkan Batch 1B)

Aturan wajib:

> **Editor = Preview = Export HTML**

Artinya:

- Editor tidak boleh punya style khusus yang hilang di preview.
- Preview tidak boleh punya style khusus yang hilang di export.
- Export tidak boleh menebak style sendiri.
- Semua memakai hasil `resolveBlockStyle` (mulai M6).

Sebelum M6, konsistensi ini masih longgar (inline style hard-coded), tetapi setelah M6, **tidak boleh ada inline style hard-coded baru** di komponen render. Semua via `ResolvedStyle` dari adapter.

Jika editor, preview, dan export memakai logika style berbeda, milestone belum boleh accepted.

## Boundary Test

File-file berikut wajib lulus sebelum setiap commit:

| File                                  | Tujuan                                                     |
| ------------------------------------- | --------------------------------------------------------- |
| `src/tests/boundary.test.ts`          | Memastikan tidak ada identifier V5 terlarang di `src/`.   |
| `src/tests/scope-lock.test.tsx`       | Memastikan fitur milestone lain belum aktif di UI.        |
| `src/tests/store.test.ts` (scope-lock)| Memastikan store tidak expose operasi milestone lain.      |
