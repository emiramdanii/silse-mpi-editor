/**
 * DEEP-PARITY: Component views use var() not hardcoded for style colors.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const files = [
  '../components/CardComponentView.tsx',
  '../components/TextComponentView.tsx',
  '../components/NavigationComponentView.tsx',
  '../components/ImageComponentView.tsx',
  '../components/QuestionComponentView.tsx',
  '../components/SceneRendererView.tsx',
];

describe('DEEP-PARITY: Component views use var() for style colors', () => {
  files.forEach((rel) => {
    const src = readFileSync(resolve(__dirname, rel), 'utf-8');

    it(`${rel}: selection outline uses var(--silse-color-primary) not bare #2563eb`, () => {
      // Check: '#2563eb' should only appear inside var() fallback, never bare
      const lines = src.split('\n');
      const bare = lines.filter((l) =>
        l.includes('#2563eb') && !l.includes('var(') && !l.trim().startsWith('//')
      );
      expect(bare.length, `${rel}: ${bare.length} bare #2563eb (should be 0 — use var())`).toBe(0);
    });

    it(`${rel}: border colors use var(--silse-color-border) not hardcoded #d1d5db`, () => {
      // Check if '#d1d5db' appears outside var() in style context
      const lines = src.split('\n');
      const hardcoded = lines.filter((l) =>
        l.includes('#d1d5db') && !l.includes('var(') && !l.trim().startsWith('//')
      );
      // Allow some hardcoded (state colors may use #d1d5db) — only flag if > 2
      expect(hardcoded.length, `${rel}: ${hardcoded.length} hardcoded #d1d5db outside var()`).toBeLessThanOrEqual(2);
    });
  });
});

describe('DEEP-PARITY: resolveComponentStyle reaktif (no stale reference)', () => {
  it('7. getResolvedComponentStyle reads project.style.tokens at call time (not cached)', () => {
    const src = readFileSync(resolve(__dirname, '../core/style/resolveComponentStyle.ts'), 'utf-8');
    // Verify it reads from project parameter, not from a cached/module-level variable
    expect(src).toContain('project.style?.tokens');
    expect(src).not.toMatch(/let cached|const cache|module-level/);
  });
});

describe('DEEP-PARITY: Shallow merge does not lose properties', () => {
  it('8. applyDesignSystemOverrides uses spread before override (no property loss)', () => {
    const src = readFileSync(resolve(__dirname, '../core/ai-mpi-json/aiBlueprintToSimpleProject.ts'), 'utf-8');
    // Verify spread is used for each token category
    expect(src).toMatch(/colors:\s*\{\s*\.\.\.baseStyle\.tokens\.colors/);
    expect(src).toMatch(/typography:\s*\{\s*\.\.\.baseStyle\.tokens\.typography/);
    expect(src).toMatch(/spacing:\s*\{\s*\.\.\.baseStyle\.tokens\.spacing/);
  });
});
