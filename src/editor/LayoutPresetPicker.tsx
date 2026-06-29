/**
 * LayoutPresetPicker — UI sederhana untuk pilih layout preset (LAYOUT-PRESET-SYSTEM-V1).
 *
 * Layer: editor
 * Allowed imports: react, ../store/editor-store, ../core/layout-presets/layout-preset-registry
 *
 * Kontrak (LAYOUT-PRESET-SYSTEM-V1 Scope G):
 *   Picker kecil yang menampilkan layout preset yang cocok untuk role
 *   halaman aktif. Label guru: "Susunan Halaman".
 *
 *   Behavior: pilih → applyLayoutPreset(pageId, presetId) → geometry berubah.
 *   Tidak menampilkan raw ID sebagai teks utama.
 *   Hanya tampil saat tidak ada komponen terpilih (di Inspector empty state).
 */

import { useEditorStore } from '../store/editor-store';
import {
  listLayoutPresetsForRole,
  type LayoutPreset,
} from '../core/layout-presets/layout-preset-registry';

export function LayoutPresetPicker() {
  const project = useEditorStore((s) => s.project);
  const currentPageId = project.currentPageId;
  const currentPage = project.pages.find((p) => p.id === currentPageId);
  const applyLayoutPreset = useEditorStore((s) => s.applyLayoutPreset);

  if (!currentPage) return null;

  const presets = listLayoutPresetsForRole(currentPage.role);

  if (presets.length === 0) return null;

  const handleSelect = (preset: LayoutPreset) => {
    applyLayoutPreset(currentPage.id, preset.id);
  };

  return (
    <div className="layout-preset-picker" data-testid="layout-preset-picker">
      <div className="layout-preset-picker__label">Susunan Halaman</div>
      <div className="layout-preset-picker__options">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`layout-preset-option${currentPage.layoutId === preset.id ? ' is-selected' : ''}`}
            onClick={() => handleSelect(preset)}
            title={preset.description}
            data-testid={`layout-preset-option-${preset.id}`}
            data-preset-id={preset.id}
            data-selected={currentPage.layoutId === preset.id ? 'true' : 'false'}
            aria-pressed={currentPage.layoutId === preset.id}
          >
            <span className="layout-preset-option__name">{preset.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
