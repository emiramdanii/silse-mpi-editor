/**
 * Default Design Contract (MPI-DESIGN-CONTRACT-01).
 *
 * Layer: core/mpi-design-contract (pure data, no React/DOM)
 * Allowed imports: ./types
 *
 * Kontrak:
 *   Default design contract dengan token reasonable untuk semua 16 categories.
 *   Tidak ada CSS premium baru. Hanya data token yang renderer bisa baca.
 */

import type { MpiDesignContract, DesignContractId } from './types';

// ---------------------------------------------------------------------------
// Default contract
// ---------------------------------------------------------------------------

export const DEFAULT_DESIGN_CONTRACT_ID: DesignContractId = 'default';

export const DEFAULT_DESIGN_CONTRACT: MpiDesignContract = {
  id: 'default',
  name: 'Default Design Contract',
  description: 'Reasonable defaults for all 16 design token categories. No premium polish.',

  frame: {
    width: 1280,
    height: 720,
    aspectRatio: '16/9',
    safeArea: { top: 60, right: 32, bottom: 32, left: 32 },
    stageRadius: 16,
    overflow: 'hidden',
    exportScale: 1,
  },

  palette: {
    primary: '#1d3557',
    secondary: '#457b9d',
    accent: '#e63946',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1f2937',
    mutedText: '#6b7280',
    border: '#e5e7eb',
    success: '#16a34a',
    warning: '#f59e0b',
    danger: '#dc2626',
    gold: '#fbbf24',
  },

  background: {
    pattern: 'solid',
    color: '#ffffff',
  },

  typography: {
    heroFont: "'Trebuchet MS', 'Segoe UI', Arial, sans-serif",
    bodyFont: "'Segoe UI', Arial, Helvetica, sans-serif",
    titleSize: 48,
    subtitleSize: 20,
    bodySize: 16,
    labelSize: 13,
    titleWeight: 700,
    bodyWeight: 400,
    lineHeight: 1.5,
    letterSpacing: -0.01,
    uppercase: false,
  },

  card: {
    background: '#ffffff',
    radius: 12,
    padding: 16,
    border: '1px solid #e5e7eb',
    shadow: '0 2px 8px rgba(0,0,0,0.06)',
    glassEffect: false,
  },

  button: {
    primary: {
      variant: 'primary',
      background: '#1d3557',
      color: '#ffffff',
      radius: 8,
      padding: { top: 10, right: 20, bottom: 10, left: 20 },
      fontWeight: 600,
      shadow: '0 1px 2px rgba(0,0,0,0.1)',
      hover: { transform: 'translateY(-1px)' },
      active: { transform: 'translateY(0)' },
      disabled: { opacity: 0.5 },
      iconPosition: 'right',
    },
    secondary: {
      variant: 'secondary',
      background: '#f1f5f9',
      color: '#1d3557',
      radius: 8,
      padding: { top: 10, right: 20, bottom: 10, left: 20 },
      fontWeight: 600,
      shadow: 'none',
      iconPosition: 'left',
    },
    ghost: {
      variant: 'ghost',
      background: 'transparent',
      color: '#1d3557',
      radius: 8,
      padding: { top: 8, right: 16, bottom: 8, left: 16 },
      fontWeight: 500,
      shadow: 'none',
      iconPosition: 'none',
    },
    mission: {
      variant: 'mission',
      background: '#1d3557',
      color: '#ffffff',
      radius: 6,
      padding: { top: 10, right: 20, bottom: 10, left: 20 },
      fontWeight: 700,
      shadow: '0 0 12px rgba(29,53,87,0.3)',
      iconPosition: 'right',
    },
    gold: {
      variant: 'gold',
      background: '#fbbf24',
      color: '#1d3557',
      radius: 999,
      padding: { top: 8, right: 18, bottom: 8, left: 18 },
      fontWeight: 700,
      shadow: '0 2px 6px rgba(251,191,36,0.3)',
      iconPosition: 'left',
    },
  },

  badge: {
    background: '#fbbf24',
    color: '#1d3557',
    radius: 999,
    border: 'none',
    size: 'md',
    placement: 'inline',
  },

  navigation: {
    toolbarStyle: 'floating-glass',
    pageIndicator: { style: 'pills', color: '#6b7280', activeColor: '#1d3557' },
    progressPill: { background: '#e5e7eb', activeBackground: '#1d3557' },
  },

  quiz: {
    choiceLetterBadge: { background: '#1d3557', color: '#ffffff', radius: 8, size: 32 },
    selectedState: { background: '#dbeafe', borderColor: '#2563eb' },
    correctState: { background: '#d1fae5', borderColor: '#16a34a' },
    wrongState: { background: '#fee2e2', borderColor: '#dc2626' },
    scoreDisplay: { background: '#fbbf24', color: '#1d3557', radius: 999 },
  },

  game: {
    briefingPanel: { background: '#fffbeb', radius: 10, padding: 12, border: '1px solid #fde68a', shadow: 'none', glassEffect: false },
    targetPanel: { background: '#eff6ff', radius: 10, padding: 12, border: '1px solid #bfdbfe', shadow: 'none', glassEffect: false },
    actionCardGrid: { columns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 },
    actionCardStyle: { background: '#ffffff', radius: 12, padding: 14, border: '2px solid #d1d5db', shadow: 'none', glassEffect: false },
    selectedAction: { background: '#dbeafe', borderColor: '#2563eb' },
    correctState: { background: '#d1fae5', borderColor: '#16a34a' },
    wrongState: { background: '#fee2e2', borderColor: '#dc2626' },
    feedbackPanel: { background: '#f8fafc', radius: 10, padding: 12, border: '1px solid #e5e7eb', shadow: 'none', glassEffect: false },
    rewardBadge: { background: '#fffbeb', color: '#92400e', radius: 12, icon: '🏅' },
    missionProgress: { style: 'pills', color: '#6b7280' },
  },

  learning: {
    explanationPanel: { background: '#ffffff', radius: 12, padding: 16, border: '1px solid #e5e7eb', shadow: 'none', glassEffect: false },
    exampleCardStyle: { background: '#f8fafc', radius: 12, padding: 16, border: '1px solid #e5e7eb', shadow: 'none', glassEffect: false },
    exampleGridColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    keyPointPanel: { background: '#fffbeb', radius: 10, padding: 12, border: '1px solid #fde68a', accentColor: '#f59e0b', iconColor: '#92400e', icon: '🔑', glassEffect: false, shadow: 'none' },
    studentActionPanel: { background: '#f8fafc', radius: 10, padding: 12, border: '2px solid #1d3557', icon: '✏️', iconColor: '#1d3557', labelColor: '#6b7280', glassEffect: false, shadow: 'none' },
    visualHintPanel: { color: '#6b7280', fontStyle: 'italic', icon: '💡' },
  },

  feedback: {
    correct: { variant: 'correct', icon: '✓', color: '#065f46', background: '#d1fae5', borderColor: '#16a34a', motionPreset: 'correct-burst' },
    wrong: { variant: 'wrong', icon: '✗', color: '#991b1b', background: '#fee2e2', borderColor: '#dc2626', motionPreset: 'none' },
    neutral: { variant: 'neutral', icon: '•', color: '#1f2937', background: '#f3f4f6', borderColor: '#d1d5db', motionPreset: 'none' },
    warning: { variant: 'warning', icon: '!', color: '#92400e', background: '#fef3c7', borderColor: '#f59e0b', motionPreset: 'none' },
  },

  reward: {
    medal: { background: 'linear-gradient(145deg, #fff8e7, #fff)', borderColor: '#fbbf24', radius: 999, size: 200, icon: '🏆' },
    ribbon: { background: '#e63946', color: '#ffffff', radius: 999 },
    certificatePanel: { background: '#ffffff', radius: 16, padding: 24, border: '2px solid #fbbf24', shadow: '0 4px 12px rgba(0,0,0,0.1)', glassEffect: false },
    completionMessage: { fontSize: 24, fontWeight: 700, color: '#1d3557' },
  },

  mapHotspot: {
    mapBackground: '#f0f9ff',
    hotspotColor: '#1d3557',
    activeState: { borderColor: '#e63946', boxShadow: '0 0 0 4px rgba(230,57,70,0.2)' },
    completedState: { background: '#d1fae5', icon: '✓' },
  },

  motion: {
    none: { animation: 'none', duration: 0, easing: 'ease' },
    'soft-fade': { animation: 'silse-fade-in', duration: 220, easing: 'ease-out' },
    'slide-up': { animation: 'silse-slide-up', duration: 260, easing: 'ease-out' },
    'pulse': { animation: 'silse-pulse', duration: 2000, easing: 'ease-in-out' },
    'reward-pop': { animation: 'silse-reward-pop', duration: 400, easing: 'ease-out' },
    'correct-burst': { animation: 'silse-correct-burst', duration: 600, easing: 'ease-out' },
  },
};

