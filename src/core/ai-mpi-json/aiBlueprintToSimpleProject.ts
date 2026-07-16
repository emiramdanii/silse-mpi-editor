/**
 * AiMpiBlueprint → SimpleProject Bridge (BASELINE-SYNC).
 *
 * Layer: core/ai-mpi-json (pure function, no React/DOM)
 * Allowed imports: ./schema, ../types, ../ids, ../style-presets, ../style-packs/style-pack-registry
 *
 * Kontrak:
 *   Pure function yang mengkonversi AiMpiBlueprint (12 scene) menjadi SimpleProject
 *   (12 page) dengan sceneType + sceneContent override per page.
 *
 *   Pipeline: AI JSON → AiMpiBlueprint → SimpleProject → CanvasStage / PreviewApp / export-html
 */

import type {
  SimpleProject,
  SimplePage,
  PageRole,
  LayoutId,
  PageBackground,
  Curriculum,
  CurriculumObjective,
} from '../types';
import { PROJECT_VERSION } from '../types';
import type { ProjectStyle, StyleTokens } from '../style-types';
import { createProjectId } from '../ids';
import { resolveStylePackV1 } from '../style-packs/style-pack-registry';
import { stylePackToProjectStyle } from '../style-presets';
import type { AiMpiBlueprint, AiBlueprintScene } from './schema';
import {
  verifyAndFixTextContrast,
  isDarkColor,
  darkenLightColor,
  getLuminance,
} from '../style/contrast-guard';

function mapBlueprintRoleToPageRole(role: string): PageRole {
  const mapping: Record<string, PageRole> = {
    cover: 'cover',
    guide: 'guide',
    objectives: 'learningObjectives',
    starter: 'starter',
    material: 'material',
    'mission-map': 'activity',
    game: 'activity',
    quiz: 'quiz',
    reflection: 'reflection',
    closing: 'closing',
  };
  return mapping[role] ?? 'material';
}

function getDefaultLayoutForRole(role: PageRole): LayoutId {
  switch (role) {
    case 'cover': return 'coverCentered';
    case 'material': return 'singleColumn';
    default: return 'blank';
  }
}

function getDefaultBackgroundForRole(
  role: PageRole,
  palette?: { background?: string; surface?: string; primary?: string },
): PageBackground {
  const bg = palette?.background;
  const surface = palette?.surface;
  const primary = palette?.primary;

  // PALETTE-AWARE-BG: jika palette tersedia, gunakan untuk konsistensi tema.
  // Dark theme → semua role pakai palette.background (dark).
  // Light theme → cover/closing pakai primary, lainnya pakai surface.
  if (bg && surface && primary) {
    if (isDarkColor(bg)) {
      return { type: 'color', color: bg };
    }
    if (role === 'cover' || role === 'closing') {
      return { type: 'color', color: primary };
    }
    return { type: 'color', color: surface };
  }

  // Fallback: hardcoded defaults (untuk projects tanpa palette info)
  switch (role) {
    case 'cover': return { type: 'color', color: '#1e3a5f' };
    case 'closing': return { type: 'color', color: '#1e3a5f' };
    case 'material': return { type: 'color', color: '#ffffff' };
    case 'quiz': return { type: 'color', color: '#f0f9ff' };
    case 'activity': return { type: 'color', color: '#f0fdf4' };
    default: return { type: 'color', color: '#ffffff' };
  }
}

function mapSceneToPage(
  scene: AiBlueprintScene,
  palette?: { background?: string; surface?: string; primary?: string },
): SimplePage {
  const role = mapBlueprintRoleToPageRole(scene.role);
  const primarySlot = scene.slots[0];
  return {
    id: scene.id,
    title: scene.title,
    role,
    layoutId: getDefaultLayoutForRole(role),
    background: getDefaultBackgroundForRole(role, palette),
    components: [],
    sceneType: scene.sceneType,
    sceneContent: primarySlot?.content,
    scenePlacement: primarySlot?.placement
      ? {
          x: primarySlot.placement.x,
          y: primarySlot.placement.y,
          width: primarySlot.placement.width,
          height: primarySlot.placement.height,
          zIndex: primarySlot.placement.zIndex,
        }
      : undefined,
    sceneSlotRole: primarySlot?.role,
    // CUSTOM-STYLE-01: pass customStyle from AI to page
    sceneCustomStyle: primarySlot?.customStyle,
  };
}

