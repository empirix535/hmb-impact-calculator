import { ToolError, defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { runScenario } from "../model";

export default defineTool({
  name: "run_budget_impact",
  title: "Run budget impact scenario",
  description:
    "Run the 5-year budget impact analysis for a country at a given H-IUD coverage target. Returns population, market shares before/after, total and per-patient costs, budget impact, DALYs averted, HMB cases resolved, anemia cases avoided, and a per-arm breakdown.",
  inputSchema: {
    country: z.string().describe('Country key or name, e.g. "KE" or "Kenya".'),
    targetHIud: z
      .number()
      .describe("Target H-IUD market share after intervention, as a fraction 0-1 (e.g. 0.25)."),
    hmbPrevalence: z
      .number()
      .optional()
      .describe("Override HMB prevalence as a fraction 0-1. Defaults to the country value."),
    deltaNs: z
      .number()
      .optional()
      .describe("Cannibalization weight for non-surgical patients (relative, default 0.15)."),
    deltaSurgical: z
      .number()
      .optional()
      .describe("Cannibalization weight for surgical patients (relative, default 0.05)."),
    deltaUntreated: z
      .number()
      .optional()
      .describe("Cannibalization weight for untreated patients (relative, default 0.8)."),
    currency: z
      .enum(["LCU", "USD"])
      .optional()
      .describe('Money unit: "LCU" local currency (default) or "USD" 2025 constant.'),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: (input) => {
    try {
      const result = runScenario(input);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      };
    } catch (error) {
      throw new ToolError((error as Error).message);
    }
  },
});
