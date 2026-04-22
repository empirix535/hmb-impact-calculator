import { useCallback, useMemo, useState } from "react";
import { runBia } from "@/lib/bia/engine";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/lib/bia/countries";
import {
  DEFAULT_COSTS,
  DEFAULT_DELTAS,
  DEFAULT_EFFECTIVENESS,
} from "@/lib/bia/defaults";
import type {
  AltArm,
  AltWeights,
  ArmValues,
  BiaInputs,
  Currency,
  MarketShares,
} from "@/lib/bia/types";

const ALT_ARMS: AltArm[] = ["ns", "surgical", "untreated"];

const ARMS: (keyof MarketShares)[] = ["hIud", "ns", "surgical", "untreated"];

function presetToInputs(countryKey: string): BiaInputs {
  const c = COUNTRIES[countryKey];
  const ms = c.marketShares ?? { hIud: 0.08, ns: 0.42, surgical: 0.18, untreated: 0.32 };
  return {
    wcba: c.wcba,
    hmbPrevalence: c.hmbPrevalence,
    marketShares0: ms,
    marketShares1: { ...ms },
    costs: { ...DEFAULT_COSTS },
    effectiveness: { ...DEFAULT_EFFECTIVENESS },
    anemia: { ...c.anemia },
  };
}

export function useBiaModel() {
  const [countryKey, setCountryKey] = useState<string>(DEFAULT_COUNTRY);
  const [isCustom, setIsCustom] = useState(false);
  const [inputs, setInputs] = useState<BiaInputs>(() => presetToInputs(DEFAULT_COUNTRY));
  const [currencyMode, setCurrencyMode] = useState<Currency>("LCU");
  const [deltas, setDeltas] = useState<AltWeights>({ ...DEFAULT_DELTAS });

  const selectCountry = useCallback((key: string) => {
    if (!COUNTRIES[key]) return;
    setCountryKey(key);
    setIsCustom(false);
    setInputs(presetToInputs(key));
    setDeltas({ ...DEFAULT_DELTAS });
  }, []);

  const reset = useCallback(() => {
    setIsCustom(false);
    setInputs(presetToInputs(countryKey));
    setDeltas({ ...DEFAULT_DELTAS });
  }, [countryKey]);

  const markCustom = () => setIsCustom(true);

  const setHmbPrevalence = (v: number) => {
    markCustom();
    setInputs((p) => ({ ...p, hmbPrevalence: Math.max(0, Math.min(1, v)) }));
  };

  // Set MS₁ for one arm; auto-balance the other 3.
  // For H-IUD: redistribute the delta across NS/S/U using cannibalization weights.
  // For NS/S/U: balance proportionally to the other two alt arms (H-IUD held fixed).
  const setMarketShare1 = useCallback(
    (arm: keyof MarketShares, raw: number) => {
      markCustom();
      setInputs((p) => {
        const v = Math.max(0, Math.min(1, raw));
        if (arm === "hIud") {
          const remaining = 1 - v;
          const w = deltas;
          const wSum = w.ns + w.surgical + w.untreated;
          const next: MarketShares =
            wSum <= 1e-9
              ? { hIud: v, ns: remaining / 3, surgical: remaining / 3, untreated: remaining / 3 }
              : {
                  hIud: v,
                  ns: remaining * (w.ns / wSum),
                  surgical: remaining * (w.surgical / wSum),
                  untreated: remaining * (w.untreated / wSum),
                };
          return { ...p, marketShares1: next };
        }
        // Adjusting an alt arm: hold H-IUD; rebalance the other two alt arms proportionally.
        const hIud = p.marketShares1.hIud;
        const altRemaining = Math.max(0, 1 - hIud - v);
        const others = ALT_ARMS.filter((a) => a !== arm);
        const o0 = p.marketShares1[others[0]];
        const o1 = p.marketShares1[others[1]];
        const oSum = o0 + o1;
        const next: MarketShares = { ...p.marketShares1, [arm]: v };
        if (oSum <= 1e-9) {
          next[others[0]] = altRemaining / 2;
          next[others[1]] = altRemaining / 2;
        } else {
          next[others[0]] = altRemaining * (o0 / oSum);
          next[others[1]] = altRemaining * (o1 / oSum);
        }
        return { ...p, marketShares1: next };
      });
    },
    [deltas],
  );

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
    setInputs((p) => ({ ...p, costs: { ...p.costs, [arm]: Math.max(0, v) } }));
  };
  const setEffectiveness = (arm: keyof ArmValues, v: number) => {
    markCustom();
    setInputs((p) => ({
      ...p,
      effectiveness: { ...p.effectiveness, [arm]: Math.max(0, Math.min(1, v)) },
    }));
  };
  const setAnemia = (arm: keyof ArmValues, v: number) => {
    markCustom();
    setInputs((p) => ({
      ...p,
      anemia: { ...p.anemia, [arm]: Math.max(0, Math.min(1, v)) },
    }));
  };

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
    result,
    currency,
    setCurrencyMode,
    selectCountry,
    reset,
    setHmbPrevalence,
    setMarketShare1,
    setCost,
    setEffectiveness,
    setAnemia,
  };
}
