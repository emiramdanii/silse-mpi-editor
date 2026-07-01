/**
 * Export HTML module for silse-mpi-editor.
 *
 * Layer: export
 * Allowed imports: ../core (types, style resolver, style-presets)
 *
 * Kontrak (Batch 6 / M6 + M6 PATCH):
 *   - Satu file HTML standalone.
 *   - CSS inline dalam <style>.
 *   - JS inline dalam <script>.
 *   - Data project embedded sebagai JSON literal (render model).
 *   - TIDAK ADA switch style manual per variant di JS export.
 *   - Style datang dari resolveComponentStyle via buildExportRenderModel.
 *   - Tidak ada CDN, external script, external stylesheet.
 *   - Tidak ada React/Vite runtime.
 *   - Security: escape `</script>` in project data.
 */

import type { SimpleProject, SimplePage, PageComponent } from '../core/types';
import type { ProjectStyle } from '../core/style-types';
import { getResolvedComponentStyle } from '../core/style/resolveComponentStyle';
import { getSkinClassForComponent } from '../core/style-packs/component-skin';
import { getBackgroundPatternForStylePack } from '../core/style-packs/background-pattern';
import { getCoverClassForStylePack, getAllCoverClassNames } from '../core/style-packs/cover-decoration';
import { getMicroAnimationForStylePack } from '../core/style-packs/micro-animation';
import { getCelebrationEffectForStylePack } from '../core/style-packs/celebration-effect';
import { getPremiumExportProfile, type PremiumExportProfile } from '../core/style-packs/premium-export-profile';
import { buildSceneRenderPlanForPage, type SceneRenderPlan } from '../core/scene-renderer';

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

// ---------------------------------------------------------------------------
// Export Render Model — pre-computed style via resolver
// ---------------------------------------------------------------------------

/**
 * Render model for export. Each component has pre-computed resolvedStyle
 * from resolveComponentStyle. The inline JS does NOT re-compute style.
 */
type ExportRenderModel = {
  title: string;
  stylePackId: string;
  /** Curriculum topic for kicker pill on cover/closing pages. */
  curriculumTopic?: string;
  /** Curriculum subject for kicker pill on cover/closing pages. */
  curriculumSubject?: string;
  /** Curriculum grade for kicker pill on cover/closing pages. */
  curriculumGrade?: string;
  pages: ExportRenderPage[];
  cssVariables: Record<string, string>;
};

type ExportRenderPage = {
  id: string;
  title: string;
  role: string;
  background: SimplePage['background'];
  components: ExportRenderComponent[];
  /** FOUNDATION-INTEGRATION-01: scene render plan (jika page scene-renderable). Null = fallback ke legacy. */
  scenePlan?: SceneRenderPlan | null;
};

type ExportRenderComponent = {
  id: string;
  type: string;
  variant: string;
  // Geometry
  x: number;
  y: number;
  width: number;
  height: number;
  // COMPONENT-SKIN-V2: skin class for visual styling
  skinClass?: string;
  // Component-specific data
  text?: string;
  src?: string;
  alt?: string;
  objectFit?: string;
  cardTitle?: string;
  body?: string;
  label?: string;
  action?: string;
  targetPageId?: string;
  // Question-specific (M10)
  questionTitle?: string;
  prompt?: string;
  choices?: { id: string; text: string }[];
  correctChoiceIndex?: number;
  feedbackCorrect?: string;
  feedbackWrong?: string;
  points?: number;
  scoringStyle?: string;
  // Game-specific (M11A)
  gameType?: string;
  gameTitle?: string;
  gameInstruction?: string;
  missions?: { id: string; title: string; prompt: string; choices: { id: string; text: string }[]; correctChoiceIndex: number; feedbackCorrect: string; feedbackWrong: string; points: number }[];
  // MPI-JSON-SCENE-PROOF-01: scene metadata for game-mission rendering
  sceneMetadata?: { scene: string; briefing?: string; missionTarget?: string; reward?: { type: string; label: string } };
  // Layered-info-specific (LXC-02)
  layeredTitle?: string;
  layeredVariant?: string;
  layers?: { id: string; title: string; body: string; icon?: string }[];
  defaultOpenIndex?: number | null;
  // Learning-bridge-specific (LXC-03)
  bridgeTitle?: string;
  bridgeVariant?: string;
  bridgeMessage?: string;
  bridgeNextButtonLabel?: string;
  // Pre-computed resolved style from resolver
  resolvedStyle: {
    inlineStyle: Record<string, string | number>;
    className?: string;
    interactions?: {
      hover?: Record<string, string | undefined>;
      press?: Record<string, string | undefined>;
      focus?: Record<string, string | undefined>;
    };
  };
};

/**
 * Build export render model with pre-computed resolvedStyle per component.
 * This is where resolveComponentStyle is called for export.
 */
function buildExportRenderModel(project: SimpleProject): ExportRenderModel {
  const cssVariables = generateCssVariablesMap(project.style);

  const pages: ExportRenderPage[] = project.pages.map((page) => ({
    id: page.id,
    title: page.title,
    role: page.role,
    background: page.background,
    components: page.components.map((component) =>
      buildExportRenderComponent(project, page, component),
    ),
    // FOUNDATION-INTEGRATION-01: build scene render plan if page is scene-renderable
    scenePlan: buildSceneRenderPlanForPage(project, page),
  }));

  return {
    title: project.title,
    stylePackId: project.stylePackId ?? 'modern-clean',
    curriculumTopic: project.curriculum?.topic,
    curriculumSubject: project.curriculum?.subject,
    curriculumGrade: project.curriculum?.grade,
    pages,
    cssVariables,
  };
}

function buildExportRenderComponent(
  project: SimpleProject,
  page: SimplePage,
  component: PageComponent,
): ExportRenderComponent {
  // M6 PATCH: resolve style via shared resolver
  const resolved = getResolvedComponentStyle(project, page, component);

  const base: ExportRenderComponent = {
    id: component.id,
    type: component.type,
    variant: (component as { variant: string }).variant,
    x: component.x,
    y: component.y,
    width: component.width,
    height: component.height,
    // COMPONENT-SKIN-V2: skin class based on style pack + component type.
    skinClass: getSkinClassForComponent(component.type, project.stylePackId),
    resolvedStyle: {
      inlineStyle: resolved.inlineStyle,
      className: resolved.className,
      interactions: resolved.interactions as Record<string, Record<string, string | undefined>> | undefined,
    },
  };

  // Component-specific data
  if (component.type === 'text') {
    base.text = component.text;
  } else if (component.type === 'image') {
    base.src = component.src;
    base.alt = component.alt ?? '';
    base.objectFit = component.objectFit;
  } else if (component.type === 'card') {
    base.cardTitle = component.title ?? '';
    base.body = component.body;
  } else if (component.type === 'navigation') {
    base.label = component.label;
    base.action = component.action;
    base.targetPageId = component.targetPageId ?? '';
  } else if (component.type === 'question') {
    base.questionTitle = component.title;
    base.prompt = component.prompt;
    base.choices = component.choices;
    base.correctChoiceIndex = component.correctChoiceIndex;
    base.feedbackCorrect = component.feedbackCorrect;
    base.feedbackWrong = component.feedbackWrong;
    base.points = component.points;
    base.scoringStyle = component.scoringStyle;
  } else if (component.type === 'game') {
    base.gameType = component.gameType;
    base.gameTitle = component.title;
    base.gameInstruction = component.instruction;
    base.missions = component.missions;
    base.scoringStyle = component.scoringStyle;
    // MPI-JSON-SCENE-PROOF-01: preserve scene metadata for game-mission rendering
    if (component.sceneMetadata) {
      base.sceneMetadata = component.sceneMetadata;
    }
  } else if (component.type === 'layered-info') {
    base.layeredTitle = component.title;
    base.layeredVariant = component.variant;
    base.layers = component.layers;
    base.defaultOpenIndex = component.defaultOpenIndex;
  } else if (component.type === 'learning-bridge') {
    base.bridgeTitle = component.title;
    base.bridgeVariant = component.variant;
    base.bridgeMessage = component.message;
    base.bridgeNextButtonLabel = component.nextButtonLabel;
  }

  return base;
}

// ---------------------------------------------------------------------------
// Security: escape `</script>` in JSON data
// ---------------------------------------------------------------------------

function serializeRenderModel(model: ExportRenderModel): string {
  const json = JSON.stringify(model);
  return json.replace(/<\/script>/gi, '<\\/script>');
}

// ---------------------------------------------------------------------------
// CSS variables from StylePack tokens
// ---------------------------------------------------------------------------

function generateCssVariablesMap(style: ProjectStyle | undefined): Record<string, string> {
  if (!style) return {};

  const { colors, typography, spacing, radius, shadow } = style.tokens;
  return {
    '--silse-color-background': colors.background,
    '--silse-color-surface': colors.surface,
    '--silse-color-primary': colors.primary,
    '--silse-color-secondary': colors.secondary,
    '--silse-color-text': colors.text,
    '--silse-color-muted-text': colors.mutedText,
    '--silse-color-border': colors.border,
    '--silse-color-success': colors.success,
    '--silse-color-warning': colors.warning,
    '--silse-color-danger': colors.danger,
    '--silse-font-family': typography.fontFamily,
    '--silse-title-size': `${typography.titleSize}px`,
    '--silse-subtitle-size': `${typography.subtitleSize}px`,
    '--silse-body-size': `${typography.bodySize}px`,
    '--silse-small-size': `${typography.smallSize}px`,
    '--silse-line-height': String(typography.lineHeight),
    '--silse-spacing-page-padding': `${spacing.pagePadding}px`,
    '--silse-spacing-component-gap': `${spacing.componentGap}px`,
    '--silse-spacing-card-padding': `${spacing.cardPadding}px`,
    '--silse-radius-small': `${radius.small}px`,
    '--silse-radius-medium': `${radius.medium}px`,
    '--silse-radius-large': `${radius.large}px`,
    '--silse-shadow-none': shadow.none,
    '--silse-shadow-soft': shadow.soft,
    '--silse-shadow-medium': shadow.medium,
  };
}

function generateCssVariablesString(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');
}

// ---------------------------------------------------------------------------
// CSS generation
// ---------------------------------------------------------------------------

