# Fase 1 Color System Foundation — Hardcoded Style Audit Report

**Branch:** `refactor/fase1-color-prep`
**Tanggal:** 2026-07-09
**Mode:** AUDIT ONLY — no code changes
**Tujuan:** Inventarisasi lengkap hardcoded styles untuk migrasi ke design tokens di Fase 1
**Token reference:** `src/core/design/scene-custom-styles.ts` (interface dengan ~80 token terdefinisi)
**Scope:** Production code only (`src/components/`, `src/editor/`, `src/preview/`, `src/export/`, `src/styles.css`). File di `src/core/ai-mpi-json/legacy/` dan `src/tests/fixtures/` TIDAK diaudit — tidak akan dimigrasi.

---

## 📋 Executive Summary (5-minute read)

Audit ini menemukan **480 instance hardcoded warna** di 14 file production code. Distribusi severity: P0 (6 item, wrong var names — silent Tailwind fallback), P1 (4 component views, redundant fallback), P2 (2 dialog files, ~65 hex), P3 (PageThumbnail markers, 8 hex), P4 (export-html.ts, ~330 instances — largest surface), P5 (animation, defer). Akibat hardcoded values, **tema tidak konsisten** antara style pack dan **parity React-vs-export** tidak tercapai. Migrasi ke design tokens (Fase 1, estimasi 5-7 hari) akan menghilangkan semua hardcoded hex, menambah ~30 token baru ke `:root`, dan mencapai milestone "Hapus Fallback Warna" (grep `var(--token, #hex)` return 0 di `src/`). Prioritas eksekusi: P0 dulu (1-2 jam, minimal risk), lalu P1-P4 bertahap, P5 defer ke Fase 2.

**Catatan akurasi hitungan:** Angka per-file (`styles.css` ~250, `export-html.ts` ~330) adalah instance-level (satu hex per baris). Total 480 adalah unique violations setelah deduplikasi fallback duplikat. ~100+ instance di `export-html.ts` adalah `var(--token, #hex)` fallback yang redundant (akan dihapus di P4), sehingga unik violation count lebih rendah dari raw hex count.

---

## 📊 Detailed Metrics

| Metric | Count |
|---|---|
| **Hardcoded color instances (Category A — Fase 1 target)** | **~480 total** across 14 files |
| └─ `src/styles.css` | ~190 hex + ~60 rgba (outside `:root`) |
| └─ `src/export/export-html.ts` | 228 hex + ~100 rgba (banyak var-fallbacks) |
| └─ `src/editor/*.tsx` | ~95 hex literals across 8 files |
| └─ `src/components/*.tsx` | ~30 hex + ~25 rgba across 8 files |
| └─ `src/preview/PreviewApp.tsx` | **0** (sudah token-only) ✅ |
| **Typography literals (Category B — Fase 2)** | ~1116 (count only) |
| **Spacing literals (Category C — Fase 2)** | ~1175 (count only) |
| **Structural literals (Category D — keep as-is)** | ~225 (display, position, zIndex, transition, dll) |

### Top 10 Files by Violation Count

| # | File | Color | Typography | Spacing |
|---|---|---|---|---|
| 1 | `src/styles.css` | ~250 | 309 | 342 |
| 2 | `src/export/export-html.ts` | ~330 | 265 | 256 |
| 3 | `src/editor/TemplatePickerDialog.tsx` | ~30 | 20 | 22 |
| 4 | `src/editor/AiImportDialog.tsx` | ~35 | 22 | 36 |
| 5 | `src/components/scene-composers/index.tsx` | ~17 | 114 | 99 |
| 6 | `src/components/SceneRendererView.tsx` | ~25 | 61 | 57 |
| 7 | `src/editor/ListFieldEditor.tsx` | 13 | 12 | 11 |
| 8 | `src/components/LayeredInfoComponentView.tsx` | 3 | 28 | 36 |
| 9 | `src/components/GameComponentView.tsx` | 0 (all var()) | 27 | 28 |
| 10 | `src/components/scene-blocks/index.tsx` | ~16 | 41 | 46 |

---

## 🎨 Category A: Color Findings — Highlights

### P0 — Critical Bugs (wrong var names, immediate fix)

