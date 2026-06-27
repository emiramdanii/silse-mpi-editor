/**
 * Zustand store for silse-mpi-editor.
 *
 * Layer: store
 * Allowed imports: ../core
 *
 * SCOPE (Batch 2R):
 *   M1 — project lifecycle + page add/select.
 *   M2 — text component: addTextComponent, selectComponent, updateTextComponent.
 *        Dengan PageRole + Capability Matrix.
 *
 * Kontrak M2R (docs/CORE_PRODUCT_CONTRACT.md section 4 + Batch 2R):
 *   - addTextComponent CEK capability current page.
 *     Jika allowAddComponent=false (cover), return null (silent reject).
 *   - Default variant text component mengikuti PageRole current page.
 *   - Setiap text component WAJIB variant. updateTextComponent tidak boleh
 *     menghapus field variant.
 *
 * Operasi rename/delete/duplicate page (M3) belum ada.
 * Operasi setPageRole (M11) belum ada.
 * Operasi image/card/navigation/question component (M4/M5/M11) belum ada.
 * Operasi removeComponent sengaja ditunda — bukan scope M2.
 */

import { create } from 'zustand';
import type { SimplePage, SimpleProject, TextComponent } from '../core/types';
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

export type EditorState = {
  project: SimpleProject;
  selectedComponentId: string | null;

  // Project lifecycle (M1)
  newProject: () => void;
  setProject: (project: SimpleProject) => void;

  // Page operations (M1)
  addPage: (title?: string) => string;
  selectPage: (pageId: string) => void;
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

export const useEditorStore = create<EditorState>((set, get) => ({
  project: createProject(),
  selectedComponentId: null,

  newProject: () => {
    set({ project: createProject(), selectedComponentId: null });
  },

  setProject: (project) => {
    set({ project, selectedComponentId: null });
  },

  addPage: (title) => {
    // Page baru manual default role='free'
    const page = createEmptyPage({ role: 'free', title });
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
