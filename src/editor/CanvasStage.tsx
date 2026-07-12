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
                onSlotClick={(slotId) => selectComponent(slotId)}
                selectedSlotId={selectedComponentId ?? undefined}
                customStyle={currentPage?.sceneCustomStyle}
                // PATCH A: Editor mode does NOT wire score/completion — prevents accidental score changes during editing.
                // Fase 2a Step 2: Editor interaction (drag/resize) for cover-hero scene type.
                // slot.id === component.id (Step 1 fix) makes selectComponent work through slots.
                editorMode={true}
                onSlotDrag={(slotId, x, y) => {
                  // Find the component to preserve width/height during drag
                  const comp = currentPage?.components.find((c) => c.id === slotId);
                  if (comp) {
                    updateComponentGeometry(slotId, { x, y, width: comp.width, height: comp.height });
                  }
                }}
                onSlotResize={(slotId, width, height) => {
                  // Find the component to preserve x/y during resize
                  const comp = currentPage?.components.find((c) => c.id === slotId);
                  if (comp) {
                    updateComponentGeometry(slotId, { x: comp.x, y: comp.y, width, height });
                  }
                }}
              />
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
