# Design Contract Render Parity 01

## Scope
DESIGN-CONTRACT-RENDER-PARITY-01

## Commit
(latest commit after this report)

## Status
READY FOR SENIOR REVIEW

## Masalah
FOUNDATION-INTEGRATION-01 sudah masuk ke editor/preview/export, tetapi design contract hanya dipreserve dalam data. Renderer belum benar-benar membaca placement, palette, typography, card/button/badge/feedback/reward tokens untuk mengontrol hasil render.

## Tujuan
Membuktikan design contract benar-benar mengontrol hasil render di editor/preview/export. Test mengecek nilai visual spesifik (px, hex, radius), bukan cuma class.

## Files Changed

### New files
| File | Deskripsi |
|------|-----------|
| `samples/ai-mpi-json/visual-fidelity-game-mission.sample.json` | Sample dengan placement spesifik (x:72, y:120, width:1136, height:480) |
| `src/tests/design-contract-render-parity-01.test.tsx` | 28 test guard (cek nilai visual spesifik) |
| `docs/DESIGN_CONTRACT_RENDER_PARITY_01.md` | Report ini |

### Modified files
| File | Perubahan |
|------|-----------|
| `src/core/scene-renderer/renderScenePlan.ts` | Perluas SceneRenderPlan dengan frame/palette/typography/background. Perluas SceneRenderSlot dengan resolvedStyle (surface/button/typography/feedback/reward). Tambah resolveSlotStyle() yang baca contract tokens. |
| `src/core/scene-renderer/index.ts` | Export SlotResolvedStyle type |
| `src/components/SceneRendererView.tsx` | ContentRenderer baca slot.resolvedStyle untuk text/card/button/feedback/reward. SceneStyle baca plan.frame/background. GameMissionContent briefing baca resolvedStyle.surface. |
| `src/export/export-html.ts` | renderSceneContent baca slot.resolvedStyle untuk text/card/button/feedback/reward. renderSceneFromPlan baca plan.background. renderGameMissionSceneContent briefing baca resolvedStyle.surface. |
| `src/core/scene-proof-project.ts` | Update game placement ke x:72, y:120, width:1136, height:480 (visual fidelity test values) |

## Evidence

### 1. renderScenePlan visual instruction
```typescript
// src/core/scene-renderer/renderScenePlan.ts
export type SceneRenderPlan = {
  // ... existing fields
  frame: { width, height, stageRadius, overflow };     // dari contract.frame
  palette: { primary, secondary, accent, background, surface, text, mutedText, border, gold, success, danger }; // dari contract.palette
  typography: { heroFont, bodyFont, titleSize, bodySize, titleWeight, lineHeight, letterSpacing }; // dari contract.typography
  background: { pattern, color, gradient };             // dari contract.background
};

export type SlotResolvedStyle = {
  surface?: { background, radius, padding, border, shadow };  // card/briefing visual
  button?: { background, color, radius, fontWeight, padding }; // button visual
  typography?: { fontFamily, fontSize, fontWeight, color, lineHeight, letterSpacing, uppercase }; // text visual
  feedback?: { background, color, borderColor, icon };         // feedback visual
  reward?: { background, borderColor, radius, icon };          // reward visual
};

function resolveSlotStyle(slot, contract): SlotResolvedStyle {
  // Untuk kind 'card'/'game-mission' → baca contract.card atau contract.game.briefingPanel
  // Untuk kind 'button' → baca contract.button[variant]
  // Untuk kind 'text' → baca contract.typography + contract.palette.text
  // Untuk kind 'feedback' → baca contract.feedback[variant]
  // Untuk kind 'reward' → baca contract.reward.medal
}
```

### 2. SceneRendererView style application
```typescript
// src/components/SceneRendererView.tsx — ContentRenderer
const rs = slot.resolvedStyle; // baca dari plan

if (c.kind === 'card') {
  const surf = rs?.surface;
  return <div style={{
    padding: surf?.padding ?? 16,        // dari contract, bukan hardcoded
    borderRadius: surf?.radius ?? 12,    // dari contract
    background: surf?.background ?? '#fff', // dari contract
    border: surf?.border,                // dari contract
    boxShadow: surf?.shadow,             // dari contract
  }}>...</div>;
}

if (c.kind === 'feedback') {
  const fb = rs?.feedback;
  return <div style={{
    background: fb?.background ?? '#f3f4f6',  // dari contract.feedback[variant]
    color: fb?.color,
    borderLeft: '4px solid ' + (fb?.borderColor ?? '#d1d5db'), // dari contract
  }}>...</div>;
}
```

