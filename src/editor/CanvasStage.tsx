import { useEditorStore } from '../store/editor-store';
import { isTextBlock } from '../blocks/block-utils';
import { TextBlockView } from '../blocks/TextBlockView';

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

export function CanvasStage() {
  const currentPage = useEditorStore((s) => s.project.pages.find((p) => p.id === s.project.currentPageId) ?? null);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const selectBlock = useEditorStore((s) => s.selectBlock);

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
        onClick={() => selectBlock(null)}
      >
        <div className="canvas-frame__label">
          {CANVAS_WIDTH} × {CANVAS_HEIGHT} · {currentPage?.title ?? '—'}
        </div>

        {currentPage && currentPage.blocks.length === 0 && (
          <div className="canvas-empty">
            <div className="canvas-empty__title">Halaman kosong</div>
            <div>Klik tombol + Teks di toolbar untuk menambah block.</div>
          </div>
        )}

        {currentPage?.blocks.map((block) => {
          if (isTextBlock(block)) {
            return (
              <TextBlockView
                key={block.id}
                block={block}
                selected={block.id === selectedBlockId}
                onSelect={selectBlock}
              />
            );
          }
          // Image and button blocks render in M4/M5.
          return null;
        })}
      </div>
    </main>
  );
}
