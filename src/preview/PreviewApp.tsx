/**
 * PreviewApp — fullscreen preview of the MPI project.
 *
 * Layer: preview
 * Allowed imports: ../core, ../components, ../store (read-only)
 *
 * M6 PATCH: Component views menerima resolvedStyle dari getResolvedComponentStyle.
 * Editor dan Preview memakai resolver yang sama.
 */

import React from 'react';
import { useEditorStore } from '../store/editor-store';
import { usePreviewStore } from './preview-store';
import { useStudentSessionStore } from '../store/student-session-store';
import { triggerCelebration } from '../core/scoring/celebration';
import { SessionDashboard } from '../components/SessionDashboard';
import { getBackgroundPatternForStylePack } from '../core/style-packs/background-pattern';
import { getCoverClassForStylePack } from '../core/style-packs/cover-decoration';
import { getMicroAnimationForStylePack } from '../core/style-packs/micro-animation';
import { getPremiumExportProfileWithProjectStyle, getPremiumCssVariables, getHeroKickerText } from '../core/style-packs/premium-export-profile';
import { buildSceneRenderPlanForPage } from '../core/scene-renderer';
import { SceneRendererView } from '../components/SceneRendererView';
import { NavigationToolbarBlock, ProgressBarBlock } from '../components/scene-blocks';
import { getDesignContractWithProjectStyle } from '../core/mpi-design-contract';
import type { GameComponent, QuestionComponent, InputFieldComponent } from '../core/types';
import { getEffectiveGlobalSlideSettings } from '../core/project-factory';

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
  // V2-PILAR-3: canvas ref for celebration burst container
  const canvasRef = React.useRef<HTMLDivElement>(null);
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

  // V2-PILAR-3: Count total scoring components in project for dashboard progress
  const totalScoringComponents = project.pages.reduce((count, page) => {
    return count + page.components.filter((c) => {
      if (c.type === 'question' || c.type === 'game') return true;
      if (c.type === 'input-field') {
        const ic = c as InputFieldComponent;
        return ic.correctAnswer !== undefined && ic.correctAnswer !== '';
      }
      return false;
    }).length;
  }, 0);

  // V2-PILAR-3: Show dashboard on closing page (SessionDashboard handles its own store subscription)
  const showDashboard = isClosing;

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
          ref={canvasRef}
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
                    const mission = gameComp.missions[0];
                    const correctIdx = mission?.correctChoiceIndex ?? 0;
                    const points = mission?.points ?? 0;
                    answerGameMission(gameComp.id, 0, actionIndex, correctIdx, points);
                    // V2-PILAR-3: Record ke student-session-store untuk scoring
                    const isCorrect = actionIndex === correctIdx;
                    const tier = useStudentSessionStore.getState().recordResponse({
                      componentId: gameComp.id,
                      slideId: currentPage.id,
                      isCorrect,
                      scoreEarned: isCorrect ? points : 0,
                      maxScore: points,
                      studentAnswer: mission?.choices[actionIndex]?.id ?? String(actionIndex),
                    });
                    // V2-PILAR-3: Trigger celebration burst
                    const newStreak = useStudentSessionStore.getState().currentStreak;
                    triggerCelebration(tier, canvasRef.current, canvasRef.current || document.body, undefined, newStreak);
                  }
                }}
                onQuizAnswer={(_slotId, choiceId) => {
                  const quizComp = currentPage.components.find((c) => c.type === 'question') as QuestionComponent | undefined;
                  if (quizComp) {
                    const choiceIdx = quizComp.choices.findIndex((c) => c.id === choiceId);
                    if (choiceIdx >= 0) {
                      answerQuestion(quizComp.id, choiceIdx, quizComp.correctChoiceIndex, quizComp.points);
                      // V2-PILAR-3: Record ke student-session-store untuk scoring
                      const isCorrect = choiceIdx === quizComp.correctChoiceIndex;
                      const tier = useStudentSessionStore.getState().recordResponse({
                        componentId: quizComp.id,
                        slideId: currentPage.id,
                        isCorrect,
                        scoreEarned: isCorrect ? quizComp.points : 0,
                        maxScore: quizComp.points,
                        studentAnswer: choiceId,
                      });
                      // V2-PILAR-3: Trigger celebration burst
                      const newStreak = useStudentSessionStore.getState().currentStreak;
                      triggerCelebration(tier, canvasRef.current, canvasRef.current || document.body, undefined, newStreak);
                    }
                  }
                }}
                onInputFieldSubmit={(slotId, isCorrect, studentAnswer) => {
                  // V2-PILAR-3: Record InputField answer ke student-session-store
                  // Cari InputFieldComponent di currentPage untuk dapatkan points + correctAnswer
                  const inputComp = currentPage.components.find((c) => c.id === slotId && c.type === 'input-field') as InputFieldComponent | undefined;
                  if (inputComp && inputComp.correctAnswer) {
                    const tier = useStudentSessionStore.getState().recordResponse({
                      componentId: inputComp.id,
                      slideId: currentPage.id,
                      isCorrect,
                      scoreEarned: isCorrect ? inputComp.points : 0,
                      maxScore: inputComp.points,
                      studentAnswer,
                    });
                    // V2-PILAR-3: Trigger celebration burst
                    const newStreak = useStudentSessionStore.getState().currentStreak;
                    triggerCelebration(tier, canvasRef.current, canvasRef.current || document.body, undefined, newStreak);
                  }
                }}
                onScoreSet={(sceneId, score) => useEditorStore.getState().setSceneScore(sceneId, score)}
                onSceneComplete={(sceneId) => useEditorStore.getState().markSceneCompleted(sceneId)}
                onSceneReset={(sceneId) => useEditorStore.getState().resetSceneRuntime(sceneId)}
                customStyle={currentPage?.sceneCustomStyle}
              />
            </div>
          )}

          {/* V2-PILAR-3: Session Dashboard — render di closing page jika ada responses */}
          {showDashboard && (
            <SessionDashboard totalScoringComponents={totalScoringComponents} />
          )}

          {/* BUG-NAV-02 (Option C): Navigation toolbar + progress bar rendered
              INSIDE canvas-frame as floating pill overlay, matching export HTML.
              Fase 2b Step 5: Always shown (no more useSceneRenderer gate).
              V2-PILAR-1: Apply GlobalSlideSettings (position, style, visibility). */}
          {(() => {
            const settings = getEffectiveGlobalSlideSettings(project);
            const nav = settings.navigationToolbar;
            // Build position style override
            const positionStyle: React.CSSProperties = (() => {
              switch (nav.position) {
                case 'top-center': return { bottom: 'auto', top: 20 };
                case 'bottom-left': return { left: 20, transform: 'none' };
                case 'bottom-right': return { left: 'auto', right: 20, transform: 'none' };
                default: return {}; // bottom-center = default
              }
            })();
            // Build style override (glass/solid/minimal)
            const styleOverride: React.CSSProperties = (() => {
              if (nav.style === 'solid') {
                return { backdropFilter: 'none', background: 'rgba(15, 23, 42, 0.95)' };
              }
              if (nav.style === 'minimal') {
                return { backdropFilter: 'none', background: 'transparent', border: 'none', boxShadow: 'none' };
              }
              return {}; // glass = default
            })();
            const transitionClass = settings.slideTransition !== 'none'
              ? `silse-slide-transition-${settings.slideTransition}`
              : '';
            return (
              <div
                data-testid="preview-global-slide-settings-wrapper"
                className={transitionClass}
                style={{
                  position: 'absolute',
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  alignItems: 'center',
                  // Position
                  bottom: nav.position.startsWith('bottom') ? 20 : 'auto',
                  left: nav.position === 'bottom-center' ? '50%' : (nav.position === 'bottom-left' ? 20 : 'auto'),
                  right: nav.position === 'bottom-right' ? 20 : 'auto',
                  top: nav.position === 'top-center' ? 20 : 'auto',
                  transform: nav.position === 'bottom-center' || nav.position === 'top-center' ? 'translateX(-50%)' : 'none',
                  ...positionStyle,
                  ...styleOverride,
                  padding: 8,
                  borderRadius: 999,
                  pointerEvents: 'auto',
                }}
              >
                <NavigationToolbarBlock
                  contract={getDesignContractWithProjectStyle(project.stylePackId, project.style)}
                  currentSceneIndex={currentIdx}
                  totalScenes={project.pages.length}
                  sceneTitle={nav.showSceneTitle ? currentPage.title : ''}
                  onPrev={navigatePrev}
                  onNext={navigateNext}
                  canPrev={!isFirst}
                  canNext={!isLast}
                />
                {nav.showProgressBar && (
                  <ProgressBarBlock
                    contract={getDesignContractWithProjectStyle(project.stylePackId, project.style)}
                    currentSceneIndex={currentIdx}
                    totalScenes={project.pages.length}
                  />
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