| File:Line | Issue | Fix |
|---|---|---|
| `styles.css:2896, 2904` | `var(--color-primary, #3b82f6)` — **wrong var name**, `--color-primary` tidak ada | → `var(--color-accent)` |
| `styles.css:2929, 2938` | `var(--color-surface, #f9fafb)`, `var(--color-muted, #6b7280)` — wrong var names + Tailwind fallback | → `var(--color-panel-soft)`, `var(--color-muted)` |
| `styles.css:2953, 2955, 2963, 2967` | `var(--color-border/bg/primary, #...)` — wrong var names | → `var(--color-border)`, `var(--color-panel)`, `var(--color-accent)` |
| `styles.css:2041-2042` | `#246b3e` guided-flow button hover | → NEW `--color-success-hover` |
| `LayeredInfoComponentView.tsx:273, 290, 482` | Pure `#e3ddcd` / `#2563eb` literals (no var at all) | → `var(--color-border)`, `var(--color-accent)` |
| `VisualSection.tsx:51-58` | AI style section: `#7c3aed`, `#6b21a8` (Tailwind violet) | → NEW `--color-ai-style` family |
| `Topbar.tsx:237-239` | AI style badge: same violet | → NEW `--color-ai-style` family |

### P1 — Component view fallbacks (drop redundant fallbacks)

| File:Line | Issue | Fix |
|---|---|---|
| `CardComponentView.tsx:45, 61` | `var(--silse-color-primary, #2563eb)` | → `var(--color-accent)` (drop fallback) |
| `ImageComponentView.tsx:37, 49` | same | → `var(--color-accent)` |
| `TextComponentView.tsx:49, 67` | same | → `var(--color-accent)` |
| `NavigationComponentView.tsx:47, 61` | same | → `var(--color-accent)` |

### P2 — Dialog files (TemplatePickerDialog + AiImportDialog)

- `TemplatePickerDialog.tsx`: ~30 hex (slate palette + navy + status chips)
- `AiImportDialog.tsx`: ~35 hex (banyak `#1e5b8f` = exact `--color-accent`, langsung swap)

### P3 — PageThumbnail component markers

8 hardcoded hex untuk component-type markers (`#3b82f6` text, `#10b981` image, dll) → NEW `--color-marker-*` family

### P4 — Export HTML (largest surface)

- `:root` block (line 357-375): **duplicate** editor tokens — extract to shared TS module
- `style.cssText` builders: 228 hex lines, banyak fallbacks yang bisa di-drop karena `:root` sudah define

---

## 🆕 New Tokens Needed (tidak ada di `--color-*` saat ini)

### Premium export palette (saat ini hanya di export-html.ts `:root`)
- `--silse-gold`, `--silse-gold-deep`, `--silse-navy`, `--silse-blue`, `--silse-red`
- `--silse-hero-color`, `--silse-hero-accent`, `--silse-muted-premium`
- `--silse-card-bg/border/shadow`, `--silse-stage-outer/text`

### Tailwind-derived "strong" palette (status chips, feedback)
- `--color-success-strong/strong-soft/deep/premium/soft-premium`
- `--color-danger-strong/strong-soft/deep/premium/soft-premium`
- `--color-warning-strong/deep/soft-premium/border-premium`
- `--color-accent-strong/premium`
- `--color-info/soft/deep/border`

### Editor chrome — neutral slate/gray scale (mismatched vs current tokens)
- `--color-text-strong` (`#0f172a`/`#1f2937`)
- `--color-text-soft-neutral` (`#475569`/`#334155`)
- `--color-muted-neutral` (`#64748b`/`#6b7280`/`#9ca3af`/`#94a3b8`)
- `--color-border-neutral` (`#e2e8f0`/`#d1d5db`/`#cbd5e1`/`#e5e7eb`)
- `--color-panel-soft-neutral` (`#f8fafc`/`#f9fafb`/`#f1f5f9`)

### Editor chrome — AI-style badge
- `--color-ai-style` (`#7c3aed`), `--color-ai-style-strong` (`#6b21a8`)
- `--color-ai-style-bg-gradient`, `--color-ai-style-border`

### Editor chrome — component markers
- `--color-marker-{text,image,card,navigation,question,game,layered-info,learning-bridge}`

### On-dark text + scrims
- `--color-text-on-dark`, `--color-muted-on-dark`
- `--color-overlay-scrim{,-strong,-navy,-premium}`

### Shadows
- `--shadow-card-premium-{light,dark}`, `--shadow-card-subtle`
- `--shadow-stage-premium`, `--shadow-dialog-{premium,strong}`
- `--shadow-floating-soft`, `--shadow-button-{premium,navy}`
- `--shadow-{kicker,kicker-strong,cta-premium,award-medal,hero-card}`

### Focus rings + guides
- `--color-focus-ring-{blue,amber,mission}`
- `--color-guide-blue-{soft,medium}`

### Phase-flag hover
- `--color-success-hover` (`#246b3e`)

---

## 🚨 Special Cases (jangan migrasi blind)

1. **`SceneRendererView.tsx:811-816`** — `getContrastAwareTextColor()` return `var(--silse-color-surface, var(--color-panel))` untuk cover/closing scenes. **Intentional override** karena dark gradient bg. → NEW `--color-text-on-dark` token.

