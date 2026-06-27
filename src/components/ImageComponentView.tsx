/**
 * ImageComponentView — read-only renderer for an ImageComponent on the canvas.
 *
 * Layer: components
 * Allowed imports: ../core
 *
 * M6 PATCH: Style datang dari resolvedStyle (resolveComponentStyle).
 * TIDAK ADA hard-coded style lookup hard-coded lookup.
 */

import type { CSSProperties } from 'react';
import type { ImageComponent } from '../core/types';
import type { ResolvedComponentStyle } from '../core/style/resolveComponentStyle';

export type ImageComponentViewProps = {
  component: ImageComponent;
  resolvedStyle: ResolvedComponentStyle;
  selected?: boolean;
  onSelect?: (componentId: string) => void;
};

export function ImageComponentView({ component, resolvedStyle, selected, onSelect }: ImageComponentViewProps) {
  const style: CSSProperties = {
    position: 'absolute',
    left: component.x,
    top: component.y,
    width: component.width,
    height: component.height,
    // Style dari resolver (border, borderRadius, boxShadow, overflow)
    ...resolvedStyle.inlineStyle,
    boxSizing: 'border-box',
    outline: selected ? '2px solid #2563eb' : 'none',
    outlineOffset: 2,
    cursor: 'pointer',
  };

  return (
    <div
      data-component-id={component.id}
      data-component-type="image"
      data-variant={component.variant}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(component.id);
      }}
      style={style}
    >
      <img
        src={component.src}
        alt={component.alt ?? ''}
        style={{
          width: '100%',
          height: '100%',
          objectFit: component.objectFit,
          display: 'block',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
