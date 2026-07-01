/**
 * QuestionComponentView — renderer for a QuestionComponent.
 *
 * M10 scope: render question with choices, feedback, and scoring.
 * COMPONENT-SKIN-V2: skinClass prop for visual skin based on style pack.
 *
 * UX Contract: Answer option text must NOT be clipped.
 *   - No white-space: nowrap
 *   - No text-overflow clip
 *   - No fixed-height sempit
 *   - min-height + padding + overflow-wrap: anywhere
 */

import type { CSSProperties } from 'react';
import type { QuestionComponent } from '../core/types';
import type { ResolvedComponentStyle } from '../core/style/resolveComponentStyle';
import { getCelebrationEffectForStylePack } from '../core/style-packs/celebration-effect';

export type QuestionComponentViewProps = {
  component: QuestionComponent;
  resolvedStyle: ResolvedComponentStyle;
  selected?: boolean;
  onSelect?: (componentId: string) => void;
  onAnswer?: (choiceIndex: number) => void;
  selectedChoiceIndex?: number | null;
  isAnswered?: boolean;
  positionMode?: 'absolute' | 'fill';
  /** COMPONENT-SKIN-V2: CSS class for visual skin (e.g. skin-quiz-calm). */
  skinClass?: string;
  /** CELEBRATION-EFFECT-V1: style pack ID for celebration effect. */
  stylePackId?: string;
};

export function QuestionComponentView({
  component,
  resolvedStyle,
  selected,
  onSelect,
  onAnswer,
  selectedChoiceIndex,
  isAnswered,
  positionMode = 'absolute',
  skinClass,
  stylePackId,
}: QuestionComponentViewProps) {
  const isFill = positionMode === 'fill';

  const containerStyle: CSSProperties = isFill
    ? {
        position: 'relative',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        ...resolvedStyle.inlineStyle,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        overflow: 'auto',
        outline: selected ? '2px solid #2563eb' : 'none',
        outlineOffset: 2,
        cursor: 'pointer',
      }
    : {
        position: 'absolute',
        left: component.x,
        top: component.y,
        width: component.width,
        height: component.height,
        ...resolvedStyle.inlineStyle,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        overflow: 'auto',
        outline: selected ? '2px solid #2563eb' : 'none',
        outlineOffset: 2,
        cursor: 'pointer',
      };

  // UX Lock: choice style — no clipping
  const choiceStyle: CSSProperties = {
    padding: '10px 14px',
    minHeight: 44,
    height: 'auto',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    cursor: onAnswer ? 'pointer' : 'default',
    fontSize: 14,
    lineHeight: 1.5,
    whiteSpace: 'normal', // explicitly NOT nowrap
    overflowWrap: 'anywhere', // safe wrapping
    wordBreak: 'break-word',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    transition: 'background-color 0.15s ease-out',
  };

  const isCorrect = (idx: number) => isAnswered && idx === component.correctChoiceIndex;
  const isSelected = (idx: number) => selectedChoiceIndex === idx;

  return (
    <div
      data-component-id={component.id}
      data-component-type="question"
      data-variant={component.variant}
      className={skinClass}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(component.id);
      }}
      style={containerStyle}
    >
      {component.title && (
        <strong style={{ fontSize: 16, marginBottom: 4 }}>{component.title}</strong>
      )}
      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>
        {component.prompt}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {component.choices.map((choice, idx) => {
          let bg = '#ffffff';
          let stateClass = 'silse-choice-default';
          if (isAnswered && isCorrect(idx)) { bg = '#d1fae5'; stateClass = 'silse-choice-correct'; }
          else if (isAnswered && isSelected(idx) && !isCorrect(idx)) { bg = '#fee2e2'; stateClass = 'silse-choice-wrong'; }
          else if (isSelected(idx)) { bg = '#dbeafe'; stateClass = 'silse-choice-selected'; }

          return (
            <div
              key={choice.id}
              data-choice-index={idx}
              className={`silse-question-choice ${stateClass}`}
              onClick={(e) => {
                e.stopPropagation();
                onAnswer?.(idx);
              }}
              style={{ ...choiceStyle, backgroundColor: bg }}
            >
              <span className="silse-choice-letter" style={{ fontWeight: 'bold', minWidth: 20 }}>
                {String.fromCharCode(65 + idx)}.
              </span>
              <span style={{ flex: 1, whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
                {choice.text}
              </span>
            </div>
          );
        })}
      </div>
      {isAnswered && (() => {
        const isCorrectAnswer = selectedChoiceIndex === component.correctChoiceIndex;
        const celebration = getCelebrationEffectForStylePack(stylePackId);
        const celebrationClass = isCorrectAnswer ? ` ${celebration.successClass} ${celebration.burstClass}` : '';
        return (
        <div
          className={`silse-question-feedback ${isCorrectAnswer ? 'silse-feedback-correct' : 'silse-feedback-wrong'}${celebrationClass}`}
          style={{
          marginTop: 8,
          padding: '8px 12px',
          borderRadius: 6,
          fontSize: 13,
          backgroundColor: isCorrectAnswer ? '#d1fae5' : '#fee2e2',
          color: isCorrectAnswer ? '#065f46' : '#991b1b',
          whiteSpace: 'normal',
          overflowWrap: 'anywhere',
          position: 'relative',
        }}>
          {isCorrectAnswer && <span className={celebration.particleClass} aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />}
          {isCorrectAnswer ? component.feedbackCorrect : component.feedbackWrong}
        </div>
        );
      })()}
    </div>
  );
}
