/**
 * Zustand store for silse-mpi-editor.
 *
 * Layer: store
 * Allowed imports: ../core
 *
 * SCOPE: M1 — Editor Kosong.
 * Hanya operasi project lifecycle dan page dasar (add/select).
 * Operasi rename/delete/duplicate page ditunda ke M3 (Page Flow Lengkap).
 * Jangan tambahkan operasi block sampai M2.
 */

import { create } from 'zustand';
import type { SimplePage, SimpleProject } from '../core/types';
import { createEmptyPage, createProject } from '../core/project-factory';

export type EditorState = {
  project: SimpleProject;

  // Project lifecycle (M1 scope)
  newProject: () => void;
  setProject: (project: SimpleProject) => void;

  // Page operations (M1 scope — hanya add & select)
  addPage: (title?: string) => string;
  selectPage: (pageId: string) => void;
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

  getCurrentPage: () => {
    const { project } = get();
    return project.pages.find((p) => p.id === project.currentPageId) ?? null;
  },
}));
