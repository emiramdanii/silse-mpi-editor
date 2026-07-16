/**
 * Style Pack types for silse-mpi-editor.
 *
 * Layer: core
 * Allowed imports: none (only TypeScript built-ins)
 *
 * Kontrak (Batch 2S — Style Pack Foundation):
 *   StylePack = reusable collection of design tokens + recipe placeholders.
 *   ProjectStyle = StylePack instance attached to a project.
 *
 * StylePack BUKAN style engine besar. StylePack adalah data serializable
 * yang bisa disimpan, dipakai ulang, dan dibawa ke export HTML.
 *
 * Recipe placeholders (componentRecipes, interactionRecipes, scoringRecipes)
 * saat ini hanya stub — diisi konkret di M6 (component), M5 (interaction),
 * M10 (scoring). Untuk Batch 2S cukup schema-nya ada.
 *
 * Aturan:
 *   - Semua token harus serializable (string/number, no function, no class).
 *   - Tidak boleh menyimpan CSS framework object besar.
 *   - Tidak boleh menyimpan className bebas (style via tokens, bukan class).
 *   - Boleh diubah nanti lewat migration resmi.
 */

// ---------------------------------------------------------------------------
// Color tokens
// ---------------------------------------------------------------------------

export type StyleColors = {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  text: string;
  mutedText: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  /** ENGINE-GAP-FILL: optional accent + gold color tokens. */
  accent?: string;
  gold?: string;
};

// ---------------------------------------------------------------------------
// Typography tokens
// ---------------------------------------------------------------------------

export type StyleTypography = {
  fontFamily: string;
  titleSize: number;
  subtitleSize: number;
  bodySize: number;
  smallSize: number;
  lineHeight: number;
  /** ENGINE-GAP-FILL: optional typography tokens untuk match DesignTypography. */
  titleWeight?: number;
  bodyWeight?: number;
  letterSpacing?: number;
  uppercase?: boolean;
  heroFont?: string;
  bodyFont?: string;
};

// ---------------------------------------------------------------------------
// Spacing tokens
// ---------------------------------------------------------------------------

export type StyleSpacing = {
  pagePadding: number;
  componentGap: number;
  cardPadding: number;
};

// ---------------------------------------------------------------------------
// Radius tokens
// ---------------------------------------------------------------------------

export type StyleRadius = {
  small: number;
  medium: number;
  large: number;
};

// ---------------------------------------------------------------------------
// Shadow tokens
// ---------------------------------------------------------------------------

export type StyleShadow = {
  none: string;
  soft: string;
  medium: string;
};

// ---------------------------------------------------------------------------
// Recipe placeholders (Batch 2S stub → M5 konkret untuk interactionRecipes)
//
// Recipe = mapping dari semantic concept (variant/interaction/scoring)
// ke concrete render style. Konkretnya diisi di milestone masing-masing:
//   - componentRecipes: M6 (Export HTML + Style Resolver Solid)
//   - interactionRecipes: M5 (Navigation + Preview + Interaction Style Dasar) — NOW KONKRET
//   - scoringRecipes: M10 (Question + Scoring Style)
// ---------------------------------------------------------------------------

/**
 * Recipe untuk render komponen berdasarkan variant.
 * Key = `${componentType}:${variant}`, value = style token reference.
 * Contoh konkrit (M6): { 'text:title': { fontSize: '$typography.titleSize', ... } }
 *
 * Untuk M5: objek kosong, placeholder only. M6 akan mengisi.
 */
export type ComponentRecipe = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Interaction Recipe (M5 — konkret)
// ---------------------------------------------------------------------------

/**
 * Satu entry interaction recipe (e.g. buttonHoverGrow, buttonPress, focusRing).
 *
 * Kontrak Batch 5 Scope D:
 *   - Semua field serializable (number/string, no function).
 *   - Bounds aman:
 *     - scale: 0.8–1.08 (maksimal 1.08, jangan berlebihan)
 *     - durationMs: 80–500 (cepat tapi tidak instant, tidak terlalu lambat)
 *   - shadowRole/backgroundRole refer ke token names di StylePack (bukan nilai CSS langsung).
 */
export type InteractionRecipeEntry = {
  /** Scale factor untuk transform. Range aman: 0.8–1.08. */
  scale?: number;
  /** Durasi transisi dalam milidetik. Range aman: 80–500. */
  durationMs?: number;
  /** CSS easing function string. Contoh: 'ease-out', 'cubic-bezier(0.4,0,0.2,1)'. */
  easing?: string;
  /** Reference ke shadow token: 'none' | 'soft' | 'medium'. */
  shadowRole?: 'none' | 'soft' | 'medium';
  /** Reference ke color token role: 'primary' | 'secondary' | 'surface' | 'success' | 'warning' | 'danger'. */
  backgroundRole?: 'primary' | 'secondary' | 'surface' | 'success' | 'warning' | 'danger';
};

