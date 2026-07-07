/**
 * Core types for silse-mpi-editor.
 *
 * Layer: core
 * Allowed imports: none (only TypeScript built-ins)
 *
 * These types are the single source of truth for project data.
 * Do not import from store/editor/components/preview/export.
 *
 * NAMING CONVENTION (Batch 2R):
 *   - Internal type names use "Component" (TextComponent, PageComponent).
 *   - UI product-facing text MUST use "elemen" / "komponen", NOT "block".
 *   - "Block" is a legacy term from M2 v1/v2 and is forbidden in user-facing
 *     strings. Internal code may still reference it in comments for historical
 *     context, but type names and field names use "component".
 */

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------

export const PROJECT_VERSION = 1 as const;

export type CurriculumObjective = {
  id: string;
  text: string;
};

export type Curriculum = {
  subject: string;
  grade: string;
  phase: string;
  topic: string;
  cp?: string;
  objectives: CurriculumObjective[];
};

export type SimpleProject = {
  id: string;
  title: string;
  version: typeof PROJECT_VERSION;
  pages: SimplePage[];
  currentPageId: string;
  /**
   * Style pack reference + inline tokens (Batch 2S).
   */
  stylePackId?: string;
  style?: import('./style-types').ProjectStyle;
  /**
   * Curriculum metadata (Batch 11B Patch).
   * Wajib untuk MPI standar: subject, grade, phase, topic, objectives.
   */
  curriculum?: Curriculum;
  /**
   * CORE-MPI-UX-FOUNDATION-01: Assets preserved from AiMpiBlueprint bridge.
   * Images/audio/video referenced by slot content via src URL.
   */
  assets?: Array<{ id: string; type: 'image' | 'audio' | 'video'; src: string; alt?: string }>;
  /**
   * UX-03: Flag bahwa project memiliki style override dari AI.
   * Set true saat import dari AI dengan designSystem.overrides.
   * Cleared saat user manually changes style pack.
   */
  hasAiStyleOverrides?: boolean;
};

// ---------------------------------------------------------------------------
// Page Role — peran pedagogis halaman
// (lihat docs/CORE_PRODUCT_CONTRACT.md section 4 "Kontrak Struktur Pembelajaran")
// ---------------------------------------------------------------------------

export const PAGE_ROLES = [
  'cover',
  'guide',
  'menu',
  'learningObjectives',
  'starter',
  'material',
  'activity',
  'quiz',
  'reflection',
  'closing',
  'free',
] as const;

export type PageRole = (typeof PAGE_ROLES)[number];

// ---------------------------------------------------------------------------
// LayoutId — placeholder for layout recipe (M3 scope)
// (lihat docs/ROADMAP.md M3 "Page Flow + LayoutId Dasar")
//
// LayoutId adalah string ringan yang menandai layout recipe halaman.
// BUKAN full layout engine — engine konkret datang di M4 (recipes) dan
// M9 (layout guard). Untuk M3, layoutId hanya metadata yang divalidasi
// string non-empty dan salah satu dari LAYOUT_IDS.
// ---------------------------------------------------------------------------

export const LAYOUT_IDS = [
  'blank',
  'coverCentered',
  'singleColumn',
  // LAYOUT-PRESET-SYSTEM-V1: 8 layout presets (non-breaking addition)
  'cover-centered',
  'cover-split',
  'material-two-column',
  'material-card-stack',
  'quiz-focus',
  'reflection-calm',
  'mission-map',
  'closing-centered',
] as const;

export type LayoutId = (typeof LAYOUT_IDS)[number];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export type PageBackground =
  | { type: 'color'; color: string }
  | { type: 'gradient'; gradient: string }
  | { type: 'image'; imageSrc: string };

export type SimplePage = {
  id: string;
  title: string;
  /** Peran pedagogis halaman. Wajib. Menentukan capability (komponen apa yang boleh ditambah). */
  role: PageRole;
  /**
   * Layout recipe placeholder (M3). String ringan, bukan full layout engine.
   * Default by PageRole (lihat core/layout-defaults.ts).
   * Engine konkret datang di M4 (recipes) dan M9 (layout guard).
   */
  layoutId: LayoutId;
  background: PageBackground;
  /** Elemen pembelajaran di halaman. Naming internal "components"; UI memakai "elemen". */
  components: PageComponent[];
  /**
   * BASELINE-SYNC: Optional scene type override (from AiMpiBlueprint bridge).
   * When set, simpleProjectToMpiContainer uses this sceneType instead of the
   * default role-based mapping. isPageSceneRenderable returns true.
   */
  sceneType?: string;
  /** BASELINE-SYNC: Optional scene slot content (used when sceneType override is set). */
  sceneContent?: unknown;
  /** BASELINE-SYNC: Optional scene slot placement (used when sceneType override is set). */
  scenePlacement?: { x: number; y: number; width: number; height: number; zIndex?: number };
  /** BASELINE-SYNC: Optional scene slot role (used when sceneType override is set). */
  sceneSlotRole?: string;
  /** CUSTOM-STYLE-01: Custom CSS from AI for visual enhancement */
  sceneCustomStyle?: Record<string, Record<string, string>>;
};

