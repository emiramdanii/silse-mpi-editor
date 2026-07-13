/**
 * V2-PILAR-3 PATCH: Tests for celebration enhancement.
 *
 * Coverage:
 *   1. getCelebrationContainer — creates once, reuses on subsequent calls
 *   2. attachDualCleanup — animationend + transitionend + setTimeout
 *   3. triggerLocalBurst — uses centralized container
 *   4. triggerFullScreenBurst — uses centralized container
 *   5. triggerStreakIndicator — uses centralized container + dual cleanup
 *   6. Export HTML contains patched JS (getCelebrationContainer, attachDualCleanup)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  triggerLocalBurst,
  triggerFullScreenBurst,
  triggerStreakIndicator,
  getCelebrationContainer,
  DEFAULT_CELEBRATION_PALETTE,
} from '../core/scoring/celebration';
import { exportProjectToHtml } from '../export/export-html';
import { createProject } from '../core/project-factory';

// ---------------------------------------------------------------------------
// 1. getCelebrationContainer — centralized container creation + reuse
// ---------------------------------------------------------------------------

describe('V2-PILAR-3 PATCH — getCelebrationContainer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('1. creates container on first call', () => {
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    const container = getCelebrationContainer(parent);
    expect(container).not.toBeNull();
    expect(container.id).toBe('silse-celebration-container');
    expect(parent.querySelector('#silse-celebration-container')).not.toBeNull();
  });

  it('2. reuses same container on second call', () => {
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    const container1 = getCelebrationContainer(parent);
    const container2 = getCelebrationContainer(parent);
    expect(container1).toBe(container2);
  });

  it('3. container has pointer-events: none', () => {
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    const container = getCelebrationContainer(parent);
    expect(container.style.pointerEvents).toBe('none');
  });

  it('4. container has position: absolute', () => {
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    const container = getCelebrationContainer(parent);
    expect(container.style.position).toBe('absolute');
  });

  it('5. container has z-index: 200', () => {
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    const container = getCelebrationContainer(parent);
    expect(container.style.zIndex).toBe('200');
  });

  it('6. does not create duplicate containers', () => {
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    getCelebrationContainer(parent);
    getCelebrationContainer(parent);
    getCelebrationContainer(parent);
    const containers = parent.querySelectorAll('#silse-celebration-container');
    expect(containers.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 2. triggerLocalBurst — uses centralized container
// ---------------------------------------------------------------------------

describe('V2-PILAR-3 PATCH — triggerLocalBurst with centralized container', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('7. creates particles in centralized container', () => {
    const parent = document.createElement('div');
    parent.setAttribute('data-testid', 'canvas-frame');
    parent.style.position = 'relative';
    document.body.appendChild(parent);
    const origin = document.createElement('button');
    parent.appendChild(origin);
    triggerLocalBurst(origin, DEFAULT_CELEBRATION_PALETTE, 5);
    const celebContainer = parent.querySelector('#silse-celebration-container');
    expect(celebContainer).not.toBeNull();
    const particles = celebContainer!.querySelectorAll('.silse-particle');
    expect(particles.length).toBe(5);
  });

  it('8. does NOT create .silse-burst-local in origin element', () => {
    const parent = document.createElement('div');
    parent.setAttribute('data-testid', 'canvas-frame');
    parent.style.position = 'relative';
    document.body.appendChild(parent);
    const origin = document.createElement('button');
    parent.appendChild(origin);
    triggerLocalBurst(origin, DEFAULT_CELEBRATION_PALETTE, 3);
    // Old pattern was to create .silse-burst-local inside origin — now should NOT exist
    expect(origin.querySelector('.silse-burst-local')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3. triggerFullScreenBurst — uses centralized container
// ---------------------------------------------------------------------------

describe('V2-PILAR-3 PATCH — triggerFullScreenBurst with centralized container', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('9. creates particles in centralized container', () => {
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.width = '1280px';
    container.style.height = '720px';
    document.body.appendChild(container);
    triggerFullScreenBurst(container, DEFAULT_CELEBRATION_PALETTE, 10);
    const celebContainer = container.querySelector('#silse-celebration-container');
    expect(celebContainer).not.toBeNull();
    const particles = celebContainer!.querySelectorAll('.silse-particle-fullscreen');
    expect(particles.length).toBe(10);
  });

  it('10. does NOT create .silse-burst-fullscreen overlay', () => {
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.width = '1280px';
    container.style.height = '720px';
    document.body.appendChild(container);
    triggerFullScreenBurst(container, DEFAULT_CELEBRATION_PALETTE, 5);
    // Old pattern was to create .silse-burst-fullscreen overlay — now should NOT exist
    expect(container.querySelector('.silse-burst-fullscreen')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 4. triggerStreakIndicator — uses centralized container + dual cleanup
// ---------------------------------------------------------------------------

describe('V2-PILAR-3 PATCH — triggerStreakIndicator with centralized container', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('11. creates indicator in centralized container', () => {
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.width = '1280px';
    container.style.height = '720px';
    document.body.appendChild(container);
    triggerStreakIndicator(container, 'Test message', false);
    const celebContainer = container.querySelector('#silse-celebration-container');
    expect(celebContainer).not.toBeNull();
    const indicator = celebContainer!.querySelector('.silse-streak-indicator');
    expect(indicator).not.toBeNull();
    expect(indicator?.textContent).toBe('Test message');
  });

  it('12. indicator is removed after setTimeout', async () => {
    const container = document.createElement('div');
    container.style.position = 'relative';
    document.body.appendChild(container);
    triggerStreakIndicator(container, 'Test', false);
    const celebContainer = container.querySelector('#silse-celebration-container')!;
    expect(celebContainer.querySelector('.silse-streak-indicator')).not.toBeNull();
    // Wait for cleanup (1.7s + buffer)
    await new Promise((resolve) => setTimeout(resolve, 1800));
    expect(celebContainer.querySelector('.silse-streak-indicator')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 5. Export HTML contains patched JS
// ---------------------------------------------------------------------------

describe('V2-PILAR-3 PATCH — Export HTML patched JS', () => {
  it('13. export HTML contains getCelebrationContainer function', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('function getCelebrationContainer');
  });

  it('14. export HTML contains attachDualCleanup function', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('function attachDualCleanup');
  });

  it('15. export HTML contains animationend listener', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain("addEventListener('animationend'");
  });

  it('16. export HTML contains transitionend listener (defense-in-depth)', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain("addEventListener('transitionend'");
  });

  it('17. export HTML contains #silse-celebration-container ID', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-celebration-container');
  });

  it('18. export HTML does NOT contain old .silse-burst-local creation pattern', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    // Old pattern: originElement.querySelector('.silse-burst-local')
    // Should NOT appear in the patched version
    expect(html).not.toContain("querySelector('.silse-burst-local')");
  });

  it('19. export HTML still contains pointer-events:none in container CSS', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('pointer-events:none');
  });

  it('20. export HTML contains fallback safety cleanup for fullscreen particles', () => {
    const project = createProject();
    const html = exportProjectToHtml(project);
    expect(html).toContain('silse-particle-fullscreen');
    // The fallback safety net removes remaining particles after 1.5s
    expect(html).toMatch(/1500/);
  });
});
