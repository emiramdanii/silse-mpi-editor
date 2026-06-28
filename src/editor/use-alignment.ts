/**
 * LEARNING-GOAL-ALIGNMENT-UI-V2 — store hook.
 *
 * Layer: editor (UI helper)
 * Allowed imports: react, ../store/editor-store, ../core/learning-goal-alignment
 *
 * Kontrak (LGA-UI-V2):
 *   Memoized selector hook yang menghitung alignment sekali per project change.
 *   Dipakai Topbar summary + PagePanel badge + AlignmentDetailPanel.
 *
 *   Pure derived state — tidak menyimpan state sendiri, tidak menulis ke store.
 *   Setiap perubahan project → recompute via useMemo.
 */

import { useMemo } from 'react';
import { useEditorStore } from '../store/editor-store';
import {
  checkLearningGoalAlignment,
  type ProjectAlignment,
} from '../core/learning-goal-alignment';

/**
 * Returns the current project's alignment report, recomputed only when
 * the project reference changes.
 */
export function useLearningGoalAlignment(): ProjectAlignment {
  const project = useEditorStore((s) => s.project);
  return useMemo(() => checkLearningGoalAlignment(project), [project]);
}
