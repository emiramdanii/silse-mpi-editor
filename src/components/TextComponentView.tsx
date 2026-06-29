/**
 * TextComponentView — read-only renderer for a TextComponent.
 *
 * M9 PATCH: positionMode prop untuk menghindari double positioning.
 *   'absolute' (default): position absolute dengan component.x/y/width/height.
 *   'fill': position relative, width/height 100%, untuk dipasang di dalam
 *           wrapper CanvasStage yang sudah punya absolute positioning.
 * COMPONENT-SKIN-V3: skinClass prop for visual skin based on style pack.
 */

import type { CSSProperties } from 'react';
import type { TextComponent } from '../core/types';
import type { ResolvedComponentStyle } from '../core/style/resolveComponentStyle';

export type TextComponentViewProps = {
  component: TextComponent;
  resolvedStyle: ResolvedComponentStyle;
  selected?: boolean;
  onSelect?: (componentId: string) => void;
  positionMode?: 'absolute' | 'fill';
  /** COMPONENT-SKIN-V3: CSS class for visual skin (e.g. skin-text-clean). */
  skinClass?: string;
};

export function TextComponentView({
  component,
  resolvedStyle,
  selected,
  onSelect,
  positionMode = 'absolute',
  skinClass,
}: TextComponentViewProps) {
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
        overflow: 'hidden',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        boxSizing: 'border-box',
        outline: selected ? '2px solid #2563eb' : 'none',
        outlineOffset: 2,
        cursor: 'pointer',
        userSelect: 'none',
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
        overflow: 'hidden',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        boxSizing: 'border-box',
        outline: selected ? '2px solid #2563eb' : 'none',
        outlineOffset: 2,
        cursor: 'pointer',
        userSelect: 'none',
      };

  const align = resolvedStyle.inlineStyle.textAlign as string | undefined;
  if (align === 'center') {
    style.justifyContent = 'center';
  } else if (align === 'right') {
    style.justifyContent = 'flex-end';
  } else {
    style.justifyContent = 'flex-start';
  }

  return (
    <div
      data-component-id={component.id}
      data-component-type="text"
      data-variant={component.variant}
      className={skinClass}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(component.id);
      }}
      style={style}
    >
      {component.text}
    </div>
  );
}
