/**
 * Undo/Redo System (F-01).
 *
 * Layer: store (Zustand middleware)
 *
 * Kontrak:
 *   Undo/redo untuk editor store. Track perubahan `project` (deep clone snapshot).
 *   Ctrl+Z = undo, Ctrl+Y / Ctrl+Shift+Z = redo.
 *
 *   Prinsip:
 *     - Snapshot hanya `project` + `selectedComponentId` (bukan runtime state seperti score).
 *     - Max 50 snapshots (memory safety).
 *     - Tidak undo: setProject (import), newProject, resetProject (life-cycle, bukan edit).
 *     - Tidak undo: selectPage, selectComponent (navigation, bukan mutation).
 */

import { useEffect } from 'react';
import { useEditorStore } from './editor-store';
import type { SimpleProject } from '../core/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Snapshot = {
  project: SimpleProject;
  selectedComponentId: string | null;
};

// ---------------------------------------------------------------------------
// History store (separate from editor store — no pollution)
// ---------------------------------------------------------------------------

const MAX_HISTORY = 50;

let past: Snapshot[] = [];
let future: Snapshot[] = [];

// Track if we're currently applying undo/redo (to avoid recording the change)
let isApplying = false;

/**
 * Record current state as a snapshot BEFORE a mutation.
 * Pushes current state to `past`. After mutation, the store holds the new state.
 * On undo: restore from `past` (pre-mutation), push current to `future`.
 * On redo: restore from `future` (post-mutation), push current to `past`.
 */

export function recordSnapshot(): void {
  if (isApplying) return;

  const state = useEditorStore.getState();
  const snapshot: Snapshot = {
    project: JSON.parse(JSON.stringify(state.project)) as SimpleProject,
    selectedComponentId: state.selectedComponentId,
  };

  // Push current state to past (this is the pre-mutation state)
  past = [...past, snapshot].slice(-MAX_HISTORY);
  future = [];
}

/**
 * Undo: restore previous state from past.
 * present (current/post-mutation) → future, past[last] (pre-mutation) → store.
 */
export function undo(): void {
  if (past.length === 0) return;

  isApplying = true;
  const state = useEditorStore.getState();
  const currentSnapshot: Snapshot = {
    project: JSON.parse(JSON.stringify(state.project)) as SimpleProject,
    selectedComponentId: state.selectedComponentId,
  };

  const previous = past[past.length - 1];
  past = past.slice(0, -1);
  future = [currentSnapshot, ...future].slice(0, MAX_HISTORY);

  useEditorStore.setState({
    project: JSON.parse(JSON.stringify(previous.project)) as SimpleProject,
    selectedComponentId: previous.selectedComponentId,
  });
  isApplying = false;
}

/**
 * Redo: restore next state from future.
 */
export function redo(): void {
  if (future.length === 0) return;

  isApplying = true;
  const state = useEditorStore.getState();
  const currentSnapshot: Snapshot = {
    project: JSON.parse(JSON.stringify(state.project)) as SimpleProject,
    selectedComponentId: state.selectedComponentId,
  };

  const next = future[0];
  future = future.slice(1);
  past = [...past, currentSnapshot].slice(-MAX_HISTORY);

  useEditorStore.setState({
    project: JSON.parse(JSON.stringify(next.project)) as SimpleProject,
    selectedComponentId: next.selectedComponentId,
  });
  isApplying = false;
}

/**
 * Can undo?
 */
export function canUndo(): boolean {
  return past.length > 0;
}

/**
 * Can redo?
 */
export function canRedo(): boolean {
  return future.length > 0;
}

/**
 * Clear history (called on new project / import / reset).
 */
export function clearHistory(): void {
  past = [];
  future = [];
}

/**
 * Initialize history with current state (called on mount).
 */
export function initHistory(): void {
  // Just clear stacks — no need to capture initial state
  // (recordSnapshot will capture it before first mutation)
  past = [];
  future = [];
}

// ---------------------------------------------------------------------------
// Keyboard shortcut hook: Ctrl+Z (undo), Ctrl+Y / Ctrl+Shift+Z (redo)
// ---------------------------------------------------------------------------

export function useUndoRedoKeyboard(): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z = undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z = redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}

// ---------------------------------------------------------------------------
// Wrappers for common mutations (auto-record snapshot before mutation)
// ---------------------------------------------------------------------------

export function undoableAddPage(opts?: { title?: string; role?: string }): string {
  recordSnapshot();
  return useEditorStore.getState().addPage(opts as never);
}

export function undoableDeletePage(pageId: string): void {
  recordSnapshot();
  useEditorStore.getState().deletePage(pageId);
}

export function undoableRenamePage(pageId: string, title: string): void {
  recordSnapshot();
  useEditorStore.getState().renamePage(pageId, title);
}

export function undoableSetProjectTitle(title: string): void {
  recordSnapshot();
  useEditorStore.getState().setProjectTitle(title);
}

export function undoableUpdateTextComponent(componentId: string, patch: Record<string, unknown>): void {
  recordSnapshot();
  useEditorStore.getState().updateTextComponent(componentId, patch as never);
}

export function undoableAddTextComponent(overrides?: Record<string, unknown>): string | null {
  recordSnapshot();
  return useEditorStore.getState().addTextComponent(overrides as never);
}

export function undoableRemoveComponent(componentId: string): void {
  recordSnapshot();
  useEditorStore.getState().removeComponent(componentId);
}
