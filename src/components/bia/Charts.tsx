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
import { ARM_LABELS, type CurrencyFormatters } from "@/lib/bia/format";
import type { BiaResult } from "@/lib/bia/types";

interface Props {
  result: BiaResult;
  currency: CurrencyFormatters;
}

export function CostChart({ result, currency }: Props) {
  const { fmtCurrency } = currency;
  const totalSq = result.breakdown.reduce((s, b) => s + b.cost0, 0);
  const totalInt = result.breakdown.reduce((s, b) => s + b.cost1, 0);
  const data = [
    ...result.breakdown.map((b) => ({
      arm: ARM_LABELS[b.arm],
      "Status Quo": b.cost0,
      Intervention: b.cost1,
    })),
    { arm: "Grand Total", "Status Quo": totalSq, Intervention: totalInt },
  ];
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Total Cost by Arm (incl. Grand Total)</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="arm" tick={{ fontSize: 11 }} />
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
  const perArm = result.breakdown
    .filter((b) => Math.abs(b.deltaCost) > 0.01)
    .map((b) => ({
      arm: ARM_LABELS[b.arm],
      delta: b.deltaCost,
      isTotal: false,
    }));
  const totalDelta = result.breakdown.reduce((s, b) => s + b.deltaCost, 0);
  const data = [...perArm, { arm: "Grand Total Δ", delta: totalDelta, isTotal: true }];
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Per-Arm Contribution to Budget Δ (incl. Total)</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="arm" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => fmtCurrency(Number(v))} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => fmtCurrency(Number(v))} />
            <Bar dataKey="delta">
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={
                    d.isTotal
                      ? d.delta >= 0
                        ? "hsl(0 75% 45%)"
                        : "hsl(160 70% 35%)"
                      : d.delta >= 0
                        ? "hsl(0 70% 55%)"
                        : "hsl(160 60% 45%)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
