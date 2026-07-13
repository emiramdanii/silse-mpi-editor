/**
 * @module student-session-store
 *
 * V2-PILAR-3: Zustand store untuk Student Session State.
 *
 * Layer: store (terpisah dari editor-store dan preview-store)
 *
 * Bertanggung jawab untuk:
 *   - Tracking jawaban siswa per komponen (Question/Game/InputField)
 *   - Kalkulasi totalScoreEarned, totalMaxScore, finalGrade (0-100)
 *   - Tracking combo streak (current + max)
 *   - Determinasi badge tier + celebration tier
 *   - Reset session saat mulai ulang
 *
 * TIDAK bertanggung jawab untuk:
 *   - Navigation state (itu preview-store)
 *   - Project structure (itu editor-store)
 *   - Visual celebration rendering (itu Pilar 3 Commit 2)
 *
 * Dipakai oleh:
 *   - PreviewApp.tsx (saat siswa jawab di preview)
 *   - export-html.ts (export runtime — via pure functions, bukan store langsung)
 *   - Test suite
 */

import { create } from 'zustand';
import type { QuizResponse, BadgeTier, CelebrationTier } from '../core/types';
import {
  calculateFinalGrade,
  getBadgeTier,
  updateStreak,
  getCelebrationTier,
  calculateProgressPercentage,
} from '../core/scoring/scoring-session';

export type StudentSessionState = {
  /** Key: componentId, Value: QuizResponse. O(1) lookup + overwrite. */
  responses: Record<string, QuizResponse>;
  /** Jumlah scoreEarned dari semua responses. */
  totalScoreEarned: number;
  /** Jumlah maxScore dari semua responses. */
  totalMaxScore: number;
  /** Combo streak saat ini (reset saat salah). */
  currentStreak: number;
  /** Streak tertinggi yang pernah dicapai. */
  maxStreak: number;

  // ----- Actions -----

  /**
   * Record jawaban siswa untuk satu komponen.
   * Jika componentId sudah ada di responses, overwrite (re-answer).
   * Update totalScoreEarned, totalMaxScore, streak.
   * Returns celebration tier (untuk trigger visual di Commit 2).
   */
  recordResponse: (response: Omit<QuizResponse, 'answeredAt'>) => CelebrationTier | null;

  /**
   * Reset response untuk satu komponen (mis. saat siswa klik "retry").
   * Update totalScoreEarned, totalMaxScore. Tidak reset streak.
   */
  resetResponse: (componentId: string) => void;

  /**
   * Reset seluruh session (mulai dari awal).
   */
  resetSession: () => void;

  // ----- Getters -----

  /** Get final grade (0-100). */
  getFinalGrade: () => number;
  /** Get badge tier berdasarkan final grade. */
  getBadgeTier: () => BadgeTier;
  /** Get progress percentage berdasarkan responses count vs total scoring components. */
  getProgressPercentage: (totalScoringComponents: number) => number;
  /** Get response untuk componentId tertentu. */
  getResponse: (componentId: string) => QuizResponse | undefined;
  /** Apakah componentId sudah dijawab. */
  isAnswered: (componentId: string) => boolean;
};

export const useStudentSessionStore = create<StudentSessionState>((set, get) => ({
  responses: {},
  totalScoreEarned: 0,
  totalMaxScore: 0,
  currentStreak: 0,
  maxStreak: 0,

  recordResponse: (response) => {
    const state = get();
    const existing = state.responses[response.componentId];

    // Hitung delta score (untuk re-answer, subtract old dulu)
    const oldScoreEarned = existing?.scoreEarned ?? 0;
    const oldMaxScore = existing?.maxScore ?? 0;
    const newScoreEarned = state.totalScoreEarned - oldScoreEarned + response.scoreEarned;
    const newMaxScore = state.totalMaxScore - oldMaxScore + response.maxScore;

    // Update streak
    const { newStreak, newMaxStreak } = updateStreak(
      state.currentStreak,
      state.maxStreak,
      response.isCorrect,
    );

    // Build new responses record
    const newResponses: Record<string, QuizResponse> = {
      ...state.responses,
      [response.componentId]: {
        ...response,
        answeredAt: Date.now(),
      },
    };

    set({
      responses: newResponses,
      totalScoreEarned: newScoreEarned,
      totalMaxScore: newMaxScore,
      currentStreak: newStreak,
      maxStreak: newMaxStreak,
    });

    // Return celebration tier untuk trigger visual
    // Note: isModuleComplete dan finalGrade di-pass 0/false di sini.
    // Commit 2 akan handle module-complete/perfect-score terpisah.
    return getCelebrationTier(response.isCorrect, newStreak, false, 0);
  },

  resetResponse: (componentId) => {
    const state = get();
    const existing = state.responses[componentId];
    if (!existing) return;

    const newResponses = { ...state.responses };
    delete newResponses[componentId];

    set({
      responses: newResponses,
      totalScoreEarned: state.totalScoreEarned - existing.scoreEarned,
      totalMaxScore: state.totalMaxScore - existing.maxScore,
      // Note: streak TIDAK di-reset saat retry single question.
      // Streak hanya reset saat jawaban salah baru.
    });
  },

  resetSession: () => {
    set({
      responses: {},
      totalScoreEarned: 0,
      totalMaxScore: 0,
      currentStreak: 0,
      maxStreak: 0,
    });
  },

  getFinalGrade: () => {
    const { totalScoreEarned, totalMaxScore } = get();
    return calculateFinalGrade(totalScoreEarned, totalMaxScore);
  },

  getBadgeTier: () => {
    return getBadgeTier(get().getFinalGrade());
  },

  getProgressPercentage: (totalScoringComponents) => {
    const responsesCount = Object.keys(get().responses).length;
    return calculateProgressPercentage(responsesCount, totalScoringComponents);
  },

  getResponse: (componentId) => {
    return get().responses[componentId];
  },

  isAnswered: (componentId) => {
    return get().responses[componentId] !== undefined;
  },
}));
