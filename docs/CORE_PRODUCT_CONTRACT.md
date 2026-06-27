# Core Product Contract — SILSE MPI Editor

> Dokumen ini mengunci identitas dan arah produk SILSE MPI Editor.
> Semua keputusan arsitektur, schema, style, dan fitur harus mengacu ke dokumen ini.
> Jika ada pertentangan antara permintaan fitur dan kontrak ini, kontrak ini menang.

---

## 1. Identitas Produk

SILSE MPI Editor adalah aplikasi untuk membantu guru membuat **Media Pembelajaran Interaktif (MPI)** secara terpandu.

Produk ini **bukan**:

- PowerPoint clone.
- Canva clone.
- Editor slide kosong.
- Template engine besar.
- Authoring tool bebas tanpa arah pedagogis.

Produk ini **adalah**:

> *Guided MPI authoring tool berbasis halaman 16:9, dengan struktur pembelajaran, style edukatif, interaksi sederhana, preview, save/load, dan export HTML standalone offline.*

---

## 2. Arah Produk

Aplikasi ini mengambil kemudahan interaksi dari PowerPoint, seperti:

- halaman/slide,
- canvas 16:9,
- teks,
- gambar,
- tombol,
- drag/resize,
- preview.

Namun arah produknya berbeda. PowerPoint fokus pada presentasi. SILSE fokus pada media pembelajaran interaktif.

Perbedaan utama:

| PowerPoint | SILSE MPI Editor |
| ---------- | ---------------- |
| Slide bebas | Halaman pembelajaran terpandu |
| Desain bebas | Style edukatif terstruktur |
| Presentasi | Media pembelajaran interaktif |
| Animasi dan transisi | Interaksi belajar sederhana |
| Output PPT/PDF/video | Output HTML standalone offline |
| Template visual | Template pedagogis + visual |
| Guru mulai dari blank slide | Guru dibantu page role dan block variant |

UI boleh terasa familiar seperti PowerPoint, tetapi produk bukan PowerPoint clone. PowerPoint hanya referensi kemudahan interaksi canvas, bukan arah arsitektur.

---

## 3. Core Philosophy

Aplikasi harus dibangun dengan prinsip berikut:

1. **Guided, not blank.** Pengguna boleh membuat dari kosong, tetapi app harus mengarahkannya ke struktur MPI yang benar.
2. **Pedagogical first.** Style, layout, dan template harus membantu pembelajaran, bukan hanya mempercantik.
3. **HTML-first output.** Semua keputusan render harus bisa dibawa ke export HTML standalone.
4. **Local-first.** App harus tetap bisa dipakai tanpa server dan tanpa internet.
5. **Simple data, strong contract.** Data harus sederhana, tetapi kontraknya kuat agar tidak bercampur.
6. **No hidden engine.** Jangan membuat engine besar yang diam-diam mengatur semua hal.
7. **Editor = Preview = Export.** Apa yang terlihat di editor harus sama dengan preview dan export.

---

## 4. Kontrak Struktur Pembelajaran

SILSE memakai konsep **Page Role**.

Page Role adalah peran pedagogis halaman, bukan template engine.

Page Role awal:

```ts
type PageRole =
  | 'free'
  | 'cover'
  | 'learningObjectives'
  | 'starter'
  | 'material'
  | 'activity'
  | 'quiz'
  | 'reflection'
  | 'closing';
```

Penjelasan:

| Page Role | Fungsi |
| --------- | ------ |
| `free` | halaman bebas |
| `cover` | halaman pembuka |
| `learningObjectives` | tujuan pembelajaran |
| `starter` | pemantik |
| `material` | materi utama |
| `activity` | aktivitas siswa |
| `quiz` | evaluasi/kuis |
| `reflection` | refleksi |
| `closing` | penutup |

Aturan:

- Page Role adalah **metadata ringan**, bukan engine.
- Page Role tidak boleh menjadi engine besar.
- Page Role boleh membantu style default.
- Page Role boleh membantu template pedagogis.
- Page Role harus tetap serializable ke JSON.
- Page tetap bisa diedit manual setelah dibuat.

---

## 5. Kontrak Block Variant

Block Variant adalah peran visual-pedagogis block.

Block Variant bukan komponen baru yang rumit. Ini metadata untuk membantu style dan rendering.

Text block variant awal:

