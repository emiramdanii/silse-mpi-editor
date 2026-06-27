# Roadmap — silse-mpi-editor

Setiap milestone = satu batch. Tidak lompat, tidak sekalian, tidak tambah fitur di luar scope milestone aktif.

## Identitas Produk (terkunci Batch 2S)

**SILSE = Role-Based Guided MPI Editor with Reusable Style Packs.**

Alur produk: AI generate MPI JSON → app import → style/layout/interaksi bisa dimodifikasi → export HTML standalone.

Implikasi: Style Pack foundation harus ada **sebelum** M3, supaya M3–M8 tidak tumbuh dengan style kecil-kecil sendiri. AI import wajib JSON SILSE — **bukan** HTML/CSS/JS bebas.

## Milestone Overview

| Milestone | Nama                                  | Status      |
| --------- | ------------------------------------- | ----------- |
| M0        | Repo Skeleton                         | Done        |
| M1        | Editor Kosong                         | Done        |
| B1A       | Scope-Lock Patch                      | Done        |
| B1B       | Core Contract, Schema, Style Lock     | Done        |
| M2 (v1)   | Text Block + Text Role Dasar          | Superseded  |
| M2 (v2)   | Text Block + Variant                  | Superseded  |
| M2        | Page Role + Capability Matrix + Text Component | Done   |
| B2S       | Style Pack Foundation + AI Remix Roadmap Lock | Done |
| M3        | Page Flow + LayoutId Dasar            | Done        |
| M4        | Image + Card + Layout Recipes         | Done        |
| M5        | Navigation + Preview + Interaction Style Dasar | Done |
| **M6**    | **Export HTML + Style Resolver Solid** | **Active**  |
| M7        | Save / Load + Style Pack Save         | Planned     |
| M8        | AI JSON Import + Style Import MVP     | Planned     |
| M9        | Direct Manipulation + Layout Guard    | Planned     |
| M10       | Question + Scoring Style              | Planned     |
| M11       | Advanced Interactive Components       | Planned     |
| M12       | Style Studio + Template Pack          | Planned     |
| M13       | Production Ready                      | Planned     |
| P1–P4     | Hardening & Release                   | Planned     |
| F1+       | Future Development                    | Future      |

> **Catatan historis:** M2 v1 (`a1f352f`) "free text block" — di-revert (`1cfadb0`). M2 v2 (`9833ea4`) "text block + variant" — superseded oleh M2R (`8e10944`) yang memperkenalkan Page Role + Capability Matrix + Component Model. Batch 2S (`<this commit>`) mengunci Style Pack Foundation + AI Remix direction sebelum M3.

Urutan lengkap milestone sampai production ada di [`docs/PRODUCTION_ROADMAP.md`](PRODUCTION_ROADMAP.md).

---

## M0 — Repo Skeleton

**Target:** Repo bisa install, run, test, build.

**Isi:**
- Vite React TS setup.
- Folder structure sesuai `docs/CLEAN_ARCHITECTURE.md`.
- README, PRODUCT_CONTRACT, CLEAN_ARCHITECTURE, EXPORT_HTML_CONTRACT, ROADMAP.
- Test awal (boundary test anti-V5).

**Acceptance:**
- `npm install` sukses.
- `npm run dev` jalan.
- `npm run test` lulus.
- `npm run build` lulus.

---

## M1 — Editor Kosong

**Target:** Editor bisa buka project kosong.

**Fitur:**
- Create project.
- 1 halaman default.
- Canvas 1280×720.
- Page panel.
- Inspector placeholder (kosong).
- Tambah halaman.
- Pilih halaman.

**Acceptance:**
- Buka app → canvas muncul.
- Halaman pertama tampil di page panel.
- Tambah halaman → jumlah halaman bertambah.
- Pilih halaman lain → `currentPageId` berubah.

**Scope lock (diperketat setelah Batch 1A):**
Operasi `renamePage`, `deletePage`, dan `duplicatePage` **TIDAK boleh ada** di store atau UI M1. Fitur tersebut milik M3 dan harus ditunda sampai M3 dimulai. Boundary test scope-lock memastikan hal ini.

---

## Batch 1B — Core Contract, Schema, Style Adapter Lock

**Status:** Done

**Target:** Mengunci arah produk, kontrak data, schema authoring, dan style adapter sebelum fitur block dimulai.

Batch ini wajib dilakukan sebelum M2 agar repo tidak berubah menjadi PowerPoint clone, Canva clone, editor slide kosong, template engine besar, atau campuran renderer/schema/style seperti project sebelumnya.

