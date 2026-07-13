/**
 * Learning Experience Contract (LXC-01) — guard tests.
 *
 * Layer: tests
 *
 * Kontrak (LXC-01):
 *   Test ini memvalidasi STRUKTUR kontrak 10 komponen resmi baru.
 *   TIDAK menguji implementasi runtime (belum ada). Hanya memastikan:
 *     - 10 komponen terdefinisi dengan ID unik
 *     - Setiap komponen punya 7 field wajib (learningPurpose, applicableRoles,
 *       variants, dataModel, editorRules, previewExportRules, constraints)
 *     - Tidak ada komponen liar (ID di luar daftar resmi)
 *     - Aturan previewEqualsExport = true untuk SEMUA komponen
 *     - Komponen auto-managed (HUD, efek) tidak bisa allowManualAdd
 *     - Reserved runtime fields terdefinisi
 *     - Helper functions bekerja
 *   Plus: kontrak docs ada dan menyebut prinsip utama.
 */

import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import {
  LEARNING_EXPERIENCE_COMPONENTS,
  getComponentSpec,
  getComponentsForRole,
  getOfficialComponentIds,
  getAutoManagedComponents,
  getScoringComponents,
  getProgressComponents,
  getAppreciationTriggerComponents,
} from './fixtures/learning-experience-contract';
import type { PageRole } from '../core/types';

const REPO_ROOT = resolve(__dirname, '../..');
const DOCS_DIR = join(REPO_ROOT, 'docs');

// =========================================================================
// Struktur kontrak — 10 komponen
// =========================================================================

describe('LXC-01 — Contract structure: 10 components defined', () => {
  it('has exactly 10 official learning experience components', () => {
    expect(LEARNING_EXPERIENCE_COMPONENTS).toHaveLength(10);
  });

  it('all 10 expected component IDs are present', () => {
    const expectedIds = [
      'layered-info',
      'learning-menu',
      'interactive-starter',
      'interactive-activity',
      'interactive-quiz',
      'interactive-reflection',
      'results-appreciation',
      'learning-bridge',
      'learning-indicator',
      'appreciation-effect',
    ];
    const actualIds = LEARNING_EXPERIENCE_COMPONENTS.map((c) => c.id);
    expect(actualIds.sort()).toEqual(expectedIds.sort());
  });

  it('all component IDs are unique', () => {
    const ids = LEARNING_EXPERIENCE_COMPONENTS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all component IDs are snake-case', () => {
    for (const c of LEARNING_EXPERIENCE_COMPONENTS) {
      expect(c.id).toMatch(/^[a-z0-9-]+$/);
    }
  });
});

// =========================================================================
// 7 field wajib per komponen
// =========================================================================

