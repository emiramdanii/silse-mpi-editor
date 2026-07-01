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
import { isCardComponent, isGameComponent, isImageComponent, isLayeredInfoComponent, isLearningBridgeComponent, isNavigationComponent, isQuestionComponent, isTextComponent } from '../components/component-utils';
import { TextComponentView } from '../components/TextComponentView';
import { ImageComponentView } from '../components/ImageComponentView';
import { CardComponentView } from '../components/CardComponentView';
import { NavigationComponentView } from '../components/NavigationComponentView';
import { QuestionComponentView } from '../components/QuestionComponentView';
import { GameComponentView } from '../components/GameComponentView';
import { LayeredInfoComponentView } from '../components/LayeredInfoComponentView';
import { LearningBridgeComponentView } from '../components/LearningBridgeComponentView';
import { getResolvedComponentStyle } from '../core/style/resolveComponentStyle';
import { getSkinClassForComponent } from '../core/style-packs/component-skin';
import { getBackgroundPatternForStylePack } from '../core/style-packs/background-pattern';
import { getCoverClassForStylePack } from '../core/style-packs/cover-decoration';
import { getMicroAnimationForStylePack } from '../core/style-packs/micro-animation';
import { getPremiumExportProfile, getPremiumCssVariables, getHeroKickerText } from '../core/style-packs/premium-export-profile';
import { buildSceneRenderPlanForPage } from '../core/scene-renderer';
import { SceneRendererView } from '../components/SceneRendererView';
import { NavigationToolbarBlock, ProgressBarBlock } from '../components/scene-blocks';
import { getDesignContract } from '../core/mpi-design-contract';
import type { GameComponent, NavigationComponent, QuestionComponent } from '../core/types';

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

