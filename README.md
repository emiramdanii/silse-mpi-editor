# SILSE MPI Editor

> Editor **Media Pembelajaran Interaktif (MPI)** sederhana. Clean-room, tanpa beban V5.

## Apa Ini

`silse-mpi-editor` adalah editor lokal untuk membuat MPI sederhana. Bukan pengganti PowerPoint, bukan authoring tool besar, bukan kelanjutan V5. Repo ini dimulai dari nol dengan tujuan jelas: **bisa dipakai untuk membuat MPI, diedit, dipreview, dan di-export sebagai HTML standalone**.

Versi awal (M0–M6) fokus hanya pada halaman, teks, gambar, tombol navigasi, preview, dan export HTML. Fitur kompleks seperti template engine, kuis, game, contract style, dan AI importer **tidak masuk** di tahap awal.

## Cara Install

Prasyarat: Node.js 18+ dan npm.

```bash
git clone https://github.com/emiramdanii/silse-mpi-editor.git
cd silse-mpi-editor
npm install
```

## Cara Run

Jalankan editor di lokal (mode development):

```bash
npm run dev
```

Buka browser ke URL yang ditampilkan Vite (default: `http://localhost:5173`).

## Cara Test

```bash
npm run test        # sekali jalan
npm run test:watch  # watch mode saat development
npm run typecheck   # TypeScript strict check tanpa emit
```

## Cara Build

```bash
npm run build
```

Output ada di `dist/`. Untuk M0–M1, build masih berupa shell editor kosong. Export HTML standalone mengikuti milestone M6.

## Batasan Versi Awal (M0–M1)

Yang sudah ada:

- Editor shell dengan canvas 1280×720.
- Page panel untuk daftar halaman.
- Inspector placeholder (belum berisi editor block).
- Bisa buat project baru (1 halaman default).
- Bisa tambah halaman.
- Bisa pilih halaman.

Yang **belum** ada di M0–M1:

- Text block, image block, button block (M2, M4, M5).
- Drag/resize block (M8).
- Preview fullscreen (M5).
- Export HTML (M6).
- Save/load localStorage (M7).
- Import dari AI/Canva (M9).
- Kuis, template, game (M10+).

## Aturan Penting

Repo ini **clean-room**. Dilarang import apa pun dari V5 atau project lama. Lihat [`docs/CLEAN_ARCHITECTURE.md`](docs/CLEAN_ARCHITECTURE.md) untuk aturan dependency dan boundary test.

## Dokumen

- [`docs/PRODUCT_CONTRACT.md`](docs/PRODUCT_CONTRACT.md) — apa yang repo ini kerjakan dan tidak kerjakan.
- [`docs/CLEAN_ARCHITECTURE.md`](docs/CLEAN_ARCHITECTURE.md) — aturan layer dan boundary.
- [`docs/EXPORT_HTML_CONTRACT.md`](docs/EXPORT_HTML_CONTRACT.md) — kontrak output HTML standalone.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — milestone M0–M12.

## Lisensi

Internal use. Belum ditentukan lisensi publik.
