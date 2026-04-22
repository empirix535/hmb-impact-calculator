import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ARM_LABELS, fmtPct, type CurrencyFormatters } from "@/lib/bia/format";
import type { BiaResult } from "@/lib/bia/types";

const ARM_COLORS: Record<string, string> = {
  hIud: "hsl(217 91% 60%)",
  ns: "hsl(173 58% 45%)",
  surgical: "hsl(280 60% 55%)",
  untreated: "hsl(30 80% 55%)",
};

interface Props {
  result: BiaResult;
  currency: CurrencyFormatters;
}

export function MarketShareChart({ result }: { result: BiaResult }) {
  const data = [
    {
      name: "Status Quo",
      ...Object.fromEntries(result.breakdown.map((b) => [b.arm, b.ms0 * 100])),
    },
    {
      name: "Intervention",
      ...Object.fromEntries(result.breakdown.map((b) => [b.arm, b.ms1 * 100])),
    },
  ];
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Market Share Mix</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} stackOffset="expand" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(v: number, name) => [fmtPct(Number(v) / 100, 1), ARM_LABELS[name as string] ?? name]}
            />
            <Legend formatter={(v) => ARM_LABELS[v] ?? v} wrapperStyle={{ fontSize: 12 }} />
            {(["hIud", "ns", "surgical", "untreated"] as const).map((arm) => (
              <Bar key={arm} dataKey={arm} stackId="a" fill={ARM_COLORS[arm]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function CostChart({ result, currency }: Props) {
  const { fmtCurrency } = currency;
  const data = result.breakdown.map((b) => ({
    arm: ARM_LABELS[b.arm],
    "Status Quo": b.cost0,
    Intervention: b.cost1,
  }));
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Total Cost by Arm</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="arm" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v) => fmtCurrency(Number(v))} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => fmtCurrency(Number(v))} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Status Quo" fill="hsl(220 13% 65%)" />
            <Bar dataKey="Intervention" fill="hsl(217 91% 60%)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ClinicalChart({ result }: { result: BiaResult }) {
  const data = [
    {
      metric: "HMB resolved",
      "Status Quo": result.weightedEffSq * 100,
      Intervention: result.weightedEffInt * 100,
    },
    {
      metric: "Anemia prevalence",
      "Status Quo": result.weightedAnemiaSq * 100,
      Intervention: result.weightedAnemiaInt * 100,
    },
  ];
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Clinical Outcomes (Population-Weighted)</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v) => `${v.toFixed(0)}%`} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => `${Number(v).toFixed(2)}%`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Status Quo" fill="hsl(220 13% 65%)" />
            <Bar dataKey="Intervention" fill="hsl(173 58% 45%)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function WaterfallChart({ result, currency }: Props) {
  const { fmtCurrency } = currency;
  const data = result.breakdown
    .filter((b) => Math.abs(b.deltaCost) > 0.01)
    .map((b) => ({
      arm: ARM_LABELS[b.arm],
      delta: b.deltaCost,
    }));
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Per-Arm Contribution to Budget Δ</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="arm" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v) => fmtCurrency(Number(v))} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => fmtCurrency(Number(v))} />
            <Bar dataKey="delta">
              {data.map((d, i) => (
                <Cell key={i} fill={d.delta >= 0 ? "hsl(0 70% 55%)" : "hsl(160 60% 45%)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
