/**
 * TEACHER-READY-TEMPLATE-QUALITY-01 — Tests.
 *
 * Verifies that all 3 pedagogical templates are now "teacher-ready" with:
 *   - teacher-guide scene (all 3 templates)
 *   - rubric-panel scene (all 3 templates)
 *   - diagnostic-check + remedial-practice + enrichment-challenge (PPKn)
 *   - matching-game for game variety (IPA, replaces classification-game)
 *   - objectiveRefs on every non-cover/closing scene
 *   - all templates pass density guard (extended for new content kinds)
 *   - all templates pass content quality + validator
 *   - all templates export as standalone HTML
 */

import { describe, it, expect } from 'vitest';

import {
  PEDAGOGICAL_TEMPLATES,
  TEMPLATE_PPKN_NORMA,
  TEMPLATE_IPA_TATA_SURYA,
  TEMPLATE_MTK_BILANGAN_BULAT,
  templateToBlueprint,
  checkTemplateDensity,
  checkAllTemplatesDensity,
  checkTemplateObjectiveCoverage,
  checkAllTemplatesObjectiveCoverage,
  DEFAULT_TEMPLATE_DENSITY_LIMITS,
} from '../core/guided-flow/pedagogical-templates';
import { validateAiMpiJson } from '../core/ai-mpi-json';
import { checkBlueprintContentQuality } from '../core/content-quality-guard';
import { exportProjectToHtml } from '../export/export-html';
import { aiBlueprintToSimpleProject } from '../core/ai-mpi-json/aiBlueprintToSimpleProject';
import { findExternalFontReference, findForbiddenFontKeyword } from '../core/style-packs/font-edu-safety';

// ---------------------------------------------------------------------------
// SCOPE A — Scene structure
// ---------------------------------------------------------------------------

describe('TEACHER-READY-TEMPLATE-QUALITY — Scope A: scene structure', () => {
  it('1. PPKn has 17 scenes (12 golden + 5 teacher-pedagogy)', () => {
    expect(TEMPLATE_PPKN_NORMA.scenes.length).toBe(17);
  });

  it('2. IPA has 14 scenes (12 golden + teacher-guide + rubric)', () => {
    expect(TEMPLATE_IPA_TATA_SURYA.scenes.length).toBe(14);
  });

  it('3. MTK has 14 scenes (12 golden + teacher-guide + rubric)', () => {
    expect(TEMPLATE_MTK_BILANGAN_BULAT.scenes.length).toBe(14);
  });

  it('4. all 3 templates have teacher-guide scene', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const has = t.scenes.some((s) => s.sceneType === 'teacher-guide');
      expect(has, `${t.id} should have teacher-guide scene`).toBe(true);
    });
  });

  it('5. PPKn has diagnostic-check + remedial-practice + enrichment-challenge (differentiation path)', () => {
    const types = TEMPLATE_PPKN_NORMA.scenes.map((s) => s.sceneType);
    expect(types).toContain('diagnostic-check');
    expect(types).toContain('remedial-practice');
    expect(types).toContain('enrichment-challenge');
  });

  it('6. all 3 templates have rubric-panel scene', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const has = t.scenes.some((s) => s.sceneType === 'rubric-panel');
      expect(has, `${t.id} should have rubric-panel scene`).toBe(true);
    });
  });

  it('7. first scene is cover-hero, last is closing-award (golden flow preserved)', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      expect(t.scenes[0].sceneType).toBe('cover-hero');
      expect(t.scenes[t.scenes.length - 1].sceneType).toBe('closing-award');
    });
  });

  it('8. every scene has a sceneType (no gaps)', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      t.scenes.forEach((s) => {
        expect(s.sceneType, `${t.id}/${s.id} sceneType`).toBeTruthy();
      });
    });
  });
});

// ---------------------------------------------------------------------------
// SCOPE B — Game variety
// ---------------------------------------------------------------------------

