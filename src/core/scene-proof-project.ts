/**
 * Sample project with scene-renderable game (FOUNDATION-INTEGRATION-01).
 *
 * Project ini punya game component dengan sceneMetadata.scene = 'game-mission',
 * sehingga page game bisa dirender via SceneRendererView di editor/preview/export.
 */

import type { SimpleProject } from './types';
import { createProjectId, createPageId, createComponentId } from './ids';
import { PROJECT_VERSION } from './types';
import { stylePackToProjectStyle } from './style-presets';
import { resolveStylePackV1 } from './style-packs/style-pack-registry';

export function createSceneProofProject(): SimpleProject {
  const coverId = createPageId();
  const gameId = createPageId();
  const closingId = createPageId();

  return {
    id: createProjectId(),
    title: 'Scene Proof — Misi Penjaga Norma',
    version: PROJECT_VERSION,
    currentPageId: gameId, // start at game page for easy testing
    stylePackId: 'modern-clean',
    style: stylePackToProjectStyle(resolveStylePackV1('modern-clean')),
    curriculum: {
      subject: 'PPKn',
      grade: '7',
      phase: 'D',
      topic: 'Hidup Tertib dengan Norma',
      objectives: [
        { id: createComponentId(), text: 'Menunjukkan sikap tertib sesuai norma.' },
      ],
    },
    pages: [
      // Cover (legacy path — not scene-renderable)
      {
        id: coverId, title: 'Cover', role: 'cover', layoutId: 'coverCentered',
        background: { type: 'color', color: '#1e3a5f' },
        components: [
          { id: createComponentId(), type: 'text', text: 'Misi Penjaga Norma', variant: 'title', x: 140, y: 280, width: 1000, height: 120 },
        ],
      },
      // Game page (scene-renderable — has sceneMetadata)
      {
        id: gameId, title: 'Game Misi', role: 'activity', layoutId: 'blank',
        background: { type: 'color', color: '#f0fdf4' },
        components: [
          {
            id: createComponentId(),
            type: 'game',
            gameType: 'missionQuiz',
            title: 'Penjaga Norma di Sekolah',
            instruction: 'Kamu menjadi penjaga norma di lingkungan sekolah.',
            missions: [
              {
                id: createComponentId(),
                title: 'Misi 1',
                prompt: 'Pilih tindakan yang paling sesuai dengan norma.',
                choices: [
                  { id: createComponentId(), text: 'Menegur dengan sopan' },
                  { id: createComponentId(), text: 'Membiarkan saja' },
                  { id: createComponentId(), text: 'Marah di depan umum' },
                ],
                correctChoiceIndex: 0,
                feedbackCorrect: 'Tepat. Menegur dengan sopan menunjukkan kepedulian.',
                feedbackWrong: 'Coba pikirkan kembali tanggung jawab warga sekolah.',
                points: 10,
              },
            ],
            scoringStyle: 'badge',
            x: 100, y: 60, width: 1080, height: 580,
            sceneMetadata: {
              scene: 'game-mission',
              briefing: 'Kamu menjadi penjaga norma di lingkungan sekolah. Seorang teman tidak menegur siswa yang membuang sampah sembarangan.',
              missionTarget: 'Pilih tindakan yang paling sesuai dengan norma kesopanan dan kepedulian warga sekolah.',
              reward: { type: 'badge', label: 'Lencana Penjaga Norma' },
            },
          },
        ],
      },
      // Closing (legacy path — not scene-renderable)
      {
        id: closingId, title: 'Penutup', role: 'closing', layoutId: 'blank',
        background: { type: 'color', color: '#1e3a5f' },
        components: [
          { id: createComponentId(), type: 'text', text: 'Terima Kasih', variant: 'title', x: 340, y: 280, width: 600, height: 80 },
        ],
      },
    ],
  };
}
