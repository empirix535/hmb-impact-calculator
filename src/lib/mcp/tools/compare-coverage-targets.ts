import { ToolError, defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { runScenario } from "../model";

export default defineTool({
  name: "compare_coverage_targets",
  title: "Compare H-IUD coverage targets",
  description:
    "Run the budget impact model across several H-IUD coverage targets for one country and return a compact comparison of budget impact, DALYs averted, and HMB cases resolved for each.",
  inputSchema: {
    country: z.string().describe('Country key or name, e.g. "KE" or "Kenya".'),
    targets: z
      .array(z.number())
      .describe("H-IUD coverage targets as fractions 0-1, e.g. [0.1, 0.25, 0.5]. Max 10 values."),
    currency: z.enum(["LCU", "USD"]).optional().describe('"LCU" (default) or "USD".'),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ country, targets, currency }) => {
    if (targets.length === 0) throw new ToolError("Provide at least one coverage target.");
    const capped = targets.slice(0, 10);
    try {
      const rows = capped.map((targetHIud) => {
        const r = runScenario({ country, targetHIud, currency });
        return {
          targetHIud,
          achievedHIudShare: r.scenario.achievedHIudShare,
          budgetImpact: r.budget.budgetImpact,
          budgetImpactPct: r.budget.budgetImpactPct,
          dalysAverted: r.clinical.dalysAverted,
          hmbCasesResolved: r.clinical.hmbCasesResolved,
          anemiaCasesAvoided: r.clinical.anemiaCasesAvoided,
        };
      });
      const out = { country, currency: currency ?? "LCU", rows };
      return {
        content: [{ type: "text", text: JSON.stringify(out, null, 2) }],
        structuredContent: out,
      };
    } catch (error) {
      throw new ToolError((error as Error).message);
    }
  },
});
