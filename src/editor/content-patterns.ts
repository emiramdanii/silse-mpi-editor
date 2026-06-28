/**
 * Content Pattern Library (UX-03 — Content Pattern Library + Smart Teaching Suggestion).
 *
 * Layer: editor
 * Allowed imports: ../core/types (type-only), ../core/component-factory, ../core/ids
 *
 * Kontrak (UX-03 Scope A):
 *   Predefined "pola isi" per page role. Setiap pola adalah template siap-pakai
 *   yang menghasilkan komponen dengan fresh IDs + posisi masuk akal.
 *
 *   Pola DIPAKAI oleh:
 *     - PatternLibraryPanel (UI) — menampilkan pola yang relevan untuk halaman aktif
 *     - teaching-suggestion.ts — engine yang tentukan pola mana yang disarankan
 *     - store.addComponentsToPage — apply pola ke halaman
 *
 *   Prinsip aman:
 *     - Pola hanya berisi komponen yang diizinkan oleh capability matrix per role.
 *     - buildComponents mengembalikan array PageComponent dengan fresh IDs.
 *     - Pola tidak menghapus elemen existing — hanya menambah.
 *     - Pola bisa baca project context (mis. curriculum.objectives untuk tujuan).
 */

import type { PageComponent, PageRole, SimplePage, SimpleProject } from '../core/types';
import {
  createTextComponent,
  createCardComponent,
  createNavigationComponent,
  createQuestionComponent,
  createGameComponent,
  createGameMission,
} from '../core/component-factory';

/**
 * Context yang diberikan ke buildComponents supaya pola bisa baca data project
 * (mis. curriculum.objectives untuk pola Tujuan Pembelajaran).
 */
export type PatternContext = {
  project: SimpleProject;
  page: SimplePage;
};

export type ContentPattern = {
  /** ID unik pola (snake-case). */
  id: string;
  /** Nama ramah guru, contoh: "Materi Tunggal". */
  name: string;
  /** Deskripsi singkat apa yang akan ditambahkan. */
  description: string;
  /** Emoji ikon. */
  icon: string;
  /** Role halaman yang cocok untuk pola ini. */
  applicableRoles: PageRole[];
  /**
   * Factory yang mengembalikan array komponen siap-pakai dengan fresh IDs.
   * Posisi (x/y/width/height) sudah diatur supaya tidak overlap kacau.
   */
  buildComponents: (ctx: PatternContext) => PageComponent[];
};

// =========================================================================
// Helper: posisi standar (konsisten dengan sample PPKn)
// =========================================================================

const POS = {
  titleY: 40,
  titleH: 60,
  subtitleY: 120,
  bodyY: 120,
  bodyH: 120,
  cardY: 280,
  cardH: 220,
  navX: 900,
  navY: 620,
  navW: 300,
  navH: 60,
  fullWidth: 1120,
  centerX: 140,
} as const;

// =========================================================================
// 12 Content Patterns
// =========================================================================

