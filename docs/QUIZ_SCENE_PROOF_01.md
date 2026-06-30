# Quiz Scene Proof 01

## Scope
QUIZ-SCENE-PROOF-01

## Commit
(latest commit after this report)

## Status
READY FOR SENIOR REVIEW

## Masalah
Quiz masih dirender sebagai form pilihan biasa (judul + pertanyaan + list A/B/C/D + feedback biasa). Perlu diubah menjadi challenge scene yang pakai fondasi sama (container + design contract + render parity).

## Tujuan
Quiz dirender sebagai challenge scene: challenge header → question focus panel → answer cards (grid) → feedback → progress indicator. Pakai fondasi sama dengan game-mission, bukan jalur baru.

## Files Changed

### New files
| File | Deskripsi |
|------|-----------|
| `samples/ai-mpi-json/quiz-challenge-scene-proof.sample.json` | Sample quiz-challenge dengan placement spesifik (x:72, y:120) |
| `src/tests/quiz-scene-proof-01.test.tsx` | 26 test guard |
| `docs/QUIZ_SCENE_PROOF_01.md` | Report ini |

### Modified files
| File | Perubahan |
|------|-----------|
| `src/core/types.ts` | Tambah `QuizSceneMetadata` type + `sceneMetadata?` field optional di QuestionComponent |
| `src/core/scene-renderer/sceneDetection.ts` | `isPageSceneRenderable` sekarang deteksi quiz-challenge (QuestionComponent dengan sceneMetadata) |
| `src/core/mpi-container/simpleProjectToMpiContainer.ts` | QuestionComponent dengan sceneMetadata → slotRole 'questionFocus' |
| `src/core/scene-renderer/renderScenePlan.ts` | Tambah `quizAnswerCard`, `quizState`, `quizChoiceBadge`, `quizQuestionPanel` ke SlotResolvedStyle. resolveSlotStyle untuk quiz-question baca contract.quiz tokens. |
| `src/components/SceneRendererView.tsx` | QuizQuestionContent dirender sebagai challenge scene: header + question focus + answer grid + answer cards + choice badges + feedback + progress. Visual dari resolvedStyle. |
| `src/export/export-html.ts` | renderQuizSceneContent dirender sebagai challenge scene dengan class + visual dari resolvedStyle. |
| `src/core/scene-proof-project.ts` | Tambah quiz page dengan sceneMetadata quiz-challenge + placement spesifik |
| `src/tests/scene-renderer-proof-01.test.tsx` | Update test 23: `silse-quiz-choices` → `silse-quiz-answer-grid` (quiz sekarang challenge scene) |

## Evidence

### 1. quiz-challenge schema/slot
```typescript
// src/core/types.ts
export type QuizSceneMetadata = {
  scene: string; // 'quiz-challenge'
  challengeTitle?: string;
  challengeSubtitle?: string;
};

export type QuestionComponent = BaseComponent & {
  // ... existing fields
  sceneMetadata?: QuizSceneMetadata; // QUIZ-SCENE-PROOF-01
};
```

### 2. validator/normalizer support
```typescript
// isPageSceneRenderable sekarang deteksi quiz-challenge
const hasQuizScene = page.components.find(
  (c): c is QuestionComponent => c.type === 'question' && 'sceneMetadata' in c && c.sceneMetadata?.scene === 'quiz-challenge',
);
```

### 3. converter support
```typescript
// simpleProjectToMpiContainer.ts
slotRole: qc.sceneMetadata?.scene === 'quiz-challenge' ? 'questionFocus' : 'quiz',
```

### 4. renderScenePlan support
```typescript
// resolveSlotStyle untuk quiz-question:
if (kind === 'quiz-question') {
  style.quizAnswerCard = { background, radius, padding, border }; // dari contract.quiz.answerCard
  style.quizState = { selected, correct, wrong }; // dari contract.quiz.selectedState/correctState/wrongState
  style.quizChoiceBadge = { background, color, radius }; // dari contract.quiz.choiceLetterBadge
  style.quizQuestionPanel = { background, radius, padding }; // dari contract.quiz.questionPanel
}
```

