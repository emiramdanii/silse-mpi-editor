/**
 * Tests for text component factory + validation + capability (M2R scope).
 *
 * Kontrak (docs/CORE_PRODUCT_CONTRACT.md section 5 + Batch 2R):
 *   - Setiap text component WAJIB punya field `variant`.
 *   - Default variant ditentukan oleh PageRole halaman.
 *   - Variant harus salah satu dari TEXT_COMPONENT_VARIANTS (7 nilai).
 *   - Component tanpa variant = scope leak, validation menolak.
 */

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TEXT_COMPONENT,
  createTextComponent,
  type TextComponentEditable,
} from '../core/component-factory';
import { TEXT_COMPONENT_VARIANTS, type PageRole } from '../core/types';
import {
  DEFAULT_TEXT_VARIANT_BY_ROLE,
  canAddComponent,
  getCapability,
} from '../core/capability';
import { isValidComponent, validateComponent } from '../core/validation';

describe('createTextComponent', () => {
  it('creates a text component with variant from PageRole', () => {
    const c = createTextComponent('free');
    expect(c.type).toBe('text');
    expect(c.id).toMatch(/^comp_/);
    expect(c.variant).toBe('body'); // free → body
    expect(c.text).toBe(DEFAULT_TEXT_COMPONENT.text);
  });

  it('assigns a unique id on each call', () => {
    const a = createTextComponent('free');
    const b = createTextComponent('free');
    expect(a.id).not.toBe(b.id);
  });

  it('default variant follows PageRole — cover → title', () => {
    const c = createTextComponent('cover');
    expect(c.variant).toBe('title');
  });

  it('default variant follows PageRole — starter → questionPrompt', () => {
    const c = createTextComponent('starter');
    expect(c.variant).toBe('questionPrompt');
  });

  it('default variant follows PageRole — activity → instruction', () => {
    const c = createTextComponent('activity');
    expect(c.variant).toBe('instruction');
  });

  it('default variant follows PageRole — quiz → questionPrompt', () => {
    const c = createTextComponent('quiz');
    expect(c.variant).toBe('questionPrompt');
  });

  it('default variant follows PageRole — reflection → reflectionBox', () => {
    const c = createTextComponent('reflection');
    expect(c.variant).toBe('reflectionBox');
  });

  it('default variant follows PageRole — material → body', () => {
    const c = createTextComponent('material');
    expect(c.variant).toBe('body');
  });

  it('applies partial overrides (text + geometry)', () => {
    const c = createTextComponent('free', { text: 'Halo', x: 200, y: 300, width: 800 });
    expect(c.text).toBe('Halo');
    expect(c.x).toBe(200);
    expect(c.y).toBe(300);
    expect(c.width).toBe(800);
    expect(c.variant).toBe('body'); // default for free
    expect(c.height).toBe(DEFAULT_TEXT_COMPONENT.height);
  });

  it('allows overriding variant explicitly', () => {
    const c = createTextComponent('free', { variant: 'title' });
    expect(c.variant).toBe('title');
  });

  it('overrides all editable fields when provided', () => {
    const overrides: TextComponentEditable = {
      text: 'Full',
      variant: 'importantNote',
      x: 50,
      y: 60,
      width: 700,
      height: 200,
    };
    const c = createTextComponent('free', overrides);
    expect(c).toMatchObject(overrides);
  });

  it('never allows overriding id or type', () => {
    const c = createTextComponent('free');
    expect(c.id).toMatch(/^comp_/);
    expect(c.type).toBe('text');
  });

  it('does NOT have field fontSize/color/fontWeight/align (M2R scope)', () => {
    const c = createTextComponent('free');
    expect((c as Record<string, unknown>).fontSize).toBeUndefined();
    expect((c as Record<string, unknown>).color).toBeUndefined();
    expect((c as Record<string, unknown>).fontWeight).toBeUndefined();
    expect((c as Record<string, unknown>).align).toBeUndefined();
  });
});

describe('DEFAULT_TEXT_COMPONENT', () => {
  it('has sensible non-empty defaults', () => {
    expect(DEFAULT_TEXT_COMPONENT.text.length).toBeGreaterThan(0);
    expect(DEFAULT_TEXT_COMPONENT.width).toBeGreaterThan(0);
    expect(DEFAULT_TEXT_COMPONENT.height).toBeGreaterThan(0);
  });
});

