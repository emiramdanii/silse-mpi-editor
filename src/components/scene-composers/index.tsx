/**
 * Scene Composers for 7 priority scenes (GOLDEN-REFERENCE-RENDER-P1)
 * + classification-game (GOLDEN-REFERENCE-GAME-P1).
 *
 * Layer: components/scene-composers
 * Allowed imports: react, ../scene-blocks, ../../core/mpi-design-contract, ../../core/scene-renderer
 *
 * Setiap composer memakai reusable blocks dan mengambil visual dari contract.
 * Tidak hardcode warna utama.
 */

import { useState } from 'react';
import type { MpiDesignContract } from '../../core/mpi-design-contract';

import {
  SceneShell, SceneHeader, SceneChip, ScenePanel, SceneGrid, SceneTabs, SceneAccordion,
  DiscussionBanner, TimerBlock, ResponseInputBlock,
  RevealBlock, ScoreSummaryBlock, PortfolioBlock, ReflectionPromptBlock,
  ActionButtonBlock, MediaDisplayBlock,
} from '../scene-blocks';

// ---------------------------------------------------------------------------
// 1. CurriculumGuideComposer
// ---------------------------------------------------------------------------

export function CurriculumGuideComposer({
  contract, content,
}: {
  contract: MpiDesignContract;
  content: { curriculumTitle?: string; competency?: string; learningFlow?: string; profileTags?: string[] };
}) {
  const [activeTab, setActiveTab] = useState('cp');
  return (
    <SceneShell contract={contract} className="silse-scene-curriculum-guide">
      <SceneHeader contract={contract} chipIcon="📋" chipLabel="Kurikulum Merdeka" chipColor={contract.palette.secondary} title={content.curriculumTitle || 'Kurikulum'} />
      <SceneTabs contract={contract} className="silse-curriculum-tabs" tabs={[
        { id: 'cp', label: 'CP' }, { id: 'tp', label: 'TP' }, { id: 'atp', label: 'ATP' },
      ]} activeTab={activeTab} onTabClick={setActiveTab} />
      <ScenePanel contract={contract} className="silse-curriculum-panel">
        {activeTab === 'cp' && <div style={{ fontSize: 14, lineHeight: 1.7, color: contract.palette.text }}>{content.competency || 'Capaian pembelajaran'}</div>}
        {activeTab === 'tp' && <div style={{ fontSize: 14, lineHeight: 1.7, color: contract.palette.text }}>Tujuan Pembelajaran: {content.learningFlow || 'Alur pembelajaran'}</div>}
        {activeTab === 'atp' && <div style={{ fontSize: 14, lineHeight: 1.7, color: contract.palette.text }}>Alur Tujuan Pembelajaran</div>}
      </ScenePanel>
      {content.profileTags && content.profileTags.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {content.profileTags.map((tag, i) => <SceneChip key={i} contract={contract} label={tag} color={contract.palette.success} />)}
        </div>
      )}
    </SceneShell>
  );
}

// ---------------------------------------------------------------------------
// 2. ObjectivesPathComposer
// ---------------------------------------------------------------------------

export function ObjectivesPathComposer({
  contract, content,
}: {
  contract: MpiDesignContract;
  content: { objectiveList?: string[]; successCriteria?: string; activityPath?: string[] };
}) {
  return (
    <SceneShell contract={contract} className="silse-scene-objectives-path">
      <SceneHeader contract={contract} chipIcon="🎯" chipLabel="Tujuan Pembelajaran" chipColor={contract.palette.gold} title="Tujuan Pembelajaran" />
      <ScenePanel contract={contract}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(content.objectiveList || []).map((obj, i) => (
            <div key={i} className="silse-objective-item" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontFamily: contract.typography.heroFont, fontSize: 18, color: contract.palette.gold, flexShrink: 0 }}>{i + 1}</span>
              <span style={{ fontSize: 14, lineHeight: 1.6, color: contract.palette.text }}>{obj}</span>
            </div>
          ))}
        </div>
      </ScenePanel>
      {content.successCriteria && (
        <ScenePanel contract={contract} title="Kriteria Berhasil">
          <div style={{ fontSize: 14, lineHeight: 1.6, color: contract.palette.mutedText }}>{content.successCriteria}</div>
        </ScenePanel>
      )}
      {content.activityPath && content.activityPath.length > 0 && (
        <div className="silse-activity-path" style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
          {content.activityPath.map((step, i) => (
            <div key={i} className="silse-activity-step" style={{
              flex: 1, minWidth: 120, background: 'rgba(255,255,255,0.04)',
              border: contract.card.border, borderRadius: 10, padding: '10px 12px', textAlign: 'center',
              position: 'relative', marginRight: i < content.activityPath!.length - 1 ? 12 : 0,
            }}>
              <div style={{ fontFamily: contract.typography.heroFont, fontSize: 14, color: contract.palette.gold, marginBottom: 3 }}>{i + 1}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: contract.palette.text }}>{step}</div>
            </div>
          ))}
        </div>
      )}
    </SceneShell>
  );
}

// ---------------------------------------------------------------------------
// 3. StarterReviewComposer
// ---------------------------------------------------------------------------

export function StarterReviewComposer({
  contract, content,
}: {
  contract: MpiDesignContract;
  content: { priorLearning?: string; triggerQuestion?: string; bridgeToNewTopic?: string; discussionPrompt?: string };
}) {
  return (
    <SceneShell contract={contract} className="silse-scene-starter-review">
      <SceneHeader contract={contract} chipIcon="🔄" chipLabel="Review · ±5 Menit" chipColor={contract.palette.gold} title="Review Pertemuan Sebelumnya" />
      <ScenePanel contract={contract} className="silse-review-summary-card" title="Yang Sudah Kita Pelajari">
        <div style={{ fontSize: 14, lineHeight: 1.7, color: contract.palette.text }}>{content.priorLearning || 'Materi sebelumnya'}</div>
      </ScenePanel>
      {content.triggerQuestion && (
        <ScenePanel contract={contract} title="Pertanyaan Pemantik">
          <div style={{ fontSize: 16, fontWeight: 700, color: contract.palette.gold, lineHeight: 1.5 }}>{content.triggerQuestion}</div>
        </ScenePanel>
      )}
      {content.discussionPrompt && (
        <DiscussionBanner contract={contract} className="silse-review-discussion" label="Diskusi" title="Diskusikan!" body={content.discussionPrompt} icon="💬" accentColor={contract.palette.success} />
      )}
      <ResponseInputBlock contract={contract} className="silse-review-response" placeholder="Tulis jawaban diskusimu..." />
      {content.bridgeToNewTopic && (
        <ScenePanel contract={contract} title="Akan Kita Pelajari Hari Ini">
          <div style={{ fontSize: 14, lineHeight: 1.6, color: contract.palette.mutedText }}>{content.bridgeToNewTopic}</div>
        </ScenePanel>
      )}
    </SceneShell>
  );
}

// ---------------------------------------------------------------------------
// 4. DiscussionSceneComposer
// ---------------------------------------------------------------------------

export function DiscussionSceneComposer({
  contract, content,
}: {
  contract: MpiDesignContract;
  content: { discussionPrompt?: string; groupInstruction?: string; responseInput?: string };
}) {
  const premiumShadow = contract.card.shadow || '0 2px 8px rgba(0,0,0,0.08)';
  return (
    <SceneShell contract={contract} className="silse-scene-discussion" style={{ overflow: 'hidden' }}>
      <SceneHeader contract={contract} chipIcon="💬" chipLabel="Diskusi Kelompok" chipColor={contract.palette.success} title="Diskusi Kelompok" />
      <div className="silse-premium-discussion-banner-wrap" style={{ borderRadius: contract.card.radius, boxShadow: premiumShadow }}>
        <DiscussionBanner contract={contract} className="silse-discussion-banner silse-premium-discussion-banner" label="Instruksi" title={content.groupInstruction || 'Diskusikan dalam kelompok'} body={content.discussionPrompt || 'Pertanyaan diskusi'} icon="👥" accentColor={contract.palette.success} />
      </div>
      <div className="silse-premium-discussion-timer-wrap" style={{ borderRadius: contract.card.radius, boxShadow: premiumShadow }}>
        <TimerBlock contract={contract} className="silse-discussion-timer silse-premium-discussion-timer" seconds={300} />
      </div>
      <div className="silse-premium-discussion-input-wrap" style={{ borderRadius: contract.card.radius, boxShadow: premiumShadow }}>
        <ResponseInputBlock contract={contract} className="silse-discussion-input silse-premium-discussion-input" placeholder={content.responseInput || 'Tulis hasil diskusi kelompokmu...'} />
      </div>
      <ActionButtonBlock contract={contract} label="Simpan Jawaban" variant="primary" />
    </SceneShell>
  );
}

// ---------------------------------------------------------------------------
// 5. CaseAnalysisComposer
// ---------------------------------------------------------------------------

