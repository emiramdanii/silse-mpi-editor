/**
 * HIGH-PRIORITY-RENDERERS-01 — Tests.
 *
 * Tests 4 new scene renderers: hotspot-map, matching-game, sequencing-game, media-focus.
 * React + export parity + interaction + inspector + regression.
 */

import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  normalizeBlueprint,
  aiJsonToMpiContainer,
} from '../core/ai-mpi-json';
import { getDesignContract } from '../core/mpi-design-contract';
import { renderScenePlan } from '../core/scene-renderer';
import {
  HotspotMapComposer,
  MatchingGameComposer,
  SequencingGameComposer,
  MediaFocusComposer,
} from '../components/scene-composers';
import { exportProjectToHtml } from '../export/export-html';
import { createSamplePpknProject } from '../core/sample-project';
import { SceneContentEditor } from '../editor/SceneContentEditor';

const contract = getDesignContract('golden-reference');

function loadGoldenRef() {
  return JSON.parse(readFileSync(resolve(__dirname, '../../samples/ai-mpi-json/macam-norma-reference.sample.json'), 'utf-8'));
}

// ---------------------------------------------------------------------------
// SCOPE A — Hotspot Map
// ---------------------------------------------------------------------------

describe('HIGH-PRIORITY-RENDERERS-01 — Scope A: Hotspot Map', () => {
  const hotspotContent = {
    guidingQuestion: 'Identifikasi bagian peta',
    caption: 'Klik titik untuk informasi',
    hotspots: [
      { id: 'h1', x: 25, y: 30, label: 'Utara', info: 'Wilayah utara' },
      { id: 'h2', x: 70, y: 60, label: 'Selatan', info: 'Wilayah selatan' },
    ],
  };

  it('1. hotspot-map renders in SceneRendererView', () => {
    const { container } = render(<HotspotMapComposer contract={contract} content={hotspotContent} />);
    expect(container.querySelector('.silse-scene-hotspot-map')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="hotspot-map"]')).toBeInTheDocument();
  });

  it('2. hotspot click opens panel', () => {
    const { container } = render(<HotspotMapComposer contract={contract} content={hotspotContent} />);
    // Initially no panel
    expect(container.querySelector('[data-testid="hotspot-panel"]')).not.toBeInTheDocument();
    // Click first hotspot
    fireEvent.click(container.querySelector('[data-testid="hotspot-h1"]')!);
    // Panel should appear
    expect(container.querySelector('[data-testid="hotspot-panel"]')).toBeInTheDocument();
    expect(container.textContent).toContain('Utara');
    expect(container.textContent).toContain('Wilayah utara');
  });

  it('3. hotspot-map export contains hotspot classes + handler', () => {
    // Create a project with hotspot-map scene via a simple project
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project);
    // Export HTML has hotspot renderer code
    expect(html).toContain('renderHotspotMapExport');
    expect(html).toContain('silse-hotspot-map');
    expect(html).toContain('silse-hotspot-point');
    expect(html).toContain('[data-hotspot-id]');
  });

  it('4. hotspot-map fallback when no backgroundVisual', () => {
    const { container } = render(<HotspotMapComposer contract={contract} content={{ hotspots: [] }} />);
    expect(container.textContent).toContain('Peta tidak tersedia');
  });
});

// ---------------------------------------------------------------------------
// SCOPE B — Matching Game
// ---------------------------------------------------------------------------

