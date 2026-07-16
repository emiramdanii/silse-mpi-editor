/**
 * Audit: Export HTML dengan REAL Misi 2 project (dark text + dark bg).
 * Verify apakah contrast guard jalan di export pipeline.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { exportProjectToHtml } from '../export/export-html';
import { getDesignContractWithProjectStyle } from '../core/mpi-design-contract';
import { getLuminance, getContrastRatio, isDarkColor } from '../core/style/contrast-guard';

function loadRealMisi2Project() {
  const path = resolve(__dirname, '../../tmp/misi2-real.json');
  // Fallback: construct from sample if real project not available
  try {
    const raw = readFileSync(path, 'utf-8');
    return JSON.parse(raw).project;
  } catch {
    return null;
  }
}

describe('AUDIT: Real Misi 2 project export — contrast verification', () => {
  const project = loadRealMisi2Project();
  if (!project) {
    it.skip('Real Misi 2 project not available', () => {});
    return;
  }

  it('1. Contract palette.text should be white (auto-fixed) for dark bg', () => {
    const contract = getDesignContractWithProjectStyle(project.stylePackId, project.style);
    console.log('contract.palette:', {
      bg: contract.palette.background,
      surface: contract.palette.surface,
      text: contract.palette.text,
    });
    const bgIsDark = isDarkColor(contract.palette.background);
    if (bgIsDark) {
      const ratio = getContrastRatio(contract.palette.background, contract.palette.text);
      console.log(`text "${contract.palette.text}" on bg "${contract.palette.background}": ratio ${ratio.toFixed(2)}`);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('2. Export HTML :root should have white text on dark bg', () => {
    const html = exportProjectToHtml(project);
    const rootMatch = html.match(/:root\s*\{([^}]+)\}/);
    expect(rootMatch).not.toBeNull();
    const root = rootMatch![1];

    const textVar = root.match(/--silse-color-text:\s*([^;]+);/);
    const bgVar = root.match(/--silse-color-background:\s*([^;]+);/);
    console.log('Export :root text:', textVar?.[1], '| bg:', bgVar?.[1]);

    if (bgVar && isDarkColor(bgVar[1].trim())) {
      // Text should be light (white or near-white)
      const textVal = textVar?.[1].trim() ?? '';
      const lum = getLuminance(textVal);
      console.log(`Text luminance: ${lum.toFixed(3)} (should be > 0.5 for dark bg)`);
      expect(lum).toBeGreaterThan(0.5);
    }
  });

  it('3. Export HTML should NOT contain dark navy text color #17324d', () => {
    const html = exportProjectToHtml(project);
    // Check :root block only (renderer JS may reference old colors as fallback strings)
    const rootMatch = html.match(/:root\s*\{([^}]+)\}/);
    const root = rootMatch?.[1] ?? '';
    expect(root).not.toContain('#17324d');
  });

  it('4. Text colors in export HTML should have readable contrast on dark bg', () => {
    const html = exportProjectToHtml(project);
    const bg = project.style?.tokens?.colors?.background ?? '#ffffff';
    const bgIsDark = isDarkColor(bg);

    if (!bgIsDark) {
      expect(true).toBe(true); // skip for light theme
      return;
    }

    // Extract :root CSS vars (these are the actual text colors used)
    const rootMatch = html.match(/:root\s*\{([^}]+)\}/);
    const root = rootMatch?.[1] ?? '';
    const textVar = root.match(/--silse-color-text:\s*([^;]+);/)?.[1]?.trim();
    const mutedVar = root.match(/--silse-color-muted-text:\s*([^;]+);/)?.[1]?.trim();

    console.log('Text var:', textVar, '| Muted var:', mutedVar, '| Bg:', bg);

    // Verify text contrast
    if (textVar) {
      const ratio = getContrastRatio(bg, textVar);
      console.log(`Text "${textVar}" on bg "${bg}": ratio ${ratio.toFixed(2)}`);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
    // Verify mutedText contrast
    if (mutedVar) {
      const ratio = getContrastRatio(bg, mutedVar);
      console.log(`MutedText "${mutedVar}" on bg "${bg}": ratio ${ratio.toFixed(2)}`);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });
});
