/**
 * SessionDashboard — V2-PILAR-3 dashboard ringkasan akhir.
 *
 * Layer: components (React, preview-only)
 *
 * Render di slide terakhir (closing page) menampilkan:
 *   - Circular SVG progress bar (nilai akhir 0-100)
 *   - Badge tier (gold/silver/bronze) dengan icon + label
 *   - Stats: totalScoreEarned, totalMaxScore, maxStreak, progressPercentage
 *
 * Pure CSS + SVG. No library. Uses CSS dari buildCelebrationBurstCss().
 */

import { useStudentSessionStore } from '../store/student-session-store';
import { getBadgeTier, getBadgeLabel, getBadgeIcon, calculateFinalGrade, calculateProgressPercentage } from '../core/scoring/scoring-session';

export function SessionDashboard({ totalScoringComponents }: { totalScoringComponents: number }) {
  const totalScoreEarned = useStudentSessionStore((s) => s.totalScoreEarned);
  const totalMaxScore = useStudentSessionStore((s) => s.totalMaxScore);
  const maxStreak = useStudentSessionStore((s) => s.maxStreak);
  const responsesCount = useStudentSessionStore((s) => Object.keys(s.responses).length);

  const finalGrade = calculateFinalGrade(totalScoreEarned, totalMaxScore);
  const badgeTier = getBadgeTier(finalGrade);
  const badgeLabel = getBadgeLabel(badgeTier);
  const badgeIcon = getBadgeIcon(badgeTier);
  const progressPercent = calculateProgressPercentage(responsesCount, totalScoringComponents);

  // SVG circular progress calculation
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (finalGrade / 100) * circumference;

  return (
    <div className="silse-dashboard" data-testid="session-dashboard">
      {/* Circular Progress Bar */}
      <div className="silse-dashboard__circle" data-testid="dashboard-circle">
        <svg className="silse-dashboard__svg" viewBox="0 0 200 200">
          <circle
            className="silse-dashboard__track"
            cx="100"
            cy="100"
            r={radius}
          />
          <circle
            className="silse-dashboard__progress"
            cx="100"
            cy="100"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            data-testid="dashboard-progress-circle"
            data-final-grade={finalGrade}
          />
        </svg>
        <div className="silse-dashboard__grade">
          <div className="silse-dashboard__grade-number" data-testid="dashboard-grade-number">
            {finalGrade}
          </div>
          <div className="silse-dashboard__grade-label">Nilai Akhir</div>
        </div>
      </div>

      {/* Badge */}
      <div
        className={`silse-dashboard__badge silse-dashboard__badge-tier-${badgeTier}`}
        data-testid="dashboard-badge"
        data-badge-tier={badgeTier}
      >
        <div className="silse-dashboard__badge-icon" data-testid="dashboard-badge-icon">
          {badgeIcon}
        </div>
        <div className="silse-dashboard__badge-label" data-testid="dashboard-badge-label">
          {badgeLabel}
        </div>
      </div>

      {/* Stats */}
      <div className="silse-dashboard__stats">
        <div className="silse-dashboard__stat">
          <div className="silse-dashboard__stat-value" data-testid="dashboard-stat-score">
            {totalScoreEarned}/{totalMaxScore}
          </div>
          <div className="silse-dashboard__stat-label">Skor</div>
        </div>
        <div className="silse-dashboard__stat">
          <div className="silse-dashboard__stat-value" data-testid="dashboard-stat-progress">
            {progressPercent}%
          </div>
          <div className="silse-dashboard__stat-label">Selesai</div>
        </div>
        <div className="silse-dashboard__stat">
          <div className="silse-dashboard__stat-value" data-testid="dashboard-stat-streak">
            {maxStreak}x
          </div>
          <div className="silse-dashboard__stat-label">Streak Tertinggi</div>
        </div>
      </div>
    </div>
  );
}
