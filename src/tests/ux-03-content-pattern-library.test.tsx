/**
 * UX-03 — Content Pattern Library + Smart Teaching Suggestion tests.
 *
 * Layer: tests
 *
 * Kontrak (UX-03):
 *   1. Content Pattern Library: 12 pola predefined per role.
 *   2. Smart Teaching Suggestion: engine beri saran berdasarkan kondisi halaman.
 *   3. Store action addComponentsToPage: apply pola dengan capability check.
 *   4. PatternLibraryPanel: UI yang tampil di Inspector saat tidak ada komponen terpilih.
 *   5. Guru bisa pilih pola → klik Terapkan → komponen ditambahkan ke halaman.
 *
 *   Tidak menambah fitur MPI baru — hanya UI layer + store action baru.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import { Inspector } from '../editor/Inspector';
import {
  CONTENT_PATTERNS,
  getPatternsForRole,
  getPatternById,
  getPrimaryPatternForRole,
  type PatternContext,
} from '../editor/content-patterns';
import {
  suggestPatternsForPage,
  classifyPageState,
  getSuggestionHeader,
  getSuggestionSubHeader,
} from '../editor/teaching-suggestion';
import { useEditorStore } from '../store/editor-store';
import { createSamplePpknProject } from '../core/sample-project';
import { createProject } from '../core/project-factory';
import type { SimplePage, SimpleProject, PageComponent } from '../core/types';
import { createPageId, createComponentId } from '../core/ids';

// Helper: build a minimal project with one page of given role
function buildProjectWithPage(role: SimplePage['role']): SimpleProject {
  const project = createProject();
  const page: SimplePage = {
    id: createPageId(),
    title: `Test ${role}`,
    role,
    layoutId: 'blank',
    background: { type: 'color', color: '#ffffff' },
    components: [],
  };
  return {
    ...project,
    currentPageId: page.id,
    pages: [page],
  };
}

// Helper: build a minimal project with one page that has some components
function buildProjectWithPageAndComponents(
  role: SimplePage['role'],
  components: PageComponent[],
): SimpleProject {
  const project = buildProjectWithPage(role);
  return {
    ...project,
    pages: project.pages.map((p) => ({ ...p, components })),
  };
}

function makeCtx(project: SimpleProject): PatternContext {
  return {
    project,
    page: project.pages[0],
  };
}

// =========================================================================
// Scope A — Content Patterns
// =========================================================================

describe('UX-03 — Content Patterns library', () => {
  it('has exactly 27 predefined patterns (LXC-02: 26 → 27, +tujuan-berlapis)', () => {
    expect(CONTENT_PATTERNS).toHaveLength(27);
  });

  it('each pattern has id, name, description, icon, applicableRoles, pedagogicalReason, buildComponents', () => {
    for (const p of CONTENT_PATTERNS) {
      expect(p.id.length).toBeGreaterThan(0);
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.description.length).toBeGreaterThan(0);
      expect(p.icon.length).toBeGreaterThan(0);
      expect(p.applicableRoles.length).toBeGreaterThan(0);
      // UX-03 Patch-1: pedagogicalReason wajib, bukan hanya "siap diterapkan"
      expect(p.pedagogicalReason.length).toBeGreaterThan(20);
      expect(typeof p.buildComponents).toBe('function');
    }
  });

  it('all pattern IDs are unique', () => {
    const ids = CONTENT_PATTERNS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every standard role (except free) has at least one pattern', () => {
    const standardRoles = [
      'cover', 'guide', 'learningObjectives', 'menu',
      'starter', 'material', 'quiz', 'activity', 'reflection', 'closing',
    ] as const;
    for (const role of standardRoles) {
      expect(getPatternsForRole(role).length).toBeGreaterThan(0);
    }
  });

  it('free role has no patterns', () => {
    expect(getPatternsForRole('free')).toHaveLength(0);
  });

  it('material role has 7 patterns (UX-03 Patch-1: 2 → 7)', () => {
    const patterns = getPatternsForRole('material');
    expect(patterns).toHaveLength(7);
    expect(patterns[0].id).toBe('materi-tunggal');
    expect(patterns[1].id).toBe('materi-gambar');
    // 5 new patterns from UX-03 Patch-1
    const ids = patterns.map((p) => p.id);
    expect(ids).toContain('materi-kartu-konsep');
    expect(ids).toContain('materi-contoh-vs-bukan');
    expect(ids).toContain('materi-fakta-mitos');
    expect(ids).toContain('materi-step-by-step');
    expect(ids).toContain('materi-mini-checkpoint');
  });

  it('menu role has 2 patterns (peta + daftar)', () => {
    const patterns = getPatternsForRole('menu');
    expect(patterns).toHaveLength(2);
    expect(patterns[0].id).toBe('menu-peta');
    expect(patterns[1].id).toBe('menu-daftar');
  });

  it('getPatternById returns the pattern or undefined', () => {
    expect(getPatternById('cover-title')).toBeDefined();
    expect(getPatternById('non-existent')).toBeUndefined();
  });

  it('getPrimaryPatternForRole returns the first applicable pattern', () => {
    expect(getPrimaryPatternForRole('cover')?.id).toBe('cover-title');
    expect(getPrimaryPatternForRole('material')?.id).toBe('materi-tunggal');
    expect(getPrimaryPatternForRole('free')).toBeUndefined();
  });

  it('buildComponents returns array of PageComponent with fresh IDs', () => {
    const project = buildProjectWithPage('cover');
    const ctx = makeCtx(project);
    const pattern = getPatternById('cover-title')!;
    const components1 = pattern.buildComponents(ctx);
    const components2 = pattern.buildComponents(ctx);
    expect(components1.length).toBeGreaterThan(0);
    expect(components2.length).toBe(components1.length);
    // IDs must be different across calls (fresh IDs)
    const ids1 = components1.map((c) => c.id);
    const ids2 = components2.map((c) => c.id);
    expect(ids1).not.toEqual(ids2);
  });

  it('cover-title pattern builds 2 text components (title + subtitle)', () => {
    const project = buildProjectWithPage('cover');
    const pattern = getPatternById('cover-title')!;
    const components = pattern.buildComponents(makeCtx(project));
    expect(components).toHaveLength(2);
    expect(components.every((c) => c.type === 'text')).toBe(true);
    const variants = components.map((c) => (c as { variant: string }).variant);
    expect(variants).toContain('title');
    expect(variants).toContain('subtitle');
  });

  it('guide-petunjuk pattern builds text + card + navigation', () => {
    const project = buildProjectWithPage('guide');
    const pattern = getPatternById('guide-petunjuk')!;
    const components = pattern.buildComponents(makeCtx(project));
    expect(components).toHaveLength(3);
    const types = components.map((c) => c.type);
    expect(types).toContain('text');
    expect(types).toContain('card');
    expect(types).toContain('navigation');
  });

  it('tujuan-daftar pattern reads curriculum.objectives when available', () => {
    const project = buildProjectWithPage('learningObjectives');
    project.curriculum = {
      subject: 'PPKn',
      grade: '7',
      phase: 'D',
      topic: 'Norma',
      objectives: [
        { id: createComponentId(), text: 'Tujuan A' },
        { id: createComponentId(), text: 'Tujuan B' },
      ],
    };
    const pattern = getPatternById('tujuan-daftar')!;
    const components = pattern.buildComponents(makeCtx(project));
    // Should have title + body text + navigation
    expect(components).toHaveLength(3);
    const bodyText = components.find(
      (c) => c.type === 'text' && (c as { variant: string }).variant === 'body',
    ) as { text: string } | undefined;
    expect(bodyText).toBeDefined();
    expect(bodyText!.text).toMatch(/Tujuan A/);
    expect(bodyText!.text).toMatch(/Tujuan B/);
  });

  it('tujuan-daftar pattern falls back to placeholder text when no curriculum', () => {
    const project = buildProjectWithPage('learningObjectives');
    // No curriculum set
    const pattern = getPatternById('tujuan-daftar')!;
    const components = pattern.buildComponents(makeCtx(project));
    const bodyText = components.find(
      (c) => c.type === 'text' && (c as { variant: string }).variant === 'body',
    ) as { text: string } | undefined;
    expect(bodyText).toBeDefined();
    expect(bodyText!.text).toMatch(/Tujuan pembelajaran pertama/i);
  });

  it('kuis-pilgan pattern builds question + navigation', () => {
    const project = buildProjectWithPage('quiz');
    const pattern = getPatternById('kuis-pilgan')!;
    const components = pattern.buildComponents(makeCtx(project));
    expect(components).toHaveLength(2);
    expect(components[0].type).toBe('question');
    expect(components[1].type).toBe('navigation');
    const q = components[0] as { choices: unknown[]; correctChoiceIndex: number };
    expect(q.choices).toHaveLength(4);
    expect(q.correctChoiceIndex).toBe(0);
  });

  it('game-misi pattern builds game with 2 missions + navigation', () => {
    const project = buildProjectWithPage('activity');
    const pattern = getPatternById('game-misi')!;
    const components = pattern.buildComponents(makeCtx(project));
    expect(components).toHaveLength(2);
    expect(components[0].type).toBe('game');
    expect(components[1].type).toBe('navigation');
    const g = components[0] as { missions: { prompt: string; choices: unknown[] }[] };
    expect(g.missions).toHaveLength(2);
  });

  it('all pattern components have valid x/y/width/height', () => {
    const roles: SimplePage['role'][] = [
      'cover', 'guide', 'learningObjectives', 'menu',
      'starter', 'material', 'quiz', 'activity', 'reflection', 'closing',
    ];
    for (const role of roles) {
      const project = buildProjectWithPage(role);
      const patterns = getPatternsForRole(role);
      for (const pattern of patterns) {
        const components = pattern.buildComponents(makeCtx(project));
        for (const c of components) {
          expect(c.x).toBeGreaterThanOrEqual(0);
          expect(c.y).toBeGreaterThanOrEqual(0);
          expect(c.width).toBeGreaterThan(0);
          expect(c.height).toBeGreaterThan(0);
        }
      }
    }
  });
});

// =========================================================================
// Scope B — Teaching Suggestion engine
// =========================================================================

describe('UX-03 — Teaching Suggestion engine', () => {
  it('classifyPageState returns "empty" for page with no components', () => {
    const page: SimplePage = {
      id: createPageId(),
      title: 'Test',
      role: 'material',
      layoutId: 'blank',
      background: { type: 'color', color: '#fff' },
      components: [],
    };
    expect(classifyPageState(page)).toBe('empty');
  });

  it('classifyPageState returns "has-issues" for page with issues', () => {
    // material with text but no navigation → warning
    const page: SimplePage = {
      id: createPageId(),
      title: 'Test',
      role: 'material',
      layoutId: 'blank',
      background: { type: 'color', color: '#fff' },
      components: [
        {
          id: createComponentId(),
          type: 'text',
          variant: 'body',
          text: 'Materi',
          x: 80, y: 80, width: 400, height: 80,
        } as PageComponent,
      ],
    };
    expect(classifyPageState(page)).toBe('has-issues');
  });

  it('classifyPageState returns "ok" for complete page', () => {
    // material with text + navigation → ok
    const page: SimplePage = {
      id: createPageId(),
      title: 'Test',
      role: 'material',
      layoutId: 'blank',
      background: { type: 'color', color: '#fff' },
      components: [
        {
          id: createComponentId(),
          type: 'text',
          variant: 'body',
          text: 'Materi',
          x: 80, y: 80, width: 400, height: 80,
        } as PageComponent,
        {
          id: createComponentId(),
          type: 'navigation',
          variant: 'primaryAction',
          label: 'Next',
          action: 'next',
          x: 900, y: 620, width: 300, height: 60,
        } as PageComponent,
      ],
    };
    expect(classifyPageState(page)).toBe('ok');
  });

  it('empty page → primary pattern first with priority="primary"', () => {
    const project = buildProjectWithPage('material');
    const suggestions = suggestPatternsForPage(project.pages[0], project);
    // UX-03 Patch-1: material now has 7 patterns
    expect(suggestions.length).toBe(7);
    expect(suggestions[0].priority).toBe('primary');
    expect(suggestions[0].pattern.id).toBe('materi-tunggal');
    expect(suggestions[0].reason).toMatch(/kosong/i);
  });

  it('empty page → secondary patterns with priority="secondary"', () => {
    const project = buildProjectWithPage('material');
    const suggestions = suggestPatternsForPage(project.pages[0], project);
    // UX-03 Patch-1: 6 secondary patterns (index 1-6)
    expect(suggestions[1].priority).toBe('secondary');
    expect(suggestions[6].priority).toBe('secondary');
    expect(suggestions[1].reason).toMatch(/alternatif/i);
  });

  it('has-issues page → primary with reason about "melengkapi"', () => {
    const project = buildProjectWithPageAndComponents('material', [
      {
        id: createComponentId(),
        type: 'text',
        variant: 'body',
        text: 'Materi',
        x: 80, y: 80, width: 400, height: 80,
      } as PageComponent,
    ]);
    const suggestions = suggestPatternsForPage(project.pages[0], project);
    expect(suggestions[0].priority).toBe('primary');
    expect(suggestions[0].reason).toMatch(/belum lengkap|melengkapi/i);
  });

  it('ok page → all suggestions have priority="secondary"', () => {
    const project = buildProjectWithPageAndComponents('material', [
      {
        id: createComponentId(),
        type: 'text',
        variant: 'body',
        text: 'Materi',
        x: 80, y: 80, width: 400, height: 80,
      } as PageComponent,
      {
        id: createComponentId(),
        type: 'navigation',
        variant: 'primaryAction',
        label: 'Next',
        action: 'next',
        x: 900, y: 620, width: 300, height: 60,
      } as PageComponent,
    ]);
    const suggestions = suggestPatternsForPage(project.pages[0], project);
    expect(suggestions.every((s) => s.priority === 'secondary')).toBe(true);
    expect(suggestions[0].reason).toMatch(/alternatif/i);
  });

  it('free role → no suggestions', () => {
    const project = buildProjectWithPage('free');
    const suggestions = suggestPatternsForPage(project.pages[0], project);
    expect(suggestions).toHaveLength(0);
  });

  it('getSuggestionHeader returns correct header per page state', () => {
    expect(getSuggestionHeader('empty')).toMatch(/Saran Isi/);
    expect(getSuggestionHeader('has-issues')).toMatch(/Saran Pelengkap/);
    expect(getSuggestionHeader('ok')).toMatch(/Pola Alternatif/);
  });

  it('getSuggestionSubHeader returns helpful description per page state', () => {
    expect(getSuggestionSubHeader('empty')).toMatch(/Pilih pola/i);
    expect(getSuggestionSubHeader('has-issues')).toMatch(/melengkapi/i);
    expect(getSuggestionSubHeader('ok')).toMatch(/alternatif/i);
  });
});

// =========================================================================
// Scope C — Store action addComponentsToPage
// =========================================================================

describe('UX-03 — Store action addComponentsToPage', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('adds components to the specified page', () => {
    useEditorStore.getState().addPage({ role: 'material' });
    const pageId = useEditorStore.getState().project.currentPageId;
    const pattern = getPatternById('materi-tunggal')!;
    const project = useEditorStore.getState().project;
    const components = pattern.buildComponents({
      project,
      page: project.pages.find((p) => p.id === pageId)!,
    });
    const added = useEditorStore.getState().addComponentsToPage(pageId, components);
    expect(added).toBe(components.length);
    const page = useEditorStore.getState().project.pages.find((p) => p.id === pageId)!;
    expect(page.components.length).toBe(components.length);
  });

  it('skips disallowed component types (capability check)', () => {
    // cover is guided — allowAddComponent=false → nothing added.
    // Cover page starts with pre-filled title component(s) from createProject().
    useEditorStore.getState().newProject(); // creates cover page
    const coverPageId = useEditorStore.getState().project.currentPageId;
    const beforeCount = useEditorStore.getState().project.pages.find(
      (p) => p.id === coverPageId,
    )!.components.length;
    const pattern = getPatternById('cover-title')!;
    const project = useEditorStore.getState().project;
    const components = pattern.buildComponents({
      project,
      page: project.pages.find((p) => p.id === coverPageId)!,
    });
    const added = useEditorStore.getState().addComponentsToPage(coverPageId, components);
    expect(added).toBe(0);
    const afterCount = useEditorStore.getState().project.pages.find(
      (p) => p.id === coverPageId,
    )!.components.length;
    // Count should not change (nothing was added)
    expect(afterCount).toBe(beforeCount);
  });

  it('returns 0 for non-existent page', () => {
    const components = [
      {
        id: createComponentId(),
        type: 'text',
        variant: 'body',
        text: 'Test',
        x: 0, y: 0, width: 100, height: 100,
      } as PageComponent,
    ];
    const added = useEditorStore.getState().addComponentsToPage('non-existent', components);
    expect(added).toBe(0);
  });

  it('does not auto-select any component after adding', () => {
    useEditorStore.getState().addPage({ role: 'material' });
    const pageId = useEditorStore.getState().project.currentPageId;
    const pattern = getPatternById('materi-tunggal')!;
    const project = useEditorStore.getState().project;
    const components = pattern.buildComponents({
      project,
      page: project.pages.find((p) => p.id === pageId)!,
    });
    useEditorStore.getState().selectComponent('something'); // set a selection
    useEditorStore.getState().addComponentsToPage(pageId, components);
    expect(useEditorStore.getState().selectedComponentId).toBeNull();
  });

  it('applied pattern components have fresh IDs (no collision)', () => {
    useEditorStore.getState().addPage({ role: 'material' });
    const pageId = useEditorStore.getState().project.currentPageId;
    const project = useEditorStore.getState().project;
    const ctx = {
      project,
      page: project.pages.find((p) => p.id === pageId)!,
    };
    // Apply same pattern twice
    const pattern = getPatternById('materi-tunggal')!;
    const comps1 = pattern.buildComponents(ctx);
    const comps2 = pattern.buildComponents(ctx);
    useEditorStore.getState().addComponentsToPage(pageId, comps1);
    useEditorStore.getState().addComponentsToPage(pageId, comps2);
    const page = useEditorStore.getState().project.pages.find((p) => p.id === pageId)!;
    const ids = page.components.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length); // all unique
  });
});

// =========================================================================
// Scope D — PatternLibraryPanel UI
// =========================================================================

describe('UX-03 — PatternLibraryPanel UI', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('renders pattern library panel when no component selected', () => {
    // Use a free page (no guided restriction) so patterns show
    useEditorStore.getState().addPage({ role: 'material' });
    useEditorStore.getState().selectComponent(null);
    const { container } = render(React.createElement(Inspector));
    expect(container.querySelector('[data-testid="pattern-library"]')).not.toBeNull();
  });

  it('does NOT render pattern library when a component is selected', () => {
    useEditorStore.getState().addPage({ role: 'material' });
    useEditorStore.getState().addTextComponent();
    const { container } = render(React.createElement(Inspector));
    expect(container.querySelector('[data-testid="pattern-library"]')).toBeNull();
  });

  it('material page shows 7 pattern cards (UX-03 Patch-1: 2 → 7)', () => {
    useEditorStore.getState().addPage({ role: 'material' });
    const { container } = render(React.createElement(Inspector));
    const cards = container.querySelectorAll('.pattern-card');
    expect(cards).toHaveLength(7);
    expect(container.querySelector('[data-testid="pattern-card-materi-tunggal"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="pattern-card-materi-gambar"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="pattern-card-materi-kartu-konsep"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="pattern-card-materi-contoh-vs-bukan"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="pattern-card-materi-fakta-mitos"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="pattern-card-materi-step-by-step"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="pattern-card-materi-mini-checkpoint"]')).not.toBeNull();
  });

  it('primary pattern card has is-primary class + "Disarankan" badge', () => {
    useEditorStore.getState().addPage({ role: 'material' });
    const { container } = render(React.createElement(Inspector));
    const primaryCard = container.querySelector('.pattern-card.is-primary');
    expect(primaryCard).not.toBeNull();
    const badge = primaryCard?.querySelector('[data-testid^="pattern-badge-"]');
    expect(badge?.textContent).toMatch(/Disarankan/i);
  });

  it('each pattern card has apply button with data-pattern-id', () => {
    useEditorStore.getState().addPage({ role: 'material' });
    const { container } = render(React.createElement(Inspector));
    const applyBtn = container.querySelector('[data-testid="pattern-apply-materi-tunggal"]');
    expect(applyBtn).not.toBeNull();
    expect(applyBtn?.getAttribute('data-pattern-id')).toBe('materi-tunggal');
  });

  it('clicking Terapkan adds components to the page', () => {
    useEditorStore.getState().addPage({ role: 'material' });
    const pageId = useEditorStore.getState().project.currentPageId;
    const { container } = render(React.createElement(Inspector));
    const applyBtn = container.querySelector('[data-testid="pattern-apply-materi-tunggal"]') as HTMLButtonElement;
    fireEvent.click(applyBtn);
    const page = useEditorStore.getState().project.pages.find((p) => p.id === pageId)!;
    // materi-tunggal builds 4 components: title + body + card + navigation
    expect(page.components.length).toBe(4);
  });

  it('cover page (guided) apply button adds 0 components', () => {
    // Cover is guided — addComponentsToPage returns 0.
    // Cover page starts with pre-filled title component(s) from createProject().
    const beforeCount = useEditorStore.getState().project.pages[0].components.length;
    const { container } = render(React.createElement(Inspector));
    const applyBtn = container.querySelector('[data-testid="pattern-apply-cover-title"]') as HTMLButtonElement;
    // Mock window.alert to suppress the "tidak bisa ditambah" message
    const originalAlert = window.alert;
    window.alert = () => {};
    fireEvent.click(applyBtn);
    window.alert = originalAlert;
    const coverPage = useEditorStore.getState().project.pages[0];
    // Count should not change (nothing was added to guided page)
    expect(coverPage.components.length).toBe(beforeCount);
  });

  it('header text changes based on page state (empty → "Saran Isi")', () => {
    useEditorStore.getState().addPage({ role: 'material' }); // empty
    const { container } = render(React.createElement(Inspector));
    const title = container.querySelector('.pattern-library__title');
    expect(title?.textContent).toMatch(/Saran Isi/);
  });

  it('header text changes to "Saran Pelengkap" when page has issues', () => {
    useEditorStore.getState().addPage({ role: 'material' });
    // Add a text component but no navigation → has-issues state
    useEditorStore.getState().addTextComponent();
    useEditorStore.getState().selectComponent(null);
    const { container } = render(React.createElement(Inspector));
    const title = container.querySelector('.pattern-library__title');
    expect(title?.textContent).toMatch(/Saran Pelengkap/);
  });

  it('header text changes to "Pola Alternatif" when page is ok', () => {
    useEditorStore.getState().addPage({ role: 'material' });
    // Add text + navigation → ok state
    useEditorStore.getState().addTextComponent();
    useEditorStore.getState().addNavigationComponent('Next', 'next');
    useEditorStore.getState().selectComponent(null);
    const { container } = render(React.createElement(Inspector));
    const title = container.querySelector('.pattern-library__title');
    expect(title?.textContent).toMatch(/Pola Alternatif/);
  });

  it('sample PPKn pages: each standard page renders pattern library', () => {
    useEditorStore.getState().setProject(createSamplePpknProject());
    // Pages are all "ok" (sample is complete) — should show "Pola Alternatif"
    const { container } = render(React.createElement(Inspector));
    expect(container.querySelector('[data-testid="pattern-library"]')).not.toBeNull();
    const title = container.querySelector('.pattern-library__title');
    expect(title?.textContent).toMatch(/Pola Alternatif/);
  });

  it('does not render for free page (no patterns)', () => {
    useEditorStore.getState().addPage({ role: 'free' });
    const { container } = render(React.createElement(Inspector));
    expect(container.querySelector('[data-testid="pattern-library"]')).toBeNull();
  });
});

// =========================================================================
// Regression — no contract break
// =========================================================================

describe('UX-03 — regression (no contract break)', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('PatternLibraryPanel does NOT contain "block" in user-facing text', () => {
    useEditorStore.getState().addPage({ role: 'material' });
    const { container } = render(React.createElement(Inspector));
    const panel = container.querySelector('[data-testid="pattern-library"]');
    expect(panel?.textContent ?? '').not.toMatch(/\bblock\b/i);
  });

  it('all pattern IDs are valid data-pattern-id (no spaces, lowercase)', () => {
    for (const p of CONTENT_PATTERNS) {
      expect(p.id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('Inspector still has Panel Isi header (UX-01 contract)', () => {
    const { container } = render(React.createElement(Inspector));
    expect(container.textContent ?? '').toMatch(/Panel Isi/);
  });
});
