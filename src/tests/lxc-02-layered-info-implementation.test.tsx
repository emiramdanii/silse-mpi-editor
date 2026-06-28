/**
 * LXC-02 — Implementasi Info Berlapis tests.
 *
 * Layer: tests
 *
 * Kontrak (LXC-02):
 *   1. layered-info adalah component type resmi (di COMPONENT_TYPES)
 *   2. Factory createLayeredInfoComponent menghasilkan komponen valid
 *   3. PAGE_ROLE_CAPABILITIES mengizinkan layered-info di 4 role
 *   4. Validation menerima komponen valid, menolak yang invalid
 *   5. View renderer shared (preview = export)
 *   6. Store action addLayeredInfoComponent + updateLayeredInfoComponent
 *   7. Editor di Inspector hanya edit layer aktif (tidak semua sekaligus)
 *   8. Pattern "Tujuan Lengkap Berlapis" pakai layered-info
 *   9. Toolbar punya tombol "+ Info Berlapis"
 *  10. Export HTML merender layered-info dengan benar
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import { Inspector } from '../editor/Inspector';
import { Toolbar } from '../editor/Toolbar';
import { useEditorStore } from '../store/editor-store';
import {
  createLayeredInfoComponent,
  createLayeredInfoLayer,
} from '../core/component-factory';
import { validateComponent, isValidComponent } from '../core/validation';
import { canAddComponent, PAGE_ROLE_CAPABILITIES } from '../core/capability';
import { isLayeredInfoComponent } from '../components/component-utils';
import { COMPONENT_TYPES, LAYERED_INFO_VARIANTS } from '../core/types';
import { getPatternById, getPatternsForRole } from '../editor/content-patterns';
import { computePageStatus } from '../editor/mpi-page-status';
import { createProject } from '../core/project-factory';
import type { SimplePage, LayeredInfoComponent } from '../core/types';
import { createPageId } from '../core/ids';

// =========================================================================
// Scope 1 — Component type resmi
// =========================================================================

describe('LXC-02 — layered-info is official component type', () => {
  it('COMPONENT_TYPES includes "layered-info"', () => {
    expect(COMPONENT_TYPES).toContain('layered-info');
  });

  it('LAYERED_INFO_VARIANTS has 6 variants', () => {
    expect(LAYERED_INFO_VARIANTS).toHaveLength(6);
    expect(LAYERED_INFO_VARIANTS).toContain('accordion');
    expect(LAYERED_INFO_VARIANTS).toContain('tabs');
    expect(LAYERED_INFO_VARIANTS).toContain('iconTabs');
    expect(LAYERED_INFO_VARIANTS).toContain('stepper');
    expect(LAYERED_INFO_VARIANTS).toContain('cardGrid');
    expect(LAYERED_INFO_VARIANTS).toContain('timeline');
  });

  it('isLayeredInfoComponent type guard works', () => {
    const comp = createLayeredInfoComponent();
    expect(isLayeredInfoComponent(comp)).toBe(true);
    expect(isLayeredInfoComponent({ ...comp, type: 'text' } as never)).toBe(false);
  });
});

// =========================================================================
// Scope 2 — Factory
// =========================================================================

describe('LXC-02 — createLayeredInfoComponent factory', () => {
  it('creates valid component with default values', () => {
    const comp = createLayeredInfoComponent();
    expect(comp.type).toBe('layered-info');
    expect(comp.variant).toBe('accordion'); // default
    expect(comp.title).toBe('Info Berlapis');
    expect(comp.layers).toHaveLength(3); // default 3 layers
    expect(comp.defaultOpenIndex).toBe(0);
    expect(comp.id.length).toBeGreaterThan(0);
    // Geometry
    expect(comp.x).toBeGreaterThanOrEqual(0);
    expect(comp.y).toBeGreaterThanOrEqual(0);
    expect(comp.width).toBeGreaterThan(0);
    expect(comp.height).toBeGreaterThan(0);
  });

  it('default layers are Sebelumnya / Hari Ini / Berikutnya', () => {
    const comp = createLayeredInfoComponent();
    expect(comp.layers[0].title).toBe('Sebelumnya');
    expect(comp.layers[1].title).toBe('Hari Ini');
    expect(comp.layers[2].title).toBe('Berikutnya');
  });

  it('accepts overrides', () => {
    const customLayer = createLayeredInfoLayer({ title: 'Custom', body: 'Custom body', icon: '🎯' });
    const comp = createLayeredInfoComponent({
      variant: 'tabs',
      title: 'My Layered Info',
      layers: [customLayer],
      defaultOpenIndex: null,
    });
    expect(comp.variant).toBe('tabs');
    expect(comp.title).toBe('My Layered Info');
    expect(comp.layers).toHaveLength(1);
    expect(comp.layers[0].title).toBe('Custom');
    expect(comp.layers[0].icon).toBe('🎯');
    expect(comp.defaultOpenIndex).toBeNull();
  });

  it('createLayeredInfoLayer produces layer with fresh ID', () => {
    const l1 = createLayeredInfoLayer();
    const l2 = createLayeredInfoLayer();
    expect(l1.id).not.toBe(l2.id);
  });

  it('factory components are valid (pass validation)', () => {
    const comp = createLayeredInfoComponent();
    expect(isValidComponent(comp)).toBe(true);
  });
});

// =========================================================================
// Scope 3 — Capability matrix
// =========================================================================

describe('LXC-02 — Capability matrix allows layered-info', () => {
  it('learningObjectives allows layered-info', () => {
    expect(canAddComponent('learningObjectives', 'layered-info')).toBe(true);
    expect(PAGE_ROLE_CAPABILITIES.learningObjectives.allowedComponents).toContain('layered-info');
  });

  it('material allows layered-info', () => {
    expect(canAddComponent('material', 'layered-info')).toBe(true);
  });

  it('guide allows layered-info', () => {
    expect(canAddComponent('guide', 'layered-info')).toBe(true);
  });

  it('menu allows layered-info', () => {
    expect(canAddComponent('menu', 'layered-info')).toBe(true);
  });

  it('cover does NOT allow layered-info (guided page)', () => {
    expect(canAddComponent('cover', 'layered-info')).toBe(false);
  });

  it('starter does NOT allow layered-info', () => {
    expect(canAddComponent('starter', 'layered-info')).toBe(false);
  });

  it('activity does NOT allow layered-info', () => {
    expect(canAddComponent('activity', 'layered-info')).toBe(false);
  });

  it('quiz does NOT allow layered-info', () => {
    expect(canAddComponent('quiz', 'layered-info')).toBe(false);
  });

  it('reflection does NOT allow layered-info', () => {
    expect(canAddComponent('reflection', 'layered-info')).toBe(false);
  });

  it('closing does NOT allow layered-info', () => {
    expect(canAddComponent('closing', 'layered-info')).toBe(false);
  });
});

// =========================================================================
// Scope 4 — Validation
// =========================================================================

describe('LXC-02 — Validation', () => {
  it('valid layered-info component passes validation', () => {
    const comp = createLayeredInfoComponent();
    const result = validateComponent(comp);
    expect(result.ok).toBe(true);
  });

  it('rejects invalid variant', () => {
    const comp = createLayeredInfoComponent();
    const invalid = { ...comp, variant: 'invalidVariant' };
    const result = validateComponent(invalid);
    expect(result.ok).toBe(false);
  });

  it('rejects missing title (must be string)', () => {
    const comp = createLayeredInfoComponent();
    const invalid = { ...comp, title: 123 as never };
    const result = validateComponent(invalid);
    expect(result.ok).toBe(false);
  });

  it('rejects layers as non-array', () => {
    const comp = createLayeredInfoComponent();
    const invalid = { ...comp, layers: 'not-an-array' as never };
    const result = validateComponent(invalid);
    expect(result.ok).toBe(false);
  });

  it('rejects layer with missing id', () => {
    const comp = createLayeredInfoComponent();
    const invalid = {
      ...comp,
      layers: [{ title: 'Test', body: 'Body' }], // no id
    };
    const result = validateComponent(invalid);
    expect(result.ok).toBe(false);
  });

  it('rejects defaultOpenIndex out of bounds', () => {
    const comp = createLayeredInfoComponent();
    const invalid = { ...comp, defaultOpenIndex: 99 };
    const result = validateComponent(invalid);
    expect(result.ok).toBe(false);
  });

  it('accepts defaultOpenIndex = null', () => {
    const comp = createLayeredInfoComponent({ defaultOpenIndex: null });
    const result = validateComponent(comp);
    expect(result.ok).toBe(true);
  });

  it('accepts empty layers array', () => {
    const comp = createLayeredInfoComponent({ layers: [] });
    const result = validateComponent(comp);
    expect(result.ok).toBe(true);
  });

  it('accepts optional icon field on layers', () => {
    const comp = createLayeredInfoComponent({
      layers: [
        createLayeredInfoLayer({ title: 'T', body: 'B', icon: '🎯' }),
      ],
    });
    const result = validateComponent(comp);
    expect(result.ok).toBe(true);
  });
});

// =========================================================================
// Scope 5 — View renderer (shared preview = export)
// =========================================================================

describe('LXC-02 — LayeredInfoComponentView shared renderer', () => {
  it('view file exists and exports component', async () => {
    const mod = await import('../components/LayeredInfoComponentView');
    expect(mod.LayeredInfoComponentView).toBeDefined();
    expect(typeof mod.LayeredInfoComponentView).toBe('function');
  });

  it('CanvasStage includes LayeredInfoComponentView import + render branch', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const content = fs.readFileSync(path.resolve(__dirname, '../editor/CanvasStage.tsx'), 'utf8');
    expect(content).toMatch(/LayeredInfoComponentView/);
    expect(content).toMatch(/isLayeredInfoComponent/);
  });

  it('PreviewApp includes LayeredInfoComponentView import + render branch', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const content = fs.readFileSync(path.resolve(__dirname, '../preview/PreviewApp.tsx'), 'utf8');
    expect(content).toMatch(/LayeredInfoComponentView/);
    expect(content).toMatch(/isLayeredInfoComponent/);
  });

  it('export-html includes layered-info render branch', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const content = fs.readFileSync(path.resolve(__dirname, '../export/export-html.ts'), 'utf8');
    expect(content).toMatch(/layered-info/);
    expect(content).toMatch(/layeredInfoStates/);
  });

  it('preview = export (single renderer, not two)', () => {
    // Verify the same LayeredInfoComponentView is used in both CanvasStage and PreviewApp
    const fs = require('node:fs');
    const path = require('node:path');
    const canvasContent = fs.readFileSync(path.resolve(__dirname, '../editor/CanvasStage.tsx'), 'utf8');
    const previewContent = fs.readFileSync(path.resolve(__dirname, '../preview/PreviewApp.tsx'), 'utf8');
    // Both should import from the same path
    expect(canvasContent).toMatch(/from '\.\.\/components\/LayeredInfoComponentView'/);
    expect(previewContent).toMatch(/from '\.\.\/components\/LayeredInfoComponentView'/);
  });
});

// =========================================================================
// Scope 6 — Store actions
// =========================================================================

describe('LXC-02 — Store actions', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('addLayeredInfoComponent adds to learningObjectives page', () => {
    useEditorStore.getState().addPage({ role: 'learningObjectives' });
    const id = useEditorStore.getState().addLayeredInfoComponent();
    expect(id).not.toBeNull();
    const state = useEditorStore.getState();
    const page = state.project.pages.find((p) => p.id === state.project.currentPageId)!;
    expect(page.components.some((c) => c.type === 'layered-info')).toBe(true);
  });

  it('addLayeredInfoComponent returns null on cover (not allowed)', () => {
    // Cover is guided — can't add
    const id = useEditorStore.getState().addLayeredInfoComponent();
    expect(id).toBeNull();
  });

  it('updateLayeredInfoComponent updates title', () => {
    useEditorStore.getState().addPage({ role: 'material' });
    const id = useEditorStore.getState().addLayeredInfoComponent()!;
    useEditorStore.getState().updateLayeredInfoComponent(id, { title: 'Updated Title' });
    const state = useEditorStore.getState();
    const page = state.project.pages.find((p) => p.id === state.project.currentPageId)!;
    const comp = page.components.find((c) => c.id === id) as LayeredInfoComponent | undefined;
    expect(comp?.title).toBe('Updated Title');
  });

  it('updateLayeredInfoComponent updates variant', () => {
    useEditorStore.getState().addPage({ role: 'material' });
    const id = useEditorStore.getState().addLayeredInfoComponent()!;
    useEditorStore.getState().updateLayeredInfoComponent(id, { variant: 'tabs' });
    const state = useEditorStore.getState();
    const page = state.project.pages.find((p) => p.id === state.project.currentPageId)!;
    const comp = page.components.find((c) => c.id === id) as LayeredInfoComponent | undefined;
    expect(comp?.variant).toBe('tabs');
  });

  it('updateLayeredInfoComponent rejects invalid variant (sanitize)', () => {
    useEditorStore.getState().addPage({ role: 'material' });
    const id = useEditorStore.getState().addLayeredInfoComponent()!;
    const beforeVariant = (useEditorStore.getState().project.pages
      .find((p) => p.id === useEditorStore.getState().project.currentPageId)!
      .components.find((c) => c.id === id) as LayeredInfoComponent).variant;
    // Try to set invalid variant — should be ignored by sanitize
    useEditorStore.getState().updateLayeredInfoComponent(id, { variant: 'invalidVariant' as never });
    const afterVariant = (useEditorStore.getState().project.pages
      .find((p) => p.id === useEditorStore.getState().project.currentPageId)!
      .components.find((c) => c.id === id) as LayeredInfoComponent).variant;
    expect(afterVariant).toBe(beforeVariant); // unchanged
  });

  it('updateLayeredInfoComponent updates layers array', () => {
    useEditorStore.getState().addPage({ role: 'material' });
    const id = useEditorStore.getState().addLayeredInfoComponent()!;
    const newLayers = [
      createLayeredInfoLayer({ title: 'New Layer', body: 'New body' }),
    ];
    useEditorStore.getState().updateLayeredInfoComponent(id, { layers: newLayers });
    const state = useEditorStore.getState();
    const page = state.project.pages.find((p) => p.id === state.project.currentPageId)!;
    const comp = page.components.find((c) => c.id === id) as LayeredInfoComponent | undefined;
    expect(comp?.layers).toHaveLength(1);
    expect(comp?.layers[0].title).toBe('New Layer');
  });
});

// =========================================================================
// Scope 7 — Editor in Inspector (edit active layer only)
// =========================================================================

describe('LXC-02 — Inspector editor (edit active layer only)', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('layered-info component selected: editor is rendered (not "belum tersedia")', () => {
    useEditorStore.getState().addPage({ role: 'learningObjectives' });
    useEditorStore.getState().addLayeredInfoComponent();
    const { container } = render(React.createElement(Inspector));
    const editor = container.querySelector('[data-testid="component-editor-layered-info"]');
    expect(editor).not.toBeNull();
    expect(container.textContent ?? '').not.toMatch(/belum tersedia/);
  });

  it('editor has sections: Isi, Tampilan, Lapisan, Edit Lapisan, Lapisan Terbuka Default, Posisi & Ukuran', () => {
    useEditorStore.getState().addPage({ role: 'learningObjectives' });
    useEditorStore.getState().addLayeredInfoComponent();
    const { container } = render(React.createElement(Inspector));
    const text = container.textContent ?? '';
    expect(text).toMatch(/Isi/);
    expect(text).toMatch(/Tampilan/);
    expect(text).toMatch(/Lapisan/);
    expect(text).toMatch(/Edit Lapisan/);
    expect(text).toMatch(/Lapisan Terbuka Default/);
    expect(text).toMatch(/Posisi & Ukuran/);
  });

  it('editor shows layer list with all layer titles', () => {
    useEditorStore.getState().addPage({ role: 'learningObjectives' });
    useEditorStore.getState().addLayeredInfoComponent();
    const { container } = render(React.createElement(Inspector));
    const layersList = container.querySelector('[data-testid="layered-info-layers"]');
    expect(layersList).not.toBeNull();
    // Default 3 layers: Sebelumnya, Hari Ini, Berikutnya
    expect(layersList?.textContent).toMatch(/Sebelumnya/);
    expect(layersList?.textContent).toMatch(/Hari Ini/);
    expect(layersList?.textContent).toMatch(/Berikutnya/);
  });

  it('editor edits ONLY the active layer (not all layers at once)', () => {
    useEditorStore.getState().addPage({ role: 'learningObjectives' });
    useEditorStore.getState().addLayeredInfoComponent();
    const { container } = render(React.createElement(Inspector));
    // Only ONE layer body textarea should be visible at a time
    // (the active layer's body editor)
    const bodyFields = container.querySelectorAll('[data-testid^="layered-info-layer-body-"]');
    expect(bodyFields.length).toBe(1);
  });

  it('clicking a layer in the list changes the active layer', () => {
    useEditorStore.getState().addPage({ role: 'learningObjectives' });
    useEditorStore.getState().addLayeredInfoComponent();
    const { container } = render(React.createElement(Inspector));
    // Click layer 2 (index 1) — "Hari Ini"
    const layer2 = container.querySelector('[data-testid="layered-info-layer-1"]') as HTMLElement;
    expect(layer2).not.toBeNull();
    fireEvent.click(layer2);
    // Now the body editor should be for layer index 1
    const bodyField = container.querySelector('[data-testid="layered-info-layer-body-1"]') as HTMLTextAreaElement;
    expect(bodyField).not.toBeNull();
  });

  it('+ Tambah Lapisan button adds a new layer', () => {
    useEditorStore.getState().addPage({ role: 'learningObjectives' });
    const id = useEditorStore.getState().addLayeredInfoComponent()!;
    const { container } = render(React.createElement(Inspector));
    const addBtn = container.querySelector('[data-testid="layered-info-add-layer"]') as HTMLButtonElement;
    expect(addBtn).not.toBeNull();
    fireEvent.click(addBtn);
    const state = useEditorStore.getState();
    const page = state.project.pages.find((p) => p.id === state.project.currentPageId)!;
    const comp = page.components.find((c) => c.id === id) as LayeredInfoComponent;
    expect(comp.layers).toHaveLength(4); // was 3, now 4
  });

  it('layer remove button deletes a layer (min 1)', () => {
    useEditorStore.getState().addPage({ role: 'learningObjectives' });
    const id = useEditorStore.getState().addLayeredInfoComponent()!;
    const { container } = render(React.createElement(Inspector));
    const removeBtn = container.querySelector('[data-testid="layered-info-layer-remove-0"]') as HTMLButtonElement;
    expect(removeBtn).not.toBeNull();
    fireEvent.click(removeBtn);
    const state = useEditorStore.getState();
    const page = state.project.pages.find((p) => p.id === state.project.currentPageId)!;
    const comp = page.components.find((c) => c.id === id) as LayeredInfoComponent;
    expect(comp.layers).toHaveLength(2); // was 3, now 2
  });

  it('variant selector has 6 options', () => {
    useEditorStore.getState().addPage({ role: 'learningObjectives' });
    useEditorStore.getState().addLayeredInfoComponent();
    const { container } = render(React.createElement(Inspector));
    const variantSelect = container.querySelector('[data-field="variant"]') as HTMLSelectElement;
    expect(variantSelect).not.toBeNull();
    expect(variantSelect.options.length).toBe(6);
  });

  it('editing active layer body updates the store', () => {
    useEditorStore.getState().addPage({ role: 'learningObjectives' });
    const id = useEditorStore.getState().addLayeredInfoComponent()!;
    const { container } = render(React.createElement(Inspector));
    // Active layer is index 0 (Sebelumnya) by default
    const bodyField = container.querySelector('[data-testid="layered-info-layer-body-0"]') as HTMLTextAreaElement;
    expect(bodyField).not.toBeNull();
    fireEvent.change(bodyField, { target: { value: 'Updated body content' } });
    const state = useEditorStore.getState();
    const page = state.project.pages.find((p) => p.id === state.project.currentPageId)!;
    const comp = page.components.find((c) => c.id === id) as LayeredInfoComponent;
    expect(comp.layers[0].body).toBe('Updated body content');
  });

  it('geometry fields (x/y/width/height) are present', () => {
    useEditorStore.getState().addPage({ role: 'learningObjectives' });
    useEditorStore.getState().addLayeredInfoComponent();
    const { container } = render(React.createElement(Inspector));
    expect(container.querySelector('[data-field="x"]')).not.toBeNull();
    expect(container.querySelector('[data-field="y"]')).not.toBeNull();
    expect(container.querySelector('[data-field="width"]')).not.toBeNull();
    expect(container.querySelector('[data-field="height"]')).not.toBeNull();
  });

  it('iconTabs variant shows icon field for active layer', () => {
    useEditorStore.getState().addPage({ role: 'learningObjectives' });
    useEditorStore.getState().addLayeredInfoComponent({ variant: 'iconTabs' });
    const { container } = render(React.createElement(Inspector));
    const iconField = container.querySelector('[data-field="layer-icon-0"]');
    expect(iconField).not.toBeNull();
  });

  it('accordion variant does NOT show icon field', () => {
    useEditorStore.getState().addPage({ role: 'learningObjectives' });
    useEditorStore.getState().addLayeredInfoComponent({ variant: 'accordion' });
    const { container } = render(React.createElement(Inspector));
    const iconField = container.querySelector('[data-field="layer-icon-0"]');
    expect(iconField).toBeNull();
  });
});

// =========================================================================
// Scope 8 — Pattern "Tujuan Lengkap Berlapis"
// =========================================================================

describe('LXC-02 — Pattern "Tujuan Lengkap Berlapis"', () => {
  it('pattern "tujuan-berlapis" exists', () => {
    const pattern = getPatternById('tujuan-berlapis');
    expect(pattern).toBeDefined();
    expect(pattern?.name).toMatch(/Tujuan Lengkap Berlapis/);
  });

  it('pattern applicable to learningObjectives', () => {
    const patterns = getPatternsForRole('learningObjectives');
    const ids = patterns.map((p) => p.id);
    expect(ids).toContain('tujuan-berlapis');
  });

  it('pattern builds layered-info + navigation components', () => {
    const project = createProject();
    const page: SimplePage = {
      id: createPageId(),
      title: 'Tujuan',
      role: 'learningObjectives',
      layoutId: 'blank',
      background: { type: 'color', color: '#fff' },
      components: [],
    };
    const proj = { ...project, currentPageId: page.id, pages: [page] };
    const pattern = getPatternById('tujuan-berlapis')!;
    const components = pattern.buildComponents({ project: proj, page });
    expect(components.length).toBe(2); // layered-info + navigation
    expect(components[0].type).toBe('layered-info');
    expect(components[1].type).toBe('navigation');
  });

  it('pattern layered-info has 3 layers (Sebelumnya / Hari Ini / Berikutnya)', () => {
    const project = createProject();
    const page: SimplePage = {
      id: createPageId(),
      title: 'Tujuan',
      role: 'learningObjectives',
      layoutId: 'blank',
      background: { type: 'color', color: '#fff' },
      components: [],
    };
    const proj = { ...project, currentPageId: page.id, pages: [page] };
    const pattern = getPatternById('tujuan-berlapis')!;
    const components = pattern.buildComponents({ project: proj, page });
    const layeredInfo = components[0] as LayeredInfoComponent;
    expect(layeredInfo.layers).toHaveLength(3);
    expect(layeredInfo.layers[0].title).toBe('Sebelumnya');
    expect(layeredInfo.layers[1].title).toBe('Hari Ini');
    expect(layeredInfo.layers[2].title).toBe('Berikutnya');
  });

  it('pattern reads curriculum.objectives for "Hari Ini" layer body', () => {
    const project = createProject();
    project.curriculum = {
      subject: 'PPKn',
      grade: '7',
      phase: 'D',
      topic: 'Norma',
      objectives: [
        { id: 'obj-1', text: 'Pahami norma agama' },
        { id: 'obj-2', text: 'Pahami norma hukum' },
      ],
    };
    const page: SimplePage = {
      id: createPageId(),
      title: 'Tujuan',
      role: 'learningObjectives',
      layoutId: 'blank',
      background: { type: 'color', color: '#fff' },
      components: [],
    };
    const proj = { ...project, currentPageId: page.id, pages: [page] };
    const pattern = getPatternById('tujuan-berlapis')!;
    const components = pattern.buildComponents({ project: proj, page });
    const layeredInfo = components[0] as LayeredInfoComponent;
    const hariIniBody = layeredInfo.layers[1].body;
    expect(hariIniBody).toMatch(/Pahami norma agama/);
    expect(hariIniBody).toMatch(/Pahami norma hukum/);
  });

  it('pattern uses accordion variant by default', () => {
    const project = createProject();
    const page: SimplePage = {
      id: createPageId(),
      title: 'Tujuan',
      role: 'learningObjectives',
      layoutId: 'blank',
      background: { type: 'color', color: '#fff' },
      components: [],
    };
    const proj = { ...project, currentPageId: page.id, pages: [page] };
    const pattern = getPatternById('tujuan-berlapis')!;
    const components = pattern.buildComponents({ project: proj, page });
    const layeredInfo = components[0] as LayeredInfoComponent;
    expect(layeredInfo.variant).toBe('accordion');
  });

  it('pattern defaultOpenIndex = 1 (Hari Ini terbuka by default)', () => {
    const project = createProject();
    const page: SimplePage = {
      id: createPageId(),
      title: 'Tujuan',
      role: 'learningObjectives',
      layoutId: 'blank',
      background: { type: 'color', color: '#fff' },
      components: [],
    };
    const proj = { ...project, currentPageId: page.id, pages: [page] };
    const pattern = getPatternById('tujuan-berlapis')!;
    const components = pattern.buildComponents({ project: proj, page });
    const layeredInfo = components[0] as LayeredInfoComponent;
    expect(layeredInfo.defaultOpenIndex).toBe(1);
  });
});

// =========================================================================
// Scope 9 — Toolbar "+ Info Berlapis" button
// =========================================================================

describe('LXC-02 — Toolbar "+ Info Berlapis" button', () => {
  it('Toolbar source has add-layered-info action spec', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const content = fs.readFileSync(path.resolve(__dirname, '../editor/Toolbar.tsx'), 'utf8');
    expect(content).toMatch(/add-layered-info/);
    expect(content).toMatch(/Info Berlapis/);
    expect(content).toMatch(/capability: 'layered-info'/);
  });

  it('on learningObjectives: dropdown shows add-layered-info (allowed)', () => {
    useEditorStore.getState().newProject();
    useEditorStore.getState().addPage({ role: 'learningObjectives' });
    
    const { container } = render(React.createElement(Toolbar));
    const addToggle = container.querySelector('[data-testid="toolbar-add"]') as HTMLButtonElement;
    fireEvent.click(addToggle);
    expect(container.querySelector('[data-action="add-layered-info"]')).not.toBeNull();
  });

  it('on cover: dropdown does NOT show add-layered-info (not allowed)', () => {
    useEditorStore.getState().newProject(); // cover
    
    const { container } = render(React.createElement(Toolbar));
    // Cover is guided — toggle is disabled, dropdown won't open
    const addToggle = container.querySelector('[data-testid="toolbar-add"]') as HTMLButtonElement;
    expect(addToggle.disabled).toBe(true);
  });

  it('on starter: dropdown does NOT show add-layered-info (not allowed)', () => {
    useEditorStore.getState().newProject();
    useEditorStore.getState().addPage({ role: 'starter' });
    
    const { container } = render(React.createElement(Toolbar));
    const addToggle = container.querySelector('[data-testid="toolbar-add"]') as HTMLButtonElement;
    fireEvent.click(addToggle);
    expect(container.querySelector('[data-action="add-layered-info"]')).toBeNull();
  });
});

// =========================================================================
// Scope 10 — mpi-page-status recognizes layered-info as content
// =========================================================================

describe('LXC-02 — mpi-page-status recognizes layered-info', () => {
  it('learningObjectives with only layered-info → ok (not error)', () => {
    const page: SimplePage = {
      id: createPageId(),
      title: 'Tujuan',
      role: 'learningObjectives',
      layoutId: 'blank',
      background: { type: 'color', color: '#fff' },
      components: [createLayeredInfoComponent()],
    };
    const status = computePageStatus(page);
    // Should NOT have error about "belum punya teks"
    expect(status.issues.some((i) => i.message.match(/belum punya teks/i))).toBe(false);
  });

  it('material with only layered-info → has content (no error about missing content)', () => {
    const layeredInfo = createLayeredInfoComponent();
    const page: SimplePage = {
      id: createPageId(),
      title: 'Materi',
      role: 'material',
      layoutId: 'blank',
      background: { type: 'color', color: '#fff' },
      components: [layeredInfo],
    };
    const status = computePageStatus(page);
    // Should NOT have error about "belum punya konten"
    expect(status.issues.some((i) => i.message.match(/belum punya konten/i))).toBe(false);
    // But should still warn about missing navigation (dead-end)
    expect(status.issues.some((i) => i.message.match(/navigasi/i))).toBe(true);
  });
});

// =========================================================================
// Regression
// =========================================================================

describe('LXC-02 — regression', () => {
  it('layered-info component has valid geometry (x/y/width/height > 0)', () => {
    const comp = createLayeredInfoComponent();
    expect(comp.x).toBeGreaterThanOrEqual(0);
    expect(comp.y).toBeGreaterThanOrEqual(0);
    expect(comp.width).toBeGreaterThan(0);
    expect(comp.height).toBeGreaterThan(0);
  });

  it('Inspector does NOT contain "block" in user-facing text', () => {
    useEditorStore.getState().newProject();
    useEditorStore.getState().addPage({ role: 'learningObjectives' });
    useEditorStore.getState().addLayeredInfoComponent();
    const { container } = render(React.createElement(Inspector));
    expect(container.textContent ?? '').not.toMatch(/\bblock\b/i);
  });

  it('layered-info can be applied via PatternLibraryPanel (tujuan-berlapis)', () => {
    useEditorStore.getState().newProject();
    useEditorStore.getState().addPage({ role: 'learningObjectives' });
    const pageId = useEditorStore.getState().project.currentPageId;
    const { container } = render(React.createElement(Inspector));
    const applyBtn = container.querySelector('[data-testid="pattern-apply-tujuan-berlapis"]') as HTMLButtonElement;
    expect(applyBtn).not.toBeNull();
    fireEvent.click(applyBtn);
    const page = useEditorStore.getState().project.pages.find((p) => p.id === pageId)!;
    expect(page.components.some((c) => c.type === 'layered-info')).toBe(true);
  });
});
