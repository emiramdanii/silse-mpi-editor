# Production Roadmap — SILSE MPI Editor

> Roadmap lengkap dari repo skeleton sampai production-ready + hardening.
> Dokumen ini adalah sumber kebenaran urutan milestone. `docs/ROADMAP.md` hanya melacak status milestone aktif.
> Setiap milestone = satu batch. Tidak lompat, tidak sekalian, tidak tambah fitur di luar scope.

## Identitas Produk (terkunci Batch 2S)

**SILSE = Role-Based Guided MPI Editor with Reusable Style Packs.**

Alur produk: AI generate MPI JSON → app import → style/layout/interaksi bisa dimodifikasi → export HTML standalone.

---

## Roadmap Overview

| Milestone | Nama | Status |
| --------- | ---- | ------ |
| M0 | Repo Skeleton | Done |
| M1 | Editor Kosong | Done |
| B1A | Scope-Lock Patch | Done |
| B1B | Core Contract, Schema, Style Adapter Lock | Done |
| M2 (v1) | Text Block + Text Role Dasar | Superseded |
| M2 (v2) | Text Block + Variant | Superseded |
| M2 | Page Role + Capability Matrix + Text Component | Done |
| B2S | Style Pack Foundation + AI Remix Roadmap Lock | Done |
| M3 | Page Flow + LayoutId Dasar | Done |
| M4 | Image + Card + Layout Recipes | Done |
| **M5** | **Navigation + Preview + Interaction Style Dasar** | **Active** |
| M6 | Export HTML + Style Resolver Solid | Planned |
| M7 | Save / Load + Style Pack Save | Planned |
| M8 | AI JSON Import + Style Import MVP | Planned |
| M9 | Direct Manipulation + Layout Guard | Planned |
| M10 | Question + Scoring Style | Planned |
| M11 | Advanced Interactive Components | Planned |
| M12 | Style Studio + Template Pack | Planned |
| M13 | Production Ready | Planned |
| P1 | Reliability Hardening | Planned |
| P2 | UX Hardening | Planned |
| P3 | Export QA Hardening | Planned |
| P4 | Documentation & Release | Planned |
| F1+ | Future Development | Future |

---

## Batch 1B — Core Contract, Schema, Style Adapter Lock

**Status:** Next / Required Before M2

**Target:** Mengunci arah produk, kontrak data, schema authoring, dan style adapter sebelum fitur block dimulai.

Batch ini wajib dilakukan sebelum M2 agar repo tidak berubah menjadi:

- PowerPoint clone.
- Canva clone.
- Editor slide kosong.
- Template engine besar.
- Campuran renderer/schema/style seperti project sebelumnya.

### Prinsip Utama

SILSE MPI Editor adalah **guided MPI authoring tool untuk guru**.

UI boleh terasa familiar seperti PowerPoint, tetapi produk bukan PowerPoint clone. PowerPoint hanya referensi kemudahan interaksi canvas, bukan arah arsitektur.

**Style bukan dekorasi. Style adalah bagian dari struktur pembelajaran.**

### Scope

1. Buat `docs/CORE_PRODUCT_CONTRACT.md`.
2. Buat `docs/STYLE_SCHEMA_CONTRACT.md`.
3. Update `docs/PRODUCTION_ROADMAP.md` (dokumen ini) agar memasukkan:
   - Core Product Contract.
   - Authoring Schema.
   - Guided Learning Style System.
   - Style Adapter.
   - Template Pedagogis.
4. Update `docs/CLEAN_ARCHITECTURE.md` agar menjelaskan posisi:
   - `core` sebagai sumber data/schema.
   - style adapter sebagai resolver style.
   - `editor`, `preview`, dan `export` wajib memakai hasil resolve style yang sama.
5. Tidak mengubah kode app.
6. Tidak menambah fitur UI.
7. Tidak lanjut M2 sebelum Batch 1B accepted.

### Dilarang

