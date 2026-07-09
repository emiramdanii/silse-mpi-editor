/**
 * ImageComponentView — read-only renderer for an ImageComponent.
 *
 * M9 PATCH: positionMode prop untuk menghindari double positioning.
 */

import type { CSSProperties } from 'react';
import type { ImageComponent } from '../core/types';
import type { ResolvedComponentStyle } from '../core/style/resolveComponentStyle';

export type ImageComponentViewProps = {
  component: ImageComponent;
  resolvedStyle: ResolvedComponentStyle;
  selected?: boolean;
  onSelect?: (componentId: string) => void;
  positionMode?: 'absolute' | 'fill';
};

export function ImageComponentView({
  component,
  resolvedStyle,
  selected,
  onSelect,
  positionMode = 'absolute',
}: ImageComponentViewProps) {
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
        outline: selected ? '2px solid var(--color-accent)' : 'none',
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
        outline: selected ? '2px solid var(--color-accent)' : 'none',
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
