/**
 * PERFECT-MPI-RENDER-COMPLETE-01 — Tests.
 *
 * Tests 5 assessment/support scene renderers: diagnostic-check, remedial-practice,
 * enrichment-challenge, worksheet-activity, rubric-panel.
 * React + export parity + interaction + inspector + regression.
 */

import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  normalizeBlueprint,
  aiJsonToMpiContainer,
} from '../core/ai-mpi-json';
import { getDesignContract } from '../core/mpi-design-contract';
import { renderScenePlan } from '../core/scene-renderer';
import {
  DiagnosticCheckComposer,
  RemedialPracticeComposer,
  EnrichmentChallengeComposer,
  WorksheetActivityComposer,
  RubricPanelComposer,
} from '../components/scene-composers';
import { exportProjectToHtml } from '../export/export-html';
import { createSamplePpknProject } from '../core/sample-project';
import { SceneContentEditor } from '../editor/SceneContentEditor';

const contract = getDesignContract('golden-reference');

function loadGoldenRef() {
  return JSON.parse(readFileSync(resolve(__dirname, '../../samples/ai-mpi-json/macam-norma-reference.sample.json'), 'utf-8'));
}

function build5SceneProject() {
  const base = createSamplePpknProject();
  return {
    ...base,
    pages: [
      { id: 'p-diag', title: 'Diagnostic', role: 'material' as const, layoutId: 'blank' as const, background: { type: 'color' as const, color: '#0e1c2f' }, components: [], sceneType: 'diagnostic-check', sceneContent: { kind: 'diagnostic-check', diagnosticPrompt: 'Test', questionSet: [{ id: 'q1', prompt: 'Pilih', choices: [{ id: 'c1', text: 'A' }, { id: 'c2', text: 'B' }], correctChoiceId: 'c1' }] }, scenePlacement: { x: 72, y: 64, width: 1136, height: 544 } },
      { id: 'p-rem', title: 'Remedial', role: 'material' as const, layoutId: 'blank' as const, background: { type: 'color' as const, color: '#0e1c2f' }, components: [], sceneType: 'remedial-practice', sceneContent: { kind: 'remedial-practice', misconception: 'Test', reteachExplanation: 'Exp' }, scenePlacement: { x: 72, y: 64, width: 1136, height: 544 } },
      { id: 'p-enr', title: 'Enrichment', role: 'material' as const, layoutId: 'blank' as const, background: { type: 'color' as const, color: '#0e1c2f' }, components: [], sceneType: 'enrichment-challenge', sceneContent: { kind: 'enrichment-challenge', challengeContext: 'Ctx', advancedTask: 'Task' }, scenePlacement: { x: 72, y: 64, width: 1136, height: 544 } },
      { id: 'p-ws', title: 'Worksheet', role: 'material' as const, layoutId: 'blank' as const, background: { type: 'color' as const, color: '#0e1c2f' }, components: [], sceneType: 'worksheet-activity', sceneContent: { kind: 'worksheet-activity', instruction: 'Do this', taskSteps: [{ id: 's1', prompt: 'Step 1' }] }, scenePlacement: { x: 72, y: 64, width: 1136, height: 544 } },
      { id: 'p-rub', title: 'Rubric', role: 'material' as const, layoutId: 'blank' as const, background: { type: 'color' as const, color: '#0e1c2f' }, components: [], sceneType: 'rubric-panel', sceneContent: { kind: 'rubric-panel', scoreGuide: 'Guide', criteria: [{ id: 'c1', name: 'C1', description: 'Desc' }] }, scenePlacement: { x: 72, y: 64, width: 1136, height: 544 } },
    ],
    currentPageId: 'p-diag',
  };
}

// ---------------------------------------------------------------------------
// SCOPE A — Diagnostic Check
// ---------------------------------------------------------------------------

describe('PERFECT-MPI-RENDER-COMPLETE-01 — Scope A: Diagnostic Check', () => {
  const diagContent = {
    diagnosticPrompt: 'Cek kesiapan',
    questionSet: [
      { id: 'q1', prompt: 'Apa itu norma?', choices: [{ id: 'c1', text: 'Aturan' }, { id: 'c2', text: 'Benda' }], correctChoiceId: 'c1' },
    ],
    recommendation: 'Pelajari lagi bab 1',
    readinessLevels: [{ level: 'Siap', minScore: 1, description: 'Siap lanjut' }],
  };

  it('1. diagnostic-check React render', () => {
    const { container } = render(<DiagnosticCheckComposer contract={contract} content={diagContent} />);
    expect(container.querySelector('.silse-scene-diagnostic-check')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="diagnostic-q-q1"]')).toBeInTheDocument();
  });

  it('2. diagnostic-check choice/check behavior', () => {
    const { container } = render(<DiagnosticCheckComposer contract={contract} content={diagContent} />);
    // Select correct choice
    fireEvent.click(container.querySelector('[data-testid="diagnostic-choice-q1-c1"]')!);
    // Click "Periksa Hasil"
    const submitBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Periksa')) as HTMLElement;
    fireEvent.click(submitBtn);
    // Result should appear
    expect(container.querySelector('[data-testid="diagnostic-result"]')).toBeInTheDocument();
    expect(container.textContent).toContain('1 / 1');
    expect(container.textContent).toContain('Siap');
  });

  it('3. diagnostic-check export actual scene', () => {
    const project = build5SceneProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-scene-diagnostic-check');
    expect(html).toContain('"sceneType":"diagnostic-check"');
    expect(html).toContain('silse-diagnostic-question');
    expect(html).toContain('silse-diagnostic-choice');
  });
});

