/**
 * MPI Full Container Types (MPI-FULL-CONTAINER-01).
 *
 * Layer: core/mpi-container (pure types, no React/DOM)
 * Allowed imports: none (only TypeScript built-ins)
 *
 * Kontrak (MPI-FULL-CONTAINER-01):
 *   Container internal untuk satu MPI utuh. Menyimpan semua data yang
 *   dibutuhkan untuk render scene: metadata, curriculum, styleIntent,
 *   designSystem, flow, scenes, assets, runtime, exportConfig.
 *
 *   Prinsip:
 *     - Pure types, no runtime code, no DOM, no React.
 *     - Tidak menghapus SimpleProject (container berdampingan).
 *     - Scene punya role + sceneType + slots (bukan flat components[]).
 *     - Slot punya placement (x/y/width/height) + designTokenKey.
 *     - DesignSystem adalah reference ke design contract (Scope 3).
 *
 *   Container TIDAK mengontrol rendering. Container hanya data.
 *   Renderer (Scope 7) yang baca container + design contract.
 */

// ---------------------------------------------------------------------------
// Schema version
// ---------------------------------------------------------------------------

export const MPI_CONTAINER_SCHEMA_VERSION = 1 as const;

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export type MpiMetadata = {
  title: string;
  subtitle?: string;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
};

// ---------------------------------------------------------------------------
// Curriculum
// ---------------------------------------------------------------------------

export type MpiCurriculumObjective = {
  id: string;
  text: string;
};

export type MpiCurriculum = {
  subject: string;
  grade: string;
  phase: string;
  topic: string;
  cp?: string;
  objectives: MpiCurriculumObjective[];
};

// ---------------------------------------------------------------------------
// Style Intent (high-level, AI-friendly)
// ---------------------------------------------------------------------------

export type MpiStyleIntent = {
  /** e.g. "modern-clean" | "soft-classroom" | "mission-dark" | custom */
  styleId: string;
  /** Mood: "clean" | "soft" | "mission" */
  mood?: string;
  /** Free-text intent description (untuk AI, bukan render) */
  intent?: string;
};

// ---------------------------------------------------------------------------
// Design System (reference to design contract tokens)
// ---------------------------------------------------------------------------

export type MpiDesignSystem = {
  /** Reference ke design contract ID (Scope 3). */
  contractId: string;
  /** Override tokens (partial). Key = token path, value = token value. */
  overrides?: Record<string, string | number | boolean>;
  /** Palette name (e.g. "navy-crimson-gold"). */
  paletteName?: string;
  /** Typography name (e.g. "trebuchet-hero"). */
  typographyName?: string;
};

// ---------------------------------------------------------------------------
// Flow (scene order + navigation)
// ---------------------------------------------------------------------------

export type MpiFlowStep = {
  sceneId: string;
  /** Optional label for progress indicator. */
  label?: string;
};

export type MpiFlow = {
  steps: MpiFlowStep[];
  /** Default navigation: linear or branching. */
  mode?: 'linear' | 'branching';
};

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

export type MpiSceneRole =
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

export type MpiSceneType =
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

export type MpiSceneSlotPlacement = {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;
  /** Slot anchor: "top-left" | "center" | "bottom-right" | etc. */
  anchor?: string;
  /** Slot grid position (alternative to x/y for grid layouts). */
  grid?: { row: number; col: number; rowSpan?: number; colSpan?: number };
};

export type MpiSceneSlotContent =
  | { kind: 'text'; variant: string; text: string }
  | { kind: 'card'; variant: string; title?: string; body: string; icon?: string }
  | { kind: 'image'; src: string; alt?: string; objectFit?: 'cover' | 'contain' }
  | { kind: 'button'; variant: string; label: string; action: string; targetSceneId?: string }
  | { kind: 'badge'; variant: string; label: string; icon?: string }
  | {
      kind: 'game-mission';
      briefing: string;
      missionTarget: string;
      actions: { id: string; label: string; result: 'correct' | 'wrong'; feedback: string }[];
      reward: { type: string; label: string };
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
  | {
      kind: 'learning-material';
      conceptTitle: string;
      conceptSubtitle?: string;
      explanation: string;
      examples?: { id: string; title: string; body: string }[];
      keyPoints?: string[];
      studentAction?: string;
      visualHint?: string;
    }
  | { kind: 'navigation'; variant: string; buttons: { label: string; action: string; targetSceneId?: string }[] };

export type MpiSceneSlot = {
  id: string;
  /** Slot role: "briefing" | "target" | "action-grid" | "feedback" | "reward" | etc. */
  role: string;
  placement: MpiSceneSlotPlacement;
  /** Design token key (reference ke design contract). */
  designTokenKey?: string;
  content: MpiSceneSlotContent;
};

export type MpiSceneNavigation = {
  nextSceneId?: string;
  prevSceneId?: string;
  /** Custom navigation buttons (e.g. "Mulai Misi"). */
  customButtons?: { label: string; action: string; targetSceneId?: string; designTokenKey?: string }[];
};

export type MpiScene = {
  id: string;
  /** Reference ke pageId SimpleProject (untuk adapter, optional). */
  pageId?: string;
  role: MpiSceneRole;
  sceneType: MpiSceneType;
  title: string;
  slots: MpiSceneSlot[];
  navigation?: MpiSceneNavigation;
};

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------

export type MpiAsset = {
  id: string;
  type: 'image' | 'audio' | 'video';
  src: string;
  alt?: string;
  /** Slot reference (which slot uses this asset). */
  usedBySlotId?: string;
};

// ---------------------------------------------------------------------------
// Runtime config
// ---------------------------------------------------------------------------

export type MpiRuntimeConfig = {
  /** Current scene ID (runtime state). */
  currentSceneId?: string;
  /** Score tracking. */
  score?: number;
  /** Completed scenes (runtime state). */
  completedSceneIds?: string[];
  /** Whether to show progress indicator. */
  showProgress?: boolean;
  /** Whether to show score. */
  showScore?: boolean;
};

// ---------------------------------------------------------------------------
// Export config
// ---------------------------------------------------------------------------

export type MpiExportConfig = {
  /** Export format: standalone HTML. */
  format: 'html-standalone';
  /** Whether to embed assets as base64. */
  embedAssets?: boolean;
  /** Whether to include toolbar (nav prev/next + score). */
  includeToolbar?: boolean;
  /** Stage dimensions for export. */
  stageWidth?: number;
  stageHeight?: number;
};

// ---------------------------------------------------------------------------
// MpiContainer (root)
// ---------------------------------------------------------------------------

export type MpiContainer = {
  schemaVersion: number;
  sourceKind: 'manual' | 'ai-json' | 'template';
  metadata: MpiMetadata;
  curriculum?: MpiCurriculum;
  styleIntent?: MpiStyleIntent;
  designSystem?: MpiDesignSystem;
  flow: MpiFlow;
  scenes: MpiScene[];
  assets: MpiAsset[];
  runtime: MpiRuntimeConfig;
  exportConfig: MpiExportConfig;
};
