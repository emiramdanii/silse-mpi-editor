/**
 * Scoring Engine v1 (S-01) — Kelengkapan Elemen Wajib.
 *
 * Layer: core/scoring (pure function, no React/DOM)
 *
 * Kontrak:
 *   Algoritma penilaian sederhana berdasarkan checklist kelengkapan elemen
 *   wajib per scene type. Skor 0-100.
 *
 *   Cara kerja:
 *     1. Untuk setiap scene, cek apakah field wajib terisi (non-empty)
 *     2. Hitung: (field terisi / total field wajib) × 100 per scene
 *     3. Skor total = rata-rata semua scene
 *
 *   Prinsip:
 *     - Pure function, no DOM, no React, no store.
 *     - Non-blocking: return score + suggestions, tidak throw.
 *     - Guru-friendly: suggestion dalam Bahasa Indonesia.
 */

import type { SimpleProject, SimplePage } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SceneCheckItem = {
  field: string;
  label: string;
  required: boolean;
};

export type SceneCheckResult = {
  pageId: string;
  sceneType: string;
  items: Array<{ field: string; label: string; filled: boolean; required: boolean }>;
  score: number; // 0-100
  missingRequired: string[];
};

export type ProjectScoreResult = {
  totalScore: number; // 0-100
  sceneResults: SceneCheckResult[];
  suggestions: string[];
  totalItems: number;
  filledItems: number;
};

// ---------------------------------------------------------------------------
// Checklist per scene type
// ---------------------------------------------------------------------------

