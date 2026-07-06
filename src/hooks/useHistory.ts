import { useState, useCallback, useRef } from 'react';

interface UseHistoryReturn<T> {
  present: T;
  past: T[];
  future: T[];
  set: (newPresent: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clear: () => void;
}

export function useHistory<T>(initialPresent: T, maxHistoryLength: number = 50): UseHistoryReturn<T> {
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState<T>(initialPresent);
  const [future, setFuture] = useState<T[]>([]);
  
  // Ref to track if we are currently updating via undo/redo to avoid loops
  const isUndoRedoRef = useRef(false);

  const set = useCallback((newPresent: T) => {
    if (isUndoRedoRef.current) {
      setPresent(newPresent);
      return;
    }

    setPast(prev => {
      const newPast = [...prev, present];
      if (newPast.length > maxHistoryLength) {
        return newPast.slice(1);
      }
      return newPast;
    });
    setPresent(newPresent);
    setFuture([]);
  }, [present, maxHistoryLength]);

  const undo = useCallback(() => {
    if (past.length === 0) return;

    isUndoRedoRef.current = true;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setPast(newPast);
    setFuture(prev => [present, ...prev]);
    setPresent(previous);
    
    // Reset flag after render
    setTimeout(() => {
      isUndoRedoRef.current = false;
    }, 0);
  }, [past, present]);

  const redo = useCallback(() => {
    if (future.length === 0) return;

    isUndoRedoRef.current = true;
    const next = future[0];
    const newFuture = future.slice(1);

    setPast(prev => [...prev, present]);
    setFuture(newFuture);
    setPresent(next);

    setTimeout(() => {
      isUndoRedoRef.current = false;
    }, 0);
  }, [future, present]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const clear = useCallback(() => {
    setPast([]);
    setFuture([]);
    setPresent(initialPresent);
    isUndoRedoRef.current = false;
  }, [initialPresent]);

  return {
    present,
    past,
    future,
    set,
    undo,
    redo,
    canUndo,
    canRedo,
    clear,
  };
}
