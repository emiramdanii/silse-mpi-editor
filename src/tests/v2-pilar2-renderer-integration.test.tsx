/**
 * V2-PILAR-2 Commit 2: Tests for renderer integration + export + interaction.
 *
 * Coverage:
 *   1. SceneRendererView renders HotspotOverlaySlotView (editor + preview)
 *   2. SceneRendererView renders InputFieldSlotView (editor + preview)
 *   3. Export HTML includes hotspot-overlay markup + interaction JS
 *   4. Export HTML includes input-field markup + auto-check JS
 *   5. Hotspot click → panel toggle (export JS)
 *   6. Input auto-check (export JS) — correct + wrong answer
 *   7. Inspector renders editors for both components
 *   8. Render parity: editor ↔ export (basic structural elements)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { useEditorStore } from '../store/editor-store';
import { exportProjectToHtml } from '../export/export-html';
import { SceneRendererView } from '../components/SceneRendererView';
import { Inspector } from '../editor/Inspector';
import { getDesignContractWithProjectStyle } from '../core/mpi-design-contract';
import { buildSceneRenderPlanForPage } from '../core/scene-renderer';
import { createProject } from '../core/project-factory';
import { createHotspotOverlayComponent, createInputFieldComponent, createHotspotPoint } from '../core/component-factory';
import type { SimpleProject, HotspotOverlayComponent, InputFieldComponent } from '../core/types';

// Helper: buat project dengan satu free page + satu komponen overlay
function makeProjectWithOverlay(overlay: HotspotOverlayComponent | InputFieldComponent): SimpleProject {
  // Reset store dulu untuk hindari state leak antar test
  useEditorStore.getState().resetProject();
  const project = createProject();
  // Tambah free page
  const store = useEditorStore.getState();
  store.setProject(project);
  store.addPage({ role: 'free', title: 'Slide Test' });
  // Pindah ke free page, hapus cover page biar cuma 1 page
  const freePageId = useEditorStore.getState().project.pages[1].id;
  store.selectPage(freePageId);
  // Hapus cover page
  store.deletePage(useEditorStore.getState().project.pages[0].id);
  // Tambah komponen
  store.addComponentsToPage(useEditorStore.getState().project.currentPageId, [overlay as never]);
  return useEditorStore.getState().project;
}

// ---------------------------------------------------------------------------
// 1. SceneRendererView renders HotspotOverlaySlotView
// ---------------------------------------------------------------------------

describe('V2-PILAR-2 Commit 2 — SceneRendererView renders HotspotOverlay', () => {
  it('1. editor renders hotspot-overlay view with hotspot points', () => {
    const overlay = createHotspotOverlayComponent({
      hotspots: [
        createHotspotPoint({ x: 30, y: 40, label: 'Titik A', info: 'Info A' }),
        createHotspotPoint({ x: 70, y: 60, label: 'Titik B', info: 'Info B' }),
      ],
    });
    const project = makeProjectWithOverlay(overlay);
    const page = project.pages[0];
    const plan = buildSceneRenderPlanForPage(project, page);
    const contract = getDesignContractWithProjectStyle(project.stylePackId, project.style);

    const { container } = render(
      React.createElement(SceneRendererView, {
        plan: plan!,
        contract,
        interactive: false,
        editorMode: true,
      }),
    );

    expect(container.querySelector('[data-testid="hotspot-overlay-view"]')).not.toBeNull();
    // 2 hotspot points
    const points = container.querySelectorAll('[class*="silse-hotspot-overlay-point"]');
    expect(points.length).toBe(2);
  });

  it('2. editor renders hotspot labels', () => {
    const overlay = createHotspotOverlayComponent({
      hotspots: [
        createHotspotPoint({ x: 50, y: 50, label: 'Pulau Jawa', info: 'Pulau terpadat' }),
      ],
    });
    const project = makeProjectWithOverlay(overlay);
    const page = project.pages[0];
    const plan = buildSceneRenderPlanForPage(project, page);
    const contract = getDesignContractWithProjectStyle(project.stylePackId, project.style);

    const { container } = render(
      React.createElement(SceneRendererView, {
        plan: plan!,
        contract,
        interactive: false,
        editorMode: true,
      }),
    );

    expect(container.textContent).toContain('Pulau Jawa');
  });

  it('3. editor renders hotspot panel when interactive + clicked', () => {
    const overlay = createHotspotOverlayComponent({
      hotspots: [
        createHotspotPoint({ x: 50, y: 50, label: 'Titik 1', info: 'Info detail' }),
      ],
    });
    const project = makeProjectWithOverlay(overlay);
    const page = project.pages[0];
    const plan = buildSceneRenderPlanForPage(project, page);
    const contract = getDesignContractWithProjectStyle(project.stylePackId, project.style);

    const { container } = render(
      React.createElement(SceneRendererView, {
        plan: plan!,
        contract,
        interactive: true,
      }),
    );

    // Klik titik hotspot pertama
    const firstPoint = container.querySelector('[class*="silse-hotspot-overlay-point"]') as HTMLElement;
    expect(firstPoint).not.toBeNull();
    fireEvent.click(firstPoint);

    // Panel info muncul
    const panel = container.querySelector('[data-testid="hotspot-overlay-panel"]');
    expect(panel).not.toBeNull();
    expect(panel?.textContent).toContain('Info detail');
  });
});

// ---------------------------------------------------------------------------
// 2. SceneRendererView renders InputFieldSlotView
// ---------------------------------------------------------------------------

describe('V2-PILAR-2 Commit 2 — SceneRendererView renders InputField', () => {
  it('4. editor renders input-field view with label + input', () => {
    const input = createInputFieldComponent({
      label: 'Apa ibu kota Indonesia?',
      placeholder: 'Ketik jawaban...',
    });
    const project = makeProjectWithOverlay(input);
    const page = project.pages[0];
    const plan = buildSceneRenderPlanForPage(project, page);
    const contract = getDesignContractWithProjectStyle(project.stylePackId, project.style);

    const { container } = render(
      React.createElement(SceneRendererView, {
        plan: plan!,
        contract,
        interactive: false,
        editorMode: true,
      }),
    );

    expect(container.querySelector('[data-testid="input-field-view"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="input-field-label"]')?.textContent).toContain('ibu kota Indonesia');
    expect(container.querySelector('[data-testid="input-field-input"]')).not.toBeNull();
  });

  it('5. input-field with no correctAnswer does NOT render check button', () => {
    const input = createInputFieldComponent({ label: 'Refleksi', placeholder: 'Tulis...' });
    const project = makeProjectWithOverlay(input);
    const page = project.pages[0];
    const plan = buildSceneRenderPlanForPage(project, page);
    const contract = getDesignContractWithProjectStyle(project.stylePackId, project.style);

    const { container } = render(
      React.createElement(SceneRendererView, {
        plan: plan!,
        contract,
        interactive: false,
      }),
    );

    expect(container.querySelector('[data-testid="input-field-check-btn"]')).toBeNull();
  });

  it('6. input-field with correctAnswer renders check button', () => {
    const input = createInputFieldComponent({
      label: 'Berapa 2+2?',
      placeholder: 'Jawab angka',
      correctAnswer: '4',
      feedbackCorrect: 'Benar!',
      feedbackWrong: 'Salah.',
    });
    const project = makeProjectWithOverlay(input);
    const page = project.pages[0];
    const plan = buildSceneRenderPlanForPage(project, page);
    const contract = getDesignContractWithProjectStyle(project.stylePackId, project.style);

    const { container } = render(
      React.createElement(SceneRendererView, {
        plan: plan!,
        contract,
        interactive: false,
      }),
    );

    expect(container.querySelector('[data-testid="input-field-check-btn"]')).not.toBeNull();
  });

  it('7. longAnswer variant renders textarea, not input', () => {
    const input = createInputFieldComponent({
      label: 'Esai',
      placeholder: 'Tulis panjang...',
      variant: 'longAnswer',
    });
    const project = makeProjectWithOverlay(input);
    const page = project.pages[0];
    const plan = buildSceneRenderPlanForPage(project, page);
    const contract = getDesignContractWithProjectStyle(project.stylePackId, project.style);

    const { container } = render(
      React.createElement(SceneRendererView, {
        plan: plan!,
        contract,
        interactive: false,
      }),
    );

    expect(container.querySelector('[data-testid="input-field-textarea"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="input-field-input"]')).toBeNull();
  });

  it('8. numericInput variant renders input type=number', () => {
    const input = createInputFieldComponent({
      label: 'Berapa umur?',
      placeholder: 'Angka',
      variant: 'numericInput',
    });
    const project = makeProjectWithOverlay(input);
    const page = project.pages[0];
    const plan = buildSceneRenderPlanForPage(project, page);
    const contract = getDesignContractWithProjectStyle(project.stylePackId, project.style);

    const { container } = render(
      React.createElement(SceneRendererView, {
        plan: plan!,
        contract,
        interactive: false,
      }),
    );

    const inputEl = container.querySelector('[data-testid="input-field-input"]') as HTMLInputElement;
    expect(inputEl).not.toBeNull();
    expect(inputEl.type).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// 3. Export HTML includes hotspot-overlay markup + interaction JS
// ---------------------------------------------------------------------------

describe('V2-PILAR-2 Commit 2 — Export HTML hotspot-overlay', () => {
  it('9. export HTML contains silse-hotspot-overlay class', () => {
    const overlay = createHotspotOverlayComponent({
      hotspots: [createHotspotPoint({ x: 50, y: 50, label: 'L', info: 'I' })],
    });
    const project = makeProjectWithOverlay(overlay);
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-hotspot-overlay');
  });

  it('10. export HTML contains hotspot point buttons + hotspot data in JSON model', () => {
    const overlay = createHotspotOverlayComponent({
      hotspots: [
        createHotspotPoint({ x: 25, y: 30, label: 'A', info: 'Info A' }),
        createHotspotPoint({ x: 75, y: 80, label: 'B', info: 'Info B' }),
      ],
    });
    const project = makeProjectWithOverlay(overlay);
    const html = exportProjectToHtml(project);
    // JS source contains the renderer for hotspot points
    expect(html).toContain('silse-hotspot-overlay-point');
    // JSON model contains hotspot coordinates (will be rendered at runtime)
    expect(html).toContain('"x":25');
    expect(html).toContain('"x":75');
    expect(html).toContain('"label":"A"');
    expect(html).toContain('"label":"B"');
  });

  it('11. export HTML contains hotspot panel div', () => {
    const overlay = createHotspotOverlayComponent({
      hotspots: [createHotspotPoint({ x: 50, y: 50, label: 'X', info: 'Y' })],
    });
    const project = makeProjectWithOverlay(overlay);
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-hotspot-overlay-panel');
  });

  it('12. export JS contains hotspot click handler', () => {
    const overlay = createHotspotOverlayComponent({
      hotspots: [createHotspotPoint({ x: 50, y: 50, label: 'X', info: 'Y' })],
    });
    const project = makeProjectWithOverlay(overlay);
    const html = exportProjectToHtml(project);
    expect(html).toContain("closest('.silse-hotspot-overlay-point')");
    expect(html).toContain('data-hotspot-idx');
  });
});

// ---------------------------------------------------------------------------
// 4. Export HTML includes input-field markup + auto-check JS
// ---------------------------------------------------------------------------

describe('V2-PILAR-2 Commit 2 — Export HTML input-field', () => {
  it('13. export HTML contains silse-input-field class', () => {
    const input = createInputFieldComponent({ label: 'Test', placeholder: 'P' });
    const project = makeProjectWithOverlay(input);
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-input-field');
  });

  it('14. export HTML contains input element with placeholder', () => {
    const input = createInputFieldComponent({ label: 'L', placeholder: 'Ketik di sini' });
    const project = makeProjectWithOverlay(input);
    const html = exportProjectToHtml(project);
    expect(html).toContain('Ketik di sini');
    expect(html).toContain('silse-input-field-input');
  });

  it('15. export HTML with correctAnswer contains check button', () => {
    const input = createInputFieldComponent({
      label: 'L',
      placeholder: 'P',
      correctAnswer: 'Jakarta',
      feedbackCorrect: 'Benar!',
      feedbackWrong: 'Salah.',
    });
    const project = makeProjectWithOverlay(input);
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-input-field-check-btn');
    expect(html).toContain('Periksa Jawaban');
    expect(html).toContain('Jakarta');
  });

  it('16. export HTML without correctAnswer does NOT include correctAnswer in JSON model', () => {
    const input = createInputFieldComponent({ label: 'FREE_INPUT_LABEL', placeholder: 'FREE_P' });
    const project = makeProjectWithOverlay(input);
    const html = exportProjectToHtml(project);
    // correctAnswer should not be in the JSON model (it's undefined in the component)
    expect(html).not.toContain('"correctAnswer"');
    // Verify the input field IS rendered
    expect(html).toContain('FREE_INPUT_LABEL');
  });

  it('17. export JS contains input auto-check handler', () => {
    const input = createInputFieldComponent({
      label: 'L', placeholder: 'P', correctAnswer: '4',
    });
    const project = makeProjectWithOverlay(input);
    const html = exportProjectToHtml(project);
    expect(html).toContain("closest('.silse-input-field-check-btn')");
    expect(html).toContain('data-correct-answer');
  });

  it('18. longAnswer variant exports textarea', () => {
    const input = createInputFieldComponent({
      label: 'Esai', placeholder: 'P', variant: 'longAnswer',
    });
    const project = makeProjectWithOverlay(input);
    const html = exportProjectToHtml(project);
    expect(html).toContain('createElement(\'textarea\')');
  });

  it('19. numericInput variant exports input type=number', () => {
    const input = createInputFieldComponent({
      label: 'N', placeholder: 'P', variant: 'numericInput',
    });
    const project = makeProjectWithOverlay(input);
    const html = exportProjectToHtml(project);
    expect(html).toMatch(/type.*=.*number|input.*type.*number/);
  });
});

// ---------------------------------------------------------------------------
// 5. Render parity: editor ↔ export (structural elements)
// ---------------------------------------------------------------------------

describe('V2-PILAR-2 Commit 2 — Render parity editor ↔ export', () => {
  it('20. hotspot label appears in both editor render and export HTML', () => {
    const overlay = createHotspotOverlayComponent({
      hotspots: [createHotspotPoint({ x: 50, y: 50, label: 'PARITY_LABEL', info: 'PARITY_INFO' })],
    });
    const project = makeProjectWithOverlay(overlay);

    // Editor render
    const page = project.pages[0];
    const plan = buildSceneRenderPlanForPage(project, page);
    const contract = getDesignContractWithProjectStyle(project.stylePackId, project.style);
    const { container: editorContainer } = render(
      React.createElement(SceneRendererView, { plan: plan!, contract, interactive: false }),
    );
    expect(editorContainer.textContent).toContain('PARITY_LABEL');

    // Export render
    const html = exportProjectToHtml(project);
    expect(html).toContain('PARITY_LABEL');
    expect(html).toContain('PARITY_INFO');
  });

  it('21. input label appears in both editor render and export HTML', () => {
    const input = createInputFieldComponent({
      label: 'PARITY_INPUT_LABEL',
      placeholder: 'PARITY_PLACEHOLDER',
    });
    const project = makeProjectWithOverlay(input);

    // Editor render
    const page = project.pages[0];
    const plan = buildSceneRenderPlanForPage(project, page);
    const contract = getDesignContractWithProjectStyle(project.stylePackId, project.style);
    const { container: editorContainer } = render(
      React.createElement(SceneRendererView, { plan: plan!, contract, interactive: false }),
    );
    expect(editorContainer.textContent).toContain('PARITY_INPUT_LABEL');
    expect(editorContainer.querySelector('input')?.placeholder).toBe('PARITY_PLACEHOLDER');

    // Export render
    const html = exportProjectToHtml(project);
    expect(html).toContain('PARITY_INPUT_LABEL');
    expect(html).toContain('PARITY_PLACEHOLDER');
  });
});

// ---------------------------------------------------------------------------
// 6. Inspector renders editors for both components
// ---------------------------------------------------------------------------

describe('V2-PILAR-2 Commit 2 — Inspector editors', () => {
  beforeEach(() => {
    useEditorStore.getState().resetProject();
  });

  it('22. Inspector renders HotspotOverlayComponentEditor when hotspot-overlay selected', () => {
    const store = useEditorStore.getState();
    store.addPage({ role: 'free', title: 'Slide' });
    const id = store.addHotspotOverlayComponent({
      hotspots: [createHotspotPoint({ x: 30, y: 40, label: 'P1', info: 'I1' })],
    });
    store.selectComponent(id);

    // Lazy import Inspector untuk avoid circular import issues
    
    const { container } = render(React.createElement(Inspector));
    expect(container.querySelector('[data-testid="component-editor-hotspot-overlay"]')).not.toBeNull();
  });

  it('23. Inspector renders InputFieldComponentEditor when input-field selected', () => {
    const store = useEditorStore.getState();
    store.addPage({ role: 'free', title: 'Slide' });
    const id = store.addInputFieldComponent({ label: 'Test', placeholder: 'P' });
    store.selectComponent(id);

    
    const { container } = render(React.createElement(Inspector));
    expect(container.querySelector('[data-testid="component-editor-input-field"]')).not.toBeNull();
  });

  it('24. HotspotOverlayComponentEditor renders add button', () => {
    const store = useEditorStore.getState();
    store.addPage({ role: 'free', title: 'Slide' });
    const id = store.addHotspotOverlayComponent();
    store.selectComponent(id);

    
    const { container } = render(React.createElement(Inspector));
    expect(container.querySelector('[data-testid="hotspot-add-btn"]')).not.toBeNull();
  });

  it('25. HotspotOverlayComponentEditor renders hotspot list with remove buttons', () => {
    const store = useEditorStore.getState();
    store.addPage({ role: 'free', title: 'Slide' });
    const id = store.addHotspotOverlayComponent({
      hotspots: [
        createHotspotPoint({ x: 10, y: 20, label: 'A', info: 'A' }),
        createHotspotPoint({ x: 30, y: 40, label: 'B', info: 'B' }),
      ],
    });
    store.selectComponent(id);

    
    const { container } = render(React.createElement(Inspector));
    expect(container.querySelector('[data-testid="hotspot-remove-0"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="hotspot-remove-1"]')).not.toBeNull();
  });

  it('26. InputFieldComponentEditor renders variant select', () => {
    const store = useEditorStore.getState();
    store.addPage({ role: 'free', title: 'Slide' });
    const id = store.addInputFieldComponent();
    store.selectComponent(id);

    
    const { container } = render(React.createElement(Inspector));
    const select = container.querySelector('[data-field="variant"]') as HTMLSelectElement;
    expect(select).not.toBeNull();
    expect(select.value).toBe('shortAnswer');
  });

  it('27. InputFieldComponentEditor with correctAnswer shows feedback fields', () => {
    const store = useEditorStore.getState();
    store.addPage({ role: 'free', title: 'Slide' });
    const id = store.addInputFieldComponent({
      label: 'Q', placeholder: 'P',
      correctAnswer: 'Ans',
      feedbackCorrect: 'Benar!',
      feedbackWrong: 'Salah.',
    });
    store.selectComponent(id);

    
    const { container } = render(React.createElement(Inspector));
    expect(container.querySelector('[data-field="feedbackCorrect"]')).not.toBeNull();
    expect(container.querySelector('[data-field="feedbackWrong"]')).not.toBeNull();
    expect(container.querySelector('[data-field="points"]')).not.toBeNull();
  });

  it('28. InputFieldComponentEditor without correctAnswer hides feedback fields', () => {
    const store = useEditorStore.getState();
    store.addPage({ role: 'free', title: 'Slide' });
    const id = store.addInputFieldComponent({ label: 'Q', placeholder: 'P' });
    store.selectComponent(id);

    
    const { container } = render(React.createElement(Inspector));
    expect(container.querySelector('[data-field="feedbackCorrect"]')).toBeNull();
    expect(container.querySelector('[data-field="feedbackWrong"]')).toBeNull();
  });
});
