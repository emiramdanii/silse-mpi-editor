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
  /** Content for each scene — golden reference flow + teacher-pedagogy extensions */
  scenes: Array<{
    id: string;
    role: string;
    sceneType: string;
    title: string;
    content: AiBlueprintSlotContent;
    /**
     * TEACHER-READY-TEMPLATE-QUALITY: references to objective IDs that this
     * scene addresses. Used by checkTemplateObjectiveCoverage() to verify
     * every objective is covered by at least one scene.
     * Cover and closing scenes may omit this (they don't teach objectives).
     */
    objectiveRefs?: string[];
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
    // TEACHER-READY-TEMPLATE-QUALITY: teacher-guide scene for guru preparation
    {
      id: 'scene-teacher-guide', role: 'guide', sceneType: 'teacher-guide', title: 'Panduan Guru',
      objectiveRefs: ['obj-1', 'obj-2', 'obj-3'],
      content: { kind: 'teacher-guide', title: 'Panduan Guru — Macam-Macam Norma', teacherInstruction: 'Mulai dengan bertanya kepada siswa tentang aturan di rumah. Lalu perkenalkan 4 macam norma menggunakan contoh sehari-hari. Pandu diskusi kelompok dengan teliti.', facilitationTips: ['Berikan waktu 5 menit untuk diagnostic check', 'Gunakan contoh norma di sekolah agar relevan', 'Remedial untuk siswa skor < 50, enrichment untuk skor > 85'], timeAllocation: '2 x 40 menit', assessmentNotes: 'Nilai dari game sortir (40), quiz (10), dan rubrik panel. Remedial jika skor total < 50.' },
    },
    {
      id: 'scene-cp', role: 'guide', sceneType: 'curriculum-guide', title: 'Kurikulum',
      objectiveRefs: ['obj-1', 'obj-2', 'obj-3'],
      content: { kind: 'curriculum-guide', curriculumTitle: 'Kurikulum Merdeka — PPKn Fase D', competency: 'Peserta didik mampu memahami macam-macam norma yang berlaku di masyarakat dan menerapkannya dalam kehidupan sehari-hari.', learningFlow: 'CP → TP → ATP → Materi → Diskusi → Game → Quiz → Refleksi' },
    },
    {
      id: 'scene-tp', role: 'objectives', sceneType: 'objectives-path', title: 'Tujuan Pembelajaran',
      objectiveRefs: ['obj-1', 'obj-2', 'obj-3'],
      content: { kind: 'objectives-path', objectiveList: ['Mengidentifikasi 4 macam norma (agama, kesusilaan, kesopanan, hukum).', 'Membedakan ciri-ciri setiap jenis norma.', 'Menunjukkan contoh penerapan norma dalam kehidupan sehari-hari.'], successCriteria: 'Siswa dapat menyebutkan 4 macam norma dan memberikan contoh masing-masing.' },
    },
    {
      id: 'scene-review', role: 'starter', sceneType: 'starter-review', title: 'Review',
      objectiveRefs: ['obj-1'],
      content: { kind: 'starter-review', priorLearning: 'Pada pertemuan sebelumnya, kita belajar tentang pengertian norma.', triggerQuestion: 'Apa yang terjadi jika tidak ada norma di masyarakat?', bridgeToNewTopic: 'Hari ini kita akan mempelajari macam-macam norma yang berlaku.', discussionPrompt: 'Diskusikan dengan teman: norma apa yang paling sering kamu jumpai?' },
    },
    // TEACHER-READY-TEMPLATE-QUALITY: diagnostic-check for pre-assessment
    {
      id: 'scene-diagnostic', role: 'starter', sceneType: 'diagnostic-check', title: 'Cek Pemahaman Awal',
      objectiveRefs: ['obj-1', 'obj-2'],
      content: { kind: 'diagnostic-check', diagnosticPrompt: 'Sebelum mulai, cek pemahaman awal kamu tentang norma!', questionSet: [{ id: 'dq1', prompt: 'Aturan dari Tuhan disebut norma...', choices: [{ id: 'a', text: 'Agama' }, { id: 'b', text: 'Hukum' }, { id: 'c', text: 'Kesopanan' }], correctChoiceId: 'a' }, { id: 'dq2', prompt: 'Aturan dari negara disebut norma...', choices: [{ id: 'a', text: 'Hukum' }, { id: 'b', text: 'Agama' }, { id: 'c', text: 'Kesusilaan' }], correctChoiceId: 'a' }, { id: 'dq3', prompt: 'Sopan santun termasuk norma...', choices: [{ id: 'a', text: 'Kesopanan' }, { id: 'b', text: 'Hukum' }, { id: 'c', text: 'Agama' }], correctChoiceId: 'a' }], recommendation: 'Skor < 2: mulai dari materi dasar. Skor 2-3: lanjut ke diskusi.', readinessLevels: [{ level: 'Siap', minScore: 3, description: 'Lanjut ke materi utama' }, { level: 'Perlu Pendalaman', minScore: 2, description: 'Review pengertian norma' }, { level: 'Perlu Remedial', minScore: 0, description: 'Ikut jalur remedial' }] },
    },
    {
      id: 'scene-materi', role: 'material', sceneType: 'learning-scene', title: 'Materi: 4 Macam Norma',
      objectiveRefs: ['obj-1', 'obj-2', 'obj-3'],
      content: { kind: 'learning-material', conceptTitle: '4 Macam Norma', conceptSubtitle: 'Agama, Kesusilaan, Kesopanan, Hukum', explanation: 'Norma adalah aturan yang mengatur perilaku manusia di masyarakat. Ada 4 macam norma: 1) Norma Agama — aturan dari Tuhan, 2) Norma Kesusilaan — aturan dari hati nurani, 3) Norma Kesopanan — aturan tata krama, 4) Norma Hukum — aturan dari negara.', examples: [{ id: 'ex1', title: 'Norma Agama', body: 'Berdoa sebelum makan.' }, { id: 'ex2', title: 'Norma Hukum', body: 'Memakai helm saat berkendara.' }], keyPoints: ['Norma agama bersumber dari Tuhan.', 'Norma hukum ditegakkan negara.', 'Pelanggaran norma ada sanksinya.'], studentAction: 'Tuliskan 1 contoh norma yang kamu jumpai di sekolah.', visualHint: 'Perhatikan contoh norma di sekitarmu.' },
    },
    {
      id: 'scene-diskusi', role: 'material', sceneType: 'discussion-scene', title: 'Diskusi Kelompok',
      objectiveRefs: ['obj-3'],
      content: { kind: 'discussion-scene', discussionPrompt: 'Mengapa norma hukum memiliki sanksi yang paling tegas?', groupInstruction: 'Diskusikan dalam kelompok 4 orang, tulis hasil di kertas.', responseInput: 'Tulis hasil diskusi kelompokmu...' },
    },
    {
      id: 'scene-game1', role: 'activity', sceneType: 'classification-game', title: 'Game Sortir Norma',
      objectiveRefs: ['obj-1', 'obj-2'],
      content: { kind: 'classification-game', instruction: 'Sortir kartu perilaku ke 4 kategori norma yang tepat!', items: [{ id: 'i1', label: 'Berdoa sebelum aktivitas', correctCategory: 'Agama' }, { id: 'i2', label: 'Memakai helm saat berkendara', correctCategory: 'Hukum' }, { id: 'i3', label: 'Membungkuk saat lewat orang tua', correctCategory: 'Kesopanan' }, { id: 'i4', label: 'Jujur saat ujian', correctCategory: 'Kesusilaan' }], categories: ['Agama', 'Kesusilaan', 'Kesopanan', 'Hukum'], scorePerItem: 10, completionMessage: 'Selamat! Semua norma berhasil disortir.' },
    },
    {
      id: 'scene-hubungan', role: 'material', sceneType: 'case-analysis', title: 'Hubungan Antarnorma',
      objectiveRefs: ['obj-2', 'obj-3'],
      content: { kind: 'case-analysis', caseText: 'Seorang siswa terlambat ke sekolah. Ia melanggar norma kesopanan (tidak datang tepat waktu) sekaligus norma hukum (melanggar tata tertib sekolah).', analysisPrompt: 'Norma apa saja yang dilanggar? Jelaskan!', revealExplanation: 'Siswa melanggar norma kesopanan (datang terlambat) dan norma hukum (tata tertib sekolah). Sanksi kesopanan adalah teguran, sanksi hukum adalah pemanggilan orang tua.', discussionPrompt: 'Apakah ada kasus di mana satu tindakan melanggar banyak norma sekaligus?' },
    },
    {
      id: 'scene-game2', role: 'quiz', sceneType: 'quiz-challenge', title: 'Quiz Challenge',
      objectiveRefs: ['obj-1', 'obj-2', 'obj-3'],
      content: { kind: 'quiz-question', prompt: 'Norma yang mengatur hubungan manusia dengan Tuhan disebut...', choices: [{ id: 'c1', text: 'Norma Agama' }, { id: 'c2', text: 'Norma Kesusilaan' }, { id: 'c3', text: 'Norma Kesopanan' }, { id: 'c4', text: 'Norma Hukum' }], correctChoiceId: 'c1', feedbackCorrect: 'Benar! Norma agama berasal dari Tuhan.', feedbackWrong: 'Belum tepat. Norma agama mengatur hubungan dengan Tuhan.' },
    },
    // TEACHER-READY-TEMPLATE-QUALITY: rubric-panel for assessment
    {
      id: 'scene-rubrik', role: 'material', sceneType: 'rubric-panel', title: 'Rubrik Penilaian',
      objectiveRefs: ['obj-1', 'obj-2', 'obj-3'],
      content: { kind: 'rubric-panel', criteria: [{ id: 'rc1', name: 'Identifikasi Norma', description: 'Menyebutkan 4 macam norma dengan benar' }, { id: 'rc2', name: 'Pembedaan Ciri', description: 'Membedakan ciri setiap jenis norma' }, { id: 'rc3', name: 'Contoh Penerapan', description: 'Memberikan contoh penerapan norma' }], levels: [{ id: 'rl1', name: 'Perlu Bimbingan', score: 50, descriptor: 'Menyebutkan < 2 norma, contoh kurang tepat' }, { id: 'rl2', name: 'Berkembang', score: 70, descriptor: 'Menyebutkan 2-3 norma, contoh sebagian tepat' }, { id: 'rl3', name: 'Kompeten', score: 85, descriptor: 'Menyebutkan 4 norma, contoh tepat' }, { id: 'rl4', name: 'Mahir', score: 100, descriptor: 'Menyebutkan 4 norma + contoh + analisis hubungan' }], scoreGuide: 'Total skor = (game + quiz + rubrik) / 3. Remedial jika < 50.' },
    },
    // TEACHER-READY-TEMPLATE-QUALITY: remedial-practice for struggling students
    {
      id: 'scene-remedial', role: 'material', sceneType: 'remedial-practice', title: 'Pembelajaran Remedial',
      objectiveRefs: ['obj-1', 'obj-2'],
      content: { kind: 'remedial-practice', misconception: 'Banyak siswa bingung membedakan norma kesusilaan dan kesopanan karena keduanya hubungan antarmanusia.', reteachExplanation: 'Norma kesusilaan = hati nurani (jujur, tidak curang). Norma kesopanan = tata krama (sopan, hormat). Contoh: jujur ujian = kesusilaan. Membungkuk lewat orang tua = kesopanan.', guidedPractice: [{ id: 'gp1', prompt: 'Menolong teman yang jatuh termasuk norma...', choices: [{ id: 'a', text: 'Kesusilaan' }, { id: 'b', text: 'Kesopanan' }, { id: 'c', text: 'Hukum' }], correctChoiceId: 'a', hint: 'Bersumber dari hati nurani untuk berbuat baik.' }, { id: 'gp2', prompt: 'Mengucap salam kepada guru termasuk norma...', choices: [{ id: 'a', text: 'Kesopanan' }, { id: 'b', text: 'Kesusilaan' }, { id: 'c', text: 'Agama' }], correctChoiceId: 'a', hint: 'Tata krama dalam pergaulan sehari-hari.' }], retryQuestion: 'Setelah remedial, coba lagi quiz untuk lihat kemajuanmu!' },
    },
    // TEACHER-READY-TEMPLATE-QUALITY: enrichment-challenge for advanced students
    {
      id: 'scene-enrichment', role: 'activity', sceneType: 'enrichment-challenge', title: 'Tantangan Enrichment',
      objectiveRefs: ['obj-3'],
      content: { kind: 'enrichment-challenge', challengeContext: 'Di masyarakat multikultural, satu perbuatan bisa melibatkan banyak norma sekaligus.', advancedTask: 'Analisis kasus: seseorang berbelanja di pasar lalu menawar dengan keras. Norma apa yang berperan? Jelaskan dampak jika salah satu norma tidak dipegang.', responseInput: 'Tulis analisis mendalammu di sini...', rubricPreview: [{ criterion: 'Identifikasi Norma', descriptor: 'Menemukan minimal 3 norma dalam kasus' }, { criterion: 'Analisis Dampak', descriptor: 'Menjelaskan konsekuensi jika norma dilanggar' }, { criterion: 'Solusi', descriptor: 'Memberikan saran praktis' }], completionMessage: 'Luar biasa! Kamu mampu menganalisis norma secara mendalam.' },
    },
    {
      id: 'scene-hasil', role: 'material', sceneType: 'result-summary', title: 'Hasil',
      objectiveRefs: ['obj-1', 'obj-2', 'obj-3'],
      content: { kind: 'result-summary', scoreSummary: { score: 0, maxScore: 100 }, achievementLevel: 'Penjelajah Norma', breakdown: [{ label: 'Game Sortir', value: '0/40' }, { label: 'Quiz', value: '0/10' }] },
    },
    {
      id: 'scene-refleksi', role: 'reflection', sceneType: 'reflection-journal', title: 'Refleksi',
      objectiveRefs: ['obj-1', 'obj-2', 'obj-3'],
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
    // TEACHER-READY-TEMPLATE-QUALITY: teacher-guide scene
    {
      id: 'scene-teacher-guide', role: 'guide', sceneType: 'teacher-guide', title: 'Panduan Guru',
      objectiveRefs: ['obj-1', 'obj-2'],
      content: { kind: 'teacher-guide', title: 'Panduan Guru — Sistem Tata Surya', teacherInstruction: 'Mulai dengan menunjukkan model tata surya atau video. Mintalah siswa menyebutkan planet yang mereka ketahui. Lalu perkenalkan 8 planet dengan urutan dari Matahari.', facilitationTips: ['Gunakan analogi ukuran: Bumi sebutir pasir, Jupiter bola tenis', 'Tekankan perbedaan planet dalam (berbatu) vs luar (gas)', 'Gunakan matching-game untuk evaluasi pemahaman'], timeAllocation: '2 x 40 menit', assessmentNotes: 'Nilai dari matching-game (40) dan quiz (10). Gunakan rubrik untuk evaluasi diskusi.' },
    },
    { id: 'scene-cp', role: 'guide', sceneType: 'curriculum-guide', title: 'Kurikulum', objectiveRefs: ['obj-1', 'obj-2'], content: { kind: 'curriculum-guide', curriculumTitle: 'Kurikulum Merdeka — IPA Fase D', competency: 'Peserta didik mampu memahami struktur tata surya dan karakteristik anggotanya.' } },
    {
      id: 'scene-tp', role: 'objectives', sceneType: 'objectives-path', title: 'Tujuan',
      objectiveRefs: ['obj-1', 'obj-2'],
      content: { kind: 'objectives-path', objectiveList: ['Menyebutkan 8 planet dalam tata surya.', 'Membedakan planet dalam dan planet luar.'], successCriteria: 'Siswa dapat mengurutkan 8 planet dari yang terdekat ke Matahari.' },
    },
    {
      id: 'scene-review', role: 'starter', sceneType: 'starter-review', title: 'Review',
      objectiveRefs: ['obj-1'],
      content: { kind: 'starter-review', priorLearning: 'Sebelumnya kita belajar tentang Matahari sebagai pusat tata surya.', triggerQuestion: 'Berapa banyak planet yang mengorbit Matahari?', bridgeToNewTopic: 'Hari ini kita akan kenal 8 planet lebih dekat.' },
    },
    {
      id: 'scene-materi', role: 'material', sceneType: 'learning-scene', title: 'Materi: 8 Planet',
      objectiveRefs: ['obj-1', 'obj-2'],
      content: { kind: 'learning-material', conceptTitle: '8 Planet Tata Surya', explanation: 'Tata surya memiliki 8 planet: Merkurius, Venus, Bumi, Mars, Jupiter, Saturnus, Uranus, Neptunus. Planet dibagi menjadi planet dalam (Merkurius–Mars) dan planet luar (Jupiter–Neptunus).', examples: [{ id: 'ex1', title: 'Planet Dalam', body: 'Merkurius, Venus, Bumi, Mars — berbatu.' }, { id: 'ex2', title: 'Planet Luar', body: 'Jupiter, Saturnus, Uranus, Neptunus — gas raksasa.' }], keyPoints: ['Merkurius planet terdekat Matahari.', 'Neptunus planet terjauh.', 'Jupiter planet terbesar.'] },
    },
    {
      id: 'scene-diskusi', role: 'material', sceneType: 'discussion-scene', title: 'Diskusi',
      objectiveRefs: ['obj-2'],
      content: { kind: 'discussion-scene', discussionPrompt: 'Mengapa Pluto tidak lagi dianggap planet?', groupInstruction: 'Diskusikan dalam kelompok.' },
    },
    // TEACHER-READY-TEMPLATE-QUALITY: matching-game for game variety (replaces classification-game)
    {
      id: 'scene-game1', role: 'activity', sceneType: 'matching-game', title: 'Game: Cocokkan Planet',
      objectiveRefs: ['obj-1', 'obj-2'],
      content: { kind: 'matching-game', instruction: 'Cocokkan planet dengan karakteristiknya!', leftItems: [{ id: 'l1', label: 'Merkurius' }, { id: 'l2', label: 'Bumi' }, { id: 'l3', label: 'Jupiter' }, { id: 'l4', label: 'Saturnus' }], rightItems: [{ id: 'r1', label: 'Terdekat dengan Matahari' }, { id: 'r2', label: 'Satu-satunya berkehidupan' }, { id: 'r3', label: 'Planet terbesar' }, { id: 'r4', label: 'Memiliki cincin indah' }], correctPairs: [{ leftId: 'l1', rightId: 'r1' }, { leftId: 'l2', rightId: 'r2' }, { leftId: 'l3', rightId: 'r3' }, { leftId: 'l4', rightId: 'r4' }], scorePerPair: 10, completionMessage: 'Hebat! Semua planet cocok dengan benar.' },
    },
    {
      id: 'scene-hubungan', role: 'material', sceneType: 'case-analysis', title: 'Analisis: Bumi satu-satunya?',
      objectiveRefs: ['obj-2'],
      content: { kind: 'case-analysis', caseText: 'Bumi adalah satu-satunya planet yang diketahui memiliki kehidupan.', analysisPrompt: 'Apa yang membuat Bumi layak huni?', revealExplanation: 'Bumi memiliki atmosfer, air cair, dan jarak yang tepat dari Matahari (zona layak huni).' },
    },
    {
      id: 'scene-game2', role: 'quiz', sceneType: 'quiz-challenge', title: 'Quiz',
      objectiveRefs: ['obj-1', 'obj-2'],
      content: { kind: 'quiz-question', prompt: 'Planet terbesar dalam tata surya adalah...', choices: [{ id: 'c1', text: 'Bumi' }, { id: 'c2', text: 'Jupiter' }, { id: 'c3', text: 'Saturnus' }], correctChoiceId: 'c2', feedbackCorrect: 'Benar! Jupiter adalah planet terbesar.', feedbackWrong: 'Belum tepat. Jupiter adalah planet terbesar.' },
    },
    // TEACHER-READY-TEMPLATE-QUALITY: rubric-panel for assessment
    {
      id: 'scene-rubrik', role: 'material', sceneType: 'rubric-panel', title: 'Rubrik Penilaian',
      objectiveRefs: ['obj-1', 'obj-2'],
      content: { kind: 'rubric-panel', criteria: [{ id: 'rc1', name: 'Penyebutan Planet', description: 'Menyebutkan 8 planet dengan urutan benar' }, { id: 'rc2', name: 'Klasifikasi', description: 'Membedakan planet dalam dan luar' }, { id: 'rc3', name: 'Karakteristik', description: 'Menyebutkan ciri khas setiap planet' }], levels: [{ id: 'rl1', name: 'Perlu Bimbingan', score: 50, descriptor: 'Menyebutkan < 4 planet' }, { id: 'rl2', name: 'Berkembang', score: 70, descriptor: 'Menyebutkan 4-6 planet' }, { id: 'rl3', name: 'Kompeten', score: 85, descriptor: 'Menyebutkan 8 planet + klasifikasi' }, { id: 'rl4', name: 'Mahir', score: 100, descriptor: '8 planet + klasifikasi + karakteristik' }], scoreGuide: 'Total = (matching + quiz + rubrik) / 3. Tuntas jika >= 70.' },
    },
    { id: 'scene-hasil', role: 'material', sceneType: 'result-summary', title: 'Hasil', objectiveRefs: ['obj-1', 'obj-2'], content: { kind: 'result-summary', scoreSummary: { score: 0, maxScore: 100 }, achievementLevel: 'Penjelajah Tata Surya' } },
    {
      id: 'scene-refleksi', role: 'reflection', sceneType: 'reflection-journal', title: 'Refleksi',
      objectiveRefs: ['obj-1', 'obj-2'],
      content: { kind: 'reflection-journal', reflectionPrompts: ['Planet mana yang paling menarik bagimu? Mengapa?', 'Jika bisa mengunjungi satu planet, mana yang kamu pilih?'] },
    },
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
    // TEACHER-READY-TEMPLATE-QUALITY: teacher-guide scene
    {
      id: 'scene-teacher-guide', role: 'guide', sceneType: 'teacher-guide', title: 'Panduan Guru',
      objectiveRefs: ['obj-1', 'obj-2'],
      content: { kind: 'teacher-guide', title: 'Panduan Guru — Bilangan Bulat', teacherInstruction: 'Mulai dengan garis bilangan besar di papan. Tunjukkan angka 0 di tengah, positif ke kanan, negatif ke kiri. Gunakan contoh suhu dan hutang untuk konteks nyata.', facilitationTips: ['Gunakan termometer sebagai contoh negatif', 'Minta siswa berdiri di garis bilangan lantai', 'Tekankan: makin ke kiri makin kecil'], timeAllocation: '2 x 40 menit', assessmentNotes: 'Nilai dari sequencing-game (40) dan quiz (10). Rubrik untuk evaluasi urutan dan penjelasan.' },
    },
    { id: 'scene-cp', role: 'guide', sceneType: 'curriculum-guide', title: 'Kurikulum', objectiveRefs: ['obj-1', 'obj-2'], content: { kind: 'curriculum-guide', curriculumTitle: 'Kurikulum Merdeka — Matematika Fase D', competency: 'Peserta didik mampu memahami konsep bilangan bulat dan operasinya.' } },
    {
      id: 'scene-tp', role: 'objectives', sceneType: 'objectives-path', title: 'Tujuan',
      objectiveRefs: ['obj-1', 'obj-2'],
      content: { kind: 'objectives-path', objectiveList: ['Menjelaskan konsep bilangan bulat.', 'Mengurutkan bilangan bulat.'], successCriteria: 'Siswa dapat mengurutkan 5 bilangan bulat.' },
    },
    {
      id: 'scene-review', role: 'starter', sceneType: 'starter-review', title: 'Review',
      objectiveRefs: ['obj-1'],
      content: { kind: 'starter-review', priorLearning: 'Sebelumnya kita belajar bilangan asli.', triggerQuestion: 'Apa yang terjadi jika suhu di bawah 0 derajat?', bridgeToNewTopic: 'Hari ini kita kenal bilangan negatif.' },
    },
    {
      id: 'scene-materi', role: 'material', sceneType: 'learning-scene', title: 'Materi: Bilangan Bulat',
      objectiveRefs: ['obj-1', 'obj-2'],
      content: { kind: 'learning-material', conceptTitle: 'Bilangan Bulat', explanation: 'Bilangan bulat terdiri dari bilangan positif (1, 2, 3...), nol (0), dan bilangan negatif (-1, -2, -3...). Bilangan bulat dapat digambarkan pada garis bilangan.', examples: [{ id: 'ex1', title: 'Positif', body: '+5 artinya 5 langkah ke kanan.' }, { id: 'ex2', title: 'Negatif', body: '-3 artinya 3 langkah ke kiri.' }], keyPoints: ['Nol bukan positif bukan negatif.', 'Makin ke kiri makin kecil.', 'Makin ke kanan makin besar.'] },
    },
    {
      id: 'scene-diskusi', role: 'material', sceneType: 'discussion-scene', title: 'Diskusi',
      objectiveRefs: ['obj-2'],
      content: { kind: 'discussion-scene', discussionPrompt: 'Berikan 3 contoh penggunaan bilangan negatif dalam kehidupan sehari-hari.' },
    },
    {
      id: 'scene-game1', role: 'activity', sceneType: 'sequencing-game', title: 'Game: Urutkan Bilangan',
      objectiveRefs: ['obj-2'],
      content: { kind: 'sequencing-game', instruction: 'Urutkan dari terkecil ke terbesar!', items: [{ id: 's1', label: '-3' }, { id: 's2', label: '0' }, { id: 's3', label: '2' }, { id: 's4', label: '-1' }], correctOrder: ['s1', 's4', 's2', 's3'], scorePerItem: 10, completionMessage: 'Hebat! Urutan tepat.' },
    },
    {
      id: 'scene-hubungan', role: 'material', sceneType: 'case-analysis', title: 'Analisis: Suhu',
      objectiveRefs: ['obj-1', 'obj-2'],
      content: { kind: 'case-analysis', caseText: 'Suhu ruangan adalah 5°C. Kemudian turun 8 derajat. Berapa suhu sekarang?', analysisPrompt: 'Gunakan garis bilangan untuk menyelesaikan.', revealExplanation: '5 - 8 = -3. Suhu sekarang -3°C.' },
    },
    {
      id: 'scene-game2', role: 'quiz', sceneType: 'quiz-challenge', title: 'Quiz',
      objectiveRefs: ['obj-1', 'obj-2'],
      content: { kind: 'quiz-question', prompt: 'Bilangan bulat antara -2 dan 2 adalah...', choices: [{ id: 'c1', text: '-1, 0, 1' }, { id: 'c2', text: '-2, 0, 2' }, { id: 'c3', text: '0, 1, 2' }], correctChoiceId: 'c1', feedbackCorrect: 'Benar! -1, 0, 1 berada di antara -2 dan 2.', feedbackWrong: 'Belum tepat. Periksa garis bilangan.' },
    },
    // TEACHER-READY-TEMPLATE-QUALITY: rubric-panel for assessment
    {
      id: 'scene-rubrik', role: 'material', sceneType: 'rubric-panel', title: 'Rubrik Penilaian',
      objectiveRefs: ['obj-1', 'obj-2'],
      content: { kind: 'rubric-panel', criteria: [{ id: 'rc1', name: 'Konsep Bilangan', description: 'Menjelaskan positif, nol, negatif dengan benar' }, { id: 'rc2', name: 'Pengurutan', description: 'Mengurutkan bilangan bulat dari terkecil ke terbesar' }, { id: 'rc3', name: 'Aplikasi', description: 'Menyelesaikan soal cerita dengan bilangan bulat' }], levels: [{ id: 'rl1', name: 'Perlu Bimbingan', score: 50, descriptor: 'Tidak dapat mengurutkan bilangan' }, { id: 'rl2', name: 'Berkembang', score: 70, descriptor: 'Mengurutkan 2-3 bilangan' }, { id: 'rl3', name: 'Kompeten', score: 85, descriptor: 'Mengurutkan 5 bilangan + jelaskan konsep' }, { id: 'rl4', name: 'Mahir', score: 100, descriptor: 'Urutan + konsep + aplikasi soal cerita' }], scoreGuide: 'Total = (sequencing + quiz + rubrik) / 3. Tuntas jika >= 70.' },
    },
    { id: 'scene-hasil', role: 'material', sceneType: 'result-summary', title: 'Hasil', objectiveRefs: ['obj-1', 'obj-2'], content: { kind: 'result-summary', scoreSummary: { score: 0, maxScore: 100 }, achievementLevel: 'Matematikawan Pemula' } },
    {
      id: 'scene-refleksi', role: 'reflection', sceneType: 'reflection-journal', title: 'Refleksi',
      objectiveRefs: ['obj-1', 'obj-2'],
      content: { kind: 'reflection-journal', reflectionPrompts: ['Bilangan negatif sulit atau mudah dipahami? Mengapa?', 'Kapan kamu menggunakan bilangan negatif di kehidupan?'] },
    },
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
  // TEACHER-READY-TEMPLATE-QUALITY: teacher-pedagogy content kinds
  // teacher-guide
  teacherInstructionMax: number;
  facilitationTipsMax: number;
  facilitationTipItemMax: number;
  timeAllocationMax: number;
  assessmentNotesMax: number;
  // rubric-panel
  rubricCriteriaMax: number;
  rubricCriteriaNameMax: number;
  rubricCriteriaDescMax: number;
  rubricLevelsMax: number;
  rubricLevelNameMax: number;
  rubricLevelDescMax: number;
  rubricScoreGuideMax: number;
  // diagnostic-check
  diagnosticPromptMax: number;
  diagnosticQuestionsMax: number;
  diagnosticQuestionPromptMax: number;
  diagnosticChoiceTextMax: number;
  diagnosticRecommendationMax: number;
  // remedial-practice
  remedialMisconceptionMax: number;
  remedialReteachMax: number;
  remedialPracticeMax: number;
  remedialPracticePromptMax: number;
  remedialChoiceTextMax: number;
  remedialRetryMax: number;
  // enrichment-challenge
  enrichmentContextMax: number;
  enrichmentTaskMax: number;
  enrichmentRubricPreviewMax: number;
  enrichmentRubricPreviewDescMax: number;
  enrichmentCompletionMax: number;
  // matching-game
  matchingInstructionMax: number;
  matchingItemsMax: number;
  matchingItemLabelMax: number;
  // hotspot-map
  hotspotGuidingMax: number;
  hotspotCountMax: number;
  hotspotInfoMax: number;
  hotspotCaptionMax: number;
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
  // TEACHER-READY-TEMPLATE-QUALITY: teacher-pedagogy density limits
  teacherInstructionMax: 300,
  facilitationTipsMax: 4,
  facilitationTipItemMax: 100,
  timeAllocationMax: 40,
  assessmentNotesMax: 200,
  rubricCriteriaMax: 4,
  rubricCriteriaNameMax: 40,
  rubricCriteriaDescMax: 100,
  rubricLevelsMax: 4,
  rubricLevelNameMax: 20,
  rubricLevelDescMax: 80,
  rubricScoreGuideMax: 150,
  diagnosticPromptMax: 160,
  diagnosticQuestionsMax: 4,
  diagnosticQuestionPromptMax: 120,
  diagnosticChoiceTextMax: 60,
  diagnosticRecommendationMax: 200,
  remedialMisconceptionMax: 160,
  remedialReteachMax: 300,
  remedialPracticeMax: 3,
  remedialPracticePromptMax: 120,
  remedialChoiceTextMax: 60,
  remedialRetryMax: 120,
  enrichmentContextMax: 200,
  enrichmentTaskMax: 200,
  enrichmentRubricPreviewMax: 3,
  enrichmentRubricPreviewDescMax: 80,
  enrichmentCompletionMax: 120,
  matchingInstructionMax: 140,
  matchingItemsMax: 6,
  matchingItemLabelMax: 40,
  hotspotGuidingMax: 140,
  hotspotCountMax: 6,
  hotspotInfoMax: 100,
  hotspotCaptionMax: 100,
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
    } else if (kind === 'teacher-guide') {
      // TEACHER-READY-TEMPLATE-QUALITY: teacher-guide density
      const ti = asString(content.teacherInstruction);
      if (ti) pushLenIssue(issues, ctx.tplId, ctx.sceneId, 'teacherInstruction', ti, limits.teacherInstructionMax);
      const ta = asString(content.timeAllocation);
      if (ta) pushLenIssue(issues, ctx.tplId, ctx.sceneId, 'timeAllocation', ta, limits.timeAllocationMax);
      const an = asString(content.assessmentNotes);
      if (an) pushLenIssue(issues, ctx.tplId, ctx.sceneId, 'assessmentNotes', an, limits.assessmentNotesMax);
      const tips = content.facilitationTips;
      if (Array.isArray(tips)) {
        pushCountIssue(issues, ctx.tplId, ctx.sceneId, 'facilitationTips', tips.length, limits.facilitationTipsMax);
        tips.forEach((tip, i) => {
          const s = asString(tip);
          if (s) pushLenIssue(issues, ctx.tplId, ctx.sceneId, `facilitationTips[${i}]`, s, limits.facilitationTipItemMax);
        });
      }
    } else if (kind === 'rubric-panel') {
      // TEACHER-READY-TEMPLATE-QUALITY: rubric-panel density
      const sg = asString(content.scoreGuide);
      if (sg) pushLenIssue(issues, ctx.tplId, ctx.sceneId, 'scoreGuide', sg, limits.rubricScoreGuideMax);
      const criteria = content.criteria;
      if (Array.isArray(criteria)) {
        pushCountIssue(issues, ctx.tplId, ctx.sceneId, 'criteria', criteria.length, limits.rubricCriteriaMax);
        criteria.forEach((c, i) => {
          const cObj = c as AnyContent;
          const name = asString(cObj.name);
          if (name) pushLenIssue(issues, ctx.tplId, ctx.sceneId, `criteria[${i}].name`, name, limits.rubricCriteriaNameMax);
          const desc = asString(cObj.description);
          if (desc) pushLenIssue(issues, ctx.tplId, ctx.sceneId, `criteria[${i}].description`, desc, limits.rubricCriteriaDescMax);
        });
      }
      const levels = content.levels;
      if (Array.isArray(levels)) {
        pushCountIssue(issues, ctx.tplId, ctx.sceneId, 'levels', levels.length, limits.rubricLevelsMax);
        levels.forEach((l, i) => {
          const lObj = l as AnyContent;
          const name = asString(lObj.name);
          if (name) pushLenIssue(issues, ctx.tplId, ctx.sceneId, `levels[${i}].name`, name, limits.rubricLevelNameMax);
          const desc = asString(lObj.descriptor);
          if (desc) pushLenIssue(issues, ctx.tplId, ctx.sceneId, `levels[${i}].descriptor`, desc, limits.rubricLevelDescMax);
        });
      }
    } else if (kind === 'diagnostic-check') {
      // TEACHER-READY-TEMPLATE-QUALITY: diagnostic-check density
      const dp = asString(content.diagnosticPrompt);
      if (dp) pushLenIssue(issues, ctx.tplId, ctx.sceneId, 'diagnosticPrompt', dp, limits.diagnosticPromptMax);
      const rec = asString(content.recommendation);
      if (rec) pushLenIssue(issues, ctx.tplId, ctx.sceneId, 'recommendation', rec, limits.diagnosticRecommendationMax);
      const qs = content.questionSet;
      if (Array.isArray(qs)) {
        pushCountIssue(issues, ctx.tplId, ctx.sceneId, 'questionSet', qs.length, limits.diagnosticQuestionsMax);
        qs.forEach((q, i) => {
          const qObj = q as AnyContent;
          const prompt = asString(qObj.prompt);
          if (prompt) pushLenIssue(issues, ctx.tplId, ctx.sceneId, `questionSet[${i}].prompt`, prompt, limits.diagnosticQuestionPromptMax);
          const choices = qObj.choices;
          if (Array.isArray(choices)) {
            choices.forEach((ch, j) => {
              const chObj = ch as AnyContent;
              const t = asString(chObj.text);
              if (t) pushLenIssue(issues, ctx.tplId, ctx.sceneId, `questionSet[${i}].choices[${j}].text`, t, limits.diagnosticChoiceTextMax);
            });
          }
        });
      }
    } else if (kind === 'remedial-practice') {
      // TEACHER-READY-TEMPLATE-QUALITY: remedial-practice density
      const mc = asString(content.misconception);
      if (mc) pushLenIssue(issues, ctx.tplId, ctx.sceneId, 'misconception', mc, limits.remedialMisconceptionMax);
      const re = asString(content.reteachExplanation);
      if (re) pushLenIssue(issues, ctx.tplId, ctx.sceneId, 'reteachExplanation', re, limits.remedialReteachMax);
      const rq = asString(content.retryQuestion);
      if (rq) pushLenIssue(issues, ctx.tplId, ctx.sceneId, 'retryQuestion', rq, limits.remedialRetryMax);
      const gp = content.guidedPractice;
      if (Array.isArray(gp)) {
        pushCountIssue(issues, ctx.tplId, ctx.sceneId, 'guidedPractice', gp.length, limits.remedialPracticeMax);
        gp.forEach((p, i) => {
          const pObj = p as AnyContent;
          const prompt = asString(pObj.prompt);
          if (prompt) pushLenIssue(issues, ctx.tplId, ctx.sceneId, `guidedPractice[${i}].prompt`, prompt, limits.remedialPracticePromptMax);
          const choices = pObj.choices;
          if (Array.isArray(choices)) {
            choices.forEach((ch, j) => {
              const chObj = ch as AnyContent;
              const t = asString(chObj.text);
              if (t) pushLenIssue(issues, ctx.tplId, ctx.sceneId, `guidedPractice[${i}].choices[${j}].text`, t, limits.remedialChoiceTextMax);
            });
          }
        });
      }
    } else if (kind === 'enrichment-challenge') {
      // TEACHER-READY-TEMPLATE-QUALITY: enrichment-challenge density
      const cc = asString(content.challengeContext);
      if (cc) pushLenIssue(issues, ctx.tplId, ctx.sceneId, 'challengeContext', cc, limits.enrichmentContextMax);
      const at = asString(content.advancedTask);
      if (at) pushLenIssue(issues, ctx.tplId, ctx.sceneId, 'advancedTask', at, limits.enrichmentTaskMax);
      const cm = asString(content.completionMessage);
      if (cm) pushLenIssue(issues, ctx.tplId, ctx.sceneId, 'completionMessage', cm, limits.enrichmentCompletionMax);
      const rp = content.rubricPreview;
      if (Array.isArray(rp)) {
        pushCountIssue(issues, ctx.tplId, ctx.sceneId, 'rubricPreview', rp.length, limits.enrichmentRubricPreviewMax);
        rp.forEach((r, i) => {
          const rObj = r as AnyContent;
          const desc = asString(rObj.descriptor);
          if (desc) pushLenIssue(issues, ctx.tplId, ctx.sceneId, `rubricPreview[${i}].descriptor`, desc, limits.enrichmentRubricPreviewDescMax);
        });
      }
    } else if (kind === 'matching-game') {
      // TEACHER-READY-TEMPLATE-QUALITY: matching-game density
      const ins = asString(content.instruction);
      if (ins) pushLenIssue(issues, ctx.tplId, ctx.sceneId, 'instruction', ins, limits.matchingInstructionMax);
      const leftItems = content.leftItems;
      if (Array.isArray(leftItems)) {
        pushCountIssue(issues, ctx.tplId, ctx.sceneId, 'leftItems', leftItems.length, limits.matchingItemsMax);
        leftItems.forEach((it, i) => {
          const itObj = it as AnyContent;
          const label = asString(itObj.label);
          if (label) pushLenIssue(issues, ctx.tplId, ctx.sceneId, `leftItems[${i}].label`, label, limits.matchingItemLabelMax);
        });
      }
      const rightItems = content.rightItems;
      if (Array.isArray(rightItems)) {
        pushCountIssue(issues, ctx.tplId, ctx.sceneId, 'rightItems', rightItems.length, limits.matchingItemsMax);
        rightItems.forEach((it, i) => {
          const itObj = it as AnyContent;
          const label = asString(itObj.label);
          if (label) pushLenIssue(issues, ctx.tplId, ctx.sceneId, `rightItems[${i}].label`, label, limits.matchingItemLabelMax);
        });
      }
    } else if (kind === 'hotspot-map') {
      // TEACHER-READY-TEMPLATE-QUALITY: hotspot-map density
      const gq = asString(content.guidingQuestion);
      if (gq) pushLenIssue(issues, ctx.tplId, ctx.sceneId, 'guidingQuestion', gq, limits.hotspotGuidingMax);
      const cap = asString(content.caption);
      if (cap) pushLenIssue(issues, ctx.tplId, ctx.sceneId, 'caption', cap, limits.hotspotCaptionMax);
      const hs = content.hotspots;
      if (Array.isArray(hs)) {
        pushCountIssue(issues, ctx.tplId, ctx.sceneId, 'hotspots', hs.length, limits.hotspotCountMax);
        hs.forEach((h, i) => {
          const hObj = h as AnyContent;
          const info = asString(hObj.info);
          if (info) pushLenIssue(issues, ctx.tplId, ctx.sceneId, `hotspots[${i}].info`, info, limits.hotspotInfoMax);
        });
      }
    }
    // Other content kinds (cover-hero, curriculum-guide, objectives-path,
    // starter-review, result-summary) are intentionally not length-checked
    // — they have flexible layout blocks that wrap naturally on 16:9.
  }

  return issues;
}

