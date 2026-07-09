# ADR-0001: SceneCustomStyles as Single Source of Truth

**Status:** Accepted
**Date:** 2026-07-09
**Supersedes:** None
**Superseded by:** None

## Context

Sebelum Fase 1, styling scene di SILSE-MPI-Editor berasal dari **7 sumber berbeda**:

1. `project.style.tokens` (dari style pack)
2. `MpiDesignContract` (`getDesignContractWithProjectStyle`)
3. `SlotResolvedStyle` (`renderScenePlan.ts`)
4. `ResolvedComponentStyle` (`resolveComponentStyle.ts`)
5. `customStyle` (per-scene, dari AI — `AiBlueprintSlot.customStyle`)
6. CSS variables `--silse-color-*` (di-inject ke `:root`)
7. Hardcoded hex literals (480 instances teridentifikasi di audit)

**Masalah:**
- Renderer (React) baca dari sumber 2/3/4/6/7 (tidak konsisten per file)
- Export HTML baca dari sumber 6/7 (duplikasi ~3000 baris dengan React)
- `customStyle` (sumber 5) **dihapus diam-diam** oleh normalizer (bug AUDIT 1.2, sudah fixed)
- 480 hardcoded hex literals menyebabkan tema tidak konsisten
- 7 sumber style berarti 7 tempat untuk update saat tambah style pack baru

**Akar masalah:** Tidak ada single source of truth. Setiap renderer ambil dari sumber berbeda, dan `customStyle` (yang seharusnya jadi AI intent source) tidak di-preserve.

## Decision

Konsolidasi 7 sumber menjadi **2 sumber kanonik**:

### A. DesignTokens (defined once, used everywhere)
- Defined di `src/styles.css :root` sebagai CSS variables
- Generated dari style pack + editor theme
- 3 token groups: `ColorTokens`, `StylePackTokens`, `ShadowTokens`
- Total ~80 tokens (existing + ~30 new dari audit)
- Renderer baca via `var(--color-*)`, `var(--silse-*)`, `var(--shadow-*)`
- **NO hardcoded hex literals** di renderer (grep `#[0-9a-fA-F]{3,8}` return 0 di src/)

### B. SceneCustomStyles (per-scene override dari AI)
- Structured object: `{ elementKey: { cssProperty: value } }`
- Bersumber dari `AiBlueprintSlot.customStyle`
- Di-preserve oleh normalizer (AUDIT 1.2 fix)
- Di-sanitize oleh `src/core/style/sanitize.ts` sebelum apply
- **Priority tertinggi** — override DesignTokens per-element

### Merge via `mergeStyles()` (Fase 2)
```
finalStyle = mergeStyles(designTokens, sceneCustomStyles)
// priority: sceneCustomStyles > designTokens > fallback (structural only)
```

`mergeStyles()` adalah pure function (no React/DOM), dipakai oleh:
- React renderer (editor + preview)
- Export HTML generator

**Parity 100% terjamin** karena kedua sisi pakai function yang sama.

## Consequences

### Positif
- **1 source of truth** untuk design tokens (defined in `:root`)
- **1 merge function** untuk React + export (parity struktural)
- **0 hardcoded hex** di renderer (themeable via token swap)
- **customStyle AI preserved** end-to-end (AI intent → SimpleProject → renderer)
- **Theme switching** jadi trivial (ganti `:root` variables, semua ikut)
- **Visual regression test** bisa compare React vs export (same mergeStyles = same output)

### Negatif
- **Migration effort**: 480 hardcoded instances + ~3000 baris duplikasi export → ~5-7 hari kerja (Fase 1-3)
- **Breaking change potential**: jika token naming tidak konsisten, renderer bisa dapat `undefined` — butuh thorough testing
- **Bundle size**: `:root` block naik ~2KB (30 new tokens) — acceptable
- **Learning curve**: dev baru harus paham token system sebelum edit styling

### Netral
- `ResolvedComponentStyle` dan `SlotResolvedStyle` tetap ada sebagai **intermediate types** (produk dari mergeStyles, bukan sumber truth)
- `MpiDesignContract` tetap ada sebagai **style pack definition** (input untuk generate DesignTokens)

## Implementation Phases

| Fase | Scope | Estimasi |
|---|---|---|
| **Fase 1** | Define DesignTokens + migrate hardcoded hex | 5-7 hari |
| **Fase 2** | Implement mergeStyles() + refactor renderer baca dari merged | 7-10 hari |
| **Fase 3** | Extract shared token module + parity React-vs-export | 3-5 hari |
| **Fase 4** | Visual regression test + lint guard | 2-3 hari |

## Milestone: "Hapus Fallback Warna" (Review Recommendation #5)

**Trigger:** Senior code review (9 Jul 2026) — "Buat milestone untuk menghapus fallback warna agar tidak lupa setelah token CSS selesai."

**Definition of Done:**
- [ ] Semua `var(--token, #hex)` fallback dihapus dari src/
- [ ] Hanya `var(--token)` tanpa fallback (karena `:root` sudah define semua)
- [ ] Grep verifikasi: `rg "var\(--[a-z-]+,\s*#"` return 0 match di src/
- [ ] Test suite 100% pass
- [ ] Visual regression: no color change (token defined identik ke fallback lama)

**Target completion:** Akhir Fase 1 P4 (setelah premium tokens + drop fallbacks)

## References

- `download/SILSE_FASE1_COLOR_AUDIT.md` — 480 hardcoded instances inventoried
- `download/SILSE_REVIEW_QUICK_WINS.md` — token naming convention
- `src/core/design/scene-custom-styles.ts` — interface draft
- `src/core/style/sanitize.ts` — existing CSS sanitizer (defense-in-depth)
- AUDIT 1.2 fix (commit `5795a1f`) — normalizeSlot preserve customStyle
