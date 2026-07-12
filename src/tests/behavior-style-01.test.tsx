/**
 * L4-1: Sanitizer hardening tests — XSS guard, transition, animation, transform, filter.
 *
 * Verifies that dangerous values are rejected and safe values pass.
 */

import { describe, it, expect } from 'vitest';
import { sanitizeElementStyle, sanitizeCustomStyle } from '../core/style/sanitize';

describe('L4-1 — XSS Guard (global)', () => {
  it('1. rejects url() in any property value', () => {
    const result = sanitizeElementStyle({ background: 'url(javascript:alert(1))' });
    expect(result.background).toBeUndefined();
  });

  it('2. rejects expression() in any property value', () => {
    const result = sanitizeElementStyle({ color: 'expression(alert(1))' });
    expect(result.color).toBeUndefined();
  });

  it('3. rejects javascript: in any property value', () => {
    const result = sanitizeElementStyle({ backgroundImage: 'javascript:alert(1)' });
    expect(result.backgroundImage).toBeUndefined();
  });

  it('4. rejects <script> in any property value', () => {
    const result = sanitizeElementStyle({ content: '<script>alert(1)</script>' });
    // content is not in ALLOWED list so it's filtered by property whitelist,
    // but XSS guard runs first — verify it doesn't crash
    expect(result.content).toBeUndefined();
  });

  it('5. allows safe values without url()', () => {
    const result = sanitizeElementStyle({ background: 'linear-gradient(135deg, #667eea, #764ba2)' });
    expect(result.background).toBe('linear-gradient(135deg, #667eea, #764ba2)');
  });
});

