import type { ArmValues, AltWeights } from "./types";

// Kenya-specific 5-year cumulative per-patient costs (USD) by arm
export const DEFAULT_COSTS: ArmValues = {
  hIud: 24_353,
  ns: 47_096,
  surgical: 70_094,
  untreated: 15_074,
};

// Global 5-year HMB resolution rate (effectiveness) — fixed scalars
export const DEFAULT_EFFECTIVENESS: ArmValues = {
  hIud: 0.6422,
  ns: 0.1096,
  surgical: 0.7663,
  untreated: 0.0,
};

// Global 5-year cumulative DALYs per patient by arm — fixed scalars
export const DEFAULT_DALYS: ArmValues = {
  hIud: 0.0503,
  ns: 0.2122,
  surgical: 0.0419,
  untreated: 0.2805,
};

// Default cannibalization weights (sum to 1)
export const DEFAULT_DELTAS: AltWeights = {
  ns: 0.5,
  surgical: 0.05,
  untreated: 0.45,
};

export const DEFAULT_TARGET_HIUD = 0.25;
