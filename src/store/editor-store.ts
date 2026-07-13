/**
 * Zustand store for silse-mpi-editor.
 *
 * Layer: store
 * Allowed imports: ../core
 *
 * SCOPE:
 *   M1 — project lifecycle + page add/select.
 *   M2 — text component: addTextComponent, selectComponent, updateTextComponent.
 *   M3 — page flow: renamePage, deletePage, duplicatePage + layoutId.
 *   M4 — image/card component: addImageComponent, addCardComponent,
 *        updateImageComponent, updateCardComponent.
 *
 * Kontrak M2R:
 *   - addTextComponent CEK capability current page.
 *   - Default variant text mengikuti PageRole.
 *
 * Kontrak M3:
 *   - addPage menerima role opsional (default 'free').
 *   - deletePage: dilarang hapus halaman terakhir, current page pilih fallback.
 *   - duplicatePage: deep copy, generate page id + semua component id baru.
 *
 * Kontrak M4 (Batch 4):
 *   - addImageComponent/addCardComponent CEK capability current page.
 *   - Variant wajib untuk image/card.
 *   - duplicatePage deep-copy image/card dengan id baru.
 *
 * Operasi setPageRole (M11) belum ada.
 * Operasi navigation/question component (M5/M11) belum ada.
 * Operasi removeComponent sengaja ditunda — bukan scope M4 (lands in M9).
 */

import { create } from 'zustand';
import type {
  CardComponent,
  CardComponentVariant,
  GameComponent,
  GlobalSlideSettings,
  HotspotOverlayComponent,
  HotspotOverlayVariant,
  ImageComponent,
  ImageComponentVariant,
  InputFieldComponent,
  InputFieldVariant,
  LayeredInfoComponent,
  LayeredInfoVariant,
  LearningBridgeComponent,
  LearningBridgeVariant,
  NavigationAction,
  NavigationComponent,
  NavigationComponentVariant,
  PageComponent,
  PageRole,
  QuestionComponent,
  SimplePage,
  SimpleProject,
  TextComponent,
  TextComponentVariant,
  ComponentType,
} from '../core/types';
import {
  CARD_COMPONENT_VARIANTS,
  GAME_TYPES,
  HOTSPOT_OVERLAY_VARIANTS,
  IMAGE_COMPONENT_VARIANTS,
  INPUT_FIELD_VARIANTS,
  LAYERED_INFO_VARIANTS,
  LEARNING_BRIDGE_VARIANTS,
  NAVIGATION_ACTIONS,
  NAVIGATION_COMPONENT_VARIANTS,
  QUESTION_COMPONENT_VARIANTS,
  SCORING_STYLES,
  TEXT_COMPONENT_VARIANTS,
} from '../core/types';
import { createEmptyPage, createProject, derivePageTitleFromFileName, DEFAULT_GLOBAL_SLIDE_SETTINGS, getEffectiveGlobalSlideSettings } from '../core/project-factory';
import { stylePackToProjectStyle } from '../core/style-presets';
import { resolveStylePackV1, getProjectStylePackIdV1 } from '../core/style-packs/style-pack-registry';
import { applyLayoutPresetToPage } from '../core/layout-presets/apply-layout-preset';
import {
  createCardComponent,
  createGameComponent,
  createHotspotOverlayComponent,
  createImageComponent,
  createInputFieldComponent,
  createLayeredInfoComponent,
  createLearningBridgeComponent,
  createNavigationComponent,
  createQuestionComponent,
  createTextComponent,
  type CardComponentEditable,
  type GameComponentEditable,
  type HotspotOverlayComponentEditable,
  type ImageComponentEditable,
  type InputFieldComponentEditable,
  type LayeredInfoComponentEditable,
  type LearningBridgeComponentEditable,
  type NavigationComponentEditable,
  type QuestionComponentEditable,
  type TextComponentEditable,
} from '../core/component-factory';
import { canAddComponent, getCapability, PAGE_ROLE_CAPABILITIES } from '../core/capability';
import { createComponentId, createPageId } from '../core/ids';
import {
  saveCurrentProject,
  loadCurrentProject,
  clearCurrentProject,
} from '../storage/project-storage';
import { guardGeometry } from '../core/layout-guard';
import type { Rect } from '../core/geometry';

