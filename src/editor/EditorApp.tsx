import { useEffect } from 'react';
import { Topbar } from './Topbar';
import { PagePanel } from './PagePanel';
import { CanvasStage } from './CanvasStage';
import { Inspector } from './Inspector';
import { PreviewApp } from '../preview/PreviewApp';
import { useAutosave } from '../storage/autosave';
import { initHistory, useUndoRedoKeyboard } from '../store/undo-redo';
import { useEditorStore } from '../store/editor-store';
import { loadCurrentProject } from '../storage/project-storage';

let hasAttemptedInitialLoad = false;

export function EditorApp() {
  const { status, error } = useAutosave();

  useEffect(() => {
    initHistory();
  }, []);
  useUndoRedoKeyboard();

  // AUTO-LOAD-ON-MOUNT: Load saved project from localStorage on first mount.
  // Sebelumnya: editor mulai dengan project kosong → autosave overwrite saved project.
  // Fix: auto-load saved project. Jika tidak ada, tetap pakai default.
  useEffect(() => {
    if (hasAttemptedInitialLoad) return;
    hasAttemptedInitialLoad = true;
    const result = loadCurrentProject();
    if (result.ok && result.data) {
      useEditorStore.getState().loadCurrent();
    }
  }, []);

  return (
    <div className="editor-app">
      <Topbar />
      <div className="editor-body">
        <PagePanel />
        <CanvasStage />
        <Inspector />
      </div>
      {status === 'saving' && (
        <div className="autosave-status autosave-status--saving">Menyimpan...</div>
      )}
      {status === 'saved' && (
        <div className="autosave-status autosave-status--saved">Tersimpan</div>
      )}
      {status === 'error' && (
        <div className="autosave-status autosave-status--error">
          Gagal menyimpan: {error}
        </div>
      )}
      <PreviewApp />
    </div>
  );
}
