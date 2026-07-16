/**
 * SlideSettingsDialog — V2-PILAR-1 dialog for editing GlobalSlideSettings.
 *
 * Layer: editor
 * Allowed imports: react, ../store/editor-store, ../core/types, ../core/project-factory
 *
 * Kontrak:
 *   - Modal dialog untuk edit pengaturan global slide.
 *   - Murni user-side setting. Tidak terkait AI import.
 *   - Real-time preview: perubahan langsung apply ke store, canvas + preview
 *     + export reflect perubahan tanpa perlu "Terapkan" button.
 *   - Tombol "Reset ke Default" untuk kembalikan ke DEFAULT_GLOBAL_SLIDE_SETTINGS.
 *   - Tombol "Tutup" untuk tutup dialog.
 *
 * UI Sections:
 *   1. Posisi Toolbar (radio: bottom-center, top-center, bottom-left, bottom-right)
 *   2. Gaya Toolbar (radio: glass, solid, minimal)
 *   3. Tampilan (checkbox: showSceneTitle, showProgressText, showProgressBar)
 *   4. Transisi Slide (radio: none, fade, slide)
 */

import { useState, useEffect } from 'react';
import { useEditorStore } from '../store/editor-store';
import {
  DEFAULT_GLOBAL_SLIDE_SETTINGS,
  getEffectiveGlobalSlideSettings,
} from '../core/project-factory';
import {
  NAV_TOOLBAR_POSITIONS,
  NAV_TOOLBAR_STYLES,
  SLIDE_TRANSITIONS,
  type NavToolbarPosition,
  type NavToolbarStyle,
  type SlideTransition,
} from '../core/types';

const POSITION_LABELS: Record<NavToolbarPosition, string> = {
  'bottom-center': 'Bawah Tengah (default)',
  'top-center': 'Atas Tengah',
  'bottom-left': 'Bawah Kiri',
  'bottom-right': 'Bawah Kanan',
};

const STYLE_LABELS: Record<NavToolbarStyle, string> = {
  glass: 'Kaca Buram (default)',
  solid: 'Solid',
  minimal: 'Minimalis',
};

const TRANSITION_LABELS: Record<SlideTransition, string> = {
  none: 'Langsung (default)',
  fade: 'Fade',
  slide: 'Geser',
};

