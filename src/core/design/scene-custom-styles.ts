/**
 * @module SceneCustomStyles
 *
 * SceneCustomStyles — interface kontrak untuk custom styling yang berasal
 * dari AI (customStyle field di AiBlueprintSlot) DAN dari design tokens
 * (Fase 1 Color System Foundation).
 *
 * Tujuan (SSOT — Single Source of Truth):
 *   Sebelum Fase 1, styling scene berasal dari 7 sumber berbeda:
 *     1. project.style.tokens (dari style pack)
 *     2. MpiDesignContract (getDesignContractWithProjectStyle)
 *     3. SlotResolvedStyle (renderScenePlan.ts)
 *     4. ResolvedComponentStyle (resolveComponentStyle.ts)
 *     5. customStyle (per-scene, dari AI)
 *     6. CSS variables --silse-color-*
 *     7. Hardcoded hex literals (480 instances)
 *
 *   Fase 1 goal: konsolidasi 7 sumber menjadi 2 sumber kanonik:
 *     A. DesignTokens (warna, typography, spacing, shadow) — defined once
 *        in :root, digunakan oleh semua renderer
 *     B. SceneCustomStyles (per-scene override dari AI) — structured object,
 *        sanitized, merged via mergeStyles()
 *
 *   Renderer (React + export HTML) baca dari SceneCustomStyles yang sudah
 *   di-merge, BUKAN dari contract.palette.* atau hardcoded hex langsung.
 *
 * Layer: core/design (pure types, no React/DOM)
 * Allowed imports: none (only TypeScript built-ins)
 *
 * Status: DRAFT — interface ini akan di-iterate saat Fase 1 eksekusi.
 *         Token groups akan diisi berdasarkan audit SILSE_FASE1_COLOR_AUDIT.md.
 */

// ---------------------------------------------------------------------------
// Color tokens (Fase 1 — target utama)
// ---------------------------------------------------------------------------

/**
 * Semantic color tokens — dipakai oleh semua renderer (editor, preview, export).
 *
 * Konvensi naming (lihat SILSE_REVIEW_QUICK_WINS.md):
 *   - Semantic over numeric: --color-success-strong, NOT --color-success-600
 *   - Hierarchy via suffix: -soft, -strong, -deep
 *   - Context via prefix: --color-overlay-*, --color-marker-*
 *
 * Token ini di-define di src/styles.css :root dan di-inject ke export HTML
 * :root block. Renderer baca via var(--color-*).
 */
export interface ColorTokens {
  // Surface
  bg: string;
  panel: string;
  panelSoft: string;
  border: string;
  borderStrong: string;

  // Text
  text: string;
  textSoft: string;
  muted: string;
  textOnDark: string; // text pada bg gelap (cover, closing, dark theme)
  textOnAccent: string; // text pada accent bg (button primary)

  // Brand
  accent: string;
  accentHover: string;
  accentSoft: string;

  // States
  success: string;
  successSoft: string;
  successStrong: string; // NEW (Fase 1) — Tailwind green-600
  successDeep: string; // NEW — Tailwind green-800
  warning: string;
  warningSoft: string;
  warningStrong: string; // NEW — Tailwind amber-500
  warningDeep: string; // NEW — Tailwind amber-800
  danger: string;
  dangerSoft: string;
  dangerStrong: string; // NEW — Tailwind red-600
  dangerDeep: string; // NEW — Tailwind red-800

  // Phase accents
  phasePembukaan: string;
  phasePembukaanSoft: string;
  phaseInti: string;
  phaseIntiSoft: string;
  phasePenutup: string;
  phasePenutupSoft: string;

  // Overlay scrims (NEW — Fase 1)
  overlayScrim: string; // rgba(0,0,0,0.5) — modal scrim
  overlayScrimStrong: string; // rgba(0,0,0,0.85)
  overlayScrimNavy: string; // rgba(15,23,42,0.6) — premium dialog

  // AI-style badge (NEW — Fase 1)
  aiStyle: string; // #7c3aed violet-600
  aiStyleStrong: string; // #6b21a8 violet-700
  aiStyleBgGradient: string;
  aiStyleBorder: string;

  // Component markers (NEW — Fase 1, PageThumbnail)
  markerText: string;
  markerImage: string;
  markerCard: string;
  markerNavigation: string;
  markerQuestion: string;
  markerGame: string;
  markerLayeredInfo: string;
  markerLearningBridge: string;
}

