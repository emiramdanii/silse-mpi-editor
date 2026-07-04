/**
 * AiMpiBlueprint → SimpleProject Bridge (BASELINE-SYNC).
 *
 * Layer: core/ai-mpi-json (pure function, no React/DOM)
 * Allowed imports: ./schema, ../types, ../ids, ../style-presets, ../style-packs/style-pack-registry
 *
 * Kontrak:
 *   Pure function yang mengkonversi AiMpiBlueprint (12 scene) menjadi SimpleProject
 *   (12 page) dengan sceneType + sceneContent override per page.
 *
 *   Pipeline: AI JSON → AiMpiBlueprint → SimpleProject → CanvasStage / PreviewApp / export-html
 */

import type {
  SimpleProject,
  SimplePage,
  PageRole,
  LayoutId,
  PageBackground,
  Curriculum,
  CurriculumObjective,
} from '../types';
import { PROJECT_VERSION } from '../types';
import type { ProjectStyle, StyleTokens } from '../style-types';
import { createProjectId } from '../ids';
import { resolveStylePackV1 } from '../style-packs/style-pack-registry';
import { stylePackToProjectStyle } from '../style-presets';
import type { AiMpiBlueprint, AiBlueprintScene } from './schema';

function mapBlueprintRoleToPageRole(role: string): PageRole {
  const mapping: Record<string, PageRole> = {
    cover: 'cover',
    guide: 'guide',
    objectives: 'learningObjectives',
    starter: 'starter',
    material: 'material',
    'mission-map': 'activity',
    game: 'activity',
    quiz: 'quiz',
    reflection: 'reflection',
    closing: 'closing',
  };
  return mapping[role] ?? 'material';
}

function getDefaultLayoutForRole(role: PageRole): LayoutId {
  switch (role) {
    case 'cover': return 'coverCentered';
    case 'material': return 'singleColumn';
    default: return 'blank';
  }
}

function getDefaultBackgroundForRole(role: PageRole): PageBackground {
  switch (role) {
    case 'cover': return { type: 'color', color: '#1e3a5f' };
    case 'closing': return { type: 'color', color: '#1e3a5f' };
    case 'material': return { type: 'color', color: '#ffffff' };
    case 'quiz': return { type: 'color', color: '#f0f9ff' };
    case 'activity': return { type: 'color', color: '#f0fdf4' };
    default: return { type: 'color', color: '#ffffff' };
  }
}

function mapSceneToPage(scene: AiBlueprintScene): SimplePage {
  const role = mapBlueprintRoleToPageRole(scene.role);
  const primarySlot = scene.slots[0];
  return {
    id: scene.id,
    title: scene.title,
    role,
    layoutId: getDefaultLayoutForRole(role),
    background: getDefaultBackgroundForRole(role),
    components: [],
    sceneType: scene.sceneType,
    sceneContent: primarySlot?.content,
    scenePlacement: primarySlot?.placement
      ? {
          x: primarySlot.placement.x,
          y: primarySlot.placement.y,
          width: primarySlot.placement.width,
          height: primarySlot.placement.height,
          zIndex: primarySlot.placement.zIndex,
        }
      : undefined,
    sceneSlotRole: primarySlot?.role,
  };
}

/**
 * Apply designSystem.overrides to ProjectStyle.
 * BUG FIX V1 (from Qwen PR): Previously overrides from AI were ignored.
 * Now AI custom styles (font, color, spacing, radius, shadow) are applied.
 *
 * Override key format: "category.tokenName" e.g. "typography.fontFamily",
 * "colors.primary", "spacing.pagePadding".
 */
function applyDesignSystemOverrides(
  baseStyle: ProjectStyle,
  overrides?: Record<string, string | number | boolean>,
): ProjectStyle {
  if (!overrides || Object.keys(overrides).length === 0) {
    return baseStyle;
  }

  const tokens: StyleTokens = { ...baseStyle.tokens };

  for (const [key, value] of Object.entries(overrides)) {
    const parts = key.split('.');
    if (parts.length !== 2) continue;

    const [category, tokenName] = parts;

    if (category === 'typography' && tokens.typography) {
      tokens.typography = { ...tokens.typography };
      (tokens.typography as Record<string, unknown>)[tokenName] = value;
    } else if (category === 'colors' && tokens.colors) {
      tokens.colors = { ...tokens.colors };
      (tokens.colors as Record<string, unknown>)[tokenName] = value;
    } else if (category === 'spacing' && tokens.spacing) {
      tokens.spacing = { ...tokens.spacing };
      (tokens.spacing as Record<string, unknown>)[tokenName] = value;
    } else if (category === 'radius' && tokens.radius) {
      tokens.radius = { ...tokens.radius };
      (tokens.radius as Record<string, unknown>)[tokenName] = value;
    } else if (category === 'shadow' && tokens.shadow) {
      tokens.shadow = { ...tokens.shadow };
      (tokens.shadow as Record<string, unknown>)[tokenName] = value;
    }
  }

  return {
    ...baseStyle,
    tokens,
  };
}

export function aiBlueprintToSimpleProject(blueprint: AiMpiBlueprint): SimpleProject {
  const stylePackId = blueprint.styleIntent?.styleId ?? 'modern-clean';
  const stylePack = resolveStylePackV1(stylePackId);
  let style = stylePackToProjectStyle(stylePack);

  // BUG FIX V1 (from Qwen PR): Apply designSystem.overrides so AI custom styles
  // (font, color, spacing) are not ignored during import.
  style = applyDesignSystemOverrides(style, blueprint.designSystem?.overrides);

  const pages: SimplePage[] = blueprint.scenes.map(mapSceneToPage);

  const curriculum: Curriculum | undefined = blueprint.curriculum
    ? {
        subject: blueprint.curriculum.subject,
        grade: blueprint.curriculum.grade,
        phase: blueprint.curriculum.phase,
        topic: blueprint.curriculum.topic,
        cp: blueprint.curriculum.cp,
        objectives: blueprint.curriculum.objectives.map(
          (o): CurriculumObjective => ({ id: o.id, text: o.text }),
        ),
      }
    : undefined;

  return {
    id: createProjectId(),
    title: blueprint.metadata.title,
    version: PROJECT_VERSION,
    currentPageId: pages[0]?.id ?? '',
    stylePackId,
    style,
    curriculum,
    pages,
    // CORE-MPI-UX-FOUNDATION-01: preserve assets from blueprint (for image/media rendering).
    // Stored as metadata on the project — assets are referenced by slot content via src URL.
    assets: blueprint.assets.map((a) => ({ id: a.id, type: a.type, src: a.src, alt: a.alt })),
  };
}
