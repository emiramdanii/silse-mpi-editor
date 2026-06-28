/**
 * GUIDED-MPI-FLOW-01 tests.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { Topbar } from '../editor/Topbar';
import { GuidedFlowDialog } from '../editor/GuidedFlowDialog';
import { useEditorStore } from '../store/editor-store';
import {
  MPI_TOPIC_CATALOG,
  getTopicById,
  getTopicsByMapel,
  getUniqueMapelList,
} from '../core/guided-flow/mpi-topic-catalog';
import { generateMpiFromTopic } from '../core/guided-flow/generate-mpi-from-topic';
import { validateLayoutQuality } from '../core/design/layout-quality';
import { isValidProject } from '../core/validation';
import { checkMpiStandard } from '../core/mpi-quality-check';

// =========================================================================
// Scope 1 — Topic Catalog
// =========================================================================

describe('GUIDED-MPI-FLOW-01 — Topic Catalog', () => {
  it('has at least 4 predefined topics', () => {
    expect(MPI_TOPIC_CATALOG.length).toBeGreaterThanOrEqual(4);
  });

  it('all topics have required fields', () => {
    for (const t of MPI_TOPIC_CATALOG) {
      expect(t.id.length).toBeGreaterThan(0);
      expect(t.mapel.length).toBeGreaterThan(0);
      expect(t.grade.length).toBeGreaterThan(0);
      expect(t.phase.length).toBeGreaterThan(0);
      expect(t.topic.length).toBeGreaterThan(0);
      expect(t.objectives.length).toBeGreaterThan(0);
      expect(t.materialSummary.length).toBeGreaterThan(0);
      expect(t.quizPrompt.length).toBeGreaterThan(0);
      expect(t.quizChoices.length).toBeGreaterThanOrEqual(2);
      expect(t.gameMissions.length).toBeGreaterThan(0);
      expect(t.starterPrompt.length).toBeGreaterThan(0);
      expect(t.reflectionPrompts.length).toBeGreaterThan(0);
    }
  });

  it('getTopicById returns topic or undefined', () => {
    expect(getTopicById('ppkn-7-norma')).toBeDefined();
    expect(getTopicById('non-existent')).toBeUndefined();
  });

  it('getUniqueMapelList returns unique mapel names', () => {
    const mapelList = getUniqueMapelList();
    expect(mapelList.length).toBeGreaterThan(0);
    expect(new Set(mapelList).size).toBe(mapelList.length);
  });

  it('getTopicsByMapel filters correctly', () => {
    const ppknTopics = getTopicsByMapel('PPKn');
    expect(ppknTopics.length).toBeGreaterThan(0);
    expect(ppknTopics.every((t) => t.mapel === 'PPKn')).toBe(true);
  });
});

// =========================================================================
// Scope 2 — Generator
// =========================================================================

describe('GUIDED-MPI-FLOW-01 — Generator', () => {
  it('generates valid project with 10 pages', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const result = generateMpiFromTopic(topic);
    expect(result.project.pages).toHaveLength(10);
    expect(isValidProject(result.project)).toBe(true);
  });

  it('project has correct page roles (cover→closing)', () => {
    const topic = getTopicById('ipa-7-zat')!;
    const result = generateMpiFromTopic(topic);
    const roles = result.project.pages.map((p) => p.role);
    expect(roles).toEqual([
      'cover', 'guide', 'learningObjectives', 'menu', 'starter',
      'material', 'quiz', 'activity', 'reflection', 'closing',
    ]);
  });

  it('project has curriculum from topic', () => {
    const topic = getTopicById('matematika-7-aljabar')!;
    const result = generateMpiFromTopic(topic);
    expect(result.project.curriculum?.subject).toBe('Matematika');
    expect(result.project.curriculum?.grade).toBe('7');
    expect(result.project.curriculum?.phase).toBe('D');
    expect(result.project.curriculum?.topic).toBe('Bentuk Aljabar');
    expect(result.project.curriculum?.objectives.length).toBe(topic.objectives.length);
  });

  it('quiz page has question component with topic-specific prompt', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const result = generateMpiFromTopic(topic);
    const quizPage = result.project.pages.find((p) => p.role === 'quiz')!;
    const question = quizPage.components.find((c) => c.type === 'question') as { prompt: string };
    expect(question).toBeDefined();
    expect(question.prompt).toBe(topic.quizPrompt);
  });

  it('game page has game component with topic-specific missions', () => {
    const topic = getTopicById('ipa-7-zat')!;
    const result = generateMpiFromTopic(topic);
    const gamePage = result.project.pages.find((p) => p.role === 'activity')!;
    const game = gamePage.components.find((c) => c.type === 'game') as { missions: unknown[] };
    expect(game).toBeDefined();
    expect(game.missions.length).toBe(topic.gameMissions.length);
  });

  it('learningObjectives page has layered-info with iconTabs + 5 layers', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const result = generateMpiFromTopic(topic);
    const loPage = result.project.pages.find((p) => p.role === 'learningObjectives')!;
    const layeredInfo = loPage.components.find((c) => c.type === 'layered-info') as {
      variant: string; layers: unknown[];
    };
    expect(layeredInfo).toBeDefined();
    expect(layeredInfo.variant).toBe('iconTabs');
    expect(layeredInfo.layers).toHaveLength(5);
  });

  it('quality report has score and issues', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const result = generateMpiFromTopic(topic);
    expect(result.qualityReport).toBeDefined();
    expect(typeof result.qualityReport.score).toBe('number');
    expect(Array.isArray(result.qualityReport.issues)).toBe(true);
  });

  it('project passes MPI quality check', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const result = generateMpiFromTopic(topic);
    const qc = checkMpiStandard(result.project);
    expect(qc.pass).toBe(true);
    expect(qc.errors).toEqual([]);
  });

  it('applyPageDesignRecipe is applied (geometry is recipe-based, not default)', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const result = generateMpiFromTopic(topic);
    // Material page should have title in titleZone area (y around 40)
    const materialPage = result.project.pages.find((p) => p.role === 'material')!;
    const titleComp = materialPage.components.find((c) => c.type === 'text') as { y: number };
    expect(titleComp.y).toBe(40); // titleZone.y for material recipe
  });
});

// =========================================================================
// Scope 3-5 — UI (Dialog + Topbar)
// =========================================================================

describe('GUIDED-MPI-FLOW-01 — UI', () => {
  beforeEach(() => {
    useEditorStore.getState().newProject();
  });

  it('Topbar has "Paket MPI dari Topik" button', () => {
    const { container } = render(React.createElement(Topbar));
    expect(container.querySelector('[data-testid="topbar-guided-flow"]')).not.toBeNull();
  });

  it('clicking Topbar button opens GuidedFlowDialog', () => {
    const { container } = render(React.createElement(Topbar));
    const btn = container.querySelector('[data-testid="topbar-guided-flow"]') as HTMLButtonElement;
    fireEvent.click(btn);
    expect(container.querySelector('[data-testid="guided-flow-dialog"]')).not.toBeNull();
  });

  it('dialog shows topic catalog with mapel groups', () => {
    const { container } = render(
      React.createElement(GuidedFlowDialog, { onClose: () => {} }),
    );
    expect(container.querySelectorAll('.guided-flow-topic-card').length).toBeGreaterThanOrEqual(4);
  });

  it('selecting topic + clicking Generate produces result with quality score', async () => {
    const { container } = render(
      React.createElement(GuidedFlowDialog, { onClose: () => {} }),
    );
    // Select first topic
    const topicCard = container.querySelector('[data-testid="guided-flow-topic-ppkn-7-norma"]') as HTMLButtonElement;
    fireEvent.click(topicCard);
    // Click generate
    const generateBtn = container.querySelector('[data-testid="guided-flow-generate"]') as HTMLButtonElement;
    fireEvent.click(generateBtn);
    // Wait for quality score to appear (setTimeout 100ms)
    await waitFor(() => {
      const scoreEl = container.querySelector('[data-testid="guided-flow-quality-score"]');
      expect(scoreEl).not.toBeNull();
      expect(scoreEl?.textContent).toMatch(/Skor Kualitas/);
    });
  });

  it('dialog can be closed', () => {
    let closed = false;
    const { container } = render(
      React.createElement(GuidedFlowDialog, { onClose: () => { closed = true; } }),
    );
    const overlay = container.querySelector('.guided-flow-overlay') as HTMLElement;
    fireEvent.click(overlay);
    expect(closed).toBe(true);
  });
});

// =========================================================================
// Regression
// =========================================================================

describe('GUIDED-MPI-FLOW-01 — regression', () => {
  it('all 4 topics generate valid projects', () => {
    for (const topic of MPI_TOPIC_CATALOG) {
      const result = generateMpiFromTopic(topic);
      expect(result.project.pages).toHaveLength(10);
      expect(isValidProject(result.project)).toBe(true);
    }
  });

  it('all 4 topics pass MPI quality check', () => {
    for (const topic of MPI_TOPIC_CATALOG) {
      const result = generateMpiFromTopic(topic);
      const qc = checkMpiStandard(result.project);
      expect(qc.pass, `${topic.id} should pass QC`).toBe(true);
    }
  });

  it('generated project has no OUT_OF_CANVAS errors', () => {
    for (const topic of MPI_TOPIC_CATALOG) {
      const result = generateMpiFromTopic(topic);
      const errors = result.qualityReport.issues.filter((i) => i.code === 'OUT_OF_CANVAS');
      expect(errors, `${topic.id} should have no out-of-canvas errors`).toHaveLength(0);
    }
  });
});

// =========================================================================
// GUIDED-MPI-FLOW-01 Patch-1 — No Overlap + Quality Guard
// =========================================================================

describe('GUIDED-MPI-FLOW-01 Patch-1 — Quality guard', () => {
  it('all topics: no OUT_OF_CANVAS errors in quality report', () => {
    for (const topic of MPI_TOPIC_CATALOG) {
      const result = generateMpiFromTopic(topic);
      const oobErrors = result.qualityReport.issues.filter(
        (i) => i.code === 'OUT_OF_CANVAS',
      );
      expect(oobErrors, `${topic.id} should have no OUT_OF_CANVAS`).toHaveLength(0);
    }
  });

  it('all topics: no LARGE_OVERLAP warnings in quality report', () => {
    for (const topic of MPI_TOPIC_CATALOG) {
      const result = generateMpiFromTopic(topic);
      const overlapIssues = result.qualityReport.issues.filter(
        (i) => i.code === 'LARGE_OVERLAP',
      );
      expect(overlapIssues, `${topic.id} should have no LARGE_OVERLAP`).toHaveLength(0);
    }
  });

  it('all topics: quality score >= 80', () => {
    for (const topic of MPI_TOPIC_CATALOG) {
      const result = generateMpiFromTopic(topic);
      expect(result.qualityReport.score, `${topic.id} score should be >= 80`).toBeGreaterThanOrEqual(80);
    }
  });

  it('PPKn material page specifically has no LARGE_OVERLAP', () => {
    const topic = getTopicById('ppkn-7-norma')!;
    const result = generateMpiFromTopic(topic);
    const materialPage = result.project.pages.find((p) => p.role === 'material')!;
    const quality = validateLayoutQuality(materialPage);
    const overlapIssues = quality.issues.filter((i) => i.code === 'LARGE_OVERLAP');
    expect(overlapIssues).toHaveLength(0);
  });

  it('Apply button is disabled when qualityReport has errors', async () => {
    const { container } = render(
      React.createElement(GuidedFlowDialog, { onClose: () => {} }),
    );
    // Select topic
    const topicCard = container.querySelector('[data-testid="guided-flow-topic-ppkn-7-norma"]') as HTMLButtonElement;
    fireEvent.click(topicCard);
    // Generate
    const generateBtn = container.querySelector('[data-testid="guided-flow-generate"]') as HTMLButtonElement;
    fireEvent.click(generateBtn);
    // Wait for result
    await waitFor(() => {
      expect(container.querySelector('[data-testid="guided-flow-quality-score"]')).not.toBeNull();
    });
    // Check apply button state — if qualityReport.ok is true, button should be enabled
    // If false, button should be disabled
    const applyBtn = container.querySelector('[data-testid="guided-flow-apply"]') as HTMLButtonElement;
    expect(applyBtn).not.toBeNull();
    // For PPKn (which should be ok), button should be enabled
    const topic = getTopicById('ppkn-7-norma')!;
    const result = generateMpiFromTopic(topic);
    if (result.qualityReport.ok) {
      expect(applyBtn.disabled).toBe(false);
      expect(applyBtn.textContent).toMatch(/Terapkan/);
    } else {
      expect(applyBtn.disabled).toBe(true);
      expect(applyBtn.textContent).toMatch(/Error/);
    }
  });

  it('IPA materialSummary says "bentuk" not "bentang"', () => {
    const topic = getTopicById('ipa-7-zat')!;
    expect(topic.materialSummary).not.toMatch(/bentang/);
    expect(topic.materialSummary).toMatch(/Gas bentuk/);
  });
});
