import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Scatter,
  ComposedChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ARM_LABELS, fmtInt, type CurrencyFormatters } from "@/lib/bia/format";
import type { BiaInputs, BiaResult } from "@/lib/bia/types";

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
interface CEPlaneProps {
  result: BiaResult;
  inputs: BiaInputs;
  currency: CurrencyFormatters;
}

type CEPoint = {
  key: "hIud" | "ns" | "surgical" | "untreated" | "pool";
  name: string;
  c: number; // total cost (X)
  b: number; // total DALYs averted vs Untreated baseline (Y)
  status: "Dominant" | "Efficient" | "Dominated" | "Baseline";
  isHIud?: boolean;
  isPool?: boolean;
};

// Upper-left frontier in (cost, benefit) space:
// Non-dominated = no other point has c <= and b >= with at least one strict.
function classifyBenefitFrontier(points: { c: number; b: number }[]): boolean[] {
  return points.map((p, i) => {
    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      const q = points[j];
      const le = q.c <= p.c && q.b >= p.b;
      const lt = q.c < p.c || q.b > p.b;
      if (le && lt) return false;
    }
    return true;
  });
}

export function CostEffectivenessPlane({ result, inputs, currency }: CEPlaneProps) {
  const { fmtCurrency } = currency;
  const pop = result.population;
  const arms = ["hIud", "ns", "surgical", "untreated"] as const;

  const dU = inputs.dalys.untreated;

  const armPts = arms.map((a) => ({
    key: a,
    name: ARM_LABELS[a],
    c: inputs.costs[a] * pop,
    b: (dU - inputs.dalys[a]) * pop, // DALYs averted vs Untreated
  }));

  // Pooled counterfactual (moves with slider via MS1)
  const ms = inputs.marketShares1;
  const poolC =
    (ms.hIud * inputs.costs.hIud +
      ms.ns * inputs.costs.ns +
      ms.surgical * inputs.costs.surgical +
      ms.untreated * inputs.costs.untreated) *
    pop;
  const poolDaly =
    ms.hIud * inputs.dalys.hIud +
      ms.ns * inputs.dalys.ns +
      ms.surgical * inputs.dalys.surgical +
      ms.untreated * inputs.dalys.untreated;
  const poolB = (dU - poolDaly) * pop;

  const all = [
    ...armPts,
    { key: "pool" as const, name: "Pooled Counterfactual", c: poolC, b: poolB },
  ];
  const eff = classifyBenefitFrontier(all);

  const points: CEPoint[] = all.map((p, i) => {
    const status: CEPoint["status"] =
      p.key === "untreated" ? "Baseline" : eff[i] ? "Efficient" : "Dominated";
    return {
      ...p,
      status,
      isHIud: p.key === "hIud",
      isPool: p.key === "pool",
    };
  });

  // Identify a dominant strategy (strictly dominates all others in cost & benefit)
  const dominantIdx = points.findIndex((p, i) =>
    points.every(
      (q, j) =>
        i === j || (p.c <= q.c && p.b >= q.b && (p.c < q.c || p.b > q.b)),
    ),
  );
  if (dominantIdx >= 0 && points[dominantIdx].key !== "untreated")
    points[dominantIdx].status = "Dominant";

  // Frontier line: non-dominated points (excluding the moving pool) sorted by cost asc
  const frontier = points
    .filter((p) => p.status !== "Dominated" && !p.isPool)
    .sort((a, b) => a.c - b.c)
    .map((p) => ({ c: p.c, b: p.b, name: p.name }));

  // ICER segments (slope between consecutive frontier points)
  const icers: { from: string; to: string; icer: number }[] = [];
  for (let i = 1; i < frontier.length; i++) {
    const prev = frontier[i - 1];
    const cur = frontier[i];
    const dB = cur.b - prev.b;
    const dC = cur.c - prev.c;
    icers.push({ from: prev.name, to: cur.name, icer: dB > 0 ? dC / dB : NaN });
  }

  const cs = points.map((p) => p.c);
  const bs = points.map((p) => p.b);
  const cMin = Math.min(0, ...cs);
  const cMax = Math.max(...cs);
  const bMin = Math.min(0, ...bs);
  const bMax = Math.max(...bs);
  const padC = (cMax - cMin) * 0.12 || cMax * 0.1 || 1;
  const padB = (bMax - bMin) * 0.15 || bMax * 0.15 || 1;
  const xDomain: [number, number] = [Math.max(0, cMin - padC), cMax + padC];
  const yDomain: [number, number] = [bMin - padB * 0.4, bMax + padB];

  const colorFor = (p: CEPoint) => {
    if (p.isHIud) return "hsl(265 70% 50%)";
    if (p.isPool) return "hsl(35 90% 50%)";
    if (p.key === "ns") return "hsl(173 58% 45%)";
    if (p.key === "surgical") return "hsl(217 91% 60%)";
    return "hsl(0 70% 55%)"; // untreated
  };

  const scatterData = points.map((p) => ({
    ...p,
    fill: colorFor(p),
    size: p.isHIud ? 280 : p.isPool ? 220 : 160,
  }));

  // ICER lookup by destination point name (for frontier-segment tooltips)
  const icerByTo = new Map(icers.map((s) => [s.to, s]));

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Benefit-Cost Efficiency Frontier</CardTitle>
        <p className="text-[11px] text-muted-foreground pt-1">
          Each strategy plotted by total 5-year cost vs. total DALYs averted
          relative to the Untreated baseline. The solid line traces the efficiency
          frontier (non-dominated strategies); its slope between adjacent points is
          the ICER (cost per additional DALY averted). Points below the frontier
          exhibit extended dominance.
        </p>
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%", height: 380 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart margin={{ top: 16, right: 30, left: 30, bottom: 28 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis
                type="number"
                dataKey="c"
                domain={xDomain}
                tickFormatter={(v) => fmtCurrency(Number(v))}
                tick={{ fontSize: 11 }}
                label={{
                  value: "Total 5-Year Population Cost",
                  position: "insideBottom",
                  offset: -10,
                  style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" },
                }}
              />
              <YAxis
                type="number"
                dataKey="b"
                domain={yDomain}
                tickFormatter={(v) => fmtInt(Number(v))}
                tick={{ fontSize: 11 }}
                label={{
                  value: "Total DALYs Averted (Population Health Benefit)",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 11, fill: "hsl(var(--muted-foreground))", textAnchor: "middle" },
                }}
              />
              <ZAxis type="number" dataKey="size" range={[120, 320]} />
              {/* Top-left value zone label */}
              <text
                x="6%"
                y="8%"
                fontSize={11}
                fontWeight={600}
                fill="hsl(160 60% 35%)"
              >
                ↖ Optimal Value Zone (Max Benefit, Min Cost)
              </text>
              <Tooltip
                cursor={{ strokeDasharray: "3 3", stroke: "hsl(var(--muted-foreground))" }}
                content={({ active, payload }: any) => {
                  if (!active || !payload?.length) return null;
                  const p: CEPoint & { fill: string } = payload[0].payload;
                  const icerSeg = icerByTo.get(p.name);
                  return (
                    <div className="rounded-md border bg-background/95 px-3 py-2 text-xs shadow-md max-w-[260px]">
                      <div className="font-semibold mb-1" style={{ color: p.fill }}>
                        {p.name}
                      </div>
                      <div className="text-muted-foreground">
                        Cost: <span className="text-foreground">{fmtCurrency(p.c)}</span>
                      </div>
                      <div className="text-muted-foreground">
                        DALYs averted: <span className="text-foreground">{fmtInt(p.b)}</span>
                      </div>
                      <div className="mt-1 font-medium">
                        Status:{" "}
                        <span
                          style={{
                            color:
                              p.status === "Dominant"
                                ? "hsl(160 70% 35%)"
                                : p.status === "Efficient"
                                  ? "hsl(217 91% 50%)"
                                  : p.status === "Baseline"
                                    ? "hsl(var(--muted-foreground))"
                                    : "hsl(0 70% 45%)",
                          }}
                        >
                          {p.status}
                        </span>
                      </div>
                      {icerSeg && Number.isFinite(icerSeg.icer) && (
                        <div className="mt-2 pt-2 border-t text-[11px] text-muted-foreground leading-snug">
                          <div className="font-medium text-foreground mb-0.5">
                            ICER vs {icerSeg.from}
                          </div>
                          {fmtCurrency(icerSeg.icer)} per additional DALY averted.
                          <div className="mt-1 italic">
                            The gradient between these points represents the ICER
                            (cost per additional DALY averted).
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              {/* Efficiency Frontier line (solid, concave upper-left envelope) */}
              <Line
                data={frontier}
                dataKey="b"
                type="linear"
                stroke="hsl(217 91% 50%)"
                strokeWidth={2}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
                legendType="none"
              />
              <Scatter
                data={scatterData}
                shape={(props: any) => {
                  const { cx, cy, payload } = props;
                  const r = payload.isHIud ? 11 : payload.isPool ? 9 : 7;
                  return (
                    <g>
                      {payload.isHIud && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={r + 6}
                          fill={payload.fill}
                          opacity={0.18}
                          style={{ animation: "pulse 2s ease-in-out infinite" }}
                        />
                      )}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill={payload.fill}
                        stroke="hsl(0 0% 100%)"
                        strokeWidth={payload.isHIud ? 2.5 : 1.5}
                      />
                      <text
                        x={cx + r + 4}
                        y={cy + 3}
                        fontSize={10}
                        fill="hsl(var(--foreground))"
                        fontWeight={payload.isHIud ? 600 : 500}
                      >
                        {payload.name}
                      </text>
                    </g>
                  );
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
