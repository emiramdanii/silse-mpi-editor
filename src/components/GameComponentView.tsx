/**
 * GameComponentView — renderer for GameComponent (missionQuiz).
 *
 * M11A scope: render game with missions, choices, feedback, score, retry.
 * COMPONENT-SKIN-V2: skinClass prop for visual skin based on style pack.
 *
 * UX Contract: Game answer option text must NOT be clipped.
 *   - No white-space: nowrap
 *   - No text-overflow clip
 *   - min-height + padding + overflow-wrap: anywhere
 */

import type { CSSProperties } from 'react';
import type { GameComponent } from '../core/types';
import type { ResolvedComponentStyle } from '../core/style/resolveComponentStyle';

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
        overflow: 'auto', padding: 12,
        outline: selected ? '2px solid #2563eb' : 'none', outlineOffset: 2, cursor: 'pointer',
      }
    : {
        position: 'absolute', left: component.x, top: component.y,
        width: component.width, height: component.height,
        ...resolvedStyle.inlineStyle,
        boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 8,
        overflow: 'auto', padding: 12,
        outline: selected ? '2px solid #2563eb' : 'none', outlineOffset: 2, cursor: 'pointer',
      };

  const choiceStyle: CSSProperties = {
    padding: '10px 14px', minHeight: 44, height: 'auto',
    border: '1px solid #d1d5db', borderRadius: 6, cursor: onAnswer ? 'pointer' : 'default',
    fontSize: 14, lineHeight: 1.5, whiteSpace: 'normal', overflowWrap: 'anywhere',
    wordBreak: 'break-word', display: 'flex', alignItems: 'flex-start', gap: 8,
  };

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
      <div style={{ fontSize: 13, color: '#6b7280', whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
        {component.instruction}
      </div>
      <div style={{ fontSize: 12, color: '#6b7280' }}>
        Misi {gs.currentMissionIndex + 1} / {component.missions.length} · Skor: {gs.score}
      </div>
      <div style={{ fontSize: 15, fontWeight: 500, marginTop: 4, whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
        {mission.prompt}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {mission.choices.map((choice, idx) => {
          let bg = '#ffffff';
          if (gs.isAnswered && isCorrect(idx)) bg = '#d1fae5';
          else if (gs.isAnswered && isSelected(idx) && !isCorrect(idx)) bg = '#fee2e2';
          else if (isSelected(idx)) bg = '#dbeafe';
          return (
            <div key={choice.id} data-choice-index={idx}
              onClick={(e) => { e.stopPropagation(); onAnswer?.(gs.currentMissionIndex, idx); }}
              style={{ ...choiceStyle, backgroundColor: bg }}>
              <span style={{ fontWeight: 'bold', minWidth: 20 }}>{String.fromCharCode(65 + idx)}.</span>
              <span style={{ flex: 1, whiteSpace: 'normal', overflowWrap: 'anywhere' }}>{choice.text}</span>
            </div>
          );
        })}
      </div>
      {gs.isAnswered && (
        <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 6, fontSize: 13,
          backgroundColor: gs.selectedChoiceIndex === mission.correctChoiceIndex ? '#d1fae5' : '#fee2e2',
          color: gs.selectedChoiceIndex === mission.correctChoiceIndex ? '#065f46' : '#991b1b',
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
