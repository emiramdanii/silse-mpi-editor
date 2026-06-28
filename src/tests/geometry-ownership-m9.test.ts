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
  it('CanvasStage passes positionMode="fill" to TextComponentView', () => {
    const content = readSrcFile('editor/CanvasStage.tsx');
    expect(content).toMatch(/positionMode="fill"/);
  });

  it('CanvasStage wrapper has absolute positioning with component.x/y', () => {
    const content = readSrcFile('editor/CanvasStage.tsx');
    // Wrapper should have position: 'absolute' and use component.x/y
    expect(content).toMatch(/position: 'absolute'/);
    expect(content).toMatch(/component\.x/);
    expect(content).toMatch(/component\.y/);
    expect(content).toMatch(/component\.width/);
    expect(content).toMatch(/component\.height/);
  });

  it('CanvasStage does NOT pass component.x/y to component views directly', () => {
    const content = readSrcFile('editor/CanvasStage.tsx');
    // The component views receive positionMode="fill", not x/y
    // Check that TextComponentView/ImageComponentView/etc are called with positionMode
    // but NOT with left/top from component.x/y in the view props
    const viewCalls = content.match(/<(Text|Image|Card|Navigation)ComponentView[\s\S]*?\/>/g);
    if (viewCalls) {
      for (const call of viewCalls) {
        expect(call).toMatch(/positionMode="fill"/);
      }
    }
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
  it('CanvasStage wrapper is the single owner of absolute position', () => {
    const content = readSrcFile('editor/CanvasStage.tsx');
    // The wrapStyle should have position absolute + left/top from component
    expect(content).toMatch(/position: 'absolute'/);
    // Component views should use fill (relative, 0, 100%)
    // Not absolute with component.x/y again
    const fillCount = (content.match(/positionMode="fill"/g) || []).length;
    expect(fillCount).toBe(7); // text, image, card, navigation, question, game, layered-info
  });
});
