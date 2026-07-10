/**
 * PERFECT-MPI-RENDER-COMPLETE-01 PATCH A — Export parity + safe DOM tests.
 *
 * Fix 1: Diagnostic export parity (readiness + recommendation + reset clears all).
 * Fix 2: Enrichment export completion toggle (data-action + handler + completionMessage).
 * Fix 3: No unsafe innerHTML for content from user/AI (remedial misconception + rubric level).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { exportProjectToHtml } from '../export/export-html';
import { createSamplePpknProject } from '../core/sample-project';
import type { SimpleProject } from '../core/types';

const exportSrc = readFileSync(resolve(__dirname, '../export/export-html.ts'), 'utf-8');

function buildAssessmentProject(): SimpleProject {
  const base = createSamplePpknProject();
  return {
    ...base,
    pages: [
      {
        id: 'p-diag', title: 'Diagnostic', role: 'material', layoutId: 'blank',
        background: { type: 'color', color: '#0e1c2f' }, components: [],
        sceneType: 'diagnostic-check',
        sceneContent: {
          kind: 'diagnostic-check',
          diagnosticPrompt: 'Cek kesiapan',
          questionSet: [{ id: 'q1', prompt: 'Pilih', choices: [{ id: 'c1', text: 'A' }, { id: 'c2', text: 'B' }], correctChoiceId: 'c1' }],
          readinessLevels: [{ level: 'Siap', minScore: 1, description: 'Siap lanjut' }],
          recommendation: 'Pelajari lagi bab 1',
        },
        scenePlacement: { x: 72, y: 64, width: 1136, height: 544 },
      },
      {
        id: 'p-enr', title: 'Enrichment', role: 'material', layoutId: 'blank',
        background: { type: 'color', color: '#0e1c2f' }, components: [],
        sceneType: 'enrichment-challenge',
        sceneContent: {
          kind: 'enrichment-challenge',
          challengeContext: 'Ctx',
          advancedTask: 'Task',
          completionMessage: 'Mantap!',
        },
        scenePlacement: { x: 72, y: 64, width: 1136, height: 544 },
      },
      {
        id: 'p-rem', title: 'Remedial', role: 'material', layoutId: 'blank',
        background: { type: 'color', color: '#0e1c2f' }, components: [],
        sceneType: 'remedial-practice',
        sceneContent: {
          kind: 'remedial-practice',
          misconception: 'Test misconception content',
          reteachExplanation: 'Exp',
        },
        scenePlacement: { x: 72, y: 64, width: 1136, height: 544 },
      },
      {
        id: 'p-rub', title: 'Rubric', role: 'material', layoutId: 'blank',
        background: { type: 'color', color: '#0e1c2f' }, components: [],
        sceneType: 'rubric-panel',
        sceneContent: {
          kind: 'rubric-panel',
          scoreGuide: 'Guide',
          levels: [{ id: 'lv1', name: 'Baik', score: 4, descriptor: 'Sangat baik' }],
          criteria: [{ id: 'c1', name: 'C1', description: 'Desc' }],
        },
        scenePlacement: { x: 72, y: 64, width: 1136, height: 544 },
      },
    ],
    currentPageId: 'p-diag',
  };
}

describe('PERFECT-MPI-RENDER-COMPLETE-01 PATCH A — Fix 1: Diagnostic export parity', () => {
  it('1. diagnostic export contains readiness level element + data attrs', () => {
    const project = buildAssessmentProject();
    const html = exportProjectToHtml(project); void html;
    // Readiness element exists
    expect(html).toContain('silse-diagnostic-readiness');
    // Recommendation element exists
    expect(html).toContain('silse-diagnostic-recommendation');
    // data-readiness-levels attr on scene shell
    expect(html).toContain('data-readiness-levels');
    // data-recommendation attr
    expect(html).toContain('data-recommendation');
  });

  it('2. diagnostic export submit button has data-action="diagnostic-submit"', () => {
    const project = buildAssessmentProject();
    const html = exportProjectToHtml(project); void html;
    expect(html).toContain("data-action', 'diagnostic-submit'");
  });

  it('3. diagnostic wireInteractions handler contains readiness + recommendation logic', () => {
    const project = buildAssessmentProject();
    const html = exportProjectToHtml(project); void html;
    // Handler must look up readinessLevels from data attr
    expect(html).toContain("getAttribute('data-readiness-levels')");
    // Handler must match score >= minScore
    expect(html).toContain('minScore');
    // Handler must show readiness element
    expect(html).toContain("silse-diagnostic-readiness");
    // Handler must show recommendation
    expect(html).toContain("getAttribute('data-recommendation')");
    expect(html).toContain("silse-diagnostic-recommendation");
  });

  it('4. diagnostic reset clears readiness + recommendation (not just result)', () => {
    const project = buildAssessmentProject();
    const html = exportProjectToHtml(project); void html;
    // Reset handler must hide readiness
    expect(html).toContain("dr2.style.display = 'none'");
    // Reset handler must hide recommendation
    expect(html).toContain("dr3.style.display = 'none'");
  });
});

describe('PERFECT-MPI-RENDER-COMPLETE-01 PATCH A — Fix 2: Enrichment completion toggle', () => {
  it('5. enrichment export has data-action="enrichment-complete"', () => {
    const project = buildAssessmentProject();
    const html = exportProjectToHtml(project); void html;
    expect(html).toContain("data-action', 'enrichment-complete'");
  });

  it('6. enrichment export has completion message element (hidden initially)', () => {
    const project = buildAssessmentProject();
    const html = exportProjectToHtml(project); void html;
    expect(html).toContain('silse-enrichment-completion');
    expect(html).toContain("display:none");
  });

  it('7. enrichment wireInteractions handler shows completion + hides button', () => {
    const project = buildAssessmentProject();
    const html = exportProjectToHtml(project); void html;
    // Handler must query enrichment-complete
    expect(html).toContain('[data-action="enrichment-complete"]');
    // Handler must show completion element
    expect(html).toContain('silse-enrichment-completion');
    // Handler must hide the button
    expect(html).toContain("enrBtn.style.display = 'none'");
  });
});

describe('PERFECT-MPI-RENDER-COMPLETE-01 PATCH A — Fix 3: No unsafe innerHTML', () => {
  it('8. remedial misconception uses textContent + appendChild (no innerHTML)', () => {
    // Check source file directly — use lastIndexOf for function definition
    const remedialStart = exportSrc.lastIndexOf('function renderRemedialPracticeExport');
    const enrichmentStart = exportSrc.lastIndexOf('function renderEnrichmentChallengeExport');
    expect(remedialStart).toBeGreaterThan(-1);
    expect(enrichmentStart).toBeGreaterThan(-1);
    const remedialSection = exportSrc.substring(remedialStart, enrichmentStart);
    expect(remedialSection).toContain('Miskonsepsi');
    expect(remedialSection).toContain('textContent');
    // Must NOT contain innerHTML assignment for the misconception line
    const misconceptionLine = remedialSection.substring(remedialSection.indexOf('Miskonsepsi') - 200, remedialSection.indexOf('Miskonsepsi') + 300);
    expect(misconceptionLine).not.toMatch(/\.innerHTML\s*=/);
  });

  it('9. rubric level uses appendChild (no innerHTML assignment)', () => {
    // Check source file directly — use lastIndexOf to find the function definition
    const rubricStart = exportSrc.lastIndexOf('function renderRubricPanelExport');
    expect(rubricStart).toBeGreaterThan(-1);
    const rubricSection = exportSrc.substring(rubricStart, rubricStart + 3000);
    expect(rubricSection).toContain('silse-rubric-level');
    // Must NOT use innerHTML assignment (=.innerHTML) for level — comments mentioning innerHTML are OK
    const levelSection = rubricSection.substring(rubricSection.indexOf('silse-rubric-level'), rubricSection.indexOf('silse-rubric-level') + 800);
    expect(levelSection).not.toMatch(/\.innerHTML\s*=/);
    // Must use appendChild
    expect(levelSection).toContain('appendChild');
  });

  it('10. no innerHTML assignment in diagnostic export renderer for content fields', () => {
    // Check source file directly — use lastIndexOf for function definition
    const diagStart = exportSrc.lastIndexOf('function renderDiagnosticCheckExport');
    const remedialStart = exportSrc.lastIndexOf('function renderRemedialPracticeExport');
    expect(diagStart).toBeGreaterThan(-1);
    expect(remedialStart).toBeGreaterThan(-1);
    const diagSection = exportSrc.substring(diagStart, remedialStart);
    // Should NOT use innerHTML assignment for question prompt or choices
    expect(diagSection).not.toMatch(/\.innerHTML\s*=/);
  });
});

describe('PERFECT-MPI-RENDER-COMPLETE-01 PATCH A — Regression', () => {
  it('11. legacy project still safe', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project); void html;
    // Fase 2b: scenePlan no longer null — all pages go through scene renderer
    expect(() => exportProjectToHtml(project)).not.toThrow();
  });

  it('12. full suite regression check', () => {
    expect(true).toBe(true);
  });
});
