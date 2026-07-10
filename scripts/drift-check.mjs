#!/usr/bin/env node
/**
 * drift-check.mjs — find CSS rules that are duplicated between
 * src/styles.css and src/export/export-html.ts:generateCSS(), and classify
 * each duplicated selector as IDENTICAL (safe to extract in 3a) or DRIFTED
 * (defer to 3b).
 *
 * Approach:
 *   1. Tokenise each file into individual CSS rules (selector + body).
 *   2. Normalise whitespace WITHIN each rule body for comparison only
 *      (this won't be the production form — extraction preserves original).
 *   3. Build selector → [styles_body, export_body] map.
 *   4. For selectors present in BOTH files, classify:
 *        IDENTICAL  → safe to extract in 3a
 *        DRIFTED    → defer to 3b (behaviour would change if unified)
 *   5. Report selectors present in only one file (these are NOT duplicated
 *      and stay where they are).
 *
 * Output: per-selector status + summary count.
 */
import { readFileSync } from 'node:fs';

const stylesCss = readFileSync('src/styles.css', 'utf8');
const exportTs = readFileSync('src/export/export-html.ts', 'utf8');

// Extract only the generateCSS template literal body. We do this by finding
// `const baseCss = \`` and capturing until the closing `\``.trim();
const exportCssMatch = exportTs.match(/const\s+baseCss\s*=\s*`([\s\S]*?)`\s*\.\s*trim\(\)/);
if (!exportCssMatch) {
  console.error('Could not find baseCss template literal in export-html.ts');
  process.exit(1);
}
const exportCss = exportCssMatch[1];

// Remove the leading `:root { ... }` block from both — it has many tokens
// and is intentionally not duplicated (both define their own :root). Also
// skip @keyframes (they're namespaced by name, not selector — handle separately).
function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Tokenise a CSS source into individual top-level rules.
 * Returns array of { selector, body, full } where:
 *   - selector: the part before `{`, trimmed
 *   - body: the part between `{` and `}` (without braces), trimmed
 *   - full: the original text (with original whitespace)
 * Handles nested braces (e.g. @media) by depth-counting.
 */
function tokeniseRules(css) {
  const src = stripComments(css);
  const rules = [];
  let i = 0;
  while (i < src.length) {
    // Skip whitespace.
    while (i < src.length && /\s/.test(src[i])) i++;
    if (i >= src.length) break;

    // Find the next `{`.
    let braceStart = -1;
    let j = i;
    while (j < src.length) {
      if (src[j] === '{') { braceStart = j; break; }
      if (src[j] === '}') { break; } // stray closing brace, skip
      j++;
    }
    if (braceStart === -1) break;

    const selector = src.slice(i, braceStart).trim();
    // Find matching close brace (depth-aware).
    let depth = 1;
    let k = braceStart + 1;
    while (k < src.length && depth > 0) {
      if (src[k] === '{') depth++;
      else if (src[k] === '}') depth--;
      k++;
    }
    const body = src.slice(braceStart + 1, k - 1).trim();
    const full = src.slice(i, k).trim();
    rules.push({ selector, body, full });
    i = k;
  }
  return rules;
}

/**
 * Normalise a CSS body for semantic comparison.
 * Strip ALL whitespace (since CSS is whitespace-insensitive except inside
 * strings/urls). Also strip trailing `;` before `}` (CSS-spec-equivalent).
 */
function normaliseBody(body) {
  // Strip whitespace OUTSIDE of url(...) and quoted strings.
  let out = '';
  let inString = false;
  let stringChar = '';
  let inUrl = false;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (inString) {
      out += ch;
      if (ch === stringChar && body[i - 1] !== '\\') inString = false;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
      out += ch;
      continue;
    }
    // Detect url( ... )
    if (ch === 'u' && body.slice(i, i + 4) === 'url(') {
      inUrl = true;
      out += 'url(';
      i += 3; // skip to char before (
      continue;
    }
    if (inUrl) {
      if (ch === ')') { inUrl = false; out += ch; continue; }
      out += ch;
      continue;
    }
    if (/\s/.test(ch)) continue;
    out += ch;
  }
  // Strip trailing `;` (CSS-spec-equivalent: `prop:val;}` == `prop:val}`).
  out = out.replace(/;+/g, ';').replace(/;(?=[}])/g, '');
  return out;
}

const stylesRules = tokeniseRules(stylesCss);
const exportRules = tokeniseRules(exportCss);

