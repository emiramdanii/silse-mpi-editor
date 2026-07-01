/**
 * ListFieldEditor V2 — PERFECT-MPI-INSPECTOR-V2
 *
 * Editor untuk list field di sceneContent. Mendukung:
 *   - edit label/text per item
 *   - add row
 *   - remove row
 *   - reorder up/down
 *
 * Generic — dipakai untuk semua list field (items, hotspots, pairs, criteria, terms, events, choices).
 */

import { useEditorStore } from '../store/editor-store';
import type { SimplePage } from '../core/types';

/** Field definition for a list field in sceneContent. */
export type ListFieldDef = {
  /** Key in sceneContent (e.g. 'items', 'hotspots', 'terms') */
  key: string;
  /** Display label */
  label: string;
  /** Which sub-fields of each item to show as editable inputs */
  itemFields: Array<{ key: string; label: string; type?: 'text' | 'textarea' | 'number' | 'boolean' }>;
  /** Factory to create a new empty item */
  newItem: () => Record<string, unknown>;
};

/** List field definitions per sceneType. */
export const SCENE_LIST_FIELDS: Record<string, ListFieldDef[]> = {
  'classification-game': [
    {
      key: 'items',
      label: 'Item Sortir',
      itemFields: [
        { key: 'id', label: 'ID', type: 'text' },
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'correctCategory', label: 'Kategori Benar', type: 'text' },
      ],
      newItem: () => ({ id: `item-${Date.now()}`, label: '', correctCategory: '' }),
    },
    {
      key: 'categories',
      label: 'Kategori',
      itemFields: [{ key: 'value', label: 'Nama Kategori', type: 'text' }],
      newItem: () => ({ value: '' }),
    },
  ],
  'hotspot-map': [
    {
      key: 'hotspots',
      label: 'Hotspot',
      itemFields: [
        { key: 'id', label: 'ID', type: 'text' },
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'x', label: 'X (%)', type: 'number' },
        { key: 'y', label: 'Y (%)', type: 'number' },
        { key: 'info', label: 'Info', type: 'textarea' },
      ],
      newItem: () => ({ id: `hs-${Date.now()}`, x: 50, y: 50, label: '', info: '' }),
    },
  ],
  'matching-game': [
    {
      key: 'leftItems',
      label: 'Item Kiri',
      itemFields: [
        { key: 'id', label: 'ID', type: 'text' },
        { key: 'label', label: 'Label', type: 'text' },
      ],
      newItem: () => ({ id: `l-${Date.now()}`, label: '' }),
    },
    {
      key: 'rightItems',
      label: 'Item Kanan',
      itemFields: [
        { key: 'id', label: 'ID', type: 'text' },
        { key: 'label', label: 'Label', type: 'text' },
      ],
      newItem: () => ({ id: `r-${Date.now()}`, label: '' }),
    },
    {
      key: 'correctPairs',
      label: 'Pasangan Benar',
      itemFields: [
        { key: 'leftId', label: 'ID Kiri', type: 'text' },
        { key: 'rightId', label: 'ID Kanan', type: 'text' },
      ],
      newItem: () => ({ leftId: '', rightId: '' }),
    },
  ],
  'sequencing-game': [
    {
      key: 'items',
      label: 'Item Urutan',
      itemFields: [
        { key: 'id', label: 'ID', type: 'text' },
        { key: 'label', label: 'Label', type: 'text' },
      ],
      newItem: () => ({ id: `s-${Date.now()}`, label: '' }),
    },
    {
      key: 'correctOrder',
      label: 'Urutan Benar (ID)',
      itemFields: [{ key: 'value', label: 'ID', type: 'text' }],
      newItem: () => ({ value: '' }),
    },
  ],
  'glossary-cards': [
    {
      key: 'terms',
      label: 'Istilah Glosarium',
      itemFields: [
        { key: 'id', label: 'ID', type: 'text' },
        { key: 'term', label: 'Istilah', type: 'text' },
        { key: 'definition', label: 'Definisi', type: 'textarea' },
        { key: 'example', label: 'Contoh', type: 'text' },
      ],
      newItem: () => ({ id: `t-${Date.now()}`, term: '', definition: '', example: '' }),
    },
  ],
  'rubric-panel': [
    {
      key: 'criteria',
      label: 'Kriteria',
      itemFields: [
        { key: 'id', label: 'ID', type: 'text' },
        { key: 'name', label: 'Nama', type: 'text' },
        { key: 'description', label: 'Deskripsi', type: 'textarea' },
      ],
      newItem: () => ({ id: `c-${Date.now()}`, name: '', description: '' }),
    },
    {
      key: 'levels',
      label: 'Level',
      itemFields: [
        { key: 'id', label: 'ID', type: 'text' },
        { key: 'name', label: 'Nama', type: 'text' },
        { key: 'score', label: 'Skor', type: 'number' },
        { key: 'descriptor', label: 'Deskriptor', type: 'textarea' },
      ],
      newItem: () => ({ id: `lv-${Date.now()}`, name: '', score: 0, descriptor: '' }),
    },
  ],
  'worksheet-activity': [
    {
      key: 'taskSteps',
      label: 'Langkah Tugas',
      itemFields: [
        { key: 'id', label: 'ID', type: 'text' },
        { key: 'prompt', label: 'Prompt', type: 'textarea' },
        { key: 'responsePlaceholder', label: 'Placeholder', type: 'text' },
      ],
      newItem: () => ({ id: `ws-${Date.now()}`, prompt: '', responsePlaceholder: '' }),
    },
  ],
  'timeline-story': [
    {
      key: 'events',
      label: 'Event Timeline',
      itemFields: [
        { key: 'id', label: 'ID', type: 'text' },
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'description', label: 'Deskripsi', type: 'textarea' },
      ],
      newItem: () => ({ id: `e-${Date.now()}`, label: '', description: '' }),
    },
  ],
  'branching-scenario': [
    {
      key: 'choices',
      label: 'Pilihan',
      itemFields: [
        { key: 'id', label: 'ID', type: 'text' },
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'consequence', label: 'Konsekuensi', type: 'textarea' },
        { key: 'isCorrect', label: 'Benar?', type: 'boolean' },
      ],
      newItem: () => ({ id: `ch-${Date.now()}`, label: '', consequence: '', isCorrect: false }),
    },
  ],
  'teacher-guide': [
    {
      key: 'facilitationTips',
      label: 'Tips Fasilitasi',
      itemFields: [{ key: 'value', label: 'Tip', type: 'textarea' }],
      newItem: () => ({ value: '' }),
    },
  ],
};

