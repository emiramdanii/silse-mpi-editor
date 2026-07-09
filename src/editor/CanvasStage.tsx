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
 *
 * UX-01:
 *   - EditorToolbar ditempatkan di atas canvas (konteks dekat dengan aksi).
 *   - Empty state memakai label role ramah guru + saran elemen pertama.
 */

import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../store/editor-store';
import { isCardComponent, isGameComponent, isImageComponent, isLayeredInfoComponent, isLearningBridgeComponent, isNavigationComponent, isQuestionComponent, isTextComponent } from '../components/component-utils';
import { TextComponentView } from '../components/TextComponentView';
import { ImageComponentView } from '../components/ImageComponentView';
import { CardComponentView } from '../components/CardComponentView';
import { NavigationComponentView } from '../components/NavigationComponentView';
import { QuestionComponentView } from '../components/QuestionComponentView';
import { GameComponentView } from '../components/GameComponentView';
import { LayeredInfoComponentView } from '../components/LayeredInfoComponentView';
import { LearningBridgeComponentView } from '../components/LearningBridgeComponentView';
import { NavigationToolbarBlock } from '../components/scene-blocks';
import { getCapability } from '../core/capability';
import { getSkinClassForComponent } from '../core/style-packs/component-skin';
import { getBackgroundPatternForStylePack } from '../core/style-packs/background-pattern';
import { getCoverClassForStylePack } from '../core/style-packs/cover-decoration';
import { getMicroAnimationForStylePack } from '../core/style-packs/micro-animation';
import { getPremiumExportProfileWithProjectStyle, getPremiumCssVariables, getHeroKickerText } from '../core/style-packs/premium-export-profile';
import { getResolvedComponentStyle } from '../core/style/resolveComponentStyle';
import { buildSceneRenderPlanForPage } from '../core/scene-renderer';
import { SceneRendererView } from '../components/SceneRendererView';
import { getDesignContractWithProjectStyle } from '../core/mpi-design-contract';
import { snapToGrid, clampRectToCanvas, CANVAS_WIDTH, CANVAS_HEIGHT, type Rect } from '../core/geometry';
import { Toolbar } from './Toolbar';
import { getRoleInfo } from './mpi-standard-roles';

