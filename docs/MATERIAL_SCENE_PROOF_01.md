# Material Scene Proof 01

## Scope
MATERIAL-SCENE-PROOF-01

## Commit
(latest commit after this report)

## Status
READY FOR SENIOR REVIEW

## Masalah
Materi masih dirender sebagai card teks biasa (judul + paragraf). Perlu diubah menjadi learning scene yang pakai fondasi sama.

## Tujuan
Materi dirender sebagai learning scene: concept header → explanation panel → example cards → key point → student action → visual hint. Pakai fondasi sama dengan game-mission dan quiz-challenge.

## Files Changed

### New files
| File | Deskripsi |
|------|-----------|
| `samples/ai-mpi-json/material-learning-scene-proof.sample.json` | Sample learning-scene dengan placement spesifik (x:72, y:120) |
| `src/tests/material-scene-proof-01.test.tsx` | 25 test guard |
| `docs/MATERIAL_SCENE_PROOF_01.md` | Report ini |

### Modified files
| File | Perubahan |
|------|-----------|
| `src/core/types.ts` | Tambah `MaterialSceneMetadata` type + `sceneMetadata?` field di CardComponent |
| `src/core/mpi-container/types.ts` | Tambah content kind `learning-material` ke MpiSceneSlotContent |
| `src/core/scene-renderer/sceneDetection.ts` | `isPageSceneRenderable` deteksi learning-scene (CardComponent dengan sceneMetadata) |
| `src/core/mpi-container/simpleProjectToMpiContainer.ts` | CardComponent dengan sceneMetadata → learning-material slot |
| `src/core/scene-renderer/renderScenePlan.ts` | contentKindToClass untuk learning-material → `silse-scene-learning`. resolveSlotStyle untuk learning-material → surface visual. |
| `src/components/SceneRendererView.tsx` | Tambah LearningMaterialContent: concept header + explanation + example grid + example cards + key point + student action + visual hint. Visual dari resolvedStyle + contract. |
| `src/export/export-html.ts` | Tambah renderLearningMaterialSceneContent: learning scene dengan visual dari resolvedStyle + plan.palette/typography. |
| `src/core/scene-proof-project.ts` | Tambah material page dengan sceneMetadata learning-scene + placement spesifik |

## Evidence

### 1. learning-scene schema/slot
```typescript
// src/core/types.ts
export type MaterialSceneMetadata = {
  scene: string; // 'learning-scene'
  conceptTitle?: string;
  conceptSubtitle?: string;
  explanation?: string;
  examples?: { id: string; title: string; body: string }[];
  keyPoints?: string[];
  studentAction?: string;
  visualHint?: string;
};

// src/core/mpi-container/types.ts — new content kind
| { kind: 'learning-material'; conceptTitle: string; conceptSubtitle?: string; explanation: string; examples?: ...; keyPoints?: string[]; studentAction?: string; visualHint?: string }
```

### 2. validator/normalizer support
```typescript
// isPageSceneRenderable deteksi learning-scene
const hasMaterialScene = page.components.find(
  (c): c is CardComponent => c.type === 'card' && 'sceneMetadata' in c && c.sceneMetadata?.scene === 'learning-scene',
);
```

### 3. converter support
```typescript
// simpleProjectToMpiContainer.ts
if (cc.sceneMetadata?.scene === 'learning-scene') {
  return { content: { kind: 'learning-material', conceptTitle, explanation, examples, keyPoints, studentAction, visualHint }, slotRole: 'explanationPanel' };
}
```

### 4. renderScenePlan support
```typescript
// contentKindToClass
'learning-material': 'silse-scene-learning',

// resolveSlotStyle — learning-material dapat surface visual dari contract.card
if (kind === 'card' || 'game-mission' || 'quiz-question' || 'learning-material') {
  style.surface = { background, radius, padding, border, shadow }; // dari contract.card
}
```

### 5. SceneRendererView learning renderer
```tsx
// LearningMaterialContent
<div className="silse-learning-scene">
  <div className="silse-learning-header" style={{ fontSize: contract.typography.titleSize, fontWeight: contract.typography.titleWeight }}>{content.conceptTitle}</div>
  <div className="silse-learning-explanation" style={{ padding: surf?.padding, borderRadius: surf?.radius, background: surf?.background }}>{content.explanation}</div>
  <div className="silse-learning-example-grid">{examples.map(ex => <div className="silse-learning-example-card">...)}</div>
  <div className="silse-learning-key-point">{keyPoints}</div>
  <div className="silse-learning-student-action">{content.studentAction}</div>
  <div className="silse-learning-visual-hint">{content.visualHint}</div>
</div>
```

### 6. export-html learning renderer
```javascript
// renderLearningMaterialSceneContent
var surf = rs.surface || {};
var palette = plan.palette || {};
var ty = plan.typography || {};
// header (fontSize dari ty.titleSize), explanation (radius/bg dari surf), example cards, key point, student action, visual hint
```

### 7. Tests with visual value checks
- Test 7: `learningSlot.placement.x === 72`, `y === 120` — placement dari data
- Test 11: `slot.style.left === '72px'`, `top === '120px'` — inline style dari placement
- Test 12: `explanation.style.borderRadius === contract.card.radius + 'px'` — radius dari contract
- Test 13: `exampleCard.style.borderRadius === contract.card.radius + 'px'` — card radius dari contract
- Test 15: `header.style.fontSize === contract.typography.titleSize + 'px'` — typography dari contract
- Test 22: editor & preview `slot.style.left === '72px'` — parity

## Self-Audit

| Check | Status | Evidence |
|-------|--------|----------|
| Scene model support | ✅ PASS | Tests 1-5: isPageSceneRenderable detects learning, validator accepts, normalizer preserves, converter preserves slots |
| AI JSON support | ✅ PASS | Tests 2-5: validator accepts learning-scene, rejects flat, normalizer preserves sceneType, converter preserves slots |
| MpiContainer preservation | ✅ PASS | Test 5: aiJsonToMpiContainer preserves learning-material slots |
| Render plan support | ✅ PASS | Tests 6-8: plan has learning slots + resolvedStyle.surface dari contract |
| Editor/preview/export parity | ✅ PASS | Tests 16-22: all 3 emit silse-scene-learning-scene, same placement, same classes |
| Design contract applied | ✅ PASS | Tests 12-15: radius/background/border dari contract, typography dari contract |
| Legacy fallback safe | ✅ PASS | Tests 23-24: legacy material (no sceneMetadata) tetap CardComponentView, no scene |
| Out-of-scope check | ✅ PASS | No style premium, no Cover/Closing, no dependency |

## Verification

| Check | Result |
|-------|--------|
| typecheck | ✅ PASS |
| test | ✅ PASS — 2788/2788 (2763 existing + 25 new) |
| build | ✅ PASS |

## Final Status
READY FOR SENIOR REVIEW

## Yang TIDAK Dikerjakan (stoplist dipatuhi)
- ❌ Tidak style premium / visual polish
- ❌ Tidak style pack baru
- ❌ Tidak visual memory / flavor / art layer
- ❌ Tidak HTML import / iframe / reskin
- ❌ Tidak dependency baru
- ❌ Tidak rewrite editor/store
- ❌ Tidak lanjut Cover/Closing scene proof
