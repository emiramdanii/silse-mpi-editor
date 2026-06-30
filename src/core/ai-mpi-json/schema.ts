/**
 * AI MPI JSON Blueprint Schema (AI-MPI-JSON-BLUEPRINT-01).
 *
 * Layer: core/ai-mpi-json (pure types, no React/DOM)
 * Allowed imports: none
 *
 * Kontrak:
 *   Schema JSON resmi yang boleh dihasilkan AI. Kaya, bukan datar.
 *   Wajib membawa: metadata, curriculum, styleIntent, designSystem, flow,
 *   scenes, scene slots, placements, assets, runtime, exportConfig.
 *
 *   Prinsip:
 *     - Pure types, no runtime code.
 *     - Tidak hanya title/content/questions (bukan flat).
 *     - Setiap scene punya sceneType + slots.
 *     - Setiap slot punya placement + content.
 *     - Style intent + design system wajib (bukan hardcoded).
 *     - Feedback + reward wajib untuk game/quiz.
 *
 *   File ini adalah versi foundation (lebih kaya dari proof-of-concept
 *   di ai-mpi-json-schema.ts yang lama).
 */

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export type AiBlueprintMetadata = {
  title: string;
  subtitle?: string;
  author?: string;
  createdAt?: string;
};

export type AiBlueprintCurriculumObjective = {
  id: string;
  text: string;
};

export type AiBlueprintCurriculum = {
  subject: string;
  grade: string;
  phase: string;
  topic: string;
  cp?: string;
  objectives: AiBlueprintCurriculumObjective[];
};

// ---------------------------------------------------------------------------
// Style Intent + Design System
// ---------------------------------------------------------------------------

export type AiBlueprintStyleIntent = {
  styleId: string; // "modern-clean" | "soft-classroom" | "mission-dark"
  mood?: string; // "clean" | "soft" | "mission"
  intent?: string;
};

export type AiBlueprintDesignSystem = {
  contractId: string; // reference ke design contract
  paletteName?: string;
  typographyName?: string;
  overrides?: Record<string, string | number | boolean>;
};

// ---------------------------------------------------------------------------
// Flow
// ---------------------------------------------------------------------------

export type AiBlueprintFlowStep = {
  sceneId: string;
  label?: string;
};

export type AiBlueprintFlow = {
  steps: AiBlueprintFlowStep[];
  mode?: 'linear' | 'branching';
};

// ---------------------------------------------------------------------------
// Placement
// ---------------------------------------------------------------------------

export type AiBlueprintPlacement = {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;
  slot?: string;
  anchor?: string;
  align?: string;
  grid?: { row: number; col: number; rowSpan?: number; colSpan?: number };
};

// ---------------------------------------------------------------------------
// Slot Content (rich, bukan flat)
// ---------------------------------------------------------------------------

export type AiBlueprintGameAction = {
  id: string;
  label: string;
  result: 'correct' | 'wrong';
  feedback: string;
};

export type AiBlueprintReward = {
  type: string; // "badge" | "medal" | "ribbon"
  label: string;
  icon?: string;
};

export type AiBlueprintSlotContent =
  | { kind: 'text'; variant: string; text: string }
  | { kind: 'card'; variant: string; title?: string; body: string; icon?: string }
  | { kind: 'image'; src: string; alt?: string; objectFit?: 'cover' | 'contain' }
  | { kind: 'button'; variant: string; label: string; action: string; targetSceneId?: string }
  | { kind: 'badge'; variant: string; label: string; icon?: string }
  | {
      kind: 'game-mission';
      briefing: string;
      missionTarget: string;
      actions: AiBlueprintGameAction[];
      reward: AiBlueprintReward;
    }
  | {
      kind: 'quiz-question';
      prompt: string;
      choices: { id: string; text: string }[];
      correctChoiceId: string;
      feedbackCorrect: string;
      feedbackWrong: string;
    }
  | { kind: 'feedback'; variant: 'correct' | 'wrong' | 'neutral' | 'warning'; text: string; icon?: string }
  | { kind: 'reward'; type: string; label: string; icon?: string }
  | { kind: 'navigation'; variant: string; buttons: { label: string; action: string; targetSceneId?: string }[] };

// ---------------------------------------------------------------------------
// Slot
// ---------------------------------------------------------------------------

export type AiBlueprintSlot = {
  id: string;
  role: string;
  placement: AiBlueprintPlacement;
  designTokenKey?: string;
  content: AiBlueprintSlotContent;
};

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

export type AiBlueprintSceneType =
  | 'cover-hero'
  | 'guide-panel'
  | 'objectives-path'
  | 'starter-question'
  | 'learning-scene'
  | 'mission-map'
  | 'game-mission'
  | 'quiz-challenge'
  | 'reflection-journal'
  | 'closing-award';

export type AiBlueprintSceneRole =
  | 'cover'
  | 'guide'
  | 'objectives'
  | 'starter'
  | 'material'
  | 'mission-map'
  | 'game'
  | 'quiz'
  | 'reflection'
  | 'closing';

export type AiBlueprintSceneNavigation = {
  nextSceneId?: string;
  prevSceneId?: string;
  customButtons?: { label: string; action: string; targetSceneId?: string; designTokenKey?: string }[];
};

export type AiBlueprintScene = {
  id: string;
  role: AiBlueprintSceneRole;
  sceneType: AiBlueprintSceneType;
  title: string;
  slots: AiBlueprintSlot[];
  navigation?: AiBlueprintSceneNavigation;
};

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------

export type AiBlueprintAsset = {
  id: string;
  type: 'image' | 'audio' | 'video';
  src: string;
  alt?: string;
  usedBySlotId?: string;
};

// ---------------------------------------------------------------------------
// Runtime + Export
// ---------------------------------------------------------------------------

export type AiBlueprintRuntime = {
  showProgress?: boolean;
  showScore?: boolean;
};

export type AiBlueprintExportConfig = {
  format: 'html-standalone';
  embedAssets?: boolean;
  includeToolbar?: boolean;
  stageWidth?: number;
  stageHeight?: number;
};

// ---------------------------------------------------------------------------
// Root: AiMpiBlueprint
// ---------------------------------------------------------------------------

export type AiMpiBlueprint = {
  version: number;
  metadata: AiBlueprintMetadata;
  curriculum?: AiBlueprintCurriculum;
  styleIntent: AiBlueprintStyleIntent;
  designSystem: AiBlueprintDesignSystem;
  flow: AiBlueprintFlow;
  scenes: AiBlueprintScene[];
  assets: AiBlueprintAsset[];
  runtime: AiBlueprintRuntime;
  exportConfig: AiBlueprintExportConfig;
};
