
# Dynamic Currency Units (LCU + USD toggle)

Make the currency unit reactive to the selected country, and add a UI toggle to switch between the country's Local Currency Unit (LCU) and USD using a country-specific FX rate.

## 1. Country registry — add currency metadata

In `src/lib/bia/countries.ts`, extend each country entry with:
- `currencyCode: string` — ISO code shown as the LCU label (e.g. `"KES"` for Kenya).
- `usdPerLcu: number` — FX rate to convert LCU → USD (e.g. `1 / 129` for KES).

Kenya seed values:
- `currencyCode: "KES"`
- `usdPerLcu: 1 / 129` (approx. 2026 reference rate; easy to revise later)

## 2. Types

In `src/lib/bia/types.ts`, add:
- `Currency = "LCU" | "USD"` union.
- Extend `Country` type with `currencyCode` and `usdPerLcu`.

## 3. Format helpers — currency-aware

Refactor `src/lib/bia/format.ts`:
- Replace the hard-coded `"LCU"` suffix in `fmtCurrency` and `fmtCurrencyExact` with a factory:
  - `makeCurrencyFormatters({ unit, rate })` returns `{ fmtCurrency, fmtCurrencyExact }`.
  - `unit` is the displayed label (the country's `currencyCode` when LCU mode, or `"USD"` when USD mode).
  - `rate` is the multiplier applied to raw LCU values before formatting (1.0 in LCU mode, `usdPerLcu` in USD mode).
- Keep `fmtPct` and `fmtInt` unchanged.

## 4. Hook — currency state

In `src/hooks/useBiaModel.ts`:
- Add `currencyMode: Currency` state, default `"LCU"`.
- Expose `setCurrencyMode(mode)`.
- Derive `currency = { mode, label, rate }` where:
  - LCU mode → `label = country.currencyCode`, `rate = 1`.
  - USD mode → `label = "USD"`, `rate = country.usdPerLcu`.
- When the user switches country, keep their currency mode choice (do not reset).
- Return `currency` alongside existing fields.

## 5. UI — currency selector + propagation

`src/components/bia/ControlCenter.tsx`:
- In the Country card, add a small segmented toggle (two `Button`s or a `Tabs`) labelled "Display currency": `KES` (dynamic label = `country.currencyCode`) and `USD`.
- Update the Advanced "5-yr cost per patient" group label to use the active currency label.

`src/components/bia/KpiCards.tsx`, `src/components/bia/BreakdownTable.tsx`, `src/components/bia/Charts.tsx`:
- Accept the formatter pair (or `currency` object) via props from `routes/index.tsx` and use it everywhere `fmtCurrency` / `fmtCurrencyExact` is currently called (KPI values, table cells, chart tooltips/axis tick formatters, CSV header for ΔCost columns).
- CSV export header: change `Cost SQ`/`Cost Int`/`ΔCost` to include the active unit, e.g. `Cost SQ (USD)`.

`src/routes/index.tsx`:
- Build the formatters once per render from `model.currency` and pass them down to KPI / Charts / Breakdown / ControlCenter.

## Out of scope

Per-arm cost editing in a different currency (costs remain stored in LCU; USD is a display conversion only); historical FX rates; multiple FX rates per country.
