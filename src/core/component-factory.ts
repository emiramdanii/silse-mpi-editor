/**
 * Component factory for silse-mpi-editor.
 *
 * Layer: core
 * Allowed imports: ./types, ./ids, ./capability
 *
 * M2: createTextComponent.
 * M4: createImageComponent + createCardComponent.
 * M5: createNavigationComponent. M11: createQuestionComponent.
 *
 * Kontrak (docs/CORE_PRODUCT_CONTRACT.md section 5 + Batch 2R Scope D):
 *   - Setiap component WAJIB punya field `variant`.
 *   - Default variant text mengikuti PageRole.
 *   - Component tanpa variant = scope leak. Validation akan menolak.
 */

import type {
  CardComponent,
  CardComponentVariant,
  GameComponent,
  GameMission,
  GameType,
  HotspotOverlayComponent,
  HotspotOverlayVariant,
  HotspotPoint,
  ImageComponent,
  ImageComponentVariant,
  InputFieldComponent,
  InputFieldVariant,
  LayeredInfoComponent,
  LayeredInfoLayer,
  LayeredInfoVariant,
  LearningBridgeComponent,
  LearningBridgeVariant,
  NavigationAction,
  NavigationComponent,
  NavigationComponentVariant,
  PageRole,
  QuestionChoice,
  QuestionComponent,
  QuestionComponentVariant,
  ScoringStyle,
  TextComponent,
  TextComponentVariant,
} from './types';
import { createComponentId } from './ids';
import { getDefaultTextVariantForRole } from './capability';

// ---------------------------------------------------------------------------
// Text Component (M2)
// ---------------------------------------------------------------------------

export type TextComponentEditable = Omit<TextComponent, 'id' | 'type'>;

export const DEFAULT_TEXT_COMPONENT: Omit<TextComponentEditable, 'variant'> = {
  text: 'Teks baru',
  x: 100,
  y: 100,
  width: 600,
  height: 80,
};

