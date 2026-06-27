/**
 * Zustand store for silse-mpi-editor.
 *
 * Layer: store
 * Allowed imports: ../core
 *
 * SCOPE:
 *   M1 — project lifecycle + page add/select.
 *   M2 — text component: addTextComponent, selectComponent, updateTextComponent.
 *        Dengan PageRole + Capability Matrix.
 *   M3 — page flow: renamePage, deletePage, duplicatePage + layoutId.
 *
 * Kontrak M2R (docs/CORE_PRODUCT_CONTRACT.md section 4 + Batch 2R):
 *   - addTextComponent CEK capability current page.
 *     Jika allowAddComponent=false (cover), return null (silent reject).
 *   - Default variant text component mengikuti PageRole current page.
 *   - Setiap text component WAJIB variant. updateTextComponent tidak boleh
 *     menghapus field variant.
 *
 * Kontrak M3 (Batch 3):
 *   - addPage menerima role opsional (default 'free').
 *   - deletePage: dilarang hapus halaman terakhir, current page pilih fallback.
 *   - duplicatePage: deep copy, generate page id + semua component id baru,
 *     pertahankan role + layoutId. Tidak boleh share object reference.
 *   - StylePack project tidak boleh berubah karena page operation.
 *
 * Operasi setPageRole (M11) belum ada.
 * Operasi image/card/navigation/question component (M4/M5/M11) belum ada.
 * Operasi removeComponent sengaja ditunda — bukan scope M3.
 */

import { create } from 'zustand';
import type {
  PageComponent,
  PageRole,
  SimplePage,
  SimpleProject,
  TextComponent,
} from '../core/types';
import { createEmptyPage, createProject } from '../core/project-factory';
import {
  createTextComponent,
  type TextComponentEditable,
} from '../core/component-factory';
import {
  TEXT_COMPONENT_VARIANTS,
  type TextComponentVariant,
} from '../core/types';
import { canAddComponent, getCapability } from '../core/capability';
import { createComponentId, createPageId } from '../core/ids';

export type EditorState = {
  project: SimpleProject;
  selectedComponentId: string | null;

  // Project lifecycle (M1)
  newProject: () => void;
  setProject: (project: SimpleProject) => void;

  // Page operations (M1 + M3)
  addPage: (opts?: { title?: string; role?: PageRole }) => string;
  selectPage: (pageId: string) => void;
  renamePage: (pageId: string, title: string) => void;
  deletePage: (pageId: string) => void;
  duplicatePage: (pageId: string) => string | null;
  getCurrentPage: () => SimplePage | null;

  // Component operations (M2 — text only, capability-checked)
  /**
   * Add a text component to the current page.
   * Returns the new component id, or null if capability denied
   * (e.g. on a 'cover' page where allowAddComponent=false).
   */
  addTextComponent: (overrides?: Partial<TextComponentEditable>) => string | null;
  selectComponent: (componentId: string | null) => void;
  updateTextComponent: (componentId: string, patch: Partial<TextComponentEditable>) => void;
  getSelectedComponent: () => TextComponent | null;
};

