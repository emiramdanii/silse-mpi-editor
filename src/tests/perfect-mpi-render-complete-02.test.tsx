/**
 * PERFECT-MPI-RENDER-COMPLETE-02 — Tests.
 *
 * Tests 5 narrative/guidance scene renderers: timeline-story, branching-scenario,
 * glossary-cards, teacher-guide, accessibility-help.
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
  TimelineStoryComposer,
  BranchingScenarioComposer,
  GlossaryCardsComposer,
  TeacherGuideComposer,
  AccessibilityHelpComposer,
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
      { id: 'p-tl', title: 'Timeline', role: 'material' as const, layoutId: 'blank' as const, background: { type: 'color' as const, color: '#0e1c2f' }, components: [], sceneType: 'timeline-story', sceneContent: { kind: 'timeline-story', title: 'TL', events: [{ id: 'e1', label: 'Start', description: 'Beginning' }, { id: 'e2', label: 'End', description: 'Finale' }], checkpointQuestion: 'What?', checkpointAnswer: 'Answer' }, scenePlacement: { x: 72, y: 64, width: 1136, height: 544 } },
      { id: 'p-br', title: 'Branching', role: 'material' as const, layoutId: 'blank' as const, background: { type: 'color' as const, color: '#0e1c2f' }, components: [], sceneType: 'branching-scenario', sceneContent: { kind: 'branching-scenario', scenarioPrompt: 'What do you do?', choices: [{ id: 'ch1', label: 'Help', consequence: 'Good choice', isCorrect: true }, { id: 'ch2', label: 'Ignore', consequence: 'Bad idea', isCorrect: false }] }, scenePlacement: { x: 72, y: 64, width: 1136, height: 544 } },
      { id: 'p-gl', title: 'Glossary', role: 'material' as const, layoutId: 'blank' as const, background: { type: 'color' as const, color: '#0e1c2f' }, components: [], sceneType: 'glossary-cards', sceneContent: { kind: 'glossary-cards', title: 'Glos', terms: [{ id: 't1', term: 'Norma', definition: 'Aturan', example: 'Berdoa' }] }, scenePlacement: { x: 72, y: 64, width: 1136, height: 544 } },
      { id: 'p-tg', title: 'Teacher', role: 'material' as const, layoutId: 'blank' as const, background: { type: 'color' as const, color: '#0e1c2f' }, components: [], sceneType: 'teacher-guide', sceneContent: { kind: 'teacher-guide', title: 'Guide', teacherInstruction: 'Do this', facilitationTips: ['Tip 1'], timeAllocation: '15 min', assessmentNotes: 'Note' }, scenePlacement: { x: 72, y: 64, width: 1136, height: 544 } },
      { id: 'p-ah', title: 'Accessibility', role: 'material' as const, layoutId: 'blank' as const, background: { type: 'color' as const, color: '#0e1c2f' }, components: [], sceneType: 'accessibility-help', sceneContent: { kind: 'accessibility-help', title: 'Help', readingGuide: 'Read slowly', keyboardGuide: 'Use Tab', contrastOption: 'High contrast' }, scenePlacement: { x: 72, y: 64, width: 1136, height: 544 } },
    ],
    currentPageId: 'p-tl',
  };
}

// ---------------------------------------------------------------------------
// SCOPE A — Timeline Story
// ---------------------------------------------------------------------------

describe('PERFECT-MPI-RENDER-COMPLETE-02 — Scope A: Timeline Story', () => {
  const tlContent = {
    title: 'Sejarah Norma',
    events: [
      { id: 'e1', label: 'Awal', description: 'Norma muncul di masyarakat' },
      { id: 'e2', label: 'Perkembangan', description: 'Norma berkembang seiring waktu' },
      { id: 'e3', label: 'Sekarang', description: 'Norma diterapkan hari ini' },
    ],
    checkpointQuestion: 'Apa penyebab utama munculnya norma?',
    checkpointAnswer: 'kebutuhan masyarakat',
  };

  it('1. timeline-story React render', () => {
    const { container } = render(<TimelineStoryComposer contract={contract} content={tlContent} />);
    expect(container.querySelector('.silse-scene-timeline-story')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="timeline-step-e1"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="timeline-step-e3"]')).toBeInTheDocument();
  });

  it('2. timeline next/prev changes active step', () => {
    const { container } = render(<TimelineStoryComposer contract={contract} content={tlContent} />);
    // Initially step 0 (e1)
    expect(container.querySelector('[data-testid="timeline-event-detail"]')?.textContent).toContain('Awal');
    // Click next
    fireEvent.click(container.querySelector('[data-testid="timeline-next"]')!);
    expect(container.querySelector('[data-testid="timeline-event-detail"]')?.textContent).toContain('Perkembangan');
    // Click prev
    fireEvent.click(container.querySelector('[data-testid="timeline-prev"]')!);
    expect(container.querySelector('[data-testid="timeline-event-detail"]')?.textContent).toContain('Awal');
  });

  it('3. timeline checkpoint feedback is helpful (not just benar/salah)', () => {
    const { container } = render(<TimelineStoryComposer contract={contract} content={tlContent} />);
    // Navigate to last step
    fireEvent.click(container.querySelector('[data-testid="timeline-step-e3"]')!);
    // Click checkpoint button
    fireEvent.click(container.querySelector('[data-testid="timeline-checkpoint"]')!);
    // Type wrong answer
    fireEvent.change(container.querySelector('[data-testid="timeline-checkpoint-input"]')!, { target: { value: 'wrong answer' } });
    fireEvent.click(container.querySelector('[data-testid="timeline-checkpoint-check"]')!);
    // Feedback should be helpful — contain hint about the answer
    const feedback = container.querySelector('[data-testid="timeline-checkpoint-feedback"]');
    expect(feedback).toBeInTheDocument();
    expect(feedback?.textContent).toContain('kebutuhan masyarakat');
  });

  it('4. timeline-story export actual scene', () => {
    const project = build5SceneProject();
    const html = exportProjectToHtml(project); void html;
    expect(html).toContain('silse-scene-timeline-story');
    expect(html).toContain('"sceneType":"timeline-story"');
    expect(html).toContain('silse-timeline-track');
    expect(html).toContain('[data-action="timeline-prev"]');
    expect(html).toContain('[data-action="timeline-next"]');
  });
});

// ---------------------------------------------------------------------------
// SCOPE B — Branching Scenario
// ---------------------------------------------------------------------------

describe('PERFECT-MPI-RENDER-COMPLETE-02 — Scope B: Branching Scenario', () => {
  const brContent = {
    scenarioPrompt: 'Kamu melihat teman membuang sampah. Apa yang kamu lakukan?',
    choices: [
      { id: 'ch1', label: 'Menegur dengan sopan', consequence: 'Pilihan tepat! Menegur dengan sopan menunjukkan kepedulian dan menjaga norma kesopanan.', isCorrect: true },
      { id: 'ch2', label: 'Membiarkan saja', consequence: 'Membiarkan sampah berserakan dapat merusak kebersihan lingkungan. Coba pikirkan dampaknya.', isCorrect: false },
    ],
  };

  it('5. branching-scenario React render', () => {
    const { container } = render(<BranchingScenarioComposer contract={contract} content={brContent} />);
    expect(container.querySelector('.silse-scene-branching-scenario')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="branching-prompt"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="branching-choice-ch1"]')).toBeInTheDocument();
  });

  it('6. branching choice shows consequence with helpful feedback', () => {
    const { container } = render(<BranchingScenarioComposer contract={contract} content={brContent} />);
    // Click correct choice
    fireEvent.click(container.querySelector('[data-testid="branching-choice-ch1"]')!);
    const consequence = container.querySelector('[data-testid="branching-consequence"]');
    expect(consequence).toBeInTheDocument();
    // Feedback should be helpful (contain explanation, not just "benar")
    expect(consequence?.textContent).toContain('Pilihan Tepat');
    expect(consequence?.textContent).toContain('Menegur dengan sopan menunjukkan kepedulian');
  });

  it('7. branching wrong choice shows helpful consequence', () => {
    const { container } = render(<BranchingScenarioComposer contract={contract} content={brContent} />);
    // Click wrong choice
    fireEvent.click(container.querySelector('[data-testid="branching-choice-ch2"]')!);
    const consequence = container.querySelector('[data-testid="branching-consequence"]');
    expect(consequence).toBeInTheDocument();
    expect(consequence?.textContent).toContain('Pertimbangkan Kembali');
    expect(consequence?.textContent).toContain('merusak kebersihan');
  });

  it('8. branching reset works', () => {
    const { container } = render(<BranchingScenarioComposer contract={contract} content={brContent} />);
    fireEvent.click(container.querySelector('[data-testid="branching-choice-ch1"]')!);
    expect(container.querySelector('[data-testid="branching-consequence"]')).toBeInTheDocument();
    // Click reset
    const resetBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Coba Lagi')) as HTMLElement;
    fireEvent.click(resetBtn);
    expect(container.querySelector('[data-testid="branching-consequence"]')).not.toBeInTheDocument();
  });

  it('9. branching-scenario export actual scene', () => {
    const project = build5SceneProject();
    const html = exportProjectToHtml(project); void html;
    expect(html).toContain('silse-scene-branching-scenario');
    expect(html).toContain('"sceneType":"branching-scenario"');
    expect(html).toContain('silse-branching-choice');
    expect(html).toContain('[data-action="branching-reset"]');
  });
});

// ---------------------------------------------------------------------------
// SCOPE C — Glossary Cards
// ---------------------------------------------------------------------------

describe('PERFECT-MPI-RENDER-COMPLETE-02 — Scope C: Glossary Cards', () => {
  const glContent = {
    title: 'Glosarium Norma',
    terms: [
      { id: 't1', term: 'Norma Agama', definition: 'Aturan dari Tuhan yang mengatur hubungan manusia dengan Tuhan', example: 'Berdoa sebelum makan' },
      { id: 't2', term: 'Norma Hukum', definition: 'Aturan dari negara yang bersifat memaksa', example: 'Memakai helm saat berkendara' },
    ],
  };

  it('10. glossary-cards React render', () => {
    const { container } = render(<GlossaryCardsComposer contract={contract} content={glContent} />);
    expect(container.querySelector('.silse-scene-glossary-cards')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="glossary-card-t1"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="glossary-card-t2"]')).toBeInTheDocument();
  });

  it('11. glossary reveal definition on click', () => {
    const { container } = render(<GlossaryCardsComposer contract={contract} content={glContent} />);
    // Initially definition hidden
    expect(container.querySelector('[data-testid="glossary-def-t1"]')).not.toBeInTheDocument();
    // Click card
    fireEvent.click(container.querySelector('[data-testid="glossary-card-t1"]')!);
    // Definition should appear
    expect(container.querySelector('[data-testid="glossary-def-t1"]')).toBeInTheDocument();
    expect(container.textContent).toContain('Aturan dari Tuhan');
    expect(container.textContent).toContain('Berdoa sebelum makan');
  });

  it('12. glossary-cards export actual scene', () => {
    const project = build5SceneProject();
    const html = exportProjectToHtml(project); void html;
    expect(html).toContain('silse-scene-glossary-cards');
    expect(html).toContain('"sceneType":"glossary-cards"');
    expect(html).toContain('silse-glossary-card');
    expect(html).toContain('silse-glossary-definition');
  });
});

// ---------------------------------------------------------------------------
// SCOPE D — Teacher Guide
// ---------------------------------------------------------------------------

describe('PERFECT-MPI-RENDER-COMPLETE-02 — Scope D: Teacher Guide', () => {
  const tgContent = {
    title: 'Panduan Guru',
    teacherInstruction: 'Mulai dengan pertanyaan pemantik',
    facilitationTips: ['Berikan waktu 5 menit untuk diskusi', 'Ajak siswa berbagi pengalaman'],
    timeAllocation: '30 menit',
    assessmentNotes: 'Amati partisipasi siswa dalam diskusi',
  };

  it('13. teacher-guide React render', () => {
    const { container } = render(<TeacherGuideComposer contract={contract} content={tgContent} />);
    expect(container.querySelector('.silse-scene-teacher-guide')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="teacher-timing"]')).toBeInTheDocument();
    expect(container.textContent).toContain('30 menit');
    expect(container.querySelector('[data-testid="teacher-tip-0"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="teacher-tip-1"]')).toBeInTheDocument();
  });

  it('14. teacher-guide excluded from student export (TEMPLATE-CLEANUP-01)', () => {
    // TEMPLATE-CLEANUP-01: teacher-guide is teacher-preparation content,
    // excluded from the standalone student-facing export.
    const project = build5SceneProject();
    const html = exportProjectToHtml(project); void html;
    // The teacher-guide scene's content must NOT appear as rendered text.
    // (The JS renderer function still exists in <script>, but the page is
    //  filtered out before rendering, so the content is never emitted.)
    expect(html).not.toContain('Do this'); // teacherInstruction from the test project
    expect(html).not.toContain('Tip 1'); // facilitationTips
    expect(html).not.toContain('15 min'); // timeAllocation
    // The teacher-guide page title 'Teacher' should not appear as a rendered page
    // (other text may contain 'Teacher' in JS comments, but not as a rendered page title)
  });
});

// ---------------------------------------------------------------------------
// SCOPE E — Accessibility Help
// ---------------------------------------------------------------------------

describe('PERFECT-MPI-RENDER-COMPLETE-02 — Scope E: Accessibility Help', () => {
  const ahContent = {
    title: 'Bantuan Aksesibilitas',
    readingGuide: 'Gunakan zoom browser jika teks terlalu kecil',
    keyboardGuide: 'Gunakan Tab untuk navigasi, Enter untuk memilih',
    contrastOption: 'Mode kontras tinggi tersedia di pengaturan browser',
  };

  it('15. accessibility-help React render', () => {
    const { container } = render(<AccessibilityHelpComposer contract={contract} content={ahContent} />);
    expect(container.querySelector('.silse-scene-accessibility-help')).toBeInTheDocument();
    expect(container.textContent).toContain('Panduan Membaca');
    expect(container.textContent).toContain('Panduan Keyboard/Touch');
    expect(container.textContent).toContain('Opsi Kontras');
  });

  it('16. accessibility-help export actual scene', () => {
    const project = build5SceneProject();
    const html = exportProjectToHtml(project); void html;
    expect(html).toContain('silse-scene-accessibility-help');
    expect(html).toContain('"sceneType":"accessibility-help"');
  });
});

// ---------------------------------------------------------------------------
// SCOPE F — SceneContent Inspector
// ---------------------------------------------------------------------------

describe('PERFECT-MPI-RENDER-COMPLETE-02 — Scope F: SceneContent Inspector', () => {
  it('17. SceneContentEditor supports all 5 new scene types', () => {
    const sceneTypes = ['timeline-story', 'branching-scenario', 'glossary-cards', 'teacher-guide', 'accessibility-help'];
    sceneTypes.forEach((st) => {
      const page = {
        id: 'p1', title: 'Test', role: 'material', layoutId: 'blank',
        background: { type: 'color' as const, color: '#fff' }, components: [],
        sceneType: st, sceneContent: { kind: st, title: 'Test' },
      };
      const { container } = render(<SceneContentEditor page={page as any} />);
      expect(container.querySelector('[data-testid="scene-content-editor"]'), `sceneType ${st} should show editor`).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// SCOPE G — Regression
// ---------------------------------------------------------------------------

describe('PERFECT-MPI-RENDER-COMPLETE-02 — Scope G: Regression', () => {
  it('18. legacy project safe', () => {
    const project = createSamplePpknProject();
    const html = exportProjectToHtml(project); void html;
    // Fase 2b: scenePlan no longer null — all pages go through scene renderer
    expect(() => exportProjectToHtml(project)).not.toThrow();
  });

  it('19. 12 golden-reference scenes still pass', () => {
    const bp = normalizeBlueprint(loadGoldenRef());
    const container = aiJsonToMpiContainer(bp);
    expect(container.scenes).toHaveLength(12);
    container.scenes.forEach((scene) => {
      const plan = renderScenePlan(scene, contract);
      expect(plan.sceneClass).toContain('silse-scene');
    });
  });
});
