/**
 * Generate MPI from Topic (GUIDED-MPI-FLOW-01).
 *
 * Layer: core/guided-flow (pure function, no React/DOM)
 * Allowed imports: ../types, ../ids, ../component-factory, ../project-factory,
 *   ../style-presets, ./mpi-topic-catalog, ../design/apply-design-recipe,
 *   ../design/layout-quality
 *
 * Kontrak (GUIDED-MPI-FLOW-01 Scope 2):
 *   Engine yang generate 10 halaman MPI lengkap (Cover→Penutup) dari topik
 *   yang dipilih guru. Pakai:
 *     - Content patterns untuk isi per halaman
 *     - Design recipe untuk placement (applyPageDesignRecipe)
 *     - Layout quality check untuk validasi
 *
 *   Output: SimpleProject draft yang bisa guru terima/edit.
 */

import type { SimpleProject, SimplePage, CurriculumObjective } from '../types';
import { createProjectId, createPageId, createComponentId } from '../ids';
import { PROJECT_VERSION } from '../types';
import { DEFAULT_STYLE_PACK, stylePackToProjectStyle } from '../style-presets';
import {
  createTextComponent,
  createCardComponent,
  createNavigationComponent,
  createQuestionComponent,
  createGameComponent,
  createGameMission,
  createLayeredInfoComponent,
  createLayeredInfoLayer,
} from '../component-factory';
import type { MpiTopic } from './mpi-topic-catalog';
import { applyPageDesignRecipe } from '../design/apply-design-recipe';
import { validateLayoutQuality, type LayoutQualityResult } from '../design/layout-quality';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GeneratedMpiResult = {
  project: SimpleProject;
  qualityReport: LayoutQualityResult;
};

// ---------------------------------------------------------------------------
// Page builders (one per role)
// ---------------------------------------------------------------------------

function buildCover(topic: MpiTopic): SimplePage {
  return {
    id: createPageId(),
    title: 'Cover',
    role: 'cover',
    layoutId: 'coverCentered',
    background: { type: 'color', color: '#1e3a5f' },
    components: [
      createTextComponent('cover', {
        variant: 'title',
        text: topic.topic,
        x: 140, y: 280, width: 1000, height: 120,
      }),
      createTextComponent('cover', {
        variant: 'subtitle',
        text: `${topic.mapel} — Kelas ${topic.grade} — Fase ${topic.phase}`,
        x: 340, y: 420, width: 600, height: 60,
      }),
    ],
  };
}

function buildGuide(): SimplePage {
  return {
    id: createPageId(),
    title: 'Panduan',
    role: 'guide',
    layoutId: 'blank',
    background: { type: 'color', color: '#ffffff' },
    components: [
      createTextComponent('guide', {
        variant: 'title',
        text: 'Panduan Penggunaan',
        x: 80, y: 40, width: 1120, height: 60,
      }),
      createCardComponent(
        '1. Baca tujuan pembelajaran.\n2. Pelajari materi pada halaman Materi.\n3. Kerjakan Kuis untuk menguji pemahaman.\n4. Mainkan Game Misi untuk latihan.\n5. Tulis refleksi di halaman Refleksi.\n\nGunakan tombol navigasi di kanan bawah untuk pindah halaman.',
        {
          variant: 'infoCard',
          title: 'Cara Belajar',
          x: 80, y: 120, width: 1120, height: 400,
        },
      ),
      createNavigationComponent('Mulai →', 'next', {
        variant: 'primaryAction',
        x: 900, y: 620, width: 300, height: 60,
      }),
    ],
  };
}

function buildLearningObjectives(topic: MpiTopic): SimplePage {
  const objectives: CurriculumObjective[] = topic.objectives.map((text) => ({
    id: createComponentId(),
    text,
  }));

  return {
    id: createPageId(),
    title: 'Tujuan Pembelajaran',
    role: 'learningObjectives',
    layoutId: 'blank',
    background: { type: 'color', color: '#ffffff' },
    components: [
      createLayeredInfoComponent({
        variant: 'iconTabs',
        title: 'Tujuan Pembelajaran',
        defaultOpenIndex: 3,
        layers: [
          createLayeredInfoLayer({ title: 'CP', icon: '📘', body: 'Capaian Pembelajaran:\n\n( Tulis CP dari kurikulum )' }),
          createLayeredInfoLayer({ title: 'ATP', icon: '🧭', body: 'Alur Tujuan Pembelajaran:\n\n( Turunan CP per pertemuan )' }),
          createLayeredInfoLayer({ title: 'Pertemuan', icon: '📍', body: 'Pertemuan ke-...\nTanggal: ...\nAlokasi: ... menit' }),
          createLayeredInfoLayer({
            title: 'Tujuan',
            icon: '🎯',
            body: objectives.map((o, i) => `${i + 1}. ${o.text}`).join('\n'),
          }),
          createLayeredInfoLayer({ title: 'Alur Belajar', icon: '🗺️', body: '1. Pemantik\n2. Materi\n3. Kuis\n4. Game\n5. Refleksi' }),
        ],
        x: 80, y: 120, width: 1120, height: 460,
      }),
      createNavigationComponent('Lanjut →', 'next', {
        variant: 'primaryAction',
        x: 900, y: 620, width: 300, height: 60,
      }),
    ],
  };
}

