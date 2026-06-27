/**
 * Preview runtime store for silse-mpi-editor.
 *
 * Layer: preview (butuh access ke editor store untuk read project data)
 *
 * Kontrak M5 (catatan senior):
 *   Preview runtime state HARUS terpisah dari editor currentPageId.
 *   Klik tombol next di Preview TIDAK boleh mengubah halaman aktif editor.
 *
 *   PreviewRuntimeState { currentPageId: string; }
 *
 *   Nanti di M10/M11 diperluas:
 *     currentQuestionIndex, selectedAnswer, score, feedbackState,
 *     activeTab, openAccordionItems, activeHotspot.
 */

import { create } from 'zustand';
import { useEditorStore } from '../store/editor-store';
import type { SimpleProject } from '../core/types';

export type PreviewRuntimeState = {
  /** Halaman yang sedang ditampilkan di preview. Terpisah dari editor currentPageId. */
  currentPageId: string | null;
  /** Apakah preview sedang aktif (dibuka). */
  isOpen: boolean;
};

export type PreviewStore = PreviewRuntimeState & {
  // Lifecycle
  openPreview: () => void;
  closePreview: () => void;

  // Navigation
  navigateNext: () => void;
  navigatePrev: () => void;
  navigateGoto: (targetPageId: string) => void;

  // Internal: set initial page when opening
  _initCurrentPage: () => void;
};

function getProject(): SimpleProject {
  return useEditorStore.getState().project;
}

export const usePreviewStore = create<PreviewStore>((set, get) => ({
  currentPageId: null,
  isOpen: false,

  openPreview: () => {
    const project = getProject();
    const firstPageId = project.pages[0]?.id ?? null;
    set({ isOpen: true, currentPageId: firstPageId });
  },

  closePreview: () => {
    set({ isOpen: false });
  },

  _initCurrentPage: () => {
    const project = getProject();
    const current = get().currentPageId;
    // If currentPageId is null or doesn't exist in project, reset to first page
    if (!current || !project.pages.some((p) => p.id === current)) {
      set({ currentPageId: project.pages[0]?.id ?? null });
    }
  },

  navigateNext: () => {
    const project = getProject();
    const current = get().currentPageId;
    if (!current) return;

    const idx = project.pages.findIndex((p) => p.id === current);
    if (idx === -1) return;
    if (idx >= project.pages.length - 1) return; // already on last page

    set({ currentPageId: project.pages[idx + 1].id });
  },

  navigatePrev: () => {
    const project = getProject();
    const current = get().currentPageId;
    if (!current) return;

    const idx = project.pages.findIndex((p) => p.id === current);
    if (idx <= 0) return; // already on first page

    set({ currentPageId: project.pages[idx - 1].id });
  },

  navigateGoto: (targetPageId: string) => {
    const project = getProject();
    if (!project.pages.some((p) => p.id === targetPageId)) return;
    set({ currentPageId: targetPageId });
  },
}));
