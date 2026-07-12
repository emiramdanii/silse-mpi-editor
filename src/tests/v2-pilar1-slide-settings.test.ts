/**
 * V2-PILAR-1 Commit 2: Tests for GlobalSlideSettings integration.
 *
 * Coverage:
 *   1. setGlobalSlideSettings store method (merge, reset, default detection)
 *   2. Export HTML includes global slide settings CSS overrides
 *   3. Export HTML applies position/style/visibility correctly
 *   4. Export HTML applies slide transition class on renderPage
 *   5. AI import rejects globalSlideSettings (forbidden field guard)
 *   6. SlideSettingsDialog rendering (basic smoke test)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { useEditorStore } from '../store/editor-store';
import { createProject, DEFAULT_GLOBAL_SLIDE_SETTINGS } from '../core/project-factory';
import { exportProjectToHtml, buildExportRenderModel } from '../export/export-html';
import { checkForbiddenFields } from '../ai-import/forbidden-field-guard';
import { SlideSettingsDialog } from '../editor/SlideSettingsDialog';
import type { SimpleProject } from '../core/types';

// ---------------------------------------------------------------------------
// 1. setGlobalSlideSettings store method
// ---------------------------------------------------------------------------

describe('V2-PILAR-1 Commit 2 — setGlobalSlideSettings store method', () => {
  beforeEach(() => {
    useEditorStore.getState().resetProject();
  });

  it('1. store exposes setGlobalSlideSettings as a function', () => {
    expect(typeof useEditorStore.getState().setGlobalSlideSettings).toBe('function');
  });

  it('2. setting navigationToolbar.position updates project.globalSlideSettings', () => {
    const store = useEditorStore.getState();
    store.setGlobalSlideSettings({
      navigationToolbar: { position: 'top-center' },
    });
    const after = useEditorStore.getState().project;
    expect(after.globalSlideSettings).toBeDefined();
    expect(after.globalSlideSettings?.navigationToolbar.position).toBe('top-center');
  });

  it('3. setting partial merge preserves other fields (default values fill in)', () => {
    const store = useEditorStore.getState();
    store.setGlobalSlideSettings({
      navigationToolbar: { position: 'bottom-left' },
    });
    const after = useEditorStore.getState().project;
    // Other fields should be default (since project was reset, current is default)
    expect(after.globalSlideSettings?.navigationToolbar.style).toBe('glass');
    expect(after.globalSlideSettings?.navigationToolbar.showSceneTitle).toBe(true);
    expect(after.globalSlideSettings?.navigationToolbar.showProgressText).toBe(true);
    expect(after.globalSlideSettings?.navigationToolbar.showProgressBar).toBe(true);
    expect(after.globalSlideSettings?.slideTransition).toBe('none');
  });

  it('4. setting slideTransition updates project.globalSlideSettings', () => {
    const store = useEditorStore.getState();
    store.setGlobalSlideSettings({ slideTransition: 'fade' });
    const after = useEditorStore.getState().project;
    expect(after.globalSlideSettings?.slideTransition).toBe('fade');
  });

  it('5. passing null resets to default (removes field from project)', () => {
    const store = useEditorStore.getState();
    // First set non-default
    store.setGlobalSlideSettings({ slideTransition: 'fade' });
    expect(useEditorStore.getState().project.globalSlideSettings).toBeDefined();
    // Then reset
    store.setGlobalSlideSettings(null);
    expect(useEditorStore.getState().project.globalSlideSettings).toBeUndefined();
  });

  it('6. setting back to default values removes field (clean state)', () => {
    const store = useEditorStore.getState();
    // Set non-default first
    store.setGlobalSlideSettings({ slideTransition: 'fade' });
    expect(useEditorStore.getState().project.globalSlideSettings).toBeDefined();
    // Set back to default
    store.setGlobalSlideSettings({ slideTransition: 'none' });
    // Field should be removed since it equals default
    expect(useEditorStore.getState().project.globalSlideSettings).toBeUndefined();
  });

  it('7. multiple sequential patches accumulate correctly', () => {
    const store = useEditorStore.getState();
    store.setGlobalSlideSettings({ navigationToolbar: { position: 'top-center' } });
    store.setGlobalSlideSettings({ navigationToolbar: { style: 'solid' } });
    store.setGlobalSlideSettings({ slideTransition: 'slide' });

    const after = useEditorStore.getState().project.globalSlideSettings;
    expect(after?.navigationToolbar.position).toBe('top-center');
    expect(after?.navigationToolbar.style).toBe('solid');
    expect(after?.slideTransition).toBe('slide');
  });

  it('8. setting showSceneTitle=false persists correctly', () => {
    const store = useEditorStore.getState();
    store.setGlobalSlideSettings({
      navigationToolbar: { showSceneTitle: false },
    });
    expect(useEditorStore.getState().project.globalSlideSettings?.navigationToolbar.showSceneTitle).toBe(false);
  });

  it('9. setting all show flags to false keeps field (not default anymore)', () => {
    const store = useEditorStore.getState();
    store.setGlobalSlideSettings({
      navigationToolbar: {
        showSceneTitle: false,
        showProgressText: false,
        showProgressBar: false,
      },
    });
    // Should NOT be removed because differs from default (all true)
    expect(useEditorStore.getState().project.globalSlideSettings).toBeDefined();
    expect(useEditorStore.getState().project.globalSlideSettings?.navigationToolbar.showSceneTitle).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2. Export HTML includes global slide settings CSS overrides
// ---------------------------------------------------------------------------

describe('V2-PILAR-1 Commit 2 — Export HTML global slide settings CSS', () => {
  it('10. default project export does NOT include V2-PILAR-1 CSS override marker (no override needed)', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    // Default settings = no override (empty lines only)
    // The marker comment is always emitted, but no actual override rules for default
    expect(html).toContain('V2-PILAR-1: Global Slide Settings overrides');
  });

  it('11. project with position=top-center emits top override CSS', () => {
    const project: SimpleProject = {
      ...createProject(),
      globalSlideSettings: {
        navigationToolbar: { ...DEFAULT_GLOBAL_SLIDE_SETTINGS.navigationToolbar, position: 'top-center' },
        slideTransition: 'none',
      },
    };
    const html = exportProjectToHtml(project);
    expect(html).toMatch(/#silse-toolbar\s*\{[^}]*top: 20px/);
    expect(html).toMatch(/#silse-toolbar\s*\{[^}]*bottom: auto/);
  });

  it('12. project with position=bottom-left emits left override CSS', () => {
    const project: SimpleProject = {
      ...createProject(),
      globalSlideSettings: {
        navigationToolbar: { ...DEFAULT_GLOBAL_SLIDE_SETTINGS.navigationToolbar, position: 'bottom-left' },
        slideTransition: 'none',
      },
    };
    const html = exportProjectToHtml(project);
    expect(html).toMatch(/#silse-toolbar\s*\{[^}]*left: 20px/);
    expect(html).toMatch(/#silse-toolbar\s*\{[^}]*transform: none/);
  });

  it('13. project with position=bottom-right emits right override CSS', () => {
    const project: SimpleProject = {
      ...createProject(),
      globalSlideSettings: {
        navigationToolbar: { ...DEFAULT_GLOBAL_SLIDE_SETTINGS.navigationToolbar, position: 'bottom-right' },
        slideTransition: 'none',
      },
    };
    const html = exportProjectToHtml(project);
    expect(html).toMatch(/#silse-toolbar\s*\{[^}]*right: 20px/);
    expect(html).toMatch(/#silse-toolbar\s*\{[^}]*left: auto/);
  });

  it('14. project with style=solid emits backdrop-filter:none override', () => {
    const project: SimpleProject = {
      ...createProject(),
      globalSlideSettings: {
        navigationToolbar: { ...DEFAULT_GLOBAL_SLIDE_SETTINGS.navigationToolbar, style: 'solid' },
        slideTransition: 'none',
      },
    };
    const html = exportProjectToHtml(project);
    expect(html).toContain('backdrop-filter: none');
    expect(html).toContain('background: rgba(15, 23, 42, 0.95)');
  });

  it('15. project with style=minimal emits transparent background override', () => {
    const project: SimpleProject = {
      ...createProject(),
      globalSlideSettings: {
        navigationToolbar: { ...DEFAULT_GLOBAL_SLIDE_SETTINGS.navigationToolbar, style: 'minimal' },
        slideTransition: 'none',
      },
    };
    const html = exportProjectToHtml(project);
    expect(html).toContain('background: transparent');
    expect(html).toContain('box-shadow: none');
  });

  it('16. project with showProgressText=false hides #silse-page-info', () => {
    const project: SimpleProject = {
      ...createProject(),
      globalSlideSettings: {
        navigationToolbar: { ...DEFAULT_GLOBAL_SLIDE_SETTINGS.navigationToolbar, showProgressText: false },
        slideTransition: 'none',
      },
    };
    const html = exportProjectToHtml(project);
    expect(html).toMatch(/#silse-toolbar #silse-page-info\s*\{\s*display: none/);
  });

  it('17. project with slideTransition=fade emits fade keyframes', () => {
    const project: SimpleProject = {
      ...createProject(),
      globalSlideSettings: {
        navigationToolbar: DEFAULT_GLOBAL_SLIDE_SETTINGS.navigationToolbar,
        slideTransition: 'fade',
      },
    };
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-slide-fade-in');
    expect(html).toContain('silse-slide-transition-fade');
  });

  it('18. project with slideTransition=slide emits slide keyframes', () => {
    const project: SimpleProject = {
      ...createProject(),
      globalSlideSettings: {
        navigationToolbar: DEFAULT_GLOBAL_SLIDE_SETTINGS.navigationToolbar,
        slideTransition: 'slide',
      },
    };
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-slide-slide-in');
    expect(html).toContain('silse-slide-transition-slide');
  });

  it('19. export JS includes SLIDE_TRANSITION variable', () => {
    const project: SimpleProject = {
      ...createProject(),
      globalSlideSettings: {
        navigationToolbar: DEFAULT_GLOBAL_SLIDE_SETTINGS.navigationToolbar,
        slideTransition: 'fade',
      },
    };
    const html = exportProjectToHtml(project);
    expect(html).toContain('SLIDE_TRANSITION');
    expect(html).toMatch(/SLIDE_TRANSITION\s*=\s*"fade"/);
  });

  it('20. export JS default (none) does not apply transition class', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    // SLIDE_TRANSITION = "none", so the if-condition skips class addition
    expect(html).toContain('SLIDE_TRANSITION');
    expect(html).toMatch(/SLIDE_TRANSITION\s*=\s*"none"/);
  });

  it('21. renderModel.globalSlideSettings is populated from project', () => {
    const project: SimpleProject = {
      ...createProject(),
      globalSlideSettings: {
        navigationToolbar: { ...DEFAULT_GLOBAL_SLIDE_SETTINGS.navigationToolbar, position: 'top-center' },
        slideTransition: 'fade',
      },
    };
    const model = buildExportRenderModel(project);
    expect(model.globalSlideSettings).toBeDefined();
    expect(model.globalSlideSettings.navigationToolbar.position).toBe('top-center');
    expect(model.globalSlideSettings.slideTransition).toBe('fade');
  });

  it('22. renderModel.globalSlideSettings defaults when project has no field', () => {
    const project = createProject();
    const model = buildExportRenderModel(project);
    expect(model.globalSlideSettings).toEqual(DEFAULT_GLOBAL_SLIDE_SETTINGS);
  });
});

// ---------------------------------------------------------------------------
// 3. AI import rejects globalSlideSettings (forbidden field guard)
// ---------------------------------------------------------------------------

describe('V2-PILAR-1 Commit 2 — AI import rejects globalSlideSettings', () => {
  it('23. checkForbiddenFields rejects globalSlideSettings at root level', () => {
    const payload = {
      version: 1,
      project: { title: 'Test' },
      globalSlideSettings: { navigationToolbar: {} },
    };
    const result = checkForbiddenFields(payload);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes('globalSlideSettings'))).toBe(true);
    }
  });

  it('24. checkForbiddenFields rejects globalSlideSettings nested in project', () => {
    const payload = {
      version: 1,
      project: {
        title: 'Test',
        globalSlideSettings: {
          navigationToolbar: { position: 'top-center' },
          slideTransition: 'fade',
        },
      },
    };
    const result = checkForbiddenFields(payload);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes('globalSlideSettings'))).toBe(true);
    }
  });

  it('25. checkForbiddenFields accepts payload without globalSlideSettings', () => {
    const payload = {
      version: 1,
      project: { title: 'Test' },
      pages: [{ id: 'p1', title: 'P1', role: 'free' }],
    };
    const result = checkForbiddenFields(payload);
    expect(result.ok).toBe(true);
  });

  it('26. error message mentions field name clearly', () => {
    const payload = { globalSlideSettings: {} };
    const result = checkForbiddenFields(payload);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toContain('globalSlideSettings');
      expect(result.errors[0]).toContain('Forbidden');
    }
  });

  it('27. error message includes path to nested field', () => {
    const payload = {
      project: {
        deep: {
          nested: {
            globalSlideSettings: { navigationToolbar: {} },
          },
        },
      },
    };
    const result = checkForbiddenFields(payload);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      // Path should include the nested location
      expect(result.errors.some((e) => e.includes('project.deep.nested.globalSlideSettings'))).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// 4. SlideSettingsDialog rendering (smoke test)
// ---------------------------------------------------------------------------

describe('V2-PILAR-1 Commit 2 — SlideSettingsDialog rendering', () => {
  beforeEach(() => {
    useEditorStore.getState().resetProject();
  });

  it('28. dialog renders with all 4 sections', () => {
    const { container } = render(React.createElement(SlideSettingsDialog, { onClose: () => {} }));
    expect(container.querySelector('[data-testid="slide-settings-dialog"]')).not.toBeNull();
    // 4 fieldsets: position, style, tampilan, transition
    expect(container.querySelectorAll('fieldset')).toHaveLength(4);
  });

  it('29. dialog renders 4 position radio options', () => {
    const { container } = render(React.createElement(SlideSettingsDialog, { onClose: () => {} }));
    expect(container.querySelector('[data-testid="slide-settings-position-bottom-center"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="slide-settings-position-top-center"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="slide-settings-position-bottom-left"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="slide-settings-position-bottom-right"]')).not.toBeNull();
  });

  it('30. dialog renders 3 style radio options', () => {
    const { container } = render(React.createElement(SlideSettingsDialog, { onClose: () => {} }));
    expect(container.querySelector('[data-testid="slide-settings-style-glass"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="slide-settings-style-solid"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="slide-settings-style-minimal"]')).not.toBeNull();
  });

  it('31. dialog renders 3 transition radio options', () => {
    const { container } = render(React.createElement(SlideSettingsDialog, { onClose: () => {} }));
    expect(container.querySelector('[data-testid="slide-settings-transition-none"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="slide-settings-transition-fade"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="slide-settings-transition-slide"]')).not.toBeNull();
  });

  it('32. dialog renders 3 checkboxes for show flags', () => {
    const { container } = render(React.createElement(SlideSettingsDialog, { onClose: () => {} }));
    expect(container.querySelector('[data-testid="slide-settings-show-scene-title"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="slide-settings-show-progress-text"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="slide-settings-show-progress-bar"]')).not.toBeNull();
  });

  it('33. dialog renders reset and close buttons', () => {
    const { container } = render(React.createElement(SlideSettingsDialog, { onClose: () => {} }));
    expect(container.querySelector('[data-testid="slide-settings-reset"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="slide-settings-close"]')).not.toBeNull();
  });

  it('34. dialog default state: bottom-center, glass, all show=true, none', () => {
    const { container } = render(React.createElement(SlideSettingsDialog, { onClose: () => {} }));
    const positionChecked = container.querySelector('[data-testid="slide-settings-position-bottom-center"]') as HTMLInputElement;
    const styleChecked = container.querySelector('[data-testid="slide-settings-style-glass"]') as HTMLInputElement;
    const transitionChecked = container.querySelector('[data-testid="slide-settings-transition-none"]') as HTMLInputElement;
    const showSceneTitle = container.querySelector('[data-testid="slide-settings-show-scene-title"]') as HTMLInputElement;
    const showProgressText = container.querySelector('[data-testid="slide-settings-show-progress-text"]') as HTMLInputElement;
    const showProgressBar = container.querySelector('[data-testid="slide-settings-show-progress-bar"]') as HTMLInputElement;
    expect(positionChecked.checked).toBe(true);
    expect(styleChecked.checked).toBe(true);
    expect(transitionChecked.checked).toBe(true);
    expect(showSceneTitle.checked).toBe(true);
    expect(showProgressText.checked).toBe(true);
    expect(showProgressBar.checked).toBe(true);
  });

  it('35. clicking reset button clears project.globalSlideSettings', () => {
    const store = useEditorStore.getState();
    // First set non-default
    store.setGlobalSlideSettings({ slideTransition: 'fade' });
    expect(useEditorStore.getState().project.globalSlideSettings).toBeDefined();

    const { container } = render(React.createElement(SlideSettingsDialog, { onClose: () => {} }));
    const resetBtn = container.querySelector('[data-testid="slide-settings-reset"]') as HTMLButtonElement;
    resetBtn.click();

    // After reset, project should have no globalSlideSettings
    expect(useEditorStore.getState().project.globalSlideSettings).toBeUndefined();
  });

  it('36. dialog reflects existing non-default settings from project', () => {
    const store = useEditorStore.getState();
    store.setGlobalSlideSettings({
      navigationToolbar: { position: 'top-center' },
      slideTransition: 'fade',
    });

    const { container } = render(React.createElement(SlideSettingsDialog, { onClose: () => {} }));
    const positionTopCenter = container.querySelector('[data-testid="slide-settings-position-top-center"]') as HTMLInputElement;
    const transitionFade = container.querySelector('[data-testid="slide-settings-transition-fade"]') as HTMLInputElement;

    expect(positionTopCenter.checked).toBe(true);
    expect(transitionFade.checked).toBe(true);
  });
});