describe('LXC-01 — Each component has 7 required fields', () => {
  for (const comp of LEARNING_EXPERIENCE_COMPONENTS) {
    describe(`component: ${comp.id}`, () => {
      it('has name (non-empty)', () => {
        expect(comp.name.length).toBeGreaterThan(0);
      });

      it('has icon (non-empty emoji)', () => {
        expect(comp.icon.length).toBeGreaterThan(0);
      });

      it('has learningPurpose (pedagogis, > 20 chars)', () => {
        expect(comp.learningPurpose.length).toBeGreaterThan(20);
      });

      it('has applicableRoles (at least 1 role)', () => {
        expect(comp.applicableRoles.length).toBeGreaterThan(0);
      });

      it('applicableRoles only contains valid PageRole values', () => {
        const validRoles: PageRole[] = [
          'cover', 'guide', 'menu', 'learningObjectives', 'starter',
          'material', 'activity', 'quiz', 'reflection', 'closing', 'free',
        ];
        for (const role of comp.applicableRoles) {
          expect(validRoles).toContain(role);
        }
      });

      it('has variants (at least 1)', () => {
        expect(comp.variants.length).toBeGreaterThan(0);
      });

      it('each variant has id, label, description', () => {
        for (const v of comp.variants) {
          expect(v.id.length).toBeGreaterThan(0);
          expect(v.label.length).toBeGreaterThan(0);
          expect(v.description.length).toBeGreaterThan(0);
        }
      });

      it('variant IDs are unique within component', () => {
        const ids = comp.variants.map((v) => v.id);
        expect(new Set(ids).size).toBe(ids.length);
      });

      it('has dataModel with typeName + fields', () => {
        expect(comp.dataModel.typeName.length).toBeGreaterThan(0);
        expect(comp.dataModel.fields.length).toBeGreaterThan(0);
      });

      it('each dataModel field has name, type, required, description', () => {
        for (const f of comp.dataModel.fields) {
          expect(f.name.length).toBeGreaterThan(0);
          expect(f.type.length).toBeGreaterThan(0);
          expect(typeof f.required).toBe('boolean');
          expect(f.description.length).toBeGreaterThan(0);
        }
      });

      it('has editorRules with all sub-fields', () => {
        expect(typeof comp.editorRules.allowManualAdd).toBe('boolean');
        expect(typeof comp.editorRules.inlineEditAllowed).toBe('boolean');
        expect(comp.editorRules.inspectorSections.length).toBeGreaterThan(0);
        expect(typeof comp.editorRules.draggable).toBe('boolean');
        expect(typeof comp.editorRules.deletable).toBe('boolean');
      });

      it('has previewExportRules with all sub-fields', () => {
        expect(typeof comp.previewExportRules.hasRuntimeState).toBe('boolean');
        expect(typeof comp.previewExportRules.contributesToScore).toBe('boolean');
        expect(typeof comp.previewExportRules.contributesToProgress).toBe('boolean');
        expect(typeof comp.previewExportRules.triggersAppreciation).toBe('boolean');
        expect(typeof comp.previewExportRules.previewEqualsExport).toBe('boolean');
      });

      it('has constraints with all sub-fields', () => {
        expect(typeof comp.constraints.maxInstancesPerPage).toBe('number');
        expect(typeof comp.constraints.allowedOnGuidedPages).toBe('boolean');
        expect(Array.isArray(comp.constraints.reservedRuntimeFields)).toBe(true);
      });
    });
  }
});

// =========================================================================
// Aturan kontrak — previewEqualsExport, manual vs auto-managed, dll.
// =========================================================================

