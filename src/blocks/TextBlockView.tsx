/**
 * TextBlockView — read-only renderer for a TextBlock on the canvas.
 *
 * Layer: blocks
 * Allowed imports: ../core
 *
 * Render uses inline styles derived from block data:
 *   position: absolute, left/top/width/height from x/y/width/height
 *   fontSize, color, fontWeight, textAlign, text content
 *
 * Selection highlight is controlled by the parent (CanvasStage).
 *
 * M4 will add ImageBlockView, M5 will add ButtonBlockView.
 */

import type { TextBlock } from '../core/types';

export type TextBlockViewProps = {
  block: TextBlock;
  selected?: boolean;
  onSelect?: (blockId: string) => void;
};

export function TextBlockView({ block, selected, onSelect }: TextBlockViewProps) {
  return (
    <div
      data-block-id={block.id}
      data-block-type="text"
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(block.id);
      }}
      style={{
        position: 'absolute',
        left: block.x,
        top: block.y,
        width: block.width,
        height: block.height,
        fontSize: block.fontSize,
        color: block.color,
        fontWeight: block.fontWeight,
        textAlign: block.align,
        // Layout for text content
        display: 'flex',
        alignItems: 'center',
        padding: '0 4px',
        overflow: 'hidden',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        // Selection ring
        outline: selected ? '2px solid #2563eb' : 'none',
        outlineOffset: 2,
        cursor: 'pointer',
        userSelect: 'none',
        boxSizing: 'border-box',
      }}
    >
      {block.text}
    </div>
  );
}
