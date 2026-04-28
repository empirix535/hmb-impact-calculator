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
import { ARM_LABELS, fmtInt, type CurrencyFormatters } from "@/lib/bia/format";
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
      metric: "HMB prevalence",
      "Status Quo": result.hmbPrevalenceSq * 100,
      Intervention: result.hmbPrevalenceInt * 100,
    },
    {
      metric: "Anemia prevalence",
      "Status Quo": result.weightedAnemiaSq * 100,
      Intervention: result.weightedAnemiaInt * 100,
    },
  ];
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Clinical Outcomes (Population-Weighted)</CardTitle>
        <p className="text-[11px] text-muted-foreground pt-1">
          Estimated population-level prevalence of HMB and Anemia, reflecting the net clinical
          impact of shifting treatment distributions across the cohort.
        </p>
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
              <YAxis
                tickFormatter={(v) => `${v.toFixed(0)}%`}
                tick={{ fontSize: 11 }}
                label={{
                  value: "Prevalence (%)",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 11, fill: "hsl(var(--muted-foreground))", textAnchor: "middle" },
                }}
              />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
                formatter={(v: number, _n, p: any) => [`${Number(v).toFixed(2)}%`, `${p?.payload?.metric === "HMB prevalence" ? "HMB Prevalence" : p?.name}`]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar
                dataKey="Status Quo"
                fill="hsl(220 13% 65%)"
                activeBar={{ stroke: "hsl(0 0% 100%)", strokeWidth: 2, style: { filter: "brightness(1.1)" } }}
              />
              <Bar
                dataKey="Intervention"
                fill="hsl(173 58% 45%)"
                activeBar={{ stroke: "hsl(0 0% 100%)", strokeWidth: 2, style: { filter: "brightness(1.1)" } }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
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
  const data = [...perArm, { arm: "Net Budget Impact", delta: totalDelta, isTotal: true }];
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-sm">Per-Arm Contribution to Budget Δ (incl. Net Impact)</CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "hsl(0 75% 45%)" }} />
              Net cost
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "hsl(160 70% 35%)" }} />
              Net savings
            </span>
          </div>
        </div>
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

export function DalyAttributionChart({ result }: { result: BiaResult }) {
  const data = [
    { src: "From Non-Surgical", value: result.dalysAvertedByArm.ns, isTotal: false },
    { src: "From Surgical", value: result.dalysAvertedByArm.surgical, isTotal: false },
    { src: "From Untreated", value: result.dalysAvertedByArm.untreated, isTotal: false },
    { src: "Total Averted (Pooled)", value: result.dalysAverted, isTotal: true },
  ];
  const hasNegative = data.some((d) => d.value < 0);
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">DALY Attribution Analysis</CardTitle>
        <p className="text-[11px] text-muted-foreground pt-1">
          Net population health gain from women transitioned to H-IUD from each baseline arm.
          Reflects a marginal change of (Dᵢ − D_H) DALYs per woman transitioned.
        </p>
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} horizontal vertical={false} />
            <XAxis dataKey="src" tick={{ fontSize: 11 }} />
            <YAxis
              tickFormatter={(v) => fmtInt(Number(v))}
              tick={{ fontSize: 11 }}
              domain={["auto", "auto"]}
              label={{
                value: "Total Discounted DALYs Averted",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 11, fill: "hsl(var(--muted-foreground))", textAnchor: "middle" },
              }}
            />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
              formatter={(v: number) => [`Total DALYs Averted: ${fmtInt(Number(v))}`, ""]}
              labelFormatter={(l: string) => l}
              separator=""
            />
            <Bar
              dataKey="value"
              activeBar={{ stroke: "hsl(0 0% 100%)", strokeWidth: 2, style: { filter: "brightness(1.1)" } }}
            >
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={
                    d.isTotal
                      ? d.value >= 0
                        ? "hsl(265 70% 50%)"
                        : "hsl(0 75% 45%)"
                      : d.value >= 0
                        ? "hsl(173 58% 45%)"
                        : "hsl(0 70% 55%)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface ValueFrontierProps {
  inputs: BiaInputs;
  deltas: { ns: number; surgical: number; untreated: number };
  currency: CurrencyFormatters;
}

export function ValueFrontierChart({ inputs, deltas, currency }: ValueFrontierProps) {
  const [wtp, setWtp] = useState<number>(200_000); // in LCU per DALY averted
  const { fmtCurrency, unit, rate } = currency;

  const data = useMemo(() => {
    const points: Array<{
      coverage: number;
      budget: number;
      dalys: number;
      benchmark: number;
      netValue: number | null;
    }> = [];
    for (let pct = 0; pct <= 100; pct += 2) {
      const target = pct / 100;
      const shift = computeShift(inputs.marketShares0, target, deltas);
      const r = runBia({ ...inputs, marketShares1: shift.marketShares1 });
      const benchmark = r.dalysAverted * wtp;
      points.push({
        coverage: pct,
        budget: r.budgetImpact,
        dalys: r.dalysAverted,
        benchmark,
        netValue: r.budgetImpact < benchmark ? r.budgetImpact : null,
      });
    }
    return points;
  }, [inputs, deltas, wtp]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-sm">WTP Value Frontier</CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "hsl(0 75% 45%)" }} />
              Net Budget Impact
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "hsl(265 70% 50%)" }} />
              Benchmark (WTP × DALYs)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "hsl(173 58% 45%)" }} />
              DALYs Averted
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">WTP Threshold per DALY Averted</Label>
            <span className="text-xs font-mono font-semibold">
              {Math.round(wtp * rate).toLocaleString("en-US")} {unit}
            </span>
          </div>
          <Slider
            value={[wtp]}
            min={0}
            max={1_000_000}
            step={10_000}
            onValueChange={([v]) => setWtp(v)}
          />
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="coverage"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${v}%`}
                label={{ value: "H-IUD Coverage", position: "insideBottom", offset: -2, style: { fontSize: 11 } }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => fmtCurrency(Number(v))}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => fmtInt(Number(v))}
              />
              <Tooltip
                formatter={(v: number, name: string) => {
                  if (name === "DALYs Averted") return [`Total DALYs Averted: ${fmtInt(Number(v))}`, name];
                  if (name === "Net Value Zone") return [fmtCurrency(Number(v)), name];
                  return [fmtCurrency(Number(v)), name];
                }}
                labelFormatter={(l) => `Coverage: ${l}%`}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="netValue"
                name="Net Value Zone"
                stroke="none"
                fill="hsl(160 70% 45%)"
                fillOpacity={0.18}
                isAnimationActive={false}
                connectNulls={false}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="budget"
                name="Net Budget Impact"
                stroke="hsl(0 75% 45%)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="benchmark"
                name="Value Benchmark"
                stroke="hsl(265 70% 50%)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="dalys"
                name="DALYs Averted"
                stroke="hsl(173 58% 45%)"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
