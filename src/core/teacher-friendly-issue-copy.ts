/**
 * Teacher Friendly Issue Copy (TEACHER-FRIENDLY-ISSUE-COPY-01).
 *
 * Layer: core (pure function, no React/DOM)
 * Allowed imports: none (pure data + logic)
 *
 * Kontrak (TEACHER-FRIENDLY-ISSUE-COPY-01):
 *   Pure helper yang mengubah pesan teknis (code/message) menjadi arahan
 *   ramah guru: title + message + suggestion.
 *
 *   Prinsip:
 *     - Raw code (OBJECTIVE_NOT_COVERED, OUT_OF_CANVAS, dll) TIDAK boleh
 *       jadi teks utama. Boleh muncul sebagai chip/meta kecil.
 *     - Setiap issue utama punya saran konkret.
 *     - Bahasa Indonesia.
 *     - Fallback aman untuk code/pattern tidak dikenal.
 *
 *   Tidak mengubah checker logic. Tidak menambah schema.
 *   Hanya mapping copy.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TeacherFriendlyIssueInput = {
  source?: 'mpi-standard' | 'layout' | 'alignment' | 'visual' | 'page-status' | string;
  code?: string;
  message: string;
  pageTitle?: string;
  level?: 'ok' | 'warning' | 'fatal' | 'error';
};

export type TeacherFriendlyIssueCopy = {
  /** Short friendly title (3-8 words). */
  title: string;
  /** Friendly message explaining what's wrong (1-2 sentences). */
  message: string;
  /** Concrete suggestion for the teacher (1 sentence, starts with verb). */
  suggestion: string;
};

// ---------------------------------------------------------------------------
// Mapping table — by code
// ---------------------------------------------------------------------------

const COPY_BY_CODE: Record<string, TeacherFriendlyIssueCopy> = {
  // === Alignment ===
  NO_OBJECTIVES: {
    title: 'Tujuan pembelajaran belum diisi',
    message: 'Media belum memiliki tujuan pembelajaran.',
    suggestion: 'Isi tujuan pembelajaran agar materi, aktivitas, dan refleksi bisa dicek kesesuaiannya.',
  },
  OBJECTIVE_NOT_COVERED: {
    title: 'Ada tujuan yang belum tercover',
    message: 'Ada tujuan pembelajaran yang belum muncul di materi, aktivitas, kuis, atau refleksi.',
    suggestion: 'Tambahkan contoh, penjelasan, pertanyaan, atau refleksi yang sesuai dengan tujuan tersebut.',
  },
  OBJECTIVE_DUPLICATE_ID: {
    title: 'Ada tujuan pembelajaran ganda',
    message: 'Ada ID tujuan pembelajaran yang duplikat.',
    suggestion: 'Periksa daftar tujuan pembelajaran agar setiap tujuan memiliki penanda unik.',
  },
  OBJECTIVE_TOO_SHORT: {
    title: 'Tujuan pembelajaran terlalu umum',
    message: 'Ada tujuan pembelajaran yang terlalu pendek atau terlalu umum.',
    suggestion: 'Tulis tujuan lebih spesifik, misalnya menggunakan kata kerja dan konteks materi.',
  },
  ASSESSMENT_NOT_LINKED: {
    title: 'Kuis belum terhubung ke tujuan',
    message: 'Ada kuis atau cek pemahaman yang belum jelas hubungannya dengan tujuan pembelajaran.',
    suggestion: 'Sesuaikan pertanyaan agar memuat kata kunci atau kemampuan yang ada di tujuan.',
  },
  MATERIAL_NOT_LINKED: {
    title: 'Materi belum terhubung ke tujuan',
    message: 'Ada halaman materi yang belum jelas hubungannya dengan tujuan pembelajaran.',
    suggestion: 'Tambahkan penjelasan, contoh, atau kata kunci sesuai tujuan.',
  },
  REFLECTION_NOT_LINKED: {
    title: 'Refleksi belum terhubung ke tujuan',
    message: 'Ada refleksi yang belum mengajak siswa kembali ke tujuan pembelajaran.',
    suggestion: 'Ubah pertanyaan refleksi agar siswa menghubungkan materi dengan tindakan atau pemahaman.',
  },

  // === Layout ===
  OUT_OF_CANVAS: {
    title: 'Ada elemen keluar layar',
    message: 'Ada elemen yang berada di luar area 16:9.',
    suggestion: 'Geser atau kecilkan elemen agar tetap terlihat saat diproyeksikan.',
  },
  LARGE_OVERLAP: {
    title: 'Ada elemen saling menumpuk',
    message: 'Ada elemen yang saling menutupi dan bisa mengganggu keterbacaan.',
    suggestion: 'Rapikan posisi elemen atau beri jarak antar komponen.',
  },
  TOO_DENSE: {
    title: 'Halaman terlalu padat',
    message: 'Ada halaman yang berisi terlalu banyak elemen.',
    suggestion: 'Kurangi elemen, ringkas teks, atau bagi materi ke halaman lain.',
  },
  TOO_CLOSE_EDGE: {
    title: 'Elemen terlalu dekat tepi',
    message: 'Ada elemen yang terlalu mepet tepi layar.',
    suggestion: 'Geser elemen ke tengah agar aman saat ditampilkan di proyektor.',
  },
  TOO_SMALL: {
    title: 'Elemen terlalu kecil',
    message: 'Ada elemen yang ukurannya terlalu kecil.',
    suggestion: 'Perbesar elemen agar terlihat jelas dari jarak jauh.',
  },
  NAV_AT_EDGE: {
    title: 'Tombol navigasi terlalu mepet tepi',
    message: 'Tombol navigasi terlalu dekat dengan tepi bawah layar.',
    suggestion: 'Naikkan tombol navigasi sedikit agar mudah dijangkau.',
  },
};

