import type {
  AltArm,
  AltWeights,
  ArmBreakdown,
  BiaInputs,
  BiaResult,
  MarketShares,
  ShiftResult,
} from "./types";

const ALT_ARMS: AltArm[] = ["ns", "surgical", "untreated"];
const EPS = 1e-9;

export function normalizeDeltas(d: AltWeights): AltWeights {
  const sum = d.ns + d.surgical + d.untreated;
  if (sum <= EPS) return { ns: 1 / 3, surgical: 1 / 3, untreated: 1 / 3 };
  return { ns: d.ns / sum, surgical: d.surgical / sum, untreated: d.untreated / sum };
}

export function computeShift(
  ms0: MarketShares,
  targetHIud: number,
  deltas: AltWeights,
): ShiftResult {
  const clampedTarget = Math.max(0, Math.min(1, targetHIud));
  const deltaH = clampedTarget - ms0.hIud;

  // No uplift => leave alt arms as-is
  if (deltaH <= EPS) {
    return {
      marketShares1: { ...ms0, hIud: clampedTarget },
      clampedArms: [],
      reallocated: false,
      feasible: true,
      achievableHIud: clampedTarget,
    };
  }

  const current: Record<AltArm, number> = {
    ns: ms0.ns,
    surgical: ms0.surgical,
    untreated: ms0.untreated,
  };
  let active: AltArm[] = ALT_ARMS.filter((a) => current[a] > EPS);
  const clamped: AltArm[] = [];
  let remaining = deltaH;
  let reallocated = false;
  let safety = 0;

  while (remaining > EPS && active.length > 0 && safety < 20) {
    safety++;
    const wsum = active.reduce((s, a) => s + deltas[a], 0);
    const anyClampedThisPass: AltArm[] = [];

    if (wsum <= EPS) {
      // Active arms have zero weight — distribute evenly
      const evenShare = remaining / active.length;
      for (const a of active) {
        if (current[a] <= evenShare + EPS) {
          remaining -= current[a];
          current[a] = 0;
          clamped.push(a);
          anyClampedThisPass.push(a);
        } else {
          current[a] -= evenShare;
          remaining -= evenShare;
        }
      }
    } else {
      for (const a of active) {
        const wNorm = deltas[a] / wsum;
        const requested = wNorm * remaining;
        if (requested >= current[a] - EPS) {
          // Clamp this arm
          remaining -= current[a];
          current[a] = 0;
          clamped.push(a);
          anyClampedThisPass.push(a);
        }
      }
      if (anyClampedThisPass.length === 0) {
        // No clamps — apply proportional reduction and finish
        const wsum2 = active.reduce((s, a) => s + deltas[a], 0);
        for (const a of active) {
          const wNorm = deltas[a] / wsum2;
          current[a] -= wNorm * remaining;
        }
        remaining = 0;
      }
    }

    if (anyClampedThisPass.length > 0) {
      reallocated = true;
      active = active.filter((a) => !anyClampedThisPass.includes(a));
    }
  }

  const feasible = remaining <= EPS;
  const absorbed = deltaH - Math.max(0, remaining);
  const achievableHIud = ms0.hIud + absorbed;

  const ms1: MarketShares = {
    hIud: feasible ? clampedTarget : achievableHIud,
    ns: Math.max(0, current.ns),
    surgical: Math.max(0, current.surgical),
    untreated: Math.max(0, current.untreated),
  };

  return {
    marketShares1: ms1,
    clampedArms: clamped,
    reallocated,
    feasible,
    achievableHIud,
  };
}

function weightedSum(ms: MarketShares, vals: { hIud: number; ns: number; surgical: number; untreated: number }) {
  return (
    ms.hIud * vals.hIud +
    ms.ns * vals.ns +
    ms.surgical * vals.surgical +
    ms.untreated * vals.untreated
  );
}

export function runBia(inputs: BiaInputs): BiaResult {
  const population = Math.round(inputs.wcba * inputs.hmbPrevalence);
  const ms0 = inputs.marketShares0;
  const ms1 = inputs.marketShares1;

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
