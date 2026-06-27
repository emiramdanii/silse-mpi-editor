/**
 * Storage layer for silse-mpi-editor.
 *
 * Layer: core
 * Allowed imports: ./types
 *
 * Thin wrapper around localStorage with JSON serialization.
 * For M0–M1 this is only used for autosave stubs; full save/load comes in M7.
 *
 * NOTE: This module is intentionally minimal. Do not grow it into a
 * full persistence layer until M7.
 */

import type { SimpleProject } from './types';

const STORAGE_KEY = 'silse-mpi-editor:project';

export function saveProject(project: SimpleProject): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  } catch {
    // Quota exceeded or storage disabled — fail silently for M0–M1.
  }
}

export function loadProject(): SimpleProject | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SimpleProject;
  } catch {
    return null;
  }
}

export function clearProject(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