// ---------------------------------------------------------------------------
// Style-pack tokens (namespace --silse-*)
// ---------------------------------------------------------------------------

/**
 * Style-pack-specific tokens — di-override per style pack (modern-clean,
 * soft-classroom, mission-dark, golden-reference).
 *
 * Token ini di-define di :root oleh style pack active, FALLBACK ke editor
 * theme tokens (ColorTokens) jika style pack tidak set nilai.
 */
export interface StylePackTokens {
  gold: string;
  goldDeep: string;
  navy: string;
  blue: string;
  red: string;
  paper: string;

  // Hero (cover scene)
  heroColor: string;
  heroAccent: string;
  heroFont: string;
  heroWeight: string | number;
  heroLetterSpacing: string;

  // Body
  bodyFont: string;
  mutedPremium: string;

  // Card
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  cardRadius: number;
  buttonRadius: number;

  // Stage
  stageOuter: string;
  stageText: string;
}

// ---------------------------------------------------------------------------
// Shadow tokens (NEW — Fase 1)
// ---------------------------------------------------------------------------

export interface ShadowTokens {
  sm: string;
  md: string;
  lg: string;

  // Premium (NEW)
  cardPremiumLight: string; // 0 2px 8px rgba(0,0,0,0.08)
  cardPremiumDark: string; // 0 2px 8px rgba(0,0,0,0.3)
  cardSubtle: string; // 0 1px 3px rgba(0,0,0,0.06)
  stagePremium: string;
  dialogPremium: string;
  dialogStrong: string;
  floatingSoft: string;
  buttonPremium: string;
  buttonNavy: string;
  kicker: string;
  kickerStrong: string;
  ctaPremium: string;
  awardMedal: string;
  heroCard: string;
}

// ---------------------------------------------------------------------------
// SceneCustomStyles — per-scene override dari AI
// ---------------------------------------------------------------------------

/**
 * Per-scene custom styles dari AI (customStyle field di AiBlueprintSlot).
 *
 * Structure: { elementKey: { cssProperty: value } }
 *
 * Contoh:
 *   {
 *     shell: { background: 'linear-gradient(...)', padding: '24px' },
 *     header: { color: 'blue', fontSize: '24px' },
 *     panel: { borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
 *   }
 *
 * AI emit customStyle via blueprint. Normalizer (normalizeAiMpiJson) preserve
 * customStyle (AUDIT 1.2 fix). Sanitizer (src/core/style/sanitize.ts) strip
 * dangerous values (expression(), javascript: URLs, dll) sebelum apply.
 *
 * Renderer merge customStyle dengan DesignTokens via mergeStyles() —
 * customStyle WIN (highest priority).
 */
export type SceneCustomStyleMap = Record<string, Record<string, string>>;

// ---------------------------------------------------------------------------
// DesignTokens — gabungan semua token groups
// ---------------------------------------------------------------------------

/**
 * DesignTokens — single source of truth untuk semua design tokens.
 *
 * Di-generate dari style pack + editor theme, di-inject ke :root sebagai
 * CSS variables. Renderer baca via var(--color-*), var(--silse-*), var(--shadow-*).
 *
 * SceneCustomStyles (dari AI) override token ini per-element via mergeStyles().
 */
export interface DesignTokens {
  color: ColorTokens;
  stylePack: StylePackTokens;
  shadow: ShadowTokens;
}

// ---------------------------------------------------------------------------
// mergeStyles — utility untuk merge DesignTokens + SceneCustomStyles
// ---------------------------------------------------------------------------

/**
 * Merge DesignTokens (base) dengan SceneCustomStyles (AI override).
 *
 * Priority (highest to lowest):
 *   1. SceneCustomStyles (AI customStyle) — if present for element + property
 *   2. DesignTokens (from style pack + editor theme)
 *   3. Fallback (hardcoded minimal, only for structural defaults)
 *
 * Hasil: inline style object siap apply ke React element atau export HTML.
 *
 * TODO (Fase 2): implement mergeStyles() function.
 *   - Pure function, no React/DOM dependency
 *   - Dipakai oleh React renderer DAN export HTML (parity 100%)
 *   - Sanitize customStyle values sebelum merge (defense-in-depth)
 */
export interface MergeStylesResult {
  [elementKey: string]: {
    [cssProperty: string]: string;
  };
}

// ---------------------------------------------------------------------------
// Fase 1 TODO
// ---------------------------------------------------------------------------