export function SlideSettingsDialog({ onClose }: { onClose: () => void }) {
  const project = useEditorStore((s) => s.project);
  const setGlobalSlideSettings = useEditorStore((s) => s.setGlobalSlideSettings);
  const effective = getEffectiveGlobalSlideSettings(project);

  // MEGA FIX #4: Escape key handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Local state untuk controlled form — sinkron dengan store
  const [position, setPosition] = useState<NavToolbarPosition>(effective.navigationToolbar.position);
  const [style, setStyle] = useState<NavToolbarStyle>(effective.navigationToolbar.style);
  const [showSceneTitle, setShowSceneTitle] = useState(effective.navigationToolbar.showSceneTitle);
  const [showProgressText, setShowProgressText] = useState(effective.navigationToolbar.showProgressText);
  const [showProgressBar, setShowProgressBar] = useState(effective.navigationToolbar.showProgressBar);
  const [slideTransition, setSlideTransition] = useState<SlideTransition>(effective.slideTransition);
  // V2-PILAR-2.5: editor grid state
  const [gridEnabled, setGridEnabled] = useState(effective.editorGrid.enabled);
  const [gridSize, setGridSize] = useState(effective.editorGrid.gridSize);
  const [snapToGrid, setSnapToGrid] = useState(effective.editorGrid.snapToGrid);

  // Apply perubahan ke store (real-time)
  const apply = (patch: {
    navigationToolbar?: Partial<typeof effective.navigationToolbar>;
    slideTransition?: typeof effective.slideTransition;
    editorGrid?: Partial<typeof effective.editorGrid>;
  }) => {
    setGlobalSlideSettings({
      navigationToolbar: patch.navigationToolbar,
      slideTransition: patch.slideTransition,
      editorGrid: patch.editorGrid,
    });
  };

  const handlePositionChange = (newPosition: NavToolbarPosition) => {
    setPosition(newPosition);
    apply({
      navigationToolbar: {
        position: newPosition,
        style,
        showSceneTitle,
        showProgressText,
        showProgressBar,
      },
    });
  };

  const handleStyleChange = (newStyle: NavToolbarStyle) => {
    setStyle(newStyle);
    apply({
      navigationToolbar: {
        position,
        style: newStyle,
        showSceneTitle,
        showProgressText,
        showProgressBar,
      },
    });
  };

  const handleShowSceneTitleChange = (value: boolean) => {
    setShowSceneTitle(value);
    apply({
      navigationToolbar: {
        position, style,
        showSceneTitle: value,
        showProgressText, showProgressBar,
      },
    });
  };

  const handleShowProgressTextChange = (value: boolean) => {
    setShowProgressText(value);
    apply({
      navigationToolbar: {
        position, style, showSceneTitle,
        showProgressText: value,
        showProgressBar,
      },
    });
  };

  const handleShowProgressBarChange = (value: boolean) => {
    setShowProgressBar(value);
    apply({
      navigationToolbar: {
        position, style, showSceneTitle, showProgressText,
        showProgressBar: value,
      },
    });
  };

  const handleSlideTransitionChange = (newTransition: SlideTransition) => {
    setSlideTransition(newTransition);
    apply({ slideTransition: newTransition });
  };

  // V2-PILAR-2.5: Editor grid handlers
  const handleGridEnabledChange = (value: boolean) => {
    setGridEnabled(value);
    apply({ editorGrid: { enabled: value } });
  };
  const handleGridSizeChange = (value: number) => {
    const clamped = Math.max(10, Math.min(200, value));
    setGridSize(clamped);
    apply({ editorGrid: { gridSize: clamped } });
  };
  const handleSnapToGridChange = (value: boolean) => {
    setSnapToGrid(value);
    apply({ editorGrid: { snapToGrid: value } });
  };

  const handleReset = () => {
    setPosition(DEFAULT_GLOBAL_SLIDE_SETTINGS.navigationToolbar.position);
    setStyle(DEFAULT_GLOBAL_SLIDE_SETTINGS.navigationToolbar.style);
    setShowSceneTitle(DEFAULT_GLOBAL_SLIDE_SETTINGS.navigationToolbar.showSceneTitle);
    setShowProgressText(DEFAULT_GLOBAL_SLIDE_SETTINGS.navigationToolbar.showProgressText);
    setShowProgressBar(DEFAULT_GLOBAL_SLIDE_SETTINGS.navigationToolbar.showProgressBar);
    setSlideTransition(DEFAULT_GLOBAL_SLIDE_SETTINGS.slideTransition);
    setGridEnabled(DEFAULT_GLOBAL_SLIDE_SETTINGS.editorGrid.enabled);
    setGridSize(DEFAULT_GLOBAL_SLIDE_SETTINGS.editorGrid.gridSize);
    setSnapToGrid(DEFAULT_GLOBAL_SLIDE_SETTINGS.editorGrid.snapToGrid);
    setGlobalSlideSettings(null); // null = reset to default
  };

  return (
    <div
      className="slide-settings-overlay"
      data-testid="slide-settings-overlay"
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="slide-settings-dialog"
        data-testid="slide-settings-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-panel, #ffffff)',
          borderRadius: 16, padding: 24, maxWidth: 520, width: '90%',
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <h2 style={{ margin: '0 0 16px 0', fontSize: 20, color: 'var(--color-text, #1f2533)' }}>
          ⚙️ Pengaturan Slide
        </h2>
        <p style={{ margin: '0 0 20px 0', fontSize: 13, color: 'var(--color-muted, #8a8775)' }}>
          Pengaturan ini berlaku untuk semua halaman. Perubahan langsung tampil di kanvas, pratinjau, dan ekspor.
        </p>

        {/* Section 1: Posisi Toolbar */}
        <fieldset style={fieldsetStyle}>
          <legend style={legendStyle}>Posisi Toolbar Navigasi</legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {NAV_TOOLBAR_POSITIONS.map((pos) => (
              <label key={pos} style={radioLabelStyle}>
                <input
                  type="radio"
                  name="position"
                  value={pos}
                  checked={position === pos}
                  onChange={() => handlePositionChange(pos)}
                  data-testid={`slide-settings-position-${pos}`}
                />
                <span>{POSITION_LABELS[pos]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Section 2: Gaya Toolbar */}
        <fieldset style={fieldsetStyle}>
          <legend style={legendStyle}>Gaya Toolbar</legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {NAV_TOOLBAR_STYLES.map((s) => (
              <label key={s} style={radioLabelStyle}>
                <input
                  type="radio"
                  name="style"
                  value={s}
                  checked={style === s}
                  onChange={() => handleStyleChange(s)}
                  data-testid={`slide-settings-style-${s}`}
                />
                <span>{STYLE_LABELS[s]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Section 3: Tampilan */}
        <fieldset style={fieldsetStyle}>
          <legend style={legendStyle}>Tampilan</legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={showSceneTitle}
                onChange={(e) => handleShowSceneTitleChange(e.target.checked)}
                data-testid="slide-settings-show-scene-title"
              />
              <span>Tampilkan judul scene</span>
            </label>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={showProgressText}
                onChange={(e) => handleShowProgressTextChange(e.target.checked)}
                data-testid="slide-settings-show-progress-text"
              />
              <span>Tampilkan teks progress (mis. "3 / 12")</span>
            </label>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={showProgressBar}
                onChange={(e) => handleShowProgressBarChange(e.target.checked)}
                data-testid="slide-settings-show-progress-bar"
              />
              <span>Tampilkan progress bar visual</span>
            </label>
          </div>
        </fieldset>

        {/* Section 4: Transisi Slide */}
        <fieldset style={fieldsetStyle}>
          <legend style={legendStyle}>Transisi Antar Slide</legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {SLIDE_TRANSITIONS.map((t) => (
              <label key={t} style={radioLabelStyle}>
                <input
                  type="radio"
                  name="slideTransition"
                  value={t}
                  checked={slideTransition === t}
                  onChange={() => handleSlideTransitionChange(t)}
                  data-testid={`slide-settings-transition-${t}`}
                />
                <span>{TRANSITION_LABELS[t]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* V2-PILAR-2.5: Editor Grid */}
        <fieldset style={fieldsetStyle}>
          <legend style={legendStyle}>Grid Editor (Presisi Tata Letak)</legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={gridEnabled}
                onChange={(e) => handleGridEnabledChange(e.target.checked)}
                data-testid="slide-settings-grid-enabled"
              />
              <span>Tampilkan grid di kanvas editor</span>
            </label>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={snapToGrid}
                onChange={(e) => handleSnapToGridChange(e.target.checked)}
                data-testid="slide-settings-snap-to-grid"
                disabled={!gridEnabled}
              />
              <span>Magnet ke grid saat geser/ubah ukuran (toleransi 6px)</span>
            </label>
            <label style={radioLabelStyle}>
              <span>Ukuran grid (piksel):</span>
              <input
                type="number"
                value={gridSize}
                onChange={(e) => handleGridSizeChange(Number(e.target.value))}
                min={10}
                max={200}
                step={10}
                data-testid="slide-settings-grid-size"
                style={{ width: 80, padding: '4px 8px', borderRadius: 4, border: '1px solid var(--color-border, #e3ddcd)', fontSize: 14 }}
                disabled={!gridEnabled}
              />
            </label>
          </div>
        </fieldset>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, gap: 8 }}>
          <button
            type="button"
            onClick={handleReset}
            data-testid="slide-settings-reset"
            style={secondaryButtonStyle}
          >
            ↺ Reset ke Default
          </button>
          <button
            type="button"
            onClick={onClose}
            data-testid="slide-settings-close"
            style={primaryButtonStyle}
            autoFocus
          >
            ✓ Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline styles (keeps dialog self-contained — no styles.css dependency)
// ---------------------------------------------------------------------------

const fieldsetStyle: React.CSSProperties = {
  border: '1px solid var(--color-border, #e3ddcd)',
  borderRadius: 10,
  padding: '12px 16px',
  marginBottom: 14,
};

const legendStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  color: 'var(--color-muted, #8a8775)',
  padding: '0 8px',
};

const radioLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 14,
  cursor: 'pointer',
  color: 'var(--color-text, #1f2533)',
};

const checkboxLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 14,
  cursor: 'pointer',
  color: 'var(--color-text, #1f2533)',
};

const primaryButtonStyle: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: 10,
  border: 'none',
  background: 'var(--color-accent, #1e5b8f)',
  color: '#ffffff',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: 10,
  border: '1px solid var(--color-border-strong, #c8be9f)',
  background: 'transparent',
  color: 'var(--color-text, #1f2533)',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
};
