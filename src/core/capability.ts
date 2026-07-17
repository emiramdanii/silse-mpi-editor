/**
 * Capability Matrix for silse-mpi-editor.
 *
 * Layer: core
 * Allowed imports: ./types
 *
 * Kontrak (docs/CORE_PRODUCT_CONTRACT.md section 4 + Batch 2R):
 *   Halaman menentukan komponen apa yang boleh ditambahkan.
 *   Bukan: semua halaman boleh tambah komponen yang sama.
 *
 * M2 scope: hanya text component yang ada. Tapi capability matrix sudah
 * lengkap untuk semua PageRole, sehingga M4/M5/M11 tinggal memperluas
 * allowedComponents.
 */

import type { ComponentType, PageRole } from './types';

export type PageRoleCapability = {
  role: PageRole;
  /** Tipe komponen yang diizinkan ditambahkan ke halaman dengan role ini. */
  allowedComponents: ReadonlyArray<ComponentType>;
  /** Boleh menambah komponen baru? false = halaman guided/controlled. */
  allowAddComponent: boolean;
  /**
   * Slot fixed untuk halaman guided (info-only di M2).
   * M11/M12 akan meng-enforce ini via template pedagogis.
   */
  fixedSlots?: ReadonlyArray<string>;
  /**
   * Deskripsi singkat untuk UI: apa peran halaman ini.
   */
  description: string;
};

/**
 * Default variant untuk text component berdasarkan PageRole.
 * Kontrak Batch 2R Scope D.
 */
export const DEFAULT_TEXT_VARIANT_BY_ROLE: Record<
  PageRole,
  import('./types').TextComponentVariant
> = {
  cover: 'title',
  guide: 'body',
  menu: 'body',
  starter: 'questionPrompt',
  activity: 'instruction',
  quiz: 'questionPrompt',
  reflection: 'reflectionBox',
  learningObjectives: 'body',
  material: 'body',
  closing: 'body',
  free: 'body',
};

/**
 * Capability matrix — satu entry per PageRole.
 *
 * M2: semua role mengizinkan hanya 'text'.
 * M4: material/activity/starter/free menambah 'image'+'card'.
 *     reflection menambah 'card' (tanpa image).
 * M5: material/activity/starter/free/reflection/closing menambah 'navigation'.
 *     cover tetap controlled. quiz belum (quiz engine belum ada).
 * M11: menambah 'question'.
 */
