/**
 * Template Pedagogis Ready (TEMPLATE-PEDAGOGIS-READY-01).
 *
 * Layer: core/guided-flow (pure data + pure function, no React/DOM)
 * Allowed imports: ../types, ../ids, ../ai-mpi-json, ./mpi-topic-catalog
 *
 * Kontrak:
 *   Predefined pedagogical templates that generate AiMpiBlueprint → SimpleProject
 *   via the bridge. Guru pilih template → dapat MPI utuh dengan sceneType + sceneContent.
 *
 *   Templates use the NEW scene system (not legacy component types).
 *   Each template produces 12 scenes matching golden reference flow.
 *
 *   Prinsip:
 *     - Pure function, no DOM, no React, no store.
 *     - Output: AiMpiBlueprint (compatible with bridge + validator).
 *     - Templates are pedagogically sound (cover → CP/TP → objectives → review →
 *       material → discussion → game → analysis → quiz → result → reflection → closing).
 */

import type { AiMpiBlueprint, AiBlueprintScene, AiBlueprintSlot, AiBlueprintSlotContent } from '../ai-mpi-json/schema';
import { createComponentId } from '../ids';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PedagogicalTemplate = {
  id: string;
  name: string;
  description: string;
  mapel: string;
  grade: string;
  phase: string;
  topic: string;
  cp: string;
  objectives: Array<{ id: string; text: string }>;
  /** Content for each scene — must match 12-scene golden reference flow */
  scenes: Array<{
    id: string;
    role: string;
    sceneType: string;
    title: string;
    content: AiBlueprintSlotContent;
  }>;
};

// ---------------------------------------------------------------------------
// Helper: make placement
// ---------------------------------------------------------------------------

function makePlacement(x = 72, y = 64, width = 1136, height = 544, zIndex = 2) {
  return { x, y, width, height, zIndex };
}

function makeSlot(role: string, content: AiBlueprintSlotContent): AiBlueprintSlot {
  return {
    id: `slot-${createComponentId().slice(5)}`,
    role,
    placement: makePlacement(),
    content,
  };
}

function makeScene(id: string, role: string, sceneType: string, title: string, content: AiBlueprintSlotContent): AiBlueprintScene {
  return {
    id,
    role: role as AiBlueprintScene['role'],
    sceneType: sceneType as AiBlueprintScene['sceneType'],
    title,
    slots: [makeSlot('primary', content)],
  };
}

// ---------------------------------------------------------------------------
// Template 1: PPKn — Macam-Macam Norma
// ---------------------------------------------------------------------------

