import { useEditorStore } from '../store/editor-store';

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

export function CanvasStage() {
  const currentPage = useEditorStore((s) => s.project.pages.find((p) => p.id === s.project.currentPageId) ?? null);

  const bg =
    currentPage?.background.type === 'color'
      ? currentPage.background.color
      : currentPage?.background.type === 'gradient'
        ? currentPage.background.gradient
        : currentPage?.background.type === 'image'
          ? `url(${currentPage.background.imageSrc}) center/cover no-repeat`
          : '#ffffff';

  return (
    <main className="canvas-stage">
      <div
        className="canvas-frame"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          background: bg,
        }}
      >
        <div className="canvas-frame__label">
          {CANVAS_WIDTH} × {CANVAS_HEIGHT} · {currentPage?.title ?? '—'}
        </div>
        {currentPage && currentPage.blocks.length === 0 && (
          <div className="canvas-empty">
            <div className="canvas-empty__title">Halaman kosong</div>
            <div>Tambahkan text/image/button block mulai dari M2.</div>
          </div>
        )}
        {/* Block renderers will be added in M2/M4/M5 */}
      </div>
    </main>
  );
}
