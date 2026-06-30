# MPI JSON Scene Proof 01

## Status
**PROOF OF CONCEPT — DONE**

## Masalah
App masih menyusun game sebagai kotak/list pertanyaan. Game = judul + pertanyaan + list opsi. Bukan scene misi.

## Tujuan
Membuktikan JSON AI bisa dirender menjadi scene misi (bukan kotak/list). Pipeline minimal:
```
sample AI MPI JSON → validate/normalize → convert ke project internal → render game sebagai scene misi
```

## Before
Game lama = pertanyaan + opsi list:
- judul game
- instruksi (teks kecil)
- progress (misi 1/1 · skor)
- prompt pertanyaan
- list opsi (A. B. C. dengan teks)
- feedback setelah dijawab

## After
Game baru = briefing + target + action cards + feedback + reward:
- **Briefing Misi** (kotak kuning dengan narasi pembuka)
- **Target Misi** (kotak biru dengan target yang harus dicapai)
- **Action Cards** (grid kartu aksi, bukan list — setiap kartu punya letter badge + label "Aksi" + teks aksi)
- **Feedback** (hasil aksi dengan border kiri berwarna)
- **Reward** (lencana yang didapat setelah benar)
- **Completed state**: tampilkan reward besar + tombol "Ulangi Misi"

## Yang Tidak Dikerjakan
- belum style premium (style sederhana, fokus struktur scene)
- belum visual memory
- belum art layer / flavor system
- belum HTML import / iframe / reskin
- belum semua page role (hanya game yang diubah; cover/material/quiz/closing tetap pakai renderer lama)
- belum style pack baru
- belum dependency baru

## Pipeline

### 1. Sample JSON Blueprint
File: `samples/ai-mpi-json/penjelajah-pancasila-scene-proof.json`

Struktur:
- metadata (title, subject, grade, phase, topic, cp, objectives)
- styleId ("modern-clean")
- 5 pages: cover, material, game, quiz, closing
- Game page punya scene "game-mission" + game block dengan:
  - briefing
  - missionTarget
  - actions (1 correct + 2 wrong, masing-masing dengan feedback)
  - reward (type: badge, label: "Lencana Penjaga Norma")

### 2. JSON Contract (Schema + Normalize)
Folder: `src/core/ai-mpi-json/`

Files:
- `ai-mpi-json-schema.ts` — Type definitions (AiMpiJson, AiMpiPage, AiMpiBlock, AiMpiGameBlock, dll)
- `normalize-ai-mpi-json.ts` — Pure function validate + normalize. Throws AiMpiJsonError dengan path pada invalid structure.
- `ai-mpi-json-to-project.ts` — Pure function convert AiMpiJson → SimpleProject. Preserve scene intent di GameComponent.sceneMetadata.
- `index.ts` — Public API export.

### 3. Scene Intent Preservation
Converter memetakan:
- `page.role: "game"` → `SimplePage.role: "activity"` (internal role)
- `page.scene: "game-mission"` → `GameComponent.sceneMetadata.scene: "game-mission"`
- `block.briefing` → `GameComponent.sceneMetadata.briefing` + `GameComponent.instruction` (dual storage untuk backward compat)
- `block.missionTarget` → `GameComponent.sceneMetadata.missionTarget` + `mission.prompt`
- `block.actions[i]` → `mission.choices[i]` (label → text)
- `action.result: "correct"` → `mission.correctChoiceIndex` (find index)
- `action.feedback` (correct action) → `mission.feedbackCorrect`
- `action.feedback` (first wrong action) → `mission.feedbackWrong`
- `block.reward` → `GameComponent.sceneMetadata.reward` (type + label)
- `metadata` → `project.curriculum`
- `styleId` → `project.stylePackId`

Field `sceneMetadata` adalah field optional baru di GameComponent. Tidak mengubah schema existing (field wajib tetap). Tidak break 2416 test existing.

### 4. Game Scene Renderer
GameComponentView sekarang punya 2 mode:
- **Mode lama** (default): render sebagai list pertanyaan (untuk game tanpa sceneMetadata)
- **Mode scene misi** (jika `sceneMetadata.scene === "game-mission"`): render sebagai briefing + target + action cards + feedback + reward

Export HTML juga punya 2 mode yang sama (function `renderGameMissionScene` di export JS).

