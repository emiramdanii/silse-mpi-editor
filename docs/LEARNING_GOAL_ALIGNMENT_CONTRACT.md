# Learning Goal Alignment Contract

> SILSE adalah media pembelajaran, bukan generator kuis/game. Setiap halaman, aktivitas, kuis, game, dan refleksi harus terhubung ke tujuan pembelajaran.

## Tujuan

Learning Goal Alignment Contract (LGA-01) memastikan bahwa setiap MPI yang dibuat dengan SILSE benar-benar mencapai tujuan pembelajaran yang ditetapkan di kurikulum, bukan hanya terlihat rapi secara layout.

## Batas V1

V1 adalah **contract + checker pure function**. Tidak menambah field ke schema project. Tidak mengubah export engine. Tidak membuat komponen baru.

Yang V1 lakukan:
- `checkLearningGoalAlignment(project)` — pure function yang menganalisis project dan mengembalikan alignment report.
- Heuristik text-match untuk mendeteksi apakah konten komponen terhubung ke objective.

Yang V1 **Patch-1** lakukan (hardening contract + checker + test guard, UI tetap di V2):
- Eksplisit dokumen field teks per tipe komponen (image.alt diekstrak; navigation.label TIDAK diekstrak).
- Tambah check `OBJECTIVE_TOO_SHORT` (warning) untuk objective yang tidak bisa diuji text-match.
- Test guard hardening: image.alt, navigation tidak dihitung, layered-info multi-layer, learning-bridge, OBJECTIVE_TOO_SHORT, score 100, determinism, pure function.

Yang V1 **tidak** lakukan:
- Tidak menambah field `objectiveRefs` ke component schema (itu V2).
- Tidak mengubah UI editor (integrasi di batch berikutnya).
- Tidak memblokir export.
- Tidak menggunakan AI/NLP untuk analisis konten.

## Contract

### Types

```typescript
type AlignmentIssue = {
  severity: 'warning' | 'error';
  code: string;
  message: string;
  pageId?: string;
  componentId?: string;
  objectiveId?: string;
};

type PageAlignment = {
  pageId: string;
  pageRole: string;
  pageTitle: string;
  addressedObjectiveIds: string[];
  hasAssessment: boolean;
  assessmentComponents: Array<{ componentId: string; componentType: string; linkedObjectiveIds: string[] }>;
  issues: AlignmentIssue[];
};

type ProjectAlignment = {
  ok: boolean;
  score: number; // 0-100
  totalObjectives: number;
  coveredObjectives: number;
  uncoveredObjectiveIds: string[];
  pages: PageAlignment[];
  issues: AlignmentIssue[];
};
```

### Check Rules

| Check | Severity | Code | Kondisi |
|---|---|---|---|
| No objectives | error | `NO_OBJECTIVES` | curriculum.objectives kosong |
| Objective not covered | error | `OBJECTIVE_NOT_COVERED` | objective tidak di-address halaman manapun |
| Assessment not linked | warning | `ASSESSMENT_NOT_LINKED` | question/game tidak terhubung ke objective |
| Material not linked | warning | `MATERIAL_NOT_LINKED` | halaman materi tidak terhubung ke objective |
| Reflection not linked | warning | `REFLECTION_NOT_LINKED` | halaman refleksi tidak merujuk ke objective |

### Score Calculation

- Coverage score (0-70): `(coveredObjectives / totalObjectives) * 70`
- Issue score (0-30): `max(0, 30 - errors*10 - warnings*3)`
- Total: `coverageScore + issueScore` (0-100)

### Heuristik V1

V1 menggunakan text-match sederhana: untuk setiap komponen, kumpulkan semua teks yang relevan secara pembelajaran. Lalu untuk setiap objective, cek apakah minimal 2 kata signifikan (panjang > 3) dari objective muncul di teks komponen.

**Teks yang DIIKUTSERTAKAN per tipe komponen (Patch-1):**

| Tipe | Field yang diekstrak | Catatan |
|---|---|---|
| text | `text` | Seluruh body teks |
| image | `alt` | Caption/deskripsi gambar (bukan `src`) |
| card | `title`, `body` | Judul + isi kartu |
| question | `title`, `prompt` | Soal cek pemahaman |
| game | `title`, `instruction`, `missions[].prompt` | Instruksi + prompt misi |
| layered-info | `title`, `layers[].title`, `layers[].body` | Semua lapisan |
| learning-bridge | `title`, `message` | Pesan jembatan |
| navigation | — (tidak diekstrak) | Label tombol BUKAN konten pembelajaran |

**Aturan penting:** label tombol navigasi (mis. "Lanjut", "Kembali") tidak dianggap konten pembelajaran. Hanya konten yang membawa makna pembelajaran yang diekstrak.

### Check Tambahan (Patch-1)

| Check | Severity | Code | Kondisi |
|---|---|---|---|
| Objective terlalu pendek | warning | `OBJECTIVE_TOO_SHORT` | objective tidak punya ≥1 kata signifikan (panjang > 3), sehingga tidak bisa dicek oleh heuristik text-match |

Tujuan: kalau sebuah objective hanya berisi kata-kata pendek (mis. "IPA kelas 7"), heuristik text-match tidak akan pernah match. Warning ini memberi sinyal ke guru untuk menulis ulang objective dengan lebih spesifik.

V2 akan menggunakan field `objectiveRefs` eksplisit di component schema, sehingga guru bisa men-tag komponen ke objective secara manual.

## Prinsip

1. **Setiap objective WAJIB di-address** oleh minimal 1 halaman materi/aktivitas.
2. **Setiap assessment (question/game) WAJIB terhubung** ke minimal 1 objective.
3. **Halaman refleksi WAJIB merujuk** kembali ke minimal 1 objective.
4. **Jika tidak ada curriculum.objectives**, project TIDAK aligned.

## Non-Goals

- Tidak menambah field ke schema project (V1 heuristic only).
- Tidak mengubah UI editor.
- Tidak memblokir export.
- Tidak menggunakan AI/NLP.
- Tidak membuat komponen baru.

## Upgrade Path V2

- Field `objectiveRefs: string[]` di component schema.
- UI di Inspector untuk tag komponen ke objective.
- Alignment badge di PagePanel per halaman.
- Alignment summary di Topbar/MpiProgressStrip.
- Auto-suggest objective tagging berdasarkan konten.
- Block export jika alignment score < threshold.
