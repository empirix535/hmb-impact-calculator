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

function CustomNode({ x, y, width, height, index, payload }: any) {
  const fill = NODE_COLORS[payload.name] ?? "hsl(215 20% 65%)";
  const isLeft = index < 4;
  return (
    <Layer key={`node-${index}`}>
      <Rectangle x={x} y={y} width={width} height={height} fill={fill} fillOpacity={0.95} />
      <text
        x={isLeft ? x - 8 : x + width + 8}
        y={y + height / 2}
        textAnchor={isLeft ? "end" : "start"}
        dominantBaseline="middle"
        fontSize={12}
        fill="hsl(var(--foreground))"
      >
        {payload.name}
      </text>
    </Layer>
  );
}

function CustomLink(props: any) {
  const { sourceX, targetX, sourceY, targetY, sourceControlX, targetControlX, linkWidth, index } = props;
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
  const deltaH = Math.max(0, (ms1.hIud ?? 0) - (ms0.hIud ?? 0));

  // Pulled from each baseline arm into H-IUD, capped by available baseline share.
  const pullS = Math.min(ms0.surgical ?? 0, deltaH * deltas.surgical);
  const pullNS = Math.min(ms0.ns ?? 0, deltaH * deltas.ns);
  const pullU = Math.min(ms0.untreated ?? 0, deltaH * deltas.untreated);

  const remainS = Math.max(0, (ms0.surgical ?? 0) - pullS);
  const remainNS = Math.max(0, (ms0.ns ?? 0) - pullNS);
  const remainU = Math.max(0, (ms0.untreated ?? 0) - pullU);

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

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Patient Migration: Status Quo → Intervention</CardTitle>
      </CardHeader>
      <CardContent className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <Sankey
            data={data}
            nodePadding={28}
            nodeWidth={14}
            margin={{ top: 10, right: 160, bottom: 10, left: 140 }}
            node={<CustomNode />}
            link={<CustomLink />}
          >
            <Tooltip
              formatter={(value: number) => {
                const share = value;
                const people = population * share;
                return [
                  `${fmtPeople(people)} women (${(share * 100).toFixed(2)}%)`,
                  "Flow",
                ];
              }}
            />
          </Sankey>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