// ---------------------------------------------------------------------------
// Pattern matching for messages without codes (MPI standard, visual, page-status)
// ---------------------------------------------------------------------------

type PatternRule = {
  test: (message: string) => boolean;
  copy: TeacherFriendlyIssueCopy;
};

const PATTERN_RULES: PatternRule[] = [
  // === Visual / contrast ===
  {
    test: (m) => /kontras rendah/i.test(m),
    copy: {
      title: 'Teks sulit dibaca',
      message: 'Ada teks yang kontrasnya terlalu rendah dengan latar.',
      suggestion: 'Gunakan warna teks yang lebih terang/gelap atau tambahkan overlay latar.',
    },
  },
  // === MPI standard — feedback ===
  {
    test: (m) => /belum punya umpan balik|umpan balik.*terlalu (pendek|lemah)|feedback/i.test(m),
    copy: {
      title: 'Umpan balik kuis belum lengkap',
      message: 'Ada pertanyaan yang belum memiliki umpan balik benar/salah yang cukup.',
      suggestion: 'Tambahkan umpan balik singkat agar siswa tahu alasan jawabannya.',
    },
  },
  // === MPI standard — navigation ===
  {
    test: (m) => /belum punya tombol navigasi|navigasi/i.test(m),
    copy: {
      title: 'Navigasi halaman belum lengkap',
      message: 'Ada halaman yang belum memiliki arahan lanjut.',
      suggestion: 'Tambahkan tombol atau petunjuk agar guru/siswa tahu langkah berikutnya.',
    },
  },
  // === MPI standard — cover ===
  {
    test: (m) => /belum ada halaman cover|cover belum punya/i.test(m),
    copy: {
      title: 'Halaman pembuka belum lengkap',
      message: 'Media belum memiliki halaman pembuka yang jelas.',
      suggestion: 'Tambahkan judul, mapel, kelas, atau pengantar singkat.',
    },
  },
  // === MPI standard — learning objectives ===
  {
    test: (m) => /belum ada halaman tujuan|tujuan pembelajaran belum punya|belum ada tujuan pembelajaran/i.test(m),
    copy: {
      title: 'Halaman tujuan belum lengkap',
      message: 'Media belum menampilkan tujuan pembelajaran dengan jelas.',
      suggestion: 'Tambahkan halaman atau komponen tujuan pembelajaran.',
    },
  },
  // === MPI standard — material ===
  {
    test: (m) => /belum ada halaman materi|materi belum punya/i.test(m),
    copy: {
      title: 'Materi belum lengkap',
      message: 'Media belum memiliki halaman materi yang cukup.',
      suggestion: 'Tambahkan ringkasan materi, contoh, atau penjelasan inti.',
    },
  },
  // === MPI standard — quiz/question ===
  {
    test: (m) => /belum ada.*kuis|belum ada pertanyaan|belum ada cek pemahaman|kuis belum punya/i.test(m),
    copy: {
      title: 'Cek pemahaman belum ada',
      message: 'Media belum memiliki pertanyaan untuk membantu siswa menguji pemahaman.',
      suggestion: 'Tambahkan satu pertanyaan ringan agar siswa bisa mengecek diri.',
    },
  },
  // === MPI standard — game/activity ===
  {
    test: (m) => /belum ada aktivitas|belum ada game|aktivitas belum punya/i.test(m),
    copy: {
      title: 'Aktivitas interaktif belum ada',
      message: 'Media belum memiliki aktivitas atau game untuk memperkuat pemahaman.',
      suggestion: 'Tambahkan satu game atau latihan interaktif sederhana.',
    },
  },
  // === MPI standard — guide ===
  {
    test: (m) => /belum ada halaman panduan|panduan belum punya/i.test(m),
    copy: {
      title: 'Halaman panduan belum ada',
      message: 'Media belum memiliki halaman panduan penggunaan.',
      suggestion: 'Tambahkan halaman panduan singkat agar siswa tahu cara belajar.',
    },
  },
  // === MPI standard — menu ===
  {
    test: (m) => /belum ada halaman menu|menu belum punya/i.test(m),
    copy: {
      title: 'Halaman menu belum ada',
      message: 'Media belum memiliki halaman menu materi.',
      suggestion: 'Tambahkan halaman menu agar siswa bisa melihat peta pembelajaran.',
    },
  },
  // === MPI standard — closing ===
  {
    test: (m) => /belum ada halaman penutup|penutup belum punya/i.test(m),
    copy: {
      title: 'Halaman penutup belum ada',
      message: 'Media belum memiliki halaman penutup.',
      suggestion: 'Tambahkan halaman penutup dengan rangkuman atau ucapan terima kasih.',
    },
  },
  // === MPI standard — reflection ===
  {
    test: (m) => /refleksi belum punya/i.test(m),
    copy: {
      title: 'Halaman refleksi belum lengkap',
      message: 'Ada halaman refleksi yang belum memiliki konten.',
      suggestion: 'Tambahkan pertanyaan refleksi yang mengajak siswa merenungkan pembelajaran.',
    },
  },
  // === MPI standard — starter ===
  {
    test: (m) => /pemantik belum punya/i.test(m),
    copy: {
      title: 'Halaman pemantik belum lengkap',
      message: 'Ada halaman pemantik yang belum memiliki konten.',
      suggestion: 'Tambahkan pertanyaan pemantik agar siswa mulai berpikir tentang materi.',
    },
  },
  // === MPI standard — curriculum ===
  {
    test: (m) => /kurikulum|mapel|kelas|fase|topik/i.test(m),
    copy: {
      title: 'Identitas kurikulum belum lengkap',
      message: 'Media belum memiliki identitas kurikulum yang lengkap.',
      suggestion: 'Isi mapel, kelas, fase, dan topik agar media mudah diidentifikasi.',
    },
  },
];