export function CaseAnalysisComposer({
  contract, content, layout,
}: {
  contract: MpiDesignContract;
  content: { caseText?: string; analysisPrompt?: string; revealExplanation?: string; discussionPrompt?: string };
  layout?: { columns?: number; arrangement?: string; orientation?: 'horizontal' | 'vertical'; regions?: Record<string, string> };
}) {
  const [revealed, setRevealed] = useState(false);
  // DYNAMIC-LAYOUT: default regions untuk case analysis
  const defaultRegions = {
    header: 'full',
    caseText: 'left',
    analysisPrompt: 'right',
    reveal: 'full',
    discussion: 'full',
    response: 'full',
    action: 'full',
  };
  const mergedLayout = layout
    ? { ...layout, regions: { ...defaultRegions, ...(layout.regions ?? {}) } }
    : undefined;
  return (
    <SceneShell contract={contract} className="silse-scene-case-analysis" layout={mergedLayout}>
      <SceneHeader contract={contract} chipIcon="🔗" chipLabel="Materi · ±15 Menit" chipColor={contract.palette.secondary} title="Analisis Kasus" />
      <div data-region-name="caseText">
        <ScenePanel contract={contract} className="silse-case-card" title="Kasus">
          <div style={{ fontSize: 14, lineHeight: 1.7, color: contract.palette.text }}>{content.caseText || 'Kasus'}</div>
        </ScenePanel>
      </div>
      {content.analysisPrompt && (
        <div data-region-name="analysisPrompt">
          <ScenePanel contract={contract} title="Pertanyaan Analisis">
            <div style={{ fontSize: 15, fontWeight: 700, color: contract.palette.gold }}>{content.analysisPrompt}</div>
          </ScenePanel>
        </div>
      )}
      {content.revealExplanation && (
        <div data-region-name="reveal">
          <RevealBlock contract={contract} className="silse-case-reveal" label="Pembahasan" text={content.revealExplanation} revealed={revealed} />
        </div>
      )}
      {content.discussionPrompt && (
        <div data-region-name="discussion">
          <DiscussionBanner contract={contract} className="silse-case-discussion" label="Diskusi" title="Diskusikan!" body={content.discussionPrompt} icon="💬" accentColor={contract.palette.gold} />
        </div>
      )}
      <div data-region-name="response">
        <ResponseInputBlock contract={contract} placeholder="Tulis analisismu..." />
      </div>
      {content.revealExplanation && (
        <div data-region-name="action">
          <ActionButtonBlock contract={contract} label={revealed ? 'Sembunyikan' : 'Lihat Pembahasan'} onClick={() => setRevealed(!revealed)} />
        </div>
      )}
    </SceneShell>
  );
}

// ---------------------------------------------------------------------------
// 6. ResultSummaryComposer
// ---------------------------------------------------------------------------

export function ResultSummaryComposer({
  contract, content,
}: {
  contract: MpiDesignContract;
  content: { scoreSummary?: { score: number; maxScore: number }; achievementLevel?: string; breakdown?: { label: string; value: string }[]; reviewCards?: { title: string; body: string }[] };
}) {
  const score = content.scoreSummary?.score ?? 0;
  const maxScore = content.scoreSummary?.maxScore ?? 100;
  return (
    <SceneShell contract={contract} className="silse-scene-result-summary">
      <SceneHeader contract={contract} chipIcon="🏆" chipLabel="Hasil" chipColor={contract.palette.secondary} title="Hasil Pembelajaran" />
      <ScoreSummaryBlock contract={contract} className="silse-result-circle" score={score} maxScore={maxScore} level={content.achievementLevel} />
      {content.breakdown && content.breakdown.length > 0 && (
        <ScenePanel contract={contract} className="silse-result-breakdown" title="Rincian Skor">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {content.breakdown.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: contract.palette.mutedText }}>{item.label}</span>
                <span style={{ fontWeight: 700, color: contract.palette.text }}>{item.value}</span>
              </div>
            ))}
          </div>
        </ScenePanel>
      )}
      {content.reviewCards && content.reviewCards.length > 0 && (
        <SceneGrid contract={contract} className="silse-result-review-card">
          {content.reviewCards.map((card, i) => (
            <ScenePanel key={i} contract={contract} title={card.title}>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: contract.palette.mutedText }}>{card.body}</div>
            </ScenePanel>
          ))}
        </SceneGrid>
      )}
      <ActionButtonBlock contract={contract} label="Lanjut ke Refleksi" variant="primary" />
    </SceneShell>
  );
}

// ---------------------------------------------------------------------------
// 7. ReflectionJournalComposer
// ---------------------------------------------------------------------------

export function ReflectionJournalComposer({
  contract, content,
}: {
  contract: MpiDesignContract;
  content: { reflectionPrompts?: string[]; commitmentInput?: string; portfolioSummary?: { label: string; value: string }[]; nextTask?: string };
}) {
  const premiumShadow = contract.card.shadow || '0 2px 8px rgba(0,0,0,0.08)';
  return (
    <SceneShell contract={contract} className="silse-scene-reflection-journal" style={{ overflow: 'hidden' }}>
      <SceneHeader contract={contract} chipIcon="📝" chipLabel="Refleksi · ±8 Menit" chipColor={contract.palette.secondary} title="Refleksi Diri" />
      {content.portfolioSummary && content.portfolioSummary.length > 0 && (
        <div className="silse-premium-reflection-portfolio-wrap" style={{ borderRadius: contract.card.radius, boxShadow: premiumShadow }}>
          <PortfolioBlock contract={contract} className="silse-reflection-portfolio silse-premium-reflection-portfolio" title="Portofolio Diskusi" items={content.portfolioSummary} />
        </div>
      )}
      <div className="silse-premium-reflection-prompt-wrap" style={{ borderRadius: contract.card.radius, boxShadow: premiumShadow, borderLeft: `4px solid ${contract.palette.secondary}` }}>
        <ReflectionPromptBlock contract={contract} className="silse-reflection-prompt silse-premium-reflection-prompt" prompts={content.reflectionPrompts || ['Refleksikan pembelajaran hari ini']} />
      </div>
      <div className="silse-premium-reflection-input-wrap" style={{ borderRadius: contract.card.radius, boxShadow: premiumShadow }}>
        <ResponseInputBlock contract={contract} className="silse-reflection-input silse-premium-reflection-input" placeholder={content.commitmentInput || 'Tulis komitmenmu...'} />
      </div>
      {content.nextTask && (
        <ScenePanel contract={contract} className="silse-reflection-next-task silse-premium-reflection-next-task" title="Tugas Pertemuan Berikutnya">
          <div style={{ fontSize: 14, lineHeight: 1.6, color: contract.palette.text }}>{content.nextTask}</div>
        </ScenePanel>
      )}
      <ActionButtonBlock contract={contract} label="Simpan Refleksi" variant="primary" />
    </SceneShell>
  );
}

// ---------------------------------------------------------------------------
// 8. ClassificationGameComposer (GOLDEN-REFERENCE-GAME-P1)
// Game sortir: klik item → klik kolom → benar/salah → score → selesai
// ---------------------------------------------------------------------------

type ClassificationItem = {
  id: string;
  label: string;
  correctCategory: string;
};

type ClassificationGameState = {
  selectedItem: string | null;
  placedItems: Record<string, string>; // itemId → category
  score: number;
  feedback: { text: string; correct: boolean } | null;
  completed: boolean;
};

