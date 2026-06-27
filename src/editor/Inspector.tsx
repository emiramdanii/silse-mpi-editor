import { useEditorStore } from '../store/editor-store';
import type { SimplePage, TextComponent } from '../core/types';
import type { TextComponentEditable } from '../core/component-factory';
import { TEXT_COMPONENT_VARIANTS, type TextComponentVariant } from '../core/types';
import { getCapability } from '../core/capability';

/**
 * Inspector — M2R scope.
 *
 * Jika ada text component terpilih → tampilkan form editor:
 *   - Jenis teks (variant selector, 7 pilihan dengan label Indonesia)
 *   - Teks (textarea)
 *   - X, Y, Lebar, Tinggi (geometry)
 *
 * Jika tidak ada component terpilih → tampilkan placeholder info halaman
 * (termasuk role + status capability).
 *
 * Naming: UI uses "elemen", NOT "block".
 *
 * TIDAK ada field fontSize/color/fontWeight/align manual — style datang
 * dari variant (lihat TextComponentView). Field override lokal baru di M6/M11.
 * Field untuk image/navigation component akan ditambahkan di M4/M5.
 */

const VARIANT_LABELS: Record<TextComponentVariant, string> = {
  title: 'Judul',
  subtitle: 'Sub-judul',
  body: 'Isi materi',
  instruction: 'Instruksi',
  importantNote: 'Catatan penting',
  questionPrompt: 'Pertanyaan',
  reflectionBox: 'Refleksi',
};

const ROLE_LABELS: Record<string, string> = {
  cover: 'Cover (pembuka)',
  learningObjectives: 'Tujuan Pembelajaran',
  starter: 'Pemantik',
  material: 'Materi',
  activity: 'Aktivitas',
  quiz: 'Kuis',
  reflection: 'Refleksi',
  closing: 'Penutup',
  free: 'Bebas',
};

export function Inspector() {
  const currentPage = useEditorStore(
    (s) => s.project.pages.find((p) => p.id === s.project.currentPageId) ?? null,
  );
  const selectedComponentId = useEditorStore((s) => s.selectedComponentId);
  const selectedComponent = useEditorStore((s) => {
    if (!s.selectedComponentId) return null;
    const page = s.project.pages.find((p) => p.id === s.project.currentPageId);
    if (!page) return null;
    const c = page.components.find((comp) => comp.id === s.selectedComponentId);
    return c && c.type === 'text' ? (c as TextComponent) : null;
  });
  const updateTextComponent = useEditorStore((s) => s.updateTextComponent);

  const update = (patch: Partial<TextComponentEditable>) => {
    if (selectedComponentId) updateTextComponent(selectedComponentId, patch);
  };

  return (
    <aside className="inspector">
      <div className="inspector__head">Inspector</div>
      <div className="inspector__body">
        {!currentPage ? (
          <div className="inspector-placeholder">
            <p>Tidak ada halaman terpilih.</p>
          </div>
        ) : !selectedComponent ? (
          <PageInfo currentPage={currentPage} />
        ) : (
          <TextComponentEditor component={selectedComponent} onChange={update} />
        )}
      </div>
    </aside>
  );
}

function PageInfo({ currentPage }: { currentPage: SimplePage }) {
  const capability = getCapability(currentPage.role);
  return (
    <div className="inspector-placeholder">
      <p>
        <strong>Halaman:</strong> {currentPage.title}
      </p>
      <p>
        <strong>Peran (role):</strong> {ROLE_LABELS[currentPage.role] ?? currentPage.role}
      </p>
      <p>
        <strong>ID:</strong> {currentPage.id}
      </p>
      <p>
        <strong>Jumlah elemen:</strong> {currentPage.components.length}
      </p>
      <p style={{ marginTop: 12 }}>
        <strong>Capability:</strong>{' '}
        {capability.allowAddComponent
          ? `boleh tambah elemen (${capability.allowedComponents.join(', ')})`
          : 'halaman terpandu (tidak boleh tambah elemen manual)'}
      </p>
      <p style={{ marginTop: 16, fontStyle: 'italic' }}>
        {capability.allowAddComponent
          ? 'Klik elemen di canvas untuk mengedit, atau klik + Teks di toolbar untuk menambah.'
          : 'Elemen halaman terpandu akan diisi via template pedagogis (M11/M12).'}
      </p>
    </div>
  );
}

function TextComponentEditor({
  component,
  onChange,
}: {
  component: TextComponent;
  onChange: (patch: Partial<TextComponentEditable>) => void;
}) {
  return (
    <div className="component-editor">
      <div className="component-editor__head">
        <span className="component-editor__type">Elemen Teks</span>
        <span className="component-editor__id">{component.id.slice(0, 12)}…</span>
      </div>

      <Field label="Jenis teks">
        <select
          data-field="variant"
          value={component.variant}
          onChange={(e) => onChange({ variant: e.target.value as TextComponentVariant })}
          style={{ width: '100%' }}
        >
          {TEXT_COMPONENT_VARIANTS.map((v) => (
            <option key={v} value={v}>
              {VARIANT_LABELS[v]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Teks">
        <textarea
          data-field="text"
          value={component.text}
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
            value={component.x}
            onChange={(e) => onChange({ x: Number(e.target.value) })}
          />
        </Field>
        <Field label="Y">
          <input
            type="number"
            data-field="y"
            value={component.y}
            onChange={(e) => onChange({ y: Number(e.target.value) })}
          />
        </Field>
      </div>

      <div className="field-row">
        <Field label="Lebar">
          <input
            type="number"
            data-field="width"
            value={component.width}
            onChange={(e) => onChange({ width: Number(e.target.value) })}
          />
        </Field>
        <Field label="Tinggi">
          <input
            type="number"
            data-field="height"
            value={component.height}
            onChange={(e) => onChange({ height: Number(e.target.value) })}
          />
        </Field>
      </div>

      <div className="component-editor__hint">
        <p>
          <strong>Tampilan:</strong> otomatis dari jenis teks <code>{component.variant}</code>.
        </p>
        <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>
          Pengaturan tampilan manual (ukuran font, warna, dll) akan tersedia di M6/M11 via style
          adapter.
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
