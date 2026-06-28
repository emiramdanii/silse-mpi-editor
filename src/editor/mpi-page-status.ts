/**
 * Per-page MPI status computation (UX-02 — Learning Flow Status).
 *
 * Layer: editor
 * Allowed imports: ../core/types (type-only)
 *
 * Kontrak (UX-02 Scope A):
 *   Hitung status per halaman berdasarkan peran + isi komponen.
 *   Output dipakai PagePanel untuk menampilkan badge (✓/⚠/✗) dan
 *   daftar masalah inline — supaya guru tahu masalah tanpa harus klik Export.
 *
 *   Aturan per halaman (mengacu checkMpiStandard di core, tetapi scoped
 *   per page — bukan global):
 *
 *   ┌──────────────────────┬──────────────────────────────────────────┐
 *   │ Role                 │ Aturan status                            │
 *   ├──────────────────────┼──────────────────────────────────────────┤
 *   │ cover                │ butuh ≥1 komponen teks (judul)           │
 *   │ guide                │ idealnya ≥1 teks/kartu                   │
 *   │ learningObjectives   │ butuh ≥1 teks; idealnya baca objectives  │
 *   │ menu                 │ idealnya ≥1 teks/kartu                   │
 *   │ starter              │ idealnya ≥1 komponen konten              │
 *   │ material             │ butuh ≥1 teks/gambar/kartu + navigation  │
 *   │ activity             │ butuh ≥1 game + navigation               │
 *   │ quiz                 │ butuh ≥1 question + navigation           │
 *   │ reflection           │ idealnya ≥1 teks/kartu                   │
 *   │ closing              │ idealnya ≥1 teks                         │
 *   │ free                 │ selalu ok (bebas)                        │
 *   └──────────────────────┴──────────────────────────────────────────┘
 *
 *   Aturan tambahan untuk semua halaman:
 *     - Question component: feedbackCorrect + feedbackWrong tidak kosong
 *     - Game component: setiap mission feedbackCorrect/Wrong ≥3 karakter
 *
 *   Status:
 *     - 'ok'      : tidak ada masalah
 *     - 'warning' : ada masalah tetapi halaman masih bisa dipakai
 *     - 'error'   : halaman belum memenuhi syarat wajib perannya
 *
 *   Catatan: ini HANYA tampilan UI. Tidak menambah/mengubah contract
 *   checkMpiStandard di core. checkMpiStandard tetap sumber kebenaran
 *   untuk export guard.
 */

import type { SimplePage } from '../core/types';

export type PageStatusLevel = 'ok' | 'warning' | 'error';

export type PageIssue = {
  level: PageStatusLevel;
  message: string;
};

export type PageStatus = {
  pageId: string;
  level: PageStatusLevel;
  issues: PageIssue[];
};

/**
 * Hitung status satu halaman.
 */
