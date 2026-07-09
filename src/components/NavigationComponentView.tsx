/**
 * NavigationComponentView — renderer for a NavigationComponent.
 *
 * M9 PATCH: positionMode prop untuk menghindari double positioning.
 * COMPONENT-SKIN-V2: skinClass prop for visual skin based on style pack.
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
  positionMode?: 'absolute' | 'fill';
  /** COMPONENT-SKIN-V2: CSS class for visual skin (e.g. skin-button-clean). */
  skinClass?: string;
};

export function NavigationComponentView({
  component,
  resolvedStyle,
  selected,
  onSelect,
  onNavigate,
  positionMode = 'absolute',
  skinClass,
}: NavigationComponentViewProps) {
  const isFill = positionMode === 'fill';

  const style: CSSProperties = isFill
    ? {
        position: 'relative',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        ...resolvedStyle.inlineStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onNavigate ? 'pointer' : 'default',
        userSelect: 'none',
        boxShadow: selected ? '0 0 0 2px var(--color-accent)' : undefined,
      }
    : {
        position: 'absolute',
        left: component.x,
        top: component.y,
        width: component.width,
        height: component.height,
        ...resolvedStyle.inlineStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onNavigate ? 'pointer' : 'default',
        userSelect: 'none',
        boxShadow: selected ? '0 0 0 2px var(--color-accent)' : undefined,
      };

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
      className={skinClass}
      onClick={handleClick}
      style={style}
    >
      {component.label}
    </button>
  );
}
