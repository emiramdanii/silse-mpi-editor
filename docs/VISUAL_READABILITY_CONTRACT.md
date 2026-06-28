# Visual Readability Contract

> Semua teks utama harus terbaca terhadap background. Cover dan closing wajib punya kontras tinggi. Editor, preview, dan export harus memakai hasil resolver yang sama.

## Aturan

1. **Background gelap tidak boleh memakai teks gelap.** Jika background halaman gelap, teks otomatis menjadi terang (putih atau krem terang).
2. **Background terang tidak boleh memakai teks terlalu pucat.** Jika background halaman terang, teks utama tetap gelap, teks muted tetap terbaca.
3. **Cover dan closing wajib punya kontras tinggi.** Minimum contrast ratio 4.5:1 (WCAG AA).
4. **Editor = Preview = Export.** Resolver yang sama, warna yang sama. Tidak ada render khusus per mode.

## Implementasi

### Contrast Helper (`src/core/design/contrast.ts`)
Pure functions:
- `isDarkColor(color)` — true jika luminance rendah
- `getContrastRatio(foreground, background)` — ratio 1-21
- `getReadableTextColor(backgroundColor)` — '#ffffff' atau '#111827'
- `getReadableMutedTextColor(backgroundColor)` — terang-pucat atau gelap-pucat

### Resolver Patch (`resolveComponentStyle.ts`)
Untuk `page.role === 'cover' || 'closing'` + `component.type === 'text'`:
- title/body/questionPrompt → `getReadableTextColor(page.background.color)`
- subtitle → `getReadableMutedTextColor(page.background.color)`

Patch dilakukan di `getResolvedComponentStyle()` yang menerima `page` (termasuk background). Resolver tetap pure — tidak baca DOM/window.

### Page Status Visual Issue (`mpi-page-status.ts`)
Cover/closing dengan background gelap + teks tidak readable → warning.

## Non-Goals
- Tidak mengganti warna manual di sample (resolver yang menangani).
- Tidak membuat renderer khusus editor.
- Tidak menambah style pack.
