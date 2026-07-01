/**
 * Preview runtime store for silse-mpi-editor.
 *
 * Layer: preview (butuh access ke editor store untuk read project data)
 *
 * Kontrak:
 *   M5: Preview runtime state terpisah dari editor currentPageId.
 *   M10: Question runtime (questionAnswers, totalScore, answerQuestion, resetQuestion).
 *   M11A PATCH: Game runtime (gameStates, answerGameMission, nextGameMission, resetGame).
 *     - Score game masuk totalScore global (konsisten dengan export).
 *     - openPreview reset gameStates.
 *   UX-01 Patch (preview-fix): openPreview mulai di halaman yang sedang aktif
 *     di editor (project.currentPageId), supaya edits terakhir langsung kelihatan.
 *     Fallback ke halaman pertama kalau currentPageId tidak valid.
 */

import { create } from 'zustand';
import { useEditorStore } from '../store/editor-store';
import type { SimpleProject } from '../core/types';

export type GameRuntimeState = {
  currentMissionIndex: number;
  selectedChoiceIndex: number | null;
  isAnswered: boolean;
  score: number;
  completed: boolean;
};

export type PreviewRuntimeState = {
  currentPageId: string | null;
  isOpen: boolean;
};

export type PreviewStore = PreviewRuntimeState & {
  // Question runtime state (M10)
  questionAnswers: Record<string, { selectedChoiceIndex: number; isAnswered: boolean }>;
  // Game runtime state (M11A PATCH)
  gameStates: Record<string, GameRuntimeState>;
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

  // Game (M11A PATCH)
  answerGameMission: (componentId: string, missionIndex: number, choiceIndex: number, correctIndex: number, points: number) => void;
  nextGameMission: (componentId: string, totalMissions: number) => void;
  resetGame: (componentId: string) => void;

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
  gameStates: {},
  totalScore: 0,

  openPreview: () => {
    const project = getProject();
    // UX-01 Patch (preview-fix): start preview at the editor's current page,
    // so edits the user just made are immediately visible.
    // Fallback to first page if editor's currentPageId is missing or stale.
    const editorCurrent = project.currentPageId;
    const editorPageExists = !!editorCurrent &&
      project.pages.some((p) => p.id === editorCurrent);
    const startPageId = editorPageExists
      ? editorCurrent!
      : (project.pages[0]?.id ?? null);
    set({
      isOpen: true,
      currentPageId: startPageId,
      questionAnswers: {},
      gameStates: {},
      totalScore: 0,
    });
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

    if (existing?.isAnswered) {
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

  // ----- Game (M11A PATCH) -----

  answerGameMission: (componentId, _missionIndex, choiceIndex, correctIndex, points) => {
    const state = get();
    const existing = state.gameStates[componentId];

    // Initialize if not exists
    const gs: GameRuntimeState = existing ?? {
      currentMissionIndex: 0,
      selectedChoiceIndex: null,
      isAnswered: false,
      score: 0,
      completed: false,
    };

    // Don't score twice
    if (gs.isAnswered) return;

    const isCorrect = choiceIndex === correctIndex;
    const newGameScore = isCorrect ? gs.score + points : gs.score;
    const newTotalScore = isCorrect ? state.totalScore + points : state.totalScore;

    set({
      gameStates: {
        ...state.gameStates,
        [componentId]: {
          ...gs,
          selectedChoiceIndex: choiceIndex,
          isAnswered: true,
          score: newGameScore,
        },
      },
      totalScore: newTotalScore,
    });
  },

  nextGameMission: (componentId, totalMissions) => {
    const state = get();
    const gs = state.gameStates[componentId];
    if (!gs || !gs.isAnswered) return;

    const nextIndex = gs.currentMissionIndex + 1;
    if (nextIndex >= totalMissions) {
      // Last mission → completed
      set({
        gameStates: {
          ...state.gameStates,
          [componentId]: { ...gs, completed: true },
        },
      });
    } else {
      set({
        gameStates: {
          ...state.gameStates,
          [componentId]: {
            ...gs,
            currentMissionIndex: nextIndex,
            selectedChoiceIndex: null,
            isAnswered: false,
          },
        },
      });
    }
  },

  resetGame: (componentId) => {
    const state = get();
    const gs = state.gameStates[componentId];
    if (!gs) return;

    // Subtract game score from total
    const newTotalScore = state.totalScore - gs.score;

    set({
      gameStates: {
        ...state.gameStates,
        [componentId]: {
          currentMissionIndex: 0,
          selectedChoiceIndex: null,
          isAnswered: false,
          score: 0,
          completed: false,
        },
      },
      totalScore: newTotalScore,
    });
  },
}));
