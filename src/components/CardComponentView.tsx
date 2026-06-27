/**
 * CardComponentView — read-only renderer for a CardComponent on the canvas.
 *
 * Layer: components
 * Allowed imports: ../core
 *
 * M6 PATCH: Style datang dari resolvedStyle (resolveComponentStyle).
 * TIDAK ADA hard-coded style lookup hard-coded lookup.
 */

import type { CSSProperties } from 'react';
import type { CardComponent } from '../core/types';
import type { ResolvedComponentStyle } from '../core/style/resolveComponentStyle';

export type CardComponentViewProps = {
  component: CardComponent;
  resolvedStyle: ResolvedComponentStyle;
  selected?: boolean;
  onSelect?: (componentId: string) => void;
};

export function CardComponentView({ component, resolvedStyle, selected, onSelect }: CardComponentViewProps) {
  const style: CSSProperties = {
    position: 'absolute',
    left: component.x,
    top: component.y,
    width: component.width,
    height: component.height,
    // Style dari resolver (backgroundColor, border, borderRadius, color, padding)
    ...resolvedStyle.inlineStyle,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    overflow: 'hidden',
    outline: selected ? '2px solid #2563eb' : 'none',
    outlineOffset: 2,
    cursor: 'pointer',
  };

  return (
    <div
      data-component-id={component.id}
      data-component-type="card"
      data-variant={component.variant}
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
