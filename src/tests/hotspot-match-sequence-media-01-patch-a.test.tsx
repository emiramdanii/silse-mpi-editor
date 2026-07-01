/**
 * HOTSPOT-MATCH-SEQUENCE-MEDIA-01 PATCH A — Tests.
 *
 * Fix 1: Matching wrong pair retry (wrong pair does NOT lock items).
 * Fix 2: Sequencing export reset (restores DOM order + renumber + hide feedback + reset score).
 * Fix 3: Actual 4-scene export test (export contains actual scene classes, not just function strings).
 */

import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { getDesignContract } from '../core/mpi-design-contract';
import {
  MatchingGameComposer,
  SequencingGameComposer,
} from '../components/scene-composers';
import { exportProjectToHtml } from '../export/export-html';
import { createSamplePpknProject } from '../core/sample-project';
import type { SimpleProject } from '../core/types';

const contract = getDesignContract('golden-reference');

// ---------------------------------------------------------------------------
// Helper: Build a project with 4 new scene types
// ---------------------------------------------------------------------------

function build4SceneProject(): SimpleProject {
  const base = createSamplePpknProject();
  // Replace pages with 4 new scene types
  const pages = [
    {
      id: 'p-hotspot', title: 'Hotspot Map', role: 'material' as const, layoutId: 'blank' as const,
      background: { type: 'color' as const, color: '#0e1c2f' }, components: [],
      sceneType: 'hotspot-map',
      sceneContent: {
        kind: 'hotspot-map',
        guidingQuestion: 'Identifikasi bagian peta',
        hotspots: [{ id: 'h1', x: 25, y: 30, label: 'Utara', info: 'Wilayah utara' }],
      },
      scenePlacement: { x: 72, y: 64, width: 1136, height: 544 },
      sceneSlotRole: 'backgroundVisual',
    },
    {
      id: 'p-match', title: 'Matching Game', role: 'activity' as const, layoutId: 'blank' as const,
      background: { type: 'color' as const, color: '#0e1c2f' }, components: [],
      sceneType: 'matching-game',
      sceneContent: {
        kind: 'matching-game',
        instruction: 'Cocokkan',
        leftItems: [{ id: 'l1', label: 'A' }],
        rightItems: [{ id: 'r1', label: 'B' }],
        correctPairs: [{ leftId: 'l1', rightId: 'r1' }],
      },
      scenePlacement: { x: 72, y: 64, width: 1136, height: 544 },
      sceneSlotRole: 'instruction',
    },
    {
      id: 'p-seq', title: 'Sequencing Game', role: 'activity' as const, layoutId: 'blank' as const,
      background: { type: 'color' as const, color: '#0e1c2f' }, components: [],
      sceneType: 'sequencing-game',
      sceneContent: {
        kind: 'sequencing-game',
        instruction: 'Urutkan',
        items: [{ id: 's1', label: 'Satu' }, { id: 's2', label: 'Dua' }],
        correctOrder: ['s1', 's2'],
      },
      scenePlacement: { x: 72, y: 64, width: 1136, height: 544 },
      sceneSlotRole: 'instruction',
    },
    {
      id: 'p-media', title: 'Media Focus', role: 'material' as const, layoutId: 'blank' as const,
      background: { type: 'color' as const, color: '#0e1c2f' }, components: [],
      sceneType: 'media-focus',
      sceneContent: {
        kind: 'media-focus',
        mediaAsset: { src: 'https://example.com/img.png', alt: 'Test' },
        guidingQuestion: 'Apa yang kamu lihat?',
      },
      scenePlacement: { x: 72, y: 64, width: 1136, height: 544 },
      sceneSlotRole: 'mediaAsset',
    },
  ];
  return {
    ...base,
    pages,
    currentPageId: 'p-hotspot',
  };
}

// ---------------------------------------------------------------------------
// Fix 1: Matching wrong pair retry
// ---------------------------------------------------------------------------

