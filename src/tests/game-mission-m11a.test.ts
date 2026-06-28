/**
 * Tests for M11A — Game Engine MVP: Mission Quiz.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { Toolbar } from '../editor/Toolbar';
import { createGameComponent, createGameMission } from '../core/component-factory';
import { canAddComponent } from '../core/capability';
import { validateComponent, isValidComponent } from '../core/validation';
import { useEditorStore } from '../store/editor-store';
import { exportProjectToHtml, buildExportRenderModel } from '../export/export-html';
import { createProject } from '../core/project-factory';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC_DIR = resolve(__dirname, '..');

/** Helper: render Toolbar with a free page active so add buttons are enabled. */
function renderToolbarWithFreePage() {
  useEditorStore.getState().newProject();
  useEditorStore.getState().addPage(); // free page
  return render(React.createElement(Toolbar));
}

// =========================================================================
// Game validation
// =========================================================================

describe('M11A — game validation', () => {
  it('valid game passes validation', () => {
    const g = createGameComponent();
    expect(validateComponent(g).ok).toBe(true);
    expect(isValidComponent(g)).toBe(true);
  });

  it('rejects invalid correctChoiceIndex in mission', () => {
    const g = createGameComponent({
      missions: [createGameMission({ correctChoiceIndex: 99 })],
    });
    expect(validateComponent(g).ok).toBe(false);
  });

  it('rejects empty missions', () => {
    const g = createGameComponent({ missions: [] });
    expect(validateComponent(g).ok).toBe(false);
  });

  it('rejects invalid gameType', () => {
    const g = createGameComponent();
    const broken = { ...g, gameType: 'invalid' };
    expect(validateComponent(broken).ok).toBe(false);
  });

  it('rejects more than 10 missions', () => {
    const missions = Array.from({ length: 11 }, () => createGameMission());
    const g = createGameComponent({ missions });
    expect(validateComponent(g).ok).toBe(false);
  });
});

// =========================================================================
// Capability matrix
// =========================================================================

describe('M11A — capability matrix', () => {
  it('quiz allows game', () => { expect(canAddComponent('quiz', 'game')).toBe(true); });
  it('activity allows game', () => { expect(canAddComponent('activity', 'game')).toBe(true); });
  it('free allows game', () => { expect(canAddComponent('free', 'game')).toBe(true); });
  it('cover denies game', () => { expect(canAddComponent('cover', 'game')).toBe(false); });
  it('material denies game', () => { expect(canAddComponent('material', 'game')).toBe(false); });
});

// =========================================================================
// Store operations
// =========================================================================

describe('M11A — store operations', () => {
  beforeEach(() => { useEditorStore.getState().newProject(); });

  it('addGameComponent on quiz succeeds', () => {
    const store = useEditorStore.getState();
    store.addPage({ role: 'quiz' });
    const id = store.addGameComponent();
    expect(id).not.toBeNull();
    const { project } = useEditorStore.getState();
    expect(project.pages[1].components[0].type).toBe('game');
  });

  it('addGameComponent on cover returns null', () => {
    expect(useEditorStore.getState().addGameComponent()).toBeNull();
  });

  it('addGameComponent on material returns null', () => {
    const store = useEditorStore.getState();
    store.addPage({ role: 'material' });
    expect(store.addGameComponent()).toBeNull();
  });

  it('updateGameComponent works', () => {
    const store = useEditorStore.getState();
    store.addPage({ role: 'quiz' });
    const id = store.addGameComponent()!;
    store.updateGameComponent(id, { title: 'New Game Title' });
    const { project } = useEditorStore.getState();
    expect((project.pages[1].components[0] as { title: string }).title).toBe('New Game Title');
  });

  it('duplicatePage regenerates game/mission/choice ids', () => {
    const store = useEditorStore.getState();
    store.addPage({ role: 'quiz' });
    const gameId = store.addGameComponent()!;
    const pageId = useEditorStore.getState().project.currentPageId;
    const copyId = store.duplicatePage(pageId)!;
    const { project } = useEditorStore.getState();
    const copy = project.pages.find((p) => p.id === copyId)!;
    const copyGame = copy.components[0] as { id: string; type: string; missions: { id: string; choices: { id: string }[] }[] };
    expect(copyGame.id).not.toBe(gameId);
    expect(copyGame.type).toBe('game');
    expect(copyGame.missions[0].id).toBeDefined();
    expect(copyGame.missions[0].choices[0].id).toBeDefined();
  });

  it('store EXPOSES addGameComponent + updateGameComponent', () => {
    expect(typeof useEditorStore.getState().addGameComponent).toBe('function');
    expect(typeof useEditorStore.getState().updateGameComponent).toBe('function');
  });

  it('store does NOT expose setPageRole/style editor/full game library', () => {
    const s = useEditorStore.getState() as Record<string, unknown>;
    expect(s.setPageRole).toBeUndefined();
    expect(s.openStyleEditor).toBeUndefined();
    expect(s.gameLibrary).toBeUndefined();
  });
});