export function createTextComponent(
  role: PageRole,
  overrides: Partial<TextComponentEditable> = {},
): TextComponent {
  const defaultVariant: TextComponentVariant = getDefaultTextVariantForRole(role);
  return {
    id: createComponentId(),
    type: 'text',
    variant: defaultVariant,
    ...DEFAULT_TEXT_COMPONENT,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Image Component (M4)
// ---------------------------------------------------------------------------

export type ImageComponentEditable = Omit<ImageComponent, 'id' | 'type'>;

export const DEFAULT_IMAGE_VARIANT: ImageComponentVariant = 'illustration';

export const DEFAULT_IMAGE_COMPONENT: Omit<ImageComponentEditable, 'variant' | 'src'> = {
  alt: '',
  objectFit: 'cover',
  x: 200,
  y: 150,
  width: 400,
  height: 300,
};

/**
 * Create a new image component.
 * src wajib (data URL/base64 atau URL absolut).
 * Default variant = 'illustration'.
 */
export function createImageComponent(
  src: string,
  overrides: Partial<ImageComponentEditable> = {},
): ImageComponent {
  return {
    id: createComponentId(),
    type: 'image',
    variant: DEFAULT_IMAGE_VARIANT,
    src,
    ...DEFAULT_IMAGE_COMPONENT,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Card Component (M4)
//
// Catatan: Card = elemen sederhana (title + body + variant + geometry).
// BUKAN nested container.
// ---------------------------------------------------------------------------

export type CardComponentEditable = Omit<CardComponent, 'id' | 'type'>;

export const DEFAULT_CARD_VARIANT: CardComponentVariant = 'infoCard';

export const DEFAULT_CARD_COMPONENT: Omit<CardComponentEditable, 'variant' | 'body'> = {
  title: '',
  x: 150,
  y: 200,
  width: 500,
  height: 200,
};

/**
 * Create a new card component.
 * body wajib (konten utama card).
 * Default variant = 'infoCard'.
 */
export function createCardComponent(
  body: string,
  overrides: Partial<CardComponentEditable> = {},
): CardComponent {
  return {
    id: createComponentId(),
    type: 'card',
    variant: DEFAULT_CARD_VARIANT,
    body,
    ...DEFAULT_CARD_COMPONENT,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Navigation Component (M5)
// ---------------------------------------------------------------------------

export type NavigationComponentEditable = Omit<NavigationComponent, 'id' | 'type'>;

export const DEFAULT_NAVIGATION_VARIANT: NavigationComponentVariant = 'navigation';

export const DEFAULT_NAVIGATION_COMPONENT: Omit<
  NavigationComponentEditable,
  'variant' | 'label' | 'action'
> = {
  x: 900,
  y: 620,
  width: 280,
  height: 60,
};

/**
 * Create a new navigation component.
 * label wajib (teks tombol). action wajib (next/prev/goto).
 * Default variant = 'navigation'.
 * targetPageId wajib jika action='goto' (caller responsibility).
 */
export function createNavigationComponent(
  label: string,
  action: NavigationAction,
  overrides: Partial<NavigationComponentEditable> = {},
): NavigationComponent {
  return {
    id: createComponentId(),
    type: 'navigation',
    variant: DEFAULT_NAVIGATION_VARIANT,
    label,
    action,
    ...DEFAULT_NAVIGATION_COMPONENT,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Question Component (M10)
// ---------------------------------------------------------------------------

export type QuestionComponentEditable = Omit<QuestionComponent, 'id' | 'type'>;

export const DEFAULT_QUESTION_VARIANT: QuestionComponentVariant = 'multipleChoice';
export const DEFAULT_SCORING_STYLE: ScoringStyle = 'points';

export const DEFAULT_QUESTION_COMPONENT: Omit<
  QuestionComponentEditable,
  'variant' | 'title' | 'prompt' | 'choices' | 'correctChoiceIndex' | 'feedbackCorrect' | 'feedbackWrong' | 'points' | 'scoringStyle'
> = {
  x: 100,
  y: 100,
  width: 600,
  height: 400,
};

function defaultChoices(): QuestionChoice[] {
  return [
    { id: createComponentId(), text: 'Pilihan A' },
    { id: createComponentId(), text: 'Pilihan B' },
  ];
}

export function createQuestionComponent(
  overrides: Partial<QuestionComponentEditable> = {},
): QuestionComponent {
  return {
    id: createComponentId(),
    type: 'question',
    variant: DEFAULT_QUESTION_VARIANT,
    title: overrides.title ?? 'Pertanyaan',
    prompt: overrides.prompt ?? 'Pertanyaan...',
    choices: overrides.choices ?? defaultChoices(),
    correctChoiceIndex: overrides.correctChoiceIndex ?? 0,
    feedbackCorrect: overrides.feedbackCorrect ?? 'Benar!',
    feedbackWrong: overrides.feedbackWrong ?? 'Belum tepat. Coba lagi.',
    points: overrides.points ?? 10,
    scoringStyle: overrides.scoringStyle ?? DEFAULT_SCORING_STYLE,
    ...DEFAULT_QUESTION_COMPONENT,
    ...overrides,
  };
}

export function createQuestionChoice(text: string): QuestionChoice {
  return { id: createComponentId(), text };
}

// ---------------------------------------------------------------------------
// Game Component (M11A)
// ---------------------------------------------------------------------------

export type GameComponentEditable = Omit<GameComponent, 'id' | 'type'>;

export const DEFAULT_GAME_TYPE: GameType = 'missionQuiz';

export const DEFAULT_GAME_COMPONENT: Omit<
  GameComponentEditable,
  'gameType' | 'title' | 'instruction' | 'missions' | 'scoringStyle'
> = {
  x: 100,
  y: 50,
  width: 700,
  height: 550,
};

export function createGameMission(overrides: Partial<GameMission> = {}): GameMission {
  return {
    id: createComponentId(),
    title: overrides.title ?? 'Misi 1',
    prompt: overrides.prompt ?? 'Pertanyaan misi...',
    choices: overrides.choices ?? [
      { id: createComponentId(), text: 'Pilihan A' },
      { id: createComponentId(), text: 'Pilihan B' },
    ],
    correctChoiceIndex: overrides.correctChoiceIndex ?? 0,
    feedbackCorrect: overrides.feedbackCorrect ?? 'Benar!',
    feedbackWrong: overrides.feedbackWrong ?? 'Belum tepat.',
    points: overrides.points ?? 10,
  };
}

export function createGameComponent(overrides: Partial<GameComponentEditable> = {}): GameComponent {
  return {
    id: createComponentId(),
    type: 'game',
    gameType: DEFAULT_GAME_TYPE,
    title: overrides.title ?? 'Game Misi',
    instruction: overrides.instruction ?? 'Jawab semua misi!',
    missions: overrides.missions ?? [createGameMission()],
    scoringStyle: overrides.scoringStyle ?? DEFAULT_SCORING_STYLE,
    ...DEFAULT_GAME_COMPONENT,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Layered Info Component (LXC-02)
//
// Komponen resmi baru dari Learning Experience Contract (LXC-01).
// Sajikan materi dalam lapisan progressive disclosure.
// Applicable roles: material, guide, menu, learningObjectives.
// Variants: accordion, tabs, iconTabs, stepper, cardGrid, timeline.
// ---------------------------------------------------------------------------

export type LayeredInfoComponentEditable = Omit<LayeredInfoComponent, 'id' | 'type'>;

export const DEFAULT_LAYERED_INFO_VARIANT: LayeredInfoVariant = 'accordion';

/** Buat satu layer baru dengan fresh ID. */
export function createLayeredInfoLayer(
  overrides: Partial<Omit<LayeredInfoLayer, 'id'>> = {},
): LayeredInfoLayer {
  return {
    id: createComponentId(),
    title: overrides.title ?? 'Lapisan Baru',
    body: overrides.body ?? 'Tulis isi lapisan di sini.',
    ...(overrides.icon !== undefined ? { icon: overrides.icon } : {}),
  };
}

export const DEFAULT_LAYERED_INFO_COMPONENT: Omit<LayeredInfoComponentEditable, 'variant' | 'title' | 'layers'> = {
  defaultOpenIndex: 0,
  x: 80,
  y: 120,
  width: 1120,
  height: 480,
};

/**
 * Create a new layered-info component.
 * Default variant = 'accordion'.
 * Default layers = 3 contoh lapisan (sesuai use case Tujuan Pembelajaran:
 * Sebelumnya / Hari Ini / Berikutnya).
 */
export function createLayeredInfoComponent(
  overrides: Partial<LayeredInfoComponentEditable> = {},
): LayeredInfoComponent {
  const defaultLayers: LayeredInfoLayer[] = [
    createLayeredInfoLayer({ title: 'Sebelumnya', body: 'Apa yang sudah kita pelajari sebelumnya?' }),
    createLayeredInfoLayer({ title: 'Hari Ini', body: 'Apa yang akan kita pelajari hari ini?' }),
    createLayeredInfoLayer({ title: 'Berikutnya', body: 'Apa yang akan datang setelah ini?' }),
  ];
  return {
    id: createComponentId(),
    type: 'layered-info',
    variant: overrides.variant ?? DEFAULT_LAYERED_INFO_VARIANT,
    title: overrides.title ?? 'Info Berlapis',
    layers: overrides.layers ?? defaultLayers,
    ...DEFAULT_LAYERED_INFO_COMPONENT,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Learning Bridge Component (LXC-03)
// ---------------------------------------------------------------------------

export type LearningBridgeComponentEditable = Omit<LearningBridgeComponent, 'id' | 'type'>;

export const DEFAULT_LEARNING_BRIDGE_VARIANT: LearningBridgeVariant = 'transition';

export const DEFAULT_LEARNING_BRIDGE_COMPONENT: Omit<LearningBridgeComponentEditable, 'variant' | 'title' | 'message' | 'nextButtonLabel'> = {
  x: 200,
  y: 250,
  width: 880,
  height: 200,
};

export function createLearningBridgeComponent(
  overrides: Partial<LearningBridgeComponentEditable> = {},
): LearningBridgeComponent {
  return {
    id: createComponentId(),
    type: 'learning-bridge',
    variant: overrides.variant ?? DEFAULT_LEARNING_BRIDGE_VARIANT,
    title: overrides.title ?? 'Jembatan Belajar',
    message: overrides.message ?? 'Kamu sudah selesai bagian ini. Sekarang kita lanjut ke bagian berikutnya.',
    nextButtonLabel: overrides.nextButtonLabel ?? 'Lanjut →',
    ...DEFAULT_LEARNING_BRIDGE_COMPONENT,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// V2-PILAR-2: Hotspot Overlay Component
//
// Overlay berisi titik-titik clickable di atas slide. Default: 3 contoh
// hotspot dengan label kosong, agar guru langsung paham cara pakai.
// Geometry default: full slide (1280x720) — guru biasanya ingin hotspot
// menutupi seluruh slide.
// ---------------------------------------------------------------------------

export type HotspotOverlayComponentEditable = Omit<HotspotOverlayComponent, 'id' | 'type'>;

export const DEFAULT_HOTSPOT_OVERLAY_VARIANT: HotspotOverlayVariant = 'default';

export const DEFAULT_HOTSPOT_OVERLAY_COMPONENT: Omit<
  HotspotOverlayComponentEditable,
  'variant' | 'hotspots'
> = {
  defaultOpenIndex: null,
  // Full slide dimensions — hotspot overlay biasanya menutupi seluruh slide
  x: 0,
  y: 0,
  width: 1280,
  height: 720,
};

/** Buat satu hotspot point baru dengan fresh ID. */
export function createHotspotPoint(
  overrides: Partial<Omit<HotspotPoint, 'id'>> = {},
): HotspotPoint {
  return {
    id: createComponentId(),
    x: overrides.x ?? 50,
    y: overrides.y ?? 50,
    label: overrides.label ?? 'Titik Baru',
    info: overrides.info ?? 'Tulis info yang muncul saat titik ini diklik.',
  };
}

export function createHotspotOverlayComponent(
  overrides: Partial<HotspotOverlayComponentEditable> = {},
): HotspotOverlayComponent {
  // Default: 2 contoh hotspot agar guru langsung paham cara pakai
  const defaultHotspots: HotspotPoint[] = [
    createHotspotPoint({ x: 30, y: 40, label: 'Titik 1', info: 'Info titik 1.' }),
    createHotspotPoint({ x: 70, y: 60, label: 'Titik 2', info: 'Info titik 2.' }),
  ];
  return {
    id: createComponentId(),
    type: 'hotspot-overlay',
    variant: overrides.variant ?? DEFAULT_HOTSPOT_OVERLAY_VARIANT,
    hotspots: overrides.hotspots ?? defaultHotspots,
    ...DEFAULT_HOTSPOT_OVERLAY_COMPONENT,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// V2-PILAR-2: Input Field Component
//
// Input teks untuk jawaban siswa di atas slide. Default: shortAnswer tanpa
// correctAnswer (input bebas). Guru bisa set correctAnswer untuk auto-check.
// ---------------------------------------------------------------------------

export type InputFieldComponentEditable = Omit<InputFieldComponent, 'id' | 'type'>;

export const DEFAULT_INPUT_FIELD_VARIANT: InputFieldVariant = 'shortAnswer';

export const DEFAULT_INPUT_FIELD_COMPONENT: Omit<
  InputFieldComponentEditable,
  'variant' | 'label' | 'placeholder'
> = {
  // correctAnswer, feedbackCorrect, feedbackWrong are optional — default undefined (no auto-check)
  points: 0,
  x: 340,
  y: 280,
  width: 600,
  height: 120,
};

export function createInputFieldComponent(
  overrides: Partial<InputFieldComponentEditable> = {},
): InputFieldComponent {
  return {
    id: createComponentId(),
    type: 'input-field',
    variant: overrides.variant ?? DEFAULT_INPUT_FIELD_VARIANT,
    label: overrides.label ?? 'Jawaban Anda',
    placeholder: overrides.placeholder ?? 'Tulis jawaban di sini…',
    ...DEFAULT_INPUT_FIELD_COMPONENT,
    ...overrides,
  };
}
