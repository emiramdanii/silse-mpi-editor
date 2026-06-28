/**
 * UX-03 Patch-1 — Rich Content Patterns tests.
 *
 * Layer: tests
 *
 * Kontrak (UX-03 Patch-1 acceptance):
 *   1. Halaman Materi punya minimal 7 pola isi.
 *   2. Pola tidak menambah component type liar.
 *   3. Semua pola tetap lewat capability matrix.
 *   4. Materi dengan Gambar diperbaiki: benar-benar ada image component.
 *   5. Pattern reason lebih pedagogis (field pedagogicalReason, bukan hanya "siap diterapkan").
 *   6. Test pattern IDs unik.
 *   7. Test buildComponents fresh IDs.
 *   8. typecheck PASS.
 *   9. test PASS.
 *  10. build PASS.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import { Inspector } from '../editor/Inspector';
import {
  CONTENT_PATTERNS,
  getPatternsForRole,
  getPatternById,
  type PatternContext,
} from '../editor/content-patterns';
import { useEditorStore } from '../store/editor-store';
import { createProject } from '../core/project-factory';
import { PAGE_ROLE_CAPABILITIES } from '../core/capability';
import type { SimplePage, SimpleProject } from '../core/types';
import { createPageId } from '../core/ids';

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
  return { ...project, currentPageId: page.id, pages: [page] };
}

function makeCtx(project: SimpleProject): PatternContext {
  return { project, page: project.pages[0] };
}

// =========================================================================
// Acceptance #1 — Materi minimal 7 pola
// =========================================================================

describe('UX-03 Patch-1 — Acceptance #1: Material has 7+ patterns', () => {
  it('material role has 7 patterns', () => {
    const patterns = getPatternsForRole('material');
    expect(patterns.length).toBeGreaterThanOrEqual(7);
  });

  it('starter role has 7 patterns (1 original + 3 new + 3 LXC-03 bridge)', () => {
    const patterns = getPatternsForRole('starter');
    expect(patterns).toHaveLength(7);
    const ids = patterns.map((p) => p.id);
    expect(ids).toContain('pemantik-pertanyaan');
    expect(ids).toContain('pemantik-kasus');
    expect(ids).toContain('pemantik-setuju');
    expect(ids).toContain('pemantik-poll');
    expect(ids).toContain('bridge-transisi');
    expect(ids).toContain('bridge-recap');
    expect(ids).toContain('bridge-preview');
  });

  it('reflection role has 7 patterns (1 original + 3 new + 3 LXC-03 bridge)', () => {
    const patterns = getPatternsForRole('reflection');
    expect(patterns).toHaveLength(7);
    const ids = patterns.map((p) => p.id);
    expect(ids).toContain('refleksi-diri');
    expect(ids).toContain('refleksi-rumpang');
    expect(ids).toContain('refleksi-komitmen');
    expect(ids).toContain('refleksi-3-2-1');
    expect(ids).toContain('bridge-transisi');
    expect(ids).toContain('bridge-recap');
    expect(ids).toContain('bridge-preview');
  });

  it('closing role has 7 patterns (1 original + 3 new + 3 LXC-03 bridge)', () => {
    const patterns = getPatternsForRole('closing');
    expect(patterns).toHaveLength(7);
    const ids = patterns.map((p) => p.id);
    expect(ids).toContain('penutup-terima-kasih');
    expect(ids).toContain('penutup-badge');
    expect(ids).toContain('penutup-rangkuman');
    expect(ids).toContain('penutup-ajakan');
    expect(ids).toContain('bridge-transisi');
    expect(ids).toContain('bridge-recap');
    expect(ids).toContain('bridge-preview');
  });

  it('total patterns is 30 (LXC-03: 27 → 30, +3 bridge patterns)', () => {
    expect(CONTENT_PATTERNS).toHaveLength(30);
  });
});

// =========================================================================
// Acceptance #2 — Pola tidak menambah component type liar
// =========================================================================

describe('UX-03 Patch-1 — Acceptance #2: no rogue component types', () => {
  it('all pattern components use only known types (text/image/card/navigation/question/game)', () => {
    const knownTypes = new Set(['text', 'image', 'card', 'navigation', 'question', 'game', 'layered-info', 'learning-bridge']);
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
          expect(knownTypes.has(c.type), `pattern ${pattern.id} has unknown type ${c.type}`).toBe(true);
        }
      }
    }
  });
});

// =========================================================================
// Acceptance #3 — Semua pola lewat capability matrix
// =========================================================================

describe('UX-03 Patch-1 — Acceptance #3: capability matrix respected', () => {
  it('all pattern components are allowed by their role capability', () => {
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
          // Some guided roles (cover) have allowAddComponent=false.
          // For those, pattern components should still be of types listed in
          // the capability's allowedComponents (even if can't be added manually).
          const cap = PAGE_ROLE_CAPABILITIES[role];
          if (cap) {
            expect(
              cap.allowedComponents.includes(c.type as never),
              `pattern ${pattern.id} component type ${c.type} not in role ${role} allowedComponents`,
            ).toBe(true);
          }
        }
      }
    }
  });
});

// =========================================================================
// Acceptance #4 — Materi dengan Gambar benar-benar menambah image component
// =========================================================================

describe('UX-03 Patch-1 — Acceptance #4: materi-gambar adds real image', () => {
  it('materi-gambar pattern builds an image component (not just text)', () => {
    const project = buildProjectWithPage('material');
    const pattern = getPatternById('materi-gambar')!;
    const components = pattern.buildComponents(makeCtx(project));
    const imageComponents = components.filter((c) => c.type === 'image');
    expect(imageComponents.length).toBe(1);
    const img = imageComponents[0] as { src: string; alt: string; variant: string };
    // src must be non-empty (data URL placeholder)
    expect(img.src.length).toBeGreaterThan(0);
    expect(img.src).toMatch(/^data:image\//);
    // alt text should describe what to replace
    expect(img.alt.length).toBeGreaterThan(0);
    expect(img.variant).toBe('illustration');
  });

  it('materi-gambar also builds title + body + navigation (total 4 components)', () => {
    const project = buildProjectWithPage('material');
    const pattern = getPatternById('materi-gambar')!;
    const components = pattern.buildComponents(makeCtx(project));
    expect(components).toHaveLength(4);
    const types = components.map((c) => c.type);
    expect(types).toContain('text');
    expect(types).toContain('image');
    expect(types).toContain('navigation');
  });
});

// =========================================================================
// Acceptance #5 — Pattern reason pedagogis
// =========================================================================

describe('UX-03 Patch-1 — Acceptance #5: pedagogical reasons', () => {
  it('every pattern has pedagogicalReason field (non-empty, > 20 chars)', () => {
    for (const p of CONTENT_PATTERNS) {
      expect(p.pedagogicalReason, `${p.id} missing pedagogicalReason`).toBeDefined();
      expect(p.pedagogicalReason.length, `${p.id} reason too short`).toBeGreaterThan(20);
    }
  });

  it('pedagogicalReason explains WHEN to use, not just "siap diterapkan"', () => {
    // No pattern should have a generic "siap diterapkan" reason
    for (const p of CONTENT_PATTERNS) {
      expect(p.pedagogicalReason, `${p.id} has generic reason`).not.toMatch(/siap diterapkan/i);
    }
  });

  it('material patterns have distinct pedagogical reasons', () => {
    const patterns = getPatternsForRole('material');
    const reasons = patterns.map((p) => p.pedagogicalReason);
    // All reasons should be unique
    expect(new Set(reasons).size).toBe(reasons.length);
  });

  it('PatternLibraryPanel displays pedagogicalReason in pattern card', () => {
    useEditorStore.getState().newProject();
    useEditorStore.getState().addPage({ role: 'material' });
    const { container } = render(React.createElement(Inspector));
    const reasonEl = container.querySelector('[data-testid="pattern-reason-materi-tunggal"]');
    expect(reasonEl).not.toBeNull();
    // Should contain pedagogical text, not generic "siap diterapkan"
    expect(reasonEl?.textContent ?? '').not.toMatch(/siap diterapkan/i);
    expect(reasonEl?.textContent?.length ?? 0).toBeGreaterThan(20);
  });

  it('PatternLibraryPanel also shows hint (page-state context)', () => {
    useEditorStore.getState().newProject();
    useEditorStore.getState().addPage({ role: 'material' });
    const { container } = render(React.createElement(Inspector));
    const hintEl = container.querySelector('[data-testid="pattern-hint-materi-tunggal"]');
    expect(hintEl).not.toBeNull();
    // Hint should mention "kosong" since page is empty
    expect(hintEl?.textContent ?? '').toMatch(/kosong/i);
  });
});

// =========================================================================
// Acceptance #6 — Pattern IDs unik
// =========================================================================

describe('UX-03 Patch-1 — Acceptance #6: unique pattern IDs', () => {
  it('all 30 pattern IDs are unique', () => {
    const ids = CONTENT_PATTERNS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(30);
  });

  it('all pattern IDs match snake-case format (lowercase, hyphens)', () => {
    for (const p of CONTENT_PATTERNS) {
      expect(p.id, `${p.id} is not snake-case`).toMatch(/^[a-z0-9-]+$/);
    }
  });
});

// =========================================================================
// Acceptance #7 — buildComponents fresh IDs
// =========================================================================

describe('UX-03 Patch-1 — Acceptance #7: fresh IDs from buildComponents', () => {
  it('calling buildComponents twice produces different IDs', () => {
    const project = buildProjectWithPage('material');
    const pattern = getPatternById('materi-tunggal')!;
    const ctx = makeCtx(project);
    const c1 = pattern.buildComponents(ctx);
    const c2 = pattern.buildComponents(ctx);
    const ids1 = c1.map((c) => c.id);
    const ids2 = c2.map((c) => c.id);
    expect(ids1).not.toEqual(ids2);
  });

  it('fresh IDs across ALL 30 patterns', () => {
    const roles: SimplePage['role'][] = [
      'cover', 'guide', 'learningObjectives', 'menu',
      'starter', 'material', 'quiz', 'activity', 'reflection', 'closing',
    ];
    for (const role of roles) {
      const project = buildProjectWithPage(role);
      const ctx = makeCtx(project);
      const patterns = getPatternsForRole(role);
      for (const pattern of patterns) {
        const c1 = pattern.buildComponents(ctx);
        const c2 = pattern.buildComponents(ctx);
        const ids1 = new Set(c1.map((c) => c.id));
        const ids2 = new Set(c2.map((c) => c.id));
        // No overlap between two calls
        const overlap = [...ids1].filter((id) => ids2.has(id));
        expect(overlap, `pattern ${pattern.id} has ID collision`).toEqual([]);
      }
    }
  });
});

// =========================================================================
// New pattern buildComponents verification
// =========================================================================

describe('UX-03 Patch-1 — new patterns buildComponents sanity', () => {
  it('materi-kartu-konsep builds 4 info cards + title + navigation', () => {
    const project = buildProjectWithPage('material');
    const pattern = getPatternById('materi-kartu-konsep')!;
    const components = pattern.buildComponents(makeCtx(project));
    expect(components.length).toBe(6); // title + 4 cards + nav
    const cards = components.filter((c) => c.type === 'card');
    expect(cards).toHaveLength(4);
  });

  it('materi-contoh-vs-bukan builds 3 cards (contoh + bukan + ciri pembeda)', () => {
    const project = buildProjectWithPage('material');
    const pattern = getPatternById('materi-contoh-vs-bukan')!;
    const components = pattern.buildComponents(makeCtx(project));
    const cards = components.filter((c) => c.type === 'card');
    expect(cards.length).toBeGreaterThanOrEqual(3);
  });

  it('materi-fakta-mitos builds 3 cards (fakta + mitos + klarifikasi)', () => {
    const project = buildProjectWithPage('material');
    const pattern = getPatternById('materi-fakta-mitos')!;
    const components = pattern.buildComponents(makeCtx(project));
    const cards = components.filter((c) => c.type === 'card');
    expect(cards.length).toBeGreaterThanOrEqual(3);
  });

  it('materi-step-by-step builds 4 numbered step cards', () => {
    const project = buildProjectWithPage('material');
    const pattern = getPatternById('materi-step-by-step')!;
    const components = pattern.buildComponents(makeCtx(project));
    const cards = components.filter((c) => c.type === 'card');
    expect(cards).toHaveLength(4);
  });

  it('materi-mini-checkpoint builds materi + cek pemahaman + ringkasan', () => {
    const project = buildProjectWithPage('material');
    const pattern = getPatternById('materi-mini-checkpoint')!;
    const components = pattern.buildComponents(makeCtx(project));
    expect(components.some((c) => c.type === 'text')).toBe(true);
    expect(components.some((c) => c.type === 'card')).toBe(true);
    expect(components.some((c) => c.type === 'navigation')).toBe(true);
  });

  it('pemantik-kasus builds title + example card + question prompt + nav', () => {
    const project = buildProjectWithPage('starter');
    const pattern = getPatternById('pemantik-kasus')!;
    const components = pattern.buildComponents(makeCtx(project));
    expect(components.some((c) => c.type === 'text')).toBe(true);
    expect(components.some((c) => c.type === 'card')).toBe(true);
    expect(components.some((c) => c.type === 'navigation')).toBe(true);
  });

  it('pemantik-setuju builds question prompt + important note + nav', () => {
    const project = buildProjectWithPage('starter');
    const pattern = getPatternById('pemantik-setuju')!;
    const components = pattern.buildComponents(makeCtx(project));
    expect(components.some((c) => c.type === 'card')).toBe(true);
    expect(components.some((c) => c.type === 'navigation')).toBe(true);
  });

  it('pemantik-poll builds question + 3 info cards + discussion card + nav', () => {
    const project = buildProjectWithPage('starter');
    const pattern = getPatternById('pemantik-poll')!;
    const components = pattern.buildComponents(makeCtx(project));
    const cards = components.filter((c) => c.type === 'card');
    expect(cards.length).toBeGreaterThanOrEqual(4); // 3 poll + 1 discussion
  });

  it('refleksi-rumpang builds title + important note with blanks + nav', () => {
    const project = buildProjectWithPage('reflection');
    const pattern = getPatternById('refleksi-rumpang')!;
    const components = pattern.buildComponents(makeCtx(project));
    expect(components.some((c) => c.type === 'text')).toBe(true);
    expect(components.some((c) => c.type === 'card')).toBe(true);
    // Card body should have blank markers (____)
    const card = components.find((c) => c.type === 'card') as { body: string } | undefined;
    expect(card?.body).toMatch(/_{3,}/);
  });

  it('refleksi-komitmen builds title + important note with checklist + nav', () => {
    const project = buildProjectWithPage('reflection');
    const pattern = getPatternById('refleksi-komitmen')!;
    const components = pattern.buildComponents(makeCtx(project));
    const card = components.find((c) => c.type === 'card') as { body: string } | undefined;
    // Checklist markers (☐)
    expect(card?.body).toMatch(/☐/);
  });

  it('refleksi-3-2-1 builds title + important note with 3-2-1 structure', () => {
    const project = buildProjectWithPage('reflection');
    const pattern = getPatternById('refleksi-3-2-1')!;
    const components = pattern.buildComponents(makeCtx(project));
    const card = components.find((c) => c.type === 'card') as { body: string } | undefined;
    expect(card?.body).toMatch(/3/);
    expect(card?.body).toMatch(/2/);
    expect(card?.body).toMatch(/1/);
  });

  it('penutup-badge builds a celebratory card', () => {
    const project = buildProjectWithPage('closing');
    const pattern = getPatternById('penutup-badge')!;
    const components = pattern.buildComponents(makeCtx(project));
    expect(components.some((c) => c.type === 'card')).toBe(true);
    const card = components.find((c) => c.type === 'card') as { body: string } | undefined;
    expect(card?.body).toMatch(/Selamat/i);
  });

  it('penutup-rangkuman builds title + info card with 3 poin', () => {
    const project = buildProjectWithPage('closing');
    const pattern = getPatternById('penutup-rangkuman')!;
    const components = pattern.buildComponents(makeCtx(project));
    expect(components.some((c) => c.type === 'text')).toBe(true);
    expect(components.some((c) => c.type === 'card')).toBe(true);
  });

  it('penutup-ajakan builds title + important note with practice call', () => {
    const project = buildProjectWithPage('closing');
    const pattern = getPatternById('penutup-ajakan')!;
    const components = pattern.buildComponents(makeCtx(project));
    const card = components.find((c) => c.type === 'card') as { body: string } | undefined;
    expect(card?.body).toMatch(/hari ini|praktik|lakukan/i);
  });
});

// =========================================================================
// UI rendering for new patterns
// =========================================================================

describe('UX-03 Patch-1 — UI rendering for new patterns', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('starter page shows 7 pattern cards (1 original + 3 new + 3 LXC-03 bridge)', () => {
    useEditorStore.getState().addPage({ role: 'starter' });
    const { container } = render(React.createElement(Inspector));
    const cards = container.querySelectorAll('.pattern-card');
    expect(cards).toHaveLength(7);
  });

  it('reflection page shows 7 pattern cards', () => {
    useEditorStore.getState().addPage({ role: 'reflection' });
    const { container } = render(React.createElement(Inspector));
    const cards = container.querySelectorAll('.pattern-card');
    expect(cards).toHaveLength(7);
  });

  it('closing page shows 7 pattern cards', () => {
    useEditorStore.getState().addPage({ role: 'closing' });
    const { container } = render(React.createElement(Inspector));
    const cards = container.querySelectorAll('.pattern-card');
    expect(cards).toHaveLength(7);
  });

  it('clicking Terapkan on materi-kartu-konsep adds 6 components', () => {
    useEditorStore.getState().addPage({ role: 'material' });
    const pageId = useEditorStore.getState().project.currentPageId;
    const { container } = render(React.createElement(Inspector));
    const applyBtn = container.querySelector('[data-testid="pattern-apply-materi-kartu-konsep"]') as HTMLButtonElement;
    fireEvent.click(applyBtn);
    const page = useEditorStore.getState().project.pages.find((p) => p.id === pageId)!;
    // title + 4 cards + nav = 6
    expect(page.components.length).toBe(6);
  });

  it('clicking Terapkan on materi-gambar adds 4 components including 1 image', () => {
    useEditorStore.getState().addPage({ role: 'material' });
    const pageId = useEditorStore.getState().project.currentPageId;
    const { container } = render(React.createElement(Inspector));
    const applyBtn = container.querySelector('[data-testid="pattern-apply-materi-gambar"]') as HTMLButtonElement;
    fireEvent.click(applyBtn);
    const page = useEditorStore.getState().project.pages.find((p) => p.id === pageId)!;
    expect(page.components.length).toBe(4);
    expect(page.components.filter((c) => c.type === 'image')).toHaveLength(1);
  });
});

// =========================================================================
// Regression
// =========================================================================

describe('UX-03 Patch-1 — regression', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('all 30 patterns have valid x/y/width/height on every component', () => {
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
          expect(c.x, `${pattern.id} x`).toBeGreaterThanOrEqual(0);
          expect(c.y, `${pattern.id} y`).toBeGreaterThanOrEqual(0);
          expect(c.width, `${pattern.id} width`).toBeGreaterThan(0);
          expect(c.height, `${pattern.id} height`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('Inspector still has Panel Isi header (UX-01 contract)', () => {
    useEditorStore.getState().addPage({ role: 'material' });
    const { container } = render(React.createElement(Inspector));
    expect(container.textContent ?? '').toMatch(/Panel Isi/);
  });

  it('PatternLibraryPanel does NOT contain "block" in user-facing text', () => {
    useEditorStore.getState().addPage({ role: 'material' });
    const { container } = render(React.createElement(Inspector));
    const panel = container.querySelector('[data-testid="pattern-library"]');
    expect(panel?.textContent ?? '').not.toMatch(/\bblock\b/i);
  });
});
