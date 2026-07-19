/**
 * HOVER-STYLE-01 + BUG-NAV-01 + COMPONENT-STYLE-01 — Comprehensive test.
 *
 * Test coverage:
 *   1. Sanitizer: hover keys work (buttonHover, tabHover, answerHover)
 *   2. React: ActionButtonBlock hover via onMouseEnter/Leave
 *   3. React: quiz answer hover via customStyle.answerHover
 *   4. React: SceneTabs + SceneAccordion consume context
 *   5. Export: hover CSS rules in <style> tag
 *   6. Export: nav button wiring (primaryAction + finalAction)
 *   7. Prompt: documents all new keys
 */

import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';

import { getDesignContract } from '../core/mpi-design-contract';
import {
  SceneTabs, SceneAccordion, ActionButtonBlock, CustomStyleProvider,
} from '../components/scene-blocks';
import { sanitizeCustomStyle } from '../core/style/sanitize';
import { templateToBlueprint, TEMPLATE_PPKN_NORMA } from '../core/guided-flow/pedagogical-templates';
import { aiBlueprintToSimpleProject } from '../core/ai-mpi-json/aiBlueprintToSimpleProject';
import { exportProjectToHtml } from '../export/export-html';
import { buildMpiPromptText } from '../core/ai-prompt-contract/buildMpiPromptContract';

const contract = getDesignContract('modern-clean');

// ---------------------------------------------------------------------------
// Sanitizer: hover keys
// ---------------------------------------------------------------------------

describe('HOVER-STYLE-01 — Sanitizer: hover keys work', () => {
  it('1. buttonHover passes through sanitizer', () => {
    const r = sanitizeCustomStyle({
      buttonHover: { background: '#ff0000', transform: 'translateY(-2px)' },
    });
    expect(r?.buttonHover?.background).toBe('#ff0000');
    expect(r?.buttonHover?.transform).toBe('translateY(-2px)');
  });

  it('2. tabHover + answerHover pass through sanitizer', () => {
    const r = sanitizeCustomStyle({
      tabHover: { background: '#00ff00', color: '#ffffff' },
      answerHover: { borderColor: '#0000ff', transform: 'scale(1.02)' },
    });
    expect(r?.tabHover?.background).toBe('#00ff00');
    expect(r?.answerHover?.borderColor).toBe('#0000ff');
  });

  it('3. dangerous props blocked in hover keys', () => {
    const r = sanitizeCustomStyle({
      buttonHover: { position: 'absolute', background: '#ff0000' },
    });
    expect(r?.buttonHover?.position).toBeUndefined();
    expect(r?.buttonHover?.background).toBe('#ff0000');
  });
});

// ---------------------------------------------------------------------------
// React: ActionButtonBlock hover
// ---------------------------------------------------------------------------

describe('HOVER-STYLE-01 — React: ActionButtonBlock hover', () => {
  it('4. buttonHover applied on mouseEnter via context', () => {
    const { container } = render(
      <CustomStyleProvider value={{ buttonHover: { background: 'rgb(255,0,0)', transform: 'translateY(-2px)' } } as any}>
        <ActionButtonBlock contract={contract} label="Click" onClick={() => {}} />
      </CustomStyleProvider>
    );
    const btn = container.querySelector('.silse-block-action') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    // Simulate hover
    fireEvent.mouseEnter(btn);
    expect(btn.style.background).toContain('rgb(255, 0, 0)');
    expect(btn.style.transform).toContain('translateY(-2px)');
  });

  it('5. buttonHover restored on mouseLeave', () => {
    const { container } = render(
      <CustomStyleProvider value={{ buttonHover: { background: 'rgb(255,0,0)' } } as any}>
        <ActionButtonBlock contract={contract} label="Click" onClick={() => {}} />
      </CustomStyleProvider>
    );
    const btn = container.querySelector('.silse-block-action') as HTMLButtonElement;
    fireEvent.mouseEnter(btn);
    expect(btn.style.background).toContain('rgb(255, 0, 0)');
    fireEvent.mouseLeave(btn);
    // Should restore to contract button background
    expect(btn.style.background).not.toBe('rgb(255, 0, 0)');
  });
});

// ---------------------------------------------------------------------------
// React: SceneTabs + SceneAccordion consume context (COMPONENT-STYLE-01)
// ---------------------------------------------------------------------------

