# SILSE MPI Editor — Development Workflow

**Status:** LOCKED
**Berlaku:** Semua sesi development setelah commit `a8a706b`

---

## Standar Kerja

### Aturan Main
1. **Scope discipline** — hanya kerjakan yang di-TODO list, tidak ada fitur tambahan "sekalian"
2. **Audit wajib** — setiap sesi coding harus lewat self-audit sebelum declare selesai
3. **Patch in-session** — kalau audit gagal, fix di sesi yang sama, tidak boleh "fix nanti"
4. **1 sesi = 1 milestone scope** — tidak boleh kerjakan 2 milestone sekaligus
5. **Kalau nemu bug di luar scope** — catat di worklog, jangan fix di sesi itu

---

## Workflow: PLAN → CODE → SELF-AUDIT → FIX → VERIFY → DECLARE

### 1. PLAN

Sebelum mulai coding, tulis TODO list dengan scope jelas:

- Apa yang dikerjakan
- File mana yang disentuh
- Apa hasil akhirnya
- Berapa test yang akan ditulis

**Tidak boleh mulai CODE sebelum PLAN jelas.**

### 2. CODE

Implementasi sesuai PLAN:

- Hanya sentuh file yang sudah didefinisikan di PLAN
- Kalau nemu bug di luar scope: catat, jangan fix
- Test harus behavior test (render/call function/check output), bukan source-string test (readFileSync + toContain)
- 1 commit = 1 scope

### 3. SELF-AUDIT

Sebelum bilang "selesai", jalankan checklist ini secara ketat:

```
□ npm run typecheck        → 0 errors
□ npm test -- --run         → 0 failed (ALL pass)
□ npm run build             → SUCCESS
□ git diff --stat           → hanya file dalam scope (tidak melebar)
□ Spot check render         → export HTML tidak crash/blank
□ Cek test baru             → behavior test, bukan source-string
□ Cek unused imports        → tidak ada error TS6133
```

**Kalau ada yang gagal → lanjut ke FIX.**

### 4. FIX

- Fix hanya untuk yang gagal di SELF-AUDIT — tidak tambah fitur
- Fix commit message: `[SCOPE] PATCH A: [deskripsi fix]`
- Setelah fix → lanjut ke VERIFY

### 5. VERIFY

- Jalankan ulang SELF-AUDIT checklist (semua item)
- Kalau masih gagal → FIX lagi (max 2 round)
- Kalau masih gagal setelah 2 round → DECLARE blocker, catat di worklog

### 6. DECLARE

Hanya setelah VERIFY lulus semua:

- `git add -A && git commit -m "[SCOPE]: [deskripsi]"` 
- `git push origin main`
- Summary singkat ke Bapak:
  - Apa yang dikerjakan
  - Berapa test baru
  - Audit status (PASS/PATCH)
  - SHA commit

---

## Test Standards

### Wajib (Behavior Test)
- Render component → verify output
- Call function → verify return value
- Check export HTML → verify content
- Dynamic import → verify module loads

### Dilarang (Source-String Test)
- `readFileSync(source.ts) + expect(src).toContain('string')`
- Test yang cek "kode ditulis seperti ini" bukan "fitur berfungsi"
- Test yang pass walau code broken, asal string ada di source

---

## Commit Convention

```
[SCOPE]: deskripsi singkat

Detail perubahan:
- Item 1
- Item 2

AUDIT:
- typecheck: PASS
- test: XXXX/XXXX PASS
- build: PASS
- git diff: N files only (no scope creep)
```

Patch commit:
```
[SCOPE] PATCH A: deskripsi fix
```

---

## File Path Conventions

| Path | Purpose |
|------|---------|
| `/home/z/my-project/silse-mpi-editor/` | SILSE editor repo |
| `/home/z/my-project/scripts/` | Audit/diagnostic scripts |
| `/home/z/my-project/download/` | Final deliverables (HTML exports, etc) |
| `/home/z/my-project/public/silse-editor/` | Build output untuk preview workspace |

---

## Roadmap Status Tracking

Update setiap sesi:

| Fase | Item | Status |
|------|------|--------|
| Fase 1 | C-01 s/d C-04, UX-01 | ✅ COMPLETE |
| Fase 2 | UX-03, UX-04, UX-05 | ✅ DONE |
| Fase 3 | S-01, S-02, S-03 | ✅ COMPLETE |
| Fase 4 | F-01 Undo/Redo | ✅ DONE |
| Fase 5 | E-03 Export JSON | ✅ DONE |
| Fase 2 | UX-02, UX-06 | ⚪ TODO |
| Fase 4 | F-02, F-03, F-04, F-05 | ⚪ Backlog |
| Fase 5 | E-01, E-02, E-04, P-01, P-02 | ⚪ TODO/Backlog |
