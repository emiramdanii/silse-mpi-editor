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
  // Question runtime state (M10)
  questionAnswers: Record<string, { selectedChoiceIndex: number; isAnswered: boolean }>;
  totalScore: number;

  // Lifecycle
  openPreview: () => void;
  closePreview: () => void;

  // Navigation
  navigateNext: () => void;
  navigatePrev: () => void;
  navigateGoto: (targetPageId: string) => void;

  // Question
  answerQuestion: (componentId: string, choiceIndex: number, correctIndex: number, points: number) => void;
  resetQuestion: (componentId: string) => void;

  // Internal
  _initCurrentPage: () => void;
};

function getProject(): SimpleProject {
  return useEditorStore.getState().project;
}

export const usePreviewStore = create<PreviewStore>((set, get) => ({
  currentPageId: null,
  isOpen: false,
  questionAnswers: {},
  totalScore: 0,

  openPreview: () => {
    const project = getProject();
    const firstPageId = project.pages[0]?.id ?? null;
    set({ isOpen: true, currentPageId: firstPageId, questionAnswers: {}, totalScore: 0 });
  },

  closePreview: () => {
    set({ isOpen: false });
  },

  _initCurrentPage: () => {
    const project = getProject();
    const current = get().currentPageId;
    if (!current || !project.pages.some((p) => p.id === current)) {
      set({ currentPageId: project.pages[0]?.id ?? null });
    }
  },

  navigateNext: () => {
    const project = getProject();
    const current = get().currentPageId;
    if (!current) return;
    const idx = project.pages.findIndex((p) => p.id === current);
    if (idx === -1 || idx >= project.pages.length - 1) return;
    set({ currentPageId: project.pages[idx + 1].id });
  },

  navigatePrev: () => {
    const project = getProject();
    const current = get().currentPageId;
    if (!current) return;
    const idx = project.pages.findIndex((p) => p.id === current);
    if (idx <= 0) return;
    set({ currentPageId: project.pages[idx - 1].id });
  },

  navigateGoto: (targetPageId: string) => {
    const project = getProject();
    if (!project.pages.some((p) => p.id === targetPageId)) return;
    set({ currentPageId: targetPageId });
  },

  answerQuestion: (componentId, choiceIndex, correctIndex, points) => {
    const state = get();
    const existing = state.questionAnswers[componentId];

    // If already answered, don't add score again
    if (existing?.isAnswered) {
      // Allow retry: reset first
      set({
        questionAnswers: {
          ...state.questionAnswers,
          [componentId]: { selectedChoiceIndex: choiceIndex, isAnswered: true },
        },
      });
      return;
    }

    const isCorrect = choiceIndex === correctIndex;
    const newScore = isCorrect ? state.totalScore + points : state.totalScore;

    set({
      questionAnswers: {
        ...state.questionAnswers,
        [componentId]: { selectedChoiceIndex: choiceIndex, isAnswered: true },
      },
      totalScore: newScore,
    });
  },

  resetQuestion: (componentId) => {
    const state = get();
    const existing = state.questionAnswers[componentId];
    if (!existing) return;

    const newAnswers = { ...state.questionAnswers };
    delete newAnswers[componentId];

    set({
      questionAnswers: newAnswers,
    });
  },
}));
