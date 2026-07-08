/**
 * LAYOUT-STYLE-01 AUDIT — End-to-end spot-check.
 * Generate export HTML dengan customStyle.grid aktif pada scene yang punya SceneGrid
 * (ResultSummary dengan reviewCards). Verify CSS strings muncul di output.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { templateToBlueprint, TEMPLATE_PPKN_NORMA } from '../src/core/guided-flow/pedagogical-templates';
import { aiBlueprintToSimpleProject } from '../src/core/ai-mpi-json/aiBlueprintToSimpleProject';
import { exportProjectToHtml } from '../src/export/export-html';

// Find ResultSummary scene in template
const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
console.log('Total scenes:', bp.scenes.length);
const resultSummaryScene = bp.scenes.find(s => s.sceneType === 'result-summary');
console.log('ResultSummary scene found:', !!resultSummaryScene);
if (resultSummaryScene) {
  console.log('  sceneId:', resultSummaryScene.sceneId);
  console.log('  slots:', resultSummaryScene.slots.length);

  // Add customStyle.grid to ResultSummary slot
  resultSummaryScene.slots[0].customStyle = {
    grid: {
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '24px',
      display: 'grid',
    },
    shell: { background: 'linear-gradient(135deg, #1e3c72, #2a5298)' },
    panel: { borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' },
  };
}

const project = aiBlueprintToSimpleProject(bp);
const html = exportProjectToHtml(project);

// Verify checks
const checks = [
  { name: 'customStyleCss JSON field present', needle: '"customStyleCss"', expected: true },
  { name: 'grid CSS string in JSON', needle: '"grid"', expected: true },
  { name: 'grid-template-columns:repeat(3, 1fr)', needle: 'grid-template-columns:repeat(3, 1fr)', expected: true },
  { name: 'gap:24px', needle: 'gap:24px', expected: true },
  { name: 'shell gradient', needle: 'linear-gradient(135deg, #1e3c72, #2a5298)', expected: true },
  { name: 'panel borderRadius:16px', needle: 'border-radius:16px', expected: true },
  { name: 'panel boxShadow', needle: 'box-shadow:0 8px 24px rgba(0,0,0,0.2)', expected: true },
  // Dangerous values should NOT appear
  { name: 'NO position:absolute in customStyleCss', needle: '"grid":"position', expected: false },
  { name: 'NO width:9999px', needle: 'width:9999px', expected: false },
];

let allPass = true;
console.log('\n=== LAYOUT-STYLE-01 End-to-End Spot-Check ===\n');
for (const { name, needle, expected } of checks) {
  const found = html.includes(needle);
  const pass = found === expected;
  const status = pass ? '✓' : '✗';
  const foundStr = found ? 'FOUND' : 'NOT FOUND';
  console.log(`${status} ${name}: ${foundStr}`);
  if (!pass) allPass = false;
}

// Save HTML for manual inspection
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const outPath = resolve(__dirname, '../../download/layout-style-01-spot-check.html');
writeFileSync(outPath, html);
console.log(`\nHTML saved to: ${outPath}`);
console.log(`\n=== Result: ${allPass ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED'} ===`);
process.exit(allPass ? 0 : 1);
