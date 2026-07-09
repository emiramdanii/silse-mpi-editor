/**
 * Normalize AI MPI JSON (MPI-JSON-SCENE-PROOF-01).
 *
 * @deprecated LEGACY normalizer — proof-of-concept from MPI-JSON-SCENE-PROOF-01.
 * Production code uses the foundation normalizer in ../normalizeAiMpiJson.ts
 * (camelCase). This file is kept only for the legacy test
 * mpi-json-scene-proof-01.test.tsx and will be deleted once that test is
 * ported to the new schema.
 *
 * Layer: core/ai-mpi-json/legacy (pure function, no React/DOM)
 * Allowed imports: ./ai-mpi-json-schema
 *
 * Kontrak:
 *   Pure function yang menerima unknown JSON (dari AI) dan mengembalikan
 *   AiMpiJson yang valid, atau melempar error dengan pesan jelas.
 *
 *   Prinsip:
 *     - Pure function, no DOM, no React, no store.
 *     - Tidak mengubah data konten (text, jawaban, feedback).
 *     - Hanya validasi struktur + normalisasi field opsional.
 *     - Unknown field diabaikan (forward-compatible).
 *
 *   Validasi minimal:
 *     - Root harus object dengan version, metadata, pages.
 *     - metadata.title wajib (string non-empty).
 *     - pages wajib (array, minimal 1 page).
 *     - Setiap page wajib punya id, role, title, blocks.
 *     - Setiap block wajib punya type.
 *     - Game block wajib punya briefing, missionTarget, actions, reward.
 *     - Actions minimal 1 correct + 1 wrong.
 */

import type {
  AiMpiJson,
  AiMpiPage,
  AiMpiBlock,
  AiMpiGameBlock,
  AiMpiQuizBlock,
  AiMpiGameAction,
} from './ai-mpi-json-schema';

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class AiMpiJsonError extends Error {
  constructor(message: string, readonly path: string) {
    super(`[AI MPI JSON] ${path}: ${message}`);
    this.name = 'AiMpiJsonError';
  }
}

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

function isBlockArray(value: unknown): value is AiMpiBlock[] {
  return Array.isArray(value) && value.every((b) => isObject(b) && isString(b.type));
}

// ---------------------------------------------------------------------------
// Normalize block
// ---------------------------------------------------------------------------

function normalizeGameAction(action: unknown, path: string): AiMpiGameAction {
  if (!isObject(action)) throw new AiMpiJsonError('action must be object', path);
  if (!isString(action.id)) throw new AiMpiJsonError('action.id must be string', path);
  if (!isString(action.label)) throw new AiMpiJsonError('action.label must be string', path);
  if (action.result !== 'correct' && action.result !== 'wrong') {
    throw new AiMpiJsonError('action.result must be "correct" or "wrong"', path);
  }
  if (!isString(action.feedback)) throw new AiMpiJsonError('action.feedback must be string', path);
  return {
    id: action.id,
    label: action.label,
    result: action.result,
    feedback: action.feedback,
  };
}

function normalizeGameBlock(block: unknown, path: string): AiMpiGameBlock {
  if (!isObject(block)) throw new AiMpiJsonError('game block must be object', path);
  if (block.variant !== 'mission-choice') {
    throw new AiMpiJsonError(`game block variant must be "mission-choice" (got: ${String(block.variant)})`, path);
  }
  if (!isString(block.title)) throw new AiMpiJsonError('game.title must be string', path);
  if (!isString(block.briefing)) throw new AiMpiJsonError('game.briefing must be string', path);
  if (!isString(block.missionTarget)) throw new AiMpiJsonError('game.missionTarget must be string', path);
  if (!Array.isArray(block.actions)) throw new AiMpiJsonError('game.actions must be array', path);
  if (block.actions.length < 2) throw new AiMpiJsonError('game.actions must have at least 2 actions', path);

  const actions = block.actions.map((a, i) => normalizeGameAction(a, `${path}.actions[${i}]`));

  // Validate: minimal 1 correct + 1 wrong
  const hasCorrect = actions.some((a) => a.result === 'correct');
  const hasWrong = actions.some((a) => a.result === 'wrong');
  if (!hasCorrect) throw new AiMpiJsonError('game.actions must have at least 1 correct action', path);
  if (!hasWrong) throw new AiMpiJsonError('game.actions must have at least 1 wrong action', path);

  // Reward
  if (!isObject(block.reward)) throw new AiMpiJsonError('game.reward must be object', path);
  if (!isString(block.reward.type)) throw new AiMpiJsonError('game.reward.type must be string', path);
  if (!isString(block.reward.label)) throw new AiMpiJsonError('game.reward.label must be string', path);

  return {
    type: 'game',
    variant: 'mission-choice',
    title: block.title,
    briefing: block.briefing,
    missionTarget: block.missionTarget,
    actions,
    reward: { type: block.reward.type, label: block.reward.label },
  };
}