export const TEMPLATE_PPKN_NORMA: PedagogicalTemplate = {
  id: 'tpl-ppkn-norma',
  name: 'PPKn — Macam-Macam Norma',
  description: 'Memahami 4 macam norma (agama, kesusilaan, kesopanan, hukum) dan penerapannya.',
  mapel: 'PPKn', grade: '7', phase: 'D', topic: 'Macam-Macam Norma',
  cp: 'Peserta didik mampu memahami macam-macam norma yang berlaku di masyarakat.',
  objectives: [
    { id: 'obj-1', text: 'Mengidentifikasi 4 macam norma.' },
    { id: 'obj-2', text: 'Membedakan ciri-ciri setiap norma.' },
    { id: 'obj-3', text: 'Menunjukkan contoh penerapan norma.' },
  ],
  scenes: [
    {
      id: 'scene-cover', role: 'cover', sceneType: 'cover-hero', title: 'Sampul',
      content: { kind: 'cover-hero', kicker: 'PPKn · Kelas 7', heroTitle: 'Macam-Macam Norma', heroSubtitle: 'Memahami aturan yang mengatur kehidupan masyarakat', badges: ['Fase D', 'Interaktif'], primaryAction: { label: 'Mulai Pembelajaran', action: 'next' } },
    },
    {
      id: 'scene-cp', role: 'guide', sceneType: 'curriculum-guide', title: 'Kurikulum',
      content: { kind: 'curriculum-guide', curriculumTitle: 'Kurikulum Merdeka — PPKn Fase D', competency: 'Peserta didik mampu memahami macam-macam norma yang berlaku di masyarakat dan menerapkannya dalam kehidupan sehari-hari.', learningFlow: 'CP → TP → ATP → Materi → Diskusi → Game → Quiz → Refleksi' },
    },
    {
      id: 'scene-tp', role: 'objectives', sceneType: 'objectives-path', title: 'Tujuan Pembelajaran',
      content: { kind: 'objectives-path', objectiveList: ['Mengidentifikasi 4 macam norma (agama, kesusilaan, kesopanan, hukum).', 'Membedakan ciri-ciri setiap jenis norma.', 'Menunjukkan contoh penerapan norma dalam kehidupan sehari-hari.'], successCriteria: 'Siswa dapat menyebutkan 4 macam norma dan memberikan contoh masing-masing.' },
    },
    {
      id: 'scene-review', role: 'starter', sceneType: 'starter-review', title: 'Review',
      content: { kind: 'starter-review', priorLearning: 'Pada pertemuan sebelumnya, kita belajar tentang pengertian norma.', triggerQuestion: 'Apa yang terjadi jika tidak ada norma di masyarakat?', bridgeToNewTopic: 'Hari ini kita akan mempelajari macam-macam norma yang berlaku.', discussionPrompt: 'Diskusikan dengan teman: norma apa yang paling sering kamu jumpai?' },
    },
    {
      id: 'scene-materi', role: 'material', sceneType: 'learning-scene', title: 'Materi: 4 Macam Norma',
      content: { kind: 'learning-material', conceptTitle: '4 Macam Norma', conceptSubtitle: 'Agama, Kesusilaan, Kesopanan, Hukum', explanation: 'Norma adalah aturan yang mengatur perilaku manusia di masyarakat. Ada 4 macam norma: 1) Norma Agama — aturan dari Tuhan, 2) Norma Kesusilaan — aturan dari hati nurani, 3) Norma Kesopanan — aturan tata krama, 4) Norma Hukum — aturan dari negara.', examples: [{ id: 'ex1', title: 'Norma Agama', body: 'Berdoa sebelum makan.' }, { id: 'ex2', title: 'Norma Hukum', body: 'Memakai helm saat berkendara.' }], keyPoints: ['Norma agama bersumber dari Tuhan.', 'Norma hukum ditegakkan negara.', 'Pelanggaran norma ada sanksinya.'], studentAction: 'Tuliskan 1 contoh norma yang kamu jumpai di sekolah.', visualHint: 'Perhatikan contoh norma di sekitarmu.' },
    },
    {
      id: 'scene-diskusi', role: 'material', sceneType: 'discussion-scene', title: 'Diskusi Kelompok',
      content: { kind: 'discussion-scene', discussionPrompt: 'Mengapa norma hukum memiliki sanksi yang paling tegas?', groupInstruction: 'Diskusikan dalam kelompok 4 orang, tulis hasil di kertas.', responseInput: 'Tulis hasil diskusi kelompokmu...' },
    },
    {
      id: 'scene-game1', role: 'activity', sceneType: 'classification-game', title: 'Game Sortir Norma',
      content: { kind: 'classification-game', instruction: 'Sortir kartu perilaku ke 4 kategori norma yang tepat!', items: [{ id: 'i1', label: 'Berdoa sebelum aktivitas', correctCategory: 'Agama' }, { id: 'i2', label: 'Memakai helm saat berkendara', correctCategory: 'Hukum' }, { id: 'i3', label: 'Membungkuk saat lewat orang tua', correctCategory: 'Kesopanan' }, { id: 'i4', label: 'Jujur saat ujian', correctCategory: 'Kesusilaan' }], categories: ['Agama', 'Kesusilaan', 'Kesopanan', 'Hukum'], scorePerItem: 10, completionMessage: 'Selamat! Semua norma berhasil disortir.' },
    },
    {
      id: 'scene-hubungan', role: 'material', sceneType: 'case-analysis', title: 'Hubungan Antarnorma',
      content: { kind: 'case-analysis', caseText: 'Seorang siswa terlambat ke sekolah. Ia melanggar norma kesopanan (tidak datang tepat waktu) sekaligus norma hukum (melanggar tata tertib sekolah).', analysisPrompt: 'Norma apa saja yang dilanggar? Jelaskan!', revealExplanation: 'Siswa melanggar norma kesopanan (datang terlambat) dan norma hukum (tata tertib sekolah). Sanksi kesopanan adalah teguran, sanksi hukum adalah pemanggilan orang tua.', discussionPrompt: 'Apakah ada kasus di mana satu tindakan melanggar banyak norma sekaligus?' },
    },
    {
      id: 'scene-game2', role: 'quiz', sceneType: 'quiz-challenge', title: 'Quiz Challenge',
      content: { kind: 'quiz-question', prompt: 'Norma yang mengatur hubungan manusia dengan Tuhan disebut...', choices: [{ id: 'c1', text: 'Norma Agama' }, { id: 'c2', text: 'Norma Kesusilaan' }, { id: 'c3', text: 'Norma Kesopanan' }, { id: 'c4', text: 'Norma Hukum' }], correctChoiceId: 'c1', feedbackCorrect: 'Benar! Norma agama berasal dari Tuhan.', feedbackWrong: 'Belum tepat. Norma agama mengatur hubungan dengan Tuhan.' },
    },
    {
      id: 'scene-hasil', role: 'material', sceneType: 'result-summary', title: 'Hasil',
      content: { kind: 'result-summary', scoreSummary: { score: 0, maxScore: 100 }, achievementLevel: 'Penjelajah Norma', breakdown: [{ label: 'Game Sortir', value: '0/40' }, { label: 'Quiz', value: '0/10' }] },
    },
    {
      id: 'scene-refleksi', role: 'reflection', sceneType: 'reflection-journal', title: 'Refleksi',
      content: { kind: 'reflection-journal', reflectionPrompts: ['Norma apa yang paling sering kamu terapkan di rumah?', 'Apa yang akan kamu lakukan jika melihat teman melanggar norma?'], commitmentInput: 'Tulis komitmenmu untuk menerapkan norma...', portfolioSummary: [{ label: 'Game Sortir', value: 'Selesai' }, { label: 'Quiz', value: 'Selesai' }], nextTask: 'Pertemuan berikutnya: Sanksi pelanggaran norma.' },
    },
    {
      id: 'scene-penutup', role: 'closing', sceneType: 'closing-award', title: 'Penutup',
      content: { kind: 'closing-award', achievement: 'Penjelajah Norma', summary: 'Kamu telah menjelajahi 4 macam norma dalam kehidupan sehari-hari.', reflectionPrompt: 'Norma apa yang paling ingin kamu terapkan besok?', rewardLabel: 'Lencana Penjaga Norma', rewardIcon: '🏆', nextLearning: 'Selanjutnya: Sanksi pelanggaran norma', finalAction: { label: 'Selesai', action: 'next' } },
    },
  ],
};

