/**
 * TEMPLATE-CLEANUP-01 — Documentation drift + teacher/student export mode + friendly labels.
 *
 * Scope (per senior reviewer):
 *   1. betulkan komentar "12 scenes" → dynamic
 *   2. putuskan apakah teacher-guide ikut export siswa atau hanya editor/guru
 *   3. rapikan label "remedial" di UI/export agar tetap pakai istilah ramah seperti Penguatan Konsep
 *   4. pastikan picker menampilkan scene count dinamis untuk 17/14/14
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  PEDAGOGICAL_TEMPLATES,
  TEMPLATE_PPKN_NORMA,
  templateToBlueprint,
} from '../core/guided-flow/pedagogical-templates';
import { exportProjectToHtml } from '../export/export-html';
import { aiBlueprintToSimpleProject } from '../core/ai-mpi-json/aiBlueprintToSimpleProject';
import { TemplatePickerDialog } from '../editor/TemplatePickerDialog';
import { useEditorStore } from '../store/editor-store';
import { createSamplePpknProject } from '../core/sample-project';

// ---------------------------------------------------------------------------
// SCOPE 1 — Comment drift fixed
// ---------------------------------------------------------------------------

describe('TEMPLATE-CLEANUP-01 — Scope 1: comment drift fixed', () => {
  it('1a. pedagogical-templates.ts header no longer says "12 scenes"', () => {
    const src = readFileSync(
      resolve(__dirname, '../core/guided-flow/pedagogical-templates.ts'),
      'utf-8',
    );
    // The old inaccurate comment must be gone
    expect(src).not.toContain('Each template produces 12 scenes');
    // The new accurate comment must be present
    expect(src).toContain('12-scene golden reference flow as a spine');
    expect(src).toContain('PPKn=17, IPA=14, MTK=14');
  });

  it('1b. TemplatePickerDialog header no longer says "12 scene"', () => {
    const src = readFileSync(
      resolve(__dirname, '../editor/TemplatePickerDialog.tsx'),
      'utf-8',
    );
    expect(src).not.toContain('generate MPI 12 scene');
    expect(src).not.toContain('12 scene lengkap');
  });
});

// ---------------------------------------------------------------------------
// SCOPE 2 — Teacher-guide excluded from student export
// ---------------------------------------------------------------------------

describe('TEMPLATE-CLEANUP-01 — Scope 2: teacher-guide export mode', () => {
  it('2a. teacher-guide scene content is excluded from standalone student export (PPKn)', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    const project = aiBlueprintToSimpleProject(bp);
    const html = exportProjectToHtml(project);
    // The teacher-guide scene's actual content must NOT appear as rendered text.
    // (The JS function definitions for rendering teacher-guide still exist in
    //  the <script> block, but they are never called because the page is filtered
    //  out before rendering.)
    const tg = TEMPLATE_PPKN_NORMA.scenes.find((s) => s.sceneType === 'teacher-guide');
    const c = tg!.content as any;
    expect(html).not.toContain(c.title);
    expect(html).not.toContain(c.teacherInstruction);
    expect(html).not.toContain(c.assessmentNotes);
    // Facilitation tips should not appear as rendered text
    c.facilitationTips.forEach((tip: string) => {
      expect(html).not.toContain(tip);
    });
  });

  it('2b. teacher-guide title does NOT appear in student export', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const bp = templateToBlueprint(t);
      const project = aiBlueprintToSimpleProject(bp);
      const html = exportProjectToHtml(project);
      const tg = t.scenes.find((s) => s.sceneType === 'teacher-guide');
      if (tg) {
        const c = tg.content as any;
        if (c.title) {
          expect(html, `${t.id}: teacher-guide title must not be in student export`).not.toContain(c.title);
        }
        if (c.teacherInstruction) {
          expect(html, `${t.id}: teacherInstruction must not be in student export`).not.toContain(c.teacherInstruction);
        }
        if (c.assessmentNotes) {
          expect(html, `${t.id}: assessmentNotes must not be in student export`).not.toContain(c.assessmentNotes);
        }
      }
    });
  });

  it('2c. non-teacher-guide scenes ARE present in student export (PPKn)', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    const project = aiBlueprintToSimpleProject(bp);
    const html = exportProjectToHtml(project);
    // cover should be present
    expect(html).toContain('silse-scene-cover-hero');
    // quiz should be present
    expect(html).toContain('silse-scene-quiz-challenge');
    // closing should be present
    expect(html).toContain('silse-scene-closing-award');
  });

  it('2d. teacher-guide content absent from all 3 template student exports', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const bp = templateToBlueprint(t);
      const project = aiBlueprintToSimpleProject(bp);
      const html = exportProjectToHtml(project);
      const tg = t.scenes.find((s) => s.sceneType === 'teacher-guide');
      if (!tg) return;
      const c = tg.content as any;
      // teacher-guide specific content must not be rendered as visible text
      if (c.title) expect(html, `${t.id}: tg title`).not.toContain(c.title);
      if (c.teacherInstruction) expect(html, `${t.id}: tg instruction`).not.toContain(c.teacherInstruction);
      if (c.assessmentNotes) expect(html, `${t.id}: tg assessment`).not.toContain(c.assessmentNotes);
      if (c.timeAllocation) expect(html, `${t.id}: tg time`).not.toContain(c.timeAllocation);
    });
  });
});

// ---------------------------------------------------------------------------
// SCOPE 3 — Friendly labels (Remedial → Penguatan Konsep)
// ---------------------------------------------------------------------------

describe('TEMPLATE-CLEANUP-01 — Scope 3: friendly labels', () => {
  it('3a. React RemedialPracticeComposer uses "Penguatan Konsep" label', () => {
    const src = readFileSync(
      resolve(__dirname, '../components/scene-composers/index.tsx'),
      'utf-8',
    );
    expect(src).toContain('Penguatan Konsep');
    expect(src).not.toContain('chipLabel="Remedial"');
    expect(src).not.toContain('title="Remedial Practice"');
  });

  it('3b. export RemedialPractice uses "Penguatan Konsep" label', () => {
    const src = readFileSync(
      resolve(__dirname, '../export/export-html.ts'),
      'utf-8',
    );
    expect(src).toContain("'🔧 Penguatan Konsep'");
    expect(src).not.toContain("'🔧 Remedial'");
    expect(src).not.toContain("'Remedial Practice'");
  });

  it('3c. React EnrichmentChallengeComposer uses "Tantangan Lanjutan" label', () => {
    const src = readFileSync(
      resolve(__dirname, '../components/scene-composers/index.tsx'),
      'utf-8',
    );
    expect(src).toContain('Tantangan Lanjutan');
    expect(src).not.toContain('chipLabel="Enrichment"');
    expect(src).not.toContain('title="Enrichment Challenge"');
  });

  it('3d. export EnrichmentChallenge uses "Tantangan Lanjutan" label', () => {
    const src = readFileSync(
      resolve(__dirname, '../export/export-html.ts'),
      'utf-8',
    );
    expect(src).toContain("'🚀 Tantangan Lanjutan'");
    expect(src).not.toContain("'🚀 Enrichment'");
    expect(src).not.toContain("'Enrichment Challenge'");
  });

  it('3e. PPKn remedial-practice export renders "Penguatan Konsep" header', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    const project = aiBlueprintToSimpleProject(bp);
    const html = exportProjectToHtml(project);
    expect(html).toContain('Penguatan Konsep');
  });

  it('3f. PPKn enrichment-challenge export renders "Tantangan Lanjutan" header', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    const project = aiBlueprintToSimpleProject(bp);
    const html = exportProjectToHtml(project);
    expect(html).toContain('Tantangan Lanjutan');
  });
});

// ---------------------------------------------------------------------------
// SCOPE 4 — Picker shows dynamic scene count
// ---------------------------------------------------------------------------

describe('TEMPLATE-CLEANUP-01 — Scope 4: dynamic scene count in picker', () => {
  beforeEach(() => {
    useEditorStore.setState({
      project: {
        ...createSamplePpknProject(),
        pages: [{
          id: 'empty', title: 'New', role: 'cover', layoutId: 'blank',
          background: { type: 'color', color: '#fff' }, components: [],
        }],
        currentPageId: 'empty',
      },
      selectedComponentId: null,
    });
  });

  it('4a. picker shows 17 Scene for PPKn template card', () => {
    const { container } = render(<TemplatePickerDialog onClose={() => {}} />);
    const ppknCard = container.querySelector('[data-testid="template-card-tpl-ppkn-norma"]');
    expect(ppknCard?.textContent).toContain('17 Scene');
  });

  it('4b. picker shows 14 Scene for IPA template card', () => {
    const { container } = render(<TemplatePickerDialog onClose={() => {}} />);
    const ipaCard = container.querySelector('[data-testid="template-card-tpl-ipa-tata-surya"]');
    expect(ipaCard?.textContent).toContain('14 Scene');
  });

  it('4c. picker shows 14 Scene for Matematika template card', () => {
    const { container } = render(<TemplatePickerDialog onClose={() => {}} />);
    const mtkCard = container.querySelector('[data-testid="template-card-tpl-mtk-bilangan-bulat"]');
    expect(mtkCard?.textContent).toContain('14 Scene');
  });

  it('4d. picker scene count is dynamic (uses bp.scenes.length, not hardcoded)', () => {
    const src = readFileSync(
      resolve(__dirname, '../editor/TemplatePickerDialog.tsx'),
      'utf-8',
    );
    expect(src).toContain('bp.scenes.length');
    expect(src).toContain('{status.sceneCount} Scene');
  });
});

// ---------------------------------------------------------------------------
// SCOPE 5 — No regression: all guards still pass
// ---------------------------------------------------------------------------

describe('TEMPLATE-CLEANUP-01 — Scope 5: no regression', () => {
  it('5a. all 3 templates still have first=cover, last=closing', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      expect(t.scenes[0].sceneType).toBe('cover-hero');
      expect(t.scenes[t.scenes.length - 1].sceneType).toBe('closing-award');
    });
  });

  it('5b. all 3 templates still export as standalone HTML', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const bp = templateToBlueprint(t);
      const project = aiBlueprintToSimpleProject(bp);
      const html = exportProjectToHtml(project);
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
    });
  });
});