describe('TEACHER-READY-TEMPLATE-QUALITY — Scope B: game variety', () => {
  it('9. IPA uses matching-game (not classification-game) for game variety', () => {
    const types = TEMPLATE_IPA_TATA_SURYA.scenes.map((s) => s.sceneType);
    expect(types).toContain('matching-game');
    expect(types).not.toContain('classification-game');
  });

  it('10. PPKn still uses classification-game', () => {
    const types = TEMPLATE_PPKN_NORMA.scenes.map((s) => s.sceneType);
    expect(types).toContain('classification-game');
  });

  it('11. MTK still uses sequencing-game', () => {
    const types = TEMPLATE_MTK_BILANGAN_BULAT.scenes.map((s) => s.sceneType);
    expect(types).toContain('sequencing-game');
  });

  it('12. IPA matching-game has correctPairs that link leftItems to rightItems', () => {
    const game = TEMPLATE_IPA_TATA_SURYA.scenes.find((s) => s.sceneType === 'matching-game');
    expect(game).toBeDefined();
    const content = game!.content as any;
    expect(content.leftItems).toBeDefined();
    expect(content.rightItems).toBeDefined();
    expect(content.correctPairs).toBeDefined();
    expect(content.leftItems.length).toBe(content.rightItems.length);
    expect(content.correctPairs.length).toBe(content.leftItems.length);
  });
});

// ---------------------------------------------------------------------------
// SCOPE C — Objective coverage
// ---------------------------------------------------------------------------

