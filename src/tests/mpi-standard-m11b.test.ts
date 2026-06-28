/**
 * Tests for Batch 11B Patch — MPI Standard + Curriculum Alignment.
 */

import { describe, expect, it } from 'vitest';
import { createSamplePpknProject } from '../core/sample-project';
import { checkMpiStandard } from '../core/mpi-quality-check';
import { createProject } from '../core/project-factory';
import { isValidProject } from '../core/validation';
import { PAGE_ROLES } from '../core/types';

// =========================================================================
// Curriculum metadata
// =========================================================================

describe('M11B PATCH — curriculum metadata', () => {
  it('sample project has curriculum with subject, grade, phase, topic', () => {
    const sample = createSamplePpknProject();
    expect(sample.curriculum).toBeDefined();
    expect(sample.curriculum!.subject).toBe('PPKn');
    expect(sample.curriculum!.grade).toBe('7');
    expect(sample.curriculum!.phase).toBe('D');
    expect(sample.curriculum!.topic).toBe('Hidup Tertib dengan Norma');
  });

  it('sample project has 3 curriculum objectives', () => {
    const sample = createSamplePpknProject();
    expect(sample.curriculum!.objectives).toHaveLength(3);
    expect(sample.curriculum!.objectives[0].text).toMatch(/pengertian norma/i);
  });

  it('sample project passes validateProject', () => {
    const sample = createSamplePpknProject();
    expect(isValidProject(sample)).toBe(true);
  });
});

// =========================================================================
// Page roles guide + menu
// =========================================================================

describe('M11B PATCH — page roles guide + menu', () => {
  it('PAGE_ROLES includes guide', () => {
    expect(PAGE_ROLES).toContain('guide');
  });

  it('PAGE_ROLES includes menu', () => {
    expect(PAGE_ROLES).toContain('menu');
  });

  it('sample project has guide page', () => {
    const sample = createSamplePpknProject();
    expect(sample.pages.some((p) => p.role === 'guide')).toBe(true);
  });

  it('sample project has menu page', () => {
    const sample = createSamplePpknProject();
    expect(sample.pages.some((p) => p.role === 'menu')).toBe(true);
  });
});

// =========================================================================
// MPI Quality Check
// =========================================================================

