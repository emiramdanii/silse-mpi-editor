/**
 * CardComponentView — read-only renderer for a CardComponent.
 *
 * M9 PATCH: positionMode prop untuk menghindari double positioning.
 * COMPONENT-SKIN-V2: skinClass prop for visual skin based on style pack.
 */

import type { CSSProperties } from 'react';
import type { CardComponent } from '../core/types';
import type { ResolvedComponentStyle } from '../core/style/resolveComponentStyle';

export type CardComponentViewProps = {
  component: CardComponent;
  resolvedStyle: ResolvedComponentStyle;
  selected?: boolean;
  onSelect?: (componentId: string) => void;
  positionMode?: 'absolute' | 'fill';
  /** COMPONENT-SKIN-V2: CSS class for visual skin (e.g. skin-card-flat). */
  skinClass?: string;
};

export function CardComponentView({
  component,
  resolvedStyle,
  selected,
  onSelect,
  positionMode = 'absolute',
  skinClass,
}: CardComponentViewProps) {
  const isFill = positionMode === 'fill';

  const style: CSSProperties = isFill
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
        overflow: 'hidden',
        outline: selected ? '2px solid var(--silse-color-primary, #2563eb)' : 'none',
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
        overflow: 'hidden',
        outline: selected ? '2px solid var(--silse-color-primary, #2563eb)' : 'none',
        outlineOffset: 2,
        cursor: 'pointer',
      };

  return (
    <div
      data-component-id={component.id}
      data-component-type="card"
      data-variant={component.variant}
      className={skinClass}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(component.id);
      }}
      style={style}
    >
      {component.title && component.title.length > 0 && (
        <strong style={{ fontSize: 16 }}>{component.title}</strong>
      )}
      <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', flex: 1, overflow: 'auto' }}>
        {component.body}
      </div>
    </div>
  );
}
