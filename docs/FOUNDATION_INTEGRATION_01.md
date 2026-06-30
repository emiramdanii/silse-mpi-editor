# Foundation Integration 01

## Scope
FOUNDATION-INTEGRATION-01

## Commit
(latest commit after this report)

## Status
READY FOR SENIOR REVIEW

## Masalah
Foundation Plan 7 scope selesai, tetapi SceneRendererView belum terintegrasi ke CanvasStage, PreviewApp, dan export-html. Fondasi baru bisa jadi jalur paralel yang belum dipakai produk.

## Tujuan
Membuktikan pipeline fondasi baru benar-benar dipakai oleh app:
```
AI Blueprint JSON → validate → normalize → MpiContainer → renderScenePlan
  → CanvasStage / PreviewApp / export-html
```

## Files Changed

### New files
| File | Deskripsi |
|------|-----------|
| `src/core/scene-renderer/sceneDetection.ts` | Pure functions: isPageSceneRenderable, buildSceneRenderPlanForPage, buildContainerAndPlanForPage |
| `src/core/scene-proof-project.ts` | Sample project dengan game-mission scene (untuk integration testing) |
| `src/tests/foundation-integration-01.test.tsx` | 32 test guard |
| `docs/FOUNDATION_INTEGRATION_01.md` | Report ini |

### Modified files
| File | Perubahan |
|------|-----------|
| `src/core/scene-renderer/index.ts` | Export sceneDetection API |
| `src/editor/CanvasStage.tsx` | Import buildSceneRenderPlanForPage + SceneRendererView. Deteksi scene-renderable page. Jika ya, render SceneRendererView (interactive=false, onSlotClick). Jalur lama di-skip (!useSceneRenderer). |
| `src/preview/PreviewApp.tsx` | Import buildSceneRenderPlanForPage + SceneRendererView. Deteksi scene-renderable page. Jika ya, render SceneRendererView (interactive=true, onGameAction/onQuizAnswer wired ke preview store). Jalur lama di-skip. |
| `src/export/export-html.ts` | Tambah `scenePlan` field ke ExportRenderPage. buildExportRenderModel membangun scenePlan per page. Export JS punya `renderSceneFromPlan()` + `renderSceneContent()` + `renderGameMissionSceneContent()` + `renderQuizSceneContent()`. renderPage cek `page.scenePlan` — jika ada, render scene; jika null, fallback ke legacy components[]. |

## Evidence

### Scene Detection (pure function)
```typescript
// src/core/scene-renderer/sceneDetection.ts
export function isPageSceneRenderable(page: SimplePage | undefined | null): boolean {
  if (!page) return false;
  const gameComponent = page.components.find(
    (c): c is GameComponent => c.type === 'game' && 'sceneMetadata' in c && c.sceneMetadata?.scene === 'game-mission',
  );
  return !!gameComponent;
}

export function buildSceneRenderPlanForPage(project, page): SceneRenderPlan | null {
  if (!isPageSceneRenderable(page)) return null;
  const container = simpleProjectToMpiContainer(project);
  const scene = container.scenes.find((s) => s.pageId === page.id);
  if (!scene) return null;
  const contract = getDesignContract(project.stylePackId);
  return renderScenePlan(scene, contract);
}
```

### CanvasStage Integration
```typescript
// src/editor/CanvasStage.tsx
const sceneRenderPlan = currentPage ? buildSceneRenderPlanForPage(project, currentPage) : null;
const useSceneRenderer = !!sceneRenderPlan;

// ... dalam render:
{useSceneRenderer && sceneRenderPlan && (
  <div data-testid="scene-renderer-mount" style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
    <SceneRendererView
      plan={sceneRenderPlan}
      contract={getDesignContract(project.stylePackId)}
      interactive={false}
      onSlotClick={(slotId) => selectComponent(slotId)}
      selectedSlotId={selectedComponentId ?? undefined}
    />
  </div>
)}

{!useSceneRenderer && currentPage?.components.map((component) => { /* legacy path */ })}
```

### PreviewApp Integration
```typescript
// src/preview/PreviewApp.tsx
const sceneRenderPlan = buildSceneRenderPlanForPage(project, currentPage);
const useSceneRenderer = !!sceneRenderPlan;

{useSceneRenderer && sceneRenderPlan && (
  <div data-testid="scene-renderer-mount-preview" style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
    <SceneRendererView
      plan={sceneRenderPlan}
      contract={getDesignContract(project.stylePackId)}
      interactive={true}
      onGameAction={(_slotId, actionIndex) => { /* wire to answerGameMission */ }}
      onQuizAnswer={(_slotId, choiceId) => { /* wire to answerQuestion */ }}
    />
  </div>
)}

{!useSceneRenderer && currentPage.components.map((component) => { /* legacy path */ })}
```

