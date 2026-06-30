/**
 * MPI Capability Contracts (FOUNDATION-FINAL-LOCK-01 PATCH A).
 *
 * Layer: core/mpi-container (pure types, no React/DOM)
 * Allowed imports: none
 *
 * Kontrak:
 *   Type definitions untuk runtime, assessment, asset, accessibility,
 *   export, dan navigation capabilities. Tidak semua diimplementasi penuh
 *   sekarang, tetapi semua punya tempat resmi di schema.
 *
 *   Prinsip:
 *     - Pure types, no runtime code.
 *     - Jangan biarkan runtime menjadi variabel JS bebas tanpa kontrak.
 *     - Setiap kontrak wajib punya field minimal.
 */

// ===========================================================================
// D. Runtime Capability Contract
// ===========================================================================

export type MpiRuntimeCapability = {
  progress?: { currentSceneId: string; completedSceneIds: string[]; showProgress: boolean };
  score?: { total: number; maxPossible: number; showScore: boolean };
  timer?: { enabled: boolean; durationSec: number; autoAdvance: boolean };
  attempts?: { maxAttempts: number; currentAttempt: number; allowRetry: boolean };
  completionStatus?: 'not-started' | 'in-progress' | 'completed' | 'passed' | 'failed';
  savedResponses?: Record<string, unknown>;
  studentNotes?: string;
  reflectionAnswers?: string[];
  portfolioEntries?: { id: string; type: string; content: string }[];
  branchingPath?: string[];
  randomizedQuestions?: boolean;
  feedbackHistory?: { sceneId: string; questionId: string; selectedChoiceId: string; isCorrect: boolean; timestamp: string }[];
  rewardState?: { earnedBadges: string[]; totalStars: number };
  resetState?: { allowReset: boolean; resetScope: 'scene' | 'module' | 'all' };
  teacherModeVisibility?: boolean;
  accessibilitySettings?: MpiAccessibilityContract;
};

// ===========================================================================
// E1. Assessment Capability Contract
// ===========================================================================

export type MpiAssessmentType =
  | 'diagnostic'
  | 'formative'
  | 'summative'
  | 'self-reflection'
  | 'peer-discussion'
  | 'portfolio'
  | 'rubric-based-task'
  | 'remedial-retry'
  | 'enrichment-challenge';

export type MpiScoringMode = 'points' | 'stars' | 'badge' | 'percentage' | 'rubric' | 'pass-fail';

export type MpiFeedbackMode = 'immediate' | 'delayed' | 'end-of-scene' | 'end-of-module' | 'none';

export type MpiAssessmentContract = {
  assessmentType: MpiAssessmentType;
  items: { id: string; sceneId: string; points: number }[];
  scoringMode: MpiScoringMode;
  feedbackMode: MpiFeedbackMode;
  attemptLimit?: number;
  passingRule?: { minScore: number; minPercentage?: number };
  remedialTarget?: string;
  enrichmentTarget?: string;
};

// ===========================================================================
// E2. Asset Capability Contract
// ===========================================================================

export type MpiAssetType =
  | 'image'
  | 'icon'
  | 'illustration'
  | 'background-image'
  | 'audio'
  | 'video'
  | 'animation-preset'
  | 'font-token';

export type MpiAssetContract = {
  assetId: string;
  type: MpiAssetType;
  src: string;
  alt?: string;
  caption?: string;
  license?: string;
  slot?: string;
  objectFit?: 'cover' | 'contain';
  fallback?: string;
};

// ===========================================================================
// E3. Accessibility Capability Contract
// ===========================================================================

export type MpiAccessibilityContract = {
  altText?: string;
  ariaLabel?: string;
  keyboardNavigation?: boolean;
  focusOrder?: number[];
  contrastLevel?: 'normal' | 'high' | 'maximum';
  reducedMotion?: boolean;
  fontScale?: number;
  readAloudSupport?: boolean;
  captionSubtitle?: boolean;
  touchTargetSize?: number;
};

// ===========================================================================
// E4. Export Capability Contract
// ===========================================================================

export type MpiExportMode = 'standalone-html' | 'lms-package' | 'print-pdf' | 'embed-iframe';

export type MpiExportContract = {
  exportMode: MpiExportMode;
  assetMode: 'embed-base64' | 'external-url' | 'cdn';
  includeTeacherGuide?: boolean;
  includeStudentResponses?: boolean;
  offlineMode?: boolean;
  printMode?: boolean;
  fullscreenMode?: boolean;
  mobileFallback?: boolean;
};

// ===========================================================================
// E5. Navigation Capability Contract
// ===========================================================================

export type MpiNavigationType = 'linear' | 'branching' | 'free-roam' | 'conditional';

export type MpiNavigationLink = {
  fromSceneId: string;
  toSceneId: string;
  condition?: string;
  label?: string;
  navigationType: MpiNavigationType;
  locked?: boolean;
  completed?: boolean;
  retryTarget?: boolean;
  optional?: boolean;
};

export type MpiNavigationContract = {
  links: MpiNavigationLink[];
  defaultMode: MpiNavigationType;
};
