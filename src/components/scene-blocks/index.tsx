/**
 * Reusable Scene Blocks (GOLDEN-REFERENCE-RENDER-P1 + INTERACTION-P1).
 *
 * Layer: components/scene-blocks
 * Allowed imports: react, ../../core/mpi-design-contract
 *
 * Kontrak:
 *   Reusable block layer untuk scene composers. Setiap block:
 *     - Tidak mengandung sceneType spesifik.
 *     - Tidak hardcode warna utama (semua dari contract/plan).
 *     - Bisa dipakai editor dan preview.
 *     - Export HTML punya padanan renderer yang sama.
 *     - Class name stabil untuk test.
 *     - INTERACTION-P1: blocks punya state ringan (tabs, accordion, timer, input, reveal).
 *
 *   Semua block mengambil nilai visual dari:
 *     contract.palette, contract.typography, contract.card, contract.button, dll.
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { MpiDesignContract } from '../../core/mpi-design-contract';
import {
  resolveMotionProfile,
  type MotionPresetProfile,
} from '../../core/style-packs/motion-preset';
import { sanitizeCustomStyle } from '../../core/style/sanitize';
import type { CustomStyleMap } from '../../core/style/sanitize';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type BlockProps = {
  contract: MpiDesignContract;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** CUSTOM-STYLE-01: AI custom CSS overlay per element */
  customStyle?: Record<string, Record<string, string>>;
};

// ---------------------------------------------------------------------------
// DEEP-STYLE-INJECTION-01: CustomStyleContext
// React Context yang menyediakan customStyle ke semua block di dalam scene.
// Composer TIDAK perlu forward customStyle eksplisit — block konsumsi context.
// Prioritas: explicit customStyle prop > context value.
// Context menerima RAW customStyle (belum di-sanitize). Block sanitize sendiri
// (idempotent — sanitize dari sanitized input menghasilkan output yang sama).
// ---------------------------------------------------------------------------

const CustomStyleContext = createContext<CustomStyleMap | undefined>(undefined);

export function CustomStyleProvider({
  value,
  children,
}: {
  value: CustomStyleMap | undefined;
  children: ReactNode;
}) {
  return (
    <CustomStyleContext.Provider value={value}>
      {children}
    </CustomStyleContext.Provider>
  );
}

/** Ambil customStyle dari context. Block pakai ini sebagai fallback. */
function useCustomStyleFromContext(): CustomStyleMap | undefined {
  return useContext(CustomStyleContext);
}

// ---------------------------------------------------------------------------
// MOTION-PRESET-01: shared motion profile
// Resolved once at module load — stable class names, no per-render churn.
// ---------------------------------------------------------------------------

const MOTION: MotionPresetProfile = resolveMotionProfile();

// ---------------------------------------------------------------------------
// 1. SceneShell
// ---------------------------------------------------------------------------

export function SceneShell({ contract, children, className = '', style, customStyle }: BlockProps) {
  // PREMIUM-STYLE-AFTER-FOUNDATION-01: subtle radial gradient + depth via contract palette
  // TEMPLATE-PEDAGOGIS-READY-02 PATCH B: explicit overflow — vertical auto,
  // horizontal hidden. Content must NEVER cause horizontal scroll on 16:9.
  // DEEP-STYLE-INJECTION-01: customStyle.shell from prop or context (prop wins)
  const ctxStyle = useCustomStyleFromContext();
  const merged = customStyle ?? ctxStyle;
  const safeStyle = sanitizeCustomStyle(merged);
  const shellStyle = safeStyle?.shell as CSSProperties | undefined;
  const bgColor = contract.palette.background;
  const surfaceColor = contract.palette.surface;
  return (
    <div className={`silse-block-shell ${className}`.trim()} style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      gap: 16, padding: 28, boxSizing: 'border-box',
      overflowX: 'hidden', overflowY: 'auto',
      background: `radial-gradient(ellipse at top, ${surfaceColor} 0%, ${bgColor} 70%)`,
      color: contract.palette.text,
      fontFamily: contract.typography.bodyFont,
      ...style,
      ...shellStyle,
    }}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. SceneHeader
// ---------------------------------------------------------------------------

