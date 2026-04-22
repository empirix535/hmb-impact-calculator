import { AlertTriangle, Info, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { COUNTRIES } from "@/lib/bia/countries";
import { ARM_LABELS, fmtInt, fmtPct } from "@/lib/bia/format";
import { normalizeDeltas } from "@/lib/bia/engine";
import type { useBiaModel } from "@/hooks/useBiaModel";
import type { AltArm, ArmValues, MarketShares } from "@/lib/bia/types";

type Model = ReturnType<typeof useBiaModel>;

interface Props {
  model: Model;
}

const ALT_ARMS: AltArm[] = ["ns", "surgical", "untreated"];
const ALL_ARMS: (keyof MarketShares)[] = ["hIud", "ns", "surgical", "untreated"];

export function ControlCenter({ model }: Props) {
  const { inputs, result, isCustom, countryKey } = model;
  const population = Math.round(inputs.wcba * inputs.hmbPrevalence);
  const msSum =
    inputs.marketShares0.hIud +
    inputs.marketShares0.ns +
    inputs.marketShares0.surgical +
    inputs.marketShares0.untreated;
  const msSumOk = Math.abs(msSum - 1) < 0.005;
  const deltasN = normalizeDeltas(inputs.deltas);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-4">
        {/* Country */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Country</CardTitle>
              {isCustom ? (
                <Badge variant="secondary">Custom</Badge>
              ) : (
                <Badge variant="outline">Preset</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={countryKey} onValueChange={model.selectCountry}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(COUNTRIES).map(([key, c]) => (
                  <SelectItem key={key} value={key}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" className="w-full" onClick={model.reset}>
              <RotateCcw /> Reset to country defaults
            </Button>
          </CardContent>
        </Card>

        {/* Population */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Eligible HMB Population</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Women of child-bearing age (WCBA)</Label>
              <Input
                type="number"
                value={inputs.wcba}
                onChange={(e) => model.setWcba(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">HMB prevalence rate</Label>
                <span className="text-xs font-mono">{fmtPct(inputs.hmbPrevalence, 1)}</span>
              </div>
              <Slider
                value={[inputs.hmbPrevalence * 100]}
                min={0}
                max={60}
                step={0.5}
                onValueChange={([v]) => model.setHmbPrevalence(v / 100)}
              />
            </div>
            <div className="rounded-md border bg-muted/40 px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent>P = WCBA × HMB prevalence</TooltipContent>
                </Tooltip>
                Eligible population (P)
              </span>
              <span className="text-sm font-semibold">{fmtInt(population)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Intervention coverage */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Intervention Coverage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!result.shift.feasible && (
              <Alert className="border-amber-500/50 bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs">
                  Target H-IUD share exceeds available baseline. Maximum achievable:{" "}
                  <strong>{fmtPct(result.shift.achievableHIud)}</strong>.
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-2 h-6 text-xs"
                    onClick={model.snapHIudToMax}
                  >
                    Snap to max
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Target H-IUD market share (MS_H,1)</Label>
                <span className="text-xs font-mono">{fmtPct(inputs.targetHIud)}</span>
              </div>
              <Slider
                value={[inputs.targetHIud * 100]}
                min={0}
                max={100}
                step={0.5}
                onValueChange={([v]) => model.setTargetHIud(v / 100)}
              />
              <div className="text-[11px] text-muted-foreground">
                Baseline: {fmtPct(inputs.marketShares0.hIud)} → ΔMS_H ={" "}
                {fmtPct(inputs.targetHIud - inputs.marketShares0.hIud)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cannibalization weights */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Cannibalization Weights (δ)</CardTitle>
              <Badge variant="outline" className="font-mono text-[10px]">
                Σδ = 100%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {ALT_ARMS.map((arm) => {
              const clamped = result.shift.clampedArms.includes(arm);
              return (
                <div key={arm} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs flex items-center gap-1.5">
                      δ {ARM_LABELS[arm]}
                      {clamped && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[220px]">
                            This arm reached 0% — its remaining share was re-allocated to the other
                            treatment arms based on their weights.
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </Label>
                    <span className="text-xs font-mono">{fmtPct(deltasN[arm])}</span>
                  </div>
                  <Slider
                    value={[deltasN[arm] * 100]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([v]) => model.setDelta(arm, v / 100)}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Status quo market shares */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Status Quo Market Shares</CardTitle>
              <Badge variant={msSumOk ? "outline" : "destructive"} className="font-mono text-[10px]">
                Σ = {fmtPct(msSum, 1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {ALL_ARMS.map((arm) => (
              <div key={arm} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{ARM_LABELS[arm]}</Label>
                  <span className="text-xs font-mono">
                    {fmtPct(inputs.marketShares0[arm])}
                  </span>
                </div>
                <Slider
                  value={[inputs.marketShares0[arm] * 100]}
                  min={0}
                  max={100}
                  step={0.5}
                  onValueChange={([v]) => model.setMarketShare0(arm, v / 100)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Advanced */}
        <Card>
          <CardContent className="pt-4">
            <Accordion type="single" collapsible>
              <AccordionItem value="adv" className="border-0">
                <AccordionTrigger className="text-sm font-semibold py-2">
                  Advanced — Costs, Effectiveness & Anemia
                </AccordionTrigger>
                <AccordionContent className="space-y-5 pt-3">
                  <ParamGroup
                    label="5-yr cost per patient ($)"
                    values={inputs.costs}
                    onChange={model.setCost}
                    type="number"
                  />
                  <ParamGroup
                    label="Effectiveness (HMB resolved)"
                    values={inputs.effectiveness}
                    onChange={model.setEffectiveness}
                    type="pct"
                  />
                  <ParamGroup
                    label="Anemia prevalence"
                    values={inputs.anemia}
                    onChange={model.setAnemia}
                    type="pct"
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

interface ParamGroupProps {
  label: string;
  values: ArmValues;
  onChange: (arm: keyof ArmValues, v: number) => void;
  type: "number" | "pct";
}

function ParamGroup({ label, values, onChange, type }: ParamGroupProps) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-muted-foreground">{label}</div>
      <div className="grid grid-cols-2 gap-2">
        {(["hIud", "ns", "surgical", "untreated"] as const).map((arm) => (
          <div key={arm} className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">{ARM_LABELS[arm]}</Label>
            <Input
              type="number"
              step={type === "pct" ? 0.01 : 50}
              value={type === "pct" ? values[arm] : values[arm]}
              onChange={(e) => onChange(arm, Number(e.target.value))}
              className="h-8 text-xs"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