export function ClassificationGameComposer({
  contract, content, sceneId, onScoreSet, onSceneComplete, onSceneReset,
}: {
  contract: MpiDesignContract;
  content: {
    instruction?: string;
    items?: ClassificationItem[];
    categories?: string[];
    scorePerItem?: number;
    feedback?: string;
    completionMessage?: string;
  };
  /** PATCH A: Idempotent runtime sync */
  sceneId?: string;
  onScoreSet?: (sceneId: string, score: number) => void;
  onSceneComplete?: (sceneId: string) => void;
  onSceneReset?: (sceneId: string) => void;
}) {
  const items = content.items || [];
  const categories = content.categories || [];
  const scorePerItem = content.scorePerItem ?? 10;

  const [state, setState] = useState<ClassificationGameState>({
    selectedItem: null,
    placedItems: {},
    score: 0,
    feedback: null,
    completed: false,
  });

  const handleSelectItem = (itemId: string) => {
    if (state.placedItems[itemId]) return; // already placed
    setState(prev => ({ ...prev, selectedItem: itemId, feedback: null }));
  };

  const handlePlaceItem = (category: string) => {
    if (!state.selectedItem) return;
    const item = items.find(i => i.id === state.selectedItem);
    if (!item) return;
    const isCorrect = item.correctCategory === category;
    const newPlaced = { ...state.placedItems, [item.id]: category };
    const newScore = isCorrect ? state.score + scorePerItem : state.score;
    const allPlaced = Object.keys(newPlaced).length === items.length;

    setState({
      selectedItem: null,
      placedItems: newPlaced,
      score: newScore,
      feedback: {
        text: isCorrect ? `Benar! ${item.label} → ${category}` : `Belum tepat. ${item.label} bukan ${category}.`,
        correct: isCorrect,
      },
      completed: allPlaced,
    });
    // PATCH A: Idempotent score sync — set total score, don't add.
    if (sceneId && onScoreSet) onScoreSet(sceneId, newScore);
    if (allPlaced && sceneId && onSceneComplete) onSceneComplete(sceneId);
  };

  const handleReset = () => {
    setState({ selectedItem: null, placedItems: {}, score: 0, feedback: null, completed: false });
    // PATCH A: Reset runtime score + completion in store
    if (sceneId && onSceneReset) onSceneReset(sceneId);
  };

  const remainingItems = items.filter(i => !state.placedItems[i.id]);

  const premiumItemShadow = contract.card.shadow || '0 2px 8px rgba(0,0,0,0.08)';

  return (
    <SceneShell contract={contract} className="silse-scene-classification-game" style={{ overflow: 'hidden' }}>
      <SceneHeader contract={contract} chipIcon="🎮" chipLabel="Game Sortir · ±15 Menit" chipColor={contract.palette.success} title="Game Sortir Norma" />
      {content.instruction && (
        <div className="silse-classification-instruction silse-premium-game-instruction" style={{
          background: `${contract.palette.success}11`, border: `1px solid ${contract.palette.success}40`,
          borderRadius: contract.card.radius, padding: '13px 15px', fontSize: 14, lineHeight: 1.6, color: contract.palette.text,
          boxShadow: premiumItemShadow,
        }}>
          {content.instruction}
        </div>
      )}

      {/* Score */}
      <div className="silse-classification-score silse-premium-game-score" style={{
        display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 800,
        color: contract.palette.gold,
        padding: '8px 14px', borderRadius: 999, alignSelf: 'flex-start',
        background: `${contract.palette.gold}11`, border: `1px solid ${contract.palette.gold}33`,
        boxShadow: premiumItemShadow,
      }}>
        <span style={{ fontSize: 18 }}>🏆</span> Skor: <span data-testid="game-score">{state.score}</span>
        {state.completed && <span data-testid="game-completed" style={{ color: contract.palette.success }}>✓ Selesai!</span>}
      </div>

      {/* Feedback */}
      {state.feedback && (
        <div className="silse-classification-feedback silse-premium-game-feedback" data-testid="game-feedback" style={{
          padding: '10px 14px', borderRadius: contract.card.radius, fontSize: 14, fontWeight: 700,
          background: state.feedback.correct ? `${contract.palette.success}11` : `${contract.palette.danger}11`,
          border: `1px solid ${state.feedback.correct ? contract.palette.success : contract.palette.danger}40`,
          color: state.feedback.correct ? contract.palette.success : contract.palette.danger,
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: premiumItemShadow,
        }}>
          <span style={{ fontSize: 16 }}>{state.feedback.correct ? '✓' : '✗'}</span>
          {state.feedback.text}
        </div>
      )}

      {/* Item Pool */}
      {!state.completed && remainingItems.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: contract.palette.mutedText, marginBottom: 8 }}>
            Pilih Item {state.selectedItem && '→ Lalu klik kolom'}
          </div>
          <div className="silse-classification-pool silse-premium-game-pool" data-testid="classification-pool" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {remainingItems.map(item => (
              <button
                key={item.id}
                data-testid={`item-${item.id}`}
                data-item-id={item.id}
                onClick={() => handleSelectItem(item.id)}
                onMouseEnter={(e) => {
                  if (state.selectedItem === item.id) return;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.borderColor = `${contract.palette.gold}aa`;
                  e.currentTarget.style.boxShadow = premiumItemShadow;
                }}
                onMouseLeave={(e) => {
                  if (state.selectedItem === item.id) return;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = contract.card.border;
                  e.currentTarget.style.boxShadow = state.selectedItem === item.id ? premiumItemShadow : 'none';
                }}
                className="silse-premium-game-item"
                style={{
                  padding: '10px 16px', borderRadius: 999, fontSize: 14, fontWeight: 700,
                  border: state.selectedItem === item.id ? `2px solid ${contract.palette.gold}` : contract.card.border,
                  background: state.selectedItem === item.id ? `${contract.palette.gold}22` : contract.card.background,
                  color: contract.palette.text, cursor: 'pointer', transition: 'all 0.18s ease',
                  boxShadow: state.selectedItem === item.id ? premiumItemShadow : 'none',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category Columns */}
      <SceneGrid contract={contract} className="silse-classification-column-grid silse-premium-game-columns" columns={`repeat(${Math.min(categories.length, 4)}, 1fr)`} gap={10}>
        {categories.map(cat => {
          const placedInCategory = items.filter(i => state.placedItems[i.id] === cat);
          return (
            <div
              key={cat}
              data-testid={`column-${cat}`}
              data-category={cat}
              onClick={() => handlePlaceItem(cat)}
              className="silse-classification-column silse-premium-game-column"
              style={{
                background: contract.card.background,
                border: state.selectedItem
                  ? `2px dashed ${contract.palette.gold}aa`
                  : contract.card.border,
                borderRadius: contract.card.radius, padding: contract.card.padding,
                minHeight: 120, cursor: state.selectedItem ? 'pointer' : 'default',
                transition: 'all 0.18s ease',
                boxShadow: premiumItemShadow,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, color: contract.palette.gold, marginBottom: 10, textAlign: 'center' }}>{cat}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {placedInCategory.map(item => (
                  <div key={item.id} className="silse-classification-placed-item silse-premium-game-placed" data-testid={`placed-${item.id}`} style={{
                    padding: '6px 12px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                    background: item.correctCategory === cat ? `${contract.palette.success}22` : `${contract.palette.danger}22`,
                    color: item.correctCategory === cat ? contract.palette.success : contract.palette.danger,
                    transform: 'scale(1.02)', transformOrigin: 'left center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    transition: 'all 0.18s ease',
                  }}>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </SceneGrid>

      {/* Reset + Completion */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <ActionButtonBlock contract={contract} label="↺ Reset" onClick={handleReset} variant="secondary" />
      </div>
      {state.completed && content.completionMessage && (
        <div data-testid="completion-message" className="silse-premium-game-completion" style={{
          padding: '16px', borderRadius: contract.card.radius, textAlign: 'center',
          background: `${contract.palette.success}11`, border: `1px solid ${contract.palette.success}40`,
          fontSize: 16, fontWeight: 800, color: contract.palette.success,
          boxShadow: premiumItemShadow,
        }}>
          {content.completionMessage}
        </div>
      )}
    </SceneShell>
  );
}

// ===========================================================================
// HIGH-PRIORITY-RENDERERS-01: 4 new scene composers
// ===========================================================================

// ---------------------------------------------------------------------------
// 9. HotspotMapComposer
// ---------------------------------------------------------------------------

export function HotspotMapComposer({
  contract, content,
}: {
  contract: MpiDesignContract;
  content: {
    backgroundVisual?: string;
    guidingQuestion?: string;
    hotspots?: { id: string; x: number; y: number; label: string; info: string }[];
    caption?: string;
  };
}) {
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const hotspots = content.hotspots || [];
  const active = hotspots.find((h) => h.id === activeHotspot);

  return (
    <SceneShell contract={contract} className="silse-scene-hotspot-map">
      <SceneHeader contract={contract} chipIcon="🗺️" chipLabel="Peta Interaktif" chipColor={contract.palette.secondary} title={content.guidingQuestion || 'Peta Hotspot'} />
      {content.caption && (
        <div style={{ fontSize: 14, lineHeight: 1.6, color: contract.palette.mutedText }}>{content.caption}</div>
      )}
      <div className="silse-hotspot-map" data-testid="hotspot-map" style={{
        position: 'relative', width: '100%', minHeight: 320,
        borderRadius: contract.card.radius, overflow: 'hidden',
        background: content.backgroundVisual ? `url(${content.backgroundVisual}) center/cover` : contract.palette.surface,
        border: contract.card.border,
      }}>
        {!content.backgroundVisual && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: contract.palette.mutedText, fontStyle: 'italic' }}>
            🗺️ Peta tidak tersedia — klik titik untuk informasi
          </div>
        )}
        {hotspots.map((h) => (
          <button
            key={h.id}
            className="silse-hotspot-point"
            data-testid={`hotspot-${h.id}`}
            data-hotspot-id={h.id}
            onClick={() => setActiveHotspot(activeHotspot === h.id ? null : h.id)}
            style={{
              position: 'absolute', left: `${h.x}%`, top: `${h.y}%`,
              width: 28, height: 28, borderRadius: '50%',
              border: `3px solid ${activeHotspot === h.id ? contract.palette.gold : contract.palette.primary}`,
              background: activeHotspot === h.id ? contract.palette.gold : contract.palette.primary,
              cursor: 'pointer', transform: 'translate(-50%, -50%)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)', transition: 'all 0.2s',
            }}
          >
            <span style={{ position: 'absolute', top: -24, left: '50%', transform: 'translateX(-50%)', fontSize: 11, fontWeight: 800, color: contract.palette.text, whiteSpace: 'nowrap' }}>{h.label}</span>
          </button>
        ))}
      </div>
      {active && (
        <div className="silse-hotspot-panel" data-testid="hotspot-panel" style={{
          padding: 16, borderRadius: contract.card.radius,
          background: contract.palette.surface, border: `1px solid ${contract.palette.gold}66`,
        }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: contract.palette.gold, marginBottom: 6 }}>{active.label}</div>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: contract.palette.text }}>{active.info}</div>
        </div>
      )}
    </SceneShell>
  );
}

// ---------------------------------------------------------------------------
// 10. MatchingGameComposer
// ---------------------------------------------------------------------------

export function MatchingGameComposer({
  contract, content, sceneId, onScoreSet, onSceneComplete, onSceneReset,
}: {
  contract: MpiDesignContract;
  content: {
    instruction?: string;
    leftItems?: { id: string; label: string }[];
    rightItems?: { id: string; label: string }[];
    correctPairs?: { leftId: string; rightId: string }[];
    scorePerPair?: number;
    completionMessage?: string;
  };
  /** PATCH A: Idempotent runtime sync */
  sceneId?: string;
  onScoreSet?: (sceneId: string, score: number) => void;
  onSceneComplete?: (sceneId: string) => void;
  onSceneReset?: (sceneId: string) => void;
}) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean; text: string } | null>(null);

  const leftItems = content.leftItems || [];
  const rightItems = content.rightItems || [];
  const correctPairs = content.correctPairs || [];
  const scorePer = content.scorePerPair ?? 10;

  const handleLeftClick = (id: string) => {
    setSelectedLeft(selectedLeft === id ? null : id);
    setFeedback(null);
  };

  const handleRightClick = (rightId: string) => {
    if (!selectedLeft) return;
    const isCorrect = correctPairs.some((p) => p.leftId === selectedLeft && p.rightId === rightId);
    setSelectedLeft(null);
    if (isCorrect) {
      const newPairs = { ...pairs, [selectedLeft]: rightId };
      setPairs(newPairs);
      setScore(score + scorePer);
      setFeedback({ correct: true, text: 'Benar! Pasangan tepat. Kamu memahami hubungan antar konsep dengan baik.' });
      // PATCH A: Idempotent score sync — set total score based on correct pairs count.
      const totalCorrect = Object.keys(newPairs).length;
      const newTotalScore = totalCorrect * scorePer;
      if (sceneId && onScoreSet) onScoreSet(sceneId, newTotalScore);
      if (totalCorrect === correctPairs.length && sceneId && onSceneComplete) onSceneComplete(sceneId);
    } else {
      const leftItem = leftItems.find(i => i.id === selectedLeft);
      setFeedback({ correct: false, text: `Belum tepat. "${leftItem?.label}" belum cocok dengan pilihan ini. Pikirkan kembali hubungannya.` });
    }
  };

  const handleReset = () => {
    setPairs({}); setScore(0); setSelectedLeft(null); setFeedback(null);
    // PATCH A: Reset runtime score + completion in store
    if (sceneId && onSceneReset) onSceneReset(sceneId);
  };

  const premiumShadow = contract.card.shadow || '0 2px 8px rgba(0,0,0,0.08)';

  return (
    <SceneShell contract={contract} className="silse-scene-matching-game" style={{ overflow: 'hidden' }}>
      <SceneHeader contract={contract} chipIcon="🔗" chipLabel="Game Mencocokkan" chipColor={contract.palette.success} title="Game Mencocokkan" />
      {content.instruction && (
        <div className="silse-premium-matching-instruction" style={{ fontSize: 14, lineHeight: 1.6, color: contract.palette.text, padding: '8px 12px', background: `${contract.palette.success}11`, borderRadius: contract.card.radius, boxShadow: premiumShadow }}>{content.instruction}</div>
      )}
      <div className="silse-matching-score silse-premium-matching-score" style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        fontSize: 16, fontWeight: 800, color: contract.palette.gold,
        padding: '8px 14px', borderRadius: 999, alignSelf: 'flex-start',
        background: `${contract.palette.gold}11`, border: `1px solid ${contract.palette.gold}33`,
        boxShadow: premiumShadow,
      }}>
        <span style={{ fontSize: 18 }}>🏆</span> Skor: <span data-testid="matching-score">{score}</span>
      </div>
      {feedback && (
        <div className="silse-premium-matching-feedback" data-testid="matching-feedback" style={{
          padding: '10px 14px', borderRadius: contract.card.radius, fontSize: 14, fontWeight: 700,
          background: feedback.correct ? `${contract.palette.success}11` : `${contract.palette.danger}11`,
          border: `1px solid ${feedback.correct ? contract.palette.success : contract.palette.danger}40`,
          color: feedback.correct ? contract.palette.success : contract.palette.danger,
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: premiumShadow,
        }}>
          <span style={{ fontSize: 16 }}>{feedback.correct ? '✓' : '✗'}</span>
          {feedback.text}
        </div>
      )}
      <SceneGrid contract={contract} columns="1fr 1fr" gap={12}>
        <div className="silse-matching-left silse-premium-matching-left">
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: contract.palette.mutedText, marginBottom: 8 }}>Kolom Kiri</div>
          {leftItems.map((item) => {
            const paired = pairs[item.id];
            return (
              <button
                key={item.id}
                data-testid={`left-${item.id}`}
                data-left-id={item.id}
                onClick={() => handleLeftClick(item.id)}
                onMouseEnter={(e) => {
                  if (paired || selectedLeft === item.id) return;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.borderColor = `${contract.palette.gold}aa`;
                }}
                onMouseLeave={(e) => {
                  if (paired || selectedLeft === item.id) return;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = contract.card.border;
                }}
                className="silse-premium-matching-pair"
                style={{
                  display: 'block', width: '100%', textAlign: 'left', marginBottom: 6,
                  padding: '10px 14px', minHeight: 44, borderRadius: contract.card.radius, cursor: 'pointer',
                  border: selectedLeft === item.id ? `2px solid ${contract.palette.gold}` : paired ? `2px solid ${contract.palette.success}` : contract.card.border,
                  background: selectedLeft === item.id ? `${contract.palette.gold}22` : paired ? `${contract.palette.success}11` : contract.card.background,
                  color: contract.palette.text, fontSize: 14, fontWeight: 600,
                  transition: 'all 0.18s ease',
                  boxShadow: (selectedLeft === item.id || paired) ? premiumShadow : 'none',
                }}
              >{item.label}{paired && <span style={{ marginLeft: 4, color: contract.palette.success, fontWeight: 800 }}>✓</span>}</button>
            );
          })}
        </div>
        <div className="silse-matching-right silse-premium-matching-right">
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: contract.palette.mutedText, marginBottom: 8 }}>Kolom Kanan</div>
          {rightItems.map((item) => {
            const paired = Object.values(pairs).includes(item.id);
            return (
              <button
                key={item.id}
                data-testid={`right-${item.id}`}
                data-right-id={item.id}
                onClick={() => handleRightClick(item.id)}
                disabled={paired}
                onMouseEnter={(e) => {
                  if (paired) return;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.borderColor = `${contract.palette.gold}aa`;
                }}
                onMouseLeave={(e) => {
                  if (paired) return;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = contract.card.border;
                }}
                className="silse-premium-matching-pair"
                style={{
                  display: 'block', width: '100%', textAlign: 'left', marginBottom: 6,
                  padding: '10px 14px', minHeight: 44, borderRadius: contract.card.radius, cursor: paired ? 'default' : 'pointer',
                  border: paired ? `2px solid ${contract.palette.success}` : contract.card.border,
                  background: paired ? `${contract.palette.success}11` : contract.card.background,
                  color: contract.palette.text, fontSize: 14, fontWeight: 600, opacity: paired ? 0.7 : 1,
                  transition: 'all 0.18s ease',
                  boxShadow: paired ? premiumShadow : 'none',
                }}
              >{item.label}</button>
            );
          })}
        </div>
      </SceneGrid>
      <ActionButtonBlock contract={contract} label="↺ Reset" onClick={handleReset} variant="secondary" />
    </SceneShell>
  );
}

