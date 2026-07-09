#!/usr/bin/env python3
"""
Fix hardcoded colors and overflow in export-html.ts.

Strategy:
1. Replace specific hardcoded color literals with CSS variables.
   - When the color is a fallback after `|| ' or `?? ' use the form: 'var(--silse-color-X, var(--color-Y))'
   - When the color is a direct literal in cssText, replace with 'var(--color-Y)' or 'var(--silse-color-X, var(--color-Y))' depending on context
2. Change `overflow:auto` to `overflow:hidden` in the quiz/game/learning scene wrapper cssText
3. Change `overflow-x:hidden;overflow-y:auto;` to `overflow:hidden;` in exportShell

Be conservative: only change lines that contain specific hex codes identified in the audit.
"""
import re

PATH = '/home/z/my-project/silse-mpi-editor/src/export/export-html.ts'

with open(PATH, 'r', encoding='utf-8') as f:
    src = f.read()

original = src

# ----- 1. Fix overflow:auto -> overflow:hidden in quiz/game/learning scene wrappers -----
# Pattern: cssText = '...overflow:auto;'
# Only for the scene wrappers (game-mission, quiz, learning, standalone game/question components)
src = src.replace(
    "wrapper.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;gap:10px;padding:16px;box-sizing:border-box;overflow:auto;';",
    "wrapper.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;gap:10px;padding:16px;box-sizing:border-box;overflow:hidden;';"
)
src = src.replace(
    "wrapper.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;gap:12px;padding:16px;box-sizing:border-box;overflow:auto;';",
    "wrapper.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;gap:12px;padding:16px;box-sizing:border-box;overflow:hidden;';"
)

# ----- 2. Fix exportShell overflow -----
# Look for the exportShell definition (line ~1907)
src = re.sub(
    r"(shell\.style\.cssText = '[^']*?)overflow-x:hidden;overflow-y:auto;",
    r"\1overflow:hidden;",
    src
)

# ----- 3. Fix standalone component wrappers (game, question, layered-info) -----
# Lines 3089, 3367, 3467, 3596 — overflow:auto;padding:...
src = re.sub(
    r"(cssText = '[^']*?)overflow:auto;padding:18px 20px;",
    r"\1overflow:hidden;padding:18px 20px;",
    src
)
src = re.sub(
    r"(cssText = '[^']*?)overflow:auto;padding:12px;",
    r"\1overflow:hidden;padding:12px;",
    src
)

# ----- 4. Replace specific hardcoded colors in quiz/game scene renderers -----

# Game-mission briefing (line 1443-1444)
src = src.replace(
    "briefingCss += 'background:' + (surf.background || '#fffbeb') + ';';",
    "briefingCss += 'background:' + (surf.background || 'var(--silse-color-warning-soft, var(--color-warning-soft))') + ';';"
)
src = src.replace(
    "briefingCss += 'border:' + (surf.border || '1px solid #fde68a') + ';';",
    "briefingCss += 'border:' + (surf.border || '1px solid var(--silse-color-warning, var(--color-warning))') + ';';"
)
# Briefing label color #92400e
src = src.replace(
    "briefingLabel.style.cssText = 'font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;margin-bottom:4px;';",
    "briefingLabel.style.cssText = 'font-size:11px;font-weight:700;color:var(--silse-color-warning, var(--color-warning));text-transform:uppercase;margin-bottom:4px;';"
)
# Briefing text should have explicit text color
src = src.replace(
    "briefingText.style.cssText = 'font-size:15px;font-weight:600;';",
    "briefingText.style.cssText = 'font-size:15px;font-weight:600;color:var(--silse-color-text, var(--color-text));';"
)

