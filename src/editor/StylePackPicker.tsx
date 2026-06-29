/**
 * StylePackPicker — UI sederhana untuk pilih style pack (STYLE-PACK-SYSTEM-V1).
 *
 * Layer: editor
 * Allowed imports: react, ../store/editor-store, ../core/style-packs/style-pack-registry
 *
 * Kontrak (STYLE-PACK-SYSTEM-V1 Scope F):
 *   Picker kecil yang menampilkan 3 pilihan style pack:
 *     - Modern Clean
 *     - Soft Classroom
 *     - Mission Dark
 *
 *   Label guru: "Tampilan Media"
 *   Behavior: pilih → setStylePack(id) → project style berubah → canvas refresh.
 *
 *   Tidak menampilkan raw ID sebagai teks utama.
 *   Hanya tampil saat tidak ada komponen terpilih (di Inspector empty state).
 */

import { useEditorStore } from '../store/editor-store';
import {
  listStylePacksV1,
  getProjectStylePackIdV1,
  resolveStylePackV1,
  type StylePackV1,
} from '../core/style-packs/style-pack-registry';

export function StylePackPicker() {
  const project = useEditorStore((s) => s.project);
  const setStylePack = useEditorStore((s) => s.setStylePack);

  const packs = listStylePacksV1();
  const currentId = getProjectStylePackIdV1(project.stylePackId);

  const handleSelect = (pack: StylePackV1) => {
    setStylePack(pack.id);
  };

  return (
    <div className="style-pack-picker" data-testid="style-pack-picker">
      <div className="style-pack-picker__label">Tampilan Media</div>
      <div className="style-pack-picker__options">
        {packs.map((pack) => (
          <button
            key={pack.id}
            type="button"
            className={`style-pack-option${currentId === pack.id ? ' is-selected' : ''}`}
            onClick={() => handleSelect(pack)}
            title={pack.description}
            data-testid={`style-pack-option-${pack.id}`}
            data-style-pack-id={pack.id}
            data-selected={currentId === pack.id ? 'true' : 'false'}
            aria-pressed={currentId === pack.id}
          >
            <span className="style-pack-option__swatch" aria-hidden>
              <StylePackSwatch pack={pack} />
            </span>
            <span className="style-pack-option__name">{pack.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Mini swatch showing the style pack's color palette.
 */
function StylePackSwatch({ pack }: { pack: StylePackV1 }) {
  const resolved = resolveStylePackV1(pack.id);
  const colors = resolved.colors;

  return (
    <span
      className="style-pack-swatch"
      style={{
        background: colors.background,
        color: colors.text,
        borderColor: colors.primary,
      }}
    >
      <span
        className="style-pack-swatch__dot"
        style={{ background: colors.primary }}
        aria-hidden
      />
      <span
        className="style-pack-swatch__dot"
        style={{ background: colors.surface }}
        aria-hidden
      />
    </span>
  );
}
