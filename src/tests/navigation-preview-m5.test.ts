/**
 * Tests for navigation component + interaction recipes + preview runtime (M5).
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  createNavigationComponent,
  DEFAULT_NAVIGATION_VARIANT,
} from '../core/component-factory';
import {
  NAVIGATION_ACTIONS,
  NAVIGATION_COMPONENT_VARIANTS,
} from '../core/types';
import { canAddComponent } from '../core/capability';
import { isValidComponent, validateComponent, validateStylePack } from '../core/validation';
import { CLEAN_CLASSROOM_PACK } from '../core/style-presets';
import { useEditorStore } from '../store/editor-store';
import { usePreviewStore } from '../preview/preview-store';

// =========================================================================
// createNavigationComponent
// =========================================================================

describe('createNavigationComponent', () => {
  it('creates a navigation component with default variant=navigation', () => {
    const c = createNavigationComponent('Berikutnya', 'next');
    expect(c.type).toBe('navigation');
    expect(c.id).toMatch(/^comp_/);
    expect(c.variant).toBe(DEFAULT_NAVIGATION_VARIANT);
    expect(c.variant).toBe('navigation');
    expect(c.label).toBe('Berikutnya');
    expect(c.action).toBe('next');
  });

  it('assigns unique id on each call', () => {
    const a = createNavigationComponent('A', 'next');
    const b = createNavigationComponent('B', 'prev');
    expect(a.id).not.toBe(b.id);
  });

  it('applies overrides', () => {
    const c = createNavigationComponent('Klik', 'goto', {
      variant: 'primaryAction',
      targetPageId: 'page_123',
      x: 500,
      y: 600,
    });
    expect(c.variant).toBe('primaryAction');
    expect(c.targetPageId).toBe('page_123');
    expect(c.x).toBe(500);
    expect(c.y).toBe(600);
  });

  it('each valid variant works', () => {
    for (const v of NAVIGATION_COMPONENT_VARIANTS) {
      const c = createNavigationComponent('Test', 'next', { variant: v });
      expect(c.variant).toBe(v);
    }
  });

  it('each valid action works', () => {
    for (const a of NAVIGATION_ACTIONS) {
      const c = createNavigationComponent('Test', a, a === 'goto' ? { targetPageId: 'p1' } : {});
      expect(c.action).toBe(a);
    }
  });
});

// =========================================================================
// validateNavigationComponent
// =========================================================================

describe('validateNavigationComponent', () => {
  it('accepts a freshly created navigation component', () => {
    const c = createNavigationComponent('Next', 'next');
    expect(validateComponent(c).ok).toBe(true);
    expect(isValidComponent(c)).toBe(true);
  });

  it('accepts goto action with targetPageId', () => {
    const c = createNavigationComponent('Go', 'goto', { targetPageId: 'page_xyz' });
    expect(validateComponent(c).ok).toBe(true);
  });

  it('REJECTS goto action WITHOUT targetPageId', () => {
    const c = createNavigationComponent('Go', 'goto');
    // c has no targetPageId
    const broken = { ...c } as Record<string, unknown>;
    delete broken.targetPageId;
    expect(validateComponent(broken).ok).toBe(false);
  });

  it('REJECTS without variant', () => {
    const c = createNavigationComponent('Test', 'next');
    const broken = { ...c } as Record<string, unknown>;
    delete broken.variant;
    expect(validateComponent(broken).ok).toBe(false);
  });

  it('REJECTS with invalid variant', () => {
    const c = createNavigationComponent('Test', 'next');
    const broken = { ...c, variant: 'invalidVariant' };
    expect(validateComponent(broken).ok).toBe(false);
  });

  it('REJECTS without label', () => {
    const c = createNavigationComponent('Test', 'next');
    const broken = { ...c, label: '' };
    expect(validateComponent(broken).ok).toBe(false);
  });

  it('REJECTS with invalid action', () => {
    const c = createNavigationComponent('Test', 'next');
    const broken = { ...c, action: 'invalidAction' };
    expect(validateComponent(broken).ok).toBe(false);
  });

  it('REJECTS with non-string targetPageId', () => {
    const c = createNavigationComponent('Go', 'goto', { targetPageId: 'p1' });
    const broken = { ...c, targetPageId: 123 };
    expect(validateComponent(broken).ok).toBe(false);
  });
});

// =========================================================================
// Capability Matrix — navigation per role (M5)
// =========================================================================

describe('Capability Matrix — navigation per role (M5)', () => {
  it('cover denies navigation', () => {
    expect(canAddComponent('cover', 'navigation')).toBe(false);
  });

  it('learningObjectives allows navigation (UX-03 Patch-1: bebas jalan bantu)', () => {
    expect(canAddComponent('learningObjectives', 'navigation')).toBe(true);
  });

  it('quiz allows navigation (UX-03 Patch-1: bebas jalan bantu)', () => {
    expect(canAddComponent('quiz', 'navigation')).toBe(true);
  });

  it('material allows navigation', () => {
    expect(canAddComponent('material', 'navigation')).toBe(true);
  });

  it('activity allows navigation', () => {
    expect(canAddComponent('activity', 'navigation')).toBe(true);
  });

  it('starter allows navigation', () => {
    expect(canAddComponent('starter', 'navigation')).toBe(true);
  });

  it('free allows navigation', () => {
    expect(canAddComponent('free', 'navigation')).toBe(true);
  });

  it('reflection allows navigation', () => {
    expect(canAddComponent('reflection', 'navigation')).toBe(true);
  });

  it('closing allows navigation', () => {
    expect(canAddComponent('closing', 'navigation')).toBe(true);
  });
});

// =========================================================================
// Interaction Recipes (M5)
// =========================================================================

describe('Interaction Recipes (M5)', () => {
  it('CLEAN_CLASSROOM_PACK has interactionRecipes with 3 entries', () => {
    const recipes = CLEAN_CLASSROOM_PACK.interactionRecipes;
    expect(recipes.buttonHoverGrow).toBeDefined();
    expect(recipes.buttonPress).toBeDefined();
    expect(recipes.focusRing).toBeDefined();
  });

  it('buttonHoverGrow has scale within bounds (0.8–1.08)', () => {
    const entry = CLEAN_CLASSROOM_PACK.interactionRecipes.buttonHoverGrow;
    expect(entry?.scale).toBeDefined();
    expect(entry!.scale!).toBeGreaterThanOrEqual(0.8);
    expect(entry!.scale!).toBeLessThanOrEqual(1.08);
  });

  it('buttonPress has scale within bounds (0.8–1.08)', () => {
    const entry = CLEAN_CLASSROOM_PACK.interactionRecipes.buttonPress;
    expect(entry?.scale).toBeDefined();
    expect(entry!.scale!).toBeGreaterThanOrEqual(0.8);
    expect(entry!.scale!).toBeLessThanOrEqual(1.08);
  });

  it('all entries have durationMs within bounds (80–500)', () => {
    const recipes = CLEAN_CLASSROOM_PACK.interactionRecipes;
    for (const key of ['buttonHoverGrow', 'buttonPress', 'focusRing']) {
      const entry = (recipes as Record<string, { durationMs?: number }>)[key];
      if (entry?.durationMs !== undefined) {
        expect(entry.durationMs).toBeGreaterThanOrEqual(80);
        expect(entry.durationMs).toBeLessThanOrEqual(500);
      }
    }
  });

  it('all entries are serializable (no function/class)', () => {
    const json = JSON.stringify(CLEAN_CLASSROOM_PACK.interactionRecipes);
    expect(json).not.toMatch(/function/i);
    const parsed = JSON.parse(json);
    expect(parsed.buttonHoverGrow).toBeDefined();
    expect(parsed.buttonPress).toBeDefined();
    expect(parsed.focusRing).toBeDefined();
  });

  it('validateStylePack accepts CLEAN_CLASSROOM_PACK with interactionRecipes', () => {
    const r = validateStylePack(CLEAN_CLASSROOM_PACK);
    expect(r.ok).toBe(true);
  });

  it('validateStylePack REJECTS interactionRecipe with scale > 1.08', () => {
    const broken = {
      ...CLEAN_CLASSROOM_PACK,
      interactionRecipes: {
        ...CLEAN_CLASSROOM_PACK.interactionRecipes,
        buttonHoverGrow: { scale: 1.5, durationMs: 150 },
      },
    };
    expect(validateStylePack(broken).ok).toBe(false);
  });

  it('validateStylePack REJECTS interactionRecipe with durationMs < 80', () => {
    const broken = {
      ...CLEAN_CLASSROOM_PACK,
      interactionRecipes: {
        ...CLEAN_CLASSROOM_PACK.interactionRecipes,
        buttonPress: { scale: 0.96, durationMs: 30 },
      },
    };
    expect(validateStylePack(broken).ok).toBe(false);
  });

  it('validateStylePack REJECTS interactionRecipe with durationMs > 500', () => {
    const broken = {
      ...CLEAN_CLASSROOM_PACK,
      interactionRecipes: {
        ...CLEAN_CLASSROOM_PACK.interactionRecipes,
        focusRing: { durationMs: 1000 },
      },
    };
    expect(validateStylePack(broken).ok).toBe(false);
  });
});

// =========================================================================
// Store — navigation component operations (M5)
// =========================================================================

describe('editor store — M5 scope (navigation component)', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('addNavigationComponent on cover returns null (capability denied)', () => {
    const store = useEditorStore.getState();
    const result = store.addNavigationComponent('Next', 'next');
    expect(result).toBeNull();
  });

  it('addNavigationComponent on free page succeeds and selects it', () => {
    const store = useEditorStore.getState();
    store.addPage();
    const result = store.addNavigationComponent('Berikutnya', 'next');

    expect(result).not.toBeNull();
    const { project, selectedComponentId } = useEditorStore.getState();
    const page = project.pages.find((p) => p.id === project.currentPageId)!;
    expect(page.components).toHaveLength(1);
    expect(page.components[0].type).toBe('navigation');
    expect(selectedComponentId).toBe(result);
  });

  it('addNavigationComponent creates variant=navigation by default', () => {
    const store = useEditorStore.getState();
    store.addPage();
    store.addNavigationComponent('Test', 'next');
    const { project } = useEditorStore.getState();
    const c = project.pages[1].components[0] as { variant: string };
    expect(c.variant).toBe('navigation');
  });

  it('addNavigationComponent on quiz succeeds (UX-03 Patch-1: quiz allows nav)', () => {
    const store = useEditorStore.getState();
    store.addPage({ role: 'quiz' });
    const result = store.addNavigationComponent('Next', 'next');
    expect(result).not.toBeNull();
  });

  it('updateNavigationComponent modifies label + action', () => {
    const store = useEditorStore.getState();
    store.addPage();
    const id = store.addNavigationComponent('Old', 'next')!;
    store.updateNavigationComponent(id, { label: 'New Label', action: 'prev' });
    const { project } = useEditorStore.getState();
    const c = project.pages[1].components[0] as { label: string; action: string };
    expect(c.label).toBe('New Label');
    expect(c.action).toBe('prev');
  });

  it('updateNavigationComponent REJECTS invalid variant', () => {
    const store = useEditorStore.getState();
    store.addPage();
    const id = store.addNavigationComponent('Test', 'next')!;
    store.updateNavigationComponent(id, { variant: 'invalidVariant' as never });
    const { project } = useEditorStore.getState();
    const c = project.pages[1].components[0] as { variant: string };
    expect(c.variant).toBe('navigation'); // unchanged
  });

  it('updateNavigationComponent REJECTS invalid action', () => {
    const store = useEditorStore.getState();
    store.addPage();
    const id = store.addNavigationComponent('Test', 'next')!;
    store.updateNavigationComponent(id, { action: 'invalidAction' as never });
    const { project } = useEditorStore.getState();
    const c = project.pages[1].components[0] as { action: string };
    expect(c.action).toBe('next'); // unchanged
  });

  it('updateNavigationComponent clears targetPageId when action changes to non-goto', () => {
    const store = useEditorStore.getState();
    store.addPage();
    const id = store.addNavigationComponent('Go', 'goto', { targetPageId: 'page1' })!;
    store.updateNavigationComponent(id, { action: 'next' });
    const { project } = useEditorStore.getState();
    const c = project.pages[1].components[0] as { action: string; targetPageId?: string };
    expect(c.action).toBe('next');
    expect(c.targetPageId).toBeUndefined();
  });

  it('duplicatePage regenerates navigation component id', () => {
    const store = useEditorStore.getState();
    store.addPage();
    const navId = store.addNavigationComponent('Next', 'next')!;
    const pageId = useEditorStore.getState().project.currentPageId;

    const copyId = store.duplicatePage(pageId)!;
    const { project } = useEditorStore.getState();
    const copy = project.pages.find((p) => p.id === copyId)!;
    const copyNav = copy.components[0] as { id: string; type: string; label: string; action: string };

    expect(copyNav.id).not.toBe(navId);
    expect(copyNav.type).toBe('navigation');
    expect(copyNav.label).toBe('Next');
    expect(copyNav.action).toBe('next');
  });
});

// =========================================================================
// Preview Runtime State (M5)
// =========================================================================

describe('preview runtime state (M5)', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
    usePreviewStore.getState().closePreview();
  });

  it('openPreview sets isOpen=true and currentPageId to editor current page (UX-01 Patch: preview-fix)', () => {
    // newProject() sets currentPageId to pages[0].id (cover), so preview
    // should start at the same page.
    const store = useEditorStore.getState();
    const firstPageId = store.project.pages[0].id;

    usePreviewStore.getState().openPreview();
    const preview = usePreviewStore.getState();
    expect(preview.isOpen).toBe(true);
    expect(preview.currentPageId).toBe(firstPageId);
  });

  it('openPreview starts at the editor current page (not always page 1) — UX-01 Patch: preview-fix', () => {
    // Add 2 more pages, then navigate editor to page 3.
    useEditorStore.getState().addPage(); // page 2
    useEditorStore.getState().addPage(); // page 3
    const page3Id = useEditorStore.getState().project.pages[2].id;
    useEditorStore.getState().selectPage(page3Id);

    usePreviewStore.getState().openPreview();
    // Preview should now start at page 3 (the editor's current page),
    // NOT page 1.
    expect(usePreviewStore.getState().currentPageId).toBe(page3Id);
  });

  it('openPreview falls back to first page if editor currentPageId is stale — UX-01 Patch: preview-fix', () => {
    // Manually corrupt editor state: set currentPageId to a non-existent page.
    const store = useEditorStore.getState();
    const bogusId = 'non-existent-page-id';
    useEditorStore.setState({
      project: { ...store.project, currentPageId: bogusId },
    });
    usePreviewStore.getState().openPreview();
    // Should fall back to pages[0].id
    expect(usePreviewStore.getState().currentPageId).toBe(
      useEditorStore.getState().project.pages[0].id,
    );
  });

  it('closePreview sets isOpen=false', () => {
    usePreviewStore.getState().openPreview();
    usePreviewStore.getState().closePreview();
    expect(usePreviewStore.getState().isOpen).toBe(false);
  });

  it('navigateNext moves to next page', () => {
    useEditorStore.getState().addPage(); // page 2
    useEditorStore.getState().addPage(); // page 3
    const page1Id = useEditorStore.getState().project.pages[0].id;
    const page2Id = useEditorStore.getState().project.pages[1].id;
    // UX-01 Patch (preview-fix): openPreview starts at editor's current page,
    // so navigate editor back to page 1 before opening preview.
    useEditorStore.getState().selectPage(page1Id);

    usePreviewStore.getState().openPreview();
    expect(usePreviewStore.getState().currentPageId).toBe(page1Id);

    usePreviewStore.getState().navigateNext();
    expect(usePreviewStore.getState().currentPageId).toBe(page2Id);
  });

  it('navigateNext on last page is no-op', () => {
    useEditorStore.getState().addPage(); // now 2 pages
    const pages = useEditorStore.getState().project.pages;
    const lastPageId = pages[pages.length - 1].id;

    usePreviewStore.getState().openPreview();
    // Move to last page first
    usePreviewStore.getState().navigateNext();
    // Now try navigateNext again — should be no-op (already on last)
    usePreviewStore.getState().navigateNext();
    expect(usePreviewStore.getState().currentPageId).toBe(lastPageId);
  });

  it('navigatePrev moves to previous page', () => {
    useEditorStore.getState().addPage();
    const page1Id = useEditorStore.getState().project.pages[0].id;

    usePreviewStore.getState().openPreview();
    usePreviewStore.getState().navigateNext(); // move to page 2
    usePreviewStore.getState().navigatePrev(); // back to page 1
    expect(usePreviewStore.getState().currentPageId).toBe(page1Id);
  });

  it('navigatePrev on first page is no-op', () => {
    const firstPageId = useEditorStore.getState().project.pages[0].id;

    usePreviewStore.getState().openPreview();
    usePreviewStore.getState().navigatePrev();
    expect(usePreviewStore.getState().currentPageId).toBe(firstPageId);
  });

  it('navigateGoto moves to target page', () => {
    useEditorStore.getState().addPage();
    useEditorStore.getState().addPage();
    const page3Id = useEditorStore.getState().project.pages[2].id;

    usePreviewStore.getState().openPreview();
    usePreviewStore.getState().navigateGoto(page3Id);
    expect(usePreviewStore.getState().currentPageId).toBe(page3Id);
  });

  it('navigateGoto with unknown targetPageId is no-op', () => {
    usePreviewStore.getState().openPreview();
    const before = usePreviewStore.getState().currentPageId;
    usePreviewStore.getState().navigateGoto('does-not-exist');
    expect(usePreviewStore.getState().currentPageId).toBe(before);
  });

  // CRITICAL: Preview does NOT mutate editor currentPageId
  it('preview navigation does NOT mutate editor currentPageId', () => {
    useEditorStore.getState().addPage();
    useEditorStore.getState().addPage();
    const editorCurrentBefore = useEditorStore.getState().project.currentPageId;

    usePreviewStore.getState().openPreview();
    usePreviewStore.getState().navigateNext();
    usePreviewStore.getState().navigateNext();

    const editorCurrentAfter = useEditorStore.getState().project.currentPageId;
    expect(editorCurrentAfter).toBe(editorCurrentBefore);
  });

  it('preview store is separate from editor store', () => {
    const editorState = useEditorStore.getState();
    const previewState = usePreviewStore.getState();

    // Editor currentPageId and preview currentPageId are different values
    // (editor = last added page, preview = null or first page)
    expect(previewState.currentPageId).not.toBe(editorState.project.currentPageId);
  });
});
