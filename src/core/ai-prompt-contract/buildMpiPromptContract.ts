/**
 * Build MPI Prompt Contract (APP-AI-PROMPT-CONTRACT-01 + FOUNDATION-FINAL-LOCK-01 PATCH A).
 *
 * Layer: core/ai-prompt-contract (pure function, no React/DOM)
 * Allowed imports: ./promptContractTypes, ../mpi-container/types, ../mpi-design-contract/types,
 *   ../mpi-container/universal-scene-taxonomy
 *
 * Kontrak:
 *   Pure function yang membangun prompt contract dari app capabilities.
 *   App memberi kontrak ke AI: sceneType, slot, style token, layout format,
 *   variants, prohibitions, output rules.
 *
 *   Prinsip:
 *     - Pure function, no DOM, no React, no store.
 *     - App yang memberi kontrak, AI tidak boleh menebak.
 *     - Prompt melarang HTML/CSS mentah.
 *     - Prompt wajib menyebut output JSON.
 */

import type { MpiPromptContract, PromptContractSceneType } from './promptContractTypes';
import { DEFAULT_DESIGN_CONTRACT } from '../mpi-design-contract/defaultDesignContract';
import { SCENE_REQUIRED_SLOTS } from '../mpi-container/universal-scene-taxonomy';

// ---------------------------------------------------------------------------
// Scene types yang tersedia — FOUNDATION-FINAL-LOCK-01 PATCH A:
// Generated dari universal scene taxonomy (26 scene types: 5 rendered + 21 contract-only)
// ---------------------------------------------------------------------------

const SCENE_TYPES: PromptContractSceneType[] = SCENE_REQUIRED_SLOTS.map((s) => ({
  id: s.sceneType,
  role: s.sceneType.split('-')[0], // simplified role from sceneType
  description: s.description,
  requiredSlots: s.requiredSlots,
  optionalSlots: s.optionalSlots,
}));

// ---------------------------------------------------------------------------
// Build prompt contract
// ---------------------------------------------------------------------------