export function ListFieldEditor({
  page,
  fieldDef,
}: {
  page: SimplePage;
  fieldDef: ListFieldDef;
}) {
  const updateSceneContent = useEditorStore((s) => s.updateSceneContent);
  // V2: subscribe to store so component re-renders when sceneContent changes.
  const storePage = useEditorStore((s) => s.project.pages.find((p) => p.id === page.id)) ?? page;
  if (!storePage.sceneContent) return null;

  const content = storePage.sceneContent as Record<string, unknown>;
  const rawList = content[fieldDef.key];
  // Handle both array-of-strings and array-of-objects.
  // For array-of-strings (e.g. categories, correctOrder, facilitationTips), wrap as { value: string }.
  let items: Array<Record<string, unknown>>;
  if (Array.isArray(rawList)) {
    items = rawList.map((item) =>
      typeof item === 'string' ? { value: item } : (item as Record<string, unknown>),
    );
  } else {
    items = [];
  }

  const updateList = (newItems: Array<Record<string, unknown>>) => {
    // Unwrap { value: string } back to string for string-array fields.
    const isStringArray = fieldDef.itemFields.length === 1 && fieldDef.itemFields[0].key === 'value';
    const unwrapped = isStringArray
      ? newItems.map((item) => String(item.value ?? ''))
      : newItems;
    updateSceneContent(storePage.id, { [fieldDef.key]: unwrapped });
  };

  const handleEditItem = (idx: number, fieldKey: string, value: unknown) => {
    const newItems = items.map((item, i) =>
      i === idx ? { ...item, [fieldKey]: value } : item,
    );
    updateList(newItems);
  };

  const handleAddItem = () => {
    updateList([...items, fieldDef.newItem()]);
  };

  const handleRemoveItem = (idx: number) => {
    updateList(items.filter((_, i) => i !== idx));
  };

  const handleMoveUp = (idx: number) => {
    if (idx === 0) return;
    const newItems = [...items];
    [newItems[idx - 1], newItems[idx]] = [newItems[idx], newItems[idx - 1]];
    updateList(newItems);
  };

  const handleMoveDown = (idx: number) => {
    if (idx === items.length - 1) return;
    const newItems = [...items];
    [newItems[idx], newItems[idx + 1]] = [newItems[idx + 1], newItems[idx]];
    updateList(newItems);
  };

  return (
    <div className="list-field-editor" data-testid={`list-editor-${fieldDef.key}`} style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#374151' }}>{fieldDef.label} ({items.length})</span>
        <button
          data-testid={`list-add-${fieldDef.key}`}
          onClick={handleAddItem}
          style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700, border: '1px solid #d1d5db', borderRadius: 4, background: '#f9fafb', cursor: 'pointer' }}
        >+ Tambah</button>
      </div>
      {items.map((item, idx) => (
        <div key={idx} data-testid={`list-item-${fieldDef.key}-${idx}`} style={{ padding: 8, marginBottom: 6, border: '1px solid #e5e7eb', borderRadius: 6, background: '#f9fafb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280' }}>#{idx + 1}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button data-testid={`list-up-${fieldDef.key}-${idx}`} onClick={() => handleMoveUp(idx)} disabled={idx === 0} style={{ padding: '2px 6px', fontSize: 10, border: '1px solid #d1d5db', borderRadius: 3, background: '#fff', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.4 : 1 }}>↑</button>
              <button data-testid={`list-down-${fieldDef.key}-${idx}`} onClick={() => handleMoveDown(idx)} disabled={idx === items.length - 1} style={{ padding: '2px 6px', fontSize: 10, border: '1px solid #d1d5db', borderRadius: 3, background: '#fff', cursor: idx === items.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === items.length - 1 ? 0.4 : 1 }}>↓</button>
              <button data-testid={`list-remove-${fieldDef.key}-${idx}`} onClick={() => handleRemoveItem(idx)} style={{ padding: '2px 6px', fontSize: 10, border: '1px solid #ef4444', borderRadius: 3, background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}>✕</button>
            </div>
          </div>
          {fieldDef.itemFields.map((f) => {
            const fieldType = f.type ?? 'text';
            return (
              <div key={f.key} style={{ marginBottom: 4 }}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#6b7280', marginBottom: 2 }}>{f.label}</label>
                {fieldType === 'textarea' ? (
                  <textarea
                    data-testid={`list-field-${fieldDef.key}-${idx}-${f.key}`}
                    value={String(item[f.key] ?? '')}
                    onChange={(e) => handleEditItem(idx, f.key, e.target.value)}
                    style={{ width: '100%', minHeight: 40, padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                ) : fieldType === 'number' ? (
                  <input
                    type="number"
                    data-testid={`list-field-${fieldDef.key}-${idx}-${f.key}`}
                    value={Number(item[f.key] ?? 0)}
                    onChange={(e) => handleEditItem(idx, f.key, e.target.value === '' ? 0 : Number(e.target.value))}
                    style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12, fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                ) : fieldType === 'boolean' ? (
                  <select
                    data-testid={`list-field-${fieldDef.key}-${idx}-${f.key}`}
                    value={String(item[f.key] === true)}
                    onChange={(e) => handleEditItem(idx, f.key, e.target.value === 'true')}
                    style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12, fontFamily: 'inherit', boxSizing: 'border-box' }}
                  >
                    <option value="false">false</option>
                    <option value="true">true</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    data-testid={`list-field-${fieldDef.key}-${idx}-${f.key}`}
                    value={String(item[f.key] ?? '')}
                    onChange={(e) => handleEditItem(idx, f.key, e.target.value)}
                    style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12, fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}
      {items.length === 0 && (
        <div style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic', padding: '4px 0' }}>Belum ada item. Klik "+ Tambah" untuk menambah.</div>
      )}
    </div>
  );
}
