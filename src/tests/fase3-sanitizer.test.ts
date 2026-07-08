/**
 * FASE 3: Style Sanitizer — allow-list + unit normalisasi + font guard.
 */

import { describe, it, expect } from 'vitest';

import {
  sanitizeElementStyle,
  sanitizeCustomStyle,
  styleMapToCssString,
} from '../core/style/sanitize';

describe('FASE 3: Sanitizer — Allow-list (dangerous props filtered)', () => {
  it('1. position is removed', () => {
    const result = sanitizeElementStyle({ position: 'fixed', background: 'red' });
    expect(result.position).toBeUndefined();
    expect(result.background).toBe('red');
  });

  it('2. display is removed', () => {
    const result = sanitizeElementStyle({ display: 'none', color: '#fff' });
    expect(result.display).toBeUndefined();
    expect(result.color).toBe('#fff');
  });

  it('3. width/height are removed', () => {
    const result = sanitizeElementStyle({ width: '9999px', height: '9999px', borderRadius: '24px' });
    expect(result.width).toBeUndefined();
    expect(result.height).toBeUndefined();
    expect(result.borderRadius).toBe('24px');
  });

  it('4. zIndex is removed', () => {
    const result = sanitizeElementStyle({ zIndex: '9999', background: 'blue' });
    expect(result.zIndex).toBeUndefined();
    expect(result.background).toBe('blue');
  });

  it('5. overflow is removed', () => {
    const result = sanitizeElementStyle({ overflow: 'visible', color: '#000' });
    expect(result.overflow).toBeUndefined();
  });

  it('6. left/top/right/bottom are removed', () => {
    const result = sanitizeElementStyle({ left: '0', top: '0', right: '0', bottom: '0' });
    expect(result.left).toBeUndefined();
    expect(result.top).toBeUndefined();
    expect(result.right).toBeUndefined();
    expect(result.bottom).toBeUndefined();
  });

  it('7. allowed aesthetic props survive', () => {
    const result = sanitizeElementStyle({
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      borderRadius: '24px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      color: '#ffffff',
      fontSize: '32px',
      fontWeight: '700',
      padding: '20px',
      backdropFilter: 'blur(10px)',
      transform: 'scale(1.05)',
    });
    expect(result.background).toContain('linear-gradient');
    expect(result.borderRadius).toBe('24px');
    expect(result.boxShadow).toContain('0 20px 60px');
    expect(result.color).toBe('#ffffff');
    expect(result.fontSize).toBe('32px');
    expect(result.fontWeight).toBe('700');
    expect(result.padding).toBe('20px');
    expect(result.backdropFilter).toBe('blur(10px)');
    expect(result.transform).toBe('scale(1.05)');
  });
});

describe('FASE 3: Sanitizer — Unit normalisasi', () => {
  it('8. numeric padding → px', () => {
    const result = sanitizeElementStyle({ padding: 20 as any });
    expect(result.padding).toBe('20px');
  });

  it('9. numeric fontSize → px', () => {
    const result = sanitizeElementStyle({ fontSize: 18 as any });
    expect(result.fontSize).toBe('18px');
  });

  it('10. opacity stays unitless', () => {
    const result = sanitizeElementStyle({ opacity: 0.5 as any });
    expect(result.opacity).toBe('0.5');
    expect(result.opacity).not.toContain('px');
  });

  it('11. lineHeight stays unitless', () => {
    const result = sanitizeElementStyle({ lineHeight: 1.5 as any });
    expect(result.lineHeight).toBe('1.5');
  });
});

describe('FASE 3: Sanitizer — Value clamping', () => {
  it('12. fontSize clamped to max 96px', () => {
    const result = sanitizeElementStyle({ fontSize: '999px' });
    expect(result.fontSize).toBe('96px');
  });

  it('13. numeric fontSize clamped to max 96', () => {
    const result = sanitizeElementStyle({ fontSize: 999 as any });
    expect(result.fontSize).toBe('96px');
  });

  it('14. borderRadius clamped to max 100px', () => {
    const result = sanitizeElementStyle({ borderRadius: '500px' });
    expect(result.borderRadius).toBe('100px');
  });

  it('15. negative margin converted to 0px', () => {
    const result = sanitizeElementStyle({ margin: '-999px' });
    expect(result.margin).toBe('0px');
  });
});

