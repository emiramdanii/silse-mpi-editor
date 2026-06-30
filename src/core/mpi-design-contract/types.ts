/**
 * MPI Design Contract Types (MPI-DESIGN-CONTRACT-01).
 *
 * Layer: core/mpi-design-contract (pure types, no React/DOM)
 * Allowed imports: none (only TypeScript built-ins)
 *
 * Kontrak:
 *   Type definitions untuk semua bagian style/layout yang bisa dikontrol AI JSON.
 *   16 design token categories: frame, palette, background, typography, layout,
 *   card, button, badge, image, navigation, quiz, game, feedback, reward, map,
 *   motion.
 *
 *   Prinsip:
 *     - AI hanya boleh memilih token/preset yang tersedia.
 *     - Tidak ada CSS bebas dari AI.
 *     - Tidak ada HTML bebas dari AI.
 *     - Semua visual harus masuk contract.
 *     - Pure types, no runtime code.
 */

// ---------------------------------------------------------------------------
// 1. Frame / Stage
// ---------------------------------------------------------------------------

export type DesignFrame = {
  width: number;
  height: number;
  aspectRatio: string; // e.g. "16/9"
  safeArea: { top: number; right: number; bottom: number; left: number };
  stageRadius: number;
  overflow: 'hidden' | 'visible' | 'scroll';
  exportScale: number; // e.g. 1, 2 for retina
};

// ---------------------------------------------------------------------------
// 2. Palette
// ---------------------------------------------------------------------------

export type DesignPalette = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  mutedText: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  gold: string; // reward/gold
};

// ---------------------------------------------------------------------------
// 3. Background
// ---------------------------------------------------------------------------

export type DesignBackgroundPattern =
  | 'none'
  | 'solid'
  | 'gradient-linear'
  | 'gradient-radial'
  | 'gradient-conic'
  | 'image'
  | 'pattern-grid'
  | 'pattern-dots'
  | 'pattern-glow'
  | 'overlay'
  | 'decorative-shapes';

export type DesignBackground = {
  pattern: DesignBackgroundPattern;
  color?: string;
  gradient?: string; // CSS gradient string
  imageSrc?: string;
  overlay?: string; // CSS overlay (e.g. "rgba(0,0,0,0.3)")
  glow?: { color: string; position: string; size: string };
};

// ---------------------------------------------------------------------------
// 4. Typography
// ---------------------------------------------------------------------------

export type DesignTypography = {
  heroFont: string;
  bodyFont: string;
  titleSize: number;
  subtitleSize: number;
  bodySize: number;
  labelSize: number;
  titleWeight: number;
  bodyWeight: number;
  lineHeight: number;
  letterSpacing: number; // in em
  uppercase: boolean;
  textShadow?: string;
};

// ---------------------------------------------------------------------------
// 5. Layout / Placement
// ---------------------------------------------------------------------------

export type DesignLayoutPlacement = {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  slot?: string; // slot role identifier
  anchor?: 'top-left' | 'top-center' | 'top-right' | 'center' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  align?: 'left' | 'center' | 'right';
  gap?: number;
  grid?: { templateColumns: string; templateRows: string };
};

// ---------------------------------------------------------------------------
// 6. Card
// ---------------------------------------------------------------------------

