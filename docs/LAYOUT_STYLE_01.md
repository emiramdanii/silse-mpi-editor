# Layout Style System V1 (LAYOUT-STYLE-01)

Commit: `LAYOUT-STYLE-01`
Tanggal: 2026-07-12
Verifier: AI Dev

## Tujuan

Memungkinkan AI untuk mengatur tata letak grid (jumlah kolom, gap) pada scene melalui `customStyle.grid`. Sistem ini memberikan kontrol layout yang aman, ter-sanitasi, dan konsisten antara editor, preview, dan ekspor.

## Arsitektur

### Alur Data

```
AI JSON → customStyle.grid → sanitizeCustomStyle() → customStyleCss.grid
    ↓                                                          ↓
React: CustomStyleProvider context              Export: _sceneCustomStyleCss closure
    ↓                                                          ↓
SceneGrid (reads context)                       exportGrid() (reads closure)
    ↓                                                          ↓
<div style={{ display:'grid', ...overlay }}>    el.style.cssText += grid CSS string
```

### Komponen Kunci

| Komponen | File | Peran |
|---|---|---|
| Sanitizer | `src/core/style/sanitize.ts` | Whitelist CSS properties + value validation |
| SceneGrid | `src/components/scene-blocks/index.tsx` | React block — reads `customStyle.grid` from context |
| exportGrid | `src/export/export-html.ts` | Export counterpart — reads `_sceneCustomStyleCss.grid` |
| CustomStyleProvider | `src/components/scene-blocks/index.tsx` | React context — passes raw customStyle to all blocks |
| buildExportRenderModel | `src/export/export-html.ts` | Pre-sanitizes customStyle at build time → `customStyleCss` |

### Prioritas Override

| Prioritas | Sumber | Contoh |
|---|---|---|
| 1 (tertinggi) | AI `customStyle.grid` | `{ "grid": { "gridTemplateColumns": "repeat(3, 1fr)" } }` |
| 2 | Developer `columns` prop | `<SceneGrid columns="1fr 1fr">` |
| 3 | Contract default | `contract.learning.exampleGridColumns` |
| 4 (terendah) | Global fallback | `repeat(auto-fill, minmax(240px, 1fr))` |

## Security Model

### Pendekatan: Whitelist + Value Validation

Sanitizer menggunakan **allow-list** (bukan blacklist). Dua layer:

1. **Property whitelist** — hanya properti di `ALLOWED_CSS_PROPERTIES` yang lolos.
2. **Value validation** — `normalizeValue()` memvalidasi nilai per-properti.

### Properti yang Diizinkan untuk Grid

| Properti | Value yang Diizinkan | Value yang Ditolak |
|---|---|---|
| `display` | `grid`, `flex`, `inline-grid`, `inline-flex` | `none`, `block`, `inline` |
| `gridTemplateColumns` | 4 pattern aman (lihat bawah) | `calc()`, `subgrid`, `var()`, persen, `auto` |
| `gridTemplateRows` | Sama dengan columns | Sama |
| `gap` | 0-100px (clamped) | Negatif, > 100px |
| `flexDirection` | `row`, `column`, `row-reverse`, `column-reverse` | Lainnya |
| `flexWrap` | `wrap`, `nowrap`, `wrap-reverse` | Lainnya |
| `alignItems` | 10 nilai (flex-start/end, center, stretch, dll.) | Lainnya |
| `justifyContent` | 10 nilai (sama dengan alignItems) | Lainnya |

### 4 Pattern Aman untuk `gridTemplateColumns`

| Pattern | Contoh | Batasan |
|---|---|---|
| `repeat(N, 1fr)` | `repeat(3, 1fr)` | N = 1-6 |
| `repeat(auto-fill, minmax(NNNpx, 1fr))` | `repeat(auto-fill, minmax(240px, 1fr))` | NNN = 100-500 |
| `repeat(auto-fit, minmax(NNNpx, 1fr))` | `repeat(auto-fit, minmax(180px, 1fr))` | NNN = 100-500 |
| `1fr 1fr ... 1fr` | `1fr 1fr` | Maksimal 6 kolom |

### Properti yang Dilarang (XSS / Layout Takeover)

```
position, left, top, right, bottom,
width, height, minWidth, minHeight, maxWidth, maxHeight,
visibility, overflow, overflowX, overflowY,
zIndex, float, clear,
gridColumn, gridRow
```

`gridColumn` dan `gridRow` sengaja dilarang untuk mencegah AI memecahkan slot flow (item keluar dari grid container).

## Editor ↔ Export Paritas

| Aspek | Editor (React) | Export (HTML) |
|---|---|---|
| Sanitization | `sanitizeCustomStyle()` di setiap block | `sanitizeCustomStyle()` di `buildExportRenderModel()` |
| CSS string | React style object (camelCase) | `styleMapToCssString()` (kebab-case) |
| Grid container | `<SceneGrid>` component | `exportGrid()` function |
| Override source | `CustomStyleProvider` context | `_sceneCustomStyleCss` closure variable |

## Adopsi (Level 2)

### Composer yang Sudah Pakai SceneGrid (L2-1)

| Composer | Grid | Default columns |
|---|---|---|
| GlossaryCardsComposer | Glossary card grid | `repeat(auto-fill, minmax(280px, 1fr))` |
| ClassificationGameComposer | Category columns | `repeat(N, 1fr)` (dinamis) |
| MatchingGameComposer | Left/right columns | `1fr 1fr` |
| WorksheetActivityComposer | Input fields | `repeat(auto-fill, minmax(240px, 1fr))` |
| ResultSummaryComposer | Review cards | `repeat(auto-fill, minmax(240px, 1fr))` |

### Inline Renderer yang Sudah Pakai SceneGrid (L2-2)

| Renderer | Grid | Default columns |
|---|---|---|
| GameMissionContent | Action card grid | `repeat(auto-fill, minmax(180px, 1fr))` |
| QuizQuestionContent | Answer card grid | `repeat(auto-fill, minmax(200px, 1fr))` |
| LearningMaterialContent | Example card grid | `contract.learning.exampleGridColumns` (L2-3 wired) |

### Export Parity

Setiap SceneGrid di React memiliki `exportGrid()` mirror di export dengan `className`, `columns`, dan `gap` yang identik.

## AI Contract

### Contoh `customStyle.grid` yang Valid

```json
{
  "sceneCustomStyle": {
    "grid": {
      "gridTemplateColumns": "repeat(3, 1fr)",
      "gap": "16"
    }
  }
}
```

### Contoh yang Ditolak Sanitizer

```json
// Ditolak: calc() tidak diizinkan
{ "grid": { "gridTemplateColumns": "calc(100% / 3)" } }

// Ditolak: gridColumn dapat memecahkan slot flow
{ "grid": { "gridColumn": "span 2" } }

// Ditolak: position dapat mengambil alih layout
{ "grid": { "position": "absolute" } }
```

## Testing

| File | Tests | Fokus |
|---|---|---|
| `src/tests/layout-style-01.test.tsx` | 39 | Sanitizer + React context + export HTML |
| `src/tests/layout-style-01-audit.test.tsx` | 22 | Security audit — pattern rejection, XSS prevention |

## Yang Tidak Di-scope

- `gridTemplateAreas` — kompleks (named areas), defer ke fase terpisah
- `gridAutoFlow: dense` — edge case, defer
- Per-slot `customStyle` — saat ini scene-wide, defer ke fase terpisah
- Editor inspector UI untuk grid picker — AI-only authoring untuk sekarang