describe('M11B PATCH — MPI quality check', () => {
  it('sample project passes quality check', () => {
    const sample = createSamplePpknProject();
    const qc = checkMpiStandard(sample);
    expect(qc.errors).toEqual([]);
    expect(qc.pass).toBe(true);
  });

  it('empty project fails quality check (no curriculum, no cover, etc)', () => {
    const empty = createProject();
    const qc = checkMpiStandard(empty);
    expect(qc.pass).toBe(false);
    expect(qc.errors.length).toBeGreaterThan(0);
    expect(qc.errors.join('; ')).toMatch(/kurikulum/i);
  });

  it('quality check detects missing curriculum', () => {
    const sample = createSamplePpknProject();
    const broken = { ...sample, curriculum: undefined };
    const qc = checkMpiStandard(broken);
    expect(qc.pass).toBe(false);
    expect(qc.errors.join('; ')).toMatch(/kurikulum/i);
  });

  it('quality check detects missing cover', () => {
    const sample = createSamplePpknProject();
    const broken = { ...sample, pages: sample.pages.filter((p) => p.role !== 'cover') };
    const qc = checkMpiStandard(broken);
    expect(qc.errors.join('; ')).toMatch(/cover/i);
  });

  it('quality check detects missing learningObjectives page', () => {
    const sample = createSamplePpknProject();
    const broken = { ...sample, pages: sample.pages.filter((p) => p.role !== 'learningObjectives') };
    const qc = checkMpiStandard(broken);
    expect(qc.errors.join('; ')).toMatch(/tujuan/i);
  });

  it('quality check detects missing material', () => {
    const sample = createSamplePpknProject();
    const broken = { ...sample, pages: sample.pages.filter((p) => p.role !== 'material') };
    const qc = checkMpiStandard(broken);
    expect(qc.errors.join('; ')).toMatch(/materi/i);
  });

  it('quality check warns about missing guide', () => {
    const sample = createSamplePpknProject();
    const broken = { ...sample, pages: sample.pages.filter((p) => p.role !== 'guide') };
    const qc = checkMpiStandard(broken);
    expect(qc.warnings.join('; ')).toMatch(/panduan/i);
  });

  it('quality check warns about missing menu', () => {
    const sample = createSamplePpknProject();
    const broken = { ...sample, pages: sample.pages.filter((p) => p.role !== 'menu') };
    const qc = checkMpiStandard(broken);
    expect(qc.warnings.join('; ')).toMatch(/menu/i);
  });

  it('quality check warns about missing question', () => {
    const sample = createSamplePpknProject();
    const broken = {
      ...sample,
      pages: sample.pages.map((p) => ({
        ...p,
        components: p.components.filter((c) => c.type !== 'question'),
      })),
    };
    const qc = checkMpiStandard(broken);
    expect(qc.warnings.join('; ')).toMatch(/question/i);
  });

  it('quality check warns about missing game', () => {
    const sample = createSamplePpknProject();
    const broken = {
      ...sample,
      pages: sample.pages.map((p) => ({
        ...p,
        components: p.components.filter((c) => c.type !== 'game'),
      })),
    };
    const qc = checkMpiStandard(broken);
    expect(qc.warnings.join('; ')).toMatch(/game/i);
  });

  it('quality check warns about weak feedback', () => {
    const sample = createSamplePpknProject();
    const broken = {
      ...sample,
      pages: sample.pages.map((p) => ({
        ...p,
        components: p.components.map((c) => {
          if (c.type === 'question') {
            return { ...c, feedbackCorrect: 'x', feedbackWrong: '' } as typeof c;
          }
          return c;
        }),
      })),
    };
    const qc = checkMpiStandard(broken);
    expect(qc.warnings.join('; ')).toMatch(/feedback/i);
  });
});

// =========================================================================
// Export guard
// =========================================================================

describe('M11B PATCH — export guard', () => {
  it('Topbar handleExport calls checkMpiStandard (UX-01: export moved to Topbar)', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    // UX-01: Export HTML button moved from Toolbar to Topbar (primary action).
    // Verify the guard is wired into the new Topbar location.
    const topbarContent = fs.readFileSync(path.resolve(__dirname, '../editor/Topbar.tsx'), 'utf8');
    expect(topbarContent).toMatch(/checkMpiStandard/);
    expect(topbarContent).toMatch(/confirm/);
  });
});

// =========================================================================
// Sample project structure
// =========================================================================

describe('M11B PATCH — sample project structure', () => {
  it('sample has 10 pages (cover, guide, tujuan, menu, pemantik, materi, quiz, game, refleksi, penutup)', () => {
    const sample = createSamplePpknProject();
    expect(sample.pages).toHaveLength(10);
    const roles = sample.pages.map((p) => p.role);
    expect(roles).toContain('cover');
    expect(roles).toContain('guide');
    expect(roles).toContain('learningObjectives');
    expect(roles).toContain('menu');
    expect(roles).toContain('starter');
    expect(roles).toContain('material');
    expect(roles).toContain('quiz');
    expect(roles).toContain('activity');
    expect(roles).toContain('reflection');
    expect(roles).toContain('closing');
  });

  it('sample tujuan page reads from curriculum.objectives', () => {
    const sample = createSamplePpknProject();
    const tujuan = sample.pages.find((p) => p.role === 'learningObjectives')!;
    const bodyText = tujuan.components.find((c) => c.type === 'text' && (c as { text: string }).text.includes('1.')) as { text: string } | undefined;
    expect(bodyText).toBeDefined();
    expect(bodyText!.text).toMatch(/pengertian norma/i);
    expect(bodyText!.text).toMatch(/jenis-jenis norma/i);
    expect(bodyText!.text).toMatch(/sikap tertib/i);
  });
});

