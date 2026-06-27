/**
 * Validation for silse-mpi-editor project data.
 *
 * Layer: core
 * Allowed imports: ./types
 *
 * Pure functions — no I/O, no side effects.
 *
 * Kontrak Batch 2R:
 *   - Page wajib punya field `role` yang valid (salah satu PAGE_ROLES).
 *   - Text component wajib punya field `variant` yang valid.
 *   - Page tanpa role → validation menolak.
 *   - Component tanpa variant → validation menolak.
 */

import {
  CARD_COMPONENT_VARIANTS,
  COMPONENT_TYPES,
  IMAGE_COMPONENT_VARIANTS,
  LAYOUT_IDS,
  NAVIGATION_ACTIONS,
  NAVIGATION_COMPONENT_VARIANTS,
  PAGE_ROLES,
  PROJECT_VERSION,
  QUESTION_COMPONENT_VARIANTS,
  SCORING_STYLES,
  TEXT_COMPONENT_VARIANTS,
  type CardComponentVariant,
  type ComponentType,
  type ImageComponentVariant,
  type LayoutId,
  type NavigationAction,
  type NavigationComponentVariant,
  type PageComponent,
  type PageRole,
  type QuestionComponentVariant,
  type ScoringStyle,
  type SimplePage,
  type SimpleProject,
  type TextComponentVariant,
} from './types';
import type {
  ProjectStyle,
  StylePack,
} from './style-types';

export type ValidationResult = { ok: true } | { ok: false; errors: string[] };

function fail(...errors: string[]): ValidationResult {
  return { ok: false, errors };
}

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function validateComponent(component: unknown): ValidationResult {
  if (!isObject(component)) return fail('component must be an object');
  if (!isString(component.id) || component.id.length === 0)
    return fail('component.id must be a non-empty string');
  if (!isNumber(component.x)) return fail('component.x must be a number');
  if (!isNumber(component.y)) return fail('component.y must be a number');
  if (!isNumber(component.width) || component.width <= 0)
    return fail('component.width must be a positive number');
  if (!isNumber(component.height) || component.height <= 0)
    return fail('component.height must be a positive number');
  if (!isString(component.type) || !COMPONENT_TYPES.includes(component.type as ComponentType)) {
    return fail(`component.type must be one of: ${COMPONENT_TYPES.join(', ')}`);
  }

  // Type-specific validation
  if (component.type === 'text') {
    return validateTextComponent(component);
  }
  if (component.type === 'image') {
    return validateImageComponent(component);
  }
  if (component.type === 'card') {
    return validateCardComponent(component);
  }
  if (component.type === 'navigation') {
    return validateNavigationComponent(component);
  }
  if (component.type === 'question') {
    return validateQuestionComponent(component);
  }
  return { ok: true };
}

/**
 * Validate a text component (M2 scope).
 *
 * Kontrak (docs/CORE_PRODUCT_CONTRACT.md section 5 + Batch 2R Scope D):
 *   - field `text` wajib, string (boleh kosong tapi harus ada)
 *   - field `variant` wajib, harus salah satu dari TEXT_COMPONENT_VARIANTS
 *
 * Text component tanpa variant = scope leak, validation menolak.
 */
function validateTextComponent(component: Record<string, unknown>): ValidationResult {
  if (!isString(component.text)) {
    return fail('text component.text must be a string');
  }
  if (!isString(component.variant)) {
    return fail('text component.variant is required (must be a string)');
  }
  if (!TEXT_COMPONENT_VARIANTS.includes(component.variant as TextComponentVariant)) {
    return fail(
      `text component.variant must be one of: ${TEXT_COMPONENT_VARIANTS.join(', ')} (got "${component.variant}")`,
    );
  }
  return { ok: true };
}

/**
 * Validate an image component (M4 scope).
 *
 * Kontrak:
 *   - field `variant` wajib, harus salah satu dari IMAGE_COMPONENT_VARIANTS
 *   - field `src` wajib, string non-empty
 *   - field `objectFit` wajib, 'cover' | 'contain'
 *   - field `alt` opsional, string
 */