describe('HIGH-PRIORITY-RENDERERS-01 — Scope B: Matching Game', () => {
  const matchContent = {
    instruction: 'Cocokkan istilah dengan definisi',
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

  it('5. matching-game renders left/right items', () => {
    const { container } = render(<MatchingGameComposer contract={contract} content={matchContent} />);
    expect(container.querySelector('.silse-scene-matching-game')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="left-l1"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="left-l2"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="right-r1"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="right-r2"]')).toBeInTheDocument();
  });

  it('6. matching-game click pair updates score/feedback', () => {
    const { container } = render(<MatchingGameComposer contract={contract} content={matchContent} />);
    // Select left item
    fireEvent.click(container.querySelector('[data-testid="left-l1"]')!);
    // Click correct right item
    fireEvent.click(container.querySelector('[data-testid="right-r1"]')!);
    // Score should increase
    expect(container.querySelector('[data-testid="matching-score"]')?.textContent).toBe('10');
    // Feedback should appear
    expect(container.querySelector('[data-testid="matching-feedback"]')).toBeInTheDocument();
    expect(container.textContent).toContain('Benar');
  });

  it('7. matching-game export contains data-left-id/data-right-id', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('renderMatchingGameExport');
    expect(html).toContain("setAttribute('data-left-id'");
    expect(html).toContain("setAttribute('data-right-id'");
    expect(html).toContain('[data-left-id]');
    expect(html).toContain('[data-right-id]');
  });
});

// ---------------------------------------------------------------------------
// SCOPE C — Sequencing Game
// ---------------------------------------------------------------------------

describe('HIGH-PRIORITY-RENDERERS-01 — Scope C: Sequencing Game', () => {
  const seqContent = {
    instruction: 'Urutkan tahap berdasarkan urutan benar',
    items: [
      { id: 's1', label: 'Pertama' },
      { id: 's2', label: 'Kedua' },
      { id: 's3', label: 'Ketiga' },
    ],
    correctOrder: ['s1', 's2', 's3'],
    scorePerItem: 10,
  };

  it('8. sequencing-game renders items', () => {
    const { container } = render(<SequencingGameComposer contract={contract} content={seqContent} />);
    expect(container.querySelector('.silse-scene-sequencing-game')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="sequence-item-s1"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="sequence-item-s2"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="sequence-item-s3"]')).toBeInTheDocument();
  });

  it('9. sequencing-game move/check changes order/feedback', () => {
    const { container } = render(<SequencingGameComposer contract={contract} content={seqContent} />);
    // Move s2 up (swap with s1)
    fireEvent.click(container.querySelector('[data-testid="sequence-up-s2"]')!);
    // Check answer (should be wrong now)
    fireEvent.click(container.querySelector('[data-testid="sequence-check"]')!);
    expect(container.querySelector('[data-testid="sequence-feedback"]')).toBeInTheDocument();
    expect(container.textContent).toContain('Belum tepat');
  });

  it('10. sequencing-game export contains sequence classes + handler', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('renderSequencingGameExport');
    expect(html).toContain('silse-sequence-item');
    expect(html).toContain('silse-sequence-up');
    expect(html).toContain('silse-sequence-down');
    expect(html).toContain('silse-sequence-check');
    expect(html).toContain('[data-action="seq-up"]');
    expect(html).toContain('[data-action="seq-down"]');
    expect(html).toContain('[data-action="seq-check"]');
  });
});

// ---------------------------------------------------------------------------
// SCOPE D — Media Focus
// ---------------------------------------------------------------------------

describe('HIGH-PRIORITY-RENDERERS-01 — Scope D: Media Focus', () => {
  const mediaContent = {
    mediaAsset: { src: 'https://example.com/image.png', alt: 'Gambar contoh' },
    guidingQuestion: 'Apa yang kamu lihat di gambar ini?',
    caption: 'Amati dengan teliti',
    responseInput: 'Tulis observasimu...',
  };

  it('11. media-focus renders MediaDisplayBlock/image', () => {
    const { container } = render(<MediaFocusComposer contract={contract} content={mediaContent} />);
    expect(container.querySelector('.silse-scene-media-focus')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="media-focus-display"]')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeInTheDocument();
    expect(container.querySelector('img')?.getAttribute('src')).toBe('https://example.com/image.png');
  });

  it('12. media-focus response input accepts text', () => {
    const { container } = render(<MediaFocusComposer contract={contract} content={mediaContent} />);
    const textarea = container.querySelector('textarea');
    expect(textarea).toBeInTheDocument();
    if (textarea) {
      fireEvent.change(textarea, { target: { value: 'Saya melihat...' } });
      expect((textarea as HTMLTextAreaElement).value).toBe('Saya melihat...');
    }
  });

  it('13. media-focus export contains media + response input', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('renderMediaFocusExport');
    expect(html).toContain('silse-media-focus-display');
    expect(html).toContain('silse-media-focus-question');
    expect(html).toContain('createElement(\'textarea\'');
  });

  it('14. media-focus fallback when asset missing', () => {
    const { container } = render(<MediaFocusComposer contract={contract} content={{ guidingQuestion: 'Test?' }} />);
    expect(container.textContent).toContain('Media tidak tersedia');
  });
});

