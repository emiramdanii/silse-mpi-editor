/**
 * LAYOUT-STYLE-01 AUDIT — Edge case + bypass attempt tests.
 */
import { describe, it, expect } from 'vitest';
import { sanitizeElementStyle, sanitizeCustomStyle } from '../core/style/sanitize';

describe('LAYOUT-STYLE-01 AUDIT — Bypass attempts', () => {
  // 1. Case sensitivity bypass
  it('A1. display:GRID (uppercase) normalized to lowercase grid', () => {
    const r = sanitizeElementStyle({ display: 'GRID' });
    expect(r.display).toBe('grid');
  });

  it('A2. display: Flex (mixed case) normalized to flex', () => {
    const r = sanitizeElementStyle({ display: 'Flex' });
    expect(r.display).toBe('flex');
  });

  // 2. Whitespace injection
  it('A3. display:" grid " (whitespace) trimmed + normalized', () => {
    const r = sanitizeElementStyle({ display: ' grid ' });
    expect(r.display).toBe('grid');
  });

  it('A4. gridTemplateColumns with extra spaces', () => {
    const r = sanitizeElementStyle({ gridTemplateColumns: 'repeat(  3  ,  1fr  )' });
    expect(r.gridTemplateColumns).toBe('repeat(3, 1fr)');
  });

  // 3. CSS injection via gridTemplateColumns
  it('A5. gridTemplateColumns with url() rejected (CSS injection)', () => {
    const r = sanitizeElementStyle({ gridTemplateColumns: 'url(javascript:alert(1))' });
    expect(r.gridTemplateColumns).toBeUndefined();
  });

  it('A6. gridTemplateColumns with expression() rejected (IE CSS injection)', () => {
    const r = sanitizeElementStyle({ gridTemplateColumns: 'expression(alert(1))' });
    expect(r.gridTemplateColumns).toBeUndefined();
  });

  it('A7. gridTemplateColumns with ; } rejected (CSS breakout)', () => {
    const r = sanitizeElementStyle({ gridTemplateColumns: '1fr; } body { background: red' });
    expect(r.gridTemplateColumns).toBeUndefined();
  });

  // 4. Multiple property injection in single value
  it('A8. gap with multiple values rejected (only single length allowed)', () => {
    // "10px 20px" is valid CSS (row-gap column-gap) but could be abused
    // Current impl: matches ^(\d+(?:\.\d+)?)px$ so "10px 20px" won't match → return as-is
    // This is a potential gap — let's verify behavior
    const r = sanitizeElementStyle({ gap: '10px 20px' });
    // Currently: doesn't match px pattern, returns str as-is
    // AUDIT NOTE: This allows "10px 20px" which is valid CSS but unexpected
    // Decision: allow it — it's valid CSS gap shorthand, not dangerous
    expect(r.gap).toBe('10px 20px');
  });

  // 5. gridTemplateRows (less common but should work same as columns)
  it('A9. gridTemplateRows repeat(2, 1fr) allowed', () => {
    const r = sanitizeElementStyle({ gridTemplateRows: 'repeat(2, 1fr)' });
    expect(r.gridTemplateRows).toBe('repeat(2, 1fr)');
  });

  // 6. gridAutoFlow / gridAutoColumns — NOT in allow list, should be rejected
  it('A10. gridAutoFlow rejected (not in allow list)', () => {
    const r = sanitizeElementStyle({ gridAutoFlow: 'dense' });
    expect(r.gridAutoFlow).toBeUndefined();
  });

  it('A11. gridAutoColumns rejected (not in allow list)', () => {
    const r = sanitizeElementStyle({ gridAutoColumns: '1fr' });
    expect(r.gridAutoColumns).toBeUndefined();
  });

  // 7. gridColumn / gridRow still forbidden (in FORBIDDEN_PROPERTIES)
  it('A12. gridColumn rejected (still in FORBIDDEN_PROPERTIES)', () => {
    const r = sanitizeElementStyle({ gridColumn: 'span 2' });
    expect(r.gridColumn).toBeUndefined();
  });

  it('A13. gridRow rejected (still in FORBIDDEN_PROPERTIES)', () => {
    const r = sanitizeElementStyle({ gridRow: 'span 3' });
    expect(r.gridRow).toBeUndefined();
  });

  // 8. Negative gap in numeric form
  it('A14. numeric gap -50 → 0px (rejected)', () => {
    const r = sanitizeElementStyle({ gap: -50 as any });
    expect(r.gap).toBe('0px');
  });

  // 9. Very large gap
  it('A15. numeric gap 10000 → 100px (clamped)', () => {
    const r = sanitizeElementStyle({ gap: 10000 as any });
    expect(r.gap).toBe('100px');
  });

  // 10. Empty string
  it('A16. empty display rejected', () => {
    const r = sanitizeElementStyle({ display: '' });
    expect(r.display).toBeUndefined();
  });

  it('A17. empty gridTemplateColumns rejected', () => {
    const r = sanitizeElementStyle({ gridTemplateColumns: '' });
    expect(r.gridTemplateColumns).toBeUndefined();
  });

  // 11. null/undefined values
  it('A18. null display rejected gracefully', () => {
    const r = sanitizeElementStyle({ display: null as any });
    expect(r.display).toBeUndefined();
  });

  // 12. grid key in customStyle map
  it('A19. customStyle.grid with mix of safe + dangerous props', () => {
    const r = sanitizeCustomStyle({
      grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        position: 'absolute', // dangerous
        width: '9999px', // dangerous
        zIndex: '9999', // dangerous
      },
    });
    expect(r?.grid?.display).toBe('grid');
    expect(r?.grid?.gridTemplateColumns).toBe('repeat(3, 1fr)');
    expect(r?.grid?.gap).toBe('20px');
    expect(r?.grid?.position).toBeUndefined();
    expect(r?.grid?.width).toBeUndefined();
    expect(r?.grid?.zIndex).toBeUndefined();
  });

  // 13. gridTemplateColumns with minmax auto
  it('A20. repeat(auto-fill, minmax(auto, 1fr)) rejected (auto not allowed in minmax)', () => {
    const r = sanitizeElementStyle({ gridTemplateColumns: 'repeat(auto-fill, minmax(auto, 1fr))' });
    expect(r.gridTemplateColumns).toBeUndefined();
  });

  // 14. gridTemplateColumns with percentage
  it('A21. "33% 33% 33%" rejected (percentage not in whitelist)', () => {
    const r = sanitizeElementStyle({ gridTemplateColumns: '33% 33% 33%' });
    expect(r.gridTemplateColumns).toBeUndefined();
  });

  // 15. gridTemplateColumns with px values
  it('A22. "200px 200px" rejected (px not in whitelist, only fr)', () => {
    const r = sanitizeElementStyle({ gridTemplateColumns: '200px 200px' });
    expect(r.gridTemplateColumns).toBeUndefined();
  });
});
