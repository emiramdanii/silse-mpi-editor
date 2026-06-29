/**
 * LearningBridgeComponentView — React renderer for LearningBridgeComponent (LXC-03).
 *
 * Layer: components
 * Allowed imports: react, ../core/types, ../core/style/resolveComponentStyle
 *
 * COMPONENT-SKIN-V2: skinClass prop for visual skin based on style pack.
 *
 * Kontrak (DIE-V1 Scope 5 — Bridge Color Cleanup):
 *   Bridge TIDAK lagi hardcode warna internal (#2563eb, #eff6ff, #6b7280).
 *   Warna diambil dari CSS variables yang di-set oleh style resolver:
 *     --silse-bridge-muted, --silse-bridge-cta-bg,
 *     --silse-bridge-cta-color, --silse-bridge-cta-border
 *   React view dan export HTML memakai variable yang sama.
 *
 *   CTA chip NON-INTERACTIVE (div, bukan button). cursor:default.
 *   Real navigation lewat NavigationComponent terpisah.
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
  interactive?: boolean;
  /** COMPONENT-SKIN-V2: CSS class for visual skin (e.g. skin-bridge-subtle). */
  skinClass?: string;
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
  skinClass,
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
        outline: selected ? '2px solid var(--silse-bridge-cta-color, currentColor)' : 'none',
        outlineOffset: 2,
        cursor: onSelect ? 'pointer' : 'default',
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
        outline: selected ? '2px solid var(--silse-bridge-cta-color, currentColor)' : 'none',
        outlineOffset: 2,
        cursor: onSelect ? 'pointer' : 'default',
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
      className={skinClass}
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
          color: 'var(--silse-bridge-muted, inherit)',
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

      {/* NON-INTERACTIVE CTA chip — NOT a <button>. CSS variables for color. */}
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
            border: '1px solid var(--silse-bridge-cta-border, currentColor)',
            borderRadius: 999,
            background: 'var(--silse-bridge-cta-bg, transparent)',
            color: 'var(--silse-bridge-cta-color, inherit)',
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