// ---------------------------------------------------------------------------
// Fallback copy for unknown issues
// ---------------------------------------------------------------------------

const FALLBACK_COPY: TeacherFriendlyIssueCopy = {
  title: 'Ada yang perlu diperhatikan',
  message: 'Ada hal yang perlu diperiksa pada media pembelajaran ini.',
  suggestion: 'Periksa halaman terkait dan lengkapi konten sesuai kebutuhan.',
};

// ---------------------------------------------------------------------------
// Main: getTeacherFriendlyIssueCopy
// ---------------------------------------------------------------------------

/**
 * Convert a technical issue (code/message) into teacher-friendly copy.
 * Pure function — does not mutate input, does not call UI.
 */
export function getTeacherFriendlyIssueCopy(
  issue: TeacherFriendlyIssueInput,
): TeacherFriendlyIssueCopy {
  // 1. Try exact code match first.
  if (issue.code && COPY_BY_CODE[issue.code]) {
    return COPY_BY_CODE[issue.code];
  }

  // 2. Try pattern matching on message (for issues without codes).
  const messageLower = issue.message.toLowerCase();
  for (const rule of PATTERN_RULES) {
    if (rule.test(messageLower)) {
      return rule.copy;
    }
  }

  // 3. Fallback for unknown issues.
  return FALLBACK_COPY;
}

// ---------------------------------------------------------------------------
// Helper: format as single line (for confirm dialogs, tooltips)
// ---------------------------------------------------------------------------

/**
 * Format an issue as a single readable line: "Title — Suggestion".
 * Useful for confirm dialogs where space is limited.
 */
export function formatTeacherFriendlyIssueLine(
  issue: TeacherFriendlyIssueInput,
): string {
  const copy = getTeacherFriendlyIssueCopy(issue);
  return `${copy.title} — ${copy.suggestion}`;
}

// ---------------------------------------------------------------------------
// Helper: format as multi-line block (for detail panels)
// ---------------------------------------------------------------------------

/**
 * Format an issue as a multi-line block:
 *   Title
 *   Message
 *   Saran: Suggestion
 */
export function formatTeacherFriendlyIssueBlock(
  issue: TeacherFriendlyIssueInput,
): string {
  const copy = getTeacherFriendlyIssueCopy(issue);
  return `${copy.title}\n${copy.message}\nSaran: ${copy.suggestion}`;
}
