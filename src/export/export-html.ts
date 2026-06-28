/**
 * Export HTML module for silse-mpi-editor.
 *
 * Layer: export
 * Allowed imports: ../core (types, style resolver, style-presets)
 *
 * Kontrak (Batch 6 / M6 + M6 PATCH):
 *   - Satu file HTML standalone.
 *   - CSS inline dalam <style>.
 *   - JS inline dalam <script>.
 *   - Data project embedded sebagai JSON literal (render model).
 *   - TIDAK ADA switch style manual per variant di JS export.
 *   - Style datang dari resolveComponentStyle via buildExportRenderModel.
 *   - Tidak ada CDN, external script, external stylesheet.
 *   - Tidak ada React/Vite runtime.
 *   - Security: escape `</script>` in project data.
 */

import type { SimpleProject, SimplePage, PageComponent } from '../core/types';
import type { ProjectStyle } from '../core/style-types';
import { getResolvedComponentStyle } from '../core/style/resolveComponentStyle';

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

// ---------------------------------------------------------------------------
// Export Render Model — pre-computed style via resolver
// ---------------------------------------------------------------------------

/**
 * Render model for export. Each component has pre-computed resolvedStyle
 * from resolveComponentStyle. The inline JS does NOT re-compute style.
 */
type ExportRenderModel = {
  title: string;
  pages: ExportRenderPage[];
  cssVariables: Record<string, string>;
};

type ExportRenderPage = {
  id: string;
  title: string;
  background: SimplePage['background'];
  components: ExportRenderComponent[];
};

type ExportRenderComponent = {
  id: string;
  type: string;
  variant: string;
  // Geometry
  x: number;
  y: number;
  width: number;
  height: number;
  // Component-specific data
  text?: string;
  src?: string;
  alt?: string;
  objectFit?: string;
  cardTitle?: string;
  body?: string;
  label?: string;
  action?: string;
  targetPageId?: string;
  // Question-specific (M10)
  questionTitle?: string;
  prompt?: string;
  choices?: { id: string; text: string }[];
  correctChoiceIndex?: number;
  feedbackCorrect?: string;
  feedbackWrong?: string;
  points?: number;
  scoringStyle?: string;
  // Game-specific (M11A)
  gameType?: string;
  gameTitle?: string;
  gameInstruction?: string;
  missions?: { id: string; title: string; prompt: string; choices: { id: string; text: string }[]; correctChoiceIndex: number; feedbackCorrect: string; feedbackWrong: string; points: number }[];
  // Layered-info-specific (LXC-02)
  layeredTitle?: string;
  layeredVariant?: string;
  layers?: { id: string; title: string; body: string; icon?: string }[];
  defaultOpenIndex?: number | null;
  // Learning-bridge-specific (LXC-03)
  bridgeTitle?: string;
  bridgeVariant?: string;
  bridgeMessage?: string;
  bridgeNextButtonLabel?: string;
  // Pre-computed resolved style from resolver
  resolvedStyle: {
    inlineStyle: Record<string, string | number>;
    className?: string;
    interactions?: {
      hover?: Record<string, string | undefined>;
      press?: Record<string, string | undefined>;
      focus?: Record<string, string | undefined>;
    };
  };
};

/**
 * Build export render model with pre-computed resolvedStyle per component.
 * This is where resolveComponentStyle is called for export.
 */
function buildExportRenderModel(project: SimpleProject): ExportRenderModel {
  const cssVariables = generateCssVariablesMap(project.style);

  const pages: ExportRenderPage[] = project.pages.map((page) => ({
    id: page.id,
    title: page.title,
    background: page.background,
    components: page.components.map((component) =>
      buildExportRenderComponent(project, page, component),
    ),
  }));

  return { title: project.title, pages, cssVariables };
}

function buildExportRenderComponent(
  project: SimpleProject,
  page: SimplePage,
  component: PageComponent,
): ExportRenderComponent {
  // M6 PATCH: resolve style via shared resolver
  const resolved = getResolvedComponentStyle(project, page, component);

  const base: ExportRenderComponent = {
    id: component.id,
    type: component.type,
    variant: (component as { variant: string }).variant,
    x: component.x,
    y: component.y,
    width: component.width,
    height: component.height,
    resolvedStyle: {
      inlineStyle: resolved.inlineStyle,
      className: resolved.className,
      interactions: resolved.interactions as Record<string, Record<string, string | undefined>> | undefined,
    },
  };

  // Component-specific data
  if (component.type === 'text') {
    base.text = component.text;
  } else if (component.type === 'image') {
    base.src = component.src;
    base.alt = component.alt ?? '';
    base.objectFit = component.objectFit;
  } else if (component.type === 'card') {
    base.cardTitle = component.title ?? '';
    base.body = component.body;
  } else if (component.type === 'navigation') {
    base.label = component.label;
    base.action = component.action;
    base.targetPageId = component.targetPageId ?? '';
  } else if (component.type === 'question') {
    base.questionTitle = component.title;
    base.prompt = component.prompt;
    base.choices = component.choices;
    base.correctChoiceIndex = component.correctChoiceIndex;
    base.feedbackCorrect = component.feedbackCorrect;
    base.feedbackWrong = component.feedbackWrong;
    base.points = component.points;
    base.scoringStyle = component.scoringStyle;
  } else if (component.type === 'game') {
    base.gameType = component.gameType;
    base.gameTitle = component.title;
    base.gameInstruction = component.instruction;
    base.missions = component.missions;
    base.scoringStyle = component.scoringStyle;
  } else if (component.type === 'layered-info') {
    base.layeredTitle = component.title;
    base.layeredVariant = component.variant;
    base.layers = component.layers;
    base.defaultOpenIndex = component.defaultOpenIndex;
  } else if (component.type === 'learning-bridge') {
    base.bridgeTitle = component.title;
    base.bridgeVariant = component.variant;
    base.bridgeMessage = component.message;
    base.bridgeNextButtonLabel = component.nextButtonLabel;
  }

  return base;
}

