# APP AI Prompt Contract 01

## Status
**DONE**

## Masalah
AI tidak boleh menebak kemampuan app. App yang memberi kontrak ke AI: sceneType, slot, style token, layout format, variants, prohibitions, output rules.

## Yang Dibuat
| File | Deskripsi |
|------|-----------|
| `src/core/ai-prompt-contract/promptContractTypes.ts` | Type definitions |
| `src/core/ai-prompt-contract/buildMpiPromptContract.ts` | Pure builder + prompt text generator |
| `src/core/ai-prompt-contract/index.ts` | Public API |
| `src/tests/app-ai-prompt-contract-01.test.ts` | 22 test guard |

## Prompt Internal Wajib Menyebut
1. ✅ Output wajib JSON
2. ✅ Jangan buat HTML
3. ✅ Jangan buat CSS mentah
4. ✅ Gunakan frame 1280x720
5. ✅ Gunakan sceneType yang tersedia (10 scene types)
6. ✅ Setiap scene wajib punya slots (requiredSlots per scene)
7. ✅ Setiap elemen visual wajib punya placement
8. ✅ Gunakan designSystem token (palette, background, motion, feedback, toolbarStyle)
9. ✅ Gunakan allowed variants untuk card/button/badge/text
10. ✅ Jangan membuat field di luar schema

## Verification
| Check | Result |
|-------|--------|
| typecheck | ✅ PASS |
| test | ✅ PASS — 2562/2562 |
| build | ✅ PASS |
