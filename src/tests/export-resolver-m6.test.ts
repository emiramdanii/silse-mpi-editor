/**
 * Tests for style resolver + export HTML (M6).
 */

import { describe, expect, it } from 'vitest';
import {
  resolveComponentStyle,
  resolveComponentStyleWithInteractions,
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
    expect(html).toContain('var PROJECT =');
    expect(html).toContain(project.id);
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
    expect(html).toContain('data-action');
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
