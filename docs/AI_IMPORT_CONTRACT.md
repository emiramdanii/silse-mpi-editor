# AI Import Contract — SILSE MPI Editor

> Dokumen ini mengunci format input yang diterima SILSE dari AI generator.
> AI output **wajib JSON SILSE**. Bukan HTML/CSS/JS bebas.

---

## 1. Filosofi

SILSE adalah **editor remix MPI hasil AI**. Alur produk:

```
AI generate MPI JSON → app import → style/layout/interaksi dimodifikasi → export HTML
```

AI (ChatGPT, Claude, Gemini, dll) dipakai untuk **generate struktur MPI** dalam format JSON SILSE. SILSE kemudian mengimpor JSON itu, memvalidasi terhadap schema, dan memungkinkan user memodifikasi style/layout/interaksi sebelum di-export HTML standalone.

**Yang boleh AI hasilkan:** struktur MPI (pages, components, layoutId, stylePack, interaction config, scoring config).

**Yang TIDAK boleh AI hasilkan:** HTML/CSS/JS bebas. Style diproduksi via StylePack tokens, bukan className atau inline style dari AI.

---

## 2. Aturan Wajib

### 2.1 Format Wajib JSON

AI output **wajib** JSON yang sesuai dengan schema SILSE (`SimpleProject` + `ProjectStyle`). Tidak boleh:

- Raw HTML string.
- Raw CSS string.
- Script tag (`<script>`).
- External CDN URL.
- className bebas.
- File biner (gambar di-embed sebagai base64 di field `src`).

### 2.2 Dilarang

| Dilarang             | Alasan                                                   |
| -------------------- | -------------------------------------------------------- |
| Raw HTML parsing     | Style harus lewat StylePack tokens, bukan HTML bebas     |
| Raw CSS parsing      | CSS tidak konsisten editor vs preview vs export          |
| Script injection     | Keamanan + export HTML harus deterministic               |
| External CDN         | Export harus standalone, 0 request eksternal             |
| className bebas      | Semua style via StylePack tokens + recipe resolver       |
| Inline style dari AI | Override lokal hanya via UI editor, bukan dari AI        |

### 2.3 Yang Boleh Dibawa AI JSON

AI JSON boleh berisi:

| Field                | Wajib? | Deskripsi                                              |
| -------------------- | ------ | ------------------------------------------------------ |
| `title`              | opsional | Judul project                                        |
| `pages`              | wajib  | Array halaman, minimal 1                                |
| `pages[].title`      | opsional | Default by role (Cover, Materi, dst)                 |
| `pages[].role`       | opsional | Default by heuristic: page[0]=cover, lainnya=free    |
| `pages[].layoutId`   | opsional | Default `'blank'`. Konkret layout recipe di M4        |
| `pages[].background` | opsional | Default `{ type:'color', color:'#ffffff' }`           |
| `pages[].components` | opsional | Default `[]`. Komponen pembelajaran                  |
| `components[].type`  | wajib  | `'text'` di M2, `'image'` di M4, `'navigation'` di M5  |
| `components[].variant` | opsional | Default by PageRole + type                          |
| `components[].text`  | wajib (text) | Konten teks                                       |
| `stylePack`          | opsional | StylePack referent atau inline tokens                |
| `interaction config` | opsional | Konkret di M5/M11                                     |
| `scoring config`     | opsional | Konkret di M10                                        |

### 2.4 Mapping Otomatis (di M8)

Saat import, SILSE melakukan mapping otomatis untuk field yang tidak disertakan AI:

1. **`role` kosong** → page pertama = `'cover'`, lainnya = `'free'`.
2. **`variant` kosong** → default by PageRole (cover→title, starter→questionPrompt, dll).
3. **`stylePack` kosong** → pakai `DEFAULT_STYLE_PACK` (cleanClassroom).
4. **`title` page kosong** → default by role (Cover, Materi, Pemantik, dst).
5. **`background` kosong** → `{ type:'color', color:'#ffffff' }`.

Mapping ini menjamin setiap project hasil import **selalu valid** sesuai schema SILSE.

---

## 3. Schema AI JSON (contoh minimal)

```json
{
  "title": "MPI PPKn Kelas 7 - Gotong Royong",
  "pages": [
    {
      "title": "Cover",
      "role": "cover",
      "components": [
        { "type": "text", "variant": "title", "text": "Gotong Royong di Sekitar Kita" }
      ]
    },
    {
      "title": "Materi",
      "role": "material",
      "layoutId": "blank",
      "components": [
        { "type": "text", "variant": "subtitle", "text": "Pengertian Gotong Royong" },
        { "type": "text", "variant": "body", "text": "Gotong royong adalah..." }
      ]
    }
  ],
  "stylePackId": "civicWarm"
}
```

