/**
 * V2-PILAR-2.5 Commit 3: Tests for Client-Side Color Thief.
 *
 * Coverage:
 *   1. hexLuminance — WCAG luminance calculation from HEX
 *   2. contrastTextColor — dark/light text suggestion based on luminance
 *   3. extractDominantColor — async extraction (graceful null in jsdom)
 *   4. batchExtractDominantColors — concurrency-limited batch
 *   5. Store: setPageDominantColor
 *   6. Inspector: palette widget rendering
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import {
  hexLuminance,
  contrastTextColor,
  extractDominantColor,
  batchExtractDominantColors,
} from '../core/slide-import';
import { useEditorStore } from '../store/editor-store';
import { Inspector } from '../editor/Inspector';

// ---------------------------------------------------------------------------
// 1. hexLuminance — WCAG 2.1 relative luminance
// ---------------------------------------------------------------------------

describe('V2-PILAR-2.5 — hexLuminance', () => {
  it('1. pure white (#ffffff) has high luminance (near 1.0)', () => {
    const lum = hexLuminance('#ffffff');
    expect(lum).toBeGreaterThan(0.99);
    expect(lum).toBeLessThanOrEqual(1.0);
  });

  it('2. pure black (#000000) has zero luminance', () => {
    expect(hexLuminance('#000000')).toBe(0);
  });

  it('3. pure red (#ff0000) has moderate luminance', () => {
    const lum = hexLuminance('#ff0000');
    // Red contributes 0.2126 to luminance, gamma-corrected
    expect(lum).toBeGreaterThan(0.2);
    expect(lum).toBeLessThan(0.3);
  });

  it('4. pure green (#00ff00) has high luminance (0.7152 weight)', () => {
    const lum = hexLuminance('#00ff00');
    expect(lum).toBeGreaterThan(0.7);
    expect(lum).toBeLessThan(0.8);
  });

  it('5. pure blue (#0000ff) has low luminance (0.0722 weight)', () => {
    const lum = hexLuminance('#0000ff');
    expect(lum).toBeGreaterThan(0.05);
    expect(lum).toBeLessThan(0.1);
  });

  it('6. medium gray (#808080) has luminance near 0.22', () => {
    const lum = hexLuminance('#808080');
    expect(lum).toBeGreaterThan(0.15);
    expect(lum).toBeLessThan(0.3);
  });

  it('7. handles lowercase hex', () => {
    expect(hexLuminance('#ffffff')).toBeCloseTo(hexLuminance('#FFFFFF'), 5);
  });

  it('8. handles hex without # prefix', () => {
    expect(hexLuminance('ffffff')).toBeCloseTo(hexLuminance('#ffffff'), 5);
  });

  it('9. invalid hex returns default 0.5', () => {
    expect(hexLuminance('invalid')).toBe(0.5);
    expect(hexLuminance('#xyz')).toBe(0.5);
  });

  it('10. short hex (#fff) returns 0.5 (invalid length)', () => {
    expect(hexLuminance('#fff')).toBe(0.5);
  });
});

// ---------------------------------------------------------------------------
// 2. contrastTextColor — dark/light suggestion
// ---------------------------------------------------------------------------

describe('V2-PILAR-2.5 — contrastTextColor', () => {
  it('11. white background suggests dark text (#1f2937)', () => {
    expect(contrastTextColor('#ffffff')).toBe('#1f2937');
  });

  it('12. black background suggests light text (#ffffff)', () => {
    expect(contrastTextColor('#000000')).toBe('#ffffff');
  });

  it('13. light yellow background suggests dark text', () => {
    // #fffbeb is very light, luminance > 0.5
    expect(contrastTextColor('#fffbeb')).toBe('#1f2937');
  });

  it('14. dark navy background suggests light text', () => {
    // #0d243d is very dark, luminance < 0.5
    expect(contrastTextColor('#0d243d')).toBe('#ffffff');
  });

  it('15. medium gray (#808080) suggests light text (luminance ~0.22 < 0.5)', () => {
    expect(contrastTextColor('#808080')).toBe('#ffffff');
  });

  it('16. light gray (#e0e0e0) suggests dark text (luminance > 0.5)', () => {
    expect(contrastTextColor('#e0e0e0')).toBe('#1f2937');
  });
});

// ---------------------------------------------------------------------------
// 3. extractDominantColor — async extraction (jsdom returns null)
// ---------------------------------------------------------------------------

describe('V2-PILAR-2.5 — extractDominantColor', () => {
  it('17. extractDominantColor is a function', () => {
    expect(typeof extractDominantColor).toBe('function');
  });

  it('18. returns Promise', () => {
    const result = extractDominantColor('data:image/png;base64,abc');
    expect(result).toBeInstanceOf(Promise);
  });

  it('19. returns null for invalid data URL in jsdom (no real image)', async () => {
    const result = await extractDominantColor('data:image/png;base64,invalid');
    // In jsdom, Image doesn't actually load — onerror fires → null
    expect(result).toBeNull();
  });

  it('20. returns null for empty string', async () => {
    const result = await extractDominantColor('');
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 4. batchExtractDominantColors — concurrency-limited batch
// ---------------------------------------------------------------------------

describe('V2-PILAR-2.5 — batchExtractDominantColors', () => {
  it('21. batchExtractDominantColors is a function', () => {
    expect(typeof batchExtractDominantColors).toBe('function');
  });

  it('22. returns array of same length as input', async () => {
    const dataUrls = ['data:image/png;base64,a', 'data:image/png;base64,b', 'data:image/png;base64,c'];
    const results = await batchExtractDominantColors(dataUrls, 2);
    expect(results).toHaveLength(3);
  }, 15000); // extended timeout for async image processing in jsdom

  it('23. returns array of nulls in jsdom (no real images)', async () => {
    const dataUrls = ['data:image/png;base64,a', 'data:image/png;base64,b'];
    const results = await batchExtractDominantColors(dataUrls, 2);
    expect(results[0]).toBeNull();
    expect(results[1]).toBeNull();
  });

  it('24. empty input returns empty array', async () => {
    const results = await batchExtractDominantColors([], 5);
    expect(results).toHaveLength(0);
  });

  it('25. single item works with concurrency 5', async () => {
    const results = await batchExtractDominantColors(['data:image/png;base64,a'], 5);
    expect(results).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// 5. Store: setPageDominantColor
// ---------------------------------------------------------------------------

describe('V2-PILAR-2.5 — setPageDominantColor', () => {
  beforeEach(() => {
    useEditorStore.getState().resetProject();
  });

  it('26. store exposes setPageDominantColor as function', () => {
    expect(typeof useEditorStore.getState().setPageDominantColor).toBe('function');
  });

  it('27. sets dominantColor on target page', () => {
    const store = useEditorStore.getState();
    const pageId = store.project.pages[0].id;
    store.setPageDominantColor(pageId, '#aabbcc');
    const page = useEditorStore.getState().project.pages.find((p) => p.id === pageId)!;
    expect(page.dominantColor).toBe('#aabbcc');
  });

  it('28. passing null removes dominantColor from page', () => {
    const store = useEditorStore.getState();
    const pageId = store.project.pages[0].id;
    store.setPageDominantColor(pageId, '#aabbcc');
    expect(useEditorStore.getState().project.pages[0].dominantColor).toBe('#aabbcc');
    store.setPageDominantColor(pageId, null);
    expect(useEditorStore.getState().project.pages[0].dominantColor).toBeUndefined();
  });

  it('29. does not affect other pages', () => {
    const store = useEditorStore.getState();
    const page1Id = store.project.pages[0].id;
    store.addPage({ role: 'free', title: 'Page 2' });
    // Re-get state after addPage
    const page2Id = useEditorStore.getState().project.pages[1].id;
    useEditorStore.getState().setPageDominantColor(page1Id, '#ff0000');
    const p1 = useEditorStore.getState().project.pages.find((p) => p.id === page1Id)!;
    const p2 = useEditorStore.getState().project.pages.find((p) => p.id === page2Id)!;
    expect(p1.dominantColor).toBe('#ff0000');
    expect(p2.dominantColor).toBeUndefined();
  });

  it('30. non-existent pageId is no-op', () => {
    const store = useEditorStore.getState();
    const before = store.project;
    store.setPageDominantColor('non-existent', '#aabbcc');
    const after = useEditorStore.getState().project;
    // Pages unchanged
    expect(after.pages.length).toBe(before.pages.length);
    // No page has dominantColor
    expect(after.pages.every((p) => p.dominantColor === undefined)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 6. Inspector: palette widget rendering
// ---------------------------------------------------------------------------

describe('V2-PILAR-2.5 — Inspector palette widget', () => {
  beforeEach(() => {
    useEditorStore.getState().resetProject();
  });

  it('31. palette widget NOT shown when page has no dominantColor', () => {
    const { container } = render(React.createElement(Inspector));
    expect(container.querySelector('[data-testid="inspector-palette-widget"]')).toBeNull();
  });

  it('32. palette widget shown when page has dominantColor', () => {
    const store = useEditorStore.getState();
    const pageId = store.project.pages[0].id;
    store.setPageDominantColor(pageId, '#3b82f6');
    const { container } = render(React.createElement(Inspector));
    expect(container.querySelector('[data-testid="inspector-palette-widget"]')).not.toBeNull();
  });

  it('33. palette shows HEX color value', () => {
    const store = useEditorStore.getState();
    const pageId = store.project.pages[0].id;
    store.setPageDominantColor(pageId, '#3b82f6');
    const { container } = render(React.createElement(Inspector));
    expect(container.textContent).toContain('#3b82f6');
  });

  it('34. palette shows dominant color swatch', () => {
    const store = useEditorStore.getState();
    const pageId = store.project.pages[0].id;
    store.setPageDominantColor(pageId, '#ff0000');
    const { container } = render(React.createElement(Inspector));
    const swatch = container.querySelector('[data-testid="palette-dominant-swatch"]') as HTMLElement;
    expect(swatch).not.toBeNull();
    expect(swatch.style.background).toBe('rgb(255, 0, 0)');
  });

  it('35. palette shows contrast text preview', () => {
    const store = useEditorStore.getState();
    const pageId = store.project.pages[0].id;
    store.setPageDominantColor(pageId, '#000000'); // dark → white text
    const { container } = render(React.createElement(Inspector));
    const preview = container.querySelector('[data-testid="palette-contrast-preview"]') as HTMLElement;
    expect(preview).not.toBeNull();
    expect(preview.style.color).toBe('rgb(255, 255, 255)'); // #ffffff
  });

  it('36. palette has apply button', () => {
    const store = useEditorStore.getState();
    const pageId = store.project.pages[0].id;
    store.setPageDominantColor(pageId, '#3b82f6');
    const { container } = render(React.createElement(Inspector));
    expect(container.querySelector('[data-testid="palette-apply-btn"]')).not.toBeNull();
  });

  it('37. palette shows light/dark label correctly', () => {
    const store = useEditorStore.getState();
    const pageId = store.project.pages[0].id;
    store.setPageDominantColor(pageId, '#ffffff'); // light
    const { container } = render(React.createElement(Inspector));
    expect(container.textContent).toContain('Warna terang');
  });

  it('38. palette shows dark label for dark color', () => {
    const store = useEditorStore.getState();
    const pageId = store.project.pages[0].id;
    store.setPageDominantColor(pageId, '#000000'); // dark
    const { container } = render(React.createElement(Inspector));
    expect(container.textContent).toContain('Warna gelap');
  });
});
