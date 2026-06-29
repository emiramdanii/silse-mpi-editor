/**
 * Apply Layout Preset (LAYOUT-PRESET-SYSTEM-V1).
 *
 * Layer: core/layout-presets (pure function, no React/DOM)
 * Allowed imports: ../types, ./layout-preset-registry, ../design/design-tokens
 *
 * Kontrak (LAYOUT-PRESET-SYSTEM-V1 Scope D + E):
 *   applyLayoutPresetToPage(page, presetId) → SimplePage baru.
 *
 *   Aturan:
 *     - Return page baru (tidak mutate input).
 *     - Tidak ubah page.id, page.title, page.role.
 *     - Tidak ubah component.id, component.type.
 *     - Tidak ubah text/title/body/prompt/choices/feedback.
 *     - Hanya ubah layoutId, x, y, width, height.
 *     - Jika preset tidak cocok dengan role → fallback ke default role preset.
 *     - Semua posisi dalam area 16:9 (1280×720).
 *
 *   Position Strategy V1 (slot-based):
 *     Setiap preset punya slot strategy yang menempatkan komponen berdasarkan
 *     type + variant. Komponen yang tidak dikenali tetap di posisi lama
 *     atau masuk safe area.
 */

import type { SimplePage, PageComponent } from '../types';
import {
  getLayoutPreset,
  getDefaultLayoutPresetForRole,
  presetSupportsRole,
  type LayoutPresetId,
} from './layout-preset-registry';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../design/design-tokens';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SA = 80; // safe area margin
const NAV_W = 300;
const NAV_H = 60;
const NAV_Y = CANVAS_HEIGHT - SA - NAV_H; // 580
const NAV_X = CANVAS_WIDTH - SA - NAV_W;  // 900

// ---------------------------------------------------------------------------
// Slot geometry per preset
// ---------------------------------------------------------------------------

type Slot = { x: number; y: number; width: number; height: number };

/**
 * Get slot positions for a preset.
 * Returns a map of slot keys to geometry.
 */
function getSlotsForPreset(presetId: LayoutPresetId): Record<string, Slot> {
  switch (presetId) {
    // PREMIUM-LAYOUT-POLISH-01: Hero title lebih kuat, subtitle punya ruang, body tidak terlalu bawah.
    case 'cover-centered':
      return {
        title: { x: 120, y: 240, width: 1040, height: 160 },
        subtitle: { x: 320, y: 420, width: 640, height: 70 },
        body: { x: 200, y: 500, width: 880, height: 120 },
      };

    // PREMIUM-LAYOUT-POLISH-01: Left text lebih lega, visual lebih balance.
    case 'cover-split':
      return {
        title: { x: SA, y: 200, width: 600, height: 160 },
        subtitle: { x: SA, y: 380, width: 600, height: 70 },
        body: { x: SA, y: 470, width: 600, height: 170 },
        visual: { x: 660, y: 160, width: 540, height: 420 },
      };

    // PREMIUM-LAYOUT-POLISH-01: textLeft lebih tinggi, visualRight lebih rapi.
    case 'material-two-column':
      return {
        title: { x: SA, y: 40, width: CANVAS_WIDTH - 2 * SA, height: 60 },
        textLeft: { x: SA, y: 120, width: 560, height: 460 },
        visualRight: { x: 680, y: 120, width: 500, height: 440 },
        nav: { x: NAV_X, y: NAV_Y, width: NAV_W, height: NAV_H },
      };

    // PREMIUM-LAYOUT-POLISH-01: body lebih proporsional, cardSlot lebih tinggi.
    case 'material-card-stack':
      return {
        title: { x: SA, y: 40, width: CANVAS_WIDTH - 2 * SA, height: 60 },
        body: { x: SA, y: 120, width: CANVAS_WIDTH - 2 * SA, height: 100 },
        cardSlot: { x: SA, y: 240, width: CANVAS_WIDTH - 2 * SA, height: 320 },
        nav: { x: NAV_X, y: NAV_Y, width: NAV_W, height: NAV_H },
      };

    // PREMIUM-LAYOUT-POLISH-01: Question lebih centered, height lebih fokus.
    case 'quiz-focus':
      return {
        question: { x: 120, y: 50, width: 1040, height: 460 },
        nav: { x: NAV_X, y: NAV_Y, width: NAV_W, height: NAV_H },
      };

    // PREMIUM-LAYOUT-POLISH-01: Reflection lebih proporsional, tenang.
    case 'reflection-calm':
      return {
        reflection: { x: 160, y: 130, width: 960, height: 400 },
        nav: { x: NAV_X, y: NAV_Y, width: NAV_W, height: NAV_H },
      };

    // PREMIUM-LAYOUT-POLISH-01: Game lebih fokus, nav tetap aman.
    case 'mission-map':
      return {
        game: { x: 100, y: 40, width: 1080, height: 520 },
        nav: { x: NAV_X, y: NAV_Y, width: NAV_W, height: NAV_H },
      };

    // PREMIUM-LAYOUT-POLISH-01: Title/subtitle/body lebih seimbang.
    case 'closing-centered':
      return {
        title: { x: 220, y: 240, width: 840, height: 100 },
        subtitle: { x: 220, y: 360, width: 840, height: 70 },
        body: { x: 200, y: 450, width: 880, height: 130 },
      };

    default:
      // Fallback: safe area single column
      return {
        title: { x: SA, y: 40, width: CANVAS_WIDTH - 2 * SA, height: 60 },
        content: { x: SA, y: 120, width: CANVAS_WIDTH - 2 * SA, height: 440 },
        nav: { x: NAV_X, y: NAV_Y, width: NAV_W, height: NAV_H },
      };
  }
}