export function computePageStatus(page: SimplePage): PageStatus {
  const issues: PageIssue[] = [];

  // Aturan tambahan: feedback question/game
  for (const comp of page.components) {
    if (comp.type === 'question') {
      const q = comp as {
        feedbackCorrect: string;
        feedbackWrong: string;
        prompt?: string;
        title?: string;
      };
      const label = q.title || q.prompt || 'Soal ini';
      if (!q.feedbackCorrect || q.feedbackCorrect.trim().length === 0) {
        issues.push({
          level: 'warning',
          message: `Question "${label}" belum punya feedback benar.`,
        });
      }
      if (!q.feedbackWrong || q.feedbackWrong.trim().length === 0) {
        issues.push({
          level: 'warning',
          message: `Question "${label}" belum punya feedback salah.`,
        });
      }
    }
    if (comp.type === 'game') {
      const g = comp as {
        missions: {
          feedbackCorrect: string;
          feedbackWrong: string;
          prompt: string;
          title: string;
        }[];
      };
      for (const m of g.missions) {
        const label = m.title || m.prompt || 'Misi ini';
        if (!m.feedbackCorrect || m.feedbackCorrect.trim().length < 3) {
          issues.push({
            level: 'warning',
            message: `Misi "${label}" feedback benar terlalu pendek.`,
          });
        }
        if (!m.feedbackWrong || m.feedbackWrong.trim().length < 3) {
          issues.push({
            level: 'warning',
            message: `Misi "${label}" feedback salah terlalu pendek.`,
          });
        }
      }
    }
  }

  // Aturan per role
  switch (page.role) {
    case 'cover': {
      // Cover butuh ≥1 teks (judul)
      const hasText = page.components.some((c) => c.type === 'text');
      if (!hasText) {
        issues.push({
          level: 'error',
          message: 'Cover belum punya teks judul.',
        });
      }
      break;
    }
    case 'guide': {
      const hasContent = page.components.some(
        (c) => c.type === 'text' || c.type === 'card' || c.type === 'layered-info',
      );
      if (!hasContent) {
        issues.push({
          level: 'warning',
          message: 'Panduan belum punya teks atau kartu petunjuk.',
        });
      }
      break;
    }
    case 'learningObjectives': {
      // LXC-02: layered-info juga hitung sebagai konten (Tujuan Lengkap Berlapis)
      const hasText = page.components.some(
        (c) => c.type === 'text' || c.type === 'layered-info',
      );
      if (!hasText) {
        issues.push({
          level: 'error',
          message: 'Tujuan Pembelajaran belum punya teks.',
        });
      }
      break;
    }
    case 'menu': {
      const hasContent = page.components.some(
        (c) => c.type === 'text' || c.type === 'card' || c.type === 'layered-info',
      );
      if (!hasContent) {
        issues.push({
          level: 'warning',
          message: 'Menu belum punya teks atau kartu menu.',
        });
      }
      break;
    }
    case 'starter': {
      const hasContent = page.components.some(
        (c) =>
          c.type === 'text' ||
          c.type === 'image' ||
          c.type === 'card',
      );
      if (!hasContent) {
        issues.push({
          level: 'warning',
          message: 'Pemantik belum punya konten (teks/gambar/kartu).',
        });
      }
      break;
    }
    case 'material': {
      const hasContent = page.components.some(
        (c) =>
          c.type === 'text' ||
          c.type === 'image' ||
          c.type === 'card' ||
          c.type === 'layered-info',
      );
      if (!hasContent) {
        issues.push({
          level: 'error',
          message: 'Materi belum punya konten (teks/gambar/kartu).',
        });
      }
      const hasNav = page.components.some((c) => c.type === 'navigation');
      if (!hasNav) {
        issues.push({
          level: 'warning',
          message: 'Materi belum punya tombol navigasi keluar.',
        });
      }
      break;
    }
    case 'activity': {
      const hasGame = page.components.some((c) => c.type === 'game');
      if (!hasGame) {
        issues.push({
          level: 'error',
          message: 'Aktivitas belum punya game atau misi interaktif.',
        });
      }
      const hasNav = page.components.some((c) => c.type === 'navigation');
      if (!hasNav) {
        issues.push({
          level: 'warning',
          message: 'Aktivitas belum punya tombol navigasi keluar.',
        });
      }
      break;
    }
    case 'quiz': {
      const hasQuestion = page.components.some((c) => c.type === 'question');
      if (!hasQuestion) {
        issues.push({
          level: 'error',
          message: 'Kuis belum punya pertanyaan.',
        });
      }
      const hasNav = page.components.some((c) => c.type === 'navigation');
      if (!hasNav) {
        issues.push({
          level: 'warning',
          message: 'Kuis belum punya tombol navigasi keluar.',
        });
      }
      break;
    }
    case 'reflection': {
      const hasContent = page.components.some(
        (c) => c.type === 'text' || c.type === 'card',
      );
      if (!hasContent) {
        issues.push({
          level: 'warning',
          message: 'Refleksi belum punya teks atau kartu refleksi.',
        });
      }
      break;
    }
    case 'closing': {
      const hasText = page.components.some((c) => c.type === 'text');
      if (!hasText) {
        issues.push({
          level: 'warning',
          message: 'Penutup belum punya teks penutup.',
        });
      }
      break;
    }
    case 'free':
      // Halaman bebas tidak punya aturan wajib
      break;
  }

  // Tentukan level agregat: error menang dari warning
  const hasError = issues.some((i) => i.level === 'error');
  const hasWarning = issues.some((i) => i.level === 'warning');
  const level: PageStatusLevel = hasError
    ? 'error'
    : hasWarning
      ? 'warning'
      : 'ok';

  return {
    pageId: page.id,
    level,
    issues,
  };
}

/**
 * Hitung status untuk SEMUA halaman di project.
 * Mengembalikan map pageId → PageStatus.
 */
export function computeAllPageStatuses(
  pages: SimplePage[],
): Record<string, PageStatus> {
  const result: Record<string, PageStatus> = {};
  for (const page of pages) {
    result[page.id] = computePageStatus(page);
  }
  return result;
}

/**
 * Ringkasan agregat untuk header PagePanel.
 */
export type LearningFlowSummary = {
  total: number;
  ok: number;
  warning: number;
  error: number;
  /** true kalau semua halaman ok (tidak ada warning/error) */
  allOk: boolean;
};

export function computeLearningFlowSummary(
  statuses: Record<string, PageStatus>,
): LearningFlowSummary {
  const all = Object.values(statuses);
  const ok = all.filter((s) => s.level === 'ok').length;
  const warning = all.filter((s) => s.level === 'warning').length;
  const error = all.filter((s) => s.level === 'error').length;
  return {
    total: all.length,
    ok,
    warning,
    error,
    allOk: warning === 0 && error === 0,
  };
}

/**
 * Label singkat untuk level status (dipakai di badge).
 */
export function statusLabel(level: PageStatusLevel): string {
  switch (level) {
    case 'ok':
      return 'Lengkap';
    case 'warning':
      return 'Perlu perhatian';
    case 'error':
      return 'Belum lengkap';
  }
}

/**
 * Ikon untuk level status (dipakai di badge).
 */
export function statusIcon(level: PageStatusLevel): string {
  switch (level) {
    case 'ok':
      return '✓';
    case 'warning':
      return '⚠';
    case 'error':
      return '✗';
  }
}