describe('LXC-01 — Contract rules', () => {
  it('ALL components have previewEqualsExport = true', () => {
    for (const c of LEARNING_EXPERIENCE_COMPONENTS) {
      expect(
        c.previewExportRules.previewEqualsExport,
        `${c.id} must have previewEqualsExport=true`,
      ).toBe(true);
    }
  });

  it('auto-managed components (HUD, efek) have allowManualAdd = false', () => {
    const autoManaged = getAutoManagedComponents();
    expect(autoManaged.length).toBe(2);
    for (const c of autoManaged) {
      expect(c.editorRules.allowManualAdd, `${c.id} must not allow manual add`).toBe(false);
      expect(c.editorRules.draggable, `${c.id} must not be draggable`).toBe(false);
      expect(c.editorRules.deletable, `${c.id} must not be deletable`).toBe(false);
    }
  });

  it('manual components have allowManualAdd = true', () => {
    const manual = LEARNING_EXPERIENCE_COMPONENTS.filter((c) => c.editorRules.allowManualAdd);
    // 10 total - 2 auto-managed = 8 manual
    expect(manual.length).toBe(8);
    for (const c of manual) {
      expect(c.editorRules.draggable, `${c.id} must be draggable`).toBe(true);
      expect(c.editorRules.deletable, `${c.id} must be deletable`).toBe(true);
    }
  });

  it('scoring components are exactly: interactive-activity, interactive-quiz', () => {
    const scoring = getScoringComponents();
    const ids = scoring.map((c) => c.id).sort();
    expect(ids).toEqual(['interactive-activity', 'interactive-quiz']);
  });

  it('progress components include learning-menu, interactive-starter, interactive-activity, interactive-quiz, interactive-reflection, learning-bridge', () => {
    const progress = getProgressComponents();
    const ids = progress.map((c) => c.id);
    expect(ids).toContain('learning-menu');
    expect(ids).toContain('interactive-starter');
    expect(ids).toContain('interactive-activity');
    expect(ids).toContain('interactive-quiz');
    expect(ids).toContain('interactive-reflection');
    expect(ids).toContain('learning-bridge');
  });

  it('appreciation trigger components include interactive-activity, interactive-quiz, results-appreciation, appreciation-effect', () => {
    const triggers = getAppreciationTriggerComponents();
    const ids = triggers.map((c) => c.id);
    expect(ids).toContain('interactive-activity');
    expect(ids).toContain('interactive-quiz');
    expect(ids).toContain('results-appreciation');
    expect(ids).toContain('appreciation-effect');
  });

  it('learning-indicator applicable to ALL roles (cover..closing)', () => {
    const indicator = getComponentSpec('learning-indicator')!;
    const allRoles: PageRole[] = [
      'cover', 'guide', 'menu', 'learningObjectives', 'starter',
      'material', 'activity', 'quiz', 'reflection', 'closing',
    ];
    for (const role of allRoles) {
      expect(indicator.applicableRoles, `indicator must apply to ${role}`).toContain(role);
    }
  });

  it('appreciation-effect applicable to ALL roles', () => {
    const effect = getComponentSpec('appreciation-effect')!;
    const allRoles: PageRole[] = [
      'cover', 'guide', 'menu', 'learningObjectives', 'starter',
      'material', 'activity', 'quiz', 'reflection', 'closing',
    ];
    for (const role of allRoles) {
      expect(effect.applicableRoles, `effect must apply to ${role}`).toContain(role);
    }
  });

  it('interactive-activity requires navigation companion', () => {
    const activity = getComponentSpec('interactive-activity')!;
    expect(activity.constraints.requiresCompanion).toContain('navigation');
  });

  it('interactive-quiz requires navigation companion', () => {
    const quiz = getComponentSpec('interactive-quiz')!;
    expect(quiz.constraints.requiresCompanion).toContain('navigation');
  });

  it('components with maxInstancesPerPage = 1 are limited to 1', () => {
    const singleInstance = LEARNING_EXPERIENCE_COMPONENTS.filter(
      (c) => c.constraints.maxInstancesPerPage === 1,
    );
    // Most components are max 1 per page (only layered-info is 3)
    expect(singleInstance.length).toBe(9);
  });

  it('layered-info has maxInstancesPerPage = 3', () => {
    const layered = getComponentSpec('layered-info')!;
    expect(layered.constraints.maxInstancesPerPage).toBe(3);
  });

  it('auto-managed components have reservedRuntimeFields', () => {
    const indicator = getComponentSpec('learning-indicator')!;
    const effect = getComponentSpec('appreciation-effect')!;
    expect(indicator.constraints.reservedRuntimeFields.length).toBeGreaterThan(0);
    expect(effect.constraints.reservedRuntimeFields.length).toBeGreaterThan(0);
  });
});

// =========================================================================
// Helper functions
// =========================================================================

describe('LXC-01 — Helper functions', () => {
  it('getComponentSpec returns spec by id, or undefined', () => {
    expect(getComponentSpec('layered-info')).toBeDefined();
    expect(getComponentSpec('non-existent')).toBeUndefined();
  });

  it('getComponentsForRole returns components applicable to a role', () => {
    const materialComponents = getComponentsForRole('material');
    const ids = materialComponents.map((c) => c.id);
    expect(ids).toContain('layered-info');
    expect(ids).toContain('learning-bridge');
    // material doesn't have learning-menu (only menu, guide)
    expect(ids).not.toContain('learning-menu');
  });

  it('getOfficialComponentIds returns all 10 IDs', () => {
    const ids = getOfficialComponentIds();
    expect(ids).toHaveLength(10);
  });

  it('getAutoManagedComponents returns HUD + efek', () => {
    const auto = getAutoManagedComponents();
    const ids = auto.map((c) => c.id).sort();
    expect(ids).toEqual(['appreciation-effect', 'learning-indicator']);
  });

  it('getScoringComponents returns 2 components', () => {
    expect(getScoringComponents()).toHaveLength(2);
  });
});

