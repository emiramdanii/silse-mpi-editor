/**
 * Learning Experience Contract (LXC-01).
 *
 * Layer: core (contract only — NO runtime implementation in this batch)
 * Allowed imports: ./types (type-only)
 *
 * Kontrak (LXC-01):
 *   SILSE bukan pembuat slide. SILSE adalah pembuat pengalaman belajar
 *   interaktif. Komponen resmi baru didefinisikan di sini sebagai CONTRACT
 *   (spec), bukan implementasi runtime. Implementasi runtime datang di
 *   batch berikutnya setelah kontrak ini di-ACCEPT.
 *
 *   10 komponen resmi baru:
 *     1.  Info Berlapis        — layered info / progressive disclosure
 *     2.  Menu Belajar         — peta belajar siswa
 *     3.  Pemantik Interaktif  — starter interaktif
 *     4.  Aktivitas Interaktif — activity interaktif
 *     5.  Kuis Interaktif      — quiz interaktif
 *     6.  Refleksi Interaktif  — reflection interaktif
 *     7.  Hasil & Apresiasi    — results + appreciation screen
 *     8.  Jembatan Belajar     — learning bridge antar scene
 *     9.  Indikator Belajar    — runtime HUD (progress, score, badge)
 *    10.  Efek Apresiasi       — confetti / celebratory effects
 *
 *   Setiap komponen punya 7 field wajib:
 *     - id                    — snake-case identifier
 *     - learningPurpose       — tujuan pembelajaran (pedagogis, bukan visual)
 *     - applicableRoles       — role halaman yang boleh memakai
 *     - variants              — variasi tampilan resmi
 *     - dataModel             — data model minimal (TypeScript type stub)
 *     - editorRules           — aturan editor (bagaimana guru mengedit)
 *     - previewExportRules    — aturan preview/export (bagaimana dirender)
 *     - constraints           — batasan agar tidak jadi komponen liar
 *
 *   Prinsip utama:
 *     - Guru memilih pola belajar, bukan menyusun kotak manual.
 *     - Satu komponen boleh punya banyak variasi tampilan.
 *     - Editor tidak boleh menampilkan semua isi panjang sekaligus.
 *     - Preview = Export (satu renderer, bukan dua).
 *     - Progress bar, score badge, badge apresiasi, dan confetti ringan
 *       harus masuk kontrak runtime, bukan ditempel manual di halaman.
 *
 *   STATUS: CONTRACT ONLY. Tidak ada runtime, tidak ada factory, tidak ada
 *   view component. Implementasi datang di batch berikutnya.
 *   Komponen-komponen ini BELUM ditambahkan ke COMPONENT_TYPES di types.ts —
 *   itu akan dilakukan saat implementasi runtime, setelah kontrak di-ACCEPT.
 */

import type { PageRole } from './types';

// =========================================================================
// Types
// =========================================================================

/** ID komponen (snake-case). */
export type ComponentId = string;

/** Variasi tampilan resmi untuk suatu komponen. */
export type ComponentVariant = {
  id: string;
  label: string;
  description: string;
};

/** Aturan editor untuk suatu komponen. */
export type EditorRules = {
  /** Apakah guru boleh menambah komponen ini manual via toolbar? */
  allowManualAdd: boolean;
  /** Apakah guru boleh edit isi langsung di canvas, atau hanya via Panel Isi? */
  inlineEditAllowed: boolean;
  /** Bagian mana di Panel Isi yang muncul saat komponen terpilih. */
  inspectorSections: string[];
  /** Apakah komponen ini bisa di-drag/resize di canvas? */
  draggable: boolean;
  /** Apakah komponen ini bisa dihapus? */
  deletable: boolean;
};

/** Aturan preview/export untuk suatu komponen. */
export type PreviewExportRules = {
  /** Apakah komponen ini punya runtime state (interaktif)? */
  hasRuntimeState: boolean;
  /** Apakah komponen ini menyumbang ke totalScore? */
  contributesToScore: boolean;
  /** Apakah komponen ini menyumbang ke progress belajar? */
  contributesToProgress: boolean;
  /** Apakah komponen ini trigger efek apresiasi (confetti, dll)? */
  triggersAppreciation: boolean;
  /** Apakah preview dan export memakai renderer yang sama? */
  previewEqualsExport: boolean;
};