function generateCSS(cssVars: Record<string, string>, profile: PremiumExportProfile): string {
  const varsStr = generateCssVariablesString(cssVars);
  const c = profile.colors;
  const g = profile.gradients;
  const t = profile.typography;
  const cardR = profile.cardRadius;
  const btnR = profile.buttonRadius;
  const isDark = profile.darkStage;
  const stageOuter = isDark ? c.navy : '#f1f5f9';
  const stageTextOnDark = isDark ? '#ffffff' : c.navy;
  const heroColor = isDark ? '#ffffff' : c.blue;
  const heroAccent = c.red;
  const bodyColor = isDark ? 'rgba(255,255,255,0.92)' : c.text;
  const mutedColor = isDark ? 'rgba(255,255,255,0.7)' : c.muted;
  const cardBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.96)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(29,53,87,0.12)';
  const cardShadow = isDark
    ? `0 22px 54px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.04)`
    : `0 22px 54px rgba(29,53,87,0.18), 0 4px 12px rgba(29,53,87,0.06)`;

  return `
:root {
${varsStr}
  --silse-navy: ${c.navy};
  --silse-blue: ${c.blue};
  --silse-red: ${c.red};
  --silse-gold: ${c.gold};
  --silse-gold-deep: ${c.goldDeep};
  --silse-paper: ${c.paper};
  --silse-text-premium: ${bodyColor};
  --silse-muted-premium: ${mutedColor};
  --silse-hero-font: ${t.heroFont};
  --silse-body-font: ${t.bodyFont};
  --silse-hero-weight: ${t.heroWeight};
  --silse-hero-letter-spacing: ${t.heroLetterSpacing};
  --silse-card-radius: ${cardR}px;
  --silse-button-radius: ${btnR}px;
  --silse-stage-outer: ${stageOuter};
  --silse-stage-text: ${stageTextOnDark};
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: var(--silse-body-font, 'Segoe UI', Arial, sans-serif);
  background: var(--silse-stage-outer);
}

body {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: 0;
}

.silse-viewport {
  width: 100vw;
  height: 100vh;
  display: grid;
  place-items: center;
  padding: 14px;
}

#silse-toolbar {
  position: absolute;
  top: 18px;
  left: 32px;
  right: 32px;
  height: 38px;
  z-index: 50;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 6px 0 14px;
  color: var(--silse-stage-text);
  font-size: 13px;
  font-weight: 800;
  pointer-events: none;
}

#silse-toolbar > * { pointer-events: auto; }
#silse-toolbar .silse-toolbar-side { display: inline-flex; align-items: center; gap: 8px; }

#silse-toolbar #silse-page-info {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(255,255,255,0.10);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.18);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.3px;
}

#silse-toolbar button {
  background: rgba(255,255,255,0.12);
  color: var(--silse-stage-text);
  border: 1px solid rgba(255,255,255,0.22);
  padding: 7px 16px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.2px;
  transition: transform 0.18s ease, background 0.18s ease;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

#silse-toolbar button:disabled { opacity: 0.4; cursor: not-allowed; }
#silse-toolbar button:hover:not(:disabled) {
  background: rgba(255,255,255,0.22);
  transform: translateY(-1px);
}

#silse-canvas {
  width: ${CANVAS_WIDTH}px;
  height: ${CANVAS_HEIGHT}px;
  background: ${g.defaultBg};
  position: relative;
  overflow: hidden;
  border-radius: 26px;
  box-shadow: 0 26px 70px rgba(0,0,0,0.42), 0 8px 22px rgba(0,0,0,0.22);
  flex-shrink: 0;
  isolation: isolate;
}

/* Page-role-aware background gradients (PREMIUM-EXPORT-OVERHAUL-01) */
#silse-canvas[data-page-role="cover"] { background: ${g.coverBg}; }
#silse-canvas[data-page-role="closing"] { background: ${g.closingBg}; }
#silse-canvas[data-page-role="material"],
#silse-canvas[data-page-role="learningObjectives"] { background: ${g.materialBg}; }
#silse-canvas[data-page-role="quiz"],
#silse-canvas[data-page-role="activity"] { background: ${g.quizBg}; }

#silse-canvas .silse-nav-btn {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--silse-button-radius);
  font-family: var(--silse-body-font);
  font-weight: 900;
  letter-spacing: 0.2px;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
#silse-canvas .silse-nav-btn:hover { transform: translateY(-2px); }
#silse-canvas .silse-nav-btn:active { transform: translateY(0); }

#silse-canvas .silse-question-choice {
  padding: 14px 18px;
  min-height: 44px;
  height: auto;
  border: 2px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(29,53,87,0.10)'};
  border-radius: 18px;
  background: ${isDark ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.98)'};
  color: ${c.text};
  cursor: pointer;
  font-size: 16px;
  font-weight: 650;
  line-height: 1.4;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 8px 18px rgba(0,0,0,0.10);
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.15s ease-out;
}

#silse-canvas .silse-question-choice:hover {
  transform: translateY(-3px);
  border-color: ${c.gold};
  box-shadow: 0 14px 28px rgba(0,0,0,0.16);
}

#silse-canvas .silse-question-choice .silse-choice-letter {
  display: inline-grid;
  place-items: center;
  min-width: 38px;
  height: 38px;
  border-radius: 12px;
  background: ${c.blue};
  color: #fff;
  font-size: 16px;
  font-weight: 900;
  flex-shrink: 0;
}

#silse-canvas .silse-question-feedback {
  margin-top: 10px;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 700;
  white-space: normal;
  overflow-wrap: anywhere;
}

#silse-toolbar .silse-score {
  margin-left: 8px;
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 999px;
  background: linear-gradient(145deg, var(--silse-gold), var(--silse-gold-deep));
  color: var(--silse-navy);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.3px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.18);
}

#silse-canvas .silse-game-choice {
  padding: 14px 18px;
  min-height: 44px;
  height: auto;
  border: 2px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(29,53,87,0.10)'};
  border-radius: 18px;
  background: ${isDark ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.98)'};
  color: ${c.text};
  cursor: pointer;
  font-size: 16px;
  font-weight: 650;
  line-height: 1.4;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 8px 18px rgba(0,0,0,0.10);
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

#silse-canvas .silse-game-choice:hover {
  transform: translateY(-3px);
  border-color: ${c.gold};
  box-shadow: 0 14px 28px rgba(0,0,0,0.16);
}

#silse-canvas .silse-game-choice .silse-choice-letter {
  display: inline-grid;
  place-items: center;
  min-width: 38px;
  height: 38px;
  border-radius: 12px;
  background: ${c.blue};
  color: #fff;
  font-size: 16px;
  font-weight: 900;
  flex-shrink: 0;
}

#silse-canvas .silse-game-feedback {
  margin-top: 10px;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 700;
  white-space: normal;
  overflow-wrap: anywhere;
}

/* COMPONENT-SKIN-V2: Component skin classes (3 style packs × 5 component types) */
.skin-card-flat { border:1px solid var(--silse-color-border); border-radius:10px; background:var(--silse-color-surface); box-shadow:0 2px 8px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04); }
.skin-card-soft { border:1px solid rgba(255,200,200,0.4); border-radius:18px; background:linear-gradient(135deg,var(--silse-color-surface) 0%,rgba(255,255,255,0.7) 100%); box-shadow:0 4px 16px rgba(0,0,0,0.08),0 1px 4px rgba(0,0,0,0.04); }
.skin-card-bold { border:2px solid var(--silse-color-primary); border-radius:10px; background:var(--silse-color-surface); box-shadow:0 0 0 1px rgba(59,130,246,0.3),0 6px 20px rgba(0,0,0,0.5),0 2px 8px rgba(59,130,246,0.15); }
.skin-button-clean { border:1px solid var(--silse-color-primary); border-radius:6px; background:var(--silse-color-primary); color:#fff; font-weight:600; box-shadow:0 1px 2px rgba(37,99,235,0.2); }
.skin-button-rounded { border:none; border-radius:24px; background:linear-gradient(135deg,var(--silse-color-primary) 0%,var(--silse-color-secondary) 100%); color:#fff; font-weight:600; box-shadow:0 2px 6px rgba(245,158,11,0.3); }
.skin-button-mission { border:2px solid var(--silse-color-primary); border-radius:4px; background:var(--silse-color-surface); color:var(--silse-color-primary); font-weight:700; text-transform:uppercase; letter-spacing:0.5px; box-shadow:0 0 12px rgba(59,130,246,0.4); }
.skin-quiz-calm { border:1px solid var(--silse-color-border); border-radius:10px; background:var(--silse-color-surface); }
.skin-quiz-playful { border:2px solid rgba(245,158,11,0.3); border-radius:16px; background:linear-gradient(135deg,rgba(254,243,199,0.5) 0%,rgba(255,255,255,0.8) 100%); }
.skin-quiz-mission { border:2px solid var(--silse-color-primary); border-radius:8px; background:var(--silse-color-surface); box-shadow:0 0 16px rgba(59,130,246,0.2); }
.skin-bridge-subtle { border-left:4px solid var(--silse-color-primary); background:rgba(37,99,235,0.04); }
.skin-bridge-strong { border-left:6px solid var(--silse-color-primary); background:linear-gradient(90deg,rgba(59,130,246,0.15) 0%,transparent 100%); box-shadow:0 0 12px rgba(59,130,246,0.2); }
.skin-game-calm { border:1px solid var(--silse-color-border); border-radius:10px; background:var(--silse-color-surface); }
.skin-game-playful { border:2px solid rgba(34,197,94,0.3); border-radius:16px; background:linear-gradient(135deg,rgba(220,252,231,0.5) 0%,rgba(255,255,255,0.8) 100%); }
.skin-game-mission { border:2px solid var(--silse-color-primary); border-radius:8px; background:var(--silse-color-surface); box-shadow:0 0 20px rgba(59,130,246,0.3); }
.skin-layered-clean { border:1px solid var(--silse-color-border); border-radius:10px; background:var(--silse-color-surface); }
.skin-layered-soft { border:2px solid rgba(255,200,200,0.3); border-radius:16px; background:linear-gradient(135deg,var(--silse-color-surface) 0%,rgba(255,255,255,0.7) 100%); }
.skin-layered-bold { border:2px solid var(--silse-color-primary); border-radius:8px; background:var(--silse-color-surface); box-shadow:0 0 16px rgba(59,130,246,0.15); }
.skin-text-clean { text-shadow:none; }
.skin-text-soft { text-shadow:0 1px 2px rgba(0,0,0,0.03); }
.skin-text-bold { text-shadow:0 0 8px rgba(59,130,246,0.2); font-weight:500; }
/* BACKGROUND-PATTERN-SYSTEM-V1: background pattern classes */
.silse-bg-page-clean::before { content:''; position:absolute; inset:0; background:linear-gradient(180deg,rgba(248,250,252,0.5) 0%,transparent 30%,transparent 70%,rgba(241,245,249,0.3) 100%); pointer-events:none; z-index:0; }
.silse-bg-page-soft::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(254,243,199,0.15) 0%,rgba(254,226,226,0.1) 50%,rgba(254,215,170,0.08) 100%); pointer-events:none; z-index:0; }
.silse-bg-page-mission::before { content:''; position:absolute; inset:0; background:radial-gradient(ellipse at 50% 30%,rgba(59,130,246,0.08) 0%,transparent 60%); pointer-events:none; z-index:0; }
.silse-bg-pattern-subtle-grid::after { content:''; position:absolute; inset:0; background-image:linear-gradient(rgba(37,99,235,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.02) 1px,transparent 1px); background-size:40px 40px; pointer-events:none; z-index:0; }
.silse-bg-pattern-soft-dots::after { content:''; position:absolute; inset:0; background-image:radial-gradient(circle,rgba(245,158,11,0.04) 1.5px,transparent 1.5px); background-size:28px 28px; pointer-events:none; z-index:0; }
.silse-bg-pattern-mission-glow::after { content:''; position:absolute; inset:0; background-image:linear-gradient(rgba(59,130,246,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.03) 1px,transparent 1px); background-size:60px 60px; pointer-events:none; z-index:0; }
#silse-canvas { position:relative; }
#silse-canvas > * { position:relative; z-index:1; }
/* PREMIUM-STYLE-PACK-V2: visual personality polish */
.silse-bg-page-clean { --silse-shadow-feel:0 1px 3px rgba(0,0,0,0.04); --silse-radius-feel:8px; }
.silse-bg-page-soft { --silse-shadow-feel:0 2px 8px rgba(0,0,0,0.06); --silse-radius-feel:16px; }
.silse-bg-page-mission { --silse-shadow-feel:0 0 16px rgba(59,130,246,0.15); --silse-radius-feel:6px; }
/* COVER-PREMIUM-POLISH-01: cover decoration per style pack */
.silse-cover-clean::before { background:linear-gradient(160deg,rgba(37,99,235,0.12) 0%,rgba(37,99,235,0.03) 35%,transparent 55%,rgba(37,99,235,0.08) 100%) !important; }
.silse-cover-clean::after { content:''; position:absolute; top:-60px; right:-60px; width:240px; height:240px; background:radial-gradient(circle,rgba(37,99,235,0.1) 0%,transparent 70%); border-radius:50%; pointer-events:none; z-index:0; }
.silse-cover-clean [data-variant="title"] { text-shadow:0 2px 12px rgba(0,0,0,0.1); letter-spacing:-0.8px; font-weight:700; }
.silse-cover-clean [data-variant="subtitle"] { letter-spacing:1px; opacity:0.7; text-transform:uppercase; font-size:0.85em; font-weight:500; }
.silse-cover-soft::before { background:linear-gradient(135deg,rgba(254,243,199,0.35) 0%,rgba(254,226,226,0.2) 40%,rgba(254,215,170,0.15) 70%,rgba(253,230,138,0.1) 100%) !important; }
.silse-cover-soft::after { content:''; position:absolute; bottom:-80px; left:-80px; width:280px; height:280px; background:radial-gradient(circle,rgba(245,158,11,0.12) 0%,transparent 70%); border-radius:50%; pointer-events:none; z-index:0; }
.silse-cover-soft [data-variant="title"] { text-shadow:0 2px 8px rgba(245,158,11,0.15); letter-spacing:-0.5px; font-weight:700; }
.silse-cover-soft [data-variant="subtitle"] { letter-spacing:0.5px; opacity:0.75; font-weight:500; }
.silse-cover-mission::before { background:radial-gradient(ellipse at 50% 35%,rgba(59,130,246,0.2) 0%,transparent 45%,rgba(59,130,246,0.1) 100%) !important; }
.silse-cover-mission::after { content:''; position:absolute; top:0; right:0; width:100%; height:6px; background:linear-gradient(90deg,transparent 30%,rgba(59,130,246,0.5) 50%,transparent 70%); pointer-events:none; z-index:0; }
.silse-cover-mission [data-variant="title"] { text-shadow:0 0 24px rgba(59,130,246,0.4),0 2px 8px rgba(0,0,0,0.3); letter-spacing:-0.8px; font-weight:700; }
.silse-cover-mission [data-variant="subtitle"] { letter-spacing:2px; opacity:0.65; text-transform:uppercase; font-size:0.8em; font-weight:600; }
/* QUIZ-GAME-VISUAL-POLISH-01: quiz/game visual polish */
.silse-choice-default { border-left:3px solid transparent; transition:border-color 0.15s,background-color 0.15s; }
.silse-choice-default:hover { border-left-color:var(--silse-color-primary,#2563eb); }
.silse-choice-selected { border-left:3px solid var(--silse-color-primary,#2563eb); box-shadow:inset 0 0 0 1px rgba(37,99,235,0.2); }
.silse-choice-correct { border-left:4px solid #16a34a; box-shadow:inset 0 0 0 1px rgba(22,163,74,0.2); }
.silse-choice-wrong { border-left:4px solid #dc2626; box-shadow:inset 0 0 0 1px rgba(220,38,38,0.15); }
.silse-feedback-correct { border-left:4px solid #16a34a; font-weight:500; }
.silse-feedback-wrong { border-left:4px solid #dc2626; font-weight:500; }
.silse-score { font-weight:600; padding:4px 12px; border-radius:12px; background:rgba(255,255,255,0.15); }
.silse-quiz-mission .silse-question-choice, .silse-game-mission .silse-game-choice { border-radius:4px; letter-spacing:0.3px; }
.silse-quiz-mission .silse-choice-correct, .silse-game-mission .silse-choice-correct { box-shadow:0 0 8px rgba(34,197,94,0.3); }
.silse-quiz-mission .silse-choice-wrong, .silse-game-mission .silse-choice-wrong { box-shadow:0 0 8px rgba(239,68,68,0.3); }
.silse-quiz-playful .silse-question-choice, .silse-game-playful .silse-game-choice { border-radius:12px; }
.silse-quiz-playful .silse-feedback-correct, .silse-game-playful .silse-feedback-correct { border-radius:10px; }
.silse-quiz-playful .silse-feedback-wrong, .silse-game-playful .silse-feedback-wrong { border-radius:10px; }
/* MICRO-ANIMATION-SYSTEM-V1: micro animation + prefers-reduced-motion */
@keyframes silse-fade-in-soft { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
@keyframes silse-fade-in-warm { from{opacity:0;transform:translateY(6px) scale(0.998)} to{opacity:1;transform:translateY(0) scale(1)} }
@keyframes silse-fade-in-mission { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
@keyframes silse-feedback-pop { from{opacity:0;transform:translateY(-2px)} to{opacity:1;transform:translateY(0)} }
@keyframes silse-mission-pulse { 0%,100%{box-shadow:0 0 16px rgba(59,130,246,0.15)} 50%{box-shadow:0 0 20px rgba(59,130,246,0.25)} }
.silse-anim-page-soft-in { animation:silse-fade-in-soft 220ms ease-out; }
.silse-anim-page-warm-in { animation:silse-fade-in-warm 260ms ease-out; }
.silse-anim-page-mission-in { animation:silse-fade-in-mission 200ms ease-out; }
.silse-anim-button-clean { transition:transform 150ms ease-out,box-shadow 150ms ease-out; }
.silse-anim-button-clean:hover { transform:translateY(-1px); }
.silse-anim-button-soft { transition:transform 150ms ease-out,box-shadow 150ms ease-out; }
.silse-anim-button-soft:hover { transform:translateY(-1px); }
.silse-anim-button-mission { transition:transform 120ms ease-out,box-shadow 120ms ease-out; }
.silse-anim-button-mission:hover { transform:translateY(-1px); }
.silse-anim-choice-clean { transition:border-color 150ms ease-out,background-color 150ms ease-out; }
.silse-anim-choice-soft { transition:border-color 180ms ease-out,background-color 180ms ease-out,border-radius 180ms; }
.silse-anim-choice-mission { transition:border-color 120ms ease-out,background-color 120ms ease-out,box-shadow 120ms; }
.silse-anim-feedback-soft { animation:silse-feedback-pop 200ms ease-out; }
.silse-anim-feedback-warm { animation:silse-feedback-pop 240ms ease-out; }
.silse-anim-feedback-mission { animation:silse-feedback-pop 180ms ease-out; }
.silse-anim-game-clean { transition:border-color 150ms ease-out; }
.silse-anim-game-soft { transition:border-color 180ms ease-out,border-radius 180ms; }
.silse-anim-game-mission { transition:box-shadow 150ms ease-out; }
.silse-anim-game-mission.silse-game-mission { animation:silse-mission-pulse 3s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  *,*::before,*::after { animation-duration:0.01ms !important; animation-iteration-count:1 !important; transition-duration:0.01ms !important; }
  .silse-anim-page-soft-in,.silse-anim-page-warm-in,.silse-anim-page-mission-in,
  .silse-anim-feedback-soft,.silse-anim-feedback-warm,.silse-anim-feedback-mission { animation:none !important; }
  .silse-anim-game-mission.silse-game-mission { animation:none !important; }
}
/* CELEBRATION-EFFECT-V1: CSS-only celebration on correct answer */
@keyframes silse-celebrate-burst-ring { 0%{opacity:0.8;transform:scale(0.5)} 100%{opacity:0;transform:scale(1.4)} }
@keyframes silse-celebrate-sparkle { 0%,100%{opacity:0} 30%{opacity:1} 60%{opacity:0.5} }
.silse-celebrate-success-clean { position:relative; overflow:visible; }
.silse-celebrate-burst-clean::before { content:''; position:absolute; inset:-2px; border:2px solid rgba(22,163,74,0.4); border-radius:8px; animation:silse-celebrate-burst-ring 800ms ease-out; pointer-events:none; }
.silse-celebrate-particle-clean::before, .silse-celebrate-particle-clean::after { content:'✦'; position:absolute; font-size:10px; color:rgba(22,163,74,0.6); animation:silse-celebrate-sparkle 800ms ease-out; pointer-events:none; }
.silse-celebrate-particle-clean::before { top:-4px; right:8px; }
.silse-celebrate-particle-clean::after { top:-2px; right:24px; animation-delay:150ms; }
.silse-celebrate-success-soft { position:relative; overflow:visible; }
.silse-celebrate-burst-soft::before { content:''; position:absolute; inset:-2px; border:2px solid rgba(245,158,11,0.4); border-radius:12px; animation:silse-celebrate-burst-ring 900ms ease-out; pointer-events:none; }
.silse-celebrate-particle-soft::before, .silse-celebrate-particle-soft::after { content:'★'; position:absolute; font-size:11px; color:rgba(245,158,11,0.6); animation:silse-celebrate-sparkle 900ms ease-out; pointer-events:none; }
.silse-celebrate-particle-soft::before { top:-4px; right:8px; }
.silse-celebrate-particle-soft::after { top:-2px; right:24px; animation-delay:150ms; }
.silse-celebrate-success-mission { position:relative; overflow:visible; }
.silse-celebrate-burst-mission::before { content:''; position:absolute; inset:-2px; border:2px solid rgba(59,130,246,0.5); border-radius:6px; animation:silse-celebrate-burst-ring 700ms ease-out; pointer-events:none; box-shadow:0 0 12px rgba(59,130,246,0.3); }
.silse-celebrate-particle-mission::before, .silse-celebrate-particle-mission::after { content:'◆'; position:absolute; font-size:10px; color:rgba(59,130,246,0.7); animation:silse-celebrate-sparkle 700ms ease-out; pointer-events:none; }
.silse-celebrate-particle-mission::before { top:-4px; right:8px; }
.silse-celebrate-particle-mission::after { top:-2px; right:24px; animation-delay:120ms; }
@media (prefers-reduced-motion: reduce) {
  .silse-celebrate-burst-clean::before, .silse-celebrate-burst-soft::before, .silse-celebrate-burst-mission::before,
  .silse-celebrate-particle-clean::before, .silse-celebrate-particle-clean::after,
  .silse-celebrate-particle-soft::before, .silse-celebrate-particle-soft::after,
  .silse-celebrate-particle-mission::before, .silse-celebrate-particle-mission::after { animation:none !important; display:none !important; }
}

/* ----------------------------------------------------------------------- */
/* PREMIUM-EXPORT-OVERHAUL-01 — premium visual layers (on top of existing)  */
/* ----------------------------------------------------------------------- */

#silse-canvas > #silse-toolbar { position: absolute; z-index: 50; }

/* Hero typography for text components with variant=title */
#silse-canvas .silse-text-title,
#silse-canvas .silse-hero-title {
  font-family: var(--silse-hero-font);
  font-weight: var(--silse-hero-weight);
  letter-spacing: var(--silse-hero-letter-spacing);
  ${t.heroUppercase ? 'text-transform: uppercase;' : ''}
  color: ${heroColor};
  line-height: 1.04;
  text-shadow: ${isDark ? '0 4px 14px rgba(0,0,0,0.32)' : 'none'};
}
#silse-canvas .silse-text-title .silse-accent,
#silse-canvas .silse-hero-title .silse-accent {
  color: ${heroAccent};
}

#silse-canvas .silse-text-subtitle {
  font-family: var(--silse-body-font);
  font-weight: 700;
  letter-spacing: 0.01em;
  color: ${isDark ? 'rgba(255,255,255,0.86)' : c.muted};
}

#silse-canvas .silse-kicker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: 999px;
  background: linear-gradient(145deg, ${c.gold}, ${c.goldDeep});
  color: ${c.navy};
  font-family: var(--silse-body-font);
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  box-shadow: 0 6px 14px rgba(0,0,0,0.16);
  white-space: nowrap;
}

/* Premium skin overrides — multi-shadow + larger radius + glass bg */
#silse-canvas .skin-card-flat,
#silse-canvas .skin-card-soft,
#silse-canvas .skin-card-bold {
  border-radius: var(--silse-card-radius) !important;
  background: ${cardBg} !important;
  border: 1px solid ${cardBorder} !important;
  box-shadow: ${cardShadow} !important;
  color: ${bodyColor} !important;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
#silse-canvas .skin-card-flat > strong,
#silse-canvas .skin-card-soft > strong,
#silse-canvas .skin-card-bold > strong {
  display: block;
  font-family: var(--silse-hero-font);
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.01em;
  color: ${isDark ? '#fff' : c.blue};
  margin-bottom: 6px;
}

#silse-canvas .skin-button-clean,
#silse-canvas .skin-button-rounded,
#silse-canvas .skin-button-mission {
  border-radius: var(--silse-button-radius) !important;
  font-family: var(--silse-body-font) !important;
  font-weight: 900 !important;
  letter-spacing: 0.4px;
  ${t.heroUppercase ? 'text-transform: uppercase;' : ''}
  box-shadow: 0 12px 24px rgba(0,0,0,0.18) !important;
  background: linear-gradient(145deg, ${c.red}, ${c.blue}) !important;
  color: #fff !important;
  border: 0 !important;
  transition: transform 0.18s ease, box-shadow 0.18s ease !important;
}
#silse-canvas .skin-button-clean:hover,
#silse-canvas .skin-button-rounded:hover,
#silse-canvas .skin-button-mission:hover {
  transform: translateY(-2px) scale(1.02) !important;
  box-shadow: 0 18px 32px rgba(0,0,0,0.26) !important;
}

#silse-canvas .skin-quiz-calm,
#silse-canvas .skin-quiz-playful,
#silse-canvas .skin-quiz-mission,
#silse-canvas .skin-game-calm,
#silse-canvas .skin-game-playful,
#silse-canvas .skin-game-mission {
  border-radius: var(--silse-card-radius) !important;
  background: ${cardBg} !important;
  border: 1px solid ${cardBorder} !important;
  box-shadow: ${cardShadow} !important;
  color: ${bodyColor} !important;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
#silse-canvas .skin-quiz-calm > strong,
#silse-canvas .skin-quiz-playful > strong,
#silse-canvas .skin-quiz-mission > strong,
#silse-canvas .skin-game-calm > strong,
#silse-canvas .skin-game-playful > strong,
#silse-canvas .skin-game-mission > strong {
  font-family: var(--silse-hero-font);
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.01em;
  color: ${isDark ? '#fff' : c.blue};
}

#silse-canvas .skin-bridge-subtle,
#silse-canvas .skin-bridge-strong {
  border-radius: var(--silse-card-radius) !important;
  background: ${isDark ? 'rgba(255,209,102,0.08)' : 'rgba(255,248,219,0.6)'} !important;
  border: 1px solid ${isDark ? 'rgba(255,209,102,0.20)' : 'rgba(255,183,3,0.20)'} !important;
  box-shadow: ${cardShadow} !important;
  color: ${bodyColor} !important;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

#silse-canvas .skin-layered-clean,
#silse-canvas .skin-layered-soft,
#silse-canvas .skin-layered-bold {
  border-radius: var(--silse-card-radius) !important;
  background: ${cardBg} !important;
  border: 1px solid ${cardBorder} !important;
  box-shadow: ${cardShadow} !important;
  color: ${bodyColor} !important;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

/* Award medal — only rendered on closing pages */
#silse-canvas .silse-award-medal {
  position: absolute;
  left: 50%;
  top: 56px;
  transform: translateX(-50%);
  width: 200px;
  height: 200px;
  pointer-events: none;
  z-index: 1;
}
#silse-canvas .silse-award-medal .silse-award-shine {
  position: absolute;
  inset: -40%;
  background: conic-gradient(from 0deg, transparent, rgba(255,209,102,0.50), transparent, rgba(255,255,255,0.30), transparent);
  animation: silse-award-shine 8s linear 60;
  opacity: 0.55;
  border-radius: 50%;
}
#silse-canvas .silse-award-medal .silse-award-glow {
  position: absolute;
  inset: -22px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,209,102,0.70), rgba(255,209,102,0.20) 48%, transparent 70%);
  filter: blur(4px);
}
#silse-canvas .silse-award-medal .silse-award-medal-inner {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: linear-gradient(145deg, #fff8e7, #fff);
  border: 8px solid var(--silse-gold);
  box-shadow: 0 20px 40px rgba(0,0,0,0.20), inset 0 0 0 6px rgba(255,183,3,0.35), inset 0 0 38px rgba(255,209,102,0.28);
  font-size: 80px;
  line-height: 1;
}
#silse-canvas .silse-award-medal .silse-award-medal-inner::after {
  content: '';
  position: absolute;
  inset: -16px;
  border-radius: 50%;
  border: 3px dashed rgba(255,183,3,0.8);
}
@keyframes silse-award-shine { to { transform: rotate(360deg); } }

#silse-canvas .silse-award-ribbon {
  position: absolute;
  left: 50%;
  bottom: 64px;
  transform: translateX(-50%);
  padding: 10px 22px;
  border-radius: 999px;
  background: linear-gradient(135deg, ${c.red}, ${c.blue});
  color: #fff;
  font-family: var(--silse-body-font);
  font-size: 14px;
  font-weight: 900;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  box-shadow: 0 12px 24px rgba(0,0,0,0.28);
  pointer-events: none;
  z-index: 1;
  white-space: nowrap;
}

/* Hero card frame — only rendered on cover pages */
#silse-canvas .silse-hero-card {
  position: absolute;
  left: 50%;
  top: 130px;
  transform: translateX(-50%);
  width: 980px;
  height: 460px;
  background: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.92)'};
  border: 1px solid ${isDark ? 'rgba(255,255,255,0.18)' : 'rgba(29,53,87,0.14)'};
  border-radius: 30px;
  box-shadow: ${isDark
    ? '0 26px 60px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.04)'
    : '12px 12px 0 rgba(29,53,87,0.10), 0 24px 60px rgba(29,53,87,0.20)'};
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  pointer-events: none;
  z-index: 1;
}

#silse-canvas .silse-hero-kicker {
  position: absolute;
  left: 50%;
  top: 168px;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border-radius: 999px;
  background: linear-gradient(145deg, ${c.gold}, ${c.goldDeep});
  color: ${c.navy};
  font-family: var(--silse-body-font);
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  box-shadow: 0 6px 16px rgba(0,0,0,0.20);
  pointer-events: none;
  z-index: 2;
  white-space: nowrap;
}

#silse-canvas .silse-hero-cta {
  position: absolute;
  left: 50%;
  top: 510px;
  transform: translateX(-50%);
  padding: 14px 32px;
  border-radius: 999px;
  background: linear-gradient(145deg, ${c.red}, ${c.blue});
  color: #fff;
  font-family: var(--silse-body-font);
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  border: 0;
  cursor: pointer;
  box-shadow: 0 14px 28px rgba(0,0,0,0.28);
  pointer-events: auto;
  z-index: 2;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
#silse-canvas .silse-hero-cta:hover {
  transform: translateX(-50%) translateY(-2px) scale(1.02);
  box-shadow: 0 20px 36px rgba(0,0,0,0.36);
}

/* Note: reduced-motion is handled globally by MICRO-ANIMATION-SYSTEM-V1
   (animation-duration:0.01ms !important; animation-iteration-count:1 !important;
    transition-duration:0.01ms !important on *,*::before,*::after). */
`.trim();
}