// ---------------------------------------------------------------------------
// Helper: place a single component in a slot
// ---------------------------------------------------------------------------

function placeComponent(comp: PageComponent, slot: Slot): PageComponent {
  return {
    ...comp,
    x: slot.x,
    y: slot.y,
    width: slot.width,
    height: slot.height,
  } as PageComponent;
}

// ---------------------------------------------------------------------------
// Helper: identify component role in layout
// ---------------------------------------------------------------------------

type ComponentLayoutRole =
  | 'title'        // first text with variant title
  | 'subtitle'     // text with variant subtitle
  | 'body'         // subsequent text
  | 'question'     // question component
  | 'game'         // game component
  | 'card'         // card component
  | 'image'        // image component
  | 'layered-info' // layered-info component
  | 'learning-bridge' // learning-bridge component
  | 'navigation'   // navigation component
  | 'other';       // anything else

function classifyComponent(comp: PageComponent, isFirstText: boolean): ComponentLayoutRole {
  if (comp.type === 'navigation') return 'navigation';
  if (comp.type === 'question') return 'question';
  if (comp.type === 'game') return 'game';
  if (comp.type === 'card') return 'card';
  if (comp.type === 'image') return 'image';
  if (comp.type === 'layered-info') return 'layered-info';
  if (comp.type === 'learning-bridge') return 'learning-bridge';
  if (comp.type === 'text') {
    const variant = (comp as { variant?: string }).variant ?? '';
    if (isFirstText && variant === 'title') return 'title';
    if (variant === 'subtitle') return 'subtitle';
    return 'body';
  }
  return 'other';
}

// ---------------------------------------------------------------------------
// Main: applyLayoutPresetToPage
// ---------------------------------------------------------------------------

/**
 * Apply a layout preset to a page.
 * Returns a new page with updated geometry (x/y/width/height) + layoutId.
 * Does NOT mutate input. Does NOT change content.
 *
 * If preset doesn't support the page's role, falls back to default preset for role.
 */
