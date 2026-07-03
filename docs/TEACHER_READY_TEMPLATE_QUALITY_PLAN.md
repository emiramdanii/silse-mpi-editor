# TEACHER-READY-TEMPLATE-QUALITY — Implementation Plan

## Design Decision

**Extend templates beyond 12 scenes** to include teacher-pedagogy scenes.
The golden 12-scene flow stays intact as the spine; teacher-pedagogy scenes
are added around it. The content quality guard only requires first=cover,
last=closing — more scenes = richer template, no flow violation.

## Template Designs

### Template 1 — PPKn Norma (17 scenes — FULL differentiation path)

This is the flagship template with the complete teacher-ready feature set:
teacher-guide + diagnostic + rubric + remedial + enrichment.

| # | sceneId | sceneType | role | objectiveRefs | Status |
|---|---------|-----------|------|---------------|--------|
| 1 | scene-cover | cover-hero | cover | — | existing |
| 2 | scene-teacher-guide | teacher-guide | guide | obj-1,obj-2,obj-3 | NEW |
| 3 | scene-cp | curriculum-guide | guide | — | existing |
| 4 | scene-tp | objectives-path | objectives | obj-1,obj-2,obj-3 | existing |
| 5 | scene-review | starter-review | starter | obj-1 | existing |
| 6 | scene-diagnostic | diagnostic-check | starter | obj-1,obj-2 | NEW |
| 7 | scene-materi | learning-scene | material | obj-1,obj-2,obj-3 | existing |
| 8 | scene-diskusi | discussion-scene | material | obj-3 | existing |
| 9 | scene-game1 | classification-game | activity | obj-1,obj-2 | existing |
| 10 | scene-hubungan | case-analysis | material | obj-2,obj-3 | existing |
| 11 | scene-game2 | quiz-challenge | quiz | obj-1,obj-2,obj-3 | existing |
| 12 | scene-rubrik | rubric-panel | material | obj-1,obj-2,obj-3 | NEW |
| 13 | scene-remedial | remedial-practice | material | obj-1,obj-2 | NEW |
| 14 | scene-enrichment | enrichment-challenge | activity | obj-3 | NEW |
| 15 | scene-hasil | result-summary | material | — | existing |
| 16 | scene-refleksi | reflection-journal | reflection | obj-1,obj-2,obj-3 | existing |
| 17 | scene-penutup | closing-award | closing | — | existing |

### Template 2 — IPA Tata Surya (14 scenes — teacher-guide + game variety)

| # | sceneId | sceneType | role | objectiveRefs | Status |
|---|---------|-----------|------|---------------|--------|
| 1 | scene-cover | cover-hero | cover | — | existing |
| 2 | scene-teacher-guide | teacher-guide | guide | obj-1,obj-2 | NEW |
| 3 | scene-cp | curriculum-guide | guide | — | existing |
| 4 | scene-tp | objectives-path | objectives | obj-1,obj-2 | existing |
| 5 | scene-review | starter-review | starter | obj-1 | existing |
| 6 | scene-materi | learning-scene | material | obj-1,obj-2 | existing |
| 7 | scene-diskusi | discussion-scene | material | obj-2 | existing |
| 8 | scene-game1 | matching-game | activity | obj-1,obj-2 | CHANGED (was classification-game) |
| 9 | scene-hubungan | case-analysis | material | obj-2 | existing |
| 10 | scene-game2 | quiz-challenge | quiz | obj-1,obj-2 | existing |
| 11 | scene-rubrik | rubric-panel | material | obj-1,obj-2 | NEW |
| 12 | scene-hasil | result-summary | material | — | existing |
| 13 | scene-refleksi | reflection-journal | reflection | obj-1,obj-2 | existing |
| 14 | scene-penutup | closing-award | closing | — | existing |

### Template 3 — Matematika Bilangan Bulat (14 scenes — teacher-guide + rubric)

