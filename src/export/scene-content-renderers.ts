/**
 * Scene Content Renderers — Export-only JS source for 5 inline scene renderers.
 *
 * Layer: export (pure JS string, no React/DOM at module level)
 * Allowed imports: none
 *
 * Background:
 *   Sub-Fase 3b Commit 6 — extract 5 inline scene renderers from
 *   export-html.ts:generateJS() template literal into a separate module.
 *   The renderers run at runtime in the exported HTML (inside <script>),
 *   so they are plain JS functions (document.createElement + string concat).
 *
 *   This module exports getSceneContentRendererJs() which returns the JS
 *   source string. export-html.ts interpolates it into generateJS().
 *
 *   The 5 renderers:
 *     1. renderGameMissionSceneContent (game-mission scene)
 *     2. renderQuizSceneContent (quiz-challenge scene)
 *     3. renderLearningMaterialSceneContent (learning-material scene)
 *     4. renderCoverHeroSceneContent (cover-hero scene)
 *     5. renderClosingAwardSceneContent (closing-award scene)
 *
 *   These are CALLED by renderSceneContent() dispatch (which stays inline
 *   in generateJS — it handles generic content kinds like text/card/button
 *   that are too small to extract).
 *
 * Architecture note:
 *   These functions use closure variables _sceneCustomStyleCss and
 *   _currentPageRole (set by renderSceneFromPlan). They also call
 *   getContrastAwareTextColor() (inline JS function defined at top of
 *   generateJS). The caller must ensure these are in scope.
 *
 *   The editor (React) does NOT use these functions — it has its own
 *   React composers in scene-composers/index.tsx. This is an intentional
 *   architectural split (React JSX vs plain DOM API).
 */

