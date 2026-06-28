/**
 * Sample project: PPKn "Hidup Tertib dengan Norma"
 *
 * Batch 11B Patch — MPI Standard + Curriculum Alignment.
 * Batch 11B Patch-2 — Sample Navigation Completion (bebas jalan bantu).
 * Contoh MPI standar: Cover → Panduan → Tujuan → Menu → Pemantik → Materi → Quiz → Game → Refleksi → Penutup
 *
 * Prinsip: setiap scene (kecuali closing) punya jalan keluar — tombol navigasi
 * ke scene berikutnya. Game punya tombol internal (misi berikutnya, ulangi),
 * tetapi setelah selesai tetap perlu navigasi scene ke Refleksi.
 */

import type { SimpleProject, CurriculumObjective } from './types';
import { createProjectId, createPageId, createComponentId } from './ids';
import { PROJECT_VERSION } from './types';
import { DEFAULT_STYLE_PACK, stylePackToProjectStyle } from './style-presets';

export function createSamplePpknProject(): SimpleProject {
  const coverId = createPageId();
  const guideId = createPageId();
  const tujuanId = createPageId();
  const menuId = createPageId();
  const pemantikId = createPageId();
  const materiId = createPageId();
  const quizId = createPageId();
  const gameId = createPageId();
  const refleksiId = createPageId();
  const penutupId = createPageId();

  const objectives: CurriculumObjective[] = [
    { id: createComponentId(), text: 'Menjelaskan pengertian norma dalam kehidupan sehari-hari.' },
    { id: createComponentId(), text: 'Mengidentifikasi jenis-jenis norma yang berlaku di masyarakat.' },
    { id: createComponentId(), text: 'Menunjukkan sikap tertib dalam menjalankan norma.' },
  ];

  const objText = objectives.map((o, i) => `${i + 1}. ${o.text}`).join('\n');

  return {
    id: createProjectId(),
    title: 'PPKn — Hidup Tertib dengan Norma',
    version: PROJECT_VERSION,
    currentPageId: coverId,
    stylePackId: DEFAULT_STYLE_PACK.id,
    style: stylePackToProjectStyle(DEFAULT_STYLE_PACK),
    curriculum: {
      subject: 'PPKn',
      grade: '7',
      phase: 'D',
      topic: 'Hidup Tertib dengan Norma',
      objectives,
    },
    pages: [
      // 1. Cover
      {
        id: coverId, title: 'Cover', role: 'cover', layoutId: 'coverCentered',
        background: { type: 'color', color: '#1e3a5f' },
        components: [
          { id: createComponentId(), type: 'text', text: 'Hidup Tertib dengan Norma', variant: 'title', x: 140, y: 280, width: 1000, height: 120 },
          { id: createComponentId(), type: 'text', text: 'PPKn — Kelas 7 — Fase D', variant: 'subtitle', x: 340, y: 420, width: 600, height: 60 },
        ],
      },
      // 2. Panduan
      {
        id: guideId, title: 'Panduan', role: 'guide', layoutId: 'blank',
        background: { type: 'color', color: '#ffffff' },
        components: [
          { id: createComponentId(), type: 'text', text: 'Panduan Penggunaan', variant: 'title', x: 80, y: 40, width: 1120, height: 60 },
          { id: createComponentId(), type: 'card', variant: 'infoCard', title: 'Cara Belajar', body: '1. Baca tujuan pembelajaran di halaman berikutnya.\n2. Pelajari materi pada halaman Materi.\n3. Kerjakan Kuis untuk menguji pemahaman.\n4. Mainkan Game Misi untuk latihan.\n5. Tulis refleksi di halaman Refleksi.\n\nGunakan tombol navigasi di kanan bawah untuk pindah halaman.', x: 80, y: 120, width: 1120, height: 400 },
          { id: createComponentId(), type: 'navigation', variant: 'primaryAction', label: 'Mulai →', action: 'next', x: 900, y: 620, width: 300, height: 60 },
        ],
      },
      // 3. Tujuan Pembelajaran
      {
        id: tujuanId, title: 'Tujuan Pembelajaran', role: 'learningObjectives', layoutId: 'blank',
        background: { type: 'color', color: '#ffffff' },
        components: [
          { id: createComponentId(), type: 'text', text: 'Tujuan Pembelajaran', variant: 'title', x: 80, y: 40, width: 1120, height: 60 },
          { id: createComponentId(), type: 'text', text: objText, variant: 'body', x: 80, y: 120, width: 1120, height: 300 },
          { id: createComponentId(), type: 'navigation', variant: 'primaryAction', label: 'Lihat Menu →', action: 'next', x: 900, y: 620, width: 300, height: 60 },
        ],
      },
      // 4. Menu Materi
      {
        id: menuId, title: 'Menu Materi', role: 'menu', layoutId: 'blank',
        background: { type: 'color', color: '#f8fafc' },
        components: [
          { id: createComponentId(), type: 'text', text: 'Menu Materi', variant: 'title', x: 80, y: 40, width: 1120, height: 60 },
          { id: createComponentId(), type: 'card', variant: 'infoCard', title: 'Pemantik', body: 'Refleksi awal tentang pentingnya norma.', x: 80, y: 120, width: 520, height: 120 },
          { id: createComponentId(), type: 'card', variant: 'infoCard', title: 'Materi', body: 'Pengertian dan jenis-jenis norma.', x: 680, y: 120, width: 520, height: 120 },
          { id: createComponentId(), type: 'card', variant: 'infoCard', title: 'Kuis', body: 'Uji pemahaman tentang norma.', x: 80, y: 280, width: 520, height: 120 },
          { id: createComponentId(), type: 'card', variant: 'infoCard', title: 'Game', body: 'Petualangan norma — 3 misi seru!', x: 680, y: 280, width: 520, height: 120 },
          { id: createComponentId(), type: 'navigation', variant: 'primaryAction', label: 'Mulai Belajar →', action: 'next', x: 900, y: 620, width: 300, height: 60 },
        ],
      },
      // 5. Pemantik
      {
        id: pemantikId, title: 'Pemantik', role: 'starter', layoutId: 'blank',
        background: { type: 'color', color: '#fef3c7' },
        components: [
          { id: createComponentId(), type: 'text', text: 'Pernahkah kamu terlambat ke sekolah karena tidak patuh pada jam tidur?', variant: 'questionPrompt', x: 100, y: 200, width: 1080, height: 120 },
          { id: createComponentId(), type: 'card', variant: 'importantNote', title: 'Pikirkan!', body: 'Apa yang terjadi jika semua orang berlaku sesuka hati tanpa aturan?', x: 200, y: 380, width: 880, height: 160 },
          { id: createComponentId(), type: 'navigation', variant: 'primaryAction', label: 'Materi →', action: 'next', x: 900, y: 620, width: 300, height: 60 },
        ],
      },
      // 6. Materi
      {
        id: materiId, title: 'Materi', role: 'material', layoutId: 'singleColumn',
        background: { type: 'color', color: '#ffffff' },
        components: [
          { id: createComponentId(), type: 'text', text: 'Pengertian Norma', variant: 'title', x: 80, y: 40, width: 1120, height: 60 },
          { id: createComponentId(), type: 'text', text: 'Norma adalah aturan atau ketentuan yang berlaku di masyarakat untuk mengatur perilaku anggotanya. Norma bersifat mengikat dan menjadi pedoman dalam bertindak.', variant: 'body', x: 80, y: 120, width: 1120, height: 120 },
          { id: createComponentId(), type: 'card', variant: 'infoCard', title: 'Jenis-Jenis Norma', body: '1. Norma Agama — aturan dari Tuhan\n2. Norma Kesusilaan — aturan tentang budi pekerti\n3. Norma Kesopanan — aturan tentang tata krama\n4. Norma Hukum — aturan dari negara', x: 80, y: 280, width: 1120, height: 220 },
          { id: createComponentId(), type: 'navigation', variant: 'primaryAction', label: 'Kuis →', action: 'next', x: 900, y: 620, width: 300, height: 60 },
        ],
      },
      // 7. Quiz
      {
        id: quizId, title: 'Kuis', role: 'quiz', layoutId: 'blank',
        background: { type: 'color', color: '#f0f9ff' },
        components: [
          { id: createComponentId(), type: 'question', variant: 'multipleChoice', title: 'Kuis Norma', prompt: 'Norma yang berasal dari Tuhan dan mengatur hubungan manusia dengan Tuhan disebut...', choices: [
            { id: createComponentId(), text: 'Norma Agama' }, { id: createComponentId(), text: 'Norma Kesusilaan' }, { id: createComponentId(), text: 'Norma Kesopanan' }, { id: createComponentId(), text: 'Norma Hukum' },
          ], correctChoiceIndex: 0, feedbackCorrect: 'Benar! Norma agama berasal dari Tuhan.', feedbackWrong: 'Belum tepat. Norma agama mengatur hubungan dengan Tuhan.', points: 10, scoringStyle: 'points', x: 100, y: 60, width: 600, height: 450 },
          { id: createComponentId(), type: 'navigation', variant: 'primaryAction', label: 'Game →', action: 'next', x: 900, y: 620, width: 300, height: 60 },
        ],
      },
      // 8. Game
      {
        id: gameId, title: 'Game Misi', role: 'activity', layoutId: 'blank',
        background: { type: 'color', color: '#f0fdf4' },
        components: [
          { id: createComponentId(), type: 'game', gameType: 'missionQuiz', title: 'Petualangan Norma', instruction: 'Jawab semua misi untuk menyelesaikan petualangan!', scoringStyle: 'stars', x: 100, y: 40, width: 700, height: 540, missions: [
            { id: createComponentId(), title: 'Misi 1', prompt: 'Berdiri saat guru masuk kelas adalah contoh norma...', choices: [
              { id: createComponentId(), text: 'Kesopanan' }, { id: createComponentId(), text: 'Hukum' }, { id: createComponentId(), text: 'Agama' },
            ], correctChoiceIndex: 0, feedbackCorrect: 'Benar! Itu norma kesopanan di sekolah.', feedbackWrong: 'Belum tepat. Itu contoh tata krama di sekolah.', points: 10 },
            { id: createComponentId(), title: 'Misi 2', prompt: 'Mencuri dilarang oleh...', choices: [
              { id: createComponentId(), text: 'Norma Agama saja' }, { id: createComponentId(), text: 'Norma Hukum saja' }, { id: createComponentId(), text: 'Semua norma (agama, kesusilaan, hukum)' },
            ], correctChoiceIndex: 2, feedbackCorrect: 'Tepat! Mencuri melanggar semua norma.', feedbackWrong: 'Belum lengkap. Mencuri melanggar semua jenis norma.', points: 15 },
            { id: createComponentId(), title: 'Misi 3', prompt: 'Norma yang sanksinya paling tegas dan memaksa adalah...', choices: [
              { id: createComponentId(), text: 'Norma Hukum' }, { id: createComponentId(), text: 'Norma Kesopanan' }, { id: createComponentId(), text: 'Norma Kesusilaan' },
            ], correctChoiceIndex: 0, feedbackCorrect: 'Benar! Norma hukum memiliki sanksi tegas dari negara.', feedbackWrong: 'Belum tepat. Norma hukum yang paling tegas sanksinya.', points: 15 },
          ] },
          // Scope A (Patch-2): tombol navigasi keluar dari Game → Refleksi.
          // Setelah game selesai, siswa punya jalan ke scene berikutnya.
          { id: createComponentId(), type: 'navigation', variant: 'primaryAction', label: 'Lanjut ke Refleksi →', action: 'next', x: 900, y: 620, width: 300, height: 60 },
        ],
      },
      // 9. Refleksi
      {
        id: refleksiId, title: 'Refleksi', role: 'reflection', layoutId: 'blank',
        background: { type: 'color', color: '#faf5ff' },
        components: [
          { id: createComponentId(), type: 'card', variant: 'importantNote', title: 'Refleksi Diri', body: 'Setelah mempelajari materi ini, renungkan:\n\n• Norma apa yang sudah aku jalankan dengan baik?\n• Norma apa yang masih sering aku langgar?\n• Apa yang akan aku lakukan untuk hidup lebih tertib?\n\nTulis jawabanmu di buku catatan.', x: 150, y: 150, width: 980, height: 350 },
          // Patch-2: Refleksi juga punya jalan keluar ke Penutup (bebas jalan bantu).
          { id: createComponentId(), type: 'navigation', variant: 'primaryAction', label: 'Penutup →', action: 'next', x: 900, y: 620, width: 300, height: 60 },
        ],
      },
      // 10. Penutup
      {
        id: penutupId, title: 'Penutup', role: 'closing', layoutId: 'blank',
        background: { type: 'color', color: '#1e3a5f' },
        components: [
          { id: createComponentId(), type: 'text', text: 'Terima Kasih', variant: 'title', x: 340, y: 280, width: 600, height: 80 },
          { id: createComponentId(), type: 'text', text: 'Mari kita hidup tertib dengan norma!', variant: 'subtitle', x: 340, y: 380, width: 600, height: 60 },
        ],
      },
    ],
  };
}
