/**
 * Legacy → Foundation Adapter (AUDIT 5.9.5 UNIFY strategy).
 *
 * @deprecated Legacy compatibility adapter. Converts the proof-of-concept
 * AiMpiJson (flat pages+blocks) into the foundation AiMpiBlueprint
 * (scenes+slots) so legacy input can flow through the foundation pipeline.
 *
 * Layer: core/ai-mpi-json/legacy (pure function, no React/DOM)
 * Allowed imports:
 *   ./ai-mpi-json-schema (legacy types)
 *   ../schema (foundation types)
 *   ../../ids (ID generation)
 *
 * Strategy (UNIFY, not BUANG):
 *   Instead of maintaining two parallel pipelines (legacy converter +
 *   foundation converter), this adapter normalizes legacy input into
 *   foundation shape. The legacy ai-mpi-json-to-project.ts then delegates
 *   to aiBlueprintToSimpleProject (foundation converter) — single source
 *   of truth for the conversion logic.
 *
 *   Flow:
 *     legacy AiMpiJson → legacyToBlueprint() → AiMpiBlueprint
 *                                              → normalizeAiMpiJson (foundation)
 *                                              → aiBlueprintToSimpleProject
 *
 *   The legacy test mpi-json-scene-proof-01.test.tsx continues to work
 *   unchanged. Sample penjelajah-pancasila-scene-proof.json continues
 *   to work. But internally, only ONE converter runs.
 *
 * Mapping rules:
 *   metadata.title           → metadata.title
 *   metadata.subject/grade/  → curriculum.subject/grade/phase/topic/cp
 *     phase/topic/cp
 *   metadata.objectives[]    → curriculum.objectives[] (string → {id,text})
 *   styleId                  → styleIntent.styleId + designSystem.contractId
 *   pages[]                  → scenes[]
 *     page.id                  → scene.id
 *     page.role                → scene.role (mapped; 'free' → 'material')
 *     page.scene               → scene.sceneType (mapped; see ROLE_MAP /
 *                               SCENE_TYPE_MAP below)
 *     page.title               → scene.title
 *     page.blocks[]            → scene.slots[] (one slot per block,
 *                               primary role for first block)
 *       text block               → slot content kind 'text'
 *       card block               → slot content kind 'card'
 *       game block               → slot content kind 'game-mission'
 *       quiz block               → slot content kind 'quiz-question'
 *
 *   Pages without an explicit `scene` get a sceneType inferred from
 *   their role (cover → cover-hero, material → learning-scene, etc.).
 */

import type {
  AiMpiJson,
  AiMpiPage,
  AiMpiBlock,
  AiMpiGameBlock,
  AiMpiQuizBlock,
  AiMpiTextBlock,
  AiMpiCardBlock,
} from './ai-mpi-json-schema';
import type {
  AiMpiBlueprint,
  AiBlueprintScene,
  AiBlueprintSceneType,
  AiBlueprintSceneRole,
  AiBlueprintSlot,
  AiBlueprintSlotContent,
  AiBlueprintGameAction,
  AiBlueprintReward,
  AiBlueprintPlacement,
} from '../schema';
import { createComponentId } from '../../ids';

// ---------------------------------------------------------------------------
// Role + scene-type mapping (legacy → foundation)
// ---------------------------------------------------------------------------

/**
 * Map legacy page.role → foundation scene.role.
 *
 * Legacy roles: cover | material | game | quiz | closing | free
 * Foundation roles: cover | guide | objectives | starter | material |
 *                  mission-map | game | quiz | reflection | closing | activity
 *
 * 'free' has no direct foundation equivalent — falls back to 'material'.
 * 'game' maps to 'activity' (foundation uses 'activity' for game-mission pages).
 */
const ROLE_MAP: Record<AiMpiPage['role'], AiBlueprintSceneRole> = {
  cover: 'cover',
  material: 'material',
  game: 'activity',
  quiz: 'quiz',
  closing: 'closing',
  free: 'material',
};

/**
 * Map legacy page.scene (or inferred from role) → foundation scene.sceneType.
 *
 * Legacy scene constants (in ai-mpi-json-schema.ts):
 *   AI_MPI_SCENE_GAME_MISSION = 'game-mission'  (same in foundation)
 *   AI_MPI_SCENE_COVER_HERO = 'cover-hero'      (same in foundation)
 *   AI_MPI_SCENE_MATERIAL_BRIEF = 'material-brief'  (foundation: 'learning-scene')
 *   AI_MPI_SCENE_QUIZ_CHECK = 'quiz-check'          (foundation: 'quiz-challenge')
 *   AI_MPI_SCENE_CLOSING_THANKS = 'closing-thanks'  (foundation: 'closing-award')
 *
 * If page.scene is absent, infer from page.role.
 */
const SCENE_TYPE_FROM_ROLE: Record<AiMpiPage['role'], AiBlueprintSceneType> = {
  cover: 'cover-hero',
  material: 'learning-scene',
  game: 'game-mission',
  quiz: 'quiz-challenge',
  closing: 'closing-award',
  free: 'learning-scene',
};

/**
 * Map legacy scene identifier (page.scene) → foundation sceneType.
 * Falls back to SCENE_TYPE_FROM_ROLE[page.role] if scene is missing or unknown.
 */
function mapSceneType(page: AiMpiPage): AiBlueprintSceneType {
  const scene = page.scene;
  if (!scene) return SCENE_TYPE_FROM_ROLE[page.role];
  // Direct matches (legacy identifier already matches foundation)
  if (scene === 'game-mission') return 'game-mission';
  if (scene === 'cover-hero') return 'cover-hero';
  // Legacy-only identifiers → foundation equivalents
  if (scene === 'material-brief') return 'learning-scene';
  if (scene === 'quiz-check') return 'quiz-challenge';
  if (scene === 'closing-thanks') return 'closing-award';
  // Unknown scene string — pass through (foundation validator will reject
  // if it's not a known sceneType, which is the correct behavior).
  return scene as AiBlueprintSceneType;
}

