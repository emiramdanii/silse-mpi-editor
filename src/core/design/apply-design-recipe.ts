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
  // GUIDED-MPI-FLOW-01 Patch-1: Global content index for stacking (not per-type)
  if (componentType === 'text') {
    if (isFirstText && recipe.titleZone.width > 0) {
      return {
        x: recipe.titleZone.x,
        y: recipe.titleZone.y,
        width: recipe.titleZone.width,
        height: recipe.titleZone.height,
      };
    }
    // Subsequent text: stack vertically in content zone using global index
    const yOffset = index * 120;
    return {
      x: contentZone.x,
      y: contentZone.y + Math.min(yOffset, Math.max(0, contentZone.height - 120)),
      width: contentZone.width,
      height: Math.max(60, Math.min(120, contentZone.height - yOffset)),
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
    return {
      x: contentZone.x,
      y: contentZone.y + contentZone.height - bridgeHeight,
      width: contentZone.width,
      height: bridgeHeight,
    };
  }

  // GUIDED-MPI-FLOW-01 Patch-1: Card stacking uses global content index.
  // Each content slot is 120px. Cards pair up horizontally (2 per row).
  // Card at global index N: row = floor(N/2), but y offset = N * 120
  // to stack below any preceding text (which also uses 120px slots).
  if (componentType === 'card') {
    const cardW = Math.min((contentZone.width - 20) / 2, 520);
    const cardH = 140;
    const col = index % 2;
    // Y offset: use index * 120 so card doesn't overlap with preceding text.
    // But pair up: even index = left col, odd index = right col (same row).
    // So actual y = contentZone.y + (index - col) * 120 / 2 ... no, simpler:
    // Group cards in pairs. Card at index 0 and 1 share same y.
    const row = Math.floor(index / 2);
    // y = contentZone.y + max(row * (cardH + 20), index * 120)
    const yOffset = Math.max(row * (cardH + 20), index * 120);
    return {
      x: contentZone.x + col * (cardW + 20),
      y: contentZone.y + yOffset,
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
 *
 * GUIDED-MPI-FLOW-01 Patch-1: Use GLOBAL content index (not per-type)
 * to prevent overlap between different component types in the same zone.
 * Navigation is excluded from content index (goes to actionZone).
 * First text goes to titleZone (not content).
 */
export function applyPageDesignRecipe(page: SimplePage): SimplePage {
  const recipe = getDesignRecipeForRole(page.role);

  let textPlaced = false;
  let contentIndex = 0; // Global index for ALL content components (not per-type)

  const newComponents = page.components.map((comp) => {
    const type = comp.type;

    // Navigation always goes to actionZone — doesn't consume content index
    if (type === 'navigation') {
      const placed = placeComponentInRecipe(type, recipe, 0, false);
      return { ...comp, x: placed.x, y: placed.y, width: placed.width, height: placed.height } as PageComponent;
    }

    // First text → titleZone, doesn't consume content index
    const isFirstText = type === 'text' && !textPlaced;
    if (isFirstText) {
      textPlaced = true;
      const placed = placeComponentInRecipe(type, recipe, 0, true);
      return { ...comp, x: placed.x, y: placed.y, width: placed.width, height: placed.height } as PageComponent;
    }

    // All other content components share a global content index
    const idx = contentIndex;
    contentIndex++;
    const placed = placeComponentInRecipe(type, recipe, idx, false);

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
