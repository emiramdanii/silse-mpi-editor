/**
 * Tests for AI import (M8).
 * 23 acceptance criteria.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { normalizeAiImportPayload } from '../ai-import/normalizer';
import { checkForbiddenFields } from '../ai-import/forbidden-field-guard';
import type { SilseAiImportPayload } from '../ai-import/ai-import-types';
import { isValidProject } from '../core/validation';
import { CLEAN_CLASSROOM_PACK } from '../core/style-presets';
import { useEditorStore } from '../store/editor-store';

// Mock localStorage for style pack save
const mockStore: Record<string, string> = {};
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => mockStore[k] ?? null,
  setItem: (k: string, v: string) => { mockStore[k] = v; },
  removeItem: (k: string) => { delete mockStore[k]; },
  clear: () => { Object.keys(mockStore).forEach(function(k){delete mockStore[k];}); },
};

function makeValidPayload(): SilseAiImportPayload {
  return {
    schemaVersion: 1,
    source: 'ai',
    project: {
      title: 'MPI PPKn Gotong Royong',
      pages: [
        {
          title: 'Cover',
          components: [
            { type: 'text', text: 'Gotong Royong', variant: 'title' },
          ],
        },
        {
          title: 'Materi',
          components: [
            { type: 'text', text: 'Pengertian', variant: 'body' },
            { type: 'image', src: 'data:image/png;base64,abc', variant: 'illustration' },
            { type: 'card', body: 'Contoh gotong royong', variant: 'exampleCard' },
          ],
        },
        {
          title: 'Penutup',
          components: [
            { type: 'navigation', label: 'Kembali', action: 'prev', variant: 'navigation' },
          ],
        },
      ],
    },
  };
}

// =========================================================================
// 1. Valid AI JSON imports into SimpleProject
// =========================================================================

describe('M8 — valid AI JSON imports', () => {
  it('valid payload produces valid SimpleProject', () => {
    const result = normalizeAiImportPayload(makeValidPayload());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(isValidProject(result.project)).toBe(true);
    expect(result.project.title).toBe('MPI PPKn Gotong Royong');
    expect(result.project.pages).toHaveLength(3);
  });
});

// =========================================================================
// 2. Missing role gets role heuristic
// =========================================================================

describe('M8 — role heuristic', () => {
  it('page 0 with title "Cover" gets role cover', () => {
    const payload = makeValidPayload();
    const result = normalizeAiImportPayload(payload);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.pages[0].role).toBe('cover');
  });

  it('page with title "Materi" gets role material', () => {
    const result = normalizeAiImportPayload(makeValidPayload());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.pages[1].role).toBe('material');
  });

  it('page with title "Penutup" gets role closing', () => {
    const result = normalizeAiImportPayload(makeValidPayload());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.pages[2].role).toBe('closing');
  });

  it('page with unknown title gets role free', () => {
    const payload = makeValidPayload();
    payload.project.pages[1].title = 'Random Page';
    const result = normalizeAiImportPayload(payload);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.pages[1].role).toBe('free');
  });
});

// =========================================================================
// 3. Missing layoutId gets default by role
// =========================================================================

describe('M8 — layoutId default by role', () => {
  it('cover page gets layoutId coverCentered', () => {
    const result = normalizeAiImportPayload(makeValidPayload());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.pages[0].layoutId).toBe('coverCentered');
  });

  it('material page gets layoutId singleColumn', () => {
    const result = normalizeAiImportPayload(makeValidPayload());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.pages[1].layoutId).toBe('singleColumn');
  });

  it('closing page gets layoutId blank', () => {
    const result = normalizeAiImportPayload(makeValidPayload());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.pages[2].layoutId).toBe('blank');
  });
});

// =========================================================================
// 4. Text variant fallback by role
// =========================================================================

describe('M8 — text variant fallback', () => {
  it('text without variant on cover gets title', () => {
    const payload = makeValidPayload();
    payload.project.pages[0].components[0].variant = undefined;
    const result = normalizeAiImportPayload(payload);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const comp = result.project.pages[0].components[0] as { variant: string };
    expect(comp.variant).toBe('title');
  });

  it('text without variant on material gets body', () => {
    const payload = makeValidPayload();
    payload.project.pages[1].components[0].variant = undefined;
    const result = normalizeAiImportPayload(payload);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const comp = result.project.pages[1].components[0] as { variant: string };
    expect(comp.variant).toBe('body');
  });
});

// =========================================================================
// 5. Invalid component type rejected
// =========================================================================

describe('M8 — invalid component type rejected', () => {
  it('unknown component type produces error', () => {
    const payload = makeValidPayload();
    (payload.project.pages[1].components[0] as { type: string }).type = 'unknown';
    const result = normalizeAiImportPayload(payload);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join('; ')).toMatch(/unknown|type/i);
  });
});

// =========================================================================
// 6. Capability violation rejected
// =========================================================================

describe('M8 — capability violation rejected', () => {
  it('image on cover (not allowed) rejected', () => {
    const payload = makeValidPayload();
    payload.project.pages[0].components.push({
      type: 'image',
      src: 'test.png',
      variant: 'illustration',
    });
    const result = normalizeAiImportPayload(payload);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join('; ')).toMatch(/not allowed|capability/i);
  });
});

// =========================================================================
// 7-11. Forbidden fields rejected
// =========================================================================

describe('M8 — forbidden fields rejected', () => {
  it('html field rejected', () => {
    const payload = makeValidPayload();
    (payload as Record<string, unknown>).html = '<script>x</script>';
    const result = normalizeAiImportPayload(payload);
    expect(result.ok).toBe(false);
  });

  it('css field rejected', () => {
    const payload = makeValidPayload();
    (payload as Record<string, unknown>).css = 'body { color: red; }';
    const result = normalizeAiImportPayload(payload);
    expect(result.ok).toBe(false);
  });

  it('script field rejected', () => {
    const payload = makeValidPayload();
    (payload as Record<string, unknown>).script = 'alert(1)';
    const result = normalizeAiImportPayload(payload);
    expect(result.ok).toBe(false);
  });

  it('className field rejected', () => {
    const payload = makeValidPayload();
    (payload.project.pages[0] as Record<string, unknown>).className = 'my-class';
    const result = normalizeAiImportPayload(payload);
    expect(result.ok).toBe(false);
  });

  it('nested forbidden field rejected with path', () => {
    const obj = {
      project: {
        pages: [
          {
            components: [
              { type: 'text', text: 'ok', className: 'bad' },
            ],
          },
        ],
      },
    };
    const guardResult = checkForbiddenFields(obj);
    expect(guardResult.ok).toBe(false);
    if (guardResult.ok) return;
    expect(guardResult.errors.join('; ')).toMatch(/className/);
    expect(guardResult.errors.join('; ')).toMatch(/pages.*components.*className|components.*className/);
  });
});

// =========================================================================
// 12-13. Style pack import
// =========================================================================

describe('M8 — style pack import', () => {
  beforeEach(() => { Object.keys(mockStore).forEach(function(k){delete mockStore[k];}); });

  it('valid stylePack imported and saved', () => {
    const payload = makeValidPayload();
    payload.stylePack = CLEAN_CLASSROOM_PACK;
    const result = normalizeAiImportPayload(payload);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.stylePackId).toBe('cleanClassroom');
    expect(result.project.style).toBeDefined();
  });

  it('invalid stylePack rejected', () => {
    const payload = makeValidPayload();
    payload.stylePack = { ...CLEAN_CLASSROOM_PACK, id: '' } as typeof CLEAN_CLASSROOM_PACK;
    const result = normalizeAiImportPayload(payload);
    expect(result.ok).toBe(false);
  });

  it('missing stylePack uses DEFAULT_STYLE_PACK', () => {
    const result = normalizeAiImportPayload(makeValidPayload());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.stylePackId).toBe('cleanClassroom');
  });
});

// =========================================================================
// 14. Imported project passes validateProject
// =========================================================================

describe('M8 — imported project validation', () => {
  it('normalized project passes validateProject', () => {
    const result = normalizeAiImportPayload(makeValidPayload());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(isValidProject(result.project)).toBe(true);
  });
});

// =========================================================================
// 15. Generated ids are fresh
// =========================================================================

describe('M8 — fresh ids', () => {
  it('project id is fresh (not from payload)', () => {
    const result = normalizeAiImportPayload(makeValidPayload());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.id).toMatch(/^proj_/);
  });

  it('page ids are fresh', () => {
    const result = normalizeAiImportPayload(makeValidPayload());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const page of result.project.pages) {
      expect(page.id).toMatch(/^page_/);
    }
  });

  it('component ids are fresh', () => {
    const result = normalizeAiImportPayload(makeValidPayload());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const page of result.project.pages) {
      for (const comp of page.components) {
        expect(comp.id).toMatch(/^comp_/);
      }
    }
  });

  it('two normalizations produce different ids', () => {
    const r1 = normalizeAiImportPayload(makeValidPayload());
    const r2 = normalizeAiImportPayload(makeValidPayload());
    expect(r1.ok && r2.ok).toBe(true);
    if (!r1.ok || !r2.ok) return;
    expect(r1.project.id).not.toBe(r2.project.id);
  });
});

// =========================================================================
// 16. No raw HTML/CSS/JS parser
// =========================================================================

describe('M8 — no raw HTML/CSS/JS parser', () => {
  it('normalizer does not import DOMParser or parse HTML', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const content = fs.readFileSync(path.resolve(__dirname, '../ai-import/normalizer.ts'), 'utf8');
    expect(content).not.toMatch(/DOMParser/i);
    expect(content).not.toMatch(/parseFromString/i);
    expect(content).not.toMatch(/innerHTML/i);
  });
});

// =========================================================================
// 17-18. UI checks
// =========================================================================

describe('M8 — UI checks', () => {
  it('Toolbar has Impor AI JSON button', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const content = fs.readFileSync(path.resolve(__dirname, '../editor/Toolbar.tsx'), 'utf8');
    expect(content).toMatch(/Impor AI JSON/);
    expect(content).toMatch(/data-action="ai-import"/);
  });

  it('Toolbar does NOT have Import HTML button', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const content = fs.readFileSync(path.resolve(__dirname, '../editor/Toolbar.tsx'), 'utf8');
    expect(content).not.toMatch(/Import HTML/i);
  });
});

// =========================================================================
// 19. Store scope-lock
// =========================================================================

describe('M8 — store scope-lock', () => {
  it('store does NOT expose quiz/game/scoring/drag/setPageRole', () => {
    const s = useEditorStore.getState() as Record<string, unknown>;
    expect(s.addQuestion).toBeUndefined();
    expect(s.addGame).toBeUndefined();
    expect(s.addScoring).toBeUndefined();
    expect(s.startDrag).toBeUndefined();
    expect(s.setPageRole).toBeUndefined();
  });
});

// =========================================================================
// 20. ESM guard still pass
// =========================================================================

describe('M8 — ESM guard', () => {
  it('ai-import normalizer does not use CommonJS require', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const content = fs.readFileSync(path.resolve(__dirname, '../ai-import/normalizer.ts'), 'utf8');
    expect(content).not.toMatch(/\brequire\s*\(/);
  });
});
