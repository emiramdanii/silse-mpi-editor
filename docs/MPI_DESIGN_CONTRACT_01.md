# MPI Design Contract 01

## Status
**DONE**

## Masalah
AI tidak bisa mengontrol visual hasil render secara akurat. Style pack hanya mempercantik (shadow/radius), bukan menyusun scene. Tidak ada kontrak data visual yang AI bisa set.

## Tujuan
Menyiapkan semua bagian style/layout yang bisa dikontrol AI JSON. 16 design token categories. AI hanya boleh memilih token/preset yang tersedia. Tidak ada CSS bebas dari AI.

## 16 Design Token Categories
1. Frame (width, height, aspectRatio, safeArea, stageRadius, overflow, exportScale)
2. Palette (12 warna: primary, secondary, accent, background, surface, text, mutedText, border, success, warning, danger, gold)
3. Background (10 pattern + color/gradient/image/overlay/glow)
4. Typography (heroFont, bodyFont, sizes, weight, lineHeight, letterSpacing, uppercase, textShadow)
5. Layout/Placement (x, y, width, height, zIndex, slot, anchor, align, gap, grid)
6. Card (background, radius, padding, border, shadow, titleStyle, bodyStyle, accentStrip, iconCorner, glassEffect)
7. Button (5 variant: primary, secondary, ghost, mission, gold)
8. Badge (background, color, radius, icon, border, size, placement)
9. Image/Art Slot (src, objectFit, maskRadius, opacity, slot, decorativeArt, visualAnchor)
10. Navigation (nextButton, prevButton, menuButton, pageIndicator, progressPill, toolbarStyle)
11. Quiz (questionPanel, answerCard, choiceLetterBadge, selectedState, correctState, wrongState, feedbackBox, scoreDisplay)
12. Game (briefingPanel, targetPanel, actionCardGrid, actionCardStyle, selectedAction, correct/wrong state, feedbackPanel, rewardBadge, missionProgress)
13. Feedback (4 variant: correct, wrong, neutral, warning + icon, color, motionPreset)
14. Reward/Closing (medal, badge, ribbon, certificatePanel, completionMessage, reflectionCard)
15. Map/Hotspot (mapBackground, hotspotPosition, hotspotColor, hotspotLabel, activeState, completedState, tooltipCard)
16. Motion (6 preset: none, soft-fade, slide-up, pulse, reward-pop, correct-burst)

## Files
| File | Deskripsi |
|------|-----------|
| `src/core/mpi-design-contract/types.ts` | Type definitions untuk 16 categories |
| `src/core/mpi-design-contract/defaultDesignContract.ts` | Default contract + 3 style packs + registry |
| `src/core/mpi-design-contract/validateDesignContract.ts` | Pure validator (returns error array) |
| `src/core/mpi-design-contract/index.ts` | Public API |
| `src/tests/mpi-design-contract-01.test.ts` | 32 test guard |

## Yang TIDAK Dikerjakan
- Tidak ada CSS premium baru
- Tidak ada style pack baru (hanya 3 existing + default = 4 total)
- Tidak ada dependency baru
- Tidak ada renderer change
- Contract = data only, bukan CSS

## Verification
| Check | Result |
|-------|--------|
| typecheck | ✅ PASS |
| test | ✅ PASS — 2531/2531 |
| build | ✅ PASS |
