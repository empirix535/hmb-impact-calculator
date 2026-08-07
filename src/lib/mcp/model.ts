import {
  COUNTRIES,
  COUNTRY_COSTS,
  COUNTRY_COSTS_COMM,
  COUNTRY_COSTS_NONCOMM,
  COUNTRY_DALYS,
  COUNTRY_EFFECTIVENESS,
  DEFAULT_COUNTRY,
} from "@/lib/bia/countries";
import { DEFAULT_DELTAS } from "@/lib/bia/defaults";
import { computeShift, runBia } from "@/lib/bia/engine";
import type { BiaResult, MarketShares } from "@/lib/bia/types";

export { DEFAULT_COUNTRY };

export function countryKeys(): string[] {
  return Object.keys(COUNTRIES);
}

/** Resolve a country by key ("KE") or name ("Kenya"), case-insensitive. */
export function resolveCountryKey(input?: string): string {
  if (!input) return DEFAULT_COUNTRY;
  const needle = input.trim().toLowerCase();
  const byKey = countryKeys().find((k) => k.toLowerCase() === needle);
  if (byKey) return byKey;
  const byName = countryKeys().find(
    (k) => COUNTRIES[k]!.name.toLowerCase() === needle,
  );
  if (byName) return byName;
  throw new Error(
    `Unknown country "${input}". Available: ${countryKeys()
      .map((k) => `${k} (${COUNTRIES[k]!.name})`)
      .join(", ")}`,
  );
}

export function countryInputs(key: string) {
  const preset = COUNTRIES[key]!;
  return {
    key,
    name: preset.name,
    currencyCode: preset.currencyCode,
    usdPerLcu: preset.usdPerLcu,
    wcba: preset.wcba,
    hmbPrevalence: preset.hmbPrevalence,
    baselineMarketShares: preset.marketShares,
    costsPerPatient: COUNTRY_COSTS[key],
    costsCommodity: COUNTRY_COSTS_COMM[key],
    costsNonCommodity: COUNTRY_COSTS_NONCOMM[key],
    effectiveness: COUNTRY_EFFECTIVENESS[key],
    dalysPerPatient: COUNTRY_DALYS[key],
    anemia: preset.anemia,
  };
}

export interface ScenarioArgs {
  country?: string;
  targetHIud?: number;
  hmbPrevalence?: number;
  deltaNs?: number;
  deltaSurgical?: number;
  deltaUntreated?: number;
  currency?: "LCU" | "USD";
}

export function runScenario(args: ScenarioArgs) {
  const key = resolveCountryKey(args.country);
  const preset = COUNTRIES[key]!;
  const ms0: MarketShares =
    preset.marketShares ?? { hIud: 0, ns: 0, surgical: 0, untreated: 1 };

  const rawDeltas = {
    ns: args.deltaNs ?? DEFAULT_DELTAS.ns,
    surgical: args.deltaSurgical ?? DEFAULT_DELTAS.surgical,
    untreated: args.deltaUntreated ?? DEFAULT_DELTAS.untreated,
  };
  const dSum = rawDeltas.ns + rawDeltas.surgical + rawDeltas.untreated;
  const deltas =
    dSum > 0
      ? {
          ns: rawDeltas.ns / dSum,
          surgical: rawDeltas.surgical / dSum,
          untreated: rawDeltas.untreated / dSum,
        }
      : DEFAULT_DELTAS;

  const targetHIud = clamp01(args.targetHIud ?? ms0.hIud);
  const shift = computeShift(ms0, targetHIud, deltas);

  const result: BiaResult = runBia({
    wcba: preset.wcba,
    hmbPrevalence: args.hmbPrevalence ?? preset.hmbPrevalence,
    marketShares0: ms0,
    marketShares1: shift.marketShares1,
    costs: COUNTRY_COSTS[key]!,
    costsComm: COUNTRY_COSTS_COMM[key],
    costsNonComm: COUNTRY_COSTS_NONCOMM[key],
    effectiveness: COUNTRY_EFFECTIVENESS[key]!,
    anemia: preset.anemia,
    dalys: COUNTRY_DALYS[key]!,
  });

  const currency = args.currency ?? "LCU";
  const rate = currency === "USD" ? preset.usdPerLcu : 1;
  const money = (v: number) => round(v * rate, 2);

  return {
    scenario: {
      country: preset.name,
      countryKey: key,
      currency: currency === "USD" ? "USD (2025 constant)" : preset.currencyCode,
      targetHIudShare: targetHIud,
      achievedHIudShare: shift.achievableHIud,
      cannibalizationWeights: deltas,
      clampedArms: shift.clampedArms,
      feasible: shift.feasible,
    },
    population: result.population,
    marketShares: {
      statusQuo: ms0,
      intervention: shift.marketShares1,
    },
    budget: {
      totalCostStatusQuo: money(result.totalCostSq),
      totalCostIntervention: money(result.totalCostInt),
      budgetImpact: money(result.budgetImpact),
      budgetImpactPct: round(result.budgetImpactPct * 100, 2),
      costPerPatientStatusQuo: money(result.perPatientSq),
      costPerPatientIntervention: money(result.perPatientInt),
      costPerPatientInterventionCommodity: money(result.perPatientIntComm),
      costPerPatientInterventionNonCommodity: money(result.perPatientIntNonComm),
    },
    clinical: {
      hmbCasesResolved: Math.round(result.hmbCasesAverted),
      anemiaCasesAvoided: Math.round(result.anemiaCasesAverted),
      dalysAverted: round(result.dalysAverted, 1),
      dalysAvertedByArm: {
        ns: round(result.dalysAvertedByArm.ns, 1),
        surgical: round(result.dalysAvertedByArm.surgical, 1),
        untreated: round(result.dalysAvertedByArm.untreated, 1),
      },
      hmbPrevalenceStatusQuo: round(result.hmbPrevalenceSq, 4),
      hmbPrevalenceIntervention: round(result.hmbPrevalenceInt, 4),
    },
    perArmBreakdown: result.breakdown.map((b) => ({
      arm: b.arm,
      shareStatusQuo: round(b.ms0, 4),
      shareIntervention: round(b.ms1, 4),
      patientsShifted: Math.round(b.patientsShifted),
      costStatusQuo: money(b.cost0),
      costIntervention: money(b.cost1),
      deltaCost: money(b.deltaCost),
    })),
  };
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function round(v: number, digits: number) {
  const f = 10 ** digits;
  return Math.round(v * f) / f;
}