// ---------------------------------------------------------------------------
// Contract registry (3 style packs + default)
// ---------------------------------------------------------------------------

export const DESIGN_CONTRACTS: Record<DesignContractId, MpiDesignContract> = {
  default: DEFAULT_DESIGN_CONTRACT,
  'modern-clean': {
    ...DEFAULT_DESIGN_CONTRACT,
    id: 'modern-clean',
    name: 'Modern Clean',
    description: 'Navy + crimson + gold. Clean professional.',
    palette: {
      ...DEFAULT_DESIGN_CONTRACT.palette,
      primary: '#1d3557',
      secondary: '#457b9d',
      accent: '#e63946',
      gold: '#fbbf24',
    },
  },
  'soft-classroom': {
    ...DEFAULT_DESIGN_CONTRACT,
    id: 'soft-classroom',
    name: 'Soft Classroom',
    description: 'Cream + warm peach + honey gold. Warm friendly.',
    palette: {
      ...DEFAULT_DESIGN_CONTRACT.palette,
      primary: '#7a5a3f',
      secondary: '#f4a261',
      accent: '#e76f51',
      background: '#fff8f0',
      surface: '#fff3e0',
      gold: '#ffd166',
    },
  },
  'mission-dark': {
    ...DEFAULT_DESIGN_CONTRACT,
    id: 'mission-dark',
    name: 'Mission Dark',
    description: 'Deep navy + signal red + gold. Mission serious.',
    palette: {
      ...DEFAULT_DESIGN_CONTRACT.palette,
      primary: '#0d243d',
      secondary: '#1d3557',
      accent: '#e63946',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      mutedText: '#94a3b8',
      gold: '#fbbf24',
    },
  },
};

export function getDesignContract(id?: DesignContractId): MpiDesignContract {
  if (!id) return DEFAULT_DESIGN_CONTRACT;
  return DESIGN_CONTRACTS[id] ?? DEFAULT_DESIGN_CONTRACT;
}