// ---------------------------------------------------------------------------
// 11. SequencingGameComposer
// ---------------------------------------------------------------------------

export function SequencingGameComposer({
  contract, content, sceneId, onScoreSet, onSceneComplete, onSceneReset,
}: {
  contract: MpiDesignContract;
  content: {
    instruction?: string;
    items?: { id: string; label: string }[];
    correctOrder?: string[];
    scorePerItem?: number;
    completionMessage?: string;
  };
  /** PATCH A: Idempotent runtime sync */
  sceneId?: string;
  onScoreSet?: (sceneId: string, score: number) => void;
  onSceneComplete?: (sceneId: string) => void;
  onSceneReset?: (sceneId: string) => void;
}) {
  const [order, setOrder] = useState<string[]>((content.items || []).map((i) => i.id));
  const [feedback, setFeedback] = useState<{ correct: boolean; text: string } | null>(null);
  const [score, setScore] = useState(0);
  const items = content.items || [];
  const correctOrder = content.correctOrder || [];
  const scorePer = content.scorePerItem ?? 10;

  const moveUp = (idx: number) => {
    if (idx === 0 || scored) return; // P2 PATCH A: lock after correct
    const newOrder = [...order];
    [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
    setOrder(newOrder); setFeedback(null);
  };
  const moveDown = (idx: number) => {
    if (idx === order.length - 1 || scored) return; // P2 PATCH A: lock after correct
    const newOrder = [...order];
    [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
    setOrder(newOrder); setFeedback(null);
  };
  const [scored, setScored] = useState(false);
  const checkAnswer = () => {
    const isCorrect = order.every((id, i) => id === correctOrder[i]);
    if (isCorrect) {
      if (!scored) {
        const earnedScore = scorePer * items.length;
        setScore(earnedScore);
        setScored(true);
        // PATCH A: Idempotent score sync — set total score, guarded by scored flag.
        if (sceneId && onScoreSet) onScoreSet(sceneId, earnedScore);
        if (sceneId && onSceneComplete) onSceneComplete(sceneId);
      }
      setFeedback({ correct: true, text: 'Benar! Urutan tepat. Kamu memahami alur dengan baik.' });
    } else {
      let wrongIdx = -1;
      for (let i = 0; i < order.length; i++) {
        if (order[i] !== correctOrder[i]) { wrongIdx = i; break; }
      }
      const hint = wrongIdx >= 0 ? ` Periksa posisi ke-${wrongIdx + 1}.` : '';
      setFeedback({ correct: false, text: `Belum tepat.${hint} Coba urutkan lagi.` });
    }
  };
  const handleReset = () => {
    setOrder(items.map((i) => i.id)); setFeedback(null); setScore(0); setScored(false);
    // PATCH A: Reset runtime score + completion in store
    if (sceneId && onSceneReset) onSceneReset(sceneId);
  };

  const premiumShadow = contract.card.shadow || '0 2px 8px rgba(0,0,0,0.08)';

  return (
    <SceneShell contract={contract} className="silse-scene-sequencing-game" style={{ overflow: 'hidden' }}>
      <SceneHeader contract={contract} chipIcon="📋" chipLabel="Game Urutkan" chipColor={contract.palette.accent} title="Game Mengurutkan" />
      {content.instruction && (
        <div className="silse-premium-sequence-instruction" style={{ fontSize: 14, lineHeight: 1.6, color: contract.palette.text, padding: '8px 12px', background: `${contract.palette.accent}11`, borderRadius: contract.card.radius, boxShadow: premiumShadow }}>{content.instruction}</div>
      )}
      <div className="silse-premium-sequence-score" style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        fontSize: 16, fontWeight: 800, color: contract.palette.gold,
        padding: '8px 14px', borderRadius: 999, alignSelf: 'flex-start',
        background: `${contract.palette.gold}11`, border: `1px solid ${contract.palette.gold}33`,
        boxShadow: premiumShadow,
      }}>
        <span style={{ fontSize: 18 }}>🏆</span> Skor: <span data-testid="sequence-score">{score}</span>
      </div>
      {feedback && (
        <div className="silse-sequence-feedback silse-premium-sequence-feedback" data-testid="sequence-feedback" style={{
          padding: '10px 14px', borderRadius: contract.card.radius, fontSize: 14, fontWeight: 700,
          background: feedback.correct ? `${contract.palette.success}11` : `${contract.palette.danger}11`,
          border: `1px solid ${feedback.correct ? contract.palette.success : contract.palette.danger}40`,
          color: feedback.correct ? contract.palette.success : contract.palette.danger,
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: premiumShadow,
        }}>
          <span style={{ fontSize: 16 }}>{feedback.correct ? '✓' : '✗'}</span>
          {feedback.text}
        </div>
      )}
      {order.map((id, idx) => {
        const item = items.find((i) => i.id === id);
        if (!item) return null;
        return (
          <div key={id} className="silse-sequence-item silse-premium-sequence-item" data-testid={`sequence-item-${id}`} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: contract.card.radius, background: contract.card.background, border: contract.card.border,
            boxShadow: premiumShadow, transition: 'all 0.18s ease',
          }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: contract.palette.gold, minWidth: 28 }}>{idx + 1}.</span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: contract.palette.text }}>{item.label}</span>
            <button data-testid={`sequence-up-${id}`} className="silse-sequence-up silse-premium-sequence-up" onClick={() => moveUp(idx)} disabled={idx === 0 || scored} onMouseEnter={(e) => { if (idx === 0 || scored) return; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = premiumShadow; }} onMouseLeave={(e) => { if (idx === 0 || scored) return; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }} style={{ padding: '6px 12px', minHeight: 36, borderRadius: 8, border: 'none', background: (idx === 0 || scored) ? 'rgba(255,255,255,0.08)' : contract.palette.primary, color: '#fff', cursor: (idx === 0 || scored) ? 'not-allowed' : 'pointer', fontWeight: 700, transition: 'all 0.18s ease' }}>↑</button>
            <button data-testid={`sequence-down-${id}`} className="silse-sequence-down silse-premium-sequence-down" onClick={() => moveDown(idx)} disabled={idx === order.length - 1 || scored} onMouseEnter={(e) => { if (idx === order.length - 1 || scored) return; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = premiumShadow; }} onMouseLeave={(e) => { if (idx === order.length - 1 || scored) return; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }} style={{ padding: '6px 12px', minHeight: 36, borderRadius: 8, border: 'none', background: (idx === order.length - 1 || scored) ? 'rgba(255,255,255,0.08)' : contract.palette.primary, color: '#fff', cursor: (idx === order.length - 1 || scored) ? 'not-allowed' : 'pointer', fontWeight: 700, transition: 'all 0.18s ease' }}>↓</button>
          </div>
        );
      })}
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="silse-sequence-check silse-premium-sequence-check" data-testid="sequence-check" onClick={checkAnswer} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = premiumShadow; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }} style={{ padding: '10px 18px', minHeight: 44, borderRadius: 999, border: 'none', background: contract.palette.success, color: '#fff', fontWeight: 800, cursor: 'pointer', transition: 'all 0.18s ease', boxShadow: premiumShadow }}>✓ Cek Jawaban</button>
        <ActionButtonBlock contract={contract} label="↺ Reset" onClick={handleReset} variant="secondary" />
      </div>
    </SceneShell>
  );
}

