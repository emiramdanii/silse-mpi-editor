/**
 * Contract guard test — Batch 1B + Batch 2S.
 *
 * Memastikan bahwa kontrak yang dikunci hadir sebagai dokumen
 * dan tidak dilanggar di kode src/.
 *
 * Test ini TIDAK menguji isi dokumen secara mendalam (itu tugas review manusia).
 * Test ini hanya memastikan:
 *   1. Dokumen kontrak wajib ada di docs/ (incl. AI_IMPORT_CONTRACT.md — Batch 2S).
 *   2. Tidak ada identifier "engine besar" yang bocor ke src/.
 *   3. Tidak ada 3-renderer terpisah.
 *   4. (Batch 2S) ROADMAP tidak menyebut "Import HTML ringan".
 *   5. (Batch 2S) User-facing roadmap memakai component/elemen, bukan "block".
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = resolve(__dirname, '../..');
const DOCS_DIR = join(REPO_ROOT, 'docs');
const SRC_DIR = join(REPO_ROOT, 'src');

const REQUIRED_DOCS = [
  'CORE_PRODUCT_CONTRACT.md',
  'STYLE_SCHEMA_CONTRACT.md',
  'CLEAN_ARCHITECTURE.md',
  'EXPORT_HTML_CONTRACT.md',
  'AI_IMPORT_CONTRACT.md',
  'ROADMAP.md',
  'PRODUCTION_ROADMAP.md',
];

// Identifier "engine besar" yang dilarang muncul di src/.
// Catatan: identifier ini boleh muncul di docs/ (sebagai dokumentasi kontrak),
// tetapi TIDAK boleh di src/ (sebagai implementasi).
//
// KONSTRUKSI: semua identifier dipecah jadi 2 string agar test ini sendiri
// tidak trigger scan (yang membaca isi file src/ termasuk test files).
// Boundary.test.ts sudah cover 'Schema' + 'Renderer' (V5 identifier).
const ENGINE = 'Engine';
const REGISTRY = 'Registry';
const FORBIDDEN_ENGINE_PREFIXES = [
  'Style' + ENGINE,
  'Template' + ENGINE,
  'Contract' + ENGINE,
  'Theme' + REGISTRY,
  'Style' + REGISTRY,
] as const;

function listSrcFiles(dir: string, acc: string[] = []): string[] {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      listSrcFiles(full, acc);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

describe('contract guard — Batch 1B dokumen wajib ada', () => {
  for (const doc of REQUIRED_DOCS) {
    it(`docs/${doc} exists`, () => {
      const path = join(DOCS_DIR, doc);
      expect(existsSync(path)).toBe(true);
    });

    it(`docs/${doc} is non-empty`, () => {
      const path = join(DOCS_DIR, doc);
      if (!existsSync(path)) return;
      const content = readFileSync(path, 'utf8');
      expect(content.trim().length).toBeGreaterThan(100);
    });
  }
});

describe('contract guard — tidak ada "engine besar" di src/', () => {
  const srcFiles = listSrcFiles(SRC_DIR);

  it('found at least one source file to scan', () => {
    expect(srcFiles.length).toBeGreaterThan(0);
  });

  for (const id of FORBIDDEN_ENGINE_PREFIXES) {
    it(`no source file references forbidden engine identifier: ${id}`, () => {
      const offenders: string[] = [];
      for (const f of srcFiles) {
        const content = readFileSync(f, 'utf8');
        if (content.includes(id)) {
          offenders.push(f);
        }
      }
      expect(offenders).toEqual([]);
    });
  }
});

describe('contract guard — tidak ada style logic duplikat di editor/preview/export', () => {
  // Setelah M6, style logic harus terpusat di core/style/.
  // Untuk B1B, kita hanya cek bahwa belum ada file `style.ts` / `style.tsx`
  // duplikat di editor/, preview/, dan export/ secara bersamaan.
  // (Saat ini hanya ada stub preview/export, jadi test ini trivially pass.)

  it('does not have separate style files in editor/, preview/, AND export/ simultaneously', () => {
    const layers = ['editor', 'preview', 'export'];
    const layersWithStyleFile: string[] = [];

    for (const layer of layers) {
      const layerDir = join(SRC_DIR, layer);
      if (!existsSync(layerDir)) continue;
      const files = readdirSync(layerDir);
      const hasStyleFile = files.some(
        (f) => /style\.ts$|style\.tsx$|styles\.ts$/.test(f) && !f.endsWith('.css'),
      );
      if (hasStyleFile) layersWithStyleFile.push(layer);
    }

    // Jika 2 atau lebih layer punya file style logic sendiri, itu pertanda
    // style bercabang — pelanggaran kontrak editor=preview=export.
    expect(layersWithStyleFile.length).toBeLessThan(2);
  });
});

// =========================================================================
// Batch 2S — AI Remix Roadmap Lock
// =========================================================================

describe('contract guard Batch 2S — AI import must be JSON SILSE, not HTML', () => {
  const ROADMAP_FILES = ['ROADMAP.md', 'PRODUCTION_ROADMAP.md'];

  for (const file of ROADMAP_FILES) {
    it(`${file} M8 section does NOT mention "Import HTML ringan" as a feature`, () => {
      const path = join(DOCS_DIR, file);
      const content = readFileSync(path, 'utf8');

      // Extract M8 section (from "## M8" to next "## " heading)
      const m8Match = content.match(/^## M8\b.*?(?=^## )/ms);
      expect(m8Match).not.toBeNull();
      const m8Section = m8Match![0];

      // M8 section must NOT mention "Import HTML ringan" as a feature
      expect(m8Section).not.toMatch(/Import HTML ringan/i);
      // M8 section must NOT list "Import HTML" + positive descriptor as feature
      expect(m8Section).not.toMatch(/Import HTML\s+(ringan|sederhana|bebas|parse)/i);
    });

    it(`${file} M8 section explicitly forbids raw HTML/CSS/script`, () => {
      const path = join(DOCS_DIR, file);
      const content = readFileSync(path, 'utf8');
      const m8Match = content.match(/^## M8\b.*?(?=^## )/ms);
      expect(m8Match).not.toBeNull();
      const m8Section = m8Match![0];

      // M8 should mention forbidding raw HTML / CSS / script
      expect(m8Section).toMatch(/Raw HTML parsing/i);
      expect(m8Section).toMatch(/Raw CSS parsing/i);
    });
  }

  it('AI_IMPORT_CONTRACT.md exists and mentions JSON SILSE', () => {
    const path = join(DOCS_DIR, 'AI_IMPORT_CONTRACT.md');
    expect(existsSync(path)).toBe(true);
    const content = readFileSync(path, 'utf8');
    expect(content).toMatch(/JSON SILSE/i);
    expect(content).toMatch(/Dilarang/i);
    expect(content).toMatch(/raw HTML/i);
  });
});

describe('contract guard Batch 2S — user-facing roadmap uses component/elemen, not block', () => {
  const ROADMAP_FILES = ['ROADMAP.md', 'PRODUCTION_ROADMAP.md'];

  for (const file of ROADMAP_FILES) {
    it(`${file} does NOT use "block" as user-facing feature name in M3+ sections`, () => {
      const path = join(DOCS_DIR, file);
      const content = readFileSync(path, 'utf8');

      // Find sections M3 onward (skip M0-M2 history which mentions "block" legitimately).
      const m3Index = content.search(/^## M3\b/m);
      expect(m3Index).toBeGreaterThan(0);
      const futureSection = content.slice(m3Index);

      // Forbidden user-facing phrases (positive feature descriptions using "block")
      const forbiddenPhrases = [
        /Drag block/i,
        /Resize block/i,
        /Pilih block/i,
        /Tambah block/i,
        /block variant/i,
        /Image block/i,
        /Button block/i,
        /Question block/i,
      ];

      for (const re of forbiddenPhrases) {
        expect(futureSection).not.toMatch(re);
      }
    });

    it(`${file} uses "komponen" or "elemen" in feature descriptions`, () => {
      const path = join(DOCS_DIR, file);
      const content = readFileSync(path, 'utf8');
      const m3Index = content.search(/^## M3\b/m);
      const futureSection = content.slice(m3Index);
      // Should mention "komponen" or "elemen" at least once
      expect(futureSection).toMatch(/komponen|elemen/i);
    });
  }
});
