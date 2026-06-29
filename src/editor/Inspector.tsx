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
  GameComponent,
  GameMission,
  ImageComponent,
  LayeredInfoComponent,
  LayeredInfoLayer,
  LearningBridgeComponent,
  NavigationAction,
  NavigationComponent,
  NavigationComponentVariant,
  PageComponent,
  QuestionChoice,
  QuestionComponent,
  SimplePage,
  TextComponent,
} from '../core/types';
import type {
  CardComponentEditable,
  GameComponentEditable,
  ImageComponentEditable,
  LayeredInfoComponentEditable,
  LearningBridgeComponentEditable,
  NavigationComponentEditable,
  QuestionComponentEditable,
  TextComponentEditable,
} from '../core/component-factory';
import {
  CARD_COMPONENT_VARIANTS,
  GAME_TYPES,
  IMAGE_COMPONENT_VARIANTS,
  LAYERED_INFO_VARIANTS,
  LEARNING_BRIDGE_VARIANTS,
  NAVIGATION_ACTIONS,
  NAVIGATION_COMPONENT_VARIANTS,
  QUESTION_COMPONENT_VARIANTS,
  SCORING_STYLES,
  TEXT_COMPONENT_VARIANTS,
  type CardComponentVariant,
  type ImageComponentVariant,
  type LayeredInfoVariant,
  type LearningBridgeVariant,
  type TextComponentVariant,
} from '../core/types';
import { getCapability } from '../core/capability';
import { getRoleInfo } from './mpi-standard-roles';
import { createComponentId } from '../core/ids';
import { PatternLibraryPanel } from './PatternLibraryPanel';
import { VisualSection } from './VisualSection';

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

// UX-01 Patch Scope C: friendly labels for Question / Game editor options.
const QUESTION_VARIANT_LABELS: Record<string, string> = {
  multipleChoice: 'Pilihan ganda',
  trueFalse: 'Benar / Salah',
};

const GAME_TYPE_LABELS: Record<string, string> = {
  missionQuiz: 'Kuis Misi',
};

const SCORING_STYLE_LABELS: Record<string, string> = {
  points: 'Poin angka',
  stars: 'Bintang',
  badge: 'Lencana',
};

const LAYERED_INFO_VARIANT_LABELS: Record<LayeredInfoVariant, string> = {
  accordion: 'Accordion (lipat)',
  tabs: 'Tab',
  iconTabs: 'Tab Ikon',
  stepper: 'Stepper (langkah)',
  cardGrid: 'Kartu Grid',
  timeline: 'Linimasa',
};

const LEARNING_BRIDGE_VARIANT_LABELS: Record<LearningBridgeVariant, string> = {
  transition: 'Transisi',
  recap: 'Recap',
  preview: 'Preview',
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
  if (component.type === 'layered-info') {
    return 'Info Berlapis';
  }
  if (component.type === 'learning-bridge') {
    return 'Jembatan Belajar';
  }
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
  const updateQuestionComponent = useEditorStore((s) => s.updateQuestionComponent);
  const updateGameComponent = useEditorStore((s) => s.updateGameComponent);
  const updateLayeredInfoComponent = useEditorStore((s) => s.updateLayeredInfoComponent);
  const updateLearningBridgeComponent = useEditorStore((s) => s.updateLearningBridgeComponent);
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
          <>
            <PageInfo currentPage={currentPage} />
            <PatternLibraryPanel currentPage={currentPage} project={project} />
            <VisualSection />
          </>
        ) : (
          <ComponentEditor
            component={selectedComponent}
            onUpdateText={updateTextComponent}
            onUpdateImage={updateImageComponent}
            onUpdateCard={updateCardComponent}
            onUpdateNavigation={updateNavigationComponent}
            onUpdateQuestion={updateQuestionComponent}
            onUpdateGame={updateGameComponent}
            onUpdateLayeredInfo={updateLayeredInfoComponent}
            onUpdateBridge={updateLearningBridgeComponent}
            pages={project.pages}
          />
        )}
      </div>
    </aside>
  );
}

