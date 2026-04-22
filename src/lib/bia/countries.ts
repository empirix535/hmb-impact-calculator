import type { CountryPreset } from "./types";

export const COUNTRIES: Record<string, CountryPreset> = {
  KE: {
    name: "Kenya",
    wcba: 13_500_000,
    hmbPrevalence: 0.3,
    anemia: { hIud: 0.12, ns: 0.25, surgical: 0.08, untreated: 0.45 },
    marketShares: { hIud: 0.03, ns: 0.3, surgical: 0.1, untreated: 0.57 },
  },
};

export const DEFAULT_COUNTRY = "KE";
