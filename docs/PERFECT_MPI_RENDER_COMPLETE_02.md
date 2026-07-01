# PERFECT-MPI-RENDER-COMPLETE-02

> Status: **READY FOR SENIOR REVIEW**
> Tanggal: 2026-07-01

## Tujuan

Tutup 5 scene type narrative/guidance yang tersisa: timeline-story, branching-scenario, glossary-cards, teacher-guide, accessibility-help. Semua scene type di contract sekarang punya renderer.

---

## 1. Scene Type yang Ditutup

| Scene Type | React Composer | Export Renderer | Interaction |
|-----------|----------------|-----------------|-------------|
| timeline-story | TimelineStoryComposer | renderTimelineStoryExport | prev/next step + checkpoint with helpful feedback |
| branching-scenario | BranchingScenarioComposer | renderBranchingScenarioExport | choice → consequence with helpful feedback + reset |
| glossary-cards | GlossaryCardsComposer | renderGlossaryCardsExport | click card → reveal definition + example |
| teacher-guide | TeacherGuideComposer | renderTeacherGuideExport | static (instruction + tips + timing + assessment) |
| accessibility-help | AccessibilityHelpComposer | renderAccessibilityHelpExport | static (reading + keyboard + contrast guide) |

**Total scene type dengan renderer: 27/27** (ALL scene types in contract now have renderers).

---

## 2. Helpful Feedback (Aturan Tambahan Senior Reviewer)

Semua scene interaktif punya feedback yang membantu siswa memahami, bukan hanya benar/salah:

### Timeline Story Checkpoint:
- Correct: "Benar! Jawabanmu tepat — kamu memahami alur cerita dengan baik."
- Wrong: "Belum tepat. Pikirkan kembali: kunci jawaban mengandung kata 'kebutuhan masyarakat...'" (memberikan hint)

### Branching Scenario:
- Correct: "✓ Pilihan Tepat" + consequence explanation (mengapa pilihan ini tepat)
- Wrong: "⚠ Pertimbangkan Kembali" + consequence explanation (dampak dari pilihan ini)

---

## 3. React/Export Parity

| Scene Type | React | Export | wireInteractions |
|-----------|-------|--------|-----------------|
| timeline-story | ✅ | ✅ | ✅ step click + prev/next + detail update |
| branching-scenario | ✅ | ✅ | ✅ choice → consequence + reset |
| glossary-cards | ✅ | ✅ | ✅ card toggle (hint/def/example) |
| teacher-guide | ✅ | ✅ | ✅ (static) |
| accessibility-help | ✅ | ✅ | ✅ (static) |

---

## 4. Inspector Support

SceneContentEditor V1 sekarang mendukung 5 scene type baru:
- **timeline-story**: title, checkpointQuestion, checkpointAnswer
- **branching-scenario**: scenarioPrompt, resetLabel
- **glossary-cards**: title
- **teacher-guide**: title, teacherInstruction, timeAllocation, assessmentNotes
- **accessibility-help**: title, readingGuide, keyboardGuide, contrastOption

---

## 5. Batasan yang Belum Dikerjakan

1. List editor V2 (events, choices, terms, tips) — V1 hanya text field.
2. Runtime score sync antar React composer dan editor store aggregateScore.
3. Feedback remedial masih generik ("Benar!"/"Belum tepat") — perlu dijadikan lebih edukatif di batch polish.

---

## 6. Syarat Lanjut ke Batch 3 (Inspector V2)

Lulus jika: typecheck + test + build PASS, 5 scene type render di React + export, interaction behavior berfungsi dengan helpful feedback, SceneContentEditor muncul, 12 golden-reference tetap pass, legacy aman.

---

## Lampiran: Test Suite

File: `src/tests/perfect-mpi-render-complete-02.test.tsx` — 19 tests (7 scope).

| Scope | Tests | Fokus |
|-------|-------|-------|
| A | 4 | timeline-story (render + next/prev + checkpoint feedback + export) |
| B | 5 | branching-scenario (render + correct/wrong feedback + reset + export) |
| C | 3 | glossary-cards (render + reveal + export) |
| D | 2 | teacher-guide (render + export) |
| E | 2 | accessibility-help (render + export) |
| F | 1 | SceneContentEditor 5 scene types |
| G | 2 | regression (legacy + 12 golden) |

Verifikasi: typecheck PASS, test 3135/3135 PASS, build PASS.
