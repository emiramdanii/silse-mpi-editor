/**
 * Tests for M11A Patch — Game preview runtime fix.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from '../store/editor-store';
import { usePreviewStore } from '../preview/preview-store';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC_DIR = resolve(__dirname, '..');

// Mock localStorage
const mockStore: Record<string, string> = {};
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => mockStore[k] ?? null,
  setItem: (k: string, v: string) => { mockStore[k] = v; },
  removeItem: (k: string) => { delete mockStore[k]; },
};

// =========================================================================
// Preview store game runtime
// =========================================================================

describe('M11A PATCH — preview store game runtime', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
    usePreviewStore.getState().closePreview();
  });

  it('preview store has gameStates', () => {
    usePreviewStore.getState().openPreview();
    expect(usePreviewStore.getState().gameStates).toBeDefined();
    expect(typeof usePreviewStore.getState().gameStates).toBe('object');
  });

  it('answerGameMission sets answer + score', () => {
    usePreviewStore.getState().openPreview();
    usePreviewStore.getState().answerGameMission('game1', 0, 0, 0, 10);
    const gs = usePreviewStore.getState().gameStates['game1'];
    expect(gs).toBeDefined();
    expect(gs.selectedChoiceIndex).toBe(0);
    expect(gs.isAnswered).toBe(true);
    expect(gs.score).toBe(10);
    expect(usePreviewStore.getState().totalScore).toBe(10);
  });

  it('answerGameMission does not score twice', () => {
    usePreviewStore.getState().openPreview();
    usePreviewStore.getState().answerGameMission('game1', 0, 0, 0, 10);
    usePreviewStore.getState().answerGameMission('game1', 0, 1, 0, 10); // try again
    expect(usePreviewStore.getState().gameStates['game1'].score).toBe(10);
    expect(usePreviewStore.getState().totalScore).toBe(10);
  });

  it('nextGameMission advances mission', () => {
    usePreviewStore.getState().openPreview();
    usePreviewStore.getState().answerGameMission('game1', 0, 0, 0, 10);
    usePreviewStore.getState().nextGameMission('game1', 3);
    const gs = usePreviewStore.getState().gameStates['game1'];
    expect(gs.currentMissionIndex).toBe(1);
    expect(gs.selectedChoiceIndex).toBeNull();
    expect(gs.isAnswered).toBe(false);
  });

  it('last mission sets completed', () => {
    usePreviewStore.getState().openPreview();
    // Mission 0 of 1 (only 1 mission)
    usePreviewStore.getState().answerGameMission('game1', 0, 0, 0, 10);
    usePreviewStore.getState().nextGameMission('game1', 1);
    const gs = usePreviewStore.getState().gameStates['game1'];
    expect(gs.completed).toBe(true);
  });

  it('resetGame resets state', () => {
    usePreviewStore.getState().openPreview();
    usePreviewStore.getState().answerGameMission('game1', 0, 0, 0, 10);
    usePreviewStore.getState().resetGame('game1');
    const gs = usePreviewStore.getState().gameStates['game1'];
    expect(gs.currentMissionIndex).toBe(0);
    expect(gs.selectedChoiceIndex).toBeNull();
    expect(gs.isAnswered).toBe(false);
    expect(gs.score).toBe(0);
    expect(gs.completed).toBe(false);
    // Score subtracted from total
    expect(usePreviewStore.getState().totalScore).toBe(0);
  });

  it('openPreview clears gameStates', () => {
    usePreviewStore.getState().openPreview();
    usePreviewStore.getState().answerGameMission('game1', 0, 0, 0, 10);
    expect(Object.keys(usePreviewStore.getState().gameStates).length).toBeGreaterThan(0);

    usePreviewStore.getState().openPreview(); // reopen
    expect(Object.keys(usePreviewStore.getState().gameStates).length).toBe(0);
    expect(usePreviewStore.getState().totalScore).toBe(0);
  });
});

// =========================================================================
// PreviewApp source checks
// =========================================================================

describe('M11A PATCH — PreviewApp renders GameComponent', () => {
  it('PreviewApp imports isGameComponent', () => {
    const content = readFileSync(resolve(SRC_DIR, 'preview/PreviewApp.tsx'), 'utf8');
    expect(content).toMatch(/isGameComponent/);
  });

  it('PreviewApp imports GameComponentView', () => {
    const content = readFileSync(resolve(SRC_DIR, 'preview/PreviewApp.tsx'), 'utf8');
    expect(content).toMatch(/GameComponentView/);
  });

  it('PreviewApp has game render branch', () => {
    const content = readFileSync(resolve(SRC_DIR, 'preview/PreviewApp.tsx'), 'utf8');
    expect(content).toMatch(/isGameComponent\(component\)/);
  });

  it('PreviewApp passes gameState to GameComponentView', () => {
    const content = readFileSync(resolve(SRC_DIR, 'preview/PreviewApp.tsx'), 'utf8');
    expect(content).toMatch(/gameState=\{gs\}/);
  });

  it('PreviewApp passes onAnswer, onNextMission, onRetry', () => {
    const content = readFileSync(resolve(SRC_DIR, 'preview/PreviewApp.tsx'), 'utf8');
    expect(content).toMatch(/onAnswer/);
    expect(content).toMatch(/onNextMission/);
    expect(content).toMatch(/onRetry/);
  });
});

// =========================================================================
// Preview and export both support game
// =========================================================================

describe('M11A PATCH — preview and export both support game', () => {
  it('PreviewApp has game render branch', () => {
    const previewContent = readFileSync(resolve(SRC_DIR, 'preview/PreviewApp.tsx'), 'utf8');
    expect(previewContent).toMatch(/isGameComponent/);
  });

  it('export-html has game render branch', () => {
    const exportContent = readFileSync(resolve(SRC_DIR, 'export/export-html.ts'), 'utf8');
    expect(exportContent).toMatch(/comp\.type === 'game'/);
  });
});
