import type { CountryPreset } from "./types";
import csvRaw from "@/data/lovable_inputs.csv?raw";

// CSV columns:
// Country,Currency_Code,USD_Exchange_Rate,WCBA,HMB_Prevalence,
// C_H,C_NS,C_S,C_U,
// MS0_H,MS0_NS,MS0_S,MS0_U,
// E_H,E_NS,E_S,E_U,
// A_H,A_NS,A_S,A_U

interface ParsedCountry {
  key: string;
  preset: CountryPreset;
  costs: { hIud: number; ns: number; surgical: number; untreated: number };
  costSplit: import("./types").CostSplitValues;
  effectiveness: { hIud: number; ns: number; surgical: number; untreated: number };
  dalys: { hIud: number; ns: number; surgical: number; untreated: number };
}

function num(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function countryCodeFor(name: string): string {
  // Minimal ISO-2 mapping; falls back to first 2 letters uppercased.
  const map: Record<string, string> = {
    Kenya: "KE",
    Nigeria: "NG",
    Ghana: "GH",
    SouthAfrica: "ZA",
    "South Africa": "ZA",
    Uganda: "UG",
    Tanzania: "TZ",
    Ethiopia: "ET",
    Rwanda: "RW",
  };
  return map[name] ?? name.replace(/\s+/g, "").slice(0, 2).toUpperCase();
}

function parseCsv(text: string): ParsedCountry[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  const idx = (h: string) => headers.indexOf(h);
  const out: ParsedCountry[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",").map((c) => c.trim());
    if (cells.length < headers.length) continue;
    const name = cells[idx("Country")];
    const currencyCode = cells[idx("Currency_Code")];
    const fxLcuPerUsd = num(cells[idx("USD_Exchange_Rate")]); // LCU per 1 USD
    const usdPerLcu = fxLcuPerUsd > 0 ? 1 / fxLcuPerUsd : 1;
    const wcba = num(cells[idx("WCBA")]);
    const hmbPrevalence = num(cells[idx("HMB_Prevalence")]);

    const costs = {
      hIud: num(cells[idx("C_H")]),
      ns: num(cells[idx("C_NS")]),
      surgical: num(cells[idx("C_S")]),
      untreated: num(cells[idx("C_U")]),
    };
    const splitFor = (commCol: string, nonCol: string, total: number) => {
      const ci = idx(commCol);
      const ni = idx(nonCol);
      const commodity = ci >= 0 ? num(cells[ci]) : total;
      const nonCommodity = ni >= 0 ? num(cells[ni]) : 0;
      return { commodity, nonCommodity };
    };
    const costSplit = {
      hIud: splitFor("C_H_Comm", "C_H_NonComm", costs.hIud),
      ns: splitFor("C_NS_Comm", "C_NS_NonComm", costs.ns),
      surgical: splitFor("C_S_Comm", "C_S_NonComm", costs.surgical),
      untreated: splitFor("C_U_Comm", "C_U_NonComm", costs.untreated),
    };
    const marketShares = {
      hIud: num(cells[idx("MS0_H")]),
      ns: num(cells[idx("MS0_NS")]),
      surgical: num(cells[idx("MS0_S")]),
      untreated: num(cells[idx("MS0_U")]),
    };
    const effectiveness = {
      hIud: num(cells[idx("E_H")]),
      ns: num(cells[idx("E_NS")]),
      surgical: num(cells[idx("E_S")]),
      untreated: num(cells[idx("E_U")]),
    };
    const anemia = {
      hIud: num(cells[idx("A_H")]),
      ns: num(cells[idx("A_NS")]),
      surgical: num(cells[idx("A_S")]),
      untreated: num(cells[idx("A_U")]),
    };
    const dalys = {
      hIud: num(cells[idx("D_H")]),
      ns: num(cells[idx("D_NS")]),
      surgical: num(cells[idx("D_S")]),
      untreated: num(cells[idx("D_U")]),
    };

    const key = countryCodeFor(name);
    out.push({
      key,
      preset: {
        name,
        currencyCode,
        usdPerLcu,
        wcba,
        hmbPrevalence,
        anemia,
        dalys,
        marketShares,
      },
      costs,
      effectiveness,
      dalys,
    });
  }
  return out;
}

const PARSED = parseCsv(csvRaw);

export const COUNTRIES: Record<string, CountryPreset> = Object.fromEntries(
  PARSED.map((p) => [p.key, p.preset]),
);

export const COUNTRY_COSTS: Record<string, ParsedCountry["costs"]> = Object.fromEntries(
  PARSED.map((p) => [p.key, p.costs]),
);

export const COUNTRY_EFFECTIVENESS: Record<string, ParsedCountry["effectiveness"]> =
  Object.fromEntries(PARSED.map((p) => [p.key, p.effectiveness]));

export const COUNTRY_DALYS: Record<string, ParsedCountry["dalys"]> = Object.fromEntries(
  PARSED.map((p) => [p.key, p.dalys]),
);

export const DEFAULT_COUNTRY = PARSED[0]?.key ?? "KE";