Scene classes yang dihasilkan:
- `silse-game-scene` (container)
- `silse-game-briefing` (kotak briefing)
- `silse-game-target` (kotak target)
- `silse-game-action-grid` (grid action cards)
- `silse-game-action-card` (individual action card)
- `silse-game-feedback` (feedback setelah dijawab)
- `silse-game-reward` (reward/lencana)

## Verification

| Check | Result |
|-------|--------|
| typecheck | ✅ PASS |
| test | ✅ PASS — **2451/2451** (2416 existing + 35 new, zero regressions) |
| build | ✅ PASS (481KB JS, 69KB CSS) |

## Tests

Test file: `src/tests/mpi-json-scene-proof-01.test.tsx`
Jumlah tests: **35** (requirement: minimal 26)

### Test categories:
1. **JSON valid + structure** (tests 1-8): sample JSON valid, punya game page, scene game-mission, briefing, missionTarget, actions, feedback, reward
2. **Converter preserve scene intent** (tests 9-15): role, scene, briefing, missionTarget, actions, feedback, reward di-preserve di SimpleProject
3. **Renderer scene classes** (tests 16-22): silse-game-scene, silse-game-briefing, silse-game-target, silse-game-action-grid, silse-game-action-card, silse-game-feedback, silse-game-reward
4. **Safety + build** (tests 23-26): game tidak dirender sebagai plain list, jawaban/feedback unchanged, no dependency, build pass
5. **Additional** (tests 27-35): isGameMissionScene pure function, constant, styleId preserved, curriculum preserved, objectives preserved, page count/order preserved, normalize error handling, letter badge, completed state reward

## Files Changed

| File | Status | Description |
|------|--------|-------------|
| `samples/ai-mpi-json/penjelajah-pancasila-scene-proof.json` | baru | Sample AI MPI JSON blueprint |
| `src/core/ai-mpi-json/ai-mpi-json-schema.ts` | baru | Type definitions |
| `src/core/ai-mpi-json/normalize-ai-mpi-json.ts` | baru | Pure validate + normalize function |
| `src/core/ai-mpi-json/ai-mpi-json-to-project.ts` | baru | Pure converter AiMpiJson → SimpleProject |
| `src/core/ai-mpi-json/index.ts` | baru | Public API export |
| `src/core/types.ts` | modified | Tambah `GameSceneMetadata` type + `sceneMetadata?` field optional di GameComponent |
| `src/components/GameComponentView.tsx` | modified | Tambah GameMissionSceneView renderer untuk scene misi |
| `src/export/export-html.ts` | modified | Tambah `renderGameMissionScene` function di export JS + `sceneMetadata` di ExportRenderComponent |
| `src/tests/mpi-json-scene-proof-01.test.tsx` | baru | 35 test guard |

## Definition of Done

| # | Criteria | Status |
|---|----------|--------|
| 1 | Sample JSON ada | ✅ `samples/ai-mpi-json/penjelajah-pancasila-scene-proof.json` |
| 2 | JSON punya game-mission | ✅ `page.scene: "game-mission"` + game block dengan briefing/target/actions/reward |
| 3 | Converter menjaga scene intent | ✅ sceneMetadata di GameComponent (tests 9-15) |
| 4 | Game renderer tidak lagi list pertanyaan | ✅ scene misi mode (test 23: tidak ada `.silse-game-choice` di scene mode) |
| 5 | Game tampil sebagai briefing + target + action cards + feedback + reward | ✅ tests 16-22 |
| 6 | Tidak ada visual engine baru | ✅ hanya structural CSS classes |
| 7 | Tidak ada style pack baru | ✅ |
| 8 | Tidak ada HTML import | ✅ |
| 9 | Tidak ada dependency baru | ✅ test 25 |
| 10 | typecheck PASS | ✅ |
| 11 | test PASS | ✅ 2451/2451 |
| 12 | build PASS | ✅ |

## Urutan Setelah Ini

Jika batch ini berhasil (DONE):
1. ✅ **Game scene proof** (batch ini)
2. ⬜ Quiz scene proof
3. ⬜ Material scene proof
4. ⬜ Cover scene proof
5. ⬜ Closing scene proof
6. ⬜ Baru style premium

Fondasi sudah benar: cara app menyusun MPI dari JSON. Scene intent di-preserve dari AI blueprint sampai renderer. Game sekarang scene misi, bukan list pertanyaan.