describe('L4-1 — transition validation', () => {
  it('6. allows specific property transition', () => {
    const result = sanitizeElementStyle({ transition: 'transform 0.3s ease-out' });
    expect(result.transition).toBe('transform 0.3s ease-out');
  });

  it('7. allows multiple transitions (max 3)', () => {
    const result = sanitizeElementStyle({ transition: 'transform 0.3s ease, opacity 0.2s ease-in, box-shadow 0.15s linear' });
    expect(result.transition).toBeDefined();
  });

  it('8. blocks "all" keyword', () => {
    const result = sanitizeElementStyle({ transition: 'all 0.3s ease' });
    expect(result.transition).toBeUndefined();
  });

  it('9. blocks duration > 1000ms', () => {
    const result = sanitizeElementStyle({ transition: 'transform 2000ms ease' });
    expect(result.transition).toBeUndefined();
  });

  it('10. blocks duration > 1s', () => {
    const result = sanitizeElementStyle({ transition: 'transform 1.5s ease' });
    expect(result.transition).toBeUndefined();
  });

  it('11. allows cubic-bezier easing', () => {
    const result = sanitizeElementStyle({ transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' });
    expect(result.transition).toBe('transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)');
  });

  it('12. blocks invalid cubic-bezier (out of range)', () => {
    const result = sanitizeElementStyle({ transition: 'transform 0.3s cubic-bezier(0.4, 0, 1.5, 1)' });
    expect(result.transition).toBeUndefined();
  });

  it('13. blocks more than 3 transitions', () => {
    const result = sanitizeElementStyle({ transition: 'transform 0.3s ease, opacity 0.2s ease, box-shadow 0.15s linear, color 0.1s ease' });
    expect(result.transition).toBeUndefined();
  });

  it('14. allows transition without easing (browser defaults to ease)', () => {
    const result = sanitizeElementStyle({ transition: 'transform 0.3s' });
    expect(result.transition).toBe('transform 0.3s');
  });
});

describe('L4-1 — animation validation', () => {
  it('15. allows whitelisted animation name', () => {
    const result = sanitizeElementStyle({ animation: 'silse-fade-in-soft 0.3s ease-out' });
    expect(result.animation).toBe('silse-fade-in-soft 0.3s ease-out');
  });

  it('16. allows silse-motion-* names', () => {
    const result = sanitizeElementStyle({ animation: 'silse-motion-entrance-fade 220ms ease-out' });
    expect(result.animation).toBe('silse-motion-entrance-fade 220ms ease-out');
  });

  it('17. allows "none"', () => {
    const result = sanitizeElementStyle({ animation: 'none' });
    expect(result.animation).toBe('none');
  });

  it('18. blocks "infinite" keyword', () => {
    const result = sanitizeElementStyle({ animation: 'silse-mission-pulse 3s ease-in-out infinite' });
    expect(result.animation).toBeUndefined();
  });

  it('19. blocks non-whitelisted animation name', () => {
    const result = sanitizeElementStyle({ animation: 'custom-evil-animation 1s ease' });
    expect(result.animation).toBeUndefined();
  });

  it('20. blocks duration > 1000ms', () => {
    const result = sanitizeElementStyle({ animation: 'silse-fade-in-soft 2000ms ease' });
    expect(result.animation).toBeUndefined();
  });
});

describe('L4-1 — transform validation', () => {
  it('21. allows translateX within range', () => {
    const result = sanitizeElementStyle({ transform: 'translateX(50px)' });
    expect(result.transform).toBe('translateX(50px)');
  });

  it('22. blocks translateX > 100px', () => {
    const result = sanitizeElementStyle({ transform: 'translateX(200px)' });
    expect(result.transform).toBeUndefined();
  });

  it('23. blocks translateX < -100px', () => {
    const result = sanitizeElementStyle({ transform: 'translateX(-150px)' });
    expect(result.transform).toBeUndefined();
  });

  it('24. allows scale within 0.8-1.2', () => {
    const result = sanitizeElementStyle({ transform: 'scale(1.05)' });
    expect(result.transform).toBe('scale(1.05)');
  });

  it('25. blocks scale > 1.2', () => {
    const result = sanitizeElementStyle({ transform: 'scale(2)' });
    expect(result.transform).toBeUndefined();
  });

  it('26. blocks scale < 0.8', () => {
    const result = sanitizeElementStyle({ transform: 'scale(0.5)' });
    expect(result.transform).toBeUndefined();
  });

  it('27. allows rotate within ±360deg', () => {
    const result = sanitizeElementStyle({ transform: 'rotate(45deg)' });
    expect(result.transform).toBe('rotate(45deg)');
  });

  it('28. blocks rotate > 360deg', () => {
    const result = sanitizeElementStyle({ transform: 'rotate(720deg)' });
    expect(result.transform).toBeUndefined();
  });

  it('29. blocks matrix()', () => {
    const result = sanitizeElementStyle({ transform: 'matrix(1, 0, 0, 1, 0, 0)' });
    expect(result.transform).toBeUndefined();
  });

  it('30. allows combined transforms', () => {
    const result = sanitizeElementStyle({ transform: 'translateX(10px) scale(1.1) rotate(15deg)' });
    expect(result.transform).toBe('translateX(10px) scale(1.1) rotate(15deg)');
  });
});

describe('L4-1 — filter validation', () => {
  it('31. allows blur within 20px', () => {
    const result = sanitizeElementStyle({ filter: 'blur(10px)' });
    expect(result.filter).toBe('blur(10px)');
  });

  it('32. clamps blur > 20px to 20px', () => {
    const result = sanitizeElementStyle({ filter: 'blur(50px)' });
    expect(result.filter).toBe('blur(20px)');
  });

  it('33. blocks url() in filter', () => {
    const result = sanitizeElementStyle({ filter: 'url(javascript:alert(1))' });
    expect(result.filter).toBeUndefined();
  });

  it('34. allows backdropFilter with blur', () => {
    const result = sanitizeElementStyle({ backdropFilter: 'blur(8px)' });
    expect(result.backdropFilter).toBe('blur(8px)');
  });
});

describe('L4-1 — integration: customStyle with behavior properties', () => {
  it('35. customStyle with transition passes sanitizer', () => {
    const result = sanitizeCustomStyle({
      button: { transition: 'transform 0.2s ease-out', transform: 'scale(1.05)' },
    });
    expect(result?.button?.transition).toBe('transform 0.2s ease-out');
    expect(result?.button?.transform).toBe('scale(1.05)');
  });

  it('36. customStyle with dangerous transition is stripped', () => {
    const result = sanitizeCustomStyle({
      button: { transition: 'all 9999s ease' },
    });
    expect(result?.button?.transition).toBeUndefined();
  });

  it('37. customStyle with animation preset passes', () => {
    const result = sanitizeCustomStyle({
      panel: { animation: 'silse-motion-entrance-fade 220ms ease-out' },
    });
    expect(result?.panel?.animation).toBe('silse-motion-entrance-fade 220ms ease-out');
  });

  it('38. customStyle with infinite animation is stripped', () => {
    const result = sanitizeCustomStyle({
      panel: { animation: 'silse-mission-pulse 3s infinite' },
    });
    expect(result?.panel?.animation).toBeUndefined();
  });
});
