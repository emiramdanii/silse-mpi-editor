/**
 * UX-02: Drag/Resize visual feedback — alignment guides + dimension label.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

import { useEditorStore } from '../store/editor-store';
import { createSamplePpknProject } from '../core/sample-project';
import { CanvasStage } from '../editor/CanvasStage';

describe('UX-02: Drag/Resize visual feedback', () => {
  beforeEach(() => {
    useEditorStore.setState({
      project: {
        ...createSamplePpknProject(),
        pages: [{
          id: 'page1', title: 'Test', role: 'material', layoutId: 'blank',
          background: { type: 'color', color: '#fff' },
          components: [{
            id: 'comp1', type: 'text', variant: 'body',
            x: 100, y: 100, width: 200, height: 50,
            text: 'Hello',
          }],
        }],
        currentPageId: 'page1',
      },
      selectedComponentId: null,
    });
  });

  it('1. CanvasStage renders without crash', () => {
    const { container } = render(React.createElement(CanvasStage));
    expect(container.querySelector('[data-testid="canvas-stage"]')).not.toBeNull();
  });

  it('2. Guide overlay NOT visible when not dragging', () => {
    const { container } = render(React.createElement(CanvasStage));
    expect(container.querySelector('[data-testid="drag-guides-overlay"]')).toBeNull();
  });

  it('3. Dimension label NOT visible when not dragging', () => {
    const { container } = render(React.createElement(CanvasStage));
    expect(container.querySelector('[data-testid="drag-dimension-label"]')).toBeNull();
  });

  it('4. Guide overlay appears during drag (pointer down on component)', () => {
    const { container } = render(React.createElement(CanvasStage));
    const component = container.querySelector('[style*="left: 100px"]') as HTMLElement;
    if (component) {
      fireEvent.pointerDown(component, { clientX: 150, clientY: 125 });
    }
    const overlay = container.querySelector('[data-testid="drag-guides-overlay"]');
    expect(overlay).not.toBeNull();
  });

  it('5. Dimension label shows width × height during drag', () => {
    const { container } = render(React.createElement(CanvasStage));
    const component = container.querySelector('[style*="left: 100px"]') as HTMLElement;
    if (component) {
      fireEvent.pointerDown(component, { clientX: 150, clientY: 125 });
    }
    const label = container.querySelector('[data-testid="drag-dimension-label"]');
    expect(label).not.toBeNull();
    expect(label?.textContent).toContain('200');
    expect(label?.textContent).toContain('50');
  });

  it('6. Guide overlay contains center vertical guide', () => {
    const { container } = render(React.createElement(CanvasStage));
    const component = container.querySelector('[style*="left: 100px"]') as HTMLElement;
    if (component) {
      fireEvent.pointerDown(component, { clientX: 150, clientY: 125 });
    }
    expect(container.querySelector('[data-testid="drag-guide-center-v"]')).not.toBeNull();
  });

  it('7. Guide overlay contains center horizontal guide', () => {
    const { container } = render(React.createElement(CanvasStage));
    const component = container.querySelector('[style*="left: 100px"]') as HTMLElement;
    if (component) {
      fireEvent.pointerDown(component, { clientX: 150, clientY: 125 });
    }
    expect(container.querySelector('[data-testid="drag-guide-center-h"]')).not.toBeNull();
  });
});
