/**
 * TEMPLATE-PEDAGOGIS-READY-02 PATCH B — Real 16:9 Template Fit Guard.
 *
 * Scope:
 *   A. Audit template content (PPKn / IPA / Matematika) — every scene.
 *   B. Density rules enforced (chars + counts) via checkTemplateDensity helper.
 *   C. checkTemplateDensity helper exists in core.
 *   D. Comprehensive tests covering every density rule.
 *   E. Render guard: SceneShell uses explicit overflow (overflowX hidden).
 *   F. Export still standalone, 12 pages, all have sceneType, content quality.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  PEDAGOGICAL_TEMPLATES,
  TEMPLATE_PPKN_NORMA,
  TEMPLATE_IPA_TATA_SURYA,
  TEMPLATE_MTK_BILANGAN_BULAT,
  templateToBlueprint,
  checkTemplateDensity,
  checkAllTemplatesDensity,
  DEFAULT_TEMPLATE_DENSITY_LIMITS,
  type PedagogicalTemplate,
} from '../core/guided-flow/pedagogical-templates';
import { validateAiMpiJson } from '../core/ai-mpi-json';
import { checkBlueprintContentQuality } from '../core/content-quality-guard';
import { exportProjectToHtml } from '../export/export-html';
import { aiBlueprintToSimpleProject } from '../core/ai-mpi-json/aiBlueprintToSimpleProject';

// ---------------------------------------------------------------------------
// SCOPE A — Audit: helper exists and runs on all 3 templates
// ---------------------------------------------------------------------------

describe('PATCH B — Scope A: Audit helper', () => {
  it('1. checkTemplateDensity helper is exported from pedagogical-templates', () => {
    const source = readFileSync(
      resolve(__dirname, '../core/guided-flow/pedagogical-templates.ts'),
      'utf-8',
    );
    expect(source).toContain('export function checkTemplateDensity');
    expect(source).toContain('export function checkAllTemplatesDensity');
    expect(source).toContain('export type TemplateDensityIssue');
    expect(source).toContain('export type TemplateDensityLimits');
    expect(source).toContain('export const DEFAULT_TEMPLATE_DENSITY_LIMITS');
  });

  it('2. checkTemplateDensity returns empty array for valid templates (no issues)', () => {
    const allIssues = checkAllTemplatesDensity();
    expect(
      allIssues,
      allIssues.map((i) => `[${i.templateId}/${i.sceneId}] ${i.field}: ${i.message}`).join('\n'),
    ).toHaveLength(0);
  });

  it('3. checkTemplateDensity returns issues array (typed) for a bad template', () => {
    // Build an intentionally bad template by cloning PPKn and bloating one field.
    const bad: PedagogicalTemplate = {
      ...TEMPLATE_PPKN_NORMA,
      id: 'tpl-bad-test',
      scenes: TEMPLATE_PPKN_NORMA.scenes.map((s) => {
        if (s.id === 'scene-materi') {
          return {
            ...s,
            content: {
              ...s.content,
              kind: 'learning-material',
              explanation:
                'X'.repeat(DEFAULT_TEMPLATE_DENSITY_LIMITS.learningExplanationMax + 50),
            } as any,
          };
        }
        return s;
      }),
    };
    const issues = checkTemplateDensity(bad);
    expect(issues.length).toBeGreaterThan(0);
    const explIssue = issues.find((i) => i.field === 'explanation');
    expect(explIssue).toBeDefined();
    expect(explIssue?.templateId).toBe('tpl-bad-test');
    expect(explIssue?.sceneId).toBe('scene-materi');
  });
});

// ---------------------------------------------------------------------------
// SCOPE B — Density rules enforced per content kind
// ---------------------------------------------------------------------------

describe('PATCH B — Scope B: density rules per content kind', () => {
  it('4. learning-scene explanation <= 350 chars', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const bp = templateToBlueprint(t);
      bp.scenes.forEach((scene) => {
        const c = scene.slots[0]?.content as any;
        if (c?.kind === 'learning-material' && c.explanation) {
          expect(
            String(c.explanation).length,
            `${t.id}/${scene.id} explanation length`,
          ).toBeLessThanOrEqual(350);
        }
      });
    });
  });

  it('5. discussionPrompt <= 180 chars', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const bp = templateToBlueprint(t);
      bp.scenes.forEach((scene) => {
        const c = scene.slots[0]?.content as any;
        if (c?.discussionPrompt) {
          expect(
            String(c.discussionPrompt).length,
            `${t.id}/${scene.id} discussionPrompt length`,
          ).toBeLessThanOrEqual(180);
        }
      });
    });
  });

  it('6. case-analysis caseText <= 220 chars', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const bp = templateToBlueprint(t);
      bp.scenes.forEach((scene) => {
        const c = scene.slots[0]?.content as any;
        if (c?.kind === 'case-analysis' && c.caseText) {
          expect(
            String(c.caseText).length,
            `${t.id}/${scene.id} caseText length`,
          ).toBeLessThanOrEqual(220);
        }
      });
    });
  });

  it('7. case-analysis revealExplanation <= 260 chars', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const bp = templateToBlueprint(t);
      bp.scenes.forEach((scene) => {
        const c = scene.slots[0]?.content as any;
        if (c?.kind === 'case-analysis' && c.revealExplanation) {
          expect(
            String(c.revealExplanation).length,
            `${t.id}/${scene.id} revealExplanation length`,
          ).toBeLessThanOrEqual(260);
        }
      });
    });
  });

  it('8. quiz-question prompt <= 160 chars', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const bp = templateToBlueprint(t);
      bp.scenes.forEach((scene) => {
        const c = scene.slots[0]?.content as any;
        if (c?.kind === 'quiz-question' && c.prompt) {
          expect(
            String(c.prompt).length,
            `${t.id}/${scene.id} quiz prompt length`,
          ).toBeLessThanOrEqual(160);
        }
      });
    });
  });

  it('9. quiz-question choice text <= 80 chars each', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const bp = templateToBlueprint(t);
      bp.scenes.forEach((scene) => {
        const c = scene.slots[0]?.content as any;
        if (c?.kind === 'quiz-question' && Array.isArray(c.choices)) {
          c.choices.forEach((ch: any, i: number) => {
            expect(
              String(ch.text).length,
              `${t.id}/${scene.id} choices[${i}].text length`,
            ).toBeLessThanOrEqual(80);
          });
        }
      });
    });
  });

  it('10. reflection-journal prompts max 2 and each <= 120 chars', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const bp = templateToBlueprint(t);
      bp.scenes.forEach((scene) => {
        const c = scene.slots[0]?.content as any;
        if (c?.kind === 'reflection-journal' && Array.isArray(c.reflectionPrompts)) {
          expect(
            c.reflectionPrompts.length,
            `${t.id}/${scene.id} reflectionPrompts count`,
          ).toBeLessThanOrEqual(2);
          c.reflectionPrompts.forEach((rp: string, i: number) => {
            expect(
              String(rp).length,
              `${t.id}/${scene.id} reflectionPrompts[${i}] length`,
            ).toBeLessThanOrEqual(120);
          });
        }
      });
    });
  });

  it('11. learning-material keyPoints max 3 and each <= 90 chars; examples max 2', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const bp = templateToBlueprint(t);
      bp.scenes.forEach((scene) => {
        const c = scene.slots[0]?.content as any;
        if (c?.kind !== 'learning-material') return;
        if (Array.isArray(c.keyPoints)) {
          expect(c.keyPoints.length).toBeLessThanOrEqual(3);
          c.keyPoints.forEach((kp: string, i: number) => {
            expect(
              String(kp).length,
              `${t.id}/${scene.id} keyPoints[${i}] length`,
            ).toBeLessThanOrEqual(90);
          });
        }
        if (Array.isArray(c.examples)) {
          expect(c.examples.length).toBeLessThanOrEqual(2);
        }
      });
    });
  });

  it('12. game items max 6 (classification + sequencing) and instruction <= 140 chars', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const bp = templateToBlueprint(t);
      bp.scenes.forEach((scene) => {
        const c = scene.slots[0]?.content as any;
        if (c?.kind !== 'classification-game' && c?.kind !== 'sequencing-game') return;
        if (Array.isArray(c.items)) {
          expect(c.items.length).toBeLessThanOrEqual(6);
          c.items.forEach((it: any, i: number) => {
            expect(
              String(it.label).length,
              `${t.id}/${scene.id} items[${i}].label length`,
            ).toBeLessThanOrEqual(60);
          });
        }
        if (c.instruction) {
          expect(
            String(c.instruction).length,
            `${t.id}/${scene.id} instruction length`,
          ).toBeLessThanOrEqual(140);
        }
      });
    });
  });

  it('13. groupInstruction <= 140 chars (discussion-scene)', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const bp = templateToBlueprint(t);
      bp.scenes.forEach((scene) => {
        const c = scene.slots[0]?.content as any;
        if (c?.kind === 'discussion-scene' && c.groupInstruction) {
          expect(
            String(c.groupInstruction).length,
            `${t.id}/${scene.id} groupInstruction length`,
          ).toBeLessThanOrEqual(140);
        }
      });
    });
  });

  it('14. closing-award summary <= 180 chars', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const bp = templateToBlueprint(t);
      bp.scenes.forEach((scene) => {
        const c = scene.slots[0]?.content as any;
        if (c?.kind === 'closing-award' && c.summary) {
          expect(
            String(c.summary).length,
            `${t.id}/${scene.id} closing summary length`,
          ).toBeLessThanOrEqual(180);
        }
      });
    });
  });
});

// ---------------------------------------------------------------------------
// SCOPE C — Quality + structural regression (templates still pass content quality,
//            validator, 12 pages with sceneType, export standalone)
// ---------------------------------------------------------------------------

describe('PATCH B — Scope C: structural regressions', () => {
  it('15. all 3 templates still pass checkBlueprintContentQuality (no errors)', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const bp = templateToBlueprint(t);
      const result = checkBlueprintContentQuality(bp);
      expect(
        result.errors,
        `${t.id}: ${result.errors.map((e) => e.message).join('; ')}`,
      ).toHaveLength(0);
    });
  });

  it('16. all 3 templates still pass validateAiMpiJson (no errors)', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const bp = templateToBlueprint(t);
      const errors = validateAiMpiJson(bp);
      expect(
        errors,
        `${t.id}: ${errors.map((e) => e.message).join('; ')}`,
      ).toHaveLength(0);
    });
  });

  it('17. all 3 templates produce scenes matching their template definition', () => {
    // TEACHER-READY-TEMPLATE-QUALITY: templates now have 14-17 scenes
    // (12 golden + teacher-pedagogy scenes). The exact count per template
    // is verified in teacher-ready-template-quality-01.test.tsx.
    // Here we verify blueprint scene count == template scene count.
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const bp = templateToBlueprint(t);
      expect(bp.scenes.length, `${t.id} blueprint scene count`).toBe(t.scenes.length);
      expect(t.scenes.length, `${t.id} template has >= 12 scenes`).toBeGreaterThanOrEqual(12);
    });
  });

  it('18. every scene in every template has a sceneType', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      t.scenes.forEach((s) => {
        expect(s.sceneType, `${t.id}/${s.id} sceneType`).toBeTruthy();
      });
    });
  });

  it('19. every template applies to a SimpleProject with sceneType on every page', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const bp = templateToBlueprint(t);
      const project = aiBlueprintToSimpleProject(bp);
      expect(project.pages.length).toBe(t.scenes.length);
      project.pages.forEach((p, i) => {
        expect(p.sceneType, `${t.id} page[${i}] sceneType`).toBeTruthy();
      });
    });
  });

  it('20. export is standalone HTML (string, contains <html>, no external scripts)', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const bp = templateToBlueprint(t);
      const project = aiBlueprintToSimpleProject(bp);
      const html = exportProjectToHtml(project);
      expect(typeof html).toBe('string');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
      // No external script src (data: URIs are inline, OK)
      expect(html).not.toMatch(/<script[^>]+src="https?:/);
    });
  });
});

// ---------------------------------------------------------------------------
// SCOPE D — Render guard: SceneShell uses explicit overflow (overflowX hidden)
// ---------------------------------------------------------------------------

describe('PATCH B — Scope D: render guard (SceneShell overflow)', () => {
  it('21. React SceneShell uses overflow: hidden (no scrollbars on 16:9 canvas)', () => {
    const source = readFileSync(
      resolve(__dirname, '../components/scene-blocks/index.tsx'),
      'utf-8',
    );
    // The shell function exists and uses overflow: hidden so quiz/game/learning scenes
    // fit within the 1280x720 canvas without inner scrollbars.
    expect(source).toContain('export function SceneShell');
    expect(source).toContain("overflow: 'hidden'");
    // The old scrollable pair (overflowX/overflowY) should no longer be used inside SceneShell
    const shellStart = source.indexOf('export function SceneShell');
    const shellEnd = source.indexOf('// ----', shellStart + 1);
    const shellBlock = source.slice(shellStart, shellEnd === -1 ? undefined : shellEnd);
    expect(shellBlock).not.toContain("overflow: 'auto'");
    expect(shellBlock).not.toContain("overflowY: 'auto'");
  });

  it('22. Export SceneShell uses overflow:hidden (parity with React)', () => {
    const source = readFileSync(
      resolve(__dirname, '../export/export-html.ts'),
      'utf-8',
    );
    expect(source).toContain('overflow:hidden');
    // The old scrollable pair (overflow-x:hidden;overflow-y:auto) should NOT appear
    // inside the export shell builder
    expect(source).not.toContain(
      'box-sizing:border-box;overflow-x:hidden;overflow-y:auto;background:radial-gradient',
    );
  });

  it('23. SceneShell overflow is the LAST word on layout — every React composer uses <SceneShell>', () => {
    const source = readFileSync(
      resolve(__dirname, '../components/scene-composers/index.tsx'),
      'utf-8',
    );
    // Count how many composer functions exist
    const composerCount = (source.match(/export function \w+Composer/g) || []).length;
    expect(composerCount).toBeGreaterThan(0);
    // Count SceneShell usages
    const shellCount = (source.match(/<SceneShell /g) || []).length;
    expect(shellCount, 'every composer should use <SceneShell>').toBe(composerCount);
  });
});

// ---------------------------------------------------------------------------
// SCOPE E — Per-template golden audit (one issue array per template, empty)
// ---------------------------------------------------------------------------

describe('PATCH B — Scope E: per-template golden density', () => {
  it('24. PPKn — Macam-Macam Norma passes density guard', () => {
    const issues = checkTemplateDensity(TEMPLATE_PPKN_NORMA);
    expect(
      issues,
      issues.map((i) => `${i.field}: ${i.message}`).join('\n'),
    ).toHaveLength(0);
  });

  it('25. IPA — Sistem Tata Surya passes density guard', () => {
    const issues = checkTemplateDensity(TEMPLATE_IPA_TATA_SURYA);
    expect(
      issues,
      issues.map((i) => `${i.field}: ${i.message}`).join('\n'),
    ).toHaveLength(0);
  });

  it('26. Matematika — Bilangan Bulat passes density guard', () => {
    const issues = checkTemplateDensity(TEMPLATE_MTK_BILANGAN_BULAT);
    expect(
      issues,
      issues.map((i) => `${i.field}: ${i.message}`).join('\n'),
    ).toHaveLength(0);
  });
});
