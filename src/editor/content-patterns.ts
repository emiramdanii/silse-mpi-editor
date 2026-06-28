/**
 * Content Pattern Library (UX-03 + UX-03 Patch-1 — Rich Content Patterns).
 *
 * Layer: editor
 * Allowed imports: ../core/types (type-only), ../core/component-factory, ../core/ids
 *
 * Kontrak (UX-03 Patch-1):
 *   30 pola isi predefined per page role — naik dari 27 (LXC-02) ke 30
 *   (LXC-03: +3 pola learning-bridge).
 *   Tiap pola punya reason pedagogis yang menjelaskan KAPAN dipakai,
 *   bukan hanya "siap diterapkan".
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
 *     - Pola materi-gambar BENAR-BENAR menambah image component (placeholder SVG).
 */

import type { PageComponent, PageRole, SimplePage, SimpleProject } from '../core/types';
import {
  createTextComponent,
  createImageComponent,
  createCardComponent,
  createNavigationComponent,
  createQuestionComponent,
  createGameComponent,
  createGameMission,
  createLayeredInfoComponent,
  createLayeredInfoLayer,
  createLearningBridgeComponent,
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
   * Reason pedagogis: kapan pola ini dipakai, apa tujuan belajarnya.
   * Bukan hanya "siap diterapkan" — harus menjelaskan konteks pedagogis.
   */
  pedagogicalReason: string;
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

/**
 * Placeholder image SVG (data URL) untuk pola yang butuh gambar.
 * Guru bisa replace src-nya via Panel Isi setelah pola diterapkan.
 */
const PLACEHOLDER_IMAGE_SRC =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 280'><rect width='400' height='280' fill='%23e3ddcd'/><text x='200' y='140' font-family='sans-serif' font-size='14' text-anchor='middle' fill='%238a8775'>Ganti gambar di sini</text></svg>";

// =========================================================================
// 30 Content Patterns
// =========================================================================

export const CONTENT_PATTERNS: readonly ContentPattern[] = [
  // ===== COVER (1) =====
  {
    id: 'cover-title',
    name: 'Halaman Cover',
    description: 'Judul utama + sub-judul (mapel, kelas, fase) terpusat.',
    icon: '🎬',
    applicableRoles: ['cover'],
    pedagogicalReason: 'Pembuka pertama yang siswa lihat. Gunakan untuk menampilkan judul MPI dan identitas mapel/kelas/fase.',
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

  // ===== GUIDE (1) =====
  {
    id: 'guide-petunjuk',
    name: 'Panduan Penggunaan',
    description: 'Judul + kartu petunjuk langkah + tombol Mulai.',
    icon: '📖',
    applicableRoles: ['guide'],
    pedagogicalReason: 'Beri siswa peta jalan sebelum mulai. Cocok untuk MPI yang punya alur panjang (pemantik → materi → kuis → game → refleksi).',
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

  // ===== LEARNING OBJECTIVES (1) =====
  {
    id: 'tujuan-daftar',
    name: 'Daftar Tujuan Pembelajaran',
    description: 'Judul + daftar tujuan dari kurikulum + tombol lanjut.',
    icon: '🎯',
    applicableRoles: ['learningObjectives'],
    pedagogicalReason: 'Siswa perlu tahu tujuan belajar sebelum mulai. Daftar terstruktur membantu mereka fokus pada apa yang akan dicapai.',
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

  // ===== LEARNING OBJECTIVES (2) =====
  // LXC-02 Patch-1: pola "Tujuan Lengkap Berlapis" pakai komponen resmi
  // baru layered-info dengan variant iconTabs + 5 lapisan (CP/ATP/Pertemuan/
  // Tujuan/Alur Belajar) sesuai diskusi produk. Cocok untuk halaman Tujuan
  // yang berisi CP/ATP/TP + posisi pertemuan + alur belajar dalam satu
  // komponen berlapis (bukan teks lepas panjang).
  {
    id: 'tujuan-berlapis',
    name: 'Tujuan Lengkap Berlapis',
    description: 'Komponen Info Berlapis (iconTabs) dengan 5 lapisan: CP, ATP, Pertemuan, Tujuan, Alur Belajar + tombol lanjut.',
    icon: '📚',
    applicableRoles: ['learningObjectives'],
    pedagogicalReason: 'Sajikan tujuan pembelajaran dalam lapisan progressive disclosure — siswa fokus pada satu lapisan sekaligus (CP/ATP/Pertemuan/Tujuan/Alur), bukan kewalahan dengan teks panjang. Cocok untuk halaman Tujuan yang berisi CP/ATP/TP + alur belajar.',
    buildComponents: (ctx) => {
      const objectives = ctx.project.curriculum?.objectives ?? [];
      const objText = objectives.length > 0
        ? objectives.map((o, i) => `${i + 1}. ${o.text}`).join('\n')
        : '1. Tujuan pembelajaran pertama.\n2. Tujuan pembelajaran kedua.\n3. Tujuan pembelajaran ketiga.';
      return [
        createLayeredInfoComponent({
          variant: 'iconTabs',
          title: 'Tujuan Pembelajaran',
          defaultOpenIndex: 3, // "Tujuan" terbuka by default
          layers: [
            createLayeredInfoLayer({
              title: 'CP',
              icon: '📘',
              body: 'Capaian Pembelajaran (CP):\n\n( Tulis CP dari kurikulum merdeka untuk fase ini )',
            }),
            createLayeredInfoLayer({
              title: 'ATP',
              icon: '🧭',
              body: 'Alur Tujuan Pembelajaran (ATP):\n\n( Tulis ATP — turunan CP menjadi tujuan per pertemuan )',
            }),
            createLayeredInfoLayer({
              title: 'Pertemuan',
              icon: '📍',
              body: 'Pertemuan ke-...\n\nTanggal: ...\nAlokasi waktu: ... menit',
            }),
            createLayeredInfoLayer({
              title: 'Tujuan',
              icon: '🎯',
              body: `Tujuan Pembelajaran pertemuan ini:\n\n${objText}`,
            }),
            createLayeredInfoLayer({
              title: 'Alur Belajar',
              icon: '🗺️',
              body: 'Alur belajar pertemuan ini:\n\n1. Pemantik\n2. Materi\n3. Kuis\n4. Game\n5. Refleksi',
            }),
          ],
          x: 80, y: 120, width: POS.fullWidth, height: 460,
        }),
        createNavigationComponent('Lanjut →', 'next', {
          variant: 'primaryAction',
          x: POS.navX, y: POS.navY, width: POS.navW, height: POS.navH,
        }),
      ];
    },
  },

  // ===== MENU (2) =====
  {
    id: 'menu-peta',
    name: 'Peta Materi (4 Kartu)',
    description: 'Judul + 4 kartu menu (Pemantik, Materi, Kuis, Game) + tombol lanjut.',
    icon: '🗂️',
    applicableRoles: ['menu'],
    pedagogicalReason: 'Beri siswa peta isi MPI supaya mereka tahu apa yang akan datang. Cocok untuk MPI dengan banyak scene.',
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
  {
    id: 'menu-daftar',
    name: 'Menu Daftar Sederhana',
    description: 'Judul + teks daftar menu (tanpa kartu) + tombol lanjut (alternatif).',
    icon: '📋',
    applicableRoles: ['menu'],
    pedagogicalReason: 'Alternatif lebih ringkas dari Peta Materi. Cocok untuk MPI pendek dengan sedikit scene.',
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

  // ===== STARTER / PEMANTIK (4) =====
  {
    id: 'pemantik-pertanyaan',
    name: 'Pemantik dengan Pertanyaan',
    description: 'Pertanyaan pemantik + kartu "pikirkan" + tombol materi.',
    icon: '💡',
    applicableRoles: ['starter'],
    pedagogicalReason: 'Buka dengan pertanyaan reflektif untuk mengaktifkan pengetahuan awal siswa. Cocok untuk topik yang punya koneksi ke pengalaman sehari-hari.',
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
  {
    id: 'pemantik-kasus',
    name: 'Kasus Kehidupan Siswa',
    description: 'Kartu cerita kasus sehari-hari + pertanyaan refleksi + tombol materi.',
    icon: '🏠',
    applicableRoles: ['starter'],
    pedagogicalReason: 'Mulai dari kasus kehidupan sehari-hari siswa supaya materi terasa relevan. Cocok untuk topik yang dekat dengan pengalaman mereka.',
    buildComponents: () => [
      createTextComponent('starter', {
        variant: 'title',
        text: 'Bayangkan Ini...',
        x: 80, y: POS.titleY, width: POS.fullWidth, height: POS.titleH,
      }),
      createCardComponent(
        'Pagi tadi, Andi terlambat masuk sekolah. Ia tidak sempat sarapan, lupa salam ke guru, dan terburu-buru di kelas. Apa akibatnya? Mengapa hal seperti ini sering terjadi?',
        {
          variant: 'exampleCard',
          title: 'Kasus',
          x: 100, y: 140, width: 1080, height: 200,
        },
      ),
      createTextComponent('starter', {
        variant: 'questionPrompt',
        text: 'Pernahkah kamu mengalami situasi serupa? Apa yang kamu rasakan?',
        x: 100, y: 380, width: 1080, height: 100,
      }),
      createNavigationComponent('Materi →', 'next', {
        variant: 'primaryAction',
        x: POS.navX, y: POS.navY, width: POS.navW, height: POS.navH,
      }),
    ],
  },
  {
    id: 'pemantik-setuju',
    name: 'Setuju atau Tidak Setuju',
    description: 'Pernyataan kontroversial + kartu "posisikan dirimu" + tombol materi.',
    icon: '⚖️',
    applicableRoles: ['starter'],
    pedagogicalReason: 'Minta siswa posisi setuju/tidak setuju pada pernyataan provokatif. Cocok untuk topik yang melibatkan opini, nilai, atau etika.',
    buildComponents: () => [
      createTextComponent('starter', {
        variant: 'questionPrompt',
        text: '“Aturan itu membatasi kebebasan kita.”',
        x: 100, y: 160, width: 1080, height: 120,
      }),
      createCardComponent(
        'Apakah kamu SETUJU atau TIDAK SETUJU dengan pernyataan di atas?\n\nTulis alasanmu di buku catatan. Kita akan bahas ini setelah materi.',
        {
          variant: 'importantNote',
          title: 'Posisikan Dirimu',
          x: 200, y: 340, width: 880, height: 200,
        },
      ),
      createNavigationComponent('Materi →', 'next', {
        variant: 'primaryAction',
        x: POS.navX, y: POS.navY, width: POS.navW, height: POS.navH,
      }),
    ],
  },
  {
    id: 'pemantik-poll',
    name: 'Mini Poll',
    description: 'Pertanyaan jajak pendapat + 3 kartu pilihan + tombol materi.',
    icon: '📊',
    applicableRoles: ['starter'],
    pedagogicalReason: 'Jajak pendapat singkat untuk memancing partisipasi di awal. Cocok untuk topik yang punya beberapa sudut pandang.',
    buildComponents: () => [
      createTextComponent('starter', {
        variant: 'questionPrompt',
        text: 'Menurutmu, norma apa yang paling penting di kelas?',
        x: 100, y: 100, width: 1080, height: 80,
      }),
      createCardComponent('Aturan dari Tuhan', {
        variant: 'infoCard',
        title: 'Norma Agama',
        x: 80, y: 220, width: 340, height: 140,
      }),
      createCardComponent('Aturan dari masyarakat', {
        variant: 'infoCard',
        title: 'Norma Sosial',
        x: 470, y: 220, width: 340, height: 140,
      }),
      createCardComponent('Aturan dari negara', {
        variant: 'infoCard',
        title: 'Norma Hukum',
        x: 860, y: 220, width: 340, height: 140,
      }),
      createCardComponent(
        'Pilih satu, lalu diskusikan dengan teman sebangku mengapa kamu memilih itu.',
        {
          variant: 'importantNote',
          title: 'Diskusi',
          x: 200, y: 400, width: 880, height: 140,
        },
      ),
      createNavigationComponent('Materi →', 'next', {
        variant: 'primaryAction',
        x: POS.navX, y: POS.navY, width: POS.navW, height: POS.navH,
      }),
    ],
  },

  // ===== MATERIAL / MATERI (7) =====
  {
    id: 'materi-tunggal',
    name: 'Materi Tunggal',
    description: 'Judul + isi materi + kartu info (ringkasan) + tombol kuis.',
    icon: '📚',
    applicableRoles: ['material'],
    pedagogicalReason: 'Struktur materi paling umum: judul + penjelasan + ringkasan. Cocok untuk konsep yang bisa dijelaskan dalam satu halaman.',
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
  {
    id: 'materi-gambar',
    name: 'Materi dengan Gambar',
    description: 'Judul + gambar (placeholder) + isi materi di samping + tombol kuis.',
    icon: '🖼️',
    applicableRoles: ['material'],
    pedagogicalReason: 'Materi dengan ilustrasi di samping teks. Cocok untuk konsep yang butuh visualisasi (diagram, foto, skema).',
    buildComponents: () => [
      createTextComponent('material', {
        variant: 'title',
        text: 'Judul Materi',
        x: 80, y: POS.titleY, width: POS.fullWidth, height: POS.titleH,
      }),
      // UX-03 Patch-1 fix: BENAR-BENAR tambah image component dengan placeholder SVG.
      createImageComponent(PLACEHOLDER_IMAGE_SRC, {
        variant: 'illustration',
        alt: 'Ilustrasi materi — ganti dengan gambar relevan',
        objectFit: 'cover',
        x: 80, y: 140, width: 440, height: 320,
      }),
      createTextComponent('material', {
        variant: 'body',
        text: 'Tulis penjelasan materi di sini. Gambar di samping membantu siswa memahami konsep secara visual.',
        x: 540, y: 140, width: 660, height: 320,
      }),
      createNavigationComponent('Kuis →', 'next', {
        variant: 'primaryAction',
        x: POS.navX, y: POS.navY, width: POS.navW, height: POS.navH,
      }),
    ],
  },
  {
    id: 'materi-kartu-konsep',
    name: 'Kartu Konsep',
    description: 'Judul + 4 kartu konsep kecil (untuk istilah/kategori) + tombol kuis.',
    icon: '🃏',
    applicableRoles: ['material'],
    pedagogicalReason: 'Konsep dipecah jadi kartu-kartu kecil. Cocok untuk banyak istilah atau kategori yang perlu diingat.',
    buildComponents: () => [
      createTextComponent('material', {
        variant: 'title',
        text: 'Judul Materi',
        x: 80, y: POS.titleY, width: POS.fullWidth, height: POS.titleH,
      }),
      createCardComponent('Definisi singkat konsep pertama.', {
        variant: 'infoCard',
        title: 'Konsep 1',
        x: 80, y: 140, width: 520, height: 180,
      }),
      createCardComponent('Definisi singkat konsep kedua.', {
        variant: 'infoCard',
        title: 'Konsep 2',
        x: 680, y: 140, width: 520, height: 180,
      }),
      createCardComponent('Definisi singkat konsep ketiga.', {
        variant: 'infoCard',
        title: 'Konsep 3',
        x: 80, y: 360, width: 520, height: 180,
      }),
      createCardComponent('Definisi singkat konsep keempat.', {
        variant: 'infoCard',
        title: 'Konsep 4',
        x: 680, y: 360, width: 520, height: 180,
      }),
      createNavigationComponent('Kuis →', 'next', {
        variant: 'primaryAction',
        x: POS.navX, y: POS.navY, width: POS.navW, height: POS.navH,
      }),
    ],
  },
  {
    id: 'materi-contoh-vs-bukan',
    name: 'Contoh vs Bukan Contoh',
    description: 'Judul + kartu "Contoh" + kartu "Bukan Contoh" + penjelasan + tombol kuis.',
    icon: '✅❌',
    applicableRoles: ['material'],
    pedagogicalReason: 'Bandingkan contoh dan bukan contoh supaya siswa paham batas konsep. Cocok untuk konsep yang sering keliru.',
    buildComponents: () => [
      createTextComponent('material', {
        variant: 'title',
        text: 'Judul Konsep',
        x: 80, y: POS.titleY, width: POS.fullWidth, height: POS.titleH,
      }),
      createCardComponent(
        'Tulis contoh yang SESUAI dengan konsep di sini.\n\nJelaskan mengapa ini contoh yang benar.',
        {
          variant: 'exampleCard',
          title: '✓ Contoh',
          x: 80, y: 140, width: 520, height: 280,
        },
      ),
      createCardComponent(
        'Tulis contoh yang TIDAK SESUAI dengan konsep di sini.\n\nJelaskan mengapa ini bukan contoh.',
        {
          variant: 'importantNote',
          title: '✗ Bukan Contoh',
          x: 680, y: 140, width: 520, height: 280,
        },
      ),
      createCardComponent(
        'Apa ciri-ciri yang membedakan contoh dari bukan contoh? Tulis di sini.',
        {
          variant: 'infoCard',
          title: 'Ciri Pembeda',
          x: 200, y: 460, width: 880, height: 120,
        },
      ),
      createNavigationComponent('Kuis →', 'next', {
        variant: 'primaryAction',
        x: POS.navX, y: POS.navY, width: POS.navW, height: POS.navH,
      }),
    ],
  },
  {
    id: 'materi-fakta-mitos',
    name: 'Fakta vs Mitos',
    description: 'Judul + kartu "Fakta" + kartu "Mitos" + klarifikasi + tombol kuis.',
    icon: '🔬',
    applicableRoles: ['material'],
    pedagogicalReason: 'Bedakan fakta vs mitos untuk meluruskan miskonsepsi. Cocok untuk topik yang banyak salah paham.',
    buildComponents: () => [
      createTextComponent('material', {
        variant: 'title',
        text: 'Fakta atau Mitos?',
        x: 80, y: POS.titleY, width: POS.fullWidth, height: POS.titleH,
      }),
      createCardComponent(
        'Tulis pernyataan yang merupakan FAKTA di sini.\n\nSertakan bukti atau sumber.',
        {
          variant: 'infoCard',
          title: '✓ Fakta',
          x: 80, y: 140, width: 520, height: 280,
        },
      ),
      createCardComponent(
        'Tulis pernyataan yang merupakan MITOS di sini.\n\nJelaskan mengapa ini keliru.',
        {
          variant: 'importantNote',
          title: '✗ Mitos',
          x: 680, y: 140, width: 520, height: 280,
        },
      ),
      createCardComponent(
        'Setelah tahu faktanya, apa kesimpulan yang benar? Tulis di sini.',
        {
          variant: 'exampleCard',
          title: 'Klarifikasi',
          x: 200, y: 460, width: 880, height: 120,
        },
      ),
      createNavigationComponent('Kuis →', 'next', {
        variant: 'primaryAction',
        x: POS.navX, y: POS.navY, width: POS.navW, height: POS.navH,
      }),
    ],
  },
  {
    id: 'materi-step-by-step',
    name: 'Step-by-Step',
    description: 'Judul + 4 kartu langkah berurutan (Langkah 1-4) + tombol kuis.',
    icon: '🔢',
    applicableRoles: ['material'],
    pedagogicalReason: 'Langkah-langkah berurutan dengan nomor. Cocok untuk proses, prosedur, atau algoritma.',
    buildComponents: () => [
      createTextComponent('material', {
        variant: 'title',
        text: 'Judul Proses',
        x: 80, y: POS.titleY, width: POS.fullWidth, height: POS.titleH,
      }),
      createCardComponent('Jelaskan langkah pertama.', {
        variant: 'infoCard',
        title: 'Langkah 1',
        x: 80, y: 140, width: 520, height: 180,
      }),
      createCardComponent('Jelaskan langkah kedua.', {
        variant: 'infoCard',
        title: 'Langkah 2',
        x: 680, y: 140, width: 520, height: 180,
      }),
      createCardComponent('Jelaskan langkah ketiga.', {
        variant: 'infoCard',
        title: 'Langkah 3',
        x: 80, y: 360, width: 520, height: 180,
      }),
      createCardComponent('Jelaskan langkah keempat.', {
        variant: 'infoCard',
        title: 'Langkah 4',
        x: 680, y: 360, width: 520, height: 180,
      }),
      createNavigationComponent('Kuis →', 'next', {
        variant: 'primaryAction',
        x: POS.navX, y: POS.navY, width: POS.navW, height: POS.navH,
      }),
    ],
  },
  {
    id: 'materi-mini-checkpoint',
    name: 'Materi + Mini Checkpoint',
    description: 'Judul + materi + pertanyaan singkat cek pemahaman + ringkasan + tombol kuis.',
    icon: '🛑',
    applicableRoles: ['material'],
    pedagogicalReason: 'Materi diselingi pertanyaan singkat untuk cek pemahaman. Cocok untuk materi panjang supaya siswa tidak passif.',
    buildComponents: () => [
      createTextComponent('material', {
        variant: 'title',
        text: 'Judul Materi',
        x: 80, y: POS.titleY, width: POS.fullWidth, height: POS.titleH,
      }),
      createTextComponent('material', {
        variant: 'body',
        text: 'Tulis penjelasan materi utama di sini.',
        x: 80, y: 120, width: POS.fullWidth, height: 120,
      }),
      createCardComponent(
        'Sebelum lanjut, jawab dulu:\n\nApa inti dari materi di atas? Tulis dengan kalimatmu sendiri.',
        {
          variant: 'importantNote',
          title: '🛑 Cek Pemahaman',
          x: 80, y: 280, width: POS.fullWidth, height: 160,
        },
      ),
      createCardComponent('1. Poin kunci pertama\n2. Poin kunci kedua\n3. Poin kunci ketiga', {
        variant: 'exampleCard',
        title: 'Ringkasan',
        x: 80, y: 480, width: POS.fullWidth, height: 120,
      }),
      createNavigationComponent('Kuis →', 'next', {
        variant: 'primaryAction',
        x: POS.navX, y: POS.navY, width: POS.navW, height: POS.navH,
      }),
    ],
  },

  // ===== QUIZ (1) =====
  {
    id: 'kuis-pilgan',
    name: 'Kuis Pilihan Ganda',
    description: 'Satu pertanyaan pilihan ganda (4 pilihan) + tombol lanjut.',
    icon: '✏️',
    applicableRoles: ['quiz'],
    pedagogicalReason: 'Evaluasi pemahaman siswa dengan pilihan ganda. Cocok untuk konsep yang punya jawaban benar-tunggal.',
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

  // ===== ACTIVITY / GAME (1) =====
  {
    id: 'game-misi',
    name: 'Game Petualangan Misi',
    description: 'Game dengan 2 misi pilihan ganda + tombol lanjut.',
    icon: '🎮',
    applicableRoles: ['activity'],
    pedagogicalReason: 'Latihan interaktif dengan struktur misi. Cocok untuk memberi siswa kesempatan mencoba konsep dalam situasi/game.',
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

  // ===== REFLECTION (4) =====
  {
    id: 'refleksi-diri',
    name: 'Refleksi Diri (Terbuka)',
    description: 'Kartu pertanyaan reflektif terbuka + tombol penutup.',
    icon: '🪞',
    applicableRoles: ['reflection'],
    pedagogicalReason: 'Pertanyaan reflektif terbuka untuk menenangkan siswa di akhir pembelajaran. Cocok untuk MPI yang menekankan internalisasi.',
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
  {
    id: 'refleksi-rumpang',
    name: 'Kalimat Rumpang',
    description: 'Kalimat tidak lengkap yang siswa lengkapi + tombol penutup.',
    icon: '✍️',
    applicableRoles: ['reflection'],
    pedagogicalReason: 'Kalimat rumpang yang siswa lengkapi untuk cek pemahaman ringan. Cocok untuk konsep yang punya definisi jelas.',
    buildComponents: () => [
      createTextComponent('reflection', {
        variant: 'title',
        text: 'Lengkapi Kalimat Ini',
        x: 80, y: POS.titleY, width: POS.fullWidth, height: POS.titleH,
      }),
      createCardComponent(
        'Setelah mempelajari materi ini, aku sekarang paham bahwa ____________________.\n\nHal yang paling menarik dari materi ini adalah ____________________.\n\nAku akan menggunakan pengetahuan ini untuk ____________________.',
        {
          variant: 'importantNote',
          title: 'Lengkapi',
          x: 100, y: 140, width: 1080, height: 360,
        },
      ),
      createNavigationComponent('Penutup →', 'next', {
        variant: 'primaryAction',
        x: POS.navX, y: POS.navY, width: POS.navW, height: POS.navH,
      }),
    ],
  },
  {
    id: 'refleksi-komitmen',
    name: 'Checklist Komitmen',
    description: 'Kartu checklist komitmen tindakan nyata + tombol penutup.',
    icon: '📌',
    applicableRoles: ['reflection'],
    pedagogicalReason: 'Checklist komitmen tindakan nyata. Cocok untuk pembelajaran yang mendorong siswa bertindak di kehidupan sehari-hari.',
    buildComponents: () => [
      createTextComponent('reflection', {
        variant: 'title',
        text: 'Komitmenku',
        x: 80, y: POS.titleY, width: POS.fullWidth, height: POS.titleH,
      }),
      createCardComponent(
        'Mulai hari ini, aku berkomitmen untuk:\n\n☐ Menerapkan ____________________ di rumah.\n☐ Membagi apa yang aku pelajari ke ____________________.\n☐ Menghentikan kebiasaan ____________________.\n\nTandai yang akan kamu lakukan.',
        {
          variant: 'importantNote',
          title: 'Komitmen Tindakan',
          x: 100, y: 140, width: 1080, height: 380,
        },
      ),
      createNavigationComponent('Penutup →', 'next', {
        variant: 'primaryAction',
        x: POS.navX, y: POS.navY, width: POS.navW, height: POS.navH,
      }),
    ],
  },
  {
    id: 'refleksi-3-2-1',
    name: 'Refleksi 3-2-1',
    description: '3 hal dipelajari + 2 hal menarik + 1 pertanyaan + tombol penutup.',
    icon: '🔢',
    applicableRoles: ['reflection'],
    pedagogicalReason: 'Refleksi 3-2-1 yang terstruktur. Cocok untuk MPI yang ingin siswa merangkum sekaligus mengidentifikasi pertanyaan terbuka.',
    buildComponents: () => [
      createTextComponent('reflection', {
        variant: 'title',
        text: 'Refleksi 3-2-1',
        x: 80, y: POS.titleY, width: POS.fullWidth, height: POS.titleH,
      }),
      createCardComponent(
        'Tulis di buku catatanmu:\n\n3 — Tiga hal yang aku pelajari hari ini:\n  1. ____________________\n  2. ____________________\n  3. ____________________\n\n2 — Dua hal yang paling menarik:\n  1. ____________________\n  2. ____________________\n\n1 — Satu pertanyaan yang masih aku punya:\n  • ____________________',
        {
          variant: 'importantNote',
          title: 'Struktur 3-2-1',
          x: 80, y: 140, width: POS.fullWidth, height: 440,
        },
      ),
      createNavigationComponent('Penutup →', 'next', {
        variant: 'primaryAction',
        x: POS.navX, y: POS.navY, width: POS.navW, height: POS.navH,
      }),
    ],
  },

  // ===== CLOSING (4) =====
  {
    id: 'penutup-terima-kasih',
    name: 'Penutup Terima Kasih',
    description: 'Judul "Terima Kasih" + sub-judul pesan penutup.',
    icon: '🎓',
    applicableRoles: ['closing'],
    pedagogicalReason: 'Penutup klasik dengan ucapan terima kasih. Cocok untuk MPI formal yang menekankan apresiasi.',
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
  {
    id: 'penutup-badge',
    name: 'Badge Selesai',
    description: 'Kartu "Selamat! Kamu menyelesaikan ..." dengan celebratory tone.',
    icon: '🏆',
    applicableRoles: ['closing'],
    pedagogicalReason: 'Badge "Selesai" sebagai apresiasi. Cocok untuk siswa muda atau MPI bergaya game-like supaya merasa berprestasi.',
    buildComponents: () => [
      createCardComponent(
        '🎉 Selamat! 🎉\n\nKamu telah menyelesaikan pembelajaran ini.\n\nKamu berhak atas badge "Siswa Hebat"!',
        {
          variant: 'exampleCard',
          title: '🏆 Badge Selesai',
          x: 200, y: 200, width: 880, height: 280,
        },
      ),
    ],
  },
  {
    id: 'penutup-rangkuman',
    name: 'Rangkuman 3 Poin',
    description: 'Kartu "3 hal kunci" yang harus siswa ingat dari pembelajaran.',
    icon: '📝',
    applicableRoles: ['closing'],
    pedagogicalReason: 'Rangkuman 3 poin kunci untuk menegaskan inti pembelajaran. Cocok untuk MPI yang ingin siswa ingat hal-hal penting.',
    buildComponents: () => [
      createTextComponent('closing', {
        variant: 'title',
        text: '3 Hal yang Harus Diingat',
        x: 80, y: POS.titleY, width: POS.fullWidth, height: POS.titleH,
      }),
      createCardComponent(
        '1. Poin kunci pertama dari pembelajaran.\n\n2. Poin kunci kedua dari pembelajaran.\n\n3. Poin kunci ketiga dari pembelajaran.\n\nTuliskan kembali dengan kalimatmu sendiri di buku catatan.',
        {
          variant: 'infoCard',
          title: 'Rangkuman',
          x: 100, y: 140, width: 1080, height: 400,
        },
      ),
    ],
  },
  {
    id: 'penutup-ajakan',
    name: 'Ajakan Praktik',
    description: 'Kartu ajakan untuk praktik di kehidupan sehari-hari.',
    icon: '🌟',
    applicableRoles: ['closing'],
    pedagogicalReason: 'Ajakan praktik di kehidupan sehari-hari. Cocok untuk pembelajaran berorientasi aksi yang ingin siswa terapkan.',
    buildComponents: () => [
      createTextComponent('closing', {
        variant: 'title',
        text: 'Sekarang Giliranmu!',
        x: 80, y: POS.titleY, width: POS.fullWidth, height: POS.titleH,
      }),
      createCardComponent(
        'Pelajaran ini tidak berhenti di kelas.\n\nMulai hari ini, coba lakukan satu hal kecil yang kamu pelajari.\n\nContoh:\n• Sapa guru dengan sopan saat masuk kelas.\n• Patuhi aturan antri di kantin.\n• Bantu teman yang kesulitan.\n\nApa yang akan kamu lakukan hari ini?',
        {
          variant: 'importantNote',
          title: '🌟 Ajakan Praktik',
          x: 100, y: 140, width: 1080, height: 420,
        },
      ),
    ],
  },

  // ===== LEARNING BRIDGE (3) =====
  // LXC-03: Jembatan Belajar untuk transisi antar scene.
  // Applicable ke 7 role: starter, material, activity, quiz, reflection,
  // learningObjectives, closing.
  {
    id: 'bridge-transisi',
    name: 'Jembatan Transisi',
    description: 'Pesan singkat penghubung antar bagian + tombol lanjut.',
    icon: '🔀',
    applicableRoles: ['starter', 'material', 'activity', 'quiz', 'reflection', 'learningObjectives', 'closing'],
    pedagogicalReason: 'Mencegah lompatan mendadak antar scene. Cocok dipakai di tengah halaman ketika guru ingin menyampaikan "kita sudah selesai X, sekarang lanjut ke Y".',
    buildComponents: () => [
      createLearningBridgeComponent({
        variant: 'transition',
        title: 'Lanjut ke Bagian Berikutnya',
        message: 'Kamu sudah selesai dengan bagian ini. Sekarang kita lanjut ke bagian berikutnya yang masih berkaitan.',
        nextButtonLabel: 'Lanjut →',
        x: 200, y: 250, width: 880, height: 200,
      }),
      createNavigationComponent('Lanjut →', 'next', {
        variant: 'primaryAction',
        x: POS.navX, y: POS.navY, width: POS.navW, height: POS.navH,
      }),
    ],
  },
  {
    id: 'bridge-recap',
    name: 'Jembatan Recap',
    description: 'Ringkasan apa yang baru dipelajari + tombol lanjut.',
    icon: '✅',
    applicableRoles: ['starter', 'material', 'activity', 'quiz', 'reflection', 'learningObjectives', 'closing'],
    pedagogicalReason: 'Membantu siswa mengkonsolidasikan apa yang baru dipelajari sebelum melangkah. Cocok di akhir scene pembelajaran (materi/aktivitas/kuis) sebelum refleksi atau penutup.',
    buildComponents: () => [
      createLearningBridgeComponent({
        variant: 'recap',
        title: 'Apa yang Sudah Kita Pelajari?',
        message: 'Sebelum lanjut, mari kita ingat sekilas:\n\n• Poin pertama yang dipelajari\n• Poin kedua yang dipelajari\n• Poin ketiga yang dipelajari\n\nApakah kamu sudah paham ketiganya? Kalau ya, kita lanjut.',
        nextButtonLabel: 'Saya Sudah Paham →',
        x: 200, y: 220, width: 880, height: 260,
      }),
      createNavigationComponent('Lanjut →', 'next', {
        variant: 'primaryAction',
        x: POS.navX, y: POS.navY, width: POS.navW, height: POS.navH,
      }),
    ],
  },
  {
    id: 'bridge-preview',
    name: 'Jembatan Preview',
    description: 'Intipan apa yang akan datang di bagian berikutnya + tombol lanjut.',
    icon: '👀',
    applicableRoles: ['starter', 'material', 'activity', 'quiz', 'reflection', 'learningObjectives', 'closing'],
    pedagogicalReason: 'Membangun ekspektasi dan rasa ingin tahu siswa sebelum masuk ke scene berikutnya. Cocok dipakai di akhir halaman untuk "menggoda" siswa dengan apa yang akan dipelajari berikutnya.',
    buildComponents: () => [
      createLearningBridgeComponent({
        variant: 'preview',
        title: 'Selanjutnya Kita Akan...',
        message: 'Di bagian berikutnya, kita akan mempelajari:\n\n• Hal baru yang menarik\n• Hubungannya dengan yang baru dipelajari\n• Latihan untuk menguji pemahaman\n\nSiap? Yuk lanjut!',
        nextButtonLabel: 'Lanjut →',
        x: 200, y: 220, width: 880, height: 260,
      }),
      createNavigationComponent('Lanjut →', 'next', {
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
