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
// Recipe placeholders (stub untuk Batch 2S)
//
// Recipe = mapping dari semantic concept (variant/interaction/scoring)
// ke concrete render style. Konkretnya diisi di milestone masing-masing:
//   - componentRecipes: M6 (Export HTML + Style Resolver Solid)
//   - interactionRecipes: M5 (Navigation + Preview + Interaction Style Dasar)
//   - scoringRecipes: M10 (Question + Scoring Style)
//
// Untuk Batch 2S, recipe adalah objek kosong (Record<string, never>).
// Type-nya sudah dipersiapkan agar M5/M6/M10 tinggal mengisi tanpa
// mengubah schema ProjectStyle.
// ---------------------------------------------------------------------------

/**
 * Recipe untuk render komponen berdasarkan variant.
 * Key = `${componentType}:${variant}`, value = style token reference.
 * Contoh konkrit (M6): { 'text:title': { fontSize: '$typography.titleSize', ... } }
 *
 * Untuk Batch 2S: objek kosong, placeholder only.
 */
export type ComponentRecipe = Record<string, unknown>;

/**
 * Recipe untuk interaction style (hover, active, focus state).
 * Key = interaction pattern name.
 * Contoh konkrit (M5): { 'navigation:hover': { ... } }
 *
 * Untuk Batch 2S: objek kosong, placeholder only.
 */
export type InteractionRecipe = Record<string, unknown>;

/**
 * Recipe untuk scoring style (feedback benar/salah, animasi skor).
 * Key = scoring state.
 * Contoh konkrit (M10): { 'correct': { color: '$colors.success' } }
 *
 * Untuk Batch 2S: objek kosong, placeholder only.
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
