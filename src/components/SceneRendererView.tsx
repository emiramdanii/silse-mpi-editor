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

import { useState, type CSSProperties, type ReactNode } from 'react';
import type { SceneRenderPlan, SceneRenderSlot } from '../core/scene-renderer';
import type { MpiDesignContract } from '../core/mpi-design-contract';
import { sanitizeCustomStyle } from '../core/style/sanitize';
import { getContrastAwareTextColor } from '../core/design/contrast';
import { CustomStyleProvider, SceneGrid } from './scene-blocks';
import {
  CurriculumGuideComposer, ObjectivesPathComposer, StarterReviewComposer,
  DiscussionSceneComposer, CaseAnalysisComposer, ResultSummaryComposer,
  ReflectionJournalComposer, ClassificationGameComposer,
  HotspotMapComposer, MatchingGameComposer, SequencingGameComposer, MediaFocusComposer,
  DiagnosticCheckComposer, RemedialPracticeComposer, EnrichmentChallengeComposer,
  WorksheetActivityComposer, RubricPanelComposer,
  TimelineStoryComposer, BranchingScenarioComposer, GlossaryCardsComposer,
  TeacherGuideComposer, AccessibilityHelpComposer,
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
  /** PERFECT-MPI-RUNTIME-SYNC: scene ID for score tracking */
  sceneId?: string;
  /** PATCH A: Idempotent score set (replaces, doesn't add) */
  onScoreSet?: (sceneId: string, score: number) => void;
  /** PERFECT-MPI-RUNTIME-SYNC: callback when scene is completed */
  onSceneComplete?: (sceneId: string) => void;
  /** PATCH A: Reset scene runtime (clears score + completion) */
  onSceneReset?: (sceneId: string) => void;
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
    'classification-game': ({ contract, slot, sceneId, onScoreSet, onSceneComplete, onSceneReset }) => <ClassificationGameComposer contract={contract} content={slot.content as any} sceneId={sceneId} onScoreSet={onScoreSet} onSceneComplete={onSceneComplete} onSceneReset={onSceneReset} />,
    'hotspot-map': ({ contract, slot }) => <HotspotMapComposer contract={contract} content={slot.content as any} />,
    'matching-game': ({ contract, slot, sceneId, onScoreSet, onSceneComplete, onSceneReset }) => <MatchingGameComposer contract={contract} content={slot.content as any} sceneId={sceneId} onScoreSet={onScoreSet} onSceneComplete={onSceneComplete} onSceneReset={onSceneReset} />,
    'sequencing-game': ({ contract, slot, sceneId, onScoreSet, onSceneComplete, onSceneReset }) => <SequencingGameComposer contract={contract} content={slot.content as any} sceneId={sceneId} onScoreSet={onScoreSet} onSceneComplete={onSceneComplete} onSceneReset={onSceneReset} />,
    'media-focus': ({ contract, slot }) => <MediaFocusComposer contract={contract} content={slot.content as any} />,
    'diagnostic-check': ({ contract, slot }) => <DiagnosticCheckComposer contract={contract} content={slot.content as any} />,
    'remedial-practice': ({ contract, slot }) => <RemedialPracticeComposer contract={contract} content={slot.content as any} />,
    'enrichment-challenge': ({ contract, slot }) => <EnrichmentChallengeComposer contract={contract} content={slot.content as any} />,
    'worksheet-activity': ({ contract, slot }) => <WorksheetActivityComposer contract={contract} content={slot.content as any} />,
    'rubric-panel': ({ contract, slot }) => <RubricPanelComposer contract={contract} content={slot.content as any} />,
    'timeline-story': ({ contract, slot }) => <TimelineStoryComposer contract={contract} content={slot.content as any} />,
    'branching-scenario': ({ contract, slot }) => <BranchingScenarioComposer contract={contract} content={slot.content as any} />,
    'glossary-cards': ({ contract, slot }) => <GlossaryCardsComposer contract={contract} content={slot.content as any} />,
    'teacher-guide': ({ contract, slot }) => <TeacherGuideComposer contract={contract} content={slot.content as any} />,
    'accessibility-help': ({ contract, slot }) => <AccessibilityHelpComposer contract={contract} content={slot.content as any} />,
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
  /** V2-PILAR-3: Called when input field answer is submitted (with auto-check). */
  onInputFieldSubmit?: (slotId: string, isCorrect: boolean, studentAnswer: string) => void;
  /** Selected slot ID (editor highlight). */
  selectedSlotId?: string;
  /** PATCH A: Idempotent score set (replaces, doesn't add) */
  onScoreSet?: (sceneId: string, score: number) => void;
  /** PERFECT-MPI-RUNTIME-SYNC: callback when scene is completed */
  onSceneComplete?: (sceneId: string) => void;
  /** PATCH A: Reset scene runtime (clears score + completion) */
  onSceneReset?: (sceneId: string) => void;
  /** CUSTOM-STYLE-01: Custom CSS from AI for visual enhancement */
  customStyle?: Record<string, Record<string, string>>;
  /**
   * Fase 2a Step 2-3: Editor interaction mode.
   *
   * When true, slots become draggable + resizable via pointer events.
   * onSlotDrag is called during drag, onSlotResize during resize.
   * Active for ALL scene types (Step 3 rollout).
   * Exclude specific types via EDITOR_EXCLUDED_SCENE_TYPES if needed.
   */
  editorMode?: boolean;
  /** Called when a slot is dragged (editor). Receives slot ID + new x/y. */
  onSlotDrag?: (slotId: string, x: number, y: number) => void;
  /** Called when a slot is resized (editor). Receives slot ID + new w/h. */
  onSlotResize?: (slotId: string, width: number, height: number) => void;
  /** Called when drag/resize starts (editor). Receives slot ID. */
  onSlotInteractionStart?: (slotId: string) => void;
  /** Called when drag/resize ends (editor). */
  onSlotInteractionEnd?: () => void;
};