export function CanvasStage() {
  const project = useEditorStore((s) => s.project);
  const currentPage = project.pages.find((p) => p.id === project.currentPageId) ?? null;
  const selectedComponentId = useEditorStore((s) => s.selectedComponentId);
  // UX-02: selected component for drag feedback
  const selectedComponent = currentPage?.components.find((c) => c.id === selectedComponentId) ?? null;

  // UX-06: Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const zoomIn = () => setZoom((z) => Math.min(z + 0.1, 2));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.3));
  const zoomReset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const handlePanStart = (e: React.PointerEvent) => {
    // Middle mouse button (button === 1) or space+drag
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    }
  };

  const handlePanMove = (e: React.PointerEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setPan({ x: panStart.current.panX + dx, y: panStart.current.panY + dy });
  };

  const handlePanEnd = () => setIsPanning(false);
  const selectComponent = useEditorStore((s) => s.selectComponent);
  const updateComponentGeometry = useEditorStore((s) => s.updateComponentGeometry);
  const removeComponent = useEditorStore((s) => s.removeComponent);
  // CORE-MPI-UX-FOUNDATION-01: navigation
  const navigateNext = useEditorStore((s) => s.navigateNext);
  const navigatePrev = useEditorStore((s) => s.navigatePrev);

  const [dragState, setDragState] = useState<{
    mode: 'drag' | 'resize' | null;
    startX: number;
    startY: number;
    origRect: Rect | null;
  }>({ mode: null, startX: 0, startY: 0, origRect: null });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Keyboard delete + duplicate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in input/textarea/select
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }
      if (target.isContentEditable) return;

      const selectedId = useEditorStore.getState().selectedComponentId;

      // F-03: Ctrl+D = duplicate selected component
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedId) {
        e.preventDefault();
        const state = useEditorStore.getState();
        const page = state.project.pages.find((p) => p.id === state.project.currentPageId);
        const comp = page?.components.find((c) => c.id === selectedId);
        if (comp) {
          // Deep copy with new ID + offset position
          const copy = JSON.parse(JSON.stringify(comp)) as typeof comp;
          copy.id = `comp-${Date.now()}`;
          copy.x = comp.x + 20;
          copy.y = comp.y + 20;
          state.addComponentsToPage(page!.id, [copy]);
          state.selectComponent(copy.id);
        }
        return;
      }

      // Delete/Backspace = remove selected component
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          e.preventDefault();
          removeComponent(selectedId);
        }
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
          : 'var(--color-panel)';

  const bgPattern = getBackgroundPatternForStylePack(project.stylePackId);
  const coverClass = currentPage?.role === 'cover' ? getCoverClassForStylePack(project.stylePackId) : '';
  const animProfile = getMicroAnimationForStylePack(project.stylePackId);

  // PATCH-1: Premium visual profile shared with export + preview.
  const premiumProfile = getPremiumExportProfileWithProjectStyle(project.stylePackId, project.style);
  const premiumCssVars = getPremiumCssVariables(premiumProfile);
  const heroKickerText = currentPage?.role === 'cover'
    ? getHeroKickerText(project.curriculum?.subject, project.curriculum?.grade, currentPage.title)
    : '';
  const isCover = currentPage?.role === 'cover';
  const isClosing = currentPage?.role === 'closing';

  const capability = currentPage ? getCapability(currentPage.role) : null;
  const canAdd = capability?.allowAddComponent ?? false;
  const roleInfo = currentPage ? getRoleInfo(currentPage.role) : null;

  const emptyHint = (() => {
    if (!currentPage) return '';
    if (canAdd) {
      return `Pakai tombol di toolbar atas kanvas untuk menambah elemen pertama di halaman ${roleInfo?.label ?? ''}.`;
    }
    return 'Halaman terpandu — elemen diatur otomatis oleh template.';
  })();

  // FOUNDATION-INTEGRATION-01: jika page scene-renderable, pakai SceneRendererView.
  // Jalur lama tetap fallback untuk page tanpa scene.
  const sceneRenderPlan = currentPage ? buildSceneRenderPlanForPage(project, currentPage) : null;
  const useSceneRenderer = !!sceneRenderPlan;

  return (
    <main className="canvas-stage" data-testid="canvas-stage">
      <Toolbar />
      {/* CORE-MPI-UX-FOUNDATION-01: Navigation toolbar for scene-renderable projects */}
      {useSceneRenderer && currentPage && (
        <NavigationToolbarBlock
          contract={getDesignContractWithProjectStyle(project.stylePackId, project.style)}
          currentSceneIndex={project.pages.findIndex((p) => p.id === currentPage.id)}
          totalScenes={project.pages.length}
          sceneTitle={currentPage.title}
          onPrev={() => navigatePrev()}
          onNext={() => navigateNext()}
          canPrev={project.pages.findIndex((p) => p.id === currentPage.id) > 0}
          canNext={project.pages.findIndex((p) => p.id === currentPage.id) < project.pages.length - 1}
        />
      )}
      {/* UX-06: Zoom controls */}
      <div
        data-testid="zoom-controls"
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '4px 8px', background: 'var(--color-panel)', borderRadius: 6,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)', position: 'absolute',
          top: 60, right: 16, zIndex: 100,
        }}
      >
        <button
          onClick={zoomOut}
          data-testid="zoom-out"
          title="Zoom out"
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, padding: '2px 6px' }}
        >−</button>
        <span
          data-testid="zoom-level"
          style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text)', minWidth: 36, textAlign: 'center' }}
        >
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={zoomIn}
          data-testid="zoom-in"
          title="Zoom in"
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, padding: '2px 6px' }}
        >+</button>
        <button
          onClick={zoomReset}
          data-testid="zoom-reset"
          title="Reset zoom (100%)"
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 11, padding: '2px 6px', color: 'var(--color-muted)' }}
        >↺</button>
      </div>
      <div
        className="canvas-stage__canvas-area"
        onPointerDown={handlePanStart}
        onPointerMove={handlePanMove}
        onPointerUp={handlePanEnd}
        onPointerLeave={handlePanEnd}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          cursor: isPanning ? 'grabbing' : 'default',
          transition: isPanning ? 'none' : 'transform 0.15s ease-out',
        }}
      >
        <div
          ref={canvasRef}
          className={`canvas-frame silse-premium-stage ${bgPattern.pageClass} ${bgPattern.patternClass} ${coverClass} ${animProfile.pageEnterClass}`.trim()}
          data-testid="canvas-frame"
          data-page-role={currentPage?.role ?? undefined}
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            background: bg,
            ...premiumCssVars,
          } as React.CSSProperties}
          onClick={() => selectComponent(null)}
        >
          <div className="canvas-frame__label" data-testid="canvas-frame-label">
            {CANVAS_WIDTH} × {CANVAS_HEIGHT} · {currentPage?.title ?? '—'} ·{' '}
            {currentPage ? `${roleInfo?.label ?? currentPage.role} · ${currentPage.layoutId}` : ''}
          </div>

          {/* PATCH-1: Premium auto-decoration layer (mirrors export).
              pointer-events:none + z-index:0 so it never interferes with
              drag/select/resize of user components. */}
          {(isCover || isClosing) && (
            <div className="silse-premium-decoration" data-testid="silse-premium-decoration" aria-hidden="true">
              {isCover && (
                <>
                  <div className="silse-hero-card" data-testid="silse-hero-card" />
                  {heroKickerText && (
                    <div className="silse-hero-kicker" data-testid="silse-hero-kicker">
                      {heroKickerText}
                    </div>
                  )}
                  <div className="silse-hero-cta" data-testid="silse-hero-cta-editor">
                    Mulai Pembelajaran →
                  </div>
                </>
              )}
              {isClosing && (
                <>
                  <div className="silse-award-medal" data-testid="silse-award-medal-editor">
                    <div className="silse-award-shine" />
                    <div className="silse-award-glow" />
                    <div className="silse-award-medal-inner">🏆</div>
                  </div>
                  <div className="silse-award-ribbon" data-testid="silse-award-ribbon-editor">
                    ✨ Penjelajah Selesai ✨
                  </div>
                </>
              )}
            </div>
          )}

          {currentPage && currentPage.components.length === 0 && !useSceneRenderer && (
            <div className="canvas-empty" data-testid="canvas-empty">
              <div className="canvas-empty__icon" aria-hidden>
                {roleInfo?.icon ?? '📄'}
              </div>
              <div className="canvas-empty__title">
                {canAdd
                  ? `Halaman ${roleInfo?.label ?? currentPage.role} masih kosong`
                  : `Halaman ${roleInfo?.label ?? currentPage.role} (terpandu)`}
              </div>
              <div className="canvas-empty__hint">
                {emptyHint}
              </div>
            </div>
          )}

          {/* FOUNDATION-INTEGRATION-01: Scene renderer path (jika page scene-renderable).
              Jalur lama tetap fallback untuk page tanpa scene. */}
          {useSceneRenderer && sceneRenderPlan && (
            <div data-testid="scene-renderer-mount" style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
              <SceneRendererView
                plan={sceneRenderPlan}
                contract={getDesignContractWithProjectStyle(project.stylePackId, project.style)}
                interactive={false}
                onSlotClick={(slotId) => selectComponent(slotId)}
                selectedSlotId={selectedComponentId ?? undefined}
                customStyle={currentPage?.sceneCustomStyle}
                // PATCH A: Editor mode does NOT wire score/completion — prevents accidental score changes during editing.
              />
            </div>
          )}

        {!useSceneRenderer && currentPage?.components.map((component) => {
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
                  positionMode="fill"
                  skinClass={getSkinClassForComponent('text', project.stylePackId)}
                />
              )}
              {isImageComponent(component) && (
                <ImageComponentView
                  component={component}
                  resolvedStyle={resolvedStyle}
                  selected={isSelected}
                  onSelect={selectComponent}
                  positionMode="fill"
                />
              )}
              {isCardComponent(component) && (
                <CardComponentView
                  component={component}
                  resolvedStyle={resolvedStyle}
                  selected={isSelected}
                  onSelect={selectComponent}
                  positionMode="fill"
                  skinClass={getSkinClassForComponent('card', project.stylePackId)}
                />
              )}
              {isNavigationComponent(component) && (
                <NavigationComponentView
                  component={component}
                  resolvedStyle={resolvedStyle}
                  selected={isSelected}
                  onSelect={selectComponent}
                  positionMode="fill"
                  skinClass={getSkinClassForComponent('navigation', project.stylePackId)}
                />
              )}
              {isQuestionComponent(component) && (
                <QuestionComponentView
                  component={component}
                  resolvedStyle={resolvedStyle}
                  selected={isSelected}
                  onSelect={selectComponent}
                  positionMode="fill"
                  skinClass={getSkinClassForComponent('question', project.stylePackId)}
                  stylePackId={project.stylePackId}
                />
              )}
              {isGameComponent(component) && (
                <GameComponentView
                  component={component}
                  resolvedStyle={resolvedStyle}
                  selected={isSelected}
                  onSelect={selectComponent}
                  positionMode="fill"
                  skinClass={getSkinClassForComponent('game', project.stylePackId)}
                />
              )}
              {isLayeredInfoComponent(component) && (
                <LayeredInfoComponentView
                  component={component}
                  resolvedStyle={resolvedStyle}
                  selected={isSelected}
                  onSelect={selectComponent}
                  positionMode="fill"
                  interactive={false}
                  skinClass={getSkinClassForComponent('layered-info', project.stylePackId)}
                />
              )}
              {isLearningBridgeComponent(component) && (
                <LearningBridgeComponentView
                  component={component}
                  resolvedStyle={resolvedStyle}
                  selected={isSelected}
                  onSelect={selectComponent}
                  positionMode="fill"
                  interactive={false}
                  skinClass={getSkinClassForComponent('learning-bridge', project.stylePackId)}
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
                    background: 'var(--color-accent)',
                    border: '2px solid var(--color-panel)',
                    borderRadius: '50%',
                    cursor: 'nwse-resize',
                    zIndex: 10,
                  }}
                />
              )}

              {/* UX-02: Drag/Resize feedback — dimension label */}
              {isSelected && dragState.mode && (
                <div
                  data-testid="drag-dimension-label"
                  style={{
                    position: 'absolute',
                    bottom: -24,
                    left: 0,
                    background: 'var(--color-accent)',
                    color: 'var(--color-panel)',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 3,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    zIndex: 10,
                  }}
                >
                  {Math.round(component.width)} × {Math.round(component.height)} · ({Math.round(component.x)}, {Math.round(component.y)})
                </div>
              )}
            </div>
          );
        })}
        </div>

        {/* UX-02: Drag/Resize feedback — alignment guide lines overlay */}
        {dragState.mode && selectedComponent && (
          <div
            data-testid="drag-guides-overlay"
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 5,
            }}
          >
            {/* Center vertical guide */}
            <div
              data-testid="drag-guide-center-v"
              style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                bottom: 0,
                width: 1,
                background: 'rgba(37, 99, 235, 0.3)',
                borderLeft: '1px dashed rgba(37, 99, 235, 0.5)',
              }}
            />
            {/* Center horizontal guide */}
            <div
              data-testid="drag-guide-center-h"
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: 1,
                background: 'rgba(37, 99, 235, 0.3)',
                borderTop: '1px dashed rgba(37, 99, 235, 0.5)',
              }}
            />
          </div>
        )}
      </div>
    </main>
  );
}
