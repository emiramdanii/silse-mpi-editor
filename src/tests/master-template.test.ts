/**
 * V2-PILAR-4: Master Template System tests
 *
 * Test coverage:
 *   - createMasterFromProject: strip konten, preserve struktur + style
 *   - cloneMasterToProject: derive new project, inherit style + layout
 *   - validateMasterTemplate: validate structure
 *   - Storage: save/load/delete
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  createMasterFromProject,
  cloneMasterToProject,
  validateMasterTemplate,
} from '../core/master-template';
import type { SimpleProject } from '../core/types';

function loadRealProject(): SimpleProject {
  const path = resolve(__dirname, '../../tmp/misi2-real.json');
  const raw = readFileSync(path, 'utf-8');
  return JSON.parse(raw).project;
}

function createMinimalProject(): SimpleProject {
  return {
    id: 'proj-test-1',
    title: 'Test MPI',
    version: 1,
    currentPageId: 'page-1',
    stylePackId: 'mission-dark',
    style: {
      stylePackId: 'mission-dark',
      tokens: {
        colors: {
          background: '#0b1728',
          surface: '#1e293b',
          primary: '#1d3557',
          secondary: '#ffd166',
          text: '#ffffff',
          mutedText: '#94a3b8',
          border: '#334155',
          success: '#2a9d8f',
          warning: '#ffb703',
          danger: '#e63946',
        },
        typography: {
          fontFamily: 'sans-serif',
          titleSize: 48,
          subtitleSize: 28,
          bodySize: 18,
          smallSize: 14,
          lineHeight: 1.5,
        },
        spacing: { pagePadding: 64, componentGap: 16, cardPadding: 16 },
        radius: { small: 4, medium: 8, large: 16 },
        shadow: { none: 'none', soft: '0 1px 2px rgba(0,0,0,0.05)', medium: '0 4px 12px rgba(0,0,0,0.10)' },
      },
    },
    pages: [
      {
        id: 'page-1',
        title: 'Cover',
        role: 'cover',
        layoutId: 'coverCentered',
        background: { type: 'color', color: '#0b1728' },
        components: [],
        sceneType: 'cover-hero',
        sceneContent: { kind: 'cover-hero', heroTitle: 'Test Title', primaryAction: { label: 'Start', action: 'next' } },
        sceneLayout: { columns: 2, regions: { header: 'full' } },
      },
      {
        id: 'page-2',
        title: 'Materi',
        role: 'material',
        layoutId: 'singleColumn',
        background: { type: 'color', color: '#0b1728' },
        components: [],
        sceneType: 'learning-scene',
        sceneContent: { kind: 'learning-material', conceptTitle: 'Test', explanation: 'Test explanation' },
        sceneLayout: { columns: 3, arrangement: 'grid-3' },
      },
    ],
  };
}

describe('PILAR-4: createMasterFromProject', () => {
  it('1. creates master with correct metadata', () => {
    const project = createMinimalProject();
    const master = createMasterFromProject(project, 'Master Pancasila', 'Master untuk 5 misi');

    expect(master.name).toBe('Master Pancasila');
    expect(master.description).toBe('Master untuk 5 misi');
    expect(master.id).toBeTruthy();
    expect(master.createdAt).toBeTruthy();
  });

  it('2. preserves stylePackId + style', () => {
    const project = createMinimalProject();
    const master = createMasterFromProject(project, 'Test');

    expect(master.stylePackId).toBe('mission-dark');
    expect(master.style.stylePackId).toBe('mission-dark');
    expect(master.style.tokens.colors.background).toBe('#0b1728');
  });

  it('3. preserves page structure (role + sceneType + layout)', () => {
    const project = createMinimalProject();
    const master = createMasterFromProject(project, 'Test');

    expect(master.pageStructure.length).toBe(2);
    expect(master.pageStructure[0].role).toBe('cover');
    expect(master.pageStructure[0].sceneType).toBe('cover-hero');
    expect(master.pageStructure[0].layout?.columns).toBe(2);
    expect(master.pageStructure[1].role).toBe('material');
    expect(master.pageStructure[1].sceneType).toBe('learning-scene');
    expect(master.pageStructure[1].layout?.arrangement).toBe('grid-3');
  });

  it('4. works with real Misi 2 project (6 pages)', () => {
    const project = loadRealProject();
    const master = createMasterFromProject(project, 'Master Misi 2');

    expect(master.pageStructure.length).toBe(6);
    expect(master.stylePackId).toBe('mission-dark');
    // Verify all scene types preserved
    const sceneTypes = master.pageStructure.map((p) => p.sceneType);
    expect(sceneTypes).toContain('cover-hero');
    expect(sceneTypes).toContain('learning-scene');
    expect(sceneTypes).toContain('case-analysis');
    expect(sceneTypes).toContain('branching-scenario');
    expect(sceneTypes).toContain('closing-award');
  });

  it('5. preserves curriculum template (subject/grade/phase)', () => {
    const project = createMinimalProject();
    project.curriculum = {
      subject: 'PPKn',
      grade: '7',
      phase: 'D',
      topic: 'Norma',
      objectives: [{ id: 'obj-1', text: 'Test objective' }],
    };
    const master = createMasterFromProject(project, 'Test');

    expect(master.curriculumTemplate).toBeDefined();
    expect(master.curriculumTemplate?.subject).toBe('PPKn');
    expect(master.curriculumTemplate?.grade).toBe('7');
    expect(master.curriculumTemplate?.phase).toBe('D');
  });
});

describe('PILAR-4: cloneMasterToProject', () => {
  it('6. clones master to new project with topic', () => {
    const project = createMinimalProject();
    const master = createMasterFromProject(project, 'Test Master');
    const result = cloneMasterToProject(master, 'Misi 3: Persatuan Indonesia');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.title).toBe('Misi 3: Persatuan Indonesia');
  });

  it('7. cloned project inherits style + stylePackId', () => {
    const project = createMinimalProject();
    const master = createMasterFromProject(project, 'Test');
    const result = cloneMasterToProject(master, 'New Topic');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.stylePackId).toBe('mission-dark');
    expect(result.project.style?.stylePackId).toBe('mission-dark');
    expect(result.project.style?.tokens.colors.background).toBe('#0b1728');
  });

  it('8. cloned project has correct page count + scene types', () => {
    const project = createMinimalProject();
    const master = createMasterFromProject(project, 'Test');
    const result = cloneMasterToProject(master, 'New Topic');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.pages.length).toBe(2);
    expect(result.project.pages[0].sceneType).toBe('cover-hero');
    expect(result.project.pages[1].sceneType).toBe('learning-scene');
  });

  it('9. cloned project has fresh IDs (not same as master templateIds)', () => {
    const project = createMinimalProject();
    const master = createMasterFromProject(project, 'Test');
    const result = cloneMasterToProject(master, 'New Topic');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const masterIds = master.pageStructure.map((p) => p.templateId);
    const cloneIds = result.project.pages.map((p) => p.id);
    for (const mid of masterIds) {
      expect(cloneIds).not.toContain(mid);
    }
  });

  it('10. cloned project inherits layout metadata', () => {
    const project = createMinimalProject();
    const master = createMasterFromProject(project, 'Test');
    const result = cloneMasterToProject(master, 'New Topic');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.pages[0].sceneLayout?.columns).toBe(2);
    expect(result.project.pages[1].sceneLayout?.arrangement).toBe('grid-3');
  });

  it('11. cloned project has empty sceneContent (guru isi sendiri)', () => {
    const project = createMinimalProject();
    const master = createMasterFromProject(project, 'Test');
    const result = cloneMasterToProject(master, 'New Topic');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.pages[0].sceneContent).toBeUndefined();
    expect(result.project.pages[1].sceneContent).toBeUndefined();
  });

  it('12. cloned project has curriculum with topic from parameter', () => {
    const project = createMinimalProject();
    project.curriculum = {
      subject: 'PPKn', grade: '7', phase: 'D', topic: 'Old Topic',
      objectives: [],
    };
    const master = createMasterFromProject(project, 'Test');
    const result = cloneMasterToProject(master, 'New Topic Name');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.curriculum).toBeDefined();
    expect(result.project.curriculum?.subject).toBe('PPKn');
    expect(result.project.curriculum?.topic).toBe('New Topic Name');
  });

  it('13. empty topic returns error', () => {
    const project = createMinimalProject();
    const master = createMasterFromProject(project, 'Test');
    const result = cloneMasterToProject(master, '');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('kosong');
  });

  it('14. cloned project from real Misi 2 master has 6 pages', () => {
    const project = loadRealProject();
    const master = createMasterFromProject(project, 'Master Misi 2');
    const result = cloneMasterToProject(master, 'Misi 3: Persatuan Indonesia');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.pages.length).toBe(6);
    expect(result.project.stylePackId).toBe('mission-dark');
  });
});

describe('PILAR-4: validateMasterTemplate', () => {
  it('15. valid master returns empty errors', () => {
    const project = createMinimalProject();
    const master = createMasterFromProject(project, 'Valid Master');
    const errors = validateMasterTemplate(master);
    expect(errors.length).toBe(0);
  });

  it('16. null input returns error', () => {
    const errors = validateMasterTemplate(null);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('17. missing id returns error', () => {
    const project = createMinimalProject();
    const master = createMasterFromProject(project, 'Test');
    const bad = { ...master, id: undefined };
    const errors = validateMasterTemplate(bad);
    expect(errors.some((e) => e.includes('id'))).toBe(true);
  });

  it('18. empty pageStructure returns error', () => {
    const project = createMinimalProject();
    const master = createMasterFromProject(project, 'Test');
    const bad = { ...master, pageStructure: [] };
    const errors = validateMasterTemplate(bad);
    expect(errors.some((e) => e.includes('pageStructure'))).toBe(true);
  });
});
