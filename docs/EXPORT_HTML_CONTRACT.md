# Export HTML Contract — silse-mpi-editor

## Tujuan

Export HTML harus menghasilkan **satu file HTML standalone** yang bisa dibuka di browser manapun tanpa ketergantungan eksternal.

## Kontrak Output

### Format File

- **Satu file** `.html`.
- **CSS inline** di dalam `<style>` tag.
- **JS inline** di dalam `<script>` tag.
- **Data project embedded** sebagai JSON literal di dalam `<script>`.
- **Tidak ada** import eksternal (tidak ada CDN, tidak ada `https://`, tidak ada font Google).

### Self-Contained

File output harus bisa:

- Dibuka dengan double-click di file explorer.
- Dibuka offline tanpa internet.
- Dibuka di browser modern (Chrome, Firefox, Edge, Safari versi 2 tahun terakhir).
- Tidak membutuhkan React, Vite, atau runtime apapun.

### Struktur DOM Output

```html
<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{project.title}}</title>
    <style>
      /* CSS reset + layout canvas 1280×720 + styling block */
    </style>
  </head>
  <body>
    <div id="mpi-root">
      <div id="mpi-canvas" style="width:1280px;height:720px;">
        <!-- Render halaman aktif -->
      </div>
    </div>
    <script id="mpi-data" type="application/json">
      {{project JSON}}
    </script>
    <script>
      /* JS: render halaman, handle next/prev/goto */
    </script>
  </body>
</html>
```

### Canvas Size

- Canvas output **wajib 1280×720 piksel**.
- Tidak ada responsive resize di tahap M6. Canvas fix di 1280×720.
- Jika viewport lebih kecil, gunakan `transform: scale()` untuk fit.

### Navigasi

Output harus mendukung navigasi antar halaman:

- Tombol `next` → pindah ke halaman berikutnya.
- Tombol `prev` → pindah ke halaman sebelumnya.
- Tombol `goto` → pindah ke halaman target (`targetPageId`).
- Tombol di halaman terakhir `next` → tidak melakukan apa-apa (atau disable).
- Tombol di halaman pertama `prev` → tidak melakukan apa-apa (atau disable).

### Rendering Block

Setiap tipe block di-render sebagai berikut:

| Block   | Render                                                |
| ------- | ----------------------------------------------------- |
| `text`  | `<div>` dengan inline style `font-size`, `color`, dll |
| `image` | `<img>` dengan `object-fit` sesuai data               |
| `button`| `<button>` dengan `data-action` dan `data-target`     |

Posisi block menggunakan `position: absolute` relatif terhadap canvas, dengan `left`, `top`, `width`, `height` dari data block.

### Yang TIDAK Boleh Ada di Output

- Tidak ada referensi ke `react`, `react-dom`, atau runtime framework lain.
- Tidak ada referensi ke file di `src/` editor.
- Tidak ada komentar yang menampilkan token, path lokal, atau info internal.
- Tidak ada tag `<script src="...">` eksternal.
- Tidak ada `@import url(...)` eksternal di CSS.

## Acceptance M6

Export dianggap sukses jika:

1. File `.html` dihasilkan dari editor.
2. File bisa di-download oleh pengguna.
3. File dibuka di browser (Chrome/Firefox) → halaman pertama tampil.
4. Klik tombol next → halaman berikutnya tampil.
5. Klik tombol prev → halaman sebelumnya tampil.
6. Klik tombol goto → halaman target tampil.
7. File di-rename, dipindah folder, dikirim via email, dibuka di komputer lain → tetap jalan.
8. Network tab browser menunjukkan **0 request eksternal** saat file dibuka.

## Catatan untuk M0–M5

Kontrak ini adalah target M6. Di M0–M5, file `src/export/export-html.ts` boleh kosong atau berisi stub. Yang penting: jangan mulai implementasi export sebelum M5 selesai, supaya fokus tidak terbagi.
