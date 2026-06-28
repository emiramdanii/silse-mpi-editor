/**
 * Style Resolver for silse-mpi-editor.
 *
 * Layer: core/style (pure function, no React/DOM/window/localStorage/store)
 *
 * Kontrak (Batch 6 / M6):
 *   Pure function resolver dari semantic style (variant + role + layoutId)
 *   ke concrete render style (ResolvedComponentStyle).
 *
 *   Editor, Preview, dan Export semua memakai resolver ini.
 *   Sebelum M6: style lookup hard-coded di setiap component view.
 *   Setelah M6: semua render wajib via resolveComponentStyle.
 *
 *   Tidak boleh import: React, DOM, window, localStorage, editor store,
 *   preview store, export module.
 */

import type {
  CardComponentVariant,
  ImageComponentVariant,
  LayeredInfoVariant,
  NavigationComponentVariant,
  PageComponent,
  PageRole,
  LayoutId,
  SimplePage,
  SimpleProject,
  TextComponentVariant,
} from '../types';
import type {
  InteractionRecipe,
  InteractionRecipeEntry,
  ProjectStyle,
  StyleColors,
  StyleShadow,
} from '../style-types';
import { getStylePack } from '../style-presets';

// ---------------------------------------------------------------------------
// Resolved style types
// ---------------------------------------------------------------------------

/**
 * Concrete render style untuk sebuah component.
 * Plain object — serializable, no function, no class.
 */
export type ResolvedComponentStyle = {
  /** CSS properties as plain object (key = camelCase or kebab-case). */
  inlineStyle: Record<string, string | number>;
  /** Optional class name (for export HTML CSS classes). */
  className?: string;
  /** Interaction recipes (for navigation hover/press/focus). */
  interactions?: ResolvedInteractions;
};

export type ResolvedInteractions = {
  hover?: ResolvedInteractionStyle;
  press?: ResolvedInteractionStyle;
  focus?: ResolvedInteractionStyle;
};

export type ResolvedInteractionStyle = {
  transform?: string;
  transition?: string;
  boxShadow?: string;
  backgroundColor?: string;
};

// ---------------------------------------------------------------------------
// Input type
// ---------------------------------------------------------------------------

export type ResolveStyleInput = {
  /** Project style tokens (from project.style). */
  tokens: ProjectStyle['tokens'];
  /** Component type: text/image/card/navigation/question/game/layered-info. */
  componentType: 'text' | 'image' | 'card' | 'navigation' | 'question' | 'game' | 'layered-info';
  /** Component variant (per type). */
  variant: string;
  /** Page role (context for default style). */
  pageRole: PageRole;
  /** Page layoutId (context for layout-aware style). */
  layoutId: LayoutId;
};

// ---------------------------------------------------------------------------
// Helper: resolve color from token role
// ---------------------------------------------------------------------------

function resolveColor(colors: StyleColors, role: string): string | undefined {
  switch (role) {
    case 'background': return colors.background;
    case 'surface': return colors.surface;
    case 'primary': return colors.primary;
    case 'secondary': return colors.secondary;
    case 'text': return colors.text;
    case 'mutedText': return colors.mutedText;
    case 'border': return colors.border;
    case 'success': return colors.success;
    case 'warning': return colors.warning;
    case 'danger': return colors.danger;
    default: return undefined;
  }
}

function resolveShadow(shadow: StyleShadow, role: string): string | undefined {
  switch (role) {
    case 'none': return shadow.none;
    case 'soft': return shadow.soft;
    case 'medium': return shadow.medium;
    default: return undefined;
  }
}

// ---------------------------------------------------------------------------
// Interaction recipe resolver
// ---------------------------------------------------------------------------

function resolveInteraction(
  recipe: InteractionRecipeEntry | undefined,
  colors: StyleColors,
  shadow: StyleShadow,
): ResolvedInteractionStyle | undefined {
  if (!recipe) return undefined;

  const result: ResolvedInteractionStyle = {};

  if (recipe.scale !== undefined) {
    result.transform = `scale(${recipe.scale})`;
  }
  if (recipe.durationMs !== undefined) {
    result.transition = `all ${recipe.durationMs}ms ${recipe.easing ?? 'ease'}`;
  }
  if (recipe.shadowRole) {
    result.boxShadow = resolveShadow(shadow, recipe.shadowRole);
  }
  if (recipe.backgroundRole) {
    result.backgroundColor = resolveColor(colors, recipe.backgroundRole);
  }

  return result;
}

