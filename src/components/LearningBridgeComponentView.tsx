/**
 * LearningBridgeComponentView — React renderer for LearningBridgeComponent (LXC-03).
 *
 * Layer: components
 * Allowed imports: react, ../core/types, ../core/style/resolveComponentStyle
 *
 * Kontrak (LXC-03 — render contract honesty):
 *   Preview and export follow the same render contract and resolved style
 *   model, but renderer runtime is different (React vs standalone JS DOM).
 *   NOT a single shared React renderer.
 *
 *   Bridge adalah komponen STATIS — tidak ada runtime state.
 *     - variant 'transition': pesan transisi sederhana + tombol next.
 *     - variant 'recap': ringkasan apa yang baru dipelajari + tombol next.
 *     - variant 'preview': preview apa yang akan datang + tombol next.
 *
 *   Tombol "next" bersifat visual di editor; di preview/export tombol juga
 *   visual only (tidak memicu navigasi otomatis — guru bisa tambahkan
 *   NavigationComponent terpisah kalau butuh navigasi nyata).
 *
 *   No clipping: white-space normal, overflow-wrap anywhere.
 *   Tidak ada "block" di user-facing text.
 */

import type { CSSProperties } from 'react';
import type { LearningBridgeComponent, LearningBridgeVariant } from '../core/types';
import type { ResolvedComponentStyle } from '../core/style/resolveComponentStyle';

export type LearningBridgeComponentViewProps = {
  component: LearningBridgeComponent;
  resolvedStyle: ResolvedComponentStyle;
  selected?: boolean;
  onSelect?: (componentId: string) => void;
  positionMode?: 'absolute' | 'fill';
  /**
   * Bridge bersifat statis. `interactive` hanya menandakan mode (preview vs
   * editor). Di implementasi ini, tombol "next" tidak memicu navigasi
   * otomatis — bridge adalah penghubung visual antar scene.
   */
  interactive?: boolean;
};

const VARIANT_ICON: Record<LearningBridgeVariant, string> = {
  transition: '🔀',
  recap: '✅',
  preview: '👀',
};

const VARIANT_LABEL: Record<LearningBridgeVariant, string> = {
  transition: 'Transisi',
  recap: 'Recap',
  preview: 'Preview',
};

export function LearningBridgeComponentView({
  component,
  resolvedStyle,
  selected,
  onSelect,
  positionMode = 'absolute',
  interactive = false,
}: LearningBridgeComponentViewProps) {
  const isFill = positionMode === 'fill';

  const containerStyle: CSSProperties = isFill
    ? {
        position: 'relative',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        ...resolvedStyle.inlineStyle,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        overflow: 'hidden',
        padding: 16,
        outline: selected ? '2px solid #2563eb' : 'none',
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
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        overflow: 'hidden',
        padding: 16,
        outline: selected ? '2px solid #2563eb' : 'none',
        outlineOffset: 2,
        cursor: 'pointer',
      };

  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(component.id);
  };

  const handleNextClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Bridge "next" button is visual-only in this implementation.
    // Real navigation should come from a separate NavigationComponent.
    onSelect?.(component.id);
  };

  return (
    <div
      data-component-id={component.id}
      data-component-type="learning-bridge"
      data-variant={component.variant}
      data-testid="learning-bridge-component"
      onClick={handleContainerClick}
      style={containerStyle}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          color: '#6b7280',
          whiteSpace: 'normal',
          overflowWrap: 'anywhere',
        }}
      >
        <span aria-hidden>{VARIANT_ICON[component.variant]}</span>
        <span>{VARIANT_LABEL[component.variant]}</span>
      </div>

      {component.title && (
        <strong
          style={{
            fontSize: 18,
            fontWeight: 700,
            whiteSpace: 'normal',
            overflowWrap: 'anywhere',
          }}
        >
          {component.title}
        </strong>
      )}

      <div
        style={{
          fontSize: 14,
          lineHeight: 1.6,
          whiteSpace: 'normal',
          overflowWrap: 'anywhere',
          flex: 1,
          overflow: 'auto',
        }}
      >
        {component.message}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: 'auto',
        }}
      >
        <button
          type="button"
          onClick={handleNextClick}
          data-testid="learning-bridge-next-button"
          data-action="bridge-next"
          style={{
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 600,
            border: '2px solid #2563eb',
            borderRadius: 8,
            background: '#2563eb',
            color: '#ffffff',
            cursor: interactive ? 'pointer' : 'default',
            whiteSpace: 'normal',
            overflowWrap: 'anywhere',
            minHeight: 44,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>{component.nextButtonLabel}</span>
        </button>
      </div>
    </div>
  );
}