// ---------------------------------------------------------------------------
// 12. MediaFocusComposer
// ---------------------------------------------------------------------------

export function MediaFocusComposer({
  contract, content,
}: {
  contract: MpiDesignContract;
  content: {
    mediaAsset?: { src: string; alt?: string; objectFit?: 'cover' | 'contain' };
    guidingQuestion?: string;
    caption?: string;
    responseInput?: string;
  };
}) {
  return (
    <SceneShell contract={contract} className="silse-scene-media-focus">
      <SceneHeader contract={contract} chipIcon="🖼️" chipLabel="Fokus Media" chipColor={contract.palette.secondary} title="Fokus Media" />
      <div className="silse-media-focus-display" data-testid="media-focus-display" style={{ width: '100%', minHeight: 200, borderRadius: contract.card.radius, overflow: 'hidden', border: contract.card.border }}>
        <MediaDisplayBlock contract={contract} src={content.mediaAsset?.src || ''} alt={content.mediaAsset?.alt} objectFit={content.mediaAsset?.objectFit || 'cover'} />
      </div>
      {content.caption && (
        <div style={{ fontSize: 13, color: contract.palette.mutedText, fontStyle: 'italic' }}>{content.caption}</div>
      )}
      {content.guidingQuestion && (
        <div className="silse-media-focus-question" data-testid="media-focus-question" style={{
          padding: 16, borderRadius: contract.card.radius,
          background: `${contract.palette.gold}0A`, border: `1px solid ${contract.palette.gold}33`,
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: contract.palette.gold, marginBottom: 6 }}>❓ Pertanyaan Pemandu</div>
          <div style={{ fontSize: 15, lineHeight: 1.6, color: contract.palette.text, fontWeight: 600 }}>{content.guidingQuestion}</div>
        </div>
      )}
      <div className="silse-media-focus-response">
        <ResponseInputBlock contract={contract} placeholder={content.responseInput || 'Tulis jawabanmu...'} />
      </div>
    </SceneShell>
  );
}

// ===========================================================================
// PERFECT-MPI-RENDER-COMPLETE-01: 5 assessment/support scene composers
// ===========================================================================

// ---------------------------------------------------------------------------
// 13. DiagnosticCheckComposer
// ---------------------------------------------------------------------------

