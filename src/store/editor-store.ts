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
  ImageComponent,
  ImageComponentVariant,
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
  IMAGE_COMPONENT_VARIANTS,
  LAYERED_INFO_VARIANTS,
  LEARNING_BRIDGE_VARIANTS,
  NAVIGATION_ACTIONS,
  NAVIGATION_COMPONENT_VARIANTS,
  QUESTION_COMPONENT_VARIANTS,
  SCORING_STYLES,
  TEXT_COMPONENT_VARIANTS,
} from '../core/types';
import { createEmptyPage, createProject } from '../core/project-factory';
import {
  createCardComponent,
  createGameComponent,
  createImageComponent,
  createLayeredInfoComponent,
  createLearningBridgeComponent,
  createNavigationComponent,
  createQuestionComponent,
  createTextComponent,
  type CardComponentEditable,
  type GameComponentEditable,
  type ImageComponentEditable,
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

  // Project lifecycle (M1)
  newProject: () => void;
  setProject: (project: SimpleProject) => void;
  // UX-01: rename project title from topbar inline editor
  setProjectTitle: (title: string) => void;

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
  selectComponent: (componentId: string | null) => void;
  updateTextComponent: (componentId: string, patch: Partial<TextComponentEditable>) => void;
  updateImageComponent: (componentId: string, patch: Partial<ImageComponentEditable>) => void;
  updateCardComponent: (componentId: string, patch: Partial<CardComponentEditable>) => void;
  updateNavigationComponent: (componentId: string, patch: Partial<NavigationComponentEditable>) => void;
  updateQuestionComponent: (componentId: string, patch: Partial<QuestionComponentEditable>) => void;
  updateGameComponent: (componentId: string, patch: Partial<GameComponentEditable>) => void;
  updateLayeredInfoComponent: (componentId: string, patch: Partial<LayeredInfoComponentEditable>) => void;
  updateLearningBridgeComponent: (componentId: string, patch: Partial<LearningBridgeComponentEditable>) => void;
  updateComponentGeometry: (componentId: string, rect: Rect) => void;
  removeComponent: (componentId: string) => void;
  getSelectedComponent: () => PageComponent | null;

  // UX-03: bulk add components from Content Pattern Library.
  // Adds an array of pre-built components (with fresh IDs) to a page.
  // Respects capability matrix — disallowed component types are skipped.
  // Returns the number of components actually added.
  addComponentsToPage: (pageId: string, components: PageComponent[]) => number;

  // Save / Load (M7)
  saveCurrent: () => boolean;
  loadCurrent: () => boolean;
  resetProject: () => void;
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

  newProject: () => {
    set({ project: createProject(), selectedComponentId: null });
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
    set({ project: createProject(), selectedComponentId: null });
    clearCurrentProject();
  },
}));

// Re-export capability helpers for UI consumers
export { getCapability, canAddComponent };
