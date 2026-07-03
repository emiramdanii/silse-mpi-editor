/**
 * TEMPLATE-PEDAGOGIS-READY-02 — Tests.
 * UI Picker + Schema Sync + Apply Template + Quality Status.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { PEDAGOGICAL_TEMPLATES, templateToBlueprint } from '../core/guided-flow/pedagogical-templates';
import { validateAiMpiJson } from '../core/ai-mpi-json';
import { checkBlueprintContentQuality } from '../core/content-quality-guard';
import { TemplatePickerDialog } from '../editor/TemplatePickerDialog';
import { useEditorStore } from '../store/editor-store';
import { createSamplePpknProject } from '../core/sample-project';

// ---------------------------------------------------------------------------
// SCOPE A — Schema Sync (no more makeSceneAny / unsafe cast needed)
// ---------------------------------------------------------------------------

describe('TEMPLATE-PEDAGOGIS-READY-02 — Scope A: Schema Sync', () => {
  it('1. no makeSceneAny in pedagogical-templates source', () => {
    const source = readFileSync(resolve(__dirname, '../core/guided-flow/pedagogical-templates.ts'), 'utf-8');
    expect(source).not.toContain('makeSceneAny');
    expect(source).not.toContain('as unknown as AiBlueprintSlotContent');
  });

  it('2. AiBlueprintSlotContent schema includes all content kinds', () => {
    const source = readFileSync(resolve(__dirname, '../core/ai-mpi-json/schema.ts'), 'utf-8');
    const requiredKinds = [
      'curriculum-guide', 'objectives-path', 'starter-review', 'discussion-scene',
      'case-analysis', 'result-summary', 'reflection-journal', 'hotspot-map',
      'matching-game', 'sequencing-game', 'media-focus', 'diagnostic-check',
      'remedial-practice', 'enrichment-challenge', 'worksheet-activity',
      'rubric-panel', 'timeline-story', 'branching-scenario', 'glossary-cards',
      'teacher-guide', 'accessibility-help',
    ];
    requiredKinds.forEach((kind) => {
      expect(source, `${kind} should be in schema`).toContain(`kind: '${kind}'`);
    });
  });

  it('3. all 3 templates still produce valid blueprints after schema sync', () => {
    PEDAGOGICAL_TEMPLATES.forEach((template) => {
      const bp = templateToBlueprint(template);
      const errors = validateAiMpiJson(bp);
      expect(errors, `${template.id}: ${errors.map((e) => e.message).join('; ')}`).toHaveLength(0);
    });
  });
});

// ---------------------------------------------------------------------------
// SCOPE B — Template Picker UI
// ---------------------------------------------------------------------------

describe('TEMPLATE-PEDAGOGIS-READY-02 — Scope B: Template Picker UI', () => {
  beforeEach(() => {
    useEditorStore.setState({ project: createSamplePpknProject(), selectedComponentId: null });
  });

  it('4. UI displays 3 template cards', () => {
    const { container } = render(<TemplatePickerDialog onClose={() => {}} />);
    const cards = container.querySelectorAll('[data-testid^="template-card-"]');
    expect(cards.length).toBe(3);
  });

  it('5. filter by mapel works', () => {
    const { container } = render(<TemplatePickerDialog onClose={() => {}} />);
    // Initially all 3
    expect(container.querySelectorAll('[data-testid^="template-card-"]')).toHaveLength(3);
    // Click PPKn filter
    fireEvent.click(container.querySelector('[data-testid="filter-PPKn"]')!);
    expect(container.querySelectorAll('[data-testid^="template-card-"]')).toHaveLength(1);
    // Click all filter
    fireEvent.click(container.querySelector('[data-testid="filter-all"]')!);
    expect(container.querySelectorAll('[data-testid^="template-card-"]')).toHaveLength(3);
  });

  it('6. template card shows name, mapel, topic, scene count', () => {
    const { container } = render(<TemplatePickerDialog onClose={() => {}} />);
    const firstCard = container.querySelector('[data-testid^="template-card-"]')!;
    expect(firstCard.textContent).toContain('PPKn');
    expect(firstCard.textContent).toContain('Macam-Macam Norma');
    // PPKn template now has 17 scenes (12 golden + 5 teacher-pedagogy)
    expect(firstCard.textContent).toContain('17 Scene');
  });

  it('7. quality status badges appear', () => {
    const { container } = render(<TemplatePickerDialog onClose={() => {}} />);
    const status = container.querySelector('[data-testid^="template-status-"]');
    expect(status?.textContent).toContain('Valid');
    expect(status?.textContent).toContain('Quality');
    expect(status?.textContent).toContain('Cover');
    expect(status?.textContent).toContain('Closing');
  });
});

// ---------------------------------------------------------------------------
// SCOPE C — Apply Template to Editor
// ---------------------------------------------------------------------------

describe('TEMPLATE-PEDAGOGIS-READY-02 — Scope C: Apply Template', () => {
  beforeEach(() => {
    // PATCH A: use empty project so overwrite confirm doesn't block
    useEditorStore.setState({
      project: {
        ...createSamplePpknProject(),
        pages: [{
          id: 'empty', title: 'New', role: 'cover', layoutId: 'blank',
          background: { type: 'color', color: '#fff' }, components: [],
        }],
        currentPageId: 'empty',
      },
      selectedComponentId: null,
    });
  });

  it('8. click Gunakan Template creates project with matching scene count in store', () => {
    const { container } = render(<TemplatePickerDialog onClose={() => {}} />);
    const applyBtn = container.querySelector('[data-testid="template-apply-tpl-ppkn-norma"]') as HTMLElement;
    fireEvent.click(applyBtn);
    const project = useEditorStore.getState().project;
    // PPKn template has 17 scenes (12 golden + 5 teacher-pedagogy)
    expect(project.pages).toHaveLength(17);
  });

  it('9. all pages have sceneType after apply', () => {
    const { container } = render(<TemplatePickerDialog onClose={() => {}} />);
    fireEvent.click(container.querySelector('[data-testid="template-apply-tpl-ppkn-norma"]')!);
    const project = useEditorStore.getState().project;
    project.pages.forEach((page) => {
      expect(page.sceneType, `page ${page.id} should have sceneType`).toBeDefined();
    });
  });

  it('10. current page is cover after apply', () => {
    const { container } = render(<TemplatePickerDialog onClose={() => {}} />);
    fireEvent.click(container.querySelector('[data-testid="template-apply-tpl-ppkn-norma"]')!);
    const project = useEditorStore.getState().project;
    const currentPage = project.pages.find((p) => p.id === project.currentPageId);
    expect(currentPage?.role).toBe('cover');
    expect(currentPage?.sceneType).toBe('cover-hero');
  });

  it('11. content quality passes after apply', () => {
    const template = PEDAGOGICAL_TEMPLATES[0];
    const bp = templateToBlueprint(template);
    const result = checkBlueprintContentQuality(bp);
    expect(result.errors).toHaveLength(0);
  });

  it('12. validator passes after apply', () => {
    const template = PEDAGOGICAL_TEMPLATES[0];
    const bp = templateToBlueprint(template);
    const errors = validateAiMpiJson(bp);
    expect(errors).toHaveLength(0);
  });

  it('13. does not use legacy-only generator as primary path', () => {
    // Verify TemplatePickerDialog uses templateToBlueprint, not generateMpiFromTopic
    const source = readFileSync(resolve(__dirname, '../editor/TemplatePickerDialog.tsx'), 'utf-8');
    expect(source).toContain('templateToBlueprint');
    expect(source).toContain('aiBlueprintToSimpleProject');
    expect(source).not.toContain('generateMpiFromTopic');
  });
});
