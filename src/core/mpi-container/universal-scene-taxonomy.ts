/**
 * Universal Scene Taxonomy (FOUNDATION-FINAL-LOCK-01 PATCH A).
 *
 * Layer: core/mpi-container (pure data, no React/DOM)
 * Allowed imports: none (only TypeScript built-ins)
 *
 * Kontrak:
 *   Definisi resmi semua scene types yang didukung SILSE.
 *   5 rendered scenes + 21 contract-only scenes = 26 total.
 *   Setiap scene type punya required slots minimal.
 *   Validator menggunakan ini untuk menolak scene tanpa required slot.
 *
 *   Prinsip:
 *     - Pure data, no runtime code.
 *     - Tidak semua scene punya renderer final sekarang.
 *     - Semua wajib punya tempat resmi di schema, prompt, container.
 */

// ---------------------------------------------------------------------------
// Rendered scene types (punya renderer penuh)
// ---------------------------------------------------------------------------

export const RENDERED_SCENE_TYPES = [
  'cover-hero',
  'learning-scene',
  'game-mission',
  'quiz-challenge',
  'closing-award',
] as const;

// ---------------------------------------------------------------------------
// Contract-only scene types (punya contract, belum punya renderer)
// ---------------------------------------------------------------------------

export const CONTRACT_ONLY_SCENE_TYPES = [
  'curriculum-guide',
  'objectives-path',
  'starter-review',
  'discussion-scene',
  'case-analysis',
  'classification-game',
  'result-summary',
  'reflection-journal',
  'diagnostic-check',
  'remedial-practice',
  'enrichment-challenge',
  'worksheet-activity',
  'rubric-panel',
  'hotspot-map',
  'timeline-story',
  'matching-game',
  'sequencing-game',
  'branching-scenario',
  'media-focus',
  'glossary-cards',
  'teacher-guide',
  'accessibility-help',
] as const;

// ---------------------------------------------------------------------------
// All scene types
// ---------------------------------------------------------------------------

export const ALL_SCENE_TYPES = [...RENDERED_SCENE_TYPES, ...CONTRACT_ONLY_SCENE_TYPES] as const;

export type UniversalSceneType = (typeof ALL_SCENE_TYPES)[number];

// ---------------------------------------------------------------------------
// Required slots per scene type
// ---------------------------------------------------------------------------

export type SceneRequiredSlots = {
  sceneType: string;
  requiredSlots: string[];
  optionalSlots: string[];
  description: string;
  rendered: boolean;
};