export function buildMpiPromptContract(): MpiPromptContract {
  return {
    frame: {
      width: DEFAULT_DESIGN_CONTRACT.frame.width,
      height: DEFAULT_DESIGN_CONTRACT.frame.height,
      aspectRatio: DEFAULT_DESIGN_CONTRACT.frame.aspectRatio,
    },

    sceneTypes: SCENE_TYPES,

    slotKinds: [
      'text',
      'card',
      'image',
      'button',
      'badge',
      'game-mission',
      'quiz-question',
      'learning-material',
      'cover-hero',
      'closing-award',
      'feedback',
      'reward',
      'navigation',
    ],

    styleTokens: [
      { category: 'palette', tokens: ['primary', 'secondary', 'accent', 'background', 'surface', 'text', 'mutedText', 'border', 'success', 'warning', 'danger', 'gold'] },
      { category: 'background', tokens: ['none', 'solid', 'gradient-linear', 'gradient-radial', 'gradient-conic', 'image', 'pattern-grid', 'pattern-dots', 'pattern-glow', 'overlay', 'decorative-shapes'] },
      { category: 'motion', tokens: ['none', 'soft-fade', 'slide-up', 'pulse', 'reward-pop', 'correct-burst'] },
      { category: 'feedback', tokens: ['correct', 'wrong', 'neutral', 'warning'] },
      { category: 'toolbarStyle', tokens: ['floating-glass', 'solid', 'minimal'] },
    ],

    allowedVariants: [
      { component: 'card', variants: ['info-card', 'important-note', 'infoCard', 'importantNote'] },
      { component: 'button', variants: ['primary', 'secondary', 'ghost', 'mission', 'gold'] },
      { component: 'badge', variants: ['sm', 'md', 'lg'] },
      { component: 'text', variants: ['title', 'subtitle', 'body', 'instruction'] },
    ],

    layoutFormats: [
      { id: 'cover-centered', description: 'Cover dengan judul di tengah', slots: ['title', 'subtitle', 'cta'] },
      { id: 'cover-split', description: 'Cover dua sisi (teks + visual)', slots: ['title', 'subtitle', 'hero-art', 'cta'] },
      { id: 'material-two-column', description: 'Materi dua kolom', slots: ['title', 'body', 'card', 'image'] },
      { id: 'material-card-stack', description: 'Materi kartu bertumpuk', slots: ['title', 'card', 'card', 'card'] },
      { id: 'quiz-focus', description: 'Kuis fokus tengah', slots: ['question', 'choices', 'feedback'] },
      { id: 'reflection-calm', description: 'Refleksi tenang', slots: ['title', 'card', 'cta'] },
      { id: 'mission-map', description: 'Peta misi dengan hotspot', slots: ['map', 'hotspots', 'stats'] },
      { id: 'closing-centered', description: 'Penutup tengah dengan award', slots: ['title', 'medal', 'ribbon'] },
    ],

    prohibitions: [
      'Jangan buat HTML.',
      'Jangan buat CSS mentah.',
      'Jangan buat JavaScript.',
      'Jangan gunakan field di luar schema.',
      'Jangan gunakan style token di luar yang tersedia.',
      'Jangan gunakan variant di luar yang allowed.',
      'Jangan buat sceneType yang tidak ada di daftar.',
      'Jangan buat slot kind yang tidak ada di daftar.',
      'Jangan embed asset eksternal (hanya base64 data URI).',
      'Jangan buat field tambahan di luar kontrak.',
    ],

    outputRules: [
      'Output wajib JSON valid.',
      'Gunakan frame 1280x720 (16/9).',
      'Setiap scene wajib punya sceneType yang tersedia.',
      'Setiap scene wajib punya slots sesuai requiredSlots.',
      'Setiap elemen visual wajib punya placement (x, y, width, height).',
      'Gunakan designSystem token yang tersedia.',
      'Gunakan allowed variants untuk card/button/badge.',
      'Untuk game, gunakan slot kind "game-mission" dengan briefing, missionTarget, actions, reward.',
      'Untuk quiz, gunakan slot kind "quiz-question" dengan prompt, choices, correctChoiceId, feedback.',
      'Untuk materi (learning-scene), gunakan slot kind "learning-material" dengan conceptTitle, explanation, examples, keyPoints, studentAction, visualHint.',
      'Untuk cover (cover-hero), gunakan slot kind "cover-hero" dengan heroTitle, kicker, heroSubtitle, badges, primaryAction, visualAnchor.',
      'Untuk closing (closing-award), gunakan slot kind "closing-award" dengan achievement, summary, reflectionPrompt, rewardLabel, rewardIcon, nextLearning, finalAction.',
      'Untuk feedback, gunakan variant correct/wrong/neutral/warning.',
    ],
  };
}

// ---------------------------------------------------------------------------
// Build prompt text (untuk dikirim ke AI)
// ---------------------------------------------------------------------------