/** Batasan agar komponen tidak jadi liar. */
export type ComponentConstraints = {
  /** Maksimum instans per halaman (0 = tidak terbatas). */
  maxInstancesPerPage: number;
  /** Apakah komponen boleh muncul di halaman terpandu (cover)? */
  allowedOnGuidedPages: boolean;
  /** Apakah komponen butuh komponen lain sebagai prerequisite? */
  requiresCompanion?: string[];
  /** Field yang TIDAK boleh di-set oleh guru (reserved runtime). */
  reservedRuntimeFields: string[];
};

/** Data model minimal — stub TypeScript type. */
export type DataModelStub = {
  /** Nama type (untuk dokumentasi). */
  typeName: string;
  /** Field-field minimal yang harus dimiliki data komponen. */
  fields: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
};

/** Spec lengkap untuk satu komponen resmi. */
export type LearningExperienceComponentSpec = {
  id: ComponentId;
  /** Nama ramah guru. */
  name: string;
  /** Emoji ikon. */
  icon: string;
  /** Tujuan pembelajaran (pedagogis, bukan visual). */
  learningPurpose: string;
  /** Role halaman yang boleh memakai komponen ini. */
  applicableRoles: PageRole[];
  /** Variasi tampilan resmi. */
  variants: ComponentVariant[];
  /** Data model minimal. */
  dataModel: DataModelStub;
  /** Aturan editor. */
  editorRules: EditorRules;
  /** Aturan preview/export. */
  previewExportRules: PreviewExportRules;
  /** Batasan agar tidak jadi komponen liar. */
  constraints: ComponentConstraints;
};

// =========================================================================
// 10 Komponen Resmi Baru
// =========================================================================

