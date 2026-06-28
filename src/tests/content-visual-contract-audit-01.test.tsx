/**
 * CONTENT-VISUAL-CONTRACT-AUDIT-01 tests.
 *
 * 10 mandatory tests per senior reviewer spec.
 */

import { describe, expect, it } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  isDarkColor,
  getContrastRatio,
  getReadableTextColor,
} from '../core/design/contrast';
import { getResolvedComponentStyle } from '../core/style/resolveComponentStyle';
import { createSamplePpknProject } from '../core/sample-project';
import { generateMpiFromTopic } from '../core/guided-flow/generate-mpi-from-topic';
import { getTopicById } from '../core/guided-flow/mpi-topic-catalog';
import { checkMpiStandard } from '../core/mpi-quality-check';
import { PagePanel } from '../editor/PagePanel';
import { useEditorStore } from '../store/editor-store';

// =========================================================================
// Test 1: getReadableTextColor('#1e3a5f') → light color
// =========================================================================

describe('CONTENT-VISUAL-CONTRACT-AUDIT-01 — 10 mandatory tests', () => {
  it('1. getReadableTextColor for dark background returns light color', () => {
    const result = getReadableTextColor('#1e3a5f');
    expect(isDarkColor(result)).toBe(false);
  });

  // Test 2: contrast ratio >= 4.5
  it('2. getContrastRatio(#ffffff, #1e3a5f) >= 4.5', () => {
    const ratio = getContrastRatio('#ffffff', '#1e3a5f');
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  // Test 3: Sample PPKn cover title contrast >= 4.5
  it('3. Sample PPKn cover title contrast >= 4.5 (resolver is background-aware)', () => {
    const project = createSamplePpknProject();
    const coverPage = project.pages.find((p) => p.role === 'cover')!;
    const titleComp = coverPage.components.find((c) => c.type === 'text')!;
    const resolved = getResolvedComponentStyle(project, coverPage, titleComp);
    const textColor = resolved.inlineStyle.color as string;
    const bg = (coverPage.background as { color: string }).color;
    const ratio = getContrastRatio(textColor, bg);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  // Test 4: Generated PPKn cover title contrast >= 4.5
  it('4. Generated PPKn cover title contrast >= 4.5', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const result = generateMpiFromTopic(topic);
    const coverPage = result.project.pages.find((p) => p.role === 'cover')!;
    const titleComp = coverPage.components.find((c) => c.type === 'text')!;
    const resolved = getResolvedComponentStyle(result.project, coverPage, titleComp);
    const textColor = resolved.inlineStyle.color as string;
    const bg = (coverPage.background as { color: string }).color;
    const ratio = getContrastRatio(textColor, bg);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  // Test 5: Generated closing title contrast >= 4.5
  it('5. Generated closing title contrast >= 4.5', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const result = generateMpiFromTopic(topic);
    const closingPage = result.project.pages.find((p) => p.role === 'closing')!;
    const titleComp = closingPage.components.find((c) => c.type === 'text')!;
    const resolved = getResolvedComponentStyle(result.project, closingPage, titleComp);
    const textColor = resolved.inlineStyle.color as string;
    const bg = (closingPage.background as { color: string }).color;
    const ratio = getContrastRatio(textColor, bg);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  // Test 6: checkMpiStandard does not use ujian-centric language
  it('6. checkMpiStandard does not use ujian-centric language', () => {
    const project = createSamplePpknProject();
    // Remove quiz + question + game to trigger warnings
    const broken = {
      ...project,
      pages: project.pages.map((p) => ({
        ...p,
        components: p.components.filter((c) => c.type !== 'question' && c.type !== 'game'),
      })),
    };
    // Also remove quiz + activity pages
    broken.pages = broken.pages.filter((p) => p.role !== 'quiz' && p.role !== 'activity');
    const qc = checkMpiStandard(broken);
    const allText = qc.warnings.join(' ');
    // Should NOT say "Belum ada Kuis atau Question component" (old wording)
    expect(allText).not.toMatch(/Belum ada Kuis atau Question component/);
    expect(allText).not.toMatch(/Belum ada Game component/);
    // Should use softer language
    expect(allText).toMatch(/cek pemahaman|pertanyaan/i);
    expect(allText).toMatch(/aktivitas interaktif|latihan/i);
  });

  // Test 7: PagePanel default shows thumbnail view
  it('7. PagePanel default shows thumbnail view (not list)', () => {
    useEditorStore.getState().newProject();
    const { container } = render(React.createElement(PagePanel));
    expect(container.querySelector('[data-testid="page-panel-thumbnails"]')).not.toBeNull();
  });

  // Test 8: Toggle to list view works
  it('8. Toggle to list view works', () => {
    useEditorStore.getState().newProject();
    const { container } = render(React.createElement(PagePanel));
    const toggle = container.querySelector('[data-testid="page-panel-view-toggle"]') as HTMLButtonElement;
    fireEvent.click(toggle);
    expect(container.querySelector('[data-testid="page-panel-thumbnails"]')).toBeNull();
    expect(container.querySelectorAll('.page-item').length).toBeGreaterThan(0);
  });

  // Test 9: Toggle back to thumbnail works
  it('9. Toggle back to thumbnail works', () => {
    useEditorStore.getState().newProject();
    const { container } = render(React.createElement(PagePanel));
    const toggle = container.querySelector('[data-testid="page-panel-view-toggle"]') as HTMLButtonElement;
    // thumbnail → list
    fireEvent.click(toggle);
    expect(container.querySelector('[data-testid="page-panel-thumbnails"]')).toBeNull();
    // list → thumbnail
    fireEvent.click(toggle);
    expect(container.querySelector('[data-testid="page-panel-thumbnails"]')).not.toBeNull();
  });

  // Test 10: Export/render resolver uses same readable color for cover
  it('10. Resolver produces same readable color for cover in all contexts', () => {
    const project = createSamplePpknProject();
    const coverPage = project.pages.find((p) => p.role === 'cover')!;
    const titleComp = coverPage.components.find((c) => c.type === 'text')!;

    // Simulate what editor, preview, and export all call:
    const resolved = getResolvedComponentStyle(project, coverPage, titleComp);
    const textColor = resolved.inlineStyle.color as string;

    // Verify the color is the readable text color for the background
    const expectedColor = getReadableTextColor((coverPage.background as { color: string }).color);
    expect(textColor).toBe(expectedColor);

    // Verify contrast is adequate
    const ratio = getContrastRatio(textColor, (coverPage.background as { color: string }).color);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
