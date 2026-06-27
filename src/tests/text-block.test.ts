/**
 * Tests for text block factory + validation (M2 scope).
 *
 * Kontrak (docs/CORE_PRODUCT_CONTRACT.md section 5):
 *   - Setiap text block WAJIB punya field `variant`.
 *   - Default variant = 'body'.
 *   - Variant harus salah satu dari TEXT_BLOCK_VARIANTS (7 nilai).
 *   - Block tanpa variant = scope leak, validation menolak.
 */

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TEXT_BLOCK,
  DEFAULT_TEXT_VARIANT,
  createTextBlock,
  type TextBlockEditable,
} from '../core/block-factory';
import { TEXT_BLOCK_VARIANTS } from '../core/types';
import { isValidBlock, validateBlock } from '../core/validation';

describe('createTextBlock', () => {
  it('creates a text block with default variant = "body"', () => {
    const b = createTextBlock();
    expect(b.type).toBe('text');
    expect(b.id).toMatch(/^block_/);
    expect(b.variant).toBe(DEFAULT_TEXT_VARIANT);
    expect(b.variant).toBe('body');
    expect(b.text).toBe(DEFAULT_TEXT_BLOCK.text);
  });

  it('assigns a unique id on each call', () => {
    const a = createTextBlock();
    const b = createTextBlock();
    expect(a.id).not.toBe(b.id);
  });

  it('applies partial overrides (text + geometry)', () => {
    const b = createTextBlock({ text: 'Halo', x: 200, y: 300, width: 800 });
    expect(b.text).toBe('Halo');
    expect(b.x).toBe(200);
    expect(b.y).toBe(300);
    expect(b.width).toBe(800);
    // Untouched fields keep defaults
    expect(b.variant).toBe('body');
    expect(b.height).toBe(DEFAULT_TEXT_BLOCK.height);
  });

  it('allows overriding variant', () => {
    const b = createTextBlock({ variant: 'title' });
    expect(b.variant).toBe('title');
  });

  it('overrides all editable fields when provided', () => {
    const overrides: TextBlockEditable = {
      text: 'Full',
      variant: 'importantNote',
      x: 50,
      y: 60,
      width: 700,
      height: 200,
    };
    const b = createTextBlock(overrides);
    expect(b).toMatchObject(overrides);
  });

  it('never allows overriding id or type', () => {
    const b = createTextBlock();
    expect(b.id).toMatch(/^block_/);
    expect(b.type).toBe('text');
  });

  it('does NOT have field fontSize/color/fontWeight/align (M2 scope)', () => {
    const b = createTextBlock();
    expect((b as Record<string, unknown>).fontSize).toBeUndefined();
    expect((b as Record<string, unknown>).color).toBeUndefined();
    expect((b as Record<string, unknown>).fontWeight).toBeUndefined();
    expect((b as Record<string, unknown>).align).toBeUndefined();
  });
});

describe('DEFAULT_TEXT_BLOCK', () => {
  it('has variant = "body"', () => {
    expect(DEFAULT_TEXT_BLOCK.variant).toBe('body');
  });

  it('has sensible non-empty defaults', () => {
    expect(DEFAULT_TEXT_BLOCK.text.length).toBeGreaterThan(0);
    expect(DEFAULT_TEXT_BLOCK.width).toBeGreaterThan(0);
    expect(DEFAULT_TEXT_BLOCK.height).toBeGreaterThan(0);
  });

  it('uses a valid variant value', () => {
    expect(TEXT_BLOCK_VARIANTS).toContain(DEFAULT_TEXT_BLOCK.variant);
  });
});

describe('TEXT_BLOCK_VARIANTS', () => {
  it('contains exactly 7 variants', () => {
    expect(TEXT_BLOCK_VARIANTS).toHaveLength(7);
  });

  it('contains all required variants', () => {
    expect(TEXT_BLOCK_VARIANTS).toEqual([
      'title',
      'subtitle',
      'body',
      'instruction',
      'importantNote',
      'questionPrompt',
      'reflectionBox',
    ]);
  });
});

describe('validateBlock — text block variant required', () => {
  it('accepts a freshly created text block (variant present)', () => {
    const b = createTextBlock();
    const r = validateBlock(b);
    expect(r.ok).toBe(true);
    expect(isValidBlock(b)).toBe(true);
  });

  it('accepts text block with each valid variant', () => {
    for (const v of TEXT_BLOCK_VARIANTS) {
      const b = createTextBlock({ variant: v });
      const r = validateBlock(b);
      expect(r.ok).toBe(true);
    }
  });

  it('REJECTS text block without variant field', () => {
    const b = createTextBlock();
    const broken = { ...b } as Record<string, unknown>;
    delete broken.variant;
    const r = validateBlock(broken);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.join('; ')).toMatch(/variant/i);
    }
  });

  it('REJECTS text block with invalid variant value', () => {
    const b = createTextBlock();
    const broken = { ...b, variant: 'invalidVariant' };
    const r = validateBlock(broken);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.join('; ')).toMatch(/variant/i);
    }
  });

  it('REJECTS text block with variant of wrong type (number)', () => {
    const b = createTextBlock();
    const broken = { ...b, variant: 123 };
    const r = validateBlock(broken);
    expect(r.ok).toBe(false);
  });

  it('REJECTS text block without text field', () => {
    const b = createTextBlock();
    const broken = { ...b } as Record<string, unknown>;
    delete broken.text;
    const r = validateBlock(broken);
    expect(r.ok).toBe(false);
  });

  it('REJECTS text block with non-positive width', () => {
    const b = createTextBlock({ width: 0 });
    const r = validateBlock(b);
    expect(r.ok).toBe(false);
  });

  it('REJECTS text block with non-positive height', () => {
    const b = createTextBlock({ height: -10 });
    const r = validateBlock(b);
    expect(r.ok).toBe(false);
  });

  it('REJECTS text block with missing id', () => {
    const b = createTextBlock();
    const broken = { ...b, id: '' };
    const r = validateBlock(broken);
    expect(r.ok).toBe(false);
  });

  it('REJECTS block with unknown type', () => {
    const b = createTextBlock();
    const broken = { ...b, type: 'unknown' };
    const r = validateBlock(broken);
    expect(r.ok).toBe(false);
  });
});
