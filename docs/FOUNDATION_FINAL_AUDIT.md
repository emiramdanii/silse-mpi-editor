# FOUNDATION FINAL AUDIT — Apa yang Perlu Dilengkapi untuk MPI Sempurna

> Tanggal: 2026-07-01
> Base: commit `b9a04b9` (BASELINE-COMPLETE-VERIFY-01)
> Status: Foundation ACCEPTED, tapi ada gap untuk "perfect MPI"

## Ringkasan Eksekutif

Foundation SILSE sudah **kuat dan stabil**:
- 27 scene type terdefinisi di taxonomy
- 13 scene type punya renderer penuh (5 rendered + 8 priority composers)
- 20 content kind terdefinisi dan di-route
- Bridge AiMpiBlueprint → SimpleProject → MpiContainer → renderScenePlan → CanvasStage/PreviewApp/export-html
- 3034 test PASS, typecheck PASS, build PASS

Tapi untuk **MPI sempurna**, ada 6 area gap yang perlu dilengkapi:

---

## Gap 1: 14 Scene Type Masih Contract-Only (Tidak Ada Renderer)

### Yang Sudah Ada (13 scene type dengan renderer):

| # | Scene Type | Renderer | React | Export |
|---|-----------|----------|-------|--------|
| 1 | cover-hero | CoverHeroContent | ✅ | ✅ |
| 2 | learning-scene | LearningMaterialContent | ✅ | ✅ |
| 3 | game-mission | GameMissionContent | ✅ | ✅ |
| 4 | quiz-challenge | QuizQuestionContent | ✅ | ✅ |
| 5 | closing-award | ClosingAwardContent | ✅ | ✅ |
| 6 | curriculum-guide | CurriculumGuideComposer | ✅ | ✅ |
| 7 | objectives-path | ObjectivesPathComposer | ✅ | ✅ |
| 8 | starter-review | StarterReviewComposer | ✅ | ✅ |
| 9 | discussion-scene | DiscussionSceneComposer | ✅ | ✅ |
| 10 | case-analysis | CaseAnalysisComposer | ✅ | ✅ |
| 11 | result-summary | ResultSummaryComposer | ✅ | ✅ |
| 12 | reflection-journal | ReflectionJournalComposer | ✅ | ✅ |
| 13 | classification-game | ClassificationGameComposer | ✅ | ✅ |

### Yang Masih Contract-Only (14 scene type — TIDAK punya renderer):

| # | Scene Type | Required Slots | Priority |
|---|-----------|----------------|----------|
| 1 | diagnostic-check | diagnosticPrompt, questionSet | Medium |
| 2 | remedial-practice | misconception, reteachExplanation | Medium |
| 3 | enrichment-challenge | challengeContext, advancedTask | Medium |
| 4 | worksheet-activity | instruction, taskSteps | Medium |
| 5 | rubric-panel | criteria, levels | Medium |
| 6 | hotspot-map | backgroundVisual, hotspots | High (visual) |
| 7 | timeline-story | events | Medium |
| 8 | matching-game | leftItems, rightItems, correctPairs | High (game) |
| 9 | sequencing-game | items, correctOrder | High (game) |
| 10 | branching-scenario | scenario, choices | Medium |
| 11 | media-focus | mediaAsset, guidingQuestion | High (media) |
| 12 | glossary-cards | terms, definitions | Low |
| 13 | teacher-guide | teacherInstruction | Low |
| 14 | accessibility-help | readingGuide | Low |

**Rekomendasi**: Tidak perlu implementasi semua 14 sekaligus. Prioritaskan:
- **High priority**: hotspot-map, matching-game, sequencing-game, media-focus (visual/game scenes yang sering dipakai MPI)
- **Medium priority**: diagnostic-check, remedial-practice, enrichment-challenge, worksheet-activity, rubric-panel, timeline-story, branching-scenario
- **Low priority**: glossary-cards, teacher-guide, accessibility-help (bisa pakai generic fallback)

---

## Gap 2: Editor Inspector Belum Bisa Edit sceneContent

### Masalah:

