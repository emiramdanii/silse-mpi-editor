import { useEditorStore } from '../store/editor-store';
import type {
  CardComponent,
  ImageComponent,
  NavigationAction,
  NavigationComponent,
  NavigationComponentVariant,
  PageComponent,
  SimplePage,
  TextComponent,
} from '../core/types';
import type {
  CardComponentEditable,
  ImageComponentEditable,
  NavigationComponentEditable,
  TextComponentEditable,
} from '../core/component-factory';
import {
  CARD_COMPONENT_VARIANTS,
  IMAGE_COMPONENT_VARIANTS,
  NAVIGATION_ACTIONS,
  NAVIGATION_COMPONENT_VARIANTS,
  TEXT_COMPONENT_VARIANTS,
  type CardComponentVariant,
  type ImageComponentVariant,
  type TextComponentVariant,
} from '../core/types';
import { getCapability } from '../core/capability';

/**
 * Inspector — M4 scope.
 *
 * Jika ada component terpilih → tampilkan form editor sesuai type:
 *   - TextComponent → TextComponentEditor (variant, text, geometry)
 *   - ImageComponent → ImageComponentEditor (variant, src, alt, objectFit, geometry)
 *   - CardComponent → CardComponentEditor (variant, title, body, geometry)
 *
 * Jika tidak ada component terpilih → tampilkan placeholder info halaman.
 *
 * Naming: UI uses "elemen"/"gambar"/"kartu", NOT "block".
 */

const TEXT_VARIANT_LABELS: Record<TextComponentVariant, string> = {
  title: 'Judul',
  subtitle: 'Sub-judul',
  body: 'Isi materi',
  instruction: 'Instruksi',
  importantNote: 'Catatan penting',
  questionPrompt: 'Pertanyaan',
  reflectionBox: 'Refleksi',
};

const IMAGE_VARIANT_LABELS: Record<ImageComponentVariant, string> = {
  illustration: 'Ilustrasi',
  background: 'Background',
  imageCard: 'Kartu gambar',
};

const CARD_VARIANT_LABELS: Record<CardComponentVariant, string> = {
  infoCard: 'Kartu info',
  importantNote: 'Catatan penting',
  exampleCard: 'Kartu contoh',
};

const NAVIGATION_VARIANT_LABELS: Record<NavigationComponentVariant, string> = {
  navigation: 'Navigasi',
  primaryAction: 'Aksi utama',
  secondaryAction: 'Aksi sekunder',
  choice: 'Pilihan',
};

const NAVIGATION_ACTION_LABELS: Record<NavigationAction, string> = {
  next: 'Halaman berikutnya',
  prev: 'Halaman sebelumnya',
  goto: 'Pergi ke halaman...',
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

const LAYOUT_LABELS: Record<string, string> = {
  blank: 'Bebas (manual)',
  coverCentered: 'Cover terpusat',
  singleColumn: 'Satu kolom',
};

export function Inspector() {
  const currentPage = useEditorStore(
    (s) => s.project.pages.find((p) => p.id === s.project.currentPageId) ?? null,
  );
  const selectedComponent = useEditorStore((s) => {
    if (!s.selectedComponentId) return null;
    const page = s.project.pages.find((p) => p.id === s.project.currentPageId);
    if (!page) return null;
    return page.components.find((c) => c.id === s.selectedComponentId) ?? null;
  });
  const updateTextComponent = useEditorStore((s) => s.updateTextComponent);
  const updateImageComponent = useEditorStore((s) => s.updateImageComponent);
  const updateCardComponent = useEditorStore((s) => s.updateCardComponent);
  const updateNavigationComponent = useEditorStore((s) => s.updateNavigationComponent);
  const project = useEditorStore((s) => s.project);

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
          <ComponentEditor
            component={selectedComponent}
            onUpdateText={updateTextComponent}
            onUpdateImage={updateImageComponent}
            onUpdateCard={updateCardComponent}
            onUpdateNavigation={updateNavigationComponent}
            pages={project.pages}
          />
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
        <strong>Layout:</strong> {LAYOUT_LABELS[currentPage.layoutId] ?? currentPage.layoutId}
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
          ? 'Klik elemen di canvas untuk mengedit, atau klik tombol + di toolbar untuk menambah.'
          : 'Elemen halaman terpandu akan diisi via template pedagogis (M11/M12).'}
      </p>
    </div>
  );
}

