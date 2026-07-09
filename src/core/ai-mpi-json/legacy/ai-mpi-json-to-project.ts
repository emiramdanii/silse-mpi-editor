/**
 * AI MPI JSON → SimpleProject Converter (MPI-JSON-SCENE-PROOF-01).
 *
 * @deprecated LEGACY pipeline — kept only for mpi-json-scene-proof-01.test.tsx.
 * Production code uses the foundation pipeline:
 *   normalizeAiMpiJson (camelCase) → aiBlueprintToSimpleProject
 * This file will be deleted once the test is ported to the new schema.
 *
 * Layer: core/ai-mpi-json/legacy (pure function, no React/DOM)
 * Allowed imports: ../../types, ../../ids, ../../style-presets,
 *                  ../../style-packs/style-pack-registry, ./ai-mpi-json-schema
 *
 * Kontrak (MPI-JSON-SCENE-PROOF-01):
 *   Pure function yang mengkonversi AiMpiJson (input AI) menjadi SimpleProject
 *   (format internal app). Preserve scene intent di metadata tambahan.
 */

import type {
  SimpleProject,
  SimplePage,
  PageComponent,
  GameComponent,
  GameMission,
  QuestionComponent,
  TextComponent,
  CardComponent,
  PageBackground,
  PageRole,
  LayoutId,
  Curriculum,
  CurriculumObjective,
} from '../../types';
import { PROJECT_VERSION } from '../../types';
import { createProjectId, createPageId, createComponentId } from '../../ids';
import { resolveStylePackV1 } from '../../style-packs/style-pack-registry';
import { stylePackToProjectStyle } from '../../style-presets';
import type {
  AiMpiJson,
  AiMpiPage,
  AiMpiBlock,
  AiMpiGameBlock,
  AiMpiQuizBlock,
  AiMpiTextBlock,
  AiMpiCardBlock,
} from './ai-mpi-json-schema';
import { AI_MPI_SCENE_GAME_MISSION } from './ai-mpi-json-schema';

// ---------------------------------------------------------------------------
// Layout defaults per page role
// ---------------------------------------------------------------------------

function getDefaultLayoutForRole(role: string): LayoutId {
  switch (role) {
    case 'cover':
      return 'coverCentered';
    case 'material':
      return 'singleColumn';
    default:
      return 'blank';
  }
}

function getDefaultBackgroundForRole(role: string): PageBackground {
  switch (role) {
    case 'cover':
      return { type: 'color', color: '#1e3a5f' };
    case 'closing':
      return { type: 'color', color: '#1e3a5f' };
    case 'material':
      return { type: 'color', color: '#ffffff' };
    case 'quiz':
      return { type: 'color', color: '#f0f9ff' };
    case 'game':
      return { type: 'color', color: '#f0fdf4' };
    default:
      return { type: 'color', color: '#ffffff' };
  }
}

// ---------------------------------------------------------------------------
// Block → Component mapping
// ---------------------------------------------------------------------------

function mapRoleToPageRole(role: AiMpiPage['role']): PageRole {
  // AI JSON roles map directly to internal PageRole.
  // 'game' maps to 'activity' (internal role for game pages).
  if (role === 'game') return 'activity';
  return role as PageRole;
}

function mapTextBlock(block: AiMpiTextBlock, idx: number): TextComponent {
  // Stack text blocks vertically: title at top, subtitle below, body below that.
  const y = block.variant === 'title' ? 60 : block.variant === 'subtitle' ? 140 : 240;
  const height = block.variant === 'title' ? 80 : block.variant === 'subtitle' ? 60 : 120;
  const width = block.variant === 'title' || block.variant === 'subtitle' ? 1000 : 1120;

  return {
    id: createComponentId(),
    type: 'text',
    text: block.text,
    variant: block.variant === 'subtitle' ? 'subtitle' : block.variant === 'body' ? 'body' : 'title',
    x: 140,
    y: y + idx * 0, // idx not used for y here, just for uniqueness
    width,
    height,
  };
}

function mapCardBlock(block: AiMpiCardBlock, _idx: number): CardComponent {
  return {
    id: createComponentId(),
    type: 'card',
    variant: block.variant === 'important-note' ? 'importantNote' : 'infoCard',
    title: block.title,
    body: block.body,
    x: 80,
    y: 240,
    width: 1120,
    height: 200,
  };
}