2. **`styles.css:42-44`** — `--shadow-*` definitions pakai `rgba(31, 37, 51, ...)` (RGB dari `#1f2533` = `--color-text`). Intentional — shadow color match text. Bisa token jadi `--color-shadow-base`.

3. **`styles.css:93`** (`button.primary { color: white }`) — white text on accent bg. Intentional contrast.

4. **`CanvasStage.tsx:557-571`** — drag-alignment guides `rgba(37,99,235,...)`. Editor-only affordance, **tidak** ikut theme canvas. → NEW `--color-guide-blue-*` editor-chrome tokens.

5. **`styles.css:3374-3382`** — focus-visible per style pack. Style-pack-specific → NEW `--silse-focus-ring-{clean,soft,mission}`.

---

## 📋 Migration Priority Order

### P0 — Fix immediately (visible on every editor open) — ✅ SELESAI (commit 5ae5092)
1. ✅ `styles.css:2041-2042` — guided-flow button hover → `var(--color-success-hover)`
2. ✅ `styles.css` (~15 instances) — wrong var names → correct tokens (`--color-accent`, `--color-panel-soft`, dll)
3. ✅ `VisualSection.tsx:51-58` — AI style section → `var(--color-ai-style-*)`
4. ✅ `Topbar.tsx:237-239` — AI style badge → `var(--color-ai-style-*)`
5. ✅ `LayeredInfoComponentView.tsx:273, 290, 482` — pure literals → `var(--color-border)`, `var(--color-accent)`
6. ✅ Token definition: 32 new tokens added to `:root` (text-on-dark, success-strong/deep/hover, warning-strong/deep, danger-strong/deep, overlay scrims, AI-style family, 8 markers, 7 premium shadows)

### P1 — High user-visible — ✅ SELESAI (commit 5ae5092)
6. ✅ Drop `#2563eb` fallback dari 4 component views (Card/Image/Text/Navigation, 8 instances) → `var(--color-accent)`