export type EditorState = {
  project: SimpleProject;
  selectedComponentId: string | null;
  // CORE-MPI-UX-FOUNDATION-01: runtime progress + aggregate score
  completedSceneIds: string[];
  perSceneScore: Record<string, number>;
  aggregateScore: number;

  // Project lifecycle (M1)
  newProject: () => void;
  setProject: (project: SimpleProject) => void;
  // UX-01: rename project title from topbar inline editor
  setProjectTitle: (title: string) => void;
  // STYLE-PACK-SYSTEM-V1: change project style pack (visual only, no content mutation)
  setStylePack: (stylePackId: string) => void;
  // LAYOUT-PRESET-SYSTEM-V1: apply layout preset to a page (geometry only, no content mutation)
  applyLayoutPreset: (pageId: string, presetId: string) => void;

  // Page operations (M1 + M3)
  addPage: (opts?: { title?: string; role?: PageRole }) => string;
  selectPage: (pageId: string) => void;
  renamePage: (pageId: string, title: string) => void;
  deletePage: (pageId: string) => void;
  duplicatePage: (pageId: string) => string | null;
  getCurrentPage: () => SimplePage | null;

  // Component operations (M2 — text, M4 — image/card)
  addTextComponent: (overrides?: Partial<TextComponentEditable>) => string | null;
  addImageComponent: (src: string, overrides?: Partial<ImageComponentEditable>) => string | null;
  addCardComponent: (body: string, overrides?: Partial<CardComponentEditable>) => string | null;
  addNavigationComponent: (
    label: string,
    action: NavigationAction,
    overrides?: Partial<NavigationComponentEditable>,
  ) => string | null;
  addQuestionComponent: (overrides?: Partial<QuestionComponentEditable>) => string | null;
  addGameComponent: (overrides?: Partial<GameComponentEditable>) => string | null;
  addLayeredInfoComponent: (overrides?: Partial<LayeredInfoComponentEditable>) => string | null;
  addLearningBridgeComponent: (overrides?: Partial<LearningBridgeComponentEditable>) => string | null;
  // V2-PILAR-2: overlay components for slide PNG pages
  addHotspotOverlayComponent: (overrides?: Partial<HotspotOverlayComponentEditable>) => string | null;
  addInputFieldComponent: (overrides?: Partial<InputFieldComponentEditable>) => string | null;
  selectComponent: (componentId: string | null) => void;
  updateTextComponent: (componentId: string, patch: Partial<TextComponentEditable>) => void;
  updateImageComponent: (componentId: string, patch: Partial<ImageComponentEditable>) => void;
  updateCardComponent: (componentId: string, patch: Partial<CardComponentEditable>) => void;
  updateNavigationComponent: (componentId: string, patch: Partial<NavigationComponentEditable>) => void;
  updateQuestionComponent: (componentId: string, patch: Partial<QuestionComponentEditable>) => void;
  updateGameComponent: (componentId: string, patch: Partial<GameComponentEditable>) => void;
  updateLayeredInfoComponent: (componentId: string, patch: Partial<LayeredInfoComponentEditable>) => void;
  updateLearningBridgeComponent: (componentId: string, patch: Partial<LearningBridgeComponentEditable>) => void;
  // V2-PILAR-2: overlay component updates
  updateHotspotOverlayComponent: (componentId: string, patch: Partial<HotspotOverlayComponentEditable>) => void;
  updateInputFieldComponent: (componentId: string, patch: Partial<InputFieldComponentEditable>) => void;
  updateComponentGeometry: (componentId: string, rect: Rect) => void;
  removeComponent: (componentId: string) => void;
  getSelectedComponent: () => PageComponent | null;

  // UX-03: bulk add components from Content Pattern Library.
  // Adds an array of pre-built components (with fresh IDs) to a page.
  // Respects capability matrix — disallowed component types are skipped.
  // Returns the number of components actually added.
  addComponentsToPage: (pageId: string, components: PageComponent[]) => number;

  // V2-PILAR-1: Bulk import slide images as new pages.
  // Each file becomes a new SimplePage with background.type='image'.
  // Behavior:
  //   - mode='replace': clear all existing pages, create new project from slides.
  //   - mode='append': add slides to end of existing pages.
  // Returns the number of pages created. Caller responsible for mode decision
  // (use isProjectEmpty() helper to decide).
  importSlidesAsPages: (
    files: Array<{ name: string; dataUrl: string }>,
    mode: 'replace' | 'append',
  ) => number;

  // V2-PILAR-1: Update GlobalSlideSettings (user-side only, never from AI).
  // Merges patch into existing globalSlideSettings (or default if not set).
  // navigationToolbar is also partial — caller can update only specific fields.
  // Passing null resets to default (removes the field from project).
  setGlobalSlideSettings: (
    patch: {
      navigationToolbar?: Partial<GlobalSlideSettings['navigationToolbar']>;
      slideTransition?: GlobalSlideSettings['slideTransition'];
    } | null,
  ) => void;

  // V2-PILAR-2.5: Bulk update scoring components (from Quiz Sheet).
  // Updates points + correctAnswer untuk multiple components across pages.
  // Each update: { componentId, componentType, points?, correctAnswer? }
  bulkUpdateScoringComponents: (updates: Array<{
    componentId: string;
    componentType: 'question' | 'game' | 'input-field';
    points?: number;
    correctAnswer?: string;
  }>) => void;

  // Save / Load (M7)
  saveCurrent: () => boolean;
  loadCurrent: () => boolean;
  resetProject: () => void;

  // CORE-MPI-UX-FOUNDATION-01: Navigation + Runtime
  navigateNext: () => void;
  navigatePrev: () => void;
  markSceneCompleted: (sceneId: string) => void;
  addSceneScore: (sceneId: string, points: number) => void;
  /** PATCH A: Set scene score (idempotent — replaces, doesn't add) */
  setSceneScore: (sceneId: string, score: number) => void;
  /** PATCH A: Reset scene runtime (clears perSceneScore + removes from completedSceneIds) */
  resetSceneRuntime: (sceneId: string) => void;
  getCurrentSceneIndex: () => number;
  getProgressPercent: () => number;
  updateSceneContent: (pageId: string, patch: Record<string, unknown>) => void;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findComponentInProject(
  project: SimpleProject,
  componentId: string,
): PageComponent | null {
  for (const page of project.pages) {
    for (const component of page.components) {
      if (component.id === componentId) {
        return component;
      }
    }
  }
  return null;
}

function componentExistsInCurrentPage(project: SimpleProject, componentId: string): boolean {
  const page = project.pages.find((p) => p.id === project.currentPageId);
  if (!page) return false;
  return page.components.some((c) => c.id === componentId);
}

function sanitizeTextPatch(patch: Partial<TextComponentEditable>): Partial<TextComponentEditable> {
  const clean: Partial<TextComponentEditable> = { ...patch };
  if (clean.variant !== undefined) {
    if (!TEXT_COMPONENT_VARIANTS.includes(clean.variant as TextComponentVariant)) {
      delete clean.variant;
    }
  }
  return clean;
}

function sanitizeImagePatch(patch: Partial<ImageComponentEditable>): Partial<ImageComponentEditable> {
  const clean: Partial<ImageComponentEditable> = { ...patch };
  if (clean.variant !== undefined) {
    if (!IMAGE_COMPONENT_VARIANTS.includes(clean.variant as ImageComponentVariant)) {
      delete clean.variant;
    }
  }
  if (clean.objectFit !== undefined && !['cover', 'contain'].includes(clean.objectFit)) {
    delete clean.objectFit;
  }
  return clean;
}

function sanitizeCardPatch(patch: Partial<CardComponentEditable>): Partial<CardComponentEditable> {
  const clean: Partial<CardComponentEditable> = { ...patch };
  if (clean.variant !== undefined) {
    if (!CARD_COMPONENT_VARIANTS.includes(clean.variant as CardComponentVariant)) {
      delete clean.variant;
    }
  }
  return clean;
}

function sanitizeNavigationPatch(
  patch: Partial<NavigationComponentEditable>,
): Partial<NavigationComponentEditable> {
  const clean: Partial<NavigationComponentEditable> = { ...patch };
  if (clean.variant !== undefined) {
    if (!NAVIGATION_COMPONENT_VARIANTS.includes(clean.variant as NavigationComponentVariant)) {
      delete clean.variant;
    }
  }
  if (clean.action !== undefined) {
    if (!NAVIGATION_ACTIONS.includes(clean.action as NavigationAction)) {
      delete clean.action;
    }
  }
  if (clean.action !== undefined && clean.action !== 'goto') {
    clean.targetPageId = undefined;
  }
  return clean;
}

function sanitizeQuestionPatch(
  patch: Partial<QuestionComponentEditable>,
): Partial<QuestionComponentEditable> {
  const clean: Partial<QuestionComponentEditable> = { ...patch };
  if (clean.variant !== undefined) {
    if (!QUESTION_COMPONENT_VARIANTS.includes(clean.variant as QuestionComponent['variant'])) {
      delete clean.variant;
    }
  }
  if (clean.scoringStyle !== undefined) {
    if (!SCORING_STYLES.includes(clean.scoringStyle as QuestionComponent['scoringStyle'])) {
      delete clean.scoringStyle;
    }
  }
  return clean;
}

function sanitizeGamePatch(
  patch: Partial<GameComponentEditable>,
): Partial<GameComponentEditable> {
  const clean: Partial<GameComponentEditable> = { ...patch };
  if (clean.gameType !== undefined) {
    if (!GAME_TYPES.includes(clean.gameType as GameComponent['gameType'])) {
      delete clean.gameType;
    }
  }
  if (clean.scoringStyle !== undefined) {
    if (!SCORING_STYLES.includes(clean.scoringStyle as GameComponent['scoringStyle'])) {
      delete clean.scoringStyle;
    }
  }
  return clean;
}

function sanitizeLayeredInfoPatch(
  patch: Partial<LayeredInfoComponentEditable>,
): Partial<LayeredInfoComponentEditable> {
  const clean: Partial<LayeredInfoComponentEditable> = { ...patch };
  if (clean.variant !== undefined) {
    if (!LAYERED_INFO_VARIANTS.includes(clean.variant as LayeredInfoVariant)) {
      delete clean.variant;
    }
  }
  // defaultOpenIndex: allow number or null
  if (clean.defaultOpenIndex !== undefined && clean.defaultOpenIndex !== null) {
    if (typeof clean.defaultOpenIndex !== 'number' || !Number.isFinite(clean.defaultOpenIndex)) {
      delete clean.defaultOpenIndex;
    }
  }
  return clean;
}

function sanitizeLearningBridgePatch(
  patch: Partial<LearningBridgeComponentEditable>,
): Partial<LearningBridgeComponentEditable> {
  const clean: Partial<LearningBridgeComponentEditable> = { ...patch };
  if (clean.variant !== undefined) {
    if (!LEARNING_BRIDGE_VARIANTS.includes(clean.variant as LearningBridgeVariant)) {
      delete clean.variant;
    }
  }
  return clean;
}

// V2-PILAR-2: Sanitize helpers for overlay components
function sanitizeHotspotOverlayPatch(
  patch: Partial<HotspotOverlayComponentEditable>,
): Partial<HotspotOverlayComponentEditable> {
  const clean: Partial<HotspotOverlayComponentEditable> = { ...patch };
  if (clean.variant !== undefined) {
    if (!HOTSPOT_OVERLAY_VARIANTS.includes(clean.variant as HotspotOverlayVariant)) {
      delete clean.variant;
    }
  }
  // Clamp defaultOpenIndex: null atau index valid (0..hotspots.length-1)
  // Note: kita tidak bisa cek hotspots.length di sini tanpa reference; klamp minimal: -1 di-reject
  if (clean.defaultOpenIndex !== undefined && clean.defaultOpenIndex !== null) {
    if (typeof clean.defaultOpenIndex !== 'number' || clean.defaultOpenIndex < 0) {
      delete clean.defaultOpenIndex;
    }
  }
  return clean;
}

function sanitizeInputFieldPatch(
  patch: Partial<InputFieldComponentEditable>,
): Partial<InputFieldComponentEditable> {
  const clean: Partial<InputFieldComponentEditable> = { ...patch };
  if (clean.variant !== undefined) {
    if (!INPUT_FIELD_VARIANTS.includes(clean.variant as InputFieldVariant)) {
      delete clean.variant;
    }
  }
  // points harus >= 0
  if (clean.points !== undefined && (typeof clean.points !== 'number' || clean.points < 0)) {
    delete clean.points;
  }
  return clean;
}

/**
 * Deep-copy a component with a fresh id.
 * Pertahankan semua field kecuali id (yang baru).
 * Explicit copy primitive fields to avoid shared reference.
 */
function deepCopyComponentWithNewId(c: PageComponent): PageComponent {
  const newId = createComponentId();
  if (c.type === 'text') {
    const tc = c as TextComponent;
    return {
      id: newId,
      type: 'text',
      text: tc.text,
      variant: tc.variant,
      x: tc.x,
      y: tc.y,
      width: tc.width,
      height: tc.height,
    } as TextComponent;
  }
  if (c.type === 'image') {
    const ic = c as ImageComponent;
    return {
      id: newId,
      type: 'image',
      variant: ic.variant,
      src: ic.src,
      alt: ic.alt,
      objectFit: ic.objectFit,
      x: ic.x,
      y: ic.y,
      width: ic.width,
      height: ic.height,
    } as ImageComponent;
  }
  if (c.type === 'card') {
    const cc = c as CardComponent;
    return {
      id: newId,
      type: 'card',
      variant: cc.variant,
      title: cc.title,
      body: cc.body,
      x: cc.x,
      y: cc.y,
      width: cc.width,
      height: cc.height,
    } as CardComponent;
  }
  if (c.type === 'navigation') {
    const nc = c as NavigationComponent;
    return {
      id: newId,
      type: 'navigation',
      variant: nc.variant,
      label: nc.label,
      action: nc.action,
      targetPageId: nc.targetPageId,
      x: nc.x,
      y: nc.y,
      width: nc.width,
      height: nc.height,
    } as NavigationComponent;
  }
  if (c.type === 'question') {
    const qc = c as QuestionComponent;
    return {
      id: newId,
      type: 'question',
      variant: qc.variant,
      title: qc.title,
      prompt: qc.prompt,
      choices: qc.choices.map((ch) => ({ id: createComponentId(), text: ch.text })),
      correctChoiceIndex: qc.correctChoiceIndex,
      feedbackCorrect: qc.feedbackCorrect,
      feedbackWrong: qc.feedbackWrong,
      points: qc.points,
      scoringStyle: qc.scoringStyle,
      x: qc.x,
      y: qc.y,
      width: qc.width,
      height: qc.height,
    } as QuestionComponent;
  }
  if (c.type === 'game') {
    const gc = c as GameComponent;
    return {
      id: newId,
      type: 'game',
      gameType: gc.gameType,
      title: gc.title,
      instruction: gc.instruction,
      missions: gc.missions.map((m) => ({
        ...m,
        id: createComponentId(),
        choices: m.choices.map((ch) => ({ id: createComponentId(), text: ch.text })),
      })),
      scoringStyle: gc.scoringStyle,
      x: gc.x,
      y: gc.y,
      width: gc.width,
      height: gc.height,
    } as GameComponent;
  }
  // LXC-02 Patch-1: deep-copy layered-info with fresh layer IDs.
  if (c.type === 'layered-info') {
    const lc = c as LayeredInfoComponent;
    return {
      id: newId,
      type: 'layered-info',
      variant: lc.variant,
      title: lc.title,
      layers: lc.layers.map((layer) => ({
        ...layer,
        id: createComponentId(),
      })),
      defaultOpenIndex: lc.defaultOpenIndex,
      x: lc.x,
      y: lc.y,
      width: lc.width,
      height: lc.height,
    } as LayeredInfoComponent;
  }
  // LXC-03: deep-copy learning-bridge (static component, no nested IDs).
  if (c.type === 'learning-bridge') {
    const bc = c as LearningBridgeComponent;
    return {
      id: newId,
      type: 'learning-bridge',
      variant: bc.variant,
      title: bc.title,
      message: bc.message,
      nextButtonLabel: bc.nextButtonLabel,
      x: bc.x,
      y: bc.y,
      width: bc.width,
      height: bc.height,
    } as LearningBridgeComponent;
  }
  // V2-PILAR-2: deep-copy hotspot-overlay (regenerate hotspot IDs too).
  if (c.type === 'hotspot-overlay') {
    const hc = c as HotspotOverlayComponent;
    return {
      id: newId,
      type: 'hotspot-overlay',
      variant: hc.variant,
      hotspots: hc.hotspots.map((h) => ({ ...h, id: createComponentId() })),
      defaultOpenIndex: hc.defaultOpenIndex,
      x: hc.x,
      y: hc.y,
      width: hc.width,
      height: hc.height,
    } as HotspotOverlayComponent;
  }
  // V2-PILAR-2: deep-copy input-field (no nested IDs).
  if (c.type === 'input-field') {
    const ic = c as InputFieldComponent;
    return {
      id: newId,
      type: 'input-field',
      variant: ic.variant,
      label: ic.label,
      placeholder: ic.placeholder,
      correctAnswer: ic.correctAnswer,
      feedbackCorrect: ic.feedbackCorrect,
      feedbackWrong: ic.feedbackWrong,
      points: ic.points,
      x: ic.x,
      y: ic.y,
      width: ic.width,
      height: ic.height,
    } as InputFieldComponent;
  }
  // Unknown type — copy with new id (shouldn't occur).
  return { ...(c as Record<string, unknown>), id: newId } as PageComponent;
}

/**
 * Deep-copy a page with fresh ids for page + semua component.
 * Kontrak M3 Scope D + M4: deep-copy text/image/card.
 */
function deepCopyPageWithNewIds(source: SimplePage, newTitle?: string): SimplePage {
  const newComponents: PageComponent[] = source.components.map(deepCopyComponentWithNewId);

  return {
    id: createPageId(),
    title: newTitle ?? source.title,
    role: source.role,
    layoutId: source.layoutId,
    background: { ...source.background } as SimplePage['background'],
    components: newComponents,
  };
}

// ---------------------------------------------------------------------------
// Generic component add helper (capability-checked)
// ---------------------------------------------------------------------------

function addComponentToCurrentPage(
  state: EditorState,
  component: PageComponent,
): Partial<EditorState> {
  const pages = state.project.pages.map((p) => {
    if (p.id !== state.project.currentPageId) return p;
    return { ...p, components: [...p.components, component] };
  });
  return {
    project: { ...state.project, pages },
    selectedComponentId: component.id,
  };
}

// =========================================================================

export const useEditorStore = create<EditorState>((set, get) => ({
  project: createProject(),
  selectedComponentId: null,
  // CORE-MPI-UX-FOUNDATION-01: runtime state
  completedSceneIds: [],
  perSceneScore: {},
  aggregateScore: 0,

  newProject: () => {
    set({ project: createProject(), selectedComponentId: null, completedSceneIds: [], perSceneScore: {}, aggregateScore: 0 });
  },

  setProject: (project) => {
    set({ project, selectedComponentId: null });
  },

  setProjectTitle: (title) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    set((state) => ({
      project: { ...state.project, title: trimmed },
    }));
  },

  // STYLE-PACK-SYSTEM-V1: Change project style pack (visual only).
  // Updates stylePackId + style.tokens. Does NOT touch pages/components/objectives.
  setStylePack: (stylePackId) => {
    const resolvedId = getProjectStylePackIdV1(stylePackId);
    const pack = resolveStylePackV1(resolvedId);
    const projectStyle = stylePackToProjectStyle(pack);

    set((state) => ({
      project: {
        ...state.project,
        stylePackId: resolvedId,
        style: projectStyle,
      },
    }));
  },

  // LAYOUT-PRESET-SYSTEM-V1: Apply layout preset to a page (geometry only).
  // Updates page.layoutId + component geometry. Does NOT touch content.
  applyLayoutPreset: (pageId, presetId) => {
    set((state) => {
      const page = state.project.pages.find((p) => p.id === pageId);
      if (!page) return state;

      // applyLayoutPresetToPage is pure — returns new page with updated geometry.
      const newPage = applyLayoutPresetToPage(page, presetId);

      return {
        project: {
          ...state.project,
          pages: state.project.pages.map((p) =>
            p.id === pageId ? newPage : p,
          ),
        },
      };
    });
  },

  addPage: (opts) => {
    const role: PageRole = opts?.role ?? 'free';
    const page = createEmptyPage({ role, title: opts?.title });
    set((state) => ({
      project: {
        ...state.project,
        pages: [...state.project.pages, page],
        currentPageId: page.id,
      },
      selectedComponentId: null,
    }));
    return page.id;
  },

  selectPage: (pageId) => {
    set((state) => {
      if (!state.project.pages.some((p) => p.id === pageId)) return state;
      return {
        project: { ...state.project, currentPageId: pageId },
        selectedComponentId: null,
      };
    });
  },

  renamePage: (pageId, title) => {
    set((state) => {
      if (!state.project.pages.some((p) => p.id === pageId)) return state;
      return {
        project: {
          ...state.project,
          pages: state.project.pages.map((p) =>
            p.id === pageId ? { ...p, title } : p,
          ),
        },
      };
    });
  },

  deletePage: (pageId) => {
    set((state) => {
      if (state.project.pages.length <= 1) return state;
      const idx = state.project.pages.findIndex((p) => p.id === pageId);
      if (idx === -1) return state;
      const pages = state.project.pages.filter((p) => p.id !== pageId);
      let currentPageId = state.project.currentPageId;
      if (currentPageId === pageId) {
        const fallbackIdx = Math.min(idx, pages.length - 1);
        currentPageId = pages[Math.max(0, fallbackIdx)].id;
      }
      return {
        project: { ...state.project, pages, currentPageId },
        selectedComponentId: null,
      };
    });
  },

  duplicatePage: (pageId) => {
    const state = get();
    const source = state.project.pages.find((p) => p.id === pageId);
    if (!source) return null;

    const copy = deepCopyPageWithNewIds(source, `${source.title} (salinan)`);

    set((s) => {
      const idx = s.project.pages.findIndex((p) => p.id === pageId);
      const pages = [...s.project.pages];
      pages.splice(idx + 1, 0, copy);
      return {
        project: { ...s.project, pages, currentPageId: copy.id },
        selectedComponentId: null,
      };
    });
    return copy.id;
  },

  getCurrentPage: () => {
    const { project } = get();
    return project.pages.find((p) => p.id === project.currentPageId) ?? null;
  },

  // ----- Component operations (M2 — text) -----

  addTextComponent: (overrides) => {
    const state = get();
    const currentPage = state.project.pages.find(
      (p) => p.id === state.project.currentPageId,
    );
    if (!currentPage) return null;
    if (!canAddComponent(currentPage.role, 'text')) return null;

    const component = createTextComponent(currentPage.role, overrides);
    set((s) => addComponentToCurrentPage(s, component));
    return component.id;
  },

  // ----- Component operations (M4 — image) -----

  addImageComponent: (src, overrides) => {
    const state = get();
    const currentPage = state.project.pages.find(
      (p) => p.id === state.project.currentPageId,
    );
    if (!currentPage) return null;
    if (!canAddComponent(currentPage.role, 'image')) return null;

    const component = createImageComponent(src, overrides);
    set((s) => addComponentToCurrentPage(s, component));
    return component.id;
  },

  // ----- Component operations (M4 — card) -----

  addCardComponent: (body, overrides) => {
    const state = get();
    const currentPage = state.project.pages.find(
      (p) => p.id === state.project.currentPageId,
    );
    if (!currentPage) return null;
    if (!canAddComponent(currentPage.role, 'card')) return null;

    const component = createCardComponent(body, overrides);
    set((s) => addComponentToCurrentPage(s, component));
    return component.id;
  },

  // ----- Component operations (M5 — navigation) -----

  addNavigationComponent: (label, action, overrides) => {
    const state = get();
    const currentPage = state.project.pages.find(
      (p) => p.id === state.project.currentPageId,
    );
    if (!currentPage) return null;
    if (!canAddComponent(currentPage.role, 'navigation')) return null;

    const component = createNavigationComponent(label, action, overrides);
    set((s) => addComponentToCurrentPage(s, component));
    return component.id;
  },

  // ----- Component operations (M10 — question) -----

  addQuestionComponent: (overrides) => {
    const state = get();
    const currentPage = state.project.pages.find(
      (p) => p.id === state.project.currentPageId,
    );
    if (!currentPage) return null;
    if (!canAddComponent(currentPage.role, 'question')) return null;

    const component = createQuestionComponent(overrides);
    set((s) => addComponentToCurrentPage(s, component));
    return component.id;
  },

  // ----- Component operations (M11A — game) -----

  addGameComponent: (overrides) => {
    const state = get();
    const currentPage = state.project.pages.find(
      (p) => p.id === state.project.currentPageId,
    );
    if (!currentPage) return null;
    if (!canAddComponent(currentPage.role, 'game')) return null;

    const component = createGameComponent(overrides);
    set((s) => addComponentToCurrentPage(s, component));
    return component.id;
  },

  addLayeredInfoComponent: (overrides) => {
    const state = get();
    const currentPage = state.project.pages.find(
      (p) => p.id === state.project.currentPageId,
    );
    if (!currentPage) return null;
    if (!canAddComponent(currentPage.role, 'layered-info')) return null;

    const component = createLayeredInfoComponent(overrides);
    set((s) => addComponentToCurrentPage(s, component));
    return component.id;
  },

  addLearningBridgeComponent: (overrides) => {
    const state = get();
    const currentPage = state.project.pages.find(
      (p) => p.id === state.project.currentPageId,
    );
    if (!currentPage) return null;
    if (!canAddComponent(currentPage.role, 'learning-bridge')) return null;

    const component = createLearningBridgeComponent(overrides);
    set((s) => addComponentToCurrentPage(s, component));
    return component.id;
  },

  // V2-PILAR-2: Hotspot Overlay Component
  addHotspotOverlayComponent: (overrides) => {
    const state = get();
    const currentPage = state.project.pages.find(
      (p) => p.id === state.project.currentPageId,
    );
    if (!currentPage) return null;
    if (!canAddComponent(currentPage.role, 'hotspot-overlay')) return null;

    const component = createHotspotOverlayComponent(overrides);
    set((s) => addComponentToCurrentPage(s, component));
    return component.id;
  },

  // V2-PILAR-2: Input Field Component
  addInputFieldComponent: (overrides) => {
    const state = get();
    const currentPage = state.project.pages.find(
      (p) => p.id === state.project.currentPageId,
    );
    if (!currentPage) return null;
    if (!canAddComponent(currentPage.role, 'input-field')) return null;

    const component = createInputFieldComponent(overrides);
    set((s) => addComponentToCurrentPage(s, component));
    return component.id;
  },

  // ----- Selection + update -----

  selectComponent: (componentId) => {
    set((state) => {
      if (componentId === null) return { selectedComponentId: null };
      if (!componentExistsInCurrentPage(state.project, componentId)) return state;
      return { selectedComponentId: componentId };
    });
  },

  updateTextComponent: (componentId, patch) => {
    const cleanPatch = sanitizeTextPatch(patch);
    set((state) => {
      const page = state.project.pages.find((p) => p.id === state.project.currentPageId);
      if (!page) return state;
      const exists = page.components.some((c) => c.id === componentId && c.type === 'text');
      if (!exists) return state;

      const pages = state.project.pages.map((p) => {
        if (p.id !== state.project.currentPageId) return p;
        return {
          ...p,
          components: p.components.map((c) => {
            if (c.id !== componentId || c.type !== 'text') return c;
            return { ...c, ...cleanPatch, type: 'text' } as TextComponent;
          }),
        };
      });
      return { project: { ...state.project, pages } };
    });
  },

  updateImageComponent: (componentId, patch) => {
    const cleanPatch = sanitizeImagePatch(patch);
    set((state) => {
      const page = state.project.pages.find((p) => p.id === state.project.currentPageId);
      if (!page) return state;
      const exists = page.components.some((c) => c.id === componentId && c.type === 'image');
      if (!exists) return state;

      const pages = state.project.pages.map((p) => {
        if (p.id !== state.project.currentPageId) return p;
        return {
          ...p,
          components: p.components.map((c) => {
            if (c.id !== componentId || c.type !== 'image') return c;
            return { ...c, ...cleanPatch, type: 'image' } as ImageComponent;
          }),
        };
      });
      return { project: { ...state.project, pages } };
    });
  },

  updateCardComponent: (componentId, patch) => {
    const cleanPatch = sanitizeCardPatch(patch);
    set((state) => {
      const page = state.project.pages.find((p) => p.id === state.project.currentPageId);
      if (!page) return state;
      const exists = page.components.some((c) => c.id === componentId && c.type === 'card');
      if (!exists) return state;

      const pages = state.project.pages.map((p) => {
        if (p.id !== state.project.currentPageId) return p;
        return {
          ...p,
          components: p.components.map((c) => {
            if (c.id !== componentId || c.type !== 'card') return c;
            return { ...c, ...cleanPatch, type: 'card' } as CardComponent;
          }),
        };
      });
      return { project: { ...state.project, pages } };
    });
  },

  updateNavigationComponent: (componentId, patch) => {
    const cleanPatch = sanitizeNavigationPatch(patch);
    set((state) => {
      const page = state.project.pages.find((p) => p.id === state.project.currentPageId);
      if (!page) return state;
      const exists = page.components.some((c) => c.id === componentId && c.type === 'navigation');
      if (!exists) return state;

      const pages = state.project.pages.map((p) => {
        if (p.id !== state.project.currentPageId) return p;
        return {
          ...p,
          components: p.components.map((c) => {
            if (c.id !== componentId || c.type !== 'navigation') return c;
            return { ...c, ...cleanPatch, type: 'navigation' } as NavigationComponent;
          }),
        };
      });
      return { project: { ...state.project, pages } };
    });
  },

  updateQuestionComponent: (componentId, patch) => {
    const cleanPatch = sanitizeQuestionPatch(patch);
    set((state) => {
      const page = state.project.pages.find((p) => p.id === state.project.currentPageId);
      if (!page) return state;
      const exists = page.components.some((c) => c.id === componentId && c.type === 'question');
      if (!exists) return state;

      const pages = state.project.pages.map((p) => {
        if (p.id !== state.project.currentPageId) return p;
        return {
          ...p,
          components: p.components.map((c) => {
            if (c.id !== componentId || c.type !== 'question') return c;
            return { ...c, ...cleanPatch, type: 'question' } as QuestionComponent;
          }),
        };
      });
      return { project: { ...state.project, pages } };
    });
  },

  updateGameComponent: (componentId, patch) => {
    const cleanPatch = sanitizeGamePatch(patch);
    set((state) => {
      const page = state.project.pages.find((p) => p.id === state.project.currentPageId);
      if (!page) return state;
      const exists = page.components.some((c) => c.id === componentId && c.type === 'game');
      if (!exists) return state;

      const pages = state.project.pages.map((p) => {
        if (p.id !== state.project.currentPageId) return p;
        return {
          ...p,
          components: p.components.map((c) => {
            if (c.id !== componentId || c.type !== 'game') return c;
            return { ...c, ...cleanPatch, type: 'game' } as GameComponent;
          }),
        };
      });
      return { project: { ...state.project, pages } };
    });
  },

  updateLayeredInfoComponent: (componentId, patch) => {
    const cleanPatch = sanitizeLayeredInfoPatch(patch);
    set((state) => {
      const page = state.project.pages.find((p) => p.id === state.project.currentPageId);
      if (!page) return state;
      const exists = page.components.some((c) => c.id === componentId && c.type === 'layered-info');
      if (!exists) return state;

      const pages = state.project.pages.map((p) => {
        if (p.id !== state.project.currentPageId) return p;
        return {
          ...p,
          components: p.components.map((c) => {
            if (c.id !== componentId || c.type !== 'layered-info') return c;
            return { ...c, ...cleanPatch, type: 'layered-info' } as LayeredInfoComponent;
          }),
        };
      });
      return { project: { ...state.project, pages } };
    });
  },

  updateLearningBridgeComponent: (componentId, patch) => {
    const cleanPatch = sanitizeLearningBridgePatch(patch);
    set((state) => {
      const page = state.project.pages.find((p) => p.id === state.project.currentPageId);
      if (!page) return state;
      const exists = page.components.some((c) => c.id === componentId && c.type === 'learning-bridge');
      if (!exists) return state;

      const pages = state.project.pages.map((p) => {
        if (p.id !== state.project.currentPageId) return p;
        return {
          ...p,
          components: p.components.map((c) => {
            if (c.id !== componentId || c.type !== 'learning-bridge') return c;
            return { ...c, ...cleanPatch, type: 'learning-bridge' } as LearningBridgeComponent;
          }),
        };
      });
      return { project: { ...state.project, pages } };
    });
  },

  // V2-PILAR-2: updateHotspotOverlayComponent
  updateHotspotOverlayComponent: (componentId, patch) => {
    const cleanPatch = sanitizeHotspotOverlayPatch(patch);
    set((state) => {
      const page = state.project.pages.find((p) => p.id === state.project.currentPageId);
      if (!page) return state;
      const exists = page.components.some((c) => c.id === componentId && c.type === 'hotspot-overlay');
      if (!exists) return state;

      const pages = state.project.pages.map((p) => {
        if (p.id !== state.project.currentPageId) return p;
        return {
          ...p,
          components: p.components.map((c) => {
            if (c.id !== componentId || c.type !== 'hotspot-overlay') return c;
            return { ...c, ...cleanPatch, type: 'hotspot-overlay' } as HotspotOverlayComponent;
          }),
        };
      });
      return { project: { ...state.project, pages } };
    });
  },

  // V2-PILAR-2: updateInputFieldComponent
  updateInputFieldComponent: (componentId, patch) => {
    const cleanPatch = sanitizeInputFieldPatch(patch);
    set((state) => {
      const page = state.project.pages.find((p) => p.id === state.project.currentPageId);
      if (!page) return state;
      const exists = page.components.some((c) => c.id === componentId && c.type === 'input-field');
      if (!exists) return state;

      const pages = state.project.pages.map((p) => {
        if (p.id !== state.project.currentPageId) return p;
        return {
          ...p,
          components: p.components.map((c) => {
            if (c.id !== componentId || c.type !== 'input-field') return c;
            return { ...c, ...cleanPatch, type: 'input-field' } as InputFieldComponent;
          }),
        };
      });
      return { project: { ...state.project, pages } };
    });
  },

  // ----- Geometry + Remove (M9) -----

  updateComponentGeometry: (componentId, rect) => {
    set((state) => {
      const page = state.project.pages.find((p) => p.id === state.project.currentPageId);
      if (!page) return state;
      const comp = page.components.find((c) => c.id === componentId);
      if (!comp) return state;

      // Guard geometry via layout guard
      const guardResult = guardGeometry(page.role, page.layoutId, comp.type, rect);

      const pages = state.project.pages.map((p) => {
        if (p.id !== state.project.currentPageId) return p;
        return {
          ...p,
          components: p.components.map((c) => {
            if (c.id !== componentId) return c;
            return { ...c, x: guardResult.rect.x, y: guardResult.rect.y, width: guardResult.rect.width, height: guardResult.rect.height } as PageComponent;
          }),
        };
      });
      return { project: { ...state.project, pages } };
    });
  },

  removeComponent: (componentId) => {
    set((state) => {
      const page = state.project.pages.find((p) => p.id === state.project.currentPageId);
      if (!page) return state;
      const exists = page.components.some((c) => c.id === componentId);
      if (!exists) return state;

      const pages = state.project.pages.map((p) => {
        if (p.id !== state.project.currentPageId) return p;
        return { ...p, components: p.components.filter((c) => c.id !== componentId) };
      });
      return {
        project: { ...state.project, pages },
        selectedComponentId: null,
      };
    });
  },

  getSelectedComponent: () => {
    const { project, selectedComponentId } = get();
    if (!selectedComponentId) return null;
    return findComponentInProject(project, selectedComponentId);
  },

  // ----- UX-03: Content Pattern Library -----

  addComponentsToPage: (pageId, components) => {
    let addedCount = 0;
    set((state) => {
      const page = state.project.pages.find((p) => p.id === pageId);
      if (!page) return state;

      // Capability check: filter out component types not allowed for this role.
      const cap = PAGE_ROLE_CAPABILITIES[page.role];
      if (!cap || !cap.allowAddComponent) return state;

      const allowed = components.filter((c) =>
        cap.allowedComponents.includes(c.type as ComponentType),
      );

      if (allowed.length === 0) return state;

      const pages = state.project.pages.map((p) => {
        if (p.id !== pageId) return p;
        return { ...p, components: [...p.components, ...allowed] };
      });

      addedCount = allowed.length;
      return {
        project: { ...state.project, pages },
        // Don't auto-select — let guru choose what to edit.
        selectedComponentId: null,
      };
    });
    return addedCount;
  },

  // ----- V2-PILAR-1: Bulk import slide images as new pages -----

  importSlidesAsPages: (files, mode) => {
    if (files.length === 0) return 0;

    // Build new pages from slide files. Each page:
    //   - role='free' (paling permisif, izinkan overlay interaksi di Pilar 2)
    //   - layoutId='blank' (slide punya background sendiri, tidak butuh layout)
    //   - background={ type:'image', imageSrc:dataUrl }
    //   - components=[] (kosong; overlay ditambah manual setelah impor)
    //   - title=derivePageTitleFromFileName(fileName)
    const newPages: SimplePage[] = files.map((file) => {
      const page = createEmptyPage({ role: 'free', title: derivePageTitleFromFileName(file.name) });
      page.background = { type: 'image', imageSrc: file.dataUrl };
      return page;
    });

    set((state) => {
      if (mode === 'replace') {
        // Replace entire project pages with slides. Preserve project id, title,
        // style, curriculum. Reset currentPageId to first slide.
        return {
          project: {
            ...state.project,
            pages: newPages,
            currentPageId: newPages[0].id,
          },
          selectedComponentId: null,
          // Reset runtime state (scores, completed scenes) since pages changed.
          completedSceneIds: [],
          perSceneScore: {},
          aggregateScore: 0,
        };
      }
      // mode === 'append': add slides to end of existing pages.
      const pages = [...state.project.pages, ...newPages];
      return {
        project: {
          ...state.project,
          pages,
          // Jump to first newly-imported slide for immediate feedback.
          currentPageId: newPages[0].id,
        },
        selectedComponentId: null,
      };
    });
    return newPages.length;
  },

  // ----- V2-PILAR-1: Update GlobalSlideSettings -----

  setGlobalSlideSettings: (patch) => {
    set((state) => {
      // null = reset to default (remove field from project)
      if (patch === null) {
        const { globalSlideSettings: _omit, ...rest } = state.project;
        void _omit;
        return { project: rest };
      }
      // Merge patch into effective settings (existing or default)
      const current = getEffectiveGlobalSlideSettings(state.project);
      const merged: GlobalSlideSettings = {
        navigationToolbar: {
          ...current.navigationToolbar,
          ...(patch.navigationToolbar ?? {}),
        },
        slideTransition: patch.slideTransition ?? current.slideTransition,
      };
      // If merged equals default, remove the field (clean state)
      const isDefault =
        JSON.stringify(merged) === JSON.stringify(DEFAULT_GLOBAL_SLIDE_SETTINGS);
      if (isDefault) {
        const { globalSlideSettings: _omit, ...rest } = state.project;
        void _omit;
        return { project: rest };
      }
      return {
        project: { ...state.project, globalSlideSettings: merged },
      };
    });
  },

  // V2-PILAR-2.5: Bulk update scoring components (from Quiz Sheet)
  bulkUpdateScoringComponents: (updates) => {
    if (updates.length === 0) return;
    set((state) => {
      const pages = state.project.pages.map((page) => {
        let pageChanged = false;
        const newComponents = page.components.map((component) => {
          const update = updates.find((u) => u.componentId === component.id);
          if (!update) return component;

          if (component.type === 'question' && update.componentType === 'question') {
            pageChanged = true;
            const qc = component as QuestionComponent;
            // Update points if provided
            if (update.points !== undefined) {
              qc.points = update.points;
            }
            // Update correctAnswer: find choice yang text-nya match, set correctChoiceIndex
            if (update.correctAnswer !== undefined) {
              const matchIdx = qc.choices.findIndex(
                (c) => c.text.trim().toLowerCase() === update.correctAnswer!.trim().toLowerCase()
              );
              if (matchIdx >= 0) {
                qc.correctChoiceIndex = matchIdx;
              }
            }
            return { ...qc };
          }

          if (component.type === 'game' && update.componentType === 'game') {
            pageChanged = true;
            const gc = component as GameComponent;
            // Update points di mission pertama
            if (update.points !== undefined && gc.missions[0]) {
              gc.missions[0].points = update.points;
            }
            // Update correctAnswer: find choice di mission pertama
            if (update.correctAnswer !== undefined && gc.missions[0]) {
              const matchIdx = gc.missions[0].choices.findIndex(
                (c) => c.text.trim().toLowerCase() === update.correctAnswer!.trim().toLowerCase()
              );
              if (matchIdx >= 0) {
                gc.missions[0].correctChoiceIndex = matchIdx;
              }
            }
            return { ...gc };
          }

          if (component.type === 'input-field' && update.componentType === 'input-field') {
            pageChanged = true;
            const ic = component as InputFieldComponent;
            if (update.points !== undefined) {
              ic.points = update.points;
            }
            if (update.correctAnswer !== undefined) {
              ic.correctAnswer = update.correctAnswer;
            }
            return { ...ic };
          }

          return component;
        });

        return pageChanged ? { ...page, components: newComponents } : page;
      });

      return { project: { ...state.project, pages } };
    });
  },

  // ----- Save / Load (M7) -----

  saveCurrent: () => {
    const result = saveCurrentProject(get().project);
    return result.ok;
  },

  loadCurrent: () => {
    const result = loadCurrentProject();
    if (result.ok && result.data) {
      set({ project: result.data, selectedComponentId: null });
      return true;
    }
    return false;
  },

  resetProject: () => {
    set({ project: createProject(), selectedComponentId: null, completedSceneIds: [], perSceneScore: {}, aggregateScore: 0 });
    clearCurrentProject();
  },

  // CORE-MPI-UX-FOUNDATION-01: Navigation + Runtime
  navigateNext: () => {
    const project = get().project;
    const idx = project.pages.findIndex((p) => p.id === project.currentPageId);
    if (idx === -1 || idx >= project.pages.length - 1) return;
    set({ project: { ...project, currentPageId: project.pages[idx + 1].id }, selectedComponentId: null });
  },

  navigatePrev: () => {
    const project = get().project;
    const idx = project.pages.findIndex((p) => p.id === project.currentPageId);
    if (idx <= 0) return;
    set({ project: { ...project, currentPageId: project.pages[idx - 1].id }, selectedComponentId: null });
  },

  markSceneCompleted: (sceneId) => {
    const completed = get().completedSceneIds;
    if (completed.includes(sceneId)) return;
    set({ completedSceneIds: [...completed, sceneId] });
  },

  addSceneScore: (sceneId, points) => {
    const state = get();
    const currentSceneScore = state.perSceneScore[sceneId] ?? 0;
    const newPerScene = { ...state.perSceneScore, [sceneId]: currentSceneScore + points };
    const newAggregate = Object.values(newPerScene).reduce((sum, v) => sum + v, 0);
    set({ perSceneScore: newPerScene, aggregateScore: newAggregate });
  },

  // PATCH A: Idempotent score sync — replaces, doesn't add. Prevents double counting.
  setSceneScore: (sceneId, score) => {
    const state = get();
    const newPerScene = { ...state.perSceneScore, [sceneId]: score };
    const newAggregate = Object.values(newPerScene).reduce((sum, v) => sum + v, 0);
    set({ perSceneScore: newPerScene, aggregateScore: newAggregate });
  },

  // PATCH A: Reset scene runtime — clears score + removes from completed.
  resetSceneRuntime: (sceneId) => {
    const state = get();
    const newPerScene = { ...state.perSceneScore };
    delete newPerScene[sceneId];
    const newAggregate = Object.values(newPerScene).reduce((sum, v) => sum + v, 0);
    const newCompleted = state.completedSceneIds.filter((id) => id !== sceneId);
    set({ perSceneScore: newPerScene, aggregateScore: newAggregate, completedSceneIds: newCompleted });
  },

  getCurrentSceneIndex: () => {
    const project = get().project;
    return project.pages.findIndex((p) => p.id === project.currentPageId);
  },

  getProgressPercent: () => {
    const project = get().project;
    const total = project.pages.length;
    if (total === 0) return 0;
    const completed = get().completedSceneIds.length;
    return Math.round((completed / total) * 100);
  },

  updateSceneContent: (pageId, patch) => {
    set((state) => {
      const pages = state.project.pages.map((p) => {
        if (p.id !== pageId) return p;
        const currentContent = (p.sceneContent ?? {}) as Record<string, unknown>;
        return { ...p, sceneContent: { ...currentContent, ...patch } };
      });
      return { project: { ...state.project, pages } };
    });
  },
}));

// Re-export capability helpers for UI consumers
export { getCapability, canAddComponent };
