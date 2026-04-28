import { useState, type MouseEvent as ReactMouseEvent } from "react";
import { createPortal } from "react-dom";
import { Layer, Rectangle, ResponsiveContainer, Sankey } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BiaResult } from "@/lib/bia/types";
import type { AltWeights } from "@/lib/bia/types";

interface Props {
  result: BiaResult;
  deltas: AltWeights;
}

type SankeyLinkPayload = {
  key: string;
  source: { name: string };
  target: { name: string };
  value: number;
  actualValue: number;
  baselineShare: number;
  interventionShare: number;
};

type ActiveLink = {
  key: string;
  x: number;
  y: number;
  payload: SankeyLinkPayload;
};

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
    activeLinkKey,
    hasActiveLink,
    onLinkEnter,
    onLinkMove,
    onLinkLeave,
    ...rest
  } = props;
  const linkPayload = payload as SankeyLinkPayload;
  const isActive = activeLinkKey === linkPayload.key;
  const isVisible = linkPayload.actualValue > 0;
  const opacity = !isVisible ? 0 : isActive ? 0.8 : hasActiveLink ? 0.2 : 0.35;
  const path = `
    M${sourceX},${sourceY}
    C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
  `;
  return (
    <Layer key={`link-${index}`} {...rest}>
      {isActive ? (
        <path
          d={path}
          fill="none"
          stroke="var(--background)"
          strokeOpacity={0.95}
          strokeWidth={Math.max(linkWidth + 4, 5)}
          style={{ pointerEvents: "none" }}
        />
      ) : null}
      <path
        d={path}
        fill="none"
        stroke={isActive ? "var(--primary)" : "var(--muted-foreground)"}
        strokeOpacity={opacity}
        strokeWidth={linkWidth}
        style={{ pointerEvents: "none", transition: "stroke-opacity 120ms ease" }}
      />
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={isVisible ? Math.max(linkWidth, 12) : 0}
        style={{ pointerEvents: isVisible ? "stroke" : "none", cursor: "pointer" }}
        onMouseEnter={(event: ReactMouseEvent<SVGPathElement>) => onLinkEnter(linkPayload, event)}
        onMouseMove={(event: ReactMouseEvent<SVGPathElement>) => onLinkMove(linkPayload, event)}
        onMouseLeave={onLinkLeave}
      />
    </Layer>
  );
}

function PortalTooltip({ activeLink, population }: { activeLink: ActiveLink; population: number }) {
  if (typeof document === "undefined") return null;

  const link = activeLink.payload;
  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);

  const baselinePop = link.baselineShare * population;
  const interventionPop = link.interventionShare * population;
  const delta = interventionPop - baselinePop;
  const deltaSign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  const deltaColor =
    delta > 0 ? "text-emerald-500" : delta < 0 ? "text-red-500" : "text-muted-foreground";

  return createPortal(
    <div
      className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg"
      style={{
        position: "fixed",
        left: activeLink.x + 14,
        top: activeLink.y + 14,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      <div className="font-medium mb-1">
        {link.source.name} → {link.target.name}
      </div>
      <div className="text-muted-foreground">Baseline: {fmt(baselinePop)}</div>
      <div className="text-muted-foreground">Intervention: {fmt(interventionPop)}</div>
      <div className={`font-medium ${deltaColor}`}>
        Δ: {deltaSign}{fmt(Math.abs(delta))}
      </div>
    </div>,
    document.body,
  );
}

export function SankeyChart({ result }: Props) {
  const [activeLink, setActiveLink] = useState<ActiveLink | null>(null);
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
      { key: "h-iud-to-h-iud", source: 0, target: 4, value: safe(baselineH), actualValue: baselineH },
      { key: "surgical-to-h-iud", source: 1, target: 4, value: safe(pullS), actualValue: pullS },
      { key: "surgical-to-remaining", source: 1, target: 5, value: safe(remainS), actualValue: remainS },
      { key: "ns-to-h-iud", source: 2, target: 4, value: safe(pullNS), actualValue: pullNS },
      { key: "ns-to-remaining", source: 2, target: 6, value: safe(remainNS), actualValue: remainNS },
      { key: "untreated-to-h-iud", source: 3, target: 4, value: safe(pullU), actualValue: pullU },
      { key: "untreated-to-remaining", source: 3, target: 7, value: safe(remainU), actualValue: remainU },
    ],
  };

  const handleLinkEnter = (payload: SankeyLinkPayload, event: ReactMouseEvent<SVGPathElement>) => {
    console.debug("Sankey link hover payload", {
      label: `${payload.source.name} → ${payload.target.name}`,
      deltaPopulation: new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
        payload.actualValue * population,
      ),
      percentage: `${(payload.actualValue * 100).toFixed(2)}%`,
      payload,
    });
    setActiveLink({ key: payload.key, x: event.clientX, y: event.clientY, payload });
  };

  const handleLinkMove = (payload: SankeyLinkPayload, event: ReactMouseEvent<SVGPathElement>) => {
    setActiveLink({ key: payload.key, x: event.clientX, y: event.clientY, payload });
  };

  return (
    <Card className="overflow-visible">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Patient Migration</CardTitle>
      </CardHeader>
      <CardContent className="h-96 overflow-visible">
        <div className="flex h-full flex-col overflow-visible">
          <div className="min-h-0 flex-1 overflow-visible">
            <ResponsiveContainer width="100%" height="100%" className="overflow-visible">
              <Sankey
                className="patient-migration-sankey"
                data={data}
                nodePadding={28}
                nodeWidth={14}
                iterations={0}
                margin={{ top: 10, right: 160, bottom: 10, left: 140 }}
                style={{ overflow: "visible" }}
                node={<CustomNode />}
                link={
                  <CustomLink
                    activeLinkKey={activeLink?.key}
                    hasActiveLink={Boolean(activeLink)}
                    onLinkEnter={handleLinkEnter}
                    onLinkMove={handleLinkMove}
                    onLinkLeave={() => setActiveLink(null)}
                  />
                }
                overflow="visible"
              />
            </ResponsiveContainer>
            {activeLink ? <PortalTooltip activeLink={activeLink} population={population} /> : null}
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
