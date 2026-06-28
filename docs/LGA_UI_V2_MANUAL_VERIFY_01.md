# LGA-UI-V2 Manual Verify 01

Commit yang diverifikasi: `ecc02c4` (LGA-UI-V2 base) → patched at `<patch-commit>` (LGA-UI-V2-MANUAL-VERIFY-01)
Tanggal: 2026-06-29
Verifier: AI Dev (manual verify via code reading + automated test execution)

## Ringkasan Verdict

**NEEDS PATCH** — 2 masalah nyata ditemukan saat manual verify, keduanya sudah di-patch:

1. UX copy: "✓ Aligned" / "✗ Belum aligned" di detail panel header → tidak konsisten dengan istilah Indonesia "Selaras" yang dipakai di seluruh UI lain. **Patched** → "✓ Selaras" / "✗ Belum selaras".
2. React key collision: saat ada duplicate objective ID, section "Tujuan Tercover" menggunakan `key={obj.id}` yang menyebabkan React warning "Encountered two children with the same key". **Patched** → `key={obj.id}-${idx}`.

Tidak ada masalah lain. Semua 7 skenario PASS setelah patch.

---

## Skenario Manual

### 1. Fresh project (belum ada objectives)

- **Hasil**: PASS
- **Catatan**:
  - PagePanel tampil normal. Header kiri tetap "Halaman".
  - Cek Standar (StatusSummary) tetap tampil.
  - AlignmentSummary tampil dengan teks "Alignment: Belum ada tujuan".
  - AlignmentSummary adalah `<div>` (non-interactive), bukan `<button>`.
  - Klik AlignmentSummary tidak membuka modal (tidak ada event handler).
  - Tidak ada crash.
- **Test**: `S1. Fresh project: AlignmentSummary shows "Belum ada tujuan" and is non-interactive`

### 2. Sample PPKn normal

- **Hasil**: PASS
- **Catatan**:
  - AlignmentSummary tampil sebagai `<button>` (clickable).
  - Menampilkan coverage "X/Y tujuan tercover".
  - Menampilkan skor + label (Sangat/Cukup/Kurang/Belum Selaras).
  - Issue flag ⚠ dengan jumlah issue muncul kalau ada issue.
  - Klik chip membuka AlignmentDetailPanel.
  - Modal tidak menutup saat klik isi panel (stopPropagation pada panel).
  - Modal menutup saat klik tombol X.
  - Modal menutup saat tekan Esc (useEffect keydown handler).
  - Modal menutup saat klik area luar panel (overlay onClick).
- **Test**: `S2`, `S2b` (click inside), `S2c` (click outside)

### 3. Detail panel content

- **Hasil**: PASS
- **Catatan**:
  - 4 section tersedia: Tujuan Tidak Tercover, Tujuan Tercover, Masalah Alignment, Status per Halaman.
  - Section yang tidak relevan tidak muncul (conditional rendering).
  - Saat semua aligned, tampilkan all-ok state: "Semua tujuan pembelajaran tercover dan tidak ada masalah alignment."
  - Issue dengan pageId bisa diklik → selectPage + tutup modal.
  - Issue tanpa pageId tidak clickable (tidak punya class `is-clickable`, tidak ada cursor pointer).
  - Status per halaman menampilkan role label (friendly, bukan kode) + level alignment label.
  - Bahasa cukup ramah guru. issue.code (mis. "OBJECTIVE_NOT_COVERED") muncul sebagai chip kecil (10px, monospace, muted) — tidak mendominasi.
- **Test**: `S3`, `S3b` (all-ok state)

### 4. PagePanel list view badge

- **Hasil**: PASS
- **Catatan**:
  - Badge alignment muncul di halaman non-neutral (material, quiz, reflection, dll.).
  - Role neutral (cover, guide, menu, free) tidak mendapat badge.
  - Badge kecil (18px circle), tidak mendominasi judul.
  - Badge di sebelah StatusBadge, bisa dibedakan (warna berbeda: hijau aligned, oranye partial, merah unaligned, abu-abu empty).
  - Badge punya title tooltip: "Alignment: [label]".
  - Level: ✓ Selaras, ◐ Sebagian, ✗ Belum selaras, ○ Kosong.
  - Badge TIDAK muncul di thumbnail view (hanya di renderPageItem yang list view only).
- **Test**: `S4` (badge muncul + neutral tanpa badge), `S4b` (thumbnail view tanpa badge)

### 5. PageThumbnail tidak berubah

- **Hasil**: PASS
- **Catatan**:
  - Thumbnail tetap seperti sebelum LGA-UI-V2.
  - Tidak ada badge alignment di thumbnail.
  - Tidak ada perubahan semantic preview.
  - Thumbnail tetap clickable (button element).
  - Thumbnail tetap punya data-role + data-status.
  - PageThumbnail.tsx tidak disentuh sama sekali.
- **Test**: `S5. PageThumbnail unchanged`

### 6. Broken alignment fixture

