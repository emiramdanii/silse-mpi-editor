/**
 * Export HTML module for silse-mpi-editor.
 *
 * Layer: export
 * Allowed imports: ../core (types, style resolver, style-presets)
 *
 * Kontrak (Batch 6 / M6):
 *   - Satu file HTML standalone.
 *   - CSS inline dalam <style>.
 *   - JS inline dalam <script>.
 *   - Data project embedded sebagai JSON literal.
 *   - Tidak ada CDN, external script, external stylesheet.
 *   - Tidak ada React/Vite runtime.
 *   - Render page 1280×720, navigate next/prev/goto.
 *   - StylePack tokens sebagai CSS variables.
 *   - Security: escape `</script>` in project data.
 */

import type { SimpleProject } from '../core/types';
import type { ProjectStyle } from '../core/style-types';

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

// ---------------------------------------------------------------------------
// Security: escape `</script>` in JSON data
// ---------------------------------------------------------------------------

/**
 * Serialize project data safely for embedding in <script> tag.
 * Escapes `</script>` to prevent XSS / premature script termination.
 */
function serializeProjectData(project: SimpleProject): string {
  const json = JSON.stringify(project);
  // Escape </script> to prevent premature script termination
  return json.replace(/<\/script>/gi, '<\\/script>');
}

// ---------------------------------------------------------------------------
// CSS variables from StylePack tokens
// ---------------------------------------------------------------------------

function generateCssVariables(style: ProjectStyle | undefined): string {
  if (!style) return '';

  const { colors, typography, spacing, radius, shadow } = style.tokens;

  const vars: string[] = [
    `  --silse-color-background: ${colors.background};`,
    `  --silse-color-surface: ${colors.surface};`,
    `  --silse-color-primary: ${colors.primary};`,
    `  --silse-color-secondary: ${colors.secondary};`,
    `  --silse-color-text: ${colors.text};`,
    `  --silse-color-muted-text: ${colors.mutedText};`,
    `  --silse-color-border: ${colors.border};`,
    `  --silse-color-success: ${colors.success};`,
    `  --silse-color-warning: ${colors.warning};`,
    `  --silse-color-danger: ${colors.danger};`,
    `  --silse-font-family: ${typography.fontFamily};`,
    `  --silse-title-size: ${typography.titleSize}px;`,
    `  --silse-subtitle-size: ${typography.subtitleSize}px;`,
    `  --silse-body-size: ${typography.bodySize}px;`,
    `  --silse-small-size: ${typography.smallSize}px;`,
    `  --silse-line-height: ${typography.lineHeight};`,
    `  --silse-spacing-page-padding: ${spacing.pagePadding}px;`,
    `  --silse-spacing-component-gap: ${spacing.componentGap}px;`,
    `  --silse-spacing-card-padding: ${spacing.cardPadding}px;`,
    `  --silse-radius-small: ${radius.small}px;`,
    `  --silse-radius-medium: ${radius.medium}px;`,
    `  --silse-radius-large: ${radius.large}px;`,
    `  --silse-shadow-none: ${shadow.none};`,
    `  --silse-shadow-soft: ${shadow.soft};`,
    `  --silse-shadow-medium: ${shadow.medium};`,
  ];

  return vars.join('\n');
}

// ---------------------------------------------------------------------------
// Component rendering for export
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
// CSS generation
// ---------------------------------------------------------------------------

function generateCSS(style: ProjectStyle | undefined): string {
  const cssVars = generateCssVariables(style);

  return `
:root {
${cssVars}
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
  transition: transform 0.15s ease-out, box-shadow 0.15s ease-out;
}

#silse-canvas .silse-nav-btn:hover {
  transform: scale(1.05);
}

#silse-canvas .silse-nav-btn:active {
  transform: scale(0.96);
}
`.trim();
}

// ---------------------------------------------------------------------------
// JS generation (inline, no external dependencies)
// ---------------------------------------------------------------------------