function validateImageComponent(component: Record<string, unknown>): ValidationResult {
  if (!isString(component.variant)) {
    return fail('image component.variant is required (must be a string)');
  }
  if (!IMAGE_COMPONENT_VARIANTS.includes(component.variant as ImageComponentVariant)) {
    return fail(
      `image component.variant must be one of: ${IMAGE_COMPONENT_VARIANTS.join(', ')} (got "${component.variant}")`,
    );
  }
  if (!isString(component.src) || component.src.length === 0) {
    return fail('image component.src must be a non-empty string');
  }
  if (!isString(component.objectFit) || !['cover', 'contain'].includes(component.objectFit)) {
    return fail('image component.objectFit must be "cover" or "contain"');
  }
  if (component.alt !== undefined && !isString(component.alt)) {
    return fail('image component.alt must be a string if present');
  }
  return { ok: true };
}

/**
 * Validate a card component (M4 scope).
 *
 * Kontrak:
 *   - field `variant` wajib, harus salah satu dari CARD_COMPONENT_VARIANTS
 *   - field `body` wajib, string (boleh kosong tapi harus ada)
 *   - field `title` opsional, string
 *
 * Card BUKAN nested container — tidak ada field components/children.
 */
function validateCardComponent(component: Record<string, unknown>): ValidationResult {
  if (!isString(component.variant)) {
    return fail('card component.variant is required (must be a string)');
  }
  if (!CARD_COMPONENT_VARIANTS.includes(component.variant as CardComponentVariant)) {
    return fail(
      `card component.variant must be one of: ${CARD_COMPONENT_VARIANTS.join(', ')} (got "${component.variant}")`,
    );
  }
  if (!isString(component.body)) {
    return fail('card component.body must be a string');
  }
  if (component.title !== undefined && !isString(component.title)) {
    return fail('card component.title must be a string if present');
  }
  // Anti-pattern guard: card must NOT have nested components/children (M4 scope)
  if (component.components !== undefined || component.children !== undefined) {
    return fail('card component must NOT have nested components/children (M4 scope — nested container lands in M11/M12)');
  }
  return { ok: true };
}

/**
 * Validate a navigation component (M5 scope).
 *
 * Kontrak:
 *   - field `variant` wajib, salah satu dari NAVIGATION_COMPONENT_VARIANTS
 *   - field `label` wajib, string non-empty
 *   - field `action` wajib, salah satu dari NAVIGATION_ACTIONS
 *   - field `targetPageId`:
 *     - WAJIB string non-empty jika action='goto'
 *     - boleh undefined / diabaikan jika action='next' atau 'prev'
 */
function validateNavigationComponent(component: Record<string, unknown>): ValidationResult {
  if (!isString(component.variant)) {
    return fail('navigation component.variant is required (must be a string)');
  }
  if (!NAVIGATION_COMPONENT_VARIANTS.includes(component.variant as NavigationComponentVariant)) {
    return fail(
      `navigation component.variant must be one of: ${NAVIGATION_COMPONENT_VARIANTS.join(', ')} (got "${component.variant}")`,
    );
  }
  if (!isString(component.label) || component.label.length === 0) {
    return fail('navigation component.label must be a non-empty string');
  }
  if (!isString(component.action) || !NAVIGATION_ACTIONS.includes(component.action as NavigationAction)) {
    return fail(
      `navigation component.action must be one of: ${NAVIGATION_ACTIONS.join(', ')}`,
    );
  }
  // targetPageId wajib untuk goto
  if (component.action === 'goto') {
    if (!isString(component.targetPageId) || component.targetPageId.length === 0) {
      return fail('navigation component.targetPageId is required when action="goto"');
    }
  }
  // targetPageId untuk next/prev boleh undefined; kalau ada harus string
  if (component.targetPageId !== undefined && !isString(component.targetPageId)) {
    return fail('navigation component.targetPageId must be a string if present');
  }
  return { ok: true };
}

/**
 * Validate a question component (M10 scope).
 */
function validateQuestionComponent(component: Record<string, unknown>): ValidationResult {
  if (!isString(component.variant)) {
    return fail('question component.variant is required');
  }
  if (!QUESTION_COMPONENT_VARIANTS.includes(component.variant as QuestionComponentVariant)) {
    return fail(`question component.variant must be one of: ${QUESTION_COMPONENT_VARIANTS.join(', ')}`);
  }
  if (!isString(component.prompt) || component.prompt.length === 0) {
    return fail('question component.prompt must be a non-empty string');
  }
  if (!Array.isArray(component.choices)) {
    return fail('question component.choices must be an array');
  }
  const choices = component.choices as unknown[];
  const variant = component.variant as QuestionComponentVariant;
  if (variant === 'multipleChoice') {
    if (choices.length < 2 || choices.length > 6) {
      return fail('question component.choices must have 2-6 items for multipleChoice');
    }
  } else if (variant === 'trueFalse') {
    if (choices.length !== 2) {
      return fail('question component.choices must have exactly 2 items for trueFalse');
    }
  }
  if (!isNumber(component.correctChoiceIndex) || component.correctChoiceIndex < 0 || component.correctChoiceIndex >= choices.length) {
    return fail('question component.correctChoiceIndex must be a valid index within choices');
  }
  if (!isString(component.feedbackCorrect)) {
    return fail('question component.feedbackCorrect must be a string');
  }
  if (!isString(component.feedbackWrong)) {
    return fail('question component.feedbackWrong must be a string');
  }
  if (!isNumber(component.points) || component.points < 0) {
    return fail('question component.points must be a non-negative number');
  }
  if (!isString(component.scoringStyle) || !SCORING_STYLES.includes(component.scoringStyle as ScoringStyle)) {
    return fail(`question component.scoringStyle must be one of: ${SCORING_STYLES.join(', ')}`);
  }
  return { ok: true };
}

