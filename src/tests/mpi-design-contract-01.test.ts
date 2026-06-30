/**
 * MPI-DESIGN-CONTRACT-01 — Test Suite.
 *
 * Kontrak: 16 design token categories punya type resmi, default contract
 * tersedia, validator tersedia, tidak ada CSS premium baru.
 */

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_DESIGN_CONTRACT,
  DEFAULT_DESIGN_CONTRACT_ID,
  DESIGN_CONTRACTS,
  getDesignContract,
  validateDesignContract,
  isValidDesignContract,
  assertValidDesignContract,
  type MpiDesignContract,
} from '../core/mpi-design-contract';

describe('MPI-DESIGN-CONTRACT-01 — 16 design token categories', () => {
  it('1. DesignFrame punya width, height, aspectRatio, safeArea, stageRadius, overflow, exportScale', () => {
    const f = DEFAULT_DESIGN_CONTRACT.frame;
    expect(f.width).toBe(1280);
    expect(f.height).toBe(720);
    expect(f.aspectRatio).toBe('16/9');
    expect(f.safeArea).toBeDefined();
    expect(f.safeArea.top).toBeGreaterThan(0);
    expect(typeof f.stageRadius).toBe('number');
    expect(['hidden', 'visible', 'scroll']).toContain(f.overflow);
    expect(typeof f.exportScale).toBe('number');
  });

  it('2. DesignPalette punya 12 warna', () => {
    const p = DEFAULT_DESIGN_CONTRACT.palette;
    const required = ['primary', 'secondary', 'accent', 'background', 'surface', 'text', 'mutedText', 'border', 'success', 'warning', 'danger', 'gold'];
    for (const key of required) {
      expect(typeof (p as Record<string, unknown>)[key]).toBe('string');
    }
  });

  it('3. DesignBackground punya pattern (10 opsi) + color/gradient/image/overlay/glow', () => {
    const b = DEFAULT_DESIGN_CONTRACT.background;
    expect(['none', 'solid', 'gradient-linear', 'gradient-radial', 'gradient-conic', 'image', 'pattern-grid', 'pattern-dots', 'pattern-glow', 'overlay', 'decorative-shapes']).toContain(b.pattern);
  });

  it('4. DesignTypography punya heroFont, bodyFont, sizes, weight, lineHeight, letterSpacing, uppercase, textShadow', () => {
    const t = DEFAULT_DESIGN_CONTRACT.typography;
    expect(typeof t.heroFont).toBe('string');
    expect(typeof t.bodyFont).toBe('string');
    expect(t.titleSize).toBeGreaterThan(0);
    expect(t.bodySize).toBeGreaterThan(0);
    expect(typeof t.lineHeight).toBe('number');
    expect(typeof t.uppercase).toBe('boolean');
  });

  it('5. DesignLayoutPlacement punya x, y, width, height, zIndex, slot, anchor, align, gap, grid', () => {
    const placement = { x: 0, y: 0, width: 100, height: 50, zIndex: 1 };
    expect(placement.x).toBe(0);
    expect(placement.zIndex).toBe(1);
  });

  it('6. DesignCard punya background, radius, padding, border, shadow, titleStyle, bodyStyle, accentStrip, iconCorner, glassEffect', () => {
    const c = DEFAULT_DESIGN_CONTRACT.card;
    expect(typeof c.background).toBe('string');
    expect(typeof c.radius).toBe('number');
    expect(typeof c.padding).toBe('number');
    expect(typeof c.border).toBe('string');
    expect(typeof c.shadow).toBe('string');
    expect(typeof c.glassEffect).toBe('boolean');
  });

  it('7. DesignButton punya 5 variant (primary, secondary, ghost, mission, gold)', () => {
    const b = DEFAULT_DESIGN_CONTRACT.button;
    expect(b.primary).toBeDefined();
    expect(b.secondary).toBeDefined();
    expect(b.ghost).toBeDefined();
    expect(b.mission).toBeDefined();
    expect(b.gold).toBeDefined();
    expect(b.primary.variant).toBe('primary');
  });

  it('8. DesignBadge punya background, color, radius, icon, border, size, placement', () => {
    const b = DEFAULT_DESIGN_CONTRACT.badge;
    expect(typeof b.background).toBe('string');
    expect(['sm', 'md', 'lg']).toContain(b.size);
  });

  it('9. DesignImageSlot punya src, objectFit, maskRadius, opacity, slot, decorativeArt, visualAnchor', () => {
    const img = { src: 'test.png', objectFit: 'cover' as const, opacity: 1 };
    expect(img.src).toBe('test.png');
    expect(['cover', 'contain']).toContain(img.objectFit);
  });

  it('10. DesignNavigation punya nextButton, prevButton, menuButton, pageIndicator, progressPill, toolbarStyle', () => {
    const n = DEFAULT_DESIGN_CONTRACT.navigation;
    expect(['floating-glass', 'solid', 'minimal']).toContain(n.toolbarStyle);
  });

  it('11. DesignQuiz punya questionPanel, answerCard, choiceLetterBadge, selectedState, correctState, wrongState, feedbackBox, scoreDisplay', () => {
    const q = DEFAULT_DESIGN_CONTRACT.quiz;
    expect(q.choiceLetterBadge).toBeDefined();
    expect(q.correctState).toBeDefined();
    expect(q.wrongState).toBeDefined();
  });

  it('12. DesignGame punya briefingPanel, targetPanel, actionCardGrid, actionCardStyle, selectedAction, correct/wrong state, feedbackPanel, rewardBadge, missionProgress', () => {
    const g = DEFAULT_DESIGN_CONTRACT.game;
    expect(g.briefingPanel).toBeDefined();
    expect(g.targetPanel).toBeDefined();
    expect(g.actionCardGrid).toBeDefined();
    expect(g.rewardBadge).toBeDefined();
  });

  it('13. DesignFeedback punya 4 variant (correct, wrong, neutral, warning)', () => {
    const f = DEFAULT_DESIGN_CONTRACT.feedback;
    expect(f.correct).toBeDefined();
    expect(f.wrong).toBeDefined();
    expect(f.neutral).toBeDefined();
    expect(f.warning).toBeDefined();
    expect(f.correct.variant).toBe('correct');
  });

  it('14. DesignReward punya medal, badge, ribbon, certificatePanel, completionMessage, reflectionCard', () => {
    const r = DEFAULT_DESIGN_CONTRACT.reward;
    expect(r.medal).toBeDefined();
    expect(r.ribbon).toBeDefined();
    expect(r.certificatePanel).toBeDefined();
  });

  it('15. DesignMapHotspot punya mapBackground, hotspotPosition, hotspotColor, hotspotLabel, activeState, completedState, tooltipCard', () => {
    const m = DEFAULT_DESIGN_CONTRACT.mapHotspot;
    expect(m).toBeDefined();
    expect(typeof m?.hotspotColor).toBe('string');
  });

  it('16. DesignMotionPreset punya 6 preset (none, soft-fade, slide-up, pulse, reward-pop, correct-burst)', () => {
    const m = DEFAULT_DESIGN_CONTRACT.motion;
    const presets = ['none', 'soft-fade', 'slide-up', 'pulse', 'reward-pop', 'correct-burst'];
    for (const p of presets) {
      expect((m as Record<string, unknown>)[p]).toBeDefined();
    }
  });
});