/**
 * Fase 2a Step 3: Editor interaction now enabled for ALL scene types.
 *
 * Step 2 (proof-of-concept) limited this to ['cover-hero'].
 * Step 3 removes the whitelist — all 27 scene types now support
 * drag/resize/select through SceneRendererView.
 *
 * If a specific scene type needs to be excluded in the future (e.g.,
 * interactive game scenes where drag would interfere with gameplay),
 * add it to EDITOR_EXCLUDED_SCENE_TYPES below.
 */
const EDITOR_EXCLUDED_SCENE_TYPES = new Set<string>([]);

export function SceneRendererView({
  plan,
  contract,
  interactive = false,
  onSlotClick,
  onGameAction,
  onQuizAnswer,
  onInputFieldSubmit,
  selectedSlotId,
  onScoreSet,
  onSceneComplete,
  onSceneReset,
  customStyle,
  editorMode = false,
  onSlotDrag,
  onSlotResize,
  onSlotInteractionStart,
  onSlotInteractionEnd,
}: SceneRendererViewProps) {
  // Fase 2a Step 3: Editor interaction enabled for ALL scene types (except excluded)
  const isEditorInteractive = editorMode && !EDITOR_EXCLUDED_SCENE_TYPES.has(plan.sceneType);
  // CUSTOM-STYLE-01 + FASE 3: Sanitize customStyle — filter dangerous props + fonts
  // DEEP-STYLE-INJECTION-01: Pass raw customStyle via CustomStyleProvider context.
  // Blocks (SceneShell/Header/Panel/Chip/Button) consume context + sanitize internally.
  // Generic fallback path still uses safeCustomStyle.shell directly.
  const safeCustomStyle = sanitizeCustomStyle(customStyle);

  // PATCH B: Route by sceneType first, not content.kind.
  const sceneComposer = getSceneComposer(plan.sceneType);
  if (sceneComposer) {
    const primarySlot = plan.slots[0];
    if (primarySlot) {
      const result = sceneComposer({ plan, contract, slot: primarySlot, interactive, onSlotClick, onGameAction, onQuizAnswer, selectedSlotId, sceneId: plan.sceneId, onScoreSet, onSceneComplete, onSceneReset });
      // DEEP-STYLE-INJECTION-01: Wrap with CustomStyleProvider so all blocks inside
      // the composer (SceneShell/Header/Panel/Chip/Button) can consume customStyle
      // via context. This replaces the old wrapper-div hack that only applied shell.
      if (customStyle) {
        return (
          <CustomStyleProvider value={customStyle}>
            {result}
          </CustomStyleProvider>
        );
      }
      return result;
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
    // CUSTOM-STYLE-01: merge customStyle.shell if present
    ...(safeCustomStyle?.shell as CSSProperties),
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
          onInputFieldSubmit={onInputFieldSubmit}
          selected={selectedSlotId === slot.id}
          editorInteractive={isEditorInteractive}
          onSlotDrag={onSlotDrag}
          onSlotResize={onSlotResize}
          onSlotInteractionStart={onSlotInteractionStart}
          onSlotInteractionEnd={onSlotInteractionEnd}
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
  onInputFieldSubmit?: (slotId: string, isCorrect: boolean, studentAnswer: string) => void;
  selected: boolean;
  // Fase 2a Step 2: Editor interaction props
  editorInteractive?: boolean;
  onSlotDrag?: (slotId: string, x: number, y: number) => void;
  onSlotResize?: (slotId: string, width: number, height: number) => void;
  onSlotInteractionStart?: (slotId: string) => void;
  onSlotInteractionEnd?: () => void;
};

function SlotView({
  slot, contract, interactive, onSlotClick, onGameAction, onQuizAnswer, onInputFieldSubmit, selected,
  editorInteractive = false, onSlotDrag, onSlotResize, onSlotInteractionStart, onSlotInteractionEnd,
}: SlotViewProps) {
  const slotStyle: CSSProperties = {
    position: 'absolute',
    left: slot.placement.x,
    top: slot.placement.y,
    width: slot.placement.width,
    height: slot.placement.height,
    zIndex: slot.placement.zIndex ?? 1,
    outline: selected ? '2px solid var(--silse-color-primary, var(--color-accent))' : 'none',
    outlineOffset: 2,
    cursor: editorInteractive ? (selected ? 'grab' : 'pointer') : (interactive ? 'pointer' : 'default'),
  };

  // Fase 2a Step 2: Editor drag handler
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!editorInteractive) return;
    e.stopPropagation();
    onSlotClick?.(slot.id);
    onSlotInteractionStart?.(slot.id);

    const startX = e.clientX;
    const startY = e.clientY;
    const origX = slot.placement.x;
    const origY = slot.placement.y;
    const origW = slot.placement.width;
    const origH = slot.placement.height;
    let isResizing = false;

    // Check if pointer is near bottom-right corner (resize zone: 12px)
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.right;
    const offsetY = e.clientY - rect.bottom;
    if (Math.abs(offsetX) < 14 && Math.abs(offsetY) < 14) {
      isResizing = true;
    }

    const handleMove = (ev: PointerEvent) => {
      ev.preventDefault();
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      if (isResizing) {
        const newW = Math.max(80, origW + dx);
        const newH = Math.max(40, origH + dy);
        onSlotResize?.(slot.id, newW, newH);
      } else {
        const newX = Math.max(0, origX + dx);
        const newY = Math.max(0, origY + dy);
        onSlotDrag?.(slot.id, newX, newY);
      }
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      onSlotInteractionEnd?.();
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  return (
    <div
      className={slot.slotClass}
      data-slot-id={slot.id}
      data-slot-role={slot.role}
      style={slotStyle}
      onPointerDown={editorInteractive ? handlePointerDown : undefined}
      onClick={(e) => {
        e.stopPropagation();
        if (!editorInteractive) onSlotClick?.(slot.id);
      }}
    >
      <ContentRenderer
        slot={slot}
        contract={contract}
        interactive={interactive}
        onGameAction={onGameAction}
        onQuizAnswer={onQuizAnswer}
        onInputFieldSubmit={onInputFieldSubmit}
      />
      {/* Fase 2a Step 2: Resize handle (SE corner) — editor only */}
      {editorInteractive && selected && (
        <div
          data-testid="scene-slot-resize-handle"
          style={{
            position: 'absolute',
            right: -6,
            bottom: -6,
            width: 12,
            height: 12,
            background: 'var(--color-accent)',
            border: '2px solid var(--color-panel)',
            borderRadius: '50%',
            cursor: 'nwse-resize',
            zIndex: 10,
          }}
        />
      )}
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
  onInputFieldSubmit,
}: {
  slot: SceneRenderSlot;
  contract: MpiDesignContract;
  interactive: boolean;
  onGameAction?: (slotId: string, actionIndex: number) => void;
  onQuizAnswer?: (slotId: string, choiceId: string) => void;
  onInputFieldSubmit?: (slotId: string, isCorrect: boolean, studentAnswer: string) => void;
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
        background: surf?.background ?? 'var(--silse-color-surface, var(--color-panel))',
        border: surf?.border ?? '1px solid var(--silse-color-border, var(--color-border))',
        boxShadow: surf?.shadow,
        boxSizing: 'border-box',
        color: 'var(--silse-color-text, var(--color-text))',
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
        color: btn?.color ?? 'var(--silse-color-surface, var(--color-panel))',
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
        background: fb?.background ?? 'var(--silse-color-surface, var(--color-panel-soft))',
        color: fb?.color ?? 'var(--silse-color-text, var(--color-text))',
        borderLeft: '4px solid ' + (fb?.borderColor ?? 'var(--silse-color-border, var(--color-border))'),
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
        background: rw?.background ?? 'var(--silse-color-warning-soft, var(--color-warning-soft))',
        border: '2px solid ' + (rw?.borderColor ?? 'var(--silse-color-warning, var(--color-warning))'),
        textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        color: 'var(--silse-color-text, var(--color-text))',
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
          <button key={i} style={{ padding: '8px 16px', borderRadius: 8, background: contract.palette.primary, color: 'var(--silse-color-surface, var(--color-panel))', border: 0, fontWeight: 600, cursor: interactive ? 'pointer' : 'default' }}>
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

  // V2-PILAR-2: HotspotOverlayComponentView
  if (c.kind === 'hotspot-overlay') {
    return <HotspotOverlaySlotView slot={slot} contract={contract} interactive={interactive} />;
  }

  // V2-PILAR-2: InputFieldComponentView
  if (c.kind === 'input-field') {
    return <InputFieldSlotView slot={slot} contract={contract} onAnswerSubmit={onInputFieldSubmit} />;
  }

  // Fallback for any remaining kind
  const fallbackContent = c as { kind: string };
  return <div className={slot.contentClass}>[{fallbackContent.kind}]</div>;
}

// ---------------------------------------------------------------------------
// V2-PILAR-2: HotspotOverlaySlotView — render titik-titik clickable di atas slide
// ---------------------------------------------------------------------------

function HotspotOverlaySlotView({
  slot, contract, interactive,
}: {
  slot: SceneRenderSlot;
  contract: MpiDesignContract;
  interactive: boolean;
}) {
  const c = slot.content as {
    kind: 'hotspot-overlay';
    hotspots: { id: string; x: number; y: number; label: string; info: string }[];
    defaultOpenIndex: number | null;
  };
  const [activeIdx, setActiveIdx] = useState<number | null>(c.defaultOpenIndex);
  const activeHotspot = activeIdx !== null ? c.hotspots[activeIdx] : null;

  return (
    <div
      className={slot.contentClass}
      data-testid="hotspot-overlay-view"
      style={{
        position: 'relative', width: '100%', height: '100%',
        background: 'transparent', // overlay transparan — background dari slide PNG
        pointerEvents: interactive ? 'auto' : 'none',
      }}
    >
      {c.hotspots.map((h, idx) => (
        <button
          key={h.id}
          className="silse-hotspot-overlay-point"
          data-testid={`hotspot-overlay-point-${h.id}`}
          data-hotspot-id={h.id}
          data-hotspot-idx={idx}
          onClick={(e) => {
            e.stopPropagation();
            if (interactive) setActiveIdx(activeIdx === idx ? null : idx);
          }}
          style={{
            position: 'absolute',
            left: `${h.x}%`,
            top: `${h.y}%`,
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: `3px solid ${activeIdx === idx ? contract.palette.gold : contract.palette.primary}`,
            background: activeIdx === idx ? contract.palette.gold : contract.palette.primary,
            cursor: interactive ? 'pointer' : 'default',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            transition: 'all 0.2s',
            padding: 0,
          }}
        >
          <span
            data-testid={`hotspot-overlay-label-${h.id}`}
            style={{
              position: 'absolute', top: -24, left: '50%', transform: 'translateX(-50%)',
              fontSize: 11, fontWeight: 800, color: contract.palette.text,
              whiteSpace: 'nowrap', pointerEvents: 'none',
            }}
          >
            {h.label}
          </span>
        </button>
      ))}
      {activeHotspot && (
        <div
          className="silse-hotspot-overlay-panel"
          data-testid="hotspot-overlay-panel"
          style={{
            position: 'absolute',
            bottom: 10, left: '50%', transform: 'translateX(-50%)',
            maxWidth: '80%',
            padding: '12px 16px',
            borderRadius: contract.card.radius,
            background: contract.palette.surface,
            border: `1px solid ${contract.palette.gold}66`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: 14,
            lineHeight: 1.5,
            color: contract.palette.text,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: contract.palette.gold, marginBottom: 4 }}>
            {activeHotspot.label}
          </div>
          <div>{activeHotspot.info}</div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// V2-PILAR-2: InputFieldSlotView — render input field dengan auto-check opsional
// ---------------------------------------------------------------------------

function InputFieldSlotView({
  slot, contract, onAnswerSubmit,
}: {
  slot: SceneRenderSlot;
  contract: MpiDesignContract;
  onAnswerSubmit?: (slotId: string, isCorrect: boolean, studentAnswer: string) => void;
}) {
  const c = slot.content as {
    kind: 'input-field';
    variant: string;
    label: string;
    placeholder: string;
    correctAnswer?: string;
    feedbackCorrect?: string;
    feedbackWrong?: string;
    points: number;
  };
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);

  const hasAutoCheck = c.correctAnswer !== undefined && c.correctAnswer !== '';

  const handleCheck = () => {
    if (!hasAutoCheck || !c.correctAnswer) return;
    const isCorrect = userAnswer.trim().toLowerCase() === c.correctAnswer.trim().toLowerCase();
    setFeedback({
      correct: isCorrect,
      message: isCorrect
        ? (c.feedbackCorrect ?? 'Benar!')
        : (c.feedbackWrong ?? 'Belum tepat. Coba lagi.'),
    });
    // V2-PILAR-3: Notify parent (PreviewApp) untuk record ke student-session-store
    if (onAnswerSubmit) {
      onAnswerSubmit(slot.id, isCorrect, userAnswer);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${contract.palette.border ?? '#e3ddcd'}`,
    background: contract.palette.surface ?? '#fff',
    color: contract.palette.text ?? '#1f2533',
    fontSize: 14,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  return (
    <div
      className={slot.contentClass}
      data-testid="input-field-view"
      style={{
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column', gap: 8,
        padding: 12, boxSizing: 'border-box',
      }}
    >
      <label
        data-testid="input-field-label"
        style={{ fontSize: 14, fontWeight: 700, color: contract.palette.text ?? '#1f2533' }}
      >
        {c.label}
      </label>
      {c.variant === 'longAnswer' ? (
        <textarea
          data-testid="input-field-textarea"
          placeholder={c.placeholder}
          value={userAnswer}
          onChange={(e) => { setUserAnswer(e.target.value); setFeedback(null); }}
          style={{ ...inputStyle, minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }}
        />
      ) : (
        <input
          data-testid="input-field-input"
          type={c.variant === 'numericInput' ? 'number' : 'text'}
          placeholder={c.placeholder}
          value={userAnswer}
          onChange={(e) => { setUserAnswer(e.target.value); setFeedback(null); }}
          style={inputStyle}
        />
      )}
      {hasAutoCheck && (
        <button
          data-testid="input-field-check-btn"
          onClick={handleCheck}
          style={{
            alignSelf: 'flex-start',
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: contract.palette.primary ?? '#1e5b8f',
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Periksa Jawaban
        </button>
      )}
      {feedback && (
        <div
          data-testid="input-field-feedback"
          data-feedback-correct={feedback.correct ? 'true' : 'false'}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            background: feedback.correct ? '#e1f3e8' : '#fbe6e3',
            color: feedback.correct
              ? (contract.palette.success ?? '#2f7d4f')
              : (contract.palette.danger ?? '#c0392b'),
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {feedback.message}
        </div>
      )}
    </div>
  );
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
  // 16:9 FIT: overflow hidden — game mission must fit 1280x720 without inner scroll.
  const briefingStyle = slot.resolvedStyle?.surface;
  return (
    <div className="silse-game-scene" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 10, padding: 16, boxSizing: 'border-box', overflow: 'hidden' }}>
      {/* Briefing */}
      <div className="silse-game-briefing" style={{
        padding: briefingStyle?.padding ?? 12,
        borderRadius: briefingStyle?.radius ?? 10,
        background: briefingStyle?.background ?? 'var(--silse-color-warning-soft, var(--color-warning-soft))',
        border: briefingStyle?.border ?? '1px solid var(--silse-color-warning, var(--color-warning))',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--silse-color-warning, var(--color-warning))', textTransform: 'uppercase', marginBottom: 4 }}>📋 Briefing Misi</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--silse-color-text, var(--color-text))' }}>{content.briefing}</div>
      </div>

      {/* Target */}
      <div className="silse-game-target" style={{
        padding: 12, borderRadius: 10,
        background: contract.game.targetPanel?.background ?? 'var(--silse-color-primary, var(--color-accent-soft))',
        border: contract.game.targetPanel?.border ?? '1px solid var(--silse-color-primary, var(--color-accent))',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--silse-color-primary, var(--color-accent))', textTransform: 'uppercase', marginBottom: 4 }}>🎯 Target Misi</div>
        <div style={{ fontSize: 14, color: 'var(--silse-color-text, var(--color-text))' }}>{content.missionTarget}</div>
      </div>

      {/* Action grid — LAYOUT-STYLE-01: SceneGrid for customStyle.grid support */}
      <SceneGrid contract={contract} className="silse-game-action-grid" columns="repeat(auto-fill, minmax(180px, 1fr))" gap={8}>
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
              padding: 12,
              borderRadius: 12,
              background: 'var(--silse-color-surface, var(--color-panel))',
              border: '2px solid var(--silse-color-border, var(--color-border))',
              cursor: interactive ? 'pointer' : 'default',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--silse-color-text, var(--color-text))',
              minHeight: 64,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-grid', placeItems: 'center', minWidth: 28, height: 28, borderRadius: 8, background: contract.palette.primary, color: 'var(--silse-color-surface, var(--color-panel))', fontSize: 13, fontWeight: 900 }}>
                {String.fromCharCode(65 + idx)}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--silse-color-muted-text, var(--color-muted))', textTransform: 'uppercase' }}>Aksi</span>
            </div>
            <span>{action.label}</span>
          </div>
        ))}
      </SceneGrid>

      {/* Reward preview */}
      <div className="silse-game-reward" style={{ padding: 12, borderRadius: 10, background: 'var(--silse-color-warning-soft, var(--color-warning-soft))', border: '2px solid var(--silse-color-warning, var(--color-warning))', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 24 }}>{(content.reward as { icon?: string }).icon ?? '🏅'}</span>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--silse-color-warning, var(--color-warning))', textTransform: 'uppercase' }}>Reward</div>
          <strong style={{ fontSize: 14, color: 'var(--silse-color-text, var(--color-text))' }}>{content.reward.label}</strong>
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
  const premiumShadow = contract.card.shadow || '0 2px 8px rgba(0,0,0,0.08)';
  const quizPanelBg = panel?.background ?? contract.palette.surface;
  const quizPanelBorder = ansCard?.border ?? contract.palette.border;

  return (
    <div className="silse-quiz-scene silse-premium-quiz-scene" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 10, padding: 16, boxSizing: 'border-box', overflow: 'hidden' }}>
      {/* Challenge header */}
      <div className="silse-quiz-header silse-premium-quiz-header" style={{
        fontSize: 11, fontWeight: 700, color: contract.palette.mutedText,
        textTransform: 'uppercase', letterSpacing: 0.5,
      }}>
        🎯 Challenge — Pilih jawaban yang tepat
      </div>

      {/* Question focus panel */}
      <div className="silse-quiz-question-focus silse-premium-quiz-focus" style={{
        padding: panel?.padding ?? 16,
        borderRadius: panel?.radius ?? contract.card.radius,
        background: quizPanelBg,
        border: `1px solid ${quizPanelBorder}`,
        boxShadow: premiumShadow,
        fontSize: 17, fontWeight: 600,
        color: contract.palette.text,
      }}>
        {content.prompt}
      </div>

      {/* Answer grid — LAYOUT-STYLE-01: SceneGrid for customStyle.grid support */}
      <SceneGrid contract={contract} className="silse-quiz-answer-grid silse-premium-quiz-grid" columns="repeat(auto-fill, minmax(200px, 1fr))" gap={10}>
        {content.choices.map((choice, idx) => (
          <div
            key={choice.id}
            className="silse-quiz-answer-card silse-premium-quiz-card"
            data-choice-id={choice.id}
            onClick={(e) => {
              e.stopPropagation();
              if (interactive) onQuizAnswer?.(slot.id, choice.id);
            }}
            onMouseEnter={(e) => {
              if (!interactive) return;
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.borderColor = `${contract.palette.primary}aa`;
              e.currentTarget.style.boxShadow = premiumShadow;
            }}
            onMouseLeave={(e) => {
              if (!interactive) return;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = quizPanelBorder;
              e.currentTarget.style.boxShadow = 'none';
            }}
            style={{
              padding: ansCard?.padding ?? 14,
              borderRadius: ansCard?.radius ?? contract.card.radius,
              background: ansCard?.background ?? 'var(--silse-color-surface, var(--color-panel))',
              border: `2px solid ${quizPanelBorder}`,
              cursor: interactive ? 'pointer' : 'default',
              fontSize: 14,
              fontWeight: 600,
              color: contract.palette.text,
              minHeight: 52,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              transition: 'all 0.18s ease',
            }}
          >
            {/* Choice letter badge */}
            <span className="silse-quiz-choice-badge silse-premium-quiz-badge" style={{
              display: 'inline-grid', placeItems: 'center',
              minWidth: 32, height: 32,
              borderRadius: badge?.radius ?? 8,
              background: badge?.background ?? contract.palette.primary,
              color: badge?.color ?? 'var(--silse-color-surface, var(--color-panel))',
              fontSize: 14, fontWeight: 900, flexShrink: 0,
            }}>
              {String.fromCharCode(65 + idx)}
            </span>
            <span>{choice.text}</span>
          </div>
        ))}
      </SceneGrid>

      {/* Feedback (jika ada — feedback slot terpisah akan render sendiri) */}
      <div className="silse-quiz-feedback" data-testid="silse-quiz-feedback-placeholder" style={{ display: 'none' }}>
        {/* Feedback akan dirender oleh feedback slot terpisah jika ada */}
      </div>

      {/* Progress indicator */}
      <div className="silse-quiz-progress silse-premium-quiz-progress" style={{
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
  const premiumShadow = contract.card.shadow || '0 2px 8px rgba(0,0,0,0.08)';
  const surfBorder = surf?.border ?? contract.card.border;
  const surfBg = surf?.background ?? contract.palette.surface;
  const surfPadding = surf?.padding ?? contract.card.padding;
  const surfRadius = surf?.radius ?? contract.card.radius;

  return (
    <div className="silse-learning-scene silse-premium-learning-scene" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 12, padding: 16, boxSizing: 'border-box', overflow: 'hidden' }}>
      {/* Concept header */}
      <div className="silse-learning-header silse-premium-learning-header" style={{
        fontSize: contract.typography.titleSize,
        fontWeight: contract.typography.titleWeight,
        fontFamily: contract.typography.heroFont,
        color: contract.palette.text,
        lineHeight: contract.typography.lineHeight,
        borderLeft: `4px solid ${contract.palette.primary}`,
        paddingLeft: 12,
      }}>
        {content.conceptTitle}
      </div>
      {content.conceptSubtitle && (
        <div style={{ fontSize: contract.typography.subtitleSize, color: contract.palette.mutedText, marginTop: -8 }}>
          {content.conceptSubtitle}
        </div>
      )}

      {/* Explanation panel */}
      <div className="silse-learning-explanation silse-premium-learning-explanation" style={{
        padding: surfPadding,
        borderRadius: surfRadius,
        background: surfBg,
        border: surfBorder,
        boxShadow: surf?.shadow || premiumShadow,
        fontSize: contract.typography.bodySize,
        lineHeight: contract.typography.lineHeight,
        color: contract.palette.text,
      }}>
        {content.explanation}
      </div>

      {/* Example cards — LAYOUT-STYLE-01: SceneGrid for customStyle.grid support.
          L2-3: columns default wired to contract.learning.exampleGridColumns. */}
      {content.examples && content.examples.length > 0 && (
        <SceneGrid contract={contract} className="silse-learning-example-grid silse-premium-learning-example-grid" columns={contract.learning?.exampleGridColumns ?? 'repeat(auto-fill, minmax(280px, 1fr))'} gap={10}>
          {content.examples.map((ex) => (
            <div key={ex.id} className="silse-learning-example-card silse-premium-learning-example-card" style={{
              padding: surfPadding,
              borderRadius: surfRadius,
              background: contract.palette.surface,
              border: surfBorder,
              boxShadow: premiumShadow,
              transition: 'all 0.18s ease',
            }}>
              <strong style={{ display: 'block', fontSize: 15, marginBottom: 4, color: contract.palette.primary }}>{ex.title}</strong>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: contract.palette.text }}>{ex.body}</div>
            </div>
          ))}
        </SceneGrid>
      )}

      {/* Key point — FOUNDATION-HARDENING-01: visual dari contract.learning.keyPointPanel */}
      {content.keyPoints && content.keyPoints.length > 0 && (
        <div className="silse-learning-key-point silse-premium-learning-key-point" style={{
          padding: contract.learning.keyPointPanel?.padding ?? 12,
          borderRadius: contract.learning.keyPointPanel?.radius ?? 10,
          background: contract.learning.keyPointPanel?.background ?? 'var(--silse-color-warning-soft, var(--color-warning-soft))',
          border: contract.learning.keyPointPanel?.border ?? '1px solid var(--silse-color-warning, var(--color-warning))',
          borderLeft: '4px solid ' + (contract.learning.keyPointPanel?.accentColor ?? 'var(--silse-color-warning, var(--color-warning))'),
          boxShadow: premiumShadow,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: contract.learning.keyPointPanel?.iconColor ?? 'var(--silse-color-warning, var(--color-warning))', textTransform: 'uppercase', marginBottom: 6 }}>
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
        <div className="silse-learning-student-action silse-premium-learning-student-action" style={{
          padding: contract.learning.studentActionPanel?.padding ?? 12,
          borderRadius: contract.learning.studentActionPanel?.radius ?? 10,
          background: contract.learning.studentActionPanel?.background ?? contract.palette.surface,
          border: contract.learning.studentActionPanel?.border ?? `2px solid ${contract.palette.primary}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: premiumShadow,
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
        <div className="silse-learning-visual-hint silse-premium-learning-visual-hint" style={{
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

// NOTE (Fase 3b Commit 1): getContrastAwareTextColor + DARK_BACKGROUND_ROLES
// extracted to src/core/design/contrast.ts — shared pure module imported by
// both editor (here) and export-html.ts (via inline JS equivalent in generateJS()).

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
  // EXPORT-CONTRAST-01: cover scenes use dark gradient backgrounds.
  // Force white text for title/subtitle to ensure readability.
  const titleColor = getContrastAwareTextColor('cover', ty?.color ?? contract.palette.text);
  const subtitleColor = getContrastAwareTextColor('cover', contract.palette.mutedText);

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
        color: titleColor, lineHeight: ty?.lineHeight, letterSpacing: ty?.letterSpacing,
        textTransform: ty?.uppercase ? 'uppercase' : 'none', textAlign: 'center',
      }}>
        {content.heroTitle}
      </div>
      {content.heroSubtitle && (
        <div className="silse-cover-subtitle" style={{ fontSize: 20, color: subtitleColor, textAlign: 'center' }}>
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
          color: btn?.color ?? 'var(--silse-color-surface, var(--color-panel))', border: 0, fontWeight: btn?.fontWeight ?? 600,
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
  // EXPORT-CONTRAST-01: closing scenes use dark gradient backgrounds.
  // Force white text for achievement/summary/nextLearning (direct on dark bg).
  // Reward box and reflection panel have their own light backgrounds, so text
  // inside them stays dark (contract.palette.text).
  const achievementColor = getContrastAwareTextColor('closing', contract.palette.text);
  const summaryColor = getContrastAwareTextColor('closing', contract.palette.mutedText);
  const nextLearningColor = getContrastAwareTextColor('closing', contract.palette.mutedText);

  return (
    <div className="silse-closing-scene" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32, boxSizing: 'border-box' }}>
      {content.achievement && (
        <div className="silse-closing-achievement" style={{
          fontFamily: contract.typography.heroFont, fontSize: contract.typography.titleSize,
          fontWeight: contract.typography.titleWeight, color: achievementColor,
          textAlign: 'center', textTransform: contract.typography.uppercase ? 'uppercase' : 'none',
        }}>
          {content.achievement}
        </div>
      )}
      {content.summary && (
        <div className="silse-closing-summary" style={{ fontSize: 18, color: summaryColor, textAlign: 'center', maxWidth: 800 }}>
          {content.summary}
        </div>
      )}
      {(content.rewardLabel || content.rewardIcon) && (
        <div className="silse-closing-reward" style={{
          padding: 20, borderRadius: rw?.radius ?? 12,
          background: rw?.background ?? 'var(--silse-color-warning-soft, var(--color-warning-soft))',
          border: `2px solid ${rw?.borderColor ?? 'var(--silse-color-warning, var(--color-warning))'}`,
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
        <div className="silse-closing-next-learning" style={{ fontSize: 13, color: nextLearningColor }}>
          {content.nextLearning}
        </div>
      )}
      {content.finalAction && (
        <button className="silse-closing-final-action" style={{
          padding: `${btn?.padding?.top ?? 10}px ${btn?.padding?.right ?? 20}px`,
          borderRadius: btn?.radius ?? 8, background: btn?.background ?? contract.palette.primary,
          color: btn?.color ?? 'var(--silse-color-surface, var(--color-panel))', border: 0, fontWeight: btn?.fontWeight ?? 600,
          fontSize: 16, cursor: 'pointer', marginTop: 8,
        }}>
          {content.finalAction.label}
        </button>
      )}
    </div>
  );
}
