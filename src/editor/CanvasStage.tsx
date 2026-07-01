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
import { getPremiumExportProfile, getPremiumCssVariables, getHeroKickerText } from '../core/style-packs/premium-export-profile';
import { getResolvedComponentStyle } from '../core/style/resolveComponentStyle';
import { buildSceneRenderPlanForPage } from '../core/scene-renderer';
import { SceneRendererView } from '../components/SceneRendererView';
import { getDesignContract } from '../core/mpi-design-contract';
import { snapToGrid, clampRectToCanvas, CANVAS_WIDTH, CANVAS_HEIGHT, type Rect } from '../core/geometry';
import { Toolbar } from './Toolbar';
import { getRoleInfo } from './mpi-standard-roles';

export function CanvasStage() {
  const project = useEditorStore((s) => s.project);
  const currentPage = project.pages.find((p) => p.id === project.currentPageId) ?? null;
  const selectedComponentId = useEditorStore((s) => s.selectedComponentId);
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

  const bgPattern = getBackgroundPatternForStylePack(project.stylePackId);
  const coverClass = currentPage?.role === 'cover' ? getCoverClassForStylePack(project.stylePackId) : '';
  const animProfile = getMicroAnimationForStylePack(project.stylePackId);

  // PATCH-1: Premium visual profile shared with export + preview.
  const premiumProfile = getPremiumExportProfile(project.stylePackId);
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
          contract={getDesignContract(project.stylePackId)}
          currentSceneIndex={project.pages.findIndex((p) => p.id === currentPage.id)}
          totalScenes={project.pages.length}
          sceneTitle={currentPage.title}
          onPrev={() => navigatePrev()}
          onNext={() => navigateNext()}
          canPrev={project.pages.findIndex((p) => p.id === currentPage.id) > 0}
          canNext={project.pages.findIndex((p) => p.id === currentPage.id) < project.pages.length - 1}
        />
      )}
      <div className="canvas-stage__canvas-area">
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
                contract={getDesignContract(project.stylePackId)}
                interactive={false}
                onSlotClick={(slotId) => selectComponent(slotId)}
                selectedSlotId={selectedComponentId ?? undefined}
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
      </div>
    </main>
  );
}
