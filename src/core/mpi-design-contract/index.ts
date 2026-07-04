/**
 * MPI Design Contract module — public API (MPI-DESIGN-CONTRACT-01).
 */

export type {
  MpiDesignContract,
  DesignContractId,
  DesignFrame,
  DesignPalette,
  DesignBackground,
  DesignBackgroundPattern,
  DesignTypography,
  DesignLayoutPlacement,
  DesignCard,
  DesignButton,
  DesignButtonVariant,
  DesignBadge,
  DesignImageSlot,
  DesignNavigation,
  DesignQuiz,
  DesignGame,
  DesignFeedback,
  DesignFeedbackVariant,
  DesignReward,
  DesignMapHotspot,
  DesignMotionPreset,
} from './types';

export {
  DEFAULT_DESIGN_CONTRACT,
  DEFAULT_DESIGN_CONTRACT_ID,
  DESIGN_CONTRACTS,
  getDesignContract,
  getDesignContractWithProjectStyle,
} from './defaultDesignContract';

export {
  validateDesignContract,
  isValidDesignContract,
  assertValidDesignContract,
  type DesignContractValidationError,
} from './validateDesignContract';
