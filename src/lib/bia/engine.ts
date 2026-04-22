import type {
  ArmBreakdown,
  BiaInputs,
  BiaResult,
  MarketShares,
  ShiftResult,
} from "./types";

const ZERO_MS: MarketShares = { hIud: 0, ns: 0, surgical: 0, untreated: 0 };

function weightedSum(
  ms: MarketShares,
  vals: { hIud: number; ns: number; surgical: number; untreated: number },
) {
  return (
    ms.hIud * vals.hIud +
    ms.ns * vals.ns +
    ms.surgical * vals.surgical +
    ms.untreated * vals.untreated
  );
}

export function runBia(inputs: BiaInputs): BiaResult {
  const population = Math.round(inputs.wcba * inputs.hmbPrevalence);
  const ms0 = inputs.marketShares0 ?? ZERO_MS;
  const ms1 = inputs.marketShares1 ?? ms0;

  const sum1 = ms1.hIud + ms1.ns + ms1.surgical + ms1.untreated;
  const feasible = Math.abs(sum1 - 1) < 0.005;

  const shift: ShiftResult = {
    marketShares1: ms1,
    clampedArms: [],
    reallocated: false,
    feasible,
    achievableHIud: ms1.hIud,
  };

  const perPatientSq = weightedSum(ms0, inputs.costs);
  const perPatientInt = weightedSum(ms1, inputs.costs);
  const totalCostSq = population * perPatientSq;
  const totalCostInt = population * perPatientInt;
  const budgetImpact = totalCostInt - totalCostSq;
  const budgetImpactPct = totalCostSq > 0 ? budgetImpact / totalCostSq : 0;

  const weightedEffSq = weightedSum(ms0, inputs.effectiveness);
  const weightedEffInt = weightedSum(ms1, inputs.effectiveness);
  const weightedAnemiaSq = weightedSum(ms0, inputs.anemia);
  const weightedAnemiaInt = weightedSum(ms1, inputs.anemia);

  const hmbCasesAverted = population * (weightedEffInt - weightedEffSq);
  const anemiaCasesAverted = population * (weightedAnemiaSq - weightedAnemiaInt);

  const armKeys = ["hIud", "ns", "surgical", "untreated"] as const;
  const breakdown: ArmBreakdown[] = armKeys.map((arm) => {
    const m0 = ms0[arm];
    const m1 = ms1[arm];
    const dM = m1 - m0;
    const c0 = population * m0 * inputs.costs[arm];
    const c1 = population * m1 * inputs.costs[arm];
    return {
      arm,
      ms0: m0,
      ms1: m1,
      deltaMs: dM,
      patientsShifted: population * dM,
      cost0: c0,
      cost1: c1,
      deltaCost: c1 - c0,
      status: "—",
    };
  });

  return {
    population,
    shift,
    totalCostSq,
    totalCostInt,
    perPatientSq,
    perPatientInt,
    budgetImpact,
    budgetImpactPct,
    weightedEffSq,
    weightedEffInt,
    weightedAnemiaSq,
    weightedAnemiaInt,
    hmbCasesAverted,
    anemiaCasesAverted,
    breakdown,
  };
}