export function validatePageRole(role: unknown): role is PageRole {
  return isString(role) && PAGE_ROLES.includes(role as PageRole);
}

export function validateLayoutId(layoutId: unknown): layoutId is LayoutId {
  return isString(layoutId) && LAYOUT_IDS.includes(layoutId as LayoutId);
}

export function validatePage(page: unknown): ValidationResult {
  if (!isObject(page)) return fail('page must be an object');
  if (!isString(page.id) || page.id.length === 0)
    return fail('page.id must be a non-empty string');
  if (!isString(page.title)) return fail('page.title must be a string');

  // Kontrak Batch 2R Scope B: page wajib punya role valid
  if (!validatePageRole(page.role)) {
    return fail(
      `page.role is required and must be one of: ${PAGE_ROLES.join(', ')}${isString(page.role) ? ` (got "${page.role}")` : ''}`,
    );
  }

  // Kontrak Batch 3 (M3): page wajib punya layoutId valid (string non-empty, salah satu LAYOUT_IDS)
  if (!validateLayoutId(page.layoutId)) {
    return fail(
      `page.layoutId is required and must be one of: ${LAYOUT_IDS.join(', ')}${isString(page.layoutId) ? ` (got "${page.layoutId}")` : ''}`,
    );
  }

  if (!isObject(page.background)) return fail('page.background must be an object');
  if (!Array.isArray(page.components)) return fail('page.components must be an array');

  for (let i = 0; i < page.components.length; i++) {
    const r = validateComponent(page.components[i]);
    if (!r.ok) return fail(`page.components[${i}]: ${r.errors.join('; ')}`);
  }
  return { ok: true };
}