/**
 * Fase 1 execution order (based on SILSE_FASE1_COLOR_AUDIT.md):
 *
 * 1. Define DesignTokens in src/styles.css :root (~30 new tokens)
 * 2. P0: Fix wrong var names (--color-primary → --color-accent) — 15 instances
 * 3. P0: Add AI-style tokens (--color-ai-style-*) — 4 new
 * 4. P1: Drop #2563eb fallback from 4 component views
 * 5. P2: Add status tokens (--color-success-strong, dll) — 10 new
 * 6. P2: Migrate TemplatePickerDialog + AiImportDialog — ~65 hex literals
 * 7. P3: Add marker tokens (--color-marker-*) — 8 new
 * 8. P4: Add premium tokens (--silse-*) — 15 new, drop fallbacks
 * 9. P4: Extract shared token module (src/core/design/tokens.ts)
 * 10. P5: Animation/celebration tokens (defer to Fase 2)
 *
 * Milestone: "Hapus fallback warna" (review recommendation #5)
 *   - Setelah P4 selesai, semua var(--token, #hex) fallback dihapus
 *   - Hanya var(--token) tanpa fallback, karena :root sudah define semua
 *   - Verifikasi dengan grep: rg "var\(--[a-z-]+,\s*#" harus return 0
 */

// ---------------------------------------------------------------------------
// DEFAULT THEME — concrete values for the default (modern-clean) style pack
// ---------------------------------------------------------------------------

/**
 * Default theme values — concrete hex/rgba for each token.
 *
 * Tujuan: Memberikan nilai konkret yang langsung bisa dipakai tim untuk
 * mengisi `:root` di styles.css dan export-html.ts. Nilai diambil dari:
 *   - Existing :root tokens (styles.css:7-50) untuk token yang sudah ada
 *   - DEFAULT_DESIGN_CONTRACT (defaultDesignContract.ts) untuk palette
 *   - Audit SILSE_FASE1_COLOR_AUDIT.md untuk token baru (P0-P3)
 *
 * Saat Fase 1 dieksekusi, nilai ini di-copy ke styles.css :root block.
 * Style pack lain (soft-classroom, mission-dark) override subset yang relevan.
 */
export const DEFAULT_THEME_COLOR: ColorTokens = {
  // Surface (existing)
  bg: '#f8f6f1',
  panel: '#ffffff',
  panelSoft: '#fbfaf7',
  border: '#e3ddcd',
  borderStrong: '#c8be9f',

  // Text (existing)
  text: '#1f2533',
  textSoft: '#4a5160',
  muted: '#8a8775',
  textOnDark: '#ffffff',          // NEW — text pada bg gelap (cover, closing, dark dialog)
  textOnAccent: '#ffffff',        // NEW — text pada accent bg (button primary)

  // Brand (existing)
  accent: '#1e5b8f',
  accentHover: '#184b76',
  accentSoft: '#e8f0f8',

  // States (existing + NEW strong/deep variants)
  success: '#2f7d4f',
  successSoft: '#e1f3e8',
  successStrong: '#16a34a',       // NEW — Tailwind green-600 (feedback correct)
  successDeep: '#166534',         // NEW — Tailwind green-800 (feedback correct text)
  warning: '#b9740e',
  warningSoft: '#fdf3e1',
  warningStrong: '#f59e0b',       // NEW — Tailwind amber-500 (status chip)
  warningDeep: '#92400e',         // NEW — Tailwind amber-800 (warning text)
  danger: '#c0392b',
  dangerSoft: '#fbe6e3',
  dangerStrong: '#dc2626',        // NEW — Tailwind red-600 (feedback wrong)
  dangerDeep: '#991b1b',          // NEW — Tailwind red-800 (feedback wrong text)

  // Phase accents (existing)
  phasePembukaan: '#1e5b8f',
  phasePembukaanSoft: '#e8f0f8',
  phaseInti: '#2f7d4f',
  phaseIntiSoft: '#e1f3e8',
  phasePenutup: '#8b5a8c',
  phasePenutupSoft: '#f1e9f2',

  // Overlay scrims (NEW)
  overlayScrim: 'rgba(0, 0, 0, 0.5)',          // modal scrim
  overlayScrimStrong: 'rgba(0, 0, 0, 0.85)',   // strong scrim
  overlayScrimNavy: 'rgba(15, 23, 42, 0.6)',   // premium dialog scrim

  // AI-style badge (NEW — Tailwind violet family)
  aiStyle: '#7c3aed',             // violet-600
  aiStyleStrong: '#6b21a8',       // violet-700
  aiStyleBgGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(236, 72, 153, 0.08) 100%)',
  aiStyleBorder: 'rgba(139, 92, 246, 0.2)',

  // Component markers (NEW — PageThumbnail)
  markerText: '#3b82f6',          // blue-500
  markerImage: '#10b981',         // emerald-500
  markerCard: '#f59e0b',          // amber-500
  markerNavigation: '#8b5cf6',    // violet-500
  markerQuestion: '#ec4899',      // pink-500
  markerGame: '#ef4444',          // red-500
  markerLayeredInfo: '#06b6d4',   // cyan-500
  markerLearningBridge: '#6366f1', // indigo-500
};