export const CONTENT_PATTERNS: readonly ContentPattern[] = [
  // --- 1. Cover ---
  {
    id: 'cover-title',
    name: 'Halaman Cover',
    description: 'Judul utama + sub-judul (mapel, kelas, fase) terpusat.',
    icon: '🎬',
    applicableRoles: ['cover'],
    buildComponents: () => [
      createTextComponent('cover', {
        variant: 'title',
        text: 'Judul MPI',
        x: POS.centerX, y: 280, width: 1000, height: 120,
      }),
      createTextComponent('cover', {
        variant: 'subtitle',
        text: 'Mapel — Kelas X — Fase Y',
        x: 340, y: 420, width: 600, height: 60,
      }),
    ],
  },

  // --- 2. Guide ---
  {
    id: 'guide-petunjuk',
    name: 'Panduan Penggunaan',
    description: 'Judul + kartu petunjuk langkah + tombol Mulai.',
    icon: '📖',
    applicableRoles: ['guide'],
    buildComponents: () => [
      createTextComponent('guide', {
        variant: 'title',
        text: 'Panduan Penggunaan',
        x: 80, y: POS.titleY, width: POS.fullWidth, height: POS.titleH,
      }),
      createCardComponent(
        '1. Baca tujuan pembelajaran.\n2. Pelajari materi pada halaman Materi.\n3. Kerjakan Kuis untuk menguji pemahaman.\n4. Mainkan Game Misi untuk latihan.\n5. Tulis refleksi di halaman Refleksi.\n\nGunakan tombol navigasi di kanan bawah untuk pindah halaman.',
        {
          variant: 'infoCard',
          title: 'Cara Belajar',
          x: 80, y: 120, width: POS.fullWidth, height: 400,
        },
      ),
      createNavigationComponent('Mulai →', 'next', {
        variant: 'primaryAction',
        x: POS.navX, y: POS.navY, width: POS.navW, height: POS.navH,
      }),
    ],
  },

  // --- 3. Learning Objectives ---
  {
    id: 'tujuan-daftar',
    name: 'Daftar Tujuan Pembelajaran',
    description: 'Judul + daftar tujuan dari kurikulum + tombol lanjut.',
    icon: '🎯',
    applicableRoles: ['learningObjectives'],
    buildComponents: (ctx) => {
      const objectives = ctx.project.curriculum?.objectives ?? [];
      const objText = objectives.length > 0
        ? objectives.map((o, i) => `${i + 1}. ${o.text}`).join('\n')
        : '1. Tujuan pembelajaran pertama.\n2. Tujuan pembelajaran kedua.\n3. Tujuan pembelajaran ketiga.';
      return [
        createTextComponent('learningObjectives', {
          variant: 'title',
          text: 'Tujuan Pembelajaran',
          x: 80, y: POS.titleY, width: POS.fullWidth, height: POS.titleH,
        }),
        createTextComponent('learningObjectives', {
          variant: 'body',
          text: objText,
          x: 80, y: POS.bodyY, width: POS.fullWidth, height: 300,
        }),
        createNavigationComponent('Lanjut →', 'next', {
          variant: 'primaryAction',
          x: POS.navX, y: POS.navY, width: POS.navW, height: POS.navH,
        }),
      ];
    },
  },

  // --- 4. Menu (Peta Materi) ---
  {
    id: 'menu-peta',
    name: 'Peta Materi (4 Kartu)',
    description: 'Judul + 4 kartu menu (Pemantik, Materi, Kuis, Game) + tombol lanjut.',
    icon: '🗂️',
    applicableRoles: ['menu'],
    buildComponents: () => [
      createTextComponent('menu', {
        variant: 'title',
        text: 'Menu Materi',
        x: 80, y: POS.titleY, width: POS.fullWidth, height: POS.titleH,
      }),
      createCardComponent('Refleksi awal tentang materi.', {
        variant: 'infoCard',
        title: 'Pemantik',
        x: 80, y: 120, width: 520, height: 120,
      }),
      createCardComponent('Penjelasan inti pelajaran.', {
        variant: 'infoCard',
        title: 'Materi',
        x: 680, y: 120, width: 520, height: 120,
      }),
      createCardComponent('Uji pemahaman siswa.', {
        variant: 'infoCard',
        title: 'Kuis',
        x: 80, y: 280, width: 520, height: 120,
      }),
      createCardComponent('Latihan interaktif.', {
        variant: 'infoCard',
        title: 'Game',
        x: 680, y: 280, width: 520, height: 120,
      }),
      createNavigationComponent('Mulai Belajar →', 'next', {
        variant: 'primaryAction',
        x: POS.navX, y: POS.navY, width: POS.navW, height: POS.navH,
      }),
    ],
  },

  // --- 5. Starter (Pemantik) ---
  {
    id: 'pemantik-pertanyaan',
    name: 'Pemantik dengan Pertanyaan',
    description: 'Pertanyaan pemantik + kartu "pikirkan" + tombol materi.',
    icon: '💡',
    applicableRoles: ['starter'],
    buildComponents: () => [
      createTextComponent('starter', {
        variant: 'questionPrompt',
        text: 'Pernahkah kamu mengalami situasi seperti ini?',
        x: 100, y: 200, width: 1080, height: 120,
      }),
      createCardComponent('Apa yang terjadi jika semua orang berlaku sesuka hati tanpa aturan?', {
        variant: 'importantNote',
        title: 'Pikirkan!',
        x: 200, y: 380, width: 880, height: 160,
      }),
      createNavigationComponent('Materi →', 'next', {
        variant: 'primaryAction',
        x: POS.navX, y: POS.navY, width: POS.navW, height: POS.navH,
      }),
    ],
  },

  // --- 6. Material (Materi Tunggal) — primary ---
  {
    id: 'materi-tunggal',
    name: 'Materi Tunggal',
    description: 'Judul + isi materi + kartu info (jenis/contoh) + tombol kuis.',
    icon: '📚',
    applicableRoles: ['material'],
    buildComponents: () => [
      createTextComponent('material', {
        variant: 'title',
        text: 'Judul Materi',
        x: 80, y: POS.titleY, width: POS.fullWidth, height: POS.titleH,
      }),
      createTextComponent('material', {
        variant: 'body',
        text: 'Tulis penjelasan materi di sini. Jelaskan konsep utama dengan bahasa yang mudah dipahami siswa.',
        x: 80, y: POS.bodyY, width: POS.fullWidth, height: POS.bodyH,
      }),
      createCardComponent('1. Poin pertama\n2. Poin kedua\n3. Poin ketiga', {
        variant: 'infoCard',
        title: 'Ringkasan',
        x: 80, y: POS.cardY, width: POS.fullWidth, height: POS.cardH,
      }),
      createNavigationComponent('Kuis →', 'next', {
        variant: 'primaryAction',
        x: POS.navX, y: POS.navY, width: POS.navW, height: POS.navH,
      }),
    ],
  },

  // --- 7. Material (Materi + Gambar) — alternative ---
  {
    id: 'materi-gambar',
    name: 'Materi dengan Gambar',
    description: 'Judul + gambar + isi materi + tombol kuis (alternatif).',
    icon: '🖼️',
    applicableRoles: ['material'],
    buildComponents: () => [
      createTextComponent('material', {
        variant: 'title',
        text: 'Judul Materi',
        x: 80, y: POS.titleY, width: POS.fullWidth, height: POS.titleH,
      }),
      createTextComponent('material', {
        variant: 'body',
        text: 'Tulis penjelasan materi di sini.',
        x: 540, y: POS.bodyY, width: 660, height: 280,
      }),
      createNavigationComponent('Kuis →', 'next', {
        variant: 'primaryAction',
        x: POS.navX, y: POS.navY, width: POS.navW, height: POS.navH,
      }),
    ],
  },

  // --- 8. Quiz (Pilihan Ganda) ---
  {
    id: 'kuis-pilgan',
    name: 'Kuis Pilihan Ganda',
    description: 'Satu pertanyaan pilihan ganda + tombol lanjut.',
    icon: '✏️',
    applicableRoles: ['quiz'],
    buildComponents: () => [
      createQuestionComponent({
        title: 'Kuis',
        prompt: 'Pertanyaan kuis...',
        choices: [
          { id: 'placeholder-1', text: 'Pilihan A' },
          { id: 'placeholder-2', text: 'Pilihan B' },
          { id: 'placeholder-3', text: 'Pilihan C' },
          { id: 'placeholder-4', text: 'Pilihan D' },
        ],
        correctChoiceIndex: 0,
        feedbackCorrect: 'Benar!',
        feedbackWrong: 'Belum tepat. Coba lagi.',
        points: 10,
        scoringStyle: 'points',
        x: 100, y: 60, width: 600, height: 450,
      }),
      createNavigationComponent('Berikutnya →', 'next', {
        variant: 'primaryAction',
        x: POS.navX, y: POS.navY, width: POS.navW, height: POS.navH,
      }),
    ],
  },

  // --- 9. Activity (Game Misi) ---
  {
    id: 'game-misi',
    name: 'Game Petualangan Misi',
    description: 'Game dengan 2 misi pilihan ganda + tombol lanjut.',
    icon: '🎮',
    applicableRoles: ['activity'],
    buildComponents: () => [
      createGameComponent({
        title: 'Petualangan Misi',
        instruction: 'Jawab semua misi untuk menyelesaikan petualangan!',
        scoringStyle: 'stars',
        x: 100, y: 40, width: 700, height: 540,
        missions: [
          {
            ...createGameMission({
              title: 'Misi 1',
              prompt: 'Pertanyaan misi pertama?',
              choices: [
                { id: 'm1-c1', text: 'Pilihan A' },
                { id: 'm1-c2', text: 'Pilihan B' },
              ],
              correctChoiceIndex: 0,
              feedbackCorrect: 'Benar! Lanjut ke misi berikutnya.',
              feedbackWrong: 'Belum tepat. Coba lagi.',
              points: 10,
            }),
          },
          {
            ...createGameMission({
              title: 'Misi 2',
              prompt: 'Pertanyaan misi kedua?',
              choices: [
                { id: 'm2-c1', text: 'Pilihan A' },
                { id: 'm2-c2', text: 'Pilihan B' },
              ],
              correctChoiceIndex: 0,
              feedbackCorrect: 'Benar! Petualangan selesai.',
              feedbackWrong: 'Belum tepat. Coba lagi.',
              points: 15,
            }),
          },
        ],
      }),
      createNavigationComponent('Lanjut →', 'next', {
        variant: 'primaryAction',
        x: POS.navX, y: POS.navY, width: POS.navW, height: POS.navH,
      }),
    ],
  },

  // --- 10. Reflection ---
  {
    id: 'refleksi-diri',
    name: 'Refleksi Diri',
    description: 'Kartu pertanyaan refleksi + tombol penutup.',
    icon: '🪞',
    applicableRoles: ['reflection'],
    buildComponents: () => [
      createCardComponent(
        'Setelah mempelajari materi ini, renungkan:\n\n• Apa yang sudah aku pahami?\n• Apa yang masih aku bingungkan?\n• Apa yang akan aku lakukan selanjutnya?\n\nTulis jawabanmu di buku catatan.',
        {
          variant: 'importantNote',
          title: 'Refleksi Diri',
          x: 150, y: 150, width: 980, height: 350,
        },
      ),
      createNavigationComponent('Penutup →', 'next', {
        variant: 'primaryAction',
        x: POS.navX, y: POS.navY, width: POS.navW, height: POS.navH,
      }),
    ],
  },

  // --- 11. Closing ---
  {
    id: 'penutup-terima-kasih',
    name: 'Penutup Terima Kasih',
    description: 'Judul "Terima Kasih" + sub-judul pesan penutup.',
    icon: '🎓',
    applicableRoles: ['closing'],
    buildComponents: () => [
      createTextComponent('closing', {
        variant: 'title',
        text: 'Terima Kasih',
        x: 340, y: 280, width: 600, height: 80,
      }),
      createTextComponent('closing', {
        variant: 'subtitle',
        text: 'Semoga pembelajaran ini bermanfaat!',
        x: 340, y: 380, width: 600, height: 60,
      }),
    ],
  },

  // --- 12. Menu (Daftar Sederhana) — alternative ---
  {
    id: 'menu-daftar',
    name: 'Menu Daftar Sederhana',
    description: 'Judul + teks daftar menu (tanpa kartu) + tombol lanjut (alternatif).',
    icon: '📋',
    applicableRoles: ['menu'],
    buildComponents: () => [
      createTextComponent('menu', {
        variant: 'title',
        text: 'Menu Materi',
        x: 80, y: POS.titleY, width: POS.fullWidth, height: POS.titleH,
      }),
      createTextComponent('menu', {
        variant: 'body',
        text: '1. Pemantik\n2. Materi\n3. Kuis\n4. Game\n5. Refleksi',
        x: 80, y: POS.bodyY, width: POS.fullWidth, height: 300,
      }),
      createNavigationComponent('Mulai →', 'next', {
        variant: 'primaryAction',
        x: POS.navX, y: POS.navY, width: POS.navW, height: POS.navH,
      }),
    ],
  },
];

// =========================================================================
// Helpers
// =========================================================================

/**
 * Dapatkan semua pola yang applicable untuk suatu role.
 */
export function getPatternsForRole(role: PageRole): ContentPattern[] {
  return CONTENT_PATTERNS.filter((p) => p.applicableRoles.includes(role));
}

/**
 * Dapatkan pola berdasarkan ID. Returns undefined kalau tidak ada.
 */
export function getPatternById(id: string): ContentPattern | undefined {
  return CONTENT_PATTERNS.find((p) => p.id === id);
}

/**
 * Pola "primary" untuk suatu role — pola pertama yang applicable.
 * Dipakai oleh teaching-suggestion engine sebagai saran utama.
 */
export function getPrimaryPatternForRole(role: PageRole): ContentPattern | undefined {
  return getPatternsForRole(role)[0];
}