export function validateProject(project: unknown): ValidationResult {
  if (!isObject(project)) return fail('project must be an object');
  if (!isString(project.id) || project.id.length === 0)
    return fail('project.id must be a non-empty string');
  if (!isString(project.title)) return fail('project.title must be a string');
  if (project.version !== PROJECT_VERSION) {
    return fail(`project.version must be ${PROJECT_VERSION}`);
  }
  if (!Array.isArray(project.pages) || project.pages.length === 0) {
    return fail('project.pages must be a non-empty array');
  }
  if (!isString(project.currentPageId)) {
    return fail('project.currentPageId must be a string');
  }

  // Batch 2S: validate style field kalau ada (optional, backward-compat).
  if (project.style !== undefined) {
    const styleResult = validateProjectStyle(project.style);
    if (!styleResult.ok) {
      return fail(`project.style: ${styleResult.errors.join('; ')}`);
    }
  }
  if (project.stylePackId !== undefined && !isString(project.stylePackId)) {
    return fail('project.stylePackId must be a string if present');
  }

  const pageIds = new Set<string>();
  for (let i = 0; i < project.pages.length; i++) {
    const r = validatePage(project.pages[i]);
    if (!r.ok) return fail(`project.pages[${i}]: ${r.errors.join('; ')}`);
    const p = project.pages[i] as SimplePage;
    if (pageIds.has(p.id)) return fail(`duplicate page id: ${p.id}`);
    pageIds.add(p.id);
  }

  if (!pageIds.has(project.currentPageId)) {
    return fail(`project.currentPageId (${project.currentPageId}) not found in pages`);
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Style validation (Batch 2S)
// ---------------------------------------------------------------------------

function isStringRecord(v: unknown): v is Record<string, unknown> {
  return isObject(v);
}

function validateStyleColors(colors: unknown): ValidationResult {
  if (!isStringRecord(colors)) return fail('colors must be an object');
  const required = [
    'background',
    'surface',
    'primary',
    'secondary',
    'text',
    'mutedText',
    'border',
    'success',
    'warning',
    'danger',
  ] as const;
  for (const key of required) {
    if (!isString(colors[key])) return fail(`colors.${key} must be a string`);
  }
  return { ok: true };
}

function validateStyleTypography(t: unknown): ValidationResult {
  if (!isStringRecord(t)) return fail('typography must be an object');
  if (!isString(t.fontFamily)) return fail('typography.fontFamily must be a string');
  const numeric = ['titleSize', 'subtitleSize', 'bodySize', 'smallSize', 'lineHeight'] as const;
  for (const key of numeric) {
    if (!isNumber(t[key]) || (t[key] as number) <= 0) {
      return fail(`typography.${key} must be a positive number`);
    }
  }
  return { ok: true };
}

function validateStyleSpacing(s: unknown): ValidationResult {
  if (!isStringRecord(s)) return fail('spacing must be an object');
  const required = ['pagePadding', 'componentGap', 'cardPadding'] as const;
  for (const key of required) {
    if (!isNumber(s[key]) || (s[key] as number) < 0) {
      return fail(`spacing.${key} must be a non-negative number`);
    }
  }
  return { ok: true };
}

function validateStyleRadius(r: unknown): ValidationResult {
  if (!isStringRecord(r)) return fail('radius must be an object');
  const required = ['small', 'medium', 'large'] as const;
  for (const key of required) {
    if (!isNumber(r[key]) || (r[key] as number) < 0) {
      return fail(`radius.${key} must be a non-negative number`);
    }
  }
  return { ok: true };
}

function validateStyleShadow(s: unknown): ValidationResult {
  if (!isStringRecord(s)) return fail('shadow must be an object');
  const required = ['none', 'soft', 'medium'] as const;
  for (const key of required) {
    if (!isString(s[key])) return fail(`shadow.${key} must be a string`);
  }
  return { ok: true };
}

/**
 * Validate a StylePack (reusable collection).
 * Kontrak Batch 2S: tokens harus serializable (string/number only).
 * Recipe placeholders boleh kosong.
 */
export function validateStylePack(pack: unknown): ValidationResult {
  if (!isObject(pack)) return fail('stylePack must be an object');
  if (!isString(pack.id) || pack.id.length === 0)
    return fail('stylePack.id must be a non-empty string');
  if (!isString(pack.name)) return fail('stylePack.name must be a string');
  if (!isString(pack.description)) return fail('stylePack.description must be a string');

  const colorsR = validateStyleColors(pack.colors);
  if (!colorsR.ok) return fail(`stylePack.colors: ${colorsR.errors.join('; ')}`);

  const typoR = validateStyleTypography(pack.typography);
  if (!typoR.ok) return fail(`stylePack.typography: ${typoR.errors.join('; ')}`);

  const spacingR = validateStyleSpacing(pack.spacing);
  if (!spacingR.ok) return fail(`stylePack.spacing: ${spacingR.errors.join('; ')}`);

  const radiusR = validateStyleRadius(pack.radius);
  if (!radiusR.ok) return fail(`stylePack.radius: ${radiusR.errors.join('; ')}`);

  const shadowR = validateStyleShadow(pack.shadow);
  if (!shadowR.ok) return fail(`stylePack.shadow: ${shadowR.errors.join('; ')}`);

  // Recipe placeholders: must be objects (may be empty)
  if (!isObject(pack.componentRecipes)) return fail('stylePack.componentRecipes must be an object');
  if (!isObject(pack.interactionRecipes)) return fail('stylePack.interactionRecipes must be an object');
  if (!isObject(pack.scoringRecipes)) return fail('stylePack.scoringRecipes must be an object');

  // M5: validate interactionRecipes entries with bounds checking
  const interactionR = validateInteractionRecipes(pack.interactionRecipes);
  if (!interactionR.ok)
    return fail(`stylePack.interactionRecipes: ${interactionR.errors.join('; ')}`);

  return { ok: true };
}

/**
 * Validate interaction recipes (M5 scope).
 *
 * Kontrak Batch 5 Scope D:
 *   - Setiap entry boleh kosong (optional).
 *   - Jika scale ada: range 0.8–1.08.
 *   - Jika durationMs ada: range 80–500.
 *   - shadowRole: 'none' | 'soft' | 'medium' jika ada.
 *   - backgroundRole: salah satu dari valid roles jika ada.
 *   - easing: string jika ada.
 */
function validateInteractionRecipes(recipes: unknown): ValidationResult {
  if (!isObject(recipes)) return fail('interactionRecipes must be an object');

  for (const [key, value] of Object.entries(recipes)) {
    if (value === undefined || value === null) continue;
    if (!isObject(value)) {
      return fail(`interactionRecipes.${key} must be an object if present`);
    }
    const entry = value as Record<string, unknown>;

    // scale bounds: 0.8–1.08
    if (entry.scale !== undefined) {
      if (!isNumber(entry.scale)) {
        return fail(`interactionRecipes.${key}.scale must be a number`);
      }
      if (entry.scale < 0.8 || entry.scale > 1.08) {
        return fail(`interactionRecipes.${key}.scale must be 0.8–1.08 (got ${entry.scale})`);
      }
    }

    // durationMs bounds: 80–500
    if (entry.durationMs !== undefined) {
      if (!isNumber(entry.durationMs)) {
        return fail(`interactionRecipes.${key}.durationMs must be a number`);
      }
      if (entry.durationMs < 80 || entry.durationMs > 500) {
        return fail(`interactionRecipes.${key}.durationMs must be 80–500 (got ${entry.durationMs})`);
      }
    }

    // easing: string if present
    if (entry.easing !== undefined && !isString(entry.easing)) {
      return fail(`interactionRecipes.${key}.easing must be a string if present`);
    }

    // shadowRole: 'none' | 'soft' | 'medium'
    if (entry.shadowRole !== undefined) {
      if (!isString(entry.shadowRole) || !['none', 'soft', 'medium'].includes(entry.shadowRole)) {
        return fail(`interactionRecipes.${key}.shadowRole must be 'none' | 'soft' | 'medium'`);
      }
    }

    // backgroundRole: valid role names
    if (entry.backgroundRole !== undefined) {
      const validRoles = ['primary', 'secondary', 'surface', 'success', 'warning', 'danger'];
      if (!isString(entry.backgroundRole) || !validRoles.includes(entry.backgroundRole)) {
        return fail(`interactionRecipes.${key}.backgroundRole must be one of: ${validRoles.join(', ')}`);
      }
    }
  }

  return { ok: true };
}

/**
 * Validate ProjectStyle (instance attached to a project).
 * Kontrak Batch 2S: stylePackId wajib, tokens wajib lengkap (snapshot).
 */
export function validateProjectStyle(style: unknown): ValidationResult {
  if (!isObject(style)) return fail('projectStyle must be an object');
  if (!isString(style.stylePackId) || style.stylePackId.length === 0) {
    return fail('projectStyle.stylePackId must be a non-empty string');
  }
  if (!isObject(style.tokens)) return fail('projectStyle.tokens must be an object');

  const colorsR = validateStyleColors((style.tokens as { colors: unknown }).colors);
  if (!colorsR.ok) return fail(`projectStyle.tokens.colors: ${colorsR.errors.join('; ')}`);

  const typoR = validateStyleTypography((style.tokens as { typography: unknown }).typography);
  if (!typoR.ok) return fail(`projectStyle.tokens.typography: ${typoR.errors.join('; ')}`);

  const spacingR = validateStyleSpacing((style.tokens as { spacing: unknown }).spacing);
  if (!spacingR.ok) return fail(`projectStyle.tokens.spacing: ${spacingR.errors.join('; ')}`);

  const radiusR = validateStyleRadius((style.tokens as { radius: unknown }).radius);
  if (!radiusR.ok) return fail(`projectStyle.tokens.radius: ${radiusR.errors.join('; ')}`);

  const shadowR = validateStyleShadow((style.tokens as { shadow: unknown }).shadow);
  if (!shadowR.ok) return fail(`projectStyle.tokens.shadow: ${shadowR.errors.join('; ')}`);

  return { ok: true };
}

/**
 * Type guard: narrows unknown to StylePack when valid.
 */
export function isValidStylePack(pack: unknown): pack is StylePack {
  return validateStylePack(pack).ok;
}

/**
 * Type guard: narrows unknown to ProjectStyle when valid.
 */
export function isValidProjectStyle(style: unknown): style is ProjectStyle {
  return validateProjectStyle(style).ok;
}

/**
 * Type guard: narrows unknown to SimpleProject when valid.
 */
export function isValidProject(project: unknown): project is SimpleProject {
  return validateProject(project).ok;
}

/**
 * Type guard for PageComponent.
 */
export function isValidComponent(component: unknown): component is PageComponent {
  return validateComponent(component).ok;
}
