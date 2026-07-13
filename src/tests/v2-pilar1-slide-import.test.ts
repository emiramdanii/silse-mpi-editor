/**
 * V2-PILAR-1: Tests for slide import system.
 *
 * Coverage:
 *   1. Pure helpers (derivePageTitleFromFileName, isProjectEmpty, validateSlideFileCount,
 *      isAcceptedImageFile) — fast, no DOM.
 *   2. Store method (importSlidesAsPages) — tests replace + append modes.
 *   3. GlobalSlideSettings type — default values, getEffectiveGlobalSlideSettings.
 *
 * Note: readImageFiles (browser-only FileReader) tidak di-test di sini karena
 * butuh jsdom setup yang berat. Dilakukan via integration test terpisah jika perlu.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  derivePageTitleFromFileName,
  isProjectEmpty,
  createProject,
  DEFAULT_GLOBAL_SLIDE_SETTINGS,
  getEffectiveGlobalSlideSettings,
  createProjectWithPages,
} from '../core/project-factory';
import {
  isAcceptedImageFile,
  validateSlideFileCount,
  MAX_SLIDE_FILES,
  ACCEPTED_SLIDE_EXTENSIONS,
  ACCEPTED_SLIDE_MIME,
  SLIDE_FILE_LABEL,
} from '../core/slide-import';
import { useEditorStore } from '../store/editor-store';
import type { GlobalSlideSettings, SimpleProject } from '../core/types';

// ---------------------------------------------------------------------------
// 1. derivePageTitleFromFileName — pure function
// ---------------------------------------------------------------------------

describe('V2-PILAR-1 — derivePageTitleFromFileName', () => {
  it('1. strips .png extension', () => {
    expect(derivePageTitleFromFileName('slide-01.png')).toBe('Slide 01');
  });

  it('2. strips .jpg extension', () => {
    expect(derivePageTitleFromFileName('photo.jpg')).toBe('Photo');
  });

  it('3. strips .jpeg extension (case-insensitive)', () => {
    expect(derivePageTitleFromFileName('Photo.JPEG')).toBe('Photo');
  });

  it('4. strips .webp extension', () => {
    expect(derivePageTitleFromFileName('modern.webp')).toBe('Modern');
  });

  it('5. replaces hyphens with spaces', () => {
    expect(derivePageTitleFromFileName('materi-pertama.png')).toBe('Materi pertama');
  });

  it('6. replaces underscores with spaces', () => {
    expect(derivePageTitleFromFileName('materi_pertama.png')).toBe('Materi pertama');
  });

  it('7. replaces mixed - and _ with spaces', () => {
    expect(derivePageTitleFromFileName('slide_01-pengantar.png')).toBe('Slide 01 pengantar');
  });

  it('8. capitalizes first letter', () => {
    expect(derivePageTitleFromFileName('hello.png')).toBe('Hello');
  });

  it('9. truncates to 50 chars with elipsis', () => {
    const longName = 'a'.repeat(80) + '.png';
    const result = derivePageTitleFromFileName(longName);
    expect(result.length).toBe(50);
    expect(result.endsWith('…')).toBe(true);
  });

  it('10. handles empty filename (after extension strip)', () => {
    expect(derivePageTitleFromFileName('.png')).toBe('Slide');
  });

  it('11. handles filename with no extension', () => {
    expect(derivePageTitleFromFileName('just-a-name')).toBe('Just a name');
  });

  it('12. handles filename with multiple dots (only extension stripped)', () => {
    // Hanya ekstensi .png yang di-strip. Titik internal tidak di-replace.
    // Ini by design — user bisa rename manual jika mau.
    expect(derivePageTitleFromFileName('slide.v2.final.png')).toBe('Slide.v2.final');
  });

  it('13. handles single character filename', () => {
    expect(derivePageTitleFromFileName('x.png')).toBe('X');
  });
});

// ---------------------------------------------------------------------------
// 2. isProjectEmpty — pure function
// ---------------------------------------------------------------------------

describe('V2-PILAR-1 — isProjectEmpty', () => {
  it('14. returns true for default createProject() result', () => {
    const project = createProject();
    expect(isProjectEmpty(project)).toBe(true);
  });

  it('15. returns false for project with non-default title', () => {
    const project = createProject();
    project.title = 'MPI Berbeda';
    expect(isProjectEmpty(project)).toBe(false);
  });

  it('16. returns false for project with more than 1 page', () => {
    const project = createProjectWithPages(3);
    expect(isProjectEmpty(project)).toBe(false);
  });

  it('17. returns false for project with no components on cover', () => {
    const project = createProject();
    project.pages[0].components = [];
    expect(isProjectEmpty(project)).toBe(false);
  });

  it('18. returns false for project with non-text component on cover', () => {
    const project = createProject();
    // Replace text component with image-like component
    project.pages[0].components = [{
      id: 'img1', type: 'image', variant: 'illustration', src: 'data:...',
      alt: '', objectFit: 'cover', x: 0, y: 0, width: 100, height: 100,
    } as never];
    expect(isProjectEmpty(project)).toBe(false);
  });

  it('19. returns false for project with text component but wrong text', () => {
    const project = createProject();
    (project.pages[0].components[0] as { text: string }).text = 'Bukan Judul MPI';
    expect(isProjectEmpty(project)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. validateSlideFileCount — pure function
// ---------------------------------------------------------------------------

describe('V2-PILAR-1 — validateSlideFileCount', () => {
  it('20. returns ok:false for 0 files', () => {
    const result = validateSlideFileCount(0);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('Tidak ada file');
  });

  it('21. returns ok:true for 1 file', () => {
    expect(validateSlideFileCount(1).ok).toBe(true);
  });

  it('22. returns ok:true for exactly MAX_SLIDE_FILES (50)', () => {
    expect(validateSlideFileCount(MAX_SLIDE_FILES).ok).toBe(true);
  });

  it('23. returns ok:false for MAX_SLIDE_FILES + 1 (51)', () => {
    const result = validateSlideFileCount(MAX_SLIDE_FILES + 1);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('50');
      expect(result.error).toContain('51');
    }
  });

  it('24. returns ok:false for 100 files (far over limit)', () => {
    const result = validateSlideFileCount(100);
    expect(result.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. isAcceptedImageFile — pure function
// ---------------------------------------------------------------------------

describe('V2-PILAR-1 — isAcceptedImageFile', () => {
  it('25. accepts .png', () => {
    expect(isAcceptedImageFile('photo.png')).toBe(true);
  });

  it('26. accepts .PNG (uppercase)', () => {
    expect(isAcceptedImageFile('PHOTO.PNG')).toBe(true);
  });

  it('27. accepts .jpg', () => {
    expect(isAcceptedImageFile('photo.jpg')).toBe(true);
  });

  it('28. accepts .jpeg', () => {
    expect(isAcceptedImageFile('photo.jpeg')).toBe(true);
  });

  it('29. accepts .webp', () => {
    expect(isAcceptedImageFile('photo.webp')).toBe(true);
  });

  it('30. rejects .gif', () => {
    expect(isAcceptedImageFile('animation.gif')).toBe(false);
  });

  it('31. rejects .svg', () => {
    expect(isAcceptedImageFile('vector.svg')).toBe(false);
  });

  it('32. rejects .bmp', () => {
    expect(isAcceptedImageFile('old.bmp')).toBe(false);
  });

  it('33. rejects no extension', () => {
    expect(isAcceptedImageFile('noextension')).toBe(false);
  });

  it('34. accepts file with path prefix', () => {
    expect(isAcceptedImageFile('/home/user/photos/slide.png')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. Constants — sanity check
// ---------------------------------------------------------------------------

describe('V2-PILAR-1 — slide-import constants', () => {
  it('35. ACCEPTED_SLIDE_EXTENSIONS contains 4 entries', () => {
    expect(ACCEPTED_SLIDE_EXTENSIONS).toHaveLength(4);
  });

  it('36. ACCEPTED_SLIDE_MIME contains png/jpeg/webp', () => {
    expect(ACCEPTED_SLIDE_MIME).toContain('png');
    expect(ACCEPTED_SLIDE_MIME).toContain('jpeg');
    expect(ACCEPTED_SLIDE_MIME).toContain('webp');
  });

  it('37. SLIDE_FILE_LABEL mentions PNG, JPG, WebP', () => {
    expect(SLIDE_FILE_LABEL).toContain('PNG');
    expect(SLIDE_FILE_LABEL).toContain('JPG');
    expect(SLIDE_FILE_LABEL).toContain('WebP');
  });

  it('38. MAX_SLIDE_FILES is 50', () => {
    expect(MAX_SLIDE_FILES).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// 6. importSlidesAsPages — store method (replace + append modes)
// ---------------------------------------------------------------------------

describe('V2-PILAR-1 — importSlidesAsPages (store)', () => {
  beforeEach(() => {
    // Reset store ke default empty project sebelum tiap test
    useEditorStore.getState().resetProject();
  });

  it('39. mode=replace on empty project: replaces single cover page with N slide pages', () => {
    const store = useEditorStore.getState();
    expect(isProjectEmpty(store.project)).toBe(true); // sanity

    const files = [
      { name: 'slide-01.png', dataUrl: 'data:image/png;base64,AAA' },
      { name: 'slide-02.png', dataUrl: 'data:image/png;base64,BBB' },
      { name: 'slide-03.png', dataUrl: 'data:image/png;base64,CCC' },
    ];
    const count = store.importSlidesAsPages(files, 'replace');

    expect(count).toBe(3);
    const after = useEditorStore.getState().project;
    expect(after.pages).toHaveLength(3);
    expect(after.currentPageId).toBe(after.pages[0].id);
  });

  it('40. mode=replace: each page has background.type=image and imageSrc=correct dataUrl', () => {
    const store = useEditorStore.getState();
    const files = [
      { name: 'a.png', dataUrl: 'data:image/png;base64,A' },
      { name: 'b.png', dataUrl: 'data:image/png;base64,B' },
    ];
    store.importSlidesAsPages(files, 'replace');

    const after = useEditorStore.getState().project;
    expect(after.pages[0].background).toEqual({ type: 'image', imageSrc: 'data:image/png;base64,A' });
    expect(after.pages[1].background).toEqual({ type: 'image', imageSrc: 'data:image/png;base64,B' });
  });

  it('41. mode=replace: each page has role=free', () => {
    const store = useEditorStore.getState();
    store.importSlidesAsPages(
      [{ name: 'a.png', dataUrl: 'data:image/png;base64,A' }],
      'replace',
    );

    const after = useEditorStore.getState().project;
    expect(after.pages[0].role).toBe('free');
  });

  it('42. mode=replace: each page has title derived from filename', () => {
    const store = useEditorStore.getState();
    store.importSlidesAsPages(
      [
        { name: 'materi-pertama.png', dataUrl: 'data:image/png;base64,A' },
        { name: 'latihan.jpg', dataUrl: 'data:image/png;base64,B' },
      ],
      'replace',
    );

    const after = useEditorStore.getState().project;
    expect(after.pages[0].title).toBe('Materi pertama');
    expect(after.pages[1].title).toBe('Latihan');
  });

  it('43. mode=replace: each page has empty components array', () => {
    const store = useEditorStore.getState();
    store.importSlidesAsPages(
      [{ name: 'a.png', dataUrl: 'data:image/png;base64,A' }],
      'replace',
    );

    const after = useEditorStore.getState().project;
    expect(after.pages[0].components).toEqual([]);
  });

  it('44. mode=append: adds slides to end of existing pages', () => {
    const store = useEditorStore.getState();
    // Buat project dengan 2 halaman existing
    store.addPage({ title: 'Existing 1', role: 'free' });
    store.addPage({ title: 'Existing 2', role: 'free' });
    const existingCount = useEditorStore.getState().project.pages.length;
    expect(existingCount).toBe(3); // 1 default cover + 2 added

    const files = [
      { name: 'slide-01.png', dataUrl: 'data:image/png;base64,A' },
      { name: 'slide-02.png', dataUrl: 'data:image/png;base64,B' },
    ];
    const count = store.importSlidesAsPages(files, 'append');

    expect(count).toBe(2);
    const after = useEditorStore.getState().project;
    expect(after.pages).toHaveLength(existingCount + 2);
    // Slides ada di akhir
    expect(after.pages[after.pages.length - 2].background).toEqual({ type: 'image', imageSrc: 'data:image/png;base64,A' });
    expect(after.pages[after.pages.length - 1].background).toEqual({ type: 'image', imageSrc: 'data:image/png;base64,B' });
  });

  it('45. mode=append: currentPageId jumps to first imported slide', () => {
    const store = useEditorStore.getState();
    const originalPageId = useEditorStore.getState().project.currentPageId;
    store.importSlidesAsPages(
      [{ name: 'new-slide.png', dataUrl: 'data:image/png;base64,X' }],
      'append',
    );

    const after = useEditorStore.getState().project;
    expect(after.currentPageId).not.toBe(originalPageId);
    expect(after.currentPageId).toBe(after.pages[after.pages.length - 1].id);
  });

  it('46. mode=replace: resets runtime state (completedSceneIds, perSceneScore, aggregateScore)', () => {
    const store = useEditorStore.getState();
    // Set some runtime state
    store.markSceneCompleted('fake-scene-1');
    store.addSceneScore('fake-scene-1', 50);
    expect(useEditorStore.getState().completedSceneIds).toHaveLength(1);
    expect(useEditorStore.getState().aggregateScore).toBeGreaterThan(0);

    store.importSlidesAsPages(
      [{ name: 'a.png', dataUrl: 'data:image/png;base64,A' }],
      'replace',
    );

    const after = useEditorStore.getState();
    expect(after.completedSceneIds).toEqual([]);
    expect(after.perSceneScore).toEqual({});
    expect(after.aggregateScore).toBe(0);
  });

  it('47. mode=append: does NOT reset runtime state (existing scores preserved)', () => {
    const store = useEditorStore.getState();
    store.markSceneCompleted('fake-scene-1');
    store.addSceneScore('fake-scene-1', 50);
    const beforeCompleted = useEditorStore.getState().completedSceneIds.length;
    const beforeScore = useEditorStore.getState().aggregateScore;

    store.importSlidesAsPages(
      [{ name: 'a.png', dataUrl: 'data:image/png;base64,A' }],
      'append',
    );

    const after = useEditorStore.getState();
    expect(after.completedSceneIds).toHaveLength(beforeCompleted);
    expect(after.aggregateScore).toBe(beforeScore);
  });

  it('48. empty files array returns 0 and does not mutate state', () => {
    const store = useEditorStore.getState();
    const beforePages = store.project.pages;
    const count = store.importSlidesAsPages([], 'replace');
    expect(count).toBe(0);
    expect(useEditorStore.getState().project.pages).toBe(beforePages);
  });

  it('49. mode=replace preserves project id, style, curriculum', () => {
    const store = useEditorStore.getState();
    const beforeProject = useEditorStore.getState().project;
    const originalId = beforeProject.id;
    const originalStylePackId = beforeProject.stylePackId;
    const originalStyle = beforeProject.style;

    store.importSlidesAsPages(
      [{ name: 'a.png', dataUrl: 'data:image/png;base64,A' }],
      'replace',
    );

    const after = useEditorStore.getState().project;
    expect(after.id).toBe(originalId);
    expect(after.stylePackId).toBe(originalStylePackId);
    expect(after.style).toBe(originalStyle);
  });

  it('50. store exposes importSlidesAsPages as a function', () => {
    expect(typeof useEditorStore.getState().importSlidesAsPages).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// 7. GlobalSlideSettings — default + helper
// ---------------------------------------------------------------------------

describe('V2-PILAR-1 — GlobalSlideSettings default + helper', () => {
  it('51. DEFAULT_GLOBAL_SLIDE_SETTINGS has correct structure', () => {
    expect(DEFAULT_GLOBAL_SLIDE_SETTINGS).toHaveProperty('navigationToolbar');
    expect(DEFAULT_GLOBAL_SLIDE_SETTINGS).toHaveProperty('slideTransition');
    expect(DEFAULT_GLOBAL_SLIDE_SETTINGS.navigationToolbar).toHaveProperty('position');
    expect(DEFAULT_GLOBAL_SLIDE_SETTINGS.navigationToolbar).toHaveProperty('style');
    expect(DEFAULT_GLOBAL_SLIDE_SETTINGS.navigationToolbar).toHaveProperty('showSceneTitle');
    expect(DEFAULT_GLOBAL_SLIDE_SETTINGS.navigationToolbar).toHaveProperty('showProgressText');
    expect(DEFAULT_GLOBAL_SLIDE_SETTINGS.navigationToolbar).toHaveProperty('showProgressBar');
  });

  it('52. default position is bottom-center', () => {
    expect(DEFAULT_GLOBAL_SLIDE_SETTINGS.navigationToolbar.position).toBe('bottom-center');
  });

  it('53. default style is glass', () => {
    expect(DEFAULT_GLOBAL_SLIDE_SETTINGS.navigationToolbar.style).toBe('glass');
  });

  it('54. default show flags are all true', () => {
    expect(DEFAULT_GLOBAL_SLIDE_SETTINGS.navigationToolbar.showSceneTitle).toBe(true);
    expect(DEFAULT_GLOBAL_SLIDE_SETTINGS.navigationToolbar.showProgressText).toBe(true);
    expect(DEFAULT_GLOBAL_SLIDE_SETTINGS.navigationToolbar.showProgressBar).toBe(true);
  });

  it('55. default slideTransition is none', () => {
    expect(DEFAULT_GLOBAL_SLIDE_SETTINGS.slideTransition).toBe('none');
  });

  it('56. getEffectiveGlobalSlideSettings returns project settings when set', () => {
    const custom: GlobalSlideSettings = {
      navigationToolbar: {
        position: 'top-center',
        style: 'solid',
        showSceneTitle: false,
        showProgressText: true,
        showProgressBar: false,
      },
      slideTransition: 'fade',
      editorGrid: DEFAULT_GLOBAL_SLIDE_SETTINGS.editorGrid,
    };
    const project: SimpleProject = {
      ...createProject(),
      globalSlideSettings: custom,
    };
    expect(getEffectiveGlobalSlideSettings(project)).toEqual(custom);
  });

  it('57. getEffectiveGlobalSlideSettings returns default when project.globalSlideSettings is undefined', () => {
    const project = createProject();
    expect(project.globalSlideSettings).toBeUndefined();
    expect(getEffectiveGlobalSlideSettings(project)).toEqual(DEFAULT_GLOBAL_SLIDE_SETTINGS);
  });

  it('58. SimpleProject type allows optional globalSlideSettings field', () => {
    // Type-level test: compile-time only. If this compiles, the field is optional.
    const project: SimpleProject = {
      ...createProject(),
      // globalSlideSettings omitted — should be valid
    };
    expect(project.globalSlideSettings).toBeUndefined();
  });

  it('59. SimpleProject accepts globalSlideSettings assignment', () => {
    const project: SimpleProject = {
      ...createProject(),
      globalSlideSettings: DEFAULT_GLOBAL_SLIDE_SETTINGS,
    };
    expect(project.globalSlideSettings).toBeDefined();
    expect(project.globalSlideSettings?.navigationToolbar.position).toBe('bottom-center');
  });
});