**Prinsip Utama:** SILSE MPI Editor adalah guided MPI authoring tool untuk guru. UI boleh terasa familiar seperti PowerPoint, tetapi produk bukan PowerPoint clone. **Style bukan dekorasi. Style adalah bagian dari struktur pembelajaran.**

**Scope:**

1. Buat `docs/CORE_PRODUCT_CONTRACT.md` (identitas produk, arah, Page Role, Block Variant, Interaction Pattern, production rule).
2. Buat `docs/STYLE_SCHEMA_CONTRACT.md` (style tokens, visual preset, style adapter, page-role defaults, anti-campur rules).
3. Buat `docs/PRODUCTION_ROADMAP.md` (roadmap lengkap M0–M13 + P1–P4 + F1+).
4. Update `docs/CLEAN_ARCHITECTURE.md` (Style Adapter Rule + Schema Rule, editor=preview=export consistency).
5. Update `docs/ROADMAP.md` (dokumen ini) agar memasukkan B1B sebagai prerequisite M2.
6. Tidak mengubah kode app.
7. Tidak menambah fitur UI.
8. Tidak lanjut M2 sebelum Batch 1B accepted.

**Dilarang:**

- Menambah text block, image block, button block.
- Membuat template engine, contract engine besar, style engine besar, legacy adapter.
- Membawa schema/renderer lama.
- Mengubah store atau UI editor.

**Acceptance:**

1. Dokumen menjelaskan SILSE sebagai guided MPI authoring tool, bukan PowerPoint clone.
2. Dokumen membedakan jelas: Product Contract, Authoring Schema, Style Schema, Style Adapter, Template Pedagogis.
3. Style diposisikan sebagai sistem visual-pedagogis, bukan kosmetik.
4. Style Adapter didefinisikan sebagai resolver dari semantic style ke concrete render style.
5. Editor, Preview, dan Export wajib konsisten memakai style resolve yang sama.
6. Roadmap produksi memasukkan milestone style (M11) dan template pedagogis (M12).
7. Tidak ada perubahan kode app.
8. Tidak ada scope leak.

Lihat [`docs/CORE_PRODUCT_CONTRACT.md`](CORE_PRODUCT_CONTRACT.md) dan [`docs/STYLE_SCHEMA_CONTRACT.md`](STYLE_SCHEMA_CONTRACT.md) untuk detail kontrak.

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
- `cover`: `allowAddComponent: false` (guided, fixed slots di M11/M12).
- `material`/`free`/lainnya: `allowAddComponent: true`, `allowedComponents: ['text']`.
- Add text component → cek capability current page; tolak jika tidak diizinkan.
- Default variant text component mengikuti PageRole:
  - `cover` → `title`
  - `starter` → `questionPrompt`
  - `activity` → `instruction`
  - `quiz` → `questionPrompt`
  - `reflection` → `reflectionBox`
  - lainnya → `body`
