# Learning Experience Contract (LXC-01)

> SILSE bukan pembuat slide. SILSE adalah pembuat pengalaman belajar interaktif.

## Status

**CONTRACT ONLY** — batch ini mendefinisikan kontrak 10 komponen resmi baru.
Tidak ada implementasi runtime. Implementasi datang di batch berikutnya
setelah kontrak ini di-ACCEPT.

## Prinsip Utama

1. **Guru memilih pola belajar, bukan menyusun kotak manual.**
   Guru tidak drag-and-drop kotak teks/gambar satu per satu. Guru memilih
   pola belajar (pemantik, materi berlapis, kuis interaktif, refleksi
   terstruktur) dan SILSE menerapkannya dengan komponen resmi.

2. **Satu komponen boleh punya banyak variasi tampilan.**
   Contoh: "Kuis Interaktif" punya 3 variasi (single, multi, trueFalse).
   Guru tidak perlu komponen berbeda untuk tiap gaya kuis.

3. **Editor tidak boleh menampilkan semua isi panjang sekaligus.**
   Komponen seperti Info Berlapis atau Kuis Multi Soal harus punya UI
   editor yang sectioned/collapsible. Jangan sodori guru dengan semua
   field sekaligus.

4. **Preview = Export.**
   Satu renderer untuk preview dan export HTML. Tidak boleh ada dua
   renderer berbeda. `previewEqualsExport: true` untuk SEMUA komponen.

5. **Runtime HUD dan efek apresiasi masuk kontrak, bukan ditempel manual.**
   Progress bar, score badge, badge tray, dan confetti adalah komponen
   runtime yang auto-managed. Guru TIDAK bisa drag-and-drop ke halaman.
   Mereka muncul otomatis berdasarkan project setting + trigger runtime.

## 10 Komponen Resmi Baru

### 1. Info Berlapis (`layered-info`)

| Field | Nilai |
|---|---|
| **Tujuan pembelajaran** | Sajikan materi dalam lapisan progressive disclosure — siswa buka layer demi layer supaya tidak kewalahan dengan info sekaligus. |
| **Applicable roles** | `material`, `guide`, `menu`, `learningObjectives` |
| **Variants** | `accordion`, `tabs`, `iconTabs`, `stepper`, `cardGrid`, `timeline` |
| **Has runtime state** | Ya (layer yang terbuka) |
| **Contributes to score** | Tidak |
| **Contributes to progress** | Tidak |
| **Triggers appreciation** | Tidak |
| **Max per page** | 3 |

**Variants:**
- `accordion` — layer bisa dilipat/dibuka satu per satu
- `tabs` — layer sebagai tab horizontal
- `iconTabs` — tab dengan ikon di tiap label (cocok untuk kategori visual)
- `stepper` — layer sebagai langkah berurutan dengan nomor
- `cardGrid` — layer sebagai kartu-kartu dalam grid (siswa klik untuk detail)
- `timeline` — layer sebagai titik-titik di linimasa (cocok untuk urutan kronologis)

**Applicable roles note:**
- `learningObjectives` ditambahkan di LXC-01 Patch-1 — tujuan pembelajaran
  bisa disajikan berlapis (sebelumnya/hari ini/berikutnya).

**Data model:**
```ts
type LayeredInfoComponent = {
  title: string;
  variant: 'accordion' | 'tabs' | 'iconTabs' | 'stepper' | 'cardGrid' | 'timeline';
  layers: Array<{ id: string; title: string; body: string; icon?: string }>;
  defaultOpenIndex?: number | null;
};
```

**Editor rules:**
- Guru boleh tambah manual.
- Edit hanya via Panel Isi (tidak inline di canvas).
- Section Inspector: Isi, Lapisan, Tampilan, Posisi & Ukuran.
- Bisa di-drag/resize/hapus.

**Batasan:**
- Maks 3 instans per halaman (supaya tidak jadi dump info).
- Tidak boleh di halaman terpandu (cover).

---

### 2. Menu Belajar (`learning-menu`)

| Field | Nilai |
|---|---|
| **Tujuan pembelajaran** | Peta belajar siswa — tunjukkan scene mana yang sudah selesai, sedang aktif, dan terkunci. Siswa boleh lompat ke scene yang sudah dibuka. |
| **Applicable roles** | `menu`, `guide` |
| **Variants** | `grid`, `list`, `path` |
| **Has runtime state** | Ya (visitedPages, unlockedPages) |
| **Contributes to progress** | Ya |
| **Max per page** | 1 |

**Data model:**
```ts
type LearningMenuComponent = {
  title: string;
  variant: 'grid' | 'list' | 'path';
  items: Array<{ pageId: string; label: string; required: boolean }>;
  unlockMode: 'sequential' | 'free';
};
```

**Reserved runtime fields:** `visitedPages`, `unlockedPages` — TIDAK boleh
di-set oleh guru. Diisi oleh runtime berdasarkan progress siswa.

---

### 3. Pemantik Interaktif (`interactive-starter`)

