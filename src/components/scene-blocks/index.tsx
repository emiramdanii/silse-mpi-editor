/**
 * Reusable Scene Blocks (GOLDEN-REFERENCE-RENDER-P1).
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
 *
 *   Semua block mengambil nilai visual dari:
 *     contract.palette, contract.typography, contract.card, contract.button, dll.
 */

import type { CSSProperties, ReactNode } from 'react';
import type { MpiDesignContract } from '../../core/mpi-design-contract';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type BlockProps = {
  contract: MpiDesignContract;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

// ---------------------------------------------------------------------------
// 1. SceneShell
// ---------------------------------------------------------------------------

export function SceneShell({ contract, children, className = '', style }: BlockProps) {
  return (
    <div className={`silse-block-shell ${className}`.trim()} style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      gap: 14, padding: 22, boxSizing: 'border-box', overflow: 'auto',
      background: contract.palette.background,
      color: contract.palette.text,
      fontFamily: contract.typography.bodyFont,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. SceneHeader
// ---------------------------------------------------------------------------

export function SceneHeader({
  contract, chipIcon, chipLabel, chipColor, title, subtitle, className = '',
}: BlockProps & {
  chipIcon?: string; chipLabel?: string; chipColor?: string;
  title: string; subtitle?: string;
}) {
  return (
    <div className={`silse-block-header ${className}`.trim()}>
      {chipLabel && (
        <div className="silse-block-chip" style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 12px', borderRadius: contract.badge.radius,
          background: chipColor ? `${chipColor}22` : contract.badge.background,
          color: chipColor || contract.badge.color,
          fontSize: 12, fontWeight: 800, marginBottom: 10,
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
      }}>{title}</div>
      {subtitle && (
        <div style={{ fontSize: 14, color: contract.palette.mutedText, lineHeight: 1.6, marginTop: 4 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. SceneChip
// ---------------------------------------------------------------------------

export function SceneChip({ contract, label, icon, color, className = '' }: BlockProps & {
  label: string; icon?: string; color?: string;
}) {
  return (
    <span className={`silse-block-chip ${className}`.trim()} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 12px', borderRadius: contract.badge.radius,
      background: color ? `${color}22` : contract.badge.background,
      color: color || contract.badge.color,
      fontSize: 12, fontWeight: 800,
    }}>
      {icon && <span>{icon}</span>}
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// 4. ScenePanel
// ---------------------------------------------------------------------------

export function ScenePanel({ contract, children, className = '', style, title }: BlockProps & { title?: string }) {
  return (
    <div className={`silse-block-panel ${className}`.trim()} style={{
      background: contract.card.background,
      border: contract.card.border,
      borderRadius: contract.card.radius,
      padding: contract.card.padding,
      ...style,
    }}>
      {title && <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8, color: contract.palette.text }}>{title}</div>}
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. SceneGrid
// ---------------------------------------------------------------------------

export function SceneGrid({ children, className = '', columns, gap = 10 }: BlockProps & {
  columns?: string; gap?: number;
}) {
  return (
    <div className={`silse-block-card ${className}`.trim()} style={{
      display: 'grid',
      gridTemplateColumns: columns || 'repeat(auto-fill, minmax(240px, 1fr))',
      gap,
    }}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6. SceneTabs
// ---------------------------------------------------------------------------

export function SceneTabs({ contract, tabs, activeTab, onTabClick, className = '' }: BlockProps & {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onTabClick?: (id: string) => void;
}) {
  return (
    <div className={`silse-block-tabs ${className}`.trim()} style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button key={tab.id} onClick={() => onTabClick?.(tab.id)} style={{
            padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 800,
            cursor: onTabClick ? 'pointer' : 'default', border: 'none', transition: 'all 0.2s',
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
// 7. SceneAccordion
// ---------------------------------------------------------------------------

export function SceneAccordion({ contract, items, openIndex, onToggle, className = '' }: BlockProps & {
  items: { title: string; body: string }[];
  openIndex: number | null;
  onToggle?: (idx: number) => void;
}) {
  return (
    <div className={`silse-block-accordion ${className}`.trim()} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((item, idx) => {
        const isOpen = idx === openIndex;
        return (
          <div key={idx} style={{
            borderRadius: contract.card.radius, overflow: 'hidden',
            border: isOpen ? `1px solid ${contract.palette.gold}` : contract.card.border,
            background: contract.card.background,
          }}>
            <div onClick={() => onToggle?.(idx)} style={{
              padding: '12px 16px', cursor: onToggle ? 'pointer' : 'default',
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

export function TimerBlock({ contract, seconds, className = '' }: BlockProps & {
  seconds: number;
}) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return (
    <div className={`silse-block-timer ${className}`.trim()} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: `${contract.palette.gold}14`, border: `1px solid ${contract.palette.gold}33`,
      borderRadius: 10, padding: '8px 14px',
    }}>
      <span style={{ fontFamily: contract.typography.heroFont, fontSize: 20, color: contract.palette.gold, minWidth: 42 }}>
        {mins}:{secs.toString().padStart(2, '0')}
      </span>
      <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: contract.palette.gold, borderRadius: 99, width: '50%' }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 10. ResponseInputBlock
// ---------------------------------------------------------------------------

export function ResponseInputBlock({ contract, placeholder, className = '' }: BlockProps & {
  placeholder?: string;
}) {
  return (
    <div className={`silse-block-input ${className}`.trim()} style={{
      borderRadius: contract.card.radius, padding: contract.card.padding,
      background: contract.card.background, border: contract.card.border,
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: contract.palette.mutedText, marginBottom: 8 }}>Jawaban Kamu</div>
      <div style={{
        minHeight: 60, borderRadius: 10, padding: 12,
        background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)',
        fontSize: 14, color: contract.palette.mutedText, fontStyle: 'italic',
      }}>
        {placeholder || 'Tulis jawabanmu di sini...'}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 11. RevealBlock
// ---------------------------------------------------------------------------

export function RevealBlock({ contract, label, text, revealed = true, className = '' }: BlockProps & {
  label: string; text: string; revealed?: boolean;
}) {
  return (
    <div className={`silse-block-reveal ${className}`.trim()} style={{
      borderRadius: contract.card.radius, padding: contract.card.padding,
      background: `${contract.palette.success}11`, border: `1px solid ${contract.palette.success}40`,
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
    <div className={`silse-block-score-summary ${className}`.trim()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
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

export function ActionButtonBlock({ contract, label, onClick, variant = 'primary', className = '' }: BlockProps & {
  label: string; onClick?: () => void; variant?: 'primary' | 'secondary' | 'gold';
}) {
  const btn = contract.button[variant] || contract.button.primary;
  return (
    <button className={`silse-block-action ${className}`.trim()} onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: `${btn.padding.top}px ${btn.padding.right}px`,
      borderRadius: btn.radius, background: btn.background, color: btn.color,
      border: 'none', fontWeight: btn.fontWeight, fontSize: 14,
      cursor: onClick ? 'pointer' : 'default', transition: 'all 0.18s',
    }}>
      {label}
    </button>
  );
}