export const SCENE_REQUIRED_SLOTS: SceneRequiredSlots[] = [
  // === Rendered scenes ===
  { sceneType: 'cover-hero', requiredSlots: ['heroTitle'], optionalSlots: ['kicker', 'subtitle', 'badges', 'primaryAction', 'visualAnchor'], description: 'Halaman sampul dengan kicker, hero title, badges, primary action.', rendered: true },
  { sceneType: 'learning-scene', requiredSlots: ['explanationPanel'], optionalSlots: ['conceptHeader', 'exampleCards', 'keyPoint', 'studentAction', 'visualHint'], description: 'Materi pembelajaran: concept header + explanation + examples + key points.', rendered: true },
  { sceneType: 'game-mission', requiredSlots: ['briefing'], optionalSlots: ['target', 'actionGrid', 'feedback', 'reward', 'missionProgress'], description: 'Scene misi: briefing + target + action cards + feedback + reward.', rendered: true },
  { sceneType: 'quiz-challenge', requiredSlots: ['questionFocus'], optionalSlots: ['challengeHeader', 'answerArea', 'feedback', 'progress'], description: 'Kuis challenge: question focus + answer cards + feedback + progress.', rendered: true },
  { sceneType: 'closing-award', requiredSlots: ['achievement'], optionalSlots: ['summary', 'reflection', 'reward', 'nextLearning', 'finalAction'], description: 'Penutup: achievement + summary + reward + final action.', rendered: true },

  // === Contract-only scenes ===
  { sceneType: 'curriculum-guide', requiredSlots: ['curriculumTitle', 'competency'], optionalSlots: ['learningFlow', 'atpSteps'], description: 'CP/TP/ATP Kurikulum Merdeka.', rendered: false },
  { sceneType: 'objectives-path', requiredSlots: ['objectiveList'], optionalSlots: ['successCriteria', 'activityPath'], description: 'Tujuan pembelajaran dengan kriteria berhasil.', rendered: false },
  { sceneType: 'starter-review', requiredSlots: ['priorLearning'], optionalSlots: ['triggerQuestion', 'bridgeToNewTopic'], description: 'Review pertemuan sebelumnya + trigger question.', rendered: false },
  { sceneType: 'discussion-scene', requiredSlots: ['discussionPrompt'], optionalSlots: ['groupInstruction', 'responseInput'], description: 'Diskusi kelompok dengan prompt dan instruksi.', rendered: false },
  { sceneType: 'case-analysis', requiredSlots: ['caseText', 'analysisPrompt'], optionalSlots: ['revealExplanation', 'groupDiscussion'], description: 'Analisis kasus dengan prompt dan reveal.', rendered: false },
  { sceneType: 'classification-game', requiredSlots: ['items', 'categories'], optionalSlots: ['feedback', 'scoreDisplay'], description: 'Game klasifikasi kartu ke kategori.', rendered: false },
  { sceneType: 'result-summary', requiredSlots: ['scoreSummary'], optionalSlots: ['achievementLevel', 'breakdown'], description: 'Ringkasan hasil + achievement level.', rendered: false },
  { sceneType: 'reflection-journal', requiredSlots: ['reflectionPrompts'], optionalSlots: ['commitmentInput', 'portfolioSummary'], description: 'Jurnal refleksi dengan prompts.', rendered: false },
  { sceneType: 'diagnostic-check', requiredSlots: ['diagnosticPrompt', 'questionSet'], optionalSlots: ['recommendation'], description: 'Diagnostik dengan rekomendasi.', rendered: false },
  { sceneType: 'remedial-practice', requiredSlots: ['misconception', 'reteachExplanation'], optionalSlots: ['guidedPractice', 'retryQuestion'], description: 'Remedial: misconception + reteach + practice.', rendered: false },
  { sceneType: 'enrichment-challenge', requiredSlots: ['challengeContext', 'advancedTask'], optionalSlots: ['creativeOutput'], description: 'Enrichment: challenge + advanced task.', rendered: false },
  { sceneType: 'worksheet-activity', requiredSlots: ['instruction', 'taskSteps'], optionalSlots: ['inputFields'], description: 'Worksheet: instruction + task steps + input.', rendered: false },
  { sceneType: 'rubric-panel', requiredSlots: ['criteria', 'levels'], optionalSlots: ['scoreGuide'], description: 'Rubrik penilaian: criteria + levels.', rendered: false },
  { sceneType: 'hotspot-map', requiredSlots: ['backgroundVisual', 'hotspots'], optionalSlots: ['tooltip'], description: 'Peta hotspot: background + hotspots.', rendered: false },
  { sceneType: 'timeline-story', requiredSlots: ['events'], optionalSlots: ['checkpointQuestion'], description: 'Timeline dengan events + checkpoint.', rendered: false },
  { sceneType: 'matching-game', requiredSlots: ['leftItems', 'rightItems', 'correctPairs'], optionalSlots: ['feedback'], description: 'Game mencocokkan: left + right + pairs.', rendered: false },
  { sceneType: 'sequencing-game', requiredSlots: ['items', 'correctOrder'], optionalSlots: ['feedback'], description: 'Game urutkan: items + correct order.', rendered: false },
  { sceneType: 'branching-scenario', requiredSlots: ['scenario', 'choices'], optionalSlots: ['consequences'], description: 'Skenario bercabang: scenario + choices.', rendered: false },
  { sceneType: 'media-focus', requiredSlots: ['mediaAsset', 'guidingQuestion'], optionalSlots: ['caption'], description: 'Fokus media: asset + guiding question.', rendered: false },
  { sceneType: 'glossary-cards', requiredSlots: ['terms', 'definitions'], optionalSlots: ['examples'], description: 'Kartu glosarium: terms + definitions.', rendered: false },
  { sceneType: 'teacher-guide', requiredSlots: ['teacherInstruction'], optionalSlots: ['timeAllocation', 'facilitationTips'], description: 'Panduan guru: instruction + tips.', rendered: false },
  { sceneType: 'accessibility-help', requiredSlots: ['readingGuide'], optionalSlots: ['keyboardGuide', 'contrastOption'], description: 'Bantuan aksesibilitas.', rendered: false },
];

// ---------------------------------------------------------------------------
// Helper: get required slots for a scene type
// ---------------------------------------------------------------------------

export function getRequiredSlotsForSceneType(sceneType: string): string[] {
  const entry = SCENE_REQUIRED_SLOTS.find((s) => s.sceneType === sceneType);
  return entry?.requiredSlots ?? [];
}

export function isRenderedSceneType(sceneType: string): boolean {
  return (RENDERED_SCENE_TYPES as readonly string[]).includes(sceneType);
}

export function isKnownSceneType(sceneType: string): boolean {
  return (ALL_SCENE_TYPES as readonly string[]).includes(sceneType);
}