export function getSceneContentRendererJs(): string {
  return `  // game-mission scene content untuk export (interactive: click actions)
  // DESIGN-CONTRACT-RENDER-PARITY-01: briefing/target card style from resolvedStyle
  function renderGameMissionSceneContent(slot, content) {
    var wrapper = document.createElement('div');
    wrapper.className = 'silse-game-scene';
    wrapper.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;gap:10px;padding:16px;box-sizing:border-box;overflow:hidden;';

    var rs = slot.resolvedStyle || {};
    var surf = rs.surface || {};

    // Briefing — uses resolvedStyle.surface (from contract.game.briefingPanel)
    var briefing = document.createElement('div');
    briefing.className = 'silse-game-briefing';
    var briefingCss = 'padding:' + (surf.padding != null ? surf.padding : 12) + 'px;';
    briefingCss += 'border-radius:' + (surf.radius != null ? surf.radius : 10) + 'px;';
    briefingCss += 'background:' + (surf.background || 'var(--silse-color-warning-soft, var(--color-warning-soft))') + ';';
    briefingCss += 'border:' + (surf.border || '1px solid var(--silse-color-warning, var(--color-warning))') + ';';
    briefing.style.cssText = briefingCss;
    var briefingLabel = document.createElement('div');
    briefingLabel.style.cssText = 'font-size:11px;font-weight:700;color:var(--silse-color-warning, var(--color-warning));text-transform:uppercase;margin-bottom:4px;';
    briefingLabel.textContent = '📋 Briefing Misi';
    briefing.appendChild(briefingLabel);
    var briefingText = document.createElement('div');
    briefingText.style.cssText = 'font-size:15px;font-weight:600;color:var(--silse-color-text, var(--color-text));';
    briefingText.textContent = content.briefing || '';
    briefing.appendChild(briefingText);
    wrapper.appendChild(briefing);

    // Target
    var target = document.createElement('div');
    target.className = 'silse-game-target';
    target.style.cssText = 'padding:12px;border-radius:10px;background:var(--silse-color-primary, var(--color-accent-soft));border:1px solid var(--silse-color-primary, var(--color-accent));';
    var targetLabel = document.createElement('div');
    targetLabel.style.cssText = 'font-size:11px;font-weight:700;color:var(--silse-color-primary, var(--color-accent));text-transform:uppercase;margin-bottom:4px;';
    targetLabel.textContent = '🎯 Target Misi';
    target.appendChild(targetLabel);
    var targetText = document.createElement('div');
    targetText.style.cssText = 'font-size:14px;color:var(--silse-color-text, var(--color-text));';
    targetText.textContent = content.missionTarget || '';
    target.appendChild(targetText);
    wrapper.appendChild(target);

    // Action grid — LAYOUT-STYLE-01: use exportGrid for customStyle.grid support
    var actionCards = [];
    for (var ai = 0; ai < content.actions.length; ai++) {
      (function(actionIdx, action) {
        var card = document.createElement('div');
        card.className = 'silse-game-action-card';
        card.setAttribute('data-action-index', String(actionIdx));
        card.style.cssText = 'padding:12px;border-radius:12px;background:var(--silse-color-surface, var(--color-panel));border:2px solid var(--silse-color-border, var(--color-border));cursor:pointer;font-size:14px;font-weight:600;color:var(--silse-color-text, var(--color-text));min-height:64px;display:flex;flex-direction:column;gap:6px;';
        var cardHeader = document.createElement('div');
        cardHeader.style.cssText = 'display:flex;align-items:center;gap:8px;';
        var letterBadge = document.createElement('span');
        letterBadge.style.cssText = 'display:inline-grid;place-items:center;min-width:28px;height:28px;border-radius:8px;background:var(--silse-color-primary, var(--color-accent));color:var(--silse-color-surface, var(--color-panel));font-size:13px;font-weight:900;';
        letterBadge.textContent = String.fromCharCode(65 + actionIdx);
        cardHeader.appendChild(letterBadge);
        var actionLabel = document.createElement('span');
        actionLabel.style.cssText = 'font-size:11px;font-weight:700;color:var(--silse-color-muted-text, var(--color-muted));text-transform:uppercase;';
        actionLabel.textContent = 'Aksi';
        cardHeader.appendChild(actionLabel);
        card.appendChild(cardHeader);
        var actionText = document.createElement('span');
        actionText.textContent = action.label;
        card.appendChild(actionText);
        actionCards.push(card);
      })(ai, content.actions[ai]);
    }
    wrapper.appendChild(exportGrid(plan, 'silse-game-action-grid', actionCards, 'repeat(auto-fill, minmax(180px, 1fr))', 8));

    // Reward preview
    var reward = document.createElement('div');
    reward.className = 'silse-game-reward';
    reward.style.cssText = 'padding:12px;border-radius:10px;background:var(--silse-color-warning-soft, var(--color-warning-soft));border:2px solid var(--silse-color-warning, var(--color-warning));display:flex;align-items:center;gap:12px;';
    var rewardIcon = document.createElement('span');
    rewardIcon.style.fontSize = '24px';
    rewardIcon.textContent = content.reward.icon || '🏅';
    reward.appendChild(rewardIcon);
    var rewardText = document.createElement('div');
    var rewardTextLabel = document.createElement('div');
    rewardTextLabel.style.cssText = 'font-size:11px;font-weight:700;color:var(--silse-color-warning, var(--color-warning));text-transform:uppercase;';
    rewardTextLabel.textContent = 'Reward';
    rewardText.appendChild(rewardTextLabel);
    var rewardTextValue = document.createElement('strong');
    rewardTextValue.style.cssText = 'font-size:14px;color:var(--silse-color-text, var(--color-text));';
    rewardTextValue.textContent = content.reward.label || '';
    rewardText.appendChild(rewardTextValue);
    reward.appendChild(rewardText);
    wrapper.appendChild(reward);

    return wrapper;
  }

  // QUIZ-SCENE-PROOF-01: quiz-question challenge scene content untuk export.
  // Render: challenge header → question focus panel → answer grid → feedback → progress.
  // Visual dari resolvedStyle (design contract), bukan hardcoded CSS.
  function renderQuizSceneContent(slot, content, plan) {
    var rs = slot.resolvedStyle || {};
    var ansCard = rs.quizAnswerCard || {};
    var badge = rs.quizChoiceBadge || {};
    var panel = rs.quizQuestionPanel || {};
    var premiumShadow = (plan.card && plan.card.shadow) || '0 2px 8px rgba(0,0,0,0.08)';
    var quizPanelBorder = ansCard.border || (plan.palette ? plan.palette.border : 'var(--silse-color-border, var(--color-border))');

    var wrapper = document.createElement('div');
    wrapper.className = 'silse-quiz-scene silse-premium-quiz-scene';
    wrapper.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;gap:10px;padding:16px;box-sizing:border-box;overflow:hidden;';

    // Challenge header
    var header = document.createElement('div');
    header.className = 'silse-quiz-header silse-premium-quiz-header';
    header.style.cssText = 'font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;';
    header.textContent = '🎯 Challenge — Pilih jawaban yang tepat';
    wrapper.appendChild(header);

    // Question focus panel
    var prompt = document.createElement('div');
    prompt.className = 'silse-quiz-question-focus silse-premium-quiz-focus';
    var promptCss = 'font-size:17px;font-weight:600;color:' + (plan.palette ? plan.palette.text : 'var(--silse-color-text, var(--color-text))') + ';';
    promptCss += 'padding:' + (panel.padding != null ? panel.padding : 16) + 'px;';
    promptCss += 'border-radius:' + (panel.radius != null ? panel.radius : (plan.card ? plan.card.radius : 12)) + 'px;';
    promptCss += 'background:' + (panel.background || 'var(--silse-color-surface, var(--color-panel))') + ';';
    promptCss += 'border:1px solid ' + quizPanelBorder + ';';
    promptCss += 'box-shadow:' + premiumShadow + ';';
    prompt.style.cssText = promptCss;
    prompt.textContent = content.prompt || '';
    wrapper.appendChild(prompt);

    // Answer grid — LAYOUT-STYLE-01: use exportGrid for customStyle.grid support
    var answerCards = [];
    for (var ci = 0; ci < content.choices.length; ci++) {
      (function(choiceIdx, choice) {
        var card = document.createElement('div');
        card.className = 'silse-quiz-answer-card silse-premium-quiz-card';
        card.setAttribute('data-choice-id', choice.id);
        var cardCss = 'padding:' + (ansCard.padding != null ? ansCard.padding : 14) + 'px;';
        cardCss += 'border-radius:' + (ansCard.radius != null ? ansCard.radius : (plan.card ? plan.card.radius : 12)) + 'px;';
        cardCss += 'background:' + (ansCard.background || 'var(--silse-color-surface, var(--color-panel))') + ';';
        cardCss += 'border:2px solid ' + quizPanelBorder + ';';
        cardCss += 'cursor:pointer;font-size:14px;font-weight:600;min-height:52px;color:' + (plan.palette ? plan.palette.text : 'var(--silse-color-text, var(--color-text))') + ';display:flex;align-items:center;gap:12px;transition:all 0.18s ease;';
        cardCss += 'box-shadow:' + premiumShadow + ';';
        card.style.cssText = cardCss;

        // Choice letter badge
        var letterBadge = document.createElement('span');
        letterBadge.className = 'silse-quiz-choice-badge silse-premium-quiz-badge';
        letterBadge.style.cssText = 'display:inline-grid;place-items:center;min-width:32px;height:32px;border-radius:' + (badge.radius != null ? badge.radius : 8) + 'px;background:' + (badge.background || 'var(--silse-color-primary, var(--color-accent))') + ';color:' + (badge.color || 'var(--silse-color-surface, var(--color-panel))') + ';font-size:14px;font-weight:900;flex-shrink:0;';
        letterBadge.textContent = String.fromCharCode(65 + choiceIdx);
        card.appendChild(letterBadge);

        var choiceText = document.createElement('span');
        choiceText.textContent = choice.text;
        card.appendChild(choiceText);
        answerCards.push(card);
      })(ci, content.choices[ci]);
    }
    wrapper.appendChild(exportGrid(plan, 'silse-quiz-answer-grid silse-premium-quiz-grid', answerCards, 'repeat(auto-fill, minmax(200px, 1fr))', 10));

    // Feedback placeholder
    var feedback = document.createElement('div');
    feedback.className = 'silse-quiz-feedback silse-premium-quiz-feedback';
    feedback.style.cssText = 'display:none;';
    wrapper.appendChild(feedback);

    // Progress indicator
    var progress = document.createElement('div');
    progress.className = 'silse-quiz-progress silse-premium-quiz-progress';
    progress.style.cssText = 'font-size:12px;font-weight:700;margin-top:auto;';
    progress.textContent = content.choices.length + ' pilihan · Correct: ' + (content.correctChoiceId || '');
    wrapper.appendChild(progress);

    return wrapper;
  }

  // MATERIAL-SCENE-PROOF-01: learning-material scene content untuk export.
  // Render: concept header → explanation panel → example cards → key point → student action → visual hint.
  // Visual dari resolvedStyle (design contract) + plan (palette/typography).
  function renderLearningMaterialSceneContent(slot, content, plan) {
    var rs = slot.resolvedStyle || {};
    var surf = rs.surface || {};
    var palette = plan.palette || {};
    var ty = plan.typography || {};
    var premiumShadow = (plan.card && plan.card.shadow) || '0 2px 8px rgba(0,0,0,0.08)';
    var surfBorder = surf.border || (plan.card ? plan.card.border : '1px solid var(--silse-color-border, var(--color-border))');
    var surfRadius = surf.radius != null ? surf.radius : (plan.card ? plan.card.radius : 12);
    var surfPadding = surf.padding != null ? surf.padding : (plan.card ? plan.card.padding : 16);

    var wrapper = document.createElement('div');
    wrapper.className = 'silse-learning-scene silse-premium-learning-scene';
    wrapper.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;gap:12px;padding:16px;box-sizing:border-box;overflow:hidden;';

    // Concept header
    var header = document.createElement('div');
    header.className = 'silse-learning-header silse-premium-learning-header';
    var headerCss = 'font-size:' + ty.titleSize + 'px;font-weight:' + ty.titleWeight + ';font-family:' + ty.heroFont + ';color:' + palette.text + ';line-height:' + ty.lineHeight + ';';
    headerCss += 'border-left:4px solid ' + palette.primary + ';padding-left:12px;';
    header.style.cssText = headerCss;
    header.textContent = content.conceptTitle || '';
    wrapper.appendChild(header);

    if (content.conceptSubtitle) {
      var subtitle = document.createElement('div');
      subtitle.style.cssText = 'font-size:20px;color:' + palette.mutedText + ';margin-top:-8px;';
      subtitle.textContent = content.conceptSubtitle;
      wrapper.appendChild(subtitle);
    }

    // Explanation panel
    var explanation = document.createElement('div');
    explanation.className = 'silse-learning-explanation silse-premium-learning-explanation';
    var expCss = 'padding:' + surfPadding + 'px;';
    expCss += 'border-radius:' + surfRadius + 'px;';
    expCss += 'background:' + (surf.background || palette.surface) + ';';
    expCss += 'border:' + surfBorder + ';';
    expCss += 'font-size:' + ty.bodySize + 'px;line-height:' + ty.lineHeight + ';color:' + palette.text + ';';
    expCss += 'box-shadow:' + (surf.shadow || premiumShadow) + ';';
    explanation.style.cssText = expCss;
    explanation.textContent = content.explanation || '';
    wrapper.appendChild(explanation);

    // Example cards — LAYOUT-STYLE-01: use exportGrid for customStyle.grid support
    if (content.examples && content.examples.length > 0) {
      var exampleCards = [];
      for (var ei = 0; ei < content.examples.length; ei++) {
        (function(ex) {
          var card = document.createElement('div');
          card.className = 'silse-learning-example-card silse-premium-learning-example-card';
          var cardCss = 'padding:' + surfPadding + 'px;';
          cardCss += 'border-radius:' + surfRadius + 'px;';
          cardCss += 'background:' + palette.surface + ';';
          cardCss += 'border:' + surfBorder + ';';
          cardCss += 'box-shadow:' + premiumShadow + ';';
          cardCss += 'transition:all 0.18s ease;';
          card.style.cssText = cardCss;
          var cardTitle = document.createElement('strong');
          cardTitle.style.cssText = 'display:block;font-size:15px;margin-bottom:4px;color:' + palette.primary + ';';
          cardTitle.textContent = ex.title;
          card.appendChild(cardTitle);
          var cardBody = document.createElement('div');
          cardBody.style.cssText = 'font-size:13px;line-height:1.5;color:' + palette.text + ';';
          cardBody.textContent = ex.body;
          card.appendChild(cardBody);
          exampleCards.push(card);
        })(content.examples[ei]);
      }
      // L2-3: columns default wired to plan.learning.exampleGridColumns (from contract).
      var exGridCols = (plan.learning && plan.learning.exampleGridColumns) ? plan.learning.exampleGridColumns : 'repeat(auto-fill, minmax(280px, 1fr))';
      wrapper.appendChild(exportGrid(plan, 'silse-learning-example-grid silse-premium-learning-example-grid', exampleCards, exGridCols, 10));
    }

    // FOUNDATION-HARDENING-01: Key point — visual dari plan.learning.keyPointPanel (contract token)
    if (content.keyPoints && content.keyPoints.length > 0) {
      var kp = plan.learning.keyPointPanel;
      var keyPoint = document.createElement('div');
      keyPoint.className = 'silse-learning-key-point silse-premium-learning-key-point';
      keyPoint.style.cssText = 'padding:' + kp.padding + 'px;border-radius:' + kp.radius + 'px;background:' + kp.background + ';border:' + kp.border + ';border-left:4px solid ' + kp.accentColor + ';box-shadow:' + premiumShadow + ';';
      var kpLabel = document.createElement('div');
      kpLabel.style.cssText = 'font-size:11px;font-weight:700;color:' + kp.iconColor + ';text-transform:uppercase;margin-bottom:6px;';
      kpLabel.textContent = kp.icon + ' Key Points';
      keyPoint.appendChild(kpLabel);
      var ul = document.createElement('ul');
      ul.style.cssText = 'margin:0;padding-left:20px;font-size:14px;line-height:1.6;';
      for (var ki = 0; ki < content.keyPoints.length; ki++) {
        var li = document.createElement('li');
        li.style.color = palette.text;
        li.textContent = content.keyPoints[ki];
        ul.appendChild(li);
      }
      keyPoint.appendChild(ul);
      wrapper.appendChild(keyPoint);
    }

    // FOUNDATION-HARDENING-01: Student action — visual dari plan.learning.studentActionPanel (contract token)
    if (content.studentAction) {
      var sa = plan.learning.studentActionPanel;
      var action = document.createElement('div');
      action.className = 'silse-learning-student-action silse-premium-learning-student-action';
      action.style.cssText = 'padding:' + sa.padding + 'px;border-radius:' + sa.radius + 'px;background:' + sa.background + ';border:' + sa.border + ';display:flex;align-items:center;gap:10px;box-shadow:' + premiumShadow + ';';
      var actionIcon = document.createElement('span');
      actionIcon.style.fontSize = '20px';
      actionIcon.textContent = sa.icon;
      action.appendChild(actionIcon);
      var actionText = document.createElement('div');
      var actionLabel = document.createElement('div');
      actionLabel.style.cssText = 'font-size:11px;font-weight:700;color:' + sa.labelColor + ';text-transform:uppercase;';
      actionLabel.textContent = 'Student Action';
      actionText.appendChild(actionLabel);
      var actionBody = document.createElement('div');
      actionBody.style.cssText = 'font-size:14px;font-weight:600;color:' + palette.text + ';';
      actionBody.textContent = content.studentAction;
      actionText.appendChild(actionBody);
      action.appendChild(actionText);
      wrapper.appendChild(action);
    }

    // FOUNDATION-HARDENING-01: Visual hint — visual dari plan.learning.visualHintPanel (contract token)
    if (content.visualHint) {
      var vh = plan.learning.visualHintPanel;
      var hint = document.createElement('div');
      hint.className = 'silse-learning-visual-hint silse-premium-learning-visual-hint';
      hint.style.cssText = 'padding:8px;border-radius:8px;background:transparent;font-size:12px;color:' + vh.color + ';font-style:' + vh.fontStyle + ';text-align:center;';
      hint.textContent = vh.icon + ' ' + content.visualHint;
      wrapper.appendChild(hint);
    }

    return wrapper;
  }

  // FOUNDATION-FINAL-LOCK-01: cover-hero scene content untuk export.
  function renderCoverHeroSceneContent(slot, content, plan) {
    var rs = slot.resolvedStyle || {};
    var ty = rs.typography || {};
    var btn = rs.button || {};
    var palette = plan.palette || {};
    var wrapper = document.createElement('div');
    wrapper.className = 'silse-cover-scene';
    wrapper.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:32px;box-sizing:border-box;';

    if (content.kicker) {
      var kicker = document.createElement('div');
      kicker.className = 'silse-cover-kicker';
      kicker.style.cssText = 'display:inline-flex;align-items:center;padding:7px 16px;border-radius:999px;background:' + palette.gold + ';color:' + palette.primary + ';font-size:13px;font-weight:900;text-transform:uppercase;';
      kicker.textContent = content.kicker;
      wrapper.appendChild(kicker);
    }
    var title = document.createElement('div');
    title.className = 'silse-cover-title';
    // EXPORT-CONTRAST-01: cover scenes use dark gradient backgrounds.
    // Fase 3b Commit 1: Use getContrastAwareTextColor() for parity with editor.
    var titleColor = getContrastAwareTextColor(_currentPageRole, palette.text || 'var(--color-text)');
    var titleCss = 'text-align:center;color:' + titleColor + ';';
    if (ty.fontFamily) titleCss += 'font-family:' + ty.fontFamily + ';';
    if (ty.fontSize) titleCss += 'font-size:' + ty.fontSize + 'px;';
    if (ty.fontWeight) titleCss += 'font-weight:' + ty.fontWeight + ';';
    if (ty.uppercase) titleCss += 'text-transform:uppercase;';
    title.style.cssText = titleCss;
    title.textContent = content.heroTitle || '';
    wrapper.appendChild(title);

    if (content.heroSubtitle) {
      var subtitle = document.createElement('div');
      subtitle.className = 'silse-cover-subtitle';
      // EXPORT-CONTRAST-01: Fase 3b Commit 1 — use getContrastAwareTextColor().
      var subtitleColor = getContrastAwareTextColor(_currentPageRole, palette.mutedText || 'var(--color-text-soft)');
      subtitle.style.cssText = 'font-size:20px;color:' + subtitleColor + ';text-align:center;';
      subtitle.textContent = content.heroSubtitle;
      wrapper.appendChild(subtitle);
    }
    if (content.badges && content.badges.length > 0) {
      for (var bi = 0; bi < content.badges.length; bi++) {
        var badge = document.createElement('span');
        badge.className = 'silse-cover-badge';
        badge.style.cssText = 'display:inline-flex;padding:4px 12px;border-radius:999px;background:' + palette.surface + ';color:' + palette.primary + ';font-size:12px;font-weight:700;border:1px solid ' + palette.border + ';';
        badge.textContent = content.badges[bi];
        wrapper.appendChild(badge);
      }
    }
    if (content.primaryAction) {
      var pa = document.createElement('button');
      pa.className = 'silse-cover-primary-action';
      pa.type = 'button';
      pa.style.cssText = 'padding:' + (btn.padding ? (btn.padding.top || 10) : 10) + 'px ' + (btn.padding ? (btn.padding.right || 20) : 20) + 'px;border-radius:' + (btn.radius || 8) + 'px;background:' + (btn.background || palette.primary) + ';color:' + (btn.color || 'var(--color-panel)') + ';border:0;font-weight:' + (btn.fontWeight || 600) + ';font-size:16px;cursor:pointer;margin-top:8px;';
      pa.textContent = content.primaryAction.label;
      pa.setAttribute('aria-label', content.primaryAction.label + ', pergi ke halaman berikutnya');
      // BUG-NAV-01 FIX: wire primaryAction ke navigate('next') — sebelumnya tombol
      // di-create tapi tidak di-wire ke event handler, sehingga "Mulai Pembelajaran"
      // tidak berfungsi saat di-klik.
      var paAction = content.primaryAction.action || 'next';
      pa.addEventListener('click', function() { navigate(paAction); });
      wrapper.appendChild(pa);
    }
    if (content.visualAnchor) {
      var va = document.createElement('div');
      va.className = 'silse-cover-visual-anchor';
      va.style.cssText = 'font-size:14px;color:' + palette.mutedText + ';font-style:italic;margin-top:8px;';
      va.textContent = content.visualAnchor;
      wrapper.appendChild(va);
    }
    return wrapper;
  }

  // FOUNDATION-FINAL-LOCK-01: closing-award scene content untuk export.
  function renderClosingAwardSceneContent(slot, content, plan) {
    var rs = slot.resolvedStyle || {};
    var surf = rs.surface || {};
    var rw = rs.reward || {};
    var btn = rs.button || {};
    var palette = plan.palette || {};
    var ty = plan.typography || {};
    var wrapper = document.createElement('div');
    wrapper.className = 'silse-closing-scene';
    wrapper.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:32px;box-sizing:border-box;';

    if (content.achievement) {
      var ach = document.createElement('div');
      ach.className = 'silse-closing-achievement';
      // EXPORT-CONTRAST-01: Fase 3b Commit 1 — use getContrastAwareTextColor().
      var achColor = getContrastAwareTextColor(_currentPageRole, palette.text || 'var(--color-text)');
      ach.style.cssText = 'font-family:' + ty.heroFont + ';font-size:' + ty.titleSize + 'px;font-weight:' + ty.titleWeight + ';color:' + achColor + ';text-align:center;';
      ach.textContent = content.achievement;
      wrapper.appendChild(ach);
    }
    if (content.summary) {
      var sum = document.createElement('div');
      sum.className = 'silse-closing-summary';
      // EXPORT-CONTRAST-01: Fase 3b Commit 1 — use getContrastAwareTextColor().
      var sumColor = getContrastAwareTextColor(_currentPageRole, palette.mutedText || 'var(--color-text-soft)');
      sum.style.cssText = 'font-size:18px;color:' + sumColor + ';text-align:center;max-width:800px;';
      sum.textContent = content.summary;
      wrapper.appendChild(sum);
    }
    if (content.rewardLabel || content.rewardIcon) {
      var reward = document.createElement('div');
      reward.className = 'silse-closing-reward';
      reward.style.cssText = 'padding:20px;border-radius:' + (rw.radius || 12) + 'px;background:' + (rw.background || 'var(--color-warning-soft)') + ';border:2px solid ' + (rw.borderColor || 'var(--silse-gold)') + ';display:flex;flex-direction:column;align-items:center;gap:8px;';
      if (content.rewardIcon) {
        var ri = document.createElement('div');
        ri.style.fontSize = '64px';
        ri.textContent = content.rewardIcon;
        reward.appendChild(ri);
      }
      if (content.rewardLabel) {
        var rl = document.createElement('strong');
        rl.style.cssText = 'font-size:20px;color:' + palette.text + ';';
        rl.textContent = content.rewardLabel;
        reward.appendChild(rl);
      }
      wrapper.appendChild(reward);
    }
    if (content.reflectionPrompt) {
      var refl = document.createElement('div');
      refl.className = 'silse-closing-reflection';
      refl.style.cssText = 'padding:' + (surf.padding || 16) + 'px;border-radius:' + (surf.radius || 12) + 'px;background:' + (surf.background || palette.surface) + ';border:' + (surf.border || '1px solid var(--color-border)') + ';max-width:600px;text-align:center;';
      var reflLabel = document.createElement('div');
      reflLabel.style.cssText = 'font-size:11px;font-weight:700;color:' + palette.mutedText + ';text-transform:uppercase;margin-bottom:6px;';
      reflLabel.textContent = 'Refleksi';
      refl.appendChild(reflLabel);
      var reflText = document.createElement('div');
      reflText.style.cssText = 'font-size:15px;color:' + palette.text + ';';
      reflText.textContent = content.reflectionPrompt;
      refl.appendChild(reflText);
      wrapper.appendChild(refl);
    }
    if (content.nextLearning) {
      var nl = document.createElement('div');
      nl.className = 'silse-closing-next-learning';
      // EXPORT-CONTRAST-01: Fase 3b Commit 1 — use getContrastAwareTextColor().
      var nlColor = getContrastAwareTextColor(_currentPageRole, palette.mutedText || 'var(--color-text-soft)');
      nl.style.cssText = 'font-size:13px;color:' + nlColor + ';';
      nl.textContent = content.nextLearning;
      wrapper.appendChild(nl);
    }
    if (content.finalAction) {
      var fa = document.createElement('button');
      fa.className = 'silse-closing-final-action';
      fa.type = 'button';
      fa.style.cssText = 'padding:' + (btn.padding ? (btn.padding.top || 10) : 10) + 'px ' + (btn.padding ? (btn.padding.right || 20) : 20) + 'px;border-radius:' + (btn.radius || 8) + 'px;background:' + (btn.background || palette.primary) + ';color:' + (btn.color || 'var(--color-panel)') + ';border:0;font-weight:' + (btn.fontWeight || 600) + ';font-size:16px;cursor:pointer;margin-top:8px;';
      fa.textContent = content.finalAction.label;
      fa.setAttribute('aria-label', content.finalAction.label);
      // BUG-NAV-01 FIX: wire finalAction. Default action 'prev' (kembali ke awal)
      // karena closing adalah halaman terakhir. Jika action spesifik diset, gunakan itu.
      var faAction = content.finalAction.action || 'prev';
      fa.addEventListener('click', function() { navigate(faAction); });
      wrapper.appendChild(fa);
    }
    return wrapper;
  }

  // ===========================================================================
  // GOLDEN-REFERENCE-RENDER-P1 PATCH A: Reusable Export Block Helpers
  // All helpers take plan (for palette/typography tokens) — no hardcoded colors.
  // ===========================================================================

`;
}
