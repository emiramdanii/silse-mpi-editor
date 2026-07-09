/**
 * Regression tests for BUG-NAV-01: "Mulai Pembelajaran" CTA clickable in preview.
 *
 * The cover scene's CTA button is rendered inside .silse-premium-decoration
 * which sets pointer-events: none. Without an override on .silse-hero-cta,
 * the button inherits pointer-events: none and the onClick handler never fires.
 *
 * This test verifies the CSS override exists in styles.css so the preview
 * CTA is actually clickable.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('BUG-NAV-01 — Mulai Pembelajaran CTA clickable in preview', () => {
  it('.canvas-frame .silse-hero-cta rule has pointer-events: auto override', () => {
    const cssPath = resolve(__dirname, '../styles.css');
    const css = readFileSync(cssPath, 'utf-8');

    // Find the .canvas-frame .silse-hero-cta rule block
    const ruleStart = css.indexOf('.canvas-frame .silse-hero-cta');
    expect(ruleStart).toBeGreaterThan(-1);

    // Extract the rule block (until the closing brace)
    const ruleEnd = css.indexOf('}', ruleStart);
    expect(ruleEnd).toBeGreaterThan(ruleStart);
    const ruleBlock = css.slice(ruleStart, ruleEnd + 1);

    // The rule MUST contain pointer-events: auto to override the inherited
    // pointer-events: none from .silse-premium-decoration wrapper.
    expect(ruleBlock).toMatch(/pointer-events:\s*auto/);
  });

  it('.canvas-frame .silse-hero-cta has z-index >= 1 (above decoration layer)', () => {
    const cssPath = resolve(__dirname, '../styles.css');
    const css = readFileSync(cssPath, 'utf-8');

    const ruleStart = css.indexOf('.canvas-frame .silse-hero-cta');
    const ruleEnd = css.indexOf('}', ruleStart);
    const ruleBlock = css.slice(ruleStart, ruleEnd + 1);

    // z-index must be >= 1 so the CTA sits above the .silse-premium-decoration
    // layer (which has z-index: 0). Without this, the CTA might be visually
    // present but not receive clicks if other elements stack above.
    const zindexMatch = ruleBlock.match(/z-index:\s*(\d+)/);
    expect(zindexMatch).not.toBeNull();
    const zindex = parseInt(zindexMatch![1], 10);
    expect(zindex).toBeGreaterThanOrEqual(1);
  });

  it('.silse-premium-decoration wrapper has pointer-events: none (the inherited source)', () => {
    const cssPath = resolve(__dirname, '../styles.css');
    const css = readFileSync(cssPath, 'utf-8');

    // This is the root cause — the wrapper disables pointer events, which
    // the CTA must override. Verify the wrapper still has the none rule
    // (otherwise the CTA fix becomes unnecessary, but the inheritance chain
    // should still be documented).
    const ruleStart = css.indexOf('.canvas-frame .silse-premium-decoration');
    expect(ruleStart).toBeGreaterThan(-1);
    const ruleEnd = css.indexOf('}', ruleStart);
    const ruleBlock = css.slice(ruleStart, ruleEnd + 1);
    expect(ruleBlock).toMatch(/pointer-events:\s*none/);
  });
});
