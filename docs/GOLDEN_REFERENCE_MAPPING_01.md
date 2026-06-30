# Golden Reference Mapping 01

## Source
File: `pertemuan2-camac-norma-v3.html`
Title: Pertemuan 2 – Macam-Macam Norma | PPKn Kelas VII

Sample: `samples/ai-mpi-json/macam-norma-reference.sample.json`

## Scene Mapping

| Reference Scene ID | Reference Label | SILSE Scene Type | Renderer Status | Notes |
|-------------------|----------------|-----------------|----------------|-------|
| s-cover | Cover (judul utama) | `cover-hero` | ✅ Rendered | Kicker, heroTitle, subtitle, badges, primaryAction, visualAnchor |
| s-cp | Kurikulum Merdeka (CP/TP/ATP) | `curriculum-guide` | 📋 Contract-only | Tab CP/TP/ATP, alur tujuan pembelajaran |
| s-tp | Tujuan Pembelajaran | `objectives-path` | 📋 Contract-only | Daftar tujuan, kriteria berhasil, alur aktivitas |
| s-review | Review Pertemuan 1 | `starter-review` | 📋 Contract-only | Review materi sebelumnya, trigger question, bridge |
| s-materi | Eksplorasi (4 Norma) | `learning-scene` | ✅ Rendered | Concept header, explanation, example cards, key points |
| s-game1 | Game Sortir Norma | `classification-game` | 📋 Contract-only | Game klasifikasi kartu norma ke 4 kategori |
| s-hubungan | Materi Hubungan Antarnorma | `case-analysis` | 📋 Contract-only | Analisis kasus, diskusi kelompok, reveal explanation |
| s-game2 | Roda Norma (Quiz) | `quiz-challenge` | ✅ Rendered | Challenge header, question focus, answer cards, feedback |
| s-hasil | Hasil (skor + achievement) | `result-summary` | 📋 Contract-only | Score summary, achievement level, breakdown |
| s-refleksi | Refleksi | `reflection-journal` | 📋 Contract-only | Reflection prompts, commitment input |
| s-penutup | Penutup | `closing-award` | ✅ Rendered | Achievement, summary, reward, final action |

## Status Legend
- ✅ **Rendered**: Scene type punya renderer penuh di SceneRendererView + export-html
- 📋 **Contract-only**: Scene type terdaftar di schema/prompt/container, tetapi belum punya renderer khusus. Akan fallback ke legacy atau scene-generic jika diperlukan.
- ⚠️ **Legacy fallback**: Scene type tidak punya renderer, page dirender via SimpleProject components[]

## Rendered Scenes (5)
1. cover-hero — TextComponent + CoverSceneMetadata
2. learning-scene — CardComponent + MaterialSceneMetadata
3. game-mission — GameComponent + GameSceneMetadata
4. quiz-challenge — QuestionComponent + QuizSceneMetadata
5. closing-award — CardComponent + ClosingSceneMetadata

## Contract-Only Scenes (21 tambahan)
6. curriculum-guide
7. objectives-path
8. starter-review
9. discussion-scene
10. case-analysis
11. classification-game
12. result-summary
13. reflection-journal
14. diagnostic-check
15. remedial-practice
16. enrichment-challenge
17. worksheet-activity
18. rubric-panel
19. hotspot-map
20. timeline-story
21. matching-game
22. sequencing-game
23. branching-scenario
24. media-focus
25. glossary-cards
26. teacher-guide
27. accessibility-help

## Rencana Renderer untuk Contract-Only Scenes
Renderer untuk scene tambahan akan dibuat sesuai kebutuhan, dengan prioritas:
1. **High priority** (sering muncul di MPI): curriculum-guide, objectives-path, reflection-journal, result-summary
2. **Medium priority**: discussion-scene, case-analysis, starter-review, media-focus
3. **Game types**: classification-game, matching-game, sequencing-game, branching-scenario
4. **Specialized**: diagnostic-check, remedial-practice, enrichment-challenge, worksheet-activity, rubric-panel, hotspot-map, timeline-story, glossary-cards, teacher-guide, accessibility-help

Setiap renderer akan mengikuti pola fondasi yang sama:
`sceneMetadata → isPageSceneRenderable → buildSceneRenderPlanForPage → renderScenePlan (resolveSlotStyle) → SceneRendererView/export-html`
