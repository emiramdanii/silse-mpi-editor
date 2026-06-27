/**
 * Tests for M10 Patch — Question export runtime fix.
 */

import { describe, expect, it } from 'vitest';
import { createProject } from '../core/project-factory';
import { createQuestionComponent } from '../core/component-factory';
import { exportProjectToHtml, buildExportRenderModel } from '../export/export-html';
import type { SimpleProject } from '../core/types';

function makeProjectWithQuestion(): SimpleProject {
  const project = createProject('Test Question Export');
  // Add a quiz page with a question
  const quizPage = {
    ...project.pages[0],
    id: 'quiz-page-1',
    role: 'quiz' as const,
    layoutId: 'blank' as const,
    title: 'Kuis',
    components: [
      createQuestionComponent({
        title: 'Pertanyaan 1',
        prompt: 'Apa ibu kota Indonesia?',
        choices: [
          { id: 'c1', text: 'Jakarta' },
          { id: 'c2', text: 'Bandung' },
          { id: 'c3', text: 'Surabaya' },
        ],
        correctChoiceIndex: 0,
        feedbackCorrect: 'Benar! Jakarta adalah ibu kota Indonesia.',
        feedbackWrong: 'Belum tepat. Coba lagi.',
        points: 10,
        scoringStyle: 'points',
      }),
    ],
  };
  return { ...project, pages: [project.pages[0], quizPage], currentPageId: quizPage.id };
}

// =========================================================================
// Export render model
// =========================================================================

describe('M10 PATCH — export render model includes question fields', () => {
  it('buildExportRenderModel includes question fields', () => {
    const project = makeProjectWithQuestion();
    const model = buildExportRenderModel(project);
    const quizPage = model.pages.find((p) => p.title === 'Kuis')!;
    const qComp = quizPage.components[0];

    expect(qComp.type).toBe('question');
    expect(qComp.questionTitle).toBe('Pertanyaan 1');
    expect(qComp.prompt).toBe('Apa ibu kota Indonesia?');
    expect(qComp.choices).toBeDefined();
    expect(qComp.choices!.length).toBe(3);
    expect(qComp.correctChoiceIndex).toBe(0);
    expect(qComp.feedbackCorrect).toBe('Benar! Jakarta adalah ibu kota Indonesia.');
    expect(qComp.feedbackWrong).toBe('Belum tepat. Coba lagi.');
    expect(qComp.points).toBe(10);
    expect(qComp.scoringStyle).toBe('points');
  });
});

// =========================================================================
// Export HTML includes question runtime
// =========================================================================

describe('M10 PATCH — export HTML includes question runtime', () => {
  const project = makeProjectWithQuestion();
  const html = exportProjectToHtml(project);

  it('export HTML contains question prompt', () => {
    expect(html).toContain('Apa ibu kota Indonesia?');
  });

  it('export HTML contains choices text', () => {
    expect(html).toContain('Jakarta');
    expect(html).toContain('Bandung');
    expect(html).toContain('Surabaya');
  });

  it('export HTML contains question answer click handler', () => {
    expect(html).toContain('addEventListener');
    expect(html).toMatch(/questionAnswers|answerQuestion|compId/i);
  });

  it('export HTML contains score state / score display', () => {
    expect(html).toContain('totalScore');
    expect(html).toContain('silse-score');
    expect(html).toContain('Skor: 0');
  });

  it('export HTML contains question CSS class', () => {
    expect(html).toContain('silse-question-choice');
    expect(html).toContain('silse-question-feedback');
  });
});

// =========================================================================
// Export answer option CSS no clipping
// =========================================================================

describe('M10 PATCH — export answer option CSS no clipping', () => {
  const project = makeProjectWithQuestion();
  const html = exportProjectToHtml(project);

  it('export CSS has white-space: normal for question choice', () => {
    expect(html).toMatch(/white-space:\s*normal/);
  });

  it('export CSS has overflow-wrap: anywhere for question choice', () => {
    expect(html).toMatch(/overflow-wrap:\s*anywhere/);
  });

  it('export CSS has min-height for question choice', () => {
    expect(html).toMatch(/min-height:\s*44px/);
  });

  it('export CSS does NOT contain text-overflow: ellipsis', () => {
    expect(html).not.toMatch(/text-overflow:\s*ellipsis/);
  });

  it('export CSS does NOT contain white-space: nowrap for question', () => {
    // Check question-specific CSS — nowrap should not appear in question context
    const questionCSS = html.substring(html.indexOf('silse-question-choice'), html.indexOf('silse-question-feedback'));
    expect(questionCSS).not.toMatch(/nowrap/);
  });
});

// =========================================================================
// Export does NOT omit QuestionComponent
// =========================================================================

describe('M10 PATCH — export does not omit QuestionComponent', () => {
  it('export HTML includes question type rendering in JS', () => {
    const project = makeProjectWithQuestion();
    const html = exportProjectToHtml(project);
    expect(html).toMatch(/comp\.type === 'question'/);
  });

  it('export HTML includes feedback rendering', () => {
    const project = makeProjectWithQuestion();
    const html = exportProjectToHtml(project);
    expect(html).toContain('feedbackCorrect');
    expect(html).toContain('feedbackWrong');
  });
});