- **Hasil**: PASS
- **Catatan**:
  - Fixture: 2 objectives, hanya 1 tercover, quiz/question tidak nyambung.
  - AlignmentSummary menunjukkan issue flag dengan jumlah.
  - Detail panel menampilkan "Tujuan Tidak Tercover" (objective ke-2).
  - Detail panel menampilkan "Masalah Alignment" (ASSESSMENT_NOT_LINKED + OBJECTIVE_NOT_COVERED).
  - Klik issue question → pindah ke halaman quiz yang benar + tutup modal.
  - Badge halaman material: aligned (karena cover objective). Badge quiz: unaligned (karena ASSESSMENT_NOT_LINKED).
- **Test**: `S6. Broken alignment: issue shown, click issue navigates to page`

### 7. Duplicate objective ID fixture

- **Hasil**: PASS (setelah patch React key collision)
- **Catatan**:
  - Fixture: 2 objective dengan id sama "obj-1".
  - OBJECTIVE_DUPLICATE_ID issue muncul di detail panel.
  - Severity error.
  - AlignmentSummary tidak menampilkan status all-ok (data-ok="false").
  - Issue tidak punya pageId → data-page-id kosong → tidak clickable (tidak punya class is-clickable).
  - Sebelum patch: React warning "Encountered two children with the same key" di section "Tujuan Tercover" karena `key={obj.id}`. Setelah patch: `key={obj.id}-${idx}` → warning hilang.
  - Tidak dibuat UI editor untuk edit objective ID (sesuai instruksi).
- **Test**: `S7. Duplicate objective ID: issue appears in detail panel, not clickable (no pageId)`

---

## UX Copy Audit

### Teks yang sudah baik (konsisten, ramah guru):

- "Alignment: Belum ada tujuan" — OK
- "Alignment: X/Y tujuan tercover" — OK
- "Alignment Tujuan Pembelajaran" (modal title) — OK
- "Tujuan Tidak Tercover" — OK
- "Tujuan Tercover" — OK
- "Masalah Alignment" — OK
- "Status per Halaman" — OK
- "Semua tujuan pembelajaran tercover dan tidak ada masalah alignment." — OK
- "Klik masalah atau halaman untuk pindah ke halaman terkait. Tutup dengan Esc atau klik di luar." — OK
- "Halaman: {title} · {role label}" — OK
- Score labels: "Sangat Selaras" / "Cukup Selaras" / "Kurang Selaras" / "Belum Selaras" — OK
- Badge labels: "Selaras" / "Sebagian" / "Belum selaras" / "Kosong" / "Netral" — OK

### Teks yang perlu diperbaiki (sudah di-patch):

- **SEBELUM**: "✓ Aligned" / "✗ Belum aligned" di detail panel header flag.
- **ALASAN**: Tidak konsisten dengan istilah "Selaras" yang dipakai di seluruh UI lain. "Aligned" adalah English.
- **SETELAH PATCH**: "✓ Selaras" / "✗ Belum selaras".
- **Test**: `Detail panel header uses "Selaras" (not "Aligned") when ok=true` + `uses "Belum selaras" (not "Belum aligned") when ok=false`

### Teks teknis yang masih muncul (diterima, bukan blocker):

- `issue.code` (mis. "OBJECTIVE_NOT_COVERED", "OBJECTIVE_DUPLICATE_ID") — muncul sebagai chip kecil 10px monospace muted di detail panel. Ini meta, bukan teks utama. Diterima sesuai instruksi senior: "Kode issue boleh muncul di detail panel, tetapi jangan menjadi teks utama. Jika terlalu mengganggu, kecilkan atau tampilkan sebagai meta."
- Pesan OBJECTIVE_DUPLICATE_ID dari checker: "Ada ID tujuan pembelajaran yang duplikat (id: "obj-1"). Setiap tujuan wajib punya ID unik agar coverage checker tidak salah hitup." — mengandung "(id: "obj-1")" dan "coverage checker" yang agak teknis. Namun:
  - Tidak di-patch karena instruksi senior: "Jangan ubah checker core kecuali ada bug nyata."
  - Pesan utama "Ada ID tujuan pembelajaran yang duplikat" sudah ramah guru.
  - Bagian teknis "(id: ...)" membantu guru melaporkan ke dev jika perlu.
  - Catat sebagai known limitation untuk V3.

---

## Accessibility Sanity

- **role dialog**: ✓ `role="dialog"` pada overlay.
- **aria modal**: ✓ `aria-modal="true"` pada overlay.
- **close button**: ✓ `aria-label="Tutup"` pada tombol close.
- **Esc**: ✓ `useEffect` keydown listener, Esc → onClose().
- **click outside**: ✓ overlay `onClick={onClose}`, panel `onClick={(e) => e.stopPropagation()}`.
- **click inside**: ✓ panel tidak menutup (stopPropagation).
- **AlignmentSummary clickable**: ✓ `<button type="button">`.
- **AlignmentSummary empty state**: ✓ `<div>` (non-interactive, bukan button).
- **icon aria-hidden**: ✓ semua icon dekoratif punya `aria-hidden`.
- **issue flag aria-label**: ✓ `aria-label="${issueCount} masalah"`.

