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
  lines.push('## DESIGN SYSTEM OVERRIDES');
  lines.push('Field "designSystem.overrides" memungkinkan AI menyesuaikan style dari style pack dasar.');
  lines.push('Format key: "category.tokenName". Kategori yang didukung:');
  lines.push('  - colors: primary, secondary, background, surface, text, mutedText, border, success, warning, danger');
  lines.push('  - typography: fontFamily, titleSize, subtitleSize, bodySize, smallSize, lineHeight');
  lines.push('  - spacing: pagePadding, componentGap, cardPadding');
  lines.push('  - radius: small, medium, large');
  lines.push('  - shadow: none, soft, medium');
  lines.push('Contoh: { "colors.primary": "#8b5cf6", "typography.fontFamily": "Georgia, serif" }');
  lines.push('Batasan: fontFamily TIDAK boleh font dekoratif (Comic Sans, cursive, fantasy) atau font eksternal (Google Fonts).');
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
