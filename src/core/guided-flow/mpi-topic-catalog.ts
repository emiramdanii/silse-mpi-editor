/**
 * MPI Topic Catalog (GUIDED-MPI-FLOW-01).
 *
 * Layer: core/guided-flow (pure data, no React/DOM)
 * Allowed imports: ../types
 *
 * Kontrak (GUIDED-MPI-FLOW-01 Scope 1):
 *   Predefined topik per mapel/fase. Guru pilih dari katalog, lalu engine
 *   generate paket MPI lengkap (10 halaman) berdasarkan topik + kurikulum.
 *
 *   V1: 3 mapel × 1-2 topik = 4 topik predefined.
 *   V2: lebih banyak topik + custom topik bebas.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MpiTopic = {
  id: string;
  mapel: string;
  grade: string;
  phase: string;
  topic: string;
  description: string;
  objectives: string[];
  /** Suggested material summary for the material page. */
  materialSummary: string;
  /** Suggested quiz question (prompt + choices + correct + feedback). */
  quizPrompt: string;
  quizChoices: string[];
  quizCorrectIndex: number;
  quizFeedbackCorrect: string;
  quizFeedbackWrong: string;
  /** Suggested game mission prompts. */
  gameMissions: Array<{ prompt: string; choices: string[]; correctIndex: number; feedbackCorrect: string; feedbackWrong: string }>;
  /** Suggested starter prompt. */
  starterPrompt: string;
  /** Suggested reflection prompts. */
  reflectionPrompts: string[];
};

// ---------------------------------------------------------------------------
// 4 Predefined Topics
// ---------------------------------------------------------------------------

