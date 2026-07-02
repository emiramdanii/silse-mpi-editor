# TEMPLATE-PEDAGOGIS-READY-01

> Status: **READY FOR SENIOR REVIEW**
> Tanggal: 2026-07-01

## Tujuan

Template alur pedagogis siap pakai supaya guru tidak perlu menyusun 12 scene dari nol. Guru pilih template → dapat MPI utuh dengan sceneType + sceneContent yang valid.

---

## 1. Template Registry

3 template siap pakai:

| Template | Mapel | Topic | Game Type |
|----------|-------|-------|-----------|
| PPKn — Macam-Macam Norma | PPKn | 4 jenis norma | classification-game |
| IPA — Sistem Tata Surya | IPA | 8 planet tata surya | classification-game |
| Matematika — Bilangan Bulat | Matematika | Bilangan positif/negatif | sequencing-game |

API:
```typescript
PEDAGOGICAL_TEMPLATES: readonly PedagogicalTemplate[]
getTemplatesByMapel(mapel: string): PedagogicalTemplate[]
getUniqueTemplateMapelList(): string[]
templateToBlueprint(template: PedagogicalTemplate): AiMpiBlueprint
```

---

## 2. Alur Template

```
Guru pilih template
  → templateToBlueprint() → AiMpiBlueprint (12 scenes)
  → validateAiMpiJson() → 0 errors
  → normalizeBlueprint() → AiMpiBlueprint (normalized)
  → aiBlueprintToSimpleProject() → SimpleProject (12 pages with sceneType)
  → checkBlueprintContentQuality() → 0 errors
  → CanvasStage / PreviewApp / export-html
```

---

## 3. Pedagogical Flow (12 scenes)

Setiap template mengikuti alur golden reference:
1. Cover (cover-hero)
2. Kurikulum (curriculum-guide)
3. Tujuan (objectives-path)
4. Review (starter-review)
5. Materi (learning-scene)
6. Diskusi (discussion-scene)
7. Game (classification-game atau sequencing-game)
8. Analisis (case-analysis)
9. Quiz (quiz-challenge)
10. Hasil (result-summary)
11. Refleksi (reflection-journal)
12. Penutup (closing-award)

---

## 4. Test Suite

File: `src/tests/template-pedagogis-ready-01.test.tsx` — 13 tests.

| Scope | Tests | Fokus |
|-------|-------|-------|
| Registry | 3 | 3 templates, byMapel, uniqueMapel |
| Blueprint | 4 | Valid, all 3 valid, 12 scenes, curriculum preserved |
| Content Quality | 1 | All 3 pass content quality |
| Render + Export | 3 | 12 scenes render, export HTML, 12 pages via bridge |
| Pedagogical Flow | 2 | First=cover, last=closing, has material/activity/quiz/reflection |

Verifikasi: typecheck PASS, test 3276/3276 PASS, build PASS.
