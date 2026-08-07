import { defineTool } from "@lovable.dev/mcp-js";
import { countryInputs, countryKeys } from "../model";

export default defineTool({
  name: "list_countries",
  title: "List countries",
  description:
    "List every country available in the H-IUD budget impact model, with its currency, women of childbearing age, and HMB prevalence.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const rows = countryKeys().map((key) => {
      const c = countryInputs(key);
      return {
        key: c.key,
        name: c.name,
        currencyCode: c.currencyCode,
        wcba: c.wcba,
        hmbPrevalence: c.hmbPrevalence,
      };
    });
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { countries: rows },
    };
  },
});
