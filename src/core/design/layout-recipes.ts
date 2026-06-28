/**
 * Layout Recipes per Page Role (DESIGN-INTELLIGENCE-ENGINE-V1).
 *
 * Layer: core/design (pure data + helpers, no React/DOM)
 * Allowed imports: ../types, ./design-tokens
 *
 * Kontrak (DIE-V1 Scope 2):
 *   Setiap page role punya layout recipe dengan safeArea, titleZone,
 *   contentZone, actionZone, recommendedComponents, maxContentDensity.
 */

import type { PageRole, ComponentType } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './design-tokens';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Zone = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type LayoutRecipe = {
  id: string;
  role: PageRole;
  safeArea: number;
  titleZone: Zone;
  contentZone: Zone;
  actionZone: Zone;
  recommendedComponents: ComponentType[];
  maxContentDensity: number;
};

// ---------------------------------------------------------------------------
// 11 Layout Recipes (one per page role)
// ---------------------------------------------------------------------------

const SA = 80; // safe area default
const W = CANVAS_WIDTH;
const H = CANVAS_HEIGHT;

export const LAYOUT_RECIPES: readonly LayoutRecipe[] = [
  {
    id: 'coverHero',
    role: 'cover',
    safeArea: SA,
    titleZone: { x: 140, y: 260, width: 1000, height: 140 },
    contentZone: { x: 340, y: 420, width: 600, height: 80 },
    actionZone: { x: 0, y: 0, width: 0, height: 0 },
    recommendedComponents: ['text'],
    maxContentDensity: 2,
  },
  {
    id: 'guideSteps',
    role: 'guide',
    safeArea: SA,
    titleZone: { x: SA, y: 40, width: W - 2 * SA, height: 60 },
    contentZone: { x: SA, y: 120, width: W - 2 * SA, height: 440 },
    actionZone: { x: 900, y: 620, width: 300, height: 60 },
    recommendedComponents: ['text', 'card', 'navigation', 'layered-info'],
    maxContentDensity: 3,
  },
  {
    id: 'objectivesLayered',
    role: 'learningObjectives',
    safeArea: SA,
    titleZone: { x: SA, y: 40, width: W - 2 * SA, height: 60 },
    contentZone: { x: SA, y: 120, width: W - 2 * SA, height: 460 },
    actionZone: { x: 900, y: 620, width: 300, height: 60 },
    recommendedComponents: ['text', 'navigation', 'layered-info', 'learning-bridge'],
    maxContentDensity: 2,
  },
  {
    id: 'menuGrid',
    role: 'menu',
    safeArea: SA,
    titleZone: { x: SA, y: 40, width: W - 2 * SA, height: 60 },
    contentZone: { x: SA, y: 120, width: W - 2 * SA, height: 440 },
    actionZone: { x: 900, y: 620, width: 300, height: 60 },
    recommendedComponents: ['text', 'card', 'navigation', 'layered-info'],
    maxContentDensity: 6,
  },
  {
    id: 'starterFocus',
    role: 'starter',
    safeArea: SA,
    titleZone: { x: 100, y: 180, width: W - 200, height: 100 },
    contentZone: { x: 200, y: 340, width: W - 400, height: 200 },
    actionZone: { x: 900, y: 620, width: 300, height: 60 },
    recommendedComponents: ['text', 'card', 'navigation', 'learning-bridge'],
    maxContentDensity: 3,
  },
  {
    id: 'materialReadable',
    role: 'material',
    safeArea: SA,
    titleZone: { x: SA, y: 40, width: W - 2 * SA, height: 60 },
    contentZone: { x: SA, y: 120, width: W - 2 * SA, height: 440 },
    actionZone: { x: 900, y: 620, width: 300, height: 60 },
    recommendedComponents: ['text', 'image', 'card', 'navigation', 'layered-info', 'learning-bridge'],
    maxContentDensity: 5,
  },
  {
    id: 'activityTask',
    role: 'activity',
    safeArea: SA,
    titleZone: { x: SA, y: 40, width: W - 2 * SA, height: 60 },
    contentZone: { x: 100, y: 120, width: 700, height: 480 },
    actionZone: { x: 900, y: 620, width: 300, height: 60 },
    recommendedComponents: ['text', 'card', 'navigation', 'game', 'learning-bridge'],
    maxContentDensity: 2,
  },
  {
    id: 'quizFocus',
    role: 'quiz',
    safeArea: SA,
    titleZone: { x: 100, y: 40, width: 600, height: 60 },
    contentZone: { x: 100, y: 120, width: 600, height: 440 },
    actionZone: { x: 900, y: 620, width: 300, height: 60 },
    recommendedComponents: ['text', 'question', 'game', 'navigation', 'learning-bridge'],
    maxContentDensity: 2,
  },
  {
    id: 'reflectionCalm',
    role: 'reflection',
    safeArea: SA,
    titleZone: { x: 150, y: 120, width: W - 300, height: 60 },
    contentZone: { x: 150, y: 200, width: W - 300, height: 360 },
    actionZone: { x: 900, y: 620, width: 300, height: 60 },
    recommendedComponents: ['text', 'card', 'navigation', 'learning-bridge'],
    maxContentDensity: 3,
  },
  {
    id: 'closingSummary',
    role: 'closing',
    safeArea: SA,
    titleZone: { x: 340, y: 260, width: 600, height: 80 },
    contentZone: { x: 340, y: 360, width: 600, height: 80 },
    actionZone: { x: 0, y: 0, width: 0, height: 0 },
    recommendedComponents: ['text', 'card', 'navigation', 'learning-bridge'],
    maxContentDensity: 3,
  },
  {
    id: 'freeCanvas',
    role: 'free',
    safeArea: 40,
    titleZone: { x: 40, y: 40, width: W - 80, height: 60 },
    contentZone: { x: 40, y: 120, width: W - 80, height: H - 200 },
    actionZone: { x: 40, y: H - 80, width: 300, height: 60 },
    recommendedComponents: ['text', 'image', 'card', 'navigation', 'question', 'game'],
    maxContentDensity: 10,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getLayoutRecipeForRole(role: PageRole): LayoutRecipe {
  return LAYOUT_RECIPES.find((r) => r.role === role) ?? LAYOUT_RECIPES[LAYOUT_RECIPES.length - 1];
}

export function getLayoutRecipeById(id: string): LayoutRecipe | undefined {
  return LAYOUT_RECIPES.find((r) => r.id === id);
}
