/**
 * LocalStorage adapter for silse-mpi-editor.
 *
 * Layer: storage
 * Allowed imports: ./storage-types
 *
 * Kontrak (Batch 7 / M7):
 *   - Semua write/read ke localStorage harus lewat fungsi adapter ini.
 *   - Adapter aman jika localStorage tidak tersedia (SSR/test).
 *   - Tangani JSON parse error dengan fallback aman.
 *   - Tidak boleh akses localStorage dari core.
 */

import type { StorageResult } from './storage-types';

const KEYS = {
  currentProject: 'silse.currentProject',
  savedProjects: 'silse.savedProjects',
  savedStylePacks: 'silse.savedStylePacks',
} as const;

export type StorageKey = keyof typeof KEYS;

function isLocalStorageAvailable(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    const test = '__silse_test__';
    localStorage.setItem(test, '1');
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

export function readKey<T>(key: StorageKey): StorageResult<T | null> {
  if (!isLocalStorageAvailable()) {
    return { ok: true, data: null };
  }
  try {
    const raw = localStorage.getItem(KEYS[key]);
    if (!raw) return { ok: true, data: null };
    const parsed = JSON.parse(raw) as T;
    return { ok: true, data: parsed };
  } catch (e) {
    return { ok: false, error: `Failed to parse ${key}: ${e instanceof Error ? e.message : 'unknown'}` };
  }
}

export function writeKey<T>(key: StorageKey, value: T): StorageResult<void> {
  if (!isLocalStorageAvailable()) {
    return { ok: false, error: 'localStorage not available' };
  }
  try {
    localStorage.setItem(KEYS[key], JSON.stringify(value));
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: `Failed to write ${key}: ${e instanceof Error ? e.message : 'unknown'}` };
  }
}

export function deleteKey(key: StorageKey): StorageResult<void> {
  if (!isLocalStorageAvailable()) {
    return { ok: false, error: 'localStorage not available' };
  }
  try {
    localStorage.removeItem(KEYS[key]);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: `Failed to delete ${key}: ${e instanceof Error ? e.message : 'unknown'}` };
  }
}

export { KEYS };
