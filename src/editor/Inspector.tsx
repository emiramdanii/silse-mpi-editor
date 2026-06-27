import { useEditorStore } from '../store/editor-store';
import type { TextBlock } from '../core/types';
import type { TextBlockEditable } from '../core/block-factory';
import { TEXT_BLOCK_VARIANTS, type TextBlockVariant } from '../core/types';

/**
 * Inspector — M2 scope.
 *
 * Jika ada text block terpilih → tampilkan form editor:
 *   - text (textarea)
 *   - variant (selector, 7 pilihan)
 *   - x, y, width, height (geometry)
 *
 * Jika tidak ada block terpilih → tampilkan placeholder info halaman.
 *
 * TIDAK ada field fontSize/color/fontWeight/align manual — style datang
 * dari variant (lihat TextBlockView). Field override lokal baru di M6/M11.
 * Field untuk image/button block akan ditambahkan di M4/M5.
 */

const VARIANT_LABELS: Record<TextBlockVariant, string> = {
  title: 'Title (Judul)',
  subtitle: 'Subtitle (Sub-judul)',
  body: 'Body (Teks isi)',
  instruction: 'Instruction (Instruksi)',
  importantNote: 'Important Note (Catatan penting)',
  questionPrompt: 'Question Prompt (Pertanyaan)',
  reflectionBox: 'Reflection Box (Refleksi)',
};

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

      <Field label="Variant">
        <select
          data-field="variant"
          value={block.variant}
          onChange={(e) => onChange({ variant: e.target.value as TextBlockVariant })}
          style={{ width: '100%' }}
        >
          {TEXT_BLOCK_VARIANTS.map((v) => (
            <option key={v} value={v}>
              {VARIANT_LABELS[v]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Teks">
        <textarea
          data-field="text"
          value={block.text}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={4}
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

      <div className="block-editor__hint">
        <p>
          <strong>Style:</strong> otomatis dari variant <code>{block.variant}</code>.
        </p>
        <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>
          Field style manual (fontSize, color, dll) akan tersedia di M6/M11 via style adapter.
        </p>
      </div>
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
