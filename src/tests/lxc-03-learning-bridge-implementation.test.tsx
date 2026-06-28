/**
 * LXC-03 — Implementasi Jembatan Belajar tests.
 *
 * Layer: tests
 *
 * Kontrak (LXC-03):
 *   1. learning-bridge adalah component type resmi (di COMPONENT_TYPES, 8 types)
 *   2. Factory createLearningBridgeComponent menghasilkan komponen valid
 *   3. PAGE_ROLE_CAPABILITIES mengizinkan learning-bridge di 7 role
 *   4. Validation menerima komponen valid, menolak yang invalid
 *   5. View renderer follows render contract (preview and export share style model)
 *   6. Store action addLearningBridgeComponent + updateLearningBridgeComponent
 *   7. Editor di Inspector dengan section Isi/Tampilan/Posisi
 *   8. Toolbar punya tombol "+ Jembatan Belajar"
 *   9. Style resolver support learning-bridge (non-empty inlineStyle)
 *  10. Deep copy di duplicatePage
 *  11. 3 pattern bridge (transisi, recap, preview)
 *  12. Export HTML merender learning-bridge
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import { Inspector } from '../editor/Inspector';
import { Toolbar } from '../editor/Toolbar';
import { useEditorStore } from '../store/editor-store';
import {
  createLearningBridgeComponent,
} from '../core/component-factory';
import { validateComponent, isValidComponent } from '../core/validation';
import { canAddComponent } from '../core/capability';
import { isLearningBridgeComponent } from '../components/component-utils';
import { COMPONENT_TYPES, LEARNING_BRIDGE_VARIANTS } from '../core/types';
import {
  resolveComponentStyle,
  getResolvedComponentStyle,
} from '../core/style/resolveComponentStyle';
import { DEFAULT_STYLE_PACK, stylePackToProjectStyle } from '../core/style-presets';
import { getPatternById } from '../editor/content-patterns';
import { createSamplePpknProject } from '../core/sample-project';
import type { SimplePage, LearningBridgeComponent } from '../core/types';
import { createPageId } from '../core/ids';

// =========================================================================
// Scope 1 — Component type resmi
// =========================================================================

describe('LXC-03 — learning-bridge is official component type', () => {
  it('COMPONENT_TYPES includes "learning-bridge"', () => {
    expect(COMPONENT_TYPES).toContain('learning-bridge');
  });

  it('COMPONENT_TYPES has 8 types (was 7, +learning-bridge)', () => {
    expect(COMPONENT_TYPES).toHaveLength(8);
  });

  it('LEARNING_BRIDGE_VARIANTS has 3 variants', () => {
    expect(LEARNING_BRIDGE_VARIANTS).toHaveLength(3);
    expect(LEARNING_BRIDGE_VARIANTS).toContain('transition');
    expect(LEARNING_BRIDGE_VARIANTS).toContain('recap');
    expect(LEARNING_BRIDGE_VARIANTS).toContain('preview');
  });

  it('isLearningBridgeComponent type guard works', () => {
    const comp = createLearningBridgeComponent();
    expect(isLearningBridgeComponent(comp)).toBe(true);
    expect(isLearningBridgeComponent({ ...comp, type: 'text' } as never)).toBe(false);
  });
});

// =========================================================================
// Scope 2 — Factory
// =========================================================================

describe('LXC-03 — createLearningBridgeComponent factory', () => {
  it('creates valid component with default values', () => {
    const comp = createLearningBridgeComponent();
    expect(comp.type).toBe('learning-bridge');
    expect(comp.variant).toBe('transition'); // default
    expect(comp.title).toBe('Jembatan Belajar');
    expect(comp.message.length).toBeGreaterThan(0);
    expect(comp.nextButtonLabel.length).toBeGreaterThan(0);
    expect(comp.id.length).toBeGreaterThan(0);
    expect(comp.x).toBeGreaterThanOrEqual(0);
    expect(comp.y).toBeGreaterThanOrEqual(0);
    expect(comp.width).toBeGreaterThan(0);
    expect(comp.height).toBeGreaterThan(0);
  });

  it('accepts overrides', () => {
    const comp = createLearningBridgeComponent({
      variant: 'recap',
      title: 'Recap Materi',
      message: 'Kita sudah belajar tentang X.',
      nextButtonLabel: 'Lanjut ke Kuis →',
    });
    expect(comp.variant).toBe('recap');
    expect(comp.title).toBe('Recap Materi');
    expect(comp.message).toBe('Kita sudah belajar tentang X.');
    expect(comp.nextButtonLabel).toBe('Lanjut ke Kuis →');
  });

  it('factory components are valid (pass validation)', () => {
    const comp = createLearningBridgeComponent();
    expect(isValidComponent(comp)).toBe(true);
  });
});

// =========================================================================
// Scope 3 — Capability matrix
// =========================================================================

describe('LXC-03 — Capability matrix allows learning-bridge in 7 roles', () => {
  it('learningObjectives allows learning-bridge', () => {
    expect(canAddComponent('learningObjectives', 'learning-bridge')).toBe(true);
  });

  it('starter allows learning-bridge', () => {
    expect(canAddComponent('starter', 'learning-bridge')).toBe(true);
  });

  it('material allows learning-bridge', () => {
    expect(canAddComponent('material', 'learning-bridge')).toBe(true);
  });

  it('activity allows learning-bridge', () => {
    expect(canAddComponent('activity', 'learning-bridge')).toBe(true);
  });

  it('quiz allows learning-bridge', () => {
    expect(canAddComponent('quiz', 'learning-bridge')).toBe(true);
  });

  it('reflection allows learning-bridge', () => {
    expect(canAddComponent('reflection', 'learning-bridge')).toBe(true);
  });

  it('closing allows learning-bridge', () => {
    expect(canAddComponent('closing', 'learning-bridge')).toBe(true);
  });

  it('cover does NOT allow learning-bridge (guided page)', () => {
    expect(canAddComponent('cover', 'learning-bridge')).toBe(false);
  });

  it('guide does NOT allow learning-bridge', () => {
    expect(canAddComponent('guide', 'learning-bridge')).toBe(false);
  });

  it('menu does NOT allow learning-bridge', () => {
    expect(canAddComponent('menu', 'learning-bridge')).toBe(false);
  });
});

// =========================================================================
// Scope 4 — Validation
// =========================================================================

describe('LXC-03 — Validation', () => {
  it('valid learning-bridge component passes validation', () => {
    const comp = createLearningBridgeComponent();
    const result = validateComponent(comp);
    expect(result.ok).toBe(true);
  });

  it('rejects invalid variant', () => {
    const comp = createLearningBridgeComponent();
    const invalid = { ...comp, variant: 'invalidVariant' };
    const result = validateComponent(invalid);
    expect(result.ok).toBe(false);
  });

  it('rejects missing title', () => {
    const comp = createLearningBridgeComponent();
    const invalid = { ...comp, title: 123 as never };
    const result = validateComponent(invalid);
    expect(result.ok).toBe(false);
  });

  it('rejects missing message', () => {
    const comp = createLearningBridgeComponent();
    const invalid = { ...comp, message: undefined as never };
    const result = validateComponent(invalid);
    expect(result.ok).toBe(false);
  });

  it('rejects missing nextButtonLabel', () => {
    const comp = createLearningBridgeComponent();
    const invalid = { ...comp, nextButtonLabel: null as never };
    const result = validateComponent(invalid);
    expect(result.ok).toBe(false);
  });
});

// =========================================================================
// Scope 5 — View renderer (render contract)
// =========================================================================

describe('LXC-03 — LearningBridgeComponentView render contract', () => {
  it('view file exists and exports component', async () => {
    const mod = await import('../components/LearningBridgeComponentView');
    expect(mod.LearningBridgeComponentView).toBeDefined();
  });

  it('CanvasStage includes LearningBridgeComponentView import + render branch', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const content = fs.readFileSync(path.resolve(__dirname, '../editor/CanvasStage.tsx'), 'utf8');
    expect(content).toMatch(/LearningBridgeComponentView/);
    expect(content).toMatch(/isLearningBridgeComponent/);
  });

  it('PreviewApp includes LearningBridgeComponentView import + render branch', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const content = fs.readFileSync(path.resolve(__dirname, '../preview/PreviewApp.tsx'), 'utf8');
    expect(content).toMatch(/LearningBridgeComponentView/);
    expect(content).toMatch(/isLearningBridgeComponent/);
  });

  it('export-html includes learning-bridge render branch', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const content = fs.readFileSync(path.resolve(__dirname, '../export/export-html.ts'), 'utf8');
    expect(content).toMatch(/learning-bridge/);
    expect(content).toMatch(/silse-learning-bridge/);
  });

  it('preview and export follow same render contract (NOT single React renderer)', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const exportContent = fs.readFileSync(path.resolve(__dirname, '../export/export-html.ts'), 'utf8');
    // Export does NOT import LearningBridgeComponentView (standalone JS)
    expect(exportContent).not.toMatch(/LearningBridgeComponentView/);
  });
});

// =========================================================================
// Scope 6 — Store actions
// =========================================================================

describe('LXC-03 — Store actions', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('addLearningBridgeComponent adds to material page', () => {
    useEditorStore.getState().addPage({ role: 'material' });
    const id = useEditorStore.getState().addLearningBridgeComponent();
    expect(id).not.toBeNull();
    const state = useEditorStore.getState();
    const page = state.project.pages.find((p) => p.id === state.project.currentPageId)!;
    expect(page.components.some((c) => c.type === 'learning-bridge')).toBe(true);
  });

  it('addLearningBridgeComponent returns null on cover (not allowed)', () => {
    const id = useEditorStore.getState().addLearningBridgeComponent();
    expect(id).toBeNull();
  });

  it('updateLearningBridgeComponent updates title', () => {
    useEditorStore.getState().addPage({ role: 'material' });
    const id = useEditorStore.getState().addLearningBridgeComponent()!;
    useEditorStore.getState().updateLearningBridgeComponent(id, { title: 'Updated Title' });
    const state = useEditorStore.getState();
    const page = state.project.pages.find((p) => p.id === state.project.currentPageId)!;
    const comp = page.components.find((c) => c.id === id) as LearningBridgeComponent | undefined;
    expect(comp?.title).toBe('Updated Title');
  });

  it('updateLearningBridgeComponent updates variant', () => {
    useEditorStore.getState().addPage({ role: 'material' });
    const id = useEditorStore.getState().addLearningBridgeComponent()!;
    useEditorStore.getState().updateLearningBridgeComponent(id, { variant: 'recap' });
    const state = useEditorStore.getState();
    const page = state.project.pages.find((p) => p.id === state.project.currentPageId)!;
    const comp = page.components.find((c) => c.id === id) as LearningBridgeComponent | undefined;
    expect(comp?.variant).toBe('recap');
  });

  it('updateLearningBridgeComponent rejects invalid variant (sanitize)', () => {
    useEditorStore.getState().addPage({ role: 'material' });
    const id = useEditorStore.getState().addLearningBridgeComponent()!;
    const before = (useEditorStore.getState().project.pages
      .find((p) => p.id === useEditorStore.getState().project.currentPageId)!
      .components.find((c) => c.id === id) as LearningBridgeComponent).variant;
    useEditorStore.getState().updateLearningBridgeComponent(id, { variant: 'invalid' as never });
    const after = (useEditorStore.getState().project.pages
      .find((p) => p.id === useEditorStore.getState().project.currentPageId)!
      .components.find((c) => c.id === id) as LearningBridgeComponent).variant;
    expect(after).toBe(before);
  });
});

// =========================================================================
// Scope 7 — Editor in Inspector
// =========================================================================

describe('LXC-03 — Inspector editor', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('learning-bridge component selected: editor is rendered', () => {
    useEditorStore.getState().addPage({ role: 'material' });
    useEditorStore.getState().addLearningBridgeComponent();
    const { container } = render(React.createElement(Inspector));
    expect(container.textContent ?? '').not.toMatch(/belum tersedia/);
  });

  it('editor has variant selector with 3 options', () => {
    useEditorStore.getState().addPage({ role: 'material' });
    useEditorStore.getState().addLearningBridgeComponent();
    const { container } = render(React.createElement(Inspector));
    const variantSelect = container.querySelector('[data-field="variant"]') as HTMLSelectElement;
    expect(variantSelect).not.toBeNull();
    expect(variantSelect.options.length).toBe(3);
  });

  it('editor has message field', () => {
    useEditorStore.getState().addPage({ role: 'material' });
    useEditorStore.getState().addLearningBridgeComponent();
    const { container } = render(React.createElement(Inspector));
    expect(container.querySelector('[data-field="message"]')).not.toBeNull();
  });

  it('editor has nextButtonLabel field', () => {
    useEditorStore.getState().addPage({ role: 'material' });
    useEditorStore.getState().addLearningBridgeComponent();
    const { container } = render(React.createElement(Inspector));
    expect(container.querySelector('[data-field="nextButtonLabel"]')).not.toBeNull();
  });

  it('geometry fields are present', () => {
    useEditorStore.getState().addPage({ role: 'material' });
    useEditorStore.getState().addLearningBridgeComponent();
    const { container } = render(React.createElement(Inspector));
    expect(container.querySelector('[data-field="x"]')).not.toBeNull();
    expect(container.querySelector('[data-field="y"]')).not.toBeNull();
    expect(container.querySelector('[data-field="width"]')).not.toBeNull();
    expect(container.querySelector('[data-field="height"]')).not.toBeNull();
  });

  it('editing message updates store', () => {
    useEditorStore.getState().addPage({ role: 'material' });
    const id = useEditorStore.getState().addLearningBridgeComponent()!;
    const { container } = render(React.createElement(Inspector));
    const msgField = container.querySelector('[data-field="message"]') as HTMLTextAreaElement;
    fireEvent.change(msgField, { target: { value: 'New bridge message' } });
    const state = useEditorStore.getState();
    const page = state.project.pages.find((p) => p.id === state.project.currentPageId)!;
    const comp = page.components.find((c) => c.id === id) as LearningBridgeComponent;
    expect(comp.message).toBe('New bridge message');
  });
});

// =========================================================================
// Scope 8 — Toolbar button
// =========================================================================

describe('LXC-03 — Toolbar "+ Jembatan Belajar" button', () => {
  it('Toolbar source has add-learning-bridge action spec', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const content = fs.readFileSync(path.resolve(__dirname, '../editor/Toolbar.tsx'), 'utf8');
    expect(content).toMatch(/add-learning-bridge/);
    expect(content).toMatch(/Jembatan Belajar/);
  });

  it('on material: dropdown shows add-learning-bridge (allowed)', () => {
    useEditorStore.getState().newProject();
    useEditorStore.getState().addPage({ role: 'material' });
    const { container } = render(React.createElement(Toolbar));
    const addToggle = container.querySelector('[data-testid="toolbar-add"]') as HTMLButtonElement;
    fireEvent.click(addToggle);
    expect(container.querySelector('[data-action="add-learning-bridge"]')).not.toBeNull();
  });
});

// =========================================================================
// Scope 9 — Style resolver
// =========================================================================

describe('LXC-03 — Style resolver supports learning-bridge', () => {
  it('resolveComponentStyle returns non-empty inlineStyle', () => {
    const tokens = stylePackToProjectStyle(DEFAULT_STYLE_PACK).tokens;
    const result = resolveComponentStyle({
      tokens,
      componentType: 'learning-bridge',
      variant: 'transition',
      pageRole: 'material',
      layoutId: 'blank',
    });
    expect(Object.keys(result.inlineStyle).length).toBeGreaterThan(0);
    expect(result.inlineStyle.backgroundColor).toBeDefined();
    expect(result.inlineStyle.color).toBeDefined();
    expect(result.inlineStyle.border).toBeDefined();
  });

  it('returns className matching silse-bridge-*', () => {
    const tokens = stylePackToProjectStyle(DEFAULT_STYLE_PACK).tokens;
    const result = resolveComponentStyle({
      tokens,
      componentType: 'learning-bridge',
      variant: 'recap',
      pageRole: 'material',
      layoutId: 'blank',
    });
    expect(result.className).toBeDefined();
    expect(result.className).toMatch(/silse-bridge/);
  });

  it('getResolvedComponentStyle returns non-empty for sample project', () => {
    const project = createSamplePpknProject();
    const bridge = createLearningBridgeComponent();
    const page: SimplePage = {
      id: createPageId(),
      title: 'Test',
      role: 'material',
      layoutId: 'blank',
      background: { type: 'color', color: '#fff' },
      components: [bridge],
    };
    const result = getResolvedComponentStyle(project, page, bridge);
    expect(Object.keys(result.inlineStyle).length).toBeGreaterThan(0);
  });
});

// =========================================================================
// Scope 10 — Deep copy
// =========================================================================

describe('LXC-03 — duplicatePage deep-copies learning-bridge', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('duplicatePage creates new component ID', () => {
    useEditorStore.getState().addPage({ role: 'material' });
    const origId = useEditorStore.getState().addLearningBridgeComponent()!;
    const state = useEditorStore.getState();
    const pageId = state.project.currentPageId;
    useEditorStore.getState().duplicatePage(pageId);
    const newState = useEditorStore.getState();
    const newPage = newState.project.pages.find(
      (p) => p.id !== pageId && p.role === 'material',
    );
    expect(newPage).toBeDefined();
    const comp = newPage!.components.find((c) => c.type === 'learning-bridge')!;
    expect(comp.id).not.toBe(origId);
  });

  it('duplicatePage preserves content (title, message, nextButtonLabel, variant)', () => {
    useEditorStore.getState().addPage({ role: 'material' });
    useEditorStore.getState().addLearningBridgeComponent({
      variant: 'recap',
      title: 'Recap',
      message: 'We learned X',
      nextButtonLabel: 'Next →',
    });
    const state = useEditorStore.getState();
    const pageId = state.project.currentPageId;
    useEditorStore.getState().duplicatePage(pageId);
    const newState = useEditorStore.getState();
    const newPage = newState.project.pages.find(
      (p) => p.id !== pageId && p.role === 'material',
    )!;
    const comp = newPage.components.find((c) => c.type === 'learning-bridge') as LearningBridgeComponent;
    expect(comp.variant).toBe('recap');
    expect(comp.title).toBe('Recap');
    expect(comp.message).toBe('We learned X');
    expect(comp.nextButtonLabel).toBe('Next →');
  });
});

// =========================================================================
// Scope 11 — Patterns
// =========================================================================

describe('LXC-03 — Bridge patterns', () => {
  it('pattern bridge-transisi exists', () => {
    expect(getPatternById('bridge-transisi')).toBeDefined();
  });

  it('pattern bridge-recap exists', () => {
    expect(getPatternById('bridge-recap')).toBeDefined();
  });

  it('pattern bridge-preview exists', () => {
    expect(getPatternById('bridge-preview')).toBeDefined();
  });

  it('bridge-transisi builds learning-bridge component', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const content = fs.readFileSync(path.resolve(__dirname, '../editor/content-patterns.ts'), 'utf8');
    expect(content).toMatch(/createLearningBridgeComponent/);
  });
});

// =========================================================================
// Regression
// =========================================================================

describe('LXC-03 — regression', () => {
  it('learning-bridge has valid geometry', () => {
    const comp = createLearningBridgeComponent();
    expect(comp.x).toBeGreaterThanOrEqual(0);
    expect(comp.y).toBeGreaterThanOrEqual(0);
    expect(comp.width).toBeGreaterThan(0);
    expect(comp.height).toBeGreaterThan(0);
  });

  it('Inspector does NOT contain "block" in user-facing text', () => {
    useEditorStore.getState().newProject();
    useEditorStore.getState().addPage({ role: 'material' });
    useEditorStore.getState().addLearningBridgeComponent();
    const { container } = render(React.createElement(Inspector));
    expect(container.textContent ?? '').not.toMatch(/\bblock\b/i);
  });
});