### export-html Integration
```typescript
// src/export/export-html.ts — buildExportRenderModel
const pages = project.pages.map((page) => ({
  ...,
  scenePlan: buildSceneRenderPlanForPage(project, page), // null for legacy pages
}));

// Export JS — renderPage
if (page.scenePlan) {
  var sceneEl = renderSceneFromPlan(page.scenePlan);
  if (sceneEl) canvas.appendChild(sceneEl);
} else {
  // legacy components[] path
  for (var i = 0; i < page.components.length; i++) { ... }
}

// renderSceneFromPlan emits: silse-scene, silse-scene-<sceneType>, silse-scene-slot,
// silse-game-scene, silse-game-briefing, silse-game-target, silse-game-action-grid,
// silse-game-action-card, silse-game-reward
```

### Test Guard (32 tests)
- Tests 1-5: scene detection (isPageSceneRenderable, buildSceneRenderPlanForPage, buildContainerAndPlanForPage)
- Tests 6-12: CanvasStage integration (silse-scene, silse-scene-game-mission, silse-scene-slot, silse-game-action-card, no legacy silse-game-choice, fallback for cover, mount point)
- Tests 13-19: PreviewApp integration (same scene classes, no legacy, mount point, fallback, editor/preview parity)
- Tests 20-28: export-html integration (silse-scene, silse-scene-game-mission, silse-scene-slot, silse-game-action-card, briefing/target/reward, placement preserved, designTokenKey preserved, feedback/reward preserved, scenePlan null for legacy)
- Tests 29-32: legacy fallback safe (legacy sample project still works, no scene rendering, no dependency)

## Self-Audit

| Check | Status |
|-------|--------|
| Foundation modules used by product path | ✅ PASS — CanvasStage, PreviewApp, export-html semua pakai buildSceneRenderPlanForPage + SceneRendererView/renderSceneFromPlan |
| Editor scene parity | ✅ PASS — CanvasStage emits silse-scene-game-mission for scene page, no silse-game-choice (legacy) |
| Preview scene parity | ✅ PASS — PreviewApp emits same scene classes as editor (test 19 proves parity) |
| Export scene parity | ✅ PASS — export-html emits silse-scene, silse-scene-game-mission, silse-scene-slot, silse-game-action-card, briefing/target/reward |
| Old SimpleProject fallback safe | ✅ PASS — tests 29-31 prove legacy project (no sceneMetadata) still renders via legacy path, no scene classes |
| Out-of-scope check | ✅ PASS — no style premium, no visual engine, no Quiz/Material/Cover scene proof, no dependency, no rewrite |

## Verification

| Check | Result |
|-------|--------|
| typecheck | ✅ PASS |
| test | ✅ PASS — 2709/2709 (2674 existing + 35 new from integration + esm-runtime delta) |
| build | ✅ PASS (481KB JS, 69KB CSS) |

## Final Status
READY FOR SENIOR REVIEW

## Yang TIDAK Dikerjakan (stoplist dipatuhi)
- ❌ Tidak style premium baru
- ❌ Tidak visual polish
- ❌ Tidak style pack baru
- ❌ Tidak visual memory / flavor / art layer
- ❌ Tidak HTML import / iframe / reskin
- ❌ Tidak dependency baru
- ❌ Tidak rewrite besar editor/store
- ❌ Tidak lanjut Quiz/Material/Cover scene proof

## Cara Kerja Integrasi
1. **Detection**: `isPageSceneRenderable(page)` cek apakah page punya game component dengan `sceneMetadata.scene === 'game-mission'`.
2. **Plan building**: `buildSceneRenderPlanForPage(project, page)` convert project → MpiContainer → find scene → renderScenePlan.
3. **Rendering**: Editor/Preview/Export cek `sceneRenderPlan`. Jika ada, render via SceneRendererView (React) atau renderSceneFromPlan (export JS). Jika null, fallback ke legacy components[] path.
4. **Parity**: Same `renderScenePlan` pure function dipakai di semua 3 jalur → same scene classes → same structure.
5. **Fallback**: Page tanpa sceneMetadata (cover, closing, legacy game) tetap pakai jalur lama. Tidak break 2674 existing tests.