// =========================================================================
// No rogue components — guard
// =========================================================================

describe('LXC-01 — No rogue components', () => {
  it('no component has ID outside the official list', () => {
    const officialIds = new Set(getOfficialComponentIds());
    for (const c of LEARNING_EXPERIENCE_COMPONENTS) {
      expect(officialIds.has(c.id), `${c.id} is in official list`).toBe(true);
    }
  });

  it('no component has empty variants array', () => {
    for (const c of LEARNING_EXPERIENCE_COMPONENTS) {
      expect(c.variants.length, `${c.id} must have variants`).toBeGreaterThan(0);
    }
  });

  it('no component has empty dataModel fields array', () => {
    for (const c of LEARNING_EXPERIENCE_COMPONENTS) {
      expect(c.dataModel.fields.length, `${c.id} must have dataModel fields`).toBeGreaterThan(0);
    }
  });

  it('no component has empty inspectorSections array', () => {
    for (const c of LEARNING_EXPERIENCE_COMPONENTS) {
      expect(c.editorRules.inspectorSections.length, `${c.id} must have inspectorSections`).toBeGreaterThan(0);
    }
  });
});

// =========================================================================
// Contract docs exists + mentions key principles
// =========================================================================

describe('LXC-01 — Contract documentation', () => {
  it('docs/LEARNING_EXPERIENCE_CONTRACT.md exists', () => {
    const path = join(DOCS_DIR, 'LEARNING_EXPERIENCE_CONTRACT.md');
    expect(existsSync(path)).toBe(true);
  });

  it('contract docs is non-trivial (> 1000 chars)', () => {
    const path = join(DOCS_DIR, 'LEARNING_EXPERIENCE_CONTRACT.md');
    const content = readFileSync(path, 'utf8');
    expect(content.length).toBeGreaterThan(1000);
  });

  it('contract docs mentions key principles', () => {
    const path = join(DOCS_DIR, 'LEARNING_EXPERIENCE_CONTRACT.md');
    const content = readFileSync(path, 'utf8');
    // Prinsip utama
    expect(content).toMatch(/Guru memilih pola belajar/i);
    expect(content).toMatch(/Preview = Export/i);
    expect(content).toMatch(/progress bar|score badge|confetti/i);
    // 10 komponen
    expect(content).toMatch(/Info Berlapis/i);
    expect(content).toMatch(/Menu Belajar/i);
    expect(content).toMatch(/Pemantik Interaktif/i);
    expect(content).toMatch(/Aktivitas Interaktif/i);
    expect(content).toMatch(/Kuis Interaktif/i);
    expect(content).toMatch(/Refleksi Interaktif/i);
    expect(content).toMatch(/Hasil & Apresiasi/i);
    expect(content).toMatch(/Jembatan Belajar/i);
    expect(content).toMatch(/Indikator Belajar/i);
    expect(content).toMatch(/Efek Apresiasi/i);
  });

  it('contract docs mentions auto-managed vs manual distinction', () => {
    const path = join(DOCS_DIR, 'LEARNING_EXPERIENCE_CONTRACT.md');
    const content = readFileSync(path, 'utf8');
    expect(content).toMatch(/auto-managed/i);
    expect(content).toMatch(/Allow manual add/i);
  });

  it('contract docs mentions reserved runtime fields', () => {
    const path = join(DOCS_DIR, 'LEARNING_EXPERIENCE_CONTRACT.md');
    const content = readFileSync(path, 'utf8');
    expect(content).toMatch(/reservedRuntimeFields/i);
  });
});

// =========================================================================
// Contract is pure spec — no runtime leak
// =========================================================================

