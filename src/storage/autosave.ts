/**
 * Autosave hook for silse-mpi-editor.
 *
 * Layer: storage
 * Allowed imports: ./project-storage, ./storage-types, ../store/editor-store, ../core/validation
 *
 * Kontrak (Batch 7 / M7 PATCH):
 *   - Autosave current project ke localStorage (debounced).
 *   - Jangan autosave preview runtime.
 *   - Jangan autosave invalid project.
 *   - Status: tersimpan / menyimpan / gagal menyimpan.
 *   - M7 PATCH: Tidak ada CommonJS dynamic require. Semua import static ESM.
 *   - M7 PATCH: Tidak ada auto-load startup. User pakai tombol 📂 Muat.
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
    // Skip first render (initial project load — no autosave on mount)
    if (isFirstRender.current) {
      isFirstRender.current = false;
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
