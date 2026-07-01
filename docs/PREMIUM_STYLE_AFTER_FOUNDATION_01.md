# PREMIUM-STYLE-AFTER-FOUNDATION-01

> Status: **READY FOR SENIOR REVIEW**
> Tanggal: 2026-07-01

## Tujuan

Menaikkan kualitas visual hasil MPI tanpa mengubah arsitektur, tanpa membuat style system baru, dan tanpa merusak editor/preview/export parity. Semua polish lewat existing design contract / scene blocks / composers.

---

## 1. Apa yang Dipolish

### SceneShell
- **Subtle radial gradient**: `radial-gradient(ellipse at top, surface 0%, background 70%)` — memberikan depth tanpa asset eksternal.
- **More gap + padding**: gap 14→16px, padding 22→28px — lebih lapang, tidak terasa prototype.

### SceneHeader
- **Accent border bottom**: `2px solid {chipColor || gold}33` — separator visual yang jelas.
- **Chip uppercase + letter spacing**: `text-transform: uppercase; letter-spacing: 0.05em` — hierarchy lebih kuat.
- **Title letter spacing**: `-0.02em` — lebih tight dan modern.

### ScenePanel
- **Depth shadow**: `box-shadow: 0 2px 8px rgba(0,0,0,0.08)` — panel terasa float.
- **Uppercase title**: `text-transform: uppercase; letter-spacing: 0.04em; color: mutedText` — label section lebih jelas.

### ActionButtonBlock
- **Shadow**: `box-shadow: 0 2px 6px rgba(0,0,0,0.12)` — button terasa clickable.
- **Hover lift**: `translateY(-1px)` on mouse enter — micro-interaction ringan.

---

## 2. Bagaimana Polish Tetap Lewat Existing Contract

Semua polish menggunakan token yang sudah ada di design contract:
- `contract.palette.background` → radial gradient base
- `contract.palette.surface` → radial gradient highlight
- `contract.palette.gold` → accent border
- `contract.palette.mutedText` → panel title color
- `contract.card.shadow` → panel depth
- `contract.button.shadow` → button depth
- `contract.typography.heroFont/titleSize/titleWeight` → header hierarchy

**Tidak ada** `tokens.ts` paralel, `GlobalStyle.css` baru, CSS framework import, atau hardcoded hex di luar contract fallback.

---

## 3. Bukti Editor/Preview/Export Parity

| Polish | React (scene-blocks) | Export (export-html) |
|--------|---------------------|---------------------|
| Radial gradient shell | ✅ `radial-gradient` | ✅ `radial-gradient` |
| Accent border header | ✅ `border-bottom: 2px solid` | ✅ `border-bottom:2px solid` |
| Panel depth shadow | ✅ `box-shadow` | ✅ `box-shadow:0 2px 8px` |
| Uppercase panel title | ✅ `text-transform: uppercase` | ✅ `text-transform:uppercase` |
| Button shadow + hover | ✅ `box-shadow` + `translateY` | ✅ `box-shadow` (hover is JS-only, export has CSS transition) |

---

## 4. Batasan yang Belum Dikerjakan

1. **Classification game polish** — item pool/column polish ditunda ke P2.
2. **Learning/Discussion/Reflection specific polish** — per-scene visual polish ditunda ke P2.
3. **Motion preset** — `contract.motion` terdefinisi tapi belum diimplementasi.
4. **Sequencing lock after correct** — tombol urutkan masih bisa digeser setelah benar (backlog dari runtime sync review).

---

## 5. Syarat Lanjut ke Premium P2

Lulus jika: typecheck + test + build PASS, polish muncul di React + export, interaction masih berfungsi, legacy aman.

---

## Lampiran: Test Suite

File: `src/tests/premium-style-after-foundation-01.test.tsx` — 12 tests.

| Scope | Tests | Fokus |
|-------|-------|-------|
| Contract Safety | 2 | No parallel tokens, no new framework |
| Scene Shell Polish | 3 | Gradient, shadow, accent border |
| Export Parity | 3 | Gradient, shadow, border in export |
| Interaction | 4 | Classification still works, legacy safe, 12 golden pass, wireInteractions present |

Verifikasi: typecheck PASS, test 3203/3203 PASS, build PASS.