export function PreviewApp() {
  const project = useEditorStore((s) => s.project);
  const isOpen = usePreviewStore((s) => s.isOpen);
  const currentPageId = usePreviewStore((s) => s.currentPageId);
  const questionAnswers = usePreviewStore((s) => s.questionAnswers);
  const gameStates = usePreviewStore((s) => s.gameStates);
  const totalScore = usePreviewStore((s) => s.totalScore);
  const closePreview = usePreviewStore((s) => s.closePreview);
  const navigateNext = usePreviewStore((s) => s.navigateNext);
  const navigatePrev = usePreviewStore((s) => s.navigatePrev);
  const navigateGoto = usePreviewStore((s) => s.navigateGoto);
  const answerQuestion = usePreviewStore((s) => s.answerQuestion);
  const answerGameMission = usePreviewStore((s) => s.answerGameMission);
  const nextGameMission = usePreviewStore((s) => s.nextGameMission);
  const resetGame = usePreviewStore((s) => s.resetGame);

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
          : '#ffffff';

  const bgPattern = getBackgroundPatternForStylePack(project.stylePackId);
  const coverClass = currentPage.role === 'cover' ? getCoverClassForStylePack(project.stylePackId) : '';
  const animProfile = getMicroAnimationForStylePack(project.stylePackId);

  // PATCH-1: Premium visual profile shared with editor + export.
  const premiumProfile = getPremiumExportProfile(project.stylePackId);
  const premiumCssVars = getPremiumCssVariables(premiumProfile);
  const heroKickerText = currentPage.role === 'cover'
    ? getHeroKickerText(project.curriculum?.subject, project.curriculum?.grade, currentPage.title)
    : '';
  const isCover = currentPage.role === 'cover';
  const isClosing = currentPage.role === 'closing';

  // FOUNDATION-INTEGRATION-01: jika page scene-renderable, pakai SceneRendererView.
  // Jalur lama tetap fallback untuk page tanpa scene.
  const sceneRenderPlan = buildSceneRenderPlanForPage(project, currentPage);
  const useSceneRenderer = !!sceneRenderPlan;

  const currentIdx = project.pages.findIndex((p) => p.id === currentPageId);
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === project.pages.length - 1;

  const handleNavigationClick = (component: NavigationComponent) => {
    switch (component.action) {
      case 'next':
        navigateNext();
        break;
      case 'prev':
        navigatePrev();
        break;
      case 'goto':
        if (component.targetPageId) {
          navigateGoto(component.targetPageId);
        }
        break;
    }
  };

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
        {/* CORE-MPI-UX-FOUNDATION-01: Navigation + Progress for scene-renderable projects */}
        {useSceneRenderer && (
          <>
            <NavigationToolbarBlock
              contract={getDesignContract(project.stylePackId)}
              currentSceneIndex={currentIdx}
              totalScenes={project.pages.length}
              sceneTitle={currentPage.title}
              onPrev={navigatePrev}
              onNext={navigateNext}
              canPrev={!isFirst}
              canNext={!isLast}
            />
            <ProgressBarBlock
              contract={getDesignContract(project.stylePackId)}
              currentSceneIndex={currentIdx}
              totalScenes={project.pages.length}
            />
          </>
        )}
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

          {/* FOUNDATION-INTEGRATION-01: Scene renderer path (jika page scene-renderable).
              Jalur lama tetap fallback untuk page tanpa scene. */}
          {useSceneRenderer && sceneRenderPlan && (
            <div data-testid="scene-renderer-mount-preview" style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
              <SceneRendererView
                plan={sceneRenderPlan}
                contract={getDesignContract(project.stylePackId)}
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
              />
            </div>
          )}

          {!useSceneRenderer && currentPage.components.map((component) => {
            // M6 PATCH: resolve style via shared resolver (same as editor + export)
            const resolvedStyle = getResolvedComponentStyle(project, currentPage, component);

            if (isTextComponent(component)) {
              return <TextComponentView key={component.id} component={component} resolvedStyle={resolvedStyle} skinClass={getSkinClassForComponent('text', project.stylePackId)} />;
            }
            if (isImageComponent(component)) {
              return <ImageComponentView key={component.id} component={component} resolvedStyle={resolvedStyle} />;
            }
            if (isCardComponent(component)) {
              return <CardComponentView key={component.id} component={component} resolvedStyle={resolvedStyle} skinClass={getSkinClassForComponent('card', project.stylePackId)} />;
            }
            if (isNavigationComponent(component)) {
              return (
                <NavigationComponentView
                  key={component.id}
                  component={component}
                  resolvedStyle={resolvedStyle}
                  onNavigate={() => handleNavigationClick(component as NavigationComponent)}
                  skinClass={getSkinClassForComponent('navigation', project.stylePackId)}
                />
              );
            }
            if (isQuestionComponent(component)) {
              const qa = questionAnswers[component.id] ?? { selectedChoiceIndex: null, isAnswered: false };
              const qc = component as QuestionComponent;
              return (
                <QuestionComponentView
                  key={component.id}
                  component={qc}
                  resolvedStyle={resolvedStyle}
                  onAnswer={(choiceIndex) => answerQuestion(qc.id, choiceIndex, qc.correctChoiceIndex, qc.points)}
                  selectedChoiceIndex={qa.selectedChoiceIndex}
                  isAnswered={qa.isAnswered}
                  skinClass={getSkinClassForComponent('question', project.stylePackId)}
                  stylePackId={project.stylePackId}
                />
              );
            }
            if (isGameComponent(component)) {
              const gc = component as GameComponent;
              const gs = gameStates[gc.id] ?? { currentMissionIndex: 0, selectedChoiceIndex: null, isAnswered: false, score: 0, completed: false };
              return (
                <GameComponentView
                  key={component.id}
                  component={gc}
                  resolvedStyle={resolvedStyle}
                  onAnswer={(missionIdx, choiceIdx) => {
                    const mission = gc.missions[missionIdx];
                    if (mission) {
                      answerGameMission(gc.id, missionIdx, choiceIdx, mission.correctChoiceIndex, mission.points);
                    }
                  }}
                  onNextMission={() => nextGameMission(gc.id, gc.missions.length)}
                  onRetry={() => resetGame(gc.id)}
                  gameState={gs}
                  skinClass={getSkinClassForComponent('game', project.stylePackId)}
                />
              );
            }
            if (isLayeredInfoComponent(component)) {
              return (
                <LayeredInfoComponentView
                  key={component.id}
                  component={component}
                  resolvedStyle={resolvedStyle}
                  interactive={true}
                  skinClass={getSkinClassForComponent('layered-info', project.stylePackId)}
                />
              );
            }
            if (isLearningBridgeComponent(component)) {
              return (
                <LearningBridgeComponentView
                  key={component.id}
                  component={component}
                  resolvedStyle={resolvedStyle}
                  skinClass={getSkinClassForComponent('learning-bridge', project.stylePackId)}
                />
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
}