- Menambah text block.
- Menambah image block.
- Menambah button block.
- Membuat template engine.
- Membuat contract engine besar.
- Membuat style engine besar.
- Membuat legacy adapter.
- Membawa schema/renderer lama.
- Mengubah store.
- Mengubah UI editor.

### Acceptance

Batch 1B dianggap selesai jika:

1. Dokumen menjelaskan bahwa SILSE adalah guided MPI authoring tool, bukan PowerPoint clone.
2. Dokumen membedakan dengan jelas:
   - Product Contract.
   - Authoring Schema.
   - Style Schema.
   - Style Adapter.
   - Template Pedagogis.
3. Style diposisikan sebagai sistem visual-pedagogis, bukan kosmetik.
4. Style Adapter didefinisikan sebagai resolver dari semantic style ke concrete render style.
5. Editor, Preview, dan Export wajib konsisten memakai style resolve yang sama.
6. Roadmap produksi memasukkan milestone style dan template pedagogis.
7. Tidak ada perubahan kode.
8. Tidak ada scope leak.

---

## M2 — Page Role + Capability Matrix + Text Component

**Status:** Done (Batch 2R, commit `8e10944`)

**Prasyarat:** Batch 1B ACCEPTED.

**Target:** Memperkenalkan model **role-based guided component editor**, bukan block editor bebas. Halaman punya peran pedagogis (PageRole), dan peran menentukan komponen apa yang boleh ditambahkan (Capability Matrix).

**Fitur:**

