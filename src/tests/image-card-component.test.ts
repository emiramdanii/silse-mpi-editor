/**
 * Tests for image + card component (M4 scope).
 *
 * Kontrak:
 *   - ImageComponent wajib variant valid + src non-empty + objectFit valid.
 *   - CardComponent wajib variant valid + body string.
 *   - Card BUKAN nested container (reject components/children fields).
 *   - Capability menolak image/card di role yang tidak boleh.
 *   - Duplicate page regenerates image/card component ids.
 */

import { describe, expect, it } from 'vitest';
import {
  createCardComponent,
  createImageComponent,
} from '../core/component-factory';
import {
  CARD_COMPONENT_VARIANTS,
  IMAGE_COMPONENT_VARIANTS,
} from '../core/types';
import { canAddComponent } from '../core/capability';
import { isValidComponent, validateComponent } from '../core/validation';

// =========================================================================
// createImageComponent
// =========================================================================

describe('createImageComponent', () => {
  it('creates an image component with default variant=illustration', () => {
    const c = createImageComponent('data:image/png;base64,abc');
    expect(c.type).toBe('image');
    expect(c.id).toMatch(/^comp_/);
    expect(c.variant).toBe('illustration');
    expect(c.src).toBe('data:image/png;base64,abc');
    expect(c.objectFit).toBe('cover');
  });

  it('assigns unique id on each call', () => {
    const a = createImageComponent('src1');
    const b = createImageComponent('src2');
    expect(a.id).not.toBe(b.id);
  });

  it('applies overrides', () => {
    const c = createImageComponent('src', {
      variant: 'imageCard',
      alt: 'Diagram',
      objectFit: 'contain',
      x: 300,
      y: 200,
    });
    expect(c.variant).toBe('imageCard');
    expect(c.alt).toBe('Diagram');
    expect(c.objectFit).toBe('contain');
    expect(c.x).toBe(300);
    expect(c.y).toBe(200);
  });

  it('each valid variant works', () => {
    for (const v of IMAGE_COMPONENT_VARIANTS) {
      const c = createImageComponent('src', { variant: v });
      expect(c.variant).toBe(v);
    }
  });
});

// =========================================================================
// createCardComponent
// =========================================================================

describe('createCardComponent', () => {
  it('creates a card with default variant=infoCard', () => {
    const c = createCardComponent('Isi card');
    expect(c.type).toBe('card');
    expect(c.id).toMatch(/^comp_/);
    expect(c.variant).toBe('infoCard');
    expect(c.body).toBe('Isi card');
    expect(c.title).toBe('');
  });

  it('assigns unique id on each call', () => {
    const a = createCardComponent('a');
    const b = createCardComponent('b');
    expect(a.id).not.toBe(b.id);
  });

  it('applies overrides', () => {
    const c = createCardComponent('Body', {
      variant: 'importantNote',
      title: 'Perhatian!',
      x: 100,
      y: 200,
    });
    expect(c.variant).toBe('importantNote');
    expect(c.title).toBe('Perhatian!');
    expect(c.body).toBe('Body');
    expect(c.x).toBe(100);
  });

  it('each valid variant works', () => {
    for (const v of CARD_COMPONENT_VARIANTS) {
      const c = createCardComponent('body', { variant: v });
      expect(c.variant).toBe(v);
    }
  });

  it('does NOT have nested components/children field', () => {
    const c = createCardComponent('body');
    expect((c as Record<string, unknown>).components).toBeUndefined();
    expect((c as Record<string, unknown>).children).toBeUndefined();
  });
});

// =========================================================================
// validateImageComponent
// =========================================================================

describe('validateImageComponent', () => {
  it('accepts a freshly created image component', () => {
    const c = createImageComponent('data:image/png;base64,abc');
    expect(validateComponent(c).ok).toBe(true);
    expect(isValidComponent(c)).toBe(true);
  });

  it('rejects image without variant', () => {
    const c = createImageComponent('src');
    const broken = { ...c } as Record<string, unknown>;
    delete broken.variant;
    expect(validateComponent(broken).ok).toBe(false);
  });

  it('rejects image with invalid variant', () => {
    const c = createImageComponent('src');
    const broken = { ...c, variant: 'invalidVariant' };
    expect(validateComponent(broken).ok).toBe(false);
  });

  it('rejects image without src', () => {
    const c = createImageComponent('src');
    const broken = { ...c, src: '' };
    expect(validateComponent(broken).ok).toBe(false);
  });

  it('rejects image with invalid objectFit', () => {
    const c = createImageComponent('src');
    const broken = { ...c, objectFit: 'fill' };
    expect(validateComponent(broken).ok).toBe(false);
  });

  it('rejects image with non-string alt', () => {
    const c = createImageComponent('src');
    const broken = { ...c, alt: 123 };
    expect(validateComponent(broken).ok).toBe(false);
  });
});

