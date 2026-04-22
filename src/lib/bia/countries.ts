import type { CountryPreset } from "./types";

export const COUNTRIES: Record<string, CountryPreset> = {
  US: {
    name: "United States",
    wcba: 76_000_000,
    hmbPrevalence: 0.27,
    anemia: { hIud: 0.08, ns: 0.18, surgical: 0.05, untreated: 0.32 },
    marketShares: { hIud: 0.08, ns: 0.42, surgical: 0.18, untreated: 0.32 },
  },
  UK: {
    name: "United Kingdom",
    wcba: 14_500_000,
    hmbPrevalence: 0.25,
    anemia: { hIud: 0.07, ns: 0.17, surgical: 0.05, untreated: 0.3 },
    marketShares: { hIud: 0.12, ns: 0.4, surgical: 0.15, untreated: 0.33 },
  },
  DE: {
    name: "Germany",
    wcba: 17_800_000,
    hmbPrevalence: 0.24,
    anemia: { hIud: 0.07, ns: 0.16, surgical: 0.04, untreated: 0.28 },
    marketShares: { hIud: 0.1, ns: 0.45, surgical: 0.2, untreated: 0.25 },
  },
  FR: {
    name: "France",
    wcba: 14_200_000,
    hmbPrevalence: 0.26,
    anemia: { hIud: 0.07, ns: 0.17, surgical: 0.05, untreated: 0.3 },
    marketShares: { hIud: 0.09, ns: 0.43, surgical: 0.18, untreated: 0.3 },
  },
  BR: {
    name: "Brazil",
    wcba: 60_000_000,
    hmbPrevalence: 0.3,
    anemia: { hIud: 0.1, ns: 0.22, surgical: 0.06, untreated: 0.4 },
    marketShares: { hIud: 0.04, ns: 0.36, surgical: 0.12, untreated: 0.48 },
  },
  IN: {
    name: "India",
    wcba: 360_000_000,
    hmbPrevalence: 0.32,
    anemia: { hIud: 0.15, ns: 0.3, surgical: 0.1, untreated: 0.55 },
    marketShares: { hIud: 0.02, ns: 0.25, surgical: 0.08, untreated: 0.65 },
  },
};

export const DEFAULT_COUNTRY = "US";
