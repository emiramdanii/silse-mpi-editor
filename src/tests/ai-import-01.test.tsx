/**
 * AI-IMPORT-01 — V1 AI Design Import Contract tests.
 *
 * Flow: AI → Blueprint JSON → Editor → Export HTML.
 * AI menghasilkan blueprint JSON (sesuai schema), BUKAN HTML bebas.
 * Editor membaca blueprint 100%, guru edit, export HTML.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { AiImportDialog } from '../editor/AiImportDialog';
import { useEditorStore } from '../store/editor-store';
import { createSamplePpknProject } from '../core/sample-project';
import { templateToBlueprint, TEMPLATE_PPKN_NORMA } from '../core/guided-flow/pedagogical-templates';
import { exportProjectToHtml } from '../export/export-html';

// Helper: generate a valid blueprint JSON string from PPKn template
function validBlueprintJson(): string {
  const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
  return JSON.stringify(bp, null, 2);
}

// Helper: invalid JSON (missing scenes)
const invalidJson = JSON.stringify({
  version: 1,
  metadata: { title: 'Test' },
  scenes: [], // empty scenes = invalid
});

describe('AI-IMPORT-01 — Scope A: Dialog UI structure', () => {
  beforeEach(() => {
    useEditorStore.setState({
      project: { ...createSamplePpknProject(), pages: [{ id: 'empty', title: 'New', role: 'cover', layoutId: 'blank', background: { type: 'color', color: '#fff' }, components: [] }], currentPageId: 'empty' },
    });
  });

  it('1. dialog renders with 2 tabs', () => {
    const { container } = render(<AiImportDialog onClose={() => {}} />);
    expect(container.querySelector('[data-testid="ai-import-dialog"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="ai-import-tab-prompt"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="ai-import-tab-import"]')).toBeInTheDocument();
  });

  it('2. tab 1 (Copy Prompt) is active by default', () => {
    const { container } = render(<AiImportDialog onClose={() => {}} />);
    expect(container.querySelector('[data-testid="ai-import-prompt-panel"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="ai-import-json-panel"]')).not.toBeInTheDocument();
  });

  it('3. tab 1 shows prompt text from buildMpiPromptText', () => {
    const { container } = render(<AiImportDialog onClose={() => {}} />);
    const ta = container.querySelector('[data-testid="ai-prompt-text"]') as HTMLTextAreaElement;
    expect(ta.value).toContain('OUTPUT RULES');
    expect(ta.value).toContain('JSON');
  });

  it('4. clicking tab 2 switches to import panel', () => {
    const { container } = render(<AiImportDialog onClose={() => {}} />);
    fireEvent.click(container.querySelector('[data-testid="ai-import-tab-import"]')!);
    expect(container.querySelector('[data-testid="ai-import-json-panel"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="ai-import-prompt-panel"]')).not.toBeInTheDocument();
  });

  it('5. close button calls onClose', () => {
    const onClose = vi.fn();
    const { container } = render(<AiImportDialog onClose={onClose} />);
    fireEvent.click(container.querySelector('[data-testid="ai-import-close"]')!);
    expect(onClose).toHaveBeenCalled();
  });
});

describe('AI-IMPORT-01 — Scope B: Prompt tab', () => {
  beforeEach(() => {
    useEditorStore.setState({
      project: { ...createSamplePpknProject(), pages: [{ id: 'empty', title: 'New', role: 'cover', layoutId: 'blank', background: { type: 'color', color: '#fff' }, components: [] }], currentPageId: 'empty' },
    });
  });

  it('6. copy prompt button exists', () => {
    const { container } = render(<AiImportDialog onClose={() => {}} />);
    expect(container.querySelector('[data-testid="ai-import-copy-prompt"]')).toBeInTheDocument();
  });

  it('7. "goto import" button switches to tab 2', () => {
    const { container } = render(<AiImportDialog onClose={() => {}} />);
    fireEvent.click(container.querySelector('[data-testid="ai-import-goto-import"]')!);
    expect(container.querySelector('[data-testid="ai-import-json-panel"]')).toBeInTheDocument();
  });

  it('8. prompt text contains key instructions for AI', () => {
    const { container } = render(<AiImportDialog onClose={() => {}} />);
    const ta = container.querySelector('[data-testid="ai-prompt-text"]') as HTMLTextAreaElement;
    // Prompt must mention: JSON output, sceneType, no HTML
    expect(ta.value).toContain('sceneType');
    expect(ta.value).toMatch(/JSON/i);
  });
});

describe('AI-IMPORT-01 — Scope C: JSON validation', () => {
  beforeEach(() => {
    useEditorStore.setState({
      project: { ...createSamplePpknProject(), pages: [{ id: 'empty', title: 'New', role: 'cover', layoutId: 'blank', background: { type: 'color', color: '#fff' }, components: [] }], currentPageId: 'empty' },
    });
  });

  it('9. empty JSON shows error', () => {
    const { container } = render(<AiImportDialog onClose={() => {}} />);
    fireEvent.click(container.querySelector('[data-testid="ai-import-tab-import"]')!);
    fireEvent.click(container.querySelector('[data-testid="ai-import-validate"]')!);
    expect(container.querySelector('[data-testid="ai-import-errors"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="ai-import-errors"]')?.textContent).toContain('kosong');
  });

  it('10. invalid JSON syntax shows parse error', () => {
    const { container } = render(<AiImportDialog onClose={() => {}} />);
    fireEvent.click(container.querySelector('[data-testid="ai-import-tab-import"]')!);
    const ta = container.querySelector('[data-testid="ai-import-json-input"]') as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: '{ invalid json' } });
    fireEvent.click(container.querySelector('[data-testid="ai-import-validate"]')!);
    expect(container.querySelector('[data-testid="ai-import-errors"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="ai-import-errors"]')?.textContent).toContain('JSON tidak valid');
  });

  it('11. invalid blueprint (empty scenes) shows validation errors', () => {
    const { container } = render(<AiImportDialog onClose={() => {}} />);
    fireEvent.click(container.querySelector('[data-testid="ai-import-tab-import"]')!);
    const ta = container.querySelector('[data-testid="ai-import-json-input"]') as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: invalidJson } });
    fireEvent.click(container.querySelector('[data-testid="ai-import-validate"]')!);
    expect(container.querySelector('[data-testid="ai-import-errors"]')).toBeInTheDocument();
  });

  it('12. valid blueprint shows no errors', () => {
    const { container } = render(<AiImportDialog onClose={() => {}} />);
    fireEvent.click(container.querySelector('[data-testid="ai-import-tab-import"]')!);
    const ta = container.querySelector('[data-testid="ai-import-json-input"]') as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: validBlueprintJson() } });
    fireEvent.click(container.querySelector('[data-testid="ai-import-validate"]')!);
    expect(container.querySelector('[data-testid="ai-import-errors"]')).not.toBeInTheDocument();
  });
});

describe('AI-IMPORT-01 — Scope D: Apply to editor', () => {
  beforeEach(() => {
    useEditorStore.setState({
      project: { ...createSamplePpknProject(), pages: [{ id: 'empty', title: 'New', role: 'cover', layoutId: 'blank', background: { type: 'color', color: '#fff' }, components: [] }], currentPageId: 'empty' },
    });
  });

  it('13. apply valid blueprint replaces project in store', () => {
    const { container } = render(<AiImportDialog onClose={() => {}} />);
    fireEvent.click(container.querySelector('[data-testid="ai-import-tab-import"]')!);
    const ta = container.querySelector('[data-testid="ai-import-json-input"]') as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: validBlueprintJson() } });
    fireEvent.click(container.querySelector('[data-testid="ai-import-apply"]')!);
    const project = useEditorStore.getState().project;
    // PPKn template has 17 scenes
    expect(project.pages.length).toBe(17);
  });

  it('14. apply shows success message', () => {
    const { container } = render(<AiImportDialog onClose={() => {}} />);
    fireEvent.click(container.querySelector('[data-testid="ai-import-tab-import"]')!);
    const ta = container.querySelector('[data-testid="ai-import-json-input"]') as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: validBlueprintJson() } });
    fireEvent.click(container.querySelector('[data-testid="ai-import-apply"]')!);
    expect(container.querySelector('[data-testid="ai-import-success"]')).toBeInTheDocument();
  });

  it('15. apply with invalid JSON does NOT replace project', () => {
    const originalPages = useEditorStore.getState().project.pages.length;
    const { container } = render(<AiImportDialog onClose={() => {}} />);
    fireEvent.click(container.querySelector('[data-testid="ai-import-tab-import"]')!);
    const ta = container.querySelector('[data-testid="ai-import-json-input"]') as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: invalidJson } });
    fireEvent.click(container.querySelector('[data-testid="ai-import-apply"]')!);
    expect(useEditorStore.getState().project.pages.length).toBe(originalPages);
  });

  it('16. all pages after apply have sceneType', () => {
    const { container } = render(<AiImportDialog onClose={() => {}} />);
    fireEvent.click(container.querySelector('[data-testid="ai-import-tab-import"]')!);
    const ta = container.querySelector('[data-testid="ai-import-json-input"]') as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: validBlueprintJson() } });
    fireEvent.click(container.querySelector('[data-testid="ai-import-apply"]')!);
    const project = useEditorStore.getState().project;
    project.pages.forEach((p) => {
      expect(p.sceneType, `page ${p.id}`).toBeDefined();
    });
  });
});

describe('AI-IMPORT-01 — Scope E: Export parity (AI → Editor → Export)', () => {
  beforeEach(() => {
    useEditorStore.setState({
      project: { ...createSamplePpknProject(), pages: [{ id: 'empty', title: 'New', role: 'cover', layoutId: 'blank', background: { type: 'color', color: '#fff' }, components: [] }], currentPageId: 'empty' },
    });
  });

  it('17. project from AI blueprint can be exported as standalone HTML', () => {
    const { container } = render(<AiImportDialog onClose={() => {}} />);
    fireEvent.click(container.querySelector('[data-testid="ai-import-tab-import"]')!);
    const ta = container.querySelector('[data-testid="ai-import-json-input"]') as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: validBlueprintJson() } });
    fireEvent.click(container.querySelector('[data-testid="ai-import-apply"]')!);
    const project = useEditorStore.getState().project;
    const html = exportProjectToHtml(project);
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
    expect(html).not.toMatch(/<script[^>]+src="https?:/);
  });

  it('18. exported HTML contains scene content from AI blueprint', () => {
    const { container } = render(<AiImportDialog onClose={() => {}} />);
    fireEvent.click(container.querySelector('[data-testid="ai-import-tab-import"]')!);
    const ta = container.querySelector('[data-testid="ai-import-json-input"]') as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: validBlueprintJson() } });
    fireEvent.click(container.querySelector('[data-testid="ai-import-apply"]')!);
    const project = useEditorStore.getState().project;
    const html = exportProjectToHtml(project);
    // PPKn cover hero title should appear
    expect(html).toContain('Macam-Macam Norma');
  });
});

describe('AI-IMPORT-01 — Scope F: Topbar integration (behavior test)', () => {
  it('19. Topbar renders "Import dari AI" button that opens AiImportDialog', async () => {
    const { createSamplePpknProject } = await import('../core/sample-project');
    const { Topbar } = await import('../editor/Topbar');
    useEditorStore.setState({ project: createSamplePpknProject() });

    const { container } = render(<Topbar />);
    const aiBtn = container.querySelector('[data-testid="topbar-ai-import"]') as HTMLButtonElement | null;
    expect(aiBtn, 'Topbar should render the AI import button').not.toBeNull();
    expect(aiBtn!.textContent).toContain('Import dari AI');

    // Click should open the dialog (lazy-loaded via React.lazy + Suspense)
    fireEvent.click(aiBtn!);
    // Wait for lazy component or Suspense fallback to appear
    await new Promise(resolve => setTimeout(resolve, 100));
    const dialogOrFallback = container.querySelector('[data-testid="ai-import-dialog"]') ||
      container.querySelector('div[style*="Memuat"]');
    expect(dialogOrFallback, 'Clicking AI import button should open dialog or show loading').not.toBeNull();
  });
});
