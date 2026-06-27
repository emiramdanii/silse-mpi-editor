/**
 * Tests for text block factory + validation (M2 scope).
 */

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TEXT_BLOCK,
  createTextBlock,
  type TextBlockEditable,
} from '../core/block-factory';
import { isValidBlock, validateBlock } from '../core/validation';

describe('createTextBlock', () => {
  it('creates a text block with default values', () => {
    const b = createTextBlock();
    expect(b.type).toBe('text');
    expect(b.id).toMatch(/^block_/);
    expect(b.text).toBe(DEFAULT_TEXT_BLOCK.text);
    expect(b.fontSize).toBe(DEFAULT_TEXT_BLOCK.fontSize);
    expect(b.color).toBe(DEFAULT_TEXT_BLOCK.color);
    expect(b.fontWeight).toBe(DEFAULT_TEXT_BLOCK.fontWeight);
    expect(b.align).toBe(DEFAULT_TEXT_BLOCK.align);
  });

  it('assigns a unique id on each call', () => {
    const a = createTextBlock();
    const b = createTextBlock();
    expect(a.id).not.toBe(b.id);
  });

  it('applies partial overrides', () => {
    const b = createTextBlock({ text: 'Halo', fontSize: 48, color: '#ff0000' });
    expect(b.text).toBe('Halo');
    expect(b.fontSize).toBe(48);
    expect(b.color).toBe('#ff0000');
    // Untouched fields keep defaults
    expect(b.align).toBe(DEFAULT_TEXT_BLOCK.align);
  });

  it('overrides all editable fields when provided', () => {
    const overrides: TextBlockEditable = {
      text: 'Full',
      x: 50,
      y: 60,
      width: 700,
      height: 200,
      fontSize: 32,
      color: '#00ff00',
      fontWeight: 'bold',
      align: 'right',
    };
    const b = createTextBlock(overrides);
    expect(b).toMatchObject(overrides);
  });

  it('never allows overriding id or type', () => {
    // TS prevents it at compile time; runtime: createTextBlock only accepts TextBlockEditable
    // which omits id/type. We assert the factory always sets them.
    const b = createTextBlock();
    expect(b.id).toMatch(/^block_/);
    expect(b.type).toBe('text');
  });
});

describe('DEFAULT_TEXT_BLOCK', () => {
  it('has sensible non-empty defaults', () => {
    expect(DEFAULT_TEXT_BLOCK.text.length).toBeGreaterThan(0);
    expect(DEFAULT_TEXT_BLOCK.width).toBeGreaterThan(0);
    expect(DEFAULT_TEXT_BLOCK.height).toBeGreaterThan(0);
    expect(DEFAULT_TEXT_BLOCK.fontSize).toBeGreaterThan(0);
    expect(DEFAULT_TEXT_BLOCK.color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('uses a valid fontWeight value', () => {
    expect(['normal', 'bold']).toContain(DEFAULT_TEXT_BLOCK.fontWeight);
  });

  it('uses a valid align value', () => {
    expect(['left', 'center', 'right']).toContain(DEFAULT_TEXT_BLOCK.align);
  });
});

describe('validateBlock — text block', () => {
  it('accepts a freshly created text block', () => {
    const b = createTextBlock();
    expect(validateBlock(b).ok).toBe(true);
    expect(isValidBlock(b)).toBe(true);
  });

  it('rejects text block with non-positive width', () => {
    const b = createTextBlock({ width: 0 });
    const r = validateBlock(b);
    expect(r.ok).toBe(false);
  });

  it('rejects text block with non-positive height', () => {
    const b = createTextBlock({ height: -10 });
    const r = validateBlock(b);
    expect(r.ok).toBe(false);
  });

  it('rejects text block with missing id', () => {
    const b = createTextBlock();
    const broken = { ...b, id: '' };
    expect(validateBlock(broken).ok).toBe(false);
  });

  it('rejects block with unknown type', () => {
    const b = createTextBlock();
    const broken = { ...b, type: 'unknown' };
    expect(validateBlock(broken).ok).toBe(false);
  });
});