function findComponent(project: SimpleProject, componentId: string): TextComponent | null {
  for (const page of project.pages) {
    for (const component of page.components) {
      if (component.id === componentId && component.type === 'text') {
        return component as TextComponent;
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

/**
 * Sanitize patch — pastikan kalau `variant` di-patch, nilainya valid.
 * Kontrak: variant tidak boleh di-set ke nilai di luar TEXT_COMPONENT_VARIANTS.
 */
function sanitizePatch(patch: Partial<TextComponentEditable>): Partial<TextComponentEditable> {
  const clean: Partial<TextComponentEditable> = { ...patch };
  if (clean.variant !== undefined) {
    if (!TEXT_COMPONENT_VARIANTS.includes(clean.variant as TextComponentVariant)) {
      // Buang variant invalid — component tetap punya variant lama.
      delete clean.variant;
    }
  }
  return clean;
}

/**
 * Deep-copy a page with fresh ids for page + semua component.
 * Kontrak M3 Scope D:
 *   - Generate page id baru.
 *   - Generate component id baru untuk setiap component.
 *   - Pertahankan role + layoutId + background + title + text/variant/geometry.
 *   - Tidak boleh share object reference.
 *
 * Catatan: M3 hanya punya TextComponent. M4/M5 akan menambah ImageComponent/
 * NavigationComponent — saat itu copyComponent perlu diperluas.
 */
function deepCopyPageWithNewIds(source: SimplePage, newTitle?: string): SimplePage {
  const newComponents: PageComponent[] = source.components.map((c) => {
    if (c.type === 'text') {
      const tc = c as TextComponent;
      return {
        ...tc,
        id: createComponentId(),
        // Explicit copy primitive fields to avoid shared reference
        text: tc.text,
        variant: tc.variant,
        x: tc.x,
        y: tc.y,
        width: tc.width,
        height: tc.height,
      } as TextComponent;
    }
    // Image/Navigation components — M4/M5 will handle these.
    // For M3, just copy with new id (shouldn't occur in M3 scope).
    return { ...c, id: createComponentId() } as PageComponent;
  });

  return {
    id: createPageId(),
    title: newTitle ?? source.title,
    role: source.role,
    layoutId: source.layoutId,
    background: { ...source.background } as SimplePage['background'],
    components: newComponents,
  };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  project: createProject(),
  selectedComponentId: null,

  newProject: () => {
    set({ project: createProject(), selectedComponentId: null });
  },

  setProject: (project) => {
    set({ project, selectedComponentId: null });
  },

  addPage: (opts) => {
    // Page baru manual default role='free' jika tidak diberikan.
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
      // No-op if page not found (preserve state reference identity)
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
      // Safety rule #1: dilarang hapus halaman terakhir.
      if (state.project.pages.length <= 1) return state;

      const idx = state.project.pages.findIndex((p) => p.id === pageId);
      if (idx === -1) return state;

      const pages = state.project.pages.filter((p) => p.id !== pageId);

      // Safety rule #2: kalau yang dihapus adalah current page, pilih fallback.
      let currentPageId = state.project.currentPageId;
      if (currentPageId === pageId) {
        // Pilih page pertama yang tersisa, atau page pada index yang sama (atau sebelumnya).
        const fallbackIdx = Math.min(idx, pages.length - 1);
        currentPageId = pages[Math.max(0, fallbackIdx)].id;
      }

      return {
        project: {
          ...state.project,
          pages,
          currentPageId,
        },
        // Clear component selection (might belong to deleted page)
        selectedComponentId: null,
      };
    });
  },

  duplicatePage: (pageId) => {
    const state = get();
    const source = state.project.pages.find((p) => p.id === pageId);
    if (!source) return null;

    // Deep copy with new ids for page + semua component.
    const copy = deepCopyPageWithNewIds(source, `${source.title} (salinan)`);

    set((s) => {
      const idx = s.project.pages.findIndex((p) => p.id === pageId);
      const pages = [...s.project.pages];
      // Insert copy right after source
      pages.splice(idx + 1, 0, copy);
      return {
        project: {
          ...s.project,
          pages,
          // Switch to the new duplicated page
          currentPageId: copy.id,
        },
        // Clear component selection (ids are fresh on the copy)
        selectedComponentId: null,
      };
    });
    return copy.id;
  },

  getCurrentPage: () => {
    const { project } = get();
    return project.pages.find((p) => p.id === project.currentPageId) ?? null;
  },

  // ----- Component operations (M2) -----

  addTextComponent: (overrides) => {
    const state = get();
    const currentPage = state.project.pages.find(
      (p) => p.id === state.project.currentPageId,
    );
    if (!currentPage) return null;

    // Cek capability current page
    if (!canAddComponent(currentPage.role, 'text')) {
      return null; // capability denied (e.g. cover page)
    }

    const component = createTextComponent(currentPage.role, overrides);
    set((s) => {
      const pages = s.project.pages.map((p) => {
        if (p.id !== s.project.currentPageId) return p;
        return { ...p, components: [...p.components, component] };
      });
      return {
        project: { ...s.project, pages },
        selectedComponentId: component.id,
      };
    });
    return component.id;
  },

  selectComponent: (componentId) => {
    set((state) => {
      if (componentId === null) return { selectedComponentId: null };
      if (!componentExistsInCurrentPage(state.project, componentId)) return state;
      return { selectedComponentId: componentId };
    });
  },

  updateTextComponent: (componentId, patch) => {
    const cleanPatch = sanitizePatch(patch);
    set((state) => {
      const page = state.project.pages.find((p) => p.id === state.project.currentPageId);
      if (!page) return state;
      const componentExists = page.components.some(
        (c) => c.id === componentId && c.type === 'text',
      );
      if (!componentExists) return state;

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

  getSelectedComponent: () => {
    const { project, selectedComponentId } = get();
    if (!selectedComponentId) return null;
    return findComponent(project, selectedComponentId);
  },
}));

// Re-export capability helpers for UI consumers (Topbar hint about page role)
export { getCapability, canAddComponent };