function buildMenu(): SimplePage {
  return {
    id: createPageId(),
    title: 'Menu Materi',
    role: 'menu',
    layoutId: 'blank',
    background: { type: 'color', color: '#f8fafc' },
    components: [
      createTextComponent('menu', {
        variant: 'title',
        text: 'Menu Materi',
        x: 80, y: 40, width: 1120, height: 60,
      }),
      createCardComponent('Refleksi awal tentang materi.', { variant: 'infoCard', title: 'Pemantik', x: 80, y: 120, width: 520, height: 120 }),
      createCardComponent('Penjelasan inti pelajaran.', { variant: 'infoCard', title: 'Materi', x: 680, y: 120, width: 520, height: 120 }),
      createCardComponent('Uji pemahaman siswa.', { variant: 'infoCard', title: 'Kuis', x: 80, y: 280, width: 520, height: 120 }),
      createCardComponent('Latihan interaktif.', { variant: 'infoCard', title: 'Game', x: 680, y: 280, width: 520, height: 120 }),
      createNavigationComponent('Mulai Belajar →', 'next', { variant: 'primaryAction', x: 900, y: 620, width: 300, height: 60 }),
    ],
  };
}

function buildStarter(topic: MpiTopic): SimplePage {
  return {
    id: createPageId(),
    title: 'Pemantik',
    role: 'starter',
    layoutId: 'blank',
    background: { type: 'color', color: '#fef3c7' },
    components: [
      createTextComponent('starter', {
        variant: 'questionPrompt',
        text: topic.starterPrompt,
        x: 100, y: 200, width: 1080, height: 120,
      }),
      createCardComponent('Pikirkan jawabanmu sebelum melihat materi!', {
        variant: 'importantNote',
        title: 'Pikirkan!',
        x: 200, y: 380, width: 880, height: 160,
      }),
      createNavigationComponent('Materi →', 'next', { variant: 'primaryAction', x: 900, y: 620, width: 300, height: 60 }),
    ],
  };
}

function buildMaterial(topic: MpiTopic): SimplePage {
  return {
    id: createPageId(),
    title: 'Materi',
    role: 'material',
    layoutId: 'singleColumn',
    background: { type: 'color', color: '#ffffff' },
    components: [
      createTextComponent('material', {
        variant: 'title',
        text: topic.topic,
        x: 80, y: 40, width: 1120, height: 60,
      }),
      createTextComponent('material', {
        variant: 'body',
        text: topic.materialSummary,
        x: 80, y: 120, width: 1120, height: 200,
      }),
      createCardComponent('Catatan: Materi di atas adalah ringkasan. Guru dapat mengembangkan lebih detail di Panel Isi.', {
        variant: 'infoCard',
        title: 'Ringkasan',
        x: 80, y: 360, width: 1120, height: 160,
      }),
      createNavigationComponent('Kuis →', 'next', { variant: 'primaryAction', x: 900, y: 620, width: 300, height: 60 }),
    ],
  };
}

function buildQuiz(topic: MpiTopic): SimplePage {
  return {
    id: createPageId(),
    title: 'Kuis',
    role: 'quiz',
    layoutId: 'blank',
    background: { type: 'color', color: '#f0f9ff' },
    components: [
      createQuestionComponent({
        title: 'Kuis',
        prompt: topic.quizPrompt,
        choices: topic.quizChoices.map((text) => ({ id: createComponentId(), text })),
        correctChoiceIndex: topic.quizCorrectIndex,
        feedbackCorrect: topic.quizFeedbackCorrect,
        feedbackWrong: topic.quizFeedbackWrong,
        points: 10,
        scoringStyle: 'points',
        x: 100, y: 60, width: 600, height: 450,
      }),
      createNavigationComponent('Game →', 'next', { variant: 'primaryAction', x: 900, y: 620, width: 300, height: 60 }),
    ],
  };
}