export const PAGE_ROLE_CAPABILITIES: Record<PageRole, PageRoleCapability> = {
  cover: {
    role: 'cover',
    // V2-PILAR-2: cover juga bisa tambah overlay (hotspot/input-field) di atas slide PNG
    allowedComponents: ['text', 'hotspot-overlay', 'input-field'],
    allowAddComponent: true,
    fixedSlots: ['title', 'subtitle', 'meta'],
    description: 'Halaman pembuka MPI',
  },
  guide: {
    role: 'guide',
    // LXC-02: add 'layered-info' for panduan berlapis (langkah-langkah dll).
    // V2-PILAR-2: add overlay components
    allowedComponents: ['text', 'card', 'navigation', 'layered-info', 'hotspot-overlay', 'input-field'],
    allowAddComponent: true,
    description: 'Panduan / petunjuk penggunaan MPI',
  },
  menu: {
    role: 'menu',
    // LXC-02: add 'layered-info' for menu berlapis (kategori materi dll).
    // V2-PILAR-2: add overlay components
    allowedComponents: ['text', 'card', 'navigation', 'layered-info', 'hotspot-overlay', 'input-field'],
    allowAddComponent: true,
    description: 'Menu / peta materi MPI',
  },
  learningObjectives: {
    role: 'learningObjectives',
    // UX-03 Patch-1: add 'navigation' so patterns can add "Lanjut →" button.
    // LXC-02: add 'layered-info' for Tujuan Pembelajaran berlapis
    // V2-PILAR-2: add overlay components
    allowedComponents: ['text', 'navigation', 'layered-info', 'learning-bridge', 'hotspot-overlay', 'input-field'],
    allowAddComponent: true,
    description: 'Tujuan pembelajaran',
  },
  starter: {
    role: 'starter',
    // V2-PILAR-2: add overlay components
    allowedComponents: ['text', 'image', 'card', 'navigation', 'learning-bridge', 'hotspot-overlay', 'input-field'],
    allowAddComponent: true,
    description: 'Pemantik / apersepsi',
  },
  material: {
    role: 'material',
    // LXC-02: add 'layered-info' for materi berlapis (progressive disclosure).
    // V2-PILAR-2: add overlay components
    allowedComponents: ['text', 'image', 'card', 'navigation', 'layered-info', 'learning-bridge', 'hotspot-overlay', 'input-field'],
    allowAddComponent: true,
    description: 'Materi utama',
  },
  activity: {
    role: 'activity',
    // V2-PILAR-2: add overlay components
    allowedComponents: ['text', 'image', 'card', 'navigation', 'game', 'learning-bridge', 'hotspot-overlay', 'input-field'],
    allowAddComponent: true,
    description: 'Aktivitas siswa',
  },
  quiz: {
    role: 'quiz',
    // UX-03 Patch-1: add 'navigation' so patterns can add "Berikutnya →" button.
    // V2-PILAR-2: add overlay components
    allowedComponents: ['text', 'question', 'game', 'navigation', 'learning-bridge', 'hotspot-overlay', 'input-field'],
    allowAddComponent: true,
    description: 'Evaluasi / kuis',
  },
  reflection: {
    role: 'reflection',
    // V2-PILAR-2: add overlay components
    allowedComponents: ['text', 'card', 'navigation', 'learning-bridge', 'hotspot-overlay', 'input-field'],
    allowAddComponent: true,
    description: 'Refleksi pembelajaran',
  },
  closing: {
    role: 'closing',
    // UX-03 Patch-1: add 'card' so patterns can add badge/rangkuman cards.
    // V2-PILAR-2: add overlay components
    allowedComponents: ['text', 'card', 'navigation', 'learning-bridge', 'hotspot-overlay', 'input-field'],
    allowAddComponent: true,
    description: 'Penutup',
  },
  free: {
    role: 'free',
    // V2-PILAR-2: tambah 'hotspot-overlay' dan 'input-field' untuk overlay
    // di atas slide PNG hasil impor Pilar 1.
    allowedComponents: ['text', 'image', 'card', 'navigation', 'question', 'game', 'hotspot-overlay', 'input-field'],
    allowAddComponent: true,
    description: 'Halaman bebas',
  },
};

/**
 * Get capability for a role. Always returns a valid capability
 * (throws if role is unknown — should never happen if validation passes).
 */
export function getCapability(role: PageRole): PageRoleCapability {
  const cap = PAGE_ROLE_CAPABILITIES[role];
  if (!cap) {
    throw new Error(`Unknown page role: ${role}`);
  }
  return cap;
}

/**
 * Can a component of `componentType` be added to a page with `role`?
 *
 * Returns false if:
 *   - role is unknown
 *   - allowAddComponent is false (guided page)
 *   - componentType is not in allowedComponents
 */
export function canAddComponent(role: PageRole, componentType: ComponentType): boolean {
  const cap = PAGE_ROLE_CAPABILITIES[role];
  if (!cap) return false;
  if (!cap.allowAddComponent) return false;
  return cap.allowedComponents.includes(componentType);
}

/**
 * Get the default text variant for a role.
 * Used by createTextComponent when no explicit variant is given.
 */
export function getDefaultTextVariantForRole(
  role: PageRole,
): import('./types').TextComponentVariant {
  return DEFAULT_TEXT_VARIANT_BY_ROLE[role] ?? 'body';
}
