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
import { useEditorStore } from '../store/editor-store';

export function VisualSection() {
  const hasAiStyle = useEditorStore((s) => s.project.hasAiStyleOverrides ?? false);

  return (
    <section
      className="inspector-visual-section"
      data-testid="visual-section"
    >
      <div className="inspector-visual-section__header">
        <div className="inspector-visual-section__title">Atur Tampilan Media</div>
        <p className="inspector-visual-section__hint">
          Ganti gaya visual kapan saja. Materi, kuis, dan jawaban tetap aman.
        </p>
        <p className="inspector-visual-section__safety" data-testid="visual-section-safety">
          Aman dicoba — perubahan tampilan tidak mengubah isi materi.
        </p>
      </div>

      {/* UX-04: AI Style section — show when project has AI overrides */}
      {hasAiStyle && (
        <div
          data-testid="ai-style-section"
          style={{
            marginBottom: 12, padding: 10, borderRadius: 8,
            background: 'var(--color-ai-style-bg-gradient)',
            border: '1px solid var(--color-ai-style-border)',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-ai-style)', marginBottom: 4 }}>
            ✨ Style dari AI
          </div>
          <p style={{ fontSize: 11, color: 'var(--color-ai-style-strong)', lineHeight: 1.5, margin: 0 }}>
            Desain ini menggunakan kustomisasi warna/font dari AI.
            Pilih style pack di bawah untuk mengganti ke style bawaan.
          </p>
        </div>
      )}

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