function normalizeQuizBlock(block: unknown, path: string): AiMpiQuizBlock {
  if (!isObject(block)) throw new AiMpiJsonError('quiz block must be object', path);
  if (block.variant !== 'multiple-choice' && block.variant !== 'true-false') {
    throw new AiMpiJsonError(`quiz block variant must be "multiple-choice" or "true-false"`, path);
  }
  if (!isString(block.title)) throw new AiMpiJsonError('quiz.title must be string', path);
  if (!isString(block.prompt)) throw new AiMpiJsonError('quiz.prompt must be string', path);
  if (!Array.isArray(block.choices)) throw new AiMpiJsonError('quiz.choices must be array', path);
  if (block.choices.length < 2) throw new AiMpiJsonError('quiz.choices must have at least 2', path);

  const choices = block.choices.map((c: unknown, i: number) => {
    if (!isObject(c)) throw new AiMpiJsonError(`choice[${i}] must be object`, path);
    if (!isString(c.id)) throw new AiMpiJsonError(`choice[${i}].id must be string`, path);
    if (!isString(c.text)) throw new AiMpiJsonError(`choice[${i}].text must be string`, path);
    return { id: c.id, text: c.text };
  });

  if (!isString(block.correctChoiceId)) throw new AiMpiJsonError('quiz.correctChoiceId must be string', path);
  // Validate correctChoiceId exists in choices
  if (!choices.some((c) => c.id === block.correctChoiceId)) {
    throw new AiMpiJsonError(`quiz.correctChoiceId "${String(block.correctChoiceId)}" not found in choices`, path);
  }
  if (!isString(block.feedbackCorrect)) throw new AiMpiJsonError('quiz.feedbackCorrect must be string', path);
  if (!isString(block.feedbackWrong)) throw new AiMpiJsonError('quiz.feedbackWrong must be string', path);

  return {
    type: 'quiz',
    variant: block.variant,
    title: block.title,
    prompt: block.prompt,
    choices,
    correctChoiceId: block.correctChoiceId,
    feedbackCorrect: block.feedbackCorrect,
    feedbackWrong: block.feedbackWrong,
  };
}

function normalizeBlock(block: unknown, path: string): AiMpiBlock {
  if (!isObject(block)) throw new AiMpiJsonError('block must be object', path);
  if (!isString(block.type)) throw new AiMpiJsonError('block.type must be string', path);

  switch (block.type) {
    case 'text': {
      if (block.variant !== 'title' && block.variant !== 'subtitle' && block.variant !== 'body' && block.variant !== 'instruction') {
        throw new AiMpiJsonError(`text block variant invalid: ${String(block.variant)}`, path);
      }
      if (!isString(block.text)) throw new AiMpiJsonError('text.text must be string', path);
      return { type: 'text', variant: block.variant, text: block.text };
    }
    case 'card': {
      if (block.variant !== 'info-card' && block.variant !== 'important-note') {
        throw new AiMpiJsonError(`card block variant invalid: ${String(block.variant)}`, path);
      }
      if (!isString(block.body)) throw new AiMpiJsonError('card.body must be string', path);
      return {
        type: 'card',
        variant: block.variant,
        title: isString(block.title) ? block.title : undefined,
        body: block.body,
      };
    }
    case 'game':
      return normalizeGameBlock(block, path);
    case 'quiz':
      return normalizeQuizBlock(block, path);
    default:
      throw new AiMpiJsonError(`unknown block type: ${String(block.type)}`, path);
  }
}

// ---------------------------------------------------------------------------
// Normalize page
// ---------------------------------------------------------------------------

function normalizePage(page: unknown, path: string): AiMpiPage {
  if (!isObject(page)) throw new AiMpiJsonError('page must be object', path);
  if (!isString(page.id)) throw new AiMpiJsonError('page.id must be string', path);
  if (!isString(page.title)) throw new AiMpiJsonError('page.title must be string', path);

  const validRoles = ['cover', 'material', 'game', 'quiz', 'closing', 'free'];
  if (!isString(page.role) || !validRoles.includes(page.role)) {
    throw new AiMpiJsonError(`page.role must be one of: ${validRoles.join(', ')}`, path);
  }
  if (!isBlockArray(page.blocks)) throw new AiMpiJsonError('page.blocks must be array of blocks', path);

  const blocks = page.blocks.map((b, i) => normalizeBlock(b, `${path}.blocks[${i}]`));

  return {
    id: page.id,
    role: page.role as AiMpiPage['role'],
    scene: isString(page.scene) ? page.scene : undefined,
    title: page.title,
    blocks,
  };
}

// ---------------------------------------------------------------------------
// Main: normalizeAiMpiJson
// ---------------------------------------------------------------------------

/**
 * Normalize unknown AI JSON to valid AiMpiJson.
 * Throws AiMpiJsonError with path on invalid structure.
 * Pure function — no DOM, no store, no side effects.
 */
export function normalizeAiMpiJson(input: unknown): AiMpiJson {
  if (!isObject(input)) {
    throw new AiMpiJsonError('root must be object', 'root');
  }
  if (typeof input.version !== 'number') {
    throw new AiMpiJsonError('version must be number', 'root');
  }
  if (!isObject(input.metadata)) {
    throw new AiMpiJsonError('metadata must be object', 'root.metadata');
  }
  if (!isString(input.metadata.title)) {
    throw new AiMpiJsonError('metadata.title must be string', 'root.metadata');
  }
  if (!Array.isArray(input.pages)) {
    throw new AiMpiJsonError('pages must be array', 'root');
  }
  if (input.pages.length === 0) {
    throw new AiMpiJsonError('pages must have at least 1 page', 'root');
  }

  const pages = input.pages.map((p, i) => normalizePage(p, `root.pages[${i}]`));

  const metadata: AiMpiJson['metadata'] = {
    title: input.metadata.title,
    subject: isString(input.metadata.subject) ? input.metadata.subject : undefined,
    grade: isString(input.metadata.grade) ? input.metadata.grade : undefined,
    phase: isString(input.metadata.phase) ? input.metadata.phase : undefined,
    topic: isString(input.metadata.topic) ? input.metadata.topic : undefined,
    cp: isString(input.metadata.cp) ? input.metadata.cp : undefined,
    objectives: isStringArray(input.metadata.objectives) ? input.metadata.objectives : undefined,
  };

  return {
    version: input.version,
    metadata,
    styleId: isString(input.styleId) ? input.styleId : undefined,
    pages,
  };
}
