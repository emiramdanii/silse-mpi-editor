/**
 * V2-PILAR-2.5 Commit 1: Tests for Centralized Quiz Sheet.
 *
 * Coverage:
 *   1. collectScoringComponents — pure function, collects from project.pages
 *   2. sanitizePointsInput — 3-layer defense (regex, clamp, fallback)
 *   3. bulkUpdateScoringComponents — store method, updates across pages
 *   4. QuizSheetDialog rendering (empty + populated + row click navigation)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import {
  collectScoringComponents,
  sanitizePointsInput,
  createProject,
} from '../core/project-factory';
import { useEditorStore } from '../store/editor-store';
import {
  createQuestionComponent,
  createGameComponent,
  createInputFieldComponent,
} from '../core/component-factory';
import { QuizSheetDialog } from '../editor/QuizSheetDialog';
import type { SimpleProject, QuestionComponent, InputFieldComponent } from '../core/types';

// Helper: buat project dengan berbagai scoring components
function makeProjectWithScoringComponents(): SimpleProject {
  const project = createProject();

  // Page 1 (cover) — no scoring
  // Page 2 — question
  const page2 = project.pages[0]; // re-purpose cover as slide 1
  page2.components.push({
    ...createQuestionComponent({
      title: 'Q1',
      prompt: 'Berapa 2+2?',
      choices: [
        { id: 'a', text: '3' },
        { id: 'b', text: '4' },
      ],
      correctChoiceIndex: 1,
      points: 10,
    }),
  });

  // Add page 2 with game
  useEditorStore.getState().setProject(project);
  useEditorStore.getState().addPage({ role: 'free', title: 'Slide Game' });
  const gamePage = useEditorStore.getState().project.pages[1];
  const gameComp = createGameComponent({
    title: 'Game Petualangan',
    instruction: 'Jawab misi!',
    missions: [
      {
        id: 'm1',
        title: 'Misi 1',
        prompt: 'Ibu kota Indonesia?',
        choices: [
          { id: 'ga', text: 'Bandung' },
          { id: 'gb', text: 'Jakarta' },
        ],
        correctChoiceIndex: 1,
        feedbackCorrect: 'Benar!',
        feedbackWrong: 'Salah.',
        points: 15,
      },
    ],
  });
  useEditorStore.getState().addComponentsToPage(gamePage.id, [gameComp as never]);

  // Add page 3 with input-field (with correctAnswer)
  useEditorStore.getState().addPage({ role: 'free', title: 'Slide Input' });
  const inputPage = useEditorStore.getState().project.pages[2];
  const inputComp = createInputFieldComponent({
    label: 'Sebutkan planet terdekat matahari',
    placeholder: 'Ketik...',
    correctAnswer: 'Merkurius',
    points: 5,
  });
  useEditorStore.getState().addComponentsToPage(inputPage.id, [inputComp as never]);

  // Add page 4 with input-field (WITHOUT correctAnswer — should NOT appear)
  useEditorStore.getState().addPage({ role: 'free', title: 'Slide Free Input' });
  const freeInputPage = useEditorStore.getState().project.pages[3];
  const freeInputComp = createInputFieldComponent({
    label: 'Tulis refleksi',
    placeholder: 'Bebas...',
  });
  useEditorStore.getState().addComponentsToPage(freeInputPage.id, [freeInputComp as never]);

  return useEditorStore.getState().project;
}

// ---------------------------------------------------------------------------
// 1. collectScoringComponents
// ---------------------------------------------------------------------------

describe('V2-PILAR-2.5 — collectScoringComponents', () => {
  it('1. returns empty array for default project (no scoring components)', () => {
    const project = createProject();
    const entries = collectScoringComponents(project);
    expect(entries).toHaveLength(0);
  });

  it('2. collects QuestionComponent', () => {
    const project = makeProjectWithScoringComponents();
    const entries = collectScoringComponents(project);
    const questions = entries.filter((e) => e.componentType === 'question');
    expect(questions).toHaveLength(1);
    expect(questions[0].prompt).toBe('Berapa 2+2?');
    expect(questions[0].correctAnswer).toBe('4');
    expect(questions[0].points).toBe(10);
  });

  it('3. collects GameComponent', () => {
    const project = makeProjectWithScoringComponents();
    const entries = collectScoringComponents(project);
    const games = entries.filter((e) => e.componentType === 'game');
    expect(games).toHaveLength(1);
    expect(games[0].prompt).toContain('Game Petualangan');
    expect(games[0].correctAnswer).toBe('Jakarta');
    expect(games[0].points).toBe(15);
  });

  it('4. collects InputFieldComponent with correctAnswer', () => {
    const project = makeProjectWithScoringComponents();
    const entries = collectScoringComponents(project);
    const inputs = entries.filter((e) => e.componentType === 'input-field');
    expect(inputs).toHaveLength(1);
    expect(inputs[0].prompt).toBe('Sebutkan planet terdekat matahari');
    expect(inputs[0].correctAnswer).toBe('Merkurius');
    expect(inputs[0].points).toBe(5);
  });

  it('5. does NOT collect InputFieldComponent without correctAnswer', () => {
    const project = makeProjectWithScoringComponents();
    const entries = collectScoringComponents(project);
    // Should be 3 total (1 question + 1 game + 1 input with correctAnswer)
    // NOT 4 (the free input without correctAnswer should be excluded)
    expect(entries).toHaveLength(3);
  });

  it('6. entries are ordered by page order then component order', () => {
    const project = makeProjectWithScoringComponents();
    const entries = collectScoringComponents(project);
    expect(entries[0].componentType).toBe('question'); // page 0
    expect(entries[1].componentType).toBe('game');     // page 1
    expect(entries[2].componentType).toBe('input-field'); // page 2
  });

  it('7. entry includes pageId and pageTitle', () => {
    const project = makeProjectWithScoringComponents();
    const entries = collectScoringComponents(project);
    expect(entries[0].pageId).toBeTruthy();
    expect(entries[0].pageTitle).toBeTruthy();
  });

  it('8. entry includes componentId', () => {
    const project = makeProjectWithScoringComponents();
    const entries = collectScoringComponents(project);
    expect(entries[0].componentId).toBeTruthy();
    expect(typeof entries[0].componentId).toBe('string');
  });

  it('9. does not mutate project', () => {
    const project = makeProjectWithScoringComponents();
    const projectCopy = JSON.parse(JSON.stringify(project));
    collectScoringComponents(project);
    expect(project).toEqual(projectCopy);
  });
});

// ---------------------------------------------------------------------------
// 2. sanitizePointsInput
// ---------------------------------------------------------------------------

describe('V2-PILAR-2.5 — sanitizePointsInput (3-layer defense)', () => {
  it('10. valid number 1-100 returns as-is', () => {
    expect(sanitizePointsInput('10')).toBe(10);
    expect(sanitizePointsInput('50')).toBe(50);
    expect(sanitizePointsInput('100')).toBe(100);
  });

  it('11. filters non-digit characters (Lapis 1)', () => {
    expect(sanitizePointsInput('1a0b')).toBe(10);
    expect(sanitizePointsInput('5!0@')).toBe(50);
    expect(sanitizePointsInput('abc25def')).toBe(25);
  });

  it('12. clamps to minimum 1 (Lapis 2)', () => {
    expect(sanitizePointsInput('0')).toBe(1);
    // '-5' → regex filter removes '-' → '5' → 5 (not 1, because 5 is valid 1-100)
    expect(sanitizePointsInput('-5')).toBe(5);
  });

  it('13. clamps to maximum 100 (Lapis 2)', () => {
    expect(sanitizePointsInput('101')).toBe(100);
    expect(sanitizePointsInput('999')).toBe(100);
  });

  it('14. empty string returns 1 (fallback)', () => {
    expect(sanitizePointsInput('')).toBe(1);
  });

  it('15. non-digit only string returns 1', () => {
    expect(sanitizePointsInput('abc')).toBe(1);
    expect(sanitizePointsInput('!@#')).toBe(1);
  });

  it('16. decimal input filters to integer', () => {
    // '10.5' → regex removes '.' → '105' → clamp to 100
    expect(sanitizePointsInput('10.5')).toBe(100);
    // '5.0' → regex removes '.' → '50' → 50
    expect(sanitizePointsInput('5.0')).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// 3. bulkUpdateScoringComponents (store method)
// ---------------------------------------------------------------------------

describe('V2-PILAR-2.5 — bulkUpdateScoringComponents', () => {
  beforeEach(() => {
    useEditorStore.getState().resetProject();
  });

  it('17. store exposes bulkUpdateScoringComponents as a function', () => {
    expect(typeof useEditorStore.getState().bulkUpdateScoringComponents).toBe('function');
  });

  it('18. updates points for QuestionComponent', () => {
    const store = useEditorStore.getState();
    store.addPage({ role: 'free', title: 'Test' });
    const id = store.addQuestionComponent({
      prompt: 'Q?', points: 10,
      choices: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }],
      correctChoiceIndex: 0,
    });
    store.bulkUpdateScoringComponents([{
      componentId: id!,
      componentType: 'question',
      points: 25,
    }]);
    const after = useEditorStore.getState().project;
    const comp = after.pages.find((p) => p.id === after.currentPageId)!.components.find((c) => c.id === id) as QuestionComponent;
    expect(comp.points).toBe(25);
  });

  it('19. updates correctAnswer for QuestionComponent (match by text)', () => {
    const store = useEditorStore.getState();
    store.addPage({ role: 'free', title: 'Test' });
    const id = store.addQuestionComponent({
      prompt: 'Q?', points: 10,
      choices: [{ id: 'a', text: 'Jakarta' }, { id: 'b', text: 'Bandung' }],
      correctChoiceIndex: 0, // initially Jakarta
    });
    // Change correctAnswer to Bandung
    store.bulkUpdateScoringComponents([{
      componentId: id!,
      componentType: 'question',
      correctAnswer: 'Bandung',
    }]);
    const after = useEditorStore.getState().project;
    const comp = after.pages.find((p) => p.id === after.currentPageId)!.components.find((c) => c.id === id) as QuestionComponent;
    expect(comp.correctChoiceIndex).toBe(1); // now Bandung
  });

  it('20. updates points for InputFieldComponent', () => {
    const store = useEditorStore.getState();
    store.addPage({ role: 'free', title: 'Test' });
    const id = store.addInputFieldComponent({
      label: 'L', placeholder: 'P', correctAnswer: 'Ans', points: 5,
    });
    store.bulkUpdateScoringComponents([{
      componentId: id!,
      componentType: 'input-field',
      points: 20,
    }]);
    const after = useEditorStore.getState().project;
    const comp = after.pages.find((p) => p.id === after.currentPageId)!.components.find((c) => c.id === id) as InputFieldComponent;
    expect(comp.points).toBe(20);
  });

  it('21. updates correctAnswer for InputFieldComponent', () => {
    const store = useEditorStore.getState();
    store.addPage({ role: 'free', title: 'Test' });
    const id = store.addInputFieldComponent({
      label: 'L', placeholder: 'P', correctAnswer: 'Old', points: 5,
    });
    store.bulkUpdateScoringComponents([{
      componentId: id!,
      componentType: 'input-field',
      correctAnswer: 'New Answer',
    }]);
    const after = useEditorStore.getState().project;
    const comp = after.pages.find((p) => p.id === after.currentPageId)!.components.find((c) => c.id === id) as InputFieldComponent;
    expect(comp.correctAnswer).toBe('New Answer');
  });

  it('22. updates multiple components in one call', () => {
    const store = useEditorStore.getState();
    store.addPage({ role: 'free', title: 'Test' });
    const id1 = store.addQuestionComponent({
      prompt: 'Q1', points: 10,
      choices: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }],
      correctChoiceIndex: 0,
    });
    const id2 = store.addInputFieldComponent({
      label: 'L', placeholder: 'P', correctAnswer: 'Ans', points: 5,
    });
    store.bulkUpdateScoringComponents([
      { componentId: id1!, componentType: 'question', points: 15 },
      { componentId: id2!, componentType: 'input-field', points: 25 },
    ]);
    const after = useEditorStore.getState().project;
    const page = after.pages.find((p) => p.id === after.currentPageId)!;
    const q = page.components.find((c) => c.id === id1) as QuestionComponent;
    const i = page.components.find((c) => c.id === id2) as InputFieldComponent;
    expect(q.points).toBe(15);
    expect(i.points).toBe(25);
  });

  it('23. empty updates array is no-op', () => {
    const store = useEditorStore.getState();
    const before = store.project;
    store.bulkUpdateScoringComponents([]);
    expect(useEditorStore.getState().project).toBe(before);
  });

  it('24. update non-existent componentId is no-op (structure preserved)', () => {
    const store = useEditorStore.getState();
    const beforePages = store.project.pages.map((p) => ({
      id: p.id,
      componentCount: p.components.length,
      componentIds: p.components.map((c) => c.id),
    }));
    store.bulkUpdateScoringComponents([{
      componentId: 'non-existent',
      componentType: 'question',
      points: 50,
    }]);
    const afterPages = useEditorStore.getState().project.pages.map((p) => ({
      id: p.id,
      componentCount: p.components.length,
      componentIds: p.components.map((c) => c.id),
    }));
    // Structure should be identical (no components added/removed/changed)
    expect(afterPages).toEqual(beforePages);
  });
});

// ---------------------------------------------------------------------------
// 4. QuizSheetDialog rendering
// ---------------------------------------------------------------------------

describe('V2-PILAR-2.5 — QuizSheetDialog rendering', () => {
  beforeEach(() => {
    useEditorStore.getState().resetProject();
  });

  it('25. dialog renders with header', () => {
    const { container } = render(React.createElement(QuizSheetDialog, { onClose: () => {} }));
    expect(container.querySelector('[data-testid="quiz-sheet-dialog"]')).not.toBeNull();
    expect(container.textContent).toContain('Centralized Quiz Sheet');
  });

  it('26. dialog shows empty state when no scoring components', () => {
    const { container } = render(React.createElement(QuizSheetDialog, { onClose: () => {} }));
    expect(container.querySelector('[data-testid="quiz-sheet-empty"]')).not.toBeNull();
    expect(container.textContent).toContain('Belum ada komponen evaluasi');
  });

  it('27. dialog shows table when scoring components exist', () => {
    const project = makeProjectWithScoringComponents();
    useEditorStore.getState().setProject(project);
    const { container } = render(React.createElement(QuizSheetDialog, { onClose: () => {} }));
    expect(container.querySelector('[data-testid="quiz-sheet-table"]')).not.toBeNull();
  });

  it('28. table shows correct number of rows', () => {
    const project = makeProjectWithScoringComponents();
    useEditorStore.getState().setProject(project);
    const { container } = render(React.createElement(QuizSheetDialog, { onClose: () => {} }));
    const rows = container.querySelectorAll('[data-testid*="quiz-sheet-row-"]');
    expect(rows.length).toBe(3); // 1 question + 1 game + 1 input (not free input)
  });

  it('29. close button exists', () => {
    const { container } = render(React.createElement(QuizSheetDialog, { onClose: () => {} }));
    expect(container.querySelector('[data-testid="quiz-sheet-close"]')).not.toBeNull();
  });

  it('30. clicking close button calls onClose', () => {
    let closed = false;
    const { container } = render(React.createElement(QuizSheetDialog, { onClose: () => { closed = true; } }));
    const closeBtn = container.querySelector('[data-testid="quiz-sheet-close"]') as HTMLButtonElement;
    closeBtn.click();
    expect(closed).toBe(true);
  });

  it('31. points input is editable (text type, not number)', () => {
    const project = makeProjectWithScoringComponents();
    useEditorStore.getState().setProject(project);
    const { container } = render(React.createElement(QuizSheetDialog, { onClose: () => {} }));
    const pointsInput = container.querySelector('[data-testid="quiz-sheet-points-0"]') as HTMLInputElement;
    expect(pointsInput).not.toBeNull();
    expect(pointsInput.type).toBe('text');
  });

  it('32. answer input is editable', () => {
    const project = makeProjectWithScoringComponents();
    useEditorStore.getState().setProject(project);
    const { container } = render(React.createElement(QuizSheetDialog, { onClose: () => {} }));
    const answerInput = container.querySelector('[data-testid="quiz-sheet-answer-0"]') as HTMLInputElement;
    expect(answerInput).not.toBeNull();
    expect(answerInput.value).toBe('4'); // correctAnswer for question
  });

  it('33. prompt cell shows page title + prompt', () => {
    const project = makeProjectWithScoringComponents();
    useEditorStore.getState().setProject(project);
    const { container } = render(React.createElement(QuizSheetDialog, { onClose: () => {} }));
    const prompt = container.querySelector('[data-testid="quiz-sheet-prompt-0"]');
    expect(prompt?.textContent).toContain('Berapa 2+2?');
  });

  it('34. typing in points input filters non-digit', () => {
    const project = makeProjectWithScoringComponents();
    useEditorStore.getState().setProject(project);
    const { container } = render(React.createElement(QuizSheetDialog, { onClose: () => {} }));
    const pointsInput = container.querySelector('[data-testid="quiz-sheet-points-0"]') as HTMLInputElement;
    fireEvent.change(pointsInput, { target: { value: 'abc25xyz' } });
    // Should filter to '25'
    expect(pointsInput.value).toBe('25');
  });

  it('35. clicking prompt cell navigates to slide + selects component', () => {
    const project = makeProjectWithScoringComponents();
    useEditorStore.getState().setProject(project);
    let closed = false;
    const { container } = render(React.createElement(QuizSheetDialog, { onClose: () => { closed = true; } }));
    const prompt = container.querySelector('[data-testid="quiz-sheet-prompt-0"]') as HTMLElement;
    fireEvent.click(prompt);
    // Dialog should close
    expect(closed).toBe(true);
    // Store should have selected the component
    const state = useEditorStore.getState();
    expect(state.selectedComponentId).toBeTruthy();
  });
});
