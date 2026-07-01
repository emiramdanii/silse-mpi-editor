/**
 * SceneRendererView — React view that renders SceneRenderPlan (SCENE-RENDERER-PROOF-01).
 *
 * Layer: components
 * Allowed imports: react, ../core/scene-renderer, ../core/mpi-design-contract
 *
 * Kontrak:
 *   React view yang mengkonsumsi SceneRenderPlan + DesignContract.
 *   Emit HTML dengan classes: silse-scene, silse-scene-<sceneType>,
 *   silse-scene-slot, silse-scene-<role>, silse-scene-card/button/feedback/reward.
 *
 *   Bukan list biasa. Scene structure dengan slot-based layout.
 *
 *   Editor (CanvasStage), Preview (PreviewApp), Export (export-html) bisa
 *   pakai view/logic yang sama untuk parity.
 *
 *   Prinsip:
 *     - Pure render — baca plan + contract, emit DOM.
 *     - Tidak ada state (state di parent).
 *     - Tambah CSS classes structural, bukan premium polish.
 */

import type { CSSProperties, ReactNode } from 'react';
import type { SceneRenderPlan, SceneRenderSlot } from '../core/scene-renderer';
import type { MpiDesignContract } from '../core/mpi-design-contract';
import {
  CurriculumGuideComposer, ObjectivesPathComposer, StarterReviewComposer,
  DiscussionSceneComposer, CaseAnalysisComposer, ResultSummaryComposer,
  ReflectionJournalComposer, ClassificationGameComposer,
  HotspotMapComposer, MatchingGameComposer, SequencingGameComposer, MediaFocusComposer,
  DiagnosticCheckComposer, RemedialPracticeComposer, EnrichmentChallengeComposer,
  WorksheetActivityComposer, RubricPanelComposer,
} from './scene-composers';

// PATCH B: Scene composer routing by sceneType, not content.kind
type SceneComposerProps = {
  plan: SceneRenderPlan;
  contract: MpiDesignContract;
  slot: SceneRenderSlot;
  interactive?: boolean;
  onSlotClick?: (slotId: string) => void;
  onGameAction?: (slotId: string, actionIndex: number) => void;
  onQuizAnswer?: (slotId: string, choiceId: string) => void;
  selectedSlotId?: string;
};

function getSceneComposer(sceneType: string): ((props: SceneComposerProps) => ReactNode) | null {
  // PATCH B: 7 new scenes routed by sceneType
  const composers: Record<string, (props: SceneComposerProps) => ReactNode> = {
    'curriculum-guide': ({ contract, slot }) => <CurriculumGuideComposer contract={contract} content={slot.content as any} />,
    'objectives-path': ({ contract, slot }) => <ObjectivesPathComposer contract={contract} content={slot.content as any} />,
    'starter-review': ({ contract, slot }) => <StarterReviewComposer contract={contract} content={slot.content as any} />,
    'discussion-scene': ({ contract, slot }) => <DiscussionSceneComposer contract={contract} content={slot.content as any} />,
    'case-analysis': ({ contract, slot }) => <CaseAnalysisComposer contract={contract} content={slot.content as any} />,
    'result-summary': ({ contract, slot }) => <ResultSummaryComposer contract={contract} content={slot.content as any} />,
    'reflection-journal': ({ contract, slot }) => <ReflectionJournalComposer contract={contract} content={slot.content as any} />,
    'classification-game': ({ contract, slot }) => <ClassificationGameComposer contract={contract} content={slot.content as any} />,
    'hotspot-map': ({ contract, slot }) => <HotspotMapComposer contract={contract} content={slot.content as any} />,
    'matching-game': ({ contract, slot }) => <MatchingGameComposer contract={contract} content={slot.content as any} />,
    'sequencing-game': ({ contract, slot }) => <SequencingGameComposer contract={contract} content={slot.content as any} />,
    'media-focus': ({ contract, slot }) => <MediaFocusComposer contract={contract} content={slot.content as any} />,
    'diagnostic-check': ({ contract, slot }) => <DiagnosticCheckComposer contract={contract} content={slot.content as any} />,
    'remedial-practice': ({ contract, slot }) => <RemedialPracticeComposer contract={contract} content={slot.content as any} />,
    'enrichment-challenge': ({ contract, slot }) => <EnrichmentChallengeComposer contract={contract} content={slot.content as any} />,
    'worksheet-activity': ({ contract, slot }) => <WorksheetActivityComposer contract={contract} content={slot.content as any} />,
    'rubric-panel': ({ contract, slot }) => <RubricPanelComposer contract={contract} content={slot.content as any} />,
  };
  return composers[sceneType] ?? null;
}