export const MPI_TOPIC_CATALOG: readonly MpiTopic[] = [
  {
    id: 'ppkn-7-norma',
    mapel: 'PPKn',
    grade: '7',
    phase: 'D',
    topic: 'Hidup Tertib dengan Norma',
    description: 'Memahami pengertian, jenis, dan pentingnya norma dalam kehidupan bermasyarakat.',
    objectives: [
      'Menjelaskan pengertian norma dalam kehidupan sehari-hari.',
      'Mengidentifikasi jenis-jenis norma yang berlaku di masyarakat.',
      'Menunjukkan sikap tertib dalam menjalankan norma.',
    ],
    materialSummary: 'Norma adalah aturan atau ketentuan yang berlaku di masyarakat untuk mengatur perilaku anggotanya. Jenis-jenis norma: Norma Agama, Norma Kesusilaan, Norma Kesopanan, Norma Hukum. Setiap norma memiliki sanksi yang berbeda — norma hukum memiliki sanksi paling tegas karena ditegakkan oleh negara.',
    quizPrompt: 'Norma yang berasal dari Tuhan dan mengatur hubungan manusia dengan Tuhan disebut...',
    quizChoices: ['Norma Agama', 'Norma Kesusilaan', 'Norma Kesopanan', 'Norma Hukum'],
    quizCorrectIndex: 0,
    quizFeedbackCorrect: 'Benar! Norma agama berasal dari Tuhan dan mengatur hubungan manusia dengan Tuhan.',
    quizFeedbackWrong: 'Belum tepat. Norma agama mengatur hubungan dengan Tuhan.',
    gameMissions: [
      {
        prompt: 'Berdiri saat guru masuk kelas adalah contoh norma...',
        choices: ['Kesopanan', 'Hukum', 'Agama'],
        correctIndex: 0,
        feedbackCorrect: 'Benar! Itu norma kesopanan di sekolah.',
        feedbackWrong: 'Belum tepat. Itu contoh tata krama di sekolah.',
      },
      {
        prompt: 'Mencuri dilarang oleh...',
        choices: ['Norma Agama saja', 'Norma Hukum saja', 'Semua norma'],
        correctIndex: 2,
        feedbackCorrect: 'Tepat! Mencuri melanggar semua norma.',
        feedbackWrong: 'Belum lengkap. Mencuri melanggar semua jenis norma.',
      },
    ],
    starterPrompt: 'Pernahkah kamu melihat seseorang melanggar aturan? Apa yang terjadi?',
    reflectionPrompts: [
      'Norma apa yang sudah aku jalankan dengan baik?',
      'Norma apa yang masih sering aku langgar?',
      'Apa yang akan aku lakukan untuk hidup lebih tertib?',
    ],
  },
  {
    id: 'ipa-7-zat',
    mapel: 'IPA',
    grade: '7',
    phase: 'D',
    topic: 'Zat dan Perubahannya',
    description: 'Memahami wujud zat, perubahan wujud, dan sifat-sifat zat.',
    objectives: [
      'Menjelaskan tiga wujud zat dan sifat-sifatnya.',
      'Mengidentifikasi perubahan wujud zat dalam kehidupan sehari-hari.',
      'Melakukan eksperimen sederhana untuk mengamati perubahan wujud zat.',
    ],
    materialSummary: 'Zat memiliki tiga wujud: padat, cair, dan gas. Zat padat bentuk dan volume tetap. Zat cair bentuk berubah, volume tetap. Gas bentuk dan volume berubah. Perubahan wujud: mencair (padat→cair), membeku (cair→padat), menguap (cair→gas), mengembun (gas→cair), menyublim (padat→gas), mengkristal (gas→padat).',
    quizPrompt: 'Perubahan wujud dari padat langsung menjadi gas disebut...',
    quizChoices: ['Menguap', 'Menyublim', 'Mengembun', 'Membeku'],
    quizCorrectIndex: 1,
    quizFeedbackCorrect: 'Benar! Menyublim adalah perubahan dari padat langsung menjadi gas.',
    quizFeedbackWrong: 'Belum tepat. Menyublim = padat → gas langsung.',
    gameMissions: [
      {
        prompt: 'Es batu mencair menjadi air adalah perubahan...',
        choices: ['Padat → Cair', 'Cair → Gas', 'Gas → Padat'],
        correctIndex: 0,
        feedbackCorrect: 'Benar! Es batu (padat) mencair menjadi air (cair).',
        feedbackWrong: 'Belum tepat. Es batu adalah zat padat yang mencair.',
      },
      {
        prompt: 'Kapur barus di lemari pakaian adalah contoh...',
        choices: ['Menguap', 'Menyublim', 'Membeku'],
        correctIndex: 1,
        feedbackCorrect: 'Tepat! Kapur barus menyublim dari padat ke gas.',
        feedbackWrong: 'Belum tepat. Kapur barus adalah contoh menyublim.',
      },
    ],
    starterPrompt: 'Pernahkah kamu melihat es batu mencair? Mengapa itu terjadi?',
    reflectionPrompts: [
      'Wujud zat apa yang paling menarik untukku?',
      'Perubahan wujud apa yang sering aku lihat?',
      'Eksperimen apa yang ingin aku coba?',
    ],
  },
  {
    id: 'matematika-7-aljabar',
    mapel: 'Matematika',
    grade: '7',
    phase: 'D',
    topic: 'Bentuk Aljabar',
    description: 'Memahami variabel, koefisien, konstanta, dan operasi bentuk aljabar.',
    objectives: [
      'Menjelaskan unsur-unsur bentuk aljabar (variabel, koefisien, konstanta).',
      'Melakukan operasi penjumlahan dan pengurangan bentuk aljabar.',
      'Menyelesaikan masalah kontekstual dengan bentuk aljabar.',
    ],
    materialSummary: 'Bentuk aljabar terdiri dari variabel (huruf), koefisien (angka di depan variabel), dan konstanta (angka tanpa variabel). Contoh: 3x + 5 → 3 adalah koefisien, x adalah variabel, 5 adalah konstanta. Operasi: 2x + 3x = 5x (gabungkan suku sejenis). 2x + 3y tidak bisa digabungkan (suku tidak sejenis).',
    quizPrompt: 'Pada bentuk aljabar 4x + 7, angka 7 disebut...',
    quizChoices: ['Variabel', 'Koefisien', 'Konstanta', 'Suku'],
    quizCorrectIndex: 2,
    quizFeedbackCorrect: 'Benar! 7 adalah konstanta (angka tanpa variabel).',
    quizFeedbackWrong: 'Belum tepat. 7 adalah konstanta karena tidak memiliki variabel.',
    gameMissions: [
      {
        prompt: 'Hasil dari 3x + 2x adalah...',
        choices: ['5x', '6x', '5', 'xy'],
        correctIndex: 0,
        feedbackCorrect: 'Benar! 3x + 2x = 5x (suku sejenis digabungkan).',
        feedbackWrong: 'Belum tepat. Suku sejenis digabungkan: 3+2=5, jadi 5x.',
      },
      {
        prompt: 'Pada 5y - 3, angka 5 adalah...',
        choices: ['Variabel', 'Koefisien', 'Konstanta'],
        correctIndex: 1,
        feedbackCorrect: 'Tepat! 5 adalah koefisien (angka di depan variabel).',
        feedbackWrong: 'Belum tepat. 5 adalah koefisien karena di depan variabel y.',
      },
    ],
    starterPrompt: 'Pernahkah kamu melihat huruf dalam matematika? Apa fungsinya?',
    reflectionPrompts: [
      'Bagian aljabar yang sudah aku pahami?',
      'Bagian aljabar yang masih aku bingungkan?',
      'Masalah apa yang bisa kuselesaikan dengan aljabar?',
    ],
  },
  {
    id: 'bahasa-7-narasi',
    mapel: 'Bahasa Indonesia',
    grade: '7',
    phase: 'D',
    topic: 'Teks Narasi',
    description: 'Memahami struktur dan ciri kebahasaan teks narasi.',
    objectives: [
      'Menjelaskan struktur teks narasi (orientasi, komplikasi, resolusi).',
      'Mengidentifikasi ciri kebahasaan teks narasi.',
      'Menyusun teks narasi pendek dengan struktur yang benar.',
    ],
    materialSummary: 'Teks narasi adalah teks yang menceritakan peristiwa atau kejadian. Struktur: Orientasi (pengenalan tokoh, latar, suasana), Komplikasi (masalah yang muncul), Resolusi (penyelesaian masalah). Ciri kebahasaan: menggunakan kata ganti orang (saya, dia), kata kerja aksi (berlari, melompat), kata penghubung waktu (kemudian, setelah itu).',
    quizPrompt: 'Bagian teks narasi yang berisi pengenalan tokoh dan latar disebut...',
    quizChoices: ['Komplikasi', 'Orientasi', 'Resolusi', 'Koda'],
    quizCorrectIndex: 1,
    quizFeedbackCorrect: 'Benar! Orientasi adalah bagian awal yang memperkenalkan tokoh dan latar.',
    quizFeedbackWrong: 'Belum tepat. Orientasi = pengenalan tokoh, latar, dan suasana.',
    gameMissions: [
      {
        prompt: '"Kemudian" dalam teks narasi termasuk kata...',
        choices: ['Penghubung waktu', 'Kerja aksi', 'Ganti orang'],
        correctIndex: 0,
        feedbackCorrect: 'Benar! "Kemudian" adalah kata penghubung waktu.',
        feedbackWrong: 'Belum tepat. "Kemudian" menunjukkan urutan waktu kejadian.',
      },
      {
        prompt: 'Bagian teks narasi tempat masalah muncul disebut...',
        choices: ['Orientasi', 'Komplikasi', 'Resolusi'],
        correctIndex: 1,
        feedbackCorrect: 'Tepat! Komplikasi adalah bagian di mana masalah muncul.',
        feedbackWrong: 'Belum tepat. Komplikasi = masalah yang muncul dalam cerita.',
      },
    ],
    starterPrompt: 'Apa cerita favoritmu? Mengapa kamu menyukainya?',
    reflectionPrompts: [
      'Struktur teks narasi mana yang paling mudah untukku?',
      'Ciri kebahasaan apa yang masih perlu kuperhatikan?',
      'Cerita apa yang ingin aku tulis?',
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getTopicById(id: string): MpiTopic | undefined {
  return MPI_TOPIC_CATALOG.find((t) => t.id === id);
}

export function getTopicsByMapel(mapel: string): MpiTopic[] {
  return MPI_TOPIC_CATALOG.filter((t) => t.mapel === mapel);
}

export function getUniqueMapelList(): string[] {
  return [...new Set(MPI_TOPIC_CATALOG.map((t) => t.mapel))];
}
