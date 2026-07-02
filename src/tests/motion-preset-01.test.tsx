/**
 * MOTION-PRESET-01 — Controlled Premium Motion.
 *
 * Scope (per senior reviewer spec):
 *   - hover lift
 *   - card transition
 *   - fade / slide entrance
 *   - feedback pop
 *   - prefers-reduced-motion
 *   - export parity (editor CSS === export CSS)
 *   - NO new library (no framer-motion, no GSAP)
 *   - NO new scene type
 *   - NO heavy schema (uses existing contract.motion preset names)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  resolveMotionPresetClass,
  resolveMotionProfile,
  getAllMotionClassNames,
  buildMotionPresetCss,
  DEFAULT_MOTION_PROFILE,
} from '../core/style-packs/motion-preset';
import type { MpiDesignContract } from '../core/mpi-design-contract';
import { ScenePanel, SceneChip, ActionButtonBlock, RevealBlock, ScoreSummaryBlock, SceneHeader } from '../components/scene-blocks';
import { exportProjectToHtml } from '../export/export-html';
import { createSamplePpknProject } from '../core/sample-project';

// ---------------------------------------------------------------------------
// SCOPE A — Core API: helper exists and resolves correctly
// ---------------------------------------------------------------------------

describe('MOTION-PRESET-01 — Scope A: core API', () => {
  it('1. motion-preset.ts is exported from core/style-packs', () => {
    const source = readFileSync(
      resolve(__dirname, '../core/style-packs/motion-preset.ts'),
      'utf-8',
    );
    expect(source).toContain('export function resolveMotionPresetClass');
    expect(source).toContain('export function resolveMotionProfile');
    expect(source).toContain('export function getAllMotionClassNames');
    expect(source).toContain('export function buildMotionPresetCss');
    expect(source).toContain('export const DEFAULT_MOTION_PROFILE');
    expect(source).toContain('export type MotionPresetProfile');
  });

  it('2. resolveMotionPresetClass returns stable CSS class for each preset', () => {
    expect(resolveMotionPresetClass('none')).toBe('');
    expect(resolveMotionPresetClass('soft-fade')).toBe('silse-motion-soft-fade');
    expect(resolveMotionPresetClass('slide-up')).toBe('silse-motion-slide-up');
    expect(resolveMotionPresetClass('pulse')).toBe('silse-motion-pulse');
    expect(resolveMotionPresetClass('reward-pop')).toBe('silse-motion-reward-pop');
    expect(resolveMotionPresetClass('correct-burst')).toBe('silse-motion-correct-burst');
  });

  it('3. resolveMotionPresetClass handles undefined / unknown presets defensively', () => {
    expect(resolveMotionPresetClass(undefined)).toBe('');
    expect(resolveMotionPresetClass('')).toBe('');
    // Unknown preset name should not throw — return '' (no class applied)
    expect(resolveMotionPresetClass('does-not-exist')).toBe('');
  });

  it('4. resolveMotionProfile returns the default profile with all 4 hook classes', () => {
    const p = resolveMotionProfile();
    expect(p.hoverLiftClass).toBe('silse-motion-hover-lift');
    expect(p.entranceFadeClass).toBe('silse-motion-entrance-fade');
    expect(p.entranceSlideUpClass).toBe('silse-motion-entrance-slide-up');
    expect(p.feedbackPopClass).toBe('silse-motion-feedback-pop');
  });

  it('5. getAllMotionClassNames returns every silse-motion-* class', () => {
    const names = getAllMotionClassNames();
    expect(names).toContain('silse-motion-hover-lift');
    expect(names).toContain('silse-motion-entrance-fade');
    expect(names).toContain('silse-motion-entrance-slide-up');
    expect(names).toContain('silse-motion-feedback-pop');
    expect(names).toContain('silse-motion-soft-fade');
    expect(names).toContain('silse-motion-slide-up');
    expect(names).toContain('silse-motion-pulse');
    expect(names).toContain('silse-motion-reward-pop');
    expect(names).toContain('silse-motion-correct-burst');
    // All names are silse-motion-* prefixed
    names.forEach((n) => expect(n.startsWith('silse-motion-')).toBe(true));
  });
});

// ---------------------------------------------------------------------------
// SCOPE B — CSS: every preset has a keyframe + class definition
// ---------------------------------------------------------------------------

describe('MOTION-PRESET-01 — Scope B: CSS keyframes exist', () => {
  it('6. buildMotionPresetCss returns a string containing every keyframe + class', () => {
    const css = buildMotionPresetCss();
    expect(typeof css).toBe('string');
    // Keyframes
    expect(css).toContain('@keyframes silse-motion-entrance-fade-kf');
    expect(css).toContain('@keyframes silse-motion-entrance-slide-up-kf');
    expect(css).toContain('@keyframes silse-motion-soft-fade-kf');
    expect(css).toContain('@keyframes silse-motion-slide-up-kf');
    expect(css).toContain('@keyframes silse-motion-pulse-kf');
    expect(css).toContain('@keyframes silse-motion-reward-pop-kf');
    expect(css).toContain('@keyframes silse-motion-correct-burst-kf');
    expect(css).toContain('@keyframes silse-motion-feedback-pop-kf');
    // Classes
    expect(css).toContain('.silse-motion-hover-lift');
    expect(css).toContain('.silse-motion-entrance-fade');
    expect(css).toContain('.silse-motion-entrance-slide-up');
    expect(css).toContain('.silse-motion-soft-fade');
    expect(css).toContain('.silse-motion-slide-up');
    expect(css).toContain('.silse-motion-pulse');
    expect(css).toContain('.silse-motion-reward-pop');
    expect(css).toContain('.silse-motion-correct-burst');
    expect(css).toContain('.silse-motion-feedback-pop');
  });

  it('7. buildMotionPresetCss contains prefers-reduced-motion block disabling all motion', () => {
    const css = buildMotionPresetCss();
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    // Every animation class must be listed under reduced-motion
    [
      'silse-motion-entrance-fade', 'silse-motion-entrance-slide-up',
      'silse-motion-soft-fade', 'silse-motion-slide-up',
      'silse-motion-pulse', 'silse-motion-reward-pop',
      'silse-motion-correct-burst', 'silse-motion-feedback-pop',
    ].forEach((cls) => {
      expect(css, `${cls} should be in reduced-motion block`).toContain(`.${cls}`);
    });
    expect(css).toContain('animation: none !important');
    expect(css).toContain('transition: none !important');
    expect(css).toContain('transform: none !important');
  });

  it('8. styles.css contains the same motion CSS block (editor parity)', () => {
    const css = readFileSync(resolve(__dirname, '../styles.css'), 'utf-8');
    expect(css).toContain('@keyframes silse-motion-entrance-fade-kf');
    expect(css).toContain('@keyframes silse-motion-feedback-pop-kf');
    expect(css).toContain('.silse-motion-hover-lift');
    expect(css).toContain('.silse-motion-reward-pop');
    // prefers-reduced-motion for motion classes
    expect(css).toMatch(/prefers-reduced-motion: reduce[\s\S]*silse-motion-/);
  });
});

// ---------------------------------------------------------------------------
// SCOPE C — React composables use motion classes
// ---------------------------------------------------------------------------

const fakeContract: MpiDesignContract = {
  id: 'default',
  name: 'Test Contract',
  frame: { width: 1280, height: 720, padding: 28, radius: 16 },
  palette: {
    background: '#0e1c2f', surface: '#182d45', primary: '#0e1c2f',
    secondary: '#3ecfcf', gold: '#f9c12e', text: '#ffffff',
    mutedText: '#6e90b5', success: '#34d399', warning: '#f9c12e',
    danger: '#ff6b6b', border: 'rgba(255,255,255,0.09)',
  },
  background: { type: 'color', color: '#0e1c2f' },
  typography: {
    heroFont: 'sans-serif', bodyFont: 'sans-serif',
    titleSize: 28, titleWeight: 800, bodySize: 14, bodyWeight: 400,
    lineHeight: 1.6,
  },
  card: {
    background: '#182d45', border: '1px solid rgba(255,255,255,0.09)',
    radius: 16, padding: 20, shadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  button: {
    primary: { background: '#f9c12e', color: '#0e1c2f', radius: 999, padding: { top: 10, right: 20 }, fontWeight: 800, shadow: '0 2px 6px rgba(0,0,0,0.12)' },
    secondary: { background: '#3ecfcf', color: '#0e1c2f', radius: 999, padding: { top: 10, right: 20 }, fontWeight: 800, shadow: '0 2px 6px rgba(0,0,0,0.12)' },
    gold: { background: '#f9c12e', color: '#0e1c2f', radius: 999, padding: { top: 10, right: 20 }, fontWeight: 800, shadow: '0 2px 6px rgba(0,0,0,0.12)' },
  },
  badge: { background: 'rgba(255,255,255,0.1)', color: '#f9c12e', radius: 999 },
  navigation: { background: 'rgba(0,0,0,0.2)', color: '#fff', radius: 999 },
  quiz: { questionColor: '#fff', choiceBorder: '1px solid rgba(255,255,255,0.09)', choiceRadius: 12 },
  game: { panelBackground: '#182d45', panelBorder: '1px solid rgba(255,255,255,0.09)' },
  learning: { conceptTitleColor: '#fff', conceptSubtitleColor: '#6e90b5' },
  feedback: {
    correct: { variant: 'correct', icon: '✓', color: '#065f46', background: '#d1fae5', borderColor: '#16a34a', motionPreset: 'correct-burst' },
    wrong: { variant: 'wrong', icon: '✗', color: '#991b1b', background: '#fee2e2', borderColor: '#dc2626', motionPreset: 'none' },
    neutral: { variant: 'neutral', icon: '•', color: '#1f2937', background: '#f3f4f6', borderColor: '#d1d5db', motionPreset: 'none' },
    warning: { variant: 'warning', icon: '!', color: '#92400e', background: '#fef3c7', borderColor: '#f59e0b', motionPreset: 'none' },
  },
  reward: { medal: { background: '#f9c12e', borderColor: '#f9c12e', radius: 999, size: 80, icon: '🏆' } },
  motion: {
    'none': { animation: 'none', duration: 0, easing: 'ease' },
    'soft-fade': { animation: 'silse-motion-soft-fade', duration: 220, easing: 'ease-out' },
    'slide-up': { animation: 'silse-motion-slide-up', duration: 260, easing: 'ease-out' },
    'pulse': { animation: 'silse-motion-pulse', duration: 2000, easing: 'ease-in-out' },
    'reward-pop': { animation: 'silse-motion-reward-pop', duration: 400, easing: 'ease-out' },
    'correct-burst': { animation: 'silse-motion-correct-burst', duration: 600, easing: 'ease-out' },
  },
} as unknown as MpiDesignContract;

describe('MOTION-PRESET-01 — Scope C: React composables use motion classes', () => {
  it('9. ScenePanel applies silse-motion-entrance-fade + silse-motion-hover-lift', () => {
    const { container } = render(<ScenePanel contract={fakeContract}>Hello</ScenePanel>);
    const panel = container.querySelector('.silse-block-panel');
    expect(panel).toBeInTheDocument();
    expect(panel?.className).toContain('silse-motion-entrance-fade');
    expect(panel?.className).toContain('silse-motion-hover-lift');
  });

  it('10. SceneChip applies silse-motion-hover-lift', () => {
    const { container } = render(<SceneChip contract={fakeContract} label="Chip" />);
    const chip = container.querySelector('.silse-block-chip');
    expect(chip?.className).toContain('silse-motion-hover-lift');
  });

  it('11. ActionButtonBlock applies silse-motion-hover-lift (no inline onMouseEnter)', () => {
    const { container } = render(<ActionButtonBlock contract={fakeContract} label="Click" />);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('silse-motion-hover-lift');
    // Source must not have inline onMouseEnter/onMouseLeave that does transform manually
    const source = readFileSync(
      resolve(__dirname, '../components/scene-blocks/index.tsx'),
      'utf-8',
    );
    const fnStart = source.indexOf('export function ActionButtonBlock');
    // Find the next `export function` after ActionButtonBlock — that's the boundary
    const nextExport = source.indexOf('export function', fnStart + 1);
    const fnBlock = source.slice(fnStart, nextExport === -1 ? undefined : nextExport);
    expect(fnBlock, 'ActionButtonBlock must not use onMouseEnter').not.toContain('onMouseEnter');
    expect(fnBlock, 'ActionButtonBlock must not use onMouseLeave').not.toContain('onMouseLeave');
  });

  it('12. RevealBlock applies silse-motion-feedback-pop when revealed', () => {
    const { container, rerender } = render(
      <RevealBlock contract={fakeContract} label="Hint" text="Answer" />,
    );
    // Initially not revealed → no feedback-pop class
    let reveal = container.querySelector('.silse-block-reveal');
    expect(reveal?.className).not.toContain('silse-motion-feedback-pop');
    // Click to reveal
    reveal?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    rerender(<RevealBlock contract={fakeContract} label="Hint" text="Answer" />);
    reveal = container.querySelector('.silse-block-reveal');
    expect(reveal?.className).toContain('silse-motion-feedback-pop');
  });

  it('13. ScoreSummaryBlock applies silse-motion-reward-pop', () => {
    const { container } = render(
      <ScoreSummaryBlock contract={fakeContract} score={80} maxScore={100} level="Gold" />,
    );
    const summary = container.querySelector('.silse-block-score-summary');
    expect(summary?.className).toContain('silse-motion-reward-pop');
  });

  it('14. SceneHeader applies silse-motion-entrance-slide-up', () => {
    const { container } = render(
      <SceneHeader contract={fakeContract} title="Test Title" chipLabel="Chip" />,
    );
    const header = container.querySelector('.silse-block-header');
    expect(header?.className).toContain('silse-motion-entrance-slide-up');
  });
});

// ---------------------------------------------------------------------------
// SCOPE D — Export parity: every motion class in styles.css is also in export HTML
// ---------------------------------------------------------------------------

describe('MOTION-PRESET-01 — Scope D: export parity', () => {
  it('15. export HTML contains every silse-motion-* keyframe + class from editor CSS', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project);
    const motionClasses = getAllMotionClassNames();
    motionClasses.forEach((cls) => {
      expect(html, `${cls} should be in export HTML`).toContain(`.${cls}`);
    });
    // Keyframes in export too
    expect(html).toContain('@keyframes silse-motion-entrance-fade-kf');
    expect(html).toContain('@keyframes silse-motion-feedback-pop-kf');
    expect(html).toContain('@keyframes silse-motion-reward-pop-kf');
  });

  it('16. export HTML has prefers-reduced-motion block that disables motion', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project);
    // Find the motion-specific reduced-motion block
    const idx = html.indexOf('MOTION-PRESET-01');
    expect(idx).toBeGreaterThan(-1);
    const block = html.substring(idx, idx + 4000);
    expect(block).toContain('prefers-reduced-motion: reduce');
    expect(block).toContain('animation:none !important');
    expect(block).toContain('transition:none !important');
    expect(block).toContain('transform:none !important');
  });

  it('17. export ScenePanel/ActionButton/Reveal/ScoreSummary builders attach motion classes', () => {
    const source = readFileSync(
      resolve(__dirname, '../export/export-html.ts'),
      'utf-8',
    );
    // exportHeader: slide-up
    const headerFnStart = source.indexOf('function exportHeader');
    const headerFnEnd = source.indexOf('function exportPanel', headerFnStart);
    const headerBlock = source.slice(headerFnStart, headerFnEnd);
    expect(headerBlock).toContain('silse-motion-entrance-slide-up');

    // exportPanel: entrance-fade + hover-lift
    const panelFnStart = source.indexOf('function exportPanel');
    const panelFnEnd = source.indexOf('function exportDiscussionBanner', panelFnStart);
    const panelBlock = source.slice(panelFnStart, panelFnEnd);
    expect(panelBlock).toContain('silse-motion-entrance-fade');
    expect(panelBlock).toContain('silse-motion-hover-lift');

    // exportActionButton: hover-lift
    const btnFnStart = source.indexOf('function exportActionButton');
    const btnFnEnd = source.indexOf('function exportTabs', btnFnStart);
    const btnBlock = source.slice(btnFnStart, btnFnEnd);
    expect(btnBlock).toContain('silse-motion-hover-lift');

    // exportRevealBlock: feedback-pop (conditional on revealed)
    const revealFnStart = source.indexOf('function exportRevealBlock');
    const revealFnEnd = source.indexOf('function exportScoreSummary', revealFnStart);
    const revealBlock = source.slice(revealFnStart, revealFnEnd);
    expect(revealBlock).toContain('silse-motion-feedback-pop');

    // exportScoreSummary: reward-pop
    const scoreFnStart = source.indexOf('function exportScoreSummary');
    const scoreFnEnd = source.indexOf('function exportPortfolio', scoreFnStart);
    const scoreBlock = source.slice(scoreFnStart, scoreFnEnd);
    expect(scoreBlock).toContain('silse-motion-reward-pop');
  });
});

// ---------------------------------------------------------------------------
// SCOPE E — Discipline: no new library, no new scene type, no heavy schema
// ---------------------------------------------------------------------------

describe('MOTION-PRESET-01 — Scope E: discipline', () => {
  it('18. no new animation library imported (no framer-motion, no GSAP, no animejs)', () => {
    const files = [
      '../core/style-packs/motion-preset.ts',
      '../components/scene-blocks/index.tsx',
      '../export/export-html.ts',
    ];
    // Look for actual `import ... from "<lib>"` patterns — NOT bare mentions in comments.
    const libPatterns = [
      /from\s+['"]framer-motion['"]/,
      /from\s+['"]gsap['"]/,
      /from\s+['"]animejs['"]/,
      /from\s+['"]motion['"]/,
      /from\s+['"]@lottiefiles\/react-lottie-player['"]/,
    ];
    files.forEach((rel) => {
      const src = readFileSync(resolve(__dirname, rel), 'utf-8');
      libPatterns.forEach((p) => {
        expect(p.test(src), `${rel} must not match forbidden animation-lib import pattern ${p}`).toBe(false);
      });
    });
  });

  it('19. motion-preset.ts has no React/DOM imports (pure function)', () => {
    const src = readFileSync(
      resolve(__dirname, '../core/style-packs/motion-preset.ts'),
      'utf-8',
    );
    expect(src).not.toContain("from 'react'");
    expect(src).not.toContain('from "react"');
    expect(src).not.toContain('document.');
    expect(src).not.toContain('window.');
  });

  it('20. motion-preset.ts only imports from mpi-design-contract (no store, no schema bloat)', () => {
    const src = readFileSync(
      resolve(__dirname, '../core/style-packs/motion-preset.ts'),
      'utf-8',
    );
    // The only allowed import line
    expect(src).toMatch(/import type \{ DesignMotionPreset \} from '\.\.\/mpi-design-contract';/);
    // No new schema type added
    expect(src).not.toContain('ai-mpi-json');
    expect(src).not.toContain('editor-store');
    expect(src).not.toContain('scene-renderer');
  });

  it('21. no new scene type added — schema.ts unchanged for motion', () => {
    const src = readFileSync(
      resolve(__dirname, '../core/ai-mpi-json/schema.ts'),
      'utf-8',
    );
    // The motion system reuses existing DesignMotionPreset names — no new sceneType
    // Just verify the file is unchanged in size by checking no motion-* references leaked in
    expect(src).not.toContain('silse-motion-');
    expect(src).not.toContain('motion-preset');
  });

  it('22. DEFAULT_MOTION_PROFILE class names are stable (snapshot-like)', () => {
    // These class names are part of the contract — changing them silently
    // breaks export parity and existing tests. Lock them down.
    expect(DEFAULT_MOTION_PROFILE.hoverLiftClass).toBe('silse-motion-hover-lift');
    expect(DEFAULT_MOTION_PROFILE.entranceFadeClass).toBe('silse-motion-entrance-fade');
    expect(DEFAULT_MOTION_PROFILE.entranceSlideUpClass).toBe('silse-motion-entrance-slide-up');
    expect(DEFAULT_MOTION_PROFILE.feedbackPopClass).toBe('silse-motion-feedback-pop');
    expect(DEFAULT_MOTION_PROFILE.classForPreset['soft-fade']).toBe('silse-motion-soft-fade');
    expect(DEFAULT_MOTION_PROFILE.classForPreset['slide-up']).toBe('silse-motion-slide-up');
    expect(DEFAULT_MOTION_PROFILE.classForPreset['pulse']).toBe('silse-motion-pulse');
    expect(DEFAULT_MOTION_PROFILE.classForPreset['reward-pop']).toBe('silse-motion-reward-pop');
    expect(DEFAULT_MOTION_PROFILE.classForPreset['correct-burst']).toBe('silse-motion-correct-burst');
    expect(DEFAULT_MOTION_PROFILE.classForPreset['none']).toBe('');
  });
});
