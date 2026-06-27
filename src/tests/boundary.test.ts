/**
 * Boundary test — anti V5 contamination.
 *
 * This test scans every file under src/ (excluding this test file itself)
 * and asserts that none of the forbidden V5 identifiers appear in the
 * source code. If any forbidden string is found, the build fails.
 *
 * See docs/CLEAN_ARCHITECTURE.md for the rationale.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC_DIR = resolve(__dirname, '..');
const SELF = __filename;

const FORBIDDEN_IDENTIFIERS = [
  'CourseTemplateRegistry',
  'TemplateThemeContract',
  'PagePresetRegistry',
  'CoverRenderer',
  'SchemaRenderer',
  'silse-fresh',
  'silse-studio',
  'norma-golden',
  'modern-educator',
  'golden-pertemuan',
  'academic-clean',
] as const;

function listFiles(dir: string, acc: string[] = []): string[] {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      listFiles(full, acc);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry) && full !== SELF) {
      acc.push(full);
    }
  }
  return acc;
}

function readFileSafe(path: string): string {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return '';
  }
}

describe('boundary — no V5 contamination in src/', () => {
  const files = listFiles(SRC_DIR);

  it('found at least one source file to scan', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const id of FORBIDDEN_IDENTIFIERS) {
    it(`no source file references forbidden identifier: ${id}`, () => {
      const offenders: string[] = [];
      for (const f of files) {
        const content = readFileSafe(f);
        if (content.includes(id)) {
          offenders.push(f);
        }
      }
      expect(offenders).toEqual([]);
    });
  }

  it('no source file imports from a V5-style "legacy" path', () => {
    const legacyPatterns = [
      /from\s+['"][^'"]*\/legacy\//,
      /from\s+['"][^'"]*\/v5\//,
      /from\s+['"][^'"]*\/v4\//,
      /from\s+['"][^'"]*silse-fresh/,
      /from\s+['"][^'"]*silse-studio/,
    ];
    const offenders: string[] = [];
    for (const f of files) {
      const content = readFileSafe(f);
      for (const re of legacyPatterns) {
        if (re.test(content)) {
          offenders.push(`${f} (matched ${re})`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