function resolveInteractions(
  recipes: InteractionRecipe | undefined,
  colors: StyleColors,
  shadow: StyleShadow,
): ResolvedInteractions | undefined {
  if (!recipes) return undefined;

  const hover = resolveInteraction(recipes.buttonHoverGrow, colors, shadow);
  const press = resolveInteraction(recipes.buttonPress, colors, shadow);
  const focus = resolveInteraction(recipes.focusRing, colors, shadow);

  if (!hover && !press && !focus) return undefined;

  return { hover, press, focus };
}

// ---------------------------------------------------------------------------
// Text component style resolver
// ---------------------------------------------------------------------------

function resolveTextStyle(
  variant: TextComponentVariant,
  tokens: ProjectStyle['tokens'],
): ResolvedComponentStyle {
  const { colors, typography } = tokens;

  const variantMap: Record<TextComponentVariant, ResolvedComponentStyle> = {
    title: {
      inlineStyle: {
        fontSize: `${typography.titleSize}px`,
        color: colors.text,
        fontWeight: 'bold',
        textAlign: 'left',
      },
      className: 'silse-text-title',
    },
    subtitle: {
      inlineStyle: {
        fontSize: `${typography.subtitleSize}px`,
        color: colors.mutedText,
        fontWeight: 'normal',
        textAlign: 'left',
      },
      className: 'silse-text-subtitle',
    },
    body: {
      inlineStyle: {
        fontSize: `${typography.bodySize}px`,
        color: colors.text,
        fontWeight: 'normal',
        textAlign: 'left',
        lineHeight: typography.lineHeight,
      },
      className: 'silse-text-body',
    },
    instruction: {
      inlineStyle: {
        fontSize: `${typography.bodySize}px`,
        color: colors.primary,
        fontWeight: 'normal',
        textAlign: 'left',
        backgroundColor: colors.surface,
        padding: `${tokens.spacing.componentGap}px`,
        borderRadius: `${tokens.radius.medium}px`,
      },
      className: 'silse-text-instruction',
    },
    importantNote: {
      inlineStyle: {
        fontSize: `${typography.bodySize}px`,
        color: colors.warning,
        fontWeight: 'bold',
        textAlign: 'left',
        backgroundColor: colors.surface,
        padding: `${tokens.spacing.componentGap}px`,
        borderRadius: `${tokens.radius.medium}px`,
      },
      className: 'silse-text-important',
    },
    questionPrompt: {
      inlineStyle: {
        fontSize: `${typography.subtitleSize}px`,
        color: colors.text,
        fontWeight: 'bold',
        textAlign: 'left',
        backgroundColor: colors.surface,
        padding: `${tokens.spacing.componentGap}px`,
        borderRadius: `${tokens.radius.medium}px`,
      },
      className: 'silse-text-question',
    },
    reflectionBox: {
      inlineStyle: {
        fontSize: `${typography.bodySize}px`,
        color: colors.secondary,
        fontWeight: 'normal',
        textAlign: 'left',
        fontStyle: 'italic',
        backgroundColor: colors.surface,
        padding: `${tokens.spacing.componentGap}px`,
        borderRadius: `${tokens.radius.large}px`,
      },
      className: 'silse-text-reflection',
    },
  };

  return variantMap[variant] ?? variantMap.body;
}

// ---------------------------------------------------------------------------
// Image component style resolver
// ---------------------------------------------------------------------------

function resolveImageStyle(
  variant: ImageComponentVariant,
  tokens: ProjectStyle['tokens'],
): ResolvedComponentStyle {
  const { colors, radius, shadow } = tokens;

  const variantMap: Record<ImageComponentVariant, ResolvedComponentStyle> = {
    illustration: {
      inlineStyle: {
        border: `1px solid ${colors.border}`,
        borderRadius: `${radius.medium}px`,
        boxShadow: shadow.soft,
        overflow: 'hidden',
      },
      className: 'silse-image-illustration',
    },
    background: {
      inlineStyle: {
        border: 'none',
        borderRadius: '0',
        overflow: 'hidden',
      },
      className: 'silse-image-background',
    },
    imageCard: {
      inlineStyle: {
        border: `2px solid ${colors.primary}`,
        borderRadius: `${radius.large}px`,
        boxShadow: shadow.medium,
        overflow: 'hidden',
      },
      className: 'silse-image-card',
    },
  };

  return variantMap[variant] ?? variantMap.illustration;
}

