/**
 * DEEP-STYLE-INJECTION-01 — customStyle reaches all 5 element keys (shell/header/panel/chip/button)
 * via CustomStyleContext in React, AND via _sceneCustomStyle closure in export.
 *
 * Problem found in senior advisor audit:
 *   FASE 3 sanitizer + scene-blocks integration was solid (25 tests pass),
 *   BUT scene-composers/index.tsx had ZERO customStyle references.
 *   SceneRendererView only wrapped the composer result in a div with customStyle.shell.
 *   Header/Panel/Chip/Button inside composers got NO customStyle.
 *
 * Fix: CustomStyleContext (React) + _sceneCustomStyle closure (export).
 *   - SceneShell, SceneHeader, ScenePanel, SceneChip, ActionButtonBlock all
 *     consume context as fallback when no explicit customStyle prop.
 *   - exportShell, exportHeader, exportPanel, exportActionButton read
 *     _sceneCustomStyle closure variable set by renderSceneFromPlan.
 *   - customStyle is pre-sanitized at build time in buildExportRenderModel
 *     (browser JS has no access to sanitize module).
 *
 * This test verifies:
 *   1. React: each block picks up customStyle from context (no explicit prop needed)
 *   2. React: composer (CurriculumGuideComposer) flows customStyle to all blocks inside
 *   3. Export: HTML output contains customStyle values for all 5 element keys
 *   4. Sanitizer: dangerous props blocked even via context flow
 *   5. Parity: both React and export apply customStyle
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

import { getDesignContract } from '../core/mpi-design-contract';
import {
  SceneShell, SceneHeader, ScenePanel, SceneChip, ActionButtonBlock,
  CustomStyleProvider,
} from '../components/scene-blocks';
import { CurriculumGuideComposer } from '../components/scene-composers';
import { templateToBlueprint, TEMPLATE_PPKN_NORMA } from '../core/guided-flow/pedagogical-templates';
import { aiBlueprintToSimpleProject } from '../core/ai-mpi-json/aiBlueprintToSimpleProject';
import { exportProjectToHtml } from '../export/export-html';

const contract = getDesignContract('modern-clean');

const TEST_CUSTOM_STYLE = {
  shell: { background: 'linear-gradient(135deg, #667eea, #764ba2)' },
  header: { borderBottom: '4px solid #ff00ff' },
  panel: { borderRadius: '32px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  chip: { background: 'rgb(0,255,136)', color: 'rgb(255,0,68)' },
  button: { background: 'linear-gradient(135deg, #aa00ff, #00aaff)', borderRadius: '8px' },
} as const;

// ---------------------------------------------------------------------------
// React side: each block consumes CustomStyleContext
// ---------------------------------------------------------------------------

describe('DEEP-STYLE-INJECTION-01 — React: SceneShell consumes context', () => {
  it('1. SceneShell applies customStyle.shell from context (no explicit prop)', () => {
    const { container } = render(
      <CustomStyleProvider value={TEST_CUSTOM_STYLE as any}>
        <SceneShell contract={contract}>content</SceneShell>
      </CustomStyleProvider>
    );
    const shell = container.querySelector('.silse-block-shell') as HTMLElement;
    expect(shell).toBeTruthy();
    expect(shell.style.background).toContain('linear-gradient(135deg, #667eea, #764ba2)');
  });

  it('2. SceneShell without context has no customStyle override', () => {
    const { container } = render(
      <SceneShell contract={contract}>content</SceneShell>
    );
    const shell = container.querySelector('.silse-block-shell') as HTMLElement;
    expect(shell).toBeTruthy();
    // Default background is a radial-gradient, not the test gradient
    expect(shell.style.background).not.toContain('#667eea');
  });
});

describe('DEEP-STYLE-INJECTION-01 — React: SceneHeader consumes context', () => {
  it('3. SceneHeader applies customStyle.header from context', () => {
    const { container } = render(
      <CustomStyleProvider value={TEST_CUSTOM_STYLE as any}>
        <SceneHeader contract={contract} chipLabel="Test" title="Title" />
      </CustomStyleProvider>
    );
    const header = container.querySelector('.silse-block-header') as HTMLElement;
    expect(header).toBeTruthy();
    expect(header.style.borderBottom).toContain('4px solid rgb(255, 0, 255)');
  });

  it('4. SceneHeader applies customStyle.chip to chip element from context', () => {
    const { container } = render(
      <CustomStyleProvider value={TEST_CUSTOM_STYLE as any}>
        <SceneHeader contract={contract} chipLabel="TestChip" title="Title" />
      </CustomStyleProvider>
    );
    const chip = container.querySelector('.silse-block-chip') as HTMLElement;
    expect(chip).toBeTruthy();
    expect(chip.style.background).toContain('rgb(0, 255, 136)');
    expect(chip.style.color).toContain('rgb(255, 0, 68)');
  });
});

describe('DEEP-STYLE-INJECTION-01 — React: ScenePanel consumes context', () => {
  it('5. ScenePanel applies customStyle.panel from context', () => {
    const { container } = render(
      <CustomStyleProvider value={TEST_CUSTOM_STYLE as any}>
        <ScenePanel contract={contract}>body</ScenePanel>
      </CustomStyleProvider>
    );
    const panel = container.querySelector('.silse-block-panel') as HTMLElement;
    expect(panel).toBeTruthy();
    expect(panel.style.borderRadius).toContain('32px');
    expect(panel.style.boxShadow).toContain('0 20px 60px rgba(0,0,0,0.3)');
  });
});

describe('DEEP-STYLE-INJECTION-01 — React: SceneChip consumes context', () => {
  it('6. SceneChip applies customStyle.chip from context', () => {
    const { container } = render(
      <CustomStyleProvider value={TEST_CUSTOM_STYLE as any}>
        <SceneChip contract={contract} label="ChipLabel" />
      </CustomStyleProvider>
    );
    const chip = container.querySelector('.silse-block-chip') as HTMLElement;
    expect(chip).toBeTruthy();
    expect(chip.style.background).toContain('rgb(0, 255, 136)');
    expect(chip.style.color).toContain('rgb(255, 0, 68)');
  });

  it('7. SceneChip without context uses default badge background', () => {
    const { container } = render(
      <SceneChip contract={contract} label="ChipLabel" />
    );
    const chip = container.querySelector('.silse-block-chip') as HTMLElement;
    expect(chip).toBeTruthy();
    expect(chip.style.background).not.toContain('rgb(0, 255, 136)');
  });
});

describe('DEEP-STYLE-INJECTION-01 — React: ActionButtonBlock consumes context', () => {
  it('8. ActionButtonBlock applies customStyle.button from context', () => {
    const { container } = render(
      <CustomStyleProvider value={TEST_CUSTOM_STYLE as any}>
        <ActionButtonBlock contract={contract} label="Click" />
      </CustomStyleProvider>
    );
    const btn = container.querySelector('.silse-block-action') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.style.background).toContain('linear-gradient(135deg, #aa00ff, #00aaff)');
    expect(btn.style.borderRadius).toContain('8px');
  });
});

// ---------------------------------------------------------------------------
// React side: composer flows customStyle to all blocks inside
// ---------------------------------------------------------------------------

describe('DEEP-STYLE-INJECTION-01 — React: Composer flows customStyle via context', () => {
  it('9. CurriculumGuideComposer with CustomStyleProvider styles shell+header+panel', () => {
    const content = {
      curriculumTitle: 'Test Curriculum',
      competency: 'Test competency',
      profileTags: ['Tag1', 'Tag2'],
    };
    const { container } = render(
      <CustomStyleProvider value={TEST_CUSTOM_STYLE as any}>
        <CurriculumGuideComposer contract={contract} content={content} />
      </CustomStyleProvider>
    );

    // Shell gets shell style
    const shell = container.querySelector('.silse-block-shell') as HTMLElement;
    expect(shell).toBeTruthy();
    expect(shell.style.background).toContain('#667eea');

    // Header gets header style
    const header = container.querySelector('.silse-block-header') as HTMLElement;
    expect(header).toBeTruthy();
    expect(header.style.borderBottom).toContain('4px solid rgb(255, 0, 255)');

    // Panel gets panel style
    const panel = container.querySelector('.silse-block-panel') as HTMLElement;
    expect(panel).toBeTruthy();
    expect(panel.style.borderRadius).toContain('32px');

    // Chips (profile tags) get chip style
    const chips = container.querySelectorAll('.silse-block-chip');
    expect(chips.length).toBeGreaterThan(0);
    const chip = chips[chips.length - 1] as HTMLElement; // profile tag chips are after header chip
    expect(chip.style.background).toContain('rgb(0, 255, 136)');
  });

  it('10. Composer WITHOUT CustomStyleProvider renders with default styles (no crash)', () => {
    const content = { curriculumTitle: 'Default' };
    const { container } = render(
      <CurriculumGuideComposer contract={contract} content={content} />
    );
    const shell = container.querySelector('.silse-block-shell') as HTMLElement;
    expect(shell).toBeTruthy();
    // Default background is radial-gradient, not test gradient
    expect(shell.style.background).not.toContain('#667eea');
  });
});

// ---------------------------------------------------------------------------
// React side: sanitizer blocks dangerous props via context
// ---------------------------------------------------------------------------

describe('DEEP-STYLE-INJECTION-01 — React: Sanitizer guards context flow', () => {
  it('11. Dangerous position prop is blocked in context flow', () => {
    const malicious = {
      shell: { position: 'fixed', background: 'rgb(10,20,30)' },
    };
    const { container } = render(
      <CustomStyleProvider value={malicious as any}>
        <SceneShell contract={contract}>x</SceneShell>
      </CustomStyleProvider>
    );
    const shell = container.querySelector('.silse-block-shell') as HTMLElement;
    expect(shell.style.position).toBe('');  // position is blocked
    expect(shell.style.background).toContain('rgb(10, 20, 30)');  // safe prop passes
  });

  it('12. Dangerous display prop is blocked in context flow', () => {
    const malicious = {
      panel: { display: 'none', borderRadius: '20px' },
    };
    const { container } = render(
      <CustomStyleProvider value={malicious as any}>
        <ScenePanel contract={contract}>x</ScenePanel>
      </CustomStyleProvider>
    );
    const panel = container.querySelector('.silse-block-panel') as HTMLElement;
    // display is flex by default (from block), not 'none'
    expect(panel.style.display).not.toBe('none');
    expect(panel.style.borderRadius).toContain('20px');  // safe prop passes
  });

  it('13. Forbidden font (Comic Sans) is blocked in context flow', () => {
    const malicious = {
      header: { fontFamily: 'Comic Sans MS, cursive', color: 'rgb(1,2,3)' },
    };
    const { container } = render(
      <CustomStyleProvider value={malicious as any}>
        <SceneHeader contract={contract} title="T" />
      </CustomStyleProvider>
    );
    const header = container.querySelector('.silse-block-header') as HTMLElement;
    expect(header.style.fontFamily).not.toContain('Comic Sans');
    expect(header.style.color).toContain('rgb(1, 2, 3)');  // safe prop passes
  });
});

// ---------------------------------------------------------------------------
// Export side: all 5 element keys appear in HTML output
// ---------------------------------------------------------------------------

describe('DEEP-STYLE-INJECTION-01 — Export: all 5 keys reach HTML', () => {
  function buildProjectWithCustomStyle(customStyle: Record<string, Record<string, string>>) {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    bp.scenes[0].slots[0].customStyle = customStyle;
    return aiBlueprintToSimpleProject(bp);
  }

  it('14. Export HTML contains customStyle.shell value', () => {
    const project = buildProjectWithCustomStyle({
      shell: { background: 'linear-gradient(135deg, #exps1, #exps2)' },
    });
    const html = exportProjectToHtml(project);
    expect(html).toContain('#exps1');
    expect(html).toContain('#exps2');
  });

  it('15. Export HTML contains customStyle.header value', () => {
    const project = buildProjectWithCustomStyle({
      header: { borderBottom: '5px solid #abcdef' },
    });
    const html = exportProjectToHtml(project);
    expect(html).toContain('#abcdef');
  });

  it('16. Export HTML contains customStyle.panel value', () => {
    const project = buildProjectWithCustomStyle({
      panel: { borderRadius: '37px' },
    });
    const html = exportProjectToHtml(project);
    expect(html).toContain('border-radius:37px');
  });

  it('17. Export HTML contains customStyle.chip value', () => {
    const project = buildProjectWithCustomStyle({
      chip: { background: '#expchipbg' },
    });
    const html = exportProjectToHtml(project);
    expect(html).toContain('#expchipbg');
  });

  it('18. Export HTML contains customStyle.button value', () => {
    const project = buildProjectWithCustomStyle({
      button: { background: 'linear-gradient(135deg, #expbtn1, #expbtn2)' },
    });
    const html = exportProjectToHtml(project);
    expect(html).toContain('#expbtn1');
    expect(html).toContain('#expbtn2');
  });

  it('19. Export HTML contains ALL 5 keys when all set together', () => {
    const project = buildProjectWithCustomStyle({
      shell: { background: 'linear-gradient(135deg, #112233, #445566)' },
      header: { borderBottom: '3px solid #aabbcc' },
      panel: { borderRadius: '41px' },
      chip: { background: '#ccddee' },
      button: { background: 'linear-gradient(135deg, #ff0011, #1100ff)' },
    });
    const html = exportProjectToHtml(project);
    expect(html).toContain('#112233');
    expect(html).toContain('#aabbcc');
    expect(html).toContain('border-radius:41px');
    expect(html).toContain('#ccddee');
    expect(html).toContain('#ff0011');
  });
});

// ---------------------------------------------------------------------------
// Export side: sanitizer pre-filters at build time
// ---------------------------------------------------------------------------

describe('DEEP-STYLE-INJECTION-01 — Export: sanitizer pre-filters at build time', () => {
  it('20. Dangerous position prop does NOT reach export HTML', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    bp.scenes[0].slots[0].customStyle = {
      shell: { position: 'fixed', background: '#safebg' },
    };
    const project = aiBlueprintToSimpleProject(bp);
    const html = exportProjectToHtml(project);
    // #safebg should appear (sanitized customStyle still has it)
    expect(html).toContain('#safebg');
    // 'position:fixed' should NOT appear as a customStyle application
    // (the scene element has position:absolute from layout, but not 'position:fixed')
    expect(html).not.toContain('position:fixed');
  });

  it('21. Dangerous display:none does NOT reach customStyle CSS in export HTML', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    bp.scenes[0].slots[0].customStyle = {
      panel: { display: 'none', borderRadius: '22px' },
    };
    const project = aiBlueprintToSimpleProject(bp);
    const html = exportProjectToHtml(project);
    // borderRadius passes (sanitized) — appears as pre-computed CSS string
    expect(html).toContain('border-radius:22px');
    // display:none should NOT appear in the customStyleCss JSON field.
    // Check that the customStyleCss panel value does NOT contain 'display:none'.
    // The customStyleCss is embedded as JSON — extract the panel value.
    // We verify by checking that 'display:none' is NOT immediately before 'border-radius:22px'
    // in the same CSS string (the customStyleCss.panel value).
    // Simpler: the sanitized customStyleCss.panel should be 'border-radius:22px' only.
    const panelCssMatch = html.match(/"panel":"([^"]*)"/);
    if (panelCssMatch) {
      expect(panelCssMatch[1]).not.toContain('display');
      expect(panelCssMatch[1]).toContain('border-radius:22px');
    }
  });
});

// ---------------------------------------------------------------------------
// Parity: React and export both apply customStyle
// ---------------------------------------------------------------------------

describe('DEEP-STYLE-INJECTION-01 — Parity: React + export both apply', () => {
  it('22. React ScenePanel and export exportPanel both apply borderRadius from customStyle', () => {
    const customStyle = { panel: { borderRadius: '55px' } };

    // React side
    const { container } = render(
      <CustomStyleProvider value={customStyle as any}>
        <ScenePanel contract={contract}>x</ScenePanel>
      </CustomStyleProvider>
    );
    const reactPanel = container.querySelector('.silse-block-panel') as HTMLElement;
    expect(reactPanel.style.borderRadius).toContain('55px');

    // Export side
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    bp.scenes[0].slots[0].customStyle = customStyle;
    const project = aiBlueprintToSimpleProject(bp);
    const html = exportProjectToHtml(project);
    expect(html).toContain('border-radius:55px');
  });

  it('23. React SceneChip and export exportHeader chip both apply chip background', () => {
    const customStyle = { chip: { background: 'rgb(100,150,200)' } };

    // React side
    const { container } = render(
      <CustomStyleProvider value={customStyle as any}>
        <SceneChip contract={contract} label="L" />
      </CustomStyleProvider>
    );
    const reactChip = container.querySelector('.silse-block-chip') as HTMLElement;
    expect(reactChip.style.background).toContain('rgb(100, 150, 200)');

    // Export side
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    bp.scenes[0].slots[0].customStyle = customStyle;
    const project = aiBlueprintToSimpleProject(bp);
    const html = exportProjectToHtml(project);
    expect(html).toContain('rgb(100,150,200)');
  });
});
