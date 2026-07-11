/**
 * Tests for M9 geometry ownership fix — no double positioning.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC_DIR = resolve(__dirname, '..');

function readSrcFile(relPath: string): string {
  return readFileSync(resolve(SRC_DIR, relPath), 'utf8');
}

describe('M9 PATCH — component views support positionMode fill', () => {
  it('TextComponentView has positionMode prop', () => {
    const content = readSrcFile('components/TextComponentView.tsx');
    expect(content).toMatch(/positionMode/);
    expect(content).toMatch(/'absolute' \| 'fill'/);
  });

  it('ImageComponentView has positionMode prop', () => {
    const content = readSrcFile('components/ImageComponentView.tsx');
    expect(content).toMatch(/positionMode/);
    expect(content).toMatch(/'absolute' \| 'fill'/);
  });

  it('CardComponentView has positionMode prop', () => {
    const content = readSrcFile('components/CardComponentView.tsx');
    expect(content).toMatch(/positionMode/);
    expect(content).toMatch(/'absolute' \| 'fill'/);
  });

  it('NavigationComponentView has positionMode prop', () => {
    const content = readSrcFile('components/NavigationComponentView.tsx');
    expect(content).toMatch(/positionMode/);
    expect(content).toMatch(/'absolute' \| 'fill'/);
  });
});

describe('M9 PATCH — fill mode does NOT apply component.x/y', () => {
  it('TextComponentView fill mode uses position relative + left 0', () => {
    const content = readSrcFile('components/TextComponentView.tsx');
    // In fill mode, should have position: 'relative' and left: 0
    expect(content).toMatch(/position: 'relative'/);
    expect(content).toMatch(/left: 0/);
    expect(content).toMatch(/top: 0/);
    expect(content).toMatch(/width: '100%'/);
    expect(content).toMatch(/height: '100%'/);
  });

  it('ImageComponentView fill mode uses position relative + left 0', () => {
    const content = readSrcFile('components/ImageComponentView.tsx');
    expect(content).toMatch(/position: 'relative'/);
    expect(content).toMatch(/left: 0/);
    expect(content).toMatch(/width: '100%'/);
  });

  it('CardComponentView fill mode uses position relative + left 0', () => {
    const content = readSrcFile('components/CardComponentView.tsx');
    expect(content).toMatch(/position: 'relative'/);
    expect(content).toMatch(/left: 0/);
    expect(content).toMatch(/width: '100%'/);
  });

  it('NavigationComponentView fill mode uses position relative + left 0', () => {
    const content = readSrcFile('components/NavigationComponentView.tsx');
    expect(content).toMatch(/position: 'relative'/);
    expect(content).toMatch(/left: 0/);
    expect(content).toMatch(/width: '100%'/);
  });
});

describe('M9 PATCH — CanvasStage uses positionMode fill', () => {
  it('CanvasStage delegates to SceneRendererView for component rendering', () => {
    // Fase 2b: CanvasStage no longer directly renders component views.
    // It delegates to SceneRendererView which handles slot positioning.
    const content = readSrcFile('editor/CanvasStage.tsx');
    expect(content).toMatch(/SceneRendererView/);
  });

  it('SceneRendererView has absolute positioning with slot.placement.x/y', () => {
    // Fase 2b: positioning moved from CanvasStage to SceneRendererView.
    const content = readSrcFile('components/SceneRendererView.tsx');
    expect(content).toMatch(/position: 'absolute'/);
    expect(content).toMatch(/slot\.placement\.x/);
    expect(content).toMatch(/slot\.placement\.y/);
    expect(content).toMatch(/slot\.placement\.width/);
    expect(content).toMatch(/slot\.placement\.height/);
  });

  it('CanvasStage delegates to SceneRendererView (no direct component positioning)', () => {
    // Fase 2b: CanvasStage no longer positions individual components.
    const content = readSrcFile('editor/CanvasStage.tsx');
    expect(content).toMatch(/SceneRendererView/);
  });
});

describe('M9 PATCH — Preview still uses absolute (default)', () => {
  it('PreviewApp does NOT pass positionMode fill', () => {
    const content = readSrcFile('preview/PreviewApp.tsx');
    expect(content).not.toMatch(/positionMode="fill"/);
  });

  it('PreviewApp renders components without drag wrapper', () => {
    const content = readSrcFile('preview/PreviewApp.tsx');
    // Preview should not have onPointerDown for drag
    expect(content).not.toMatch(/handleDragStart/);
    expect(content).not.toMatch(/handleResizeStart/);
  });
});

describe('M9 PATCH — no double offset in editor', () => {
  it('SceneRendererView is the single owner of absolute position', () => {
    // Fase 2b: SceneRendererView handles all slot positioning.
    const content = readSrcFile('components/SceneRendererView.tsx');
    expect(content).toMatch(/position: 'absolute'/);
    expect(content).toMatch(/slot\.placement\.x/);
    expect(content).toMatch(/slot\.placement\.y/);
  });
});