# Game-mission target (line 1459)
src = src.replace(
    "target.style.cssText = 'padding:12px;border-radius:10px;background:#eff6ff;border:1px solid #bfdbfe;';",
    "target.style.cssText = 'padding:12px;border-radius:10px;background:var(--silse-color-primary, var(--color-accent-soft));border:1px solid var(--silse-color-primary, var(--color-accent));';"
)
# Target label color #1e40af
src = src.replace(
    "targetLabel.style.cssText = 'font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;margin-bottom:4px;';",
    "targetLabel.style.cssText = 'font-size:11px;font-weight:700;color:var(--silse-color-primary, var(--color-accent));text-transform:uppercase;margin-bottom:4px;';"
)
# Target text color
src = src.replace(
    "targetText.style.cssText = 'font-size:14px;';",
    "targetText.style.cssText = 'font-size:14px;color:var(--silse-color-text, var(--color-text));';"
)

# Game-mission action grid (line 1473)
src = src.replace(
    "actionGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill, minmax(220px, 1fr));gap:10px;';",
    "actionGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill, minmax(180px, 1fr));gap:8px;';"
)
# Action card (line 1479)
src = src.replace(
    "card.style.cssText = 'padding:14px;border-radius:12px;background:#fff;border:2px solid #d1d5db;cursor:pointer;font-size:14px;font-weight:600;min-height:80px;display:flex;flex-direction:column;gap:6px;';",
    "card.style.cssText = 'padding:12px;border-radius:12px;background:var(--silse-color-surface, var(--color-panel));border:2px solid var(--silse-color-border, var(--color-border));cursor:pointer;font-size:14px;font-weight:600;color:var(--silse-color-text, var(--color-text));min-height:64px;display:flex;flex-direction:column;gap:6px;';"
)
# Letter badge (line 1483)
src = src.replace(
    "letterBadge.style.cssText = 'display:inline-grid;place-items:center;min-width:28px;height:28px;border-radius:8px;background:#1d3557;color:#fff;font-size:13px;font-weight:900;';",
    "letterBadge.style.cssText = 'display:inline-grid;place-items:center;min-width:28px;height:28px;border-radius:8px;background:var(--silse-color-primary, var(--color-accent));color:var(--silse-color-surface, var(--color-panel));font-size:13px;font-weight:900;';"
)
# Action label #6b7280 (line 1487)
src = src.replace(
    "actionLabel.style.cssText = 'font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;';",
    "actionLabel.style.cssText = 'font-size:11px;font-weight:700;color:var(--silse-color-muted-text, var(--color-muted));text-transform:uppercase;';"
)

# Game-mission reward (line 1502)
src = src.replace(
    "reward.style.cssText = 'padding:12px;border-radius:10px;background:#fffbeb;border:2px solid #fbbf24;display:flex;align-items:center;gap:12px;';",
    "reward.style.cssText = 'padding:12px;border-radius:10px;background:var(--silse-color-warning-soft, var(--color-warning-soft));border:2px solid var(--silse-color-warning, var(--color-warning));display:flex;align-items:center;gap:12px;';"
)
# Reward label #92400e (line 1509)
src = src.replace(
    "rewardTextLabel.style.cssText = 'font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;';",
    "rewardTextLabel.style.cssText = 'font-size:11px;font-weight:700;color:var(--silse-color-warning, var(--color-warning));text-transform:uppercase;';"
)
# Reward text value
src = src.replace(
    "rewardTextValue.style.cssText = 'font-size:14px;';",
    "rewardTextValue.style.cssText = 'font-size:14px;color:var(--silse-color-text, var(--color-text));';"
)

