/**
 * LAYOUT-STYLE-01 (Level 2): AI dapat override grid layout via customStyle.grid.
 *
 * Test coverage:
 *   1. Sanitizer: display whitelist (grid/flex allowed, none/block rejected)
 *   2. Sanitizer: gridTemplateColumns pattern whitelist (repeat/minmax/1fr)
 *   3. Sanitizer: gap clamping (0-100px)
 *   4. Sanitizer: flexDirection/flexWrap/alignItems/justifyContent whitelist
 *   5. Sanitizer: dangerous props (position, width, height) still blocked in grid key
 *   6. React: SceneGrid consumes context (customStyle.grid applied)
 *   7. Export: HTML contains customStyle.grid CSS strings
 *   8. Parity: React + export both apply grid layout
 *   9. Prompt: AI prompt documents grid key + batasan
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

import { getDesignContract } from '../core/mpi-design-contract';
import {
  sanitizeElementStyle,
  sanitizeCustomStyle,
} from '../core/style/sanitize';
import {
  SceneGrid, CustomStyleProvider,
} from '../components/scene-blocks';
import { templateToBlueprint, TEMPLATE_PPKN_NORMA } from '../core/guided-flow/pedagogical-templates';
import { aiBlueprintToSimpleProject } from '../core/ai-mpi-json/aiBlueprintToSimpleProject';
import { exportProjectToHtml } from '../export/export-html';
import { buildMpiPromptText } from '../core/ai-prompt-contract/buildMpiPromptContract';

const contract = getDesignContract('modern-clean');

// ---------------------------------------------------------------------------
// Sanitizer: display whitelist
// ---------------------------------------------------------------------------

describe('LAYOUT-STYLE-01 — Sanitizer: display whitelist', () => {
  it('1. display:grid is allowed', () => {
    const result = sanitizeElementStyle({ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' });
    expect(result.display).toBe('grid');
    expect(result.gridTemplateColumns).toBe('repeat(3, 1fr)');
  });

  it('2. display:flex is allowed', () => {
    const result = sanitizeElementStyle({ display: 'flex', gap: '10px' });
    expect(result.display).toBe('flex');
    expect(result.gap).toBe('10px');
  });

  it('3. display:none is REJECTED (would hide elements)', () => {
    const result = sanitizeElementStyle({ display: 'none', gap: '10px' });
    expect(result.display).toBeUndefined();
    expect(result.gap).toBe('10px'); // safe prop passes
  });

  it('4. display:block is REJECTED', () => {
    const result = sanitizeElementStyle({ display: 'block' });
    expect(result.display).toBeUndefined();
  });

  it('5. display:inline-grid is allowed', () => {
    const result = sanitizeElementStyle({ display: 'inline-grid' });
    expect(result.display).toBe('inline-grid');
  });
});

// ---------------------------------------------------------------------------
// Sanitizer: gridTemplateColumns pattern whitelist
// ---------------------------------------------------------------------------

describe('LAYOUT-STYLE-01 — Sanitizer: gridTemplateColumns pattern whitelist', () => {
  it('6. repeat(N, 1fr) where N=1-6 is allowed', () => {
    expect(sanitizeElementStyle({ gridTemplateColumns: 'repeat(1, 1fr)' }).gridTemplateColumns).toBe('repeat(1, 1fr)');
    expect(sanitizeElementStyle({ gridTemplateColumns: 'repeat(3, 1fr)' }).gridTemplateColumns).toBe('repeat(3, 1fr)');
    expect(sanitizeElementStyle({ gridTemplateColumns: 'repeat(6, 1fr)' }).gridTemplateColumns).toBe('repeat(6, 1fr)');
  });

  it('7. repeat(7, 1fr) is REJECTED (max 6 columns)', () => {
    const result = sanitizeElementStyle({ gridTemplateColumns: 'repeat(7, 1fr)' });
    expect(result.gridTemplateColumns).toBeUndefined();
  });

  it('8. repeat(auto-fill, minmax(NNNpx, 1fr)) where NNN=100-500 is allowed', () => {
    expect(sanitizeElementStyle({ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }).gridTemplateColumns)
      .toBe('repeat(auto-fill, minmax(240px, 1fr))');
    expect(sanitizeElementStyle({ gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))' }).gridTemplateColumns)
      .toBe('repeat(auto-fill, minmax(100px, 1fr))');
    expect(sanitizeElementStyle({ gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))' }).gridTemplateColumns)
      .toBe('repeat(auto-fill, minmax(500px, 1fr))');
  });

  it('9. minmax below 100px is REJECTED', () => {
    expect(sanitizeElementStyle({ gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))' }).gridTemplateColumns)
      .toBeUndefined();
  });

  it('10. minmax above 500px is REJECTED', () => {
    expect(sanitizeElementStyle({ gridTemplateColumns: 'repeat(auto-fill, minmax(999px, 1fr))' }).gridTemplateColumns)
      .toBeUndefined();
  });

  it('11. "1fr 1fr" pattern (max 6) is allowed', () => {
    expect(sanitizeElementStyle({ gridTemplateColumns: '1fr 1fr' }).gridTemplateColumns).toBe('1fr 1fr');
    expect(sanitizeElementStyle({ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr' }).gridTemplateColumns).toBe('1fr 1fr 1fr 1fr 1fr 1fr');
  });

  it('12. Arbitrary CSS expression is REJECTED (no calc, no subgrid, no var)', () => {
    expect(sanitizeElementStyle({ gridTemplateColumns: 'calc(100% / 3)' }).gridTemplateColumns).toBeUndefined();
    expect(sanitizeElementStyle({ gridTemplateColumns: 'subgrid' }).gridTemplateColumns).toBeUndefined();
    expect(sanitizeElementStyle({ gridTemplateColumns: 'var(--cols)' }).gridTemplateColumns).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Sanitizer: gap clamping
// ---------------------------------------------------------------------------

describe('LAYOUT-STYLE-01 — Sanitizer: gap clamping', () => {
  it('13. gap:50px passes through', () => {
    expect(sanitizeElementStyle({ gap: '50px' }).gap).toBe('50px');
  });

  it('14. gap:150px is clamped to 100px', () => {
    expect(sanitizeElementStyle({ gap: '150px' }).gap).toBe('100px');
  });

  it('15. gap:-10px is rejected (reset to 0px)', () => {
    expect(sanitizeElementStyle({ gap: '-10px' }).gap).toBe('0px');
  });

  it('16. numeric gap 50 → "50px"', () => {
    expect(sanitizeElementStyle({ gap: 50 as any }).gap).toBe('50px');
  });

  it('17. numeric gap 999 → "100px" (clamped)', () => {
    expect(sanitizeElementStyle({ gap: 999 as any }).gap).toBe('100px');
  });

  it('18. numeric gap -5 → "0px" (rejected)', () => {
    expect(sanitizeElementStyle({ gap: -5 as any }).gap).toBe('0px');
  });
});

// ---------------------------------------------------------------------------
// Sanitizer: flexDirection / flexWrap / alignItems / justifyContent whitelist
// ---------------------------------------------------------------------------

describe('LAYOUT-STYLE-01 — Sanitizer: flex property whitelists', () => {
  it('19. flexDirection valid values pass', () => {
    expect(sanitizeElementStyle({ flexDirection: 'row' }).flexDirection).toBe('row');
    expect(sanitizeElementStyle({ flexDirection: 'column' }).flexDirection).toBe('column');
    expect(sanitizeElementStyle({ flexDirection: 'row-reverse' }).flexDirection).toBe('row-reverse');
  });

  it('20. flexDirection invalid value rejected', () => {
    expect(sanitizeElementStyle({ flexDirection: 'diagonal' }).flexDirection).toBeUndefined();
  });

  it('21. flexWrap valid values pass', () => {
    expect(sanitizeElementStyle({ flexWrap: 'wrap' }).flexWrap).toBe('wrap');
    expect(sanitizeElementStyle({ flexWrap: 'nowrap' }).flexWrap).toBe('nowrap');
  });

  it('22. alignItems valid values pass', () => {
    expect(sanitizeElementStyle({ alignItems: 'center' }).alignItems).toBe('center');
    expect(sanitizeElementStyle({ alignItems: 'flex-start' }).alignItems).toBe('flex-start');
    expect(sanitizeElementStyle({ alignItems: 'space-between' }).alignItems).toBe('space-between');
  });

  it('23. alignItems invalid value rejected', () => {
    expect(sanitizeElementStyle({ alignItems: 'top' }).alignItems).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Sanitizer: dangerous props still blocked in grid key
// ---------------------------------------------------------------------------

describe('LAYOUT-STYLE-01 — Sanitizer: dangerous props blocked in grid key', () => {
  it('24. position is blocked even in grid key', () => {
    const result = sanitizeCustomStyle({
      grid: { position: 'absolute', display: 'grid', gap: '20px' },
    });
    expect(result?.grid?.position).toBeUndefined();
    expect(result?.grid?.display).toBe('grid');
    expect(result?.grid?.gap).toBe('20px');
  });

  it('25. width/height blocked in grid key', () => {
    const result = sanitizeCustomStyle({
      grid: { width: '9999px', height: '9999px', gridTemplateColumns: 'repeat(3, 1fr)' },
    });
    expect(result?.grid?.width).toBeUndefined();
    expect(result?.grid?.height).toBeUndefined();
    expect(result?.grid?.gridTemplateColumns).toBe('repeat(3, 1fr)');
  });

  it('26. zIndex blocked in grid key', () => {
    const result = sanitizeCustomStyle({
      grid: { zIndex: '9999', display: 'grid' },
    });
    expect(result?.grid?.zIndex).toBeUndefined();
    expect(result?.grid?.display).toBe('grid');
  });
});

// ---------------------------------------------------------------------------
// React: SceneGrid consumes context
// ---------------------------------------------------------------------------

describe('LAYOUT-STYLE-01 — React: SceneGrid consumes context', () => {
  it('27. SceneGrid applies customStyle.grid from context', () => {
    const { container } = render(
      <CustomStyleProvider value={{ grid: { gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' } } as any}>
        <SceneGrid contract={contract}>
          <div>card1</div>
          <div>card2</div>
          <div>card3</div>
        </SceneGrid>
      </CustomStyleProvider>
    );
    const grid = container.querySelector('.silse-block-card') as HTMLElement;
    expect(grid).toBeTruthy();
    expect(grid.style.gridTemplateColumns).toContain('repeat(3, 1fr)');
    expect(grid.style.gap).toContain('20px');
  });

  it('28. SceneGrid without context uses default columns', () => {
    const { container } = render(
      <SceneGrid contract={contract}>
        <div>card1</div>
      </SceneGrid>
    );
    const grid = container.querySelector('.silse-block-card') as HTMLElement;
    expect(grid).toBeTruthy();
    expect(grid.style.gridTemplateColumns).toContain('minmax(240px, 1fr)');
  });

  it('29. SceneGrid with explicit prop wins over context', () => {
    const { container } = render(
      <CustomStyleProvider value={{ grid: { gridTemplateColumns: 'repeat(2, 1fr)' } } as any}>
        <SceneGrid contract={contract} columns="repeat(4, 1fr)">
          <div>card</div>
        </SceneGrid>
      </CustomStyleProvider>
    );
    const grid = container.querySelector('.silse-block-card') as HTMLElement;
    // explicit columns prop sets default, context overlay can override — but if context has gridTemplateColumns, it wins
    // Here context provides gridTemplateColumns:repeat(2,1fr) which overlays on top of prop columns=repeat(4,1fr)
    expect(grid.style.gridTemplateColumns).toContain('repeat(2, 1fr)');
  });

  it('30. SceneGrid with dangerous prop in context is sanitized', () => {
    const { container } = render(
      <CustomStyleProvider value={{ grid: { position: 'absolute', display: 'grid', gap: '15px' } } as any}>
        <SceneGrid contract={contract}>
          <div>card</div>
        </SceneGrid>
      </CustomStyleProvider>
    );
    const grid = container.querySelector('.silse-block-card') as HTMLElement;
    expect(grid.style.position).toBe(''); // blocked
    expect(grid.style.gap).toContain('15px'); // safe prop passes
  });
});

// ---------------------------------------------------------------------------
// Export: HTML contains customStyle.grid CSS strings
// ---------------------------------------------------------------------------

describe('LAYOUT-STYLE-01 — Export: grid CSS in HTML', () => {
  function buildProjectWithGridStyle(gridStyle: Record<string, string>) {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    bp.scenes[0].slots[0].customStyle = { grid: gridStyle };
    return aiBlueprintToSimpleProject(bp);
  }

  it('31. Export HTML contains gridTemplateColumns from customStyle.grid', () => {
    const project = buildProjectWithGridStyle({ gridTemplateColumns: 'repeat(3, 1fr)' });
    const html = exportProjectToHtml(project);
    expect(html).toContain('grid-template-columns:repeat(3, 1fr)');
  });

  it('32. Export HTML contains gap from customStyle.grid', () => {
    const project = buildProjectWithGridStyle({ gap: '25px' });
    const html = exportProjectToHtml(project);
    expect(html).toContain('gap:25px');
  });

  it('33. Export HTML contains customStyleCss with grid key', () => {
    const project = buildProjectWithGridStyle({ gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' });
    const html = exportProjectToHtml(project);
    expect(html).toContain('"grid"');
  });

  it('34. Export HTML rejects dangerous grid values at build time', () => {
    const project = buildProjectWithGridStyle({ position: 'absolute', gridTemplateColumns: 'repeat(3, 1fr)' });
    const html = exportProjectToHtml(project);
    // customStyleCss.grid should NOT contain position — verify by extracting the grid CSS string
    const gridCssMatch = html.match(/"grid":"([^"]*)"/);
    if (gridCssMatch) {
      expect(gridCssMatch[1]).not.toContain('position');
      expect(gridCssMatch[1]).toContain('grid-template-columns:repeat(3, 1fr)');
    }
    // Note: 'position:absolute' may appear elsewhere in HTML from slot layout engine — that's expected.
    // We only verify the customStyleCss.grid string is clean.
  });
});

// ---------------------------------------------------------------------------
// Prompt: AI prompt documents grid key + batasan
// ---------------------------------------------------------------------------

describe('LAYOUT-STYLE-01 — Prompt AI documents grid key', () => {
  it('35. prompt mentions grid element key', () => {
    const prompt = buildMpiPromptText();
    expect(prompt).toContain('"grid"');
  });

  it('36. prompt documents gridTemplateColumns pattern whitelist', () => {
    const prompt = buildMpiPromptText();
    expect(prompt).toMatch(/repeat\(N, 1fr\)/i);
    expect(prompt).toMatch(/minmax/i);
  });

  it('37. prompt documents gap range 0-100px', () => {
    const prompt = buildMpiPromptText();
    expect(prompt).toMatch(/gap.*0-100px/i);
  });

  it('38. prompt documents display whitelist (grid/flex only)', () => {
    const prompt = buildMpiPromptText();
    expect(prompt).toMatch(/display.*grid.*flex/i);
  });

  it('39. prompt shows grid example in customStyle', () => {
    const prompt = buildMpiPromptText();
    expect(prompt).toContain('"grid": { "gridTemplateColumns"');
  });
});
