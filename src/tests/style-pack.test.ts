/**
 * Tests for Style Pack foundation (Batch 2S).
 *
 * Kontrak:
 *   - Project default punya style field minimal.
 *   - StylePack tokens serializable (string/number only, no function/class).
 *   - Validation menerima style minimal.
 *   - 5 built-in preset ada.
 *   - DEFAULT_STYLE_PACK = cleanClassroom.
 */

import { describe, expect, it } from 'vitest';
import {
  BUILTIN_STYLE_PACKS,
  CLEAN_CLASSROOM_PACK,
  DEFAULT_STYLE_PACK,
  VISUAL_PRESET_IDS,
  getStylePack,
  stylePackToProjectStyle,
} from '../core/style-presets';
import { createProject } from '../core/project-factory';
import {
  isValidProjectStyle,
  isValidStylePack,
  validateProject,
  validateProjectStyle,
  validateStylePack,
} from '../core/validation';
import type { ProjectStyle, StylePack } from '../core/style-types';

// ---------------------------------------------------------------------------
// Helper: deep-check that all token values are serializable primitives.
// ---------------------------------------------------------------------------

function assertSerializable(obj: unknown, path: string = ''): string[] {
  const offenders: string[] = [];

  if (obj === null || obj === undefined) return offenders;
  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
    return offenders;
  }
  if (typeof obj === 'function') {
    offenders.push(`${path || '(root)'}: function (not serializable)`);
    return offenders;
  }
  if (typeof obj === 'object') {
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      offenders.push(...assertSerializable(val, path ? `${path}.${key}` : key));
    }
  }
  return offenders;
}

// =========================================================================
// Built-in presets
// =========================================================================

describe('built-in style presets', () => {
  it('VISUAL_PRESET_IDS contains exactly 5 presets', () => {
    expect(VISUAL_PRESET_IDS).toHaveLength(5);
    expect(Array.from(VISUAL_PRESET_IDS)).toEqual([
      'cleanClassroom',
      'civicWarm',
      'brightKids',
      'projectorHighContrast',
      'minimalWorksheet',
    ]);
  });

  it('BUILTIN_STYLE_PACKS has entry for each preset id', () => {
    for (const id of Array.from(VISUAL_PRESET_IDS)) {
      expect(BUILTIN_STYLE_PACKS[id]).toBeDefined();
      expect(BUILTIN_STYLE_PACKS[id].id).toBe(id);
    }
  });

  it('DEFAULT_STYLE_PACK is cleanClassroom', () => {
    expect(DEFAULT_STYLE_PACK.id).toBe('cleanClassroom');
    expect(DEFAULT_STYLE_PACK).toBe(CLEAN_CLASSROOM_PACK);
  });

  it('getStylePack returns pack by id', () => {
    expect(getStylePack('civicWarm')?.name).toBe('Civic Warm');
    expect(getStylePack('brightKids')?.name).toBe('Bright Kids');
  });

  it('getStylePack returns undefined for unknown id', () => {
    expect(getStylePack('unknown')).toBeUndefined();
  });
});

// =========================================================================
// StylePack serializability
// =========================================================================

describe('StylePack tokens are serializable', () => {
  for (const id of Array.from(VISUAL_PRESET_IDS)) {
    it(`style pack "${id}" has only serializable primitives`, () => {
      const pack = BUILTIN_STYLE_PACKS[id];
      const offenders = assertSerializable(pack);
      expect(offenders).toEqual([]);
    });

    it(`style pack "${id}" survives JSON round-trip`, () => {
      const pack = BUILTIN_STYLE_PACKS[id];
      const json = JSON.stringify(pack);
      const parsed = JSON.parse(json) as StylePack;
      expect(parsed.id).toBe(pack.id);
      expect(parsed.colors.primary).toBe(pack.colors.primary);
      expect(parsed.typography.titleSize).toBe(pack.typography.titleSize);
      expect(parsed.componentRecipes).toEqual(pack.componentRecipes);
    });
  }
});

// =========================================================================
// StylePack structure
// =========================================================================

