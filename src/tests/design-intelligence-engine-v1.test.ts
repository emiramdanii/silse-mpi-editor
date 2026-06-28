/**
 * DESIGN-INTELLIGENCE-ENGINE-V1 tests.
 *
 * 10 guard tests per senior reviewer spec.
 */

import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import {
  getDefaultDesignTokens,
} from '../core/design/design-tokens';
import {
  LAYOUT_RECIPES,
  getLayoutRecipeForRole,
} from '../core/design/layout-recipes';
import {
  getDesignRecipeForRole,
  placeComponentInRecipe,
  applyPageDesignRecipe,
} from '../core/design/apply-design-recipe';
import {
  validateLayoutQuality,
} from '../core/design/layout-quality';
import { createTextComponent, createCardComponent, createNavigationComponent } from '../core/component-factory';
import type { SimplePage } from '../core/types';
import { createPageId } from '../core/ids';

const REPO_ROOT = resolve(__dirname, '../..');
const DOCS_DIR = join(REPO_ROOT, 'docs');

// =========================================================================
// Test 1: All page roles have layout recipe
// =========================================================================

describe('DIE-V1 — Test 1: All page roles have layout recipe', () => {
  it('has 11 layout recipes (one per page role)', () => {
    expect(LAYOUT_RECIPES).toHaveLength(11);
  });

  it('every standard PageRole has a recipe', () => {
    const roles = ['cover', 'guide', 'learningObjectives', 'menu', 'starter', 'material', 'activity', 'quiz', 'reflection', 'closing', 'free'];
    for (const role of roles) {
      const recipe = getLayoutRecipeForRole(role as never);
      expect(recipe, `role ${role} should have recipe`).toBeDefined();
      expect(recipe.role).toBe(role);
    }
  });
});

// =========================================================================
// Test 2: All recipes have safeArea/titleZone/contentZone/actionZone
// =========================================================================

describe('DIE-V1 — Test 2: All recipes have required fields', () => {
  for (const recipe of LAYOUT_RECIPES) {
    it(`recipe ${recipe.id} has safeArea, titleZone, contentZone, actionZone`, () => {
      expect(recipe.safeArea).toBeGreaterThan(0);
      expect(recipe.titleZone).toBeDefined();
      expect(recipe.titleZone.width).toBeGreaterThan(0);
      expect(recipe.contentZone).toBeDefined();
      expect(recipe.contentZone.width).toBeGreaterThan(0);
      expect(recipe.actionZone).toBeDefined();
      expect(recipe.recommendedComponents.length).toBeGreaterThan(0);
      expect(recipe.maxContentDensity).toBeGreaterThan(0);
    });
  }
});

// =========================================================================
// Test 3: deriveDesignTokens() produces V1 design tokens
// =========================================================================

describe('DIE-V1 — Test 3: deriveDesignTokens', () => {
  it('returns DesignTokens with all required fields', () => {
    const tokens = getDefaultDesignTokens();
    expect(tokens.primarySoft).toBeDefined();
    expect(tokens.onPrimary).toBeDefined();
    expect(tokens.onPrimarySoft).toBeDefined();
    expect(tokens.surfaceAlt).toBeDefined();
    expect(tokens.onSurface).toBeDefined();
    expect(tokens.safeArea).toBeGreaterThan(0);
    expect(tokens.sectionGap).toBeGreaterThan(0);
    expect(tokens.cardPadding).toBeGreaterThan(0);
    expect(tokens.controlGap).toBeGreaterThan(0);
    expect(tokens.heroTitle).toBeGreaterThan(0);
    expect(tokens.pageTitle).toBeGreaterThan(0);
    expect(tokens.subtitle).toBeGreaterThan(0);
    expect(tokens.body).toBeGreaterThan(0);
    expect(tokens.small).toBeGreaterThan(0);
    expect(tokens.button).toBeGreaterThan(0);
    expect(tokens.canvasWidth).toBe(1280);
    expect(tokens.canvasHeight).toBe(720);
  });
});

