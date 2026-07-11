/**
 * Tests for style resolver + export HTML (M6).
 */

import { describe, expect, it } from 'vitest';
import {
  resolveComponentStyle,
  resolveComponentStyleWithInteractions,
  getResolvedComponentStyle,
  type ResolveStyleInput,
} from '../core/style/resolveComponentStyle';
import { CLEAN_CLASSROOM_PACK, stylePackToProjectStyle } from '../core/style-presets';
import { createProject } from '../core/project-factory';
import { exportProjectToHtml } from '../export/export-html';

const tokens = stylePackToProjectStyle(CLEAN_CLASSROOM_PACK).tokens;

const baseInput: Omit<ResolveStyleInput, 'componentType' | 'variant'> = {
  tokens,
  pageRole: 'material',
  layoutId: 'singleColumn',
};

// =========================================================================
// resolveComponentStyle — pure function
// =========================================================================

describe('resolveComponentStyle — pure function', () => {
  it('returns same output for same input', () => {
    const input: ResolveStyleInput = {
      ...baseInput,
      componentType: 'text',
      variant: 'title',
    };
    const a = resolveComponentStyle(input);
    const b = resolveComponentStyle(input);
    expect(a).toEqual(b);
  });

  it('returns plain object (no function/class)', () => {
    const result = resolveComponentStyle({
      ...baseInput,
      componentType: 'text',
      variant: 'body',
    });
    expect(typeof result).toBe('object');
    expect(typeof result.inlineStyle).toBe('object');
    expect(JSON.stringify(result)).not.toMatch(/function/i);
  });
});

// =========================================================================
// Text style resolution
// =========================================================================

describe('resolve text style by variant', () => {
  it('title variant resolves to large bold text', () => {
    const result = resolveComponentStyle({
      ...baseInput,
      componentType: 'text',
      variant: 'title',
    });
    expect(result.inlineStyle.fontSize).toBe(`${CLEAN_CLASSROOM_PACK.typography.titleSize}px`);
    expect(result.inlineStyle.fontWeight).toBe('bold');
  });

  it('body variant resolves to medium normal text', () => {
    const result = resolveComponentStyle({
      ...baseInput,
      componentType: 'text',
      variant: 'body',
    });
    expect(result.inlineStyle.fontSize).toBe(`${CLEAN_CLASSROOM_PACK.typography.bodySize}px`);
    expect(result.inlineStyle.fontWeight).toBe('normal');
  });

  it('instruction variant has backgroundColor', () => {
    const result = resolveComponentStyle({
      ...baseInput,
      componentType: 'text',
      variant: 'instruction',
    });
    expect(result.inlineStyle.backgroundColor).toBeDefined();
  });

  it('each text variant produces different style', () => {
    const variants = ['title', 'subtitle', 'body', 'instruction', 'importantNote', 'questionPrompt', 'reflectionBox'] as const;
    const styles = variants.map((v) =>
      resolveComponentStyle({ ...baseInput, componentType: 'text', variant: v }),
    );
    // At least title and body should differ
    expect(styles[0].inlineStyle.fontSize).not.toBe(styles[2].inlineStyle.fontSize);
  });
});

// =========================================================================
// Image style resolution
// =========================================================================

describe('resolve image style by variant', () => {
  it('illustration variant has border + borderRadius', () => {
    const result = resolveComponentStyle({
      ...baseInput,
      componentType: 'image',
      variant: 'illustration',
    });
    expect(result.inlineStyle.border).toBeDefined();
    expect(result.inlineStyle.borderRadius).toBeDefined();
  });

  it('background variant has no border', () => {
    const result = resolveComponentStyle({
      ...baseInput,
      componentType: 'image',
      variant: 'background',
    });
    expect(result.inlineStyle.border).toBe('none');
  });

  it('imageCard variant has primary border', () => {
    const result = resolveComponentStyle({
      ...baseInput,
      componentType: 'image',
      variant: 'imageCard',
    });
    expect(result.inlineStyle.border).toContain(CLEAN_CLASSROOM_PACK.colors.primary);
  });
});

// =========================================================================
// Card style resolution
// =========================================================================

describe('resolve card style by variant', () => {
  it('infoCard variant has surface background', () => {
    const result = resolveComponentStyle({
      ...baseInput,
      componentType: 'card',
      variant: 'infoCard',
    });
    expect(result.inlineStyle.backgroundColor).toBe(CLEAN_CLASSROOM_PACK.colors.surface);
  });

  it('importantNote variant has warning border', () => {
    const result = resolveComponentStyle({
      ...baseInput,
      componentType: 'card',
      variant: 'importantNote',
    });
    expect(result.inlineStyle.border).toContain(CLEAN_CLASSROOM_PACK.colors.warning);
  });

  it('exampleCard variant has success border', () => {
    const result = resolveComponentStyle({
      ...baseInput,
      componentType: 'card',
      variant: 'exampleCard',
    });
    expect(result.inlineStyle.border).toContain(CLEAN_CLASSROOM_PACK.colors.success);
  });
});

