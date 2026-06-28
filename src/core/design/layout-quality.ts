/**
 * Layout Quality Checker (DESIGN-INTELLIGENCE-ENGINE-V1).
 *
 * Layer: core/design (pure function, no React/DOM)
 * Allowed imports: ../types, ./design-tokens
 *
 * Kontrak (DIE-V1 Scope 4):
 *   validateLayoutQuality(page) → { ok, score, issues[] }
 *   Cek: komponen keluar kanvas, mepet tepi, overlap besar,
 *   width/height terlalu kecil, navigation terlalu dekat tepi,
 *   halaman terlalu padat, komponen terlalu banyak.
 */

import type { SimplePage } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './design-tokens';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LayoutIssueSeverity = 'warning' | 'error';

export type LayoutIssue = {
  severity: LayoutIssueSeverity;
  code: string;
  message: string;
};

export type LayoutQualityResult = {
  ok: boolean;
  score: number;
  issues: LayoutIssue[];
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_COMPONENT_WIDTH = 80;
const MIN_COMPONENT_HEIGHT = 40;
const EDGE_MARGIN = 40;
const OVERLAP_THRESHOLD = 0.3;
const MAX_COMPONENTS_PER_PAGE = 12;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Rect = { x: number; y: number; width: number; height: number };

function rectArea(r: Rect): number {
  return r.width * r.height;
}

function rectOverlap(a: Rect, b: Rect): number {
  const xOverlap = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const yOverlap = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return xOverlap * yOverlap;
}

// ---------------------------------------------------------------------------
// Main: validateLayoutQuality
// ---------------------------------------------------------------------------

export function validateLayoutQuality(page: SimplePage): LayoutQualityResult {
  const issues: LayoutIssue[] = [];
  const comps = page.components;

  // 1. Komponen keluar kanvas
  for (const c of comps) {
    if (c.x < 0 || c.y < 0) {
      issues.push({
        severity: 'error',
        code: 'OUT_OF_CANVAS',
        message: `Komponen "${(c as { text?: string; title?: string }).title ?? (c as { text?: string }).text ?? c.type}" posisi (x:${c.x}, y:${c.y}) keluar kanvas.`,
      });
    }
    if (c.x + c.width > CANVAS_WIDTH) {
      issues.push({
        severity: 'error',
        code: 'OUT_OF_CANVAS',
        message: `Komponen "${(c as { title?: string }).title ?? c.type}" sisi kanan (${c.x + c.width}) melebihi lebar kanvas (${CANVAS_WIDTH}).`,
      });
    }
    if (c.y + c.height > CANVAS_HEIGHT) {
      issues.push({
        severity: 'error',
        code: 'OUT_OF_CANVAS',
        message: `Komponen "${(c as { title?: string }).title ?? c.type}" sisi bawah (${c.y + c.height}) melebihi tinggi kanvas (${CANVAS_HEIGHT}).`,
      });
    }
  }

  // 2. Komponen terlalu mepet tepi
  for (const c of comps) {
    if (c.x > 0 && c.x < EDGE_MARGIN) {
      issues.push({
        severity: 'warning',
        code: 'TOO_CLOSE_EDGE',
        message: `Komponen "${(c as { title?: string }).title ?? c.type}" terlalu mepet tepi kiri (x:${c.x}). Minimal ${EDGE_MARGIN}px.`,
      });
    }
    if (c.y > 0 && c.y < EDGE_MARGIN) {
      issues.push({
        severity: 'warning',
        code: 'TOO_CLOSE_EDGE',
        message: `Komponen "${(c as { title?: string }).title ?? c.type}" terlalu mepet tepi atas (y:${c.y}). Minimal ${EDGE_MARGIN}px.`,
      });
    }
    if (c.x + c.width > CANVAS_WIDTH - EDGE_MARGIN && c.x + c.width < CANVAS_WIDTH) {
      issues.push({
        severity: 'warning',
        code: 'TOO_CLOSE_EDGE',
        message: `Komponen "${(c as { title?: string }).title ?? c.type}" terlalu mepet tepi kanan.`,
      });
    }
  }

  // 3. Width/height terlalu kecil
  for (const c of comps) {
    if (c.width < MIN_COMPONENT_WIDTH) {
      issues.push({
        severity: 'warning',
        code: 'TOO_SMALL',
        message: `Komponen "${(c as { title?: string }).title ?? c.type}" lebar (${c.width}) terlalu kecil. Minimal ${MIN_COMPONENT_WIDTH}px.`,
      });
    }
    if (c.height < MIN_COMPONENT_HEIGHT) {
      issues.push({
        severity: 'warning',
        code: 'TOO_SMALL',
        message: `Komponen "${(c as { title?: string }).title ?? c.type}" tinggi (${c.height}) terlalu kecil. Minimal ${MIN_COMPONENT_HEIGHT}px.`,
      });
    }
  }

  // 4. Overlap besar
  for (let i = 0; i < comps.length; i++) {
    for (let j = i + 1; j < comps.length; j++) {
      const a = comps[i];
      const b = comps[j];
      const overlap = rectOverlap(a, b);
      const minArea = Math.min(rectArea(a), rectArea(b));
      if (minArea > 0 && overlap / minArea > OVERLAP_THRESHOLD) {
        issues.push({
          severity: 'warning',
          code: 'LARGE_OVERLAP',
          message: `Komponen "${(a as { title?: string }).title ?? a.type}" dan "${(b as { title?: string }).title ?? b.type}" overlap ${(Math.round((overlap / minArea) * 100))}%.`,
        });
      }
    }
  }

  // 5. Navigation terlalu dekat tepi
  for (const c of comps) {
    if (c.type === 'navigation') {
      if (c.x < EDGE_MARGIN || c.y < EDGE_MARGIN ||
          c.x + c.width > CANVAS_WIDTH - EDGE_MARGIN ||
          c.y + c.height > CANVAS_HEIGHT - EDGE_MARGIN) {
        // Already caught by edge checks above, skip duplicate
      }
      // Check if navigation is at very bottom edge (common dead-end pattern)
      if (c.y + c.height >= CANVAS_HEIGHT - 10 && c.y + c.height <= CANVAS_HEIGHT) {
        issues.push({
          severity: 'warning',
          code: 'NAV_AT_EDGE',
          message: `Tombol navigasi terlalu mepet tepi bawah kanvas.`,
        });
      }
    }
  }

  // 6. Halaman terlalu padat
  if (comps.length > MAX_COMPONENTS_PER_PAGE) {
    issues.push({
      severity: 'warning',
      code: 'TOO_DENSE',
      message: `Halaman punya ${comps.length} komponen (maksimal disarankan ${MAX_COMPONENTS_PER_PAGE}). Pertimbangkan pecah ke halaman lain.`,
    });
  }

  // Calculate score
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const score = Math.max(0, 100 - errorCount * 20 - warningCount * 5);

  return {
    ok: errorCount === 0,
    score,
    issues,
  };
}
