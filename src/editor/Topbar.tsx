import { useEditorStore } from '../store/editor-store';
import { Toolbar } from './Toolbar';

export function Topbar() {
  const project = useEditorStore((s) => s.project);
  const newProject = useEditorStore((s) => s.newProject);

  return (
    <header className="editor-topbar">
      <h1>SILSE MPI Editor</h1>
      <span style={{ color: 'var(--color-muted)', fontSize: 12 }}>{project.title}</span>
      <Toolbar />
      <div style={{ flex: 1 }} />
      <button onClick={() => newProject()} title="Buat project baru">
        + Project Baru
      </button>
    </header>
  );
}