- Text component data minimal: `{ id, type:'text', variant, text, x, y, width, height }`.
- Field style manual (fontSize/color/fontWeight/align) **tidak ada** di M2 — style datang dari variant.
- UI berbahasa **"elemen"**/**"komponen"**, bukan "block".

**Acceptance:**

- Project default punya page role `cover`.
- Page baru punya role `free`.
- Capability Matrix ada di `core/capability.ts` dan dipakai store.
- `addTextComponent` di cover ditolak (capability denied).
- `addTextComponent` di page free/material diizinkan, default variant sesuai role.
- Text component tanpa variant → validation menolak.
- Page tanpa role → validation menolak.
- UI tidak menampilkan kata "block" di user-facing text.
- Store tidak expose operasi image/card/navigation/question.

**Scope lock:**

- Belum ada style adapter (M6). Style via variant lookup hard-coded.
- `removeComponent` ditunda — bukan scope M2.
- `addImageComponent`/`addCardComponent`/`addNavigationComponent`/`addQuestionComponent` tidak boleh ada di store/UI sampai M4/M5/M11.
- `renamePage`/`deletePage`/`duplicatePage`/`setPageRole` tidak boleh ada sampai M3 (rename/delete/duplicate) / M11 (setPageRole).
- Scope-lock test di-bump ke **M2R-lock**.

**Dilarang di M2:**

- Image/card/navigation/question component (M4/M5/M11).
- Preview (M5), export HTML (M6), drag/resize (M8), template (M12), page flow management (M3).
- Style adapter (M6), style tokens / visual preset (M11).
- setPageRole UI (M11 — role ditentukan saat create page, tidak bisa diganti manual sampai M11).

> **Pelajaran dari Batch 2R:** M2 v2 (`9833ea4`) technically hijau tapi arah produknya masih "block editor bebas + variant". Tanpa PageRole + Capability Matrix, app tidak bisa menjadi guided MPI authoring tool — bisa kembali jadi PowerPoint clone. Batch 2R memperbaiki arah: Page Role → Capability Matrix → Elemen yang diizinkan → Style/Export konsisten.

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
- Delete current page → current page pindah ke fallback (page pertama atau page terdekat).
- Duplicate halaman → halaman baru dengan isi sama tapi page id beda + semua component id beda.
- Duplicate mempertahankan role + layoutId.
- StylePack project tidak berubah karena page operation.
- Page punya field `layoutId` (string non-empty, default by role).

**Scope lock:**

- `setPageRole` (ganti role halaman yang sudah ada) **bukan scope M3** — itu M11. M3 hanya operasi teknis halaman + layoutId placeholder. Role ditentukan saat create page.
- Tidak ada full layout engine (itu M4/M9).
- Tidak ada drag/resize (itu M9).
- Tidak ada image/card/navigation/question component (itu M4/M5/M11).
- Tidak ada preview/export (itu M5/M6).
- Tidak ada AI import UI (itu M8).
- Tidak ada style editor (itu M12).
- Tidak ada style resolver penuh (itu M6).

**Dilarang di M3:**

- setPageRole manual.
- full layout engine.
- drag/resize.
- image/card/navigation/question.
- preview/export.
- AI import UI.
- style editor.
- style resolver penuh.

---

## M4 — Image + Card + Layout Recipes

**Status:** Done (commit `b520807`)

**Prasyarat:** M3 ACCEPTED.

**Target:** Menambahkan image component, card component, dan layout recipes konkret awal tanpa membuat full layout engine, tanpa preview/export, dan tanpa style editor.

**Konsep penting (catatan dari senior):**
Card di M4 = **elemen pembelajaran sederhana** (title + body + variant + geometry).
BUKAN nested container yang berisi elemen lain.
Nested container / component pattern baru di M11/M12.

**Fitur:**

- Image component resmi: `{ type:'image', variant, src, alt?, objectFit, x, y, width, height }`.
  Variant: `illustration`/`background`/`imageCard`.
- Card component resmi: `{ type:'card', variant, title?, body, x, y, width, height }`.
  Variant: `infoCard`/`importantNote`/`exampleCard`.
- Layout recipes awal di `core/layout-recipes.ts`: `blank`, `coverCentered`, `singleColumn`.
  Recipe = metadata (id, name, description, safeArea, slots). Bukan auto-layout engine.
- Capability Matrix diperluas:
  - `material`/`activity`/`starter`/`free`: `['text', 'image', 'card']`
  - `reflection`: `['text', 'card']` (tanpa image)
  - `cover`: tetap controlled (`['text']`, `allowAddComponent: false`)
  - `learningObjectives`/`quiz`/`closing`: tetap `['text']` saja
- `addImageComponent`/`addCardComponent` cek capability current page.
- `updateImageComponent`/`updateCardComponent` untuk edit field.
- `duplicatePage` deep-copy image/card component dengan id baru.
- Upload image via data URL/base64 (tanpa server).

**Acceptance:**

- ImageComponent validation (variant wajib, src wajib, objectFit valid).
- CardComponent validation (variant wajib, body wajib).
- Capability menolak image/card di role yang tidak boleh.
- addImageComponent/addCardComponent allowed di material/free.
- addImageComponent/addCardComponent denied di cover.
- Duplicate page regenerates image/card component ids.
- Layout recipes ada dan serializable.
- Store tidak expose navigation/question/game/preview/export/style editor/AI import.
- UI tidak memakai kata block.
- typecheck PASS, test PASS, build PASS.

**Scope lock:**

- Tidak ada navigation component (M5).
- Tidak ada question/quiz/game (M10/M11).
- Tidak ada preview/export (M5/M6).
- Tidak ada AI import UI (M8).
- Tidak ada style editor (M12).
- Tidak ada full style resolver (M6).
- Tidak ada full layout engine / drag-resize guard (M9).
- Tidak ada setPageRole (M11).
- Card BUKAN nested container — hanya title + body + variant + geometry.

**Dilarang di M4:**

- navigation component.
- question/quiz/game.
- preview/export.
- AI import UI.
- style editor.
- full style resolver.
- full layout engine.
- drag/resize guard.
- setPageRole.
- raw HTML/CSS/JS import.
- nested container (card berisi elemen lain).

---

## M5 — Navigation + Preview + Interaction Style Dasar

**Status:** Done (commit `32f9b8d`)

**Prasyarat:** M4 ACCEPTED.

**Target:** Menambahkan navigation component, preview mode, dan interaction style dasar berbasis StylePack tanpa membuat export HTML, quiz/game, AI import, atau full style editor. Titik pertama di mana app mulai terasa seperti MPI hidup, bukan hanya editor statis.

**Konsep penting (catatan dari senior):**
Preview runtime state HARUS terpisah dari editor currentPageId. Klik tombol next di Preview TIDAK boleh mengubah halaman aktif editor. Preview punya runtime state sendiri:
```
PreviewRuntimeState { currentPageId: string; }
```
Nanti di M10/M11 diperluas: currentQuestionIndex, selectedAnswer, score, feedbackState, activeTab, openAccordionItems, activeHotspot. Interaksi hidup di dalam komponen, bukan menambah page seperti PowerPoint.

**Fitur:**

- NavigationComponent resmi: `{ type:'navigation', variant, label, action, targetPageId?, x, y, width, height }`.
  Variant: `navigation`/`primaryAction`/`secondaryAction`/`choice`.
  Action: `next`/`prev`/`goto`. `targetPageId` wajib jika `action='goto'`.
- Capability Matrix diperluas: `material`/`activity`/`starter`/`free`/`reflection`/`closing` boleh navigation. `cover` tetap controlled. `quiz` belum (quiz engine belum ada).
- StylePack `interactionRecipes` dikonkretkan minimal: `buttonHoverGrow`/`buttonPress`/`focusRing`. Serializable + bounded (scale max 1.08, durationMs 80–500).
- `addNavigationComponent`/`updateNavigationComponent` cek capability + sanitize.
- Preview mode: `PreviewApp` dengan runtime state sendiri, next/prev/goto, tidak mutasi editor state, client-side only, tidak persist.
- Topbar tombol Preview (buka/tutup).
- Toolbar `+ Navigasi` ENABLED by capability.

**Acceptance:**

- NavigationComponent validation (variant valid, label non-empty, action valid, targetPageId wajib untuk goto).
- addNavigationComponent allowed/denied by capability.
- updateNavigationComponent sanitize invalid variant/action.
- duplicatePage regenerates navigation id.
- Preview next/prev/goto works.
- Preview does not mutate editor currentPageId.
- Interaction recipes validate serializable and bounded.
- Store tidak expose question/game/export/AI import/style editor.
- UI tidak memakai kata block.
- typecheck PASS, test PASS, build PASS.

**Scope lock:**

- Tidak ada export HTML (M6).
- Tidak ada question/quiz/game/scoring (M10/M11).
- Tidak ada AI import UI (M8).
- Tidak ada style editor (M12).
- Tidak ada full style resolver (M6).
- Tidak ada raw HTML/CSS/JS import.
- Tidak ada page role editor / setPageRole (M11).
- Tidak ada drag/resize guard (M9).

**Dilarang di M5:**

- export HTML.
- question/quiz/game/scoring.
- AI import UI.
- style editor.
- full style resolver.
- raw HTML/CSS/JS import.
- page role editor.
- drag/resize guard.

---

## M6 — Export HTML + Style Resolver Solid

**Status:** Active

**Prasyarat:** M5 ACCEPTED.

**Target:** Export HTML standalone dan style resolver pertama yang dipakai konsisten oleh Editor, Preview, dan Export.

**Fitur:**

- `src/core/style/resolveComponentStyle.ts` — pure function resolver (no React/DOM/window/localStorage/store).
  Input: project.style tokens, component.type, component.variant, page.role, page.layoutId.
  Output: ResolvedComponentStyle plain object.
  Support: text/image/card/navigation variants + interaction recipes (hover/press/focus).
- Editor component views, Preview component views, Export HTML semua memakai resolver yang sama.
- Hapus/kurangi style lookup hard-coded lama.
- `src/export/export-html.ts` — satu file HTML standalone. CSS inline `<style>`, JS inline `<script>`, data project embedded. Tidak ada CDN/external request/React runtime.
- Export render page 1280×720, navigate next/prev/goto, render text/image/card/navigation, pakai StylePack tokens sebagai CSS variables.
- Tombol Export HTML di toolbar → download file .html. Nama file aman dari project title.
- Security: escape `</script>` in project data, no CDN/external script/stylesheet/React/Vite dev script.

**Acceptance:**

- resolveComponentStyle pure (no side effects).
- Resolve text/image/card/navigation style by variant.
- Navigation style includes interaction recipe (hover/press/focus).
- Editor/preview/export use same resolver.
- Export HTML includes project data + CSS variables + inline JS navigation.
- Export HTML supports next/prev/goto.
- Export HTML has no CDN/external script/stylesheet.
- Export escapes `</script>` in project data.
- Export includes no React/Vite runtime.
- Store does not expose quiz/game/AI import/style editor/setPageRole.
- UI no "block".
- typecheck PASS, test PASS, build PASS.

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
- Reset project → kembali ke project kosong.
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
- Mapping otomatis: kalau AI tidak sertakan `role`, isi default by heuristic (page pertama=cover, lainnya=free).

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
- Snap aktif saat drag dekat grid.
- Pilih komponen → tekan Delete → komponen hilang.
- Layout recipe aktif → komponen tidak keluar dari slot.

---

## M10 — Question + Scoring Style

**Target:** MPI mendukung pertanyaan pilihan ganda + scoring style dari StylePack.

**Fitur:**

- Question component (pertanyaan + pilihan + jawaban benar).
- Interaction pattern: `choiceFeedback`.
- Scoring style dari StylePack `scoringRecipes` (warna benar/salah, animasi ringan).
- Feedback benar/salah.
- Skor akhir.
- Halaman ringkasan skor.

**Acceptance:**

- Tambah question → di-preview bisa dijawab.
- Jawaban benar → feedback positif (style dari scoringRecipes).
- Jawaban salah → feedback negatif.
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

- Ganti role halaman → capability berubah → komponen yang tidak diizinkan ditandai.
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
- Edit template → tetap jadi project biasa.

**Bukan template engine.** Template hanya JSON preset, bukan registry rumit.

---

## M13 — Production Ready

**Target:** Bisa dikirim ke guru lain sebagai paket siap pakai + reliablity pass.

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

## P1–P4 — Hardening & Release

Detail lengkap di [`docs/PRODUCTION_ROADMAP.md`](PRODUCTION_ROADMAP.md):

- **P1 — Reliability Hardening:** error boundary, recovery corrupt data, coverage.
- **P2 — UX Hardening:** undo/redo, keyboard shortcut, onboarding.
- **P3 — Export QA Hardening:** test export di 4 browser, offline, proyektor.
- **P4 — Documentation & Release:** user guide, dev guide, demo, tag v1.0.0.

---

## F1+ — Future Development

Setelah v1.0.0. Detail di [`docs/PRODUCTION_ROADMAP.md`](PRODUCTION_ROADMAP.md). Future development tetap harus menghormati `CORE_PRODUCT_CONTRACT.md`.

---

## Aturan Per Milestone

1. **Satu batch = satu milestone.** Tidak menggabung.
2. **Tidak lompat.** M2 baru mulai setelah M1 acceptance terpenuhi.
3. **Tidak tambah fitur di luar scope.** Jika tergoda tambah sesuatu, tulis di backlog, jangan masukkan commit.
4. **Boundary test wajib lulus** di setiap milestone.
5. **Test, typecheck, build wajib lulus** sebelum milestone ditutup.

## Aturan Scope-Lock (ditambahkan Batch 1A)

Setiap milestone punya daftar fitur eksplisit di section "Fitur:". Yang **TIDAK** ada di daftar itu **TIDAK boleh diimplementasikan**, bahkan jika:

- Kelihatannya sepele (1 baris kode).
- Akan dipakai di milestone berikutnya.
- Implementasinya sudah setengah jadi.
- Mempermudah testing atau demo.

**Pencegahan scope leak:**

1. Sebelum mulai milestone, baca section "Fitur:" dan "Scope lock:" (jika ada) untuk milestone itu.
2. Jika ragu apakah sesuatu masuk scope, asumsikan **tidak** masuk. Tunda ke milestone berikutnya.
3. Setiap commit harus bisa dipetakan ke satu poin di section "Fitur:" milestone aktif.
4. Boundary test scope-lock (di `src/tests/scope-lock.test.ts`) memastikan fitur milestone lain belum aktif di UI/store sampai milestone itu resmi dimulai.

**Pelanggaran scope-lock = milestone dikembalikan ke status "In Progress" dan harus di-patch ulang sebelum lanjut.**
