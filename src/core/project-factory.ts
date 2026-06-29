/**
 * Project factory for silse-mpi-editor.
 *
 * Layer: core
 * Allowed imports: ./types, ./ids, ./component-factory, ./style-presets, ./layout-defaults
 *
 * Creates valid empty projects and pages.
 *
 * Kontrak Batch 2R:
 *   - Page pertama default: title="Cover", role="cover", pre-fill 1 TextComponent variant 'title'.
 *   - Page baru manual default: role="free".
 *
 * Kontrak Batch 3 (M3):
 *   - Setiap SimplePage punya field `layoutId` wajib, default by PageRole.
 *   - cover → 'coverCentered', material → 'singleColumn', lainnya → 'blank'.
 */

import type { PageRole, SimplePage, SimpleProject } from './types';
import { createTextComponent } from './component-factory';
import { createPageId, createProjectId } from './ids';
import { DEFAULT_STYLE_PACK, stylePackToProjectStyle } from './style-presets';
import { getDefaultLayoutIdForRole } from './layout-defaults';

/**
 * Create a fresh empty page with a default white background.
 * layoutId di-set otomatis berdasarkan role.
 */
export function createEmptyPage(opts: { title?: string; role?: PageRole } = {}): SimplePage {
  const role: PageRole = opts.role ?? 'free';
  const title = opts.title ?? defaultTitleForRole(role);
  return {
    id: createPageId(),
    title,
    role,
    layoutId: getDefaultLayoutIdForRole(role),
    background: { type: 'color', color: '#ffffff' },
    components: [],
  };
}

function defaultTitleForRole(role: PageRole): string {
  switch (role) {
    case 'cover':
      return 'Cover';
    case 'guide':
      return 'Panduan';
    case 'menu':
      return 'Menu Materi';
    case 'learningObjectives':
      return 'Tujuan Pembelajaran';
    case 'starter':
      return 'Pemantik';
    case 'material':
      return 'Materi';
    case 'activity':
      return 'Aktivitas';
    case 'quiz':
      return 'Kuis';
    case 'reflection':
      return 'Refleksi';
    case 'closing':
      return 'Penutup';
    case 'free':
    default:
      return 'Halaman Baru';
  }
}

/**
 * Create a fresh empty project with one default page (Cover).
 * Cover page pre-filled with 1 TextComponent variant 'title' (guided).
 */
export function createProject(title: string = 'MPI Baru'): SimpleProject {
  const coverPage = createEmptyPage({ title: 'Cover', role: 'cover' });
  // Pre-fill cover dengan 1 text component variant 'title' (guided)
  const titleComponent = createTextComponent('cover', {
    text: 'Judul MPI',
    x: 140,
    y: 280,
    width: 1000,
    height: 120,
  });
  coverPage.components.push(titleComponent);

  return {
    id: createProjectId(),
    title,
    version: 1,
    pages: [coverPage],
    currentPageId: coverPage.id,
    // Batch 2S: embed default style pack (cleanClassroom) into project.
    // Tokens disnapshot inline supaya project self-contained.
    stylePackId: 'modern-clean',
    style: stylePackToProjectStyle(DEFAULT_STYLE_PACK),
  };
}

/**
 * Create a fresh empty project with N pages of given roles.
 * Useful for tests. First page role can be specified; defaults to 'free'.
 */
export function createProjectWithPages(
  pageCount: number,
  opts: { title?: string; firstRole?: PageRole } = {},
): SimpleProject {
  if (pageCount < 1) {
    throw new Error('pageCount must be >= 1');
  }
  const project = createProject(opts.title);
  if (opts.firstRole) {
    // Override first page role (test convenience).
    // Batch 4 preflight fix: layoutId harus ikut role baru (invariant:
    // role berubah → default layoutId ikut benar).
    project.pages[0].role = opts.firstRole;
    project.pages[0].layoutId = getDefaultLayoutIdForRole(opts.firstRole);
  }
  for (let i = 1; i < pageCount; i++) {
    const page = createEmptyPage({ role: 'free' });
    project.pages.push(page);
  }
  return project;
}
