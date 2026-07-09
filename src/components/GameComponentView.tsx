/**
 * GameComponentView — renderer for GameComponent (missionQuiz).
 *
 * M11A scope: render game with missions, choices, feedback, score, retry.
 * COMPONENT-SKIN-V2: skinClass prop for visual skin based on style pack.
 *
 * MPI-JSON-SCENE-PROOF-01: jika component.sceneMetadata?.scene === 'game-mission',
 * render sebagai "scene misi" (briefing + target + action cards + feedback + reward),
 * BUKAN list pertanyaan. Scene intent di-preserve dari AI JSON blueprint.
 *
 * UX Contract: Game answer option text must NOT be clipped.
 *   - No white-space: nowrap
 *   - No text-overflow clip
 *   - min-height + padding + overflow-wrap: anywhere
 */

import type { CSSProperties } from 'react';
import type { GameComponent } from '../core/types';
import type { ResolvedComponentStyle } from '../core/style/resolveComponentStyle';
import { isGameMissionScene } from '../core/ai-mpi-json';

export type GameComponentViewProps = {
  component: GameComponent;
  resolvedStyle: ResolvedComponentStyle;
  selected?: boolean;
  onSelect?: (componentId: string) => void;
  onAnswer?: (missionIndex: number, choiceIndex: number) => void;
  onNextMission?: () => void;
  onRetry?: () => void;
  gameState?: {
    currentMissionIndex: number;
    selectedChoiceIndex: number | null;
    isAnswered: boolean;
    score: number;
    completed: boolean;
  };
  positionMode?: 'absolute' | 'fill';
  /** COMPONENT-SKIN-V2: CSS class for visual skin (e.g. skin-game-calm). */
  skinClass?: string;
};

