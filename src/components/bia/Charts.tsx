import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ComposedChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { useEffect, useRef, useState } from "react";
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
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} style={{ pointerEvents: "none" }} />
              <XAxis dataKey="metric" tick={{ fontSize: 11 }} style={{ pointerEvents: "none" }} />
              <YAxis
                tickFormatter={(v) => `${v.toFixed(0)}%`}
                tick={{ fontSize: 11 }}
                style={{ pointerEvents: "none" }}
                label={{
                  value: "Prevalence (%)",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 11, fill: "var(--muted-foreground)", textAnchor: "middle" },
                }}
              />
              <Tooltip
                cursor={false}
                shared={false}
                {...({ tooltipType: "item" } as any)}
                formatter={(v: number, _n, p: any) => [`${Number(v).toFixed(2)}%`, `${p?.payload?.metric === "HMB prevalence" ? "HMB Prevalence" : p?.name}`]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar
                dataKey="Status Quo"
                fill="hsl(220 13% 65%)"
                radius={3}
                {...({ tooltipType: "item" } as any)}
                activeBar={{ stroke: "hsl(0 0% 100%)", strokeWidth: 2, style: { filter: "brightness(1.1)" } }}
              />
              <Bar
                dataKey="Intervention"
                fill="hsl(173 58% 45%)"
                radius={3}
                {...({ tooltipType: "item" } as any)}
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
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} horizontal vertical={false} style={{ pointerEvents: "none" }} />
            <XAxis
              dataKey="src"
              interval={0}
              tickLine={false}
              height={48}
              tick={(props: any) => {
                const { x, y, payload } = props;
                const words = String(payload.value).split(" ");
                const lines: string[] = [];
                let cur = "";
                const maxChars = 12;
                words.forEach((w) => {
                  if ((cur + " " + w).trim().length > maxChars) {
                    if (cur) lines.push(cur);
                    cur = w;
                  } else {
                    cur = (cur + " " + w).trim();
                  }
                });
                if (cur) lines.push(cur);
                return (
                  <g transform={`translate(${x},${y + 4})`} style={{ pointerEvents: "none" }}>
                    {lines.map((ln, i) => (
                      <text
                        key={i}
                        x={0}
                        y={i * 12}
                        dy={10}
                        textAnchor="middle"
                        fontSize={11}
                        fill="var(--muted-foreground)"
                      >
                        {ln}
                      </text>
                    ))}
                  </g>
                );
              }}
              style={{ pointerEvents: "none" }}
            />
            <YAxis
              tickFormatter={(v) => fmtInt(Number(v))}
              tick={{ fontSize: 11 }}
              domain={["auto", "auto"]}
              style={{ pointerEvents: "none" }}
              label={{
                value: "Total Discounted DALYs Averted",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 11, fill: "var(--muted-foreground)", textAnchor: "middle" },
              }}
            />
            <Tooltip
              cursor={false}
              shared={false}
              {...({ tooltipType: "item" } as any)}
              formatter={(v: number) => [`Total DALYs Averted: ${fmtInt(Number(v))}`, ""]}
              labelFormatter={(l: string) => l}
              separator=""
            />
            <Bar
              dataKey="value"
              radius={3}
              {...({ tooltipType: "item" } as any)}
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
  c: number; // total cost (X) — relative to Untreated baseline
  b: number; // total DALYs averted (Y) vs Untreated baseline
  isHIud?: boolean;
  isPool?: boolean;
  fill: string;
  r: number;
};

