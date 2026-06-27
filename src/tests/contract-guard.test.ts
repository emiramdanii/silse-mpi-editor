/**
 * Contract guard test — Batch 1B.
 *
 * Memastikan bahwa kontrak yang dikunci di Batch 1B hadir sebagai dokumen
 * dan tidak dilanggar di kode src/.
 *
 * Test ini TIDAK menguji isi dokumen secara mendalam (itu tugas review manusia).
 * Test ini hanya memastikan:
 *   1. 5 dokumen kontrak wajib ada di docs/.
 *   2. Tidak ada identifier "engine besar" yang bocor ke src/ (selain yang
 *      sudah diizinkan di kontrak).
 *   3. Tidak ada 3-renderer terpisah (editor/preview/export menulis style
 *      sendiri) — ini akan aktif penuh setelah M6; untuk B1B hanya cek
 *      bahwa tidak ada file duplikat bernama `*-style.ts` di 3 layer.
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