const SCENE_CHECKLIST: Record<string, SceneCheckItem[]> = {
  'cover-hero': [
    { field: 'heroTitle', label: 'Judul utama', required: true },
    { field: 'heroSubtitle', label: 'Subjudul', required: false },
    { field: 'kicker', label: 'Label kelas/mapel', required: false },
  ],
  'curriculum-guide': [
    { field: 'curriculumTitle', label: 'Judul kurikulum', required: true },
    { field: 'competency', label: 'Capaian pembelajaran', required: true },
  ],
  'objectives-path': [
    { field: 'objectiveList', label: 'Daftar tujuan pembelajaran', required: true },
    { field: 'successCriteria', label: 'Kriteria berhasil', required: false },
  ],
  'starter-review': [
    { field: 'priorLearning', label: 'Review pertemuan sebelumnya', required: true },
    { field: 'triggerQuestion', label: 'Pertanyaan pemicu', required: false },
  ],
  'learning-scene': [
    { field: 'explanation', label: 'Penjelasan materi', required: true },
    { field: 'keyPoints', label: 'Poin kunci', required: false },
    { field: 'examples', label: 'Contoh', required: false },
  ],
  'discussion-scene': [
    { field: 'discussionPrompt', label: 'Pertanyaan diskusi', required: true },
    { field: 'groupInstruction', label: 'Instruksi kelompok', required: false },
  ],
  'classification-game': [
    { field: 'instruction', label: 'Instruksi game', required: true },
    { field: 'items', label: 'Item sortir', required: true },
    { field: 'categories', label: 'Kategori', required: true },
  ],
  'matching-game': [
    { field: 'instruction', label: 'Instruksi game', required: true },
    { field: 'leftItems', label: 'Item kiri', required: true },
    { field: 'rightItems', label: 'Item kanan', required: true },
  ],
  'sequencing-game': [
    { field: 'instruction', label: 'Instruksi game', required: true },
    { field: 'items', label: 'Item urutan', required: true },
    { field: 'correctOrder', label: 'Urutan benar', required: true },
  ],
  'case-analysis': [
    { field: 'caseText', label: 'Teks kasus', required: true },
    { field: 'revealExplanation', label: 'Pembahasan', required: false },
  ],
  'quiz-challenge': [
    { field: 'prompt', label: 'Pertanyaan kuis', required: true },
    { field: 'choices', label: 'Pilihan jawaban', required: true },
    { field: 'correctChoiceId', label: 'Jawaban benar', required: true },
    { field: 'feedbackCorrect', label: 'Feedback benar', required: false },
    { field: 'feedbackWrong', label: 'Feedback salah', required: false },
  ],
  'diagnostic-check': [
    { field: 'diagnosticPrompt', label: 'Instruksi diagnostic', required: true },
    { field: 'questionSet', label: 'Soal diagnostic', required: true },
  ],
  'remedial-practice': [
    { field: 'misconception', label: 'Miskonsepsi', required: true },
    { field: 'reteachExplanation', label: 'Penjelasan ulang', required: true },
    { field: 'guidedPractice', label: 'Latihan terbimbing', required: true },
  ],
  'enrichment-challenge': [
    { field: 'challengeContext', label: 'Konteks tantangan', required: true },
    { field: 'advancedTask', label: 'Tugas lanjutan', required: true },
  ],
  'rubric-panel': [
    { field: 'criteria', label: 'Kriteria penilaian', required: true },
    { field: 'levels', label: 'Level penilaian', required: true },
  ],
  'result-summary': [
    { field: 'achievementLevel', label: 'Level pencapaian', required: false },
  ],
  'reflection-journal': [
    { field: 'reflectionPrompts', label: 'Pertanyaan refleksi', required: true },
  ],
  'closing-award': [
    { field: 'achievement', label: 'Pencapaian', required: true },
    { field: 'summary', label: 'Ringkasan', required: false },
  ],
  'teacher-guide': [
    { field: 'teacherInstruction', label: 'Instruksi guru', required: true },
    { field: 'timeAllocation', label: 'Alokasi waktu', required: false },
  ],
  'timeline-story': [
    { field: 'events', label: 'Event timeline', required: true },
  ],
  'branching-scenario': [
    { field: 'scenarioPrompt', label: 'Skenario', required: true },
    { field: 'choices', label: 'Pilihan', required: true },
  ],
  'glossary-cards': [
    { field: 'terms', label: 'Istilah', required: true },
  ],
  'worksheet-activity': [
    { field: 'instruction', label: 'Instruksi', required: true },
    { field: 'taskSteps', label: 'Langkah tugas', required: false },
  ],
  'accessibility-help': [
    { field: 'readingGuide', label: 'Panduan membaca', required: false },
  ],
  'hotspot-map': [
    { field: 'guidingQuestion', label: 'Pertanyaan panduan', required: true },
    { field: 'hotspots', label: 'Titik hotspot', required: false },
  ],
  'media-focus': [
    { field: 'guidingQuestion', label: 'Pertanyaan panduan', required: true },
    { field: 'mediaAsset', label: 'Media', required: false },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isFilled(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return false;
}

function getChecklistForScene(sceneType: string): SceneCheckItem[] {
  return SCENE_CHECKLIST[sceneType] || [];
}

// ---------------------------------------------------------------------------
// Score single scene
// ---------------------------------------------------------------------------

export function scoreScene(page: SimplePage): SceneCheckResult {
  const checklist = getChecklistForScene(page.sceneType || '');
  const content = (page.sceneContent || {}) as Record<string, unknown>;

  const items = checklist.map((item) => ({
    field: item.field,
    label: item.label,
    filled: isFilled(content[item.field]),
    required: item.required,
  }));

  const requiredItems = items.filter((i) => i.required);
  const filledRequired = requiredItems.filter((i) => i.filled);
  const score = requiredItems.length > 0
    ? Math.round((filledRequired.length / requiredItems.length) * 100)
    : 100;

  const missingRequired = requiredItems
    .filter((i) => !i.filled)
    .map((i) => i.label);

  return {
    pageId: page.id,
    sceneType: page.sceneType || 'unknown',
    items,
    score,
    missingRequired,
  };
}

// ---------------------------------------------------------------------------
// Score entire project
// ---------------------------------------------------------------------------

export function scoreProject(project: SimpleProject): ProjectScoreResult {
  const sceneResults = project.pages.map(scoreScene);

  const totalScore = sceneResults.length > 0
    ? Math.round(sceneResults.reduce((sum, s) => sum + s.score, 0) / sceneResults.length)
    : 0;

  const suggestions: string[] = [];
  sceneResults.forEach((result) => {
    if (result.missingRequired.length > 0) {
      suggestions.push(
        `Halaman "${result.sceneType}": ${result.missingRequired.join(', ')} belum diisi.`,
      );
    }
  });

  const allItems = sceneResults.flatMap((s) => s.items);
  const totalItems = allItems.length;
  const filledItems = allItems.filter((i) => i.filled).length;

  return { totalScore, sceneResults, suggestions, totalItems, filledItems };
}

// ---------------------------------------------------------------------------
// Score label + color (for display)
// ---------------------------------------------------------------------------

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Sangat Baik';
  if (score >= 70) return 'Baik';
  if (score >= 50) return 'Cukup';
  if (score >= 30) return 'Perlu Perbaikan';
  return 'Belum Lengkap';
}

export function getScoreColor(score: number): string {
  if (score >= 70) return '#16a34a';
  if (score >= 50) return '#f59e0b';
  return '#dc2626';
}
