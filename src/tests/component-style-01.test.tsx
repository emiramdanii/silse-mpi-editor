/**
 * COMPONENT-STYLE-01 (Level 3) — AI dapat override tabs + accordion container styling.
 *
 * Test coverage:
 *   1. React: SceneTabs consumes context (customStyle.tabs applied)
 *   2. React: SceneAccordion consumes context (customStyle.accordion applied)
 *   3. React: tabs/accordion without context use default styling
 *   4. Export: HTML contains customStyle.tabs CSS strings
 *   5. Export: HTML contains customStyle.accordion CSS strings
 *   6. Export: customStyleCss JSON includes tabs + accordion keys
 *   7. Sanitizer: dangerous props blocked in tabs/accordion keys
 *   8. Prompt: AI prompt documents tabs + accordion keys
 *   9. Parity: React + export both apply tabs styling
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

import { getDesignContract } from '../core/mpi-design-contract';
import {
  SceneTabs, SceneAccordion, CustomStyleProvider,
} from '../components/scene-blocks';
import { sanitizeCustomStyle } from '../core/style/sanitize';
import { templateToBlueprint, TEMPLATE_PPKN_NORMA } from '../core/guided-flow/pedagogical-templates';
import { aiBlueprintToSimpleProject } from '../core/ai-mpi-json/aiBlueprintToSimpleProject';
import { exportProjectToHtml } from '../export/export-html';
import { buildMpiPromptText } from '../core/ai-prompt-contract/buildMpiPromptContract';

const contract = getDesignContract('modern-clean');

// ---------------------------------------------------------------------------
// React: SceneTabs consumes context
// ---------------------------------------------------------------------------

describe('COMPONENT-STYLE-01 — React: SceneTabs consumes context', () => {
  it('1. SceneTabs applies customStyle.tabs from context', () => {
    const { container } = render(
      <CustomStyleProvider value={{ tabs: { gap: '12px', background: 'rgb(100,150,200)', borderRadius: '16px' } } as any}>
        <SceneTabs contract={contract} tabs={[{ id: 'a', label: 'A' }]} activeTab="a" />
      </CustomStyleProvider>
    );
    const tabs = container.querySelector('.silse-block-tabs') as HTMLElement;
    expect(tabs).toBeTruthy();
    expect(tabs.style.gap).toContain('12px');
    expect(tabs.style.background).toContain('rgb(100, 150, 200)');
    expect(tabs.style.borderRadius).toContain('16px');
  });

  it('2. SceneTabs without context uses default styling', () => {
    const { container } = render(
      <SceneTabs contract={contract} tabs={[{ id: 'a', label: 'A' }]} activeTab="a" />
    );
    const tabs = container.querySelector('.silse-block-tabs') as HTMLElement;
    expect(tabs).toBeTruthy();
    expect(tabs.style.gap).toBe('6px'); // default
  });
});

// ---------------------------------------------------------------------------
// React: SceneAccordion consumes context
// ---------------------------------------------------------------------------

describe('COMPONENT-STYLE-01 — React: SceneAccordion consumes context', () => {
  it('3. SceneAccordion applies customStyle.accordion from context', () => {
    const { container } = render(
      <CustomStyleProvider value={{ accordion: { gap: '10px', background: 'rgb(50,100,150)' } } as any}>
        <SceneAccordion contract={contract} items={[{ title: 'T', body: 'B' }]} openIndex={null} />
      </CustomStyleProvider>
    );
    const acc = container.querySelector('.silse-block-accordion') as HTMLElement;
    expect(acc).toBeTruthy();
    expect(acc.style.gap).toContain('10px');
    expect(acc.style.background).toContain('rgb(50, 100, 150)');
  });

  it('4. SceneAccordion without context uses default styling', () => {
    const { container } = render(
      <SceneAccordion contract={contract} items={[{ title: 'T', body: 'B' }]} openIndex={null} />
    );
    const acc = container.querySelector('.silse-block-accordion') as HTMLElement;
    expect(acc).toBeTruthy();
    expect(acc.style.gap).toBe('6px'); // default
  });
});

// ---------------------------------------------------------------------------
// Export: HTML contains tabs + accordion CSS
// ---------------------------------------------------------------------------

describe('COMPONENT-STYLE-01 — Export: tabs + accordion CSS in HTML', () => {
  function buildProjectWithTabsAccordionStyle() {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    bp.scenes[0].slots[0].customStyle = {
      tabs: { gap: '14px', borderRadius: '20px' },
      accordion: { gap: '8px', background: 'rgb(200,220,240)' },
    };
    return aiBlueprintToSimpleProject(bp);
  }

  it('5. Export HTML contains customStyle.tabs CSS string', () => {
    const project = buildProjectWithTabsAccordionStyle();
    const html = exportProjectToHtml(project);
    expect(html).toContain('gap:14px');
    expect(html).toContain('border-radius:20px');
  });

  it('6. Export HTML contains customStyle.accordion CSS string', () => {
    const project = buildProjectWithTabsAccordionStyle();
    const html = exportProjectToHtml(project);
    expect(html).toContain('gap:8px');
  });

  it('7. Export HTML customStyleCss JSON includes tabs + accordion keys', () => {
    const project = buildProjectWithTabsAccordionStyle();
    const html = exportProjectToHtml(project);
    expect(html).toContain('"tabs"');
    expect(html).toContain('"accordion"');
  });
});

// ---------------------------------------------------------------------------
// Sanitizer: dangerous props blocked in tabs/accordion keys
// ---------------------------------------------------------------------------

describe('COMPONENT-STYLE-01 — Sanitizer guards tabs/accordion', () => {
  it('8. position blocked in tabs key', () => {
    const result = sanitizeCustomStyle({
      tabs: { position: 'absolute', gap: '10px' },
    });
    expect(result?.tabs?.position).toBeUndefined();
    expect(result?.tabs?.gap).toBe('10px');
  });

  it('9. display blocked in accordion key (display:none would hide)', () => {
    const result = sanitizeCustomStyle({
      accordion: { display: 'none', gap: '8px' },
    });
    expect(result?.accordion?.display).toBeUndefined();
    expect(result?.accordion?.gap).toBe('8px');
  });

  it('10. width blocked in tabs key', () => {
    const result = sanitizeCustomStyle({
      tabs: { width: '9999px', gap: '10px' },
    });
    expect(result?.tabs?.width).toBeUndefined();
    expect(result?.tabs?.gap).toBe('10px');
  });
});

// ---------------------------------------------------------------------------
// Prompt: AI documents tabs + accordion keys
// ---------------------------------------------------------------------------

describe('COMPONENT-STYLE-01 — Prompt AI documents tabs + accordion', () => {
  it('11. prompt mentions tabs element key', () => {
    const prompt = buildMpiPromptText();
    expect(prompt).toContain('"tabs"');
  });

  it('12. prompt mentions accordion element key', () => {
    const prompt = buildMpiPromptText();
    expect(prompt).toContain('"accordion"');
  });

  it('13. prompt documents COMPONENT-STYLE-01 section', () => {
    const prompt = buildMpiPromptText();
    expect(prompt).toContain('COMPONENT-STYLE-01');
  });

  it('14. prompt shows tabs example in customStyle', () => {
    const prompt = buildMpiPromptText();
    expect(prompt).toContain('"tabs": { "gap"');
  });
});

// ---------------------------------------------------------------------------
// Parity: React + export both apply tabs styling
// ---------------------------------------------------------------------------

describe('COMPONENT-STYLE-01 — Parity: React + export both apply tabs', () => {
  it('15. React SceneTabs and export exportTabs both apply gap from customStyle', () => {
    const customStyle = { tabs: { gap: '18px' } };

    // React side
    const { container } = render(
      <CustomStyleProvider value={customStyle as any}>
        <SceneTabs contract={contract} tabs={[{ id: 'a', label: 'A' }]} activeTab="a" />
      </CustomStyleProvider>
    );
    const reactTabs = container.querySelector('.silse-block-tabs') as HTMLElement;
    expect(reactTabs.style.gap).toContain('18px');

    // Export side
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    bp.scenes[0].slots[0].customStyle = customStyle;
    const project = aiBlueprintToSimpleProject(bp);
    const html = exportProjectToHtml(project);
    expect(html).toContain('gap:18px');
  });
});