export function DiagnosticCheckComposer({
  contract, content,
}: {
  contract: MpiDesignContract;
  content: {
    diagnosticPrompt?: string;
    questionSet?: { id: string; prompt: string; choices: { id: string; text: string }[]; correctChoiceId: string }[];
    recommendation?: string;
    readinessLevels?: { level: string; minScore: number; description: string }[];
  };
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const questions = content.questionSet || [];
  const score = questions.filter((q) => answers[q.id] === q.correctChoiceId).length;
  const maxScore = questions.length;
  const readiness = content.readinessLevels?.find((l) => score >= l.minScore);

  return (
    <SceneShell contract={contract} className="silse-scene-diagnostic-check">
      <SceneHeader contract={contract} chipIcon="🔍" chipLabel="Diagnostik" chipColor={contract.palette.accent} title={content.diagnosticPrompt || 'Diagnostik Kesiapan'} />
      {questions.map((q, qi) => (
        <div key={q.id} className="silse-diagnostic-question" data-testid={`diagnostic-q-${q.id}`} style={{ padding: 14, borderRadius: contract.card.radius, background: contract.card.background, border: contract.card.border }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: contract.palette.text, marginBottom: 8 }}>{qi + 1}. {q.prompt}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {q.choices.map((c) => {
              const selected = answers[q.id] === c.id;
              const isCorrect = submitted && c.id === q.correctChoiceId;
              const isWrong = submitted && selected && c.id !== q.correctChoiceId;
              return (
                <button
                  key={c.id}
                  className="silse-diagnostic-choice"
                  data-testid={`diagnostic-choice-${q.id}-${c.id}`}
                  data-question-id={q.id}
                  data-choice-id={c.id}
                  disabled={submitted}
                  onClick={() => setAnswers({ ...answers, [q.id]: c.id })}
                  style={{
                    textAlign: 'left', padding: '8px 12px', minHeight: 40, borderRadius: 8, cursor: submitted ? 'default' : 'pointer',
                    border: isCorrect ? `2px solid ${contract.palette.success}` : isWrong ? `2px solid ${contract.palette.danger}` : selected ? `2px solid ${contract.palette.gold}` : contract.card.border,
                    background: isCorrect ? `${contract.palette.success}11` : isWrong ? `${contract.palette.danger}11` : selected ? `${contract.palette.gold}11` : 'transparent',
                    color: contract.palette.text, fontSize: 13, fontWeight: 600,
                  }}
                >
                  {c.text}{isCorrect && ' ✓'}{isWrong && ' ✗'}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {!submitted ? (
        <ActionButtonBlock contract={contract} label="Periksa Hasil" onClick={() => setSubmitted(true)} variant="primary" />
      ) : (
        <>
          <div className="silse-diagnostic-result" data-testid="diagnostic-result" style={{ padding: 16, borderRadius: contract.card.radius, background: `${contract.palette.gold}0A`, border: `1px solid ${contract.palette.gold}33`, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: contract.palette.gold }}>{score} / {maxScore}</div>
            {readiness && (
              <div style={{ fontSize: 16, fontWeight: 700, color: contract.palette.text, marginTop: 8 }}>{readiness.level}: {readiness.description}</div>
            )}
          </div>
          {content.recommendation && (
            <div style={{ padding: 12, borderRadius: 10, background: `${contract.palette.secondary}11`, border: `1px solid ${contract.palette.secondary}33`, fontSize: 14, color: contract.palette.text }}>💡 {content.recommendation}</div>
          )}
          <ActionButtonBlock contract={contract} label="↺ Ulangi" onClick={() => { setAnswers({}); setSubmitted(false); }} variant="secondary" />
        </>
      )}
    </SceneShell>
  );
}

// ---------------------------------------------------------------------------
// 14. RemedialPracticeComposer
// ---------------------------------------------------------------------------

export function RemedialPracticeComposer({
  contract, content,
}: {
  contract: MpiDesignContract;
  content: {
    misconception?: string;
    reteachExplanation?: string;
    guidedPractice?: { id: string; prompt: string; choices: { id: string; text: string }[]; correctChoiceId: string; hint?: string }[];
    retryQuestion?: string;
  };
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<Record<string, boolean>>({});
  const practice = content.guidedPractice || [];

  return (
    <SceneShell contract={contract} className="silse-scene-remedial-practice">
      <SceneHeader contract={contract} chipIcon="🔧" chipLabel="Penguatan Konsep" chipColor={contract.palette.warning} title="Penguatan Konsep" />
      {content.misconception && (
        <div style={{ padding: 12, borderRadius: 10, background: `${contract.palette.danger}11`, border: `1px solid ${contract.palette.danger}33`, fontSize: 14, color: contract.palette.text }}>
          <strong style={{ color: contract.palette.danger }}>⚠️ Miskonsepsi:</strong> {content.misconception}
        </div>
      )}
      {content.reteachExplanation && (
        <ScenePanel contract={contract} title="Penjelasan Ulang">
          <div style={{ fontSize: 14, lineHeight: 1.6, color: contract.palette.text }}>{content.reteachExplanation}</div>
        </ScenePanel>
      )}
      {practice.map((p, pi) => {
        const answered = answers[p.id];
        const isCorrect = feedback[p.id];
        return (
          <div key={p.id} className="silse-remedial-question" data-testid={`remedial-q-${p.id}`} style={{ padding: 14, borderRadius: contract.card.radius, background: contract.card.background, border: contract.card.border }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: contract.palette.text, marginBottom: 8 }}>{pi + 1}. {p.prompt}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {p.choices.map((c) => {
                const selected = answered === c.id;
                return (
                  <button
                    key={c.id}
                    disabled={feedback[p.id] !== undefined}
                    onClick={() => {
                      setAnswers({ ...answers, [p.id]: c.id });
                      const correct = c.id === p.correctChoiceId;
                      setFeedback({ ...feedback, [p.id]: correct });
                    }}
                    style={{
                      textAlign: 'left', padding: '8px 12px', minHeight: 40, borderRadius: 8, cursor: feedback[p.id] !== undefined ? 'default' : 'pointer',
                      border: selected ? (isCorrect ? `2px solid ${contract.palette.success}` : `2px solid ${contract.palette.danger}`) : contract.card.border,
                      background: selected ? (isCorrect ? `${contract.palette.success}11` : `${contract.palette.danger}11`) : 'transparent',
                      color: contract.palette.text, fontSize: 13, fontWeight: 600,
                    }}
                  >{c.text}</button>
                );
              })}
            </div>
            {p.hint && !feedback[p.id] && (
              <button className="silse-remedial-hint" data-testid={`remedial-hint-${p.id}`} onClick={() => setShowHints({ ...showHints, [p.id]: true })} style={{ marginTop: 6, padding: '4px 10px', fontSize: 12, border: 'none', background: 'transparent', color: contract.palette.gold, cursor: 'pointer', fontWeight: 700 }}>💡 Tampilkan Hint</button>
            )}
            {showHints[p.id] && p.hint && (
              <div className="silse-remedial-hint" style={{ marginTop: 6, padding: 8, borderRadius: 8, background: `${contract.palette.gold}0A`, fontSize: 13, color: contract.palette.mutedText }}>{p.hint}</div>
            )}
            {feedback[p.id] !== undefined && (
              <div className="silse-remedial-feedback" data-testid={`remedial-feedback-${p.id}`} style={{ marginTop: 6, padding: 8, borderRadius: 8, fontSize: 13, fontWeight: 700, background: isCorrect ? `${contract.palette.success}11` : `${contract.palette.danger}11`, color: isCorrect ? contract.palette.success : contract.palette.danger }}>
                {isCorrect ? 'Benar!' : 'Belum tepat. Coba lagi.'}
              </div>
            )}
          </div>
        );
      })}
      {content.retryQuestion && (
        <ScenePanel contract={contract} title="Pertanyaan Retry">
          <div style={{ fontSize: 14, lineHeight: 1.6, color: contract.palette.text }}>{content.retryQuestion}</div>
        </ScenePanel>
      )}
    </SceneShell>
  );
}

// ---------------------------------------------------------------------------
// 15. EnrichmentChallengeComposer
// ---------------------------------------------------------------------------

export function EnrichmentChallengeComposer({
  contract, content,
}: {
  contract: MpiDesignContract;
  content: {
    challengeContext?: string;
    advancedTask?: string;
    responseInput?: string;
    rubricPreview?: { criterion: string; descriptor: string }[];
    completionMessage?: string;
  };
}) {
  const [completed, setCompleted] = useState(false);
  return (
    <SceneShell contract={contract} className="silse-scene-enrichment-challenge">
      <SceneHeader contract={contract} chipIcon="🚀" chipLabel="Tantangan Lanjutan" chipColor={contract.palette.secondary} title="Tantangan Lanjutan" />
      {content.challengeContext && (
        <ScenePanel contract={contract} title="Konteks Challenge">
          <div style={{ fontSize: 14, lineHeight: 1.6, color: contract.palette.text }}>{content.challengeContext}</div>
        </ScenePanel>
      )}
      {content.advancedTask && (
        <div className="silse-enrichment-task" data-testid="enrichment-task" style={{ padding: 16, borderRadius: contract.card.radius, background: `${contract.palette.secondary}11`, border: `1px solid ${contract.palette.secondary}33` }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: contract.palette.secondary, marginBottom: 6 }}>Tugas Lanjutan</div>
          <div style={{ fontSize: 15, lineHeight: 1.6, color: contract.palette.text, fontWeight: 600 }}>{content.advancedTask}</div>
        </div>
      )}
      <div className="silse-enrichment-response">
        <ResponseInputBlock contract={contract} placeholder={content.responseInput || 'Tugas jawaban enrichment...'} />
      </div>
      {content.rubricPreview && content.rubricPreview.length > 0 && (
        <div className="silse-enrichment-rubric" style={{ padding: 14, borderRadius: contract.card.radius, background: contract.card.background, border: contract.card.border }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: contract.palette.mutedText, marginBottom: 8 }}>Rubrik Penilaian</div>
          {content.rubricPreview.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: i < content.rubricPreview!.length - 1 ? `1px solid ${contract.palette.border}` : 'none' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: contract.palette.gold, minWidth: 100 }}>{r.criterion}</span>
              <span style={{ fontSize: 13, color: contract.palette.mutedText }}>{r.descriptor}</span>
            </div>
          ))}
        </div>
      )}
      {!completed ? (
        <ActionButtonBlock contract={contract} label="Tandai Selesai" onClick={() => setCompleted(true)} variant="primary" />
      ) : (
        <div data-testid="enrichment-completion" style={{ padding: 16, borderRadius: contract.card.radius, textAlign: 'center', background: `${contract.palette.success}11`, border: `1px solid ${contract.palette.success}33`, fontSize: 16, fontWeight: 800, color: contract.palette.success }}>
          {content.completionMessage || 'Selamat! Challenge enrichment selesai.'}
        </div>
      )}
    </SceneShell>
  );
}

// ---------------------------------------------------------------------------
// 16. WorksheetActivityComposer
// ---------------------------------------------------------------------------

export function WorksheetActivityComposer({
  contract, content,
}: {
  contract: MpiDesignContract;
  content: {
    instruction?: string;
    taskSteps?: { id: string; prompt: string; responsePlaceholder?: string }[];
    inputFields?: { id: string; label: string; placeholder?: string }[];
  };
}) {
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const steps = content.taskSteps || [];
  const fields = content.inputFields || [];
  const completedCount = Object.values(checklist).filter(Boolean).length;

  return (
    <SceneShell contract={contract} className="silse-scene-worksheet-activity">
      <SceneHeader contract={contract} chipIcon="📝" chipLabel="LKPD" chipColor={contract.palette.success} title="Worksheet Activity" />
      {content.instruction && (
        <div style={{ fontSize: 14, lineHeight: 1.6, color: contract.palette.text, padding: '8px 12px', background: `${contract.palette.success}11`, borderRadius: 10 }}>{content.instruction}</div>
      )}
      <div className="silse-worksheet-checklist" data-testid="worksheet-checklist" style={{ fontSize: 13, fontWeight: 700, color: contract.palette.gold }}>
        ✓ Selesai: {completedCount} / {steps.length}
      </div>
      {steps.map((step, si) => (
        <div key={step.id} className="silse-worksheet-question" data-testid={`worksheet-step-${step.id}`} style={{ padding: 14, borderRadius: contract.card.radius, background: contract.card.background, border: checklist[step.id] ? `2px solid ${contract.palette.success}` : contract.card.border }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
            <button
              data-testid={`worksheet-check-${step.id}`}
              onClick={() => setChecklist({ ...checklist, [step.id]: !checklist[step.id] })}
              style={{ width: 24, height: 24, minHeight: 24, borderRadius: 6, border: `2px solid ${contract.palette.success}`, background: checklist[step.id] ? contract.palette.success : 'transparent', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 800, flexShrink: 0, display: 'grid', placeItems: 'center' }}
            >{checklist[step.id] ? '✓' : ''}</button>
            <span style={{ fontSize: 14, fontWeight: 700, color: contract.palette.text }}>{si + 1}. {step.prompt}</span>
          </div>
          <textarea
            className="silse-worksheet-response"
            data-testid={`worksheet-response-${step.id}`}
            placeholder={step.responsePlaceholder || 'Tulis jawabanmu...'}
            style={{ width: '100%', minHeight: 50, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)', fontSize: 13, color: contract.palette.text, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>
      ))}
      {fields.length > 0 && (
        <ScenePanel contract={contract} title="Input Fields">
          <SceneGrid contract={contract} columns="repeat(auto-fill, minmax(240px, 1fr))" gap={8}>
            {fields.map((f) => (
              <div key={f.id}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: contract.palette.mutedText, marginBottom: 3 }}>{f.label}</label>
                <input type="text" placeholder={f.placeholder || ''} style={{ width: '100%', padding: '6px 8px', border: `1px solid ${contract.palette.border}`, borderRadius: 6, fontSize: 13, background: 'rgba(255,255,255,0.04)', color: contract.palette.text, boxSizing: 'border-box' }} />
              </div>
            ))}
          </SceneGrid>
        </ScenePanel>
      )}
    </SceneShell>
  );
}

// ---------------------------------------------------------------------------
// 17. RubricPanelComposer
// ---------------------------------------------------------------------------

export function RubricPanelComposer({
  contract, content,
}: {
  contract: MpiDesignContract;
  content: {
    criteria?: { id: string; name: string; description: string }[];
    levels?: { id: string; name: string; score: number; descriptor: string }[];
    scoreGuide?: string;
  };
}) {
  const criteria = content.criteria || [];
  const levels = content.levels || [];
  return (
    <SceneShell contract={contract} className="silse-scene-rubric-panel">
      <SceneHeader contract={contract} chipIcon="📊" chipLabel="Rubrik" chipColor={contract.palette.gold} title="Rubrik Penilaian" />
      {content.scoreGuide && (
        <div className="silse-rubric-score-guide" style={{ padding: 12, borderRadius: 10, background: `${contract.palette.gold}0A`, border: `1px solid ${contract.palette.gold}33`, fontSize: 14, color: contract.palette.text }}>📋 {content.scoreGuide}</div>
      )}
      {levels.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {levels.map((l) => (
            <div key={l.id} className="silse-rubric-level" data-testid={`rubric-level-${l.id}`} style={{ padding: '8px 14px', borderRadius: 999, background: `${contract.palette.gold}11`, border: `1px solid ${contract.palette.gold}33`, textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: contract.palette.gold }}>{l.name}</div>
              <div style={{ fontSize: 11, color: contract.palette.mutedText }}>Skor: {l.score}</div>
            </div>
          ))}
        </div>
      )}
      {criteria.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {criteria.map((c) => (
            <div key={c.id} className="silse-rubric-criterion" data-testid={`rubric-criterion-${c.id}`} style={{ padding: 14, borderRadius: contract.card.radius, background: contract.card.background, border: contract.card.border }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: contract.palette.text }}>{c.name}</span>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: contract.palette.mutedText }}>{c.description}</div>
              {levels.length > 0 && (
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {levels.map((l) => (
                    <span key={l.id} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', color: contract.palette.mutedText }}>{l.name}: {l.descriptor}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </SceneShell>
  );
}

// ===========================================================================
// PERFECT-MPI-RENDER-COMPLETE-02: 5 narrative/guidance scene composers
// ===========================================================================

// ---------------------------------------------------------------------------
// 18. TimelineStoryComposer
// ---------------------------------------------------------------------------

export function TimelineStoryComposer({
  contract, content,
}: {
  contract: MpiDesignContract;
  content: {
    title?: string;
    events?: { id: string; label: string; description: string }[];
    checkpointQuestion?: string;
    checkpointAnswer?: string;
  };
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [showCheckpoint, setShowCheckpoint] = useState(false);
  const [checkpointInput, setCheckpointInput] = useState('');
  const [checkpointFeedback, setCheckpointFeedback] = useState<{ correct: boolean; text: string } | null>(null);
  const events = content.events || [];

  const handleCheck = () => {
    const isCorrect = checkpointInput.trim().toLowerCase().includes((content.checkpointAnswer || '').trim().toLowerCase());
    if (isCorrect) {
      setCheckpointFeedback({ correct: true, text: 'Benar! Jawabanmu tepat — kamu memahami alur cerita dengan baik.' });
    } else {
      setCheckpointFeedback({ correct: false, text: `Belum tepat. Pikirkan kembali: kunci jawaban mengandung kata "${(content.checkpointAnswer || '').split(' ').slice(0, 2).join(' ')}..."` });
    }
  };

  return (
    <SceneShell contract={contract} className="silse-scene-timeline-story">
      <SceneHeader contract={contract} chipIcon="📜" chipLabel="Timeline" chipColor={contract.palette.secondary} title={content.title || 'Timeline Story'} />
      <div className="silse-timeline-track" style={{ display: 'flex', alignItems: 'center', gap: 4, overflowX: 'auto', padding: '8px 0' }}>
        {events.map((event, i) => (
          <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <button
              data-testid={`timeline-step-${event.id}`}
              data-event-id={event.id}
              onClick={() => { setActiveStep(i); setShowCheckpoint(false); setCheckpointFeedback(null); }}
              style={{
                width: 32, height: 32, minHeight: 32, borderRadius: '50%',
                border: i === activeStep ? `3px solid ${contract.palette.gold}` : `2px solid ${contract.palette.mutedText}`,
                background: i === activeStep ? contract.palette.gold : i < activeStep ? contract.palette.success : 'transparent',
                color: i === activeStep ? contract.palette.primary : contract.palette.text,
                fontWeight: 800, cursor: 'pointer', fontSize: 13, flexShrink: 0,
              }}
            >{i + 1}</button>
            {i < events.length - 1 && <div style={{ width: 20, height: 2, background: contract.palette.mutedText, flexShrink: 0 }} />}
          </div>
        ))}
      </div>
      {events[activeStep] && (
        <div className="silse-timeline-event" data-testid="timeline-event-detail" style={{ padding: 16, borderRadius: contract.card.radius, background: contract.card.background, border: contract.card.border }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: contract.palette.gold, marginBottom: 8 }}>{events[activeStep].label}</div>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: contract.palette.text }}>{events[activeStep].description}</div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button data-testid="timeline-prev" onClick={() => setActiveStep(Math.max(0, activeStep - 1))} disabled={activeStep === 0} style={{ padding: '8px 16px', minHeight: 44, borderRadius: 999, border: 'none', background: activeStep === 0 ? 'rgba(255,255,255,0.08)' : contract.palette.primary, color: '#fff', fontWeight: 700, cursor: activeStep === 0 ? 'not-allowed' : 'pointer' }}>← Prev</button>
        <button data-testid="timeline-next" onClick={() => setActiveStep(Math.min(events.length - 1, activeStep + 1))} disabled={activeStep === events.length - 1} style={{ padding: '8px 16px', minHeight: 44, borderRadius: 999, border: 'none', background: activeStep === events.length - 1 ? 'rgba(255,255,255,0.08)' : contract.palette.primary, color: '#fff', fontWeight: 700, cursor: activeStep === events.length - 1 ? 'not-allowed' : 'pointer' }}>Next →</button>
        {content.checkpointQuestion && activeStep === events.length - 1 && (
          <button data-testid="timeline-checkpoint" onClick={() => setShowCheckpoint(!showCheckpoint)} style={{ padding: '8px 16px', minHeight: 44, borderRadius: 999, border: 'none', background: contract.palette.gold, color: contract.palette.primary, fontWeight: 700, cursor: 'pointer' }}> checkpoint?</button>
        )}
      </div>
      {showCheckpoint && content.checkpointQuestion && (
        <div data-testid="timeline-checkpoint-panel" style={{ padding: 16, borderRadius: contract.card.radius, background: `${contract.palette.gold}0A`, border: `1px solid ${contract.palette.gold}33` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: contract.palette.text, marginBottom: 8 }}>❓ {content.checkpointQuestion}</div>
          <textarea data-testid="timeline-checkpoint-input" value={checkpointInput} onChange={(e) => { setCheckpointInput(e.target.value); setCheckpointFeedback(null); }} placeholder="Tulis jawabanmu..." style={{ width: '100%', minHeight: 50, padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)', color: contract.palette.text, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
          <button data-testid="timeline-checkpoint-check" onClick={handleCheck} style={{ marginTop: 8, padding: '8px 16px', minHeight: 44, borderRadius: 999, border: 'none', background: contract.palette.success, color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Periksa</button>
          {checkpointFeedback && (
            <div data-testid="timeline-checkpoint-feedback" style={{ marginTop: 8, padding: 10, borderRadius: 8, fontSize: 14, fontWeight: 700, background: checkpointFeedback.correct ? `${contract.palette.success}11` : `${contract.palette.danger}11`, color: checkpointFeedback.correct ? contract.palette.success : contract.palette.danger }}>{checkpointFeedback.text}</div>
          )}
        </div>
      )}
    </SceneShell>
  );
}

// ---------------------------------------------------------------------------
// 19. BranchingScenarioComposer
// ---------------------------------------------------------------------------

export function BranchingScenarioComposer({
  contract, content, layout,
}: {
  contract: MpiDesignContract;
  content: {
    scenarioPrompt?: string;
    choices?: { id: string; label: string; consequence: string; isCorrect?: boolean }[];
    resetLabel?: string;
  };
  layout?: { columns?: number; arrangement?: string; orientation?: 'horizontal' | 'vertical'; regions?: Record<string, string> };
}) {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const choices = content.choices || [];
  const selected = choices.find((c) => c.id === selectedChoice);

  // DYNAMIC-LAYOUT: default regions untuk branching scenario
  const defaultRegions = {
    header: 'full',
    prompt: 'full',
    choices: 'left',
    consequence: 'right',
    reset: 'full',
  };
  const mergedLayout = layout
    ? { ...layout, regions: { ...defaultRegions, ...(layout.regions ?? {}) } }
    : undefined;

  return (
    <SceneShell contract={contract} className="silse-scene-branching-scenario" layout={mergedLayout}>
      <SceneHeader contract={contract} chipIcon="🌿" chipLabel="Skenario" chipColor={contract.palette.accent} title="Branching Scenario" />
      {content.scenarioPrompt && (
        <div data-region-name="prompt" className="silse-branching-prompt" data-testid="branching-prompt" style={{ padding: 16, borderRadius: contract.card.radius, background: `${contract.palette.accent}11`, border: `1px solid ${contract.palette.accent}33`, fontSize: 15, lineHeight: 1.6, color: contract.palette.text, fontWeight: 600 }}>
          {content.scenarioPrompt}
        </div>
      )}
      {!selectedChoice && (
        <div data-region-name="choices" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {choices.map((c) => (
            <button
              key={c.id}
              data-testid={`branching-choice-${c.id}`}
              data-choice-id={c.id}
              onClick={() => setSelectedChoice(c.id)}
              style={{
                textAlign: 'left', padding: '12px 16px', minHeight: 44, borderRadius: 10, cursor: 'pointer',
                border: `2px solid ${contract.palette.border}`, background: contract.card.background,
                color: contract.palette.text, fontSize: 14, fontWeight: 600,
              }}
            >{c.label}</button>
          ))}
        </div>
      )}
      {selected && (
        <div data-region-name="consequence" className="silse-branching-consequence" data-testid="branching-consequence" style={{
          padding: 16, borderRadius: contract.card.radius,
          background: selected.isCorrect ? `${contract.palette.success}11` : `${contract.palette.warning}11`,
          border: `1px solid ${selected.isCorrect ? contract.palette.success : contract.palette.warning}40`,
        }}>
          <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', color: selected.isCorrect ? contract.palette.success : contract.palette.warning, marginBottom: 8 }}>
            {selected.isCorrect ? '✓ Pilihan Tepat' : '⚠ Pertimbangkan Kembali'}
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: contract.palette.text }}>{selected.consequence}</div>
        </div>
      )}
      {selectedChoice && (
        <div data-region-name="reset">
          <ActionButtonBlock contract={contract} label={content.resetLabel || '↺ Coba Lagi'} onClick={() => setSelectedChoice(null)} variant="secondary" />
        </div>
      )}
    </SceneShell>
  );
}

// ---------------------------------------------------------------------------
// 20. GlossaryCardsComposer
// ---------------------------------------------------------------------------

export function GlossaryCardsComposer({
  contract, content,
}: {
  contract: MpiDesignContract;
  content: {
    title?: string;
    terms?: { id: string; term: string; definition: string; example?: string }[];
  };
}) {
  const [revealedTerms, setRevealedTerms] = useState<Set<string>>(new Set());
  const terms = content.terms || [];
  const toggleReveal = (id: string) => {
    const next = new Set(revealedTerms);
    if (next.has(id)) next.delete(id); else next.add(id);
    setRevealedTerms(next);
  };
  return (
    <SceneShell contract={contract} className="silse-scene-glossary-cards">
      <SceneHeader contract={contract} chipIcon="📖" chipLabel="Glosarium" chipColor={contract.palette.secondary} title={content.title || 'Glosarium'} />
      <SceneGrid contract={contract} columns="repeat(auto-fill, minmax(280px, 1fr))" gap={10}>
        {terms.map((t) => {
          const revealed = revealedTerms.has(t.id);
          return (
            <div key={t.id} className="silse-glossary-card" data-testid={`glossary-card-${t.id}`} data-term-id={t.id} onClick={() => toggleReveal(t.id)} style={{
              padding: 14, borderRadius: contract.card.radius, background: contract.card.background,
              border: `1px solid ${revealed ? contract.palette.gold : contract.palette.border}`,
              cursor: 'pointer', transition: 'border 0.2s',
            }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: contract.palette.gold, marginBottom: 6 }}>{t.term}</div>
              {revealed ? (
                <>
                  <div className="silse-glossary-definition" data-testid={`glossary-def-${t.id}`} style={{ fontSize: 13, lineHeight: 1.6, color: contract.palette.text, marginBottom: t.example ? 6 : 0 }}>{t.definition}</div>
                  {t.example && <div style={{ fontSize: 12, color: contract.palette.mutedText, fontStyle: 'italic' }}>Contoh: {t.example}</div>}
                </>
              ) : (
                <div style={{ fontSize: 13, color: contract.palette.mutedText, fontStyle: 'italic' }}>Klik untuk melihat definisi...</div>
              )}
            </div>
          );
        })}
      </SceneGrid>
    </SceneShell>
  );
}

// ---------------------------------------------------------------------------
// 21. TeacherGuideComposer
// ---------------------------------------------------------------------------

export function TeacherGuideComposer({
  contract, content,
}: {
  contract: MpiDesignContract;
  content: {
    title?: string;
    teacherInstruction?: string;
    facilitationTips?: string[];
    timeAllocation?: string;
    assessmentNotes?: string;
  };
}) {
  // L3-3: Use SceneTabs for Instruksi / Tips / Asesmen sections
  const [activeTab, setActiveTab] = useState('instruksi');
  const tabs: { id: string; label: string }[] = [];
  if (content.teacherInstruction) tabs.push({ id: 'instruksi', label: 'Instruksi' });
  if (content.facilitationTips && content.facilitationTips.length > 0) tabs.push({ id: 'tips', label: '💡 Tips' });
  if (content.assessmentNotes) tabs.push({ id: 'asesmen', label: '📝 Asesmen' });

  return (
    <SceneShell contract={contract} className="silse-scene-teacher-guide">
      <SceneHeader contract={contract} chipIcon="👨‍🏫" chipLabel="Panduan Guru" chipColor={contract.palette.accent} title={content.title || 'Panduan Guru'} />
      {content.timeAllocation && (
        <div className="silse-teacher-timing" data-testid="teacher-timing" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, background: `${contract.palette.accent}11`, border: `1px solid ${contract.palette.accent}33`, fontSize: 13, fontWeight: 700, color: contract.palette.accent }}>
          ⏱️ {content.timeAllocation}
        </div>
      )}
      {tabs.length > 0 && (
        <>
          <SceneTabs contract={contract} className="silse-teacher-tabs" tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} />
          {content.teacherInstruction && (
            <div style={{ display: activeTab === 'instruksi' ? 'block' : 'none' }}>
              <ScenePanel contract={contract} title="Instruksi Guru">
                <div style={{ fontSize: 14, lineHeight: 1.6, color: contract.palette.text }}>{content.teacherInstruction}</div>
              </ScenePanel>
            </div>
          )}
          {content.facilitationTips && content.facilitationTips.length > 0 && (
            <div className="silse-teacher-tips" style={{ display: activeTab === 'tips' ? 'block' : 'none', padding: 14, borderRadius: contract.card.radius, background: `${contract.palette.gold}0A`, border: `1px solid ${contract.palette.gold}33` }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: contract.palette.gold, marginBottom: 8 }}>💡 Tips Fasilitasi</div>
              {content.facilitationTips.map((tip, i) => (
                <div key={i} data-testid={`teacher-tip-${i}`} style={{ display: 'flex', gap: 8, padding: '4px 0', fontSize: 13, lineHeight: 1.5, color: contract.palette.text }}>
                  <span style={{ color: contract.palette.gold, fontWeight: 800 }}>{i + 1}.</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          )}
          {content.assessmentNotes && (
            <div style={{ display: activeTab === 'asesmen' ? 'block' : 'none' }}>
              <ScenePanel contract={contract} title="Catatan Asesmen">
                <div style={{ fontSize: 14, lineHeight: 1.6, color: contract.palette.text }}>{content.assessmentNotes}</div>
              </ScenePanel>
            </div>
          )}
        </>
      )}
    </SceneShell>
  );
}

// ---------------------------------------------------------------------------
// 22. AccessibilityHelpComposer
// ---------------------------------------------------------------------------

export function AccessibilityHelpComposer({
  contract, content,
}: {
  contract: MpiDesignContract;
  content: {
    title?: string;
    readingGuide?: string;
    keyboardGuide?: string;
    contrastOption?: string;
  };
}) {
  // L3-2: Use SceneAccordion for collapsible accessibility sections
  const accordionItems: { title: string; body: string }[] = [];
  if (content.readingGuide) accordionItems.push({ title: '📖 Panduan Membaca', body: content.readingGuide });
  if (content.keyboardGuide) accordionItems.push({ title: '⌨️ Panduan Keyboard/Touch', body: content.keyboardGuide });
  if (content.contrastOption) accordionItems.push({ title: '🎨 Opsi Kontras', body: content.contrastOption });

  return (
    <SceneShell contract={contract} className="silse-scene-accessibility-help">
      <SceneHeader contract={contract} chipIcon="♿" chipLabel="Aksesibilitas" chipColor={contract.palette.success} title={content.title || 'Bantuan Aksesibilitas'} />
      {accordionItems.length > 0 && (
        <SceneAccordion contract={contract} items={accordionItems} openIndex={0} />
      )}
    </SceneShell>
  );
}