Catatan:
- `id` field di-generate oleh SILSE saat import (AI tidak perlu sertakan).
- `x/y/width/height` component opsional — SILSE akan auto-layout kalau kosong (fitur M9).
- `stylePackId` boleh referent string (`"civicWarm"`) — SILSE resolve ke built-in pack.
- Atau `stylePack` boleh inline object lengkap (untuk preset custom dari AI).

---

## 4. Schema AI JSON (contoh dengan stylePack inline)

```json
{
  "title": "MPI Matematika SMP - Persamaan Linear",
  "pages": [...],
  "stylePack": {
    "id": "mathClassroom",
    "name": "Math Classroom",
    "description": "Style custom dari AI",
    "colors": {
      "background": "#f0f9ff",
      "surface": "#e0f2fe",
      "primary": "#0369a1",
      "secondary": "#0ea5e9",
      "text": "#0c4a6e",
      "mutedText": "#475569",
      "border": "#bae6fd",
      "success": "#16a34a",
      "warning": "#d97706",
      "danger": "#dc2626"
    },
    "typography": {
      "fontFamily": "Inter, sans-serif",
      "titleSize": 48,
      "subtitleSize": 28,
      "bodySize": 18,
      "smallSize": 14,
      "lineHeight": 1.5
    },
    "spacing": { "pagePadding": 64, "componentGap": 16, "cardPadding": 16 },
    "radius": { "small": 4, "medium": 8, "large": 16 },
    "shadow": { "none": "none", "soft": "0 1px 2px rgba(0,0,0,0.05)", "medium": "0 4px 12px rgba(0,0,0,0.10)" },
    "componentRecipes": {},
    "interactionRecipes": {},
    "scoringRecipes": {}
  }
}
```

---

## 5. Aturan Validasi Import (M8)

Saat M8 (AI JSON Import MVP) diimplementasikan:

1. **Parse JSON** → kalau gagal parse, return error jelas.
2. **Validasi terhadap schema** → kalau tidak sesuai, return error dengan path field.
3. **Mapping otomatis** → isi field yang hilang dengan default.
4. **Reject** kalau ada:
   - Field `html`, `css`, `script`, `cdn`, `className` di root atau di component.
   - Komponen dengan `type` yang tidak dikenal (di luar COMPONENT_TYPES).
   - Page dengan `role` yang tidak valid (di luar PAGE_ROLES).
   - Component dengan `variant` yang tidak valid.
5. **Accept** kalau semua valid → muat ke editor, ganti current project.

---

## 6. Yang TIDAK Termasuk Kontrak Ini

- **Import HTML/CSS bebas** — dilarang total. Bukan scope SILSE.
- **Import dari Canva** — Canva export ke gambar, bukan JSON SILSE. Gambar Canva boleh di-upload sebagai `background` halaman atau `imageCard` component (M4), tetapi bukan sebagai "import Canva project".
- **AI import UI** — belum dibuat di Batch 2S. UI import baru di M8.
- **AI generation** — SILSE tidak generate MPI; SILSE hanya mengimpor hasil AI. User bertanggung jawab mendapatkan JSON dari AI tool pilihannya.

---

## 7. Hubungan dengan Dokumen Lain

| Dokumen | Peran untuk AI import |
| ------- | --------------------- |
| `docs/CORE_PRODUCT_CONTRACT.md` | Identitas produk sebagai remix editor |
| `docs/STYLE_SCHEMA_CONTRACT.md` | StylePack schema yang jadi target import |
| `docs/AI_IMPORT_CONTRACT.md` (dokumen ini) | Kontrak format input dari AI |
| `docs/ROADMAP.md` | M8 = AI JSON Import + Style Import MVP |
| `docs/CLEAN_ARCHITECTURE.md` | Layer `core/` tempat import mapper (M8) |

---

## 8. Acceptance Kontrak

Kontrak ini dianggap ditegakkan ketika:

1. Dokumen `AI_IMPORT_CONTRACT.md` ada di repo.
2. ROADMAP M8 menyebut "wajib JSON SILSE" dan tidak menyebut "Import HTML ringan".
3. Boundary test memastikan tidak ada parser HTML/CSS di `src/` (sebelum M8).
4. M8 implementation menolak JSON dengan field `html`/`css`/`script`/`cdn`/`className` di root atau component.