| # | sceneId | sceneType | role | objectiveRefs | Status |
|---|---------|-----------|------|---------------|--------|
| 1 | scene-cover | cover-hero | cover | — | existing |
| 2 | scene-teacher-guide | teacher-guide | guide | obj-1,obj-2 | NEW |
| 3 | scene-cp | curriculum-guide | guide | — | existing |
| 4 | scene-tp | objectives-path | objectives | obj-1,obj-2 | existing |
| 5 | scene-review | starter-review | starter | obj-1 | existing |
| 6 | scene-materi | learning-scene | material | obj-1,obj-2 | existing |
| 7 | scene-diskusi | discussion-scene | material | obj-2 | existing |
| 8 | scene-game1 | sequencing-game | activity | obj-2 | existing |
| 9 | scene-hubungan | case-analysis | material | obj-2 | existing |
| 10 | scene-game2 | quiz-challenge | quiz | obj-1,obj-2 | existing |
| 11 | scene-rubrik | rubric-panel | material | obj-1,obj-2 | NEW |
| 12 | scene-hasil | result-summary | material | — | existing |
| 13 | scene-refleksi | reflection-journal | reflection | obj-1,obj-2 | existing |
| 14 | scene-penutup | closing-award | closing | — | existing |

## Content for NEW scenes

### teacher-guide (all 3 templates)
- title: "Panduan Guru"
- teacherInstruction: concrete teaching steps (<= 300 chars)
- facilitationTips: 3-4 practical tips (each <= 100 chars)
- timeAllocation: "45 menit" format (<= 40 chars)
- assessmentNotes: how to assess (<= 200 chars)

### diagnostic-check (PPKn only)
- diagnosticPrompt: "Sebelum mulai, cek pemahaman awal kamu tentang norma!" (<= 160 chars)
- questionSet: 3 questions, each with 3 choices (prompt <= 120 chars, choice <= 60 chars)
- recommendation: what to do based on score (<= 200 chars)
- readinessLevels: 3 levels (siap, perlu pendalaman, perlu remedial)

### rubric-panel (all 3 templates)
- criteria: 3 criteria (name <= 40 chars, description <= 100 chars)
- levels: 4 levels (nama <= 20 chars, descriptor <= 80 chars)
  - Level 1: "Perlu Bimbingan" (score 50)
  - Level 2: "Berkembang" (score 70)
  - Level 3: "Kompeten" (score 85)
  - Level 4: "Mahir" (score 100)
- scoreGuide: how to use the rubric (<= 150 chars)

### remedial-practice (PPKn only)
- misconception: common student misconception (<= 160 chars)
- reteachExplanation: simplified re-explanation (<= 300 chars)
- guidedPractice: 2 practice questions with hints (prompt <= 120 chars)
- retryQuestion: a retry prompt (<= 120 chars)

### enrichment-challenge (PPKn only)
- challengeContext: real-world extension context (<= 200 chars)
- advancedTask: the advanced task (<= 200 chars)
- responseInput: placeholder for student response
- rubricPreview: 2-3 preview criteria (criterion <= 60 chars, descriptor <= 80 chars)
- completionMessage: (<= 120 chars)

### matching-game (IPA — replaces classification-game)
- instruction: "Cocokkan planet dengan karakteristiknya!" (<= 140 chars)
- leftItems: 4 planets (Merkurius, Venus, Bumi, Mars) — labels <= 40 chars
- rightItems: 4 characteristics — labels <= 40 chars
- correctPairs: 4 pairs
- completionMessage: (<= 120 chars)

## Density Guard Extensions

New limits for 7 content kinds:

| Content kind | Field | Limit |
|--------------|-------|-------|
| teacher-guide | teacherInstruction | <= 300 chars |
| teacher-guide | facilitationTips | max 4, each <= 100 chars |
| teacher-guide | timeAllocation | <= 40 chars |
| teacher-guide | assessmentNotes | <= 200 chars |
| rubric-panel | criteria | max 4, each name <= 40, description <= 100 |
| rubric-panel | levels | max 4, each name <= 20, descriptor <= 80 |
| rubric-panel | scoreGuide | <= 150 chars |
| diagnostic-check | diagnosticPrompt | <= 160 chars |
| diagnostic-check | questionSet | max 4, each prompt <= 120, choice <= 60 |
| diagnostic-check | recommendation | <= 200 chars |
| remedial-practice | misconception | <= 160 chars |
| remedial-practice | reteachExplanation | <= 300 chars |
| remedial-practice | guidedPractice | max 3, each prompt <= 120, choice <= 60 |
| remedial-practice | retryQuestion | <= 120 chars |
| enrichment-challenge | challengeContext | <= 200 chars |
| enrichment-challenge | advancedTask | <= 200 chars |
| enrichment-challenge | rubricPreview | max 3, each <= 80 chars |
| enrichment-challenge | completionMessage | <= 120 chars |
| matching-game | instruction | <= 140 chars |
| matching-game | leftItems | max 6, each label <= 40 chars |
| matching-game | rightItems | max 6, each label <= 40 chars |
| hotspot-map | guidingQuestion | <= 140 chars |
| hotspot-map | hotspots | max 6, each info <= 100 chars |
| hotspot-map | caption | <= 100 chars |

