/**
 * LayeredInfoComponentView — React renderer for LayeredInfoComponent (LXC-02).
 *
 * Layer: components
 * Allowed imports: react, ../core/types, ../core/style/resolveComponentStyle
 *
 * Kontrak (LXC-02 Patch-1 — render contract honesty):
 *   Preview and export follow the same render contract and resolved style
 *   model, but the renderer runtime is different:
 *     - Preview/editor: this React component (LayeredInfoComponentView)
 *     - Export: standalone inline JS DOM manipulation in export-html.ts
 *   This is NOT a "single shared React renderer" — export does not carry
 *   React. Both renderers follow the same visual contract (6 variants,
 *   same styling from resolveComponentStyle, same interaction model).
 *
 *   Runtime state (layer yang terbuka) hanya di preview mode.
 *     Di editor mode (fill), layer yang terbuka = defaultOpenIndex (read-only).
 *   6 variants: accordion, tabs, iconTabs, stepper, cardGrid, timeline.
 *   Tidak ada clipping (white-space normal, overflow-wrap anywhere).
 *   Tidak ada "block" di user-facing text.
 */

import { useState, type CSSProperties } from 'react';
import type { LayeredInfoComponent, LayeredInfoLayer } from '../core/types';
import type { ResolvedComponentStyle } from '../core/style/resolveComponentStyle';

export type LayeredInfoComponentViewProps = {
  component: LayeredInfoComponent;
  resolvedStyle: ResolvedComponentStyle;
  selected?: boolean;
  onSelect?: (componentId: string) => void;
  positionMode?: 'absolute' | 'fill';
  /**
   * Jika true, tampilan interaktif (siswa bisa klik tab/buka accordion).
   * Preview mode = true. Editor mode = false (read-only, pakai defaultOpenIndex).
   */
  interactive?: boolean;
};

export function LayeredInfoComponentView({
  component,
  resolvedStyle,
  selected,
  onSelect,
  positionMode = 'absolute',
  interactive = false,
}: LayeredInfoComponentViewProps) {
  const isFill = positionMode === 'fill';
  const [openIndex, setOpenIndex] = useState<number | null>(
    component.defaultOpenIndex,
  );

  // In editor mode (non-interactive), always use defaultOpenIndex (read-only)
  const activeIndex = interactive ? openIndex : component.defaultOpenIndex;

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
        gap: 8,
        overflow: 'auto',
        padding: 12,
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
        gap: 8,
        overflow: 'auto',
        padding: 12,
        outline: selected ? '2px solid #2563eb' : 'none',
        outlineOffset: 2,
        cursor: 'pointer',
      };

  const handleLayerClick = (idx: number) => {
    if (!interactive) return;
    // For accordion: toggle (click open layer closes it)
    if (component.variant === 'accordion' && openIndex === idx) {
      setOpenIndex(null);
    } else {
      setOpenIndex(idx);
    }
  };

  return (
    <div
      data-component-id={component.id}
      data-component-type="layered-info"
      data-variant={component.variant}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(component.id);
      }}
      style={containerStyle}
    >
      {component.title && (
        <strong
          style={{
            fontSize: 16,
            marginBottom: 4,
            whiteSpace: 'normal',
            overflowWrap: 'anywhere',
          }}
        >
          {component.title}
        </strong>
      )}

      <LayeredInfoContent
        variant={component.variant}
        layers={component.layers}
        activeIndex={activeIndex}
        interactive={interactive}
        onLayerClick={handleLayerClick}
      />
    </div>
  );
}

function LayeredInfoContent({
  variant,
  layers,
  activeIndex,
  interactive,
  onLayerClick,
}: {
  variant: LayeredInfoComponent['variant'];
  layers: LayeredInfoLayer[];
  activeIndex: number | null;
  interactive: boolean;
  onLayerClick: (idx: number) => void;
}) {
  if (layers.length === 0) {
    return (
      <div style={{ color: '#6b7280', fontSize: 13, fontStyle: 'italic' }}>
        Belum ada lapisan. Tambahkan lapisan di Panel Isi.
      </div>
    );
  }

  switch (variant) {
    case 'accordion':
      return <AccordionView layers={layers} activeIndex={activeIndex} interactive={interactive} onLayerClick={onLayerClick} />;
    case 'tabs':
      return <TabsView layers={layers} activeIndex={activeIndex} interactive={interactive} onLayerClick={onLayerClick} showIcons={false} />;
    case 'iconTabs':
      return <TabsView layers={layers} activeIndex={activeIndex} interactive={interactive} onLayerClick={onLayerClick} showIcons={true} />;
    case 'stepper':
      return <StepperView layers={layers} activeIndex={activeIndex} interactive={interactive} onLayerClick={onLayerClick} />;
    case 'cardGrid':
      return <CardGridView layers={layers} activeIndex={activeIndex} interactive={interactive} onLayerClick={onLayerClick} />;
    case 'timeline':
      return <TimelineView layers={layers} activeIndex={activeIndex} interactive={interactive} onLayerClick={onLayerClick} />;
    default:
      return <AccordionView layers={layers} activeIndex={activeIndex} interactive={interactive} onLayerClick={onLayerClick} />;
  }
}

