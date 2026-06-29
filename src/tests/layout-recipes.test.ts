/**
 * Tests for layout recipes (M4 scope).
 *
 * Kontrak:
 *   - 3 recipes: blank, coverCentered, singleColumn.
 *   - Recipe = metadata (id, name, description, safeArea, slots).
 *   - Serializable (no function/class).
 *   - getLayoutRecipe returns recipe by id.
 */

import { describe, expect, it } from 'vitest';
import {
  LAYOUT_RECIPES,
  getAllLayoutRecipeIds,
  getLayoutRecipe,
} from '../core/layout-recipes';
import { LAYOUT_IDS, type LayoutId } from '../core/types';

describe('layout recipes registry', () => {
  it('has recipe for each legacy LAYOUT_IDS (blank, coverCentered, singleColumn)', () => {
    // LAYOUT-PRESET-SYSTEM-V1: New preset IDs don't have entries in LAYOUT_RECIPES.
    // They are handled by src/core/layout-presets/ instead. Only check legacy IDs.
    const legacyIds: LayoutId[] = ['blank', 'coverCentered', 'singleColumn'];
    for (const id of legacyIds) {
      expect(LAYOUT_RECIPES[id]).toBeDefined();
      expect(LAYOUT_RECIPES[id]!.id).toBe(id);
    }
  });

  it('exactly 3 legacy recipes (LAYOUT-PRESET-SYSTEM-V1: new presets handled separately)', () => {
    const legacyIds: LayoutId[] = ['blank', 'coverCentered', 'singleColumn'];
    expect(legacyIds).toHaveLength(3);
    expect(getAllLayoutRecipeIds()).toHaveLength(3);
  });
});

describe('recipe structure', () => {
  it('blank recipe has safeArea but no slots', () => {
    const r = LAYOUT_RECIPES.blank!;
    expect(r.id).toBe('blank');
    expect(r.name).toBeDefined();
    expect(r.description).toBeDefined();
    expect(r.safeArea).toBeDefined();
    expect(r.safeArea.width).toBeGreaterThan(0);
    expect(r.safeArea.height).toBeGreaterThan(0);
    expect(r.slots).toBeUndefined();
  });

  it('coverCentered recipe has title slot', () => {
    const r = LAYOUT_RECIPES.coverCentered!;
    expect(r.id).toBe('coverCentered');
    expect(r.slots).toBeDefined();
    expect(r.slots!.length).toBeGreaterThan(0);
    const titleSlot = r.slots!.find((s) => s.id === 'title');
    expect(titleSlot).toBeDefined();
    expect(titleSlot!.width).toBeGreaterThan(0);
  });

  it('singleColumn recipe has body slot', () => {
    const r = LAYOUT_RECIPES.singleColumn!;
    expect(r.id).toBe('singleColumn');
    expect(r.slots).toBeDefined();
    const bodySlot = r.slots!.find((s) => s.id === 'body');
    expect(bodySlot).toBeDefined();
  });

  it('all safeAreas are within canvas 1280x720', () => {
    for (const id of LAYOUT_IDS) {
      const r = LAYOUT_RECIPES[id];
      // LAYOUT-PRESET-SYSTEM-V1: new preset IDs don't have entries in LAYOUT_RECIPES.
      // They are handled by src/core/layout-presets/ instead. Skip undefined.
      if (!r) continue;
      expect(r.safeArea.x).toBeGreaterThanOrEqual(0);
      expect(r.safeArea.y).toBeGreaterThanOrEqual(0);
      expect(r.safeArea.x + r.safeArea.width).toBeLessThanOrEqual(1280);
      expect(r.safeArea.y + r.safeArea.height).toBeLessThanOrEqual(720);
    }
  });
});

describe('getLayoutRecipe', () => {
  it('returns recipe for valid id', () => {
    expect(getLayoutRecipe('blank')?.id).toBe('blank');
    expect(getLayoutRecipe('coverCentered')?.id).toBe('coverCentered');
    expect(getLayoutRecipe('singleColumn')?.id).toBe('singleColumn');
  });

  it('returns undefined for unknown id (type-safe)', () => {
    // LayoutId is a union, so we can't pass arbitrary string — but
    // getLayoutRecipe accepts LayoutId. Test via cast.
    expect(getLayoutRecipe('unknown' as LayoutId)).toBeUndefined();
  });
});

describe('recipe serializability', () => {
  it('all recipes survive JSON round-trip', () => {
    for (const id of LAYOUT_IDS) {
      const r = LAYOUT_RECIPES[id];
      // LAYOUT-PRESET-SYSTEM-V1: skip new preset IDs without entries.
      if (!r) continue;
      const json = JSON.stringify(r);
      const parsed = JSON.parse(json);
      expect(parsed.id).toBe(r.id);
      expect(parsed.name).toBe(r.name);
      expect(parsed.safeArea.x).toBe(r.safeArea.x);
    }
  });

  it('no function/class in recipes', () => {
    for (const id of LAYOUT_IDS) {
      const r = LAYOUT_RECIPES[id];
      // LAYOUT-PRESET-SYSTEM-V1: skip new preset IDs without entries.
      if (!r) continue;
      const json = JSON.stringify(r);
      expect(json).not.toMatch(/function/i);
      expect(json).not.toMatch(/class /i);
    }
  });
});