describe('LXC-01 — Contract file is pure spec (no runtime leak)', () => {
  it('learning-experience-contract.ts does NOT import runtime modules', () => {
    const path = resolve(__dirname, './fixtures/learning-experience-contract.ts');
    const content = readFileSync(path, 'utf8');
    // Allowed: type-only imports from ./types
    // Forbidden: factory, store, react, etc.
    expect(content).not.toMatch(/from ['"]\.\.\/component-factory['"]/);
    expect(content).not.toMatch(/from ['"]react['"]/);
    expect(content).not.toMatch(/from ['"]\.\.\/store/);
    expect(content).not.toMatch(/createComponent\(/);
    expect(content).not.toMatch(/createElement\(/);
  });

  it('LXC-02 added layered-info to COMPONENT_TYPES (now 7 types)', () => {
    const path = resolve(__dirname, '../core/types.ts');
    const content = readFileSync(path, 'utf8');
    // LXC-02: layered-info is now an official component type.
    // Original 6 + layered-info = 7.
    // V2-PILAR-2: +hotspot-overlay +input-field = 10 total.
    const match = content.match(/export const COMPONENT_TYPES = \[([^\]]+)\]/);
    expect(match).not.toBeNull();
    const types = match![1].split(',').map((t) => t.trim().replace(/['"]/g, '')).filter(Boolean);
    expect(types).toEqual(['text', 'image', 'card', 'navigation', 'question', 'game', 'layered-info', 'learning-bridge', 'hotspot-overlay', 'input-field']);
  });
});

// =========================================================================
// LXC-01 Patch-1 — Contract Alignment
// =========================================================================

describe('LXC-01 Patch-1 — Contract Alignment (layered-info, interactive-starter, learning-bridge)', () => {

  // ----- layered-info: applicable to learningObjectives + richer variants -----

  describe('layered-info (Patch-1 alignment)', () => {
    it('applicable to learningObjectives (Patch-1: sebelumnya/hari ini/berikutnya)', () => {
      const layered = getComponentSpec('layered-info')!;
      expect(layered.applicableRoles).toContain('learningObjectives');
    });

    it('still applicable to material, guide, menu (original roles preserved)', () => {
      const layered = getComponentSpec('layered-info')!;
      expect(layered.applicableRoles).toContain('material');
      expect(layered.applicableRoles).toContain('guide');
      expect(layered.applicableRoles).toContain('menu');
    });

    it('has accordion + tabs + iconTabs + stepper + cardGrid + timeline variants', () => {
      const layered = getComponentSpec('layered-info')!;
      const variantIds = layered.variants.map((v) => v.id);
      expect(variantIds).toContain('accordion');
      expect(variantIds).toContain('tabs');
      expect(variantIds).toContain('iconTabs');
      expect(variantIds).toContain('stepper');
      // cardGrid OR timeline — minimal salah satu (Patch-1 spec: "cardGrid/timeline")
      expect(variantIds.includes('cardGrid') || variantIds.includes('timeline')).toBe(true);
      // Best case: both present
      expect(variantIds).toContain('cardGrid');
      expect(variantIds).toContain('timeline');
    });

    it('has at least 6 variants (was 3 before Patch-1)', () => {
      const layered = getComponentSpec('layered-info')!;
      expect(layered.variants.length).toBeGreaterThanOrEqual(6);
    });

    it('dataModel variant field includes all 6 variant IDs', () => {
      const layered = getComponentSpec('layered-info')!;
      const variantField = layered.dataModel.fields.find((f) => f.name === 'variant');
      expect(variantField).toBeDefined();
      expect(variantField!.type).toContain('accordion');
      expect(variantField!.type).toContain('tabs');
      expect(variantField!.type).toContain('iconTabs');
      expect(variantField!.type).toContain('stepper');
      expect(variantField!.type).toContain('cardGrid');
      expect(variantField!.type).toContain('timeline');
    });

    it('layers field supports optional icon (for iconTabs variant)', () => {
      const layered = getComponentSpec('layered-info')!;
      const layersField = layered.dataModel.fields.find((f) => f.name === 'layers');
      expect(layersField).toBeDefined();
      // icon should be optional (icon?) in the layers array type
      expect(layersField!.type).toMatch(/icon\?/);
    });
  });

  // ----- interactive-starter: scenario/dilemma variants -----

  describe('interactive-starter (Patch-1 alignment)', () => {
    it('has scenario variant (decisionScenario or equivalent)', () => {
      const starter = getComponentSpec('interactive-starter')!;
      const variantIds = starter.variants.map((v) => v.id);
      // Patch-1 spec: "decisionScenario" minimal
      expect(variantIds).toContain('decisionScenario');
    });

    it('has dilemma variant', () => {
      const starter = getComponentSpec('interactive-starter')!;
      const variantIds = starter.variants.map((v) => v.id);
      expect(variantIds).toContain('dilemma');
    });

    it('has bigQuestion variant', () => {
      const starter = getComponentSpec('interactive-starter')!;
      const variantIds = starter.variants.map((v) => v.id);
      expect(variantIds).toContain('bigQuestion');
    });

    it('preserves original variants (poll, stance, case)', () => {
      const starter = getComponentSpec('interactive-starter')!;
      const variantIds = starter.variants.map((v) => v.id);
      expect(variantIds).toContain('poll');
      expect(variantIds).toContain('stance');
      expect(variantIds).toContain('case');
    });

    it('has at least 6 variants (was 3 before Patch-1)', () => {
      const starter = getComponentSpec('interactive-starter')!;
      expect(starter.variants.length).toBeGreaterThanOrEqual(6);
    });

    it('dataModel variant field includes all 6 variant IDs', () => {
      const starter = getComponentSpec('interactive-starter')!;
      const variantField = starter.dataModel.fields.find((f) => f.name === 'variant');
      expect(variantField).toBeDefined();
      expect(variantField!.type).toContain('poll');
      expect(variantField!.type).toContain('stance');
      expect(variantField!.type).toContain('case');
      expect(variantField!.type).toContain('bigQuestion');
      expect(variantField!.type).toContain('decisionScenario');
      expect(variantField!.type).toContain('dilemma');
    });
  });

  // ----- learning-bridge: applicable to learningObjectives + closing -----

  describe('learning-bridge (Patch-1 alignment)', () => {
    it('applicable to learningObjectives (Patch-1: sebelumnya/hari ini/berikutnya)', () => {
      const bridge = getComponentSpec('learning-bridge')!;
      expect(bridge.applicableRoles).toContain('learningObjectives');
    });

    it('applicable to closing (Patch-1: preview materi selanjutnya)', () => {
      const bridge = getComponentSpec('learning-bridge')!;
      expect(bridge.applicableRoles).toContain('closing');
    });

    it('still applicable to original roles (starter, material, activity, quiz, reflection)', () => {
      const bridge = getComponentSpec('learning-bridge')!;
      expect(bridge.applicableRoles).toContain('starter');
      expect(bridge.applicableRoles).toContain('material');
      expect(bridge.applicableRoles).toContain('activity');
      expect(bridge.applicableRoles).toContain('quiz');
      expect(bridge.applicableRoles).toContain('reflection');
    });

    it('has at least 7 applicable roles (was 5 before Patch-1)', () => {
      const bridge = getComponentSpec('learning-bridge')!;
      expect(bridge.applicableRoles.length).toBeGreaterThanOrEqual(7);
    });

    it('preserves original variants (transition, recap, preview)', () => {
      const bridge = getComponentSpec('learning-bridge')!;
      const variantIds = bridge.variants.map((v) => v.id);
      expect(variantIds).toContain('transition');
      expect(variantIds).toContain('recap');
      expect(variantIds).toContain('preview');
    });
  });

  // ----- Cross-cutting guards -----

  describe('Patch-1 cross-cutting guards', () => {
    it('LXC-02 added layered-info to COMPONENT_TYPES (now 7 types)', () => {
      // LXC-02 implemented layered-info as official component type.
      // V2-PILAR-2: +hotspot-overlay +input-field = 10 total.
      const path = resolve(__dirname, '../core/types.ts');
      const content = readFileSync(path, 'utf8');
      const match = content.match(/export const COMPONENT_TYPES = \[([^\]]+)\]/);
      expect(match).not.toBeNull();
      const types = match![1].split(',').map((t) => t.trim().replace(/['"]/g, '')).filter(Boolean);
      expect(types).toEqual(['text', 'image', 'card', 'navigation', 'question', 'game', 'layered-info', 'learning-bridge', 'hotspot-overlay', 'input-field']);
    });

    it('no runtime implementation added (contract file still pure spec)', () => {
      const path = resolve(__dirname, './fixtures/learning-experience-contract.ts');
      const content = readFileSync(path, 'utf8');
      expect(content).not.toMatch(/from ['"]\.\.\/component-factory['"]/);
      expect(content).not.toMatch(/from ['"]react['"]/);
      expect(content).not.toMatch(/createComponent\(/);
      expect(content).not.toMatch(/createElement\(/);
    });

    it('still has exactly 10 official components (Patch-1 does not add new components)', () => {
      expect(LEARNING_EXPERIENCE_COMPONENTS).toHaveLength(10);
    });

    it('all 10 component IDs still unique after Patch-1', () => {
      const ids = LEARNING_EXPERIENCE_COMPONENTS.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('all variant IDs still unique within each component after Patch-1', () => {
      for (const c of LEARNING_EXPERIENCE_COMPONENTS) {
        const ids = c.variants.map((v) => v.id);
        expect(new Set(ids).size).toBe(ids.length);
      }
    });

    it('previewEqualsExport still true for ALL components after Patch-1', () => {
      for (const c of LEARNING_EXPERIENCE_COMPONENTS) {
        expect(c.previewExportRules.previewEqualsExport).toBe(true);
      }
    });
  });

  // ----- Docs update verification -----

  describe('Patch-1 docs verification', () => {
    it('contract docs mention iconTabs variant', () => {
      const path = join(DOCS_DIR, 'LEARNING_EXPERIENCE_CONTRACT.md');
      const content = readFileSync(path, 'utf8');
      expect(content).toMatch(/iconTabs/);
    });

    it('contract docs mention timeline variant', () => {
      const path = join(DOCS_DIR, 'LEARNING_EXPERIENCE_CONTRACT.md');
      const content = readFileSync(path, 'utf8');
      expect(content).toMatch(/timeline/);
    });

    it('contract docs mention decisionScenario variant', () => {
      const path = join(DOCS_DIR, 'LEARNING_EXPERIENCE_CONTRACT.md');
      const content = readFileSync(path, 'utf8');
      expect(content).toMatch(/decisionScenario/);
    });

    it('contract docs mention dilemma variant', () => {
      const path = join(DOCS_DIR, 'LEARNING_EXPERIENCE_CONTRACT.md');
      const content = readFileSync(path, 'utf8');
      expect(content).toMatch(/dilemma/);
    });

    it('contract docs mention bigQuestion variant', () => {
      const path = join(DOCS_DIR, 'LEARNING_EXPERIENCE_CONTRACT.md');
      const content = readFileSync(path, 'utf8');
      expect(content).toMatch(/bigQuestion/);
    });

    it('contract docs mention learningObjectives applicable to layered-info', () => {
      const path = join(DOCS_DIR, 'LEARNING_EXPERIENCE_CONTRACT.md');
      const content = readFileSync(path, 'utf8');
      // Should mention learningObjectives in context of layered-info or general
      expect(content).toMatch(/learningObjectives/);
    });

    it('contract docs mention learning-bridge applicable to learningObjectives + closing', () => {
      const path = join(DOCS_DIR, 'LEARNING_EXPERIENCE_CONTRACT.md');
      const content = readFileSync(path, 'utf8');
      // In the learning-bridge section, should mention both roles
      const bridgeSection = content.split('### 8. Jembatan Belajar')[1]?.split('###')[0] ?? '';
      expect(bridgeSection).toMatch(/learningObjectives/);
      expect(bridgeSection).toMatch(/closing/);
    });

    it('contract docs mention LXC-01 Patch-1 changes', () => {
      const path = join(DOCS_DIR, 'LEARNING_EXPERIENCE_CONTRACT.md');
      const content = readFileSync(path, 'utf8');
      expect(content).toMatch(/LXC-01 Patch-1/);
    });
  });
});
