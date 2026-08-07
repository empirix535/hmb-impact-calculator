import { createFileRoute } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { useBiaModel } from "@/hooks/useBiaModel";
import { ControlCenter } from "@/components/bia/ControlCenter";
import { KpiCards } from "@/components/bia/KpiCards";
import {
  ClinicalChart,
  CostChart,
  CostEffectivenessPlane,
  DalyAttributionChart,
  IncrementalCEPlane,
  WaterfallChart,
} from "@/components/bia/Charts";

import { SankeyChart } from "@/components/bia/SankeyChart";
import { BreakdownTable } from "@/components/bia/BreakdownTable";
import { COUNTRIES, isBaselineCountry } from "@/lib/bia/countries";
import { makeCurrencyFormatters } from "@/lib/bia/format";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const Route = createFileRoute("/")({
  component: BiaDashboard,
  head: () => ({
    meta: [
      { title: "H-IUD Budget Impact Analysis" },
      {
        name: "description",
        content:
          "Interactive 5-year Budget Impact Analysis for H-IUD in Heavy Menstrual Bleeding — population, cost, and clinical outcomes.",
      },
    ],
  }),
});

function BiaDashboard() {
  const model = useBiaModel();
  const country = COUNTRIES[model.countryKey];
  const isBaseline = isBaselineCountry(model.countryKey);
  const currencyFmt = useMemo(
    () => makeCurrencyFormatters({ unit: model.currency.label, rate: model.currency.rate }),
    [model.currency.label, model.currency.rate],
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-[1440px] bg-background border-x shadow-sm min-h-screen">
      <header className="border-b sticky top-0 z-10 bg-background/95 backdrop-blur">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">
                H-IUD Budget Impact Analysis
              </h1>
              <p className="text-xs text-muted-foreground">
                5-year cumulative model · Heavy Menstrual Bleeding
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {country.name}
              {!isBaseline && <span className="ml-0.5 text-amber-600">*</span>}
            </Badge>
            {model.isCustom && <Badge variant="secondary">Custom</Badge>}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8 p-8">
        <aside className="lg:sticky lg:top-[81px] lg:self-start lg:max-h-[calc(100vh-97px)] lg:overflow-y-auto pr-1">
          <ControlCenter model={model} />
        </aside>

        <main className="space-y-8 min-w-0">
          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold mb-2">How to read this dashboard</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This tool runs a <strong className="text-foreground">before / after</strong> budget
              impact analysis over a 5-year horizon. The "before" is the Status Quo treatment
              mix for HMB in the selected country; the "after" is the same population redistributed
              once you raise H-IUD uptake. Every KPI, table, and chart below shows the
              <em> incremental </em> difference between those two scenarios.
            </p>
            <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
              <div>
                <span className="font-semibold text-foreground">1. Eligible population</span> —
                set country and HMB prevalence to size the market.
              </div>
              <div>
                <span className="font-semibold text-foreground">2. H-IUD share (main lever)</span> —
                move the slider under "Market Shares After Intervention" to define the "after."
              </div>
              <div>
                <span className="font-semibold text-foreground">3. Cannibalization weights</span> —
                decide whether new H-IUD users come from untreated, NS, or surgical patients.
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Positive cost deltas = added spend; negative = savings. Positive clinical deltas
              (DALYs averted, HMB resolved, anemia avoided) = health gains.
              Monetary values are shown in LCU or in 2025 constant USD. LCU = Local Currency Unit.
            </p>
          </section>

          <KpiCards result={model.result} currency={currencyFmt} />
          <BreakdownTable result={model.result} currency={currencyFmt} />

          <SankeyChart result={model.result} deltas={model.deltas} />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <DalyAttributionChart result={model.result} />
            <ClinicalChart result={model.result} />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <CostChart result={model.result} currency={currencyFmt} />
            <WaterfallChart result={model.result} currency={currencyFmt} />
          </div>
          <CostEffectivenessPlane
            result={model.result}
            inputs={model.inputs}
            currency={currencyFmt}
          />
          {/* <IncrementalCEPlane
            result={model.result}
            inputs={model.inputs}
            currency={currencyFmt}
          /> */}

        </main>
      </div>
      </div>
    </div>
  );
}
