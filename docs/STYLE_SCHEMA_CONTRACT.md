# Style Schema Contract — SILSE MPI Editor

> Dokumen ini mengunci cara style bekerja di SILSE MPI Editor.
> Style tidak boleh tumbuh menjadi engine besar. Style juga tidak boleh hanya menjadi CSS acak di komponen.
> Style harus menjadi sistem ringan yang menghubungkan schema authoring ke render konkret.

---

## 1. Tujuan

Dokumen ini mengunci cara style bekerja di SILSE MPI Editor.

Style tidak boleh tumbuh menjadi engine besar. Style juga tidak boleh hanya menjadi CSS acak di komponen.

Style harus menjadi sistem ringan yang menghubungkan:

```
Page Role + Block Variant + Visual Preset
        ↓
Style Adapter
        ↓
Resolved Style
        ↓
Editor / Preview / Export HTML
```

---

## 2. Prinsip Style

Style di SILSE adalah **visual-pedagogical style system**.

Artinya style harus mendukung pembelajaran:

- membuat judul jelas,
- membuat instruksi terbaca,
- membedakan pertanyaan dari materi,
- membuat catatan penting menonjol,
- membuat refleksi terasa berbeda,
- membuat navigasi mudah,
- menjaga kontras untuk proyektor,
- menjaga hasil export tetap rapi.

Style **bukan** sekadar:

- warna,
- font,
- radius,
- shadow.

Style adalah cara app membantu guru membuat media yang terstruktur.

---

## 3. Definisi Style Schema

Style schema adalah data sederhana yang bisa disimpan di project.

Contoh bentuk awal:

```ts
type ProjectStyle = {
  presetId: VisualPresetId;
  tokens: StyleTokens;
};
```

Visual preset:

```ts
type VisualPresetId =
  | 'cleanClassroom'
  | 'civicWarm'
  | 'brightKids'
  | 'projectorHighContrast'
  | 'minimalWorksheet';
```

Style tokens:

```ts
type StyleTokens = {
  colors: {
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    text: string;
    mutedText: string;
    border: string;
    success: string;
    warning: string;
    danger: string;
  };

  typography: {
    fontFamily: string;
    titleSize: number;
    subtitleSize: number;
    bodySize: number;
    smallSize: number;
    lineHeight: number;
  };

  spacing: {
    pagePadding: number;
    blockGap: number;
    cardPadding: number;
  };

  radius: {
    small: number;
    medium: number;
    large: number;
  };

  shadow: {
    none: string;
    soft: string;
    medium: string;
  };
};
```

Aturan:

- Tokens harus serializable.
- Tokens tidak boleh menyimpan function.
- Tokens tidak boleh menyimpan class instance.
- Tokens tidak boleh menyimpan CSS framework object besar.
- Tokens boleh diubah nanti lewat migration resmi.

---

## 4. Block Style Data

Block tetap boleh punya override style lokal.

Contoh text block:

```ts
type TextBlockStyle = {
  variant: TextBlockVariant;
  fontSize?: number;
  color?: string;
  fontWeight?: 'normal' | 'bold';
  align?: 'left' | 'center' | 'right';
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
  shadow?: 'none' | 'soft' | 'medium';
};
```

Aturan:

- `variant` memberi style default.
- Override lokal boleh ada.
- Override lokal tidak boleh membuat block keluar dari schema.
- Semua override harus bisa diexport.

---

## 5. Style Adapter

Style Adapter adalah **fungsi resolver**.

Style Adapter **bukan legacy adapter**. Style Adapter tidak mengubah format lama ke format baru. Style Adapter hanya mengubah semantic style menjadi concrete render style.

Contoh konsep:

```ts
type ResolveStyleInput = {
  projectStyle: ProjectStyle;
  pageRole: PageRole;
  blockType: 'text' | 'image' | 'button' | 'question';
  blockVariant?: string;
  localStyle?: Record<string, unknown>;
};

type ResolvedStyle = {
  className?: string;
  inlineStyle: Record<string, string | number>;
};

function resolveBlockStyle(input: ResolveStyleInput): ResolvedStyle
```

Aturan Style Adapter:

1. Input berasal dari data project.
2. Output berupa style konkret.
3. Output harus bisa dipakai editor.
4. Output harus bisa dipakai preview.
5. Output harus bisa dipakai export HTML.
6. Tidak boleh import dari editor.
7. Tidak boleh import dari preview.
8. Tidak boleh import dari export.
9. Tidak boleh bergantung ke DOM.
10. Tidak boleh bergantung ke React.
11. Tidak boleh membaca localStorage.
12. Tidak boleh membaca window.
13. Harus pure function.

Lokasi yang disarankan: `src/core/style/`

Atau jika dipisah: `src/style/`

Namun jika dipisah, dependency tetap harus pure dan tidak boleh import editor/preview/export.

---

## 6. Editor, Preview, Export Consistency

Aturan wajib:

> **Editor = Preview = Export HTML**

Artinya:

