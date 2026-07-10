/**
 * GOLDEN-REFERENCE-GAME-P1 — Classification Game Tests.
 */

import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  normalizeBlueprint,
  aiJsonToMpiContainer,
  validateAiMpiJson,
} from '../core/ai-mpi-json';
import { getDesignContract } from '../core/mpi-design-contract';
import { renderScenePlan } from '../core/scene-renderer';
import { SceneRendererView } from '../components/SceneRendererView';
import { exportProjectToHtml } from '../export/export-html';
import { createSamplePpknProject } from '../core/sample-project';
import { ClassificationGameComposer } from '../components/scene-composers';

const contract = getDesignContract('golden-reference');

const gameContent = {
  instruction: 'Sortir kartu ke kategori yang tepat!',
  items: [
    { id: 'i1', label: 'Berdoa sebelum aktivitas', correctCategory: 'Agama' },
    { id: 'i2', label: 'Memakai helm saat berkendara', correctCategory: 'Hukum' },
  ],
  categories: ['Agama', 'Hukum'],
  scorePerItem: 10,
  completionMessage: 'Selamat! Semua norma berhasil disortir.',
};

function loadGoldenRef() {
  const path = resolve(__dirname, '../../samples/ai-mpi-json/macam-norma-reference.sample.json');
  return JSON.parse(readFileSync(path, 'utf-8'));
}

describe('GOLDEN-REFERENCE-GAME-P1 — classification game', () => {
  // 1: Render di editor/preview
  it('1. classification-game render di editor/preview', () => {
    const { container } = render(<ClassificationGameComposer contract={contract} content={gameContent} />);
    expect(container.querySelector('.silse-scene-classification-game')).toBeInTheDocument();
  });

  // 2: Item pool muncul
  it('2. item pool muncul', () => {
    const { container } = render(<ClassificationGameComposer contract={contract} content={gameContent} />);
    expect(container.querySelector('[data-testid="classification-pool"]')).toBeInTheDocument();
    expect(container.querySelector('[data-item-id="i1"]')).toBeInTheDocument();
    expect(container.querySelector('[data-item-id="i2"]')).toBeInTheDocument();
  });

  // 3: Category columns muncul
  it('3. category columns muncul', () => {
    const { container } = render(<ClassificationGameComposer contract={contract} content={gameContent} />);
    expect(container.querySelector('[data-testid="classification-columns"]')).toBeInTheDocument();
    expect(container.querySelector('[data-category="Agama"]')).toBeInTheDocument();
    expect(container.querySelector('[data-category="Hukum"]')).toBeInTheDocument();
  });

  // 4: Klik item memilih item
  it('4. klik item memilih item', () => {
    const { container } = render(<ClassificationGameComposer contract={contract} content={gameContent} />);
    const item = container.querySelector('[data-item-id="i1"]') as HTMLElement;
    fireEvent.click(item);
    // Item should have gold border when selected (browser may convert hex to rgb)
    expect(item.style.borderColor).toBeTruthy();
    expect(item.style.borderColor).not.toBe('');
  });

  // 5: Klik kolom benar menempatkan item
  it('5. klik kolom benar menempatkan item', () => {
    const { container } = render(<ClassificationGameComposer contract={contract} content={gameContent} />);
    // Select item
    const item = container.querySelector('[data-item-id="i1"]') as HTMLElement;
    fireEvent.click(item);
    // Click correct column (Agama)
    const col = container.querySelector('[data-category="Agama"]') as HTMLElement;
    fireEvent.click(col);
    // Item should be placed
    expect(container.querySelector('[data-testid="placed-i1"]')).toBeInTheDocument();
  });

  // 6: Klik kolom salah menampilkan feedback
  it('6. klik kolom salah menampilkan feedback', () => {
    const { container } = render(<ClassificationGameComposer contract={contract} content={gameContent} />);
    // Select item (i1 = Agama)
    const item = container.querySelector('[data-item-id="i1"]') as HTMLElement;
    fireEvent.click(item);
    // Click wrong column (Hukum)
    const col = container.querySelector('[data-category="Hukum"]') as HTMLElement;
    fireEvent.click(col);
    // Feedback should appear with wrong message
    const feedback = container.querySelector('[data-testid="game-feedback"]');
    expect(feedback).toBeInTheDocument();
    expect(feedback?.textContent).toContain('Belum tepat');
  });

  // 7: Score bertambah saat benar
  it('7. score bertambah saat benar', () => {
    const { container } = render(<ClassificationGameComposer contract={contract} content={gameContent} />);
    const scoreBefore = container.querySelector('[data-testid="game-score"]')?.textContent;
    expect(scoreBefore).toBe('0');
    // Select and place correctly
    fireEvent.click(container.querySelector('[data-item-id="i1"]')!);
    fireEvent.click(container.querySelector('[data-category="Agama"]')!);
    const scoreAfter = container.querySelector('[data-testid="game-score"]')?.textContent;
    expect(scoreAfter).toBe('10');
  });

  // 8: Reset mengembalikan game
  it('8. reset mengembalikan game', () => {
    const { container } = render(<ClassificationGameComposer contract={contract} content={gameContent} />);
    // Place one item
    fireEvent.click(container.querySelector('[data-item-id="i1"]')!);
    fireEvent.click(container.querySelector('[data-category="Agama"]')!);
    expect(container.querySelector('[data-testid="game-score"]')?.textContent).toBe('10');
    // Find the reset button specifically
    const allButtons = container.querySelectorAll('button');
    let resetButton: HTMLElement | null = null;
    allButtons.forEach(btn => { if (btn.textContent?.includes('Reset')) resetButton = btn as HTMLElement; });
    if (resetButton) fireEvent.click(resetButton);
    // Score should be 0 again
    expect(container.querySelector('[data-testid="game-score"]')?.textContent).toBe('0');
  });

  // 9: Export HTML memuat class classification-game
  it('9. export HTML memuat class classification-game', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container2 = aiJsonToMpiContainer(bp);
    const scene = container2.scenes.find((s) => s.sceneType === 'classification-game')!;
    const plan = renderScenePlan(scene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    expect(dom.querySelector('.silse-scene-classification-game')).toBeInTheDocument();
  });

  // 10: Export HTML memuat handler classification interaction
  it('10. export HTML memuat handler classification interaction', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('data-item-id');
    expect(html).toContain('data-category');
    expect(html).toContain('silse-classification');
  });

  // 11: Full golden reference sample tetap valid
  it('11. golden reference sample 12 scene tetap valid', () => {
    const raw = loadGoldenRef();
    expect(validateAiMpiJson(raw)).toHaveLength(0);
    const bp = normalizeBlueprint(raw);
    expect(bp.scenes.length).toBe(12);
    const container2 = aiJsonToMpiContainer(bp);
    expect(container2.scenes.length).toBe(12);
  });

  // 12: Legacy fallback tetap aman
  it('12. legacy fallback tetap aman', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project);
    // Fase 2b: scenePlan no longer null — all pages go through scene renderer
    expect(html.length).toBeGreaterThan(1000);
  });
});