// ---------------------------------------------------------------------------
// Security: escape `</script>` in JSON data
// ---------------------------------------------------------------------------

function serializeRenderModel(model: ExportRenderModel): string {
  const json = JSON.stringify(model);
  return json.replace(/<\/script>/gi, '<\\/script>');
}

// ---------------------------------------------------------------------------
// CSS variables from StylePack tokens
// ---------------------------------------------------------------------------

function generateCssVariablesMap(style: ProjectStyle | undefined): Record<string, string> {
  if (!style) return {};

  const { colors, typography, spacing, radius, shadow } = style.tokens;
  return {
    '--silse-color-background': colors.background,
    '--silse-color-surface': colors.surface,
    '--silse-color-primary': colors.primary,
    '--silse-color-secondary': colors.secondary,
    '--silse-color-text': colors.text,
    '--silse-color-muted-text': colors.mutedText,
    '--silse-color-border': colors.border,
    '--silse-color-success': colors.success,
    '--silse-color-warning': colors.warning,
    '--silse-color-danger': colors.danger,
    '--silse-font-family': typography.fontFamily,
    '--silse-title-size': `${typography.titleSize}px`,
    '--silse-subtitle-size': `${typography.subtitleSize}px`,
    '--silse-body-size': `${typography.bodySize}px`,
    '--silse-small-size': `${typography.smallSize}px`,
    '--silse-line-height': String(typography.lineHeight),
    '--silse-spacing-page-padding': `${spacing.pagePadding}px`,
    '--silse-spacing-component-gap': `${spacing.componentGap}px`,
    '--silse-spacing-card-padding': `${spacing.cardPadding}px`,
    '--silse-radius-small': `${radius.small}px`,
    '--silse-radius-medium': `${radius.medium}px`,
    '--silse-radius-large': `${radius.large}px`,
    '--silse-shadow-none': shadow.none,
    '--silse-shadow-soft': shadow.soft,
    '--silse-shadow-medium': shadow.medium,
  };
}

function generateCssVariablesString(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');
}

// ---------------------------------------------------------------------------
// CSS generation
// ---------------------------------------------------------------------------

function generateCSS(cssVars: Record<string, string>): string {
  const varsStr = generateCssVariablesString(cssVars);

  return `
:root {
${varsStr}
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--silse-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  background: #1a1a1a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}

#silse-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  color: #fff;
  font-size: 14px;
  align-items: center;
}

#silse-toolbar button {
  background: rgba(255,255,255,0.1);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.2);
  padding: 6px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

#silse-toolbar button:disabled { opacity: 0.4; cursor: not-allowed; }
#silse-toolbar button:hover:not(:disabled) { background: rgba(255,255,255,0.2); }

#silse-canvas {
  width: ${CANVAS_WIDTH}px;
  height: ${CANVAS_HEIGHT}px;
  background: var(--silse-color-background, #ffffff);
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.3);
  flex-shrink: 0;
}

#silse-canvas .silse-nav-btn {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

#silse-canvas .silse-question-choice {
  padding: 10px 14px;
  min-height: 44px;
  height: auto;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1.5;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  transition: background-color 0.15s ease-out;
}

#silse-canvas .silse-question-feedback {
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  white-space: normal;
  overflow-wrap: anywhere;
}

#silse-toolbar .silse-score {
  margin-left: 12px;
  font-weight: bold;
  color: #fbbf24;
}

#silse-canvas .silse-game-choice {
  padding: 10px 14px;
  min-height: 44px;
  height: auto;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1.5;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

#silse-canvas .silse-game-feedback {
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  white-space: normal;
  overflow-wrap: anywhere;
}
`.trim();
}

// ---------------------------------------------------------------------------
// JS generation — reads from render model, NO style switch
// ---------------------------------------------------------------------------