export const LEARNING_EXPERIENCE_COMPONENTS: readonly LearningExperienceComponentSpec[] = [

  // ----- 1. Info Berlapis -----
  {
    id: 'layered-info',
    name: 'Info Berlapis',
    icon: '📚',
    learningPurpose: 'Sajikan materi dalam lapisan progressive disclosure — siswa buka layer demi layer supaya tidak kewalahan dengan info sekaligus.',
    // LXC-01 Patch-1: tambah 'learningObjectives' — tujuan pembelajaran juga
    // bisa disajikan berlapis (sebelumnya/hari ini/berikutnya).
    applicableRoles: ['material', 'guide', 'menu', 'learningObjectives'],
    variants: [
      { id: 'accordion', label: 'Accordion', description: 'Layer bisa dilipat/dibuka satu per satu.' },
      { id: 'tabs', label: 'Tab', description: 'Layer sebagai tab horizontal.' },
      // LXC-01 Patch-1: variant tambahan supaya tidak sempit
      { id: 'iconTabs', label: 'Tab Ikon', description: 'Tab dengan ikon di tiap label — cocok untuk kategori visual.' },
      { id: 'stepper', label: 'Stepper', description: 'Layer sebagai langkah berurutan dengan nomor.' },
      { id: 'cardGrid', label: 'Kartu Grid', description: 'Layer sebagai kartu-kartu dalam grid — siswa klik untuk detail.' },
      { id: 'timeline', label: 'Linimasa', description: 'Layer sebagai titik-titik di linimasa — cocok untuk urutan kronologis.' },
    ],
    dataModel: {
      typeName: 'LayeredInfoComponent',
      fields: [
        { name: 'title', type: 'string', required: true, description: 'Judul utama komponen.' },
        { name: 'variant', type: "'accordion' | 'tabs' | 'iconTabs' | 'stepper' | 'cardGrid' | 'timeline'", required: true, description: 'Variasi tampilan.' },
        { name: 'layers', type: 'Array<{ id: string; title: string; body: string; icon?: string }>', required: true, description: 'Daftar lapisan info (icon opsional untuk iconTabs).' },
        { name: 'defaultOpenIndex', type: 'number | null', required: false, description: 'Index layer yang terbuka by default.' },
      ],
    },
    editorRules: {
      allowManualAdd: true,
      inlineEditAllowed: false,
      inspectorSections: ['Isi', 'Lapisan', 'Tampilan', 'Posisi & Ukuran'],
      draggable: true,
      deletable: true,
    },
    previewExportRules: {
      hasRuntimeState: true,
      contributesToScore: false,
      contributesToProgress: false,
      triggersAppreciation: false,
      previewEqualsExport: true,
    },
    constraints: {
      maxInstancesPerPage: 3,
      allowedOnGuidedPages: false,
      reservedRuntimeFields: [],
    },
  },

  // ----- 2. Menu Belajar -----
  {
    id: 'learning-menu',
    name: 'Menu Belajar',
    icon: '🗂️',
    learningPurpose: 'Peta belajar siswa — tunjukkan scene mana yang sudah selesai, sedang aktif, dan terkunci. Siswa boleh lompat ke scene yang sudah dibuka.',
    applicableRoles: ['menu', 'guide'],
    variants: [
      { id: 'grid', label: 'Grid', description: 'Kartu-kartu scene dalam grid.' },
      { id: 'list', label: 'Daftar', description: 'Daftar scene vertikal dengan status.' },
      { id: 'path', label: 'Jalur', description: 'Jalur belajar dengan panah antar scene.' },
    ],
    dataModel: {
      typeName: 'LearningMenuComponent',
      fields: [
        { name: 'title', type: 'string', required: true, description: 'Judul menu.' },
        { name: 'variant', type: "'grid' | 'list' | 'path'", required: true, description: 'Variasi tampilan.' },
        { name: 'items', type: 'Array<{ pageId: string; label: string; required: boolean }>', required: true, description: 'Daftar scene di menu.' },
        { name: 'unlockMode', type: "'sequential' | 'free'", required: true, description: 'Apakah scene terkunci berurutan atau bebas.' },
      ],
    },
    editorRules: {
      allowManualAdd: true,
      inlineEditAllowed: false,
      inspectorSections: ['Isi', 'Daftar Scene', 'Tampilan', 'Posisi & Ukuran'],
      draggable: true,
      deletable: true,
    },
    previewExportRules: {
      hasRuntimeState: true,
      contributesToScore: false,
      contributesToProgress: true,
      triggersAppreciation: false,
      previewEqualsExport: true,
    },
    constraints: {
      maxInstancesPerPage: 1,
      allowedOnGuidedPages: false,
      reservedRuntimeFields: ['visitedPages', 'unlockedPages'],
    },
  },

  // ----- 3. Pemantik Interaktif -----
  {
    id: 'interactive-starter',
    name: 'Pemantik Interaktif',
    icon: '💡',
    learningPurpose: 'Aktifkan pengetahuan awal siswa dengan interaksi singkat — pilih posisi, jawab poll, refleksi kasus, atau hadapi dilema sebelum materi.',
    applicableRoles: ['starter'],
    variants: [
      { id: 'poll', label: 'Mini Poll', description: 'Siswa pilih satu dari beberapa opsi.' },
      { id: 'stance', label: 'Setuju / Tidak', description: 'Siswa posisikan diri setuju/tidak pada pernyataan.' },
      { id: 'case', label: 'Kasus', description: 'Siswa baca kasus lalu refleksi singkat.' },
      // LXC-01 Patch-1: variant tambahan untuk skenario/dilema — kontrak tidak sempit
      { id: 'bigQuestion', label: 'Pertanyaan Besar', description: 'Pertanyaan terbuka yang memancing rasa ingin tahu sepanjang pembelajaran.' },
      { id: 'decisionScenario', label: 'Skenario Keputusan', description: 'Siswa hadapi skenario dan ambil keputusan dari beberapa pilihan.' },
      { id: 'dilemma', label: 'Dilema', description: 'Dilema dengan dua sisi sama-sama kuat — siswa pertimbangkan trade-off.' },
    ],
    dataModel: {
      typeName: 'InteractiveStarterComponent',
      fields: [
        { name: 'title', type: 'string', required: true, description: 'Judul pemantik.' },
        { name: 'variant', type: "'poll' | 'stance' | 'case' | 'bigQuestion' | 'decisionScenario' | 'dilemma'", required: true, description: 'Variasi interaksi.' },
        { name: 'prompt', type: 'string', required: true, description: 'Pertanyaan/pernyataan pemantik.' },
        { name: 'options', type: 'Array<{ id: string; label: string }>', required: false, description: 'Opsi pilihan (wajib untuk poll/stance/decisionScenario/dilemma).' },
        { name: 'caseText', type: 'string', required: false, description: 'Teks kasus/skenario (wajib untuk case/decisionScenario/dilemma).' },
        { name: 'reflectionPrompt', type: 'string', required: false, description: 'Prompt refleksi setelah siswa memilih.' },
      ],
    },
    editorRules: {
      allowManualAdd: true,
      inlineEditAllowed: false,
      inspectorSections: ['Isi', 'Opsi / Kasus', 'Tampilan', 'Posisi & Ukuran'],
      draggable: true,
      deletable: true,
    },
    previewExportRules: {
      hasRuntimeState: true,
      contributesToScore: false,
      contributesToProgress: true,
      triggersAppreciation: false,
      previewEqualsExport: true,
    },
    constraints: {
      maxInstancesPerPage: 1,
      allowedOnGuidedPages: false,
      reservedRuntimeFields: ['selectedOptionId', 'isAnswered'],
    },
  },

  // ----- 4. Aktivitas Interaktif -----
  {
    id: 'interactive-activity',
    name: 'Aktivitas Interaktif',
    icon: '🎯',
    learningPurpose: 'Latihan terstruktur di mana siswa mencoba konsep — drag-and-drop, matching, sequencing, atau eksplorasi.',
    applicableRoles: ['activity'],
    variants: [
      { id: 'matching', label: 'Matching', description: 'Cocokkan item dari dua kolom.' },
      { id: 'sequencing', label: 'Urutkan', description: 'Urutkan item sesuai urutan benar.' },
      { id: 'categorize', label: 'Kategorisasi', description: 'Kelompokkan item ke kategori.' },
    ],
    dataModel: {
      typeName: 'InteractiveActivityComponent',
      fields: [
        { name: 'title', type: 'string', required: true, description: 'Judul aktivitas.' },
        { name: 'variant', type: "'matching' | 'sequencing' | 'categorize'", required: true, description: 'Variasi aktivitas.' },
        { name: 'instruction', type: 'string', required: true, description: 'Instruksi singkat.' },
        { name: 'items', type: 'Array<{ id: string; label: string }>', required: true, description: 'Item yang dimanipulasi siswa.' },
        { name: 'targets', type: 'Array<{ id: string; label: string }>', required: true, description: 'Target kategori/urutan.' },
        { name: 'correctMatches', type: 'Record<string, string>', required: true, description: 'Pasangan benar itemId → targetId.' },
        { name: 'points', type: 'number', required: true, description: 'Skor maksimum.' },
        { name: 'feedbackCorrect', type: 'string', required: true, description: 'Feedback saat semua benar.' },
        { name: 'feedbackWrong', type: 'string', required: true, description: 'Feedback saat ada salah.' },
      ],
    },
    editorRules: {
      allowManualAdd: true,
      inlineEditAllowed: false,
      inspectorSections: ['Isi', 'Item & Target', 'Jawaban Benar', 'Feedback', 'Tampilan', 'Posisi & Ukuran'],
      draggable: true,
      deletable: true,
    },
    previewExportRules: {
      hasRuntimeState: true,
      contributesToScore: true,
      contributesToProgress: true,
      triggersAppreciation: true,
      previewEqualsExport: true,
    },
    constraints: {
      maxInstancesPerPage: 1,
      allowedOnGuidedPages: false,
      requiresCompanion: ['navigation'],
      reservedRuntimeFields: ['matches', 'isCompleted', 'score'],
    },
  },

  // ----- 5. Kuis Interaktif -----
  {
    id: 'interactive-quiz',
    name: 'Kuis Interaktif',
    icon: '✏️',
    learningPurpose: 'Evaluasi pemahaman dengan satu atau beberapa soal, langsung beri feedback, dan sumbangkan ke skor total.',
    applicableRoles: ['quiz'],
    variants: [
      { id: 'single', label: 'Satu Soal', description: 'Satu pertanyaan pilihan ganda.' },
      { id: 'multi', label: 'Multi Soal', description: 'Beberapa pertanyaan berurutan.' },
      { id: 'trueFalse', label: 'Benar / Salah', description: 'Pertanyaan benar/salah.' },
    ],
    dataModel: {
      typeName: 'InteractiveQuizComponent',
      fields: [
        { name: 'title', type: 'string', required: true, description: 'Judul kuis.' },
        { name: 'variant', type: "'single' | 'multi' | 'trueFalse'", required: true, description: 'Variasi kuis.' },
        { name: 'questions', type: 'Array<QuestionData>', required: true, description: 'Daftar soal.' },
        { name: 'scoringStyle', type: "'points' | 'stars' | 'badge'", required: true, description: 'Gaya skor.' },
      ],
    },
    editorRules: {
      allowManualAdd: true,
      inlineEditAllowed: false,
      inspectorSections: ['Isi', 'Daftar Soal', 'Skor', 'Tampilan', 'Posisi & Ukuran'],
      draggable: true,
      deletable: true,
    },
    previewExportRules: {
      hasRuntimeState: true,
      contributesToScore: true,
      contributesToProgress: true,
      triggersAppreciation: true,
      previewEqualsExport: true,
    },
    constraints: {
      maxInstancesPerPage: 1,
      allowedOnGuidedPages: false,
      requiresCompanion: ['navigation'],
      reservedRuntimeFields: ['answers', 'score', 'completed'],
    },
  },

  // ----- 6. Refleksi Interaktif -----
  {
    id: 'interactive-reflection',
    name: 'Refleksi Interaktif',
    icon: '🪞',
    learningPurpose: 'Bantu siswa merangkum dan menginternalisasi pembelajaran melalui struktur refleksi (3-2-1, kalimat rumpang, komitmen).',
    applicableRoles: ['reflection'],
    variants: [
      { id: 'rumpang', label: 'Kalimat Rumpang', description: 'Lengkapi kalimat tidak lengkap.' },
      { id: 'komitmen', label: 'Checklist Komitmen', description: 'Tandai komitmen tindakan nyata.' },
      { id: '3-2-1', label: 'Refleksi 3-2-1', description: '3 dipelajari, 2 menarik, 1 pertanyaan.' },
    ],
    dataModel: {
      typeName: 'InteractiveReflectionComponent',
      fields: [
        { name: 'title', type: 'string', required: true, description: 'Judul refleksi.' },
        { name: 'variant', type: "'rumpang' | 'komitmen' | '3-2-1'", required: true, description: 'Variasi refleksi.' },
        { name: 'prompt', type: 'string', required: true, description: 'Prompt refleksi utama.' },
        { name: 'items', type: 'Array<{ id: string; label: string }>', required: true, description: 'Item refleksi (kalimat/komitmen/pertanyaan).' },
      ],
    },
    editorRules: {
      allowManualAdd: true,
      inlineEditAllowed: false,
      inspectorSections: ['Isi', 'Item Refleksi', 'Tampilan', 'Posisi & Ukuran'],
      draggable: true,
      deletable: true,
    },
    previewExportRules: {
      hasRuntimeState: true,
      contributesToScore: false,
      contributesToProgress: true,
      triggersAppreciation: false,
      previewEqualsExport: true,
    },
    constraints: {
      maxInstancesPerPage: 1,
      allowedOnGuidedPages: false,
      reservedRuntimeFields: ['responses', 'completed'],
    },
  },

  // ----- 7. Hasil & Apresiasi -----
  {
    id: 'results-appreciation',
    name: 'Hasil & Apresiasi',
    icon: '🏆',
    learningPurpose: 'Tampilkan skor akhir, badge yang diraih, dan rangkuman pembelajaran. Trigger efek apresiasi (confetti) kalau siswa berhasil.',
    applicableRoles: ['closing'],
    variants: [
      { id: 'score', label: 'Skor', description: 'Skor angka + bintang.' },
      { id: 'badge', label: 'Badge', description: 'Badge yang diraih.' },
      { id: 'summary', label: 'Rangkuman', description: 'Rangkuman pembelajaran + skor.' },
    ],
    dataModel: {
      typeName: 'ResultsAppreciationComponent',
      fields: [
        { name: 'title', type: 'string', required: true, description: 'Judul layar hasil.' },
        { name: 'variant', type: "'score' | 'badge' | 'summary'", required: true, description: 'Variasi tampilan.' },
        { name: 'passingScore', type: 'number', required: false, description: 'Skor minimum untuk lulus (opsional).' },
        { name: 'badgeName', type: 'string', required: false, description: 'Nama badge yang diraih.' },
        { name: 'summaryPoints', type: 'Array<{ id: string; text: string }>', required: false, description: 'Poin rangkuman (untuk variant summary).' },
      ],
    },
    editorRules: {
      allowManualAdd: true,
      inlineEditAllowed: false,
      inspectorSections: ['Isi', 'Skor & Badge', 'Tampilan', 'Posisi & Ukuran'],
      draggable: true,
      deletable: true,
    },
    previewExportRules: {
      hasRuntimeState: true,
      contributesToScore: false,
      contributesToProgress: false,
      triggersAppreciation: true,
      previewEqualsExport: true,
    },
    constraints: {
      maxInstancesPerPage: 1,
      allowedOnGuidedPages: false,
      reservedRuntimeFields: ['finalScore', 'earnedBadge', 'isPassing'],
    },
  },

  // ----- 8. Jembatan Belajar -----
  {
    id: 'learning-bridge',
    name: 'Jembatan Belajar',
    icon: '🌉',
    learningPurpose: 'Penghubung antar scene yang menjelaskan transisi — "kamu sudah selesai X, sekarang kita lanjut ke Y karena Z". Mencegah lompatan mendadak.',
    // LXC-01 Patch-1: tambah 'learningObjectives' (sebelumnya/hari ini/berikutnya)
    // dan 'closing' (preview materi selanjutnya).
    applicableRoles: ['starter', 'material', 'activity', 'quiz', 'reflection', 'learningObjectives', 'closing'],
    variants: [
      { id: 'transition', label: 'Transisi', description: 'Pesan transisi singkat + tombol lanjut.' },
      { id: 'recap', label: 'Recap', description: 'Rangkuman singkat scene sebelumnya + tombol lanjut.' },
      { id: 'preview', label: 'Preview', description: 'Preview apa yang akan datang + tombol lanjut.' },
    ],
    dataModel: {
      typeName: 'LearningBridgeComponent',
      fields: [
        { name: 'title', type: 'string', required: true, description: 'Judul jembatan.' },
        { name: 'variant', type: "'transition' | 'recap' | 'preview'", required: true, description: 'Variasi jembatan.' },
        { name: 'message', type: 'string', required: true, description: 'Pesan jembatan.' },
        { name: 'nextButtonLabel', type: 'string', required: true, description: 'Label tombol lanjut.' },
      ],
    },
    editorRules: {
      allowManualAdd: true,
      inlineEditAllowed: false,
      inspectorSections: ['Isi', 'Tampilan', 'Posisi & Ukuran'],
      draggable: true,
      deletable: true,
    },
    previewExportRules: {
      hasRuntimeState: false,
      contributesToScore: false,
      contributesToProgress: true,
      triggersAppreciation: false,
      previewEqualsExport: true,
    },
    constraints: {
      maxInstancesPerPage: 1,
      allowedOnGuidedPages: false,
      reservedRuntimeFields: [],
    },
  },

  // ----- 9. Indikator Belajar (Runtime HUD) -----
  {
    id: 'learning-indicator',
    name: 'Indikator Belajar (Runtime HUD)',
    icon: '📊',
    learningPurpose: 'HUD runtime yang menampilkan progress belajar siswa — progress bar, score badge, badge apresiasi yang sudah diraih. TIDAK ditempel manual di halaman; otomatis muncul di seluruh scene.',
    applicableRoles: ['cover', 'guide', 'learningObjectives', 'menu', 'starter', 'material', 'activity', 'quiz', 'reflection', 'closing'],
    variants: [
      { id: 'progress-bar', label: 'Progress Bar', description: 'Bar progress scene yang sudah dikunjungi.' },
      { id: 'score-badge', label: 'Score Badge', description: 'Badge skor total di pojok.' },
      { id: 'badge-tray', label: 'Badge Tray', description: 'Deretan badge yang sudah diraih.' },
      { id: 'full-hud', label: 'Full HUD', description: 'Kombinasi progress + score + badge.' },
    ],
    dataModel: {
      typeName: 'LearningIndicatorComponent',
      fields: [
        { name: 'variant', type: "'progress-bar' | 'score-badge' | 'badge-tray' | 'full-hud'", required: true, description: 'Variasi HUD.' },
        { name: 'position', type: "'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'", required: true, description: 'Posisi HUD di layar.' },
        { name: 'visibleScenes', type: 'Array<PageRole>', required: false, description: 'Scene mana saja HUD ini tampil (kosong = semua).' },
      ],
    },
    editorRules: {
      // HUD TIDAK bisa ditambah manual — otomatis dari project setting
      allowManualAdd: false,
      inlineEditAllowed: false,
      inspectorSections: ['Tampilan', 'Posisi'],
      draggable: false,
      deletable: false,
    },
    previewExportRules: {
      hasRuntimeState: true,
      contributesToScore: false,
      contributesToProgress: false,
      triggersAppreciation: false,
      previewEqualsExport: true,
    },
    constraints: {
      maxInstancesPerPage: 1,
      allowedOnGuidedPages: true,
      reservedRuntimeFields: ['currentProgress', 'currentScore', 'earnedBadges'],
    },
  },

  // ----- 10. Efek Apresiasi -----
  {
    id: 'appreciation-effect',
    name: 'Efek Apresiasi',
    icon: '🎉',
    learningPurpose: 'Efek visual ringan (confetti, burst, shine) yang otomatis muncul saat siswa menyelesaikan milestone. TIDAK ditempel manual — trigger dari komponen lain.',
    applicableRoles: ['cover', 'guide', 'learningObjectives', 'menu', 'starter', 'material', 'activity', 'quiz', 'reflection', 'closing'],
    variants: [
      { id: 'confetti', label: 'Confetti', description: 'Confetti ringan berjatuhan.' },
      { id: 'burst', label: 'Burst', description: 'Burst partikel dari pusat.' },
      { id: 'shine', label: 'Shine', description: 'Kilauan singkat di elemen.' },
    ],
    dataModel: {
      typeName: 'AppreciationEffectComponent',
      fields: [
        { name: 'variant', type: "'confetti' | 'burst' | 'shine'", required: true, description: 'Variasi efek.' },
        { name: 'trigger', type: "'on-complete' | 'on-correct' | 'on-milestone'", required: true, description: 'Kapan efek muncul.' },
        { name: 'duration', type: 'number', required: false, description: 'Durasi efek dalam ms (default 2000).' },
      ],
    },
    editorRules: {
      // Efek TIDAK bisa ditambah manual — trigger otomatis dari komponen lain
      allowManualAdd: false,
      inlineEditAllowed: false,
      inspectorSections: ['Tampilan', 'Trigger'],
      draggable: false,
      deletable: false,
    },
    previewExportRules: {
      hasRuntimeState: true,
      contributesToScore: false,
      contributesToProgress: false,
      triggersAppreciation: true,
      previewEqualsExport: true,
    },
    constraints: {
      maxInstancesPerPage: 1,
      allowedOnGuidedPages: true,
      reservedRuntimeFields: ['activeEffect', 'triggerTime'],
    },
  },
];

