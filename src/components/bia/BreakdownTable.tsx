import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      "Status",
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
      b.status,
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
              <TableHead>Status</TableHead>
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
                <TableCell>
                  {b.status === "—" ? (
                    <span className="text-muted-foreground text-xs">—</span>
                  ) : b.status === "Clamped to 0%" ? (
                    <Badge variant="outline" className="border-amber-500/60 text-amber-700 text-[10px]">
                      Clamped to 0%
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">
                      Re-allocated
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
