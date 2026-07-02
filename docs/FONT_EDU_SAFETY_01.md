# FONT-EDU-SAFETY-01 — Educational Typography Guard

Status: Implemented
Layer: `core/style-packs/font-edu-safety.ts` (pure function, no React/DOM)

## Goal

Keep typography across the SILSE MPI editor and its standalone HTML export
**education-friendly**: not lebay, not decorative, not poster-style. Fonts must
read like a teacher's learning media, not a commercial design.

## Rules enforced

Per senior reviewer's `FONT-EDU-SAFETY-01` spec:

1. **Max 2-3 font family tokens** per design contract (hero + body).
2. **No decorative fonts**: Comic Sans, Fredoka, cursive, fantasy, script,
   display/poster fonts (Bebas, Oswald, Anton, Impact, etc.).
3. **Title font** may be bold but still formal-educative (no poster-style).
4. **Body font must be sans-serif** — clean, readable on projector 16:9.
5. **Size safe ranges** (for the active DesignContract, not legacy packs):
   - title: 28–44px
   - subtitle: 16–22px
   - body: 15–18px
   - label/badge: 11–13px
6. **No excessive uppercase** (badge OK, main title no).
7. **Editor / Preview / Export parity** — same fonts everywhere.
8. **No external fonts** — no Google Fonts, no CDN, no `@font-face`, no remote
   `.woff2`/`.ttf`/`.otf`. System font stacks only.

## Architecture

### Core API: `src/core/style-packs/font-edu-safety.ts`

Pure functions, no React/DOM, no store. Imports only types from
`mpi-design-contract` and `style-types`.

```ts
// Forbidden font detection
findForbiddenFontKeyword(fontFamily: unknown): string | null
hasForbiddenGenericFamily(fontFamily: unknown): 'cursive' | 'fantasy' | 'monospace' | null
FORBIDDEN_FONT_KEYWORDS: readonly string[]

// External font URL detection
findExternalFontReference(text: unknown): string | null

// Font family token counting (excludes generics + OS prefixes)
countDistinctFontFamilyTokens(typography: DesignTypography): number

// Typography audit (DesignTypography from contract — strict, includes sizes)
checkTypographyEduSafety(typography, scope, limits?): FontEduSafetyIssue[]
checkContractEduSafety(contract, scope, limits?): FontEduSafetyIssue[]

// Legacy StylePack audit (font-family + generic only — no size checks)
checkStylePackEduSafety(pack, scope): FontEduSafetyIssue[]

// CSS / HTML source audit (external fonts + forbidden font-family decls)
checkCssSourceEduSafety(cssText, scope): FontEduSafetyIssue[]
checkHtmlSourceEduSafety(htmlText, scope): FontEduSafetyIssue[]

// Combined audit
checkAllEduSafety(contracts, packs, cssSources, htmlSources, limits?): FontEduSafetyIssue[]

// Limits
DEFAULT_FONT_EDU_SAFETY_LIMITS: FontEduSafetyLimits
```

### Forbidden font keywords (case-insensitive)

- **Comic/playful**: `comic sans`, `comic neue`, `fredoka`, `baloo`, `bangers`,
  `patrick hand`, `permanent marker`, `shadows into light`
- **Script/cursive**: `cursive`, `script`, `brush script`, `lucida handwriting`,
  `pacifico`, `dancing script`, `caveat`, `kalam`
- **Fantasy/display**: `fantasy`, `impact`, `broadway`, `showcard gothic`,
  `chiller`, `jokerman`
- **Poster-style**: `bebas`, `oswald`, `anton`, `lobster`, `press start`

### External font patterns

- `@import url(...fonts.googleapis.com...)`
- `<link href="https://fonts.googleapis.com...">`
- `url(...*.woff2)`, `url(...*.ttf)`, `url(...*.otf)` (any `@font-face`)
- Any `https?://*fonts.*/` domain

## Fixes applied

### `src/core/style-presets.ts` (legacy style packs)

