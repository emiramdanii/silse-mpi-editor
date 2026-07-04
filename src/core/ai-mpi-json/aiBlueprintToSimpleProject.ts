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

export function aiBlueprintToSimpleProject(blueprint: AiMpiBlueprint): SimpleProject {
  const stylePackId = blueprint.styleIntent?.styleId ?? 'modern-clean';
  const stylePack = resolveStylePackV1(stylePackId);
  let baseStyle = stylePackToProjectStyle(stylePack);
  
  // Apply designSystem.overrides jika ada
  if (blueprint.designSystem?.overrides) {
    baseStyle = applyDesignSystemOverrides(baseStyle, blueprint.designSystem.overrides);
  }
  
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
    style: baseStyle,
    curriculum,
    pages,
    // CORE-MPI-UX-FOUNDATION-01: preserve assets from blueprint (for image/media rendering).
    // Stored as metadata on the project — assets are referenced by slot content via src URL.
    assets: blueprint.assets.map((a) => ({ id: a.id, type: a.type, src: a.src, alt: a.alt })),
  };
}

function applyDesignSystemOverrides(
  baseStyle: import('../style-types').ProjectStyle,
  overrides: import('./schema').AiBlueprintDesignSystemOverrides
): import('../style-types').ProjectStyle {
  const tokens = { ...baseStyle.tokens };
  
  // Apply typography overrides
  if (overrides.typography) {
    tokens.typography = { ...tokens.typography };
    if (overrides.typography.fontFamily) {
      tokens.typography.fontFamily = overrides.typography.fontFamily;
    }
    if (overrides.typography.headingFontFamily) {
      // Map headingFontFamily ke fontFamily untuk consistency
      tokens.typography.fontFamily = overrides.typography.headingFontFamily;
    }
    if (overrides.typography.fontSizeBase) {
      // Scale font sizes based on base
      const scale = overrides.typography.fontSizeBase / 16;
      tokens.typography.titleSize = Math.round(tokens.typography.titleSize * scale);
      tokens.typography.subtitleSize = Math.round(tokens.typography.subtitleSize * scale);
      tokens.typography.bodySize = Math.round(tokens.typography.bodySize * scale);
      tokens.typography.smallSize = Math.round(tokens.typography.smallSize * scale);
    }
    if (overrides.typography.lineHeightBase) {
      tokens.typography.lineHeight = overrides.typography.lineHeightBase;
    }
  }
  
  // Apply color overrides
  if (overrides.colors) {
    tokens.colors = { ...tokens.colors };
    if (overrides.colors.primary) tokens.colors.primary = overrides.colors.primary;
    if (overrides.colors.secondary) tokens.colors.secondary = overrides.colors.secondary;
    if (overrides.colors.background) tokens.colors.background = overrides.colors.background;
    if (overrides.colors.text) tokens.colors.text = overrides.colors.text;
    if (overrides.colors.success) tokens.colors.success = overrides.colors.success;
    if (overrides.colors.warning) tokens.colors.warning = overrides.colors.warning;
    if (overrides.colors.error) {
      tokens.colors.danger = overrides.colors.error;
    }
  }
  
  // Apply spacing overrides
  if (overrides.spacing) {
    tokens.spacing = { ...tokens.spacing };
    if (overrides.spacing.unit) {
      const scale = overrides.spacing.unit / 8;
      tokens.spacing.pagePadding = Math.round(tokens.spacing.pagePadding * scale);
      tokens.spacing.componentGap = Math.round(tokens.spacing.componentGap * scale);
      tokens.spacing.cardPadding = Math.round(tokens.spacing.cardPadding * scale);
    }
  }
  
  // Apply radius overrides
  if (overrides.radius) {
    tokens.radius = { ...tokens.radius };
    if (overrides.radius.default) {
      tokens.radius.small = overrides.radius.default;
      tokens.radius.medium = Math.round(overrides.radius.default * 1.5);
      tokens.radius.large = Math.round(overrides.radius.default * 2);
    }
  }
  
  return {
    ...baseStyle,
    tokens
  };
}
