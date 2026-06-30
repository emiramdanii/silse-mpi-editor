/**
 * AI Prompt Contract Types (APP-AI-PROMPT-CONTRACT-01).
 *
 * Layer: core/ai-prompt-contract (pure types, no React/DOM)
 * Allowed imports: none
 *
 * Kontrak:
 *   Type definitions untuk prompt yang app berikan ke AI. App memberi kontrak:
 *   sceneType yang tersedia, slot yang wajib, style token yang tersedia,
 *   layout format, card/button/badge variants, quiz/game/reward format,
 *   larangan HTML/CSS bebas.
 */

export type PromptContractSceneType = {
  id: string;
  role: string;
  description: string;
  requiredSlots: string[];
  optionalSlots: string[];
};

export type PromptContractSlotKind =
  | 'text'
  | 'card'
  | 'image'
  | 'button'
  | 'badge'
  | 'game-mission'
  | 'quiz-question'
  | 'learning-material'
  | 'feedback'
  | 'reward'
  | 'navigation';

export type PromptContractSlot = {
  role: string;
  kind: PromptContractSlotKind;
  required: boolean;
  description: string;
};

export type PromptContractStyleToken = {
  category: string;
  tokens: string[];
};

export type PromptContractVariant = {
  component: string; // "card" | "button" | "badge"
  variants: string[];
};

export type PromptContractLayoutFormat = {
  id: string;
  description: string;
  slots: string[];
};

export type MpiPromptContract = {
  /** Frame spec yang AI harus ikuti. */
  frame: { width: number; height: number; aspectRatio: string };
  /** Scene types yang tersedia. */
  sceneTypes: PromptContractSceneType[];
  /** Slot kinds yang tersedia. */
  slotKinds: PromptContractSlotKind[];
  /** Style token categories yang tersedia. */
  styleTokens: PromptContractStyleToken[];
  /** Card/button/badge variants yang allowed. */
  allowedVariants: PromptContractVariant[];
  /** Layout formats yang tersedia. */
  layoutFormats: PromptContractLayoutFormat[];
  /** Larangan keras. */
  prohibitions: string[];
  /** Aturan output. */
  outputRules: string[];
};
