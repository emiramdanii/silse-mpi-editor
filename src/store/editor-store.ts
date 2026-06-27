/**
 * Zustand store for silse-mpi-editor.
 *
 * Layer: store
 * Allowed imports: ../core
 *
 * SCOPE:
 *   M1 — project lifecycle + page add/select.
 *   M2 — text block: addTextBlock, selectBlock, updateTextBlock.
 *
 * Operasi rename/delete/duplicate page (M3) belum ada.
 * Operasi image/button block (M4/M5) belum ada.
 * Operasi removeBlock sengaja ditunda — bukan scope M2.
 */

import { create } from 'zustand';
import type { SimplePage, SimpleProject, TextBlock } from '../core/types';
import { createEmptyPage, createProject } from '../core/project-factory';
import { createTextBlock, type TextBlockEditable } from '../core/block-factory';

export type EditorState = {
  project: SimpleProject;
  selectedBlockId: string | null;

  // Project lifecycle (M1)
  newProject: () => void;
  setProject: (project: SimpleProject) => void;

  // Page operations (M1)
  addPage: (title?: string) => string;
  selectPage: (pageId: string) => void;
  getCurrentPage: () => SimplePage | null;

  // Block operations (M2 — text only)
  addTextBlock: (overrides?: Partial<TextBlockEditable>) => string;
  selectBlock: (blockId: string | null) => void;
  updateTextBlock: (blockId: string, patch: Partial<TextBlockEditable>) => void;
  getSelectedBlock: () => TextBlock | null;
};

function findBlock(project: SimpleProject, blockId: string): TextBlock | null {
  for (const page of project.pages) {
    for (const block of page.blocks) {
      if (block.id === blockId && block.type === 'text') {
        return block as TextBlock;
      }
    }
  }
  return null;
}

function blockExistsInCurrentPage(project: SimpleProject, blockId: string): boolean {
  const page = project.pages.find((p) => p.id === project.currentPageId);
  if (!page) return false;
  return page.blocks.some((b) => b.id === blockId);
}

export const useEditorStore = create<EditorState>((set, get) => ({
  project: createProject(),
  selectedBlockId: null,

  newProject: () => {
    set({ project: createProject(), selectedBlockId: null });
  },

  setProject: (project) => {
    set({ project, selectedBlockId: null });
  },

  addPage: (title) => {
    const page = createEmptyPage(title ?? `Halaman ${get().project.pages.length + 1}`);
    set((state) => ({
      project: {
        ...state.project,
        pages: [...state.project.pages, page],
        currentPageId: page.id,
      },
      // switching page clears block selection (selection is page-scoped)
      selectedBlockId: null,
    }));
    return page.id;
  },

  selectPage: (pageId) => {
    set((state) => {
      if (!state.project.pages.some((p) => p.id === pageId)) return state;
      return {
        project: { ...state.project, currentPageId: pageId },
        // clear block selection when switching page
        selectedBlockId: null,
      };
    });
  },

  getCurrentPage: () => {
    const { project } = get();
    return project.pages.find((p) => p.id === project.currentPageId) ?? null;
  },

  // ----- Block operations (M2) -----

  addTextBlock: (overrides) => {
    const block = createTextBlock(overrides);
    set((state) => {
      const pages = state.project.pages.map((p) => {
        if (p.id !== state.project.currentPageId) return p;
        return { ...p, blocks: [...p.blocks, block] };
      });
      return {
        project: { ...state.project, pages },
        selectedBlockId: block.id,
      };
    });
    return block.id;
  },

  selectBlock: (blockId) => {
    set((state) => {
      if (blockId === null) return { selectedBlockId: null };
      if (!blockExistsInCurrentPage(state.project, blockId)) return state;
      return { selectedBlockId: blockId };
    });
  },

  updateTextBlock: (blockId, patch) => {
    set((state) => {
      const page = state.project.pages.find((p) => p.id === state.project.currentPageId);
      if (!page) return state;
      const blockExists = page.blocks.some((b) => b.id === blockId && b.type === 'text');
      if (!blockExists) return state;

      const pages = state.project.pages.map((p) => {
        if (p.id !== state.project.currentPageId) return p;
        return {
          ...p,
          blocks: p.blocks.map((b) => {
            if (b.id !== blockId || b.type !== 'text') return b;
            return { ...b, ...patch, type: 'text' } as TextBlock;
          }),
        };
      });
      return { project: { ...state.project, pages } };
    });
  },

  getSelectedBlock: () => {
    const { project, selectedBlockId } = get();
    if (!selectedBlockId) return null;
    return findBlock(project, selectedBlockId);
  },
}));
