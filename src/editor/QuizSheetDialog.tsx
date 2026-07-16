/**
 * QuizSheetDialog — V2-PILAR-2.5 Centralized Quiz Sheet.
 *
 * Layer: editor
 *
 * Modal dialog yang menampilkan semua komponen scoring (Question, Game,
 * InputField dengan correctAnswer) dari seluruh project.pages dalam satu
 * tabel hibrida:
 *   - Kolom Prompt/Label: read-only, klik untuk lompat ke slide + sorot komponen
 *   - Kolom Jawaban Benar: editable (text input)
 *   - Kolom Poin: editable (text input dengan regex filter + clamp 1-100)
 *
 * Perubahan langsung apply ke store via bulkUpdateScoringComponents.
 */

import { useState, useMemo, useEffect } from 'react';
import { useEditorStore } from '../store/editor-store';
import {
  collectScoringComponents,
  sanitizePointsInput,
  type ScoringComponentEntry,
} from '../core/project-factory';

const TYPE_LABELS: Record<ScoringComponentEntry['componentType'], string> = {
  'question': 'Pilihan Ganda',
  'game': 'Game Misi',
  'input-field': 'Input Jawaban',
};

const TYPE_ICONS: Record<ScoringComponentEntry['componentType'], string> = {
  'question': '❓',
  'game': '🎮',
  'input-field': '✏️',
};