# ----- 5. Quiz scene -----
# Quiz panel border fallback #d1d5db (line 1531)
src = src.replace(
    "var quizPanelBorder = ansCard.border || (plan.palette ? plan.palette.border : '#d1d5db');",
    "var quizPanelBorder = ansCard.border || (plan.palette ? plan.palette.border : 'var(--silse-color-border, var(--color-border))');"
)
# Quiz panel background #f8fafc (line 1550)
src = src.replace(
    "promptCss += 'background:' + (panel.background || '#f8fafc') + ';';",
    "promptCss += 'background:' + (panel.background || 'var(--silse-color-surface, var(--color-panel))') + ';';"
)
# Quiz panel needs explicit text color
src = src.replace(
    "var promptCss = 'font-size:17px;font-weight:600;';",
    "var promptCss = 'font-size:17px;font-weight:600;color:' + (plan.palette ? plan.palette.text : 'var(--silse-color-text, var(--color-text))') + ';';"
)
# Quiz answer grid minmax
src = src.replace(
    "answerGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill, minmax(240px, 1fr));gap:10px;';",
    "answerGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill, minmax(200px, 1fr));gap:10px;';"
)
# Quiz answer card #fff bg (line 1568)
src = src.replace(
    "cardCss += 'background:' + (ansCard.background || '#fff') + ';';",
    "cardCss += 'background:' + (ansCard.background || 'var(--silse-color-surface, var(--color-panel))') + ';';"
)
# Quiz answer card min-height 60
src = src.replace(
    "cardCss += 'cursor:pointer;font-size:14px;font-weight:600;min-height:60px;display:flex;align-items:center;gap:12px;transition:all 0.18s ease;';",
    "cardCss += 'cursor:pointer;font-size:14px;font-weight:600;min-height:52px;color:' + (plan.palette ? plan.palette.text : 'var(--silse-color-text, var(--color-text))') + ';display:flex;align-items:center;gap:12px;transition:all 0.18s ease;';"
)
# Quiz letter badge #fff color (line 1577)
src = src.replace(
    "letterBadge.style.cssText = 'display:inline-grid;place-items:center;min-width:32px;height:32px;border-radius:' + (badge.radius != null ? badge.radius : 8) + 'px;background:' + (badge.background || 'var(--silse-color-primary)') + ';color:' + (badge.color || '#fff') + ';font-size:14px;font-weight:900;flex-shrink:0;';",
    "letterBadge.style.cssText = 'display:inline-grid;place-items:center;min-width:32px;height:32px;border-radius:' + (badge.radius != null ? badge.radius : 8) + 'px;background:' + (badge.background || 'var(--silse-color-primary, var(--color-accent))') + ';color:' + (badge.color || 'var(--silse-color-surface, var(--color-panel))') + ';font-size:14px;font-weight:900;flex-shrink:0;';"
)

# ----- 6. Learning scene -----
# Learning surf border fallback #e5e7eb (line 1614)
src = src.replace(
    "var surfBorder = surf.border || (plan.card ? plan.card.border : '1px solid #e5e7eb');",
    "var surfBorder = surf.border || (plan.card ? plan.card.border : '1px solid var(--silse-color-border, var(--color-border))');"
)

# ----- 7. Update choice CSS rules in generated CSS strings -----
# Lines 675-676, 697-698 — .silse-choice-default:hover, .silse-choice-selected
src = src.replace(
    ".silse-choice-default:hover { border-left-color:var(--silse-color-primary,#2563eb); }",
    ".silse-choice-default:hover { border-left-color:var(--silse-color-primary,var(--color-accent)); }"
)
src = src.replace(
    ".silse-choice-selected { border-left:3px solid var(--silse-color-primary,#2563eb); box-shadow:inset 0 0 0 1px rgba(37,99,235,0.2); }",
    ".silse-choice-selected { border-left:3px solid var(--silse-color-primary,var(--color-accent)); box-shadow:inset 0 0 0 1px rgba(30,91,143,0.2); }"
)
src = src.replace(
    ".silse-choice-default:hover { border-left-color:var(--silse-color-primary,#2563eb); box-shadow:0 2px 8px rgba(37,99,235,0.12); transform:translateY(-1px); }",
    ".silse-choice-default:hover { border-left-color:var(--silse-color-primary,var(--color-accent)); box-shadow:0 2px 8px rgba(30,91,143,0.12); transform:translateY(-1px); }"
)
src = src.replace(
    ".silse-choice-selected { border-left:3px solid var(--silse-color-primary,#2563eb); box-shadow:inset 0 0 0 1px rgba(37,99,235,0.2),0 2px 12px rgba(37,99,235,0.15); background:linear-gradient(135deg,rgba(37,99,235,0.06) 0%,rgba(37,99,235,0.02) 100%); }",
    ".silse-choice-selected { border-left:3px solid var(--silse-color-primary,var(--color-accent)); box-shadow:inset 0 0 0 1px rgba(30,91,143,0.2),0 2px 12px rgba(30,91,143,0.15); background:linear-gradient(135deg,rgba(30,91,143,0.06) 0%,rgba(30,91,143,0.02) 100%); }"
)

