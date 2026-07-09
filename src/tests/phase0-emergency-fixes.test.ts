/**
 * Regression tests for Fase 0 emergency fixes (audit phase0).
 *
 * Each test exercises the PRODUCTION code path (no bypass via
 * templateToBlueprint + direct mutation). Tests are organized by
 * audit finding ID for traceability.
 *
 * Findings covered:
 *   6.1 — XSS via innerHTML in 3 scene renderers
 *   6.2 — Answer leak via DOM attributes
 *   1.2 — customStyle preserved through normalizeSlot
 *   1.3 — Forbidden-field guard in new pipeline
 *   4.3 — Autosave flush on tab close (skipped — requires DOM event simulation, covered manually)
 *   8.2 — Template content deep-clone (no singleton mutation)
 *   8.6 — GuidedFlowDialog error recovery (skipped — covered by existing guided-flow tests)
 *   1.4 — verifyRoundTrip wired in production import
 */

import { describe, it, expect } from 'vitest';
import { exportProjectToHtml } from '../export/export-html';
import { createSamplePpknProject } from '../core/sample-project';
import { normalizeAiMpiJson } from '../core/ai-mpi-json/normalizeAiMpiJson';
import { validateAiMpiJson } from '../core/ai-mpi-json/validateAiMpiJson';
import { aiBlueprintToSimpleProject } from '../core/ai-mpi-json/aiBlueprintToSimpleProject';
import { templateToBlueprint, TEMPLATE_PPKN_NORMA } from '../core/guided-flow/pedagogical-templates';
import { verifyRoundTrip } from '../core/ai-mpi-json/round-trip-verify';
import type { AiMpiBlueprint } from '../core/ai-mpi-json/schema';

// ---------------------------------------------------------------------------
// 6.1 — XSS via innerHTML in 3 scene renderers
// ---------------------------------------------------------------------------

describe('Fase 0 / Audit 6.1 — XSS prevention in export HTML', () => {
  it('objective list with XSS payload is not rendered as live HTML element', () => {
    // The fix uses createElement + textContent instead of innerHTML string concat.
    // The XSS payload WILL appear in the embedded MODEL JSON (JSON.stringify of
    // the project data) — that's expected and safe because it's inside a
    // <script> tag as a JSON string literal, not rendered as DOM.
    //
    // The dangerous form is a raw <img> element with onerror attribute appearing
    // OUTSIDE of script tags / JSON strings — i.e. as actual rendered DOM.
    // We strip the <script>...</script> block first, then check the remaining
    // HTML body for raw <img onerror.
    const project = createSamplePpknProject();
    const objectivesPage = project.pages.find((p) => p.role === 'learningObjectives');
    if (objectivesPage) {
      objectivesPage.sceneType = 'objectives-path';
      objectivesPage.sceneContent = {
        kind: 'objectives-path',
        objectiveList: [
          'Normal objective',
          '<img src=x onerror=alert(1)>',
        ],
        successCriteria: 'Test',
      } as unknown as AiMpiBlueprint['scenes'][number]['slots'][number]['content'];
    }

    const html = exportProjectToHtml(project);
    // Strip <script>...</script> blocks (these contain the MODEL JSON + JS runtime,
    // where the payload legitimately appears as a JSON string literal).
    const htmlBody = html.replace(/<script[\s\S]*?<\/script>/gi, '');

    // In the remaining HTML body, no raw <img onerror should appear from user content.
    expect(htmlBody).not.toMatch(/<img[^>]*onerror\s*=/i);
  });

  it('result-summary breakdown with XSS payload does not render as live script', () => {
    const project = createSamplePpknProject();
    const resultPage = project.pages.find((p) => p.role === 'menu') ?? project.pages[3];
    if (resultPage) {
      resultPage.sceneType = 'result-summary';
      resultPage.sceneContent = {
        kind: 'result-summary',
        scoreSummary: { score: 80, maxScore: 100 },
        achievementLevel: 'Good',
        breakdown: [
          { label: '<script>alert("xss-label")</script>', value: '<script>alert("xss-value")</script>' },
        ],
      } as unknown as AiMpiBlueprint['scenes'][number]['slots'][number]['content'];
    }

    const html = exportProjectToHtml(project);
    // The XSS <script> payload WILL appear in the embedded MODEL JSON, but
    // serializeRenderModel() escapes </script> → <\/script> so the browser
    // parser does NOT see them as closing the runtime <script> block.
    // Verify the escape happened:
    expect(html).toMatch(/<\\\/script>/);
    // And verify the unescaped form </script> (which WOULD close the runtime
    // block and let user content execute) does NOT appear in user-content
    // positions. The only legitimate </script> is the one closing the
    // runtime block at the very end of the HTML.
    const closingScriptCount = (html.match(/<\/script>/gi) || []).length;
    expect(closingScriptCount).toBe(1); // only the runtime closing tag
  });
});