describe('StylePack structure', () => {
  it('each pack has all required token groups', () => {
    const pack = DEFAULT_STYLE_PACK;
    expect(pack.colors).toBeDefined();
    expect(pack.typography).toBeDefined();
    expect(pack.spacing).toBeDefined();
    expect(pack.radius).toBeDefined();
    expect(pack.shadow).toBeDefined();
    expect(pack.componentRecipes).toBeDefined();
    expect(pack.interactionRecipes).toBeDefined();
    expect(pack.scoringRecipes).toBeDefined();
  });

  it('each pack colors has all 10 color tokens', () => {
    const required = [
      'background',
      'surface',
      'primary',
      'secondary',
      'text',
      'mutedText',
      'border',
      'success',
      'warning',
      'danger',
    ];
    for (const id of Array.from(VISUAL_PRESET_IDS)) {
      const colors = BUILTIN_STYLE_PACKS[id].colors;
      for (const key of required) {
        expect(colors[key as keyof typeof colors]).toBeDefined();
        expect(typeof colors[key as keyof typeof colors]).toBe('string');
      }
    }
  });

  it('each pack typography has all 6 tokens', () => {
    const required = ['fontFamily', 'titleSize', 'subtitleSize', 'bodySize', 'smallSize', 'lineHeight'];
    for (const id of Array.from(VISUAL_PRESET_IDS)) {
      const typo = BUILTIN_STYLE_PACKS[id].typography;
      for (const key of required) {
        expect(typo[key as keyof typeof typo]).toBeDefined();
      }
    }
  });

  it('recipe placeholders are objects (may be empty)', () => {
    for (const id of Array.from(VISUAL_PRESET_IDS)) {
      const pack = BUILTIN_STYLE_PACKS[id];
      expect(typeof pack.componentRecipes).toBe('object');
      expect(typeof pack.interactionRecipes).toBe('object');
      expect(typeof pack.scoringRecipes).toBe('object');
    }
  });
});

// =========================================================================
// stylePackToProjectStyle
// =========================================================================

describe('stylePackToProjectStyle', () => {
  it('converts StylePack to ProjectStyle with stylePackId', () => {
    const ps: ProjectStyle = stylePackToProjectStyle(CLEAN_CLASSROOM_PACK);
    expect(ps.stylePackId).toBe('cleanClassroom') // base pack ID;
    expect(ps.tokens).toBeDefined();
  });

  it('snapshots all tokens (deep copy)', () => {
    const ps: ProjectStyle = stylePackToProjectStyle(CLEAN_CLASSROOM_PACK);
    // Mutate original — ProjectStyle should be unaffected (snapshot)
    const originalPrimary = CLEAN_CLASSROOM_PACK.colors.primary;
    CLEAN_CLASSROOM_PACK.colors.primary = '#changed';
    expect(ps.tokens.colors.primary).toBe(originalPrimary); // still original
    // Restore
    CLEAN_CLASSROOM_PACK.colors.primary = originalPrimary;
  });

  it('does NOT copy recipe placeholders into tokens (tokens only)', () => {
    const ps: ProjectStyle = stylePackToProjectStyle(CLEAN_CLASSROOM_PACK);
    expect((ps.tokens as unknown as Record<string, unknown>).componentRecipes).toBeUndefined();
    expect((ps.tokens as unknown as Record<string, unknown>).interactionRecipes).toBeUndefined();
    expect((ps.tokens as unknown as Record<string, unknown>).scoringRecipes).toBeUndefined();
  });
});

// =========================================================================
// Project default has style field
// =========================================================================

describe('createProject embeds style field', () => {
  it('project has stylePackId set', () => {
    const p = createProject();
    expect(p.stylePackId).toBe('modern-clean') // V1 default;
  });

  it('project has style field with ProjectStyle', () => {
    const p = createProject();
    expect(p.style).toBeDefined();
    expect(p.style?.stylePackId).toBe('cleanClassroom') // base pack tokens;
  });

  it('project style tokens match DEFAULT_STYLE_PACK', () => {
    const p = createProject();
    expect(p.style?.tokens.colors.primary).toBe(DEFAULT_STYLE_PACK.colors.primary);
    expect(p.style?.tokens.typography.titleSize).toBe(DEFAULT_STYLE_PACK.typography.titleSize);
  });

  it('project style is serializable (no function/class)', () => {
    const p = createProject();
    const offenders = assertSerializable(p.style);
    expect(offenders).toEqual([]);
  });

  it('project style survives JSON round-trip', () => {
    const p = createProject();
    const json = JSON.stringify(p);
    const parsed = JSON.parse(json);
    expect(parsed.style.stylePackId).toBe('cleanClassroom') // base pack tokens;
    expect(parsed.style.tokens.colors.primary).toBe(DEFAULT_STYLE_PACK.colors.primary);
  });
});