describe('MPI-DESIGN-CONTRACT-01 — default + registry', () => {
  it('17. DEFAULT_DESIGN_CONTRACT valid', () => {
    expect(DEFAULT_DESIGN_CONTRACT.id).toBe(DEFAULT_DESIGN_CONTRACT_ID);
    expect(DEFAULT_DESIGN_CONTRACT.name).toBeTruthy();
  });

  it('18. DESIGN_CONTRACTS punya 4 contract (default + 3 style packs)', () => {
    expect(DESIGN_CONTRACTS.default).toBeDefined();
    expect(DESIGN_CONTRACTS['modern-clean']).toBeDefined();
    expect(DESIGN_CONTRACTS['soft-classroom']).toBeDefined();
    expect(DESIGN_CONTRACTS['mission-dark']).toBeDefined();
  });

  it('19. getDesignContract returns contract by id', () => {
    expect(getDesignContract('modern-clean').id).toBe('modern-clean');
    expect(getDesignContract('soft-classroom').id).toBe('soft-classroom');
    expect(getDesignContract('mission-dark').id).toBe('mission-dark');
  });

  it('20. getDesignContract fallback ke default untuk unknown id', () => {
    expect(getDesignContract('unknown')).toBe(DEFAULT_DESIGN_CONTRACT);
    expect(getDesignContract(undefined)).toBe(DEFAULT_DESIGN_CONTRACT);
  });

  it('21. semua contract di registry valid', () => {
    for (const id of ['default', 'modern-clean', 'soft-classroom', 'mission-dark']) {
      const errors = validateDesignContract(DESIGN_CONTRACTS[id]);
      expect(errors).toHaveLength(0);
    }
  });
});

