/**
 * Learning Goal Alignment Contract (LEARNING-GOAL-ALIGNMENT-CONTRACT-01).
 *
 * Layer: core (pure functions, no React/DOM)
 * Allowed imports: ./types
 *
 * Kontrak (LGA-01):
 *   SILSE adalah media pembelajaran, bukan generator kuis/game.
 *   Setiap halaman, aktivitas, kuis, game, dan refleksi harus terhubung
 *   ke tujuan pembelajaran (curriculum.objectives).
 *
 *   Contract ini mendefinisikan:
 *     1. ObjectiveRef — tag yang menghubungkan komponen/halaman ke objective
 *     2. PageAlignment — alignment per halaman
 *     3. ProjectAlignment — alignment agregat project
 *     4. checkLearningGoalAlignment(project) — pure function checker
 *
 *   Prinsip:
 *     - Setiap objective WAJIB di-address oleh minimal 1 halaman materi/aktivitas.
 *     - Setiap question/game WAJIB terhubung ke minimal 1 objective.
 *     - Halaman refleksi WAJIB merujuk kembali ke minimal 1 objective.
 *     - Jika tidak ada curriculum.objectives, project TIDAK aligned.
 *
 *   V1: Contract + checker only. UI integration di batch berikutnya.
 */

import type { SimpleProject, PageComponent } from './types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AlignmentIssueSeverity = 'warning' | 'error';

export type AlignmentIssue = {
  severity: AlignmentIssueSeverity;
  code: string;
  message: string;
  pageId?: string;
  componentId?: string;
  objectiveId?: string;
};

export type PageAlignment = {
  pageId: string;
  pageRole: string;
  pageTitle: string;
  /** Objective IDs that this page addresses (derived from content analysis). */
  addressedObjectiveIds: string[];
  /** Does this page have assessment components (question/game)? */
  hasAssessment: boolean;
  /** Assessment components and their linked objectives (if any). */
  assessmentComponents: Array<{
    componentId: string;
    componentType: string;
    linkedObjectiveIds: string[];
  }>;
  issues: AlignmentIssue[];
};

export type ProjectAlignment = {
  ok: boolean;
  score: number;
  totalObjectives: number;
  coveredObjectives: number;
  uncoveredObjectiveIds: string[];
  pages: PageAlignment[];
  issues: AlignmentIssue[];
};

// ---------------------------------------------------------------------------
// Helper: extract objective references from component content
// ---------------------------------------------------------------------------

/**
 * V1 heuristic: check if component text content references objective text.
 * This is a simple text-match approach. V2 could use explicit objectiveRef field.
 *
 * Patch-1: field yang diekstrak per tipe komponen:
 *   - text: text
 *   - image: alt (caption/deskripsi gambar, BUKAN src)
 *   - card: title + body
 *   - question: title + prompt
 *   - game: title + instruction + missions[].prompt
 *   - layered-info: title + layers[].title + layers[].body
 *   - learning-bridge: title + message
 *   - navigation: TIDAK diekstrak (label tombol BUKAN konten pembelajaran)
 */
function componentAddressesObjectives(
  comp: PageComponent,
  objectives: Array<{ id: string; text: string }>,
): string[] {
  const addressed: string[] = [];
  const texts: string[] = [];

  // Collect text content from component
  if (comp.type === 'text') {
    texts.push((comp as { text: string }).text);
  } else if (comp.type === 'image') {
    // Patch-1: image caption (alt) counts as learning content.
    const img = comp as { alt?: string };
    texts.push(img.alt ?? '');
  } else if (comp.type === 'card') {
    const c = comp as { title?: string; body: string };
    texts.push(c.title ?? '', c.body);
  } else if (comp.type === 'question') {
    const q = comp as { title: string; prompt: string };
    texts.push(q.title, q.prompt);
  } else if (comp.type === 'game') {
    const g = comp as { title: string; instruction: string; missions: { prompt: string }[] };
    texts.push(g.title, g.instruction, ...g.missions.map((m) => m.prompt));
  } else if (comp.type === 'layered-info') {
    const li = comp as { title: string; layers: { title: string; body: string }[] };
    texts.push(li.title, ...li.layers.map((l) => l.title + ' ' + l.body));
  } else if (comp.type === 'learning-bridge') {
    const lb = comp as { title: string; message: string };
    texts.push(lb.title, lb.message);
  }
  // navigation: TIDAK diekstrak — label tombol BUKAN konten pembelajaran.

  const combinedText = texts.join(' ').toLowerCase();

  // Check if any objective keyword appears in the component text
  for (const obj of objectives) {
    const objLower = obj.text.toLowerCase();
    // Simple keyword match: check if 3+ consecutive words from objective appear
    const words = objLower.split(/\s+/).filter((w) => w.length > 3);
    if (words.length === 0) continue;

    // Check if at least 2 significant words from objective appear in text
    const matchedWords = words.filter((w) => combinedText.includes(w));
    if (matchedWords.length >= Math.min(2, words.length)) {
      addressed.push(obj.id);
    }
  }

  return addressed;
}