describe('COMPONENT-STYLE-01 — React: SceneTabs + SceneAccordion consume context', () => {
  it('6. SceneTabs applies customStyle.tabs from context', () => {
    const { container } = render(
      <CustomStyleProvider value={{ tabs: { gap: '12px', background: 'rgb(100,150,200)' } } as any}>
        <SceneTabs contract={contract} tabs={[{ id: 'a', label: 'A' }]} activeTab="a" />
      </CustomStyleProvider>
    );
    const tabs = container.querySelector('.silse-block-tabs') as HTMLElement;
    expect(tabs.style.gap).toContain('12px');
    expect(tabs.style.background).toContain('rgb(100, 150, 200)');
  });

  it('7. SceneAccordion applies customStyle.accordion from context', () => {
    const { container } = render(
      <CustomStyleProvider value={{ accordion: { gap: '10px', background: 'rgb(50,100,150)' } } as any}>
        <SceneAccordion contract={contract} items={[{ title: 'T', body: 'B' }]} openIndex={null} />
      </CustomStyleProvider>
    );
    const acc = container.querySelector('.silse-block-accordion') as HTMLElement;
    expect(acc.style.gap).toContain('10px');
    expect(acc.style.background).toContain('rgb(50, 100, 150)');
  });
});

// ---------------------------------------------------------------------------
// Export: hover CSS rules in <style> tag
// ---------------------------------------------------------------------------

describe('HOVER-STYLE-01 — Export: hover CSS in <style> tag', () => {
  function buildProjectWithHoverStyle() {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    bp.scenes[0].slots[0].customStyle = {
      buttonHover: { background: '#ff0000', transform: 'translateY(-2px)' },
      tabHover: { background: '#00ff00' },
      answerHover: { borderColor: '#0000ff' },
    };
    return aiBlueprintToSimpleProject(bp);
  }

  it('8. export HTML contains :hover CSS rule for button', () => {
    const html = exportProjectToHtml(buildProjectWithHoverStyle());
    expect(html).toContain('.silse-block-action:hover');
    expect(html).toContain('background:#ff0000');
  });

  it('9. export HTML contains :hover CSS rule for tabs', () => {
    const html = exportProjectToHtml(buildProjectWithHoverStyle());
    expect(html).toContain('.silse-block-tabs button:hover');
  });

  it('10. export HTML contains :hover CSS rule for quiz answer', () => {
    const html = exportProjectToHtml(buildProjectWithHoverStyle());
    expect(html).toContain('.silse-quiz-answer-card:hover');
  });

  it('11. export HTML contains HOVER-STYLE-01 comment marker', () => {
    const html = exportProjectToHtml(buildProjectWithHoverStyle());
    expect(html).toContain('HOVER-STYLE-01');
  });
});

// ---------------------------------------------------------------------------
// BUG-NAV-01: Nav button wiring
// ---------------------------------------------------------------------------

describe('BUG-NAV-01 — Nav button wiring in export HTML', () => {
  it('12. primaryAction button has click handler wired to navigate', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const html = exportProjectToHtml(project);
    expect(html).toMatch(/pa\.addEventListener\('click'/);
    expect(html).toContain('navigate(paAction)');
  });

  it('13. finalAction button has click handler wired to navigate', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const html = exportProjectToHtml(project);
    expect(html).toMatch(/fa\.addEventListener\('click'/);
    expect(html).toContain('navigate(faAction)');
  });
});

// ---------------------------------------------------------------------------
// Prompt: documents all new keys
// ---------------------------------------------------------------------------

describe('Prompt AI documents all new keys', () => {
  it('14. prompt mentions buttonHover, tabHover, answerHover', () => {
    const prompt = buildMpiPromptText();
    expect(prompt).toContain('"buttonHover"');
    expect(prompt).toContain('"tabHover"');
    expect(prompt).toContain('"answerHover"');
  });

  it('15. prompt mentions tabs + accordion', () => {
    const prompt = buildMpiPromptText();
    expect(prompt).toContain('"tabs"');
    expect(prompt).toContain('"accordion"');
  });

  it('16. prompt has HOVER STYLE section', () => {
    const prompt = buildMpiPromptText();
    expect(prompt).toContain('HOVER-STYLE-01');
  });
});