export function CostEffectivenessPlane({ result, inputs, currency }: CEPlaneProps) {
  const { fmtCurrency } = currency;
  const pop = result.population;
  const arms = ["hIud", "ns", "surgical", "untreated"] as const;

  // X = absolute total 5-year cost. Y = total DALYs averted vs Untreated baseline.
  const dU = inputs.dalys.untreated;
  const armPts = arms.map((a) => ({
    key: a,
    name: ARM_LABELS[a],
    c: inputs.costs[a] * pop,
    b: (dU - inputs.dalys[a]) * pop,
  }));

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

  const colorFor = (key: string): string => {
    if (key === "hIud") return "hsl(265 70% 50%)";
    if (key === "pool") return "hsl(35 90% 50%)";
    if (key === "ns") return "hsl(173 58% 45%)";
    if (key === "surgical") return "hsl(217 91% 60%)";
    return "hsl(0 70% 55%)"; // untreated
  };

  const points: CEPoint[] = [
    ...armPts.map((p) => ({
      ...p,
      isHIud: p.key === "hIud",
      isPool: false,
      fill: colorFor(p.key),
      r: p.key === "hIud" ? 10 : 7,
    })),
    {
      key: "pool" as const,
      name: "Population Average",
      c: poolC,
      b: poolB,
      isHIud: false,
      isPool: true,
      fill: colorFor("pool"),
      r: 8,
    },
  ];

  // Frontier: non-dominated anchors (lower cost AND higher DALYs averted is better).
  const armOnly = points.filter((p) => !p.isPool);
  const nonDominated = armOnly.filter((p, i) =>
    armOnly.every((q, j) => {
      if (i === j) return true;
      const le = q.c <= p.c && q.b >= p.b;
      const lt = q.c < p.c || q.b > p.b;
      return !(le && lt);
    }),
  );
  const frontier = [...nonDominated].sort((a, b) => a.c - b.c);

  // Plot domain — pad min/max so dots don't sit on the axes.
  const cs = points.map((p) => p.c);
  const bs = points.map((p) => p.b);
  const cMin = Math.min(...cs);
  const cMax = Math.max(...cs);
  const bMin = Math.min(...bs);
  const bMax = Math.max(...bs);
  const cPad = (cMax - cMin) * 0.12 || cMax * 0.1 || 1;
  const bPad = (bMax - bMin) * 0.12 || bMax * 0.1 || 1;
  const xMin = Math.max(0, cMin - cPad);
  const xMax = cMax + cPad;
  const yMin = Math.max(0, bMin - bPad);
  const yMax = bMax + bPad;

  // SVG geometry — measured from the container so the plot fills its panel.
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 720, h: 420 });
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect;
      setSize({ w: Math.max(320, cr.width), h: Math.max(280, cr.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const W = size.w;
  const H = size.h;
  const M = { top: 24, right: 110, bottom: 56, left: 110 };
  const innerW = Math.max(50, W - M.left - M.right);
  const innerH = Math.max(50, H - M.top - M.bottom);
  const xScale = (c: number) => M.left + ((c - xMin) / (xMax - xMin)) * innerW;
  // Higher DALYs averted = better → render at the top.
  const yScale = (b: number) => M.top + innerH - ((b - yMin) / (yMax - yMin)) * innerH;

  // Tick generation (5 ticks across the [min, max] domain).
  const niceTicks = (lo: number, hi: number, n = 5) => {
    const step = (hi - lo) / n;
    return Array.from({ length: n + 1 }, (_, i) => lo + i * step);
  };
  const xTicks = niceTicks(xMin, xMax);
  const yTicks = niceTicks(yMin, yMax);

  // Local-state tooltip (the "nuclear fix"). wrapRef declared above for sizing.
  const [tip, setTip] = useState<{
    x: number;
    y: number;
    point: CEPoint;
  } | null>(null);

  const showTip = (e: React.MouseEvent, p: CEPoint) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top, point: p });
  };
  const moveTip = (e: React.MouseEvent) => {
    if (!tip) return;
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTip({ ...tip, x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  const hideTip = () => setTip(null);

  // Hide tooltip when underlying data changes (e.g. coverage slider moves).
  useEffect(() => {
    setTip(null);
  }, [poolC, poolB]);

  const poolPt = points.find((p) => p.isPool)!;
  const poolCx = xScale(poolPt.c);
  const poolCy = yScale(poolPt.b);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Benefit-Cost Efficiency Frontier</CardTitle>
        <p className="text-[11px] text-muted-foreground pt-1">
          Each colored dot represents a scenario where that single treatment
          covers 100% of the HMB population — its total 5-year cost vs. total
          5-year DALYs (absolute levels — higher DALYs averted and lower cost are
          better). The dashed line traces the non-dominated frontier. The orange
          dot is the population average under the current coverage mix.
        </p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <div ref={wrapRef} className="relative w-full flex-1 min-h-[320px] max-h-[440px] aspect-[16/7]">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            style={{ display: "block", width: "100%", height: "100%" }}
          >
            {/* Per-dot grid lines (excluding pooled counterfactual) */}
            {points.filter((p) => !p.isPool).map((p) => (
              <g key={`grid-${p.key}`}>
                <line
                  x1={xScale(p.c)}
                  x2={xScale(p.c)}
                  y1={M.top}
                  y2={M.top + innerH}
                  stroke="var(--muted-foreground)"
                  strokeOpacity={0.18}
                  strokeDasharray="3 3"
                />
                <line
                  x1={M.left}
                  x2={M.left + innerW}
                  y1={yScale(p.b)}
                  y2={yScale(p.b)}
                  stroke="var(--muted-foreground)"
                  strokeOpacity={0.18}
                  strokeDasharray="3 3"
                />
              </g>
            ))}

            {/* Axes */}
            <line
              x1={M.left}
              x2={M.left + innerW}
              y1={M.top + innerH}
              y2={M.top + innerH}
              stroke="var(--muted-foreground)"
              strokeOpacity={0.5}
            />
            <line
              x1={M.left}
              x2={M.left}
              y1={M.top}
              y2={M.top + innerH}
              stroke="var(--muted-foreground)"
              strokeOpacity={0.5}
            />

            {/* Per-dot axis value labels (only fixed strategy dots) */}
            {points.filter((p) => !p.isPool).map((p) => (
              <g key={`val-${p.key}`}>
                <text
                  x={xScale(p.c)}
                  y={M.top + innerH + 14}
                  textAnchor="middle"
                  fontSize={10}
                  fill={p.fill}
                  fontWeight={600}
                >
                  {fmtCurrency(p.c)}
                </text>
                <text
                  x={M.left - 8}
                  y={yScale(p.b) + 3}
                  textAnchor="end"
                  fontSize={10}
                  fill={p.fill}
                  fontWeight={600}
                >
                  {fmtInt(p.b)}
                </text>
              </g>
            ))}

            {/* Axis titles */}
            <text
              x={M.left + innerW / 2}
              y={H - 14}
              textAnchor="middle"
              fontSize={11}
              fill="var(--muted-foreground)"
            >
              Total 5-Year Population Cost
            </text>
            <text
              x={18}
              y={M.top + innerH / 2}
              textAnchor="middle"
              fontSize={11}
              fill="var(--muted-foreground)"
              transform={`rotate(-90 18 ${M.top + innerH / 2})`}
            >
              Total 5-Year DALYs Averted
            </text>

            {/* Pooled crosshair drop-lines (very subtle) */}
            <line
              x1={poolCx}
              x2={poolCx}
              y1={M.top + innerH}
              y2={poolCy}
              stroke={colorFor("pool")}
              strokeOpacity={0.2}
              strokeDasharray="3 3"
              pointerEvents="none"
            />
            <line
              x1={M.left}
              x2={poolCx}
              y1={poolCy}
              y2={poolCy}
              stroke={colorFor("pool")}
              strokeOpacity={0.2}
              strokeDasharray="3 3"
              pointerEvents="none"
            />

            {/* Frontier line (translucent dashed) */}
            {frontier.length >= 2 && (
              <polyline
                points={frontier.map((p) => `${xScale(p.c)},${yScale(p.b)}`).join(" ")}
                fill="none"
                stroke="hsl(217 91% 50%)"
                strokeWidth={1.6}
                strokeDasharray="5 5"
                strokeOpacity={0.4}
                pointerEvents="none"
              />
            )}

            {/* Dots — only these have hover handlers */}
            {points.map((p) => {
              const cx = xScale(p.c);
              const cy = yScale(p.b);
              // Label at 1-2 o'clock (offset NE)
              const lx = cx + p.r + 6;
              const ly = cy - p.r - 4;
              return (
                <g key={p.key}>
                  {p.isHIud && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={p.r + 6}
                      fill={p.fill}
                      opacity={0.18}
                      pointerEvents="none"
                      style={{ animation: "pulse 2s ease-in-out infinite" }}
                    />
                  )}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={p.r}
                    fill={p.fill}
                    stroke="hsl(0 0% 100%)"
                    strokeWidth={p.isHIud ? 2.5 : 1.5}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={(e) => showTip(e, p)}
                    onMouseMove={moveTip}
                    onMouseLeave={hideTip}
                  />
                  <text
                    x={lx}
                    y={ly}
                    fontSize={10}
                    fill="var(--foreground)"
                    fontWeight={p.isHIud ? 600 : 500}
                    pointerEvents="none"
                  >
                    {p.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Custom HTML tooltip — only renders when a dot is hovered */}
          {tip && (
            <div
              className="absolute pointer-events-none text-xs font-medium"
              style={{
                left: tip.x + 12,
                top: tip.y + 12,
                color: tip.point.fill,
                textShadow:
                  "0 0 3px var(--background), 0 0 3px var(--background), 0 0 3px var(--background)",
                whiteSpace: "nowrap",
              }}
            >
              <div className="font-semibold mb-0.5">{tip.point.name}</div>
              <div>Cost: {fmtCurrency(tip.point.c)}</div>
              <div>DALYs Averted: {fmtInt(tip.point.b)}</div>
            </div>
          )}

          {/* Value Direction key — inside plot area, bottom-right */}
          <div
            className="absolute pointer-events-none select-none"
            style={{
              right: `calc(${(M.right / W) * 100}% + 12px)`,
              bottom: `calc(${(M.bottom / H) * 100}% + 12px)`,
              width: 84,
              height: 84,
              color: "hsl(160 60% 32%)",
            }}
            aria-label="Value Direction key"
          >
            <svg viewBox="0 0 100 100" width="100%" height="100%">
              <defs>
                <marker
                  id="vd-arrow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
                </marker>
              </defs>
              <line x1="60" y1="60" x2="60" y2="20" stroke="currentColor" strokeWidth="1.4" markerEnd="url(#vd-arrow)" opacity="0.85" />
              <line x1="60" y1="60" x2="20" y2="60" stroke="currentColor" strokeWidth="1.4" markerEnd="url(#vd-arrow)" opacity="0.85" />
              <line x1="60" y1="60" x2="34" y2="34" stroke="currentColor" strokeWidth="1.1" markerEnd="url(#vd-arrow)" opacity="0.6" strokeDasharray="2 2" />
              <text x="64" y="16" fontSize="7" fill="currentColor" fontWeight="600">Higher</text>
              <text x="64" y="24" fontSize="7" fill="currentColor" fontWeight="600">Benefit</text>
              <text x="18" y="74" fontSize="7" fill="currentColor" fontWeight="600">Lower</text>
              <text x="18" y="82" fontSize="7" fill="currentColor" fontWeight="600">Cost</text>
            </svg>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

