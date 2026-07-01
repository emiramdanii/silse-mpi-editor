# HIGH-PRIORITY-RENDERERS-01

> Status: **READY FOR SENIOR REVIEW**
> Tanggal: 2026-07-01

## Tujuan

Menutup 4 scene type high-priority yang masih contract-only agar MPI visual/game lebih lengkap sebelum polish premium:
- hotspot-map
- matching-game
- sequencing-game
- media-focus

---

## 1. Scene Type yang Ditutup

| Scene Type | React Composer | Export Renderer | Inspector Fields |
|-----------|----------------|-----------------|-----------------|
| hotspot-map | HotspotMapComposer | renderHotspotMapExport | guidingQuestion, caption, backgroundVisual |
| matching-game | MatchingGameComposer | renderMatchingGameExport | instruction, completionMessage |
| sequencing-game | SequencingGameComposer | renderSequencingGameExport | instruction, completionMessage |
| media-focus | MediaFocusComposer | renderMediaFocusExport | guidingQuestion, caption, responseInput |

Total scene type dengan renderer: **17** (5 rendered + 8 priority + 4 high-priority).
Contract-only tersisa: **10** scene type.

---

## 2. React/Export Parity

Semua 4 renderer punya padanan export HTML:

| Scene Type | React | Export | wireInteractions |
|-----------|-------|--------|-----------------|
| hotspot-map | ✅ HotspotMapComposer | ✅ renderHotspotMapExport | ✅ [data-hotspot-id] handler |
| matching-game | ✅ MatchingGameComposer | ✅ renderMatchingGameExport | ✅ [data-left-id] + [data-right-id] handler |
| sequencing-game | ✅ SequencingGameComposer | ✅ renderSequencingGameExport | ✅ [data-action="seq-up/down/check"] handler |
| media-focus | ✅ MediaFocusComposer | ✅ renderMediaFocusExport | ✅ (uses existing ResponseInputBlock handler) |

---

## 3. Interaction Behavior

### Hotspot Map:
- Klik hotspot → panel info muncul dengan label + info.
- Klik hotspot aktif lagi → panel tutup.
- Fallback: "🗺️ Peta tidak tersedia" jika tidak ada backgroundVisual.

### Matching Game:
- Klik item kiri → selected (gold border).
- Klik item kanan → cek pasangan. Benar → score +, item disabled. Salah → feedback.
- Reset → clear semua pairs + score.

### Sequencing Game:
- Tombol ↑/↓ untuk reorder items.
- Tombol "Cek Jawaban" → bandingkan dengan correctOrder. Benar → score +. Salah → feedback.
- Reset → reset order + score.

### Media Focus:
- MediaDisplayBlock render image (dengan fallback).
- Guiding question panel.
- ResponseInputBlock untuk jawaban siswa (textarea + save + badge).

---

## 4. Inspector Support

SceneContentEditor V1 sekarang mendukung 4 scene type baru:
- **hotspot-map**: guidingQuestion, caption, backgroundVisual (URL).
- **matching-game**: instruction, completionMessage.
- **sequencing-game**: instruction, completionMessage.
- **media-focus**: guidingQuestion, caption, responseInput.

V1: hanya text/textarea fields. List editor (items, hotspots, pairs) ditunda ke V2.

---

## 5. Batasan yang Belum Dikerjakan

1. **List editor untuk items/hotspots/pairs** — V1 hanya edit text field umum. Add/remove item ditunda.
2. **Drag-drop** — semua interaksi pakai klik (pilih → klik target), bukan drag-drop.
3. **Map zoom/pan** — hotspot-map hanya static background + clickable points.
4. **10 scene type contract-only tersisa** — diagnostic-check, remedial-practice, enrichment-challenge, worksheet-activity, rubric-panel, timeline-story, branching-scenario, glossary-cards, teacher-guide, accessibility-help.
5. **Score sync antar scene** — React composer punya state lokal, tidak terhubung ke editor store aggregateScore (perlu wire-up di batch berikutnya).

---

## 6. Syarat Lanjut ke Premium Style

High-priority renderers ini dinyatakan **lulus** jika:

1. `npm run typecheck` → PASS
2. `npm run test` → semua PASS (3076/3076)
3. `npm run build` → PASS
4. 4 scene type baru render di React + export.
5. Interaction behavior (hotspot click, matching pair, sequencing order, media response) berfungsi.
6. SceneContentEditor muncul untuk 4 scene type baru.
7. 12 golden-reference scenes tetap pass.
8. Legacy project tetap aman.

Jika lulus, lanjut ke **PREMIUM-STYLE-AFTER-FOUNDATION-01** — visual polish via existing contract.

---

## Lampiran: Test Suite

File: `src/tests/high-priority-renderers-01.test.tsx`

Total: **20 test** terbagi 6 scope:

| Scope | Test count | Fokus |
|-------|------------|-------|
| A | 4 | Hotspot map (render + click + export + fallback) |
| B | 3 | Matching game (render + pair + export) |
| C | 3 | Sequencing game (render + move/check + export) |
| D | 4 | Media focus (render + response + export + fallback) |
| E | 4 | SceneContent Inspector (4 new scene types) |
| F | 2 | Regression (12 golden + legacy) |

Verifikasi:
```
npm run typecheck  → PASS
npm run test       → 3076/3076 PASS
npm run build      → PASS (CSS 69.18 kB, JS 653.73 kB)
```
