# Background Pattern System V1

Commit: `BACKGROUND-PATTERN-SYSTEM-V1`
Tanggal: 2026-06-29
Verifier: AI Dev (audit via code reading + automated test guard)

## Tujuan

Membuat tampilan halaman lebih premium dengan dekorasi CSS ringan (gradient, grid, dots, glow) tanpa Canva/upload/asset eksternal. Pattern berbasis style pack, konsisten editor-export.

## Background Audit

| Area | Sebelum | Masalah | Patch |
|---|---|---|---|
| CanvasStage | Background polos (color/gradient/image only) | Halaman terasa polos, tidak premium | Tambah bg pattern class ke canvas-frame |
| PreviewApp | Background polos | Sama dengan editor | Tambah bg pattern class ke preview-canvas |
| Export HTML | `#silse-canvas` background var only | Export polos | Tambah bg pattern class + CSS ke canvas div |

## Pattern Mapping

| Style Pack | Page Class | Pattern Class | Visual Intent |
|---|---|---|---|
| Modern Clean | silse-bg-page-clean | silse-bg-pattern-subtle-grid | Clean gradient + subtle blue grid (40px) |
| Soft Classroom | silse-bg-page-soft | silse-bg-pattern-soft-dots | Warm pastel gradient + soft orange dots (28px) |
| Mission Dark | silse-bg-page-mission | silse-bg-pattern-mission-glow | Radial blue glow + mission grid (60px) |

## Patch

| File | Perubahan | Alasan |
|---|---|---|
| src/core/style-packs/background-pattern.ts (NEW) | Pure helper: getBackgroundPatternForStylePack, getBackgroundClassForStylePack, getAllBackgroundPatternClassNames | Resolve pattern class dari style pack ID |
| src/editor/CanvasStage.tsx | Tambah bg pattern class ke canvas-frame | Editor consistency |
| src/preview/PreviewApp.tsx | Tambah bg pattern class ke preview-canvas | Preview consistency |
| src/export/export-html.ts | Tambah bg pattern class ke #silse-canvas + CSS | Export consistency |
| src/styles.css | 6 bg pattern CSS classes (3 page + 3 pattern) | Visual styling |
| src/tests/background-pattern-system-v1.test.tsx (NEW) | 21 test | Test guard |

## Safety Proof

- content unchanged: ✓ (text, body, prompt, choices, feedback — all test verified)
- objectives unchanged: ✓
- quiz answer unchanged: ✓
- feedback unchanged: ✓
- layout geometry unchanged: ✓ (x/y/width/height — test verified)
- export consistency: ✓ (same class in editor + preview + export)

## Readability Proof

- modern-clean: pattern sangat halus (rgba 0.02 opacity) — text fully readable ✓
- soft-classroom: dots halus (rgba 0.04 opacity) — text fully readable ✓
- mission-dark: glow + grid halus (rgba 0.03-0.08 opacity) — text fully readable, contrast 14:1 ✓

## Tests

- background-pattern-system-v1: 21/21 PASS
- full suite: 2015/2015 PASS

## Verification

- typecheck: PASS
- test: 2015/2015 PASS
- build: PASS (CSS 51.19→52.89kB, JS 426.15→428.30kB)

## Known Limitations

1. Belum Canva background (di luar scope V1).
2. Belum upload image (di luar scope V1).
3. Belum screenshot diff (verify via automated test).
4. Belum browser manual proof.
5. Pattern masih CSS-only (gradient + pseudo-elements, no SVG/canvas).
