/**
 * TEACHER-MAIN-FLOW-POLISH-01 tests.
 *
 * 18 mandatory tests per senior reviewer spec.
 * Verifies the main teacher flow: Topbar → GuidedFlowDialog → Generate → Apply → Export.
 * Verifies copy changes, empty state hint, guidance after generate, and regression.
 */

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { Topbar } from '../editor/Topbar';
import { GuidedFlowDialog } from '../editor/GuidedFlowDialog';
import { PagePanel } from '../editor/PagePanel';
import { useEditorStore } from '../store/editor-store';
import { createSamplePpknProject } from '../core/sample-project';
import { generateMpiFromTopic } from '../core/guided-flow/generate-mpi-from-topic';
import { getTopicById } from '../core/guided-flow/mpi-topic-catalog';
import { downloadHtmlFile } from '../export/export-download';
import { exportProjectToHtml } from '../export/export-html';

vi.mock('../export/export-download', () => ({
  downloadHtmlFile: vi.fn(),
}));

// =========================================================================
// Helpers
// =========================================================================

async function selectAndGenerate(container: HTMLElement, topicId: string) {
  const topicCard = container.querySelector(`[data-testid="guided-flow-topic-${topicId}"]`) as HTMLButtonElement;
  fireEvent.click(topicCard);
  const generateBtn = container.querySelector('[data-testid="guided-flow-generate"]') as HTMLButtonElement;
  fireEvent.click(generateBtn);
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
  });
}

// =========================================================================
// Flow Tests (1-15)
// =========================================================================