// =========================================================================
// Validation — StylePack
// =========================================================================

describe('validateStylePack', () => {
  it('accepts DEFAULT_STYLE_PACK', () => {
    const r = validateStylePack(DEFAULT_STYLE_PACK);
    expect(r.ok).toBe(true);
    expect(isValidStylePack(DEFAULT_STYLE_PACK)).toBe(true);
  });

  it('accepts each built-in preset', () => {
    for (const id of Array.from(VISUAL_PRESET_IDS)) {
      const r = validateStylePack(BUILTIN_STYLE_PACKS[id]);
      expect(r.ok).toBe(true);
    }
  });

  it('rejects pack without id', () => {
    const broken = { ...DEFAULT_STYLE_PACK, id: '' };
    expect(validateStylePack(broken).ok).toBe(false);
  });

  it('rejects pack without colors', () => {
    const broken = { ...DEFAULT_STYLE_PACK, colors: undefined };
    expect(validateStylePack(broken).ok).toBe(false);
  });

  it('rejects pack with missing color token', () => {
    const broken = {
      ...DEFAULT_STYLE_PACK,
      colors: { ...DEFAULT_STYLE_PACK.colors, primary: undefined },
    };
    expect(validateStylePack(broken).ok).toBe(false);
  });

  it('rejects pack with non-positive typography size', () => {
    const broken = {
      ...DEFAULT_STYLE_PACK,
      typography: { ...DEFAULT_STYLE_PACK.typography, titleSize: 0 },
    };
    expect(validateStylePack(broken).ok).toBe(false);
  });

  it('rejects pack with non-object recipe', () => {
    const broken = { ...DEFAULT_STYLE_PACK, componentRecipes: 'not-an-object' };
    expect(validateStylePack(broken).ok).toBe(false);
  });
});

// =========================================================================
// Validation — ProjectStyle
// =========================================================================

describe('validateProjectStyle', () => {
  it('accepts ProjectStyle from stylePackToProjectStyle', () => {
    const ps = stylePackToProjectStyle(DEFAULT_STYLE_PACK);
    const r = validateProjectStyle(ps);
    expect(r.ok).toBe(true);
    expect(isValidProjectStyle(ps)).toBe(true);
  });

  it('rejects ProjectStyle without stylePackId', () => {
    const ps = stylePackToProjectStyle(DEFAULT_STYLE_PACK);
    const broken = { ...ps, stylePackId: '' };
    expect(validateProjectStyle(broken).ok).toBe(false);
  });

  it('rejects ProjectStyle without tokens', () => {
    const ps = stylePackToProjectStyle(DEFAULT_STYLE_PACK);
    const broken = { ...ps, tokens: undefined };
    expect(validateProjectStyle(broken).ok).toBe(false);
  });

  it('rejects ProjectStyle with partial tokens', () => {
    const ps = stylePackToProjectStyle(DEFAULT_STYLE_PACK);
    const broken = { ...ps, tokens: { colors: ps.tokens.colors } };
    expect(validateProjectStyle(broken).ok).toBe(false);
  });
});

// =========================================================================
// Validation — project with style
// =========================================================================

describe('validateProject with style field', () => {
  it('accepts project with default style', () => {
    const p = createProject();
    const r = validateProject(p);
    expect(r.ok).toBe(true);
  });

  it('accepts project WITHOUT style (backward-compat)', () => {
    const p = createProject();
    const broken = { ...p, style: undefined, stylePackId: undefined };
    const r = validateProject(broken);
    expect(r.ok).toBe(true);
  });

  it('rejects project with invalid style', () => {
    const p = createProject();
    const broken = {
      ...p,
      style: { stylePackId: '', tokens: {} },
    };
    const r = validateProject(broken);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join('; ')).toMatch(/style/i);
  });

  it('rejects project with non-string stylePackId', () => {
    const p = createProject();
    const broken = { ...p, stylePackId: 123 };
    const r = validateProject(broken);
    expect(r.ok).toBe(false);
  });
});
