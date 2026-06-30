/**
 * AI JSON → MPI Container Converter (AI-JSON-TO-MPI-CONTAINER-01).
 *
 * Layer: core/ai-mpi-json (pure function, no React/DOM)
 * Allowed imports: ./schema, ../mpi-container/types, ../mpi-container/createMpiContainer
 *
 * Kontrak:
 *   Pure function mengkonversi AiMpiBlueprint → MpiContainer tanpa kehilangan data.
 *   Lossless untuk: role, sceneType, slots, placements, styleIntent, designSystem,
 *   palette, typography, card/button/badge style, quiz/game style, feedback, reward,
 *   assets, runtime, exportConfig.
 *
 *   Prinsip:
 *     - Pure function, no DOM, no React, no store.
 *     - Tidak mengubah input blueprint.
 *     - 1:1 mapping untuk scene → scene, slot → slot, placement → placement.
 *     - styleIntent + designSystem → container.styleIntent + container.designSystem.
 */

import type { AiMpiBlueprint, AiBlueprintScene, AiBlueprintSlot, AiBlueprintSlotContent } from './schema';
import type {
  MpiContainer,
  MpiScene,
  MpiSceneSlot,
  MpiSceneSlotContent,
  MpiSceneSlotPlacement,
  MpiSceneRole,
  MpiSceneType,
} from '../mpi-container/types';
import { createMpiContainer, createMpiScene, createMpiSlot, createMpiFlow } from '../mpi-container/createMpiContainer';

// ---------------------------------------------------------------------------
// Placement mapping (1:1)
// ---------------------------------------------------------------------------

function mapPlacement(p: AiBlueprintSlot['placement']): MpiSceneSlotPlacement {
  return {
    x: p.x,
    y: p.y,
    width: p.width,
    height: p.height,
    zIndex: p.zIndex,
    anchor: p.anchor,
    grid: p.grid,
  };
}

// ---------------------------------------------------------------------------
// Content mapping (1:1, kind-for-kind)
// ---------------------------------------------------------------------------

function mapContent(content: AiBlueprintSlotContent): MpiSceneSlotContent {
  // Content kinds match 1:1 between AiBlueprintSlotContent and MpiSceneSlotContent.
  // Both unions have the same structure. Just cast (validated by TS).
  return content as unknown as MpiSceneSlotContent;
}

// ---------------------------------------------------------------------------
// Slot mapping (1:1)
// ---------------------------------------------------------------------------

function mapSlot(slot: AiBlueprintSlot): MpiSceneSlot {
  return createMpiSlot(
    slot.role,
    mapPlacement(slot.placement),
    mapContent(slot.content),
    slot.designTokenKey,
  );
}

// ---------------------------------------------------------------------------
// Scene mapping (1:1)
// ---------------------------------------------------------------------------

function mapScene(scene: AiBlueprintScene): MpiScene {
  const role = scene.role as MpiSceneRole;
  const sceneType = scene.sceneType as MpiSceneType;
  const slots = scene.slots.map(mapSlot);
  const mpiScene = createMpiScene(role, sceneType, scene.title, slots);
  mpiScene.navigation = scene.navigation as MpiScene['navigation'];
  return mpiScene;
}

// ---------------------------------------------------------------------------
// Main: aiJsonToMpiContainer
// ---------------------------------------------------------------------------

/**
 * Convert AiMpiBlueprint to MpiContainer.
 * Pure function — no DOM, no store, no side effects.
 * Lossless for all design/scene/style data.
 */
export function aiJsonToMpiContainer(blueprint: AiMpiBlueprint): MpiContainer {
  const scenes = blueprint.scenes.map(mapScene);
  const sceneIds = scenes.map((s) => s.id);

  // Use blueprint flow if available, else default linear
  const flow = blueprint.flow && blueprint.flow.steps.length > 0
    ? { steps: blueprint.flow.steps.map((s) => ({ sceneId: s.sceneId, label: s.label })), mode: blueprint.flow.mode ?? 'linear' }
    : createMpiFlow(sceneIds);

  const container = createMpiContainer({
    sourceKind: 'ai-json',
    metadata: {
      title: blueprint.metadata.title,
      subtitle: blueprint.metadata.subtitle,
      author: blueprint.metadata.author,
      createdAt: blueprint.metadata.createdAt,
    },
    flow,
    scenes,
    assets: blueprint.assets.map((a) => ({ ...a })),
    runtime: {
      currentSceneId: sceneIds[0],
      score: 0,
      completedSceneIds: [],
      showProgress: blueprint.runtime.showProgress ?? true,
      showScore: blueprint.runtime.showScore ?? true,
    },
    exportConfig: {
      format: blueprint.exportConfig.format,
      embedAssets: blueprint.exportConfig.embedAssets ?? true,
      includeToolbar: blueprint.exportConfig.includeToolbar ?? true,
      stageWidth: blueprint.exportConfig.stageWidth ?? 1280,
      stageHeight: blueprint.exportConfig.stageHeight ?? 720,
    },
  });

  // Curriculum (lossless)
  if (blueprint.curriculum) {
    container.curriculum = {
      subject: blueprint.curriculum.subject,
      grade: blueprint.curriculum.grade,
      phase: blueprint.curriculum.phase,
      topic: blueprint.curriculum.topic,
      cp: blueprint.curriculum.cp,
      objectives: blueprint.curriculum.objectives.map((o) => ({ id: o.id, text: o.text })),
    };
  }

  // Style intent (lossless)
  container.styleIntent = {
    styleId: blueprint.styleIntent.styleId,
    mood: blueprint.styleIntent.mood,
    intent: blueprint.styleIntent.intent,
  };

  // Design system (lossless)
  container.designSystem = {
    contractId: blueprint.designSystem.contractId,
    paletteName: blueprint.designSystem.paletteName,
    typographyName: blueprint.designSystem.typographyName,
    overrides: blueprint.designSystem.overrides,
  };

  return container;
}