// =========================================================================
// Helpers
// =========================================================================

/** Dapatkan spec komponen berdasarkan ID. */
export function getComponentSpec(id: string): LearningExperienceComponentSpec | undefined {
  return LEARNING_EXPERIENCE_COMPONENTS.find((c) => c.id === id);
}

/** Dapatkan semua komponen yang applicable untuk suatu role. */
export function getComponentsForRole(role: PageRole): LearningExperienceComponentSpec[] {
  return LEARNING_EXPERIENCE_COMPONENTS.filter((c) => c.applicableRoles.includes(role));
}

/** Semua ID komponen resmi (untuk guard test supaya tidak ada komponen liar). */
export function getOfficialComponentIds(): string[] {
  return LEARNING_EXPERIENCE_COMPONENTS.map((c) => c.id);
}

/** Komponen yang TIDAK boleh ditambah manual (auto-managed runtime). */
export function getAutoManagedComponents(): LearningExperienceComponentSpec[] {
  return LEARNING_EXPERIENCE_COMPONENTS.filter((c) => !c.editorRules.allowManualAdd);
}

/** Komponen yang menyumbang ke skor total. */
export function getScoringComponents(): LearningExperienceComponentSpec[] {
  return LEARNING_EXPERIENCE_COMPONENTS.filter((c) => c.previewExportRules.contributesToScore);
}

/** Komponen yang menyumbang ke progress belajar. */
export function getProgressComponents(): LearningExperienceComponentSpec[] {
  return LEARNING_EXPERIENCE_COMPONENTS.filter((c) => c.previewExportRules.contributesToProgress);
}

/** Komponen yang trigger efek apresiasi. */
export function getAppreciationTriggerComponents(): LearningExperienceComponentSpec[] {
  return LEARNING_EXPERIENCE_COMPONENTS.filter((c) => c.previewExportRules.triggersAppreciation);
}
