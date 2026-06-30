# Foundation Audit Lock 01

## Status
**LOCKED** — fondasi di-audit, stoplist aktif.

## Tujuan Dokumen
Mengunci fondasi agar AI dev tidak lagi salah arah ke style/visual polish sebelum container dan contract selesai. Dokumen ini adalah peta jalur data + identifikasi akar masalah + stoplist.

---

## 1. Peta Jalur Data Saat Ini

```
SimpleProject (src/core/types.ts)
  ↓
SimplePage (role, layoutId, background, components[])
  ↓
PageComponent (union: text/image/card/navigation/question/game/layered-info/learning-bridge)
  ↓
CanvasStage (src/editor/CanvasStage.tsx) — render editor dengan drag/resize
  ↓
PreviewApp (src/preview/PreviewApp.tsx) — render preview fullscreen
  ↓
export-html (src/export/export-html.ts) — generate standalone HTML
```

### Data flow saat ini:
1. User buat/edit project via editor → store (zustand)
2. CanvasStage baca project dari store, render components dengan resolvedStyle
3. PreviewApp baca project + preview store, render same components
4. export-html baca project, generate HTML dengan inline CSS + JS

### Yang sudah ada (jangan dihapus):
- SimpleProject + SimplePage + PageComponent (schema existing, 2451 test guard)
- Style packs (modern-clean, soft-classroom, mission-dark)
- Layout presets (8 presets)
- Component skins (20 classes)
- Premium export profile (cinematic stage, glass topbar, hero card, award medal)
- AI MPI JSON proof-of-concept (scene metadata untuk game-mission)

---

## 2. Identifikasi Akar Masalah

### Masalah fondasi:
1. **`page.components[]` masih datar** — tidak ada konsep "scene" dengan slots. Komponen adalah flat list dengan geometry (x/y/width/height). Tidak ada struktur scene (briefing/target/actions/reward sebagai unit).

2. **`layoutId` belum menjadi full layout engine** — hanya placeholder string. Tidak ada engine yang menyusun slot berdasarkan layoutId. Layout presets hanya mengatur geometry, bukan scene structure.

3. **`card` masih title/body/geometry** — tidak ada konsep card style variant yang dikontrol AI. Card style datang dari skin class (hardcoded per style pack), bukan dari design contract.

4. **`game` lama masih prompt + choices** — game-mission scene proof sudah ada (MPI-JSON-SCENE-PROOF-01), tetapi hanya untuk game. Quiz/material/cover/closing belum punya scene model.

5. **Style pack hanya mempercantik, bukan menyusun scene** — style pack menambah shadow/radius/gradient, tetapi tidak mengontrol layout scene, slot placement, atau design token yang AI bisa set.

### Akibat:
- AI tidak bisa mengontrol visual hasil render secara akurat.
- Editor/preview/export bisa tidak sinkron (sudah di-patch di PREMIUM-EXPORT-OVERHAUL-01-PATCH-1, tetapi patch saja tidak cukup — perlu fondasi contract).
- Setiap batch "polish" menambah CSS tetapi tidak menyelesaikan masalah komposisi.

---

## 3. Pisahkan Fondasi dan Kosmetik

### Fondasi (yang akan dikerjakan):
| # | Komponen | Status |
|---|----------|--------|
| 1 | **Container** (MpiContainer) — tempat data MPI utuh | ⬜ Scope 2 |
| 2 | **Scene model** (MpiScene dengan role + sceneType + slots) | ⬜ Scope 2 |
| 3 | **Design contract** (16 design token categories) | ⬜ Scope 3 |
| 4 | **Prompt contract** (app beri kontrak ke AI) | ⬜ Scope 4 |
| 5 | **JSON schema** (AI output format resmi) | ⬜ Scope 5 |
| 6 | **Converter** (JSON → Container tanpa kehilangan data) | ⬜ Scope 6 |
| 7 | **Renderer parity** (editor/preview/export baca container+contract) | ⬜ Scope 7 |

### Kosmetik (STOP — tidak boleh dikerjakan):
- shadow tambahan
- radius tambahan
- gradient baru
- animation baru
- style pack baru
- premium polish
- visual memory
- flavor system
- art layer

---

## 4. Stoplist

**Dilarang keras selama Foundation Plan:**