// ---------------------------------------------------------------------------
// SCOPE B — Remedial Practice
// ---------------------------------------------------------------------------

describe('PERFECT-MPI-RENDER-COMPLETE-01 — Scope B: Remedial Practice', () => {
  const remContent = {
    misconception: 'Norma agama = norma hukum',
    reteachExplanation: 'Norma agama dari Tuhan, norma hukum dari negara',
    guidedPractice: [
      { id: 'rp1', prompt: 'Norma dari Tuhan?', choices: [{ id: 'rc1', text: 'Agama' }, { id: 'rc2', text: 'Hukum' }], correctChoiceId: 'rc1', hint: 'Pikirkan sumbernya' },
    ],
    retryQuestion: 'Sebutkan 2 contoh norma agama',
  };

  it('4. remedial-practice React render', () => {
    const { container } = render(<RemedialPracticeComposer contract={contract} content={remContent} />);
    expect(container.querySelector('.silse-scene-remedial-practice')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="remedial-q-rp1"]')).toBeInTheDocument();
  });

  it('5. remedial-practice hint/retry behavior', () => {
    const { container } = render(<RemedialPracticeComposer contract={contract} content={remContent} />);
    // Hint button exists
    expect(container.querySelector('[data-testid="remedial-hint-rp1"]')).toBeInTheDocument();
    // Click hint
    fireEvent.click(container.querySelector('[data-testid="remedial-hint-rp1"]')!);
    // Hint text should appear
    expect(container.textContent).toContain('Pikirkan sumbernya');
    // Click correct answer (the "Agama" choice button)
    const choices = container.querySelectorAll('[data-testid="remedial-q-rp1"] button');
    // Find the button with text "Agama"
    let correctBtn: HTMLElement | null = null;
    choices.forEach((b) => { if (b.textContent === 'Agama') correctBtn = b as HTMLElement; });
    expect(correctBtn).toBeTruthy();
    fireEvent.click(correctBtn!);
    // Feedback should show correct
    expect(container.querySelector('[data-testid="remedial-feedback-rp1"]')?.textContent).toContain('Benar');
  });

  it('6. remedial-practice export actual scene', () => {
    const project = build5SceneProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-scene-remedial-practice');
    expect(html).toContain('"sceneType":"remedial-practice"');
    expect(html).toContain('silse-remedial-question');
    expect(html).toContain('silse-remedial-hint');
  });
});

// ---------------------------------------------------------------------------
// SCOPE C — Enrichment Challenge
// ---------------------------------------------------------------------------

describe('PERFECT-MPI-RENDER-COMPLETE-01 — Scope C: Enrichment Challenge', () => {
  const enrContent = {
    challengeContext: 'Bayangkan masyarakat tanpa norma',
    advancedTask: 'Buat esai 200 kata',
    responseInput: 'Tulis esaimu...',
    rubricPreview: [{ criterion: 'Kedalaman', descriptor: 'Analisis mendalam' }],
    completionMessage: 'Mantap!',
  };

  it('7. enrichment-challenge React render', () => {
    const { container } = render(<EnrichmentChallengeComposer contract={contract} content={enrContent} />);
    expect(container.querySelector('.silse-scene-enrichment-challenge')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="enrichment-task"]')).toBeInTheDocument();
  });

  it('8. enrichment response input accepts text', () => {
    const { container } = render(<EnrichmentChallengeComposer contract={contract} content={enrContent} />);
    const textarea = container.querySelector('textarea');
    expect(textarea).toBeInTheDocument();
    if (textarea) {
      fireEvent.change(textarea, { target: { value: 'Esai saya...' } });
      expect((textarea as HTMLTextAreaElement).value).toBe('Esai saya...');
    }
  });

  it('9. enrichment export actual scene', () => {
    const project = build5SceneProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-scene-enrichment-challenge');
    expect(html).toContain('"sceneType":"enrichment-challenge"');
    expect(html).toContain('silse-enrichment-task');
    expect(html).toContain('silse-enrichment-rubric');
  });
});

// ---------------------------------------------------------------------------
// SCOPE D — Worksheet Activity
// ---------------------------------------------------------------------------

