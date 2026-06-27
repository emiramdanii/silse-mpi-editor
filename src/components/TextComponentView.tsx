/**
 * TextComponentView — read-only renderer for a TextComponent on the canvas.
 *
 * Layer: components
 * Allowed imports: ../core
 *
 * M2 scope: render text component dengan inline style dari variant lookup.
 *
 * NOTE — Style placeholder (sesuai docs/STYLE_SCHEMA_CONTRACT.md section 11):
 *   Sebelum M6, render memakai lookup hard-coded minimal berdasarkan variant.
 *   Ini BUKAN style adapter (itu baru di M6, di src/core/style/).
 *   Ini hanya placeholder agar canvas bisa menampilkan komponen dengan
 *   tampilan yang masuk akal. M6 akan mengganti ini dengan resolveBlockStyle.
 *
 *   Aturan: jangan tumbuh menjadi style engine. Tambah variant baru = update
 *   lookup table di sini. Tidak boleh ada field style manual di data komponen
 *   (field override lokal baru di M6/M11).
 */

import type { CSSProperties } from 'react';
import type { TextComponent, TextComponentVariant } from '../core/types';

export type TextComponentViewProps = {
  component: TextComponent;
  selected?: boolean;
  onSelect?: (componentId: string) => void;
};

/**
 * Variant style lookup — placeholder sampai M6 style adapter.
 *
 * Setiap variant mendefinisikan: fontSize, color, fontWeight, align,
 * backgroundColor (optional), padding, borderRadius.
 */
const VARIANT_STYLE: Record<
  TextComponentVariant,
  {
    fontSize: number;
    color: string;
    fontWeight: 'normal' | 'bold';
    align: 'left' | 'center' | 'right';
    backgroundColor?: string;
    padding?: number;
    borderRadius?: number;
    fontStyle?: 'normal' | 'italic';
  }
> = {
  title: {
    fontSize: 48,
    color: '#0f172a',
    fontWeight: 'bold',
    align: 'left',
  },
  subtitle: {
    fontSize: 28,
    color: '#334155',
    fontWeight: 'normal',
    align: 'left',
  },
  body: {
    fontSize: 18,
    color: '#1f2937',
    fontWeight: 'normal',
    align: 'left',
  },
  instruction: {
    fontSize: 16,
    color: '#1e40af',
    fontWeight: 'normal',
    align: 'left',
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 6,
  },
  importantNote: {
    fontSize: 16,
    color: '#92400e',
    fontWeight: 'bold',
    align: 'left',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 6,
  },
  questionPrompt: {
    fontSize: 22,
    color: '#1f2937',
    fontWeight: 'bold',
    align: 'left',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 6,
  },
  reflectionBox: {
    fontSize: 16,
    color: '#581c87',
    fontWeight: 'normal',
    align: 'left',
    backgroundColor: '#faf5ff',
    padding: 12,
    borderRadius: 8,
    fontStyle: 'italic',
  },
};

export function TextComponentView({ component, selected, onSelect }: TextComponentViewProps) {
  const vs = VARIANT_STYLE[component.variant] ?? VARIANT_STYLE.body;

  const style: CSSProperties = {
    position: 'absolute',
    left: component.x,
    top: component.y,
    width: component.width,
    height: component.height,
    fontSize: vs.fontSize,
    color: vs.color,
    fontWeight: vs.fontWeight,
    textAlign: vs.align,
    backgroundColor: vs.backgroundColor,
    padding: vs.padding,
    borderRadius: vs.borderRadius,
    fontStyle: vs.fontStyle,
    // Layout for text content
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    boxSizing: 'border-box',
    // Selection ring (editor-only affordance — not part of style adapter contract)
    outline: selected ? '2px solid #2563eb' : 'none',
    outlineOffset: 2,
    cursor: 'pointer',
    userSelect: 'none',
  };

  // Align text within flex container
  if (vs.align === 'center') {
    style.justifyContent = 'center';
  } else if (vs.align === 'right') {
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