// ----- Accordion -----

function AccordionView({
  layers,
  activeIndex,
  interactive,
  onLayerClick,
}: {
  layers: LayeredInfoLayer[];
  activeIndex: number | null;
  interactive: boolean;
  onLayerClick: (idx: number) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {layers.map((layer, idx) => {
        const isOpen = activeIndex === idx;
        return (
          <div
            key={layer.id}
            style={{
              border: `1px solid ${isOpen ? '#2563eb' : '#d1d5db'}`,
              borderRadius: 6,
              overflow: 'hidden',
            }}
          >
            <div
              onClick={() => onLayerClick(idx)}
              style={{
                padding: '8px 12px',
                background: isOpen ? '#eff6ff' : '#f9fafb',
                cursor: interactive ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                fontWeight: 600,
                color: isOpen ? '#2563eb' : '#1f2937',
                whiteSpace: 'normal',
                overflowWrap: 'anywhere',
              }}
            >
              <span aria-hidden>{isOpen ? '▾' : '▸'}</span>
              <span>{layer.title}</span>
            </div>
            {isOpen && (
              <div
                style={{
                  padding: '10px 12px',
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: '#1f2937',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere',
                }}
              >
                {layer.body}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ----- Tabs / iconTabs -----

function TabsView({
  layers,
  activeIndex,
  interactive,
  onLayerClick,
  showIcons,
}: {
  layers: LayeredInfoLayer[];
  activeIndex: number | null;
  interactive: boolean;
  onLayerClick: (idx: number) => void;
  showIcons: boolean;
}) {
  const safeActive = activeIndex ?? 0;
  const activeLayer = layers[safeActive];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 0 }}>
      <div
        style={{
          display: 'flex',
          gap: 4,
          borderBottom: '2px solid #e3ddcd',
          flexWrap: 'wrap',
        }}
      >
        {layers.map((layer, idx) => {
          const isActive = safeActive === idx;
          return (
            <button
              key={layer.id}
              type="button"
              disabled={!interactive}
              onClick={() => onLayerClick(idx)}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: isActive ? 600 : 500,
                border: 'none',
                borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
                background: isActive ? '#eff6ff' : 'transparent',
                color: isActive ? '#2563eb' : '#4a5160',
                cursor: interactive ? 'pointer' : 'default',
                marginBottom: '-2px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                borderRadius: '4px 4px 0 0',
              }}
            >
              {showIcons && layer.icon && (
                <span aria-hidden style={{ fontSize: 14 }}>{layer.icon}</span>
              )}
              <span>{layer.title}</span>
            </button>
          );
        })}
      </div>
      {activeLayer && (
        <div
          style={{
            padding: 10,
            fontSize: 13,
            lineHeight: 1.5,
            color: '#1f2937',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
            flex: 1,
            overflow: 'auto',
          }}
        >
          {activeLayer.body}
        </div>
      )}
    </div>
  );
}

// ----- Stepper -----

function StepperView({
  layers,
  activeIndex,
  interactive,
  onLayerClick,
}: {
  layers: LayeredInfoLayer[];
  activeIndex: number | null;
  interactive: boolean;
  onLayerClick: (idx: number) => void;
}) {
  const safeActive = activeIndex ?? 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        {layers.map((layer, idx) => {
          const isActive = safeActive === idx;
          const isPast = idx < safeActive;
          return (
            <div key={layer.id} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <button
                type="button"
                disabled={!interactive}
                onClick={() => onLayerClick(idx)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: `2px solid ${isActive ? '#2563eb' : isPast ? '#2f7d4f' : '#d1d5db'}`,
                  background: isActive ? '#2563eb' : isPast ? '#2f7d4f' : '#fff',
                  color: isActive || isPast ? '#fff' : '#4a5160',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: interactive ? 'pointer' : 'default',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={layer.title}
              >
                {idx + 1}
              </button>
              {idx < layers.length - 1 && (
                <div
                  style={{
                    width: 24,
                    height: 2,
                    background: isPast ? '#2f7d4f' : '#d1d5db',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      <div
        style={{
          padding: '8px 4px',
          fontSize: 12,
          fontWeight: 600,
          color: '#2563eb',
          whiteSpace: 'normal',
          overflowWrap: 'anywhere',
        }}
      >
        {layers[safeActive]?.title}
      </div>
      <div
        style={{
          padding: 10,
          fontSize: 13,
          lineHeight: 1.5,
          color: '#1f2937',
          whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere',
          flex: 1,
          overflow: 'auto',
          background: '#f9fafb',
          borderRadius: 6,
        }}
      >
        {layers[safeActive]?.body}
      </div>
    </div>
  );
}

// ----- CardGrid -----

function CardGridView({
  layers,
  activeIndex,
  interactive,
  onLayerClick,
}: {
  layers: LayeredInfoLayer[];
  activeIndex: number | null;
  interactive: boolean;
  onLayerClick: (idx: number) => void;
}) {
  const safeActive = activeIndex ?? 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 0 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 6,
        }}
      >
        {layers.map((layer, idx) => {
          const isActive = safeActive === idx;
          return (
            <button
              key={layer.id}
              type="button"
              disabled={!interactive}
              onClick={() => onLayerClick(idx)}
              style={{
                padding: '10px 8px',
                fontSize: 12,
                fontWeight: isActive ? 600 : 500,
                border: `1px solid ${isActive ? '#2563eb' : '#d1d5db'}`,
                background: isActive ? '#eff6ff' : '#fff',
                color: isActive ? '#2563eb' : '#1f2937',
                borderRadius: 6,
                cursor: interactive ? 'pointer' : 'default',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                minHeight: 60,
              }}
            >
              {layer.icon && <span aria-hidden style={{ fontSize: 16 }}>{layer.icon}</span>}
              <span style={{ whiteSpace: 'normal', overflowWrap: 'anywhere' }}>{layer.title}</span>
            </button>
          );
        })}
      </div>
      <div
        style={{
          padding: 10,
          fontSize: 13,
          lineHeight: 1.5,
          color: '#1f2937',
          whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere',
          background: '#f9fafb',
          borderRadius: 6,
          border: '1px solid #e3ddcd',
        }}
      >
        {layers[safeActive]?.body}
      </div>
    </div>
  );
}

// ----- Timeline -----

function TimelineView({
  layers,
  activeIndex,
  interactive,
  onLayerClick,
}: {
  layers: LayeredInfoLayer[];
  activeIndex: number | null;
  interactive: boolean;
  onLayerClick: (idx: number) => void;
}) {
  const safeActive = activeIndex ?? 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {layers.map((layer, idx) => {
          const isActive = safeActive === idx;
          const isPast = idx < safeActive;
          return (
            <div key={layer.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <button
                  type="button"
                  disabled={!interactive}
                  onClick={() => onLayerClick(idx)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: `2px solid ${isActive ? '#2563eb' : isPast ? '#2f7d4f' : '#d1d5db'}`,
                    background: isActive ? '#2563eb' : isPast ? '#2f7d4f' : '#fff',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: interactive ? 'pointer' : 'default',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {idx + 1}
                </button>
                {idx < layers.length - 1 && (
                  <div style={{ width: 2, height: 24, background: isPast ? '#2f7d4f' : '#d1d5db' }} />
                )}
              </div>
              <div style={{ flex: 1, paddingBottom: 12 }}>
                <button
                  type="button"
                  disabled={!interactive}
                  onClick={() => onLayerClick(idx)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    padding: 0,
                    fontSize: 12,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#2563eb' : '#1f2937',
                    cursor: interactive ? 'pointer' : 'default',
                    textAlign: 'left',
                    display: 'block',
                    marginBottom: 2,
                  }}
                >
                  {layer.title}
                </button>
                {isActive && (
                  <div
                    style={{
                      fontSize: 12,
                      lineHeight: 1.5,
                      color: '#1f2937',
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {layer.body}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