describe('TEACHER-READY-TEMPLATE-QUALITY — Scope C: objective coverage', () => {
  it('13. all 3 templates have objectiveRefs on non-cover/closing scenes', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      t.scenes.forEach((s) => {
        if (s.role === 'cover' || s.role === 'closing') return;
        expect(
          s.objectiveRefs,
          `${t.id}/${s.id} (role: ${s.role}) should have objectiveRefs`,
        ).toBeDefined();
        expect(s.objectiveRefs!.length).toBeGreaterThan(0);
      });
    });
  });

  it('14. PPKn: every objective is covered by at least 1 scene', () => {
    const issues = checkTemplateObjectiveCoverage(TEMPLATE_PPKN_NORMA);
    expect(issues, issues.map((i) => i.message).join('; ')).toHaveLength(0);
  });

  it('15. IPA: every objective is covered by at least 1 scene', () => {
    const issues = checkTemplateObjectiveCoverage(TEMPLATE_IPA_TATA_SURYA);
    expect(issues, issues.map((i) => i.message).join('; ')).toHaveLength(0);
  });

  it('16. MTK: every objective is covered by at least 1 scene', () => {
    const issues = checkTemplateObjectiveCoverage(TEMPLATE_MTK_BILANGAN_BULAT);
    expect(issues, issues.map((i) => i.message).join('; ')).toHaveLength(0);
  });

  it('17. checkAllTemplatesObjectiveCoverage returns 0 issues', () => {
    const issues = checkAllTemplatesObjectiveCoverage();
    expect(issues, issues.map((i) => i.message).join('; ')).toHaveLength(0);
  });

  it('18. checkTemplateObjectiveCoverage catches missing objective coverage', () => {
    // Clone PPKn and remove objectiveRefs from one scene
    const bad = {
      ...TEMPLATE_PPKN_NORMA,
      objectives: [
        ...TEMPLATE_PPKN_NORMA.objectives,
        { id: 'obj-4', text: 'Objective yang tidak dicover.' },
      ],
    };
    const issues = checkTemplateObjectiveCoverage(bad);
    expect(issues.length).toBeGreaterThan(0);
    const uncovered = issues.find((i) => i.field === 'objectives[obj-4]');
    expect(uncovered).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// SCOPE D — Density guard for new content kinds
// ---------------------------------------------------------------------------

describe('TEACHER-READY-TEMPLATE-QUALITY — Scope D: density guard', () => {
  it('19. checkAllTemplatesDensity returns 0 issues (all templates fit 16:9)', () => {
    const issues = checkAllTemplatesDensity();
    expect(issues, issues.map((i) => `${i.templateId}/${i.sceneId} ${i.field}: ${i.message}`).join('\n')).toHaveLength(0);
  });

  it('20. teacher-guide density: teacherInstruction <= 300, facilitationTips max 4', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const tg = t.scenes.find((s) => s.sceneType === 'teacher-guide');
      if (!tg) return;
      const c = tg.content as any;
      if (c.teacherInstruction) {
        expect(c.teacherInstruction.length, `${t.id} teacherInstruction`).toBeLessThanOrEqual(DEFAULT_TEMPLATE_DENSITY_LIMITS.teacherInstructionMax);
      }
      if (Array.isArray(c.facilitationTips)) {
        expect(c.facilitationTips.length, `${t.id} facilitationTips count`).toBeLessThanOrEqual(DEFAULT_TEMPLATE_DENSITY_LIMITS.facilitationTipsMax);
      }
    });
  });

  it('21. rubric-panel density: criteria max 4, levels max 4', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const rp = t.scenes.find((s) => s.sceneType === 'rubric-panel');
      if (!rp) return;
      const c = rp.content as any;
      if (Array.isArray(c.criteria)) {
        expect(c.criteria.length).toBeLessThanOrEqual(DEFAULT_TEMPLATE_DENSITY_LIMITS.rubricCriteriaMax);
      }
      if (Array.isArray(c.levels)) {
        expect(c.levels.length).toBeLessThanOrEqual(DEFAULT_TEMPLATE_DENSITY_LIMITS.rubricLevelsMax);
      }
    });
  });

  it('22. diagnostic-check density: questionSet max 4, prompt <= 120 (PPKn only)', () => {
    const dc = TEMPLATE_PPKN_NORMA.scenes.find((s) => s.sceneType === 'diagnostic-check');
    if (dc) {
      const c = dc.content as any;
      if (Array.isArray(c.questionSet)) {
        expect(c.questionSet.length).toBeLessThanOrEqual(DEFAULT_TEMPLATE_DENSITY_LIMITS.diagnosticQuestionsMax);
        c.questionSet.forEach((q: any, i: number) => {
          expect(String(q.prompt).length, `questionSet[${i}].prompt`).toBeLessThanOrEqual(DEFAULT_TEMPLATE_DENSITY_LIMITS.diagnosticQuestionPromptMax);
        });
      }
    }
  });

  it('23. remedial-practice density: guidedPractice max 3, reteachExplanation <= 300 (PPKn only)', () => {
    const rp = TEMPLATE_PPKN_NORMA.scenes.find((s) => s.sceneType === 'remedial-practice');
    if (rp) {
      const c = rp.content as any;
      if (c.reteachExplanation) {
        expect(c.reteachExplanation.length).toBeLessThanOrEqual(DEFAULT_TEMPLATE_DENSITY_LIMITS.remedialReteachMax);
      }
      if (Array.isArray(c.guidedPractice)) {
        expect(c.guidedPractice.length).toBeLessThanOrEqual(DEFAULT_TEMPLATE_DENSITY_LIMITS.remedialPracticeMax);
      }
    }
  });

  it('24. enrichment-challenge density: rubricPreview max 3, advancedTask <= 200 (PPKn only)', () => {
    const ec = TEMPLATE_PPKN_NORMA.scenes.find((s) => s.sceneType === 'enrichment-challenge');
    if (ec) {
      const c = ec.content as any;
      if (c.advancedTask) {
        expect(c.advancedTask.length).toBeLessThanOrEqual(DEFAULT_TEMPLATE_DENSITY_LIMITS.enrichmentTaskMax);
      }
      if (Array.isArray(c.rubricPreview)) {
        expect(c.rubricPreview.length).toBeLessThanOrEqual(DEFAULT_TEMPLATE_DENSITY_LIMITS.enrichmentRubricPreviewMax);
      }
    }
  });

  it('25. matching-game density: leftItems max 6, label <= 40 (IPA only)', () => {
    const mg = TEMPLATE_IPA_TATA_SURYA.scenes.find((s) => s.sceneType === 'matching-game');
    if (mg) {
      const c = mg.content as any;
      if (Array.isArray(c.leftItems)) {
        expect(c.leftItems.length).toBeLessThanOrEqual(DEFAULT_TEMPLATE_DENSITY_LIMITS.matchingItemsMax);
        c.leftItems.forEach((it: any, i: number) => {
          expect(String(it.label).length, `leftItems[${i}].label`).toBeLessThanOrEqual(DEFAULT_TEMPLATE_DENSITY_LIMITS.matchingItemLabelMax);
        });
      }
    }
  });

  it('26. checkTemplateDensity catches violations in a bad template', () => {
    // Clone PPKn and bloat the teacherInstruction
    const bad = {
      ...TEMPLATE_PPKN_NORMA,
      scenes: TEMPLATE_PPKN_NORMA.scenes.map((s) => {
        if (s.sceneType === 'teacher-guide') {
          return {
            ...s,
            content: {
              ...s.content,
              kind: 'teacher-guide',
              teacherInstruction: 'X'.repeat(DEFAULT_TEMPLATE_DENSITY_LIMITS.teacherInstructionMax + 50),
            } as any,
          };
        }
        return s;
      }),
    };
    const issues = checkTemplateDensity(bad);
    expect(issues.length).toBeGreaterThan(0);
    const tiIssue = issues.find((i) => i.field === 'teacherInstruction');
    expect(tiIssue).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// SCOPE E — Content quality + validator
// ---------------------------------------------------------------------------

describe('TEACHER-READY-TEMPLATE-QUALITY — Scope E: content quality', () => {
  it('27. all 3 templates pass checkBlueprintContentQuality (0 errors)', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const bp = templateToBlueprint(t);
      const result = checkBlueprintContentQuality(bp);
      expect(result.errors, `${t.id}: ${result.errors.map((e) => e.message).join('; ')}`).toHaveLength(0);
    });
  });

  it('28. all 3 templates pass validateAiMpiJson (0 errors)', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const bp = templateToBlueprint(t);
      const errors = validateAiMpiJson(bp);
      expect(errors, `${t.id}: ${errors.map((e) => e.message).join('; ')}`).toHaveLength(0);
    });
  });

  it('29. all 3 templates produce SimpleProject with sceneType on every page', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const bp = templateToBlueprint(t);
      const project = aiBlueprintToSimpleProject(bp);
      expect(project.pages.length).toBe(t.scenes.length);
      project.pages.forEach((p, i) => {
        expect(p.sceneType, `${t.id} page[${i}] sceneType`).toBeDefined();
      });
    });
  });

  it('30. PPKn remedial-practice has non-empty reteachExplanation', () => {
    const rp = TEMPLATE_PPKN_NORMA.scenes.find((s) => s.sceneType === 'remedial-practice');
    const c = rp!.content as any;
    expect(c.reteachExplanation).toBeTruthy();
    expect(c.reteachExplanation.length).toBeGreaterThan(20);
  });

  it('31. PPKn diagnostic-check has questionSet with >= 2 questions', () => {
    const dc = TEMPLATE_PPKN_NORMA.scenes.find((s) => s.sceneType === 'diagnostic-check');
    const c = dc!.content as any;
    expect(Array.isArray(c.questionSet)).toBe(true);
    expect(c.questionSet.length).toBeGreaterThanOrEqual(2);
  });

  it('32. all rubric-panel scenes have >= 3 criteria and >= 3 levels', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const rp = t.scenes.find((s) => s.sceneType === 'rubric-panel');
      const c = rp!.content as any;
      expect(c.criteria.length).toBeGreaterThanOrEqual(3);
      expect(c.levels.length).toBeGreaterThanOrEqual(3);
    });
  });
});

