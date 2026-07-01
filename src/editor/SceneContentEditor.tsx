/**
 * SceneContentEditor V1 — CORE-MPI-UX-FOUNDATION-01
 *
 * Editor sederhana untuk page.sceneContent.
 * Mendeteksi page.sceneType dan menampilkan field penting yang bisa diedit.
 * V1: hanya text field umum (title, prompt, instruction, explanation, dll).
 * Add/remove untuk list field boleh ditunda ke V2.
 */

import { useEditorStore } from '../store/editor-store';
import type { SimplePage } from '../core/types';

// Field definitions per sceneType — only text fields that are safe to edit in V1.
const SCENE_CONTENT_FIELDS: Record<string, Array<{ key: string; label: string; type: 'text' | 'textarea' }>> = {
  'cover-hero': [
    { key: 'heroTitle', label: 'Judul Hero', type: 'text' },
    { key: 'heroSubtitle', label: 'Subtitle', type: 'text' },
    { key: 'kicker', label: 'Kicker', type: 'text' },
    { key: 'visualAnchor', label: 'Visual Anchor', type: 'textarea' },
  ],
  'curriculum-guide': [
    { key: 'curriculumTitle', label: 'Judul Kurikulum', type: 'text' },
    { key: 'competency', label: 'Capaian Pembelajaran', type: 'textarea' },
    { key: 'learningFlow', label: 'Alur Pembelajaran', type: 'textarea' },
  ],
  'objectives-path': [
    { key: 'successCriteria', label: 'Kriteria Berhasil', type: 'textarea' },
  ],
  'starter-review': [
    { key: 'priorLearning', label: 'Pembelajaran Sebelumnya', type: 'textarea' },
    { key: 'triggerQuestion', label: 'Pertanyaan Pemantik', type: 'textarea' },
    { key: 'bridgeToNewTopic', label: 'Jembatan ke Topik Baru', type: 'textarea' },
    { key: 'discussionPrompt', label: 'Prompt Diskusi', type: 'textarea' },
  ],
  'learning-scene': [
    { key: 'conceptTitle', label: 'Judul Konsep', type: 'text' },
    { key: 'conceptSubtitle', label: 'Subtitle Konsep', type: 'text' },
    { key: 'explanation', label: 'Penjelasan', type: 'textarea' },
    { key: 'studentAction', label: 'Aksi Siswa', type: 'textarea' },
    { key: 'visualHint', label: 'Petunjuk Visual', type: 'textarea' },
  ],
  'discussion-scene': [
    { key: 'discussionPrompt', label: 'Prompt Diskusi', type: 'textarea' },
    { key: 'groupInstruction', label: 'Instruksi Kelompok', type: 'textarea' },
    { key: 'responseInput', label: 'Placeholder Input', type: 'text' },
  ],
  'classification-game': [
    { key: 'instruction', label: 'Instruksi Game', type: 'textarea' },
    { key: 'completionMessage', label: 'Pesan Selesai', type: 'textarea' },
  ],
  'case-analysis': [
    { key: 'caseText', label: 'Teks Kasus', type: 'textarea' },
    { key: 'analysisPrompt', label: 'Prompt Analisis', type: 'textarea' },
    { key: 'revealExplanation', label: 'Pembahasan', type: 'textarea' },
    { key: 'discussionPrompt', label: 'Prompt Diskusi', type: 'textarea' },
  ],
  'quiz-challenge': [
    { key: 'prompt', label: 'Pertanyaan', type: 'textarea' },
    { key: 'feedbackCorrect', label: 'Feedback Benar', type: 'textarea' },
    { key: 'feedbackWrong', label: 'Feedback Salah', type: 'textarea' },
  ],
  'result-summary': [
    { key: 'achievementLevel', label: 'Level Pencapaian', type: 'text' },
  ],
  'reflection-journal': [
    { key: 'commitmentInput', label: 'Placeholder Komitmen', type: 'text' },
    { key: 'nextTask', label: 'Tugas Selanjutnya', type: 'textarea' },
  ],
  'closing-award': [
    { key: 'achievement', label: 'Pencapaian', type: 'text' },
    { key: 'summary', label: 'Ringkasan', type: 'textarea' },
    { key: 'reflectionPrompt', label: 'Prompt Refleksi', type: 'textarea' },
    { key: 'rewardLabel', label: 'Label Reward', type: 'text' },
    { key: 'nextLearning', label: 'Pembelajaran Selanjutnya', type: 'textarea' },
  ],
};

export function SceneContentEditor({ page }: { page: SimplePage }) {
  const updateSceneContent = useEditorStore((s) => s.updateSceneContent);
  if (!page.sceneType || !page.sceneContent) return null;

  const fields = SCENE_CONTENT_FIELDS[page.sceneType];
  if (!fields || fields.length === 0) return null;

  const content = page.sceneContent as Record<string, unknown>;

  return (
    <div className="scene-content-editor" data-testid="scene-content-editor">
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#6b7280', marginBottom: 8 }}>
        🎬 Scene Content · {page.sceneType}
      </div>
      {fields.map((field) => {
        const value = (content[field.key] as string) ?? '';
        return (
          <div key={field.key} style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 3 }}>
              {field.label}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                data-testid={`scene-field-${field.key}`}
                value={value}
                onChange={(e) => updateSceneContent(page.id, { [field.key]: e.target.value })}
                style={{
                  width: '100%', minHeight: 60, padding: '6px 8px',
                  border: '1px solid #d1d5db', borderRadius: 6,
                  fontSize: 13, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
                }}
              />
            ) : (
              <input
                type="text"
                data-testid={`scene-field-${field.key}`}
                value={value}
                onChange={(e) => updateSceneContent(page.id, { [field.key]: e.target.value })}
                style={{
                  width: '100%', padding: '6px 8px',
                  border: '1px solid #d1d5db', borderRadius: 6,
                  fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