### 5. SceneRendererView quiz renderer
```tsx
// QuizQuestionContent — challenge scene
<div className="silse-quiz-scene">
  <div className="silse-quiz-header">🎯 Challenge</div>
  <div className="silse-quiz-question-focus" style={{
    padding: panel?.padding, borderRadius: panel?.radius, background: panel?.background
  }}>{content.prompt}</div>
  <div className="silse-quiz-answer-grid">
    {choices.map(choice => (
      <div className="silse-quiz-answer-card" style={{
        padding: ansCard?.padding, borderRadius: ansCard?.radius,
        background: ansCard?.background, border: `2px solid ${ansCard?.border}`
      }}>
        <span className="silse-quiz-choice-badge" style={{
          borderRadius: badge?.radius, background: badge?.background, color: badge?.color
        }}>{letter}</span>
        <span>{choice.text}</span>
      </div>
    ))}
  </div>
  <div className="silse-quiz-feedback" />
  <div className="silse-quiz-progress">{choices.length} pilihan</div>
</div>
```

### 6. export-html quiz renderer
```javascript
// renderQuizSceneContent — challenge scene dengan visual dari resolvedStyle
var ansCard = rs.quizAnswerCard || {};
var badge = rs.quizChoiceBadge || {};
var panel = rs.quizQuestionPanel || {};
// ... header, question-focus, answer-grid, answer-card, choice-badge, feedback, progress
```

### 7. Tests with visual value checks
- Test 7: `quizSlot.placement.x === 72`, `y === 120` — placement dari data
- Test 12: `slot.style.left === '72px'`, `top === '120px'` — inline style dari placement
- Test 13: `answerCard.style.borderRadius === expectedRadius + 'px'` — radius dari contract
- Test 14: `badge.style.borderRadius === expectedRadius + 'px'` — badge radius dari contract
- Test 15: `panel.style.borderRadius === expectedRadius + 'px'` — panel radius dari contract
- Test 22: editor & preview `slot.style.left === '72px'` — parity
- Test 25: `feedbackSlot.resolvedStyle.feedback.background === contract.feedback.correct.background` — feedback dari contract

## Self-Audit

| Check | Status | Evidence |
|-------|--------|----------|
| Scene model support | ✅ PASS | Tests 1-5: isPageSceneRenderable detects quiz, validator accepts, normalizer preserves, converter preserves slots |
| AI JSON support | ✅ PASS | Tests 2-5: validator accepts quiz-challenge, rejects flat quiz, normalizer preserves sceneType, converter preserves slots |
| MpiContainer preservation | ✅ PASS | Test 5: aiJsonToMpiContainer preserves quiz slots |
| Render plan support | ✅ PASS | Tests 6-9: plan has quiz slots + resolvedStyle (quizAnswerCard, quizState, quizChoiceBadge, quizQuestionPanel) |
| Editor/preview/export parity | ✅ PASS | Tests 16-22: all 3 emit silse-scene-quiz-challenge, same placement, same classes |
| Design contract applied | ✅ PASS | Tests 13-15, 25: radius/background/border dari contract, feedback dari contract |
| Legacy fallback safe | ✅ PASS | Tests 23-24: legacy quiz (no sceneMetadata) tetap QuestionComponentView, no scene |
| Out-of-scope check | ✅ PASS | No style premium, no Material/Cover/Closing, no dependency |

## Verification

| Check | Result |
|-------|--------|
| typecheck | ✅ PASS |
| test | ✅ PASS — 2763/2763 (2737 existing + 26 new) |
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
- ❌ Tidak lanjut Material/Cover/Closing scene proof

## Cara Kerja Quiz Scene
1. **Detection**: `isPageSceneRenderable` cek QuestionComponent dengan `sceneMetadata.scene === 'quiz-challenge'`.
2. **Plan building**: `renderScenePlan` → `resolveSlotStyle` untuk quiz-question baca `contract.quiz` tokens (answerCard, selectedState, correctState, wrongState, choiceLetterBadge, questionPanel).
3. **Rendering**: SceneRendererView (editor/preview) + renderQuizSceneContent (export) baca `resolvedStyle` → emit challenge scene classes + inline style.
4. **Parity**: Same `renderScenePlan` → same resolvedStyle → same classes + style di editor/preview/export.
5. **Legacy fallback**: QuestionComponent tanpa sceneMetadata tetap pakai QuestionComponentView (form pilihan biasa).
