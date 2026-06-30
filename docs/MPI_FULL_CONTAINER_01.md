# MPI Full Container 01

## Status
**DONE**

## Masalah
SimpleProject menyimpan data sebagai flat `components[]` dengan geometry. Tidak ada konsep "scene" dengan slots. AI tidak bisa menyusun scene secara terstruktur.

## Tujuan
Menyiapkan container internal (MpiContainer) untuk satu MPI utuh. Container menyimpan: metadata, curriculum, styleIntent, designSystem, flow, scenes, assets, runtime, exportConfig. Container berdampingan dengan SimpleProject (tidak dihapus).

## Yang Dibuat

### Files
| File | Deskripsi |
|------|-----------|
| `src/core/mpi-container/types.ts` | Type definitions: MpiContainer, MpiScene, MpiSceneSlot, dll |
| `src/core/mpi-container/createMpiContainer.ts` | Factory functions: createMpiContainer, createMpiScene, createMpiSlot, createMpiFlow |
| `src/core/mpi-container/simpleProjectToMpiContainer.ts` | Adapter SimpleProject → MpiContainer (one-way, lossy untuk field belum ada) |
| `src/core/mpi-container/index.ts` | Public API |
| `src/tests/mpi-full-container-01.test.ts` | 24 test guard |
| `docs/MPI_FULL_CONTAINER_01.md` | Report ini |

### MpiContainer Structure
```
MpiContainer
├── schemaVersion: 1
├── sourceKind: 'manual' | 'ai-json' | 'template'
├── metadata: { title, subtitle?, author?, createdAt?, updatedAt? }
├── curriculum?: { subject, grade, phase, topic, cp?, objectives[] }
├── styleIntent?: { styleId, mood?, intent? }
├── designSystem?: { contractId, overrides?, paletteName?, typographyName? }
├── flow: { steps: [{ sceneId, label? }], mode? }
├── scenes: MpiScene[]
├── assets: MpiAsset[]
├── runtime: { currentSceneId?, score?, completedSceneIds?, showProgress?, showScore? }
└── exportConfig: { format, embedAssets?, includeToolbar?, stageWidth?, stageHeight? }
```

### MpiScene Structure
```
MpiScene
├── id
├── pageId? (reference ke SimplePage, untuk adapter)
├── role: cover | guide | objectives | starter | material | mission-map | game | quiz | reflection | closing
├── sceneType: cover-hero | guide-panel | objectives-path | starter-question | learning-scene | mission-map | game-mission | quiz-challenge | reflection-journal | closing-award
├── title
├── slots: MpiSceneSlot[]
└── navigation?: { nextSceneId?, prevSceneId?, customButtons? }
```

### MpiSceneSlot Structure
```
MpiSceneSlot
├── id
├── role (e.g. "briefing", "target", "action-grid", "feedback", "reward")
├── placement: { x, y, width, height, zIndex?, anchor?, grid? }
├── designTokenKey? (reference ke design contract, Scope 3)
└── content: MpiSceneSlotContent (union of 10 kinds)
    ├── text
    ├── card
    ├── image
    ├── button
    ├── badge
    ├── game-mission (briefing + target + actions + reward)
    ├── quiz-question
    ├── feedback
    ├── reward
    └── navigation
```

## Yang TIDAK Dikerjakan
- Tidak menghapus SimpleProject (container berdampingan)
- Tidak rewrite store besar
- Tidak ubah renderer (CanvasStage/PreviewApp/export-html tetap)
- Tidak buat tampilan baru (container = data only)
- Tidak style polish
- Tidak dependency baru

## Verification
| Check | Result |
|-------|--------|
| typecheck | ✅ PASS |
| test | ✅ PASS — 2487/2487 (2451 existing + 24 new + 12 esm-runtime) |
| build | ✅ PASS (481KB JS, 69KB CSS) |

## Tests (24)
1-10: Container factories (createMpiContainer, createMpiScene, createMpiSlot, createMpiFlow, all roles, all sceneTypes, content union kinds, runtime, exportConfig)
11-24: Adapter SimpleProject → MpiContainer (valid container, title preserved, curriculum preserved, page count, styleIntent, flow, role mapping, activity→game, components→slots, game sceneMetadata preserved, no mutation, designSystem default, runtime currentSceneId, pageId reference)