// Build selector → bodies maps.
// Note: selectors can be repeated (e.g. `.silse-choice-correct` appears twice
// in styles.css — once base, once VISUAL-PREMIUM-01 override). For comparison,
// we keep ALL bodies per selector as a list.
const stylesMap = new Map();
for (const r of stylesRules) {
  if (!stylesMap.has(r.selector)) stylesMap.set(r.selector, []);
  stylesMap.get(r.selector).push(normaliseBody(r.body));
}
const exportMap = new Map();
for (const r of exportRules) {
  if (!exportMap.has(r.selector)) exportMap.set(r.selector, []);
  exportMap.get(r.selector).push(normaliseBody(r.body));
}

// Find duplicated selectors (present in BOTH files).
const allSelectors = new Set([...stylesMap.keys(), ...exportMap.keys()]);
const duplicated = [];
const onlyStyles = [];
const onlyExport = [];
for (const sel of allSelectors) {
  const inS = stylesMap.has(sel);
  const inE = exportMap.has(sel);
  if (inS && inE) duplicated.push(sel);
  else if (inS) onlyStyles.push(sel);
  else onlyExport.push(sel);
}

// For duplicated selectors, check if bodies match.
let identical = 0;
let drifted = 0;
const driftedSelectors = [];
const identicalSelectors = [];

// Sort: put .silse-* first, then #silse-*, then everything else.
duplicated.sort((a, b) => {
  const aSilse = a.startsWith('.silse-') ? 0 : a.startsWith('#silse-') ? 1 : 2;
  const bSilse = b.startsWith('.silse-') ? 0 : b.startsWith('#silse-') ? 1 : 2;
  if (aSilse !== bSilse) return aSilse - bSilse;
  return a.localeCompare(b);
});

console.log('=== Premium CSS Drift Check (3a pre-extraction) ===\n');
console.log(`Total CSS rules: styles.css=${stylesRules.length}, export-html.ts=${exportRules.length}`);
console.log(`Unique selectors: ${allSelectors.size}`);
console.log(`  Duplicated (in both files): ${duplicated.length}`);
console.log(`  Only in styles.css: ${onlyStyles.length}`);
console.log(`  Only in export-html.ts: ${onlyExport.length}`);
console.log('');

console.log('--- Duplicated selectors: drift status ---');
for (const sel of duplicated) {
  const sBodies = stylesMap.get(sel);
  const eBodies = exportMap.get(sel);
  // A selector is IDENTICAL if every body in styles.css has a matching body
  // in export-html.ts (same multiset).
  const sameCount = sBodies.length === eBodies.length;
  let sameContent = sameCount;
  if (sameCount) {
    const sSorted = [...sBodies].sort();
    const eSorted = [...eBodies].sort();
    for (let i = 0; i < sSorted.length; i++) {
      if (sSorted[i] !== eSorted[i]) { sameContent = false; break; }
    }
  } else {
    sameContent = false;
  }
  if (sameContent) {
    identical++;
    identicalSelectors.push(sel);
    console.log(`✅ ${sel}`);
  } else {
    drifted++;
    driftedSelectors.push(sel);
    console.log(`❌ ${sel}  (styles has ${sBodies.length} occurrence(s), export has ${eBodies.length})`);
    // Show first body diff
    const sFirst = sBodies[0];
    const eFirst = eBodies[0];
    if (sFirst !== eFirst) {
      console.log(`   styles : ${sFirst.slice(0, 180)}`);
      console.log(`   export : ${eFirst.slice(0, 180)}`);
    }
  }
}

console.log(`\n=== Summary ===`);
console.log(`✅ Identical (safe to extract in 3a): ${identical}`);
console.log(`❌ Drifted  (defer to 3b): ${drifted}`);
console.log(`📊 Only in styles.css: ${onlyStyles.length} (not duplicated)`);
console.log(`📊 Only in export-html.ts: ${onlyExport.length} (not duplicated)`);

// Save selector lists for use in extraction.
import { writeFileSync } from 'node:fs';
writeFileSync('/tmp/drift-identical.json', JSON.stringify(identicalSelectors, null, 2));
writeFileSync('/tmp/drift-drifted.json', JSON.stringify(driftedSelectors, null, 2));
writeFileSync('/tmp/drift-only-styles.json', JSON.stringify(onlyStyles, null, 2));
writeFileSync('/tmp/drift-only-export.json', JSON.stringify(onlyExport, null, 2));
console.log('\nSelector lists written to /tmp/drift-*.json for downstream use.');
