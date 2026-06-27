/**
 * ESM runtime guard test — M7 PATCH.
 *
 * Memastikan tidak ada CommonJS patterns (require/module.exports/exports.)
 * di src/ runtime files (excluding tests/).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC_DIR = resolve(__dirname, '..');

function listSrcFiles(dir: string, acc: string[] = []): string[] {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      // Skip tests directory (test files may use require for node:fs etc.)
      if (entry !== 'tests') {
        listSrcFiles(full, acc);
      }
    } else if (/\.(ts|tsx)$/.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

describe('M7 PATCH — no CommonJS require() in src runtime', () => {
  const srcFiles = listSrcFiles(SRC_DIR);

  it('found src runtime files to scan', () => {
    expect(srcFiles.length).toBeGreaterThan(0);
  });

  for (const file of srcFiles) {
    const relPath = file.replace(SRC_DIR + '/', '');
    it(`${relPath} does NOT contain require()`, () => {
      const content = readFileSync(file, 'utf8');
      // Check for require( pattern (CommonJS dynamic require)
      expect(content).not.toMatch(/\brequire\s*\(/);
    });
  }
});

describe('M7 PATCH — no module.exports / exports. in src runtime', () => {
  const srcFiles = listSrcFiles(SRC_DIR);

  for (const file of srcFiles) {
    const relPath = file.replace(SRC_DIR + '/', '');
    it(`${relPath} does NOT contain module.exports`, () => {
      const content = readFileSync(file, 'utf8');
      expect(content).not.toMatch(/module\.exports/);
    });

    it(`${relPath} does NOT contain exports.`, () => {
      const content = readFileSync(file, 'utf8');
      expect(content).not.toMatch(/\bexports\./);
    });
  }
});