// ---------------------------------------------------------------------------
// Card component style resolver
// ---------------------------------------------------------------------------

function resolveCardStyle(
  variant: CardComponentVariant,
  tokens: ProjectStyle['tokens'],
): ResolvedComponentStyle {
  const { colors, radius, spacing } = tokens;

  const variantMap: Record<CardComponentVariant, ResolvedComponentStyle> = {
    infoCard: {
      inlineStyle: {
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: `${radius.medium}px`,
        color: colors.text,
        padding: `${spacing.cardPadding}px`,
      },
      className: 'silse-card-info',
    },
    importantNote: {
      inlineStyle: {
        backgroundColor: colors.surface,
        border: `1px solid ${colors.warning}`,
        borderRadius: `${radius.medium}px`,
        color: colors.warning,
        padding: `${spacing.cardPadding}px`,
      },
      className: 'silse-card-important',
    },
    exampleCard: {
      inlineStyle: {
        backgroundColor: colors.surface,
        border: `1px solid ${colors.success}`,
        borderRadius: `${radius.medium}px`,
        color: colors.text,
        padding: `${spacing.cardPadding}px`,
      },
      className: 'silse-card-example',
    },
  };

  return variantMap[variant] ?? variantMap.infoCard;
}

// ---------------------------------------------------------------------------
// Navigation component style resolver (with interaction recipes)
// ---------------------------------------------------------------------------

function resolveNavigationStyle(
  variant: NavigationComponentVariant,
  tokens: ProjectStyle['tokens'],
  interactions: InteractionRecipe | undefined,
): ResolvedComponentStyle {
  const { colors, radius, typography } = tokens;

  const variantMap: Record<NavigationComponentVariant, ResolvedComponentStyle> = {
    navigation: {
      inlineStyle: {
        backgroundColor: colors.surface,
        color: colors.text,
        border: `2px solid ${colors.border}`,
        borderRadius: `${radius.medium}px`,
        fontSize: `${typography.bodySize}px`,
        fontWeight: 'normal',
      },
      className: 'silse-nav-default',
      interactions: resolveInteractions(interactions, colors, tokens.shadow),
    },
    primaryAction: {
      inlineStyle: {
        backgroundColor: colors.primary,
        color: '#ffffff',
        border: `2px solid ${colors.primary}`,
        borderRadius: `${radius.medium}px`,
        fontSize: `${typography.bodySize}px`,
        fontWeight: 'bold',
      },
      className: 'silse-nav-primary',
      interactions: resolveInteractions(interactions, colors, tokens.shadow),
    },
    secondaryAction: {
      inlineStyle: {
        backgroundColor: '#ffffff',
        color: colors.primary,
        border: `2px solid ${colors.primary}`,
        borderRadius: `${radius.medium}px`,
        fontSize: `${typography.bodySize}px`,
        fontWeight: 'normal',
      },
      className: 'silse-nav-secondary',
      interactions: resolveInteractions(interactions, colors, tokens.shadow),
    },
    choice: {
      inlineStyle: {
        backgroundColor: colors.surface,
        color: colors.warning,
        border: `2px solid ${colors.warning}`,
        borderRadius: `${radius.medium}px`,
        fontSize: `${typography.bodySize}px`,
        fontWeight: 'normal',
      },
      className: 'silse-nav-choice',
      interactions: resolveInteractions(interactions, colors, tokens.shadow),
    },
  };

  return variantMap[variant] ?? variantMap.navigation;
}

// ---------------------------------------------------------------------------
// Layered Info component style resolver (LXC-02 Patch-1)
// ---------------------------------------------------------------------------

