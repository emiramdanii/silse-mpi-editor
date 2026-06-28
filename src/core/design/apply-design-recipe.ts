/**
 * Smart Geometry Helper (DESIGN-INTELLIGENCE-ENGINE-V1 Patch-1).
 *
 * Layer: core/design (pure function, no React/DOM)
 * Allowed imports: ../types, ./design-tokens, ./layout-recipes
 *
 * Kontrak (DIE-V1 Patch-1):
 *   - First text component → recipe.titleZone (bukan contentZone).
 *   - Subsequent text → contentZone.
 *   - layered-info → top/large portion of contentZone.
 *   - learning-bridge → bottom/small portion of contentZone (tidak overlap).
 *   - Navigation → actionZone.
 *   - HANYA atur geometry. TIDAK mengubah isi materi.
 */

import type { SimplePage, PageComponent, ComponentType } from '../types';
import type { LayoutRecipe } from './layout-recipes';
import { getLayoutRecipeForRole } from './layout-recipes';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './design-tokens';

export type PlacedGeometry = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function getDesignRecipeForRole(role: SimplePage['role']): LayoutRecipe {
  return getLayoutRecipeForRole(role);
}

/**
 * Place a component in the recipe based on its type and index.
 * `isFirstText` flag: true if this is the first text component on the page.
 * Returns optimal geometry (x/y/width/height) within the zone.
 */
export function placeComponentInRecipe(
  componentType: ComponentType,
  recipe: LayoutRecipe,
  index: number,
  isFirstText: boolean = false,
): PlacedGeometry {
  const sa = recipe.safeArea;
  const contentZone = recipe.contentZone;

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
    return {
      x: CANVAS_WIDTH - sa - 300,
      y: CANVAS_HEIGHT - sa - 60,
      width: 300,
      height: 60,
    };
  }

  // DIE-V1 Patch-1 Scope 1: First text → titleZone, subsequent → contentZone
  if (componentType === 'text') {
    if (isFirstText && recipe.titleZone.width > 0) {
      return {
        x: recipe.titleZone.x,
        y: recipe.titleZone.y,
        width: recipe.titleZone.width,
        height: recipe.titleZone.height,
      };
    }
    // Subsequent text: stack in content zone
    return {
      x: contentZone.x,
      y: contentZone.y + Math.min(index * 100, Math.max(0, contentZone.height - 100)),
      width: contentZone.width,
      height: Math.max(60, Math.min(120, contentZone.height - 100)),
    };
  }

  // DIE-V1 Patch-1 Scope 2: layered-info → top/large of contentZone
  if (componentType === 'layered-info') {
    const liHeight = Math.min(contentZone.height * 0.7, 460);
    return {
      x: contentZone.x,
      y: contentZone.y,
      width: contentZone.width,
      height: liHeight,
    };
  }

  // DIE-V1 Patch-1 Scope 2: learning-bridge → bottom/small of contentZone
  if (componentType === 'learning-bridge') {
    const bridgeHeight = 180;
    // If layered-info exists, place bridge below it
    // Use bottom of contentZone
    return {
      x: contentZone.x,
      y: contentZone.y + contentZone.height - bridgeHeight,
      width: contentZone.width,
      height: bridgeHeight,
    };
  }

  // Card: half width, stacked vertically in contentZone
  if (componentType === 'card') {
    const cardW = Math.min((contentZone.width - 20) / 2, 520);
    const cardH = 160;
    const col = index % 2;
    const row = Math.floor(index / 2);
    return {
      x: contentZone.x + col * (cardW + 20),
      y: contentZone.y + row * (cardH + 20),
      width: cardW,
      height: cardH,
    };
  }

  // Image: left portion of contentZone
  if (componentType === 'image') {
    return {
      x: contentZone.x,
      y: contentZone.y,
      width: Math.min(contentZone.width * 0.4, 440),
      height: 320,
    };
  }

  // Question / game: use contentZone
  return {
    x: contentZone.x,
    y: contentZone.y,
    width: contentZone.width,
    height: Math.min(contentZone.height, 460),
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
  let textPlaced = false; // Track if first text already placed in titleZone

  const newComponents = page.components.map((comp) => {
    const type = comp.type;
    const idx = typeCounters[type] ?? 0;
    typeCounters[type] = idx + 1;

    // Determine if this is the first text component
    const isFirstText = type === 'text' && !textPlaced;
    if (isFirstText) textPlaced = true;

    const placed = placeComponentInRecipe(type, recipe, idx, isFirstText);

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