export function QuizSheetDialog({ onClose }: { onClose: () => void }) {
  const project = useEditorStore((s) => s.project);
  const bulkUpdateScoringComponents = useEditorStore((s) => s.bulkUpdateScoringComponents);
  const selectPage = useEditorStore((s) => s.selectPage);
  const selectComponent = useEditorStore((s) => s.selectComponent);

  // MEGA FIX #4: Escape key handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Collect entries dari project (memoized — recompute saat project berubah)
  const entries = useMemo(() => collectScoringComponents(project), [project]);

  // Local state untuk editable cells — key by componentId
  // Format: { [componentId]: { correctAnswer: string, points: string } }
  const [editState, setEditState] = useState<Record<string, { correctAnswer: string; points: string }>>({});

  // Inisialisasi editState dari entries
  const getEditValue = (entry: ScoringComponentEntry) => {
    if (!editState[entry.componentId]) {
      return {
        correctAnswer: entry.correctAnswer,
        points: String(entry.points),
      };
    }
    return editState[entry.componentId];
  };

  const handleCorrectAnswerChange = (componentId: string, value: string) => {
    setEditState((prev) => ({
      ...prev,
      [componentId]: {
        ...(prev[componentId] ?? { correctAnswer: '', points: '' }),
        correctAnswer: value,
      },
    }));
    // Apply ke store langsung (real-time)
    bulkUpdateScoringComponents([{
      componentId,
      componentType: entries.find((e) => e.componentId === componentId)!.componentType,
      correctAnswer: value,
    }]);
  };

  const handlePointsChange = (componentId: string, value: string) => {
    // Lapis 1: regex filter non-digit di onChange
    const filtered = value.replace(/[^0-9]/g, '');
    setEditState((prev) => ({
      ...prev,
      [componentId]: {
        ...(prev[componentId] ?? { correctAnswer: '', points: '' }),
        points: filtered,
      },
    }));
  };

  const handlePointsBlur = (componentId: string, componentType: ScoringComponentEntry['componentType']) => {
    const current = editState[componentId];
    if (!current) return;
    // Lapis 2: clamp 1-100 di onBlur
    const clamped = sanitizePointsInput(current.points);
    // Update local state dengan clamped value
    setEditState((prev) => ({
      ...prev,
      [componentId]: {
        ...prev[componentId],
        points: String(clamped),
      },
    }));
    // Apply ke store
    bulkUpdateScoringComponents([{
      componentId,
      componentType,
      points: clamped,
    }]);
  };

  const handleRowClick = (entry: ScoringComponentEntry) => {
    // Lompat ke slide + sorot komponen, lalu tutup dialog
    selectPage(entry.pageId);
    selectComponent(entry.componentId);
    onClose();
  };

  // Stats
  const totalPoints = entries.reduce((sum, e) => sum + e.points, 0);
  const questionCount = entries.filter((e) => e.componentType === 'question').length;
  const gameCount = entries.filter((e) => e.componentType === 'game').length;
  const inputCount = entries.filter((e) => e.componentType === 'input-field').length;

  return (
    <div
      className="quiz-sheet-overlay"
      data-testid="quiz-sheet-overlay"
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="quiz-sheet-dialog"
        data-testid="quiz-sheet-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-panel, #ffffff)',
          borderRadius: 16, padding: 24, maxWidth: '90vw', width: '900px',
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <h2 style={{ margin: '0 0 8px 0', fontSize: 20, color: 'var(--color-text, #1f2533)' }}>
          📊 Kelola Kuis — Centralized Quiz Sheet
        </h2>
        <p style={{ margin: '0 0 16px 0', fontSize: 13, color: 'var(--color-muted, #8a8775)' }}>
          {entries.length} komponen evaluasi • {questionCount} pilihan ganda • {gameCount} game • {inputCount} input • Total {totalPoints} poin
        </p>

        {entries.length === 0 ? (
          <div
            data-testid="quiz-sheet-empty"
            style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-muted, #8a8775)' }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Belum ada komponen evaluasi</div>
            <div style={{ fontSize: 13 }}>
              Tambahkan elemen Pertanyaan, Game, atau Input Jawaban (dengan kunci jawaban) ke slide untuk mengelolanya di sini.
            </div>
          </div>
        ) : (
          <table
            data-testid="quiz-sheet-table"
            style={{
              width: '100%', borderCollapse: 'collapse', fontSize: 13,
              tableLayout: 'fixed',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border, #e3ddcd)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', width: '40%', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-muted, #8a8775)' }}>
                  Pertanyaan / Label
                </th>
                <th style={{ padding: '8px 12px', textAlign: 'left', width: '15%', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-muted, #8a8775)' }}>
                  Tipe
                </th>
                <th style={{ padding: '8px 12px', textAlign: 'left', width: '30%', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-muted, #8a8775)' }}>
                  Jawaban Benar
                </th>
                <th style={{ padding: '8px 12px', textAlign: 'center', width: '15%', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-muted, #8a8775)' }}>
                  Poin
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => {
                const editVal = getEditValue(entry);
                return (
                  <tr
                    key={entry.componentId}
                    data-testid={`quiz-sheet-row-${idx}`}
                    style={{ borderBottom: '1px solid var(--color-border, #e3ddcd)' }}
                  >
                    {/* Prompt — read-only, klik untuk lompat */}
                    <td
                      data-testid={`quiz-sheet-prompt-${idx}`}
                      onClick={() => handleRowClick(entry)}
                      style={{
                        padding: '8px 12px', cursor: 'pointer',
                        color: 'var(--color-text, #1f2533)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                      title={`Klik untuk ke "${entry.pageTitle}" dan sorot komponen ini`}
                    >
                      <span style={{ fontSize: 11, color: 'var(--color-muted, #8a8775)', marginRight: 6 }}>
                        {entry.pageTitle}
                      </span>
                      <br />
                      <span style={{ fontSize: 13 }}>{entry.prompt}</span>
                    </td>

                    {/* Tipe — read-only */}
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted, #8a8775)' }}>
                        {TYPE_ICONS[entry.componentType]} {TYPE_LABELS[entry.componentType]}
                      </span>
                    </td>

                    {/* Jawaban Benar — editable */}
                    <td style={{ padding: '8px 12px' }}>
                      <input
                        type="text"
                        data-testid={`quiz-sheet-answer-${idx}`}
                        value={editVal.correctAnswer}
                        onChange={(e) => handleCorrectAnswerChange(entry.componentId, e.target.value)}
                        style={{
                          width: '100%', padding: '4px 8px', fontSize: 13,
                          border: '1px solid var(--color-border, #e3ddcd)',
                          borderRadius: 4, boxSizing: 'border-box',
                          background: 'var(--color-panel-soft, #fbfaf7)',
                        }}
                        placeholder="Ketik jawaban benar..."
                      />
                    </td>

                    {/* Poin — editable dengan regex filter + clamp */}
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <input
                        type="text"
                        data-testid={`quiz-sheet-points-${idx}`}
                        value={editVal.points}
                        onChange={(e) => handlePointsChange(entry.componentId, e.target.value)}
                        onBlur={() => handlePointsBlur(entry.componentId, entry.componentType)}
                        style={{
                          width: 60, padding: '4px 8px', fontSize: 13, textAlign: 'center',
                          border: '1px solid var(--color-border, #e3ddcd)',
                          borderRadius: 4,
                          background: 'var(--color-panel-soft, #fbfaf7)',
                        }}
                        maxLength={3}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20, gap: 8 }}>
          <button
            type="button"
            onClick={onClose}
            data-testid="quiz-sheet-close"
            style={{
              padding: '10px 20px', borderRadius: 10, border: 'none',
              background: 'var(--color-accent, #1e5b8f)', color: '#ffffff',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
            autoFocus
          >
            ✓ Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
