import { ToolError, defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { countryInputs, resolveCountryKey } from "../model";

export default defineTool({
  name: "get_country_inputs",
  title: "Get country model inputs",
  description:
    "Return the full model input set for one country: baseline market shares, per-patient costs (total, commodity, non-commodity), effectiveness, anemia rates, and DALYs per patient by treatment arm.",
  inputSchema: {
    country: z
      .string()
      .describe('Country key or name, e.g. "KE" or "Kenya". Use list_countries to see options.'),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ country }) => {
    let key: string;
    try {
      key = resolveCountryKey(country);
    } catch (error) {
      throw new ToolError((error as Error).message);
    }
    const inputs = countryInputs(key);
    return {
      content: [{ type: "text", text: JSON.stringify(inputs, null, 2) }],
      structuredContent: { inputs },
    };
  },
});