# Skin button clean (line 630) - color:#fff is for button on accent bg, ok to keep
# But let's make it use --silse-color-surface with fallback
src = src.replace(
    ".skin-button-clean { border:1px solid var(--silse-color-primary); border-radius:6px; background:var(--silse-color-primary); color:#fff; font-weight:600; box-shadow:0 1px 2px rgba(37,99,235,0.2); }",
    ".skin-button-clean { border:1px solid var(--silse-color-primary, var(--color-accent)); border-radius:6px; background:var(--silse-color-primary, var(--color-accent)); color:var(--silse-color-surface, var(--color-panel)); font-weight:600; box-shadow:0 1px 2px rgba(30,91,143,0.2); }"
)
src = src.replace(
    ".skin-button-rounded { border:none; border-radius:24px; background:linear-gradient(135deg,var(--silse-color-primary) 0%,var(--silse-color-secondary) 100%); color:#fff; font-weight:600; box-shadow:0 2px 6px rgba(245,158,11,0.3); }",
    ".skin-button-rounded { border:none; border-radius:24px; background:linear-gradient(135deg,var(--silse-color-primary, var(--color-accent)) 0%,var(--silse-color-secondary, var(--color-warning)) 100%); color:var(--silse-color-surface, var(--color-panel)); font-weight:600; box-shadow:0 2px 6px rgba(185,116,14,0.3); }"
)

# ----- 8. Other standalone component renderer fixes (lines 3089, 3367, 3467, 3596) -----
# These have specific overflows that we already converted via regex above
# Now their hardcoded colors - check at the specific lines below
# Game-mission standalone (line ~3089)
src = src.replace(
    "compWrap.style.cssText = 'position:relative;width:100%;height:100%;display:flex;flex-direction:column;gap:10px;padding:18px 20px;overflow:auto;box-sizing:border-box;';",
    "compWrap.style.cssText = 'position:relative;width:100%;height:100%;display:flex;flex-direction:column;gap:10px;padding:18px 20px;overflow:hidden;box-sizing:border-box;color:var(--silse-color-text, var(--color-text));';"
)

# ----- 9. Inject :root CSS variables into exported HTML <head> -----
# This ensures the editor theme tokens are available in the exported HTML
# even if no style pack is set. Look for the <style> generation in generateCSS.
# Actually the generateCSS function already includes :root with --silse-* tokens.
# We need to ALSO add the editor's --color-* tokens as fallback.
# Find the :root block in generateCSS

# Insert editor theme tokens as fallback defaults for --silse-color-* (line ~358)
old_root_block = """:root {
${varsStr}
  --silse-navy: ${c.navy};"""

new_root_block = """:root {
  /* Editor theme tokens — always available as fallback when style pack doesn't override */
  --color-bg: #f8f6f1;
  --color-panel: #ffffff;
  --color-panel-soft: #fbfaf7;
  --color-border: #e3ddcd;
  --color-border-strong: #c8be9f;
  --color-text: #1f2533;
  --color-text-soft: #4a5160;
  --color-muted: #8a8775;
  --color-accent: #1e5b8f;
  --color-accent-hover: #184b76;
  --color-accent-soft: #e8f0f8;
  --color-success: #2f7d4f;
  --color-success-soft: #e1f3e8;
  --color-warning: #b9740e;
  --color-warning-soft: #fdf3e1;
  --color-danger: #c0392b;
  --color-danger-soft: #fbe6e3;
${varsStr}
  --silse-navy: ${c.navy};"""

src = src.replace(old_root_block, new_root_block)

if src == original:
    print("WARNING: No changes made")
else:
    with open(PATH, 'w', encoding='utf-8') as f:
        f.write(src)
    print(f"OK: wrote {len(src)} bytes (delta {len(src) - len(original)} chars)")