// ---------------------------------------------------------------------------
// Template 2: IPA — Sistem Tata Surya
// ---------------------------------------------------------------------------

export const TEMPLATE_IPA_TATA_SURYA: PedagogicalTemplate = {
  id: 'tpl-ipa-tata-surya',
  name: 'IPA — Sistem Tata Surya',
  description: 'Mengenal planet-planet dalam tata surya dan karakteristiknya.',
  mapel: 'IPA', grade: '7', phase: 'D', topic: 'Sistem Tata Surya',
  cp: 'Peserta didik mampu memahami struktur tata surya dan karakteristik anggotanya.',
  objectives: [
    { id: 'obj-1', text: 'Menyebutkan 8 planet dalam tata surya.' },
    { id: 'obj-2', text: 'Membedakan planet dalam dan planet luar.' },
  ],
  scenes: [
    { id: 'scene-cover', role: 'cover', sceneType: 'cover-hero', title: 'Sampul', content: { kind: 'cover-hero', kicker: 'IPA · Kelas 7', heroTitle: 'Sistem Tata Surya', heroSubtitle: 'Menjelajahi planet-planet di galaksi Bima Sakti', badges: ['Fase D'] } },
    { id: 'scene-cp', role: 'guide', sceneType: 'curriculum-guide', title: 'Kurikulum', content: { kind: 'curriculum-guide', curriculumTitle: 'Kurikulum Merdeka — IPA Fase D', competency: 'Peserta didik mampu memahami struktur tata surya dan karakteristik anggotanya.' } },
    { id: 'scene-tp', role: 'objectives', sceneType: 'objectives-path', title: 'Tujuan', content: { kind: 'objectives-path', objectiveList: ['Menyebutkan 8 planet dalam tata surya.', 'Membedakan planet dalam dan planet luar.'], successCriteria: 'Siswa dapat mengurutkan 8 planet dari yang terdekat ke Matahari.' } },
    { id: 'scene-review', role: 'starter', sceneType: 'starter-review', title: 'Review', content: { kind: 'starter-review', priorLearning: 'Sebelumnya kita belajar tentang Matahari sebagai pusat tata surya.', triggerQuestion: 'Berapa banyak planet yang mengorbit Matahari?', bridgeToNewTopic: 'Hari ini kita akan kenal 8 planet lebih dekat.' } },
    { id: 'scene-materi', role: 'material', sceneType: 'learning-scene', title: 'Materi: 8 Planet', content: { kind: 'learning-material', conceptTitle: '8 Planet Tata Surya', explanation: 'Tata surya memiliki 8 planet: Merkurius, Venus, Bumi, Mars, Jupiter, Saturnus, Uranus, Neptunus. Planet dibagi menjadi planet dalam (Merkurius–Mars) dan planet luar (Jupiter–Neptunus).', examples: [{ id: 'ex1', title: 'Planet Dalam', body: 'Merkurius, Venus, Bumi, Mars — berbatu.' }, { id: 'ex2', title: 'Planet Luar', body: 'Jupiter, Saturnus, Uranus, Neptunus — gas raksasa.' }], keyPoints: ['Merkurius planet terdekat Matahari.', 'Neptunus planet terjauh.', 'Jupiter planet terbesar.'] } },
    { id: 'scene-diskusi', role: 'material', sceneType: 'discussion-scene', title: 'Diskusi', content: { kind: 'discussion-scene', discussionPrompt: 'Mengapa Pluto tidak lagi dianggap planet?', groupInstruction: 'Diskusikan dalam kelompok.' } },
    { id: 'scene-game1', role: 'activity', sceneType: 'classification-game', title: 'Game: Planet Dalam vs Luar', content: { kind: 'classification-game', instruction: 'Sortir planet ke kategori yang tepat!', items: [{ id: 'i1', label: 'Merkurius', correctCategory: 'Planet Dalam' }, { id: 'i2', label: 'Jupiter', correctCategory: 'Planet Luar' }, { id: 'i3', label: 'Bumi', correctCategory: 'Planet Dalam' }, { id: 'i4', label: 'Saturnus', correctCategory: 'Planet Luar' }], categories: ['Planet Dalam', 'Planet Luar'], scorePerItem: 10, completionMessage: 'Hebat! Semua planet berhasil disortir.' } },
    { id: 'scene-hubungan', role: 'material', sceneType: 'case-analysis', title: 'Analisis: Bumi satu-satunya?', content: { kind: 'case-analysis', caseText: 'Bumi adalah satu-satunya planet yang diketahui memiliki kehidupan.', analysisPrompt: 'Apa yang membuat Bumi layak huni?', revealExplanation: 'Bumi memiliki atmosfer, air cair, dan jarak yang tepat dari Matahari (zona layak huni).' } },
    { id: 'scene-game2', role: 'quiz', sceneType: 'quiz-challenge', title: 'Quiz', content: { kind: 'quiz-question', prompt: 'Planet terbesar dalam tata surya adalah...', choices: [{ id: 'c1', text: 'Bumi' }, { id: 'c2', text: 'Jupiter' }, { id: 'c3', text: 'Saturnus' }], correctChoiceId: 'c2', feedbackCorrect: 'Benar! Jupiter adalah planet terbesar.', feedbackWrong: 'Belum tepat. Jupiter adalah planet terbesar.' } },
    { id: 'scene-hasil', role: 'material', sceneType: 'result-summary', title: 'Hasil', content: { kind: 'result-summary', scoreSummary: { score: 0, maxScore: 100 }, achievementLevel: 'Penjelajah Tata Surya' } },
    { id: 'scene-refleksi', role: 'reflection', sceneType: 'reflection-journal', title: 'Refleksi', content: { kind: 'reflection-journal', reflectionPrompts: ['Planet mana yang paling menarik bagimu? Mengapa?', 'Jika bisa mengunjungi satu planet, mana yang kamu pilih?'] } },
    { id: 'scene-penutup', role: 'closing', sceneType: 'closing-award', title: 'Penutup', content: { kind: 'closing-award', achievement: 'Penjelajah Tata Surya', summary: 'Kamu telah menjelajahi 8 planet tata surya.', rewardLabel: 'Lencana Astronot', rewardIcon: '🚀' } },
  ],
};