/**
 * Apply designSystem.overrides to ProjectStyle.
 *
 * Supports TWO override formats (backward compatible):
 *
 * 1. Flat key string (original): { "colors.primary": "#hex", "typography.fontFamily": "..." }
 * 2. Structured object (from Qwen PR): { typography: { fontFamily: "..." }, colors: { primary: "#hex" } }
 *
 * Field mapping (from Qwen PR — AI field names → SILSE field names):
 *   typography.fontSizeBase → scale all font sizes proportionally
 *   typography.lineHeightBase → lineHeight
 *   typography.headingFontFamily → (ignored — would override fontFamily, bug fix from Qwen PR)
 *   colors.accent → secondary
 *   colors.error → danger
 *   spacing.unit → scale all spacing proportionally
 *   spacing.scale → componentGap
 *   radius.default → small/medium/large (scaled)
 *   shadow.default → soft, shadow.large → medium
 */
function applyDesignSystemOverrides(
  baseStyle: ProjectStyle,
  overrides?: Record<string, unknown>,
): ProjectStyle {
  if (!overrides || Object.keys(overrides).length === 0) {
    return baseStyle;
  }

  const tokens: StyleTokens = {
    ...baseStyle.tokens,
    typography: { ...baseStyle.tokens.typography },
    colors: { ...baseStyle.tokens.colors },
    spacing: { ...baseStyle.tokens.spacing },
    radius: { ...baseStyle.tokens.radius },
    shadow: { ...baseStyle.tokens.shadow },
  };

  // AI-PANEL-OVERRIDE: kategori panel yang akan di-extract ke panelOverrides
  const panelOverrides: Record<string, Record<string, Record<string, unknown>>> = {};

  // Detect format: if any value is an object, it's structured; otherwise flat string keys
  const isStructured = Object.values(overrides).some(
    (v) => typeof v === 'object' && v !== null && !Array.isArray(v),
  );

  if (isStructured) {
    // Structured format: { typography: { fontFamily: "..." }, colors: { primary: "#hex" } }
    const o = overrides as {
      typography?: Record<string, unknown>;
      colors?: Record<string, unknown>;
      spacing?: Record<string, unknown>;
      radius?: Record<string, unknown>;
      shadow?: Record<string, unknown>;
      learning?: Record<string, unknown>;
      game?: Record<string, unknown>;
      feedback?: Record<string, unknown>;
      reward?: Record<string, unknown>;
      quiz?: Record<string, unknown>;
    };

    if (o.typography) {
      const t = o.typography;
      if (typeof t.fontFamily === 'string') tokens.typography.fontFamily = t.fontFamily;
      if (typeof t.fontSizeBase === 'number') {
        const scale = t.fontSizeBase / 16;
        tokens.typography.titleSize = Math.round(tokens.typography.titleSize * scale);
        tokens.typography.subtitleSize = Math.round(tokens.typography.subtitleSize * scale);
        tokens.typography.bodySize = Math.round(tokens.typography.bodySize * scale);
        tokens.typography.smallSize = Math.round(tokens.typography.smallSize * scale);
      }
      if (typeof t.lineHeightBase === 'number') tokens.typography.lineHeight = t.lineHeightBase;
      // ENGINE-GAP-FILL: apply extended typography tokens
      if (typeof t.titleSize === 'number') tokens.typography.titleSize = t.titleSize;
      if (typeof t.subtitleSize === 'number') tokens.typography.subtitleSize = t.subtitleSize;
      if (typeof t.bodySize === 'number') tokens.typography.bodySize = t.bodySize;
      if (typeof t.smallSize === 'number') tokens.typography.smallSize = t.smallSize;
      if (typeof t.lineHeight === 'number') tokens.typography.lineHeight = t.lineHeight;
      if (typeof t.titleWeight === 'number') tokens.typography.titleWeight = t.titleWeight;
      if (typeof t.bodyWeight === 'number') tokens.typography.bodyWeight = t.bodyWeight;
      if (typeof t.letterSpacing === 'number') tokens.typography.letterSpacing = t.letterSpacing;
      if (typeof t.uppercase === 'boolean') tokens.typography.uppercase = t.uppercase;
      if (typeof t.heroFont === 'string') tokens.typography.heroFont = t.heroFont;
      if (typeof t.bodyFont === 'string') tokens.typography.bodyFont = t.bodyFont;
    }

    if (o.colors) {
      const c = o.colors;
      if (typeof c.primary === 'string') tokens.colors.primary = c.primary;
      if (typeof c.secondary === 'string') tokens.colors.secondary = c.secondary;
      // ENGINE-GAP-FILL: accent — field terpisah + backward compat ke secondary
      if (typeof c.accent === 'string') {
        tokens.colors.accent = c.accent;
        tokens.colors.secondary = c.accent;
      }
      if (typeof c.background === 'string') tokens.colors.background = c.background;
      if (typeof c.surface === 'string') tokens.colors.surface = c.surface;
      if (typeof c.text === 'string') tokens.colors.text = c.text;
      if (typeof c.mutedText === 'string') tokens.colors.mutedText = c.mutedText;
      if (typeof c.border === 'string') tokens.colors.border = c.border;
      if (typeof c.success === 'string') tokens.colors.success = c.success;
      if (typeof c.warning === 'string') tokens.colors.warning = c.warning;
      if (typeof c.error === 'string') tokens.colors.danger = c.error;
      if (typeof c.danger === 'string') tokens.colors.danger = c.danger;
      // ENGINE-GAP-FILL: gold
      if (typeof c.gold === 'string') tokens.colors.gold = c.gold;
    }

    if (o.spacing) {
      const s = o.spacing;
      if (typeof s.unit === 'number') {
        const scale = s.unit / 8;
        tokens.spacing.pagePadding = Math.round(tokens.spacing.pagePadding * scale);
        tokens.spacing.componentGap = Math.round(tokens.spacing.componentGap * scale);
        tokens.spacing.cardPadding = Math.round(tokens.spacing.cardPadding * scale);
      }
      if (typeof s.scale === 'number') tokens.spacing.componentGap = s.scale;
    }

    if (o.radius) {
      const r = o.radius;
      // ENGINE-GAP-FILL: support r.small/medium/large langsung
      if (typeof r.default === 'number') {
        tokens.radius.small = r.default;
        tokens.radius.medium = Math.round(r.default * 1.5);
        tokens.radius.large = Math.round(r.default * 2);
      }
      if (typeof r.small === 'number') tokens.radius.small = r.small;
      if (typeof r.medium === 'number') tokens.radius.medium = r.medium;
      if (typeof r.large === 'number') tokens.radius.large = r.large;
    }

    if (o.shadow) {
      const sh = o.shadow;
      if (typeof sh.default === 'string') tokens.shadow.soft = sh.default;
      if (typeof sh.large === 'string') tokens.shadow.medium = sh.large;
    }

    // AI-PANEL-OVERRIDE: extract structured panel categories ke panelOverrides
    const PANEL_CATEGORIES = ['learning', 'game', 'feedback', 'reward', 'quiz'];
    for (const cat of PANEL_CATEGORIES) {
      const catValue = (o as Record<string, unknown>)[cat];
      if (isObjectRecord(catValue)) {
        const catResult: Record<string, Record<string, unknown>> = {};
        for (const [panelName, panelValue] of Object.entries(catValue)) {
          if (isObjectRecord(panelValue)) {
            catResult[panelName] = panelValue;
          }
        }
        if (Object.keys(catResult).length > 0) {
          panelOverrides[cat] = catResult;
        }
      }
    }
  } else {
    // Flat key string format: { "colors.primary": "#hex" }
    for (const [key, value] of Object.entries(overrides)) {
      const parts = key.split('.');
      if (parts.length !== 2) continue;
      const [category, tokenName] = parts;

      if (category === 'typography' && tokens.typography) {
        (tokens.typography as Record<string, unknown>)[tokenName] = value;
      } else if (category === 'colors' && tokens.colors) {
        (tokens.colors as Record<string, unknown>)[tokenName] = value;
      } else if (category === 'spacing' && tokens.spacing) {
        (tokens.spacing as Record<string, unknown>)[tokenName] = value;
      } else if (category === 'radius' && tokens.radius) {
        (tokens.radius as Record<string, unknown>)[tokenName] = value;
      } else if (category === 'shadow' && tokens.shadow) {
        (tokens.shadow as Record<string, unknown>)[tokenName] = value;
      }
    }
  }

  const result: ProjectStyle = {
    ...baseStyle,
    tokens,
  };
  if (Object.keys(panelOverrides).length > 0) {
    result.panelOverrides = panelOverrides;
  }
  return result;
}

function isObjectRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * CONTRAST-GUARD: Structural fix untuk AI palette yang gagal WCAG 2.1.
 *
 * Dua masalah sekaligus, fix di SOURCE (tokens.colors), bukan tambal sulam di renderer:
 *
 * 1. DARK BG + DARK TEXT → auto-fix text ke putih
 *    AI sering kirim text:'#17324d' (dark navy) di background:'#0b1728' (dark).
 *    Contrast < 4.5:1 → verifyAndFixTextContrast auto-replace ke '#ffffff'.
 *
 * 2. DARK BG + LIGHT SURFACE → derive dark surface dari bg
 *    AI sering kirim surface:'#fffdf7' (light cream) di background:'#0b1728' (dark).
 *    Ini bikin panel terang di atas page gelap = "belang".
 *    Fix: jika bg dark tapi surface light → darken surface sampai dark.
 *
 * Pure function — return new style object, tidak mutate input.
 */
function applyContrastGuard(style: ProjectStyle): ProjectStyle {
  const colors = style?.tokens?.colors;
  if (!colors) return style;

  const bg = colors.background;
  const surface = colors.surface;
  if (!bg || !surface) return style;

  const fixedColors = { ...colors };
  const isDarkTheme = isDarkColor(bg);

  // FIX 1: Dark bg + light surface → derive dark surface
  if (isDarkTheme && !isDarkColor(surface)) {
    let darkSurface = surface;
    for (let i = 0; i < 10; i++) {
      darkSurface = darkenLightColor(darkSurface, 30);
      if (isDarkColor(darkSurface)) break;
    }
    if (!isDarkColor(darkSurface)) {
      darkSurface = bg;
    }
    fixedColors.surface = darkSurface;
  }

  // FIX 2: Dark bg + dark text → auto-fix text ke putih
  if (colors.text) {
    const result = verifyAndFixTextContrast(bg, colors.text);
    if (result.fixed) {
      fixedColors.text = result.text;
    }
  }

  // FIX 3: mutedText juga perlu fix
  if (colors.mutedText) {
    const result = verifyAndFixTextContrast(bg, colors.mutedText);
    if (result.fixed) {
      fixedColors.mutedText = result.text;
    }
  }

  // FIX 4: border pada dark theme — jika terlalu gelap, pakai rgba putih
  if (isDarkTheme && colors.border) {
    if (isDarkColor(colors.border) && getLuminance(colors.border) < 0.05) {
      fixedColors.border = 'rgba(255,255,255,0.12)';
    }
  }

  if (JSON.stringify(fixedColors) === JSON.stringify(colors)) {
    return style;
  }

  return {
    ...style,
    tokens: {
      ...style.tokens,
      colors: fixedColors,
    },
  };
}

