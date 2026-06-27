/**
 * QuestionComponentView — renderer for a QuestionComponent.
 *
 * M10 scope: render question with choices, feedback, and scoring.
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

export type QuestionComponentViewProps = {
  component: QuestionComponent;
  resolvedStyle: ResolvedComponentStyle;
  selected?: boolean;
  onSelect?: (componentId: string) => void;
  onAnswer?: (choiceIndex: number) => void;
  selectedChoiceIndex?: number | null;
  isAnswered?: boolean;
  positionMode?: 'absolute' | 'fill';
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
          if (isAnswered && isCorrect(idx)) bg = '#d1fae5';
          else if (isAnswered && isSelected(idx) && !isCorrect(idx)) bg = '#fee2e2';
          else if (isSelected(idx)) bg = '#dbeafe';

          return (
            <div
              key={choice.id}
              data-choice-index={idx}
              onClick={(e) => {
                e.stopPropagation();
                onAnswer?.(idx);
              }}
              style={{ ...choiceStyle, backgroundColor: bg }}
            >
              <span style={{ fontWeight: 'bold', minWidth: 20 }}>
                {String.fromCharCode(65 + idx)}.
              </span>
              <span style={{ flex: 1, whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
                {choice.text}
              </span>
            </div>
          );
        })}
      </div>
      {isAnswered && (
        <div style={{
          marginTop: 8,
          padding: '8px 12px',
          borderRadius: 6,
          fontSize: 13,
          backgroundColor: selectedChoiceIndex === component.correctChoiceIndex ? '#d1fae5' : '#fee2e2',
          color: selectedChoiceIndex === component.correctChoiceIndex ? '#065f46' : '#991b1b',
          whiteSpace: 'normal',
          overflowWrap: 'anywhere',
        }}>
          {selectedChoiceIndex === component.correctChoiceIndex
            ? component.feedbackCorrect
            : component.feedbackWrong}
        </div>
      )}
    </div>
  );
}