// ---------------------------------------------------------------------------
// Template 3: Matematika — Bilangan Bulat
// ---------------------------------------------------------------------------

export const TEMPLATE_MTK_BILANGAN_BULAT: PedagogicalTemplate = {
  id: 'tpl-mtk-bilangan-bulat',
  name: 'Matematika — Bilangan Bulat',
  description: 'Memahami konsep bilangan bulat positif dan negatif.',
  mapel: 'Matematika', grade: '7', phase: 'D', topic: 'Bilangan Bulat',
  cp: 'Peserta didik mampu memahami konsep bilangan bulat dan operasinya.',
  objectives: [
    { id: 'obj-1', text: 'Menjelaskan konsep bilangan bulat.' },
    { id: 'obj-2', text: 'Mengurutkan bilangan bulat.' },
  ],
  scenes: [
    { id: 'scene-cover', role: 'cover', sceneType: 'cover-hero', title: 'Sampul', content: { kind: 'cover-hero', kicker: 'Matematika · Kelas 7', heroTitle: 'Bilangan Bulat', heroSubtitle: 'Memahami angka positif dan negatif', badges: ['Fase D'] } },
    { id: 'scene-cp', role: 'guide', sceneType: 'curriculum-guide', title: 'Kurikulum', content: { kind: 'curriculum-guide', curriculumTitle: 'Kurikulum Merdeka — Matematika Fase D', competency: 'Peserta didik mampu memahami konsep bilangan bulat dan operasinya.' } },
    { id: 'scene-tp', role: 'objectives', sceneType: 'objectives-path', title: 'Tujuan', content: { kind: 'objectives-path', objectiveList: ['Menjelaskan konsep bilangan bulat.', 'Mengurutkan bilangan bulat.'], successCriteria: 'Siswa dapat mengurutkan 5 bilangan bulat.' } },
    { id: 'scene-review', role: 'starter', sceneType: 'starter-review', title: 'Review', content: { kind: 'starter-review', priorLearning: 'Sebelumnya kita belajar bilangan asli.', triggerQuestion: 'Apa yang terjadi jika suhu di bawah 0 derajat?', bridgeToNewTopic: 'Hari ini kita kenal bilangan negatif.' } },
    { id: 'scene-materi', role: 'material', sceneType: 'learning-scene', title: 'Materi: Bilangan Bulat', content: { kind: 'learning-material', conceptTitle: 'Bilangan Bulat', explanation: 'Bilangan bulat terdiri dari bilangan positif (1, 2, 3...), nol (0), dan bilangan negatif (-1, -2, -3...). Bilangan bulat dapat digambarkan pada garis bilangan.', examples: [{ id: 'ex1', title: 'Positif', body: '+5 artinya 5 langkah ke kanan.' }, { id: 'ex2', title: 'Negatif', body: '-3 artinya 3 langkah ke kiri.' }], keyPoints: ['Nol bukan positif bukan negatif.', 'Makin ke kiri makin kecil.', 'Makin ke kanan makin besar.'] } },
    { id: 'scene-diskusi', role: 'material', sceneType: 'discussion-scene', title: 'Diskusi', content: { kind: 'discussion-scene', discussionPrompt: 'Berikan 3 contoh penggunaan bilangan negatif dalam kehidupan sehari-hari.' } },
    { id: 'scene-game1', role: 'activity', sceneType: 'sequencing-game', title: 'Game: Urutkan Bilangan', content: { kind: 'sequencing-game', instruction: 'Urutkan dari terkecil ke terbesar!', items: [{ id: 's1', label: '-3' }, { id: 's2', label: '0' }, { id: 's3', label: '2' }, { id: 's4', label: '-1' }], correctOrder: ['s1', 's4', 's2', 's3'], scorePerItem: 10, completionMessage: 'Hebat! Urutan tepat.' } },
    { id: 'scene-hubungan', role: 'material', sceneType: 'case-analysis', title: 'Analisis: Suhu', content: { kind: 'case-analysis', caseText: 'Suhu ruangan adalah 5°C. Kemudian turun 8 derajat. Berapa suhu sekarang?', analysisPrompt: 'Gunakan garis bilangan untuk menyelesaikan.', revealExplanation: '5 - 8 = -3. Suhu sekarang -3°C.' } },
    { id: 'scene-game2', role: 'quiz', sceneType: 'quiz-challenge', title: 'Quiz', content: { kind: 'quiz-question', prompt: 'Bilangan bulat antara -2 dan 2 adalah...', choices: [{ id: 'c1', text: '-1, 0, 1' }, { id: 'c2', text: '-2, 0, 2' }, { id: 'c3', text: '0, 1, 2' }], correctChoiceId: 'c1', feedbackCorrect: 'Benar! -1, 0, 1 berada di antara -2 dan 2.', feedbackWrong: 'Belum tepat. Periksa garis bilangan.' } },
    { id: 'scene-hasil', role: 'material', sceneType: 'result-summary', title: 'Hasil', content: { kind: 'result-summary', scoreSummary: { score: 0, maxScore: 100 }, achievementLevel: 'Matematikawan Pemula' } },
    { id: 'scene-refleksi', role: 'reflection', sceneType: 'reflection-journal', title: 'Refleksi', content: { kind: 'reflection-journal', reflectionPrompts: ['Bilangan negatif sulit atau mudah dipahami? Mengapa?', 'Kapan kamu menggunakan bilangan negatif di kehidupan?'] } },
    { id: 'scene-penutup', role: 'closing', sceneType: 'closing-award', title: 'Penutup', content: { kind: 'closing-award', achievement: 'Matematikawan Pemula', summary: 'Kamu telah memahami konsep bilangan bulat.', rewardLabel: 'Lencana Bilangan', rewardIcon: '🔢' } },
  ],
};

