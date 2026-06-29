/**
 * VisualSection — wrapper yang menggabungkan StylePackPicker + LayoutPresetPicker
 * dalam satu section "Atur Tampilan Media" (STYLE-LAYOUT-UX-UNIFICATION-01).
 *
 * Layer: editor
 * Allowed imports: react, ./StylePackPicker, ./LayoutPresetPicker
 *
 * Kontrak (STYLE-LAYOUT-UX-UNIFICATION-01 Scope B + C):
 *   Section wrapper dengan:
 *     - Title: "Atur Tampilan Media"
 *     - Hint: "Ubah tampilan dan susunan tanpa mengubah isi materi."
 *     - Safety: "Aman dicoba: isi materi, kuis, dan tujuan tidak berubah."
 *     - StylePackPicker (dengan hint "Pilih warna dan nuansa media.")
 *     - LayoutPresetPicker (dengan hint "Pilih susunan elemen di halaman ini.")
 *
 *   Tujuan: guru paham bahwa Tampilan Media (style) dan Susunan Halaman (layout)
 *   adalah dua kontrol berbeda tapi satu keluarga, dan keduanya aman dicoba
 *   karena tidak mengubah isi materi.
 *
 *   Tidak menambah engine baru. Hanya UX grouping + copy.
 */

import { StylePackPicker } from './StylePackPicker';
import { LayoutPresetPicker } from './LayoutPresetPicker';

export function VisualSection() {
  return (
    <section
      className="inspector-visual-section"
      data-testid="visual-section"
    >
      <div className="inspector-visual-section__header">
        <div className="inspector-visual-section__title">Atur Tampilan Media</div>
        <p className="inspector-visual-section__hint">
          Ubah tampilan dan susunan tanpa mengubah isi materi.
        </p>
        <p className="inspector-visual-section__safety" data-testid="visual-section-safety">
          Aman dicoba: isi materi, kuis, dan tujuan tidak berubah.
        </p>
      </div>

      <div className="inspector-visual-section__pickers">
        <div className="inspector-visual-section__picker-group">
          <p className="inspector-visual-section__picker-hint">
            Pilih warna dan nuansa media.
          </p>
          <StylePackPicker />
        </div>

        <div className="inspector-visual-section__picker-group">
          <p className="inspector-visual-section__picker-hint">
            Pilih susunan elemen di halaman ini.
          </p>
          <LayoutPresetPicker />
        </div>
      </div>
    </section>
  );
}
