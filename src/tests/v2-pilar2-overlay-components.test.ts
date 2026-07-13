/**
 * V2-PILAR-2 Commit 1: Tests for HotspotOverlay + InputField components.
 *
 * Coverage:
 *   1. Type creation via factory (createHotspotOverlayComponent, createInputFieldComponent,
 *      createHotspotPoint)
 *   2. Default values + override behavior
 *   3. Capability matrix (allow hotspot-overlay + input-field on role 'free',
 *      deny on cover/material/quiz/etc.)
 *   4. Store methods (addHotspotOverlayComponent, addInputFieldComponent,
 *      updateHotspotOverlayComponent, updateInputFieldComponent)
 *   5. Deep-copy pada duplicatePage (regenerate hotspot IDs)
 *   6. PageComponent union accepts new types
 *   7. COMPONENT_TYPES includes new types
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createHotspotOverlayComponent,
  createHotspotPoint,
  createInputFieldComponent,
  DEFAULT_INPUT_FIELD_COMPONENT,
} from '../core/component-factory';
import {
  canAddComponent,
  getCapability,
  PAGE_ROLE_CAPABILITIES,
} from '../core/capability';
import {
  COMPONENT_TYPES,
  HOTSPOT_OVERLAY_VARIANTS,
  INPUT_FIELD_VARIANTS,
  type HotspotOverlayComponent,
  type InputFieldComponent,
  type HotspotPoint,
} from '../core/types';
import { useEditorStore } from '../store/editor-store';

// ---------------------------------------------------------------------------
// 1. createHotspotPoint — factory
// ---------------------------------------------------------------------------

describe('V2-PILAR-2 — createHotspotPoint', () => {
  it('1. creates hotspot with default values', () => {
    const h = createHotspotPoint();
    expect(h.id).toBeTruthy();
    expect(h.x).toBe(50);
    expect(h.y).toBe(50);
    expect(h.label).toBe('Titik Baru');
    expect(h.info).toBe('Tulis info yang muncul saat titik ini diklik.');
  });

  it('2. creates hotspot with overrides', () => {
    const h = createHotspotPoint({ x: 25, y: 75, label: 'Pulau Jawa', info: 'Pulau terpadat' });
    expect(h.x).toBe(25);
    expect(h.y).toBe(75);
    expect(h.label).toBe('Pulau Jawa');
    expect(h.info).toBe('Pulau terpadat');
  });

  it('3. generates unique IDs for each hotspot', () => {
    const h1 = createHotspotPoint();
    const h2 = createHotspotPoint();
    expect(h1.id).not.toBe(h2.id);
  });
});

// ---------------------------------------------------------------------------
// 2. createHotspotOverlayComponent — factory
// ---------------------------------------------------------------------------

describe('V2-PILAR-2 — createHotspotOverlayComponent', () => {
  it('4. creates component with default variant', () => {
    const c = createHotspotOverlayComponent();
    expect(c.type).toBe('hotspot-overlay');
    expect(c.variant).toBe('default');
    expect(HOTSPOT_OVERLAY_VARIANTS).toContain(c.variant);
  });

  it('5. default geometry is full slide (1280x720)', () => {
    const c = createHotspotOverlayComponent();
    expect(c.x).toBe(0);
    expect(c.y).toBe(0);
    expect(c.width).toBe(1280);
    expect(c.height).toBe(720);
  });

  it('6. default has 2 example hotspots', () => {
    const c = createHotspotOverlayComponent();
    expect(c.hotspots).toHaveLength(2);
    expect(c.hotspots[0].x).toBe(30);
    expect(c.hotspots[0].y).toBe(40);
    expect(c.hotspots[1].x).toBe(70);
    expect(c.hotspots[1].y).toBe(60);
  });

  it('7. defaultOpenIndex is null (semua tertutup)', () => {
    const c = createHotspotOverlayComponent();
    expect(c.defaultOpenIndex).toBeNull();
  });

  it('8. accepts overrides for hotspots', () => {
    const customHotspots: HotspotPoint[] = [
      createHotspotPoint({ x: 10, y: 20, label: 'A', info: 'Info A' }),
      createHotspotPoint({ x: 90, y: 80, label: 'B', info: 'Info B' }),
      createHotspotPoint({ x: 50, y: 50, label: 'C', info: 'Info C' }),
    ];
    const c = createHotspotOverlayComponent({ hotspots: customHotspots });
    expect(c.hotspots).toHaveLength(3);
    expect(c.hotspots[0].label).toBe('A');
    expect(c.hotspots[2].label).toBe('C');
  });

  it('9. accepts overrides for defaultOpenIndex', () => {
    const c = createHotspotOverlayComponent({ defaultOpenIndex: 0 });
    expect(c.defaultOpenIndex).toBe(0);
  });

  it('10. accepts overrides for geometry', () => {
    const c = createHotspotOverlayComponent({ x: 100, y: 200, width: 800, height: 400 });
    expect(c.x).toBe(100);
    expect(c.y).toBe(200);
    expect(c.width).toBe(800);
    expect(c.height).toBe(400);
  });

  it('11. generates unique component IDs', () => {
    const c1 = createHotspotOverlayComponent();
    const c2 = createHotspotOverlayComponent();
    expect(c1.id).not.toBe(c2.id);
  });

  it('12. has truthy id', () => {
    const c = createHotspotOverlayComponent();
    expect(c.id).toBeTruthy();
    expect(typeof c.id).toBe('string');
    expect(c.id.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 3. createInputFieldComponent — factory
// ---------------------------------------------------------------------------

describe('V2-PILAR-2 — createInputFieldComponent', () => {
  it('13. creates component with default variant shortAnswer', () => {
    const c = createInputFieldComponent();
    expect(c.type).toBe('input-field');
    expect(c.variant).toBe('shortAnswer');
    expect(INPUT_FIELD_VARIANTS).toContain(c.variant);
  });

  it('14. default label and placeholder', () => {
    const c = createInputFieldComponent();
    expect(c.label).toBe('Jawaban Anda');
    expect(c.placeholder).toBe('Tulis jawaban di sini…');
  });

  it('15. default has no correctAnswer (free input)', () => {
    const c = createInputFieldComponent();
    expect(c.correctAnswer).toBeUndefined();
    expect(c.feedbackCorrect).toBeUndefined();
    expect(c.feedbackWrong).toBeUndefined();
  });

  it('16. default points is 0', () => {
    const c = createInputFieldComponent();
    expect(c.points).toBe(0);
  });

  it('17. default geometry', () => {
    const c = createInputFieldComponent();
    expect(c.x).toBe(DEFAULT_INPUT_FIELD_COMPONENT.x);
    expect(c.y).toBe(DEFAULT_INPUT_FIELD_COMPONENT.y);
    expect(c.width).toBe(DEFAULT_INPUT_FIELD_COMPONENT.width);
    expect(c.height).toBe(DEFAULT_INPUT_FIELD_COMPONENT.height);
  });

  it('18. accepts overrides for variant longAnswer', () => {
    const c = createInputFieldComponent({ variant: 'longAnswer' });
    expect(c.variant).toBe('longAnswer');
  });

  it('19. accepts overrides for variant numericInput', () => {
    const c = createInputFieldComponent({ variant: 'numericInput' });
    expect(c.variant).toBe('numericInput');
  });

  it('20. accepts overrides for correctAnswer + feedback', () => {
    const c = createInputFieldComponent({
      correctAnswer: 'Jakarta',
      feedbackCorrect: 'Benar! Jakarta ibu kota Indonesia.',
      feedbackWrong: 'Belum tepat. Coba lihat peta lagi.',
      points: 10,
    });
    expect(c.correctAnswer).toBe('Jakarta');
    expect(c.feedbackCorrect).toContain('Benar');
    expect(c.feedbackWrong).toContain('Belum tepat');
    expect(c.points).toBe(10);
  });

  it('21. generates unique component IDs', () => {
    const c1 = createInputFieldComponent();
    const c2 = createInputFieldComponent();
    expect(c1.id).not.toBe(c2.id);
  });
});

// ---------------------------------------------------------------------------
// 4. Capability matrix
// ---------------------------------------------------------------------------

describe('V2-PILAR-2 — Capability matrix', () => {
  it('22. role "free" allows hotspot-overlay', () => {
    expect(canAddComponent('free', 'hotspot-overlay')).toBe(true);
  });

  it('23. role "free" allows input-field', () => {
    expect(canAddComponent('free', 'input-field')).toBe(true);
  });

  it('24. role "cover" denies hotspot-overlay (guided page)', () => {
    expect(canAddComponent('cover', 'hotspot-overlay')).toBe(false);
  });

  it('25. role "cover" denies input-field', () => {
    expect(canAddComponent('cover', 'input-field')).toBe(false);
  });

  it('26. role "material" denies hotspot-overlay (not in allowed list)', () => {
    expect(canAddComponent('material', 'hotspot-overlay')).toBe(false);
  });

  it('27. role "material" denies input-field', () => {
    expect(canAddComponent('material', 'input-field')).toBe(false);
  });

  it('28. role "quiz" denies hotspot-overlay', () => {
    expect(canAddComponent('quiz', 'hotspot-overlay')).toBe(false);
  });

  it('29. role "quiz" denies input-field', () => {
    expect(canAddComponent('quiz', 'input-field')).toBe(false);
  });

  it('30. role "free" allowedComponents includes both new types', () => {
    const cap = getCapability('free');
    expect(cap.allowedComponents).toContain('hotspot-overlay');
    expect(cap.allowedComponents).toContain('input-field');
  });

  it('31. PAGE_ROLE_CAPABILITIES.free has 8 allowed component types', () => {
    expect(PAGE_ROLE_CAPABILITIES.free.allowedComponents).toHaveLength(8);
  });
});

// ---------------------------------------------------------------------------
// 5. COMPONENT_TYPES + PageComponent union
// ---------------------------------------------------------------------------

describe('V2-PILAR-2 — COMPONENT_TYPES + union', () => {
  it('32. COMPONENT_TYPES includes hotspot-overlay', () => {
    expect(COMPONENT_TYPES).toContain('hotspot-overlay');
  });

  it('33. COMPONENT_TYPES includes input-field', () => {
    expect(COMPONENT_TYPES).toContain('input-field');
  });

  it('34. COMPONENT_TYPES has 10 entries (8 existing + 2 new)', () => {
    expect(COMPONENT_TYPES).toHaveLength(10);
  });

  it('35. HotspotOverlayComponent type has required fields', () => {
    const c: HotspotOverlayComponent = createHotspotOverlayComponent();
    // Type-level test: compile-time only. If this compiles, type is correct.
    expect(c.type).toBe('hotspot-overlay');
    expect(c.variant).toBe('default');
    expect(Array.isArray(c.hotspots)).toBe(true);
    expect(c.defaultOpenIndex === null || typeof c.defaultOpenIndex === 'number').toBe(true);
  });

  it('36. InputFieldComponent type has required fields', () => {
    const c: InputFieldComponent = createInputFieldComponent();
    expect(c.type).toBe('input-field');
    expect(['shortAnswer', 'longAnswer', 'numericInput']).toContain(c.variant);
    expect(typeof c.label).toBe('string');
    expect(typeof c.placeholder).toBe('string');
    expect(typeof c.points).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// 6. Store methods — addHotspotOverlayComponent + addInputFieldComponent
// ---------------------------------------------------------------------------

describe('V2-PILAR-2 — Store add methods', () => {
  beforeEach(() => {
    useEditorStore.getState().resetProject();
    // Add a 'free' page so we can add components
    useEditorStore.getState().addPage({ role: 'free', title: 'Test Slide' });
  });

  it('37. store exposes addHotspotOverlayComponent as a function', () => {
    expect(typeof useEditorStore.getState().addHotspotOverlayComponent).toBe('function');
  });

  it('38. store exposes addInputFieldComponent as a function', () => {
    expect(typeof useEditorStore.getState().addInputFieldComponent).toBe('function');
  });

  it('39. addHotspotOverlayComponent on free page returns component id', () => {
    const id = useEditorStore.getState().addHotspotOverlayComponent();
    expect(id).not.toBeNull();
    expect(typeof id).toBe('string');
  });

  it('40. addInputFieldComponent on free page returns component id', () => {
    const id = useEditorStore.getState().addInputFieldComponent();
    expect(id).not.toBeNull();
    expect(typeof id).toBe('string');
  });

  it('41. addHotspotOverlayComponent adds component to current page', () => {
    const store = useEditorStore.getState();
    const beforeCount = store.project.pages.find((p) => p.id === store.project.currentPageId)?.components.length ?? 0;
    store.addHotspotOverlayComponent();
    const after = useEditorStore.getState().project;
    const page = after.pages.find((p) => p.id === after.currentPageId)!;
    expect(page.components).toHaveLength(beforeCount + 1);
    expect(page.components.some((c) => c.type === 'hotspot-overlay')).toBe(true);
  });

  it('42. addInputFieldComponent adds component to current page', () => {
    const store = useEditorStore.getState();
    const beforeCount = store.project.pages.find((p) => p.id === store.project.currentPageId)?.components.length ?? 0;
    store.addInputFieldComponent();
    const after = useEditorStore.getState().project;
    const page = after.pages.find((p) => p.id === after.currentPageId)!;
    expect(page.components).toHaveLength(beforeCount + 1);
    expect(page.components.some((c) => c.type === 'input-field')).toBe(true);
  });

  it('43. addHotspotOverlayComponent on cover returns null (capability denied)', () => {
    const store = useEditorStore.getState();
    // Switch to cover page (default page 0 is cover)
    store.selectPage(store.project.pages[0].id);
    const id = store.addHotspotOverlayComponent();
    expect(id).toBeNull();
  });

  it('44. addInputFieldComponent on cover returns null (capability denied)', () => {
    const store = useEditorStore.getState();
    store.selectPage(store.project.pages[0].id);
    const id = store.addInputFieldComponent();
    expect(id).toBeNull();
  });

  it('45. addHotspotOverlayComponent selects the new component', () => {
    const id = useEditorStore.getState().addHotspotOverlayComponent();
    expect(useEditorStore.getState().selectedComponentId).toBe(id);
  });

  it('46. addInputFieldComponent selects the new component', () => {
    const id = useEditorStore.getState().addInputFieldComponent();
    expect(useEditorStore.getState().selectedComponentId).toBe(id);
  });

  it('47. addHotspotOverlayComponent accepts overrides', () => {
    const id = useEditorStore.getState().addHotspotOverlayComponent({
      defaultOpenIndex: 0,
      x: 50,
      y: 50,
      width: 1000,
      height: 500,
    });
    const after = useEditorStore.getState().project;
    const comp = after.pages.find((p) => p.id === after.currentPageId)!.components.find((c) => c.id === id) as HotspotOverlayComponent;
    expect(comp.defaultOpenIndex).toBe(0);
    expect(comp.x).toBe(50);
    expect(comp.width).toBe(1000);
  });

  it('48. addInputFieldComponent accepts overrides', () => {
    const id = useEditorStore.getState().addInputFieldComponent({
      label: 'Apa ibu kota Indonesia?',
      placeholder: 'Ketik jawaban...',
      correctAnswer: 'Jakarta',
      points: 10,
    });
    const after = useEditorStore.getState().project;
    const comp = after.pages.find((p) => p.id === after.currentPageId)!.components.find((c) => c.id === id) as InputFieldComponent;
    expect(comp.label).toBe('Apa ibu kota Indonesia?');
    expect(comp.correctAnswer).toBe('Jakarta');
    expect(comp.points).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// 7. Store methods — updateHotspotOverlayComponent + updateInputFieldComponent
// ---------------------------------------------------------------------------

describe('V2-PILAR-2 — Store update methods', () => {
  beforeEach(() => {
    useEditorStore.getState().resetProject();
    useEditorStore.getState().addPage({ role: 'free', title: 'Test Slide' });
  });

  it('49. store exposes updateHotspotOverlayComponent as a function', () => {
    expect(typeof useEditorStore.getState().updateHotspotOverlayComponent).toBe('function');
  });

  it('50. store exposes updateInputFieldComponent as a function', () => {
    expect(typeof useEditorStore.getState().updateInputFieldComponent).toBe('function');
  });

  it('51. updateHotspotOverlayComponent updates hotspots array', () => {
    const store = useEditorStore.getState();
    const id = store.addHotspotOverlayComponent();
    const newHotspots = [
      createHotspotPoint({ x: 10, y: 10, label: 'A', info: 'A' }),
      createHotspotPoint({ x: 90, y: 90, label: 'B', info: 'B' }),
    ];
    store.updateHotspotOverlayComponent(id!, { hotspots: newHotspots });
    const after = useEditorStore.getState().project;
    const comp = after.pages.find((p) => p.id === after.currentPageId)!.components.find((c) => c.id === id) as HotspotOverlayComponent;
    expect(comp.hotspots).toHaveLength(2);
    expect(comp.hotspots[0].label).toBe('A');
    expect(comp.hotspots[1].label).toBe('B');
  });

  it('52. updateHotspotOverlayComponent updates defaultOpenIndex', () => {
    const store = useEditorStore.getState();
    const id = store.addHotspotOverlayComponent();
    store.updateHotspotOverlayComponent(id!, { defaultOpenIndex: 1 });
    const after = useEditorStore.getState().project;
    const comp = after.pages.find((p) => p.id === after.currentPageId)!.components.find((c) => c.id === id) as HotspotOverlayComponent;
    expect(comp.defaultOpenIndex).toBe(1);
  });

  it('53. updateInputFieldComponent updates label + placeholder', () => {
    const store = useEditorStore.getState();
    const id = store.addInputFieldComponent();
    store.updateInputFieldComponent(id!, {
      label: 'Berapa 2+2?',
      placeholder: 'Jawab dengan angka',
    });
    const after = useEditorStore.getState().project;
    const comp = after.pages.find((p) => p.id === after.currentPageId)!.components.find((c) => c.id === id) as InputFieldComponent;
    expect(comp.label).toBe('Berapa 2+2?');
    expect(comp.placeholder).toBe('Jawab dengan angka');
  });

  it('54. updateInputFieldComponent updates correctAnswer + points', () => {
    const store = useEditorStore.getState();
    const id = store.addInputFieldComponent();
    store.updateInputFieldComponent(id!, {
      correctAnswer: '4',
      feedbackCorrect: 'Benar!',
      feedbackWrong: 'Salah, coba lagi.',
      points: 5,
    });
    const after = useEditorStore.getState().project;
    const comp = after.pages.find((p) => p.id === after.currentPageId)!.components.find((c) => c.id === id) as InputFieldComponent;
    expect(comp.correctAnswer).toBe('4');
    expect(comp.feedbackCorrect).toBe('Benar!');
    expect(comp.feedbackWrong).toBe('Salah, coba lagi.');
    expect(comp.points).toBe(5);
  });

  it('55. updateHotspotOverlayComponent ignores invalid variant', () => {
    const store = useEditorStore.getState();
    const id = store.addHotspotOverlayComponent();
    // Attempt to set invalid variant
    store.updateHotspotOverlayComponent(id!, { variant: 'invalid-variant' as never });
    const after = useEditorStore.getState().project;
    const comp = after.pages.find((p) => p.id === after.currentPageId)!.components.find((c) => c.id === id) as HotspotOverlayComponent;
    // Variant should remain default (sanitizer rejected invalid)
    expect(comp.variant).toBe('default');
  });

  it('56. updateInputFieldComponent ignores invalid points (negative)', () => {
    const store = useEditorStore.getState();
    const id = store.addInputFieldComponent();
    store.updateInputFieldComponent(id!, { points: -10 as never });
    const after = useEditorStore.getState().project;
    const comp = after.pages.find((p) => p.id === after.currentPageId)!.components.find((c) => c.id === id) as InputFieldComponent;
    // Points should remain default (0) — sanitizer rejected -10
    expect(comp.points).toBe(0);
  });

  it('57. updateHotspotOverlayComponent on non-existent id is no-op', () => {
    const store = useEditorStore.getState();
    const before = store.project;
    store.updateHotspotOverlayComponent('non-existent-id', { defaultOpenIndex: 5 });
    expect(useEditorStore.getState().project).toBe(before);
  });

  it('58. updateInputFieldComponent on non-existent id is no-op', () => {
    const store = useEditorStore.getState();
    const before = store.project;
    store.updateInputFieldComponent('non-existent-id', { label: 'Should not apply' });
    expect(useEditorStore.getState().project).toBe(before);
  });
});

// ---------------------------------------------------------------------------
// 8. Deep-copy pada duplicatePage
// ---------------------------------------------------------------------------

describe('V2-PILAR-2 — Deep-copy pada duplicatePage', () => {
  beforeEach(() => {
    useEditorStore.getState().resetProject();
    useEditorStore.getState().addPage({ role: 'free', title: 'Slide Asli' });
  });

  it('59. duplicatePage copies hotspot-overlay with new IDs', () => {
    const store = useEditorStore.getState();
    const originalId = store.addHotspotOverlayComponent();
    const original = useEditorStore.getState().project.pages
      .find((p) => p.id === useEditorStore.getState().project.currentPageId)!
      .components.find((c) => c.id === originalId) as HotspotOverlayComponent;
    const originalHotspotIds = original.hotspots.map((h) => h.id);

    // Duplicate the page
    const newPageId = store.duplicatePage(useEditorStore.getState().project.currentPageId);
    expect(newPageId).not.toBeNull();

    const newPage = useEditorStore.getState().project.pages.find((p) => p.id === newPageId)!;
    const newComp = newPage.components.find((c) => c.type === 'hotspot-overlay') as HotspotOverlayComponent;
    expect(newComp).toBeDefined();
    expect(newComp.id).not.toBe(originalId);
    // All hotspot IDs should be regenerated
    const newHotspotIds = newComp.hotspots.map((h) => h.id);
    newHotspotIds.forEach((id) => {
      expect(originalHotspotIds).not.toContain(id);
    });
    // Hotspot content (label, info, x, y) should be preserved
    expect(newComp.hotspots).toHaveLength(original.hotspots.length);
    expect(newComp.hotspots[0].label).toBe(original.hotspots[0].label);
    expect(newComp.hotspots[0].x).toBe(original.hotspots[0].x);
  });

  it('60. duplicatePage copies input-field with new ID', () => {
    const store = useEditorStore.getState();
    const originalId = store.addInputFieldComponent({
      label: 'Apa ibu kota?',
      correctAnswer: 'Jakarta',
      points: 10,
    });

    const newPageId = store.duplicatePage(useEditorStore.getState().project.currentPageId);
    expect(newPageId).not.toBeNull();

    const newPage = useEditorStore.getState().project.pages.find((p) => p.id === newPageId)!;
    const newComp = newPage.components.find((c) => c.type === 'input-field') as InputFieldComponent;
    expect(newComp).toBeDefined();
    expect(newComp.id).not.toBe(originalId);
    // Content preserved
    expect(newComp.label).toBe('Apa ibu kota?');
    expect(newComp.correctAnswer).toBe('Jakarta');
    expect(newComp.points).toBe(10);
  });

  it('61. duplicatePage preserves variant for hotspot-overlay', () => {
    const store = useEditorStore.getState();
    store.addHotspotOverlayComponent();
    const newPageId = store.duplicatePage(useEditorStore.getState().project.currentPageId);
    const newPage = useEditorStore.getState().project.pages.find((p) => p.id === newPageId)!;
    const newComp = newPage.components.find((c) => c.type === 'hotspot-overlay') as HotspotOverlayComponent;
    expect(newComp.variant).toBe('default');
  });

  it('62. duplicatePage preserves variant for input-field (longAnswer)', () => {
    const store = useEditorStore.getState();
    store.addInputFieldComponent({ variant: 'longAnswer' });
    const newPageId = store.duplicatePage(useEditorStore.getState().project.currentPageId);
    const newPage = useEditorStore.getState().project.pages.find((p) => p.id === newPageId)!;
    const newComp = newPage.components.find((c) => c.type === 'input-field') as InputFieldComponent;
    expect(newComp.variant).toBe('longAnswer');
  });
});
