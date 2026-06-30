import { useCallback, useMemo, useState } from "react";
import { computeShift, runBia } from "@/lib/bia/engine";
import {
  COUNTRIES,
  COUNTRY_COSTS,
  COUNTRY_COST_SPLIT,
  COUNTRY_DALYS,
  COUNTRY_EFFECTIVENESS,
  DEFAULT_COUNTRY,
} from "@/lib/bia/countries";
import { DEFAULT_DELTAS } from "@/lib/bia/defaults";
import type {
  AltArm,
  AltWeights,
  ArmValues,
  BiaInputs,
  Currency,
  MarketShares,
} from "@/lib/bia/types";

const ALT_ARMS: AltArm[] = ["ns", "surgical", "untreated"];

interface BaseInputs {
  wcba: number;
  hmbPrevalence: number;
  marketShares0: MarketShares;
  costs: ArmValues;
  effectiveness: ArmValues;
  anemia: ArmValues;
  dalys: ArmValues;
}

function presetToBase(countryKey: string): BaseInputs {
  const c = COUNTRIES[countryKey];
  const ms = c.marketShares ?? { hIud: 0.08, ns: 0.42, surgical: 0.18, untreated: 0.32 };
  return {
    wcba: c.wcba,
    hmbPrevalence: c.hmbPrevalence,
    marketShares0: { ...ms },
    costs: { ...COUNTRY_COSTS[countryKey] },
    effectiveness: { ...COUNTRY_EFFECTIVENESS[countryKey] },
    anemia: { ...c.anemia },
    dalys: { ...COUNTRY_DALYS[countryKey] },
  };
}

export function useBiaModel() {
  const [countryKey, setCountryKey] = useState<string>(DEFAULT_COUNTRY);
  const [isCustom, setIsCustom] = useState(false);
  const [base, setBase] = useState<BaseInputs>(() => presetToBase(DEFAULT_COUNTRY));
  const [targetHIud, setTargetHIud] = useState<number>(() => base.marketShares0.hIud);
  const [deltas, setDeltas] = useState<AltWeights>({ ...DEFAULT_DELTAS });
  const [currencyMode, setCurrencyMode] = useState<Currency>("LCU");

  const selectCountry = useCallback((key: string) => {
    if (!COUNTRIES[key]) return;
    const next = presetToBase(key);
    setCountryKey(key);
    setIsCustom(false);
    setBase(next);
    setTargetHIud(next.marketShares0.hIud);
    setDeltas({ ...DEFAULT_DELTAS });
  }, []);

  const reset = useCallback(() => {
    const next = presetToBase(countryKey);
    setIsCustom(false);
    setBase(next);
    setTargetHIud(next.marketShares0.hIud);
    setDeltas({ ...DEFAULT_DELTAS });
  }, [countryKey]);

  const markCustom = () => setIsCustom(true);

  const setHmbPrevalence = (v: number) => {
    markCustom();
    setBase((p) => ({ ...p, hmbPrevalence: Math.max(0, Math.min(1, v)) }));
  };

  // Edit MS₀ for one arm; auto-balance the other 3 proportionally so Σ = 1.
  // Also keep targetHIud anchored to the new baseline H-IUD when that arm changes.
  const setMarketShare0 = useCallback((arm: keyof MarketShares, raw: number) => {
    markCustom();
    setBase((p) => {
      const v = Math.max(0, Math.min(1, raw));
      const all: (keyof MarketShares)[] = ["hIud", "ns", "surgical", "untreated"];
      const others = all.filter((a) => a !== arm);
      const remaining = Math.max(0, 1 - v);
      const oSum = others.reduce((s, a) => s + p.marketShares0[a], 0);
      const next: MarketShares = { ...p.marketShares0, [arm]: v };
      others.forEach((o) => {
        next[o] = oSum <= 1e-9 ? remaining / 3 : remaining * (p.marketShares0[o] / oSum);
      });
      return { ...p, marketShares0: next };
    });
    if (arm === "hIud") {
      setTargetHIud(Math.max(0, Math.min(1, raw)));
    }
  }, []);

  // The "H-IUD after intervention" slider sets the target only.
  // MS₁ is always derived from MS₀ + targetHIud + δ via computeShift.
  const setMarketShare1 = useCallback((arm: keyof MarketShares, raw: number) => {
    if (arm !== "hIud") return; // alt arms are derived; not user-editable
    markCustom();
    setTargetHIud(Math.max(0, Math.min(1, raw)));
  }, []);

  // Set cannibalization weight for one alt arm; the other two auto-balance so Σ(ns,s,u)=1.
  const setDelta = useCallback((arm: AltArm, raw: number) => {
    markCustom();
    setDeltas((p) => {
      const v = Math.max(0, Math.min(1, raw));
      const others = ALT_ARMS.filter((a) => a !== arm);
      const remaining = 1 - v;
      const o0 = p[others[0]];
      const o1 = p[others[1]];
      const oSum = o0 + o1;
      const next: AltWeights = { ...p, [arm]: v };
      if (oSum <= 1e-9) {
        next[others[0]] = remaining / 2;
        next[others[1]] = remaining / 2;
      } else {
        next[others[0]] = remaining * (o0 / oSum);
        next[others[1]] = remaining * (o1 / oSum);
      }
      return next;
    });
  }, []);

  const setCost = (arm: keyof ArmValues, v: number) => {
    markCustom();
    setBase((p) => ({ ...p, costs: { ...p.costs, [arm]: Math.max(0, v) } }));
  };
  const setEffectiveness = (arm: keyof ArmValues, v: number) => {
    markCustom();
    setBase((p) => ({
      ...p,
      effectiveness: { ...p.effectiveness, [arm]: Math.max(0, Math.min(1, v)) },
    }));
  };
  const setAnemia = (arm: keyof ArmValues, v: number) => {
    markCustom();
    setBase((p) => ({
      ...p,
      anemia: { ...p.anemia, [arm]: Math.max(0, Math.min(1, v)) },
    }));
  };

  // Derive MS₁ from the fixed baseline + target + δ. This is the key
  // anti-drift guarantee: returning targetHIud to the baseline restores
  // every alt arm to its exact original value.
  const shift = useMemo(
    () => computeShift(base.marketShares0, targetHIud, deltas),
    [base.marketShares0, targetHIud, deltas],
  );

  const inputs: BiaInputs = useMemo(
    () => ({
      wcba: base.wcba,
      hmbPrevalence: base.hmbPrevalence,
      marketShares0: base.marketShares0,
      marketShares1: shift.marketShares1,
      costs: base.costs,
      effectiveness: base.effectiveness,
      anemia: base.anemia,
      dalys: base.dalys,
    }),
    [base, shift.marketShares1],
  );

  const result = useMemo(() => runBia(inputs), [inputs]);

  const country = COUNTRIES[countryKey];
  const currency = useMemo(
    () =>
      currencyMode === "USD"
        ? { mode: "USD" as Currency, label: "USD", rate: country.usdPerLcu }
        : { mode: "LCU" as Currency, label: country.currencyCode, rate: 1 },
    [currencyMode, country.currencyCode, country.usdPerLcu],
  );

  return {
    countryKey,
    isCustom,
    inputs,
    deltas,
    targetHIud,
    result,
    currency,
    setCurrencyMode,
    selectCountry,
    reset,
    setHmbPrevalence,
    setMarketShare1,
    setDelta,
    setCost,
    setEffectiveness,
    setAnemia,
    setMarketShare0,
  };
}
