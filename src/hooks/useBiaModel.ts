import { useCallback, useMemo, useState } from "react";
import { runBia } from "@/lib/bia/engine";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/lib/bia/countries";
import {
  DEFAULT_COSTS,
  DEFAULT_DELTAS,
  DEFAULT_EFFECTIVENESS,
  DEFAULT_TARGET_HIUD,
} from "@/lib/bia/defaults";
import type {
  AltArm,
  AltWeights,
  ArmValues,
  BiaInputs,
  Currency,
  MarketShares,
} from "@/lib/bia/types";

const ALT: AltArm[] = ["ns", "surgical", "untreated"];

function presetToInputs(countryKey: string): BiaInputs {
  const c = COUNTRIES[countryKey];
  const ms = c.marketShares ?? { hIud: 0.08, ns: 0.42, surgical: 0.18, untreated: 0.32 };
  return {
    wcba: c.wcba,
    hmbPrevalence: c.hmbPrevalence,
    marketShares0: ms,
    targetHIud: Math.max(ms.hIud, DEFAULT_TARGET_HIUD),
    deltas: { ...DEFAULT_DELTAS },
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

  const setWcba = (v: number) => {
    markCustom();
    setInputs((p) => ({ ...p, wcba: Math.max(0, v) }));
  };
  const setHmbPrevalence = (v: number) => {
    markCustom();
    setInputs((p) => ({ ...p, hmbPrevalence: Math.max(0, Math.min(1, v)) }));
  };
  const setTargetHIud = (v: number) => {
    markCustom();
    setInputs((p) => ({ ...p, targetHIud: Math.max(0, Math.min(1, v)) }));
  };
  const setMarketShare0 = (arm: keyof MarketShares, v: number) => {
    markCustom();
    setInputs((p) => ({
      ...p,
      marketShares0: { ...p.marketShares0, [arm]: Math.max(0, Math.min(1, v)) },
    }));
  };
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

  // Linked delta sliders — always sum to 1
  const setDelta = useCallback((arm: AltArm, raw: number) => {
    markCustom();
    setInputs((p) => {
      const v = Math.max(0, Math.min(1, raw));
      const others = ALT.filter((a) => a !== arm);
      const remaining = 1 - v;
      const o0 = p.deltas[others[0]];
      const o1 = p.deltas[others[1]];
      const oSum = o0 + o1;
      const next: AltWeights = { ...p.deltas, [arm]: v } as AltWeights;
      if (oSum <= 1e-9) {
        next[others[0]] = remaining / 2;
        next[others[1]] = remaining / 2;
      } else {
        next[others[0]] = remaining * (o0 / oSum);
        next[others[1]] = remaining * (o1 / oSum);
      }
      return { ...p, deltas: next };
    });
  }, []);

  const result = useMemo(() => runBia(inputs), [inputs]);

  const snapHIudToMax = useCallback(() => {
    setInputs((p) => ({ ...p, targetHIud: result.shift.achievableHIud }));
  }, [result.shift.achievableHIud]);

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
    setWcba,
    setHmbPrevalence,
    setTargetHIud,
    setMarketShare0,
    setCost,
    setEffectiveness,
    setAnemia,
    setDelta,
    snapHIudToMax,
  };
}
