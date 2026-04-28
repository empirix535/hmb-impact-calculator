import type {
  AltArm,
  ArmBreakdown,
  BiaInputs,
  BiaResult,
  MarketShares,
  ShiftResult,
} from "./types";

const ZERO_MS: MarketShares = { hIud: 0, ns: 0, surgical: 0, untreated: 0 };
const ALT_ARMS: AltArm[] = ["ns", "surgical", "untreated"];

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

/**
 * Compute MS₁ from a fixed baseline MS₀, a target H-IUD share, and
 * cannibalization weights δ across the alt arms (ns/surgical/untreated).
 *
 * The H-IUD delta (ΔH = targetHIud - ms0.hIud) is taken from the alt arms
 * proportionally to δ. If any alt arm would go below 0 (or above its
 * baseline when ΔH < 0 isn't relevant — only positive ΔH can clamp at 0),
 * that arm is clamped and its remaining share of the shift is re-allocated
 * proportionally across the remaining unclamped alt arms.
 */
export function computeShift(
  ms0: MarketShares,
  targetHIud: number,
  deltas: { ns: number; surgical: number; untreated: number },
): ShiftResult {
  const hIud = Math.max(0, Math.min(1, targetHIud));
  const deltaH = hIud - ms0.hIud;

  // Start from baseline alt shares.
  const alt: Record<AltArm, number> = {
    ns: ms0.ns,
    surgical: ms0.surgical,
    untreated: ms0.untreated,
  };

  const clamped: AltArm[] = [];
  let reallocated = false;
  let remainingShift = deltaH; // amount still to take from (positive) or give to (negative) alt arms
  // Working weights (mutable copy of normalized δ over unclamped arms)
  const activeWeights: Record<AltArm, number> = { ...deltas };

  // Iterative re-allocation. At most 3 passes (one per alt arm).
  for (let iter = 0; iter < 4 && Math.abs(remainingShift) > 1e-12; iter++) {
    const active = ALT_ARMS.filter((a) => !clamped.includes(a));
    if (active.length === 0) break;
    const wSum = active.reduce((s, a) => s + activeWeights[a], 0);
    // If all weights are zero, distribute equally.
    const newClamps: AltArm[] = [];
    let absorbed = 0;
    for (const a of active) {
      const w = wSum <= 1e-12 ? 1 / active.length : activeWeights[a] / wSum;
      const take = remainingShift * w; // amount removed from arm a
      let next = alt[a] - take;
      if (next < 0) {
        // Clamp to zero, only absorb what's available.
        absorbed += alt[a];
        next = 0;
        newClamps.push(a);
      } else if (next > 1) {
        // Shouldn't happen for sane inputs, but clamp to 1.
        absorbed += alt[a] - 1;
        next = 1;
        newClamps.push(a);
      } else {
        absorbed += take;
      }
      alt[a] = next;
    }
    remainingShift -= absorbed;
    if (newClamps.length === 0) break;
    reallocated = true;
    clamped.push(...newClamps);
  }

  const marketShares1: MarketShares = {
    hIud,
    ns: alt.ns,
    surgical: alt.surgical,
    untreated: alt.untreated,
  };

  const sum = marketShares1.hIud + marketShares1.ns + marketShares1.surgical + marketShares1.untreated;
  // Achievable H-IUD: if not all shift could be absorbed, reduce hIud accordingly.
  const achievableHIud = hIud - remainingShift;
  const feasible = Math.abs(sum - 1) < 0.005 && Math.abs(remainingShift) < 1e-6;

  return {
    marketShares1,
    clampedArms: clamped,
    reallocated,
    feasible,
    achievableHIud,
  };
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
  // Anchor Status Quo to the raw observed prevalence input.
  // Intervention prevalence shifts relative to the change in treatment failure rate.
  const hmbPrevalenceSq = inputs.hmbPrevalence;
  const failSq = 1 - weightedEffSq;
  const failInt = 1 - weightedEffInt;
  const hmbPrevalenceInt =
    failSq > 1e-12 ? inputs.hmbPrevalence * (failInt / failSq) : inputs.hmbPrevalence;

  const hmbCasesAverted = population * (weightedEffInt - weightedEffSq);
  const anemiaCasesAverted = population * (weightedAnemiaSq - weightedAnemiaInt);

  // DALYs averted via shift to H-IUD from each alt arm
  const dH = inputs.dalys.hIud;
  const dalysAvertedByArm = {
    ns: Math.max(0, ms0.ns - ms1.ns) * (inputs.dalys.ns - dH) * population,
    surgical: Math.max(0, ms0.surgical - ms1.surgical) * (inputs.dalys.surgical - dH) * population,
    untreated:
      Math.max(0, ms0.untreated - ms1.untreated) * (inputs.dalys.untreated - dH) * population,
  };
  const dalysAverted =
    dalysAvertedByArm.ns + dalysAvertedByArm.surgical + dalysAvertedByArm.untreated;

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
    hmbPrevalenceSq,
    hmbPrevalenceInt,
    hmbCasesAverted,
    anemiaCasesAverted,
    breakdown,
  };
}
