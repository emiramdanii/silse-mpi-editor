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
  pages: ExportRenderPage[];
  cssVariables: Record<string, string>;
};

type ExportRenderPage = {
  id: string;
  title: string;
  background: SimplePage['background'];
  components: ExportRenderComponent[];
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
    background: page.background,
    components: page.components.map((component) =>
      buildExportRenderComponent(project, page, component),
    ),
  }));

  return { title: project.title, pages, cssVariables };
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

function generateCSS(cssVars: Record<string, string>): string {
  const varsStr = generateCssVariablesString(cssVars);

  return `
:root {
${varsStr}
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--silse-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  background: #1a1a1a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}

#silse-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  color: #fff;
  font-size: 14px;
  align-items: center;
}

#silse-toolbar button {
  background: rgba(255,255,255,0.1);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.2);
  padding: 6px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

#silse-toolbar button:disabled { opacity: 0.4; cursor: not-allowed; }
#silse-toolbar button:hover:not(:disabled) { background: rgba(255,255,255,0.2); }

#silse-canvas {
  width: ${CANVAS_WIDTH}px;
  height: ${CANVAS_HEIGHT}px;
  background: var(--silse-color-background, #ffffff);
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.3);
  flex-shrink: 0;
}

#silse-canvas .silse-nav-btn {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
`.trim();
}

// ---------------------------------------------------------------------------
// JS generation — reads from render model, NO style switch
// ---------------------------------------------------------------------------

function generateJS(renderModelJson: string): string {
  return `
(function() {
  var MODEL = ${renderModelJson};
  var pages = MODEL.pages;
  var currentPageIdx = 0;

  var canvas = document.getElementById('silse-canvas');
  var prevBtn = document.getElementById('silse-nav-prev');
  var nextBtn = document.getElementById('silse-nav-next');
  var pageInfo = document.getElementById('silse-page-info');

  function renderPage(idx) {
    if (idx < 0 || idx >= pages.length) return;
    currentPageIdx = idx;
    var page = pages[idx];
    canvas.innerHTML = '';

    // Set background
    if (page.background.type === 'color') {
      canvas.style.background = page.background.color;
    } else if (page.background.type === 'gradient') {
      canvas.style.background = page.background.gradient;
    } else if (page.background.type === 'image') {
      canvas.style.background = 'url(' + page.background.imageSrc + ') center/cover no-repeat';
    }

    // Render components — style from resolvedStyle, NO switch
    for (var i = 0; i < page.components.length; i++) {
      var comp = page.components[i];
      var el = renderComponent(comp);
      if (el) canvas.appendChild(el);
    }

    prevBtn.disabled = (currentPageIdx === 0);
    nextBtn.disabled = (currentPageIdx === pages.length - 1);
    pageInfo.textContent = (currentPageIdx + 1) + ' / ' + pages.length + ' - ' + page.title;
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

  function renderComponent(comp) {
    var style = buildInlineStyle(comp);
    var el;

    if (comp.type === 'text') {
      el = document.createElement('div');
      el.style.cssText = style + 'display:flex;align-items:center;overflow:hidden;white-space:pre-wrap;word-break:break-word;box-sizing:border-box;';
      el.textContent = comp.text || '';
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
      el.style.cssText = style + 'box-sizing:border-box;display:flex;flex-direction:column;gap:8px;overflow:hidden;';
      if (comp.cardTitle) {
        var title = document.createElement('strong');
        title.style.fontSize = '16px';
        title.textContent = comp.cardTitle;
        el.appendChild(title);
      }
      var body = document.createElement('div');
      body.style.cssText = 'font-size:14px;line-height:1.5;white-space:pre-wrap;word-break:break-word;flex:1;overflow:auto;';
      body.textContent = comp.body || '';
      el.appendChild(body);
      return el;
    }

    if (comp.type === 'navigation') {
      el = document.createElement('button');
      el.className = 'silse-nav-btn';
      el.dataset.action = comp.action;
      el.dataset.target = comp.targetPageId || '';
      el.style.cssText = style + 'cursor:pointer;display:flex;align-items:center;justify-content:center;user-select:none;';

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
  const css = generateCSS(renderModel.cssVariables);
  const js = generateJS(renderModelJson);

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
  <div id="silse-toolbar">
    <button id="silse-nav-prev">← Sebelumnya</button>
    <span id="silse-page-info">1 / 1</span>
    <button id="silse-nav-next">Berikutnya →</button>
  </div>
  <div id="silse-canvas"></div>
  <script>
${js}
  </script>
</body>
</html>`;
}

// Export for testing
export { buildExportRenderModel };
export type { ExportRenderModel, ExportRenderComponent };
