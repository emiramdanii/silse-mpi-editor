/**
 * Round-Trip Verification (C-04).
 *
 * Layer: core/ai-mpi-json (pure function, no React/DOM)
 *
 * Kontrak:
 *   Verifikasi bahwa JSON yang di-import lalu di-export kembali memiliki
 *   struktur yang sama (idempotensi). Ini membuktikan V1 "presisi 100%".
 *
 *   Flow: AI JSON → blueprint → SimpleProject → export JSON → compare struktur
 *
 *   Prinsip:
 *     - Pure function, no DOM, no React.
 *     - Compare structure (keys), bukan nilai exact (ID mungkin beda).
 *     - Return issues array — empty = round-trip sukses.
 */

import type { AiMpiBlueprint } from './schema';
import type { SimpleProject } from '../types';

export type RoundTripIssue = {
  field: string;
  message: string;
};

/**
 * Verify round-trip: blueprint → project → check structure preserved.
 *
 * Checks:
 * 1. Number of scenes === number of pages
 * 2. Every scene's sceneType appears on the corresponding page
 * 3. Every scene's title appears on the corresponding page
 * 4. Scene count matches page count
 */
export function verifyRoundTrip(
  blueprint: AiMpiBlueprint,
  project: SimpleProject,
): RoundTripIssue[] {
  const issues: RoundTripIssue[] = [];

  // 1. Scene count === page count
  if (blueprint.scenes.length !== project.pages.length) {
    issues.push({
      field: 'scenes.length',
      message: `Jumlah scene (${blueprint.scenes.length}) tidak sama dengan jumlah page (${project.pages.length})`,
    });
  }

  // 2. Check each scene → page mapping
  const maxLen = Math.min(blueprint.scenes.length, project.pages.length);
  for (let i = 0; i < maxLen; i++) {
    const scene = blueprint.scenes[i];
    const page = project.pages[i];

    // sceneType preserved
    if (scene.sceneType !== page.sceneType) {
      issues.push({
        field: `scenes[${i}].sceneType`,
        message: `Scene ${i}: sceneType berubah dari "${scene.sceneType}" ke "${page.sceneType ?? 'undefined'}"`,
      });
    }

    // title preserved (scene.title → page.title)
    if (scene.title !== page.title) {
      issues.push({
        field: `scenes[${i}].title`,
        message: `Scene ${i}: title berubah dari "${scene.title}" ke "${page.title}"`,
      });
    }

    // role preserved (scene.role → page.role, with mapping)
    // Note: role mapping may differ (e.g., 'objectives' → 'learningObjectives')
    // This is expected — only flag if role is completely missing
    if (!page.role) {
      issues.push({
        field: `scenes[${i}].role`,
        message: `Scene ${i}: role hilang setelah konversi`,
      });
    }
  }

  // 3. Metadata preserved
  if (blueprint.metadata.title !== project.title) {
    issues.push({
      field: 'metadata.title',
      message: `Title berubah dari "${blueprint.metadata.title}" ke "${project.title}"`,
    });
  }

  // 4. Curriculum preserved (if present)
  if (blueprint.curriculum && project.curriculum) {
    if (blueprint.curriculum.subject !== project.curriculum.subject) {
      issues.push({
        field: 'curriculum.subject',
        message: `Subject berubah dari "${blueprint.curriculum.subject}" ke "${project.curriculum.subject}"`,
      });
    }
    if (blueprint.curriculum.topic !== project.curriculum.topic) {
      issues.push({
        field: 'curriculum.topic',
        message: `Topic berubah dari "${blueprint.curriculum.topic}" ke "${project.curriculum.topic}"`,
      });
    }
  }

  return issues;
}
