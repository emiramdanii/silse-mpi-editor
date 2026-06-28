/**
 * LearningBridgeComponentView — React renderer for LearningBridgeComponent (LXC-03).
 *
 * Layer: components
 * Allowed imports: react, ../core/types, ../core/style/resolveComponentStyle
 *
 * Kontrak (LXC-03 Patch-1 — No Dead Bridge Button):
 *   Preview and export follow the same render contract and resolved style
 *   model, but renderer runtime is different (React vs standalone JS DOM).
 *   NOT a single shared React renderer.
 *
 *   Bridge adalah komponen STATIS — tidak ada runtime state.
 *   Tombol "next" label dirender sebagai NON-INTERACTIVE CTA chip (div/span),
 *   BUKAN <button>. Tidak ada cursor:pointer, tidak ada data-action, tidak
 *   ada onClick yang memberi kesan navigasi. Real navigation tetap lewat
 *   NavigationComponent terpisah yang guru tambahkan ke halaman.
 *
 *   Variants:
 *     - 'transition': pesan transisi sederhana + CTA chip.
 *     - 'recap': ringkasan apa yang baru dipelajari + CTA chip.
 *     - 'preview': preview apa yang akan datang + CTA chip.
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
   * editor). Tombol "next" TIDAK memicu navigasi — bridge adalah penghubung
   * visual antar scene.
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
  interactive: _interactive = false,
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

      {/* LXC-03 Patch-1: NON-INTERACTIVE CTA chip — NOT a <button>.
          Tidak ada cursor:pointer, tidak ada data-action, tidak ada onClick
          yang memberi kesan navigasi. Real navigation lewat NavigationComponent. */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: 'auto',
        }}
      >
        <div
          data-testid="learning-bridge-cta-chip"
          style={{
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            border: '1px solid #2563eb',
            borderRadius: 999,
            background: '#eff6ff',
            color: '#2563eb',
            cursor: 'default',
            whiteSpace: 'normal',
            overflowWrap: 'anywhere',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            minHeight: 36,
          }}
        >
          <span>{component.nextButtonLabel}</span>
          <span aria-hidden style={{ fontSize: 14 }}>→</span>
        </div>
      </div>
    </div>
  );
}
