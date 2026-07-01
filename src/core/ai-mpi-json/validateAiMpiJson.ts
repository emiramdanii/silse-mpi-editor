/**
 * Validate AI MPI Blueprint (AI-MPI-JSON-BLUEPRINT-01 + FOUNDATION-FINAL-LOCK-01 PATCH A).
 *
 * Layer: core/ai-mpi-json (pure function, no React/DOM)
 * Allowed imports: ./schema, ../mpi-container/universal-scene-taxonomy
 *
 * Kontrak:
 *   Pure validator untuk AiMpiBlueprint. Menolak JSON datar (hanya title/content).
 *   Returns error array. Empty = valid.
 *   PATCH A: Mendukung 26 scene types (5 rendered + 21 contract-only).
 *   Validator menolak sceneType yang tidak dikenal.
 *   Validator memvalidasi required slots per scene type.
 */

import { isKnownSceneType } from '../mpi-container/universal-scene-taxonomy';

export type BlueprintValidationError = {
  path: string;
  message: string;
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function isString(v: unknown): v is string {
  return typeof v === 'string';
}

export function validateAiMpiJson(input: unknown): BlueprintValidationError[] {
  const errors: BlueprintValidationError[] = [];

  if (!isObject(input)) {
    errors.push({ path: 'root', message: 'must be object' });
    return errors;
  }

  if (typeof input.version !== 'number') errors.push({ path: 'version', message: 'must be number' });
  if (!isObject(input.metadata)) errors.push({ path: 'metadata', message: 'must be object' });
  else if (!isString(input.metadata.title)) errors.push({ path: 'metadata.title', message: 'must be string' });

  // styleIntent wajib (bukan flat)
  if (!isObject(input.styleIntent)) {
    errors.push({ path: 'styleIntent', message: 'must be object (bukan flat)' });
  } else if (!isString(input.styleIntent.styleId)) {
    errors.push({ path: 'styleIntent.styleId', message: 'must be string' });
  }

  // designSystem wajib (bukan flat)
  if (!isObject(input.designSystem)) {
    errors.push({ path: 'designSystem', message: 'must be object (bukan flat)' });
  } else if (!isString(input.designSystem.contractId)) {
    errors.push({ path: 'designSystem.contractId', message: 'must be string' });
  }

  // flow wajib
  if (!isObject(input.flow) || !Array.isArray(input.flow.steps)) {
    errors.push({ path: 'flow', message: 'must have steps array' });
  }

  // scenes wajib (array, minimal 1)
  if (!Array.isArray(input.scenes) || input.scenes.length === 0) {
    errors.push({ path: 'scenes', message: 'must be non-empty array' });
  } else {
    input.scenes.forEach((scene: unknown, i: number) => {
      const sErrors = validateScene(scene, `scenes[${i}]`);
      errors.push(...sErrors);
    });
  }

  // assets wajib (array, boleh kosong)
  if (!Array.isArray(input.assets)) {
    errors.push({ path: 'assets', message: 'must be array' });
  }

  // runtime wajib (object)
  if (!isObject(input.runtime)) {
    errors.push({ path: 'runtime', message: 'must be object' });
  }

  // exportConfig wajib (object)
  if (!isObject(input.exportConfig)) {
    errors.push({ path: 'exportConfig', message: 'must be object' });
  }

  return errors;
}

function validateScene(scene: unknown, path: string): BlueprintValidationError[] {
  const errors: BlueprintValidationError[] = [];
  if (!isObject(scene)) {
    errors.push({ path, message: 'must be object' });
    return errors;
  }
  if (!isString(scene.id)) errors.push({ path: `${path}.id`, message: 'must be string' });
  if (!isString(scene.role)) errors.push({ path: `${path}.role`, message: 'must be string' });
  if (!isString(scene.sceneType)) errors.push({ path: `${path}.sceneType`, message: 'must be string' });
  if (!isString(scene.title)) errors.push({ path: `${path}.title`, message: 'must be string' });

  // FOUNDATION-FINAL-LOCK-01 PATCH A: reject unknown sceneType
  if (isString(scene.sceneType) && !isKnownSceneType(scene.sceneType)) {
    errors.push({ path: `${path}.sceneType`, message: `unknown sceneType "${scene.sceneType}" — must be one of 26 known scene types` });
  }

  // slots wajib (array, minimal 1 — bukan flat content)
  if (!Array.isArray(scene.slots) || scene.slots.length === 0) {
    errors.push({ path: `${path}.slots`, message: 'must be non-empty array (bukan flat content)' });
  } else {
    scene.slots.forEach((slot: unknown, i: number) => {
      const sErrors = validateSlot(slot, `${path}.slots[${i}]`);
      errors.push(...sErrors);
    });

    // FOUNDATION-HARDENING-01: learning-scene wajib punya learning-material slot
    if (scene.sceneType === 'learning-scene') {
      const hasLearningMaterial = scene.slots.some((slot: unknown) =>
        isObject(slot) && isObject((slot as Record<string, unknown>).content) &&
        (slot as { content: { kind: string } }).content.kind === 'learning-material',
      );
      if (!hasLearningMaterial) {
        errors.push({ path: `${path}.slots`, message: 'learning-scene must have at least one slot with content.kind "learning-material"' });
      }
    }
    // FOUNDATION-FINAL-LOCK-01: cover-hero wajib punya cover-hero slot
    if (scene.sceneType === 'cover-hero') {
      const hasCoverHero = scene.slots.some((slot: unknown) =>
        isObject(slot) && isObject((slot as Record<string, unknown>).content) &&
        (slot as { content: { kind: string } }).content.kind === 'cover-hero',
      );
      if (!hasCoverHero) {
        errors.push({ path: `${path}.slots`, message: 'cover-hero scene must have at least one slot with content.kind "cover-hero"' });
      }
    }
    // FOUNDATION-FINAL-LOCK-01: closing-award wajib punya closing-award slot
    if (scene.sceneType === 'closing-award') {
      const hasClosingAward = scene.slots.some((slot: unknown) =>
        isObject(slot) && isObject((slot as Record<string, unknown>).content) &&
        (slot as { content: { kind: string } }).content.kind === 'closing-award',
      );
      if (!hasClosingAward) {
        errors.push({ path: `${path}.slots`, message: 'closing-award scene must have at least one slot with content.kind "closing-award"' });
      }
    }
  }

  return errors;
}

function validateSlot(slot: unknown, path: string): BlueprintValidationError[] {
  const errors: BlueprintValidationError[] = [];
  if (!isObject(slot)) {
    errors.push({ path, message: 'must be object' });
    return errors;
  }
  if (!isString(slot.id)) errors.push({ path: `${path}.id`, message: 'must be string' });
  if (!isString(slot.role)) errors.push({ path: `${path}.role`, message: 'must be string' });

  // placement wajib (x, y, width, height)
  if (!isObject(slot.placement)) {
    errors.push({ path: `${path}.placement`, message: 'must be object' });
  } else {
    if (typeof slot.placement.x !== 'number') errors.push({ path: `${path}.placement.x`, message: 'must be number' });
    if (typeof slot.placement.y !== 'number') errors.push({ path: `${path}.placement.y`, message: 'must be number' });
    if (typeof slot.placement.width !== 'number') errors.push({ path: `${path}.placement.width`, message: 'must be number' });
    if (typeof slot.placement.height !== 'number') errors.push({ path: `${path}.placement.height`, message: 'must be number' });
  }

  // content wajib dengan kind
  if (!isObject(slot.content) || !isString(slot.content.kind)) {
    errors.push({ path: `${path}.content`, message: 'must have kind string' });
    return errors;
  }

  // FOUNDATION-HARDENING-01: tolak content.kind yang tidak dikenal
  const knownKinds = ['text', 'card', 'image', 'button', 'badge', 'game-mission', 'quiz-question', 'learning-material', 'cover-hero', 'closing-award', 'feedback', 'reward', 'navigation', 'curriculum-guide', 'objectives-path', 'starter-review', 'discussion-scene', 'case-analysis', 'result-summary', 'reflection-journal', 'classification-game', 'hotspot-map', 'matching-game', 'sequencing-game', 'media-focus', 'diagnostic-check', 'remedial-practice', 'enrichment-challenge', 'worksheet-activity', 'rubric-panel'];
  const kind = slot.content.kind;
  if (!knownKinds.includes(kind)) {
    errors.push({ path: `${path}.content.kind`, message: `unknown kind "${kind}" — must be one of: ${knownKinds.join(', ')}` });
    return errors;
  }

  // FOUNDATION-HARDENING-01: validasi field wajib per kind
  const c = slot.content;
  if (kind === 'learning-material') {
    if (!isString(c.conceptTitle) || (c.conceptTitle as string).length === 0) {
      errors.push({ path: `${path}.content.conceptTitle`, message: 'must be non-empty string' });
    }
    if (!isString(c.explanation) || (c.explanation as string).length === 0) {
      errors.push({ path: `${path}.content.explanation`, message: 'must be non-empty string' });
    }
  }
  if (kind === 'game-mission') {
    if (!isString(c.briefing)) errors.push({ path: `${path}.content.briefing`, message: 'must be string' });
    if (!isString(c.missionTarget)) errors.push({ path: `${path}.content.missionTarget`, message: 'must be string' });
    if (!Array.isArray(c.actions)) errors.push({ path: `${path}.content.actions`, message: 'must be array' });
    if (!isObject(c.reward)) errors.push({ path: `${path}.content.reward`, message: 'must be object' });
  }
  if (kind === 'quiz-question') {
    if (!isString(c.prompt)) errors.push({ path: `${path}.content.prompt`, message: 'must be string' });
    if (!Array.isArray(c.choices)) errors.push({ path: `${path}.content.choices`, message: 'must be array' });
    if (!isString(c.correctChoiceId)) errors.push({ path: `${path}.content.correctChoiceId`, message: 'must be string' });
  }
  // FOUNDATION-FINAL-LOCK-01: cover-hero requires heroTitle
  if (kind === 'cover-hero') {
    if (!isString(c.heroTitle) || (c.heroTitle as string).length === 0) {
      errors.push({ path: `${path}.content.heroTitle`, message: 'must be non-empty string' });
    }
  }
  // FOUNDATION-FINAL-LOCK-01: closing-award requires achievement or rewardLabel
  if (kind === 'closing-award') {
    const hasAch = isString(c.achievement) && (c.achievement as string).length > 0;
    const hasReward = isString(c.rewardLabel) && (c.rewardLabel as string).length > 0;
    if (!hasAch && !hasReward) {
      errors.push({ path: `${path}.content`, message: 'closing-award must have achievement or rewardLabel (at least one non-empty)' });
    }
  }
  // GOLDEN-REFERENCE-GAME-P1: classification-game requires items + categories
  if (kind === 'classification-game') {
    if (!Array.isArray(c.items)) errors.push({ path: `${path}.content.items`, message: 'must be array' });
    if (!Array.isArray(c.categories)) errors.push({ path: `${path}.content.categories`, message: 'must be array' });
  }

  return errors;
}

export function isValidAiMpiJson(input: unknown): boolean {
  return validateAiMpiJson(input).length === 0;
}
