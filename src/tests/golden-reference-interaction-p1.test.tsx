/**
 * GOLDEN-REFERENCE-INTERACTION-P1 — Test Suite.
 */

import { describe, it, expect, vi } from 'vitest';
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
import { SceneRendererView } from '../components/SceneRendererView';
import { exportProjectToHtml } from '../export/export-html';
import { createSamplePpknProject } from '../core/sample-project';
import {
  SceneTabs, SceneAccordion, TimerBlock, ResponseInputBlock, RevealBlock,
} from '../components/scene-blocks';

const contract = getDesignContract('golden-reference');

function loadGoldenRef() {
  const path = resolve(__dirname, '../../samples/ai-mpi-json/macam-norma-reference.sample.json');
  return JSON.parse(readFileSync(path, 'utf-8'));
}

describe('GOLDEN-REFERENCE-INTERACTION-P1 — interaction primitives', () => {
  // 1: Tab berpindah panel
  it('1. tab berpindah panel (click tab switches active)', () => {
    const onTabClick = vi.fn();
    const { container } = render(
      <SceneTabs contract={contract} tabs={[
        { id: 'cp', label: 'CP' }, { id: 'tp', label: 'TP' },
      ]} activeTab="cp" onTabClick={onTabClick} />
    );
    const tpTab = container.querySelector('[data-tab-id="tp"]') as HTMLElement;
    expect(tpTab).toBeInTheDocument();
    fireEvent.click(tpTab);
    // Callback should be called with 'tp'
    expect(onTabClick).toHaveBeenCalledWith('tp');
  });

  // 2: Accordion buka/tutup
  it('2. accordion buka/tutup (click toggles body)', () => {
    const onToggle = vi.fn();
    const { container } = render(
      <SceneAccordion contract={contract} items={[
        { title: 'Item 1', body: 'Body 1' },
      ]} openIndex={null} onToggle={onToggle} />
    );
    // Click the header div to open
    const headerDiv = container.querySelector('[data-accordion-idx="0"] > div') as HTMLElement;
    expect(headerDiv).toBeInTheDocument();
    fireEvent.click(headerDiv);
    // Callback should be called
    expect(onToggle).toHaveBeenCalledWith(0);
  });

  // 3: Timer start/reset
  it('3. timer start/reset (toggle button works)', () => {
    const { container } = render(<TimerBlock contract={contract} seconds={300} />);
    const toggle = container.querySelector('[data-testid="timer-toggle"]') as HTMLElement;
    const reset = container.querySelector('[data-testid="timer-reset"]') as HTMLElement;
    expect(toggle).toBeInTheDocument();
    expect(reset).toBeInTheDocument();
    // Click toggle — should change to pause icon
    fireEvent.click(toggle);
    expect(toggle.textContent).toBe('⏸');
    // Click reset — should stop
    fireEvent.click(reset);
  });

  // 4: Input menerima teks
  it('4. input menerima teks (textarea accepts input)', () => {
    const { container } = render(<ResponseInputBlock contract={contract} placeholder="Test" />);
    const textarea = container.querySelector('[data-testid="response-textarea"]') as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();
    fireEvent.change(textarea, { target: { value: 'Jawaban saya' } });
    expect(textarea.value).toBe('Jawaban saya');
  });

  // 5: Save response menampilkan saved badge
  it('5. save response menampilkan saved badge', () => {
    const { container } = render(<ResponseInputBlock contract={contract} />);
    const saveBtn = container.querySelector('[data-testid="save-response"]') as HTMLElement;
    expect(saveBtn).toBeInTheDocument();
    // Before save — no badge
    expect(container.querySelector('[data-testid="saved-badge"]')).not.toBeInTheDocument();
    // Click save — badge appears
    fireEvent.click(saveBtn);
    expect(container.querySelector('[data-testid="saved-badge"]')).toBeInTheDocument();
  });

  // 6: Reveal block buka/tutup
  it('6. reveal block buka/tutup (click toggles content)', () => {
    const { container } = render(<RevealBlock contract={contract} label="Pembahasan" text="Ini pembahasan" />);
    const reveal = container.querySelector('[data-testid="silse-block-reveal"]') as HTMLElement;
    expect(reveal).toBeInTheDocument();
    // Initially hidden — shows hint
    expect(container.textContent).toContain('Klik untuk melihat');
    // Click to reveal
    fireEvent.click(reveal);
    expect(container.textContent).toContain('Ini pembahasan');
    // Click again to hide
    fireEvent.click(reveal);
    expect(container.textContent).toContain('Klik untuk melihat');
  });

  // 7: Reflection input muncul di scene
  it('7. reflection input muncul di reflection-journal scene', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container2 = aiJsonToMpiContainer(bp);
    const scene = container2.scenes.find((s) => s.sceneType === 'reflection-journal')!;
    const plan = renderScenePlan(scene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    expect(dom.querySelector('.silse-block-input')).toBeInTheDocument();
    expect(dom.querySelector('.silse-block-reflection')).toBeInTheDocument();
  });

  // 8: Export HTML memuat handlers interaction
  it('8. export HTML memuat interaction handlers (wireInteractions, data-tab-id, data-action)', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('wireInteractions');
    expect(html).toContain('data-tab-id');
    expect(html).toContain('data-action');
    expect(html).toContain('save-response');
    expect(html).toContain('timer-toggle');
  });

  // 9: Legacy fallback tetap aman
  it('9. legacy fallback tetap aman', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('"scenePlan":null');
    expect(html.length).toBeGreaterThan(1000);
  });

  // 10: Full golden reference sample tetap valid
  it('10. golden reference sample 12 scene tetap valid', () => {
    const raw = loadGoldenRef();
    const bp = normalizeBlueprint(raw);
    expect(bp.scenes.length).toBe(12);
    const container2 = aiJsonToMpiContainer(bp);
    expect(container2.scenes.length).toBe(12);
  });

  // 11: Curriculum guide tabs work in scene context
  it('11. curriculum-guide tabs work in scene context', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container2 = aiJsonToMpiContainer(bp);
    const scene = container2.scenes.find((s) => s.sceneType === 'curriculum-guide')!;
    const plan = renderScenePlan(scene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    const tabs = dom.querySelector('[data-testid="silse-block-tabs"]');
    expect(tabs).toBeInTheDocument();
    // Tab buttons should be present and clickable
    const tpTab = dom.querySelector('[data-tab-id="tp"]') as HTMLElement;
    expect(tpTab).toBeInTheDocument();
    // Click should not crash
    fireEvent.click(tpTab);
  });

  // 12: Discussion scene has timer + input
  it('12. discussion-scene has timer + input with interaction', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container2 = aiJsonToMpiContainer(bp);
    const scene = container2.scenes.find((s) => s.sceneType === 'discussion-scene')!;
    const plan = renderScenePlan(scene, contract);
    const { container: dom } = render(<SceneRendererView plan={plan} contract={contract} />);
    expect(dom.querySelector('[data-testid="silse-block-timer"]')).toBeInTheDocument();
    expect(dom.querySelector('[data-testid="silse-block-input"]')).toBeInTheDocument();
  });
});