// =========================================================================
// Export HTML
// =========================================================================

describe('M11A — export HTML game runtime', () => {
  function makeProjectWithGame() {
    const project = createProject('Test Game Export');
    const quizPage = {
      ...project.pages[0],
      id: 'quiz-page-1',
      role: 'quiz' as const,
      layoutId: 'blank' as const,
      title: 'Kuis Game',
      components: [createGameComponent({
        title: 'Game Petualangan',
        instruction: 'Jawab semua misi!',
        missions: [
          createGameMission({ prompt: 'Apa 1+1?', choices: [
            { id: 'c1', text: '1' }, { id: 'c2', text: '2' },
          ], correctChoiceIndex: 1 }),
        ],
      })],
    };
    return { ...project, pages: [project.pages[0], quizPage], currentPageId: quizPage.id };
  }

  it('buildExportRenderModel includes game fields', () => {
    const model = buildExportRenderModel(makeProjectWithGame());
    const quizPage = model.pages.find((p) => p.title === 'Kuis Game')!;
    const gComp = quizPage.components[0];
    expect(gComp.type).toBe('game');
    expect(gComp.gameTitle).toBe('Game Petualangan');
    expect(gComp.gameInstruction).toBe('Jawab semua misi!');
    expect(gComp.missions).toBeDefined();
    expect(gComp.missions!.length).toBe(1);
  });

  it('export HTML contains game prompt', () => {
    const html = exportProjectToHtml(makeProjectWithGame());
    expect(html).toContain('Apa 1+1?');
  });

  it('export HTML contains game CSS classes', () => {
    const html = exportProjectToHtml(makeProjectWithGame());
    expect(html).toContain('silse-game-choice');
    expect(html).toContain('silse-game-feedback');
  });

  it('export HTML contains game JS runtime (gameStates)', () => {
    const html = exportProjectToHtml(makeProjectWithGame());
    expect(html).toContain('gameStates');
    expect(html).toMatch(/comp\.type === 'game'/);
  });

  it('export game CSS has white-space: normal, overflow-wrap: anywhere, min-height', () => {
    const html = exportProjectToHtml(makeProjectWithGame());
    const gameCSS = html.substring(html.indexOf('silse-game-choice'), html.indexOf('silse-game-feedback'));
    expect(gameCSS).toMatch(/white-space:\s*normal/);
    expect(gameCSS).toMatch(/overflow-wrap:\s*anywhere/);
    expect(gameCSS).toMatch(/min-height:\s*44px/);
  });

  it('export game CSS does NOT contain nowrap or ellipsis', () => {
    const html = exportProjectToHtml(makeProjectWithGame());
    const gameCSS = html.substring(html.indexOf('silse-game-choice'), html.indexOf('silse-game-feedback'));
    expect(gameCSS).not.toMatch(/nowrap/);
    expect(gameCSS).not.toMatch(/ellipsis/);
  });
});

// =========================================================================
// No page-spam
// =========================================================================

describe('M11A — no page-spam', () => {
  it('adding mission does not add page', () => {
    const store = useEditorStore.getState();
    store.addPage({ role: 'quiz' });
    const before = useEditorStore.getState().project.pages.length;
    store.addGameComponent({
      missions: [createGameMission(), createGameMission(), createGameMission()],
    });
    const after = useEditorStore.getState().project.pages.length;
    expect(after).toBe(before); // no new pages
  });
});

// =========================================================================
// UI checks
// =========================================================================

describe('M11A — UI checks', () => {
  it('Toolbar has + Game button (UX-01: rendered label, source has action spec)', () => {
    const content = readFileSync(resolve(SRC_DIR, 'editor/Toolbar.tsx'), 'utf8');
    // UX-01: button spec is centralized — verify the action 'add-game' is declared.
    expect(content).toMatch(/action:\s*['"]add-game['"]/);
    // UX-01: label is rendered via spec, so check the rendered output too.
    const { container: tbContainer } = renderToolbarWithFreePage();
    const gameBtn = tbContainer.querySelector('[data-action="add-game"]');
    expect(gameBtn).not.toBeNull();
    expect(gameBtn?.textContent ?? '').toMatch(/Game/);
  });

  it('UI does NOT contain "block"', () => {
    const content = readFileSync(resolve(SRC_DIR, 'editor/Toolbar.tsx'), 'utf8');
    expect(content).not.toMatch(/\bblock\b/i);
  });
});

// =========================================================================
// ESM guard
// =========================================================================

describe('M11A — ESM guard', () => {
  it('GameComponentView does not use CommonJS dynamic require', () => {
    const content = readFileSync(resolve(SRC_DIR, 'components/GameComponentView.tsx'), 'utf8');
    expect(content).not.toMatch(/\brequire\s*\(/);
  });
});
