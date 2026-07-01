/**
 * Forbidden field guard for AI import.
 *
 * Layer: ai-import
 * Allowed imports: none (pure function)
 *
 * Kontrak (Batch 8 / M8):
 *   Recursive guard untuk reject field terlarang di payload AI.
 *   Jangan sanitize diam-diam — reject dengan error yang menyebut path.
 */

const FORBIDDEN_KEYS = [
  'html',
  'css',
  'script',
  'scripts',
  'style', // raw CSS string — style hanya boleh via StylePack tokens
  'className',
  'dangerouslySetInnerHTML',
  'cdn',
  'externalUrl',
  'import', // ES import string
  'iframe',
] as const;

export type GuardResult = { ok: true } | { ok: false; errors: string[] };

/**
 * Recursively scan an object for forbidden fields.
 * Returns list of errors with path to each forbidden field.
 */
export function checkForbiddenFields(obj: unknown, path: string = ''): GuardResult {
  const errors: string[] = [];

  if (obj === null || obj === undefined) return { ok: true };
  if (typeof obj !== 'object') return { ok: true };
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const childPath = path ? `${path}[${i}]` : `[${i}]`;
      const childResult = checkForbiddenFields(obj[i], childPath);
      if (!childResult.ok) errors.push(...childResult.errors);
    }
    return errors.length > 0 ? { ok: false, errors } : { ok: true };
  }

  const record = obj as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    const currentPath = path ? `${path}.${key}` : key;

    // Check if this key is forbidden
    if (FORBIDDEN_KEYS.includes(key as (typeof FORBIDDEN_KEYS)[number])) {
      errors.push(`Forbidden field "${currentPath}" — raw HTML/CSS/JS/className/CDN is not allowed in AI import`);
    }

    // Recurse into value
    const value = record[key];
    if (typeof value === 'object' && value !== null) {
      const childResult = checkForbiddenFields(value, currentPath);
      if (!childResult.ok) errors.push(...childResult.errors);
    }
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true };
}
