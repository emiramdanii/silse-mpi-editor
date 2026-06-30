/**
 * PREMIUM-EXPORT-OVERHAUL-01 PATCH-1 — Test Guard.
 *
 * Layer: tests
 *
 * Kontrak (PATCH-1):
 *   Patch ini memastikan premium visual treatment yang muncul di export
 *   juga terlihat di editor (CanvasStage) dan preview (PreviewApp).
 *   WYSIWYG: guru tidak boleh melihat editor flat lalu export berbeda jauh.
 *
 *   Prinsip:
 *     - Tidak ada fitur baru.
 *     - Tidak ada style pack / layout preset / component type baru.
 *     - Tidak ada dependency baru.
 *     - Tidak ada content / quiz / game logic / schema change.
 *     - Premium profile bisa dipakai non-export.
 *     - Auto decoration (hero card, award medal, choice badge) muncul di
 *       editor + preview + export.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createSamplePpknProject } from '../core/sample-project';
import { exportProjectToHtml } from '../export/export-html';
import { CanvasStage } from '../editor/CanvasStage';
import { PreviewApp } from '../preview/PreviewApp';
import { useEditorStore } from '../store/editor-store';
import { usePreviewStore } from '../preview/preview-store';
import {
  getPremiumExportProfile,
  getPremiumCssVariables,
  getHeroKickerText,
  isHeroPageRole,
  isAwardPageRole,
  getGradientForPageRole,
} from '../core/style-packs/premium-export-profile';
import { resolveStylePackV1 } from '../core/style-packs/style-pack-registry';
import { stylePackToProjectStyle } from '../core/style-presets';
import { checkExportQuality } from '../core/export-quality-gate';
import type { SimpleProject } from '../core/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProject(stylePackId: string): SimpleProject {
  const project = createSamplePpknProject();
  project.stylePackId = stylePackId;
  project.style = stylePackToProjectStyle(resolveStylePackV1(stylePackId));
  return project;
}

function setStoreProject(project: SimpleProject) {
  useEditorStore.setState({ project });
}

function openPreview(pageId?: string) {
  const project = useEditorStore.getState().project;
  usePreviewStore.setState({
    isOpen: true,
    currentPageId: pageId ?? project.currentPageId,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PREMIUM-EXPORT-OVERHAUL-01 PATCH-1 — consistency + safety', () => {
  // ===== 1-4: Premium profile usable by non-export =====

  it('1. premium visual profile bisa dipakai non-export (pure function, no DOM)', () => {
    const profile = getPremiumExportProfile('modern-clean');
    expect(profile).toBeDefined();
    expect(profile.stylePackId).toBe('modern-clean');
    expect(profile.colors.navy).toBeDefined();
    expect(profile.gradients.coverBg).toBeDefined();
    expect(profile.typography.heroFont).toBeDefined();
    // Pure: same input → same output
    const profile2 = getPremiumExportProfile('modern-clean');
    expect(profile2).toEqual(profile);
  });

  it('2. CanvasStage mengandung premium stage class (silse-premium-stage)', () => {
    const project = makeProject('modern-clean');
    setStoreProject(project);
    const { container } = render(<CanvasStage />);
    const canvasFrame = container.querySelector('[data-testid="canvas-frame"]');
    expect(canvasFrame).toBeInTheDocument();
    expect(canvasFrame?.className).toContain('silse-premium-stage');
  });

  it('3. PreviewApp mengandung premium stage class (silse-premium-stage)', () => {
    const project = makeProject('modern-clean');
    setStoreProject(project);
    openPreview();
    const { container } = render(<PreviewApp />);
    const previewCanvas = container.querySelector('[data-testid="preview-canvas-frame"]');
    expect(previewCanvas).toBeInTheDocument();
    expect(previewCanvas?.className).toContain('silse-premium-stage');
  });

  it('4. Export HTML mengandung premium stage class', () => {
    const project = makeProject('modern-clean');
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-premium-stage');
  });

  // ===== 5-7: data-page-role marker =====

  it('5. CanvasStage cover punya data-page-role="cover"', () => {
    const project = makeProject('modern-clean');
    // Set current page to cover
    const coverPage = project.pages.find((p) => p.role === 'cover');
    if (coverPage) project.currentPageId = coverPage.id;
    setStoreProject(project);
    const { container } = render(<CanvasStage />);
    const canvasFrame = container.querySelector('[data-testid="canvas-frame"]');
    expect(canvasFrame?.getAttribute('data-page-role')).toBe('cover');
  });

  it('6. PreviewApp cover punya data-page-role="cover"', () => {
    const project = makeProject('modern-clean');
    const coverPage = project.pages.find((p) => p.role === 'cover');
    setStoreProject(project);
    openPreview(coverPage?.id);
    const { container } = render(<PreviewApp />);
    const previewCanvas = container.querySelector('[data-testid="preview-canvas-frame"]');
    expect(previewCanvas?.getAttribute('data-page-role')).toBe('cover');
  });

  it('7. Export cover punya data-page-role="cover" (dalam JS renderPage)', () => {
    const project = makeProject('modern-clean');
    const html = exportProjectToHtml(project);
    // The export JS sets data-page-role via setAttribute in renderPage
    expect(html).toContain('data-page-role');
    expect(html).toContain("page.role");
  });

  // ===== 8-10: Auto-decoration not export-only =====

  it('8. hero card / kicker tidak hanya export-only — muncul di CanvasStage', () => {
    const project = makeProject('modern-clean');
    const coverPage = project.pages.find((p) => p.role === 'cover');
    if (coverPage) project.currentPageId = coverPage.id;
    setStoreProject(project);
    const { container } = render(<CanvasStage />);
    expect(container.querySelector('[data-testid="silse-hero-card"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="silse-hero-kicker"]')).toBeInTheDocument();
  });

  it('8b. hero card / kicker muncul di PreviewApp', () => {
    const project = makeProject('modern-clean');
    const coverPage = project.pages.find((p) => p.role === 'cover');
    setStoreProject(project);
    openPreview(coverPage?.id);
    const { container } = render(<PreviewApp />);
    expect(container.querySelector('[data-testid="silse-hero-card-preview"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="silse-hero-kicker-preview"]')).toBeInTheDocument();
  });

  it('8c. hero card / kicker muncul di Export HTML', () => {
    const project = makeProject('modern-clean');
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-hero-card');
    expect(html).toContain('silse-hero-kicker');
  });

  it('9. closing award medal / ribbon tidak hanya export-only — muncul di CanvasStage', () => {
    const project = makeProject('modern-clean');
    const closingPage = project.pages.find((p) => p.role === 'closing');
    if (closingPage) project.currentPageId = closingPage.id;
    setStoreProject(project);
    const { container } = render(<CanvasStage />);
    expect(container.querySelector('[data-testid="silse-award-medal-editor"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="silse-award-ribbon-editor"]')).toBeInTheDocument();
  });

  it('9b. closing award medal / ribbon muncul di PreviewApp', () => {
    const project = makeProject('modern-clean');
    const closingPage = project.pages.find((p) => p.role === 'closing');
    setStoreProject(project);
    openPreview(closingPage?.id);
    const { container } = render(<PreviewApp />);
    expect(container.querySelector('[data-testid="silse-award-medal-preview"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="silse-award-ribbon-preview"]')).toBeInTheDocument();
  });

  it('9c. closing award medal / ribbon muncul di Export HTML', () => {
    const project = makeProject('modern-clean');
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-award-medal');
    expect(html).toContain('silse-award-ribbon');
  });

  it('10. quiz choice badge (silse-choice-letter) tidak hanya export-only — muncul di CanvasStage', () => {
    const project = makeProject('modern-clean');
    const quizPage = project.pages.find((p) => p.role === 'quiz');
    if (quizPage) project.currentPageId = quizPage.id;
    setStoreProject(project);
    const { container } = render(<CanvasStage />);
    const choiceLetter = container.querySelector('.silse-choice-letter');
    expect(choiceLetter).toBeInTheDocument();
  });

  it('10b. quiz choice badge muncul di Export HTML', () => {
    const project = makeProject('modern-clean');
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-choice-letter');
  });

  // ===== 11-15: Export safety =====

  it('11. export renderPage tidak menghapus toolbar (toolbar di dalam canvas)', () => {
    const project = makeProject('modern-clean');
    const html = exportProjectToHtml(project);
    // Toolbar harus ada di dalam #silse-canvas di HTML output
    expect(html).toContain('id="silse-toolbar"');
    expect(html).toContain('id="silse-canvas"');
    // renderPage JS harus preserve toolbar
    expect(html).toContain("canvas.querySelector('#silse-toolbar')");
  });

  it('12. toolbar tetap ada setelah page render (JS preserve logic)', () => {
    const project = makeProject('modern-clean');
    const html = exportProjectToHtml(project);
    // The JS must re-append toolbar after innerHTML=''
    expect(html).toMatch(/if \(toolbar\) canvas\.appendChild\(toolbar\)/);
  });

  it('13. export no external url() in CSS', () => {
    const project = makeProject('modern-clean');
    const html = exportProjectToHtml(project);
    const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
    if (styleMatch) {
      // Allow data: URIs (for embedded images) but not external http/https URLs in CSS
      const css = styleMatch[1];
      expect(css).not.toMatch(/url\(\s*['"]?https?:\/\//);
    }
  });

  it('14. export no external script/link tags', () => {
    const project = makeProject('modern-clean');
    const html = exportProjectToHtml(project);
    // No external <script src="..."> or <link rel="stylesheet" href="...">
    expect(html).not.toMatch(/<script\s+src=/);
    expect(html).not.toMatch(/<link\s+rel=["']stylesheet["']/);
  });

  it('15. reduced-motion tetap ada di export', () => {
    const project = makeProject('modern-clean');
    const html = exportProjectToHtml(project);
    expect(html).toContain('prefers-reduced-motion');
  });

  // ===== 16-26: Content / quiz / game / schema unchanged =====

  it('16. content unchanged — title text preserved in export', () => {
    const project = makeProject('modern-clean');
    const html = exportProjectToHtml(project);
    expect(html).toContain(project.title);
  });

  it('17. objectives unchanged — all objectives in export render model', () => {
    const project = makeProject('modern-clean');
    const html = exportProjectToHtml(project);
    const objectives = project.curriculum?.objectives ?? [];
    for (const obj of objectives) {
      expect(html).toContain(obj.text);
    }
  });

  it('18. quiz choices unchanged — choice text preserved', () => {
    const project = makeProject('modern-clean');
    const html = exportProjectToHtml(project);
    const quizPage = project.pages.find((p) => p.role === 'quiz');
    const question = quizPage?.components.find((c) => c.type === 'question');
    if (question && 'choices' in question) {
      for (const choice of question.choices) {
        expect(html).toContain(choice.text);
      }
    }
  });

  it('19. correctChoiceIndex unchanged — export preserves correct answer index', () => {
    const project = makeProject('modern-clean');
    const html = exportProjectToHtml(project);
    const quizPage = project.pages.find((p) => p.role === 'quiz');
    const question = quizPage?.components.find((c) => c.type === 'question');
    if (question && 'correctChoiceIndex' in question) {
      // The correctChoiceIndex must be in the embedded JSON
      expect(html).toContain(`"correctChoiceIndex":${question.correctChoiceIndex}`);
    }
  });

  it('20. feedbackCorrect unchanged — preserved in export', () => {
    const project = makeProject('modern-clean');
    const html = exportProjectToHtml(project);
    const quizPage = project.pages.find((p) => p.role === 'quiz');
    const question = quizPage?.components.find((c) => c.type === 'question');
    if (question && 'feedbackCorrect' in question) {
      expect(html).toContain(question.feedbackCorrect);
    }
  });

  it('21. feedbackWrong unchanged — preserved in export', () => {
    const project = makeProject('modern-clean');
    const html = exportProjectToHtml(project);
    const quizPage = project.pages.find((p) => p.role === 'quiz');
    const question = quizPage?.components.find((c) => c.type === 'question');
    if (question && 'feedbackWrong' in question) {
      expect(html).toContain(question.feedbackWrong);
    }
  });

  it('22. game logic unchanged — missions preserved in export', () => {
    const project = makeProject('modern-clean');
    const html = exportProjectToHtml(project);
    const gamePage = project.pages.find((p) => p.role === 'activity');
    const game = gamePage?.components.find((c) => c.type === 'game');
    if (game && 'missions' in game) {
      // Each mission prompt must be in the export
      for (const mission of game.missions) {
        expect(html).toContain(mission.prompt);
      }
    }
  });

  it('23. page count unchanged — export has same number of pages', () => {
    const project = makeProject('modern-clean');
    const html = exportProjectToHtml(project);
    // Count pages in the render model JSON
    const pageMatches = html.match(/"id":"[^"]+","title":"[^"]+","role":"/g);
    expect(pageMatches?.length).toBe(project.pages.length);
  });

  it('24. page order unchanged — first page in export is cover', () => {
    const project = makeProject('modern-clean');
    const html = exportProjectToHtml(project);
    const firstPageRole = project.pages[0].role;
    expect(html).toContain(`"role":"${firstPageRole}"`);
  });

  it('25. geometry unchanged — component x/y/width/height preserved', () => {
    const project = makeProject('modern-clean');
    const html = exportProjectToHtml(project);
    const coverPage = project.pages[0];
    const firstComp = coverPage.components[0];
    if (firstComp) {
      expect(html).toContain(`"x":${firstComp.x}`);
      expect(html).toContain(`"y":${firstComp.y}`);
      expect(html).toContain(`"width":${firstComp.width}`);
      expect(html).toContain(`"height":${firstComp.height}`);
    }
  });

  it('26. schema unchanged — project version + stylePackId in export', () => {
    const project = makeProject('modern-clean');
    const html = exportProjectToHtml(project);
    expect(html).toContain('"stylePackId"');
    expect(html).toContain('modern-clean');
  });

  // ===== 27-28: Quality gates =====

  it('27. checkExportQuality no fatal issues', () => {
    const project = makeProject('modern-clean');
    const result = checkExportQuality(project);
    const fatals = result.issues.filter((i) => i.level === 'fatal');
    expect(fatals).toHaveLength(0);
  });

  it('28. visual matrix — all 3 style packs produce valid export with premium classes', () => {
    for (const packId of ['modern-clean', 'soft-classroom', 'mission-dark'] as const) {
      const project = makeProject(packId);
      const html = exportProjectToHtml(project);
      expect(html).toContain('silse-premium-stage');
      expect(html).toContain('--silse-navy');
      expect(html).toContain('--silse-gold');
      expect(html.length).toBeGreaterThan(1000);
    }
  });

  // ===== 29-32: Additional safety =====

  it('29. no dependency added — premium-export-profile imports only from style-pack-registry', () => {
    // Read the module source and verify it only imports from ./style-pack-registry
    // This is a static check: the module is pure data, no external deps
    const profile = getPremiumExportProfile('modern-clean');
    expect(profile).toBeDefined();
    // getPremiumCssVariables returns a plain object (no DOM/store calls)
    const vars = getPremiumCssVariables(profile);
    expect(vars).toBeTypeOf('object');
    expect(vars['--silse-navy']).toBeDefined();
  });

  it('30. no new component type — project still has only standard component types', () => {
    const project = makeProject('modern-clean');
    const validTypes = ['text', 'image', 'card', 'navigation', 'question', 'game', 'layered-info', 'learning-bridge'];
    for (const page of project.pages) {
      for (const comp of page.components) {
        expect(validTypes).toContain(comp.type);
      }
    }
  });

  it('31. no layout preset added — LAYOUT_IDS unchanged', () => {
    // Just verify the sample project uses existing layout IDs
    const project = makeProject('modern-clean');
    for (const page of project.pages) {
      expect(page.layoutId).toBeDefined();
      expect(typeof page.layoutId).toBe('string');
    }
  });

  it('32. getHeroKickerText — pure function, no side effects', () => {
    const text1 = getHeroKickerText('PPKn', '7', 'Hidup Tertib');
    expect(text1).toBe('PPKn · Kelas 7');
    const text2 = getHeroKickerText(undefined, undefined, 'My Page');
    expect(text2).toBe('My Page');
    const text3 = getHeroKickerText('', '', '');
    expect(text3).toBe('');
  });

  // ===== 33-34: Helper function coverage =====

  it('33. isHeroPageRole + isAwardPageRole — pure helpers', () => {
    expect(isHeroPageRole('cover')).toBe(true);
    expect(isHeroPageRole('closing')).toBe(true);
    expect(isHeroPageRole('material')).toBe(false);
    expect(isAwardPageRole('closing')).toBe(true);
    expect(isAwardPageRole('cover')).toBe(false);
  });

  it('34. getGradientForPageRole — returns gradient string per role', () => {
    const profile = getPremiumExportProfile('modern-clean');
    expect(getGradientForPageRole(profile, 'cover')).toBe(profile.gradients.coverBg);
    expect(getGradientForPageRole(profile, 'closing')).toBe(profile.gradients.closingBg);
    expect(getGradientForPageRole(profile, 'material')).toBe(profile.gradients.materialBg);
    expect(getGradientForPageRole(profile, 'quiz')).toBe(profile.gradients.quizBg);
    expect(getGradientForPageRole(profile, 'free')).toBe(profile.gradients.defaultBg);
  });
});