// ---------------------------------------------------------------------------
// Template Registry
// ---------------------------------------------------------------------------

export const PEDAGOGICAL_TEMPLATES: readonly PedagogicalTemplate[] = [
  TEMPLATE_PPKN_NORMA,
  TEMPLATE_IPA_TATA_SURYA,
  TEMPLATE_MTK_BILANGAN_BULAT,
];

export function getTemplatesByMapel(mapel: string): PedagogicalTemplate[] {
  return PEDAGOGICAL_TEMPLATES.filter((t) => t.mapel === mapel);
}

export function getUniqueTemplateMapelList(): string[] {
  return [...new Set(PEDAGOGICAL_TEMPLATES.map((t) => t.mapel))];
}

// ---------------------------------------------------------------------------
// TEMPLATE-PEDAGOGIS-READY-02 PATCH B: 16:9 Density Guard
// ---------------------------------------------------------------------------
//
// Pure helper that audits every scene in a template against explicit
// character/length limits chosen so content fits a 1280×720 (16:9) slide
// WITHOUT relying on `overflow:hidden` as a crutch. Content itself must be
// concise. Returns an `issues` array — empty means the template fits 16:9.
//
// Layer: core/guided-flow (pure data + pure function, no React/DOM).
// Safe to import from tests AND from the picker (used for quality badges).