Bridge `aiBlueprintToSimpleProject` menghasilkan pages dengan:
- `page.sceneType` — override scene type
- `page.sceneContent` — blob data (slot content)
- `page.scenePlacement` — x/y/width/height

Tapi **Inspector.tsx tidak tahu tentang field-field ini**. Editor hanya bisa edit:
- Component geometry (x/y/width/height)
- Component text/title/body
- Page role + layoutId

Editor **tidak bisa**:
- Mengubah sceneType page
- Mengedit field sceneContent (misal: items array di classification-game, objectiveList di objectives-path)
- Mengubah scenePlacement

**Dampak**: Jika guru import AI blueprint, hasilnya bisa di-render tapi tidak bisa diedit secara visual. Guru harus edit JSON manual atau generate ulang dari AI.

**Rekomendasi**: Tambah scene content editor di Inspector yang:
- Deteksi page.sceneType
- Tampilkan form editor berdasarkan content kind (misal: items editor untuk classification-game, prompt editor untuk discussion-scene)
- Update page.sceneContent via store action

---

## Gap 3: Navigation Antarscene Belum Full di Editor/Preview

### Yang Sudah Ada:

**Export HTML**:
- Tombol prev/next/page-info/score di toolbar
- `renderPage(idx)` dengan `currentPageIdx` tracking
- Keyboard navigation (arrow keys)

**MpiSceneNavigation type**:
- `nextSceneId`, `prevSceneId`, `customButtons`

### Yang Belum Ada:

**Editor (CanvasStage)**:
- Tidak ada tombol prev/next eksplisit
- Navigasi hanya via PagePanel (klik page title di sidebar)
- Tidak ada progress indicator di canvas

**Preview (PreviewApp)**:
- Tidak ada tombol prev/next eksplisit
- Navigasi hanya via preview-store `navigateNext`/`navigatePrev` (dipanggil dari mana?)
- Tidak ada progress indicator

**Bridge**:
- `aiBlueprintToSimpleProject` tidak preserve `scene.navigation` (nextSceneId, prevSceneId, customButtons)
- Flow.steps hanya jadi page order, bukan navigation graph

**Dampak**: Guru bisa edit per-page, tapi tidak bisa "preview alur" seperti siswa akan lihat. Export HTML punya navigasi, tapi editor/preview tidak.

**Rekomendasi**:
- Tambah tombol prev/next di CanvasStage toolbar
- Tambah progress indicator (scene X dari Y) di editor/preview
- Preserve navigation di bridge
- Implementasi branching navigation (untuk branching-scenario)

---

## Gap 4: Assets/Images Belum Terintegrasi dengan Render Pipeline

### Yang Sudah Ada:

**MpiAsset type**:
- `id`, `type` (image/audio/video), `src`, `alt`, `usedBySlotId`

**ImageComponent** di SimpleProject:
- `type: 'image'`, `variant`, `src`, `alt`, `objectFit`

**Image content kind** di MpiSceneSlotContent:
- `kind: 'image'`, `src`, `alt`, `objectFit`

### Yang Belum Ada:

**Render pipeline**:
- `content.kind === 'image'` ada di SceneRendererView (line 365), tapi TIDAK ada di export-html renderSceneContent
- Export HTML tidak render image slot content — hanya text, card, button, badge, game-mission, quiz, learning-material, cover-hero, closing-award, reward, feedback

**Asset pipeline**:
- Bridge tidak preserve `blueprint.assets` ke SimpleProject (SimpleProject tidak punya assets field)
- Export HTML tidak embed assets as base64 (exportConfig.embedAssets = true tapi tidak diimplementasi)
- Sample JSON punya `assets: []` (kosong)

**Dampak**: Jika AI blueprint punya image/audio/video assets, mereka tidak akan dirender di export. Cover-hero `visualAnchor` text-only, learning-scene `visualHint` text-only.

**Rekomendasi**:
- Tambah `content.kind === 'image'` rendering di export-html renderSceneContent
- Tambah assets field di SimpleProject (atau bridge assets ke page.components sebagai ImageComponent)
- Implementasi asset embedding (base64) di export-html
- Tambah image/audio/video rendering di cover-hero visualAnchor dan learning-scene visualHint