Semua checklist terpenuhi. Tidak ada patch accessibility yang diperlukan.

---

## Performance Sanity

### Hook usage count

`useLearningGoalAlignment()` dipanggil di 3 lokasi production code:

1. `src/editor/PagePanel.tsx:232` — selalu aktif (untuk badge lookup di list view).
2. `src/editor/AlignmentPanel.tsx:48` — AlignmentSummary, selalu aktif.
3. `src/editor/AlignmentPanel.tsx:112` — AlignmentDetailPanel, hanya saat modal terbuka.

**Saat modal tertutup**: 2 pemanggilan (PagePanel + AlignmentSummary).
**Saat modal terbuka**: 3 pemanggilan (PagePanel + AlignmentSummary + AlignmentDetailPanel).

### Catatan performance

- Setiap pemanggilan dibungkus `useMemo([project])`, jadi recompute hanya saat project reference berubah.
- Namun, `useMemo` adalah per-instance. Setiap hook instance menghitung independently. Jadi `checkLearningGoalAlignment(project)` dijalankan 2-3 kali per project change.
- Untuk ukuran project sekarang (10-20 halaman, 20-50 komponen, 3-5 objectives), ini negligible — checker adalah O(pages × components × objectives) yang masih kecil.
- **Tidak perlu refactor sekarang.** Catat untuk future: kalau project besar (>50 halaman) atau objective banyak (>20), bisa optimasi dengan:
  - Prop drilling: hitung alignment sekali di PagePanel, passing sebagai prop ke AlignmentSummary + AlignmentDetailPanel.
  - Atau: Zustand selector dengan shallow equality.
- **Aman untuk ukuran project sekarang.**

---

## Patch yang dilakukan

### Patch 1 — UX copy wording fix

- **File**: `src/editor/AlignmentPanel.tsx`
- **Perubahan**: 
  - Line 185: `<span className="alignment-detail__ok-flag">✓ Aligned</span>` → `✓ Selaras`
  - Line 187: `<span className="alignment-detail__not-ok-flag">✗ Belum aligned</span>` → `✗ Belum selaras`
- **Alasan**: Konsistensi istilah. Seluruh UI lain memakai "Selaras" (Sangat Selaras, Cukup Selaras, dll.). "Aligned" adalah English yang tidak konsisten.

### Patch 2 — React key collision fix

- **File**: `src/editor/AlignmentPanel.tsx`
- **Perubahan**:
  - Section "Tujuan Tidak Tercover": `key={objId}` → `key={objId}-${idx}`
  - Section "Tujuan Tercover": `key={obj.id}` → `key={obj.id}-${idx}`
- **Alasan**: Saat ada duplicate objective ID (OBJECTIVE_DUPLICATE_ID scenario), React warning "Encountered two children with the same key" muncul. Menggunakan composite key `id-index` menjamin uniqueness tanpa mengubah behavior.

### Tidak ada patch lain

- Tidak ada patch thumbnail.
- Tidak ada patch schema.
- Tidak ada patch style/template.
- Tidak ada patch export.
- Tidak ada patch core checker.
- Tidak ada patch kontrak LGA V1.

---

## Verification

- **typecheck**: PASS
- **test**: 1654/1654 PASS (13 manual verify test baru + 2 wording patch test + 50 UI-V2 existing + 1589 existing lainnya)
- **build**: PASS (CSS 44.01kB sama, JS 396.32kB — minimal change dari wording fix)

---

## Known Limitations

1. **Thumbnail masih T/C/Q map teknis** — sengaja backlog kosmetik. Tidak dikerjakan di batch ini sesuai instruksi senior reviewer.
2. **objectiveRefs schema belum ada** — V3 nanti. Saat ini alignment memakai heuristik text-match V1.
3. **Export blocking alignment belum ada** — export masih hanya cek `checkMpiStandard`, tidak cek alignment. V3+ bisa tambah guard.
4. **Pesan OBJECTIVE_DUPLICATE_ID mengandung "(id: ...)" dan "coverage checker"** — agak teknis untuk guru. Tidak di-patch karena instruksi tidak ubah checker core. Catat untuk V3 wording polish.
5. **Hook dipanggil 2-3 kali per render** — aman untuk ukuran project sekarang. Catat untuk future optimasi kalau project besar.
6. **Modal tidak trap focus** — Esc + click outside sudah cukup untuk accessibility dasar. Focus trap adalah nice-to-have untuk V3.
7. **Detail panel "Status per Halaman" menampilkan semua halaman termasuk neutral** — cover/guide/menu/free muncul dengan "— Netral". Ini intentional untuk completeness (guru lihat semua halaman dalam satu view). Bisa di-hide di V3 kalau dirasa ramai.

---

## Definition of Done Checklist

- [x] Semua 7 skenario manual diverifikasi.
- [x] Report markdown dibuat.
- [x] Tidak ada scope creep.
- [x] Tidak ada perubahan thumbnail.
- [x] Tidak ada perubahan schema.
- [x] Tidak ada style/template baru.
- [x] typecheck PASS.
- [x] test PASS.
- [x] build PASS.