// =========================================================================
// Navigation style resolution + interaction recipes
// =========================================================================

describe('resolve navigation style by variant + interaction', () => {
  it('primaryAction variant has primary background', () => {
    const result = resolveComponentStyle({
      ...baseInput,
      componentType: 'navigation',
      variant: 'primaryAction',
    });
    expect(result.inlineStyle.backgroundColor).toBe(CLEAN_CLASSROOM_PACK.colors.primary);
    expect(result.inlineStyle.color).toBe('#ffffff');
  });

  it('resolveComponentStyleWithInteractions includes interactions for navigation', () => {
    const result = resolveComponentStyleWithInteractions(
      {
        ...baseInput,
        componentType: 'navigation',
        variant: 'navigation',
      },
      CLEAN_CLASSROOM_PACK.interactionRecipes,
    );
    expect(result.interactions).toBeDefined();
    expect(result.interactions?.hover).toBeDefined();
    expect(result.interactions?.press).toBeDefined();
    expect(result.interactions?.focus).toBeDefined();
  });

  it('resolveComponentStyleWithInteractions does NOT add interactions for text', () => {
    const result = resolveComponentStyleWithInteractions(
      {
        ...baseInput,
        componentType: 'text',
        variant: 'body',
      },
      CLEAN_CLASSROOM_PACK.interactionRecipes,
    );
    expect(result.interactions).toBeUndefined();
  });

  it('hover interaction has transform scale', () => {
    const result = resolveComponentStyleWithInteractions(
      {
        ...baseInput,
        componentType: 'navigation',
        variant: 'navigation',
      },
      CLEAN_CLASSROOM_PACK.interactionRecipes,
    );
    expect(result.interactions?.hover?.transform).toContain('scale');
  });
});

// =========================================================================
// Export HTML
// =========================================================================

