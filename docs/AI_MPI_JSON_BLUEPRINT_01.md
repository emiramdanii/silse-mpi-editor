# AI MPI JSON Blueprint 01

## Status
**DONE**

## Masalah
AI butuh schema JSON resmi yang boleh dihasilkan. Schema proof-of-concept sebelumnya (MPI-JSON-SCENE-PROOF-01) hanya flat (title/content/questions). Perlu schema kaya dengan scenes/slots/placements/styleIntent/designSystem.

## Yang Dibuat
| File | Deskripsi |
|------|-----------|
| `src/core/ai-mpi-json/schema.ts` | Foundation schema types (AiMpiBlueprint, AiBlueprintScene, AiBlueprintSlot, dll) |
| `src/core/ai-mpi-json/validateAiMpiJson.ts` | Pure validator, menolak JSON datar |
| `src/core/ai-mpi-json/normalizeAiMpiJson.ts` | Pure normalizer, menjaga data visual |
| `samples/ai-mpi-json/foundation-blueprint.sample.json` | Sample blueprint (5 scenes kaya) |
| `src/tests/ai-mpi-json-blueprint-01.test.ts` | 32 test guard |

## JSON Wajib Membawa
- ✅ metadata (title, subtitle, author)
- ✅ curriculum (subject, grade, phase, topic, cp, objectives)
- ✅ styleIntent (styleId, mood, intent)
- ✅ designSystem (contractId, paletteName, typographyName, overrides)
- ✅ flow (steps dengan sceneId, mode)
- ✅ scenes (id, role, sceneType, title, slots, navigation)
- ✅ scene slots (id, role, placement, designTokenKey, content)
- ✅ placements (x, y, width, height, zIndex, slot, anchor)
- ✅ assets (array)
- ✅ runtime (showProgress, showScore)
- ✅ exportConfig (format, embedAssets, includeToolbar, stageWidth, stageHeight)

## Yang TIDAK Dikerjakan
- Tidak hanya title/content/questions (bukan flat)
- Tidak drop sceneType
- Tidak drop placement
- Tidak drop style token
- Tidak drop feedback/reward

## Verification
| Check | Result |
|-------|--------|
| typecheck | ✅ PASS |
| test | ✅ PASS — 2603/2603 |
| build | ✅ PASS |