export type DesignCard = {
  background: string;
  radius: number;
  padding: number;
  border: string; // CSS border string
  shadow: string; // CSS box-shadow string
  titleStyle?: { fontSize: number; fontWeight: number; color: string };
  bodyStyle?: { fontSize: number; lineHeight: number; color: string };
  accentStrip?: { color: string; width: number; position: 'left' | 'top' | 'right' | 'bottom' };
  iconCorner?: { icon: string; position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' };
  glassEffect: boolean;
};

// ---------------------------------------------------------------------------
// 7. Button
// ---------------------------------------------------------------------------

export type DesignButtonVariant = 'primary' | 'secondary' | 'ghost' | 'mission' | 'gold';

export type DesignButton = {
  variant: DesignButtonVariant;
  background: string;
  color: string;
  radius: number;
  padding: { top: number; right: number; bottom: number; left: number };
  fontWeight: number;
  shadow: string;
  hover?: { transform?: string; boxShadow?: string };
  active?: { transform?: string };
  disabled?: { opacity: number };
  iconPosition?: 'left' | 'right' | 'none';
};

// ---------------------------------------------------------------------------
// 8. Badge / Pill / Label
// ---------------------------------------------------------------------------

export type DesignBadge = {
  background: string;
  color: string;
  radius: number;
  icon?: string;
  border: string;
  size: 'sm' | 'md' | 'lg';
  placement?: 'top-left' | 'top-right' | 'inline' | 'top-center';
};

// ---------------------------------------------------------------------------
// 9. Image / Art Slot
// ---------------------------------------------------------------------------

export type DesignImageSlot = {
  src: string;
  objectFit: 'cover' | 'contain';
  maskRadius?: number;
  opacity: number;
  slot?: string;
  decorativeArt?: boolean;
  visualAnchor?: string;
};

// ---------------------------------------------------------------------------
// 10. Navigation
// ---------------------------------------------------------------------------

export type DesignNavigation = {
  nextButton?: Partial<DesignButton>;
  prevButton?: Partial<DesignButton>;
  menuButton?: Partial<DesignButton>;
  pageIndicator?: { style: 'pills' | 'dots' | 'text'; color: string; activeColor: string };
  progressPill?: { background: string; activeBackground: string };
  toolbarStyle?: 'floating-glass' | 'solid' | 'minimal';
};

// ---------------------------------------------------------------------------
// 11. Quiz
// ---------------------------------------------------------------------------

export type DesignQuiz = {
  questionPanel?: Partial<DesignCard>;
  answerCard?: Partial<DesignCard>;
  choiceLetterBadge?: { background: string; color: string; radius: number; size: number };
  selectedState?: { background: string; borderColor: string };
  correctState?: { background: string; borderColor: string };
  wrongState?: { background: string; borderColor: string };
  feedbackBox?: Partial<DesignCard> & { iconCorrect?: string; iconWrong?: string };
  scoreDisplay?: { background: string; color: string; radius: number };
};

// ---------------------------------------------------------------------------
// 12. Game
// ---------------------------------------------------------------------------

export type DesignGame = {
  briefingPanel?: Partial<DesignCard>;
  targetPanel?: Partial<DesignCard>;
  actionCardGrid?: { columns: string; gap: number };
  actionCardStyle?: Partial<DesignCard>;
  selectedAction?: { background: string; borderColor: string };
  correctState?: { background: string; borderColor: string };
  wrongState?: { background: string; borderColor: string };
  feedbackPanel?: Partial<DesignCard>;
  rewardBadge?: { background: string; color: string; radius: number; icon: string };
  missionProgress?: { style: 'pills' | 'bar' | 'text'; color: string };
};

// ---------------------------------------------------------------------------
// 12b. Learning (MATERIAL-SCENE-PROOF-01 + FOUNDATION-HARDENING-01)
// ---------------------------------------------------------------------------

export type DesignLearning = {
  keyPointPanel?: Partial<DesignCard> & { accentColor: string; iconColor: string; icon: string };
  studentActionPanel?: Partial<DesignCard> & { iconColor: string; icon: string; labelColor: string };
  visualHintPanel?: { color: string; fontStyle: 'normal' | 'italic'; icon: string };
  explanationPanel?: Partial<DesignCard>;
  exampleCardStyle?: Partial<DesignCard>;
  exampleGridColumns?: string;
};

// ---------------------------------------------------------------------------
// 13. Feedback
// ---------------------------------------------------------------------------

export type DesignFeedbackVariant = 'correct' | 'wrong' | 'neutral' | 'warning';

export type DesignFeedback = {
  variant: DesignFeedbackVariant;
  icon?: string;
  color: string;
  background: string;
  borderColor: string;
  motionPreset?: DesignMotionPreset;
};

// ---------------------------------------------------------------------------
// 14. Reward / Closing
// ---------------------------------------------------------------------------

export type DesignReward = {
  medal?: { background: string; borderColor: string; radius: number; size: number; icon: string };
  badge?: Partial<DesignBadge>;
  ribbon?: { background: string; color: string; radius: number };
  certificatePanel?: Partial<DesignCard>;
  completionMessage?: { fontSize: number; fontWeight: number; color: string };
  reflectionCard?: Partial<DesignCard>;
};

// ---------------------------------------------------------------------------
// 15. Map / Hotspot
// ---------------------------------------------------------------------------

export type DesignMapHotspot = {
  mapBackground?: string;
  hotspotPosition?: { x: number; y: number }; // percentage
  hotspotColor: string;
  hotspotLabel?: string;
  activeState?: { borderColor: string; boxShadow: string };
  completedState?: { background: string; icon: string };
  tooltipCard?: Partial<DesignCard>;
};

// ---------------------------------------------------------------------------
// 16. Motion
// ---------------------------------------------------------------------------

export type DesignMotionPreset =
  | 'none'
  | 'soft-fade'
  | 'slide-up'
  | 'pulse'
  | 'reward-pop'
  | 'correct-burst';

// ---------------------------------------------------------------------------
// Design Contract (root)
// ---------------------------------------------------------------------------

export type DesignContractId = 'default' | 'modern-clean' | 'soft-classroom' | 'mission-dark' | string;

export type MpiDesignContract = {
  id: DesignContractId;
  name: string;
  description?: string;
  frame: DesignFrame;
  palette: DesignPalette;
  background: DesignBackground;
  typography: DesignTypography;
  card: DesignCard;
  button: Record<DesignButtonVariant, DesignButton>;
  badge: DesignBadge;
  navigation: DesignNavigation;
  quiz: DesignQuiz;
  game: DesignGame;
  learning: DesignLearning;
  feedback: Record<DesignFeedbackVariant, DesignFeedback>;
  reward: DesignReward;
  mapHotspot?: DesignMapHotspot;
  motion: Record<DesignMotionPreset, { animation?: string; duration?: number; easing?: string }>;
};
