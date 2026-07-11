import { describe, it, expect } from 'vitest';
import { exportProjectToHtml } from '../export/export-html';
import { getTopicById } from '../core/guided-flow/mpi-topic-catalog';
import { generateMpiFromTopic } from '../core/guided-flow/generate-mpi-from-topic';
import type { SimpleProject } from '../core/types';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

function applyStylePack(project: SimpleProject, stylePackId: string): SimpleProject {
  return { ...project, stylePackId };
}

/**
 * Commit 6 byte-identical verification.
 *
 * Phase 1 (BEFORE refactoring): Run with SAVE_BASELINE=true to save the
 *   current export HTML output for 3 style packs to /tmp/fase3a-baseline-*.html.
 * Phase 2 (AFTER refactoring): Run normally to compare the current output
 *   with the saved baseline. All 3 style packs must be byte-identical.
 *
 * Usage:
 *   SAVE_BASELINE=true npx vitest run src/tests/fase3a-commit6-verify.test.ts
 *   npx vitest run src/tests/fase3a-commit6-verify.test.ts
 */

const STYLE_PACKS = ['modern-clean', 'soft-classroom', 'mission-dark'] as const;
const BASELINE_DIR = '/tmp';

function getExportHtml(stylePackId: string): string {
  const topic = getTopicById('ppkn-7-norma')!;
  const { project } = generateMpiFromTopic(topic);
  return exportProjectToHtml(applyStylePack(project, stylePackId));
}

const SAVE_BASELINE = process.env.SAVE_BASELINE === 'true';

describe('Fase 3a Commit 6 — byte-identical verification', () => {
  for (const stylePackId of STYLE_PACKS) {
    it(`${stylePackId}: export HTML is byte-identical to baseline`, () => {
      const html = getExportHtml(stylePackId);
      const baselinePath = `${BASELINE_DIR}/fase3a-baseline-${stylePackId}.html`;

      if (SAVE_BASELINE) {
        writeFileSync(baselinePath, html);
        console.log(`[baseline] Saved ${baselinePath} (${html.length} bytes)`);
        return;
      }

      // Compare with baseline
      expect(existsSync(baselinePath), `Baseline file ${baselinePath} not found. Run with SAVE_BASELINE=true first.`).toBe(true);
      const baseline = readFileSync(baselinePath, 'utf8');
      expect(html.length).toBe(baseline.length);
      expect(html).toBe(baseline);
    });
  }
});