// ---------------------------------------------------------------------------
// SCOPE E — SceneContent Inspector for 4 new scene types
// ---------------------------------------------------------------------------

describe('HIGH-PRIORITY-RENDERERS-01 — Scope E: SceneContent Inspector', () => {
  it('15. SceneContentEditor shows fields for hotspot-map', () => {
    const page = {
      id: 'p1', title: 'Hotspot', role: 'material', layoutId: 'blank',
      background: { type: 'color', color: '#fff' }, components: [],
      sceneType: 'hotspot-map',
      sceneContent: { kind: 'hotspot-map', guidingQuestion: 'Test', caption: 'Cap' },
    };
    const { container } = render(<SceneContentEditor page={page as any} />);
    expect(container.querySelector('[data-testid="scene-content-editor"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="scene-field-guidingQuestion"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="scene-field-caption"]')).toBeInTheDocument();
  });

  it('16. SceneContentEditor shows fields for matching-game', () => {
    const page = {
      id: 'p1', title: 'Match', role: 'activity', layoutId: 'blank',
      background: { type: 'color', color: '#fff' }, components: [],
      sceneType: 'matching-game',
      sceneContent: { kind: 'matching-game', instruction: 'Test' },
    };
    const { container } = render(<SceneContentEditor page={page as any} />);
    expect(container.querySelector('[data-testid="scene-field-instruction"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="scene-field-completionMessage"]')).toBeInTheDocument();
  });

  it('17. SceneContentEditor shows fields for sequencing-game', () => {
    const page = {
      id: 'p1', title: 'Seq', role: 'activity', layoutId: 'blank',
      background: { type: 'color', color: '#fff' }, components: [],
      sceneType: 'sequencing-game',
      sceneContent: { kind: 'sequencing-game', instruction: 'Test' },
    };
    const { container } = render(<SceneContentEditor page={page as any} />);
    expect(container.querySelector('[data-testid="scene-field-instruction"]')).toBeInTheDocument();
  });

  it('18. SceneContentEditor shows fields for media-focus', () => {
    const page = {
      id: 'p1', title: 'Media', role: 'material', layoutId: 'blank',
      background: { type: 'color', color: '#fff' }, components: [],
      sceneType: 'media-focus',
      sceneContent: { kind: 'media-focus', guidingQuestion: 'Test?', caption: 'Cap' },
    };
    const { container } = render(<SceneContentEditor page={page as any} />);
    expect(container.querySelector('[data-testid="scene-field-guidingQuestion"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="scene-field-caption"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="scene-field-responseInput"]')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// SCOPE F — Regression
// ---------------------------------------------------------------------------

describe('HIGH-PRIORITY-RENDERERS-01 — Scope F: Regression', () => {
  it('19. 12 golden-reference scenes still pass', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = aiJsonToMpiContainer(bp);
    expect(container.scenes).toHaveLength(12);
    container.scenes.forEach((scene) => {
      const plan = renderScenePlan(scene, contract);
      expect(plan.sceneClass).toContain('silse-scene');
    });
  });

  it('20. legacy project still safe', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('"scenePlan":null');
    expect(() => exportProjectToHtml(project)).not.toThrow();
  });
});