// =========================================================================
// M11B Patch-2 — Sample Navigation Completion (bebas jalan bantu)
// =========================================================================

describe('M11B PATCH-2 — sample navigation completion', () => {
  // Test 1 (Scope C): Sample PPKn tidak menghasilkan warning navigasi pada halaman Game.
  it('sample Game page has navigation component (no dead-end on Game)', () => {
    const sample = createSamplePpknProject();
    const game = sample.pages.find((p) => p.role === 'activity');
    expect(game).toBeDefined();
    const nav = game!.components.find((c) => c.type === 'navigation');
    expect(nav).toBeDefined();
    const navLabel = (nav as { label: string }).label;
    expect(navLabel.toLowerCase()).toMatch(/refleksi/);
  });

  it('sample Game page navigation has action=next and variant=primaryAction', () => {
    const sample = createSamplePpknProject();
    const game = sample.pages.find((p) => p.role === 'activity')!;
    const nav = game.components.find((c) => c.type === 'navigation') as
      | { action: string; variant: string; label: string }
      | undefined;
    expect(nav).toBeDefined();
    expect(nav!.action).toBe('next');
    expect(nav!.variant).toBe('primaryAction');
  });

  // Test 2 (Scope C): Sample PPKn quality check pass.
  it('sample PPKn quality check passes (pass=true, errors empty)', () => {
    const sample = createSamplePpknProject();
    const qc = checkMpiStandard(sample);
    expect(qc.pass).toBe(true);
    expect(qc.errors).toEqual([]);
  });

  // Test 3 (Scope C): Sample PPKn warnings.length === 0, minimal tidak ada warning dead-end.
  it('sample PPKn produces zero warnings (no dead-end, no weak feedback, no missing role)', () => {
    const sample = createSamplePpknProject();
    const qc = checkMpiStandard(sample);
    expect(qc.warnings).toEqual([]);
  });

  it('sample PPKn has no navigation dead-end warning on any page', () => {
    const sample = createSamplePpknProject();
    const qc = checkMpiStandard(sample);
    const navWarnings = qc.warnings.filter((w) =>
      w.toLowerCase().includes('navigasi'),
    );
    expect(navWarnings).toEqual([]);
  });

  // Test 4 (Scope C): Export sample tidak memunculkan dialog warning standar.
  // Export guard triggers confirm dialog when `!qc.pass || qc.warnings.length > 0`.
  // For sample to skip dialog, both must be false: pass=true AND warnings empty.
  it('sample export does not trigger MPI standard warning dialog (pass=true AND warnings empty)', () => {
    const sample = createSamplePpknProject();
    const qc = checkMpiStandard(sample);
    const wouldShowDialog = !qc.pass || qc.warnings.length > 0;
    expect(wouldShowDialog).toBe(false);
  });

  it('Toolbar handleExport uses checkMpiStandard guard before export (UX-01: now in Topbar)', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    // UX-01: Export HTML button moved to Topbar — guard should be in Topbar now.
    const topbarContent = fs.readFileSync(path.resolve(__dirname, '../editor/Topbar.tsx'), 'utf8');
    expect(topbarContent).toMatch(/checkMpiStandard/);
    expect(topbarContent).toMatch(/!qc\.pass\s*\|\|\s*qc\.warnings\.length/);
  });
});

// =========================================================================
// M11B Patch-2 — Quality Check contract table (Scope B lock)
// =========================================================================

