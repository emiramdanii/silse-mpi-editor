/**
 * PAGE-THUMBNAIL-SIDEBAR-V1 tests.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import { PagePanel } from '../editor/PagePanel';
import { PageThumbnail } from '../editor/PageThumbnail';
import { useEditorStore } from '../store/editor-store';
import { createSamplePpknProject } from '../core/sample-project';
import type { SimplePage } from '../core/types';
import { createPageId } from '../core/ids';

// =========================================================================
// PageThumbnail component
// =========================================================================

describe('PAGE-THUMBNAIL-SIDEBAR-V1 — PageThumbnail', () => {
  it('renders thumbnail with canvas + footer', () => {
    const page: SimplePage = {
      id: createPageId(),
      title: 'Test',
      role: 'material',
      layoutId: 'blank',
      background: { type: 'color', color: '#fff' },
      components: [],
    };
    const { container } = render(
      React.createElement(PageThumbnail, { page, isActive: false, onClick: () => {} }),
    );
    expect(container.querySelector('.page-thumbnail__canvas')).not.toBeNull();
    expect(container.querySelector('.page-thumbnail__footer')).not.toBeNull();
  });

  it('shows empty state when page has no components', () => {
    const page: SimplePage = {
      id: createPageId(),
      title: 'Empty',
      role: 'free',
      layoutId: 'blank',
      background: { type: 'color', color: '#fff' },
      components: [],
    };
    const { container } = render(
      React.createElement(PageThumbnail, { page, isActive: false, onClick: () => {} }),
    );
    expect(container.querySelector('.page-thumbnail__empty')).not.toBeNull();
  });

  it('renders component blocks when page has components', () => {
    const page: SimplePage = {
      id: createPageId(),
      title: 'Test',
      role: 'material',
      layoutId: 'blank',
      background: { type: 'color', color: '#fff' },
      components: [
        { id: 'c1', type: 'text', variant: 'title', text: 'T', x: 80, y: 40, width: 600, height: 60 } as never,
        { id: 'c2', type: 'card', variant: 'infoCard', body: 'B', x: 80, y: 120, width: 520, height: 160 } as never,
        { id: 'c3', type: 'navigation', variant: 'primaryAction', label: 'Next', action: 'next', x: 900, y: 620, width: 300, height: 60 } as never,
      ],
    };
    const { container } = render(
      React.createElement(PageThumbnail, { page, isActive: false, onClick: () => {} }),
    );
    const blocks = container.querySelectorAll('.page-thumbnail__block');
    expect(blocks).toHaveLength(3);
  });

  it('clicking thumbnail calls onClick', () => {
    let clicked = false;
    const page: SimplePage = {
      id: createPageId(),
      title: 'Test',
      role: 'material',
      layoutId: 'blank',
      background: { type: 'color', color: '#fff' },
      components: [],
    };
    const { container } = render(
      React.createElement(PageThumbnail, { page, isActive: false, onClick: () => { clicked = true; } }),
    );
    const thumb = container.querySelector('.page-thumbnail') as HTMLElement;
    fireEvent.click(thumb);
    expect(clicked).toBe(true);
  });

  it('active thumbnail has is-active class', () => {
    const page: SimplePage = {
      id: createPageId(),
      title: 'Active',
      role: 'material',
      layoutId: 'blank',
      background: { type: 'color', color: '#fff' },
      components: [],
    };
    const { container } = render(
      React.createElement(PageThumbnail, { page, isActive: true, onClick: () => {} }),
    );
    expect(container.querySelector('.page-thumbnail.is-active')).not.toBeNull();
  });

  it('shows status badge (✓/⚠/✗)', () => {
    const page: SimplePage = {
      id: createPageId(),
      title: 'Test',
      role: 'material',
      layoutId: 'blank',
      background: { type: 'color', color: '#fff' },
      components: [
        { id: 'c1', type: 'text', variant: 'body', text: 'Materi', x: 80, y: 80, width: 400, height: 80 } as never,
        { id: 'c2', type: 'navigation', variant: 'primaryAction', label: 'Next', action: 'next', x: 900, y: 620, width: 300, height: 60 } as never,
      ],
    };
    const { container } = render(
      React.createElement(PageThumbnail, { page, isActive: false, onClick: () => {} }),
    );
    const status = container.querySelector('.page-thumbnail__status');
    expect(status).not.toBeNull();
    // Complete material page → ok status → ✓
    expect(status?.textContent).toMatch(/✓/);
  });
});

// =========================================================================
// PagePanel integration
// =========================================================================

describe('PAGE-THUMBNAIL-SIDEBAR-V1 — PagePanel toggle', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('PagePanel has view toggle button', () => {
    const { container } = render(React.createElement(PagePanel));
    expect(container.querySelector('[data-testid="page-panel-view-toggle"]')).not.toBeNull();
  });

  it('default view mode is thumbnail (CONTENT-VISUAL-CONTRACT-AUDIT-01)', () => {
    const { container } = render(React.createElement(PagePanel));
    expect(container.querySelector('[data-testid="page-panel-thumbnails"]')).not.toBeNull();
  });

  it('clicking toggle switches to list view', () => {
    const { container } = render(React.createElement(PagePanel));
    const toggle = container.querySelector('[data-testid="page-panel-view-toggle"]') as HTMLButtonElement;
    fireEvent.click(toggle);
    // Now in list view — thumbnails hidden, page items visible
    expect(container.querySelector('[data-testid="page-panel-thumbnails"]')).toBeNull();
    expect(container.querySelectorAll('.page-item').length).toBeGreaterThan(0);
  });

  it('list view shows all pages', () => {
    useEditorStore.getState().setProject(createSamplePpknProject());
    const { container } = render(React.createElement(PagePanel));
    const toggle = container.querySelector('[data-testid="page-panel-view-toggle"]') as HTMLButtonElement;
    fireEvent.click(toggle); // Switch to list
    // List view should have page items
    expect(container.querySelectorAll('.page-item').length).toBe(10);
  });

  it('clicking a thumbnail selects the page', () => {
    useEditorStore.getState().setProject(createSamplePpknProject());
    const { container } = render(React.createElement(PagePanel));
    // Default is thumbnail view — no need to toggle
    const thumbnails = container.querySelectorAll('.page-thumbnail');
    expect(thumbnails.length).toBeGreaterThan(1);
    fireEvent.click(thumbnails[1]);
    const state = useEditorStore.getState();
    const currentPage = state.project.pages.find((p) => p.id === state.project.currentPageId);
    expect(currentPage?.id).not.toBe(state.project.pages[0].id);
  });

  it('active page thumbnail has is-active class', () => {
    const { container } = render(React.createElement(PagePanel));
    // Default is thumbnail view
    const activeThumb = container.querySelector('.page-thumbnail.is-active');
    expect(activeThumb).not.toBeNull();
  });

  it('toggling back to thumbnail view after list works', () => {
    const { container } = render(React.createElement(PagePanel));
    const toggle = container.querySelector('[data-testid="page-panel-view-toggle"]') as HTMLButtonElement;
    // Default is thumbnail → switch to list
    fireEvent.click(toggle);
    expect(container.querySelector('[data-testid="page-panel-thumbnails"]')).toBeNull();
    // Switch back to thumbnail
    fireEvent.click(toggle);
    expect(container.querySelector('[data-testid="page-panel-thumbnails"]')).not.toBeNull();
  });
});

// =========================================================================
// Regression
// =========================================================================

describe('PAGE-THUMBNAIL-SIDEBAR-V1 — regression', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('PagePanel still has rename/duplikat/hapus in list view', () => {
    useEditorStore.getState().addPage();
    useEditorStore.getState().selectPage(useEditorStore.getState().project.pages[0].id);
    const { container } = render(React.createElement(PagePanel));
    // Switch to list view (default is thumbnail)
    const toggle = container.querySelector('[data-testid="page-panel-view-toggle"]') as HTMLButtonElement;
    fireEvent.click(toggle);
    expect(container.querySelectorAll('[title="Ganti nama halaman"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[title="Duplikat halaman"]').length).toBeGreaterThan(0);
  });

  it('PagePanel still has + Tambah Halaman button in both views', () => {
    const { container } = render(React.createElement(PagePanel));
    expect(container.querySelectorAll('[title="Tambah halaman"]').length).toBe(1);
    // Switch to thumbnail
    const toggle = container.querySelector('[data-testid="page-panel-view-toggle"]') as HTMLButtonElement;
    fireEvent.click(toggle);
    expect(container.querySelectorAll('[title="Tambah halaman"]').length).toBe(1);
  });

  it('does NOT contain "block" in user-facing text', () => {
    const { container } = render(React.createElement(PagePanel));
    expect(container.textContent ?? '').not.toMatch(/\bblock\b/i);
  });
});

// =========================================================================
// PAGE-THUMBNAIL-SIDEBAR-V1 Patch-1 — Accessibility
// =========================================================================

describe('PAGE-THUMBNAIL-SIDEBAR-V1 Patch-1 — Accessibility', () => {
  it('thumbnail root is a <button> element (semantic button)', () => {
    const page: SimplePage = {
      id: createPageId(),
      title: 'Test',
      role: 'material',
      layoutId: 'blank',
      background: { type: 'color', color: '#fff' },
      components: [],
    };
    const { container } = render(
      React.createElement(PageThumbnail, { page, isActive: false, onClick: () => {} }),
    );
    const thumb = container.querySelector('.page-thumbnail');
    expect(thumb?.tagName).toBe('BUTTON');
  });

  it('thumbnail has aria-label', () => {
    const page: SimplePage = {
      id: createPageId(),
      title: 'Materi Norma',
      role: 'material',
      layoutId: 'blank',
      background: { type: 'color', color: '#fff' },
      components: [],
    };
    const { container } = render(
      React.createElement(PageThumbnail, { page, isActive: false, onClick: () => {} }),
    );
    const thumb = container.querySelector('.page-thumbnail') as HTMLElement;
    expect(thumb.getAttribute('aria-label')).toMatch(/Materi Norma/);
  });

  it('thumbnail can be selected with Enter key', () => {
    let clicked = false;
    const page: SimplePage = {
      id: createPageId(),
      title: 'Test',
      role: 'material',
      layoutId: 'blank',
      background: { type: 'color', color: '#fff' },
      components: [],
    };
    const { container } = render(
      React.createElement(PageThumbnail, { page, isActive: false, onClick: () => { clicked = true; } }),
    );
    const thumb = container.querySelector('.page-thumbnail') as HTMLElement;
    fireEvent.keyDown(thumb, { key: 'Enter' });
    expect(clicked).toBe(true);
  });

  it('thumbnail can be selected with Space key', () => {
    let clicked = false;
    const page: SimplePage = {
      id: createPageId(),
      title: 'Test',
      role: 'material',
      layoutId: 'blank',
      background: { type: 'color', color: '#fff' },
      components: [],
    };
    const { container } = render(
      React.createElement(PageThumbnail, { page, isActive: false, onClick: () => { clicked = true; } }),
    );
    const thumb = container.querySelector('.page-thumbnail') as HTMLElement;
    fireEvent.keyDown(thumb, { key: ' ' });
    expect(clicked).toBe(true);
  });

  it('thumbnail has aria-pressed when active', () => {
    const page: SimplePage = {
      id: createPageId(),
      title: 'Active',
      role: 'material',
      layoutId: 'blank',
      background: { type: 'color', color: '#fff' },
      components: [],
    };
    const { container } = render(
      React.createElement(PageThumbnail, { page, isActive: true, onClick: () => {} }),
    );
    const thumb = container.querySelector('.page-thumbnail') as HTMLElement;
    expect(thumb.getAttribute('aria-pressed')).toBe('true');
  });
});