function generateJS(renderModelJson: string): string {
  return `
(function() {
  var MODEL = ${renderModelJson};
  var pages = MODEL.pages;
  var currentPageIdx = 0;
  var questionAnswers = {};
  var totalScore = 0;
  var gameStates = {};
  var layeredInfoStates = {};

  var canvas = document.getElementById('silse-canvas');
  var prevBtn = document.getElementById('silse-nav-prev');
  var nextBtn = document.getElementById('silse-nav-next');
  var pageInfo = document.getElementById('silse-page-info');
  var scoreDisplay = document.getElementById('silse-score');

  function updateScoreDisplay() {
    if (scoreDisplay) scoreDisplay.textContent = 'Skor: ' + totalScore;
  }

  function renderPage(idx) {
    if (idx < 0 || idx >= pages.length) return;
    currentPageIdx = idx;
    var page = pages[idx];
    canvas.innerHTML = '';

    // Set background
    if (page.background.type === 'color') {
      canvas.style.background = page.background.color;
    } else if (page.background.type === 'gradient') {
      canvas.style.background = page.background.gradient;
    } else if (page.background.type === 'image') {
      canvas.style.background = 'url(' + page.background.imageSrc + ') center/cover no-repeat';
    }

    // Render components — style from resolvedStyle, NO switch
    for (var i = 0; i < page.components.length; i++) {
      var comp = page.components[i];
      var el = renderComponent(comp);
      if (el) canvas.appendChild(el);
    }

    prevBtn.disabled = (currentPageIdx === 0);
    nextBtn.disabled = (currentPageIdx === pages.length - 1);
    pageInfo.textContent = (currentPageIdx + 1) + ' / ' + pages.length + ' - ' + page.title;
  }

  function buildInlineStyle(comp) {
    // Geometry + resolvedStyle.inlineStyle — NO style switch
    var s = 'position:absolute;left:' + comp.x + 'px;top:' + comp.y + 'px;width:' + comp.width + 'px;height:' + comp.height + 'px;';
    var rs = comp.resolvedStyle.inlineStyle;
    for (var key in rs) {
      if (rs.hasOwnProperty(key)) {
        var cssKey = key.replace(/[A-Z]/g, function(m) { return '-' + m.toLowerCase(); });
        s += cssKey + ':' + rs[key] + ';';
      }
    }
    return s;
  }

  function renderComponent(comp) {
    var style = buildInlineStyle(comp);
    var el;

    if (comp.type === 'text') {
      el = document.createElement('div');
      el.style.cssText = style + 'display:flex;align-items:center;overflow:hidden;white-space:pre-wrap;word-break:break-word;box-sizing:border-box;';
      el.textContent = comp.text || '';
      return el;
    }

    if (comp.type === 'image') {
      el = document.createElement('div');
      el.style.cssText = style + 'overflow:hidden;box-sizing:border-box;';
      var img = document.createElement('img');
      img.src = comp.src;
      img.alt = comp.alt || '';
      img.style.cssText = 'width:100%;height:100%;object-fit:' + comp.objectFit + ';display:block;pointer-events:none;';
      el.appendChild(img);
      return el;
    }

    if (comp.type === 'card') {
      el = document.createElement('div');
      el.style.cssText = style + 'box-sizing:border-box;display:flex;flex-direction:column;gap:8px;overflow:hidden;';
      if (comp.cardTitle) {
        var title = document.createElement('strong');
        title.style.fontSize = '16px';
        title.textContent = comp.cardTitle;
        el.appendChild(title);
      }
      var body = document.createElement('div');
      body.style.cssText = 'font-size:14px;line-height:1.5;white-space:pre-wrap;word-break:break-word;flex:1;overflow:auto;';
      body.textContent = comp.body || '';
      el.appendChild(body);
      return el;
    }

    if (comp.type === 'navigation') {
      el = document.createElement('button');
      el.className = 'silse-nav-btn';
      el.dataset.action = comp.action;
      el.dataset.target = comp.targetPageId || '';
      el.style.cssText = style + 'cursor:pointer;display:flex;align-items:center;justify-content:center;user-select:none;';

      // Apply interaction styles from resolvedStyle.interactions
      var interactions = comp.resolvedStyle.interactions;
      if (interactions && interactions.hover) {
        var hover = interactions.hover;
        if (hover.transition) el.style.transition = hover.transition;
        // Store original + hover styles for event listeners
        el._origTransform = el.style.transform || '';
        el._hoverTransform = hover.transform || '';
        el._hoverBoxShadow = hover.boxShadow || '';
        el._origBoxShadow = el.style.boxShadow || '';

        el.addEventListener('mouseenter', function() {
          if (this._hoverTransform) this.style.transform = this._hoverTransform;
          if (this._hoverBoxShadow) this.style.boxShadow = this._hoverBoxShadow;
        });
        el.addEventListener('mouseleave', function() {
          this.style.transform = this._origTransform;
          this.style.boxShadow = this._origBoxShadow;
        });
      }
      if (interactions && interactions.press) {
        var press = interactions.press;
        el._pressTransform = press.transform || '';
        el.addEventListener('mousedown', function() {
          if (this._pressTransform) this.style.transform = this._pressTransform;
        });
        el.addEventListener('mouseup', function() {
          this.style.transform = this._hoverTransform || this._origTransform;
        });
      }

      el.textContent = comp.label || '';
      return el;
    }

    if (comp.type === 'question') {
      el = document.createElement('div');
      el.className = 'silse-question';
      el.style.cssText = style + 'box-sizing:border-box;display:flex;flex-direction:column;gap:8px;overflow:auto;padding:12px;';

      if (comp.questionTitle) {
        var qTitle = document.createElement('strong');
        qTitle.style.fontSize = '16px';
        qTitle.textContent = comp.questionTitle;
        el.appendChild(qTitle);
      }

      var qPrompt = document.createElement('div');
      qPrompt.style.cssText = 'font-size:15px;font-weight:500;margin-bottom:8px;white-space:normal;overflow-wrap:anywhere;';
      qPrompt.textContent = comp.prompt || '';
      el.appendChild(qPrompt);

      var choicesContainer = document.createElement('div');
      choicesContainer.style.cssText = 'display:flex;flex-direction:column;gap:6px;';

      var existingAnswer = questionAnswers[comp.id];

      for (var ci = 0; ci < comp.choices.length; ci++) {
        (function(choiceIdx, choice, compId, correctIdx, pts, fbCorrect, fbWrong) {
          var choiceEl = document.createElement('div');
          choiceEl.className = 'silse-question-choice';
          choiceEl.dataset.choiceIndex = String(choiceIdx);

          var bg = '#ffffff';
          if (existingAnswer && existingAnswer.isAnswered) {
            if (choiceIdx === correctIdx) bg = '#d1fae5';
            else if (choiceIdx === existingAnswer.selectedChoiceIndex) bg = '#fee2e2';
          }
          choiceEl.style.backgroundColor = bg;

          var letter = document.createElement('span');
          letter.style.fontWeight = 'bold';
          letter.style.minWidth = '20px';
          letter.textContent = String.fromCharCode(65 + choiceIdx) + '.';
          choiceEl.appendChild(letter);

          var choiceText = document.createElement('span');
          choiceText.style.flex = '1';
          choiceText.style.whiteSpace = 'normal';
          choiceText.style.overflowWrap = 'anywhere';
          choiceText.textContent = choice.text;
          choiceEl.appendChild(choiceText);

          choiceEl.addEventListener('click', function() {
            var ans = questionAnswers[compId];
            if (ans && ans.isAnswered) return; // already answered, no re-score

            var isCorrect = choiceIdx === correctIdx;
            questionAnswers[compId] = { selectedChoiceIndex: choiceIdx, isAnswered: true };

            if (isCorrect) {
              totalScore += pts;
              updateScoreDisplay();
            }

            // Re-render this question to show feedback
            renderPage(currentPageIdx);
          });

          choicesContainer.appendChild(choiceEl);
        })(ci, comp.choices[ci], comp.id, comp.correctChoiceIndex, comp.points, comp.feedbackCorrect, comp.feedbackWrong);
      }
      el.appendChild(choicesContainer);

      // Show feedback if answered
      if (existingAnswer && existingAnswer.isAnswered) {
        var feedback = document.createElement('div');
        feedback.className = 'silse-question-feedback';
        var isCorrectAnswer = existingAnswer.selectedChoiceIndex === comp.correctChoiceIndex;
        feedback.style.backgroundColor = isCorrectAnswer ? '#d1fae5' : '#fee2e2';
        feedback.style.color = isCorrectAnswer ? '#065f46' : '#991b1b';
        feedback.textContent = isCorrectAnswer ? comp.feedbackCorrect : comp.feedbackWrong;
        el.appendChild(feedback);
      }

      return el;
    }

    if (comp.type === 'game') {
      el = document.createElement('div');
      el.className = 'silse-game';
      el.style.cssText = style + 'box-sizing:border-box;display:flex;flex-direction:column;gap:8px;overflow:auto;padding:12px;';

      var gameState = gameStates[comp.id] || { currentMissionIndex: 0, selectedChoiceIndex: null, isAnswered: false, score: 0, completed: false };
      gameStates[comp.id] = gameState;

      if (gameState.completed) {
        var doneTitle = document.createElement('strong');
        doneTitle.style.fontSize = '18px';
        doneTitle.textContent = 'Game Selesai!';
        el.appendChild(doneTitle);
        var doneScore = document.createElement('div');
        doneScore.style.cssText = 'font-size:16px;margin-top:8px;';
        doneScore.textContent = 'Skor: ' + gameState.score;
        el.appendChild(doneScore);
        var retryBtn = document.createElement('button');
        retryBtn.style.cssText = 'margin-top:12px;padding:8px 16px;';
        retryBtn.textContent = 'Ulangi Game';
        retryBtn.addEventListener('click', function() {
          gameStates[comp.id] = { currentMissionIndex: 0, selectedChoiceIndex: null, isAnswered: false, score: 0, completed: false };
          renderPage(currentPageIdx);
        });
        el.appendChild(retryBtn);
        return el;
      }

      var mission = comp.missions[gameState.currentMissionIndex];
      if (!mission) return el;

      var gTitle = document.createElement('strong');
      gTitle.style.fontSize = '16px';
      gTitle.textContent = comp.gameTitle || 'Game';
      el.appendChild(gTitle);

      var gInstr = document.createElement('div');
      gInstr.style.cssText = 'font-size:13px;color:#6b7280;white-space:normal;overflow-wrap:anywhere;';
      gInstr.textContent = comp.gameInstruction || '';
      el.appendChild(gInstr);

      var gProgress = document.createElement('div');
      gProgress.style.cssText = 'font-size:12px;color:#6b7280;';
      gProgress.textContent = 'Misi ' + (gameState.currentMissionIndex + 1) + ' / ' + comp.missions.length + ' · Skor: ' + gameState.score;
      el.appendChild(gProgress);

      var gPrompt = document.createElement('div');
      gPrompt.style.cssText = 'font-size:15px;font-weight:500;margin-top:4px;white-space:normal;overflow-wrap:anywhere;';
      gPrompt.textContent = mission.prompt || '';
      el.appendChild(gPrompt);

      var gChoices = document.createElement('div');
      gChoices.style.cssText = 'display:flex;flex-direction:column;gap:6px;';

      for (var gi = 0; gi < mission.choices.length; gi++) {
        (function(gChoiceIdx, gChoice, gCompId, gMission, gState) {
          var gChoiceEl = document.createElement('div');
          gChoiceEl.className = 'silse-game-choice';
          var gBg = '#ffffff';
          if (gState.isAnswered) {
            if (gChoiceIdx === gMission.correctChoiceIndex) gBg = '#d1fae5';
            else if (gChoiceIdx === gState.selectedChoiceIndex) gBg = '#fee2e2';
          }
          gChoiceEl.style.backgroundColor = gBg;

          var gLetter = document.createElement('span');
          gLetter.style.fontWeight = 'bold';
          gLetter.style.minWidth = '20px';
          gLetter.textContent = String.fromCharCode(65 + gChoiceIdx) + '.';
          gChoiceEl.appendChild(gLetter);

          var gText = document.createElement('span');
          gText.style.flex = '1';
          gText.style.whiteSpace = 'normal';
          gText.style.overflowWrap = 'anywhere';
          gText.textContent = gChoice.text;
          gChoiceEl.appendChild(gText);

          gChoiceEl.addEventListener('click', function() {
            if (gState.isAnswered) return;
            gState.selectedChoiceIndex = gChoiceIdx;
            gState.isAnswered = true;
            if (gChoiceIdx === gMission.correctChoiceIndex) {
              gState.score += gMission.points;
              updateScoreDisplay();
            }
            renderPage(currentPageIdx);
          });

          gChoices.appendChild(gChoiceEl);
        })(gi, mission.choices[gi], comp.id, mission, gameState);
      }
      el.appendChild(gChoices);

      if (gameState.isAnswered) {
        var gFeedback = document.createElement('div');
        gFeedback.className = 'silse-game-feedback';
        var gIsCorrect = gameState.selectedChoiceIndex === mission.correctChoiceIndex;
        gFeedback.style.backgroundColor = gIsCorrect ? '#d1fae5' : '#fee2e2';
        gFeedback.style.color = gIsCorrect ? '#065f46' : '#991b1b';
        gFeedback.textContent = gIsCorrect ? mission.feedbackCorrect : mission.feedbackWrong;
        el.appendChild(gFeedback);

        if (gameState.currentMissionIndex < comp.missions.length - 1) {
          var nextBtn = document.createElement('button');
          nextBtn.style.cssText = 'margin-top:8px;padding:8px 16px;';
          nextBtn.textContent = 'Misi Berikutnya';
          nextBtn.addEventListener('click', function() {
            gameState.currentMissionIndex++;
            gameState.selectedChoiceIndex = null;
            gameState.isAnswered = false;
            renderPage(currentPageIdx);
          });
          el.appendChild(nextBtn);
        } else {
          gameState.completed = true;
          var finishBtn = document.createElement('button');
          finishBtn.style.cssText = 'margin-top:8px;padding:8px 16px;';
          finishBtn.textContent = 'Lihat Hasil';
          finishBtn.addEventListener('click', function() {
            renderPage(currentPageIdx);
          });
          el.appendChild(finishBtn);
        }
      }

      return el;
    }

    if (comp.type === 'layered-info') {
      el = document.createElement('div');
      el.className = 'silse-layered-info';
      el.style.cssText = style + 'box-sizing:border-box;display:flex;flex-direction:column;gap:8px;overflow:auto;padding:12px;';

      if (comp.layeredTitle) {
        var liTitle = document.createElement('strong');
        liTitle.style.cssText = 'font-size:16px;margin-bottom:4px;white-space:normal;overflow-wrap:anywhere;';
        liTitle.textContent = comp.layeredTitle;
        el.appendChild(liTitle);
      }

      var layers = comp.layers || [];
      if (layers.length === 0) {
        var liEmpty = document.createElement('div');
        liEmpty.style.cssText = 'color:#6b7280;font-size:13px;font-style:italic;';
        liEmpty.textContent = 'Belum ada lapisan.';
        el.appendChild(liEmpty);
        return el;
      }

      // Initialize runtime state for this layered-info
      if (!(comp.id in layeredInfoStates)) {
        layeredInfoStates[comp.id] = comp.defaultOpenIndex;
      }
      var openIdx = layeredInfoStates[comp.id];

      var variant = comp.layeredVariant;

      if (variant === 'accordion') {
        var accContainer = document.createElement('div');
        accContainer.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
        layers.forEach(function(layer, idx) {
          var isOpen = openIdx === idx;
          var accItem = document.createElement('div');
          accItem.style.cssText = 'border:1px solid ' + (isOpen ? '#2563eb' : '#d1d5db') + ';border-radius:6px;overflow:hidden;';
          var accHead = document.createElement('div');
          accHead.style.cssText = 'padding:8px 12px;background:' + (isOpen ? '#eff6ff' : '#f9fafb') + ';cursor:pointer;display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:' + (isOpen ? '#2563eb' : '#1f2937') + ';white-space:normal;overflow-wrap:anywhere;';
          accHead.textContent = (isOpen ? '▾ ' : '▸ ') + layer.title;
          (function(itemIdx) {
            accHead.addEventListener('click', function() {
              layeredInfoStates[comp.id] = (layeredInfoStates[comp.id] === itemIdx) ? null : itemIdx;
              renderPage(currentPageIdx);
            });
          })(idx);
          accItem.appendChild(accHead);
          if (isOpen) {
            var accBody = document.createElement('div');
            accBody.style.cssText = 'padding:10px 12px;font-size:13px;line-height:1.5;color:#1f2937;white-space:pre-wrap;overflow-wrap:anywhere;';
            accBody.textContent = layer.body;
            accItem.appendChild(accBody);
          }
          accContainer.appendChild(accItem);
        });
        el.appendChild(accContainer);
      } else if (variant === 'tabs' || variant === 'iconTabs') {
        // Tabs / iconTabs
        var safeActive = (openIdx === null || openIdx < 0 || openIdx >= layers.length) ? 0 : openIdx;
        var tabsBar = document.createElement('div');
        tabsBar.style.cssText = 'display:flex;gap:4px;border-bottom:2px solid #e3ddcd;flex-wrap:wrap;';
        layers.forEach(function(layer, idx) {
          var isActive = safeActive === idx;
          var tab = document.createElement('button');
          tab.style.cssText = 'padding:6px 12px;font-size:12px;font-weight:' + (isActive ? '600' : '500') + ';border:none;border-bottom:2px solid ' + (isActive ? '#2563eb' : 'transparent') + ';background:' + (isActive ? '#eff6ff' : 'transparent') + ';color:' + (isActive ? '#2563eb' : '#4a5160') + ';cursor:pointer;margin-bottom:-2px;display:inline-flex;align-items:center;gap:4px;border-radius:4px 4px 0 0;';
          if (variant === 'iconTabs' && layer.icon) {
            var iconSpan = document.createElement('span');
            iconSpan.style.fontSize = '14px';
            iconSpan.textContent = layer.icon;
            tab.appendChild(iconSpan);
          }
          var tabLabel = document.createElement('span');
          tabLabel.textContent = layer.title;
          tab.appendChild(tabLabel);
          (function(itemIdx) {
            tab.addEventListener('click', function() {
              layeredInfoStates[comp.id] = itemIdx;
              renderPage(currentPageIdx);
            });
          })(idx);
          tabsBar.appendChild(tab);
        });
        el.appendChild(tabsBar);
        var activeLayer = layers[safeActive];
        if (activeLayer) {
          var tabBody = document.createElement('div');
          tabBody.style.cssText = 'padding:10px;font-size:13px;line-height:1.5;color:#1f2937;white-space:pre-wrap;overflow-wrap:anywhere;flex:1;overflow:auto;';
          tabBody.textContent = activeLayer.body;
          el.appendChild(tabBody);
        }
      } else if (variant === 'stepper') {
        // Stepper
        var sSafeActive = (openIdx === null || openIdx < 0 || openIdx >= layers.length) ? 0 : openIdx;
        var stepBar = document.createElement('div');
        stepBar.style.cssText = 'display:flex;gap:2px;align-items:center;flex-wrap:wrap;';
        layers.forEach(function(layer, idx) {
          var isActive = sSafeActive === idx;
          var isPast = idx < sSafeActive;
          var step = document.createElement('button');
          step.style.cssText = 'width:28px;height:28px;border-radius:50%;border:2px solid ' + (isActive ? '#2563eb' : isPast ? '#2f7d4f' : '#d1d5db') + ';background:' + (isActive ? '#2563eb' : isPast ? '#2f7d4f' : '#fff') + ';color:#fff;font-size:12px;font-weight:700;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;';
          step.textContent = String(idx + 1);
          step.title = layer.title;
          (function(itemIdx) {
            step.addEventListener('click', function() {
              layeredInfoStates[comp.id] = itemIdx;
              renderPage(currentPageIdx);
            });
          })(idx);
          stepBar.appendChild(step);
          if (idx < layers.length - 1) {
            var line = document.createElement('div');
            line.style.cssText = 'width:24px;height:2px;background:' + (isPast ? '#2f7d4f' : '#d1d5db') + ';';
            stepBar.appendChild(line);
          }
        });
        el.appendChild(stepBar);
        var stepTitle = document.createElement('div');
        stepTitle.style.cssText = 'padding:8px 4px;font-size:12px;font-weight:600;color:#2563eb;white-space:normal;overflow-wrap:anywhere;';
        stepTitle.textContent = layers[sSafeActive] ? layers[sSafeActive].title : '';
        el.appendChild(stepTitle);
        if (layers[sSafeActive]) {
          var stepBody = document.createElement('div');
          stepBody.style.cssText = 'padding:10px;font-size:13px;line-height:1.5;color:#1f2937;white-space:pre-wrap;overflow-wrap:anywhere;flex:1;overflow:auto;background:#f9fafb;border-radius:6px;';
          stepBody.textContent = layers[sSafeActive].body;
          el.appendChild(stepBody);
        }
      } else if (variant === 'cardGrid') {
        // CardGrid
        var cSafeActive = (openIdx === null || openIdx < 0 || openIdx >= layers.length) ? 0 : openIdx;
        var grid = document.createElement('div');
        grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill, minmax(180px, 1fr));gap:6px;';
        layers.forEach(function(layer, idx) {
          var isActive = cSafeActive === idx;
          var card = document.createElement('button');
          card.style.cssText = 'padding:10px 8px;font-size:12px;font-weight:' + (isActive ? '600' : '500') + ';border:1px solid ' + (isActive ? '#2563eb' : '#d1d5db') + ';background:' + (isActive ? '#eff6ff' : '#fff') + ';color:' + (isActive ? '#2563eb' : '#1f2937') + ';border-radius:6px;cursor:pointer;text-align:center;display:flex;flex-direction:column;gap:2px;min-height:60px;';
          if (layer.icon) {
            var cIcon = document.createElement('span');
            cIcon.style.fontSize = '16px';
            cIcon.textContent = layer.icon;
            card.appendChild(cIcon);
          }
          var cLabel = document.createElement('span');
          cLabel.style.cssText = 'white-space:normal;overflow-wrap:anywhere;';
          cLabel.textContent = layer.title;
          card.appendChild(cLabel);
          (function(itemIdx) {
            card.addEventListener('click', function() {
              layeredInfoStates[comp.id] = itemIdx;
              renderPage(currentPageIdx);
            });
          })(idx);
          grid.appendChild(card);
        });
        el.appendChild(grid);
        if (layers[cSafeActive]) {
          var cBody = document.createElement('div');
          cBody.style.cssText = 'padding:10px;font-size:13px;line-height:1.5;color:#1f2937;white-space:pre-wrap;overflow-wrap:anywhere;background:#f9fafb;border-radius:6px;border:1px solid #e3ddcd;';
          cBody.textContent = layers[cSafeActive].body;
          el.appendChild(cBody);
        }
      } else if (variant === 'timeline') {
        // Timeline
        var tSafeActive = (openIdx === null || openIdx < 0 || openIdx >= layers.length) ? 0 : openIdx;
        var tl = document.createElement('div');
        tl.style.cssText = 'display:flex;flex-direction:column;gap:0;';
        layers.forEach(function(layer, idx) {
          var isActive = tSafeActive === idx;
          var isPast = idx < tSafeActive;
          var tlRow = document.createElement('div');
          tlRow.style.cssText = 'display:flex;gap:10px;align-items:flex-start;';
          var tlCol = document.createElement('div');
          tlCol.style.cssText = 'display:flex;flex-direction:column;align-items:center;flex-shrink:0;';
          var tlDot = document.createElement('button');
          tlDot.style.cssText = 'width:20px;height:20px;border-radius:50%;border:2px solid ' + (isActive ? '#2563eb' : isPast ? '#2f7d4f' : '#d1d5db') + ';background:' + (isActive ? '#2563eb' : isPast ? '#2f7d4f' : '#fff') + ';color:#fff;font-size:10px;font-weight:700;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;';
          tlDot.textContent = String(idx + 1);
          (function(itemIdx) {
            tlDot.addEventListener('click', function() {
              layeredInfoStates[comp.id] = itemIdx;
              renderPage(currentPageIdx);
            });
          })(idx);
          tlCol.appendChild(tlDot);
          if (idx < layers.length - 1) {
            var tlLine = document.createElement('div');
            tlLine.style.cssText = 'width:2px;height:24px;background:' + (isPast ? '#2f7d4f' : '#d1d5db') + ';';
            tlCol.appendChild(tlLine);
          }
          tlRow.appendChild(tlCol);
          var tlContent = document.createElement('div');
          tlContent.style.cssText = 'flex:1;padding-bottom:12px;';
          var tlTitleBtn = document.createElement('button');
          tlTitleBtn.style.cssText = 'border:none;background:transparent;padding:0;font-size:12px;font-weight:' + (isActive ? '700' : '500') + ';color:' + (isActive ? '#2563eb' : '#1f2937') + ';cursor:pointer;text-align:left;display:block;margin-bottom:2px;';
          tlTitleBtn.textContent = layer.title;
          (function(itemIdx) {
            tlTitleBtn.addEventListener('click', function() {
              layeredInfoStates[comp.id] = itemIdx;
              renderPage(currentPageIdx);
            });
          })(idx);
          tlContent.appendChild(tlTitleBtn);
          if (isActive) {
            var tlBody = document.createElement('div');
            tlBody.style.cssText = 'font-size:12px;line-height:1.5;color:#1f2937;white-space:pre-wrap;overflow-wrap:anywhere;';
            tlBody.textContent = layer.body;
            tlContent.appendChild(tlBody);
          }
          tlRow.appendChild(tlContent);
          tl.appendChild(tlRow);
        });
        el.appendChild(tl);
      }

      return el;
    }

    if (comp.type === 'learning-bridge') {
      el = document.createElement('div');
      el.className = 'silse-learning-bridge';
      el.style.cssText = style + 'box-sizing:border-box;display:flex;flex-direction:column;gap:10px;overflow:hidden;padding:16px;';

      var bridgeVariantIcon = { transition: '🔀', recap: '✅', preview: '👀' }[comp.bridgeVariant] || '🌉';
      var bridgeVariantLabel = { transition: 'Transisi', recap: 'Recap', preview: 'Preview' }[comp.bridgeVariant] || comp.bridgeVariant;

      var bridgeBadge = document.createElement('div');
      bridgeBadge.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:#6b7280;white-space:normal;overflow-wrap:anywhere;';
      bridgeBadge.textContent = bridgeVariantIcon + ' ' + bridgeVariantLabel;
      el.appendChild(bridgeBadge);

      if (comp.bridgeTitle) {
        var bTitle = document.createElement('strong');
        bTitle.style.cssText = 'font-size:18px;font-weight:700;white-space:normal;overflow-wrap:anywhere;';
        bTitle.textContent = comp.bridgeTitle;
        el.appendChild(bTitle);
      }

      var bMsg = document.createElement('div');
      bMsg.style.cssText = 'font-size:14px;line-height:1.6;white-space:normal;overflow-wrap:anywhere;flex:1;overflow:auto;';
      bMsg.textContent = comp.bridgeMessage || '';
      el.appendChild(bMsg);

      var bBtnWrap = document.createElement('div');
      bBtnWrap.style.cssText = 'display:flex;justify-content:flex-end;margin-top:auto;';
      var bBtn = document.createElement('button');
      bBtn.type = 'button';
      bBtn.style.cssText = 'padding:10px 20px;font-size:14px;font-weight:600;border:2px solid #2563eb;border-radius:8px;background:#2563eb;color:#ffffff;cursor:pointer;white-space:normal;overflow-wrap:anywhere;min-height:44px;display:inline-flex;align-items:center;gap:6px;';
      bBtn.textContent = comp.bridgeNextButtonLabel || 'Lanjut →';
      // LXC-03: bridge "next" button is visual-only — does not trigger navigation.
      // Real navigation comes from a separate NavigationComponent.
      bBtnWrap.appendChild(bBtn);
      el.appendChild(bBtnWrap);
      return el;
    }

    return null;
  }

  function navigate(action, target) {
    if (action === 'next' && currentPageIdx < pages.length - 1) {
      renderPage(currentPageIdx + 1);
    } else if (action === 'prev' && currentPageIdx > 0) {
      renderPage(currentPageIdx - 1);
    } else if (action === 'goto' && target) {
      for (var i = 0; i < pages.length; i++) {
        if (pages[i].id === target) {
          renderPage(i);
          break;
        }
      }
    }
  }

  prevBtn.addEventListener('click', function() { navigate('prev'); });
  nextBtn.addEventListener('click', function() { navigate('next'); });

  canvas.addEventListener('click', function(e) {
    var btn = e.target.closest('.silse-nav-btn');
    if (btn) {
      navigate(btn.dataset.action, btn.dataset.target);
    }
  });

  renderPage(0);
})();
`.trim();
}

// ---------------------------------------------------------------------------
// HTML escape
// ---------------------------------------------------------------------------

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------------------
// Main export function
// ---------------------------------------------------------------------------

export function exportProjectToHtml(project: SimpleProject): string {
  const renderModel = buildExportRenderModel(project);
  const renderModelJson = serializeRenderModel(renderModel);
  const css = generateCSS(renderModel.cssVariables);
  const js = generateJS(renderModelJson);

  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHTML(project.title)}</title>
  <style>
${css}
  </style>
</head>
<body>
  <div id="silse-toolbar">
    <button id="silse-nav-prev">← Sebelumnya</button>
    <span id="silse-page-info">1 / 1</span>
    <button id="silse-nav-next">Berikutnya →</button>
    <span id="silse-score" class="silse-score">Skor: 0</span>
  </div>
  <div id="silse-canvas"></div>
  <script>
${js}
  </script>
</body>
</html>`;
}

// Export for testing
export { buildExportRenderModel };
export type { ExportRenderModel, ExportRenderComponent };