const COMPONENT_TYPE_FRIENDLY: Record<string, string> = {
  text: 'Teks',
  image: 'Gambar',
  card: 'Kartu',
  navigation: 'Tombol navigasi',
  question: 'Pertanyaan',
  game: 'Game misi',
  'layered-info': 'Info Berlapis',
  'learning-bridge': 'Jembatan Belajar',
};

/**
 * Map a list of allowed component types (raw) to friendly labels.
 * Used by PageInfo to show "Yang bisa ditambahkan: Teks, Kartu, Tombol navigasi"
 * instead of raw "text, card, navigation".
 */
function friendlyComponentTypes(types: ReadonlyArray<string>): string {
  return types
    .map((t) => COMPONENT_TYPE_FRIENDLY[t] ?? t)
    .join(', ');
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
  // UX-01 Patch Scope B: friendly summary "2 Teks, 1 Kartu" — not raw "2 text, 1 card".
  const summaryText = Object.entries(componentTypeSummary)
    .map(([t, n]) => `${n} ${COMPONENT_TYPE_FRIENDLY[t] ?? t}`)
    .join(', ');

  return (
    <div className="inspector-page-info" data-testid="inspector-page-info">
      <div className="inspector-page-info__icon" aria-hidden>{info.icon}</div>
      <h3 className="inspector-page-info__title">{currentPage.title}</h3>
      <p className="inspector-page-info__role">{info.label}</p>
      <p className="inspector-page-info__hint">{info.hint}</p>

      <dl className="inspector-page-info__meta">
        <div>
          <dt>Pola tampilan</dt>
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

      <div
        className={`inspector-page-info__status${capability.allowAddComponent ? '' : ' is-locked'}`}
        data-testid="inspector-page-status"
      >
        {capability.allowAddComponent ? (
          <>
            <strong>Yang bisa ditambahkan:</strong>{' '}
            <span>{friendlyComponentTypes(capability.allowedComponents)}</span>
            <p className="inspector-page-info__status-hint">
              Klik elemen di kanvas untuk mengedit, atau gunakan tombol tambah di toolbar atas kanvas.
            </p>
          </>
        ) : (
          <>
            <strong>Halaman terpandu.</strong>
            <p className="inspector-page-info__status-hint">
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
  onUpdateQuestion,
  onUpdateGame,
  onUpdateLayeredInfo,
  onUpdateBridge,
  pages,
}: {
  component: PageComponent;
  onUpdateText: (id: string, patch: Partial<TextComponentEditable>) => void;
  onUpdateImage: (id: string, patch: Partial<ImageComponentEditable>) => void;
  onUpdateCard: (id: string, patch: Partial<CardComponentEditable>) => void;
  onUpdateNavigation: (id: string, patch: Partial<NavigationComponentEditable>) => void;
  onUpdateQuestion: (id: string, patch: Partial<QuestionComponentEditable>) => void;
  onUpdateGame: (id: string, patch: Partial<GameComponentEditable>) => void;
  onUpdateLayeredInfo: (id: string, patch: Partial<LayeredInfoComponentEditable>) => void;
  onUpdateBridge: (id: string, patch: Partial<LearningBridgeComponentEditable>) => void;
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
  if (component.type === 'question') {
    return <QuestionComponentEditor component={component} onChange={(p) => onUpdateQuestion(component.id, p)} />;
  }
  if (component.type === 'game') {
    return <GameComponentEditor component={component} onChange={(p) => onUpdateGame(component.id, p)} />;
  }
  if (component.type === 'layered-info') {
    return <LayeredInfoComponentEditor component={component} onChange={(p) => onUpdateLayeredInfo(component.id, p)} />;
  }
  if (component.type === 'learning-bridge') {
    return <LearningBridgeComponentEditor component={component} onChange={(p) => onUpdateBridge(component.id, p)} />;
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
// Question Component Editor (UX-01 Patch Scope C)
// ---------------------------------------------------------------------------

function QuestionComponentEditor({
  component,
  onChange,
}: {
  component: QuestionComponent;
  onChange: (patch: Partial<QuestionComponentEditable>) => void;
}) {
  const updateChoiceText = (choiceIdx: number, text: string) => {
    const newChoices = component.choices.map((c, i) =>
      i === choiceIdx ? { ...c, text } : c,
    );
    onChange({ choices: newChoices });
  };
  const addChoice = () => {
    const newChoice: QuestionChoice = { id: createComponentId(), text: 'Pilihan baru' };
    onChange({ choices: [...component.choices, newChoice] });
  };
  const removeChoice = (choiceIdx: number) => {
    if (component.choices.length <= 2) {
      window.alert('Minimal harus ada 2 pilihan jawaban.');
      return;
    }
    const newChoices = component.choices.filter((_, i) => i !== choiceIdx);
    // If we removed the correct choice, reset to first
    let newCorrect = component.correctChoiceIndex;
    if (choiceIdx === component.correctChoiceIndex) {
      newCorrect = 0;
    } else if (choiceIdx < component.correctChoiceIndex) {
      newCorrect = component.correctChoiceIndex - 1;
    }
    onChange({ choices: newChoices, correctChoiceIndex: newCorrect });
  };

  return (
    <div className="component-editor" data-testid="component-editor-question">
      <div className="component-editor__head">
        <span className="component-editor__type">{friendlyElementName(component)}</span>
      </div>

      <Section title="Isi">
        <Field label="Judul kuis">
          <input
            type="text"
            data-field="title"
            value={component.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Contoh: Kuis Norma"
          />
        </Field>
        <Field label="Pertanyaan">
          <textarea
            data-field="prompt"
            value={component.prompt}
            onChange={(e) => onChange({ prompt: e.target.value })}
            rows={3}
            style={{ width: '100%', resize: 'vertical' }}
            placeholder="Tulis pertanyaan..."
          />
        </Field>
      </Section>

      <Section title="Pilihan jawaban">
        <div className="question-choices" data-testid="question-choices">
          {component.choices.map((choice, idx) => (
            <div key={choice.id} className="question-choice">
              <label className="question-choice__radio" title="Tandai sebagai jawaban benar">
                <input
                  type="radio"
                  name={`correct-${component.id}`}
                  checked={component.correctChoiceIndex === idx}
                  onChange={() => onChange({ correctChoiceIndex: idx })}
                  data-field="correctChoiceIndex"
                  data-choice-idx={idx}
                />
                <span aria-hidden>{String.fromCharCode(65 + idx)}</span>
              </label>
              <input
                type="text"
                className="question-choice__text"
                value={choice.text}
                onChange={(e) => updateChoiceText(idx, e.target.value)}
                placeholder={`Teks pilihan ${String.fromCharCode(65 + idx)}`}
                data-field={`choice-text-${idx}`}
              />
              <button
                type="button"
                className="question-choice__remove"
                onClick={() => removeChoice(idx)}
                title="Hapus pilihan ini"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="question-choice__add"
          onClick={addChoice}
          title="Tambah pilihan jawaban"
          data-action="add-choice"
        >
          + Tambah pilihan
        </button>
        <div className="component-editor__hint component-editor__hint--small">
          Pilih huruf (A, B, C, …) untuk menandai jawaban benar.
        </div>
      </Section>

      <Section title="Feedback">
        <Field label="Feedback jika benar">
          <textarea
            data-field="feedbackCorrect"
            value={component.feedbackCorrect}
            onChange={(e) => onChange({ feedbackCorrect: e.target.value })}
            rows={2}
            style={{ width: '100%', resize: 'vertical' }}
            placeholder="Contoh: Benar! Itu norma kesopanan."
          />
        </Field>
        <Field label="Feedback jika salah">
          <textarea
            data-field="feedbackWrong"
            value={component.feedbackWrong}
            onChange={(e) => onChange({ feedbackWrong: e.target.value })}
            rows={2}
            style={{ width: '100%', resize: 'vertical' }}
            placeholder="Contoh: Belum tepat. Coba lihat lagi materinya."
          />
        </Field>
      </Section>

      <Section title="Skor & Tampilan">
        <div className="field-row">
          <Field label="Skor">
            <input
              type="number"
              data-field="points"
              value={component.points}
              onChange={(e) => onChange({ points: Number(e.target.value) })}
              min={0}
            />
          </Field>
          <Field label="Gaya skor">
            <select
              data-field="scoringStyle"
              value={component.scoringStyle}
              onChange={(e) => onChange({ scoringStyle: e.target.value as QuestionComponent['scoringStyle'] })}
            >
              {SCORING_STYLES.map((s) => (
                <option key={s} value={s}>
                  {SCORING_STYLE_LABELS[s] ?? s}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Jenis pertanyaan">
          <select
            data-field="variant"
            value={component.variant}
            onChange={(e) => onChange({ variant: e.target.value as QuestionComponent['variant'] })}
          >
            {QUESTION_COMPONENT_VARIANTS.map((v) => (
              <option key={v} value={v}>
                {QUESTION_VARIANT_LABELS[v] ?? v}
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
// Game Component Editor (UX-01 Patch Scope C)
// ---------------------------------------------------------------------------

function GameComponentEditor({
  component,
  onChange,
}: {
  component: GameComponent;
  onChange: (patch: Partial<GameComponentEditable>) => void;
}) {
  const updateMission = (missionIdx: number, patch: Partial<GameMission>) => {
    const newMissions = component.missions.map((m, i) =>
      i === missionIdx ? { ...m, ...patch } : m,
    );
    onChange({ missions: newMissions });
  };
  const addMission = () => {
    const newMission: GameMission = {
      id: createComponentId(),
      title: `Misi ${component.missions.length + 1}`,
      prompt: 'Pertanyaan misi baru?',
      choices: [
        { id: createComponentId(), text: 'Pilihan A' },
        { id: createComponentId(), text: 'Pilihan B' },
      ],
      correctChoiceIndex: 0,
      feedbackCorrect: 'Benar!',
      feedbackWrong: 'Belum tepat.',
      points: 10,
    };
    onChange({ missions: [...component.missions, newMission] });
  };
  const removeMission = (missionIdx: number) => {
    if (component.missions.length <= 1) {
      window.alert('Game minimal harus punya 1 misi.');
      return;
    }
    onChange({
      missions: component.missions.filter((_, i) => i !== missionIdx),
    });
  };
  const updateMissionChoiceText = (
    missionIdx: number,
    choiceIdx: number,
    text: string,
  ) => {
    const mission = component.missions[missionIdx];
    const newChoices = mission.choices.map((c, i) =>
      i === choiceIdx ? { ...c, text } : c,
    );
    updateMission(missionIdx, { choices: newChoices });
  };
  const addMissionChoice = (missionIdx: number) => {
    const mission = component.missions[missionIdx];
    const newChoice: QuestionChoice = { id: createComponentId(), text: 'Pilihan baru' };
    updateMission(missionIdx, { choices: [...mission.choices, newChoice] });
  };
  const removeMissionChoice = (missionIdx: number, choiceIdx: number) => {
    const mission = component.missions[missionIdx];
    if (mission.choices.length <= 2) {
      window.alert('Minimal harus ada 2 pilihan jawaban.');
      return;
    }
    const newChoices = mission.choices.filter((_, i) => i !== choiceIdx);
    let newCorrect = mission.correctChoiceIndex;
    if (choiceIdx === mission.correctChoiceIndex) {
      newCorrect = 0;
    } else if (choiceIdx < mission.correctChoiceIndex) {
      newCorrect = mission.correctChoiceIndex - 1;
    }
    updateMission(missionIdx, { choices: newChoices, correctChoiceIndex: newCorrect });
  };

  return (
    <div className="component-editor" data-testid="component-editor-game">
      <div className="component-editor__head">
        <span className="component-editor__type">{friendlyElementName(component)}</span>
      </div>

      <Section title="Isi">
        <Field label="Judul game">
          <input
            type="text"
            data-field="title"
            value={component.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Contoh: Petualangan Norma"
          />
        </Field>
        <Field label="Instruksi">
          <textarea
            data-field="instruction"
            value={component.instruction}
            onChange={(e) => onChange({ instruction: e.target.value })}
            rows={2}
            style={{ width: '100%', resize: 'vertical' }}
            placeholder="Contoh: Jawab semua misi untuk menyelesaikan petualangan!"
          />
        </Field>
      </Section>

      <Section title="Tampilan">
        <div className="field-row">
          <Field label="Jenis game">
            <select
              data-field="gameType"
              value={component.gameType}
              onChange={(e) => onChange({ gameType: e.target.value as GameComponent['gameType'] })}
            >
              {GAME_TYPES.map((g) => (
                <option key={g} value={g}>
                  {GAME_TYPE_LABELS[g] ?? g}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Gaya skor">
            <select
              data-field="scoringStyle"
              value={component.scoringStyle}
              onChange={(e) => onChange({ scoringStyle: e.target.value as GameComponent['scoringStyle'] })}
            >
              {SCORING_STYLES.map((s) => (
                <option key={s} value={s}>
                  {SCORING_STYLE_LABELS[s] ?? s}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      <Section title={`Misi (${component.missions.length})`}>
        <div className="game-missions" data-testid="game-missions">
          {component.missions.map((mission, mIdx) => (
            <div key={mission.id} className="game-mission" data-testid={`game-mission-${mIdx}`}>
              <div className="game-mission__head">
                <input
                  type="text"
                  className="game-mission__title"
                  value={mission.title}
                  onChange={(e) => updateMission(mIdx, { title: e.target.value })}
                  placeholder={`Misi ${mIdx + 1}`}
                  data-field={`mission-title-${mIdx}`}
                />
                <button
                  type="button"
                  className="game-mission__remove"
                  onClick={() => removeMission(mIdx)}
                  title="Hapus misi ini"
                >
                  ×
                </button>
              </div>
              <Field label="Pertanyaan misi">
                <textarea
                  value={mission.prompt}
                  onChange={(e) => updateMission(mIdx, { prompt: e.target.value })}
                  rows={2}
                  style={{ width: '100%', resize: 'vertical' }}
                  placeholder="Pertanyaan untuk misi ini..."
                  data-field={`mission-prompt-${mIdx}`}
                />
              </Field>
              <div className="game-mission__choices">
                <span className="game-mission__choices-label">Pilihan jawaban:</span>
                {mission.choices.map((choice, cIdx) => (
                  <div key={choice.id} className="question-choice">
                    <label className="question-choice__radio" title="Tandai sebagai jawaban benar">
                      <input
                        type="radio"
                        name={`correct-mission-${mission.id}`}
                        checked={mission.correctChoiceIndex === cIdx}
                        onChange={() => updateMission(mIdx, { correctChoiceIndex: cIdx })}
                      />
                      <span aria-hidden>{String.fromCharCode(65 + cIdx)}</span>
                    </label>
                    <input
                      type="text"
                      className="question-choice__text"
                      value={choice.text}
                      onChange={(e) => updateMissionChoiceText(mIdx, cIdx, e.target.value)}
                      placeholder={`Teks pilihan ${String.fromCharCode(65 + cIdx)}`}
                    />
                    <button
                      type="button"
                      className="question-choice__remove"
                      onClick={() => removeMissionChoice(mIdx, cIdx)}
                      title="Hapus pilihan ini"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="question-choice__add"
                  onClick={() => addMissionChoice(mIdx)}
                  title="Tambah pilihan jawaban untuk misi ini"
                >
                  + Tambah pilihan
                </button>
              </div>
              <div className="field-row">
                <Field label="Skor misi">
                  <input
                    type="number"
                    value={mission.points}
                    onChange={(e) => updateMission(mIdx, { points: Number(e.target.value) })}
                    min={0}
                    data-field={`mission-points-${mIdx}`}
                  />
                </Field>
              </div>
              <Field label="Feedback jika benar">
                <textarea
                  value={mission.feedbackCorrect}
                  onChange={(e) => updateMission(mIdx, { feedbackCorrect: e.target.value })}
                  rows={2}
                  style={{ width: '100%', resize: 'vertical' }}
                  placeholder="Contoh: Benar! ..."
                  data-field={`mission-feedback-correct-${mIdx}`}
                />
              </Field>
              <Field label="Feedback jika salah">
                <textarea
                  value={mission.feedbackWrong}
                  onChange={(e) => updateMission(mIdx, { feedbackWrong: e.target.value })}
                  rows={2}
                  style={{ width: '100%', resize: 'vertical' }}
                  placeholder="Contoh: Belum tepat. ..."
                  data-field={`mission-feedback-wrong-${mIdx}`}
                />
              </Field>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="question-choice__add"
          onClick={addMission}
          title="Tambah misi baru"
          data-action="add-mission"
        >
          + Tambah misi
        </button>
      </Section>

      <Section title="Posisi & Ukuran">
        <GeometryFields component={component} onChange={onChange} />
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layered Info Component Editor (LXC-02)
//
// Kontrak: editor hanya edit layer AKTIF, bukan menampilkan semua isi
// panjang sekaligus. Guru pilih layer dari daftar, lalu edit judul + body
// layer itu saja. Tambah/hapus layer via tombol.
// ---------------------------------------------------------------------------

function LayeredInfoComponentEditor({
  component,
  onChange,
}: {
  component: LayeredInfoComponent;
  onChange: (patch: Partial<LayeredInfoComponentEditable>) => void;
}) {
  // Active layer index — local state supaya guru bisa pilih layer mana
  // yang sedang diedit. Default = defaultOpenIndex atau 0.
  const [activeLayerIdx, setActiveLayerIdx] = useState<number>(
    component.defaultOpenIndex ?? 0,
  );

  const safeActiveIdx =
    activeLayerIdx >= 0 && activeLayerIdx < component.layers.length
      ? activeLayerIdx
      : 0;
  const activeLayer = component.layers[safeActiveIdx];

  const updateLayer = (idx: number, patch: Partial<LayeredInfoLayer>) => {
    const newLayers = component.layers.map((l, i) =>
      i === idx ? { ...l, ...patch } : l,
    );
    onChange({ layers: newLayers });
  };

  const addLayer = () => {
    const newLayer: LayeredInfoLayer = {
      id: createComponentId(),
      title: `Lapisan ${component.layers.length + 1}`,
      body: 'Tulis isi lapisan di sini.',
    };
    const newLayers = [...component.layers, newLayer];
    onChange({ layers: newLayers });
    setActiveLayerIdx(newLayers.length - 1);
  };

  const removeLayer = (idx: number) => {
    if (component.layers.length <= 1) {
      window.alert('Minimal harus ada 1 lapisan.');
      return;
    }
    const newLayers = component.layers.filter((_, i) => i !== idx);
    onChange({ layers: newLayers });
    // Adjust active index + defaultOpenIndex
    let newActive = safeActiveIdx;
    if (idx === safeActiveIdx) {
      newActive = Math.max(0, idx - 1);
    } else if (idx < safeActiveIdx) {
      newActive = safeActiveIdx - 1;
    }
    setActiveLayerIdx(newActive);
    let newDefault = component.defaultOpenIndex;
    if (newDefault !== null) {
      if (idx === newDefault) {
        newDefault = 0;
      } else if (idx < newDefault) {
        newDefault = newDefault - 1;
      }
      if (newDefault >= newLayers.length) newDefault = 0;
    }
    onChange({ defaultOpenIndex: newDefault });
  };

  return (
    <div className="component-editor" data-testid="component-editor-layered-info">
      <div className="component-editor__head">
        <span className="component-editor__type">{friendlyElementName(component)}</span>
      </div>

      <Section title="Isi">
        <Field label="Judul komponen">
          <input
            type="text"
            data-field="title"
            value={component.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Contoh: Tujuan Pembelajaran"
          />
        </Field>
      </Section>

      <Section title="Tampilan">
        <Field label="Jenis tampilan">
          <select
            data-field="variant"
            value={component.variant}
            onChange={(e) => onChange({ variant: e.target.value as LayeredInfoVariant })}
          >
            {LAYERED_INFO_VARIANTS.map((v) => (
              <option key={v} value={v}>
                {LAYERED_INFO_VARIANT_LABELS[v]}
              </option>
            ))}
          </select>
        </Field>
        <div className="component-editor__hint">
          Pilih cara lapisan ditampilkan: lipat, tab, tab ikon, langkah, kartu grid, atau linimasa.
        </div>
      </Section>

      <Section title={`Lapisan (${component.layers.length})`}>
        {/* Daftar layer — guru pilih layer mana yang mau diedit */}
        <div className="layered-info-layers" data-testid="layered-info-layers">
          {component.layers.map((layer, idx) => {
            const isActive = safeActiveIdx === idx;
            return (
              <div
                key={layer.id}
                className={`layered-info-layer${isActive ? ' is-active' : ''}`}
                onClick={() => setActiveLayerIdx(idx)}
                data-testid={`layered-info-layer-${idx}`}
                data-active={isActive ? 'true' : 'false'}
              >
                <span className="layered-info-layer__num">{idx + 1}</span>
                <span className="layered-info-layer__title">
                  {layer.title || '(tanpa judul)'}
                </span>
                <button
                  type="button"
                  className="layered-info-layer__remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLayer(idx);
                  }}
                  title="Hapus lapisan ini"
                  data-testid={`layered-info-layer-remove-${idx}`}
                >
                  ×
                </button>
              </div>
            );
          })}
          <button
            type="button"
            className="layered-info-layer__add"
            onClick={addLayer}
            title="Tambah lapisan baru"
            data-action="add-layer"
            data-testid="layered-info-add-layer"
          >
            + Tambah Lapisan
          </button>
        </div>
      </Section>

      {/* Edit layer AKTIF saja — bukan semua layer sekaligus */}
      {activeLayer && (
        <Section title={`Edit Lapisan ${safeActiveIdx + 1}`}>
          <Field label="Judul lapisan">
            <input
              type="text"
              value={activeLayer.title}
              onChange={(e) => updateLayer(safeActiveIdx, { title: e.target.value })}
              placeholder="Contoh: Sebelumnya"
              data-field={`layer-title-${safeActiveIdx}`}
              data-testid={`layered-info-layer-title-${safeActiveIdx}`}
            />
          </Field>
          {component.variant === 'iconTabs' && (
            <Field label="Ikon lapisan (emoji, opsional)">
              <input
                type="text"
                value={activeLayer.icon ?? ''}
                onChange={(e) =>
                  updateLayer(safeActiveIdx, { icon: e.target.value })
                }
                placeholder="Contoh: 📚"
                data-field={`layer-icon-${safeActiveIdx}`}
              />
            </Field>
          )}
          <Field label="Isi lapisan">
            <textarea
              value={activeLayer.body}
              onChange={(e) => updateLayer(safeActiveIdx, { body: e.target.value })}
              rows={6}
              style={{ width: '100%', resize: 'vertical' }}
              placeholder="Tulis isi lapisan di sini..."
              data-field={`layer-body-${safeActiveIdx}`}
              data-testid={`layered-info-layer-body-${safeActiveIdx}`}
            />
          </Field>
        </Section>
      )}

      <Section title="Lapisan Terbuka Default">
        <Field label="Index lapisan yang terbuka saat halaman dimuat">
          <select
            data-field="defaultOpenIndex"
            value={component.defaultOpenIndex ?? ''}
            onChange={(e) => {
              const val = e.target.value === '' ? null : Number(e.target.value);
              onChange({ defaultOpenIndex: val });
            }}
          >
            <option value="">— Semua tertutup —</option>
            {component.layers.map((layer, idx) => (
              <option key={layer.id} value={idx}>
                {idx + 1}. {layer.title || '(tanpa judul)'}
              </option>
            ))}
          </select>
        </Field>
        <div className="component-editor__hint">
          Lapisan yang otomatis terbuka saat siswa pertama kali lihat halaman. Untuk accordion, pilih "Semua tertutup" supaya siswa klik sendiri.
        </div>
      </Section>

      <Section title="Posisi & Ukuran">
        <GeometryFields component={component} onChange={onChange} />
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Learning Bridge Component Editor (LXC-03)
//
// Bridge adalah komponen statis: judul + pesan + tombol "next".
// Guru edit isi (title/message/nextButtonLabel), pilih variant (transition/
// recap/preview), dan posisi & ukuran. Tidak ada state runtime.
// ---------------------------------------------------------------------------

function LearningBridgeComponentEditor({
  component,
  onChange,
}: {
  component: LearningBridgeComponent;
  onChange: (patch: Partial<LearningBridgeComponentEditable>) => void;
}) {
  return (
    <div className="component-editor" data-testid="component-editor-learning-bridge">
      <div className="component-editor__head">
        <span className="component-editor__type">{friendlyElementName(component)}</span>
      </div>

      <Section title="Isi">
        <Field label="Judul jembatan">
          <input
            type="text"
            data-field="title"
            value={component.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Contoh: Kita sudah selesai dengan materi, sekarang lanjut ke kuis."
          />
        </Field>
        <Field label="Pesan jembatan">
          <textarea
            data-field="message"
            value={component.message}
            onChange={(e) => onChange({ message: e.target.value })}
            rows={5}
            style={{ width: '100%', resize: 'vertical' }}
            placeholder="Tulis pesan transisi / recap / preview di sini..."
          />
        </Field>
        <Field label="Label ajakan">
          <input
            type="text"
            data-field="nextButtonLabel"
            value={component.nextButtonLabel}
            onChange={(e) => onChange({ nextButtonLabel: e.target.value })}
            placeholder="Contoh: Lanjut →"
          />
        </Field>
        <div className="component-editor__hint">
          Tombol "lanjut" pada jembatan bersifat visual. Untuk navigasi nyata antar halaman, tambahkan elemen Navigasi terpisah.
        </div>
      </Section>

      <Section title="Tampilan">
        <Field label="Jenis jembatan">
          <select
            data-field="variant"
            value={component.variant}
            onChange={(e) => onChange({ variant: e.target.value as LearningBridgeVariant })}
            style={{ width: '100%' }}
          >
            {LEARNING_BRIDGE_VARIANTS.map((v) => (
              <option key={v} value={v}>
                {LEARNING_BRIDGE_VARIANT_LABELS[v]}
              </option>
            ))}
          </select>
        </Field>
        <div className="component-editor__hint">
          <strong>Transisi</strong>: pesan singkat antar bagian. <strong>Recap</strong>: ringkasan apa yang baru dipelajari. <strong>Preview</strong>: intipan apa yang akan datang.
        </div>
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