export const DEFAULT_THEME_SHADOW: ShadowTokens = {
  // Existing
  sm: '0 1px 2px rgba(31, 37, 51, 0.04)',
  md: '0 4px 16px rgba(31, 37, 51, 0.08)',
  lg: '0 8px 32px rgba(31, 37, 51, 0.12)',

  // Premium (NEW)
  cardPremiumLight: '0 2px 8px rgba(0, 0, 0, 0.08)',
  cardPremiumDark: '0 2px 8px rgba(0, 0, 0, 0.3)',
  cardSubtle: '0 1px 3px rgba(0, 0, 0, 0.06)',
  stagePremium: '0 26px 70px rgba(0, 0, 0, 0.42), 0 8px 22px rgba(0, 0, 0, 0.22)',
  dialogPremium: '0 8px 32px rgba(0, 0, 0, 0.24)',
  dialogStrong: '0 8px 32px rgba(0, 0, 0, 0.4)',
  floatingSoft: '0 1px 3px rgba(0, 0, 0, 0.1)',
  buttonPremium: '0 14px 28px rgba(0, 0, 0, 0.28)',
  buttonNavy: '0 4px 12px rgba(29, 53, 87, 0.3)',
  kicker: '0 2px 6px rgba(0, 0, 0, 0.16)',
  kickerStrong: '0 4px 12px rgba(0, 0, 0, 0.2)',
  ctaPremium: '0 14px 28px rgba(0, 0, 0, 0.28)',
  awardMedal: '0 8px 24px rgba(255, 183, 3, 0.35)',
  heroCard: '0 22px 54px rgba(29, 53, 87, 0.18), 0 4px 12px rgba(29, 53, 87, 0.06)',
};

// ---------------------------------------------------------------------------
// mergeStyles — pseudocode (Fase 2 implementation)
// ---------------------------------------------------------------------------

/**
 * mergeStyles pseudocode — cara kerja function yang akan diimplement di Fase 2.
 *
 * ```typescript
 * function mergeStyles(
 *   tokens: DesignTokens,
 *   customStyle: SceneCustomStyleMap | undefined,
 *   elementKey: string,
 * ): Record<string, string> {
 *   // 1. Mulai dengan empty result
 *   const result: Record<string, string> = {};
 *   //
 *   // 2. Apply DesignTokens untuk elementKey (jika ada mapping)
 *   //    Misal: elementKey 'shell' → { background: tokens.color.bg, ... }
 *   //    Mapping elementKey → token properties didefinisikan di registry.
 *   //
 *   // 3. Apply SceneCustomStyles (AI override) — HIGHEST PRIORITY
 *   if (customStyle && customStyle[elementKey]) {
 *     const aiOverride = sanitizeElementStyle(customStyle[elementKey]);
 *     Object.assign(result, aiOverride);  // override menang
 *   }
 *   //
 *   // 4. Return merged result
 *   return result;
 * }
 * ```
 *
 * Contoh pemakaian di renderer:
 * ```tsx
 * const shellStyle = mergeStyles(designTokens, page.sceneCustomStyle, 'shell');
 * <div style={shellStyle}>...</div>
 * ```
 *
 * Contoh pemakaian di export HTML:
 * ```typescript
 * const shellCss = styleMapToCssString(mergeStyles(designTokens, page.sceneCustomStyle, 'shell'));
 * el.style.cssText = shellCss;
 * ```
 *
 * Karena mergeStyles adalah pure function dengan input yang sama,
 * React dan export HTML menghasilkan output yang identik → parity 100%.
 */
