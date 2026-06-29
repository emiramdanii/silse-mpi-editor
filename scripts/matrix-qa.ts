/**
 * Matrix QA measurement script.
 * Tests all valid (style pack × layout preset) combinations on generated PPKn.
 */
import { generateMpiFromTopic } from '../src/core/guided-flow/generate-mpi-from-topic';
import { getTopicById } from '../src/core/guided-flow/mpi-topic-catalog';
import { resolveStylePackV1, listStylePacksV1, getProjectStylePackIdV1 } from '../src/core/style-packs/style-pack-registry';
import {
  listLayoutPresets,
  listLayoutPresetsForRole,
  getDefaultLayoutPresetIdForRole,
} from '../src/core/layout-presets/layout-preset-registry';
import { applyLayoutPresetToPage } from '../src/core/layout-presets/apply-layout-preset';
import { stylePackToProjectStyle } from '../src/core/style-presets';
import { validateLayoutQuality } from '../src/core/design/layout-quality';
import { checkExportQuality } from '../src/core/export-quality-gate';
import { exportProjectToHtml } from '../src/export/export-html';
import type { SimpleProject } from '../src/core/types';

const STYLE_PACKS = listStylePacksV1();

interface MatrixResult {
  stylePack: string;
  layoutPreset: string;
  pageRole: string;
  pageTitle: string;
  exportOk: boolean;
  fatalCount: number;
  warningCount: number;
  outOfCanvas: number;
  largeOverlap: number;
  htmlLength: number;
  error?: string;
}

function applyStylePack(project: SimpleProject, stylePackId: string): SimpleProject {
  const resolvedId = getProjectStylePackIdV1(stylePackId);
  const pack = resolveStylePackV1(resolvedId);
  const projectStyle = stylePackToProjectStyle(pack);
  return { ...project, stylePackId: resolvedId, style: projectStyle };
}

function applyLayoutToAllPages(project: SimpleProject, presetId: string): SimpleProject {
  return {
    ...project,
    pages: project.pages.map((page) => {
      // Only apply preset if it supports the page's role.
      const presets = listLayoutPresetsForRole(page.role);
      const matching = presets.find((p) => p.id === presetId);
      if (matching) {
        return applyLayoutPresetToPage(page, presetId);
      }
      return page;
    }),
  };
}

const results: MatrixResult[] = [];

console.log('='.repeat(100));
console.log('VISUAL COMBINATION QA MATRIX');
console.log('='.repeat(100));

for (const stylePack of STYLE_PACKS) {
  console.log(`\n--- Style Pack: ${stylePack.id} ---`);

  for (const preset of listLayoutPresets()) {
    // Generate fresh PPKn for each combination.
    const topic = getTopicById('ppkn-7-norma')!;
    const { project } = generateMpiFromTopic(topic);

    // Apply style pack.
    let styledProject = applyStylePack(project, stylePack.id);

    // Apply layout preset to all pages where it's supported.
    styledProject = applyLayoutToAllPages(styledProject, preset.id);

    // For matrix reporting, find a page that has the preset applied.
    const samplePage = styledProject.pages.find((p) =>
      listLayoutPresetsForRole(p.role).some((pp) => pp.id === preset.id),
    );

    if (!samplePage) {
      // Preset doesn't match any page role — skip (not a valid combination).
      continue;
    }

    const result: MatrixResult = {
      stylePack: stylePack.id,
      layoutPreset: preset.id,
      pageRole: samplePage.role,
      pageTitle: samplePage.title,
      exportOk: false,
      fatalCount: 0,
      warningCount: 0,
      outOfCanvas: 0,
      largeOverlap: 0,
      htmlLength: 0,
    };

    try {
      // Run export quality check.
      const report = checkExportQuality(styledProject);
      result.fatalCount = report.fatalIssues.length;
      result.warningCount = report.warningIssues.length;

      // Count specific layout issues.
      for (const page of styledProject.pages) {
        const layoutIssues = validateLayoutQuality(page).issues;
        result.outOfCanvas += layoutIssues.filter((i) => i.code === 'OUT_OF_CANVAS').length;
        result.largeOverlap += layoutIssues.filter((i) => i.code === 'LARGE_OVERLAP').length;
      }

      // Run export.
      const html = exportProjectToHtml(styledProject);
      result.exportOk = typeof html === 'string' && html.length > 0;
      result.htmlLength = html.length;
    } catch (e) {
      result.error = (e as Error).message;
    }

    results.push(result);

    const status = result.error
      ? 'CRASH'
      : result.fatalCount > 0
        ? 'FATAL'
        : result.exportOk
          ? 'OK'
          : 'EXPORT_FAIL';

    console.log(
      `  ${preset.id.padEnd(25)} | ${samplePage.role.padEnd(18)} | ${status.padEnd(6)} | fatal=${result.fatalCount} warn=${result.warningCount} OOC=${result.outOfCanvas} LO=${result.largeOverlap} | html=${result.htmlLength}${result.error ? ' ERROR: ' + result.error : ''}`,
    );
  }
}

console.log('\n' + '='.repeat(100));
console.log('SUMMARY');
console.log('='.repeat(100));

const total = results.length;
const ok = results.filter((r) => !r.error && r.exportOk && r.fatalCount === 0).length;
const fatal = results.filter((r) => r.fatalCount > 0).length;
const crash = results.filter((r) => r.error).length;

console.log(`Total combinations: ${total}`);
console.log(`OK: ${ok}`);
console.log(`Fatal (issues): ${fatal}`);
console.log(`Crash (error): ${crash}`);

if (fatal > 0 || crash > 0) {
  console.log('\n--- PROBLEMATIC COMBINATIONS ---');
  for (const r of results.filter((r) => r.fatalCount > 0 || r.error)) {
    console.log(`  ${r.stylePack} + ${r.layoutPreset}: fatal=${r.fatalCount} error=${r.error ?? 'none'}`);
  }
}