// ---------------------------------------------------------------------------
// JS generation — reads from render model, NO style switch
// ---------------------------------------------------------------------------

function generateJS(renderModelJson: string, coverClassForProject: string, allCoverClasses: string[], pageEnterClass: string, celebrateSuccessClass: string, celebrateBurstClass: string, celebrateParticleClass: string): string {
  const coverClassJson = JSON.stringify(coverClassForProject);
  const allCoverClassesJson = JSON.stringify(allCoverClasses);
  const pageEnterClassJson = JSON.stringify(pageEnterClass);
  const celebrateSuccessJson = JSON.stringify(celebrateSuccessClass);
  const celebrateBurstJson = JSON.stringify(celebrateBurstClass);
  const celebrateParticleJson = JSON.stringify(celebrateParticleClass);
  return `
(function() {
  var MODEL = ${renderModelJson};
  var pages = MODEL.pages;
  var currentPageIdx = 0;
  var questionAnswers = {};
  var totalScore = 0;
  var gameStates = {};
  var layeredInfoStates = {};

  var canvas = document.getElementById('silse-canvas');
  var prevBtn = document.getElementById('silse-nav-prev');
  var nextBtn = document.getElementById('silse-nav-next');
  var pageInfo = document.getElementById('silse-page-info');
  var scoreDisplay = document.getElementById('silse-score');

  function updateScoreDisplay() {
    if (scoreDisplay) scoreDisplay.textContent = 'Skor: ' + totalScore;
  }

  function renderPage(idx) {
    if (idx < 0 || idx >= pages.length) return;
    currentPageIdx = idx;
    var page = pages[idx];

    // PREMIUM-EXPORT-OVERHAUL-01: toolbar is now inside the canvas.
    // Preserve it across renders (only wipe components, not the toolbar).
    var toolbar = canvas.querySelector('#silse-toolbar');
    canvas.innerHTML = '';
    if (toolbar) canvas.appendChild(toolbar);

    // COVER-PREMIUM-POLISH-01: Add/remove cover decoration class.
    var coverClasses = ${allCoverClassesJson};
    for (var ci = 0; ci < coverClasses.length; ci++) {
      canvas.classList.remove(coverClasses[ci]);
    }
    // MICRO-ANIMATION-SYSTEM-V1: Add/remove page-enter animation class.
    var animEnterClass = ${pageEnterClassJson};
    if (animEnterClass) {
      canvas.classList.remove(animEnterClass);
      // Force reflow then re-add to restart animation.
      void canvas.offsetWidth;
      canvas.classList.add(animEnterClass);
    }
    if (page.role === 'cover') {
      var coverClass = ${coverClassJson};
      if (coverClass) canvas.classList.add(coverClass);
    }

    // PREMIUM-EXPORT-OVERHAUL-01: set data-page-role for CSS-driven gradient backgrounds.
    if (page.role) {
      canvas.setAttribute('data-page-role', page.role);
    } else {
      canvas.removeAttribute('data-page-role');
    }

    // Set background — image wins, otherwise let CSS handle gradient via data-page-role.
    if (page.background.type === 'image') {
      canvas.style.background = 'url(' + page.background.imageSrc + ') center/cover no-repeat';
    } else if (page.background.type === 'gradient') {
      canvas.style.background = page.background.gradient;
    } else if (page.background.type === 'color') {
      var heroRole = (page.role === 'cover' || page.role === 'closing');
      if (heroRole) {
        canvas.style.background = '';
      } else {
        canvas.style.background = page.background.color;
      }
    }

    // PREMIUM-EXPORT-OVERHAUL-01: award medal decoration on closing pages.
    if (page.role === 'closing') {
      var medal = document.createElement('div');
      medal.className = 'silse-award-medal';
      medal.setAttribute('aria-hidden', 'true');
      medal.innerHTML = '<div class="silse-award-shine"></div><div class="silse-award-glow"></div><div class="silse-award-medal-inner">🏆</div>';
      canvas.appendChild(medal);

      var ribbon = document.createElement('div');
      ribbon.className = 'silse-award-ribbon';
      ribbon.setAttribute('aria-hidden', 'true');
      ribbon.textContent = '✨ Penjelajah Selesai ✨';
      canvas.appendChild(ribbon);
    }

    // PREMIUM-EXPORT-OVERHAUL-01: hero card frame + kicker pill + CTA on cover pages.
    if (page.role === 'cover') {
      var heroCard = document.createElement('div');
      heroCard.className = 'silse-hero-card';
      heroCard.setAttribute('aria-hidden', 'true');
      canvas.appendChild(heroCard);

      var kickerText = MODEL.curriculumSubject || page.title || '';
      if (MODEL.curriculumGrade) kickerText = kickerText + ' · Kelas ' + MODEL.curriculumGrade;
      if (kickerText) {
        var heroKicker = document.createElement('div');
        heroKicker.className = 'silse-hero-kicker';
        heroKicker.textContent = kickerText;
        canvas.appendChild(heroKicker);
      }

      var ctaBtn = document.createElement('button');
      ctaBtn.className = 'silse-hero-cta';
      ctaBtn.type = 'button';
      ctaBtn.textContent = 'Mulai Pembelajaran →';
      ctaBtn.setAttribute('aria-label', 'Mulai pembelajaran, pergi ke halaman berikutnya');
      ctaBtn.addEventListener('click', function() { navigate('next'); });
      canvas.appendChild(ctaBtn);
    }

    // FOUNDATION-INTEGRATION-01: jika page punya scenePlan, render via scene renderer.
    // Jalur lama tetap fallback untuk page tanpa scenePlan.
    if (page.scenePlan) {
      var sceneEl = renderSceneFromPlan(page.scenePlan);
      if (sceneEl) canvas.appendChild(sceneEl);
    } else {
      // Render components — style from resolvedStyle, NO switch (legacy path)
      for (var i = 0; i < page.components.length; i++) {
        var comp = page.components[i];
        var el = renderComponent(comp);
        if (el) canvas.appendChild(el);
      }
    }

    prevBtn.disabled = (currentPageIdx === 0);
    nextBtn.disabled = (currentPageIdx === pages.length - 1);
    pageInfo.textContent = (currentPageIdx + 1) + ' / ' + pages.length + ' - ' + page.title;
  }

  // FOUNDATION-INTEGRATION-01 + DESIGN-CONTRACT-RENDER-PARITY-01 + PATCH B:
  // render scene dari SceneRenderPlan (bukan flat components[]).
  // PATCH B: Route by plan.sceneType first, then fall through to content.kind for generic slots.
  function renderSceneFromPlan(plan) {
    // PATCH B: Check sceneType for scene-level composers
    var sceneTypeRenderers = {
      'curriculum-guide': function(p) { return p.slots[0] ? renderCurriculumGuideExport(p.slots[0], p.slots[0].content, p) : null; },
      'objectives-path': function(p) { return p.slots[0] ? renderObjectivesPathExport(p.slots[0], p.slots[0].content, p) : null; },
      'starter-review': function(p) { return p.slots[0] ? renderStarterReviewExport(p.slots[0], p.slots[0].content, p) : null; },
      'discussion-scene': function(p) { return p.slots[0] ? renderDiscussionSceneExport(p.slots[0], p.slots[0].content, p) : null; },
      'case-analysis': function(p) { return p.slots[0] ? renderCaseAnalysisExport(p.slots[0], p.slots[0].content, p) : null; },
      'result-summary': function(p) { return p.slots[0] ? renderResultSummaryExport(p.slots[0], p.slots[0].content, p) : null; },
      'reflection-journal': function(p) { return p.slots[0] ? renderReflectionJournalExport(p.slots[0], p.slots[0].content, p) : null; },
      'classification-game': function(p) { return p.slots[0] ? renderClassificationGameExport(p.slots[0], p.slots[0].content, p) : null; },
    };
    if (sceneTypeRenderers[plan.sceneType]) {
      var renderedEl = sceneTypeRenderers[plan.sceneType](plan);
      if (renderedEl) return renderedEl;
    }

    // Fall through to slot-by-slot rendering for generic scenes
    var sceneEl = document.createElement('div');
    sceneEl.className = plan.sceneClass;
    sceneEl.setAttribute('data-scene-id', plan.sceneId);
    sceneEl.setAttribute('data-scene-type', plan.sceneType);
    var sceneBg = (plan.background && plan.background.gradient) ? plan.background.gradient : (plan.background ? plan.background.color : '#ffffff');
    sceneEl.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;z-index:2;background:' + sceneBg + ';';

    for (var si = 0; si < plan.slots.length; si++) {
      var slot = plan.slots[si];
      var slotEl = document.createElement('div');
      slotEl.className = slot.slotClass;
      slotEl.setAttribute('data-slot-id', slot.id);
      slotEl.setAttribute('data-slot-role', slot.role);
      slotEl.style.cssText = 'position:absolute;left:' + slot.placement.x + 'px;top:' + slot.placement.y + 'px;width:' + slot.placement.width + 'px;height:' + slot.placement.height + 'px;z-index:' + (slot.placement.zIndex || 1) + ';';
      sceneEl.appendChild(slotEl);

      // Render content based on kind (generic content only — scene composers handled above)
      var content = slot.content;
      var contentEl = renderSceneContent(slot, content, plan);
      if (contentEl) slotEl.appendChild(contentEl);
    }

    return sceneEl;
  }

  function renderSceneContent(slot, content, plan) {
    if (!content) return null;
    var rs = slot.resolvedStyle || {};

    if (content.kind === 'text') {
      // DESIGN-CONTRACT-RENDER-PARITY-01: typography from resolvedStyle
      var tEl = document.createElement('div');
      tEl.className = slot.contentClass;
      var ty = rs.typography || {};
      var tCss = 'width:100%;height:100%;display:flex;align-items:center;padding:8px;box-sizing:border-box;';
      if (ty.fontFamily) tCss += 'font-family:' + ty.fontFamily + ';';
      if (ty.fontSize) tCss += 'font-size:' + ty.fontSize + 'px;';
      if (ty.fontWeight) tCss += 'font-weight:' + ty.fontWeight + ';';
      if (ty.color) tCss += 'color:' + ty.color + ';';
      if (ty.lineHeight) tCss += 'line-height:' + ty.lineHeight + ';';
      if (ty.letterSpacing) tCss += 'letter-spacing:' + ty.letterSpacing + 'em;';
      if (ty.uppercase) tCss += 'text-transform:uppercase;';
      tEl.style.cssText = tCss;
      tEl.textContent = content.text || '';
      return tEl;
    }

    if (content.kind === 'card') {
      // DESIGN-CONTRACT-RENDER-PARITY-01: card visual from resolvedStyle.surface
      var cEl = document.createElement('div');
      cEl.className = slot.contentClass;
      var surf = rs.surface || {};
      var cCss = 'width:100%;height:100%;box-sizing:border-box;';
      cCss += 'padding:' + (surf.padding != null ? surf.padding : 16) + 'px;';
      cCss += 'border-radius:' + (surf.radius != null ? surf.radius : 12) + 'px;';
      cCss += 'background:' + (surf.background || '#fff') + ';';
      cCss += 'border:' + (surf.border || '1px solid #e5e7eb') + ';';
      if (surf.shadow) cCss += 'box-shadow:' + surf.shadow + ';';
      cEl.style.cssText = cCss;
      if (content.title) {
        var cTitle = document.createElement('strong');
        cTitle.style.cssText = 'display:block;font-size:18px;margin-bottom:6px;';
        cTitle.textContent = content.title;
        cEl.appendChild(cTitle);
      }
      var cBody = document.createElement('div');
      cBody.style.cssText = 'font-size:14px;line-height:1.5;';
      cBody.textContent = content.body || '';
      cEl.appendChild(cBody);
      return cEl;
    }

    if (content.kind === 'button') {
      // DESIGN-CONTRACT-RENDER-PARITY-01: button visual from resolvedStyle.button
      var bEl = document.createElement('button');
      bEl.className = slot.contentClass;
      var btn = rs.button || {};
      var bCss = 'width:100%;height:100%;border:0;cursor:pointer;';
      bCss += 'border-radius:' + (btn.radius != null ? btn.radius : 8) + 'px;';
      bCss += 'background:' + (btn.background || '#1d3557') + ';';
      bCss += 'color:' + (btn.color || '#fff') + ';';
      bCss += 'font-weight:' + (btn.fontWeight || 600) + ';';
      if (btn.padding) {
        bCss += 'padding:' + (btn.padding.top || 0) + 'px ' + (btn.padding.right || 0) + 'px ' + (btn.padding.bottom || 0) + 'px ' + (btn.padding.left || 0) + 'px;';
      }
      bEl.style.cssText = bCss;
      bEl.textContent = content.label || '';
      return bEl;
    }

    if (content.kind === 'game-mission') {
      return renderGameMissionSceneContent(slot, content);
    }

    if (content.kind === 'quiz-question') {
      return renderQuizSceneContent(slot, content);
    }

    if (content.kind === 'learning-material') {
      return renderLearningMaterialSceneContent(slot, content, plan);
    }

    if (content.kind === 'cover-hero') {
      return renderCoverHeroSceneContent(slot, content, plan);
    }

    if (content.kind === 'closing-award') {
      return renderClosingAwardSceneContent(slot, content, plan);
    }

    // CORE-MPI-UX-FOUNDATION-01: image content kind rendering
    if (content.kind === 'image') {
      var imgWrap = document.createElement('div');
      imgWrap.className = 'silse-block-media ' + (slot.contentClass || '');
      imgWrap.style.cssText = 'width:100%;height:100%;border-radius:12px;overflow:hidden;border:1px solid ' + (plan.palette ? plan.palette.border : '#e5e7eb') + ';background:' + (plan.palette ? plan.palette.surface : '#f8fafc') + ';';
      if (content.src) {
        var imgEl = document.createElement('img');
        imgEl.src = content.src;
        imgEl.alt = content.alt || '';
        imgEl.style.cssText = 'width:100%;height:100%;object-fit:' + (content.objectFit || 'cover') + ';display:block;';
        imgWrap.appendChild(imgEl);
      } else {
        var fallback = document.createElement('div');
        fallback.style.cssText = 'width:100%;height:100%;min-height:120px;display:grid;place-items:center;color:' + (plan.palette ? plan.palette.mutedText : '#6b7280') + ';font-size:13px;font-style:italic;';
        fallback.textContent = '📷 Media tidak tersedia';
        imgWrap.appendChild(fallback);
      }
      return imgWrap;
    }

    // PATCH B: 7 new scene composers are now routed by sceneType in renderSceneFromPlan(),
    // NOT by content.kind here. Content.kind is only for generic slot content.

    if (content.kind === 'reward') {
      // DESIGN-CONTRACT-RENDER-PARITY-01: reward visual from resolvedStyle.reward
      var rEl = document.createElement('div');
      rEl.className = slot.contentClass;
      var rw = rs.reward || {};
      var rCss = 'padding:16px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:4px;';
      rCss += 'border-radius:' + (rw.radius != null ? rw.radius : 12) + 'px;';
      rCss += 'background:' + (rw.background || '#fffbeb') + ';';
      rCss += 'border:2px solid ' + (rw.borderColor || '#fbbf24') + ';';
      rEl.style.cssText = rCss;
      if (content.icon) {
        var rIcon = document.createElement('div');
        rIcon.style.fontSize = '48px';
        rIcon.textContent = content.icon;
        rEl.appendChild(rIcon);
      }
      var rLabel = document.createElement('strong');
      rLabel.style.fontSize = '18px';
      rLabel.textContent = content.label || '';
      rEl.appendChild(rLabel);
      return rEl;
    }

    if (content.kind === 'feedback') {
      // DESIGN-CONTRACT-RENDER-PARITY-01: feedback visual from resolvedStyle.feedback
      var fEl = document.createElement('div');
      fEl.className = slot.contentClass;
      var fb = rs.feedback || {};
      var fCss = 'padding:12px;border-radius:10px;';
      fCss += 'background:' + (fb.background || '#f3f4f6') + ';';
      if (fb.color) fCss += 'color:' + fb.color + ';';
      fCss += 'border-left:4px solid ' + (fb.borderColor || '#d1d5db') + ';';
      fEl.style.cssText = fCss;
      fEl.textContent = content.text || '';
      return fEl;
    }

    // Fallback
    var fallback = document.createElement('div');
    fallback.className = slot.contentClass;
    fallback.textContent = '[' + content.kind + ']';
    return fallback;
  }

  // game-mission scene content untuk export (interactive: click actions)
  // DESIGN-CONTRACT-RENDER-PARITY-01: briefing/target card style from resolvedStyle
  function renderGameMissionSceneContent(slot, content) {
    var wrapper = document.createElement('div');
    wrapper.className = 'silse-game-scene';
    wrapper.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;gap:10px;padding:16px;box-sizing:border-box;overflow:auto;';

    var rs = slot.resolvedStyle || {};
    var surf = rs.surface || {};

    // Briefing — uses resolvedStyle.surface (from contract.game.briefingPanel)
    var briefing = document.createElement('div');
    briefing.className = 'silse-game-briefing';
    var briefingCss = 'padding:' + (surf.padding != null ? surf.padding : 12) + 'px;';
    briefingCss += 'border-radius:' + (surf.radius != null ? surf.radius : 10) + 'px;';
    briefingCss += 'background:' + (surf.background || '#fffbeb') + ';';
    briefingCss += 'border:' + (surf.border || '1px solid #fde68a') + ';';
    briefing.style.cssText = briefingCss;
    var briefingLabel = document.createElement('div');
    briefingLabel.style.cssText = 'font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;margin-bottom:4px;';
    briefingLabel.textContent = '📋 Briefing Misi';
    briefing.appendChild(briefingLabel);
    var briefingText = document.createElement('div');
    briefingText.style.cssText = 'font-size:15px;font-weight:600;';
    briefingText.textContent = content.briefing || '';
    briefing.appendChild(briefingText);
    wrapper.appendChild(briefing);

    // Target
    var target = document.createElement('div');
    target.className = 'silse-game-target';
    target.style.cssText = 'padding:12px;border-radius:10px;background:#eff6ff;border:1px solid #bfdbfe;';
    var targetLabel = document.createElement('div');
    targetLabel.style.cssText = 'font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;margin-bottom:4px;';
    targetLabel.textContent = '🎯 Target Misi';
    target.appendChild(targetLabel);
    var targetText = document.createElement('div');
    targetText.style.cssText = 'font-size:14px;';
    targetText.textContent = content.missionTarget || '';
    target.appendChild(targetText);
    wrapper.appendChild(target);

    // Action grid
    var actionGrid = document.createElement('div');
    actionGrid.className = 'silse-game-action-grid';
    actionGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill, minmax(220px, 1fr));gap:10px;';
    for (var ai = 0; ai < content.actions.length; ai++) {
      (function(actionIdx, action) {
        var card = document.createElement('div');
        card.className = 'silse-game-action-card';
        card.setAttribute('data-action-index', String(actionIdx));
        card.style.cssText = 'padding:14px;border-radius:12px;background:#fff;border:2px solid #d1d5db;cursor:pointer;font-size:14px;font-weight:600;min-height:80px;display:flex;flex-direction:column;gap:6px;';
        var cardHeader = document.createElement('div');
        cardHeader.style.cssText = 'display:flex;align-items:center;gap:8px;';
        var letterBadge = document.createElement('span');
        letterBadge.style.cssText = 'display:inline-grid;place-items:center;min-width:28px;height:28px;border-radius:8px;background:#1d3557;color:#fff;font-size:13px;font-weight:900;';
        letterBadge.textContent = String.fromCharCode(65 + actionIdx);
        cardHeader.appendChild(letterBadge);
        var actionLabel = document.createElement('span');
        actionLabel.style.cssText = 'font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;';
        actionLabel.textContent = 'Aksi';
        cardHeader.appendChild(actionLabel);
        card.appendChild(cardHeader);
        var actionText = document.createElement('span');
        actionText.textContent = action.label;
        card.appendChild(actionText);
        actionGrid.appendChild(card);
      })(ai, content.actions[ai]);
    }
    wrapper.appendChild(actionGrid);

    // Reward preview
    var reward = document.createElement('div');
    reward.className = 'silse-game-reward';
    reward.style.cssText = 'padding:12px;border-radius:10px;background:#fffbeb;border:2px solid #fbbf24;display:flex;align-items:center;gap:12px;';
    var rewardIcon = document.createElement('span');
    rewardIcon.style.fontSize = '24px';
    rewardIcon.textContent = content.reward.icon || '🏅';
    reward.appendChild(rewardIcon);
    var rewardText = document.createElement('div');
    var rewardTextLabel = document.createElement('div');
    rewardTextLabel.style.cssText = 'font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;';
    rewardTextLabel.textContent = 'Reward';
    rewardText.appendChild(rewardTextLabel);
    var rewardTextValue = document.createElement('strong');
    rewardTextValue.style.cssText = 'font-size:14px;';
    rewardTextValue.textContent = content.reward.label || '';
    rewardText.appendChild(rewardTextValue);
    reward.appendChild(rewardText);
    wrapper.appendChild(reward);

    return wrapper;
  }

  // QUIZ-SCENE-PROOF-01: quiz-question challenge scene content untuk export.
  // Render: challenge header → question focus panel → answer grid → feedback → progress.
  // Visual dari resolvedStyle (design contract), bukan hardcoded CSS.
  function renderQuizSceneContent(slot, content) {
    var rs = slot.resolvedStyle || {};
    var ansCard = rs.quizAnswerCard || {};
    var badge = rs.quizChoiceBadge || {};
    var panel = rs.quizQuestionPanel || {};

    var wrapper = document.createElement('div');
    wrapper.className = 'silse-quiz-scene';
    wrapper.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;gap:10px;padding:16px;box-sizing:border-box;overflow:auto;';

    // Challenge header
    var header = document.createElement('div');
    header.className = 'silse-quiz-header';
    header.style.cssText = 'font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;';
    header.textContent = '🎯 Challenge — Pilih jawaban yang tepat';
    wrapper.appendChild(header);

    // Question focus panel
    var prompt = document.createElement('div');
    prompt.className = 'silse-quiz-question-focus';
    var promptCss = 'font-size:17px;font-weight:600;';
    promptCss += 'padding:' + (panel.padding != null ? panel.padding : 16) + 'px;';
    promptCss += 'border-radius:' + (panel.radius != null ? panel.radius : 12) + 'px;';
    promptCss += 'background:' + (panel.background || '#f8fafc') + ';';
    prompt.style.cssText = promptCss;
    prompt.textContent = content.prompt || '';
    wrapper.appendChild(prompt);

    // Answer grid
    var answerGrid = document.createElement('div');
    answerGrid.className = 'silse-quiz-answer-grid';
    answerGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill, minmax(240px, 1fr));gap:10px;';
    for (var ci = 0; ci < content.choices.length; ci++) {
      (function(choiceIdx, choice) {
        var card = document.createElement('div');
        card.className = 'silse-quiz-answer-card';
        card.setAttribute('data-choice-id', choice.id);
        var cardCss = 'padding:' + (ansCard.padding != null ? ansCard.padding : 14) + 'px;';
        cardCss += 'border-radius:' + (ansCard.radius != null ? ansCard.radius : 12) + 'px;';
        cardCss += 'background:' + (ansCard.background || '#fff') + ';';
        cardCss += 'border:2px solid ' + (ansCard.border || '#d1d5db') + ';';
        cardCss += 'cursor:pointer;font-size:14px;font-weight:600;min-height:60px;display:flex;align-items:center;gap:12px;';
        card.style.cssText = cardCss;

        // Choice letter badge
        var letterBadge = document.createElement('span');
        letterBadge.className = 'silse-quiz-choice-badge';
        letterBadge.style.cssText = 'display:inline-grid;place-items:center;min-width:32px;height:32px;border-radius:' + (badge.radius != null ? badge.radius : 8) + 'px;background:' + (badge.background || '#1d3557') + ';color:' + (badge.color || '#fff') + ';font-size:14px;font-weight:900;flex-shrink:0;';
        letterBadge.textContent = String.fromCharCode(65 + choiceIdx);
        card.appendChild(letterBadge);

        var choiceText = document.createElement('span');
        choiceText.textContent = choice.text;
        card.appendChild(choiceText);
        answerGrid.appendChild(card);
      })(ci, content.choices[ci]);
    }
    wrapper.appendChild(answerGrid);

    // Feedback placeholder
    var feedback = document.createElement('div');
    feedback.className = 'silse-quiz-feedback';
    feedback.style.cssText = 'display:none;';
    wrapper.appendChild(feedback);

    // Progress indicator
    var progress = document.createElement('div');
    progress.className = 'silse-quiz-progress';
    progress.style.cssText = 'font-size:12px;font-weight:700;margin-top:auto;';
    progress.textContent = content.choices.length + ' pilihan · Correct: ' + (content.correctChoiceId || '');
    wrapper.appendChild(progress);

    return wrapper;
  }

  // MATERIAL-SCENE-PROOF-01: learning-material scene content untuk export.
  // Render: concept header → explanation panel → example cards → key point → student action → visual hint.
  // Visual dari resolvedStyle (design contract) + plan (palette/typography).
  function renderLearningMaterialSceneContent(slot, content, plan) {
    var rs = slot.resolvedStyle || {};
    var surf = rs.surface || {};
    var palette = plan.palette || {};
    var ty = plan.typography || {};

    var wrapper = document.createElement('div');
    wrapper.className = 'silse-learning-scene';
    wrapper.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;gap:12px;padding:16px;box-sizing:border-box;overflow:auto;';

    // Concept header
    var header = document.createElement('div');
    header.className = 'silse-learning-header';
    var headerCss = 'font-size:' + ty.titleSize + 'px;font-weight:' + ty.titleWeight + ';font-family:' + ty.heroFont + ';color:' + palette.text + ';line-height:' + ty.lineHeight + ';';
    header.style.cssText = headerCss;
    header.textContent = content.conceptTitle || '';
    wrapper.appendChild(header);

    if (content.conceptSubtitle) {
      var subtitle = document.createElement('div');
      subtitle.style.cssText = 'font-size:20px;color:' + palette.mutedText + ';margin-top:-8px;';
      subtitle.textContent = content.conceptSubtitle;
      wrapper.appendChild(subtitle);
    }

    // Explanation panel
    var explanation = document.createElement('div');
    explanation.className = 'silse-learning-explanation';
    var expCss = 'padding:' + (surf.padding != null ? surf.padding : 16) + 'px;';
    expCss += 'border-radius:' + (surf.radius != null ? surf.radius : 12) + 'px;';
    expCss += 'background:' + (surf.background || palette.surface) + ';';
    expCss += 'border:' + (surf.border || '1px solid #e5e7eb') + ';';
    expCss += 'font-size:' + ty.bodySize + 'px;line-height:' + ty.lineHeight + ';color:' + palette.text + ';';
    if (surf.shadow) expCss += 'box-shadow:' + surf.shadow + ';';
    explanation.style.cssText = expCss;
    explanation.textContent = content.explanation || '';
    wrapper.appendChild(explanation);

    // Example cards
    if (content.examples && content.examples.length > 0) {
      var exampleGrid = document.createElement('div');
      exampleGrid.className = 'silse-learning-example-grid';
      exampleGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:10px;';
      for (var ei = 0; ei < content.examples.length; ei++) {
        (function(ex) {
          var card = document.createElement('div');
          card.className = 'silse-learning-example-card';
          var cardCss = 'padding:' + (surf.padding != null ? surf.padding : 16) + 'px;';
          cardCss += 'border-radius:' + (surf.radius != null ? surf.radius : 12) + 'px;';
          cardCss += 'background:' + palette.surface + ';';
          cardCss += 'border:' + (surf.border || '1px solid #e5e7eb') + ';';
          card.style.cssText = cardCss;
          var cardTitle = document.createElement('strong');
          cardTitle.style.cssText = 'display:block;font-size:15px;margin-bottom:4px;color:' + palette.primary + ';';
          cardTitle.textContent = ex.title;
          card.appendChild(cardTitle);
          var cardBody = document.createElement('div');
          cardBody.style.cssText = 'font-size:13px;line-height:1.5;color:' + palette.text + ';';
          cardBody.textContent = ex.body;
          card.appendChild(cardBody);
          exampleGrid.appendChild(card);
        })(content.examples[ei]);
      }
      wrapper.appendChild(exampleGrid);
    }

    // FOUNDATION-HARDENING-01: Key point — visual dari plan.learning.keyPointPanel (contract token)
    if (content.keyPoints && content.keyPoints.length > 0) {
      var kp = plan.learning.keyPointPanel;
      var keyPoint = document.createElement('div');
      keyPoint.className = 'silse-learning-key-point';
      keyPoint.style.cssText = 'padding:' + kp.padding + 'px;border-radius:' + kp.radius + 'px;background:' + kp.background + ';border:' + kp.border + ';border-left:4px solid ' + kp.accentColor + ';';
      var kpLabel = document.createElement('div');
      kpLabel.style.cssText = 'font-size:11px;font-weight:700;color:' + kp.iconColor + ';text-transform:uppercase;margin-bottom:6px;';
      kpLabel.textContent = kp.icon + ' Key Points';
      keyPoint.appendChild(kpLabel);
      var ul = document.createElement('ul');
      ul.style.cssText = 'margin:0;padding-left:20px;font-size:14px;line-height:1.6;';
      for (var ki = 0; ki < content.keyPoints.length; ki++) {
        var li = document.createElement('li');
        li.style.color = palette.text;
        li.textContent = content.keyPoints[ki];
        ul.appendChild(li);
      }
      keyPoint.appendChild(ul);
      wrapper.appendChild(keyPoint);
    }

    // FOUNDATION-HARDENING-01: Student action — visual dari plan.learning.studentActionPanel (contract token)
    if (content.studentAction) {
      var sa = plan.learning.studentActionPanel;
      var action = document.createElement('div');
      action.className = 'silse-learning-student-action';
      action.style.cssText = 'padding:' + sa.padding + 'px;border-radius:' + sa.radius + 'px;background:' + sa.background + ';border:' + sa.border + ';display:flex;align-items:center;gap:10px;';
      var actionIcon = document.createElement('span');
      actionIcon.style.fontSize = '20px';
      actionIcon.textContent = sa.icon;
      action.appendChild(actionIcon);
      var actionText = document.createElement('div');
      var actionLabel = document.createElement('div');
      actionLabel.style.cssText = 'font-size:11px;font-weight:700;color:' + sa.labelColor + ';text-transform:uppercase;';
      actionLabel.textContent = 'Student Action';
      actionText.appendChild(actionLabel);
      var actionBody = document.createElement('div');
      actionBody.style.cssText = 'font-size:14px;font-weight:600;color:' + palette.text + ';';
      actionBody.textContent = content.studentAction;
      actionText.appendChild(actionBody);
      action.appendChild(actionText);
      wrapper.appendChild(action);
    }

    // FOUNDATION-HARDENING-01: Visual hint — visual dari plan.learning.visualHintPanel (contract token)
    if (content.visualHint) {
      var vh = plan.learning.visualHintPanel;
      var hint = document.createElement('div');
      hint.className = 'silse-learning-visual-hint';
      hint.style.cssText = 'padding:8px;border-radius:8px;background:transparent;font-size:12px;color:' + vh.color + ';font-style:' + vh.fontStyle + ';text-align:center;';
      hint.textContent = vh.icon + ' ' + content.visualHint;
      wrapper.appendChild(hint);
    }

    return wrapper;
  }

  // FOUNDATION-FINAL-LOCK-01: cover-hero scene content untuk export.
  function renderCoverHeroSceneContent(slot, content, plan) {
    var rs = slot.resolvedStyle || {};
    var ty = rs.typography || {};
    var btn = rs.button || {};
    var palette = plan.palette || {};
    var wrapper = document.createElement('div');
    wrapper.className = 'silse-cover-scene';
    wrapper.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:32px;box-sizing:border-box;';

    if (content.kicker) {
      var kicker = document.createElement('div');
      kicker.className = 'silse-cover-kicker';
      kicker.style.cssText = 'display:inline-flex;align-items:center;padding:7px 16px;border-radius:999px;background:' + palette.gold + ';color:' + palette.primary + ';font-size:13px;font-weight:900;text-transform:uppercase;';
      kicker.textContent = content.kicker;
      wrapper.appendChild(kicker);
    }
    var title = document.createElement('div');
    title.className = 'silse-cover-title';
    var titleCss = 'text-align:center;';
    if (ty.fontFamily) titleCss += 'font-family:' + ty.fontFamily + ';';
    if (ty.fontSize) titleCss += 'font-size:' + ty.fontSize + 'px;';
    if (ty.fontWeight) titleCss += 'font-weight:' + ty.fontWeight + ';';
    if (ty.color) titleCss += 'color:' + ty.color + ';';
    if (ty.uppercase) titleCss += 'text-transform:uppercase;';
    title.style.cssText = titleCss;
    title.textContent = content.heroTitle || '';
    wrapper.appendChild(title);

    if (content.heroSubtitle) {
      var subtitle = document.createElement('div');
      subtitle.className = 'silse-cover-subtitle';
      subtitle.style.cssText = 'font-size:20px;color:' + palette.mutedText + ';text-align:center;';
      subtitle.textContent = content.heroSubtitle;
      wrapper.appendChild(subtitle);
    }
    if (content.badges && content.badges.length > 0) {
      for (var bi = 0; bi < content.badges.length; bi++) {
        var badge = document.createElement('span');
        badge.className = 'silse-cover-badge';
        badge.style.cssText = 'display:inline-flex;padding:4px 12px;border-radius:999px;background:' + palette.surface + ';color:' + palette.primary + ';font-size:12px;font-weight:700;border:1px solid ' + palette.border + ';';
        badge.textContent = content.badges[bi];
        wrapper.appendChild(badge);
      }
    }
    if (content.primaryAction) {
      var pa = document.createElement('button');
      pa.className = 'silse-cover-primary-action';
      pa.style.cssText = 'padding:' + (btn.padding ? (btn.padding.top || 10) : 10) + 'px ' + (btn.padding ? (btn.padding.right || 20) : 20) + 'px;border-radius:' + (btn.radius || 8) + 'px;background:' + (btn.background || palette.primary) + ';color:' + (btn.color || '#fff') + ';border:0;font-weight:' + (btn.fontWeight || 600) + ';font-size:16px;cursor:pointer;margin-top:8px;';
      pa.textContent = content.primaryAction.label;
      wrapper.appendChild(pa);
    }
    if (content.visualAnchor) {
      var va = document.createElement('div');
      va.className = 'silse-cover-visual-anchor';
      va.style.cssText = 'font-size:14px;color:' + palette.mutedText + ';font-style:italic;margin-top:8px;';
      va.textContent = content.visualAnchor;
      wrapper.appendChild(va);
    }
    return wrapper;
  }

  // FOUNDATION-FINAL-LOCK-01: closing-award scene content untuk export.
  function renderClosingAwardSceneContent(slot, content, plan) {
    var rs = slot.resolvedStyle || {};
    var surf = rs.surface || {};
    var rw = rs.reward || {};
    var btn = rs.button || {};
    var palette = plan.palette || {};
    var ty = plan.typography || {};
    var wrapper = document.createElement('div');
    wrapper.className = 'silse-closing-scene';
    wrapper.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:32px;box-sizing:border-box;';

    if (content.achievement) {
      var ach = document.createElement('div');
      ach.className = 'silse-closing-achievement';
      ach.style.cssText = 'font-family:' + ty.heroFont + ';font-size:' + ty.titleSize + 'px;font-weight:' + ty.titleWeight + ';color:' + palette.text + ';text-align:center;';
      ach.textContent = content.achievement;
      wrapper.appendChild(ach);
    }
    if (content.summary) {
      var sum = document.createElement('div');
      sum.className = 'silse-closing-summary';
      sum.style.cssText = 'font-size:18px;color:' + palette.mutedText + ';text-align:center;max-width:800px;';
      sum.textContent = content.summary;
      wrapper.appendChild(sum);
    }
    if (content.rewardLabel || content.rewardIcon) {
      var reward = document.createElement('div');
      reward.className = 'silse-closing-reward';
      reward.style.cssText = 'padding:20px;border-radius:' + (rw.radius || 12) + 'px;background:' + (rw.background || '#fffbeb') + ';border:2px solid ' + (rw.borderColor || '#fbbf24') + ';display:flex;flex-direction:column;align-items:center;gap:8px;';
      if (content.rewardIcon) {
        var ri = document.createElement('div');
        ri.style.fontSize = '64px';
        ri.textContent = content.rewardIcon;
        reward.appendChild(ri);
      }
      if (content.rewardLabel) {
        var rl = document.createElement('strong');
        rl.style.cssText = 'font-size:20px;color:' + palette.text + ';';
        rl.textContent = content.rewardLabel;
        reward.appendChild(rl);
      }
      wrapper.appendChild(reward);
    }
    if (content.reflectionPrompt) {
      var refl = document.createElement('div');
      refl.className = 'silse-closing-reflection';
      refl.style.cssText = 'padding:' + (surf.padding || 16) + 'px;border-radius:' + (surf.radius || 12) + 'px;background:' + (surf.background || palette.surface) + ';border:' + (surf.border || '1px solid #e5e7eb') + ';max-width:600px;text-align:center;';
      var reflLabel = document.createElement('div');
      reflLabel.style.cssText = 'font-size:11px;font-weight:700;color:' + palette.mutedText + ';text-transform:uppercase;margin-bottom:6px;';
      reflLabel.textContent = 'Refleksi';
      refl.appendChild(reflLabel);
      var reflText = document.createElement('div');
      reflText.style.cssText = 'font-size:15px;color:' + palette.text + ';';
      reflText.textContent = content.reflectionPrompt;
      refl.appendChild(reflText);
      wrapper.appendChild(refl);
    }
    if (content.nextLearning) {
      var nl = document.createElement('div');
      nl.className = 'silse-closing-next-learning';
      nl.style.cssText = 'font-size:13px;color:' + palette.mutedText + ';';
      nl.textContent = content.nextLearning;
      wrapper.appendChild(nl);
    }
    if (content.finalAction) {
      var fa = document.createElement('button');
      fa.className = 'silse-closing-final-action';
      fa.style.cssText = 'padding:' + (btn.padding ? (btn.padding.top || 10) : 10) + 'px ' + (btn.padding ? (btn.padding.right || 20) : 20) + 'px;border-radius:' + (btn.radius || 8) + 'px;background:' + (btn.background || palette.primary) + ';color:' + (btn.color || '#fff') + ';border:0;font-weight:' + (btn.fontWeight || 600) + ';font-size:16px;cursor:pointer;margin-top:8px;';
      fa.textContent = content.finalAction.label;
      wrapper.appendChild(fa);
    }
    return wrapper;
  }

  // ===========================================================================
  // GOLDEN-REFERENCE-RENDER-P1 PATCH A: Reusable Export Block Helpers
  // All helpers take plan (for palette/typography tokens) — no hardcoded colors.
  // ===========================================================================

  function exportShell(plan, className, children) {
    var p = plan.palette || {};
    var ty = plan.typography || {};
    var el = document.createElement('div');
    el.className = 'silse-block-shell ' + (className || '');
    el.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;gap:14px;padding:22px;box-sizing:border-box;overflow:auto;background:' + p.background + ';color:' + p.text + ';font-family:' + (ty.bodyFont || 'sans-serif') + ';';
    for (var i = 0; i < children.length; i++) { if (children[i]) el.appendChild(children[i]); }
    return el;
  }

  function exportHeader(plan, chipLabel, chipColor, title, subtitle) {
    var p = plan.palette || {}; var ty = plan.typography || {};
    var el = document.createElement('div');
    el.className = 'silse-block-header';
    if (chipLabel) {
      var chip = document.createElement('div');
      chip.className = 'silse-block-chip';
      chip.style.cssText = 'display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:999px;background:' + (chipColor ? chipColor + '22' : (p.gold ? p.gold + '22' : 'rgba(255,255,255,0.1)')) + ';color:' + (chipColor || p.gold || '#fff') + ';font-size:12px;font-weight:800;margin-bottom:10px;';
      chip.textContent = chipLabel;
      el.appendChild(chip);
    }
    var t = document.createElement('div');
    t.style.cssText = 'font-family:' + (ty.heroFont || 'sans-serif') + ';font-size:' + ty.titleSize + 'px;font-weight:' + ty.titleWeight + ';color:' + p.text + ';line-height:1.2;';
    t.textContent = title || '';
    el.appendChild(t);
    if (subtitle) {
      var s = document.createElement('div');
      s.style.cssText = 'font-size:14px;color:' + p.mutedText + ';line-height:1.6;margin-top:4px;';
      s.textContent = subtitle;
      el.appendChild(s);
    }
    return el;
  }

  function exportPanel(plan, title, body, className) {
    var p = plan.palette || {};
    var el = document.createElement('div');
    el.className = 'silse-block-panel ' + (className || '');
    el.style.cssText = 'background:' + (p.surface || '#182d45') + ';border:1px solid ' + (p.border || 'rgba(255,255,255,0.09)') + ';border-radius:16px;padding:20px;';
    if (title) {
      var t = document.createElement('div');
      t.style.cssText = 'font-weight:800;font-size:14px;margin-bottom:8px;color:' + p.text + ';';
      t.textContent = title;
      el.appendChild(t);
    }
    if (body) {
      var b = document.createElement('div');
      b.style.cssText = 'font-size:14px;line-height:1.7;color:' + p.text + ';';
      b.textContent = body;
      el.appendChild(b);
    }
    return el;
  }

  function exportDiscussionBanner(plan, label, title, body, accentColor) {
    var p = plan.palette || {};
    var ac = accentColor || p.success || '#34d399';
    var el = document.createElement('div');
    el.className = 'silse-block-discussion';
    el.style.cssText = 'border-radius:13px;padding:13px 15px;display:flex;gap:12px;align-items:flex-start;background:' + ac + '11;border:1px solid ' + ac + '40;';
    var text = document.createElement('div');
    var l = document.createElement('div');
    l.style.cssText = 'font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;color:' + ac + ';';
    l.textContent = label;
    text.appendChild(l);
    var t = document.createElement('div');
    t.style.cssText = 'font-weight:800;font-size:14px;margin-bottom:4px;color:' + p.text + ';';
    t.textContent = title;
    text.appendChild(t);
    var b = document.createElement('div');
    b.style.cssText = 'font-size:13px;color:' + p.mutedText + ';line-height:1.6;';
    b.textContent = body;
    text.appendChild(b);
    el.appendChild(text);
    return el;
  }

  function exportTimerBlock(plan) {
    var p = plan.palette || {};
    var el = document.createElement('div');
    el.className = 'silse-block-timer';
    el.setAttribute('data-running', 'false');
    el.setAttribute('data-remaining', '300');
    el.style.cssText = 'display:flex;align-items:center;gap:10px;background:' + (p.gold || '#f9c12e') + '14;border:1px solid ' + (p.gold || '#f9c12e') + '33;border-radius:10px;padding:8px 14px;';
    var time = document.createElement('span');
    time.className = 'silse-timer-display';
    time.style.cssText = 'font-size:20px;color:' + (p.gold || '#f9c12e') + ';min-width:42px;font-weight:800;';
    time.textContent = '5:00';
    el.appendChild(time);
    var bar = document.createElement('div');
    bar.style.cssText = 'flex:1;height:5px;background:rgba(255,255,255,0.08);border-radius:99px;overflow:hidden;';
    var fill = document.createElement('div');
    fill.style.cssText = 'height:100%;background:' + (p.gold || '#f9c12e') + ';border-radius:99px;width:50%;';
    bar.appendChild(fill);
    el.appendChild(bar);
    var toggleBtn = document.createElement('button');
    toggleBtn.setAttribute('data-action', 'timer-toggle');
    toggleBtn.style.cssText = 'padding:8px 14px;min-height:44px;border-radius:999px;border:none;background:' + (p.gold || '#f9c12e') + ';color:' + (p.primary || '#0e1c2f') + ';font-weight:800;cursor:pointer;';
    toggleBtn.textContent = '▶';
    el.appendChild(toggleBtn);
    var resetBtn = document.createElement('button');
    resetBtn.setAttribute('data-action', 'timer-reset');
    resetBtn.style.cssText = 'padding:8px 14px;min-height:44px;border-radius:999px;border:none;background:rgba(255,255,255,0.08);color:' + (p.mutedText || '#6e90b5') + ';font-weight:800;cursor:pointer;';
    resetBtn.textContent = '↺';
    el.appendChild(resetBtn);
    return el;
  }

  function exportResponseInput(plan, placeholder) {
    var p = plan.palette || {};
    var el = document.createElement('div');
    el.className = 'silse-block-input';
    el.style.cssText = 'border-radius:16px;padding:20px;background:' + (p.surface || '#182d45') + ';border:1px solid ' + (p.border || 'rgba(255,255,255,0.09)') + ';';
    var label = document.createElement('div');
    label.style.cssText = 'font-size:11px;font-weight:800;text-transform:uppercase;color:' + p.mutedText + ';margin-bottom:8px;';
    label.textContent = 'Jawaban Kamu';
    el.appendChild(label);
    var ta = document.createElement('textarea');
    ta.style.cssText = 'width:100%;min-height:60px;border-radius:10px;padding:12px;background:rgba(255,255,255,0.04);border:1px dashed rgba(255,255,255,0.15);font-size:14px;color:' + (p.text || '#fff') + ';font-family:inherit;resize:vertical;box-sizing:border-box;';
    ta.setAttribute('placeholder', placeholder || 'Tulis jawabanmu di sini...');
    el.appendChild(ta);
    var saveRow = document.createElement('div');
    saveRow.style.cssText = 'display:flex;align-items:center;gap:10px;margin-top:8px;';
    var saveBtn = document.createElement('button');
    saveBtn.setAttribute('data-action', 'save-response');
    saveBtn.style.cssText = 'padding:10px 18px;min-height:44px;border-radius:999px;border:none;background:' + (p.gold || '#f9c12e') + ';color:' + (p.primary || '#0e1c2f') + ';font-weight:800;cursor:pointer;';
    saveBtn.textContent = 'Simpan Jawaban';
    saveRow.appendChild(saveBtn);
    var badge = document.createElement('span');
    badge.className = 'silse-saved-badge';
    badge.style.cssText = 'display:none;padding:4px 12px;border-radius:999px;background:' + (p.success || '#34d399') + '22;color:' + (p.success || '#34d399') + ';font-size:12px;font-weight:800;';
    badge.textContent = '✓ Tersimpan';
    saveRow.appendChild(badge);
    el.appendChild(saveRow);
    return el;
  }

  function exportRevealBlock(plan, label, text, revealed) {
    var p = plan.palette || {};
    var el = document.createElement('div');
    el.className = 'silse-block-reveal';
    el.style.cssText = 'border-radius:16px;padding:20px;background:' + (p.success || '#34d399') + '11;border:1px solid ' + (p.success || '#34d399') + '40;cursor:pointer;';
    var l = document.createElement('div');
    l.style.cssText = 'font-size:11px;font-weight:800;text-transform:uppercase;color:' + (p.success || '#34d399') + ';margin-bottom:8px;';
    l.textContent = '💡 ' + label;
    el.appendChild(l);
    var hint = document.createElement('div');
    hint.className = 'silse-reveal-hint';
    hint.style.cssText = 'font-size:14px;line-height:1.6;color:' + (p.mutedText || '#6e90b5') + ';font-style:italic;';
    hint.textContent = 'Klik untuk melihat pembahasan...';
    if (revealed) hint.style.display = 'none';
    el.appendChild(hint);
    var body = document.createElement('div');
    body.className = 'silse-reveal-body';
    body.style.cssText = 'font-size:14px;line-height:1.6;color:' + (p.text || '#fff') + ';';
    body.textContent = text;
    if (!revealed) body.style.display = 'none';
    el.appendChild(body);
    return el;
  }

  function exportScoreSummary(plan, score, maxScore, level) {
    var p = plan.palette || {};
    var pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    var el = document.createElement('div');
    el.className = 'silse-block-score-summary';
    el.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;';
    var circle = document.createElement('div');
    circle.className = 'silse-result-circle';
    circle.style.cssText = 'width:120px;height:120px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(' + (p.gold || '#f9c12e') + ' ' + (pct * 3.6) + 'deg, rgba(255,255,255,0.08) 0deg);position:relative;';
    var inner = document.createElement('div');
    inner.style.cssText = 'width:96px;height:96px;border-radius:50%;display:grid;place-items:center;background:' + (p.surface || '#182d45') + ';';
    var num = document.createElement('span');
    num.style.cssText = 'font-size:32px;color:' + (p.gold || '#f9c12e') + ';font-weight:800;';
    num.textContent = String(score);
    inner.appendChild(num);
    circle.appendChild(inner);
    el.appendChild(circle);
    if (level) {
      var badge = document.createElement('div');
      badge.className = 'silse-result-level-badge';
      badge.style.cssText = 'padding:6px 16px;border-radius:999px;background:' + (p.gold || '#f9c12e') + ';color:' + (p.primary || '#0e1c2f') + ';font-size:14px;font-weight:800;';
      badge.textContent = level;
      el.appendChild(badge);
    }
    return el;
  }

  function exportPortfolio(plan, title, items) {
    var p = plan.palette || {};
    var el = document.createElement('div');
    el.className = 'silse-block-portfolio';
    el.style.cssText = 'border-radius:16px;padding:20px;background:' + (p.surface || '#182d45') + ';border:1px solid ' + (p.border || 'rgba(255,255,255,0.09)') + ';';
    var t = document.createElement('div');
    t.style.cssText = 'font-weight:800;font-size:14px;margin-bottom:10px;color:' + p.text + ';';
    t.textContent = title;
    el.appendChild(t);
    for (var i = 0; i < items.length; i++) {
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;justify-content:space-between;font-size:13px;';
      var l = document.createElement('span');
      l.style.cssText = 'color:' + p.mutedText + ';';
      l.textContent = items[i].label;
      var v = document.createElement('span');
      v.style.cssText = 'font-weight:700;color:' + p.text + ';';
      v.textContent = items[i].value;
      row.appendChild(l); row.appendChild(v);
      el.appendChild(row);
    }
    return el;
  }

  function exportReflectionPrompt(plan, prompts) {
    var p = plan.palette || {};
    var el = document.createElement('div');
    el.className = 'silse-block-reflection';
    el.style.cssText = 'border-radius:16px;padding:20px;background:' + (p.gold || '#f9c12e') + '0A;border:1px solid ' + (p.gold || '#f9c12e') + '33;';
    var label = document.createElement('div');
    label.style.cssText = 'font-size:11px;font-weight:800;text-transform:uppercase;color:' + (p.gold || '#f9c12e') + ';margin-bottom:10px;';
    label.textContent = '📝 Refleksi Diri';
    el.appendChild(label);
    for (var i = 0; i < prompts.length; i++) {
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:8;font-size:14px;line-height:1.6;color:' + p.text + ';';
      var num = document.createElement('span');
      num.style.cssText = 'font-weight:800;color:' + (p.gold || '#f9c12e') + ';flex-shrink:0;';
      num.textContent = (i + 1) + '.';
      var text = document.createElement('span');
      text.textContent = prompts[i];
      row.appendChild(num); row.appendChild(text);
      el.appendChild(row);
    }
    return el;
  }

  function exportActionButton(plan, label, variant) {
    var p = plan.palette || {};
    var el = document.createElement('button');
    el.className = 'silse-block-action';
    var bg = p.gold || '#f9c12e'; var color = p.primary || '#0e1c2f';
    if (variant === 'secondary') { bg = p.secondary || '#3ecfcf'; }
    el.style.cssText = 'display:inline-flex;align-items:center;gap:6px;padding:10px 20px;border-radius:999px;background:' + bg + ';color:' + color + ';border:none;font-weight:800;font-size:14px;cursor:pointer;';
    el.textContent = label;
    return el;
  }

  function exportTabs(plan, tabs, activeTab) {
    var p = plan.palette || {};
    var el = document.createElement('div');
    el.className = 'silse-block-tabs';
    el.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;';
    for (var i = 0; i < tabs.length; i++) {
      var tab = document.createElement('button');
      tab.setAttribute('data-tab-id', tabs[i].id);
      var isActive = tabs[i].id === activeTab;
      tab.style.cssText = 'padding:8px 16px;min-height:40px;border-radius:999px;font-size:13px;font-weight:800;cursor:pointer;border:none;background:' + (isActive ? (p.gold || '#f9c12e') : 'rgba(255,255,255,0.04)') + ';color:' + (isActive ? (p.primary || '#0e1c2f') : p.mutedText) + ';';
      tab.textContent = tabs[i].label;
      el.appendChild(tab);
    }
    return el;
  }

  // ===========================================================================
  // GOLDEN-REFERENCE-RENDER-P1 PATCH A: 7 Scene Export Renderers
  // ===========================================================================

  function renderCurriculumGuideExport(slot, content, plan) {
    return exportShell(plan, 'silse-scene-curriculum-guide', [
      exportHeader(plan, '📋 Kurikulum Merdeka', plan.palette ? plan.palette.secondary : null, content.curriculumTitle || 'Kurikulum'),
      exportTabs(plan, [{id:'cp',label:'CP'},{id:'tp',label:'TP'},{id:'atp',label:'ATP'}], 'cp'),
      exportPanel(plan, 'Capaian Pembelajaran', content.competency || ''),
    ]);
  }

  function renderObjectivesPathExport(slot, content, plan) {
    var children = [
      exportHeader(plan, '🎯 Tujuan Pembelajaran', plan.palette ? plan.palette.gold : null, 'Tujuan Pembelajaran'),
    ];
    // Objective list
    var listEl = exportPanel(plan, null, null, 'silse-objective-item');
    var listDiv = listEl.querySelector('div:last-child') || listEl;
    if (content.objectiveList) {
      var listHtml = '';
      for (var i = 0; i < content.objectiveList.length; i++) {
        listHtml += '<div class="silse-objective-item" style="display:flex;gap:10;align-items:flex-start;margin-bottom:8px;">';
        listHtml += '<span style="font-size:18px;color:' + (plan.palette ? plan.palette.gold : '#f9c12e') + ';font-weight:800;flex-shrink:0;">' + (i+1) + '</span>';
        listHtml += '<span style="font-size:14px;line-height:1.6;color:' + (plan.palette ? plan.palette.text : '#fff') + ';">' + content.objectiveList[i] + '</span>';
        listHtml += '</div>';
      }
      listDiv.innerHTML = listHtml;
    }
    children.push(listEl);
    if (content.successCriteria) children.push(exportPanel(plan, 'Kriteria Berhasil', content.successCriteria));
    return exportShell(plan, 'silse-scene-objectives-path', children);
  }

  function renderStarterReviewExport(slot, content, plan) {
    var children = [
      exportHeader(plan, '🔄 Review · ±5 Menit', plan.palette ? plan.palette.gold : null, 'Review Pertemuan Sebelumnya'),
      exportPanel(plan, 'Yang Sudah Kita Pelajari', content.priorLearning || '', 'silse-review-summary-card'),
    ];
    if (content.triggerQuestion) children.push(exportPanel(plan, 'Pertanyaan Pemantik', content.triggerQuestion));
    if (content.discussionPrompt) children.push(exportDiscussionBanner(plan, 'Diskusi', 'Diskusikan!', content.discussionPrompt, plan.palette ? plan.palette.success : null));
    children.push(exportResponseInput(plan, 'Tulis jawaban diskusimu...'));
    if (content.bridgeToNewTopic) children.push(exportPanel(plan, 'Akan Kita Pelajari Hari Ini', content.bridgeToNewTopic));
    return exportShell(plan, 'silse-scene-starter-review', children);
  }

  function renderDiscussionSceneExport(slot, content, plan) {
    var children = [
      exportHeader(plan, '💬 Diskusi Kelompok', plan.palette ? plan.palette.success : null, 'Diskusi Kelompok'),
      exportDiscussionBanner(plan, 'Instruksi', content.groupInstruction || 'Diskusikan', content.discussionPrompt || '', plan.palette ? plan.palette.success : null),
      exportTimerBlock(plan),
      exportResponseInput(plan, content.responseInput || 'Tulis hasil diskusi kelompokmu...'),
      exportActionButton(plan, 'Simpan Jawaban'),
    ];
    return exportShell(plan, 'silse-scene-discussion', children);
  }

  function renderCaseAnalysisExport(slot, content, plan) {
    var children = [
      exportHeader(plan, '🔗 Materi · ±15 Menit', plan.palette ? plan.palette.secondary : null, 'Analisis Kasus'),
      exportPanel(plan, 'Kasus', content.caseText || '', 'silse-case-card'),
    ];
    if (content.analysisPrompt) children.push(exportPanel(plan, 'Pertanyaan Analisis', content.analysisPrompt));
    if (content.revealExplanation) children.push(exportRevealBlock(plan, 'Pembahasan', content.revealExplanation, true));
    if (content.discussionPrompt) children.push(exportDiscussionBanner(plan, 'Diskusi', 'Diskusikan!', content.discussionPrompt, plan.palette ? plan.palette.gold : null));
    children.push(exportResponseInput(plan, 'Tulis analisismu...'));
    return exportShell(plan, 'silse-scene-case-analysis', children);
  }

  function renderResultSummaryExport(slot, content, plan) {
    var children = [
      exportHeader(plan, '🏆 Hasil', plan.palette ? plan.palette.secondary : null, 'Hasil Pembelajaran'),
      exportScoreSummary(plan, (content.scoreSummary ? content.scoreSummary.score : 0) || 0, (content.scoreSummary ? content.scoreSummary.maxScore : 100) || 100, content.achievementLevel),
    ];
    if (content.breakdown) {
      var bdEl = exportPanel(plan, 'Rincian Skor', null, 'silse-result-breakdown');
      var bdDiv = bdEl.querySelector('div:last-child') || bdEl;
      var bdHtml = '';
      for (var i = 0; i < content.breakdown.length; i++) {
        bdHtml += '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;"><span style="color:' + (plan.palette ? plan.palette.mutedText : '#888') + ';">' + content.breakdown[i].label + '</span><span style="font-weight:700;color:' + (plan.palette ? plan.palette.text : '#fff') + ';">' + content.breakdown[i].value + '</span></div>';
      }
      bdDiv.innerHTML = bdHtml;
      children.push(bdEl);
    }
    children.push(exportActionButton(plan, 'Lanjut ke Refleksi'));
    return exportShell(plan, 'silse-scene-result-summary', children);
  }

  function renderReflectionJournalExport(slot, content, plan) {
    var children = [
      exportHeader(plan, '📝 Refleksi · ±8 Menit', plan.palette ? plan.palette.secondary : null, 'Refleksi Diri'),
    ];
    if (content.portfolioSummary) children.push(exportPortfolio(plan, 'Portofolio Diskusi', content.portfolioSummary));
    children.push(exportReflectionPrompt(plan, content.reflectionPrompts || ['Refleksikan pembelajaran hari ini']));
    children.push(exportResponseInput(plan, content.commitmentInput || 'Tulis komitmenmu...'));
    if (content.nextTask) children.push(exportPanel(plan, 'Tugas Pertemuan Berikutnya', content.nextTask, 'silse-reflection-next-task'));
    children.push(exportActionButton(plan, 'Simpan Refleksi'));
    return exportShell(plan, 'silse-scene-reflection-journal', children);
  }

  // GOLDEN-REFERENCE-GAME-P1: Classification game export renderer
  function renderClassificationGameExport(slot, content, plan) {
    var p = plan.palette || {};
    var children = [
      exportHeader(plan, '🎮 Game Sortir · ±15 Menit', p.success, 'Game Sortir Norma'),
    ];
    // Instruction
    if (content.instruction) {
      var instr = document.createElement('div');
      instr.className = 'silse-classification-instruction';
      instr.style.cssText = 'background:' + (p.success || '#34d399') + '11;border:1px solid ' + (p.success || '#34d399') + '40;border-radius:13px;padding:13px 15px;font-size:14px;line-height:1.6;color:' + p.text + ';';
      instr.textContent = content.instruction;
      children.push(instr);
    }
    // Score
    var scoreEl = document.createElement('div');
    scoreEl.className = 'silse-classification-score';
    scoreEl.setAttribute('data-testid', 'game-score');
    scoreEl.style.cssText = 'display:flex;align-items:center;gap:10px;font-size:16px;font-weight:800;color:' + (p.gold || '#f9c12e') + ';';
    scoreEl.innerHTML = '🏆 Skor: <span class="silse-game-score-val">0</span>';
    children.push(scoreEl);
    // Feedback area
    var fbEl = document.createElement('div');
    fbEl.className = 'silse-classification-feedback';
    fbEl.setAttribute('data-testid', 'game-feedback');
    fbEl.style.cssText = 'display:none;padding:10px 14px;border-radius:10px;font-size:14px;font-weight:700;';
    children.push(fbEl);
    // Item pool
    var poolLabel = document.createElement('div');
    poolLabel.style.cssText = 'font-size:12px;font-weight:800;text-transform:uppercase;color:' + p.mutedText + ';margin-bottom:8px;';
    poolLabel.textContent = 'Pilih Item';
    children.push(poolLabel);
    var pool = document.createElement('div');
    pool.className = 'silse-classification-pool';
    pool.setAttribute('data-testid', 'classification-pool');
    pool.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;';
    if (content.items) {
      for (var ii = 0; ii < content.items.length; ii++) {
        (function(item) {
          var btn = document.createElement('button');
          btn.className = 'silse-classification-item';
          btn.setAttribute('data-item-id', item.id);
          btn.setAttribute('data-correct-cat', item.correctCategory);
          btn.textContent = item.label;
          btn.style.cssText = 'padding:10px 16px;border-radius:999px;font-size:14px;font-weight:700;border:1px solid ' + (p.border || 'rgba(255,255,255,0.09)') + ';background:' + (p.surface || '#182d45') + ';color:' + p.text + ';cursor:pointer;transition:all 0.15s;';
          pool.appendChild(btn);
        })(content.items[ii]);
      }
    }
    children.push(pool);
    // Category columns
    var grid = document.createElement('div');
    grid.className = 'silse-classification-column-grid';
    grid.setAttribute('data-testid', 'classification-columns');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(' + Math.min((content.categories || []).length, 4) + ', 1fr);gap:10px;';
    if (content.categories) {
      for (var ci = 0; ci < content.categories.length; ci++) {
        (function(cat) {
          var col = document.createElement('div');
          col.className = 'silse-classification-column';
          col.setAttribute('data-category', cat);
          col.style.cssText = 'background:' + (p.surface || '#182d45') + ';border:1px solid ' + (p.border || 'rgba(255,255,255,0.09)') + ';border-radius:16px;padding:20px;min-height:120px;';
          var colTitle = document.createElement('div');
          colTitle.style.cssText = 'font-size:13px;font-weight:800;color:' + (p.gold || '#f9c12e') + ';margin-bottom:10px;text-align:center;';
          colTitle.textContent = cat;
          col.appendChild(colTitle);
          var colItems = document.createElement('div');
          colItems.className = 'silse-classification-placed-items';
          colItems.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
          col.appendChild(colItems);
          grid.appendChild(col);
        })(content.categories[ci]);
      }
    }
    children.push(grid);
    // Reset button
    children.push(exportActionButton(plan, '↺ Reset', 'secondary'));
    return exportShell(plan, 'silse-scene-classification-game', children);
  }

  function buildInlineStyle(comp) {
    // Geometry + resolvedStyle.inlineStyle — NO style switch
    var s = 'position:absolute;left:' + comp.x + 'px;top:' + comp.y + 'px;width:' + comp.width + 'px;height:' + comp.height + 'px;';
    var rs = comp.resolvedStyle.inlineStyle;
    for (var key in rs) {
      if (rs.hasOwnProperty(key)) {
        var cssKey = key.replace(/[A-Z]/g, function(m) { return '-' + m.toLowerCase(); });
        s += cssKey + ':' + rs[key] + ';';
      }
    }
    return s;
  }

  // MPI-JSON-SCENE-PROOF-01: render game sebagai scene misi (bukan list pertanyaan).
  // Tampil sebagai: briefing → target → action cards → feedback → reward.
  function renderGameMissionScene(comp, style) {
    var sceneMeta = comp.sceneMetadata;
    var gs = gameStates[comp.id] || { currentMissionIndex: 0, selectedChoiceIndex: null, isAnswered: false, score: 0, completed: false };
    gameStates[comp.id] = gs;

    var mission = comp.missions[gs.currentMissionIndex];
    if (!mission) return null;

    var el = document.createElement('div');
    el.className = 'silse-game-scene ' + (comp.skinClass || '');
    el.style.cssText = style + 'box-sizing:border-box;display:flex;flex-direction:column;gap:10px;overflow:auto;padding:18px 20px;';

    // Completed state: tampilkan reward
    if (gs.completed) {
      var rewardDone = document.createElement('div');
      rewardDone.className = 'silse-game-reward';
      rewardDone.style.cssText = 'padding:16px;border-radius:12px;background:#fffbeb;border:2px solid #fbbf24;text-align:center;display:flex;flex-direction:column;align-items:center;gap:4px;';
      var rewardIcon = document.createElement('div');
      rewardIcon.style.fontSize = '48px';
      rewardIcon.textContent = '🏆';
      rewardDone.appendChild(rewardIcon);
      var rewardLabel = document.createElement('strong');
      rewardLabel.style.cssText = 'font-size:20px;display:block;margin-bottom:4px;';
      rewardLabel.textContent = (sceneMeta.reward && sceneMeta.reward.label) ? sceneMeta.reward.label : 'Misi Selesai';
      rewardDone.appendChild(rewardLabel);
      var rewardScore = document.createElement('div');
      rewardScore.style.cssText = 'font-size:14px;color:#4b5563;';
      rewardScore.textContent = 'Skor akhir: ' + gs.score;
      rewardDone.appendChild(rewardScore);
      el.appendChild(rewardDone);

      var retryBtn = document.createElement('button');
      retryBtn.style.cssText = 'margin-top:12px;padding:10px 18px;border-radius:999px;border:0;background:#1d3557;color:#fff;font-weight:800;cursor:pointer;align-self:center;';
      retryBtn.textContent = 'Ulangi Misi';
      retryBtn.addEventListener('click', function() {
        gameStates[comp.id] = { currentMissionIndex: 0, selectedChoiceIndex: null, isAnswered: false, score: 0, completed: false };
        renderPage(currentPageIdx);
      });
      el.appendChild(retryBtn);
      return el;
    }

    // Briefing
    var briefing = document.createElement('div');
    briefing.className = 'silse-game-briefing';
    briefing.style.cssText = 'padding:12px 14px;border-radius:10px;background:#fffbeb;border:1px solid #fde68a;margin-bottom:8px;';
    var briefingLabel = document.createElement('div');
    briefingLabel.style.cssText = 'font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;';
    briefingLabel.textContent = '📋 Briefing Misi';
    briefing.appendChild(briefingLabel);
    var briefingText = document.createElement('div');
    briefingText.style.cssText = 'font-size:15px;font-weight:600;color:#1f2937;white-space:normal;overflow-wrap:anywhere;';
    briefingText.textContent = sceneMeta.briefing || comp.gameInstruction || '';
    briefing.appendChild(briefingText);
    el.appendChild(briefing);

    // Target
    var target = document.createElement('div');
    target.className = 'silse-game-target';
    target.style.cssText = 'padding:12px 14px;border-radius:10px;background:#eff6ff;border:1px solid #bfdbfe;margin-bottom:8px;';
    var targetLabel = document.createElement('div');
    targetLabel.style.cssText = 'font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;';
    targetLabel.textContent = '🎯 Target Misi';
    target.appendChild(targetLabel);
    var targetText = document.createElement('div');
    targetText.style.cssText = 'font-size:14px;color:#1e3a8a;white-space:normal;overflow-wrap:anywhere;';
    targetText.textContent = sceneMeta.missionTarget || mission.prompt || '';
    target.appendChild(targetText);
    el.appendChild(target);

    // Action grid
    var actionGrid = document.createElement('div');
    actionGrid.className = 'silse-game-action-grid';
    actionGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill, minmax(220px, 1fr));gap:10px;margin-top:4px;';

    for (var ai = 0; ai < mission.choices.length; ai++) {
      (function(actionIdx, actionChoice, actionMission, actionState) {
        var card = document.createElement('div');
        card.className = 'silse-game-action-card';
        card.dataset.choiceIndex = String(actionIdx);
        var bg = '#ffffff';
        var borderColor = '#d1d5db';
        if (actionState.isAnswered && actionIdx === actionMission.correctChoiceIndex) { bg = '#d1fae5'; borderColor = '#16a34a'; }
        else if (actionState.isAnswered && actionIdx === actionState.selectedChoiceIndex && actionIdx !== actionMission.correctChoiceIndex) { bg = '#fee2e2'; borderColor = '#dc2626'; }
        card.style.cssText = 'padding:14px 16px;min-height:80px;height:auto;background:' + bg + ';border:2px solid ' + borderColor + ';border-radius:12px;cursor:pointer;font-size:14px;font-weight:600;line-height:1.4;white-space:normal;overflow-wrap:anywhere;word-break:break-word;display:flex;flex-direction:column;gap:6px;transition:transform 0.15s ease, box-shadow 0.15s ease;';

        var cardHeader = document.createElement('div');
        cardHeader.style.cssText = 'display:flex;align-items:center;gap:8px;';
        var letterBadge = document.createElement('span');
        letterBadge.style.cssText = 'display:inline-grid;place-items:center;min-width:28px;height:28px;border-radius:8px;background:#1d3557;color:#fff;font-size:13px;font-weight:900;flex-shrink:0;';
        letterBadge.textContent = String.fromCharCode(65 + actionIdx);
        cardHeader.appendChild(letterBadge);
        var actionLabel = document.createElement('span');
        actionLabel.style.cssText = 'font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;';
        actionLabel.textContent = 'Aksi';
        cardHeader.appendChild(actionLabel);
        card.appendChild(cardHeader);

        var actionText = document.createElement('span');
        actionText.style.flex = '1';
        actionText.textContent = actionChoice.text;
        card.appendChild(actionText);

        card.addEventListener('click', function() {
          if (actionState.isAnswered) return;
          actionState.selectedChoiceIndex = actionIdx;
          actionState.isAnswered = true;
          if (actionIdx === actionMission.correctChoiceIndex) {
            actionState.score += actionMission.points;
            updateScoreDisplay();
          }
          renderPage(currentPageIdx);
        });

        actionGrid.appendChild(card);
      })(ai, mission.choices[ai], mission, gs);
    }
    el.appendChild(actionGrid);

    // Feedback (jika sudah dijawab)
    if (gs.isAnswered) {
      var answeredCorrectly = gs.selectedChoiceIndex === mission.correctChoiceIndex;
      var feedback = document.createElement('div');
      feedback.className = 'silse-game-feedback';
      feedback.style.cssText = 'margin-top:8px;padding:12px 14px;border-radius:10px;font-size:13px;font-weight:600;background-color:' + (answeredCorrectly ? '#d1fae5' : '#fee2e2') + ';color:' + (answeredCorrectly ? '#065f46' : '#991b1b') + ';border-left:4px solid ' + (answeredCorrectly ? '#16a34a' : '#dc2626') + ';white-space:normal;overflow-wrap:anywhere;';
      var feedbackLabel = document.createElement('div');
      feedbackLabel.style.cssText = 'font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;';
      feedbackLabel.textContent = answeredCorrectly ? '✓ Hasil Aksi' : '✗ Hasil Aksi';
      feedback.appendChild(feedbackLabel);
      feedback.appendChild(document.createTextNode(answeredCorrectly ? mission.feedbackCorrect : mission.feedbackWrong));
      el.appendChild(feedback);

      // Reward preview (jika benar)
      if (answeredCorrectly && sceneMeta.reward) {
        var rewardPreview = document.createElement('div');
        rewardPreview.className = 'silse-game-reward';
        rewardPreview.style.cssText = 'margin-top:8px;padding:16px;border-radius:12px;background:linear-gradient(145deg, #fff8e7, #fff);border:2px solid #fbbf24;display:flex;align-items:center;gap:12px;';
        var rewardIcon2 = document.createElement('div');
        rewardIcon2.style.fontSize = '24px';
        rewardIcon2.textContent = '🏅';
        rewardPreview.appendChild(rewardIcon2);
        var rewardText = document.createElement('div');
        var rewardTextLabel = document.createElement('div');
        rewardTextLabel.style.cssText = 'font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;';
        rewardTextLabel.textContent = 'Reward Didapat';
        rewardText.appendChild(rewardTextLabel);
        var rewardTextValue = document.createElement('strong');
        rewardTextValue.style.cssText = 'font-size:14px;color:#1f2937;';
        rewardTextValue.textContent = sceneMeta.reward.label;
        rewardText.appendChild(rewardTextValue);
        rewardPreview.appendChild(rewardText);
        el.appendChild(rewardPreview);
      }

      // Next mission / finish button
      if (gs.currentMissionIndex < comp.missions.length - 1) {
        var nextBtn = document.createElement('button');
        nextBtn.style.cssText = 'margin-top:8px;padding:10px 18px;align-self:flex-end;';
        nextBtn.textContent = 'Misi Berikutnya →';
        nextBtn.addEventListener('click', function() {
          gs.currentMissionIndex++;
          gs.selectedChoiceIndex = null;
          gs.isAnswered = false;
          renderPage(currentPageIdx);
        });
        el.appendChild(nextBtn);
      } else {
        gs.completed = true;
        var finishBtn = document.createElement('button');
        finishBtn.style.cssText = 'margin-top:8px;padding:10px 18px;align-self:flex-end;';
        finishBtn.textContent = 'Lihat Hasil';
        finishBtn.addEventListener('click', function() {
          renderPage(currentPageIdx);
        });
        el.appendChild(finishBtn);
      }
    }

    return el;
  }

  function renderComponent(comp) {
    var style = buildInlineStyle(comp);
    var el;

    if (comp.type === 'text') {
      el = document.createElement('div');
      var textClasses = comp.skinClass || '';
      // PREMIUM-EXPORT-OVERHAUL-01: hero typography for title variant.
      if (comp.variant === 'title') {
        textClasses = (textClasses + ' silse-text-title').trim();
      } else if (comp.variant === 'subtitle') {
        textClasses = (textClasses + ' silse-text-subtitle').trim();
      }
      el.className = textClasses;
      el.style.cssText = style + 'display:flex;align-items:center;overflow:hidden;white-space:pre-wrap;word-break:break-word;box-sizing:border-box;';
      // PREMIUM-EXPORT-OVERHAUL-01: accent span on last word for title variant.
      if (comp.variant === 'title' && comp.text && comp.text.indexOf('\\n') === -1) {
        var words = comp.text.split(/\\s+/);
        if (words.length >= 2) {
          var lastWord = words.pop();
          var accentSpan = document.createElement('span');
          accentSpan.className = 'silse-accent';
          accentSpan.textContent = lastWord;
          el.textContent = words.join(' ') + ' ';
          el.appendChild(accentSpan);
        } else {
          el.textContent = comp.text || '';
        }
      } else {
        el.textContent = comp.text || '';
      }
      return el;
    }

    if (comp.type === 'image') {
      el = document.createElement('div');
      el.style.cssText = style + 'overflow:hidden;box-sizing:border-box;';
      var img = document.createElement('img');
      img.src = comp.src;
      img.alt = comp.alt || '';
      img.style.cssText = 'width:100%;height:100%;object-fit:' + comp.objectFit + ';display:block;pointer-events:none;';
      el.appendChild(img);
      return el;
    }

    if (comp.type === 'card') {
      el = document.createElement('div');
      el.className = comp.skinClass || '';
      el.style.cssText = style + 'box-sizing:border-box;display:flex;flex-direction:column;gap:8px;overflow:hidden;padding:18px 20px;';
      if (comp.cardTitle) {
        var title = document.createElement('strong');
        title.style.fontSize = '20px';
        title.textContent = comp.cardTitle;
        el.appendChild(title);
      }
      var body = document.createElement('div');
      body.style.cssText = 'font-size:15px;line-height:1.55;white-space:pre-wrap;word-break:break-word;flex:1;overflow:auto;';
      body.textContent = comp.body || '';
      el.appendChild(body);
      return el;
    }

    if (comp.type === 'navigation') {
      el = document.createElement('button');
      el.className = 'silse-nav-btn ' + (comp.skinClass || '');
      el.dataset.action = comp.action;
      el.dataset.target = comp.targetPageId || '';
      el.style.cssText = style + 'cursor:pointer;display:flex;align-items:center;justify-content:center;user-select:none;padding:10px 22px;font-size:14px;';

      // Apply interaction styles from resolvedStyle.interactions
      var interactions = comp.resolvedStyle.interactions;
      if (interactions && interactions.hover) {
        var hover = interactions.hover;
        if (hover.transition) el.style.transition = hover.transition;
        // Store original + hover styles for event listeners
        el._origTransform = el.style.transform || '';
        el._hoverTransform = hover.transform || '';
        el._hoverBoxShadow = hover.boxShadow || '';
        el._origBoxShadow = el.style.boxShadow || '';

        el.addEventListener('mouseenter', function() {
          if (this._hoverTransform) this.style.transform = this._hoverTransform;
          if (this._hoverBoxShadow) this.style.boxShadow = this._hoverBoxShadow;
        });
        el.addEventListener('mouseleave', function() {
          this.style.transform = this._origTransform;
          this.style.boxShadow = this._origBoxShadow;
        });
      }
      if (interactions && interactions.press) {
        var press = interactions.press;
        el._pressTransform = press.transform || '';
        el.addEventListener('mousedown', function() {
          if (this._pressTransform) this.style.transform = this._pressTransform;
        });
        el.addEventListener('mouseup', function() {
          this.style.transform = this._hoverTransform || this._origTransform;
        });
      }

      el.textContent = comp.label || '';
      return el;
    }

    if (comp.type === 'question') {
      el = document.createElement('div');
      el.className = 'silse-question ' + (comp.skinClass || '');
      el.style.cssText = style + 'box-sizing:border-box;display:flex;flex-direction:column;gap:8px;overflow:auto;padding:12px;';

      if (comp.questionTitle) {
        var qTitle = document.createElement('strong');
        qTitle.style.fontSize = '20px';
        qTitle.textContent = comp.questionTitle;
        el.appendChild(qTitle);
      }

      var qPrompt = document.createElement('div');
      qPrompt.style.cssText = 'font-size:17px;font-weight:650;line-height:1.4;margin-bottom:6px;white-space:normal;overflow-wrap:anywhere;';
      qPrompt.textContent = comp.prompt || '';
      el.appendChild(qPrompt);

      var choicesContainer = document.createElement('div');
      choicesContainer.style.cssText = 'display:flex;flex-direction:column;gap:10px;';

      var existingAnswer = questionAnswers[comp.id];

      for (var ci = 0; ci < comp.choices.length; ci++) {
        (function(choiceIdx, choice, compId, correctIdx, pts, fbCorrect, fbWrong) {
          var choiceEl = document.createElement('div');
          var bg = '';
          var choiceStateClass = 'silse-choice-default';
          if (existingAnswer && existingAnswer.isAnswered) {
            if (choiceIdx === correctIdx) { bg = '#d1fae5'; choiceStateClass = 'silse-choice-correct'; }
            else if (choiceIdx === existingAnswer.selectedChoiceIndex) { bg = '#fee2e2'; choiceStateClass = 'silse-choice-wrong'; }
          }
          choiceEl.className = 'silse-question-choice ' + choiceStateClass;
          choiceEl.dataset.choiceIndex = String(choiceIdx);
          if (bg) choiceEl.style.backgroundColor = bg;

          // PREMIUM-EXPORT-OVERHAUL-01: letter badge with brand color
          var letter = document.createElement('span');
          letter.className = 'silse-choice-letter';
          letter.textContent = String.fromCharCode(65 + choiceIdx);
          choiceEl.appendChild(letter);

          var choiceText = document.createElement('span');
          choiceText.style.flex = '1';
          choiceText.style.whiteSpace = 'normal';
          choiceText.style.overflowWrap = 'anywhere';
          choiceText.textContent = choice.text;
          choiceEl.appendChild(choiceText);

          choiceEl.addEventListener('click', function() {
            var ans = questionAnswers[compId];
            if (ans && ans.isAnswered) return; // already answered, no re-score

            var isCorrect = choiceIdx === correctIdx;
            questionAnswers[compId] = { selectedChoiceIndex: choiceIdx, isAnswered: true };

            if (isCorrect) {
              totalScore += pts;
              updateScoreDisplay();
            }

            // Re-render this question to show feedback
            renderPage(currentPageIdx);
          });

          choicesContainer.appendChild(choiceEl);
        })(ci, comp.choices[ci], comp.id, comp.correctChoiceIndex, comp.points, comp.feedbackCorrect, comp.feedbackWrong);
      }
      el.appendChild(choicesContainer);

      // Show feedback if answered
      if (existingAnswer && existingAnswer.isAnswered) {
        var feedback = document.createElement('div');
        var isCorrectAnswer = existingAnswer.selectedChoiceIndex === comp.correctChoiceIndex;
        var celebClasses = '';
        if (isCorrectAnswer) {
          celebClasses = ' ' + ${celebrateSuccessJson} + ' ' + ${celebrateBurstJson};
        }
        feedback.className = 'silse-question-feedback ' + (isCorrectAnswer ? 'silse-feedback-correct' : 'silse-feedback-wrong') + celebClasses;
        feedback.style.position = 'relative';
        feedback.style.backgroundColor = isCorrectAnswer ? '#d1fae5' : '#fee2e2';
        feedback.style.color = isCorrectAnswer ? '#065f46' : '#991b1b';
        feedback.textContent = isCorrectAnswer ? comp.feedbackCorrect : comp.feedbackWrong;
        if (isCorrectAnswer) {
          var particle = document.createElement('span');
          particle.className = ${celebrateParticleJson};
          particle.setAttribute('aria-hidden', 'true');
          particle.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
          feedback.appendChild(particle);
        }
        el.appendChild(feedback);
      }

      return el;
    }

    if (comp.type === 'game') {
      // MPI-JSON-SCENE-PROOF-01: render sebagai scene misi jika sceneMetadata ada.
      if (comp.sceneMetadata && comp.sceneMetadata.scene === 'game-mission') {
        return renderGameMissionScene(comp, style);
      }

      el = document.createElement('div');
      el.className = 'silse-game ' + (comp.skinClass || '');
      el.style.cssText = style + 'box-sizing:border-box;display:flex;flex-direction:column;gap:10px;overflow:auto;padding:18px 20px;';

      var gameState = gameStates[comp.id] || { currentMissionIndex: 0, selectedChoiceIndex: null, isAnswered: false, score: 0, completed: false };
      gameStates[comp.id] = gameState;

      if (gameState.completed) {
        var doneTitle = document.createElement('strong');
        doneTitle.style.fontSize = '22px';
        doneTitle.textContent = 'Game Selesai!';
        el.appendChild(doneTitle);
        var doneScore = document.createElement('div');
        doneScore.style.cssText = 'font-size:18px;margin-top:8px;font-weight:700;';
        doneScore.textContent = 'Skor: ' + gameState.score;
        el.appendChild(doneScore);
        var retryBtn = document.createElement('button');
        retryBtn.style.cssText = 'margin-top:12px;padding:10px 18px;border-radius:999px;border:0;background:#1d3557;color:#fff;font-weight:800;cursor:pointer;';
        retryBtn.textContent = 'Ulangi Game';
        retryBtn.addEventListener('click', function() {
          gameStates[comp.id] = { currentMissionIndex: 0, selectedChoiceIndex: null, isAnswered: false, score: 0, completed: false };
          renderPage(currentPageIdx);
        });
        el.appendChild(retryBtn);
        return el;
      }

      var mission = comp.missions[gameState.currentMissionIndex];
      if (!mission) return el;

      var gTitle = document.createElement('strong');
      gTitle.style.fontSize = '20px';
      gTitle.textContent = comp.gameTitle || 'Game';
      el.appendChild(gTitle);

      var gInstr = document.createElement('div');
      gInstr.style.cssText = 'font-size:14px;font-weight:600;opacity:0.78;white-space:normal;overflow-wrap:anywhere;';
      gInstr.textContent = comp.gameInstruction || '';
      el.appendChild(gInstr);

      var gProgress = document.createElement('div');
      gProgress.style.cssText = 'font-size:13px;font-weight:700;opacity:0.7;';
      gProgress.textContent = 'Misi ' + (gameState.currentMissionIndex + 1) + ' / ' + comp.missions.length + ' · Skor: ' + gameState.score;
      el.appendChild(gProgress);

      var gPrompt = document.createElement('div');
      gPrompt.style.cssText = 'font-size:17px;font-weight:650;margin-top:6px;white-space:normal;overflow-wrap:anywhere;';
      gPrompt.textContent = mission.prompt || '';
      el.appendChild(gPrompt);

      var gChoices = document.createElement('div');
      gChoices.style.cssText = 'display:flex;flex-direction:column;gap:10px;';

      for (var gi = 0; gi < mission.choices.length; gi++) {
        (function(gChoiceIdx, gChoice, gCompId, gMission, gState) {
          var gChoiceEl = document.createElement('div');
          gChoiceEl.className = 'silse-game-choice';
          var gBg = '';
          if (gState.isAnswered) {
            if (gChoiceIdx === gMission.correctChoiceIndex) gBg = '#d1fae5';
            else if (gChoiceIdx === gState.selectedChoiceIndex) gBg = '#fee2e2';
          }
          if (gBg) gChoiceEl.style.backgroundColor = gBg;

          // PREMIUM-EXPORT-OVERHAUL-01: letter badge with brand color
          var gLetter = document.createElement('span');
          gLetter.className = 'silse-choice-letter';
          gLetter.textContent = String.fromCharCode(65 + gChoiceIdx);
          gChoiceEl.appendChild(gLetter);

          var gText = document.createElement('span');
          gText.style.flex = '1';
          gText.style.whiteSpace = 'normal';
          gText.style.overflowWrap = 'anywhere';
          gText.textContent = gChoice.text;
          gChoiceEl.appendChild(gText);

          gChoiceEl.addEventListener('click', function() {
            if (gState.isAnswered) return;
            gState.selectedChoiceIndex = gChoiceIdx;
            gState.isAnswered = true;
            if (gChoiceIdx === gMission.correctChoiceIndex) {
              gState.score += gMission.points;
              updateScoreDisplay();
            }
            renderPage(currentPageIdx);
          });

          gChoices.appendChild(gChoiceEl);
        })(gi, mission.choices[gi], comp.id, mission, gameState);
      }
      el.appendChild(gChoices);

      if (gameState.isAnswered) {
        var gFeedback = document.createElement('div');
        gFeedback.className = 'silse-game-feedback';
        var gIsCorrect = gameState.selectedChoiceIndex === mission.correctChoiceIndex;
        gFeedback.style.backgroundColor = gIsCorrect ? '#d1fae5' : '#fee2e2';
        gFeedback.style.color = gIsCorrect ? '#065f46' : '#991b1b';
        gFeedback.textContent = gIsCorrect ? mission.feedbackCorrect : mission.feedbackWrong;
        el.appendChild(gFeedback);

        if (gameState.currentMissionIndex < comp.missions.length - 1) {
          var nextBtn = document.createElement('button');
          nextBtn.style.cssText = 'margin-top:8px;padding:8px 16px;';
          nextBtn.textContent = 'Misi Berikutnya';
          nextBtn.addEventListener('click', function() {
            gameState.currentMissionIndex++;
            gameState.selectedChoiceIndex = null;
            gameState.isAnswered = false;
            renderPage(currentPageIdx);
          });
          el.appendChild(nextBtn);
        } else {
          gameState.completed = true;
          var finishBtn = document.createElement('button');
          finishBtn.style.cssText = 'margin-top:8px;padding:8px 16px;';
          finishBtn.textContent = 'Lihat Hasil';
          finishBtn.addEventListener('click', function() {
            renderPage(currentPageIdx);
          });
          el.appendChild(finishBtn);
        }
      }

      return el;
    }

    if (comp.type === 'layered-info') {
      el = document.createElement('div');
      el.className = 'silse-layered-info ' + (comp.skinClass || '');
      el.style.cssText = style + 'box-sizing:border-box;display:flex;flex-direction:column;gap:8px;overflow:auto;padding:12px;';

      if (comp.layeredTitle) {
        var liTitle = document.createElement('strong');
        liTitle.style.cssText = 'font-size:16px;margin-bottom:4px;white-space:normal;overflow-wrap:anywhere;';
        liTitle.textContent = comp.layeredTitle;
        el.appendChild(liTitle);
      }

      var layers = comp.layers || [];
      if (layers.length === 0) {
        var liEmpty = document.createElement('div');
        liEmpty.style.cssText = 'color:#6b7280;font-size:13px;font-style:italic;';
        liEmpty.textContent = 'Belum ada lapisan.';
        el.appendChild(liEmpty);
        return el;
      }

      // Initialize runtime state for this layered-info
      if (!(comp.id in layeredInfoStates)) {
        layeredInfoStates[comp.id] = comp.defaultOpenIndex;
      }
      var openIdx = layeredInfoStates[comp.id];

      var variant = comp.layeredVariant;

      if (variant === 'accordion') {
        var accContainer = document.createElement('div');
        accContainer.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
        layers.forEach(function(layer, idx) {
          var isOpen = openIdx === idx;
          var accItem = document.createElement('div');
          accItem.style.cssText = 'border:1px solid ' + (isOpen ? '#2563eb' : '#d1d5db') + ';border-radius:6px;overflow:hidden;';
          var accHead = document.createElement('div');
          accHead.style.cssText = 'padding:8px 12px;background:' + (isOpen ? '#eff6ff' : '#f9fafb') + ';cursor:pointer;display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:' + (isOpen ? '#2563eb' : '#1f2937') + ';white-space:normal;overflow-wrap:anywhere;';
          accHead.textContent = (isOpen ? '▾ ' : '▸ ') + layer.title;
          (function(itemIdx) {
            accHead.addEventListener('click', function() {
              layeredInfoStates[comp.id] = (layeredInfoStates[comp.id] === itemIdx) ? null : itemIdx;
              renderPage(currentPageIdx);
            });
          })(idx);
          accItem.appendChild(accHead);
          if (isOpen) {
            var accBody = document.createElement('div');
            accBody.style.cssText = 'padding:10px 12px;font-size:13px;line-height:1.5;color:#1f2937;white-space:pre-wrap;overflow-wrap:anywhere;';
            accBody.textContent = layer.body;
            accItem.appendChild(accBody);
          }
          accContainer.appendChild(accItem);
        });
        el.appendChild(accContainer);
      } else if (variant === 'tabs' || variant === 'iconTabs') {
        // Tabs / iconTabs
        var safeActive = (openIdx === null || openIdx < 0 || openIdx >= layers.length) ? 0 : openIdx;
        var tabsBar = document.createElement('div');
        tabsBar.style.cssText = 'display:flex;gap:4px;border-bottom:2px solid #e3ddcd;flex-wrap:wrap;';
        layers.forEach(function(layer, idx) {
          var isActive = safeActive === idx;
          var tab = document.createElement('button');
          tab.style.cssText = 'padding:6px 12px;font-size:12px;font-weight:' + (isActive ? '600' : '500') + ';border:none;border-bottom:2px solid ' + (isActive ? '#2563eb' : 'transparent') + ';background:' + (isActive ? '#eff6ff' : 'transparent') + ';color:' + (isActive ? '#2563eb' : '#4a5160') + ';cursor:pointer;margin-bottom:-2px;display:inline-flex;align-items:center;gap:4px;border-radius:4px 4px 0 0;';
          if (variant === 'iconTabs' && layer.icon) {
            var iconSpan = document.createElement('span');
            iconSpan.style.fontSize = '14px';
            iconSpan.textContent = layer.icon;
            tab.appendChild(iconSpan);
          }
          var tabLabel = document.createElement('span');
          tabLabel.textContent = layer.title;
          tab.appendChild(tabLabel);
          (function(itemIdx) {
            tab.addEventListener('click', function() {
              layeredInfoStates[comp.id] = itemIdx;
              renderPage(currentPageIdx);
            });
          })(idx);
          tabsBar.appendChild(tab);
        });
        el.appendChild(tabsBar);
        var activeLayer = layers[safeActive];
        if (activeLayer) {
          var tabBody = document.createElement('div');
          tabBody.style.cssText = 'padding:10px;font-size:13px;line-height:1.5;color:#1f2937;white-space:pre-wrap;overflow-wrap:anywhere;flex:1;overflow:auto;';
          tabBody.textContent = activeLayer.body;
          el.appendChild(tabBody);
        }
      } else if (variant === 'stepper') {
        // Stepper
        var sSafeActive = (openIdx === null || openIdx < 0 || openIdx >= layers.length) ? 0 : openIdx;
        var stepBar = document.createElement('div');
        stepBar.style.cssText = 'display:flex;gap:2px;align-items:center;flex-wrap:wrap;';
        layers.forEach(function(layer, idx) {
          var isActive = sSafeActive === idx;
          var isPast = idx < sSafeActive;
          var step = document.createElement('button');
          step.style.cssText = 'width:28px;height:28px;border-radius:50%;border:2px solid ' + (isActive ? '#2563eb' : isPast ? '#2f7d4f' : '#d1d5db') + ';background:' + (isActive ? '#2563eb' : isPast ? '#2f7d4f' : '#fff') + ';color:#fff;font-size:12px;font-weight:700;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;';
          step.textContent = String(idx + 1);
          step.title = layer.title;
          (function(itemIdx) {
            step.addEventListener('click', function() {
              layeredInfoStates[comp.id] = itemIdx;
              renderPage(currentPageIdx);
            });
          })(idx);
          stepBar.appendChild(step);
          if (idx < layers.length - 1) {
            var line = document.createElement('div');
            line.style.cssText = 'width:24px;height:2px;background:' + (isPast ? '#2f7d4f' : '#d1d5db') + ';';
            stepBar.appendChild(line);
          }
        });
        el.appendChild(stepBar);
        var stepTitle = document.createElement('div');
        stepTitle.style.cssText = 'padding:8px 4px;font-size:12px;font-weight:600;color:#2563eb;white-space:normal;overflow-wrap:anywhere;';
        stepTitle.textContent = layers[sSafeActive] ? layers[sSafeActive].title : '';
        el.appendChild(stepTitle);
        if (layers[sSafeActive]) {
          var stepBody = document.createElement('div');
          stepBody.style.cssText = 'padding:10px;font-size:13px;line-height:1.5;color:#1f2937;white-space:pre-wrap;overflow-wrap:anywhere;flex:1;overflow:auto;background:#f9fafb;border-radius:6px;';
          stepBody.textContent = layers[sSafeActive].body;
          el.appendChild(stepBody);
        }
      } else if (variant === 'cardGrid') {
        // CardGrid
        var cSafeActive = (openIdx === null || openIdx < 0 || openIdx >= layers.length) ? 0 : openIdx;
        var grid = document.createElement('div');
        grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill, minmax(180px, 1fr));gap:6px;';
        layers.forEach(function(layer, idx) {
          var isActive = cSafeActive === idx;
          var card = document.createElement('button');
          card.style.cssText = 'padding:10px 8px;font-size:12px;font-weight:' + (isActive ? '600' : '500') + ';border:1px solid ' + (isActive ? '#2563eb' : '#d1d5db') + ';background:' + (isActive ? '#eff6ff' : '#fff') + ';color:' + (isActive ? '#2563eb' : '#1f2937') + ';border-radius:6px;cursor:pointer;text-align:center;display:flex;flex-direction:column;gap:2px;min-height:60px;';
          if (layer.icon) {
            var cIcon = document.createElement('span');
            cIcon.style.fontSize = '16px';
            cIcon.textContent = layer.icon;
            card.appendChild(cIcon);
          }
          var cLabel = document.createElement('span');
          cLabel.style.cssText = 'white-space:normal;overflow-wrap:anywhere;';
          cLabel.textContent = layer.title;
          card.appendChild(cLabel);
          (function(itemIdx) {
            card.addEventListener('click', function() {
              layeredInfoStates[comp.id] = itemIdx;
              renderPage(currentPageIdx);
            });
          })(idx);
          grid.appendChild(card);
        });
        el.appendChild(grid);
        if (layers[cSafeActive]) {
          var cBody = document.createElement('div');
          cBody.style.cssText = 'padding:10px;font-size:13px;line-height:1.5;color:#1f2937;white-space:pre-wrap;overflow-wrap:anywhere;background:#f9fafb;border-radius:6px;border:1px solid #e3ddcd;';
          cBody.textContent = layers[cSafeActive].body;
          el.appendChild(cBody);
        }
      } else if (variant === 'timeline') {
        // Timeline
        var tSafeActive = (openIdx === null || openIdx < 0 || openIdx >= layers.length) ? 0 : openIdx;
        var tl = document.createElement('div');
        tl.style.cssText = 'display:flex;flex-direction:column;gap:0;';
        layers.forEach(function(layer, idx) {
          var isActive = tSafeActive === idx;
          var isPast = idx < tSafeActive;
          var tlRow = document.createElement('div');
          tlRow.style.cssText = 'display:flex;gap:10px;align-items:flex-start;';
          var tlCol = document.createElement('div');
          tlCol.style.cssText = 'display:flex;flex-direction:column;align-items:center;flex-shrink:0;';
          var tlDot = document.createElement('button');
          tlDot.style.cssText = 'width:20px;height:20px;border-radius:50%;border:2px solid ' + (isActive ? '#2563eb' : isPast ? '#2f7d4f' : '#d1d5db') + ';background:' + (isActive ? '#2563eb' : isPast ? '#2f7d4f' : '#fff') + ';color:#fff;font-size:10px;font-weight:700;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;';
          tlDot.textContent = String(idx + 1);
          (function(itemIdx) {
            tlDot.addEventListener('click', function() {
              layeredInfoStates[comp.id] = itemIdx;
              renderPage(currentPageIdx);
            });
          })(idx);
          tlCol.appendChild(tlDot);
          if (idx < layers.length - 1) {
            var tlLine = document.createElement('div');
            tlLine.style.cssText = 'width:2px;height:24px;background:' + (isPast ? '#2f7d4f' : '#d1d5db') + ';';
            tlCol.appendChild(tlLine);
          }
          tlRow.appendChild(tlCol);
          var tlContent = document.createElement('div');
          tlContent.style.cssText = 'flex:1;padding-bottom:12px;';
          var tlTitleBtn = document.createElement('button');
          tlTitleBtn.style.cssText = 'border:none;background:transparent;padding:0;font-size:12px;font-weight:' + (isActive ? '700' : '500') + ';color:' + (isActive ? '#2563eb' : '#1f2937') + ';cursor:pointer;text-align:left;display:block;margin-bottom:2px;';
          tlTitleBtn.textContent = layer.title;
          (function(itemIdx) {
            tlTitleBtn.addEventListener('click', function() {
              layeredInfoStates[comp.id] = itemIdx;
              renderPage(currentPageIdx);
            });
          })(idx);
          tlContent.appendChild(tlTitleBtn);
          if (isActive) {
            var tlBody = document.createElement('div');
            tlBody.style.cssText = 'font-size:12px;line-height:1.5;color:#1f2937;white-space:pre-wrap;overflow-wrap:anywhere;';
            tlBody.textContent = layer.body;
            tlContent.appendChild(tlBody);
          }
          tlRow.appendChild(tlContent);
          tl.appendChild(tlRow);
        });
        el.appendChild(tl);
      }

      return el;
    }

    if (comp.type === 'learning-bridge') {
      el = document.createElement('div');
      var bridgeSkinClass = comp.skinClass || '';
      el.className = bridgeSkinClass ? 'silse-learning-bridge ' + bridgeSkinClass : 'silse-learning-bridge';
      el.style.cssText = style + 'box-sizing:border-box;display:flex;flex-direction:column;gap:10px;overflow:hidden;padding:16px;';

      var bridgeVariantIcon = { transition: '🔀', recap: '✅', preview: '👀' }[comp.bridgeVariant] || '🌉';
      var bridgeVariantLabel = { transition: 'Transisi', recap: 'Recap', preview: 'Preview' }[comp.bridgeVariant] || comp.bridgeVariant;

      var bridgeBadge = document.createElement('div');
      bridgeBadge.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:var(--silse-bridge-muted, currentColor);white-space:normal;overflow-wrap:anywhere;';
      bridgeBadge.textContent = bridgeVariantIcon + ' ' + bridgeVariantLabel;
      el.appendChild(bridgeBadge);

      if (comp.bridgeTitle) {
        var bTitle = document.createElement('strong');
        bTitle.style.cssText = 'font-size:18px;font-weight:700;white-space:normal;overflow-wrap:anywhere;';
        bTitle.textContent = comp.bridgeTitle;
        el.appendChild(bTitle);
      }

      var bMsg = document.createElement('div');
      bMsg.style.cssText = 'font-size:14px;line-height:1.6;white-space:normal;overflow-wrap:anywhere;flex:1;overflow:auto;';
      bMsg.textContent = comp.bridgeMessage || '';
      el.appendChild(bMsg);

      var bBtnWrap = document.createElement('div');
      bBtnWrap.style.cssText = 'display:flex;justify-content:flex-end;margin-top:auto;';
      // DIE-V1 Scope 5: CTA chip uses CSS variables, no hardcoded hex.
      var bChip = document.createElement('div');
      bChip.style.cssText = 'padding:8px 16px;font-size:13px;font-weight:600;border:1px solid var(--silse-bridge-cta-border, currentColor);border-radius:999px;background:var(--silse-bridge-cta-bg, transparent);color:var(--silse-bridge-cta-color, inherit);cursor:default;white-space:normal;overflow-wrap:anywhere;display:inline-flex;align-items:center;gap:6px;min-height:36px;';
      bChip.textContent = (comp.bridgeNextButtonLabel || 'Siap lanjut') + ' →';
      bBtnWrap.appendChild(bChip);
      el.appendChild(bBtnWrap);
      return el;
    }

    return null;
  }

  function navigate(action, target) {
    if (action === 'next' && currentPageIdx < pages.length - 1) {
      renderPage(currentPageIdx + 1);
    } else if (action === 'prev' && currentPageIdx > 0) {
      renderPage(currentPageIdx - 1);
    } else if (action === 'goto' && target) {
      for (var i = 0; i < pages.length; i++) {
        if (pages[i].id === target) {
          renderPage(i);
          break;
        }
      }
    }
  }

  prevBtn.addEventListener('click', function() { navigate('prev'); });
  nextBtn.addEventListener('click', function() { navigate('next'); });

  canvas.addEventListener('click', function(e) {
    var btn = e.target.closest('.silse-nav-btn');
    if (btn) {
      navigate(btn.dataset.action, btn.dataset.target);
    }
  });

  renderPage(0);

  // ===========================================================================
  // GOLDEN-REFERENCE-INTERACTION-P1: Export interaction handlers (lightweight)
  // Wires up tabs, accordion, reveal, timer, save response after each renderPage.
  // Uses event delegation on canvas — no per-element listeners needed.
  // ===========================================================================
  function wireInteractions() {
    if (!canvas) return;

    // Tab click handler
    canvas.addEventListener('click', function(e) {
      var tab = e.target.closest('[data-tab-id]');
      if (tab) {
        var tabId = tab.getAttribute('data-tab-id');
        var tabsContainer = tab.parentElement;
        var panels = tabsContainer.parentElement.querySelectorAll('[data-tab-panel]');
        // Update active states
        var allTabs = tabsContainer.querySelectorAll('[data-tab-id]');
        for (var i = 0; i < allTabs.length; i++) {
          var isActive = allTabs[i].getAttribute('data-tab-id') === tabId;
          allTabs[i].style.background = isActive ? 'var(--silse-gold, #f9c12e)' : 'rgba(255,255,255,0.04)';
          allTabs[i].style.color = isActive ? 'var(--silse-navy, #0e1c2f)' : 'var(--silse-muted-premium, #6e90b5)';
        }
        // Show/hide panels
        for (var j = 0; j < panels.length; j++) {
          panels[j].style.display = panels[j].getAttribute('data-tab-panel') === tabId ? 'block' : 'none';
        }
      }
    });

    // Accordion click handler
    canvas.addEventListener('click', function(e) {
      var accItem = e.target.closest('[data-accordion-idx]');
      if (accItem) {
        var body = accItem.querySelector('.silse-accordion-body');
        if (body) {
          var isOpen = body.style.display !== 'none';
          body.style.display = isOpen ? 'none' : 'block';
          var header = accItem.querySelector('.silse-accordion-header');
          if (header) header.textContent = (isOpen ? '▸' : '▾') + header.textContent.replace(/^[▾▸]\s*/, '');
        }
      }
    });

    // Reveal block click handler
    canvas.addEventListener('click', function(e) {
      var reveal = e.target.closest('.silse-block-reveal');
      if (reveal && reveal.getAttribute('data-reveal-locked') !== 'true') {
        var body = reveal.querySelector('.silse-reveal-body');
        var hint = reveal.querySelector('.silse-reveal-hint');
        if (body && hint) {
          var isHidden = body.style.display === 'none';
          body.style.display = isHidden ? 'block' : 'none';
          hint.style.display = isHidden ? 'none' : 'block';
        }
      }
    });

    // Save response handler
    canvas.addEventListener('click', function(e) {
      var saveBtn = e.target.closest('[data-action="save-response"]');
      if (saveBtn) {
        var wrapper = saveBtn.closest('.silse-block-input');
        if (wrapper) {
          var badge = wrapper.querySelector('.silse-saved-badge');
          if (badge) badge.style.display = 'inline-flex';
          var textarea = wrapper.querySelector('textarea');
          if (textarea) textarea.setAttribute('data-saved', 'true');
        }
      }
    });

    // Timer toggle handler
    canvas.addEventListener('click', function(e) {
      var timerBtn = e.target.closest('[data-action="timer-toggle"]');
      if (timerBtn) {
        var timerEl = timerBtn.closest('.silse-block-timer');
        if (timerEl) {
          var isRunning = timerEl.getAttribute('data-running') === 'true';
          timerEl.setAttribute('data-running', isRunning ? 'false' : 'true');
          timerBtn.textContent = isRunning ? '▶' : '⏸';
          if (!isRunning) {
            // Simple countdown
            var display = timerEl.querySelector('.silse-timer-display');
            var currentSec = parseInt(timerEl.getAttribute('data-remaining') || '300', 10);
            var interval = setInterval(function() {
              if (timerEl.getAttribute('data-running') !== 'true') { clearInterval(interval); return; }
              currentSec--;
              if (currentSec <= 0) { clearInterval(interval); timerEl.setAttribute('data-running', 'false'); timerBtn.textContent = '▶'; return; }
              timerEl.setAttribute('data-remaining', String(currentSec));
              if (display) {
                var m = Math.floor(currentSec / 60);
                var s = currentSec % 60;
                display.textContent = m + ':' + (s < 10 ? '0' + s : s);
              }
            }, 1000);
            timerEl.setAttribute('data-interval-id', String(interval));
          }
        }
      }
    });

    // GOLDEN-REFERENCE-GAME-P1: Classification game interaction
    var gameSelectedItem = null;
    var gameScore = 0;
    canvas.addEventListener('click', function(e) {
      // Select item
      var item = e.target.closest('[data-item-id]');
      if (item && !item.getAttribute('data-placed')) {
        // Deselect previous
        var prevSelected = canvas.querySelector('[data-item-id][data-selected="true"]');
        if (prevSelected) {
          prevSelected.removeAttribute('data-selected');
          prevSelected.style.borderColor = '';
          prevSelected.style.background = '';
        }
        // Select new
        item.setAttribute('data-selected', 'true');
        item.style.borderColor = 'var(--silse-gold, #f9c12e)';
        item.style.background = 'rgba(249,193,46,0.15)';
        gameSelectedItem = item;
        return;
      }
      // Place item in column
      var col = e.target.closest('[data-category]');
      if (col && gameSelectedItem) {
        var category = col.getAttribute('data-category');
        var correctCat = gameSelectedItem.getAttribute('data-correct-cat');
        var isCorrect = correctCat === category;
        var itemId = gameSelectedItem.getAttribute('data-item-id');
        var itemLabel = gameSelectedItem.textContent;
        // Place item in column
        var placedContainer = col.querySelector('.silse-classification-placed-items');
        if (placedContainer) {
          var placed = document.createElement('div');
          placed.className = 'silse-classification-placed-item';
          placed.setAttribute('data-placed-id', itemId);
          placed.style.cssText = 'padding:6px 12px;border-radius:999px;font-size:13px;font-weight:600;background:' + (isCorrect ? 'rgba(52,211,153,0.15)' : 'rgba(255,107,107,0.15)') + ';color:' + (isCorrect ? '#34d399' : '#ff6b6b') + ';';
          placed.textContent = itemLabel;
          placedContainer.appendChild(placed);
        }
        // Mark item as placed
        gameSelectedItem.setAttribute('data-placed', 'true');
        gameSelectedItem.style.display = 'none';
        gameSelectedItem.removeAttribute('data-selected');
        // Update score
        if (isCorrect) gameScore += 10;
        var scoreVal = canvas.querySelector('.silse-game-score-val');
        if (scoreVal) scoreVal.textContent = String(gameScore);
        // Show feedback
        var fb = canvas.querySelector('.silse-classification-feedback');
        if (fb) {
          fb.style.display = 'block';
          fb.style.background = isCorrect ? 'rgba(52,211,153,0.11)' : 'rgba(255,107,107,0.11)';
          fb.style.border = '1px solid ' + (isCorrect ? '#34d399' : '#ff6b6b') + '40';
          fb.style.color = isCorrect ? '#34d399' : '#ff6b6b';
          fb.textContent = isCorrect ? 'Benar! ' + itemLabel + ' → ' + category : 'Belum tepat. ' + itemLabel + ' bukan ' + category + '.';
        }
        gameSelectedItem = null;
        // Check completion
        var remaining = canvas.querySelectorAll('[data-item-id]:not([data-placed])');
        if (remaining.length === 0) {
          var scoreEl2 = canvas.querySelector('.silse-classification-score');
          if (scoreEl2) scoreEl2.innerHTML += ' <span style="color:#34d399">✓ Selesai!</span>';
        }
        return;
      }
      // Reset
      var resetBtn = e.target.closest('[data-action]');
      if (resetBtn && resetBtn.textContent.indexOf('Reset') >= 0) {
        // Reset game
        var allItems = canvas.querySelectorAll('[data-item-id]');
        for (var ri = 0; ri < allItems.length; ri++) {
          allItems[ri].removeAttribute('data-placed');
          allItems[ri].removeAttribute('data-selected');
          allItems[ri].style.display = '';
          allItems[ri].style.borderColor = '';
          allItems[ri].style.background = '';
        }
        var allPlaced = canvas.querySelectorAll('.silse-classification-placed-item');
        for (var pi = 0; pi < allPlaced.length; pi++) allPlaced[pi].remove();
        gameScore = 0;
        gameSelectedItem = null;
        var sv = canvas.querySelector('.silse-game-score-val');
        if (sv) sv.textContent = '0';
        var fb2 = canvas.querySelector('.silse-classification-feedback');
        if (fb2) fb2.style.display = 'none';
      }
    });
  }

  wireInteractions();
})();
`.trim();
}

