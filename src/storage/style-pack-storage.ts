/**
 * Style pack storage for silse-mpi-editor.
 *
 * Layer: storage
 * Allowed imports: ./storage-types, ./local-storage-adapter, ../core (validation, style-types)
 *
 * Kontrak (Batch 7 / M7):
 *   - Save current StylePack sebagai reusable asset.
 *   - listSavedStylePacks / loadSavedStylePack / deleteSavedStylePack.
 *   - validateStylePack wajib dipakai saat load.
 *   - Jangan buat full Style Studio UI.
 */

import type { StylePack } from '../core/style-types';
import { isValidStylePack, validateStylePack } from '../core/validation';
import type { StoredStylePackEnvelope, StorageResult } from './storage-types';
import { STORAGE_SCHEMA_VERSION } from './storage-types';
import { readKey, writeKey } from './local-storage-adapter';

type SavedStylePacksMap = Record<string, StylePack>;

function readMap(): SavedStylePacksMap {
  const result = readKey<StoredStylePackEnvelope>('savedStylePacks');
  if (!result.ok || !result.data) return {};
  const envelope = result.data;
  if (envelope.schemaVersion !== STORAGE_SCHEMA_VERSION) return {};
  const packs = envelope.stylePacks ?? [];
  const map: SavedStylePacksMap = {};
  for (const p of packs) {
    if (isValidStylePack(p)) map[p.id] = p;
  }
  return map;
}

function writeMap(map: SavedStylePacksMap): StorageResult<void> {
  const envelope: StoredStylePackEnvelope = {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    stylePacks: Object.values(map),
  };
  return writeKey('savedStylePacks', envelope);
}

export function saveStylePack(pack: StylePack): StorageResult<string> {
  const validation = validateStylePack(pack);
  if (!validation.ok) {
    return { ok: false, error: `Invalid style pack: ${validation.errors.join('; ')}` };
  }
  const map = readMap();
  map[pack.id] = pack;
  const result = writeMap(map);
  if (!result.ok) return result;
  return { ok: true, data: pack.id };
}

export function listSavedStylePacks(): { id: string; name: string; description: string }[] {
  const map = readMap();
  return Object.values(map)
    .map((p) => ({ id: p.id, name: p.name, description: p.description }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function loadSavedStylePack(id: string): StorageResult<StylePack | null> {
  const map = readMap();
  const pack = map[id];
  if (!pack) return { ok: true, data: null };
  const validation = validateStylePack(pack);
  if (!validation.ok) {
    return { ok: false, error: `Invalid style pack: ${validation.errors.join('; ')}` };
  }
  return { ok: true, data: pack };
}

export function deleteSavedStylePack(id: string): StorageResult<void> {
  const map = readMap();
  delete map[id];
  return writeMap(map);
}
