/**
 * Smart Geometry Helper (DESIGN-INTELLIGENCE-ENGINE-V1).
 *
 * Layer: core/design (pure function, no React/DOM)
 * Allowed imports: ../types, ./design-tokens, ./layout-recipes
 *
 * Kontrak (DIE-V1 Scope 3):
 *   getDesignRecipeForRole(role) — dapatkan recipe untuk role.
 *   placeComponentInRecipe(componentType, recipe, index) — hitung posisi
 *     optimal untuk komponen ke-n di dalam recipe zones.
 *   applyPageDesignRecipe(page) — terapkan recipe ke semua komponen di
 *     halaman. HANYA atur geometry (x/y/width/height). TIDAK mengubah
 *     isi materi (text, body, layers, dll).
 */

import type { SimplePage, PageComponent, ComponentType } from '../types';
import type { LayoutRecipe, Zone } from './layout-recipes';
import { getLayoutRecipeForRole } from './layout-recipes';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './design-tokens';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlacedGeometry = {
  x: number;
  y: number;
  width: number;
  height: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getDesignRecipeForRole(role: SimplePage['role']): LayoutRecipe {
  return getLayoutRecipeForRole(role);
}

/**
 * Determine which zone a component type should go into.
 */
function getZoneForComponentType(type: ComponentType, recipe: LayoutRecipe): Zone {
  // Navigation components go to action zone
  if (type === 'navigation') {
    return recipe.actionZone.width > 0 ? recipe.actionZone : recipe.contentZone;
  }
  // Title-like text (first text component) goes to title zone
  // Other content goes to content zone
  return recipe.contentZone;
}

/**
 * Place a component in the recipe based on its type and index.
 * Returns optimal geometry (x/y/width/height) within the zone.
 */
export function placeComponentInRecipe(
  componentType: ComponentType,
  recipe: LayoutRecipe,
  index: number,
): PlacedGeometry {
  const zone = getZoneForComponentType(componentType, recipe);
  const sa = recipe.safeArea;

  // Navigation: place in action zone (bottom right)
  if (componentType === 'navigation') {
    if (recipe.actionZone.width > 0) {
      return {
        x: recipe.actionZone.x,
        y: recipe.actionZone.y,
        width: Math.min(recipe.actionZone.width, 300),
        height: Math.min(recipe.actionZone.height, 60),
      };
    }
    // Fallback: bottom right with safe area
    return {
      x: CANVAS_WIDTH - sa - 300,
      y: CANVAS_HEIGHT - sa - 60,
      width: 300,
      height: 60,
    };
  }

  // Layered-info / learning-bridge: full content zone width
  if (componentType === 'layered-info' || componentType === 'learning-bridge') {
    return {
      x: zone.x,
      y: zone.y,
      width: zone.width,
      height: Math.min(zone.height, 460),
    };
  }

  // Card: half width, stacked vertically
  if (componentType === 'card') {
    const cardW = Math.min((zone.width - 20) / 2, 520);
    const cardH = 160;
    const col = index % 2;
    const row = Math.floor(index / 2);
    return {
      x: zone.x + col * (cardW + 20),
      y: zone.y + row * (cardH + 20),
      width: cardW,
      height: cardH,
    };
  }

  // Image: left half or full width
  if (componentType === 'image') {
    return {
      x: zone.x,
      y: zone.y,
      width: Math.min(zone.width * 0.4, 440),
      height: 320,
    };
  }

  // Text: full width, stacked vertically
  // First text (index 0) → title zone height
  // Subsequent → content zone
  const isTitle = index === 0;
  return {
    x: zone.x,
    y: zone.y + (isTitle ? 0 : Math.min(index * 100, zone.height - 100)),
    width: zone.width,
    height: isTitle ? 60 : Math.min(120, zone.height - 100),
  };
}

/**
 * Apply page design recipe to all components.
 * HANYA mengatur geometry (x/y/width/height).
 * TIDAK mengubah isi materi (text, body, layers, choices, dll).
 */
export function applyPageDesignRecipe(page: SimplePage): SimplePage {
  const recipe = getDesignRecipeForRole(page.role);

  // Track per-type index for stacking
  const typeCounters: Record<string, number> = {};

  const newComponents = page.components.map((comp) => {
    const type = comp.type;
    const idx = typeCounters[type] ?? 0;
    typeCounters[type] = idx + 1;

    const placed = placeComponentInRecipe(type, recipe, idx);

    // Only change geometry — preserve all content fields
    return {
      ...comp,
      x: placed.x,
      y: placed.y,
      width: placed.width,
      height: placed.height,
    } as PageComponent;
  });

  return {
    ...page,
    components: newComponents,
  };
}