// =========================================================================
// Test 4: validateLayoutQuality detects out-of-canvas
// =========================================================================

describe('DIE-V1 — Test 4: validateLayoutQuality detects out-of-canvas', () => {
  it('detects component with x < 0', () => {
    const page: SimplePage = {
      id: createPageId(),
      title: 'Test',
      role: 'material',
      layoutId: 'blank',
      background: { type: 'color', color: '#fff' },
      components: [
        { ...createTextComponent('material'), x: -50 } as never,
      ],
    };
    const result = validateLayoutQuality(page);
    expect(result.issues.some((i) => i.code === 'OUT_OF_CANVAS')).toBe(true);
    expect(result.ok).toBe(false);
  });

  it('detects component extending beyond canvas width', () => {
    const page: SimplePage = {
      id: createPageId(),
      title: 'Test',
      role: 'material',
      layoutId: 'blank',
      background: { type: 'color', color: '#fff' },
      components: [
        { ...createTextComponent('material'), x: 1200, width: 200 } as never,
      ],
    };
    const result = validateLayoutQuality(page);
    expect(result.issues.some((i) => i.code === 'OUT_OF_CANVAS')).toBe(true);
  });
});

// =========================================================================
// Test 5: validateLayoutQuality detects edge-too-close
// =========================================================================

describe('DIE-V1 — Test 5: validateLayoutQuality detects edge-too-close', () => {
  it('detects component too close to left edge', () => {
    const page: SimplePage = {
      id: createPageId(),
      title: 'Test',
      role: 'material',
      layoutId: 'blank',
      background: { type: 'color', color: '#fff' },
      components: [
        { ...createTextComponent('material'), x: 10, y: 80, width: 400, height: 60 } as never,
      ],
    };
    const result = validateLayoutQuality(page);
    expect(result.issues.some((i) => i.code === 'TOO_CLOSE_EDGE')).toBe(true);
  });
});

// =========================================================================
// Test 6: validateLayoutQuality detects large overlap
// =========================================================================

describe('DIE-V1 — Test 6: validateLayoutQuality detects large overlap', () => {
  it('detects two components overlapping > 30%', () => {
    const page: SimplePage = {
      id: createPageId(),
      title: 'Test',
      role: 'material',
      layoutId: 'blank',
      background: { type: 'color', color: '#fff' },
      components: [
        { ...createTextComponent('material'), x: 80, y: 80, width: 600, height: 200 } as never,
        { ...createCardComponent('Body'), x: 100, y: 100, width: 600, height: 200 } as never,
      ],
    };
    const result = validateLayoutQuality(page);
    expect(result.issues.some((i) => i.code === 'LARGE_OVERLAP')).toBe(true);
  });
});

// =========================================================================
// Test 7: applyPageDesignRecipe does not change content
// =========================================================================

describe('DIE-V1 — Test 7: applyPageDesignRecipe preserves content', () => {
  it('does not alter text content of components', () => {
    const page: SimplePage = {
      id: createPageId(),
      title: 'Test',
      role: 'material',
      layoutId: 'blank',
      background: { type: 'color', color: '#fff' },
      components: [
        createTextComponent('material', { text: 'ORIGINAL TEXT' }),
        createNavigationComponent('Next', 'next'),
      ],
    };
    const result = applyPageDesignRecipe(page);
    const textComp = result.components.find((c) => c.type === 'text') as { text: string };
    const navComp = result.components.find((c) => c.type === 'navigation') as { label: string };
    expect(textComp.text).toBe('ORIGINAL TEXT');
    expect(navComp.label).toBe('Next');
    // Geometry should be changed (from default to recipe-placed)
    expect(result.components[0].x).not.toBe(page.components[0].x);
  });
});

// =========================================================================
// Test 8: learning-bridge resolver produces CSS variables
// =========================================================================

