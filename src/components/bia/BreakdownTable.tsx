import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ARM_LABELS, fmtInt, fmtPct, type CurrencyFormatters } from "@/lib/bia/format";
import type { BiaResult } from "@/lib/bia/types";

interface Props {
  result: BiaResult;
  currency: CurrencyFormatters;
}

export function BreakdownTable({ result, currency }: Props) {
  const { fmtCurrency, unit, rate } = currency;

  const totals = result.breakdown.reduce(
    (acc, b) => {
      acc.cost0 += b.cost0;
      acc.cost1 += b.cost1;
      acc.deltaCost += b.deltaCost;
      acc.patientsShifted += b.patientsShifted;
      acc.cost1Comm += b.cost1Comm;
      acc.cost1NonComm += b.cost1NonComm;
      return acc;
    },
    { cost0: 0, cost1: 0, deltaCost: 0, patientsShifted: 0, cost1Comm: 0, cost1NonComm: 0 },
  );

  const exportCsv = () => {
    const header = [
      "Arm",
      "MS_0",
      "MS_1",
      "ΔMS",
      "Patients shifted",
      `Cost SQ (${unit})`,
      `Cost Int Comm (${unit})`,
      `Cost Int Non-Comm (${unit})`,
      `Cost Int Total (${unit})`,
      `ΔCost (${unit})`,
    ];
    const rows = result.breakdown.map((b) => [
      ARM_LABELS[b.arm],
      b.ms0.toFixed(4),
      b.ms1.toFixed(4),
      b.deltaMs.toFixed(4),
      Math.round(b.patientsShifted),
      Math.round(b.cost0 * rate),
      Math.round(b.cost1Comm * rate),
      Math.round(b.cost1NonComm * rate),
      Math.round(b.cost1 * rate),
      Math.round(b.deltaCost * rate),
    ]);
    rows.push([
      "Grand Total",
      "",
      "",
      "",
      Math.round(totals.patientsShifted).toString(),
      Math.round(totals.cost0 * rate).toString(),
      Math.round(totals.cost1Comm * rate).toString(),
      Math.round(totals.cost1NonComm * rate).toString(),
      Math.round(totals.cost1 * rate).toString(),
      Math.round(totals.deltaCost * rate).toString(),
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bia-breakdown.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Per-Arm Breakdown</CardTitle>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download /> Export CSV
        </Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[14%] text-left">Arm</TableHead>
              <TableHead className="w-[9%] text-right">MS₀</TableHead>
              <TableHead className="w-[9%] text-right">MS₁</TableHead>
              <TableHead className="w-[10%] text-right">ΔMS</TableHead>
              <TableHead className="w-[14%] text-right">Patients shifted</TableHead>
              <TableHead className="w-[14%] text-right">Cost SQ</TableHead>
              <TableHead className="w-[12%] text-right">Cost Int <span className="whitespace-nowrap">(Comm)</span></TableHead>
              <TableHead className="w-[14%] text-right">Cost Int <span className="whitespace-nowrap">(Non-Comm)</span></TableHead>
              <TableHead className="w-[12%] text-right">ΔCost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.breakdown.map((b) => (
              <TableRow key={b.arm}>
                <TableCell className="font-medium truncate">{ARM_LABELS[b.arm]}</TableCell>
                <TableCell className="text-right font-mono text-xs">{fmtPct(b.ms0)}</TableCell>
                <TableCell className="text-right font-mono text-xs">{fmtPct(b.ms1)}</TableCell>
                <TableCell
                  className={`text-right font-mono text-xs ${
                    b.deltaMs > 0 ? "text-emerald-600" : b.deltaMs < 0 ? "text-amber-600" : ""
                  }`}
                >
                  {b.deltaMs >= 0 ? "+" : ""}
                  {fmtPct(b.deltaMs)}
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {fmtInt(b.patientsShifted)}
                </TableCell>
                <TableCell className="text-right font-mono text-xs">{fmtCurrency(b.cost0)}</TableCell>
                <TableCell className="text-right font-mono text-xs">{fmtCurrency(b.cost1Comm)}</TableCell>
                <TableCell className="text-right font-mono text-xs">{fmtCurrency(b.cost1NonComm)}</TableCell>
                <TableCell
                  className={`text-right font-mono text-xs ${
                    b.deltaCost > 0 ? "text-rose-600" : b.deltaCost < 0 ? "text-emerald-600" : ""
                  }`}
                >
                  {fmtCurrency(b.deltaCost)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/50 border-t-2 font-semibold">
              <TableCell>Grand Total</TableCell>
              <TableCell className="text-right text-muted-foreground">—</TableCell>
              <TableCell className="text-right text-muted-foreground">—</TableCell>
              <TableCell className="text-right text-muted-foreground">—</TableCell>
              <TableCell className="text-right font-mono text-xs">
                {fmtInt(totals.patientsShifted)}
              </TableCell>
              <TableCell className="text-right font-mono text-xs">
                {fmtCurrency(totals.cost0)}
              </TableCell>
              <TableCell className="text-right font-mono text-xs">
                {fmtCurrency(totals.cost1Comm)}
              </TableCell>
              <TableCell className="text-right font-mono text-xs">
                {fmtCurrency(totals.cost1NonComm)}
              </TableCell>
              <TableCell
                className={`text-right font-mono text-xs ${
                  totals.deltaCost > 0
                    ? "text-rose-600"
                    : totals.deltaCost < 0
                      ? "text-emerald-600"
                      : ""
                }`}
              >
                {fmtCurrency(totals.deltaCost)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <div className="mt-3 text-[10px] text-muted-foreground/80 leading-relaxed">
          <span className="font-semibold">Legend:</span>{" "}
          MS = market share; SQ = Status Quo (baseline); Int = Intervention; Comm = commodity cost; Non-Comm = service/non-commodity cost; Δ = change (Int − SQ). Values are 5-year totals.
        </div>
      </CardContent>
    </Card>
  );
}
