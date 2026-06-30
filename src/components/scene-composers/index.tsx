/**
 * Scene Composers for 7 priority scenes (GOLDEN-REFERENCE-RENDER-P1).
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
  SceneShell, SceneHeader, SceneChip, ScenePanel, SceneGrid, SceneTabs,
  DiscussionBanner, TimerBlock, ResponseInputBlock,
  RevealBlock, ScoreSummaryBlock, PortfolioBlock, ReflectionPromptBlock,
  ActionButtonBlock,
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
  return (
    <SceneShell contract={contract} className="silse-scene-discussion">
      <SceneHeader contract={contract} chipIcon="💬" chipLabel="Diskusi Kelompok" chipColor={contract.palette.success} title="Diskusi Kelompok" />
      <DiscussionBanner contract={contract} className="silse-discussion-banner" label="Instruksi" title={content.groupInstruction || 'Diskusikan dalam kelompok'} body={content.discussionPrompt || 'Pertanyaan diskusi'} icon="👥" accentColor={contract.palette.success} />
      <TimerBlock contract={contract} className="silse-discussion-timer" seconds={300} />
      <ResponseInputBlock contract={contract} className="silse-discussion-input" placeholder={content.responseInput || 'Tulis hasil diskusi kelompokmu...'} />
      <ActionButtonBlock contract={contract} label="Simpan Jawaban" variant="primary" />
    </SceneShell>
  );
}

// ---------------------------------------------------------------------------
// 5. CaseAnalysisComposer
// ---------------------------------------------------------------------------

export function CaseAnalysisComposer({
  contract, content,
}: {
  contract: MpiDesignContract;
  content: { caseText?: string; analysisPrompt?: string; revealExplanation?: string; discussionPrompt?: string };
}) {
  const [revealed, setRevealed] = useState(false);
  return (
    <SceneShell contract={contract} className="silse-scene-case-analysis">
      <SceneHeader contract={contract} chipIcon="🔗" chipLabel="Materi · ±15 Menit" chipColor={contract.palette.secondary} title="Analisis Kasus" />
      <ScenePanel contract={contract} className="silse-case-card" title="Kasus">
        <div style={{ fontSize: 14, lineHeight: 1.7, color: contract.palette.text }}>{content.caseText || 'Kasus'}</div>
      </ScenePanel>
      {content.analysisPrompt && (
        <ScenePanel contract={contract} title="Pertanyaan Analisis">
          <div style={{ fontSize: 15, fontWeight: 700, color: contract.palette.gold }}>{content.analysisPrompt}</div>
        </ScenePanel>
      )}
      {content.revealExplanation && (
        <RevealBlock contract={contract} className="silse-case-reveal" label="Pembahasan" text={content.revealExplanation} revealed={revealed} />
      )}
      {content.discussionPrompt && (
        <DiscussionBanner contract={contract} className="silse-case-discussion" label="Diskusi" title="Diskusikan!" body={content.discussionPrompt} icon="💬" accentColor={contract.palette.gold} />
      )}
      <ResponseInputBlock contract={contract} placeholder="Tulis analisismu..." />
      {content.revealExplanation && (
        <ActionButtonBlock contract={contract} label={revealed ? 'Sembunyikan' : 'Lihat Pembahasan'} onClick={() => setRevealed(!revealed)} />
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
  return (
    <SceneShell contract={contract} className="silse-scene-reflection-journal">
      <SceneHeader contract={contract} chipIcon="📝" chipLabel="Refleksi · ±8 Menit" chipColor={contract.palette.secondary} title="Refleksi Diri" />
      {content.portfolioSummary && content.portfolioSummary.length > 0 && (
        <PortfolioBlock contract={contract} className="silse-reflection-portfolio" title="Portofolio Diskusi" items={content.portfolioSummary} />
      )}
      <ReflectionPromptBlock contract={contract} className="silse-reflection-prompt" prompts={content.reflectionPrompts || ['Refleksikan pembelajaran hari ini']} />
      <ResponseInputBlock contract={contract} className="silse-reflection-input" placeholder={content.commitmentInput || 'Tulis komitmenmu...'} />
      {content.nextTask && (
        <ScenePanel contract={contract} className="silse-reflection-next-task" title="Tugas Pertemuan Berikutnya">
          <div style={{ fontSize: 14, lineHeight: 1.6, color: contract.palette.text }}>{content.nextTask}</div>
        </ScenePanel>
      )}
      <ActionButtonBlock contract={contract} label="Simpan Refleksi" variant="primary" />
    </SceneShell>
  );
}
