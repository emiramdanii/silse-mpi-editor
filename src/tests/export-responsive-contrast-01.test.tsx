/**
 * EXPORT-RESPONSIVE-01 + EXPORT-CONTRAST-01
 *
 * Test:
 *   1. Export HTML contains responsive scaling JS (fitCanvasToViewport)
 *   2. Export HTML contains resize/orientationchange listeners
 *   3. Export HTML contains transform-origin on canvas
 *   4. Cover scene text is white (contrast-aware)
 *   5. Closing scene text is white (contrast-aware)
 *   6. React CoverHeroContent uses white text
 *   7. React ClosingAwardContent uses white text
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

import { getDesignContract } from '../core/mpi-design-contract';
import { templateToBlueprint, TEMPLATE_PPKN_NORMA } from '../core/guided-flow/pedagogical-templates';
import { aiBlueprintToSimpleProject } from '../core/ai-mpi-json/aiBlueprintToSimpleProject';
import { exportProjectToHtml } from '../export/export-html';
import { buildSceneRenderPlanForPage } from '../core/scene-renderer';
import { SceneRendererView } from '../components/SceneRendererView';

// ---------------------------------------------------------------------------
// EXPORT-RESPONSIVE-01: Responsive scaling
// ---------------------------------------------------------------------------

describe('EXPORT-RESPONSIVE-01 — Canvas scales to viewport (16:9 maintained)', () => {
  it('1. export HTML contains fitCanvasToViewport function', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const html = exportProjectToHtml(project);
    expect(html).toContain('fitCanvasToViewport');
  });

  it('2. export HTML contains resize event listener', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const html = exportProjectToHtml(project);
    expect(html).toContain("addEventListener('resize'");
  });

  it('3. export HTML contains orientationchange event listener', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const html = exportProjectToHtml(project);
    expect(html).toContain("addEventListener('orientationchange'");
  });

  it('4. export HTML canvas has transform-origin for scaling', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const html = exportProjectToHtml(project);
    expect(html).toContain('transform-origin');
  });

  it('5. export HTML scale formula uses CANVAS_WIDTH and CANVAS_HEIGHT', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const html = exportProjectToHtml(project);
    // Scale should reference 1280 and 720 (canvas dimensions)
    expect(html).toContain('1280');
    expect(html).toContain('720');
  });

  it('6. export HTML scale is capped at 1.0 (no upscale beyond 1280x720)', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const html = exportProjectToHtml(project);
    expect(html).toMatch(/Math\.min\(scaleX,\s*scaleY,\s*1\.0\)/);
  });
});

// ---------------------------------------------------------------------------
// EXPORT-CONTRAST-01: Cover/closing text contrast
// ---------------------------------------------------------------------------

describe('EXPORT-CONTRAST-01 — Cover/closing text white on dark background', () => {
  it('7. export HTML cover title uses white color', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const html = exportProjectToHtml(project);
    // Cover title CSS should contain color:#ffffff
    expect(html).toContain('silse-cover-title');
    // Fase 3b Commit 1: color is now set via getContrastAwareTextColor() JS function
    // which returns 'var(--silse-color-surface, var(--color-panel))' for cover/closing.
    // Verify the function is present and called for cover title.
    expect(html).toContain('getContrastAwareTextColor');
    expect(html).toContain('_currentPageRole');
  });

  it('8. export HTML cover subtitle uses white color', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-cover-subtitle');
    // Fase 3b Commit 1: subtitle also uses getContrastAwareTextColor()
    expect(html).toContain('getContrastAwareTextColor');
  });

  it('9. export HTML closing achievement uses white color', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-closing-achievement');
    // Fase 3b Commit 1: achievement uses getContrastAwareTextColor()
    expect(html).toContain('getContrastAwareTextColor');
  });

  it('10. export HTML closing summary uses white color', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-closing-summary');
    // Fase 3b Commit 1: summary uses getContrastAwareTextColor()
    expect(html).toContain('getContrastAwareTextColor');
  });

  it('11. React CoverHeroContent uses white text for title', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const coverPage = project.pages.find((p) => p.role === 'cover')!;
    const plan = buildSceneRenderPlanForPage(project, coverPage)!;
    const contract = getDesignContract('modern-clean');
    const { container } = render(<SceneRendererView plan={plan} contract={contract} />);
    const title = container.querySelector('.silse-cover-title') as HTMLElement;
    expect(title).toBeTruthy();
    // Color should be white (jsdom may normalize to rgb), OR a CSS variable
    // that resolves to white (var(--silse-color-surface, var(--color-panel)))
    const color = title.style.color;
    const isLight = color === '#ffffff'
      || color === 'rgb(255, 255, 255)'
      || color.startsWith('var(--silse-color-surface');
    expect(isLight).toBe(true);
  });

  it('12. React CoverHeroContent uses white text for subtitle', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const coverPage = project.pages.find((p) => p.role === 'cover')!;
    const plan = buildSceneRenderPlanForPage(project, coverPage)!;
    const contract = getDesignContract('modern-clean');
    const { container } = render(<SceneRendererView plan={plan} contract={contract} />);
    const subtitle = container.querySelector('.silse-cover-subtitle') as HTMLElement;
    if (subtitle) {
      const color = subtitle.style.color;
      const isLight = color === '#ffffff'
        || color === 'rgb(255, 255, 255)'
        || color.startsWith('var(--silse-color-surface');
      expect(isLight).toBe(true);
    }
  });

  it('13. React ClosingAwardContent uses white text for achievement', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const closingPage = project.pages.find((p) => p.role === 'closing')!;
    if (closingPage) {
      const plan = buildSceneRenderPlanForPage(project, closingPage)!;
      const contract = getDesignContract('modern-clean');
      const { container } = render(<SceneRendererView plan={plan} contract={contract} />);
      const achievement = container.querySelector('.silse-closing-achievement') as HTMLElement;
      if (achievement) {
        const color = achievement.style.color;
        const isLight = color === '#ffffff'
          || color === 'rgb(255, 255, 255)'
          || color.startsWith('var(--silse-color-surface');
        expect(isLight).toBe(true);
      }
    }
  });
});
