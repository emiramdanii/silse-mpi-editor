import { Topbar } from './Topbar';
import { PagePanel } from './PagePanel';
import { CanvasStage } from './CanvasStage';
import { Inspector } from './Inspector';
import { PreviewApp } from '../preview/PreviewApp';
import { useAutosave } from '../storage/autosave';

export function EditorApp() {
  const { status, error } = useAutosave();

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
