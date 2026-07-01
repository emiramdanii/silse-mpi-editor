# Product Contract — silse-mpi-editor

## Tujuan Repo

Repo `silse-mpi-editor` adalah **editor MPI (Media Pembelajaran Interaktif) sederhana**. Tujuan utamanya: membuat MPI dari nol atau dari hasil AI/Canva, bisa diedit, dipreview, dan di-export sebagai HTML standalone.

## Yang Dikerjakan

Target utama versi awal (M0–M6):

1. **Halaman** — multi-page, bisa tambah/hapus/rename/duplikat.
2. **Teks** — text block dengan font size, color, weight, align.
3. **Gambar** — image block dengan object-fit cover/contain.
4. **Tombol navigasi** — next, prev, goto page.
5. **Preview** — fullscreen simulasi MPI.
6. **Export HTML** — satu file HTML standalone, tanpa internet, tanpa React.

## Yang TIDAK Dikerjakan

Repo ini secara eksplisit **bukan**:

- Pengganti PowerPoint penuh.
- Authoring tool V5.
- Template engine (ditunda M11).
- Contract engine (tidak akan dibuat).
- Style engine besar (tidak akan dibuat).
- Game engine (tidak akan dibuat).
- Kuis kompleks (M10 sederhana saja).
- AI importer besar (M9 ringan saja).
- Legacy adapter (tidak akan dibuat).

## Prinsip Produk

1. **Kecil dulu, jalan dulu.** Setiap milestone harus bisa di-test dan di-build sebelum lanjut.
2. **Tidak bawa V5.** Tidak ada import, tidak ada adapter, tidak ada fallback ke kode lama.
3. **Standalone output.** Export HTML harus bisa dibuka tanpa internet dan tanpa runtime eksternal.
4. **Local-first.** Editor ini dipakai lokal di mesin pengguna, bukan server-side rendering.
5. **Satu batch, satu milestone.** Tidak ada lompatan, tidak ada fitur di luar scope milestone aktif.

## Stakeholder & Pengguna

- Pengguna utama: Bapak/Ibu guru yang membuat MPI untuk kebutuhan kelas.
- Mode pakai: install lokal → buka editor → buat/edit MPI → preview → export HTML → distribusikan ke siswa.

## Out of Scope Eksplisit

Berikut hal-hal yang tidak boleh masuk repo ini dalam milestone apapun kecuali dinyatakan eksplisit di roadmap:

- Multi-user collaboration.
- Cloud sync.
- Server-side rendering (SSR).
- Plugin system.
- Theme marketplace.
- Asset marketplace.
- Analytics/telemetry.

## Definisi "Selesai" per Milestone

Setiap milestone dianggap selesai jika:

1. Semua acceptance criteria terpenuhi.
2. Test lulus (`npm run test`).
3. Type check lulus (`npm run typecheck`).
4. Build lulus (`npm run build`).
5. Boundary test anti-V5 lulus.
6. Tidak ada fitur di luar scope milestone yang masuk ke commit.
