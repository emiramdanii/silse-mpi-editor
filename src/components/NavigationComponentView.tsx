/**
 * NavigationComponentView — renderer for a NavigationComponent.
 *
 * Layer: components
 * Allowed imports: ../core
 *
 * M6 PATCH: Style datang dari resolvedStyle (resolveComponentStyle).
 * TIDAK ADA hard-coded style lookup hard-coded lookup.
 * Interaction (hover/press/focus) dari resolvedStyle.interactions.
 *
 * Di editor: click → select (via onSelect).
 * Di preview: click → onNavigate (triggers next/prev/goto).
 */

import type { CSSProperties } from 'react';
import type { NavigationComponent } from '../core/types';
import type { ResolvedComponentStyle } from '../core/style/resolveComponentStyle';

export type NavigationComponentViewProps = {
  component: NavigationComponent;
  resolvedStyle: ResolvedComponentStyle;
  selected?: boolean;
  onSelect?: (componentId: string) => void;
  onNavigate?: () => void;
};

export function NavigationComponentView({
  component,
  resolvedStyle,
  selected,
  onSelect,
  onNavigate,
}: NavigationComponentViewProps) {
  // Build base style from resolver + geometry
  const style: CSSProperties = {
    position: 'absolute',
    left: component.x,
    top: component.y,
    width: component.width,
    height: component.height,
    // Style dari resolver (backgroundColor, color, border, borderRadius, fontSize, fontWeight)
    ...resolvedStyle.inlineStyle,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: onNavigate ? 'pointer' : 'default',
    userSelect: 'none',
    boxShadow: selected ? '0 0 0 2px #2563eb' : undefined,
  };

  // Apply interaction styles from resolver (hover/press/focus)
  const interactions = resolvedStyle.interactions;
  if (interactions?.hover?.transition) {
    style.transition = interactions.hover.transition;
  }

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