describe('TEXT_COMPONENT_VARIANTS', () => {
  it('contains exactly 7 variants', () => {
    expect(TEXT_COMPONENT_VARIANTS).toHaveLength(7);
  });

  it('contains all required variants', () => {
    expect(TEXT_COMPONENT_VARIANTS).toEqual([
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

describe('DEFAULT_TEXT_VARIANT_BY_ROLE', () => {
  it('cover → title', () => {
    expect(DEFAULT_TEXT_VARIANT_BY_ROLE.cover).toBe('title');
  });
  it('starter → questionPrompt', () => {
    expect(DEFAULT_TEXT_VARIANT_BY_ROLE.starter).toBe('questionPrompt');
  });
  it('activity → instruction', () => {
    expect(DEFAULT_TEXT_VARIANT_BY_ROLE.activity).toBe('instruction');
  });
  it('quiz → questionPrompt', () => {
    expect(DEFAULT_TEXT_VARIANT_BY_ROLE.quiz).toBe('questionPrompt');
  });
  it('reflection → reflectionBox', () => {
    expect(DEFAULT_TEXT_VARIANT_BY_ROLE.reflection).toBe('reflectionBox');
  });
  it('material/learningObjectives/closing/free → body', () => {
    expect(DEFAULT_TEXT_VARIANT_BY_ROLE.material).toBe('body');
    expect(DEFAULT_TEXT_VARIANT_BY_ROLE.learningObjectives).toBe('body');
    expect(DEFAULT_TEXT_VARIANT_BY_ROLE.closing).toBe('body');
    expect(DEFAULT_TEXT_VARIANT_BY_ROLE.free).toBe('body');
  });
});

describe('Capability Matrix — canAddComponent', () => {
  it('cover denies add (allowAddComponent=false)', () => {
    expect(canAddComponent('cover', 'text')).toBe(false);
  });

  it('free allows add text', () => {
    expect(canAddComponent('free', 'text')).toBe(true);
  });

  it('material allows add text', () => {
    expect(canAddComponent('material', 'text')).toBe(true);
  });

  it('all non-cover roles allow add text (M2)', () => {
    const roles: PageRole[] = [
      'learningObjectives',
      'starter',
      'material',
      'activity',
      'quiz',
      'reflection',
      'closing',
      'free',
    ];
    for (const r of roles) {
      expect(canAddComponent(r, 'text')).toBe(true);
    }
  });

  it('navigation NOT allowed for cover/learningObjectives/quiz (M5)', () => {
    expect(canAddComponent('cover', 'navigation' as never)).toBe(false);
    expect(canAddComponent('learningObjectives', 'navigation' as never)).toBe(false);
    expect(canAddComponent('quiz', 'navigation' as never)).toBe(false);
  });

  it('navigation allowed for material/activity/starter/free/reflection/closing (M5 active)', () => {
    expect(canAddComponent('material', 'navigation' as never)).toBe(true);
    expect(canAddComponent('activity', 'navigation' as never)).toBe(true);
    expect(canAddComponent('starter', 'navigation' as never)).toBe(true);
    expect(canAddComponent('free', 'navigation' as never)).toBe(true);
    expect(canAddComponent('reflection', 'navigation' as never)).toBe(true);
    expect(canAddComponent('closing', 'navigation' as never)).toBe(true);
  });

  it('image NOT allowed for cover (M4 — cover is controlled)', () => {
    expect(canAddComponent('cover', 'image' as never)).toBe(false);
  });

  it('image allowed for material/activity/free (M4 active)', () => {
    expect(canAddComponent('material', 'image' as never)).toBe(true);
    expect(canAddComponent('activity', 'image' as never)).toBe(true);
    expect(canAddComponent('free', 'image' as never)).toBe(true);
  });

  it('image NOT allowed for reflection (M4 — reflection is text+card only)', () => {
    expect(canAddComponent('reflection', 'image' as never)).toBe(false);
  });

  it('getCapability returns capability with description', () => {
    const cap = getCapability('cover');
    expect(cap.role).toBe('cover');
    expect(cap.allowAddComponent).toBe(false);
    expect(cap.description).toMatch(/pembuka/i);
    expect(cap.fixedSlots).toEqual(['title', 'subtitle', 'meta']);
  });
});

describe('validateComponent — text component variant required', () => {
  it('accepts a freshly created text component (variant present)', () => {
    const c = createTextComponent('free');
    const r = validateComponent(c);
    expect(r.ok).toBe(true);
    expect(isValidComponent(c)).toBe(true);
  });

  it('accepts text component with each valid variant', () => {
    for (const v of TEXT_COMPONENT_VARIANTS) {
      const c = createTextComponent('free', { variant: v });
      const r = validateComponent(c);
      expect(r.ok).toBe(true);
    }
  });

  it('REJECTS text component without variant field', () => {
    const c = createTextComponent('free');
    const broken = { ...c } as Record<string, unknown>;
    delete broken.variant;
    const r = validateComponent(broken);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.join('; ')).toMatch(/variant/i);
    }
  });

  it('REJECTS text component with invalid variant value', () => {
    const c = createTextComponent('free');
    const broken = { ...c, variant: 'invalidVariant' };
    const r = validateComponent(broken);
    expect(r.ok).toBe(false);
  });

  it('REJECTS text component with variant of wrong type (number)', () => {
    const c = createTextComponent('free');
    const broken = { ...c, variant: 123 };
    const r = validateComponent(broken);
    expect(r.ok).toBe(false);
  });

  it('REJECTS text component without text field', () => {
    const c = createTextComponent('free');
    const broken = { ...c } as Record<string, unknown>;
    delete broken.text;
    const r = validateComponent(broken);
    expect(r.ok).toBe(false);
  });

  it('REJECTS text component with non-positive width', () => {
    const c = createTextComponent('free', { width: 0 });
    const r = validateComponent(c);
    expect(r.ok).toBe(false);
  });

  it('REJECTS text component with missing id', () => {
    const c = createTextComponent('free');
    const broken = { ...c, id: '' };
    const r = validateComponent(broken);
    expect(r.ok).toBe(false);
  });

  it('REJECTS component with unknown type', () => {
    const c = createTextComponent('free');
    const broken = { ...c, type: 'unknown' };
    const r = validateComponent(broken);
    expect(r.ok).toBe(false);
  });
});
