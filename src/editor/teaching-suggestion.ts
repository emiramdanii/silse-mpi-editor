/**
 * Smart Teaching Suggestion engine (UX-03).
 *
 * Layer: editor
 * Allowed imports: ../core/types (type-only), ./content-patterns, ./mpi-page-status
 *
 * Kontrak (UX-03 Scope B):
 *   Engine yang memeriksa kondisi halaman + menentukan pola mana yang
 *   disarankan + urutan prioritasnya.
 *
 *   Logika:
 *     1. Halaman KOSONG → sarankan pola primary dengan prioritas 'primary',
 *        pola lain sebagai 'secondary'.
 *     2. Halaman PUNYA MASALAH (warning/error dari computePageStatus) →
 *        sarankan pola primary dengan reason "melengkapi", prioritas 'primary'.
 *     3. Halaman SUDAH OK → sarankan pola alternatif (secondary), dengan
 *        reason "opsi lain".
 *     4. Role 'free' → tidak ada saran khusus (bebas).
 *
 *   Output: array TeachingSuggestion, urut prioritas primary dulu.
 */

import type { SimplePage, SimpleProject } from '../core/types';
import type { ContentPattern } from './content-patterns';
import { getPatternsForRole } from './content-patterns';
import { computePageStatus } from './mpi-page-status';
import { getRoleInfo } from './mpi-standard-roles';

export type SuggestionPriority = 'primary' | 'secondary';

export type TeachingSuggestion = {
  pattern: ContentPattern;
  /** Alasan kenapa pola ini disarankan (ramah guru). */
  reason: string;
  priority: SuggestionPriority;
};

export type PageSuggestionContext = {
  /** 'empty' = halaman kosong, 'has-issues' = ada warning/error, 'ok' = lengkap. */
  pageState: 'empty' | 'has-issues' | 'ok';
  /** Label ramah guru untuk role halaman, mis. "Materi". */
  roleLabel: string;
};

/**
 * Klasifikasi kondisi halaman.
 */
export function classifyPageState(page: SimplePage): PageSuggestionContext['pageState'] {
  if (page.components.length === 0) return 'empty';
  const status = computePageStatus(page);
  if (status.issues.length > 0) return 'has-issues';
  return 'ok';
}

/**
 * Hasilkan saran pola untuk halaman tertentu.
 *
 * @param page Halaman yang sedang dilihat guru.
 * @param project Project (untuk akses curriculum di pattern buildComponents).
 * @returns Array suggestion, urut primary dulu.
 */
export function suggestPatternsForPage(
  page: SimplePage,
  _project: SimpleProject,
): TeachingSuggestion[] {
  const patterns = getPatternsForRole(page.role);
  if (patterns.length === 0) return [];

  const pageState = classifyPageState(page);
  const roleInfo = getRoleInfo(page.role);
  const roleLabel = roleInfo.label;

  if (pageState === 'empty') {
    // Halaman kosong → pola pertama = primary, sisanya secondary.
    return patterns.map((pattern, idx) => ({
      pattern,
      reason: idx === 0
        ? `Halaman ${roleLabel} masih kosong. Pola "${pattern.name}" siap diterapkan.`
        : `Atau coba pola alternatif: "${pattern.name}".`,
      priority: (idx === 0 ? 'primary' : 'secondary') as SuggestionPriority,
    }));
  }

  if (pageState === 'has-issues') {
    // Halaman punya masalah → sarankan primary untuk "melengkapi".
    return patterns.map((pattern, idx) => ({
      pattern,
      reason: idx === 0
        ? `Halaman ${roleLabel} belum lengkap. Pola "${pattern.name}" bisa melengkapi.`
        : `Atau terapkan pola alternatif: "${pattern.name}".`,
      priority: (idx === 0 ? 'primary' : 'secondary') as SuggestionPriority,
    }));
  }

  // pageState === 'ok' → halaman sudah lengkap, tampilkan pola sebagai alternatif.
  return patterns.map((pattern) => ({
    pattern,
    reason: `Halaman sudah lengkap. Pola "${pattern.name}" tersedia sebagai alternatif.`,
    priority: 'secondary' as SuggestionPriority,
  }));
}

/**
 * Header text untuk section saran, bergantung kondisi halaman.
 */
export function getSuggestionHeader(pageState: PageSuggestionContext['pageState']): string {
  switch (pageState) {
    case 'empty':
      return 'Saran Isi';
    case 'has-issues':
      return 'Saran Pelengkap';
    case 'ok':
      return 'Pola Alternatif';
  }
}

/**
 * Sub-header text — penjelasan singkat section.
 */
export function getSuggestionSubHeader(pageState: PageSuggestionContext['pageState']): string {
  switch (pageState) {
    case 'empty':
      return 'Pilih pola isi untuk mengisi halaman ini dengan cepat.';
    case 'has-issues':
      return 'Pola ini dapat membantu melengkapi halaman.';
    case 'ok':
      return 'Halaman sudah lengkap. Pola tersedia sebagai alternatif jika ingin mencoba variasi lain.';
  }
}
