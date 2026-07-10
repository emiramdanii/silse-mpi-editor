/**
 * PreviewApp — fullscreen preview of the MPI project.
 *
 * Layer: preview
 * Allowed imports: ../core, ../components, ../store (read-only)
 *
 * M6 PATCH: Component views menerima resolvedStyle dari getResolvedComponentStyle.
 * Editor dan Preview memakai resolver yang sama.
 */

import { useEditorStore } from '../store/editor-store';
import { usePreviewStore } from './preview-store';
import { getBackgroundPatternForStylePack } from '../core/style-packs/background-pattern';
import { getCoverClassForStylePack } from '../core/style-packs/cover-decoration';
import { getMicroAnimationForStylePack } from '../core/style-packs/micro-animation';
import { getPremiumExportProfileWithProjectStyle, getPremiumCssVariables, getHeroKickerText } from '../core/style-packs/premium-export-profile';
import { buildSceneRenderPlanForPage } from '../core/scene-renderer';
import { SceneRendererView } from '../components/SceneRendererView';
import { NavigationToolbarBlock, ProgressBarBlock } from '../components/scene-blocks';
import { getDesignContractWithProjectStyle } from '../core/mpi-design-contract';
import type { GameComponent, QuestionComponent } from '../core/types';

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

export function PreviewApp() {
  const project = useEditorStore((s) => s.project);
  const isOpen = usePreviewStore((s) => s.isOpen);
  const currentPageId = usePreviewStore((s) => s.currentPageId);
  const totalScore = usePreviewStore((s) => s.totalScore);
  const closePreview = usePreviewStore((s) => s.closePreview);
  const navigateNext = usePreviewStore((s) => s.navigateNext);
  const navigatePrev = usePreviewStore((s) => s.navigatePrev);
  const answerQuestion = usePreviewStore((s) => s.answerQuestion);
  const answerGameMission = usePreviewStore((s) => s.answerGameMission);

  if (!isOpen) return null;

  const currentPage = project.pages.find((p) => p.id === currentPageId) ?? null;

  if (!currentPage) {
    return (
      <div className="preview-overlay">
        <div className="preview-empty">
          <p>Tidak ada halaman untuk ditampilkan.</p>
          <button onClick={closePreview}>Tutup Pratinjau</button>
        </div>
      </div>
    );
  }

  const bg =
    currentPage.background.type === 'color'
      ? currentPage.background.color
      : currentPage.background.type === 'gradient'
        ? currentPage.background.gradient
        : currentPage.background.type === 'image'
          ? `url(${currentPage.background.imageSrc}) center/cover no-repeat`
          : 'var(--color-panel)';

  const bgPattern = getBackgroundPatternForStylePack(project.stylePackId);
  const coverClass = currentPage.role === 'cover' ? getCoverClassForStylePack(project.stylePackId) : '';
  const animProfile = getMicroAnimationForStylePack(project.stylePackId);

  // PATCH-1: Premium visual profile shared with editor + export.
  const premiumProfile = getPremiumExportProfileWithProjectStyle(project.stylePackId, project.style);
  const premiumCssVars = getPremiumCssVariables(premiumProfile);
  const heroKickerText = currentPage.role === 'cover'
    ? getHeroKickerText(project.curriculum?.subject, project.curriculum?.grade, currentPage.title)
    : '';
  const isCover = currentPage.role === 'cover';
  const isClosing = currentPage.role === 'closing';

  // Fase 2b Step 5: Always build scene render plan (no more useSceneRenderer flag).
  // ALL pages now go through SceneRendererView — single render path.
  const sceneRenderPlan = buildSceneRenderPlanForPage(project, currentPage);

  const currentIdx = project.pages.findIndex((p) => p.id === currentPageId);
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === project.pages.length - 1;

  return (
    <div className="preview-overlay" data-testid="preview-overlay">
      <div className="preview-toolbar">
        <span className="preview-toolbar__title">
          Pratinjau MPI · {currentPage.title} ({currentIdx + 1}/{project.pages.length})
          {totalScore > 0 && ` · Skor: ${totalScore}`}
        </span>
        <div className="preview-toolbar__nav">
          <button onClick={navigatePrev} disabled={isFirst} title="Halaman sebelumnya">
            ← Sebelumnya
          </button>
          <button onClick={navigateNext} disabled={isLast} title="Halaman berikutnya">
            Berikutnya →
          </button>
          <button onClick={closePreview} className="danger" title="Tutup pratinjau">
            ✕ Tutup
          </button>
        </div>
      </div>
      <div className="preview-canvas-wrap">
        <div
          className={`canvas-frame preview-canvas silse-premium-stage ${bgPattern.pageClass} ${bgPattern.patternClass} ${coverClass} ${animProfile.pageEnterClass}`.trim()}
          data-testid="preview-canvas-frame"
          data-page-role={currentPage.role}
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            background: bg,
            ...premiumCssVars,
          } as React.CSSProperties}
        >
          {/* BUG-NAV-02 (Option C): Navigation toolbar moved INSIDE canvas-frame
              to match export HTML positioning (floating pill at bottom-center).
              Previously rendered as a top horizontal bar OUTSIDE the canvas,
              causing WYSINWYG mismatch between preview and export. */}
          {/* PATCH-1: Premium auto-decoration layer (mirrors export + editor). */}
          {(isCover || isClosing) && (
            <div className="silse-premium-decoration" data-testid="silse-premium-decoration-preview" aria-hidden="true">
              {isCover && (
                <>
                  <div className="silse-hero-card" data-testid="silse-hero-card-preview" />
                  {heroKickerText && (
                    <div className="silse-hero-kicker" data-testid="silse-hero-kicker-preview">
                      {heroKickerText}
                    </div>
                  )}
                  <button
                    className="silse-hero-cta"
                    data-testid="silse-hero-cta-preview"
                    type="button"
                    onClick={(e) => { e.stopPropagation(); navigateNext(); }}
                    aria-label="Mulai pembelajaran, pergi ke halaman berikutnya"
                  >
                    Mulai Pembelajaran →
                  </button>
                </>
              )}
              {isClosing && (
                <>
                  <div className="silse-award-medal" data-testid="silse-award-medal-preview">
                    <div className="silse-award-shine" />
                    <div className="silse-award-glow" />
                    <div className="silse-award-medal-inner">🏆</div>
                  </div>
                  <div className="silse-award-ribbon" data-testid="silse-award-ribbon-preview">
                    ✨ Penjelajah Selesai ✨
                  </div>
                </>
              )}
            </div>
          )}

          {/* Fase 2b Step 5: Scene renderer — single render path for ALL pages.
              No more legacy component-view fallback. */}
          {sceneRenderPlan && (
            <div data-testid="scene-renderer-mount-preview" style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
              <SceneRendererView
                plan={sceneRenderPlan}
                contract={getDesignContractWithProjectStyle(project.stylePackId, project.style)}
                interactive={true}
                onGameAction={(_slotId, actionIndex) => {
                  // Find the game component for this slot and trigger answer
                  const gameComp = currentPage.components.find((c) => c.type === 'game') as GameComponent | undefined;
                  if (gameComp) {
                    answerGameMission(gameComp.id, 0, actionIndex, gameComp.missions[0]?.correctChoiceIndex ?? 0, gameComp.missions[0]?.points ?? 0);
                  }
                }}
                onQuizAnswer={(_slotId, choiceId) => {
                  const quizComp = currentPage.components.find((c) => c.type === 'question') as QuestionComponent | undefined;
                  if (quizComp) {
                    const choiceIdx = quizComp.choices.findIndex((c) => c.id === choiceId);
                    if (choiceIdx >= 0) answerQuestion(quizComp.id, choiceIdx, quizComp.correctChoiceIndex, quizComp.points);
                  }
                }}
                onScoreSet={(sceneId, score) => useEditorStore.getState().setSceneScore(sceneId, score)}
                onSceneComplete={(sceneId) => useEditorStore.getState().markSceneCompleted(sceneId)}
                onSceneReset={(sceneId) => useEditorStore.getState().resetSceneRuntime(sceneId)}
                customStyle={currentPage?.sceneCustomStyle}
              />
            </div>
          )}

          {/* BUG-NAV-02 (Option C): Navigation toolbar + progress bar rendered
              INSIDE canvas-frame as floating pill overlay, matching export HTML.
              Fase 2b Step 5: Always shown (no more useSceneRenderer gate). */}
          <>
            <NavigationToolbarBlock
              contract={getDesignContractWithProjectStyle(project.stylePackId, project.style)}
              currentSceneIndex={currentIdx}
              totalScenes={project.pages.length}
              sceneTitle={currentPage.title}
              onPrev={navigatePrev}
              onNext={navigateNext}
              canPrev={!isFirst}
              canNext={!isLast}
            />
            <ProgressBarBlock
              contract={getDesignContractWithProjectStyle(project.stylePackId, project.style)}
              currentSceneIndex={currentIdx}
              totalScenes={project.pages.length}
            />
          </>
        </div>
      </div>
    </div>
  );
}