---

## Gap 5: Runtime State (Score, Progress, Completed Scenes) Belum Sinkron

### Yang Sudah Ada:

**MpiRuntimeConfig**:
- `currentSceneId`, `score`, `completedSceneIds`, `showProgress`, `showScore`

**Export HTML**:
- `totalScore` tracking (quiz + game)
- `currentPageIdx` tracking
- Score display di toolbar

### Yang Belum Ada:

**Editor/Preview**:
- Tidak ada score tracking di CanvasStage
- Tidak ada completed scenes tracking
- Preview store punya `totalScore` tapi tidak terhubung ke scene rendering

**Cross-scene score**:
- Classification game score di React composer hanya state lokal (reset saat pindah scene)
- Quiz score di React hanya state lokal
- Tidak ada aggregate score yang persist antar scene

**Progress tracking**:
- Export HTML punya page indicator ("1 / 12"), tapi tidak ada progress bar visual
- Editor MpiProgressStrip ada, tapi hanya untuk 10 standar page, bukan 12 scene custom
- Tidak ada "completed" marker per scene

**Dampak**: Siswa bisa main game/quiz per scene, tapi skor tidak terakumulasi. Guru tidak bisa lihat progress siswa.

**Rekomendasi**:
- Tambah global score store (zustand) yang track score dari semua scene
- Tambah completed scenes tracking
- Tambah progress bar di editor/preview/export
- Persist score antar scene (localStorage atau store)

---

## Gap 6: Design Contract Token Tidak Semua Terpakai

### Token Categories yang Sudah Terpakai di renderScenePlan:

| Token | Used in resolveSlotStyle | Used in composers |
|-------|-------------------------|-------------------|
| palette | ✅ (text, surface, gold, success, danger) | ✅ |
| typography | ✅ (titleSize, titleWeight, heroFont, bodyFont) | ✅ |
| card | ✅ (background, radius, padding, border, shadow) | ✅ |
| button | ✅ (primary, secondary, gold) | ✅ |
| feedback | ✅ (correct, wrong, neutral, warning) | ✅ |
| reward | ✅ (medal) | ✅ |
| quiz | ✅ (answerCard, states, choiceBadge, questionPanel) | ✅ |
| game | ✅ (briefingPanel, targetPanel, actionCardStyle) | ✅ |
| learning | ✅ (explanationPanel, keyPointPanel, studentActionPanel) | ✅ |
| frame | ✅ (width, height, stageRadius, overflow) | ✅ |
| background | ✅ (color, gradient) | ✅ |

### Token Categories yang BELUM Terpakai:

| Token | Status | Notes |
|-------|--------|-------|
| badge | ❌ Tidak dipakai di resolveSlotStyle | Badge hanya hardcoded di SceneHeader/SceneChip |
| image | ❌ Tidak ada image rendering | Image content kind tidak dirender |
| navigation | ❌ Tidak dipakai | Navigation button style dari contract tidak consumed |
| mapHotspot | ❌ Tidak ada hotspot-map renderer | Contract ada tapi renderer tidak ada |
| motion | ❌ Tidak dipakai di render | Motion preset terdefinisi tapi tidak diimplementasi |

**Dampak**: Design contract punya token untuk image, navigation, mapHotspot, motion — tapi renderer tidak menggunakannya. Visual MPI tidak mendapat benefit dari token ini.

**Rekomendasi**:
- Implementasi image rendering (consumes contract.image token)
- Implementasi navigation button rendering (consumes contract.navigation token)
- Implementasi motion preset (consumes contract.motion token untuk animasi entrance)
- Implementasi hotspot-map renderer (consumes contract.mapHotspot token)

---

## Gap 7: Container/Element untuk Perfect MPI

### Yang Sudah Ada (15 reusable blocks):

SceneShell, SceneHeader, SceneChip, ScenePanel, SceneGrid, SceneTabs, SceneAccordion, DiscussionBanner, TimerBlock, ResponseInputBlock, RevealBlock, ScoreSummaryBlock, PortfolioBlock, ReflectionPromptBlock, ActionButtonBlock

