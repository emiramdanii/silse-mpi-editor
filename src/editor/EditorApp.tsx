import { Topbar } from './Topbar';
import { PagePanel } from './PagePanel';
import { CanvasStage } from './CanvasStage';
import { Inspector } from './Inspector';
import { PreviewApp } from '../preview/PreviewApp';

export function EditorApp() {
  return (
    <div className="editor-app">
      <Topbar />
      <div className="editor-body">
        <PagePanel />
        <CanvasStage />
        <Inspector />
      </div>
      <PreviewApp />
    </div>
  );
}
