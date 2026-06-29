# Visual Combination QA 01

Commit: `VISUAL-COMBINATION-QA-01` commit
Tanggal: 2026-06-29
Verifier: AI Dev (audit via matrix QA script + automated test guard)

## Tujuan

Uji semua kombinasi Style Pack + Layout Preset agar tidak merusak media. Pastikan guru bisa mencoba style dan layout tanpa merusak MPI. Matrix: 3 style pack × 8 layout preset (role-aware) = 24 kombinasi pada generated PPKn.

## Matrix

| Style Pack | Layout Preset | Role | Result | Notes |
|---|---|---|---|---|
| modern-clean | cover-centered | cover | OK | 0 fatal |
| modern-clean | cover-split | cover | OK | 0 fatal |
| modern-clean | material-two-column | guide | OK | 0 fatal (fixed: cards grid) |
| modern-clean | material-card-stack | guide | OK | 0 fatal (fixed: card auto-size + grid) |
| modern-clean | quiz-focus | starter | OK | 0 fatal |
| modern-clean | reflection-calm | reflection | OK | 0 fatal |
| modern-clean | mission-map | activity | OK | 0 fatal |
| modern-clean | closing-centered | closing | OK | 0 fatal |
| soft-classroom | cover-centered | cover | OK | 0 fatal |
| soft-classroom | cover-split | cover | OK | 0 fatal |
| soft-classroom | material-two-column | guide | OK | 0 fatal |
| soft-classroom | material-card-stack | guide | OK | 0 fatal |
| soft-classroom | quiz-focus | starter | OK | 0 fatal |
| soft-classroom | reflection-calm | reflection | OK | 0 fatal |
| soft-classroom | mission-map | activity | OK | 0 fatal |
| soft-classroom | closing-centered | closing | OK | 0 fatal |
| mission-dark | cover-centered | cover | OK | 0 fatal |
| mission-dark | cover-split | cover | OK | 0 fatal |
| mission-dark | material-two-column | guide | OK | 0 fatal |
| mission-dark | material-card-stack | guide | OK | 0 fatal |
| mission-dark | quiz-focus | starter | OK | 0 fatal |
| mission-dark | reflection-calm | reflection | OK | 0 fatal |
| mission-dark | mission-map | activity | OK | 0 fatal |
| mission-dark | closing-centered | closing | OK | 0 fatal |

**Total: 24/24 OK, 0 fatal, 0 crash.**

## Content Safety Proof

- **project title**: unchanged across all 24 combinations ✓
- **page count**: unchanged (10 pages) across all 24 combinations ✓
- **page order**: unchanged (titles match) across all 24 combinations ✓
- **text content**: unchanged across all 24 combinations ✓
- **objectives**: text unchanged across all 24 combinations ✓
- **quiz answer**: correctChoiceIndex unchanged across all 24 combinations ✓
- **quiz feedback**: feedbackCorrect + feedbackWrong unchanged across all 24 combinations ✓
- **stylePackId**: unchanged when layout preset applied ✓
- **layoutId**: unchanged when style pack applied ✓

## Layout Quality Proof

- **OUT_OF_CANVAS**: 0 across all 24 combinations ✓
- **LARGE_OVERLAP (fatal)**: 0 across all 24 combinations ✓
- **warnings**: 0 across all 24 combinations ✓

## Patch yang Dilakukan

### Patch 1 — Card placement fix in `apply-layout-preset.ts`

**Problem**: `material-two-column` placed ALL cards into the same `visualRight` slot, causing 100% overlap on pages with multiple cards (e.g. Menu page has 4 cards). `material-card-stack` placed cards vertically with fixed 140px height, causing 4th card to go out of canvas (y=740 > 720) and 3rd card to overlap with navigation (y=580).

**Fix** (small, targeted):
1. **Pre-count cards** on page: `totalCards = page.components.filter(c => c.type === 'card').length`.
2. **material-two-column**: cards now placed in 2×N grid in `visualRight` slot (2 columns, auto-rows). Each card: `cardW = (slot.width - 16) / 2`, `cardH = (slot.height - 16) / 2`. Prevents overlap when multiple cards.
3. **material-card-stack**: 
   - If `totalCards > 2` AND slot width > 600: use 2-column grid (`gridCardW = (width - gap) / 2`, `gridCardH` auto-fit).
   - Else: single column stack with auto-height (`cardH = min(140, (slotHeight - gaps) / totalCards)`).

**Files changed**: `src/core/layout-presets/apply-layout-preset.ts` only.

**Reason**: Without this fix, 6 of 24 combinations had fatal LARGE_OVERLAP/OUT_OF_CANVAS. Fix is small (card placement logic only), does not rewrite apply layout algorithm, does not change style resolver, does not change export engine.

### No other patches

- No style pack changes.
- No layout preset registry changes.
- No checker logic changes.
- No export engine changes.
- No schema changes.

## Tests

27 test in `src/tests/visual-combination-qa-01.test.tsx`:

- **Matrix no crash (3 test)**: modern-clean, soft-classroom, mission-dark × all presets.
- **Export produces HTML (1 test)**: all 24 combinations produce non-empty HTML.
- **Content safety (9 test)**: project title, page count, page order, text, objectives, quiz answer, quiz feedback, style doesn't change layoutId, layout doesn't change stylePackId.
- **Fatal quality per style (3 test)**: modern-clean, soft-classroom, mission-dark — 0 fatal across all presets.
- **Layout quality per preset (7 test)**: cover-centered, material-two-column, material-card-stack, quiz-focus, reflection-calm, mission-map, closing-centered — no OUT_OF_CANVAS, no fatal LARGE_OVERLAP.
- **Regression (4 test)**: PageThumbnail unchanged, export HTML differs in style when style changed, export HTML differs in geometry when layout changed, no raw ID as primary UI text.

All 27 test PASS.

## Verification

- **typecheck**: PASS
- **test**: 1932/1932 PASS (27 visual-combination-qa baru + 1905 existing)
- **build**: PASS (CSS 48.17kB sama, JS 420.28→420.80kB +0.52kB for card fix)

## Known Limitations

1. **Matrix masih berdasarkan generated PPKn sample** — hanya 1 topic diuji. Topic lain (IPA, Matematika, Bahasa) seharusnya aman karena struktur sama, tapi tidak diuji eksplisit.
2. **Belum visual screenshot diff** — QA via automated test + layout quality checker, bukan visual browser inspection.
3. **Belum browser manual proof** — verify via code + test, bukan human browser testing.
4. **Card fix only handles up to ~4 cards** — kalau ada >4 cards di satu halaman, grid 2×N bisa overflow. V1 aman untuk generated PPKn (max 4 cards di Menu page).
5. **measurement script `scripts/matrix-qa.ts` tetap ada** — legitimate script dengan header + tabel output untuk re-audit.