// ---------------------------------------------------------------------------
// Block → Slot content mapping
// ---------------------------------------------------------------------------

function mapTextBlock(block: AiMpiTextBlock): AiBlueprintSlotContent {
  return {
    kind: 'text',
    variant: block.variant,
    text: block.text,
  };
}

function mapCardBlock(block: AiMpiCardBlock): AiBlueprintSlotContent {
  return {
    kind: 'card',
    variant: block.variant,
    title: block.title,
    body: block.body,
  };
}

function mapGameBlock(block: AiMpiGameBlock): AiBlueprintSlotContent {
  const actions: AiBlueprintGameAction[] = block.actions.map((a) => ({
    id: a.id,
    label: a.label,
    result: a.result,
    feedback: a.feedback,
  }));
  const reward: AiBlueprintReward = {
    type: block.reward.type,
    label: block.reward.label,
  };
  return {
    kind: 'game-mission',
    briefing: block.briefing,
    missionTarget: block.missionTarget,
    actions,
    reward,
  };
}

function mapQuizBlock(block: AiMpiQuizBlock): AiBlueprintSlotContent {
  return {
    kind: 'quiz-question',
    prompt: block.prompt,
    choices: block.choices,
    correctChoiceId: block.correctChoiceId,
    feedbackCorrect: block.feedbackCorrect,
    feedbackWrong: block.feedbackWrong,
  };
}

function mapBlockToContent(block: AiMpiBlock): AiBlueprintSlotContent | null {
  switch (block.type) {
    case 'text':
      return mapTextBlock(block);
    case 'card':
      return mapCardBlock(block);
    case 'game':
      return mapGameBlock(block);
    case 'quiz':
      return mapQuizBlock(block);
    default:
      // Unknown block type — skip (legacy schema only has 4 types)
      return null;
  }
}

// ---------------------------------------------------------------------------
// Page → Scene mapping
// ---------------------------------------------------------------------------

const DEFAULT_PLACEMENT: AiBlueprintPlacement = {
  x: 72,
  y: 64,
  width: 1136,
  height: 544,
  zIndex: 2,
};

function mapPageToScene(page: AiMpiPage): AiBlueprintScene {
  const slots: AiBlueprintSlot[] = [];
  page.blocks.forEach((block, idx) => {
    const content = mapBlockToContent(block);
    if (content === null) return;
    slots.push({
      id: `slot-${createComponentId().slice(5)}`,
      role: idx === 0 ? 'primary' : 'secondary',
      placement: DEFAULT_PLACEMENT,
      content,
    });
  });

  return {
    id: page.id,
    role: ROLE_MAP[page.role],
    sceneType: mapSceneType(page),
    title: page.title,
    slots,
    // Legacy pages have no navigation field — leave undefined.
  };
}

// ---------------------------------------------------------------------------
// Root adapter: AiMpiJson → AiMpiBlueprint
// ---------------------------------------------------------------------------

/**
 * Convert a legacy AiMpiJson (flat pages+blocks) into a foundation
 * AiMpiBlueprint (scenes+slots).
 *
 * The resulting blueprint can be fed into the foundation pipeline:
 *   validateAiMpiJson → normalizeAiMpiJson → aiBlueprintToSimpleProject
 *
 * This is the UNIFY strategy: legacy input is adapted to foundation shape,
 * so only ONE converter (aiBlueprintToSimpleProject) runs in production.
 * The legacy ai-mpi-json-to-project.ts delegates to this adapter + the
 * foundation converter, eliminating the duplicate conversion logic.
 */
export function legacyToBlueprint(legacy: AiMpiJson): AiMpiBlueprint {
  const scenes: AiBlueprintScene[] = legacy.pages.map(mapPageToScene);

  // Map metadata + curriculum. Legacy puts subject/grade/phase/topic/cp/
  // objectives inside metadata. Foundation splits them: metadata has only
  // title/subtitle/author/createdAt; curriculum has the rest.
  const objectives = (legacy.metadata.objectives ?? []).map((text, i) => ({
    id: `obj-${i + 1}`,
    text,
  }));

  const styleId = legacy.styleId ?? 'modern-clean';

  return {
    version: 1,
    metadata: {
      title: legacy.metadata.title,
      // Legacy metadata has no subtitle/author/createdAt — omit.
    },
    curriculum: {
      subject: legacy.metadata.subject ?? '',
      grade: legacy.metadata.grade ?? '',
      phase: legacy.metadata.phase ?? '',
      topic: legacy.metadata.topic ?? '',
      cp: legacy.metadata.cp,
      objectives,
    },
    styleIntent: {
      styleId,
      mood: 'clean',
      intent: `Adapted from legacy AiMpiJson (was: ${legacy.metadata.title})`,
    },
    designSystem: {
      contractId: styleId,
      paletteName: 'legacy-adapted',
      typographyName: 'legacy-adapted',
    },
    flow: {
      steps: scenes.map((s) => ({ sceneId: s.id, label: s.title })),
      mode: 'linear',
    },
    scenes,
    assets: [],
    runtime: {
      showProgress: true,
      showScore: true,
    },
    exportConfig: {
      format: 'html-standalone',
      embedAssets: true,
      includeToolbar: true,
      stageWidth: 1280,
      stageHeight: 720,
    },
  };
}