- PageRole di schema: `cover`/`learningObjectives`/`starter`/`material`/`activity`/`quiz`/`reflection`/`closing`/`free`.
- Field `role` wajib di setiap `SimplePage`.
- Page pertama default: `title: "Cover"`, `role: "cover"`, pre-fill 1 TextComponent variant `title`.
- Page baru manual default: `role: "free"`.
- PageRoleCapability matrix: setiap role punya `allowedComponents` + `allowAddComponent`.
- `cover`: `allowAddComponent: false` (guided).
- `material`/`free`/lainnya: `allowAddComponent: true`, `allowedComponents: ['text']`.
- Add text component → cek capability current page; tolak jika tidak diizinkan.
- Default variant text component mengikuti PageRole.
- Text component data minimal: `{ id, type:'text', variant, text, x, y, width, height }`.
- UI berbahasa **"elemen"**/**"komponen"**, bukan "block".

**Acceptance:**

- Project default punya page role `cover`.
- Page baru punya role `free`.
- Capability Matrix ada di `core/capability.ts` dan dipakai store.
- `addTextComponent` di cover ditolak (capability denied).
- Text component tanpa variant → validation menolak.
- Page tanpa role → validation menolak.
- UI tidak menampilkan kata "block" di user-facing text.

---

## Batch 2S — Style Pack Foundation + AI Remix Roadmap Lock

**Status:** Done (commit `b539cb4`)

**Prasyarat:** Batch 2R ACCEPTED.

**Target:** Mengunci arah SILSE sebagai **editor remix MPI hasil AI**: AI generate MPI JSON → app import → style/layout/interaksi bisa dimodifikasi → export HTML. Batch ini dilakukan sebelum M3 agar style tidak menjadi tempelan terlambat.

**Scope:**

- **A — Roadmap Sync:** Revisi milestone M3–M13 nama baru. Hapus "Import HTML ringan" dari M8 (AI import wajib JSON SILSE). Bersihkan sisa istilah "block" di roadmap future section. Tambahkan identitas produk "Role-Based Guided MPI Editor with Reusable Style Packs".
- **B — Style Pack Foundation Schema:** Type `ProjectStyle` / `StylePack` minimal di `core/style-types.ts`. Project punya field `stylePackId?` + `style?`. StylePack memuat: colors, typography, spacing, radius, componentRecipes placeholder, interactionRecipes placeholder, scoringRecipes placeholder. **Tidak** buat style editor UI. **Tidak** buat full style adapter. **Tidak** raw CSS.
- **C — AI Import Contract Placeholder:** `docs/AI_IMPORT_CONTRACT.md`. AI output wajib JSON SILSE. Dilarang: raw HTML, raw CSS, script, external CDN, className bebas. Import UI belum dibuat.
- **D — Tests:** Project default punya style field minimal. StylePack tokens serializable. Validation menerima style minimal. Docs guard ROADMAP tidak menyebut "Import HTML ringan". Docs guard user-facing roadmap pakai component/elemen, bukan block.

**Dilarang:**

- M3 page operations.
- image/card/navigation/question component.
- preview/export.
- AI import UI.
- full style editor.
- full style adapter.
- raw CSS/HTML parser.

**Acceptance:**

- ROADMAP sync selesai (nama milestone final, identitas produk terkunci).
- StylePack schema ada di core.
- Project default punya style field minimal.
- AI_IMPORT_CONTRACT.md ada.
- typecheck PASS, test PASS, build PASS.

---

## M3 — Page Flow + LayoutId Dasar

**Status:** Done (commit `fc963c2`)

**Prasyarat:** Batch 2S ACCEPTED.

**Target:** Membuat manajemen halaman lengkap tanpa merusak PageRole, Capability Matrix, dan StylePack foundation.

**Fitur:**

- Add page (dengan role default `free` jika tidak diberikan).
- Delete page (dengan safety: tidak boleh hapus halaman terakhir, current page harus pilih fallback).
- Rename page.
- Select page.
- Duplicate page (deep copy, generate page id + semua component id baru, pertahankan role + layoutId).
- `layoutId` ringan di SimplePage (placeholder string, belum full layout engine — itu M4/M9).
- Default `layoutId` by PageRole:
  - `cover` → `coverCentered`
  - `material` → `singleColumn`
  - `free` dan role lain → `blank`

**Acceptance:**

- Tambah 3 halaman → pindah halaman → isi tiap halaman tidak bercampur.
- Delete halaman → halaman hilang, halaman lain tetap utuh.
- Delete halaman terakhir → dilarang (no-op).
- Delete current page → current page pindah ke fallback.
- Duplicate halaman → halaman baru dengan isi sama tapi page id beda + semua component id beda.
- Duplicate mempertahankan role + layoutId.
- StylePack project tidak berubah karena page operation.
- Page punya field `layoutId` (string non-empty, default by role).

> Catatan: `setPageRole` (ganti role halaman yang sudah ada) **bukan scope M3** — itu M11. M3 hanya operasi teknis halaman + layoutId placeholder.

---

## M4 — Image + Card + Layout Recipes

**Status:** Done (commit `b520807`)

**Prasyarat:** M3 ACCEPTED.

**Target:** Menambahkan image component, card component, dan layout recipes konkret awal tanpa membuat full layout engine, tanpa preview/export, dan tanpa style editor.

**Konsep penting:** Card di M4 = elemen pembelajaran sederhana (title + body + variant + geometry). BUKAN nested container. Nested container baru di M11/M12.

**Fitur:**

- Image component: `{ type:'image', variant, src, alt?, objectFit, x, y, width, height }`. Variant: `illustration`/`background`/`imageCard`.
- Card component: `{ type:'card', variant, title?, body, x, y, width, height }`. Variant: `infoCard`/`importantNote`/`exampleCard`.
- Layout recipes: `blank`, `coverCentered`, `singleColumn` di `core/layout-recipes.ts`. Metadata only (id, name, description, safeArea, slots).
- Capability Matrix: material/activity/starter/free = text+image+card; reflection = text+card; cover = controlled; lainnya = text only.
- addImageComponent/addCardComponent cek capability.
- duplicatePage deep-copy image/card dengan id baru.

**Acceptance:**

- ImageComponent validation (variant wajib, src wajib, objectFit valid).
- CardComponent validation (variant wajib, body wajib).
- Capability menolak image/card di role yang tidak boleh.
- addImageComponent/addCardComponent allowed di material/free, denied di cover.
- Duplicate page regenerates image/card component ids.
- Layout recipes ada dan serializable.
- Store tidak expose navigation/question/game/preview/export/style editor/AI import.
- UI tidak memakai kata block.

---

## M5 — Navigation + Preview + Interaction Style Dasar

**Status:** Active

**Prasyarat:** M4 ACCEPTED.

**Target:** Menambahkan navigation component, preview mode, dan interaction style dasar berbasis StylePack tanpa export HTML, quiz/game, AI import, atau full style editor.

**Konsep penting:** Preview runtime state terpisah dari editor currentPageId. Preview punya `PreviewRuntimeState { currentPageId }` sendiri. Interaksi hidup di dalam komponen, bukan menambah page.

**Fitur:**

- NavigationComponent: `{ type:'navigation', variant, label, action, targetPageId?, x, y, width, height }`. Variant: navigation/primaryAction/secondaryAction/choice. Action: next/prev/goto. targetPageId wajib untuk goto.
- Capability: material/activity/starter/free/reflection/closing boleh navigation. cover controlled. quiz belum.
- StylePack interactionRecipes konkret: buttonHoverGrow/buttonPress/focusRing. Serializable + bounded (scale max 1.08, durationMs 80–500).
- addNavigationComponent/updateNavigationComponent cek capability + sanitize.
- Preview mode: PreviewApp dengan runtime state sendiri, next/prev/goto, tidak mutasi editor state.

**Acceptance:**

- NavigationComponent validation (variant, label non-empty, action, targetPageId wajib untuk goto).
- addNavigationComponent allowed/denied by capability.
- updateNavigationComponent sanitize invalid variant/action.
- duplicatePage regenerates navigation id.
- Preview next/prev/goto works.
- Preview does not mutate editor currentPageId.
- Interaction recipes validate serializable and bounded.
- Store tidak expose question/game/export/AI import/style editor.
- UI tidak memakai kata block.

---

## M6 — Export HTML + Style Resolver Solid

**Target:** Export HTML standalone dengan style resolver yang solid (bukan tempelan).

**Fitur:**

- Export HTML standalone (1 file, CSS inline, JS inline, data embedded).
- `resolveComponentStyle` pertama di `src/core/style/` — pure function resolver.
- Editor, Preview, Export semua memakai `resolveComponentStyle`.
- StylePack tokens di-bawa ke output HTML sebagai CSS variables.

**Acceptance:**

- Export → file HTML terdownload.
- Buka di browser → halaman tampil, navigation jalan.
- Network tab: 0 request eksternal.
- Snapshot: editor, preview, export menghasilkan style yang sama.

**Ini milestone kritis.** Sebelum M6, style boleh inline hard-coded via variant lookup. Setelah M6, semua render wajib via `resolveComponentStyle`.

---

## M7 — Save / Load + Style Pack Save

**Target:** Project tidak hilang + StylePack bisa disimpan dan dipakai ulang.

**Fitur:**

- Autosave localStorage.
- Manual save.
- Load project.
- Reset project.
- Export/import JSON (termasuk StylePack).
- Save StylePack sebagai reusable asset (terpisah dari project).

**Acceptance:**

- Edit project → reload browser → project masih ada.
- Export JSON → file terdownload (termasuk style).
- Import JSON → project + style termuat.
- Save StylePack → bisa dipakai di project lain.

---

## M8 — AI JSON Import + Style Import MVP

**Target:** Import MPI JSON dari AI + import style pack dari AI. **Wajib JSON SILSE — bukan HTML/CSS bebas.**

**Fitur:**

- Paste AI JSON → validasi terhadap schema SILSE → muat ke editor.
- AI JSON boleh membawa: project content, pages, components, layoutId, stylePack, interaction config, scoring config.
- Import style pack dari AI JSON (token-level, masuk ke `ProjectStyle`).
- Mapping otomatis: kalau AI tidak sertakan `variant`, isi default by PageRole.
- Mapping otomatis: kalau AI tidak sertakan `role`, isi default by heuristic.

**Dilarang di M8:**

- Raw HTML parsing.
- Raw CSS parsing.
- Script injection.
- External CDN.
- className bebas (semua style via StylePack tokens).

**Acceptance:**

- Paste AI JSON valid → project termuat, semua page punya role, semua component punya variant.
- AI JSON dengan stylePack → stylePack masuk ke `ProjectStyle`.
- AI JSON invalid → error jelas, tidak crash.
- Tidak ada HTML/CSS/script yang lolos ke project.

Lihat [`docs/AI_IMPORT_CONTRACT.md`](AI_IMPORT_CONTRACT.md) untuk kontrak lengkap.

---

## M9 — Direct Manipulation + Layout Guard

**Target:** Editor enak dipakai tanpa inspector untuk operasi umum + layout guard mencegah komponen keluar dari layout recipe.

**Fitur:**

- Drag komponen di canvas.
- Resize komponen di canvas (handle pojok).
- Snap sederhana (grid 8px).
- Keyboard delete (tombol Delete/Backspace).
- Layout guard: kalau page pakai layout recipe, komponen menempel ke slot; drag dibatasi ke slot.
- `removeComponent` akhirnya tersedia di store (sebelumnya ditunda).

**Acceptance:**

- Komponen bisa digeser langsung di canvas.
- Komponen bisa di-resize via handle.
- Pilih komponen → tekan Delete → komponen hilang.
- Layout recipe aktif → komponen tidak keluar dari slot.

---

## M10 — Question + Scoring Style

**Target:** MPI mendukung pertanyaan pilihan ganda + scoring style dari StylePack.

**Fitur:**

- Question component (pertanyaan + pilihan + jawaban benar).
- Interaction pattern: `choiceFeedback`.
- Scoring style dari StylePack `scoringRecipes`.
- Feedback benar/salah.
- Skor akhir.
- Halaman ringkasan skor.

**Acceptance:**

- Tambah question → di-preview bisa dijawab.
- Jawaban benar → feedback positif (style dari scoringRecipes).
- Skor terakumulasi.
- Halaman skor tampil di akhir.

---

## M11 — Advanced Interactive Components

**Target:** Komponen interaktif lanjutan + setPageRole UI + Guided Learning Style System lengkap.

**Fitur:**

- `setPageRole` UI (ganti role halaman yang sudah ada).
- Interaction pattern lanjutan: `reveal`/`hotspot`/`tabs`/`accordion`.
- `resolveComponentStyle` full implementation (local override + variant + role + preset).
- 5 visual preset lengkap (cleanClassroom, civicWarm, brightKids, projectorHighContrast, minimalWorksheet).
- Page Role mulai dipakai untuk default style ringan.
- Editor/preview/export konsisten via adapter.

**Acceptance:**

- Ganti role halaman → capability berubah.
- Pilih preset → tokens berubah → editor/preview/export ikut.
- Variant menghasilkan style default benar.
- Local override mengalahkan default.
- Snapshot editor/preview/export konsisten.

---

## M12 — Style Studio + Template Pack

**Target:** Style studio untuk bikin style pack sendiri + template pack pedagogis.

**Fitur:**

- Style Studio: UI untuk edit StylePack tokens (colors/typography/spacing/radius).
- Save StylePack sebagai reusable asset.
- 3–5 template pedagogis (cover+materi+latihan, full MPI, LKPD ringan).
- Template = preset project JSON dengan page role + component variant + stylePack sudah terisi.
- Pilih template → project baru terisi template + stylePack.
- Template tidak mengikat; setelah dipilih, project jadi project biasa.

**Acceptance:**

- Edit stylePack di Style Studio → editor/preview/export ikut.
- Save stylePack → bisa dipakai di project lain.
- Pilih template → project baru muncul dengan halaman + komponen + variant + stylePack.

**Bukan template engine.** Template hanya JSON preset, bukan registry rumit.

---

## M13 — Production Ready

**Target:** Bisa dikirim ke guru lain sebagai paket siap pakai + reliability pass.

**Fitur:**

- Kompres project + asset + stylePack menjadi satu file `.mpi.zip`.
- Buka paket → langsung jalan di editor.
- Atau: export HTML + paket source JSON.
- Validasi paket sebelum distribusi.
- Error boundary + recovery corrupt data.

**Acceptance:**

- Save project sebagai paket → file terdownload.
- Buka paket di mesin lain → project + stylePack termuat utuh.
- Paket berisi manifest + project.json + stylePack.json + assets + (opsional) export HTML.
- Error boundary menangani data corrupt tanpa crash.

---

## P1 — Reliability Hardening

**Target:** App tidak crash pada kondisi edge.

**Fitur:**

- Error boundary React.
- Recovery dari localStorage corrupt.
- Validasi input ketat.
- Test coverage untuk failure path.

**Acceptance:**

- localStorage corrupt → app tetap buka, tampilkan error.
- Project dengan block tidak valid → tidak crash, tampilkan pesan.
- Coverage > 80% untuk core/.

---

## P2 — UX Hardening

**Target:** Editor enak dipakai guru non-teknis.

**Fitur:**

- Undo/redo.
- Keyboard shortcut dasar (Ctrl+Z, Delete, arrow keys).
- Tooltip jelas.
- Empty state yang membimbing.
- Onboarding mini (3 langkah).

**Acceptance:**

- Undo/redo jalan.
- Shortcut dasar jalan.
- Guru baru bisa mulai edit tanpa baca README.

---

## P3 — Export QA Hardening

**Target:** Export HTML selalu jalan di browser manapun.

**Fitur:**

- Test export di Chrome, Firefox, Edge, Safari.
- Test export offline (network disabled).
- Test export di layar proyektor (resolusi rendah).
- Test export dengan gambar besar.

**Acceptance:**

- Export jalan di 4 browser utama.
- Export jalan tanpa internet.
- Export tetap rapi di proyektor.

---

## P4 — Documentation & Release

**Target:** Dokumen lengkap + rilis publik.

**Fitur:**

- User guide (untuk guru).
- Dev guide (untuk kontributor).
- Demo project JSON.
- Release notes v1.0.
- Tag git `v1.0.0`.

**Acceptance:**

- Guru bisa pakai app dengan baca user guide saja.
- Kontributor bisa setup dev dengan baca dev guide saja.
- Tag v1.0.0 dibuat.

---

## F1+ — Future Development

Setelah v1.0.0, fitur lanjutan:

- Multi-user collaboration (cloud).
- Asset marketplace.
- Plugin system.
- Analytics/telemetry (opt-in).
- Tema kustom (di luar 5 preset).
- Interaksi kompleks (drag-drop, hotspot, tabs, accordion lengkap).
- Animasi/transisi (jika diperlukan).

Future development tetap harus menghormati `CORE_PRODUCT_CONTRACT.md`. Tidak boleh menambah engine yang melanggar kontrak.

---

## Aturan Scope-Lock

Sama seperti di `docs/ROADMAP.md`:

1. **Satu batch = satu milestone.** Tidak menggabung.
2. **Tidak lompat.** M2 baru mulai setelah B1B acceptance terpenuhi.
3. **Tidak tambah fitur di luar scope.** Jika tergoda tambah sesuatu, tulis di backlog, jangan masukkan commit.
4. **Boundary test wajib lulus** di setiap milestone.
5. **Test, typecheck, build wajib lulus** sebelum milestone ditutup.
6. **Style lock:** sejak M2, setiap block wajib punya field `variant`. Sejak M6, semua render wajib via `resolveBlockStyle`. Pelanggaran = milestone dikembalikan ke "In Progress".

---

## Hubungan dengan ROADMAP.md

- `docs/ROADMAP.md` = melacak **status** milestone aktif (Done/Next/Planned) + scope-lock per milestone.
- `docs/PRODUCTION_ROADMAP.md` (dokumen ini) = **urutan lengkap** milestone sampai production + hardening, dengan deskripsi tiap milestone.

Jika ada pertentangan urutan, dokumen ini yang menang. Jika ada pertentangan status milestone aktif, `ROADMAP.md` yang menang.
