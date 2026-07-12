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

import type { GlobalSlideSettings, PageRole, SimplePage, SimpleProject } from './types';
import { createTextComponent } from './component-factory';
import { createPageId, createProjectId } from './ids';
import { DEFAULT_STYLE_PACK, stylePackToProjectStyle } from './style-presets';
import { getDefaultLayoutIdForRole } from './layout-defaults';

// ---------------------------------------------------------------------------
// V2-PILAR-1: Global Slide Settings — default + helper
// ---------------------------------------------------------------------------

/**
 * Default GlobalSlideSettings. Dipakai saat project.globalSlideSettings undefined.
 * Konsisten dengan perilaku V1 (bottom-center floating pill, glass, semua show=true).
 */
export const DEFAULT_GLOBAL_SLIDE_SETTINGS: GlobalSlideSettings = {
  navigationToolbar: {
    position: 'bottom-center',
    style: 'glass',
    showSceneTitle: true,
    showProgressText: true,
    showProgressBar: true,
  },
  slideTransition: 'none',
};

/**
 * Get effective GlobalSlideSettings for a project.
 * Returns project's settings if set, otherwise default.
 *
 * Pure function — safe for use in editor, preview, dan export (build time).
 */
export function getEffectiveGlobalSlideSettings(
  project: SimpleProject,
): GlobalSlideSettings {
  return project.globalSlideSettings ?? DEFAULT_GLOBAL_SLIDE_SETTINGS;
}

// ---------------------------------------------------------------------------
// V2-PILAR-1: Slide import helpers
// ---------------------------------------------------------------------------

/**
 * Derive page title dari nama file PNG.
 *
 * Algoritma:
 *   1. Hilangkan ekstensi file (.png, .jpg, .jpeg, .webp)
 *   2. Ganti '-' dan '_' dengan spasi
 *   3. Kapitalisasi huruf pertama
 *   4. Batasi 50 karakter (dengan elipsis jika lebih)
 *
 * Contoh:
 *   "slide-01-pengantar.png" → "Slide 01 pengantar"
 *   "materi_01.jpg"          → "Materi 01"
 *   "very-long-name-..."     → dipotong 50 char + "…"
 */
export function derivePageTitleFromFileName(fileName: string): string {
  // Strip extension
  const noExt = fileName.replace(/\.(png|jpe?g|webp)$/i, '');
  // Replace - and _ with space
  const withSpaces = noExt.replace(/[-_]+/g, ' ').trim();
  // Capitalize first letter
  const capitalized = withSpaces.length > 0
    ? withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1)
    : 'Slide';
  // Truncate to 50 chars
  return capitalized.length > 50
    ? capitalized.slice(0, 49) + '…'
    : capitalized;
}

/**
 * Cek apakah project adalah proyek "kosong" (default).
 * Dipakai untuk menentukan behavior impor slide:
 *   - Kosong → ganti dengan proyek baru dari slide
 *   - Tidak kosong → tanya user (tambah / buat baru)
 *
 * Kriteria "kosong":
 *   1. Judul = "MPI Baru" (default dari createProject)
 *   2. Tepat 1 page
 *   3. Page role = 'cover'
 *   4. Page punya tepat 1 komponen (text title default)
 *   5. Text komponen berisi "Judul MPI" (default)
 */
export function isProjectEmpty(project: SimpleProject): boolean {
  if (project.title !== 'MPI Baru') return false;
  if (project.pages.length !== 1) return false;
  const page = project.pages[0];
  if (page.role !== 'cover') return false;
  if (page.components.length !== 1) return false;
  const comp = page.components[0];
  if (comp.type !== 'text') return false;
  if (comp.text !== 'Judul MPI') return false;
  return true;
}

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
