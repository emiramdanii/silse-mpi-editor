/**
 * Project factory for silse-mpi-editor.
 *
 * Layer: core
 * Allowed imports: ./types, ./ids
 *
 * Creates valid empty projects and pages.
 */

import { PROJECT_VERSION, type SimplePage, type SimpleProject } from './types';
import { createPageId, createProjectId } from './ids';

/**
 * Create a fresh empty page with a default white background.
 */
export function createEmptyPage(title: string = 'Halaman 1'): SimplePage {
  return {
    id: createPageId(),
    title,
    background: { type: 'color', color: '#ffffff' },
    blocks: [],
  };
}

/**
 * Create a fresh empty project with one default page.
 * The default page becomes the current page.
 */
export function createProject(title: string = 'MPI Baru'): SimpleProject {
  const firstPage = createEmptyPage('Halaman 1');
  return {
    id: createProjectId(),
    title,
    version: PROJECT_VERSION,
    pages: [firstPage],
    currentPageId: firstPage.id,
  };
}

/**
 * Create a fresh empty project with N pages.
 * Useful for tests.
 */
export function createProjectWithPages(pageCount: number, title: string = 'MPI Baru'): SimpleProject {
  if (pageCount < 1) {
    throw new Error('pageCount must be >= 1');
  }
  const project = createProject(title);
  for (let i = 1; i < pageCount; i++) {
    const page = createEmptyPage(`Halaman ${i + 1}`);
    project.pages.push(page);
  }
  return project;
}