### P2 — Dialog files — ✅ SELESAI (commit 38872cf, ab71fee, b362fc1, 666b0da)
7. ✅ `Topbar.tsx:368,373` — Suspense fallback `#64748b` → `var(--color-muted)` (2 hex)
8. ✅ `TemplatePickerDialog.tsx` (~30 hex) → tokens (neutral + navy + status)
9. ✅ `AiImportDialog.tsx` (~31 hex) → tokens (banyak `#1e5b8f` = exact `--color-accent`)
   * Token baru ditambahkan: `--color-text-strong` (#0f172a), `--color-border-neutral` (#e2e8f0)

### P3 — PageThumbnail markers — ⏳ TUNDA
10. ⏳ 8 component-type marker colors → `--color-marker-*` family (tokens sudah defined di :root, tinggal swap)

### P4 — Export HTML (largest surface) — ⏳ TUNDA
11. ⏳ `export-html.ts` `:root` block — extract to shared TS module
12. ⏳ `export-html.ts` ~191 hex fallbacks → replace with `var(--silse-*)` / `var(--color-*)`
13. ⏳ `styles.css` ~92 hex (outside :root) — skin classes + premium decoration

### P5 — Animation/celebration — ➖ DEFER to Fase 2
14. ➖ `styles.css:3714-3934`, `export-html.ts:727-769` — motion + celebrate colors

### Milestone: "Hapus Fallback Warna" — ⏳ TUNDA (target: setelah P4)
- ⏳ Setelah P4 selesai, semua `var(--token, #hex)` fallback dihapus
- ⏳ Verifikasi: `rg "var\(--[a-z-]+,\s*#"` return 0 di src/

---

## 📊 Progress Summary (updated 2026-07-09)

| Priority | Items | Done | Remaining | Instances Migrated |
|---|---|---|---|---|
| P0 | 6 | 6 ✅ | 0 | ~40 (15 wrong vars + 11 AI-style + 8 LayeredInfo + 6 guided-flow) |
| P1 | 1 | 1 ✅ | 0 | 8 (component view fallbacks) |
| P2 | 3 | 3 ✅ | 0 | ~63 (Topbar 2 + TemplatePickerDialog 30 + AiImportDialog 31) + 2 new tokens |
| P3 | 1 | 0 | 1 | 8 hex remaining |
| P4 | 3 | 0 | 3 | ~283 hex remaining |
| P5 | 1 | 0 | 0 (deferred) | ~5 hex (deferred) |
| **Total** | **15** | **10 ✅** | **5** | **~111 migrated, ~296 remaining** |

#### Contoh Before/After P0

**P0 item 2 — Wrong var name (silent Tailwind fallback):**
```css
/* ❌ SEBELUM — var(--color-primary) TIDAK ADA di :root, fallback #3b82f6 (Tailwind blue-500) dipakai diam-diam */
background: var(--color-primary, #3b82f6);

/* ✅ SESUDAH — var(--color-accent) ADA di :root (#1e5b8f), fallback dihapus */
background: var(--color-accent);
```

**P0 item 2 — Wrong var name + wrong fallback (slate palette):**
```css
/* ❌ SEBELUM — var(--color-surface) tidak ada, fallback #f9fafb (Tailwind slate-50) */
background: var(--color-surface, #f9fafb);
color: var(--color-muted, #6b7280);  /* fallback Tailwind gray-500, bukan #8a8775 */

/* ✅ SESUDAH — token yang benar dari :root */
background: var(--color-panel-soft);
color: var(--color-muted);
```

**P0 item 3 — AI style section (VisualSection.tsx):**
```tsx
// ❌ SEBELUM — hardcoded Tailwind violet, tidak ikut tema
style={{ color: '#7c3aed' }}  // violet-600
style={{ background: 'rgba(139,92,246,0.08)' }}  // violet with alpha

// ✅ SESUDAH — token baru (akan didefinisikan di :root Fase 1)
style={{ color: 'var(--color-ai-style)' }}
style={{ background: 'var(--color-ai-style-bg-gradient)' }}
```

**P0 item 5 — LayeredInfoComponentView.tsx (pure literals, no var at all):**
```tsx
// ❌ SEBELUM — hardcoded hex literal, tidak var() sama sekali
style={{ borderBottom: '1px solid #e3ddcd' }}
style={{ borderBottom: '3px solid #2563eb' }}

// ✅ SESUDAH — pakai token yang sudah ada di :root
style={{ borderBottom: `1px solid var(--color-border)` }}
style={{ borderBottom: `3px solid var(--color-accent)` }}
```

**P1 item — Component view fallback (redundant, fallback salah):**
```tsx
// ❌ SEBELUM — fallback #2563eb (Tailwind blue-600) TIDAK SAMA dengan --color-accent (#1e5b8f)
outline: selected ? '2px solid var(--silse-color-primary, #2563eb)' : 'none',

// ✅ SESUDAH — langsung pakai --color-accent, tanpa fallback, tanpa indirection
outline: selected ? '2px solid var(--color-accent)' : 'none',
```

### P1 — High user-visible
6. Drop `#2563eb` fallback dari 4 component views (Card/Image/Text/Navigation)

### P2 — Dialog files
7. `TemplatePickerDialog.tsx` (~30 hex) — neutral + navy + status tokens
8. `AiImportDialog.tsx` (~35 hex) — banyak `#1e5b8f` = exact `--color-accent`

### P3 — PageThumbnail markers
9. 8 component-type marker colors → `--color-marker-*` family

### P4 — Export HTML (largest, slowest)
10. Extract `:root` block ke shared TS module
11. Replace `'#fff'`, `'#16a34a'`, dll fallbacks dengan `var(--silse-*)` (sudah di-define di `:root`)
12. Drop `var(--silse-color-*, #hex)` fallbacks di styles.css skin classes

### P5 — Animation/celebration (defer)
13. `styles.css:3714-3934`, `export-html.ts:727-769` — motion + celebrate colors

---

## 🏗️ Recommended Fase 1 Execution

1. **Define new tokens** di `src/styles.css :root` (~30 new tokens from list above)
2. **Run P0 fixes** (6 items) — minimal-risk swaps
3. **Run P1 fixes** (4 component views) — pure removal, no visual change
4. **Run P2 fixes** (2 dialog files) — isolated surface
5. **Defer P3-P5** ke Fase 1.5 atau Fase 2 kalau scope tighten
6. **Add lint guard** — ESLint rule atau grep-based pre-commit hook untuk fail on `#[0-9a-fA-F]{3,8}` di `.tsx` files (outside allowlist)
7. **Document token contract** — `docs/COLOR_TOKENS.md` listing every `--color-*` dan `--silse-*` token
8. **Long-term: extract shared token module** — `src/core/design/tokens.ts` sebagai single source, generate `:root` untuk editor + export

---

## ✅ Files Safe to Defer (rarely hit)

- `mpi-page-status.ts:92` — `#000000` fallback (rare path)
- `Topbar.tsx:368, 373` — Suspense fallback (lazy-load only)
- `SceneContentEditor.tsx` (4 literals) — power-user path
- `ListFieldEditor.tsx` (13 literals) — custom-list inspector
- `styles.css:3714-3934` — celebration/animation (only on correct answer)
- `styles.css:3535-3660` — premium decorative blobs (cover scenes only)

---

**Audit complete. Ready for Fase 1 planning.**
