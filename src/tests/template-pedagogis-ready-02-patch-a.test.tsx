/**
 * TEMPLATE-PEDAGOGIS-READY-02 PATCH A — Tests.
 * Connect picker + overwrite guard + 16:9 fit + premium polish.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { PEDAGOGICAL_TEMPLATES, templateToBlueprint } from '../core/guided-flow/pedagogical-templates';
import { checkBlueprintContentQuality } from '../core/content-quality-guard';
import { TemplatePickerDialog } from '../editor/TemplatePickerDialog';
import { useEditorStore } from '../store/editor-store';
import { createSamplePpknProject } from '../core/sample-project';

describe('PATCH A — Connect + Overwrite + Fit + Polish', () => {
  beforeEach(() => {
    useEditorStore.setState({ project: createSamplePpknProject(), selectedComponentId: null });
  });

  // Scope A: Connect
  it('1. Topbar has Template Pedagogis button', () => {
    const source = readFileSync(resolve(__dirname, '../editor/Topbar.tsx'), 'utf-8');
    expect(source).toContain('TemplatePickerDialog');
    expect(source).toContain('topbar-template-picker');
    expect(source).toContain('Template Pedagogis');
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
    // Project replaced
    expect(useEditorStore.getState().project.pages).toHaveLength(12);
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

  it('7. OK confirm creates 12 pages', () => {
    const { container } = render(<TemplatePickerDialog onClose={() => {}} />);
    fireEvent.click(container.querySelector('[data-testid="template-apply-tpl-ppkn-norma"]')!);
    fireEvent.click(container.querySelector('[data-testid="overwrite-ok"]')!);
    expect(useEditorStore.getState().project.pages).toHaveLength(12);
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

  // Scope E: No legacy / unsafe
  it('14. no legacy generator as primary path', () => {
    const source = readFileSync(resolve(__dirname, '../editor/TemplatePickerDialog.tsx'), 'utf-8');
    expect(source).toContain('templateToBlueprint');
    expect(source).not.toContain('generateMpiFromTopic');
  });

  it('15. no makeSceneAny / unsafe cast in templates', () => {
    const source = readFileSync(resolve(__dirname, '../core/guided-flow/pedagogical-templates.ts'), 'utf-8');
    expect(source).not.toContain('makeSceneAny');
    expect(source).not.toContain('as unknown as');
  });
});
