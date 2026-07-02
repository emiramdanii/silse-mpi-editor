/**
 * Content Quality Guard (CONTENT-QUALITY-GUARD-01).
 *
 * Layer: core (pure function, no React/DOM)
 * Allowed imports: ./types, ./ai-mpi-json, ./mpi-container/types
 *
 * Kontrak:
 *   Pure function yang memeriksa kualitas konten MPI:
 *     - Content completeness: field wajib per scene type tidak boleh kosong.
 *     - Pedagogical flow: cover → material → activity → reflection → closing.
 *     - Scene-specific validation: quiz punya choices, game punya items, dll.
 *     - Export content quality: semua scene punya konten, no empty placeholders.
 *
 *   Prinsip:
 *     - Pure function, no DOM, no React, no store.
 *     - Tidak mengubah data.
 *     - Output: { pass, errors, warnings }.
 */

import type { SimpleProject, SimplePage } from './types';
import type { AiMpiBlueprint } from './ai-mpi-json/schema';
import { aiBlueprintToSimpleProject } from './ai-mpi-json/aiBlueprintToSimpleProject';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ContentQualityResult = {
  pass: boolean;
  errors: ContentQualityIssue[];
  warnings: ContentQualityIssue[];
};

export type ContentQualityIssue = {
  sceneId: string;
  sceneType: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
};

// ---------------------------------------------------------------------------
// Required fields per scene type (content-level, not just structure)
// ---------------------------------------------------------------------------

const SCENE_REQUIRED_CONTENT: Record<string, Array<{ key: string; label: string; check: (val: unknown) => boolean }>> = {
  'cover-hero': [
    { key: 'heroTitle', label: 'Hero Title', check: (v) => typeof v === 'string' && v.trim().length > 0 },
  ],
  'curriculum-guide': [
    { key: 'curriculumTitle', label: 'Curriculum Title', check: (v) => typeof v === 'string' && v.trim().length > 0 },
    { key: 'competency', label: 'Competency', check: (v) => typeof v === 'string' && v.trim().length > 0 },
  ],
  'objectives-path': [
    { key: 'objectiveList', label: 'Objective List', check: (v) => Array.isArray(v) && v.length > 0 },
  ],
  'starter-review': [
    { key: 'priorLearning', label: 'Prior Learning', check: (v) => typeof v === 'string' && v.trim().length > 0 },
  ],
  'learning-scene': [
    { key: 'conceptTitle', label: 'Concept Title', check: (v) => typeof v === 'string' && v.trim().length > 0 },
    { key: 'explanation', label: 'Explanation', check: (v) => typeof v === 'string' && v.trim().length > 0 },
  ],
  'discussion-scene': [
    { key: 'discussionPrompt', label: 'Discussion Prompt', check: (v) => typeof v === 'string' && v.trim().length > 0 },
  ],
  'classification-game': [
    { key: 'items', label: 'Items', check: (v) => Array.isArray(v) && v.length > 0 },
    { key: 'categories', label: 'Categories', check: (v) => Array.isArray(v) && v.length > 0 },
  ],
  'case-analysis': [
    { key: 'caseText', label: 'Case Text', check: (v) => typeof v === 'string' && v.trim().length > 0 },
    { key: 'analysisPrompt', label: 'Analysis Prompt', check: (v) => typeof v === 'string' && v.trim().length > 0 },
  ],
  'quiz-challenge': [
    { key: 'prompt', label: 'Question Prompt', check: (v) => typeof v === 'string' && v.trim().length > 0 },
    { key: 'choices', label: 'Choices', check: (v) => Array.isArray(v) && v.length >= 2 },
    { key: 'correctChoiceId', label: 'Correct Choice ID', check: (v) => typeof v === 'string' && v.trim().length > 0 },
  ],
  'result-summary': [
    { key: 'scoreSummary', label: 'Score Summary', check: (v) => v !== null && v !== undefined && typeof v === 'object' },
  ],
  'reflection-journal': [
    { key: 'reflectionPrompts', label: 'Reflection Prompts', check: (v) => Array.isArray(v) && v.length > 0 },
  ],
  'closing-award': [
    { key: 'achievement', label: 'Achievement', check: (v) => typeof v === 'string' && v.trim().length > 0 },
  ],
  'hotspot-map': [
    { key: 'hotspots', label: 'Hotspots', check: (v) => Array.isArray(v) && v.length > 0 },
  ],
  'matching-game': [
    { key: 'leftItems', label: 'Left Items', check: (v) => Array.isArray(v) && v.length > 0 },
    { key: 'rightItems', label: 'Right Items', check: (v) => Array.isArray(v) && v.length > 0 },
    { key: 'correctPairs', label: 'Correct Pairs', check: (v) => Array.isArray(v) && v.length > 0 },
  ],
  'sequencing-game': [
    { key: 'items', label: 'Items', check: (v) => Array.isArray(v) && v.length > 0 },
    { key: 'correctOrder', label: 'Correct Order', check: (v) => Array.isArray(v) && v.length > 0 },
  ],
  'media-focus': [
    { key: 'guidingQuestion', label: 'Guiding Question', check: (v) => typeof v === 'string' && v.trim().length > 0 },
  ],
  'diagnostic-check': [
    { key: 'questionSet', label: 'Question Set', check: (v) => Array.isArray(v) && v.length > 0 },
  ],
  'remedial-practice': [
    { key: 'reteachExplanation', label: 'Reteach Explanation', check: (v) => typeof v === 'string' && v.trim().length > 0 },
  ],
  'enrichment-challenge': [
    { key: 'advancedTask', label: 'Advanced Task', check: (v) => typeof v === 'string' && v.trim().length > 0 },
  ],
  'worksheet-activity': [
    { key: 'taskSteps', label: 'Task Steps', check: (v) => Array.isArray(v) && v.length > 0 },
  ],
  'rubric-panel': [
    { key: 'criteria', label: 'Criteria', check: (v) => Array.isArray(v) && v.length > 0 },
  ],
  'timeline-story': [
    { key: 'events', label: 'Events', check: (v) => Array.isArray(v) && v.length > 0 },
  ],
  'branching-scenario': [
    { key: 'scenarioPrompt', label: 'Scenario Prompt', check: (v) => typeof v === 'string' && v.trim().length > 0 },
    { key: 'choices', label: 'Choices', check: (v) => Array.isArray(v) && v.length > 0 },
  ],
  'glossary-cards': [
    { key: 'terms', label: 'Terms', check: (v) => Array.isArray(v) && v.length > 0 },
  ],
  'teacher-guide': [
    { key: 'teacherInstruction', label: 'Teacher Instruction', check: (v) => typeof v === 'string' && v.trim().length > 0 },
  ],
  'accessibility-help': [
    { key: 'readingGuide', label: 'Reading Guide', check: (v) => typeof v === 'string' && v.trim().length > 0 },
  ],
  'game-mission': [
    { key: 'briefing', label: 'Briefing', check: (v) => typeof v === 'string' && v.trim().length > 0 },
    { key: 'missionTarget', label: 'Mission Target', check: (v) => typeof v === 'string' && v.trim().length > 0 },
  ],
};