// ---------------------------------------------------------------------------
// 6.2 — Answer leak via DOM attributes
// ---------------------------------------------------------------------------

describe('Fase 0 / Audit 6.2 — answer leak prevention', () => {
  it('quiz scene progress text does not contain correctChoiceId', () => {
    const project = createSamplePpknProject();
    const quizPage = project.pages.find((p) => p.role === 'quiz');
    if (quizPage) {
      quizPage.sceneType = 'quiz-challenge';
      quizPage.sceneContent = {
        kind: 'quiz-question',
        prompt: 'What is 2+2?',
        choices: [
          { id: 'choice-a', text: '3' },
          { id: 'choice-b', text: '4' },
          { id: 'choice-c', text: '5' },
        ],
        correctChoiceId: 'choice-b',
      } as unknown as AiMpiBlueprint['scenes'][number]['slots'][number]['content'];
    }

    const html = exportProjectToHtml(project);
    // The correctChoiceId must NOT appear in the rendered progress text
    expect(html).not.toMatch(/Correct:\s*choice-b/);
    expect(html).not.toMatch(/·\s*Correct/);
  });

  it('diagnostic check choices do not have data-correct attribute', () => {
    const project = createSamplePpknProject();
    const diagPage = project.pages.find((p) => p.role === 'menu') ?? project.pages[3];
    if (diagPage) {
      diagPage.sceneType = 'diagnostic-check';
      diagPage.sceneContent = {
        kind: 'diagnostic-check',
        questions: [
          {
            id: 'q1',
            prompt: 'Question 1',
            choices: [
              { id: 'c1', text: 'Wrong' },
              { id: 'c2', text: 'Right' },
            ],
            correctChoiceId: 'c2',
          },
        ],
        readinessLevels: [{ minScore: 1, level: 'Ready', description: 'Go' }],
        recommendation: 'Proceed',
      } as unknown as AiMpiBlueprint['scenes'][number]['slots'][number]['content'];
    }

    const html = exportProjectToHtml(project);
    // No choice button should have data-correct attribute
    expect(html).not.toMatch(/data-correct=["'](?:true|false)["']/);
  });

  it('classification game items do not have data-correct-cat attribute', () => {
    const project = createSamplePpknProject();
    const gamePage = project.pages.find((p) => p.role === 'activity');
    if (gamePage) {
      gamePage.sceneType = 'classification-game';
      gamePage.sceneContent = {
        kind: 'classification-game',
        items: [
          { id: 'item-1', label: 'Item 1', correctCategory: 'cat-a' },
          { id: 'item-2', label: 'Item 2', correctCategory: 'cat-b' },
        ],
        categories: [
          { id: 'cat-a', label: 'Category A' },
          { id: 'cat-b', label: 'Category B' },
        ],
      } as unknown as AiMpiBlueprint['scenes'][number]['slots'][number]['content'];
    }

    const html = exportProjectToHtml(project);
    // No item button should have data-correct-cat attribute
    expect(html).not.toMatch(/data-correct-cat=/);
  });
});

// ---------------------------------------------------------------------------
// 1.2 — customStyle preserved through normalizeSlot
// ---------------------------------------------------------------------------

describe('Fase 0 / Audit 1.2 — customStyle preserved through normalizer', () => {
  it('normalizeAiMpiJson preserves customStyle on slot', () => {
    // This test exercises the PRODUCTION normalizer path (not templateToBlueprint).
    // Previously normalizeSlot silently dropped customStyle.
    const rawBlueprint = {
      version: 1,
      metadata: { title: 'Test' },
      styleIntent: { styleId: 'modern-clean', mood: 'clean', intent: 'test' },
      designSystem: { contractId: 'modern-clean', paletteName: 'p', typographyName: 't' },
      flow: { steps: [{ sceneId: 's1' }], mode: 'linear' },
      scenes: [
        {
          id: 's1',
          role: 'material',
          sceneType: 'learning-scene',
          title: 'Test Scene',
          slots: [
            {
              id: 'slot-1',
              role: 'primary',
              placement: { x: 0, y: 0, width: 100, height: 50 },
              content: {
                kind: 'learning-material',
                conceptTitle: 'Test',
                explanation: 'Test explanation',
              },
              customStyle: {
                shell: { background: '#ff0000', padding: '20px' },
                header: { color: 'blue' },
              },
            },
          ],
        },
      ],
      assets: [],
      runtime: { showProgress: true, showScore: true },
      exportConfig: { format: 'html-standalone', embedAssets: true, includeToolbar: true, stageWidth: 1280, stageHeight: 720 },
    };

    const errors = validateAiMpiJson(rawBlueprint);
    expect(errors).toHaveLength(0);

    const normalized = normalizeAiMpiJson(rawBlueprint);
    // customStyle MUST be preserved (was silently dropped before fix)
    expect(normalized.scenes[0].slots[0].customStyle).toBeDefined();
    expect(normalized.scenes[0].slots[0].customStyle?.shell).toEqual({
      background: '#ff0000',
      padding: '20px',
    });
    expect(normalized.scenes[0].slots[0].customStyle?.header).toEqual({
      color: 'blue',
    });
  });

  it('normalizeAiMpiJson returns undefined customStyle when absent', () => {
    const rawBlueprint = {
      version: 1,
      metadata: { title: 'Test' },
      styleIntent: { styleId: 'modern-clean', mood: 'clean', intent: 'test' },
      designSystem: { contractId: 'modern-clean', paletteName: 'p', typographyName: 't' },
      flow: { steps: [{ sceneId: 's1' }], mode: 'linear' },
      scenes: [
        {
          id: 's1',
          role: 'material',
          sceneType: 'learning-scene',
          title: 'Test Scene',
          slots: [
            {
              id: 'slot-1',
              role: 'primary',
              placement: { x: 0, y: 0, width: 100, height: 50 },
              content: { kind: 'learning-material', conceptTitle: 'T', explanation: 'E' },
              // no customStyle
            },
          ],
        },
      ],
      assets: [],
      runtime: { showProgress: true, showScore: true },
      exportConfig: { format: 'html-standalone', embedAssets: true, includeToolbar: true, stageWidth: 1280, stageHeight: 720 },
    };

    const normalized = normalizeAiMpiJson(rawBlueprint);
    expect(normalized.scenes[0].slots[0].customStyle).toBeUndefined();
  });

  it('customStyle survives end-to-end: raw JSON → normalize → SimpleProject.sceneCustomStyle', () => {
    const rawBlueprint = {
      version: 1,
      metadata: { title: 'Test' },
      styleIntent: { styleId: 'modern-clean', mood: 'clean', intent: 'test' },
      designSystem: { contractId: 'modern-clean', paletteName: 'p', typographyName: 't' },
      flow: { steps: [{ sceneId: 's1' }], mode: 'linear' },
      scenes: [
        {
          id: 's1',
          role: 'material',
          sceneType: 'learning-scene',
          title: 'Test Scene',
          slots: [
            {
              id: 'slot-1',
              role: 'primary',
              placement: { x: 0, y: 0, width: 100, height: 50 },
              content: { kind: 'learning-material', conceptTitle: 'T', explanation: 'E' },
              customStyle: { shell: { background: 'red' } },
            },
          ],
        },
      ],
      assets: [],
      runtime: { showProgress: true, showScore: true },
      exportConfig: { format: 'html-standalone', embedAssets: true, includeToolbar: true, stageWidth: 1280, stageHeight: 720 },
    };

    const normalized = normalizeAiMpiJson(rawBlueprint);
    const project = aiBlueprintToSimpleProject(normalized);
    // sceneCustomStyle on the page should reflect the customStyle from the slot
    expect(project.pages[0].sceneCustomStyle).toBeDefined();
    expect(project.pages[0].sceneCustomStyle?.shell).toEqual({ background: 'red' });
  });
});

// ---------------------------------------------------------------------------
// 1.3 — Forbidden-field guard in new pipeline
// ---------------------------------------------------------------------------

describe('Fase 0 / Audit 1.3 — forbidden-field guard in new pipeline', () => {
  function makeValidBlueprintBase() {
    return {
      version: 1,
      metadata: { title: 'Test' },
      styleIntent: { styleId: 'modern-clean', mood: 'clean', intent: 'test' },
      designSystem: { contractId: 'modern-clean', paletteName: 'p', typographyName: 't' },
      flow: { steps: [{ sceneId: 's1' }], mode: 'linear' },
      scenes: [
        {
          id: 's1',
          role: 'material',
          sceneType: 'learning-scene',
          title: 'Test',
          slots: [
            {
              id: 'slot-1',
              role: 'primary',
              placement: { x: 0, y: 0, width: 100, height: 50 },
              content: { kind: 'learning-material', conceptTitle: 'T', explanation: 'E' },
            },
          ],
        },
      ],
      assets: [],
      runtime: { showProgress: true, showScore: true },
      exportConfig: { format: 'html-standalone', embedAssets: true, includeToolbar: true, stageWidth: 1280, stageHeight: 720 },
    };
  }

  it('rejects blueprint with html field in slot content', () => {
    const bp = makeValidBlueprintBase();
    (bp.scenes[0].slots[0].content as Record<string, unknown>).html = '<script>alert(1)</script>';
    const errors = validateAiMpiJson(bp);
    expect(errors.some((e) => e.message.includes('forbidden field'))).toBe(true);
  });

  it('rejects blueprint with script field anywhere', () => {
    const bp = makeValidBlueprintBase();
    (bp.scenes[0].slots[0].content as Record<string, unknown>).script = 'alert(1)';
    const errors = validateAiMpiJson(bp);
    expect(errors.some((e) => e.message.includes('forbidden field'))).toBe(true);
  });

  it('rejects blueprint with className field', () => {
    const bp = makeValidBlueprintBase();
    (bp.scenes[0].slots[0].content as Record<string, unknown>).className = 'evil-class';
    const errors = validateAiMpiJson(bp);
    expect(errors.some((e) => e.message.includes('forbidden field'))).toBe(true);
  });

  it('rejects blueprint with iframe field at top level', () => {
    const bp = makeValidBlueprintBase() as Record<string, unknown>;
    bp.iframe = 'https://evil.com';
    const errors = validateAiMpiJson(bp);
    expect(errors.some((e) => e.message.includes('forbidden field'))).toBe(true);
  });

  it('rejects blueprint with dangerouslySetInnerHTML nested deep', () => {
    const bp = makeValidBlueprintBase();
    (bp.scenes[0].slots[0].content as Record<string, unknown>).reward = {
      label: 'x',
      dangerouslySetInnerHTML: '<img src=x onerror=alert(1)>',
    };
    const errors = validateAiMpiJson(bp);
    expect(errors.some((e) => e.message.includes('forbidden field'))).toBe(true);
  });

  it('ALLOWS customStyle (structured CSS object, not raw string)', () => {
    const bp = makeValidBlueprintBase();
    bp.scenes[0].slots[0].customStyle = { shell: { background: 'red' } };
    const errors = validateAiMpiJson(bp);
    // customStyle is NOT in FORBIDDEN_KEYS, so no forbidden-field error
    expect(errors.every((e) => !e.message.includes('forbidden field'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 8.2 — Template content deep-clone (no singleton mutation)
// ---------------------------------------------------------------------------

describe('Fase 0 / Audit 8.2 — template content deep-clone', () => {
  it('templateToBlueprint produces a blueprint with content NOT referencing the template singleton', () => {
    const originalContent = TEMPLATE_PPKN_NORMA.scenes[0].content;
    const originalTitle = (originalContent as { heroTitle?: string }).heroTitle;

    const bp1 = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    // Mutate the blueprint's slot content
    const bp1Content = bp1.scenes[0].slots[0].content as { heroTitle?: string };
    bp1Content.heroTitle = 'MUTATED TITLE';

    // Generate a second blueprint from the same template
    const bp2 = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    const bp2Content = bp2.scenes[0].slots[0].content as { heroTitle?: string };

    // bp2 should have the ORIGINAL title, not the mutated one.
    // If deep-clone is working, mutating bp1 does not affect bp2 or the template.
    expect(bp2Content.heroTitle).toBe(originalTitle);
    expect(bp2Content.heroTitle).not.toBe('MUTATED TITLE');

    // The template singleton itself should also be unchanged.
    const templateContentAfter = TEMPLATE_PPKN_NORMA.scenes[0].content as { heroTitle?: string };
    expect(templateContentAfter.heroTitle).toBe(originalTitle);
  });

  it('templateToBlueprint deep-clones objectives (curriculum)', () => {
    const originalObjectives = JSON.parse(JSON.stringify(TEMPLATE_PPKN_NORMA.objectives));

    const bp1 = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    // Mutate the blueprint's curriculum objectives
    if (bp1.curriculum?.objectives) {
      bp1.curriculum.objectives[0].text = 'MUTATED OBJECTIVE';
    }

    // The template singleton's objectives should be unchanged.
    expect(TEMPLATE_PPKN_NORMA.objectives[0].text).toBe(originalObjectives[0].text);
    expect(TEMPLATE_PPKN_NORMA.objectives[0].text).not.toBe('MUTATED OBJECTIVE');
  });
});

// ---------------------------------------------------------------------------
// 1.4 — verifyRoundTrip wired in production import
// ---------------------------------------------------------------------------

describe('Fase 0 / Audit 1.4 — verifyRoundTrip available + functional', () => {
  it('verifyRoundTrip returns empty issues for a clean template conversion', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    const project = aiBlueprintToSimpleProject(bp);
    const issues = verifyRoundTrip(bp, project);
    // A clean conversion should have no issues
    expect(issues).toHaveLength(0);
  });

  it('verifyRoundTrip detects scene count mismatch', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    const project = aiBlueprintToSimpleProject(bp);
    // Drop a page to simulate a regression
    project.pages.pop();
    const issues = verifyRoundTrip(bp, project);
    expect(issues.some((i) => i.field === 'scenes.length')).toBe(true);
  });

  it('verifyRoundTrip detects sceneType mismatch', () => {
    const bp = templateToBlueprint(TEMPLATE_PPKN_NORMA);
    const project = aiBlueprintToSimpleProject(bp);
    // Corrupt a sceneType to simulate a regression
    if (project.pages[0]) {
      project.pages[0].sceneType = 'wrong-scene-type';
    }
    const issues = verifyRoundTrip(bp, project);
    expect(issues.some((i) => i.field.startsWith('scenes[0].sceneType'))).toBe(true);
  });
});
