/**
 * TextComponentView — read-only renderer for a TextComponent on the canvas.
 *
 * Layer: components
 * Allowed imports: ../core
 *
 * M6 PATCH: Style datang dari resolvedStyle (resolveComponentStyle).
 * TIDAK ADA hard-coded style lookup hard-coded lookup.
 * Editor, Preview, dan Export semua memakai resolver yang sama.
 */

import type { CSSProperties } from 'react';
import type { TextComponent } from '../core/types';
import type { ResolvedComponentStyle } from '../core/style/resolveComponentStyle';

export type TextComponentViewProps = {
  component: TextComponent;
  resolvedStyle: ResolvedComponentStyle;
  selected?: boolean;
  onSelect?: (componentId: string) => void;
};

export function TextComponentView({ component, resolvedStyle, selected, onSelect }: TextComponentViewProps) {
  const style: CSSProperties = {
    position: 'absolute',
    left: component.x,
    top: component.y,
    width: component.width,
    height: component.height,
    // Style dari resolver (fontSize, color, fontWeight, textAlign, backgroundColor, etc.)
    ...resolvedStyle.inlineStyle,
    // Layout for text content
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    boxSizing: 'border-box',
    // Selection ring (editor-only affordance)
    outline: selected ? '2px solid #2563eb' : 'none',
    outlineOffset: 2,
    cursor: 'pointer',
    userSelect: 'none',
  };

  // Align text within flex container
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
