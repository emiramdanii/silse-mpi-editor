/**
 * AI MPI JSON Schema (MPI-JSON-SCENE-PROOF-01).
 *
 * Layer: core/ai-mpi-json (pure types, no React/DOM)
 * Allowed imports: none (only TypeScript built-ins)
 *
 * Kontrak (MPI-JSON-SCENE-PROOF-01):
 *   Type definitions untuk AI-generated MPI JSON blueprint.
 *   AI JSON = format input eksternal. SimpleProject = format internal app.
 *   Converter (ai-mpi-json-to-project.ts) menjembatani keduanya.
 *
 *   Prinsip:
 *     - Pure types, no runtime code, no DOM, no React.
 *     - Tidak mengubah schema SimpleProject existing.
 *     - Preserve scene intent (role, scene, briefing, missionTarget, reward).
 *     - Minimal contract: cukup untuk proof-of-concept game-mission scene.
 *
 *   Struktur AI JSON:
 *     - metadata: title, subject, grade, phase, topic, cp, objectives
 *     - styleId: style pack ID (modern-clean / soft-classroom / mission-dark)
 *     - pages: array of AiMpiPage
 *       - role: cover/material/game/quiz/closing/free
 *       - scene: scene type (e.g. "game-mission" untuk game page)
 *       - blocks: array of AiMpiBlock (text/card/game/quiz)
 *
 *   Game block khusus punya:
 *     - briefing: narasi pembuka misi
 *     - missionTarget: target misi
 *     - actions: array of { id, label, result, feedback }
 *     - reward: { type, label }
 */

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export type AiMpiMetadata = {
  title: string;
  subject?: string;
  grade?: string;
  phase?: string;
  topic?: string;
  cp?: string;
  objectives?: string[];
};

// ---------------------------------------------------------------------------
// Block — discriminated union on `type`
// ---------------------------------------------------------------------------

export type AiMpiTextBlock = {
  type: 'text';
  variant: 'title' | 'subtitle' | 'body' | 'instruction';
  text: string;
};

export type AiMpiCardBlock = {
  type: 'card';
  variant: 'info-card' | 'important-note';
  title?: string;
  body: string;
};

export type AiMpiGameAction = {
  id: string;
  label: string;
  result: 'correct' | 'wrong';
  feedback: string;
};

export type AiMpiGameReward = {
  type: string;
  label: string;
};

export type AiMpiGameBlock = {
  type: 'game';
  variant: 'mission-choice';
  title: string;
  briefing: string;
  missionTarget: string;
  actions: AiMpiGameAction[];
  reward: AiMpiGameReward;
};

export type AiMpiQuizBlock = {
  type: 'quiz';
  variant: 'multiple-choice' | 'true-false';
  title: string;
  prompt: string;
  choices: { id: string; text: string }[];
  correctChoiceId: string;
  feedbackCorrect: string;
  feedbackWrong: string;
};

export type AiMpiBlock =
  | AiMpiTextBlock
  | AiMpiCardBlock
  | AiMpiGameBlock
  | AiMpiQuizBlock;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export type AiMpiPage = {
  id: string;
  role: 'cover' | 'material' | 'game' | 'quiz' | 'closing' | 'free';
  scene?: string;
  title: string;
  blocks: AiMpiBlock[];
};

// ---------------------------------------------------------------------------
// Root AI MPI JSON
// ---------------------------------------------------------------------------

export type AiMpiJson = {
  version: number;
  metadata: AiMpiMetadata;
  styleId?: string;
  pages: AiMpiPage[];
};

// ---------------------------------------------------------------------------
// Scene type constants
// ---------------------------------------------------------------------------

export const AI_MPI_SCENE_GAME_MISSION = 'game-mission' as const;
export const AI_MPI_SCENE_COVER_HERO = 'cover-hero' as const;
export const AI_MPI_SCENE_MATERIAL_BRIEF = 'material-brief' as const;
export const AI_MPI_SCENE_QUIZ_CHECK = 'quiz-check' as const;
export const AI_MPI_SCENE_CLOSING_THANKS = 'closing-thanks' as const;

export type AiMpiScene =
  | typeof AI_MPI_SCENE_GAME_MISSION
  | typeof AI_MPI_SCENE_COVER_HERO
  | typeof AI_MPI_SCENE_MATERIAL_BRIEF
  | typeof AI_MPI_SCENE_QUIZ_CHECK
  | typeof AI_MPI_SCENE_CLOSING_THANKS
  | string;