// ---------------------------------------------------------------------------
// Component Variant — peran visual-pedagogis komponen
// (lihat docs/CORE_PRODUCT_CONTRACT.md section 5 "Kontrak Block Variant")
// ---------------------------------------------------------------------------

/**
 * Variant untuk text component.
 * Variant adalah anchor untuk style adapter (M6) — sebelum M6, render
 * memakai lookup hard-coded minimal berdasarkan variant.
 *
 * Variant BUKAN field style manual. Field style manual (fontSize/color/dll)
 * sebagai override lokal baru datang di M6/M11 via style adapter.
 */
export const TEXT_COMPONENT_VARIANTS = [
  'title',
  'subtitle',
  'body',
  'instruction',
  'importantNote',
  'questionPrompt',
  'reflectionBox',
] as const;

export type TextComponentVariant = (typeof TEXT_COMPONENT_VARIANTS)[number];

// ---------------------------------------------------------------------------
// Image Component Variant (M4)
// ---------------------------------------------------------------------------

export const IMAGE_COMPONENT_VARIANTS = [
  'illustration',
  'background',
  'imageCard',
] as const;

export type ImageComponentVariant = (typeof IMAGE_COMPONENT_VARIANTS)[number];

// ---------------------------------------------------------------------------
// Card Component Variant (M4)
//
// Catatan konsep (Batch 4 dari senior):
//   Card di M4 = elemen pembelajaran sederhana (title + body + variant + geometry).
//   BUKAN nested container yang berisi elemen lain.
//   Nested container / component pattern baru di M11/M12.
// ---------------------------------------------------------------------------

export const CARD_COMPONENT_VARIANTS = [
  'infoCard',
  'importantNote',
  'exampleCard',
] as const;

export type CardComponentVariant = (typeof CARD_COMPONENT_VARIANTS)[number];

// ---------------------------------------------------------------------------
// Navigation Component Variant (M5)
// ---------------------------------------------------------------------------

export const NAVIGATION_COMPONENT_VARIANTS = [
  'navigation',
  'primaryAction',
  'secondaryAction',
  'choice',
] as const;

export type NavigationComponentVariant = (typeof NAVIGATION_COMPONENT_VARIANTS)[number];

// ---------------------------------------------------------------------------
// Navigation Action (M5)
// ---------------------------------------------------------------------------

export const NAVIGATION_ACTIONS = ['next', 'prev', 'goto'] as const;

export type NavigationAction = (typeof NAVIGATION_ACTIONS)[number];

// ---------------------------------------------------------------------------
// Component — discriminated union on `type`
// ---------------------------------------------------------------------------

export type BaseComponent = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Text component (M2 scope).
 *
 * Data component sengaja minimal: text content + geometry + variant.
 * Field style manual (fontSize/color/fontWeight/align) TIDAK ada di M2 —
 * style datang dari variant via style adapter (M6) atau lookup minimal
 * hard-coded (sebelum M6). Ini konsisten dengan kontrak Batch 1B + 2R.
 */
/**
 * Scene metadata untuk TextComponent (FOUNDATION-FINAL-LOCK-01 cover-hero).
 */
export type CoverSceneMetadata = {
  scene: string; // 'cover-hero'
  kicker?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  badges?: string[];
  primaryAction?: { label: string; action: string };
  visualAnchor?: string;
};

export type TextComponent = BaseComponent & {
  type: 'text';
  text: string;
  variant: TextComponentVariant;
  /** FOUNDATION-FINAL-LOCK-01: Optional scene metadata for cover-hero. */
  sceneMetadata?: CoverSceneMetadata;
};

/**
 * Image component (M4 scope).
 *
 * Data: variant + src + alt + objectFit + geometry.
 * Variant wajib (anchor untuk style adapter M6).
 * src wajib (data URL/base64 untuk local-first, atau URL absolut).
 */
export type ImageComponent = BaseComponent & {
  type: 'image';
  variant: ImageComponentVariant;
  src: string;
  alt?: string;
  objectFit: 'cover' | 'contain';
};