## Objective Coverage Helper

New function: `checkTemplateObjectiveCoverage(template)`
- Verifies every objective in `template.objectives` is referenced by at least 1 scene's `objectiveRefs`
- Verifies every non-cover/closing scene has at least 1 `objectiveRefs` entry
- Returns issues array (empty = all objectives covered)

## Existing Tests to Update

| Test file | Test # | Current assertion | New assertion |
|-----------|--------|-------------------|---------------|
| template-pedagogis-ready-02-patch-b.test.tsx | 17 | "all 3 templates produce exactly 12 scenes" | PPKn=17, IPA=14, MTK=14 |
| template-pedagogis-ready-02-patch-b.test.tsx | 18 | "every scene has a sceneType" | unchanged (still passes) |
| template-pedagogis-ready-01.test.tsx | (check during impl) | may assert 12 scenes | update if needed |

## New Test File

`src/tests/teacher-ready-template-quality-01.test.tsx` — estimated 30+ tests:

### Scope A — Scene structure (6 tests)
1. PPKn has 17 scenes
2. IPA has 14 scenes
3. MTK has 14 scenes
4. All 3 templates have teacher-guide scene
5. PPKn has diagnostic-check + remedial-practice + enrichment-challenge
6. All 3 templates have rubric-panel scene

### Scope B — Game variety (3 tests)
7. IPA uses matching-game (not classification-game)
8. PPKn still uses classification-game
9. MTK still uses sequencing-game

### Scope C — Objective coverage (5 tests)
10. All 3 templates have objectiveRefs on non-cover/closing scenes
11. PPKn: every objective is covered by >= 1 scene
12. IPA: every objective is covered by >= 1 scene
13. MTK: every objective is covered by >= 1 scene
14. checkTemplateObjectiveCoverage returns 0 issues for all 3

### Scope D — Density guard for new content kinds (8 tests)
15. teacher-guide density: teacherInstruction <= 300, facilitationTips max 4
16. rubric-panel density: criteria max 4, levels max 4
17. diagnostic-check density: questionSet max 4, prompt <= 120
18. remedial-practice density: guidedPractice max 3, reteachExplanation <= 300
19. enrichment-challenge density: rubricPreview max 3, advancedTask <= 200
20. matching-game density: leftItems max 6, label <= 40
21. checkAllTemplatesDensity returns 0 issues for all 3 (with new limits)
22. checkTemplateDensity catches violations in a bad template

### Scope E — Content quality (4 tests)
23. All 3 templates pass checkBlueprintContentQuality (0 errors)
24. All 3 templates pass validateAiMpiJson (0 errors)
25. All 3 templates produce SimpleProject with sceneType on every page
26. PPKn remedial-practice reteachExplanation is non-empty

### Scope F — Export parity (4 tests)
27. All 3 templates export as standalone HTML
28. Export HTML contains teacher-guide rendered content
29. Export HTML contains rubric-panel rendered content
30. Export HTML contains matching-game rendered content (IPA)

### Scope G — Font safety regression (2 tests)
31. All template scenes pass font-edu-safety (no forbidden fonts in content)
32. Export HTML for all 3 templates has no external font references

## Out of scope (deliberately)
- No new scene types (all 7 target types already have renderers)
- No schema changes (objectiveRefs is template-level, not in AiBlueprintSlotContent)
- No ListFieldEditor additions for diagnostic/remedial/enrichment (separate milestone)
- No learning-goal-alignment.ts rewrite (separate milestone)
- No new dependencies
