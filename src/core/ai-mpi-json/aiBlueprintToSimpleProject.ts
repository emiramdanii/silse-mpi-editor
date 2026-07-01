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
    style: stylePackToProjectStyle(stylePack),
    curriculum,
    pages,
    // CORE-MPI-UX-FOUNDATION-01: preserve assets from blueprint (for image/media rendering).
    // Stored as metadata on the project — assets are referenced by slot content via src URL.
    assets: blueprint.assets.map((a) => ({ id: a.id, type: a.type, src: a.src, alt: a.alt })),
  };
}