/**
 * Card component (M4 scope).
 *
 * Elemen pembelajaran sederhana: title (opsional) + body + variant + geometry.
 * BUKAN nested container — tidak berisi komponen lain.
 * Style datang dari variant via style adapter (M6).
 */
/**
 * Scene metadata untuk CardComponent (MATERIAL-SCENE-PROOF-01).
 *
 * Optional field. Jika ada, page dengan card ini bisa dirender sebagai "learning scene"
 * (concept header + explanation panel + example cards + key point + student action),
 * bukan card teks biasa.
 *
 * CardComponent dengan sceneMetadata berperan sebagai "anchor" untuk learning scene.
 * Component lain di page yang sama (text, card lain, navigation) menjadi slot pendukung.
 */
export type MaterialSceneMetadata = {
  scene: string; // 'learning-scene'
  conceptTitle?: string;
  conceptSubtitle?: string;
  explanation?: string;
  examples?: { id: string; title: string; body: string }[];
  keyPoints?: string[];
  studentAction?: string;
  visualHint?: string;
};

/**
 * Scene metadata untuk CardComponent (FOUNDATION-FINAL-LOCK-01 closing-award).
 */
export type ClosingSceneMetadata = {
  scene: string; // 'closing-award'
  achievement?: string;
  summary?: string;
  reflectionPrompt?: string;
  rewardLabel?: string;
  rewardIcon?: string;
  nextLearning?: string;
  finalAction?: { label: string; action: string };
};

/** Union of all scene metadata types that CardComponent can carry. */
export type CardSceneMetadata = MaterialSceneMetadata | ClosingSceneMetadata;

export type CardComponent = BaseComponent & {
  type: 'card';
  variant: CardComponentVariant;
  title?: string;
  body: string;
  /**
   * Optional scene metadata (learning-scene or closing-award).
   */
  sceneMetadata?: CardSceneMetadata;
};

/**
 * Navigation component (M5 scope).
 *
 * Elemen interaktif untuk navigasi antar halaman di preview mode.
 * Variant wajib (anchor untuk style adapter M6).
 * Action: next/prev/goto. targetPageId wajib jika action='goto'.
 */
export type NavigationComponent = BaseComponent & {
  type: 'navigation';
  variant: NavigationComponentVariant;
  label: string;
  action: NavigationAction;
  targetPageId?: string;
};

/**
 * Union of all component types.
 * M2: TextComponent. M4: ImageComponent + CardComponent. M5: NavigationComponent. M11: Question.
 */
export type PageComponent =
  | TextComponent
  | ImageComponent
  | CardComponent
  | NavigationComponent
  | QuestionComponent
  | GameComponent
  | LayeredInfoComponent
  | LearningBridgeComponent;

// ---------------------------------------------------------------------------
// Component type literals — exported as constants for runtime guards
// ---------------------------------------------------------------------------

export const COMPONENT_TYPES = ['text', 'image', 'card', 'navigation', 'question', 'game', 'layered-info', 'learning-bridge'] as const;
export type ComponentType = (typeof COMPONENT_TYPES)[number];

// ---------------------------------------------------------------------------
// Game Component (M11A)
// ---------------------------------------------------------------------------

export const GAME_TYPES = ['missionQuiz'] as const;
export type GameType = (typeof GAME_TYPES)[number];

export type GameMission = {
  id: string;
  title: string;
  prompt: string;
  choices: QuestionChoice[];
  correctChoiceIndex: number;
  feedbackCorrect: string;
  feedbackWrong: string;
  points: number;
};

/**
 * Scene metadata untuk GameComponent (MPI-JSON-SCENE-PROOF-01).
 *
 * Optional field. Jika ada, GameComponentView akan render sebagai "scene misi"
 * (briefing + target + action cards + feedback + reward), bukan list pertanyaan.
 *
 * Dipakai oleh AI JSON converter untuk preserve scene intent dari AI blueprint
 * tanpa mengubah schema existing (field wajib GameComponent tidak berubah).
 *
 * Scene intent yang di-preserve:
 *   - scene: jenis scene (e.g. "game-mission")
 *   - briefing: narasi pembuka misi
 *   - missionTarget: target yang harus dicapai siswa
 *   - reward: { type, label } — lencana/hadiah yang didapat setelah selesai
 */
export type GameSceneMetadata = {
  scene: string;
  briefing?: string;
  missionTarget?: string;
  reward?: {
    type: string;
    label: string;
  };
};

