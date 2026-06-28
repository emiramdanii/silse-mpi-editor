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
  it('Toolbar handleExport calls checkMpiStandard', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const content = fs.readFileSync(path.resolve(__dirname, '../editor/Toolbar.tsx'), 'utf8');
    expect(content).toMatch(/checkMpiStandard/);
    expect(content).toMatch(/confirm/);
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
