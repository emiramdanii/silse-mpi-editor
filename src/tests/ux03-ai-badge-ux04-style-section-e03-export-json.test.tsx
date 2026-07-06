/**
 * UX-03: AI Style Badge + UX-04: AI Style Section + E-03: Export JSON.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

import { useEditorStore } from '../store/editor-store';
import { createSamplePpknProject } from '../core/sample-project';
import { templateToBlueprint, TEMPLATE_PPKN_NORMA } from '../core/guided-flow/pedagogical-templates';
import { aiBlueprintToSimpleProject } from '../core/ai-mpi-json/aiBlueprintToSimpleProject';

// ---------------------------------------------------------------------------
// UX-03: AI Style Badge
// ---------------------------------------------------------------------------

describe('UX-03: AI Style Badge', () => {
  beforeEach(() => {
    useEditorStore.setState({ project: createSamplePpknProject() });
  });

  it('1. Topbar does NOT show AI badge when project has no AI overrides', async () => {
    const { Topbar } = await import('../editor/Topbar');
    const { container } = render(React.createElement(Topbar));
    expect(container.querySelector('[data-testid="ai-style-badge"]')).toBeNull();
  });

  it('2. Topbar shows AI badge when project has hasAiStyleOverrides=true', async () => {
    const project = { ...createSamplePpknProject(), hasAiStyleOverrides: true };
    useEditorStore.setState({ project });
    const { Topbar } = await import('../editor/Topbar');
    const { container } = render(React.createElement(Topbar));
    const badge = container.querySelector('[data-testid="ai-style-badge"]');
    expect(badge).not.toBeNull();
    expect(badge?.textContent).toContain('AI Style');
  });

  it('3. aiBlueprintToSimpleProject sets hasAiStyleOverrides when blueprint has overrides', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    bp.designSystem = {
      ...bp.designSystem,
      overrides: { 'colors.primary': '#8b5cf6' },
    };
    const project = aiBlueprintToSimpleProject(bp);
    expect(project.hasAiStyleOverrides).toBe(true);
  });

  it('4. aiBlueprintToSimpleProject does NOT set hasAiStyleOverrides when no overrides', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    // Remove overrides
    bp.designSystem = { contractId: 'modern-clean', paletteName: 'default', typographyName: 'default' };
    const project = aiBlueprintToSimpleProject(bp);
    expect(project.hasAiStyleOverrides).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// UX-04: Inspector AI Style Section
// ---------------------------------------------------------------------------

describe('UX-04: Inspector AI Style Section', () => {
  beforeEach(() => {
    useEditorStore.setState({ project: createSamplePpknProject() });
  });

  it('5. VisualSection does NOT show AI style section when no overrides', async () => {
    const { VisualSection } = await import('../editor/VisualSection');
    const { container } = render(React.createElement(VisualSection));
    expect(container.querySelector('[data-testid="ai-style-section"]')).toBeNull();
  });

  it('6. VisualSection shows AI style section when hasAiStyleOverrides=true', async () => {
    const project = { ...createSamplePpknProject(), hasAiStyleOverrides: true };
    useEditorStore.setState({ project });
    const { VisualSection } = await import('../editor/VisualSection');
    const { container } = render(React.createElement(VisualSection));
    const section = container.querySelector('[data-testid="ai-style-section"]');
    expect(section).not.toBeNull();
    expect(section?.textContent).toContain('Style dari AI');
  });

  it('7. AI style section contains helpful text about replacing style', async () => {
    const project = { ...createSamplePpknProject(), hasAiStyleOverrides: true };
    useEditorStore.setState({ project });
    const { VisualSection } = await import('../editor/VisualSection');
    const { container } = render(React.createElement(VisualSection));
    const section = container.querySelector('[data-testid="ai-style-section"]');
    expect(section?.textContent).toContain('Pilih style pack');
  });
});

// ---------------------------------------------------------------------------
// E-03: Export JSON
// ---------------------------------------------------------------------------

describe('E-03: Export JSON button', () => {
  beforeEach(() => {
    useEditorStore.setState({ project: createSamplePpknProject() });
  });

  it('8. Topbar renders Export JSON button', async () => {
    const { Topbar } = await import('../editor/Topbar');
    const { container } = render(React.createElement(Topbar));
    const btn = container.querySelector('[data-testid="topbar-export-json"]');
    expect(btn).not.toBeNull();
  });

  it('9. Export JSON button text contains "Export JSON"', async () => {
    const { Topbar } = await import('../editor/Topbar');
    const { container } = render(React.createElement(Topbar));
    const btn = container.querySelector('[data-testid="topbar-export-json"]');
    expect(btn?.textContent).toContain('Export JSON');
  });

  it('10. Export JSON button has data-action="export-json"', async () => {
    const { Topbar } = await import('../editor/Topbar');
    const { container } = render(React.createElement(Topbar));
    const btn = container.querySelector('[data-testid="topbar-export-json"]');
    expect(btn?.getAttribute('data-action')).toBe('export-json');
  });
});
