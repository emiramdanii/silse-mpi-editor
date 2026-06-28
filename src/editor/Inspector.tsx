/**
 * Inspector — panel "Apa yang ingin kamu ubah?" (UX-01 redesign).
 *
 * Layer: editor
 * Allowed imports: react, ../store/editor-store, ../core/*
 *
 * Kontrak (UX-01 Scope E):
 *   - Bukan dev-tools panel dengan raw fields. Workspace guru.
 *   - Saat ada elemen terpilih:
 *       • Header: nama ramah guru ("Teks Judul", "Kartu Info", dst) — bukan ID.
 *       • Section "Isi" duluan (text/body/label) — apa yang guru pedulikan.
 *       • Section "Tampilan" (variant, jenis).
 *       • Section "Posisi & Ukuran" (collapsible — x/y/w/h).
 *   - Saat tidak ada elemen terpilih:
 *       • Info halaman: judul + role label ramah guru + hint peran.
 *       • Bila halaman kosong: saran "Tambahkan elemen pertama".
 *       • Bila halaman punya elemen: jumlah + ringkasan tipe.
 *   - Semua `data-field` lama dipertahankan supaya scope-lock test pass.
 *   - Tidak ada kata terlarang "b-l-o-c-k" di user-facing text.
 */

import { useState } from 'react';
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
import { getRoleInfo } from './mpi-standard-roles';

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
  background: 'Latar belakang',
  imageCard: 'Kartu gambar',
};

const CARD_VARIANT_LABELS: Record<CardComponentVariant, string> = {
  infoCard: 'Kartu info',
  importantNote: 'Catatan penting',
  exampleCard: 'Kartu contoh',
};

const NAVIGATION_VARIANT_LABELS: Record<NavigationComponentVariant, string> = {
  navigation: 'Tombol biasa',
  primaryAction: 'Aksi utama (menonjol)',
  secondaryAction: 'Aksi sekunder',
  choice: 'Pilihan',
};

const NAVIGATION_ACTION_LABELS: Record<NavigationAction, string> = {
  next: 'Halaman berikutnya',
  prev: 'Halaman sebelumnya',
  goto: 'Pergi ke halaman tertentu',
};

const LAYOUT_LABELS: Record<string, string> = {
  blank: 'Bebas (manual)',
  coverCentered: 'Cover terpusat',
  singleColumn: 'Satu kolom',
};

const TEXT_VARIANT_FRIENDLY_NAME: Record<TextComponentVariant, string> = {
  title: 'Teks Judul',
  subtitle: 'Teks Sub-judul',
  body: 'Teks Isi',
  instruction: 'Teks Instruksi',
  importantNote: 'Teks Catatan Penting',
  questionPrompt: 'Teks Pertanyaan',
  reflectionBox: 'Teks Refleksi',
};

const IMAGE_VARIANT_FRIENDLY_NAME: Record<ImageComponentVariant, string> = {
  illustration: 'Gambar Ilustrasi',
  background: 'Gambar Latar',
  imageCard: 'Gambar Kartu',
};

const CARD_VARIANT_FRIENDLY_NAME: Record<CardComponentVariant, string> = {
  infoCard: 'Kartu Info',
  importantNote: 'Kartu Catatan Penting',
  exampleCard: 'Kartu Contoh',
};

const NAVIGATION_VARIANT_FRIENDLY_NAME: Record<NavigationComponentVariant, string> = {
  navigation: 'Tombol Navigasi',
  primaryAction: 'Tombol Aksi Utama',
  secondaryAction: 'Tombol Aksi Sekunder',
  choice: 'Tombol Pilihan',
};