function mapGameBlock(block: AiMpiGameBlock): GameComponent {
  // Map AI game block (single mission with actions) → GameComponent with 1 mission.
  // actions[i] → choices[i]
  // action.result === 'correct' → correctChoiceIndex
  // action.feedback → feedbackCorrect (for correct) / feedbackWrong (for wrong, take first wrong)
  const choices = block.actions.map((a) => ({ id: a.id, text: a.label }));
  const correctIdx = block.actions.findIndex((a) => a.result === 'correct');
  const correctAction = block.actions[correctIdx];
  const wrongAction = block.actions.find((a) => a.result === 'wrong');

  const mission: GameMission = {
    id: createComponentId(),
    title: block.title,
    prompt: block.missionTarget,
    choices,
    correctChoiceIndex: correctIdx,
    feedbackCorrect: correctAction?.feedback ?? 'Benar!',
    feedbackWrong: wrongAction?.feedback ?? 'Belum tepat.',
    points: 10,
  };

  return {
    id: createComponentId(),
    type: 'game',
    gameType: 'missionQuiz',
    title: block.title,
    instruction: block.briefing,
    missions: [mission],
    scoringStyle: 'badge',
    x: 100,
    y: 60,
    width: 1080,
    height: 580,
    // MPI-JSON-SCENE-PROOF-01: preserve scene intent di metadata
    sceneMetadata: {
      scene: AI_MPI_SCENE_GAME_MISSION,
      briefing: block.briefing,
      missionTarget: block.missionTarget,
      reward: {
        type: block.reward.type,
        label: block.reward.label,
      },
    },
  };
}

function mapQuizBlock(block: AiMpiQuizBlock): QuestionComponent {
  // Map AI quiz block → QuestionComponent.
  // correctChoiceId (string) → correctChoiceIndex (number)
  const correctIdx = block.choices.findIndex((c) => c.id === block.correctChoiceId);

  return {
    id: createComponentId(),
    type: 'question',
    variant: block.variant === 'true-false' ? 'trueFalse' : 'multipleChoice',
    title: block.title,
    prompt: block.prompt,
    choices: block.choices.map((c) => ({ id: c.id, text: c.text })),
    correctChoiceIndex: correctIdx >= 0 ? correctIdx : 0,
    feedbackCorrect: block.feedbackCorrect,
    feedbackWrong: block.feedbackWrong,
    points: 10,
    scoringStyle: 'points',
    x: 100,
    y: 60,
    width: 1080,
    height: 580,
  };
}

function mapBlockToComponent(block: AiMpiBlock, idx: number): PageComponent | null {
  switch (block.type) {
    case 'text':
      return mapTextBlock(block, idx);
    case 'card':
      return mapCardBlock(block, idx);
    case 'game':
      return mapGameBlock(block);
    case 'quiz':
      return mapQuizBlock(block);
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Page mapping
// ---------------------------------------------------------------------------

function mapAiPageToSimplePage(page: AiMpiPage): SimplePage {
  const components: PageComponent[] = [];
  for (let i = 0; i < page.blocks.length; i++) {
    const comp = mapBlockToComponent(page.blocks[i], i);
    if (comp) components.push(comp);
  }

  return {
    id: createPageId(),
    title: page.title,
    role: mapRoleToPageRole(page.role),
    layoutId: getDefaultLayoutForRole(page.role),
    background: getDefaultBackgroundForRole(page.role),
    components,
  };
}

// ---------------------------------------------------------------------------
// Curriculum mapping
// ---------------------------------------------------------------------------

function mapMetadataToCurriculum(json: AiMpiJson): Curriculum | undefined {
  const m = json.metadata;
  if (!m.subject && !m.grade && !m.phase && !m.topic && !m.cp && !m.objectives) {
    return undefined;
  }

  const objectives: CurriculumObjective[] = (m.objectives ?? []).map((text) => ({
    id: createComponentId(),
    text,
  }));

  return {
    subject: m.subject ?? '',
    grade: m.grade ?? '',
    phase: m.phase ?? '',
    topic: m.topic ?? '',
    cp: m.cp,
    objectives,
  };
}

// ---------------------------------------------------------------------------
// Main: aiMpiJsonToProject
// ---------------------------------------------------------------------------

/**
 * Convert AI MPI JSON to SimpleProject.
 * Preserve scene intent (briefing, missionTarget, reward) di GameComponent.sceneMetadata.
 *
 * Pure function — no DOM, no store, no side effects.
 * Unknown styleId → fallback modern-clean.
 */
export function aiMpiJsonToProject(json: AiMpiJson): SimpleProject {
  const pages = json.pages.map(mapAiPageToSimplePage);
  const firstPageId = pages[0]?.id ?? '';

  const stylePackId = json.styleId ?? 'modern-clean';
  const stylePack = resolveStylePackV1(stylePackId);
  const style = stylePackToProjectStyle(stylePack);

  const curriculum = mapMetadataToCurriculum(json);

  return {
    id: createProjectId(),
    title: json.metadata.title,
    version: PROJECT_VERSION,
    currentPageId: firstPageId,
    stylePackId,
    style,
    curriculum,
    pages,
  };
}

// ---------------------------------------------------------------------------
// Helper: extract scene from page (for tests + renderer)
// ---------------------------------------------------------------------------

/**
 * Extract the scene intent from an AiMpiPage.
 * Returns undefined if page has no scene.
 * Pure function.
 */
export function getPageScene(page: AiMpiPage): string | undefined {
  return page.scene;
}

/**
 * Check if a GameComponent has scene metadata for game-mission scene.
 * Pure function — used by renderer to decide scene rendering.
 */
export function isGameMissionScene(component: GameComponent): boolean {
  return component.sceneMetadata?.scene === AI_MPI_SCENE_GAME_MISSION;
}