export type TemplateDensityIssue = {
  templateId: string;
  sceneId: string;
  field: string;
  message: string;
};

export type TemplateDensityLimits = {
  // learning-material
  learningExplanationMax: number;
  examplesMax: number;
  keyPointsMax: number;
  keyPointItemMax: number;
  // discussion-scene
  discussionPromptMax: number;
  groupInstructionMax: number;
  // case-analysis
  caseTextMax: number;
  revealExplanationMax: number;
  // quiz-question
  quizPromptMax: number;
  quizChoiceTextMax: number;
  // reflection-journal
  reflectionPromptsMax: number;
  reflectionPromptItemMax: number;
  // closing-award
  closingSummaryMax: number;
  // games (classification + sequencing)
  gameInstructionMax: number;
  gameItemLabelMax: number;
  classificationItemsMax: number;
  sequencingItemsMax: number;
};

export const DEFAULT_TEMPLATE_DENSITY_LIMITS: TemplateDensityLimits = {
  learningExplanationMax: 350,
  examplesMax: 2,
  keyPointsMax: 3,
  keyPointItemMax: 90,
  discussionPromptMax: 180,
  groupInstructionMax: 140,
  caseTextMax: 220,
  revealExplanationMax: 260,
  quizPromptMax: 160,
  quizChoiceTextMax: 80,
  reflectionPromptsMax: 2,
  reflectionPromptItemMax: 120,
  closingSummaryMax: 180,
  gameInstructionMax: 140,
  gameItemLabelMax: 60,
  classificationItemsMax: 6,
  sequencingItemsMax: 6,
};

