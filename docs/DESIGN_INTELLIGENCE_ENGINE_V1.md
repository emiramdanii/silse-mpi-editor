# Design Intelligence Engine V1

> SILSE wajib bisa membuat halaman MPI 16:9 yang rapi, terbaca, tidak mepet pinggir, tidak terlalu padat, warna jelas, spacing aman, tombol tidak tabrakan, preview dan export konsisten.

## Tujuan Engine

Design Intelligence Engine V1 (DIE-V1) adalah lapisan pure functions yang:

1. **Derive design tokens** dari style pack lama tanpa breaking schema.
2. **Sediakan layout recipes** per page role dengan safe area + zones.
3. **Tempatkan komponen** secara optimal berdasarkan recipe + type + index.
4. **Validasi layout quality** — deteksi komponen keluar kanvas, mepet tepi, overlap, terlalu kecil, terlalu padat.
5. **Bersihkan hardcoded warna** pada learning-bridge → CSS variables dari resolver.

## Batas V1

V1 adalah **contract + helper functions**, bukan auto-beautify penuh. Yang V1 lakukan:

- Derive tokens dari style pack existing.
- Sediakan recipes statis per role.
- Tempatkan komponen berdasarkan recipe (geometry only, tidak ubah konten).
- Validasi layout dan beri skor + issues.
- Bridge colors pakai CSS variables.

Yang V1 **tidak** lakukan:

- Tidak generate desain dari topik/materi.
- Tidak auto-fix layout issues.
- Tidak ubah typography/font family secara dinamis.
- Tidak ubah export engine besar.
- Tidak buat komponen baru.

## Design Tokens

File: `src/core/design/design-tokens.ts`

```
deriveDesignTokens(tokens: StyleTokens) → DesignTokens
```

Output tokens:

| Token | Deskripsi |
|---|---|
| `primarySoft` | Mix surface + primary 15% — background untuk CTA chip |
| `onPrimary` | Teks di atas primary (putih atau gelap, tergantung luminance) |
| `onPrimarySoft` | Teks di atas primarySoft |
| `surfaceAlt` | Mix background + surface 50% — alternatif surface |
| `onSurface` | Teks di atas surface |
| `safeArea` | Margin aman dari tepi kanvas (max 40px atau pagePadding) |
| `sectionGap` | Jarak antar section (componentGap × 2) |
| `cardPadding` | Padding internal card |
| `controlGap` | Jarak antar kontrol (min 8px) |
| `heroTitle` | Font size hero title (titleSize × 1.8) |
| `pageTitle` | Font size page title (titleSize) |
| `subtitle` | Font size subtitle |
| `body` | Font size body |
| `small` | Font size small |
| `button` | Font size button |
| `canvasWidth` | 1280 |
| `canvasHeight` | 720 |

## Layout Recipes

File: `src/core/design/layout-recipes.ts`

11 recipes, satu per page role:

| Role | Recipe ID | Safe Area | Title Zone | Content Zone | Action Zone | Max Density |
|---|---|---|---|---|---|---|
| cover | coverHero | 80 | Center 140,260 | Center 340,420 | None | 2 |
| guide | guideSteps | 80 | Full width 40 | Full width 120 | 900,620 | 3 |
| learningObjectives | objectivesLayered | 80 | Full width 40 | Full width 120 | 900,620 | 2 |
| menu | menuGrid | 80 | Full width 40 | Full width 120 | 900,620 | 6 |
| starter | starterFocus | 80 | Center 100,180 | Center 200,340 | 900,620 | 3 |
| material | materialReadable | 80 | Full width 40 | Full width 120 | 900,620 | 5 |
| activity | activityTask | 80 | Full width 40 | Left 100,120 | 900,620 | 2 |
| quiz | quizFocus | 80 | Left 100,40 | Left 100,120 | 900,620 | 2 |
| reflection | reflectionCalm | 80 | Center 150,120 | Center 150,200 | 900,620 | 3 |
| closing | closingSummary | 80 | Center 340,260 | Center 340,360 | None | 3 |
| free | freeCanvas | 40 | Full width 40 | Full width 120 | 40,bottom | 10 |

## Spacing Rules

- **Safe area**: minimum 40px dari tepi kanvas (80px untuk guided roles).
- **Section gap**: `componentGap × 2` antar zone utama.
- **Card padding**: dari style pack `cardPadding` token.
- **Control gap**: minimum 8px antar komponen dalam zone yang sama.

## Quality Checks

File: `src/core/design/layout-quality.ts`

```
validateLayoutQuality(page: SimplePage) → { ok, score, issues[] }
```

| Check | Severity | Code |
|---|---|---|
| Komponen keluar kanvas | error | `OUT_OF_CANVAS` |
| Komponen mepet tepi (< 40px) | warning | `TOO_CLOSE_EDGE` |
| Width/height terlalu kecil | warning | `TOO_SMALL` |
| Overlap besar (> 30%) | warning | `LARGE_OVERLAP` |
| Navigation di tepi bawah | warning | `NAV_AT_EDGE` |
| Halaman terlalu padat (> 12 komponen) | warning | `TOO_DENSE` |

Score: `100 - (errors × 20) - (warnings × 5)`, minimum 0.

## Bridge Color Cleanup

Sebelum DIE-V1, learning-bridge memakai hardcoded hex:
- `#2563eb` (primary blue)
- `#eff6ff` (primary soft)
- `#6b7280` (muted text)

Sesudah DIE-V1, bridge memakai CSS variables dari style resolver:
- `--silse-bridge-muted`
- `--silse-bridge-cta-bg`
- `--silse-bridge-cta-color`
- `--silse-bridge-cta-border`

React view dan export HTML sama-sama memakai `var(--silse-bridge-*)`. Fallback values tetap ada untuk safety, tetapi primary source adalah CSS variable dari resolver.

## Non-Goals

- Tidak implement Guided MPI Flow penuh.
- Tidak implement AI topic generator.
- Tidak implement custom topic bebas.
- Tidak implement Style Studio.
- Tidak implement auto beautify kompleks.
- Tidak buat komponen baru besar.
- Tidak refactor export besar-besaran.

## Upgrade Path V2

- Auto-fix layout issues (apply quality fixes automatically).
- Dynamic typography selection berdasarkan konten.
- Color contrast checker (WCAG).
- Multi-column layout untuk material panjang.
- Responsive scaling untuk non-16:9 aspect ratios.
- Integration dengan GUIDED-MPI-FLOW-01 (paket MPI terpandu).