function buildGame(topic: MpiTopic): SimplePage {
  return {
    id: createPageId(),
    title: 'Game Misi',
    role: 'activity',
    layoutId: 'blank',
    background: { type: 'color', color: '#f0fdf4' },
    components: [
      createGameComponent({
        title: 'Petualangan ' + topic.topic,
        instruction: 'Jawab semua misi untuk menyelesaikan petualangan!',
        scoringStyle: 'stars',
        x: 100, y: 40, width: 700, height: 540,
        missions: topic.gameMissions.map((m) => ({
          ...createGameMission({
            title: `Misi ${topic.gameMissions.indexOf(m) + 1}`,
            prompt: m.prompt,
            choices: m.choices.map((text) => ({ id: createComponentId(), text })),
            correctChoiceIndex: m.correctIndex,
            feedbackCorrect: m.feedbackCorrect,
            feedbackWrong: m.feedbackWrong,
            points: 10,
          }),
        })),
      }),
      createNavigationComponent('Lanjut ke Refleksi →', 'next', { variant: 'primaryAction', x: 900, y: 620, width: 300, height: 60 }),
    ],
  };
}

function buildReflection(topic: MpiTopic): SimplePage {
  return {
    id: createPageId(),
    title: 'Refleksi',
    role: 'reflection',
    layoutId: 'blank',
    background: { type: 'color', color: '#faf5ff' },
    components: [
      createCardComponent(
        topic.reflectionPrompts.map((p) => `• ${p}`).join('\n\n') + '\n\nTulis jawabanmu di buku catatan.',
        {
          variant: 'importantNote',
          title: 'Refleksi Diri',
          x: 150, y: 150, width: 980, height: 350,
        },
      ),
      createNavigationComponent('Penutup →', 'next', { variant: 'primaryAction', x: 900, y: 620, width: 300, height: 60 }),
    ],
  };
}

function buildClosing(topic: MpiTopic): SimplePage {
  return {
    id: createPageId(),
    title: 'Penutup',
    role: 'closing',
    layoutId: 'blank',
    background: { type: 'color', color: '#1e3a5f' },
    components: [
      createTextComponent('closing', {
        variant: 'title',
        text: 'Terima Kasih',
        x: 340, y: 280, width: 600, height: 80,
      }),
      createTextComponent('closing', {
        variant: 'subtitle',
        text: `Semoga pembelajaran ${topic.topic} bermanfaat!`,
        x: 340, y: 380, width: 600, height: 60,
      }),
    ],
  };
}

// ---------------------------------------------------------------------------
// Main: generateMpiFromTopic
// ---------------------------------------------------------------------------

export function generateMpiFromTopic(topic: MpiTopic): GeneratedMpiResult {
  // Build 10 pages
  const cover = buildCover(topic);
  const guide = buildGuide();
  const objectives = buildLearningObjectives(topic);
  const menu = buildMenu();
  const starter = buildStarter(topic);
  const material = buildMaterial(topic);
  const quiz = buildQuiz(topic);
  const game = buildGame(topic);
  const reflection = buildReflection(topic);
  const closing = buildClosing(topic);

  const pages = [cover, guide, objectives, menu, starter, material, quiz, game, reflection, closing];

  // Apply design recipe to non-cover pages (cover has fixed layout)
  const designedPages = pages.map((page) => {
    if (page.role === 'cover') return page; // Skip cover — fixed centered layout
    return applyPageDesignRecipe(page);
  });

  // Build project
  const project: SimpleProject = {
    id: createProjectId(),
    title: `${topic.mapel} — ${topic.topic}`,
    version: PROJECT_VERSION,
    currentPageId: cover.id,
    stylePackId: DEFAULT_STYLE_PACK.id,
    style: stylePackToProjectStyle(DEFAULT_STYLE_PACK),
    curriculum: {
      subject: topic.mapel,
      grade: topic.grade,
      phase: topic.phase,
      topic: topic.topic,
      objectives: topic.objectives.map((text) => ({ id: createComponentId(), text })),
    },
    pages: designedPages,
  };

  // Run quality check on all pages
  const allIssues = designedPages.flatMap((page) =>
    validateLayoutQuality(page).issues.map((issue) => ({
      ...issue,
      message: `[${page.title}] ${issue.message}`,
    })),
  );

  const errorCount = allIssues.filter((i) => i.severity === 'error').length;
  const warningCount = allIssues.filter((i) => i.severity === 'warning').length;
  const qualityReport: LayoutQualityResult = {
    ok: errorCount === 0,
    score: Math.max(0, 100 - errorCount * 20 - warningCount * 5),
    issues: allIssues,
  };

  return { project, qualityReport };
}
