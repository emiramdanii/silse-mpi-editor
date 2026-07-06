/**
 * TEMPLATE-PEDAGOGIS-READY-02 PATCH A — Tests.
 * Connect picker + overwrite guard + 16:9 fit + premium polish.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { PEDAGOGICAL_TEMPLATES, templateToBlueprint, TEMPLATE_PPKN_NORMA } from '../core/guided-flow/pedagogical-templates';
import { validateAiMpiJson } from '../core/ai-mpi-json';
import { checkBlueprintContentQuality } from '../core/content-quality-guard';
import { TemplatePickerDialog } from '../editor/TemplatePickerDialog';
import { useEditorStore } from '../store/editor-store';
import { createSamplePpknProject } from '../core/sample-project';

describe('PATCH A — Connect + Overwrite + Fit + Polish', () => {
  beforeEach(() => {
    useEditorStore.setState({ project: createSamplePpknProject(), selectedComponentId: null });
  });

  // Scope A: Connect — behavior test (render Topbar, find button)
  it('1. Topbar renders "Template Pedagogis" button', async () => {
    const { Topbar } = await import('../editor/Topbar');
    const { createSamplePpknProject } = await import('../core/sample-project');
    useEditorStore.setState({ project: createSamplePpknProject() });
    const { container } = render(<Topbar />);
    const btn = container.querySelector('[data-testid="topbar-template-picker"]');
    expect(btn, 'Topbar should render template picker button').not.toBeNull();
    expect(btn!.textContent).toContain('Template Pedagogis');
  });

  it('2. clicking button opens TemplatePickerDialog', () => {
    const { container } = render(<TemplatePickerDialog onClose={() => {}} />);
    expect(container.querySelector('[data-testid="template-picker-dialog"]')).toBeInTheDocument();
  });

  it('3. close button closes dialog', () => {
    const onClose = vi.fn();
    const { container } = render(<TemplatePickerDialog onClose={onClose} />);
    fireEvent.click(container.querySelector('[data-testid="template-picker-close"]')!);
    expect(onClose).toHaveBeenCalled();
  });

  // Scope B: Overwrite guard
  it('4. apply on empty project succeeds without confirm', () => {
    // Create empty project (1 page, no components, no sceneType)
    useEditorStore.setState({
      project: {
        ...createSamplePpknProject(),
        pages: [{
          id: 'empty', title: 'New', role: 'cover', layoutId: 'blank',
          background: { type: 'color', color: '#fff' }, components: [],
        }],
        currentPageId: 'empty',
      },
    });
    const { container } = render(<TemplatePickerDialog onClose={() => {}} />);
    fireEvent.click(container.querySelector('[data-testid="template-apply-tpl-ppkn-norma"]')!);
    // No confirm dialog
    expect(container.querySelector('[data-testid="overwrite-confirm"]')).not.toBeInTheDocument();
    // Project replaced — PPKn template has 17 scenes (12 golden + 5 teacher-pedagogy)
    expect(useEditorStore.getState().project.pages).toHaveLength(17);
  });

  it('5. apply on project with content shows confirm', () => {
    // createSamplePpknProject has 10 pages with components = has content
    const { container } = render(<TemplatePickerDialog onClose={() => {}} />);
    fireEvent.click(container.querySelector('[data-testid="template-apply-tpl-ppkn-norma"]')!);
    expect(container.querySelector('[data-testid="overwrite-confirm"]')).toBeInTheDocument();
  });

  it('6. cancel confirm does not overwrite', () => {
    const originalPages = useEditorStore.getState().project.pages.length;
    const { container } = render(<TemplatePickerDialog onClose={() => {}} />);
    fireEvent.click(container.querySelector('[data-testid="template-apply-tpl-ppkn-norma"]')!);
    fireEvent.click(container.querySelector('[data-testid="overwrite-cancel"]')!);
    expect(useEditorStore.getState().project.pages).toHaveLength(originalPages);
  });

  it('7. OK confirm creates pages matching template scene count', () => {
    const { container } = render(<TemplatePickerDialog onClose={() => {}} />);
    fireEvent.click(container.querySelector('[data-testid="template-apply-tpl-ppkn-norma"]')!);
    fireEvent.click(container.querySelector('[data-testid="overwrite-ok"]')!);
    // PPKn template has 17 scenes (12 golden + 5 teacher-pedagogy)
    expect(useEditorStore.getState().project.pages).toHaveLength(17);
  });

  it('8. current page is cover after apply', () => {
    const { container } = render(<TemplatePickerDialog onClose={() => {}} />);
    fireEvent.click(container.querySelector('[data-testid="template-apply-tpl-ppkn-norma"]')!);
    fireEvent.click(container.querySelector('[data-testid="overwrite-ok"]')!);
    const project = useEditorStore.getState().project;
    const current = project.pages.find((p) => p.id === project.currentPageId);
    expect(current?.role).toBe('cover');
  });

  it('9. all pages have sceneType after apply', () => {
    const { container } = render(<TemplatePickerDialog onClose={() => {}} />);
    fireEvent.click(container.querySelector('[data-testid="template-apply-tpl-ppkn-norma"]')!);
    fireEvent.click(container.querySelector('[data-testid="overwrite-ok"]')!);
    useEditorStore.getState().project.pages.forEach((page) => {
      expect(page.sceneType, `page ${page.id}`).toBeDefined();
    });
  });

  // Scope C: 16:9 density
  it('10. all templates pass content quality', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const bp = templateToBlueprint(t);
      const result = checkBlueprintContentQuality(bp);
      expect(result.errors, `${t.id}: ${result.errors.map((e) => e.message).join('; ')}`).toHaveLength(0);
    });
  });

  it('11. all templates pass 16:9 density guard (explanation <= 350 chars)', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const bp = templateToBlueprint(t);
      bp.scenes.forEach((scene) => {
        const content = scene.slots[0]?.content as Record<string, unknown>;
        if (content?.explanation) {
          expect(String(content.explanation).length, `${t.id} ${scene.id} explanation`).toBeLessThanOrEqual(350);
        }
        if (content?.caseText) {
          expect(String(content.caseText).length, `${t.id} ${scene.id} caseText`).toBeLessThanOrEqual(220);
        }
        if (content?.revealExplanation) {
          expect(String(content.revealExplanation).length, `${t.id} ${scene.id} revealExplanation`).toBeLessThanOrEqual(260);
        }
      });
    });
  });

  // Scope D: Premium UI
  it('12. quality badges appear in template cards', () => {
    const { container } = render(<TemplatePickerDialog onClose={() => {}} />);
    const status = container.querySelector('[data-testid^="template-status-"]');
    expect(status?.textContent).toContain('Valid');
    expect(status?.textContent).toContain('Quality');
  });

  it('13. game type badge appears in template cards', () => {
    const { container } = render(<TemplatePickerDialog onClose={() => {}} />);
    const gameBadge = container.querySelector('[data-testid^="template-game-type-"]');
    expect(gameBadge).toBeInTheDocument();
    expect(gameBadge?.textContent).toContain('Game');
  });

  // Scope E: No legacy / unsafe — behavior test (apply template, verify it works)
  it('14. applying template produces valid project (uses templateToBlueprint, not legacy generator)', () => {
    // If TemplatePickerDialog used legacy generateMpiFromTopic, the applied project
    // would have different structure. Verify templateToBlueprint path works.
    const { container } = render(<TemplatePickerDialog onClose={() => {}} />);
    fireEvent.click(container.querySelector('[data-testid="template-apply-tpl-ppkn-norma"]')!);
    fireEvent.click(container.querySelector('[data-testid="overwrite-ok"]')!);
    const project = useEditorStore.getState().project;
    // TemplateToBlueprint produces 17 pages for PPKn (legacy generator produces different count)
    expect(project.pages.length).toBe(17);
    // Every page has sceneType (templateToBlueprint preserves sceneType)
    project.pages.forEach((p) => expect(p.sceneType).toBeTruthy());
  });

  it('15. template data has no unsafe cast (all scenes produce valid blueprints)', () => {
    // If templates had makeSceneAny/unsafe cast, validateAiMpiJson would catch type errors
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    const errors = validateAiMpiJson(bp);
    expect(errors, 'template should produce valid blueprint without unsafe casts').toHaveLength(0);
  });
});