// ---------------------------------------------------------------------------
// TEACHER-READY-TEMPLATE-QUALITY: Objective Coverage Helper
// ---------------------------------------------------------------------------
//
// Pure helper that verifies every objective in a template is referenced by
// at least one scene's objectiveRefs, and every non-cover/closing scene has
// at least one objectiveRef. Returns an issues array — empty = all covered.

export type ObjectiveCoverageIssue = {
  templateId: string;
  field: string;
  message: string;
};

export function checkTemplateObjectiveCoverage(
  template: PedagogicalTemplate,
): ObjectiveCoverageIssue[] {
  const issues: ObjectiveCoverageIssue[] = [];
  const objectiveIds = new Set(template.objectives.map((o) => o.id));
  const coveredObjectives = new Set<string>();
  const skipRoles = new Set(['cover', 'closing']);

  for (const scene of template.scenes) {
    const refs = scene.objectiveRefs;
    if (!refs || refs.length === 0) {
      // cover and closing scenes don't need objectiveRefs
      if (!skipRoles.has(scene.role)) {
        issues.push({
          templateId: template.id,
          field: `scenes[${scene.id}].objectiveRefs`,
          message: `scene ${scene.id} (role: ${scene.role}) has no objectiveRefs — every non-cover/closing scene should address at least one objective`,
        });
      }
      continue;
    }
    // Validate that each ref points to a real objective
    for (const ref of refs) {
      if (!objectiveIds.has(ref)) {
        issues.push({
          templateId: template.id,
          field: `scenes[${scene.id}].objectiveRefs`,
          message: `objectiveRef "${ref}" does not match any objective ID in template ${template.id}`,
        });
      } else {
        coveredObjectives.add(ref);
      }
    }
  }

  // Verify every objective is covered by at least one scene
  for (const obj of template.objectives) {
    if (!coveredObjectives.has(obj.id)) {
      issues.push({
        templateId: template.id,
        field: `objectives[${obj.id}]`,
        message: `objective "${obj.id}" is not covered by any scene's objectiveRefs`,
      });
    }
  }

  return issues;
}

export function checkAllTemplatesObjectiveCoverage(
  templates: readonly PedagogicalTemplate[] = PEDAGOGICAL_TEMPLATES,
): ObjectiveCoverageIssue[] {
  return templates.flatMap((t) => checkTemplateObjectiveCoverage(t));
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