type AnyContent = Record<string, unknown>;

function asString(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return null;
}

function pushLenIssue(
  issues: TemplateDensityIssue[],
  tplId: string,
  sceneId: string,
  field: string,
  value: string,
  maxLen: number,
): void {
  if (value.length > maxLen) {
    issues.push({
      templateId: tplId,
      sceneId,
      field,
      message: `${field} length ${value.length} exceeds max ${maxLen} (value: "${value.slice(0, 40)}…")`,
    });
  }
}

function pushCountIssue(
  issues: TemplateDensityIssue[],
  tplId: string,
  sceneId: string,
  field: string,
  count: number,
  max: number,
): void {
  if (count > max) {
    issues.push({
      templateId: tplId,
      sceneId,
      field,
      message: `${field} count ${count} exceeds max ${max}`,
    });
  }
}

export function checkTemplateDensity(
  template: PedagogicalTemplate,
  limits: TemplateDensityLimits = DEFAULT_TEMPLATE_DENSITY_LIMITS,
): TemplateDensityIssue[] {
  const issues: TemplateDensityIssue[] = [];

  for (const scene of template.scenes) {
    const content = scene.content as AnyContent;
    const kind = content.kind;
    const ctx = { tplId: template.id, sceneId: scene.id };

    if (kind === 'learning-material') {
      const explanation = asString(content.explanation);
      if (explanation) pushLenIssue(issues, ctx.tplId, ctx.sceneId, 'explanation', explanation, limits.learningExplanationMax);

      const examples = content.examples;
      if (Array.isArray(examples)) pushCountIssue(issues, ctx.tplId, ctx.sceneId, 'examples', examples.length, limits.examplesMax);

      const keyPoints = content.keyPoints;
      if (Array.isArray(keyPoints)) {
        pushCountIssue(issues, ctx.tplId, ctx.sceneId, 'keyPoints', keyPoints.length, limits.keyPointsMax);
        keyPoints.forEach((kp, i) => {
          const s = asString(kp);
          if (s) pushLenIssue(issues, ctx.tplId, ctx.sceneId, `keyPoints[${i}]`, s, limits.keyPointItemMax);
        });
      }
    } else if (kind === 'discussion-scene') {
      const prompt = asString(content.discussionPrompt);
      if (prompt) pushLenIssue(issues, ctx.tplId, ctx.sceneId, 'discussionPrompt', prompt, limits.discussionPromptMax);

      const gi = asString(content.groupInstruction);
      if (gi) pushLenIssue(issues, ctx.tplId, ctx.sceneId, 'groupInstruction', gi, limits.groupInstructionMax);
    } else if (kind === 'case-analysis') {
      const ct = asString(content.caseText);
      if (ct) pushLenIssue(issues, ctx.tplId, ctx.sceneId, 'caseText', ct, limits.caseTextMax);

      const re = asString(content.revealExplanation);
      if (re) pushLenIssue(issues, ctx.tplId, ctx.sceneId, 'revealExplanation', re, limits.revealExplanationMax);

      const dp = asString(content.discussionPrompt);
      if (dp) pushLenIssue(issues, ctx.tplId, ctx.sceneId, 'discussionPrompt', dp, limits.discussionPromptMax);
    } else if (kind === 'quiz-question') {
      const p = asString(content.prompt);
      if (p) pushLenIssue(issues, ctx.tplId, ctx.sceneId, 'prompt', p, limits.quizPromptMax);

      const choices = content.choices;
      if (Array.isArray(choices)) {
        choices.forEach((c, i) => {
          const cObj = c as AnyContent;
          const t = asString(cObj.text);
          if (t) pushLenIssue(issues, ctx.tplId, ctx.sceneId, `choices[${i}].text`, t, limits.quizChoiceTextMax);
        });
      }
    } else if (kind === 'reflection-journal') {
      const prompts = content.reflectionPrompts;
      if (Array.isArray(prompts)) {
        pushCountIssue(issues, ctx.tplId, ctx.sceneId, 'reflectionPrompts', prompts.length, limits.reflectionPromptsMax);
        prompts.forEach((rp, i) => {
          const s = asString(rp);
          if (s) pushLenIssue(issues, ctx.tplId, ctx.sceneId, `reflectionPrompts[${i}]`, s, limits.reflectionPromptItemMax);
        });
      }
    } else if (kind === 'closing-award') {
      const s = asString(content.summary);
      if (s) pushLenIssue(issues, ctx.tplId, ctx.sceneId, 'summary', s, limits.closingSummaryMax);
    } else if (kind === 'classification-game') {
      const ins = asString(content.instruction);
      if (ins) pushLenIssue(issues, ctx.tplId, ctx.sceneId, 'instruction', ins, limits.gameInstructionMax);

      const items = content.items;
      if (Array.isArray(items)) {
        pushCountIssue(issues, ctx.tplId, ctx.sceneId, 'items', items.length, limits.classificationItemsMax);
        items.forEach((it, i) => {
          const itObj = it as AnyContent;
          const label = asString(itObj.label);
          if (label) pushLenIssue(issues, ctx.tplId, ctx.sceneId, `items[${i}].label`, label, limits.gameItemLabelMax);
        });
      }
    } else if (kind === 'sequencing-game') {
      const ins = asString(content.instruction);
      if (ins) pushLenIssue(issues, ctx.tplId, ctx.sceneId, 'instruction', ins, limits.gameInstructionMax);

      const items = content.items;
      if (Array.isArray(items)) {
        pushCountIssue(issues, ctx.tplId, ctx.sceneId, 'items', items.length, limits.sequencingItemsMax);
        items.forEach((it, i) => {
          const itObj = it as AnyContent;
          const label = asString(itObj.label);
          if (label) pushLenIssue(issues, ctx.tplId, ctx.sceneId, `items[${i}].label`, label, limits.gameItemLabelMax);
        });
      }
    }
    // Other content kinds (cover-hero, curriculum-guide, objectives-path,
    // starter-review, result-summary) are intentionally not length-checked
    // — they have flexible layout blocks that wrap naturally on 16:9.
  }

  return issues;
}

