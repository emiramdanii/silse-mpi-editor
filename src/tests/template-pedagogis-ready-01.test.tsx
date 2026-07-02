/**
 * TEMPLATE-PEDAGOGIS-READY-01 — Tests.
 */

import { describe, it, expect } from 'vitest';

import { PEDAGOGICAL_TEMPLATES, templateToBlueprint, getTemplatesByMapel, getUniqueTemplateMapelList } from '../core/guided-flow/pedagogical-templates';
import { normalizeBlueprint, aiJsonToMpiContainer, aiBlueprintToSimpleProject, validateAiMpiJson } from '../core/ai-mpi-json';
import { checkBlueprintContentQuality } from '../core/content-quality-guard';
import { renderScenePlan } from '../core/scene-renderer';
import { getDesignContract } from '../core/mpi-design-contract';
import { exportProjectToHtml } from '../export/export-html';

const contract = getDesignContract('golden-reference');

describe('TEMPLATE-PEDAGOGIS-READY-01 — Template Registry', () => {
  it('1. 3 templates registered', () => {
    expect(PEDAGOGICAL_TEMPLATES).toHaveLength(3);
  });

  it('2. getTemplatesByMapel returns correct templates', () => {
    expect(getTemplatesByMapel('PPKn')).toHaveLength(1);
    expect(getTemplatesByMapel('IPA')).toHaveLength(1);
    expect(getTemplatesByMapel('Matematika')).toHaveLength(1);
  });

  it('3. getUniqueTemplateMapelList returns 3 mapel', () => {
    const mapel = getUniqueTemplateMapelList();
    expect(mapel).toContain('PPKn');
    expect(mapel).toContain('IPA');
    expect(mapel).toContain('Matematika');
    expect(mapel).toHaveLength(3);
  });
});

describe('TEMPLATE-PEDAGOGIS-READY-01 — Blueprint Generation', () => {
  it('4. templateToBlueprint produces valid blueprint', () => {
    const template = PEDAGOGICAL_TEMPLATES[0];
    const bp = templateToBlueprint(template);
    const errors = validateAiMpiJson(bp);
    expect(errors, errors.map((e) => `${e.path}: ${e.message}`).join('; ')).toHaveLength(0);
  });

  it('5. all 3 templates produce valid blueprints', () => {
    PEDAGOGICAL_TEMPLATES.forEach((template) => {
      const bp = templateToBlueprint(template);
      const errors = validateAiMpiJson(bp);
      expect(errors, `${template.id}: ${errors.map((e) => e.message).join('; ')}`).toHaveLength(0);
    });
  });

  it('6. blueprint has 12 scenes', () => {
    const bp = templateToBlueprint(PEDAGOGICAL_TEMPLATES[0]);
    expect(bp.scenes).toHaveLength(12);
  });

  it('7. blueprint preserves curriculum metadata', () => {
    const template = PEDAGOGICAL_TEMPLATES[0];
    const bp = templateToBlueprint(template);
    expect(bp.curriculum?.subject).toBe(template.mapel);
    expect(bp.curriculum?.topic).toBe(template.topic);
    expect(bp.metadata.title).toBe(template.topic);
  });
});

describe('TEMPLATE-PEDAGOGIS-READY-01 — Content Quality', () => {
  it('8. all 3 templates pass content quality check', () => {
    PEDAGOGICAL_TEMPLATES.forEach((template) => {
      const bp = templateToBlueprint(template);
      const result = checkBlueprintContentQuality(bp);
      expect(result.errors, `${template.id}: ${result.errors.map((e) => e.message).join('; ')}`).toHaveLength(0);
    });
  });
});

describe('TEMPLATE-PEDAGOGIS-READY-01 — Render + Export', () => {
  it('9. template project renders all 12 scenes', () => {
    PEDAGOGICAL_TEMPLATES.forEach((template) => {
      const bp = templateToBlueprint(template);
      const normalized = normalizeBlueprint(bp);
      const container = aiJsonToMpiContainer(normalized);
      expect(container.scenes).toHaveLength(12);
      container.scenes.forEach((scene) => {
        const plan = renderScenePlan(scene, contract);
        expect(plan.sceneClass).toContain('silse-scene');
      });
    });
  });

  it('10. template project exports to HTML', () => {
    PEDAGOGICAL_TEMPLATES.forEach((template) => {
      const bp = templateToBlueprint(template);
      const project = aiBlueprintToSimpleProject(bp);
      const html = exportProjectToHtml(project);
      expect(html).toContain('<!doctype html>');
      expect(html).toContain('wireInteractions');
      expect(html.length).toBeGreaterThan(1000);
    });
  });

  it('11. template project via bridge produces 12 pages', () => {
    PEDAGOGICAL_TEMPLATES.forEach((template) => {
      const bp = templateToBlueprint(template);
      const project = aiBlueprintToSimpleProject(bp);
      expect(project.pages).toHaveLength(12);
      // All pages should have sceneType
      project.pages.forEach((page) => {
        expect(page.sceneType, `${template.id} page ${page.id}`).toBeDefined();
      });
    });
  });
});

describe('TEMPLATE-PEDAGOGIS-READY-01 — Pedagogical Flow', () => {
  it('12. first scene is cover-hero, last is closing-award', () => {
    PEDAGOGICAL_TEMPLATES.forEach((template) => {
      const bp = templateToBlueprint(template);
      expect(bp.scenes[0].sceneType).toBe('cover-hero');
      expect(bp.scenes[bp.scenes.length - 1].sceneType).toBe('closing-award');
    });
  });

  it('13. templates have material + activity + quiz + reflection', () => {
    PEDAGOGICAL_TEMPLATES.forEach((template) => {
      const bp = templateToBlueprint(template);
      const roles = bp.scenes.map((s) => s.role);
      expect(roles).toContain('material');
      expect(roles).toContain('activity');
      expect(roles).toContain('quiz');
      expect(roles).toContain('reflection');
    });
  });
});