| Pack | Old font | New font |
|------|----------|----------|
| `BRIGHT_KIDS_PACK` | `"Comic Sans MS", "Trebuchet MS", sans-serif` | `"Trebuchet MS", "Segoe UI", Tahoma, sans-serif` |
| `CIVIC_WARM_PACK` | `Georgia, "Times New Roman", serif` | `"Segoe UI", Tahoma, Geneva, sans-serif` |
| `MINIMAL_WORKSHEET_PACK` | `"Courier New", monospace` | `"Segoe UI", Arial, Helvetica, sans-serif` |

### `src/core/mpi-design-contract/defaultDesignContract.ts`

| Contract | Field | Old | New |
|----------|-------|-----|-----|
| `DEFAULT_DESIGN_CONTRACT` | `titleSize` | 48 | 44 (within 28–44 range) |
| `DEFAULT_DESIGN_CONTRACT` | `bodyFont` | `'Segoe UI', Arial, Helvetica, sans-serif` (4 tokens) | `'Segoe UI', Arial, sans-serif` (3 tokens) |
| `MISSION_DARK_CONTRACT` | `heroFont` | `'Fredoka One', 'Trebuchet MS', cursive` | `'Trebuchet MS', 'Segoe UI', Arial, sans-serif` |
| `MISSION_DARK_CONTRACT` | `bodyFont` | `'Nunito', 'Segoe UI', sans-serif` | `'Segoe UI', Arial, sans-serif` |

### `src/core/style-packs/premium-export-profile.ts`

All 3 export profiles (`modern-clean`, `soft-classroom`, `mission-dark`) had
`bodyFont: "'Segoe UI', Arial, Helvetica, sans-serif"` (4 tokens). Trimmed to
`'Segoe UI', Arial, sans-serif` (3 tokens) for consistency with the contract.

## Tests (`src/tests/font-edu-safety-01.test.tsx` — 38 tests, 9 scopes)

| Scope | Tests | What's covered |
|-------|-------|----------------|
| 1: no external fonts | 5 | styles.css, export HTML, export-html.ts source, no `<link>` to font domains, helper purity |
| 2: no forbidden fonts | 8 | Comic Sans / Fredoka / cursive detection, clean sans-serif passes, styles.css clean, default contract clean, FORBIDDEN_FONT_KEYWORDS list |
| 3: max 2-3 font tokens | 3 | countDistinctFontFamilyTokens logic, default contract ≤3, all DESIGN_CONTRACTS ≤3 |
| 4: body not display | 3 | default bodyFont no cursive/fantasy, all contracts pass, all legacy packs pass |
| 5: title readable | 3 | titleSize in 28–44, no poster fonts, full typography audit passes |
| 6: export no external font | 4 | findExternalFontReference null, checkHtmlSourceEduSafety 0 issues, no @font-face, uses CSS variables |
| 7: picker uses inherited font | 3 | TemplatePickerDialog / Topbar / StylePackPicker don't hardcode font-family |
| 8: scene blocks use contract | 4 | scene-blocks / scene-composers / SceneRendererView / export-html use contract.typography, no hardcoded fonts |
| 9: regression | 5 | Comic Sans gone from style-presets, Courier New monospace gone, Fredoka gone from contract, cursive fallback gone, Georgia serif gone |

## Verification

- typecheck: PASS
- test: 3,411/3,411 PASS (was 3,370; +41 = 38 font-edu-safety + 3 ESM runtime guard)
- build: PASS

## Design decision: legacy pack size checks

Legacy `StylePack` typography (in `style-presets.ts`) uses a different structure
than `DesignTypography` and is used as BASES for the V1 style pack system —
their sizes are not directly rendered. The active render path goes through the
`DesignContract`, which is audited strictly (including sizes).

For legacy packs, `checkStylePackEduSafety()` only checks:
- forbidden decorative font keywords
- forbidden generic families (cursive, fantasy)
- monospace as body (discouraged)

It does NOT check sizes — the design contract is the authority on sizes.

## Out of scope (deliberately not done)

- No font subsetting / woff2 embedding (system font stacks only — Rule #8).
- No per-style-pack font variation (all packs use the same clean sans-serif
  families; mood is conveyed via color + weight, not font choice).
- No font picker UI in the editor (system font stack is the only option).
- No uppercase audit (Rule #6 is a guideline, not enforced by code — badges
  use uppercase which is allowed).
