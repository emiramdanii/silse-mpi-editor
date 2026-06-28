/**
 * GuidedFlowDialog — modal untuk pilih topik + generate paket MPI (GUIDED-MPI-FLOW-01).
 *
 * Layer: editor
 * Allowed imports: react, ../store/editor-store, ../core/guided-flow/*
 *
 * Kontrak:
 *   Guru klik "🎯 Paket MPI dari Topik" di Topbar → dialog muncul.
 *   Dialog menampilkan katalog topik (dikelompokkan per mapel).
 *   Guru pilih topik → klik "Generate" → engine generate 10 halaman
 *   + quality report → guru lihat skor + warning → klik "Terapkan" atau "Batal".
 */

import { useState } from 'react';
import { useEditorStore } from '../store/editor-store';
import {
  MPI_TOPIC_CATALOG,
  getUniqueMapelList,
  type MpiTopic,
} from '../core/guided-flow/mpi-topic-catalog';
import { generateMpiFromTopic, type GeneratedMpiResult } from '../core/guided-flow/generate-mpi-from-topic';

export function GuidedFlowDialog({ onClose }: { onClose: () => void }) {
  const setProject = useEditorStore((s) => s.setProject);
  const [selectedTopic, setSelectedTopic] = useState<MpiTopic | null>(null);
  const [generated, setGenerated] = useState<GeneratedMpiResult | null>(null);
  const [generating, setGenerating] = useState(false);

  const mapelList = getUniqueMapelList();

  const handleGenerate = () => {
    if (!selectedTopic) return;
    setGenerating(true);
    // Simulate async (could be real async later)
    setTimeout(() => {
      const result = generateMpiFromTopic(selectedTopic);
      setGenerated(result);
      setGenerating(false);
    }, 100);
  };

  const handleApply = () => {
    if (!generated) return;
    // GUIDED-MPI-FLOW-01 Patch-1: Guard — don't apply if quality report has errors
    if (!generated.qualityReport.ok) {
      window.alert('Draft MPI memiliki error layout. Perbaiki dulu sebelum menerapkan.');
      return;
    }
    setProject(generated.project);
    onClose();
  };

  const handleBack = () => {
    setGenerated(null);
    setSelectedTopic(null);
  };

  return (
    <div
      className="guided-flow-overlay"
      onClick={onClose}
      data-testid="guided-flow-dialog"
    >
      <div
        className="guided-flow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="guided-flow-modal__head">
          <strong>🎯 Paket MPI dari Topik</strong>
          <button onClick={onClose} title="Tutup">✕</button>
        </div>

        {!generated ? (
          <>
            <p className="guided-flow-modal__hint">
              Pilih topik pembelajaran. SILSE akan membuat draft MPI lengkap (10 halaman) dengan layout cerdas dan kualitas yang sudah dicek.
            </p>

            <div className="guided-flow-topics">
              {mapelList.map((mapel) => (
                <div key={mapel} className="guided-flow-mapel-group">
                  <div className="guided-flow-mapel-label">{mapel}</div>
                  {MPI_TOPIC_CATALOG.filter((t) => t.mapel === mapel).map((topic) => (
                    <button
                      key={topic.id}
                      className={`guided-flow-topic-card${selectedTopic?.id === topic.id ? ' is-selected' : ''}`}
                      onClick={() => setSelectedTopic(topic)}
                      data-testid={`guided-flow-topic-${topic.id}`}
                    >
                      <div className="guided-flow-topic-card__head">
                        <strong>{topic.topic}</strong>
                        <span className="guided-flow-topic-card__meta">
                          Kelas {topic.grade} · Fase {topic.phase}
                        </span>
                      </div>
                      <p className="guided-flow-topic-card__desc">{topic.description}</p>
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <div className="guided-flow-modal__actions">
              <button onClick={onClose}>Batal</button>
              <button
                onClick={handleGenerate}
                disabled={!selectedTopic || generating}
                className="primary"
                data-testid="guided-flow-generate"
              >
                {generating ? '⏳ Generating...' : '✨ Generate Paket MPI'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="guided-flow-result">
              <div className="guided-flow-result__head">
                <strong>Draft MPI: {generated.project.title}</strong>
              </div>
              <div className="guided-flow-result__stats">
                <span className="guided-flow-result__stat">
                  📄 {generated.project.pages.length} halaman
                </span>
                <span
                  className={`guided-flow-result__score${generated.qualityReport.score >= 80 ? ' is-good' : generated.qualityReport.score >= 50 ? ' is-ok' : ' is-bad'}`}
                  data-testid="guided-flow-quality-score"
                >
                  ⭐ Skor Kualitas: {generated.qualityReport.score}
                </span>
                <span className="guided-flow-result__stat">
                  ✅ {generated.qualityReport.issues.filter((i) => i.severity === 'error').length} error
                </span>
                <span className="guided-flow-result__stat">
                  ⚠️ {generated.qualityReport.issues.filter((i) => i.severity === 'warning').length} warning
                </span>
              </div>

              {generated.qualityReport.issues.length > 0 && (
                <div className="guided-flow-result__issues">
                  <strong>Catatan Kualitas Layout:</strong>
                  <ul>
                    {generated.qualityReport.issues.slice(0, 8).map((issue, idx) => (
                      <li key={idx} className={`guided-flow-issue guided-flow-issue--${issue.severity}`}>
                        {issue.severity === 'error' ? '✗' : '⚠'} {issue.message}
                      </li>
                    ))}
                    {generated.qualityReport.issues.length > 8 && (
                      <li className="guided-flow-issue">...dan {generated.qualityReport.issues.length - 8} catatan lainnya</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="guided-flow-result__pages">
                <strong>Struktur Halaman:</strong>
                <ol>
                  {generated.project.pages.map((page, idx) => (
                    <li key={page.id}>
                      <span>{idx + 1}. {page.title}</span>
                      <span className="guided-flow-result__page-role"> ({page.role})</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="guided-flow-modal__actions">
              <button onClick={handleBack}>← Pilih Topik Lain</button>
              <button
                onClick={handleApply}
                className="primary"
                disabled={!generated.qualityReport.ok}
                title={generated.qualityReport.ok ? 'Terapkan draft MPI ke editor' : 'Tidak bisa menerapkan — ada error layout'}
                data-testid="guided-flow-apply"
              >
                {generated.qualityReport.ok ? '✓ Terapkan Draft MPI' : '✗ Ada Error Layout'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