function generateJS(projectData: string): string {
  return `
(function() {
  var PROJECT = ${projectData};
  var pages = PROJECT.pages;
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

    // Render components
    for (var i = 0; i < page.components.length; i++) {
      var comp = page.components[i];
      var html = renderComponent(comp, page.role, page.layoutId);
      if (html) canvas.insertAdjacentHTML('beforeend', html);
    }

    // Update nav buttons
    prevBtn.disabled = (currentPageIdx === 0);
    nextBtn.disabled = (currentPageIdx === pages.length - 1);
    pageInfo.textContent = (currentPageIdx + 1) + ' / ' + pages.length + ' - ' + page.title;
  }

  function renderComponent(comp, pageRole, layoutId) {
    var style = PROJECT.style;
    var tokens = style ? style.tokens : null;
    if (!tokens) return '';

    var geometryStyle = 'position:absolute;left:' + comp.x + 'px;top:' + comp.y + 'px;width:' + comp.width + 'px;height:' + comp.height + 'px;';
    var resolvedStyle = '';

    if (comp.type === 'text') {
      var fontSize, color, fontWeight, textAlign;
      switch (comp.variant) {
        case 'title': fontSize = tokens.typography.titleSize + 'px'; color = tokens.colors.text; fontWeight = 'bold'; break;
        case 'subtitle': fontSize = tokens.typography.subtitleSize + 'px'; color = tokens.colors.mutedText; fontWeight = 'normal'; break;
        case 'instruction': fontSize = tokens.typography.bodySize + 'px'; color = tokens.colors.primary; fontWeight = 'normal'; break;
        case 'importantNote': fontSize = tokens.typography.bodySize + 'px'; color = tokens.colors.warning; fontWeight = 'bold'; break;
        case 'questionPrompt': fontSize = tokens.typography.subtitleSize + 'px'; color = tokens.colors.text; fontWeight = 'bold'; break;
        case 'reflectionBox': fontSize = tokens.typography.bodySize + 'px'; color = tokens.colors.secondary; fontWeight = 'normal'; break;
        default: fontSize = tokens.typography.bodySize + 'px'; color = tokens.colors.text; fontWeight = 'normal'; break;
      }
      resolvedStyle = 'font-size:' + fontSize + ';color:' + color + ';font-weight:' + fontWeight + ';display:flex;align-items:center;padding:0 4px;overflow:hidden;white-space:pre-wrap;word-break:break-word;';
      return '<div style="' + geometryStyle + resolvedStyle + '">' + escapeHtml(comp.text) + '</div>';
    }

    if (comp.type === 'image') {
      var border, borderRadius, boxShadow;
      switch (comp.variant) {
        case 'illustration': border = '1px solid ' + tokens.colors.border; borderRadius = tokens.radius.medium + 'px'; boxShadow = tokens.shadow.soft; break;
        case 'background': border = 'none'; borderRadius = '0'; boxShadow = 'none'; break;
        case 'imageCard': border = '2px solid ' + tokens.colors.primary; borderRadius = tokens.radius.large + 'px'; boxShadow = tokens.shadow.medium; break;
        default: border = '1px solid ' + tokens.colors.border; borderRadius = tokens.radius.medium + 'px'; boxShadow = tokens.shadow.soft; break;
      }
      resolvedStyle = 'border:' + border + ';border-radius:' + borderRadius + ';box-shadow:' + boxShadow + ';overflow:hidden;';
      return '<div style="' + geometryStyle + resolvedStyle + '"><img src="' + comp.src + '" alt="' + escapeHtml(comp.alt || '') + '" style="width:100%;height:100%;object-fit:' + comp.objectFit + ';display:block;pointer-events:none;" /></div>';
    }

    if (comp.type === 'card') {
      var cardBg, cardBorder, cardColor;
      switch (comp.variant) {
        case 'infoCard': cardBg = tokens.colors.surface; cardBorder = '1px solid ' + tokens.colors.border; cardColor = tokens.colors.text; break;
        case 'importantNote': cardBg = tokens.colors.surface; cardBorder = '1px solid ' + tokens.colors.warning; cardColor = tokens.colors.warning; break;
        case 'exampleCard': cardBg = tokens.colors.surface; cardBorder = '1px solid ' + tokens.colors.success; cardColor = tokens.colors.text; break;
        default: cardBg = tokens.colors.surface; cardBorder = '1px solid ' + tokens.colors.border; cardColor = tokens.colors.text; break;
      }
      resolvedStyle = 'background-color:' + cardBg + ';border:' + cardBorder + ';border-radius:' + tokens.radius.medium + 'px;color:' + cardColor + ';padding:' + tokens.spacing.cardPadding + 'px;display:flex;flex-direction:column;gap:8px;overflow:hidden;';
      var titleHtml = comp.title ? '<strong style="font-size:16px;">' + escapeHtml(comp.title) + '</strong>' : '';
      return '<div style="' + geometryStyle + resolvedStyle + '">' + titleHtml + '<div style="font-size:14px;line-height:1.5;white-space:pre-wrap;word-break:break-word;flex:1;overflow:auto;">' + escapeHtml(comp.body) + '</div></div>';
    }

    if (comp.type === 'navigation') {
      var navBg, navColor, navBorder;
      switch (comp.variant) {
        case 'navigation': navBg = tokens.colors.surface; navColor = tokens.colors.text; navBorder = '2px solid ' + tokens.colors.border; break;
        case 'primaryAction': navBg = tokens.colors.primary; navColor = '#ffffff'; navBorder = '2px solid ' + tokens.colors.primary; break;
        case 'secondaryAction': navBg = '#ffffff'; navColor = tokens.colors.primary; navBorder = '2px solid ' + tokens.colors.primary; break;
        case 'choice': navBg = tokens.colors.surface; navColor = tokens.colors.warning; navBorder = '2px solid ' + tokens.colors.warning; break;
        default: navBg = tokens.colors.surface; navColor = tokens.colors.text; navBorder = '2px solid ' + tokens.colors.border; break;
      }
      resolvedStyle = 'background-color:' + navBg + ';color:' + navColor + ';border:' + navBorder + ';border-radius:' + tokens.radius.medium + 'px;font-size:' + tokens.typography.bodySize + 'px;font-weight:normal;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform 0.15s ease-out;';
      return '<button class="silse-nav-btn" data-action="' + comp.action + '" data-target="' + (comp.targetPageId || '') + '" style="' + geometryStyle + resolvedStyle + '">' + escapeHtml(comp.label) + '</button>';
    }

    return '';
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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

  // Event listeners
  prevBtn.addEventListener('click', function() { navigate('prev'); });
  nextBtn.addEventListener('click', function() { navigate('next'); });

  canvas.addEventListener('click', function(e) {
    var btn = e.target.closest('.silse-nav-btn');
    if (btn) {
      navigate(btn.dataset.action, btn.dataset.target);
    }
  });

  // Initialize
  renderPage(0);
})();
`.trim();
}

// ---------------------------------------------------------------------------
// Main export function
// ---------------------------------------------------------------------------

/**
 * Render a SimpleProject as a standalone HTML string.
 *
 * Output: satu file HTML dengan:
 *   - CSS inline dalam <style>
 *   - JS inline dalam <script>
 *   - Data project embedded (escaped for security)
 *   - Tidak ada CDN, external script, external stylesheet
 *   - Tidak ada React/Vite runtime
 *   - Render page 1280×720
 *   - Navigate next/prev/goto
 *   - StylePack tokens sebagai CSS variables
 */
export function exportProjectToHtml(project: SimpleProject): string {
  const projectData = serializeProjectData(project);
  const css = generateCSS(project.style);
  const js = generateJS(projectData);

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