### 3. export-html style application
```javascript
// src/export/export-html.ts — renderSceneContent
var rs = slot.resolvedStyle || {};

if (content.kind === 'card') {
  var surf = rs.surface || {};
  var cCss = 'width:100%;height:100%;box-sizing:border-box;';
  cCss += 'padding:' + (surf.padding != null ? surf.padding : 16) + 'px;';
  cCss += 'border-radius:' + (surf.radius != null ? surf.radius : 12) + 'px;';
  cCss += 'background:' + (surf.background || '#fff') + ';';
  cCss += 'border:' + (surf.border || '1px solid #e5e7eb') + ';';
  if (surf.shadow) cCss += 'box-shadow:' + surf.shadow + ';';
  cEl.style.cssText = cCss;
}
```

### 4. visual-fidelity sample JSON
```json
{
  "scenes": [{
    "slots": [{
      "placement": { "x": 72, "y": 120, "width": 1136, "height": 480, "zIndex": 2 },
      "content": {
        "kind": "game-mission",
        "briefing": "...",
        "missionTarget": "...",
        "actions": [...],
        "reward": { "type": "badge", "label": "Lencana Penjaga Norma", "icon": "🏅" }
      }
    }]
  }]
}
```

### 5. Tests cek nilai visual spesifik
- Test 7: `expect(gameSlot.placement.x).toBe(72)` — bukan cuma class
- Test 8: `expect(slot.style.left).toBe('72px')` — inline style dari placement
- Test 9: `expect(briefing.style.borderRadius).toBe(expectedRadius + 'px')` — radius dari contract
- Test 12: `expect(feedbackSlot.resolvedStyle?.feedback?.background).toBe(contract.feedback.correct.background)` — feedback bg dari contract
- Test 13: `expect(rewardSlot.resolvedStyle?.reward?.borderColor).toBe(contract.reward.medal!.borderColor)` — reward border dari contract
- Test 23: editor & preview sama-sama `expect(slot.style.left).toBe('72px')` — parity
- Test 24: editor & preview sama-sama `expect(briefing.style.borderRadius).toBe(expectedRadius + 'px')` — parity

## Self-Audit

| Check | Status | Evidence |
|-------|--------|----------|
| Design contract used by render plan | ✅ PASS | Tests 1-6: plan.frame/palette/typography/background + slot.resolvedStyle |
| Placement applied in editor/preview | ✅ PASS | Tests 8, 23: slot.style.left = '72px', top = '120px' |
| Placement applied in export | ✅ PASS | Tests 14, 25: HTML contains "x":72, "y":120 |
| Style token applied in editor/preview | ✅ PASS | Tests 9, 12, 13, 24: radius/background/borderColor from contract |
| Style token applied in export | ✅ PASS | Tests 15-19: HTML contains resolvedStyle, surface, palette, typography |
| Legacy fallback safe | ✅ PASS | Tests 26-27: legacy project no scene, no break |
| Out-of-scope check | ✅ PASS | No style premium, no Quiz/Material/Cover, no dependency |

## Verification

| Check | Result |
|-------|--------|
| typecheck | ✅ PASS |
| test | ✅ PASS — 2737/2737 (2709 existing + 28 new) |
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
- ❌ Tidak lanjut Quiz/Material/Cover scene proof

## Cara Kerja Render Parity
1. **Plan building**: `renderScenePlan(scene, contract)` baca contract → isi plan.frame/palette/typography/background + setiap slot dapat `resolvedStyle` (surface/button/typography/feedback/reward).
2. **Editor/Preview**: `SceneRendererView` baca `slot.resolvedStyle` → apply ke inline style (padding, borderRadius, background, border, color, dll). Tidak ada hardcoded CSS; nilai utama datang dari plan.
3. **Export**: `renderSceneContent` baca `slot.resolvedStyle` → apply ke `style.cssText`. Same tokens, same values.
4. **Parity**: Same `renderScenePlan` pure function → same resolvedStyle → same inline style di editor/preview/export.
5. **Test bukti**: Test cek `slot.style.left === '72px'`, `briefing.style.borderRadius === expectedRadius + 'px'`, `resolvedStyle.feedback.background === contract.feedback.correct.background`. Bukan cuma class.
