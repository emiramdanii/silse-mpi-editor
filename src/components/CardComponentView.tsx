/**
 * CardComponentView — read-only renderer for a CardComponent on the canvas.
 *
 * Layer: components
 * Allowed imports: ../core
 *
 * M4 scope: render card component dengan inline style.
 * Card = elemen sederhana: title (opsional) + body + variant + geometry.
 * BUKAN nested container.
 *
 * Style placeholder: variant lookup hard-coded. M6 akan ganti ke resolveComponentStyle.
 */

import type { CSSProperties } from 'react';
import type { CardComponent, CardComponentVariant } from '../core/types';

export type CardComponentViewProps = {
  component: CardComponent;
  selected?: boolean;
  onSelect?: (componentId: string) => void;
};

/**
 * Variant style lookup — placeholder sampai M6 style adapter.
 */
const VARIANT_STYLE: Record<
  CardComponentVariant,
  {
    backgroundColor: string;
    borderColor: string;
    color: string;
    titleColor: string;
    borderRadius: number;
    border: string;
    icon?: string;
  }
> = {
  infoCard: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
    color: '#0c4a6e',
    titleColor: '#0369a1',
    borderRadius: 8,
    border: '1px solid #bae6fd',
    icon: 'ℹ',
  },
  importantNote: {
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d',
    color: '#451a03',
    titleColor: '#92400e',
    borderRadius: 8,
    border: '1px solid #fcd34d',
    icon: '⚠',
  },
  exampleCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    color: '#14532d',
    titleColor: '#15803d',
    borderRadius: 8,
    border: '1px solid #bbf7d0',
    icon: '✓',
  },
};

export function CardComponentView({ component, selected, onSelect }: CardComponentViewProps) {
  const vs = VARIANT_STYLE[component.variant] ?? VARIANT_STYLE.infoCard;

  const style: CSSProperties = {
    position: 'absolute',
    left: component.x,
    top: component.y,
    width: component.width,
    height: component.height,
    backgroundColor: vs.backgroundColor,
    border: vs.border,
    borderRadius: vs.borderRadius,
    color: vs.color,
    padding: 16,
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {vs.icon && <span style={{ fontSize: 16 }}>{vs.icon}</span>}
          <strong style={{ color: vs.titleColor, fontSize: 16 }}>{component.title}</strong>
        </div>
      )}
      <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', flex: 1, overflow: 'auto' }}>
        {component.body}
      </div>
    </div>
  );
}
