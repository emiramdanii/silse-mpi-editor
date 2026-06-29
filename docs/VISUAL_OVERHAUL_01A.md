# Visual Overhaul 01A

Commit: `VISUAL-OVERHAUL-01A`
Tanggal: 2026-06-29
Verifier: AI Dev (CSS audit + agent-browser screenshot + 35 test guard)

## Alasan Reopen RC

RELEASE-CANDIDATE-VISUAL-01 hijau secara test, tetapi secara visual masih belum premium. Setelah dibandingkan dengan referensi (Canva Education, Nearpod, Articulate Rise), masalah utama: cover polos, canvas seperti slide kosong, card datar.

## Masalah Visual

| Area | Masalah | Dampak |
|---|---|---|
| Cover | Gradient terlalu halus (opacity 0.06), tidak ada decorative shape | Cover terasa polos, tidak "wow" |
| Canvas frame | Shadow tipis (var(--shadow-md)), no depth | Canvas terlihat seperti kotak biasa |
| Card | Shadow sangat tipis (0.04 opacity), border tipis | Card terlalu datar, tidak premium |

## Patch

| Area | Perubahan | Alasan |
|---|---|---|
| Cover CSS (styles.css + export) | Gradient opacity 0.06→0.12-0.35, tambah ::after decorative shape (radial blob), title font-weight 700 + letter-spacing -0.8px, subtitle uppercase + letter-spacing | Cover lebih hero, lebih "wow" |
| Canvas frame (styles.css) | Shadow dari var(--shadow-md) → 0 8px 40px + 0 2px 8px, border-radius + overflow:hidden | Canvas terasa seperti presentasi/proyektor |
| Card skin (styles.css + export) | Shadow dari 0 1px 3px → 0 2px 8px + 0 1px 2px (flat), 0 4px 16px + 0 1px 4px (soft), 0 6px 20px + 0 2px 8px (bold), border-radius 8→10/18 | Card punya kedalaman, lebih premium |

## Before/After Review

| Area | Sebelum | Sesudah | Catatan |
|---|---|---|---|
| Cover gradient | Opacity 0.06, linear 180deg | Opacity 0.12-0.35, linear 160deg + radial blob | Jauh lebih kuat |
| Cover title | font-weight normal, letter-spacing -0.5px | font-weight 700, letter-spacing -0.8px, text-shadow lebih kuat | Lebih dominan |
| Cover subtitle | opacity 0.85 | opacity 0.65-0.75, uppercase, letter-spacing 1-2px | Lebih rapi, profesional |
| Canvas shadow | var(--shadow-md) = 0 4px 16px | 0 8px 40px + 0 2px 8px | Jauh lebih dalam, terasa proyektor |
| Card flat shadow | 0 1px 3px rgba(0,0,0,0.04) | 0 2px 8px + 0 1px 2px | Lebih depth |
| Card soft shadow | 0 2px 8px rgba(0,0,0,0.06) | 0 4px 16px + 0 1px 4px | Lebih lembut tapi dalam |
| Card bold shadow | 0 4px 12px rgba(0,0,0,0.4) | 0 6px 20px + 0 2px 8px glow | Lebih dramatis |

## Cover Proof (Screenshots)

Screenshots diambil via agent-browser, disimpan di `download/visual-proof/`:
- `03-cover-modern-clean.png` — Cover Rapi & Profesional
- `04-cover-soft-classroom.png` — Cover Hangat & Ramah
- `05-cover-mission-dark.png` — Cover Misi Interaktif

## Canvas Frame Proof

- `01-default-editor.png` — Editor dengan canvas frame depth
- `06-material-mission-dark.png` — Material page dengan canvas frame

## Card Depth Proof

- `06-material-mission-dark.png` — Card di halaman materi
- `07-quiz-mission-dark.png` — Quiz panel
- `08-game-mission-dark.png` — Game panel

## Safety Proof

- content unchanged: ✓
- objectives unchanged: ✓
- quiz answer unchanged: ✓
- feedback unchanged: ✓
- game logic unchanged: ✓
- layout geometry unchanged: ✓
- schema unchanged: ✓

## Export Proof

- standalone: ✓
- embedded CSS: ✓ (cover + card + all visual layers)
- no external asset: ✓
- no dependency: ✓

## Tests

- visual-overhaul-01a: 35/35 PASS
- full suite: 2362/2362 PASS

## Verification

- typecheck: PASS
- test: 2362/2362 PASS
- build: PASS (CSS 61.38→62.31kB, JS 441.21→442.19kB)

## Known Limitations

1. Belum editor UI full warming (panel kiri/kanan masih abu-abu).
2. Belum typography global overhaul.
3. Belum Canva background.
4. Belum real teacher test.
5. Screenshot proof via agent-browser — bukan Playwright profesional, tapi cukup untuk visual verification.
