/**
 * NavigationComponentView — renderer for a NavigationComponent.
 *
 * Layer: components
 * Allowed imports: ../core
 *
 * M5 scope: render navigation button.
 *
 * Di editor: read-only display (click → select, via onSelect).
 * Di preview: clickable (click → onNavigate, triggers next/prev/goto).
 *
 * Style placeholder: variant lookup hard-coded. M6 akan ganti ke resolveComponentStyle.
 * Interaction style from StylePack interactionRecipes akan diterapkan di M6.
 * Untuk M5, CSS transition dasar untuk hover/active.
 */

import type { CSSProperties } from 'react';
import type { NavigationComponent, NavigationComponentVariant } from '../core/types';

export type NavigationComponentViewProps = {
  component: NavigationComponent;
  selected?: boolean;
  onSelect?: (componentId: string) => void;
  /** Preview mode: click triggers navigation action. */
  onNavigate?: () => void;
};

const VARIANT_STYLE: Record<
  NavigationComponentVariant,
  {
    backgroundColor: string;
    color: string;
    borderColor: string;
    fontWeight: 'normal' | 'bold';
  }
> = {
  navigation: {
    backgroundColor: '#f3f4f6',
    color: '#1f2937',
    borderColor: '#d1d5db',
    fontWeight: 'normal',
  },
  primaryAction: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderColor: '#1d4ed8',
    fontWeight: 'bold',
  },
  secondaryAction: {
    backgroundColor: '#ffffff',
    color: '#2563eb',
    borderColor: '#2563eb',
    fontWeight: 'normal',
  },
  choice: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    borderColor: '#fcd34d',
    fontWeight: 'normal',
  },
};

export function NavigationComponentView({
  component,
  selected,
  onSelect,
  onNavigate,
}: NavigationComponentViewProps) {
  const vs = VARIANT_STYLE[component.variant] ?? VARIANT_STYLE.navigation;

  const style: CSSProperties = {
    position: 'absolute',
    left: component.x,
    top: component.y,
    width: component.width,
    height: component.height,
    backgroundColor: vs.backgroundColor,
    color: vs.color,
    border: `2px solid ${vs.borderColor}`,
    borderRadius: 8,
    fontWeight: vs.fontWeight,
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: onNavigate ? 'pointer' : 'default',
    userSelect: 'none',
    boxShadow: selected ? '0 0 0 2px #2563eb' : 'none',
    transition: 'transform 0.15s ease-out, box-shadow 0.15s ease-out',
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onNavigate) {
      onNavigate();
    } else if (onSelect) {
      onSelect(component.id);
    }
  };

  return (
    <button
      data-component-id={component.id}
      data-component-type="navigation"
      data-variant={component.variant}
      data-action={component.action}
      onClick={handleClick}
      style={style}
    >
      {component.label}
    </button>
  );
}
