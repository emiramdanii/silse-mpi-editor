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

export type AiBlueprintDesignSystemOverrides = {
  typography?: {
    fontFamily?: string;
    headingFontFamily?: string;
    fontSizeBase?: number;
    lineHeightBase?: number;
  };
  colors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
    accent?: string;
    success?: string;
    warning?: string;
    error?: string;
  };
  spacing?: {
    unit?: number;
    scale?: number;
  };
  radius?: {
    default?: number;
    large?: number;
    small?: number;
  };
  shadow?: {
    default?: string;
    large?: string;
  };
};

export type AiBlueprintDesignSystem = {
  contractId: string; // reference ke design contract
  paletteName?: string;
  typographyName?: string;
  overrides?: AiBlueprintDesignSystemOverrides;
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
  | { kind: 'feedback'; variant: 'correct' | 'wrong' | 'neutral' | 'warning'; text: string; icon?: string }
  | {
      kind: 'cover-hero';
      kicker?: string;
      heroTitle: string;
      heroSubtitle?: string;
      badges?: string[];
      primaryAction?: { label: string; action: string };
      visualAnchor?: string;
    }
  | {
      kind: 'closing-award';
      achievement?: string;
      summary?: string;
      reflectionPrompt?: string;
      rewardLabel?: string;
      rewardIcon?: string;
      nextLearning?: string;
      finalAction?: { label: string; action: string };
    }
  | { kind: 'reward'; type: string; label: string; icon?: string }
  | { kind: 'navigation'; variant: string; buttons: { label: string; action: string; targetSceneId?: string }[] }
  // GOLDEN-REFERENCE-GAME-P1: classification-game content kind
  | {
      kind: 'classification-game';
      instruction?: string;
      items?: { id: string; label: string; correctCategory: string }[];
      categories?: string[];
      scorePerItem?: number;
      feedback?: string;
      completionMessage?: string;
    }
  // TEMPLATE-PEDAGOGIS-READY-02: schema sync — all content kinds now in blueprint schema
  | { kind: 'curriculum-guide'; curriculumTitle?: string; competency?: string; learningFlow?: string; profileTags?: string[] }
  | { kind: 'objectives-path'; objectiveList?: string[]; successCriteria?: string; activityPath?: string[] }
  | { kind: 'starter-review'; priorLearning?: string; triggerQuestion?: string; bridgeToNewTopic?: string; discussionPrompt?: string }
  | { kind: 'discussion-scene'; discussionPrompt?: string; groupInstruction?: string; responseInput?: string }
  | { kind: 'case-analysis'; caseText?: string; analysisPrompt?: string; revealExplanation?: string; discussionPrompt?: string }
  | { kind: 'result-summary'; scoreSummary?: { score: number; maxScore: number }; achievementLevel?: string; breakdown?: { label: string; value: string }[]; reviewCards?: { title: string; body: string }[] }
  | { kind: 'reflection-journal'; reflectionPrompts?: string[]; commitmentInput?: string; portfolioSummary?: { label: string; value: string }[]; nextTask?: string }
  | { kind: 'hotspot-map'; backgroundVisual?: string; guidingQuestion?: string; hotspots?: { id: string; x: number; y: number; label: string; info: string }[]; caption?: string }
  | { kind: 'matching-game'; instruction?: string; leftItems?: { id: string; label: string }[]; rightItems?: { id: string; label: string }[]; correctPairs?: { leftId: string; rightId: string }[]; scorePerPair?: number; completionMessage?: string }
  | { kind: 'sequencing-game'; instruction?: string; items?: { id: string; label: string }[]; correctOrder?: string[]; scorePerItem?: number; completionMessage?: string }
  | { kind: 'media-focus'; mediaAsset?: { src: string; alt?: string; objectFit?: 'cover' | 'contain' }; guidingQuestion?: string; caption?: string; responseInput?: string }
  | { kind: 'diagnostic-check'; diagnosticPrompt?: string; questionSet?: { id: string; prompt: string; choices: { id: string; text: string }[]; correctChoiceId: string }[]; recommendation?: string; readinessLevels?: { level: string; minScore: number; description: string }[] }
  | { kind: 'remedial-practice'; misconception?: string; reteachExplanation?: string; guidedPractice?: { id: string; prompt: string; choices: { id: string; text: string }[]; correctChoiceId: string; hint?: string }[]; retryQuestion?: string }
  | { kind: 'enrichment-challenge'; challengeContext?: string; advancedTask?: string; responseInput?: string; rubricPreview?: { criterion: string; descriptor: string }[]; completionMessage?: string }
  | { kind: 'worksheet-activity'; instruction?: string; taskSteps?: { id: string; prompt: string; responsePlaceholder?: string }[]; inputFields?: { id: string; label: string; placeholder?: string }[] }
  | { kind: 'rubric-panel'; criteria?: { id: string; name: string; description: string }[]; levels?: { id: string; name: string; score: number; descriptor: string }[]; scoreGuide?: string }
  | { kind: 'timeline-story'; title?: string; events?: { id: string; label: string; description: string }[]; checkpointQuestion?: string; checkpointAnswer?: string }
  | { kind: 'branching-scenario'; scenarioPrompt?: string; choices?: { id: string; label: string; consequence: string; isCorrect?: boolean }[]; resetLabel?: string }
  | { kind: 'glossary-cards'; title?: string; terms?: { id: string; term: string; definition: string; example?: string }[] }
  | { kind: 'teacher-guide'; title?: string; teacherInstruction?: string; facilitationTips?: string[]; timeAllocation?: string; assessmentNotes?: string }
  | { kind: 'accessibility-help'; title?: string; readingGuide?: string; keyboardGuide?: string; contrastOption?: string };

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
  | 'closing-award'
  // TEMPLATE-PEDAGOGIS-READY-02: schema sync — all 27 scene types
  | 'curriculum-guide'
  | 'starter-review'
  | 'discussion-scene'
  | 'case-analysis'
  | 'result-summary'
  | 'classification-game'
  | 'hotspot-map'
  | 'matching-game'
  | 'sequencing-game'
  | 'media-focus'
  | 'diagnostic-check'
  | 'remedial-practice'
  | 'enrichment-challenge'
  | 'worksheet-activity'
  | 'rubric-panel'
  | 'timeline-story'
  | 'branching-scenario'
  | 'glossary-cards'
  | 'teacher-guide'
  | 'accessibility-help';

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
  | 'closing'
  | 'activity'; // TEMPLATE-PEDAGOGIS-READY-02: used by classification/sequencing/matching games

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
