import type { ArmValues, AltWeights } from "./types";

// 5-year cumulative per-patient costs (USD) by arm
export const DEFAULT_COSTS: ArmValues = {
  hIud: 1850,
  ns: 1200,
  surgical: 6800,
  untreated: 950,
};

// 5-year cumulative HMB resolution rate (effectiveness)
export const DEFAULT_EFFECTIVENESS: ArmValues = {
  hIud: 0.79,
  ns: 0.45,
  surgical: 0.91,
  untreated: 0.12,
};

// Default cannibalization weights (sum to 1)
export const DEFAULT_DELTAS: AltWeights = {
  ns: 0.5,
  surgical: 0.05,
  untreated: 0.45,
};

export const DEFAULT_TARGET_HIUD = 0.25;
