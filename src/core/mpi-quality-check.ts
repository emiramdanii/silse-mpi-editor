/**
 * MPI Quality Check for silse-mpi-editor.
 *
 * Layer: core
 * Allowed imports: ./types
 *
 * Kontrak (Batch 11B Patch + Patch-2):
 *   Cek standar MPI sebelum export.
 *   Output: { pass, errors, warnings }.
 *
 * Tabel standar wajib (Patch-2 Scope B):
 *   ┌─────────────────────────────────────────┬──────────┐
 *   │ Item                                    │ Status   │
 *   ├─────────────────────────────────────────┼──────────┤
 *   │ curriculum kosong                       │ error    │
 *   │ objectives kosong                       │ error    │
 *   │ cover tidak ada                         │ error    │
 *   │ learningObjectives tidak ada            │ error    │
 *   │ material tidak ada                      │ error    │
 *   │ guide tidak ada                         │ warning  │
 *   │ menu tidak ada                          │ warning  │
 *   │ quiz/question tidak ada                 │ warning  │
 *   │ game tidak ada                          │ warning  │
 *   │ closing tidak ada                       │ warning  │
 *   │ page activity/material/quiz tanpa nav   │ warning  │
 *   └─────────────────────────────────────────┴──────────┘
 *
 * Prinsip: bebas jalan bantu — setiap scene (kecuali closing) harus
 * punya jalan keluar (tombol navigasi). Game punya tombol internal
 * (misi berikutnya, ulangi), tetapi itu BUKAN navigasi scene.
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

  // ── ERROR: standar wajib (curriculum, objectives, cover, learningObjectives, material)

  // 1. Ada identitas kurikulum — ERROR jika kosong
  if (!project.curriculum) {
    errors.push('Identitas kurikulum belum diisi (mapel, kelas, fase, topik).');
  } else {
    if (!project.curriculum.subject) errors.push('Kurikulum: mapel belum diisi.');
    if (!project.curriculum.grade) errors.push('Kurikulum: kelas belum diisi.');
    if (!project.curriculum.phase) errors.push('Kurikulum: fase belum diisi.');
    if (!project.curriculum.topic) errors.push('Kurikulum: topik belum diisi.');
    // 2. Ada minimal 1 tujuan pembelajaran — ERROR jika kosong
    if (!project.curriculum.objectives || project.curriculum.objectives.length === 0) {
      errors.push('Kurikulum: belum ada tujuan pembelajaran.');
    }
  }

  // 3. Ada cover — ERROR
  if (!roles.includes('cover')) {
    errors.push('Belum ada halaman Cover.');
  }

  // 4. Ada learningObjectives — ERROR
  if (!roles.includes('learningObjectives')) {
    errors.push('Belum ada halaman Tujuan Pembelajaran.');
  }

  // 5. Ada material — ERROR
  if (!roles.includes('material')) {
    errors.push('Belum ada halaman Materi.');
  }

  // ── WARNING: standar fleksibel (guide, menu, quiz, game, closing)

  // 6. Ada panduan penggunaan — WARNING
  if (!roles.includes('guide')) {
    warnings.push('Belum ada halaman Panduan penggunaan MPI.');
  }

  // 7. Ada menu materi — WARNING
  if (!roles.includes('menu')) {
    warnings.push('Belum ada halaman Menu Materi.');
  }

  // 8. Ada cek pemahaman ringan atau aktivitas interaktif — WARNING
  // CONTENT-VISUAL-CONTRACT-AUDIT-01: wording tidak ujian-sentris.
  // MPI adalah media pembelajaran, bukan ujian. Quiz/game opsional.
  const hasQuiz = roles.includes('quiz') || project.pages.some((p) =>
    p.components.some((c) => c.type === 'question'),
  );
  if (!hasQuiz) {
    warnings.push('Belum ada cek pemahaman ringan (kuis/pertanyaan). Pertimbangkan menambahkan satu untuk membantu siswa menguji pemahaman.');
  }

  // 9. Ada penutup — WARNING
  if (!roles.includes('closing')) {
    warnings.push('Belum ada halaman Penutup.');
  }

  // 10. Ada minimal 1 question — WARNING (opsional, bukan wajib)
  // CONTENT-VISUAL-CONTRACT-AUDIT-01: wording tidak ujian-sentris.
  const hasQuestion = project.pages.some((p) =>
    p.components.some((c) => c.type === 'question'),
  );
  if (!hasQuestion) {
    warnings.push('Belum ada pertanyaan untuk cek pemahaman. Pertimbangkan menambahkan satu agar siswa bisa mengecek diri.');
  }

  // 11. Ada minimal 1 game/interaksi aktif — WARNING (opsional, bukan wajib)
  // CONTENT-VISUAL-CONTRACT-AUDIT-01: wording tidak ujian-sentris.
  const hasGame = project.pages.some((p) =>
    p.components.some((c) => c.type === 'game'),
  );
  if (!hasGame) {
    warnings.push('Belum ada aktivitas interaktif (game/latihan). Pertimbangkan menambahkan satu untuk membuat belajar lebih menarik.');
  }

  // 12. Feedback question/game tidak kosong — WARNING
  for (const page of project.pages) {
    for (const comp of page.components) {
      if (comp.type === 'question') {
        const q = comp as { feedbackCorrect: string; feedbackWrong: string };
        if (!q.feedbackCorrect || q.feedbackCorrect.trim().length === 0) {
          warnings.push(`Pertanyaan cek pemahaman "${(comp as { prompt?: string }).prompt ?? ''}" belum punya umpan balik benar.`);
        }
        if (!q.feedbackWrong || q.feedbackWrong.trim().length === 0) {
          warnings.push(`Pertanyaan cek pemahaman "${(comp as { prompt?: string }).prompt ?? ''}" belum punya umpan balik salah.`);
        }
      }
      if (comp.type === 'game') {
        const g = comp as { missions: { feedbackCorrect: string; feedbackWrong: string; prompt: string }[] };
        for (const m of g.missions) {
          if (!m.feedbackCorrect || m.feedbackCorrect.trim().length < 3) {
            warnings.push(`Game mission "${m.prompt}" umpan balik benar terlalu lemah.`);
          }
          if (!m.feedbackWrong || m.feedbackWrong.trim().length < 3) {
            warnings.push(`Game mission "${m.prompt}" umpan balik salah terlalu lemah.`);
          }
        }
      }
    }
  }

  // 13. Bebas jalan bantu — setiap scene material/activity/quiz punya navigasi keluar.
  //     cover: controlled page, navigasi ditangani oleh UI shell.
  //     reflection: halaman kontemplatif, ditangkap terpisah.
  //     closing: scene akhir, tidak perlu nav.
  //     Game punya tombol internal (misi berikutnya, ulangi) tetapi itu BUKAN
  //     navigasi scene — tetap wajib punya navigation component ke scene berikutnya.
  for (const page of project.pages) {
    if (page.role === 'closing' || page.role === 'reflection') continue;
    if (page.role === 'cover') continue;
    const hasNav = page.components.some((c) => c.type === 'navigation');
    if (!hasNav) {
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