// ---------------------------------------------------------------------------
// SCOPE F — Export parity
// ---------------------------------------------------------------------------

describe('TEACHER-READY-TEMPLATE-QUALITY — Scope F: export parity', () => {
  it('33. all 3 templates export as standalone HTML', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const bp = templateToBlueprint(t);
      const project = aiBlueprintToSimpleProject(bp);
      const html = exportProjectToHtml(project);
      expect(typeof html).toBe('string');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
      expect(html).not.toMatch(/<script[^>]+src="https?:/);
    });
  });

  it('34. export HTML contains teacher-guide rendered content (Panduan Guru)', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const bp = templateToBlueprint(t);
      const project = aiBlueprintToSimpleProject(bp);
      const html = exportProjectToHtml(project);
      // The teacher-guide title should appear in the rendered HTML
      const tg = t.scenes.find((s) => s.sceneType === 'teacher-guide');
      if (tg) {
        const c = tg.content as any;
        if (c.title) {
          expect(html, `${t.id} export should contain teacher-guide title`).toContain(c.title);
        }
      }
    });
  });

  it('35. export HTML contains rubric-panel rendered content (Rubrik Penilaian)', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const bp = templateToBlueprint(t);
      const project = aiBlueprintToSimpleProject(bp);
      const html = exportProjectToHtml(project);
      const rp = t.scenes.find((s) => s.sceneType === 'rubric-panel');
      if (rp) {
        expect(html, `${t.id} export should contain rubric title`).toContain(rp.title);
      }
    });
  });

  it('36. export HTML contains matching-game rendered content (IPA)', () => {
    const bp = templateToBlueprint(TEMPLATE_IPA_TATA_SURYA);
    const project = aiBlueprintToSimpleProject(bp);
    const html = exportProjectToHtml(project);
    // The matching-game instruction should appear
    const mg = TEMPLATE_IPA_TATA_SURYA.scenes.find((s) => s.sceneType === 'matching-game');
    const c = mg!.content as any;
    expect(html).toContain(c.instruction);
  });
});

// ---------------------------------------------------------------------------
// SCOPE G — Font safety regression
// ---------------------------------------------------------------------------

