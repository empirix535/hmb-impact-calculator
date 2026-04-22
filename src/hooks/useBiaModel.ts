import { useCallback, useMemo, useState } from "react";
import { runBia } from "@/lib/bia/engine";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/lib/bia/countries";
import {
  DEFAULT_COSTS,
  DEFAULT_EFFECTIVENESS,
} from "@/lib/bia/defaults";
import type {
  ArmValues,
  BiaInputs,
  Currency,
  MarketShares,
} from "@/lib/bia/types";

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

  const selectCountry = useCallback((key: string) => {
    if (!COUNTRIES[key]) return;
    setCountryKey(key);
    setIsCustom(false);
    setInputs(presetToInputs(key));
  }, []);

  const reset = useCallback(() => {
    setIsCustom(false);
    setInputs(presetToInputs(countryKey));
  }, [countryKey]);

  const markCustom = () => setIsCustom(true);

  const setHmbPrevalence = (v: number) => {
    markCustom();
    setInputs((p) => ({ ...p, hmbPrevalence: Math.max(0, Math.min(1, v)) }));
  };

  // Set MS₁ for one arm; auto-balance the other 3 proportionally so Σ = 1.
  const setMarketShare1 = useCallback((arm: keyof MarketShares, raw: number) => {
    markCustom();
    setInputs((p) => {
      const v = Math.max(0, Math.min(1, raw));
      const others = ARMS.filter((a) => a !== arm);
      const remaining = 1 - v;
      const o0 = p.marketShares1[others[0]];
      const o1 = p.marketShares1[others[1]];
      const o2 = p.marketShares1[others[2]];
      const oSum = o0 + o1 + o2;
      const next: MarketShares = { ...p.marketShares1, [arm]: v };
      if (oSum <= 1e-9) {
        next[others[0]] = remaining / 3;
        next[others[1]] = remaining / 3;
        next[others[2]] = remaining / 3;
      } else {
        next[others[0]] = remaining * (o0 / oSum);
        next[others[1]] = remaining * (o1 / oSum);
        next[others[2]] = remaining * (o2 / oSum);
      }
      return { ...p, marketShares1: next };
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