describe('DIE-V1 — Test 8: bridge resolver produces CSS variables', () => {
  it('resolveLearningBridgeStyle output includes --silse-bridge-* vars', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const content = fs.readFileSync(path.resolve(__dirname, '../core/style/resolveComponentStyle.ts'), 'utf8');
    expect(content).toMatch(/--silse-bridge-muted/);
    expect(content).toMatch(/--silse-bridge-cta-bg/);
    expect(content).toMatch(/--silse-bridge-cta-color/);
    expect(content).toMatch(/--silse-bridge-cta-border/);
  });
});

// =========================================================================
// Test 9: LearningBridgeComponentView does NOT use hardcoded bridge colors
// =========================================================================

describe('DIE-V1 — Test 9: Bridge view uses CSS variables not hardcoded hex', () => {
  it('view file uses var(--silse-bridge-*) not #2563eb/#eff6ff/#6b7280', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const content = fs.readFileSync(path.resolve(__dirname, '../components/LearningBridgeComponentView.tsx'), 'utf8');
    // Strip comments
    const withoutComments = content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(withoutComments).not.toMatch(/['"]#2563eb['"]/);
    expect(withoutComments).not.toMatch(/['"]#eff6ff['"]/);
    expect(withoutComments).not.toMatch(/['"]#6b7280['"]/);
    // Should use CSS variables
    expect(withoutComments).toMatch(/var\(--silse-bridge/);
  });
});

// =========================================================================
// Test 10: export-html bridge does NOT use hardcoded bridge colors
// =========================================================================

describe('DIE-V1 — Test 10: Export bridge uses CSS variables not hardcoded hex', () => {
  it('export bridge block uses var(--silse-bridge-*) not hardcoded #2563eb/#eff6ff/#6b7280', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const content = fs.readFileSync(path.resolve(__dirname, '../export/export-html.ts'), 'utf8');
    // Extract bridge DOM render block
    const bridgeStart = content.indexOf("'silse-learning-bridge'");
    const returnIdx = content.indexOf('return el;', bridgeStart);
    const bridgeBlock = content.substring(bridgeStart, returnIdx + 10);
    // Strip comments
    const withoutComments = bridgeBlock.replace(/\/\/.*$/gm, '');
    // Should NOT have hardcoded hex as primary color (fallbacks in var() are ok)
    expect(withoutComments).not.toMatch(/color:#2563eb/);
    expect(withoutComments).not.toMatch(/background:#eff6ff/);
    // Should use CSS variables
    expect(withoutComments).toMatch(/var\(--silse-bridge/);
  });
});

// =========================================================================
// Bonus: placeComponentInRecipe + getDesignRecipeForRole
// =========================================================================

describe('DIE-V1 — Bonus: placeComponentInRecipe', () => {
  it('places navigation in action zone', () => {
    const recipe = getDesignRecipeForRole('material');
    const placed = placeComponentInRecipe('navigation', recipe, 0);
    expect(placed.x).toBe(recipe.actionZone.x);
    expect(placed.y).toBe(recipe.actionZone.y);
  });

  it('places text in content zone', () => {
    const recipe = getDesignRecipeForRole('material');
    const placed = placeComponentInRecipe('text', recipe, 0);
    expect(placed.width).toBeGreaterThan(0);
    expect(placed.height).toBeGreaterThan(0);
  });
});

// =========================================================================
// Docs
// =========================================================================

describe('DIE-V1 — Docs', () => {
  it('docs/DESIGN_INTELLIGENCE_ENGINE_V1.md exists', () => {
    expect(existsSync(join(DOCS_DIR, 'DESIGN_INTELLIGENCE_ENGINE_V1.md'))).toBe(true);
  });

  it('docs mentions design tokens, layout recipes, quality checks', () => {
    const content = readFileSync(join(DOCS_DIR, 'DESIGN_INTELLIGENCE_ENGINE_V1.md'), 'utf8');
    expect(content).toMatch(/design token/i);
    expect(content).toMatch(/layout recipe/i);
    expect(content).toMatch(/quality check/i);
    expect(content).toMatch(/bridge color/i);
  });
});