/**
 * Interaction recipe collection untuk StylePack.
 *
 * M5 konkret: buttonHoverGrow, buttonPress, focusRing.
 * M11+ boleh tambah entry lain (e.g. tabSwitch, accordionExpand).
 *
 * Serializable: semua field number/string. Tidak ada function/class.
 */
export type InteractionRecipe = {
  /** Hover state untuk button/navigation — scale up sedikit. */
  buttonHoverGrow?: InteractionRecipeEntry;
  /** Press/click state — scale down sedikit + shadow change. */
  buttonPress?: InteractionRecipeEntry;
  /** Focus ring untuk accessibility — shadow/border highlight. */
  focusRing?: InteractionRecipeEntry;
  /** Allow future extensions (M11+). */
  [key: string]: InteractionRecipeEntry | undefined;
};

/**
 * Recipe untuk scoring style (feedback benar/salah, animasi skor).
 * Key = scoring state.
 * Contoh konkrit (M10): { 'correct': { color: '$colors.success' } }
 *
 * Untuk M5: objek kosong, placeholder only. M10 akan mengisi.
 */
export type ScoringRecipe = Record<string, unknown>;

// ---------------------------------------------------------------------------
// StylePack — reusable collection
// ---------------------------------------------------------------------------

export type StylePack = {
  /** ID unik style pack. Contoh: 'cleanClassroom', 'civicWarm'. */
  id: string;
  /** Nama display untuk UI. */
  name: string;
  /** Deskripsi singkat untuk UI. */
  description: string;
  /** Design tokens. */
  colors: StyleColors;
  typography: StyleTypography;
  spacing: StyleSpacing;
  radius: StyleRadius;
  shadow: StyleShadow;
  /**
   * Recipe placeholders. Untuk Batch 2S objek kosong.
   * Diisi konkret di M5 (interaction), M6 (component), M10 (scoring).
   */
  componentRecipes: ComponentRecipe;
  interactionRecipes: InteractionRecipe;
  scoringRecipes: ScoringRecipe;
};

// ---------------------------------------------------------------------------
// ProjectStyle — instance attached to a project
// ---------------------------------------------------------------------------

/**
 * ProjectStyle = reference ke StylePack + optional override tokens.
 *
 * Sebuah project punya satu ProjectStyle. StylePack bisa shared antar
 * project (reuse). Override token bersifat optional — kalau kosong,
 * pakai semua token dari StylePack referent.
 *
 * Untuk Batch 2S, ProjectStyle minimal: hanya stylePackId + tokens inline
 * (copy dari StylePack referent). M7 akan memperkenalkan override terpisah
 * dan save StylePack sebagai reusable asset.
 */
export type ProjectStyle = {
  /** ID StylePack yang jadi referent. Bisa null kalau project belum set style. */
  stylePackId: string;
  /**
   * Inline token copy. Untuk Batch 2S, ini berisi semua token dari StylePack
   * referent (snapshot). M7 akan memperkenalkan mekanisme override terpisah.
   */
  tokens: StyleTokens;
  /**
   * AI-PANEL-OVERRIDE: panel-level token overrides dari AI designSystem.overrides
   * yang tidak muat di StyleTokens (karena StyleTokens hanya punya colors/
   * typography/spacing/radius/shadow). Field ini dibaca oleh
   * getDesignContractWithProjectStyle() untuk di-merge ke contract.learning.*
   * dan contract.game.*.
   *
   * Shape: { [category]: { [panelName]: { [cssProp]: value } } }
   * Contoh: { learning: { keyPointPanel: { background: '#1e293b', accentColor: '#fbbf24' } } }
   */
  panelOverrides?: Record<string, Record<string, Record<string, unknown>>>;
};

/**
 * Subset of StylePack tokens yang disimpan di ProjectStyle.
 * Saat ini = semua token (snapshot). Bisa di-override per-project.
 */
export type StyleTokens = {
  colors: StyleColors;
  typography: StyleTypography;
  spacing: StyleSpacing;
  radius: StyleRadius;
  shadow: StyleShadow;
};

// ---------------------------------------------------------------------------
// Visual Preset IDs
// ---------------------------------------------------------------------------

export const VISUAL_PRESET_IDS = [
  'cleanClassroom',
  'civicWarm',
  'brightKids',
  'projectorHighContrast',
  'minimalWorksheet',
] as const;

export type VisualPresetId = (typeof VISUAL_PRESET_IDS)[number];
