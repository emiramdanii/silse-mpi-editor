/**
 * Diagnostic: AI sends incompatible colors (dark bg + light surface + dark text).
 * Trace what happens through the pipeline.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  normalizeAiMpiJson,
} from '../core/ai-mpi-json/normalizeAiMpiJson';
import {
  aiBlueprintToSimpleProject,
} from '../core/ai-mpi-json/aiBlueprintToSimpleProject';
import { exportProjectToHtml } from '../export/export-html';
import { getLuminance, getContrastRatio, isDarkColor } from '../core/style/contrast-guard';

function loadSampleBlueprint(): unknown {
  const path = resolve(__dirname, '../../samples/ai-mpi-json/foundation-blueprint.sample.json');
  return JSON.parse(readFileSync(path, 'utf-8'));
}

describe('CONTRAST-GUARD: dark bg + dark text + light surface → auto-fixed', () => {
  it('1. AI sends dark bg + dark text + light surface → all fixed', () => {
    const raw = loadSampleBlueprint() as Record<string, unknown>;
    (raw as { styleIntent: { styleId: string } }).styleIntent.styleId = 'mission-dark';
    (raw as { designSystem: { overrides: Record<string, unknown> } }).designSystem.overrides = {
      colors: {
        background: '#0b1728',   // dark
        surface: '#fffdf7',      // LIGHT CREAM (AI mistake)
        text: '#17324d',         // DARK NAVY (AI mistake)
        mutedText: '#61758a',    // medium gray
        primary: '#1d3557',
        border: '#334155',
      },
    };

    const blueprint = normalizeAiMpiJson(raw);
    const project = aiBlueprintToSimpleProject(blueprint);

    const tokens = project.style?.tokens?.colors!;

    // text harus di-fix ke putih (contrast dengan bg gelap)
    expect(tokens.text).toBe('#ffffff');
    // surface harus di-fix ke dark (bukan light cream lagi)
    expect(isDarkColor(tokens.surface)).toBe(true);
    expect(tokens.surface).not.toBe('#fffdf7');

    // mutedText harus di-fix ke putih
    expect(tokens.mutedText).toBe('#ffffff');

    // Verify contrast ratios
    const textBgRatio = getContrastRatio(tokens.background, tokens.text);
    expect(textBgRatio).toBeGreaterThanOrEqual(4.5);
  });

  it('2. Export HTML has correct CSS variables (no dark text on dark bg)', () => {
    const raw = loadSampleBlueprint() as Record<string, unknown>;
    (raw as { styleIntent: { styleId: string } }).styleIntent.styleId = 'mission-dark';
    (raw as { designSystem: { overrides: Record<string, unknown> } }).designSystem.overrides = {
      colors: {
        background: '#0b1728',
        surface: '#fffdf7',
        text: '#17324d',
        mutedText: '#61758a',
        primary: '#1d3557',
        border: '#334155',
      },
    };

    const blueprint = normalizeAiMpiJson(raw);
    const project = aiBlueprintToSimpleProject(blueprint);
    const html = exportProjectToHtml(project);

    // Extract :root block
    const rootMatch = html.match(/:root\s*\{([^}]+)\}/);
    expect(rootMatch).not.toBeNull();
    const root = rootMatch![1];

    // text must NOT be dark navy
    expect(root).not.toContain('--silse-color-text: #17324d');
    // text must be white
    expect(root).toContain('--silse-color-text: #ffffff');
    // surface must NOT be light cream
    expect(root).not.toContain('--silse-color-surface: #fffdf7');
  });

  it('3. Canvas gradient for material is dark → dark (not dark → cream)', () => {
    const raw = loadSampleBlueprint() as Record<string, unknown>;
    (raw as { styleIntent: { styleId: string } }).styleIntent.styleId = 'mission-dark';
    (raw as { designSystem: { overrides: Record<string, unknown> } }).designSystem.overrides = {
      colors: {
        background: '#0b1728',
        surface: '#fffdf7',
        text: '#17324d',
      },
    };

    const blueprint = normalizeAiMpiJson(raw);
    const project = aiBlueprintToSimpleProject(blueprint);
    const html = exportProjectToHtml(project);

    // Find material gradient
    const gradMatch = html.match(/#silse-canvas\[data-page-role="material"\][^{]*\{[^}]*background:\s*([^;]+);/);
    expect(gradMatch).not.toBeNull();
    const gradient = gradMatch![1];

    // Gradient must NOT contain light cream
    expect(gradient).not.toContain('#fffdf7');
    expect(gradient).not.toContain('#fff');
    // Must contain dark bg
    expect(gradient).toContain('#0b1728');
  });

  it('4. Title text color in resolvedStyle is white (not dark navy)', () => {
    const raw = loadSampleBlueprint() as Record<string, unknown>;
    (raw as { styleIntent: { styleId: string } }).styleIntent.styleId = 'mission-dark';
    (raw as { designSystem: { overrides: Record<string, unknown> } }).designSystem.overrides = {
      colors: {
        background: '#0b1728',
        surface: '#fffdf7',
        text: '#17324d',
      },
    };

    const blueprint = normalizeAiMpiJson(raw);
    const project = aiBlueprintToSimpleProject(blueprint);
    const html = exportProjectToHtml(project);

    // Find title color in render model — should be #ffffff, not #17324d
    // The title color comes from contract.palette.text which comes from tokens.colors.text
    expect(html).not.toContain('"color":"#17324d"');
  });
});
