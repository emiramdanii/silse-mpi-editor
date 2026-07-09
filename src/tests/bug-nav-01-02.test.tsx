/**
 * BUG-NAV-01 + BUG-NAV-02 — Navigation button wiring + toolbar reposition.
 *
 * BUG-NAV-01: Tombol "Mulai Pembelajaran" (cover primaryAction) + "Selesai" (closing
 * finalAction) di export HTML tidak berfungsi — tombol di-create tapi tidak di-wire
 * ke event handler. Fix: tambah addEventListener('click', navigate(action)).
 *
 * BUG-NAV-02: Toolbar navigasi (prev/next) di position:absolute top:18px — kurang
 * estetik. Fix: reposition ke bottom-center floating pill (bottom:20px, transform
 * translateX(-50%), backdrop blur, dark glass background).
 */

import { describe, it, expect } from 'vitest';

import { templateToBlueprint, TEMPLATE_PPKN_NORMA } from '../core/guided-flow/pedagogical-templates';
import { aiBlueprintToSimpleProject } from '../core/ai-mpi-json/aiBlueprintToSimpleProject';
import { exportProjectToHtml } from '../export/export-html';

describe('BUG-NAV-01 — Cover primaryAction button wired to navigate()', () => {
  it('1. export HTML contains primaryAction button with click handler', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const html = exportProjectToHtml(project);
    // primaryAction button should have addEventListener('click' in JS
    expect(html).toContain('silse-cover-primary-action');
    expect(html).toMatch(/pa\.addEventListener\('click'/);
  });

  it('2. export HTML wires primaryAction to navigate function', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const html = exportProjectToHtml(project);
    // Should contain navigate(paAction) call in the click handler
    expect(html).toMatch(/navigate\(paAction\)/);
  });

  it('3. export HTML uses content.primaryAction.action or defaults to next', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const html = exportProjectToHtml(project);
    expect(html).toContain("content.primaryAction.action || 'next'");
  });

  it('4. primaryAction button has aria-label for accessibility', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const html = exportProjectToHtml(project);
    expect(html).toContain('setAttribute(\'aria-label\'');
  });
});

describe('BUG-NAV-01 — Closing finalAction button wired to navigate()', () => {
  it('5. export HTML contains finalAction button with click handler', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-closing-final-action');
    expect(html).toMatch(/fa\.addEventListener\('click'/);
  });

  it('6. export HTML wires finalAction to navigate function', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const html = exportProjectToHtml(project);
    expect(html).toMatch(/navigate\(faAction\)/);
  });

  it('7. finalAction defaults to prev (closing is last page)', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const html = exportProjectToHtml(project);
    expect(html).toContain("content.finalAction.action || 'prev'");
  });
});

describe('BUG-NAV-02 — Toolbar repositioned to bottom-center floating pill', () => {
  it('8. toolbar CSS uses bottom positioning (not top)', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const html = exportProjectToHtml(project);
    const toolbarMatch = html.match(/#silse-toolbar\s*\{[^}]*\}/);
    expect(toolbarMatch).toBeTruthy();
    expect(toolbarMatch![0]).toContain('bottom:');
    expect(toolbarMatch![0]).not.toContain('top: 18px');
  });

  it('9. toolbar is centered horizontally with transform translateX(-50%)', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const html = exportProjectToHtml(project);
    const toolbarMatch = html.match(/#silse-toolbar\s*\{[^}]*\}/);
    expect(toolbarMatch).toBeTruthy();
    expect(toolbarMatch![0]).toContain('left: 50%');
    expect(toolbarMatch![0]).toContain('translateX(-50%)');
  });

  it('10. toolbar has glass/blur background (floating pill aesthetic)', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const html = exportProjectToHtml(project);
    const toolbarMatch = html.match(/#silse-toolbar\s*\{[^}]*\}/);
    expect(toolbarMatch).toBeTruthy();
    expect(toolbarMatch![0]).toContain('backdrop-filter: blur');
    expect(toolbarMatch![0]).toContain('border-radius: 999px');
  });

  it('11. toolbar has box-shadow for floating effect', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const html = exportProjectToHtml(project);
    const toolbarMatch = html.match(/#silse-toolbar\s*\{[^}]*\}/);
    expect(toolbarMatch).toBeTruthy();
    expect(toolbarMatch![0]).toContain('box-shadow');
  });

  it('12. toolbar pointer-events is auto (clickable, not just visual)', () => {
    const project = aiBlueprintToSimpleProject(templateToBlueprint(TEMPLATE_PPKN_NORMA));
    const html = exportProjectToHtml(project);
    const toolbarMatch = html.match(/#silse-toolbar\s*\{[^}]*\}/);
    expect(toolbarMatch).toBeTruthy();
    expect(toolbarMatch![0]).toContain('pointer-events: auto');
  });
});