- Editor tidak boleh punya style khusus yang hilang di preview.
- Preview tidak boleh punya style khusus yang hilang di export.
- Export tidak boleh menebak style sendiri.
- Semua memakai hasil `resolveBlockStyle`.

Jika export membutuhkan string CSS, export harus mengonversi `ResolvedStyle` yang sama, bukan menulis ulang logic style.

Boundary test untuk konsistensi ini akan ditambahkan saat M6 (Export HTML + Style Consistency). Sebelum itu, semua komponen render wajib memakai `ResolvedStyle` dari adapter yang sama.

---

## 7. Visual Preset

Visual Preset adalah kumpulan token awal.

Visual Preset **bukan template engine**.

Contoh preset:

### `cleanClassroom`

- putih bersih,
- biru lembut,
- kontras baik,
- cocok materi umum.

### `civicWarm`

- warna hangat,
- cocok PPKn/norma/Pancasila,
- formal tetapi ramah.

### `brightKids`

- cerah,
- cocok kelas bawah/SMP awal,
- tetap menjaga keterbacaan.

### `projectorHighContrast`

- kontras tinggi,
- font besar,
- cocok proyektor kelas.

### `minimalWorksheet`

- sederhana,
- cocok LKPD/interaksi ringan,
- tidak ramai.

Aturan:

- Preset hanya mengisi token.
- Setelah preset diterapkan, project tetap project biasa.
- Tidak ada binding permanen ke preset.
- Tidak ada registry kompleks.
- Tidak ada engine template.

---

## 8. Page Role Style Defaults

Page Role boleh memberi default style ringan.

Contoh:

| Page Role | Default Visual |
| --------- | -------------- |
| `cover` | title besar, center, background kuat |
| `learningObjectives` | list/card tujuan |
| `starter` | pertanyaan besar, visual pemantik |
| `material` | body readable, card materi |
| `activity` | instruction box, step list |
| `quiz` | question prompt, choice style |
| `reflection` | reflection box, warna lembut |
| `closing` | ringkas, apresiatif |

Aturan:

- Default boleh membantu.
- Pengguna tetap bisa edit manual.
- Default tidak boleh mengunci layout.
- Default tidak boleh menjadi renderer khusus.

---

## 9. Tests Wajib untuk Style

Saat style mulai diimplementasikan (M11 — Guided Learning Style System, atau saat style adapter pertama kali ditulis), test wajib:

1. `resolveBlockStyle` pure function.
2. Text variant menghasilkan style default benar.
3. Local override mengalahkan default.
4. Visual preset mengubah tokens.
5. Editor memakai style resolved.
6. Preview memakai style resolved.
7. Export memakai style resolved.
8. Export tidak mengandung React.
9. Export tidak request CDN.
10. Snapshot style editor/preview/export konsisten.

Untuk M2 (Text Block + Text Role Dasar), style adapter belum harus lengkap, tetapi text block **wajib** sudah punya field `variant` sesuai kontrak section 4. Tanpa `variant`, style adapter tidak punya anchor untuk resolve.

---

## 10. Anti-Campur-Aduk Rules

Dilarang:

- CSS acak di export yang tidak ada di editor.
- Style logic duplikat di tiga tempat.
- Inline style besar langsung di component tanpa schema.
- Registry theme besar.
- Contract engine lama.
- Adapter legacy.
- Template yang mengatur style secara tersembunyi.
- Preview renderer yang beda hasil dari export renderer.

Jika style mulai bercabang, hentikan milestone dan buat patch architecture.

---

## 11. Milestone Implementasi Style

Implementasi style adapter tidak terjadi dalam satu milestone besar. Style tumbuh bertahap:

| Milestone | Yang ditambahkan |
| --------- | ---------------- |
| M2 | Field `variant` di text block. Belum ada style adapter. |
| M4 | Field `variant` di image block. |
| M5 | Field `variant` di button block. |
| M6 | Style resolve pertama (minimal: variant → style dasar). Editor/preview/export konsisten. |
| M11 | Guided Learning Style System lengkap: `ProjectStyle`, `StyleTokens`, `VisualPreset`, `resolveBlockStyle` full. |

Aturan transisi:

- Sebelum M6, komponen render boleh pakai inline style hard-coded minimal, **tetapi** block data harus sudah punya field `variant` sejak M2.
- Mulai M6, semua komponen render wajib pakai `ResolvedStyle` dari adapter.
- Setelah M6, tidak boleh ada inline style hard-coded baru di komponen render.

---

## 12. Hubungan dengan Dokumen Lain

| Dokumen | Peran untuk style |
| ------- | ----------------- |
| `docs/CORE_PRODUCT_CONTRACT.md` | Page Role + Block Variant + Interaction (semantic layer) |
| `docs/STYLE_SCHEMA_CONTRACT.md` (dokumen ini) | Style tokens + adapter + preset + consistency rule |
| `docs/CLEAN_ARCHITECTURE.md` | Style Adapter Rule + Schema Rule (layer dependency) |
| `docs/EXPORT_HTML_CONTRACT.md` | Bagaimana ResolvedStyle dibawa ke HTML output |
