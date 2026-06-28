/**
 * PatternLibraryPanel — UI untuk Content Pattern Library (UX-03).
 *
 * Layer: editor
 * Allowed imports: react, ../store/editor-store, ../core/types, ./content-patterns, ./teaching-suggestion
 *
 * Kontrak (UX-03 Scope D):
 *   Menampilkan daftar pola isi yang disarankan untuk halaman aktif.
 *   Render di Inspector (Panel Isi) saat tidak ada komponen terpilih.
 *
 *   Setiap pola ditampilkan sebagai kartu dengan:
 *     - Ikon
 *     - Nama pola
 *     - Deskripsi singkat
 *     - Alasan kenapa disarankan (dari teaching-suggestion engine)
 *     - Tombol "Terapkan" — memanggil store.addComponentsToPage
 *
 *   Pola "primary" ditampilkan dengan border biru + tombol "Terapkan" primary.
 *   Pola "secondary" ditampilkan dengan border abu-abu + tombol ghost.
 *
 *   Panel hanya muncul kalau ada pola yang applicable untuk role halaman.
 *   Role 'free' tidak punya pola khusus → panel tidak muncul.
 */

import { useEditorStore } from '../store/editor-store';
import type { SimplePage, SimpleProject } from '../core/types';
import type { ContentPattern } from './content-patterns';
import {
  suggestPatternsForPage,
  classifyPageState,
  getSuggestionHeader,
  getSuggestionSubHeader,
  type TeachingSuggestion,
} from './teaching-suggestion';

export function PatternLibraryPanel({
  currentPage,
  project,
}: {
  currentPage: SimplePage;
  project: SimpleProject;
}) {
  const addComponentsToPage = useEditorStore((s) => s.addComponentsToPage);

  const suggestions = suggestPatternsForPage(currentPage, project);
  const pageState = classifyPageState(currentPage);
  const header = getSuggestionHeader(pageState);
  const subHeader = getSuggestionSubHeader(pageState);

  if (suggestions.length === 0) {
    // No patterns for this role (e.g., 'free') — don't render the panel.
    return null;
  }

  const handleApply = (pattern: ContentPattern) => {
    const components = pattern.buildComponents({ project, page: currentPage });
    const added = addComponentsToPage(currentPage.id, components);
    if (added === 0) {
      window.alert('Tidak ada elemen yang bisa ditambahkan — halaman ini mungkin terpandu.');
    } else if (added < components.length) {
      window.alert(
        `${added} dari ${components.length} elemen ditambahkan. ` +
        'Beberapa elemen tidak diizinkan di halaman ini.',
      );
    }
  };

  return (
    <div
      className="pattern-library"
      data-testid="pattern-library"
      data-page-state={pageState}
    >
      <div className="pattern-library__head">
        <span className="pattern-library__title">{header}</span>
        <span className="pattern-library__sub">{subHeader}</span>
      </div>
      <div className="pattern-library__list">
        {suggestions.map((suggestion: TeachingSuggestion) => (
          <PatternCard
            key={suggestion.pattern.id}
            suggestion={suggestion}
            onApply={() => handleApply(suggestion.pattern)}
          />
        ))}
      </div>
    </div>
  );
}

function PatternCard({
  suggestion,
  onApply,
}: {
  suggestion: TeachingSuggestion;
  onApply: () => void;
}) {
  const { pattern, reason, priority } = suggestion;
  const isPrimary = priority === 'primary';
  return (
    <div
      className={`pattern-card${isPrimary ? ' is-primary' : ''}`}
      data-testid={`pattern-card-${pattern.id}`}
      data-priority={priority}
    >
      <div className="pattern-card__head">
        <span className="pattern-card__icon" aria-hidden>{pattern.icon}</span>
        <div className="pattern-card__title-wrap">
          <span className="pattern-card__name">{pattern.name}</span>
          {isPrimary && (
            <span className="pattern-card__badge" data-testid={`pattern-badge-${pattern.id}`}>
              Disarankan
            </span>
          )}
        </div>
      </div>
      <p className="pattern-card__description">{pattern.description}</p>
      <p className="pattern-card__reason" data-testid={`pattern-reason-${pattern.id}`}>
        {reason}
      </p>
      <button
        type="button"
        className={`pattern-card__apply${isPrimary ? ' is-primary' : ''}`}
        onClick={onApply}
        data-action="apply-pattern"
        data-pattern-id={pattern.id}
        data-testid={`pattern-apply-${pattern.id}`}
      >
        Terapkan
      </button>
    </div>
  );
}
