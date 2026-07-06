/**
 * C-03 + UX-01 + C-04 — Silent Failure Handler + Human-Readable Errors + Round-Trip.
 */

import { describe, it, expect } from 'vitest';

import {
  collectImportWarnings,
  formatImportWarnings,
  isKnownSceneType,
  isKnownContentKind,
} from '../core/ai-mpi-json/silent-failure-handler';
import {
  translateError,
  translateErrors,
  formatHumanReadableErrors,
} from '../core/ai-mpi-json/human-readable-errors';
import { verifyRoundTrip } from '../core/ai-mpi-json/round-trip-verify';
import { templateToBlueprint, TEMPLATE_PPKN_NORMA } from '../core/guided-flow/pedagogical-templates';
import { aiBlueprintToSimpleProject } from '../core/ai-mpi-json/aiBlueprintToSimpleProject';

// ---------------------------------------------------------------------------
// C-03: Silent Failure Handler
// ---------------------------------------------------------------------------

describe('C-03: Silent Failure Handler', () => {
  it('1. known sceneType returns true', () => {
    expect(isKnownSceneType('cover-hero')).toBe(true);
    expect(isKnownSceneType('quiz-challenge')).toBe(true);
  });

  it('2. unknown sceneType returns false', () => {
    expect(isKnownSceneType('unknown-scene')).toBe(false);
    expect(isKnownSceneType('')).toBe(false);
  });

  it('3. known content kind returns true', () => {
    expect(isKnownContentKind('learning-material')).toBe(true);
    expect(isKnownContentKind('quiz-question')).toBe(true);
  });

  it('4. unknown content kind returns false', () => {
    expect(isKnownContentKind('unknown-kind')).toBe(false);
  });

  it('5. collectImportWarnings returns empty for valid blueprint', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    const warnings = collectImportWarnings(bp);
    expect(warnings).toHaveLength(0);
  });

  it('6. collectImportWarnings detects unknown sceneType', () => {
    const warnings = collectImportWarnings({
      scenes: [{ id: 's1', sceneType: 'unknown-type', slots: [] }],
    });
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0].message).toContain('unknown-type');
  });

  it('7. collectImportWarnings detects unknown content kind', () => {
    const warnings = collectImportWarnings({
      scenes: [{
        id: 's1', sceneType: 'cover-hero',
        slots: [{ id: 'slot1', role: 'primary', placement: { x: 0, y: 0, width: 100, height: 100 }, content: { kind: 'unknown-kind' } }],
      }],
    });
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0].message).toContain('unknown-kind');
  });

  it('8. formatImportWarnings returns human-readable strings', () => {
    const warnings = collectImportWarnings({
      scenes: [{ id: 's1', sceneType: 'unknown-type', slots: [] }],
    });
    const formatted = formatImportWarnings(warnings);
    expect(formatted.length).toBeGreaterThan(0);
    expect(formatted[0]).toContain('s1');
    expect(formatted[0]).toContain('tidak dikenali');
  });

  it('9. collectImportWarnings handles null/undefined input', () => {
    expect(collectImportWarnings(null)).toHaveLength(0);
    expect(collectImportWarnings(undefined)).toHaveLength(0);
    expect(collectImportWarnings('string')).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// UX-01: Human-Readable Errors
// ---------------------------------------------------------------------------

describe('UX-01: Human-Readable Errors', () => {
  it('10. translateError converts "must be object" to Bahasa Indonesia', () => {
    const result = translateError('metadata', 'must be object');
    expect(result.message).toContain('tidak sesuai');
    expect(result.suggestion).toBeTruthy();
  });

  it('11. translateError converts "must be string"', () => {
    const result = translateError('metadata.title', 'must be string');
    expect(result.message).toContain('teks');
  });

  it('12. translateError converts "must be number"', () => {
    const result = translateError('version', 'must be number');
    expect(result.message).toContain('angka');
  });

  it('13. translateError converts "must be non-empty array"', () => {
    const result = translateError('scenes', 'must be non-empty array');
    expect(result.message).toContain('tidak boleh kosong');
  });

  it('14. translateError converts "unknown sceneType"', () => {
    const result = translateError('scenes[0].sceneType', 'unknown sceneType "foo"');
    expect(result.message).toContain('tidak dikenali');
    expect(result.suggestion).toContain('cover-hero');
  });

  it('15. translateErrors handles array of errors', () => {
    const results = translateErrors([
      { path: 'version', message: 'must be number' },
      { path: 'metadata', message: 'must be object' },
    ]);
    expect(results).toHaveLength(2);
    expect(results[0].message).toContain('angka');
    expect(results[1].message).toContain('tidak sesuai');
  });

  it('16. formatHumanReadableErrors includes suggestion', () => {
    const results = translateErrors([{ path: 'version', message: 'must be number' }]);
    const formatted = formatHumanReadableErrors(results);
    expect(formatted[0]).toContain('angka');
    expect(formatted[0]).toContain('→'); // suggestion separator
  });

  it('17. unknown error pattern gets fallback translation', () => {
    const result = translateError('foo', 'some weird error');
    expect(result.message).toContain('tidak sesuai');
    expect(result.suggestion).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// C-04: Round-Trip Verification
// ---------------------------------------------------------------------------

describe('C-04: Round-Trip Verification', () => {
  it('18. valid template round-trip produces 0 issues', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    const project = aiBlueprintToSimpleProject(bp);
    const issues = verifyRoundTrip(bp, project);
    expect(issues, issues.map((i) => i.message).join('; ')).toHaveLength(0);
  });

  it('19. scene count mismatch is detected', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    const project = aiBlueprintToSimpleProject(bp);
    // Remove a page to create mismatch
    project.pages.pop();
    const issues = verifyRoundTrip(bp, project);
    expect(issues.some((i) => i.field === 'scenes.length')).toBe(true);
  });

  it('20. sceneType change is detected', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    const project = aiBlueprintToSimpleProject(bp);
    // Change sceneType on first page
    project.pages[0].sceneType = 'wrong-type';
    const issues = verifyRoundTrip(bp, project);
    expect(issues.some((i) => i.field.includes('sceneType'))).toBe(true);
  });

  it('21. title change is detected', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    const project = aiBlueprintToSimpleProject(bp);
    project.pages[0].title = 'Changed Title';
    const issues = verifyRoundTrip(bp, project);
    expect(issues.some((i) => i.field.includes('title'))).toBe(true);
  });

  it('22. metadata title change is detected', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    const project = aiBlueprintToSimpleProject(bp);
    project.title = 'Changed Project Title';
    const issues = verifyRoundTrip(bp, project);
    expect(issues.some((i) => i.field === 'metadata.title')).toBe(true);
  });

  it('23. curriculum subject change is detected', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    const project = aiBlueprintToSimpleProject(bp);
    if (project.curriculum) {
      project.curriculum.subject = 'Changed Subject';
    }
    const issues = verifyRoundTrip(bp, project);
    expect(issues.some((i) => i.field === 'curriculum.subject')).toBe(true);
  });
});
