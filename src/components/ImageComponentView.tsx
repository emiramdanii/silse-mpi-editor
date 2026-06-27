/**
 * ImageComponentView — read-only renderer for an ImageComponent on the canvas.
 *
 * Layer: components
 * Allowed imports: ../core
 *
 * M4 scope: render image component dengan inline style.
 * Style placeholder: variant lookup hard-coded. M6 akan ganti ke resolveComponentStyle.
 */

import type { CSSProperties } from 'react';
import type { ImageComponent, ImageComponentVariant } from '../core/types';

export type ImageComponentViewProps = {
  component: ImageComponent;
  selected?: boolean;
  onSelect?: (componentId: string) => void;
};

/**
 * Variant style lookup — placeholder sampai M6 style adapter.
 */
const VARIANT_STYLE: Record<
  ImageComponentVariant,
  { border?: string; borderRadius?: number; shadow?: string }
> = {
  illustration: {
    border: '1px solid #d1d5db',
    borderRadius: 8,
    shadow: '0 4px 12px rgba(0,0,0,0.10)',
  },
  background: {
    border: 'none',
    borderRadius: 0,
    shadow: 'none',
  },
  imageCard: {
    border: '2px solid #2563eb',
    borderRadius: 12,
    shadow: '0 4px 16px rgba(37,99,235,0.18)',
  },
};

export function ImageComponentView({ component, selected, onSelect }: ImageComponentViewProps) {
  const vs = VARIANT_STYLE[component.variant] ?? VARIANT_STYLE.illustration;

  const style: CSSProperties = {
    position: 'absolute',
    left: component.x,
    top: component.y,
    width: component.width,
    height: component.height,
    border: vs.border,
    borderRadius: vs.borderRadius,
    boxShadow: vs.shadow,
    overflow: 'hidden',
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