describe('PERFECT-MPI-RENDER-COMPLETE-01 — Scope D: Worksheet Activity', () => {
  const wsContent = {
    instruction: 'Lengkapi LKPD berikut',
    taskSteps: [
      { id: 'ws1', prompt: 'Tulis nama norma', responsePlaceholder: 'Nama...' },
      { id: 'ws2', prompt: 'Jelaskan sumbernya', responsePlaceholder: 'Sumber...' },
    ],
    inputFields: [{ id: 'if1', label: 'Nama Kelompok', placeholder: 'Kelompok...' }],
  };

  it('10. worksheet-activity React render', () => {
    const { container } = render(<WorksheetActivityComposer contract={contract} content={wsContent} />);
    expect(container.querySelector('.silse-scene-worksheet-activity')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="worksheet-step-ws1"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="worksheet-step-ws2"]')).toBeInTheDocument();
  });

  it('11. worksheet input/checklist behavior', () => {
    const { container } = render(<WorksheetActivityComposer contract={contract} content={wsContent} />);
    // Initially 0/2
    expect(container.querySelector('[data-testid="worksheet-checklist"]')?.textContent).toContain('0 / 2');
    // Click check on ws1
    fireEvent.click(container.querySelector('[data-testid="worksheet-check-ws1"]')!);
    // Should now be 1/2
    expect(container.querySelector('[data-testid="worksheet-checklist"]')?.textContent).toContain('1 / 2');
    // Response textarea accepts text
    const textarea = container.querySelector('[data-testid="worksheet-response-ws1"]') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Norma agama' } });
    expect(textarea.value).toBe('Norma agama');
  });

  it('12. worksheet export actual scene', () => {
    const project = build5SceneProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-scene-worksheet-activity');
    expect(html).toContain('"sceneType":"worksheet-activity"');
    expect(html).toContain('silse-worksheet-question');
    expect(html).toContain('silse-worksheet-checklist');
  });
});

// ---------------------------------------------------------------------------
// SCOPE E — Rubric Panel
// ---------------------------------------------------------------------------

describe('PERFECT-MPI-RENDER-COMPLETE-01 — Scope E: Rubric Panel', () => {
  const rubContent = {
    criteria: [
      { id: 'cr1', name: 'Kelengkapan', description: 'Semua komponen terisi' },
      { id: 'cr2', name: 'Kedalaman', description: 'Analisis mendalam' },
    ],
    levels: [
      { id: 'lv1', name: 'Baik', score: 4, descriptor: 'Sangat baik' },
      { id: 'lv2', name: 'Cukup', score: 3, descriptor: 'Cukup baik' },
    ],
    scoreGuide: 'Total skor maksimal 8',
  };

  it('13. rubric-panel React render', () => {
    const { container } = render(<RubricPanelComposer contract={contract} content={rubContent} />);
    expect(container.querySelector('.silse-scene-rubric-panel')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="rubric-criterion-cr1"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="rubric-level-lv1"]')).toBeInTheDocument();
  });

  it('14. rubric criteria render', () => {
    const { container } = render(<RubricPanelComposer contract={contract} content={rubContent} />);
    expect(container.textContent).toContain('Kelengkapan');
    expect(container.textContent).toContain('Kedalaman');
    expect(container.textContent).toContain('Baik');
    expect(container.textContent).toContain('Cukup');
  });

  it('15. rubric export actual scene', () => {
    const project = build5SceneProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-scene-rubric-panel');
    expect(html).toContain('"sceneType":"rubric-panel"');
    expect(html).toContain('silse-rubric-criterion');
    expect(html).toContain('silse-rubric-level');
  });
});

// ---------------------------------------------------------------------------
// SCOPE F — SceneContent Inspector
// ---------------------------------------------------------------------------

describe('PERFECT-MPI-RENDER-COMPLETE-01 — Scope F: SceneContent Inspector', () => {
  it('16. SceneContentEditor supports all 5 new scene types', () => {
    const sceneTypes = ['diagnostic-check', 'remedial-practice', 'enrichment-challenge', 'worksheet-activity', 'rubric-panel'];
    sceneTypes.forEach((st) => {
      const page = {
        id: 'p1', title: 'Test', role: 'material', layoutId: 'blank',
        background: { type: 'color' as const, color: '#fff' }, components: [],
        sceneType: st, sceneContent: { kind: st, instruction: 'Test' },
      };
      const { container } = render(<SceneContentEditor page={page as any} />);
      expect(container.querySelector('[data-testid="scene-content-editor"]'), `sceneType ${st} should show editor`).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// SCOPE G — Regression
// ---------------------------------------------------------------------------

describe('PERFECT-MPI-RENDER-COMPLETE-01 — Scope G: Regression', () => {
  it('17. legacy project safe', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('"scenePlan":null');
    expect(() => exportProjectToHtml(project)).not.toThrow();
  });

  it('18. 12 golden-reference scenes still pass', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = aiJsonToMpiContainer(bp);
    expect(container.scenes).toHaveLength(12);
    container.scenes.forEach((scene) => {
      const plan = renderScenePlan(scene, contract);
      expect(plan.sceneClass).toContain('silse-scene');
    });
  });
});