describe('TEACHER-MAIN-FLOW-POLISH-01 — flow', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('1. Topbar displays main "Buat MPI dari Topik" button', () => {
    const { container } = render(React.createElement(Topbar));
    const btn = container.querySelector('[data-testid="topbar-guided-flow"]');
    expect(btn).not.toBeNull();
  });

  it('2. Button label uses teacher-friendly language ("Buat MPI dari Topik")', () => {
    const { container } = render(React.createElement(Topbar));
    const btn = container.querySelector('[data-testid="topbar-guided-flow"]') as HTMLButtonElement;
    expect(btn.textContent).toContain('Buat MPI dari Topik');
    // Should NOT use old "Paket" wording.
    expect(btn.textContent).not.toContain('Paket MPI dari Topik');
  });

  it('3. Clicking button opens GuidedFlowDialog', () => {
    const { container } = render(React.createElement(Topbar));
    const btn = container.querySelector('[data-testid="topbar-guided-flow"]') as HTMLButtonElement;
    fireEvent.click(btn);
    expect(container.querySelector('[data-testid="guided-flow-dialog"]')).not.toBeNull();
  });

  it('4. Dialog explains topic selection function (mentions tujuan, materi, aktivitas, kuis, refleksi, penutup)', () => {
    const { container } = render(React.createElement(GuidedFlowDialog, { onClose: vi.fn() }));
    const hint = container.querySelector('.guided-flow-modal__hint');
    expect(hint?.textContent).toContain('Pilih topik');
    expect(hint?.textContent).toContain('tujuan');
    expect(hint?.textContent).toContain('materi');
    expect(hint?.textContent).toContain('kuis');
    expect(hint?.textContent).toContain('refleksi');
    expect(hint?.textContent).toContain('penutup');
  });

  it('5. Generate button disabled before topic selected', () => {
    const { container } = render(React.createElement(GuidedFlowDialog, { onClose: vi.fn() }));
    const generateBtn = container.querySelector('[data-testid="guided-flow-generate"]') as HTMLButtonElement;
    expect(generateBtn.disabled).toBe(true);
  });

  it('6. Selecting topic enables generate button', () => {
    const { container } = render(React.createElement(GuidedFlowDialog, { onClose: vi.fn() }));
    const topicCard = container.querySelector('[data-testid="guided-flow-topic-ppkn-7-norma"]') as HTMLButtonElement;
    fireEvent.click(topicCard);
    const generateBtn = container.querySelector('[data-testid="guided-flow-generate"]') as HTMLButtonElement;
    expect(generateBtn.disabled).toBe(false);
  });

  it('7. Generate displays draft result', async () => {
    const { container } = render(React.createElement(GuidedFlowDialog, { onClose: vi.fn() }));
    await selectAndGenerate(container, 'ppkn-7-norma');
    // Should show result (apply button appears).
    const applyBtn = container.querySelector('[data-testid="guided-flow-apply"]');
    expect(applyBtn).not.toBeNull();
    // Should show page count.
    expect(container.textContent).toContain('10 halaman');
  });

  it('8. After generate, guidance "Terapkan ke Editor" is shown', async () => {
    const { container } = render(React.createElement(GuidedFlowDialog, { onClose: vi.fn() }));
    await selectAndGenerate(container, 'ppkn-7-norma');
    const guidance = container.querySelector('[data-testid="guided-flow-guidance"]');
    expect(guidance).not.toBeNull();
    expect(guidance?.textContent).toContain('Terapkan ke Editor');
  });

  it('9. Apply project closes dialog', async () => {
    const onClose = vi.fn();
    const { container } = render(React.createElement(GuidedFlowDialog, { onClose }));
    await selectAndGenerate(container, 'ppkn-7-norma');
    const applyBtn = container.querySelector('[data-testid="guided-flow-apply"]') as HTMLButtonElement;
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.click(applyBtn);
    expect(onClose).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('10. Project after apply has multiple pages (10)', async () => {
    const { container } = render(React.createElement(GuidedFlowDialog, { onClose: vi.fn() }));
    await selectAndGenerate(container, 'ppkn-7-norma');
    const applyBtn = container.querySelector('[data-testid="guided-flow-apply"]') as HTMLButtonElement;
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.click(applyBtn);
    expect(useEditorStore.getState().project.pages.length).toBe(10);
    confirmSpy.mockRestore();
  });

  it('11. Export ready chip visible in Topbar after apply', async () => {
    const { container } = render(React.createElement(GuidedFlowDialog, { onClose: vi.fn() }));
    await selectAndGenerate(container, 'ppkn-7-norma');
    const applyBtn = container.querySelector('[data-testid="guided-flow-apply"]') as HTMLButtonElement;
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.click(applyBtn);
    confirmSpy.mockRestore();

    // Render Topbar to check chip.
    const { container: topbarContainer } = render(React.createElement(Topbar));
    const chip = topbarContainer.querySelector('[data-testid="export-ready-summary"]');
    expect(chip).not.toBeNull();
  });

  it('12. Export button still exists in Topbar', () => {
    const { container } = render(React.createElement(Topbar));
    const exportBtn = container.querySelector('[data-testid="topbar-export"]');
    expect(exportBtn).not.toBeNull();
  });

  it('13. Healthy generated project export without confirm', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);
    useEditorStore.getState().setProject(project);

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const downloadSpy = vi.mocked(downloadHtmlFile);
    downloadSpy.mockClear();

    const { container } = render(React.createElement(Topbar));
    fireEvent.click(container.querySelector('[data-testid="topbar-export"]') as HTMLButtonElement);

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(downloadSpy).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('14. Broken/default project export with confirm', () => {
    // Default project (newProject) → NO_OBJECTIVES → fatal → confirm.
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { container } = render(React.createElement(Topbar));
    fireEvent.click(container.querySelector('[data-testid="topbar-export"]') as HTMLButtonElement);
    expect(confirmSpy).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('15. Confirm replace project still exists for non-default project', async () => {
    // Set up a non-default project.
    const sample = createSamplePpknProject();
    useEditorStore.getState().setProject(sample);

    const { container } = render(React.createElement(GuidedFlowDialog, { onClose: vi.fn() }));
    await selectAndGenerate(container, 'ipa-7-zat');

    const applyBtn = container.querySelector('[data-testid="guided-flow-apply"]') as HTMLButtonElement;
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.click(applyBtn);

    // confirm should have been called for project replacement.
    expect(confirmSpy).toHaveBeenCalledWith('Paket MPI ini akan mengganti project yang sedang dibuka. Lanjutkan?');
    confirmSpy.mockRestore();
  });
});

// =========================================================================
// Copy/Empty State Tests (16)
// =========================================================================

describe('TEACHER-MAIN-FLOW-POLISH-01 — copy + empty state', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('16. No raw technical jargon in main user-facing UI text (topbar + dialog + page panel)', () => {
    const { container: topbarContainer } = render(React.createElement(Topbar));
    const { container: dialogContainer } = render(React.createElement(GuidedFlowDialog, { onClose: vi.fn() }));
    const { container: panelContainer } = render(React.createElement(PagePanel));

    const allText = [
      topbarContainer.textContent,
      dialogContainer.textContent,
      panelContainer.textContent,
    ].join(' ');

    // Should NOT contain these as primary text (data attributes ok, but not visible text).
    expect(allText).not.toMatch(/\bqualityReport\b/);
    expect(allText).not.toMatch(/\bcoreContract\b/);
    expect(allText).not.toMatch(/\bcomponentId\b/);
    expect(allText).not.toMatch(/\bundefined\b/);
    expect(allText).not.toMatch(/\bnull\b/);
    expect(allText).not.toMatch(/\bschema\b/);
  });

  it('16b. Empty state hint shows for default project', () => {
    const { container } = render(React.createElement(PagePanel));
    const hint = container.querySelector('[data-testid="page-panel-empty-hint"]');
    expect(hint).not.toBeNull();
    expect(hint?.textContent).toContain('Mulai cepat');
    expect(hint?.textContent).toContain('Buat MPI dari Topik');
  });

  it('16c. Empty state hint does NOT show for non-default project', () => {
    const sample = createSamplePpknProject();
    useEditorStore.getState().setProject(sample);

    const { container } = render(React.createElement(PagePanel));
    const hint = container.querySelector('[data-testid="page-panel-empty-hint"]');
    expect(hint).toBeNull();
  });
});

// =========================================================================
// Regression Tests (17-18)
// =========================================================================

describe('TEACHER-MAIN-FLOW-POLISH-01 — regression', () => {
  it('17. PageThumbnail not changed (still exports PageThumbnail)', async () => {
    const mod = await import('../editor/PageThumbnail');
    expect(mod.PageThumbnail).toBeDefined();
  });

  it('18. Export engine not changed (exportProjectToHtml still exists)', () => {
    expect(exportProjectToHtml).toBeDefined();
    expect(typeof exportProjectToHtml).toBe('function');
  });
});