export function SceneHeader({
  contract, chipIcon, chipLabel, chipColor, title, subtitle, className = '', customStyle,
}: BlockProps & {
  chipIcon?: string; chipLabel?: string; chipColor?: string;
  title: string; subtitle?: string;
}) {
  // PREMIUM-STYLE-AFTER-FOUNDATION-01: stronger hierarchy with accent line + letter spacing
  // MOTION-PRESET-01: entrance slide-up on header
  // CUSTOM-STYLE-01: AI can override header + chip styles (sanitized)
  // DEEP-STYLE-INJECTION-01: customStyle from prop or context (prop wins)
  const ctxStyle = useCustomStyleFromContext();
  const merged = customStyle ?? ctxStyle;
  const safeStyle = sanitizeCustomStyle(merged);
  const headerStyle = safeStyle?.header as CSSProperties | undefined;
  const chipStyle = safeStyle?.chip as CSSProperties | undefined;
  return (
    <div className={`silse-block-header ${MOTION.entranceSlideUpClass} ${className}`.trim()} style={{ borderBottom: `2px solid ${chipColor || contract.palette.gold}33`, paddingBottom: 10, marginBottom: 4, ...headerStyle }}>
      {chipLabel && (
        <div className="silse-block-chip" style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 14px', borderRadius: contract.badge.radius,
          background: chipColor ? `${chipColor}22` : contract.badge.background,
          color: chipColor || contract.badge.color,
          fontSize: 11, fontWeight: 800, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase',
          ...chipStyle,
        }}>
          {chipIcon && <span>{chipIcon}</span>}
          {chipLabel}
        </div>
      )}
      <div style={{
        fontFamily: contract.typography.heroFont,
        fontSize: contract.typography.titleSize,
        fontWeight: contract.typography.titleWeight,
        color: contract.palette.text,
        lineHeight: 1.2,
        letterSpacing: '-0.02em',
      }}>{title}</div>
      {subtitle && (
        <div style={{ fontSize: 14, color: contract.palette.mutedText, lineHeight: 1.6, marginTop: 6 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. SceneChip
// ---------------------------------------------------------------------------

export function SceneChip({ contract, label, icon, color, className = '', customStyle }: BlockProps & {
  label: string; icon?: string; color?: string;
}) {
  // DEEP-STYLE-INJECTION-01: customStyle.chip from prop or context (prop wins)
  const ctxStyle = useCustomStyleFromContext();
  const merged = customStyle ?? ctxStyle;
  const safeStyle = sanitizeCustomStyle(merged);
  const chipOverlay = safeStyle?.chip as CSSProperties | undefined;
  return (
    <span className={`silse-block-chip ${MOTION.hoverLiftClass} ${className}`.trim()} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 12px', borderRadius: contract.badge.radius,
      background: color ? `${color}22` : contract.badge.background,
      color: color || contract.badge.color,
      fontSize: 12, fontWeight: 800,
      ...chipOverlay,
    }}>
      {icon && <span>{icon}</span>}
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// 4. ScenePanel
// ---------------------------------------------------------------------------

export function ScenePanel({ contract, children, className = '', style, title, customStyle }: BlockProps & { title?: string }) {
  // PREMIUM-STYLE-AFTER-FOUNDATION-01: depth shadow from contract.card.shadow
  // MOTION-PRESET-01: entrance fade + hover lift (both reduced-motion safe via CSS)
  // CUSTOM-STYLE-01: AI can override panel styles (radius, shadow, border, bg) — sanitized
  // DEEP-STYLE-INJECTION-01: customStyle from prop or context (prop wins)
  const ctxStyle = useCustomStyleFromContext();
  const merged = customStyle ?? ctxStyle;
  const safeStyle = sanitizeCustomStyle(merged);
  const panelStyle = safeStyle?.panel as CSSProperties | undefined;
  return (
    <div className={`silse-block-panel ${MOTION.entranceFadeClass} ${MOTION.hoverLiftClass} ${className}`.trim()} style={{
      background: contract.card.background,
      border: contract.card.border,
      borderRadius: contract.card.radius,
      padding: contract.card.padding,
      boxShadow: contract.card.shadow || '0 2px 8px rgba(0,0,0,0.08)',
      ...style,
      ...panelStyle,
    }}>
      {title && <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8, color: contract.palette.mutedText, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</div>}
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. SceneGrid
// ---------------------------------------------------------------------------

export function SceneGrid({ children, className = '', columns, gap = 10, customStyle }: BlockProps & {
  columns?: string; gap?: number;
}) {
  // LAYOUT-STYLE-01: customStyle.grid from prop or context (prop wins)
  // AI can override gridTemplateColumns, gap, display via grid key.
  // Sanitizer ensures only safe patterns pass (repeat(N,1fr), minmax 100-500px, gap 0-100px).
  const ctxStyle = useCustomStyleFromContext();
  const merged = customStyle ?? ctxStyle;
  const safeStyle = sanitizeCustomStyle(merged);
  const gridOverlay = safeStyle?.grid as CSSProperties | undefined;
  return (
    <div className={`silse-block-card ${className}`.trim()} style={{
      display: 'grid',
      gridTemplateColumns: columns || 'repeat(auto-fill, minmax(240px, 1fr))',
      gap,
      ...gridOverlay,
    }}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6. SceneTabs
// ---------------------------------------------------------------------------

// INTERACTION-P1: SceneTabs with internal state — tabs bisa berpindah panel
// COMPONENT-STYLE-01: consume customStyle.tabs from context (active + inactive tab styling)
export function SceneTabs({ contract, tabs, activeTab: externalTab, onTabClick, className = '', customStyle }: BlockProps & {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onTabClick?: (id: string) => void;
}) {
  const [internalTab, setInternalTab] = useState(externalTab || tabs[0]?.id || '');
  const activeTab = externalTab || internalTab;
  const handleTabClick = useCallback((id: string) => {
    setInternalTab(id);
    onTabClick?.(id);
  }, [onTabClick]);

  // COMPONENT-STYLE-01: customStyle.tabs from prop or context (prop wins)
  const ctxStyle = useCustomStyleFromContext();
  const merged = customStyle ?? ctxStyle;
  const safeStyle = sanitizeCustomStyle(merged);
  const tabsOverlay = safeStyle?.tabs as CSSProperties | undefined;

  return (
    <div className={`silse-block-tabs ${className}`.trim()} style={{ display: 'flex', gap: 6, flexWrap: 'wrap', ...tabsOverlay }} data-testid="silse-block-tabs">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button key={tab.id} onClick={() => handleTabClick(tab.id)} data-tab-id={tab.id} style={{
            padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 800,
            cursor: 'pointer', border: 'none', transition: 'all 0.2s',
            background: isActive ? contract.palette.gold : 'rgba(255,255,255,0.04)',
            color: isActive ? contract.palette.primary : contract.palette.mutedText,
          }}>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 7. SceneAccordion — INTERACTION-P1: internal state, buka/tutup
// ---------------------------------------------------------------------------

export function SceneAccordion({ contract, items, openIndex: externalIdx, onToggle, className = '', customStyle }: BlockProps & {
  items: { title: string; body: string }[];
  openIndex: number | null;
  onToggle?: (idx: number) => void;
}) {
  const [internalIdx, setInternalIdx] = useState<number | null>(externalIdx ?? null);
  const openIndex = externalIdx !== undefined ? externalIdx : internalIdx;
  const handleToggle = useCallback((idx: number) => {
    setInternalIdx(prev => prev === idx ? null : idx);
    onToggle?.(idx);
  }, [onToggle]);

  // COMPONENT-STYLE-01: customStyle.accordion from prop or context (prop wins)
  const ctxStyle = useCustomStyleFromContext();
  const merged = customStyle ?? ctxStyle;
  const safeStyle = sanitizeCustomStyle(merged);
  const accordionOverlay = safeStyle?.accordion as CSSProperties | undefined;

  return (
    <div className={`silse-block-accordion ${className}`.trim()} style={{ display: 'flex', flexDirection: 'column', gap: 6, ...accordionOverlay }} data-testid="silse-block-accordion">
      {items.map((item, idx) => {
        const isOpen = idx === openIndex;
        return (
          <div key={idx} data-accordion-idx={idx} style={{
            borderRadius: contract.card.radius, overflow: 'hidden',
            border: isOpen ? `1px solid ${contract.palette.gold}` : contract.card.border,
            background: contract.card.background,
          }}>
            <div onClick={() => handleToggle(idx)} style={{
              padding: '12px 16px', cursor: 'pointer',
              fontWeight: 800, fontSize: 14, color: contract.palette.text,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>{isOpen ? '▾' : '▸'} {item.title}</span>
            </div>
            {isOpen && (
              <div style={{ padding: '0 16px 14px', fontSize: 14, lineHeight: 1.6, color: contract.palette.mutedText }}>
                {item.body}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 8. DiscussionBanner
// ---------------------------------------------------------------------------

export function DiscussionBanner({ contract, label, title, body, icon, accentColor, className = '' }: BlockProps & {
  label: string; title: string; body: string; icon?: string; accentColor?: string;
}) {
  const ac = accentColor || contract.palette.success;
  return (
    <div className={`silse-block-discussion ${className}`.trim()} style={{
      borderRadius: 13, padding: '13px 15px', display: 'flex', gap: 12, alignItems: 'flex-start',
      background: `${ac}11`, border: `1px solid ${ac}40`,
    }}>
      {icon && <div style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>{icon}</div>}
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, color: ac }}>{label}</div>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4, color: contract.palette.text }}>{title}</div>
        <div style={{ fontSize: 13, color: contract.palette.mutedText, lineHeight: 1.6 }}>{body}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 9. TimerBlock
// ---------------------------------------------------------------------------

// INTERACTION-P1: TimerBlock with start/reset
export function TimerBlock({ contract, seconds: initialSeconds, className = '' }: BlockProps & {
  seconds: number;
}) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) { setRunning(false); return; }
    const timer = setInterval(() => setRemaining(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [running, remaining]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = initialSeconds > 0 ? (remaining / initialSeconds) * 100 : 0;

  return (
    <div className={`silse-block-timer ${className}`.trim()} data-testid="silse-block-timer" style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: `${contract.palette.gold}14`, border: `1px solid ${contract.palette.gold}33`,
      borderRadius: 10, padding: '8px 14px',
    }}>
      <span style={{ fontFamily: contract.typography.heroFont, fontSize: 20, color: contract.palette.gold, minWidth: 42 }}>
        {mins}:{secs.toString().padStart(2, '0')}
      </span>
      <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: contract.palette.gold, borderRadius: 99, width: `${pct}%`, transition: 'width 1s linear' }} />
      </div>
      <button data-testid="timer-toggle" onClick={() => { if (remaining <= 0) setRemaining(initialSeconds); setRunning(!running); }} style={{
        padding: '5px 13px', borderRadius: 999, fontSize: 12, fontWeight: 800, border: 'none', cursor: 'pointer',
        background: contract.palette.gold, color: contract.palette.primary,
      }}>
        {running ? '⏸' : '▶'}
      </button>
      <button data-testid="timer-reset" onClick={() => { setRunning(false); setRemaining(initialSeconds); }} style={{
        padding: '5px 10px', borderRadius: 999, fontSize: 12, fontWeight: 800, border: 'none', cursor: 'pointer',
        background: 'rgba(255,255,255,0.08)', color: contract.palette.mutedText,
      }}>↺</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 10. ResponseInputBlock
// ---------------------------------------------------------------------------

// INTERACTION-P1: ResponseInputBlock with text input + save badge
export function ResponseInputBlock({ contract, placeholder, className = '' }: BlockProps & {
  placeholder?: string;
}) {
  const [value, setValue] = useState('');
  const [saved, setSaved] = useState(false);

  return (
    <div className={`silse-block-input ${className}`.trim()} data-testid="silse-block-input" style={{
      borderRadius: contract.card.radius, padding: contract.card.padding,
      background: contract.card.background, border: contract.card.border,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: contract.palette.mutedText }}>Jawaban Kamu</div>
        {saved && <span data-testid="saved-badge" style={{ fontSize: 11, fontWeight: 800, color: contract.palette.success, background: `${contract.palette.success}22`, padding: '2px 8px', borderRadius: 999 }}>✓ Tersimpan</span>}
      </div>
      <textarea
        data-testid="response-textarea"
        value={value}
        onChange={(e) => { setValue(e.target.value); setSaved(false); }}
        placeholder={placeholder || 'Tulis jawabanmu di sini...'}
        style={{
          width: '100%', minHeight: 60, borderRadius: 10, padding: 12,
          background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)',
          fontSize: 14, color: contract.palette.text, fontFamily: 'inherit', resize: 'vertical',
          outline: 'none',
        }}
      />
      <button data-testid="save-response" onClick={() => setSaved(true)} style={{
        marginTop: 8, padding: '6px 16px', borderRadius: 999, fontSize: 13, fontWeight: 800,
        border: 'none', cursor: 'pointer',
        background: contract.palette.success, color: contract.palette.primary,
      }}>Simpan Jawaban</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 11. RevealBlock
// ---------------------------------------------------------------------------

// INTERACTION-P1: RevealBlock with toggle state
export function RevealBlock({ contract, label, text, revealed: externalRevealed, className = '' }: BlockProps & {
  label: string; text: string; revealed?: boolean;
}) {
  const [internalRevealed, setInternalRevealed] = useState(externalRevealed ?? false);
  const revealed = externalRevealed !== undefined ? externalRevealed : internalRevealed;

  return (
    <div className={`silse-block-reveal ${revealed ? MOTION.feedbackPopClass : ''} ${className}`.trim()} data-testid="silse-block-reveal" onClick={() => { if (externalRevealed === undefined) setInternalRevealed(!internalRevealed); }} style={{
      borderRadius: contract.card.radius, padding: contract.card.padding,
      background: `${contract.palette.success}11`, border: `1px solid ${contract.palette.success}40`,
      cursor: externalRevealed === undefined ? 'pointer' : 'default',
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: contract.palette.success, marginBottom: 8 }}>💡 {label}</div>
      {revealed && <div style={{ fontSize: 14, lineHeight: 1.6, color: contract.palette.text }}>{text}</div>}
      {!revealed && <div style={{ fontSize: 14, color: contract.palette.mutedText, fontStyle: 'italic' }}>Klik untuk melihat pembahasan...</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 12. ScoreSummaryBlock
// ---------------------------------------------------------------------------

export function ScoreSummaryBlock({ contract, score, maxScore, level, className = '' }: BlockProps & {
  score: number; maxScore: number; level?: string;
}) {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  return (
    <div className={`silse-block-score-summary ${MOTION.classForPreset['reward-pop']} ${className}`.trim()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 120, height: 120, borderRadius: '50%',
        display: 'grid', placeItems: 'center',
        background: `conic-gradient(${contract.palette.gold} ${pct * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
        position: 'relative',
      }}>
        <div style={{
          width: 96, height: 96, borderRadius: '50%', display: 'grid', placeItems: 'center',
          background: contract.palette.surface,
        }}>
          <span style={{ fontFamily: contract.typography.heroFont, fontSize: 32, color: contract.palette.gold }}>{score}</span>
        </div>
      </div>
      {level && (
        <div style={{
          padding: '6px 16px', borderRadius: 999,
          background: contract.palette.gold, color: contract.palette.primary,
          fontSize: 14, fontWeight: 800,
        }}>{level}</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 13. PortfolioBlock
// ---------------------------------------------------------------------------

export function PortfolioBlock({ contract, title, items, className = '' }: BlockProps & {
  title: string; items: { label: string; value: string }[];
}) {
  return (
    <div className={`silse-block-portfolio ${className}`.trim()} style={{
      borderRadius: contract.card.radius, padding: contract.card.padding,
      background: contract.card.background, border: contract.card.border,
    }}>
      <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10, color: contract.palette.text }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: contract.palette.mutedText }}>{item.label}</span>
            <span style={{ fontWeight: 700, color: contract.palette.text }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 14. ReflectionPromptBlock
// ---------------------------------------------------------------------------

export function ReflectionPromptBlock({ contract, prompts, className = '' }: BlockProps & {
  prompts: string[];
}) {
  return (
    <div className={`silse-block-reflection ${className}`.trim()} style={{
      borderRadius: contract.card.radius, padding: contract.card.padding,
      background: `${contract.palette.gold}0A`, border: `1px solid ${contract.palette.gold}33`,
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: contract.palette.gold, marginBottom: 10 }}>📝 Refleksi Diri</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {prompts.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, fontSize: 14, lineHeight: 1.6, color: contract.palette.text }}>
            <span style={{ fontWeight: 800, color: contract.palette.gold, flexShrink: 0 }}>{i + 1}.</span>
            <span>{p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 15. ActionButtonBlock
// ---------------------------------------------------------------------------

export function ActionButtonBlock({ contract, label, onClick, variant = 'primary', className = '', customStyle }: BlockProps & {
  label: string; onClick?: () => void; variant?: 'primary' | 'secondary' | 'gold';
}) {
  const btn = contract.button[variant] || contract.button.primary;
  // CUSTOM-STYLE-01: AI can override button styles (bg, radius, shadow) — sanitized
  // DEEP-STYLE-INJECTION-01: customStyle from prop or context (prop wins)
  const ctxStyle = useCustomStyleFromContext();
  const merged = customStyle ?? ctxStyle;
  const safeStyle = sanitizeCustomStyle(merged);
  const buttonStyle = safeStyle?.button as CSSProperties | undefined;
  return (
    <button
      className={`silse-block-action ${MOTION.hoverLiftClass} ${className}`.trim()}
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: `${btn.padding.top}px ${btn.padding.right}px`,
        borderRadius: btn.radius, background: btn.background, color: btn.color,
        border: 'none', fontWeight: btn.fontWeight, fontSize: 14,
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: btn.shadow || '0 2px 6px rgba(0,0,0,0.12)',
        ...buttonStyle,
      }}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// 16. NavigationToolbarBlock — CORE-MPI-UX-FOUNDATION-01
// ---------------------------------------------------------------------------

export function NavigationToolbarBlock({ contract, currentSceneIndex, totalScenes, sceneTitle, onPrev, onNext, canPrev, canNext, className = '' }: BlockProps & {
  currentSceneIndex: number; totalScenes: number; sceneTitle: string;
  onPrev?: () => void; onNext?: () => void; canPrev: boolean; canNext: boolean;
}) {
  return (
    <div className={`silse-block-nav-toolbar ${className}`.trim()} data-testid="silse-block-nav-toolbar" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      padding: '10px 16px', borderRadius: contract.card.radius,
      background: contract.palette.surface, border: contract.card.border,
    }}>
      <button
        data-testid="nav-prev"
        onClick={onPrev}
        disabled={!canPrev}
        style={{
          padding: '8px 16px', minHeight: 44, borderRadius: contract.button.primary.radius,
          border: 'none', background: canPrev ? contract.palette.primary : 'rgba(255,255,255,0.08)',
          color: canPrev ? '#fff' : contract.palette.mutedText,
          fontWeight: 700, cursor: canPrev ? 'pointer' : 'not-allowed', fontSize: 14,
        }}
      >
        ← Sebelumnya
      </button>
      <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
        <div data-testid="nav-scene-title" style={{
          fontSize: 14, fontWeight: 800, color: contract.palette.text,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {sceneTitle}
        </div>
        <div data-testid="nav-progress-text" style={{
          fontSize: 12, color: contract.palette.mutedText, fontWeight: 600,
        }}>
          {currentSceneIndex + 1} / {totalScenes}
        </div>
      </div>
      <button
        data-testid="nav-next"
        onClick={onNext}
        disabled={!canNext}
        style={{
          padding: '8px 16px', minHeight: 44, borderRadius: contract.button.primary.radius,
          border: 'none', background: canNext ? contract.palette.primary : 'rgba(255,255,255,0.08)',
          color: canNext ? '#fff' : contract.palette.mutedText,
          fontWeight: 700, cursor: canNext ? 'pointer' : 'not-allowed', fontSize: 14,
        }}
      >
        Berikutnya →
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 17. ProgressBarBlock — CORE-MPI-UX-FOUNDATION-01
// ---------------------------------------------------------------------------

export function ProgressBarBlock({ contract, currentSceneIndex, totalScenes, className = '' }: BlockProps & {
  currentSceneIndex: number; totalScenes: number;
}) {
  const pct = totalScenes > 0 ? Math.round(((currentSceneIndex + 1) / totalScenes) * 100) : 0;
  return (
    <div className={`silse-block-progress ${className}`.trim()} data-testid="silse-block-progress" style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px',
    }}>
      <div style={{
        flex: 1, height: 6, borderRadius: 99,
        background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
      }}>
        <div data-testid="progress-fill" style={{
          height: '100%', width: `${pct}%`, borderRadius: 99,
          background: contract.palette.gold, transition: 'width 0.3s ease',
        }} />
      </div>
      <span data-testid="progress-percent" style={{
        fontSize: 12, fontWeight: 800, color: contract.palette.gold, minWidth: 36, textAlign: 'right',
      }}>
        {pct}%
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 18. MediaDisplayBlock — CORE-MPI-UX-FOUNDATION-01
// ---------------------------------------------------------------------------

export function MediaDisplayBlock({ contract, src, alt, objectFit = 'cover', className = '' }: BlockProps & {
  src: string; alt?: string; objectFit?: 'cover' | 'contain';
}) {
  if (!src) {
    return (
      <div className={`silse-block-media silse-block-media-fallback ${className}`.trim()} data-testid="silse-block-media" style={{
        width: '100%', height: '100%', minHeight: 120,
        borderRadius: contract.card.radius, background: contract.palette.surface,
        border: contract.card.border, display: 'grid', placeItems: 'center',
        color: contract.palette.mutedText, fontSize: 13, fontStyle: 'italic',
      }}>
        📷 Media tidak tersedia
      </div>
    );
  }
  return (
    <div className={`silse-block-media ${className}`.trim()} data-testid="silse-block-media" style={{
      width: '100%', height: '100%', borderRadius: contract.card.radius, overflow: 'hidden',
      border: contract.card.border, background: contract.palette.surface,
    }}>
      <img src={src} alt={alt || ''} style={{
        width: '100%', height: '100%', objectFit, display: 'block',
      }} />
    </div>
  );
}
