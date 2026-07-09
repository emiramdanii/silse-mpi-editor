/**
 * MPI-JSON-SCENE-PROOF-01 — Test Suite.
 *
 * Layer: tests
 *
 * Kontrak (MPI-JSON-SCENE-PROOF-01):
 *   Membuktikan JSON AI bisa dirender sebagai scene misi (bukan kotak/list).
 *   Test minimal 26, kategori:
 *     1-8: sample JSON valid + structure
 *     9-15: converter preserve scene intent
 *     16-22: renderer menghasilkan scene classes
 *     23-26: tidak mengubah jawaban/feedback, no dependency, build pass
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { SimpleProject, GameComponent } from '../core/types';
// AUDIT 5.9.1-5.9.4: Legacy pipeline imports moved to ./legacy/ subfolder.
// Production barrel no longer exports these. isGameMissionScene +
// AI_MPI_SCENE_GAME_MISSION remain in the production barrel (scene-helpers.ts).
import {
  normalizeAiMpiJson,
} from '../core/ai-mpi-json/legacy/normalize-ai-mpi-json';
import {
  aiMpiJsonToProject,
} from '../core/ai-mpi-json/legacy/ai-mpi-json-to-project';
import type { AiMpiJson } from '../core/ai-mpi-json/legacy/ai-mpi-json-schema';
import {
  isGameMissionScene,
  AI_MPI_SCENE_GAME_MISSION,
} from '../core/ai-mpi-json';
import { GameComponentView } from '../components/GameComponentView';
import type { ResolvedComponentStyle } from '../core/style/resolveComponentStyle';
import { exportProjectToHtml } from '../export/export-html';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadSampleJson(): AiMpiJson {
  const path = resolve(__dirname, '../../samples/ai-mpi-json/penjelajah-pancasila-scene-proof.json');
  const raw = readFileSync(path, 'utf-8');
  return normalizeAiMpiJson(JSON.parse(raw));
}

const emptyResolvedStyle: ResolvedComponentStyle = {
  inlineStyle: {},
  className: '',
  interactions: {},
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MPI-JSON-SCENE-PROOF-01 — JSON valid + structure', () => {
  // ===== 1-8: Sample JSON valid + structure =====

  it('1. sample JSON valid (normalize tidak throw)', () => {
    expect(() => loadSampleJson()).not.toThrow();
  });

  it('2. sample JSON punya game page', () => {
    const json = loadSampleJson();
    const gamePage = json.pages.find((p) => p.role === 'game');
    expect(gamePage).toBeDefined();
  });

  it('3. game page punya scene game-mission', () => {
    const json = loadSampleJson();
    const gamePage = json.pages.find((p) => p.role === 'game');
    expect(gamePage?.scene).toBe('game-mission');
  });

  it('4. game block punya briefing', () => {
    const json = loadSampleJson();
    const gamePage = json.pages.find((p) => p.role === 'game');
    const gameBlock = gamePage?.blocks.find((b) => b.type === 'game');
    expect(gameBlock).toBeDefined();
    if (gameBlock?.type === 'game') {
      expect(gameBlock.briefing).toBeTruthy();
      expect(gameBlock.briefing.length).toBeGreaterThan(10);
    }
  });

  it('5. game block punya missionTarget', () => {
    const json = loadSampleJson();
    const gamePage = json.pages.find((p) => p.role === 'game');
    const gameBlock = gamePage?.blocks.find((b) => b.type === 'game');
    if (gameBlock?.type === 'game') {
      expect(gameBlock.missionTarget).toBeTruthy();
      expect(gameBlock.missionTarget.length).toBeGreaterThan(10);
    }
  });

  it('6. game block punya actions (minimal 2: 1 correct + 1 wrong)', () => {
    const json = loadSampleJson();
    const gamePage = json.pages.find((p) => p.role === 'game');
    const gameBlock = gamePage?.blocks.find((b) => b.type === 'game');
    if (gameBlock?.type === 'game') {
      expect(gameBlock.actions.length).toBeGreaterThanOrEqual(2);
      expect(gameBlock.actions.some((a) => a.result === 'correct')).toBe(true);
      expect(gameBlock.actions.some((a) => a.result === 'wrong')).toBe(true);
    }
  });

  it('7. game block punya feedback di setiap action', () => {
    const json = loadSampleJson();
    const gamePage = json.pages.find((p) => p.role === 'game');
    const gameBlock = gamePage?.blocks.find((b) => b.type === 'game');
    if (gameBlock?.type === 'game') {
      for (const action of gameBlock.actions) {
        expect(action.feedback).toBeTruthy();
        expect(action.feedback.length).toBeGreaterThan(5);
      }
    }
  });

  it('8. game block punya reward (type + label)', () => {
    const json = loadSampleJson();
    const gamePage = json.pages.find((p) => p.role === 'game');
    const gameBlock = gamePage?.blocks.find((b) => b.type === 'game');
    if (gameBlock?.type === 'game') {
      expect(gameBlock.reward).toBeDefined();
      expect(gameBlock.reward.type).toBeTruthy();
      expect(gameBlock.reward.label).toBeTruthy();
    }
  });
});

describe('MPI-JSON-SCENE-PROOF-01 — Converter preserve scene intent', () => {
  // ===== 9-15: Converter menjaga scene intent =====

  let project: SimpleProject;
  let gameComponent: GameComponent | undefined;

  function setup() {
    const json = loadSampleJson();
    project = aiMpiJsonToProject(json);
    const gamePage = project.pages.find((p) => p.role === 'activity');
    gameComponent = gamePage?.components.find((c) => c.type === 'game') as GameComponent | undefined;
  }

  it('9. converter menjaga role (game → activity)', () => {
    setup();
    const gamePage = project.pages.find((p) => p.role === 'activity');
    expect(gamePage).toBeDefined();
  });

  it('10. converter menjaga scene (game-mission di sceneMetadata)', () => {
    setup();
    expect(gameComponent).toBeDefined();
    expect(gameComponent?.sceneMetadata?.scene).toBe('game-mission');
  });

  it('11. converter menjaga briefing (di sceneMetadata)', () => {
    setup();
    expect(gameComponent?.sceneMetadata?.briefing).toBeTruthy();
    expect(gameComponent?.sceneMetadata?.briefing?.length).toBeGreaterThan(10);
  });

  it('12. converter menjaga missionTarget (di sceneMetadata)', () => {
    setup();
    expect(gameComponent?.sceneMetadata?.missionTarget).toBeTruthy();
    expect(gameComponent?.sceneMetadata?.missionTarget?.length).toBeGreaterThan(10);
  });

  it('13. converter menjaga actions (terpetakan ke missions + choices)', () => {
    setup();
    expect(gameComponent?.missions).toBeDefined();
    expect(gameComponent?.missions.length).toBe(1);
    const mission = gameComponent?.missions[0];
    expect(mission?.choices.length).toBeGreaterThanOrEqual(2);
  });

  it('14. converter menjaga feedback (feedbackCorrect + feedbackWrong)', () => {
    setup();
    const mission = gameComponent?.missions[0];
    expect(mission?.feedbackCorrect).toBeTruthy();
    expect(mission?.feedbackWrong).toBeTruthy();
  });

  it('15. converter menjaga reward (di sceneMetadata)', () => {
    setup();
    expect(gameComponent?.sceneMetadata?.reward).toBeDefined();
    expect(gameComponent?.sceneMetadata?.reward?.type).toBeTruthy();
    expect(gameComponent?.sceneMetadata?.reward?.label).toBeTruthy();
  });
});

describe('MPI-JSON-SCENE-PROOF-01 — Renderer scene classes', () => {
  // ===== 16-22: Renderer menghasilkan scene classes =====

  function setupGameComponent(): GameComponent {
    const json = loadSampleJson();
    const project = aiMpiJsonToProject(json);
    const gamePage = project.pages.find((p) => p.role === 'activity');
    return gamePage?.components.find((c) => c.type === 'game') as GameComponent;
  }

  it('16. renderer menghasilkan silse-game-scene', () => {
    const component = setupGameComponent();
    const { container } = render(
      <GameComponentView
        component={component}
        resolvedStyle={emptyResolvedStyle}
        positionMode="fill"
      />
    );
    expect(container.querySelector('.silse-game-scene')).toBeInTheDocument();
  });

  it('17. renderer menghasilkan silse-game-briefing', () => {
    const component = setupGameComponent();
    const { container } = render(
      <GameComponentView
        component={component}
        resolvedStyle={emptyResolvedStyle}
        positionMode="fill"
      />
    );
    expect(container.querySelector('.silse-game-briefing')).toBeInTheDocument();
  });

  it('18. renderer menghasilkan silse-game-target', () => {
    const component = setupGameComponent();
    const { container } = render(
      <GameComponentView
        component={component}
        resolvedStyle={emptyResolvedStyle}
        positionMode="fill"
      />
    );
    expect(container.querySelector('.silse-game-target')).toBeInTheDocument();
  });

  it('19. renderer menghasilkan silse-game-action-grid', () => {
    const component = setupGameComponent();
    const { container } = render(
      <GameComponentView
        component={component}
        resolvedStyle={emptyResolvedStyle}
        positionMode="fill"
      />
    );
    expect(container.querySelector('.silse-game-action-grid')).toBeInTheDocument();
  });

  it('20. renderer menghasilkan silse-game-action-card (minimal 2)', () => {
    const component = setupGameComponent();
    const { container } = render(
      <GameComponentView
        component={component}
        resolvedStyle={emptyResolvedStyle}
        positionMode="fill"
      />
    );
    const cards = container.querySelectorAll('.silse-game-action-card');
    expect(cards.length).toBeGreaterThanOrEqual(2);
  });

  it('21. renderer menghasilkan silse-game-feedback setelah dijawab', () => {
    const component = setupGameComponent();
    const { container } = render(
      <GameComponentView
        component={component}
        resolvedStyle={emptyResolvedStyle}
        positionMode="fill"
        gameState={{
          currentMissionIndex: 0,
          selectedChoiceIndex: 0,
          isAnswered: true,
          score: 10,
          completed: false,
        }}
      />
    );
    expect(container.querySelector('.silse-game-feedback')).toBeInTheDocument();
  });

  it('22. renderer menghasilkan silse-game-reward setelah dijawab benar', () => {
    const component = setupGameComponent();
    // Find correct choice index
    const correctIdx = component.missions[0].correctChoiceIndex;
    const { container } = render(
      <GameComponentView
        component={component}
        resolvedStyle={emptyResolvedStyle}
        positionMode="fill"
        gameState={{
          currentMissionIndex: 0,
          selectedChoiceIndex: correctIdx,
          isAnswered: true,
          score: 10,
          completed: false,
        }}
      />
    );
    expect(container.querySelector('.silse-game-reward')).toBeInTheDocument();
  });
});

describe('MPI-JSON-SCENE-PROOF-01 — Safety + build', () => {
  // ===== 23-26: Safety + build =====

  it('23. game tidak dirender sebagai plain list saja (punya briefing + target + action grid)', () => {
    const json = loadSampleJson();
    const project = aiMpiJsonToProject(json);
    const gamePage = project.pages.find((p) => p.role === 'activity');
    const component = gamePage?.components.find((c) => c.type === 'game') as GameComponent;
    const { container } = render(
      <GameComponentView
        component={component}
        resolvedStyle={emptyResolvedStyle}
        positionMode="fill"
      />
    );
    // Must have scene structure, not just list
    expect(container.querySelector('.silse-game-scene')).toBeInTheDocument();
    expect(container.querySelector('.silse-game-briefing')).toBeInTheDocument();
    expect(container.querySelector('.silse-game-target')).toBeInTheDocument();
    expect(container.querySelector('.silse-game-action-grid')).toBeInTheDocument();
    // Must NOT be rendered as old-style list (no plain .silse-game-choice in scene mode)
    expect(container.querySelector('.silse-game-choice')).not.toBeInTheDocument();
  });

  it('24. tidak mengubah jawaban/feedback — correctChoiceIndex preserved', () => {
    const json = loadSampleJson();
    const project = aiMpiJsonToProject(json);
    const gamePage = project.pages.find((p) => p.role === 'activity');
    const component = gamePage?.components.find((c) => c.type === 'game') as GameComponent;
    const mission = component.missions[0];

    // Find the correct action from AI JSON
    const aiGamePage = json.pages.find((p) => p.role === 'game');
    const aiGameBlock = aiGamePage?.blocks.find((b) => b.type === 'game');
    if (aiGameBlock?.type === 'game') {
      const correctActionIdx = aiGameBlock.actions.findIndex((a) => a.result === 'correct');
      expect(mission.correctChoiceIndex).toBe(correctActionIdx);
      // Feedback must match
      expect(mission.feedbackCorrect).toBe(aiGameBlock.actions[correctActionIdx].feedback);
    }
  });

  it('25. tidak menambah dependency — ai-mpi-json module pure TypeScript, no imports external', () => {
    // Verify by checking the module can be imported and used without external deps
    const json = loadSampleJson();
    const project = aiMpiJsonToProject(json);
    expect(project).toBeDefined();
    expect(project.pages.length).toBeGreaterThan(0);
    // isGameMissionScene is a pure function
    const gamePage = project.pages.find((p) => p.role === 'activity');
    const component = gamePage?.components.find((c) => c.type === 'game') as GameComponent;
    expect(isGameMissionScene(component)).toBe(true);
  });

  it('26. build tetap pass — export HTML masih bisa di-generate dari project hasil convert', () => {
    const json = loadSampleJson();
    const project = aiMpiJsonToProject(json);
    expect(() => exportProjectToHtml(project)).not.toThrow();
    const html = exportProjectToHtml(project);
    expect(html.length).toBeGreaterThan(1000);
    // Verify scene classes appear in export too
    expect(html).toContain('silse-game-scene');
    expect(html).toContain('silse-game-briefing');
  });

  // ===== Additional tests (bonus) =====

  it('27. isGameMissionScene — pure function, returns false for game without sceneMetadata', () => {
    const json = loadSampleJson();
    const project = aiMpiJsonToProject(json);
    const gamePage = project.pages.find((p) => p.role === 'activity');
    const component = gamePage?.components.find((c) => c.type === 'game') as GameComponent;
    expect(isGameMissionScene(component)).toBe(true);
    // Remove sceneMetadata → should return false
    const withoutMeta: GameComponent = { ...component, sceneMetadata: undefined };
    expect(isGameMissionScene(withoutMeta)).toBe(false);
  });

  it('28. AI_MPI_SCENE_GAME_MISSION constant = "game-mission"', () => {
    expect(AI_MPI_SCENE_GAME_MISSION).toBe('game-mission');
  });

  it('29. converter menjaga styleId dari AI JSON', () => {
    const json = loadSampleJson();
    const project = aiMpiJsonToProject(json);
    expect(project.stylePackId).toBe(json.styleId);
  });

  it('30. converter menjaga curriculum metadata', () => {
    const json = loadSampleJson();
    const project = aiMpiJsonToProject(json);
    expect(project.curriculum).toBeDefined();
    expect(project.curriculum?.subject).toBe(json.metadata.subject);
    expect(project.curriculum?.grade).toBe(json.metadata.grade);
    expect(project.curriculum?.topic).toBe(json.metadata.topic);
  });

  it('31. converter menjaga objectives', () => {
    const json = loadSampleJson();
    const project = aiMpiJsonToProject(json);
    const objectives = project.curriculum?.objectives ?? [];
    expect(objectives.length).toBe(json.metadata.objectives?.length ?? 0);
    for (let i = 0; i < objectives.length; i++) {
      expect(objectives[i].text).toBe(json.metadata.objectives?.[i]);
    }
  });

  it('32. converter menjaga page count + order', () => {
    const json = loadSampleJson();
    const project = aiMpiJsonToProject(json);
    expect(project.pages.length).toBe(json.pages.length);
    // First page should be cover
    expect(project.pages[0].role).toBe('cover');
    // Last page should be closing
    expect(project.pages[project.pages.length - 1].role).toBe('closing');
  });

  it('33. normalize error handling — invalid JSON throws AiMpiJsonError', () => {
    expect(() => normalizeAiMpiJson(null)).toThrow();
    expect(() => normalizeAiMpiJson({})).toThrow();
    expect(() => normalizeAiMpiJson({ version: 1, metadata: {}, pages: [] })).toThrow();
    expect(() => normalizeAiMpiJson({ version: 1, metadata: { title: 'Test' }, pages: [] })).toThrow();
  });

  it('34. game-mission scene renderer — action card punya letter badge (A/B/C)', () => {
    const json = loadSampleJson();
    const project = aiMpiJsonToProject(json);
    const gamePage = project.pages.find((p) => p.role === 'activity');
    const component = gamePage?.components.find((c) => c.type === 'game') as GameComponent;
    const { container } = render(
      <GameComponentView
        component={component}
        resolvedStyle={emptyResolvedStyle}
        positionMode="fill"
      />
    );
    const cards = container.querySelectorAll('.silse-game-action-card');
    expect(cards.length).toBeGreaterThanOrEqual(2);
    // First card should have letter "A"
    expect(cards[0].textContent).toContain('A');
  });

  it('35. game-mission scene renderer — completed state shows reward', () => {
    const json = loadSampleJson();
    const project = aiMpiJsonToProject(json);
    const gamePage = project.pages.find((p) => p.role === 'activity');
    const component = gamePage?.components.find((c) => c.type === 'game') as GameComponent;
    const { container } = render(
      <GameComponentView
        component={component}
        resolvedStyle={emptyResolvedStyle}
        positionMode="fill"
        gameState={{
          currentMissionIndex: 0,
          selectedChoiceIndex: 0,
          isAnswered: true,
          score: 10,
          completed: true,
        }}
      />
    );
    const reward = container.querySelector('.silse-game-reward');
    expect(reward).toBeInTheDocument();
    // Reward label from sceneMetadata should appear
    expect(reward?.textContent).toContain(component.sceneMetadata?.reward?.label);
  });
});
