# Component Style System V1 (COMPONENT-STYLE-01)

Commit: `COMPONENT-STYLE-01` (Level 3)
Tanggal: 2026-07-12
Verifier: AI Dev

## Tujuan

Memungkinkan AI untuk mengatur container styling untuk komponen interaktif (tabs, accordion) melalui `customStyle.tabs` dan `customStyle.accordion`. Sistem ini juga mencakup perbaikan bug export interaction wiring yang ditemukan selama investigasi Level 3.

## Arsitektur

### Alur Data

```
AI JSON → customStyle.tabs/accordion → sanitizeCustomStyle() → customStyleCss.tabs/accordion
    ↓                                                                    ↓
React: CustomStyleProvider context                          Export: _sceneCustomStyleCss closure
    ↓                                                                    ↓
SceneTabs / SceneAccordion (reads context)                  exportTabs / exportAccordion (reads closure)
```

### Komponen Kunci

| Komponen | File | Peran |
|---|---|---|
| SceneTabs | `src/components/scene-blocks/index.tsx` | React block — tab navigasi dengan panel switching |
| SceneAccordion | `src/components/scene-blocks/index.tsx` | React block — accordion dengan open/close toggle |
| exportTabs | `src/export/export-html.ts` | Export counterpart — tabs + panels |
| exportAccordion | `src/export/export-html.ts` | Export counterpart — accordion |
| wireInteractions | `src/export/export-html.ts` | Export runtime — tab panel switching + accordion toggle |

### Bug Fix (L3-1)

**Sebelum L3-1:** Tab panel switching dan accordion open/close TIDAK berfungsi di export HTML.
- `wireInteractions()` mencari selector `data-tab-panel`, `.silse-accordion-body`, `.silse-accordion-header` yang tidak pernah di-emit oleh renderer.
- `exportTabs()` tidak menerima parameter panels.
- `renderCurriculumGuideExport` hanya me-render 1 panel statis.
- `SceneAccordion` (React) tidak emit class names yang dicari handler.

**Setelah L3-1:**
- `exportTabs()` menerima parameter `panels` dan emit `[data-tab-panel]` divs di dalam `.silse-block-tabs-wrapper`.
- `wireInteractions()` tab handler mencari panels via `closest('.silse-block-tabs-wrapper')`.
- `SceneAccordion` (React) dan layered-info accordion (export) emit `.silse-accordion-header` dan `.silse-accordion-body` classes.
- `wireInteractions()` accordion handler berfungsi dengan class names yang benar.

## Adopsi (Level 3)

### Composer yang Pakai SceneTabs

| Composer | Tab IDs | Konteks |
|---|---|---|
| CurriculumGuideComposer | CP / TP / ATP | Kurikulum Merdeka (existing, diperbaiki di L3-1) |
| TeacherGuideComposer | Instruksi / 💡 Tips / 📝 Asesmen | Panduan Guru (baru di L3-3) |

### Composer yang Pakai SceneAccordion

| Composer | Items | Konteks |
|---|---|---|
| AccessibilityHelpComposer | 📖 Panduan Membaca / ⌨️ Keyboard / 🎨 Kontras | Bantuan Aksesibilitas (baru di L3-2) |

### Export Parity

Setiap SceneTabs/SceneAccordion di React memiliki exportTabs/exportAccordion mirror di export dengan className, styling, dan interaction behavior yang identik.

## Design Contract (L3-4)

### DesignTabs

```ts
export type DesignTabs = {
  activeBackground: string;
  activeColor: string;
  inactiveBackground: string;
  inactiveColor: string;
  tabRadius: number;
  tabGap: number;
};
```

Default values: activeBackground = `#ffd166`, activeColor = `#0d243d`, tabRadius = 999, tabGap = 6.

### DesignAccordion

```ts
export type DesignAccordion = {
  headerColor: string;
  bodyColor: string;
  expandIcon: string;
  collapseIcon: string;
  itemGap: number;
};
```

Default values: headerColor = `#1f2533`, bodyColor = `#4a5160`, expandIcon = `▸`, collapseIcon = `▾`, itemGap = 6.

Keduanya optional pada `MpiDesignContract` — style packs dapat override per-pack.

## AI Contract

### Contoh `customStyle.tabs` yang Valid

```json
{
  "sceneCustomStyle": {
    "tabs": {
      "gap": "8",
      "background": "rgba(255,255,255,0.08)",
      "borderRadius": "8"
    }
  }
}
```

### Contoh `customStyle.accordion` yang Valid

```json
{
  "sceneCustomStyle": {
    "accordion": {
      "gap": "8",
      "background": "rgba(255,255,255,0.04)",
      "borderRadius": "12"
    }
  }
}
```

AI hanya bisa override container styling. Warna tab aktif/accordion header tetap dari contract palette/tokens.

## Yang Tidak Di-scope

- **Carousel** — ditunda ke Level 3.5 (butuh sanitizer exception untuk `overflow`)
- **Per-slot customStyle** — saat ini scene-wide
- **Multi-open accordion** — saat ini single-open (click open → closes)
- **Tab icon support** — saat ini hanya label text
- **Animated tab indicator** — saat ini pill style, no sliding underline

## Testing

| File | Tests | Fokus |
|---|---|---|
| `src/tests/component-style-01.test.tsx` | 15 | Sanitizer + React context + export HTML |
| `src/tests/golden-reference-render-p1.test.tsx` | 14 | Render parity |
| `src/tests/golden-reference-render-p1-export-parity.test.tsx` | 12 | Export HTML structure |
| `src/tests/mpi-design-contract-01.test.ts` | 31 | Contract types |
