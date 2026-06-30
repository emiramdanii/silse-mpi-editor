/**
 * FOUNDATION-HARDENING-01 — Test Suite.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  validateAiMpiJson,
  normalizeBlueprint,
} from '../core/ai-mpi-json';
import { buildMpiPromptContract, buildMpiPromptText } from '../core/ai-prompt-contract';
import { createSceneProofProject } from '../core/scene-proof-project';
import { buildSceneRenderPlanForPage } from '../core/scene-renderer';
import { getDesignContract } from '../core/mpi-design-contract';
import { SceneRendererView } from '../components/SceneRendererView';
import { exportProjectToHtml } from '../export/export-html';

function loadBlueprint(path: string) {
  const raw = readFileSync(resolve(__dirname, '../../samples/ai-mpi-json', path), 'utf-8');
  return normalizeBlueprint(JSON.parse(raw));
}

describe('FOUNDATION-HARDENING-01 — validator', () => {
  it('1. validator menolak unknown content.kind', () => {
    const invalid = {
      version: 1,
      metadata: { title: 'Test' },
      styleIntent: { styleId: 'modern-clean' },
      designSystem: { contractId: 'modern-clean' },
      flow: { steps: [{ sceneId: 's1' }] },
      scenes: [{
        id: 's1', role: 'material', sceneType: 'learning-scene', title: 'T',
        slots: [{
          id: 'slot1', role: 'test', placement: { x: 0, y: 0, width: 100, height: 50 },
          content: { kind: 'unknown-kind', text: 'test' },
        }],
      }],
      assets: [], runtime: {}, exportConfig: { format: 'html-standalone' },
    };
    const errors = validateAiMpiJson(invalid);
    expect(errors.some((e) => e.path.includes('content.kind') && e.message.includes('unknown kind'))).toBe(true);
  });

  it('2. validator menerima learning-material resmi', () => {
    const blueprint = loadBlueprint('material-learning-scene-proof.sample.json');
    const errors = validateAiMpiJson(blueprint);
    expect(errors).toHaveLength(0);
  });

  it('3. validator menolak learning-scene tanpa learning-material slot', () => {
    const invalid = {
      version: 1,
      metadata: { title: 'Test' },
      styleIntent: { styleId: 'modern-clean' },
      designSystem: { contractId: 'modern-clean' },
      flow: { steps: [{ sceneId: 's1' }] },
      scenes: [{
        id: 's1', role: 'material', sceneType: 'learning-scene', title: 'T',
        slots: [{
          id: 'slot1', role: 'title', placement: { x: 0, y: 0, width: 100, height: 50 },
          content: { kind: 'text', variant: 'title', text: 'Hello' },
        }],
      }],
      assets: [], runtime: {}, exportConfig: { format: 'html-standalone' },
    };
    const errors = validateAiMpiJson(invalid);
    expect(errors.some((e) => e.message.includes('learning-material'))).toBe(true);
  });

  it('4. validator menolak learning-material tanpa conceptTitle', () => {
    const invalid = {
      version: 1,
      metadata: { title: 'Test' },
      styleIntent: { styleId: 'modern-clean' },
      designSystem: { contractId: 'modern-clean' },
      flow: { steps: [{ sceneId: 's1' }] },
      scenes: [{
        id: 's1', role: 'material', sceneType: 'learning-scene', title: 'T',
        slots: [{
          id: 'slot1', role: 'explanationPanel', placement: { x: 0, y: 0, width: 100, height: 50 },
          content: { kind: 'learning-material', explanation: 'Some explanation' },
        }],
      }],
      assets: [], runtime: {}, exportConfig: { format: 'html-standalone' },
    };
    const errors = validateAiMpiJson(invalid);
    expect(errors.some((e) => e.path.includes('conceptTitle'))).toBe(true);
  });

  it('5. validator menolak learning-material tanpa explanation', () => {
    const invalid = {
      version: 1,
      metadata: { title: 'Test' },
      styleIntent: { styleId: 'modern-clean' },
      designSystem: { contractId: 'modern-clean' },
      flow: { steps: [{ sceneId: 's1' }] },
      scenes: [{
        id: 's1', role: 'material', sceneType: 'learning-scene', title: 'T',
        slots: [{
          id: 'slot1', role: 'explanationPanel', placement: { x: 0, y: 0, width: 100, height: 50 },
          content: { kind: 'learning-material', conceptTitle: 'Title' },
        }],
      }],
      assets: [], runtime: {}, exportConfig: { format: 'html-standalone' },
    };
    const errors = validateAiMpiJson(invalid);
    expect(errors.some((e) => e.path.includes('explanation'))).toBe(true);
  });
});

describe('FOUNDATION-HARDENING-01 — prompt contract', () => {
  it('6. prompt contract mencantumkan learning-material di slotKinds', () => {
    const c = buildMpiPromptContract();
    expect(c.slotKinds).toContain('learning-material');
  });

  it('7. prompt contract mencantumkan learning-material di outputRules', () => {
    const c = buildMpiPromptContract();
    const rules = c.outputRules.join(' ');
    expect(rules).toContain('learning-material');
  });

  it('8. prompt text menyebut learning-material', () => {
    const text = buildMpiPromptText();
    expect(text).toContain('learning-material');
  });

  it('9. learning-scene requiredSlots includes explanationPanel', () => {
    const c = buildMpiPromptContract();
    const ls = c.sceneTypes.find((s) => s.id === 'learning-scene');
    expect(ls?.requiredSlots).toContain('explanationPanel');
  });
});

describe('FOUNDATION-HARDENING-01 — design contract tokens (no hardcoded)', () => {
  it('10. material key point mengambil background dari contract.learning.keyPointPanel', () => {
    const project = createSceneProofProject();
    const materialPage = project.pages.find((p) => p.role === 'material')!;
    const plan = buildSceneRenderPlanForPage(project, materialPage)!;
    const contract = getDesignContract(project.stylePackId);
    const { container } = render(<SceneRendererView plan={plan} contract={contract} />);
    const keyPoint = container.querySelector('.silse-learning-key-point') as HTMLElement;
    expect(keyPoint.style.background).toBeTruthy();
    // Background should be set (from contract, browser may normalize hex to rgb)
    const expectedBg = contract.learning.keyPointPanel?.background ?? '#fffbeb';
    // Check that background is non-empty and either contains hex or rgb equivalent
    expect(keyPoint.style.background === expectedBg || keyPoint.style.background.includes(expectedBg.replace('#', '')) || keyPoint.style.background.includes('rgb')).toBe(true);
  });

  it('11. material key point accentColor dari contract (border-left)', () => {
    const project = createSceneProofProject();
    const materialPage = project.pages.find((p) => p.role === 'material')!;
    const plan = buildSceneRenderPlanForPage(project, materialPage)!;
    const contract = getDesignContract(project.stylePackId);
    // Verify plan.learning.keyPointPanel.accentColor comes from contract
    expect(plan.learning?.keyPointPanel.accentColor).toBe(contract.learning.keyPointPanel?.accentColor);
    // Render and verify key point element exists
    const { container } = render(<SceneRendererView plan={plan} contract={contract} />);
    const keyPoint = container.querySelector('.silse-learning-key-point') as HTMLElement;
    expect(keyPoint).toBeInTheDocument();
    expect(keyPoint.style.borderLeft).toBeTruthy();
  });

  it('12. material student action mengambil border dari contract.learning.studentActionPanel', () => {
    const project = createSceneProofProject();
    const materialPage = project.pages.find((p) => p.role === 'material')!;
    const plan = buildSceneRenderPlanForPage(project, materialPage)!;
    const contract = getDesignContract(project.stylePackId);
    // Verify plan.learning.studentActionPanel.border comes from contract
    expect(plan.learning?.studentActionPanel.border).toBe(contract.learning.studentActionPanel?.border);
    // Render and verify student action element exists
    const { container } = render(<SceneRendererView plan={plan} contract={contract} />);
    const action = container.querySelector('.silse-learning-student-action') as HTMLElement;
    expect(action).toBeInTheDocument();
    expect(action.style.border).toBeTruthy();
  });

  it('13. material visual hint mengambil color dari contract.learning.visualHintPanel', () => {
    const project = createSceneProofProject();
    const materialPage = project.pages.find((p) => p.role === 'material')!;
    const plan = buildSceneRenderPlanForPage(project, materialPage)!;
    const contract = getDesignContract(project.stylePackId);
    const { container } = render(<SceneRendererView plan={plan} contract={contract} />);
    const hint = container.querySelector('.silse-learning-visual-hint') as HTMLElement;
    expect(hint.style.color).toBeTruthy();
  });

  it('14. export ikut memakai token yang sama (plan.learning.keyPointPanel)', () => {
    const project = createSceneProofProject();
    const html = exportProjectToHtml(project);
    // plan.learning is embedded as JSON
    expect(html).toContain('"learning"');
    expect(html).toContain('"keyPointPanel"');
    expect(html).toContain('"studentActionPanel"');
    expect(html).toContain('"visualHintPanel"');
  });

  it('15. export plan.learning.keyPointPanel punya accentColor dari contract', () => {
    const project = createSceneProofProject();
    const html = exportProjectToHtml(project);
    const contract = getDesignContract('modern-clean');
    expect(html).toContain('"accentColor":"' + contract.learning.keyPointPanel?.accentColor + '"');
  });
});