```ts
type TextBlockVariant =
  | 'title'
  | 'subtitle'
  | 'body'
  | 'instruction'
  | 'importantNote'
  | 'questionPrompt'
  | 'reflectionBox';
```

Image block variant awal:

```ts
type ImageBlockVariant =
  | 'illustration'
  | 'background'
  | 'imageCard';
```

Button block variant awal:

```ts
type ButtonBlockVariant =
  | 'navigation'
  | 'primaryAction'
  | 'secondaryAction'
  | 'choice';
```

Aturan:

- Variant membantu style default.
- Variant tidak boleh memaksa struktur kompleks.
- Variant tidak boleh mengikat block ke template.
- Variant harus bisa diubah manual.
- Variant harus ikut export.

---

## 6. Kontrak Interaction Pattern

Interaction Pattern adalah pola interaksi pembelajaran sederhana.

Interaction awal:

```ts
type InteractionPattern =
  | 'none'
  | 'next'
  | 'prev'
  | 'goto'
  | 'reveal'
  | 'choiceFeedback'
  | 'hotspot'
  | 'tabs'
  | 'accordion';
```

Aturan:

- Interaksi harus sederhana.
- Interaksi harus bisa jalan di export HTML standalone.
- Interaksi tidak boleh bergantung ke React runtime.
- Interaksi kompleks masuk future development.
- Preview dan export harus punya perilaku sama.

---

## 7. Batasan Kontrak

Dilarang membuat:

- Contract engine besar.
- Schema renderer besar.
- Template registry kompleks.
- Style registry kompleks.
- Adapter legacy.
- Fallback ke format lama.
- Renderer khusus yang hanya jalan di editor.
- Style yang tidak bisa diexport.

Kontrak ini boleh berkembang, tetapi hanya lewat milestone resmi dan test.

---

## 8. Production Rule

Sebelum production-ready, semua fitur utama harus mengikuti aturan ini:

```
Authoring Data → Validation → Style Resolve → Editor Render
                                     ↓
                                  Preview
                                     ↓
                                  Export HTML
```

**Tidak boleh ada tiga jalur render yang hasilnya berbeda.**

Jika editor, preview, dan export memakai logika style berbeda, milestone belum boleh accepted.

---

## 9. Anti-Pattern yang Harus Dihindari

Berikut pola yang secara eksplisit dilarang karena merupakan akar kegagalan V5:

1. **Membangun editor kosong dulu, baru memikirkan style/schema kemudian.** Hasilnya: style akan ditempel ad-hoc, dan akhirnya tiga renderer (editor/preview/export) berbeda hasil.
2. **Membuat text block sebagai "free text" tanpa variant.** Hasilnya: tidak ada cara konsisten untuk menerapkan style pedagogis, dan template tidak bisa membantu.
3. **Membiarkan export menulis ulang logika style.** Hasilnya: preview dan export berbeda, MPI di kelas berbeda dari MPI di editor.
4. **Menambah fitur block sebelum style adapter dikunci.** Hasilnya: setiap block baru membawa style-nya sendiri, dan akhirnya jadi campur aduk.
5. **Membuat registry theme/preset besar.** Hasilnya: registry menjadi engine besar yang susah di-test dan susah di-export.

---

## 10. Hubungan dengan Dokumen Lain

| Dokumen | Peran |
| ------- | ----- |
| `docs/CORE_PRODUCT_CONTRACT.md` (dokumen ini) | Identitas produk + arah + kontrak tingkat tinggi |
| `docs/STYLE_SCHEMA_CONTRACT.md` | Kontrak detail style schema + style adapter |
| `docs/CLEAN_ARCHITECTURE.md` | Aturan layer + dependency + Style Adapter Rule + Schema Rule |
| `docs/EXPORT_HTML_CONTRACT.md` | Kontrak output HTML standalone |
| `docs/ROADMAP.md` | Milestone aktif + scope-lock per milestone |
| `docs/PRODUCTION_ROADMAP.md` | Roadmap lengkap sampai production-ready + hardening |

Jika ada pertentangan antar dokumen, prioritas:

1. `CORE_PRODUCT_CONTRACT.md` (dokumen ini)
2. `STYLE_SCHEMA_CONTRACT.md`
3. `CLEAN_ARCHITECTURE.md`
4. `EXPORT_HTML_CONTRACT.md`
5. `ROADMAP.md` / `PRODUCTION_ROADMAP.md`
