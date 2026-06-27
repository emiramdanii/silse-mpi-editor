import { useEditorStore } from '../store/editor-store';
import type { TextBlock } from '../core/types';
import type { TextBlockEditable } from '../core/block-factory';

/**
 * Inspector — M2 scope.
 *
 * Jika ada text block terpilih → tampilkan form editor:
 *   text, x, y, width, height, fontSize, color, fontWeight, align.
 *
 * Jika tidak ada block terpilih → tampilkan placeholder info halaman.
 *
 * Field untuk image/button block akan ditambahkan di M4/M5.
 */

export function Inspector() {
  const currentPage = useEditorStore((s) => s.project.pages.find((p) => p.id === s.project.currentPageId) ?? null);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const selectedBlock = useEditorStore((s) => {
    if (!s.selectedBlockId) return null;
    const page = s.project.pages.find((p) => p.id === s.project.currentPageId);
    if (!page) return null;
    const b = page.blocks.find((blk) => blk.id === s.selectedBlockId);
    return b && b.type === 'text' ? (b as TextBlock) : null;
  });
  const updateTextBlock = useEditorStore((s) => s.updateTextBlock);

  const update = (patch: Partial<TextBlockEditable>) => {
    if (selectedBlockId) updateTextBlock(selectedBlockId, patch);
  };

  return (
    <aside className="inspector">
      <div className="inspector__head">Inspector</div>
      <div className="inspector__body">
        {!currentPage ? (
          <div className="inspector-placeholder">
            <p>Tidak ada halaman terpilih.</p>
          </div>
        ) : !selectedBlock ? (
          <div className="inspector-placeholder">
            <p>
              <strong>Halaman:</strong> {currentPage.title}
            </p>
            <p>
              <strong>ID:</strong> {currentPage.id}
            </p>
            <p>
              <strong>Jumlah block:</strong> {currentPage.blocks.length}
            </p>
            <p style={{ marginTop: 16, fontStyle: 'italic' }}>
              Klik block di canvas untuk mengedit. Klik + Teks di toolbar untuk menambah.
            </p>
          </div>
        ) : (
          <TextBlockEditor block={selectedBlock} onChange={update} />
        )}
      </div>
    </aside>
  );
}

function TextBlockEditor({
  block,
  onChange,
}: {
  block: TextBlock;
  onChange: (patch: Partial<TextBlockEditable>) => void;
}) {
  return (
    <div className="block-editor">
      <div className="block-editor__head">
        <span className="block-editor__type">Text Block</span>
        <span className="block-editor__id">{block.id.slice(0, 12)}…</span>
      </div>

      <Field label="Teks">
        <textarea
          data-field="text"
          value={block.text}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={3}
          style={{ width: '100%', resize: 'vertical' }}
        />
      </Field>

      <div className="field-row">
        <Field label="X">
          <input
            type="number"
            data-field="x"
            value={block.x}
            onChange={(e) => onChange({ x: Number(e.target.value) })}
          />
        </Field>
        <Field label="Y">
          <input
            type="number"
            data-field="y"
            value={block.y}
            onChange={(e) => onChange({ y: Number(e.target.value) })}
          />
        </Field>
      </div>

      <div className="field-row">
        <Field label="Lebar">
          <input
            type="number"
            data-field="width"
            value={block.width}
            onChange={(e) => onChange({ width: Number(e.target.value) })}
          />
        </Field>
        <Field label="Tinggi">
          <input
            type="number"
            data-field="height"
            value={block.height}
            onChange={(e) => onChange({ height: Number(e.target.value) })}
          />
        </Field>
      </div>

      <div className="field-row">
        <Field label="Font Size">
          <input
            type="number"
            data-field="fontSize"
            value={block.fontSize}
            onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
          />
        </Field>
        <Field label="Warna">
          <input
            type="color"
            data-field="color"
            value={block.color}
            onChange={(e) => onChange({ color: e.target.value })}
            style={{ width: '100%', height: 32, padding: 0 }}
          />
        </Field>
      </div>

      <Field label="Font Weight">
        <select
          data-field="fontWeight"
          value={block.fontWeight}
          onChange={(e) => onChange({ fontWeight: e.target.value as TextBlock['fontWeight'] })}
          style={{ width: '100%' }}
        >
          <option value="normal">Normal</option>
          <option value="bold">Bold</option>
        </select>
      </Field>

      <Field label="Align">
        <div className="field-segmented" data-field="align">
          {(['left', 'center', 'right'] as const).map((a) => (
            <button
              key={a}
              className={block.align === a ? 'is-active' : ''}
              onClick={() => onChange({ align: a })}
              type="button"
            >
              {a}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
    </label>
  );
}
