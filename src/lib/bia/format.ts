export const fmtPct = (v: number, digits = 1) =>
  `${(v * 100).toFixed(digits)}%`;

export const fmtInt = (v: number) =>
  Math.round(v).toLocaleString("en-US");

export interface CurrencyFormatters {
  fmtCurrency: (v: number) => string;
  fmtCurrencyExact: (v: number) => string;
  unit: string;
  rate: number;
}

export function makeCurrencyFormatters({
  unit,
  rate,
}: {
  unit: string;
  rate: number;
}): CurrencyFormatters {
  const fmtCurrency = (v: number) => {
    const conv = v * rate;
    const abs = Math.abs(conv);
    const sign = conv < 0 ? "-" : "";
    if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B ${unit}`;
    if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M ${unit}`;
    if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(1)}K ${unit}`;
    return `${sign}${abs.toFixed(0)} ${unit}`;
  };
  const fmtCurrencyExact = (v: number) =>
    `${Math.round(v * rate).toLocaleString("en-US")} ${unit}`;
  return { fmtCurrency, fmtCurrencyExact, unit, rate };
}

// Default LCU formatters (kept for backward compat — uses generic "LCU" label)
const _default = makeCurrencyFormatters({ unit: "LCU", rate: 1 });
export const fmtCurrency = _default.fmtCurrency;
export const fmtCurrencyExact = _default.fmtCurrencyExact;

export const ARM_LABELS: Record<string, string> = {
  hIud: "H-IUD",
  ns: "Non-Surgical",
  surgical: "Surgical",
  untreated: "Untreated",
};
