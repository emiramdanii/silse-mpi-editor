/**
 * Zustand store for silse-mpi-editor.
 *
 * Layer: store
 * Allowed imports: ../core
 *
 * For M0–M1, the store only handles project lifecycle and page operations.
 * Block operations (add/update/remove) will be added in M2+.
 */

import { create } from 'zustand';
import type { SimplePage, SimpleProject } from '../core/types';
import { createEmptyPage, createProject } from '../core/project-factory';
import { createPageId } from '../core/ids';

export type EditorState = {
  project: SimpleProject;

  // Project lifecycle
  newProject: () => void;
  setProject: (project: SimpleProject) => void;

  // Page operations
  addPage: (title?: string) => string;
  selectPage: (pageId: string) => void;
  renamePage: (pageId: string, title: string) => void;
  deletePage: (pageId: string) => void;
  duplicatePage: (pageId: string) => string | null;
  getCurrentPage: () => SimplePage | null;
};

export const useEditorStore = create<EditorState>((set, get) => ({
  project: createProject(),

  newProject: () => {
    set({ project: createProject() });
  },

  setProject: (project) => {
    set({ project });
  },

  addPage: (title) => {
    const page = createEmptyPage(title ?? `Halaman ${get().project.pages.length + 1}`);
    set((state) => ({
      project: {
        ...state.project,
        pages: [...state.project.pages, page],
        currentPageId: page.id,
      },
    }));
    return page.id;
  },

  selectPage: (pageId) => {
    set((state) => {
      if (!state.project.pages.some((p) => p.id === pageId)) return state;
      return { project: { ...state.project, currentPageId: pageId } };
    });
  },

  renamePage: (pageId, title) => {
    set((state) => ({
      project: {
        ...state.project,
        pages: state.project.pages.map((p) => (p.id === pageId ? { ...p, title } : p)),
      },
    }));
  },

  deletePage: (pageId) => {
    set((state) => {
      if (state.project.pages.length <= 1) return state; // keep at least 1 page
      const pages = state.project.pages.filter((p) => p.id !== pageId);
      const currentPageId =
        state.project.currentPageId === pageId ? pages[0].id : state.project.currentPageId;
      return { project: { ...state.project, pages, currentPageId } };
    });
  },

  duplicatePage: (pageId) => {
    const state = get();
    const source = state.project.pages.find((p) => p.id === pageId);
    if (!source) return null;

    const newId = createPageId();
    const copy: SimplePage = {
      ...source,
      id: newId,
      title: `${source.title} (salinan)`,
      blocks: source.blocks.map((b) => ({ ...b, id: `block_${Math.random().toString(36).slice(2, 10)}` })),
    };

    set((s) => {
      const idx = s.project.pages.findIndex((p) => p.id === pageId);
      const pages = [...s.project.pages];
      pages.splice(idx + 1, 0, copy);
      return {
        project: {
          ...s.project,
          pages,
          currentPageId: newId,
        },
      };
    });
    return newId;
  },

  getCurrentPage: () => {
    const { project } = get();
    return project.pages.find((p) => p.id === project.currentPageId) ?? null;
  },
}));
