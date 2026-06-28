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
import { isCardComponent, isGameComponent, isImageComponent, isLayeredInfoComponent, isNavigationComponent, isQuestionComponent, isTextComponent } from '../components/component-utils';
import { TextComponentView } from '../components/TextComponentView';
import { ImageComponentView } from '../components/ImageComponentView';
import { CardComponentView } from '../components/CardComponentView';
import { NavigationComponentView } from '../components/NavigationComponentView';
import { QuestionComponentView } from '../components/QuestionComponentView';
import { GameComponentView } from '../components/GameComponentView';
import { LayeredInfoComponentView } from '../components/LayeredInfoComponentView';
import { getResolvedComponentStyle } from '../core/style/resolveComponentStyle';
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
        <div
          className="canvas-frame preview-canvas"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            background: bg,
          }}
        >
          {currentPage.components.map((component) => {
            // M6 PATCH: resolve style via shared resolver (same as editor + export)
            const resolvedStyle = getResolvedComponentStyle(project, currentPage, component);

            if (isTextComponent(component)) {
              return <TextComponentView key={component.id} component={component} resolvedStyle={resolvedStyle} />;
            }
            if (isImageComponent(component)) {
              return <ImageComponentView key={component.id} component={component} resolvedStyle={resolvedStyle} />;
            }
            if (isCardComponent(component)) {
              return <CardComponentView key={component.id} component={component} resolvedStyle={resolvedStyle} />;
            }
            if (isNavigationComponent(component)) {
              return (
                <NavigationComponentView
                  key={component.id}
                  component={component}
                  resolvedStyle={resolvedStyle}
                  onNavigate={() => handleNavigationClick(component as NavigationComponent)}
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
