/**
 * MPI Quality Check for silse-mpi-editor.
 *
 * Layer: core
 * Allowed imports: ./types
 *
 * Kontrak (Batch 11B Patch):
 *   Cek standar MPI sebelum export.
 *   Output: { pass, errors, warnings }.
 */

import type { SimpleProject } from './types';

export type QualityCheckResult = {
  pass: boolean;
  errors: string[];
  warnings: string[];
};

export function checkMpiStandard(project: SimpleProject): QualityCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const roles = project.pages.map((p) => p.role);

  // 1. Ada identitas kurikulum
  if (!project.curriculum) {
    errors.push('Identitas kurikulum belum diisi (mapel, kelas, fase, topik).');
  } else {
    if (!project.curriculum.subject) errors.push('Kurikulum: mapel belum diisi.');
    if (!project.curriculum.grade) errors.push('Kurikulum: kelas belum diisi.');
    if (!project.curriculum.phase) errors.push('Kurikulum: fase belum diisi.');
    if (!project.curriculum.topic) errors.push('Kurikulum: topik belum diisi.');
    // 2. Ada minimal 1 tujuan pembelajaran
    if (!project.curriculum.objectives || project.curriculum.objectives.length === 0) {
      errors.push('Kurikulum: belum ada tujuan pembelajaran.');
    }
  }

  // 3. Ada cover
  if (!roles.includes('cover')) {
    errors.push('Belum ada halaman Cover.');
  }

  // 4. Ada panduan penggunaan
  if (!roles.includes('guide')) {
    warnings.push('Belum ada halaman Panduan penggunaan MPI.');
  }

  // 5. Ada tujuan pembelajaran
  if (!roles.includes('learningObjectives')) {
    errors.push('Belum ada halaman Tujuan Pembelajaran.');
  }

  // 6. Ada menu materi
  if (!roles.includes('menu')) {
    warnings.push('Belum ada halaman Menu Materi.');
  }

  // 7. Ada materi
  if (!roles.includes('material')) {
    errors.push('Belum ada halaman Materi.');
  }

  // 8. Ada kuis/evaluasi
  const hasQuiz = roles.includes('quiz') || project.pages.some((p) =>
    p.components.some((c) => c.type === 'question'),
  );
  if (!hasQuiz) {
    warnings.push('Belum ada halaman Kuis atau Question component.');
  }

  // 9. Ada penutup
  if (!roles.includes('closing')) {
    warnings.push('Belum ada halaman Penutup.');
  }

  // 10. Ada minimal 1 question
  const hasQuestion = project.pages.some((p) =>
    p.components.some((c) => c.type === 'question'),
  );
  if (!hasQuestion) {
    warnings.push('Belum ada Question component di project ini.');
  }

  // 11. Ada minimal 1 game/interaksi aktif
  const hasGame = project.pages.some((p) =>
    p.components.some((c) => c.type === 'game'),
  );
  if (!hasGame) {
    warnings.push('Belum ada Game component di project ini.');
  }

  // 12. Feedback question/game tidak kosong
  for (const page of project.pages) {
    for (const comp of page.components) {
      if (comp.type === 'question') {
        const q = comp as { feedbackCorrect: string; feedbackWrong: string };
        if (!q.feedbackCorrect || q.feedbackCorrect.trim().length === 0) {
          warnings.push(`Question "${(comp as { prompt?: string }).prompt ?? ''}" belum punya feedback benar.`);
        }
        if (!q.feedbackWrong || q.feedbackWrong.trim().length === 0) {
          warnings.push(`Question "${(comp as { prompt?: string }).prompt ?? ''}" belum punya feedback salah.`);
        }
      }
      if (comp.type === 'game') {
        const g = comp as { missions: { feedbackCorrect: string; feedbackWrong: string; prompt: string }[] };
        for (const m of g.missions) {
          if (!m.feedbackCorrect || m.feedbackCorrect.trim().length < 3) {
            warnings.push(`Game mission "${m.prompt}" feedback benar terlalu lemah.`);
          }
          if (!m.feedbackWrong || m.feedbackWrong.trim().length < 3) {
            warnings.push(`Game mission "${m.prompt}" feedback salah terlalu lemah.`);
          }
        }
      }
    }
  }

  // 13. Tiap halaman punya navigasi atau jalan keluar
  for (const page of project.pages) {
    if (page.role === 'closing' || page.role === 'reflection') continue;
    const hasNav = page.components.some((c) => c.type === 'navigation');
    if (!hasNav && page.role !== 'cover') {
      // Only warn for material/activity/quiz — they should have navigation
      if (page.role === 'material' || page.role === 'activity' || page.role === 'quiz') {
        warnings.push(`Halaman "${page.title}" (${page.role}) belum punya tombol navigasi.`);
      }
    }
  }

  return {
    pass: errors.length === 0,
    errors,
    warnings,
  };
}
