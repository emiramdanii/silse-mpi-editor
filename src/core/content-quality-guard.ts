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
// PATCH A: Helper validators
// ---------------------------------------------------------------------------

function isNonEmptyString(v: unknown): boolean {
  return typeof v === 'string' && v.trim().length > 0;
}

function hasNonEmptyField(item: unknown, field: string): boolean {
  if (typeof item !== 'object' || item === null) return false;
  return isNonEmptyString((item as Record<string, unknown>)[field]);
}

function isNumInRange(v: unknown, min: number, max: number): boolean {
  return typeof v === 'number' && v >= min && v <= max;
}

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
    return issues;
  }

  const required = SCENE_REQUIRED_CONTENT[page.sceneType];
  if (!required) return issues;

  const content = page.sceneContent as Record<string, unknown>;
  const sid = page.id;
  const st = page.sceneType;
  const title = page.title;

  // Basic required field checks
  for (const field of required) {
    const value = content[field.key];
    if (!field.check(value)) {
      issues.push({ sceneId: sid, sceneType: st, field: field.key, message: `${field.label} kosong atau tidak valid pada scene "${title}".`, severity: 'error' });
    }
  }

  // PATCH A: Deep item validation per scene type

  if (st === 'objectives-path') {
    const list = content.objectiveList as unknown[];
    if (Array.isArray(list)) {
      list.forEach((obj, i) => {
        if (!isNonEmptyString(obj)) {
          issues.push({ sceneId: sid, sceneType: st, field: `objectiveList[${i}]`, message: `Objective #${i + 1} kosong pada scene "${title}".`, severity: 'error' });
        }
      });
    }
  }

  if (st === 'classification-game') {
    const items = content.items as Array<Record<string, unknown>> | undefined;
    const categories = content.categories as unknown[] | undefined;
    if (Array.isArray(items)) {
      items.forEach((item, i) => {
        if (!hasNonEmptyField(item, 'id')) issues.push({ sceneId: sid, sceneType: st, field: `items[${i}].id`, message: `Item #${i + 1} id kosong.`, severity: 'error' });
        if (!hasNonEmptyField(item, 'label')) issues.push({ sceneId: sid, sceneType: st, field: `items[${i}].label`, message: `Item #${i + 1} label kosong.`, severity: 'error' });
        if (!hasNonEmptyField(item, 'correctCategory')) issues.push({ sceneId: sid, sceneType: st, field: `items[${i}].correctCategory`, message: `Item #${i + 1} correctCategory kosong.`, severity: 'error' });
      });
      // Check correctCategory exists in categories
      if (Array.isArray(categories) && categories.every((c) => isNonEmptyString(c))) {
        const catSet = new Set(categories);
        items.forEach((item, i) => {
          const cc = item?.correctCategory;
          if (isNonEmptyString(cc) && !catSet.has(cc)) {
            issues.push({ sceneId: sid, sceneType: st, field: `items[${i}].correctCategory`, message: `correctCategory "${cc}" tidak ada di categories.`, severity: 'error' });
          }
        });
      }
    }
    if (Array.isArray(categories)) {
      categories.forEach((cat, i) => {
        if (!isNonEmptyString(cat)) issues.push({ sceneId: sid, sceneType: st, field: `categories[${i}]`, message: `Category #${i + 1} kosong.`, severity: 'error' });
      });
    }
  }

  if (st === 'quiz-challenge') {
    const choices = content.choices as Array<Record<string, unknown>> | undefined;
    const correctId = content.correctChoiceId as string | undefined;
    if (Array.isArray(choices)) {
      if (choices.length < 2) {
        issues.push({ sceneId: sid, sceneType: st, field: 'choices', message: `Quiz harus memiliki minimal 2 choices.`, severity: 'error' });
      }
      choices.forEach((c, i) => {
        if (!hasNonEmptyField(c, 'id')) issues.push({ sceneId: sid, sceneType: st, field: `choices[${i}].id`, message: `Choice #${i + 1} id kosong.`, severity: 'error' });
        if (!hasNonEmptyField(c, 'text')) issues.push({ sceneId: sid, sceneType: st, field: `choices[${i}].text`, message: `Choice #${i + 1} text kosong.`, severity: 'error' });
      });
      if (correctId && !choices.some((c) => c.id === correctId)) {
        issues.push({ sceneId: sid, sceneType: st, field: 'correctChoiceId', message: `Correct choice ID "${correctId}" tidak ada di choices.`, severity: 'error' });
      }
    }
  }

  if (st === 'diagnostic-check') {
    const qs = content.questionSet as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(qs)) {
      qs.forEach((q, i) => {
        if (!hasNonEmptyField(q, 'id')) issues.push({ sceneId: sid, sceneType: st, field: `questionSet[${i}].id`, message: `Question #${i + 1} id kosong.`, severity: 'error' });
        if (!hasNonEmptyField(q, 'prompt')) issues.push({ sceneId: sid, sceneType: st, field: `questionSet[${i}].prompt`, message: `Question #${i + 1} prompt kosong.`, severity: 'error' });
        const qChoices = q?.choices as Array<Record<string, unknown>> | undefined;
        if (!Array.isArray(qChoices) || qChoices.length < 2) issues.push({ sceneId: sid, sceneType: st, field: `questionSet[${i}].choices`, message: `Question #${i + 1} harus memiliki minimal 2 choices.`, severity: 'error' });
        if (Array.isArray(qChoices)) {
          qChoices.forEach((c, ci) => {
            if (!hasNonEmptyField(c, 'id')) issues.push({ sceneId: sid, sceneType: st, field: `questionSet[${i}].choices[${ci}].id`, message: `Q#${i + 1} Choice #${ci + 1} id kosong.`, severity: 'error' });
            if (!hasNonEmptyField(c, 'text')) issues.push({ sceneId: sid, sceneType: st, field: `questionSet[${i}].choices[${ci}].text`, message: `Q#${i + 1} Choice #${ci + 1} text kosong.`, severity: 'error' });
          });
          const qCorrectId = q?.correctChoiceId as string | undefined;
          if (qCorrectId && !qChoices.some((c) => c.id === qCorrectId)) {
            issues.push({ sceneId: sid, sceneType: st, field: `questionSet[${i}].correctChoiceId`, message: `Q#${i + 1} correctChoiceId "${qCorrectId}" tidak ada di choices.`, severity: 'error' });
          }
        }
      });
    }
  }

  if (st === 'matching-game') {
    const leftItems = content.leftItems as Array<Record<string, unknown>> | undefined;
    const rightItems = content.rightItems as Array<Record<string, unknown>> | undefined;
    const correctPairs = content.correctPairs as Array<{ leftId: string; rightId: string }> | undefined;
    if (Array.isArray(leftItems)) leftItems.forEach((item, i) => {
      if (!hasNonEmptyField(item, 'id')) issues.push({ sceneId: sid, sceneType: st, field: `leftItems[${i}].id`, message: `Left item #${i + 1} id kosong.`, severity: 'error' });
      if (!hasNonEmptyField(item, 'label')) issues.push({ sceneId: sid, sceneType: st, field: `leftItems[${i}].label`, message: `Left item #${i + 1} label kosong.`, severity: 'error' });
    });
    if (Array.isArray(rightItems)) rightItems.forEach((item, i) => {
      if (!hasNonEmptyField(item, 'id')) issues.push({ sceneId: sid, sceneType: st, field: `rightItems[${i}].id`, message: `Right item #${i + 1} id kosong.`, severity: 'error' });
      if (!hasNonEmptyField(item, 'label')) issues.push({ sceneId: sid, sceneType: st, field: `rightItems[${i}].label`, message: `Right item #${i + 1} label kosong.`, severity: 'error' });
    });
    if (Array.isArray(leftItems) && Array.isArray(rightItems) && Array.isArray(correctPairs)) {
      const leftIds = new Set(leftItems.map((i) => i.id));
      const rightIds = new Set(rightItems.map((i) => i.id));
      const pairKeys = new Set<string>();
      correctPairs.forEach((pair, pi) => {
        if (!leftIds.has(pair.leftId)) issues.push({ sceneId: sid, sceneType: st, field: `correctPairs[${pi}].leftId`, message: `Pair #${pi + 1} leftId "${pair.leftId}" tidak ada di leftItems.`, severity: 'error' });
        if (!rightIds.has(pair.rightId)) issues.push({ sceneId: sid, sceneType: st, field: `correctPairs[${pi}].rightId`, message: `Pair #${pi + 1} rightId "${pair.rightId}" tidak ada di rightItems.`, severity: 'error' });
        const key = `${pair.leftId}:${pair.rightId}`;
        if (pairKeys.has(key)) issues.push({ sceneId: sid, sceneType: st, field: `correctPairs[${pi}]`, message: `Pair #${pi + 1} duplikat.`, severity: 'error' });
        pairKeys.add(key);
      });
    }
  }

  if (st === 'sequencing-game') {
    const items = content.items as Array<Record<string, unknown>> | undefined;
    const correctOrder = content.correctOrder as string[] | undefined;
    if (Array.isArray(items)) items.forEach((item, i) => {
      if (!hasNonEmptyField(item, 'id')) issues.push({ sceneId: sid, sceneType: st, field: `items[${i}].id`, message: `Item #${i + 1} id kosong.`, severity: 'error' });
      if (!hasNonEmptyField(item, 'label')) issues.push({ sceneId: sid, sceneType: st, field: `items[${i}].label`, message: `Item #${i + 1} label kosong.`, severity: 'error' });
    });
    if (Array.isArray(items) && Array.isArray(correctOrder)) {
      const itemIds = new Set(items.map((i) => i.id));
      correctOrder.forEach((orderId) => {
        if (!itemIds.has(orderId)) issues.push({ sceneId: sid, sceneType: st, field: 'correctOrder', message: `Order ID "${orderId}" tidak ada di items.`, severity: 'error' });
      });
      // Warning: correctOrder length should match items length
      if (correctOrder.length !== items.length) {
        issues.push({ sceneId: sid, sceneType: st, field: 'correctOrder', message: `correctOrder panjang ${correctOrder.length}, items panjang ${items.length}. Sebaiknya sama.`, severity: 'warning' });
      }
    }
  }

  if (st === 'hotspot-map') {
    const hotspots = content.hotspots as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(hotspots)) hotspots.forEach((hs, i) => {
      if (!hasNonEmptyField(hs, 'id')) issues.push({ sceneId: sid, sceneType: st, field: `hotspots[${i}].id`, message: `Hotspot #${i + 1} id kosong.`, severity: 'error' });
      if (!hasNonEmptyField(hs, 'label')) issues.push({ sceneId: sid, sceneType: st, field: `hotspots[${i}].label`, message: `Hotspot #${i + 1} label kosong.`, severity: 'error' });
      if (!hasNonEmptyField(hs, 'info')) issues.push({ sceneId: sid, sceneType: st, field: `hotspots[${i}].info`, message: `Hotspot #${i + 1} info kosong.`, severity: 'error' });
      if (!isNumInRange(hs?.x, 0, 100)) issues.push({ sceneId: sid, sceneType: st, field: `hotspots[${i}].x`, message: `Hotspot #${i + 1} x harus number 0–100.`, severity: 'error' });
      if (!isNumInRange(hs?.y, 0, 100)) issues.push({ sceneId: sid, sceneType: st, field: `hotspots[${i}].y`, message: `Hotspot #${i + 1} y harus number 0–100.`, severity: 'error' });
    });
  }

  if (st === 'branching-scenario') {
    const choices = content.choices as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(choices)) {
      choices.forEach((c, i) => {
        if (!hasNonEmptyField(c, 'id')) issues.push({ sceneId: sid, sceneType: st, field: `choices[${i}].id`, message: `Choice #${i + 1} id kosong.`, severity: 'error' });
        if (!hasNonEmptyField(c, 'label')) issues.push({ sceneId: sid, sceneType: st, field: `choices[${i}].label`, message: `Choice #${i + 1} label kosong.`, severity: 'error' });
        if (!hasNonEmptyField(c, 'consequence')) issues.push({ sceneId: sid, sceneType: st, field: `choices[${i}].consequence`, message: `Choice #${i + 1} consequence kosong.`, severity: 'error' });
      });
      // At least one isCorrect === true
      const hasCorrect = choices.some((c) => c?.isCorrect === true);
      if (!hasCorrect) {
        issues.push({ sceneId: sid, sceneType: st, field: 'choices', message: `Minimal satu choice harus isCorrect=true.`, severity: 'warning' });
      }
    }
  }

  if (st === 'glossary-cards') {
    const terms = content.terms as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(terms)) terms.forEach((t, i) => {
      if (!hasNonEmptyField(t, 'id')) issues.push({ sceneId: sid, sceneType: st, field: `terms[${i}].id`, message: `Term #${i + 1} id kosong.`, severity: 'error' });
      if (!hasNonEmptyField(t, 'term')) issues.push({ sceneId: sid, sceneType: st, field: `terms[${i}].term`, message: `Term #${i + 1} term kosong.`, severity: 'error' });
      if (!hasNonEmptyField(t, 'definition')) issues.push({ sceneId: sid, sceneType: st, field: `terms[${i}].definition`, message: `Term #${i + 1} definition kosong.`, severity: 'error' });
    });
  }

  if (st === 'timeline-story') {
    const events = content.events as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(events)) events.forEach((e, i) => {
      if (!hasNonEmptyField(e, 'id')) issues.push({ sceneId: sid, sceneType: st, field: `events[${i}].id`, message: `Event #${i + 1} id kosong.`, severity: 'error' });
      if (!hasNonEmptyField(e, 'label')) issues.push({ sceneId: sid, sceneType: st, field: `events[${i}].label`, message: `Event #${i + 1} label kosong.`, severity: 'error' });
      if (!hasNonEmptyField(e, 'description')) issues.push({ sceneId: sid, sceneType: st, field: `events[${i}].description`, message: `Event #${i + 1} description kosong.`, severity: 'error' });
    });
  }

  if (st === 'worksheet-activity') {
    const steps = content.taskSteps as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(steps)) steps.forEach((s, i) => {
      if (!hasNonEmptyField(s, 'id')) issues.push({ sceneId: sid, sceneType: st, field: `taskSteps[${i}].id`, message: `Step #${i + 1} id kosong.`, severity: 'error' });
      if (!hasNonEmptyField(s, 'prompt')) issues.push({ sceneId: sid, sceneType: st, field: `taskSteps[${i}].prompt`, message: `Step #${i + 1} prompt kosong.`, severity: 'error' });
    });
  }

  if (st === 'rubric-panel') {
    const criteria = content.criteria as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(criteria)) criteria.forEach((c, i) => {
      if (!hasNonEmptyField(c, 'id')) issues.push({ sceneId: sid, sceneType: st, field: `criteria[${i}].id`, message: `Criterion #${i + 1} id kosong.`, severity: 'error' });
      if (!hasNonEmptyField(c, 'name')) issues.push({ sceneId: sid, sceneType: st, field: `criteria[${i}].name`, message: `Criterion #${i + 1} name kosong.`, severity: 'error' });
      if (!hasNonEmptyField(c, 'description')) issues.push({ sceneId: sid, sceneType: st, field: `criteria[${i}].description`, message: `Criterion #${i + 1} description kosong.`, severity: 'error' });
    });
    const levels = content.levels as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(levels)) levels.forEach((l, i) => {
      if (!hasNonEmptyField(l, 'id')) issues.push({ sceneId: sid, sceneType: st, field: `levels[${i}].id`, message: `Level #${i + 1} id kosong.`, severity: 'error' });
      if (!hasNonEmptyField(l, 'name')) issues.push({ sceneId: sid, sceneType: st, field: `levels[${i}].name`, message: `Level #${i + 1} name kosong.`, severity: 'error' });
      if (typeof l?.score !== 'number') issues.push({ sceneId: sid, sceneType: st, field: `levels[${i}].score`, message: `Level #${i + 1} score harus number.`, severity: 'error' });
      if (!hasNonEmptyField(l, 'descriptor')) issues.push({ sceneId: sid, sceneType: st, field: `levels[${i}].descriptor`, message: `Level #${i + 1} descriptor kosong.`, severity: 'error' });
    });
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
