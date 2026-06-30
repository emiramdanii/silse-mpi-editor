/**
 * Validate Design Contract (MPI-DESIGN-CONTRACT-01).
 *
 * Layer: core/mpi-design-contract (pure function, no React/DOM)
 * Allowed imports: ./types
 *
 * Kontrak:
 *   Pure function yang memvalidasi MpiDesignContract. Returns array of errors.
 *   Empty array = valid.
 *
 *   Prinsip:
 *     - Pure function, no DOM, no React.
 *     - Tidak throw — returns error array (caller decides what to do).
 *     - Validasi struktur, bukan nilai estetika.
 */

import type { MpiDesignContract, DesignContractId } from './types';

export type DesignContractValidationError = {
  path: string;
  message: string;
};

export function validateDesignContract(contract: unknown): DesignContractValidationError[] {
  const errors: DesignContractValidationError[] = [];

  if (!contract || typeof contract !== 'object') {
    errors.push({ path: 'root', message: 'contract must be object' });
    return errors;
  }

  const c = contract as Partial<MpiDesignContract>;

  // Required top-level fields
  if (typeof c.id !== 'string') errors.push({ path: 'id', message: 'id must be string' });
  if (typeof c.name !== 'string') errors.push({ path: 'name', message: 'name must be string' });

  // Frame
  if (!c.frame || typeof c.frame !== 'object') {
    errors.push({ path: 'frame', message: 'frame must be object' });
  } else {
    const f = c.frame;
    if (typeof f.width !== 'number') errors.push({ path: 'frame.width', message: 'must be number' });
    if (typeof f.height !== 'number') errors.push({ path: 'frame.height', message: 'must be number' });
    if (typeof f.aspectRatio !== 'string') errors.push({ path: 'frame.aspectRatio', message: 'must be string' });
  }

  // Palette
  if (!c.palette || typeof c.palette !== 'object') {
    errors.push({ path: 'palette', message: 'palette must be object' });
  } else {
    const requiredColors = ['primary', 'secondary', 'accent', 'background', 'surface', 'text', 'mutedText', 'border', 'success', 'warning', 'danger', 'gold'];
    for (const key of requiredColors) {
      if (typeof (c.palette as Record<string, unknown>)[key] !== 'string') {
        errors.push({ path: `palette.${key}`, message: 'must be string (hex color)' });
      }
    }
  }

  // Background
  if (!c.background || typeof c.background !== 'object') {
    errors.push({ path: 'background', message: 'background must be object' });
  } else {
    if (typeof c.background.pattern !== 'string') errors.push({ path: 'background.pattern', message: 'must be string' });
  }

  // Typography
  if (!c.typography || typeof c.typography !== 'object') {
    errors.push({ path: 'typography', message: 'typography must be object' });
  } else {
    if (typeof c.typography.heroFont !== 'string') errors.push({ path: 'typography.heroFont', message: 'must be string' });
    if (typeof c.typography.bodyFont !== 'string') errors.push({ path: 'typography.bodyFont', message: 'must be string' });
    if (typeof c.typography.titleSize !== 'number') errors.push({ path: 'typography.titleSize', message: 'must be number' });
  }

  // Card
  if (!c.card || typeof c.card !== 'object') {
    errors.push({ path: 'card', message: 'card must be object' });
  } else {
    if (typeof c.card.radius !== 'number') errors.push({ path: 'card.radius', message: 'must be number' });
    if (typeof c.card.padding !== 'number') errors.push({ path: 'card.padding', message: 'must be number' });
  }

  // Button (must have all 5 variants)
  if (!c.button || typeof c.button !== 'object') {
    errors.push({ path: 'button', message: 'button must be object' });
  } else {
    const requiredVariants = ['primary', 'secondary', 'ghost', 'mission', 'gold'];
    for (const variant of requiredVariants) {
      if (!(c.button as Record<string, unknown>)[variant]) {
        errors.push({ path: `button.${variant}`, message: `variant ${variant} must exist` });
      }
    }
  }

  // Feedback (must have all 4 variants)
  if (!c.feedback || typeof c.feedback !== 'object') {
    errors.push({ path: 'feedback', message: 'feedback must be object' });
  } else {
    const requiredVariants = ['correct', 'wrong', 'neutral', 'warning'];
    for (const variant of requiredVariants) {
      if (!(c.feedback as Record<string, unknown>)[variant]) {
        errors.push({ path: `feedback.${variant}`, message: `variant ${variant} must exist` });
      }
    }
  }

  // Motion (must have all 6 presets)
  if (!c.motion || typeof c.motion !== 'object') {
    errors.push({ path: 'motion', message: 'motion must be object' });
  } else {
    const requiredPresets = ['none', 'soft-fade', 'slide-up', 'pulse', 'reward-pop', 'correct-burst'];
    for (const preset of requiredPresets) {
      if (!(c.motion as Record<string, unknown>)[preset]) {
        errors.push({ path: `motion.${preset}`, message: `preset ${preset} must exist` });
      }
    }
  }

  return errors;
}

export function isValidDesignContract(contract: unknown): boolean {
  return validateDesignContract(contract).length === 0;
}

export function assertValidDesignContract(contract: unknown, id?: DesignContractId): void {
  const errors = validateDesignContract(contract);
  if (errors.length > 0) {
    const msg = errors.map((e) => `${e.path}: ${e.message}`).join('; ');
    throw new Error(`Invalid design contract${id ? ` "${id}"` : ''}: ${msg}`);
  }
}