function ComponentEditor({
  component,
  onUpdateText,
  onUpdateImage,
  onUpdateCard,
  onUpdateNavigation,
  pages,
}: {
  component: PageComponent;
  onUpdateText: (id: string, patch: Partial<TextComponentEditable>) => void;
  onUpdateImage: (id: string, patch: Partial<ImageComponentEditable>) => void;
  onUpdateCard: (id: string, patch: Partial<CardComponentEditable>) => void;
  onUpdateNavigation: (id: string, patch: Partial<NavigationComponentEditable>) => void;
  pages: SimplePage[];
}) {
  if (component.type === 'text') {
    return <TextComponentEditor component={component} onChange={(p) => onUpdateText(component.id, p)} />;
  }
  if (component.type === 'image') {
    return <ImageComponentEditor component={component} onChange={(p) => onUpdateImage(component.id, p)} />;
  }
  if (component.type === 'card') {
    return <CardComponentEditor component={component} onChange={(p) => onUpdateCard(component.id, p)} />;
  }
  if (component.type === 'navigation') {
    return (
      <NavigationComponentEditor
        component={component}
        pages={pages}
        onChange={(p) => onUpdateNavigation(component.id, p)}
      />
    );
  }
  return (
    <div className="inspector-placeholder">
      <p>Editor untuk tipe elemen ini belum tersedia.</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Text Component Editor (M2)
// ---------------------------------------------------------------------------

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
              {TEXT_VARIANT_LABELS[v]}
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

      <GeometryFields component={component} onChange={onChange} />

      <StyleHint variant={component.variant} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Image Component Editor (M4)
// ---------------------------------------------------------------------------

function ImageComponentEditor({
  component,
  onChange,
}: {
  component: ImageComponent;
  onChange: (patch: Partial<ImageComponentEditable>) => void;
}) {
  return (
    <div className="component-editor">
      <div className="component-editor__head">
        <span className="component-editor__type">Elemen Gambar</span>
        <span className="component-editor__id">{component.id.slice(0, 12)}…</span>
      </div>

      <Field label="Jenis gambar">
        <select
          data-field="variant"
          value={component.variant}
          onChange={(e) => onChange({ variant: e.target.value as ImageComponentVariant })}
          style={{ width: '100%' }}
        >
          {IMAGE_COMPONENT_VARIANTS.map((v) => (
            <option key={v} value={v}>
              {IMAGE_VARIANT_LABELS[v]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Sumber gambar (URL / data URL)">
        <textarea
          data-field="src"
          value={component.src}
          onChange={(e) => onChange({ src: e.target.value })}
          rows={3}
          style={{ width: '100%', resize: 'vertical', fontSize: 11 }}
        />
      </Field>

      <Field label="Alt text (deskripsi)">
        <input
          type="text"
          data-field="alt"
          value={component.alt ?? ''}
          onChange={(e) => onChange({ alt: e.target.value })}
        />
      </Field>

      <Field label="Object fit">
        <select
          data-field="objectFit"
          value={component.objectFit}
          onChange={(e) => onChange({ objectFit: e.target.value as 'cover' | 'contain' })}
          style={{ width: '100%' }}
        >
          <option value="cover">Cover (potong)</option>
          <option value="contain">Contain (pas)</option>
        </select>
      </Field>

      <GeometryFields component={component} onChange={onChange} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card Component Editor (M4)
// ---------------------------------------------------------------------------

function CardComponentEditor({
  component,
  onChange,
}: {
  component: CardComponent;
  onChange: (patch: Partial<CardComponentEditable>) => void;
}) {
  return (
    <div className="component-editor">
      <div className="component-editor__head">
        <span className="component-editor__type">Elemen Kartu</span>
        <span className="component-editor__id">{component.id.slice(0, 12)}…</span>
      </div>

      <Field label="Jenis kartu">
        <select
          data-field="variant"
          value={component.variant}
          onChange={(e) => onChange({ variant: e.target.value as CardComponentVariant })}
          style={{ width: '100%' }}
        >
          {CARD_COMPONENT_VARIANTS.map((v) => (
            <option key={v} value={v}>
              {CARD_VARIANT_LABELS[v]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Judul (opsional)">
        <input
          type="text"
          data-field="title"
          value={component.title ?? ''}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </Field>

      <Field label="Isi kartu">
        <textarea
          data-field="body"
          value={component.body}
          onChange={(e) => onChange({ body: e.target.value })}
          rows={5}
          style={{ width: '100%', resize: 'vertical' }}
        />
      </Field>

      <GeometryFields component={component} onChange={onChange} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Navigation Component Editor (M5)
// ---------------------------------------------------------------------------

function NavigationComponentEditor({
  component,
  pages,
  onChange,
}: {
  component: NavigationComponent;
  pages: SimplePage[];
  onChange: (patch: Partial<NavigationComponentEditable>) => void;
}) {
  return (
    <div className="component-editor">
      <div className="component-editor__head">
        <span className="component-editor__type">Elemen Navigasi</span>
        <span className="component-editor__id">{component.id.slice(0, 12)}…</span>
      </div>

      <Field label="Label tombol">
        <input
          type="text"
          data-field="label"
          value={component.label}
          onChange={(e) => onChange({ label: e.target.value })}
        />
      </Field>

      <Field label="Jenis navigasi">
        <select
          data-field="variant"
          value={component.variant}
          onChange={(e) => onChange({ variant: e.target.value as NavigationComponentVariant })}
          style={{ width: '100%' }}
        >
          {NAVIGATION_COMPONENT_VARIANTS.map((v) => (
            <option key={v} value={v}>
              {NAVIGATION_VARIANT_LABELS[v]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Aksi">
        <select
          data-field="action"
          value={component.action}
          onChange={(e) => onChange({ action: e.target.value as NavigationAction })}
          style={{ width: '100%' }}
        >
          {NAVIGATION_ACTIONS.map((a) => (
            <option key={a} value={a}>
              {NAVIGATION_ACTION_LABELS[a]}
            </option>
          ))}
        </select>
      </Field>

      {component.action === 'goto' && (
        <Field label="Halaman tujuan">
          <select
            data-field="targetPageId"
            value={component.targetPageId ?? ''}
            onChange={(e) => onChange({ targetPageId: e.target.value })}
            style={{ width: '100%' }}
          >
            <option value="">— Pilih halaman —</option>
            {pages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </Field>
      )}

      <GeometryFields component={component} onChange={onChange} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared geometry fields
// ---------------------------------------------------------------------------

function GeometryFields({
  component,
  onChange,
}: {
  component: { x: number; y: number; width: number; height: number };
  onChange: (patch: { x?: number; y?: number; width?: number; height?: number }) => void;
}) {
  return (
    <>
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
    </>
  );
}

function StyleHint({ variant }: { variant: string }) {
  return (
    <div className="component-editor__hint">
      <p>
        <strong>Tampilan:</strong> otomatis dari jenis teks <code>{variant}</code>.
      </p>
      <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>
        Pengaturan tampilan manual akan tersedia di M6/M11 via style adapter.
      </p>
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