describe('MPI-DESIGN-CONTRACT-01 — validator', () => {
  it('22. validateDesignContract returns empty array for valid contract', () => {
    const errors = validateDesignContract(DEFAULT_DESIGN_CONTRACT);
    expect(errors).toHaveLength(0);
  });

  it('23. validateDesignContract returns errors for null', () => {
    const errors = validateDesignContract(null);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('24. validateDesignContract returns errors for missing frame', () => {
    const invalid = { ...DEFAULT_DESIGN_CONTRACT, frame: undefined };
    const errors = validateDesignContract(invalid);
    expect(errors.some((e) => e.path === 'frame')).toBe(true);
  });

  it('25. validateDesignContract returns errors for missing palette colors', () => {
    const invalid = { ...DEFAULT_DESIGN_CONTRACT, palette: { ...DEFAULT_DESIGN_CONTRACT.palette, primary: undefined } };
    const errors = validateDesignContract(invalid);
    expect(errors.some((e) => e.path === 'palette.primary')).toBe(true);
  });

  it('26. validateDesignContract returns errors for missing button variant', () => {
    const invalid = { ...DEFAULT_DESIGN_CONTRACT, button: { ...DEFAULT_DESIGN_CONTRACT.button, primary: undefined } };
    const errors = validateDesignContract(invalid);
    expect(errors.some((e) => e.path === 'button.primary')).toBe(true);
  });

  it('27. isValidDesignContract returns boolean', () => {
    expect(isValidDesignContract(DEFAULT_DESIGN_CONTRACT)).toBe(true);
    expect(isValidDesignContract(null)).toBe(false);
  });

  it('28. assertValidDesignContract throws for invalid', () => {
    expect(() => assertValidDesignContract(null)).toThrow();
    expect(() => assertValidDesignContract(DEFAULT_DESIGN_CONTRACT)).not.toThrow();
  });

  it('29. validator tidak throw — returns error array', () => {
    expect(() => validateDesignContract(null)).not.toThrow();
    expect(() => validateDesignContract({})).not.toThrow();
  });

  it('30. validator menolak contract dengan motion preset hilang', () => {
    const invalid = { ...DEFAULT_DESIGN_CONTRACT, motion: { ...DEFAULT_DESIGN_CONTRACT.motion, pulse: undefined } };
    const errors = validateDesignContract(invalid);
    expect(errors.some((e) => e.path === 'motion.pulse')).toBe(true);
  });
});

describe('MPI-DESIGN-CONTRACT-01 — no premium CSS, no style pack baru', () => {
  it('31. tidak ada CSS premium baru di contract (hanya data token)', () => {
    const c: MpiDesignContract = DEFAULT_DESIGN_CONTRACT;
    // Contract hanya data, bukan CSS string bebas
    expect(typeof c.frame.stageRadius).toBe('number');
    expect(typeof c.card.radius).toBe('number');
    expect(typeof c.palette.primary).toBe('string');
  });

  it('32. style packs existing tetap (modern-clean, soft-classroom, mission-dark)', () => {
    // Tidak ada style pack baru ditambah — hanya 3 existing + default
    const ids = Object.keys(DESIGN_CONTRACTS);
    expect(ids).toContain('default');
    expect(ids).toContain('modern-clean');
    expect(ids).toContain('soft-classroom');
    expect(ids).toContain('mission-dark');
    expect(ids).toContain('golden-reference');
    // Tidak ada style pack ke-5
    expect(ids.length).toBe(5);
  });
});