| Field | Nilai |
|---|---|
| **Tujuan pembelajaran** | Aktifkan pengetahuan awal siswa dengan interaksi singkat — pilih posisi, jawab poll, refleksi kasus, atau hadapi dilema sebelum materi. |
| **Applicable roles** | `starter` |
| **Variants** | `poll`, `stance`, `case`, `bigQuestion`, `decisionScenario`, `dilemma` |
| **Contributes to progress** | Ya |
| **Max per page** | 1 |

**Variants:**
- `poll` — siswa pilih satu dari beberapa opsi
- `stance` — siswa posisikan diri setuju/tidak pada pernyataan
- `case` — siswa baca kasus lalu refleksi singkat
- `bigQuestion` — pertanyaan terbuka yang memancing rasa ingin tahu sepanjang pembelajaran
- `decisionScenario` — siswa hadapi skenario dan ambil keputusan dari beberapa pilihan
- `dilemma` — dilema dengan dua sisi sama-sama kuat, siswa pertimbangkan trade-off

**Catatan:** `dialog`/`rolePlay` boleh ditambah di masa depan (future
variant), tetapi kontrak saat ini sudah tidak sempit — mencakup poll, stance,
case, bigQuestion, decisionScenario, dilemma.

**Reserved runtime fields:** `selectedOptionId`, `isAnswered`.

---

### 4. Aktivitas Interaktif (`interactive-activity`)

| Field | Nilai |
|---|---|
| **Tujuan pembelajaran** | Latihan terstruktur di mana siswa mencoba konsep — drag-and-drop, matching, sequencing, atau eksplorasi. |
| **Applicable roles** | `activity` |
| **Variants** | `matching`, `sequencing`, `categorize` |
| **Contributes to score** | Ya |
| **Contributes to progress** | Ya |
| **Triggers appreciation** | Ya |
| **Max per page** | 1 |
| **Requires companion** | `navigation` (wajib ada tombol navigasi keluar) |

**Reserved runtime fields:** `matches`, `isCompleted`, `score`.

---

### 5. Kuis Interaktif (`interactive-quiz`)

| Field | Nilai |
|---|---|
| **Tujuan pembelajaran** | Evaluasi pemahaman dengan satu atau beberapa soal, langsung beri feedback, dan sumbangkan ke skor total. |
| **Applicable roles** | `quiz` |
| **Variants** | `single`, `multi`, `trueFalse` |
| **Contributes to score** | Ya |
| **Contributes to progress** | Ya |
| **Triggers appreciation** | Ya |
| **Max per page** | 1 |
| **Requires companion** | `navigation` |

**Reserved runtime fields:** `answers`, `score`, `completed`.

---

### 6. Refleksi Interaktif (`interactive-reflection`)

| Field | Nilai |
|---|---|
| **Tujuan pembelajaran** | Bantu siswa merangkum dan menginternalisasi pembelajaran melalui struktur refleksi (3-2-1, kalimat rumpang, komitmen). |
| **Applicable roles** | `reflection` |
| **Variants** | `rumpang`, `komitmen`, `3-2-1` |
| **Contributes to progress** | Ya |
| **Max per page** | 1 |

**Reserved runtime fields:** `responses`, `completed`.

---

### 7. Hasil & Apresiasi (`results-appreciation`)

| Field | Nilai |
|---|---|
| **Tujuan pembelajaran** | Tampilkan skor akhir, badge yang diraih, dan rangkuman pembelajaran. Trigger efek apresiasi (confetti) kalau siswa berhasil. |
| **Applicable roles** | `closing` |
| **Variants** | `score`, `badge`, `summary` |
| **Triggers appreciation** | Ya |
| **Max per page** | 1 |

**Reserved runtime fields:** `finalScore`, `earnedBadge`, `isPassing`.

---

### 8. Jembatan Belajar (`learning-bridge`)

| Field | Nilai |
|---|---|
| **Tujuan pembelajaran** | Penghubung antar scene yang menjelaskan transisi — "kamu sudah selesai X, sekarang kita lanjut ke Y karena Z". Mencegah lompatan mendadak. |
| **Applicable roles** | `starter`, `material`, `activity`, `quiz`, `reflection`, `learningObjectives`, `closing` |
| **Variants** | `transition`, `recap`, `preview` |
| **Contributes to progress** | Ya |
| **Max per page** | 1 |

**Applicable roles note (LXC-01 Patch-1):**
- `learningObjectives` ditambahkan — jembatan di halaman tujuan pembelajaran
  bisa pakai variant `recap` (sebelumnya) + `preview` (hari ini/berikutnya).
- `closing` ditambahkan — jembatan di halaman penutup bisa pakai variant
  `preview` untuk memberi preview materi selanjutnya di pertemuan berikut.

---

### 9. Indikator Belajar / Runtime HUD (`learning-indicator`)

| Field | Nilai |
|---|---|
| **Tujuan pembelajaran** | HUD runtime yang menampilkan progress belajar siswa — progress bar, score badge, badge apresiasi yang sudah diraih. TIDAK ditempel manual di halaman; otomatis muncul di seluruh scene. |
| **Applicable roles** | SEMUA role (cover..closing) |
| **Variants** | `progress-bar`, `score-badge`, `badge-tray`, `full-hud` |
| **Has runtime state** | Ya (currentProgress, currentScore, earnedBadges) |
| **Allow manual add** | **TIDAK** — auto-managed dari project setting |
| **Draggable / deletable** | TIDAK |

