/**
 * V2-PILAR-3 Commit 1: Tests for Student Session scoring engine.
 *
 * Coverage:
 *   1. sanitizeAnswer — trim + toLowerCase + normalize whitespace
 *   2. isAnswerCorrect — case-insensitive + trim comparison
 *   3. calculateFinalGrade — edge cases (0 maxScore, clamp, rounding)
 *   4. getBadgeTier — threshold gold/silver/bronze (pedagogical adjustment)
 *   5. getBadgeLabel + getBadgeIcon — human-readable output
 *   6. updateStreak — increment on correct, reset on wrong
 *   7. getCelebrationTier — priority logic (perfect > module > streak-5 > streak-3 > answer > null)
 *   8. getStreakMessage — streak-3/streak-5 messages
 *   9. calculateProgressPercentage — responses vs total
 *  10. student-session-store — recordResponse + resetResponse + resetSession + getters
 *  11. Re-answer scenario (overwrite response, streak behavior)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  sanitizeAnswer,
  isAnswerCorrect,
  calculateFinalGrade,
  getBadgeTier,
  getBadgeLabel,
  getBadgeIcon,
  updateStreak,
  getCelebrationTier,
  getStreakMessage,
  calculateProgressPercentage,
} from '../core/scoring/scoring-session';
import { useStudentSessionStore } from '../store/student-session-store';
import { BADGE_THRESHOLDS, COMBO_STREAK_THRESHOLDS } from '../core/types';

// ---------------------------------------------------------------------------
// 1. sanitizeAnswer
// ---------------------------------------------------------------------------

describe('V2-PILAR-3 — sanitizeAnswer', () => {
  it('1. trims leading whitespace', () => {
    expect(sanitizeAnswer('  jakarta')).toBe('jakarta');
  });

  it('2. trims trailing whitespace', () => {
    expect(sanitizeAnswer('jakarta  ')).toBe('jakarta');
  });

  it('3. trims both sides', () => {
    expect(sanitizeAnswer('  jakarta  ')).toBe('jakarta');
  });

  it('4. lowercases uppercase', () => {
    expect(sanitizeAnswer('Jakarta')).toBe('jakarta');
  });

  it('5. lowercases mixed case', () => {
    expect(sanitizeAnswer('JaKaRtA')).toBe('jakarta');
  });

  it('6. collapses multiple spaces to single', () => {
    expect(sanitizeAnswer('ibu   kota')).toBe('ibu kota');
  });

  it('7. collapses tabs to single space', () => {
    expect(sanitizeAnswer('ibu\tkota')).toBe('ibu kota');
  });

  it('8. handles all combined: trim + lowercase + collapse', () => {
    expect(sanitizeAnswer('  Ibu   Kota  ')).toBe('ibu kota');
  });

  it('9. handles empty string', () => {
    expect(sanitizeAnswer('')).toBe('');
  });

  it('10. handles whitespace-only string', () => {
    expect(sanitizeAnswer('   ')).toBe('');
  });

  it('11. handles numbers', () => {
    expect(sanitizeAnswer('42')).toBe('42');
  });

  it('12. handles special characters', () => {
    expect(sanitizeAnswer('Hello, World!')).toBe('hello, world!');
  });
});

// ---------------------------------------------------------------------------
// 2. isAnswerCorrect
// ---------------------------------------------------------------------------

describe('V2-PILAR-3 — isAnswerCorrect', () => {
  it('13. exact match returns true', () => {
    expect(isAnswerCorrect('jakarta', 'jakarta')).toBe(true);
  });

  it('14. case-insensitive match', () => {
    expect(isAnswerCorrect('Jakarta', 'jakarta')).toBe(true);
  });

  it('15. trim student answer', () => {
    expect(isAnswerCorrect(' jakarta ', 'jakarta')).toBe(true);
  });

  it('16. trim correct answer', () => {
    expect(isAnswerCorrect('jakarta', ' jakarta ')).toBe(true);
  });

  it('17. normalize whitespace in both', () => {
    expect(isAnswerCorrect('ibu   kota', 'ibu kota')).toBe(true);
  });

  it('18. different answers return false', () => {
    expect(isAnswerCorrect('bandung', 'jakarta')).toBe(false);
  });

  it('19. empty student answer vs non-empty correct returns false', () => {
    expect(isAnswerCorrect('', 'jakarta')).toBe(false);
  });

  it('20. both empty returns true', () => {
    expect(isAnswerCorrect('', '')).toBe(true);
  });

  it('21. typo (single char diff) returns false', () => {
    expect(isAnswerCorrect('jakart', 'jakarta')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. calculateFinalGrade
// ---------------------------------------------------------------------------

describe('V2-PILAR-3 — calculateFinalGrade', () => {
  it('22. perfect score returns 100', () => {
    expect(calculateFinalGrade(100, 100)).toBe(100);
  });

  it('23. zero score returns 0', () => {
    expect(calculateFinalGrade(0, 100)).toBe(0);
  });

  it('24. half score returns 50', () => {
    expect(calculateFinalGrade(50, 100)).toBe(50);
  });

  it('25. 75% score returns 75', () => {
    expect(calculateFinalGrade(75, 100)).toBe(75);
  });

  it('26. maxScore = 0 returns 0 (no questions)', () => {
    expect(calculateFinalGrade(0, 0)).toBe(0);
  });

  it('27. scoreEarned > maxScore clamps to 100', () => {
    expect(calculateFinalGrade(150, 100)).toBe(100);
  });

  it('28. negative scoreEarned clamps to 0', () => {
    expect(calculateFinalGrade(-10, 100)).toBe(0);
  });

  it('29. rounds to nearest integer', () => {
    // 33.33...% → 33
    expect(calculateFinalGrade(10, 30)).toBe(33);
    // 66.66...% → 67
    expect(calculateFinalGrade(20, 30)).toBe(67);
  });

  it('30. 90/100 returns 90 (gold threshold)', () => {
    expect(calculateFinalGrade(90, 100)).toBe(90);
  });

  it('31. 89/100 returns 89 (silver threshold)', () => {
    expect(calculateFinalGrade(89, 100)).toBe(89);
  });

  it('32. 70/100 returns 70 (silver/bronze boundary)', () => {
    expect(calculateFinalGrade(70, 100)).toBe(70);
  });

  it('33. 69/100 returns 69 (bronze)', () => {
    expect(calculateFinalGrade(69, 100)).toBe(69);
  });
});

// ---------------------------------------------------------------------------
// 4. getBadgeTier (pedagogical adjustment: 90/70/<70)
// ---------------------------------------------------------------------------

describe('V2-PILAR-3 — getBadgeTier (pedagogical adjustment)', () => {
  it('34. score 100 returns gold', () => {
    expect(getBadgeTier(100)).toBe('gold');
  });

  it('35. score 90 returns gold (threshold)', () => {
    expect(getBadgeTier(90)).toBe('gold');
  });

  it('36. score 89 returns silver (just below gold)', () => {
    expect(getBadgeTier(89)).toBe('silver');
  });

  it('37. score 70 returns silver (threshold)', () => {
    expect(getBadgeTier(70)).toBe('silver');
  });

  it('38. score 69 returns bronze (just below silver)', () => {
    expect(getBadgeTier(69)).toBe('bronze');
  });

  it('39. score 0 returns bronze', () => {
    expect(getBadgeTier(0)).toBe('bronze');
  });

  it('40. score 50 returns bronze', () => {
    expect(getBadgeTier(50)).toBe('bronze');
  });

  it('41. BADGE_THRESHOLDS gold is 90', () => {
    expect(BADGE_THRESHOLDS.gold).toBe(90);
  });

  it('42. BADGE_THRESHOLDS silver is 70', () => {
    expect(BADGE_THRESHOLDS.silver).toBe(70);
  });

  it('43. BADGE_THRESHOLDS bronze is 0', () => {
    expect(BADGE_THRESHOLDS.bronze).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 5. getBadgeLabel + getBadgeIcon
// ---------------------------------------------------------------------------

describe('V2-PILAR-3 — getBadgeLabel + getBadgeIcon', () => {
  it('44. gold label is Excellent', () => {
    expect(getBadgeLabel('gold')).toBe('Excellent');
  });

  it('45. silver label is Good Job', () => {
    expect(getBadgeLabel('silver')).toBe('Good Job');
  });

  it('46. bronze label is Keep Trying', () => {
    expect(getBadgeLabel('bronze')).toBe('Keep Trying');
  });

  it('47. gold icon is 🥇', () => {
    expect(getBadgeIcon('gold')).toBe('🥇');
  });

  it('48. silver icon is 🥈', () => {
    expect(getBadgeIcon('silver')).toBe('🥈');
  });

  it('49. bronze icon is 🥉', () => {
    expect(getBadgeIcon('bronze')).toBe('🥉');
  });
});

// ---------------------------------------------------------------------------
// 6. updateStreak
// ---------------------------------------------------------------------------

describe('V2-PILAR-3 — updateStreak', () => {
  it('50. correct answer increments streak from 0', () => {
    const result = updateStreak(0, 0, true);
    expect(result.newStreak).toBe(1);
    expect(result.newMaxStreak).toBe(1);
  });

  it('51. correct answer increments streak from 2', () => {
    const result = updateStreak(2, 3, true);
    expect(result.newStreak).toBe(3);
    expect(result.newMaxStreak).toBe(3);
  });

  it('52. wrong answer resets streak to 0', () => {
    const result = updateStreak(5, 5, false);
    expect(result.newStreak).toBe(0);
  });

  it('53. wrong answer preserves maxStreak', () => {
    const result = updateStreak(5, 5, false);
    expect(result.newMaxStreak).toBe(5);
  });

  it('54. correct answer updates maxStreak if new streak exceeds', () => {
    const result = updateStreak(5, 5, true);
    expect(result.newStreak).toBe(6);
    expect(result.newMaxStreak).toBe(6);
  });

  it('55. correct answer does NOT decrease maxStreak', () => {
    // currentStreak=2, maxStreak=5, correct → newStreak=3, maxStreak stays 5
    const result = updateStreak(2, 5, true);
    expect(result.newStreak).toBe(3);
    expect(result.newMaxStreak).toBe(5);
  });

  it('56. wrong answer from streak 0 stays 0', () => {
    const result = updateStreak(0, 0, false);
    expect(result.newStreak).toBe(0);
    expect(result.newMaxStreak).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 7. getCelebrationTier
// ---------------------------------------------------------------------------

describe('V2-PILAR-3 — getCelebrationTier', () => {
  it('57. wrong answer returns null', () => {
    expect(getCelebrationTier(false, 0)).toBeNull();
  });

  it('58. correct answer with streak 1 returns answer tier', () => {
    expect(getCelebrationTier(true, 1)).toBe('answer');
  });

  it('59. correct answer with streak 2 returns answer tier', () => {
    expect(getCelebrationTier(true, 2)).toBe('answer');
  });

  it('60. correct answer with streak 3 returns streak-3 tier', () => {
    expect(getCelebrationTier(true, 3)).toBe('streak-3');
  });

  it('61. correct answer with streak 4 returns answer tier (not multiple of 3)', () => {
    expect(getCelebrationTier(true, 4)).toBe('answer');
  });

  it('62. correct answer with streak 5 returns streak-5 tier', () => {
    expect(getCelebrationTier(true, 5)).toBe('streak-5');
  });

  it('63. correct answer with streak 6 returns streak-3 tier (multiple of 3, not 5)', () => {
    expect(getCelebrationTier(true, 6)).toBe('streak-3');
  });

  it('64. correct answer with streak 9 returns streak-3 tier', () => {
    expect(getCelebrationTier(true, 9)).toBe('streak-3');
  });

  it('65. correct answer with streak 10 returns streak-5 tier', () => {
    expect(getCelebrationTier(true, 10)).toBe('streak-5');
  });

  it('66. correct answer with streak 15 returns streak-5 tier (multiple of both, 5 wins)', () => {
    expect(getCelebrationTier(true, 15)).toBe('streak-5');
  });

  it('67. module complete with grade 100 returns perfect-score tier', () => {
    expect(getCelebrationTier(true, 3, true, 100)).toBe('perfect-score');
  });

  it('68. module complete with grade <100 returns module-complete tier', () => {
    expect(getCelebrationTier(true, 3, true, 80)).toBe('module-complete');
  });

  it('69. module complete + perfect score takes priority over streak-5', () => {
    expect(getCelebrationTier(true, 5, true, 100)).toBe('perfect-score');
  });

  it('70. module complete (not perfect) takes priority over streak-5', () => {
    expect(getCelebrationTier(true, 5, true, 80)).toBe('module-complete');
  });

  it('71. COMBO_STREAK_THRESHOLDS STREAK_3 is 3', () => {
    expect(COMBO_STREAK_THRESHOLDS.STREAK_3).toBe(3);
  });

  it('72. COMBO_STREAK_THRESHOLDS STREAK_5 is 5', () => {
    expect(COMBO_STREAK_THRESHOLDS.STREAK_5).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// 8. getStreakMessage
// ---------------------------------------------------------------------------

describe('V2-PILAR-3 — getStreakMessage', () => {
  it('73. streak-3 tier returns message with count', () => {
    expect(getStreakMessage('streak-3', 3)).toContain('3x');
    expect(getStreakMessage('streak-3', 3)).toContain('Hebat');
  });

  it('74. streak-5 tier returns escalated message with fire emoji', () => {
    expect(getStreakMessage('streak-5', 5)).toContain('🔥');
    expect(getStreakMessage('streak-5', 5)).toContain('5x');
  });

  it('75. answer tier returns null', () => {
    expect(getStreakMessage('answer', 1)).toBeNull();
  });

  it('76. null tier returns null', () => {
    expect(getStreakMessage(null, 0)).toBeNull();
  });

  it('77. module-complete tier returns null (not a streak message)', () => {
    expect(getStreakMessage('module-complete', 0)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 9. calculateProgressPercentage
// ---------------------------------------------------------------------------

describe('V2-PILAR-3 — calculateProgressPercentage', () => {
  it('78. 0 responses of 10 total returns 0', () => {
    expect(calculateProgressPercentage(0, 10)).toBe(0);
  });

  it('79. 5 responses of 10 total returns 50', () => {
    expect(calculateProgressPercentage(5, 10)).toBe(50);
  });

  it('80. 10 responses of 10 total returns 100', () => {
    expect(calculateProgressPercentage(10, 10)).toBe(100);
  });

  it('81. 0 total components returns 0', () => {
    expect(calculateProgressPercentage(0, 0)).toBe(0);
  });

  it('82. responses > total clamps to 100', () => {
    expect(calculateProgressPercentage(15, 10)).toBe(100);
  });

  it('83. rounds to nearest integer', () => {
    // 1/3 = 33.33% → 33
    expect(calculateProgressPercentage(1, 3)).toBe(33);
    // 2/3 = 66.66% → 67
    expect(calculateProgressPercentage(2, 3)).toBe(67);
  });
});

// ---------------------------------------------------------------------------
// 10. student-session-store
// ---------------------------------------------------------------------------

describe('V2-PILAR-3 — student-session-store', () => {
  beforeEach(() => {
    useStudentSessionStore.getState().resetSession();
  });

  it('84. store exposes recordResponse as a function', () => {
    expect(typeof useStudentSessionStore.getState().recordResponse).toBe('function');
  });

  it('85. store exposes resetResponse as a function', () => {
    expect(typeof useStudentSessionStore.getState().resetResponse).toBe('function');
  });

  it('86. store exposes resetSession as a function', () => {
    expect(typeof useStudentSessionStore.getState().resetSession).toBe('function');
  });

  it('87. recordResponse correct answer updates totalScoreEarned', () => {
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q1',
      slideId: 'slide1',
      isCorrect: true,
      scoreEarned: 10,
      maxScore: 10,
      studentAnswer: 'choice-a',
    });
    expect(useStudentSessionStore.getState().totalScoreEarned).toBe(10);
    expect(useStudentSessionStore.getState().totalMaxScore).toBe(10);
  });

  it('88. recordResponse wrong answer does not add to scoreEarned', () => {
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q1',
      slideId: 'slide1',
      isCorrect: false,
      scoreEarned: 0,
      maxScore: 10,
      studentAnswer: 'choice-b',
    });
    expect(useStudentSessionStore.getState().totalScoreEarned).toBe(0);
    expect(useStudentSessionStore.getState().totalMaxScore).toBe(10);
  });

  it('89. recordResponse multiple components accumulate scores', () => {
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: true, scoreEarned: 10, maxScore: 10, studentAnswer: 'a',
    });
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q2', slideId: 's1', isCorrect: false, scoreEarned: 0, maxScore: 5, studentAnswer: 'b',
    });
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q3', slideId: 's2', isCorrect: true, scoreEarned: 15, maxScore: 15, studentAnswer: 'c',
    });
    expect(useStudentSessionStore.getState().totalScoreEarned).toBe(25);
    expect(useStudentSessionStore.getState().totalMaxScore).toBe(30);
  });

  it('90. recordResponse returns celebration tier', () => {
    const tier = useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: true, scoreEarned: 10, maxScore: 10, studentAnswer: 'a',
    });
    expect(tier).toBe('answer');
  });

  it('91. recordResponse wrong answer returns null celebration', () => {
    const tier = useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: false, scoreEarned: 0, maxScore: 10, studentAnswer: 'b',
    });
    expect(tier).toBeNull();
  });

  it('92. recordResponse 3 correct answers in a row returns streak-3', () => {
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: true, scoreEarned: 10, maxScore: 10, studentAnswer: 'a',
    });
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q2', slideId: 's1', isCorrect: true, scoreEarned: 10, maxScore: 10, studentAnswer: 'b',
    });
    const tier3 = useStudentSessionStore.getState().recordResponse({
      componentId: 'q3', slideId: 's1', isCorrect: true, scoreEarned: 10, maxScore: 10, studentAnswer: 'c',
    });
    expect(tier3).toBe('streak-3');
    expect(useStudentSessionStore.getState().currentStreak).toBe(3);
  });

  it('93. wrong answer resets streak to 0', () => {
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: true, scoreEarned: 10, maxScore: 10, studentAnswer: 'a',
    });
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q2', slideId: 's1', isCorrect: true, scoreEarned: 10, maxScore: 10, studentAnswer: 'b',
    });
    expect(useStudentSessionStore.getState().currentStreak).toBe(2);
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q3', slideId: 's1', isCorrect: false, scoreEarned: 0, maxScore: 10, studentAnswer: 'x',
    });
    expect(useStudentSessionStore.getState().currentStreak).toBe(0);
  });

  it('94. maxStreak preserved after reset', () => {
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: true, scoreEarned: 10, maxScore: 10, studentAnswer: 'a',
    });
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q2', slideId: 's1', isCorrect: true, scoreEarned: 10, maxScore: 10, studentAnswer: 'b',
    });
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q3', slideId: 's1', isCorrect: true, scoreEarned: 10, maxScore: 10, studentAnswer: 'c',
    });
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q4', slideId: 's1', isCorrect: false, scoreEarned: 0, maxScore: 10, studentAnswer: 'x',
    });
    expect(useStudentSessionStore.getState().currentStreak).toBe(0);
    expect(useStudentSessionStore.getState().maxStreak).toBe(3);
  });

  it('95. re-answer same componentId overwrites old response', () => {
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: false, scoreEarned: 0, maxScore: 10, studentAnswer: 'wrong',
    });
    expect(useStudentSessionStore.getState().totalScoreEarned).toBe(0);
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: true, scoreEarned: 10, maxScore: 10, studentAnswer: 'correct',
    });
    expect(useStudentSessionStore.getState().totalScoreEarned).toBe(10);
    expect(Object.keys(useStudentSessionStore.getState().responses)).toHaveLength(1);
  });

  it('96. resetResponse removes single component response', () => {
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: true, scoreEarned: 10, maxScore: 10, studentAnswer: 'a',
    });
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q2', slideId: 's1', isCorrect: true, scoreEarned: 5, maxScore: 5, studentAnswer: 'b',
    });
    useStudentSessionStore.getState().resetResponse('q1');
    expect(useStudentSessionStore.getState().responses['q1']).toBeUndefined();
    expect(useStudentSessionStore.getState().responses['q2']).toBeDefined();
    expect(useStudentSessionStore.getState().totalScoreEarned).toBe(5);
    expect(useStudentSessionStore.getState().totalMaxScore).toBe(5);
  });

  it('97. resetSession clears all state', () => {
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: true, scoreEarned: 10, maxScore: 10, studentAnswer: 'a',
    });
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q2', slideId: 's1', isCorrect: true, scoreEarned: 10, maxScore: 10, studentAnswer: 'b',
    });
    useStudentSessionStore.getState().resetSession();
    expect(useStudentSessionStore.getState().responses).toEqual({});
    expect(useStudentSessionStore.getState().totalScoreEarned).toBe(0);
    expect(useStudentSessionStore.getState().totalMaxScore).toBe(0);
    expect(useStudentSessionStore.getState().currentStreak).toBe(0);
    expect(useStudentSessionStore.getState().maxStreak).toBe(0);
  });

  it('98. getFinalGrade returns correct grade', () => {
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: true, scoreEarned: 80, maxScore: 100, studentAnswer: 'a',
    });
    expect(useStudentSessionStore.getState().getFinalGrade()).toBe(80);
  });

  it('99. getFinalGrade returns 0 when no responses', () => {
    expect(useStudentSessionStore.getState().getFinalGrade()).toBe(0);
  });

  it('100. getBadgeTier returns gold for 90+ grade', () => {
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: true, scoreEarned: 90, maxScore: 100, studentAnswer: 'a',
    });
    expect(useStudentSessionStore.getState().getBadgeTier()).toBe('gold');
  });

  it('101. getBadgeTier returns silver for 70-89 grade', () => {
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: true, scoreEarned: 75, maxScore: 100, studentAnswer: 'a',
    });
    expect(useStudentSessionStore.getState().getBadgeTier()).toBe('silver');
  });

  it('102. getBadgeTier returns bronze for <70 grade', () => {
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: true, scoreEarned: 50, maxScore: 100, studentAnswer: 'a',
    });
    expect(useStudentSessionStore.getState().getBadgeTier()).toBe('bronze');
  });

  it('103. getProgressPercentage returns correct progress', () => {
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: true, scoreEarned: 10, maxScore: 10, studentAnswer: 'a',
    });
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q2', slideId: 's1', isCorrect: true, scoreEarned: 10, maxScore: 10, studentAnswer: 'b',
    });
    // 2 of 10 → 20%
    expect(useStudentSessionStore.getState().getProgressPercentage(10)).toBe(20);
  });

  it('104. isAnswered returns true for answered component', () => {
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: true, scoreEarned: 10, maxScore: 10, studentAnswer: 'a',
    });
    expect(useStudentSessionStore.getState().isAnswered('q1')).toBe(true);
    expect(useStudentSessionStore.getState().isAnswered('q2')).toBe(false);
  });

  it('105. getResponse returns response for componentId', () => {
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: true, scoreEarned: 10, maxScore: 10, studentAnswer: 'choice-x',
    });
    const response = useStudentSessionStore.getState().getResponse('q1');
    expect(response).toBeDefined();
    expect(response?.studentAnswer).toBe('choice-x');
    expect(response?.isCorrect).toBe(true);
    expect(response?.answeredAt).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 11. Re-answer scenario (overwrite, streak behavior)
// ---------------------------------------------------------------------------

describe('V2-PILAR-3 — Re-answer scenario', () => {
  beforeEach(() => {
    useStudentSessionStore.getState().resetSession();
  });

  it('106. re-answer from wrong to correct updates score and streak', () => {
    // First answer wrong
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: false, scoreEarned: 0, maxScore: 10, studentAnswer: 'wrong',
    });
    expect(useStudentSessionStore.getState().currentStreak).toBe(0);
    expect(useStudentSessionStore.getState().totalScoreEarned).toBe(0);

    // Re-answer correct
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: true, scoreEarned: 10, maxScore: 10, studentAnswer: 'correct',
    });
    expect(useStudentSessionStore.getState().totalScoreEarned).toBe(10);
    expect(useStudentSessionStore.getState().currentStreak).toBe(1);
  });

  it('107. re-answer from correct to wrong subtracts score and resets streak', () => {
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: true, scoreEarned: 10, maxScore: 10, studentAnswer: 'a',
    });
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q2', slideId: 's1', isCorrect: true, scoreEarned: 10, maxScore: 10, studentAnswer: 'b',
    });
    expect(useStudentSessionStore.getState().currentStreak).toBe(2);
    expect(useStudentSessionStore.getState().totalScoreEarned).toBe(20);

    // Re-answer q1 to wrong
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: false, scoreEarned: 0, maxScore: 10, studentAnswer: 'x',
    });
    expect(useStudentSessionStore.getState().totalScoreEarned).toBe(10);
    expect(useStudentSessionStore.getState().currentStreak).toBe(0);
  });

  it('108. answeredAt timestamp is set on recordResponse', () => {
    const before = Date.now();
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: true, scoreEarned: 10, maxScore: 10, studentAnswer: 'a',
    });
    const after = Date.now();
    const response = useStudentSessionStore.getState().getResponse('q1');
    expect(response?.answeredAt).toBeGreaterThanOrEqual(before);
    expect(response?.answeredAt).toBeLessThanOrEqual(after);
  });
});
