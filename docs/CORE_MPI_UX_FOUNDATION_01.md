# CORE-MPI-UX-FOUNDATION-01

> Status: **READY FOR SENIOR REVIEW**
> Tanggal: 2026-07-01

## Tujuan

Menambahkan core UX yang hilang agar MPI terasa sebagai app pembelajaran utuh:
navigation antarscene, runtime progress + aggregate score, image/asset rendering,
dan SceneContent Inspector V1. Bukan premium style — ini foundation UX.

---

## 1. Navigation Model

### Yang Ditambahkan:

- **NavigationToolbarBlock** — reusable block dengan tombol Previous/Next, scene title, progress text (X/Y).
- **ProgressBarBlock** — reusable block dengan visual progress bar (percentage fill).
- **CanvasStage** — navigation toolbar muncul saat page scene-renderable.
- **PreviewApp** — navigation toolbar + progress bar muncul saat scene-renderable.
- **Export HTML** — sudah punya prev/next/page-info/score di toolbar (existing).

### Navigation Flow:

```
SimpleProject.pages → currentPageId → find index → navigateNext/navigatePrev
                                                      ↓
                                               store update currentPageId
                                                      ↓
                                               CanvasStage/PreviewApp re-render
```

### State:

- `useEditorStore.navigateNext()` — pindah ke page berikutnya
- `useEditorStore.navigatePrev()` — pindah ke page sebelumnya
- `usePreviewStore.navigateNext/navigatePrev` — sudah ada (existing)

---

## 2. Runtime Progress + Score Model

### Yang Ditambahkan:

- `useEditorStore.completedSceneIds: string[]` — scene yang sudah selesai
- `useEditorStore.perSceneScore: Record<string, number>` — score per scene
- `useEditorStore.aggregateScore: number` — total score semua scene
- `useEditorStore.markSceneCompleted(sceneId)` — tandai scene selesai
- `useEditorStore.addSceneScore(sceneId, points)` — tambah score per scene
- `useEditorStore.getCurrentSceneIndex()` — index scene saat ini
- `useEditorStore.getProgressPercent()` — persen progress

### Export HTML Runtime (existing):

- `totalScore` tracking (quiz + game)
- `currentPageIdx` tracking
- Score display di toolbar

---

## 3. Image/Assets Support

### Yang Ditambahkan:

- **MediaDisplayBlock** — reusable block untuk image rendering dengan fallback aman.
- **Export HTML** — `content.kind === 'image'` renderer (createElement('img') + fallback).
- **Bridge** — `aiBlueprintToSimpleProject` preserve `blueprint.assets` ke `project.assets`.
- **SimpleProject** — tambah `assets?` field.

### Rendering Pipeline:

```
blueprint.assets → SimpleProject.assets → (referenced by slot content via src URL)
                                              ↓
                                    content.kind === 'image'
                                              ↓
                                    React: MediaDisplayBlock
                                    Export: createElement('img')
```

### Fallback:

- Jika `src` kosong → tampilkan "📷 Media tidak tersedia" placeholder.

---

## 4. SceneContent Inspector V1

### Yang Ditambahkan:

- **SceneContentEditor** — komponen editor di Inspector panel.
- Mendeteksi `page.sceneType` dan menampilkan field penting dari `page.sceneContent`.
- V1: hanya text field umum (title, prompt, instruction, explanation, dll).
- Add/remove untuk list field ditunda ke V2.

### Field per SceneType (12 scene golden reference):

| Scene Type | Editable Fields |
|-----------|-----------------|
| cover-hero | heroTitle, heroSubtitle, kicker, visualAnchor |
| curriculum-guide | curriculumTitle, competency, learningFlow |
| objectives-path | successCriteria |
| starter-review | priorLearning, triggerQuestion, bridgeToNewTopic, discussionPrompt |
| learning-scene | conceptTitle, conceptSubtitle, explanation, studentAction, visualHint |
| discussion-scene | discussionPrompt, groupInstruction, responseInput |
| classification-game | instruction, completionMessage |
| case-analysis | caseText, analysisPrompt, revealExplanation, discussionPrompt |
| quiz-challenge | prompt, feedbackCorrect, feedbackWrong |
| result-summary | achievementLevel |
| reflection-journal | commitmentInput, nextTask |
| closing-award | achievement, summary, reflectionPrompt, rewardLabel, nextLearning |

### Update Flow:

```
Inspector edit field → updateSceneContent(pageId, patch) → store update page.sceneContent
                                                              ↓
                                          CanvasStage/PreviewApp re-render (via buildSceneRenderPlanForPage)
                                                              ↓
                                          export-html ikut update (via exportProjectToHtml)
```

---

## 5. Batasan yang Belum Dikerjakan

1. **List field editor (add/remove items)** — V1 hanya edit text field. Add/remove untuk items array (classification-game, objectives-path, dll) ditunda ke V2.
2. **Asset manager** — hanya inline URL/base64/local reference. Tidak ada upload/manager UI.
3. **Score sync antar React dan export** — React store dan export HTML punya runtime terpisah. Score tidak ter-sync real-time antara editor/preview dan export.
4. **Progress bar di export HTML** — export sudah punya page indicator, tapi belum punya visual progress bar (ProgressBarBlock hanya di React).
5. **14 scene type contract-only** — masih belum punya renderer (lihat FOUNDATION_FINAL_AUDIT.md).
6. **Motion preset** — contract.motion terdefinisi tapi belum diimplementasi.

---

## 6. Syarat Lanjut ke High-Priority Renderers / Premium Style

Core MPI UX Foundation ini dinyatakan **lulus** jika:

1. `npm run typecheck` → PASS
2. `npm run test` → semua PASS (3056/3056)
3. `npm run build` → PASS
4. Navigation toolbar muncul di CanvasStage + PreviewApp + export untuk 12 scene bridge project.
5. Runtime aggregate score + completed scene state berfungsi.
6. Image rendering ada di React + export.
7. Bridge preserve assets.
8. SceneContent Inspector muncul untuk 12 scene type.
9. Editing sceneContent mengupdate CanvasStage + export.
10. Legacy project tetap aman.

Jika lulus, lanjut ke:
- **High-priority renderers** (hotspot-map, matching-game, sequencing-game, media-focus)
- **Premium style P1** (visual polish via existing contract)

---

## Lampiran: Test Suite

File: `src/tests/core-mpi-ux-foundation-01.test.tsx`

Total: **19 test** terbagi 5 scope:

| Scope | Test count | Fokus |
|-------|------------|-------|
| A | 7 | Navigation toolbar (CanvasStage + PreviewApp + export + next/prev + progress + disabled) |
| B | 3 | Runtime state (aggregate score + completed scene + per scene score) |
| C | 4 | Image/assets (React render + export render + bridge assets + fallback) |
| D | 3 | SceneContent Inspector (muncul + edit + export update) |
| E | 2 | Regression (legacy safe + existing tests pass) |

Verifikasi:
```
npm run typecheck  → PASS
npm run test       → 3056/3056 PASS
npm run build      → PASS (CSS 69.18 kB, JS 622.31 kB)
```