describe('FASE 3: Sanitizer — Font guard', () => {
  it('16. Comic Sans font removed', () => {
    const result = sanitizeElementStyle({ fontFamily: 'Comic Sans MS, sans-serif' });
    expect(result.fontFamily).toBeUndefined();
  });

  it('17. Poppins font removed (external)', () => {
    const result = sanitizeElementStyle({ fontFamily: 'Poppins, sans-serif' });
    expect(result.fontFamily).toBeUndefined();
  });

  it('18. system font survives', () => {
    const result = sanitizeElementStyle({ fontFamily: 'Georgia, serif' });
    expect(result.fontFamily).toBe('Georgia, serif');
  });

  it('19. Trebuchet MS survives', () => {
    const result = sanitizeElementStyle({ fontFamily: "'Trebuchet MS', sans-serif" });
    expect(result.fontFamily).toContain('Trebuchet');
  });
});

describe('FASE 3: Sanitizer — Full customStyle map', () => {
  it('20. sanitizeCustomStyle processes all elements', () => {
    const result = sanitizeCustomStyle({
      shell: { background: 'red', position: 'fixed' },
      header: { fontSize: '52px', display: 'none' },
      panel: { borderRadius: '24px', width: '9999px' },
    });
    expect(result?.shell?.background).toBe('red');
    expect(result?.shell?.position).toBeUndefined();
    expect(result?.header?.fontSize).toBe('52px');
    expect(result?.header?.display).toBeUndefined();
    expect(result?.panel?.borderRadius).toBe('24px');
    expect(result?.panel?.width).toBeUndefined();
  });

  it('21. sanitizeCustomStyle returns undefined for empty input', () => {
    expect(sanitizeCustomStyle(undefined)).toBeUndefined();
    expect(sanitizeCustomStyle(null)).toBeUndefined();
    expect(sanitizeCustomStyle({})).toBeUndefined();
  });

  it('22. sanitizeCustomStyle removes elements with no safe props left', () => {
    const result = sanitizeCustomStyle({
      shell: { position: 'fixed', display: 'none' },
      panel: { borderRadius: '24px' },
    });
    expect(result?.shell).toBeUndefined();
    expect(result?.panel?.borderRadius).toBe('24px');
  });
});

describe('FASE 3: styleMapToCssString', () => {
  it('23. converts camelCase to kebab-case', () => {
    const css = styleMapToCssString({ borderRadius: '24px', boxShadow: '0 4px 8px' });
    expect(css).toContain('border-radius:24px');
    expect(css).toContain('box-shadow:0 4px 8px');
  });

  it('24. handles multiple properties', () => {
    const css = styleMapToCssString({ background: 'red', color: '#fff', fontSize: '16px' });
    expect(css).toContain('background:red');
    expect(css).toContain('color:#fff');
    expect(css).toContain('font-size:16px');
  });
});

describe('FASE 3: Integration — customStyle does not crash editor', () => {
  it('25. dangerous customStyle is sanitized before reaching scene-blocks', () => {
    const dangerous = {
      shell: {
        position: 'fixed' as const,
        display: 'none' as const,
        width: '9999px',
        zIndex: '9999',
        background: 'red',
      },
    };
    const sanitized = sanitizeCustomStyle(dangerous);
    expect(sanitized?.shell?.position).toBeUndefined();
    expect(sanitized?.shell?.display).toBeUndefined();
    expect(sanitized?.shell?.width).toBeUndefined();
    expect(sanitized?.shell?.zIndex).toBeUndefined();
    expect(sanitized?.shell?.background).toBe('red');
  });
});