// ---------------------------------------------------------------------------
// Pedagogical flow check
// ---------------------------------------------------------------------------

function checkPedagogicalFlow(pages: SimplePage[]): ContentQualityIssue[] {
  const issues: ContentQualityIssue[] = [];
  const roles = pages.map((p) => p.role);

  // Required: cover must be first
  if (roles.length > 0 && roles[0] !== 'cover') {
    issues.push({
      sceneId: pages[0]?.id ?? 'unknown',
      sceneType: pages[0]?.sceneType ?? 'unknown',
      field: 'flow',
      message: 'Scene pertama harus cover (sampul).',
      severity: 'error',
    });
  }

  // Required: closing must be last
  if (roles.length > 1 && roles[roles.length - 1] !== 'closing') {
    issues.push({
      sceneId: pages[pages.length - 1]?.id ?? 'unknown',
      sceneType: pages[pages.length - 1]?.sceneType ?? 'unknown',
      field: 'flow',
      message: 'Scene terakhir harus closing (penutup).',
      severity: 'error',
    });
  }

  // Recommended: at least one material page
  const hasMaterial = roles.includes('material');
  if (!hasMaterial) {
    issues.push({
      sceneId: 'project',
      sceneType: 'project',
      field: 'flow',
      message: 'MPI sebaiknya memiliki minimal satu halaman materi (material).',
      severity: 'warning',
    });
  }

  // Recommended: at least one activity/quiz
  const hasActivity = roles.includes('activity') || roles.includes('quiz');
  if (!hasActivity) {
    issues.push({
      sceneId: 'project',
      sceneType: 'project',
      field: 'flow',
      message: 'MPI sebaiknya memiliki minimal satu aktivitas atau kuis.',
      severity: 'warning',
    });
  }

  // Recommended: at least one reflection
  const hasReflection = roles.includes('reflection');
  if (!hasReflection) {
    issues.push({
      sceneId: 'project',
      sceneType: 'project',
      field: 'flow',
      message: 'MPI sebaiknya memiliki halaman refleksi.',
      severity: 'warning',
    });
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Scene-specific content validation
// ---------------------------------------------------------------------------

function checkSceneContent(page: SimplePage): ContentQualityIssue[] {
  const issues: ContentQualityIssue[] = [];
  if (!page.sceneType || !page.sceneContent) {
    // Legacy page — no scene content to check
    return issues;
  }

  const required = SCENE_REQUIRED_CONTENT[page.sceneType];
  if (!required) return issues;

  const content = page.sceneContent as Record<string, unknown>;

  for (const field of required) {
    const value = content[field.key];
    if (!field.check(value)) {
      issues.push({
        sceneId: page.id,
        sceneType: page.sceneType,
        field: field.key,
        message: `${field.label} kosong atau tidak valid pada scene "${page.title}".`,
        severity: 'error',
      });
    }
  }

  // Scene-specific extra checks
  if (page.sceneType === 'quiz-challenge') {
    const choices = content.choices as Array<{ id: string; text: string }> | undefined;
    const correctId = content.correctChoiceId as string | undefined;
    if (choices && correctId && !choices.some((c) => c.id === correctId)) {
      issues.push({
        sceneId: page.id,
        sceneType: page.sceneType,
        field: 'correctChoiceId',
        message: `Correct choice ID "${correctId}" tidak ada di choices.`,
        severity: 'error',
      });
    }
  }

  if (page.sceneType === 'matching-game') {
    const leftItems = content.leftItems as Array<{ id: string }> | undefined;
    const rightItems = content.rightItems as Array<{ id: string }> | undefined;
    const correctPairs = content.correctPairs as Array<{ leftId: string; rightId: string }> | undefined;
    if (leftItems && rightItems && correctPairs) {
      const leftIds = new Set(leftItems.map((i) => i.id));
      const rightIds = new Set(rightItems.map((i) => i.id));
      for (const pair of correctPairs) {
        if (!leftIds.has(pair.leftId)) {
          issues.push({
            sceneId: page.id,
            sceneType: page.sceneType,
            field: 'correctPairs',
            message: `Pair leftId "${pair.leftId}" tidak ada di leftItems.`,
            severity: 'error',
          });
        }
        if (!rightIds.has(pair.rightId)) {
          issues.push({
            sceneId: page.id,
            sceneType: page.sceneType,
            field: 'correctPairs',
            message: `Pair rightId "${pair.rightId}" tidak ada di rightItems.`,
            severity: 'error',
          });
        }
      }
    }
  }

  if (page.sceneType === 'sequencing-game') {
    const items = content.items as Array<{ id: string }> | undefined;
    const correctOrder = content.correctOrder as string[] | undefined;
    if (items && correctOrder) {
      const itemIds = new Set(items.map((i) => i.id));
      for (const orderId of correctOrder) {
        if (!itemIds.has(orderId)) {
          issues.push({
            sceneId: page.id,
            sceneType: page.sceneType,
            field: 'correctOrder',
            message: `Order ID "${orderId}" tidak ada di items.`,
            severity: 'error',
          });
        }
      }
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Main: checkContentQuality
// ---------------------------------------------------------------------------

/**
 * Check content quality of a SimpleProject.
 * Pure function — no DOM, no React, no store.
 */
export function checkContentQuality(project: SimpleProject): ContentQualityResult {
  const errors: ContentQualityIssue[] = [];
  const warnings: ContentQualityIssue[] = [];

  // 1. Pedagogical flow check
  const flowIssues = checkPedagogicalFlow(project.pages);
  flowIssues.forEach((issue) => {
    if (issue.severity === 'error') errors.push(issue);
    else warnings.push(issue);
  });

  // 2. Scene-specific content check
  project.pages.forEach((page) => {
    const sceneIssues = checkSceneContent(page);
    sceneIssues.forEach((issue) => {
      if (issue.severity === 'error') errors.push(issue);
      else warnings.push(issue);
    });
  });

  // 3. Empty project check
  if (project.pages.length === 0) {
    errors.push({
      sceneId: 'project',
      sceneType: 'project',
      field: 'pages',
      message: 'Project tidak memiliki halaman.',
      severity: 'error',
    });
  }

  return {
    pass: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check content quality of an AiMpiBlueprint.
 * Converts to SimpleProject first, then checks.
 */
export function checkBlueprintContentQuality(blueprint: AiMpiBlueprint): ContentQualityResult {
  const project = aiBlueprintToSimpleProject(blueprint);
  return checkContentQuality(project);
}
