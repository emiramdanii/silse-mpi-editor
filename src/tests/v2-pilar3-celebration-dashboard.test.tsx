/**
 * V2-PILAR-3 Commit 2: Tests for celebration + dashboard + export runtime.
 *
 * Coverage:
 *   1. Celebration utility functions (triggerLocalBurst, triggerFullScreenBurst,
 *      triggerStreakIndicator, triggerCelebration)
 *   2. Export HTML contains scoring JS engine (StudentSession, sanitizeAnswer,
 *      calculateFinalGrade, getBadgeTier, recordResponse)
 *   3. Export HTML contains celebration JS (triggerLocalBurst, triggerFullScreenBurst,
 *      triggerStreakIndicator, triggerCelebration)
 *   4. Export HTML contains CSS burst classes (.silse-particle, .silse-burst-local, etc)
 *   5. Export HTML dispatches custom events on quiz/input answer
 *   6. SessionDashboard component renders correctly (grade, badge, stats)
 *   7. Integration: quiz answer → recordResponse → celebration (via event)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { exportProjectToHtml } from '../export/export-html';
import { useStudentSessionStore } from '../store/student-session-store';
import { useEditorStore } from '../store/editor-store';
import { SessionDashboard } from '../components/SessionDashboard';
import { createProject } from '../core/project-factory';

// Helper: buat project dengan question + closing page
function makeProjectWithQuestion() {
  useEditorStore.getState().resetProject();
  const store = useEditorStore.getState();
  // Add free page with question
  store.addPage({ role: 'free', title: 'Quiz Slide' });
  store.selectPage(useEditorStore.getState().project.pages[1].id);
  store.deletePage(useEditorStore.getState().project.pages[0].id);
  // Add question
  store.addQuestionComponent({
    title: 'Test Q',
    prompt: 'Berapa 2+2?',
    choices: [
      { id: 'a', text: '3' },
      { id: 'b', text: '4' },
    ],
    correctChoiceIndex: 1,
    points: 10,
  });
  // Add closing page
  store.addPage({ role: 'closing', title: 'Selesai' });
  return useEditorStore.getState().project;
}

// ---------------------------------------------------------------------------
// 1. Celebration utility functions
// ---------------------------------------------------------------------------

describe('V2-PILAR-3 Commit 2 — Celebration utility', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('1. triggerLocalBurst creates particle elements', async () => {
    const { triggerLocalBurst } = await import('../core/scoring/celebration');
    const origin = document.createElement('button');
    document.body.appendChild(origin);
    triggerLocalBurst(origin, undefined, 5);
    const particles = origin.querySelectorAll('.silse-particle');
    expect(particles.length).toBe(5);
  });

  it('2. triggerLocalBurst sets --tx and --ty custom properties', async () => {
    const { triggerLocalBurst } = await import('../core/scoring/celebration');
    const origin = document.createElement('button');
    document.body.appendChild(origin);
    triggerLocalBurst(origin, undefined, 3);
    const particles = origin.querySelectorAll('.silse-particle');
    expect(particles.length).toBe(3);
    particles.forEach((p) => {
      const tx = (p as HTMLElement).style.getPropertyValue('--tx');
      const ty = (p as HTMLElement).style.getPropertyValue('--ty');
      expect(tx).toMatch(/px/);
      expect(ty).toMatch(/px/);
    });
  });

  it('3. triggerFullScreenBurst creates fullscreen burst in centralized container', async () => {
    const { triggerFullScreenBurst } = await import('../core/scoring/celebration');
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.width = '1280px';
    container.style.height = '720px';
    document.body.appendChild(container);
    triggerFullScreenBurst(container, undefined, 10);
    // PATCH: particles now go in centralized container, not .silse-burst-fullscreen overlay
    const celebContainer = container.querySelector('#silse-celebration-container');
    expect(celebContainer).not.toBeNull();
    const particles = celebContainer!.querySelectorAll('.silse-particle-fullscreen');
    expect(particles.length).toBe(10);
  });

  it('4. triggerStreakIndicator creates indicator with message', async () => {
    const { triggerStreakIndicator } = await import('../core/scoring/celebration');
    const container = document.createElement('div');
    document.body.appendChild(container);
    triggerStreakIndicator(container, '3x Berturut-turut!', false);
    const indicator = container.querySelector('.silse-streak-indicator');
    expect(indicator).not.toBeNull();
    expect(indicator?.textContent).toContain('3x Berturut-turut');
    expect(indicator?.classList.contains('is-streak-5')).toBe(false);
  });

  it('5. triggerStreakIndicator with isStreak5 adds is-streak-5 class', async () => {
    const { triggerStreakIndicator } = await import('../core/scoring/celebration');
    const container = document.createElement('div');
    document.body.appendChild(container);
    triggerStreakIndicator(container, '5x STREAK!', true);
    const indicator = container.querySelector('.silse-streak-indicator');
    expect(indicator?.classList.contains('is-streak-5')).toBe(true);
  });

  it('6. triggerCelebration with null tier does nothing', async () => {
    const { triggerCelebration } = await import('../core/scoring/celebration');
    const container = document.createElement('div');
    document.body.appendChild(container);
    triggerCelebration(null, null, container, undefined, 0);
    expect(container.children.length).toBe(0);
  });

  it('7. triggerCelebration with answer tier creates local burst', async () => {
    const { triggerCelebration } = await import('../core/scoring/celebration');
    const origin = document.createElement('button');
    const container = document.createElement('div');
    container.appendChild(origin);
    document.body.appendChild(container);
    triggerCelebration('answer', origin, container, undefined, 1);
    const particles = origin.querySelectorAll('.silse-particle');
    expect(particles.length).toBeGreaterThan(0);
  });

  it('8. triggerCelebration with module-complete creates fullscreen burst', async () => {
    const { triggerCelebration } = await import('../core/scoring/celebration');
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.width = '1280px';
    container.style.height = '720px';
    document.body.appendChild(container);
    triggerCelebration('module-complete', null, container, undefined, 0);
    // PATCH: particles now in centralized container
    const celebContainer = container.querySelector('#silse-celebration-container');
    expect(celebContainer).not.toBeNull();
    const particles = celebContainer!.querySelectorAll('.silse-particle-fullscreen');
    expect(particles.length).toBeGreaterThan(0);
  });

  it('9. triggerCelebration with perfect-score creates fullscreen burst', async () => {
    const { triggerCelebration } = await import('../core/scoring/celebration');
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.width = '1280px';
    container.style.height = '720px';
    document.body.appendChild(container);
    triggerCelebration('perfect-score', null, container, undefined, 0);
    // PATCH: particles now in centralized container
    const celebContainer = container.querySelector('#silse-celebration-container');
    expect(celebContainer).not.toBeNull();
    const particles = celebContainer!.querySelectorAll('.silse-particle-fullscreen');
    expect(particles.length).toBeGreaterThan(0);
  });

  it('10. triggerCelebration with streak-3 creates local burst + indicator', async () => {
    const { triggerCelebration } = await import('../core/scoring/celebration');
    const origin = document.createElement('button');
    const container = document.createElement('div');
    container.appendChild(origin);
    document.body.appendChild(container);
    triggerCelebration('streak-3', origin, container, undefined, 3);
    const particles = origin.querySelectorAll('.silse-particle');
    expect(particles.length).toBeGreaterThan(0);
    const indicator = container.querySelector('.silse-streak-indicator');
    expect(indicator).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 2. Export HTML contains scoring JS engine
// ---------------------------------------------------------------------------

describe('V2-PILAR-3 Commit 2 — Export HTML scoring JS', () => {
  it('11. export HTML contains StudentSession global object', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('var StudentSession');
    expect(html).toContain('totalScoreEarned');
    expect(html).toContain('totalMaxScore');
    expect(html).toContain('currentStreak');
    expect(html).toContain('maxStreak');
  });

  it('12. export HTML contains sanitizeAnswer function', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('function sanitizeAnswer');
  });

  it('13. export HTML contains calculateFinalGrade function', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('function calculateFinalGrade');
  });

  it('14. export HTML contains getBadgeTier function', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('function getBadgeTier');
  });

  it('15. export HTML contains recordResponse function', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('function recordResponse');
  });

  it('16. export HTML contains badge threshold 90 for gold', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    expect(html).toMatch(/grade >= 90/);
  });

  it('17. export HTML contains badge threshold 70 for silver', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    expect(html).toMatch(/grade >= 70/);
  });
});

// ---------------------------------------------------------------------------
// 3. Export HTML contains celebration JS
// ---------------------------------------------------------------------------

describe('V2-PILAR-3 Commit 2 — Export HTML celebration JS', () => {
  it('18. export HTML contains triggerLocalBurst function', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('function triggerLocalBurst');
  });

  it('19. export HTML contains triggerFullScreenBurst function', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('function triggerFullScreenBurst');
  });

  it('20. export HTML contains triggerStreakIndicator function', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('function triggerStreakIndicator');
  });

  it('21. export HTML contains triggerCelebration function', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('function triggerCelebration');
  });

  it('22. export HTML contains silse:quiz-answer event listener', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain("silse:quiz-answer");
  });

  it('23. export HTML contains silse:input-field-answer event listener', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain("silse:input-field-answer");
  });

  it('24. export HTML dispatches silse:quiz-answer on choice click', () => {
    const project = makeProjectWithQuestion();
    const html = exportProjectToHtml(project);
    expect(html).toContain("new CustomEvent('silse:quiz-answer'");
  });

  it('25. export HTML contains prefers-reduced-motion check in celebration', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    expect(html).toMatch(/prefers-reduced-motion.*reduce/);
  });
});

// ---------------------------------------------------------------------------
// 4. Export HTML contains CSS burst classes
// ---------------------------------------------------------------------------

describe('V2-PILAR-3 Commit 2 — Export HTML CSS burst classes', () => {
  it('26. export HTML contains .silse-particle class', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('.silse-particle');
  });

  it('27. export HTML contains .silse-burst-local class', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('.silse-burst-local');
  });

  it('28. export HTML contains .silse-burst-fullscreen class', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('.silse-burst-fullscreen');
  });

  it('29. export HTML contains .silse-streak-indicator class', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('.silse-streak-indicator');
  });

  it('30. export HTML contains @keyframes silse-burst-particle', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('@keyframes silse-burst-particle');
  });

  it('31. export HTML contains .silse-dashboard class', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('.silse-dashboard');
  });

  it('32. export HTML contains badge tier classes (gold/silver/bronze)', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-dashboard__badge-tier-gold');
    expect(html).toContain('silse-dashboard__badge-tier-silver');
    expect(html).toContain('silse-dashboard__badge-tier-bronze');
  });

  it('33. export HTML contains prefers-reduced-motion media query for burst', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    // Check both strings exist in HTML
    expect(html).toContain('prefers-reduced-motion');
    expect(html).toContain('silse-particle');
    // Check that the burst media query block exists (contains both particle + animation none)
    expect(html).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(html).toMatch(/\.silse-particle[^{]*\{[^}]*animation:\s*none/);
  });
});

// ---------------------------------------------------------------------------
// 5. SessionDashboard component
// ---------------------------------------------------------------------------

describe('V2-PILAR-3 Commit 2 — SessionDashboard component', () => {
  beforeEach(() => {
    useStudentSessionStore.getState().resetSession();
  });

  it('34. dashboard renders with grade number', () => {
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: true, scoreEarned: 80, maxScore: 100, studentAnswer: 'a',
    });
    const { container } = render(React.createElement(SessionDashboard, { totalScoringComponents: 1 }));
    expect(container.querySelector('[data-testid="session-dashboard"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="dashboard-grade-number"]')?.textContent).toBe('80');
  });

  it('35. dashboard shows gold badge for grade >= 90', () => {
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: true, scoreEarned: 90, maxScore: 100, studentAnswer: 'a',
    });
    const { container } = render(React.createElement(SessionDashboard, { totalScoringComponents: 1 }));
    const badge = container.querySelector('[data-testid="dashboard-badge"]');
    expect(badge?.getAttribute('data-badge-tier')).toBe('gold');
    expect(container.querySelector('[data-testid="dashboard-badge-icon"]')?.textContent).toBe('🥇');
  });

  it('36. dashboard shows silver badge for grade 70-89', () => {
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: true, scoreEarned: 75, maxScore: 100, studentAnswer: 'a',
    });
    const { container } = render(React.createElement(SessionDashboard, { totalScoringComponents: 1 }));
    const badge = container.querySelector('[data-testid="dashboard-badge"]');
    expect(badge?.getAttribute('data-badge-tier')).toBe('silver');
    expect(container.querySelector('[data-testid="dashboard-badge-icon"]')?.textContent).toBe('🥈');
  });

  it('37. dashboard shows bronze badge for grade < 70', () => {
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: true, scoreEarned: 50, maxScore: 100, studentAnswer: 'a',
    });
    const { container } = render(React.createElement(SessionDashboard, { totalScoringComponents: 1 }));
    const badge = container.querySelector('[data-testid="dashboard-badge"]');
    expect(badge?.getAttribute('data-badge-tier')).toBe('bronze');
    expect(container.querySelector('[data-testid="dashboard-badge-icon"]')?.textContent).toBe('🥉');
  });

  it('38. dashboard shows score stats', () => {
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: true, scoreEarned: 80, maxScore: 100, studentAnswer: 'a',
    });
    const { container } = render(React.createElement(SessionDashboard, { totalScoringComponents: 1 }));
    const score = container.querySelector('[data-testid="dashboard-stat-score"]');
    expect(score?.textContent).toBe('80/100');
  });

  it('39. dashboard shows progress percentage', () => {
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: true, scoreEarned: 80, maxScore: 100, studentAnswer: 'a',
    });
    const { container } = render(React.createElement(SessionDashboard, { totalScoringComponents: 4 }));
    const progress = container.querySelector('[data-testid="dashboard-stat-progress"]');
    expect(progress?.textContent).toBe('25%');
  });

  it('40. dashboard shows max streak', () => {
    // 3 correct answers in a row
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: true, scoreEarned: 10, maxScore: 10, studentAnswer: 'a',
    });
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q2', slideId: 's1', isCorrect: true, scoreEarned: 10, maxScore: 10, studentAnswer: 'b',
    });
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q3', slideId: 's1', isCorrect: true, scoreEarned: 10, maxScore: 10, studentAnswer: 'c',
    });
    const { container } = render(React.createElement(SessionDashboard, { totalScoringComponents: 3 }));
    const streak = container.querySelector('[data-testid="dashboard-stat-streak"]');
    expect(streak?.textContent).toBe('3x');
  });

  it('41. dashboard renders SVG progress circle', () => {
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: true, scoreEarned: 50, maxScore: 100, studentAnswer: 'a',
    });
    const { container } = render(React.createElement(SessionDashboard, { totalScoringComponents: 1 }));
    const circle = container.querySelector('[data-testid="dashboard-progress-circle"]');
    expect(circle).not.toBeNull();
    expect(circle?.getAttribute('data-final-grade')).toBe('50');
  });

  it('42. dashboard badge label matches tier', () => {
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: true, scoreEarned: 95, maxScore: 100, studentAnswer: 'a',
    });
    const { container } = render(React.createElement(SessionDashboard, { totalScoringComponents: 1 }));
    const label = container.querySelector('[data-testid="dashboard-badge-label"]');
    expect(label?.textContent).toBe('Excellent');
  });
});

// ---------------------------------------------------------------------------
// 6. Integration: quiz answer → recordResponse → celebration
// ---------------------------------------------------------------------------

describe('V2-PILAR-3 Commit 2 — Integration quiz → session', () => {
  beforeEach(() => {
    useStudentSessionStore.getState().resetSession();
  });

  it('43. quiz answer correct updates session score', () => {
    const tier = useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: true, scoreEarned: 10, maxScore: 10, studentAnswer: 'b',
    });
    expect(tier).toBe('answer');
    expect(useStudentSessionStore.getState().totalScoreEarned).toBe(10);
    expect(useStudentSessionStore.getState().currentStreak).toBe(1);
  });

  it('44. 3 correct answers in a row trigger streak-3 celebration', () => {
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
  });

  it('45. wrong answer resets streak and returns null celebration', () => {
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q1', slideId: 's1', isCorrect: true, scoreEarned: 10, maxScore: 10, studentAnswer: 'a',
    });
    useStudentSessionStore.getState().recordResponse({
      componentId: 'q2', slideId: 's1', isCorrect: true, scoreEarned: 10, maxScore: 10, studentAnswer: 'b',
    });
    const tierWrong = useStudentSessionStore.getState().recordResponse({
      componentId: 'q3', slideId: 's1', isCorrect: false, scoreEarned: 0, maxScore: 10, studentAnswer: 'x',
    });
    expect(tierWrong).toBeNull();
    expect(useStudentSessionStore.getState().currentStreak).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 7. Export HTML ES5 compatibility (no optional chaining/nullish coalescing)
// ---------------------------------------------------------------------------

describe('V2-PILAR-3 Commit 2 — Export JS ES5 compatibility', () => {
  it('46. export JS does not use optional chaining (?.) in scoring functions', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    // Check that StudentSession + scoring functions don't use ?.
    // Extract the scoring section
    const scoringStart = html.indexOf('var StudentSession');
    const scoringEnd = html.indexOf('wireInteractions();');
    const scoringSection = html.substring(scoringStart, scoringEnd);
    // Optional chaining should not appear in scoring section
    // (it may appear elsewhere in legacy code, but not in our new scoring code)
    expect(scoringSection).not.toContain('?.');
  });

  it('47. export JS does not use nullish coalescing (??) in scoring functions', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    const scoringStart = html.indexOf('var StudentSession');
    const scoringEnd = html.indexOf('wireInteractions();');
    const scoringSection = html.substring(scoringStart, scoringEnd);
    expect(scoringSection).not.toContain('??');
  });

  it('48. export JS uses var (not const/let) in scoring functions', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    const scoringStart = html.indexOf('var StudentSession');
    const scoringEnd = html.indexOf('wireInteractions();');
    const scoringSection = html.substring(scoringStart, scoringEnd);
    // Should use var, not const/let
    expect(scoringSection).not.toMatch(/\bconst\b/);
    expect(scoringSection).not.toMatch(/\blet\b/);
  });
});
