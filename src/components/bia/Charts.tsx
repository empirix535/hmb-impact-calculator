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
  d: number; // total DALYs
  c: number; // total cost
  status: "Dominant" | "Efficient" | "Dominated";
  isHIud?: boolean;
  isPool?: boolean;
};

function classifyFrontier(points: { d: number; c: number }[]): boolean[] {
  // Non-dominated = no other point has d <= and c <= with at least one strict.
  return points.map((p, i) => {
    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      const q = points[j];
      const le = q.d <= p.d && q.c <= p.c;
      const lt = q.d < p.d || q.c < p.c;
      if (le && lt) return false;
    }
    return true;
  });
}

export function CostEffectivenessPlane({ result, inputs, currency }: CEPlaneProps) {
  const { fmtCurrency } = currency;
  const pop = result.population;
  const arms = ["hIud", "ns", "surgical", "untreated"] as const;

  const armPts = arms.map((a) => ({
    key: a,
    name: ARM_LABELS[a],
    d: inputs.dalys[a] * pop,
    c: inputs.costs[a] * pop,
  }));

  // Pooled status quo (moves with slider via MS1 — represents counterfactual mix)
  const ms = inputs.marketShares1;
  const poolD =
    (ms.hIud * inputs.dalys.hIud +
      ms.ns * inputs.dalys.ns +
      ms.surgical * inputs.dalys.surgical +
      ms.untreated * inputs.dalys.untreated) *
    pop;
  const poolC =
    (ms.hIud * inputs.costs.hIud +
      ms.ns * inputs.costs.ns +
      ms.surgical * inputs.costs.surgical +
      ms.untreated * inputs.costs.untreated) *
    pop;

  const all = [...armPts, { key: "pool" as const, name: "Pooled Counterfactual", d: poolD, c: poolC }];
  const eff = classifyFrontier(all);

  const points: CEPoint[] = all.map((p, i) => {
    let status: CEPoint["status"] = eff[i] ? "Efficient" : "Dominated";
    return {
      ...p,
      status,
      isHIud: p.key === "hIud",
      isPool: p.key === "pool",
    };
  });

  // Mark a single dominant if it strictly dominates all others
  const dominantIdx = points.findIndex((p, i) =>
    points.every((q, j) => i === j || (p.d <= q.d && p.c <= q.c && (p.d < q.d || p.c < q.c))),
  );
  if (dominantIdx >= 0) points[dominantIdx].status = "Dominant";

  // Frontier line: efficient points sorted by DALYs ascending
  const frontier = points
    .filter((p) => p.status !== "Dominated")
    .sort((a, b) => a.d - b.d)
    .map((p) => ({ d: p.d, c: p.c }));

  const ds = points.map((p) => p.d);
  const cs = points.map((p) => p.c);
  const dMin = Math.min(...ds);
  const dMax = Math.max(...ds);
  const cMin = Math.min(...cs);
  const cMax = Math.max(...cs);
  const padD = (dMax - dMin) * 0.12 || dMax * 0.1 || 1;
  const padC = (cMax - cMin) * 0.12 || cMax * 0.1 || 1;
  const xDomain: [number, number] = [Math.max(0, dMin - padD), dMax + padD];
  const yDomain: [number, number] = [Math.max(0, cMin - padC), cMax + padC];

  // Value zone = bottom-left quadrant relative to median split
  const dMid = (xDomain[0] + xDomain[1]) / 2;
  const cMid = (yDomain[0] + yDomain[1]) / 2;

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

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Cost-Effectiveness Plane (Efficiency Frontier)</CardTitle>
        <p className="text-[11px] text-muted-foreground pt-1">
          Each strategy plotted by total population health burden vs. total 5-year cost. The dashed
          line traces the efficiency frontier (non-dominated strategies). The bottom-left quadrant
          is the Value Zone — lower cost and lower disease burden.
        </p>
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%", height: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <ReferenceArea
                x1={xDomain[0]}
                x2={dMid}
                y1={yDomain[0]}
                y2={cMid}
                fill="hsl(160 70% 45%)"
                fillOpacity={0.06}
                label={{
                  value: "Value Zone",
                  position: "insideBottomLeft",
                  fill: "hsl(160 60% 35%)",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
              <XAxis
                type="number"
                dataKey="d"
                domain={xDomain}
                tickFormatter={(v) => fmtInt(Number(v))}
                tick={{ fontSize: 11 }}
                label={{
                  value: "Health Burden (Total DALYs)",
                  position: "insideBottom",
                  offset: -8,
                  style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" },
                }}
              />
              <YAxis
                type="number"
                dataKey="c"
                domain={yDomain}
                tickFormatter={(v) => fmtCurrency(Number(v))}
                tick={{ fontSize: 11 }}
                label={{
                  value: "Economic Burden (Total Costs)",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 11, fill: "hsl(var(--muted-foreground))", textAnchor: "middle" },
                }}
              />
              <ZAxis type="number" dataKey="size" range={[120, 320]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3", stroke: "hsl(var(--muted-foreground))" }}
                content={({ active, payload }: any) => {
                  if (!active || !payload?.length) return null;
                  const p: CEPoint & { fill: string } = payload[0].payload;
                  return (
                    <div className="rounded-md border bg-background/95 px-3 py-2 text-xs shadow-md">
                      <div className="font-semibold mb-1" style={{ color: p.fill }}>
                        {p.name}
                      </div>
                      <div className="text-muted-foreground">
                        DALYs: <span className="text-foreground">{fmtInt(p.d)}</span>
                      </div>
                      <div className="text-muted-foreground">
                        Cost: <span className="text-foreground">{fmtCurrency(p.c)}</span>
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
                                  : "hsl(0 70% 45%)",
                          }}
                        >
                          {p.status}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
              {/* Efficiency Frontier line */}
              <Line
                data={frontier}
                dataKey="c"
                type="linear"
                stroke="hsl(217 91% 50%)"
                strokeWidth={1.5}
                strokeDasharray="6 4"
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