export function aiBlueprintToSimpleProject(blueprint: AiMpiBlueprint): SimpleProject {
  const stylePackId = blueprint.styleIntent?.styleId ?? 'modern-clean';
  const stylePack = resolveStylePackV1(stylePackId);
  let style = stylePackToProjectStyle(stylePack);

  // BUG FIX V1 (from Qwen PR): Apply designSystem.overrides so AI custom styles
  // (font, color, spacing) are not ignored during import.
  style = applyDesignSystemOverrides(style, blueprint.designSystem?.overrides);

  // CONTRAST-GUARD: Structural fix untuk "dark bg + dark text" dan "dark bg + light surface".
  // AI buta warna — mesin yang hitung matematis (WCAG 2.1). Dua masalah sekaligus:
  //   1. Jika bg gelap tapi text gelap → auto-fix text ke putih (contrast < 4.5:1)
  //   2. Jika bg gelap tapi surface terang → derive dark surface dari bg (bukan patch di renderer)
  // Ini fix di SOURCE (tokens), bukan tambal sulam di renderer. Semua downstream
  // (CSS vars, contract palette, renderer) otomatis dapat warna yang konsisten.
  style = applyContrastGuard(style);

  const pages: SimplePage[] = blueprint.scenes.map((scene) => mapSceneToPage(scene, style?.tokens?.colors));

  const curriculum: Curriculum | undefined = blueprint.curriculum
    ? {
        subject: blueprint.curriculum.subject,
        grade: blueprint.curriculum.grade,
        phase: blueprint.curriculum.phase,
        topic: blueprint.curriculum.topic,
        cp: blueprint.curriculum.cp,
        objectives: blueprint.curriculum.objectives.map(
          (o): CurriculumObjective => ({ id: o.id, text: o.text }),
        ),
      }
    : undefined;

  // UX-03: Set flag if AI provided style overrides
  const hasAiStyleOverrides = !!(blueprint.designSystem?.overrides &&
    Object.keys(blueprint.designSystem.overrides).length > 0);

  return {
    id: createProjectId(),
    title: blueprint.metadata.title,
    version: PROJECT_VERSION,
    currentPageId: pages[0]?.id ?? '',
    stylePackId,
    style,
    curriculum,
    pages,
    // CORE-MPI-UX-FOUNDATION-01: preserve assets from blueprint (for image/media rendering).
    assets: blueprint.assets.map((a) => ({ id: a.id, type: a.type, src: a.src, alt: a.alt })),
    // UX-03: flag for AI Style Badge
    hasAiStyleOverrides,
  };
}
