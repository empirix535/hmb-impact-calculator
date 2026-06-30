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
      acc.cost0Comm += b.cost0Comm;
      acc.cost0NonComm += b.cost0NonComm;
      acc.cost1Comm += b.cost1Comm;
      acc.cost1NonComm += b.cost1NonComm;
      return acc;
    },
    { cost0: 0, cost1: 0, deltaCost: 0, patientsShifted: 0, cost0Comm: 0, cost0NonComm: 0, cost1Comm: 0, cost1NonComm: 0 },
  );

  const exportCsv = () => {
    const header = [
      "Arm",
      "MS_0",
      "MS_1",
      "ΔMS",
      "Patients shifted",
      `Cost SQ (${unit})`,
      `Cost Int (${unit})`,
      `ΔCost (${unit})`,
    ];
    const rows = result.breakdown.map((b) => [
      ARM_LABELS[b.arm],
      b.ms0.toFixed(4),
      b.ms1.toFixed(4),
      b.deltaMs.toFixed(4),
      Math.round(b.patientsShifted),
      Math.round(b.cost0 * rate),
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Arm</TableHead>
              <TableHead className="text-right">MS₀</TableHead>
              <TableHead className="text-right">MS₁</TableHead>
              <TableHead className="text-right">ΔMS</TableHead>
              <TableHead className="text-right">Patients shifted</TableHead>
              <TableHead className="text-right">Cost SQ</TableHead>
              <TableHead className="text-right">Cost Int</TableHead>
              <TableHead className="text-right">ΔCost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.breakdown.map((b) => (
              <TableRow key={b.arm}>
                <TableCell className="font-medium">{ARM_LABELS[b.arm]}</TableCell>
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
                <TableCell className="text-right font-mono text-xs">{fmtCurrency(b.cost1)}</TableCell>
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
                {fmtCurrency(totals.cost1)}
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
      </CardContent>
    </Card>
  );
}
