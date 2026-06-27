/**
 * Autosave hook for silse-mpi-editor.
 *
 * Layer: storage
 * Allowed imports: ./project-storage, ./storage-types, ../store/editor-store, ../core/validation
 *
 * Kontrak (Batch 7 / M7):
 *   - Autosave current project ke localStorage (debounced).
 *   - Jangan autosave preview runtime.
 *   - Jangan autosave invalid project.
 *   - Status: tersimpan / menyimpan / gagal menyimpan.
 */

import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../store/editor-store';
import { saveCurrentProject } from './project-storage';
import { isValidProject } from '../core/validation';
import type { SaveStatus } from './storage-types';

const AUTOSAVE_DEBOUNCE_MS = 1000;

export function useAutosave(): { status: SaveStatus; error: string | null } {
  const project = useEditorStore((s) => s.project);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip first render (initial project load)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      // Try to load saved project on first render
      return;
    }

    // Don't autosave invalid project
    if (!isValidProject(project)) {
      return;
    }

    // Debounce
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setStatus('saving');
    setError(null);

    timeoutRef.current = setTimeout(() => {
      const result = saveCurrentProject(project);
      if (result.ok) {
        setStatus('saved');
      } else {
        setStatus('error');
        setError(result.error);
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [project]);

  return { status, error };
}

/**
 * Load saved project from localStorage on app startup.
 * Returns null if no saved project or if invalid.
 */
export function loadSavedProjectOnStartup() {
  // Lazy import to avoid circular dependency
  const { loadCurrentProject } = require('./project-storage');
  const result = loadCurrentProject();
  if (result.ok && result.data) {
    return result.data;
  }
  return null;
}
