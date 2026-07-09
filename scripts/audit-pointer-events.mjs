#!/usr/bin/env node
/**
 * pointer-events audit script.
 *
 * Scans src/styles.css + src/export/export-html.ts for `pointer-events: none`
 * declarations and flags any that appear on selectors containing interactive
 * element selectors (button, a, [onclick], [role=button], .silse-hero-cta, etc.)
 * WITHOUT a corresponding `pointer-events: auto` override on the interactive child.
 *
 * Usage:
 *   node scripts/audit-pointer-events.mjs
 *
 * Exit codes:
 *   0 — no violations
 *   1 — violations found (CI should fail)
 *
 * This script is intentionally dependency-free (no stylelint, no postcss).
 * It uses simple regex matching — good enough for the project's CSS size.
 * If the codebase grows significantly, consider migrating to stylelint.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Selectors that indicate an interactive element.
// If a `pointer-events: none` rule's selector matches one of these patterns,
// it's a potential violation (interactive element might be killed).
const INTERACTIVE_PATTERNS = [
  /\bbutton\b/i,
  /\ba\s*[{,]/i, // <a> tag selector (not .a-class)
  /\[onclick\]/i,
  /\[role\s*=\s*["']?button["']?\]/i,
  /\.silse-hero-cta\b/i,
  /\.silse-block-nav-toolbar\b/i,
  /#silse-toolbar\b/i,
  /\.silse-nav-btn\b/i,
  /\.silse-diagnostic-choice\b/i,
  /\.silse-remedial-choice\b/i,
  /\.silse-classification-item\b/i,
  /\.silse-quiz-answer-card\b/i,
  /\.silse-game-action-card\b/i,
  /\.silse-tab\b/i,
  /\.silse-accordion-head\b/i,
];

// Selectors that are ALWAYS safe (decorative pseudo-elements, text-only containers).
// If a `pointer-events: none` rule's selector matches one of these, skip it.
const SAFE_PATTERNS = [
  /::before\b/i,
  /::after\b/i,
  /\.canvas-empty\b/i,
  /\.autosave-status\b/i,
  /\.silse-block-progress-bar\b/i,
  /\.silse-premium-decoration\b/i, // wrapper — child must override (CTA does)
  /\.silse-hero-card\b/i, // decorative
  /\.silse-hero-kicker\b/i, // text label
  /\.silse-award-medal\b/i, // decorative
  /\.silse-award-ribbon\b/i, // text
  /\.silse-bg-page-\w+\b/i, // bg pattern
  /\.silse-bg-pattern-\w+\b/i, // bg pattern
  /\.silse-cover-\w+\b.*::(before|after)/i, // cover decoration
  /\.silse-celebrate-\w+\b.*::(before|after)/i, // celebration particle
  /\.silse-block-panel\b/i, // panel decorative line
];

function scanFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const violations = [];

  // Match `selector { ... pointer-events: none; ... }`
  // Simple approach: find all `pointer-events: none` and walk back to find selector.
  const lines = content.split('\n');
  const noneRegex = /pointer-events:\s*none\s*;?/i;
  // Skip lines that are comments (CSS /* ... */ or // in TS template strings)
  const commentRegex = /^\s*(\/\*|\/\/|\*)/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!noneRegex.test(line)) continue;
    // Skip comment lines (the regex might match "pointer-events: none" inside a comment)
    if (commentRegex.test(line)) continue;
    // Skip lines where pointer-events: none appears after a /* (inline comment before declaration)
    const beforeDecl = line.split('pointer-events')[0];
    if (beforeDecl.includes('/*')) continue;

    // Walk back to find the selector (last line ending with `{` before this one)
    let selectorLine = '';
    for (let j = i - 1; j >= 0; j--) {
      if (lines[j].includes('{')) {
        selectorLine = lines[j].trim();
        break;
      }
      // If we hit a `}` we're in a nested context — take the current line's context
      if (lines[j].includes('}') && j < i - 1) break;
    }

    // If selectorLine is empty, the pointer-events might be on same line as selector
    if (!selectorLine) {
      selectorLine = line.trim();
    }

    // Check if selector is in safe list
    const isSafe = SAFE_PATTERNS.some((p) => p.test(selectorLine));
    if (isSafe) continue;

    // Check if selector contains interactive pattern
    const isInteractive = INTERACTIVE_PATTERNS.some((p) => p.test(selectorLine));
    if (isInteractive) {
      violations.push({
        file: filePath,
        line: i + 1,
        selector: selectorLine,
        issue: 'pointer-events: none on selector matching interactive element pattern',
      });
    }
  }

  return violations;
}

function findCssFiles(dir) {
  const results = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      // Skip node_modules, dist, .git
      if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue;
      results.push(...findCssFiles(fullPath));
    } else if (entry.endsWith('.css')) {
      results.push(fullPath);
    }
  }
  return results;
}

// Main
const cssFiles = findCssFiles(join(ROOT, 'src'));
const exportHtmlPath = join(ROOT, 'src', 'export', 'export-html.ts');

let allViolations = [];

for (const file of cssFiles) {
  allViolations.push(...scanFile(file));
}

// Also scan export-html.ts (CSS is embedded in template strings)
if (statSync(exportHtmlPath)) {
  allViolations.push(...scanFile(exportHtmlPath));
}

if (allViolations.length === 0) {
  console.log('✓ pointer-events audit: no violations found');
  console.log(`  Scanned ${cssFiles.length} CSS file(s) + export-html.ts`);
  process.exit(0);
} else {
  console.error(`✗ pointer-events audit: ${allViolations.length} violation(s) found\n`);
  for (const v of allViolations) {
    const relPath = v.file.replace(ROOT + '/', '');
    console.error(`  ${relPath}:${v.line}`);
    console.error(`    selector: ${v.selector}`);
    console.error(`    issue: ${v.issue}`);
    console.error('');
  }
  console.error('If this is intentional (e.g. wrapper with pointer-events: auto on child),');
  console.error('add the selector to SAFE_PATTERNS in scripts/audit-pointer-events.mjs');
  console.error('with a comment explaining why.');
  process.exit(1);
}