function resolveLayeredInfoStyle(
  variant: LayeredInfoVariant,
  tokens: ProjectStyle['tokens'],
): ResolvedComponentStyle {
  const { colors, radius, spacing, shadow, typography } = tokens;

  // Base style: surface background, text color, border, radius, padding, shadow.
  // Semua variants share base; per-variant tweak minimal.
  const baseInline: Record<string, string | number> = {
    backgroundColor: colors.surface,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderRadius: `${radius.medium}px`,
    padding: `${spacing.cardPadding}px`,
    boxShadow: shadow.soft,
    fontSize: `${typography.bodySize}px`,
  };

  const variantMap: Record<LayeredInfoVariant, ResolvedComponentStyle> = {
    accordion: {
      inlineStyle: baseInline,
      className: 'silse-layered-accordion',
    },
    tabs: {
      inlineStyle: { ...baseInline, borderRadius: `${radius.large}px` },
      className: 'silse-layered-tabs',
    },
    iconTabs: {
      inlineStyle: { ...baseInline, borderRadius: `${radius.large}px` },
      className: 'silse-layered-icon-tabs',
    },
    stepper: {
      inlineStyle: { ...baseInline, backgroundColor: colors.background },
      className: 'silse-layered-stepper',
    },
    cardGrid: {
      inlineStyle: { ...baseInline, border: 'none', boxShadow: 'none' },
      className: 'silse-layered-card-grid',
    },
    timeline: {
      inlineStyle: { ...baseInline, border: 'none', boxShadow: 'none', backgroundColor: 'transparent' },
      className: 'silse-layered-timeline',
    },
  };

  return variantMap[variant] ?? variantMap.accordion;
}

// ---------------------------------------------------------------------------
// Main resolver
// ---------------------------------------------------------------------------

/**
 * Resolve component style from semantic inputs to concrete render style.
 *
 * Pure function:
 *   - No React, DOM, window, localStorage
 *   - No side effects
 *   - Same input → same output
 *
 * @param input - Semantic style input (tokens, type, variant, role, layoutId)
 * @returns ResolvedComponentStyle plain object
 */
export function resolveComponentStyle(input: ResolveStyleInput): ResolvedComponentStyle {
  const { tokens, componentType, variant } = input;

  switch (componentType) {
    case 'text':
      return resolveTextStyle(variant as TextComponentVariant, tokens);

    case 'image':
      return resolveImageStyle(variant as ImageComponentVariant, tokens);

    case 'card':
      return resolveCardStyle(variant as CardComponentVariant, tokens);

    case 'navigation':
      return resolveNavigationStyle(
        variant as NavigationComponentVariant,
        tokens,
        // interactionRecipes are not in tokens — they're in StylePack directly.
        // For M6, we pass undefined here; the caller (editor/preview/export)
        // can merge interactionRecipes separately if available.
        // This keeps resolver pure and decoupled from StylePack structure.
        undefined,
      );

    case 'layered-info':
      return resolveLayeredInfoStyle(
        variant as LayeredInfoVariant,
        tokens,
      );

    default:
      return { inlineStyle: {} };
  }
}

/**
 * Resolve component style with interaction recipes.
 * Extended resolver for when interactionRecipes are available (from StylePack).
 */
export function resolveComponentStyleWithInteractions(
  input: ResolveStyleInput,
  interactionRecipes: InteractionRecipe | undefined,
): ResolvedComponentStyle {
  const base = resolveComponentStyle(input);

  if (input.componentType === 'navigation' && interactionRecipes) {
    const interactions = resolveInteractions(
      interactionRecipes,
      input.tokens.colors,
      input.tokens.shadow,
    );
    return { ...base, interactions };
  }

  return base;
}

// ---------------------------------------------------------------------------
// Convenience helper: get resolved style for a component in context
// ---------------------------------------------------------------------------

/**
 * Get resolved style for a specific component within a project + page context.
 *
 * This is THE function that Editor, Preview, and Export all call.
 * It looks up interactionRecipes from the built-in StylePack (via stylePackId).
 *
 * Pure function: no React/DOM/window/localStorage/store.
 *
 * @param project - The full project (for style tokens + stylePackId)
 * @param page - The page containing the component (for role + layoutId)
 * @param component - The component to resolve
 * @returns ResolvedComponentStyle
 */
export function getResolvedComponentStyle(
  project: SimpleProject,
  page: SimplePage,
  component: PageComponent,
): ResolvedComponentStyle {
  const tokens = project.style?.tokens;
  if (!tokens) {
    return { inlineStyle: {} };
  }

  // Look up interactionRecipes from built-in StylePack
  const stylePackId = project.stylePackId;
  const stylePack = stylePackId ? getStylePack(stylePackId) : undefined;
  const interactionRecipes = stylePack?.interactionRecipes;

  return resolveComponentStyleWithInteractions(
    {
      tokens,
      componentType: component.type as 'text' | 'image' | 'card' | 'navigation' | 'question' | 'game' | 'layered-info',
      variant: (component as { variant?: string }).variant ?? 'default',
      pageRole: page.role,
      layoutId: page.layoutId,
    },
    interactionRecipes,
  );
}
