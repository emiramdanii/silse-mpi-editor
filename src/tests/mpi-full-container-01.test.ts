/**
 * MPI-FULL-CONTAINER-01 — Test Suite.
 *
 * Kontrak:
 *   MpiContainer tersedia, MpiScene tersedia, scene punya role + sceneType,
 *   slots tersedia, adapter SimpleProject → MpiContainer tersedia.
 */

import { describe, it, expect } from 'vitest';
import { createSamplePpknProject } from '../core/sample-project';
import {
  createMpiContainer,
  createMpiScene,
  createMpiSlot,
  createMpiFlow,
  simpleProjectToMpiContainer,
  MPI_CONTAINER_SCHEMA_VERSION,
  type MpiScene,
} from '../core/mpi-container';

describe('MPI-FULL-CONTAINER-01 — container types + factories', () => {
  it('1. createMpiContainer returns container with defaults', () => {
    const container = createMpiContainer();
    expect(container).toBeDefined();
    expect(container.schemaVersion).toBe(MPI_CONTAINER_SCHEMA_VERSION);
    expect(container.sourceKind).toBe('manual');
    expect(container.metadata.title).toBeTruthy();
    expect(container.flow.steps).toEqual([]);
    expect(container.scenes).toEqual([]);
    expect(container.assets).toEqual([]);
    expect(container.runtime).toBeDefined();
    expect(container.exportConfig).toBeDefined();
  });

  it('2. createMpiContainer accepts overrides', () => {
    const container = createMpiContainer({ metadata: { title: 'Test MPI' } });
    expect(container.metadata.title).toBe('Test MPI');
  });

  it('3. createMpiScene returns scene with role + sceneType + slots', () => {
    const scene = createMpiScene('game', 'game-mission', 'Misi Test');
    expect(scene).toBeDefined();
    expect(scene.role).toBe('game');
    expect(scene.sceneType).toBe('game-mission');
    expect(scene.title).toBe('Misi Test');
    expect(scene.slots).toEqual([]);
    expect(scene.id).toBeTruthy();
  });

  it('4. createMpiSlot returns slot with placement + content', () => {
    const slot = createMpiSlot(
      'briefing',
      { x: 0, y: 0, width: 1280, height: 100 },
      { kind: 'text', variant: 'body', text: 'Briefing' },
    );
    expect(slot).toBeDefined();
    expect(slot.role).toBe('briefing');
    expect(slot.placement.x).toBe(0);
    expect(slot.placement.width).toBe(1280);
    expect(slot.content.kind).toBe('text');
    expect(slot.id).toBeTruthy();
  });

  it('5. createMpiFlow returns flow with steps', () => {
    const flow = createMpiFlow(['scene-1', 'scene-2', 'scene-3']);
    expect(flow.steps).toHaveLength(3);
    expect(flow.steps[0].sceneId).toBe('scene-1');
    expect(flow.mode).toBe('linear');
  });

  it('6. MpiScene punya semua role yang valid', () => {
    const roles = ['cover', 'guide', 'objectives', 'starter', 'material', 'mission-map', 'game', 'quiz', 'reflection', 'closing'];
    for (const role of roles) {
      const scene = createMpiScene(role as MpiScene['role'], 'learning-scene', `Scene ${role}`);
      expect(scene.role).toBe(role);
    }
  });

  it('7. MpiScene punya semua sceneType yang valid', () => {
    const sceneTypes = ['cover-hero', 'guide-panel', 'objectives-path', 'starter-question', 'learning-scene', 'mission-map', 'game-mission', 'quiz-challenge', 'reflection-journal', 'closing-award'];
    for (const sceneType of sceneTypes) {
      const scene = createMpiScene('material', sceneType as MpiScene['sceneType'], `Scene ${sceneType}`);
      expect(scene.sceneType).toBe(sceneType);
    }
  });

  it('8. MpiSceneSlot content union supports all kinds', () => {
    const textSlot = createMpiSlot('title', { x: 0, y: 0, width: 100, height: 50 }, { kind: 'text', variant: 'title', text: 'Hello' });
    expect(textSlot.content.kind).toBe('text');

    const cardSlot = createMpiSlot('card', { x: 0, y: 0, width: 100, height: 50 }, { kind: 'card', variant: 'info-card', body: 'Body' });
    expect(cardSlot.content.kind).toBe('card');

    const gameSlot = createMpiSlot('game', { x: 0, y: 0, width: 100, height: 50 }, {
      kind: 'game-mission',
      briefing: 'Brief',
      missionTarget: 'Target',
      actions: [{ id: 'a', label: 'A', result: 'correct', feedback: 'Good' }],
      reward: { type: 'badge', label: 'Badge' },
    });
    expect(gameSlot.content.kind).toBe('game-mission');
  });

  it('9. MpiContainer runtime config supports score + completed scenes', () => {
    const container = createMpiContainer({
      runtime: { score: 50, completedSceneIds: ['scene-1'], showProgress: true, showScore: true },
    });
    expect(container.runtime.score).toBe(50);
    expect(container.runtime.completedSceneIds).toContain('scene-1');
  });

  it('10. MpiContainer export config supports stage dimensions', () => {
    const container = createMpiContainer({
      exportConfig: { format: 'html-standalone', stageWidth: 1280, stageHeight: 720, embedAssets: true, includeToolbar: true },
    });
    expect(container.exportConfig.stageWidth).toBe(1280);
    expect(container.exportConfig.stageHeight).toBe(720);
  });
});