**Reserved runtime fields:** `currentProgress`, `currentScore`, `earnedBadges`.

**Catatan penting:** Komponen ini TIDAK bisa ditambah manual oleh guru via
toolbar. Ia muncul otomatis berdasarkan project setting (mis. "tampilkan
progress bar di semua scene"). Pengaturan via Panel Isi khusus, bukan
drag-and-drop.

---

### 10. Efek Apresiasi (`appreciation-effect`)

| Field | Nilai |
|---|---|
| **Tujuan pembelajaran** | Efek visual ringan (confetti, burst, shine) yang otomatis muncul saat siswa menyelesaikan milestone. TIDAK ditempel manual — trigger dari komponen lain. |
| **Applicable roles** | SEMUA role (cover..closing) |
| **Variants** | `confetti`, `burst`, `shine` |
| **Triggers appreciation** | Ya (meta — komponen ini sendiri adalah efek) |
| **Allow manual add** | **TIDAK** — auto-trigger dari komponen lain |
| **Draggable / deletable** | TIDAK |

**Reserved runtime fields:** `activeEffect`, `triggerTime`.

**Catatan penting:** Komponen ini TIDAK bisa ditambah manual. Ia
di-trigger otomatis oleh komponen yang punya `triggersAppreciation: true`
(Interactive Activity, Interactive Quiz, Results & Appreciation).

## Aturan Umum

### Komponen Manual vs Auto-Managed

| Tipe | Komponen |
|---|---|
| **Manual** (guru boleh tambah via toolbar) | Info Berlapis, Menu Belajar, Pemantik Interaktif, Aktivitas Interaktif, Kuis Interaktif, Refleksi Interaktif, Hasil & Apresiasi, Jembatan Belajar |
| **Auto-managed** (TIDAK boleh tambah manual) | Indikator Belajar (HUD), Efek Apresiasi |

### Reserved Runtime Fields

Field yang ditandai `reservedRuntimeFields` TIDAK boleh di-set oleh guru
via editor. Field-field ini diisi oleh runtime berdasarkan interaksi siswa.

Editor yang melanggar aturan ini (mis. mencoba set `currentScore` via
Panel Isi) harus ditolak oleh guard.

### Preview = Export

SEMUA 10 komponen punya `previewEqualsExport: true`. Implementasi:
- Satu renderer shared antara preview dan export HTML.
- Tidak boleh ada `if (isPreview)` di renderer.
- Style resolver shared (sudah ada via `resolveComponentStyle`).

### Max Instances Per Page

Komponen dengan `maxInstancesPerPage: 1` hanya boleh ada 1 instans per
halaman. Jika guru mencoba tambah kedua kalinya, editor harus menolak
dengan pesan jelas.

Komponen dengan `maxInstancesPerPage: 3` (Info Berlapis) boleh ada
sampai 3 instans — supaya guru bisa pecah materi jadi beberapa blok
berlapis tanpa overdoing.

### Requires Companion

Komponen dengan `requiresCompanion: ['navigation']` WAJIB disertai
komponen navigasi di halaman yang sama. Quality check harus flag halaman
yang punya komponen aktivitas/kuis tapi tidak punya navigasi (sudah
dicover oleh `checkMpiStandard` rule "bebas jalan bantu").

## Yang TIDAK Termasuk Batch Ini

- Implementasi runtime (factory, view component, store action) — batch berikutnya.
- Penambahan ke `COMPONENT_TYPES` di `types.ts` — saat implementasi.
- AI import untuk komponen baru — setelah implementasi stabil.
- Paket halaman / template paket — setelah implementasi stabil.
- Perubahan export engine — TIDAK. Engine existing tetap.
- Renderer besar baru — TIDAK. Tambah komponen satu per satu.

## Implementasi Bertahap (Setelah ACCEPT)

1. **LXC-02**: Implementasi Info Berlapis (factory + view + capability + tests).
2. **LXC-03**: Implementasi Menu Belajar + Pemantik Interaktif.
3. **LXC-04**: Implementasi Aktivitas Interaktif + Kuis Interaktif.
4. **LXC-05**: Implementasi Refleksi Interaktif + Hasil & Apresiasi.
5. **LXC-06**: Implementasi Jembatan Belajar.
6. **LXC-07**: Implementasi Runtime HUD (Indikator Belajar) + Efek Apresiasi.
7. **LXC-08**: Integrasi ke Content Pattern Library — pola isi pakai komponen baru.
8. **LXC-09**: Quality check update untuk komponen baru.

Setiap batch LXC implementasi harus:
- Tambah komponen ke `COMPONENT_TYPES` di `types.ts`.
- Update `PAGE_ROLE_CAPABILITIES` di `capability.ts`.
- Tambah factory di `component-factory.ts`.
- Tambah view di `components/`.
- Tambah editor di `Inspector.tsx`.
- Update `checkMpiStandard` kalau perlu.
- Update export engine (shared renderer).
- Tambah tests.
