# CONTENT-QUALITY-GUARD-01

> Status: **READY FOR SENIOR REVIEW**
> Tanggal: 2026-07-01

## Tujuan

Memastikan isi MPI tidak kosong, tidak salah struktur, dan punya alur pedagogis minimum.

---

## 1. Content Completeness Guard

Setiap scene type punya field wajib yang dicek tidak kosong:

| Scene Type | Required Fields |
|-----------|----------------|
| cover-hero | heroTitle |
| curriculum-guide | curriculumTitle, competency |
| objectives-path | objectiveList (array, >0) |
| starter-review | priorLearning |
| learning-scene | conceptTitle, explanation |
| discussion-scene | discussionPrompt |
| classification-game | items (array, >0), categories (array, >0) |
| case-analysis | caseText, analysisPrompt |
| quiz-challenge | prompt, choices (array, >=2), correctChoiceId |
| result-summary | scoreSummary (object) |
| reflection-journal | reflectionPrompts (array, >0) |
| closing-award | achievement |
| hotspot-map | hotspots (array, >0) |
| matching-game | leftItems, rightItems, correctPairs (all arrays, >0) |
| sequencing-game | items, correctOrder (both arrays, >0) |
| media-focus | guidingQuestion |
| diagnostic-check | questionSet (array, >0) |
| remedial-practice | reteachExplanation |
| enrichment-challenge | advancedTask |
| worksheet-activity | taskSteps (array, >0) |
| rubric-panel | criteria (array, >0) |
| timeline-story | events (array, >0) |
| branching-scenario | scenarioPrompt, choices (array, >0) |
| glossary-cards | terms (array, >0) |
| teacher-guide | teacherInstruction |
| accessibility-help | readingGuide |
| game-mission | briefing, missionTarget |

---

## 2. Pedagogical Flow Guard

| Check | Severity |
|-------|----------|
| First scene must be cover | error |
| Last scene must be closing | error |
| At least one material page | warning |
| At least one activity/quiz | warning |
| At least one reflection page | warning |

---

## 3. Scene-Specific Validation

| Check | Description |
|-------|-------------|
| quiz correctChoiceId | Must exist in choices array |
| matching correctPairs | leftId must exist in leftItems, rightId must exist in rightItems |
| sequencing correctOrder | Each ID must exist in items |

---

## 4. API

```typescript
// Check SimpleProject
checkContentQuality(project: SimpleProject): ContentQualityResult

// Check AiMpiBlueprint (converts first)
checkBlueprintContentQuality(blueprint: AiMpiBlueprint): ContentQualityResult

// Result
type ContentQualityResult = {
  pass: boolean;  // true if no errors
  errors: ContentQualityIssue[];  // blocking issues
  warnings: ContentQualityIssue[];  // non-blocking suggestions
};
```

---

## 5. Test Suite

File: `src/tests/content-quality-guard-01.test.tsx` — 18 tests.

| Scope | Tests | Fokus |
|-------|-------|-------|
| A | 6 | Content completeness (golden ref pass, empty fail, missing fields) |
| B | 5 | Pedagogical flow (cover first, closing last, material/activity/reflection warnings) |
| C | 4 | Scene-specific (invalid quiz choice, invalid pair, invalid order, legacy safe) |
| D | 1 | Blueprint quality check |
| E | 2 | Regression (12 golden, legacy safe) |

Verifikasi: typecheck PASS, test 3246/3246 PASS, build PASS.
