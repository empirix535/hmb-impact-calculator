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
import type { useBiaModel } from "@/hooks/useBiaModel";
import type { AltArm, ArmValues, MarketShares } from "@/lib/bia/types";

type Model = ReturnType<typeof useBiaModel>;

interface Props {
  model: Model;
}

const ALL_ARMS: (keyof MarketShares)[] = ["hIud", "ns", "surgical", "untreated"];

export function ControlCenter({ model }: Props) {
  const { inputs, isCustom, countryKey } = model;
  const population = Math.round(inputs.wcba * inputs.hmbPrevalence);
  const ms0Sum =
    inputs.marketShares0.hIud +
    inputs.marketShares0.ns +
    inputs.marketShares0.surgical +
    inputs.marketShares0.untreated;
  const ms1Sum =
    inputs.marketShares1.hIud +
    inputs.marketShares1.ns +
    inputs.marketShares1.surgical +
    inputs.marketShares1.untreated;
  const ms1SumOk = Math.abs(ms1Sum - 1) < 0.005;

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
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Display currency</Label>
              <div className="grid grid-cols-2 gap-1 rounded-md border p-1">
                <Button
                  type="button"
                  size="sm"
                  variant={model.currency.mode === "LCU" ? "default" : "ghost"}
                  className="h-7 text-xs"
                  onClick={() => model.setCurrencyMode("LCU")}
                >
                  {COUNTRIES[countryKey].currencyCode}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={model.currency.mode === "USD" ? "default" : "ghost"}
                  className="h-7 text-xs"
                  onClick={() => model.setCurrencyMode("USD")}
                >
                  USD
                </Button>
              </div>
            </div>
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
                type="text"
                readOnly
                tabIndex={-1}
                value={inputs.wcba.toLocaleString("en-US")}
                className="bg-muted/50 cursor-not-allowed"
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

        {/* Status quo market shares — read-only model assumption */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Status Quo Market Shares</CardTitle>
              <Badge variant="outline" className="font-mono text-[10px]">
                Σ = {fmtPct(ms0Sum, 1)}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground pt-1">
              Model input assumption — sourced from country baseline data.
            </p>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {ALL_ARMS.map((arm) => (
              <div key={arm} className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">{ARM_LABELS[arm]}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={(inputs.marketShares0[arm] * 100).toFixed(2)}
                    onChange={(e) => {
                      const n = parseFloat(e.target.value);
                      if (!Number.isFinite(n)) return;
                      model.setMarketShare0(arm, n / 100);
                    }}
                    className="h-8 text-xs font-mono pr-6"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
                    %
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Market shares after intervention — user-controlled, sum to 100% */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Market Shares After Intervention
              </CardTitle>
              <Badge
                variant={ms1SumOk ? "outline" : "destructive"}
                className="font-mono text-[10px]"
              >
                Σ = {fmtPct(ms1Sum, 1)}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground pt-1">
              Adjust H-IUD coverage — NS, Surgical, and Untreated react automatically based on
              the cannibalization weights below.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {!ms1SumOk && (
              <Alert className="border-amber-500/50 bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs">
                  Market shares must sum to exactly 100%.
                </AlertDescription>
              </Alert>
            )}
            {ALL_ARMS.map((arm) => {
              const v0 = inputs.marketShares0[arm];
              const v1 = inputs.marketShares1[arm];
              const dv = v1 - v0;
              const isHIud = arm === "hIud";
              return (
                <div key={arm} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className={`text-xs ${!isHIud ? "text-muted-foreground" : ""}`}>
                      {ARM_LABELS[arm]}
                      {!isHIud && (
                        <span className="ml-1 text-[10px] font-normal">(derived)</span>
                      )}
                    </Label>
                    <span className="text-xs font-mono">{fmtPct(v1, 1)}</span>
                  </div>
                  <Slider
                    value={[v1 * 100]}
                    min={0}
                    max={100}
                    step={0.5}
                    disabled={!isHIud}
                    onValueChange={isHIud ? ([v]) => model.setMarketShare1(arm, v / 100) : undefined}
                    className={!isHIud ? "opacity-60 pointer-events-none" : ""}
                  />
                  <div className="text-[10px] text-muted-foreground font-mono">
                    Baseline {fmtPct(v0, 1)} · Δ {dv >= 0 ? "+" : ""}
                    {fmtPct(dv, 1)}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Cannibalization weights — drives how H-IUD gains are taken from NS/S/U */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Cannibalization Weights</CardTitle>
              <Badge variant="outline" className="font-mono text-[10px]">
                Σ ={" "}
                {fmtPct(model.deltas.ns + model.deltas.surgical + model.deltas.untreated, 1)}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground pt-1">
              When you adjust the H-IUD share, the gain (or loss) is redistributed across NS,
              Surgical, and Untreated in proportion to these weights. Σ across NS + S + U = 100%.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {(["ns", "surgical", "untreated"] as AltArm[]).map((arm) => (
              <div key={arm} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{ARM_LABELS[arm]}</Label>
                  <span className="text-xs font-mono">{fmtPct(model.deltas[arm], 1)}</span>
                </div>
                <Slider
                  value={[model.deltas[arm] * 100]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={([v]) => model.setDelta(arm, v / 100)}
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
                  Advanced — Costs, Effectiveness & Anemia (read-only)
                </AccordionTrigger>
                <AccordionContent className="space-y-5 pt-3">
                  <p className="text-[11px] text-muted-foreground">
                    These parameters are fixed scalars sourced from clinical evidence and
                    Kenya-specific cost data. They are not user-editable.
                  </p>
                  <ParamGroup
                    label={`5-yr cost per patient (${model.currency.label})`}
                    values={inputs.costs}
                    type="currency"
                    rate={model.currency.rate}
                  />
                  <ParamGroup
                    label="Effectiveness (HMB resolved)"
                    values={inputs.effectiveness}
                    type="pct"
                  />
                  <ParamGroup label="Anemia prevalence" values={inputs.anemia} type="pct" />
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
  type: "number" | "pct" | "currency";
  rate?: number;
}

function ParamGroup({ label, values, type, rate = 1 }: ParamGroupProps) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-muted-foreground">{label}</div>
      <div className="grid grid-cols-2 gap-2">
        {(["hIud", "ns", "surgical", "untreated"] as const).map((arm) => {
          let display: string;
          if (type === "pct") {
            display = `${(values[arm] * 100).toFixed(2)}%`;
          } else if (type === "currency") {
            const conv = values[arm] * rate;
            display =
              conv >= 100
                ? Math.round(conv).toLocaleString("en-US")
                : conv.toLocaleString("en-US", { maximumFractionDigits: 2 });
          } else {
            display = values[arm].toLocaleString("en-US");
          }
          return (
            <div key={arm} className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">{ARM_LABELS[arm]}</Label>
              <Input
                type="text"
                readOnly
                tabIndex={-1}
                value={display}
                className="h-8 text-xs bg-muted/50 cursor-not-allowed"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
