/**
 * CanvasStage — editor canvas with drag + resize + keyboard delete (M9).
 *
 * M9 scope:
 *   - Drag selected component (pointer down/move/up).
 *   - Resize selected component (southeast handle).
 *   - Snap to grid (8px).
 *   - Clamp to canvas.
 *   - Keyboard delete (Delete/Backspace) — skip in input/textarea/select.
 *   - No drag in preview. No external drag library.
 */

import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../store/editor-store';
import { isCardComponent, isImageComponent, isNavigationComponent, isTextComponent } from '../components/component-utils';
import { TextComponentView } from '../components/TextComponentView';
import { ImageComponentView } from '../components/ImageComponentView';
import { CardComponentView } from '../components/CardComponentView';
import { NavigationComponentView } from '../components/NavigationComponentView';
import { getCapability } from '../core/capability';
import { getResolvedComponentStyle } from '../core/style/resolveComponentStyle';
import { snapToGrid, clampRectToCanvas, CANVAS_WIDTH, CANVAS_HEIGHT, type Rect } from '../core/geometry';

export function CanvasStage() {
  const project = useEditorStore((s) => s.project);
  const currentPage = project.pages.find((p) => p.id === project.currentPageId) ?? null;
  const selectedComponentId = useEditorStore((s) => s.selectedComponentId);
  const selectComponent = useEditorStore((s) => s.selectComponent);
  const updateComponentGeometry = useEditorStore((s) => s.updateComponentGeometry);
  const removeComponent = useEditorStore((s) => s.removeComponent);

  const [dragState, setDragState] = useState<{
    mode: 'drag' | 'resize' | null;
    startX: number;
    startY: number;
    origRect: Rect | null;
  }>({ mode: null, startX: 0, startY: 0, origRect: null });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Keyboard delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      // Skip if user is typing in input/textarea/select
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }
      // Skip if target is contentEditable
      if (target.isContentEditable) return;

      const selectedId = useEditorStore.getState().selectedComponentId;
      if (selectedId) {
        e.preventDefault();
        removeComponent(selectedId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [removeComponent]);

  // Pointer move handler (global during drag)
  useEffect(() => {
    if (!dragState.mode || !dragState.origRect || !selectedComponentId) return;

    const handlePointerMove = (e: PointerEvent) => {
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;

      if (dragState.mode === 'drag') {
        const newRect = clampRectToCanvas({
          x: snapToGrid(dragState.origRect!.x + dx),
          y: snapToGrid(dragState.origRect!.y + dy),
          width: dragState.origRect!.width,
          height: dragState.origRect!.height,
        });
        updateComponentGeometry(selectedComponentId, newRect);
      } else if (dragState.mode === 'resize') {
        const newRect = clampRectToCanvas({
          x: dragState.origRect!.x,
          y: dragState.origRect!.y,
          width: snapToGrid(Math.max(80, dragState.origRect!.width + dx)),
          height: snapToGrid(Math.max(40, dragState.origRect!.height + dy)),
        });
        updateComponentGeometry(selectedComponentId, newRect);
      }
    };

    const handlePointerUp = () => {
      setDragState({ mode: null, startX: 0, startY: 0, origRect: null });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, selectedComponentId, updateComponentGeometry]);

  const handleDragStart = (e: React.PointerEvent, componentId: string) => {
    e.stopPropagation();
    const comp = currentPage?.components.find((c) => c.id === componentId);
    if (!comp) return;

    selectComponent(componentId);
    setDragState({
      mode: 'drag',
      startX: e.clientX,
      startY: e.clientY,
      origRect: { x: comp.x, y: comp.y, width: comp.width, height: comp.height },
    });
  };

  const handleResizeStart = (e: React.PointerEvent, componentId: string) => {
    e.stopPropagation();
    const comp = currentPage?.components.find((c) => c.id === componentId);
    if (!comp) return;

    setDragState({
      mode: 'resize',
      startX: e.clientX,
      startY: e.clientY,
      origRect: { x: comp.x, y: comp.y, width: comp.width, height: comp.height },
    });
  };

  const bg =
    currentPage?.background.type === 'color'
      ? currentPage.background.color
      : currentPage?.background.type === 'gradient'
        ? currentPage.background.gradient
        : currentPage?.background.type === 'image'
          ? `url(${currentPage.background.imageSrc}) center/cover no-repeat`
          : '#ffffff';

  const capability = currentPage ? getCapability(currentPage.role) : null;
  const canAdd = capability?.allowAddComponent ?? false;

  return (
    <main className="canvas-stage">
      <div
        ref={canvasRef}
        className="canvas-frame"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          background: bg,
        }}
        onClick={() => selectComponent(null)}
      >
        <div className="canvas-frame__label">
          {CANVAS_WIDTH} × {CANVAS_HEIGHT} · {currentPage?.title ?? '—'} ·{' '}
          {currentPage ? `role: ${currentPage.role}, layout: ${currentPage.layoutId}` : ''}
        </div>

        {currentPage && currentPage.components.length === 0 && (
          <div className="canvas-empty">
            <div className="canvas-empty__title">
              {canAdd ? 'Halaman kosong' : `Halaman ${currentPage.role} (terpandu)`}
            </div>
            <div>
              {canAdd
                ? 'Klik tombol + Teks / + Gambar / + Kartu / + Navigasi di toolbar untuk menambah elemen.'
                : 'Elemen halaman terpandu akan diisi via template pedagogis (M11/M12).'}
            </div>
          </div>
        )}

        {currentPage?.components.map((component) => {
          const resolvedStyle = getResolvedComponentStyle(project, currentPage, component);
          const isSelected = component.id === selectedComponentId;

          const wrapStyle: React.CSSProperties = {
            position: 'absolute',
            left: component.x,
            top: component.y,
            width: component.width,
            height: component.height,
            cursor: dragState.mode === 'drag' ? 'grabbing' : 'grab',
          };

          return (
            <div
              key={component.id}
              style={wrapStyle}
              onPointerDown={(e) => handleDragStart(e, component.id)}
            >
              {isTextComponent(component) && (
                <TextComponentView
                  component={component}
                  resolvedStyle={resolvedStyle}
                  selected={isSelected}
                  onSelect={selectComponent}
                />
              )}
              {isImageComponent(component) && (
                <ImageComponentView
                  component={component}
                  resolvedStyle={resolvedStyle}
                  selected={isSelected}
                  onSelect={selectComponent}
                />
              )}
              {isCardComponent(component) && (
                <CardComponentView
                  component={component}
                  resolvedStyle={resolvedStyle}
                  selected={isSelected}
                  onSelect={selectComponent}
                />
              )}
              {isNavigationComponent(component) && (
                <NavigationComponentView
                  component={component}
                  resolvedStyle={resolvedStyle}
                  selected={isSelected}
                  onSelect={selectComponent}
                />
              )}

              {/* Resize handle (southeast) — editor only */}
              {isSelected && (
                <div
                  data-testid="resize-handle-se"
                  onPointerDown={(e) => handleResizeStart(e, component.id)}
                  style={{
                    position: 'absolute',
                    right: -6,
                    bottom: -6,
                    width: 12,
                    height: 12,
                    background: '#2563eb',
                    border: '2px solid #fff',
                    borderRadius: '50%',
                    cursor: 'nwse-resize',
                    zIndex: 10,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