// =========================================================================
// validateCardComponent
// =========================================================================

describe('validateCardComponent', () => {
  it('accepts a freshly created card component', () => {
    const c = createCardComponent('Isi card');
    expect(validateComponent(c).ok).toBe(true);
    expect(isValidComponent(c)).toBe(true);
  });

  it('rejects card without variant', () => {
    const c = createCardComponent('body');
    const broken = { ...c } as Record<string, unknown>;
    delete broken.variant;
    expect(validateComponent(broken).ok).toBe(false);
  });

  it('rejects card with invalid variant', () => {
    const c = createCardComponent('body');
    const broken = { ...c, variant: 'invalidVariant' };
    expect(validateComponent(broken).ok).toBe(false);
  });

  it('rejects card without body', () => {
    const c = createCardComponent('body');
    const broken = { ...c } as Record<string, unknown>;
    delete broken.body;
    expect(validateComponent(broken).ok).toBe(false);
  });

  it('rejects card with non-string title', () => {
    const c = createCardComponent('body');
    const broken = { ...c, title: 123 };
    expect(validateComponent(broken).ok).toBe(false);
  });

  it('REJECTS card with nested components field (anti-pattern guard)', () => {
    const c = createCardComponent('body');
    const broken = { ...c, components: [] };
    expect(validateComponent(broken).ok).toBe(false);
  });

  it('REJECTS card with nested children field (anti-pattern guard)', () => {
    const c = createCardComponent('body');
    const broken = { ...c, children: [] };
    expect(validateComponent(broken).ok).toBe(false);
  });
});

// =========================================================================
// Capability Matrix — image/card
// =========================================================================

describe('Capability Matrix — image/card per role (M4)', () => {
  it('cover denies image and card', () => {
    expect(canAddComponent('cover', 'image')).toBe(false);
    expect(canAddComponent('cover', 'card')).toBe(false);
  });

  it('material allows text, image, card', () => {
    expect(canAddComponent('material', 'text')).toBe(true);
    expect(canAddComponent('material', 'image')).toBe(true);
    expect(canAddComponent('material', 'card')).toBe(true);
  });

  it('activity allows text, image, card', () => {
    expect(canAddComponent('activity', 'text')).toBe(true);
    expect(canAddComponent('activity', 'image')).toBe(true);
    expect(canAddComponent('activity', 'card')).toBe(true);
  });

  it('starter allows text, image, card', () => {
    expect(canAddComponent('starter', 'text')).toBe(true);
    expect(canAddComponent('starter', 'image')).toBe(true);
    expect(canAddComponent('starter', 'card')).toBe(true);
  });

  it('free allows text, image, card', () => {
    expect(canAddComponent('free', 'text')).toBe(true);
    expect(canAddComponent('free', 'image')).toBe(true);
    expect(canAddComponent('free', 'card')).toBe(true);
  });

  it('reflection allows text + card but NOT image', () => {
    expect(canAddComponent('reflection', 'text')).toBe(true);
    expect(canAddComponent('reflection', 'card')).toBe(true);
    expect(canAddComponent('reflection', 'image')).toBe(false);
  });

  it('learningObjectives allows text only (no image/card)', () => {
    expect(canAddComponent('learningObjectives', 'text')).toBe(true);
    expect(canAddComponent('learningObjectives', 'image')).toBe(false);
    expect(canAddComponent('learningObjectives', 'card')).toBe(false);
  });

  it('quiz allows text only (no image/card)', () => {
    expect(canAddComponent('quiz', 'text')).toBe(true);
    expect(canAddComponent('quiz', 'image')).toBe(false);
    expect(canAddComponent('quiz', 'card')).toBe(false);
  });

  it('closing allows text only (no image/card)', () => {
    expect(canAddComponent('closing', 'text')).toBe(true);
    expect(canAddComponent('closing', 'image')).toBe(false);
    expect(canAddComponent('closing', 'card')).toBe(false);
  });

  it('navigation not yet allowed for any role (M5)', () => {
    const roles = ['cover', 'free', 'material', 'activity'] as const;
    for (const r of roles) {
      expect(canAddComponent(r, 'navigation' as never)).toBe(false);
    }
  });
});