| # | Larangan | Alasan |
|---|----------|--------|
| 1 | Tidak ada visual memory | Bukan fondasi, kosmetik |
| 2 | Tidak ada flavor system | Bukan fondasi, kosmetik |
| 3 | Tidak ada art layer | Bukan fondasi, kosmetik |
| 4 | Tidak ada raw HTML import | Breaks contract, security risk |
| 5 | Tidak ada iframe import | Breaks contract, security risk |
| 6 | Tidak ada HTML reskin | Breaks renderer parity |
| 7 | Tidak ada style pack baru | Kosmetik, bukan fondasi |
| 8 | Tidak ada dependency baru | Fondasi harus pure TypeScript |
| 9 | Tidak ada repo baru | Satu repo, satu arah |
| 10 | Tidak ada rewrite total editor | Editor existing tetap, container berdampingan |
| 11 | Tidak ada perubahan besar store tanpa alasan | Store existing tetap, adapter ke container |
| 12 | Tidak ada CSS premium baru sebagai pengganti contract | Contract yang mengontrol, bukan CSS |
| 13 | Tidak ada HTML/CSS bebas dari AI | AI hanya boleh output JSON sesuai schema |
| 14 | Tidak lanjut ke Quiz/Material/Cover scene proof sebelum fondasi selesai | Urutan wajib |

---

## 5. Aturan Konversi (Container Coexistence)

- SimpleProject **TIDAK dihapus**. Container berdampingan.
- Adapter `simpleProjectToMpiContainer` mengubah SimpleProject → MpiContainer (one-way, lossy untuk field yang belum ada di container).
- Adapter `aiJsonToMpiContainer` mengubah AI JSON → MpiContainer (lossless untuk field di schema).
- Renderer existing (CanvasStage, PreviewApp, export-html) **TIDAK diubah dulu** di Scope 2-6.
- Scope 7 (SCENE-RENDERER-PROOF-01) baru membuktikan satu scene (game-mission) bisa render dari container.
- Setelah semua scope selesai, baru dipikirkan migrasi renderer ke baca container (batch terpisah, di luar Foundation Plan).

---

## 6. Verification Per Scope

Setiap scope wajib:
```
npm run typecheck   → PASS
npm run test        → PASS (no regressions)
npm run build       → PASS
```

Laporan per scope wajib memuat:
- File yang dibuat/diubah
- Alasan perubahan
- Test yang ditambah
- Hasil typecheck/test/build
- Hal yang sengaja tidak dikerjakan

---

## 7. Urutan Eksekusi

```
FOUNDATION-AUDIT-LOCK-01 (doc ini)
  ↓
MPI-FULL-CONTAINER-01 (container types + adapter)
  ↓
MPI-DESIGN-CONTRACT-01 (16 design token categories)
  ↓
APP-AI-PROMPT-CONTRACT-01 (prompt builder)
  ↓
AI-MPI-JSON-BLUEPRINT-01 (schema resmi + sample)
  ↓
AI-JSON-TO-MPI-CONTAINER-01 (converter)
  ↓
SCENE-RENDERER-PROOF-01 (render game-mission dari container)
```

Tidak boleh loncat. Tidak boleh paralel. Setiap scope commit terpisah.

---

## 8. Acceptance

Batch dianggap selesai jika:
1. Scope sesuai urutan.
2. Tidak ada out-of-scope (stoplist dipatuhi).
3. Data fondasi tidak hilang (scene/style/layout masuk contract).
4. Tidak ada CSS polish sebagai pengganti contract.
5. Tidak ada HTML/CSS bebas dari AI.
6. Editor/preview/export dipikirkan sejak awal (renderer parity di Scope 7).
7. typecheck + test + build PASS per scope.

---

## Verification Scope 1
| Check | Result |
|-------|--------|
| typecheck | N/A (doc only) |
| test | N/A (doc only) |
| build | N/A (doc only) |
| dokumen audit ada | ✅ |
| jalur data jelas | ✅ Section 1 |
| akar masalah jelas | ✅ Section 2 |
| fondasi vs kosmetik jelas | ✅ Section 3 |
| stoplist jelas | ✅ Section 4 |
| tidak ada perubahan visual | ✅ doc only |
| tidak ada engine baru | ✅ doc only |