export function GameComponentView({
  component,
  resolvedStyle,
  selected,
  onSelect,
  onAnswer,
  onNextMission,
  onRetry,
  gameState,
  positionMode = 'absolute',
  skinClass,
}: GameComponentViewProps) {
  const isFill = positionMode === 'fill';
  const gs = gameState ?? { currentMissionIndex: 0, selectedChoiceIndex: null, isAnswered: false, score: 0, completed: false };

  const containerStyle: CSSProperties = isFill
    ? {
        position: 'relative', left: 0, top: 0, width: '100%', height: '100%',
        ...resolvedStyle.inlineStyle,
        boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 8,
        overflow: 'hidden', padding: 12,
        color: 'var(--silse-color-text, var(--color-text))',
        outline: selected ? '2px solid var(--silse-color-primary, var(--color-accent))' : 'none', outlineOffset: 2, cursor: 'pointer',
      }
    : {
        position: 'absolute', left: component.x, top: component.y,
        width: component.width, height: component.height,
        ...resolvedStyle.inlineStyle,
        boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 8,
        overflow: 'hidden', padding: 12,
        color: 'var(--silse-color-text, var(--color-text))',
        outline: selected ? '2px solid var(--silse-color-primary, var(--color-accent))' : 'none', outlineOffset: 2, cursor: 'pointer',
      };

  const choiceStyle: CSSProperties = {
    padding: '10px 14px', minHeight: 44, height: 'auto',
    border: '1px solid var(--silse-color-border, var(--color-border))', borderRadius: 6, cursor: onAnswer ? 'pointer' : 'default',
    fontSize: 14, lineHeight: 1.5, color: 'var(--silse-color-text, var(--color-text))',
    whiteSpace: 'normal', overflowWrap: 'anywhere',
    wordBreak: 'break-word', display: 'flex', alignItems: 'flex-start', gap: 8,
  };

  // MPI-JSON-SCENE-PROOF-01: render sebagai scene misi jika sceneMetadata ada.
  if (isGameMissionScene(component)) {
    return (
      <GameMissionSceneView
        component={component}
        containerStyle={containerStyle}
        skinClass={skinClass}
        gs={gs}
        onSelect={onSelect}
        onAnswer={onAnswer}
        onNextMission={onNextMission}
        onRetry={onRetry}
      />
    );
  }

  if (gs.completed) {
    return (
      <div data-component-id={component.id} data-component-type="game" className={skinClass} style={containerStyle}
        onClick={(e) => { e.stopPropagation(); onSelect?.(component.id); }}>
        <strong style={{ fontSize: 18 }}>Game Selesai!</strong>
        <div style={{ fontSize: 16, marginTop: 8 }}>Skor: {gs.score}</div>
        <button onClick={(e) => { e.stopPropagation(); onRetry?.(); }} style={{ marginTop: 12, padding: '8px 16px' }}>
          Ulangi Game
        </button>
      </div>
    );
  }

  const mission = component.missions[gs.currentMissionIndex];
  if (!mission) return null;

  const isCorrect = (idx: number) => gs.isAnswered && idx === mission.correctChoiceIndex;
  const isSelected = (idx: number) => gs.selectedChoiceIndex === idx;

  return (
    <div data-component-id={component.id} data-component-type="game" className={skinClass} style={containerStyle}
      onClick={(e) => { e.stopPropagation(); onSelect?.(component.id); }}>
      <strong style={{ fontSize: 16 }}>{component.title}</strong>
      <div style={{ fontSize: 13, color: 'var(--silse-color-muted-text, var(--color-muted))', whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
        {component.instruction}
      </div>
      <div style={{ fontSize: 12, color: 'var(--silse-color-muted-text, var(--color-muted))' }}>
        Misi {gs.currentMissionIndex + 1} / {component.missions.length} · Skor: {gs.score}
      </div>
      <div style={{ fontSize: 15, fontWeight: 500, marginTop: 4, whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
        {mission.prompt}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {mission.choices.map((choice, idx) => {
          let bg = 'var(--silse-color-surface, var(--color-panel))';
          if (gs.isAnswered && isCorrect(idx)) bg = 'var(--silse-color-success, var(--color-success-soft))';
          else if (gs.isAnswered && isSelected(idx) && !isCorrect(idx)) bg = 'var(--silse-color-danger, var(--color-danger-soft))';
          else if (isSelected(idx)) bg = 'var(--silse-color-primary, var(--color-accent-soft))';
          return (
            <div key={choice.id} data-choice-index={idx}
              onClick={(e) => { e.stopPropagation(); onAnswer?.(gs.currentMissionIndex, idx); }}
              style={{ ...choiceStyle, backgroundColor: bg }}>
              <span className="silse-choice-letter" style={{ fontWeight: 'bold', minWidth: 20 }}>{String.fromCharCode(65 + idx)}.</span>
              <span style={{ flex: 1, whiteSpace: 'normal', overflowWrap: 'anywhere' }}>{choice.text}</span>
            </div>
          );
        })}
      </div>
      {gs.isAnswered && (
        <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 6, fontSize: 13,
          backgroundColor: gs.selectedChoiceIndex === mission.correctChoiceIndex
            ? 'var(--silse-color-success, var(--color-success-soft))'
            : 'var(--silse-color-danger, var(--color-danger-soft))',
          color: gs.selectedChoiceIndex === mission.correctChoiceIndex
            ? 'var(--silse-color-success, var(--color-success))'
            : 'var(--silse-color-danger, var(--color-danger))',
          whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
          {gs.selectedChoiceIndex === mission.correctChoiceIndex ? mission.feedbackCorrect : mission.feedbackWrong}
        </div>
      )}
      {gs.isAnswered && gs.currentMissionIndex < component.missions.length - 1 && (
        <button onClick={(e) => { e.stopPropagation(); onNextMission?.(); }} style={{ marginTop: 8, padding: '8px 16px' }}>
          Misi Berikutnya
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MPI-JSON-SCENE-PROOF-01 — GameMissionSceneView
//
// Renderer khusus untuk game-mission scene. Tampil sebagai:
//   briefing misi → target misi → kartu aksi → feedback → reward/lencana
//
// BUKAN: judul + pertanyaan + list opsi.
//
// Style sederhana, fokus pada struktur scene. Tidak ada style pack baru,
// tidak ada dependency baru. Hanya structural CSS classes.
// ---------------------------------------------------------------------------

type GameMissionSceneViewProps = {
  component: GameComponent;
  containerStyle: CSSProperties;
  skinClass?: string;
  gs: {
    currentMissionIndex: number;
    selectedChoiceIndex: number | null;
    isAnswered: boolean;
    score: number;
    completed: boolean;
  };
  onSelect?: (componentId: string) => void;
  onAnswer?: (missionIndex: number, choiceIndex: number) => void;
  onNextMission?: () => void;
  onRetry?: () => void;
};

function GameMissionSceneView({
  component,
  containerStyle,
  skinClass,
  gs,
  onSelect,
  onAnswer,
  onNextMission,
  onRetry,
}: GameMissionSceneViewProps) {
  const sceneMeta = component.sceneMetadata!;
  const mission = component.missions[gs.currentMissionIndex];
  if (!mission) return null;

  const isCorrect = (idx: number) => gs.isAnswered && idx === mission.correctChoiceIndex;
  const isSelected = (idx: number) => gs.selectedChoiceIndex === idx;
  const answeredCorrectly = gs.isAnswered && gs.selectedChoiceIndex === mission.correctChoiceIndex;

  // Completed state: tampilkan reward/lencana
  if (gs.completed) {
    return (
      <div
        data-component-id={component.id}
        data-component-type="game"
        data-game-scene="game-mission"
        className={`silse-game-scene ${skinClass ?? ''}`.trim()}
        style={containerStyle}
        onClick={(e) => { e.stopPropagation(); onSelect?.(component.id); }}
      >
        <div className="silse-game-reward" data-testid="silse-game-reward" style={rewardStyle}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
          <strong style={{ fontSize: 20, display: 'block', marginBottom: 4, color: 'var(--silse-color-text, var(--color-text))' }}>
            {sceneMeta.reward?.label ?? 'Misi Selesai'}
          </strong>
          <div style={{ fontSize: 14, color: 'var(--silse-color-muted-text, var(--color-text-soft))' }}>
            Skor akhir: {gs.score}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onRetry?.(); }}
          style={{ marginTop: 12, padding: '8px 16px', alignSelf: 'center' }}
        >
          Ulangi Misi
        </button>
      </div>
    );
  }

  return (
    <div
      data-component-id={component.id}
      data-component-type="game"
      data-game-scene="game-mission"
      className={`silse-game-scene ${skinClass ?? ''}`.trim()}
      style={containerStyle}
      onClick={(e) => { e.stopPropagation(); onSelect?.(component.id); }}
    >
      {/* Briefing misi */}
      <div className="silse-game-briefing" data-testid="silse-game-briefing" style={briefingStyle}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--silse-color-warning, var(--color-warning))', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
          📋 Briefing Misi
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--silse-color-text, var(--color-text))', whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
          {sceneMeta.briefing ?? component.instruction}
        </div>
      </div>

      {/* Target misi */}
      <div className="silse-game-target" data-testid="silse-game-target" style={targetStyle}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--silse-color-primary, var(--color-accent))', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
          🎯 Target Misi
        </div>
        <div style={{ fontSize: 14, color: 'var(--silse-color-text, var(--color-text-soft))', whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
          {sceneMeta.missionTarget ?? mission.prompt}
        </div>
      </div>

      {/* Action cards */}
      <div
        className="silse-game-action-grid"
        data-testid="silse-game-action-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginTop: 4 }}
      >
        {mission.choices.map((choice, idx) => {
          let bg = 'var(--silse-color-surface, var(--color-panel))';
          let borderColor = 'var(--silse-color-border, var(--color-border))';
          if (gs.isAnswered && isCorrect(idx)) { bg = 'var(--silse-color-success, var(--color-success-soft))'; borderColor = 'var(--silse-color-success, var(--color-success))'; }
          else if (gs.isAnswered && isSelected(idx) && !isCorrect(idx)) { bg = 'var(--silse-color-danger, var(--color-danger-soft))'; borderColor = 'var(--silse-color-danger, var(--color-danger))'; }
          else if (isSelected(idx)) { bg = 'var(--silse-color-primary, var(--color-accent-soft))'; borderColor = 'var(--silse-color-primary, var(--color-accent))'; }

          return (
            <div
              key={choice.id}
              className="silse-game-action-card"
              data-testid="silse-game-action-card"
              data-choice-index={idx}
              onClick={(e) => { e.stopPropagation(); onAnswer?.(gs.currentMissionIndex, idx); }}
              style={{
                padding: '12px 14px',
                minHeight: 64,
                height: 'auto',
                background: bg,
                border: `2px solid ${borderColor}`,
                borderRadius: 12,
                cursor: onAnswer ? 'pointer' : 'default',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--silse-color-text, var(--color-text))',
                lineHeight: 1.4,
                whiteSpace: 'normal',
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  display: 'inline-grid', placeItems: 'center',
                  minWidth: 28, height: 28, borderRadius: 8,
                  background: 'var(--silse-color-primary, var(--color-accent))', color: 'var(--silse-color-surface, var(--color-panel))',
                  fontSize: 13, fontWeight: 900, flexShrink: 0,
                }}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--silse-color-muted-text, var(--color-muted))', textTransform: 'uppercase' }}>
                  Aksi
                </span>
              </div>
              <span style={{ flex: 1 }}>{choice.text}</span>
            </div>
          );
        })}
      </div>

      {/* Feedback */}
      {gs.isAnswered && (
        <div
          className="silse-game-feedback"
          data-testid="silse-game-feedback"
          style={{
            marginTop: 8,
            padding: '12px 14px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            backgroundColor: answeredCorrectly
              ? 'var(--silse-color-success, var(--color-success-soft))'
              : 'var(--silse-color-danger, var(--color-danger-soft))',
            color: answeredCorrectly
              ? 'var(--silse-color-success, var(--color-success))'
              : 'var(--silse-color-danger, var(--color-danger))',
            borderLeft: `4px solid ${answeredCorrectly
              ? 'var(--silse-color-success, var(--color-success))'
              : 'var(--silse-color-danger, var(--color-danger))'}`,
            whiteSpace: 'normal',
            overflowWrap: 'anywhere',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
            {answeredCorrectly ? '✓ Hasil Aksi' : '✗ Hasil Aksi'}
          </div>
          {answeredCorrectly ? mission.feedbackCorrect : mission.feedbackWrong}
        </div>
      )}

      {/* Reward preview (jika sudah benar) */}
      {answeredCorrectly && sceneMeta.reward && (
        <div
          className="silse-game-reward"
          data-testid="silse-game-reward"
          style={{
            ...rewardStyle,
            marginTop: 8,
            background: 'var(--silse-color-warning-soft, var(--color-warning-soft))',
            borderColor: 'var(--silse-color-warning, var(--color-warning))',
          }}
        >
          <div style={{ fontSize: 24 }}>🏅</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--silse-color-warning, var(--color-warning))', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Reward Didapat
            </div>
            <strong style={{ fontSize: 14, color: 'var(--silse-color-text, var(--color-text))' }}>
              {sceneMeta.reward.label}
            </strong>
          </div>
        </div>
      )}

      {/* Next mission / finish button */}
      {gs.isAnswered && gs.currentMissionIndex < component.missions.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNextMission?.(); }}
          style={{ marginTop: 'auto', padding: '10px 18px', alignSelf: 'flex-end' }}
        >
          Misi Berikutnya →
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scene styles (sederhana, fokus struktur bukan premium)
// ---------------------------------------------------------------------------

const briefingStyle: CSSProperties = {
  padding: '12px 14px',
  borderRadius: 10,
  background: 'var(--silse-color-warning-soft, var(--color-warning-soft))',
  border: '1px solid var(--silse-color-warning, var(--color-warning))',
  marginBottom: 8,
};

const targetStyle: CSSProperties = {
  padding: '12px 14px',
  borderRadius: 10,
  background: 'var(--silse-color-primary, var(--color-accent-soft))',
  border: '1px solid var(--silse-color-primary, var(--color-accent))',
  marginBottom: 8,
};

const rewardStyle: CSSProperties = {
  padding: '16px',
  borderRadius: 12,
  background: 'var(--silse-color-warning-soft, var(--color-warning-soft))',
  border: '2px solid var(--silse-color-warning, var(--color-warning))',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
};
