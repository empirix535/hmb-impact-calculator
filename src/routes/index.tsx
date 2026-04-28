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
  WaterfallChart,
} from "@/components/bia/Charts";
import { SankeyChart } from "@/components/bia/SankeyChart";
import { BreakdownTable } from "@/components/bia/BreakdownTable";
import { COUNTRIES } from "@/lib/bia/countries";
import { makeCurrencyFormatters } from "@/lib/bia/format";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";

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
            <Badge variant="outline">{country.name}</Badge>
            {model.isCustom && <Badge variant="secondary">Custom</Badge>}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 p-6">
        <aside className="lg:sticky lg:top-[81px] lg:self-start lg:max-h-[calc(100vh-97px)] lg:overflow-y-auto pr-1">
          <ControlCenter model={model} />
        </aside>

        <main className="space-y-6 min-w-0">
          <KpiCards result={model.result} currency={currencyFmt} />
          <BreakdownTable result={model.result} currency={currencyFmt} />
          <SankeyChart result={model.result} deltas={model.deltas} />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <DalyAttributionChart result={model.result} />
            <ClinicalChart result={model.result} />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <CostChart result={model.result} currency={currencyFmt} />
            <WaterfallChart result={model.result} currency={currencyFmt} />
          </div>
          <CostEffectivenessPlane
            result={model.result}
            inputs={model.inputs}
            currency={currencyFmt}
          />
        </main>
      </div>
      </div>
    </div>
  );
}
