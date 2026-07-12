/**
 * UX-02: Drag/Resize visual feedback — basic render sanity.
 *
 * Note: The visual guide overlay (center lines + dimension label) was a
 * planned feature for V1 but has been deferred to a future iteration.
 * The drag/resize interaction itself works (Fase 2a); only the visual
 * guide overlay was never implemented. The 4 skipped tests for that
 * feature were removed when V1 was locked.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
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
});