// ---------------------------------------------------------------------------
// Helper: extract significant words from objective (length > 3)
// Patch-1: needed for OBJECTIVE_TOO_SHORT check.
// ---------------------------------------------------------------------------

function objectiveSignificantWords(text: string): string[] {
  return text.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
}

// ---------------------------------------------------------------------------
// Helper: check if component is assessment
// ---------------------------------------------------------------------------

function isAssessmentComponent(comp: PageComponent): boolean {
  return comp.type === 'question' || comp.type === 'game';
}

// ---------------------------------------------------------------------------
// Main: checkLearningGoalAlignment
// ---------------------------------------------------------------------------

export function checkLearningGoalAlignment(project: SimpleProject): ProjectAlignment {
  const issues: AlignmentIssue[] = [];
  const pageAlignments: PageAlignment[] = [];

  // 1. Check curriculum exists
  if (!project.curriculum || !project.curriculum.objectives || project.curriculum.objectives.length === 0) {
    return {
      ok: false,
      score: 0,
      totalObjectives: 0,
      coveredObjectives: 0,
      uncoveredObjectiveIds: [],
      pages: [],
      issues: [{
        severity: 'error',
        code: 'NO_OBJECTIVES',
        message: 'Project tidak punya tujuan pembelajaran (curriculum.objectives kosong).',
      }],
    };
  }

  const objectives = project.curriculum.objectives;

  // Patch-2: OBJECTIVE_DUPLICATE_ID — guard data integrity.
  // Set will silently hide duplicate IDs, which can make coverage look correct
  // when it is actually broken (one objective covered twice, another not at all).
  // We detect duplicates BEFORE constructing the Set, and push an error per
  // duplicate ID. Duplicate IDs make ok=false (errors block ok).
  const seenObjectiveIds = new Set<string>();
  const reportedDuplicateIds = new Set<string>();
  for (const obj of objectives) {
    if (seenObjectiveIds.has(obj.id)) {
      // Only report each duplicate ID once (not once per extra occurrence).
      if (!reportedDuplicateIds.has(obj.id)) {
        issues.push({
          severity: 'error',
          code: 'OBJECTIVE_DUPLICATE_ID',
          message: `Ada ID tujuan pembelajaran yang duplikat (id: "${obj.id}"). Setiap tujuan wajib punya ID unik agar coverage checker tidak salah hitung.`,
          objectiveId: obj.id,
        });
        reportedDuplicateIds.add(obj.id);
      }
    } else {
      seenObjectiveIds.add(obj.id);
    }
  }

  const objectiveIds = new Set(objectives.map((o) => o.id));
  const coveredObjectiveIds = new Set<string>();

  // Patch-1: OBJECTIVE_TOO_SHORT warning — objective with no significant words
  // cannot be tested by text-match heuristic.
  for (const obj of objectives) {
    const sigWords = objectiveSignificantWords(obj.text);
    if (sigWords.length === 0) {
      issues.push({
        severity: 'warning',
        code: 'OBJECTIVE_TOO_SHORT',
        message: `Tujuan pembelajaran "${obj.text}" terlalu pendek — tidak ada kata signifikan (panjang > 3 huruf) untuk dicek heuristik text-match. Tulis ulang dengan lebih spesifik.`,
        objectiveId: obj.id,
      });
    }
  }

  // 2. Check each page
  for (const page of project.pages) {
    const pageIssues: AlignmentIssue[] = [];
    const pageAddressed: string[] = [];

    for (const comp of page.components) {
      // Collect objectives addressed by this component
      const addressed = componentAddressesObjectives(comp, objectives);
      pageAddressed.push(...addressed);

      // Assessment components should address at least 1 objective
      if (isAssessmentComponent(comp)) {
        if (addressed.length === 0) {
          pageIssues.push({
            severity: 'warning',
            code: 'ASSESSMENT_NOT_LINKED',
            message: `Komponen ${comp.type} di halaman "${page.title}" tidak terhubung jelas ke tujuan pembelajaran manapun.`,
            pageId: page.id,
            componentId: comp.id,
          });
        }
      }
    }

    // Mark covered objectives
    pageAddressed.forEach((id) => coveredObjectiveIds.add(id));

    // Material pages should address at least 1 objective
    if (page.role === 'material' && pageAddressed.length === 0) {
      pageIssues.push({
        severity: 'warning',
        code: 'MATERIAL_NOT_LINKED',
        message: `Halaman materi "${page.title}" tidak terhubung jelas ke tujuan pembelajaran manapun.`,
        pageId: page.id,
      });
    }

    // Reflection pages should reference at least 1 objective
    if (page.role === 'reflection' && pageAddressed.length === 0) {
      pageIssues.push({
        severity: 'warning',
        code: 'REFLECTION_NOT_LINKED',
        message: `Halaman refleksi "${page.title}" tidak merujuk ke tujuan pembelajaran.`,
        pageId: page.id,
      });
    }

    const assessmentComponents = page.components
      .filter(isAssessmentComponent)
      .map((comp) => ({
        componentId: comp.id,
        componentType: comp.type,
        linkedObjectiveIds: componentAddressesObjectives(comp, objectives),
      }));

    pageAlignments.push({
      pageId: page.id,
      pageRole: page.role,
      pageTitle: page.title,
      addressedObjectiveIds: [...new Set(pageAddressed)],
      hasAssessment: assessmentComponents.length > 0,
      assessmentComponents,
      issues: pageIssues,
    });

    issues.push(...pageIssues);
  }

  // 3. Check uncovered objectives
  const uncoveredObjectiveIds = objectiveIds.size > 0
    ? [...objectiveIds].filter((id) => !coveredObjectiveIds.has(id))
    : [];

  for (const objId of uncoveredObjectiveIds) {
    const obj = objectives.find((o) => o.id === objId);
    issues.push({
      severity: 'error',
      code: 'OBJECTIVE_NOT_COVERED',
      message: `Tujuan pembelajaran "${obj?.text ?? objId}" tidak di-address oleh halaman manapun.`,
      objectiveId: objId,
    });
  }

  // 4. Calculate score
  const totalObjectives = objectives.length;
  const coveredObjectives = coveredObjectiveIds.size;
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  // Coverage score (0-70) + penalty for issues
  const coverageScore = totalObjectives > 0 ? (coveredObjectives / totalObjectives) * 70 : 0;
  const issueScore = Math.max(0, 30 - errorCount * 10 - warningCount * 3);
  const score = Math.round(coverageScore + issueScore);

  return {
    ok: errorCount === 0 && uncoveredObjectiveIds.length === 0,
    score,
    totalObjectives,
    coveredObjectives,
    uncoveredObjectiveIds,
    pages: pageAlignments,
    issues,
  };
}

// ---------------------------------------------------------------------------
// Helpers for UI
// ---------------------------------------------------------------------------

export function getAlignmentSummaryLabel(alignment: ProjectAlignment): string {
  if (alignment.totalObjectives === 0) return 'Belum ada tujuan';
  const covered = alignment.totalObjectives - alignment.uncoveredObjectiveIds.length;
  if (alignment.uncoveredObjectiveIds.length === 0) return 'Semua tujuan tercover';
  return `${covered}/${alignment.totalObjectives} tujuan tercover`;
}

export function getAlignmentScoreLabel(score: number): string {
  if (score >= 80) return 'Sangat Selaras';
  if (score >= 60) return 'Cukup Selaras';
  if (score >= 40) return 'Kurang Selaras';
  return 'Belum Selaras';
}