export function buildMpiPromptText(): string {
  const contract = buildMpiPromptContract();
  const lines: string[] = [];

  lines.push('=== SILSE MPI PROMPT CONTRACT ===');
  lines.push('');
  lines.push('Anda adalah AI yang membuat Media Pembelajaran Interaktif (MPI) untuk SILSE.');
  lines.push('Output Anda akan dirender oleh app SILSE menjadi scene pembelajaran.');
  lines.push('');

  lines.push('## FRAME');
  lines.push(`- Width: ${contract.frame.width}px`);
  lines.push(`- Height: ${contract.frame.height}px`);
  lines.push(`- Aspect Ratio: ${contract.frame.aspectRatio}`);
  lines.push('');

  lines.push('## OUTPUT RULES');
  for (const rule of contract.outputRules) {
    lines.push(`- ${rule}`);
  }
  lines.push('');

  lines.push('## PROHIBITIONS (DILARANG KERAS)');
  for (const p of contract.prohibitions) {
    lines.push(`- ${p}`);
  }
  lines.push('');

  lines.push('## AVAILABLE SCENE TYPES');
  for (const st of contract.sceneTypes) {
    lines.push(`- ${st.id} (role: ${st.role}): ${st.description}`);
    lines.push(`  Required slots: ${st.requiredSlots.join(', ')}`);
    if (st.optionalSlots.length > 0) {
      lines.push(`  Optional slots: ${st.optionalSlots.join(', ')}`);
    }
  }
  lines.push('');

  lines.push('## AVAILABLE SLOT KINDS');
  lines.push(contract.slotKinds.join(', '));
  lines.push('');

  lines.push('## STYLE TOKEN CATEGORIES');
  for (const st of contract.styleTokens) {
    lines.push(`- ${st.category}: ${st.tokens.join(' | ')}`);
  }
  lines.push('');

  lines.push('## ALLOWED VARIANTS');
  for (const v of contract.allowedVariants) {
    lines.push(`- ${v.component}: ${v.variants.join(' | ')}`);
  }
  lines.push('');

  lines.push('## LAYOUT FORMATS');
  for (const lf of contract.layoutFormats) {
    lines.push(`- ${lf.id}: ${lf.description} (slots: ${lf.slots.join(', ')})`);
  }
  lines.push('');

  lines.push('## CUSTOM STYLE (customStyle)');
  lines.push('Setiap slot bisa punya field "customStyle" untuk CSS tambahan dari AI.');
  lines.push('Format: { "elementKey": { "cssProperty": "value" } }');
  lines.push('Element keys yang didukung:');
  lines.push('  - "shell": scene background/container (background, padding, borderRadius)');
  lines.push('  - "header": judul scene (fontSize, color, background, textTransform)');
  lines.push('  - "panel": kartu materi (borderRadius, boxShadow, border, backdropFilter)');
  lines.push('  - "chip": badge/label kecil (background, border, color)');
  lines.push('  - "button": tombol aksi (background, borderRadius, boxShadow)');
  lines.push('  - "grid": layout grid container (gridTemplateColumns, gap, display) — LAYOUT-STYLE-01');
  lines.push('  - "tabs": container tab navigasi (gap, background, borderRadius, padding) — COMPONENT-STYLE-01');
  lines.push('  - "accordion": container accordion (gap, background, borderRadius, padding) — COMPONENT-STYLE-01');
  lines.push('Contoh:');
  lines.push('  "customStyle": {');
  lines.push('    "shell": { "background": "linear-gradient(135deg, #667eea, #764ba2)" },');
  lines.push('    "header": { "fontSize": "52px", "color": "#ffffff" },');
  lines.push('    "panel": { "borderRadius": "24px", "boxShadow": "0 20px 60px rgba(0,0,0,0.3)", "backdropFilter": "blur(10px)" },');
  lines.push('    "chip": { "background": "rgba(255,255,255,0.1)", "border": "1px solid rgba(255,255,255,0.2)" },');
  lines.push('    "button": { "background": "linear-gradient(135deg, #667eea, #764ba2)", "borderRadius": "999px" },');
  lines.push('    "grid": { "gridTemplateColumns": "repeat(3, 1fr)", "gap": "20px" },');
  lines.push('    "tabs": { "gap": "8px", "background": "rgba(255,255,255,0.05)", "borderRadius": "12px", "padding": "8px" }');
  lines.push('  }');
  lines.push('Batasan: fontFamily TIDAK boleh font dekoratif (Comic Sans, cursive) atau eksternal (Google Fonts).');
  lines.push('');
  lines.push('COMPONENT STYLE (COMPONENT-STYLE-01) — Batasan untuk "tabs" dan "accordion" key:');
  lines.push('Element key "tabs" dan "accordion" memungkinkan AI mengatur container styling untuk komponen interaktif.');
  lines.push('Properti yang diizinkan: gap, background, borderRadius, padding, border, boxShadow, margin.');
  lines.push('Catatan: AI hanya bisa override container styling. Warna tab aktif/accordion header tetap dari contract palette.');
  lines.push('Contoh: "tabs": { "gap": "8px", "background": "rgba(255,255,255,0.05)", "borderRadius": "12px" }');
  lines.push('');
  lines.push('LAYOUT STYLE (LAYOUT-STYLE-01) — Batasan khusus untuk "grid" key:');
  lines.push('Element key "grid" memungkinkan AI mengatur layout grid container (kartu review, galeri).');
  lines.push('Properti yang diizinkan di "grid": display, gridTemplateColumns, gridTemplateRows, gap, flexDirection, flexWrap, alignItems, justifyContent.');
  lines.push('Batasan nilai (dipaksa oleh sanitizer):');
  lines.push('  - display: HANYA "grid" atau "flex" (tidak boleh "none" atau "block").');
  lines.push('  - gridTemplateColumns: HANYA pattern berikut:');
  lines.push('      * "repeat(N, 1fr)" dimana N = 1-6 (contoh: "repeat(3, 1fr)" untuk 3 kolom).');
  lines.push('      * "repeat(auto-fill, minmax(NNNpx, 1fr))" dimana NNN = 100-500 (contoh: "repeat(auto-fill, minmax(240px, 1fr))").');
  lines.push('      * "1fr 1fr ..." maksimal 6 kolom (contoh: "1fr 1fr" untuk 2 kolom).');
  lines.push('  - gap: 0-100px (nilai di luar range akan di-clamp).');
  lines.push('  - flexDirection: "row" | "column" | "row-reverse" | "column-reverse".');
  lines.push('  - flexWrap: "wrap" | "nowrap" | "wrap-reverse".');
  lines.push('  - alignItems/justifyContent: flex-start/flex-end/center/stretch/baseline/space-between/space-around/space-evenly.');
  lines.push('Properti BERBAHAYA yang ditolak: position, width, height, left, top, zIndex (layout engine kontrol).');
  lines.push('');
  lines.push('BEHAVIOR STYLE (BEHAVIOR-STYLE-01) — Animasi, transisi, dan hover effect:');
  lines.push('AI dapat menambahkan transisi, animasi, dan behavior ke elemen melalui customStyle.');
  lines.push('Properti animasi yang diizinkan (dengan validasi ketat):');
  lines.push('  - transition: properti spesifik + durasi max 1s + easing whitelist. CONTOH: "transition": "transform 0.3s ease-out"');
  lines.push('    * BLOK "all" — sebut properti spesifik (transform, opacity, box-shadow).');
  lines.push('    * Easing: ease, ease-out, ease-in, ease-in-out, linear, cubic-bezier(4 nilai 0-1).');
  lines.push('    * Maksimal 3 transisi comma-separated.');
  lines.push('  - animation: HANYA nama preset dari daftar berikut + durasi max 1s:');
  lines.push('    * silse-fade-in-soft, silse-fade-in-warm, silse-fade-in-mission');
  lines.push('    * silse-feedback-pop, silse-mission-pulse');
  lines.push('    * silse-motion-entrance-fade, silse-motion-entrance-slide-up, silse-motion-soft-fade');
  lines.push('    * silse-motion-slide-up, silse-motion-pulse, silse-motion-reward-pop');
  lines.push('    * silse-motion-correct-burst, silse-motion-feedback-pop, "none"');
  lines.push('    * BLOK "infinite" — maksimal 60 iterasi.');
  lines.push('  - transform: translateX/Y max ±100px, scale 0.8-1.2, rotate max ±360deg. BLOK matrix().');
  lines.push('  - filter/backdropFilter: blur max 20px. BLOK url().');
  lines.push('Behavior (hover/press/focus) via key "behavior":');
  lines.push('  "behavior": { "hover": { "transform": "scale(1.05)", "boxShadow": "0 8px 24px rgba(0,0,0,0.2)" } }');
  lines.push('  Sub-key yang diizinkan: "hover", "press", "focus". Setiap sub-key berisi CSS properti (sama validasi).');
  lines.push('Contoh lengkap: "button": { "transition": "transform 0.2s ease-out", "behavior": { "hover": { "transform": "scale(1.05)" } } }');
  lines.push('');
  lines.push('AKSESIBILITAS ANIMASI (WAJIB DIIKUTI):');
  lines.push('Sistem otomatis mematikan semua animasi dan behavior saat pengguna mengaktifkan "prefers-reduced-motion".');
  lines.push('Namun, AI tetap harus mengikuti aturan berikut:');
  lines.push('  - JANGAN gunakan animasi yang berkedip cepat (< 3Hz) — dapat memicu kejang.');
  lines.push('  - Gunakan animasi untuk memberi feedback (hover, entrance), bukan untuk dekorasi yang terus-menerus.');
  lines.push('  - Durasi transisi ideal: 150-300ms. Terlalu cepat = tidak terlihat, terlalu lambat = mengganggu.');
  lines.push('  - Pastikan konten tetap dapat diakses tanpa animasi (animasi adalah enhancement, bukan keharusan).');
  lines.push('');
  lines.push('PANDUAN KONTRAS (WAJIB DIIKUTI):');
  lines.push('Teks harus terbaca di atas background. Aturan kontras:');
  lines.push('  - Jika background GELAP (gradient gelap, #0e1c2f, #1a0a2e, dll): gunakan teks PUTIH (#ffffff) atau terang (#f8fafc).');
  lines.push('  - Jika background TERANG (#ffffff, #f9fafb, #f8fafc, dll): gunakan teks GELAP (#1f2937, #0e1c2f) atau kontrak palet.');
  lines.push('  - Jika background GRADIENT: pilih warna teks berdasarkan warna dominan (gelap→putih, terang→gelap).');
  lines.push('  - Untuk header.fontSize besar (>= 36px), pastikan rasio kontras >= 4.5:1 (WCAG AA).');
  lines.push('  - Jika ragu, gunakan putih (#ffffff) di background gelap, dan gelap (#1f2937) di background terang.');
  lines.push('Contoh benar: shell.background gelap → header.color #ffffff, chip.color #ffffff, button.color #ffffff.');
  lines.push('Contoh salah: shell.background gelap + header.color #1f2937 (tidak terbaca).');
  lines.push('');

  lines.push('## OUTPUT FORMAT');
  lines.push('Outputkan JSON valid dengan struktur:');
  lines.push('{');
  lines.push('  "version": 1,');
  lines.push('  "metadata": { "title": "...", "subject": "...", "grade": "...", "topic": "..." },');
  lines.push('  "styleIntent": { "styleId": "modern-clean" | "soft-classroom" | "mission-dark" },');
  lines.push('  "designSystem": {');
  lines.push('    "contractId": "modern-clean",');
  lines.push('    "paletteName": "...",');
  lines.push('    "typographyName": "...",');
  lines.push('    "overrides": {');
  lines.push('      "colors.primary": "#hex",       // optional: override warna utama');
  lines.push('      "colors.secondary": "#hex",     // optional: override warna sekunder');
  lines.push('      "colors.background": "#hex",    // optional: override warna latar');
  lines.push('      "typography.fontFamily": "...", // optional: override font (system font stack only, no Google Fonts)');
  lines.push('      "spacing.pagePadding": 48       // optional: override padding halaman');
  lines.push('    }');
  lines.push('  },');
  lines.push('');
  lines.push('## COLOR CONTRAST RULES (WCAG 2.1 COMPLIANT — WAJIB DIIKUTI)');
  lines.push('Anda TIDAK boleh menebak hex kontras secara visual. AI buta warna — ikuti aturan logika ini:');
  lines.push('');
  lines.push('Untuk DARK THEME (mis. mission-dark, palette.background gelap):');
  lines.push('  - background: VERY DARK (#0b1728, #0f172a, #121212, #1a1a2e)');
  lines.push('  - surface (panel): DARK juga (#1e293b, #182d45) — JANGAN pakai light cream (#fffdf7, #f8fafc)');
  lines.push('  - text: PUTIH atau near-white (#ffffff, #f8fafc, #f1f5f9)');
  lines.push('  - mutedText: abu terang (#94a3b8, #cbd5e1) — JANGAN abu gelap (#475569)');
  lines.push('  - Action buttons (primary/secondary/accent): VIBRANT high-contrast (Gold #ffd166, Amber #f59e0b, Cyan #38bdf8, Red #e63946)');
  lines.push('  - Button text: DARK jika button bg terang/vibrant (#0b1728), PUTIH jika button bg gelap');
  lines.push('  - border: rgba(255,255,255,0.09) — JANGAN #e5e7eb (terang)');
  lines.push('');
  lines.push('Untuk LIGHT THEME (mis. modern-clean, soft-classroom, palette.background terang):');
  lines.push('  - background: LIGHT (#ffffff, #f8f6f1, #fff8f0)');
  lines.push('  - surface (panel): LIGHT sedikit lebih gelap dari bg (#ffffff, #fbfaf7, #fff3e0)');
  lines.push('  - text: DARK navy/gray (#1f2533, #1f2937, #0b1728)');
  lines.push('  - mutedText: abu medium (#6b7280, #61758a) — JANGAN abu terang (#d1d5db)');
  lines.push('  - Action buttons: DISTINCT dark/saturated (#1d3557 navy, #1e5b8f blue, #e76f51 coral)');
  lines.push('  - Button text: PUTIH jika button bg gelap/saturated');
  lines.push('  - border: #e5e7eb, #e3ddcd — JANGAN rgba(255,255,255,0.09)');
  lines.push('');
  lines.push('ATURAN KHUSUS — KONTRAS MINIMUM (mesin akan auto-fix jika gagal):');
  lines.push('  - text vs background: minimum 4.5:1 (WCAG AA)');
  lines.push('  - mutedText vs background: minimum 4.5:1');
  lines.push('  - text vs surface (panel): minimum 4.5:1');
  lines.push('  - button text vs button bg: minimum 4.5:1');
  lines.push('  - border vs background: minimum 3.0:1');
  lines.push('Jika ragu, gunakan heuristik: bg gelap → text putih; bg terang → text gelap.');
  lines.push('');
  lines.push('## DESIGN SYSTEM OVERRIDES');
  lines.push('Field "designSystem.overrides" memungkinkan AI menyesuaikan style dari style pack dasar.');
  lines.push('Dua format didukung:');
  lines.push('  A. Flat key string: { "colors.primary": "#hex", "typography.fontFamily": "..." }');
  lines.push('  B. Structured object: { colors: { primary: "#hex" }, learning: { keyPointPanel: {...} } }');
  lines.push('Kategori yang didukung (structured form — lebih powerful):');
  lines.push('  - colors: primary, secondary, accent, background, surface, text, mutedText, border, success, warning, danger, gold');
  lines.push('    * accent: warna CTA/highlight (otomatis juga jadi secondary)');
  lines.push('    * gold: warna medal/reward/highlight premium (mis. #fbbf24)');
  lines.push('  - typography: fontFamily, fontSizeBase, lineHeightBase, heroFont, bodyFont, titleSize, subtitleSize, bodySize, smallSize, titleWeight, bodyWeight, lineHeight, letterSpacing, uppercase');
  lines.push('    * titleWeight: font-weight heading (default 700, premium 1000 untuk ultra-bold)');
  lines.push('    * letterSpacing: letter-spacing heading dalam em (default -0.01, premium -0.03 untuk rapat/tegas)');
  lines.push('    * uppercase: heading uppercase? (default false)');
  lines.push('    * heroFont/bodyFont: font family terpisah untuk heading/body (default = fontFamily)');
  lines.push('  - spacing: unit, scale, pagePadding, componentGap, cardPadding');
  lines.push('  - radius: default, small, medium, large');
  lines.push('    * large → card radius (mis. 22px untuk kartu chunky)');
  lines.push('    * medium → button radius (mis. 12px)');
  lines.push('    * small → chip/badge radius');
  lines.push('  - shadow: default, soft, medium, large');
  lines.push('  - learning: keyPointPanel, exampleCardStyle, explanationPanel, studentActionPanel, visualHintPanel');
  lines.push('  - game: briefingPanel, targetPanel, actionCardStyle, rewardBadge');
  lines.push('  - feedback: correct, wrong, neutral, warning');
  lines.push('  - quiz: questionPanel, answerCard');
  lines.push('Field panel (learning/game/feedback/quiz) pakai properti CSS-like: background, border, radius, padding, accentColor, iconColor, icon, color.');
  lines.push('Contoh flat:    { "colors.primary": "#8b5cf6", "typography.fontFamily": "Georgia, serif" }');
  lines.push('Contoh structured: { colors: { primary: "#1d3557" }, learning: { keyPointPanel: { background: "#1e293b", accentColor: "#fbbf24" } } }');
  lines.push('Batasan: fontFamily TIDAK boleh font dekoratif (Comic Sans, cursive, fantasy) atau font eksternal (Google Fonts).');
  lines.push('');
  lines.push('## CONTENT FIELD SHAPES (WAJIB DIIKUTI)');
  lines.push('Beberapa field di slot.content WAJIB berupa objek/array-of-objek, BUKAN string. Renderer membaca');
  lines.push('sub-field spesifik — jika AI kirim bentuk salah, renderer membaca undefined dan elemen kosong.');
  lines.push('Sistem auto-convert string ke objek sebagai fallback, tapi AI harus kirim bentuk yang benar:');
  lines.push('  - cover-hero.primaryAction: { label: "Masuki Misi", action: "next" }   // BUKAN string');
  lines.push('  - closing-award.finalAction: { label: "Lanjut Misi", action: "next" }  // BUKAN string');
  lines.push('  - learning-material.examples: [{ title: "...", body: "..." }, ...]      // BUKAN array of string');
  lines.push('  - branching-scenario.choices: [{ id: "a", label: "Jalan A", consequence: "...", isCorrect: false }, ...]');
  lines.push('');
  lines.push('## DYNAMIC LAYOUT (layout field di slot)');
  lines.push('AI bisa specify layout metadata di slot untuk control bagaimana konten di-arrange.');
  lines.push('Renderer baca field ini untuk tentukan grid columns, arrangement, region mapping.');
  lines.push('');
  lines.push('Field "layout" di slot:');
  lines.push('  - columns: number (1-6) — jumlah kolom horizontal. Default: 2');
  lines.push('  - arrangement: "split-left-right" | "stack-vertical" | "grid-3" | "grid-4" | "sidebar-left" | "sidebar-right"');
  lines.push('  - orientation: "horizontal" | "vertical"');
  lines.push('  - regions: { [elementKey]: "left" | "right" | "top" | "bottom" | "full" }');
  lines.push('    Element keys: explanation, examples, keyPoints, studentAction');
  lines.push('');
  lines.push('Contoh: AI mau 3 kolom horizontal untuk example cards:');
  lines.push('  "layout": { "columns": 3, "arrangement": "grid-3" }');
  lines.push('  → renderer pakai 3 kolom, example cards di-arrange horizontal 3 kolom');
  lines.push('');
  lines.push('Contoh: AI mau explanation di kiri, examples + keyPoints di kanan:');
  lines.push('  "layout": { "columns": 2, "regions": { "explanation": "left", "examples": "right", "keyPoints": "right" } }');
  lines.push('');
  lines.push('Contoh: AI mau sidebar kiri untuk navigation, konten utama di kanan:');
  lines.push('  "layout": { "arrangement": "sidebar-left" }');
  lines.push('');
  lines.push('Jika layout tidak di-set, renderer pakai default: 2 kolom (split left-right).');
  lines.push('');
  lines.push('## MASTER TEMPLATE (V2-PILAR-4)');
  lines.push('Master Template = MPI blueprint dengan struktur + style + layout, TANPA konten.');
  lines.push('Guru bisa save project sebagai Master, lalu clone untuk topik berbeda.');
  lines.push('');
  lines.push('Cara pakai:');
  lines.push('  1. Buat MPI dengan style + layout yang diinginkan');
  lines.push('  2. Berkas → Save as Master Template (strip konten, preserve struktur)');
  lines.push('  3. Buat → Clone dari Master Template (pilih master + topik baru)');
  lines.push('  4. MPI baru inherit style + layout dari Master, konten kosong');
  lines.push('');
  lines.push('Use case: Guru buat "Master Pancasila" dengan 5 misi + style mission-dark.');
  lines.push('Clone untuk Misi 1 (Sila Ketuhanan), Misi 2 (Sila Kemanusiaan), dst.');
  lines.push('Setiap clone dapat style + layout yang sama, hanya konten yang berbeda.');
  lines.push('');
  lines.push('## SINGLE-SLOT PER SCENE (BATASAN ENGINE)');
  lines.push('Mesin SILSE hanya membaca slots[0] per scene untuk konten utama. Slot setelah index 0 akan');
  lines.push('diabaikan diam-diam. Jika AI butuh menggabungkan beberapa informasi di satu scene, GABUNGKAN');
  lines.push('jadi satu field di content object, JANGAN pecah jadi 2 slot terpisah.');
  lines.push('');
  lines.push('  "flow": { "steps": [{ "sceneId": "..." }] },');
  lines.push('  "scenes": [');
  lines.push('    {');
  lines.push('      "id": "scene-1",');
  lines.push('      "role": "cover",');
  lines.push('      "sceneType": "cover-hero",');
  lines.push('      "title": "...",');
  lines.push('      "slots": [');
  lines.push('        {');
  lines.push('          "id": "slot-1",');
  lines.push('          "role": "title",');
  lines.push('          "placement": { "x": 140, "y": 280, "width": 1000, "height": 120 },');
  lines.push('          "designTokenKey": "card",');
  lines.push('          "content": { "kind": "text", "variant": "title", "text": "..." }');
  lines.push('        }');
  lines.push('      ]');
  lines.push('    }');
  lines.push('  ]');
  lines.push('}');
  lines.push('');

  lines.push('PENTING: Hanya outputkan JSON. Jangan tambahkan penjelasan, markdown, atau teks lain di luar JSON.');

  return lines.join('\n');
}