// ---------------------------------------------------------------------------
// HTML escape
// ---------------------------------------------------------------------------

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------------------
// Main export function
// ---------------------------------------------------------------------------

export function exportProjectToHtml(project: SimpleProject): string {
  const renderModel = buildExportRenderModel(project);
  const renderModelJson = serializeRenderModel(renderModel);
  const profile = getPremiumExportProfile(project.stylePackId);
  const css = generateCSS(renderModel.cssVariables, profile);
  const animProfile = getMicroAnimationForStylePack(project.stylePackId);
  const celebrationProfile = getCelebrationEffectForStylePack(project.stylePackId);
  const js = generateJS(renderModelJson, getCoverClassForStylePack(project.stylePackId), getAllCoverClassNames(), animProfile.pageEnterClass, celebrationProfile.successClass, celebrationProfile.burstClass, celebrationProfile.particleClass);
  const bgPattern = getBackgroundPatternForStylePack(project.stylePackId);

  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHTML(project.title)}</title>
  <style>
${css}
  </style>
</head>
<body>
  <div class="silse-viewport">
    <div id="silse-canvas" class="silse-premium-stage ${bgPattern.pageClass} ${bgPattern.patternClass}">
      <div id="silse-toolbar">
        <span class="silse-toolbar-side">
          <button id="silse-nav-prev">← Sebelumnya</button>
          <span id="silse-page-info">1 / 1</span>
          <button id="silse-nav-next">Berikutnya →</button>
        </span>
        <span id="silse-score" class="silse-score">Skor: 0</span>
      </div>
    </div>
  </div>
  <script>
${js}
  </script>
</body>
</html>`;
}

// Export for testing
export { buildExportRenderModel };
export type { ExportRenderModel, ExportRenderComponent };
