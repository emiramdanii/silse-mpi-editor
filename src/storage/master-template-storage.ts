/**
 * Master Template Storage — V2-PILAR-4
 *
 * Layer: storage
 * Allowed imports: ../core (types, master-template), ./local-storage-adapter
 *
 * Kontrak:
 *   Save/load/delete master templates to localStorage.
 *   Master templates are style + structure blueprints (no content).
 */

import type { MasterTemplate } from '../core/master-template';
import { validateMasterTemplate } from '../core/master-template';
import { readKey, writeKey } from './local-storage-adapter';
import type { StorageResult } from './storage-types';

const STORAGE_KEY = 'masterTemplates' as const;

type MasterTemplateMap = Record<string, MasterTemplate>;

function readMasterMap(): MasterTemplateMap {
  const result = readKey<MasterTemplateMap>(STORAGE_KEY);
  if (!result.ok || !result.data) return {};
  return result.data;
}

function writeMasterMap(map: MasterTemplateMap): StorageResult<void> {
  return writeKey(STORAGE_KEY, map);
}

export function saveMasterTemplate(master: MasterTemplate): StorageResult<string> {
  const errors = validateMasterTemplate(master);
  if (errors.length > 0) {
    return { ok: false, error: `Invalid master template: ${errors.join('; ')}` };
  }
  const map = readMasterMap();
  map[master.id] = master;
  const result = writeMasterMap(map);
  if (!result.ok) return result;
  return { ok: true, data: master.id };
}

export function listMasterTemplates(): MasterTemplate[] {
  const map = readMasterMap();
  return Object.values(map).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function loadMasterTemplate(id: string): StorageResult<MasterTemplate | null> {
  const map = readMasterMap();
  if (!map[id]) return { ok: true, data: null };
  return { ok: true, data: map[id] };
}

export function deleteMasterTemplate(id: string): StorageResult<void> {
  const map = readMasterMap();
  delete map[id];
  return writeMasterMap(map);
}