export type GameComponent = BaseComponent & {
  type: 'game';
  gameType: GameType;
  title: string;
  instruction: string;
  missions: GameMission[];
  scoringStyle: ScoringStyle;
  /**
   * MPI-JSON-SCENE-PROOF-01: Optional scene metadata.
   * Jika ada, renderer akan tampilkan sebagai scene misi, bukan list pertanyaan.
   */
  sceneMetadata?: GameSceneMetadata;
};

// ---------------------------------------------------------------------------
// Layered Info Component (LXC-02)
//
// Komponen resmi baru dari Learning Experience Contract (LXC-01).
// Sajikan materi dalam lapisan progressive disclosure — siswa buka layer
// demi layer supaya tidak kewalahan dengan info sekaligus.
//
// Applicable roles: material, guide, menu, learningObjectives.
// Variants: accordion, tabs, iconTabs, stepper, cardGrid, timeline.
//
// Runtime state: layer yang terbuka (defaultOpenIndex). Editor hanya edit
// layer aktif, bukan menampilkan semua isi panjang sekaligus.
// ---------------------------------------------------------------------------

export type LayeredInfoLayer = {
  id: string;
  title: string;
  body: string;
  /** Ikon opsional (untuk variant iconTabs). */
  icon?: string;
};

export const LAYERED_INFO_VARIANTS = [
  'accordion',
  'tabs',
  'iconTabs',
  'stepper',
  'cardGrid',
  'timeline',
] as const;

export type LayeredInfoVariant = (typeof LAYERED_INFO_VARIANTS)[number];

export type LayeredInfoComponent = BaseComponent & {
  type: 'layered-info';
  variant: LayeredInfoVariant;
  title: string;
  layers: LayeredInfoLayer[];
  /** Index layer yang terbuka by default. null = semua tertutup (untuk accordion). */
  defaultOpenIndex: number | null;
};

// ---------------------------------------------------------------------------
// Learning Bridge Component (LXC-03)
//
// Komponen resmi dari Learning Experience Contract (LXC-01).
// Penghubung antar scene yang menjelaskan transisi — "kamu sudah selesai X,
// sekarang kita lanjut ke Y karena Z". Mencegah lompatan mendadak.
//
// Applicable roles: starter, material, activity, quiz, reflection,
// learningObjectives, closing.
// Variants: transition, recap, preview.
//
// No runtime state — jembatan adalah komponen statis (tidak interaktif).
// ---------------------------------------------------------------------------

export const LEARNING_BRIDGE_VARIANTS = [
  'transition',
  'recap',
  'preview',
] as const;

export type LearningBridgeVariant = (typeof LEARNING_BRIDGE_VARIANTS)[number];

export type LearningBridgeComponent = BaseComponent & {
  type: 'learning-bridge';
  variant: LearningBridgeVariant;
  title: string;
  message: string;
  nextButtonLabel: string;
};

// ---------------------------------------------------------------------------
// Question Component (M10)
// ---------------------------------------------------------------------------

export const QUESTION_COMPONENT_VARIANTS = [
  'multipleChoice',
  'trueFalse',
] as const;

export type QuestionComponentVariant = (typeof QUESTION_COMPONENT_VARIANTS)[number];

export const SCORING_STYLES = [
  'points',
  'stars',
  'badge',
] as const;

export type ScoringStyle = (typeof SCORING_STYLES)[number];

export type QuestionChoice = {
  id: string;
  text: string;
};

/**
 * Scene metadata untuk QuestionComponent (QUIZ-SCENE-PROOF-01).
 *
 * Optional field. Jika ada, QuestionComponentView akan render sebagai "challenge scene"
 * (challenge header + question focus + answer cards + feedback + progress),
 * bukan form pilihan biasa.
 *
 * Sama seperti GameSceneMetadata, scene intent di-preserve dari AI blueprint.
 */
export type QuizSceneMetadata = {
  scene: string; // 'quiz-challenge'
  challengeTitle?: string;
  challengeSubtitle?: string;
};

export type QuestionComponent = BaseComponent & {
  type: 'question';
  variant: QuestionComponentVariant;
  title: string;
  prompt: string;
  choices: QuestionChoice[];
  correctChoiceIndex: number;
  feedbackCorrect: string;
  feedbackWrong: string;
  points: number;
  scoringStyle: ScoringStyle;
  /**
   * QUIZ-SCENE-PROOF-01: Optional scene metadata.
   * Jika ada, renderer akan tampilkan sebagai challenge scene, bukan form pilihan biasa.
   */
  sceneMetadata?: QuizSceneMetadata;
};
