/**
 * AiMpiBlueprint → SimpleProject Converter (AI-MPI-JSON-BLUEPRINT-01).
 *
 * Layer: core/ai-mpi-json (pure function, no React/DOM)
 * Allowed imports: ../types, ../ids, ../style-presets, ../style-packs/style-pack-registry, ./schema
 *
 * Kontrak:
 *   Pure function yang mengkonversi AiMpiBlueprint (rich schema AI) menjadi SimpleProject.
 *   Menerapkan designSystem.overrides ke style project (BUG FIX V1).
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
  ProjectStyle,
  StyleTokens,
} from '../types';
import { PROJECT_VERSION } from '../types';
import { createProjectId } from '../ids';
import { resolveStylePackV1 } from '../style-packs/style-pack-registry';
import { stylePackToProjectStyle } from '../style-presets';
import type {
  AiMpiBlueprint,
  AiBlueprintScene,
} from './schema';

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
    case 'cover':
      return 'coverCentered';
    case 'material':
      return 'singleColumn';
    default:
      return 'blank';
  }
}

function getDefaultBackgroundForRole(role: PageRole): PageBackground {
  switch (role) {
    case 'cover':
      return { type: 'color', color: '#1e3a5f' };
    case 'closing':
      return { type: 'color', color: '#1e3a5f' };
    case 'material':
      return { type: 'color', color: '#ffffff' };
    case 'quiz':
      return { type: 'color', color: '#f0f9ff' };
    case 'activity':
      return { type: 'color', color: '#f0fdf4' };
    default:
      return { type: 'color', color: '#ffffff' };
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
      ? ({
          x: primarySlot.placement.x,
          y: primarySlot.placement.y,
          width: primarySlot.placement.width,
          height: primarySlot.placement.height,
          zIndex: primarySlot.placement.zIndex,
        } as any)
      : undefined,
    sceneSlotRole: primarySlot?.role,
  };
}

/**
 * Menerapkan designSystem.overrides ke ProjectStyle.
 * BUG FIX V1: Sebelumnya overrides diabaikan, sekarang diterapkan.
 */
function applyDesignSystemOverrides(
  baseStyle: ProjectStyle,
  overrides?: import('./schema').AiBlueprintDesignSystemOverrides,
): ProjectStyle {
  if (!overrides || Object.keys(overrides).length === 0) {
    return baseStyle;
  }

  const tokens: StyleTokens = { ...baseStyle.tokens };

  // Terapkan overrides typography
  if (overrides.typography) {
    tokens.typography = { ...tokens.typography };
    if (overrides.typography.fontFamily) {
      tokens.typography.fontFamily = overrides.typography.fontFamily;
    }
    // Map fontSizeBase ke bodySize jika ada
    if (overrides.typography.fontSizeBase) {
      tokens.typography.bodySize = overrides.typography.fontSizeBase;
    }
    // Map lineHeightBase ke lineHeight jika ada
    if (overrides.typography.lineHeightBase) {
      tokens.typography.lineHeight = overrides.typography.lineHeightBase;
    }
  }

  // Terapkan overrides colors
  if (overrides.colors) {
    tokens.colors = { ...tokens.colors };
    if (overrides.colors.primary) {
      tokens.colors.primary = overrides.colors.primary;
    }
    if (overrides.colors.secondary) {
      tokens.colors.secondary = overrides.colors.secondary;
    }
    if (overrides.colors.background) {
      tokens.colors.background = overrides.colors.background;
    }
    if (overrides.colors.text) {
      tokens.colors.text = overrides.colors.text;
    }
    // Map accent ke secondary jika tidak ada field accent
    if (overrides.colors.accent) {
      tokens.colors.secondary = overrides.colors.accent;
    }
    if (overrides.colors.success) {
      tokens.colors.success = overrides.colors.success;
    }
    if (overrides.colors.warning) {
      tokens.colors.warning = overrides.colors.warning;
    }
    // Map error ke danger jika tidak ada field error
    if (overrides.colors.error) {
      tokens.colors.danger = overrides.colors.error;
    }
  }

  // Terapkan overrides spacing
  if (overrides.spacing) {
    tokens.spacing = { ...tokens.spacing };
    // Map unit ke pagePadding jika tidak ada field unit
    if (overrides.spacing.unit) {
      tokens.spacing.pagePadding = overrides.spacing.unit;
    }
    // Map scale ke componentGap jika tidak ada field scale
    if (overrides.spacing.scale) {
      tokens.spacing.componentGap = overrides.spacing.scale;
    }
  }

  // Terapkan overrides radius
  if (overrides.radius) {
    tokens.radius = { ...tokens.radius };
    // Map default ke medium jika tidak ada field default
    if (overrides.radius.default) {
      tokens.radius.medium = overrides.radius.default;
    }
    if (overrides.radius.large) {
      tokens.radius.large = overrides.radius.large;
    }
    if (overrides.radius.small) {
      tokens.radius.small = overrides.radius.small;
    }
  }

  // Terapkan overrides shadow
  if (overrides.shadow) {
    tokens.shadow = { ...tokens.shadow };
    // Map default ke soft jika tidak ada field default
    if (overrides.shadow.default) {
      tokens.shadow.soft = overrides.shadow.default;
    }
    if (overrides.shadow.large) {
      tokens.shadow.medium = overrides.shadow.large;
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

  // BUG FIX V1: Terapkan designSystem.overrides
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
    assets: blueprint.assets.map((a) => ({ id: a.id, type: a.type, src: a.src, alt: a.alt })),
  };
}