describe('PATCH A — Fix 1: Matching wrong pair retry', () => {
  const matchContent = {
    instruction: 'Cocokkan',
    leftItems: [
      { id: 'l1', label: 'Norma Agama' },
      { id: 'l2', label: 'Norma Hukum' },
    ],
    rightItems: [
      { id: 'r1', label: 'Aturan dari Tuhan' },
      { id: 'r2', label: 'Aturan dari negara' },
    ],
    correctPairs: [
      { leftId: 'l1', rightId: 'r1' },
      { leftId: 'l2', rightId: 'r2' },
    ],
    scorePerPair: 10,
  };

  it('1. wrong pair does NOT lock items — siswa bisa mencoba lagi', () => {
    const { container } = render(<MatchingGameComposer contract={contract} content={matchContent} />);
    // Select l1 (correct pair is l1→r1)
    fireEvent.click(container.querySelector('[data-testid="left-l1"]')!);
    // Click WRONG right item (r2 instead of r1)
    fireEvent.click(container.querySelector('[data-testid="right-r2"]')!);
    // Score should NOT increase
    expect(container.querySelector('[data-testid="matching-score"]')?.textContent).toBe('0');
    // Feedback should show "Belum tepat"
    expect(container.querySelector('[data-testid="matching-feedback"]')?.textContent).toContain('Belum tepat');
    // Right item r2 should NOT be disabled (still clickable)
    const r2Btn = container.querySelector('[data-testid="right-r2"]') as HTMLButtonElement;
    expect(r2Btn.disabled).toBe(false);
    // Left item l1 should NOT have success style (paired = false)
    const l1Btn = container.querySelector('[data-testid="left-l1"]') as HTMLButtonElement;
    expect(l1Btn.textContent).not.toContain('✓');
    // Siswa bisa mencoba lagi — select l1 again and click r1
    fireEvent.click(container.querySelector('[data-testid="left-l1"]')!);
    fireEvent.click(container.querySelector('[data-testid="right-r1"]')!);
    // Now score should increase
    expect(container.querySelector('[data-testid="matching-score"]')?.textContent).toBe('10');
    expect(container.textContent).toContain('Benar');
  });

  it('2. correct pair locks items and increases score', () => {
    const { container } = render(<MatchingGameComposer contract={contract} content={matchContent} />);
    // Select l1 → click r1 (correct)
    fireEvent.click(container.querySelector('[data-testid="left-l1"]')!);
    fireEvent.click(container.querySelector('[data-testid="right-r1"]')!);
    // Score increases
    expect(container.querySelector('[data-testid="matching-score"]')?.textContent).toBe('10');
    // Left item shows ✓
    expect(container.querySelector('[data-testid="left-l1"]')?.textContent).toContain('✓');
    // Right item r1 is disabled
    const r1Btn = container.querySelector('[data-testid="right-r1"]') as HTMLButtonElement;
    expect(r1Btn.disabled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Fix 2: Sequencing export reset
// ---------------------------------------------------------------------------

describe('PATCH A — Fix 2: Sequencing export reset', () => {
  it('3. export sequencing reset handler restores initial order + renumber + reset score', () => {
    const project = build4SceneProject();
    const html = exportProjectToHtml(project);
    // Export reset handler must contain initialItems lookup + DOM reorder logic
    expect(html).toContain('initialItems');
    expect(html).toContain('itemMap');
    expect(html).toContain('appendChild(el)');
    // Must contain renumber logic
    expect(html).toContain('Renumber');
    // Must reset score + hide feedback
    expect(html).toContain("ssv2.textContent = '0'");
    expect(html).toContain("sfb3.style.display = 'none'");
  });

  it('4. React sequencing reset restores initial order', () => {
    const seqContent = {
      instruction: 'Urutkan',
      items: [
        { id: 's1', label: 'Pertama' },
        { id: 's2', label: 'Kedua' },
        { id: 's3', label: 'Ketiga' },
      ],
      correctOrder: ['s1', 's2', 's3'],
      scorePerItem: 10,
    };
    const { container } = render(<SequencingGameComposer contract={contract} content={seqContent} />);
    // Move s2 up (swap with s1) — order becomes s2, s1, s3
    fireEvent.click(container.querySelector('[data-testid="sequence-up-s2"]')!);
    // Verify order changed — first item should now be s2
    const items = container.querySelectorAll('.silse-sequence-item');
    expect(items[0].getAttribute('data-testid')).toBe('sequence-item-s2');
    // Reset
    const resetBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Reset')) as HTMLElement;
    fireEvent.click(resetBtn);
    // Order should be restored — first item should be s1 again
    const itemsAfter = container.querySelectorAll('.silse-sequence-item');
    expect(itemsAfter[0].getAttribute('data-testid')).toBe('sequence-item-s1');
    // Score should be 0
    expect(container.querySelector('[data-testid="sequence-score"]')?.textContent).toBe('0');
  });
});

// ---------------------------------------------------------------------------
// Fix 3: Actual 4-scene export test
// ---------------------------------------------------------------------------

describe('PATCH A — Fix 3: Actual 4-scene export test', () => {
  it('5. export contains actual silse-scene-hotspot-map (not just function name)', () => {
    const project = build4SceneProject();
    const html = exportProjectToHtml(project);
    // The scene class must appear in the rendered output (JS code that creates the element)
    expect(html).toContain('silse-scene-hotspot-map');
    // The scenePlan for this page must NOT be null (page is scene-renderable)
    expect(html).toContain('"sceneType":"hotspot-map"');
  });

  it('6. export contains actual silse-scene-matching-game', () => {
    const project = build4SceneProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-scene-matching-game');
    expect(html).toContain('"sceneType":"matching-game"');
  });

  it('7. export contains actual silse-scene-sequencing-game', () => {
    const project = build4SceneProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-scene-sequencing-game');
    expect(html).toContain('"sceneType":"sequencing-game"');
  });

  it('8. export contains actual silse-scene-media-focus', () => {
    const project = build4SceneProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-scene-media-focus');
    expect(html).toContain('"sceneType":"media-focus"');
  });

  it('9. export 4-scene project has all 4 scene classes simultaneously', () => {
    const project = build4SceneProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-scene-hotspot-map');
    expect(html).toContain('silse-scene-matching-game');
    expect(html).toContain('silse-scene-sequencing-game');
    expect(html).toContain('silse-scene-media-focus');
  });

  it('10. legacy project does NOT contain new scene classes', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project);
    // Legacy project should not have these scene types
    expect(html).not.toContain('"sceneType":"hotspot-map"');
    expect(html).not.toContain('"sceneType":"matching-game"');
  });
});
