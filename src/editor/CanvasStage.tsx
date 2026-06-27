import { useEditorStore } from '../store/editor-store';
import { isCardComponent, isImageComponent, isTextComponent } from '../components/component-utils';
import { TextComponentView } from '../components/TextComponentView';
import { ImageComponentView } from '../components/ImageComponentView';
import { CardComponentView } from '../components/CardComponentView';
import { getCapability } from '../core/capability';

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

export function CanvasStage() {
  const currentPage = useEditorStore(
    (s) => s.project.pages.find((p) => p.id === s.project.currentPageId) ?? null,
  );
  const selectedComponentId = useEditorStore((s) => s.selectedComponentId);
  const selectComponent = useEditorStore((s) => s.selectComponent);

  const bg =
    currentPage?.background.type === 'color'
      ? currentPage.background.color
      : currentPage?.background.type === 'gradient'
        ? currentPage.background.gradient
        : currentPage?.background.type === 'image'
          ? `url(${currentPage.background.imageSrc}) center/cover no-repeat`
          : '#ffffff';

  const capability = currentPage ? getCapability(currentPage.role) : null;
  const canAdd = capability?.allowAddComponent ?? false;

  return (
    <main className="canvas-stage">
      <div
        className="canvas-frame"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          background: bg,
        }}
        onClick={() => selectComponent(null)}
      >
        <div className="canvas-frame__label">
          {CANVAS_WIDTH} × {CANVAS_HEIGHT} · {currentPage?.title ?? '—'} ·{' '}
          {currentPage ? `role: ${currentPage.role}, layout: ${currentPage.layoutId}` : ''}
        </div>

        {currentPage && currentPage.components.length === 0 && (
          <div className="canvas-empty">
            <div className="canvas-empty__title">
              {canAdd ? 'Halaman kosong' : `Halaman ${currentPage.role} (terpandu)`}
            </div>
            <div>
              {canAdd
                ? 'Klik tombol + Teks / + Gambar / + Kartu di toolbar untuk menambah elemen pembelajaran.'
                : 'Elemen halaman terpandu akan diisi via template pedagogis (M11/M12).'}
            </div>
          </div>
        )}

        {currentPage?.components.map((component) => {
          if (isTextComponent(component)) {
            return (
              <TextComponentView
                key={component.id}
                component={component}
                selected={component.id === selectedComponentId}
                onSelect={selectComponent}
              />
            );
          }
          if (isImageComponent(component)) {
            return (
              <ImageComponentView
                key={component.id}
                component={component}
                selected={component.id === selectedComponentId}
                onSelect={selectComponent}
              />
            );
          }
          if (isCardComponent(component)) {
            return (
              <CardComponentView
                key={component.id}
                component={component}
                selected={component.id === selectedComponentId}
                onSelect={selectComponent}
              />
            );
          }
          // Navigation components render in M5.
          return null;
        })}
      </div>
    </main>
  );
}
