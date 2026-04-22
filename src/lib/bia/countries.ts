import type { CountryPreset } from "./types";

export const COUNTRIES: Record<string, CountryPreset> = {
  KE: {
    name: "Kenya",
    currencyCode: "KES",
    usdPerLcu: 1 / 129,
    wcba: 17_300_000,
    hmbPrevalence: 0.25,
    anemia: { hIud: 0.1185, ns: 0.4051, surgical: 0.1063, untreated: 0.455 },
    marketShares: { hIud: 0.0, ns: 0.2015, surgical: 0.0545, untreated: 0.744 },
  },
};

export const DEFAULT_COUNTRY = "KE";
