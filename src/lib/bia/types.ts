export type Arm = "hIud" | "ns" | "surgical" | "untreated";
export type AltArm = "ns" | "surgical" | "untreated";

export interface MarketShares {
  hIud: number;
  ns: number;
  surgical: number;
  untreated: number;
}

export interface AltWeights {
  ns: number;
  surgical: number;
  untreated: number;
}

export interface ArmValues {
  hIud: number;
  ns: number;
  surgical: number;
  untreated: number;
}

export type Currency = "LCU" | "USD";

export interface CountryPreset {
  name: string;
  currencyCode: string; // ISO label for LCU, e.g. "KES"
  usdPerLcu: number; // FX multiplier: USD = LCU * usdPerLcu
  wcba: number;
  hmbPrevalence: number; // 0..1
  anemia: ArmValues; // 0..1
  marketShares?: MarketShares; // 0..1, sum = 1
}

export interface BiaInputs {
  wcba: number;
  hmbPrevalence: number;
  marketShares0: MarketShares;
  targetHIud: number; // 0..1
  deltas: AltWeights; // sum = 1
  costs: ArmValues;
  effectiveness: ArmValues; // 0..1 (HMB resolved share)
  anemia: ArmValues; // 0..1
}

export interface ShiftResult {
  marketShares1: MarketShares;
  clampedArms: AltArm[];
  reallocated: boolean;
  feasible: boolean;
  achievableHIud: number;
}

export interface ArmBreakdown {
  arm: Arm;
  ms0: number;
  ms1: number;
  deltaMs: number;
  patientsShifted: number;
  cost0: number;
  cost1: number;
  deltaCost: number;
  status: "—" | "Re-allocated" | "Clamped to 0%";
}

export interface BiaResult {
  population: number;
  shift: ShiftResult;
  totalCostSq: number;
  totalCostInt: number;
  perPatientSq: number;
  perPatientInt: number;
  budgetImpact: number;
  budgetImpactPct: number;
  weightedEffSq: number;
  weightedEffInt: number;
  weightedAnemiaSq: number;
  weightedAnemiaInt: number;
  hmbCasesAverted: number;
  anemiaCasesAverted: number;
  breakdown: ArmBreakdown[];
}
