/**
 * @module master-template
 *
 * V2-PILAR-4: Master Template System
 *
 * Layer: core (pure functions, no React/DOM)
 *
 * Konsep:
 *   Master Template = MPI "blueprint" dengan struktur + style + layout
 *   yang sudah dikunci, tanpa konten spesifik. Guru bisa:
 *     1. Buat MPI dengan style + layout yang diinginkan
 *     2. Save sebagai Master Template
 *     3. Clone Master → derive MPI baru untuk topik berbeda
 *     4. Instance MPI inherit style + layout dari Master
 *
 * Use case:
 *   - Guru buat "Master Pancasila" dengan 5 misi (struktur Sila 1-5)
 *     + style mission-dark + layout 2-column
 *   - Clone untuk "Misi 1: Sila Ketuhanan" → inherit struktur + style,
 *     isi konten spesifik Sila 1
 *   - Clone lagi untuk "Misi 2: Sila Kemanusiaan" → sama, isi konten Sila 2
 *
 * Perbedaan dengan Custom Template (template-storage.ts):
 *   - Custom Template: snapshot SimpleProject (konten + style + layout)
 *   - Master Template: snapshot struktur + style + layout TANPA konten
 *     (pages dengan sceneType + layout, tapi sceneContent kosong)
 *
 * Allowed imports: ../types, ./ids
 */

import type { SimpleProject, SimplePage } from './types';
import type { ProjectStyle } from './style-types';
import { createProjectId, createPageId } from './ids';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MasterTemplate = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  /** Style pack + tokens + panelOverrides yang di-clone ke instance */
  style: ProjectStyle;
  /** stylePackId yang dipakai */
  stylePackId: string;
  /** Struktur halaman: sceneType + layout, TANPA sceneContent */
  pageStructure: MasterPageStructure[];
  /** Global slide settings (nav toolbar position, style, dll.) */
  globalSlideSettings?: SimpleProject['globalSlideSettings'];
  /** Curriculum metadata template (subject, grade, phase — tanpa topic spesifik) */
  curriculumTemplate?: {
    subject: string;
    grade: string;
    phase: string;
  };
};

export type MasterPageStructure = {
  /** Template page ID (akan di-replace dengan fresh ID saat clone) */
  templateId: string;
  role: SimplePage['role'];
  sceneType: string;
  title: string;
  layout?: { columns?: number; arrangement?: string; orientation?: 'horizontal' | 'vertical'; regions?: Record<string, string> };
  background: SimplePage['background'];
};

export type MasterCloneResult =
  | { ok: true; project: SimpleProject }
  | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Create Master Template from Project
// ---------------------------------------------------------------------------

/**
 * Buat Master Template dari project yang sudah ada.
 * Strip konten spesifik (sceneContent), preserve struktur + style + layout.
 *
 * Pure function — tidak mutate input.
 */
export function createMasterFromProject(
  project: SimpleProject,
  name: string,
  description: string = '',
): MasterTemplate {
  const pageStructure: MasterPageStructure[] = project.pages.map((page: SimplePage) => ({
    templateId: page.id,
    role: page.role,
    sceneType: page.sceneType ?? '',
    title: page.title, // Keep title sebagai placeholder
    layout: page.sceneLayout,
    background: page.background,
  }));

  return {
    id: createProjectId(),
    name,
    description,
    createdAt: new Date().toISOString(),
    style: project.style ?? {
      stylePackId: project.stylePackId ?? 'modern-clean',
      tokens: {
        colors: {
          background: '#ffffff',
          surface: '#f9fafb',
          primary: '#2563eb',
          secondary: '#60a5fa',
          text: '#1f2937',
          mutedText: '#6b7280',
          border: '#d1d5db',
          success: '#16a34a',
          warning: '#d97706',
          danger: '#dc2626',
        },
        typography: {
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
    stylePackId: project.stylePackId ?? 'modern-clean',
    pageStructure,
    globalSlideSettings: project.globalSlideSettings,
    curriculumTemplate: project.curriculum
      ? {
          subject: project.curriculum.subject,
          grade: project.curriculum.grade,
          phase: project.curriculum.phase,
        }
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// Clone Master Template → New Project
// ---------------------------------------------------------------------------

/**
 * Clone Master Template menjadi SimpleProject baru.
 * Inherit style + layout + struktur dari Master.
 * Konten (sceneContent) kosong — guru isi sendiri.
 *
 * Pure function — return new project, tidak mutate master.
 */
export function cloneMasterToProject(
  master: MasterTemplate,
  topic: string,
): MasterCloneResult {
  if (!topic || topic.trim().length === 0) {
    return { ok: false, error: 'Topic tidak boleh kosong' };
  }

  const pages: SimplePage[] = master.pageStructure.map((struct) => {
    const page: SimplePage = {
      id: createPageId(),
      title: struct.title,
      role: struct.role,
      layoutId: 'blank',
      background: struct.background,
      components: [],
      sceneType: struct.sceneType || undefined,  // sceneType is optional string
      // sceneContent kosong — guru isi sendiri
      sceneLayout: struct.layout,
    };
    return page;
  });

  const project: SimpleProject = {
    id: createProjectId(),
    title: topic,
    version: 1,
    currentPageId: pages[0]?.id ?? '',
    stylePackId: master.stylePackId,
    style: master.style,
    pages,
    globalSlideSettings: master.globalSlideSettings,
    curriculum: master.curriculumTemplate
      ? {
          subject: master.curriculumTemplate.subject,
          grade: master.curriculumTemplate.grade,
          phase: master.curriculumTemplate.phase,
          topic,
          objectives: [],
        }
      : undefined,
  };

  return { ok: true, project };
}

// ---------------------------------------------------------------------------
// Validate Master Template
// ---------------------------------------------------------------------------

/**
 * Validate Master Template structure.
 * Returns array of error strings (empty = valid).
 */
export function validateMasterTemplate(master: unknown): string[] {
  const errors: string[] = [];
  if (!master || typeof master !== 'object') {
    return ['Master must be an object'];
  }
  const m = master as Record<string, unknown>;
  if (typeof m.id !== 'string') errors.push('id must be string');
  if (typeof m.name !== 'string') errors.push('name must be string');
  if (typeof m.stylePackId !== 'string') errors.push('stylePackId must be string');
  if (!Array.isArray(m.pageStructure)) errors.push('pageStructure must be array');
  if (Array.isArray(m.pageStructure) && m.pageStructure.length === 0) errors.push('pageStructure must have at least 1 page');
  return errors;
}