describe('MPI-FULL-CONTAINER-01 — adapter SimpleProject → MpiContainer', () => {
  it('11. simpleProjectToMpiContainer returns valid container', () => {
    const project = createSamplePpknProject();
    const container = simpleProjectToMpiContainer(project);
    expect(container).toBeDefined();
    expect(container.schemaVersion).toBe(MPI_CONTAINER_SCHEMA_VERSION);
    expect(container.sourceKind).toBe('manual');
  });

  it('12. adapter preserves title', () => {
    const project = createSamplePpknProject();
    const container = simpleProjectToMpiContainer(project);
    expect(container.metadata.title).toBe(project.title);
  });

  it('13. adapter preserves curriculum', () => {
    const project = createSamplePpknProject();
    const container = simpleProjectToMpiContainer(project);
    expect(container.curriculum).toBeDefined();
    expect(container.curriculum?.subject).toBe(project.curriculum?.subject);
    expect(container.curriculum?.grade).toBe(project.curriculum?.grade);
    expect(container.curriculum?.objectives).toHaveLength(project.curriculum?.objectives.length ?? 0);
  });

  it('14. adapter preserves page count as scenes', () => {
    const project = createSamplePpknProject();
    const container = simpleProjectToMpiContainer(project);
    expect(container.scenes).toHaveLength(project.pages.length);
  });

  it('15. adapter preserves stylePackId as styleIntent', () => {
    const project = createSamplePpknProject();
    const container = simpleProjectToMpiContainer(project);
    expect(container.styleIntent).toBeDefined();
    expect(container.styleIntent?.styleId).toBe(project.stylePackId);
  });

  it('16. adapter creates flow with scene IDs', () => {
    const project = createSamplePpknProject();
    const container = simpleProjectToMpiContainer(project);
    expect(container.flow.steps).toHaveLength(project.pages.length);
    expect(container.flow.steps[0].sceneId).toBe(container.scenes[0].id);
  });

  it('17. adapter maps page role → scene role', () => {
    const project = createSamplePpknProject();
    const container = simpleProjectToMpiContainer(project);
    const coverScene = container.scenes.find((s) => s.role === 'cover');
    expect(coverScene).toBeDefined();
    const closingScene = container.scenes.find((s) => s.role === 'closing');
    expect(closingScene).toBeDefined();
  });

  it('18. adapter maps activity role → game scene role', () => {
    const project = createSamplePpknProject();
    const container = simpleProjectToMpiContainer(project);
    const gameScene = container.scenes.find((s) => s.role === 'game');
    expect(gameScene).toBeDefined();
    expect(gameScene?.sceneType).toBe('game-mission');
  });

  it('19. adapter maps components → slots', () => {
    const project = createSamplePpknProject();
    const container = simpleProjectToMpiContainer(project);
    const firstScene = container.scenes[0];
    expect(firstScene.slots).toHaveLength(project.pages[0].components.length);
  });

  it('20. adapter preserves game sceneMetadata (briefing, target, reward)', () => {
    const project = createSamplePpknProject();
    // Find the game page
    const gamePage = project.pages.find((p) => p.role === 'activity');
    const gameComponent = gamePage?.components.find((c) => c.type === 'game');
    if (gameComponent && 'sceneMetadata' in gameComponent && gameComponent.sceneMetadata) {
      const container = simpleProjectToMpiContainer(project);
      const gameScene = container.scenes.find((s) => s.role === 'game');
      const gameSlot = gameScene?.slots.find((s) => s.content.kind === 'game-mission');
      if (gameSlot?.content.kind === 'game-mission') {
        expect(gameSlot.content.briefing).toBe(gameComponent.sceneMetadata.briefing);
        expect(gameSlot.content.missionTarget).toBe(gameComponent.sceneMetadata.missionTarget);
        expect(gameSlot.content.reward.label).toBe(gameComponent.sceneMetadata.reward?.label);
      }
    }
  });

  it('21. adapter does not mutate input SimpleProject', () => {
    const project = createSamplePpknProject();
    const originalTitle = project.title;
    const originalPageCount = project.pages.length;
    simpleProjectToMpiContainer(project);
    expect(project.title).toBe(originalTitle);
    expect(project.pages).toHaveLength(originalPageCount);
  });

  it('22. container has designSystem (default)', () => {
    const project = createSamplePpknProject();
    const container = simpleProjectToMpiContainer(project);
    expect(container.designSystem).toBeDefined();
    expect(container.designSystem?.contractId).toBe('default');
  });

  it('23. container has runtime with currentSceneId', () => {
    const project = createSamplePpknProject();
    const container = simpleProjectToMpiContainer(project);
    expect(container.runtime.currentSceneId).toBe(container.scenes[0]?.id);
  });

  it('24. scene has pageId reference to source page', () => {
    const project = createSamplePpknProject();
    const container = simpleProjectToMpiContainer(project);
    for (let i = 0; i < project.pages.length; i++) {
      expect(container.scenes[i].pageId).toBe(project.pages[i].id);
    }
  });
});
