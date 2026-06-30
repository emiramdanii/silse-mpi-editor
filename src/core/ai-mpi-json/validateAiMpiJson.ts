/**
 * Validate AI MPI Blueprint (AI-MPI-JSON-BLUEPRINT-01).
 *
 * Layer: core/ai-mpi-json (pure function, no React/DOM)
 * Allowed imports: ./schema
 *
 * Kontrak:
 *   Pure validator untuk AiMpiBlueprint. Menolak JSON datar (hanya title/content).
 *   Returns error array. Empty = valid.
 */

export type BlueprintValidationError = {
  path: string;
  message: string;
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function isString(v: unknown): v is string {
  return typeof v === 'string';
}

export function validateAiMpiJson(input: unknown): BlueprintValidationError[] {
  const errors: BlueprintValidationError[] = [];

  if (!isObject(input)) {
    errors.push({ path: 'root', message: 'must be object' });
    return errors;
  }

  if (typeof input.version !== 'number') errors.push({ path: 'version', message: 'must be number' });
  if (!isObject(input.metadata)) errors.push({ path: 'metadata', message: 'must be object' });
  else if (!isString(input.metadata.title)) errors.push({ path: 'metadata.title', message: 'must be string' });

  // styleIntent wajib (bukan flat)
  if (!isObject(input.styleIntent)) {
    errors.push({ path: 'styleIntent', message: 'must be object (bukan flat)' });
  } else if (!isString(input.styleIntent.styleId)) {
    errors.push({ path: 'styleIntent.styleId', message: 'must be string' });
  }

  // designSystem wajib (bukan flat)
  if (!isObject(input.designSystem)) {
    errors.push({ path: 'designSystem', message: 'must be object (bukan flat)' });
  } else if (!isString(input.designSystem.contractId)) {
    errors.push({ path: 'designSystem.contractId', message: 'must be string' });
  }

  // flow wajib
  if (!isObject(input.flow) || !Array.isArray(input.flow.steps)) {
    errors.push({ path: 'flow', message: 'must have steps array' });
  }

  // scenes wajib (array, minimal 1)
  if (!Array.isArray(input.scenes) || input.scenes.length === 0) {
    errors.push({ path: 'scenes', message: 'must be non-empty array' });
  } else {
    input.scenes.forEach((scene: unknown, i: number) => {
      const sErrors = validateScene(scene, `scenes[${i}]`);
      errors.push(...sErrors);
    });
  }

  // assets wajib (array, boleh kosong)
  if (!Array.isArray(input.assets)) {
    errors.push({ path: 'assets', message: 'must be array' });
  }

  // runtime wajib (object)
  if (!isObject(input.runtime)) {
    errors.push({ path: 'runtime', message: 'must be object' });
  }

  // exportConfig wajib (object)
  if (!isObject(input.exportConfig)) {
    errors.push({ path: 'exportConfig', message: 'must be object' });
  }

  return errors;
}

function validateScene(scene: unknown, path: string): BlueprintValidationError[] {
  const errors: BlueprintValidationError[] = [];
  if (!isObject(scene)) {
    errors.push({ path, message: 'must be object' });
    return errors;
  }
  if (!isString(scene.id)) errors.push({ path: `${path}.id`, message: 'must be string' });
  if (!isString(scene.role)) errors.push({ path: `${path}.role`, message: 'must be string' });
  if (!isString(scene.sceneType)) errors.push({ path: `${path}.sceneType`, message: 'must be string' });
  if (!isString(scene.title)) errors.push({ path: `${path}.title`, message: 'must be string' });

  // slots wajib (array, minimal 1 — bukan flat content)
  if (!Array.isArray(scene.slots) || scene.slots.length === 0) {
    errors.push({ path: `${path}.slots`, message: 'must be non-empty array (bukan flat content)' });
  } else {
    scene.slots.forEach((slot: unknown, i: number) => {
      const sErrors = validateSlot(slot, `${path}.slots[${i}]`);
      errors.push(...sErrors);
    });
  }

  return errors;
}

function validateSlot(slot: unknown, path: string): BlueprintValidationError[] {
  const errors: BlueprintValidationError[] = [];
  if (!isObject(slot)) {
    errors.push({ path, message: 'must be object' });
    return errors;
  }
  if (!isString(slot.id)) errors.push({ path: `${path}.id`, message: 'must be string' });
  if (!isString(slot.role)) errors.push({ path: `${path}.role`, message: 'must be string' });

  // placement wajib (x, y, width, height)
  if (!isObject(slot.placement)) {
    errors.push({ path: `${path}.placement`, message: 'must be object' });
  } else {
    if (typeof slot.placement.x !== 'number') errors.push({ path: `${path}.placement.x`, message: 'must be number' });
    if (typeof slot.placement.y !== 'number') errors.push({ path: `${path}.placement.y`, message: 'must be number' });
    if (typeof slot.placement.width !== 'number') errors.push({ path: `${path}.placement.width`, message: 'must be number' });
    if (typeof slot.placement.height !== 'number') errors.push({ path: `${path}.placement.height`, message: 'must be number' });
  }

  // content wajib dengan kind
  if (!isObject(slot.content) || !isString(slot.content.kind)) {
    errors.push({ path: `${path}.content`, message: 'must have kind string' });
  }

  return errors;
}

export function isValidAiMpiJson(input: unknown): boolean {
  return validateAiMpiJson(input).length === 0;
}
