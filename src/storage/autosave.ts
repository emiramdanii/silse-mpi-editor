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
 *   - AUDIT 4.3: Flush pending save on tab close / hide via beforeunload +
 *     visibilitychange + pagehide. Previously, closing the tab during the
 *     1-second debounce window silently dropped the user's last edits.
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
  // AUDIT 4.3: keep latest project in a ref so the beforeunload/visibilitychange
  // handlers can flush synchronously without stale closure.
  const projectRef = useRef(project);
  projectRef.current = project;

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

  // AUDIT 4.3: Flush pending save on tab close / page hide.
  // The debounced setTimeout will not fire if the tab is closed mid-window,
  // so we register a synchronous flush on beforeunload + visibilitychange
  // (hidden) + pagehide. localStorage.setItem is synchronous, so this runs
  // before the browser tears down the page.
  useEffect(() => {
    function flushPendingSave() {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        const currentProject = projectRef.current;
        if (isValidProject(currentProject)) {
          // Synchronous save — no status update (page is tearing down).
          saveCurrentProject(currentProject);
        }
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        flushPendingSave();
      }
    }

    window.addEventListener('beforeunload', flushPendingSave);
    window.addEventListener('pagehide', flushPendingSave);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', flushPendingSave);
      window.removeEventListener('pagehide', flushPendingSave);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return { status, error };
}
