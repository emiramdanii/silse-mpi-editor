/**
 * F-03: Duplicate (Ctrl+D) + Delete shortcut + E-02: Clean export verification.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

import { useEditorStore } from '../store/editor-store';
import { createSamplePpknProject } from '../core/sample-project';
import { CanvasStage } from '../editor/CanvasStage';
import { exportProjectToHtml } from '../export/export-html';

describe('F-03: Duplicate + Delete shortcut', () => {
  beforeEach(() => {
    useEditorStore.setState({
      project: {
        ...createSamplePpknProject(),
        pages: [{
          id: 'page1', title: 'Test', role: 'material', layoutId: 'blank',
          background: { type: 'color', color: '#fff' },
          components: [{
            id: 'comp1', type: 'text', variant: 'body',
            x: 100, y: 100, width: 200, height: 50, text: 'Hello',
          }],
        }],
        currentPageId: 'page1',
      },
      selectedComponentId: null,
    });
  });

  it('1. CanvasStage renders with component', () => {
    const { container } = render(React.createElement(CanvasStage));
    expect(container.querySelector('[data-testid="canvas-stage"]')).not.toBeNull();
  });

  it('2. Delete key removes selected component', () => {
    const { container } = render(React.createElement(CanvasStage));
    // Select component
    const comp = container.querySelector('[style*="left: 100px"]') as HTMLElement;
    if (comp) fireEvent.pointerDown(comp);

    // Press Delete
    fireEvent.keyDown(window, { key: 'Delete' });

    const project = useEditorStore.getState().project;
    const page = project.pages.find((p) => p.id === 'page1');
    expect(page?.components.length).toBe(0);
  });

  it('3. Ctrl+D duplicates selected component', () => {
    const { container } = render(React.createElement(CanvasStage));
    // Select component
    const comp = container.querySelector('[style*="left: 100px"]') as HTMLElement;
    if (comp) fireEvent.pointerDown(comp);

    // Press Ctrl+D
    fireEvent.keyDown(window, { key: 'd', ctrlKey: true });

    const project = useEditorStore.getState().project;
    const page = project.pages.find((p) => p.id === 'page1');
    expect(page?.components.length).toBe(2);
  });

  it('4. Duplicated component has offset position (x+20, y+20)', () => {
    const { container } = render(React.createElement(CanvasStage));
    const comp = container.querySelector('[style*="left: 100px"]') as HTMLElement;
    if (comp) fireEvent.pointerDown(comp);

    fireEvent.keyDown(window, { key: 'd', ctrlKey: true });

    const project = useEditorStore.getState().project;
    const page = project.pages.find((p) => p.id === 'page1');
    const duplicate = page?.components.find((c) => c.id !== 'comp1');
    expect(duplicate?.x).toBe(120);
    expect(duplicate?.y).toBe(120);
  });

  it('5. Duplicated component is auto-selected', () => {
    const { container } = render(React.createElement(CanvasStage));
    const comp = container.querySelector('[style*="left: 100px"]') as HTMLElement;
    if (comp) fireEvent.pointerDown(comp);

    fireEvent.keyDown(window, { key: 'd', ctrlKey: true });

    const selectedId = useEditorStore.getState().selectedComponentId;
    expect(selectedId).not.toBe('comp1');
    expect(selectedId).toBeTruthy();
  });

  it('6. Ctrl+D does nothing when no component selected', () => {
    render(React.createElement(CanvasStage));
    // No component selected
    fireEvent.keyDown(window, { key: 'd', ctrlKey: true });
    const project = useEditorStore.getState().project;
    const page = project.pages.find((p) => p.id === 'page1');
    expect(page?.components.length).toBe(1); // unchanged
  });
});

describe('E-02: Clean export verification', () => {
  it('7. export HTML has no external CDN refs', () => {
    const html = exportProjectToHtml(createSamplePpknProject());
    expect(html).not.toContain('fonts.googleapis');
    expect(html).not.toContain('cdn.jsdelivr');
    expect(html).not.toContain('unpkg.com');
  });

  it('8. export HTML has no React/Vite runtime', () => {
    const html = exportProjectToHtml(createSamplePpknProject());
    expect(html).not.toContain('react.production');
    expect(html).not.toMatch(/vite\//);
  });

  it('9. export HTML has no external <link> tags', () => {
    const html = exportProjectToHtml(createSamplePpknProject());
    expect(html).not.toMatch(/<link[^>]+href=["']https?:/);
  });

  it('10. export HTML is standalone (has <html> and </html>)', () => {
    const html = exportProjectToHtml(createSamplePpknProject());
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
  });
});