describe('exportProjectToHtml', () => {
  const project = createProject('Test MPI Export');

  it('produces non-empty HTML string', () => {
    const html = exportProjectToHtml(project);
    expect(html.length).toBeGreaterThan(100);
    expect(html).toContain('<!doctype html>');
  });

  it('includes project title in <title>', () => {
    const html = exportProjectToHtml(project);
    expect(html).toContain('<title>Test MPI Export</title>');
  });

  it('includes project data embedded in script', () => {
    const html = exportProjectToHtml(project);
    expect(html).toContain('var MODEL =');
    // Render model includes page title
    expect(html).toContain(project.pages[0].title);
  });

  it('includes CSS variables from StylePack tokens', () => {
    const html = exportProjectToHtml(project);
    expect(html).toContain('--silse-color-primary');
    expect(html).toContain('--silse-color-background');
    expect(html).toContain('--silse-font-family');
    expect(html).toContain('--silse-title-size');
  });

  it('includes inline JS for navigation', () => {
    const html = exportProjectToHtml(project);
    expect(html).toContain('function navigate(');
    expect(html).toContain("action === 'next'");
    expect(html).toContain("action === 'prev'");
    expect(html).toContain("action === 'goto'");
  });

  it('includes canvas 1280x720', () => {
    const html = exportProjectToHtml(project);
    expect(html).toContain('1280px');
    expect(html).toContain('720px');
  });

  // Security tests
  it('does NOT contain CDN URLs', () => {
    const html = exportProjectToHtml(project);
    expect(html).not.toMatch(/https?:\/\/cdn\./i);
    expect(html).not.toMatch(/unpkg\.com/i);
    expect(html).not.toMatch(/cdnjs\.cloudflare\.com/i);
  });

  it('does NOT contain external script src', () => {
    const html = exportProjectToHtml(project);
    expect(html).not.toMatch(/<script\s+src=/i);
  });

  it('does NOT contain external stylesheet link', () => {
    const html = exportProjectToHtml(project);
    expect(html).not.toMatch(/<link\s+rel=["']stylesheet["']/i);
  });

  it('does NOT contain React/Vite runtime', () => {
    const html = exportProjectToHtml(project);
    expect(html).not.toMatch(/react/i);
    expect(html).not.toMatch(/vite/i);
    expect(html).not.toMatch(/@vite/i);
  });

  it('escapes </script> in project data', () => {
    const projectWithScript = createProject('Test</script><script>alert(1)</script>');
    const html = exportProjectToHtml(projectWithScript);
    // The </script> in title should be escaped in the data section
    // (title in <title> tag is escaped via escapeHTML, data in script is escaped via serializeProjectData)
    expect(html).not.toMatch(/<\/script><script>alert/);
  });

  it('includes navigation button rendering in JS', () => {
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-nav-btn');
    expect(html).toContain('dataset.action');
  });

  it('includes prev/next buttons in toolbar', () => {
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-nav-prev');
    expect(html).toContain('silse-nav-next');
  });
});

// =========================================================================
// Editor/Preview/Export use same resolver
// =========================================================================

describe('editor/preview/export use same resolver', () => {
  it('resolver is importable from core/style (shared)', () => {
    // This test verifies that resolveComponentStyle is a single function
    // that can be imported by editor, preview, and export.
    expect(typeof resolveComponentStyle).toBe('function');
    expect(typeof resolveComponentStyleWithInteractions).toBe('function');
  });

  it('same input produces same output regardless of caller context', () => {
    const input: ResolveStyleInput = {
      tokens,
      componentType: 'card',
      variant: 'infoCard',
      pageRole: 'material',
      layoutId: 'singleColumn',
    };
    // Simulate "editor" call
    const editorResult = resolveComponentStyle(input);
    // Simulate "preview" call
    const previewResult = resolveComponentStyle(input);
    // Simulate "export" call
    const exportResult = resolveComponentStyle(input);

    expect(editorResult).toEqual(previewResult);
    expect(previewResult).toEqual(exportResult);
  });
});

// =========================================================================
// M6 PATCH ENFORCEMENT TESTS
// Component views must NOT have VARIANT_STYLE hard-coded.
// Export must NOT have switch (comp.variant) for style.
// Render model must contain resolvedStyle.
// =========================================================================

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildExportRenderModel } from '../export/export-html';

const SRC_DIR = resolve(__dirname, '..');

function readSrcFile(relPath: string): string {
  return readFileSync(resolve(SRC_DIR, relPath), 'utf8');
}

describe('M6 PATCH — component views do NOT have VARIANT_STYLE', () => {
  it('TextComponentView.tsx does NOT contain VARIANT_STYLE', () => {
    const content = readSrcFile('components/TextComponentView.tsx');
    expect(content).not.toMatch(/VARIANT_STYLE/);
  });

  it('ImageComponentView.tsx does NOT contain VARIANT_STYLE', () => {
    const content = readSrcFile('components/ImageComponentView.tsx');
    expect(content).not.toMatch(/VARIANT_STYLE/);
  });

  it('CardComponentView.tsx does NOT contain VARIANT_STYLE', () => {
    const content = readSrcFile('components/CardComponentView.tsx');
    expect(content).not.toMatch(/VARIANT_STYLE/);
  });

  it('NavigationComponentView.tsx does NOT contain VARIANT_STYLE', () => {
    const content = readSrcFile('components/NavigationComponentView.tsx');
    expect(content).not.toMatch(/VARIANT_STYLE/);
  });

  it('TextComponentView accepts resolvedStyle prop', () => {
    const content = readSrcFile('components/TextComponentView.tsx');
    expect(content).toMatch(/resolvedStyle/);
  });

  it('ImageComponentView accepts resolvedStyle prop', () => {
    const content = readSrcFile('components/ImageComponentView.tsx');
    expect(content).toMatch(/resolvedStyle/);
  });

  it('CardComponentView accepts resolvedStyle prop', () => {
    const content = readSrcFile('components/CardComponentView.tsx');
    expect(content).toMatch(/resolvedStyle/);
  });

  it('NavigationComponentView accepts resolvedStyle prop', () => {
    const content = readSrcFile('components/NavigationComponentView.tsx');
    expect(content).toMatch(/resolvedStyle/);
  });
});

describe('M6 PATCH — export does NOT have style switch per variant', () => {
  it('export-html.ts does NOT contain switch on comp.variant for style', () => {
    const content = readSrcFile('export/export-html.ts');
    // The export should NOT have manual switch statements on variant for style
    expect(content).not.toMatch(/switch\s*\(comp\.variant\)/);
    expect(content).not.toMatch(/switch\s*\(component\.variant\)/);
  });

  it('export-html.ts does NOT have case statements for style variants', () => {
    const content = readSrcFile('export/export-html.ts');
    // No manual style case like "case 'title': fontSize = ..."
    expect(content).not.toMatch(/case\s+['"]title['"]/);
    expect(content).not.toMatch(/case\s+['"]illustration['"]/);
    expect(content).not.toMatch(/case\s+['"]infoCard['"]/);
    expect(content).not.toMatch(/case\s+['"]primaryAction['"]/);
  });

  it('export-html.ts uses buildExportRenderModel', () => {
    const content = readSrcFile('export/export-html.ts');
    expect(content).toMatch(/buildExportRenderModel/);
  });

  it('export-html.ts calls getResolvedComponentStyle', () => {
    const content = readSrcFile('export/export-html.ts');
    expect(content).toMatch(/getResolvedComponentStyle/);
  });
});

describe('M6 PATCH — export render model contains resolvedStyle', () => {
  it('buildExportRenderModel produces components with resolvedStyle', () => {
    const project = createProject('Test Render Model');
    const model = buildExportRenderModel(project);

    expect(model.pages).toHaveLength(1);
    const page = model.pages[0];
    expect(page.components.length).toBeGreaterThan(0);

    const comp = page.components[0];
    expect(comp.resolvedStyle).toBeDefined();
    expect(comp.resolvedStyle.inlineStyle).toBeDefined();
    expect(typeof comp.resolvedStyle.inlineStyle).toBe('object');
  });

  it('render model resolvedStyle.inlineStyle has style properties', () => {
    const project = createProject('Test Style Props');
    const model = buildExportRenderModel(project);

    // Cover page has 1 text component variant 'title'
    const comp = model.pages[0].components[0];
    expect(comp.type).toBe('text');
    expect(comp.resolvedStyle.inlineStyle.fontSize).toBeDefined();
    expect(comp.resolvedStyle.inlineStyle.color).toBeDefined();
    expect(comp.resolvedStyle.inlineStyle.fontWeight).toBeDefined();
  });

  it('render model for navigation includes interactions', () => {
    const project = createProject('Test Nav Interactions');
    // Manually add navigation component to a free page
    const freePage = {
      ...project.pages[0],
      id: 'test-free-page',
      role: 'free' as const,
      layoutId: 'blank' as const,
      components: [
        {
          id: 'nav-test',
          type: 'navigation' as const,
          variant: 'navigation' as const,
          label: 'Next',
          action: 'next' as const,
          x: 100,
          y: 600,
          width: 200,
          height: 50,
        },
      ],
    };
    const testProject = { ...project, pages: [freePage], currentPageId: freePage.id };
    const model = buildExportRenderModel(testProject);

    const navComp = model.pages[0].components[0];
    expect(navComp.type).toBe('navigation');
    expect(navComp.resolvedStyle.interactions).toBeDefined();
    expect(navComp.resolvedStyle.interactions?.hover).toBeDefined();
    expect(navComp.resolvedStyle.interactions?.press).toBeDefined();
    expect(navComp.resolvedStyle.interactions?.focus).toBeDefined();
  });
});

describe('M6 PATCH — token change propagates through resolver', () => {
  it('changing colors.primary changes resolvedStyle for primaryAction navigation', () => {
    const project1 = createProject('Test Token Change 1');
    // Create a modified project with different primary color
    const project2: typeof project1 = {
      ...project1,
      style: {
        ...project1.style!,
        tokens: {
          ...project1.style!.tokens,
          colors: {
            ...project1.style!.tokens.colors,
            primary: '#ff0000', // changed from default
          },
        },
      },
    };

    // Add a navigation component to both projects on a free page
    const navComponent = {
      id: 'nav-test',
      type: 'navigation' as const,
      variant: 'primaryAction' as const,
      label: 'Test',
      action: 'next' as const,
      x: 100,
      y: 600,
      width: 200,
      height: 50,
    };
    const freePage1 = { ...project1.pages[0], role: 'free' as const, layoutId: 'blank' as const, components: [navComponent] };
    const freePage2 = { ...project2.pages[0], role: 'free' as const, layoutId: 'blank' as const, components: [navComponent] };

    const testProject1 = { ...project1, pages: [freePage1] };
    const testProject2 = { ...project2, pages: [freePage2] };

    const resolved1 = getResolvedComponentStyle(testProject1, freePage1, navComponent);
    const resolved2 = getResolvedComponentStyle(testProject2, freePage2, navComponent);

    // The backgroundColor should differ because primary color changed
    expect(resolved1.inlineStyle.backgroundColor).not.toBe(resolved2.inlineStyle.backgroundColor);
    expect(resolved2.inlineStyle.backgroundColor).toBe('#ff0000');
  });

  it('changing typography.titleSize changes resolvedStyle for title text', () => {
    const project1 = createProject('Test Font Change 1');
    const project2: typeof project1 = {
      ...project1,
      style: {
        ...project1.style!,
        tokens: {
          ...project1.style!.tokens,
          typography: {
            ...project1.style!.tokens.typography,
            titleSize: 72, // changed from default 48
          },
        },
      },
    };

    // Cover page has 1 pre-filled title component
    const titleComp = project1.pages[0].components[0];
    const resolved1 = getResolvedComponentStyle(project1, project1.pages[0], titleComp);
    const resolved2 = getResolvedComponentStyle(project2, project2.pages[0], titleComp);

    expect(resolved1.inlineStyle.fontSize).not.toBe(resolved2.inlineStyle.fontSize);
    expect(resolved2.inlineStyle.fontSize).toBe('72px');
  });
});
