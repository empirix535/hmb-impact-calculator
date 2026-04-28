import { Layer, Rectangle, ResponsiveContainer, Sankey, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BiaResult } from "@/lib/bia/types";
import type { AltWeights } from "@/lib/bia/types";

interface Props {
  result: BiaResult;
  deltas: AltWeights;
}

const NODE_COLORS: Record<string, string> = {
  "Baseline H-IUD": "hsl(173 58% 55%)",
  "Baseline Surgical": "hsl(215 20% 55%)",
  "Baseline Non-Surgical": "hsl(215 20% 65%)",
  "Baseline Untreated": "hsl(215 20% 75%)",
  "H-IUD": "hsl(173 58% 45%)",
  "Remaining Surgical": "hsl(231 48% 55%)",
  "Remaining Non-Surgical": "hsl(231 48% 65%)",
  "Remaining Untreated": "hsl(231 48% 75%)",
};

function CustomNode(props: any) {
  const { x, y, width, height, index, payload, ...rest } = props;
  const fill = NODE_COLORS[payload.name] ?? "hsl(215 20% 65%)";
  const isLeft = index < 4;
  return (
    <Layer key={`node-${index}`}>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        fillOpacity={0.95}
        style={{ pointerEvents: "all", cursor: "pointer" }}
        {...rest}
      />
      <text
        x={isLeft ? x - 8 : x + width + 8}
        y={y + height / 2}
        textAnchor={isLeft ? "end" : "start"}
        dominantBaseline="middle"
        fontSize={12}
        fill="hsl(var(--foreground))"
        style={{ pointerEvents: "none" }}
      >
        {payload.name}
      </text>
    </Layer>
  );
}

function CustomLink(props: any) {
  const {
    sourceX,
    targetX,
    sourceY,
    targetY,
    sourceControlX,
    targetControlX,
    linkWidth,
    index,
    payload,
    ...rest
  } = props;
  return (
    <path
      key={`link-${index}`}
      d={`
        M${sourceX},${sourceY}
        C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
      `}
      fill="none"
      stroke="hsl(215 25% 50%)"
      strokeOpacity={0.25}
      strokeWidth={linkWidth}
      style={{ pointerEvents: "stroke", cursor: "pointer" }}
      {...rest}
    />
  );
}

export function SankeyChart({ result, deltas }: Props) {
  const population = result.population;
  const ms0 = result.breakdown.reduce(
    (acc, b) => ({ ...acc, [b.arm]: b.ms0 }),
    {} as Record<string, number>,
  );
  const ms1 = result.breakdown.reduce(
    (acc, b) => ({ ...acc, [b.arm]: b.ms1 }),
    {} as Record<string, number>,
  );
  // Link values derive directly from market shares so the diagram stays in sync
  // with the engine. For each baseline arm i:
  //   - flow to H-IUD       = max(0, MS_i,0 - MS_i,1)   (share moved to H-IUD)
  //   - flow to Remaining i = MS_i,1                    (share staying in arm)
  const pullS = Math.max(0, (ms0.surgical ?? 0) - (ms1.surgical ?? 0));
  const pullNS = Math.max(0, (ms0.ns ?? 0) - (ms1.ns ?? 0));
  const pullU = Math.max(0, (ms0.untreated ?? 0) - (ms1.untreated ?? 0));

  const remainS = Math.max(0, ms1.surgical ?? 0);
  const remainNS = Math.max(0, ms1.ns ?? 0);
  const remainU = Math.max(0, ms1.untreated ?? 0);

  // Recharts Sankey requires strictly positive link values.
  const eps = 1e-6;
  const safe = (v: number) => (v > eps ? v : eps);

  const baselineH = ms0.hIud ?? 0;

  const data = {
    nodes: [
      { name: "Baseline H-IUD" },           // 0
      { name: "Baseline Surgical" },        // 1
      { name: "Baseline Non-Surgical" },    // 2
      { name: "Baseline Untreated" },       // 3
      { name: "H-IUD" },                    // 4
      { name: "Remaining Surgical" },       // 5
      { name: "Remaining Non-Surgical" },   // 6
      { name: "Remaining Untreated" },      // 7
    ],
    links: [
      { source: 0, target: 4, value: safe(baselineH) },
      { source: 1, target: 4, value: safe(pullS) },
      { source: 1, target: 5, value: safe(remainS) },
      { source: 2, target: 4, value: safe(pullNS) },
      { source: 2, target: 6, value: safe(remainNS) },
      { source: 3, target: 4, value: safe(pullU) },
      { source: 3, target: 7, value: safe(remainU) },
    ],
  };

  const fmtPeople = (n: number) =>
    new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);

  // Net change per node (intervention vs status quo) in share units.
  const nodeDelta: Record<string, number> = {
    "Baseline H-IUD": 0,
    "Baseline Surgical": 0,
    "Baseline Non-Surgical": 0,
    "Baseline Untreated": 0,
    "H-IUD": (ms1.hIud ?? 0) - (ms0.hIud ?? 0),
    "Remaining Surgical": remainS - (ms0.surgical ?? 0),
    "Remaining Non-Surgical": remainNS - (ms0.ns ?? 0),
    "Remaining Untreated": remainU - (ms0.untreated ?? 0),
  };

  const fmtSigned = (n: number) =>
    `${n >= 0 ? "+" : "−"}${fmtPeople(Math.abs(n))}`;

  const TooltipContent = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const p = payload[0]?.payload;
    if (!p) return null;

    // Link payload has source/target objects; node payload has a name.
    if (p.source && p.target) {
      const share = p.value as number;
      const people = population * share;
      return (
        <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-md">
          <div className="font-medium">
            {p.source.name} → {p.target.name}
          </div>
          <div className="text-muted-foreground">
            {fmtPeople(people)} women ({(share * 100).toFixed(2)}%)
          </div>
        </div>
      );
    }

    const name = p.name as string;
    const share = (p.value as number) ?? 0;
    const people = population * share;
    const delta = nodeDelta[name] ?? 0;
    const deltaPeople = population * delta;
    return (
      <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-md">
        <div className="font-medium">{name}</div>
        <div className="text-muted-foreground">
          {fmtPeople(people)} women ({(share * 100).toFixed(2)}%)
        </div>
        {name.startsWith("Baseline") ? null : (
          <div className={delta >= 0 ? "text-emerald-600" : "text-rose-600"}>
            Δ vs Status Quo: {fmtSigned(deltaPeople)} ({fmtSigned(delta * 100)}%)
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Patient Migration</CardTitle>
      </CardHeader>
      <CardContent className="h-96">
        <div className="flex h-full flex-col">
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <Sankey
                data={data}
                nodePadding={28}
                nodeWidth={14}
                iterations={0}
                margin={{ top: 10, right: 160, bottom: 10, left: 140 }}
                node={<CustomNode />}
                link={<CustomLink />}
              >
                <Tooltip
                  content={<TooltipContent />}
                  wrapperStyle={{ zIndex: 50, pointerEvents: "none" }}
                  isAnimationActive={false}
                />
              </Sankey>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between px-2 pt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <span>Status Quo</span>
            <span>Intervention</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
