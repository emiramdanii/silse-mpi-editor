/**
 * DEEP-STYLE-INJECTION-01 — Spot-check verification script.
 * Generates an actual export HTML with all 5 customStyle keys and verifies
 * the pre-computed CSS strings appear in the output.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { templateToBlueprint, TEMPLATE_PPKN_NORMA } from '../src/core/guided-flow/pedagogical-templates';
import { aiBlueprintToSimpleProject } from '../src/core/ai-mpi-json/aiBlueprintToSimpleProject';
import { exportProjectToHtml } from '../src/export/export-html';

const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);

// Set customStyle with all 5 element keys on the first scene (cover)
bp.scenes[0].slots[0].customStyle = {
  shell: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  header: { borderBottom: '4px solid #ff00ff', fontSize: '52px' },
  panel: { borderRadius: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  chip: { background: 'rgba(255,255,255,0.15)', color: '#ffffff' },
  button: { background: 'linear-gradient(135deg, #aa00ff, #00aaff)', borderRadius: '8px' },
};

const project = aiBlueprintToSimpleProject(bp);
const html = exportProjectToHtml(project);

// Verify all 5 CSS strings appear in the HTML
const checks = [
  { key: 'shell', needle: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { key: 'header.borderBottom', needle: 'border-bottom:4px solid #ff00ff' },
  { key: 'header.fontSize', needle: 'font-size:52px' },
  { key: 'panel.borderRadius', needle: 'border-radius:24px' },
  { key: 'panel.boxShadow', needle: 'box-shadow:0 20px 60px rgba(0,0,0,0.3)' },
  { key: 'chip.background', needle: 'background:rgba(255,255,255,0.15)' },
  { key: 'chip.color', needle: 'color:#ffffff' },
  { key: 'button.background', needle: 'linear-gradient(135deg, #aa00ff, #00aaff)' },
  { key: 'button.borderRadius', needle: 'border-radius:8px' },
];

let allPass = true;
console.log('=== DEEP-STYLE-INJECTION-01 Spot-Check ===\n');
for (const { key, needle } of checks) {
  const found = html.includes(needle);
  console.log(`${found ? '✓' : '✗'} ${key}: "${needle.substring(0, 50)}..."`);
  if (!found) allPass = false;
}

// Also verify the customStyleCss JSON structure exists
const hasCustomStyleCss = html.includes('"customStyleCss"');
console.log(`\n${hasCustomStyleCss ? '✓' : '✗'} customStyleCss JSON field present in render model`);
if (!hasCustomStyleCss) allPass = false;

// Save the HTML for manual inspection
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const outPath = resolve(__dirname, '../../download/deep-style-injection-spot-check.html');
writeFileSync(outPath, html);
console.log(`\nHTML saved to: ${outPath}`);
console.log(`\n=== Result: ${allPass ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED'} ===`);
process.exit(allPass ? 0 : 1);
