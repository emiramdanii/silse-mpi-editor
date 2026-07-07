/**
 * UX-06: Zoom & Pan Canvas.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

import { useEditorStore } from '../store/editor-store';
import { createSamplePpknProject } from '../core/sample-project';
import { CanvasStage } from '../editor/CanvasStage';

describe('UX-06: Zoom & Pan Canvas', () => {
  beforeEach(() => {
    useEditorStore.setState({ project: createSamplePpknProject() });
  });

  it('1. Zoom controls render', () => {
    const { container } = render(React.createElement(CanvasStage));
    expect(container.querySelector('[data-testid="zoom-controls"]')).not.toBeNull();
  });

  it('2. Zoom in button renders', () => {
    const { container } = render(React.createElement(CanvasStage));
    expect(container.querySelector('[data-testid="zoom-in"]')).not.toBeNull();
  });

  it('3. Zoom out button renders', () => {
    const { container } = render(React.createElement(CanvasStage));
    expect(container.querySelector('[data-testid="zoom-out"]')).not.toBeNull();
  });

  it('4. Zoom reset button renders', () => {
    const { container } = render(React.createElement(CanvasStage));
    expect(container.querySelector('[data-testid="zoom-reset"]')).not.toBeNull();
  });

  it('5. Zoom level shows 100% initially', () => {
    const { container } = render(React.createElement(CanvasStage));
    const level = container.querySelector('[data-testid="zoom-level"]');
    expect(level?.textContent).toContain('100%');
  });

  it('6. Clicking zoom in increases zoom level', () => {
    const { container } = render(React.createElement(CanvasStage));
    fireEvent.click(container.querySelector('[data-testid="zoom-in"]')!);
    const level = container.querySelector('[data-testid="zoom-level"]');
    expect(level?.textContent).toContain('110%');
  });

  it('7. Clicking zoom out decreases zoom level', () => {
    const { container } = render(React.createElement(CanvasStage));
    // First zoom in twice, then zoom out once
    fireEvent.click(container.querySelector('[data-testid="zoom-in"]')!);
    fireEvent.click(container.querySelector('[data-testid="zoom-in"]')!);
    fireEvent.click(container.querySelector('[data-testid="zoom-out"]')!);
    const level = container.querySelector('[data-testid="zoom-level"]');
    expect(level?.textContent).toContain('110%');
  });

  it('8. Clicking zoom reset returns to 100%', () => {
    const { container } = render(React.createElement(CanvasStage));
    fireEvent.click(container.querySelector('[data-testid="zoom-in"]')!);
    fireEvent.click(container.querySelector('[data-testid="zoom-in"]')!);
    fireEvent.click(container.querySelector('[data-testid="zoom-reset"]')!);
    const level = container.querySelector('[data-testid="zoom-level"]');
    expect(level?.textContent).toContain('100%');
  });

  it('9. Zoom cannot exceed 200%', () => {
    const { container } = render(React.createElement(CanvasStage));
    // Click zoom in 15 times (should cap at 200%)
    for (let i = 0; i < 15; i++) {
      fireEvent.click(container.querySelector('[data-testid="zoom-in"]')!);
    }
    const level = container.querySelector('[data-testid="zoom-level"]');
    expect(level?.textContent).toContain('200%');
  });

  it('10. Zoom cannot go below 30%', () => {
    const { container } = render(React.createElement(CanvasStage));
    // Click zoom out 10 times (should floor at 30%)
    for (let i = 0; i < 10; i++) {
      fireEvent.click(container.querySelector('[data-testid="zoom-out"]')!);
    }
    const level = container.querySelector('[data-testid="zoom-level"]');
    expect(level?.textContent).toContain('30%');
  });
});