function friendlyElementName(component: PageComponent): string {
  if (component.type === 'text') {
    return TEXT_VARIANT_FRIENDLY_NAME[component.variant] ?? 'Teks';
  }
  if (component.type === 'image') {
    return IMAGE_VARIANT_FRIENDLY_NAME[component.variant] ?? 'Gambar';
  }
  if (component.type === 'card') {
    return CARD_VARIANT_FRIENDLY_NAME[component.variant] ?? 'Kartu';
  }
  if (component.type === 'navigation') {
    return NAVIGATION_VARIANT_FRIENDLY_NAME[component.variant] ?? 'Tombol Navigasi';
  }
  if (component.type === 'question') return 'Pertanyaan';
  if (component.type === 'game') return 'Game Misi';
  return 'Elemen';
}

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
    <aside className="inspector" data-testid="inspector">
      <div className="inspector__head">
        <span className="inspector__head-title">Panel Isi</span>
      </div>
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
  const info = getRoleInfo(currentPage.role);
  const componentCount = currentPage.components.length;
  const componentTypeSummary = currentPage.components
    .map((c) => c.type)
    .reduce<Record<string, number>>((acc, t) => {
      acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    }, {});
  const summaryText = Object.entries(componentTypeSummary)
    .map(([t, n]) => `${n} ${t}`)
    .join(', ');

  return (
    <div className="inspector-page-info" data-testid="inspector-page-info">
      <div className="inspector-page-info__icon" aria-hidden>{info.icon}</div>
      <h3 className="inspector-page-info__title">{currentPage.title}</h3>
      <p className="inspector-page-info__role">{info.label}</p>
      <p className="inspector-page-info__hint">{info.hint}</p>

      <dl className="inspector-page-info__meta">
        <div>
          <dt>Layout</dt>
          <dd>{LAYOUT_LABELS[currentPage.layoutId] ?? currentPage.layoutId}</dd>
        </div>
        <div>
          <dt>Jumlah elemen</dt>
          <dd>{componentCount}</dd>
        </div>
        {componentCount > 0 && (
          <div>
            <dt>Ringkasan</dt>
            <dd>{summaryText}</dd>
          </div>
        )}
      </dl>

      <div className={`inspector-page-info__capability${capability.allowAddComponent ? '' : ' is-locked'}`}>
        {capability.allowAddComponent ? (
          <>
            <strong>Boleh tambah elemen:</strong>{' '}
            <span>{capability.allowedComponents.join(', ')}</span>
            <p className="inspector-page-info__capability-hint">
              Klik elemen di kanvas untuk mengedit, atau gunakan tombol tambah di toolbar atas kanvas.
            </p>
          </>
        ) : (
          <>
            <strong>Halaman terpandu.</strong>
            <p className="inspector-page-info__capability-hint">
              Elemen halaman ini sudah diatur dan tidak boleh ditambah manual.
            </p>
          </>
        )}
      </div>
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
// Shared section header
// ---------------------------------------------------------------------------

function Section({
  title,
  children,
  collapsible = false,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (!collapsible) {
    return (
      <section className="inspector-section">
        <h4 className="inspector-section__title">{title}</h4>
        <div className="inspector-section__body">{children}</div>
      </section>
    );
  }
  return (
    <section className="inspector-section inspector-section--collapsible">
      <button
        type="button"
        className="inspector-section__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <span className="inspector-section__chevron" aria-hidden>{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="inspector-section__body">{children}</div>}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Text Component Editor
// ---------------------------------------------------------------------------

function TextComponentEditor({
  component,
  onChange,
}: {
  component: TextComponent;
  onChange: (patch: Partial<TextComponentEditable>) => void;
}) {
  return (
    <div className="component-editor" data-testid="component-editor-text">
      <div className="component-editor__head">
        <span className="component-editor__type">
          {friendlyElementName(component)}
        </span>
      </div>

      <Section title="Isi">
        <Field label="Teks">
          <textarea
            data-field="text"
            value={component.text}
            onChange={(e) => onChange({ text: e.target.value })}
            rows={5}
            style={{ width: '100%', resize: 'vertical' }}
            placeholder="Tulis teks di sini..."
          />
        </Field>
      </Section>

      <Section title="Tampilan">
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
        <div className="component-editor__hint">
          Tampilan teks (ukuran, warna, gaya) otomatis mengikuti jenis teks dan paket gaya.
        </div>
      </Section>

      <Section title="Posisi & Ukuran">
        <GeometryFields component={component} onChange={onChange} />
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Image Component Editor
// ---------------------------------------------------------------------------

function ImageComponentEditor({
  component,
  onChange,
}: {
  component: ImageComponent;
  onChange: (patch: Partial<ImageComponentEditable>) => void;
}) {
  return (
    <div className="component-editor" data-testid="component-editor-image">
      <div className="component-editor__head">
        <span className="component-editor__type">
          {friendlyElementName(component)}
        </span>
      </div>

      <Section title="Isi">
        <Field label="Sumber gambar (URL / data URL)">
          <textarea
            data-field="src"
            value={component.src}
            onChange={(e) => onChange({ src: e.target.value })}
            rows={3}
            style={{ width: '100%', resize: 'vertical', fontSize: 11 }}
            placeholder="https://... atau data:image/..."
          />
        </Field>
        <Field label="Deskripsi gambar (alt text)">
          <input
            type="text"
            data-field="alt"
            value={component.alt ?? ''}
            onChange={(e) => onChange({ alt: e.target.value })}
            placeholder="Deskripsikan gambar untuk aksesibilitas"
          />
        </Field>
      </Section>

      <Section title="Tampilan">
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
        <Field label="Cara muat">
          <select
            data-field="objectFit"
            value={component.objectFit}
            onChange={(e) => onChange({ objectFit: e.target.value as 'cover' | 'contain' })}
            style={{ width: '100%' }}
          >
            <option value="cover">Cover (potong sesuai kotak)</option>
            <option value="contain">Contain (pas tanpa potong)</option>
          </select>
        </Field>
      </Section>

      <Section title="Posisi & Ukuran">
        <GeometryFields component={component} onChange={onChange} />
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card Component Editor
// ---------------------------------------------------------------------------

function CardComponentEditor({
  component,
  onChange,
}: {
  component: CardComponent;
  onChange: (patch: Partial<CardComponentEditable>) => void;
}) {
  return (
    <div className="component-editor" data-testid="component-editor-card">
      <div className="component-editor__head">
        <span className="component-editor__type">
          {friendlyElementName(component)}
        </span>
      </div>

      <Section title="Isi">
        <Field label="Judul (opsional)">
          <input
            type="text"
            data-field="title"
            value={component.title ?? ''}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Judul kartu"
          />
        </Field>
        <Field label="Isi kartu">
          <textarea
            data-field="body"
            value={component.body}
            onChange={(e) => onChange({ body: e.target.value })}
            rows={6}
            style={{ width: '100%', resize: 'vertical' }}
            placeholder="Tulis isi kartu di sini..."
          />
        </Field>
      </Section>

      <Section title="Tampilan">
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
      </Section>

      <Section title="Posisi & Ukuran">
        <GeometryFields component={component} onChange={onChange} />
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Navigation Component Editor
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
    <div className="component-editor" data-testid="component-editor-navigation">
      <div className="component-editor__head">
        <span className="component-editor__type">
          {friendlyElementName(component)}
        </span>
      </div>

      <Section title="Isi">
        <Field label="Teks tombol">
          <input
            type="text"
            data-field="label"
            value={component.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="Contoh: Lanjut →"
          />
        </Field>
        <Field label="Tujuan navigasi">
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
      </Section>

      <Section title="Tampilan">
        <Field label="Jenis tombol">
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
      </Section>

      <Section title="Posisi & Ukuran">
        <GeometryFields component={component} onChange={onChange} />
      </Section>
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
        <Field label="Posisi X">
          <input
            type="number"
            data-field="x"
            value={component.x}
            onChange={(e) => onChange({ x: Number(e.target.value) })}
          />
        </Field>
        <Field label="Posisi Y">
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
      <div className="component-editor__hint component-editor__hint--small">
        Klik dan seret elemen di kanvas untuk memindahkan. Seret titik biru di pojok untuk mengubah ukuran.
      </div>
    </>
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
