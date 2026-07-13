/**
 * @module scoring-session
 *
 * V2-PILAR-3: Pure functions untuk Student Session scoring engine.
 *
 * Layer: core (pure functions, no React/DOM/store dependency)
 *
 * Bertanggung jawab untuk:
 *   - Sanitasi string jawaban (trim + toLowerCase + normalize whitespace)
 *   - Kalkulasi nilai akhir (0-100) berdasarkan scoreEarned/maxScore
 *   - Determinasi badge tier (gold/silver/bronze) berdasarkan nilai akhir
 *   - Determinasi celebration tier berdasarkan streak + module completion
 *   - Combo streak tracking (increment on correct, reset on wrong)
 *
 * Dipakai oleh:
 *   - student-session-store.ts (Zustand store)
 *   - export-html.ts (export runtime scoring JS)
 *   - PreviewApp.tsx (preview scoring)
 *   - Test suite
 */

import type { BadgeTier, CelebrationTier } from '../types';
import { BADGE_THRESHOLDS, COMBO_STREAK_THRESHOLDS } from '../types';

// ---------------------------------------------------------------------------
// String sanitization untuk InputField auto-check
// ---------------------------------------------------------------------------

/**
 * Sanitize jawaban siswa sebelum perbandingan dengan correctAnswer.
 *
 * Algoritma:
 *   1. trim() — hapus spasi di awal/akhir (mis. " jakarta " → "jakarta")
 *   2. toLowerCase() — case-insensitive (mis. "Jakarta" → "jakarta")
 *   3. normalize whitespace — collapse multiple spaces jadi satu
 *      (mis. "ibu   kota" → "ibu kota")
 *
 *Ini mencegah combo streak putus karena typo spasi/kapitalisasi.
 */