### Container/Element yang Masih Belum Ada:

| Container | Purpose | Priority |
|-----------|---------|----------|
| **ProgressBarBlock** | Progress visual antar scene (X dari Y) | High |
| **NavigationToolbarBlock** | Tombol prev/next/home + page indicator | High |
| **ScoreBadgeBlock** | Skor aggregate yang persist antar scene | High |
| **MediaDisplayBlock** | Image/audio/video player dengan objectFit | High |
| **KeyPointCardBlock** | Card khusus untuk key point (dengan icon + accent) | Medium |
| **ExampleCardBlock** | Card khusus untuk example (dengan title + body) | Medium |
| **AchievementBadgeBlock** | Badge achievement/reward dengan medal visual | Medium |
| **HotspotMapBlock** | Peta dengan clickable hotspots | Medium |
| **TimelineBlock** | Timeline horizontal dengan events | Medium |
| **GlossaryCardBlock** | Kartu glosarium (term + definition + example) | Low |
| **RubricTableBlock** | Tabel rubrik penilaian | Low |
| **WorksheetInputBlock** | Input field worksheet (text/number/checkbox) | Low |

**Dampak**: MPI yang complete butuh container untuk progress, navigation, media, dan scene-specific elements. Tanpa ini, MPI terlihat seperti "text + card" saja.

**Rekomendasi**: Tambah container berurutan berdasarkan priority. Mulai dari ProgressBarBlock + NavigationToolbarBlock + ScoreBadgeBlock (high priority), lalu MediaDisplayBlock + KeyPointCardBlock + ExampleCardBlock (medium).

---

## Prioritas Pelengkapan untuk Perfect MPI

### Phase 1 — Core UX (High Priority, sebelum premium style):

1. **Navigation antarscene di editor/preview** — tombol prev/next + progress indicator
2. **Editor Inspector untuk sceneContent** — form editor per scene type
3. **Image rendering di export-html** — content.kind === 'image' renderer
4. **Score aggregate antar scene** — global score store yang persist

### Phase 2 — Visual Completeness (Medium Priority):

5. **4 high-priority scene renderers**: hotspot-map, matching-game, sequencing-game, media-focus
6. **ProgressBarBlock + NavigationToolbarBlock** — reusable blocks
7. **MediaDisplayBlock** — image/audio/video player
8. **Motion preset implementation** — entrance animation dari contract.motion

### Phase 3 — Scene-Specific Polish (Low Priority):

9. **7 medium-priority scene renderers**: diagnostic-check, remedial-practice, enrichment-challenge, worksheet-activity, rubric-panel, timeline-story, branching-scenario
10. **Scene-specific blocks**: KeyPointCardBlock, ExampleCardBlock, AchievementBadgeBlock
11. **3 low-priority scene renderers**: glossary-cards, teacher-guide, accessibility-help
12. **Low-priority blocks**: GlossaryCardBlock, RubricTableBlock, WorksheetInputBlock

---

## Kesimpulan

Foundation SILSE **sudah cukup kuat** untuk mulai premium style P1. Tapi untuk **MPI sempurna**, ada 7 gap utama:

1. **14 scene type contract-only** — butuh renderer untuk complete coverage
2. **Editor Inspector** — belum bisa edit sceneContent visually
3. **Navigation antarscene** — belum ada di editor/preview
4. **Assets/images** — belum terintegrasi di render pipeline
5. **Runtime state** — score/progress belum sync antar scene
6. **Design contract token** — 5 category belum consumed (badge, image, navigation, mapHotspot, motion)
7. **Container/element** — butuh 12 block baru untuk perfect MPI

**Rekomendasi**: Kerjakan Phase 1 (Core UX) dulu sebelum premium style, karena tanpa navigation/score/image, premium style hanya "catat dinding" tanpa fungsi MPI yang utuh. Setelah Phase 1, premium style P1 akan lebih bermakna karena polish visual terlihat di seluruh alur MPI, bukan hanya per-scene.
