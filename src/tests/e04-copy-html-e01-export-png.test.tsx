/**
 * E-04: Copy HTML to Clipboard + E-01: Export PNG.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

import { useEditorStore } from '../store/editor-store';
import { createSamplePpknProject } from '../core/sample-project';

describe('E-04 + E-01: Copy HTML + Export PNG buttons', () => {
  beforeEach(() => {
    useEditorStore.setState({ project: createSamplePpknProject() });
  });

  it('1. Topbar renders Copy HTML button', async () => {
    const { Topbar } = await import('../editor/Topbar');
    const { container } = render(React.createElement(Topbar));
    const btn = container.querySelector('[data-testid="topbar-copy-html"]');
    expect(btn).not.toBeNull();
  });

  it('2. Copy HTML button text contains "Salin HTML"', async () => {
    const { Topbar } = await import('../editor/Topbar');
    const { container } = render(React.createElement(Topbar));
    const btn = container.querySelector('[data-testid="topbar-copy-html"]');
    expect(btn?.textContent).toContain('Salin HTML');
  });

  it('3. Copy HTML button has data-action="copy-html"', async () => {
    const { Topbar } = await import('../editor/Topbar');
    const { container } = render(React.createElement(Topbar));
    const btn = container.querySelector('[data-testid="topbar-copy-html"]');
    expect(btn?.getAttribute('data-action')).toBe('copy-html');
  });

  it('4. Topbar renders Export PNG button', async () => {
    const { Topbar } = await import('../editor/Topbar');
    const { container } = render(React.createElement(Topbar));
    const btn = container.querySelector('[data-testid="topbar-export-png"]');
    expect(btn).not.toBeNull();
  });

  it('5. Export PNG button text contains "Export PNG"', async () => {
    const { Topbar } = await import('../editor/Topbar');
    const { container } = render(React.createElement(Topbar));
    const btn = container.querySelector('[data-testid="topbar-export-png"]');
    expect(btn?.textContent).toContain('Export PNG');
  });

  it('6. Export PNG button has data-action="export-png"', async () => {
    const { Topbar } = await import('../editor/Topbar');
    const { container } = render(React.createElement(Topbar));
    const btn = container.querySelector('[data-testid="topbar-export-png"]');
    expect(btn?.getAttribute('data-action')).toBe('export-png');
  });

  it('7. All export buttons exist: HTML, JSON, Copy HTML, PNG', async () => {
    const { Topbar } = await import('../editor/Topbar');
    const { container } = render(React.createElement(Topbar));
    expect(container.querySelector('[data-testid="topbar-export"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="topbar-export-json"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="topbar-copy-html"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="topbar-export-png"]')).not.toBeNull();
  });
});