export function sanitizeAnswer(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Compare jawaban siswa dengan correctAnswer (case-insensitive + trim).
 * Returns true jika match.
 */
export function isAnswerCorrect(studentAnswer: string, correctAnswer: string): boolean {
  return sanitizeAnswer(studentAnswer) === sanitizeAnswer(correctAnswer);
}

// ---------------------------------------------------------------------------
// Final grade calculation
// ---------------------------------------------------------------------------

/**
 * Hitung nilai akhir siswa (0-100).
 *
 * Formula: (totalScoreEarned / totalMaxScore) * 100
 *
 * Edge cases:
 *   - totalMaxScore === 0 → return 0 (tidak ada soal yang dijawab)
 *   - totalScoreEarned > totalMaxScore → clamp ke 100 (shouldn't happen, defense-in-depth)
 *
 * Returns integer 0-100 (dibulatkan).
 */
export function calculateFinalGrade(
  totalScoreEarned: number,
  totalMaxScore: number,
): number {
  if (totalMaxScore <= 0) return 0;
  const ratio = totalScoreEarned / totalMaxScore;
  const clamped = Math.min(1, Math.max(0, ratio));
  return Math.round(clamped * 100);
}

// ---------------------------------------------------------------------------
// Badge tier determination
// ---------------------------------------------------------------------------

/**
 * Tentukan badge tier berdasarkan nilai akhir (0-100).
 *
 * Threshold (sesuai keputusan Bapak — pedagogical adjustment):
 *   - Gold (Excellent): 90-100
 *   - Silver (Good Job): 70-89
 *   - Bronze (Keep Trying): <70
 *
 * Returns 'gold' | 'silver' | 'bronze'.
 */
export function getBadgeTier(finalGrade: number): BadgeTier {
  if (finalGrade >= BADGE_THRESHOLDS.gold) return 'gold';
  if (finalGrade >= BADGE_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

/**
 * Get human-readable label for badge tier.
 */
export function getBadgeLabel(tier: BadgeTier): string {
  switch (tier) {
    case 'gold': return 'Excellent';
    case 'silver': return 'Good Job';
    case 'bronze': return 'Keep Trying';
  }
}

/**
 * Get emoji icon for badge tier.
 */
export function getBadgeIcon(tier: BadgeTier): string {
  switch (tier) {
    case 'gold': return '🥇';
    case 'silver': return '🥈';
    case 'bronze': return '🥉';
  }
}

// ---------------------------------------------------------------------------
// Combo streak tracking
// ---------------------------------------------------------------------------

/**
 * Update combo streak berdasarkan jawaban baru.
 *
 * Aturan:
 *   - Jika isCorrect: streak baru = streak lama + 1
 *   - Jika salah: streak reset ke 0
 *
 * Returns { newStreak, newMaxStreak }.
 * newMaxStreak = max(maxStreak lama, newStreak).
 */
export function updateStreak(
  currentStreak: number,
  maxStreak: number,
  isCorrect: boolean,
): { newStreak: number; newMaxStreak: number } {
  const newStreak = isCorrect ? currentStreak + 1 : 0;
  const newMaxStreak = Math.max(maxStreak, newStreak);
  return { newStreak, newMaxStreak };
}

/**
 * Tentukan celebration tier berdasarkan jawaban + streak + module state.
 *
 * Prioritas (highest to lowest):
 *   1. perfect-score: finalGrade === 100 dan module selesai
 *   2. module-complete: module selesai (bukan perfect)
 *   3. streak-5: newStreak === 5 (atau kelipatan 5)
 *   4. streak-3: newStreak === 3 (atau kelipatan 3, tapi bukan 5)
 *   5. answer: jawaban benar biasa
 *   6. null: jawaban salah (no celebration)
 *
 * Note: 'module-complete' dan 'perfect-score' dipicu terpisah (saat siswa
 * selesai navigasi semua slide), bukan saat answer benar. Fungsi ini
 * return null untuk jawaban salah, atau tier celebration untuk jawaban benar.
 */
export function getCelebrationTier(
  isCorrect: boolean,
  newStreak: number,
  isModuleComplete: boolean = false,
  finalGrade: number = 0,
): CelebrationTier | null {
  // Jawaban salah → no celebration
  if (!isCorrect) return null;

  // Perfect score + module complete → perfect-score celebration
  if (isModuleComplete && finalGrade === 100) return 'perfect-score';

  // Module complete (tapi bukan perfect) → module-complete celebration
  if (isModuleComplete) return 'module-complete';

  // Streak 5 (atau kelipatan 5) → streak-5
  if (newStreak >= COMBO_STREAK_THRESHOLDS.STREAK_5 && newStreak % COMBO_STREAK_THRESHOLDS.STREAK_5 === 0) {
    return 'streak-5';
  }

  // Streak 3 (atau kelipatan 3, tapi bukan 5) → streak-3
  if (newStreak >= COMBO_STREAK_THRESHOLDS.STREAK_3 && newStreak % COMBO_STREAK_THRESHOLDS.STREAK_3 === 0) {
    return 'streak-3';
  }

  // Jawaban benar biasa
  return 'answer';
}

/**
 * Get human-readable streak message untuk combo streak tier.
 * Returns null jika tier bukan streak-3 atau streak-5.
 */
export function getStreakMessage(tier: CelebrationTier | null, streakCount: number): string | null {
  if (tier === 'streak-3') return `${streakCount}x Berturut-turut! Hebat!`;
  if (tier === 'streak-5') return `🔥 ${streakCount}x STREAK! Luar Biasa! 🔥`;
  return null;
}

// ---------------------------------------------------------------------------
// Progress percentage
// ---------------------------------------------------------------------------

/**
 * Hitung progress percentage berdasarkan responses vs total scoring components.
 *
 * Formula: (responsesCount / totalScoringComponents) * 100
 *
 * totalScoringComponents dihitung dari project (Question + Game + InputField
 * dengan correctAnswer). Jika 0, return 0.
 */
export function calculateProgressPercentage(
  responsesCount: number,
  totalScoringComponents: number,
): number {
  if (totalScoringComponents <= 0) return 0;
  const ratio = responsesCount / totalScoringComponents;
  return Math.round(Math.min(1, Math.max(0, ratio)) * 100);
}
