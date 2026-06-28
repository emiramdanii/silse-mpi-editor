/**
 * MPI Standard Role metadata for UX-01 guided editor.
 *
 * Layer: editor (UI only — no semantic meaning to core).
 * Allowed imports: ../core/types (type-only)
 *
 * Kontrak (UX-01):
 *   10 peran halaman standar MPI dikelompokkan jadi 3 fase pembelajaran:
 *     - Pembukaan: cover, panduan, tujuan, menu
 *     - Inti:      pemantik, materi, kuis, game
 *     - Penutup:   refleksi, penutup
 *
 *   Metadata ini HANYA untuk tampilan UI (label ramah guru, ikon, deskripsi).
 *   Tidak menambah/mengubah PageRole di core/types.
 */

import type { PageRole } from '../core/types';

export type MpiStandardRoleInfo = {
  role: PageRole;
  /** Label ramah guru, bukan teknis. */
  label: string;
  /** Label sangat pendek untuk chip/strip. */
  short: string;
  /** Emoji ikon (sederhana, tidak butuh aset). */
  icon: string;
  /** Deskripsi 1 baris: apa yang dilakukan di halaman ini. */
  hint: string;
  /** Fase pembelajaran untuk grouping. */
  phase: 'pembukaan' | 'inti' | 'penutup';
};

export const MPI_STANDARD_ROLES: readonly MpiStandardRoleInfo[] = [
  { role: 'cover',              label: 'Halaman Cover',         short: 'Cover',    icon: '🎬', hint: 'Pembuka pertama yang siswa lihat.', phase: 'pembukaan' },
  { role: 'guide',              label: 'Panduan Penggunaan',    short: 'Panduan',  icon: '📖', hint: 'Petunjuk cara belajar dengan MPI ini.', phase: 'pembukaan' },
  { role: 'learningObjectives', label: 'Tujuan Pembelajaran',   short: 'Tujuan',   icon: '🎯', hint: 'Apa yang akan siswa capai.', phase: 'pembukaan' },
  { role: 'menu',               label: 'Menu Materi',           short: 'Menu',     icon: '🗂️', hint: 'Peta isi MPI untuk navigasi siswa.', phase: 'pembukaan' },
  { role: 'starter',            label: 'Pemantik',              short: 'Pemantik', icon: '💡', hint: 'Refleksi awal / apersepsi siswa.', phase: 'inti' },
  { role: 'material',           label: 'Materi',                short: 'Materi',   icon: '📚', hint: 'Penjelasan inti pelajaran.', phase: 'inti' },
  { role: 'quiz',               label: 'Kuis',                  short: 'Kuis',     icon: '✏️', hint: 'Evaluasi pemahaman siswa.', phase: 'inti' },
  { role: 'activity',           label: 'Aktivitas / Game',      short: 'Game',     icon: '🎮', hint: 'Latihan interaktif atau misi.', phase: 'inti' },
  { role: 'reflection',         label: 'Refleksi',              short: 'Refleksi', icon: '🪞', hint: 'Siswa merenungkan pembelajaran.', phase: 'penutup' },
  { role: 'closing',            label: 'Penutup',               short: 'Penutup',  icon: '🎓', hint: 'Penutup & apresiasi.', phase: 'penutup' },
];

export const MPI_PHASE_LABELS: Record<MpiStandardRoleInfo['phase'], string> = {
  pembukaan: 'Pembukaan',
  inti: 'Inti Pembelajaran',
  penutup: 'Penutup',
};

/**
 * Cek apakah suatu PageRole termasuk 10 peran standar MPI.
 * (role 'free' TIDAK termasuk standar — bebas, bukan pedagogis).
 */
export function isStandardRole(role: PageRole): boolean {
  return MPI_STANDARD_ROLES.some((r) => r.role === role);
}

/**
 * Info metadata untuk suatu role. Default ke 'free' fallback kalau role tidak standar.
 */
export function getRoleInfo(role: PageRole): MpiStandardRoleInfo {
  return (
    MPI_STANDARD_ROLES.find((r) => r.role === role) ?? {
      role: 'free',
      label: 'Halaman Bebas',
      short: 'Bebas',
      icon: '📄',
      hint: 'Halaman bebas — bebas tentukan perannya.',
      phase: 'inti',
    }
  );
}

/**
 * Hitung statistik coverage standar MPI dari daftar role yang ada.
 */
export type MpiCoverage = {
  /** Daftar role standar yang sudah ada di project. */
  present: PageRole[];
  /** Daftar role standar yang BELUM ada di project. */
  missing: PageRole[];
  /** Jumlah role standar yang sudah ada / total standar (10). */
  ratio: string;
};

export function computeMpiCoverage(roles: PageRole[]): MpiCoverage {
  const present = MPI_STANDARD_ROLES
    .map((r) => r.role)
    .filter((stdRole) => roles.includes(stdRole));
  const missing = MPI_STANDARD_ROLES
    .map((r) => r.role)
    .filter((stdRole) => !roles.includes(stdRole));
  return {
    present,
    missing,
    ratio: `${present.length}/${MPI_STANDARD_ROLES.length}`,
  };
}