describe('TEACHER-READY-TEMPLATE-QUALITY — Scope G: font safety', () => {
  it('37. no template content declares a fontFamily field with forbidden fonts', () => {
    // Font safety guard applies to font-family declarations, not arbitrary
    // content text. Template content (AiBlueprintSlotContent) should NOT
    // declare fontFamily at all — fonts come from the design contract.
    // This test verifies no content has a fontFamily field; if one did,
    // it would be checked for forbidden keywords.
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      t.scenes.forEach((s) => {
        const content = s.content as Record<string, unknown>;
        // Check if content has any font-related field
        if (content && typeof content === 'object' && 'fontFamily' in content) {
          const ff = content.fontFamily;
          const forbidden = findForbiddenFontKeyword(ff);
          expect(forbidden, `${t.id}/${s.id} content.fontFamily has forbidden: ${forbidden}`).toBeNull();
        }
        // Also check nested fields that might contain font declarations
        const contentStr = JSON.stringify(s.content);
        // Only flag if there's an actual font-family CSS declaration in the content
        // (not just the word "script" appearing in Indonesian text like "deskripsi")
        const fontFamilyDecl = contentStr.match(/font-family\s*:/i);
        if (fontFamilyDecl) {
          const forbidden = findForbiddenFontKeyword(contentStr);
          expect(forbidden, `${t.id}/${s.id} has font-family declaration with forbidden: ${forbidden}`).toBeNull();
        }
      });
    });
  });

  it('38. export HTML for all 3 templates has no external font references', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const bp = templateToBlueprint(t);
      const project = aiBlueprintToSimpleProject(bp);
      const html = exportProjectToHtml(project);
      const ext = findExternalFontReference(html);
      expect(ext, `${t.id} export HTML has external font: ${ext}`).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// SCOPE H — Pedagogical content depth (teacher-ready quality)
// ---------------------------------------------------------------------------

describe('TEACHER-READY-TEMPLATE-QUALITY — Scope H: pedagogical depth', () => {
  it('39. every teacher-guide has facilitationTips with >= 2 tips', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const tg = t.scenes.find((s) => s.sceneType === 'teacher-guide');
      const c = tg!.content as any;
      expect(Array.isArray(c.facilitationTips)).toBe(true);
      expect(c.facilitationTips.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('40. every teacher-guide has timeAllocation', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const tg = t.scenes.find((s) => s.sceneType === 'teacher-guide');
      const c = tg!.content as any;
      expect(c.timeAllocation).toBeTruthy();
    });
  });

  it('41. every teacher-guide has assessmentNotes', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const tg = t.scenes.find((s) => s.sceneType === 'teacher-guide');
      const c = tg!.content as any;
      expect(c.assessmentNotes).toBeTruthy();
    });
  });

  it('42. PPKn diagnostic-check has readinessLevels', () => {
    const dc = TEMPLATE_PPKN_NORMA.scenes.find((s) => s.sceneType === 'diagnostic-check');
    const c = dc!.content as any;
    expect(Array.isArray(c.readinessLevels)).toBe(true);
    expect(c.readinessLevels.length).toBeGreaterThanOrEqual(2);
  });

  it('43. PPKn remedial-practice has guidedPractice with >= 1 practice items', () => {
    const rp = TEMPLATE_PPKN_NORMA.scenes.find((s) => s.sceneType === 'remedial-practice');
    const c = rp!.content as any;
    expect(Array.isArray(c.guidedPractice)).toBe(true);
    expect(c.guidedPractice.length).toBeGreaterThanOrEqual(1);
    c.guidedPractice.forEach((gp: any) => {
      expect(gp.prompt).toBeTruthy();
      expect(Array.isArray(gp.choices)).toBe(true);
      expect(gp.correctChoiceId).toBeTruthy();
    });
  });

  it('44. PPKn enrichment-challenge has rubricPreview with >= 2 criteria', () => {
    const ec = TEMPLATE_PPKN_NORMA.scenes.find((s) => s.sceneType === 'enrichment-challenge');
    const c = ec!.content as any;
    expect(Array.isArray(c.rubricPreview)).toBe(true);
    expect(c.rubricPreview.length).toBeGreaterThanOrEqual(2);
  });

  it('45. all rubric-panel levels have score in ascending order', () => {
    PEDAGOGICAL_TEMPLATES.forEach((t) => {
      const rp = t.scenes.find((s) => s.sceneType === 'rubric-panel');
      const c = rp!.content as any;
      const scores = c.levels.map((l: any) => l.score);
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i], `${t.id} rubric level ${i} score should be > previous`).toBeGreaterThan(scores[i - 1]);
      }
    });
  });
});
