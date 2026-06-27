/**
 * Storage types for silse-mpi-editor.
 *
 * Layer: storage
 * Allowed imports: ../core (types only)
 *
 * Kontrak (Batch 7 / M7):
 *   Semua data yang disimpan ke localStorage atau di-export sebagai JSON
 *   harus dibungkus dalam envelope dengan schemaVersion.
 *   Jangan simpan data mentah tanpa envelope.
 */

import type { SimpleProject } from '../core/types';
import type { StylePack } from '../core/style-types';

export const STORAGE_SCHEMA_VERSION = 1 as const;

export type StoredProjectEnvelope = {
  schemaVersion: typeof STORAGE_SCHEMA_VERSION;
  savedAt: string;
  appVersion?: string;
  project: SimpleProject;
};

export type StoredStylePackEnvelope = {
  schemaVersion: typeof STORAGE_SCHEMA_VERSION;
  savedAt: string;
  stylePacks: StylePack[];
};

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export type LibraryEntry = {
  id: string;
  title: string;
  savedAt: string;
  role: string;
  pageCount: number;
};

export type StorageResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
