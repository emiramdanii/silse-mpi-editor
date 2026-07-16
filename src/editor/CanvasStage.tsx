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

import React, { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../store/editor-store';
import { NavigationToolbarBlock } from '../components/scene-blocks';
import { getCapability } from '../core/capability';
import { getBackgroundPatternForStylePack } from '../core/style-packs/background-pattern';
import { getCoverClassForStylePack } from '../core/style-packs/cover-decoration';
import { getMicroAnimationForStylePack } from '../core/style-packs/micro-animation';
import { getPremiumExportProfileWithProjectStyle, getPremiumCssVariables, getHeroKickerText } from '../core/style-packs/premium-export-profile';
import { buildSceneRenderPlanForPage } from '../core/scene-renderer';
import { SceneRendererView } from '../components/SceneRendererView';
import { getDesignContractWithProjectStyle } from '../core/mpi-design-contract';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../core/geometry';
import { Toolbar } from './Toolbar';
import { getRoleInfo } from './mpi-standard-roles';
import { getEffectiveGlobalSlideSettings } from '../core/project-factory';
import { snapRectToGridWithTolerance } from '../core/geometry';

export function CanvasStage() {
  const project = useEditorStore((s) => s.project);
  const currentPage = project.pages.find((p) => p.id === project.currentPageId) ?? null;
  const selectedComponentId = useEditorStore((s) => s.selectedComponentId);

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
  // V2-PILAR-2.5: multi-select
  const selectedComponentIds = useEditorStore((s) => s.selectedComponentIds);
  const toggleComponentInSelection = useEditorStore((s) => s.toggleComponentInSelection);
  const selectComponentRange = useEditorStore((s) => s.selectComponentRange);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const lastClickedId = React.useRef<string | null>(null);
  // CORE-MPI-UX-FOUNDATION-01: navigation
  const navigateNext = useEditorStore((s) => s.navigateNext);
  const navigatePrev = useEditorStore((s) => s.navigatePrev);

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

  // Fase 2b Step 4: Always build scene render plan (no more useSceneRenderer flag).
  // ALL pages now go through SceneRendererView — single render path.
  const sceneRenderPlan = currentPage ? buildSceneRenderPlanForPage(project, currentPage) : null;

  // V2-PILAR-2.5: Editor grid settings
  const effectiveSettings = getEffectiveGlobalSlideSettings(project);
  const gridConfig = effectiveSettings.editorGrid;
  const gridEnabled = gridConfig.enabled;
  const gridSnapActive = gridConfig.enabled && gridConfig.snapToGrid;

  // MEGA FIX #3: Auto-fit scale calculation
  const [fitScale, setFitScale] = useState(1);
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleResize = () => {
      if (!canvasAreaRef.current) return;
      const availW = canvasAreaRef.current.clientWidth - 48;
      const availH = canvasAreaRef.current.clientHeight - 48;
      if (availW <= 0 || availH <= 0) return;
      const sX = availW / CANVAS_WIDTH;
      const sY = availH / CANVAS_HEIGHT;
      setFitScale(Math.min(sX, sY, 1));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Combined scale: user zoom * fit scale
  const effectiveScale = zoom * fitScale;
  const zoomPercent = Math.round(effectiveScale * 100);

  return (
    <main className="canvas-stage" data-testid="canvas-stage">
      <Toolbar />
      {/* CORE-MPI-UX-FOUNDATION-01: Navigation toolbar — always shown when page exists
          V2-PILAR-1: Respect showSceneTitle + showProgressText from GlobalSlideSettings. */}
      {currentPage && (() => {
        const settings = getEffectiveGlobalSlideSettings(project);
        return (
          <div data-testid="canvas-stage-nav-wrapper" data-slide-settings-applied={project.globalSlideSettings ? 'true' : 'false'}>
            <NavigationToolbarBlock
              contract={getDesignContractWithProjectStyle(project.stylePackId, project.style)}
              currentSceneIndex={project.pages.findIndex((p) => p.id === currentPage.id)}
              totalScenes={project.pages.length}
              sceneTitle={settings.navigationToolbar.showSceneTitle ? currentPage.title : ''}
              onPrev={() => navigatePrev()}
              onNext={() => navigateNext()}
              canPrev={project.pages.findIndex((p) => p.id === currentPage.id) > 0}
              canNext={project.pages.findIndex((p) => p.id === currentPage.id) < project.pages.length - 1}
            />
          </div>
        );
      })()}
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
        ref={canvasAreaRef}
        className="canvas-stage__canvas-area"
        onPointerDown={handlePanStart}
        onPointerMove={handlePanMove}
        onPointerUp={handlePanEnd}
        onPointerLeave={handlePanEnd}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${effectiveScale})`,
          transformOrigin: 'center center',
          cursor: isPanning ? 'grabbing' : 'default',
          transition: isPanning ? 'none' : 'transform 0.15s ease-out',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
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
            // V2-PILAR-2.5: CSS dotted grid overlay (GPU-rendered, no DOM elements)
            ...(gridEnabled ? {
              backgroundImage: `radial-gradient(var(--color-border-neutral, #e2e8f0) 1px, transparent 1px)`,
              backgroundSize: `${gridConfig.gridSize}px ${gridConfig.gridSize}px`,
            } : {}),
          } as React.CSSProperties}
          onClick={() => clearSelection()}
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

          {currentPage && currentPage.components.length === 0 && !currentPage.sceneContent && (
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

          {/* Fase 2b Step 4: Scene renderer — single render path for ALL pages.
              No more legacy component-view fallback. */}
          {sceneRenderPlan && (
            <div data-testid="scene-renderer-mount" style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
              <SceneRendererView
                plan={sceneRenderPlan}
                contract={getDesignContractWithProjectStyle(project.stylePackId, project.style)}
                interactive={false}
                onSlotClick={(slotId, modifiers) => {
                  // V2-PILAR-2.5: Multi-select dengan Ctrl/Shift+Click
                  if (modifiers && (modifiers.ctrlKey || modifiers.metaKey)) {
                    // Ctrl+Click: toggle individual
                    toggleComponentInSelection(slotId);
                    lastClickedId.current = slotId;
                  } else if (modifiers && modifiers.shiftKey && lastClickedId.current) {
                    // Shift+Click: select range
                    selectComponentRange(lastClickedId.current, slotId);
                  } else {
                    // Single click: replace selection
                    selectComponent(slotId);
                    lastClickedId.current = slotId;
                  }
                }}
                selectedSlotId={selectedComponentId ?? undefined}
                selectedSlotIds={selectedComponentIds}
                customStyle={currentPage?.sceneCustomStyle}
                // PATCH A: Editor mode does NOT wire score/completion — prevents accidental score changes during editing.
                // Fase 2a Step 2: Editor interaction (drag/resize) for cover-hero scene type.
                // slot.id === component.id (Step 1 fix) makes selectComponent work through slots.
                editorMode={true}
                onSlotDrag={(slotId, x, y) => {
                  // Find the component to preserve width/height during drag
                  const comp = currentPage?.components.find((c) => c.id === slotId);
                  if (comp) {
                    let finalX = x;
                    let finalY = y;
                    // V2-PILAR-2.5: Snap to grid with tolerance if enabled
                    if (gridSnapActive) {
                      const snapped = snapRectToGridWithTolerance(
                        { x, y, width: comp.width, height: comp.height },
                        gridConfig.gridSize,
                        gridConfig.snapTolerance,
                      );
                      finalX = snapped.x;
                      finalY = snapped.y;
                    }
                    updateComponentGeometry(slotId, { x: finalX, y: finalY, width: comp.width, height: comp.height });
                  }
                }}
                onSlotResize={(slotId, width, height) => {
                  // Find the component to preserve x/y during resize
                  const comp = currentPage?.components.find((c) => c.id === slotId);
                  if (comp) {
                    let finalW = width;
                    let finalH = height;
                    // V2-PILAR-2.5: Snap to grid with tolerance if enabled
                    if (gridSnapActive) {
                      const snapped = snapRectToGridWithTolerance(
                        { x: comp.x, y: comp.y, width, height },
                        gridConfig.gridSize,
                        gridConfig.snapTolerance,
                      );
                      finalW = snapped.width;
                      finalH = snapped.height;
                    }
                    updateComponentGeometry(slotId, { x: comp.x, y: comp.y, width: finalW, height: finalH });
                  }
                }}
              />
            </div>
          )}

          {/* V2-PILAR-2.5: Group bounding box — dashed box around multi-selected components */}
          {selectedComponentIds.length > 1 && currentPage && (() => {
            const selectedComps = currentPage.components.filter((c) => selectedComponentIds.includes(c.id));
            if (selectedComps.length < 2) return null;
            const minX = Math.min(...selectedComps.map((c) => c.x));
            const minY = Math.min(...selectedComps.map((c) => c.y));
            const maxX = Math.max(...selectedComps.map((c) => c.x + c.width));
            const maxY = Math.max(...selectedComps.map((c) => c.y + c.height));
            const padding = 6;
            return (
              <div
                data-testid="group-bounding-box"
                style={{
                  position: 'absolute',
                  left: minX - padding,
                  top: minY - padding,
                  width: (maxX - minX) + padding * 2,
                  height: (maxY - minY) + padding * 2,
                  border: '2px dashed rgba(59, 130, 246, 0.5)',
                  borderRadius: 4,
                  pointerEvents: 'none',
                  zIndex: 50,
                }}
              />
            );
          })()}

        </div>
      </div>
      {/* MEGA FIX #3: Zoom percentage indicator */}
      <div
        data-testid="fit-scale-indicator"
        style={{
          position: 'absolute', bottom: 8, right: 12,
          padding: '2px 8px', borderRadius: 4,
          background: 'rgba(0,0,0,0.5)', color: '#fff',
          fontSize: 10, fontWeight: 600, pointerEvents: 'none',
          zIndex: 100,
        }}
      >
        {zoomPercent}%
      </div>
    </main>
  );
}
