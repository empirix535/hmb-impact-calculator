import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, Activity, DollarSign, HeartPulse, Users } from "lucide-react";
import { fmtInt, fmtPct, type CurrencyFormatters } from "@/lib/bia/format";
import type { BiaResult } from "@/lib/bia/types";

interface Props {
  result: BiaResult;
  currency: CurrencyFormatters;
}

export function KpiCards({ result, currency }: Props) {
  const { fmtCurrency, fmtCurrencyExact } = currency;
  const positiveBudget = result.budgetImpact >= 0;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Kpi
        icon={<DollarSign className="h-4 w-4" />}
        label="5-yr Budget Impact"
        value={fmtCurrency(result.budgetImpact)}
        sub={`${positiveBudget ? "+" : ""}${fmtPct(result.budgetImpactPct, 1)} vs Status Quo`}
        accent={positiveBudget ? "neg" : "pos"}
        icon2={positiveBudget ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      />
      <Kpi
        icon={<Users className="h-4 w-4" />}
        label="Cost per patient"
        value={fmtCurrencyExact(result.perPatientInt)}
        sub={`Δ ${fmtCurrency(result.perPatientInt - result.perPatientSq)} vs SQ`}
      />
      <Kpi
        icon={<Activity className="h-4 w-4" />}
        label="HMB cases averted"
        value={fmtInt(result.hmbCasesAverted)}
        sub={`HMB −${fmtPct(result.hmbPrevalenceSq - result.hmbPrevalenceInt, 2)}`}
        accent="pos"
      />
      <Kpi
        icon={<HeartPulse className="h-4 w-4" />}
        label="Anemia cases averted"
        value={fmtInt(result.anemiaCasesAverted)}
        sub={`Anemia −${fmtPct(result.weightedAnemiaSq - result.weightedAnemiaInt, 2)}`}
        accent="pos"
      />
    </div>
  );
}

function Kpi({
  icon,
  icon2,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  icon2?: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent?: "pos" | "neg";
}) {
  const accentClass =
    accent === "pos"
      ? "text-emerald-600"
      : accent === "neg"
        ? "text-amber-600"
        : "text-muted-foreground";
  return (
    <Card>
      <CardContent className="p-5 space-y-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
            {icon}
            {label}
          </div>
          {icon2}
        </div>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className={`text-xs ${accentClass}`}>{sub}</div>
      </CardContent>
    </Card>
  );
}
