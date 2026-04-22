export const fmtPct = (v: number, digits = 1) =>
  `${(v * 100).toFixed(digits)}%`;

export const fmtInt = (v: number) =>
  Math.round(v).toLocaleString("en-US");

export const fmtCurrency = (v: number) => {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B LCU`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M LCU`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(1)}K LCU`;
  return `${sign}${abs.toFixed(0)} LCU`;
};

export const fmtCurrencyExact = (v: number) =>
  `${Math.round(v).toLocaleString("en-US")} LCU`;

export const ARM_LABELS: Record<string, string> = {
  hIud: "H-IUD",
  ns: "Non-Surgical",
  surgical: "Surgical",
  untreated: "Untreated",
};