export function applyLayoutPresetToPage(
  page: SimplePage,
  presetId: string,
): SimplePage {
  // Resolve preset — fallback to role default if preset doesn't support role.
  let preset = getLayoutPreset(presetId);
  if (!presetSupportsRole(preset.id, page.role)) {
    preset = getDefaultLayoutPresetForRole(page.role);
  }

  const slots = getSlotsForPreset(preset.id as LayoutPresetId);
  let textPlaced = false;
  let cardIndex = 0;

  // Pre-count cards on this page to decide card layout strategy.
  const totalCards = page.components.filter((c) => c.type === 'card').length;

  const newComponents = page.components.map((comp) => {
    const isFirstText = comp.type === 'text' && !textPlaced;
    const layoutRole = classifyComponent(comp, isFirstText);

    if (layoutRole === 'title' && isFirstText) {
      textPlaced = true;
      if (slots.title) return placeComponent(comp, slots.title);
    }

    if (layoutRole === 'subtitle' && slots.subtitle) {
      return placeComponent(comp, slots.subtitle);
    }

    if (layoutRole === 'body' && slots.body) {
      return placeComponent(comp, slots.body);
    }

    if (layoutRole === 'navigation' && slots.nav) {
      return placeComponent(comp, slots.nav);
    }

    if (layoutRole === 'question' && slots.question) {
      return placeComponent(comp, slots.question);
    }

    if (layoutRole === 'game' && slots.game) {
      return placeComponent(comp, slots.game);
    }

    if (layoutRole === 'card') {
      // For card-stack: stack cards vertically in cardSlot.
      // If >2 cards, use 2-column grid to fit without overflow.
      if (slots.cardSlot) {
        const gap = 20;
        if (totalCards > 2 && slots.cardSlot.width > 600) {
          // 2-column grid layout.
          const gridCardW = (slots.cardSlot.width - gap) / 2;
          const gridCardH = Math.min(140, (slots.cardSlot.height - gap) / Math.ceil(totalCards / 2));
          const col = cardIndex % 2;
          const row = Math.floor(cardIndex / 2);
          const slot: Slot = {
            x: slots.cardSlot.x + col * (gridCardW + gap),
            y: slots.cardSlot.y + row * (gridCardH + gap),
            width: gridCardW,
            height: gridCardH,
          };
          cardIndex++;
          return placeComponent(comp, slot);
        }
        // Single column stack.
        const cardH = Math.min(140, totalCards > 0 ? (slots.cardSlot.height - (totalCards - 1) * gap) / totalCards : 140);
        const slot: Slot = {
          x: slots.cardSlot.x,
          y: slots.cardSlot.y + cardIndex * (cardH + gap),
          width: slots.cardSlot.width,
          height: cardH,
        };
        cardIndex++;
        return placeComponent(comp, slot);
      }
      // For two-column: place cards in a 2×2 grid in visualRight slot
      // to prevent overlap when there are multiple cards (e.g. Menu page).
      if (slots.visualRight) {
        const cardW = Math.min((slots.visualRight.width - 16) / 2, 252);
        const cardH = Math.min((slots.visualRight.height - 16) / 2, 212);
        const col = cardIndex % 2;
        const row = Math.floor(cardIndex / 2);
        const slot: Slot = {
          x: slots.visualRight.x + col * (cardW + 16),
          y: slots.visualRight.y + row * (cardH + 16),
          width: cardW,
          height: cardH,
        };
        cardIndex++;
        return placeComponent(comp, slot);
      }
    }

    if (layoutRole === 'image' && slots.visualRight) {
      return placeComponent(comp, slots.visualRight);
    }

    if (layoutRole === 'image' && slots.visual) {
      return placeComponent(comp, slots.visual);
    }

    if (layoutRole === 'layered-info') {
      // Place in textLeft (two-column) or cardSlot (card-stack) or question slot.
      if (slots.textLeft) return placeComponent(comp, slots.textLeft);
      if (slots.cardSlot) return placeComponent(comp, slots.cardSlot);
      if (slots.question) return placeComponent(comp, slots.question);
    }

    if (layoutRole === 'learning-bridge') {
      // Place in textLeft (two-column) or reflection slot.
      if (slots.textLeft) return placeComponent(comp, slots.textLeft);
      if (slots.reflection) return placeComponent(comp, slots.reflection);
    }

    if (layoutRole === 'body' && slots.textLeft) {
      return placeComponent(comp, slots.textLeft);
    }

    if (layoutRole === 'other' && slots.content) {
      return placeComponent(comp, slots.content);
    }

    // Fallback: keep original geometry (don't move unknown components).
    return comp;
  });

  return {
    ...page,
    layoutId: preset.id,
    components: newComponents,
  };
}