export type SceneRendererViewProps = {
  plan: SceneRenderPlan;
  contract: MpiDesignContract;
  /** Interactive mode: editor (false) vs preview/export (true). */
  interactive?: boolean;
  /** Called when a slot is clicked (editor select). */
  onSlotClick?: (slotId: string) => void;
  /** Called when a game action is chosen. */
  onGameAction?: (slotId: string, actionIndex: number) => void;
  /** Called when a quiz choice is selected. */
  onQuizAnswer?: (slotId: string, choiceId: string) => void;
  /** Selected slot ID (editor highlight). */
  selectedSlotId?: string;
};

export function SceneRendererView({
  plan,
  contract,
  interactive = false,
  onSlotClick,
  onGameAction,
  onQuizAnswer,
  selectedSlotId,
}: SceneRendererViewProps) {
  // PATCH B: Route by sceneType first, not content.kind.
  // SceneType determines which composer renders the entire scene.
  // Content.kind is only for generic slot content (text, card, button, etc.).
  const sceneComposer = getSceneComposer(plan.sceneType);
  if (sceneComposer) {
    // Find the primary content slot (first slot with content that has the scene's data)
    const primarySlot = plan.slots[0]; // composite slot carries all scene data
    if (primarySlot) {
      return sceneComposer({ plan, contract, slot: primarySlot, interactive, onSlotClick, onGameAction, onQuizAnswer, selectedSlotId });
    }
  }

  // Fall through to slot-by-slot rendering for generic scenes
  // DESIGN-CONTRACT-RENDER-PARITY-01: scene style from plan (which carries contract tokens).
  const sceneStyle: CSSProperties = {
    position: 'relative',
    width: plan.frame.width,
    height: plan.frame.height,
    overflow: plan.frame.overflow as CSSProperties['overflow'],
    borderRadius: plan.frame.stageRadius,
    background: plan.background.gradient ?? plan.background.color,
  };

  return (
    <div className={plan.sceneClass} data-scene-id={plan.sceneId} data-scene-type={plan.sceneType} style={sceneStyle}>
      {plan.slots.map((slot) => (
        <SlotView
          key={slot.id}
          slot={slot}
          contract={contract}
          interactive={interactive}
          onSlotClick={onSlotClick}
          onGameAction={onGameAction}
          onQuizAnswer={onQuizAnswer}
          selected={selectedSlotId === slot.id}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SlotView
// ---------------------------------------------------------------------------

type SlotViewProps = {
  slot: SceneRenderSlot;
  contract: MpiDesignContract;
  interactive: boolean;
  onSlotClick?: (slotId: string) => void;
  onGameAction?: (slotId: string, actionIndex: number) => void;
  onQuizAnswer?: (slotId: string, choiceId: string) => void;
  selected: boolean;
};

function SlotView({ slot, contract, interactive, onSlotClick, onGameAction, onQuizAnswer, selected }: SlotViewProps) {
  const slotStyle: CSSProperties = {
    position: 'absolute',
    left: slot.placement.x,
    top: slot.placement.y,
    width: slot.placement.width,
    height: slot.placement.height,
    zIndex: slot.placement.zIndex ?? 1,
    outline: selected ? '2px solid #2563eb' : 'none',
    outlineOffset: 2,
    cursor: interactive ? 'pointer' : 'default',
  };

  return (
    <div
      className={slot.slotClass}
      data-slot-id={slot.id}
      data-slot-role={slot.role}
      style={slotStyle}
      onClick={(e) => {
        e.stopPropagation();
        onSlotClick?.(slot.id);
      }}
    >
      <ContentRenderer
        slot={slot}
        contract={contract}
        interactive={interactive}
        onGameAction={onGameAction}
        onQuizAnswer={onQuizAnswer}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// ContentRenderer
// ---------------------------------------------------------------------------

function ContentRenderer({
  slot,
  contract,
  interactive,
  onGameAction,
  onQuizAnswer,
}: {
  slot: SceneRenderSlot;
  contract: MpiDesignContract;
  interactive: boolean;
  onGameAction?: (slotId: string, actionIndex: number) => void;
  onQuizAnswer?: (slotId: string, choiceId: string) => void;
}) {
  const c = slot.content;
  const rs = slot.resolvedStyle; // DESIGN-CONTRACT-RENDER-PARITY-01: resolved visual instruction

  if (c.kind === 'text') {
    // DESIGN-CONTRACT-RENDER-PARITY-01: typography from resolvedStyle
    const ty = rs?.typography;
    return (
      <div className={slot.contentClass} style={{
        width: '100%', height: '100%', display: 'flex', alignItems: 'center',
        padding: 8, boxSizing: 'border-box',
        fontFamily: ty?.fontFamily,
        fontSize: ty?.fontSize,
        fontWeight: ty?.fontWeight,
        color: ty?.color,
        lineHeight: ty?.lineHeight,
        letterSpacing: ty?.letterSpacing,
        textTransform: ty?.uppercase ? 'uppercase' : 'none',
      }}>
        <span>{c.text}</span>
      </div>
    );
  }

  if (c.kind === 'card') {
    // DESIGN-CONTRACT-RENDER-PARITY-01: card visual from resolvedStyle.surface
    const surf = rs?.surface;
    return (
      <div className={slot.contentClass} style={{
        width: '100%', height: '100%',
        padding: surf?.padding ?? 16,
        borderRadius: surf?.radius ?? 12,
        background: surf?.background ?? '#fff',
        border: surf?.border ?? '1px solid #e5e7eb',
        boxShadow: surf?.shadow,
        boxSizing: 'border-box',
      }}>
        {c.title && <strong style={{ display: 'block', fontSize: 18, marginBottom: 6 }}>{c.title}</strong>}
        <div style={{ fontSize: 14, lineHeight: 1.5 }}>{c.body}</div>
      </div>
    );
  }

  if (c.kind === 'button') {
    // DESIGN-CONTRACT-RENDER-PARITY-01: button visual from resolvedStyle.button
    const btn = rs?.button;
    return (
      <button className={slot.contentClass} style={{
        width: '100%', height: '100%',
        borderRadius: btn?.radius ?? 8,
        background: btn?.background ?? contract.palette.primary,
        color: btn?.color ?? '#fff',
        border: 0,
        fontWeight: btn?.fontWeight ?? 600,
        cursor: interactive ? 'pointer' : 'default',
        paddingTop: btn?.padding?.top,
        paddingRight: btn?.padding?.right,
        paddingBottom: btn?.padding?.bottom,
        paddingLeft: btn?.padding?.left,
      }}>
        {c.label}
      </button>
    );
  }

  if (c.kind === 'badge') {
    return (
      <span className={slot.contentClass} style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 999, background: contract.palette.gold, color: contract.palette.primary, fontSize: 12, fontWeight: 700 }}>
        {c.icon && <span style={{ marginRight: 4 }}>{c.icon}</span>}
        {c.label}
      </span>
    );
  }

  if (c.kind === 'game-mission') {
    return (
      <GameMissionContent
        slot={slot}
        content={c}
        contract={contract}
        interactive={interactive}
        onGameAction={onGameAction}
      />
    );
  }

  if (c.kind === 'quiz-question') {
    return (
      <QuizQuestionContent
        slot={slot}
        content={c}
        contract={contract}
        interactive={interactive}
        onQuizAnswer={onQuizAnswer}
      />
    );
  }

  if (c.kind === 'learning-material') {
    return (
      <LearningMaterialContent
        slot={slot}
        content={c}
        contract={contract}
      />
    );
  }

  if (c.kind === 'cover-hero') {
    return (
      <CoverHeroContent
        slot={slot}
        content={c}
        contract={contract}
      />
    );
  }

  if (c.kind === 'closing-award') {
    return (
      <ClosingAwardContent
        slot={slot}
        content={c}
        contract={contract}
      />
    );
  }

  // PATCH B: 7 new scene composers are now routed by sceneType in getSceneComposer(),
  // NOT by content.kind here. Content.kind is only for generic slot content.

  if (c.kind === 'feedback') {
    // DESIGN-CONTRACT-RENDER-PARITY-01: feedback visual from resolvedStyle.feedback
    const fb = rs?.feedback;
    return (
      <div className={slot.contentClass} style={{
        padding: 12, borderRadius: 10,
        background: fb?.background ?? '#f3f4f6',
        color: fb?.color,
        borderLeft: '4px solid ' + (fb?.borderColor ?? '#d1d5db'),
      }}>
        {c.icon && <span style={{ marginRight: 6 }}>{c.icon}</span>}
        {c.text}
      </div>
    );
  }

  if (c.kind === 'reward') {
    // DESIGN-CONTRACT-RENDER-PARITY-01: reward visual from resolvedStyle.reward
    const rw = rs?.reward;
    return (
      <div className={slot.contentClass} style={{
        padding: 16,
        borderRadius: rw?.radius ?? 12,
        background: rw?.background ?? '#fffbeb',
        border: '2px solid ' + (rw?.borderColor ?? '#fbbf24'),
        textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      }}>
        {c.icon && <div style={{ fontSize: 48 }}>{c.icon}</div>}
        <strong style={{ fontSize: 18 }}>{c.label}</strong>
      </div>
    );
  }

  if (c.kind === 'navigation') {
    return (
      <div className={slot.contentClass} style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        {c.buttons.map((btn, i) => (
          <button key={i} style={{ padding: '8px 16px', borderRadius: 8, background: contract.palette.primary, color: '#fff', border: 0, fontWeight: 600, cursor: interactive ? 'pointer' : 'default' }}>
            {btn.label}
          </button>
        ))}
      </div>
    );
  }

  if (c.kind === 'image') {
    const imgContent = c as { kind: 'image'; src: string; alt?: string; objectFit?: 'cover' | 'contain' };
    return (
      <img className={slot.contentClass} src={imgContent.src} alt={imgContent.alt ?? ''} style={{ width: '100%', height: '100%', objectFit: imgContent.objectFit ?? 'cover' }} />
    );
  }

  // Fallback for any remaining kind
  const fallbackContent = c as { kind: string };
  return <div className={slot.contentClass}>[{fallbackContent.kind}]</div>;
}

// ---------------------------------------------------------------------------
// GameMissionContent
// ---------------------------------------------------------------------------

function GameMissionContent({
  slot,
  content,
  contract,
  interactive,
  onGameAction,
}: {
  slot: SceneRenderSlot;
  content: Extract<SceneRenderSlot['content'], { kind: 'game-mission' }>;
  contract: MpiDesignContract;
  interactive: boolean;
  onGameAction?: (slotId: string, actionIndex: number) => void;
}) {
  // DESIGN-CONTRACT-RENDER-PARITY-01: briefing/target card style from resolvedStyle.surface
  const briefingStyle = slot.resolvedStyle?.surface;
  return (
    <div className="silse-game-scene" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 10, padding: 16, boxSizing: 'border-box', overflow: 'auto' }}>
      {/* Briefing */}
      <div className="silse-game-briefing" style={{
        padding: briefingStyle?.padding ?? 12,
        borderRadius: briefingStyle?.radius ?? 10,
        background: briefingStyle?.background ?? '#fffbeb',
        border: briefingStyle?.border ?? '1px solid #fde68a',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', marginBottom: 4 }}>📋 Briefing Misi</div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{content.briefing}</div>
      </div>

      {/* Target */}
      <div className="silse-game-target" style={{
        padding: 12, borderRadius: 10,
        background: contract.game.targetPanel?.background ?? '#eff6ff',
        border: contract.game.targetPanel?.border ?? '1px solid #bfdbfe',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', marginBottom: 4 }}>🎯 Target Misi</div>
        <div style={{ fontSize: 14 }}>{content.missionTarget}</div>
      </div>

      {/* Action grid */}
      <div className="silse-game-action-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
        {content.actions.map((action, idx) => (
          <div
            key={action.id}
            className="silse-game-action-card"
            data-action-index={idx}
            onClick={(e) => {
              e.stopPropagation();
              if (interactive) onGameAction?.(slot.id, idx);
            }}
            style={{
              padding: 14,
              borderRadius: 12,
              background: '#fff',
              border: '2px solid #d1d5db',
              cursor: interactive ? 'pointer' : 'default',
              fontSize: 14,
              fontWeight: 600,
              minHeight: 80,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-grid', placeItems: 'center', minWidth: 28, height: 28, borderRadius: 8, background: contract.palette.primary, color: '#fff', fontSize: 13, fontWeight: 900 }}>
                {String.fromCharCode(65 + idx)}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Aksi</span>
            </div>
            <span>{action.label}</span>
          </div>
        ))}
      </div>

      {/* Reward preview */}
      <div className="silse-game-reward" style={{ padding: 12, borderRadius: 10, background: '#fffbeb', border: '2px solid #fbbf24', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 24 }}>{(content.reward as { icon?: string }).icon ?? '🏅'}</span>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase' }}>Reward</div>
          <strong style={{ fontSize: 14 }}>{content.reward.label}</strong>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// QUIZ-SCENE-PROOF-01 — QuizQuestionContent (challenge scene)
//
// Render quiz sebagai challenge scene:
//   challenge header → question focus panel → answer cards (grid) → feedback
//
// Class: silse-quiz-scene, silse-quiz-header, silse-quiz-question-focus,
//        silse-quiz-answer-grid, silse-quiz-answer-card, silse-quiz-choice-badge,
//        silse-quiz-feedback, silse-quiz-progress
//
// Visual dari resolvedStyle (design contract), bukan hardcoded CSS.
// ---------------------------------------------------------------------------

function QuizQuestionContent({
  slot,
  content,
  contract,
  interactive,
  onQuizAnswer,
}: {
  slot: SceneRenderSlot;
  content: Extract<SceneRenderSlot['content'], { kind: 'quiz-question' }>;
  contract: MpiDesignContract;
  interactive: boolean;
  onQuizAnswer?: (slotId: string, choiceId: string) => void;
}) {
  const rs = slot.resolvedStyle;
  const ansCard = rs?.quizAnswerCard;
  const badge = rs?.quizChoiceBadge;
  const panel = rs?.quizQuestionPanel;

  return (
    <div className="silse-quiz-scene" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 10, padding: 16, boxSizing: 'border-box', overflow: 'auto' }}>
      {/* Challenge header */}
      <div className="silse-quiz-header" style={{
        fontSize: 11, fontWeight: 700, color: contract.palette.mutedText,
        textTransform: 'uppercase', letterSpacing: 0.5,
      }}>
        🎯 Challenge — Pilih jawaban yang tepat
      </div>

      {/* Question focus panel */}
      <div className="silse-quiz-question-focus" style={{
        padding: panel?.padding ?? 16,
        borderRadius: panel?.radius ?? 12,
        background: panel?.background ?? contract.palette.surface,
        fontSize: 17, fontWeight: 600,
      }}>
        {content.prompt}
      </div>

      {/* Answer grid */}
      <div className="silse-quiz-answer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
        {content.choices.map((choice, idx) => (
          <div
            key={choice.id}
            className="silse-quiz-answer-card"
            data-choice-id={choice.id}
            onClick={(e) => {
              e.stopPropagation();
              if (interactive) onQuizAnswer?.(slot.id, choice.id);
            }}
            style={{
              padding: ansCard?.padding ?? 14,
              borderRadius: ansCard?.radius ?? 12,
              background: ansCard?.background ?? '#fff',
              border: `2px solid ${ansCard?.border ?? '#d1d5db'}`,
              cursor: interactive ? 'pointer' : 'default',
              fontSize: 14,
              fontWeight: 600,
              minHeight: 60,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {/* Choice letter badge */}
            <span className="silse-quiz-choice-badge" style={{
              display: 'inline-grid', placeItems: 'center',
              minWidth: 32, height: 32,
              borderRadius: badge?.radius ?? 8,
              background: badge?.background ?? contract.palette.primary,
              color: badge?.color ?? '#fff',
              fontSize: 14, fontWeight: 900, flexShrink: 0,
            }}>
              {String.fromCharCode(65 + idx)}
            </span>
            <span>{choice.text}</span>
          </div>
        ))}
      </div>

      {/* Feedback (jika ada — feedback slot terpisah akan render sendiri) */}
      <div className="silse-quiz-feedback" data-testid="silse-quiz-feedback-placeholder" style={{ display: 'none' }}>
        {/* Feedback akan dirender oleh feedback slot terpisah jika ada */}
      </div>

      {/* Progress indicator */}
      <div className="silse-quiz-progress" style={{
        fontSize: 12, fontWeight: 700, color: contract.palette.mutedText,
        marginTop: 'auto',
      }}>
        {content.choices.length} pilihan · Correct: {content.correctChoiceId}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MATERIAL-SCENE-PROOF-01 — LearningMaterialContent (learning scene)
//
// Render materi sebagai learning scene:
//   concept header → explanation panel → example cards → key point → student action → visual hint
//
// Class: silse-learning-scene, silse-learning-header, silse-learning-explanation,
//        silse-learning-example-grid, silse-learning-example-card,
//        silse-learning-key-point, silse-learning-student-action, silse-learning-visual-hint
//
// Visual dari resolvedStyle (design contract), bukan hardcoded CSS.
// ---------------------------------------------------------------------------

function LearningMaterialContent({
  slot,
  content,
  contract,
}: {
  slot: SceneRenderSlot;
  content: Extract<SceneRenderSlot['content'], { kind: 'learning-material' }>;
  contract: MpiDesignContract;
}) {
  const rs = slot.resolvedStyle;
  const surf = rs?.surface;

  return (
    <div className="silse-learning-scene" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 12, padding: 16, boxSizing: 'border-box', overflow: 'auto' }}>
      {/* Concept header */}
      <div className="silse-learning-header" style={{
        fontSize: contract.typography.titleSize,
        fontWeight: contract.typography.titleWeight,
        fontFamily: contract.typography.heroFont,
        color: contract.palette.text,
        lineHeight: contract.typography.lineHeight,
      }}>
        {content.conceptTitle}
      </div>
      {content.conceptSubtitle && (
        <div style={{ fontSize: contract.typography.subtitleSize, color: contract.palette.mutedText, marginTop: -8 }}>
          {content.conceptSubtitle}
        </div>
      )}

      {/* Explanation panel */}
      <div className="silse-learning-explanation" style={{
        padding: surf?.padding ?? contract.card.padding,
        borderRadius: surf?.radius ?? contract.card.radius,
        background: surf?.background ?? contract.palette.surface,
        border: surf?.border ?? contract.card.border,
        boxShadow: surf?.shadow,
        fontSize: contract.typography.bodySize,
        lineHeight: contract.typography.lineHeight,
        color: contract.palette.text,
      }}>
        {content.explanation}
      </div>

      {/* Example cards */}
      {content.examples && content.examples.length > 0 && (
        <div className="silse-learning-example-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
          {content.examples.map((ex) => (
            <div key={ex.id} className="silse-learning-example-card" style={{
              padding: surf?.padding ?? contract.card.padding,
              borderRadius: surf?.radius ?? contract.card.radius,
              background: contract.palette.surface,
              border: surf?.border ?? contract.card.border,
            }}>
              <strong style={{ display: 'block', fontSize: 15, marginBottom: 4, color: contract.palette.primary }}>{ex.title}</strong>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: contract.palette.text }}>{ex.body}</div>
            </div>
          ))}
        </div>
      )}

      {/* Key point — FOUNDATION-HARDENING-01: visual dari contract.learning.keyPointPanel */}
      {content.keyPoints && content.keyPoints.length > 0 && (
        <div className="silse-learning-key-point" style={{
          padding: contract.learning.keyPointPanel?.padding ?? 12,
          borderRadius: contract.learning.keyPointPanel?.radius ?? 10,
          background: contract.learning.keyPointPanel?.background ?? '#fffbeb',
          border: contract.learning.keyPointPanel?.border ?? '1px solid #fde68a',
          borderLeft: '4px solid ' + (contract.learning.keyPointPanel?.accentColor ?? '#f59e0b'),
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: contract.learning.keyPointPanel?.iconColor ?? '#92400e', textTransform: 'uppercase', marginBottom: 6 }}>
            {contract.learning.keyPointPanel?.icon ?? '🔑'} Key Points
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.6 }}>
            {content.keyPoints.map((kp, i) => (
              <li key={i} style={{ color: contract.palette.text }}>{kp}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Student action — FOUNDATION-HARDENING-01: visual dari contract.learning.studentActionPanel */}
      {content.studentAction && (
        <div className="silse-learning-student-action" style={{
          padding: contract.learning.studentActionPanel?.padding ?? 12,
          borderRadius: contract.learning.studentActionPanel?.radius ?? 10,
          background: contract.learning.studentActionPanel?.background ?? contract.palette.surface,
          border: contract.learning.studentActionPanel?.border ?? `2px solid ${contract.palette.primary}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>{contract.learning.studentActionPanel?.icon ?? '✏️'}</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: contract.learning.studentActionPanel?.labelColor ?? contract.palette.mutedText, textTransform: 'uppercase' }}>Student Action</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: contract.palette.text }}>{content.studentAction}</div>
          </div>
        </div>
      )}

      {/* Visual hint — FOUNDATION-HARDENING-01: visual dari contract.learning.visualHintPanel */}
      {content.visualHint && (
        <div className="silse-learning-visual-hint" style={{
          padding: 8,
          borderRadius: 8,
          background: 'transparent',
          fontSize: 12,
          color: contract.learning.visualHintPanel?.color ?? contract.palette.mutedText,
          fontStyle: contract.learning.visualHintPanel?.fontStyle ?? 'italic',
          textAlign: 'center',
        }}>
          {contract.learning.visualHintPanel?.icon ?? '💡'} {content.visualHint}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FOUNDATION-FINAL-LOCK-01 — CoverHeroContent (cover scene)
// ---------------------------------------------------------------------------

function CoverHeroContent({
  slot,
  content,
  contract,
}: {
  slot: SceneRenderSlot;
  content: Extract<SceneRenderSlot['content'], { kind: 'cover-hero' }>;
  contract: MpiDesignContract;
}) {
  const ty = slot.resolvedStyle?.typography;
  const btn = slot.resolvedStyle?.button;

  return (
    <div className="silse-cover-scene" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32, boxSizing: 'border-box' }}>
      {content.kicker && (
        <div className="silse-cover-kicker" style={{
          display: 'inline-flex', alignItems: 'center', padding: '7px 16px', borderRadius: 999,
          background: contract.palette.gold, color: contract.palette.primary,
          fontSize: 13, fontWeight: 900, textTransform: 'uppercase',
        }}>
          {content.kicker}
        </div>
      )}
      <div className="silse-cover-title" style={{
        fontFamily: ty?.fontFamily, fontSize: ty?.fontSize, fontWeight: ty?.fontWeight,
        color: ty?.color, lineHeight: ty?.lineHeight, letterSpacing: ty?.letterSpacing,
        textTransform: ty?.uppercase ? 'uppercase' : 'none', textAlign: 'center',
      }}>
        {content.heroTitle}
      </div>
      {content.heroSubtitle && (
        <div className="silse-cover-subtitle" style={{ fontSize: 20, color: contract.palette.mutedText, textAlign: 'center' }}>
          {content.heroSubtitle}
        </div>
      )}
      {content.badges && content.badges.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {content.badges.map((b, i) => (
            <span key={i} className="silse-cover-badge" style={{
              display: 'inline-flex', padding: '4px 12px', borderRadius: 999,
              background: contract.palette.surface, color: contract.palette.primary,
              fontSize: 12, fontWeight: 700, border: `1px solid ${contract.palette.border}`,
            }}>{b}</span>
          ))}
        </div>
      )}
      {content.primaryAction && (
        <button className="silse-cover-primary-action" style={{
          padding: `${btn?.padding?.top ?? 10}px ${btn?.padding?.right ?? 20}px`,
          borderRadius: btn?.radius ?? 8, background: btn?.background ?? contract.palette.primary,
          color: btn?.color ?? '#fff', border: 0, fontWeight: btn?.fontWeight ?? 600,
          fontSize: 16, cursor: 'pointer', marginTop: 8,
        }}>
          {content.primaryAction.label}
        </button>
      )}
      {content.visualAnchor && (
        <div className="silse-cover-visual-anchor" style={{ fontSize: 14, color: contract.palette.mutedText, fontStyle: 'italic', marginTop: 8 }}>
          {content.visualAnchor}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FOUNDATION-FINAL-LOCK-01 — ClosingAwardContent (closing scene)
// ---------------------------------------------------------------------------

function ClosingAwardContent({
  slot,
  content,
  contract,
}: {
  slot: SceneRenderSlot;
  content: Extract<SceneRenderSlot['content'], { kind: 'closing-award' }>;
  contract: MpiDesignContract;
}) {
  const surf = slot.resolvedStyle?.surface;
  const rw = slot.resolvedStyle?.reward;
  const btn = slot.resolvedStyle?.button;

  return (
    <div className="silse-closing-scene" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32, boxSizing: 'border-box' }}>
      {content.achievement && (
        <div className="silse-closing-achievement" style={{
          fontFamily: contract.typography.heroFont, fontSize: contract.typography.titleSize,
          fontWeight: contract.typography.titleWeight, color: contract.palette.text,
          textAlign: 'center', textTransform: contract.typography.uppercase ? 'uppercase' : 'none',
        }}>
          {content.achievement}
        </div>
      )}
      {content.summary && (
        <div className="silse-closing-summary" style={{ fontSize: 18, color: contract.palette.mutedText, textAlign: 'center', maxWidth: 800 }}>
          {content.summary}
        </div>
      )}
      {(content.rewardLabel || content.rewardIcon) && (
        <div className="silse-closing-reward" style={{
          padding: 20, borderRadius: rw?.radius ?? 12,
          background: rw?.background ?? '#fffbeb',
          border: `2px solid ${rw?.borderColor ?? '#fbbf24'}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        }}>
          {content.rewardIcon && <div style={{ fontSize: 64 }}>{content.rewardIcon}</div>}
          {content.rewardLabel && <strong style={{ fontSize: 20, color: contract.palette.text }}>{content.rewardLabel}</strong>}
        </div>
      )}
      {content.reflectionPrompt && (
        <div className="silse-closing-reflection" style={{
          padding: surf?.padding ?? 16, borderRadius: surf?.radius ?? 12,
          background: surf?.background ?? contract.palette.surface,
          border: surf?.border ?? contract.card.border, maxWidth: 600, textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: contract.palette.mutedText, textTransform: 'uppercase', marginBottom: 6 }}>Refleksi</div>
          <div style={{ fontSize: 15, color: contract.palette.text }}>{content.reflectionPrompt}</div>
        </div>
      )}
      {content.nextLearning && (
        <div className="silse-closing-next-learning" style={{ fontSize: 13, color: contract.palette.mutedText }}>
          {content.nextLearning}
        </div>
      )}
      {content.finalAction && (
        <button className="silse-closing-final-action" style={{
          padding: `${btn?.padding?.top ?? 10}px ${btn?.padding?.right ?? 20}px`,
          borderRadius: btn?.radius ?? 8, background: btn?.background ?? contract.palette.primary,
          color: btn?.color ?? '#fff', border: 0, fontWeight: btn?.fontWeight ?? 600,
          fontSize: 16, cursor: 'pointer', marginTop: 8,
        }}>
          {content.finalAction.label}
        </button>
      )}
    </div>
  );
}