export function checkAllTemplatesDensity(
  templates: readonly PedagogicalTemplate[] = PEDAGOGICAL_TEMPLATES,
  limits: TemplateDensityLimits = DEFAULT_TEMPLATE_DENSITY_LIMITS,
): TemplateDensityIssue[] {
  return templates.flatMap((t) => checkTemplateDensity(t, limits));
}

// ---------------------------------------------------------------------------
// Convert template to AiMpiBlueprint
// ---------------------------------------------------------------------------

export function templateToBlueprint(template: PedagogicalTemplate): AiMpiBlueprint {
  const scenes: AiBlueprintScene[] = template.scenes.map((s) =>
    makeScene(s.id, s.role, s.sceneType, s.title, s.content),
  );

  return {
    version: 1,
    metadata: {
      title: template.topic,
      subtitle: `${template.mapel} · Kelas ${template.grade} · Fase ${template.phase}`,
      author: 'Template Pedagogis',
    },
    curriculum: {
      subject: template.mapel,
      grade: template.grade,
      phase: template.phase,
      topic: template.topic,
      cp: template.cp,
      objectives: template.objectives,
    },
    styleIntent: {
      styleId: 'golden-reference',
      mood: 'clean',
      intent: template.description,
    },
    designSystem: {
      contractId: 'golden-reference',
      paletteName: 'navy-crimson-gold',
      typographyName: 'trebuchet-hero',
    },
    flow: {
      steps: scenes.map((s, i) => ({ sceneId: s.id, label: scenes[i].title })),
      mode: 'linear',
    },
    scenes,
    assets: [],
    runtime: { showProgress: true, showScore: true },
    exportConfig: {
      format: 'html-standalone',
      embedAssets: true,
      includeToolbar: true,
      stageWidth: 1280,
      stageHeight: 720,
    },
  };
}