describe('M11B PATCH-2 — quality check contract table', () => {
  it('missing curriculum → ERROR', () => {
    const sample = createSamplePpknProject();
    const broken = { ...sample, curriculum: undefined };
    const qc = checkMpiStandard(broken);
    expect(qc.errors.join('; ')).toMatch(/kurikulum/i);
    expect(qc.warnings.join('; ')).not.toMatch(/kurikulum/i);
  });

  it('empty objectives → ERROR', () => {
    const sample = createSamplePpknProject();
    const broken = {
      ...sample,
      curriculum: { ...sample.curriculum!, objectives: [] },
    };
    const qc = checkMpiStandard(broken);
    expect(qc.errors.join('; ')).toMatch(/tujuan pembelajaran/i);
  });

  it('missing cover → ERROR', () => {
    const sample = createSamplePpknProject();
    const broken = { ...sample, pages: sample.pages.filter((p) => p.role !== 'cover') };
    const qc = checkMpiStandard(broken);
    expect(qc.errors.join('; ')).toMatch(/cover/i);
  });

  it('missing learningObjectives → ERROR', () => {
    const sample = createSamplePpknProject();
    const broken = { ...sample, pages: sample.pages.filter((p) => p.role !== 'learningObjectives') };
    const qc = checkMpiStandard(broken);
    expect(qc.errors.join('; ')).toMatch(/tujuan/i);
  });

  it('missing material → ERROR', () => {
    const sample = createSamplePpknProject();
    const broken = { ...sample, pages: sample.pages.filter((p) => p.role !== 'material') };
    const qc = checkMpiStandard(broken);
    expect(qc.errors.join('; ')).toMatch(/materi/i);
  });

  it('missing guide → WARNING (not error)', () => {
    const sample = createSamplePpknProject();
    const broken = { ...sample, pages: sample.pages.filter((p) => p.role !== 'guide') };
    const qc = checkMpiStandard(broken);
    expect(qc.warnings.join('; ')).toMatch(/panduan/i);
    expect(qc.errors.join('; ')).not.toMatch(/panduan/i);
  });

  it('missing menu → WARNING (not error)', () => {
    const sample = createSamplePpknProject();
    const broken = { ...sample, pages: sample.pages.filter((p) => p.role !== 'menu') };
    const qc = checkMpiStandard(broken);
    expect(qc.warnings.join('; ')).toMatch(/menu/i);
    expect(qc.errors.join('; ')).not.toMatch(/menu/i);
  });

  it('missing closing → WARNING (not error)', () => {
    const sample = createSamplePpknProject();
    const broken = { ...sample, pages: sample.pages.filter((p) => p.role !== 'closing') };
    const qc = checkMpiStandard(broken);
    expect(qc.warnings.join('; ')).toMatch(/penutup/i);
    expect(qc.errors.join('; ')).not.toMatch(/penutup/i);
  });

  it('material page without navigation → WARNING (dead-end)', () => {
    const sample = createSamplePpknProject();
    const broken = {
      ...sample,
      pages: sample.pages.map((p) =>
        p.role === 'material'
          ? { ...p, components: p.components.filter((c) => c.type !== 'navigation') }
          : p,
      ),
    };
    const qc = checkMpiStandard(broken);
    expect(qc.warnings.join('; ')).toMatch(/navigasi/i);
  });

  it('quiz page without navigation → WARNING (dead-end)', () => {
    const sample = createSamplePpknProject();
    const broken = {
      ...sample,
      pages: sample.pages.map((p) =>
        p.role === 'quiz'
          ? { ...p, components: p.components.filter((c) => c.type !== 'navigation') }
          : p,
      ),
    };
    const qc = checkMpiStandard(broken);
    expect(qc.warnings.join('; ')).toMatch(/navigasi/i);
  });

  it('activity (Game) page without navigation → WARNING (dead-end)', () => {
    const sample = createSamplePpknProject();
    const broken = {
      ...sample,
      pages: sample.pages.map((p) =>
        p.role === 'activity'
          ? { ...p, components: p.components.filter((c) => c.type !== 'navigation') }
          : p,
      ),
    };
    const qc = checkMpiStandard(broken);
    expect(qc.warnings.join('; ')).toMatch(/navigasi/i);
  });
});
