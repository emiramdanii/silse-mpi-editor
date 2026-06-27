# Clean Architecture — silse-mpi-editor

## Layer Repo

Repo dibagi menjadi layer berikut, dengan aturan dependency satu arah:

```
src/
├─ core/        # Pure logic. Tidak boleh import dari layer lain.
├─ store/       # State management. Boleh import core. Tidak boleh import editor/blocks.
├─ blocks/      # Komponen render block. Boleh import core. Tidak boleh import editor.
├─ editor/      # UI editor. Boleh import core, store, blocks.
├─ preview/     # UI preview. Boleh import core, blocks. Tidak boleh import editor.
├─ export/      # Export HTML. Boleh import core. Tidak boleh import editor/preview.
└─ tests/       # Test files. Boleh import apa saja yang ada di src/.
```

## Aturan Dependency

| Layer      | Boleh import                                       | Tidak boleh import                          |
| ---------- | -------------------------------------------------- | ------------------------------------------- |
| `core`     | hanya modul standar & sesama `core`                | store, editor, blocks, preview, export      |
| `store`    | `core`                                             | editor, blocks, preview, export             |
| `blocks`   | `core`                                             | store, editor, preview, export              |
| `editor`   | `core`, `store`, `blocks`                          | preview, export                             |
| `preview`  | `core`, `blocks`                                   | editor, store, export                       |
| `export`   | `core`                                             | editor, store, blocks, preview              |
| `tests`    | bebas dari `src/`                                  | tidak ada batasan                           |

## Yang BOLEH Ada

Konsep yang diizinkan di repo ini:

- `project` — root data structure.
- `page` — halaman dalam project.
- `block` — elemen di halaman (text/image/button).
- `canvas` — area render editor.
- `preview` — mode preview MPI.
- `export` — output HTML standalone.
- `storage` — persistence localStorage.

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

1. **Tidak ada template engine.** Tidak ada registry, tidak ada preset, tidak ada theme contract.
2. **Tidak ada contract engine.** Tidak ada validator schema yang berasal dari V5.
3. **Tidak ada style engine besar.** Styling langsung di komponen, inline style atau CSS module minimal.
4. **Tidak ada legacy adapter.** Tidak ada kode yang menerima format lama dan menerjemahkannya.
5. **Tidak ada fallback V5.** Jika data tidak valid, tampilkan error. Jangan coba fallback ke format lama.
6. **Scope-lock per milestone (ditambahkan Batch 1A).** Setiap milestone punya daftar fitur eksplisit di `docs/ROADMAP.md`. Yang tidak ada di daftar tidak boleh diimplementasikan, bahkan jika kelihatannya sepele atau akan dipakai nanti. Boundary test scope-lock ada di `src/tests/scope-lock.test.tsx` dan assertion scope-lock di `src/tests/store.test.ts`. Pelanggaran scope-lock = milestone dikembalikan ke "In Progress" dan harus di-patch ulang.

## Boundary Test

File-file berikut wajib lulus sebelum setiap commit:

| File                                  | Tujuan                                                     |
| ------------------------------------- | --------------------------------------------------------- |
| `src/tests/boundary.test.ts`          | Memastikan tidak ada identifier V5 terlarang di `src/`.   |
| `src/tests/scope-lock.test.tsx`       | Memastikan fitur milestone lain belum aktif di UI.        |
| `src/tests/store.test.ts` (scope-lock)| Memastikan store tidak expose operasi milestone lain.      |
